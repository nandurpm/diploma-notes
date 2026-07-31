# POLY PMNA Coding Guidelines

Version: 1.0

---

# 📚 Project Overview

POLY PMNA is a modern educational platform for Kerala Polytechnic students.

Primary objectives:

- Revision 2026
- Revision 2021
- Materials 2015
- Ask Poly AI
- Daily Quiz
- Engineering Tools
- Student Resources

The website is optimized for:

- Desktop
- Tablet
- Mobile
- PWA
- SEO
- Accessibility

---

# 🎯 Development Philosophy

Always improve quality without changing the overall design language.

Every change must be:

- Minimal
- Maintainable
- Responsive
- Accessible
- Backward compatible

Never rewrite working code without a clear reason.

---

# ⚠ Never Break Existing Features

Do NOT remove or break:

- Ask Poly AI
- Daily Quiz
- Revision 2026
- Revision 2021
- Materials 2015
- Download buttons
- Navigation
- Search
- Theme
- Animations
- SEO metadata

---

# Root Cause Rule

Never apply temporary workarounds.

Always identify the root cause.

Bad:

Reduce margin until it "looks okay."

Good:

Find which parent container creates unnecessary spacing.

---

# HTML Guidelines

Use semantic HTML.

Preferred:

<header>

<nav>

<main>

<section>

<article>

<footer>

Avoid excessive nesting.

Bad

<div>
<div>
<div>
<div>

Good

<section>

<article>

Never add empty spacer divs.

Never use inline styles unless absolutely necessary.

---

# CSS Guidelines

## Layout

Prefer:

CSS Grid

Flexbox

Avoid:

Absolute positioning

Negative margins

Fixed heights

Large min-height values

100vh for content sections

---

## Responsive Design

Support:

1920px

1600px

1440px

1366px

1280px

1024px

768px

540px

430px

390px

375px

360px

320px

No horizontal scrolling.

---

## Spacing

Preferred spacing:

8px

12px

16px

20px

24px

32px

48px

Avoid random values.

---

## Typography

Use clamp() when appropriate.

Example

font-size:

clamp(1rem,2vw,1.25rem);

---

## Colors

Never change branding colors unless requested.

---

## Shadows

Keep shadows subtle.

Avoid heavy shadows.

---

## Animations

Preserve existing animations.

Do not remove animations unless fixing performance.

---

# JavaScript Guidelines

Use modular functions.

Avoid:

Global variables

Duplicate listeners

Repeated DOM queries

Use:

const

let

async/await

Graceful error handling

Never remove working functionality.

---

# Performance

Reduce:

Unused CSS

Unused JS

Duplicate CSS

Duplicate HTML

Duplicate SVG

Duplicate animations

Optimize:

Images

Lazy loading

Font loading

DOM size

Layout shifts

---

# Accessibility

Maintain:

ARIA labels

Keyboard navigation

Visible focus

Alt text

Semantic HTML

Color contrast

---

# SEO

Never remove:

title

description

Open Graph tags

Twitter cards

Structured data

Canonical URLs

Robots directives

Sitemap references

---

# Images

Always verify:

Correct path

Responsive sizing

Alt text

Lazy loading

No layout shifts

Do not distort aspect ratio.

---

# Logo

The logo must always:

Display correctly

Scale correctly

Work in desktop

Work in tablet

Work in mobile

Never disappear because of CSS.

---

# Hero Sections

Hero sections must:

Size according to content.

Avoid:

height

min-height

100vh

unless absolutely necessary.

---

# Cards

Cards should:

Have consistent spacing

Equal heights where appropriate

Be responsive

Never overflow

Never clip shadows

---

# Navigation

Navigation must:

Be responsive

Maintain spacing

Never wrap incorrectly

Support keyboard navigation

Highlight active page

Support mobile menu

---

# Footer

Footer should:

Remain consistent

Contain working links

Display properly on every page

---

# File Structure

Prefer:

assets/

css/

js/

images/

icons/

revision-2026/

revision-2021/

materials-2015/

Do not move files unnecessarily.

---

# Naming Convention

Use:

kebab-case

Examples

daily-quiz.js

portal-layout.css

revision-2026.html

Avoid:

final.css

new.css

temp.css

copy.css

---

# Before Making Changes

Always inspect:

Parent containers

Shared CSS

Responsive CSS

JavaScript

HTML structure

Never assume.

---

# Before Committing

Verify:

✓ No broken pages

✓ No console errors

✓ No broken images

✓ No broken links

✓ Responsive

✓ Accessibility

✓ Performance

✓ SEO

✓ No duplicate code

---

# Git Rules

One logical change per commit.

Good:

Fix Materials 2015 whitespace

