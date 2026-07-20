#!/usr/bin/env python3
"""Collect and cross-check Kerala Polytechnic REV2015 subject links.

Primary source: SITTTR Kerala official syllabus/model-question-paper indexes.
Fallback: InspirenIgnite semester tables, used only when an official programme page
cannot be read. The script writes an audit artifact; it does not modify website data.
"""

from __future__ import annotations

import json
import re
import time
from collections import defaultdict
from pathlib import Path
from urllib.parse import parse_qs, urljoin, urlparse

import requests
from bs4 import BeautifulSoup

OUT = Path("reports/rev2015-subject-audit")
OUT.mkdir(parents=True, exist_ok=True)

PROGRAMMES = [
    ("AR", "Architecture"),
    ("AU", "Automobile Engineering"),
    ("BM", "Biomedical Engineering"),
    ("CH", "Chemical Engineering"),
    ("CE", "Civil Engineering"),
    ("CP", "Commercial Practice"),
    ("CB", "Computer Application & Business Management"),
    ("CT", "Computer Engineering"),
    ("CM", "Computer Hardware Engineering"),
    ("EE", "Electrical & Electronics Engineering"),
    ("EC", "Electronics and Communication"),
    ("EL", "Electronics Engineering"),
    ("IF", "Information Technology"),
    ("IE", "Instrumentation Engineering"),
    ("MT", "Manufacturing Technology"),
    ("ME", "Mechanical Engineering"),
    ("PL", "Polymer Technology"),
    ("PT", "Printing Technology"),
    ("TT", "Textile Technology"),
    ("TD", "Tool & Die Engineering"),
    ("WP", "Wood and Paper Technology"),
]

SITTTR = "https://www.sitttrkerala.ac.in/index.php"
SYLLABUS_INDEX = f"{SITTTR}?r=site%2Fdiploma-syllabus&scheme=REV2015"
MODEL_INDEX = f"{SITTTR}?r=site%2Fdiploma-modelqp&scheme=REV2015"
INI_INDEX = "https://www.inspirenignite.com/kl/sitttr-syllabus/"
CODE_RE = re.compile(r"^\d{4}[A-Z]?$", re.I)

session = requests.Session()
session.headers.update(
    {
        "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/126.0 Safari/537.36 REV2015-audit/1.0",
        "Accept-Language": "en-US,en;q=0.9",
    }
)


def get(url: str, attempts: int = 4) -> requests.Response:
    last: Exception | None = None
    for attempt in range(1, attempts + 1):
        try:
            response = session.get(url, timeout=(20, 120), allow_redirects=True)
            if response.status_code == 200 and response.text.strip():
                return response
            last = RuntimeError(f"HTTP {response.status_code} for {url}")
        except requests.RequestException as exc:
            last = exc
        time.sleep(min(3 * attempt, 10))
    raise RuntimeError(str(last) if last else f"Failed to fetch {url}")


def course_code_from_href(href: str) -> str | None:
    query = parse_qs(urlparse(urljoin(SITTTR, href)).query)
    values = query.get("course", [])
    if not values:
        return None
    code = values[0].strip().upper()
    return code if CODE_RE.fullmatch(code) else None


