# REV2026 First Ten Programme Validation Report

- Generated: 2026-07-28T13:21:49.579871+00:00
- Official reference: https://www.sitttrkerala.ac.in/index.php?r=site%2Fdiploma-syllabus&scheme=REV2026
- Scope: first ten REV2026 diploma programmes only, in official SITTTR index order.
- Repository files audited: `assets/data/revision-2026-programmes.json`, `assets/data/revision-2026-subjects.json`, and corresponding pages under `revision-2026/`.

## Official first ten programmes

| Order | Code | Programme | Repository slug | Subject rows | Semesters present |
|---:|---|---|---|---:|---|
| 1 | AR | Architecture | `architecture` | 56 | Semester 1: 6, Semester 2: 9, Semester 3: 9, Semester 4: 8, Semester 5: 12, Semester 6: 12 |
| 2 | AI | Artificial Intelligence | `artificial-intelligence` | 67 | Semester 1: 6, Semester 2: 9, Semester 3: 9, Semester 4: 9, Semester 5: 16, Semester 6: 18 |
| 3 | AM | Artificial Intelligence & Machine Learning | `artificial-intelligence-and-machine-learning` | 63 | Semester 1: 6, Semester 2: 9, Semester 3: 9, Semester 4: 9, Semester 5: 14, Semester 6: 16 |
| 4 | RA | Automation and Robotics | `automation-and-robotics` | 65 | Semester 1: 6, Semester 2: 9, Semester 3: 9, Semester 4: 9, Semester 5: 14, Semester 6: 18 |
| 5 | AU | Automobile Engineering | `automobile-engineering` | 66 | Semester 1: 6, Semester 2: 9, Semester 3: 8, Semester 4: 9, Semester 5: 16, Semester 6: 18 |
| 6 | BM | Biomedical Engineering | `biomedical-engineering` | 63 | Semester 1: 6, Semester 2: 9, Semester 3: 9, Semester 4: 9, Semester 5: 14, Semester 6: 16 |
| 7 | CH | Chemical Engineering | `chemical-engineering` | 61 | Semester 1: 5, Semester 2: 10, Semester 3: 9, Semester 4: 9, Semester 5: 13, Semester 6: 15 |
| 8 | CV | Civil & Environmental Engineering | `civil-and-environmental-engineering` | 63 | Semester 1: 6, Semester 2: 9, Semester 3: 9, Semester 4: 9, Semester 5: 14, Semester 6: 16 |
| 9 | CR | Civil & Rural Engineering | `civil-and-rural-engineering` | 63 | Semester 1: 6, Semester 2: 9, Semester 3: 9, Semester 4: 9, Semester 5: 14, Semester 6: 16 |
| 10 | CE | Civil Engineering | `civil-engineering` | 63 | Semester 1: 6, Semester 2: 9, Semester 3: 9, Semester 4: 9, Semester 5: 14, Semester 6: 16 |

## Field coverage audit

| Field requested | Repository status |
|---|---|
| Subject Code | Present as `code` in subject records and rendered as `data-subject-code` / card code. |
| Subject Name | Present as `name` in subject records and rendered in cards. |
| Theory/Practical | Partially present as `type`; values include Course, Theory, Lab, Practical, Workshop, Drawing, Project, Seminar, Internship, and Elective. |
| Credits | Not currently stored in the REV2026 subject catalogue. |
| Hours | Not currently stored in the REV2026 subject catalogue. |
| Internal Marks | Not currently stored in the REV2026 subject catalogue. |
| External Marks | Not currently stored in the REV2026 subject catalogue. |
| Total Marks | Not currently stored in the REV2026 subject catalogue. |

## Validation result

- All first-ten programme records are present in the repository in the same order as the official SITTTR REV2026 index.
- Every audited first-ten programme has Semester 1 through Semester 6 represented in the repository catalogue.
- No subject code/name/type corrections were made because this pass did not identify a concrete mismatch in the fields currently stored by the repository.
- Credits, hours, and mark-split fields could not be corrected in-place because they are not represented in the current REV2026 catalogue schema; adding them would require a separate schema/data-model change beyond a mismatch correction.

## Per-programme audit notes

### 1. Architecture (AR)

| Semester | Subjects audited | Codes checked |
|---|---:|---|
| Semester 1 | 6 | 1001, 1002, 1008, 1009, 1181, 1182 |
| Semester 2 | 9 | 2001A, 2002A, 2003A, 2005, 2009A, 2182, 2183, 2187, 2188 |
| Semester 3 | 9 | 3001, 3009, 3181, 3182, 3183, 3184, 3187, 3188, 3189 |
| Semester 4 | 8 | 4001, 4002, 4009C, 4181, 4182, 4183, 4188, 4189 |
| Semester 5 | 12 | 5007, 5008, 5009, 5011, 5181, 5182, 5183A, 5183B, 5183C, 5183D, 5187, 5188 |
| Semester 6 | 12 | 6007, 6009, 6181, 6182P, 6182T, 6183A, 6183B, 6183C, 6184A, 6184B, 6188, 6189 |

