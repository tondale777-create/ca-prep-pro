// End-to-end smoke test (needs Playwright; dev only). Usage: node scripts/e2e.js http://localhost:3055 outdir
const { chromium } = require('playwright'); const base = process.argv[2], out = process.argv[3];
(async () => {
  const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: 1280, height: 850 } }); const errs = [];
  pg.on('pageerror', e => errs.push(e.message)); pg.on('console', m => m.type() === 'error' && errs.push(m.text()));
  await pg.goto(base); await pg.waitForSelector('.hero'); await pg.screenshot({ path: out + '/1-home.png' });
  await pg.goto(base + '/#/generate'); await pg.waitForSelector('#go'); await pg.click('#go'); await pg.waitForSelector('#out table'); await pg.screenshot({ path: out + '/2-generate.png', fullPage: true });
  const sets = await pg.$$eval('#out tbody tr', r => r.length - 1); console.log('sets generated', sets);
  await pg.click('#out a.btn:has-text("Attempt")'); await pg.waitForSelector('#start'); await pg.click('#start'); await pg.waitForSelector('.opt');
  for (let i = 0; i < 20; i++) { if (i % 4 !== 3) await pg.click('.opt >> nth=' + (i % 4)); if (i === 5) await pg.click('#mk'); if (i < 19) await pg.click('#next'); }
  await pg.screenshot({ path: out + '/3-attempt.png' });
  pg.once('dialog', d => d.accept()); await pg.click('#sub'); await pg.waitForSelector('text=Chapter-wise performance'); await pg.screenshot({ path: out + '/4-result.png', fullPage: true });
  await pg.goto(base + '/#/progress'); await pg.waitForSelector('svg'); await pg.screenshot({ path: out + '/5-progress.png', fullPage: true });
  await pg.goto(base + '/#/chapters'); await pg.click('[data-c="3"][data-n="10"]'); await pg.waitForSelector('.opt'); await pg.click('.opt >> nth=0'); await pg.waitForSelector('.expl'); await pg.screenshot({ path: out + '/6-practice.png' });
  const id = (await (await fetch(base + '/api/papers')).json())[0].id;
  for (const m of ['paper', 'key', 'paper+solutions']) { const p2 = await b.newPage(); await p2.goto(`${base}/print/${id}?mode=${m}`); await p2.pdf({ path: `${out}/pdf-${m}.pdf`, format: 'A4', displayHeaderFooter: false, preferCSSPageSize: true }); }
  await pg.setViewportSize({ width: 390, height: 800 }); await pg.goto(base + '/#/generate'); await pg.waitForSelector('#go'); await pg.screenshot({ path: out + '/7-mobile.png' });
  console.log('console errors:', errs); await b.close();
})();
