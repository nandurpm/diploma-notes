#!/usr/bin/env python3
from __future__ import annotations

import html
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LESSONS = ROOT / "lessons"


def set_meta(text: str, attribute: str, key: str, value: str) -> str:
    pattern = re.compile(
        rf"<meta\b(?=[^>]*\b{attribute}\s*=\s*(['\"]){re.escape(key)}\1)[^>]*>",
        flags=re.I,
    )
    tag = f'<meta {attribute}="{key}" content="{html.escape(value, quote=True)}">'
    if pattern.search(text):
        return pattern.sub(tag, text, count=1)
    return text.replace("</head>", f"  {tag}\n</head>", 1)


def write_if_changed(path: Path, text: str) -> None:
    original = path.read_text(encoding="utf-8")
    if text != original:
        path.write_text(text, encoding="utf-8")
        print(f"Updated {path.relative_to(ROOT)}")


# Make the audit parser read only the document head title, not SVG <title> nodes.
audit_path = ROOT / "tools/audit_site.py"
audit = audit_path.read_text(encoding="utf-8")
if "self.title_seen = False" not in audit:
    audit = audit.replace(
        "        self.in_title = False\n",
        "        self.in_title = False\n        self.title_seen = False\n",
        1,
    )
audit = audit.replace(
    '        if lower == "title":\n            self.in_title = True\n',
    '        if lower == "title" and not self.title_seen:\n            self.in_title = True\n            self.title_seen = True\n',
    1,
)
audit_path.write_text(audit, encoding="utf-8")

# 1004: add a static, accessible H1 for crawlers and no-JS users.
path = LESSONS / "lessons-1004.html"
text = path.read_text(encoding="utf-8")
if "static-page-title" not in text:
    text = text.replace(
        "</style>",
        ".static-page-title{position:absolute!important;width:1px!important;height:1px!important;padding:0!important;margin:-1px!important;overflow:hidden!important;clip:rect(0,0,0,0)!important;white-space:nowrap!important;border:0!important}\n</style>",
        1,
    )
    text = text.replace(
        '<div id="app" class="app-root"></div>',
        '<h1 class="static-page-title">Applied Chemistry-I</h1>\n<div id="app" class="app-root"></div>',
        1,
    )
text = text.replace(
    '<button id="downloadPdf" class="printbtn" type="button">Download PDF</button>',
    '<button id="downloadPdf" class="printbtn" type="button">Print / Save as PDF</button>',
)
write_if_changed(path, text)

# 2031: complete explicit Twitter title and description metadata.
path = LESSONS / "lessons-2031.html"
text = path.read_text(encoding="utf-8")
title = "Fundamentals of Electrical and Electronics Engineering 2031 | Kerala Polytechnic Study Hub"
description = "Fundamentals of Electrical and Electronics Engineering 2031 diploma handbook with electrical circuits, electronics, formulas, revision and exam preparation."
text = set_meta(text, "name", "twitter:title", title)
text = set_meta(text, "name", "twitter:description", description)
write_if_changed(path, text)

# 3032: complete missing Open Graph metadata and normalize its public title.
path = LESSONS / "lessons-3032.html"
text = path.read_text(encoding="utf-8")
ntitle = "DC Machines & Traction Motors 3032 | Kerala Polytechnic Study Hub"
description = "DC Machines and Traction Motors 3032 diploma handbook with construction, working principles, characteristics, diagrams, numericals and revision answers."
text = re.sub(r"<title\b[^>]*>.*?</title>", f"<title>{html.escape(ntitle)}</title>", text, count=1, flags=re.I | re.S)
text = set_meta(text, "name", "description", description)
text = set_meta(text, "property", "og:type", "website")
text = set_meta(text, "property", "og:title", ntitle)
text = set_meta(text, "property", "og:description", description)
text = set_meta(text, "name", "twitter:title", ntitle)
text = set_meta(text, "name", "twitter:description", description)
write_if_changed(path, text)

# 3041: remove the nonexistent PDF reference and use the working print dialog.
path = LESSONS / "lessons-3041.html"
text = path.read_text(encoding="utf-8")
text = text.replace(
    '<a class="download-pdf-btn" href="downloadable-notes-3041.pdf" download>Download PDF</a>',
    '<button type="button" class="download-pdf-btn" onclick="window.print()">Print / Save as PDF</button>',
)
text = text.replace(
    '<div class="stat"><b>0</b><span>PDF conversion scripts</span></div>',
    '<div class="stat"><b>A4</b><span>Print-ready layout</span></div>',
)
text = text.replace(
    '<div class="stat"><b>100%</b><span>Direct PDF link only</span></div>',
    '<div class="stat"><b>1-click</b><span>Print / Save as PDF</span></div>',
)
write_if_changed(path, text)
