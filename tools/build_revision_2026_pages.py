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
SITE = "https://polypmna.dpdns.org"
IMAGE = SITE + "/assets/media/poly-pmna-study-hub-social-card.png"
REPORT_JSON = Path("reports/revision-2026-new-codes-vs-2021.json")
REPORT_MD = Path("reports/revision-2026-new-codes-vs-2021.md")


def escape(value: object) -> str:
    return html.escape(str(value), quote=True)


def semester_number(row: dict[str, object]) -> int:
    explicit = row.get("semesterNumber")
    if isinstance(explicit, int) and 1 <= explicit <= 6:
        return explicit
    match = re.search(r"\b([1-6])\b", str(row.get("semester", "")))
    if match:
        return int(match.group(1))
    raise ValueError(f"Missing valid semester for {row.get('programme')} {row.get('code')}")


def natural_code_key(code: str) -> tuple[int, str]:
    match = re.match(r"(\d+)(.*)", code)
    if not match:
        return (10**9, code)
    return (int(match.group(1)), match.group(2))


def head(title: str, description: str, url: str) -> str:
    return f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="{escape(description)}"><title>{escape(title)}</title><link rel="canonical" href="{escape(url)}"><meta property="og:type" content="website"><meta property="og:title" content="{escape(title)}"><meta property="og:description" content="{escape(description)}"><meta property="og:url" content="{escape(url)}"><meta property="og:image" content="{IMAGE}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="{escape(title)}"><meta name="twitter:description" content="{escape(description)}"><meta name="twitter:image" content="{IMAGE}"><link rel="stylesheet" href="/assets/css/style.css?v=20260716-rev2026-tables2"><link rel="stylesheet" href="/assets/css/animations.css?v=20260716-rev2026-tables2"><link rel="stylesheet" href="/assets/css/responsive.css?v=20260716-rev2026-tables2"><link rel="stylesheet" href="/assets/css/department-card-art.css?v=20260716-rev2026-tables2"><link rel="stylesheet" href="/assets/css/hardening.css?v=20260716-rev2026-tables2"><link rel="stylesheet" href="/assets/css/site-navigation-a11y.css?v=20260716-rev2026-tables2"><link rel="stylesheet" href="/assets/css/site-brand.css?v=20260716-rev2026-tables2"><link rel="stylesheet" href="/assets/css/portal-layout.css?v=20260716-rev2026-tables2"><link rel="stylesheet" href="/assets/css/fixed-site-header.css?v=20260716-rev2026-tables2"><style>.r26w{{overflow:auto;border:1px solid #dbe4f3;border-radius:16px}}.r26{{width:100%;min-width:720px;border-collapse:collapse;background:#fff}}.r26 th,.r26 td{{padding:12px;border-bottom:1px solid #e5eaf2;text-align:left;vertical-align:top}}.r26 th{{background:#eef4ff}}.r26 td:first-child{{font-weight:800;white-space:nowrap}}.sem{{margin:0 0 28px}}.sem h2{{margin:0}}.subject-count{{white-space:nowrap}}</style></head>'''


def navigation() -> str:
    return '''<a class="skip-link" href="#main">Skip to main content</a><header class="topbar"><a class="brand" href="/index.html"><span class="brand-symbol">📚</span><strong>POLY PMNA</strong></a><button class="menu-toggle" type="button" aria-label="Toggle navigation" aria-expanded="false">Menu</button><nav class="navlinks"><a href="/index.html">Home</a><a href="/about.html">About</a><a href="/revision-2021.html">Revision 2021</a><a class="active" aria-current="page" href="/revision-2026.html">Revision 2026</a><a href="/daily-quiz.html">Mock Exams</a><a href="/ask-poly.html">Ask POLY AI</a><a href="/materials-2015.html">2015 Materials</a><a href="/tools.html">Tools <span class="nav-badge">New</span></a><a href="/contact.html">Help</a></nav></header>'''


def footer() -> str:
    return '''<footer class="footer"><p>&copy; <span data-year></span> POLY PMNA.</p><a href="https://nandakumarm.dpdns.org/about.html">Connect to Developer</a><nav class="footer-legal"><a href="/privacy.html">Privacy</a><a href="/terms.html">Terms</a><a href="/disclaimer.html">Disclaimer</a></nav></footer><script src="/assets/js/main.js" defer></script><script src="/assets/js/site-hardening.js" defer></script><script src="/assets/js/fixed-site-header.js" defer></script>'''


