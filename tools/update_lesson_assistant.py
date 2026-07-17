from __future__ import annotations

import argparse
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LESSON_DIRS = (
    ROOT / "lessons",
    ROOT / "revision-2026-content" / "lessons",
)
LESSON_STANDARD_SCRIPT = '<script src="/assets/js/lesson-navigation-fix.js?v=20260717-fullscreen3" defer></script>'
STANDARD_MARKER = "Shared full-screen lesson standard"
LESSON_STANDARD_TAG_RE = re.compile(r"<script\b[^>]*src=[\"'][^\"']*lesson-navigation-fix\.js[^\"']*[\"'][^>]*>\s*</script>", re.I)


def update_page(path: Path) -> bool:
    source = path.read_text(encoding="utf-8")
    updated = source
    existing_standard = LESSON_STANDARD_TAG_RE.search(updated)

    if existing_standard:
        updated = updated[: existing_standard.start()] + LESSON_STANDARD_SCRIPT + updated[existing_standard.end() :]
    elif "</body>" in updated:
        snippet = f"\n  <!-- {STANDARD_MARKER} -->\n  {LESSON_STANDARD_SCRIPT}\n"
        updated = updated.replace("</body>", f"{snippet}</body>", 1)
    else:
        updated = f"{updated.rstrip()}\n<!-- {STANDARD_MARKER} -->\n{LESSON_STANDARD_SCRIPT}\n"

    if updated == source:
        return False
    path.write_text(updated, encoding="utf-8")
    return True


def lesson_pages() -> list[Path]:
    pages: list[Path] = []
    for directory in LESSON_DIRS:
        if directory.exists():
            pages.extend(path for path in directory.glob("lessons-*.html") if path.is_file())
    return sorted(pages)


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Attach or verify the shared full-screen lesson standard on every REV2021 and REV2026 lesson."
    )
    parser.add_argument(
        "--check",
        action="store_true",
        help="Fail when a lesson page does not load the shared full-screen lesson runtime.",
    )
    args = parser.parse_args()

    pages = lesson_pages()
    if not pages:
        print("No lesson HTML pages were found.")
        return 0

    if args.check:
        missing: list[str] = []
        for path in pages:
            text = path.read_text(encoding="utf-8", errors="ignore")
            if "lesson-navigation-fix.js" not in text:
                missing.append(str(path.relative_to(ROOT)))
        if missing:
            print("Shared lesson runtime is missing from:")
            print("\n".join(missing))
            return 1
        print(f"Verified full-screen lesson runtime on {len(pages)} lesson pages.")
        return 0

    changed = sum(update_page(path) for path in pages)
    print(f"Updated {changed} of {len(pages)} lesson pages across REV2021 and REV2026.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
