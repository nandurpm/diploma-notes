from __future__ import annotations

import json
import re
from pathlib import Path

import build_lesson_pdfs as builder

ROOT = Path.cwd()
LESSONS = ROOT / "revision-2026-content" / "lessons"
NOTES = ROOT / "revision-2026-content" / "notes"
REPORT = ROOT / "reports" / "revision-2026-lesson-notes-pdf-build.json"


def lesson_files() -> list[tuple[str, Path]]:
    items: list[tuple[str, Path]] = []
    if not LESSONS.exists():
        return items
    for path in sorted(LESSONS.glob("lessons-*.html")):
        match = re.fullmatch(r"lessons-([0-9]+[A-Za-z]*)\.html", path.name)
        if match:
            items.append((match.group(1).upper(), path))
    return items


def valid_pdf(path: Path) -> bool:
    return path.exists() and path.stat().st_size >= builder.MIN_VALID_PDF_BYTES


def main() -> None:
    NOTES.mkdir(parents=True, exist_ok=True)
    REPORT.parent.mkdir(parents=True, exist_ok=True)

    all_lessons = lesson_files()
    pending = [
        (code, lesson)
        for code, lesson in all_lessons
        if not valid_pdf(NOTES / f"downloadable-notes-{code}.pdf")
    ]

    print(f"Revision 2026 lesson HTML files found: {len(all_lessons)}")
    print(f"Revision 2026 missing/invalid PDFs to build: {len(pending)}")
    if pending:
        print("Pending Revision 2026 codes:", ", ".join(code for code, _ in pending))

    builder.LESSONS = LESSONS
    builder.NOTES = NOTES
    builder.PRESERVE_EXISTING_PDF_CODES = set()
    builder.lesson_files = lambda: pending

    generated, errors = builder.render_all()
    generated_codes = sorted(str(item["code"]) for item in generated)
    required_codes = sorted(code for code, _ in all_lessons)
    missing_codes = sorted(set(required_codes) - {
        path.stem.removeprefix("downloadable-notes-").upper()
        for path in NOTES.glob("downloadable-notes-*.pdf")
        if valid_pdf(path)
    })

    payload = {
        "revision": "2026",
        "lessonFolder": "revision-2026-content/lessons",
        "notesFolder": "revision-2026-content/notes",
        "generated": generated,
        "errors": errors,
        "requiredLessonCodes": required_codes,
        "generatedThisRunCodes": generated_codes,
        "missingCodes": missing_codes,
        "renderer": "Playwright Chromium through local HTTP server",
        "minimumPdfBytes": builder.MIN_VALID_PDF_BYTES,
    }
    REPORT.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")

    if missing_codes or errors:
        print("Revision 2026 notes generation completed with warnings.")
        print(json.dumps({"missingCodes": missing_codes, "errors": errors}, indent=2))


if __name__ == "__main__":
    main()
