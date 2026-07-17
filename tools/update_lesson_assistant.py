from __future__ import annotations

import argparse
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LESSON_DIRS = (
    ROOT / "lessons",
    ROOT / "revision-2026-content" / "lessons",
)
ASSISTANT_SCRIPT = '<script src="/assets/js/site-assistant.js?v=20260616-lesson3" defer></script>'
ASSISTANT_ROOT = '<div id="polySiteAssistant"></div>'
LESSON_STANDARD_SCRIPT = '<script src="/assets/js/lesson-navigation-fix.js?v=20260717-fullscreen3" defer></script>'
MARKER = "Ask POLY lesson assistant"
STANDARD_MARKER = "Shared full-screen lesson standard"
SITE_ASSISTANT_TAG_RE = re.compile(r"<script\b[^>]*src=[\"'][^\"']*site-assistant\.js[^\"']*[\"'][^>]*>\s*</script>", re.I)
LESSON_STANDARD_TAG_RE = re.compile(r"<script\b[^>]*src=[\"'][^\"']*lesson-navigation-fix\.js[^\"']*[\"'][^>]*>\s*</script>", re.I)


def update_page(path: Path) -> bool:
    source = path.read_text(encoding="utf-8")
    updated = source

    existing_standard = LESSON_STANDARD_TAG_RE.search(updated)
    if existing_standard:
        updated = updated[: existing_standard.start()] + LESSON_STANDARD_SCRIPT + updated[existing_standard.end() :]
    else:
        assistant_match = SITE_ASSISTANT_TAG_RE.search(updated)
        if assistant_match:
            replacement = f"{LESSON_STANDARD_SCRIPT}\n  {assistant_match.group(0)}"
            updated = updated[: assistant_match.start()] + replacement + updated[assistant_match.end() :]
        elif "</body>" in updated:
            snippet = f"\n  <!-- {STANDARD_MARKER} -->\n  {LESSON_STANDARD_SCRIPT}\n"
            updated = updated.replace("</body>", f"{snippet}</body>", 1)
        else:
            updated = f"{updated.rstrip()}\n<!-- {STANDARD_MARKER} -->\n{LESSON_STANDARD_SCRIPT}\n"

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
        description="Attach the shared full-screen lesson standard and Ask POLY assistant to every REV2021 and REV2026 lesson."
    )
    parser.add_argument(
        "--check",
        action="store_true",
        help="Fail when a lesson page does not load the required shared scripts.",
    )
    args = parser.parse_args()

    pages = lesson_pages()
    if not pages:
        print("No lesson HTML pages were found.")
        return 0

    if args.check:
        missing: list[str] = []
        stale: list[str] = []
        for path in pages:
            text = path.read_text(encoding="utf-8", errors="ignore")
            relative = str(path.relative_to(ROOT))
            if "site-assistant.js" not in text or "lesson-navigation-fix.js" not in text:
                missing.append(relative)
            if "20260717-fullscreen3" not in text:
                stale.append(relative)
        if missing:
            print("Required lesson scripts are missing from:")
            print("\n".join(missing))
            return 1
        if stale:
            print("Shared lesson runtime version is stale in:")
            print("\n".join(stale))
            return 1
        print(f"Verified full-screen lesson standard on {len(pages)} lesson pages.")
        return 0

    changed = sum(update_page(path) for path in pages)
    print(f"Updated {changed} of {len(pages)} lesson pages across REV2021 and REV2026.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
