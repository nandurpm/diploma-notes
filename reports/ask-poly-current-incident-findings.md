# Ask POLY Current Incident Findings

Date: 2026-08-22

## Root cause

The production browser request was rejected by the primary Worker with HTTP 400: `The request contains invalid input.`. The captured payload contained six saved history entries, including a 2,352-character assistant answer with a long source list. The Worker validator allows at most 1,000 characters per history entry. Every later question in that saved chat therefore failed validation before reaching the AI provider.

The browser then entered its configured failover path, but the UI still ended in the generic unavailable state because the primary validation error occurred after a long retry sequence. This explains why ordinary questions repeatedly showed the same fallback message in the affected saved conversation.

## Confirmed live routes

- `https://api.polypmna.dpdns.org/health` returns HTTP 200 and `configured: true`.
- `https://hwobooljdvynsajtrvnk.supabase.co/functions/v1/ask-poly-proxy/health` returns HTTP 200 and `configured: true`.
- POST `https://api.polypmna.dpdns.org/api/ask-poly` from curl returns HTTP 403 with `Automated clients are not permitted.`; this is the intended anti-automation guard and does not indicate a browser failure.
- POST `https://hwobooljdvynsajtrvnk.supabase.co/functions/v1/ask-poly-proxy` returns HTTP 404 because the Supabase function expects `/api/ask-poly` below its function base path.
- POST `https://hwobooljdvynsajtrvnk.supabase.co/functions/v1/ask-poly-proxy/api/ask-poly` returns HTTP 200 with an answer and CORS headers.

## Fix applied

The browser now caps each saved history entry at 1,000 characters before sending it to the primary or fallback AI route and removes empty entries. This keeps the client payload aligned with the Worker contract while preserving the newest question and recent conversation context. The corrected Supabase fallback path and grounding-QA route stub remain in place.

## Validation

- `node --check` passes for the changed JavaScript files.
- The local grounding-QA suite passes with zero console errors, no horizontal overflow, 42 Revision 2026 programmes, and 4,091 subject records.
- The existing Worker suite reports 79/80 passing tests; the single failure is an unrelated pre-existing comments-health deep-equality mismatch, not related to this repair.
- A live browser capture confirmed the failure trigger: an assistant history entry of 2,352 characters, followed by HTTP 400 from the primary route.
