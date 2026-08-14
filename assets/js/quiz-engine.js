/* Purpose: Quiz engine - Descriptive comment added for clarity */
(() => {
  const B = window.POLY_QUIZ_BANK;
  const CURR = window.POLY_QUIZ_BANK_CURRICULUM;
  const R = window.PolyQuizResults;
  const A = window.PolyQuizAuth;
  const $ = (id) => document.getElementById(id);
  const esc = window.PolyUtils.escapeHtml;
  const optionText = (option) => typeof option === 'string' ? option : (option?.text || '');

  let current = [];
  let subject = '';

  function ensureGeneralKnowledge() {
    if (B.questions.GK && !B.subjects.GK) B.subjects.GK = 'General Knowledge';
  }

  function title(code) {
    const value = B.subjects[code];
    return typeof value === 'string' ? value : value?.title || code;
  }

  function hash(value) {
    let h = 2166136261;
    for (const c of String(value)) {
      h ^= c.charCodeAt(0);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function rng(seed) {
    return () => {
      seed += 0x6D2B79F5;
      let t = seed;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function shuffle(items, random) {
    const output = [...items];
    for (let i = output.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [output[i], output[j]] = [output[j], output[i]];
    }
    return output;
  }

  function qset(code, date = R.dateKey()) {
    const random = rng(hash(date + code));
    const picked = shuffle(B.questions[code] || [], random).slice(0, 10);
    return picked.map((q) => ({
      ...q,
      options: shuffle(q.options.map((text) => ({ text })), rng(hash(date + code + q.id + ':single')))
    }));
  }

  async function gradeDailyQuiz(code, date, answers) {
    const configured = String(globalThis.ASK_POLY_CONFIG?.dailyQuizEndpoint || '').trim();
    const endpoint = configured || 'https://ask-poly-ai.nandakumarkdpm.workers.dev/api/grade-daily-quiz';
    const url = new URL(endpoint, location.href);
    if (url.protocol !== 'https:' && !['localhost', '127.0.0.1'].includes(url.hostname)) {
      throw new Error('The secure quiz grading endpoint is not configured correctly.');
    }
    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      body: JSON.stringify({ subject: code, date, mode: 'first', answers })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data || !Array.isArray(data.review)) {
      throw new Error(data.error || 'Secure quiz grading is temporarily unavailable. Your answers were not saved.');
    }
    return data;
  }

  function show(id) {
    ['dashboardView', 'dailyView', 'mockView', 'reviewView'].forEach((x) => $(x)?.classList.add('hidden'));
    $(id)?.classList.remove('hidden');
  }

  function enter(name) {
    $('authView')?.classList.add('hidden');
    $('portalView')?.classList.remove('hidden');
    $('welcomeTitle').textContent = 'Welcome, ' + name;
    show('dashboardView');
    stats();
    recent();
  }

  function msg(text, ok = false) {
    $('authMessage').textContent = text || '';
    $('authMessage').className = 'status ' + (text ? (ok ? 'ok' : 'error') : '');
  }

  function mode(nextMode) {
    const isLogin = nextMode === 'login';
    $('loginTab')?.classList.toggle('active', isLogin);
    $('loginTab')?.setAttribute('aria-selected', String(isLogin));
    $('registerTab')?.classList.toggle('active', !isLogin);
    $('registerTab')?.setAttribute('aria-selected', String(!isLogin));
    $('usernameField')?.classList.toggle('hidden', isLogin);
    $('confirmField')?.classList.toggle('hidden', isLogin);
    $('authForm').dataset.mode = nextMode;
    $('authSubmit').textContent = isLogin ? 'Login' : 'Register';

    const showPw = $('showPasswordToggle');
    if (showPw) {
      showPw.checked = false;
    }
    const pw = $('password');
    const cp = $('confirmPassword');
    if (pw) pw.type = 'password';
    if (cp) cp.type = 'password';

    msg('');
  }

  function selectCard(container, code) {
    document.querySelectorAll('#' + container + ' .subject-card').forEach((card) => {
      card.classList.toggle('selected', card.dataset.code === code);
    });
  }

  function hideQuizControls() {
    $('quizControls')?.classList.add('hidden');
    const retryButton = $('retryQuiz');
    if (retryButton) retryButton.classList.add('hidden');
    if ($('submitQuiz')) $('submitQuiz').disabled = true;
  }

  function renderScoreTracker(rows) {
    const target = $('scoreTracker');
    if (!target) return;

    if (!rows.length) {
      target.innerHTML = '<p class="tracker-empty">Complete a Daily Quiz to start your private score tracker. Your guest history stays in this browser; signed-in history may also be saved online.</p>';
      return;
    }

    const bySubject = new Map();
    const dates = new Set();
    let totalScore = 0;
    let totalQuestions = 0;

    rows.forEach((row) => {
      const score = Number(row.best_score ?? row.score ?? 0) || 0;
      const total = Number(row.total_questions ?? 10) || 10;
      totalScore += score;
      totalQuestions += total;
      if (row.quiz_date) dates.add(row.quiz_date);
      const current = bySubject.get(row.subject_code) || { code: row.subject_code, best: 0, attempts: 0, latest: '' };
      current.best = Math.max(current.best, score);
      current.attempts += 1;
      current.latest = String(current.latest || '') > String(row.quiz_date || '') ? current.latest : (row.quiz_date || '');
      bySubject.set(row.subject_code, current);
    });

    const lastDate = [...dates].sort().at(-1);
    let streak = 0;
    if (lastDate) {
      const cursor = new Date(lastDate + 'T00:00:00');
      while (dates.has(R.dateKey(cursor))) {
        streak += 1;
        cursor.setDate(cursor.getDate() - 1);
      }
    }

    const average = totalQuestions ? Math.round((totalScore / totalQuestions) * 100) : 0;
    const leaders = [...bySubject.values()]
      .sort((a, b) => b.best - a.best || b.attempts - a.attempts || String(a.code).localeCompare(String(b.code)))
      .slice(0, 8);

    target.innerHTML = `<div class="tracker-metrics">
      <article><span>Total points</span><strong>${totalScore}</strong><small>across ${rows.length} saved attempt${rows.length === 1 ? '' : 's'}</small></article>
      <article><span>Average score</span><strong>${average}%</strong><small>best recorded score per submitted attempt</small></article>
      <article><span>Study streak</span><strong>${streak} day${streak === 1 ? '' : 's'}</strong><small>consecutive days ending on your latest attempt</small></article>
    </div><ol class="personal-leaderboard">${leaders.map((entry, index) => `<li><span class="leader-rank">${index + 1}</span><div><strong>${esc(entry.code)} — ${esc(title(entry.code))}</strong><small>${entry.attempts} attempt${entry.attempts === 1 ? '' : 's'} · last saved ${esc(entry.latest || '—')}</small></div><b>${entry.best}/10</b></li>`).join('')}</ol>`;
  }

  function renderReadOnly(code, row, date = R.dateKey()) {
    subject = code;
    current = qset(code, date);
    selectCard('dailySubjectCards', code);
    $('quizBox').classList.remove('hidden');
    hideQuizControls();

    const answers = row?.answers || {};
    const reviewById = new Map((row?.review || []).map((item) => [String(item.id), item]));
    const html = current.map((q, index) => {
      const stored = reviewById.get(String(q.id));
      const userAnswer = answers[q.id] || stored?.userAnswer || 'Not answered';
      const right = stored?.correctAnswer || '';
      const known = Boolean(right);
      const ok = known && userAnswer === right;
      const status = known ? (ok ? 'Correct' : 'Wrong') : 'Saved';
      const answerReview = known
        ? `<div><strong>Correct Answer:</strong> ${esc(right)}</div><div><strong>Status:</strong> ${status}</div>`
        : '<div class="notice">Correct answer is withheld after reload to protect quiz integrity.</div>';
      return `<div class="question ${known ? (ok ? 'correct' : 'wrong') : ''}" id="q${esc(q.id)}">
        <div class="qhead"><div class="qnum">${index + 1}</div><div><div class="qtext">${esc(q.en)}</div><div class="qml">${esc(q.ml)}</div><div class="topic">${esc(q.topic)}</div></div></div>
        <div class="answer review-answer"><div><strong>Your Answer:</strong> ${esc(userAnswer)}</div>${answerReview}</div>
      </div>`;
    }).join('');

    const finalScore = Number(row?.score ?? row?.best_score ?? 0);
    $('quizBox').innerHTML = `<h3>${esc(code)} - ${esc(title(code))}</h3><p class="notice">Already submitted today. Your answer is locked and cannot be edited.</p><p class="status ok">Saved result: ${finalScore}/10</p>${html}`;
    $('quizMsg').textContent = A?.guest ? 'Guest result is stored only in this browser.' : 'This result is saved online. Editing is disabled for today.';
    $('quizMsg').className = 'status ok';
  }

  async function renderQuiz(code) {
    if (!B.questions[code] || B.questions[code].length === 0) {
      alert(`Daily practice questions for Course Code ${code} are currently under development.\n\nPlease try our First-Year Common Quizzes (Math, Physics, Chemistry, English, Environment, Constitution) or General Knowledge in the meantime!`);
      return;
    }
    subject = code;
    selectCard('dailySubjectCards', code);
    $('quizMsg').textContent = '';
    $('quizBox').classList.remove('hidden');
    $('quizBox').innerHTML = '<div class="notice">Checking today’s saved attempt…</div>';
    hideQuizControls();

    const existing = await R.today(code);
    if (existing) {
      renderReadOnly(code, existing, R.dateKey());
      return;
    }

    current = qset(code, R.dateKey());
    $('quizControls').classList.remove('hidden');
    $('submitQuiz').disabled = false;
    $('retryQuiz')?.classList.add('hidden');

    $('quizBox').innerHTML = `<h3>${esc(code)} - ${esc(title(code))}</h3><p class="notice">One attempt only. After submit, the result saves online and cannot be edited today.</p>` + current.map((q, index) => `
      <div class="question" id="q${esc(q.id)}">
        <div class="qhead"><div class="qnum">${index + 1}</div><div><div class="qtext">${esc(q.en)}</div><div class="qml">${esc(q.ml)}</div><div class="topic">${esc(q.topic)}</div></div></div>
        <div class="options">${q.options.map((op, j) => `<label><input type="radio" name="${esc(q.id)}" value="${j}"><span><b>${String.fromCharCode(65 + j)}.</b> ${esc(optionText(op))}</span></label>`).join('')}
</div>
        <div class="answer hidden" id="a${esc(q.id)}"></div>
      </div>`).join('');
  }

  async function submit() {
    const existing = await R.today(subject);
    if (existing) {
      renderReadOnly(subject, existing, R.dateKey());
      return;
    }

    const missing = [];
    const answers = {};

    current.forEach((q, index) => {
      const chosen = document.querySelector(`input[name="${CSS.escape(q.id)}"]:checked`);
      const card = $('q' + q.id);
      card?.classList.remove('wrong', 'correct');
      if (!chosen) {
        missing.push(index + 1);
        card?.classList.add('wrong');
        return;
      }
      const selected = q.options[Number(chosen.value)];
      answers[q.id] = optionText(selected);
      card?.classList.add('answered');
    });

    if (missing.length) {
      $('quizMsg').textContent = 'Answer all 10 questions. Missing: ' + missing.join(', ');
      $('quizMsg').className = 'status error';
      return;
    }

    $('submitQuiz').disabled = true;
    $('quizMsg').textContent = 'Checking answers securely…';
    $('quizMsg').className = 'status';

    let graded;
    try {
      graded = await gradeDailyQuiz(subject, R.dateKey(), answers);
    } catch (error) {
      $('submitQuiz').disabled = false;
      $('quizMsg').textContent = error.message || 'Secure quiz grading is temporarily unavailable. Try again.';
      $('quizMsg').className = 'status error';
      return;
    }

    const score = Number(graded.score || 0);
    const row = {
      quiz_date: R.dateKey(),
      subject_code: subject,
      score,
      best_score: score,
      review: graded.review,
      total_questions: 10,
      answers,
      question_ids: current.map((q) => q.id),
      question_keys: current.map((q) => `${subject}:${q.id}`),
      attempt_count: 1,
      completed: true,
      submitted_at: new Date().toISOString()
    };

    const saved = await R.save(row);
    if (!saved.remote && !saved.guest) {
      $('submitQuiz').disabled = false;
      $('quizMsg').textContent = 'Cloud save failed. Check internet/login and submit again. Result is not locked until cloud save succeeds.';
      $('quizMsg').className = 'status error';
      return;
    }

    renderReadOnly(subject, { ...(saved.row || row), review: graded.review }, R.dateKey());
    stats();
    recent();
  }

  async function stats() {
    if ($('dateStat')) $('dateStat').innerHTML = '<span class="quiz-spinner"></span>';
    if ($('best')) $('best').innerHTML = '<span class="quiz-spinner"></span>';
    if ($('progress')) $('progress').innerHTML = '<span class="quiz-spinner"></span>';
    if ($('analysisBox')) $('analysisBox').innerHTML = '<div class="empty-state"><span class="quiz-spinner-dark"></span> Loading practice records...</div>';

    try {
      const rows = await R.recent();
      const today = rows.filter((row) => row.quiz_date === R.dateKey());
      const bank = Object.values(B.questions).reduce((sum, arr) => sum + arr.length, 0);
      const done = new Set();
      rows.forEach((row) => (row.question_keys || []).forEach((key) => done.add(key)));

      if ($('dateStat')) $('dateStat').textContent = R.dateKey();
      if ($('best')) $('best').textContent = today.length ? Math.max(...today.map((row) => row.best_score ?? row.score ?? 0)) + '/10' : '0/10';
      if ($('progress')) $('progress').textContent = done.size + '/' + bank;
      if ($('analysisBox')) {
        $('analysisBox').innerHTML = `<div class="analysis-card"><span>Mode</span><b>${A?.guest ? 'Guest' : 'Login'}</b></div><div class="analysis-card"><span>Question Bank</span><b>${bank}</b></div><div class="analysis-card"><span>Saved Results</span><b>${rows.length}</b></div><div class="analysis-card"><span>Today</span><b>${today.length}</b></div>`;
      }
      renderScoreTracker(rows);
    } catch (err) {
      console.error("Failed to load quiz statistics", err);
      if ($('dateStat')) $('dateStat').textContent = 'Error';
      if ($('best')) $('best').textContent = 'Error';
      if ($('progress')) $('progress').textContent = 'Error';
      if ($('analysisBox')) {
        $('analysisBox').innerHTML = `<div class="empty-state status error" style="grid-column: 1/-1; text-align: center; padding: 20px;">
          <p>Unable to load practice records. Please check your connection and try again.</p>
          <button class="btn outline btn-sm" onclick="location.reload()" type="button" style="margin-top: 10px; display: inline-flex;">Retry Connection</button>
        </div>`;
      }
      if ($('scoreTracker')) $('scoreTracker').innerHTML = '<p class="tracker-empty">Your score tracker is temporarily unavailable because saved practice records could not be loaded.</p>';
    }
  }

  async function recent() {
    const rows = await R.recent();
    $('recentResults').innerHTML = rows.length
      ? '<h3>Recent Results</h3><div class="result-list">' + rows.slice(0, 8).map((row) => `<div class="result-row"><div><strong>${esc(row.subject_code)} - ${esc(title(row.subject_code))}</strong><small>${esc(row.quiz_date)}</small></div><b>${row.score}/${row.total_questions || 10}</b></div>`).join('') + '</div>'
      : 'No saved results yet.';
  }

  async function review(code) {
    selectCard('reviewSubjectCards', code);
    const row = await R.previous(code);
    if (!row) {
      $('reviewBox').innerHTML = `<p class="notice">No previous-day attempt found for ${esc(code)} - ${esc(title(code))}.</p>`;
      return;
    }
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const qs = qset(code, R.dateKey(d));
    $('reviewBox').innerHTML = `<h3>${esc(code)} - ${esc(title(code))}</h3><div class="review-list">${qs.map((q, index) => {
      const userAnswer = (row.answers || {})[q.id] || 'Not answered';
      const stored = (row.review || []).find((item) => String(item.id) === String(q.id));
      const right = stored?.correctAnswer || '';
      const known = Boolean(right);
      const ok = known && userAnswer === right;
      const status = known ? (ok ? 'Correct' : 'Wrong') : 'Saved';
      const answerReview = known ? `<div class="answerbox"><strong>Correct Answer</strong>${esc(right)}</div>` : '<div class="answerbox"><strong>Review</strong>Correct answer withheld after reload.</div>';
      return `<article class="review-card ${known ? (ok ? 'ok' : 'bad') : ''}"><span class="badge">Q${index + 1}</span> <span class="badge ${known ? (ok ? 'ok' : 'bad') : ''}">${status}</span><div class="qtext" style="margin-top:8px">${esc(q.en)}</div><div class="qml">${esc(q.ml)}</div><div class="answers"><div class="answerbox"><strong>Your Answer</strong>${esc(userAnswer)}</div>${answerReview}</div></article>`;
    }).join('')}</div>`;
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
      <p>${kind === 'daily' ? 'One cloud-saved attempt per day. Submitted answers are locked.' : kind === 'review' ? 'View previous-day answers.' : 'Official-pattern mock exam with graceful evaluation fallback.'}</p>
      <button class="btn ${!isSupported ? 'outline' : (kind === 'mock' ? 'primary' : 'soft')}" type="button" style="width:100%; margin-top:auto;">${label}</button>`;

    el.onclick = () => {
      if (!isSupported) {
        alert(`Practice questions for Course Code ${code} (${name}) are currently under development.\n\nPlease choose another supported subject or General Knowledge while more question banks are being prepared.`);
        return;
      }
      if (kind === 'daily') renderQuiz(code);
      else if (kind === 'review') review(code);
      else location.href = (code === '1004' ? '/mock-exam-1004.html' : '/mock-exam.html?subject=' + encodeURIComponent(code));
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
      CURR.common
        .filter((sub) => Array.isArray(B.questions[sub.code]) && B.questions[sub.code].length > 0)
        .forEach((sub) => {
          card(targetId, sub.code, sub.name, kind);
        });
      // Add GK specifically to common daily/review lists.
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

    // Daily Filters
    $('dailyCategory').onchange = (e) => {
      $('dailyDeptGroup').classList.toggle('hidden', e.target.value !== 'department');
      renderCurriculumCards('daily');
    };
    $('dailyDept').onchange = () => renderCurriculumCards('daily');

    // Mock Filters
    $('mockCategory').onchange = (e) => {
      $('mockDeptGroup').classList.toggle('hidden', e.target.value !== 'department');
      renderCurriculumCards('mock');
    };
    $('mockDept').onchange = () => renderCurriculumCards('mock');

    // Review Filters
    $('reviewCategory').onchange = (e) => {
      $('reviewDeptGroup').classList.toggle('hidden', e.target.value !== 'department');
      renderCurriculumCards('review');
    };
    $('reviewDept').onchange = () => renderCurriculumCards('review');
  }

  function tick() {
    const now = new Date();
    const next = new Date(now);
    next.setHours(24, 0, 0, 0);
    const seconds = Math.max(0, Math.floor((next - now) / 1000));
    $('countdown').textContent = String(Math.floor(seconds / 3600)).padStart(2, '0') + ':' + String(Math.floor((seconds % 3600) / 60)).padStart(2, '0') + ':' + String(seconds % 60).padStart(2, '0');
  }

  function bind() {
    window.PolyQuizEngineLoaded = true;
    ensureGeneralKnowledge();
    document.querySelectorAll('[data-year],#year').forEach((node) => { node.textContent = new Date().getFullYear(); });
    $('dateStat').textContent = R.dateKey();
    const loginTab = $('loginTab');
    const registerTab = $('registerTab');
    if (loginTab) loginTab.onclick = () => mode('login');
    if (registerTab) registerTab.onclick = () => mode('register');

    const handleTabKey = (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault();
        const nextMode = e.currentTarget.id === 'loginTab' ? 'register' : 'login';
        mode(nextMode);
        $(nextMode + 'Tab')?.focus();
      }
    };
    loginTab?.addEventListener('keydown', handleTabKey);
    registerTab?.addEventListener('keydown', handleTabKey);
    $('authForm').onsubmit = async (event) => {
      event.preventDefault();
      $('authSubmit').disabled = true;
      msg('Please wait...', true);
      try {
        const result = $('authForm').dataset.mode === 'register'
          ? await A.register($('username').value.trim(), $('email').value.trim(), $('password').value, $('confirmPassword').value)
          : await A.login($('email').value.trim(), $('password').value);
        if (result.pending) msg(result.message, true);
        else enter(result.name);
      } catch (error) {
        msg(error.message || 'Login/Register failed.');
      } finally {
        $('authSubmit').disabled = false;
      }
    };
    const showPw = $('showPasswordToggle');
    if (showPw) {
      showPw.onchange = () => {
        const type = showPw.checked ? 'text' : 'password';
        const pw = $('password');
        const cp = $('confirmPassword');
        if (pw) pw.type = type;
        if (cp) cp.type = type;
      };
    }
    $('guestLogin').onclick = () => enter(A.asGuest().name);
    $('logoutBtn').onclick = async () => { await A.logout(); location.reload(); };
    $('openDash').onclick = () => { show('dashboardView'); stats(); recent(); };
    $('openDaily').onclick = () => { show('dailyView'); renderCurriculumCards('daily'); };
    $('openMocks').onclick = () => { show('mockView'); renderCurriculumCards('mock'); };
    $('openReview').onclick = () => { show('reviewView'); renderCurriculumCards('review'); };
    $('submitQuiz').onclick = submit;
    $('retryQuiz')?.remove();

    setupFilters();
    renderCurriculumCards('daily');
    renderCurriculumCards('review');
    renderCurriculumCards('mock');

    setInterval(tick, 1000);
    tick();
    mode('login');
    A.restore().then((result) => { if (result) enter(result.name); });
    stats();
  }

  if (document.readyState === 'loading') document.addEventListener("DOMContentLoaded", bind);
  else bind();
})();
