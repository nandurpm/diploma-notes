# Purpose: Rebuild rev2026 subjects from pages - Descriptive comment added for clarity
#!/usr/bin/env python3
from __future__ import annotations

import json
import re
from pathlib import Path

from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[1]
PROGRAMMES = ROOT / "assets/data/revision-2026-programmes.json"
OUTPUT = ROOT / "assets/data/revision-2026-subjects.json"
PAGES = ROOT / "revision-2026"


def main() -> int:
    programmes = json.loads(PROGRAMMES.read_text(encoding="utf-8"))["programmes"]
    rows: list[dict[str, object]] = []
    missing: list[str] = []

    for programme in programmes:
        slug = str(programme["slug"])
        page = PAGES / f"{slug}.html"
        if not page.exists():
            missing.append(slug)
            continue

        soup = BeautifulSoup(page.read_text(encoding="utf-8"), "html.parser")
        seen: set[tuple[str, int]] = set()
        for card in soup.select("article.subject-card[data-subject-code]"):
            code = str(card.get("data-subject-code", "")).strip().upper()
            semester_text = str(card.get("data-semester", ""))
            semester_match = re.search(r"([1-6])", semester_text)
            title_tag = card.find("h3")
            title = title_tag.get_text(" ", strip=True) if title_tag else "Course"
            if not code or not semester_match:
                continue
            semester = int(semester_match.group(1))
            key = (code, semester)
            if key in seen:
                continue
            seen.add(key)
            rows.append({
                "programme": programme["name"],
                "programmeCode": programme["officialCode"],
                "programmeSlug": slug,
                "semester": f"Semester {semester}",
                "semesterNumber": semester,
                "code": code,
                "name": " ".join(title.split()),
                "type": "Course",
            })

    if missing:
        raise SystemExit("Missing department pages: " + ", ".join(missing))

    empty = [
        str(programme["slug"])
        for programme in programmes
        if not any(row["programmeSlug"] == programme["slug"] for row in rows)
    ]
    if empty:
        raise SystemExit("No subject cards found for: " + ", ".join(empty))

    OUTPUT.write_text(json.dumps(rows, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Rebuilt {len(rows)} REV2026 subject records from {len(programmes)} department pages")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
