# Purpose: Maintain public pages - Descriptive comment added for clarity
#!/usr/bin/env python3
"""Normalize public POLY PMNA pages from the sitemap.

Applies one static, no-JavaScript-safe header/footer, canonical POLY PMNA
branding, SEO/social metadata, skip links, main targets and breadcrumbs.
Lesson handbooks are intentionally excluded.
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
SITE_NAME = "POLY PMNA"
SOCIAL_IMAGE = f"{SITE_ORIGIN}/assets/media/poly-pmna-study-hub-social-card.png"
A11Y_CSS = '<link rel="stylesheet" href="/assets/css/site-navigation-a11y.css?v=20260720-audit-fix1">'
SHELL_SCRIPT = '<script src="/assets/js/site-shell.js?v=20260720-audit-fix1" defer></script>'

NAV_ITEMS = (
    ("Home", "/"),
    ("About", "/about.html"),
    ("Revision 2026", "/revision-2026.html"),
    ("Revision 2021", "/revision-2021.html"),
    ("Mock Exams", "/daily-quiz.html"),
    ("Ask POLY AI", "/ask-poly.html"),
    ("2015 Materials", "/materials-2015.html"),
    ("Tools", "/tools.html"),
    ("Help", "/contact.html"),
)

PAGE_METADATA: dict[str, tuple[str, str, str]] = {
    "index.html": (
        "Kerala Polytechnic Revision 2026 & 2021 Study Hub | POLY PMNA",
        "POLY PMNA provides Kerala Polytechnic Revision 2026 and Revision 2021 syllabus, subject search, notes, Ask POLY AI, mock exams, tools and question papers.",
        "Home",
    ),
    "about.html": (
        "About POLY PMNA | Kerala Polytechnic Study Hub",
        "Learn how to use POLY PMNA, access Kerala Polytechnic study resources and verify official SITTTR Kerala information.",
        "About",
    ),
    "contact.html": (
        "Help, Corrections & Content Requests | POLY PMNA",
        "Request missing Kerala Polytechnic study content, report broken links and submit corrections to POLY PMNA.",
        "Help",
    ),
    "daily-quiz.html": (
        "Revision 2021 Mock Exams & Daily Quiz | POLY PMNA",
        "Practice supported Revision 2021 subjects with daily quizzes, mock examinations, saved scores and previous-day review.",
        "Revision 2021 Mock Exams",
    ),
    "ask-poly.html": (
        "Ask POLY AI | POLY PMNA",
        "Ask POLY AI about Revision 2026, Revision 2021, departments, subjects, lessons, notes, syllabus, mock exams and student tools.",
        "Ask POLY AI",
    ),
    "tools.html": (
        "Student Tools | POLY PMNA",
        "Use POLY PMNA engineering calculators, electrical and electronics helpers, civil and mechanical estimators, academic tools and text utilities.",
        "Student Tools",
    ),
    "departments.html": (
        "Kerala Polytechnic Departments | POLY PMNA",
        "Browse Kerala Polytechnic departments and open semester subjects, syllabus, lessons, notes and question papers.",
        "Departments",
    ),
    "disclaimer.html": (
        "Disclaimer | POLY PMNA",
        "Read the educational-content, accuracy, external-link and official-source disclaimer for POLY PMNA.",
        "Disclaimer",
    ),
    "lessons.html": (
        "Kerala Polytechnic Lesson Pages | POLY PMNA",
        "Browse Kerala Polytechnic lesson pages by revision, department, semester, subject title and subject code.",
        "Lessons",
    ),
    "materials-2015.html": (
        "Kerala Polytechnic 2015 Scheme Materials | POLY PMNA",
        "Access Kerala Polytechnic 2015 scheme notes and study materials separately from newer curriculum revisions.",
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
        "Browse Kerala Polytechnic Revision 2021 departments, semester subjects, syllabus, lessons, notes and sample question papers.",
        "Revision 2021",
    ),
    "revision-2026.html": (
        "Revision 2026 Diploma Departments | POLY PMNA",
        "Browse all official Kerala Polytechnic Revision 2026 programmes with semester subjects, syllabus links, lessons, notes and model question papers.",
        "Revision 2026",
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

CORE_SITEMAP_PAGES = (
    "about.html",
    "ask-poly.html",
    "contact.html",
    "daily-quiz.html",
    "disclaimer.html",
    "lessons.html",
    "materials-2015.html",
    "model-question-papers.html",
    "previous-question-papers.html",
    "privacy.html",
    "revision-2021.html",
    "revision-2026.html",
    "study-materials.html",
    "syllabus.html",
    "terms.html",
    "tools.html",
)


def ensure_sitemap_complete() -> bool:
    """Add missing core and static department pages without deleting existing URLs."""
    source = SITEMAP.read_text(encoding="utf-8")
    existing = set(re.findall(r"<loc>\s*(.*?)\s*</loc>", source, flags=re.I))
    desired: list[tuple[str, str, str]] = []

    for local in CORE_SITEMAP_PAGES:
        if (ROOT / local).exists():
            frequency = "daily" if local == "daily-quiz.html" else "monthly"
            desired.append((f"{SITE_ORIGIN}/{local}", frequency, "0.8"))

    for directory in ("revision-2021", "revision-2026"):
        for path in sorted((ROOT / directory).glob("*.html")):
            if path.name == "department-view.html":
                continue
            desired.append((f"{SITE_ORIGIN}/{path.relative_to(ROOT).as_posix()}", "monthly", "0.6"))

    additions = [
        f"  <url><loc>{html.escape(url)}</loc><changefreq>{frequency}</changefreq><priority>{priority}</priority></url>"
        for url, frequency, priority in desired
        if url not in existing
    ]
    if not additions:
        return False
    updated = source.replace("</urlset>", "\n".join(additions) + "\n</urlset>", 1)
    SITEMAP.write_text(updated, encoding="utf-8")
    print(f"Sitemap URLs added: {len(additions)}")
    return True


def sitemap_entries() -> list[tuple[str, str]]:
    tree = ET.parse(SITEMAP)
    ns = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
    entries: list[tuple[str, str]] = []
    for loc in tree.findall("sm:url/sm:loc", ns):
        url = (loc.text or "").strip()
        route = urlparse(url).path or "/"
        if route.startswith("/lessons/") or route.startswith("/revision-2026-content/lessons/"):
            continue
        local = "index.html" if route == "/" else route.lstrip("/")
        entries.append((local, url))
    return entries


def strip_tags(value: str) -> str:
    return " ".join(html.unescape(re.sub(r"<[^>]+>", " ", value)).split())


def existing_h1(text: str) -> str:
    match = re.search(r"<h1\b[^>]*>(.*?)</h1>", text, flags=re.I | re.S)
    return strip_tags(match.group(1)) if match else ""


def department_metadata(local: str, text: str) -> tuple[str, str, str]:
    name = existing_h1(text) or Path(local).stem.replace("-", " ").title()
    revision = "2026" if local.startswith("revision-2026/") else "2021"
    title = f"{name} Revision {revision} Subjects | POLY PMNA"
    description = (
        f"Browse Revision {revision} {name} semester subjects, syllabus, lesson pages, "
        "notes and model or sample question papers for Kerala Polytechnic students."
    )
    return title, description, name


def page_metadata(local: str, text: str) -> tuple[str, str, str]:
    if local.startswith(("revision-2021/", "revision-2026/")):
        return department_metadata(local, text)
    if local in PAGE_METADATA:
        return PAGE_METADATA[local]
    name = existing_h1(text) or Path(local).stem.replace("-", " ").title()
    return f"{name} | POLY PMNA", f"Kerala Polytechnic {name} resources from POLY PMNA.", name


def replace_title(text: str, value: str) -> str:
    tag = f"<title>{html.escape(value)}</title>"
    pattern = re.compile(r"<title\b[^>]*>.*?</title>", flags=re.I | re.S)
    return pattern.sub(tag, text, count=1) if pattern.search(text) else text.replace("</head>", f"  {tag}\n</head>", 1)


def set_meta(text: str, attribute: str, key: str, value: str) -> str:
    pattern = re.compile(
        rf"<meta\b(?=[^>]*\b{attribute}\s*=\s*(['\"]){re.escape(key)}\1)[^>]*>",
        flags=re.I,
    )
    tag = f'<meta {attribute}="{key}" content="{html.escape(value, quote=True)}">'
    return pattern.sub(tag, text, count=1) if pattern.search(text) else text.replace("</head>", f"  {tag}\n</head>", 1)


def set_canonical(text: str, url: str) -> str:
    pattern = re.compile(r"<link\b(?=[^>]*\brel\s*=\s*(['\"])canonical\1)[^>]*>", flags=re.I)
    tag = f'<link rel="canonical" href="{html.escape(url, quote=True)}">'
    return pattern.sub(tag, text, count=1) if pattern.search(text) else text.replace("</head>", f"  {tag}\n</head>", 1)


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
    return text[:match.start()] + f'<main id="main-content"{attrs}>' + text[match.end():]


def nav_active(local: str, href: str) -> bool:
    path = "/" if local == "index.html" else f"/{local}"
    if href == "/":
        return path == "/"
    if href == "/revision-2026.html":
        return path == href or path.startswith("/revision-2026/")
    if href == "/revision-2021.html":
        return path == href or path.startswith("/revision-2021/")
    return path == href


def canonical_header(local: str) -> str:
    links = []
    for label, href in NAV_ITEMS:
        active = ' class="active" aria-current="page"' if nav_active(local, href) else ""
        links.append(f'<a href="{href}"{active}>{html.escape(label)}</a>')
    return (
        '<header class="topbar" data-site-header>'
        f'<a class="brand" href="/" aria-label="{SITE_NAME} home">'
        '<span class="brand-symbol" aria-hidden="true">📚</span>'
        f'<strong>{SITE_NAME}</strong></a>'
        '<button class="menu-toggle" type="button" aria-label="Toggle navigation" aria-expanded="false">Menu</button>'
        f'<nav class="navlinks" aria-label="Primary navigation">{"".join(links)}</nav>'
        '</header>'
    )


def canonical_footer() -> str:
    return (
        '<footer class="footer" data-site-footer>'
        f'<p>&copy; <span data-year></span> {SITE_NAME}.</p>'
        '<nav class="footer-links" aria-label="Footer navigation">'
        '<a href="/about.html">About</a><a href="/contact.html">Help</a>'
        '<a href="https://nandakumarm.dpdns.org/about.html" target="_blank" rel="noopener noreferrer">Developer</a>'
        '</nav>'
        '<nav class="footer-legal" aria-label="Legal">'
        '<a href="/privacy.html">Privacy</a><a href="/terms.html">Terms</a><a href="/disclaimer.html">Disclaimer</a>'
        '</nav></footer>'
    )


def ensure_site_shell(text: str, local: str) -> str:
    header_pattern = re.compile(
        r'<header\b[^>]*class\s*=\s*([\'"])[^\'"]*\btopbar\b[^\'"]*\1[^>]*>.*?</header>',
        flags=re.I | re.S,
    )
    footer_pattern = re.compile(
        r'<footer\b[^>]*class\s*=\s*([\'"])[^\'"]*\bfooter\b[^\'"]*\1[^>]*>.*?</footer>',
        flags=re.I | re.S,
    )
    header = canonical_header(local)
    footer = canonical_footer()
    if header_pattern.search(text):
        text = header_pattern.sub(header, text, count=1)
    else:
        text = re.sub(
            r'(<a\b[^>]*class\s*=\s*([\'"])[^\'"]*\bskip-link\b[^\'"]*\2[^>]*>.*?</a>)',
            rf'\1\n  {header}', text, count=1, flags=re.I | re.S
        )
    if footer_pattern.search(text):
        text = footer_pattern.sub(footer, text, count=1)
    else:
        text = text.replace("</body>", f"  {footer}\n</body>", 1)
    if "/assets/js/site-shell.js" not in text:
        text = text.replace("</head>", f"  {SHELL_SCRIPT}\n</head>", 1)
    return text


def breadcrumb_markup(local: str, label: str) -> str:
    if local == "index.html":
        return ""
    if local.startswith("revision-2021/"):
        parent = '<li><a href="/revision-2021.html">Revision 2021</a></li>'
    elif local.startswith("revision-2026/"):
        parent = '<li><a href="/revision-2026.html">Revision 2026</a></li>'
    else:
        parent = ""
    return (
        '<nav class="site-breadcrumbs" aria-label="Breadcrumb"><ol>'
        '<li><a href="/">Home</a></li>'
        f'{parent}<li><span aria-current="page">{html.escape(label)}</span></li>'
        '</ol></nav>'
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
    return re.sub(r"(<main\b[^>]*>)", rf"\1\n    {markup}", text, count=1, flags=re.I)


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
    for attribute, key, value in (
        ("property", "og:type", "website"),
        ("property", "og:title", title),
        ("property", "og:description", description),
        ("property", "og:url", canonical_url),
        ("property", "og:image", SOCIAL_IMAGE),
        ("property", "og:image:type", "image/png"),
        ("property", "og:image:width", "1200"),
        ("property", "og:image:height", "630"),
        ("property", "og:image:alt", "POLY PMNA Kerala Polytechnic Study Hub"),
        ("name", "twitter:card", "summary_large_image"),
        ("name", "twitter:title", title),
        ("name", "twitter:description", description),
        ("name", "twitter:image", SOCIAL_IMAGE),
    ):
        text = set_meta(text, attribute, key, value)
    text = ensure_css(text)
    text = ensure_skip_link(text)
    text = ensure_main_target(text)
    text = ensure_site_shell(text, local)
    text = ensure_breadcrumb(text, local, label)

    if text != original:
        path.write_text(text, encoding="utf-8")
        return True
    return False


def main() -> int:
    ensure_sitemap_complete()
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
