#!/usr/bin/env python3
"""Verify the complete REV2026 department directory and semester card placement."""

from __future__ import annotations

import hashlib
import json
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import parse_qs, urlparse

from bs4 import BeautifulSoup

from sync_revision_2026 import INDEX, PROGRAMMES, programme_url

ROOT = Path.cwd()
REGISTRY = ROOT / "assets/data/revision-2026-programmes.json"
SUBJECTS = ROOT / "assets/data/revision-2026-subjects.json"
INDEX_PAGE = ROOT / "revision-2026.html"
DEPARTMENT_DIR = ROOT / "revision-2026"
REPORT = ROOT / "reports/revision-2026-catalogue-verification.json"
ALLOWED_SEMESTER_SOURCES = {
    "official-row",
    "official-table-section",
    "official-table-order",
    "course-code-fallback",
}


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def read_json(path: Path) -> dict[str, object]:
    return json.loads(path.read_text(encoding="utf-8"))


def code_from_syllabus_url(url: str) -> str:
    query = parse_qs(urlparse(url).query)
    return str((query.get("course") or [""])[0]).strip().upper()


def card_key(card) -> tuple[int, str, str]:
    semester = int(str(card.get("data-semester", "")).rsplit(" ", 1)[-1])
    code = str(card.get("data-subject-code", "")).strip().upper()
    title = " ".join(card.select_one("h3").get_text(" ", strip=True).split())
    return semester, code, title


