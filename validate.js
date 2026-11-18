const { generate } = require('../lib/generator');
const { bank } = require('../lib/bank');
let bad = 0, total = 0, rep = 0;
// bank sanity
for (const b of bank) { const o = [b.ans, ...b.wrong]; if (new Set(o).size !== 4 || b.wrong.length !== 3) { bad++; console.log('BANK BAD', b.q); } }
console.log('bank size', bank.length);
const cfgs = [[ 'all',100,'Mixed',5],['all',50,'Hard',5],['all',20,'Easy',5],[[2],50,'Mixed',5],[[3],100,'Mixed',5],[[4],20,'Medium',5],[[5],20,'Mixed',3],[[1],50,'Mixed',4]];
const samples = [];
for (const [ch,m,d,c] of cfgs) {
  const { sets, warnings } = generate({ chapters: ch, marks: m, difficulty: d, count: c });
  const texts = new Set();
  sets.forEach(s => { if (s.questions.length !== m) { bad++; console.log('count mismatch', s.questions.length, m); }
    s.questions.forEach(q => { total++; if (new Set(q.options).size !== 4 || q.answer < 0 || q.answer > 3 || !q.explanation) { bad++; console.log('BAD', q.text, q.options); }
      if (q.repeated) rep++; if (texts.has(q.text) && !q.repeated) { bad++; console.log('DUP', q.text); } texts.add(q.text);
      if (q.type === 'Numerical' && samples.length < 400) samples.push(q); }); });
  console.log(JSON.stringify([ch,m,d,c]), 'warnings:', warnings);
}
console.log({ total, bad, rep });
const seen = new Set(); samples.sort(() => Math.random() - .5);
for (const q of samples) { if (seen.has(q.topic)) continue; seen.add(q.topic); console.log('\n['+q.topic+'/'+q.difficulty+'] '+q.text+'\n  '+q.options.map((o,i)=>(i===q.answer?'*':' ')+o).join(' | ')+'\n  '+q.explanation); }
