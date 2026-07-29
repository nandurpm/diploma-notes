# Purpose: Generate sitemap - Descriptive comment added for clarity
#!/usr/bin/env python3
"""Generate sitemap.xml from canonical public HTML and downloadable study PDFs."""
from __future__ import annotations

import argparse
import html
import re
import subprocess
from datetime import date
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
ORIGIN = "https://polypmna.dpdns.org"
EXCLUDED_PREFIXES = (
    ".github/", "android/", "docs/", "maintenance/", "reports/", "supabase/", "tools/", "workers/"
)
EXCLUDED_FILES = {
    "404.html",
    "ask-poly-v2.html",
    "new-year-theme-preview.html",
    "reset-password.html",
    "tools-v2.html",
    "tools-v2-original.html",
    "revision-2026/department-view.html",
}
CANONICAL_RE = re.compile(r'<link\s+[^>]*rel=["\'][^"\']*canonical[^"\']*["\'][^>]*href=["\']([^"\']+)', re.I)
CANONICAL_RE_REVERSED = re.compile(r'<link\s+[^>]*href=["\']([^"\']+)["\'][^>]*rel=["\'][^"\']*canonical', re.I)
NOINDEX_RE = re.compile(r'<meta\s+[^>]*name=["\']robots["\'][^>]*content=["\'][^"\']*noindex', re.I)


def git_lastmod(path: Path) -> str:
    relative = path.relative_to(ROOT).as_posix()
    try:
        value = subprocess.check_output(
            ["git", "log", "-1", "--format=%cs", "--", relative],
            cwd=ROOT,
            text=True,
            stderr=subprocess.DEVNULL,
        ).strip()
        if re.fullmatch(r"\d{4}-\d{2}-\d{2}", value):
            return value
    except Exception:
        pass
    return date.today().isoformat()


def canonical_for(path: Path) -> str | None:
    relative = path.relative_to(ROOT).as_posix()
    if relative in EXCLUDED_FILES or relative.startswith(EXCLUDED_PREFIXES):
        return None
    text = path.read_text(encoding="utf-8", errors="replace")
    if NOINDEX_RE.search(text):
        return None
    match = CANONICAL_RE.search(text) or CANONICAL_RE_REVERSED.search(text)
    if not match:
        return None
    url = html.unescape(match.group(1).strip())
    parsed = urlparse(url)
    if parsed.scheme != "https" or parsed.netloc != urlparse(ORIGIN).netloc:
        return None
    return url


def entries() -> list[tuple[str, str]]:
    found: dict[str, str] = {}
    for path in ROOT.rglob("*.html"):
        url = canonical_for(path)
        if url:
            found[url] = git_lastmod(path)
    for pattern in ("notes/*.pdf", "revision-2026-content/notes/*.pdf"):
        for path in ROOT.glob(pattern):
            if path.is_file():
                url = f"{ORIGIN}/{path.relative_to(ROOT).as_posix()}"
                found[url] = git_lastmod(path)
    return sorted(found.items(), key=lambda item: (item[0] != f"{ORIGIN}/", item[0]))


def render() -> str:
    lines = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for url, lastmod in entries():
        lines.append("  <url>")
        lines.append(f"    <loc>{html.escape(url)}</loc>")
        lines.append(f"    <lastmod>{lastmod}</lastmod>")
        lines.append("  </url>")
    lines.append("</urlset>")
    return "\n".join(lines) + "\n"


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true", help="Fail if sitemap.xml is not current")
    args = parser.parse_args()
    generated = render()
    target = ROOT / "sitemap.xml"
    if args.check:
        current = target.read_text(encoding="utf-8") if target.exists() else ""
        if current != generated:
            print("sitemap.xml is stale. Run: python tools/generate_sitemap.py")
            import difflib
            diff = difflib.unified_diff(
                current.splitlines(keepends=True),
                generated.splitlines(keepends=True),
                fromfile="current sitemap.xml",
                tofile="generated sitemap.xml"
            )
            print("".join(diff))
            return 1
        print(f"sitemap.xml is current with {generated.count('<url>')} entries.")
        return 0
    target.write_text(generated, encoding="utf-8")
    print(f"Wrote {target.relative_to(ROOT)} with {generated.count('<url>')} entries.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
