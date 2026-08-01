# 🚀 Release & Deployment Checklist

This document details the standardized release quality gate processes, build procedures, deployment workflows, post-deployment live QA, and rollback strategies for the **POLY PMNA** digital learning platform. Use this checklist for every production release to ensure consistency and prevent regressions.

---

## 📋 Pre-Release Validation Gates

Before compiling a release build or attempting deployment, all of the following validation commands must be executed locally and must pass without warnings:

1. **Local Site Quality Gate:**
   - Evaluates sitemap health, checks routing constraints, and validates HTML document headers, duplicate IDs, skip links, and local references.
   - **Command:** `python3 tools/site_quality_gate.py`
2. **Sitemap Synchronization Check:**
   - Verifies that the global search index sitemap maps all HTML and study PDF resources correctly.
   - **Command:** `python3 tools/generate_sitemap.py --check`
3. **Public Brand Asset Normalization Check:**
   - Validates public-facing icon paths, webmanifest definitions, and theme color configurations.
   - **Command:** `python3 tools/normalize_public_brand_assets.py --check`
4. **Curriculum Structural Baselines:**
   - Confirms that exact lesson counts and responsive header shells are completely integrated.
   - **Command:** `python3 tools/validate_site_structure.py`

---

## ⚙️ Build & Optimization Process

To prepare the optimized static site, follow these sequential compilation steps:

1. **Update Build and Version Metadata:**
   - **Command:** `python3 tools/write_build_info.py`
   - This writes target commit hash, built time, and branch info to `build-info.json` and updates dynamic assets.
2. **Compile Static HTML/CSS Site:**
   - **Command:** `python3 tools/build_public_site.py`
   - Generates the optimized, compiled version of all landing pages, department portals, and lessons under the `_site/` directory.
3. **Audit Generated Build:**
   - Verify that there are no runtime syntax errors or broken imports.
   - **Command:** `node tools/runtime_console_audit.cjs`

---

## ☁️ Cloudflare Deployment Procedures

POLY PMNA is deployed and hosted on Cloudflare Pages.

### Automatic CI/CD (Recommended)
1. Commit all validated changes and push to the approved release branch on GitHub.
2. Cloudflare Pages automatically triggers a deploy hook for the pushed branch.
3. Track the live build logs on the Cloudflare Pages Dashboard under your project.

### Manual CLI Deployment (Fallback)
If CI/CD is temporarily unavailable, deploy manually using the Wrangler CLI:
```bash
# Authenticate and deploy the compiled build directory
npx wrangler pages deploy _site/ --project-name=polypmna
```

---

## 🧪 Post-Deployment Live QA

Immediately following a live deployment, verify core features on the production server (https://polypmna.dpdns.org/):

1. **Core Navigation:** Load `/` and navigate to the Revision 2026 and Revision 2021 portals. Verify navigation links are fully operational.
2. **Search and Accessibility:** Ensure search is responsive on subject tables and that screen-reader announcers (`role="status"`) announce results.
3. **Ask POLY AI:** Load `/ask-poly.html` and run a sample question. Ensure the knowledge loader successfully initializes without falling back to AI-only mode.

---

## 🔄 Rollback Strategies

If a critical regression is identified in the live environment, execute one of the following rollback procedures immediately:

### Rollback via Cloudflare Pages Dashboard (Fastest)
1. Navigate to the **Cloudflare Pages Dashboard**.
2. Select the **POLY PMNA** project.
3. Go to the **Deployments** tab.
4. Locate the last stable, verified deployment.
5. Click the **Ellipsis (...)** next to it and select **Rollback to this deployment** (or **Promote to Production**).

### Rollback via Git Revert
1. Revert the problematic commit(s) on your local release branch:
   ```bash
   git revert HEAD
   ```
2. Commit, verify, and push the revert.
3. The automated CI/CD pipeline will deploy the reverted, stable codebase.