def main() -> None:
    registry = read_json(REGISTRY)
    subject_payload = read_json(SUBJECTS)
    programmes = list(registry.get("programmes", []))
    subjects = list(subject_payload.get("subjects", []))
    expected = [
        {
            "order": index + 1,
            "officialCode": code,
            "name": name,
            "slug": slug,
            "officialUrl": programme_url(code),
        }
        for index, (code, name, slug) in enumerate(PROGRAMMES)
    ]

    issues: list[str] = []
    if registry.get("scheme") != "REV2026":
        issues.append("Programme registry scheme is not REV2026")
    if registry.get("source") != INDEX:
        issues.append("Programme registry source URL is not the official REV2026 index")
    if programmes != expected:
        issues.append("Programme registry does not exactly match the 38 official code/name/URL rows")
    if subject_payload.get("programmeCount") != 38:
        issues.append("Subject payload programmeCount is not 38")
    if subject_payload.get("subjectCount") != len(subjects):
        issues.append("Subject payload subjectCount does not match the stored rows")
    if subject_payload.get("failures"):
        issues.append("Subject payload contains sync failures")

    expected_by_slug = {item["slug"]: item for item in expected}
    by_programme: dict[str, list[dict[str, object]]] = defaultdict(list)
    duplicate_counter: Counter[tuple[str, int, str, str]] = Counter()
    source_counts: Counter[str] = Counter()

    for row in subjects:
        slug = str(row.get("programmeSlug", ""))
        code = str(row.get("code", "")).strip().upper()
        title = " ".join(str(row.get("name", "")).split())
        semester = row.get("semesterNumber")
        source = str(row.get("semesterSource", ""))
        programme = expected_by_slug.get(slug)

        if programme is None:
            issues.append(f"Unknown programme slug in subject data: {slug!r}")
            continue
        if row.get("programme") != programme["name"]:
            issues.append(f"{slug} {code}: programme name mismatch")
        if row.get("programmeCode") != programme["officialCode"]:
            issues.append(f"{slug} {code}: programme code mismatch")
        if row.get("programmeUrl") != programme["officialUrl"]:
            issues.append(f"{slug} {code}: official programme URL mismatch")
        if not isinstance(semester, int) or semester not in range(1, 7):
            issues.append(f"{slug} {code}: invalid semesterNumber {semester!r}")
            continue
        if row.get("semester") != f"Semester {semester}":
            issues.append(f"{slug} {code}: semester label mismatch")
        if not code or code[0] != str(semester):
            issues.append(f"{slug} {code}: course-code prefix conflicts with Semester {semester}")
        syllabus_url = str(row.get("syllabusUrl", ""))
        if code_from_syllabus_url(syllabus_url) != code:
            issues.append(f"{slug} {code}: syllabus URL does not point to the same course code")
        if not title or title == code:
            issues.append(f"{slug} {code}: missing subject title")
        if source not in ALLOWED_SEMESTER_SOURCES:
            issues.append(f"{slug} {code}: unverified semester source {source!r}")

        source_counts[source] += 1
        by_programme[slug].append(row)
        duplicate_counter[(slug, semester, code, title.casefold())] += 1

    duplicates = [key for key, count in duplicate_counter.items() if count > 1]
    if duplicates:
        issues.append(f"Duplicate subject identities found: {duplicates[:20]}")

    programme_subject_counts: dict[str, int] = {}
    programme_semester_counts: dict[str, dict[str, int]] = {}
    for programme in expected:
        slug = programme["slug"]
        rows = by_programme.get(slug, [])
        programme_subject_counts[slug] = len(rows)
        counts = {
            f"Semester {number}": sum(
                1 for row in rows if row.get("semesterNumber") == number
            )
            for number in range(1, 7)
        }
        programme_semester_counts[slug] = counts
        if not rows:
            issues.append(f"{slug}: no subjects")
        for semester, count in counts.items():
            if count == 0:
                issues.append(f"{slug}: {semester} has no subject cards")

    directory = BeautifulSoup(INDEX_PAGE.read_text(encoding="utf-8"), "html.parser")
    programme_cards = directory.select("[data-programme-card]")
    if len(programme_cards) != 38:
        issues.append(f"Directory contains {len(programme_cards)} programme cards, expected 38")
    actual_directory = []
    for index, card in enumerate(programme_cards, start=1):
        actual_directory.append(
            {
                "order": index,
                "officialCode": card.get("data-official-code"),
                "name": " ".join(card.select_one("h2").get_text(" ", strip=True).split()),
                "slug": card.get("data-programme-slug"),
                "href": card.get("href"),
            }
        )
    expected_directory = [
        {
            "order": item["order"],
            "officialCode": item["officialCode"],
            "name": item["name"],
            "slug": item["slug"],
            "href": f"/revision-2026/{item['slug']}.html",
        }
        for item in expected
    ]
    if actual_directory != expected_directory:
        issues.append("Directory card order/code/name/slug/link does not exactly match the official registry")

    static_page_count = 0
    page_hashes: dict[str, str] = {}
    for programme in expected:
        slug = programme["slug"]
        path = DEPARTMENT_DIR / f"{slug}.html"
        if not path.exists():
            issues.append(f"Missing department page: {path.as_posix()}")
            continue
        static_page_count += 1
        page_hashes[slug] = sha256(path)
        soup = BeautifulSoup(path.read_text(encoding="utf-8"), "html.parser")
        body = soup.body
        if body is None:
            issues.append(f"{slug}: missing body")
            continue
        if body.get("data-programme-slug") != slug:
            issues.append(f"{slug}: body programme slug mismatch")
        if body.get("data-programme-name") != programme["name"]:
            issues.append(f"{slug}: body programme name mismatch")

        sections = soup.select(".semester-subject-section")
        labels = [section.get("data-semester-section") for section in sections]
        expected_labels = [f"Semester {number}" for number in range(1, 7)]
        if labels != expected_labels:
            issues.append(f"{slug}: semester sections are not exactly Semester 1 through Semester 6")

        expected_keys = Counter(
            (
                int(row["semesterNumber"]),
                str(row["code"]).strip().upper(),
                " ".join(str(row["name"]).split()),
            )
            for row in by_programme[slug]
        )
        actual_keys = Counter(card_key(card) for card in soup.select(".subject-card"))
        if actual_keys != expected_keys:
            missing = list((expected_keys - actual_keys).elements())[:20]
            extra = list((actual_keys - expected_keys).elements())[:20]
            issues.append(f"{slug}: static cards differ from verified data; missing={missing} extra={extra}")

        for section_number, section in enumerate(sections, start=1):
            cards = section.select(".subject-card")
            for card in cards:
                if card.get("data-semester") != f"Semester {section_number}":
                    issues.append(
                        f"{slug}: {card.get('data-subject-code')} is placed in the wrong semester section"
                    )

    report = {
        "scheme": "REV2026",
        "verifiedAt": datetime.now(timezone.utc).isoformat(),
        "officialIndex": INDEX,
        "programmeCount": len(expected),
        "subjectCount": len(subjects),
        "staticPageCount": static_page_count,
        "directoryProgrammeCardCount": len(programme_cards),
        "semesterSourceCounts": dict(sorted(source_counts.items())),
        "programmeSubjectCounts": programme_subject_counts,
        "programmeSemesterCounts": programme_semester_counts,
        "dataHashes": {
            "programmes": sha256(REGISTRY),
            "subjects": sha256(SUBJECTS),
            "directory": sha256(INDEX_PAGE),
        },
        "departmentPageHashes": page_hashes,
        "issues": issues,
        "status": "passed" if not issues else "failed",
    }
    REPORT.parent.mkdir(exist_ok=True)
    REPORT.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    if issues:
        raise SystemExit("REV2026 catalogue verification failed:\n- " + "\n- ".join(issues))
    print(
        f"Verified all 38 departments, {len(subjects)} subject rows, six semesters per department, "
        f"and {static_page_count} static pages."
    )


if __name__ == "__main__":
    main()
