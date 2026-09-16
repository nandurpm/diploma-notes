# POLY PMNA Repository Audit Findings

> Historical repository-structure snapshot. Counts and file lists reflect the repository when this audit was written and should not be treated as current inventory.

## Repository overview at audit time

- Static HTML/CSS/JavaScript site with Cloudflare/Supabase-backed services.
- Root HTML documents were public route entry points.
- Shared frontend resources lived under `assets/`.
- Curriculum content was separated across Revision 2021 and Revision 2026 folders.
- Maintenance/build tooling lived under `tools/`, `scripts/`, `tests/`, and `.github/workflows/`.

## Architecture observations

### Frontend

The site used shared navigation, hardening, accessibility, lesson, quiz, mock-exam, and Ask POLY modules rather than a framework build. Revision-specific browser scripts loaded their corresponding JSON catalogues.

### Content

Revision 2021 lesson pages were kept under `lessons/`; Revision 2026 lesson content was kept separately under `revision-2026-content/`. This separation remains an important compatibility boundary because the same subject concepts can differ by curriculum revision.

### Backend and apps

Cloudflare Workers handled Ask POLY and related server-side routes, Supabase supplied database/authentication services, and the Android app wrapped the public website. Standard `.well-known` files supported app verification.

### Automation

GitHub Actions handled deployment, content synchronization, sitemap generation, quality checks, PDF publication, Ask POLY knowledge generation, and Android builds.

## Findings that remain useful as repository rules

1. Root public HTML files should not be casually renamed or moved because their paths are part of the public URL contract.
2. Shared CSS/JavaScript belongs under `assets/`, not beside individual root pages unless a platform requires the file at the root.
3. Developer documentation belongs under `docs/`; generated evidence belongs under `reports/`.
4. Revision 2021 and Revision 2026 content must stay clearly separated.
5. Apparently unused scripts or compatibility routes must be traced through dynamic loaders, redirects, workflows, and app links before removal.
6. New maintenance logic should reuse existing `tools/` or `scripts/` infrastructure rather than creating one-off root files.

## Current source of truth

For the current structure, use [Repository map](../REPOSITORY-MAP.md). For current site health, use CI, `tools/site_quality_gate.py`, `tools/full_site_static_audit.py`, and production smoke checks.
