#!/usr/bin/env python3
from __future__ import annotations

import html
import json
import re
from collections import defaultdict
from pathlib import Path

DATA = Path("assets/data/revision-2026-subjects.json")
REGISTRY = Path("assets/data/revision-2026-programmes.json")
OUT = Path("revision-2026")
REV2026_CONTENT = Path("revision-2026-content")
REV2026_LESSONS = REV2026_CONTENT / "lessons"
REV2026_NOTES = REV2026_CONTENT / "notes"
SITE = "https://polypmna.dpdns.org"
SOCIAL_IMAGE = SITE + "/assets/media/poly-pmna-study-hub-social-card.png"
SYLLABUS_INDEX = "https://www.sitttrkerala.ac.in/index.php?r=site%2Fdiploma-syllabus&scheme=REV2026"
MODEL_QP_INDEX = "https://sitttrkerala.ac.in/index.php?r=site%2Fdiploma-modelqp&scheme=REV2026"
REPORT_JSON = Path("reports/revision-2026-new-codes-vs-2021.json")
REPORT_MD = Path("reports/revision-2026-new-codes-vs-2021.md")
VERSION = "20260717-site-shell1"
MIN_VALID_PDF_BYTES = 20000


def esc(value: object) -> str:
    return html.escape(str(value), quote=True)


def semester_number(row: dict[str, object]) -> int:
    explicit = row.get("semesterNumber")
    if isinstance(explicit, int) and 1 <= explicit <= 6:
        return explicit
    code = str(row.get("code", "")).strip()
    if code and code[0] in "123456":
        return int(code[0])
    match = re.search(r"\b([1-6])\b", str(row.get("semester", "")))
    if match:
        return int(match.group(1))
    raise ValueError(f"Missing valid semester for {row.get('programme')} {row.get('code')}")


def natural_code_key(code: str) -> tuple[int, str]:
    match = re.match(r"(\d+)(.*)", code)
    return (int(match.group(1)), match.group(2)) if match else (10**9, code)


def lesson_file(code: str) -> Path:
    return REV2026_LESSONS / f"lessons-{code}.html"


def notes_file(code: str) -> Path:
    return REV2026_NOTES / f"downloadable-notes-{code}.pdf"


def valid_notes(code: str) -> bool:
    path = notes_file(code)
    return path.exists() and path.stat().st_size >= MIN_VALID_PDF_BYTES


def head(title: str, description: str, canonical: str, *, directory: bool = False) -> str:
    page_styles = (
        f'<link rel="stylesheet" href="/assets/css/revision-2026-directory.css?v={VERSION}">'
        if directory
        else (
            f'<link rel="stylesheet" href="/assets/css/department-semester-layout.css?v={VERSION}">'
            '<style>html,body{height:auto!important;min-height:100%!important;overflow-y:auto!important;overflow-x:hidden!important}'
            '#subjectGrid{min-height:45vh}.semester-card-grid .subject-card{height:100%}</style>'
        )
    )
    return f'''<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><meta name="description" content="{esc(description)}"><title>{esc(title)}</title><link rel="canonical" href="{esc(canonical)}"><meta property="og:type" content="website"><meta property="og:title" content="{esc(title)}"><meta property="og:description" content="{esc(description)}"><meta property="og:url" content="{esc(canonical)}"><meta property="og:image" content="{SOCIAL_IMAGE}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="POLY PMNA Kerala Polytechnic Study Hub"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="{esc(title)}"><meta name="twitter:description" content="{esc(description)}"><meta name="twitter:image" content="{SOCIAL_IMAGE}"><link rel="stylesheet" href="/assets/css/style.css?v={VERSION}"><link rel="stylesheet" href="/assets/css/animations.css?v={VERSION}"><link rel="stylesheet" href="/assets/css/responsive.css?v={VERSION}"><link rel="stylesheet" href="/assets/css/hardening.css?v={VERSION}"><link rel="stylesheet" href="/assets/css/site-navigation-a11y.css?v={VERSION}"><link rel="stylesheet" href="/assets/css/site-brand.css?v={VERSION}"><link rel="stylesheet" href="/assets/css/portal-layout.css?v={VERSION}"><link rel="stylesheet" href="/assets/css/fixed-site-header.css?v={VERSION}">{page_styles}<script src="/assets/js/site-shell.js?v={VERSION}" defer></script></head>'''


