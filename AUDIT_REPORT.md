# POLY PMNA Full Audit & Remediation Report

**Site:** https://polypmna.dpdns.org/  
**Repository:** `nandurpm/diploma-notes`  
**Audit date:** 2026-09-15  
**Audit branch:** `audit/full-site-2026-09-15`  
**Base commit:** `320794da55c14bb7bdd2eca10df94fb5fc34fdcb`

> This file was created before remediation began so the pre-fix findings are preserved as the requested running changelog. The final pass updates each item with its fix/test status and records anything that remains open.

## Setup and audit method

- The root project is a static HTML/CSS/JavaScript site/PWA. The root `package.json` has no build scripts; browser regression dependencies live under `tests/frontend/`.
- Public deployment output is assembled by `tools/build_public_site.py` into `_site`.
- Project conventions from `CONTRIBUTING.md` and `CODING_GUIDELINES.md` require minimal/backward-compatible changes and logical commits.
- Existing QA includes `tools/site_quality_gate.py`, `tools/full_site_static_audit.py`, Playwright tests under `tests/frontend/`, Lighthouse CI, production URL auditing, secret scans and targeted Ask POLY/mock-exam validators.
- The connected GitHub repository is used for source reads/writes. This execution environment could not resolve `github.com` for a conventional local `git clone`, so browser/build execution is delegated to the repository's GitHub Actions checks after the remediation branch is opened as a pull request.
- Live-site verification also uses current public responses/search results, with repository source as the authority for code changes.

## 1. Functional bugs

### Pre-fix findings

- **F1 — About page malformed document head (`about.html`).** `<body>` begins before an explicit `</head>`. Browsers recover, but the source is malformed and build-time head injectors skip pages without `</head>`.
- **F2 — Full-site runtime auditing exists but is not enforced in the primary PR quality workflow.** `tools/runtime_console_audit.cjs` and `tools/chrome_runtime_audit.py` audit sitemap pages, while `.github/workflows/site-quality-gate.yml` currently runs only the targeted Playwright suite.
- **F3 — Full-site static audit is not part of the primary PR gate.** `tools/full_site_static_audit.py` is present but the main `site-quality-gate.yml` does not execute it.
- **F4 — The last committed full-site static artifact reports 22 lesson pages missing canonical metadata.** Example verified in source: `lessons/lessons-2101.html`. This indicates newly added/legacy lesson documents can bypass the current sitemap-centric quality gate.
- **F5 — Existing targeted Playwright coverage already exercises subject search, revision/department/semester filters, catalogue retry/error handling, PDF retry behavior, horizontal overflow on the homepage, and Ask POLY interrupted/completed streaming persistence.** These are retained and extended rather than replaced.
- **F6 — The Mock Exams navigation target `/daily-quiz.html` is intentional.** It is the authenticated Mock Exams & Daily Quiz portal; `/mock-exam.html` is the individual runner. This was investigated and is not a bug.
- **F7 — Current live SITTTR Revision 2021 model-question-paper index resolves and lists the expected programme catalogue.** No replacement URL is warranted from this check.

## 2. Cross-browser / responsive

### Pre-fix findings

- **R1 — The standalone full-site mobile/accessibility audit does not cover the requested viewport edges.** It tests 375, 390, 768 and 1280 px; the requested mobile range explicitly includes 360 and 414 px.
- **R2 — Touch-target collection is ineffective.** `tools/full_site_mobile_accessibility_audit.mjs` records targets below 40 px but never adds that result to the pass/fail checks, while this audit requires at least 44 px mobile touch targets.
- **R3 — The primary Playwright config tests desktop 1440 and mobile 360 only.** It does not provide a representative 414 px mobile or 768 px tablet project, although a separate dormant audit script does test tablet/desktop widths.

## 3. Accessibility

### Pre-fix findings

- **A1 — Full-site accessibility checks are not wired into pull-request CI.** The dormant audit checks language, viewport meta, single H1, main landmark, skip link, image alt, accessible control names, form labels, duplicate IDs, positive tabindex, horizontal overflow and overlapping controls across 19 representative pages.
- **A2 — The existing full-site audit's touch-target threshold is below the requested 44 px and is non-blocking** (same root cause as R2).
- **A3 — Existing targeted source review found correct labeling/status semantics on Ask POLY (`textarea` label, `maxlength=2200`, live status region) and current mock-exam portal fields. These should remain regression-protected.

