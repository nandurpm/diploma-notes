# Site Integrity Audit

- Generated: **2026-07-27T15:07:31Z**
- Commit: `0a3ce9fc65d9b84d4d3d3d8b3d268120ac1c4776`
- Branch: `jules-7275666127160520509-a3f588c9`
- Result: **PASSED**

## Current scope

- All canonical HTML and indexed PDF resources generated into sitemap.xml
- Metadata, canonical URL, H1, duplicate IDs, skip links and local references
- Critical endpoint, score-integrity, redirect, inline-script and file checks
- Critical JavaScript syntax and secret scanning are handled by CI
- Browser/runtime and production checks are separate workflows

## Inventory

- Sitemap resources: **298**
- Indexed HTML resources: **180**
- Indexed PDFs: **118**
- Revision 2021 department files: **44**
- Revision 2026 department files: **38**
- Revision 2021 lesson files: **91**
- Revision 2026 lesson files: **26**
- Revision 2021 note PDFs: **92**
- Revision 2026 note PDFs: **26**

## Quality gate output

```text
Site quality gate passed for 298 sitemap resources.
```
