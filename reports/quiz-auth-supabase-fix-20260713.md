# Quiz Auth / Supabase Fix - 2026-07-13

## Problem

Login and Register on `daily-quiz.html` showed only `Failed to fetch`.

## Root cause

The Supabase project used by the quiz page was not running. Project `hwobooljdvynsajtrvnk` was returned by Supabase as `INACTIVE`, so browser authentication requests could not reach the Auth service.

## Supabase action taken

The project was restored through the Supabase Management API. Current restore state after the action: `COMING_UP`.

## GitHub action taken

Updated:

- `assets/js/quiz-auth.js`
- `daily-quiz.html`

Changes:

- Added proper network / paused-project error handling for Login, Register, Forgot Password and Password Update.
- Replaced the raw browser error `Failed to fetch` with a clear message explaining that the online login service is waking up or unreachable.
- Kept `Continue as Guest` available while Supabase is waking.
- Refreshed cache-busting to `20260713-quiz-auth1`.

## User instruction

After deployment, hard refresh the browser with `Ctrl + F5`. If the Supabase project was just restored, wait 1-2 minutes before testing Login/Register again.
