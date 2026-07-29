# Site Integrity Audit

- Generated: **2026-07-29T21:05:10Z**
- Commit: `4900adb5c16c82e9caedbb2529b9152b30abc4e6`
- Branch: `jules-1131862754749935686-c403ae75`
- Result: **PASSED**

## Current scope

- All canonical HTML and indexed PDF resources generated into sitemap.xml
- Metadata, canonical URL, H1, duplicate IDs, skip links and local references
- Critical endpoint, score-integrity, redirect, inline-script and file checks
- Critical JavaScript syntax and secret scanning are handled by CI
- Browser/runtime and production checks are separate workflows

## Inventory

- Sitemap resources: **313**
- Indexed HTML resources: **188**
- Indexed PDFs: **125**
- Revision 2021 department files: **44**
- Revision 2026 department files: **38**
- Revision 2021 lesson files: **91**
- Revision 2026 lesson files: **33**
- Revision 2021 note PDFs: **92**
- Revision 2026 note PDFs: **33**

## Quality gate output

```text
Site quality gate passed for 313 sitemap resources.
```
