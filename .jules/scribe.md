## 2026-07-28 - Developer Tooling and Site Maintenance

**Learning:** The repository contains a rich variety of Python and JavaScript automation scripts in the `tools/` directory that validate layout structures, build knowledge databases, generate sitemaps, and produce PDF copies of lesson notes. However, these scripts were undocumented, causing potential developer friction and onboarding issues.

**Action:** Document the maintenance and validation workflows clearly in `tools/README-maintenance.md`, detailing prerequisites (such as starting a local Python HTTP server on port 8000 for PDF generation) and clear usage patterns, and link them under the main `README.md` to ensure discoverability.

## 2026-07-29 - Internal Architecture and Prompt Catalog Documentation

**Learning:** Although the `docs/` folder contains essential architectural standards, lesson structure templates, and master prompt guidelines, the lack of an up-to-date and comprehensive directory index severely limits developer discoverability and onboarding efficiency.

**Action:** Maintain a clear and fully linked markdown index in `docs/README.md` listing every architectural standard, audit report, and master prompt template, ensuring developers can easily browse and reference the project rules.

## 2026-07-30 - Codifying Advanced Engineering and Tooling Standards

**Learning:** Complex client-side performance caching, strict ARIA/accessibility rules (such as quiet and polite live region boundaries, nested container restrictions, and dynamic context-safe password visibility masks), SEO crawlability meta configurations, and quality gate exceptions were undocumented. This created a gap where developers could inadvertently introduce regressions.

**Action:** Formulate and add a dedicated "Advanced Portal & Tooling Standards" section to `CODING_GUIDELINES.md` to cleanly codify these rules, preventing regression risk and streamlining developer onboarding.
