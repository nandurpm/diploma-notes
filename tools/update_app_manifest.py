# Purpose: Update app manifest - Descriptive comment added for clarity
from __future__ import annotations

import argparse
import hashlib
import html
import json
import re
from datetime import date
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
DOWNLOADS_DIR = ROOT / "downloads"
MANIFEST_PATH = DOWNLOADS_DIR / "app-update.json"
INDEX_PATH = ROOT / "index.html"
GRADLE_PATH = ROOT / "android-app/app/build.gradle"
APP_BUTTON_MARKER = "<!-- APP_DOWNLOAD_BUTTON -->"
RELEASE_OWNER = "nandurpm"
RELEASE_REPOSITORY = "diploma-notes"
LOCAL_APK_PATTERN = re.compile(
    r"^(?:POLY_PMNA_v|Polytechnic-Study-Hub-v)(?P<version>\d+(?:\.\d+){1,3})\.apk$",
    re.IGNORECASE,
)
APP_BUTTON_PATTERN = re.compile(
    r'\s*<a\b(?=[^>]*\bclass="[^"]*\bapp-download\b[^"]*")[^>]*>.*?</a>',
    re.IGNORECASE | re.DOTALL,
)


def version_key(value: str) -> tuple[int, ...]:
    parts = tuple(int(part) for part in str(value).split(".") if part.isdigit())
    return parts + (0,) * max(0, 4 - len(parts))


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


def existing_manifest() -> dict[str, object]:
    if not MANIFEST_PATH.exists():
        return {}
    return json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))


def trusted_apk_url(value: object) -> str:
    raw = str(value or "").strip()
    if not raw:
        return ""

    if raw.startswith("/downloads/") and raw.lower().endswith(".apk"):
        return raw

    parsed = urlparse(raw)
    if parsed.scheme != "https" or parsed.netloc.lower() != "github.com":
        return ""

    prefix = f"/{RELEASE_OWNER}/{RELEASE_REPOSITORY}/releases/download/"
    if not parsed.path.lower().startswith(prefix.lower()) or not parsed.path.lower().endswith(".apk"):
        return ""
    return raw


def latest_local_apk() -> tuple[Path, str] | None:
    candidates: list[tuple[tuple[int, ...], Path, str]] = []
    if not DOWNLOADS_DIR.exists():
        return None
    for path in DOWNLOADS_DIR.glob("*.apk"):
        match = LOCAL_APK_PATTERN.fullmatch(path.name)
        if not match:
            continue
        version = match.group("version")
        candidates.append((version_key(version), path, version))
    if not candidates:
        return None
    _, path, version = max(candidates, key=lambda item: item[0])
    return path, version


def build_local_manifest(apk_path: Path, version_name: str) -> dict[str, object]:
    previous = existing_manifest()
    gradle_code, gradle_name = gradle_version()
    same_release = str(previous.get("versionName", "")) == version_name
    return {
        "schemaVersion": 1,
        "versionCode": gradle_code if gradle_name == version_name else previous.get("versionCode"),
        "versionName": version_name,
        "apkUrl": f"/downloads/{apk_path.name}",
        "sha256": sha256(apk_path),
        "publishedAt": previous.get("publishedAt") if same_release else date.today().isoformat(),
        "forceUpdate": bool(previous.get("forceUpdate", False)) if same_release else False,
        "title": previous.get("title") if same_release else f"POLY PMNA Android app {version_name}",
        "message": previous.get("message") if same_release else "A newer POLY PMNA Android app is ready to install.",
        "releaseNotes": previous.get("releaseNotes", []) if same_release else [],
    }


