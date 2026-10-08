# SEC-4: Verified Results Rollout

This change separates **public practice grading** from **authenticated,
server-authoritative result persistence**. Do not apply the SQL migration before
the Worker and static quiz client are deployed and verified together.

## Order of operations

1. Run `npm test` from `workers/ask-poly-ai` and verify the updated daily quiz
   frontend in a browser with a test student account.
2. Deploy the Worker code first. Confirm `/api/grade-daily-quiz` accepts a JWT
   and returns `savedOnline: true` with a server-calculated result. Test a guest
   submission separately: it must return `savedOnline: false`.
3. Deploy the static site including `quiz-results.js`, `quiz-engine.js`,
   `daily-quiz.html` (new script version), and `sw.js` (version-aware caching).
   Verify with DevTools that refreshed users run the new quiz scripts.
4. Apply `supabase/migrations/20261008000000_server_only_verified_results.sql`
   through the approved Supabase migration process. This prevents **all**
   authenticated direct writes, including to the earlier
   `daily_results_insert_own_once` policy found only in the live database.
5. Check a real authenticated first submission, duplicate submission,
   history retrieval, guest grading, and mock-exam result saving.

## Read-only post-migration SQL verification

```sql
select c.relname,
       c.relrowsecurity as rls_enabled,
       has_table_privilege('authenticated', c.oid, 'SELECT') as can_read,
       has_table_privilege('authenticated', c.oid, 'INSERT') as can_insert,
       has_table_privilege('authenticated', c.oid, 'UPDATE') as can_update,
       has_table_privilege('authenticated', c.oid, 'DELETE') as can_delete,
       has_table_privilege('service_role', c.oid, 'INSERT') as service_can_insert
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in ('daily_quiz_results', 'sample_paper_attempts');
```

Both tables must have RLS enabled; authenticated role must have SELECT but no
INSERT/UPDATE/DELETE; service role must retain INSERT. Also inspect
`pg_policies` for any remaining INSERT/UPDATE/DELETE policies.

## Risks and limitations

- A score is server-graded, not necessarily proof of an honest test: users can
  still practice or inspect questions before submitting. A proctored assessment
  requires stronger controls than a study quiz.
- Previously cached static clients may temporarily attempt obsolete direct
  writes. Do not revoke database writes until current client rollout is verified.
- No automatic Supabase migration deployment is configured in this repository.
- `quiz-portal-api` or other non-repository integrations need verification in
  staging if they write to `daily_quiz_results`.
- Original historical scores are not re-graded by this change.
