#!/usr/bin/env python3
"""Apply consistent SEO, social, breadcrumb, and accessibility markup.

Run from the repository root:
    python tools/maintain_public_pages.py

The sitemap is the source of truth. Lesson documents are intentionally excluded
because they use their own textbook-oriented layout and maintenance workflow.
"""

from __future__ import annotations

import html
import re
import sys
from pathlib import Path
from urllib.parse import urlparse
from xml.etree import ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
SITEMAP = ROOT / "sitemap.xml"
SITE_ORIGIN = "https://polypmna.dpdns.org"
SOCIAL_IMAGE = f"{SITE_ORIGIN}/assets/media/poly-pmna-study-hub-social-card.png"
A11Y_CSS = '<link rel="stylesheet" href="/assets/css/site-navigation-a11y.css?v=20260614-1">'
SHELL_SCRIPT = '<script src="/assets/js/site-shell.js?v=20260717-fixed-header-restore1" defer></script>'
HEADER_PLACEHOLDER = '<header class="topbar" data-site-header></header>'
FOOTER_PLACEHOLDER = '<footer class="footer" data-site-footer></footer>'

PAGE_METADATA: dict[str, tuple[str, str, str]] = {
    "index.html": (
        "Kerala Polytechnic POLY PMNA & Study Materials | POLY PMNA",
        "Kerala Polytechnic diploma notes, Revision 2021 syllabus, lesson pages, study materials and question papers for students.",
        "Home",
    ),
    "about.html": (
        "About the Kerala Polytechnic Study Hub | POLY PMNA",
        "Learn how to use POLY PMNA, access Kerala Polytechnic study resources and find official SITTTR Kerala references.",
        "About",
    ),
    "contact.html": (
        "Help, Corrections & Content Requests | POLY PMNA",
        "Request missing Kerala Polytechnic study content, report broken links and submit corrections to POLY PMNA.",
        "Help",
    ),
    "departments.html": (
        "Kerala Polytechnic Departments | POLY PMNA",
        "Browse Kerala Polytechnic departments and open Revision 2021 semester subjects, syllabus, lessons, notes and question papers.",
        "Departments",
    ),
    "disclaimer.html": (
        "Disclaimer | POLY PMNA",
        "Read the educational-content, accuracy, external-link and official-source disclaimer for the POLY PMNA study portal.",
        "Disclaimer",
    ),
    "lessons.html": (
        "Kerala Polytechnic Lesson Pages | POLY PMNA",
        "Browse Kerala Polytechnic lesson pages by revision, department, semester, subject title and subject code.",
        "Lessons",
    ),
    "materials-2015.html": (
        "Kerala Polytechnic 2015 Scheme Materials | POLY PMNA",
        "Access Kerala Polytechnic 2015 scheme notes, study materials and subject resources separately from Revision 2021 content.",
        "2015 Materials",
    ),
    "model-question-papers.html": (
        "Kerala Polytechnic Model Question Papers | POLY PMNA",
        "Browse Kerala Polytechnic model and sample question papers by revision, department, semester and subject.",
        "Model Question Papers",
    ),
    "previous-question-papers.html": (
        "Kerala Polytechnic Previous Question Papers | POLY PMNA",
        "Find Kerala Polytechnic previous examination question papers and subject-wise exam preparation resources.",
        "Previous Question Papers",
    ),
    "privacy.html": (
        "Privacy Policy | POLY PMNA",
        "Read how POLY PMNA handles website usage, comments, third-party services and privacy-related information.",
        "Privacy",
    ),
    "revision-2021.html": (
        "Revision 2021 Diploma Departments | POLY PMNA",
        "Browse Kerala Polytechnic Revision 2021 departments, semester subjects, syllabus, lesson pages, notes and sample question papers.",
        "Revision 2021",
    ),
    "study-materials.html": (
        "Kerala Polytechnic Study Materials | POLY PMNA",
        "Browse Kerala Polytechnic study materials, notes and revision-wise subject resources for diploma students.",
        "Study Materials",
    ),
    "syllabus.html": (
        "Kerala Polytechnic Syllabus Browser | POLY PMNA",
        "Find Kerala Polytechnic syllabus links by revision, department, semester, subject title and subject code.",
        "Syllabus",
    ),
    "terms.html": (
        "Terms of Use | POLY PMNA",
        "Read the terms for using POLY PMNA educational resources, external links, comments and downloadable content.",
        "Terms",
    ),
}