### 2. Artificial Intelligence (AI)

| Semester | Subjects audited | Codes checked |
|---|---:|---|
| Semester 1 | 6 | 1001, 1002, 1004, 1008, 1009, 1131 |
| Semester 2 | 9 | 2001C, 2002B, 2003A, 2005, 2009B, 2131, 2132, 2138, 2139 |
| Semester 3 | 9 | 3001, 3009, 3381, 3382, 3383, 3384, 3387, 3388, 3389 |
| Semester 4 | 9 | 4001, 4002, 4009B, 4131, 4137, 4139, 4381, 4382, 4389 |
| Semester 5 | 16 | 5007, 5008, 5009, 5131, 5381, 5382, 5383A, 5383B, 5383C, 5383D, 5387, 5388, 5389A, 5389B, 5389C, 5389D |
| Semester 6 | 18 | 6007, 6009, 6133A, 6134D, 6381P, 6381T, 6382, 6383B, 6383C, 6383D, 6384A, 6384B, 6384C, 6388, 6389A, 6389B, 6389C, 6389D |

### 3. Artificial Intelligence & Machine Learning (AM)

| Semester | Subjects audited | Codes checked |
|---|---:|---|
| Semester 1 | 6 | 1001, 1002, 1004, 1008, 1009, 1131 |
| Semester 2 | 9 | 2001C, 2002B, 2003A, 2005, 2009B, 2131, 2132, 2138, 2139 |
| Semester 3 | 9 | 3001, 3009, 3309, 3341, 3342, 3343, 3349, 3381, 3388 |
| Semester 4 | 9 | 4001, 4002, 4009B, 4341, 4342, 4343, 4348, 4349, 4389 |
| Semester 5 | 14 | 5007, 5008, 5009, 5131, 5303C, 5341, 5342A, 5342B, 5348, 5349A, 5349B, 5381, 5383C, 5387 |
| Semester 6 | 16 | 6007, 6009, 6131P, 6131T, 6139D, 6341, 6342A, 6342B, 6342C, 6342D, 6343A, 6343B, 6348, 6349A, 6383D, 6384C |

### 4. Automation and Robotics (RA)

| Semester | Subjects audited | Codes checked |
|---|---:|---|
| Semester 1 | 6 | 1001, 1002, 1004, 1008, 1009, 1131 |
| Semester 2 | 9 | 2001C, 2002B, 2003A, 2005, 2009B, 2131, 2138, 2331, 2339 |
| Semester 3 | 9 | 3001, 3009, 3331, 3332, 3333, 3334, 3337, 3338, 3339 |
| Semester 4 | 9 | 4001, 4002, 4009B, 4331, 4332, 4333, 4337, 4338, 4339 |
| Semester 5 | 14 | 5007, 5008, 5009, 5131, 5331, 5332, 5333A, 5333B, 5333C, 5337, 5338, 5339A, 5339B, 5383C |
| Semester 6 | 18 | 6007, 6009, 6331P, 6331T, 6332, 6333A, 6333B, 6333C, 6333D, 6334A, 6334B, 6334C, 6334D, 6338, 6339A, 6339B, 6339C, 6339D |

### 5. Automobile Engineering (AU)

| Semester | Subjects audited | Codes checked |
|---|---:|---|
| Semester 1 | 6 | 1001, 1002, 1003, 1008, 1009, 1051 |
| Semester 2 | 9 | 2001A, 2002A, 2003A, 2005, 2009A, 2051, 2052, 2058, 2059 |
| Semester 3 | 8 | 3001, 3009, 3051, 3052, 3053, 3054, 3058, 3059 |
| Semester 4 | 9 | 4001, 4002, 4009A, 4027, 4051, 4052, 4053, 4058, 4059 |
| Semester 5 | 16 | 5007, 5008, 5009, 5021, 5051, 5052, 5053A, 5053B, 5053C, 5053D, 5057, 5058, 5059A, 5059B, 5059C, 5059D |
| Semester 6 | 18 | 6007, 6009, 6051P, 6051T, 6052, 6053A, 6053B, 6053C, 6053D, 6054A, 6054B, 6054C, 6054D, 6058, 6059A, 6059B, 6059C, 6059D |

### 6. Biomedical Engineering (BM)

