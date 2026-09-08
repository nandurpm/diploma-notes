# Contributing to POLY PMNA

Read the [repository map](docs/REPOSITORY-MAP.md) and [coding guidelines](CODING_GUIDELINES.md) before editing.

## Choose the right location

- Student pages: existing root HTML routes and curriculum folders.
- Shared UI: `assets/css/` and `assets/js/`.
- Lesson content: `lessons/` for Revision 2021; `revision-2026-content/lessons/` for Revision 2026. The same code may represent different content across revisions.
- Developer guides: `docs/`; troubleshooting records: `docs/diagnostics/`; generated evidence: `reports/`.
- Maintenance commands: use the existing `tools/` or `scripts/` entry point and check its workflow callers before renaming it.

## Preserve working routes and content

Keep public HTML, assets, service-worker files, and deployment configuration at their existing paths. Search the repository for references before any move. Preserve historical content; label old findings instead of deleting them. PDF binaries belong in the [canonical archive](https://github.com/nandurpm/poly-pmna-pdf-files); follow [PDF automation](docs/lesson-pdf-automation.md).

## Verify and submit

Work on a branch and keep each change focused. For website changes, follow the [release checklist](docs/RELEASE-CHECKLIST.md) and [maintenance checks](tools/README-maintenance.md). Preview from the repository root with `python3 -m http.server 8000`; server-backed features also require their configured services.

For documentation-only organization, check local Markdown links and verify that public files, build inputs, and runtime paths are unchanged. Explain moves and validation results in the pull request. Report security issues using [SECURITY.md](SECURITY.md).
