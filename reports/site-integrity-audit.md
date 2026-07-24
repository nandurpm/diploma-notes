# Site Integrity Audit

- Generated: **2026-07-24T20:36:10Z**
- Commit: `0dd704f0931f115cb24d6516d45256d86e2d885c`
- Branch: `jules-1349647342948580442-2ab90d37`
- Result: **PASSED**

## Current scope

- All canonical HTML and indexed PDF resources generated into sitemap.xml
- Metadata, canonical URL, H1, duplicate IDs, skip links and local references
- Critical endpoint, score-integrity, redirect, inline-script and file checks
- Critical JavaScript syntax and secret scanning are handled by CI
- Browser/runtime and production checks are separate workflows

## Inventory

- Sitemap resources: **288**
- Indexed HTML resources: **177**
- Indexed PDFs: **111**
- Revision 2021 department files: **44**
- Revision 2026 department files: **38**
- Revision 2021 lesson files: **91**
- Revision 2026 lesson files: **19**
- Revision 2021 note PDFs: **92**
- Revision 2026 note PDFs: **19**

## Quality gate output

```text
Site quality gate passed for 288 sitemap resources.
```
