# Site Integrity Audit

- Generated: **2026-07-26T21:48:31Z**
- Commit: `444521a927ca45c843626ab5383189b08261b2ed`
- Branch: `jules-6368779094129157381-b93dee12`
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
