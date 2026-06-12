from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TARGETS = (
    ROOT / "assets/js/main.js",
    ROOT / "assets/js/site-hardening.js",
)
ASSET_DIRECTORIES = (
    (ROOT / "lessons", {".html"}),
    (ROOT / "notes", {".pdf"}),
)
MANIFEST_PATTERN = re.compile(
    r"(?m)^(?P<indent>[ \t]*)const knownLocalAssets = new Set\(\[[^\n]*\]\);$"
)


def collect_assets() -> list[str]:
    assets: set[str] = set()
    for directory, suffixes in ASSET_DIRECTORIES:
        if not directory.exists():
            continue
        for path in directory.rglob("*"):
            if path.is_file() and path.suffix.lower() in suffixes:
                assets.add("/" + path.relative_to(ROOT).as_posix())
    return sorted(assets)


def updated_source(path: Path, assets: list[str]) -> str:
    source = path.read_text(encoding="utf-8")
    encoded = json.dumps(assets, ensure_ascii=False, separators=(",", ":"))

    def replacement(match: re.Match[str]) -> str:
        return f'{match.group("indent")}const knownLocalAssets = new Set({encoded});'

    updated, count = MANIFEST_PATTERN.subn(replacement, source, count=1)
    if count != 1:
        raise RuntimeError(f"Could not find exactly one knownLocalAssets declaration in {path.relative_to(ROOT)}")
    return updated


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Synchronize lesson and notes file availability with the website buttons."
    )
    parser.add_argument(
        "--check",
        action="store_true",
        help="Fail when the generated asset list differs from the committed JavaScript files.",
    )
    args = parser.parse_args()

    assets = collect_assets()
    stale: list[Path] = []

    for path in TARGETS:
        updated = updated_source(path, assets)
        current = path.read_text(encoding="utf-8")
        if updated == current:
            continue
        stale.append(path)
        if not args.check:
            path.write_text(updated, encoding="utf-8")

    if args.check and stale:
        names = ", ".join(str(path.relative_to(ROOT)) for path in stale)
        print(f"Asset availability manifest is stale in: {names}")
        return 1

    action = "Verified" if args.check else "Updated"
    print(f"{action} {len(assets)} local lesson/note assets.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
