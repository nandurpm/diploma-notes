#!/usr/bin/env python3
"""Download and verify the official SITTTR Kerala REV2026 programme catalogue.

The synchronizer treats the SITTTR programme index and the 38 programme course
pages as the source of truth. Semester placement is taken from the official row
or official table section whenever available. The leading digit of a course code
is used only as a checked fallback; it is never allowed to contradict an official
semester label.
"""

from __future__ import annotations

import json
import re
import sys
import time
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import parse_qs, urljoin, urlparse

import requests
from bs4 import BeautifulSoup, Tag

BASE = "https://www.sitttrkerala.ac.in/"
INDEX = (
    "https://www.sitttrkerala.ac.in/index.php?"
    "r=site%2Fdiploma-syllabus&scheme=REV2026"
)
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
OUT_DIR = Path("assets/data")
PROGRAMME_OUT = OUT_DIR / "revision-2026-programmes.json"
SUBJECT_OUT = OUT_DIR / "revision-2026-subjects.json"


def programme_url(code: str) -> str:
    return (
        f"{BASE}index.php?r=site%2Fdiploma-syllabus-courses"
        f"&prog={code}"
    )


def normalise_text(value: object) -> str:
    return " ".join(str(value or "").split())


def get(
    session: requests.Session,
    url: str,
    *,
    referer: str | None = None,
    tries: int = 5,
) -> requests.Response:
    last_error: Exception | None = None
    headers = {
        "User-Agent": "Mozilla/5.0 (compatible; POLY-PMNA-REV2026-Verifier/5.0)",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-IN,en;q=0.9",
    }
    if referer:
        headers["Referer"] = referer

    for attempt in range(tries):
        try:
            response = session.get(url, headers=headers, timeout=60, allow_redirects=True)
            if response.ok and len(response.text) > 500:
                return response
            last_error = RuntimeError(
                f"HTTP {response.status_code}, {len(response.text)} bytes, final={response.url}"
            )
        except Exception as exc:
            last_error = exc
        time.sleep(min(20, 2**attempt))
    raise last_error or RuntimeError(f"Unable to download {url}")


def extract_programme_code(href: str) -> str:
    query = parse_qs(urlparse(urljoin(BASE, href)).query)
    return normalise_text((query.get("prog") or [""])[0]).upper()


def validate_official_index(session: requests.Session) -> requests.Response:
    response = get(session, INDEX)
    soup = BeautifulSoup(response.text, "html.parser")
    official: list[tuple[str, str]] = []
    seen: set[str] = set()
    for link in soup.select('a[href*="diploma-syllabus-courses"]'):
        code = extract_programme_code(link.get("href", ""))
        name = normalise_text(link.get_text(" ", strip=True))
        if code and name and code not in seen:
            official.append((code, name))
            seen.add(code)

    expected = [(code, name) for code, name, _ in PROGRAMMES]
    if official != expected:
        missing = [item for item in expected if item not in official]
        extra = [item for item in official if item not in expected]
        raise RuntimeError(
            "Official programme index does not match the expected 38-programme registry. "
            f"found={len(official)} missing={missing} extra={extra} order={official}"
        )
    return response


def semester_number(text: object) -> int | None:
    match = SEMESTER.search(normalise_text(text))
    return int(match.group(1)) if match else None


def marker_from_tag(tag: Tag | None) -> int | None:
    if not isinstance(tag, Tag):
        return None
    candidates = [
        tag.get("aria-label", ""),
        tag.get("data-title", ""),
        tag.get("id", ""),
        " ".join(tag.get("class", [])),
    ]
    text = normalise_text(tag.get_text(" ", strip=True))
    if text and len(text) <= 180:
        candidates.append(text)
    for candidate in candidates:
        value = semester_number(candidate)
        if value:
            return value
    return None


def semester_from_table_context(table: Tag, index: int, total: int) -> tuple[int | None, str]:
    for marker in table.select(
        "caption, thead th, h1, h2, h3, h4, h5, h6, .panel-heading, .card-header, .semester"
    )[:24]:
        value = marker_from_tag(marker)
        if value:
            return value, "official-table-section"

    node: Tag | None = table
    for _ in range(5):
        if not isinstance(node, Tag):
            break
        sibling = node.previous_sibling
        inspected = 0
        while sibling is not None and inspected < 16:
            if isinstance(sibling, Tag):
                inspected += 1
                if sibling.name not in {"script", "style", "table"}:
                    value = marker_from_tag(sibling)
                    if value:
                        return value, "official-table-section"
            sibling = sibling.previous_sibling
        node = node.parent if isinstance(node.parent, Tag) else None

    if total == 6:
        return index, "official-table-order"
    return None, ""


def subject_name(row: Tag, code: str, link: Tag) -> str:
    link_text = normalise_text(" ".join(link.stripped_strings))
    if link_text and link_text.upper() != code and not BAD.fullmatch(link_text):
        return link_text

    values = [normalise_text(" ".join(cell.stripped_strings)) for cell in row.find_all(["td", "th"])]
    values = [
        value
        for value in values
        if value
        and value.upper() != code
        and not BAD.fullmatch(value)
        and not re.fullmatch(r"[\d\s./():-]+", value)
        and semester_number(value) is None
        and value.casefold() not in TYPES
    ]
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
    code = normalise_text((query.get("course") or [""])[0]).upper()
    if not code:
        match = COURSE_CODE.search(row.get_text(" ", strip=True))
        code = match.group(1).upper() if match else ""
    return code, href


