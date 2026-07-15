#!/usr/bin/env python3
from __future__ import annotations

import json
import re
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import parse_qs, urljoin, urlparse

import requests
from bs4 import BeautifulSoup, Tag

BASE = "https://www.sitttrkerala.ac.in/"
INDEX = "https://www.sitttrkerala.ac.in/index.php?r=site%2Fdiploma-syllabus&scheme=REV2026"
PROGRAMMES = [
    ("AR", "Architecture", "architecture"),
    ("AI", "Artificial Intelligence", "artificial-intelligence"),
    ("AM", "Artificial Intelligence & Machine Learning", "artificial-intelligence-and-machine-learning"),
    ("RA", "Automation and Robotics", "automation-and-robotics"),
    ("AU", "Automobile Engineering", "automobile-engineering"),
    ("BM", "Biomedical Engineering", "biomedical-engineering"),
    ("CH", "Chemical Engineering", "chemical-engineering"),
    ("CV", "Civil & Environmental Engineering", "civil-and-environmental-engineering"),
    ("CR", "Civil & Rural Engineering", "civil-and-rural-engineering"),
    ("CE", "Civil Engineering", "civil-engineering"),
    ("CL", "Civil Engineering & Planning", "civil-engineering-and-planning"),
    ("CP", "Commercial Practice", "commercial-practice"),
    ("CB", "Computer Application & Business Management", "computer-application-and-business-management"),
    ("CT", "Computer Engineering", "computer-engineering"),
    ("CS", "Computer Science & Engineering", "computer-science-and-engineering"),
    ("CG", "Computer Science and Technology", "computer-science-and-technology"),
    ("CF", "Cyber Forensics and Information Security", "cyber-forensics-and-information-security"),
    ("EE", "Electrical & Electronics Engineering", "electrical-and-electronics-engineering"),
    ("EG", "Electrical Engineering", "electrical-engineering"),
    ("EV", "Electrical Engineering & Electric Vehicles Technology", "electrical-engineering-and-electric-vehicles-technology"),
    ("EC", "Electronics and Communication", "electronics-and-communication"),
    ("ET", "Electronics and Computer Engineering", "electronics-and-computer-engineering"),
    ("EL", "Electronics Engineering", "electronics-engineering"),
    ("FS", "Fire Technology and Safety", "fire-technology-and-safety"),
    ("FT", "Food Processing Technology", "food-processing-technology"),
    ("IF", "Information Technology", "information-technology"),
    ("IE", "Instrumentation Engineering", "instrumentation-engineering"),
    ("IC", "Integrated Circuit Design & Fabrication", "integrated-circuit-design-and-fabrication"),
    ("ID", "Interior Design", "interior-design"),
    ("ME", "Mechanical Engineering", "mechanical-engineering"),
    ("MC", "Mechatronics", "mechatronics"),
    ("MI", "Micro Electronics", "micro-electronics"),
    ("PL", "Polymer Technology", "polymer-technology"),
    ("PT", "Printing Technology", "printing-technology"),
    ("RP", "Robotic Process Automation", "robotic-process-automation"),
    ("TT", "Textile Technology", "textile-technology"),
    ("TD", "Tool & Die Engineering", "tool-and-die-engineering"),
    ("WP", "Wood and Paper Technology", "wood-and-paper-technology"),
]

BAD = re.compile(
    r"^(view|open|download|syllabus|course content|details?|click here|course|subject|code|semester|sl\.?\s*no\.?)$",
    re.I,
)
COURSE_CODE = re.compile(r"\b([1-6]\d{2,4}[A-Z]?)\b", re.I)
SEMESTER = re.compile(r"\b(?:semester|sem)\s*[-:]?\s*([1-6])\b", re.I)
TYPES = {
    "laboratory": "Lab",
    "lab": "Lab",
    "workshop": "Workshop",
    "drawing": "Drawing",
    "project": "Project",
    "seminar": "Seminar",
    "internship": "Internship",
    "practical": "Practical",
    "theory": "Theory",
    "elective": "Elective",
}


