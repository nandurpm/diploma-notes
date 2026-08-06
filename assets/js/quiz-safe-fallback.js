/* Purpose: Quiz safe fallback - Descriptive comment added for clarity */
(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const esc = window.PolyUtils.escapeHtml;

  const STORE = "poly-quiz-safe-fallback-results";
  const B = window.POLY_QUIZ_BANK;
  const CURR = window.POLY_QUIZ_BANK_CURRICULUM;

  function dateKey(date = new Date()) {
    if (window.PolyUtils && typeof window.PolyUtils.formatDateKey === "function") {
      return window.PolyUtils.formatDateKey(date);
    }
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }

  function storageGet() {
    try { return JSON.parse(localStorage.getItem(STORE) || "[]"); }
    catch { return []; }
  }

  function storageSet(rows) {
    try { localStorage.setItem(STORE, JSON.stringify(rows)); }
    catch { /* Local-only fallback cannot persist in this browser mode. */ }
  }

  function title(code) {
    const subjects = window.POLY_QUIZ_BANK?.subjects || {};
    const value = subjects[code];
    return typeof value === "string" ? value : value?.title || code;
  }

  function questions(code) {
    const q = window.POLY_QUIZ_BANK?.questions?.[code] || [];
    return q.slice(0, 10);
  }

  function showPortal(name = "Guest") {
    $("authView")?.classList.add("hidden");
    $("portalView")?.classList.remove("hidden");
    if ($("welcomeTitle")) $("welcomeTitle").textContent = `Welcome, ${name}`;
    ["dashboardView", "dailyView", "mockView", "reviewView"].forEach((id) => $(id)?.classList.add("hidden"));
    $("dashboardView")?.classList.remove("hidden");
  }

  function resultStats() {
    const rows = storageGet();
    const today = rows.filter((row) => row.date === dateKey());
    if ($("dateStat")) $("dateStat").textContent = dateKey();
    if ($("best")) $("best").textContent = today.length ? `${Math.max(...today.map((row) => row.score))}/10` : "0/10";
    if ($("progress")) $("progress").textContent = `${rows.length}/${Object.keys(window.POLY_QUIZ_BANK?.subjects || {}).length}`;
    if ($("analysisBox")) $("analysisBox").innerHTML = `<div class="analysis-card"><span>Mode</span><b>Guest</b></div><div class="analysis-card"><span>Saved Local Results</span><b>${rows.length}</b></div><div class="analysis-card"><span>Today</span><b>${today.length}</b></div><div class="analysis-card"><span>Status</span><b>Offline safe</b></div>`;
    if ($("recentResults")) $("recentResults").innerHTML = rows.length
      ? `<h3>Recent Results</h3><div class="result-list">${rows.slice(0, 8).map((row) => `<div class="result-row"><div><strong>${esc(row.code)} - ${esc(title(row.code))}</strong><small>${esc(row.date)}</small></div><b>${row.score}/10</b></div>`).join("")}</div>`
      : "No saved results yet.";
  }

  function startQuiz(code) {
    const qs = questions(code);
    if (!qs.length) {
      alert(`Daily practice questions for Course Code ${code} are currently under development.\n\nPlease try our First-Year Common Quizzes (Math, Physics, Chemistry, English, Environment, Constitution) or General Knowledge in the meantime!`);
      return;
    }
    const existing = storageGet().find((row) => row.date === dateKey() && row.code === code);
    $("quizBox").classList.remove("hidden");
    $("quizControls").classList.remove("hidden");
    if ($("submitQuiz")) $("submitQuiz").disabled = Boolean(existing);
    if (existing) {
      $("quizBox").innerHTML = `<h3>${esc(code)} - ${esc(title(code))}</h3><p class="notice">Already submitted today in guest/local mode.</p><p class="status ok">Score: ${existing.score}/10</p>`;
      return;
    }
    $("quizBox").dataset.safeCode = code;
    $("quizBox").innerHTML = `<h3>${esc(code)} - ${esc(title(code))}</h3><p class="notice">Safe guest mode. Result saves only in this browser.</p>${qs.map((q, i) => `<div class="question"><div class="qhead"><div class="qnum">${i + 1}</div><div><div class="qtext">${esc(q.en)}</div><div class="qml">${esc(q.ml)}</div><div class="topic">${esc(q.topic)}</div></div></div><div class="options">${q.options.map((op, j) => `<label><input type="radio" name="safe-${esc(q.id)}" value="${j}"><span><b>${String.fromCharCode(65 + j)}.</b> ${esc(op)}</span></label>`).join("")}</div></div>`).join("")}`;
  }

  function submitSafeQuiz() {
    const code = $("quizBox")?.dataset.safeCode;
    if (!code) return;
    const qs = questions(code);
    let score = 0;
    const missing = [];
    qs.forEach((q, index) => {
      const selected = document.querySelector(`input[name="safe-${CSS.escape(q.id)}"]:checked`);
      if (!selected) missing.push(index + 1);
      else if (Number(selected.value) === Number(q.answer)) score += 1;
    });
    if (missing.length) {
      if ($("quizMsg")) {
        $("quizMsg").textContent = `Answer all questions. Missing: ${missing.join(", ")}`;
        $("quizMsg").className = "status error";
      }
      return;
    }
    const rows = storageGet().filter((row) => !(row.date === dateKey() && row.code === code));
    rows.unshift({ date: dateKey(), code, score, submittedAt: new Date().toISOString() });
    storageSet(rows.slice(0, 100));
    if ($("quizMsg")) {
      $("quizMsg").textContent = `Saved locally. Score: ${score}/10`;
      $("quizMsg").className = "status ok";
    }
    startQuiz(code);
    resultStats();
  }

  function card(target, code, name, kind) {
    const el = document.createElement('article');
    el.className = 'subject-card';
    el.dataset.code = code;
    const isSupported = Boolean(B.questions[code] && B.questions[code].length > 0);
    const label = isSupported
      ? (kind === 'review' ? 'Open Review' : kind === 'mock' ? 'Start Exam' : 'Start / View Result')
      : 'Under Development';

    el.innerHTML = `<span class="chip ${isSupported ? 'supported-chip' : 'dev-chip'}" style="background: ${isSupported ? '#059669' : '#475569'}">${esc(code)}</span>
      <h3>${esc(name)}</h3>
      <p style="font-size:12px; opacity:0.8; margin-top:4px;">${isSupported ? 'Quiz is fully active.' : 'Branch curriculum subject. Questions under development.'}</p>
      <p>Guest/local safe quiz mode.</p>
      <button class="btn ${!isSupported ? 'outline' : (kind === 'mock' ? 'primary' : 'soft')}" type="button" style="width:100%; margin-top:auto;">${label}</button>`;

    el.onclick = () => {
      if (!isSupported) {
        alert(`Practice questions for Course Code ${code} (${name}) are currently under development.\n\nPlease practice with our first-year Common Subjects (English, Mathematics, Physics, Chemistry, Environment, Constitution) or General Knowledge in the meantime!`);
        return;
      }
      if (kind === 'daily') startQuiz(code);
      else if (kind === 'review') {
        const row = storageGet().find((item) => item.code === code);
        $("reviewBox").innerHTML = row ? `<p class="notice">Latest local score for ${esc(code)} - ${esc(name)}: ${row.score}/10 on ${esc(row.date)}</p>` : `<p class="notice">No local result found for ${esc(code)}.</p>`;
      }
      else if (kind === 'mock') {
        location.href = code === "1004" ? "/mock-exam-1004.html" : `/mock-exam.html?subject=${encodeURIComponent(code)}`;
      }
    };
    $(target).appendChild(el);
  }

  function renderCurriculumCards(kind) {
    const targetId = kind === 'daily' ? 'dailySubjectCards' : kind === 'review' ? 'reviewSubjectCards' : 'mockSubjectCards';
    const container = $(targetId);
    if (!container) return;
    container.innerHTML = '';

    const category = kind === 'daily' ? $('dailyCategory').value : kind === 'review' ? $('reviewCategory').value : $('mockCategory').value;
    const dept = kind === 'daily' ? $('dailyDept').value : kind === 'review' ? $('reviewDept').value : $('mockDept').value;

    if (category === 'common') {
      CURR.common.forEach((sub) => {
        card(targetId, sub.code, sub.name, kind);
      });
      if (kind !== 'mock') {
        card(targetId, 'GK', 'General Knowledge', kind);
      }
    } else {
      const branch = CURR.departments[dept];
      if (branch && branch.subjects && branch.subjects.length > 0) {
        branch.subjects.forEach((sub) => {
          card(targetId, sub.code, sub.name, kind);
        });
      } else {
        container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 32px; background: rgba(0,0,0,0.1); border-radius: 8px;">
          <p style="font-size: 16px; font-weight: bold; margin-bottom: 8px;">No branch-specific subjects found in Semester 1 &amp; 2</p>
          <p style="font-size: 14px; opacity: 0.8;">The ${esc(branch?.name || dept)} department uses common first-year subjects for the first semesters. Please select "Common First-Year Subjects" above to practice!</p>
        </div>`;
      }
    }
  }

  function setupFilters() {
    const sortedDepts = Object.entries(CURR.departments).sort((a, b) => a[1].name.localeCompare(b[1].name));

    ['dailyDept', 'mockDept', 'reviewDept'].forEach((id) => {
      const select = $(id);
      if (!select) return;
      select.innerHTML = sortedDepts.map(([code, d]) => `<option value="${esc(code)}">${esc(d.name)} (${esc(code)})</option>`).join('');
    });

    $('dailyCategory').onchange = (e) => {
      $('dailyDeptGroup').classList.toggle('hidden', e.target.value !== 'department');
      renderCurriculumCards('daily');
    };
    $('dailyDept').onchange = () => renderCurriculumCards('daily');

    $('mockCategory').onchange = (e) => {
      $('mockDeptGroup').classList.toggle('hidden', e.target.value !== 'department');
      renderCurriculumCards('mock');
    };
    $('mockDept').onchange = () => renderCurriculumCards('mock');

    $('reviewCategory').onchange = (e) => {
      $('reviewDeptGroup').classList.toggle('hidden', e.target.value !== 'department');
      renderCurriculumCards('review');
    };
    $('reviewDept').onchange = () => renderCurriculumCards('review');
  }

  function fillCards() {
    setupFilters();
    renderCurriculumCards('daily');
    renderCurriculumCards('review');
    renderCurriculumCards('mock');
    return true;
  }

  function bindFallback() {
    if (window.PolyQuizEngineLoaded) {
      console.log("Supabase Quiz Engine is active. Disabling offline safe fallback.");
      return;
    }
    if (!window.POLY_QUIZ_BANK) return;
    const filled = fillCards();
    if (!filled) return;

    if ($("authMessage")) {
      $("authMessage").textContent = "Online login is optional. Guest mode is available if cloud service is slow or unavailable.";
      $("authMessage").className = "status ok";
    }
    $("guestLogin")?.addEventListener("click", () => {
      showPortal("Guest");
      resultStats();
    });
    $("openDash")?.addEventListener("click", () => { ["dashboardView", "dailyView", "mockView", "reviewView"].forEach((id) => $(id)?.classList.add("hidden")); $("dashboardView")?.classList.remove("hidden"); resultStats(); });
    $("openDaily")?.addEventListener("click", () => { ["dashboardView", "dailyView", "mockView", "reviewView"].forEach((id) => $(id)?.classList.add("hidden")); $("dailyView")?.classList.remove("hidden"); });
    $("openMocks")?.addEventListener("click", () => { ["dashboardView", "dailyView", "mockView", "reviewView"].forEach((id) => $(id)?.classList.add("hidden")); $("mockView")?.classList.remove("hidden"); });
    $("openReview")?.addEventListener("click", () => { ["dashboardView", "dailyView", "mockView", "reviewView"].forEach((id) => $(id)?.classList.add("hidden")); $("reviewView")?.classList.remove("hidden"); });
    $("submitQuiz")?.addEventListener("click", submitSafeQuiz);
    resultStats();
  }

  function boot() {
    window.setTimeout(bindFallback, 700);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