def build_index(programmes: list[dict[str, object]]) -> str:
    cards = "".join(
        f'<a class="choice-card reveal" href="/revision-2026/{escape(programme["slug"])}.html"><span>{escape(programme["officialCode"])}</span><h2>{escape(programme["name"])}</h2><p>Open Semester 1–6 subject tables.</p></a>'
        for programme in programmes
    )
    title = "Revision 2026 Diploma Departments | POLY PMNA"
    description = (
        "Browse all 38 official SITTTR Kerala Revision 2026 programmes and "
        "Semester 1 to Semester 6 subject tables."
    )
    return head(title, description, SITE + "/revision-2026.html") + f'''<body class="portal-page">{navigation()}<main id="main"><nav class="site-breadcrumbs"><ol><li><a href="/">Home</a></li><li>Revision 2026</li></ol></nav><section class="page-title reveal"><p class="kicker">Revision 2026</p><h1>Choose your 2026 department</h1><p>All 38 official programme links are embedded directly in this HTML.</p></section><section class="section cards two selection-grid">{cards}</section><section class="section notice"><strong>Official source:</strong> <a href="https://www.sitttrkerala.ac.in/index.php?r=site%2Fdiploma-syllabus&amp;scheme=REV2026">SITTTR Revision 2026</a></section></main>{footer()}</body></html>\n'''


def build_department_page(
    programme: dict[str, object], rows: list[dict[str, object]]
) -> str:
    semester_blocks: list[str] = []
    for number in range(1, 7):
        items = [row for row in rows if semester_number(row) == number]
        items.sort(
            key=lambda row: (
                natural_code_key(str(row.get("code", ""))),
                str(row.get("name", "")).casefold(),
            )
        )
        table_rows = "".join(
            f'<tr><td>{escape(row.get("code", ""))}</td><td>{escape(row.get("name", ""))}</td><td>{escape(row.get("type", "Course"))}</td><td><a class="action syllabus" href="{escape(row.get("syllabusUrl", ""))}" target="_blank" rel="noopener noreferrer">Open Syllabus</a></td></tr>'
            for row in items
        )
        if not table_rows:
            table_rows = '<tr><td colspan="4">No verified subjects listed.</td></tr>'
        semester_blocks.append(
            f'<section class="sem" id="semester-{number}"><div class="section-heading inline-heading"><div><p class="kicker">Semester {number}</p><h2>Semester {number} subjects</h2></div><p class="subject-count">{len(items)} subjects</p></div><div class="r26w"><table class="r26"><thead><tr><th>Code</th><th>Subject</th><th>Type</th><th>Official syllabus</th></tr></thead><tbody>{table_rows}</tbody></table></div></section>'
        )

    name = str(programme["name"])
    code = str(programme["officialCode"])
    slug = str(programme["slug"])
    title = f"{name} Revision 2026 Subjects | POLY PMNA"
    description = (
        f"Official SITTTR Revision 2026 {name} subjects arranged in the official "
        "Semester 1 to Semester 6 order."
    )
    source_note = ""
    fallback_count = sum(
        1 for row in rows if row.get("semesterSource") == "course-code-fallback"
    )
    if fallback_count:
        source_note = (
            f'<p class="notice"><strong>Semester verification note:</strong> '
            f'{fallback_count} row(s) required course-code fallback during parsing.</p>'
        )

    return head(title, description, f"{SITE}/revision-2026/{slug}.html") + f'''<body class="portal-page">{navigation()}<main id="main"><nav class="site-breadcrumbs"><ol><li><a href="/">Home</a></li><li><a href="/revision-2026.html">Revision 2026</a></li><li>{escape(name)}</li></ol></nav><section class="page-title reveal"><p class="kicker">Revision 2026 · {escape(code)}</p><h1>{escape(name)}</h1><p>{len(rows)} official subject records arranged semester-wise and code-wise.</p></section>{source_note}<section class="section compact">{"".join(semester_blocks)}</section><section class="section notice"><strong>Official programme page:</strong> <a href="{escape(programme["officialUrl"])}" target="_blank" rel="noopener noreferrer">SITTTR {escape(code)}</a></section></main>{footer()}</body></html>\n'''


