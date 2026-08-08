# Quiz Validator's Journal

## 2025-02-16 - Duplicate Quiz Question in central Bank
**Finding:** Found an exact duplicate entry for `2005-08` under subject code `2005` inside `assets/js/quiz-bank.js`.
**Learning:** Duplicate items in central quiz bank array keys lead to incorrect question counts and repeated rendering of the exact same question in quizzes or exams, degrading user experience and messing with total question calculations.
**Prevention:** Always run automated scanning scripts to identify key duplication or duplicate question texts in JavaScript array configurations before committing.
