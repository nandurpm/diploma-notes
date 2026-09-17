(() => {
  "use strict";

  const STORAGE_KEY = "poly-quiz-engagement-v1";
  const LAST_BACKUP_KEY = `${STORAGE_KEY}-last-backup`;
  const MIGRATION_VERSION = "20260823-score-migration-v1";
  const ELIGIBLE_MODES = new Set(["weekly", "time-trial"]);

  const answerKeys = () => window.POLY_QUIZ_ENGAGEMENT_KEYS || {};
  const questionPool = () => {
    const questions = window.POLY_QUIZ_BANK?.questions || {};
    return Object.entries(questions).flatMap(([subjectCode, values]) => (
      Array.isArray(values)
        ? values.map((question) => ({ ...question, subjectCode }))
        : []
    ));
  };

  function hash(value) {
    let result = 2166136261;
    for (const character of String(value)) {
      result ^= character.charCodeAt(0);
      result = Math.imul(result, 16777619);
    }
    return result >>> 0;
  }

  function random(seed) {
    return () => {
      seed += 0x6D2B79F5;
      let value = seed;
      value = Math.imul(value ^ (value >>> 15), value | 1);
      value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
      return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    };
  }

  function shuffle(items, rng) {
    const result = [...items];
    for (let index = result.length - 1; index > 0; index -= 1) {
      const target = Math.floor(rng() * (index + 1));
      [result[index], result[target]] = [result[target], result[index]];
    }
    return result;
  }

  function normalizeText(value) {
    return String(value ?? "")
      .normalize("NFKC")
      .replace(/\s+/g, " ")
      .trim()
      .toLocaleLowerCase();
  }

  function readRaw() {
    return localStorage.getItem(STORAGE_KEY) || "{}";
  }

  function readData() {
    try {
      const value = JSON.parse(readRaw());
      return { attempts: Array.isArray(value.attempts) ? value.attempts : [] };
    } catch {
      return { attempts: [] };
    }
  }

  function challengeQuestionSet(attempt) {
    if (!attempt || !ELIGIBLE_MODES.has(attempt.mode) || !attempt.weekKey) return null;
    const keys = answerKeys();
    const pool = questionPool().filter((question) => Number.isInteger(keys[`${question.subjectCode}:${question.id}`]));
    const rng = random(hash(`weekly:${attempt.weekKey}`));
    return shuffle(pool, rng).slice(0, 10).map((question, index) => ({
      ...question,
      challengeId: `${attempt.weekKey}-${index + 1}-${question.id}`,
      answerText: question.options[keys[`${question.subjectCode}:${question.id}`]],
    }));
  }

  function recalculateAttempt(attempt, index) {
    if (!attempt || typeof attempt !== "object") return { status: "skipped", reason: "invalid-record", index };
    if (!ELIGIBLE_MODES.has(attempt.mode)) return { status: "skipped", reason: "not-a-challenge", index };
    if (attempt.migrationVersion === MIGRATION_VERSION) return { status: "skipped", reason: "already-migrated", index };
    if (!attempt.answers || typeof attempt.answers !== "object" || Array.isArray(attempt.answers)) {
      return { status: "skipped", reason: "missing-answer-text", index };
    }

    const questions = challengeQuestionSet(attempt);
    if (!questions || questions.length < 10) return { status: "skipped", reason: "question-set-unavailable", index };

    const expectedIds = new Set(questions.map((question) => question.challengeId));
    const answerIds = Object.keys(attempt.answers);
    if (answerIds.length !== expectedIds.size || answerIds.some((id) => !expectedIds.has(id))) {
      return { status: "skipped", reason: "question-set-does-not-match-record", index };
    }

    let score = 0;
    for (const question of questions) {
      const selectedText = attempt.answers[question.challengeId];
      const normalizedSelected = normalizeText(selectedText);
      const normalizedOptions = question.options.map(normalizeText);
      if (!normalizedSelected || normalizedSelected === "not answered" || !normalizedOptions.includes(normalizedSelected)) {
        return { status: "skipped", reason: "answer-text-does-not-match-current-bank", index };
      }
      if (normalizedSelected === normalizeText(question.answerText)) score += 1;
    }

    const previousScore = Number(attempt.score);
    const changed = !Number.isFinite(previousScore) || previousScore !== score || Number(attempt.total) !== questions.length;
    return {
      status: changed ? "changed" : "unchanged",
      index,
      previousScore: Number.isFinite(previousScore) ? previousScore : null,
      score,
      total: questions.length,
      attempt: changed
        ? {
          ...attempt,
          score,
          total: questions.length,
          migrationVersion: MIGRATION_VERSION,
          migrationPreviousScore: Number.isFinite(previousScore) ? previousScore : null,
          migratedAt: new Date().toISOString(),
        }
        : attempt,
    };
  }

  function preview() {
    const data = readData();
    const results = data.attempts.map(recalculateAttempt);
    return {
      migrationVersion: MIGRATION_VERSION,
      totalRecords: data.attempts.length,
      eligibleRecords: results.filter((result) => result.status !== "skipped" && result.reason !== "already-migrated").length,
      changes: results.filter((result) => result.status === "changed").map((result) => ({ index: result.index, previousScore: result.previousScore, score: result.score, total: result.total })),
      unchanged: results.filter((result) => result.status === "unchanged").length,
      skipped: results.filter((result) => result.status === "skipped").map((result) => ({ index: result.index, reason: result.reason })),
    };
  }

  function apply() {
    const data = readData();
    const results = data.attempts.map(recalculateAttempt);
    const changed = results.some((result) => result.status === "changed");
    const summary = {
      migrationVersion: MIGRATION_VERSION,
      totalRecords: data.attempts.length,
      changed: results.filter((result) => result.status === "changed").length,
      unchanged: results.filter((result) => result.status === "unchanged").length,
      skipped: results.filter((result) => result.status === "skipped").length,
      details: results.filter((result) => result.status === "changed").map((result) => ({ index: result.index, previousScore: result.previousScore, score: result.score, total: result.total })),
    };
    if (!changed) return { ...summary, applied: false, backupKey: null };

    const backupKey = `${STORAGE_KEY}-backup-${Date.now()}`;
    localStorage.setItem(backupKey, JSON.stringify({
      createdAt: new Date().toISOString(),
      sourceKey: STORAGE_KEY,
      migrationVersion: MIGRATION_VERSION,
      rawValue: readRaw(),
    }));
    localStorage.setItem(LAST_BACKUP_KEY, backupKey);
    const attempts = results.map((result) => result.status === "changed" ? result.attempt : data.attempts[result.index]);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ attempts }));
    const appliedResult = { ...summary, applied: true, backupKey };
    window.PolyQuizEngagement?.refresh?.();
    window.dispatchEvent(new CustomEvent("poly-quiz-engagement-migrated", { detail: appliedResult }));
    return appliedResult;
  }

  function restoreLastBackup() {
    const backupKey = localStorage.getItem(LAST_BACKUP_KEY);
    if (!backupKey) return { restored: false, reason: "no-backup" };
    try {
      const backup = JSON.parse(localStorage.getItem(backupKey) || "null");
      if (!backup?.rawValue) return { restored: false, reason: "invalid-backup" };
      localStorage.setItem(STORAGE_KEY, backup.rawValue);
      window.PolyQuizEngagement?.refresh?.();
      window.dispatchEvent(new CustomEvent("poly-quiz-engagement-migrated", { detail: { restored: true, backupKey } }));
      return { restored: true, backupKey };
    } catch {
      return { restored: false, reason: "invalid-backup" };
    }
  }

  function renderPreview(event) {
    const target = document.getElementById("challengeMigrationMessage");
    const button = document.getElementById("migrateChallengeScores");
    if (!target) return;
    if (event?.detail?.applied) {
      target.textContent = `Recalculated ${event.detail.changed} past challenge record${event.detail.changed === 1 ? "" : "s"}. A backup was saved before the update.`;
      button?.setAttribute("hidden", "");
      return;
    }
    const result = preview();
    if (result.changes.length) {
      target.textContent = `${result.changes.length} past challenge record${result.changes.length === 1 ? "" : "s"} can be recalculated. A backup will be created before applying the correction.`;
      button?.removeAttribute("hidden");
    } else if (result.skipped.length) {
      target.textContent = `No safe score changes are ready. ${result.skipped.length} record${result.skipped.length === 1 ? " was" : "s were"} skipped because its original question set or answer text could not be verified.`;
      button?.setAttribute("hidden", "");
    } else {
      target.textContent = "No past challenge scores need correction.";
      button?.setAttribute("hidden", "");
    }
  }

  function init() {
    window.PolyQuizEngagementMigration = { preview, apply, restoreLastBackup };
    const button = document.getElementById("migrateChallengeScores");
    button?.addEventListener("click", () => {
      const result = apply();
      const target = document.getElementById("challengeMigrationMessage");
      if (target) {
        target.textContent = result.applied
          ? `Recalculated ${result.changed} past challenge record${result.changed === 1 ? "" : "s"}. A backup was saved before the update.`
          : "No eligible past challenge scores were changed.";
      }
      button.setAttribute("hidden", "");
    });
    window.addEventListener("poly-quiz-engagement-migrated", renderPreview);
    renderPreview();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
