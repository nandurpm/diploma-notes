/* Purpose: Quiz config - Descriptive comment added for clarity */
(() => {
  "use strict";
  if (!window.PolyQuiz?.config) {
    throw new Error("Quiz core must load before quiz configuration.");
  }
  window.PolyQuiz.config.functionName = "quiz-portal-api";
})();
