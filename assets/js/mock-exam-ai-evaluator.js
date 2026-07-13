(() => {
  "use strict";
  const M = globalThis.PolyMock1004;
  if (!M || !M.service || !M.ui) return;
  const previous = M.service.evaluate;

  function buildPayload(questions) {
    const answers = questions.map((q) => ({ id: q.id, answer: String(M.state.answers[q.id] || "").trim() }));
    const rubric = Object.fromEntries(questions.map((q) => [q.id, {
      accepted: (M.exactAnswers || {})[q.id] || [],
      keywords: (M.keywords || {})[q.id] || [],
      maxMarks: q.marks
    }]));
    return {
      paperId: M.paperId,
      subjectCode: M.subjectCode,
      title: M.examTitle || M.displayName,
      totalMarks: questions.reduce((sum, q) => sum + Number(q.marks || 0), 0),
      selections: M.state.selections,
      answers,
      questions,
      rubric
    };
  }

  async function invoke(questions) {
    const result = await M.state.client.functions.invoke("evaluate-mock-exam", { body: buildPayload(questions) });
    if (result.error) throw result.error;
    if (result.data && !result.data.error) return result.data;
    throw new Error(result.data?.error || "Evaluation returned no result");
  }

  function looksLikeRubricFallback(item) {
    const feedback = String(item?.feedback || "");
    const confidence = Number(item?.confidence ?? 1);
    return confidence <= 0.61 && /rubric check|needs more relevant points|expected key point|no assessable answer/i.test(feedback);
  }

  function combineUnique(first, second) {
    return [...new Set([String(first || ""), String(second || "")].join(",").split(",").map((v) => v.trim()).filter(Boolean))].join(", ");
  }

  function refreshSummary(result, allQuestions) {
    const unresolved = (result.results || []).filter(looksLikeRubricFallback);
    const score = Math.round((result.results || []).reduce((sum, item) => sum + Number(item.awardedMarks || 0), 0) * 2) / 2;
    result.totalMarks = M.totalMarks;
    result.score = Math.max(0, Math.min(M.totalMarks, score));
    result.percentage = Math.round(result.score / M.totalMarks * 1000) / 10;
    result.totalQuestionCount = allQuestions.length;
    result.aiQuestionCount = allQuestions.length - unresolved.length;
    result.evaluationMode = unresolved.length ? (result.aiQuestionCount ? "ai_partial" : "rubric_fallback") : "ai";
    result.overallFeedback = unresolved.length
      ? `AI reviewed ${result.aiQuestionCount} of ${allQuestions.length} answers. ${unresolved.length} answer${unresolved.length === 1 ? "" : "s"} used rubric fallback.`
      : "AI evaluation completed for all selected answers. Review the question-wise feedback.";
    return unresolved.map((item) => String(item.id));
  }

  M.service.evaluate = async () => {
    if (!M.state.client) return previous();
    const allQuestions = M.ui.selectedQuestions();
    try {
      const result = await invoke(allQuestions);
      let unresolvedIds = refreshSummary(result, allQuestions);

      for (let round = 0; round < 2 && unresolvedIds.length; round += 1) {
        const retryQuestions = allQuestions.filter((q) => unresolvedIds.includes(String(q.id)));
        if (!retryQuestions.length) break;
        try {
          const retry = await invoke(retryQuestions);
          const retryById = new Map((retry.results || []).map((item) => [String(item.id), item]));
          result.results = (result.results || []).map((item) => {
            const replacement = retryById.get(String(item.id));
            return replacement && !looksLikeRubricFallback(replacement) ? replacement : item;
          });
          result.provider = combineUnique(result.provider, retry.provider);
          result.model = combineUnique(result.model, retry.model);
          result.fallbackReasons = [...(result.fallbackReasons || []), ...(retry.fallbackReasons || [])];
          unresolvedIds = refreshSummary(result, allQuestions);
        } catch (retryError) {
          console.warn("AI retry for fallback answers failed.", retryError);
          break;
        }
      }

      return result;
    } catch (error) {
      console.warn("Primary evaluator failed; using page fallback.", error);
      return previous();
    }
  };
})();
