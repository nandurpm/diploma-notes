# SITTTR Link Audit — POLY PMNA (August 23, 2026)

**Auditor:** Buffy · **Repo:** nandurpm/diploma-notes · **PDF repo:** nandurpm/poly-pmna-pdf-files
**Live site:** https://polypmna.dpdns.org/

## Method

1. Enumerated every live page (`*.html`) and data/resolver file (`assets/js/*.js`, `assets/data/*.json`).
2. Verified the official SITTTR source indexes over HTTP (status 200):
   - `diploma-modelqp&scheme=REV2026` / `REV2021` / `REV2015` — all reachable, programme lists present.
   - `diploma-syllabus-course-contents&course={code}&scheme=REVXXXX` — returns the actual PDF (`%PDF-`).
   - `diploma-syllabus-course-contents&course={code}` (bare, REV2015 default) — returns `%PDF-` (valid).
   - **`diploma-modelqp-courses-show&course={code}` — broken route: HTTP 200 page containing "not found"** (bare and with `scheme=`).
3. Enumerated the full `poly-pmna-pdf-files` tree (9,400 blobs) and diffed every manifest entry:
   - `sitttr-pdf-links.json` (REV2021 + REV2026): **4,693/4,693 manifest paths exist** on disk; sampled raw URLs serve `%PDF-` (HTTP 200).
   - `revision-2015-pdf-links.json`: 964 entries, 950 syllabi + 464 model papers, all paths exist on disk.

## Before-edit inventory (issues found)

| # | Location | Issue | Count | Severity |
|---|---|---|---|---|
| 1 | `revision-2021/*.html` (50+ department pages) | Static subject cards link **REV2026 syllabus PDFs** for REV2021 subjects (cross-revision contamination) | 2/page | **High** |
| 2 | `revision-2021/*.html` | Dead `Model paper unavailable` disabled spans remain where the official **REV2021 model-QP index exists** | 1/page | High |
| 3 | `data/knowledge-base.json` | `modelQuestionUrl` → broken `diploma-modelqp-courses-show` (Ask POLY / Site Assistant retrieval) | 1,272 | High |
| 4 | `assets/data/revision-2015-subjects.json` | `modelQuestionPaperUrl` → broken `courses-show` route for all subjects | 968 | High |
| 5 | `assets/js/materials-2015.js` | Falls back to broken `courses-show` URL; keeps dead `Model QP not listed` span even though official REV2015 index exists | 174 broken + 330 disabled | High |
| 6 | `lessons/lessons-3032.html`, `lessons/lessons-3044.html` | "Official model paper" button → `courses-show&course=3032/3044` (REV2021) | 2 | Medium |
| 7 | `revision-2026-content/lessons/lessons-1021.html`, `lessons-1182.html` | "Official model papers" button → `courses-show&course=1021/1182` (REV2026) | 2 | Medium |
| 8 | `assets/data/sitttr-archive-links.json` | `sourceUrl` provenance fields → broken `courses-show` route | ~all 2015 entries | Info (no consumer) |
| 9 | `tools/download_rev2026_model_qp.py` | Scraper that intentionally uses `courses-show` | — | **Leave (tool)** |

## Verified-correct (kept as-is)

- `sitttr-pdf-links.json` (2021/2026): 4,693 exact archive paths, all exist, all `%PDF-`.
- `revision-2026/*.html` department pages: all syllabus/model links are `revision-2026/...` (no cross-rev).
- REV2015 syllabus: manifest 950/968 + official `course-contents` fallbacks are valid `%PDF-`.
- Homepage / hub pages: point to `diploma-modelqp&scheme=REV20xx` and `special-docs` indexes (valid).
- `model-question-papers.html`, `syllabus.html`: scheme-aware links (valid).

## Actions taken

- Regenerate REV2021 department pages from `tools/materialize_rev2021_subjects.py` (source of truth), which emits revision-aware syllabus PDFs and the official REV2021 model-QP index fallback.
- Rewrite the broken `diploma-modelqp-courses-show` occurrences in knowledge base, 2015 subject data, 2015 renderer, and lesson pages to the revision-specific official index.
- Add a deterministic repair tool so the fix is idempotent and re-verifiable.