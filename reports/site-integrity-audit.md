# Site Integrity Audit

- Generated: **2026-08-09T03:10:42Z**
- Commit: `7f182eac860dd01aaeb12ea93bfc0b141e7cecb0`
- Branch: `jules-2443313239238308706-fe905266`
- Result: **PASSED**

## Current scope

- All canonical HTML and indexed PDF resources generated into sitemap.xml
- Metadata, canonical URL, H1, duplicate IDs, skip links and local references
- Critical endpoint, score-integrity, redirect, inline-script and file checks
- Critical JavaScript syntax and secret scanning are handled by CI
- Browser/runtime and production checks are separate workflows

## Inventory

- Sitemap resources: **339**
- Indexed HTML resources: **203**
- Indexed PDFs: **136**
- Revision 2021 department files: **44**
- Revision 2026 department files: **42**
- Revision 2021 lesson files: **91**
- Revision 2026 lesson files: **44**
- Revision 2021 note PDFs: **92**
- Revision 2026 note PDFs: **44**

## Quality gate output

```text
Site quality gate passed for 339 sitemap resources.
```
