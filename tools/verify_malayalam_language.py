#!/usr/bin/env python3
"""Verify that visible Malayalam prose is contained by lang="ml" markup."""
from __future__ import annotations

from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SKIP_DIRS = {".git", "node_modules", "_site"}
SKIP_TAGS = {"script", "style", "pre", "code", "title", "textarea", "option"}
VOID_TAGS = {"area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"}


class MalayalamParser(HTMLParser):
    def __init__(self, path: Path) -> None:
        super().__init__(convert_charrefs=True)
        self.path = path
        self.stack: list[tuple[str, str]] = []
        self.failures: list[tuple[int, str]] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        normalized_tag = tag.lower()
        if normalized_tag in VOID_TAGS:
            return
        lang = next((value or "" for key, value in attrs if key.lower() == "lang"), "")
        self.stack.append((normalized_tag, lang.lower()))

    def handle_startendtag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        return

    def handle_endtag(self, tag: str) -> None:
        target = tag.lower()
        for index in range(len(self.stack) - 1, -1, -1):
            if self.stack[index][0] == target:
                del self.stack[index:]
                break

    def handle_data(self, data: str) -> None:
        if not any("\u0D00" <= char <= "\u0D7F" for char in data):
            return
        if any(tag in SKIP_TAGS for tag, _ in self.stack):
            return
        if any(lang == "ml" for _, lang in self.stack):
            return
        line = self.getpos()[0]
        excerpt = " ".join(data.split())[:180]
        self.failures.append((line, excerpt))


def main() -> int:
    failures: list[str] = []
    checked = 0
    for path in sorted(ROOT.rglob("*.html")):
        if any(part in SKIP_DIRS for part in path.parts):
            continue
        checked += 1
        parser = MalayalamParser(path)
        parser.feed(path.read_text(encoding="utf-8", errors="ignore"))
        relative = path.relative_to(ROOT).as_posix()
        for line, excerpt in parser.failures:
            failures.append(f"{relative}:{line}: Malayalam text lacks lang=ml: {excerpt}")

    if failures:
        print("\n".join(failures))
        print(f"\nChecked {checked} HTML files; failures={len(failures)}")
        return 1
    print(f"Verified lang=ml coverage for visible Malayalam text in {checked} public HTML files.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