## 4. Styling / consistency

### Pre-fix findings

- **S1 — The last committed static-audit artifact reports 19 shared CSS assets referenced with conflicting cache-buster versions.** This can produce inconsistent styling after deployments because equivalent pages may keep different cached CSS generations.
- **S2 — Earlier remediation already fixed a confirmed narrow-screen overflow in `materials-2015.html`; no design-intent rewrite is planned unless current browser CI finds a regression.**
- **S3 — Malayalam lesson styles include explicit Malayalam font fallbacks in verified lesson source.** No content/font-family rewrite is justified without a current rendering failure.

## 5. Performance

### Pre-fix findings

- **P1 — Lighthouse audits only three URLs:** Home, Revision 2026 and Tools. Core navigation pages such as About, Revision 2021, Mock Exams/Daily Quiz, Ask POLY, 2015 Materials and Help/Contact are not performance/a11y/SEO budgeted by Lighthouse CI.
- **P2 — Lighthouse workflow summary text does not match the enforced config.** The workflow summary says performance >= 0.72 and CLS <= 0.10, while `.lighthouserc.json` enforces performance >= 0.55 and CLS <= 0.15 (warning). This can overstate CI strictness.
- **P3 — Build-time asset optimization already exists through `tools/optimize_public_build.py`; image/video changes will be made only where current evidence shows an actual regression to avoid unnecessary visual/format churn.**

## 6. SEO / metadata

### Pre-fix findings

- **SEO1 — 22 lesson pages are reported without canonical links by the committed full-site static audit; one example is source-verified.** These pages fall outside the current sitemap-based gate, allowing metadata drift.
- **SEO2 — The main quality gate verifies title, description, canonical, H1, Open Graph basics and Twitter card metadata for sitemap resources, but its effectiveness depends on sitemap coverage.** The independent all-document static audit should therefore be enforced too.
- **SEO3 — `robots.txt` and `sitemap.xml` exist; sitemap generation/check tooling is already present in CI.**
- **SEO4 — Current live homepage claims “42 official programme pages” for Revision 2026. Current site/search evidence and the Revision 2021 SITTTR index both expose 42-count programme catalogues in relevant contexts, but wording such as “42 departments” versus “42 programme pages” remains a content-owner terminology decision and will not be silently rewritten.

## 7. Code quality

### Pre-fix findings

- **Q1 — Audit tooling is fragmented.** Broad static/mobile/runtime auditors exist but are not consistently called by the main PR workflow, so regressions can pass despite useful tooling already being in the repository.
- **Q2 — `tools/normalize_about_page.py` does not validate/repair malformed `<head>`/`<body>` ordering, which allowed F1 to persist.
- **Q3 — `scripts/standardize_metadata.py` can normalize canonicals/H1s across documents but is mutation-only and not currently used as a non-mutating CI drift check.**
- **Q4 — Existing JavaScript syntax checks and Node tests cover critical Ask POLY/mock-exam scripts; these remain the baseline rather than introducing an unrelated formatter/linter stack into a static site with established project-specific validators.**

## 8. Security basics

### Pre-fix findings

- **SEC1 — The primary quality workflow includes a committed-secret scan for OpenAI keys, Supabase service-role keys and Cloudflare tokens.** The public Supabase publishable browser key in `daily-quiz.html` is intentionally public and is explicitly distinguished from a service-role secret.
- **SEC2 — A dedicated `tools/secret_scan.py` and security assessment reports also exist; no exposed private credential has been confirmed in this pass so far.
- **SEC3 — Network/user-input paths require runtime regression coverage, especially Ask POLY network failure and mock-exam score submission; the current tests cover streaming interruption/retry behavior and score-authority protections, and remaining gaps will be recorded rather than simulated as “passed.”**

## Remediation status

Remediation has not yet begun in this snapshot. Subsequent commits update this section with exact changes, checks and remaining open items.
