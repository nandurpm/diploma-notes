# Purpose: Update lesson assistant - Descriptive comment added for clarity
from __future__ import annotations

import argparse
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LESSON_DIRS = (
    ROOT / "lessons",
    ROOT / "revision-2026-content" / "lessons",
)
LESSON_CSS = ROOT / "assets" / "css" / "lesson-page-fix.css"
LESSON_STANDARD_SCRIPT = '<script src="/assets/js/lesson-navigation-fix.js?v=20260718-fullscreen4" defer></script>'
STANDARD_MARKER = "Shared full-screen lesson standard"
CHROME_MARKER = "Full-screen lesson chrome suppression"
CHROME_RULE = f"""

/* {CHROME_MARKER}: no duplicate header/action row inside lesson files. */
html.poly-lesson-page :is(.toolbar,.hb-toolbar,.lesson-toolbar,.lesson-actions,.course-toolbar,.course-nav){{
  display:none!important;
  visibility:hidden!important;
  height:0!important;
  min-height:0!important;
  max-height:0!important;
  margin:0!important;
  padding:0!important;
  border:0!important;
  overflow:hidden!important;
}}
"""
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


def update_shared_css() -> bool:
    source = LESSON_CSS.read_text(encoding="utf-8")
    if CHROME_MARKER in source:
        return False
    LESSON_CSS.write_text(source.rstrip() + CHROME_RULE + "\n", encoding="utf-8")
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
        help="Fail when a lesson page or shared CSS does not follow the full-screen lesson standard.",
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
            if "lesson-navigation-fix.js" not in text:
                missing.append(relative)
            elif "20260718-fullscreen4" not in text:
                stale.append(relative)
        errors: list[str] = []
        if missing:
            errors.append("Shared lesson runtime is missing from:\n" + "\n".join(missing))
        if stale:
            errors.append("Shared lesson runtime reference is stale in:\n" + "\n".join(stale))
        if CHROME_MARKER not in LESSON_CSS.read_text(encoding="utf-8", errors="ignore"):
            errors.append("Shared lesson CSS does not suppress toolbar-style duplicate lesson chrome.")
        if errors:
            print("\n".join(errors))
            return 1
        print(f"Verified full-screen lesson standard on {len(pages)} lesson pages.")
        return 0

    changed = sum(update_page(path) for path in pages)
    css_changed = update_shared_css()
    print(
        f"Updated {changed} of {len(pages)} lesson pages across REV2021 and REV2026; "
        f"shared CSS changed: {css_changed}."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
