# Lesson UCS / Theme Audit

Repository: `nandurpm/diploma-notes`

Audit target: lesson HTML files listed in `assets/js/asset-manifest.js`.

Reference style: `lessons/lessons-1003.html` and `lessons/lessons-1004.html`.

## Audit criteria

A lesson is treated as following the required UCS/theme only if it uses, or is close to, the reference lesson shell:

- compact sticky top selector/header;
- button/tab based section switching, or equivalent panel switching;
- no browser-back stacking from repeated module/section clicks;
- wide/full-screen handbook layout;
- printable/PDF-friendly behavior;
- shared runtime support through `assets/js/lesson-navigation-fix.js`.

Content depth was not checked in this audit because the requested scope was style/theme only.

## Site-wide UCS enforcement completed

`assets/js/lesson-navigation-fix.js` now applies the recently updated lesson theme across old and new lesson HTML pages.

It normalizes:

- body background and typography;
- compact sticky lesson selector/header;
- legacy headers such as `.bar`, `.top`, `.nav`, `.logo`, `.code`, `.code-badge`, `.course-code`;
- tab selectors such as `.tabs`, `.tabstrip`, `.tab-btn`, `.view-btn`, `.hb-tabs`;
- handbook containers such as `.hero`, `.section`, `.sec`, `.card`, `.topic-card`, `.panel`, `.view-section`, `.hb-section`;
- tables, formula boxes, diagrams, module banners, callouts and Malayalam blocks;
- print/PDF mode so hidden panels/details are visible.

This applies the common UCS/theme at runtime without rewriting lesson educational content.

## Native / close UCS lesson HTML files

These files already use a native or close button/tab-style lesson shell:

- `lessons/lessons-1003.html`
- `lessons/lessons-1004.html`
- `lessons/lessons-1006.html`
- `lessons/lessons-2006.html`
- `lessons/lessons-2021.html`
- `lessons/lessons-2022.html`
- `lessons/lessons-2028.html`
- `lessons/lessons-2029.html`
- `lessons/lessons-2038.html`
- `lessons/lessons-3031.html`
- `lessons/lessons-3041.html`
- `lessons/lessons-3045.html`
- `lessons/lessons-3046.html`
- `lessons/lessons-3047.html`
- `lessons/lessons-4022.html`
- `lessons/lessons-4023.html`
- `lessons/lessons-6031A.html`
- `lessons/lessons-6031C.html`
- `lessons/lessons-6031D.html`
- `lessons/lessons-6032A.html`
- `lessons/lessons-6032B.html`
- `lessons/lessons-6032C.html`
- `lessons/lessons-6041C.html`

## Lesson HTML files still not natively built in the 1003 / 1004 shell

These pages are now visually normalized by the shared UCS runtime enforcer, but their own source HTML is still legacy/alternate structure. Convert them later only if exact native source structure is required:

- `lessons/lessons-1001.html`
- `lessons/lessons-1002.html`
- `lessons/lessons-1005.html`
- `lessons/lessons-1007.html`
- `lessons/lessons-1008.html`
- `lessons/lessons-2001.html`
- `lessons/lessons-2002.html`
- `lessons/lessons-2003.html`
- `lessons/lessons-2031.html`
- `lessons/lessons-2032.html`
- `lessons/lessons-2039.html`
- `lessons/lessons-2041.html`
- `lessons/lessons-2049.html`
- `lessons/lessons-3021.html`
- `lessons/lessons-3022.html`
- `lessons/lessons-3023.html`
- `lessons/lessons-3024.html`
- `lessons/lessons-3025.html`
- `lessons/lessons-3032.html`
- `lessons/lessons-3042.html`
- `lessons/lessons-3043.html`
- `lessons/lessons-3044.html`
- `lessons/lessons-3048.html`
- `lessons/lessons-3049.html`
- `lessons/lessons-3132.html`
- `lessons/lessons-4001.html`
- `lessons/lessons-4021.html`
- `lessons/lessons-4024.html`
- `lessons/lessons-4031.html`
- `lessons/lessons-4041.html`
- `lessons/lessons-4042.html`
- `lessons/lessons-4043.html`
- `lessons/lessons-4101.html`
- `lessons/lessons-4102.html`
- `lessons/lessons-4103.html`
- `lessons/lessons-5031.html`
- `lessons/lessons-5032.html`
- `lessons/lessons-5041.html`
- `lessons/lessons-5042.html`
- `lessons/lessons-5043.html`
- `lessons/lessons-5043A.html`
- `lessons/lessons-6001.html`
- `lessons/lessons-6002.html`
- `lessons/lessons-6007.html`
- `lessons/lessons-6009.html`
- `lessons/lessons-6041.html`
- `lessons/lessons-6041A.html`
- `lessons/lessons-6041B.html`
- `lessons/lessons-6042A.html`
- `lessons/lessons-6042B.html`
- `lessons/lessons-6042C.html`
- `lessons/lessons-6042D.html`
- `lessons/lessons-6061A.html`
- `lessons/lessons-6061B.html`
- `lessons/lessons-6061C.html`
- `lessons/lessons-6062A.html`
- `lessons/lessons-6062B.html`
- `lessons/lessons-6067.html`
- `lessons/lessons-6068.html`
- `lessons/lessons-6069.html`

## Separate issue fixed

`lessons/lessons-6041C.html` is no longer an iframe wrapper. It is now a standalone, PDF-readable lesson source with visible sections for overview, syllabus map, modules, formula/rule bank, practice, model paper and answer guide.

This fixes the earlier build failure cause where the PDF builder saw only a short wrapper text instead of lesson content.

## PDF notes published

`notes/downloadable-notes-6041C.pdf` has now been added as the published PDF notes file for course `6041C`.

`assets/js/asset-manifest.js` includes `6041C` in `notesCodes`, so subject-browser Download Notes can resolve the real PDF instead of relying only on the print fallback.
