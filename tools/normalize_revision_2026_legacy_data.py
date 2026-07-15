#!/usr/bin/env python3
"""Normalize the existing REV2026 snapshot while the official sync is unavailable.

The legacy scraper attached incorrect semester labels to many rows. Kerala diploma
course codes use the leading digit for semester placement, so this script repairs
the stored snapshot deterministically, preserves suffix codes, and lets the static
page builder generate Semester 1 through Semester 6 in the correct order.
"""

from __future__ import annotations

import json
from pathlib import Path

DATA = Path("assets/data/revision-2026-subjects.json")


def main() -> None:
    payload = json.loads(DATA.read_text(encoding="utf-8"))
    subjects = payload.get("subjects", [])
    changed = 0
    invalid: list[str] = []

    for subject in subjects:
        code = str(subject.get("code", "")).strip().upper()
        if not code or code[0] not in "123456":
            invalid.append(code or "<empty>")
            continue
        number = int(code[0])
        expected = f"Semester {number}"
        if subject.get("semester") != expected or subject.get("semesterNumber") != number:
            changed += 1
        subject["semester"] = expected
        subject["semesterNumber"] = number
        if subject.get("semesterSource") not in {"row", "official-table-section"}:
            subject["semesterSource"] = "legacy-course-code-normalization"

    if invalid:
        raise SystemExit(f"Invalid course codes found: {invalid[:20]}")

    subjects.sort(
        key=lambda row: (
            str(row.get("programme", "")).casefold(),
            int(row.get("semesterNumber", 99)),
            str(row.get("code", "")),
            str(row.get("name", "")).casefold(),
        )
    )
    payload["semesterNormalization"] = {
        "method": "course-code-leading-digit",
        "changedRows": changed,
        "reason": "Legacy scraper semester labels were not aligned with official Semester 1-6 ordering.",
    }
    payload["subjects"] = subjects
    DATA.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Normalized {len(subjects)} rows; changed={changed}")


if __name__ == "__main__":
    main()
