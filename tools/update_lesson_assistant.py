from __future__ import annotations

import argparse
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LESSONS_DIR = ROOT / "lessons"
ASSISTANT_SCRIPT = '<script src="/assets/js/site-assistant.js?v=20260616-lesson3" defer></script>'
ASSISTANT_ROOT = '<div id="polySiteAssistant"></div>'
MARKER = "Ask POLY lesson assistant"


def update_page(path: Path) -> bool:
    source = path.read_text(encoding="utf-8")
    if "site-assistant.js" in source:
        updated = source.replace(
            "/assets/js/site-assistant.js",
            "/assets/js/site-assistant.js",
        )
        return False

    snippet = (
        f"\n  <!-- {MARKER} -->\n"
        f"  {ASSISTANT_ROOT}\n"
        f"  {ASSISTANT_SCRIPT}\n"
    )
    if "</body>" in source:
        updated = source.replace("</body>", f"{snippet}</body>", 1)
    else:
        updated = f"{source.rstrip()}\n{snippet}"

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
        description="Attach the lesson-aware Ask POLY assistant to every lesson HTML page."
    )
    parser.add_argument(
        "--check",
        action="store_true",
        help="Fail when one or more lesson pages do not load Ask POLY.",
    )
    args = parser.parse_args()

    pages = lesson_pages()
    if not pages:
        print("No lesson HTML pages were found.")
        return 0

    if args.check:
        missing = [
            str(path.relative_to(ROOT))
            for path in pages
            if "site-assistant.js" not in path.read_text(encoding="utf-8")
        ]
        if missing:
            print("Ask POLY is missing from:")
            print("\n".join(missing))
            return 1
        print(f"Verified Ask POLY on {len(pages)} lesson pages.")
        return 0

    changed = sum(update_page(path) for path in pages)
    print(f"Updated {changed} of {len(pages)} lesson pages.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
