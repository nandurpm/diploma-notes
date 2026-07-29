# Site Integrity Audit

- Generated: **2026-07-29T14:37:04Z**
- Commit: `7c6ff260a366223e290f1246016d2e379cd6befb`
- Branch: `jules-16853770500538167357-9b37efd1`
- Result: **PASSED**

## Current scope

- All canonical HTML and indexed PDF resources generated into sitemap.xml
- Metadata, canonical URL, H1, duplicate IDs, skip links and local references
- Critical endpoint, score-integrity, redirect, inline-script and file checks
- Critical JavaScript syntax and secret scanning are handled by CI
- Browser/runtime and production checks are separate workflows

## Inventory

- Sitemap resources: **311**
- Indexed HTML resources: **187**
- Indexed PDFs: **124**
- Revision 2021 department files: **44**
- Revision 2026 department files: **38**
- Revision 2021 lesson files: **91**
- Revision 2026 lesson files: **32**
- Revision 2021 note PDFs: **92**
- Revision 2026 note PDFs: **32**

## Quality gate output

```text
Site quality gate passed for 311 sitemap resources.
```
