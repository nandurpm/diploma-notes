# Quick Overview — English

- Purpose: This folder contains Revision 2021 lesson HTML pages used by the site.
- Preview: run a local static server and open `lessons/lessons-[CODE].html` to view.
- PDF notes: downloadable PDFs live in `notes/` and are linked from lesson cards.

```bash
python -m http.server 8000
```

## ലഘു ഗൈഡ് — മലയാളം

- ഉദ്ദേശ്യം: Revision 2021-ലെ lesson HTML ഫയലുകൾ ഇവിടെ സൂക്ഷിക്കുന്നു. ഫയലിന്റെ പേര് `lessons-[COURSE_CODE].html` ആണെന്ന് ഉറപ്പാക്കി ചേർക്കുക.
- ലോക്കൽ പ്രിവ്യൂ: മുകളിൽ കാണുന്ന കോമാൻഡ് ഉപയോഗിക്കുക.

# Lessons (Revision 2021)

Lesson pages for the KSBTE Revision 2021 diploma syllabus.

## Structure

Each lesson page is an HTML file named `lessons-[COURSE_CODE].html` where the course code is a 4-digit number (e.g., `lessons-1001.html` for Applied Mathematics 1).

## Features

- Full-width lesson layout (header and navigation are hidden)
- All content sections are automatically revealed for continuous reading
- **Automatic Watermark**: All lesson pages automatically receive a "POLY PMNA" watermark overlay for brand protection.
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

3. **Injects the watermark CSS and DOM overlay automatically** for brand protection.

## How to Add a New Lesson

To add a new lesson file, you only need to create the HTML file with the correct naming convention and ensure it includes the shared runtime script. 

1. Create the HTML file in this directory with the format: `lessons-XXXX.html`
2. Ensure the file contains the shared lesson runtime script before the closing `</body>` tag:
   ```html
   <!-- Shared full-screen lesson standard -->
   <script src="/assets/js/lesson-navigation-fix.js?v=20260725-watermark1" defer></script>
   ```
3. The `lesson-navigation-fix.js` script will automatically detect the page as a lesson and inject the watermark styles and overlay. No manual watermark code is required in your HTML file.

## Related

- `/revision-2026-content/lessons/` — Revision 2026 lesson pages (separate directory)
- `assets/js/lesson-navigation-fix.js` — Universal lesson page runtime
- `assets/css/lesson-page-fix.css` — Lesson layout fixes
- `assets/css/lesson-watermark.css` — Watermark overlay styles
- `tools/validate_watermark.py` — CI tool to enforce watermark inclusion
