# POLY PMNA / Diploma Notes — Malayalam Developer Guide

> ഈ guide `diploma-notes` repository-യിലെ actual files inspect ചെയ്ത് തയ്യാറാക്കിയതാണ്. Explanation Malayalam-ലാണ്; പക്ഷേ `HTML`, `CSS`, `JavaScript`, `Android`, `Java`, `Gradle`, `WebView`, `Firebase`, `GitHub Actions`, filenames, commands, class/function names എന്നിവ English-ൽ തന്നെയാണ്.

## Quick Labels

- 🌐 **Website** — root `.html` pages, `assets/`, `lessons/`, `notes/`, `revision-*` folders.
- 📱 **Android** — `android-app/` folder.
- 🔗 **Shared** — website content Android `WebView`-ൽ load ചെയ്യുന്നതുകൊണ്ട് website files Android app-ലും കാണാം.
- ⚙️ **Build/GitHub** — `.github/workflows/`, `tools/`, Gradle, deployment scripts.

---

## 1. Project Overview

ഈ project ഒരു Kerala Polytechnic study hub ആണ്. Website-ൽ syllabus, lessons, notes, model question papers, previous question papers, mock exams, Ask POLY AI, tools, 2015 materials, Revision 2021/2026 directories എന്നിവ ഉണ്ട്. Android app website-നെ native `WebView` shell-ൽ load ചെയ്യുന്നു; അതിനൊപ്പം native drawer menu, refresh button, download handling, Firebase Cloud Messaging notifications, offline fallback എന്നിവ ചേർക്കുന്നു.

### Actual technologies found

| Area | Technology found in repository |
| --- | --- |
| Website UI | Static `HTML`, `CSS`, vanilla `JavaScript` |
| CSS framework | Bootstrap/Tailwind/React/Vue/Angular കണ്ടില്ല. Custom CSS ആണ്. |
| PWA | `site.webmanifest`, `sw.js`, `offline.html` ഉണ്ട്. |
| Android | Native Android project in Java, Gradle, AndroidX, `WebView` |
| Android language | Java (`MainActivity.java`, `NotificationBootstrapActivity.java`, `PolyPmnaMessagingService.java`) |
| Firebase | Android Firebase Messaging dependency + `google-services` plugin conditional; FCM workflows ഉണ്ട്. |
| Backend/API | Cloudflare Worker for Ask POLY AI under `workers/ask-poly-ai/`; Supabase SQL migrations and browser client usage. |
| Build tools | Python scripts in `tools/`, GitHub Actions, Gradle |
| Deployment | Cloudflare Pages workflow, GitHub Pages workflow, Worker deployment workflow |

### Architecture diagram

```text
User
 ├── 🌐 Website on polypmna.dpdns.org
 │    ├── Root HTML pages: index.html, revision-2026.html, ask-poly.html, etc.
 │    ├── assets/css/*.css
 │    ├── assets/js/*.js
 │    ├── assets/data/*.json
 │    ├── lessons/ and revision-2026-content/lessons/
 │    ├── notes/ and revision-2026-content/notes/
 │    ├── sw.js + site.webmanifest for PWA/offline basics
 │    └── workers/ask-poly-ai/ for Ask POLY AI API
 │
 └── 📱 Android App
      ├── android-app/app/src/main/java/.../MainActivity.java
      │    └── WebView loads https://polypmna.dpdns.org/
      ├── activity_main.xml native shell + drawer + WebView
      ├── AndroidManifest.xml permissions, deep links, Firebase service
      ├── PolyPmnaMessagingService.java FCM notifications
      └── Gradle builds debug/release APK
```

### Important mental model

```text
Root HTML page
  ↓ loads
assets/css/style.css + page CSS
  ↓ loads
assets/js/main.js
  ↓ dynamically loads / calls
assets/js/site-shell.js → global header/footer/navigation
assets/js/visitor-popup.js → daily popup
assets/js/maintenance-controller.js → maintenance redirect
  ↓ page-specific JS may load
subject-browser.js / revision-2026-browser.js / ask-poly-v2.js / quiz JS / mock-exam JS
```

```text
Android launch
  ↓
NotificationBootstrapActivity.java
  ↓ creates notification channel + asks POST_NOTIFICATIONS permission + subscribes Firebase topics
  ↓ opens
MainActivity.java
  ↓
activity_main.xml contains DrawerLayout + WebView
  ↓
WebView loads https://polypmna.dpdns.org/ or notification/deep link URL
```

---

## 2. Complete Folder & File Structure

### Root website files

| Path | Contains | Edit when | Do not normally edit |
| --- | --- | --- | --- |
| `index.html` | Homepage | Home content, hero, cards, download button references | Global nav manually in each page unless `site-shell.js` controls it |
| `about.html`, `contact.html`, `privacy.html`, `terms.html`, `disclaimer.html` | Public info/legal pages | Text/content updates | Scripts injected for security/structured data without testing |
| `revision-2026.html`, `revision-2021.html` | Curriculum revision landing pages | Department/subject directory changes | Generated content without running validation |
| `lessons.html`, `syllabus.html`, `study-materials.html` | Study resource index pages | Resource links/cards | Shared subject-browser behavior casually |
| `model-question-papers.html`, `previous-question-papers.html` | Question paper pages | QP links/filter UI | Lesson/notes actions on QP page |
| `daily-quiz.html`, `mock-exam.html`, `mock-exam-1004.html` | Quiz/mock exam UI | Quiz dashboard/exam content | Supabase/auth scripts without checking JS |
| `ask-poly.html` | Ask POLY AI page | Chat UI copy or script includes | Public API secrets — never put secrets here |
| `tools.html`, `tools-catalog.html` | Student tools | Tool cards/calculators | Global CSS affecting unrelated pages |
| `404.html`, `offline.html` | Error/offline pages | Error messaging | PWA paths without testing offline behavior |

### Main folders

#### `assets/css/` 🌐
Custom CSS files. `style.css` is global. `responsive.css`, `portal-layout.css`, `fixed-site-header.css`, `site-brand.css`, `site-navigation-a11y.css`, `hardening.css` are commonly loaded by many pages. Page-specific CSS files include `about-experience.css`, `mock-exam.css`, `materials-2015.css`, `tools-page.css`, `revision-2026-directory.css`, `lesson-watermark.css`.

**Safe edits:** page-specific CSS selectors.  
**Caution:** `style.css`, `.topbar`, `.navlinks`, `.subject-card`, `.action`, CSS variables in `:root` affect many pages.

#### `assets/js/` 🌐
Vanilla JavaScript. Important shared files:

- `main.js` — global initializer.
- `site-shell.js` — canonical global header/footer/navigation renderer.
- `poly-utils.js` — shared utilities such as HTML escaping if loaded.
- `visitor-popup.js` — popup rotation.
- `maintenance-controller.js` — maintenance mode.
- `subject-browser.js` — subject cards for home/syllabus/lessons/papers.
- `revision-2026-browser.js` — Revision 2026 directory/departments.
- `ask-poly-*.js` — Ask POLY AI client and rendering.
- `quiz-*.js`, `daily-quiz-*.js` — quiz features.
- `mock-exam-*.js` — mock exam features.
- `lesson-watermark.js` — lesson watermark overlay.
- `sw-register.js` — registers `sw.js` if page includes it.

**Safe edits:** add small page-specific script or edit the exact page script.  
**Caution:** `main.js` and `site-shell.js` run across many pages.

#### `assets/data/` 🔗
JSON data used by website JavaScript:

