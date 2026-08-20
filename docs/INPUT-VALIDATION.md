# Input Validation and Injection-Resistance Contract

All external data is treated as untrusted. The browser validates for usability, but the Worker and database boundary remain authoritative. The application does not construct SQL or shell commands from user input: database access uses Supabase/PostgREST query builders or fixed REST paths, and server-side process execution is not exposed to request data.

| Input surface | Validation and safety boundary |
|---|---|
| Login, signup, password-reset forms | Browser constraints validate email and password length; Supabase Auth remains responsible for credential parsing and hashing. User-facing errors are generic. |
| Mock-exam query parameter | `subject` is normalized and accepted only when it matches `^[0-9]{4}[A-Z]?$` before it is used as a registry key or rendered. |
| Ask POLY API body | JSON object only; unknown top-level fields are rejected; message, context, history, nested context, diagram metadata, booleans, and strings have strict types and bounds. History roles are limited to `user` or `assistant`. |
| Daily quiz grading body | JSON object with allowlisted `subject`, optional `mode`, and `answers`; subject format, mode values, exact answer count, question IDs, and answer strings are checked. |
| Mock-exam evaluation body | Allowlisted paper identifiers, optional title, bounded selections, exactly 23 answer objects, strict IDs, bounded answer text, and ignored legacy rubric metadata. Client rubrics never influence server grading. |
| File input | Only non-empty PNG, JPEG, WebP, or PDF files under 1.8 MB are accepted. Filename separators/control characters are rejected, extensions are checked, and file signatures are verified before local reading. Raw data URLs are not sent to the API. |
| API content types | Worker API POST requests reject explicit non-JSON content types, preventing multipart uploads and ambiguous payloads from reaching handlers. |
| Query/database inputs | Identifiers are format-constrained and bounded. User-owned database operations use fixed table names and ownership filters with RLS as the authoritative boundary. |
| HTML rendering | User-facing text is assigned through `textContent` or escaped before HTML construction. Server responses are JSON and do not execute user-provided markup or scripts. |

The Worker rejects malformed input with generic HTTP 400/415 responses and logs only a redacted validation event. User content, credentials, uploads, and request bodies are not included in security logs. The server does not evaluate user input as JavaScript, SQL, shell syntax, or filesystem paths.

## Upload limitation

The current Ask POLY API accepts attachment metadata only. It does not accept raw multipart files or data URLs. A future server-side file-inspection endpoint must use an isolated scanner, content-type detection from file bytes, size and decompression limits, generated storage names, non-executable storage, and a strict allowlist before exposing content to an AI provider.
