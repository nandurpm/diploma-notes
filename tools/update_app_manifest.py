from __future__ import annotations

import argparse
import hashlib
import json
import re
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DOWNLOADS_DIR = ROOT / "downloads"
MANIFEST_PATH = DOWNLOADS_DIR / "app-update.json"
INDEX_PATH = ROOT / "index.html"
GRADLE_PATH = ROOT / "android-app/app/build.gradle"
APK_PATTERN = re.compile(r"^Polytechnic-Study-Hub-v(?P<version>\d+(?:\.\d+){1,3})\.apk$")


def version_key(value: str) -> tuple[int, ...]:
    parts = tuple(int(part) for part in value.split("."))
    return parts + (0,) * (4 - len(parts))


def latest_apk() -> tuple[Path, str]:
    candidates: list[tuple[tuple[int, ...], Path, str]] = []
    for path in DOWNLOADS_DIR.glob("Polytechnic-Study-Hub-v*.apk"):
        match = APK_PATTERN.fullmatch(path.name)
        if match:
            version = match.group("version")
            candidates.append((version_key(version), path, version))
    if not candidates:
        raise RuntimeError("No versioned Polytechnic Study Hub APK exists in downloads/.")
    _, path, version = max(candidates, key=lambda item: item[0])
    return path, version


def gradle_version() -> tuple[int | None, str | None]:
    if not GRADLE_PATH.exists():
        return None, None
    source = GRADLE_PATH.read_text(encoding="utf-8")
    code_match = re.search(r"\bversionCode\s+(\d+)", source)
    name_match = re.search(r"\bversionName\s+['\"]([^'\"]+)['\"]", source)
    return (
        int(code_match.group(1)) if code_match else None,
        name_match.group(1) if name_match else None,
    )


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def existing_manifest() -> dict:
    if not MANIFEST_PATH.exists():
        return {}
    return json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))


def build_manifest(apk_path: Path, version_name: str) -> dict:
    previous = existing_manifest()
    gradle_code, gradle_name = gradle_version()
    version_code = gradle_code if gradle_name == version_name else previous.get("versionCode")

    same_release = previous.get("versionName") == version_name
    return {
        "schemaVersion": 1,
        "versionCode": version_code,
        "versionName": version_name,
        "apkUrl": f"/downloads/{apk_path.name}",
        "sha256": sha256(apk_path),
        "publishedAt": previous.get("publishedAt") if same_release else date.today().isoformat(),
        "forceUpdate": bool(previous.get("forceUpdate", False)) if same_release else False,
        "title": previous.get("title") if same_release else f"Polytechnic Study Hub {version_name} is available",
        "message": previous.get("message") if same_release else "A newer and more secure version of Polytechnic Study Hub is ready to install.",
        "releaseNotes": previous.get("releaseNotes", []) if same_release else [],
    }


def update_index(source: str, apk_path: Path, version_name: str) -> str:
    replacement = f'href="/downloads/{apk_path.name}" download="{apk_path.name}"'
    apk_link_pattern = re.compile(
        r'href="/downloads/Polytechnic-Study-Hub-v[^\"]+\.apk"\s+'
        r'download="Polytechnic-Study-Hub-v[^\"]+\.apk"'
    )
    updated, count = apk_link_pattern.subn(replacement, source)
    if count == 0:
        raise RuntimeError("Could not find the homepage Android APK download link.")

    app_button_pattern = re.compile(r'<a\b[^>]*\bclass="btn app-download"[^>]*>', re.IGNORECASE)

    def hide_app_button(match: re.Match[str]) -> str:
        tag = re.sub(r'\s+aria-hidden="true"', "", match.group(0), flags=re.IGNORECASE)
        tag = re.sub(r'\s+hidden(?=\s|>)', "", tag, flags=re.IGNORECASE)
        return tag[:-1] + ' aria-hidden="true" hidden>'

    updated, count = app_button_pattern.subn(hide_app_button, updated, count=1)
    if count == 0:
        raise RuntimeError("Could not find the homepage Android app button.")

    cache_token = f"app-{version_name.replace('.', '-')}-update-button-1"
    script_pattern = re.compile(
        r'src="/assets/js/fixed-site-header\.js(?:\?v=[^\"]*)?"'
    )
    updated, count = script_pattern.subn(
        f'src="/assets/js/fixed-site-header.js?v={cache_token}"',
        updated,
        count=1,
    )
    if count == 0:
        raise RuntimeError("Could not find the native-app website script reference.")

    return updated


def main() -> int:
    parser = argparse.ArgumentParser(description="Synchronize the Android APK update manifest and homepage link.")
    parser.add_argument("--check", action="store_true", help="Fail instead of writing when generated files are stale.")
    args = parser.parse_args()

    apk_path, version_name = latest_apk()
    manifest_text = json.dumps(build_manifest(apk_path, version_name), ensure_ascii=False, indent=2) + "\n"
    index_source = INDEX_PATH.read_text(encoding="utf-8")
    index_text = update_index(index_source, apk_path, version_name)

    stale_manifest = not MANIFEST_PATH.exists() or MANIFEST_PATH.read_text(encoding="utf-8") != manifest_text
    stale_index = index_source != index_text

    if args.check and (stale_manifest or stale_index):
        print("Android update metadata is stale.")
        return 1

    if not args.check:
        DOWNLOADS_DIR.mkdir(parents=True, exist_ok=True)
        MANIFEST_PATH.write_text(manifest_text, encoding="utf-8")
        INDEX_PATH.write_text(index_text, encoding="utf-8")

    action = "Verified" if args.check else "Synchronized"
    print(f"{action} app update metadata for {apk_path.name}.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
