## 2026-07-28 - Developer Tooling and Site Maintenance

**Learning:** The repository contains a rich variety of Python and JavaScript automation scripts in the `tools/` directory that validate layout structures, build knowledge databases, generate sitemaps, and produce PDF copies of lesson notes. However, these scripts were undocumented, causing potential developer friction and onboarding issues.

**Action:** Document the maintenance and validation workflows clearly in `tools/README-maintenance.md`, detailing prerequisites (such as starting a local Python HTTP server on port 8000 for PDF generation) and clear usage patterns, and link them under the main `README.md` to ensure discoverability.

## 2026-07-29 - Internal Architecture and Prompt Catalog Documentation

**Learning:** Although the `docs/` folder contains essential architectural standards, lesson structure templates, and master prompt guidelines, the lack of an up-to-date and comprehensive directory index severely limits developer discoverability and onboarding efficiency.

**Action:** Maintain a clear and fully linked markdown index in `docs/README.md` listing every architectural standard, audit report, and master prompt template, ensuring developers can easily browse and reference the project rules.

## 2026-07-30 - Standardizing Advanced Portal and Tooling Conventions

**Learning:** Crucial architectural patterns, accessibility improvements (avoiding verbal clutter on dynamic clocks, matching screen-reader announcements on search fields, non-nested buttons), worker-side mathematical sanitization safety boundaries, cache optimizations, local PDF-building conditions, and indexation crawler rules were distributed across separate code blocks without developer guidelines, risking quality regressions.

**Action:** Consolidate these specific, highly relevant design conventions and technical requirements into a structured "Advanced Portal & Tooling Standards" section inside `CODING_GUIDELINES.md` to guarantee complete backward-compatibility, SEO excellence, and performance cohesion for future development.

## 2026-07-31 - Mapping Relational Schemas and Security Boundaries

**Learning:** Appending accurate SQL descriptions, Row Level Security (RLS) policies, database triggers, and client-versus-server-side evaluation security boundaries to backend README documentation clarifies key technical trade-offs and prevents accidental browser-side security regressions.

**Action:** Keep backend README files in sync with real-world SQL schemas and migrations, highlighting check constraints, revoked write privileges, and privileged API tokens (`service_role` pattern) to ensure proper onboarding and development continuity.
