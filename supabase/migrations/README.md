# Database Migrations

This folder contains the authoritative, chronological SQL migration files for the Supabase database. These migrations capture the evolution of the database schema, including tables, indexes, constraints, and Row Level Security (RLS) policies.

---

## Chronological Migration Registry

All migrations must be applied in sequential order. The active migrations in this repository are:

| Migration File | Date Code | Scope / Purpose |
|----------------|-----------|-----------------|
| [`20260618_create_mock_exam_submissions.sql`](20260618_create_mock_exam_submissions.sql) | 2026-06-18 | **Initial Mock Exams Table:** Scaffolds `public.mock_exam_submissions`, defines index boundaries on `(user_id, subject_code, created_at desc)`, enables RLS, and grants authenticated clients the ability to select their own records and insert published submissions specifically for Chemistry course `1004` (50 marks). |
| [`20260618_mock_exam_1004_75_marks.sql`](20260618_mock_exam_1004_75_marks.sql) | 2026-06-18 | **Expanded Marks Check:** Replaces the insertion policy constraint for `sample_paper_attempts` to accommodate both 50-mark and 75-mark Applied Chemistry models (`1004-applied-chemistry-50` / `1004-applied-chemistry-model-75`). |
| [`20260619_fix_daily_quiz_subject_results.sql`](20260619_fix_daily_quiz_subject_results.sql) | 2026-06-19 | **Daily Quiz & Roles Normalization:** Adds a default `'student'` / `'admin'` user role configuration to the profile schema. Adds `subject_code` tracking to daily quiz results and establishes a strict unique index `(user_id, quiz_date, subject_code)` to enable multiple subject practices per day per user while keeping single-subject results clean. |
| [`20260720_authoritative_result_integrity.sql`](20260720_authoritative_result_integrity.sql) | 2026-07-20 | **Security Hardening (Authoritative Results):** Strips all authenticated and anonymous browser INSERT/UPDATE/DELETE write permissions on `sample_paper_attempts` and `mock_exam_submissions` tables to lock down score inputs. Restricts writes strictly to the trusted backend server via `service_role`. Implements defense-in-depth by revoking auto-increment sequence access from the browser. Adds the check constraint `evaluation_source = 'client-practice'` to the daily quiz table to explicitly label browser-logged logs. |
| [`20260720_deduplicate_sample_paper_select_policy.sql`](20260720_deduplicate_sample_paper_select_policy.sql) | 2026-07-20 | **Policy Cleanup:** Removes redundant and duplicate `sample_paper_select_own` policies, standardizing on a single, secure select ownership rule. |

---

## Applying Migrations

Database schema changes can be pushed to local development and staging environments using the standard Supabase CLI:

```bash
# Push all pending migrations to the active database
supabase db push

# Generate a new blank migration file for tracking changes
supabase migration new <name_of_migration>
```

---

## Structural Guidelines

When writing or modifying database migrations for this repository, you must adhere to the following guidelines:

1. **Idempotency:** Always use safe schema-building declarations such as `CREATE TABLE IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`, and `DROP POLICY IF EXISTS` before adding a policy.
2. **Defensive RLS Configuration:** Row Level Security (RLS) must be explicitly enabled on every table containing personal user data using `ALTER TABLE <table_name> ENABLE ROW LEVEL SECURITY`.
3. **Implicit Browser Write Revocation:** Never allow browser-based JavaScript to insert or update authoritative scores or grades. Maintain the authoritative security boundary by restricting write privileges on results tables (`sample_paper_attempts`) to Deno Edge Functions and Cloudflare Workers using the privileged `service_role` client.
4. **Descriptive Intent:** Start every migration file with a `-- Purpose` comment outlining the technical motivation for the script.
