# Supabase Backend

Supabase configuration for the POLY PMNA quiz and authentication system.

## Directory Structure

| Directory | Contents |
|-----------|----------|
| [`functions/`](functions/) | Supabase Edge Functions (serverless) |
| [`migrations/`](migrations/) | SQL migration files for versioned tracking |

## Security & Authoritative Result Integrity

To prevent students from artificially spoofing exam scores or injecting fake mock-exam results via the browser console, the backend maintains a strict **authoritative security boundary**:

1. **Client-Calculated Practice (Daily Quiz):** Daily quizzes are client-calculated. The database enforces this by applying a check constraint that `evaluation_source` must equal `'client-practice'`. This explicitly separates practice logs from proctored exams.
2. **Server-Evaluated Exams (Mock Exams):** True examination scores (such as `sample_paper_attempts`) are evaluated server-side. **All write privileges (INSERT, UPDATE, DELETE) are revoked from the `authenticated` and `anon` browser roles.** Browser users have read-only (`SELECT`) access to view their own history.
3. **Delegation to Trusted Workers:** Evaluation is performed server-side by the `ask-poly-ai` Cloudflare Worker (or Supabase Edge Functions). Once validated and graded via LLMs and rubric engines, the trusted server writes the score to the database using the privileged `service_role` key.
4. **Sequence Lockdowns:** As part of defense-in-depth, the database auto-increment sequences (e.g., `sample_paper_attempts_id_seq`) are revoked from browser roles and granted only to the `service_role`.

---

## Database Schema

The Supabase database defines the following core public tables:

### 1. `profiles`
Extends the default Supabase metadata schema with platform-specific attributes.
- **Columns:**
  - `id` (`uuid`, primary key): References `auth.users(id)` cascade on delete.
  - `username` (`text`, unique, not null).
  - `role` (`text`, check constraint `role in ('student', 'admin')`, default `'student'`).
  - `created_at` / `updated_at` (`timestamptz`).
- **Row Level Security (RLS):** Enabled. Only the authenticated owner can `SELECT`, `INSERT`, or `UPDATE` their own profile record.

### 2. `daily_quiz_results`
Stores detailed logs of daily practice quizzes completed by students.
- **Columns:**
  - `id` (`bigint`, primary key): Generated always as identity.
  - `user_id` (`uuid`, not null): References `auth.users(id)` cascade on delete.
  - `quiz_date` (`date`, not null).
  - `subject_code` (`text`, default `'UNKNOWN'`): Subject course code constraint (e.g., `'1001'`, `'1002'`, `'1003'`, `'1004'`, `'2002'`, `'2003'`, `'GK'`).
  - `score` (`integer`, default 0).
  - `best_score` (`integer`, default 0).
  - `total_questions` (`integer`, default 10).
  - `retry_used` (`boolean`, default false).
  - `completed` (`boolean`, default false).
  - `answers` (`jsonb`): User answers mapping.
  - `question_ids` (`integer[]`): List of evaluated quiz questions.
  - `evaluation_source` (`text`, default `'client-practice'`): Enforced by check constraint.
  - `submitted_at` / `created_at` / `updated_at` (`timestamptz`).
- **Unique Constraint:** `(user_id, quiz_date, subject_code)` prevents duplicate records for the same subject on any single calendar date.
- **Row Level Security (RLS):** Enabled. Only the authenticated owner can `SELECT`, `INSERT`, or `UPDATE` their own quiz history.

### 3. `sample_paper_attempts`
Authoritative storage for verified, server-evaluated mock exam results.
- **Columns:**
  - `id` (`integer`, primary key): Serial ID with revoked browser sequence permissions.
  - `user_id` (`uuid`, not null): References `auth.users(id)`.
  - `subject_code` (`text`): Subject constraint allowing any valid four-digit course code or `GK` (with optional suffix letters, e.g. `'1004'`, `'2001'`).
  - `paper_code` (`text`): Identifier of the specific mock exam paper (e.g., `'1004-applied-chemistry-model-75'`).
  - `score` / `max_score` (`integer` or `numeric`).
  - `status` (`text`, default `'published'`).
  - `answers` (`jsonb`): Student selections and written essay responses.
  - `ai_feedback` (`jsonb`): Comprehensive LLM-generated grading rubrics, missing points, and question-by-question feedback.
  - `submitted_at` / `published_at` / `updated_at` (`timestamptz`).
- **Row Level Security (RLS):** Enabled. Authenticated owners can `SELECT` their own history. No browser write privileges. Writes are restricted to `service_role` (Server-side Worker).

### 4. `mock_exam_submissions`
Secondary/legacy table for mock-exam submissions.
- **Columns:** Identical or similar attributes including `evaluation_mode` (`'openai'`), `model`, `answers`, and `evaluation` JSON structures.
- **Row Level Security (RLS):** Enabled. Authenticated owners can `SELECT` their own records. Browser writes are revoked.

---

## Pre-compiled SQL Assets & Triggers

To aid in onboarding and setting up development databases:
* **[`daily-quiz-schema.sql`](daily-quiz-schema.sql):** Standard initialization SQL for table scaffolding, security policies, and default grants.
* **[`extend-daily-quiz-subjects.sql`](extend-daily-quiz-subjects.sql):** Schema modifier expanding the `daily_quiz_results` subject code array to support Semester 2 subjects.
* **Automatic Updates Trigger (`touch_updated_at`):** A custom PL/pgSQL function and database trigger executing `BEFORE UPDATE` on `profiles` and `daily_quiz_results` to guarantee consistent timestamp auditing:
  ```sql
  create or replace function public.touch_updated_at()
  returns trigger
  language plpgsql
  as $$
  begin
    new.updated_at = now();
    return new;
  end;
  $$;
  ```

---

## Relationship to Frontend

The client-side scripts (`quiz-core.js`, `quiz-auth.js`, `quiz-play.js`, `mock-exam-service.js`) communicate with Supabase via the client library:
- **Authentication:** Sign-up, login, and password resets occur directly from the client.
- **Client Practice Logging:** Writes personal practice scores directly to `daily_quiz_results`.
- **Authoritative Score Checking:** Fetches verified history from `sample_paper_attempts` using RLS read permissions.