def current_published_release() -> tuple[dict[str, object] | None, bool]:
    """Return (manifest, should_write_manifest)."""
    manifest = existing_manifest()
    _, gradle_name = gradle_version()
    manifest_version = str(manifest.get("versionName", "")).strip()
    manifest_url = trusted_apk_url(manifest.get("apkUrl"))

    # GitHub Release assets are the preferred publication method. Keep a valid
    # manifest when it matches the Android source version; never replace it with
    # an older APK merely because that old binary still exists under downloads/.
    if manifest_version and manifest_url and (not gradle_name or manifest_version == gradle_name):
        manifest["apkUrl"] = manifest_url
        return manifest, False

    local_release = latest_local_apk()
    if local_release:
        apk_path, apk_version = local_release
        if not gradle_name or version_key(apk_version) >= version_key(gradle_name):
            return build_local_manifest(apk_path, apk_version), True

    return None, False


def app_button_markup(manifest: dict[str, object]) -> str:
    version = str(manifest["versionName"])
    apk_url = trusted_apk_url(manifest["apkUrl"])
    parsed = urlparse(apk_url)
    filename = Path(parsed.path).name or f"POLY_PMNA_v{version}.apk"
    download_attr = (
        f' download="{html.escape(filename, quote=True)}"'
        if apk_url.startswith("/downloads/")
        else ""
    )
    return (
        f'<a class="btn ghost app-download" data-app-button-state="download" '
        f'href="{html.escape(apk_url, quote=True)}"{download_attr} '
        'type="application/vnd.android.package-archive" '
        f'aria-label="Download POLY PMNA Android app version {html.escape(version, quote=True)}">'
        f'📱 Download Our App v{html.escape(version)}</a>'
    )


def remove_app_button(source: str) -> str:
    updated = APP_BUTTON_PATTERN.sub("", source, count=1)
    if APP_BUTTON_MARKER not in updated:
        raise RuntimeError("Could not find the homepage Android app insertion marker.")
    return updated


def update_index(source: str, manifest: dict[str, object] | None) -> str:
    updated = remove_app_button(source)
    if manifest is not None:
        updated = updated.replace(
            APP_BUTTON_MARKER,
            APP_BUTTON_MARKER + app_button_markup(manifest),
            1,
        )

    version = str(manifest.get("versionName", "pending") if manifest else "pending")
    cache_token = f"app-{version.replace('.', '-')}-download-2"
    script_pattern = re.compile(
        r'src="/assets/js/app-download-controller\.js(?:\?v=[^"]*)?"'
    )
    updated, count = script_pattern.subn(
        f'src="/assets/js/app-download-controller.js?v={cache_token}"',
        updated,
        count=1,
    )
    if count != 1:
        raise RuntimeError("Could not find the homepage app-download controller reference.")
    return updated


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Synchronize the Android update manifest and homepage Download Our App button."
    )
    parser.add_argument("--check", action="store_true", help="Fail instead of writing when generated files are stale.")
    args = parser.parse_args()

    manifest, write_manifest = current_published_release()
    index_source = INDEX_PATH.read_text(encoding="utf-8")
    index_text = update_index(index_source, manifest)
    index_stale = index_source != index_text

    manifest_text = None
    manifest_stale = False
    if manifest is not None and write_manifest:
        manifest_text = json.dumps(manifest, ensure_ascii=False, indent=2) + "\n"
        manifest_stale = (
            not MANIFEST_PATH.exists()
            or MANIFEST_PATH.read_text(encoding="utf-8") != manifest_text
        )

    if args.check and (index_stale or manifest_stale):
        print("Android app download metadata or homepage button is stale.")
        return 1

    if not args.check:
        if manifest_stale and manifest_text is not None:
            DOWNLOADS_DIR.mkdir(parents=True, exist_ok=True)
            MANIFEST_PATH.write_text(manifest_text, encoding="utf-8")
        if index_stale:
            INDEX_PATH.write_text(index_text, encoding="utf-8")

    if manifest is None:
        print("No signed Android release matches the current app source; homepage download remains hidden.")
    else:
        print(
            "Verified" if args.check else "Synchronized",
            f"homepage download for POLY PMNA Android {manifest['versionName']}.",
        )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
