# POLY PMNA

POLY PMNA is a static-first Kerala Polytechnic study portal published from the `main` branch of `nandurpm/diploma-notes` to `https://polypmna.dpdns.org/`.

## Public areas

- Revision 2026: 38 programme pages and dedicated content under `revision-2026-content/`
- Revision 2021: 43 department pages, legacy lessons under `lessons/` and notes under `notes/`
- Revision 2015 archive: `materials-2015.html`
- Ask POLY AI: `ask-poly.html` with a Cloudflare Worker primary route and Supabase relay backup
- Daily Quiz and supported mock exams: `daily-quiz.html` and `mock-exam-1004.html`
- Student calculators and helpers: `tools.html`

## Source-of-truth rules

- Official curriculum and course links must come from SITTTR Kerala.
- Revision 2026 and Revision 2021 content must never share lesson or notes paths.
- Revision 2026 lessons: `revision-2026-content/lessons/lessons-CODE.html`
- Revision 2026 notes: `revision-2026-content/notes/downloadable-notes-CODE.pdf`
- Revision 2021 lessons: `lessons/lessons-CODE.html`
- Do not label historical snapshot data as current without recording the source date.

## Architecture

The public site is vanilla HTML, CSS and JavaScript. Major data and service areas are:

- `assets/js/subjects.js`: Revision 2021 subject records
- Revision 2026 generated department HTML and supporting manifests
- `workers/ask-poly-ai/`: Cloudflare Worker for AI questions and mock-exam evaluation
- `supabase/`: account, quiz and result schemas/functions/migrations
- `.github/workflows/`: validation, content generation, deployment and post-deploy verification
- `tools/`: repository audits, page generation and maintenance scripts

## Security and result integrity

- Supabase public/anon keys may appear in browser code; service-role keys must never be committed.
- Authoritative mock-exam scores must be written only by trusted server-side code after authentication and evaluation.
- Browser rubric fallback scores are provisional and must not be uploaded as authoritative results.
- Daily Quiz scores are personal practice records, not official or proctored marks.
- Apply `supabase/migrations/20260720_authoritative_result_integrity.sql` to enforce the current result policy.

## Ask POLY deployment secrets

The deployment workflow can use these GitHub repository secrets:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_AI_API_TOKEN`
- one or more AI provider keys such as `OPENAI_API_KEY`, `NVIDIA_API_KEY`, `GOOGLE_AI_STUDIO`
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` for verified server-side mock-exam storage

Never put secret values in HTML, JavaScript, reports, issues or workflow logs.

## Deployment contract

Production must publish the repository root from `main` and run:

```bash
python tools/write_build_info.py
```

The live `/build-info.json` commit must match the deployed `main` commit. `.github/workflows/post-deploy-verify.yml` checks the commit and key page signatures after every push.

## Validation

Run the relevant checks before publication:

```bash
python tools/audit_site.py
python tools/production_url_audit.py
python tools/validate_site_structure.py
node --check assets/js/ask-poly-config.js
node --check assets/js/mock-exam-service.js
node --check workers/ask-poly-ai/src/index.js
```

A HTTP 200 alone is not enough. Important interactive pages also require browser/runtime testing.

## Content generation

AI-generated lesson content must pass HTML, path, syllabus coverage, accessibility and security checks. Generated text is educational support and must not be presented as official curriculum wording without verification.

## Reporting errors

Use `contact.html` to report a broken link, wrong subject code, incorrect title, incomplete lesson, privacy problem or grading issue. Include the affected URL and exact error.
