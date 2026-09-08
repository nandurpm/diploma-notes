# Build and maintenance tools

This folder contains developer commands used by local maintenance and GitHub Actions. Start with the [maintenance guide](README-maintenance.md).

| Task | Entry point |
|---|---|
| Assemble the public website | `build_public_site.py` |
| Validate website structure | `validate_site_structure.py` |
| Run the site quality gate | `site_quality_gate.py` |
| Build Revision 2026 department pages | `build_revision_2026_pages.py` |
| Generate sitemap | `generate_sitemap.py` |
| Build Ask POLY knowledge | `build_ask_poly_knowledge.py` |
| Restore archived PDFs at existing URLs | `restore_archived_pdfs.py` |

Student calculators, unit converters, and reference utilities are reached through the root [tools page](../tools.html) and [catalogue](../tools-catalog.html). This folder is excluded from the public-site build. Course-specific internal payload folders retain their existing locations.

Before moving or renaming a command, inspect its callers in `.github/workflows/` and other scripts. Run commands from the repository root unless a command documents otherwise.

[Repository map](../docs/REPOSITORY-MAP.md)
