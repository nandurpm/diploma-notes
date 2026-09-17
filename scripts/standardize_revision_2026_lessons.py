#!/usr/bin/env python3
"""Standardize the Revision 2026 lesson library without replacing lesson content.

The script is intentionally conservative:
- Existing non-empty course metadata is preserved; missing metadata is filled from the master index.
- Existing Malayalam/support and caution content is preserved.
- Legacy caution classes (.notice and .rules) receive the standardized .warning class.
- Only the missing standardized blocks are inserted, marked with data-poly-standardization.
- Broken #handbook-search targets are repaired when a search control/section exists.

It produces a machine-readable report suitable for review and reruns safely.
"""
from __future__ import annotations

import json
import os
import re
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterable

from bs4 import BeautifulSoup, Tag

ROOT = Path(__file__).resolve().parents[1]
LESSONS_DIR = ROOT / "revision-2026-content" / "lessons"
MASTER_INDEX = ROOT / "assets" / "data" / "revision-2026-subjects.json"
BREAKDOWN = Path("/home/ubuntu/detailed_breakdown.json")
REPORT = Path("/home/ubuntu/standardization_report.json")

STYLE_MARKER = "data-poly-standard-block-styles"
BLOCK_MARKER = "rev2026-standard-v1"
SOURCE_URL = "https://www.sitttrkerala.ac.in/index.php?r=site%2Fdiploma-syllabus-course-contents&course={code}&scheme=REV2026"

STANDARD_STYLE = """<style data-poly-standard-block-styles>
.ml-note{font-family:"Noto Sans Malayalam","Nirmala UI","Manjari",system-ui,sans-serif;background:#f8fafc;border:1px solid #dbe3ec;border-left:5px solid #64748b;border-radius:11px;padding:11px 13px;margin:10px 0}
.warning{background:#fff7ed;border:1px solid #fed7aa;border-left:5px solid #b45309;border-radius:11px;padding:11px 13px;margin:10px 0;color:#7c2d12}
.source-note{background:#eff6ff;border:1px solid #bfdbfe;border-left:5px solid #2563eb;border-radius:11px;padding:11px 13px;margin:10px 0;color:#1e3a8a}
</style>"""

ML_TEXT = (
    "ഈ പാഠത്തിലെ പ്രധാന ആശയങ്ങൾ ആദ്യം English technical terms-കളോടൊപ്പം വായിക്കുക. "
    "ഓരോ ഘട്ടവും സ്വന്തം വാക്കുകളിൽ എഴുതുകയും, formula, diagram, units, definitions എന്നിവ "
    "പരിശോധിച്ച് പഠിക്കുകയും ചെയ്യുക."
)
WARNING_TEXT = (
    "Verify units, assumptions, labels, source wording and expected results before applying an answer. "
    "For practical work, use approved equipment, required PPE and instructor supervision; never bypass a "
    "safety or isolation procedure."
)


def load_master() -> dict[str, dict]:
    data = json.loads(MASTER_INDEX.read_text(encoding="utf-8"))
    items = data.get("subjects", data if isinstance(data, list) else [])
    out: dict[str, dict] = {}
    for item in items:
        code = str(item.get("code", "")).strip()
        if code and code not in out:
            out[code] = item
    return out


def load_breakdown() -> dict[str, set[str]]:
    if not BREAKDOWN.exists():
        return {}
    data = json.loads(BREAKDOWN.read_text(encoding="utf-8"))
    out: dict[str, set[str]] = {}
    for entries in data.values():
        for entry in entries:
            code = str(entry.get("code", "")).strip()
            out[code] = set(entry.get("missing", []))
    return out


def meta(soup: BeautifulSoup, name: str) -> Tag | None:
    return soup.find("meta", attrs={"name": name})


def text_of(tag: Tag | None) -> str:
    return tag.get_text(" ", strip=True) if tag else ""


def make_div(soup: BeautifulSoup, classes: str, content: str, *, lang: str | None = None, marker: str = BLOCK_MARKER) -> Tag:
    div = soup.new_tag("div")
    div["class"] = classes.split()
    div["data-poly-standardization"] = marker
    if lang:
        div["lang"] = lang
    strong = soup.new_tag("strong")
    strong.string = "Malayalam support:" if "ml-note" in classes else "Common mistakes and precaution:"
    div.append(strong)
    div.append(" ")
    div.append(content)
    return div


