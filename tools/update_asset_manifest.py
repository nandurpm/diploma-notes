from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BROWSER_TARGET = ROOT / "assets/js/subject-browser.js"
MANIFEST_TARGET = ROOT / "assets/js/asset-manifest.js"

ASSET_SPECS = (
    (
        "LESSON_CODES",
        ROOT / "lessons",
        re.compile(r"^lessons-(?P<code>[A-Za-z0-9-]+)\.html$", re.IGNORECASE),
    ),
    (
        "NOTES_CODES",
        ROOT / "notes",
        re.compile(r"^downloadable-notes-(?P<code>[A-Za-z0-9-]+)\.pdf$", re.IGNORECASE),
    ),
)


def natural_key(value: str) -> tuple[object, ...]:
    return tuple(
        int(part) if part.isdigit() else part.casefold()
        for part in re.split(r"(\d+)", value)
        if part
    )


def natural_sorted(codes: set[str] | list[str]) -> list[str]:
    return sorted(set(codes), key=natural_key)


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

    return natural_sorted(codes)


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
            f"Could not find exactly one {name} declaration in {BROWSER_TARGET.relative_to(ROOT)}"
        )
    return updated


def updated_browser_source(path: Path, manifests: dict[str, list[str]]) -> str:
    source = path.read_text(encoding="utf-8")
    for name, codes in manifests.items():
        source = replace_set(source, name, codes)
    return source


def generated_manifest_source(manifests: dict[str, list[str]]) -> str:
    lesson_codes = json.dumps(manifests["LESSON_CODES"], ensure_ascii=False, separators=(",", ":"))
    notes_codes = json.dumps(manifests["NOTES_CODES"], ensure_ascii=False, separators=(",", ":"))
    return (
        "globalThis.POLY_ASSET_MANIFEST = Object.freeze({\n"
        f"  lessonCodes: Object.freeze({lesson_codes}),\n"
        f"  notesCodes: Object.freeze({notes_codes})\n"
        "});\n\n"
        "(() => {\n"
        "  const scripts = [\n"
        "    '/assets/js/ask-poly-config.js',\n"
        "    '/assets/js/ask-poly-remote.js',\n"
        "    '/assets/js/ask-poly-general-ai-extension.js'\n"
        "  ];\n"
        "  const load = (src) => new Promise((resolve) => {\n"
        "    if ([...document.scripts].some((script) => new URL(script.src || '', window.location.href).pathname === src)) { resolve(); return; }\n"
        "    const script = document.createElement('script');\n"
        "    script.src = src;\n"
        "    script.defer = true;\n"
        "    script.addEventListener('load', resolve, { once: true });\n"
        "    script.addEventListener('error', resolve, { once: true });\n"
        "    document.head.append(script);\n"
        "  });\n"
        "  (async () => { for (const src of scripts) await load(src); })();\n"
        "})();\n"
    )


def collect_manifests() -> dict[str, list[str]]:
    manifests = {
        name: collect_codes(directory, filename_pattern)
        for name, directory, filename_pattern in ASSET_SPECS
    }

    # The user-facing Download Notes action points to the PDF generated from a lesson HTML.
    # Therefore every lesson code must be treated as a notes target too. The workflow builds
    # missing PDFs and then rewrites these availability sets again.
    manifests["NOTES_CODES"] = natural_sorted(
        set(manifests["NOTES_CODES"]) | set(manifests["LESSON_CODES"])
    )
    return manifests


def main() -> int:
    parser = argparse.ArgumentParser(
        description=(
            "Synchronize lesson and notes availability in subject-browser.js and "
            "asset-manifest.js with files currently present in the repository."
        )
    )
    parser.add_argument(
        "--check",
        action="store_true",
        help="Fail when either generated availability file is stale.",
    )
    args = parser.parse_args()

    manifests = collect_manifests()

    browser_updated = updated_browser_source(BROWSER_TARGET, manifests)
    manifest_updated = generated_manifest_source(manifests)
    browser_stale = browser_updated != BROWSER_TARGET.read_text(encoding="utf-8")
    manifest_stale = (
        not MANIFEST_TARGET.exists()
        or manifest_updated != MANIFEST_TARGET.read_text(encoding="utf-8")
    )

    if not args.check:
        if browser_stale:
            BROWSER_TARGET.write_text(browser_updated, encoding="utf-8")
        if manifest_stale:
            MANIFEST_TARGET.write_text(manifest_updated, encoding="utf-8")

    lesson_count = len(manifests["LESSON_CODES"])
    notes_count = len(manifests["NOTES_CODES"])

    if args.check and (browser_stale or manifest_stale):
        stale_files = []
        if browser_stale:
            stale_files.append(str(BROWSER_TARGET.relative_to(ROOT)))
        if manifest_stale:
            stale_files.append(str(MANIFEST_TARGET.relative_to(ROOT)))
        print(f"Asset availability is stale in: {', '.join(stale_files)}")
        print(f"Detected {lesson_count} lesson pages and {notes_count} notes targets.")
        return 1

    action = "Verified" if args.check else "Updated"
    print(
        f"{action} availability for {lesson_count} lesson pages "
        f"and {notes_count} notes targets."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())