#!/usr/bin/env python3
"""Pre-render Revision 2021 subject cards into every department HTML page.

JavaScript remains responsible for live filtering, but students, crawlers and
failed-script sessions receive the complete subject directory from HTML source.
"""
from __future__ import annotations

import argparse
import html
import re
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
COMMON = "First Year / Common"
OBJECT_RE = re.compile(r"\{[^{}]*\brevision\s*:\s*[\"']2021[\"'][^{}]*\}", re.S)
PAIR_RE = re.compile(r"\b(revision|code|name|department|semester|type|assetCode)\s*:\s*[\"']([^\"']*)[\"']")
GRID_RE = re.compile(
    r'(<div\b[^>]*\bid=["\']subjectGrid["\'][^>]*>)[\s\S]*?(</div>\s*<noscript>)',
    re.I,
)
DEPARTMENT_RE = re.compile(r'data-department=["\']([^"\']+)["\']', re.I)
SEMESTER_NUMBER_RE = re.compile(r"(\d+)")
START = "<!-- STATIC REV2021 SUBJECTS START -->"
END = "<!-- STATIC REV2021 SUBJECTS END -->"


def parse_records(path: Path) -> list[dict[str, str]]:
    text = path.read_text(encoding="utf-8")
    records: list[dict[str, str]] = []
    for block in OBJECT_RE.findall(text):
        record = dict(PAIR_RE.findall(block))
        if all(record.get(key) for key in ("revision", "code", "name", "department", "semester", "type")):
            record["assetCode"] = record.get("assetCode") or record["code"]
            records.append(record)
    return records


