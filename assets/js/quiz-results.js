/* Purpose: Quiz results - Descriptive comment added for clarity */
window.PolyQuizResults = (() => {
  const LOCAL = 'poly-quiz-results-v4-single-submit';
  const memoryStore = Object.create(null);

  const dateKey = (d) => {
    d = d ? new Date(d) : new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
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

    if (a?.guest || !a?.user || !db) {
      saveLocal(row);
      return { local: true, remote: false, guest: true, row };
    }

    try {
      const existing = await db
        .from('daily_quiz_results')
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

      const payload = {
        user_id: a.user.id,
        quiz_date: row.quiz_date,
        subject_code: row.subject_code,
        score: row.score,
        best_score: row.score,
        total_questions: row.total_questions || 10,
        retry_used: false,
        completed: true,
        answers: row.answers,
        question_ids: numericQuestionIds(row.question_ids),
        question_keys: row.question_keys,
        attempt_count: 1,
        first_score: row.score,
        retry_score: null,
        submitted_at: row.submitted_at,
        updated_at: new Date().toISOString()
      };

      const inserted = await db
        .from('daily_quiz_results')
        .insert(payload)
        .select('quiz_date,subject_code,score,best_score,total_questions,submitted_at,answers,question_ids,question_keys,attempt_count,completed,created_at')
        .single();

      if (inserted.error) {
        if (inserted.error.code === '23505') {
          const latest = await today(row.subject_code);
          return { local: true, remote: true, alreadySubmitted: true, row: latest || row };
        }
        throw inserted.error;
      }

      saveLocal(inserted.data || row);
      return { local: true, remote: true, row: inserted.data || row };
    } catch (error) {
      console.error('Remote quiz save failed', error);
      saveLocal(row);
      return { local: true, remote: false, fallback: true, error, row };
    }
  }

  return { dateKey, save, recent, today, previous, localAll: localRows };
})();
