#!/usr/bin/env python3
"""Repair legacy lesson and mock-exam markup that blocks the release quality gate."""
from __future__ import annotations

import argparse
import html
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LESSONS_MISSING_H1 = (
    "lessons/lessons-1008.html",
    "lessons/lessons-2001.html",
    "lessons/lessons-3042.html",
    "lessons/lessons-4031.html",
    "lessons/lessons-4041.html",
    "lessons/lessons-5042.html",
)
LESSON_MISSING_DESCRIPTION = "lessons/lessons-6009.html"
MOCK_PAGES = ("mock-exam-1004.html", "mock-exam.html")
TITLE_RE = re.compile(r"<title>(.*?)</title>", re.I | re.S)
MAIN_OPEN_RE = re.compile(r"(<main\b[^>]*>)", re.I)
BODY_OPEN_RE = re.compile(r"(<body\b[^>]*>)", re.I)
HEAD_END_RE = re.compile(r"</head>", re.I)
DESCRIPTION_RE = re.compile(r'<meta\b[^>]*\bname=["\']description["\'][^>]*>', re.I)
CANONICAL_RE = re.compile(r'<link\b[^>]*\brel=["\']canonical["\'][^>]*\bhref=["\']([^"\']+)', re.I)
H1_OPEN_RE = re.compile(r"<h1(\b[^>]*)>", re.I)
H1_CLOSE_RE = re.compile(r"</h1>", re.I)
SKIP_RE = re.compile(r'class=["\'][^"\']*\bskip-link\b', re.I)
OG_TITLE_RE = re.compile(r'<meta\b[^>]*\bproperty=["\']og:title["\']', re.I)
TWITTER_CARD_RE = re.compile(r'<meta\b[^>]*\bname=["\']twitter:card["\']', re.I)

VISUALLY_HIDDEN_STYLE = (
    "position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;"
    "clip:rect(0,0,0,0);white-space:nowrap;border:0"
)


def read(path: Path) -> str:
    return path.read_text(encoding="utf-8", errors="replace")


def page_title(text: str, fallback: str) -> str:
    match = TITLE_RE.search(text)
    if not match:
        return fallback
    value = re.sub(r"<[^>]+>", " ", match.group(1))
    return " ".join(html.unescape(value).split()) or fallback


def hidden_h1(title: str) -> str:
    return f'<h1 style="{VISUALLY_HIDDEN_STYLE}">{html.escape(title)}</h1>'


def insert_hidden_h1(text: str, title: str) -> str:
    if H1_OPEN_RE.search(text):
        return text
    insertion = "\n    " + hidden_h1(title)
    updated, count = MAIN_OPEN_RE.subn(lambda match: match.group(1) + insertion, text, count=1)
    if count == 1:
        return updated
    updated, count = BODY_OPEN_RE.subn(lambda match: match.group(1) + insertion, text, count=1)
    if count == 1:
        return updated
    raise ValueError("No <main> or <body> element found")


def repair_lesson_h1(relative: str) -> bool:
    path = ROOT / relative
    text = read(path)
    title = page_title(text, Path(relative).stem)
    updated = insert_hidden_h1(text, title)
    if updated == text:
        return False
    path.write_text(updated, encoding="utf-8")
    return True


def repair_lesson_description() -> bool:
    path = ROOT / LESSON_MISSING_DESCRIPTION
    text = read(path)
    if DESCRIPTION_RE.search(text):
        return False
    title = page_title(text, "Kerala Polytechnic lesson handbook")
    description = html.escape(
        f"{title} study handbook with syllabus-aligned explanations, revision support and printable learning resources on POLY PMNA.",
        quote=True,
    )
    insertion = f'  <meta name="description" content="{description}">\n'
    viewport = re.compile(r'(<meta\b[^>]*\bname=["\']viewport["\'][^>]*>\s*)', re.I)
    updated, count = viewport.subn(lambda match: match.group(1) + insertion, text, count=1)
    if count != 1:
        updated, count = TITLE_RE.subn(lambda match: insertion + match.group(0), text, count=1)
    if count != 1:
        raise ValueError(f"Could not insert description in {LESSON_MISSING_DESCRIPTION}")
    path.write_text(updated, encoding="utf-8")
    return True


def social_metadata(title: str, description: str, canonical: str) -> str:
    image = "https://polypmna.dpdns.org/assets/media/poly-pmna-study-hub-social-card.png"
    return (
        f'  <meta property="og:type" content="website">\n'
        f'  <meta property="og:title" content="{html.escape(title, quote=True)}">\n'
        f'  <meta property="og:description" content="{html.escape(description, quote=True)}">\n'
        f'  <meta property="og:url" content="{html.escape(canonical, quote=True)}">\n'
        f'  <meta property="og:image" content="{image}">\n'
        f'  <meta name="twitter:card" content="summary_large_image">\n'
        f'  <meta name="twitter:title" content="{html.escape(title, quote=True)}">\n'
        f'  <meta name="twitter:description" content="{html.escape(description, quote=True)}">\n'
        f'  <meta name="twitter:image" content="{image}">\n'
    )


