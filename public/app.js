/* CA Prep Pro – single-page app (vanilla JS, hash routing). */
const $ = s => document.querySelector(s), app = $('#app');
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const L = ['A', 'B', 'C', 'D'];
const api = (u, o) => fetch(u, o && { method: o.method || 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(o.body || {}) }).then(r => r.json());
let META, T = null, timer = null;
const PAGES = [['', '🏠', 'Home Dashboard'], ['subject', '📚', 'Select Subject'], ['generate', '⚙️', 'Question Paper Generator'], ['sets', '🗂️', 'All Question Paper Sets'], ['chapters', '📖', 'Chapter-wise Practice'], ['mock', '⏱️', 'Mock Test'], ['progress', '📈', 'Student Progress']];
const eco = () => META.subjects.find(s => s.id === 'economics');
const chName = id => eco().chapters.find(c => c.id === id).name;
const fmtDate = d => new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
const printUrl = (id, mode, auto) => `/print/${id}?mode=${mode}${auto ? '&auto=1' : ''}`;

function nav(cur) {
  $('#nav').innerHTML = PAGES.map(([h, i, t]) => `<a href="#/${h}" class="${cur === h ? 'on' : ''}">${i} ${t}</a>`).join('') +
    `<div style="margin:12px 12px 4px;font-size:11px;color:#8ea0c2">PAPER VIEWS</div><div style="padding:0 12px;font-size:12px;color:#9fb0cf">Attempt, Answer Key and Detailed Solutions open from <a href="#/sets" style="color:#f3e3bb">All Sets</a>.</div>`;
  $('#side').classList.remove('open');
}
const crumbs = { '': 'Home Dashboard', subject: 'Select Subject', generate: 'Question Paper Generator', sets: 'All Question Paper Sets', attempt: 'Attempt Test', key: 'Answer Key', solutions: 'Detailed Solutions', chapters: 'Chapter-wise Practice', mock: 'Mock Test', progress: 'Student Progress Dashboard', result: 'Result' };
$('#burger').onclick = () => $('#side').classList.toggle('open');

async function route() {
  clearInterval(timer);
  const [, a, b] = location.hash.replace('#', '').split('/');
  const page = a || '';
  nav(page); $('#crumb').textContent = crumbs[page] || ''; window.scrollTo(0, 0);
  try { const fn = { '': home, subject, generate, sets, attempt, key: keyPage, solutions, chapters, mock, progress, result }[page] || home; await fn(b); } catch (e) { app.innerHTML = `<div class="card">Something went wrong: ${esc(e.message)}</div>`; console.error(e); }
}
addEventListener('hashchange', route);

