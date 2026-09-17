#!/usr/bin/env python3
"""Verify all current POLY PMNA repository PDF download URLs.

The checker is intentionally dependency-free so it can run in GitHub Actions with
only the Python standard library. It reads the published PDF manifests plus any
repository PDF URLs embedded in HTML, deduplicates URLs, performs ranged requests,
and fails when any URL cannot be confirmed as a PDF after retries.
"""
from __future__ import annotations

import argparse
import csv
import json
import re
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

REPO_MARKER = "github.com/nandurpm/poly-pmna-pdf-files"
DEFAULT_BASE = "https://github.com/nandurpm/poly-pmna-pdf-files/raw/refs/heads/main/"
PDF_RE = re.compile(r"https?://github\.com/nandurpm/poly-pmna-pdf-files/raw/[^\"'<>\s]+?\.pdf(?:\?[^\"'<>\s]+)?", re.I)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repo-root", type=Path, default=Path(__file__).resolve().parents[1])
    parser.add_argument("--output-dir", type=Path, default=None)
    parser.add_argument("--workers", type=int, default=20)
    parser.add_argument("--timeout", type=float, default=30.0)
    parser.add_argument("--retries", type=int, default=3)
    return parser.parse_args()


def load_manifest_urls(repo_root: Path) -> dict[str, set[str]]:
    sources: dict[str, set[str]] = {}
    for manifest_path in (
        repo_root / "assets/data/sitttr-pdf-links.json",
        repo_root / "assets/data/revision-2015-pdf-links.json",
    ):
        if not manifest_path.exists():
            continue
        payload = json.loads(manifest_path.read_text(encoding="utf-8"))
        links = payload.get("links", {})
        if isinstance(links, dict):
            for revision, revision_links in links.items():
                if not isinstance(revision_links, dict):
                    continue
                for entry in revision_links.values():
                    if not isinstance(entry, dict):
                        continue
                    for kind, path in entry.items():
                        if isinstance(path, str) and path.lower().split("?")[0].endswith(".pdf"):
                            sources.setdefault(f"manifest:{manifest_path.name}:{revision}:{kind}", set()).add(DEFAULT_BASE + path.lstrip("/"))
        else:
            for key, entry in links.items():
                if not isinstance(entry, dict):
                    continue
                for kind, path in entry.items():
                    if isinstance(path, str) and path.lower().split("?")[0].endswith(".pdf"):
                        sources.setdefault(f"manifest:{manifest_path.name}:{key}:{kind}", set()).add(DEFAULT_BASE + path.lstrip("/"))
    return sources


def load_html_urls(repo_root: Path) -> dict[str, set[str]]:
    sources: dict[str, set[str]] = {}
    for html_path in repo_root.rglob("*.html"):
        if ".git" in html_path.parts:
            continue
        text = html_path.read_text(encoding="utf-8", errors="ignore")
        urls = set(PDF_RE.findall(text))
        if urls:
            sources[f"html:{html_path.relative_to(repo_root).as_posix()}"] = urls
    return sources


def discover_urls(repo_root: Path) -> tuple[dict[str, set[str]], dict[str, list[str]]]:
    source_urls: dict[str, set[str]] = {}
    source_urls.update(load_manifest_urls(repo_root))
    source_urls.update(load_html_urls(repo_root))
    url_sources: dict[str, list[str]] = {}
    for source, urls in source_urls.items():
        for url in urls:
            url_sources.setdefault(url, []).append(source)
    return source_urls, url_sources


def check_url(url: str, timeout: float, retries: int) -> dict[str, Any]:
    result: dict[str, Any] = {
        "url": url,
        "status": None,
        "final_url": "",
        "content_type": "",
        "content_length": "",
        "magic": "",
        "valid_pdf": False,
        "attempts": 0,
        "error": "",
    }
    for attempt in range(1, retries + 1):
        result["attempts"] = attempt
        try:
            request = Request(url, headers={"Range": "bytes=0-7", "User-Agent": "POLY-PMNA-PDF-Link-Checker/1.0"})
            with urlopen(request, timeout=timeout) as response:
                first = response.read(8) or b""
                result.update({
                    "status": getattr(response, "status", response.getcode()),
                    "final_url": response.geturl(),
                    "content_type": response.headers.get("Content-Type", ""),
                    "content_length": response.headers.get("Content-Length", ""),
                    "magic": first.hex(),
                })
            result["valid_pdf"] = result["status"] in (200, 206) and first.startswith(b"%PDF-")
            if result["valid_pdf"]:
                return result
            result["error"] = "Response did not contain a valid PDF signature"
        except HTTPError as exc:
            result.update({"status": exc.code, "final_url": exc.geturl(), "error": str(exc)})
        except (URLError, TimeoutError, OSError) as exc:
            result["error"] = repr(exc)
        if attempt < retries:
            time.sleep(min(2 ** (attempt - 1), 8))
    return result


def write_reports(output_dir: Path, results: list[dict[str, Any]], url_sources: dict[str, list[str]], source_urls: dict[str, set[str]], args: argparse.Namespace) -> dict[str, Any]:
    output_dir.mkdir(parents=True, exist_ok=True)
    for result in results:
        result["source_count"] = len(url_sources.get(result["url"], []))
        result["sources"] = sorted(url_sources.get(result["url"], []))
    invalid = [result for result in results if not result["valid_pdf"]]
    valid = [result for result in results if result["valid_pdf"]]
    summary = {
        "checked_at": datetime.now(timezone.utc).isoformat(),
        "repository_marker": REPO_MARKER,
        "source_group_count": len(source_urls),
        "unique_url_count": len(results),
        "valid_unique_url_count": len(valid),
        "invalid_unique_url_count": len(invalid),
        "retry_policy": {"workers": args.workers, "timeout_seconds": args.timeout, "retries": args.retries},
        "invalid_urls": invalid,
    }
    payload = {"summary": summary, "results": results}
    (output_dir / "weekly-pdf-link-health.json").write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    with (output_dir / "weekly-pdf-link-health.csv").open("w", newline="", encoding="utf-8") as handle:
        fields = ["url", "status", "final_url", "content_type", "content_length", "magic", "valid_pdf", "attempts", "error", "source_count", "sources"]
        writer = csv.DictWriter(handle, fieldnames=fields)
        writer.writeheader()
        for result in results:
            row = dict(result)
            row["sources"] = ";".join(row["sources"])
            writer.writerow({field: row.get(field, "") for field in fields})
    return summary


def main() -> int:
    args = parse_args()
    output_dir = args.output_dir or (args.repo_root / "reports")
    source_urls, url_sources = discover_urls(args.repo_root)
    urls = sorted(url_sources)
    if not urls:
        print("No repository PDF URLs discovered", file=sys.stderr)
        return 2
    results: list[dict[str, Any]] = []
    with ThreadPoolExecutor(max_workers=max(1, args.workers)) as executor:
        futures = {executor.submit(check_url, url, args.timeout, args.retries): url for url in urls}
        for index, future in enumerate(as_completed(futures), 1):
            results.append(future.result())
            if index % 250 == 0 or index == len(urls):
                print(f"checked {index}/{len(urls)}", flush=True)
    results.sort(key=lambda result: result["url"])
    summary = write_reports(output_dir, results, url_sources, source_urls, args)
    print(json.dumps(summary, indent=2, ensure_ascii=False))
    return 1 if summary["invalid_unique_url_count"] else 0


if __name__ == "__main__":
    raise SystemExit(main())