def sitemap_entries() -> list[tuple[str, str]]:
    tree = ET.parse(SITEMAP)
    ns = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
    entries: list[tuple[str, str]] = []
    for loc in tree.findall("sm:url/sm:loc", ns):
        url = (loc.text or "").strip()
        parsed = urlparse(url)
        route = parsed.path or "/"
        if route.startswith("/lessons/"):
            continue
        local = "index.html" if route == "/" else route.lstrip("/")
        entries.append((local, url))
    return entries


def strip_tags(value: str) -> str:
    value = re.sub(r"<[^>]+>", " ", value)
    return " ".join(html.unescape(value).split())


def existing_h1(text: str) -> str:
    match = re.search(r"<h1\b[^>]*>(.*?)</h1>", text, flags=re.I | re.S)
    return strip_tags(match.group(1)) if match else ""


def department_metadata(local: str, text: str) -> tuple[str, str, str]:
    name = existing_h1(text)
    if not name:
        name = Path(local).stem.replace("-", " ").title()
    title = f"{name} Revision 2021 Subjects | POLY PMNA"
    description = (
        f"Browse Revision 2021 {name} semester subjects, syllabus, lesson pages, "
        "notes and sample question papers for Kerala Polytechnic diploma students."
    )
    return title, description, name


def page_metadata(local: str, text: str) -> tuple[str, str, str]:
    if local.startswith("revision-2021/"):
        return department_metadata(local, text)
    if local in PAGE_METADATA:
        return PAGE_METADATA[local]
    name = existing_h1(text) or Path(local).stem.replace("-", " ").title()
    title = f"{name} | POLY PMNA"
    description = f"Kerala Polytechnic {name} resources and student information from POLY PMNA."
    return title, description, name


def replace_title(text: str, value: str) -> str:
    tag = f"<title>{html.escape(value)}</title>"
    pattern = re.compile(r"<title\b[^>]*>.*?</title>", flags=re.I | re.S)
    if pattern.search(text):
        return pattern.sub(tag, text, count=1)
    return text.replace("</head>", f"  {tag}\n</head>", 1)


def set_meta(text: str, attribute: str, key: str, value: str) -> str:
    pattern = re.compile(
        rf"<meta\b(?=[^>]*\b{attribute}\s*=\s*(['\"]){re.escape(key)}\1)[^>]*>",
        flags=re.I,
    )
    tag = f'<meta {attribute}="{key}" content="{html.escape(value, quote=True)}">'
    if pattern.search(text):
        return pattern.sub(tag, text, count=1)
    return text.replace("</head>", f"  {tag}\n</head>", 1)


def set_canonical(text: str, url: str) -> str:
    pattern = re.compile(
        r"<link\b(?=[^>]*\brel\s*=\s*(['\"])canonical\1)[^>]*>",
        flags=re.I,
    )
    tag = f'<link rel="canonical" href="{html.escape(url, quote=True)}">'
    if pattern.search(text):
        return pattern.sub(tag, text, count=1)
    return text.replace("</head>", f"  {tag}\n</head>", 1)


def ensure_css(text: str) -> str:
    if "/assets/css/site-navigation-a11y.css" in text:
        return text
    return text.replace("</head>", f"  {A11Y_CSS}\n</head>", 1)


def ensure_skip_link(text: str) -> str:
    text = re.sub(
        r"\s*<a\b[^>]*class\s*=\s*(['\"])[^'\"]*\bskip-link\b[^'\"]*\1[^>]*>.*?</a>",
        "",
        text,
        flags=re.I | re.S,
    )
    return re.sub(
        r"(<body\b[^>]*>)",
        r'\1\n  <a class="skip-link" href="#main-content">Skip to main content</a>',
        text,
        count=1,
        flags=re.I,
    )


def ensure_main_target(text: str) -> str:
    match = re.search(r"<main\b([^>]*)>", text, flags=re.I)
    if not match:
        return text
    attrs = re.sub(r"\s+id\s*=\s*(['\"]).*?\1", "", match.group(1), flags=re.I)
    opening = f'<main id="main-content"{attrs}>'
    return text[: match.start()] + opening + text[match.end() :]


