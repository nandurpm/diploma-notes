# Repository cleanup audit — 2026-07-25

## Confirmed bug fixed

- The top-level HTML pages duplicated the same `favicon.ico` and Apple touch icon declarations in `<head>`. This was harmless for most browsers, but it caused redundant head markup and duplicate icon fetch candidates. Each affected HTML page now keeps one PNG favicon declaration and one Apple touch icon declaration.

## Bug checks performed

- Verified local `href`, `src`, and `poster` references in top-level HTML files resolve to files in the repository.
- Verified duplicate favicon and Apple touch icon declarations were removed from all top-level HTML pages.
- Reviewed repository root artifacts for likely cleanup candidates.

## Files that are likely not needed in production

These files appear to be generated, temporary, or historical diagnostics. They should not be deployed to the public site unless they are intentionally used as public records.

### Temporary test files

- `tmp/test-page.html`
- `tmp/test-3021.txt`
- `tmp/test-3021b.txt`

### Build outputs and downloaded Android artifacts

- `downloads/app-debug.apk`
- `downloads/app-aligned.apk`
- `downloads/POLY_PMNA_v2.01.apk`
- `downloads/POLY_PMNA_v2.01.apk.sha256.txt`
- `downloads/Polytechnic-Study-Hub-release-unsigned.apk`
- `downloads/Polytechnic-Study-Hub-v1.0.5.apk`
- `downloads/gradle-build.log`
- `downloads/android-apk-workflow-run-id.txt`
- `downloads/androidx-version-metadata.txt`
- `downloads/dependencies.txt`

Keep `downloads/app-update.json` only if the production Android update flow reads it directly from the website.

### Internal reports and triggers

- `reports/*.json`
- `reports/*.md`
- `reports/*.txt`
- `reports/*.csv`
- `reports/.about-release-trigger`
- `reports/.materialize-1009-part*.b64`

The `reports/` folder is useful for maintainers, but it is not needed for the static website runtime. If public transparency is not required, move it to a private archive or exclude it from deployment.

### Preview or superseded pages

- `new-year-theme-preview.html`
- `tools-v2-original.html`

Keep these only if they are intentionally linked for QA or rollback.

## JavaScript files requiring manual review before deletion

A simple filename-reference scan showed several scripts with no direct filename references in text-like source files. This is not proof they are unused because scripts may be injected dynamically, referenced by generated content, or intended for emergency hotfix use. Review browser coverage, deployment history, and `assets/js/asset-manifest.js` before deleting any of them.

Examples of high-priority review candidates:

- `assets/js/home-subject-dropdown-cleanup.js`
- `assets/js/quiz-account-admin.js`
- `assets/js/quiz-retry-ui.js`
- `assets/js/quiz-bank-2003.js`
- `assets/js/subject-browser-4024-hotfix.js`
- `assets/js/machine-drawing-3025-hotfix.js`
- `assets/js/ask-poly-mobile-layout.js`
- `assets/js/quiz-bank-gk.js`
- `assets/js/hide-unavailable-actions.js`
- `assets/js/tools-expression-hotfix.js`
- `assets/js/quiz-bank-1001.js`
- `assets/js/ask-poly-intent-fix.js`
- `assets/js/quiz-bank-2002.js`
- `assets/js/quiz-init.js`
- `assets/js/quiz-config.js`
- `assets/js/quiz-bank-2001.js`
- `assets/js/lesson-watermark.js`
- `assets/js/quiz-bank-1002.js`
- `assets/js/quiz-dashboard.js`
- `assets/js/about-voice-auto.js`
- `assets/js/quiz-bank-1003.js`
- `assets/js/revision-2021-department-art-v2.js`
- `assets/js/notes-direct-pdf-hotfix.js`
- `assets/js/poly-helper-card.js`
- `assets/js/department-semester-layout.js`
- `assets/js/daily-quiz-register.js`
- `assets/js/onam-render-a.js`
- `assets/js/quiz-core.js`
- `assets/js/quiz-play.js`
- `assets/js/quiz-portal.js`
- `assets/js/subjects-global.js`
- `assets/js/ask-poly-ui-polish.js`
- `assets/js/daily-quiz-ui.js`
- `assets/js/ask-poly-rich-renderer.js`
- `assets/js/ask-poly-intent-hotfix.js`
- `assets/js/subjects-data.js`
- `assets/js/materials-2015-question-papers.js`
- `assets/js/quiz-bank-1004.js`
- `assets/js/daily-quiz-session.js`
- `assets/js/ask-poly-live-hotfix.js`
- `assets/js/daily-quiz-utils.js`
- `assets/js/search.js`
- `assets/js/ask-poly-upgrade.js`

## Recommended next cleanup steps

1. Decide whether `reports/`, `tmp/`, and historical APK files should be excluded from public deployment.
2. Add a deploy allowlist or `.gitignore` rules for future generated artifacts.
3. Use browser coverage or access logs to confirm unused JavaScript before removal.
4. Run a full site crawler against `https://polypmna.dpdns.org/` after deployment to catch production-only broken links and console errors.