/* ---------- 1. Home ---------- */
async function home() {
  const [papers, att] = await Promise.all([api('/api/papers'), api('/api/attempts')]);
  const avg = att.length ? Math.round(att.reduce((s, a) => s + a.pct, 0) / att.length) : 0;
  app.innerHTML = `<div class="hero"><span class="pill gold">CA Foundation · January 2027</span><h1>Practice smarter with original Business Economics papers</h1>
<p>Generate multiple independent MCQ sets, attempt them in an exam-style interface with negative marking, and review step-by-step solutions mapped to ICAI units.</p>
<div class="row"><a class="btn gold" href="#/generate">Generate a paper</a><a class="btn ghost" href="#/mock" style="border-color:#fff;color:#fff;background:transparent">Take a mock test</a></div></div>
<div class="grid g4"><div class="card stat"><b>${papers.length}</b><span>Papers generated</span></div><div class="card stat"><b>${att.length}</b><span>Tests attempted</span></div><div class="card stat"><b>${avg}%</b><span>Average score</span></div><div class="card stat"><b>${eco().chapters.length}</b><span>Units covered</span></div></div>
<h2 style="margin-top:22px">Subjects</h2>${subjectCards()}
<h2 style="margin-top:22px">Recent papers</h2><div class="card">${papers.length ? paperTable(papers.slice(0, 5)) : '<p class="mut">No papers yet. <a href="#/generate">Generate your first set →</a></p>'}</div>
<div class="warn"><b>Scope note:</b> Business Economics (Paper 4, Section A) is live. The other three subjects are being added later.</div>`;
}
function subjectCards() {
  return `<div class="grid g4">${META.subjects.map(s => `<div class="card ${s.available ? '' : 'locked'}"><span class="pill ${s.available ? 'ok' : ''}">Paper ${s.paper}</span><h3 style="margin-top:8px">${esc(s.name)}</h3>${s.available ? `<p class="small mut">${s.chapters.length} units · MCQs · negative marking ${META.negativeMarking}</p><a class="btn sm" href="#/generate">Open</a>` : '<p class="small mut">Coming soon</p>'}</div>`).join('')}</div>`;
}
/* ---------- 2. Select subject ---------- */
function subject() {
  app.innerHTML = `<h1>Select Subject</h1>${subjectCards()}<h2 style="margin-top:22px">Business Economics – syllabus units</h2><div class="card"><table><tr><th>Unit</th><th>Title</th><th>Practice</th></tr>${eco().chapters.map(c => `<tr><td>${c.id}</td><td>${esc(c.name)}</td><td><a class="btn sm" href="#/chapters">Practise</a></td></tr>`).join('')}</table>
<p class="small mut">Unit titles follow the ICAI Business Economics study material structure. Please verify against the study material/syllabus applicable to your attempt on icai.org.</p></div>`;
}
/* ---------- 3. Generator ---------- */
let lastGroup = null;
function generate() {
  app.innerHTML = `<h1>Question Paper Generator</h1><div class="grid g2"><div class="card"><form id="gf">
<label>Subject</label><select disabled><option>Business Economics (Paper 4 – Section A)</option></select>
<label>Syllabus coverage</label><select id="ch"><option value="all">Complete syllabus (weighted across all units)</option>${eco().chapters.map(c => `<option value="${c.id}">Unit ${c.id}: ${esc(c.name)}</option>`).join('')}</select>
<label>Marks (1 mark per MCQ)</label><div class="seg">${[20, 50, 100].map((m, i) => `<label><input type="radio" name="marks" value="${m}" ${i === 0 ? 'checked' : ''}><span>${m} marks</span></label>`).join('')}</div>
<label>Difficulty</label><div class="seg">${['Easy', 'Medium', 'Hard', 'Mixed'].map(d => `<label><input type="radio" name="diff" value="${d}" ${d === 'Mixed' ? 'checked' : ''}><span>${d}</span></label>`).join('')}</div>
<label>Number of sets (Set A, B, C…)</label><input type="number" id="cnt" min="1" max="10" value="5">
<div class="row" style="margin-top:16px"><button class="btn gold" id="go">Generate sets</button><button type="button" class="btn ghost" id="more" ${lastGroup ? '' : 'disabled'}>+ Add more sets to last batch</button></div></form></div>
<div class="card"><h3>How papers are built</h3><ul class="small"><li>Every MCQ carries 1 mark; wrong answers carry −${META.negativeMarking} (objective-paper rule – verify on icai.org).</li><li>Sets in a batch never repeat a question while the pool lasts; extra sets continue without repeating earlier ones.</li><li>Numerical questions are produced from formula templates with random values; answers are <b>computed</b>, not typed.</li><li>Every question has the answer, workings, formula and unit/topic reference.</li><li>Time allowed = 1.8 min per mark (180 min per 100 marks).</li></ul><div class="warn small">Official Business Economics section is smaller than 100 marks; 100 here simply means a long full-syllabus drill.</div></div></div><div id="out"></div>`;
  const run = async more => {
    const marks = +document.querySelector('[name=marks]:checked').value, diff = document.querySelector('[name=diff]:checked').value, c = $('#ch').value;
    $('#out').innerHTML = '<div class="card" style="margin-top:16px">Generating…</div>';
    const r = await api('/api/generate', { body: { chapters: c === 'all' ? 'all' : [+c], marks, difficulty: diff, count: +$('#cnt').value, groupId: more ? lastGroup : undefined } });
    lastGroup = r.groupId; $('#more').disabled = false;
    $('#out').innerHTML = `<h2 style="margin-top:20px">Generated ${r.papers.length} set(s)</h2>${r.warnings.map(w => `<div class="warn">⚠ ${esc(w)}</div>`).join('')}<div class="card">${paperTable(r.papers)}</div>`;
  };
  $('#gf').onsubmit = e => { e.preventDefault(); run(false); };
  $('#more').onclick = () => run(true);
}
function paperTable(ps) {
  return `<div style="overflow:auto"><table><tr><th>Paper</th><th>Marks</th><th>Level</th><th>Units</th><th>Created</th><th>Actions</th></tr>${ps.map(p => `<tr><td><b>${esc(p.title)}</b><br><span class="pill gold">AI practice</span></td><td>${p.marks}</td><td>${p.difficulty}</td><td>${p.chapters.join(', ')}</td><td class="small">${fmtDate(p.created)}</td>
<td><div class="row"><a class="btn sm" href="#/attempt/${p.id}">Attempt</a><a class="btn sm ghost" href="#/key/${p.id}">Key</a><a class="btn sm ghost" href="#/solutions/${p.id}">Solutions</a><a class="btn sm ghost" target="_blank" href="${printUrl(p.id, 'paper')}">Paper PDF</a></div></td></tr>`).join('')}</table></div>`;
}
/* ---------- 4. All sets ---------- */
async function sets() {
  const ps = await api('/api/papers');
  app.innerHTML = `<h1>All Question Paper Sets</h1><div class="card">${ps.length ? paperTable(ps) : '<p>No papers yet. <a href="#/generate">Generate →</a></p>'}</div>`;
}
/* ---------- PDF toolbar shared by key / solutions ---------- */
const pdfBar = id => `<div class="row"><a class="btn sm" target="_blank" href="${printUrl(id, 'paper', 1)}">⬇ Question paper PDF</a><a class="btn sm" target="_blank" href="${printUrl(id, 'key', 1)}">⬇ Answer key PDF</a><a class="btn sm" target="_blank" href="${printUrl(id, 'paper+solutions', 1)}">⬇ Paper + solutions PDF</a><a class="btn sm ghost" target="_blank" href="${printUrl(id, 'solutions', 1)}">⬇ Solutions only</a><a class="btn sm ghost" target="_blank" href="${printUrl(id, 'paper', 1)}">🖨 Print paper</a></div><p class="small mut">A print dialog opens – choose “Save as PDF” as destination to download. Page numbers and headers are included.</p>`;
/* ---------- 6. Answer key ---------- */
async function keyPage(id) {
  const p = await api('/api/papers/' + id);
  app.innerHTML = `<h1>Answer Key – ${esc(p.title)}</h1><div class="card">${pdfBar(id)}</div><div class="card" style="margin-top:14px"><div class="pal" style="grid-template-columns:repeat(auto-fill,minmax(74px,1fr))">${p.questions.map(q => `<div style="border:1px solid var(--line);border-radius:8px;padding:6px;text-align:center"><span class="mut small">Q${q.no}</span><br><b>${L[q.answer]}</b></div>`).join('')}</div></div>
<p><a class="btn" href="#/solutions/${id}">View detailed solutions</a> <a class="btn ghost" href="#/attempt/${id}">Attempt this paper</a></p>`;
}
/* ---------- 7. Detailed solutions ---------- */
async function solutions(id) {
  const p = await api('/api/papers/' + id);
  app.innerHTML = `<h1>Detailed Solutions – ${esc(p.title)}</h1><div class="card">${pdfBar(id)}</div><div class="card" style="margin-top:14px">${p.questions.map(solBlock).join('')}</div>`;
}
const solBlock = q => `<div class="sol"><div class="row"><b>Q${q.no}.</b><span class="pill">Unit ${q.chapter}</span><span class="pill">${esc(q.topic)}</span><span class="pill ${q.type === 'Numerical' ? 'gold' : ''}">${q.type}</span><span class="pill">${q.difficulty}</span><span class="sp"></span><span class="mut small">${q.marks} mark · −${q.negative} wrong</span></div>
<p class="qtext" style="font-size:15px">${esc(q.text)}</p>${q.options.map((o, i) => `<div class="small" style="margin-left:10px;${i === q.answer ? 'color:var(--ok);font-weight:700' : ''}">(${L[i]}) ${esc(o)} ${i === q.answer ? '✓' : ''}</div>`).join('')}
<div class="expl"><b>Why (${L[q.answer]}) is correct / workings:</b> ${esc(q.explanation)}${q.formula ? `<br><i>Formula: ${esc(q.formula)}</i>` : ''}<br><span class="mut small">Reference: ${esc(q.source)}</span></div></div>`;

