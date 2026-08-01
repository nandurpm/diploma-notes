# POLY PMNA Lesson Page Standard

This is the mandatory presentation standard for every lesson file in:

- `lessons/lessons-[COURSE_CODE].html` — Revision 2021
- `revision-2026-content/lessons/lessons-[COURSE_CODE].html` — Revision 2026

## Required behaviour

1. Lesson pages do not display the public website header, website menu, lesson topbar, duplicate app bar, fixed back button or chapter sidebar.
2. The academic document starts at the top of the viewport and uses the full available width.
3. All overview, module, formula, question, revision and answer sections must be available in one continuous document. A lesson must not require the student to use hidden tabs to reveal essential content.
4. Desktop, mobile browser and Android APK use the same content order.
5. Mobile pages collapse multi-column academic grids into one readable column and respect display safe areas.
6. The APK owns its native app bar and drawer. Lesson HTML must not add a second header.
7. Print / Save PDF exposes the complete lesson and removes navigation or interactive chrome.
8. Revision 2021 and Revision 2026 content must never be mixed.
9. Course-code suffixes such as `A`, `B`, `C` and `D` are part of the course code and must be preserved.
10. General portal pages continue to use the shared website header/menu. This exception applies only to lesson URLs.

## Shared implementation

Every lesson page loads:

```html
<script src="/assets/js/lesson-navigation-fix.js" defer></script>
```

The runtime applies:

- `assets/js/lesson-navigation-fix.js`
- `assets/css/lesson-page-fix.css`

Do not add a separate lesson-wide header system. Improve the shared runtime instead of creating subject-specific layout hotfixes.

## New lesson source requirements

Every new lesson must include:

- HTML5 doctype;
- UTF-8 metadata;
- responsive viewport metadata with `viewport-fit=cover`;
- a descriptive title and description;
- semantic headings and sections;
- responsive tables and media;
- print-safe styles;
- the shared lesson runtime script;
- complete standalone academic content, not an iframe or compressed browser-only wrapper.

## Validation

Run both validators before publishing:

```bash
python tools/validate_site_structure.py
python tools/validate_lesson_fullscreen.py
```

The fullscreen validator checks every lesson file and enforces the current minimum inventory baseline: at least 91 Revision 2021 lessons and at least 27 Revision 2026 lessons. New lesson additions must increase the count without failing the validator.

## Prohibited regressions

- public `site-shell` header inside a lesson;
- sticky lesson selector occupying the top of the screen;
- chapter sidebar reducing lesson width;
- large left/right empty margins;
- hidden syllabus modules that are unavailable in the continuous document;
- direct click interception that breaks subject-specific module rendering;
- duplicate web and native APK headers;
- fixed-width desktop containers that overflow on mobile;
- missing Print / Save PDF support.
