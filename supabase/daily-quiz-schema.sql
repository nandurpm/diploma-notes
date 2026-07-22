-- Purpose: Daily quiz schema - Descriptive comment added for clarity
-- Supabase schema for Diploma Notes Daily Quiz
-- Project: diploma-notes (hwobooljdvynsajtrvnk)
-- This schema has already been applied to the connected Supabase project.

/* User profile table extending the default Supabase auth.users */
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  role text not null default 'student' check (role in ('student', 'admin'))
);

/* Table to store daily quiz performance for each student and subject */
create table if not exists public.daily_quiz_results (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  quiz_date date not null,
  subject_code text not null default 'UNKNOWN',
  score integer not null default 0 check (score >= 0),
  best_score integer not null default 0 check (best_score >= 0),
  total_questions integer not null default 10 check (total_questions > 0),
  retry_used boolean not null default false,
  completed boolean not null default false,
  answers jsonb not null default '{}'::jsonb,
  question_ids integer[] not null default '{}',
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint daily_quiz_results_subject_code_check check (subject_code = any (array['1001', '1002', '1003', '1004', '2001', '2002', '2003', 'GK', 'UNKNOWN'])),
  unique (user_id, quiz_date, subject_code)
);

alter table public.profiles enable row level security;
alter table public.daily_quiz_results enable row level security;

grant usage on schema public to anon, authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update on public.daily_quiz_results to authenticated;
grant usage, select on sequence public.daily_quiz_results_id_seq to authenticated;

drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "daily_results_select_own" on public.daily_quiz_results;
drop policy if exists "daily_results_insert_own" on public.daily_quiz_results;
drop policy if exists "daily_results_update_own" on public.daily_quiz_results;

/* Row Level Security: Allow users to view only their own profile */
create policy "profiles_select_own" on public.profiles
for select to authenticated
using ((select auth.uid()) = id);

create policy "profiles_insert_own" on public.profiles
for insert to authenticated
with check ((select auth.uid()) = id);

create policy "profiles_update_own" on public.profiles
for update to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

/* Row Level Security: Allow users to view only their own quiz results */
create policy "daily_results_select_own" on public.daily_quiz_results
for select to authenticated
using ((select auth.uid()) = user_id);

create policy "daily_results_insert_own" on public.daily_quiz_results
for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy "daily_results_update_own" on public.daily_quiz_results
for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
before update on public.profiles
for each row execute function public.touch_updated_at();

drop trigger if exists daily_results_touch_updated_at on public.daily_quiz_results;
create trigger daily_results_touch_updated_at
before update on public.daily_quiz_results
for each row execute function public.touch_updated_at();