| Semester | Subjects audited | Codes checked |
|---|---:|---|
| Semester 1 | 6 | 1001, 1002, 1004, 1008, 1009, 1041 |
| Semester 2 | 9 | 2001B, 2002B, 2003A, 2005, 2009B, 2041, 2042, 2048, 2049 |
| Semester 3 | 9 | 3001, 3009, 3042, 3044, 3047, 3048, 3241, 3242, 3249 |
| Semester 4 | 9 | 4001, 4002, 4009A, 4042, 4043, 4048, 4241, 4248, 4249 |
| Semester 5 | 14 | 5007, 5008, 5009, 5021, 5043D, 5241, 5242, 5243A, 5243B, 5243C, 5248, 5249A, 5249B, 5347 |
| Semester 6 | 16 | 6007, 6009, 6042, 6048, 6241P, 6241T, 6242, 6243A, 6243B, 6243C, 6244A, 6244B, 6244C, 6244D, 6248, 6249B |

### 7. Chemical Engineering (CH)

| Semester | Subjects audited | Codes checked |
|---|---:|---|
| Semester 1 | 5 | 1001, 1002, 1003, 1008, 1009 |
| Semester 2 | 10 | 2001D, 2002A, 2003B, 2005, 2009A, 2071, 2072, 2073, 2078, 2079 |
| Semester 3 | 9 | 3001, 3009, 3071, 3072, 3073, 3074, 3077, 3078, 3079 |
| Semester 4 | 9 | 4001, 4002, 4009D, 4071, 4072, 4073, 4074, 4078, 4079 |
| Semester 5 | 13 | 5007, 5008, 5009, 5021, 5071, 5072, 5073A, 5073B, 5073C, 5073D, 5077, 5078, 5079A |
| Semester 6 | 15 | 6007, 6009, 6071P, 6071T, 6072, 6073A, 6073B, 6073C, 6073D, 6074A, 6074B, 6074C, 6074D, 6078, 6079A |

### 8. Civil & Environmental Engineering (CV)

| Semester | Subjects audited | Codes checked |
|---|---:|---|
| Semester 1 | 6 | 1001, 1002, 1003, 1008, 1009, 1011 |
| Semester 2 | 9 | 2001A, 2002A, 2003A, 2005, 2009A, 2011, 2012, 2018, 2019 |
| Semester 3 | 9 | 3001, 3009, 3011, 3012, 3013, 3014, 3018, 3019, 3359 |
| Semester 4 | 9 | 4001, 4002, 4009C, 4011, 4012, 4017, 4018, 4019, 4351 |
| Semester 5 | 14 | 5007, 5008, 5009, 5011, 5012, 5013, 5014A, 5014C, 5014D, 5017, 5018, 5019A, 5351A, 5359A |
| Semester 6 | 16 | 6007, 6009, 6012, 6013C, 6013D, 6014A, 6014B, 6014C, 6014D, 6018, 6019A, 6019B, 6351A, 6351B, 6391P, 6391T |

### 9. Civil & Rural Engineering (CR)

| Semester | Subjects audited | Codes checked |
|---|---:|---|
| Semester 1 | 6 | 1001, 1002, 1003, 1008, 1009, 1011 |
| Semester 2 | 9 | 2001A, 2002A, 2003A, 2005, 2009A, 2011, 2012, 2018, 2019 |
| Semester 3 | 9 | 3001, 3009, 3011, 3012, 3013, 3014, 3017, 3018, 3019 |
| Semester 4 | 9 | 4001, 4002, 4009C, 4011, 4012, 4017, 4018, 4019, 4361 |
| Semester 5 | 14 | 5007, 5008, 5009, 5011, 5012, 5013, 5014A, 5014C, 5014D, 5017, 5018, 5019A, 5361A, 5399A |
| Semester 6 | 16 | 6007, 6009, 6012, 6013C, 6013D, 6014A, 6014B, 6014C, 6014D, 6018, 6019A, 6019B, 6361A, 6361B, 6391P, 6391T |

### 10. Civil Engineering (CE)

| Semester | Subjects audited | Codes checked |
|---|---:|---|
| Semester 1 | 6 | 1001, 1002, 1003, 1008, 1009, 1011 |
| Semester 2 | 9 | 2001A, 2002A, 2003A, 2005, 2009A, 2011, 2012, 2018, 2019 |
| Semester 3 | 9 | 3001, 3009, 3011, 3012, 3013, 3014, 3017, 3018, 3019 |
| Semester 4 | 9 | 4001, 4002, 4009C, 4011, 4012, 4013, 4017, 4018, 4019 |
| Semester 5 | 14 | 5007, 5008, 5009, 5011, 5012, 5013, 5014A, 5014B, 5014C, 5014D, 5017, 5018, 5019A, 5019B |
| Semester 6 | 16 | 6007, 6009, 6011P, 6011T, 6012, 6013A, 6013B, 6013C, 6013D, 6014A, 6014B, 6014C, 6014D, 6018, 6019A, 6019B |

