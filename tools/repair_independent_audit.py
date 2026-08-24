#!/usr/bin/env python3
"""Apply scoped, repeatable fixes from the 2026-08-15 independent portal audit."""

from __future__ import annotations

import re
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def write_if_changed(path: Path, original: str, updated: str, changed: list[str]) -> None:
    if updated != original:
        path.write_text(updated, encoding="utf-8")
        changed.append(str(path.relative_to(ROOT)))


def add_noopener(path: Path, changed: list[str]) -> None:
    original = path.read_text(encoding="utf-8")

    def repair(match: re.Match[str]) -> str:
        tag = match.group(0)
        if not re.search(r"\btarget\s*=\s*(['\"])_blank\1", tag, re.I):
            return tag
        if re.search(r"\brel\s*=", tag, re.I):
            return tag
        return tag[:-1] + ' rel="noopener noreferrer">'

    updated = re.sub(r"<a\b[^>]*>", repair, original, flags=re.I)
    write_if_changed(path, original, updated, changed)


def repair_dead_shorthand_link(path: Path, changed: list[str]) -> None:
    original = path.read_text(encoding="utf-8")
    old = '<a href="https://nssbooks.com/learn shorthand" target="_blank" rel="noopener noreferrer">https://nssbooks.com/learn shorthand</a>'
    replacement = "Supplementary shorthand-learning reference currently unavailable; consult instructor-recommended resources."
    updated = original.replace(old, replacement)
    write_if_changed(path, original, updated, changed)


def repair_duplicate_svg_ids(path: Path, changed: list[str]) -> None:
    original = path.read_text(encoding="utf-8")
    counts = Counter(re.findall(r'\bid="([^"]+)"', original))
    duplicate_ids = {item for item, count in counts.items() if count > 1}
    occurrence: defaultdict[str, int] = defaultdict(int)

    def rewrite_svg(match: re.Match[str]) -> str:
        svg = match.group(0)
        for item in duplicate_ids:
            if f'id="{item}"' not in svg:
                continue
            occurrence[item] += 1
            if occurrence[item] == 1:
                continue
            replacement = f"{item}-{occurrence[item]}"
            svg = svg.replace(f'id="{item}"', f'id="{replacement}"')
            svg = re.sub(
                r'(aria-(?:labelledby|describedby)="[^"]*)\b' + re.escape(item) + r'\b',
                lambda reference: reference.group(1).replace(item, replacement),
                svg,
            )
        return svg

    updated = re.sub(r"<svg\b[^>]*>.*?</svg>", rewrite_svg, original, flags=re.I | re.S)
    remaining = Counter(re.findall(r'\bid="([^"]+)"', updated))
    unresolved = {item: count for item, count in remaining.items() if count > 1 and item in duplicate_ids}
    if unresolved:
        raise RuntimeError(f"Unresolved duplicate IDs in {path}: {unresolved}")
    write_if_changed(path, original, updated, changed)


def page_description(path: Path, text: str) -> str:
    if path.name == "offline.html":
        return "Offline information for POLY PMNA, the Kerala Polytechnic study portal."
    if path.name == "ask-poly-v2.html":
        return "Redirect to the current Ask POLY AI study assistant on POLY PMNA."
    if "maintenance" in path.parts:
        return "Maintenance information for the POLY PMNA Kerala Polytechnic study portal."
    title = re.search(r"<title[^>]*>\s*(.*?)\s*</title>", text, re.I | re.S)
    title_text = re.sub(r"\s+", " ", title.group(1)).strip() if title else path.stem.replace("-", " ")
    return f"Study material for {title_text} on POLY PMNA, the Kerala Polytechnic study portal."[:220]


def add_description(path: Path, changed: list[str]) -> None:
    original = path.read_text(encoding="utf-8")
    if re.search(r"<meta\s+name\s*=\s*['\"]description['\"]", original, re.I):
        return
    description = page_description(path, original).replace('"', "&quot;")
    meta = f'<meta name="description" content="{description}">'
    viewport = re.search(r"<meta\b[^>]*\bname\s*=\s*['\"]viewport['\"][^>]*>", original, re.I)
    if viewport:
        updated = original[:viewport.end()] + meta + original[viewport.end():]
    else:
        head = re.search(r"<head[^>]*>", original, re.I)
        if not head:
            return
        updated = original[:head.end()] + meta + original[head.end():]
    write_if_changed(path, original, updated, changed)


def main() -> None:
    changed: list[str] = []
    lessons_dir = ROOT / "revision-2026-content" / "lessons"
    repair_duplicate_svg_ids(lessons_dir / "lessons-2182.html", changed)
    repair_duplicate_svg_ids(lessons_dir / "lessons-2132.html", changed)

    external_targets = [lessons_dir / "lessons-1252.html", lessons_dir / "lessons-1144.html"]
    for path in external_targets:
        add_noopener(path, changed)
    repair_dead_shorthand_link(lessons_dir / "lessons-1144.html", changed)

    metadata_paths = [
        ROOT / "offline.html",
        ROOT / "ask-poly-v2.html",
        ROOT / "maintenance" / "index.html",
        ROOT / "android-app" / "app" / "src" / "main" / "assets" / "offline.html",
        lessons_dir / "lessons-1091.html",
        *sorted((ROOT / "lessons").glob("*.html")),
    ]
    for path in metadata_paths:
        add_description(path, changed)

    print(f"Updated {len(changed)} source files.")
    for path in changed:
        print(path)


if __name__ == "__main__":
    main()
