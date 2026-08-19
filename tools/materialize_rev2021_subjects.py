# Purpose: Materialize rev2021 subjects - Descriptive comment added for clarity
#!/usr/bin/env python3
"""Pre-render Revision 2021 subject cards into every department HTML page."""
from __future__ import annotations

import argparse
import html
import json
import re
from collections import defaultdict
from pathlib import Path
from urllib.parse import quote

try:
    from bs4 import BeautifulSoup
except ImportError:  # GitHub Actions does not install optional parser packages.
    BeautifulSoup = None

ROOT = Path(__file__).resolve().parents[1]
COMMON = "First Year / Common"
PDF_MANIFEST = json.loads((ROOT / "assets/data/sitttr-pdf-links.json").read_text(encoding="utf-8"))
PDF_BASE = PDF_MANIFEST["base"]
PDF_LINKS = PDF_MANIFEST["links"].get("2021", {})
SITTTR_SYLLABUS_URL = "https://www.sitttrkerala.ac.in/index.php?r=site%2Fdiploma-syllabus-course-contents&course={}"
SITTTR_MODEL_QP_URL = "https://www.sitttrkerala.ac.in/index.php?r=site%2Fdiploma-modelqp-courses-show&course={}"
OBJECT_RE = re.compile(r"\{[^{}]*\brevision\s*:\s*[\"']2021[\"'][^{}]*\}", re.S)
PAIR_RE = re.compile(r"\b(revision|code|name|department|semester|type|assetCode)\s*:\s*[\"']([^\"']*)[\"']")
GRID_OPEN_RE = re.compile(r'(<div\b[^>]*\bid=["\']subjectGrid["\'][^>]*>)', re.I)
DEPARTMENT_RE = re.compile(r'data-department=["\']([^"\']+)["\']', re.I)
SEMESTER_NUMBER_RE = re.compile(r"(\d+)")
START = "<!-- STATIC REV2021 SUBJECTS START -->"
END = "<!-- STATIC REV2021 SUBJECTS END -->"
STATIC_RE = re.compile(re.escape(START) + r"[\s\S]*?" + re.escape(END), re.I)


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


