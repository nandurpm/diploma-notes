#!/usr/bin/env python3
"""Repair double-escaped rich content in REV2026 elective lesson files.

The generator that produced the semester-6 elective lessons (6021A..6501C)
double-encoded parts of its output. Four corruption classes reach students:

  1. Escaped block markup inside <p>: <p>&lt;p&gt;...&lt;/p&gt;</p> plus
     double-wrapped Malayalam notes rendered as visible source text.
  2. Whole escaped <table> blocks inside <p>, nested in a stray
     <div class="table-wrap"> that must be unwrapped.
  3. Character-split checklists: each letter wrapped in its own <li>.
  4. Truncated fragments at table-cell boundaries such as &lt;</td></tr>.

Run: python3 tools/repair_rev2026_elective_lessons.py [--check]
"""
from __future__ import annotations

import argparse
import html
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LESSON_GLOB = "revision-2026-content/lessons/lessons-6*.html"

# ---------------------------------------------------------------- helpers


def unescape_blocks(text: str) -> tuple[str, int]:
    """Decode &lt;...&gt; sequences that the generator double-encoded.

    Runs of escaped markup (&lt;entity&gt;... ) are decoded in one pass,
    but already-plain characters must stay untouched. We only decode when
    the run actually looks like markup (starts with a tag).
    """
    changed = 0

    def repl(m: re.Match) -> str:
        nonlocal changed
        decoded = html.unescape(m.group(0))
        if decoded != m.group(0):
            changed += 1
        return decoded

    # decode any run that begins with an escaped opening/closing tag and
    # contains only escaped markup, entities, text without raw "<"
    pattern = re.compile(r"(?:&lt;/?[A-Za-z][^&]*?&gt;)+[^<]*")
    return pattern.sub(repl, text), changed


def fix_malayalam_double_wrap(text: str) -> tuple[str, int]:
    """<strong>Malayalam support:</strong><span lang="ml"> ESCAPED-STRONG
    ESCAPED-SPAN ...</span></span></div>  ->  single clean ml-note span."""
    pattern = re.compile(
        r'<div class="ml-note"><strong>Malayalam support:</strong>'
        r'<span lang="ml">\s*&lt;strong&gt;Malayalam support:&lt;/strong&gt;\s*'
        r'&lt;span lang="ml"&gt;(.*?)&lt;/span&gt;</span></div>',
        re.S,
    )
    count = 0

    def repl(m: re.Match) -> str:
        nonlocal count
        count += 1
        inner = html.unescape(m.group(1)).strip()
        # the decoded inner text may itself carry the duplicated label
        inner = re.sub(r"^(?:<strong>Malayalam support:</strong>\s*)", "", inner)
        inner = re.sub(r'^<span lang="ml">\s*', "", inner)
        inner = re.sub(r"</span>\s*$", "", inner)
        return (
            '<div class="ml-note"><strong>Malayalam support:</strong>'
            f'<span lang="ml"> {inner.strip()}</span></div>'
        )

    return pattern.sub(repl, text), count


def fix_truncated_fragments(text: str) -> tuple[str, int]:
    """Remove generator-truncated escaped fragments adjacent to raw tags."""
    count = 0
    patterns = [
        # &lt;</td></tr><t...  ->  keep only the raw continuation
        (re.compile(r"&lt;(?=</td>)"), "&lt;"),
    ]
    for pat, _repl in patterns:
        pass
    # fragment: an escaped partial tag immediately followed by a raw tag
    fragment = re.compile(r"&lt;(?=[a-zA-Z/])")
    # only treat as garbage when the character after &lt; is NOT a letter
    # sequence that forms a known complete escaped tag handled elsewhere;
    # here we handle the literal "&lt;<" mixed boundary observed in files:
    mixed = re.compile(r"&lt;(</td>)")
    new_text, n = mixed.subn(r"\1", text)
    count += n
    return new_text, count


def fix_char_split_lists(text: str) -> tuple[str, int]:
    """Merge runs of single-character <li> items back into words/sentences."""
    run_re = re.compile(r"(?:<li>[^<]{0,2}</li>){8,}")
    count = 0

    def repl(m: re.Match) -> str:
        nonlocal count
        chars = re.findall(r"<li>([^<]{0,2})</li>", m.group(0))
        joined = html.unescape("".join(chars)).strip()
        if not joined:
            return m.group(0)
        count += 1
        items = [part.strip() for part in joined.split(";") if part.strip()]
        if len(items) > 1:
            # keep the final punctuation inside the last item; the original
            # <ul class="checklist"> wrapper stays in place around the run
            lis = "".join(f"<li>{html.escape(i)}</li>" for i in items)
            return lis
        return f"<li>{html.escape(joined)}</li>"

    return run_re.sub(repl, text), count


