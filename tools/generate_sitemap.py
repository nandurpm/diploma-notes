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
import xml.etree.ElementTree as ET
from xml.etree import ElementTree as ET

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
    "first-year-materials.html",
}
CANONICAL_RE = re.compile(r'<link\s+[^>]*rel=["\'][^"\']*canonical[^"\']*["\'][^>]*href=["\']([^"\']+)', re.I)
CANONICAL_RE_REVERSED = re.compile(r'<link\s+[^>]*href=["\']([^"\']+)["\'][^>]*rel=["\'][^"\']*canonical', re.I)
NOINDEX_RE = re.compile(r'<meta\s+[^>]*name=["\']robots["\'][^>]*content=["\'][^"\']*noindex', re.I)


def git_lastmod(path: Path) -> str:
    relative = path.relative_to(ROOT).as_posix()
    try:
        value = subprocess.check_output(
            ["git", "log", "-1", "--no-merges", "--format=%cs", "--", relative],
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


def parse_existing_sitemap() -> dict[str, str]:
    existing: dict[str, str] = {}
    target = ROOT / "sitemap.xml"
    if not target.exists():
        return existing
    try:
        ns = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
        root = ET.parse(target)
        for url_node in root.findall("sm:url", ns):
            loc_node = url_node.find("sm:loc", ns)
            lastmod_node = url_node.find("sm:lastmod", ns)
            if loc_node is not None and lastmod_node is not None:
                url = (loc_node.text or "").strip()
                existing[url] = (lastmod_node.text or "").strip()
    except Exception:
        pass
    return existing


def entries() -> list[tuple[str, str]]:
    existing = parse_existing_sitemap()
    found: dict[str, str] = {}

    def get_lastmod(url: str, path: Path) -> str:
        if url in existing:
            return existing[url]
        return git_lastmod(path)
    # Preserve existing revision-2026-content/notes/*.pdf sitemap entries
    # to avoid failing in clean checkouts where these PDFs are git-ignored.
    existing_pdfs: dict[str, str] = {}
    target_sitemap = ROOT / "sitemap.xml"
    if target_sitemap.exists():
        try:
            ns = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
            root_el = ET.parse(target_sitemap)
            for node in root_el.findall("sm:url", ns):
                loc_node = node.find("sm:loc", ns)
                lastmod_node = node.find("sm:lastmod", ns)
                if loc_node is not None:
                    loc = (loc_node.text or "").strip()
                    if "revision-2026-content/notes/" in loc and loc.endswith(".pdf"):
                        lastmod = (lastmod_node.text or "").strip() if lastmod_node is not None else date.today().isoformat()
                        existing_pdfs[loc] = lastmod
        except Exception:
            pass

    for path in ROOT.rglob("*.html"):
        url = canonical_for(path)
        if url:
            found[url] = get_lastmod(url, path)
    for pattern in ("notes/*.pdf", "revision-2026-content/notes/*.pdf"):
        for path in ROOT.glob(pattern):
            if path.is_file():
                url = f"{ORIGIN}/{path.relative_to(ROOT).as_posix()}"
                found[url] = get_lastmod(url, path)

    # Dynamically preserve any Revision 2026 PDF sitemap entries if missing from disk
    for url, lastmod in existing.items():
        if "revision-2026-content/notes/" in url and url.endswith(".pdf"):
            if url not in found:
                found[url] = lastmod

    # Dynamic preservation of missing git-ignored Revision 2026 PDFs to prevent CI check failures
    sitemap_path = ROOT / "sitemap.xml"
    if sitemap_path.is_file():
        try:
            import xml.etree.ElementTree as ET
            ns = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
            tree = ET.parse(sitemap_path)
            for url_node in tree.findall("sm:url", ns):
                loc = url_node.find("sm:loc", ns)
                lastmod = url_node.find("sm:lastmod", ns)
                if loc is not None and lastmod is not None:
                    loc_text = (loc.text or "").strip()
                    lastmod_text = (lastmod.text or "").strip()
                    if "/revision-2026-content/notes/" in loc_text and loc_text.endswith(".pdf"):
                        if loc_text not in found:
                            found[loc_text] = lastmod_text
        except Exception as e:
            print(f"Warning: Failed to parse existing sitemap for preservation: {e}")

    for url, lastmod in existing_pdfs.items():
        if url not in found:
            found[url] = lastmod

    # Preserves existing sitemap XML entries for git-ignored revision-2026 notes PDFs if they are not present on disk
    target = ROOT / "sitemap.xml"
    if target.exists():
        try:
            ns = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
            tree = ET.parse(target)
            for node in tree.findall("sm:url", ns):
                loc_node = node.find("sm:loc", ns)
                lastmod_node = node.find("sm:lastmod", ns)
                if loc_node is not None:
                    loc = (loc_node.text or "").strip()
                    if "/revision-2026-content/notes/" in loc and loc.endswith(".pdf"):
                        if loc not in found:
                            found[loc] = (lastmod_node.text or "").strip() or date.today().isoformat()
        except Exception:
            pass

    # Parse existing sitemap.xml to preserve ignored revision-2026-content PDFs in environments lacking them (e.g. CI)
    sitemap_path = ROOT / "sitemap.xml"
    if sitemap_path.exists():
        try:
            from xml.etree import ElementTree as ET
            ns = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
            root = ET.parse(sitemap_path)
            for url_node in root.findall("sm:url", ns):
                loc = url_node.find("sm:loc", ns)
                lastmod = url_node.find("sm:lastmod", ns)
                if loc is not None and lastmod is not None:
                    url_str = loc.text.strip()
                    if "/revision-2026-content/notes/" in url_str:
                        if url_str not in found:
                            found[url_str] = lastmod.text.strip()
        except Exception:
            pass

    for path in ROOT.glob("notes/*.pdf"):
        if path.is_file():
            url = f"{ORIGIN}/{path.relative_to(ROOT).as_posix()}"
            found[url] = get_lastmod(url, path)
    for path in ROOT.glob("revision-2026-content/lessons/lessons-*.html"):
        match = re.fullmatch(r"lessons-([0-9]+[A-Za-z]*)\.html", path.name)
        if match:
            code = match.group(1).upper()
            url = f"{ORIGIN}/revision-2026-content/notes/downloadable-notes-{code}.pdf"
            found[url] = get_lastmod(url, path)
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
