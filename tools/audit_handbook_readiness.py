#!/usr/bin/env python3
"""Audit existing POLY PMNA lesson HTML for handbook-readiness signals.

This is deliberately a conservative *triage* tool. It does not claim that a
lesson explains every official syllabus point: that requires matching its
content against the official SITTTR PDF. Instead, it identifies files that
lack the baseline structures and explanatory density needed before that
source-grounded comparison is worthwhile.
"""

from __future__ import annotations

import json
import re
from collections import Counter
from pathlib import Path

from bs4 import BeautifulSoup


ROOT = Path(__file__).resolve().parents[1]
TARGETS = (
    ("2021", ROOT / "lessons"),
    ("2026", ROOT / "revision-2026-content" / "lessons"),
)
OUT = ROOT / "reports" / "handbook-readiness-audit.json"
RENDERER = ROOT / "assets" / "js" / "textile-handbook-renderer.js"

REQUIRED_SECTIONS = {
    "course-dashboard": ("course-dashboard", "course overview", "course details"),
    "course-outcomes": ("course-outcomes", "course outcomes", "course outcome"),
    "formula-bank": ("formula-bank", "formula bank", "formulae", "formulas"),
    "visual-library": ("visual-library", "diagram", "figure", "illustration"),
    "assessment": ("assessment", "practice questions", "self assessment", "quiz"),
    "model-paper": ("model-paper", "model paper", "sample question paper"),
    "quick-revision": ("quick-revision", "quick revision", "revision notes"),
    "glossary": ("glossary", "key terms", "terminology"),
    "official-source": ("official-source", "sitttr", "official syllabus", "syllabus source"),
}


def renderer_course_codes() -> set[str]:
    """Return courses whose full handbook content is rendered client-side."""
    if not RENDERER.exists():
        return set()
    source = RENDERER.read_text(encoding="utf-8", errors="replace")
    return set(re.findall(r'^\s*"([A-Za-z0-9]+)"\s*:\s*\{', source, re.MULTILINE))


RUNTIME_HANDBOOK_CODES = renderer_course_codes()


def has_any(haystack: str, candidates: tuple[str, ...]) -> bool:
    return any(candidate in haystack for candidate in candidates)


def local_fragment_content(soup: BeautifulSoup) -> tuple[str, list[str]]:
    """Load same-repository lesson fragments referenced by a handbook shell."""
    parts: list[str] = []
    paths: list[str] = []
    for slot in soup.select("[data-fragment]"):
        source = (slot.get("data-fragment") or "").strip()
        if not source.startswith("/"):
            continue
        candidate = (ROOT / source.lstrip("/")).resolve()
        if candidate.is_file() and candidate.is_relative_to(ROOT.resolve()):
            parts.append(candidate.read_text(encoding="utf-8", errors="replace"))
            paths.append(source)
    return "\n".join(parts), paths