def revision_2021_codes() -> set[str]:
    codes: set[str] = set()
    subjects_file = Path("assets/js/subjects.js")
    browser_file = Path("assets/js/sitttr-rev2021-browser.js")

    if subjects_file.exists():
        text = subjects_file.read_text(encoding="utf-8", errors="ignore")
        object_pattern = re.compile(
            r"revision\s*:\s*[\"']2021[\"'][^{}]{0,500}?code\s*:\s*[\"']([1-6]\d{3,4}[A-Z]?)[\"']",
            re.I | re.S,
        )
        codes.update(match.upper() for match in object_pattern.findall(text))

    if browser_file.exists():
        text = browser_file.read_text(encoding="utf-8", errors="ignore")
        supplemental_pattern = re.compile(
            r"sub\(\s*[\"'][^\"']+[\"']\s*,\s*[\"']([1-6]\d{3,4}[A-Z]?)[\"']",
            re.I,
        )
        codes.update(match.upper() for match in supplemental_pattern.findall(text))

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

    codes_2026 = set(by_code)
    new_codes = sorted(codes_2026 - codes_2021, key=natural_code_key)
    removed_codes = sorted(codes_2021 - codes_2026, key=natural_code_key)
    details: list[dict[str, object]] = []

    for code in new_codes:
        rows = by_code[code]
        details.append(
            {
                "code": code,
                "subjects": sorted({str(row.get("name", "")) for row in rows}),
                "semesters": sorted({str(row.get("semester", "")) for row in rows}),
                "programmes": sorted({str(row.get("programme", "")) for row in rows}),
            }
        )

    payload: dict[str, object] = {
        "comparison": "REV2026 official dataset versus the current POLY PMNA REV2021 catalogue",
        "revision2021UniqueCodeCount": len(codes_2021),
        "revision2026UniqueCodeCount": len(codes_2026),
        "newCodeCount": len(new_codes),
        "newCodes": new_codes,
        "newCodeDetails": details,
        "codesPresentIn2021ButNot2026Count": len(removed_codes),
        "codesPresentIn2021ButNot2026": removed_codes,
        "limitation": (
            "Revision 2021 comparison uses the current repository catalogue, whose earlier "
            "audit is not fully certified for every official programme row."
        ),
    }

    REPORT_JSON.parent.mkdir(exist_ok=True)
    REPORT_JSON.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )

    lines = [
        "# Revision 2026 new subject codes compared with Revision 2021",
        "",
        f"- REV2021 unique codes in repository catalogue: **{len(codes_2021)}**",
        f"- REV2026 unique official codes: **{len(codes_2026)}**",
        f"- Codes appearing in REV2026 but not in the current REV2021 catalogue: **{len(new_codes)}**",
        "",
        "> Limitation: the REV2021 repository catalogue was previously audited as not fully certified for every official programme row.",
        "",
        "## New codes",
        "",
    ]
    for item in details:
        subjects_text = "; ".join(item["subjects"])
        semesters_text = ", ".join(item["semesters"])
        programmes_text = ", ".join(item["programmes"])
        lines.append(
            f'- **{item["code"]}** — {subjects_text} — {semesters_text} — {programmes_text}'
        )
    REPORT_MD.write_text("\n".join(lines) + "\n", encoding="utf-8")
    return payload


def main() -> None:
    programmes = json.loads(REGISTRY.read_text(encoding="utf-8"))["programmes"]
    data = json.loads(DATA.read_text(encoding="utf-8"))
    subjects = data["subjects"]

    if len(programmes) != 38:
        raise SystemExit("Expected 38 programmes")

    by_programme: dict[str, list[dict[str, object]]] = defaultdict(list)
    for row in subjects:
        slug = str(row.get("programmeSlug", ""))
        if slug:
            semester_number(row)  # validates every row before page generation
            by_programme[slug].append(row)

    missing = [str(programme["slug"]) for programme in programmes if not by_programme[str(programme["slug"])]]
    if missing:
        raise SystemExit("Empty programme data: " + ", ".join(missing))

    OUT.mkdir(exist_ok=True)
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
            f"Semester {number}": sum(
                1 for row in rows if semester_number(row) == number
            )
            for number in range(1, 7)
        }
        (OUT / f"{slug}.html").write_text(
            build_department_page(programme, rows), encoding="utf-8"
        )

    comparison = write_new_code_report(subjects)
    Path("reports").mkdir(exist_ok=True)
    Path("reports/revision-2026-build-summary.json").write_text(
        json.dumps(
            {
                "scheme": "REV2026",
                "programmeCount": 38,
                "subjectCount": len(subjects),
                "staticPageCount": 38,
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
        f"Built 38 static pages from {len(subjects)} subject records; "
        f"new codes versus REV2021={comparison['newCodeCount']}"
    )


if __name__ == "__main__":
    main()
