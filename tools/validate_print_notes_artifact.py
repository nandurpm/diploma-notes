#!/usr/bin/env python3
"""Validate the built public artifact for the lesson-based print-to-PDF notes flow."""
from __future__ import annotations

import sys
from pathlib import Path

from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_TARGET = ROOT / "_site"


def normalized_text(value: str) -> str:
    return " ".join(value.split()).casefold()


def main() -> int:
    target = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else DEFAULT_TARGET.resolve()
    if not target.is_dir():
        print(f"ERROR: Artifact directory does not exist: {target}")
        return 2

    note_pdfs = sorted(target.glob("**/notes/*.pdf"))
    legacy_refs: list[str] = []
    invalid_buttons: list[str] = []
    button_count = 0
    lesson_pages = sorted(target.glob("lessons/lessons-*.html")) + sorted(
        target.glob("revision-2026-content/lessons/lessons-*.html")
    )
    lessons_without_runtime: list[str] = []

    for path in sorted(target.glob("**/*.html")):
        relative = path.relative_to(target).as_posix()
        source = path.read_text(encoding="utf-8", errors="replace")
        soup = BeautifulSoup(source, "html.parser")
        attribute_values = " ".join(
            str(value)
            for element in soup.find_all(True)
            for value in element.attrs.values()
        )
        if "downloadable-notes-" in attribute_values:
            legacy_refs.append(relative)
        if path in lesson_pages and "lesson-navigation-fix.js" not in source:
            lessons_without_runtime.append(relative)
        for anchor in soup.find_all("a"):
            if normalized_text(anchor.get_text(" ", strip=True)) != "save as pdf":
                continue
            button_count += 1
            href = str(anchor.get("href", ""))
            problems: list[str] = []
            if "autoPrintNotes=1" not in href:
                problems.append("missing ?autoPrintNotes=1")
            if anchor.has_attr("download"):
                problems.append("has download attribute")
            if str(anchor.get("target", "")).casefold() == "_blank":
                problems.append("opens a new window")
            if problems:
                invalid_buttons.append(f"{relative}: {', '.join(problems)} ({anchor})")

    report = {
        "artifact": str(target),
        "note_pdf_files": len(note_pdfs),
        "legacy_pdf_reference_files": len(legacy_refs),
        "save_as_pdf_buttons": button_count,
        "invalid_save_as_pdf_buttons": len(invalid_buttons),
        "lesson_pages": len(lesson_pages),
        "lesson_pages_without_shared_runtime": len(lessons_without_runtime),
    }
    for key, value in report.items():
        print(f"{key}: {value}")

    if note_pdfs:
        print("Note PDFs present:")
        print("\n".join(f"- {path.relative_to(target)}" for path in note_pdfs[:20]))
    if legacy_refs:
        print("Files with legacy note PDF references:")
        print("\n".join(f"- {path}" for path in legacy_refs[:20]))
    if invalid_buttons:
        print("Invalid Save as PDF actions:")
        print("\n".join(f"- {item}" for item in invalid_buttons[:20]))
    if lessons_without_runtime:
        print("Lessons without the shared runtime:")
        print("\n".join(f"- {item}" for item in lessons_without_runtime[:20]))

    return 0 if not (note_pdfs or legacy_refs or invalid_buttons or lessons_without_runtime) else 1


if __name__ == "__main__":
    raise SystemExit(main())
