# Quick Overview — English

- Purpose: Department landing pages for the Revision 2026 syllabus. These pages are rendered dynamically from `assets/data/revision-2026-subjects.json`.
- To update data: edit `assets/data/revision-2026-subjects.json` and open a PR.

## ലഘു ഗൈഡ് — മലയാളം

- ഉദ്ദേശ്യം: Revision 2026-ന്‍റെ ഡിപ്പാർട്ട്‌മെന്റ് ലാൻഡിംഗ് പേജുകൾ ഇവിടെ സൂക്ഷിക്കുന്നു. ഡാറ്റ് ഫയലുകൾ `assets/data/`-ൽ അപ്ഡേറ്റ് ചെയ്യുക.

# Revision 2026 Department Pages

Department landing pages for the KSBTE Revision 2026 diploma programmes.

## Structure

Each file is an HTML page for a specific department (e.g., `civil-engineering.html`). These pages are enhanced at runtime by `assets/js/revision-2026-browser.js` which:

- Loads subject data from `assets/data/revision-2026-subjects.json`
- Renders semester-wise subject grids
- Configures Syllabus and Model QP links to the official SITTTR website
- Applies department-specific colour themes

## Data Source

Unlike Revision 2021 (static HTML), Revision 2026 department pages are partially dynamic. The subject list is loaded from JSON data files at runtime, allowing updates without editing HTML files.

## Relationship to Content

| Resource | Location |
|----------|----------|
| Lesson pages | `/revision-2026-content/lessons/` |
| Downloadable notes | `/revision-2026-content/notes/` |
| Subject data | `assets/data/revision-2026-subjects.json` |
| Programme data | `assets/data/revision-2026-programmes.json` |
| Department artwork | `assets/media/departments/rev2026/` |

## Access

The main Revision 2026 index page is at `/revision-2026.html`, which lists all departments with search and filter functionality.
