/* Purpose: Quiz results - Descriptive comment added for clarity */
window.PolyQuizResults = (() => {
  const LOCAL = 'poly-quiz-results-v4-single-submit';
  const memoryStore = Object.create(null);

  const dateKey = (d) => {
    const value = d ? new Date(d) : new Date();
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit'
    }).formatToParts(value);
    const pick = (type) => parts.find((part) => part.type === type)?.value || '';
    return `${pick('year')}-${pick('month')}-${pick('day')}`;
  };

  const auth = () => window.PolyQuizAuth;
  const stateKey = () => auth()?.user?.id ? 'user:' + auth().user.id : 'guest';

  const all = () => {
    try { return JSON.parse(localStorage.getItem(LOCAL) || '{}'); }
    catch { return memoryStore[LOCAL] || {}; }
  };

  const localRows = () => all()[stateKey()] || [];

  function saveLocal(row) {
    const obj = all();
    const key = stateKey();
    const rows = obj[key] || [];
    obj[key] = [row, ...rows.filter((r) => !(r.quiz_date === row.quiz_date && r.subject_code === row.subject_code))].slice(0, 150);
    memoryStore[LOCAL] = obj;
    try { localStorage.setItem(LOCAL, JSON.stringify(obj)); }
    catch (error) { console.warn('Local quiz storage is blocked. Keeping result in memory for this tab only.', error); }
  }

  function mergeRows(remoteRows, localRowsList) {
    const map = new Map();
    [...localRowsList, ...remoteRows].forEach((row) => {
      map.set(`${row.quiz_date}:${row.subject_code}`, row);
    });
    return [...map.values()].sort((a, b) => String(b.submitted_at || b.created_at || '').localeCompare(String(a.submitted_at || a.created_at || '')));
  }

  async function remoteRows(limit = 100) {
    const a = auth();
    const db = a?.getClient?.();
    if (a?.guest || !a?.user || !db) return [];
    const result = await db
      .from('daily_quiz_results')
      .select('quiz_date,subject_code,score,best_score,total_questions,submitted_at,answers,question_ids,question_keys,attempt_count,completed,created_at')
      .eq('user_id', a.user.id)
      .order('submitted_at', { ascending: false })
      .limit(limit);
    if (result.error) throw result.error;
    return Array.isArray(result.data) ? result.data : [];
  }

  async function recent() {
    try {
      const remote = await remoteRows(100);
      return mergeRows(remote, localRows());
    } catch (error) {
      console.error('Remote quiz load failed', error);
      return localRows();
    }
  }

  async function today(subject) {
    const todayKey = dateKey();
    const rows = await recent();
    return rows.find((row) => row.quiz_date === todayKey && row.subject_code === subject) || null;
  }

  async function previous(subject) {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const key = dateKey(d);
    const rows = await recent();
    return rows.find((row) => row.quiz_date === key && row.subject_code === subject) || null;
  }

  function numericQuestionIds(ids) {
    return (ids || []).map((value, index) => {
      const numeric = Number(value);
      return Number.isInteger(numeric) && numeric > 0 ? numeric : index + 1;
    });
  }

  async function save(row) {
    const a = auth();
    const db = a?.getClient?.();
    const guest = Boolean(a?.guest || !a?.user || !db);
    try {
      if (!guest) {
        const existing = await db.from('daily_quiz_results')
          .select('quiz_date,subject_code,score,best_score,total_questions,submitted_at,answers,question_ids,question_keys,attempt_count,completed,created_at')
          .eq('user_id', a.user.id)
          .eq('quiz_date', row.quiz_date)
          .eq('subject_code', row.subject_code)
          .maybeSingle();
        if (existing.error) throw existing.error;
        if (existing.data) {
          saveLocal(existing.data);
          return { local: true, remote: true, alreadySubmitted: true, row: existing.data };
        }
      }

      const headers = { 'Content-Type': 'application/json' };
      if (!guest) {
        const { data, error } = await db.auth.getSession();
        if (error || !data?.session?.access_token) throw new Error('Sign in again to save your quiz result.');
        headers.Authorization = `Bearer ${data.session.access_token}`;
      }

      // The browser submits only answers. A privileged Worker verifies the
      // identity, recomputes the score and writes the authoritative row.
      const response = await fetch('https://api.polypmna.dpdns.org/api/grade-daily-quiz', {
        method: 'POST',
        headers,
        cache: 'no-store',
        body: JSON.stringify({ subject: row.subject_code, answers: row.answers })
      });
      const graded = await response.json().catch(() => ({}));
      if (response.status === 409 && !guest) {
        const latest = (await remoteRows()).find((item) =>
          item.quiz_date === row.quiz_date && item.subject_code === row.subject_code);
        if (latest) {
          saveLocal(latest);
          return { local: true, remote: true, alreadySubmitted: true, row: latest };
        }
      }
      if (!response.ok) throw new Error(graded.error || 'Secure quiz grading failed.');

      const stored = guest
        ? {
            ...row,
            score: graded.score,
            best_score: graded.score,
            answers: { ...row.answers, __verified_review: graded.review }
          }
        : graded.row;
      if (!stored || typeof stored.score !== 'number' || (!guest && !graded.savedOnline)) {
        throw new Error('The server could not confirm a verified quiz result.');
      }
      saveLocal(stored);
      return { local: true, remote: !guest, guest, row: stored };
    } catch (error) {
      // Never mark an unsaved authenticated score as submitted or verified.
      console.error('Secure quiz save failed', error);
      return { local: false, remote: false, guest: false, fallback: true, error, row };
    }
  }

  return { dateKey, save, recent, today, previous, localAll: localRows };
})();