- `revision-2026-programmes.json`
- `revision-2026-subjects.json`
- `rev2026-programme-status.json`
- `revision-2015-subjects.json`
- `ask-poly-knowledge.json`
- `important-days-wishes.json`

Some are generated by scripts/workflows. Edit manually only if you know whether a script will overwrite it.

#### `assets/media/`, `assets/images/`, `assets/icons/`, `assets/audio/`, `assets/popup/` 🌐
Images, logos, favicons, popup media, icons, audio. `site-shell.js` uses `/assets/media/poly-pmna-logo.png` and `/assets/media/poly-pmna-favicon.svg`. Popup system probes `/assets/popup/popup-1.png`, `/assets/popup/popup-2.png`, `/assets/popup/popup-1.mp4`.

#### `lessons/` and `notes/` 🌐
Revision 2021 lesson HTML and notes PDF files. Example: `lessons/lessons-1001.html`, `notes/downloadable-notes-1001.pdf`.

#### `revision-2026/` and `revision-2026-content/` 🌐
`revision-2026/` contains department pages. `revision-2026-content/lessons/` and `revision-2026-content/notes/` contain Revision 2026-specific lessons/notes. Do not mix 2021 and 2026 lesson/notes paths.

#### `android-app/` 📱
Native Android project root:

```text
android-app/
 ├── settings.gradle
 ├── build.gradle
 ├── gradle.properties
 └── app/
      ├── build.gradle
      └── src/main/
           ├── AndroidManifest.xml
           ├── java/org/diplomanotes/polytechnicstudyhub/
           │    ├── MainActivity.java
           │    ├── NotificationBootstrapActivity.java
           │    └── PolyPmnaMessagingService.java
           ├── res/layout/activity_main.xml
           ├── res/values/colors.xml
           ├── res/values/strings.xml
           ├── res/values/themes.xml
           ├── res/drawable/*.xml
           └── assets/offline.html
```

#### `.github/workflows/` ⚙️
GitHub Actions. Important workflows:

- `deploy-static-site.yml` — Cloudflare Pages deploy.
- `deploy-github-pages.yml` — GitHub Pages deploy.
- `site-quality-gate.yml` — validation on push/PR.
- `site-structure-validation.yml` — validates lesson/site structure.
- `build-android-app.yml` — signed APK build and GitHub Release publishing.
- `deploy-ask-poly-ai.yml` — Cloudflare Worker deploy.
- `notify-new-lessons.yml`, `send-1181-notification.yml`, `daily-good-morning-notification.yml` — FCM notifications.
- `build-ask-poly-knowledge.yml` — regenerates Ask POLY knowledge index.

#### `tools/` ⚙️
Python/Node maintenance scripts: sitemap generation, site quality gate, public build, Revision 2026 data sync, lesson PDF building, knowledge index building, validation.

#### `workers/ask-poly-ai/` ⚙️
Cloudflare Worker source for Ask POLY AI. `wrangler.toml`, `package.json`, `src/*.js` exist. Secrets are supplied by GitHub Actions/Cloudflare, not committed.

#### `supabase/` ⚙️
SQL schema/migrations for quizzes/mock exams and Supabase functions documentation. Browser pages use vendored Supabase JS in `assets/vendor/`.

#### `downloads/` 🔗
APK files and update metadata. User requested this guide here, so this file is placed as `downloads/DEVELOPER_GUIDE_ML.md`.

---

## 3. File-by-File Explanation

### `assets/js/site-shell.js` 🌐

**Purpose:** Global header, navigation, footer, favicon, reveal assets, mobile menu, lesson watermark injection എന്നിവ control ചെയ്യുന്നു.

**Used by:** `main.js` dynamically loads it; many HTML pages include it directly too.

**Controls:** `navItems`, `headerMarkup`, `footerMarkup`, mobile menu behavior, active page detection.

**Safe to edit:** With caution. ഒരു nav item change ചെയ്യുമ്പോൾ every page ബാധിക്കും.

**Common changes:** menu item add/remove/rename, footer links change, logo path change.

**Relationship:**

```text
main.js → ensureSiteShell() → loads site-shell.js → PolySiteShell.render() → header/footer update
```

### `assets/js/main.js` 🌐

**Purpose:** Every portal page-നുള്ള global initializer. Reveal assets, site shell, visitor popup, maintenance controller, copyright year, legacy link normalize, Revision 2026 official links എന്നിവ handle ചെയ്യുന്നു.

**Safe to edit:** With high caution. Bug വന്നാൽ many pages break ചെയ്യും.

### `assets/js/subject-browser.js` 🌐

**Purpose:** Subject cards render ചെയ്യുന്നു. `data-mode` അനുസരിച്ച് behavior മാറുന്നു:

- `home` — limited subject list.
- `syllabus` — syllabus actions.
- `lessons` — lessons available only.
- `papers` — model question paper link only.
- `department` — department-specific subject listing.

**Used by:** `index.html`, `syllabus.html`, `lessons.html`, `model-question-papers.html`, department pages depending on script include.

**Controls:** Filters, subject card markup, QP URL generation, notes/lesson availability sets.

**Common mistake:** `mode === "papers"` branch-ൽ syllabus/lessons/notes ചേർക്കരുത്; QP page-ൽ only QP button വേണം.

### `assets/js/revision-2026-browser.js` 🌐

**Purpose:** Revision 2026 directory and department subject pages render/enhance ചെയ്യുന്നു. `assets/data/revision-2026-programmes.json` and `assets/data/revision-2026-subjects.json` ഉപയോഗിക്കുന്നു.

**Controls:** Department cards, semester filters, subject cards for 2026 pages.

### `assets/js/visitor-popup.js` 🌐

**Purpose:** Non-Ask-POLY pages-ൽ daily popup കാണിക്കുന്നു. Popup media `assets/popup/`-ൽ നിന്ന് load ചെയ്യുന്നു. `localStorage` ഉപയോഗിച്ച് once-per-day behavior.

**Safe changes:** Popup text/media list/timeouts. Avoid heavy network checks.

### `assets/js/lesson-watermark.js` and `assets/css/lesson-watermark.css` 🌐

**Purpose:** Lesson pages-ൽ watermark overlay inject/style ചെയ്യുന്നു. `site-shell.js` lesson pages detect ചെയ്ത് CSS/DOM inject ചെയ്യാം.

### `sw.js` 🌐

**Purpose:** Service Worker. Basic cache list and navigation fallback to `/offline.html`.

**Caution:** Cache name/path തെറ്റിച്ചാൽ old CSS/JS users-ന് കാണാം. Cache version bump ചെയ്യണം.

### `site.webmanifest` 🌐

**Purpose:** PWA metadata: name, start URL, display, theme color, icons.

### `android-app/app/src/main/java/org/diplomanotes/polytechnicstudyhub/MainActivity.java` 📱

**Purpose:** Main native Android shell. `WebView` configure ചെയ്യുന്നു, website load ചെയ്യുന്നു, drawer menu actions bind ചെയ്യുന്നു, downloads handle ചെയ്യുന്നു, external links approve/block ചെയ്യുന്നു, offline fallback load ചെയ്യുന്നു.

**Important constants:**

```java
private static final String HOME_URL = "https://polypmna.dpdns.org/";
private static final String TRUSTED_HOST = "polypmna.dpdns.org";
private static final String ERROR_PAGE_URL = "file:///android_asset/offline.html";
```

**Controls:** Home URL, trusted host, approved external hosts, navigation drawer paths, WebView settings, download rules.

### `android-app/app/src/main/res/layout/activity_main.xml` 📱

