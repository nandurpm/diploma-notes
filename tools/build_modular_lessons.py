# Purpose: Build modular lessons - Descriptive comment added for clarity
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LESSONS = ROOT / "lessons"
SOURCES = ROOT / "lesson-sources"

SLOT_PATTERN = re.compile(
    r'<div\s+class="fragment-slot"\s+data-fragment="(?P<path>[^"]+)"[^>]*>.*?</div>',
    re.IGNORECASE | re.DOTALL,
)


def source_path_for(lesson: Path) -> Path:
    return SOURCES / f"{lesson.stem}.template.html"


def compile_lesson(lesson: Path) -> bool:
    template = source_path_for(lesson)
    current = lesson.read_text(encoding="utf-8")

    if not template.exists():
        if not SLOT_PATTERN.search(current):
            return False
        SOURCES.mkdir(parents=True, exist_ok=True)
        template.write_text(current, encoding="utf-8")

    source = template.read_text(encoding="utf-8")
    slots = list(SLOT_PATTERN.finditer(source))
    if not slots:
        raise RuntimeError(f"No fragment slots found in {template.relative_to(ROOT)}")

    used_fragments: list[str] = []

    def replace_slot(match: re.Match[str]) -> str:
        fragment_ref = match.group("path")
        fragment = ROOT / fragment_ref.lstrip("/")
        if not fragment.is_file():
            raise FileNotFoundError(
                f"Missing fragment {fragment_ref} referenced by {template.relative_to(ROOT)}"
            )
        used_fragments.append(fragment_ref)
        content = fragment.read_text(encoding="utf-8").strip()
        return (
            f"<!-- BEGIN INLINED FRAGMENT: {fragment_ref} -->\n"
            f"{content}\n"
            f"<!-- END INLINED FRAGMENT: {fragment_ref} -->"
        )

    compiled = SLOT_PATTERN.sub(replace_slot, source)
    if "fragment-slot" in compiled:
        raise RuntimeError(f"Unresolved fragment slot remains in {lesson.relative_to(ROOT)}")

    changed = compiled != current
    if changed:
        lesson.write_text(compiled, encoding="utf-8")

    print(
        f"Compiled {lesson.relative_to(ROOT)} from {len(used_fragments)} fragments"
        f" ({'updated' if changed else 'unchanged'})."
    )
    return changed


def main() -> int:
    changed_count = 0
    for lesson in sorted(LESSONS.glob("lessons-*.html")):
        if compile_lesson(lesson):
            changed_count += 1
    print(f"Standalone lesson compilation complete: {changed_count} file(s) updated.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
