#!/usr/bin/env python3
"""Fail when any REV2026 subject card still uses a generic category label."""

from __future__ import annotations

import json
from collections import Counter
from pathlib import Path

DATA = Path("assets/data/revision-2026-subjects.json")
REPORT = Path("reports/revision-2026-title-verification.json")
GENERIC = {
    "programme core course",
    "program core course",
    "programme elective course",
    "program elective course",
    "open elective course",
}


def normalise(value: object) -> str:
    return " ".join(str(value or "").split())


def main() -> None:
    payload = json.loads(DATA.read_text(encoding="utf-8"))
    subjects = list(payload.get("subjects", []))
    generic_rows = [
        {
            "programme": row.get("programme"),
            "programmeSlug": row.get("programmeSlug"),
            "semester": row.get("semester"),
            "code": row.get("code"),
            "name": row.get("name"),
            "syllabusUrl": row.get("syllabusUrl"),
        }
        for row in subjects
        if normalise(row.get("name")).casefold() in GENERIC
    ]
    missing_sources = [
        {
            "programmeSlug": row.get("programmeSlug"),
            "code": row.get("code"),
            "name": row.get("name"),
        }
        for row in subjects
        if row.get("titleSource") is not None and not normalise(row.get("titleSource"))
    ]
    source_counts = Counter(
        normalise(row.get("titleSource"))
        for row in subjects
        if normalise(row.get("titleSource"))
    )
    report = {
        "scheme": payload.get("scheme"),
        "subjectCount": len(subjects),
        "genericTitleCount": len(generic_rows),
        "missingTitleSourceCount": len(missing_sources),
        "titleSourceCounts": dict(sorted(source_counts.items())),
        "genericRows": generic_rows,
        "missingTitleSources": missing_sources,
        "status": "passed" if not generic_rows and not missing_sources else "failed",
    }
    REPORT.parent.mkdir(exist_ok=True)
    REPORT.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    if generic_rows or missing_sources:
        raise SystemExit(
            f"REV2026 title verification failed: generic={len(generic_rows)} "
            f"missingTitleSource={len(missing_sources)}"
        )
    print(
        f"Verified {len(subjects)} REV2026 rows with zero generic subject titles. "
        f"Resolved-title sources={dict(sorted(source_counts.items()))}"
    )


if __name__ == "__main__":
    main()
