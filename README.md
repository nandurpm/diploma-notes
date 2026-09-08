# POLY PMNA

<p align="center">
  <img src="docs/images/logo.png" width="360" alt="POLY PMNA Logo">
</p>

<h1 align="center">POLY PMNA</h1>

<p align="center">
<b>Kerala Polytechnic Digital Learning Platform</b>
</p>

<p align="center">
Revision 2026 &middot; Revision 2021 &middot; Revision 2015 &middot; Ask Poly AI &middot; Daily Quiz &middot; Engineering Tools
</p>

---

## Official Website

**Website:** [https://polypmna.dpdns.org/](https://polypmna.dpdns.org/)

**Documentation:** [https://github.com/nandurpm/diploma-notes/wiki](https://github.com/nandurpm/diploma-notes/wiki)

---

## Find your way

- [Features](#key-features)
- [Repository structure](#repository-structure)
- [Getting started](#getting-started)
- [Documentation](#documentation)
- [PDF archive](#canonical-pdf-archive-integration)

## About POLY PMNA

POLY PMNA is a comprehensive digital learning platform developed to support **Kerala Polytechnic students** throughout their academic journey. The platform provides syllabus-based study materials, structured lesson notes, AI-powered learning assistance, daily quizzes, engineering tools, model question papers, and other educational resources through a modern, responsive web application.

Its primary objective is to make quality learning resources accessible from a single platform while continuously improving the learning experience with new technologies and digital tools.

---

## Key Features

### Academic Resources

| Feature | Description |
|---------|-------------|
| Revision 2026 Portal | Full syllabus coverage with lesson pages, notes, and department browsers |
| Revision 2021 Portal | Legacy syllabus with lesson pages and downloadable notes |
| Revision 2015 Archive | Historical materials from the 2015 syllabus |
| Lesson Notes | Detailed HTML lesson pages with continuous reading mode |
| Formula Banks | Quick-reference formula collections per subject |
| Model Question Papers | SITTTR Kerala official model papers (linked externally) |
| Subject-wise Materials | Organised by department, semester, and course code |

### Smart Learning

| Feature | Description |
|---------|-------------|
| Ask Poly AI | AI-powered chat assistant for syllabus queries and study help |
| Smart Content Search | Context-aware search across lesson content and subject databases |
| Offline Knowledge | Local knowledge base for assistant responses |

### Student Practice

| Feature | Description |
|---------|-------------|
| Daily Quiz | Subject-based daily quizzes with authentication and leaderboards |
| Mock Examinations | Full exam simulation (currently Course 1004: Engineering Mechanics) |
| Score Analysis | Instant scoring with rubric-based and AI-assisted evaluation |

### Engineering Utilities

| Feature | Description |
|---------|-------------|
| Engineering Calculators | Course-specific calculation tools |
| Unit Converters | Engineering unit conversion utilities |
| Reference Tables | Formulas, constants, and conversion factors |

### Platform

| Feature | Description |
|---------|-------------|
| Responsive Design | Works on desktop, tablet, and mobile |
| Progressive Web App | Installable on mobile devices |
| Cloud Hosting | Cloudflare Pages with Workers for server-side logic |
| Android App | Native Android wrapper available in `android-app/` |

---

## Repository Structure

Start with the **[repository map](docs/REPOSITORY-MAP.md)** for a grouped guide to every top-level folder and the files that must stay in place.

| Area | Where to look |
|------|---------------|
| Website entry pages | Root HTML files, including `index.html`, `revision-2026.html`, `ask-poly.html`, and `daily-quiz.html` |
| Academic content | [2021 departments](revision-2021/), [2021 lessons](lessons/), [2026 departments](revision-2026/), [2026 content](revision-2026-content/) |
| Shared appearance and behaviour | [assets](assets/) — CSS, JavaScript, data, and media |
| Backend and mobile | [functions](functions/), [workers](workers/), [database migrations](supabase/migrations/), [Android app](android-app/) |
| Maintenance and checks | [tools](tools/), [scripts](scripts/), [tests](tests/), [workflows](.github/workflows/) |
| Documentation and evidence | [docs](docs/), [Ask POLY investigations](docs/diagnostics/), [reports](reports/), [previews](previews/) |

The root HTML files are public URLs. Keep their names and locations stable so bookmarks, search results, app navigation, and offline caching continue to work.


---

## Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | HTML5, CSS3, JavaScript (ES6+) |
| Hosting | GitHub Pages + Cloudflare Pages |
| Server-side | Cloudflare Workers, Cloudflare Pages Functions |
| Backend | Supabase (PostgreSQL, Auth, Edge Functions) |
| CI/CD | GitHub Actions |
| AI | OpenAI API (via Cloudflare Worker) |
| Mobile | Native Android / Gradle |

---

## Getting Started

### For Students

Visit [https://polypmna.dpdns.org/](https://polypmna.dpdns.org/) and navigate using the top menu. Select your revision year, choose your department, and access lessons, notes, tools, or AI assistance.

### For Contributors

1. Fork this repository
2. Read the documentation in `docs/` for architecture details
3. Use the [repository map](docs/REPOSITORY-MAP.md) to find the correct folder
4. Test changes locally before submitting a pull request

### Adding a New Lesson (Revision 2026)

1. Create a new HTML file in `revision-2026-content/lessons/` named `lessons-[COURSE_CODE].html`
2. The GitHub Actions workflow will detect the new file and activate the "View Lessons" button on the matching subject card
3. Follow [lesson PDF automation](docs/lesson-pdf-automation.md) for published PDFs. The canonical archive stores PDF binaries; do not add duplicate binaries here. Students can also save the lesson using its print mode.

See `revision-2026-content/README.md` for full instructions.

---

## Documentation

Use the [documentation index](docs/README.md) and [repository map](docs/REPOSITORY-MAP.md) to navigate the project:

| Directory | Documentation |
|-----------|--------------|
| `assets/js/` | JavaScript module index and loading order |
| `assets/css/` | Stylesheet organisation and scope |
| `assets/data/` | JSON data file descriptions |
| `assets/media/` | Media asset organisation |
| `supabase/` | Database schema and edge functions |
| `functions/` | Cloudflare Pages middleware |
| `workers/` | Cloudflare Worker deployment |
| `tools/` | Developer automation, site validation, and maintenance scripts (`README-maintenance.md`) |
| `docs/` | Internal architecture documentation |

---

## Project Roadmap

Future development includes:

- Android Application Enhancements
- AI Knowledge Base Expansion
- Student Dashboard and Progress Tracking
- Leaderboards and Performance Analytics
- Offline Learning Support
- Voice-Based Learning
- Additional Mock Exam Courses
- Expanded Engineering Tools

---

## Contributing

Suggestions and bug reports are always welcome. If you discover an issue or have an idea for improvement, please create a [GitHub Issue](https://github.com/nandurpm/diploma-notes/issues).

Please read the project documentation before submitting pull requests or feature requests.

---

## Security

If you discover a security vulnerability, please read **SECURITY.md** before reporting it. Please avoid disclosing security issues publicly until they have been reviewed.

---

## License and Copyright

This project is protected under a **Custom Copyright Notice &mdash; All Rights Reserved**.

Unless explicit written permission is granted by the copyright holder, you may **not** copy, reproduce, redistribute, host, or publish this project or any substantially similar version.

Please refer to the **LICENSE** file for complete terms and conditions.

---

## Developer

**Nandakumar M**

Electrical & Electronics Design Engineer

Johnson Lifts & Escalators

Kerala, India

---

## Content Availability Policy (Audit 2026-08)

The subject catalogues reference lesson pages and notes PDFs that have not been
built yet. The site does **not** link students to 404 pages: the subject-card
rendering pipeline already shows **"Lessons unavailable" / "Notes unavailable"**
labels in place of those links (see `assets/js/subject-browser.js`, the
`subject-browser-*.js` variants, `lesson-availability-hotfix.js`, and
`hide-unavailable-actions.js`). Static department pages ship the same
unavailable markup server-side, so the fallback works without JavaScript.
Only codes with an existing `lessons-*.html` page or `downloadable-notes-*.pdf`
get clickable action links, and the workflow in *Adding a New Lesson*
automatically activates the buttons when the matching file appears.

The build-info writer (`tools/write_build_info.py`) was also hardened: it
now validates the JSON payload and writes atomically (temp file + replace),
so a future pipeline glitch cannot concatenate or corrupt `build-info.json`
again.

---

## Official Links

| Resource | URL |
|----------|-----|
| Website | [https://polypmna.dpdns.org/](https://polypmna.dpdns.org/) |
| GitHub | [https://github.com/nandurpm/diploma-notes](https://github.com/nandurpm/diploma-notes) |
| Documentation | [https://github.com/nandurpm/diploma-notes/wiki](https://github.com/nandurpm/diploma-notes/wiki) |

---

<p align="center">
Made with care for Kerala Polytechnic Students
</p>


## Canonical PDF archive integration

The published lesson PDFs and their manifests live in [`nandurpm/poly-pmna-pdf-files`](https://github.com/nandurpm/poly-pmna-pdf-files), which is the single source of truth for downloadable PDF files. This repository generates lesson PDFs and publishes them there; it does not maintain a second binary copy.

The `sync-pdf-archive-reference.yml` workflow listens for the `pdf-archive-updated` event and refreshes [`docs/pdf-archive-sync.json`](docs/pdf-archive-sync.json). The public site continues to use the canonical raw archive URLs, so changes to a published manifest or PDF are reflected without manual copying. Run the workflow manually when checking the integration or recovering a missed dispatch.
