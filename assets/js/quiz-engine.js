/* Purpose: Quiz engine - Descriptive comment added for clarity */
(() => {
  const B = window.POLY_QUIZ_BANK;
  const R = window.PolyQuizResults;
  const A = window.PolyQuizAuth;
  const $ = (id) => document.getElementById(id);
  const esc = window.PolyUtils.escapeHtml;

  let current = [];
  let subject = '';

  function ensureGeneralKnowledge() {
    if (!B.subjects.GK) B.subjects.GK = 'General Knowledge';
    if (!Array.isArray(B.questions.GK)) {
      B.questions.GK = [
        { id: 'GK-01', topic: 'India', en: 'What is the capital of India?', ml: 'ഇന്ത്യയുടെ തലസ്ഥാനം ഏത്?', options: ['New Delhi', 'Mumbai', 'Kolkata', 'Chennai'], answer: 0 },
        { id: 'GK-02', topic: 'Kerala', en: 'What is the capital of Kerala?', ml: 'കേരളത്തിന്റെ തലസ്ഥാനം ഏത്?', options: ['Thiruvananthapuram', 'Kochi', 'Kozhikode', 'Thrissur'], answer: 0 },
        { id: 'GK-03', topic: 'India', en: 'Which document is the supreme law of India?', ml: 'ഇന്ത്യയുടെ പരമോന്നത നിയമം ഏത് രേഖയാണ്?', options: ['The Constitution of India', 'The Union Budget', 'The Census', 'The Penal Code only'], answer: 0 },
        { id: 'GK-04', topic: 'Kerala', en: 'Kerala was formed as a state on which date?', ml: 'കേരളം സംസ്ഥാനമായി രൂപീകരിച്ചത് ഏത് തീയതി?', options: ['1 November 1956', '15 August 1947', '26 January 1950', '1 May 1960'], answer: 0 },
        { id: 'GK-05', topic: 'Science', en: 'What is the chemical symbol for oxygen?', ml: 'Oxygen-ന്റെ chemical symbol എന്ത്?', options: ['O', 'Ox', 'Og', 'On'], answer: 0 },
        { id: 'GK-06', topic: 'Science', en: 'Water freezes at what temperature on the Celsius scale?', ml: 'Celsius scale-ൽ വെള്ളം ഏത് temperature-ൽ തണുത്തുറയും?', options: ['0°C', '100°C', '32°C', '-100°C'], answer: 0 },
        { id: 'GK-07', topic: 'Technology', en: 'What does CPU stand for?', ml: 'CPU എന്നത് എന്തിന്റെ ചുരുക്കപ്പേരാണ്?', options: ['Central Processing Unit', 'Computer Primary Utility', 'Central Power Unit', 'Control Program User'], answer: 0 },
        { id: 'GK-08', topic: 'Technology', en: 'Which protocol is normally used for secure web browsing?', ml: 'Secure web browsing-ന് സാധാരണ ഉപയോഗിക്കുന്ന protocol ഏത്?', options: ['HTTPS', 'FTP only', 'SMTP', 'Bluetooth'], answer: 0 },
        { id: 'GK-09', topic: 'Environment', en: 'Which layer protects Earth from much harmful ultraviolet radiation?', ml: 'ഹാനികരമായ UV radiation-ൽ നിന്ന് ഭൂമിയെ സംരക്ഷിക്കുന്ന layer ഏത്?', options: ['Ozone layer', 'Troposphere only', 'Ocean layer', 'Core'], answer: 0 },
        { id: 'GK-10', topic: 'Geography', en: 'Which is the largest continent by area?', ml: 'വിസ്തീർണ്ണത്തിൽ ഏറ്റവും വലിയ ഭൂഖണ്ഡം ഏത്?', options: ['Asia', 'Africa', 'Europe', 'Australia'], answer: 0 }
      ];
    }
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
    return picked.map((q) => {
      const options = q.options.map((text, index) => ({ text, ok: index === q.answer }));
      return { ...q, options: shuffle(options, rng(hash(date + code + q.id + ':single'))) };
    });
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

  function select(container, code) {
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

  function renderReadOnly(code, row, date = R.dateKey()) {
    subject = code;
    current = qset(code, date);
    select('dailySubjectCards', code);
    $('quizBox').classList.remove('hidden');
    hideQuizControls();

    const answers = row?.answers || {};
    let score = 0;
    const html = current.map((q, index) => {
      const right = q.options.find((option) => option.ok)?.text || '';
      const userAnswer = answers[q.id] || 'Not answered';
      const ok = userAnswer === right;
      if (ok) score += 1;
      return `<div class="question ${ok ? 'correct' : 'wrong'}" id="q${esc(q.id)}">
        <div class="qhead"><div class="qnum">${index + 1}</div><div><div class="qtext">${esc(q.en)}</div><div class="qml">${esc(q.ml)}</div><div class="topic">${esc(q.topic)}</div></div></div>
        <div class="answer review-answer"><div><strong>Your Answer:</strong> ${esc(userAnswer)}</div><div><strong>Correct Answer:</strong> ${esc(right)}</div><div><strong>Status:</strong> ${ok ? 'Correct' : 'Wrong'}</div></div>
      </div>`;
    }).join('');

    const finalScore = Number(row?.score ?? row?.best_score ?? score);
    $('quizBox').innerHTML = `<h3>${esc(code)} - ${esc(title(code))}</h3><p class="notice">Already submitted today. Your answer is locked and cannot be edited.</p><p class="status ok">Saved result: ${finalScore}/10</p>${html}`;
    $('quizMsg').textContent = A?.guest ? 'Guest result is stored only in this browser.' : 'This result is saved online. Editing is disabled for today.';
    $('quizMsg').className = 'status ok';
  }

  async function render(code) {
    subject = code;
    select('dailySubjectCards', code);
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
        <div class="options">${q.options.map((op, j) => `<label><input type="radio" name="${esc(q.id)}" value="${j}"><span><b>${String.fromCharCode(65 + j)}.</b> ${esc(op.text)}</span></label>`).join('')}</div>
        <div class="answer hidden" id="a${esc(q.id)}"></div>
      </div>`).join('');
  }

  async function submit() {
    const existing = await R.today(subject);
    if (existing) {
      renderReadOnly(subject, existing, R.dateKey());
      return;
    }

    let score = 0;
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
      answers[q.id] = selected.text;
      if (selected.ok) {
        score += 1;
        card?.classList.add('correct');
      } else {
        card?.classList.add('wrong');
      }
    });

    if (missing.length) {
      $('quizMsg').textContent = 'Answer all 10 questions. Missing: ' + missing.join(', ');
      $('quizMsg').className = 'status error';
      return;
    }

    $('submitQuiz').disabled = true;
    $('quizMsg').textContent = 'Saving result online…';
    $('quizMsg').className = 'status';

    const row = {
      quiz_date: R.dateKey(),
      subject_code: subject,
      score,
      best_score: score,
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

    renderReadOnly(subject, saved.row || row, R.dateKey());
    stats();
    recent();
  }

  async function stats() {
    const rows = await R.recent();
    const today = rows.filter((row) => row.quiz_date === R.dateKey());
    const bank = Object.values(B.questions).reduce((sum, arr) => sum + arr.length, 0);
    const done = new Set();
    rows.forEach((row) => (row.question_keys || []).forEach((key) => done.add(key)));
    $('dateStat').textContent = R.dateKey();
    $('best').textContent = today.length ? Math.max(...today.map((row) => row.best_score ?? row.score ?? 0)) + '/10' : '0/10';
    $('progress').textContent = done.size + '/' + bank;
    $('analysisBox').innerHTML = `<div class="analysis-card"><span>Mode</span><b>${A?.guest ? 'Guest' : 'Login'}</b></div><div class="analysis-card"><span>Question Bank</span><b>${bank}</b></div><div class="analysis-card"><span>Saved Results</span><b>${rows.length}</b></div><div class="analysis-card"><span>Today</span><b>${today.length}</b></div>`;
  }

  async function recent() {
    const rows = await R.recent();
    $('recentResults').innerHTML = rows.length
      ? '<h3>Recent Results</h3><div class="result-list">' + rows.slice(0, 8).map((row) => `<div class="result-row"><div><strong>${esc(row.subject_code)} - ${esc(title(row.subject_code))}</strong><small>${esc(row.quiz_date)}</small></div><b>${row.score}/${row.total_questions || 10}</b></div>`).join('') + '</div>'
      : 'No saved results yet.';
  }

  async function review(code) {
    select('reviewSubjectCards', code);
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
      const right = q.options.find((o) => o.ok)?.text || '';
      const ok = userAnswer === right;
      return `<article class="review-card ${ok ? 'ok' : 'bad'}"><span class="badge">Q${index + 1}</span> <span class="badge ${ok ? 'ok' : 'bad'}">${ok ? 'Correct' : 'Wrong'}</span><div class="qtext" style="margin-top:8px">${esc(q.en)}</div><div class="qml">${esc(q.ml)}</div><div class="answers"><div class="answerbox"><strong>Your Answer</strong>${esc(userAnswer)}</div><div class="answerbox"><strong>Correct Answer</strong>${esc(right)}</div></div></article>`;
    }).join('')}</div>`;
  }

  function card(target, code, name, kind) {
    const el = document.createElement('article');
    el.className = 'subject-card';
    el.dataset.code = code;
    const label = kind === 'review' ? 'Open Review' : kind === 'mock' ? 'Start Exam' : 'Start / View Result';
    el.innerHTML = `<span class="chip">${esc(code)}</span><h3>${esc(name)}</h3><p>${kind === 'daily' ? 'One cloud-saved attempt per day. Submitted answers are locked.' : kind === 'review' ? 'View previous-day answers.' : 'Official-pattern mock exam with graceful evaluation fallback.'}</p><button class="btn ${kind === 'mock' ? 'primary' : 'soft'}" type="button">${label}</button>`;
    el.onclick = () => {
      if (kind === 'daily') render(code);
      else if (kind === 'review') review(code);
      else location.href = (code === '1004' ? '/mock-exam-1004.html' : '/mock-exam.html?subject=' + encodeURIComponent(code));
    };
    $(target).appendChild(el);
  }

  function tick() {
    const now = new Date();
    const next = new Date(now);
    next.setHours(24, 0, 0, 0);
    const seconds = Math.max(0, Math.floor((next - now) / 1000));
    $('countdown').textContent = String(Math.floor(seconds / 3600)).padStart(2, '0') + ':' + String(Math.floor((seconds % 3600) / 60)).padStart(2, '0') + ':' + String(seconds % 60).padStart(2, '0');
  }

  function bind() {
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
    $('openDaily').onclick = () => show('dailyView');
    $('openMocks').onclick = () => show('mockView');
    $('openReview').onclick = () => show('reviewView');
    $('submitQuiz').onclick = submit;
    $('retryQuiz')?.remove();

    Object.entries(B.subjects).forEach(([code, value]) => {
      const name = title(code);
      card('dailySubjectCards', code, name, 'daily');
      card('reviewSubjectCards', code, name, 'review');
      if (code !== '1001' && code !== 'GK') card('mockSubjectCards', code, name, 'mock');
    });

    setInterval(tick, 1000);
    tick();
    mode('login');
    A.restore().then((result) => { if (result) enter(result.name); });
    stats();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind);
  else bind();
})();