Improve navbar responsiveness

Optimize Revision 2026 cards

Bad:

Fix 20 unrelated problems in one commit.

---

# AI Agent Rules

Before editing:

1. Read the complete file.

2. Understand dependencies.

3. Explain the root cause.

4. Modify only necessary files.

5. Preserve design.

6. Preserve functionality.

7. Verify responsiveness.

8. Verify accessibility.

9. Verify performance.

10. Summarize changes.

Never make blind changes.

Never guess.

Always inspect first.

---

# 🚀 Advanced Portal & Tooling Standards

## ⚡ Performance & Caching Patterns

- **Pre-compute & Cache Lookup Values**:
  - Avoid computing dynamic strings (e.g., lowercase conversion, string concatenation, or regex-based normalization) inside active loops or event handlers (like scroll, search keypress, or render loops).
  - Cache lowercase search strings (`_searchText`) during initialization (`init()`).
  - Pre-compute and cache normalized search fields (`_normCode`, `_normName`, `_normDept`) during initialization to keep the site-assistant's query loops ultra-fast.
- **Cache Expensive Objects**:
  - Cache costly repeated instantiations like `Intl.DateTimeFormat` in module scope (e.g., in `PolyUtils.formatDateKey`) to bypass heavy localization lookup overhead in dynamic clocks and countdowns.

## 🔗 Shared Code Reuse (PolyUtils)

- **Avoid Utility Duplication**:
  - Do not write local HTML-escaping functions (`esc` or custom `escapeHtml`) in individual files. Always delegate to the global helper `window.PolyUtils.escapeHtml(value)` to ensure security and maintainability.
  - Leverage `window.PolyUtils` for Supabase browser-client initialization (`createSupabaseBrowserClient`) and standard timezone-aware date conversions (`formatDateKey`).

## ♿ Advanced Accessibility (a11y)

- **Dynamic Search Feedback**:
  - Real-time search query fields must announce match results count to screen readers immediately. Link query inputs with a visually hidden ARIA-live polite status announcer (`#subjectBrowserAnnouncer`, `role="status"`) via `aria-controls` and `aria-describedby`.
- **Non-nested Interactive Elements**:
  - Never nest interactive elements (e.g., placing a secondary button or icon-only delete button with `role="button"` inside a parent `<button>` list item) as it breaks keyboard navigation and WCAG specifications. Wrap them as semantic siblings within a relative container instead.
- **Rapidly Updating Timers**:
  - Do not place `aria-live="polite"` or `role="status"` directly on rapidly-updating strings (such as dynamic countdown timers) to prevent screen reader verbal clutter. Use a separate status region to announce transition changes (e.g. starting, pausing, resetting, and completing).
- **Show/Hide Password Accessibility**:
  - When implementing "Show Password" checkboxes, mask the password visibility back to secret when the user toggles tabs, switches forms, or closes the view to protect sensitive user credentials.

## 🔍 Crawlability & SEO

- **Prevent Incorrect Indexation**:
  - Service worker fallback pages (`offline.html`) must load `<meta name="robots" content="noindex, follow">`.
  - Sensitive form-utility pages (like `reset-password.html`) must load `<meta name="robots" content="noindex, nofollow">` to prevent search engine crawler indexation.

## 🧠 Backend & Mathematical Processing (Workers)

- **Input Sanitization without Variable Loss**:
  - Worker mathematical pre-processors (such as `equationParts` in Ask Poly AI) must clean math input by removing stop words using word boundaries (`\b`), but must never include variable names like `x` or `y` in the stop word list to prevent stripping essential variables and causing parser crashes.

## 🛠 Developer Toolchain & Testing

- **PDF Generation Local Prerequisite**:
  - Local PDF generation scripts (e.g., `tools/build_missing_lesson_pdfs.py`) require capturing the fully rendered HTML. You must start a local Python HTTP server on port 8000 (`python3 -m http.server 8000`) before running the builders.
- **Wrangler Configuration Integrity**:
  - Cloudflare Wrangler prioritizes `wrangler.jsonc` over `wrangler.toml` when checking parent directories. Never leave an incomplete or broken `wrangler.jsonc` file in the repository root as it will fail production deployments.
- **Dynamic Document Writing Overwrites**:
  - When overwriting document markup dynamically (e.g., using `document.write()`), ensure that critical classes (`poly-lesson-page`, `lesson-all-content`, and `revision-2026-lesson`) are re-appended to `document.documentElement` and `document.body` to avoid headless verification and layout test failures.

---

# Project Goal

POLY PMNA should feel like a professional educational platform.

Every improvement should make the website:

Cleaner

Faster

More responsive

More maintainable

More accessible

Without changing its identity.
