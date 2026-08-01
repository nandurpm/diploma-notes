# Purpose: Update asset manifest - Descriptive comment added for clarity
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
    (
        "REV2026_LESSON_CODES",
        ROOT / "revision-2026-content" / "lessons",
        re.compile(r"^lessons-(?P<code>[A-Za-z0-9-]+)\.html$", re.IGNORECASE),
    ),
    (
        "REV2026_NOTES_CODES",
        ROOT / "revision-2026-content" / "notes",
        re.compile(r"^downloadable-notes-(?P<code>[A-Za-z0-9-]+)\.pdf$", re.IGNORECASE),
    ),
)
MIN_VALID_PDF_BYTES = 20000


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
    if directory.exists():
        for path in directory.rglob("*"):
            if not path.is_file():
                continue
            match = filename_pattern.fullmatch(path.name)
            if not match:
                continue
            if path.suffix.lower() == ".pdf" and path.stat().st_size < MIN_VALID_PDF_BYTES:
                continue
            codes.add(match.group("code").upper())

    # Dynamic preservation of Revision 2026 git-ignored notes codes from HEAD in clean checkouts
    if directory == ROOT / "revision-2026-content" / "notes":
        try:
            import subprocess
            text = subprocess.check_output(
                ["git", "show", "HEAD:assets/js/asset-manifest.js"],
                cwd=ROOT,
                text=True,
                stderr=subprocess.DEVNULL,
            )
            match = re.search(r'revision2026NotesCodes:\s*Object\.freeze\(\s*(\[[^\]]*\])\s*\)', text)
            if match:
                codes.update(json.loads(match.group(1)))
        except Exception as e:
            print(f"Warning: Failed to preserve existing Revision 2026 note codes from HEAD: {e}")
    if not directory.exists():
        return []

    # If collecting Revision 2026 notes, we also dynamically infer them from lesson files
    # since these PDFs are hosted on CDN/Releases and ignored in git.
    if directory.as_posix().endswith("revision-2026-content/notes"):
        lessons_dir = directory.parent / "lessons"
        if lessons_dir.exists():
            for path in lessons_dir.glob("lessons-*.html"):
                match = re.fullmatch(r"lessons-([A-Za-z0-9-]+)\.html", path.name, re.IGNORECASE)
                if match:
                    codes.add(match.group(1).upper())

    # We always scan the actual directory as well so that any files physically present on disk
    # (such as local build output, checked-in files, or test mocks) are correctly detected.
    for path in directory.rglob("*"):
        if not path.is_file():
            continue
        match = filename_pattern.fullmatch(path.name)
        if not match:
            continue
        if path.suffix.lower() == ".pdf" and path.stat().st_size < MIN_VALID_PDF_BYTES:
            continue
        codes.add(match.group("code").upper())

    return natural_sorted(codes)


def replace_set_if_present(source: str, name: str, codes: list[str]) -> str:
    pattern = re.compile(
        rf"(?ms)^(?P<indent>[ \t]*)const {re.escape(name)} = new Set\(\[.*?\]\);"
    )
    encoded = json.dumps(codes, ensure_ascii=False, separators=(",", ":"))

    def replacement(match: re.Match[str]) -> str:
        return f'{match.group("indent")}const {name} = new Set({encoded});'

    updated, count = pattern.subn(replacement, source, count=1)
    if count != 1:
        raise RuntimeError(
            f"Expected one {name} declaration in {BROWSER_TARGET.relative_to(ROOT)}, found {count}"
        )
    return updated


def updated_browser_source(path: Path, manifests: dict[str, list[str]]) -> str:
    source = path.read_text(encoding="utf-8")
    for name in (
        "LESSON_CODES",
        "NOTES_CODES",
        "REV2026_LESSON_CODES",
        "REV2026_NOTES_CODES",
    ):
        source = replace_set_if_present(source, name, manifests[name])
    return source


def generated_manifest_source(manifests: dict[str, list[str]]) -> str:
    lesson_codes = json.dumps(
        manifests["LESSON_CODES"], ensure_ascii=False, separators=(",", ":")
    )
    notes_codes = json.dumps(
        manifests["NOTES_CODES"], ensure_ascii=False, separators=(",", ":")
    )
    revision_2026_lesson_codes = json.dumps(
        manifests["REV2026_LESSON_CODES"],
        ensure_ascii=False,
        separators=(",", ":"),
    )
    revision_2026_notes_codes = json.dumps(
        manifests["REV2026_NOTES_CODES"],
        ensure_ascii=False,
        separators=(",", ":"),
    )
    return (
        "globalThis.POLY_ASSET_MANIFEST = Object.freeze({\n"
        f"  lessonCodes: Object.freeze({lesson_codes}),\n"
        f"  notesCodes: Object.freeze({notes_codes}),\n"
        f"  revision2026LessonCodes: Object.freeze({revision_2026_lesson_codes}),\n"
        f"  revision2026NotesCodes: Object.freeze({revision_2026_notes_codes}),\n"
        "  revisions: Object.freeze({\n"
        "    2021: Object.freeze({\n"
        f"      lessonCodes: Object.freeze({lesson_codes}),\n"
        f"      notesCodes: Object.freeze({notes_codes})\n"
        "    }),\n"
        "    2026: Object.freeze({\n"
        f"      lessonCodes: Object.freeze({revision_2026_lesson_codes}),\n"
        f"      notesCodes: Object.freeze({revision_2026_notes_codes})\n"
        "    })\n"
        "  })\n"
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
    return {
        name: collect_codes(directory, filename_pattern)
        for name, directory, filename_pattern in ASSET_SPECS
    }


def main() -> int:
    parser = argparse.ArgumentParser(
        description=(
            "Synchronize Revision 2021 and Revision 2026 lesson/PDF availability "
            "without mixing their folders."
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

    counts = {
        "revision2021Lessons": len(manifests["LESSON_CODES"]),
        "revision2021Notes": len(manifests["NOTES_CODES"]),
        "revision2026Lessons": len(manifests["REV2026_LESSON_CODES"]),
        "revision2026Notes": len(manifests["REV2026_NOTES_CODES"]),
    }

    if args.check and (browser_stale or manifest_stale):
        stale_files = []
        if browser_stale:
            stale_files.append(str(BROWSER_TARGET.relative_to(ROOT)))
        if manifest_stale:
            stale_files.append(str(MANIFEST_TARGET.relative_to(ROOT)))
        print(f"Asset availability is stale in: {', '.join(stale_files)}")
        print(json.dumps(counts, indent=2))
        return 1

    action = "Verified" if args.check else "Updated"
    print(f"{action} independent lesson and notes availability:")
    print(json.dumps(counts, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
