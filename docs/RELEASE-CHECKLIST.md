# 🚀 POLY PMNA Release & Deployment Checklist

This document serves as the official Release and Deployment Guide for POLY PMNA. It details the steps necessary to safely validate, build, deploy, verify, and (if necessary) roll back releases to production.

---

## 📋 Table of Contents
1. [Release Flow & Git Strategy](#1-release-flow--git-strategy)
2. [Pre-Release Quality Gates](#2-pre-release-quality-gates)
3. [Local Build & Build Optimization](#3-local-build--build-optimization)
4. [Deployment Procedures](#4-deployment-procedures)
5. [Post-Deployment Verification (QA)](#5-post-deployment-verification-qa)
6. [Rollback Procedures](#6-rollback-procedures)

---

## 1. Release Flow & Git Strategy

*   **Main Branch Protection:** The `main` branch represents the stable production-ready code. All direct pushes are blocked; changes must arrive via tested Pull Requests.
*   **Continuous Deployment:**
    *   Pushes/Merges to `main` automatically trigger GitHub Actions to generate optimized public artifacts and deploy to **GitHub Pages** and **Cloudflare Pages**.
    *   Separate Cloudflare Workers handle backend functions (e.g., Ask POLY AI, daily quizzes).

---

## 2. Pre-Release Quality Gates

Before committing any release or submitting a Pull Request, you **must** run the local validation suite. The main quality gate automatically aggregates these checks.

### Run All Quality Gates
Execute the following unified quality gate command:
```bash
python3 tools/site_quality_gate.py
```
This script runs the following sub-validations:
1.  **Site Structure Validation (`validate_site_structure.py`):** Ensures menu hierarchies, doctypes, viewports, and baseline resource counts (e.g., at least 91 REV2021 and 36 REV2026 files) are intact.
2.  **Fullscreen Standard (`validate_lesson_fullscreen.py`):** Checks that all lessons load correct no-header navigation assets.
3.  **Watermark Verification (`validate_watermark.py`):** Checks the presence and validity of lesson watermark CSS and images.

---

## 3. Local Build & Build Optimization

If all quality gates pass, you can build and optimize the site locally to simulate a production deployment artifact.

### Step 3.1: Generate Build Info & Sitemap
```bash
python3 tools/write_build_info.py
python3 tools/generate_sitemap.py
```

### Step 3.2: Compile the Public Site
Compile and optimize assets (e.g., bundling home page CSS, cache-busting, and minification):
```bash
python3 tools/build_public_site.py --target _site
```
Ensure that `_site/build-optimization.json` is generated successfully and the bundle is verified:
```bash
test -f _site/build-optimization.json
```

---

## 4. Deployment Procedures

### Automated Deployment (CI/CD)
The primary deployment pipeline is managed via GitHub Actions:
*   **Static Site Deployment:** Managed by `.github/workflows/deploy-static-site.yml` on pushes/merges to `main`.
*   **GitHub Pages Deployment:** Managed by `.github/workflows/deploy-github-pages.yml` on pushes/merges to `main`.

### Diagnostic Deployments (Triggered on Demand)
If you need to trigger a manual release or diagnostic run:
1.  Open a GitHub issue with the exact title: `[automation] Deploy static site to production`.
2.  Alternatively, use the **Workflow Dispatch** option in GitHub Actions for `Deploy static site to Cloudflare Pages` or `Diagnose and deploy production`.

---

## 5. Post-Deployment Verification (QA)

Once deployment is complete, the live production site must be verified. The automated pipeline performs a headless check, but manual/local verification is recommended.

### Automated QA Verification
Our verification scripts query the live production domain (`polypmna.dpdns.org`):
1.  **Commit Check:** Verifies `/build-info.json` returns the expected deployed Git SHA.
2.  **About Page Check:** Verifies that `/about.html` loads correctly with bilingual tags (`data-about-lang="ml"`) and redesigned about markers (`Bilingual Kerala Polytechnic Study Portal`).
3.  **Home CSS Check:** Confirms the home page successfully renders bundled and versioned CSS links.

### Command for Manual QA Diagnostic Run
```bash
python3 tools/deploy_production_diagnostic.py
```

---

## 6. Rollback Procedures

If any post-deployment verification fails, or severe bugs are discovered live, execute the rollback plan immediately.

### Step 6.1: Cloudflare Pages Rollback
1.  Log in to the [Cloudflare Dashboard](https://dash.cloudflare.com/).
2.  Navigate to **Workers & Pages** > **Pages** > Select your project.
3.  Go to the **Deployments** tab.
4.  Find the last known stable deployment (usually the previous commit build).
5.  Click the three dots `...` next to that deployment and select **Rollback deployment**.

### Step 6.2: Git Revert and Redepoly
If Cloudflare Pages cannot be accessed or a permanent code-fix rollback is preferred:
1.  Identify the last stable commit hash.
2.  Revert the bad commit on main:
    ```bash
    git revert <bad-commit-sha>
    git push origin main
    ```
3.  Let the automated GitHub Actions build and deploy the reverted safe commit.
