#!/usr/bin/env python3
"""Audit production resources with GET requests and release signatures."""
from __future__ import annotations

import json
import subprocess
from datetime import datetime, timezone
from pathlib import Path
from urllib.error import HTTPError
from urllib.parse import urlparse
from urllib.request import Request, urlopen
from xml.etree import ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
ORIGIN = "https://polypmna.dpdns.org"
REPORT_JSON = ROOT / "reports/production-url-audit.json"
REPORT_MD = ROOT / "reports/production-url-audit.md"
SIGNATURES = {
    "/": ("Revision 2026", "POLY PMNA", "/revision-2026.html"),
    "/revision-2026.html": ("Choose your department", "38 departments available"),
    "/revision-2021.html": ("Revision 2021", "department"),
    "/ask-poly.html": ("Ask POLY AI", "chatForm", "ask-poly-config.js"),
    "/daily-quiz.html": ("Revision 2021 Mock Exams", "supabase-url"),
    "/tools.html": ("Student Tools", "tools-catalog.html"),
    "/privacy.html": ("Ask POLY AI", "Supabase accounts", "Browser storage"),
}


def expected_commit() -> str:
    try:
        return subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=ROOT, text=True).strip()
    except Exception:
        return ""


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
    try:
        with urlopen(request, timeout=25) as response:
            data = response.read(262144)
            return {
                "status": response.status,
                "contentType": response.headers.get("Content-Type", ""),
                "bytesRead": len(data),
                "text": data.decode("utf-8", errors="replace") if "html" in response.headers.get("Content-Type", "").lower() or url.endswith(("/", ".html", ".json")) else "",
            }
    except HTTPError as exc:
        return {"status": exc.code, "contentType": exc.headers.get("Content-Type", ""), "bytesRead": 0, "text": "", "error": str(exc)}
    except Exception as exc:
        return {"status": "error", "contentType": "", "bytesRead": 0, "text": "", "error": f"{type(exc).__name__}: {exc}"}


def build_info() -> dict[str, object]:
    result = get_resource(f"{ORIGIN}/build-info.json?audit=1")
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
    for url in urls:
        result = get_resource(url + ("&" if "?" in url else "?") + "audit=1")
        text = str(result.pop("text", ""))
        route = urlparse(url).path or "/"
        missing = [marker for marker in SIGNATURES.get(route, ()) if marker not in text]
        item = {"url": url, **result, "missingSignatures": missing}
        resources.append(item)
        if result.get("status") not in (200, 206):
            failures.append(f"{url}: HTTP {result.get('status')}")
        if missing:
            failures.append(f"{url}: missing {missing}")
        if route.endswith(".html") or route == "/":
            if text and "<title" not in text.lower():
                failures.append(f"{url}: missing HTML title in response")

    info = build_info()
    expected = expected_commit()
    live_commit = info.get("body", {}).get("commit", "") if isinstance(info.get("body"), dict) else ""
    if info.get("status") not in (200, 206):
        failures.append(f"build-info.json: HTTP {info.get('status')}")
    elif expected and live_commit != expected:
        failures.append(f"production commit {live_commit or 'missing'} does not match {expected}")

    payload = {
        "schemaVersion": 2,
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
