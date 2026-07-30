# Site Integrity Audit

- Generated: **2026-07-30T09:18:05Z**
- Commit: `dd53f26be01e00e364fc2ac31ffdad5e2ed3921a`
- Branch: `jules-5833736350488170766-95490e74`
- Result: **PASSED**

## Current scope

- All canonical HTML and indexed PDF resources generated into sitemap.xml
- Metadata, canonical URL, H1, duplicate IDs, skip links and local references
- Critical endpoint, score-integrity, redirect, inline-script and file checks
- Critical JavaScript syntax and secret scanning are handled by CI
- Browser/runtime and production checks are separate workflows

## Inventory

- Sitemap resources: **317**
- Indexed HTML resources: **190**
- Indexed PDFs: **127**
- Revision 2021 department files: **44**
- Revision 2026 department files: **38**
- Revision 2021 lesson files: **91**
- Revision 2026 lesson files: **35**
- Revision 2021 note PDFs: **92**
- Revision 2026 note PDFs: **35**

## Quality gate output

```text
Site quality gate passed for 317 sitemap resources.
```
