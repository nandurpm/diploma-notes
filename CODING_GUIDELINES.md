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

# 🏗 Advanced Portal & Tooling Standards

This section outlines advanced engineering, performance caching, accessibility, SEO, and tooling constraints enforced across the POLY PMNA codebase. Developers must strictly adhere to these patterns when adding features or refactoring codebase subsystems.

## ⚡ Client-Side Performance Caching
To maintain a high-frequency, responsive interface across all devices and low-end mobile hardware, follow these mandatory performance caching practices:

1. **Search Index Optimization:**
   - Always cache lowercase representations of search parameters (e.g. `_searchText`) to bypass redundant runtime string manipulation in search loops.
   - Pre-compute and cache normalized subject fields (`_normCode`, `_normName`, and `_normDept`) inside initialization functions (e.g., `buildSubjectRecords()`) rather than invoking Regex-heavy, Unicode-normalizing `normalize()` functions inside active keypress loops.
2. **Localization & Date Formatters:**
   - Costly repeated instantiations of `Intl.DateTimeFormat` (such as `formatDateKey` or `indiaDateKey`) must be avoided.
   - Cache precompiled `Intl.DateTimeFormat` objects in module/file scope to bypass localization lookup and heap allocation overhead in high-frequency rendering and layout generation loops.

## ♿ Advanced Accessibility & ARIA Rules
Accessibility is a core tier-1 priority for the POLY PMNA platform. All interactive elements must strictly comply with these standards:

1. **Live Filter Announcers:**
   - Real-time search and filter inputs must announce matched result counts immediately to screen readers.
   - Link search inputs to results lists via `aria-controls` and `aria-describedby`, directing to a visually-hidden, ARIA-live polite status announcer region (e.g., `#subjectBrowserAnnouncer`, `role="status"`, `aria-live="polite"`).
2. **Interactive Elements:**
   - **Never nest interactive elements.** Placing buttons inside other buttons, or anchor links inside button tags, is strictly prohibited as it violates the HTML specification and breaks keyboard/screen-reader focus trees.
3. **Quiet vs. Polite Live Regions:**
   - Rapidly-updating widgets (such as second-by-second holiday countdowns or clock ticks in countdown banners) must **not** use `aria-live="polite"` tags. Keep these regions quiet to prevent screen-readers from being constantly overloaded with audio announcements.
4. **Accessible Password Toggles:**
   - Password inputs on authentication forms must provide a native, semantic "Show Password" checkbox.
   - **Context safety:** When the user toggles tabs (e.g., switching between Login and Registration) or switches context, password visibility must automatically be reset back to masked to prevent sensitive user data from remaining visible.
5. **Form Character Counters:**
   - Forms containing strict input constraints (e.g., the 1500-character contact form or dynamic replies) must include a real-time character counter with `aria-live="polite"`. This provides immediate, non-intrusive feedback to screen-reader and visual users alike.

## 🌐 SEO, Indexing & Crawlability
To optimize search engine crawlability, prevent duplicate indexing, and satisfy search engine quality policies:

1. **Robots Meta Directives:**
   - Specialized account, offline, and utility tools must use strict indexing meta headers:
     - Account/utility forms (e.g. `reset-password.html`) must use `<meta name="robots" content="noindex, nofollow">` to prevent credentials-adjacent paths from being indexed.
     - Offline service worker files (e.g. `offline.html`) must use `<meta name="robots" content="noindex, follow">` to preserve crawl links without cluttering index records.
2. **Static-Hosted Redirect Fallbacks:**
   - Any static redirect fallback page (e.g., `departments.html`) must utilize `<meta http-equiv="refresh" content="0; url=...">`, standard brand assets, a clean user fallback card, a canonical link pointing to the destination URL, and a `<meta name="robots" content="noindex, nofollow">` tag.
   - All redirect fallback files must be explicitly added to the `EXCLUDED_FILES` set in `tools/generate_sitemap.py` to prevent duplicate indexing and canonical conflicts.

## ☁️ Serverless & Cloudflare Worker Constraints
When developing or modifying Cloudflare Workers and Pages Functions (e.g. `ask-poly-ai` or middleware):

1. **Input Sanitization:**
   - Implement robust sanitization on input parameters, particularly around mathematics/processing commands, to prevent script injection and serverless compute exploitation.
2. **Error Handling & Response Types:**
   - Always wrap database queries and external AI requests in defensive try-catch blocks and return standardized JSON error schemas rather than allowing raw environment traces to escape to client browsers.

## 🛠 Developer Tooling & Site Quality Gates
Automation and validation scripts under the `tools/` folder enforce the platform's stability. Be aware of these rules:

1. **Git-Ignored PDF Notes Bypasses:**
   - Revision 2026 downloadable PDF notes are hosted on GitHub Releases and are ignored in Git.
   - To prevent local developer CI check failures on clean checkouts, `tools/site_quality_gate.py` bypasses local file existence audits and broken reference checks for paths starting with `revision-2026-content/notes/`.
   - Likewise, `tools/generate_sitemap.py` dynamically preserves sitemap entries for these PDFs if they are missing on disk.
2. **Structural Inventory Baselines:**
   - `tools/validate_site_structure.py` enforces exact minimum baselines (e.g., 91 Revision 2021 and 35 Revision 2026 files, totaling 126 lessons) and verifies that every lesson file successfully loads the shared navigation script (`lesson-navigation-fix.js`) and features a correct HTML5 layout.

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
