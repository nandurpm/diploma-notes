#!/usr/bin/env python3
"""Replace generic REV2026 subject-card labels with official course titles.

The current SITTTR programme tables sometimes expose only category labels such as
"Programme core course" or "Program Elective course".  This resolver visits each
unique course-content page and attempts to extract or confirm the exact title.
A historical repository snapshot produced from the same official SITTTR source is
used as a guarded fallback when the live detail page does not expose a parseable
heading or is temporarily unavailable.
"""

from __future__ import annotations

import html
import json
import re
import subprocess
import sys
import time
from collections import Counter, defaultdict
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterable

import requests
from bs4 import BeautifulSoup, Tag

DATA = Path("assets/data/revision-2026-subjects.json")
REPORT = Path("reports/revision-2026-title-resolution.json")
HISTORICAL_REF = "b82decdf58f1e518f2802e3ce019f4d1a4633162"
HISTORICAL_PATH = "assets/data/revision-2026-subjects.json"
GENERIC_TITLES = {
    "programme core course",
    "program core course",
    "programme elective course",
    "program elective course",
    "open elective course",
}
COURSE_CODE = re.compile(r"\b[1-6]\d{2,4}[A-Z]?\b", re.I)
SPACE = re.compile(r"\s+")
SITE_NOISE = re.compile(
    r"\b(?:sitttr|state institute of technical teachers training and research|"
    r"diploma syllabus|course contents?|revision\s*2026|rev\s*2026|kerala)\b",
    re.I,
)
LABEL_WORDS = re.compile(
    r"\b(?:course|subject)\s*(?:name|title)|title\s*of\s*(?:the\s*)?(?:course|subject)\b",
    re.I,
)
REJECT = re.compile(
    r"^(?:home|about|contact|login|download|view|open|syllabus|details?|"
    r"course contents?|diploma syllabus|revision 2026|rev2026)$",
    re.I,
)


def normalise(value: object) -> str:
    return SPACE.sub(" ", html.unescape(str(value or ""))).strip(" \t\r\n-|:–—")


def is_generic(value: object) -> bool:
    return normalise(value).casefold() in GENERIC_TITLES


def clean_candidate(value: object, code: str) -> str:
    text = normalise(value)
    if not text:
        return ""
    text = re.sub(rf"^\s*{re.escape(code)}\s*[-:–—|]*\s*", "", text, flags=re.I)
    text = re.sub(rf"\s*[-:–—|]*\s*{re.escape(code)}\s*$", "", text, flags=re.I)
    text = re.sub(r"\s*[-|:]\s*SITTTR.*$", "", text, flags=re.I)
    text = re.sub(r"\s*[-|:]\s*Diploma Syllabus.*$", "", text, flags=re.I)
    text = normalise(text)
    if not text or text.upper() == code or is_generic(text) or REJECT.fullmatch(text):
        return ""
    if COURSE_CODE.fullmatch(text):
        return ""
    if len(text) < 4 or len(text) > 180:
        return ""
    if SITE_NOISE.fullmatch(text):
        return ""
    if sum(ch.isalpha() for ch in text) < 3:
        return ""
    return text


def historical_payload() -> dict[str, object]:
    try:
        raw = subprocess.check_output(
            ["git", "show", f"{HISTORICAL_REF}:{HISTORICAL_PATH}"],
            text=True,
            stderr=subprocess.DEVNULL,
        )
        return json.loads(raw)
    except Exception as exc:
        raise RuntimeError(
            f"Could not read historical official REV2026 snapshot {HISTORICAL_REF}: {exc}"
        ) from exc


def historical_maps() -> tuple[dict[tuple[str, str], str], dict[str, list[str]]]:
    payload = historical_payload()
    exact: dict[tuple[str, str], str] = {}
    by_code: dict[str, set[str]] = defaultdict(set)
    for row in payload.get("subjects", []):
        code = normalise(row.get("code")).upper()
        slug = normalise(row.get("programmeSlug"))
        title = normalise(row.get("name"))
        if not code or not title or is_generic(title):
            continue
        exact[(slug, code)] = title
        by_code[code].add(title)
    return exact, {code: sorted(values) for code, values in by_code.items()}


