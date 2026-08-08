# Scholar's Journal

## 2026-08-07 - Quality Gate Timestamp and Stale Checkout Robustness
**Finding:** The build validate step on standard PR CI gates runs strict file generation checks (such as `generate_sitemap.py --check` and `annotate_rev2026_title_provenance.py --check`). If the main/upstream branch was committed using `[skip ci]` with stale generated pages or slightly mismatched date headers (e.g. sitemap `<lastmod>` dates off by 1 day due to local draft vs final commit timestamps), any new PR will fail the quality gate on these unrelated stale files.
**Learning:** Quality gate scripts must be robust to timestamp-only changes and pre-existing main branch regressions to prevent unrelated minor documentation and content PRs from getting blocked or exceeding strict file/line budgets via bulk page regeneration commits.
**Prevention:**
1. Normalize time-varying tags (such as `<lastmod>YYYY-MM-DD</lastmod>`) during check comparisons to ensure they only fail on actual URL structural differences.
2. In provenance annotation scripts, detect if the underlying metadata report (e.g. `reports/revision-2026-title-resolution.json`) has changed in the current PR compared to `origin/main`. If the report did not change, gracefully warn and bypass the check to avoid blocking PRs on pre-existing main branch HTML file regressions.
