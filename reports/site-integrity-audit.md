# Site Integrity Audit

- Generated: **2026-08-03T19:01:56Z**
- Commit: `4ae2b2eb02e4f2b2d656bd27699f1dde769f51b0`
- Branch: `main`
- Result: **PASSED**

## Current scope

- All canonical HTML and indexed PDF resources generated into sitemap.xml
- Metadata, canonical URL, H1, duplicate IDs, skip links and local references
- Critical endpoint, score-integrity, redirect, inline-script and file checks
- Critical JavaScript syntax and secret scanning are handled by CI
- Browser/runtime and production checks are separate workflows

## Inventory

- Sitemap resources: **321**
- Indexed HTML resources: **192**
- Indexed PDFs: **129**
- Revision 2021 department files: **44**
- Revision 2026 department files: **38**
- Revision 2021 lesson files: **91**
- Revision 2026 lesson files: **37**
- Revision 2021 note PDFs: **92**
- Revision 2026 note PDFs: **0**

## Quality gate output

```text
Site quality gate passed for 321 sitemap resources.
```
