# Audit archive

Historical audit documents live here so repository health evidence is easy to find without cluttering the project root.

These files are snapshots. They describe the repository or production site at a particular point in time; they are not a substitute for current CI, build validation, or live smoke tests.

| Document | Scope |
|---|---|
| [2026-07 technical QA](2026-07-technical-qa.md) | Revision 2026, frontend QA, legacy-route review |
| [Repository audit findings](repository-audit-findings.md) | Historical repository structure and dependency observations |
| [2026-09 full-site audit](2026-09-full-site-audit.md) | Functional, responsive, accessibility, performance, SEO, code-quality and security review |

Current verification entry points:

- `python tools/site_quality_gate.py`
- `python tools/full_site_static_audit.py`
- `python tools/check_repository_layout.py`
- Playwright tests under `tests/frontend/`
- GitHub Actions under `.github/workflows/`
