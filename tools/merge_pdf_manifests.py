#!/usr/bin/env python3
"""Merge changed canonical-tree PDF entries into the PDF repository manifests."""

from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path


def load_json(path: Path, default: dict) -> dict:
    if not path.is_file():
        return default.copy()
    return json.loads(path.read_text(encoding="utf-8"))


def merge_revision(
    pdf_repo_root: Path,
    generated_root: Path,
    revision: str,
    source_commit: str,
    pdf_base_url: str,
    pdf_version: str,
) -> int:
    target = pdf_repo_root / "manifests" / f"notes-{revision}.json"
    generated = generated_root / f"notes-{revision}.json"
    if not generated.is_file():
        return 0

    incoming = json.loads(generated.read_text(encoding="utf-8"))
    existing = load_json(
        target,
        {
            "schemaVersion": 2,
            "storage": "git-tree",
            "revision": revision,
            "subjects": [],
        },
    )
    by_code: dict[str, dict] = {}
    for subject in existing.get("subjects", []):
        code = str(subject.get("code", "")).strip()
        if code:
            by_code[code] = dict(subject)

    for subject in incoming.get("subjects", []):
        code = str(subject.get("code", "")).strip()
        if code:
            by_code[code] = dict(subject)

    merged_subjects = [by_code[code] for code in sorted(by_code)]
    payload = {
        "schemaVersion": 2,
        "storage": "git-tree",
        "revision": revision,
        "generatedAt": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "sourceCommit": source_commit,
        "pdfBaseUrl": pdf_base_url,
        "pdfVersion": pdf_version,
        "subjects": merged_subjects,
    }
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    return len(incoming.get("subjects", []))


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--pdf-repo-root", required=True, type=Path)
    parser.add_argument("--generated-root", required=True, type=Path)
    parser.add_argument("--source-commit", required=True)
    parser.add_argument("--pdf-base-url", required=True)
    parser.add_argument("--pdf-version", required=True)
    parser.add_argument("--revision", action="append", required=True, choices=("2021", "2026"))
    args = parser.parse_args()

    changed = 0
    for revision in sorted(set(args.revision)):
        changed += merge_revision(
            args.pdf_repo_root.resolve(),
            args.generated_root.resolve(),
            revision,
            args.source_commit,
            args.pdf_base_url,
            args.pdf_version,
        )
    print(json.dumps({"updatedSubjects": changed, "revisions": sorted(set(args.revision))}))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