/* ---------- 5. Attempt test ---------- */
async function attempt(id) {
  const p = await api('/api/papers/' + id);
  app.innerHTML = `<h1>Attempt: ${esc(p.title)}</h1><div class="grid g2"><div class="card"><h3>Test instructions</h3><ul class="small"><li>${p.questions.length} MCQs · ${p.marks} marks · ${p.duration} minutes.</li><li>Correct +1 · Wrong −${p.negative} · Unattempted 0.</li><li>Use <b>Mark for review</b> to flag questions; the palette shows status.</li><li>The test auto-submits when time ends.</li></ul>
<span class="pill gold">AI-generated practice paper – not an official ICAI paper</span></div><div class="card"><h3>Answer display</h3>
<div class="seg"><label><input type="radio" name="am" value="after" checked><span>Show answers after I submit</span></label><label><input type="radio" name="am" value="instant"><span>Show answer immediately (practice mode)</span></label></div>
<div class="row" style="margin-top:16px"><button class="btn gold" id="start">Start test</button><a class="btn ghost" target="_blank" href="${printUrl(id, 'paper', 1)}">🖨 Print / PDF instead</a></div></div></div>`;
  $('#start').onclick = () => startTest(p, document.querySelector('[name=am]:checked').value);
}
function startTest(p, mode) {
  T = { p, mode, ans: Array(p.questions.length).fill(null), mark: Array(p.questions.length).fill(false), cur: 0, end: Date.now() + p.duration * 60000, locked: Array(p.questions.length).fill(false) };
  renderTest(); timer = setInterval(tick, 1000);
}
function tick() { if (!$('#tm')) return clearInterval(timer); const s = Math.max(0, Math.round((T.end - Date.now()) / 1000)); $('#tm').textContent = `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`; $('#tm').classList.toggle('low', s < 300); if (s <= 0) { clearInterval(timer); submitTest(true); } }
function renderTest() {
  const { p, cur } = T, q = p.questions[cur], done = T.mode === 'instant' && T.locked[cur];
  const cls = i => !done ? (T.ans[cur] === i ? 'sel' : '') : (i === q.answer ? 'right' : T.ans[cur] === i ? 'wrong' : '');
  app.innerHTML = `<div class="exam"><div class="card"><div class="row"><span class="pill">Question ${cur + 1} of ${p.questions.length}</span><span class="pill">Unit ${q.chapter}</span><span class="pill gold">${q.marks} mark · −${q.negative}</span><span class="sp"></span><span class="timer" id="tm">--:--</span></div>
<p class="qtext">${esc(q.text)}</p>${q.options.map((o, i) => `<div class="opt ${cls(i)}" data-i="${i}" role="checkbox" aria-checked="${T.ans[cur] === i}"><input type="checkbox" class="cb" tabindex="-1" ${T.ans[cur] === i ? 'checked' : ''} ${done ? 'disabled' : ''}><b>${L[i]}</b><span>${esc(o)}</span></div>`).join('')}
${done ? `<div class="expl"><b>${T.ans[cur] === q.answer ? '✓ Correct' : '✗ Incorrect'} – answer (${L[q.answer]}).</b> ${esc(q.explanation)}${q.formula ? `<br><i>${esc(q.formula)}</i>` : ''}</div>` : ''}
<div class="row" style="margin-top:16px"><button class="btn ghost" id="prev" ${cur === 0 ? 'disabled' : ''}>← Previous</button><button class="btn ghost" id="clr">Clear</button><button class="btn ghost" id="mk">${T.mark[cur] ? '★ Unmark' : '☆ Mark for review'}</button><span class="sp"></span><button class="btn" id="next" ${cur === p.questions.length - 1 ? 'disabled' : ''}>Next →</button></div></div>
<div class="card"><h3>Question navigation</h3><div class="pal">${p.questions.map((_, i) => `<button data-n="${i}" class="${T.mark[i] ? 'mk' : T.ans[i] !== null ? 'ans' : ''} ${i === cur ? 'cur' : ''}">${i + 1}</button>`).join('')}</div>
<p class="legend small" style="margin-top:10px"><span><i class="dot" style="background:var(--ok)"></i>Answered</span><span><i class="dot" style="background:#7b3fe4"></i>Marked</span><span><i class="dot" style="background:#fff;border:1px solid #bbb"></i>Not visited/unanswered</span></p>
<p class="small mut">Answered: ${T.ans.filter(a => a !== null).length} · Marked: ${T.mark.filter(Boolean).length}</p><button class="btn gold" id="sub" style="width:100%">Submit test</button></div></div>`;
  tick();
  document.querySelectorAll('.opt').forEach(el => el.onclick = () => { if (done) return; T.ans[cur] = +el.dataset.i; if (T.mode === 'instant') T.locked[cur] = true; renderTest(); });
  document.querySelectorAll('.pal button').forEach(b => b.onclick = () => { T.cur = +b.dataset.n; renderTest(); });
  $('#prev').onclick = () => { T.cur--; renderTest(); }; $('#next').onclick = () => { T.cur++; renderTest(); };
  $('#clr').onclick = () => { if (!T.locked[cur]) { T.ans[cur] = null; renderTest(); } }; $('#mk').onclick = () => { T.mark[cur] = !T.mark[cur]; renderTest(); };
  $('#sub').onclick = () => { const un = T.ans.filter(a => a === null).length; if (confirm(`Submit now? ${un} question(s) unanswered.`)) submitTest(false); };
}
async function submitTest() {
  clearInterval(timer); const { p } = T; let c = 0, w = 0; const byCh = {};
  p.questions.forEach((q, i) => { const ch = byCh[q.chapter] = byCh[q.chapter] || { ch: q.chapter, total: 0, correct: 0, wrong: 0, skipped: 0 }; ch.total++;
    if (T.ans[i] === null) ch.skipped++; else if (T.ans[i] === q.answer) { c++; ch.correct++; } else { w++; ch.wrong++; } });
  const attempted = c + w, score = c - w * p.negative, max = p.questions.length;
  const res = { paperId: p.id, title: p.title, marks: p.marks, correct: c, wrong: w, skipped: max - attempted, score: Math.round(score * 100) / 100, max, pct: Math.max(0, Math.round(score / max * 100)), accuracy: attempted ? Math.round(c / attempted * 100) : 0, chapters: Object.values(byCh), timeTaken: Math.round((p.duration * 60000 - (T.end - Date.now())) / 60000), answers: T.ans, mode: T.mode };
  const saved = await api('/api/attempts', { body: res }); T.result = saved; location.hash = '#/result/' + saved.id;
}
/* ---------- Results ---------- */
async function result(id) {
  const att = await api('/api/attempts'), r = att.find(a => a.id === id); if (!r) return app.innerHTML = '<div class="card">Result not found.</div>';
  const p = await api('/api/papers/' + r.paperId);
  setTimeout(() => $('#aib') && ($('#aib').onclick = () => aiCheck(id)), 0);
  app.innerHTML = `<h1>Result – ${esc(r.title)}</h1><div class="grid g4"><div class="card stat"><b>${r.score} / ${r.max}</b><span>Net score (after negative marking)</span></div><div class="card stat"><b>${r.accuracy}%</b><span>Accuracy (correct ÷ attempted)</span></div><div class="card stat"><b>${r.correct} ✓ · ${r.wrong} ✗ · ${r.skipped} –</b><span>Correct · wrong · skipped</span></div><div class="card stat"><b>${r.timeTaken} min</b><span>Time taken</span></div></div>
<div class="card" style="margin-top:16px"><h3>Chapter-wise performance</h3>${chapterBars(r.chapters)}</div>
<div class="card" style="margin-top:16px"><div class="row"><h3 class="sp">🤖 AI checker – explain my mistakes</h3><button class="btn gold" id="aib">Check my wrong answers with AI</button></div><p class="small mut">Claude re-solves each wrong/skipped question (up to 15), tells you whether it agrees with the answer key, and explains your mistake.</p><div id="aiout"></div></div>
<div class="card" style="margin-top:16px"><div class="row"><h3 class="sp">Review with solutions</h3><a class="btn sm" target="_blank" href="${printUrl(p.id, 'paper+solutions', 1)}">⬇ PDF with solutions</a></div>${p.questions.map((q, i) => { const a = r.answers[i]; return `<div class="sol"><span class="pill ${a === null ? '' : a === q.answer ? 'ok' : 'bad'}">${a === null ? 'Skipped' : a === q.answer ? 'Correct (+1)' : 'Wrong (−' + q.negative + ')'}</span> <span class="small mut">Your answer: ${a === null ? '—' : L[a]}</span>${solBlock(q)}</div>`; }).join('')}</div>`;
}
async function aiCheck(id) {
  const o = $('#aiout'); $('#aib').disabled = true; o.innerHTML = '<p>Claude is reviewing your answers… (10–40 seconds)</p>';
  const r = await api('/api/ai-check', { body: { attemptId: id } }); $('#aib').disabled = false;
  if (r.error) return o.innerHTML = `<div class="warn">${esc(r.message)}</div>`;
  if (!r.results.length) return o.innerHTML = `<p>${esc(r.note || 'No results returned.')}</p>`;
  o.innerHTML = (r.truncated ? '<div class="warn">Only the first 15 wrong/skipped questions were checked.</div>' : '') + r.results.map(x => `<div class="sol"><b>Q${esc(x.no)}</b> <span class="pill ${x.agrees_with_key ? 'ok' : 'bad'}">${x.agrees_with_key ? 'AI agrees with answer key' : '⚠ AI disagrees with key – check manually'}</span> <span class="small mut">AI answer: ${esc(x.your_answer)}</span><div class="expl">${esc(x.explanation)}${x.tip ? `<br><b>Tip:</b> ${esc(x.tip)}` : ''}</div></div>`).join('') + '<p class="small mut">AI explanations can occasionally be wrong – confirm with the ICAI study material.</p>';
}
function chapterBars(chs) {
  return chs.map(c => { const pc = Math.round(c.correct / c.total * 100); return `<div style="margin:10px 0"><div class="row small"><b>Unit ${c.ch}: ${esc(chName(c.ch))}</b><span class="sp"></span><span>${c.correct}/${c.total} correct · ${pc}%</span></div><div class="bar"><i style="width:${pc}%;background:${pc >= 70 ? 'var(--ok)' : pc >= 40 ? 'var(--gold)' : 'var(--bad)'}"></i></div></div>`; }).join('');
}
/* ---------- 8. Chapter practice ---------- */
function chapters() {
  app.innerHTML = `<h1>Chapter-wise Practice</h1><p class="mut">Instant-feedback practice sets (answers shown as soon as you choose).</p><div class="grid g3">${eco().chapters.map(c => `<div class="card"><span class="pill gold">Unit ${c.id}</span><h3 style="margin-top:8px">${esc(c.name)}</h3>
<div class="row"><button class="btn sm" data-c="${c.id}" data-n="10">10 Qs</button><button class="btn sm" data-c="${c.id}" data-n="20">20 Qs</button><button class="btn sm ghost" data-c="${c.id}" data-n="20" data-h="1">20 Hard</button></div></div>`).join('')}</div>`;
  document.querySelectorAll('[data-c]').forEach(b => b.onclick = async () => {
    b.textContent = '…'; const r = await api('/api/generate', { body: { chapters: [+b.dataset.c], marks: +b.dataset.n, difficulty: b.dataset.h ? 'Hard' : 'Mixed', count: 1, kind: 'practice' } });
    startTest(r.papers[0], 'instant'); $('#crumb').textContent = 'Chapter Practice – Unit ' + b.dataset.c;
  });
}
/* ---------- 9. Mock ---------- */
function mock() {
  app.innerHTML = `<h1>Mock Test</h1><div class="grid g2"><div class="card"><h3>Full-syllabus mock</h3><p class="small">Weighted across all five units, mixed difficulty, exam-style timing (1.8 min/mark), negative marking −${META.negativeMarking}, answers shown only after submission.</p>
<div class="row">${[[20, 'Mini mock (20 marks)'], [50, 'Half mock (50 marks)'], [60, 'Section mock (60 marks)'], [100, 'Marathon (100 marks)']].map(([m, t]) => `<button class="btn ${m === 60 ? 'gold' : ''}" data-m="${m}">${t}</button>`).join('')}</div></div>
<div class="card"><h3>Before you start</h3><ul class="small"><li>Sit in one go; do not look at notes.</li><li>Review results unit-wise afterwards and use Chapter-wise Practice for weak units.</li></ul></div></div>`;
  document.querySelectorAll('[data-m]').forEach(b => b.onclick = async () => { b.textContent = 'Preparing…'; const r = await api('/api/generate', { body: { chapters: 'all', marks: +b.dataset.m, difficulty: 'Mixed', count: 1, kind: 'mock' } }); startTest(r.papers[0], 'after'); $('#crumb').textContent = 'Mock Test'; });
}
/* ---------- 10. Progress ---------- */
async function progress() {
  const att = (await api('/api/attempts')); const rev = att.slice().reverse();
  if (!att.length) return app.innerHTML = '<h1>Student Progress</h1><div class="card"><p>No attempts yet. <a href="#/generate">Generate a paper</a> or take a <a href="#/mock">mock test</a>.</p></div>';
  const agg = {}; att.forEach(a => a.chapters.forEach(c => { const g = agg[c.ch] = agg[c.ch] || { ch: c.ch, total: 0, correct: 0 }; g.total += c.total; g.correct += c.correct; }));
  const avg = Math.round(att.reduce((s, a) => s + a.pct, 0) / att.length), best = Math.max(...att.map(a => a.pct)), acc = Math.round(att.reduce((s, a) => s + a.accuracy, 0) / att.length);
  const W = 640, H = 200, pts = att.slice(-12), step = pts.length > 1 ? (W - 60) / (pts.length - 1) : 0;
  const xy = (a, i) => [40 + i * step, H - 30 - a.pct / 100 * (H - 50)];
  const line = pts.map((a, i) => xy(a, i).join(',')).join(' ');
  app.innerHTML = `<h1>Student Progress Dashboard</h1><div class="grid g4"><div class="card stat"><b>${att.length}</b><span>Tests taken</span></div><div class="card stat"><b>${avg}%</b><span>Average net score</span></div><div class="card stat"><b>${best}%</b><span>Best score</span></div><div class="card stat"><b>${acc}%</b><span>Average accuracy</span></div></div>
<div class="grid g2" style="margin-top:16px"><div class="card"><h3>Score trend (last ${pts.length})</h3><svg viewBox="0 0 ${W} ${H}" width="100%">${[0, 25, 50, 75, 100].map(v => `<line x1="40" x2="${W - 10}" y1="${H - 30 - v / 100 * (H - 50)}" y2="${H - 30 - v / 100 * (H - 50)}" stroke="#e3e8f0"/><text x="4" y="${H - 26 - v / 100 * (H - 50)}">${v}%</text>`).join('')}
<polyline points="${line}" fill="none" stroke="#0b1f3a" stroke-width="2.5"/>${pts.map((a, i) => { const [x, y] = xy(a, i); return `<circle cx="${x}" cy="${y}" r="4.5" fill="#b8892b"><title>${esc(a.title)}: ${a.pct}%</title></circle><text x="${x - 6}" y="${H - 12}">${i + 1}</text>`; }).join('')}</svg></div>
<div class="card"><h3>Unit-wise strength (all attempts)</h3>${chapterBars(Object.values(agg).sort((a, b) => a.ch - b.ch))}<p class="small mut">Focus on the red/amber units first.</p></div></div>
<div class="card" style="margin-top:16px"><div class="row"><h3 class="sp">Attempt history</h3><button class="btn sm ghost" id="clr">Clear history</button></div><div style="overflow:auto"><table><tr><th>Date</th><th>Paper</th><th>Score</th><th>Accuracy</th><th></th></tr>${rev.map(a => `<tr><td class="small">${fmtDate(a.date)}</td><td>${esc(a.title)}</td><td>${a.score}/${a.max} (${a.pct}%)</td><td>${a.accuracy}%</td><td><a href="#/result/${a.id}">View</a></td></tr>`).join('')}</table></div></div>`;
  $('#clr').onclick = async () => { if (confirm('Delete all attempt history?')) { await api('/api/attempts', { method: 'DELETE' }); progress(); } };
}
fetch('/api/meta').then(r => r.json()).then(m => { META = m; route(); });
