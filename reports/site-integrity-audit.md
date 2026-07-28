# Site Integrity Audit

- Generated: **2026-07-28T14:01:17Z**
- Commit: `36f695b371abeaa6daa35a9cc4c9b5a85708390f`
- Branch: `jules-12981293919032446104-1d7f238e`
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
