# Supabase Backend

Supabase configuration for the POLY PMNA quiz and authentication system.

## Directory Structure

| Directory | Contents |
|-----------|----------|
| `functions/` | Supabase Edge Functions (serverless) |
| `migrations/` | Database migration files |

## Database Schema

The Supabase database stores:

- **Users**: Quiz user accounts (registration, login)
- **Quiz Sessions**: Individual quiz play-throughs and scores
- **Question Banks**: Per-subject question repositories
- **Leaderboards**: Global and subject-specific rankings

## Edge Functions

| Function | Purpose |
|----------|---------|
| `evaluate-quiz` | Server-side quiz answer evaluation and scoring |

## Migrations

Migration files are numbered sequentially and should be applied in order. They define:

- User tables and authentication setup
- Quiz session and result tables
- Question bank schema
- Indexes for performance

## Configuration

Supabase configuration is managed through the `supabase/config.toml` file (if present) and environment variables set in the hosting environment.

## Relationship to Frontend

The frontend quiz scripts (`quiz-core.js`, `quiz-auth.js`, `quiz-play.js`) communicate with Supabase via the JavaScript client library for:

- User authentication (sign up, sign in, sign out)
- Quiz session creation and submission
- Leaderboard queries
- Question bank access (for authenticated users)
