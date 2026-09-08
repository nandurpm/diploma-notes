# Repository map

[Project overview](../README.md) · [Documentation](README.md) · [Contributing](../CONTRIBUTING.md)

The repository contains both a static website and the tools that maintain it. GitHub lists folders alphabetically; this guide groups them by purpose. Use this page as the reading order.

## Start with your task

| I want to… | Open |
|---|---|
| Change the home page | [index.html](../index.html) |
| Change shared styling or navigation | [assets/css](../assets/css/) and [assets/js](../assets/js/) |
| Add a Revision 2026 lesson | [content guide](../revision-2026-content/README.md) |
| Work on Revision 2021 lessons | [lessons](../lessons/) |
| Find PDF publishing rules | [PDF automation](lesson-pdf-automation.md) and [archive manifests](pdf-archive/) |
| Work on Ask POLY | [public page](../ask-poly.html), [client scripts](../assets/js/), [Worker](../workers/ask-poly-ai/) |
| Run maintenance or validation | [maintenance guide](../tools/README-maintenance.md) |
| Understand a past issue | [diagnostics](diagnostics/) and [reports](../reports/) |

## 1. Website and learning content

| Folder | Purpose |
|---|---|
| [lessons/](../lessons/) | Revision 2021 lesson HTML pages; keep existing public URLs. |
| [revision-2021/](../revision-2021/) | Revision 2021 department and subject browser pages. |
| [revision-2021-content/](../revision-2021-content/) | Additional Revision 2021 content; keep separate from the primary lessons folder. |
| [revision-2026/](../revision-2026/) | Revision 2026 department and subject browser pages. |
| [revision-2026-content/](../revision-2026-content/) | Revision 2026 lessons and supporting content; never mix curriculum years. |
| [assets/](../assets/) | Shared CSS, JavaScript, data, icons, images, audio, and lesson fragments. |
| [images/](../images/) | Existing image paths, including guide screenshots. |
| [downloads/](../downloads/) | Download metadata and public resources. |
| [maintenance/](../maintenance/) | Public maintenance page and its assets. |
| [data/](../data/) | Root data resources; distinct from assets/data. |
| [notifications/](../notifications/) | Notification configuration and delivery state. |

## 2. Backend and Android app

| Folder | Purpose |
|---|---|
| [functions/](../functions/) | Cloudflare Pages Functions and middleware; location is platform-dependent. |
| [workers/](../workers/) | Cloudflare Worker source, including Ask POLY AI. |
| [supabase/](../supabase/) | Database migrations and backend configuration. |
| [android-app/](../android-app/) | Native Android source and Gradle configuration. |

## 3. Maintenance and verification

| Folder | Purpose |
|---|---|
| [scripts/](../scripts/) | Maintenance, content generation, audit, and notification scripts. |
| [tools/](../tools/) | Build, validation, PDF, and developer automation commands. Student tools pages are in the repository root. |
| [tests/](../tests/) | Python regression tests; Worker tests also live under workers/ask-poly-ai/test. |
| [.github/](../.github/) | GitHub workflows, automation configuration, and lesson bundles. |
| [.jules/](../.jules/) | Automation-agent configuration and notes. |

## 4. Documentation and review material

| Folder | Purpose |
|---|---|
| [docs/](../docs/) | Guides, architecture, diagnostics, historical notes, and PDF archive manifests. |
| [reports/](../reports/) | Generated audit and QA evidence; workflow output paths must stay stable. |
| [previews/](../previews/) | Review-only pages excluded from the public-site build. |
| [.well-known/](../.well-known/) | Standard web discovery files; keep their required URL paths. |

## Files that belong at the root

| Group | Files and reason |
|---|---|
| Public pages | Root `*.html` files are existing website routes. Moving them changes bookmarks, relative links, and app navigation. |
| Offline and installation | `sw.js`, `site.webmanifest`, `offline.html`, and `favicon.ico` have public paths used by browsers and the Android app. |
| Hosting and discovery | `CNAME`, `_headers`, `_redirects`, `robots.txt`, `sitemap.xml`, `build-info.json`, and `.nojekyll` are deployment or public metadata. |
| Build configuration | `package.json`, `package-lock.json`, and `wrangler.toml` are read by tooling at their current locations. |
| Repository standards | `README.md`, `CONTRIBUTING.md`, `CODING_GUIDELINES.md`, `SECURITY.md`, and `LICENSE` explain project rules. |

Other root configuration files control Git, asset selection, and audits. Keep them beside the tools that expect them.

## Important distinctions

- `tools.html` and `tools-catalog.html` are student-facing pages; `tools/` contains developer automation and is excluded by the public-site builder.
- `revision-2021/` and `revision-2026/` contain browser pages. Lesson content is stored separately so each curriculum retains its existing routes.
- PDF binaries live in the canonical `nandurpm/poly-pmna-pdf-files` repository. `docs/pdf-storage-map.json` lets the builder restore archived PDFs at existing public URLs; `docs/pdf-archive/` holds synchronized manifests. Do not move these build inputs.
- `docs/diagnostics/` records historical observations. A reported failure there is not a claim about current service health.
- The deployable artifact is assembled by `tools/build_public_site.py`. It excludes Markdown and developer directories and preserves the public route layout.

## Keeping this structure understandable

Put new guides in `docs/`, investigations in `docs/diagnostics/`, and generated evidence in `reports/`. Link new guides from the documentation index. Before renaming a runtime file or script, trace HTML links, imports, workflows, build rules, and cache references together.
