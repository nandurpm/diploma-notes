#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
import re
import shutil
import time
import unicodedata
import zipfile
from collections import defaultdict
from pathlib import Path
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[1]
SUBJECTS_JSON = ROOT / "assets/data/revision-2026-subjects.json"
PROGRAMMES_JSON = ROOT / "assets/data/revision-2026-programmes.json"
OUT = ROOT / "artifacts/REV2026_Model_Question_Papers_Department_Wise"
ZIP_PATH = ROOT / "artifacts/REV2026_Model_Question_Papers_Department_Wise.zip"
BASE = "https://sitttrkerala.ac.in/"
COURSE_PAGE = BASE + "index.php?r=site%2Fdiploma-modelqp-courses-show&course={}"
MIN_FILE_BYTES = 1000


def clean_name(value: str) -> str:
    value = unicodedata.normalize("NFKC", value).strip()
    value = re.sub(r"[\\/:*?\"<>|]+", "-", value)
    value = re.sub(r"\s+", " ", value).strip(" .-")
    return value or "Unnamed"


def load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def is_download_candidate(url: str, text: str) -> bool:
    s = (url + " " + text).lower()
    return any(x in s for x in ("download-file", ".pdf", ".doc", ".docx", "model question", "question paper", "download"))


def extension_from_response(resp: requests.Response, url: str) -> str:
    ctype = resp.headers.get("content-type", "").lower()
    if "pdf" in ctype or resp.content.startswith(b"%PDF"):
        return ".pdf"
    if "wordprocessingml" in ctype:
        return ".docx"
    if "msword" in ctype:
        return ".doc"
    suffix = Path(url.split("?", 1)[0]).suffix.lower()
    return suffix if suffix in {".pdf", ".doc", ".docx"} else ".bin"


def get(session: requests.Session, url: str, *, tries: int = 4, timeout: int = 45) -> requests.Response:
    last = None
    for attempt in range(tries):
        try:
            r = session.get(url, timeout=timeout, allow_redirects=True)
            if r.status_code == 200:
                return r
            last = RuntimeError(f"HTTP {r.status_code} for {url}")
        except Exception as exc:
            last = exc
        time.sleep(1.5 * (attempt + 1))
    raise RuntimeError(str(last))


def extract_file_links(html: str, page_url: str) -> list[tuple[str, str]]:
    soup = BeautifulSoup(html, "html.parser")
    found: list[tuple[str, str]] = []
    seen: set[str] = set()
    for a in soup.select("a[href]"):
        href = urljoin(page_url, a.get("href", "").strip())
        text = " ".join(a.get_text(" ", strip=True).split())
        if not href.startswith("http") or not is_download_candidate(href, text):
            continue
        if "diploma-modelqp-courses-show" in href:
            continue
        if href not in seen:
            seen.add(href)
            found.append((href, text))
    return found


