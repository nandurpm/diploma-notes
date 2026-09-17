#!/usr/bin/env python3
"""Repair deterministic static accessibility findings without reformatting lesson HTML.

The tool is deliberately narrow: it only changes sitemap pages that the local audit
identifies as missing a main landmark or an accessible programmatic name for an
input, textarea, or select control. It preserves existing lesson content, scripts,
and whitespace outside the exact opening tags it repairs.
"""

from __future__ import annotations

import argparse
import os
import re
import sys
import xml.etree.ElementTree as ET
from pathlib import Path
from urllib.parse import urlparse

from bs4 import BeautifulSoup


ROOT = Path(__file__).resolve().parents[1]
SITEMAP_NS = {"s": "http://www.sitemaps.org/schemas/sitemap/0.9"}
MAIN_TARGETS = {
    "lessons/lessons-1004.html",
    "lessons/lessons-3031.html",
    "lessons/lessons-3042.html",
    "lessons/lessons-4031.html",
    "lessons/lessons-4041.html",
    "lessons/lessons-5042.html",
}
SKIPPED_TYPES = {"hidden", "submit", "button", "reset"}
CONTROL_TAG_RE = re.compile(r"<(?P<tag>input|textarea|select)\b[^>]*>", re.IGNORECASE)
BODY_OPEN_RE = re.compile(r"<body\b[^>]*>", re.IGNORECASE)
BODY_CLOSE_RE = re.compile(r"</body\s*>", re.IGNORECASE)
HEADER_CLOSE_RE = re.compile(r"</header\s*>", re.IGNORECASE)
FOOTER_OPEN_RE = re.compile(r"<footer\b", re.IGNORECASE)
MAIN_CONTENT_OPEN_RE = re.compile(r'<div\s+class=(["\'])main-content\1\s*>', re.IGNORECASE)
MAIN_CONTENT_CLOSE_RE = re.compile(r'</div>\s*<!--\s*main-content\s*-->', re.IGNORECASE)


def sitemap_pages() -> list[Path]:
    sitemap = ET.parse(ROOT / "sitemap.xml")
    pages: list[Path] = []
    for node in sitemap.findall("s:url/s:loc", SITEMAP_NS):
        location = (node.text or "").strip()
        if not location:
            continue
        path = urlparse(location).path.lstrip("/") or "index.html"
        pages.append(ROOT / path)
    return pages


def has_accessible_name(soup: BeautifulSoup, control) -> bool:
    control_type = (control.get("type") or "").lower()
    if control_type in SKIPPED_TYPES:
        return True
    control_id = control.get("id")
    has_label = bool(
        (control_id and soup.find("label", attrs={"for": control_id}))
        or control.find_parent("label")
    )
    return bool(
        has_label
        or control.get("aria-label")
        or control.get("aria-labelledby")
        or control.get("title")
    )


def missing_control_keys(source: str) -> set[tuple[str, str]]:
    soup = BeautifulSoup(source, "html.parser")
    missing: set[tuple[str, str]] = set()
    unnamed: list[str] = []
    for control in soup.find_all(["input", "textarea", "select"]):
        if has_accessible_name(soup, control):
            continue
        control_id = control.get("id")
        if not control_id:
            unnamed.append(str(control)[:120])
            continue
        missing.add((control.name.lower(), control_id))
    if unnamed:
        preview = "\n".join(unnamed)
        raise ValueError(f"Encountered unnamed controls that need manual handling:\n{preview}")
    return missing


def tag_attribute(tag: str, name: str) -> str | None:
    match = re.search(rf"\b{re.escape(name)}\s*=\s*([\"'])(.*?)\1", tag, re.IGNORECASE | re.DOTALL)
    return match.group(2) if match else None


def humanize(identifier: str) -> str:
    words = re.sub(r"([a-z0-9])([A-Z])", r"\1 \2", identifier)
    words = re.sub(r"([A-Za-z])([0-9])", r"\1 \2", words)
    words = re.sub(r"([0-9])([A-Za-z])", r"\1 \2", words)
    words = re.sub(r"[_-]+", " ", words)
    return " ".join(words.split())