def has_ml(soup: BeautifulSoup) -> bool:
    return bool(soup.select(".ml-note, .ml"))


def has_warning(soup: BeautifulSoup) -> bool:
    return bool(soup.select(".warning"))
def has_source(soup: BeautifulSoup) -> bool:
    if soup.find(id="source") or soup.find(id="source-declaration"):
        return True
    headings = " ".join(text_of(h) for h in soup.find_all(["h2", "h3"]))
    return "official source declaration" in headings.lower()
def add_css_if_needed(soup: BeautifulSoup, need_ml: bool, need_warning: bool, need_source: bool = False) -> bool:
    if not (need_ml or need_warning or need_source):
        return False
    if soup.find("style", attrs={STYLE_MARKER: True}):
        return False
    # If both selectors already have local CSS, do not add another style block.
    head_text = " ".join(style.get_text(" ", strip=False) for style in soup.find_all("style"))
    ml_css = bool(re.search(r"\.ml-note\s*\{", head_text))
    warning_css = bool(re.search(r"\.warning\s*\{", head_text))
    source_css = bool(re.search(r"\.source-note\s*\{", head_text))
    if (not need_ml or ml_css) and (not need_warning or warning_css) and (not need_source or source_css):
        return False
    style = BeautifulSoup(STANDARD_STYLE, "html.parser").find("style")
    if soup.head:
        soup.head.append(style)
    else:
        soup.insert(0, style)
    return True


def find_content_anchor(soup: BeautifulSoup) -> Tag | None:
    # Prefer the deepest real search section/control; never use main before its descendants.
    existing = soup.find(id="search")
    if existing:
        return existing
    def contains_search(node: Tag) -> bool:
        return bool(node.find(["input", "button"], attrs={"type": "search"}) or node.find("input", id=re.compile("search", re.I)))
    for section in soup.find_all("section"):
        ident = " ".join(section.get("class", []))
        node_id = str(section.get("id", ""))
        heading = text_of(section.find(["h2", "h3"]))
        if contains_search(section) or "search-bar" in ident or "search" in node_id.lower() or "handbook search" in heading.lower() or "in-page search" in heading.lower():
            return section
    for node in soup.find_all("div"):
        if contains_search(node):
            return node.find_parent("section") or node
    return None


def add_search_section(soup: BeautifulSoup) -> bool:
    if soup.find(id="handbook-search"):
        return False
    parent = soup.find("main") or soup.select_one(".lesson-shell") or soup.body
    if not parent:
        return False
    section = soup.new_tag("section", attrs={"class": "section no-print", "id": "handbook-search", "data-poly-standardization": BLOCK_MARKER})
    kicker = soup.new_tag("p", attrs={"class": "kicker"})
    kicker.string = "Find a topic"
    section.append(kicker)
    heading = soup.new_tag("h2")
    heading.string = "Handbook Search"
    section.append(heading)
    bar = soup.new_tag("div", attrs={"class": "search-bar"})
    input_tag = soup.new_tag("input", attrs={"aria-label": "Search handbook", "id": "searchInput", "placeholder": "Search a topic, term or module", "type": "search"})
    button = soup.new_tag("button", attrs={"class": "btn primary", "id": "searchBtn", "type": "button"})
    button.string = "Search"
    bar.append(input_tag)
    bar.append(button)
    section.append(bar)
    results = soup.new_tag("div", attrs={"aria-live": "polite", "class": "search-results", "id": "searchResults"})
    section.append(results)
    parent.append(section)
    return True


def fix_search_anchor(soup: BeautifulSoup) -> bool:
    links = soup.find_all("a", href="#handbook-search")
    if not links or soup.find(id="handbook-search"):
        return False
    target = find_content_anchor(soup)
    if target:
        target["id"] = "handbook-search"
        return True
    return add_search_section(soup)


