# POLY PMNA website audit and remediation prompt

## Audit scope and confidence

This audit covers the repository versions of the ten requested public routes: `/`, `/index.html`, `/about.html`, `/revision-2021.html`, `/revision-2026.html`, `/daily-quiz.html`, `/ask-poly.html`, `/materials-2015.html`, `/tools.html`, and `/contact.html`. The public host returned `403 Forbidden` from this environment, so visual and runtime findings must be rechecked in a real browser against the deployed site before they are closed. Static findings below were verified against the current branch.

## Verified issue inventory

### P0 — broken destinations and content integrity

1. Three lesson pages still link to the nonexistent `/revision.html`: `lessons/lessons-5043.html`, `lessons/lessons-4043.html`, and `lessons/lessons-5041.html`. Route each link to the correct curriculum directory, not merely to a guessed replacement.
2. `revision-2026-content/lessons/lessons-2002B.html` references a missing `revision-2026-content/notes/downloadable-notes-2002B.pdf`. Either add the verified PDF or render the resource as unavailable without a clickable link.
3. The sitemap omits the whole Revision 2026 directory, all 38 Revision 2026 programme pages, Ask POLY, Tools, and many existing lesson pages. Generate the sitemap from the actual publishable route set so it cannot drift manually.
4. Treat `/` as the canonical homepage. Keep `/index.html` working, but ensure it has the same canonical URL and avoid presenting both as separate URLs in navigation, analytics, or the sitemap.

### P1 — information architecture and duplicated choices

1. The homepage presents Revision 2026 and Revision 2021 in the global **Study** menu, hero buttons, introductory copy, subject-finder revision selector, and directory messaging. Mock Exams, Ask POLY AI, Tools, 2015 Materials, and Help likewise occur in global navigation and again as six large cards. This is technically valid but creates choice duplication and makes every option look equally important.
2. Replace the homepage with one clear primary journey: **choose curriculum → choose programme/department → choose semester/subject**. Make Revision 2026 the primary action and Revision 2021 a visibly labelled legacy action. Keep the subject search as the secondary fast path.
3. Reduce the repeated service grid to a compact “More student services” section for Ask POLY, Mock Exams, Tools, archive, and Help. Do not repeat the two curriculum directory calls there.
4. Use one vocabulary consistently. The current UI alternates among “programme,” “department,” “scheme,” “revision,” “current curriculum,” and “legacy curriculum.” Recommended rules: **Revision** for 2026/2021; **programme** for the official course list; **department** only where the institution’s department is genuinely meant; **2015 archive** for old materials.
5. The Revision 2026 directory says “38 official programmes” in metadata but displays “38 Departments” and “38 departments available.” The Revision 2021 page uses “43 programmes.” Standardize both directories on “programme(s)” unless the official source explicitly calls them departments.
6. `daily-quiz.html` is titled “Revision 2021 Mock Exams & Daily Quiz,” while the global label and homepage card say only “Mock Exams.” Rename the navigation destination to **Quiz & Mock Exams** or split the features into distinct routes. Always show the Revision 2021 limitation in the label or immediate supporting text.
7. Contact is presented as **Help** in navigation, **Report a Problem** on the homepage, and **Help, Corrections & Content Requests** in the page title. Choose one primary name (recommended: **Help & corrections**) and use it throughout.

### P1 — accessibility and semantic structure

1. `daily-quiz.html` contains two `h1` elements in separate application states (“Revision 2021 Mock Exams” and “Welcome”). Keep one page-level `h1`; make the signed-in state heading an `h2`, or update the single `h1` text dynamically.
2. `materials-2015.html` jumps from `h1` directly to card `h3` headings before any section `h2`. Give each card group a visible or screen-reader-only `h2`, then nest cards beneath it.
3. `tools.html` ships an empty modal `h2`. Although JavaScript fills it, assistive technology can encounter an unnamed dialog during failure or transition states. Give the dialog a safe default title and maintain focus trapping, Escape close, focus restoration, and background inertness.
4. Several buttons omit an explicit `type`, including directory controls and authentication/tool controls found by static inspection. Set non-submit controls to `type="button"`; retain `type="submit"` only for form submission.
5. Test the JavaScript-rendered header without JavaScript. The source header and footer are empty placeholders, so users and crawlers receive no primary navigation if `site-shell.js` fails. Prefer server/static HTML as the baseline and let JavaScript enhance it.
6. Test all search result announcements. Revision filters must report both visible count and zero-result state through a non-noisy live region; clearing a search must restore focus predictably.
7. Verify keyboard operation of the Study submenu: Enter/Space toggle, Escape closes and restores focus, outside click closes, focus does not disappear, and the mobile menu cannot leave off-screen links focusable.
8. Run axe at 320, 375, 768, 1024, and 1440 CSS pixels, in light/dark browser preferences and at 200% zoom. Fix contrast, focus visibility, reflow, tap target size, and reduced-motion issues rather than suppressing rules.

