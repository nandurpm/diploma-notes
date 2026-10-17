const fs = require('fs');

global.window = global;
global.document = { createElement: () => ({}), head: { append: () => {} }, addEventListener: () => {} };

// Load assets/js/subjects.js if exists
let activeSubjectCodes = new Set();
try {
  let subjCode = fs.readFileSync('assets/js/subjects.js', 'utf8');
  eval(subjCode);
  if (global.POLY_SUBJECTS) {
    Object.keys(global.POLY_SUBJECTS).forEach(c => activeSubjectCodes.add(c));
  }
} catch(e) {
  console.log("Error subjects.js:", e.message);
}

function checkQList(source, list, subjectCode) {
  if (!Array.isArray(list)) return;
  list.forEach((q, idx) => {
    if (!q) return;
    const id = q.id || `#${idx}`;
    const opts = q.options || q.opts || [];

    // 1. Check option count
    if (opts.length !== 4 && opts.length > 0) {
      console.log(`[OPT COUNT ${opts.length} != 4] ${source} id:${id}`);
    }

    // 2. Check whitespace in options
    opts.forEach((o, oIdx) => {
      if (typeof o === 'string') {
        if (o !== o.trim()) {
          console.log(`[WHITESPACE IN OPTION] ${source} id:${id} optIdx:${oIdx}: "${o}"`);
        }
        if (o === "") {
          console.log(`[EMPTY OPTION STRING] ${source} id:${id} optIdx:${oIdx}`);
        }
      }
    });

    // 3. Check duplicate option strings (case-insensitive or exact)
    const seenOpt = new Set();
    opts.forEach((o, oIdx) => {
      const s = String(o).trim().toLowerCase();
      if (seenOpt.has(s)) {
        console.log(`[DUPLICATE OPTION IN Q] ${source} id:${id}: "${o}" at optIdx:${oIdx}`);
      }
      seenOpt.add(s);
    });

    // 4. Check text whitespace
    const qText = q.question || q.en || '';
    if (qText && qText !== qText.trim()) {
      console.log(`[WHITESPACE IN QUESTION TEXT] ${source} id:${id}: "${qText}"`);
    }

    // 5. Check answer index vs options
    if (typeof q.answer === 'number') {
      if (q.answer < 0 || q.answer >= opts.length) {
        console.log(`[OUT OF BOUNDS ANS INDEX] ${source} id:${id}: answer=${q.answer}`);
      }
    } else if (typeof q.answer === 'string') {
      if (!opts.includes(q.answer)) {
        console.log(`[STRING ANS NOT IN OPTS] ${source} id:${id}: answer="${q.answer}"`);
      }
    }
  });
}

// 1. assets/js/quiz-bank.js
eval(fs.readFileSync('assets/js/quiz-bank.js', 'utf8'));
for (const subj in window.POLY_QUIZ_BANK.questions) {
  checkQList(`quiz-bank.js[${subj}]`, window.POLY_QUIZ_BANK.questions[subj], subj);
}

// 2. workers/ask-poly-ai/src/daily-quiz-bank.js
let daily = fs.readFileSync('workers/ask-poly-ai/src/daily-quiz-bank.js', 'utf8');
daily = daily.replace(/export const /g, 'var ').replace(/export default /g, 'var defaultExport = ');
eval(daily);
for (const subj in DAILY_QUIZ_BANK.questions) {
  checkQList(`daily-quiz-bank.js[${subj}]`, DAILY_QUIZ_BANK.questions[subj], subj);
}

// 3. Guest banks
['1001', '1002', '2002b', '2003a', '2005', '3001', 'gk'].forEach(c => {
  let code = fs.readFileSync(`assets/js/quiz-bank-${c}.js`, 'utf8');
  code = code.replace(/window\.loadScript\([^)]*\);?/g, '');
  eval(code);
  if (window.QuizGuestSubjects && window.QuizGuestSubjects[c]) {
    checkQList(`quiz-bank-${c}.js[${c}]`, window.QuizGuestSubjects[c].questions, c);
  }
});
