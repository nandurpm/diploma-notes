#!/usr/bin/env python3
"""Apply deployment-only optimizations to a prepared public directory."""
from __future__ import annotations

import argparse
import hashlib
import json
import re
from pathlib import Path, PurePosixPath
from urllib.parse import urlsplit, urlunsplit

CSS_LINK_RE = re.compile(
    r'<link\b(?=[^>]*\brel=["\']stylesheet["\'])[^>]*\bhref=["\'](?P<href>/assets/css/[^"\']+)["\'][^>]*>\s*',
    re.I,
)
CSS_URL_RE = re.compile(r'url\((?P<quote>["\']?)(?P<url>[^)"\']+)(?P=quote)\)', re.I)


def clean_asset_path(value: str) -> str:
    return urlsplit(value).path.lstrip("/")


def rebased_css(text: str, source_url: str) -> str:
    base = PurePosixPath(urlsplit(source_url).path).parent

    def replace(match: re.Match[str]) -> str:
        raw = match.group("url").strip()
        if not raw or raw.startswith(("/", "data:", "blob:", "http://", "https://", "#")):
            return match.group(0)
        split = urlsplit(raw)
        joined = (base / split.path).as_posix()
        normalized = str(PurePosixPath(joined))
        if not normalized.startswith("/"):
            normalized = "/" + normalized
        updated = urlunsplit((split.scheme, split.netloc, normalized, split.query, split.fragment))
        quote = match.group("quote") or ""
        return f"url({quote}{updated}{quote})"

    return CSS_URL_RE.sub(replace, text)


def bundle_home(root: Path) -> str | None:
    page = root / "index.html"
    if not page.is_file():
        raise FileNotFoundError("index.html is missing from the prepared public directory")
    original = page.read_text(encoding="utf-8")
    matches = list(CSS_LINK_RE.finditer(original))
    if len(matches) < 2:
        print("Homepage CSS is already bundled or has fewer than two local stylesheets.")
        return None

    pieces: list[str] = []
    for match in matches:
        href = match.group("href")
        source = root / clean_asset_path(href)
        if not source.is_file():
            raise FileNotFoundError(f"Homepage stylesheet is missing: {source.relative_to(root)}")
        pieces.append(f"/* {href} */\n{rebased_css(source.read_text(encoding='utf-8'), href).strip()}\n")

    combined = "\n".join(pieces).encode("utf-8")
    digest = hashlib.sha256(combined).hexdigest()[:16]
    output = root / "assets" / "build" / f"home.{digest}.css"
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_bytes(combined)
    link = f'<link rel="stylesheet" href="/assets/build/{output.name}">\n'
    first_start = matches[0].start()
    without_links = CSS_LINK_RE.sub("", original)
    # Insert the bundle where the first local stylesheet previously appeared.
    removed_before = sum(match.end() - match.start() for match in matches if match.end() <= first_start)
    insertion = first_start - removed_before
    optimized = without_links[:insertion] + link + without_links[insertion:]
    page.write_text(optimized, encoding="utf-8")
    return output.relative_to(root).as_posix()


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", type=Path, required=True)
    args = parser.parse_args()
    root = args.root.resolve()
    if not root.is_dir():
        raise SystemExit(f"Public directory does not exist: {root}")
    output = bundle_home(root)
    report = {
        "homepageCssBundle": output,
        "homepageStylesheetCount": len(CSS_LINK_RE.findall((root / "index.html").read_text(encoding="utf-8"))),
    }
    (root / "build-optimization.json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report, indent=2))
    if output and report["homepageStylesheetCount"] != 0:
        raise SystemExit("Homepage still contains unbundled local CSS links")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