def navigation() -> str:
    return '''<a class="skip-link" href="#main-content">Skip to main content</a><header class="topbar" data-site-header></header>'''


def footer() -> str:
    return f'''<footer class="footer" data-site-footer></footer><script src="/assets/js/main.js?v={VERSION}" defer></script><script src="/assets/js/revision-2026-browser.js?v={VERSION}" defer></script><script src="/assets/js/lesson-availability-hotfix.js?v=20260717-availability-stable1" defer></script><script src="/assets/js/fixed-site-header.js?v={VERSION}" defer></script>'''


def subject_card(programme: dict[str, object], row: dict[str, object]) -> str:
    code = str(row.get("code", "")).strip().upper()
    semester = f"Semester {semester_number(row)}"
    name = str(row.get("name", "")).strip()
    subject_type = str(row.get("type", "Course")).strip() or "Course"
    lesson_url = f"/revision-2026-content/lessons/lessons-{esc(code)}.html"
    notes_url = f"/revision-2026-content/notes/downloadable-notes-{esc(code)}.pdf"
    lesson_ok = lesson_file(code).exists()
    notes_ok = valid_notes(code)
    syllabus_url = str(row.get("syllabusUrl", "")).strip() or (
        "https://www.sitttrkerala.ac.in/index.php?"
        f"r=site%2Fdiploma-syllabus-course-contents&course={code}"
    )
    qp_url = (
        "https://sitttrkerala.ac.in/index.php?"
        f"r=site%2Fdiploma-modelqp-courses-show&course={code}"
    )

    if lesson_ok:
        lesson_action = f'<a class="action lessons" href="{lesson_url}">View Lessons</a>'
        download_href = notes_url if notes_ok else lesson_url + "?autoPrintNotes=1"
        download_attrs = " download" if notes_ok else ' target="_blank" rel="noopener noreferrer"'
        notes_action = f'<a class="action download" href="{download_href}"{download_attrs}>Download Notes</a>'
    else:
        lesson_action = '<span class="availability-label lessons-status" aria-disabled="true">Lessons unavailable</span>'
        notes_action = '<span class="availability-label notes-status" aria-disabled="true">Notes unavailable</span>'

    search_text = " ".join(
        [code, name, str(programme["name"]), semester, subject_type]
    ).casefold()
    return (
        f'<article class="subject-card reveal" data-subject-code="{esc(code)}" '
        f'data-revision="2026" data-semester="{esc(semester)}" '
        f'data-search-text="{esc(search_text)}" data-notes-href="{notes_url}" '
        f'data-lesson-href="{lesson_url}" data-lesson-available="{str(lesson_ok).lower()}" '
        f'data-notes-available="{str(notes_ok).lower()}">'
        f'<div class="subject-top"><span>2026</span><strong>{esc(code)}</strong></div>'
        f'<h3>{esc(name)}</h3>'
        f'<p>{esc(programme["name"])} / {esc(semester)} / {esc(subject_type)}</p>'
        f'<div class="action-row">'
        f'<a class="action syllabus" href="{esc(syllabus_url)}" target="_blank" rel="noopener noreferrer">Open Syllabus</a>'
        f'{lesson_action}{notes_action}'
        f'<a class="action qp" href="{esc(qp_url)}" target="_blank" rel="noopener noreferrer">Sample Question Paper</a>'
        f'</div></article>'
    )


def semester_group(programme: dict[str, object], number: int, rows: list[dict[str, object]]) -> str:
    cards = "".join(subject_card(programme, row) for row in rows)
    count_label = "subject" if len(rows) == 1 else "subjects"
    return (
        f'<section class="semester-subject-section" data-semester-section="Semester {number}" '
        f'style="grid-column:1/-1;display:block;width:100%;min-width:0;margin:0 0 24px">'
        f'<div class="semester-group-heading" style="display:flex;align-items:center;justify-content:space-between;gap:14px;width:100%;min-height:52px;margin:0 0 14px;padding:13px 16px;border:1px solid rgba(29,78,216,.14);border-radius:18px;background:linear-gradient(135deg,rgba(219,234,254,.96),rgba(236,253,245,.96));box-shadow:0 10px 24px rgba(20,45,90,.07)">'
        f'<h3>Semester {number}</h3><span data-semester-count>{len(rows)} {count_label}</span></div>'
        f'<div class="semester-card-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr));gap:18px;align-items:stretch;width:100%">{cards}</div>'
        f'</section>'
    )


