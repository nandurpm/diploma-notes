# Site Integrity Audit

- Generated: **2026-07-28T09:05:28Z**
- Commit: `bea861e0d24b445eaa4cabc48f57472a046ad5e6`
- Branch: `jules-17753566321363108910-c62b1d02`
- Result: **PASSED**

## Current scope

- All canonical HTML and indexed PDF resources generated into sitemap.xml
- Metadata, canonical URL, H1, duplicate IDs, skip links and local references
- Critical endpoint, score-integrity, redirect, inline-script and file checks
- Critical JavaScript syntax and secret scanning are handled by CI
- Browser/runtime and production checks are separate workflows

## Inventory

- Sitemap resources: **298**
- Indexed HTML resources: **180**
- Indexed PDFs: **118**
- Revision 2021 department files: **44**
- Revision 2026 department files: **38**
- Revision 2021 lesson files: **91**
- Revision 2026 lesson files: **26**
- Revision 2021 note PDFs: **92**
- Revision 2026 note PDFs: **26**

## Quality gate output

```text
Site quality gate passed for 298 sitemap resources.
```
