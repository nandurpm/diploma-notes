-- Purpose: 20260720 authoritative result integrity - Descriptive comment added for clarity
-- Security hardening for POLY PMNA result integrity.
-- Authoritative mock-exam scores are written only by the trusted Worker using
-- the Supabase service role after authenticating and evaluating the student.

begin;

-- Keep personal history readable by its owner, but remove all browser write
-- privileges and every known authenticated INSERT policy.
revoke insert, update, delete on table public.sample_paper_attempts from authenticated;
revoke all on table public.sample_paper_attempts from anon;
grant select on table public.sample_paper_attempts to authenticated;
grant select, insert, update, delete on table public.sample_paper_attempts to service_role;

drop policy if exists sample_paper_attempts_insert_own_1004 on public.sample_paper_attempts;
drop policy if exists sample_paper_insert_own on public.sample_paper_attempts;

-- Lock the identity/serial sequence too. This is defense in depth: the browser
-- no longer has table INSERT, but it should not receive sequence privileges.
do $$
declare
  sequence_name text := pg_get_serial_sequence('public.sample_paper_attempts', 'id');
begin
  if sequence_name is not null then
    execute format('revoke all on sequence %s from anon, authenticated', sequence_name);
    execute format('grant usage, select on sequence %s to service_role', sequence_name);
  end if;
end
$$;

-- Some repository revisions created a second mock result table. Harden it when
-- present without making this migration fail on projects where it does not exist.
do $$
begin
  if to_regclass('public.mock_exam_submissions') is not null then
    execute 'revoke insert, update, delete on table public.mock_exam_submissions from authenticated';
    execute 'revoke all on table public.mock_exam_submissions from anon';
    execute 'grant select, insert, update, delete on table public.mock_exam_submissions to service_role';
    execute 'drop policy if exists "Students can insert own published mock exam submissions" on public.mock_exam_submissions';
  end if;
end
$$;

-- Daily Quiz remains a personal browser-calculated practice feature. Record
-- that fact in every row so it cannot be confused with a verified examination.
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
