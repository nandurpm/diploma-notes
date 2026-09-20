# Six-area audit — 20 September 2026

Repository: `nandurpm/diploma-notes`. Base/deployed commit observed: `e63df9c76dd8d82abb3d622b31c162816f583848`.
Changes: [PR #402](https://github.com/nandurpm/diploma-notes/pull/402), branch `audit/six-area-20260920`.

**Status: fixes committed and tested, not merged or deployed. This is not a claim that every requested production scenario passed.** Device, external-link, authentication and service-access gaps are listed explicitly below. Production observations describe the old deployed version; local/build/CI tests verify the proposed fixes.

## 1. Site discovery, links, layout and navigation

**Found**

- The lesson generator substitutes `TITLE_VAL` before `REV_TITLE_VAL`, corrupting the revision label in 822 Revision 2026 lesson files. Example: `revision-2026-content/lessons/lessons-4042.html:7` contains `REV_Linear Integrated Circuits` in metadata and visible content. Root cause: `scripts/run_generation_workflow.py:98`.
- Conflicting blog stylesheet cache tokens occurred across `blog.html:11`, `admin/review.html:13`, the welcome article and post template.
- Discovery from homepage, sitemap and recursively followed source links found **2,861 internal URLs** (including query variants), **3,194 distinct external URLs**, zero unresolved local routes/references, and no missing description/viewport metadata in those discovered pages. The all-document audit separately examined 1,516 documents, 18 fragments, three utility pages and two parameterized views.
- The initial live homepage showed a subject-rendering fallback and an older menu. After one reload it rendered 28 subject cards; searching `1001` returned one matching card. This was not established as a persistent source defect.
- Initial desktop overflow observations on `lessons-1004.html` and `lessons-3023.html` both disappeared on settled-layout rechecks. The initial measurements preceded shared CSS; no persistent overflow was established on those pages.
- The homepage video is 7,246,299 bytes. It already uses `preload="none"`; size alone is not evidence of slow initial loading.

**Fixed**

- Corrected template substitution order. Added a narrowly scoped, idempotent migration in `tools/build_public_site.py:112` that repairs the existing generated lesson labels during the production build, including metadata/JSON-LD and visible badges. It preserves revision separation and subject content.
- Aligned the four stale blog stylesheet references with the existing current token.
- Added reproducible recursive source discovery in `tools/discover_site_links.py`; this explicitly distinguishes source existence from remote HTTP success.

**Verified**

- Full static audit: zero missing local references, duplicate IDs, metadata/heading policy failures, forbidden SITTTR routes or cache-version conflicts.
- Site quality gate passed all **1,507 sitemap resources**; optimized public build succeeded.
- Regression tests inspect every existing generated Revision 2026 lesson and verify idempotence. A rebuilt artifact contains no `Kerala Polytechnic REV_` corruption.
- Source discovery and live DOM evidence are provided as compressed JSON in `reports/`. Live coverage and recheck results are summarized in the evidence section below.
- Public shell pages inspected share the navigation after scripts settle. Lesson pages intentionally use the repository's fullscreen lesson navigation standard; replacing that with the main menu would change an established design.

**Flagged / not fully verified**

- The 3,194 external URLs were inventoried, not all HTTP-tested. Direct HTTP requests to the production domain timed out from the execution environment. The live browser surface provides DOM inspection, not complete HTTP status/timing instrumentation.
- CI's representative responsive tests cover 360, 414, 768 and 1440 px. This does **not** establish that every discovered page and every interactive control was exercised at every width.
- Complete network timings, every background/icon asset, lazy-loaded image and authenticated route remain outside the verified coverage. Auto-print query variants are included in source discovery but are not automatically invoked during the live crawl.

## 2. Android application

**Found**

- Native WebView app located in `android-app/`. Published GitHub release: `android-v4.0.7`, code **22**, published 18 September 2026; release APK size **980,443 bytes**. This agrees with `downloads/app-update.json:3` and the homepage download.
- Before this audit, `android-app/app/build.gradle:28` still declared **4.0.3/code 18**. The release workflow bumped collisions only in its runner, then discarded the Gradle edit (`.github/workflows/build-android-app.yml`, metadata commit step).
- Source implements trusted HTTPS deep links, cache reset on APK upgrade, default network-aware WebView caching, Android notification permission handling, and a checksum-validated update manifest. These are source observations, not device test results.

**Fixed**

- Prepared **4.0.8/code 23** as an unreleased candidate. The release workflow now commits the version actually built along with release metadata. Added candidate release notes in `android-app/README.md`.
- Left the public manifest on the existing signed 4.0.7 release; it must not advertise an APK that has not been built.

**Verified**

- Latest release, homepage, committed download manifest and release reports compared.
- Candidate code 23 is greater than published code 22; workflow stages the Gradle version and no longer restores/discards it.

**Flagged**

- No attached device/emulator, Android SDK/Gradle build environment or installed-app version was available. **4.0.8 was not rebuilt, installed, launch-tested or published.** Launch crashes, installed deep links, notification delivery and cache recovery require a signed build/device run.
- No Play Store listing/submission was established. Any store resubmission is a release decision. The WebView loads the live site; newer web code alone does not prove an APK update is necessary.

## 3. Comments

**Found**

- `assets/js/help-comments.js:101` loads the newest 40 Firestore documents, but replies whose parent is outside that page disappear during rendering. Deleted parents were also filtered out together with otherwise visible replies.
- The server returns string errors, while the client previously read only `error.message`.
- The implementation is a Help-page discussion, not a comment system on every lesson/blog page. All public writes use `uid: "public"`; `currentUser` remains null. Client PATCH/DELETE code exists, but the Worker implements only POST. There is no verified ownership, edit/delete/moderator UI or reply-notification flow.
- Server rate limiting and a two-link limit exist (`workers/ask-poly-ai/src/secure-index.js:112`, `src/comments.js:113`). A configurable profanity policy or CAPTCHA is not implemented.

**Fixed**

- Fetch missing parents for loaded replies; retain deleted-parent placeholders when replies exist. If a parent request fails, render an unavailable-parent placeholder rather than falsely claiming deletion or hiding the reply.
- Correctly read string API errors.

**Verified**

- Production Help discussion loaded seven top-level threads and their visible replies; the posting control became enabled. No real user's comments were edited/deleted.
- Regression test runs production fetch/render logic with a reply whose parent is outside the loaded page and deleted; both parent placeholder and reply remain visible.
- Worker validation tests pass for malformed input, unsupported fields, excess links, unavailable credentials and unsupported methods.

**Flagged**

- Production posting/editing/deletion/moderation was **not** completed end-to-end. Public test comments were not left behind when the app has no supported ownership/deletion mechanism.
- Nandu needs to choose authenticated ownership or another verified ownership scheme, who moderates, and the spam/profanity policy before enabling destructive comment operations. No permissions or existing comments were changed.

## 4. Ask POLY AI

**Found**

- Live query: “Where can I find the Revision 2026 Electrical Engineering semester 1 syllabus?” returned only English for Technical Communication instead of the matching semester subjects.
- `pdf-intent-parser.js:125` treated revision years as subject codes; `pdf-search.js` silently widened unknown filters and treated requested material type as a ranking preference; `ask-handler.js:1358` selected the first result whenever a revision was supplied.
- Syllabus grounding extracted the first four-digit number from the full path, which can be the revision directory rather than the subject filename.

**Fixed**

- Separate revision years from subject codes, preserve explicitly labelled codes, and avoid interpreting ordinary “give me” as Mechanical Engineering.
- Enforce requested department/revision/material type filters. Return several matching subjects instead of selecting the first. Extract grounding codes from the PDF filename.

**Verified**

- Three new regression tests cover the reproduced semester-wide query, revision/code parsing, and refusal to substitute mismatching material types/revisions/departments. All **100 Worker tests** pass.
- Live student queries also exercised streaming/loading and new-chat behavior. Ohm's-law example (24 V, 12 ohms) correctly returned 2 A. The capacitor-versus-resistor query completed; a fresh chat did not visibly include the previous conversation.

**Flagged**

- The capacitor/resistor answer misleadingly described ordinary resistor resistance as voltage-dependent. Ideal ohmic resistance is constant at fixed conditions. This answer-quality issue remains; the PDF retrieval fix is not a general factual-accuracy guarantee.
- Provider billing/quota dashboards were unavailable. No exhaustive rate-limit/load test or cross-user session-isolation test was performed. Saved local chat history within the same browser is intentional, not by itself cross-session leakage.

## 5. Blog posts

**Found**

- Static catalogue loaders did not reject draft/rejected/future entries. Current database inspection found one published database post and no current database draft leak, but static input lacked the same publication guard.
- The prerender generator's list replacement failed on the current formatted markup because it expected `</div><noscript>` with no whitespace. Its validation also falsely rejected an unescaped ampersand in an otherwise matching title and accepted extra embedded catalogue entries.

**Fixed**

- Filter non-published and future entries in Python prerendering and the browser catalogue normalizer. Preserve legacy static records with no status as published.
- Handle whitespace in the current list layout; compare decoded visible title text; require the embedded catalogue to match exactly the published static set.
- Corrected stylesheet version drift as described in area 1.

**Verified**

- Publication regression tests exclude drafts, rejected/pending/future entries and remove stale cards when the published list becomes empty. Existing prerender validation and blog markup checks pass.
- Live welcome article rendered. The database-backed 30-day study-plan article rendered its sections, date, category and “POLY PMNA Editorial Team” author attribution. No horizontal overflow was observed on that settled desktop page.
- Database public-read policy requires published status, a non-null publication timestamp and a timestamp no later than now.

**Flagged**

- The study-plan cover did not display in this browser; its storage object exists and the public page hid the failed image. The exact delivery failure remains unresolved.
- Welcome article lacks explicit author attribution; the author should be supplied rather than invented. No RSS feed was found. Existing posts do not exercise every possible code/diagram embed.
- Drafts must remain in the protected database workflow. Filtering a static catalogue is not a mechanism for making files committed to a public repository private.

## 6. Admin and approval workflow

**Found**

- Publisher/reviewer logout only removed `poly_blog_admin_session` and reloaded (`assets/js/blog-admin.js:678`, `assets/js/blog-review.js:22`), leaving the server refresh session active.
- The public admin HTML is a static login shell. Deployed RLS and RPC authorization protect data/actions; hiding the HTML URL alone is not a security boundary.
- No separate admin/moderator access-request system was found. The existing approval workflow is for blog submissions and restricts decisions to the site owner.

**Fixed**

- Shared `assets/js/blog-session.js` POSTs to Supabase logout with `scope=local`, times out safely, clears local state in all cases, and tells the user when server revocation could not be confirmed. Both admin workspaces return to the login screen.

**Verified**

- Four logout tests cover success, HTTP failure, network failure and absent session. Modified scripts pass syntax checks.
- Fresh production admin visit exposed the login form, not the publisher workspace.
- Direct deployed-database inspection confirmed RLS on public tables, owner checks in review functions, restricted EXECUTE grants and an installed profile-role protection trigger.
- All four review RPCs rejected a caller without owner identity in explicit database tests; no rows changed.
- An attempted transactional approval lifecycle was rejected by the owner check. A subsequent query confirmed zero audit fixtures remained. **Successful owner approval/resubmission through a logged-in UI is not claimed.**

**Flagged**

- Supabase access JWTs can remain valid until expiration even after refresh-session logout. Immediate revocation requires server-side session validation. See [Supabase sign-out behavior](https://supabase.com/docs/guides/auth/signout).
- Admin bearer/refresh tokens still reside in plaintext `sessionStorage` (not `localStorage`). Moving them into an HttpOnly server session requires an architectural decision; encryption with a browser-held key would not solve XSS exposure.
- No explicit inactivity timeout or immutable blog-decision history was verified. The workflow records the latest reviewer, time and note, and source permits resubmission after rejection/changes requested.
- Supabase advisors reported leaked-password protection disabled and six callable security-definer functions. Their authorization guards were inspected; no privileges were expanded or revoked. Enabling password policy or changing admin authority needs Nandu's decision.

## Evidence and outstanding coverage

- Recursive live DOM crawl exhausted its discovered queue at **1,996 unique page URLs**, including query variants. Twelve initial navigation/load timeouts all succeeded on retry. No visible broken-image entries or 404/not-found page titles were recorded; the two initial overflow observations cleared on settled-layout rechecks. This is a DOM-level result, not proof that every request returned HTTP 200 or every delayed asset loaded. The separately inspected hidden blog cover failure remains flagged above.
- The crawl excludes auto-print actions. Source discovery additionally includes those query variants and inventories external targets. These distinct counts must not be treated as identical coverage.
- Console-error inspection and interactive testing were selective, not exhaustive for all 1,996 URLs.

- CI passed on fix commit `ed8d6e190fe95efe8d0635d2367a4a643f6ab415`: Site Structure Validation, Site quality gate, PDF archive/public build, Secret scan, and Lighthouse budget.
- [CI browser regression run](https://github.com/nandurpm/diploma-notes/actions/runs/35533453665): **122 passed, two skipped**. Representative responsive browser projects: 360 px, 414 px, 768 px, 1440 px. These cover selected pages and flows, not every live page at every width.
- Local verification: 100 Worker tests; 51 frontend/utility tests; 22 Python tests and optimized public build. Per-fix tests are committed alongside their changes.
- Full inventories: `reports/six-area-link-discovery.json.gz` and `reports/six-area-live-crawl.json.gz`. Decompress with `gzip -dk <file>` or Python's `gzip` module.
- No production deployment, APK publication, admin permission change or persistent test-data mutation was performed.

## Fix commits

| Commit | Change |
|---|---|
| `20d55e3` | Align blog stylesheet versions |
| `e9206f0` | Correct AI PDF parsing, filtering and result selection |
| `729e7a6` | Revoke current Supabase refresh session on logout |
| `d47f75d` | Preserve replies to older/deleted parents |
| `26c0ffe` | Preserve Android release versions; prepare 4.0.8 candidate |
| `650923a` | Filter static blog publication and repair prerendering |
| `ed8d6e1` | Repair generated lesson revision labels |
