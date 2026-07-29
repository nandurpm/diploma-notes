# Site Integrity Audit

- Generated: **2026-07-29T10:09:35Z**
- Commit: `6925fd6929caccde7df44a8070a1617a53e19a8a`
- Branch: `jules-16167821361512621106-0dd5c669`
- Result: **PASSED**

## Current scope

- All canonical HTML and indexed PDF resources generated into sitemap.xml
- Metadata, canonical URL, H1, duplicate IDs, skip links and local references
- Critical endpoint, score-integrity, redirect, inline-script and file checks
- Critical JavaScript syntax and secret scanning are handled by CI
- Browser/runtime and production checks are separate workflows

## Inventory

- Sitemap resources: **305**
- Indexed HTML resources: **184**
- Indexed PDFs: **121**
- Revision 2021 department files: **44**
- Revision 2026 department files: **38**
- Revision 2021 lesson files: **91**
- Revision 2026 lesson files: **29**
- Revision 2021 note PDFs: **92**
- Revision 2026 note PDFs: **29**

## Quality gate output

```text
Site quality gate passed for 305 sitemap resources.
```
