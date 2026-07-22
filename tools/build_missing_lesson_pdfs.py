# Purpose: Build missing lesson pdfs - Descriptive comment added for clarity
from __future__ import annotations

from pathlib import Path

import build_lesson_pdfs as builder


def valid_pdf(path: Path) -> bool:
    return path.exists() and path.stat().st_size >= builder.MIN_VALID_PDF_BYTES


def main() -> None:
    all_lessons = builder.lesson_files()
    pending = []
    existing = []
    for code, lesson in all_lessons:
        output = builder.NOTES / f"downloadable-notes-{code}.pdf"
        if valid_pdf(output):
            existing.append(code)
        else:
            pending.append((code, lesson))

    print(f"Lesson HTML files found: {len(all_lessons)}")
    print(f"Existing valid PDFs: {len(existing)}")
    print(f"Missing/invalid PDFs to build: {len(pending)}")
    if pending:
        print("Pending codes:", ", ".join(code for code, _ in pending))

    original_lesson_files = builder.lesson_files
    builder.lesson_files = lambda: pending
    try:
        builder.main()
    finally:
        builder.lesson_files = original_lesson_files


if __name__ == "__main__":
    main()
