# JavaScript Assets

This directory contains all client-side JavaScript files for the POLY PMNA portal. Scripts are organized into several categories:

## Global Initializers

| File | Purpose |
|------|---------|
| `main.js` | Global site initializer loaded on every portal page. Orchestrates loading of site-shell, visitor-popup, and maintenance-controller scripts. |
| `site-shell.js` | Renders the site-wide header (brand, navigation) and footer on every non-lesson page. Handles mobile hamburger menu. |
| `site-assistant.js` | In-page AI help panel that indexes lesson content and provides query-matching assistance. |
| `site-assistant-loader.js` | Lazy-loads `site-assistant.js` when the user interacts with the assistant button. |
| `site-hardening.js` | Normalizes active links, ensures maintenance-controller injection, and handles print-mode adjustments. |
| `site-consistency-fix.js` | Fixes CSS class inconsistencies and normalizes element visibility across pages. |
| `visitor-popup.js` | Rotating promotional popup system showing announcements once per day. |
| `maintenance-controller.js` | Client-side maintenance window checker that redirects to `/maintenance/` during scheduled windows. |

## Lesson Page Runtime

| File | Purpose |
|------|---------|
| `lesson-navigation-fix.js` | Universal lesson page runtime. Normalizes layout, hides header, reveals all content, creates end-of-lesson actions. |
| `lesson-2021-core.js` | Revision 2021 lesson content renderer. |
| `lesson-content-loader.js` | Loads lesson content assets on demand. |

## Revision 2026

| File | Purpose |
|------|---------|
| `revision-2026-browser.js` | Powers the Revision 2026 department listing and individual department pages. |
| `revision-2026-data.js` | Utility functions for working with Revision 2026 data files. |
| `revision-2026-lessons.js` | Loads and renders Revision 2026 lesson pages. |
| `revision-2026-notes.js` | Handles Revision 2026 downloadable notes. |
| `revision-2026-syllabus.js` | Handles Revision 2026 syllabus links and rendering. |

## Ask POLY AI

| File | Purpose |
|------|---------|
| `ask-poly-v2.js` | Full chat interface for Ask POLY AI v2. Handles IndexedDB storage, message rendering, and AI endpoint calls. |
| `ask-poly-utils.js` | Shared utility functions for Ask POLY AI. |
| `ask-poly-knowledge.js` | Loads and manages the site knowledge base for AI responses. |

## Quiz / Mock Exams

| File | Purpose |
|------|---------|
| `quiz-core.js` | Shared namespace bootstrap for the daily quiz portal. Handles auth, view switching, and guest mode. |
| `quiz-engine.js` | Core quiz logic: question shuffling, scoring, timer management. |
| `quiz-play.js` | Play mode UI for the daily quiz. |
| `quiz-results.js` | Results display and analytics after quiz completion. |
| `quiz-portal.js` | Quiz portal page rendering. |
| `quiz-dashboard.js` | User dashboard for tracking quiz history and performance. |
| `quiz-auth.js` | Authentication and session management for quiz users. |
| `quiz-bank-*.js` | Subject-specific question bank files (one per subject). |
| `daily-quiz-register.js` | User registration flow for the daily quiz. |
| `daily-quiz-session.js` | Session management for quiz play-throughs. |
| `daily-quiz-ui.js` | UI rendering for the daily quiz interface. |
| `daily-quiz-utils.js` | Utility functions shared across daily quiz scripts. |
| `daily-quiz.js` | Placeholder for backwards compatibility. |
| `mock-exam-1004.js` | Exam data for Engineering Mechanics (Course 1004). |
| `mock-exam-ui.js` | Full mock exam interface rendering (question selection, answers, validation). |
| `mock-exam-loader.js` | Controls the loading sequence of mock exam scripts. |
| `mock-exam-ai-evaluator.js` | AI-powered answer evaluation and scoring. |
| `mock-exam-service.js` | Backend evaluation service interface. |
| `mock-exam-paper.js` | Paper structure and rendering logic. |
| `mock-exam-papers.js` | Registry of available exam papers. |
| `mock-exam-portal-upgrade.js` | Portal enhancements for the mock exam experience. |

## Lessons Subdirectory

| File | Purpose |
|------|---------|
| `lessons/lesson-2131-enhancements.js` | Course 2131 (Electrical Circuits) specific content enhancements for Revision 2026. |

## Data Files

| File | Purpose |
|------|---------|
| `subjects.js` | Global subject knowledge base (exposed as `window.SUBJECTS`). |
| `asset-manifest.js` | Asset index for the site assistant's content discovery. |
| `poly-constants.js` | Shared constants and configuration values. |
| `poly-utils.js` | Shared utility functions (exposed as `window.PolyUtils`). |
| `poly-config.js` | Site-wide configuration (API endpoints, feature flags). |

## Loading Order

The scripts are loaded in this general order on portal pages:

1. `main.js` — orchestrates everything
2. `site-shell.js` — renders header/footer
3. `visitor-popup.js` — shows promotional popup
4. `maintenance-controller.js` — checks maintenance windows
5. `site-assistant-loader.js` — lazy-loads assistant on interaction

Lesson pages load only `lesson-navigation-fix.js` (and optionally course-specific enhancement scripts).