def labelled_candidates(soup: BeautifulSoup, code: str) -> list[tuple[int, str, str]]:
    found: list[tuple[int, str, str]] = []
    for row in soup.select("tr"):
        cells = row.find_all(["th", "td"], recursive=False)
        if len(cells) < 2:
            continue
        for index, cell in enumerate(cells[:-1]):
            label = normalise(cell.get_text(" ", strip=True))
            if not LABEL_WORDS.search(label):
                continue
            value = clean_candidate(cells[index + 1].get_text(" ", strip=True), code)
            if value:
                found.append((120, value, "official-course-page-labelled-field"))
    for term in soup.select("dt"):
        if not LABEL_WORDS.search(normalise(term.get_text(" ", strip=True))):
            continue
        definition = term.find_next_sibling("dd")
        if definition:
            value = clean_candidate(definition.get_text(" ", strip=True), code)
            if value:
                found.append((120, value, "official-course-page-labelled-field"))
    return found


def page_candidates(soup: BeautifulSoup, code: str) -> list[tuple[int, str, str]]:
    candidates = labelled_candidates(soup, code)
    selectors = [
        (110, "[data-course-title]", "official-course-page-course-title"),
        (108, ".course-title,.subject-title,.page-title", "official-course-page-course-title"),
        (100, "h1", "official-course-page-heading"),
        (92, "h2", "official-course-page-heading"),
        (84, "h3", "official-course-page-heading"),
        (76, ".panel-title,.card-title,.page-header", "official-course-page-heading"),
        (66, 'meta[property="og:title"]', "official-course-page-metadata"),
        (64, 'meta[name="twitter:title"]', "official-course-page-metadata"),
        (55, "title", "official-course-page-document-title"),
    ]
    for score, selector, source in selectors:
        for tag in soup.select(selector)[:20]:
            raw = tag.get("content", "") if tag.name == "meta" else tag.get_text(" ", strip=True)
            value = clean_candidate(raw, code)
            if value:
                candidates.append((score, value, source))
    return candidates


def fetch_page(code: str, url: str, expected_titles: Iterable[str]) -> dict[str, object]:
    headers = {
        "User-Agent": "Mozilla/5.0 (compatible; POLY-PMNA-REV2026-TitleResolver/1.0)",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-IN,en;q=0.9",
    }
    error = ""
    for attempt in range(3):
        try:
            response = requests.get(url, headers=headers, timeout=40, allow_redirects=True)
            if not response.ok or len(response.content) < 300:
                raise RuntimeError(f"HTTP {response.status_code}, {len(response.content)} bytes")
            content_type = response.headers.get("content-type", "")
            if "html" not in content_type.lower() and not response.text.lstrip().startswith("<"):
                raise RuntimeError(f"Unexpected content type {content_type!r}")
            soup = BeautifulSoup(response.text, "html.parser")
            page_text = normalise(soup.get_text(" ", strip=True)).casefold()

            # A historical title is accepted as live-page verified only when the exact
            # normalized title is visibly present in the current official page text.
            confirmed = [title for title in expected_titles if normalise(title).casefold() in page_text]
            if len(set(confirmed)) == 1:
                return {
                    "code": code,
                    "title": confirmed[0],
                    "source": "official-course-page-confirmed-title",
                    "url": response.url,
                    "error": "",
                }

            candidates = page_candidates(soup, code)
            if candidates:
                candidates.sort(key=lambda item: (item[0], len(item[1])), reverse=True)
                top_score, top_title, top_source = candidates[0]
                return {
                    "code": code,
                    "title": top_title,
                    "source": top_source,
                    "score": top_score,
                    "url": response.url,
                    "error": "",
                }
            error = "No exact title candidate found in official course page"
        except Exception as exc:
            error = str(exc)
        time.sleep(1.5 * (attempt + 1))
    return {"code": code, "title": "", "source": "", "url": url, "error": error}


