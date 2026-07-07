# Revision 2021 Subject Audit

Version: `20260706-sitttr-complete1`

## Result in this commit

- Added a dedicated Revision 2021 department subject renderer: `assets/js/sitttr-rev2021-browser.js`.
- Corrected the department viewer to map all 43 official Revision 2021 department names explicitly.
- Fixed the confirmed Electrical & Electronics Engineering Semester 6 missing suffix-code subjects.
- Added separate subject cards for `6041A`, `6041B`, and `6041C` where applicable.
- Syllabus, model question paper, lesson HTML, and notes PDF paths keep suffix letters instead of collapsing them.

## Electrical & Electronics Engineering – Semester 6

| Check | Result |
|---|---|
| Required code count | 15 |
| Website count after fix | 15 |
| Missing confirmed suffix subjects | None |
| Legacy collapsed rows blocked | `6031`, `6032`, `6036`, `6039`, `6007` |
| Suffix-code check | PASS |

Required visible codes:

`6001`, `6031A`, `6031C`, `6031D`, `6032A`, `6032B`, `6032C`, `6032D`, `6002`, `6037`, `6038`, `6039A`, `6039B`, `6039C`, `6009`

## Important limitation

Full row-level automated scrape of every SITTTR programme page is marked partial because the SITTTR programme-page endpoint fails when query parameters are reordered. The committed browser fix now handles the confirmed broken subject groups and all 43 department names without changing the visual card design.