def breadcrumb_markup(local: str, label: str) -> str:
    if local == "index.html":
        return ""
    if local.startswith("revision-2021/"):
        return (
            '<nav class="site-breadcrumbs" aria-label="Breadcrumb">'
            '<ol><li><a href="/">Home</a></li>'
            '<li><a href="/revision-2021.html">Revision 2021</a></li>'
            f'<li><span aria-current="page">{html.escape(label)}</span></li></ol></nav>'
        )
    return (
        '<nav class="site-breadcrumbs" aria-label="Breadcrumb">'
        '<ol><li><a href="/">Home</a></li>'
        f'<li><span aria-current="page">{html.escape(label)}</span></li></ol></nav>'
    )


def ensure_breadcrumb(text: str, local: str, label: str) -> str:
    text = re.sub(
        r"\s*<nav\b[^>]*class\s*=\s*(['\"])[^'\"]*\bsite-breadcrumbs\b[^'\"]*\1[^>]*>.*?</nav>",
        "",
        text,
        flags=re.I | re.S,
    )
    markup = breadcrumb_markup(local, label)
    if not markup:
        return text
    return re.sub(
        r"(<main\b[^>]*>)",
        rf"\1\n    {markup}",
        text,
        count=1,
        flags=re.I,
    )


def ensure_site_shell(text: str) -> str:
    """Replace hand-copied shell markup with canonical runtime placeholders."""
    header_pattern = re.compile(
        r'<header\b[^>]*class\s*=\s*([\'"])[^\'"]*\btopbar\b[^\'"]*\1[^>]*>.*?</header>',
        flags=re.I | re.S,
    )
    footer_pattern = re.compile(
        r'<footer\b[^>]*class\s*=\s*([\'"])[^\'"]*\bfooter\b[^\'"]*\1[^>]*>.*?</footer>',
        flags=re.I | re.S,
    )
    if header_pattern.search(text):
        text = header_pattern.sub(HEADER_PLACEHOLDER, text, count=1)
    elif HEADER_PLACEHOLDER not in text:
        text = re.sub(r'(<a\b[^>]*class\s*=\s*([\'"])[^\'"]*\bskip-link\b[^\'"]*\2[^>]*>.*?</a>)', rf'\1\n  {HEADER_PLACEHOLDER}', text, count=1, flags=re.I | re.S)
    if footer_pattern.search(text):
        text = footer_pattern.sub(FOOTER_PLACEHOLDER, text, count=1)
    elif FOOTER_PLACEHOLDER not in text:
        text = text.replace("</body>", f"  {FOOTER_PLACEHOLDER}\n</body>", 1)
    if "/assets/js/site-shell.js" not in text:
        text = text.replace("</head>", f"  {SHELL_SCRIPT}\n</head>", 1)
    return text

def maintain_page(local: str, canonical_url: str) -> bool:
    path = ROOT / local
    if not path.exists():
        raise FileNotFoundError(f"Sitemap page is missing: {local}")
    text = path.read_text(encoding="utf-8")
    original = text
    title, description, label = page_metadata(local, text)

    text = replace_title(text, title)
    text = set_meta(text, "name", "description", description)
    text = set_canonical(text, canonical_url)
    text = set_meta(text, "property", "og:type", "website")
    text = set_meta(text, "property", "og:title", title)
    text = set_meta(text, "property", "og:description", description)
    text = set_meta(text, "property", "og:url", canonical_url)
    text = set_meta(text, "property", "og:image", SOCIAL_IMAGE)
    text = set_meta(text, "property", "og:image:type", "image/png")
    text = set_meta(text, "property", "og:image:width", "1200")
    text = set_meta(text, "property", "og:image:height", "630")
    text = set_meta(text, "property", "og:image:alt", "POLY PMNA Kerala Polytechnic Study Hub")
    text = set_meta(text, "name", "twitter:card", "summary_large_image")
    text = set_meta(text, "name", "twitter:title", title)
    text = set_meta(text, "name", "twitter:description", description)
    text = set_meta(text, "name", "twitter:image", SOCIAL_IMAGE)
    text = ensure_css(text)
    text = ensure_skip_link(text)
    text = ensure_site_shell(text)
    text = ensure_main_target(text)
    text = ensure_breadcrumb(text, local, label)

    if text != original:
        path.write_text(text, encoding="utf-8")
        return True
    return False


def main() -> int:
    changed: list[str] = []
    entries = sitemap_entries()
    for local, url in entries:
        if maintain_page(local, url):
            changed.append(local)
    print(f"Public non-lesson pages processed: {len(entries)}")
    print(f"Pages changed: {len(changed)}")
    for local in changed:
        print(f"  - {local}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
