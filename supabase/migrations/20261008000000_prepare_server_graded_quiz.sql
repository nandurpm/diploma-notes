-- SEC-4 phase 1 (backwards-compatible): prepare daily-quiz schema for
-- Worker-verified scores and the active subject bank.
-- Apply this BEFORE deploying the new Worker; existing client-practice rows
-- and existing authenticated INSERT privileges remain valid during rollout.
begin;

alter table public.daily_quiz_results
  drop constraint if exists daily_quiz_results_evaluation_source_check;
alter table public.daily_quiz_results
  add constraint daily_quiz_results_evaluation_source_check
  check (evaluation_source in ('client-practice', 'worker-graded'));

-- Preserve every legacy subject code while adding the current public bank.
alter table public.daily_quiz_results
  drop constraint if exists daily_quiz_results_subject_code_check;
alter table public.daily_quiz_results
  add constraint daily_quiz_results_subject_code_check
  check (subject_code in (
    '1001', '1002', '1003', '1004',
    '2002', '2003', 'GK',
    '2005', '3001', '3011', '3012', '6012',
    '2002B', '2003A', '6024A'
  ));

commit;
