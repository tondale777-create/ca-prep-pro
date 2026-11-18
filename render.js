// Server-side HTML for print / "Save as PDF" documents (paper, answer key, solutions).
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const L = ['A', 'B', 'C', 'D'];
const CSS = `
@page{size:A4;margin:18mm 15mm 20mm;@bottom-center{content:"Page " counter(page) " of " counter(pages);font:9pt Georgia,serif;color:#555}
@bottom-left{content:"CA Prep Pro – independent practice material";font:8pt Georgia,serif;color:#888}}
*{box-sizing:border-box}body{font:11pt/1.45 Georgia,'Times New Roman',serif;color:#111;margin:0}
.hdr{border-bottom:3px double #0b1f3a;padding-bottom:8px;margin-bottom:10px;text-align:center}
.hdr h1{margin:0;font-size:17pt;color:#0b1f3a}.hdr h2{margin:2px 0 0;font-size:11.5pt;font-weight:normal}
.meta{display:flex;justify-content:space-between;font-size:10pt;margin:6px 0;border:1px solid #bbb;padding:5px 8px;background:#f6f6f6}
.badge{border:1px solid #b8892b;color:#7a5a12;background:#fbf3df;padding:4px 8px;font-size:9pt;margin:6px 0;text-align:center}
.ins{font-size:10pt;margin:8px 0 12px}.ins li{margin:2px 0}
.q{break-inside:avoid;margin:0 0 11px}.qt{font-weight:bold}.qt .m{float:right;font-weight:normal;font-size:9pt;color:#555}
.opt{margin:1px 0 0 22px}.tag{font:8pt sans-serif;color:#777}
h3.sec{background:#0b1f3a;color:#fff;font:bold 10pt sans-serif;padding:4px 8px;margin:14px 0 8px;break-after:avoid}
table.key{border-collapse:collapse;width:100%;font-size:10pt}table.key td,table.key th{border:1px solid #999;padding:3px 6px;text-align:center}
table.key th{background:#0b1f3a;color:#fff}
.sol{break-inside:avoid;border-left:3px solid #b8892b;padding:2px 0 2px 8px;margin:0 0 10px;font-size:10.5pt}
.sol .ans{font-weight:bold;color:#0b5a2b}.formula{font-style:italic;color:#333}.src{font:8.5pt sans-serif;color:#666}
.foot{font-size:8.5pt;color:#555;border-top:1px solid #ccc;margin-top:14px;padding-top:6px}
.pb{break-before:page}
@media screen{body{max-width:800px;margin:20px auto;padding:0 18px}.bar{position:sticky;top:0;background:#0b1f3a;color:#fff;padding:8px 14px;font:13px sans-serif;margin:0 -18px 14px}.bar button{background:#b8892b;border:0;padding:6px 12px;font-weight:bold;cursor:pointer;margin-left:8px}}
@media print{.bar{display:none}}`;
const DISC = 'Independent student practice platform – not affiliated with, endorsed by or approved by ICAI. Questions are original AI-generated practice items based on ICAI concepts; they are not official ICAI papers, RTPs or MTPs. Always refer to the latest ICAI study material, amendments and announcements.';

function header(p, title) {
  const neg = p.negative;
  return `<div class="hdr"><h1>CA Prep Pro – January 2027</h1><h2>CA Foundation · Paper 4 · Business Economics (Section A) · ${esc(title)}</h2></div>
<div class="meta"><span><b>${esc(p.title)}</b></span><span>Max. Marks: ${p.marks}</span><span>Time: ${p.duration} min</span><span>Difficulty: ${esc(p.difficulty)}</span></div>
<div class="badge">AI-GENERATED PRACTICE PAPER – NOT AN OFFICIAL ICAI PAPER</div>`;
}
function paperHtml(p) {
  const neg = p.negative;
  let h = header(p, 'Question Paper') + `<ol class="ins"><li>All questions are multiple choice and carry <b>1 mark</b> each.</li><li>Each wrong answer carries <b>negative marking of ${neg} mark</b>; unattempted questions carry no penalty.</li><li>Choose the single most appropriate option.</li><li>Working notes may be done on rough sheets.</li></ol>`;
  let cur = 0;
  for (const q of p.questions) {
    if (q.chapter !== cur) { cur = q.chapter; h += `<h3 class="sec">Unit ${cur}: ${esc(q.chapterName)}</h3>`; }
    h += `<div class="q"><div class="qt"><span class="m">[${q.marks} mark]</span>Q${q.no}. ${esc(q.text)}</div>${q.options.map((o, i) => `<div class="opt">(${L[i]}) ${esc(o)}</div>`).join('')}</div>`;
  }
  return h + `<div class="foot">${DISC}</div>`;
}
function keyHtml(p) {
  const rows = []; for (let i = 0; i < p.questions.length; i += 5) {
    rows.push(p.questions.slice(i, i + 5).map(q => `<td><b>${q.no}</b></td><td>${L[q.answer]}</td>`).join('') + ''); }
  return header(p, 'Answer Key') + `<table class="key"><tr>${'<th>Q</th><th>Ans</th>'.repeat(5)}</tr>${rows.map(r => `<tr>${r}</tr>`).join('')}</table>
<h3 class="sec">Unit-wise summary</h3><table class="key"><tr><th>Unit</th><th>Questions</th><th>Marks</th></tr>${unitSummary(p).map(u => `<tr><td style="text-align:left">Unit ${u.ch}: ${esc(u.name)}</td><td>${u.n}</td><td>${u.n}</td></tr>`).join('')}</table><div class="foot">${DISC}</div>`;
}
function unitSummary(p) { const m = {}; p.questions.forEach(q => { (m[q.chapter] = m[q.chapter] || { ch: q.chapter, name: q.chapterName, n: 0 }).n++; }); return Object.values(m); }
function solHtml(p, withQ) {
  let h = header(p, withQ ? 'Question Paper with Solutions' : 'Detailed Solutions');
  for (const q of p.questions) {
    h += `<div class="sol"><div class="qt"><span class="m">[${q.marks} mark]</span>Q${q.no}. ${esc(q.text)}</div>${withQ ? q.options.map((o, i) => `<div class="opt">(${L[i]}) ${esc(o)}</div>`).join('') : ''}
<div class="ans">Correct answer: (${L[q.answer]}) ${esc(q.options[q.answer])}</div>
<div><b>Explanation / workings:</b> ${esc(q.explanation)}</div>${q.formula ? `<div class="formula">Formula: ${esc(q.formula)}</div>` : ''}
<div class="src">Unit ${q.chapter} · ${esc(q.topic)} · ${q.type} · ${q.difficulty} · Source: ${esc(q.source)}</div></div>`;
  }
  return h + `<div class="foot">${DISC}</div>`;
}
function page(p, mode, auto) {
  let body;
  if (mode === 'key') body = keyHtml(p);
  else if (mode === 'solutions') body = solHtml(p, false);
  else if (mode === 'paper+solutions') body = solHtml(p, true);
  else if (mode === 'paper+key') body = paperHtml(p) + '<div class="pb"></div>' + keyHtml(p);
  else body = paperHtml(p);
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${esc(p.title)} – ${esc(mode)}</title><style>${CSS}</style></head><body>
<div class="bar">Use <b>Print → Save as PDF</b> (destination: PDF) to download. <button onclick="print()">Print / Save PDF</button></div>${body}${auto ? '<script>addEventListener("load",()=>setTimeout(()=>print(),400))</script>' : ''}</body></html>`;
}
module.exports = { page };
