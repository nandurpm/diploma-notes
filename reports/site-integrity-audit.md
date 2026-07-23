# Site Integrity Audit

- Generated: **2026-07-23T09:15:42Z**
- Commit: `319edbd43245243646054fa71806985998a83fb8`
- Branch: `jules-4985644891467677084-483bebf4`
- Result: **PASSED**

## Current scope

- All canonical HTML and indexed PDF resources generated into sitemap.xml
- Metadata, canonical URL, H1, duplicate IDs, skip links and local references
- Critical endpoint, score-integrity, redirect, inline-script and file checks
- Critical JavaScript syntax and secret scanning are handled by CI
- Browser/runtime and production checks are separate workflows

## Inventory

- Sitemap resources: **285**
- Indexed HTML resources: **176**
- Indexed PDFs: **109**
- Revision 2021 department files: **44**
- Revision 2026 department files: **38**
- Revision 2021 lesson files: **91**
- Revision 2026 lesson files: **18**
- Revision 2021 note PDFs: **92**
- Revision 2026 note PDFs: **17**

## Quality gate output

```text
Site quality gate passed for 285 sitemap resources.
```
