# Repository Guardian's Journal

## 2026-08-06 - Revision 2026 Program Count Expansion
**Finding:** SITTTR Kerala Revision 2026 scheme was updated to add 4 new departments (CO, CZ, ES, MA) bringing the total official departments/programmes from 38 to 42. However, the static site structure verification tool (`tools/validate_site_structure.py`) was still hardcoded to assert exactly 38 programme cards.
**Learning:** Hardcoded numeric assertions in site structure validation tests will break CI and automated pipelines whenever new curriculums, courses, or departments are officially introduced. It is important to keep validation limits in sync with the registry databases (`assets/data/revision-2026-programmes.json`).
**Prevention:** Always verify if any automated validation or regression tools are asserting specific program/department/lesson totals, and keep them synchronized with the database.