def main() -> int:
    subjects = load_json(SUBJECTS_JSON)
    programmes_doc = load_json(PROGRAMMES_JSON)
    programmes = programmes_doc["programmes"]
    by_slug = {p["slug"]: p for p in programmes}

    rows_by_programme: dict[str, list[dict]] = defaultdict(list)
    for row in subjects:
        slug = str(row.get("programmeSlug", "")).strip()
        code = str(row.get("code", "")).strip().upper()
        if slug and code and slug in by_slug:
            rows_by_programme[slug].append(row)

    if OUT.exists():
        shutil.rmtree(OUT)
    OUT.mkdir(parents=True, exist_ok=True)
    ZIP_PATH.parent.mkdir(parents=True, exist_ok=True)

    session = requests.Session()
    session.headers.update({
        "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/126 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/pdf,application/octet-stream;q=0.9,*/*;q=0.8",
        "Referer": BASE,
    })

    manifest: list[dict[str, str]] = []
    cache: dict[str, list[tuple[str, bytes, str]]] = {}

    for p in sorted(programmes, key=lambda x: int(x["order"])):
        slug = p["slug"]
        department = clean_name(f"{p['officialCode']} - {p['name']}")
        dept_dir = OUT / department
        dept_dir.mkdir(parents=True, exist_ok=True)
        rows = sorted(rows_by_programme.get(slug, []), key=lambda r: str(r.get("code", "")))

        for row in rows:
            code = str(row.get("code", "")).strip().upper()
            title = clean_name(str(row.get("name", "Course")))
            semester = row.get("semesterNumber") or str(row.get("semester", "")).strip() or "Unknown"
            sem_match = re.search(r"([1-6])", str(semester))
            sem_folder = f"Semester {sem_match.group(1)}" if sem_match else "Semester Unknown"
            target_dir = dept_dir / sem_folder
            target_dir.mkdir(parents=True, exist_ok=True)

            if code not in cache:
                page_url = COURSE_PAGE.format(code)
                downloaded: list[tuple[str, bytes, str]] = []
                try:
                    page = get(session, page_url)
                    links = extract_file_links(page.text, page_url)
                    for idx, (file_url, link_text) in enumerate(links, start=1):
                        try:
                            resp = get(session, file_url)
                            if len(resp.content) < MIN_FILE_BYTES:
                                continue
                            ext = extension_from_response(resp, resp.url)
                            downloaded.append((ext, resp.content, link_text or f"Paper {idx}"))
                        except Exception as exc:
                            manifest.append({"department": department, "semester": sem_folder, "code": code, "course": title, "status": "DOWNLOAD_FAILED", "source": file_url, "details": str(exc)})
                except Exception as exc:
                    manifest.append({"department": department, "semester": sem_folder, "code": code, "course": title, "status": "COURSE_PAGE_FAILED", "source": page_url, "details": str(exc)})
                cache[code] = downloaded

            papers = cache[code]
            if not papers:
                manifest.append({"department": department, "semester": sem_folder, "code": code, "course": title, "status": "NOT_PUBLISHED_OR_NOT_FOUND", "source": COURSE_PAGE.format(code), "details": "No downloadable model question paper was found on the official course page."})
                continue

            for idx, (ext, data, label) in enumerate(papers, start=1):
                suffix = "" if len(papers) == 1 else f"_{idx}"
                filename = clean_name(f"{code} - {title}{suffix}") + ext
                (target_dir / filename).write_bytes(data)
                manifest.append({"department": department, "semester": sem_folder, "code": code, "course": title, "status": "DOWNLOADED", "source": COURSE_PAGE.format(code), "details": label})

    with (OUT / "DOWNLOAD_MANIFEST.csv").open("w", newline="", encoding="utf-8-sig") as f:
        writer = csv.DictWriter(f, fieldnames=["department", "semester", "code", "course", "status", "source", "details"])
        writer.writeheader()
        writer.writerows(manifest)

    summary = {
        "scheme": "REV2026",
        "departmentCount": len(programmes),
        "courseRecords": sum(len(v) for v in rows_by_programme.values()),
        "downloadedEntries": sum(1 for x in manifest if x["status"] == "DOWNLOADED"),
        "notFoundEntries": sum(1 for x in manifest if x["status"] == "NOT_PUBLISHED_OR_NOT_FOUND"),
        "failedEntries": sum(1 for x in manifest if x["status"] in {"COURSE_PAGE_FAILED", "DOWNLOAD_FAILED"}),
        "officialIndex": BASE + "index.php?r=site%2Fdiploma-modelqp&scheme=REV2026",
    }
    (OUT / "SUMMARY.json").write_text(json.dumps(summary, indent=2), encoding="utf-8")
    (OUT / "README.txt").write_text(
        "SITTTR Kerala Diploma Model Question Papers - Revision 2026\n"
        "Arranged department-wise and semester-wise.\n\n"
        "Only files actually published and downloadable from the official SITTTR course pages are included.\n"
        "See DOWNLOAD_MANIFEST.csv for every course, source page, download status and failures.\n",
        encoding="utf-8",
    )

    if ZIP_PATH.exists():
        ZIP_PATH.unlink()
    with zipfile.ZipFile(ZIP_PATH, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as zf:
        for path in sorted(OUT.rglob("*")):
            if path.is_file():
                zf.write(path, path.relative_to(OUT.parent))

    print(json.dumps(summary, indent=2))
    print(f"Created: {ZIP_PATH} ({ZIP_PATH.stat().st_size} bytes)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