def accessible_name(tag_name: str, identifier: str) -> str:
    lowered = identifier.lower()
    if "search" in lowered:
        return "Search lessons"
    words = humanize(identifier)
    if tag_name == "select":
        if "department" in lowered:
            return "Select department"
        if "semester" in lowered:
            return "Select semester"
        return f"Select {words}"
    if tag_name == "textarea":
        return f"Text input: {words}"
    return f"Calculator input: {words}"


def insert_aria_label(tag: str, label: str) -> str:
    escaped = label.replace("&", "&amp;").replace('"', "&quot;")
    if tag.endswith("/>"):
        return f'{tag[:-2]} aria-label="{escaped}"/>'
    return f'{tag[:-1]} aria-label="{escaped}">'


def repair_control_names(source: str) -> str:
    keys = missing_control_keys(source)
    if not keys:
        return source

    def replace(match: re.Match[str]) -> str:
        tag = match.group(0)
        tag_name = match.group("tag").lower()
        identifier = tag_attribute(tag, "id")
        if not identifier or (tag_name, identifier) not in keys:
            return tag
        return insert_aria_label(tag, accessible_name(tag_name, identifier))

    updated = CONTROL_TAG_RE.sub(replace, source)
    remaining = missing_control_keys(updated)
    if remaining:
        raise ValueError(f"Could not repair all unlabelled controls: {sorted(remaining)}")
    return updated


def repair_main_landmark(relative: str, source: str) -> str:
    if relative not in MAIN_TARGETS or BeautifulSoup(source, "html.parser").find("main"):
        return source
    if relative == "lessons/lessons-3031.html":
        opened, opened_count = MAIN_CONTENT_OPEN_RE.subn('<main id="main-content" class="main-content">', source, count=1)
        updated, closed_count = MAIN_CONTENT_CLOSE_RE.subn('</main><!-- main-content -->', opened, count=1)
        if opened_count != 1 or closed_count != 1:
            raise ValueError(f"Could not convert the existing main-content container in {relative}")
        return updated
    body_open = BODY_OPEN_RE.search(source)
    body_close_matches = list(BODY_CLOSE_RE.finditer(source))
    if not body_open or not body_close_matches:
        raise ValueError(f"Could not locate body boundaries in {relative}")
    start = body_open.end()
    end = body_close_matches[-1].start()
    return f'{source[:start]}\n<main id="main-content">{source[start:end]}\n</main>{source[end:]}'


def audit_remaining(source: str) -> tuple[bool, set[tuple[str, str]]]:
    soup = BeautifulSoup(source, "html.parser")
    return bool(soup.find("main")), missing_control_keys(source)


def repair_page(path: Path, check: bool) -> bool:
    source = path.read_text(encoding="utf-8", errors="replace")
    relative = path.relative_to(ROOT).as_posix()
    updated = repair_main_landmark(relative, source)
    updated = repair_control_names(updated)
    has_main, missing = audit_remaining(updated)
    if relative in MAIN_TARGETS and not has_main:
        raise ValueError(f"Missing main landmark after repair: {relative}")
    if missing:
        raise ValueError(f"Unlabelled controls remain in {relative}: {sorted(missing)}")
    if source == updated:
        return False
    if check:
        raise ValueError(f"Accessibility repair required: {relative}")
    base_real = os.path.realpath(ROOT)
    target_real = os.path.realpath(path)
    if os.path.commonpath([base_real, target_real]) != base_real:
        raise ValueError("Invalid file path")
    Path(target_real).write_text(updated, encoding="utf-8")
    return True


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true", help="Fail when any sitemap page still needs repair.")
    args = parser.parse_args()
    changed: list[Path] = []
    for page in sitemap_pages():
        if not page.exists():
            continue
        try:
            if repair_page(page, args.check):
                changed.append(page)
        except ValueError as error:
            print(f"ERROR: {error}", file=sys.stderr)
            return 1
    if args.check:
        print("Verified static landmarks and programmatic control names on sitemap pages.")
    else:
        print(f"Repaired static accessibility markup on {len(changed)} sitemap pages.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
