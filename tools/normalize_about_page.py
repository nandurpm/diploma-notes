#!/usr/bin/env python3
"""Keep the redesigned About page asset links and key bilingual copy current."""
from __future__ import annotations

import argparse
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PAGE = ROOT / "about.html"
REVEAL_LINK = '  <link rel="stylesheet" href="/assets/css/about-reveal.css?v=20260720-about2">\n'
ANCHOR = '  <link rel="stylesheet" href="/assets/css/about-experience.css?v=20260720-about2">\n'
OLD_HEADING = 'data-en="About" data-ml="POLY PMNAയെ">About</span>'
NEW_HEADING = 'data-en="About" data-ml="പരിചയപ്പെടാം:">About</span>'


def normalized(text: str) -> str:
    updated = text.replace(OLD_HEADING, NEW_HEADING)
    if REVEAL_LINK not in updated:
        if ANCHOR not in updated:
            raise ValueError("About experience stylesheet anchor is missing")
        updated = updated.replace(ANCHOR, ANCHOR + REVEAL_LINK, 1)
    return updated


def validate(text: str) -> list[str]:
    failures: list[str] = []
    if text.count(REVEAL_LINK.strip()) != 1:
        failures.append("About reveal stylesheet must be linked exactly once")
    if OLD_HEADING in text:
        failures.append("Old Malayalam hero heading remains")
    if NEW_HEADING not in text:
        failures.append("Normalized Malayalam hero heading is missing")
    return failures


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    text = PAGE.read_text(encoding="utf-8")
    updated = normalized(text)
    if not args.check and updated != text:
        PAGE.write_text(updated, encoding="utf-8")
        print("Normalized About page assets and Malayalam heading.")
    failures = validate(updated)
    if failures:
        print("\n".join(f"- {item}" for item in failures))
        return 1
    if args.check:
        print("About page normalization verified.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
