(() => {
  "use strict";
  const M = globalThis.PolyMock1004;
  if (!M || !M.service || !M.ui) return;
  const previous = M.service.evaluate;

  M.service.evaluate = async () => {
    if (!M.state.client) return previous();
    const questions = M.ui.selectedQuestions();
    const answers = questions.map((q) => ({ id: q.id, answer: String(M.state.answers[q.id] || "").trim() }));
    const rubric = Object.fromEntries(questions.map((q) => [q.id, {
      accepted: (M.exactAnswers || {})[q.id] || [],
      keywords: (M.keywords || {})[q.id] || [],
      maxMarks: q.marks
    }]));
    try {
      const result = await M.state.client.functions.invoke("evaluate-mock-exam", {
        body: {
          paperId: M.paperId,
          subjectCode: M.subjectCode,
          title: M.examTitle || M.displayName,
          totalMarks: M.totalMarks,
          selections: M.state.selections,
          answers,
          questions,
          rubric
        }
      });
      if (result.error) throw result.error;
      if (result.data && !result.data.error) return result.data;
      throw new Error(result.data?.error || "Evaluation returned no result");
    } catch (error) {
      console.warn("Primary evaluator failed; using page fallback.", error);
      return previous();
    }
  };
})();
