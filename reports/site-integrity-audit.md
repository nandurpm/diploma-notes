# Site Integrity Audit

- Generated: **2026-07-28T13:33:56Z**
- Commit: `2abed56cc5c9c6bce84216708bb2f2639c928ea4`
- Branch: `jules-5707631822361627329-6d2986e6`
- Result: **PASSED**

## Current scope

- All canonical HTML and indexed PDF resources generated into sitemap.xml
- Metadata, canonical URL, H1, duplicate IDs, skip links and local references
- Critical endpoint, score-integrity, redirect, inline-script and file checks
- Critical JavaScript syntax and secret scanning are handled by CI
- Browser/runtime and production checks are separate workflows

## Inventory

- Sitemap resources: **300**
- Indexed HTML resources: **181**
- Indexed PDFs: **119**
- Revision 2021 department files: **44**
- Revision 2026 department files: **38**
- Revision 2021 lesson files: **91**
- Revision 2026 lesson files: **27**
- Revision 2021 note PDFs: **92**
- Revision 2026 note PDFs: **27**

## Quality gate output

```text
Site quality gate passed for 300 sitemap resources.
```
