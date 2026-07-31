# 🛠 POLY PMNA Developer & Maintenance Tools Guide

This directory contains Python and JavaScript automation scripts used for validating, building, and maintaining the POLY PMNA static site and its associated backends. These scripts form the backbone of the project's continuous integration (CI) / continuous deployment (CD) workflows and local developer toolchain.

---

## 📋 Table of Contents
1. [Core Quality Gates & Validations](#1-core-quality-gates--validations)
2. [Build & Content Generation](#2-build--content-generation)
3. [PDF Lesson Notes Generation](#3-pdf-lesson-notes-generation)
4. [Asset Optimization & Cache Busting](#4-asset-optimization--cache-busting)
5. [Runtime & Headless Auditing](#5-runtime--headless-auditing)
6. [Curriculum Revision Helpers](#6-curriculum-revision-helpers)

---

## 1. Core Quality Gates & Validations

These scripts are the primary checks run locally and on GitHub Actions prior to deploying changes. Always run them before committing.

### `audit_site.py`
A comprehensive, site-wide structural and SEO audit script.
* **Checks Performed:** Validates sitemap integration, page metadata (`title`, `description`), canonical URLs, H1 headers, duplicate element IDs, skip-links (`<a class="skip-link" href="#main-content">`), and broken local file references.
* **Usage:**
  ```bash
  python3 tools/audit_site.py
  ```

### `validate_site_structure.py`
Ensures core repository layout constraints and menu hierarchies are strictly preserved.
* **Checks Performed:** Verifies that exactly the correct number of Revision 2021 and Revision 2026 lesson files exist, and that all lesson files correctly load the shared responsive navigation shell script (`lesson-navigation-fix.js`).
* **Usage:**
  ```bash
  python3 tools/validate_site_structure.py
  ```

### `validate_lesson_fullscreen.py`
Validates fullscreen parameters and presentation standards on all lesson files.
* **Usage:**
  ```bash
  python3 tools/validate_lesson_fullscreen.py
  ```

### `site_quality_gate.py`
Enforces the final quality gate before build steps can proceed.
* **Usage:**
  ```bash
  python3 tools/site_quality_gate.py
  ```

---

## 2. Build & Content Generation

These scripts automate the compilation of structured data, lessons, and SEO configurations.

### `build_revision_2026_pages.py`
Regenerates individual Revision 2026 department portals and landing index pages from base templates and subject JSON data.
* **Usage:**
  ```bash
  python3 tools/build_revision_2026_pages.py
  ```

### `build_ask_poly_knowledge.py`
Extracts, chunks, and structures lesson text across all HTML pages, compiling a unified knowledge base JSON for the Ask Poly AI chatbot.
* **Usage:**
  ```bash
  python3 tools/build_ask_poly_knowledge.py
  ```

### `generate_sitemap.py`
Generates the global `sitemap.xml` resource map, ensuring all HTML files and downloadable PDF notes are properly indexed.
* **Usage:**
  ```bash
  python3 tools/generate_sitemap.py
  ```

---

## 3. PDF Lesson Notes Generation

The platform provides offline downloadable PDF notes corresponding to each lesson. These notes are dynamically compiled directly from the live lesson pages.

### ⚠️ Local Setup Prerequisite
Because the PDF generators rely on capturing the rendered HTML, you must boot a local HTTP server on port `8000` first so the script can browse the local files.
```bash
# Run this from the repository root in a separate shell session
python3 -m http.server 8000
```

### `build_missing_lesson_pdfs.py`
Searches for Revision 2021 lesson files missing corresponding PDFs in the `notes/` folder, loads them via the local server, and renders them to high-quality print PDFs.
* **Usage:**
  ```bash
  python3 tools/build_missing_lesson_pdfs.py
  ```

### `build_missing_revision_2026_lesson_pdfs.py`
Performs the same function for Revision 2026 lessons, exporting generated PDFs to `revision-2026-content/notes/`.
* **Usage:**
  ```bash
  python3 tools/build_missing_revision_2026_lesson_pdfs.py
  ```

---

## 4. Asset Optimization & Cache Busting

Utilities to keep page assets optimized, structured, and compliant with web performance and security best practices.

### `bump_subject_card_assets.py`
Computes MD5 hashes of subject-related CSS and JS files, appending them as query string parameters (e.g., `?v=a1b2c3d4`) inside the HTML pages to bust browser caches.
* **Usage:**
  ```bash
  python3 tools/bump_subject_card_assets.py
  ```

### `protect_help_email.py`
Scans and obfuscates email addresses across all portal pages into safe decimal/hexadecimal HTML entities to prevent web scrapers and email spammers from harvesting developer contact details.
* **Usage:**
  ```bash
  python3 tools/protect_help_email.py
  ```

### `normalize_public_brand_assets.py`
Harmonizes logos, artwork pathways, and public-facing brand assets across various views to ensure consistency.
* **Usage:**
  ```bash
  python3 tools/normalize_public_brand_assets.py
  ```

---

## 5. Runtime & Headless Auditing

These tools run simulated browser sessions to detect issues that only manifest when JavaScript runs in a browser environment.

### `chrome_runtime_audit.py`
Launches headless Chrome instances using Playwright or Puppeteer to navigate pages, confirming that the initial page renders correctly without fatal UI blockages.
* **Usage:**
  ```bash
  python3 tools/chrome_runtime_audit.py
  ```

### `runtime_console_audit.cjs`
Runs a Node.js-based terminal auditor that catches syntax errors, broken dynamic imports, and uncaught exceptions emitted by browser scripts.
* **Usage:**
  ```bash
  node tools/runtime_console_audit.cjs
  ```

---

## 6. Curriculum Revision Helpers

The platform separates curriculum data based on the revision year (Revision 2021 vs Revision 2026). These scripts handle data synchronization, metadata, and title resolution.

### `resolve_rev2026_generic_titles.py`
Resolves generic Revision 2026 subject titles with their official names by matching course codes against SITTTR databases and falling back on recorded snapshots in `reports/revision-2026-title-resolution.json` when the site is offline.
* **Usage:**
  ```bash
  python3 tools/resolve_rev2026_generic_titles.py
  ```

### `annotate_rev2026_title_provenance.py`
Injects provenance and source data directly into Revision 2026 lesson templates, allowing students and contributors to track where course outcomes and module information originated.
* **Usage:**
  ```bash
  python3 tools/annotate_rev2026_title_provenance.py
  ```

### `apply_revision_2026_department_themes.py`
Applies custom CSS color palettes and thematic gradients to Revision 2026 department portals according to academic disciplines.
* **Usage:**
  ```bash
  python3 tools/apply_revision_2026_department_themes.py
  ```