def normalized(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", " ", html.unescape(value).lower().replace("&", " and ")).strip()


def semester_rank(value: str) -> tuple[int, str]:
    match = SEMESTER_NUMBER_RE.search(value)
    return (int(match.group(1)) if match else 999, value)


def subject_key(record: dict[str, str]) -> tuple[str, ...]:
    return (
        record["revision"], normalized(record["department"]), record["semester"],
        record["code"].upper(), record["name"].lower(),
    )


def all_records() -> list[dict[str, str]]:
    records = parse_records(ROOT / "assets/js/subjects.js")
    # Preserve the small set of manually curated records used by the browser.
    records.extend(parse_records(ROOT / "assets/js/subject-browser.js"))
    unique: dict[tuple[str, ...], dict[str, str]] = {}
    for record in records:
        unique.setdefault(subject_key(record), record)
    return list(unique.values())


def paths(record: dict[str, str]) -> tuple[str, str, bool, bool]:
    code = record["assetCode"]
    lesson_local = Path("lessons") / f"lessons-{code}.html"
    notes_local = Path("notes") / f"downloadable-notes-{code}.pdf"
    return (
        "/" + lesson_local.as_posix(),
        "/" + notes_local.as_posix(),
        (ROOT / lesson_local).is_file(),
        (ROOT / notes_local).is_file(),
    )


def card(record: dict[str, str]) -> str:
    code = record["code"]
    lesson_href, notes_href, lesson_ok, notes_ok = paths(record)
    syllabus = "https://www.sitttrkerala.ac.in/index.php?r=site%2Fdiploma-syllabus-course-contents&amp;course=" + html.escape(code, quote=True)
    model_qp = "https://www.sitttrkerala.ac.in/index.php?r=site%2Fdiploma-modelqp-courses-show&amp;course=" + html.escape(code, quote=True)
    if lesson_ok:
        download_href = notes_href if notes_ok else lesson_href + "?autoPrintNotes=1"
        download_attr = " download" if notes_ok else ' target="_blank" rel="noopener noreferrer"'
        study = (
            f'<a class="action lessons" href="{html.escape(lesson_href, quote=True)}">View Lessons</a>'
            f'<a class="action download" href="{html.escape(download_href, quote=True)}"{download_attr}>Download Notes</a>'
        )
    else:
        study = (
            '<span class="availability-label lessons-status" aria-disabled="true">Lessons unavailable</span>'
            '<span class="availability-label notes-status" aria-disabled="true">Notes unavailable</span>'
        )
    search = " ".join((code, record["name"], record["department"], record["semester"], record["type"])).lower()
    return (
        f'<article class="subject-card reveal" data-subject-code="{html.escape(code.upper(), quote=True)}" '
        f'data-revision="2021" data-semester="{html.escape(record["semester"], quote=True)}" '
        f'data-search-text="{html.escape(search, quote=True)}" '
        f'data-notes-href="{html.escape(notes_href, quote=True)}" '
        f'data-lesson-href="{html.escape(lesson_href, quote=True)}" '
        f'data-lesson-available="{str(lesson_ok).lower()}" data-notes-available="{str(notes_ok).lower()}">'
        f'<div class="subject-top"><span>2021</span><strong>{html.escape(code)}</strong></div>'
        f'<h3>{html.escape(record["name"])}</h3>'
        f'<p>{html.escape(record["department"])} / {html.escape(record["semester"])} / {html.escape(record["type"])}</p>'
        '<div class="action-row">'
        f'<a class="action syllabus" href="{syllabus}" target="_blank" rel="noopener noreferrer">Open Syllabus</a>'
        f'{study}'
        f'<a class="action qp" href="{model_qp}" target="_blank" rel="noopener noreferrer">Sample QP</a>'
        '</div></article>'
    )


def render(records: list[dict[str, str]]) -> str:
    grouped: dict[str, list[dict[str, str]]] = defaultdict(list)
    for record in sorted(records, key=lambda item: (semester_rank(item["semester"]), item["code"])):
        grouped[record["semester"]].append(record)
    sections: list[str] = [START]
    for semester in sorted(grouped, key=semester_rank):
        items = grouped[semester]
        noun = "subject" if len(items) == 1 else "subjects"
        sections.append(
            f'<section class="semester-subject-section" data-semester-section="{html.escape(semester, quote=True)}" '
            'style="grid-column:1/-1;display:block;width:100%;min-width:0;margin:0 0 24px">'
            '<div class="semester-group-heading" style="display:flex;align-items:center;justify-content:space-between;gap:14px;width:100%;min-height:52px;margin:0 0 14px;padding:13px 16px;border:1px solid rgba(29,78,216,.14);border-radius:18px;background:linear-gradient(135deg,rgba(219,234,254,.96),rgba(236,253,245,.96));box-shadow:0 10px 24px rgba(20,45,90,.07)">'
            f'<h3>{html.escape(semester)}</h3><span data-semester-count>{len(items)} {noun}</span></div>'
            '<div class="semester-card-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr));gap:18px;align-items:stretch;width:100%">'
            + "".join(card(item) for item in items)
            + "</div></section>"
        )
    sections.append(END)
    return "".join(sections)


def materialized_text(path: Path, records: list[dict[str, str]]) -> str:
    text = path.read_text(encoding="utf-8")
    match = DEPARTMENT_RE.search(text)
    if not match:
        raise ValueError(f"{path.relative_to(ROOT)} has no data-department attribute")
    department = html.unescape(match.group(1))
    wanted = [
        record for record in records
        if normalized(record["department"]) in {normalized(COMMON), normalized(department)}
    ]
    if not wanted:
        raise ValueError(f"No Revision 2021 subjects found for {department}")
    content = render(wanted)
    replacement = lambda found: found.group(1) + content + found.group(2)
    updated, count = GRID_RE.subn(replacement, text, count=1)
    if count != 1:
        raise ValueError(f"Could not locate subjectGrid followed by noscript in {path.relative_to(ROOT)}")
    return updated


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true", help="Fail if any department page is stale")
    args = parser.parse_args()
    records = all_records()
    changed: list[str] = []
    failures: list[str] = []
    for path in sorted((ROOT / "revision-2021").glob("*.html")):
        if path.name == "department-view.html":
            continue
        try:
            updated = materialized_text(path, records)
        except ValueError as error:
            failures.append(str(error))
            continue
        current = path.read_text(encoding="utf-8")
        if current != updated:
            changed.append(path.relative_to(ROOT).as_posix())
            if not args.check:
                path.write_text(updated, encoding="utf-8")
    if failures:
        print("\n".join(f"ERROR: {item}" for item in failures))
        return 1
    if args.check and changed:
        print("Stale Revision 2021 department pages:")
        print("\n".join(f"- {item}" for item in changed))
        return 1
    action = "Verified" if args.check else "Materialized"
    print(f"{action} {len(list((ROOT / 'revision-2021').glob('*.html')))} Revision 2021 department pages; changed {len(changed)}.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
