# Purpose: Optimize public build - Descriptive comment added for clarity
#!/usr/bin/env python3
"""Apply deployment-only optimizations to a prepared public directory."""
from __future__ import annotations

import argparse
import hashlib
import json
import re
from html.parser import HTMLParser
from pathlib import Path, PurePosixPath
from urllib.parse import urlsplit, urlunsplit

CSS_LINK_RE = re.compile(
    r'<link\b(?=[^>]*\brel=["\']stylesheet["\'])[^>]*\bhref=["\'](?P<href>/assets/css/[^"\']+)["\'][^>]*>\s*',
    re.I,
)
CSS_URL_RE = re.compile(r'url\((?P<quote>["\']?)(?P<url>[^)"\']+)(?P=quote)\)', re.I)
DEFERRED_HOMEPAGE_CSS = {
    "assets/css/onam-theme.css",
    "assets/css/independence-day-theme.css",
    "assets/css/learning-sprint-theme.css",
}


def externalize_inline_scripts(root: Path) -> int:
    """Keep executable scripts compatible with script-src 'self'.

    Preserve parser order: a formerly inline classic script must not acquire
    defer/async semantics. JSON and other non-executable script data stay inline.
    Inline event-handler attributes require separate source-level migration.
    """
    class Attributes(HTMLParser):
        def handle_starttag(self, tag, attrs):
            self.attrs = dict(attrs)

    count = 0
    pattern = re.compile(r'<script\b(?P<attrs>[^>]*)>(?P<body>.*?)</script\s*>', re.I | re.S)
    executable = {'', 'text/javascript', 'application/javascript', 'text/ecmascript', 'application/ecmascript', 'module'}
    for page in root.rglob('*.html'):
        original = page.read_text(encoding='utf-8')

        def replace(match):
            nonlocal count
            parser = Attributes()
            parser.feed('<script' + match['attrs'] + '>')
            attrs = parser.attrs
            if 'src' in attrs or (attrs.get('type') or '').strip().lower() not in executable or not match['body'].strip():
                return match[0]
            payload = match['body'].encode('utf-8')
            digest = hashlib.sha256(payload).hexdigest()[:20]
            output = root / 'assets' / 'build' / f'inline.{digest}.js'
            output.parent.mkdir(parents=True, exist_ok=True)
            output.write_bytes(payload)
            raw_attrs = match['attrs']
            if (attrs.get('type') or '').strip().lower() != 'module':
                raw_attrs = re.sub(r'\s+(?:async|defer)(?:\s*=\s*(?:"[^"]*"|\'[^\']*\'|[^\s>]+))?', '', raw_attrs, flags=re.I)
            count += 1
            return f'<script{raw_attrs} src="/assets/build/{output.name}"></script>'

        updated = pattern.sub(replace, original)
        if updated != original:
            page.write_text(updated, encoding='utf-8')
    return count


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
    deferred: list[str] = []
    for match in matches:
        href = match.group("href")
        source_path = clean_asset_path(href)
        source = root / source_path
        if not source.is_file():
            raise FileNotFoundError(f"Homepage stylesheet is missing: {source.relative_to(root)}")
        if source_path in DEFERRED_HOMEPAGE_CSS:
            deferred.append(href)
            continue
        pieces.append(f"/* {href} */\n{rebased_css(source.read_text(encoding='utf-8'), href).strip()}\n")

    combined = "\n".join(pieces).encode("utf-8")
    digest = hashlib.sha256(combined).hexdigest()[:16]
    output = root / "assets" / "build" / f"home.{digest}.css"
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_bytes(combined)
    link = f'<link rel="stylesheet" href="/assets/build/{output.name}">\n'
    deferred_links = "".join(
        f'<link rel="preload" as="style" href="{href}" data-deferred-stylesheet="true">\n'
        for href in deferred
    )
    first_start = matches[0].start()
    without_links = CSS_LINK_RE.sub("", original)
    # Insert the bundle where the first local stylesheet previously appeared.
    removed_before = sum(match.end() - match.start() for match in matches if match.end() <= first_start)
    insertion = first_start - removed_before
    optimized = without_links[:insertion] + link + deferred_links + without_links[insertion:]
    page.write_text(optimized, encoding="utf-8")
    return output.relative_to(root).as_posix()


def version_assets(root: Path) -> None:
    """Refresh HTML references to immutable scripts/styles when their contents change."""
    hashes = {"/" + file.relative_to(root).as_posix(): hashlib.sha256(file.read_bytes()).hexdigest()[:16]
              for folder in ("assets/js", "assets/css") for file in (root / folder).glob("*") if file.is_file()}
    pattern = re.compile(r'(?P<path>/assets/(?:js|css)/[^\s"\'<>?]+)(?:\?[^\s"\'<>]*)?')
    for page in root.rglob("*.html"):
        original = page.read_text(encoding="utf-8")
        updated = pattern.sub(lambda match: match["path"] + "?v=" + hashes[match["path"]]
                              if match["path"] in hashes else match[0], original)
        if updated != original:
            page.write_text(updated, encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", type=Path, required=True)
    args = parser.parse_args()
    root = args.root.resolve()
    if not root.is_dir():
        raise SystemExit(f"Public directory does not exist: {root}")
    externalized = externalize_inline_scripts(root)
    version_assets(root)
    output = bundle_home(root)
    report = {
        "externalizedInlineScripts": externalized,
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