def add_source_section(soup: BeautifulSoup, code: str, record: dict | None) -> bool:
    if soup.find(id="source") or soup.find(id="source-declaration"):
        return False
    for heading in soup.find_all(["h2", "h3"]):
        if "official source declaration" in text_of(heading).lower():
            parent_section = heading.find_parent("section")
            if parent_section and not parent_section.get("id"):
                parent_section["id"] = "source"
                return True
            return False
    parent = soup.find("main") or soup.select_one(".lesson-shell") or soup.body
    if not parent:
        return False
    section = soup.new_tag("section", attrs={"class": "section", "id": "source", "data-poly-standardization": BLOCK_MARKER})
    kicker = soup.new_tag("p", attrs={"class": "kicker"})
    kicker.string = "Curriculum integrity"
    section.append(kicker)
    heading = soup.new_tag("h2")
    heading.string = "Official Source Declaration"
    section.append(heading)
    p = soup.new_tag("p")
    if record:
        p.append("This handbook’s course identity is aligned with the Revision 2026 master subject index for ")
        strong = soup.new_tag("strong")
        strong.string = f"Course {code} — {record.get('name', '')}"
        p.append(strong)
        p.append(". Use the official SITTTR syllabus and course-content pages below to verify current hours, outcomes, assessment details and any programme-specific instructions.")
    else:
        p.append("This lesson is retained for continuity, but its course code is not currently present in the Revision 2026 master subject index. Verify the current official SITTTR syllabus catalogue before relying on course-specific details.")
    section.append(p)
    box = soup.new_tag("div", attrs={"class": "source-note"})
    href = SOURCE_URL.format(code=code) if record else "https://www.sitttrkerala.ac.in/index.php?r=site%2Fdiploma-syllabus&scheme=REV2026"
    link = soup.new_tag("a", href=href)
    link.string = "Official SITTTR Revision 2026 syllabus reference"
    box.append(link)
    box.append(". This page is a study handbook, not a substitute for the latest official notification or examination instruction.")
    section.append(box)
    first = None
    for candidate in soup.find_all("section"):
        classes = set(candidate.get("class", []))
        if "cover" not in classes and "hero" not in classes and candidate.get("id") != "cover":
            first = candidate
            break
    if first:
        first.insert_before(section)
    else:
        parent.append(section)
    return True


def ensure_warning_aliases(soup: BeautifulSoup) -> int:
    changed = 0
    for node in soup.select(".notice, .rules"):
        classes = node.get("class", [])
        if "warning" not in classes:
            classes.append("warning")
            node["class"] = classes
            changed += 1
    return changed


def first_insertion_parent(soup: BeautifulSoup) -> Tag | None:
    modules = soup.select("section.module")
    if modules:
        return modules[0]
    sections = soup.select("section.section, section")
    if sections:
        # Avoid placing the note in a cover/hero if an instructional section exists.
        for section in sections:
            classes = set(section.get("class", []))
            if "cover" not in classes and "hero" not in classes:
                return section
        return sections[0]
    return soup.find("main") or soup.select_one(".lesson-shell") or soup.body


def add_support_blocks(soup: BeautifulSoup, missing: set[str], code: str, title: str) -> tuple[int, int, bool]:
    need_ml = "Malayalam Note" in missing and not has_ml(soup)
    need_warning = "Warning Block" in missing and not has_warning(soup)
    if not (need_ml or need_warning):
        return 0, 0, False
    parent = first_insertion_parent(soup)
    if not parent:
        return 0, 0, False
    added_ml = added_warning = 0
    if need_ml:
        note = make_div(soup, "ml-note", ML_TEXT, lang="ml")
        parent.append(note)
        added_ml = 1
    if need_warning:
        warning = make_div(soup, "warning", WARNING_TEXT)
        parent.append(warning)
        added_warning = 1
    return added_ml, added_warning, True


def ensure_metadata(soup: BeautifulSoup, code: str, record: dict | None) -> tuple[int, int, bool]:
    changed = False
    added_code = added_title = 0
    head = soup.head
    if not head:
        return 0, 0, False
    code_meta = meta(soup, "course-code")
    if not code_meta or not code_meta.get("content", "").strip():
        if not code_meta:
            code_meta = soup.new_tag("meta", attrs={"name": "course-code"})
            head.append(code_meta)
        code_meta["content"] = code
        added_code = 1
        changed = True
    title_meta = meta(soup, "course-title")
    if not title_meta or not title_meta.get("content", "").strip():
        if not title_meta:
            title_meta = soup.new_tag("meta", attrs={"name": "course-title"})
            head.append(title_meta)
        title = (record or {}).get("name", "")
        if not title:
            h1 = soup.find("h1")
            title = text_of(h1).replace(code, "").strip(" —–-")
        if not title:
            title = (soup.title.get_text(" ", strip=True) if soup.title else f"Course {code}")
        title_meta["content"] = title
        added_title = 1
        changed = True
    return added_code, added_title, changed