### P1 — maintainability, loading, and runtime risk

1. The homepage loads 14 stylesheets and 11 scripts. Many pages stack base CSS, additions, hardening, responsive fixes, portal layout, fixed-header fixes, and page-specific overrides. Consolidate the cascade into tokens, base, components, utilities, and one page bundle; remove superseded declarations after visual regression testing.
2. The repository has many inline `<style>` blocks and widespread `!important` usage. Move stable rules to owned component stylesheets. Reserve `!important` for documented utility/accessibility exceptions.
3. Multiple filenames are explicitly “hotfix” or “fix,” and related scripts overlap (for example lesson availability/navigation fixes, Ask POLY intent/live hotfixes, quiz fallbacks, and fixed header/site shell scripts). Trace load order and merge each feature into one authoritative module. Delete obsolete variants only after confirming no HTML references remain.
4. Cache-busting versions are inconsistent across a single page (architecture, home-clean, and model-QP suffixes). Produce one build identifier and apply it automatically to all emitted assets.
5. `tools.html` loads its main tool script synchronously near the end while other scripts are deferred. Confirm whether ordering requires this; otherwise use modules/defer consistently to avoid main-thread blocking.
6. The homepage video is a prominent payload. Keep `preload="metadata"`, compress and size the poster, provide captions/transcript where speech conveys information, and test that it does not cause layout shift or dominate mobile data use.
7. External dependencies (Google Fonts, jsDelivr Supabase, official SITTTR pages, Google Drive/archive folders, Instagram, and the Ask POLY backend) need explicit timeout/error/empty states. A third-party failure must not leave “Loading…” indefinitely.

### P2 — visual consistency and content polish

1. Revision 2021 cards use `h3`, while visually equivalent Revision 2026 cards use `h2`. After fixing section hierarchy, use the same card-heading level and component markup in both directories.
2. Revision 2021 and Revision 2026 use separate switch, search, result-count, empty-state, card, and summary patterns. Build one revision-directory component configured by data; preserve a distinct legacy badge/color without changing interaction behavior.
3. Avoid all-caps micro-labels as the only scheme indicator. Pair color with text such as “Current · Revision 2026,” “Legacy · Revision 2021,” and “Archive · 2015.”
4. Make active states consistent across global navigation, revision switchers, filters, and cards. Do not rely on color alone; use `aria-current`, text/icon cues, and sufficient contrast.
5. Normalize title casing: “Question Papers,” “All Departments,” “Recently used,” and similar labels currently mix title and sentence case.
6. Replace repeated generic card copy (“Open Semester 1 to Semester 6 subject cards”) with useful distinctions only if verified; otherwise use a single reusable component description rather than duplicating text 43 times.
7. Ensure loading text (“Loading today…”, “Loading tools…”, and “Loading links…”) always transitions to content, an empty state, or an actionable error state.

### P2 — SEO, metadata, security, and reliability

1. Generate a complete sitemap from actual deployable HTML and exclude development/alternate files such as `tmp/`, `tools-v2-original.html`, and experimental Ask POLY variants. Validate every sitemap URL returns 200 and has a self-consistent canonical.
2. Add or verify canonical, description, Open Graph, Twitter card, and social-image metadata on every indexable top-level route. Do not index login/reset, duplicate variants, or thin application states unless intentionally searchable.
3. Add structured data only when accurate: `WebSite`/`SearchAction` for site search and `BreadcrumbList` for visible breadcrumbs. Do not invent educational-course facts.
4. Review the CSP/security headers against actual external origins and remove unused allowances. Verify `target="_blank"` links retain `rel="noopener noreferrer"`.
5. Never expose Supabase service-role credentials or privileged quiz/admin operations in browser code. Confirm authorization with row-level security and server-side checks; frontend hiding is not access control.
6. Add automated validation for duplicate IDs, one meaningful `h1`, label/name coverage, missing local assets, broken internal links, canonical correctness, sitemap coverage, and accidental references to retired routes.

## Copy-paste implementation prompt for an AI coding agent

