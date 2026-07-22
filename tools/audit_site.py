# Purpose: Audit site - Descriptive comment added for clarity
#!/usr/bin/env python3
"""Generate the current POLY PMNA repository integrity report."""
from __future__ import annotations

import json
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlparse
from xml.etree import ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
REPORT_DIR = ROOT / "reports"


def run(*args: str) -> subprocess.CompletedProcess[str]:
    return subprocess.run(args, cwd=ROOT, text=True, capture_output=True)


def git_value(*args: str) -> str:
    result = run("git", *args)
    return result.stdout.strip() if result.returncode == 0 else ""


def sitemap_urls() -> list[str]:
    ns = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
    return [
        (node.text or "").strip()
        for node in ET.parse(ROOT / "sitemap.xml").findall("sm:url/sm:loc", ns)
    ]


def main() -> int:
    REPORT_DIR.mkdir(parents=True, exist_ok=True)
    generated = run(sys.executable, "tools/generate_sitemap.py")
    if generated.returncode != 0:
        print(generated.stdout, generated.stderr, file=sys.stderr)
        return generated.returncode

    gate = run(sys.executable, "tools/site_quality_gate.py")
    urls = sitemap_urls()
    html_urls = [url for url in urls if urlparse(url).path.endswith(("/", ".html"))]
    pdf_urls = [url for url in urls if urlparse(url).path.endswith(".pdf")]
    counts = {
        "sitemapResources": len(urls),
        "htmlResources": len(html_urls),
        "pdfResources": len(pdf_urls),
        "revision2021Departments": len(list((ROOT / "revision-2021").glob("*.html"))),
        "revision2026Departments": len([
            p for p in (ROOT / "revision-2026").glob("*.html") if p.name != "department-view.html"
        ]),
        "revision2021Lessons": len(list((ROOT / "lessons").glob("lessons-*.html"))),
        "revision2026Lessons": len(list((ROOT / "revision-2026-content/lessons").glob("lessons-*.html"))),
        "revision2021Notes": len(list((ROOT / "notes").glob("*.pdf"))),
        "revision2026Notes": len(list((ROOT / "revision-2026-content/notes").glob("*.pdf"))),
    }
    payload = {
        "schemaVersion": 2,
        "generatedAt": datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
        "commit": git_value("rev-parse", "HEAD"),
        "branch": git_value("branch", "--show-current") or "main",
        "status": "passed" if gate.returncode == 0 else "failed",
        "counts": counts,
        "qualityGateOutput": (gate.stdout + gate.stderr).strip(),
        "scope": [
            "All canonical HTML and indexed PDF resources generated into sitemap.xml",
            "Metadata, canonical URL, H1, duplicate IDs, skip links and local references",
            "Critical endpoint, score-integrity, redirect, inline-script and file checks",
            "Critical JavaScript syntax and secret scanning are handled by CI",
            "Browser/runtime and production checks are separate workflows",
        ],
    }
    (REPORT_DIR / "site-integrity-audit.json").write_text(
        json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    lines = [
        "# Site Integrity Audit",
        "",
        f"- Generated: **{payload['generatedAt']}**",
        f"- Commit: `{payload['commit']}`",
        f"- Branch: `{payload['branch']}`",
        f"- Result: **{payload['status'].upper()}**",
        "",
        "## Current scope",
        "",
    ]
    lines.extend(f"- {item}" for item in payload["scope"])
    lines.extend(["", "## Inventory", ""])
    labels = {
        "sitemapResources": "Sitemap resources",
        "htmlResources": "Indexed HTML resources",
        "pdfResources": "Indexed PDFs",
        "revision2021Departments": "Revision 2021 department files",
        "revision2026Departments": "Revision 2026 department files",
        "revision2021Lessons": "Revision 2021 lesson files",
        "revision2026Lessons": "Revision 2026 lesson files",
        "revision2021Notes": "Revision 2021 note PDFs",
        "revision2026Notes": "Revision 2026 note PDFs",
    }
    lines.extend(f"- {labels[key]}: **{value}**" for key, value in counts.items())
    lines.extend(["", "## Quality gate output", "", "```text", payload["qualityGateOutput"], "```", ""])
    (REPORT_DIR / "site-integrity-audit.md").write_text("\n".join(lines), encoding="utf-8")
    print("\n".join(lines))
    return gate.returncode


if __name__ == "__main__":
    raise SystemExit(main())