def programme_card(programme: dict[str, object]) -> str:
    code = str(programme["officialCode"])
    name = str(programme["name"])
    slug = str(programme["slug"])
    search_text = f"{code} {name} {slug}".casefold()
    return (
        f'<a class="revision-programme-card reveal" role="listitem" '
        f'data-programme-card data-programme-slug="{esc(slug)}" '
        f'data-official-code="{esc(code)}" data-search-text="{esc(search_text)}" '
        f'href="/revision-2026/{esc(slug)}.html">'
        f'<div class="revision-programme-card__top">'
        f'<span class="revision-programme-code">{esc(code)}</span>'
        f'<span class="revision-programme-arrow" aria-hidden="true">→</span>'
        f'</div>'
        f'<div><h2>{esc(name)}</h2><p>Browse Semester 1 to Semester 6 subjects, syllabus and study resources.</p></div>'
        f'<span class="revision-programme-card__meta">Open department</span>'
        f'</a>'
    )


def build_index(programmes: list[dict[str, object]]) -> str:
    cards = "".join(programme_card(programme) for programme in programmes)
    count = len(programmes)
    title = "Revision 2026 Diploma Departments | POLY PMNA"
    description = "Browse all 38 official SITTTR Kerala Revision 2026 programmes with semester-wise subjects, syllabus links, lessons, notes and sample question papers."
    return head(title, description, SITE + "/revision-2026.html", directory=True) + f'''<body class="portal-page revision-2026-directory-page" data-revision="2026">{navigation()}<main id="main-content"><nav class="site-breadcrumbs" aria-label="Breadcrumb"><ol><li><a href="/">Home</a></li><li><span aria-current="page">Revision 2026</span></li></ol></nav><section class="page-title revision-directory-hero reveal"><div class="revision-directory-hero-copy"><p class="kicker">Revision 2026</p><h1>Choose your department</h1><p>Open the official Semester 1 to Semester 6 subject list for any Revision 2026 diploma programme.</p><nav class="revision-directory-switch" aria-label="Choose curriculum revision"><a href="/revision-2021.html">Revision 2021</a><a class="active" aria-current="page" href="/revision-2026.html">Revision 2026</a></nav></div><div class="revision-directory-summary" aria-label="Revision 2026 summary"><div><strong>{count}</strong><span>Departments</span></div><div><strong>6</strong><span>Semesters</span></div><div><strong>2026</strong><span>Current revision</span></div></div></section><section class="revision-directory-shell" aria-labelledby="revisionDirectoryHeading"><div class="revision-directory-head"><div><p class="kicker">Programme Browser</p><h2 id="revisionDirectoryHeading">Find your department</h2></div><p class="revision-directory-results" id="programmeResultCount" aria-live="polite">{count} departments available</p></div><div class="revision-directory-toolbar" role="search"><label class="revision-directory-search-field" for="programmeSearch"><span aria-hidden="true">⌕</span><span class="sr-only">Search departments</span><input id="programmeSearch" type="search" placeholder="Search department name or code" autocomplete="off" aria-controls="departmentCards" aria-describedby="programmeResultCount"></label><button class="revision-directory-clear" id="programmeSearchClear" type="button" hidden>Clear</button></div><div class="revision-directory-grid" id="departmentCards" role="list">{cards}</div><div class="revision-directory-empty" id="programmeEmptyState" hidden><strong>No department matches that search.</strong><p>Check the spelling or search using the official department code.</p><button class="revision-directory-clear" id="programmeEmptyClear" type="button">Clear search</button></div></section><section class="section notice revision-directory-source" id="rev2026-model-qp-access"><div class="revision-directory-source-copy"><strong>Official SITTTR Revision 2026 sources</strong><p>Use the official syllabus and sample-question-paper pages to verify published curriculum information.</p></div><div class="revision-directory-source-actions"><a class="btn ghost" href="{SYLLABUS_INDEX}" target="_blank" rel="noopener noreferrer">Open official syllabus</a><a class="btn primary" href="{MODEL_QP_INDEX}" target="_blank" rel="noopener noreferrer">Open sample papers</a></div></section></main>{footer()}</body></html>\n'''