def main() -> int:
    payload = json.loads(DATA.read_text(encoding="utf-8"))
    subjects = list(payload.get("subjects", []))
    generic_rows = [row for row in subjects if is_generic(row.get("name"))]
    if not generic_rows:
        REPORT.parent.mkdir(exist_ok=True)
        REPORT.write_text(
            json.dumps(
                {
                    "scheme": "REV2026",
                    "resolvedAt": datetime.now(timezone.utc).isoformat(),
                    "genericRowsBefore": 0,
                    "genericRowsAfter": 0,
                    "status": "passed",
                    "message": "No generic REV2026 subject titles were present.",
                },
                ensure_ascii=False,
                indent=2,
            ) + "\n",
            encoding="utf-8",
        )
        print("No generic REV2026 titles found.")
        return 0

    historical_exact, historical_by_code = historical_maps()
    rows_by_code: dict[str, list[dict[str, object]]] = defaultdict(list)
    url_by_code: dict[str, str] = {}
    for row in generic_rows:
        code = normalise(row.get("code")).upper()
        rows_by_code[code].append(row)
        url_by_code.setdefault(code, normalise(row.get("syllabusUrl")))

    live_results: dict[str, dict[str, object]] = {}
    with ThreadPoolExecutor(max_workers=5) as executor:
        futures = {
            executor.submit(
                fetch_page,
                code,
                url_by_code[code],
                historical_by_code.get(code, []),
            ): code
            for code in sorted(rows_by_code)
        }
        for index, future in enumerate(as_completed(futures), start=1):
            code = futures[future]
            try:
                live_results[code] = future.result()
            except Exception as exc:
                live_results[code] = {
                    "code": code,
                    "title": "",
                    "source": "",
                    "url": url_by_code[code],
                    "error": str(exc),
                }
            if index % 25 == 0 or index == len(futures):
                print(f"Checked {index}/{len(futures)} unique generic course pages", flush=True)

    source_counts: Counter[str] = Counter()
    replacements: list[dict[str, object]] = []
    unresolved: list[dict[str, str]] = []
    for code, affected_rows in sorted(rows_by_code.items()):
        live = live_results.get(code, {})
        live_title = normalise(live.get("title"))
        live_source = normalise(live.get("source"))

        for row in affected_rows:
            slug = normalise(row.get("programmeSlug"))
            title = live_title
            source = live_source
            if not title or is_generic(title):
                title = historical_exact.get((slug, code), "")
                if not title:
                    unique = historical_by_code.get(code, [])
                    title = unique[0] if len(unique) == 1 else ""
                source = "historical-official-sitttr-snapshot" if title else ""

            title = clean_candidate(title, code)
            if not title:
                unresolved.append(
                    {
                        "programmeSlug": slug,
                        "code": code,
                        "oldTitle": normalise(row.get("name")),
                        "coursePageError": normalise(live.get("error")),
                    }
                )
                continue

            old = normalise(row.get("name"))
            row["name"] = title
            row["titleSource"] = source
            source_counts[source] += 1
            replacements.append(
                {
                    "programmeSlug": slug,
                    "semester": row.get("semester"),
                    "code": code,
                    "oldTitle": old,
                    "newTitle": title,
                    "titleSource": source,
                    "syllabusUrl": row.get("syllabusUrl"),
                }
            )

    remaining = [row for row in subjects if is_generic(row.get("name"))]
    report = {
        "scheme": "REV2026",
        "resolvedAt": datetime.now(timezone.utc).isoformat(),
        "historicalReference": HISTORICAL_REF,
        "genericRowsBefore": len(generic_rows),
        "uniqueGenericCodes": len(rows_by_code),
        "coursePagesAttempted": len(rows_by_code),
        "coursePagesFetchedOrParsed": sum(1 for result in live_results.values() if result.get("title")),
        "genericRowsAfter": len(remaining),
        "resolvedRows": len(replacements),
        "titleSourceCounts": dict(sorted(source_counts.items())),
        "unresolved": unresolved,
        "replacements": replacements,
        "status": "passed" if not remaining and not unresolved else "failed",
    }
    REPORT.parent.mkdir(exist_ok=True)
    REPORT.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    if remaining or unresolved:
        print(
            f"Title resolution failed: remaining={len(remaining)} unresolved={len(unresolved)}. "
            f"See {REPORT}.",
            file=sys.stderr,
        )
        return 1

    payload["subjects"] = subjects
    payload["subjectCount"] = len(subjects)
    payload["titleResolution"] = {
        "resolvedAt": report["resolvedAt"],
        "genericRowsReplaced": len(replacements),
        "uniqueCourseCodesChecked": len(rows_by_code),
        "titleSourceCounts": report["titleSourceCounts"],
        "genericRowsRemaining": 0,
    }
    payload["sourceMethod"] = (
        normalise(payload.get("sourceMethod"))
        + " Generic programme-table labels are replaced from official course-content pages, "
        + "with a guarded historical official-SITTTR snapshot fallback."
    )
    DATA.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(
        f"Resolved {len(replacements)} generic rows across {len(rows_by_code)} unique codes; "
        f"remaining=0 sources={dict(sorted(source_counts.items()))}",
        flush=True,
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
