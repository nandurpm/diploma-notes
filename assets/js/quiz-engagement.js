/* POLY PMNA client-only quiz engagement features. */
(() => {
  "use strict";

  const STORAGE_KEY = "poly-quiz-engagement-v1";
  const MAX_ATTEMPTS = 120;
  let active = null;
  let timer = null;

  const $ = (id) => document.getElementById(id);
  const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;",
  })[char]);

  function toFiniteNumber(value) {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string") {
      const fraction = value.match(/^\s*(\d+(?:\.\d+)?)\s*\/\s*\d+(?:\.\d+)?\s*$/);
      if (fraction) return Number(fraction[1]);
      const numeric = Number(value);
      return Number.isFinite(numeric) ? numeric : null;
    }
    return null;
  }

  function normalizeAttempt(item) {
    if (!item || typeof item !== "object") return null;
    const nested = item.result && typeof item.result === "object" ? item.result : {};
    const scoreCandidates = [
      item.score, item.points, item.correctAnswers, item.correct,
      nested.score, nested.points, nested.correctAnswers, nested.correct,
    ];
    const totalCandidates = [
      item.total, item.totalQuestions, item.total_questions,
      nested.total, nested.totalQuestions, nested.total_questions,
    ];
    const score = scoreCandidates.map(toFiniteNumber).find((value) => value !== null);
    const total = totalCandidates.map(toFiniteNumber).find((value) => value !== null);
    return {
      ...item,
      score: score === undefined ? 0 : Math.max(0, score),
      total: Math.max(1, total === undefined ? 10 : total),
      hasScore: score !== undefined,
    };
  }

  function storage() {
    try {
      const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      return {
        attempts: Array.isArray(value.attempts)
          ? value.attempts.map(normalizeAttempt).filter(Boolean)
          : [],
      };
    } catch {
      return { attempts: [] };
    }
  }

  function scoredAttempts(attempts) {
    return attempts.filter((item) => item.hasScore !== false);
  }

  function scoreTotal(attempts) {
    return attempts.reduce((sum, item) => sum + Number(item.score || 0), 0);
  }

  function scoreBest(attempts) {
    return attempts.reduce((max, item) => Math.max(max, Number(item.score || 0)), 0);
  }

  function scoreDenominator(attempts) {
    return attempts.reduce((max, item) => Math.max(max, Number(item.total || 0)), 10);
  }

  function save(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        attempts: data.attempts.slice(0, MAX_ATTEMPTS),
      }));
    } catch (error) {
      console.warn("Engagement data could not be saved locally.", error);
    }
  }

  function hash(value) {
    let h = 2166136261;
    for (const char of String(value)) {
      h ^= char.charCodeAt(0);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function random(seed) {
    return () => {
      seed += 0x6D2B79F5;
      let t = seed;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
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

  function dateKey(date = new Date()) {
    if (window.PolyUtils?.formatDateKey) return window.PolyUtils.formatDateKey(date);
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit",
    }).format(date);
  }

  function weekKey(date = new Date()) {
    const key = dateKey(date);
    const base = new Date(`${key}T00:00:00`);
    const day = base.getDay();
    base.setDate(base.getDate() - (day === 0 ? 6 : day - 1));
    return dateKey(base);
  }

  function title(code) {
    const bank = window.POLY_QUIZ_BANK?.subjects?.[code];
    if (typeof bank === "string") return bank;
    if (bank?.title) return bank.title;
    return window.PolyQuiz?.subjects?.[code]?.title || code;
  }

  function questionPool() {
    const questions = window.POLY_QUIZ_BANK?.questions || {};
    return Object.entries(questions).flatMap(([code, values]) => (Array.isArray(values) ? values : []).map((question) => ({ ...question, subjectCode: code })));
  }

  function challengeQuestions() {
    const keys = window.POLY_QUIZ_ENGAGEMENT_KEYS || {};
    const pool = questionPool().filter((question) => Number.isInteger(keys[`${question.subjectCode}:${question.id}`]));
    const week = weekKey();
    const rng = random(hash(`weekly:${week}`));
    return shuffle(pool, rng).slice(0, 10).map((question, index) => {
      const answerIndex = keys[`${question.subjectCode}:${question.id}`];
      return {
        ...question,
        challengeId: `${week}-${index + 1}-${question.id}`,
        options: shuffle(question.options.map((text, optionIndex) => ({ text, correct: optionIndex === answerIndex })), random(hash(`${week}:${question.id}`))),
      };
    });
  }

  function formatTime(ms) {
    const seconds = Math.max(0, Math.ceil(ms / 1000));
    return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
  }

  function getDailyRows() {
    try {
      const all = JSON.parse(localStorage.getItem("poly-quiz-results-v4-single-submit") || "{}");
      const userKey = window.PolyQuizAuth?.user?.id ? `user:${window.PolyQuizAuth.user.id}` : "guest";
      return Array.isArray(all[userKey]) ? all[userKey] : [];
    } catch {
      return [];
    }
  }

  function dailyStreak() {
    const dates = new Set(getDailyRows().map((row) => row.quiz_date).filter(Boolean));
    let cursor = new Date(`${dateKey()}T00:00:00`);
    let count = 0;
    while (dates.has(dateKey(cursor))) {
      count += 1;
      cursor.setDate(cursor.getDate() - 1);
    }
    return count;
  }

  function badges(data) {
    const attempts = data.attempts;
    const scored = scoredAttempts(attempts);
    const output = [];
    if (attempts.length >= 1) output.push(["first-challenge", "First Challenge", "Completed your first weekly challenge.", "★"]);
    if (scored.some((item) => Number(item.score) >= Number(item.total))) output.push(["perfect", "Perfect Score", "Scored full marks in a challenge.", "✦"]);
    if (scored.some((item) => item.mode === "time-trial" && Number(item.score) >= 8)) output.push(["speed-runner", "Speed Runner", "Scored at least 8/10 in time-trial mode.", "⚡"]);
    if (new Set(attempts.map((item) => item.weekKey)).size >= 3) output.push(["weekly-warrior", "Weekly Warrior", "Completed challenges in three different weeks.", "◆"]);
    if (dailyStreak() >= 3) output.push(["daily-streak", "Daily Streaker", "Practised on three consecutive days.", "●"]);
    return output;
  }

  function refreshSummary() {
    const summary = $("engagementSummary");
    const badgesTarget = $("engagementBadges");
    if (!summary || !badgesTarget) return;
    const data = storage();
    const scored = scoredAttempts(data.attempts);
    const total = scoreTotal(scored);
    const best = scoreBest(scored);
    const denominator = scoreDenominator(scored);
    const uniqueWeeks = new Set(data.attempts.map((item) => item.weekKey).filter(Boolean)).size;
    const legacyCount = data.attempts.length - scored.length;
    const scoreNote = legacyCount
      ? `<small class="engagement-note">${legacyCount} older challenge record${legacyCount === 1 ? "" : "s"} did not include a readable score and ${legacyCount === 1 ? "is" : "are"} excluded from score totals.</small>`
      : "";
    summary.innerHTML = `<div class="engagement-metrics"><article><span>Challenge attempts</span><b>${data.attempts.length}</b></article><article><span>Best challenge score</span><b>${scored.length ? `${best}/${denominator}` : "—"}</b></article><article><span>Challenge points</span><b>${scored.length ? total : "—"}</b></article><article><span>Weeks active</span><b>${uniqueWeeks}</b></article></div>${scoreNote}`;
    const earned = badges(data);
    badgesTarget.innerHTML = earned.length
      ? earned.map(([id, name, description, icon]) => `<article class="quiz-badge" data-badge="${escapeHtml(id)}"><strong>${escapeHtml(icon)}</strong><div><b>${escapeHtml(name)}</b><small>${escapeHtml(description)}</small></div></article>`).join("")
      : '<p class="tracker-empty">Complete a challenge to earn your first badge.</p>';
  }

  function renderChallenge() {
    const target = $("challengeBox");
    if (!target) return;
    const questions = active.questions;
    target.classList.remove("hidden");
    target.innerHTML = `<div class="challenge-head"><div><p class="eyebrow">${active.mode === "time-trial" ? "Time-trial mode" : "Weekly challenge"}</p><h3>Week of ${escapeHtml(active.weekKey)}</h3></div><div class="challenge-clock" id="challengeClock">${active.mode === "time-trial" ? formatTime(active.durationMs) : "Open"}</div></div><p class="notice">Answer all ten questions. The challenge is saved only in this browser.</p>${questions.map((question, index) => `<article class="challenge-question" id="challenge-${escapeHtml(question.challengeId)}"><div class="qhead"><div class="qnum">${index + 1}</div><div><div class="qtext">${escapeHtml(question.en)}</div><div class="qml">${escapeHtml(question.ml || "")}</div><div class="topic">${escapeHtml(title(question.subjectCode))} · ${escapeHtml(question.topic || "")}</div></div></div><div class="options">${question.options.map((option, optionIndex) => `<label><input type="radio" name="challenge-${escapeHtml(question.challengeId)}" value="${optionIndex}"><span><b>${String.fromCharCode(65 + optionIndex)}.</b> ${escapeHtml(option.text)}</span></label>`).join("")}</div></article>`).join("")}<div class="challenge-actions"><button id="submitChallenge" class="btn primary" type="button">Submit Challenge</button><button id="cancelChallenge" class="btn outline" type="button">Cancel</button></div><p id="challengeMessage" class="status" aria-live="polite"></p>`;
    $("submitChallenge").addEventListener("click", () => finishChallenge(false));
    $("cancelChallenge").addEventListener("click", cancelChallenge);
  }

  function startChallenge() {
    if (active) return;
    const mode = $("challengeMode")?.value === "time-trial" ? "time-trial" : "weekly";
    const questions = challengeQuestions();
    if (questions.length < 10) {
      const target = $("challengeBox");
      if (target) {
        target.classList.remove("hidden");
        target.innerHTML = '<p class="status error">This challenge is temporarily unavailable because its answer key did not load. Please reload the page and try again.</p>';
      }
      return;
    }
    active = {
      mode,
      weekKey: weekKey(),
      questions,
      startedAt: Date.now(),
      durationMs: mode === "time-trial" ? 90000 : 0,
    };
    renderChallenge();
    if (timer) clearInterval(timer);
    if (mode === "time-trial") {
      timer = setInterval(() => {
        const elapsed = Date.now() - active.startedAt;
        const remaining = active.durationMs - elapsed;
        const clock = $("challengeClock");
        if (clock) clock.textContent = formatTime(remaining);
        if (remaining <= 0) finishChallenge(true);
      }, 250);
    }
    $("challengeBox")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function cancelChallenge() {
    if (timer) clearInterval(timer);
    timer = null;
    active = null;
    $("challengeBox")?.classList.add("hidden");
  }

  function finishChallenge(expired) {
    if (!active) return;
    const challenge = active;
    const answers = {};
    let score = 0;
    challenge.questions.forEach((question) => {
      const chosen = document.querySelector(`input[name="challenge-${CSS.escape(question.challengeId)}"]:checked`);
      const selectedIndex = chosen ? Number(chosen.value) : -1;
      const selected = question.options[selectedIndex];
      answers[question.challengeId] = selected?.text || "Not answered";
      const card = $(`challenge-${question.challengeId}`);
      card?.classList.remove("correct", "wrong");
      if (selected?.correct) {
        score += 1;
        card?.classList.add("correct");
      } else card?.classList.add("wrong");
    });
    if (timer) clearInterval(timer);
    timer = null;
    const elapsedMs = Math.min(Date.now() - challenge.startedAt, challenge.durationMs || Date.now() - challenge.startedAt);
    const data = storage();
    data.attempts.unshift({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      weekKey: challenge.weekKey,
      mode: challenge.mode,
      score,
      total: challenge.questions.length,
      elapsedMs,
      expired: Boolean(expired),
      answers,
      createdAt: new Date().toISOString(),
    });
    save(data);
    const message = $("challengeMessage");
    if (message) {
      message.textContent = `${expired ? "Time expired. " : ""}Challenge complete: ${score}/${challenge.questions.length}. Your result and badges were saved in this browser.`;
      message.className = "status ok";
    }
    const button = $("submitChallenge");
    if (button) button.disabled = true;
    document.querySelectorAll("#challengeBox input").forEach((input) => { input.disabled = true; });
    active = null;
    refreshSummary();
    renderAnalytics();
  }

  function rowsForExport() {
    const data = storage();
    return {
      exportedAt: new Date().toISOString(),
      scope: "Current browser or current signed-in account cache only; not a server-wide student dataset.",
      dailyResults: getDailyRows(),
      engagementAttempts: data.attempts,
      badges: badges(data).map(([id, name, description]) => ({ id, name, description })),
    };
  }

  function download(name, content, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = name;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 500);
  }

  function csvEscape(value) {
    return `"${String(value ?? "").replace(/"/g, '""')}"`;
  }

  function exportCsv() {
    const data = rowsForExport();
    const rows = [["record_type", "date_or_created_at", "subject_or_mode", "score", "total", "week", "elapsed_seconds"]];
    data.dailyResults.forEach((row) => rows.push(["daily", row.submitted_at || row.quiz_date, row.subject_code, row.score, row.total_questions || 10, "", ""]));
    data.engagementAttempts.forEach((row) => rows.push(["challenge", row.createdAt, row.mode, row.score, row.total, row.weekKey, Math.round(Number(row.elapsedMs || 0) / 1000)]));
    download(`poly-pmna-quiz-analytics-${dateKey()}.csv`, rows.map((row) => row.map(csvEscape).join(",")).join("\n"), "text/csv;charset=utf-8");
  }

  function exportJson() {
    download(`poly-pmna-quiz-analytics-${dateKey()}.json`, JSON.stringify(rowsForExport(), null, 2), "application/json;charset=utf-8");
  }

  function renderAnalytics() {
    const target = $("localAnalyticsBox");
    if (!target || target.classList.contains("hidden")) return;
    const data = rowsForExport();
    const attempts = data.engagementAttempts;
    const daily = data.dailyResults;
    const average = attempts.length ? Math.round(attempts.reduce((sum, row) => sum + Number(row.score || 0), 0) / attempts.length * 10) / 10 : 0;
    target.innerHTML = `<div class="analytics-head"><div><p class="eyebrow">Local admin-style view</p><h3>Quiz performance export</h3></div><div class="analytics-actions"><button id="exportQuizCsv" class="btn soft" type="button">Export CSV</button><button id="exportQuizJson" class="btn soft" type="button">Export JSON</button></div></div><p class="notice">This view contains only data available in this browser. It is not a secure multi-student administrator dashboard.</p><div class="engagement-metrics"><article><span>Daily records</span><b>${daily.length}</b></article><article><span>Challenge attempts</span><b>${attempts.length}</b></article><article><span>Challenge average</span><b>${average}/10</b></article><article><span>Badges earned</span><b>${data.badges.length}</b></article></div><div class="table-wrap"><table class="data-table"><thead><tr><th>Type</th><th>Date</th><th>Mode/Subject</th><th>Score</th><th>Time</th></tr></thead><tbody>${[...daily.map((row) => `<tr><td>Daily quiz</td><td>${escapeHtml(row.quiz_date || "—")}</td><td>${escapeHtml(title(row.subject_code))}</td><td>${escapeHtml(row.score)}/${escapeHtml(row.total_questions || 10)}</td><td>—</td></tr>`), ...attempts.map((row) => `<tr><td>Challenge</td><td>${escapeHtml(String(row.createdAt || "").slice(0, 10))}</td><td>${escapeHtml(row.mode)}</td><td>${escapeHtml(row.score)}/${escapeHtml(row.total)}</td><td>${escapeHtml(formatTime(row.elapsedMs))}</td></tr>`)].join("") || '<tr><td colspan="5">No local records yet.</td></tr>'}</tbody></table></div>`;
    $("exportQuizCsv").addEventListener("click", exportCsv);
    $("exportQuizJson").addEventListener("click", exportJson);
  }

  function toggleAnalytics() {
    const target = $("localAnalyticsBox");
    if (!target) return;
    target.classList.toggle("hidden");
    if (!target.classList.contains("hidden")) renderAnalytics();
  }

  function reminderInfo() {
    window.alert("Broad quiz reminders are sent to POLY PMNA app users who have enabled notifications. Install the Android app, allow notifications, and keep the app subscribed to the all-users topic. These reminders are not personalized by individual streak.");
  }

  function init() {
    if (!$('engagementPanel')) return;
    $("startWeeklyChallenge")?.addEventListener("click", startChallenge);
    $("openLocalAnalytics")?.addEventListener("click", toggleAnalytics);
    $("quizReminderInfo")?.addEventListener("click", reminderInfo);
    refreshSummary();
    window.PolyQuizEngagement = { refresh: refreshSummary, exportCsv, exportJson };
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
