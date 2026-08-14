#!/usr/bin/env python3
"""Audit lesson sources against canonical POLY PMNA PDF archive files and manifests.

The utility is intentionally read-only. It verifies source discovery, manifest consistency,
canonical archive paths, PDF signatures, sizes, SHA-256 checksums, and page counts, then
writes a machine-readable JSON report and a concise Markdown report.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import shutil
import subprocess
import sys
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import quote

DEFAULT_PDF_BASE_URL = "https://raw.githubusercontent.com/nandurpm/poly-pmna-pdf-files/main"
DEFAULT_PDF_VERSION = "v1"
REVISIONS = ("2021", "2026")


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def git_revision(root: Path) -> str:
    completed = subprocess.run(
        ["git", "rev-parse", "HEAD"],
        cwd=root,
        text=True,
        capture_output=True,
        check=False,
    )
    return completed.stdout.strip() if completed.returncode == 0 else "unknown"


def pdf_pages(path: Path) -> tuple[int | None, str | None]:
    completed = subprocess.run(
        ["pdfinfo", str(path)], text=True, capture_output=True, check=False
    )
    if completed.returncode != 0:
        return None, completed.stderr.strip() or "pdfinfo failed"
    match = re.search(r"^Pages:\s+(\d+)\s*$", completed.stdout, flags=re.M)
    if not match:
        return None, "PDF page count is missing"
    return int(match.group(1)), None


def lesson_title(path: Path) -> str:
    text = path.read_text(encoding="utf-8", errors="replace")
    match = re.search(r"<title[^>]*>\s*(.*?)\s*</title>", text, flags=re.I | re.S)
    if not match:
        return ""
    return re.sub(r"\s+", " ", match.group(1)).strip()


def source_items(source_root: Path) -> list[dict[str, str]]:
    specs = (
        ("2021", source_root / "lessons", "lessons"),
        (
            "2026",
            source_root / "revision-2026-content" / "lessons",
            "revision-2026-content/lessons",
        ),
    )
    rows: list[dict[str, str]] = []
    for revision, directory, prefix in specs:
        if not directory.is_dir():
            continue
        for source in sorted(directory.glob("lessons-*.html")):
            code = source.stem.removeprefix("lessons-")
            rows.append(
                {
                    "revision": revision,
                    "code": code,
                    "source": f"{prefix}/{source.name}",
                    "title": lesson_title(source),
                }
            )
    return rows


def canonical_url(base_url: str, revision: str, code: str, version: str) -> str:
    encoded_code = quote(code, safe="")
    encoded_version = quote(version, safe="")
    return (
        f"{base_url.rstrip('/')}/notes/{revision}/{encoded_code}/"
        f"{encoded_version}/{encoded_code}.pdf"
    )


def read_manifest(pdf_root: Path, revision: str) -> tuple[dict, dict[str, dict], list[str]]:
    path = pdf_root / "manifests" / f"notes-{revision}.json"
    payload = json.loads(path.read_text(encoding="utf-8"))
    subjects = payload.get("subjects", [])
    duplicates = [
        code
        for code, count in Counter(subject.get("code", "") for subject in subjects).items()
        if count > 1
    ]
    return payload, {subject.get("code", ""): subject for subject in subjects}, duplicates


def write_markdown(result: dict, path: Path) -> None:
    counts = result["lessonCountByRevision"]
    lines = [
        "# Weekly Lesson and PDF Health Check",
        "",
        f"- Generated: `{result['generatedAt']}`",
        f"- Main repository commit: `{result['sourceCommit']}`",
        f"- PDF archive commit: `{result['pdfArchiveCommit']}`",
        f"- Lessons checked: **{result['lessonCount']}** (2021: {counts['2021']}; 2026: {counts['2026']})",
        f"- Health-check failures: **{result['failureCount']}**",
        "",
        "| Revision | Lesson sources | Manifest entries | Canonical PDFs | Duplicate manifest codes |",
        "|---|---:|---:|---:|---:|",
    ]
    for revision in REVISIONS:
        meta = result["manifestMetadata"].get(revision, {})
        lines.append(
            f"| {revision} | {counts[revision]} | {meta.get('subjectCount', 0)} "
            f"| {result['canonicalPdfCountByRevision'][revision]} "
            f"| {len(meta.get('duplicateCodes', []))} |"
        )

    if result["failures"]:
        lines += ["", "## Findings", "", "| Scope | Check | Detail |", "|---|---|---|"]
        lines += [
            f"| `{item['scope']}` | {item['check']} | {item['detail']} |"
            for item in result["failures"]
        ]
    else:
        lines += [
            "",
            "## Result",
            "",
            "All lesson-source, manifest, canonical-path, PDF-signature, byte-size, SHA-256, and page-count checks passed.",
        ]
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source-root", default=".", help="diploma-notes checkout")
    parser.add_argument("--pdf-root", required=True, help="poly-pmna-pdf-files checkout")
    parser.add_argument("--output-dir", default="health-check-report")
    parser.add_argument("--pdf-base-url", default=DEFAULT_PDF_BASE_URL)
    parser.add_argument("--pdf-version", default=DEFAULT_PDF_VERSION)
    args = parser.parse_args()

    source_root = Path(args.source_root).resolve()
    pdf_root = Path(args.pdf_root).resolve()
    output_dir = Path(args.output_dir).resolve()
    output_dir.mkdir(parents=True, exist_ok=True)

    if shutil.which("pdfinfo") is None:
        print("pdfinfo is required; install poppler-utils before running this audit.", file=sys.stderr)
        return 2
    if not source_root.is_dir() or not pdf_root.is_dir():
        print("Both --source-root and --pdf-root must be existing directories.", file=sys.stderr)
        return 2

    sources = source_items(source_root)
    source_by_key = {(row["revision"], row["code"]): row for row in sources}
    source_counts = {
        revision: sum(row["revision"] == revision for row in sources) for revision in REVISIONS
    }
    failures: list[dict[str, str]] = []
    manifests: dict[str, dict[str, dict]] = {}
    manifest_metadata: dict[str, dict] = {}

    for revision in REVISIONS:
        try:
            payload, entries, duplicates = read_manifest(pdf_root, revision)
        except (OSError, json.JSONDecodeError) as exc:
            failures.append(
                {
                    "scope": f"manifest-{revision}",
                    "check": "read_manifest",
                    "detail": str(exc),
                }
            )
            manifests[revision] = {}
            manifest_metadata[revision] = {
                "revision": None,
                "schemaVersion": None,
                "subjectCount": 0,
                "duplicateCodes": [],
            }
            continue
        manifests[revision] = entries
        manifest_metadata[revision] = {
            "revision": payload.get("revision"),
            "schemaVersion": payload.get("schemaVersion"),
            "subjectCount": len(entries),
            "duplicateCodes": duplicates,
        }
        if payload.get("revision") != revision:
            failures.append(
                {
                    "scope": f"manifest-{revision}",
                    "check": "revision",
                    "detail": f"expected {revision}, got {payload.get('revision')}",
                }
            )
        if duplicates:
            failures.append(
                {
                    "scope": f"manifest-{revision}",
                    "check": "duplicate_codes",
                    "detail": ", ".join(duplicates),
                }
            )

    duplicate_sources = [
        f"{revision}:{code}"
        for (revision, code), count in Counter(
            (row["revision"], row["code"]) for row in sources
        ).items()
        if count > 1
    ]
    if duplicate_sources:
        failures.append(
            {
                "scope": "sources",
                "check": "duplicate_codes",
                "detail": ", ".join(duplicate_sources),
            }
        )

    checked: list[dict] = []
    for row in sources:
        revision = row["revision"]
        code = row["code"]
        issues: list[str] = []
        if not code:
            issues.append("empty code")
        if not row["title"]:
            issues.append("missing HTML title")

        entry = manifests[revision].get(code)
        expected_path = pdf_root / "notes" / revision / code / args.pdf_version / f"{code}.pdf"
        if entry is None:
            issues.append("missing manifest entry")
        else:
            expected_pdf_url = canonical_url(
                args.pdf_base_url, revision, code, args.pdf_version
            )
            expected_values = {
                "revision": revision,
                "version": args.pdf_version,
                "status": "published",
                "source": row["source"],
                "pdfUrl": expected_pdf_url,
            }
            for field, expected in expected_values.items():
                if entry.get(field) != expected:
                    issues.append(f"manifest {field} mismatch")
            if not entry.get("title"):
                issues.append("manifest title missing")

        actual_bytes = 0
        actual_sha256 = ""
        actual_pages: int | None = None
        if not expected_path.is_file():
            issues.append("canonical PDF missing")
        else:
            with expected_path.open("rb") as handle:
                if handle.read(5) != b"%PDF-":
                    issues.append("canonical file lacks PDF signature")
            actual_bytes = expected_path.stat().st_size
            actual_sha256 = sha256(expected_path)
            actual_pages, page_error = pdf_pages(expected_path)
            if page_error:
                issues.append(page_error)
            elif actual_pages is not None and actual_pages < 1:
                issues.append("canonical PDF has no pages")
            if entry is not None:
                if entry.get("bytes") != actual_bytes:
                    issues.append("manifest byte count mismatch")
                if entry.get("sha256") != actual_sha256:
                    issues.append("manifest SHA-256 mismatch")
                if entry.get("pages") != actual_pages:
                    issues.append("manifest page count mismatch")

        checked.append(
            {
                **row,
                "canonicalPath": str(expected_path.relative_to(pdf_root)),
                "pdfUrl": canonical_url(
                    args.pdf_base_url, revision, code, args.pdf_version
                ),
                "bytes": actual_bytes,
                "sha256": actual_sha256,
                "pages": actual_pages,
                "issues": issues,
            }
        )
        failures.extend(
            {
                "scope": f"{revision}/{code}",
                "check": "source_manifest_pdf",
                "detail": issue,
            }
            for issue in issues
        )

    canonical_counts: dict[str, int] = {}
    for revision in REVISIONS:
        for code in manifests[revision]:
            if (revision, code) not in source_by_key:
                failures.append(
                    {
                        "scope": f"{revision}/{code}",
                        "check": "orphan_manifest_entry",
                        "detail": "no matching lesson source",
                    }
                )
        notes_dir = pdf_root / "notes" / revision
        actual_codes = {
            pdf.parent.parent.name
            for pdf in notes_dir.glob(f"*/{args.pdf_version}/*.pdf")
        }
        canonical_counts[revision] = len(actual_codes)
        expected_codes = {
            code for source_revision, code in source_by_key if source_revision == revision
        }
        for code in sorted(actual_codes - expected_codes):
            failures.append(
                {
                    "scope": f"{revision}/{code}",
                    "check": "orphan_pdf",
                    "detail": "no matching lesson source",
                }
            )
        for code in sorted(expected_codes - actual_codes):
            failures.append(
                {
                    "scope": f"{revision}/{code}",
                    "check": "missing_pdf",
                    "detail": "no canonical PDF discovered",
                }
            )

    result = {
        "generatedAt": datetime.now(timezone.utc).replace(microsecond=0).isoformat(),
        "sourceRoot": str(source_root),
        "pdfRoot": str(pdf_root),
        "sourceCommit": git_revision(source_root),
        "pdfArchiveCommit": git_revision(pdf_root),
        "lessonCount": len(sources),
        "lessonCountByRevision": source_counts,
        "canonicalPdfCountByRevision": canonical_counts,
        "manifestMetadata": manifest_metadata,
        "checked": checked,
        "failureCount": len(failures),
        "failures": failures,
    }
    json_path = output_dir / "lesson-pdf-health.json"
    markdown_path = output_dir / "lesson-pdf-health.md"
    json_path.write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
    write_markdown(result, markdown_path)
    print(
        json.dumps(
            {
                "lessons": len(sources),
                "failures": len(failures),
                "jsonReport": str(json_path),
                "markdownReport": str(markdown_path),
            }
        )
    )
    return 0 if not failures else 1


if __name__ == "__main__":
    raise SystemExit(main())
