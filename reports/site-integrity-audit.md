# Site Integrity Audit

- Generated: **2026-07-23T21:50:35Z**
- Commit: `e973bdc85d92e42e2712fc76c65fd182e7f9377c`
- Branch: `jules-809343900724664273-ac2536ef`
- Result: **PASSED**

## Current scope

- All canonical HTML and indexed PDF resources generated into sitemap.xml
- Metadata, canonical URL, H1, duplicate IDs, skip links and local references
- Critical endpoint, score-integrity, redirect, inline-script and file checks
- Critical JavaScript syntax and secret scanning are handled by CI
- Browser/runtime and production checks are separate workflows

## Inventory

- Sitemap resources: **286**
- Indexed HTML resources: **176**
- Indexed PDFs: **110**
- Revision 2021 department files: **44**
- Revision 2026 department files: **38**
- Revision 2021 lesson files: **91**
- Revision 2026 lesson files: **18**
- Revision 2021 note PDFs: **92**
- Revision 2026 note PDFs: **18**

## Quality gate output

```text
Site quality gate passed for 286 sitemap resources.
```
