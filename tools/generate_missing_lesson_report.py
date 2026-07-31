# Purpose: Generate missing lesson report - Descriptive comment added for clarity
from __future__ import annotations

import csv
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SUBJECTS_FILE = ROOT / "assets/js/subjects.js"
LESSONS_DIR = ROOT / "lessons"
REPORT = ROOT / "reports/missing-theory-drawing-lessons.csv"

PATTERN = re.compile(
    r'\{\s*revision:\s*"(?P<revision>[^"]+)",\s*code:\s*"(?P<code>[^"]+)",\s*name:\s*"(?P<name>[^"]+)",\s*department:\s*"(?P<department>[^"]+)",\s*semester:\s*"(?P<semester>[^"]+)",\s*type:\s*"(?P<type>[^"]+)"\s*\}',
    re.S,
)


def semester_sort_key(value: str) -> tuple[int, str]:
    """Sort numbered semesters first without crashing on labels such as 'Yearly'."""
    match = re.search(r"\d+", value)
    return (int(match.group()) if match else 999, value.casefold())


def main() -> None:
    source = SUBJECTS_FILE.read_text(encoding="utf-8")
    subjects = [match.groupdict() for match in PATTERN.finditer(source)]
    lesson_codes = {
        match.group(1)
        for path in LESSONS_DIR.glob("lessons-*.html")
        if (match := re.fullmatch(r"lessons-(.+)\.html", path.name, re.I))
    }

    missing = [
        item
        for item in subjects
        if item["revision"] == "2021"
        and item["type"] in {"Theory", "Drawing"}
        and item["code"] not in lesson_codes
    ]
    missing.sort(key=lambda item: (item["department"], semester_sort_key(item["semester"]), item["code"], item["name"]))

    REPORT.parent.mkdir(parents=True, exist_ok=True)
    with REPORT.open("w", newline="", encoding="utf-8-sig") as handle:
        writer = csv.DictWriter(
            handle,
            fieldnames=["department", "semester", "code", "subject", "type", "expected_lesson_file"],
        )
        writer.writeheader()
        for item in missing:
            writer.writerow({
                "department": item["department"],
                "semester": item["semester"],
                "code": item["code"],
                "subject": item["name"],
                "type": item["type"],
                "expected_lesson_file": f'lessons/lessons-{item["code"]}.html',
            })

    print(f"Wrote {len(missing)} missing Theory/Drawing lesson entries to {REPORT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
