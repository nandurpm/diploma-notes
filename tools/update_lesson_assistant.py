from __future__ import annotations

import argparse
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LESSONS_DIR = ROOT / "lessons"
ASSISTANT_SCRIPT = '<script src="/assets/js/site-assistant.js?v=20260616-lesson3" defer></script>'
ASSISTANT_ROOT = '<div id="polySiteAssistant"></div>'
NAV_FIX_SCRIPT = '<script src="/assets/js/lesson-navigation-fix.js?v=20260630-1" defer></script>'
MARKER = "Ask POLY lesson assistant"
NAV_MARKER = "Lesson navigation back-button fix"


def update_page(path: Path) -> bool:
    source = path.read_text(encoding="utf-8")
    updated = source

    if "site-assistant.js" not in updated:
        assistant_snippet = (
            f"\n  <!-- {MARKER} -->\n"
            f"  {ASSISTANT_ROOT}\n"
            f"  {ASSISTANT_SCRIPT}\n"
        )
        if "</body>" in updated:
            updated = updated.replace("</body>", f"{assistant_snippet}</body>", 1)
        else:
            updated = f"{updated.rstrip()}\n{assistant_snippet}"

    if "lesson-navigation-fix.js" not in updated:
        nav_snippet = (
            f"\n  <!-- {NAV_MARKER} -->\n"
            f"  {NAV_FIX_SCRIPT}\n"
        )
        if "site-assistant.js" in updated:
            updated = updated.replace(ASSISTANT_SCRIPT, f"{NAV_FIX_SCRIPT}\n  {ASSISTANT_SCRIPT}", 1)
        elif "</body>" in updated:
            updated = updated.replace("</body>", f"{nav_snippet}</body>", 1)
        else:
            updated = f"{updated.rstrip()}\n{nav_snippet}"

    if updated == source:
        return False
    path.write_text(updated, encoding="utf-8")
    return True


def lesson_pages() -> list[Path]:
    if not LESSONS_DIR.exists():
        return []
    return sorted(path for path in LESSONS_DIR.rglob("*.html") if path.is_file())


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Attach the lesson-aware Ask POLY assistant and lesson navigation fix to every lesson HTML page."
    )
    parser.add_argument(
        "--check",
        action="store_true",
        help="Fail when one or more lesson pages do not load required lesson scripts.",
    )
    args = parser.parse_args()

    pages = lesson_pages()
    if not pages:
        print("No lesson HTML pages were found.")
        return 0

    if args.check:
        missing = []
        for path in pages:
            text = path.read_text(encoding="utf-8")
            if "site-assistant.js" not in text or "lesson-navigation-fix.js" not in text:
                missing.append(str(path.relative_to(ROOT)))
        if missing:
            print("Required lesson scripts are missing from:")
            print("\n".join(missing))
            return 1
        print(f"Verified Ask POLY and navigation fix on {len(pages)} lesson pages.")
        return 0

    changed = sum(update_page(path) for path in pages)
    print(f"Updated {changed} of {len(pages)} lesson pages.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
