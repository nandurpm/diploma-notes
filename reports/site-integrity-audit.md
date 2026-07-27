# Site Integrity Audit

- Generated: **2026-07-26T22:00:31Z**
- Commit: `7e16ac3c96c52a4dc09fcae356dd777015f68088`
- Branch: `jules-12822099678888200854-49a8b269`
- Generated: **2026-07-26T21:48:31Z**
- Commit: `444521a927ca45c843626ab5383189b08261b2ed`
- Branch: `jules-6368779094129157381-b93dee12`
- Generated: **2026-07-26T21:51:39Z**
- Commit: `64801f8452043c05faed9c19d86518fb075f08d7`
- Branch: `jules-16049430317936171645-d8ad20b4`
- Result: **PASSED**

## Current scope

- All canonical HTML and indexed PDF resources generated into sitemap.xml
- Metadata, canonical URL, H1, duplicate IDs, skip links and local references
- Critical endpoint, score-integrity, redirect, inline-script and file checks
- Critical JavaScript syntax and secret scanning are handled by CI
- Browser/runtime and production checks are separate workflows

## Inventory

- Sitemap resources: **291**
- Indexed HTML resources: **177**
- Indexed PDFs: **114**
- Revision 2021 department files: **44**
- Revision 2026 department files: **38**
- Revision 2021 lesson files: **91**
- Revision 2026 lesson files: **22**
- Revision 2021 note PDFs: **92**
- Revision 2026 note PDFs: **22**

## Quality gate output

```text
Site quality gate passed for 291 sitemap resources.
```
