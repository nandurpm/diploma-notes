## 2026-07-28 - Developer Tooling and Site Maintenance

**Learning:** The repository contains a rich variety of Python and JavaScript automation scripts in the `tools/` directory that validate layout structures, build knowledge databases, generate sitemaps, and produce PDF copies of lesson notes. However, these scripts were undocumented, causing potential developer friction and onboarding issues.

**Action:** Document the maintenance and validation workflows clearly in `tools/README-maintenance.md`, detailing prerequisites (such as starting a local Python HTTP server on port 8000 for PDF generation) and clear usage patterns, and link them under the main `README.md` to ensure discoverability.
