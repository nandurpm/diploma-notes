# Site Integrity Audit

- Generated: **2026-07-28T09:27:47Z**
- Commit: `b12dbbe4227a342c00152a7cc3dbd778e8b2b45d`
- Branch: `jules-17249788158833995678-34c09e68`
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
