# Site Integrity Audit

- Generated: **2026-07-31T20:48:21Z**
- Commit: `fa81cb1b73b15020ad50e9047e63be1bd5fc1d1a`
- Branch: `jules-10185487941138520010-28f2457a`
- Generated: **2026-07-31T20:57:30Z**
- Commit: `fa81cb1b73b15020ad50e9047e63be1bd5fc1d1a`
- Branch: `jules-14682244770264719200-daddb905`
- Result: **PASSED**

## Current scope

- All canonical HTML and indexed PDF resources generated into sitemap.xml
- Metadata, canonical URL, H1, duplicate IDs, skip links and local references
- Critical endpoint, score-integrity, redirect, inline-script and file checks
- Critical JavaScript syntax and secret scanning are handled by CI
- Browser/runtime and production checks are separate workflows

## Inventory

- Sitemap resources: **318**
- Indexed HTML resources: **190**
- Indexed PDFs: **128**
- Revision 2021 department files: **44**
- Revision 2026 department files: **38**
- Revision 2021 lesson files: **91**
- Revision 2026 lesson files: **36**
- Revision 2021 note PDFs: **92**
- Revision 2026 note PDFs: **36**

## Quality gate output

```text
Site quality gate passed for 318 sitemap resources.
```
