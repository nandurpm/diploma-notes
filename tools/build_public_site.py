# Purpose: Build public site - Descriptive comment added for clarity
#!/usr/bin/env python3
"""Build the public-only POLY PMNA deployment artifact from tracked files."""
from __future__ import annotations

import argparse
import shutil
import subprocess
from pathlib import Path

# Root directory of the project
ROOT = Path(__file__).resolve().parents[1]

# Directories that should not be included in the public build
EXCLUDED_ROOTS = {
    ".git", ".github", "android", "android-app", "docs", "reports", "supabase",
    "tools", "workers", "node_modules", "_site", "previews",
}

# File extensions considered source code and excluded by default
SOURCE_SUFFIXES = {
    ".py", ".pyc", ".cjs", ".mjs", ".ts", ".tsx", ".sql", ".yml",
    ".yaml", ".md", ".lock", ".toml",
}

# Specific files that must be copied even if they match excluded patterns
EXPLICIT = {
    "CNAME", "_headers", "_redirects", "robots.txt", "sitemap.xml",
    "build-info.json", "site.webmanifest",
}

# Critical files that must exist for a successful deployment
REQUIRED = {
    "index.html", "revision-2026.html", "revision-2021.html", "ask-poly.html",
    "daily-quiz.html", "tools.html", "privacy.html", "sitemap.xml",
    "build-info.json", "site.webmanifest",
}

INDEPENDENCE_CSS_TAG = '<link rel="stylesheet" href="/assets/css/independence-day-theme.css?v=annual-tricolour-circuit-2">'
INDEPENDENCE_JS_TAG = '<script defer src="/assets/js/independence-day-theme.js?v=annual-tricolour-circuit-2"></script>'
PRE_ONAM_CSS_TAG = '<link rel="stylesheet" href="/assets/css/pre-onam-theme.css?v=20260819-pre-onam-perf3">'
PRE_ONAM_JS_TAG = '<script defer src="/assets/js/pre-onam-theme.js?v=20260819-pre-onam-perf3"></script>'
LEARNING_SPRINT_CSS_TAG = '<link rel="stylesheet" href="/assets/css/learning-sprint-theme.css?v=20260827-learning-sprint-v2">'
LEARNING_SPRINT_JS_TAG = '<script defer src="/assets/js/learning-sprint-theme.js?v=20260827-learning-sprint-v2"></script>'
NEW_YEAR_CSS_TAG = '<link rel="stylesheet" href="/assets/css/new-year-theme.css?v=20260819-new-year-v1">'
NEW_YEAR_JS_TAG = '<script defer src="/assets/js/new-year-theme.js?v=20260819-new-year-v1"></script>'


def inject_independence_assets(relative: str, content: str) -> str:
    """Load the centralized annual theme on every public HTML page.

    Cloudflare Pages may serve this repository as a static artifact without
    executing the source-level Functions middleware. Build-time injection keeps
    the same client-side date controller available in that deployment mode.
    """
    if Path(relative).suffix.lower() != ".html":
        return content
    if "independence-day-theme.css" in content or "independence-day-theme.js" in content:
        return content
    marker = "</head>"
    if marker not in content:
        return content
    tags = f"    {INDEPENDENCE_CSS_TAG}\n    {INDEPENDENCE_JS_TAG}\n"
    return content.replace(marker, tags + marker, 1)


def inject_pre_onam_assets(relative: str, content: str) -> str:
    """Load the date-driven pre-Onam controller in the public artifact."""
    if Path(relative).suffix.lower() != ".html" or "pre-onam-theme.js" in content:
        return content
    marker = "</head>"
    if marker not in content:
        return content
    tags = f"    {PRE_ONAM_CSS_TAG}\n    {PRE_ONAM_JS_TAG}\n"
    return content.replace(marker, tags + marker, 1)


def inject_learning_sprint_assets(relative: str, content: str) -> str:
    """Load the recurring IST 10th-day Learning Sprint theme."""
    if Path(relative).suffix.lower() != ".html" or "learning-sprint-theme.js" in content:
        return content
    marker = "</head>"
    if marker not in content:
        return content
    tags = f"    {LEARNING_SPRINT_CSS_TAG}\n    {LEARNING_SPRINT_JS_TAG}\n"
    return content.replace(marker, tags + marker, 1)


def inject_new_year_assets(relative: str, content: str) -> str:
    """Load the date-driven New Year controller in the public artifact."""
    if Path(relative).suffix.lower() != ".html" or "new-year-theme.js" in content:
        return content
    marker = "</head>"
    if marker not in content:
        return content
    tags = f"    {NEW_YEAR_CSS_TAG}\n    {NEW_YEAR_JS_TAG}\n"
    return content.replace(marker, tags + marker, 1)



def inject_public_runtime_assets(relative: str, content: str) -> str:
    # Standalone previews own their theme state machines and must not receive
    # autonomous production seasonal controllers during the public build.
    if relative.startswith("previews/"):
        return content
    content = inject_independence_assets(relative, content)
    content = inject_learning_sprint_assets(relative, content)
    content = inject_pre_onam_assets(relative, content)
    return inject_new_year_assets(relative, content)


# Retrieves a list of all files currently tracked by Git
def tracked_files() -> list[str]:
    output = subprocess.check_output(["git", "ls-files", "-z"], cwd=ROOT)
    return [value for value in output.decode().split("\0") if value]


# Determines if a file should be copied to the public build directory
def should_copy(relative: str) -> bool:
    path = Path(relative)
    if not path.parts:
        return False
    # Skip excluded directories and hidden files
    if path.parts[0] in EXCLUDED_ROOTS or path.name.startswith("."):
        return False
    # Skip source files unless explicitly required
    if path.suffix.lower() in SOURCE_SUFFIXES and relative not in EXPLICIT:
        return False
    return True


def build(target: Path, optimize: bool) -> None:
    target = target.resolve()
    if target == ROOT or ROOT in target.parents and target.name not in {"_site", "_site_test", "public-build"}:
        raise ValueError(f"Refusing unsafe target directory: {target}")
    if target.exists():
        shutil.rmtree(target)
    target.mkdir(parents=True)
    copied = 0
    for relative in tracked_files():
        if not should_copy(relative):
            continue
        source = ROOT / relative
        if not source.is_file():
            continue
        destination = target / relative
        destination.parent.mkdir(parents=True, exist_ok=True)
        if source.suffix.lower() == ".html":
            html = source.read_text(encoding="utf-8")
            destination.write_text(inject_public_runtime_assets(relative, html), encoding="utf-8")
        else:
            shutil.copy2(source, destination)
        copied += 1
    from restore_archived_pdfs import restore
    copied += restore(ROOT, target, should_copy)
    for relative in EXPLICIT:
        source = ROOT / relative
        if source.is_file():
            destination = target / relative
            destination.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(source, destination)
    (target / ".nojekyll").write_text("", encoding="utf-8")
    missing = sorted(relative for relative in REQUIRED if not (target / relative).is_file())
    if missing:
        raise FileNotFoundError("Missing deployment files: " + ", ".join(missing))
    if optimize:
        subprocess.check_call(
            ["python", str(ROOT / "tools/optimize_public_build.py"), "--root", str(target)],
            cwd=ROOT,
        )
    print(f"Prepared {copied} tracked public files in {target} (optimize={optimize}).")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--target", type=Path, default=ROOT / "_site")
    parser.add_argument("--no-optimize", action="store_true")
    args = parser.parse_args()
    build(args.target, optimize=not args.no_optimize)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

