# Lessons (Revision 2021)

Lesson pages for the KSBTE Revision 2021 diploma syllabus.

## Structure

Each lesson page is an HTML file named `lessons-[COURSE_CODE].html` where the course code is a 4-digit number (e.g., `lessons-1001.html` for Applied Mathematics 1).

## Features

- Full-width lesson layout (header and navigation are hidden)
- All content sections are automatically revealed for continuous reading
- Watermark branding on all lesson pages
- End-of-lesson navigation (back button, PDF download, print)
- Dynamic module view expansion for tabbed lessons
- Scroll progress indicator
- Auto-print mode via URL parameters (`?autoPrintNotes` or `?downloadNotes`)

## How Lessons Work

1. The page loads `lesson-navigation-fix.js` which:
   - Marks the page as a lesson page (CSS classes)
   - Removes the global site header
   - Reveals all hidden content sections
   - Expands dynamic tabbed views into a continuous document
   - Adds end-of-lesson navigation actions

2. The `site-assistant.js` indexes the lesson content for AI-powered queries

3. Watermark CSS is injected for brand protection

## Related

- `/revision-2026-content/lessons/` — Revision 2026 lesson pages (separate directory)
- `assets/js/lesson-navigation-fix.js` — Universal lesson page runtime
- `assets/css/lesson-page-fix.css` — Lesson layout fixes
- `assets/css/lesson-watermark.css` — Watermark overlay styles