def unwrap_stray_table_divs(text: str) -> tuple[str, int]:
    """After decoding, tables may sit inside a duplicated
    <div class="table-wrap"><div class="table-wrap"> ... </div></div>."""
    pattern = re.compile(
        r'<div class="table-wrap"><div class="table-wrap">(.*?)</div></div>',
        re.S,
    )
    return pattern.subn(r'<div class="table-wrap">\1</div>', text)


VOID_ELEMENTS = {
    "area", "base", "br", "col", "embed", "hr", "img", "input",
    "link", "meta", "param", "source", "track", "wbr",
}
TAG_RE = re.compile(r"<(/?)([a-zA-Z][a-zA-Z0-9]*)\b[^>]*?(/?)>")


def _open_stack(inner: str) -> list[str]:
    stack: list[str] = []
    for m in TAG_RE.finditer(inner):
        closing, name, selfclose = m.groups()
        lname = name.lower()
        if lname in VOID_ELEMENTS or selfclose:
            continue
        if closing:
            if stack and stack[-1] == lname:
                stack.pop()
        else:
            stack.append(lname)
    return stack


def close_truncated_table_cells(text: str) -> tuple[str, int]:
    """Generator truncation left table cells with unclosed <p>/<strong>.
    Close every still-open tag before the cell boundary and mark the
    truncated prose with an ellipsis so students see a clean cell."""
    cell_re = re.compile(r"(<t[dh]\b[^>]*>)(.*?)(</t[dh]>)", re.S)
    count = 0

    def repl(m: re.Match) -> str:
        nonlocal count
        open_tag, inner, close_tag = m.groups()
        stack = _open_stack(inner)
        if not stack:
            return m.group(0)
        count += 1
        fixed = inner.rstrip()
        for name in reversed(stack):
            if not fixed.endswith(f"</{name}>"):
                fixed += f"</{name}>"
        textonly = re.sub(r"<[^>]+>", "", fixed).rstrip()
        if re.search(r"[A-Za-z0-9,)]$", textonly):
            fixed += "\u2026"
        return open_tag + fixed + close_tag

    return cell_re.sub(repl, text), count


def collapse_nested_paragraphs(text: str) -> tuple[str, int]:
    """Decoding exposed nested <p><p>…</p></p> wrappers from the outer
    generator paragraph. Nested <p> is invalid; collapse the pairs."""
    open_pair = re.compile(r"<p>(\s*)<p>")
    close_pair = re.compile(r"</p>(\s*)</p>")
    count = 0
    prev = None
    while prev != text:
        prev = text
        text, n1 = open_pair.subn(r"<p>", text)
        text, n2 = close_pair.subn(r"</p>", text)
        count += n1 + n2
    return text, count


def repair(text: str) -> tuple[str, dict[str, int]]:
    stats: dict[str, int] = {}
    text, stats["truncated"] = fix_truncated_fragments(text)
    text, stats["ml_double"] = fix_malayalam_double_wrap(text)
    text, stats["escaped_runs"] = unescape_blocks(text)
    text, stats["split_lists"] = fix_char_split_lists(text)
    text, stats["nested_p"] = collapse_nested_paragraphs(text)
    text, stats["truncated_cells"] = close_truncated_table_cells(text)
    text, stats["nested_table_div"] = unwrap_stray_table_divs(text)
    return text, stats


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()

    files = sorted(ROOT.glob(LESSON_GLOB))
    total_stats: dict[str, int] = {}
    touched = 0
    for path in files:
        raw = path.read_text(encoding="utf-8")
        if "<p>&lt;p&gt;" not in raw and "&lt;/td" not in raw and not re.search(
            r"(?:<li>[^<]{0,2}</li>){8,}", raw
        ):
            continue
        fixed, stats = repair(raw)
        rel = path.relative_to(ROOT)
        if args.check:
            print(f"[check] {rel}: {stats}")
            continue
        if fixed != raw:
            path.write_text(fixed, encoding="utf-8")
            touched += 1
            print(f"[fixed] {rel}: {stats}")
        for k, v in stats.items():
            total_stats[k] = total_stats.get(k, 0) + v

    if not args.check:
        print(f"\nfiles rewritten: {touched}")
        print("total repairs:", total_stats)
    return 0


if __name__ == "__main__":
    sys.exit(main())
