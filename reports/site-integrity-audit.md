# Site Integrity Audit

- Generated: **2026-07-21T06:06:50Z**
- Commit: `94ac66a7049362b36bf67e013c8271ef0d834f5b`
- Branch: `jules-2357370761872703021-edf135e5`
- Result: **PASSED**

## Current scope

- All canonical HTML and indexed PDF resources generated into sitemap.xml
- Metadata, canonical URL, H1, duplicate IDs, skip links and local references
- Critical endpoint, score-integrity, redirect, inline-script and file checks
- Critical JavaScript syntax and secret scanning are handled by CI
- Browser/runtime and production checks are separate workflows

## Inventory

- Sitemap resources: **282**
- Indexed HTML resources: **174**
- Indexed PDFs: **108**
- Revision 2021 department files: **44**
- Revision 2026 department files: **38**
- Revision 2021 lesson files: **91**
- Revision 2026 lesson files: **16**
- Revision 2021 note PDFs: **92**
- Revision 2026 note PDFs: **16**

## Quality gate output

```text
Site quality gate passed for 282 sitemap resources.
```
