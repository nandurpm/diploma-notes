-- Purpose: 20260618 create mock exam submissions - Descriptive comment added for clarity
create table if not exists public.mock_exam_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  paper_id text not null,
  subject_code text not null,
  total_marks numeric(6,2) not null check (total_marks > 0),
  awarded_marks numeric(6,2) not null check (awarded_marks >= 0 and awarded_marks <= total_marks),
  percentage numeric(5,2) not null check (percentage >= 0 and percentage <= 100),
  status text not null default 'published' check (status = 'published'),
  evaluation_mode text not null default 'openai',
  model text not null default '',
  answers jsonb not null default '[]'::jsonb,
  evaluation jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists mock_exam_submissions_user_subject_created_idx
  on public.mock_exam_submissions (user_id, subject_code, created_at desc);

alter table public.mock_exam_submissions enable row level security;

grant select, insert on table public.mock_exam_submissions to authenticated;
revoke update, delete on table public.mock_exam_submissions from authenticated;
revoke all on table public.mock_exam_submissions from anon;

drop policy if exists "Students can view own mock exam submissions" on public.mock_exam_submissions;
create policy "Students can view own mock exam submissions"
  on public.mock_exam_submissions
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Students can insert own published mock exam submissions" on public.mock_exam_submissions;
create policy "Students can insert own published mock exam submissions"
  on public.mock_exam_submissions
  for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id
    and status = 'published'
    and subject_code = '1004'
    and paper_id = '1004-applied-chemistry-50'
    and total_marks = 50
    and awarded_marks >= 0
    and awarded_marks <= 50
    and percentage >= 0
    and percentage <= 100
  );
