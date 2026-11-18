// Paper generator: concept bank + parametric numerical templates (answers are computed, not typed).
const { bank } = require('./bank');
const syl = require('./syllabus');
const eco = syl.subjects.find(s => s.id === 'economics');

const mulberry32 = a => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const int = (r, a, b) => a + Math.floor(r() * (b - a + 1));
const pick = (r, a) => a[Math.floor(r() * a.length)];
const shuffle = (r, a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const n = x => String(Math.round(x * 100) / 100).replace('-', '−');
const rs = x => '₹' + n(x);
const lin = (c, k, v) => (c === 0 ? `${k}${v}` : `${c < 0 ? '−' + (-c) : c} + ${k}${v}`);

// Build 4 unique options from a numeric answer and candidate wrong numbers.
function numOpts(r, ans, cands, fm = n) {
  const a = fm(ans); const set = new Set([a]); const wrong = [];
  for (const c of cands) { const s = fm(c); if (!set.has(s) && isFinite(c)) { set.add(s); wrong.push(s); } if (wrong.length === 3) break; }
  let k = 1;
  while (wrong.length < 3) { const c = ans + (r() < .5 ? -1 : 1) * k * (Math.abs(ans) >= 10 ? Math.round(Math.abs(ans) / 10) || 1 : 0.5); const s = fm(c); if (!set.has(s)) { set.add(s); wrong.push(s); } k++; }
  return { ans: a, wrong };
}

// ---- Numerical templates: {ch, topic, diff, gen(r)} -> {q, ans, wrong, exp, formula}
const T = [];
const add = (ch, topic, diff, gen) => T.push({ ch, topic, diff, gen });

add(1, 'Production possibility curve – opportunity cost', 'Easy', r => {
  const x1 = int(r, 1, 4) * 10, y1 = int(r, 6, 9) * 10, dx = int(r, 1, 4) * 5, dy = int(r, 1, 3) * 10 + int(r, 0, 1) * 5;
  const o = numOpts(r, dy / dx, [dx / dy, dy, dx, dy / dx + 1], v => n(v) + ' units of Y');
  return { q: `An economy moves along its production possibility curve from (${x1} units of X, ${y1} units of Y) to (${x1 + dx} units of X, ${y1 - dy} units of Y). The opportunity cost of one additional unit of X is:`, ...o,
    exp: `Increase in X = ${dx}; sacrifice of Y = ${dy}. Opportunity cost of 1 unit of X = ${dy}/${dx} = ${n(dy / dx)} units of Y.`, formula: 'Opportunity cost of X = Loss of Y ÷ Gain in X' };
});

add(2, 'Price elasticity of demand – percentage method', 'Easy', r => {
  const p1 = pick(r, [10, 20, 25, 40, 50]), pp = pick(r, [10, 20, 25]), qp = pick(r, [10, 20, 30, 40, 50, 60]), q1 = pick(r, [100, 200, 400, 500, 1000]);
  const p2 = p1 * (1 - pp / 100), q2 = q1 * (1 + qp / 100), e = qp / pp;
  const o = numOpts(r, e, [pp / qp, (q2 - q1) / (p1 - p2), e + 0.5, e * 2]);
  return { q: `When the price of a good falls from ${rs(p1)} to ${rs(p2)}, its quantity demanded rises from ${q1} to ${n(q2)} units. The (numerical) price elasticity of demand is:`, ...o,
    exp: `%ΔP = (${n(p1)} − ${n(p2)})/${n(p1)} × 100 = ${pp}%. %ΔQ = (${n(q2)} − ${q1})/${q1} × 100 = ${qp}%. Ed = ${qp}/${pp} = ${n(e)} → demand is ${e > 1 ? 'elastic' : e < 1 ? 'inelastic' : 'unitary elastic'}.`, formula: 'Ed = (% change in quantity demanded) ÷ (% change in price)' };
});

add(2, 'Arc (mid-point) elasticity of demand', 'Hard', r => {
  const p1 = int(r, 6, 12) * 5, dp = int(r, 1, 3) * 5, q1 = int(r, 4, 9) * 20, dq = int(r, 1, 4) * 20;
  const p2 = p1 - dp, q2 = q1 + dq;
  const e = (dq / (q1 + q2)) / (dp / (p1 + p2));
  const o = numOpts(r, e, [(dq / q1) / (dp / p1), (dq / q2) / (dp / p2), 1 / e, dq / dp]);
  return { q: `The price of a product falls from ${rs(p1)} to ${rs(p2)} and quantity demanded rises from ${q1} to ${q2} units. Using the mid-point (arc) method, the price elasticity of demand is approximately:`, ...o,
    exp: `ΔQ = ${dq}, ΣQ = ${q1 + q2}; ΔP = ${dp}, ΣP = ${p1 + p2}. Ed = (${dq}/${q1 + q2}) ÷ (${dp}/${p1 + p2}) = ${n(e)}.`, formula: 'Arc Ed = [ΔQ ÷ (Q1+Q2)] ÷ [ΔP ÷ (P1+P2)]' };
});

add(2, 'Income elasticity of demand', 'Medium', r => {
  const i1 = pick(r, [20000, 40000, 50000]), ip = pick(r, [10, 20, 25]), qp = pick(r, [-20, -10, 10, 20, 30, 40, 60]), q1 = pick(r, [50, 100, 200]);
  const e = qp / ip, kind = e > 1 ? 'a luxury good' : e > 0 ? 'a necessity (normal good)' : 'an inferior good';
  const o = numOpts(r, e, [-e, ip / qp, e * 2, Math.abs(e) + 0.5]);
  return { q: `When consumer income rises from ${rs(i1)} to ${rs(i1 * (1 + ip / 100))} per month, the quantity demanded of a good changes from ${q1} to ${n(q1 * (1 + qp / 100))} units. The income elasticity of demand is:`, ...o,
    exp: `%ΔIncome = ${ip}%; %ΔQ = ${qp}%. Ey = ${qp}/${ip} = ${n(e)}, so the good is ${kind}.`, formula: 'Ey = (% change in quantity demanded) ÷ (% change in income)' };
});

add(2, 'Cross elasticity of demand', 'Medium', r => {
  const pp = pick(r, [10, 20, 25]), qp = pick(r, [-30, -20, -10, 10, 20, 40]);
  const e = qp / pp;
  const o = numOpts(r, e, [-e, pp / qp, e * 2, Math.abs(e) + 1]);
  return { q: `When the price of good Y rises by ${pp}%, the quantity demanded of good X changes by ${qp > 0 ? '+' : ''}${qp}%. The cross elasticity of demand of X with respect to Y is:`, ...o,
    exp: `Exy = %ΔQx ÷ %ΔPy = ${qp}/${pp} = ${n(e)}. ${e > 0 ? 'Positive → X and Y are substitutes.' : 'Negative → X and Y are complements.'}`, formula: 'Exy = (% change in Qx) ÷ (% change in Py)' };
});

add(2, 'Price change and total expenditure', 'Easy', r => {
  const p1 = pick(r, [10, 20, 30, 40]), p2 = p1 + pick(r, [-5, -2, 2, 5]) , q1 = int(r, 5, 20) * 10, q2 = q1 + pick(r, [-30, -20, -10, 10, 20, 40]);
  const d = p2 * q2 - p1 * q1;
  const fm = v => v === 0 ? 'no change' : (v > 0 ? 'increases by ' : 'decreases by ') + rs(Math.abs(v));
  const o = numOpts(r, d, [-d || 50, p2 * q2, p1 * q1, d + 100], fm);
  return { q: `The price of a good changes from ${rs(p1)} to ${rs(p2)} and quantity demanded changes from ${q1} to ${q2} units. Consumers' total expenditure on the good:`, ...o,
    exp: `Initial TE = ${p1} × ${q1} = ${rs(p1 * q1)}. New TE = ${p2} × ${q2} = ${rs(p2 * q2)}. Change = ${rs(p2 * q2)} − ${rs(p1 * q1)} = ${rs(d)} (${d > 0 ? 'increase' : d < 0 ? 'decrease' : 'no change'}).`, formula: 'Total expenditure = Price × Quantity' };
});

function eqParams(r) {
  const b = pick(r, [2, 3, 4, 5]), d = pick(r, [1, 2, 3, 5]), Pe = int(r, 5, 25), c = pick(r, [-20, -10, 0, 10]);
  if (c + d * Pe <= 0) return eqParams(r);
  return { b, d, Pe, c, a: c + (b + d) * Pe, Qe: c + d * Pe };
}
add(2, 'Market equilibrium (linear demand & supply)', 'Medium', r => {
  const { a, b, c, d, Pe, Qe } = eqParams(r); const askP = r() < .5;
  const o = askP ? numOpts(r, Pe, [(a - c) / b, (a - c) / d, Pe + 2, Pe - 2], rs) : numOpts(r, Qe, [a - b * (Pe + 2), Qe + 10, c + d * (Pe - 2), a], v => n(v) + ' units');
  return { q: `The demand and supply functions of a product are Qd = ${a} − ${b}P and Qs = ${lin(c, d, 'P')}. The equilibrium ${askP ? 'price' : 'quantity'} is:`, ...o,
    exp: `Set Qd = Qs: ${a} − ${b}P = ${lin(c, d, 'P')} → ${a - c} = ${b + d}P → P = ${n(Pe)}. Q = ${a} − ${b}×${Pe} = ${Qe}.`, formula: 'Equilibrium: Qd = Qs' };
});

add(2, 'Price floor / ceiling effects', 'Hard', r => {
  const { a, b, c, d, Pe } = eqParams(r); const k = int(r, 1, Math.min(5, Pe - 1)); const floor = r() < .5;
  const P = floor ? Pe + k : Pe - k, qd = a - b * P, qs = c + d * P, gap = Math.abs(qd - qs);
  const o = numOpts(r, gap, [qs, qd, (b + d) * k + d, gap + 10], v => n(v) + ' units');
  return { q: `Demand and supply are Qd = ${a} − ${b}P and Qs = ${lin(c, d, 'P')}. If the government fixes a ${floor ? 'minimum' : 'maximum'} price of ${rs(P)}, the resulting ${floor ? 'surplus' : 'shortage'} is:`, ...o,
    exp: `Equilibrium P = ${Pe}, so ${rs(P)} is ${floor ? 'above' : 'below'} equilibrium. At ${rs(P)}: Qd = ${qd}, Qs = ${qs}. ${floor ? 'Surplus' : 'Shortage'} = |${qd} − ${qs}| = ${gap} units.`, formula: 'Surplus/Shortage = |Qs − Qd| at the controlled price' };
});

function tpTable(r) {
  const m0 = int(r, 8, 14), m1 = m0 + int(r, 2, 6), peak2 = r() < .5;
  const m2 = peak2 ? m1 + int(r, 1, 3) : m1 - int(r, 1, 3);
  const m = [m0, m1, m2]; m.push(m[2] - int(r, 2, 4)); m.push(m[3] - int(r, 2, 4)); m.push(m[4] - int(r, 2, 5));
  const tp = []; m.reduce((s, x, i) => (tp[i] = s + x, s + x), 0);
  return { m, tp };
}
const tpTxt = tp => `Labour (units): 1, 2, 3, 4, 5, 6 | Total product (units): ${tp.join(', ')}`;
add(3, 'Average product', 'Easy', r => {
  const { tp } = tpTable(r); const L = int(r, 2, 6), ap = tp[L - 1] / L;
  const o = numOpts(r, ap, [tp[L - 1] - tp[L - 2], tp[L - 1], tp[L - 1] / (L + 1), ap + 1]);
  return { q: `${tpTxt(tp)}. The average product of labour when ${L} units of labour are employed is:`, ...o,
    exp: `AP = TP ÷ L = ${tp[L - 1]} ÷ ${L} = ${n(ap)}.`, formula: 'AP = TP ÷ units of variable input' };
});
add(3, 'Marginal product', 'Medium', r => {
  const { tp } = tpTable(r); const L = int(r, 2, 6), mp = tp[L - 1] - tp[L - 2];
  const o = numOpts(r, mp, [tp[L - 1] / L, tp[L - 1], tp[L - 2], mp + 2]);
  return { q: `${tpTxt(tp)}. The marginal product of the ${['', '', '2nd', '3rd', '4th', '5th', '6th'][L]} unit of labour is:`, ...o,
    exp: `MP = TP${L} − TP${L - 1} = ${tp[L - 1]} − ${tp[L - 2]} = ${mp}.`, formula: 'MP = change in TP ÷ change in variable input' };
});
add(3, 'Law of diminishing returns – onset', 'Hard', r => {
  const { m, tp } = tpTable(r); const k = m.indexOf(Math.max(...m)) + 2; // first unit with falling MP
  const o = numOpts(r, k, [k - 1, k + 1, 1, 6], v => ['', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th'][v]);
  return { q: `${tpTxt(tp)}. Diminishing marginal returns to labour begin with the:`, ...o,
    exp: `MP series = ${m.join(', ')}. MP is highest at unit ${k - 1} and first falls at the ${['', '', '2nd', '3rd', '4th', '5th', '6th'][k]} unit, so diminishing returns begin there.`, formula: 'Diminishing returns begin when MP starts to fall' };
});
add(3, 'Average total cost', 'Medium', r => {
  const F = pick(r, [2000, 5000, 6000, 10000]), v = pick(r, [10, 15, 20, 25]), Q = pick(r, [100, 200, 250, 500]);
  const atc = F / Q + v;
  const o = numOpts(r, atc, [F / Q, v + F, (F + v) / Q, atc + 5], rs);
  return { q: `A firm has total fixed cost of ${rs(F)} and a constant average variable cost of ${rs(v)}. The average total cost at an output of ${Q} units is:`, ...o,
    exp: `AFC = ${F}/${Q} = ${n(F / Q)}; AVC = ${v}. ATC = AFC + AVC = ${n(atc)}.`, formula: 'ATC = AFC + AVC = TC ÷ Q' };
});
add(3, 'Marginal cost', 'Medium', r => {
  const q1 = int(r, 2, 8) * 10, dq = int(r, 1, 4) * 10, tc1 = int(r, 20, 60) * 100, mc = int(r, 4, 12) * 5, tc2 = tc1 + mc * dq;
  const o = numOpts(r, mc, [tc2 / (q1 + dq), tc2 - tc1, tc1 / q1, mc + 5], rs);
  return { q: `The total cost of producing ${q1} units is ${rs(tc1)} and of producing ${q1 + dq} units is ${rs(tc2)}. The marginal cost per unit of the additional output is:`, ...o,
    exp: `MC = ΔTC ÷ ΔQ = (${tc2} − ${tc1}) ÷ ${dq} = ${rs(mc)}.`, formula: 'MC = ΔTC ÷ ΔQ' };
});
add(3, 'Average fixed cost', 'Easy', r => {
  const Q = pick(r, [100, 200, 500]), a = pick(r, [20, 40, 50, 80]), k = pick(r, [2, 4]);
  const o = numOpts(r, a / k, [a, a * k, a - k, a / (k * 2)], rs);
  return { q: `At an output of ${Q} units a firm's average fixed cost is ${rs(a)}. If output rises to ${Q * k} units, average fixed cost will be:`, ...o,
    exp: `TFC = ${a} × ${Q} = ${rs(a * Q)}, which does not change. New AFC = ${a * Q} ÷ ${Q * k} = ${rs(a / k)}.`, formula: 'AFC = TFC ÷ Q' };
});
add(3, 'Returns to scale', 'Medium', r => {
  const k = pick(r, [2, 3]), type = pick(r, ['inc', 'con', 'dec']);
  const mults = { 2: { inc: [2.4, 2.5, 3], con: [2], dec: [1.5, 1.6, 1.8] }, 3: { inc: [3.5, 4], con: [3], dec: [2, 2.4, 2.5] } }[k][type];
  const q1 = pick(r, [100, 200, 500]), m = pick(r, mults), q2 = q1 * m;
  const names = { inc: 'Increasing returns to scale', con: 'Constant returns to scale', dec: 'Decreasing returns to scale' };
  const o = { ans: names[type], wrong: [...Object.values(names).filter(x => x !== names[type]), 'Diminishing marginal returns'] };
  return { q: `A firm increases all its inputs ${k} times and its output rises from ${q1} to ${n(q2)} units. The firm is experiencing:`, ...o,
    exp: `Inputs rise ${k}×; output rises ${n(q2)}/${q1} = ${n(m)}×. ${type === 'inc' ? `${n(m)} > ${k}` : type === 'con' ? `${n(m)} = ${k}` : `${n(m)} < ${k}`}, so ${names[type].toLowerCase()}.`, formula: 'Compare % change in output with % change in all inputs' };
});
add(3, 'Economic vs accounting profit', 'Hard', r => {
  const R = int(r, 8, 20) * 10000, ex = Math.round(R * pick(r, [.5, .6, .65]) / 1000) * 1000, im = int(r, 1, 3) * 10000;
  const ep = R - ex - im;
  const o = numOpts(r, ep, [R - ex, R - im, R - ex + im, ep + 10000], rs);
  return { q: `A proprietor earns revenue of ${rs(R)} and pays explicit costs of ${rs(ex)}. He could have earned ${rs(im)} by working elsewhere (implicit cost of his own services). His economic profit is:`, ...o,
    exp: `Accounting profit = ${R} − ${ex} = ${R - ex}. Economic profit = ${R} − ${ex} − ${im} = ${rs(ep)}.`, formula: 'Economic profit = TR − (explicit + implicit costs)' };
});

add(4, 'Monopoly – marginal revenue', 'Medium', r => {
  const a = pick(r, [40, 50, 60, 80, 100]), b = pick(r, [1, 2, 4]), Q = int(r, 2, Math.max(2, Math.floor(a / (2 * b)) - 1));
  const P = a - b * Q, mr = a - 2 * b * Q;
  const o = numOpts(r, mr, [P, P * Q, a - b * Q / 2, a - b], rs);
  return { q: `A monopolist faces the demand curve P = ${a} − ${b}Q. At an output of ${Q} units, marginal revenue is:`, ...o,
    exp: `TR = PQ = ${a}Q − ${b}Q². MR = dTR/dQ = ${a} − ${2 * b}Q = ${a} − ${2 * b}×${Q} = ${rs(mr)}. (Price = ${rs(P)}, so MR < P.)`, formula: 'Linear demand P = a − bQ ⇒ MR = a − 2bQ' };
});
add(4, 'Monopoly – profit-maximising price', 'Hard', r => {
  const b = pick(r, [1, 2, 4]), Q = pick(r, [5, 10, 15, 20]), mc = pick(r, [10, 20, 30]), a = mc + 2 * b * Q, P = a - b * Q;
  const o = numOpts(r, P, [a, mc, Q, mc + 2 * b * Q / 2 + b], rs);
  return { q: `A monopolist faces the demand curve P = ${a} − ${b}Q and has a constant marginal cost of ${rs(mc)}. The profit-maximising price is:`, ...o,
    exp: `MR = ${a} − ${2 * b}Q. MR = MC: ${a} − ${2 * b}Q = ${mc} → Q = ${Q}. P = ${a} − ${b}×${Q} = ${rs(P)}.`, formula: 'Profit maximum: MR = MC, price from demand curve' };
});
add(4, 'Perfect competition – profit/loss', 'Easy', r => {
  const P = pick(r, [20, 30, 40, 50]), atc = P + pick(r, [-8, -5, -2, 3, 5, 8]), Q = pick(r, [50, 100, 200, 500]);
  const pr = (P - atc) * Q, fm = v => v === 0 ? 'zero' : rs(Math.abs(v)) + (v > 0 ? ' profit' : ' loss');
  const o = numOpts(r, pr, [-pr || 100, P * Q, (P - atc), atc * Q], fm);
  return { q: `A perfectly competitive firm sells ${Q} units at the market price of ${rs(P)}. Its average total cost at this output is ${rs(atc)}. The firm earns:`, ...o,
    exp: `TR = ${P} × ${Q} = ${P * Q}; TC = ${atc} × ${Q} = ${atc * Q}. Profit = TR − TC = ${n(P * Q - atc * Q)} → ${fm(pr)}.`, formula: 'Profit = (P − ATC) × Q' };
});
add(4, 'Short-run shutdown decision', 'Medium', r => {
  const avc = pick(r, [15, 20, 25]), atc = avc + pick(r, [5, 8, 10]); const cas = pick(r, [0, 1, 2]);
  const P = cas === 0 ? avc - pick(r, [3, 5]) : cas === 1 ? avc + int(r, 1, atc - avc - 1) : atc + pick(r, [3, 5]);
  const opts = ['Shut down, since price is below average variable cost', 'Continue producing in the short run, minimising its loss (price covers AVC but not ATC)', 'Continue producing and earn supernormal profit (price exceeds ATC)', 'Earn exactly normal profit'];
  const ans = opts[cas === 0 ? 0 : cas === 1 ? 1 : 2];
  return { q: `A perfectly competitive firm faces a market price of ${rs(P)}; its AVC is ${rs(avc)} and ATC is ${rs(atc)} at the relevant output. In the short run the firm should:`, ans, wrong: opts.filter(x => x !== ans),
    exp: `Compare P = ${P} with AVC = ${avc} and ATC = ${atc}. ${cas === 0 ? 'P < AVC: variable costs are not recovered → shut down.' : cas === 1 ? 'AVC ≤ P < ATC: contribution to fixed costs, so loss is smaller if it keeps producing.' : 'P > ATC: supernormal profit.'}`, formula: 'Shut down if P < AVC; supernormal profit if P > ATC' };
});
add(4, 'Perfect competition – profit-maximising output', 'Medium', r => {
  const al = pick(r, [2, 4, 5, 6]), be = pick(r, [1, 2]), Q = int(r, 5, 30), P = al + be * Q;
  const o = numOpts(r, Q, [P / be, (P + al) / be, P - al, Q + 5], v => n(v) + ' units');
  return { q: `A perfectly competitive firm has marginal cost MC = ${al} + ${be}Q and faces a market price of ${rs(P)}. The profit-maximising output is:`, ...o,
    exp: `Under perfect competition P = MR. Profit maximum: MR = MC → ${P} = ${al} + ${be}Q → Q = ${Q} units.`, formula: 'P = MR = MC' };
});

const chapterName = id => eco.chapters.find(c => c.id === id).name;
const numericCh = new Set(T.map(t => t.ch));
const NUMERIC_SHARE = { 1: .10, 2: .35, 3: .35, 4: .35, 5: 0 };

function buildQ(r, o) { // shuffle options, record answer index
  const opts = shuffle(r, [o.ans, ...o.wrong]);
  return { options: opts, answer: opts.indexOf(o.ans) };
}
function makeNumeric(r, ch, diff, seen) {
  const pool = T.filter(t => t.ch === ch);
  for (let tries = 0; tries < 40; tries++) {
    const cand = pool.filter(t => !diff || t.diff === diff); const t = pick(r, cand.length ? cand : pool);
    const g = t.gen(r); if (seen.has(g.q)) continue; seen.add(g.q);
    return { type: 'Numerical', ch, topic: t.topic, difficulty: t.diff, text: g.q, ...buildQ(r, g), explanation: g.exp, formula: g.formula };
  }
  return null;
}

// slots per chapter via largest remainder
function allocate(total, chapters) {
  const w = chapters.map(c => eco.chapters.find(x => x.id === c).weight), sw = w.reduce((a, b) => a + b, 0);
  const raw = w.map(x => x / sw * total), base = raw.map(Math.floor); let left = total - base.reduce((a, b) => a + b, 0);
  raw.map((x, i) => [x - base[i], i]).sort((a, b) => b[0] - a[0]).slice(0, left).forEach(([, i]) => base[i]++);
  return base;
}
const diffTargets = (r, k, difficulty) => {
  if (difficulty !== 'Mixed') return Array(k).fill(difficulty);
  const a = Array(k).fill('Medium'); const e = Math.round(k * .3), h = Math.round(k * .2);
  for (let i = 0; i < e; i++) a[i] = 'Easy'; for (let i = 0; i < h; i++) a[k - 1 - i] = 'Hard';
  return shuffle(r, a);
};

/** generate({chapters:[..]|'all', marks, difficulty, count, startIndex, excludeTexts:Set}) */
function generate(opts) {
  const chapters = (!opts.chapters || opts.chapters === 'all' || !opts.chapters.length) ? eco.chapters.map(c => c.id) : opts.chapters.map(Number);
  const marks = Number(opts.marks) || 20, difficulty = opts.difficulty || 'Mixed', count = Math.min(Number(opts.count) || 5, 10);
  const seen = new Set(opts.excludeTexts || []); const usedBank = new Set(opts.excludeIds || []);
  const sets = [], warnings = [];
  for (let s = 0; s < count; s++) {
    const r = mulberry32((Date.now() + s * 7919 + Math.floor(Math.random() * 1e9)) >>> 0);
    const alloc = allocate(marks, chapters), qs = [];
    chapters.forEach((ch, ci) => {
      const k = alloc[ci]; if (!k) return;
      const targets = diffTargets(r, k, difficulty);
      let numTarget = numericCh.has(ch) ? Math.round(k * NUMERIC_SHARE[ch]) : 0;
      if (chapters.length === 1 && numericCh.has(ch)) numTarget = Math.round(k * Math.max(NUMERIC_SHARE[ch], .3));
      targets.forEach((dt, i) => {
        let q = null;
        const wantNum = i < numTarget;
        if (wantNum) q = makeNumeric(r, ch, dt, seen) || makeNumeric(r, ch, null, seen);
        if (!q) {
          const free = bank.filter(b => b.ch === ch && !usedBank.has(b.id) && !seen.has(b.q));
          const order = [dt, 'Medium', 'Easy', 'Hard'];
          let b = null; for (const d of order) { const c = free.filter(x => x.diff === d); if (c.length) { b = pick(r, c); break; } }
          if (b) { usedBank.add(b.id); seen.add(b.q); q = { type: 'Conceptual', ch, topic: b.topic, difficulty: b.diff, text: b.q, ...buildQ(r, b), explanation: b.exp, formula: null }; }
        }
        if (!q && numericCh.has(ch)) q = makeNumeric(r, ch, null, seen);
        if (!q) { // pool exhausted: reuse a bank question (flagged)
          const all = bank.filter(b => b.ch === ch); const b = pick(r, all);
          q = { type: 'Conceptual', ch, topic: b.topic, difficulty: b.diff, text: b.q, ...buildQ(r, b), explanation: b.exp, formula: null, repeated: true };
          warnings.push(`Unit ${ch}: question pool exhausted, some questions repeat across sets.`);
        }
        qs.push(q);
      });
    });
    // order by chapter, then shuffle within paper lightly? keep chapter order (as study material order) then number
    qs.forEach((q, i) => Object.assign(q, { no: i + 1, marks: 1, negative: syl.negativeMarking, chapter: q.ch, chapterName: chapterName(q.ch), source: `ICAI Business Economics study material – Unit ${q.ch}: ${chapterName(q.ch)}` }));
    sets.push({ questions: qs });
  }
  return { sets, warnings: [...new Set(warnings)] };
}

const setLabel = i => { let s = ''; i++; while (i > 0) { s = String.fromCharCode(65 + (i - 1) % 26) + s; i = Math.floor((i - 1) / 26); } return s; };
module.exports = { generate, setLabel, T, mulberry32, chapterName };
