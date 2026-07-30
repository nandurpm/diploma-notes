# Site Integrity Audit

- Generated: **2026-07-30T14:04:18Z**
- Commit: `60341f2a4f1569c27bc5590b519a6e172c884ea0`
- Branch: `jules-1250033496107689838-024014ed`
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
