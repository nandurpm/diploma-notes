# POLY PMNA Repository Audit Findings

## Repository Overview
- **Total files**: 1,518
- **Repository**: nandurpm/diploma-notes
- **Live URL**: polypmna.dpdns.org
- **Scaffold**: Static HTML/CSS/JS (no framework)
- **Hosting**: Cloudflare Pages (with Workers for maintenance/themes) + Firebase (quiz DB) + Cloudflare Workers (Ask POLY AI)

## Top-Level Folders and Files

| Path | Type | Purpose |
|------|------|---------|
| Root HTML files (30+) | Entry pages | index.html, about.html, departments.html, revision-2021.html, revision-2026.html, study-materials.html, daily-quiz.html, mock-exam.html, mock-exam-1004.html, tools.html, tools-v2.html, tools-catalog.html, ask-poly.html, ask-poly-v2.html, materials-2015.html, first-year-materials.html, previous-question-papers.html, model-question-papers.html, syllabus.html, lessons.html, contact.html, privacy.html, terms.html, disclaimer.html, reset-password.html, new-year-theme-preview.html |
| assets/ | Shared resources | CSS, JS, data, media, vendor |
| lessons/ | Rev 2021 lesson pages | 91 HTML lesson files |
| revision-2021/ | Rev 2021 department pages | Department selector HTML pages |
| revision-2026/ | Rev 2026 department pages | Department selector HTML pages |
| revision-2026-content/ | Rev 2026 lesson/notes content | Separate content for Rev 2026 |
| notes/ | Rev 2021 downloadable PDFs | 91+ PDF files |
| data/ | Knowledge base | knowledge-base.json (47K lines) |
| tools/ | Python/JS maintenance scripts | 50+ scripts |
| workers/ | Cloudflare Worker (Ask POLY AI) | Full worker project |
| supabase/ | Supabase schema/migrations | SQL files + functions |
| android-app/ | Android WebView app | Gradle project |
| functions/ | Firebase functions | _middleware.js |
| maintenance/ | Maintenance page | HTML + runtime guard |
| downloads/ | APK releases | APK files + metadata |
| docs/ | Developer documentation | Standards, prompts, notes |
| .github/ | CI/CD workflows | 30+ GitHub Actions |
| .jules/ | Jules AI learning notes | Performance/security logs |
| images/guide/ | Homepage guide images | 6 step images |
| automation/ | Automation triggers | Text files for workflow triggers |
| tmp/ | Temporary test files | Test files |
| .well-known/ | Android asset links | assetlinks.json |

## Shared Infrastructure

### JavaScript Architecture
- **main.js** — Global initializer: loads site-shell, visitor popup, maintenance controller, Rev 2026 card link normalizer, year updater
- **site-shell.js** — Renders global header, navigation, footer, mobile menu
- **site-hardening.js** — Security hardening
- **fixed-site-header.js** — Fixed/sticky header behavior
- **site-assistant-loader.js** — Lazy loads site assistant
- **site-assistant.js** — Ask POLY lesson assistant (in-page)
- **lesson-navigation-fix.js** — Lesson page navigation fixer
- **maintenance-controller.js** — Maintenance mode controller

### CSS Architecture
- **style.css** — Base styles (727 lines)
- **animations.css** — Animation definitions
- **responsive.css** — Mobile responsive styles
- **hardening.css** — Security/UX hardening styles
- **site-navigation-a11y.css** — Navigation accessibility
- **site-brand.css** — Brand colors and typography
- **portal-layout.css** — Portal page grid layout
- **fixed-site-header.css** — Fixed header styles
- **quiz.css** — Quiz page styles
- **quiz-portal.css** — Quiz portal styles
- **mock-exam.css** — Mock exam styles
- **tools-page.css** — Engineering tools page
- **lesson-page-fix.css** — Lesson page layout fix
- **ask-poly-*.css** — Ask POLY AI page styles
- **revision-2026-*.css** — Rev 2026 specific styles

### Data Architecture
- **assets/data/revision-2026-subjects.json** — Rev 2026 subject database (37K lines)
- **assets/data/revision-2026-programmes.json** — Rev 2026 programme catalog
- **assets/data/revision-2015-subjects.json** — Legacy 2015 subjects
- **assets/data/important-days-wishes.json** — Important days data
- **assets/data/ask-poly-knowledge.json** — Ask POLY knowledge base
- **data/knowledge-base.json** — Global site knowledge (47K lines)

## Cross-File Dependencies

### Entry Pages → Shared CSS
All portal pages load: style.css, animations.css, responsive.css, hardening.css, site-navigation-a11y.css, site-brand.css, portal-layout.css, fixed-site-header.css

### Entry Pages → Shared JS
All portal pages load: main.js, site-hardening.js, site-assistant-loader.js (sometimes), fixed-site-header.js

### Lesson Pages → Shared JS
All lesson pages load: lesson-navigation-fix.js, site-assistant.js, site-hardening.js

### Lesson Pages → Shared CSS
All lesson pages load: lesson-page-fix.css (via JS injection)

### JS → Data Dependencies
- subjects.js → revision-2015-subjects.json
- revision-2026-browser.js → revision-2026-subjects.json, revision-2026-programmes.json
- ask-poly-knowledge-loader.js → ask-poly-knowledge.json
- daily-quiz.js → Supabase (quiz data)
- quiz-core.js → quiz-bank-*.js (question banks)
- department-card-art.js → assets/media/departments/

### Cloudflare Worker → Website
- functions/_middleware.js → Applies maintenance mode and New Year theme to all HTML pages
- workers/ask-poly-ai/ → Handles Ask POLY AI requests and mock exam evaluation

### Android App → Website
- android-app/ → WebView wrapper that loads the website
- .well-known/assetlinks.json → Android app verification

### GitHub Actions → Repository
- 30+ workflows automate: deployment, lesson availability, sitemap generation, site quality checks, PDF generation, Rev 2026 sync, Ask POLY knowledge building, Android app builds, and more

## Revision System Architecture

### Revision 2021
- Department pages: revision-2021/[department].html
- Lesson pages: lessons/lessons-[CODE].html
- Notes: notes/downloadable-notes-[CODE].pdf
- Browser JS: sitttr-rev2021-browser.js
- Art: assets/media/departments/rev2021/

### Revision 2026
- Department pages: revision-2026/[department].html
- Lesson pages: revision-2026-content/lessons/lessons-[CODE].html
- Notes: revision-2026-content/notes/downloadable-notes-[CODE].pdf
- Browser JS: revision-2026-browser.js
- Data: assets/data/revision-2026-subjects.json
- Art: assets/media/departments/rev2026/
- Styles: assets/css/revision-2026-*.css

## Key Observations
1. Most code already has descriptive comments (added for clarity)
2. revision-2026-content/ already has good README.md documentation
3. tools/README-maintenance.md is minimal
4. assets/popup/README.md and assets/audio/README.md are well documented
5. No README exists for: assets/css/, assets/js/, assets/data/, assets/media/, assets/lesson-content/, assets/vendor/, assets/icons/, data/, lessons/, revision-2021/, revision-2026/, revision-2026-content/notes/, notes/, downloads/, functions/, supabase/, tools/, android-app/src/, docs/, images/, automation/, maintenance/, workers/
6. Root README.md exists but needs updating with full architecture documentation
