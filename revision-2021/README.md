# Quick Overview — English

- Purpose: Static department pages for Revision 2021 listing subjects, lessons, and notes.
- To add or fix content: update the corresponding HTML file in this folder and open a PR.

## ലഘു ഗൈഡ് — മലയാളം

- ഉദ്ദേശ്യം: Revision 2021-ന്റെ ഡിപ്പാർട്‌മെന്റ് പേജുകൾ ഇവിടെ വാലിഡേറ്റ് ചെയ്യുക. HTML ഫയലുകൾ അപ്ഡേറ്റ് ചെയ്ത് PR അയയ്ക്കുക.

# Revision 2021 Department Pages

Department landing pages for the KSBTE Revision 2021 diploma programmes.

## Structure

Each file is an HTML page for a specific department (e.g., `civil-engineering.html`). Pages list all subjects in that department with links to lessons, notes, and external syllabus references.

## How Pages Are Rendered

Department pages are static HTML files that link to:

- `/lessons/lessons-[CODE].html` — Lesson pages
- `/notes/notes-[CODE].pdf` — Downloadable notes
- External SITTTR Kerala website — Official syllabus and model question papers

## Relationship to Revision 2026

Revision 2021 and Revision 2026 are two separate syllabus versions. Both are supported by the site simultaneously:

| Feature | Revision 2021 | Revision 2026 |
|---------|---------------|---------------|
| Department pages | Static HTML in this directory | Dynamic rendering via `revision-2026-browser.js` |
| Lessons | `/lessons/` directory | `/revision-2026-content/lessons/` |
| Notes | `/notes/` directory | `/revision-2026-content/notes/` |
| Navigation | "Revision 2021" nav item | "Revision 2026" nav item |