def clean_name(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip(" -–—\t\r\n")


def infer_semester(code: str) -> int | None:
    return int(code[0]) if code and code[0] in "123456" else None


def scrape_official_programme(code: str, name: str) -> tuple[list[dict], set[str], dict]:
    syllabus_url = f"{SITTTR}?r=site%2Fdiploma-syllabus-courses&prog={code}"
    model_url = f"{SITTTR}?r=site%2Fdiploma-modelqp-courses&prog={code}"
    diagnostics: dict = {
        "programmeCode": code,
        "programme": name,
        "syllabusUrl": syllabus_url,
        "modelUrl": model_url,
    }

    syllabus_response = get(syllabus_url)
    syllabus_soup = BeautifulSoup(syllabus_response.text, "lxml")
    rows: dict[str, dict] = {}
    for anchor in syllabus_soup.select('a[href*="diploma-syllabus-course-contents"]'):
        course_code = course_code_from_href(anchor.get("href", ""))
        subject_name = clean_name(anchor.get_text(" ", strip=True))
        if not course_code or not subject_name:
            continue
        rows[course_code] = {
            "revision": "2015",
            "scheme": "REV2015",
            "programmeCode": code,
            "programme": name,
            "semester": infer_semester(course_code),
            "code": course_code,
            "name": subject_name,
            "syllabusUrl": f"{SITTTR}?r=site%2Fdiploma-syllabus-course-contents&course={course_code}",
            "modelQuestionPaperUrl": f"{SITTTR}?r=site%2Fdiploma-modelqp-courses-show&course={course_code}",
            "source": "SITTTR official programme page",
        }

    model_codes: set[str] = set()
    try:
        model_response = get(model_url)
        model_soup = BeautifulSoup(model_response.text, "lxml")
        for anchor in model_soup.select('a[href*="diploma-modelqp-courses-show"]'):
            course_code = course_code_from_href(anchor.get("href", ""))
            if course_code:
                model_codes.add(course_code)
        diagnostics["modelStatus"] = model_response.status_code
        diagnostics["modelBytes"] = len(model_response.content)
    except Exception as exc:  # model availability is useful but not required for syllabus collection
        diagnostics["modelError"] = str(exc)

    diagnostics.update(
        {
            "syllabusStatus": syllabus_response.status_code,
            "syllabusBytes": len(syllabus_response.content),
            "subjectCount": len(rows),
            "modelSubjectCount": len(model_codes),
        }
    )
    return list(rows.values()), model_codes, diagnostics


def collect_ini_semester_links() -> dict[str, list[tuple[int, str]]]:
    response = get(INI_INDEX)
    soup = BeautifulSoup(response.text, "lxml")
    heading = next(
        (tag for tag in soup.find_all(["h2", "h3"]) if "SITTTR Syllabus 2015" in clean_name(tag.get_text(" "))),
        None,
    )
    if heading is None:
        raise RuntimeError("Could not find the SITTTR Syllabus 2015 heading")

    result: dict[str, list[tuple[int, str]]] = defaultdict(list)
    node = heading.find_next()
    while node and not (node.name in {"h2", "h3"} and node is not heading):
        if node.name == "a" and node.get("href"):
            label = clean_name(node.get_text(" ", strip=True)).lower()
            href = urljoin(INI_INDEX, node["href"])
            match = re.search(r"([1-6])(?:st|nd|rd|th)\s*sem", label)
            if match and "2015-revision" in href:
                semester = int(match.group(1))
                parent_text = clean_name(node.parent.get_text(" ", strip=True)) if node.parent else ""
                for _, programme in PROGRAMMES:
                    if parent_text.lower().startswith(programme.lower()):
                        result[programme].append((semester, href))
                        break
        node = node.find_next()
    return result


def scrape_ini_programme(programme: str, links: list[tuple[int, str]]) -> tuple[list[dict], dict]:
    records: dict[str, dict] = {}
    errors: list[str] = []
    pages = 0
    for semester, url in sorted(set(links)):
        try:
            response = get(url)
            pages += 1
            soup = BeautifulSoup(response.text, "lxml")
            for row in soup.select("tr"):
                cells = [clean_name(cell.get_text(" ", strip=True)) for cell in row.select("th,td")]
                code_index = next((i for i, value in enumerate(cells) if CODE_RE.fullmatch(value)), None)
                if code_index is None or code_index + 1 >= len(cells):
                    continue
                course_code = cells[code_index].upper()
                subject_name = cells[code_index + 1]
                if not subject_name or subject_name.lower() in {"subject name", "course name"}:
                    continue
                records[course_code] = {
                    "revision": "2015",
                    "scheme": "REV2015",
                    "programme": programme,
                    "semester": semester,
                    "code": course_code,
                    "name": subject_name,
                    "syllabusUrl": f"{SITTTR}?r=site%2Fdiploma-syllabus-course-contents&course={course_code}",
                    "modelQuestionPaperUrl": f"{SITTTR}?r=site%2Fdiploma-modelqp-courses-show&course={course_code}",
                    "source": "InspirenIgnite mirror of SITTTR scheme",
                }
        except Exception as exc:
            errors.append(f"semester {semester}: {exc}")
    return list(records.values()), {"pagesRead": pages, "errors": errors, "subjectCount": len(records)}


def main() -> None:
    # Establish the REV2015 session context before opening programme pages.
    index_status: dict[str, object] = {}
    for label, url in (("syllabus", SYLLABUS_INDEX), ("model", MODEL_INDEX)):
        try:
            response = get(url)
            index_status[label] = {"status": response.status_code, "bytes": len(response.content), "url": response.url}
        except Exception as exc:
            index_status[label] = {"error": str(exc), "url": url}

    try:
        ini_links = collect_ini_semester_links()
    except Exception as exc:
        ini_links = {}
        index_status["inspirenIgniteError"] = str(exc)

    all_records: list[dict] = []
    diagnostics: list[dict] = []
    failures: list[dict] = []

    for programme_code, programme in PROGRAMMES:
        try:
            records, model_codes, diag = scrape_official_programme(programme_code, programme)
            if not records:
                raise RuntimeError("Official page returned zero subject links")
            for record in records:
                record["modelQuestionPaperListed"] = record["code"] in model_codes
            all_records.extend(records)
            diagnostics.append(diag)
            print(f"{programme_code}: official {len(records)} subjects, {len(model_codes)} model-paper links")
            continue
        except Exception as official_exc:
            fallback_records, fallback_diag = scrape_ini_programme(programme, ini_links.get(programme, []))
            for record in fallback_records:
                record["programmeCode"] = programme_code
                record["modelQuestionPaperListed"] = None
            all_records.extend(fallback_records)
            diagnostics.append(
                {
                    "programmeCode": programme_code,
                    "programme": programme,
                    "officialError": str(official_exc),
                    "fallback": fallback_diag,
                }
            )
            if not fallback_records:
                failures.append(
                    {
                        "programmeCode": programme_code,
                        "programme": programme,
                        "officialError": str(official_exc),
                        "fallback": fallback_diag,
                    }
                )
            print(f"{programme_code}: fallback {len(fallback_records)} subjects")

    # Deduplicate within a programme while preserving a subject shared by different programmes.
    deduped: dict[tuple[str, str], dict] = {}
    for record in all_records:
        deduped[(record["programmeCode"], record["code"])] = record
    all_records = sorted(
        deduped.values(),
        key=lambda item: (item["programme"].casefold(), item.get("semester") or 99, item["code"]),
    )

    counts_by_programme: dict[str, int] = defaultdict(int)
    counts_by_semester: dict[str, int] = defaultdict(int)
    unique_codes: set[str] = set()
    for record in all_records:
        counts_by_programme[record["programme"]] += 1
        counts_by_semester[str(record.get("semester"))] += 1
        unique_codes.add(record["code"])

    payload = {
        "generatedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "revision": "2015",
        "scheme": "REV2015",
        "programmeCountExpected": len(PROGRAMMES),
        "programmeCountWithSubjects": sum(1 for _, name in PROGRAMMES if counts_by_programme[name]),
        "recordCount": len(all_records),
        "uniqueSubjectCodeCount": len(unique_codes),
        "countsByProgramme": dict(sorted(counts_by_programme.items())),
        "countsBySemester": dict(sorted(counts_by_semester.items())),
        "indexStatus": index_status,
        "failures": failures,
        "diagnostics": diagnostics,
        "subjects": all_records,
    }
    (OUT / "revision-2015-subjects-audit.json").write_text(
        json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    (OUT / "summary.txt").write_text(
        "\n".join(
            [
                "REV2015 subject audit",
                f"Programmes expected: {len(PROGRAMMES)}",
                f"Programmes with subjects: {payload['programmeCountWithSubjects']}",
                f"Programme-subject records: {len(all_records)}",
                f"Unique subject codes: {len(unique_codes)}",
                f"Failures: {len(failures)}",
                "",
                *[f"{code} {name}: {counts_by_programme[name]}" for code, name in PROGRAMMES],
            ]
        )
        + "\n",
        encoding="utf-8",
    )

    if failures:
        raise SystemExit(f"Incomplete audit: {len(failures)} programme(s) have no subjects")
    if payload["programmeCountWithSubjects"] != len(PROGRAMMES):
        raise SystemExit("Incomplete audit: not all programmes have subject records")
    if len(all_records) < 700:
        raise SystemExit(f"Suspiciously small dataset: only {len(all_records)} programme-subject records")


if __name__ == "__main__":
    main()
