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

## Site-wide enforcement added

`assets/js/lesson-navigation-fix.js` now also normalizes legacy lesson headers using selectors such as `.bar`, `.nav`, `.logo`, `.tabstrip`, `.tab-btn`, `.pdf-link`, `.printbtn`, `.code-badge`, and `.course-code`.

This means older lesson pages get a closer common UCS appearance at runtime without rewriting their educational content.

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

## Lesson HTML files not natively following the 1003 / 1004 UCS shell

These pages are usable, and the shared runtime enforcer now improves their header/theme, but their own HTML is still legacy/alternate style and should be converted later if exact 1003/1004 native structure is required:

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
- `lessons/lessons-6041C.html`
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

## Important separate issue

This is not a theme issue, but `reports/lesson-notes-pdf-build.json` reports that PDF generation failed for `6041C` because prepared lesson text was unexpectedly short. That page needs separate PDF/content-source correction.

## Recommended next step

Do not rewrite all pages blindly. Use the shared UCS enforcer for immediate visual consistency, then convert the listed legacy files one batch at a time into the native 1003/1004 shell so risk is controlled.
