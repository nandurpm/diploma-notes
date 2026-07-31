# POLY PMNA Annual New Year Theme

## Theme

**Midnight Circuit New Year** is the global seasonal theme for POLY PMNA.

The visual system combines:

- midnight navy backgrounds;
- electric cyan circuit accents;
- warm gold New Year highlights;
- restrained circuit-firework effects;
- a global seasonal banner;
- an IST-based New Year countdown;
- a short, one-time New Year confetti celebration.

## Automatic annual schedule

The theme activates automatically every year using **Asia/Kolkata (IST)** time:

- starts: **28 December at 12:00 AM IST**;
- countdown mode: **31 December**;
- celebration mode: **1 January**;
- welcome mode: **2–3 January**;
- ends: **4 January at 12:00 AM IST**.

The displayed year is calculated at runtime. In December, the theme shows the incoming year; in January, it shows the current year. No yearly code update is required.

## Global coverage

Cloudflare Pages middleware injects the New Year stylesheet and controller into every HTML response during the active period. This includes:

- the homepage;
- Revision 2026 and Revision 2021 pages;
- department and subject pages;
- lesson HTML files;
- mock-exam and quiz pages;
- tools and Ask POLY AI pages;
- maintenance pages;
- legal, about and contact pages;
- any future static HTML page served through the same Pages project.

Theme assets are served from:

- `assets/css/new-year-theme.css`
- `assets/js/new-year-theme.js`

The global injector is implemented in:

- `functions/_middleware.js`

## Usability and accessibility

- Existing navigation and page structure are preserved.
- Lesson print and Save-to-PDF output remains white and removes all seasonal decoration.
- Visual effects never block clicks or scrolling.
- A Pause Effects control is available.
- `prefers-reduced-motion` disables animation.
- Effects pause while the browser tab is hidden.
- Confetti is played once per browser session instead of on every page navigation.
- No audio is played.
- Mobile devices use fewer animated particles.

## Relationship to the 2026 maintenance schedule

The permanent middleware also contains the fixed 2026 maintenance windows. Those windows become inactive after 31 December 2026, but the middleware remains because the New Year theme is annual. The previous workflow that would have deleted the middleware after the final maintenance window was removed.

## Validation

`.github/workflows/validate-maintenance-schedule.yml` checks:

- JavaScript syntax;
- maintenance start and end boundaries;
- 28 December theme activation;
- 31 December countdown phase;
- midnight year rollover;
- 1 January celebration phase;
- 4 January deactivation;
- automatic transition from 2027 to 2028;
- global injection into lesson pages;
- print-style availability and activity-rotation limits.
