#!/usr/bin/env python3
"""Fail CI on duplicate IDs, duplicate script includes, or nested forms in blog surfaces."""
from __future__ import annotations

from collections import Counter
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TARGETS = (
    ROOT / "blog.html",
    ROOT / "blog/contribute.html",
    ROOT / "admin/blog.html",
    ROOT / "admin/review.html",
)


class AuditParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.ids: list[str] = []
        self.scripts: list[str] = []
        self.form_depth = 0
        self.nested_forms = 0
        self.footer_count = 0

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        values = dict(attrs)
        if values.get("id"):
            self.ids.append(values["id"] or "")
        if tag == "script" and values.get("src"):
            self.scripts.append(values["src"] or "")
        if tag == "form":
            if self.form_depth:
                self.nested_forms += 1
            self.form_depth += 1
        if tag == "footer":
            self.footer_count += 1

    def handle_endtag(self, tag: str) -> None:
        if tag == "form" and self.form_depth:
            self.form_depth -= 1


def duplicates(values: list[str]) -> list[str]:
    counts = Counter(values)
    return sorted(value for value, count in counts.items() if value and count > 1)


def main() -> int:
    failures: list[str] = []
    for path in TARGETS:
        parser = AuditParser()
        parser.feed(path.read_text(encoding="utf-8"))
        rel = path.relative_to(ROOT).as_posix()
        dup_ids = duplicates(parser.ids)
        dup_scripts = duplicates(parser.scripts)
        if dup_ids:
            failures.append(f"{rel}: duplicate ids: {', '.join(dup_ids)}")
        if dup_scripts:
            failures.append(f"{rel}: duplicate script src values: {', '.join(dup_scripts)}")
        if parser.nested_forms:
            failures.append(f"{rel}: contains {parser.nested_forms} nested form(s)")
        if parser.form_depth:
            failures.append(f"{rel}: contains unclosed form markup")
        if parser.footer_count != 1:
            failures.append(f"{rel}: expected exactly one footer, found {parser.footer_count}")
    if failures:
        raise SystemExit("\n".join(failures))
    print("Blog markup integrity checks passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
