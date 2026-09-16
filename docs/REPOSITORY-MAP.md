# Repository map

[Project overview](../README.md) · [Documentation](README.md) · [Development guides](development/README.md) · [Contributing](../CONTRIBUTING.md)

POLY PMNA combines a static public website with backend services, mobile source, generated curriculum content, and maintenance tooling. This map defines where each kind of file belongs and which paths are compatibility boundaries.

## Public route contract

The root HTML files and curriculum folders are source files **and** established public URL paths. Examples include `index.html`, `about.html`, `revision-2026.html`, `ask-poly.html`, `daily-quiz.html`, `lessons/`, and `revision-2026/`.

Do not move those files merely to make the GitHub root shorter. A route move can affect bookmarks, canonical URLs, search indexing, service-worker caches, Android/WebView navigation, tests, redirects, and external links. If a public route is ever migrated, update and test all of those consumers together.

## Top-level ownership

| Path | Purpose |
|---|---|
| Root `*.html` | Established public entry routes and compatibility redirects |
| `assets/` | Shared browser CSS, JavaScript, data, media, icons, and vendor assets |
| `lessons/` | Revision 2021 lesson pages |
| `revision-2021/` | Revision 2021 department/browser pages |
| `revision-2021-content/` | Additional Revision 2021 content |
| `revision-2026/` | Revision 2026 department/browser pages |
| `revision-2026-content/` | Revision 2026 lesson and supporting content |
| `downloads/` | Public download metadata/resources |
| `data/` | Public/runtime data kept outside `assets/data/` for compatibility |
| `maintenance/` | Public maintenance page/assets |
| `notifications/` | Notification configuration/delivery state |
| `functions/` | Cloudflare Pages Functions/middleware |
| `workers/` | Cloudflare Worker projects, including Ask POLY |
| `supabase/` | Database migrations and Supabase backend configuration |
| `android-app/` | Native Android application source |
| `tools/` | Build, validation, maintenance, PDF, and repository utilities |
| `scripts/` | Content generation and maintenance scripts |
| `tests/` | Automated regression tests; Worker-local tests stay with each Worker |
| `.github/` | CI/CD and repository automation |
| `docs/` | Current developer guides plus organized historical documentation |
| `reports/` | Generated audit/QA evidence with stable workflow paths |
| `previews/` | Review-only pages excluded from the public artifact |
| `.well-known/` | Standard web/app discovery files that require fixed URL paths |

## Documentation ownership

| Path | Use |
|---|---|
| `docs/development/` | Coding and maintenance standards |
| `docs/architecture/` | Current system boundaries and architecture |
| `docs/audits/` | Historical audit snapshots |
| `docs/diagnostics/` | Incident investigations and troubleshooting evidence |
| `docs/archive/` | Superseded notes retained for traceability |
| `docs/pdf-archive/` | Canonical PDF archive integration and synchronized manifests |

The project root should contain only public/deployment files and standard repository documents (`README.md`, `CONTRIBUTING.md`, `SECURITY.md`, `LICENSE`). New audit notes, prompts, debug logs, and one-off Markdown files do not belong at the root.

## Root files that intentionally stay in place

| Group | Files / reason |
|---|---|
| Public pages | Existing root `*.html` URLs |
| Offline/install | `sw.js`, `site.webmanifest`, `offline.html`, `favicon.ico` |
| Hosting/discovery | `CNAME`, `_headers`, `_redirects`, `robots.txt`, `sitemap.xml`, `build-info.json`, `.nojekyll` |
| Tool configuration | `package.json`, `package-lock.json`, `wrangler.toml`, hidden Git/Lighthouse config |
| Repository standards | `README.md`, `CONTRIBUTING.md`, `SECURITY.md`, `LICENSE` |

## Important distinctions

- `tools.html` / `tools-catalog.html` are student-facing public pages; `tools/` contains developer automation.
- Revision 2021 and Revision 2026 content must remain separate even when course names are similar.
- PDF binaries use the canonical `nandurpm/poly-pmna-pdf-files` archive. Synchronized manifests under `docs/pdf-archive/` are explicit build inputs.
- `docs/audits/` and `docs/diagnostics/` contain historical evidence. A failure described there is not automatically a current production failure.
- The public artifact is assembled by `tools/build_public_site.py`, which excludes developer-only directories and Markdown while preserving public URL layout.

## Before adding or moving a file

1. Identify whether the path is public, build-time, backend, generated, or documentation-only.
2. Search HTML references, imports, service-worker caches, workflows, tests, redirects, mobile code, and deployment scripts.
3. Put developer-only material in its owning directory rather than the repository root.
4. Run `python tools/check_repository_layout.py` plus the relevant site/build tests.
5. For a public-path change, treat it as a migration rather than a cosmetic repository cleanup.
