// CA Prep Pro – zero-dependency Node.js server (Node 18+). Persistence: data/db.json
const http = require('http'), fs = require('fs'), path = require('path'), crypto = require('crypto');
const syl = require('./syllabus'), { generate, setLabel } = require('./generator'), { page } = require('./render');
try { fs.readFileSync(path.join(__dirname, '.env'), 'utf8').split(/\r?\n/).forEach(l => { const m = l.match(/^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, ''); }); } catch {}
const PORT = process.env.PORT || 3000, DB = path.join(process.env.DATA_DIR || path.join(__dirname, 'data'), 'db.json');
fs.mkdirSync(path.dirname(DB), { recursive: true });
let db = { papers: [], attempts: [] };
try { db = JSON.parse(fs.readFileSync(DB, 'utf8')); } catch {}
const save = () => { fs.writeFileSync(DB + '.tmp', JSON.stringify(db)); fs.renameSync(DB + '.tmp', DB); };
const uid = () => crypto.randomBytes(5).toString('hex');
const send = (res, code, body, type = 'application/json') => { res.writeHead(code, { 'Content-Type': type + '; charset=utf-8' }); res.end(typeof body === 'string' ? body : JSON.stringify(body)); };
const light = p => ({ ...p, questions: undefined, count: p.questions.length });
const body = req => new Promise(r => { let d = ''; req.on('data', c => { d += c; if (d.length > 2e6) req.destroy(); }); req.on('end', () => { try { r(JSON.parse(d || '{}')); } catch { r({}); } }); });
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml' };

http.createServer(async (req, res) => {
  const u = new URL(req.url, 'http://x'), p = u.pathname;
  try {
    if (p === '/api/meta') return send(res, 200, syl);
    if (p === '/api/generate' && req.method === 'POST') {
      const o = await body(req); const groupId = o.groupId || uid();
      const existing = db.papers.filter(x => x.groupId === groupId);
      const exclude = new Set(); existing.forEach(x => x.questions.forEach(q => exclude.add(q.text)));
      const { sets, warnings } = generate({ ...o, excludeTexts: exclude });
      const papers = sets.map((s, i) => {
        const idx = existing.length + i, mk = Number(o.marks) || 20;
        return { id: uid(), groupId, set: setLabel(idx), title: `Business Economics – ${mk} Marks – Set ${setLabel(idx)}`, subject: 'economics', marks: mk, difficulty: o.difficulty || 'Mixed',
          chapters: [...new Set(s.questions.map(q => q.chapter))], duration: Math.round(mk * syl.minutesPerMark), negative: syl.negativeMarking, kind: o.kind || 'generated', created: new Date().toISOString(), origin: 'AI-generated original practice paper (not official ICAI)', questions: s.questions };
      });
      existing.push(...papers); db.papers.push(...papers); save();
      return send(res, 200, { groupId, papers, warnings });
    }
    if (p === '/api/papers' && req.method === 'GET') return send(res, 200, db.papers.map(light).reverse());
    let m;
    if ((m = p.match(/^\/api\/papers\/(\w+)$/))) {
      const i = db.papers.findIndex(x => x.id === m[1]);
      if (req.method === 'DELETE') { if (i >= 0) { db.papers.splice(i, 1); save(); } return send(res, 200, { ok: true }); }
      return i < 0 ? send(res, 404, { error: 'not found' }) : send(res, 200, db.papers[i]);
    }
    if (p === '/api/attempts' && req.method === 'POST') { const a = await body(req); a.id = uid(); a.date = new Date().toISOString(); db.attempts.push(a); save(); return send(res, 200, a); }
    if (p === '/api/attempts' && req.method === 'GET') return send(res, 200, db.attempts);
    if (p === '/api/attempts' && req.method === 'DELETE') { db.attempts = []; save(); return send(res, 200, { ok: true }); }
    if (p === '/api/ai-check' && req.method === 'POST') {
      const key = process.env.ANTHROPIC_API_KEY;
      if (!key) return send(res, 200, { error: 'no_key', message: 'AI checker is not set up. Create a file named .env in the project folder containing: ANTHROPIC_API_KEY=your-key  (then restart the server). See README.' });
      const { attemptId } = await body(req); const a = db.attempts.find(x => x.id === attemptId), paper = a && db.papers.find(x => x.id === a.paperId);
      if (!a || !paper) return send(res, 404, { error: 'not_found', message: 'Attempt not found.' });
      const L = ['A', 'B', 'C', 'D'];
      const items = paper.questions.map((q, i) => ({ q, i, u: a.answers[i] })).filter(x => x.u !== x.q.answer).slice(0, 15).map(({ q, i, u }) => ({ no: q.no, unit: q.chapterName, question: q.text, options: q.options.map((o, k) => L[k] + '. ' + o), key_answer: L[q.answer], student_answer: u === null || u === undefined ? 'not attempted' : L[u], key_explanation: q.explanation }));
      if (!items.length) return send(res, 200, { results: [], note: 'No wrong or skipped questions – nothing to check.' });
      const prompt = `You are a CA Foundation Business Economics tutor. For each question below the student answered wrongly or skipped. 1) Independently decide the correct option. 2) Say whether you agree with the answer key. 3) Explain in 2-4 simple sentences why the student's choice is wrong (or how to approach it if skipped) and give one short study tip. Show brief working for numerical questions. Reply with ONLY a JSON array: [{"no":number,"agrees_with_key":true|false,"your_answer":"A-D","explanation":"...","tip":"..."}]\n\n` + JSON.stringify(items);
      try {
        const r = await fetch((process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com') + '/v1/messages', { method: 'POST', headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' }, body: JSON.stringify({ model: process.env.AI_MODEL || 'claude-sonnet-5-5', max_tokens: 4000, messages: [{ role: 'user', content: prompt }] }) });
        const j = await r.json(); if (!r.ok) return send(res, 200, { error: 'api', message: (j.error && j.error.message) || 'AI request failed.' });
        const txt = (j.content || []).map(c => c.text || '').join(''); const m2 = txt.match(/\[[\s\S]*\]/);
        return send(res, 200, { results: m2 ? JSON.parse(m2[0]) : [], truncated: paper.questions.filter((q, i) => a.answers[i] !== q.answer).length > 15 });
      } catch (e) { return send(res, 200, { error: 'api', message: 'Could not reach or parse the AI response: ' + e.message }); }
    }
    if ((m = p.match(/^\/print\/(\w+)$/))) {
      const paper = db.papers.find(x => x.id === m[1]); if (!paper) return send(res, 404, 'Not found', 'text/plain');
      return send(res, 200, page(paper, (u.searchParams.get('mode') || 'paper').replace(' ', '+'), u.searchParams.get('auto') === '1'), 'text/html');
    }
    // static
    let f = p === '/' ? '/index.html' : p; f = path.normalize(f).replace(/^(\.\.[\/\\])+/, '');
    const fp = path.join(__dirname, 'public', f);
    if (!fp.startsWith(path.join(__dirname, 'public')) || !fs.existsSync(fp) || fs.statSync(fp).isDirectory()) return send(res, 404, 'Not found', 'text/plain');
    res.writeHead(200, { 'Content-Type': (MIME[path.extname(fp)] || 'application/octet-stream') + '; charset=utf-8' }); fs.createReadStream(fp).pipe(res);
  } catch (e) { console.error(e); send(res, 500, { error: 'server error' }); }
}).listen(PORT, () => console.log(`CA Prep Pro running on http://localhost:${PORT}`));
