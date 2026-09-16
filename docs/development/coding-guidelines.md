# Coding guidelines

These rules apply to changes in the POLY PMNA repository. The primary goal is to improve maintainability without changing established public behavior, URLs, curriculum meaning, or visual identity unless a change explicitly requires it.

## Core principles

1. **Preserve working behavior.** Do not break Ask POLY, quizzes, mock exams, revision portals, downloads, search, navigation, PWA behavior, SEO metadata, or existing public routes.
2. **Fix root causes.** Trace the owning HTML, CSS, JavaScript, data, build step, or backend route before applying a workaround.
3. **Prefer small, reviewable changes.** One logical concern per commit where practical.
4. **Reuse shared infrastructure.** Extend existing modules, utilities, styles, and maintenance scripts before creating one-off files.
5. **Keep curriculum revisions separate.** Revision 2021 and Revision 2026 may use similar codes or concepts but must not be treated as interchangeable content.

## Repository placement

Use the [repository map](../REPOSITORY-MAP.md) before adding files.

- Public route entry points remain at their established URL paths.
- Shared browser CSS/JavaScript/data/media belongs under `assets/`.
- Revision-specific content belongs in its existing curriculum folder.
- Developer documentation belongs under `docs/`.
- Historical investigations belong under `docs/diagnostics/` or `docs/audits/`.
- Generated QA evidence belongs under `reports/`.
- Build and verification utilities belong under `tools/` or `scripts/`.
- Backend code belongs under `workers/`, `functions/`, or `supabase/` according to the runtime that owns it.

Avoid names such as `final.css`, `new.js`, `copy.html`, `temp-*`, or numbered replacement files unless the number is part of a public compatibility route.

## HTML

- Use semantic landmarks (`header`, `nav`, `main`, `section`, `article`, `footer`).
- Keep one meaningful `h1` per indexable document and maintain logical heading order.
- Associate labels with form controls and keep keyboard interaction intact.
- Give content images meaningful `alt` text; use empty alt text only for decorative images.
- Avoid inline styles and deeply nested wrapper markup when shared CSS can express the layout.
- External links opened with `target="_blank"` must use `rel="noopener noreferrer"` (additional relationship tokens are fine).
- Preserve canonical, description, Open Graph, Twitter card, robots, and structured-data metadata when editing page heads.

## CSS

- Prefer Grid and Flexbox for layout.
- Avoid layout fixes based on arbitrary negative margins, fixed content heights, or unnecessary absolute positioning.
- Reuse existing spacing, typography, color, button, card, and focus patterns.
- Support mobile through desktop without horizontal scrolling; current regression coverage includes 360 px, 414 px, 768 px, and desktop widths.
- Keep interactive targets usable on touch devices; aim for at least 44 × 44 CSS pixels for the effective hit area.
- Preserve visible focus states and sufficient contrast.
- Do not change brand colors or animation intent unless the task calls for a design change.

## JavaScript

- Prefer small functions with explicit responsibilities.
- Use `const` by default and `let` only where reassignment is required.
- Avoid new globals, duplicate event listeners, repeated expensive DOM queries, and duplicated utility code.
- Reuse `window.PolyUtils` helpers for shared browser behavior where applicable.
- Handle failed network requests and partial responses explicitly; do not leave silent promise rejections.
- Escape or safely render user-controlled content rather than concatenating untrusted HTML.
- Keep Ask POLY history and backend request limits aligned with their server validators.

## Accessibility

- Keep the site fully keyboard operable.
- Do not nest interactive controls inside other interactive controls.
- Dynamic search/filter result counts should use an appropriate polite status region.
- Avoid continuously announcing rapidly changing timers.
- Password visibility controls must return to a safe masked state when the relevant view is left.

## Performance

- Measure before adding an optimization.
- Avoid duplicate CSS, JavaScript, SVG, or animation definitions.
- Lazy-load below-the-fold media where it does not harm UX.
- Precompute normalized/searchable values used in hot loops rather than repeatedly transforming them during keystrokes or rendering.
- Cache expensive reusable objects such as formatters when appropriate.
- Keep layout shifts low by providing intrinsic media dimensions and avoiding late structural changes.

## Backend and security

- Secrets never belong in browser JavaScript or committed configuration.
- Keep server credentials in the deployment platform's secret store.
- Validate request shapes, lengths, origins, authentication, and content types on server-side routes.
- Sanitize logs so credentials, tokens, personal data, prompts, and request bodies are not emitted unintentionally.
- Mathematical/text preprocessors must not remove meaningful variables while stripping filler words.

## Tooling and deployment

- The deployable artifact is assembled by `tools/build_public_site.py`.
- Root public URLs are compatibility boundaries; changing source layout requires updating all build, workflow, test, service-worker, and app references together.
- Cloudflare Worker configuration lives with its Worker project; do not leave competing/incomplete Wrangler configuration files that can change deployment resolution.
- PDF generation and publication follow the documentation under `docs/` and the canonical PDF archive workflow.

## Before committing

Run the checks relevant to the change. For broad frontend/repository changes, the expected baseline is:

```bash
python tools/check_repository_layout.py
python tools/site_quality_gate.py
python tools/full_site_static_audit.py
python tools/build_public_site.py --target _site_test
```

Also run the affected Node/Playwright/Worker tests when those areas change. Verify that there are no broken local references, console errors, accessibility regressions, unexpected metadata changes, or altered public paths.

## AI-assisted changes

AI-generated edits are reviewed by the same standard as human edits. Before changing a file, inspect its dependencies and callers. Do not create replacement files merely to avoid understanding existing code, and do not rewrite working behavior without a demonstrated reason.
