const fs = require('fs');

global.window = global;
global.document = { createElement: () => ({}), head: { append: () => {} }, addEventListener: () => {} };

function checkQuestionStrings(source, qList) {
  if (!Array.isArray(qList)) return;
  qList.forEach((q, idx) => {
    if (!q) return;
    const id = q.id || `#${idx}`;
    const opts = q.options || q.opts || [];
    const text = q.question || q.en || '';

    // Check string answer in guest bank matching option string with subtle typo / spacing / case
    if (typeof q.answer === 'string') {
      const matchExact = opts.includes(q.answer);
      if (!matchExact) {
        console.log(`[EXACT STRING MATCH FAIL] ${source} id:${id}: answer="${q.answer}"`);
      } else {
        // check if answer string matches multiple options
        const matchCount = opts.filter(o => o === q.answer).length;
        if (matchCount > 1) {
          console.log(`[MULTIPLE OPTION MATCH] ${source} id:${id}: answer="${q.answer}" matches ${matchCount} options!`);
        }
      }
    }

    // Check for weird HTML entities or double escaping in strings like &quot; or &amp; or &#39;
    const allStrs = [text, ...(opts || []), typeof q.answer === 'string' ? q.answer : ''];
    allStrs.forEach(s => {
      if (typeof s === 'string') {
        if (s.includes('&quot;') || s.includes('&amp;') || s.includes('&lt;') || s.includes('&gt;') || s.includes('&#39;')) {
          console.log(`[HTML ENTITY IN STRING] ${source} id:${id}: "${s}"`);
        }
      }
    });
  });
}

// 1. assets/js/quiz-bank.js
eval(fs.readFileSync('assets/js/quiz-bank.js', 'utf8'));
for (const subj in window.POLY_QUIZ_BANK.questions) {
  checkQuestionStrings(`quiz-bank.js[${subj}]`, window.POLY_QUIZ_BANK.questions[subj]);
}

// 2. workers/ask-poly-ai/src/daily-quiz-bank.js
let daily = fs.readFileSync('workers/ask-poly-ai/src/daily-quiz-bank.js', 'utf8');
daily = daily.replace(/export const /g, 'var ').replace(/export default /g, 'var defaultExport = ');
eval(daily);
for (const subj in DAILY_QUIZ_BANK.questions) {
  checkQuestionStrings(`daily-quiz-bank.js[${subj}]`, DAILY_QUIZ_BANK.questions[subj]);
}

// 3. Guest banks
['1001', '1002', '2002b', '2003a', '2005', '3001', 'gk'].forEach(c => {
  let code = fs.readFileSync(`assets/js/quiz-bank-${c}.js`, 'utf8');
  code = code.replace(/window\.loadScript\([^)]*\);?/g, '');
  eval(code);
  if (window.QuizGuestSubjects && window.QuizGuestSubjects[c]) {
    checkQuestionStrings(`quiz-bank-${c}.js[${c}]`, window.QuizGuestSubjects[c].questions);
  }
});