def pdf_key(department: str, code: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", html.unescape(department).lower().replace("&", " and ")).strip("-")
    return f"2021|{slug}|{code.upper()}"


def pdf_href(department: str, code: str, kind: str) -> str:
    path = PDF_LINKS.get(pdf_key(department, code), {}).get(kind)
    return f"{PDF_BASE}{path}" if path else ""


def pdf_filename(href: str) -> str:
    return href.rsplit("/", 1)[-1] if href else ""


def sitttr_href(code: str, kind: str) -> str:
    template = SITTTR_MODEL_QP_URL if kind == "modelQuestionPaper" else SITTTR_SYLLABUS_URL
    return template.format(quote(code.upper(), safe=""))


def semester_rank(value: str) -> tuple[int, str]:
    match = SEMESTER_NUMBER_RE.search(value)
    return (int(match.group(1)) if match else 999, value)


def subject_key(record: dict[str, str]) -> tuple[str, ...]:
    return (
        record["revision"], normalized(record["department"]), record["semester"],
        record["code"].upper(), record["name"].lower(),
    )


def _text_content(fragment: str) -> str:
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", fragment))).strip()


def parse_existing_pages() -> list[dict[str, str]]:
    records: list[dict[str, str]] = []
    for path in sorted((ROOT / "revision-2021").glob("*.html")):
        if path.name == "department-view.html":
            continue
        text = path.read_text(encoding="utf-8")
        if BeautifulSoup is not None:
            soup = BeautifulSoup(text, "html.parser")
            department = soup.body.get("data-department", "") if soup.body else ""
            if not department:
                grid = soup.select_one("#subjectGrid[data-department]")
                department = grid.get("data-department", "") if grid else ""
            articles = soup.select('article.subject-card[data-revision="2021"]')
            rows = [(article.get("data-subject-code", "").strip(),
                     article.find("h3").get_text(" ", strip=True) if article.find("h3") else "",
                     article.find("p").get_text(" ", strip=True) if article.find("p") else "")
                     for article in articles]
        else:
            department_match = DEPARTMENT_RE.search(text)
            department = html.unescape(department_match.group(1)) if department_match else ""
            article_re = re.compile(r'<article\b(?=[^>]*class=["\'][^"\']*subject-card[^"\']*["\'])(?=[^>]*data-revision=["\']2021["\'])[^>]*>.*?</article>', re.I | re.S)
            rows = []
            for article in article_re.findall(text):
                code_match = re.search(r'data-subject-code=["\']([^"\']+)', article, re.I)
                name_match = re.search(r'<h3\b[^>]*>(.*?)</h3>', article, re.I | re.S)
                meta_match = re.search(r'<p\b[^>]*>(.*?)</p>', article, re.I | re.S)
                rows.append((code_match.group(1).strip() if code_match else "",
                             _text_content(name_match.group(1)) if name_match else "",
                             _text_content(meta_match.group(1)) if meta_match else ""))
        for code, name, meta in rows:
            parts = [part.strip() for part in meta.split("/") if part.strip()]
            if not code or not name or len(parts) < 2:
                continue
            semester = next((part for part in parts if re.match(r"^Semester\s+\d+", part, re.I)), "Semester 1")
            semester_index = parts.index(semester) if semester in parts else max(0, len(parts) - 2)
            subject_type = parts[semester_index + 1] if semester_index + 1 < len(parts) else "Theory"
            department_name = " / ".join(parts[:semester_index]) or department or COMMON
            records.append({
                "revision": "2021",
                "code": code,
                "name": name,
                "department": department_name,
                "semester": semester,
                "type": subject_type,
                "assetCode": code,
            })
    return records


def all_records() -> list[dict[str, str]]:
    records = parse_records(ROOT / "assets/js/subjects.js")
    records.extend(parse_records(ROOT / "assets/js/subject-browser.js"))
    if len(records) < 100:
        records.extend(parse_existing_pages())
    unique: dict[tuple[str, ...], dict[str, str]] = {}
    for record in records:
        unique.setdefault(subject_key(record), record)
    return list(unique.values())


def paths(record: dict[str, str]) -> tuple[str, str, bool]:
    code = record.get("assetCode") or record["code"]
    lesson_local = Path("lessons") / f"lessons-{code}.html"
    lesson_href = "/" + lesson_local.as_posix()
    return lesson_href, lesson_href + "?autoPrintNotes=1", (ROOT / lesson_local).is_file()


def card(record: dict[str, str]) -> str:
    code = record["code"]
    lesson_href, notes_href, lesson_ok = paths(record)
    syllabus = pdf_href(record["department"], code, "syllabus")
    model_qp = pdf_href(record["department"], code, "modelQuestionPaper")
    syllabus_action = (
        f'<a class="action syllabus" href="{html.escape(syllabus, quote=True)}" download="{html.escape(pdf_filename(syllabus), quote=True)}">Download Syllabus</a>'
        if syllabus else
        f'<a class="action syllabus external-fallback" href="{html.escape(sitttr_href(code, "syllabus"), quote=True)}" target="_blank" rel="noopener noreferrer">Open SITTTR Syllabus</a>'
    )
    model_action = (
        f'<a class="action qp" href="{html.escape(model_qp, quote=True)}" download="{html.escape(pdf_filename(model_qp), quote=True)}">Download Model Question Paper</a>'
        if model_qp else
        f'<a class="action qp external-fallback" href="{html.escape(sitttr_href(code, "modelQuestionPaper"), quote=True)}" target="_blank" rel="noopener noreferrer">Open SITTTR Model Question Paper</a>'
    )
    if lesson_ok:
        study = (
            f'<a class="action lessons" href="{html.escape(lesson_href, quote=True)}">View Lessons</a>'
            f'<a class="action download" href="{html.escape(notes_href, quote=True)}">Save as PDF</a>'
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
        f'data-search-text="{html.escape(search, quote=True)}" data-notes-href="{html.escape(notes_href, quote=True)}" '
        f'data-lesson-href="{html.escape(lesson_href, quote=True)}" data-lesson-available="{str(lesson_ok).lower()}" '
        f'data-notes-available="{str(lesson_ok).lower()}"><div class="subject-top"><span>2021</span>'
        f'<strong>{html.escape(code)}</strong></div><h3>{html.escape(record["name"])}</h3>'
        f'<p>{html.escape(record["department"])} / {html.escape(record["semester"])} / {html.escape(record["type"])}</p>'
        f'<div class="action-row">{syllabus_action}{study}{model_action}</div></article>'
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
    accepted = {normalized(COMMON), normalized(department)}
    wanted = [record for record in records if normalized(record["department"]) in accepted]
    if not wanted:
        raise ValueError(f"No Revision 2021 subjects found for {department}")
    content = render(wanted)
    if START in text or END in text:
        if text.count(START) != 1 or text.count(END) != 1:
            raise ValueError(f"Invalid static subject markers in {path.relative_to(ROOT)}")
        return STATIC_RE.sub(content, text, count=1)
    updated, count = GRID_OPEN_RE.subn(lambda found: found.group(1) + content, text, count=1)
    if count != 1:
        raise ValueError(f"Could not locate subjectGrid in {path.relative_to(ROOT)}")
    return updated


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true", help="Fail if any department page is stale")
    args = parser.parse_args()
    records = all_records()
    changed: list[str] = []
    failures: list[str] = []
    pages = [path for path in sorted((ROOT / "revision-2021").glob("*.html")) if path.name != "department-view.html"]
    for path in pages:
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
    print(f"{'Verified' if args.check else 'Materialized'} {len(pages)} Revision 2021 department pages; changed {len(changed)}.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