```text
You are improving the static POLY PMNA website in the nandurpm/diploma-notes repository. Work from evidence, not assumptions. First read all AGENTS.md files and the repository documentation. Inspect the current branch and serve the site locally. Do not rewrite curriculum data or claim that a resource is official unless verified against the configured source.

Goal: simplify the information architecture, remove repeated homepage choices, repair verified broken routes/assets, unify the 2021/2026 directory experience, improve accessibility and metadata, and reduce overlapping CSS/JavaScript without regressing working subject, quiz, AI, archive, or tool flows.

Required work, in order:

1. Establish a baseline
   - Inventory every publishable HTML route and its internal assets/links.
   - Capture desktop and mobile screenshots for the ten principal routes.
   - Run an HTML/accessibility/link audit and save machine-readable results.
   - Record functional smoke tests for header, revision switch, programme filters, subject finder, quiz auth/guest path, Ask POLY error/success states, 2015 links, each tool modal, and contact links.

2. Fix integrity defects
   - Resolve the three `/revision.html` links in lessons-5043, lessons-4043, and lessons-5041 by identifying each page’s correct revision.
   - Add the verified 2002B PDF or replace its missing link with an honest unavailable state.
   - Generate sitemap.xml from the publishable route inventory. Include Revision 2026, its 38 programme pages, Ask POLY, Tools, and all intended lessons. Exclude tmp, node_modules, alternates, experiments, and noncanonical duplicates.
   - Keep `/` canonical and make `/index.html` consistent with it.

3. Simplify homepage architecture
   - Create one primary journey: Revision 2026 (current) → programme → semester/subject.
   - Present Revision 2021 once as a clearly labelled legacy alternative and 2015 once as archive.
   - Keep subject search as the secondary fast path.
   - Move Ask POLY, Quiz & Mock Exams, Tools, archive, and Help & corrections into a smaller supporting-services group.
   - Do not repeat the same destination in the hero and a large card grid unless user testing establishes a distinct purpose.

4. Unify terminology and directory components
   - Use Revision for 2026/2021 and programme for the official list. Use department only where institution structure is meant.
   - Standardize “38 programmes” and “43 programmes” across metadata, summaries, counts, empty states, and copy.
   - Build one accessible directory component used by both revisions, with data/config controlling content and a visible Current/Legacy distinction.
   - Preserve all valid URLs and add redirects if any route must change.

5. Correct accessibility
   - Exactly one meaningful h1 per rendered page state.
   - No skipped heading levels; equivalent cards use equivalent semantic markup.
   - Every input has an associated label/name; every non-submit button has type=button.
   - Dialogs have a nonempty accessible name, focus trap, Escape close, focus restoration, and inert background.
   - Header and essential navigation work without JavaScript; JavaScript enhances rather than creates the only navigation.
   - Search/filter status and error states are announced appropriately.
   - Pass keyboard-only testing, 200% zoom/reflow, prefers-reduced-motion, and axe at 320/375/768/1024/1440 widths.

6. Consolidate implementation
   - Replace layered hotfix/fix scripts with one authoritative module per feature.
   - Consolidate CSS into documented layers; eliminate obsolete rules and most !important usage.
   - Use one generated build/cache version across emitted assets.
   - Preserve progressive loading and explicit timeout/error/empty states for every external dependency.
   - Do not put try/catch around imports and do not expose privileged credentials in client code.

7. Validate before completion
   - Run the project’s tests plus HTML validation, internal link/asset checks, axe, sitemap/canonical checks, and JavaScript syntax/lint checks.
   - Test the ten requested public routes at mobile and desktop sizes and attach before/after screenshots.
   - Confirm there are no console errors, duplicate IDs, broken internal links, missing local files, indefinite loading states, or keyboard traps.
   - Report any external URL that cannot be tested separately; do not mark it fixed without evidence.

Acceptance criteria:
- Homepage no longer repeats both revision destinations and all major services at equal prominence.
- Current, legacy, and archive content are unmistakable without relying on color.
- Revision directory terminology and interaction are consistent.
- Verified broken links/assets are fixed or honestly unavailable.
- One h1 per state, valid heading hierarchy, usable keyboard navigation/dialogs, and no serious axe findings.
- Complete, canonical sitemap generated from real publishable routes.
- No regression in programme counts, filters, subjects, lessons, quiz, Ask POLY, materials, tools, or help.
- CSS/JS consolidation is demonstrated by fewer overlapping page assets and removal of superseded hotfixes, not by hiding them behind more overrides.

Make small, reviewable commits. In the final report, list changed files, exact test commands/results, remaining risks, and screenshots. Do not claim the deployed site is corrected until deployment and post-deploy smoke tests succeed.
```

## Recommended delivery sequence

1. **Integrity PR:** broken internal links, missing-resource state, sitemap generator, canonical checks.
2. **Accessibility PR:** headings, explicit button types, static navigation fallback, dialog and filter keyboard behavior.
3. **Architecture PR:** homepage hierarchy, terminology, shared revision-directory component.
4. **Consolidation PR:** remove obsolete CSS/JS fixes using screenshot and functional regression coverage.
5. **Deployment verification:** test the public host, external dependencies, headers, analytics/canonical behavior, and mobile devices.
