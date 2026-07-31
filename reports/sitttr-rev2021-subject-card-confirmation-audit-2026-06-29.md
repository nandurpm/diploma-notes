# SITTTR REV2021 Subject Card Confirmation Audit

Date: 2026-06-29
Repository: `nandurpm/diploma-notes`
Scope: Revision 2021 department subject cards.

## Verdict

**Not fully confirmed.**

The repo has department pages and subject-card data for all 43 SITTTR REV2021 programme names, but every subject code/title in every department is not yet certified against the official SITTTR course list.

## Official source status

The official SITTTR REV2021 programme page lists 43 programme schemes. During this audit, the department course-list pages returned server errors through the browser audit tool. Because of that, complete subject-level verification for all 43 departments is blocked until the official course-list pages are readable.

## Repo-side coverage

Current repo integrity data shows:

- Total departments in subject data: `43`
- Missing department pages: `[]`
- Department pages with no subjects: `[]`

This proves department-page coverage, but it does not prove subject-code correctness.

## High-risk findings

1. `Civil (Public Health and Environment) Engineering` has only `4` department-specific subject records. This is incomplete.
2. `Electrical Engineering` has only `4` department-specific subject records. This is incomplete.
3. `Electronics Engineering` has a browser-render correction layer, but the base `assets/js/subjects.js` still contains the old raw entries.

## Department-wise count audit

| No. | Department | Count | Status |
|---:|---|---:|---|
| 1 | Architecture | 40 | Covered, not fully certified |
| 2 | Artificial Intelligence | 44 | Covered, not fully certified |
| 3 | Artificial Intelligence & Machine Learning | 44 | Covered, not fully certified |
| 4 | Automation and Robotics | 44 | Covered, not fully certified |
| 5 | Automobile Engineering | 44 | Covered, not fully certified |
| 6 | Biomedical Engineering | 43 | Covered, not fully certified |
| 7 | Chemical Engineering | 40 | Covered, not fully certified |
| 8 | Civil & Environmental Engineering | 40 | Covered, not fully certified |
| 9 | Civil & Rural Engineering | 40 | Covered, not fully certified |
| 10 | Civil (Public Health and Environment) Engineering | 4 | Incomplete |
| 11 | Civil Engineering | 40 | Covered, not fully certified |
| 12 | Civil Engineering & Planning | 40 | Covered, not fully certified |
| 13 | Cloud Computing and Big Data | 45 | Covered, not fully certified |
| 14 | Commercial Practice | 46 | Covered, not fully certified |
| 15 | Communication & Computer Networking | 45 | Covered, not fully certified |
| 16 | Computer Application & Business Management | 53 | Covered, not fully certified |
| 17 | Computer Engineering | 45 | Covered, not fully certified |
| 18 | Computer Hardware Engineering | 45 | Covered, not fully certified |
| 19 | Computer Science & Engineering | 45 | Covered, not fully certified |
| 20 | Cyber Forensics and Information Security | 45 | Covered, not fully certified |
| 21 | Electrical and Electronics Engineering | 28 | Covered, name differs from official ampersand form |
| 22 | Electrical Engineering | 4 | Incomplete |
| 23 | Electrical Engineering & Electric Vehicles Technology | 44 | Covered, not fully certified |
| 24 | Electronics and Communication | 45 | Covered, not fully certified |
| 25 | Electronics and Computer Engineering | 45 | Covered, not fully certified |
| 26 | Electronics Engineering | 27 raw plus render corrections | Partially patched |
| 27 | Fire Technology and Safety | 41 | Covered, not fully certified |
| 28 | Food Processing Technology | 40 | Covered, not fully certified |
| 29 | Hotel Management and Catering Technology | 53 | Covered, not fully certified |
| 30 | Information Technology | 45 | Covered, not fully certified |
| 31 | Instrumentation Engineering | 42 | Covered, not fully certified |
| 32 | Integrated Circuit Design & Fabrication | 41 | Covered, not fully certified |
| 33 | Manufacturing Technology | 40 | Covered, not fully certified |
| 34 | Mechanical Engineering | 41 | Covered, not fully certified |
| 35 | Mechatronics | 43 | Covered, not fully certified |
| 36 | Micro Electronics | 44 | Covered, not fully certified |
| 37 | Polymer Technology | 40 | Covered, not fully certified |
| 38 | Printing Technology | 44 | Covered, not fully certified |
| 39 | Renewable Energy | 45 | Covered, not fully certified |
| 40 | Robotic Process Automation | 44 | Covered, not fully certified |
| 41 | Textile Technology | 39 | Covered, not fully certified |
| 42 | Tool & Die Engineering | 41 | Covered, not fully certified |
| 43 | Wood and Paper Technology | 40 | Covered, not fully certified |

## Required next corrections

1. Rebuild `Civil (Public Health and Environment) Engineering` subject cards from the official SITTTR source.
2. Rebuild `Electrical Engineering` subject cards from the official SITTTR source.
3. Move Electronics Engineering corrections into canonical `assets/js/subjects.js` after final verification.
4. Recheck A/B/C/D elective variants department-wise.
5. Rerun the integrity report after correction.

## Conclusion

The audit result is **failed / incomplete**. The website is department-page complete, but it is not yet fully SITTTR subject-card confirmed.