def process_file(path: Path, master: dict[str, dict], breakdown: dict[str, set[str]]) -> dict:
    code = path.stem[len("lessons-"):]
    original = path.read_text(encoding="utf-8", errors="replace")
    soup = BeautifulSoup(original, "html.parser")
    record = master.get(code)
    missing = breakdown.get(code, set())
    actions: list[str] = []

    added_code, added_title, metadata_changed = ensure_metadata(soup, code, record)
    if added_code:
        actions.append("added course-code meta")
    if added_title:
        actions.append("added course-title meta")

    if fix_search_anchor(soup):
        actions.append("fixed #handbook-search target")

    alias_count = ensure_warning_aliases(soup)
    if alias_count:
        actions.append(f"normalized {alias_count} legacy caution block(s) to .warning")

    source_added = add_source_section(soup, code, record)
    if source_added:
        actions.append("inserted official source declaration")

    added_ml, added_warning, block_changed = add_support_blocks(soup, missing, code, (record or {}).get("name", ""))
    if added_ml:
        actions.append("inserted standardized Malayalam note")
    if added_warning:
        actions.append("inserted standardized warning block")

    css_changed = add_css_if_needed(soup, added_ml > 0, added_warning > 0 or alias_count > 0, source_added)
    if css_changed:
        actions.append("added compatibility styles")

    changed = bool(actions)
    if changed:
        base_real = os.path.realpath(LESSONS_DIR)
        target_real = os.path.realpath(path)
        if os.path.commonpath([base_real, target_real]) != base_real:
            raise Exception("Invalid file path")
        path.write_text(str(soup), encoding="utf-8")
    return {
        "code": code,
        "file": path.name,
        "department": (record or {}).get("programme", "Not in master index"),
        "master_indexed": bool(record),
        "missing_before": sorted(missing),
        "actions": actions,
        "added_ml": added_ml,
        "added_warning": added_warning,
        "source_added": int(source_added),
        "metadata_added": {"course_code": added_code, "course_title": added_title},
        "changed": changed,
    }


def main() -> None:
    master = load_master()
    breakdown = load_breakdown()
    results = []
    for path in sorted(LESSONS_DIR.glob("lessons-*.html")):
        results.append(process_file(path, master, breakdown))

    counts = Counter()
    for result in results:
        counts["files_total"] += 1
        counts["files_changed"] += int(result["changed"])
        counts["files_indexed"] += int(result["master_indexed"])
        counts["files_not_in_master"] += int(not result["master_indexed"])
        counts["ml_blocks_added"] += result["added_ml"]
        counts["warning_blocks_added"] += result["added_warning"]
        counts["source_declarations_added"] += result["source_added"]
        counts["course_code_meta_added"] += result["metadata_added"]["course_code"]
        counts["course_title_meta_added"] += result["metadata_added"]["course_title"]
        if any("fixed #handbook-search" in a for a in result["actions"]):
            counts["anchors_fixed"] += 1
        counts["legacy_caution_blocks_normalized"] += sum(
            int(m.split()[1]) if m.startswith("normalized ") else 0
            for m in result["actions"] if m.startswith("normalized ")
        )
    by_department: dict[str, Counter] = defaultdict(Counter)
    for result in results:
        dept = result["department"]
        by_department[dept]["files"] += 1
        by_department[dept]["changed"] += int(result["changed"])
        by_department[dept]["ml_added"] += result["added_ml"]
        by_department[dept]["warning_added"] += result["added_warning"]
        by_department[dept]["source_added"] += result["source_added"]
        by_department[dept]["missing_ml_before"] += int("Malayalam Note" in result["missing_before"])
        by_department[dept]["missing_warning_before"] += int("Warning Block" in result["missing_before"])

    report = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "standard": BLOCK_MARKER,
        "source": {
            "lesson_directory": str(LESSONS_DIR),
            "master_index": str(MASTER_INDEX),
            "breakdown": str(BREAKDOWN),
        },
        "totals": dict(counts),
        "by_department": {k: dict(v) for k, v in sorted(by_department.items())},
        "files": results,
    }
    REPORT.write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding="utf-8")
    print(json.dumps({"totals": dict(counts), "report": str(REPORT)}, indent=2))


if __name__ == "__main__":
    main()
