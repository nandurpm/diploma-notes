#!/usr/bin/env python3
"""Validate high-level repository placement without touching public routes.

This check intentionally does not require framework-style source folders. POLY PMNA
is a static-first site whose established root HTML filenames are public URLs. The
layout policy keeps those compatibility paths stable while preventing developer
notes, generated output, and temporary files from accumulating beside them.
"""
from __future__ import annotations

import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

ALLOWED_ROOT_MARKDOWN = {
    "README.md",
    "CONTRIBUTING.md",
    "SECURITY.md",
}

REQUIRED_ROOT_FILES = {
    "README.md",
    "CONTRIBUTING.md",
    "SECURITY.md",
    "LICENSE",
    "index.html",
    "about.html",
    "revision-2026.html",
    "revision-2021.html",
    "ask-poly.html",
    "daily-quiz.html",
    "tools.html",
    "contact.html",
    "sw.js",
    "site.webmanifest",
    "robots.txt",
    "sitemap.xml",
    "build-info.json",
}

REQUIRED_DIRECTORIES = {
    "assets",
    "docs",
    "reports",
    "scripts",
    "tests",
    "tools",
    "workers",
}

REQUIRED_DOCUMENTATION = {
    "docs/README.md",
    "docs/REPOSITORY-MAP.md",
    "docs/development/README.md",
    "docs/development/coding-guidelines.md",
    "docs/audits/README.md",
}

GENERATED_DIRECTORY_PREFIXES = (
    "_site/",
    "_site_test/",
    "node_modules/",
)

GENERATED_PATH_PARTS = {
    "playwright-report",
    "test-results",
    "__pycache__",
}

TEMPORARY_SUFFIXES = {
    ".bak",
    ".log",
    ".orig",
    ".rej",
    ".tmp",
}


def tracked_files() -> list[str]:
    """Return Git-tracked paths, falling back to the working tree if needed."""
    try:
        result = subprocess.run(
            ["git", "ls-files"],
            cwd=ROOT,
            check=True,
            capture_output=True,
            text=True,
        )
    except (OSError, subprocess.CalledProcessError):
        return [
            path.relative_to(ROOT).as_posix()
            for path in ROOT.rglob("*")
            if path.is_file() and ".git" not in path.parts
        ]
    return [line.strip() for line in result.stdout.splitlines() if line.strip()]


def main() -> int:
    failures: list[str] = []

    root_markdown = {
        path.name for path in ROOT.iterdir() if path.is_file() and path.suffix.lower() == ".md"
    }
    unexpected_markdown = sorted(root_markdown - ALLOWED_ROOT_MARKDOWN)
    if unexpected_markdown:
        failures.append(
            "Developer Markdown must live under docs/: " + ", ".join(unexpected_markdown)
        )

    for relative in sorted(REQUIRED_ROOT_FILES):
        if not (ROOT / relative).is_file():
            failures.append(f"Required root/public file is missing: {relative}")

    for relative in sorted(REQUIRED_DIRECTORIES):
        if not (ROOT / relative).is_dir():
            failures.append(f"Required top-level directory is missing: {relative}/")

    for relative in sorted(REQUIRED_DOCUMENTATION):
        if not (ROOT / relative).is_file():
            failures.append(f"Required documentation index/guide is missing: {relative}")

    tracked = tracked_files()
    for relative in tracked:
        path = Path(relative)
        lower_name = path.name.lower()

        if relative.startswith(GENERATED_DIRECTORY_PREFIXES):
            failures.append(f"Generated directory must not be tracked: {relative}")
            continue

        if any(part in GENERATED_PATH_PARTS for part in path.parts):
            failures.append(f"Generated test/cache output must not be tracked: {relative}")
            continue

        if path.parent == Path(".") and path.suffix.lower() in TEMPORARY_SUFFIXES:
            failures.append(f"Temporary file must not be tracked at repository root: {relative}")
            continue

        if path.parent == Path(".") and lower_name.startswith(("audit_", "audit-", "report_", "report-")):
            failures.append(
                f"Audit/report files belong under docs/audits/ or reports/, not root: {relative}"
            )

    if failures:
        print("Repository layout check failed:")
        for failure in failures:
            print(f" - {failure}")
        return 1

    print(
        "Repository layout OK: public root routes preserved; developer docs, "
        "audits, generated output, and temporary files are kept in their owning directories."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
