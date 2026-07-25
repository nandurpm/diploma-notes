# Site Integrity Audit

- Generated: **2026-07-25T20:55:41Z**
- Commit: `0303e5cb88fdb02cc7d895ce3919e0eed5ec6dca`
- Branch: `jules-12886986010366217512-51ec56e7`
- Result: **PASSED**

## Current scope

- All canonical HTML and indexed PDF resources generated into sitemap.xml
- Metadata, canonical URL, H1, duplicate IDs, skip links and local references
- Critical endpoint, score-integrity, redirect, inline-script and file checks
- Critical JavaScript syntax and secret scanning are handled by CI
- Browser/runtime and production checks are separate workflows

## Inventory

- Sitemap resources: **289**
- Indexed HTML resources: **177**
- Indexed PDFs: **112**
- Revision 2021 department files: **44**
- Revision 2026 department files: **38**
- Revision 2021 lesson files: **91**
- Revision 2026 lesson files: **20**
- Revision 2021 note PDFs: **92**
- Revision 2026 note PDFs: **20**

## Quality gate output

```text
Site quality gate passed for 289 sitemap resources.
```
