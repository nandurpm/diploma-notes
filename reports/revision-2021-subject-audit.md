# Revision 2021 Subject Audit

Version: `20260706-sitttr-complete2`

## Result

- Added `assets/js/rev2021-all-dept-cleanup.js` and loaded it on the Revision 2021 department viewer.
- Applied the suffix-code cleanup to every department page, not only Electrical & Electronics Engineering.
- Corrected the department viewer to map all 43 official Revision 2021 department names explicitly.
- Kept suffix-code subjects as separate cards instead of collapsing them into base codes.
- Removed blindly injected `6007` common Internship cards from department pages.
- Preserved lesson, notes, syllabus, and model-question-paper links with exact suffix codes.

## Global department rule now applied

If a semester section contains suffix-code cards such as `6041A`, `6041B`, or `6041C`, the matching collapsed base-code card such as `6041` is removed from that same semester section.

This is applied across all department pages opened through:

`/revision-2021/department-view.html?dept=...`

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

Full row-level automated scrape of every SITTTR programme page is still marked partial because the SITTTR programme-course endpoint fails when the query order is changed by the fetch layer. The committed site-side fix now applies the suffix-code and common-subject cleanup across all 43 department viewer pages without changing the visual card design.