def repair_mock(relative: str) -> bool:
    path = ROOT / relative
    text = read(path)
    original = text
    title = page_title(text, "Kerala Polytechnic Mock Examination | POLY PMNA")
    description_match = re.search(r'<meta\b[^>]*\bname=["\']description["\'][^>]*\bcontent=["\']([^"\']*)', text, re.I)
    description = html.unescape(description_match.group(1)) if description_match else (
        "Kerala Polytechnic official-pattern practice mock examination with guided evaluation and revision feedback."
    )
    canonical_match = CANONICAL_RE.search(text)
    canonical = canonical_match.group(1) if canonical_match else f"https://polypmna.dpdns.org/{relative}"

    text = H1_OPEN_RE.sub(r"<h2\1>", text)
    text = H1_CLOSE_RE.sub("</h2>", text)
    document_title = "Applied Chemistry Mock Examination 1004" if relative == "mock-exam-1004.html" else "Kerala Polytechnic Mock Examination"
    text = insert_hidden_h1(text, document_title)

    if not SKIP_RE.search(text):
        text, count = BODY_OPEN_RE.subn(
            lambda match: match.group(1) + '\n  <a class="skip-link" href="#main-content">Skip to main content</a>',
            text,
            count=1,
        )
        if count != 1:
            raise ValueError(f"No <body> found in {relative}")

    if not OG_TITLE_RE.search(text) or not TWITTER_CARD_RE.search(text):
        text, count = HEAD_END_RE.subn(social_metadata(title, description, canonical) + "</head>", text, count=1)
        if count != 1:
            raise ValueError(f"No </head> found in {relative}")

    if relative == "mock-exam.html":
        text = text.replace("Official-Pattern Mock Exam | Polytechnic Study Hub", "Official-Pattern Mock Exam | POLY PMNA")
        text = text.replace("Polytechnic Study Hub home", "POLY PMNA home")
        text = text.replace("<strong>Polytechnic Study Hub</strong>", "<strong>POLY PMNA</strong>")
        text = text.replace("&copy; <span data-year></span> Polytechnic Study Hub.", "&copy; <span data-year></span> POLY PMNA.")
        if '<a href="/revision-2026.html">Revision 2026</a>' not in text:
            text = text.replace(
                '<a href="/about.html">About</a><a href="/revision-2021.html">Revision 2021</a>',
                '<a href="/about.html">About</a><a href="/revision-2026.html">Revision 2026</a><a href="/revision-2021.html">Revision 2021</a>',
            )

    if text == original:
        return False
    path.write_text(text, encoding="utf-8")
    return True


def validate() -> list[str]:
    failures: list[str] = []
    for relative in LESSONS_MISSING_H1:
        text = read(ROOT / relative)
        if len(H1_OPEN_RE.findall(text)) != 1:
            failures.append(f"{relative}: expected exactly one H1")
    description_text = read(ROOT / LESSON_MISSING_DESCRIPTION)
    if not DESCRIPTION_RE.search(description_text):
        failures.append(f"{LESSON_MISSING_DESCRIPTION}: missing description")
    for relative in MOCK_PAGES:
        text = read(ROOT / relative)
        if len(H1_OPEN_RE.findall(text)) != 1:
            failures.append(f"{relative}: expected exactly one H1")
        if not SKIP_RE.search(text):
            failures.append(f"{relative}: missing skip link")
        if not OG_TITLE_RE.search(text):
            failures.append(f"{relative}: missing Open Graph metadata")
        if not TWITTER_CARD_RE.search(text):
            failures.append(f"{relative}: missing Twitter metadata")
    return failures


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    if not args.check:
        changed: list[str] = []
        for relative in LESSONS_MISSING_H1:
            if repair_lesson_h1(relative):
                changed.append(relative)
        if repair_lesson_description():
            changed.append(LESSON_MISSING_DESCRIPTION)
        for relative in MOCK_PAGES:
            if repair_mock(relative):
                changed.append(relative)
        print(f"Repaired {len(changed)} legacy quality-gate files.")
    failures = validate()
    if failures:
        print("Legacy markup validation failed:")
        print("\n".join(f"- {failure}" for failure in failures))
        return 1
    print("Legacy lesson and mock-exam markup validated.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
