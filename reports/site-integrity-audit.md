# Site Integrity Audit

- Generated: **2026-07-30T09:59:10Z**
- Commit: `9091d2dbe0d925fe526564e57a18a2fd90058134`
- Branch: `jules-18296231972373989761-abe7a512`
- Result: **PASSED**

## Current scope

- All canonical HTML and indexed PDF resources generated into sitemap.xml
- Metadata, canonical URL, H1, duplicate IDs, skip links and local references
- Critical endpoint, score-integrity, redirect, inline-script and file checks
- Critical JavaScript syntax and secret scanning are handled by CI
- Browser/runtime and production checks are separate workflows

## Inventory

- Sitemap resources: **318**
- Indexed HTML resources: **191**
- Indexed PDFs: **127**
- Revision 2021 department files: **44**
- Revision 2026 department files: **38**
- Revision 2021 lesson files: **91**
- Revision 2026 lesson files: **36**
- Revision 2021 note PDFs: **92**
- Revision 2026 note PDFs: **35**

## Quality gate output

```text
Site quality gate passed for 318 sitemap resources.
```
