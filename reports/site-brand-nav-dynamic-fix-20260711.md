# POLY PMNA Brand, Navigation, Breadcrumb and Dynamic Fallback Fix

Version: `20260711-consistency1`

## Fixed

- Standardized public brand name to `POLY PMNA` in shared header, footer, titles, and metadata normalization.
- Rebuilt the shared navigation to one 8-item menu:
  - Home
  - About
  - Revision 2021
  - Mock Exams
  - Ask POLY AI
  - 2015 Materials
  - Tools
  - Help
- Added `site-consistency-fix.js` as a shared runtime normalizer.
- Updated `fixed-site-header.js` so it no longer rewrites the brand back to `Polytechnic Study Hub`.
- Updated `main.js` and `site-hardening.js` so the consistency normalizer is loaded across public pages.
- Fixed Ask POLY breadcrumb to `Home > Ask POLY AI`.
- Added breadcrumb fallback rules for Daily Quiz / Mock Exams, Tools, Help, and Ask POLY.
- Added frontend fallbacks for stuck UI states:
  - home important-day card no longer stays as `Loading today...`
  - daily quiz service error now points users to guest mode instead of showing only a hard failure
  - tools page shows a useful fallback message if cards fail to render
  - subject grid shows a clear fallback message if the browser fails to populate cards

## Files changed

- `assets/js/site-consistency-fix.js`
- `assets/js/fixed-site-header.js`
- `assets/js/main.js`
- `assets/js/site-hardening.js`
- `ask-poly.html`

## Still separate work

The external developer portfolio page at `nandakumarm.dpdns.org/about.html` is outside this repository. This repo still links to it as the developer credit, but the portfolio page itself must be fixed in its own repository.
