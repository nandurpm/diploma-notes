# Purpose: Production url audit - Descriptive comment added for clarity
#!/usr/bin/env python3
"""Audit production resources with GET requests and release signatures."""
from __future__ import annotations

import json
import os
import subprocess
import time
from datetime import datetime, timezone
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urlparse
from urllib.request import Request, urlopen
from xml.etree import ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
ORIGIN = "https://polypmna.dpdns.org"
REPORT_JSON = ROOT / "reports/production-url-audit.json"
REPORT_MD = ROOT / "reports/production-url-audit.md"
REV2026_CATALOGUE = ROOT / "assets/data/revision-2026-programmes.json"


def revision_2026_programme_count() -> int:
    """Read the current official programme count instead of retaining a stale UI string."""
    catalogue = json.loads(REV2026_CATALOGUE.read_text(encoding="utf-8"))
    programmes = catalogue.get("programmes", [])
    if not isinstance(programmes, list) or not programmes:
        raise ValueError("Revision 2026 programme catalogue has no programmes list")
    declared_count = catalogue.get("programmeCount")
    if declared_count is not None and declared_count != len(programmes):
        raise ValueError(
            f"Revision 2026 programme count mismatch: declared {declared_count}, found {len(programmes)}"
        )
    return len(programmes)


def required_signatures() -> dict[str, tuple[str, ...]]:
    programme_count = revision_2026_programme_count()
    return {
        "/": ("Revision 2026", "POLY PMNA", "/revision-2026.html"),
        "/revision-2026.html": ("Choose your department", f"{programme_count} departments available"),
        "/revision-2021.html": ("Revision 2021", "department"),
        "/ask-poly.html": ("Ask POLY AI", "chatForm", "ask-poly-config.js"),
        "/daily-quiz.html": ("Mock Exams &amp; Daily Quiz", "supabase-url"),
        "/tools.html": ("Student Tools", "tools-catalog.html"),
        "/privacy.html": ("Ask POLY AI", "Supabase accounts", "Browser storage"),
    }


def expected_commit() -> str:
    """Resolve the deployment commit being audited.

    workflow_run events carry the SHA that actually triggered the deployment,
    while github.sha in the triggered workflow may already point at a newer
    default-branch commit. Manual and scheduled runs fall back to the checked
    out HEAD.
    """
    configured = os.environ.get("POLY_AUDIT_EXPECTED_COMMIT", "").strip()
    if configured:
        return configured
    try:
        return subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=ROOT, text=True).strip()
    except Exception:
        return ""


def deployed_commit_matches(expected: str, live: str) -> bool:
    """Accept the exact deployment or a generated descendant of it only."""
    if not expected or not live:
        return False
    if expected == live:
        return True
    try:
        result = subprocess.run(
            ["git", "merge-base", "--is-ancestor", expected, live],
            cwd=ROOT,
            check=False,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        return result.returncode == 0
    except Exception:
        return False


def get_resource(url: str) -> dict[str, object]:
    request = Request(
        url,
        method="GET",
        headers={
            "User-Agent": "POLY-PMNA-Production-Audit/2.0",
            "Cache-Control": "no-cache",
            "Range": "bytes=0-262143",
        },
    )
    last_error = ""
    for attempt in range(1, 4):
        try:
            with urlopen(request, timeout=25) as response:
                data = response.read(262144)
                content_type = response.headers.get("Content-Type", "")
                resource_path = urlparse(url).path
                is_text_resource = (
                    "html" in content_type.lower()
                    or "json" in content_type.lower()
                    or resource_path.endswith(("/", ".html", ".json"))
                )
                return {
                    "status": response.status,
                    "contentType": content_type,
                    "bytesRead": len(data),
                    "text": data.decode("utf-8", errors="replace") if is_text_resource else "",
                }
        except HTTPError as exc:
            return {"status": exc.code, "contentType": exc.headers.get("Content-Type", ""), "bytesRead": 0, "text": "", "error": str(exc)}
        except URLError as exc:
            last_error = f"{type(exc).__name__}: {exc}"
            if attempt < 3:
                time.sleep(attempt)
        except Exception as exc:
            return {"status": "error", "contentType": "", "bytesRead": 0, "text": "", "error": f"{type(exc).__name__}: {exc}"}
    return {"status": "error", "contentType": "", "bytesRead": 0, "text": "", "error": last_error}


def build_info(expected: str) -> dict[str, object]:
    # A commit-specific query key avoids accepting a stale Cloudflare cache entry.
    cache_key = expected[:12] if expected else "latest"
    result = get_resource(f"{ORIGIN}/build-info.json?audit={cache_key}")
    body: object = result.get("text", "")
    if result.get("status") in (200, 206):
        try:
            body = json.loads(str(body))
        except Exception:
            pass
    return {key: value for key, value in result.items() if key != "text"} | {"body": body}


def main() -> int:
    ns = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
    urls = [(loc.text or "").strip() for loc in ET.parse(ROOT / "sitemap.xml").findall("sm:url/sm:loc", ns)]
    resources: list[dict[str, object]] = []
    failures: list[str] = []
    signatures = required_signatures()
    for url in urls:
        result = get_resource(url + ("&" if "?" in url else "?") + "audit=1")
        text = str(result.pop("text", ""))
        route = urlparse(url).path or "/"
        missing = [marker for marker in signatures.get(route, ()) if marker not in text]
        item = {"url": url, **result, "missingSignatures": missing}
        resources.append(item)
        if result.get("status") not in (200, 206):
            failures.append(f"{url}: HTTP {result.get('status')}")
        if missing:
            failures.append(f"{url}: missing {missing}")
        if route.endswith(".html") or route == "/":
            if text and "<title" not in text.lower():
                failures.append(f"{url}: missing HTML title in response")

    expected = expected_commit()
    info = build_info(expected)
    live_commit = info.get("body", {}).get("commit", "") if isinstance(info.get("body"), dict) else ""
    if info.get("status") not in (200, 206):
        failures.append(f"build-info.json: HTTP {info.get('status')}")
    elif expected and not deployed_commit_matches(expected, live_commit):
        failures.append(
            f"production commit {live_commit or 'missing'} is not the expected deployment "
            f"or a generated descendant of {expected}"
        )

    payload = {
        "schemaVersion": 3,
        "revision2026ProgrammeCount": revision_2026_programme_count(),
        "generatedAt": datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
        "expectedCommit": expected,
        "productionBuildInfo": info,
        "resourcesChecked": len(resources),
        "failureCount": len(failures),
        "failures": failures,
        "resources": resources,
    }
    REPORT_JSON.parent.mkdir(parents=True, exist_ok=True)
    REPORT_JSON.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    lines = [
        "# Production URL Audit", "",
        f"- Generated: **{payload['generatedAt']}**",
        f"- Expected commit: `{expected or 'unknown'}`",
        f"- Live commit: `{live_commit or 'missing'}`",
        f"- Deployment lineage valid: **{'yes' if deployed_commit_matches(expected, live_commit) else 'no'}**",
        f"- Resources checked with GET: **{len(resources)}**",
        f"- Failures: **{len(failures)}**", "",
    ]
    if failures:
        lines.extend(["## Failures", ""] + [f"- {item}" for item in failures] + [""])
    else:
        lines.extend(["All production resources and required release signatures passed.", ""])
    REPORT_MD.write_text("\n".join(lines), encoding="utf-8")
    print("\n".join(lines))
    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