**Purpose:** Android native UI layout. It uses `DrawerLayout`, `LinearLayout`, `FrameLayout`, `WebView`, `ProgressBar`, drawer menu `TextView` items.

**Controls:** Toolbar, menu button, refresh button, launch overlay, drawer menu look.

### `android-app/app/src/main/java/org/diplomanotes/polytechnicstudyhub/NotificationBootstrapActivity.java` 📱

**Purpose:** Launcher Activity. Notification channel create ചെയ്യുന്നു, `POST_NOTIFICATIONS` permission ചോദിക്കുന്നു, Firebase topics subscribe ചെയ്യുന്നു, then `MainActivity` open ചെയ്യുന്നു.

### `android-app/app/src/main/java/org/diplomanotes/polytechnicstudyhub/PolyPmnaMessagingService.java` 📱

**Purpose:** Firebase Cloud Messaging messages receive ചെയ്ത് Android notification build ചെയ്യുന്നു. Notification tap ചെയ്താൽ trusted URL with `MainActivity` open ചെയ്യും.

### `android-app/app/build.gradle` ⚙️📱

**Purpose:** Android app Gradle config. `applicationId`, `minSdk`, `targetSdk`, `versionCode`, `versionName`, dependencies, signing config, build types.

**Important:** Release signing properties are passed with `-PANDROID_KEYSTORE_FILE`, etc. `google-services.json` exists only during configured builds.

### `.github/workflows/build-android-app.yml` ⚙️📱

**Purpose:** On push to `main` under `android-app/**` or manual dispatch, signed release APK build/publish. Requires Firebase and signing secrets.

### `.github/workflows/deploy-static-site.yml` ⚙️🌐

**Purpose:** Cloudflare Pages deploy. Runs quality gate and `tools/build_public_site.py --target _site`, then deploys `_site`.

---

## 4. Website Guide

### Find an existing page 🌐

Root pages are in repository root. Example:

```bash
find . -maxdepth 1 -name '*.html' -printf '%f\n' | sort
```

Lessons are in:

```text
lessons/lessons-1001.html
revision-2026-content/lessons/lessons-1001.html
```

Department pages are in:

```text
revision-2026/*.html
revision-2021/*.html
```

### Edit an existing page 🌐

1. Open the `.html` file.
2. Find `<main id="main-content">` or main content section.
3. Change text/cards/links.
4. Do not remove common CSS/JS includes unless you know the page does not need them.
5. Test with local server:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000/page-name.html`.

### Add a new HTML page 🌐

1. Copy a similar simple page like `privacy.html` or `disclaimer.html`.
2. Rename to `new-page.html`.
3. Update `<title>`, meta description, `<h1>`, breadcrumb.
4. Keep shared CSS includes (`style.css`, `responsive.css`, `portal-layout.css`, `fixed-site-header.css`) if the page should match site style.
5. Include `assets/js/main.js` and `assets/js/fixed-site-header.js` if needed.
6. Add link to `site-shell.js` nav or a specific page.

### Add page to navigation 🌐

Global nav is primarily controlled in `assets/js/site-shell.js` through `navItems`.

**BEFORE**

```js
["Help", "/contact.html", path => path.endsWith("/contact.html")]
```

**AFTER**

```js
["Help", "/contact.html", path => path.endsWith("/contact.html")],
["New Page", "/new-page.html", path => path.endsWith("/new-page.html")]
```

Malayalam explanation: `navItems` array-ൽ new item add ചെയ്താൽ `site-shell.js` render ചെയ്യുന്ന all portal pages-ൽ menu item വരും. Static old header markup ചില HTML files-ൽ ഉണ്ടെങ്കിലും `site-shell.js` canonical header replace ചെയ്യാൻ designed ആണ്.

### Add footer link 🌐

`assets/js/site-shell.js` footer markup ഭാഗം edit ചെയ്യുക. ചില pages-ൽ hardcoded `<footer>` ഉണ്ടെങ്കിലും global shell render may normalize it. Footer link one page only വേണമെങ്കിൽ ആ page-യിലെ `<footer>` അല്ലെങ്കിൽ main content-ൽ local link ഇടുക.

### Breadcrumbs 🌐

Many pages use:

```html
<nav class="site-breadcrumbs" aria-label="Breadcrumb">
  <ol><li><a href="/">Home</a></li><li><span aria-current="page">Page Name</span></li></ol>
</nav>
```

New page-ൽ same structure copy ചെയ്യാം.

### Internal/external links 🌐

- Internal absolute path: `<a href="/revision-2026.html">Revision 2026</a>`
- External link: `<a href="https://www.sitttrkerala.ac.in/" target="_blank" rel="noopener noreferrer">SITTTR</a>`

External links-ൽ `target="_blank"` ഉപയോഗിച്ചാൽ `rel="noopener noreferrer"` ചേർക്കുക.

### Submenu/dropdown 🌐

ഈ feature ഇപ്പോഴത്തെ global `site-shell.js` navigation-ൽ കാണുന്നില്ല. Dropdown add ചെയ്യണമെങ്കിൽ `navMarkup()`, `headerMarkup`, CSS in `style.css`/`fixed-site-header.css`, mobile keyboard behavior എന്നിവ ഒരുമിച്ച് design ചെയ്യണം. Simple beginner-safe option: new top-level nav item add ചെയ്യുക.

### Active menu item 🌐

`navItems` entry-യുടെ third value function ആണ് active state decide ചെയ്യുന്നത്:

```js
["Mock Exams", "/daily-quiz.html", path => path.endsWith("/daily-quiz.html") || /\/mock-exam(?:-|\.html)/i.test(path)]
```

New page active വേണമെങ്കിൽ `path.endsWith("/new-page.html")` style condition ചേർക്കുക.

---

## 5. Adding Buttons

### Normal HTML button 🌐

```html
<button class="btn primary" type="button">Click Me</button>
```

`btn`/`primary` classes site CSS-ൽ പല pages-ൽ ഉപയോഗിക്കുന്നു.

### Link button 🌐

```html
<a class="action qp" href="/model-question-papers.html">Open Question Papers</a>
```

`action qp`, `action syllabus`, `action lessons`, `action download` styles subject cards-ൽ ഉപയോഗിക്കുന്നു.

### JavaScript button 🌐

HTML:

```html
<button id="showNoticeBtn" class="btn primary" type="button">Show Notice</button>
```

JS page-specific script:

```html
<script>
  document.getElementById('showNoticeBtn')?.addEventListener('click', () => {
    alert('Notice');
  });
</script>
```

Better: create `assets/js/new-page.js` and include it only on that page.

### Button on all pages 🌐

Edit `assets/js/site-shell.js` header/footer markup. Example: add footer button. This affects all portal pages. Test multiple pages.

### Button on one page only 🌐

Add button in that page’s `.html` file and page-specific CSS in a new CSS file or `<style>` block.

### Android-only button 📱

Add native view in `android-app/app/src/main/res/layout/activity_main.xml` and bind click in `MainActivity.java`. This will not appear in browser website.

Dependency:

```text
activity_main.xml Button/TextView/ImageButton
 ↓ id = @+id/newNativeButton
MainActivity.java findViewById(R.id.newNativeButton)
 ↓ setOnClickListener
