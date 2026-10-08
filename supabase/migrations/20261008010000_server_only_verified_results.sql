-- SEC-4 phase 2: Result scores are authoritative only when written by a trusted server.
-- Requires 20261008000000_prepare_server_graded_quiz.sql first.
-- Apply AFTER the Worker and daily quiz browser client have been deployed with
-- server-side grading and persistence. Running this first blocks direct quiz
-- saves from older clients. Supabase service_role retains its own table grants.
begin;

alter table public.daily_quiz_results enable row level security;
alter table public.sample_paper_attempts enable row level security;

-- Remove the previous owner-writable policies. Owning a result must allow
-- reading it, not inventing scores or changing published feedback.
drop policy if exists daily_quiz_results_insert_own on public.daily_quiz_results;
drop policy if exists daily_quiz_results_update_own on public.daily_quiz_results;
drop policy if exists daily_quiz_results_delete_own on public.daily_quiz_results;
-- Observed on production but missing from repository migrations.
drop policy if exists daily_results_insert_own_once on public.daily_quiz_results;
drop policy if exists sample_paper_attempts_insert_own on public.sample_paper_attempts;
drop policy if exists sample_paper_attempts_update_own on public.sample_paper_attempts;
drop policy if exists sample_paper_attempts_delete_own on public.sample_paper_attempts;

-- Grants are an independent boundary even if someone adds a permissive RLS
-- policy later. Never revoke from service_role: the Worker writes with it.
revoke insert, update, delete on table
  public.daily_quiz_results, public.sample_paper_attempts
  from public, anon, authenticated;

-- Maintain student-owned result history; existing owner-only SELECT policies
-- continue enforcing auth.uid() = user_id for both tables.
grant select on table
  public.daily_quiz_results, public.sample_paper_attempts
  to authenticated;

commit;
