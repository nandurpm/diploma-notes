-- Purpose: Extend daily quiz subjects - Descriptive comment added for clarity
-- Applied to Supabase project hwobooljdvynsajtrvnk.
-- Expands syllabus daily quiz storage to include Semester 2 subjects while preserving GK.

alter table public.daily_quiz_results
  drop constraint if exists daily_quiz_results_subject_code_check;

alter table public.daily_quiz_results
  add constraint daily_quiz_results_subject_code_check
  check (subject_code = any (array[
    '1001'::text,
    '1002'::text,
    '1003'::text,
    '1004'::text,
    '2002'::text,
    '2003'::text,
    'GK'::text
  ]));