def programme_url(code: str) -> str:
    return f"{BASE}index.php?r=site/diploma-syllabus-courses&prog={code}"


def get(session: requests.Session, url: str) -> requests.Response:
    last_error: Exception | None = None
    for attempt in range(5):
        try:
            response = session.get(
                url,
                headers={"User-Agent": "Mozilla/5.0 POLY-PMNA-REV2026-Sync/4.0"},
                timeout=50,
            )
            if response.ok and len(response.text) > 500:
                return response
            last_error = RuntimeError(
                f"HTTP {response.status_code}, {len(response.text)} bytes, final={response.url}"
            )
        except Exception as exc:  # requests raises several transport exceptions
            last_error = exc
        time.sleep(min(16, 2**attempt))
    raise last_error or RuntimeError(f"Unable to download {url}")


def semester_number(text: str) -> int | None:
    match = SEMESTER.search(" ".join(str(text).split()))
    return int(match.group(1)) if match else None


def short_semester_marker(tag: Tag | None) -> int | None:
    if not isinstance(tag, Tag):
        return None
    text = tag.get_text(" ", strip=True)
    if not text or len(text) > 160:
        return None
    return semester_number(text)


def preceding_semester(table: Tag) -> int | None:
    # Semester labels on the SITTTR pages may be headings, captions or panel labels.
    caption = table.find("caption")
    value = short_semester_marker(caption)
    if value:
        return value

    for previous in table.find_all_previous(limit=80):
        if not isinstance(previous, Tag):
            continue
        if previous.name in {"table", "tr", "td", "th", "script", "style"}:
            continue
        value = short_semester_marker(previous)
        if value:
            return value
    return None


def subject_name(row: Tag, code: str, link: Tag) -> str:
    link_text = " ".join(link.stripped_strings).strip()
    if link_text and link_text.upper() != code and not BAD.fullmatch(link_text):
        return link_text

    values = [" ".join(cell.stripped_strings).strip() for cell in row.find_all(["td", "th"])]
    values = [
        value
        for value in values
        if value
        and value.upper() != code
        and not BAD.fullmatch(value)
        and not re.fullmatch(r"[\d\s./():-]+", value)
        and semester_number(value) is None
    ]
    values = [value for value in values if value.lower() not in TYPES]
    return max(values, key=len) if values else code


def subject_type(name: str, row: Tag) -> str:
    text = f"{name} {row.get_text(' ', strip=True)}".lower()
    for token, label in TYPES.items():
        if re.search(rf"\b{re.escape(token)}\b", text):
            return label
    return "Course"


def course_from_row(row: Tag, link: Tag) -> tuple[str, str]:
    href = urljoin(BASE, link.get("href", ""))
    query = parse_qs(urlparse(href).query)
    code = (query.get("course") or [""])[0].strip().upper()
    if not code:
        match = COURSE_CODE.search(row.get_text(" ", strip=True))
        code = match.group(1).upper() if match else ""
    return code, href


def candidate_tables(soup: BeautifulSoup) -> list[Tag]:
    tables: list[Tag] = []
    for table in soup.find_all("table"):
        if table.select_one('a[href*="diploma-syllabus-course-contents"],a[href*="course="]'):
            tables.append(table)
    return tables


