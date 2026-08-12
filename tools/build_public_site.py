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
    "tools", "workers", "node_modules", "_site",
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

INDEPENDENCE_CSS_TAG = '<link rel="stylesheet" href="/assets/css/independence-day-theme.css?v=annual-tricolour-circuit-1">'
INDEPENDENCE_JS_TAG = '<script defer src="/assets/js/independence-day-theme.js?v=annual-tricolour-circuit-1"></script>'


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
    if target == ROOT or ROOT in target.parents and target.name not in {"_site", "public-build"}:
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
            destination.write_text(inject_independence_assets(relative, html), encoding="utf-8")
        else:
            shutil.copy2(source, destination)
        copied += 1

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
