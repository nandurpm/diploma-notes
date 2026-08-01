-- Purpose: 20260618 mock exam 1004 75 marks - Descriptive comment added for clarity
drop policy if exists sample_paper_attempts_insert_own_1004 on public.sample_paper_attempts;
create policy sample_paper_attempts_insert_own_1004
on public.sample_paper_attempts
for insert
to authenticated
with check (
  (select auth.uid()) = user_id
  and subject_code = '1004'
  and paper_code in ('1004-applied-chemistry-50', '1004-applied-chemistry-model-75')
  and status = 'published'
  and score is not null
  and max_score in (50, 75)
  and score >= 0
  and score <= max_score
);
