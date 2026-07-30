# Site Integrity Audit

- Generated: **2026-07-30T15:01:58Z**
- Commit: `4c09859da4785a108133bf6a058fe76f9c438d4c`
- Branch: `jules-10616918557098368778-1aa8db71`
- Result: **PASSED**

## Current scope

- All canonical HTML and indexed PDF resources generated into sitemap.xml
- Metadata, canonical URL, H1, duplicate IDs, skip links and local references
- Critical endpoint, score-integrity, redirect, inline-script and file checks
- Critical JavaScript syntax and secret scanning are handled by CI
- Browser/runtime and production checks are separate workflows

## Inventory

- Sitemap resources: **319**
- Indexed HTML resources: **191**
- Indexed PDFs: **128**
- Revision 2021 department files: **44**
- Revision 2026 department files: **38**
- Revision 2021 lesson files: **91**
- Revision 2026 lesson files: **36**
- Revision 2021 note PDFs: **92**
- Revision 2026 note PDFs: **36**

## Quality gate output

```text
Site quality gate passed for 319 sitemap resources.
```