def build_department_page(programme: dict[str, object], rows: list[dict[str, object]]) -> str:
    groups: list[str] = []
    for number in range(1, 7):
        semester_rows = [row for row in rows if semester_number(row) == number]
        semester_rows.sort(
            key=lambda row: (
                natural_code_key(str(row.get("code", ""))),
                str(row.get("name", "")).casefold(),
            )
        )
        groups.append(semester_group(programme, number, semester_rows))

    name = str(programme["name"])
    slug = str(programme["slug"])
    title = f"{name} Revision 2026 Subjects | POLY PMNA"
    description = f"Browse {name} Revision 2026 subjects by semester with syllabus, dedicated lessons, notes and sample question-paper actions."
    return head(title, description, f"{SITE}/revision-2026/{slug}.html") + f'''<body class="portal-page" data-revision="2026" data-programme-slug="{esc(slug)}" data-programme-name="{esc(name)}">{navigation()}<main id="main-content"><nav class="site-breadcrumbs" aria-label="Breadcrumb"><ol><li><a href="/">Home</a></li><li><a href="/revision-2026.html">Revision 2026</a></li><li><span aria-current="page">{esc(name)}</span></li></ol></nav><section class="page-title reveal"><p class="kicker">Revision 2026</p><h1>{esc(name)}</h1><p>Semester 1 to Semester 6 subject cards from the SITTTR Revision 2026 scheme data.</p></section><section class="section notice" id="rev2026-model-qp-access"><strong>Official Revision 2026 sample question papers:</strong> <a class="btn ghost" href="{MODEL_QP_INDEX}" target="_blank" rel="noopener noreferrer">Open all REV2026 sample papers</a></section><section class="section compact" id="subject-browser"><div class="section-heading inline-heading"><div><p class="kicker">Subject Browser</p><h2>Find the right subject quickly</h2></div><p>Revision 2026 lessons and notes are loaded only from the dedicated 2026 content folders.</p></div><div class="filters department-subject-filters"><label class="sr-only" for="subjectSearch">Search subjects in this department</label><input id="subjectSearch" type="search" placeholder="Search subject code or title" autocomplete="off"><label class="sr-only" for="semesterFilter">Select semester</label><select id="semesterFilter"><option value="all">All semesters</option><option value="Semester 1">Semester 1</option><option value="Semester 2">Semester 2</option><option value="Semester 3">Semester 3</option><option value="Semester 4">Semester 4</option><option value="Semester 5">Semester 5</option><option value="Semester 6">Semester 6</option></select></div><div class="subject-grid" id="subjectGrid" data-mode="department" data-revision="2026" data-static-rev2026="true">{"".join(groups)}</div><div class="empty-state" id="subjectEmptyState" hidden>No subjects found. Try a different search or semester.</div></section></main>{footer()}</body></html>\n'''


def revision_2021_codes() -> set[str]:
    codes: set[str] = set()
    for path in [Path("assets/js/subjects.js"), Path("assets/js/sitttr-rev2021-browser.js")]:
        if not path.exists():
            continue
        text = path.read_text(encoding="utf-8", errors="ignore")
        codes.update(
            match.upper()
            for match in re.findall(r'["\']([1-6]\d{3,4}[A-Z]?)["\']', text, re.I)
        )
    if not codes:
        raise SystemExit("Could not extract Revision 2021 subject codes")
    return codes


