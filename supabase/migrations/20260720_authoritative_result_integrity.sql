-- Security hardening for POLY PMNA result integrity.
-- Apply this migration to the connected Supabase project before treating online
-- mock-exam history as authoritative.

begin;

-- Mock-exam scores must be inserted only by the trusted server/Worker using the
-- service role after authentication and evaluation. Browsers retain SELECT access
-- to their own rows but cannot create or modify authoritative scores directly.
revoke insert, update, delete on table public.sample_paper_attempts from authenticated;
revoke all on table public.sample_paper_attempts from anon;

drop policy if exists sample_paper_attempts_insert_own_1004 on public.sample_paper_attempts;
drop policy if exists "Students can insert own published mock exam submissions" on public.mock_exam_submissions;

revoke insert, update, delete on table public.mock_exam_submissions from authenticated;
revoke all on table public.mock_exam_submissions from anon;

-- Daily quizzes remain personal practice records generated in the browser. Mark
-- that fact in the database so they cannot be confused with verified examination
-- results or used for trusted rankings.
alter table public.daily_quiz_results
  add column if not exists evaluation_source text not null default 'client-practice';

alter table public.daily_quiz_results
  drop constraint if exists daily_quiz_results_evaluation_source_check;

alter table public.daily_quiz_results
  add constraint daily_quiz_results_evaluation_source_check
  check (evaluation_source = 'client-practice');

comment on column public.daily_quiz_results.evaluation_source is
  'Client-calculated personal practice score. Not an authoritative or proctored examination result.';

comment on table public.sample_paper_attempts is
  'Verified mock-exam attempts inserted only by trusted server-side evaluation code.';

commit;
