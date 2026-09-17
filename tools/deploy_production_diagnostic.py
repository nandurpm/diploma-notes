# Purpose: Deploy production diagnostic - Descriptive comment added for clarity
#!/usr/bin/env python3
"""Build, deploy and verify the optional POLY PMNA Cloudflare Pages mirror while recording safe diagnostics."""
from __future__ import annotations

import json
import os
import subprocess
import sys
import time
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REPORT = Path(os.environ.get("DEPLOY_DIAGNOSTIC_REPORT", "/tmp/deploy-diagnostic.md"))
DOMAIN = os.environ.get("PRODUCTION_DOMAIN", "diploma-notes.pages.dev")
TOKEN = os.environ.get("CLOUDFLARE_API_TOKEN", "")
ACCOUNT = os.environ.get("CLOUDFLARE_ACCOUNT_ID", "")
SHA = os.environ.get("GITHUB_SHA", "unknown")
lines: list[str] = []


def log(message: str) -> None:
    print(message, flush=True)
    lines.append(message)


def run(command: list[str], label: str) -> None:
    log(f"Running: {label}")
    result = subprocess.run(command, cwd=ROOT, text=True, capture_output=True, env=os.environ.copy())
    if result.stdout.strip():
        lines.extend(result.stdout.strip().splitlines()[-25:])
    if result.returncode:
        if result.stderr.strip():
            lines.extend(result.stderr.strip().splitlines()[-25:])
        raise RuntimeError(f"{label} failed with exit code {result.returncode}")


def cloudflare_project() -> str:
    # Match deploy-static-site.yml: deployment does not require permission to
    # enumerate every project in the account or ownership of production DNS.
    project = os.environ.get("CLOUDFLARE_PAGES_PROJECT", "diploma-notes").strip()
    if not project or any(c not in "abcdefghijklmnopqrstuvwxyz0123456789-" for c in project):
        raise ValueError("CLOUDFLARE_PAGES_PROJECT must be a Pages project slug")
    return project


def verify_live() -> None:
    base = "https://" + DOMAIN
    headers = {"Cache-Control": "no-cache", "User-Agent": "POLY-PMNA-Deploy-QA/9.0"}
    last = ""
    for attempt in range(1, 7):
        try:
            with urllib.request.urlopen(
                urllib.request.Request(base + f"/build-info.json?qa={attempt}", headers=headers), timeout=20
            ) as response:
                info = json.loads(response.read().decode("utf-8"))
            with urllib.request.urlopen(
                urllib.request.Request(base + f"/about.html?qa={attempt}", headers=headers), timeout=20
            ) as response:
                about = response.read().decode("utf-8", errors="replace")
            if info.get("commit") != SHA:
                raise RuntimeError(f"live commit {info.get('commit')} != {SHA}")
            for marker in (
                "Bilingual Kerala Polytechnic Study Portal",
                "data-about-guide",
                'data-about-lang="ml"',
                "/assets/js/about-experience.js",
            ):
                if marker not in about:
                    raise RuntimeError(f"About page missing {marker}")
            log(f"Live verification passed for commit {info.get('commit')}.")
            return
        except Exception as error:  # noqa: BLE001 - diagnostic aggregation
            last = f"Attempt {attempt}: {type(error).__name__}: {error}"
            log(last)
            if attempt < 6:
                time.sleep(8)
    raise RuntimeError(last)


def write_report(status: str, error: str = "") -> None:
    REPORT.parent.mkdir(parents=True, exist_ok=True)
    body = [
        f"# Cloudflare Pages mirror diagnostic: {status}",
        "",
        f"- Commit: `{SHA}`",
        f"- Domain: `{DOMAIN}`",
        f"- Cloudflare token configured: `{'yes' if TOKEN else 'no'}`",
        f"- Cloudflare account configured: `{'yes' if ACCOUNT else 'no'}`",
    ]
    if error:
        body.extend([f"- Error: `{error}`"])
    body.extend(["", "```text", *lines[-120:], "```", ""])
    REPORT.write_text("\n".join(body), encoding="utf-8")


def main() -> int:
    log(f"Commit: {SHA}")
    log(f"Domain: {DOMAIN}")
    log(f"Cloudflare token configured: {'yes' if TOKEN else 'no'}")
    log(f"Cloudflare account configured: {'yes' if ACCOUNT else 'no'}")
    try:
        if not TOKEN:
            raise RuntimeError("CLOUDFLARE_API_TOKEN is missing")
        if not ACCOUNT:
            raise RuntimeError("CLOUDFLARE_ACCOUNT_ID is missing")
        run([sys.executable, "tools/write_build_info.py"], "build-info generation")
        run([sys.executable, "tools/generate_sitemap.py"], "sitemap generation")
        run([sys.executable, "tools/site_quality_gate.py"], "site quality gate")
        run([sys.executable, "tools/build_public_site.py", "--target", "_site"], "public site build")
        about = (ROOT / "_site/about.html").read_text(encoding="utf-8")
        if "Bilingual Kerala Polytechnic Study Portal" not in about:
            raise RuntimeError("redesigned About page is missing from the public build")
        project = cloudflare_project()
        log(f"Resolved Cloudflare Pages project: {project}")
        run(
            [
                "npx", "--yes", "wrangler@4", "pages", "deploy", "_site",
                f"--project-name={project}", "--branch=main", f"--commit-hash={SHA}",
                f"--commit-message=Deploy {SHA}",
            ],
            "Cloudflare Pages deployment",
        )
        verify_live()
        write_report("passed")
        return 0
    except Exception as error:  # noqa: BLE001 - report exact diagnostic failure
        log(f"ERROR: {type(error).__name__}: {error}")
        write_report("failed", f"{type(error).__name__}: {error}")
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
