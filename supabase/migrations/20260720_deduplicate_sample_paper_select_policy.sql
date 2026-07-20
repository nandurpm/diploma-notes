-- Keep one ownership policy for mock-exam history reads.
-- Both existing policies used the same auth.uid() = user_id condition.

drop policy if exists sample_paper_select_own on public.sample_paper_attempts;
