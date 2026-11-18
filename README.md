# CA Prep Pro – January 2027 (Business Economics edition)

Independent student practice platform – **not affiliated with ICAI**. All questions are original, generated from
templates/bank written for this project; they are **not** official ICAI questions, RTPs or MTPs.

Currently live: **Business Economics (Paper 4, Section A)**. Accounting, Business Laws and Quantitative Aptitude are shown as "coming soon".

## Run locally
Requires Node.js 18+ (no `npm install` needed – zero dependencies).
```
cd ca-prep-pro
node server.js          # or: npm start
# open http://localhost:3000   (PORT env var to change)
```
Data (generated papers, attempts) persists in `data/db.json`.

## Folder structure
```
server.js            HTTP server + REST API + JSON-file persistence
lib/syllabus.js      Subjects, 5 BE units + weights, negative marking, timing
lib/bank.js          122 original conceptual MCQs with explanations
lib/generator.js     Set generator + 20 numerical templates (answers computed)
lib/render.js        Print/PDF HTML (paper, key, solutions; page numbers)
public/              index.html, styles.css, app.js (SPA – 10 pages)
scripts/validate.js  Checks options/answers on ~2000 generated questions
scripts/e2e.js       Optional Playwright browser test
```
API: `POST /api/generate`, `GET /api/papers[/:id]`, `POST|GET|DELETE /api/attempts`, `GET /print/:id?mode=paper|key|solutions|paper+solutions|paper+key`.

## PDFs
"Download PDF" opens a print-styled page (A4, instructions, marks, "Page X of Y") – choose **Save as PDF** in the print dialog (Chrome/Edge recommended).

## Free deployment (Render.com)
1. Push this folder to a GitHub repo.
2. Render → New → Web Service → connect repo. Runtime: Node. Build command: *(empty)*. Start command: `node server.js`. Free plan.
3. Free instances have ephemeral disk: papers/attempts reset on redeploy. For permanent storage add a persistent disk (paid) and set `DATA_DIR=/var/data`, or swap `db.json` for a free Postgres/Supabase later.
(Railway / Fly.io / any Node host work the same way. No secrets or API keys are used.)

## Academic-accuracy notes (please read)
- Unit list and weights are my best understanding of the ICAI Business Economics structure; **verify against the study material, syllabus and exam notifications for January 2027 on icai.org**.
- Negative marking of 0.25 per wrong MCQ is for objective papers; confirm on icai.org. The official BE section is smaller than 100 marks – the 60-mark "Section mock" is an approximation; 100 marks is a drill length.
- Numerical answers are computed by code from formulas; conceptual questions were hand-written and should be reviewed by a subject teacher before relying on them.
- Question pools are finite: Unit 5 (Business Cycles) has only 13 questions, so many sets repeat there (the app warns).

## AI checker (optional)
After a test, the result page has "Check my wrong answers with AI". It sends your wrong/skipped questions to Claude, which re-solves them,
says whether it agrees with the answer key, and explains your mistake. It needs your own Anthropic API key (console.anthropic.com – usage is billed to you).
1. Copy `.env.example` to a new file named `.env` and replace the text with your key. (`.env` stays on your computer; the key is never sent to the browser.)
2. Restart the server (`node server.js`). Without a key the rest of the site works normally.