def audit_file(revision: str, path: Path) -> dict:
    raw = path.read_text(encoding="utf-8", errors="replace")
    soup = BeautifulSoup(raw, "html.parser")
    fragments_raw, fragment_paths = local_fragment_content(soup)
    effective_raw = raw + "\n" + fragments_raw
    effective_soup = BeautifulSoup(effective_raw, "html.parser")
    text = effective_soup.get_text(" ", strip=True)
    lower = effective_raw.lower()
    text_lower = text.lower()
    headings = [h.get_text(" ", strip=True) for h in effective_soup.select("h1,h2,h3,h4")]
    module_headings = [h for h in headings if re.search(r"\bmodule\s*(?:[-:–—]?\s*[ivxlcdm]+|\d+)\b", h, re.I)]
    section_hits = [key for key, tokens in REQUIRED_SECTIONS.items() if has_any(lower, tokens) or has_any(text_lower, tokens)]
    course_code = re.search(r"lessons-([A-Za-z0-9]+)\.html$", path.name)
    code = course_code.group(1) if course_code else None
    uses_runtime_handbook = (
        revision == "2021"
        and "textile-handbook-renderer.js" in raw
        and code is not None
        and code in RUNTIME_HANDBOOK_CODES
    )
    # These pages are intentionally minimal HTML shells. Their module lists,
    # examples, formula bank, assessment and revision aids are rendered from
    # the shared course catalogue, so static-text measurements are invalid.
    if uses_runtime_handbook:
        return {
            "revision": revision,
            "course_code": code,
            "path": str(path.relative_to(ROOT)),
            "delivery_mode": "runtime_handbook_renderer",
            "characters": len(raw),
            "paragraphs": len(soup.select("p")),
            "list_items": len(soup.select("li")),
            "module_headings": [],
            "module_heading_count": 0,
            "handbook_sections_found": [],
            "handbook_section_count": 0,
            "deficiencies": [],
            "requires_syllabus_grounded_expansion": False,
            "requires_runtime_syllabus_comparison": True,
        }

    redirect_match = re.search(r"(?:url\s*=\s*|location\.replace\(['\"])(lessons-[A-Za-z0-9]+\.html)", raw, re.I)
    if redirect_match:
        return {
            "revision": revision,
            "course_code": code,
            "path": str(path.relative_to(ROOT)),
            "delivery_mode": "redirect_alias",
            "redirect_target": redirect_match.group(1),
            "characters": len(raw),
            "paragraphs": len(soup.select("p")),
            "list_items": len(soup.select("li")),
            "module_headings": [],
            "module_heading_count": 0,
            "handbook_sections_found": [],
            "handbook_section_count": 0,
            "deficiencies": [],
            "requires_syllabus_grounded_expansion": False,
            "requires_redirect_target_review": True,
        }
    deficiencies: list[str] = []

    if not soup.html or not soup.html.get("lang"):
        deficiencies.append("missing_document_language")
    if not soup.find("main"):
        deficiencies.append("missing_main_landmark")
    if len(raw) < 20_000:
        deficiencies.append("below_20k_character_handbook_floor")
    if len(module_headings) < 3:
        deficiencies.append("insufficient_explicit_module_headings")
    if len(section_hits) < 6:
        deficiencies.append("missing_handbook_sections")
    if not re.search(r"SITTTR|State Institute of Technical Teachers", raw, re.I):
        deficiencies.append("missing_explicit_official_source_citation")
    if not re.search(r"[\u0d00-\u0d7f]|Malayalam", raw, re.I):
        deficiencies.append("missing_malayalam_learning_support")
    if len(soup.select("p")) < 18:
        deficiencies.append("low_explanatory_paragraph_density")
    if len(soup.select("li")) < 12:
        deficiencies.append("low_structured_learning_detail")

    return {
        "revision": revision,
        "course_code": code,
        "path": str(path.relative_to(ROOT)),
        "delivery_mode": "fragment_bundle" if fragment_paths else "static_html",
        "fragment_paths": fragment_paths,
        "characters": len(raw),
        "rendered_characters": len(effective_raw),
        "paragraphs": len(effective_soup.select("p")),
        "list_items": len(effective_soup.select("li")),
        "module_headings": module_headings,
        "module_heading_count": len(module_headings),
        "handbook_sections_found": section_hits,
        "handbook_section_count": len(section_hits),
        "deficiencies": deficiencies,
        "requires_syllabus_grounded_expansion": bool(deficiencies),
    }


def main() -> None:
    results = []
    for revision, directory in TARGETS:
        results.extend(audit_file(revision, path) for path in sorted(directory.glob("lessons-*.html")))
    deficits = Counter(defect for result in results for defect in result["deficiencies"])
    by_revision = {
        revision: {
            "total": sum(1 for result in results if result["revision"] == revision),
            "requires_syllabus_grounded_expansion": sum(
                1 for result in results if result["revision"] == revision and result["requires_syllabus_grounded_expansion"]
            ),
            "requires_runtime_syllabus_comparison": sum(
                1 for result in results if result["revision"] == revision and result.get("requires_runtime_syllabus_comparison")
            ),
            "requires_redirect_target_review": sum(
                1 for result in results if result["revision"] == revision and result.get("requires_redirect_target_review")
            ),
        }
        for revision, _ in TARGETS
    }
    payload = {
        "purpose": "Conservative structural triage; official SITTTR PDF comparison is required before claiming complete syllabus coverage.",
        "summary": {
            "total_lessons": len(results),
            "requires_syllabus_grounded_expansion": sum(1 for result in results if result["requires_syllabus_grounded_expansion"]),
            "requires_runtime_syllabus_comparison": sum(1 for result in results if result.get("requires_runtime_syllabus_comparison")),
            "requires_redirect_target_review": sum(1 for result in results if result.get("requires_redirect_target_review")),
            "deficiency_counts": dict(sorted(deficits.items())),
            "by_revision": by_revision,
        },
        "lessons": results,
    }
    OUT.parent.mkdir(exist_ok=True)
    OUT.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(json.dumps(payload["summary"], indent=2))


if __name__ == "__main__":
    main()
