-- Enforce ownership at the database boundary. Client-side filters are not
-- authorization; these policies remain effective when a request is forged.

alter table if exists public.profiles enable row level security;
alter table if exists public.daily_quiz_results enable row level security;
alter table if exists public.sample_paper_attempts enable row level security;

-- Profiles use the auth user UUID as their primary key.
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own
  on public.profiles for select
  to authenticated
  using (id = (select auth.uid()));

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own
  on public.profiles for insert
  to authenticated
  with check (id = (select auth.uid()));

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own
  on public.profiles for update
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

drop policy if exists profiles_delete_own on public.profiles;
create policy profiles_delete_own
  on public.profiles for delete
  to authenticated
  using (id = (select auth.uid()));

-- Quiz and mock-exam records use user_id as their ownership column.
drop policy if exists daily_quiz_results_select_own on public.daily_quiz_results;
create policy daily_quiz_results_select_own
  on public.daily_quiz_results for select
  to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists daily_quiz_results_insert_own on public.daily_quiz_results;
create policy daily_quiz_results_insert_own
  on public.daily_quiz_results for insert
  to authenticated
  with check (user_id = (select auth.uid()));

drop policy if exists daily_quiz_results_update_own on public.daily_quiz_results;
create policy daily_quiz_results_update_own
  on public.daily_quiz_results for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists daily_quiz_results_delete_own on public.daily_quiz_results;
create policy daily_quiz_results_delete_own
  on public.daily_quiz_results for delete
  to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists sample_paper_attempts_select_own on public.sample_paper_attempts;
create policy sample_paper_attempts_select_own
  on public.sample_paper_attempts for select
  to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists sample_paper_attempts_insert_own on public.sample_paper_attempts;
create policy sample_paper_attempts_insert_own
  on public.sample_paper_attempts for insert
  to authenticated
  with check (user_id = (select auth.uid()));

drop policy if exists sample_paper_attempts_update_own on public.sample_paper_attempts;
create policy sample_paper_attempts_update_own
  on public.sample_paper_attempts for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists sample_paper_attempts_delete_own on public.sample_paper_attempts;
create policy sample_paper_attempts_delete_own
  on public.sample_paper_attempts for delete
  to authenticated
  using (user_id = (select auth.uid()));

-- The worker uses a service role only after deriving user_id from the
-- authenticated bearer token. It never accepts user_id from the request body.
