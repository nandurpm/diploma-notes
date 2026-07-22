-- Purpose: 20260619 fix daily quiz subject results - Descriptive comment added for clarity
-- Allow one saved daily quiz result per user, date and subject.
alter table public.profiles
  add column if not exists role text not null default 'student';

alter table public.profiles
  drop constraint if exists profiles_role_check;

alter table public.profiles
  add constraint profiles_role_check
  check (role in ('student', 'admin'));

alter table public.daily_quiz_results
  add column if not exists subject_code text not null default 'UNKNOWN';

alter table public.daily_quiz_results
  drop constraint if exists daily_quiz_results_user_id_quiz_date_key;

alter table public.daily_quiz_results
  drop constraint if exists daily_quiz_results_subject_code_check;

alter table public.daily_quiz_results
  add constraint daily_quiz_results_subject_code_check
  check (subject_code = any (array['1001', '1002', '1003', '1004', '2001', '2002', '2003', 'GK', 'UNKNOWN']));

create unique index if not exists daily_quiz_results_user_date_subject_uidx
  on public.daily_quiz_results(user_id, quiz_date, subject_code);
