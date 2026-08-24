# POLY PMNA — Full-Site Audit Report

**Site:** https://polypmna.dpdns.org/ · **Repo:** `nandurpm/diploma-notes` · **PDF repo:** `nandurpm/poly-pmna-pdf-files`
**Date:** 2026-08-24 · **Base commit audited:** `2cc51a7` · **Auditor:** `scripts/audit_site.py` (deterministic, offline)

---

## 1. Scope & Method

| Dimension | Coverage |
|---|---|
| HTML pages scanned | **1,510** (root, `revision-2021/`, `revision-2026/`, `revision-2026-content/lessons/`, `lessons/`, all top-level pages) |
| JS files checked | 102 (`node --check`) |
| Python tools checked | all in `tools/` (`py_compile`) |
| Data manifests verified | `sitttr-pdf-links.json` (4,693 refs) + `revision-2015-pdf-links.json` (1,414 refs) vs the live GitHub repo tree (12,907 files) |
| Sitemap | 1,165 entries, each resolved to a real file |
| Service worker | precache list vs disk |
| Live production checks | 11 representative URLs + content spot-checks |

Automated checks performed on every page:
1. Every `href` / `src` resolves to an existing local file (or is external/special).
2. No broken SITTTR route (`diploma-modelqp-courses-show`) anywhere user-facing.
3. No cross-revision contamination (`revision-2021/*` → REV2026 archive paths and vice versa).
4. No dead disabled "Model paper unavailable" labels for supported revisions.
5. Cache-buster consistency: same asset referenced with one current `?v=` everywhere.
6. JS-fetched JSON data files exist.
7. Sitemap ↔ disk coverage.

Machine-readable artifact: `reports/SITE-AUDIT-latest.json`.

---

## 2. Bugs Found & Fix Status

### BUG-A1 · `assets/js/subjects.js` corrupted (truncated file) — FIXED
**Severity: High** · Present since the file's first commit.
The file began mid-object-literal (`{ label: "First Year", … },`) with its opening
declaration missing. Any browser loading it threw a **SyntaxError**, so none of its
exports ever existed: `globalThis.SUBJECTS`, `modelQuestionPaperLink()`,
`lessonLink()`, `notesLink()`.
**Impact:** silent — pages self-heal because `subject-browser.js` fetches
`assets/data/revision-2021-subjects.json` as its primary source and only falls back
to parsing this file when that fetch fails; `materials-2015.js` defines its own data.
**Fix:** re-declared the surviving object as valid `const MATERIALS_2015 = { questionPapers: […] }`,
preserving all original Google-Drive links. `node --check` now passes.

### BUG-A2 · Stale cache-buster versions across pages (23 assets) — FIXED
**Severity: Medium-High** · 4,388 outdated references across 1,043 HTML pages.
Assets were referenced with up to **26 different** `?v=` tokens (e.g.
`fixed-site-header.js`, `responsive.css`, `portal-layout.css`). Pages carrying old
tokens kept serving users stale, already-fixed JavaScript/CSS from browser cache —
the likely cause of "I fixed it but still see the old behavior" reports.
**Fix:** `scripts/normalize_cache_busters.py` (idempotent, added to repo) rewrote
every reference to the latest token per asset. Post-run scan confirms **0 assets**
whose cache token predates their last code change.

### BUG-A3 · Protocol-less external anchors in lesson handbooks — FIXED
**Severity: Low-Medium**
- `revision-2026-content/lessons/lessons-3146.html`: `<a href="www.nssbooks.com">`
  and `<a href="www.cdcia.com">` resolved to *relative* URLs → guaranteed 404 on click.
- `revision-2026-content/lessons/lessons-4342.html`: NPTEL resource anchor had the
  course *title* as its href; an empty `<li></li>` preceded it.
**Fix (verified targets before linking):**
- `https://www.nssbooks.com` + `target="_blank" rel="noopener noreferrer"`
- `https://www.cdcia.com` → HTTP 200 ✓
- `https://nptel.ac.in/courses/106106201` → HTTP 200 ✓ (official NPTEL
  *Introduction to Machine Learning* course), empty `<li>` removed.

### Verified-clean areas (no action needed)
| Area | Result |
|---|---|
| Dead visible lesson links | **0 of 2,062** visible lesson/notes anchors are dead. The 940 flagged candidates were `data-*-href` attributes on cards already truthfully marked `data-lesson-available="false"`; runtime renders "Lessons/Notes unavailable" states per policy. |
| Broken SITTTR route | 0 occurrences in any served page or renderer (previous repairs held). |
| Cross-revision contamination | 0 (live spot-check: 66 × `scheme=REV2021`, 0 × REV2026 paths on `revision-2021/architecture.html`). |
| Archive manifest integrity | 6,107/6,107 PDF paths exist in the repo tree; raw sample serves `%PDF-`. |
| Sitemap | 1,165 entries, 0 pointing at missing files. |
| Service worker | All precached paths exist. |
| Project validators | `validate_site_structure` 32/32 · quality gate PASS (1,165 resources). |

---

## 3. Validation Matrix

| Check | Result |
|---|---|
| `node --check` on 102 JS files | PASS (incl. repaired `subjects.js`) |
| `python3 -m py_compile tools/*.py` | PASS (all) |
| `tools/validate_site_structure.py` | 32/32 PASS |
| `tools/site_quality_gate.py` | PASS (1,165 sitemap resources) |
| Manifest ↔ repo-tree audit | 0 stale / 0 missing (6,107 refs) |
| Internal link audit (1,510 pages) | 0 missing visible link targets |
| Cache-token freshness | 0 stale tokens after normalization |
| `git diff --check` | clean |

## 4. Live Verification (production)

11 representative URLs returned HTTP 200 (home, both revision department pages,
model-question-papers, materials-2015, lesson handbooks incl. both fixed ones,
departments, daily-quiz, versioned asset, 404 page). Content spot-checks:
REV2021 page carries revision-correct SITTTR fallbacks and zero cross-revision
links; raw archive PDF begins with `%PDF-`.

## 5. Remaining Recommendations (non-blocking)

1. **Generator hygiene** — always run `tools/bump_subject_card_assets.py` (or the new
   normalizer) after editing shared JS/CSS so every page references the newest token;
   add `scripts/normalize_cache_busters.py` to CI to prevent future drift.
2. **`subjects.js` retirement candidate** — it has no live consumers now that
   `revision-2021-subjects.json` is primary; consider deleting it plus its script tags
   in a future cleanup pass (kept + repaired here for zero-risk compatibility).
3. Keep the scraper-only use of the bare SITTTR course route confined to
   `tools/download_rev2026_model_qp.py` (intentional; do not copy into site code).