def candidate_tables(soup: BeautifulSoup) -> list[Tag]:
    return [
        table
        for table in soup.find_all("table")
        if table.select_one('a[href*="diploma-syllabus-course-contents"],a[href*="course="]')
    ]


def parse_programme(
    session: requests.Session,
    programme_code: str,
    name: str,
    slug: str,
) -> list[dict[str, object]]:
    url = programme_url(programme_code)
    page = get(session, url, referer=INDEX)
    soup = BeautifulSoup(page.text, "html.parser")
    tables = candidate_tables(soup)
    if not tables:
        raise RuntimeError("No official subject tables found")

    rows: list[dict[str, object]] = []
    seen: set[tuple[int, str, str]] = set()
    source_counter: Counter[str] = Counter()

    for table_index, table in enumerate(tables, start=1):
        table_semester, table_source = semester_from_table_context(
            table, table_index, len(tables)
        )
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
                source = "official-row"
            elif table_semester is not None:
                semester = table_semester
                source = table_source
            else:
                semester = int(code[0])
                source = "course-code-fallback"

            code_semester = int(code[0])
            if semester != code_semester:
                raise RuntimeError(
                    f"Official semester/code mismatch: {code} was parsed in Semester {semester}"
                )

            title = subject_name(row, code, link)
            if title == code:
                raise RuntimeError(f"Could not extract a title for course {code}")
            key = (semester, code, title.casefold())
            if key in seen:
                continue
            seen.add(key)
            source_counter[source] += 1
            rows.append(
                {
                    "revision": "2026",
                    "scheme": "REV2026",
                    "programme": name,
                    "programmeCode": programme_code,
                    "programmeSlug": slug,
                    "programmeUrl": url,
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
        raise RuntimeError(f"Only {len(rows)} official subject rows found")
    if missing:
        raise RuntimeError(f"Missing official semester groups: {missing}")

    for number in range(1, 7):
        if not any(int(row["semesterNumber"]) == number for row in rows):
            raise RuntimeError(f"Semester {number} is empty")

    print(
        f"{programme_code} {name}: {len(rows)} subjects; "
        + ", ".join(f"{key}={value}" for key, value in sorted(source_counter.items())),
        flush=True,
    )
    return sorted(
        rows,
        key=lambda item: (
            int(item["semesterNumber"]),
            str(item["code"]),
            str(item["name"]).casefold(),
        ),
    )


def main() -> int:
    session = requests.Session()
    try:
        validate_official_index(session)
    except Exception as exc:
        print(f"Official index validation failed: {exc}", file=sys.stderr)
        return 1

    verified_at = datetime.now(timezone.utc)
    registry = {
        "scheme": "REV2026",
        "source": INDEX,
        "lastVerified": verified_at.date().isoformat(),
        "verifiedAt": verified_at.isoformat(),
        "programmeCount": len(PROGRAMMES),
        "codePolicy": "Exact programme codes and names from the official SITTTR REV2026 index.",
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

    subjects: list[dict[str, object]] = []
    failures: list[dict[str, str]] = []
    counts: dict[str, int] = {}
    semester_counts: dict[str, dict[str, int]] = {}
    source_counts: Counter[str] = Counter()

    for code, name, slug in PROGRAMMES:
        try:
            programme_rows = parse_programme(session, code, name, slug)
            subjects.extend(programme_rows)
            counts[slug] = len(programme_rows)
            semester_counts[slug] = {
                f"Semester {number}": sum(
                    1 for row in programme_rows if int(row["semesterNumber"]) == number
                )
                for number in range(1, 7)
            }
            source_counts.update(str(row["semesterSource"]) for row in programme_rows)
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
    if len(counts) != 38 or len(subjects) < 1000:
        print(
            f"Unsafe catalogue size: programmes={len(counts)} subjects={len(subjects)}",
            file=sys.stderr,
        )
        return 1

    payload = {
        "scheme": "REV2026",
        "source": INDEX,
        "sourceMethod": (
            "Official REV2026 index plus 38 exact official programme URLs; "
            "semester from official row/table section, with checked code-prefix fallback only."
        ),
        "generatedAt": verified_at.isoformat(),
        "programmeCount": 38,
        "subjectCount": len(subjects),
        "programmeSubjectCounts": counts,
        "programmeSemesterCounts": semester_counts,
        "semesterSourceCounts": dict(sorted(source_counts.items())),
        "failures": [],
        "subjects": subjects,
    }

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    PROGRAMME_OUT.write_text(
        json.dumps(registry, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    SUBJECT_OUT.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    print(
        f"Verified programmes=38 subjects={len(subjects)} failures=0 "
        f"sources={dict(sorted(source_counts.items()))}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