def parse_programme(
    session: requests.Session, programme_code: str, name: str, slug: str
) -> list[dict[str, object]]:
    page = get(session, programme_url(programme_code))
    soup = BeautifulSoup(page.text, "html.parser")
    tables = candidate_tables(soup)
    if not tables:
        raise RuntimeError("No subject tables found")

    # If the official page contains exactly six course tables, their document order
    # is an additional safe signal for Semester 1 through Semester 6.
    six_table_order = len(tables) == 6
    rows: list[dict[str, object]] = []
    seen: set[tuple[int, str, str]] = set()

    for table_index, table in enumerate(tables, start=1):
        table_semester = short_semester_marker(table) or preceding_semester(table)
        if table_semester is None and six_table_order:
            table_semester = table_index

        for row in table.select("tr"):
            link = row.select_one(
                'a[href*="diploma-syllabus-course-contents"],a[href*="course="]'
            )
            if not link:
                continue

            code, href = course_from_row(row, link)
            if not code or code[0] not in "123456":
                continue

            row_semester = semester_number(row.get_text(" ", strip=True))
            if row_semester is not None:
                semester = row_semester
                source = "row"
            elif table_semester is not None:
                semester = table_semester
                source = "official-table-section"
            else:
                # Last-resort fallback is retained only to avoid dropping a valid row.
                # Validation below rejects a programme unless all six official semester
                # groups are represented, so this cannot silently collapse the page.
                semester = int(code[0])
                source = "course-code-fallback"

            title = subject_name(row, code, link)
            key = (semester, code, title.casefold())
            if key in seen:
                continue
            seen.add(key)
            rows.append(
                {
                    "revision": "2026",
                    "scheme": "REV2026",
                    "programme": name,
                    "programmeCode": programme_code,
                    "programmeSlug": slug,
                    "programmeUrl": programme_url(programme_code),
                    "semester": f"Semester {semester}",
                    "semesterNumber": semester,
                    "semesterSource": source,
                    "code": code,
                    "name": title,
                    "type": subject_type(title, row),
                    "syllabusUrl": href,
                }
            )

    represented = {int(row["semesterNumber"]) for row in rows}
    missing = sorted(set(range(1, 7)) - represented)
    if len(rows) < 10:
        raise RuntimeError(f"Only {len(rows)} subject rows found")
    if missing:
        raise RuntimeError(f"Missing official semester groups: {missing}")

    return sorted(
        rows,
        key=lambda item: (
            int(item["semesterNumber"]),
            str(item["code"]),
            str(item["name"]).casefold(),
        ),
    )


def main() -> int:
    registry = {
        "scheme": "REV2026",
        "source": INDEX,
        "lastVerified": datetime.now(timezone.utc).date().isoformat(),
        "programmeCount": 38,
        "programmes": [
            {
                "order": index + 1,
                "officialCode": code,
                "name": name,
                "slug": slug,
                "officialUrl": programme_url(code),
            }
            for index, (code, name, slug) in enumerate(PROGRAMMES)
        ],
    }

    session = requests.Session()
    subjects: list[dict[str, object]] = []
    failures: list[dict[str, str]] = []
    counts: dict[str, int] = {}
    source_counts: dict[str, int] = {}

    for code, name, slug in PROGRAMMES:
        try:
            programme_rows = parse_programme(session, code, name, slug)
            subjects.extend(programme_rows)
            counts[slug] = len(programme_rows)
            for row in programme_rows:
                source = str(row["semesterSource"])
                source_counts[source] = source_counts.get(source, 0) + 1
            print(code, name, len(programme_rows), flush=True)
        except Exception as exc:
            failures.append(
                {
                    "code": code,
                    "programme": name,
                    "url": programme_url(code),
                    "reason": str(exc),
                }
            )

    if failures:
        print(json.dumps(failures, indent=2), file=sys.stderr)
        return 1

    Path("assets/data").mkdir(parents=True, exist_ok=True)
    Path("assets/data/revision-2026-programmes.json").write_text(
        json.dumps(registry, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    payload = {
        "scheme": "REV2026",
        "source": INDEX,
        "sourceMethod": "38 exact official programme URLs; official semester table sections",
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "programmeCount": 38,
        "subjectCount": len(subjects),
        "programmeSubjectCounts": counts,
        "semesterSourceCounts": source_counts,
        "failures": [],
        "subjects": subjects,
    }
    Path("assets/data/revision-2026-subjects.json").write_text(
        json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    print(f"programmes=38 subjects={len(subjects)} failures=0")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
