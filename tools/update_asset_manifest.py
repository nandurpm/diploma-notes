from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT / "assets/js/subject-browser.js"

ASSET_SPECS = (
    (
        "LESSON_CODES",
        ROOT / "lessons",
        re.compile(r"^lessons-(?P<code>\d+)\.html$", re.IGNORECASE),
    ),
    (
        "NOTES_CODES",
        ROOT / "notes",
        re.compile(r"^downloadable-notes-(?P<code>\d+)\.pdf$", re.IGNORECASE),
    ),
)


def collect_codes(directory: Path, filename_pattern: re.Pattern[str]) -> list[str]:
    codes: set[str] = set()
    if not directory.exists():
        return []

    for path in directory.rglob("*"):
        if not path.is_file():
            continue
        match = filename_pattern.fullmatch(path.name)
        if match:
            codes.add(match.group("code"))

    return sorted(codes, key=lambda code: int(code))


def replace_set(source: str, name: str, codes: list[str]) -> str:
    pattern = re.compile(
        rf"(?ms)^(?P<indent>[ \t]*)const {re.escape(name)} = new Set\(\[.*?\]\);"
    )
    encoded = json.dumps(codes, ensure_ascii=False, separators=(",", ":"))

    def replacement(match: re.Match[str]) -> str:
        return f'{match.group("indent")}const {name} = new Set({encoded});'

    updated, count = pattern.subn(replacement, source, count=1)
    if count != 1:
        raise RuntimeError(
            f"Could not find exactly one {name} declaration in {TARGET.relative_to(ROOT)}"
        )
    return updated


def updated_source(path: Path, manifests: dict[str, list[str]]) -> str:
    source = path.read_text(encoding="utf-8")
    for name, codes in manifests.items():
        source = replace_set(source, name, codes)
    return source


def main() -> int:
    parser = argparse.ArgumentParser(
        description=(
            "Synchronize lesson and notes availability in subject-browser.js "
            "with files currently present in the repository."
        )
    )
    parser.add_argument(
        "--check",
        action="store_true",
        help="Fail when the generated code lists differ from subject-browser.js.",
    )
    args = parser.parse_args()

    manifests = {
        name: collect_codes(directory, filename_pattern)
        for name, directory, filename_pattern in ASSET_SPECS
    }

    updated = updated_source(TARGET, manifests)
    current = TARGET.read_text(encoding="utf-8")
    stale = updated != current

    if stale and not args.check:
        TARGET.write_text(updated, encoding="utf-8")

    lesson_count = len(manifests["LESSON_CODES"])
    notes_count = len(manifests["NOTES_CODES"])

    if args.check and stale:
        print(f"Asset availability manifest is stale in: {TARGET.relative_to(ROOT)}")
        print(f"Detected {lesson_count} lesson pages and {notes_count} notes PDFs.")
        return 1

    action = "Verified" if args.check else "Updated"
    print(
        f"{action} availability for {lesson_count} lesson pages "
        f"and {notes_count} notes PDFs."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