def write_new_code_report(subjects: list[dict[str, object]]) -> dict[str, object]:
    codes_2021 = revision_2021_codes()
    by_code: dict[str, list[dict[str, object]]] = defaultdict(list)
    for row in subjects:
        code = str(row.get("code", "")).strip().upper()
        if code:
            by_code[code].append(row)

    new_codes = sorted(set(by_code) - codes_2021, key=natural_code_key)
    details = []
    for code in new_codes:
        rows = by_code[code]
        details.append(
            {
                "code": code,
                "subjects": sorted({str(row.get("name", "")) for row in rows}),
                "semesters": sorted({f"Semester {semester_number(row)}" for row in rows}),
                "programmes": sorted({str(row.get("programme", "")) for row in rows}),
            }
        )

    payload = {
        "comparison": "REV2026 dataset versus the current POLY PMNA REV2021 catalogue",
        "revision2021UniqueCodeCount": len(codes_2021),
        "revision2026UniqueCodeCount": len(by_code),
        "newCodeCount": len(new_codes),
        "newCodes": new_codes,
        "newCodeDetails": details,
        "limitation": "The REV2021 repository catalogue is not fully certified for every official programme row.",
    }
    REPORT_JSON.parent.mkdir(exist_ok=True)
    REPORT_JSON.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    lines = [
        "# Revision 2026 new subject codes compared with Revision 2021",
        "",
        f"- REV2021 unique codes in repository catalogue: **{len(codes_2021)}**",
        f"- REV2026 unique codes: **{len(by_code)}**",
        f"- Codes in REV2026 but absent from the current REV2021 catalogue: **{len(new_codes)}**",
        "",
        "> Limitation: the REV2021 repository catalogue is not fully certified for every official programme row.",
        "",
        "## New codes",
        "",
    ]
    for item in details:
        lines.append(
            f'- **{item["code"]}** — {"; ".join(item["subjects"])} — '
            f'{", ".join(item["semesters"])} — {", ".join(item["programmes"])}'
        )
    REPORT_MD.write_text("\n".join(lines) + "\n", encoding="utf-8")
    return payload


def main() -> None:
    programmes = json.loads(REGISTRY.read_text(encoding="utf-8"))["programmes"]
    subjects = json.loads(DATA.read_text(encoding="utf-8"))["subjects"]
    if len(programmes) != 38:
        raise SystemExit("Expected 38 programmes")

    by_programme: dict[str, list[dict[str, object]]] = defaultdict(list)
    for row in subjects:
        slug = str(row.get("programmeSlug", ""))
        if slug:
            semester_number(row)
            by_programme[slug].append(row)

    missing = [str(p["slug"]) for p in programmes if not by_programme[str(p["slug"])]]
    if missing:
        raise SystemExit("Empty programme data: " + ", ".join(missing))

    OUT.mkdir(exist_ok=True)
    REV2026_LESSONS.mkdir(parents=True, exist_ok=True)
    REV2026_NOTES.mkdir(parents=True, exist_ok=True)
    Path("revision-2026.html").write_text(build_index(programmes), encoding="utf-8")
    counts: dict[str, int] = {}
    semester_counts: dict[str, dict[str, int]] = {}
    for programme in programmes:
        slug = str(programme["slug"])
        rows = sorted(
            by_programme[slug],
            key=lambda row: (
                semester_number(row),
                natural_code_key(str(row.get("code", ""))),
                str(row.get("name", "")).casefold(),
            ),
        )
        counts[slug] = len(rows)
        semester_counts[slug] = {
            f"Semester {number}": sum(1 for row in rows if semester_number(row) == number)
            for number in range(1, 7)
        }
        (OUT / f"{slug}.html").write_text(
            build_department_page(programme, rows), encoding="utf-8"
        )

    comparison = write_new_code_report(subjects)
    Path("reports/revision-2026-build-summary.json").write_text(
        json.dumps(
            {
                "scheme": "REV2026",
                "programmeCount": 38,
                "subjectCount": len(subjects),
                "staticPageCount": 38,
                "directoryLayout": "Responsive searchable programme directory",
                "departmentLayout": "Revision 2021-compatible semester subject cards",
                "lessonFolder": "revision-2026-content/lessons",
                "notesFolder": "revision-2026-content/notes",
                "programmeSubjectCounts": counts,
                "programmeSemesterCounts": semester_counts,
                "newCodeCountComparedWithREV2021": comparison["newCodeCount"],
            },
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )
    print(
        f"Built a responsive REV2026 directory and 38 department pages from {len(subjects)} records; "
        f"new codes versus REV2021={comparison['newCodeCount']}"
    )


if __name__ == "__main__":
    main()