Native action or webView.loadUrl(...)
```

---

## 6. Website Themes / Styling

### Global theme 🌐

Global variables are in `assets/css/style.css` under `:root`:

```css
:root {
  --ink: #172033;
  --bg: #eef5ff;
  --surface: #ffffff;
  --blue: #1d4ed8;
  --cyan: #0f9fba;
  --shadow: 0 22px 65px rgba(20, 45, 90, 0.15);
}
```

Change whole website colors by editing these variables. Example: `--blue` changes many buttons/nav accents.

### Navbar 🌐

CSS selectors in `assets/css/style.css`:

- `.topbar`
- `.brand`
- `.navlinks`
- `.navlinks a`
- `.menu-toggle`

Mobile header hotfix is in `assets/css/mobile-header-hotfix.css` and fixed header CSS in `assets/css/fixed-site-header.css`.

### Footer 🌐

`.footer` styles are in `assets/css/style.css`. Footer markup is in `site-shell.js` and sometimes static in HTML pages.

### Buttons/Cards 🌐

Common selectors:

- `.btn`
- `.action`
- `.action.qp`
- `.action.syllabus`
- `.subject-card`
- `.info-card`
- `.choice-card`
- `.notice`

### Page-specific theme 🌐

Use a page-specific body class or section ID.

Example for one page only:

```html
<body class="portal-page my-special-page">
```

```css
.my-special-page .page-title {
  background: linear-gradient(135deg, #fff7ed, #eff6ff);
}
```

This avoids changing `.page-title` globally.

### CSS specificity rule

- `.page-title` affects all page titles.
- `.my-special-page .page-title` affects only pages with that body class.
- Inline `<style>` near page affects page only, but external CSS is easier to maintain.

---

## 7. Dark Mode / Light Mode

ഈ repository-ൽ complete user-toggle dark mode system കാണുന്നില്ല. Existing theme is light-first with CSS variables. Android theme also uses light `Theme.Material.Light.NoActionBar`.

### Correct way to add website dark mode 🌐

1. Add variables in `assets/css/style.css`:

```css
html[data-theme="dark"] {
  --ink: #e5eefc;
  --bg: #071426;
  --surface: #10213d;
}
```

2. Add toggle JS in a page or global script:

```js
const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
document.documentElement.dataset.theme = next;
localStorage.setItem('polyTheme', next);
```

3. If global, add button through `site-shell.js`.

### Android dark mode 📱

No separate `values-night/` folder found. To add Android dark mode, create:

```text
android-app/app/src/main/res/values-night/colors.xml
android-app/app/src/main/res/values-night/themes.xml
```

Then test both system light/dark modes.

---

## 8. Watermark

### Existing lesson watermark 🌐

Files:

```text
assets/js/lesson-watermark.js
assets/css/lesson-watermark.css
assets/js/site-shell.js
```

`lesson-watermark.js` injects:

```html
<div class="poly-watermark" data-poly-watermark aria-hidden="true">
  <div class="poly-watermark-inner"></div>
</div>
```

`site-shell.js` also has `ensureWatermarkCss()` and `ensureWatermarkDom()` for lesson pages.

### Change watermark text 🌐

Check `assets/css/lesson-watermark.css` for `.poly-watermark-inner::before` or background text. Edit `content`, opacity, transform, position there.

### Apply watermark globally 🌐

Do not use lesson watermark blindly on every page. Better:

1. Create `assets/css/site-watermark.css`.
2. Add watermark DOM from `site-shell.js` only on pages you need.
3. Use low opacity and `pointer-events:none`.

### One-page watermark 🌐

Add in that page:

```html
<div class="my-page-watermark" aria-hidden="true">POLY PMNA</div>
```

```css
.my-page-watermark {
  position: fixed;
  inset: auto 20px 20px auto;
  opacity: .08;
  pointer-events: none;
}
```

---

## 9. Popup / Notification on Website

### Existing popup system 🌐

`assets/js/main.js` calls `ensureVisitorPopup()` except on Ask POLY pages. It loads `assets/js/visitor-popup.js`. The popup checks media files in `assets/popup/` and uses `localStorage` keys:

```text
polyVisitorPopupMediaDateV3
polyVisitorPopupMediaIndexV3
```

It waits up to `WAIT_MS = 60000` and auto-closes at `AUTO_CLOSE_MS = 60000`.

### Change popup media 🌐

Add files:

```text
assets/popup/popup-1.png
assets/popup/popup-2.png
assets/popup/popup-1.mp4
```

Update list in `visitor-popup.js` if adding new file names.

### Show popup only once 🌐

Already once-per-day logic exists. To force during testing, use URL:

```text
?showPopup=1
```

or hash:

```text
#showPopup
```

### Create button-click popup 🌐

For one page, add local script. Do not modify `visitor-popup.js` unless it is a global promotional popup.

### Toast notification 🌐

No global toast utility confirmed. Simple implementation can be page-specific with a `.toast` div and JS timeout. If making global, add to `poly-utils.js` or a new `site-toast.js` and load from `main.js` only after testing.

---

## 10. Android App Guide

### Android project root 📱

```text
android-app/
```

### Manifest 📱

`android-app/app/src/main/AndroidManifest.xml` defines:

- Permissions: `INTERNET`, `POST_NOTIFICATIONS`.
- App icon: `@drawable/ic_launcher`.
- Theme: `@style/Theme.PolytechnicStudyHub`.
- Firebase default notification icon/channel metadata.
- `PolyPmnaMessagingService` for FCM.
- Launcher `NotificationBootstrapActivity`.
- `MainActivity` with deep links for `https://polypmna.dpdns.org/*` and custom scheme `polytechnic-study-hub`.

### Activities 📱

- `NotificationBootstrapActivity` — first launch, notification permission/channel/topic subscription.
- `MainActivity` — real app UI with WebView.

### Fragments 📱

ഈ repository-ൽ custom `Fragment` classes കാണുന്നില്ല. Dependency `androidx.fragment:fragment` exists, but app code currently uses Activities and layout directly.

### Layout 📱

`activity_main.xml` uses:

```text
DrawerLayout
 ├── vertical LinearLayout
 │    ├── appBar LinearLayout
 │    └── FrameLayout
 │         ├── WebView
 │         ├── ProgressBar
 │         └── launchOverlay
 └── navigationDrawer LinearLayout
```

### WebView implementation 📱

`MainActivity.configureWebView()` enables JavaScript, DOM storage, database, safe browsing, disables file/content access, blocks mixed content, sets user agent suffix `PolyPmnaAndroid/<version>`, and attaches:

```java
webView.setWebViewClient(new HubWebViewClient());
webView.setWebChromeClient(new HubWebChromeClient());
webView.setDownloadListener(createDownloadListener());
```

### JavaScript bridge 📱

ഈ feature ഇപ്പോഴത്തെ repository-ൽ കാണുന്നില്ല. There is no `addJavascriptInterface(...)`. Android injects CSS/DOM cleanup using `evaluateJavascript()` in `injectNativeAppChrome()`, but website JS cannot directly call native Java methods.

### Notification code 📱

- Channel constants in `NotificationBootstrapActivity`.
- FCM receive/build notification in `PolyPmnaMessagingService`.
- Workflows send FCM messages through Firebase HTTP v1.

### Permissions 📱

- `INTERNET` required for WebView.
- `POST_NOTIFICATIONS` required on Android 13+.

### App icon/splash 📱

- Icon: `android-app/app/src/main/res/drawable/ic_launcher.xml`.
- Launch window background: `bg_launch_window.xml`.
- Native launch overlay: `activity_main.xml` `FrameLayout` with id `launchOverlay`.

---

## 11. Android-Only Changes

### Website vs Android native vs shared

```text
Website feature
  → Edit root HTML/CSS/JS.
  → Browser and Android WebView both see it.

Android native feature
  → Edit android-app/app/src/main/...
  → Only APK sees it.

Shared feature
  → Website content loaded inside WebView.
  → If you edit website page, Android app sees it after website deploy.
```

### Add Android-only drawer item 📱

1. Add a `TextView` in `activity_main.xml` drawer section with new id.
2. Add string in `strings.xml`.
3. Bind in `MainActivity.configureNativeShell()`:

```java
bindNavigation(R.id.navNewPage, "/new-page.html");
```

This opens a website page inside WebView but menu item is Android-only.

### Add Android-only native button 📱

Add button to `activity_main.xml`, for example in appBar:

```xml
<ImageButton
    android:id="@+id/nativeHelpButton"
    android:layout_width="46dp"
    android:layout_height="46dp"
    android:src="@drawable/ic_question"
    android:contentDescription="Native help" />
```

Then in `MainActivity.configureNativeShell()`:

```java
findViewById(R.id.nativeHelpButton).setOnClickListener(view ->
    Toast.makeText(this, "Native Android button", Toast.LENGTH_SHORT).show()
);
```

---

## 12. Android Theme

### Android-only style files 📱

| File | Controls |
| --- | --- |
| `android-app/app/src/main/res/values/colors.xml` | Brand colors, background, text, status bar |
| `android-app/app/src/main/res/values/themes.xml` | App theme, status/navigation bar, drawer item styles |
| `android-app/app/src/main/res/drawable/*.xml` | Icons/background shapes |
| `activity_main.xml` | Layout colors and view attributes |

### Change status bar 📱

Edit `status_bar` in `colors.xml` or `android:statusBarColor` in `themes.xml`.

### Change drawer item look 📱

Edit style `DrawerMenuItem` in `themes.xml` and background `bg_drawer_item.xml`.

### Change toolbar/app background 📱

Edit `activity_main.xml` references to `@color/surface`, `@color/app_background`, then colors in `colors.xml`.

### Android dark mode 📱

No existing `values-night` found. Add it if needed.

---

## 13. Android Notifications

### Existing notification flow 📱

```text
GitHub workflow or Firebase server sends FCM
  ↓ topic: new-lessons or all-users
FirebaseMessagingService = PolyPmnaMessagingService
  ↓ onMessageReceived(RemoteMessage)
Extract data: title, body, url, subjectCode
  ↓ trustedUrl() allows only https://polypmna.dpdns.org
showNotification()
  ↓ PendingIntent opens MainActivity with URL
MainActivity.loadIncomingIntent()
  ↓ WebView loads target URL
```

### Change notification title/body 📱⚙️

For workflow-sent notifications, edit workflow payloads:

- `.github/workflows/notify-new-lessons.yml`
- `.github/workflows/send-1181-notification.yml`
- `.github/workflows/daily-good-morning-notification.yml`

For default app fallback strings edit:

```text
android-app/app/src/main/res/values/strings.xml
```

### Change notification icon 📱

Edit:

```text
android-app/app/src/main/res/drawable/ic_notification.xml
```

Manifest points to it through metadata.

### Local notification from button 📱

No local notification button exists currently. To add:

1. Add button in `activity_main.xml`.
2. Create a method in `MainActivity.java` using `NotificationManager` and channel `NotificationBootstrapActivity.CHANNEL_ID`.
3. Check `POST_NOTIFICATIONS` permission on Android 13+.
4. Build `Notification.Builder` similar to `PolyPmnaMessagingService.showNotification()`.

### Firebase/FCM exists? 📱

Yes. Android dependency `com.google.firebase:firebase-messaging` exists. Workflows require `FIREBASE_GOOGLE_SERVICES_JSON` or `FIREBASE_SERVICE_ACCOUNT_JSON` secrets.

---

## 14. Android App Menu / Toolbar

### Drawer menu 📱

Menu item views are in `activity_main.xml`. Click behavior is in `MainActivity.configureNativeShell()`:

```java
bindNavigation(R.id.navHome, "/");
bindNavigation(R.id.navRevision2026, "/revision-2026.html");
bindNavigation(R.id.navStudyMaterials, "/model-question-papers.html");
```

### Add menu option 📱

1. Add `TextView` with style `@style/DrawerMenuItem`.
2. Add id `@+id/navNewPage`.
3. Add string in `strings.xml`.
4. Add `bindNavigation(R.id.navNewPage, "/new-page.html");`.

### Rename menu option 📱

Edit `strings.xml` such as `nav_study_materials`.

### Add icon 📱

Use `android:drawableStart="@drawable/ic_document"` or create new `res/drawable/ic_new.xml`.

### Open native screen 📱

Currently there is no extra native screen. To open one, create a new Activity and register it in `AndroidManifest.xml`. See Section 16.

---

## 15. Android Layout Editing

### Where layouts are stored 📱

```text
android-app/app/src/main/res/layout/activity_main.xml
```

Only one layout file found.

### Add `TextView` 📱

```xml
<TextView
    android:id="@+id/myText"
    android:layout_width="wrap_content"
    android:layout_height="wrap_content"
    android:text="Hello" />
```

### Add `Button` 📱

```xml
<Button
    android:id="@+id/myButton"
    android:layout_width="wrap_content"
    android:layout_height="wrap_content"
    android:text="Open" />
```

### Add `ImageView` 📱

```xml
<ImageView
    android:layout_width="40dp"
    android:layout_height="40dp"
    android:src="@drawable/ic_launcher"
    android:contentDescription="@null" />
```

### Layout rules 📱

This app uses `LinearLayout`, `FrameLayout`, and `DrawerLayout`, not `ConstraintLayout`. So spacing is controlled by:

- `android:orientation`
- `android:layout_weight`
- `android:layout_marginStart/End/Top/Bottom`
- `android:paddingStart/End`
- `android:gravity`
- `android:layout_gravity`
- `android:visibility`

---

## 16. Adding a New Android Screen

ഈ repository-ൽ only `MainActivity` and bootstrap Activity currently exist. New native screen add ചെയ്യാൻ:

1. Create `android-app/app/src/main/java/org/diplomanotes/polytechnicstudyhub/NewActivity.java`.
2. Create layout `android-app/app/src/main/res/layout/activity_new.xml`.
3. Register in `AndroidManifest.xml`:

```xml
<activity android:name=".NewActivity" android:exported="false" />
```

4. Add button/menu item in `activity_main.xml`.
5. In `MainActivity.java`:

```java
findViewById(R.id.navNativeNew).setOnClickListener(view ->
    startActivity(new Intent(this, NewActivity.class))
);
```

6. Test:

```bash
gradle -p android-app :app:assembleDebug --no-daemon
```

---

## 17. Website ↔ Android Communication

### Website content loading 📱🔗

`MainActivity.HOME_URL` is `https://polypmna.dpdns.org/`. Trusted links with host `polypmna.dpdns.org` load inside WebView. Approved external hosts open external apps/browser.

### URL configured in 📱

```text
android-app/app/src/main/java/org/diplomanotes/polytechnicstudyhub/MainActivity.java
```

### JavaScript handling 📱

`settings.setJavaScriptEnabled(true)` and `setDomStorageEnabled(true)`. There is no native JS bridge. Android injects CSS/DOM cleanup using:

```java
target.evaluateJavascript("(function(){...})();", null);
```

### Android-only CSS class 🔗

Android injects `polytechnic-native-app` class into `document.documentElement`. Website CSS/JS can use this to hide/show content in WebView only.

Example:

```css
.android-only-banner { display: none; }
html.polytechnic-native-app .android-only-banner { display: block; }
```

But note: this is still website HTML, only displayed in Android WebView due to injected class.

### Security 📱

- No `addJavascriptInterface`, reducing bridge attack surface.
- `setAllowFileAccess(false)` and `setAllowContentAccess(false)` are set.
- `MixedContentMode` is `MIXED_CONTENT_NEVER_ALLOW`.
- Downloads allowed only from trusted host and certain paths/extensions.

---

## 18. Adding a New HTML Page — Complete Tutorial

1. Create `new-resource.html` at repo root.
2. Copy structure from `privacy.html` or `disclaimer.html`.
3. Update:

```html
<title>New Resource | POLY PMNA</title>
<meta name="description" content="...">
```

4. Add breadcrumb:

```html
<nav class="site-breadcrumbs" aria-label="Breadcrumb">
  <ol><li><a href="/">Home</a></li><li><span aria-current="page">New Resource</span></li></ol>
</nav>
```

5. Add main content.
6. Add navigation in `assets/js/site-shell.js` if global.
7. If Android drawer needs it, add `bindNavigation()` and XML drawer item.
8. Test locally:

```bash
python3 -m http.server 8000
```

9. Run validation if possible:

```bash
python tools/site_quality_gate.py
```

10. Commit:

```bash
git add new-resource.html assets/js/site-shell.js
git commit -m "Add new resource page"
```

---

## 19. Updating Existing Content

| Content type | Location | Notes |
| --- | --- | --- |
| Homepage text | `index.html` | Search heading text. |
| Public page text | root `.html` files | Keep meta/structured data consistent. |
| Revision 2021 lessons | `lessons/lessons-CODE.html` | Also check `notes/downloadable-notes-CODE.pdf`. |
| Revision 2026 lessons | `revision-2026-content/lessons/lessons-CODE.html` | Do not put 2026 content in `lessons/`. |
| PDFs | `notes/`, `revision-2026-content/notes/` | Naming pattern matters. |
| Question papers | `model-question-papers.html`, `subject-browser.js`, official SITTTR URLs | QP page should not show notes/lessons. |
| Images | `assets/media/`, `assets/images/`, `images/` | Use absolute `/assets/...` paths for root pages. |
| Popup media | `assets/popup/` | Filenames are probed by `visitor-popup.js`. |
| Android strings | `android-app/app/src/main/res/values/strings.xml` | App-only labels. |
| Android colors | `android-app/app/src/main/res/values/colors.xml` | App-only colors. |

---

## 20. Assets

### Add image 🌐

Put it in:

```text
assets/media/
```

Use:

```html
<img src="/assets/media/my-image.png" alt="Description">
```

### Change logo 🌐📱

Website logo:

```text
assets/media/poly-pmna-logo.png
assets/js/site-shell.js LOGO_HREF
```

Android icon:

```text
android-app/app/src/main/res/drawable/ic_launcher.xml
```

### Add PDF 🌐

Revision 2021 notes:

```text
notes/downloadable-notes-CODE.pdf
```

Revision 2026 notes:

```text
revision-2026-content/notes/downloadable-notes-CODE.pdf
```

### Common path mistakes

- In root HTML: use `/assets/media/file.png`.
- In nested lesson page: absolute path `/assets/...` is safer than `../assets/...`.
- Android `res/drawable` uses resource names, not file paths: `@drawable/ic_launcher`.

---

## 21. JavaScript Guide

### Important shared functions/files

| File | Important functions/behavior |
| --- | --- |
| `main.js` | `ensureRevealAssets`, `ensureSiteShell`, `ensureVisitorPopup`, `normalizeLegacyInternalLinks`, `watchRev2026Cards` |
| `site-shell.js` | `navItems`, `navMarkup`, `bindMenu`, `renderHeader`, `renderFooter`, `render` |
| `subject-browser.js` | `getSubjects`, `normalize2026`, `card`, `group`, `fillDepartment`, `fillSemester`, `render`, `init` |
| `revision-2026-browser.js` | Department and subject rendering for Revision 2026 |
| `visitor-popup.js` | `availablePopups`, `installStyles`, daily localStorage logic |
| `ask-poly-v2.js` | Ask POLY chat client logic |
| `mock-exam-service.js` | Mock exam evaluation/storage flow |
| `quiz-auth.js`, `quiz-*.js` | Quiz auth, bank, engine, UI |

### Add click event 🌐

```js
document.getElementById('myButton')?.addEventListener('click', () => {
  console.log('clicked');
});
```

Use `?.` to avoid errors if the button is absent on another page.

### Read URL parameters 🌐

```js
const params = new URLSearchParams(location.search);
const code = params.get('code');
```

### LocalStorage 🌐

`visitor-popup.js` already uses `localStorage`. Pattern:

```js
localStorage.setItem('key', 'value');
const value = localStorage.getItem('key');
```

Always wrap in `try/catch` if global script because some browsers block storage.

### Change page content dynamically 🌐

```js
const title = document.querySelector('h1');
if (title) title.textContent = 'New Title';
```

---

## 22. CSS Guide

### CSS architecture 🌐

- `style.css` — base/global visual system.
- `responsive.css` — broad responsive rules.
- `portal-layout.css` — portal page layout helpers.
- `fixed-site-header.css` and `mobile-header-hotfix.css` — header behavior.
- Page CSS files — page-specific features.
- Lesson CSS files — handbook/lesson pages.

### Change colors 🌐

Edit CSS variables in `style.css`. For one page, override under body class.

### Change font sizes 🌐

Global: `body`, `h1`, `.page-title h1`, `.navlinks a` in `style.css`.  
Page-only: `.my-page h1 { font-size: ... }`.

### Cards/buttons 🌐

Subject cards use `.subject-card`; actions use `.action`. Do not change `.action` globally if only QP page needs change. Use:

```css
#subject-browser .action.qp { ... }
```

### Responsive layout 🌐

Use existing `grid-template-columns: repeat(auto-fit, minmax(...))` patterns. Media queries exist in multiple CSS files. Search:

```bash
rg -n "@media" assets/css
```

---

## 23. Responsive Design

The site uses custom CSS responsive behavior:

- Flexible grids with `auto-fit` and `minmax`.
- Mobile navbar via `.menu-toggle` and `.navlinks.open` controlled by `site-shell.js`.
- `responsive.css` and page-specific CSS handle mobile adjustments.
- Android WebView injects CSS to hide website topbar and reduce lesson page chrome.

Android WebView difference:

```text
Browser: shows website topbar
Android: native toolbar/drawer + WebView; injected CSS hides website .topbar
```

---

## 24. Git & GitHub Guide

### Basic commands ⚙️

```bash
git clone https://github.com/nandurpm/diploma-notes.git
cd diploma-notes
git status
git pull
git checkout -b my-change
git add path/to/file
git commit -m "Describe change"
git push origin my-change
```

Then open a GitHub pull request.

### Branches ⚙️

Use a branch for each change. Avoid directly editing `main` unless you are intentionally doing quick production edits.

### GitHub Actions ⚙️

Push/PR can trigger validation/deploy workflows. Important files are in `.github/workflows/`.

### Secrets ⚙️

Do not commit secrets. Workflows expect secrets like:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `FIREBASE_GOOGLE_SERVICES_JSON`
- `FIREBASE_SERVICE_ACCOUNT_JSON`
- `ANDROID_KEYSTORE_BASE64`
- `ANDROID_KEYSTORE_PASSWORD`
- `ANDROID_KEY_ALIAS`
- `ANDROID_KEY_PASSWORD`
- `OPENAI_API_KEY`, `NVIDIA_API_KEY`, `GOOGLE_AI_STUDIO`, Supabase secrets for Worker

---

## 25. Build Android APK

### Debug APK 📱⚙️

From repository root:

```bash
gradle -p android-app :app:assembleDebug --no-daemon
```

Expected output location:

```text
android-app/app/build/outputs/apk/debug/
```

### Release APK 📱⚙️

Release signing is configured only if properties are supplied:

```bash
gradle -p android-app :app:assembleRelease --no-daemon \
  -PANDROID_KEYSTORE_FILE="$PWD/android-app/release.keystore" \
  -PANDROID_KEYSTORE_PASSWORD="..." \
  -PANDROID_KEY_ALIAS="..." \
  -PANDROID_KEY_PASSWORD="..."
```

Expected output:

```text
android-app/app/build/outputs/apk/release/
```

### Android Studio method 📱

Open `android-app/` as the project. Let Gradle sync. Use **Build → Build Bundle(s) / APK(s) → Build APK(s)** for debug, or configured signing for release.

### Clean/rebuild 📱

```bash
gradle -p android-app clean --no-daemon
gradle -p android-app :app:assembleDebug --no-daemon
```

### Common build errors 📱

- Missing Firebase config: debug can build without active Firebase if no `google-services.json`, but public workflow requires `FIREBASE_GOOGLE_SERVICES_JSON`.
- Release signing missing: workflow refuses unsigned/debug release.
- Java version: workflow uses Java 17.

---

## 26. Updating APK Version

Edit:

```text
android-app/app/build.gradle
```

Current values:

```gradle
versionCode 14
versionName '3.5'
```

Rules:

- `versionCode` must increase for every release.
- `versionName` is user-visible.
- App name is in `android-app/app/src/main/res/values/strings.xml` as `app_name`.
- App icon is `android-app/app/src/main/res/drawable/ic_launcher.xml`.

GitHub workflow reads version and names APK:

```text
POLY_PMNA_v<versionName>.apk
```

---

## 27. GitHub Actions / Automated Build

### `build-android-app.yml` 📱⚙️

**Trigger:** manual `workflow_dispatch` or push to `main` changing `android-app/**` or workflow file.  
**Jobs:** checkout, Java 17, Gradle 8.10.2, configure Firebase, read version, validate signing, build signed release, upload/create GitHub Release, update metadata/homepage.  
**Artifacts:** release APK uploaded and release asset created.

### `deploy-static-site.yml` 🌐⚙️

**Trigger:** push to `main`.  
**Process:** quality gate, `tools/build_public_site.py --target _site`, detect Cloudflare Pages project, deploy using Wrangler action.

### `deploy-github-pages.yml` 🌐⚙️

Builds `_site` and deploys to GitHub Pages.

### `site-quality-gate.yml` 🌐⚙️

Runs generated state checks, `tools/site_quality_gate.py`, JavaScript checks, secret prevention.

### `site-structure-validation.yml` 🌐⚙️

Validates lesson fullscreen standard, site structure, watermark coverage. Important when editing lessons/CSS/JS/Android.

### `deploy-ask-poly-ai.yml` ⚙️

Validates Worker source, uploads Worker secrets using `wrangler secret bulk`, deploys `workers/ask-poly-ai/wrangler.toml`.

### Notification workflows ⚙️📱

- `notify-new-lessons.yml`
- `send-1181-notification.yml`
- `send-1181-notification-once.yml`
- `daily-good-morning-notification.yml`

They use Firebase service account JSON and HTTP v1 API to send topic notifications.

---

## 28. Common Tasks Cheat Sheet

| I want to... | Edit this file | What to change |
| --- | --- | --- |
| Add website button | Target `.html` page | Add `<a class="action ...">` or `<button>` |
| Add Android button | `activity_main.xml`, `MainActivity.java` | Add view id and click listener |
| Add website menu item | `assets/js/site-shell.js` | Add `navItems` entry |
| Add Android drawer item | `activity_main.xml`, `strings.xml`, `MainActivity.java` | Add `TextView`, string, `bindNavigation()` |
| Add HTML page | New root `.html`, optionally `site-shell.js` | Copy page shell, update title/content/nav |
| Change global theme | `assets/css/style.css` | Edit `:root` variables/global selectors |
| Change one-page theme | Page HTML + page CSS | Add body class and scoped selectors |
| Add watermark | `lesson-watermark.css/js` or one-page HTML/CSS | Use `pointer-events:none`, low opacity |
| Add popup | `assets/js/visitor-popup.js`, `assets/popup/` | Add/change popup media or fallback text |
| Add website toast | New/page JS + CSS | Create DOM and timeout |
| Add Android notification | `MainActivity.java` or `PolyPmnaMessagingService.java` | Use `NotificationManager` and channel |
| Change Android theme | `colors.xml`, `themes.xml`, `activity_main.xml` | Change color resources/styles |
| Change app icon | `res/drawable/ic_launcher.xml` | Update vector/icon resource |
| Build debug APK | `android-app/` | `gradle -p android-app :app:assembleDebug --no-daemon` |
| Build release APK | `android-app/app/build.gradle` + signing props | `:app:assembleRelease` with `-PANDROID_*` |
| Update APK version | `android-app/app/build.gradle` | Increase `versionCode`, change `versionName` |
| Deploy website | GitHub Actions | Push to `main`, workflows build `_site` |

---

## 29. Where Should I Edit?

```text
I want to change something
        |
        ├── 🌐 Website only?
        │      ├── Text/content → root .html / lessons/*.html / revision-2026-content/lessons/*.html
        │      ├── Design global → assets/css/style.css
        │      ├── Design one page → page-specific CSS or body class
        │      ├── Behavior global → assets/js/main.js or site-shell.js (caution)
        │      ├── Behavior page → page-specific JS
        │      └── Data → assets/data/*.json or tools-generated source
        │
        ├── 📱 Android only?
        │      ├── Native UI → activity_main.xml
        │      ├── Native behavior → MainActivity.java
        │      ├── Notifications → NotificationBootstrapActivity.java / PolyPmnaMessagingService.java
        │      ├── Theme → colors.xml / themes.xml / drawable XML
        │      └── Build/version → android-app/app/build.gradle
        │
        ├── 🔗 Shared website inside Android?
        │      ├── Edit website page/content
        │      └── Test in browser + Android WebView
        │
        └── ⚙️ Deploy/build automation?
               ├── Website deploy → .github/workflows/deploy-static-site.yml
               ├── APK build → .github/workflows/build-android-app.yml
               ├── Worker deploy → .github/workflows/deploy-ask-poly-ai.yml
               └── Validation → site-quality-gate.yml / tools/*.py
```

---

## 30. Safe Editing Rules

### Safe to edit often

- Page text in root `.html` files.
- Page-specific CSS files.
- `assets/popup/` media files.
- Android `strings.xml` text.
- Android `colors.xml` colors.

### Edit with caution

- `assets/css/style.css`.
- `assets/js/main.js`.
- `assets/js/site-shell.js`.
- `assets/js/subject-browser.js`.
- `android-app/app/build.gradle`.
- GitHub Actions.

### Usually generated / script-controlled

- `assets/data/ask-poly-knowledge.json` generated by `tools/build_ask_poly_knowledge.py`.
- `sitemap.xml` generated by `tools/generate_sitemap.py`.
- Some Revision 2026 data/pages are maintained by tools/workflows.

### Before edit

```bash
git status
git checkout -b my-safe-change
```

### After edit

```bash
git diff
python tools/site_quality_gate.py
node --check assets/js/file-you-edited.js
```

For Android:

```bash
gradle -p android-app :app:assembleDebug --no-daemon
```

---

## 31. Troubleshooting

| Symptom | Possible cause | Where to check | Fix |
| --- | --- | --- | --- |
| Website page blank | JS error | Browser console, edited JS | Run `node --check`, fix syntax |
| CSS not applying | Wrong path/cache/specificity | HTML `<link>`, `assets/css/...` | Use absolute path, stronger scoped selector, cache-bust query |
| Image not showing | Wrong path/case | `assets/media/`, HTML `src` | Use `/assets/media/file.png` |
| Link broken | Wrong URL or nested relative path | HTML href | Use absolute `/page.html` |
| QP page shows notes/lessons | Wrong `data-mode` or hotfix script mutation | `model-question-papers.html`, `subject-browser.js` | Ensure `data-mode="papers"` and card branch only QP |
| Mobile menu not opening | `site-shell.js` not loaded or CSS conflict | `main.js`, `site-shell.js`, `mobile-header-hotfix.css` | Check script include and console |
| Popup not showing | Already shown today or media absent | `localStorage`, `assets/popup/` | Test with `?showPopup=1` |
| Android WebView blank | Network/SSL/trusted host issue | `MainActivity.java`, `offline.html` | Check URL, internet permission, logs |
| Android external link blocked | Host not in approved list | `APPROVED_EXTERNAL_HOSTS` in `MainActivity.java` | Add trusted host carefully |
| Android download blocked | URL not trusted path | `isTrustedDownload()` | Add approved path/extension if safe |
| Notification not appearing | Permission/channel/Firebase config missing | Manifest, bootstrap activity, FCM secrets | Grant permission, include `google-services.json`, verify secrets |
| APK not generated | Gradle/build error | terminal output, `android-app/app/build.gradle` | Fix dependency/SDK/signing issue |
| Release workflow fails signing | Missing secrets | `build-android-app.yml` | Configure `ANDROID_KEYSTORE_*` secrets |
| GitHub Actions fail site quality | Generated files stale or markup issue | workflow logs, `tools/site_quality_gate.py` | Run same command locally and commit generated output |

---

## 32. Practical Tutorials

### Tutorial 1 — Add a new website button 🌐

1. Open target page, e.g. `about.html`.
2. Inside desired section add:

```html
<a class="action lessons" href="/lessons.html">Open Lessons</a>
```

3. Test page locally.

### Tutorial 2 — Add an Android-only button 📱

1. Add `ImageButton` or `Button` in `activity_main.xml`.
2. Add `contentDescription` string in `strings.xml`.
3. In `MainActivity.configureNativeShell()`, bind click.
4. Build debug APK.

### Tutorial 3 — Add a new menu option 🌐📱

Website global menu: edit `site-shell.js` `navItems`.  
Android drawer: edit `activity_main.xml` + `MainActivity.bindNavigation()`.

### Tutorial 4 — Add a new HTML page and link it 🌐

Follow Section 18. Then add nav item if needed.

### Tutorial 5 — Change entire website theme 🌐

Edit `:root` variables in `assets/css/style.css`.

### Tutorial 6 — Change only one page theme 🌐

Add body class in page and scoped CSS in page-specific stylesheet.

### Tutorial 7 — Change Android-only theme 📱

Edit `colors.xml` and `themes.xml`. Build APK.

### Tutorial 8 — Add a watermark 🌐

For lessons: edit `lesson-watermark.css`. For one page: add fixed `div` and scoped CSS.

### Tutorial 9 — Add popup notification 🌐

Use `visitor-popup.js` for global promotional popup or page-specific modal for one page.

### Tutorial 10 — Add Android notification 📱

Copy pattern from `PolyPmnaMessagingService.showNotification()`, use same channel, check permission.

### Tutorial 11 — Update website content 🌐

Edit relevant HTML/lesson/PDF asset, test local server, run quality gate.

### Tutorial 12 — Update Android app 📱

Edit XML/Java/resources, run debug build, install APK on device.

### Tutorial 13 — Build APK 📱

```bash
gradle -p android-app :app:assembleDebug --no-daemon
```

### Tutorial 14 — Create release build 📱⚙️

Use `assembleRelease` with signing properties or run GitHub `build-android-app.yml` with secrets.

### Tutorial 15 — Push changes to GitHub ⚙️

```bash
git status
git add .
git commit -m "My change"
git push origin my-branch
```

Open pull request and wait for checks.

---

## 33. Before/After Code Examples

### Example: Add nav item in `site-shell.js`

**BEFORE**

```js
["Tools", "/tools.html", path => /\/tools(?:-v2|-v2-original)?\.html$/i.test(path)],
["Help", "/contact.html", path => path.endsWith("/contact.html")]
```

**AFTER**

```js
["Tools", "/tools.html", path => /\/tools(?:-v2|-v2-original)?\.html$/i.test(path)],
["Downloads", "/downloads/", path => path.includes("/downloads/")],
["Help", "/contact.html", path => path.endsWith("/contact.html")]
```

Malayalam: `Downloads` menu item all global shell pages-ൽ കാണും. Active logic `/downloads/` path match ചെയ്യും.

### Example: Add Android drawer navigation

**BEFORE**

```java
bindNavigation(R.id.navContact, "/contact.html");
```

**AFTER**

```java
bindNavigation(R.id.navContact, "/contact.html");
bindNavigation(R.id.navDownloads, "/downloads/");
```

Malayalam: XML-ൽ `navDownloads` id ഉള്ള view ഉണ്ടെങ്കിൽ click ചെയ്താൽ WebView `https://polypmna.dpdns.org/downloads/` open ചെയ്യും.

---

## 34. Code Explanation Rules for This Project

When you edit important code:

1. Identify whether it is 🌐 Website, 📱 Android, 🔗 Shared, or ⚙️ Build.
2. Find the exact file path.
3. Read nearby code before changing.
4. Keep naming patterns:
   - Lessons: `lessons-<CODE>.html`
   - Notes: `downloadable-notes-<CODE>.pdf`
   - Android resources: lowercase names like `ic_new.xml`
5. Run syntax/build checks.
6. Commit small focused changes.

---

## 35. Beginner → Advanced Learning Path

### Level 1 — Beginner

- Repository structure: root pages, `assets/`, `lessons/`, `notes/`, `android-app/`.
- Basic `HTML`: headings, links, sections, buttons.
- Basic `CSS`: selectors, variables, page-specific classes.
- Basic `JavaScript`: click events, DOM selection, console errors.
- Basic `Git`: status, add, commit, push.

### Level 2 — Intermediate

- `site-shell.js` navigation/footer system.
- `main.js` global loader flow.
- `subject-browser.js` modes and filters.
- Revision 2026 data JSON + browser rendering.
- Popup and watermark systems.
- Android layout/resources.

### Level 3 — Advanced

- Android `WebView` security and navigation rules.
- Android notifications and Firebase topics.
- Android release signing and versioning.
- Cloudflare Worker Ask POLY AI deployment.
- Supabase migrations and quiz/mock-exam storage.
- GitHub Actions deployment/build workflows.
- Generated data workflows and site quality gate.

---

## Final Quality Checklist

- Actual technologies identified: static HTML/CSS/JS, Java Android WebView, Gradle, Firebase Messaging, Cloudflare Worker, Supabase SQL, PWA files, GitHub Actions.
- Website architecture documented.
- Android architecture documented.
- Shared vs platform-specific changes labelled.
- Navigation, themes, buttons, popup, watermark, notifications, APK build, version update, deployment documented.
- Non-existing features clearly marked: no React/Vue/Angular/Tailwind/Bootstrap, no custom Fragment classes, no JavaScript bridge, no complete dark-mode system.

