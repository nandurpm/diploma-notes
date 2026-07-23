# Site Integrity Audit

- Generated: **2026-07-23T03:53:25Z**
- Commit: `6089a9fa612273018495fc8c0edc521c3cadd97d`
- Branch: `jules-2169077396180326619-df7aaceb`
- Result: **PASSED**

## Current scope

- All canonical HTML and indexed PDF resources generated into sitemap.xml
- Metadata, canonical URL, H1, duplicate IDs, skip links and local references
- Critical endpoint, score-integrity, redirect, inline-script and file checks
- Critical JavaScript syntax and secret scanning are handled by CI
- Browser/runtime and production checks are separate workflows

## Inventory

- Sitemap resources: **284**
- Indexed HTML resources: **175**
- Indexed PDFs: **109**
- Revision 2021 department files: **44**
- Revision 2026 department files: **38**
- Revision 2021 lesson files: **91**
- Revision 2026 lesson files: **17**
- Revision 2021 note PDFs: **92**
- Revision 2026 note PDFs: **17**

## Quality gate output

```text
Site quality gate passed for 284 sitemap resources.
```
