#!/usr/bin/env python3
from __future__ import annotations

import json
from pathlib import Path
from urllib.error import HTTPError
from urllib.request import Request, urlopen
from xml.etree import ElementTree as ET


ROOT = Path(__file__).resolve().parents[1]
REPORT_JSON = ROOT / "reports/site-integrity-audit.json"
REPORT_MD = ROOT / "reports/site-integrity-audit.md"


def head_status(url: str) -> int | str:
    try:
        with urlopen(Request(url, method="HEAD", headers={"User-Agent": "Diploma Notes audit"}), timeout=15) as response:
            return response.status
    except HTTPError as exc:
        return exc.code
    except Exception as exc:
        return f"{type(exc).__name__}: {exc}"


def get_build_info() -> dict[str, object]:
    try:
        with urlopen("https://polypmna.dpdns.org/build-info.json", timeout=15) as response:
            return {"status": response.status, "body": json.loads(response.read().decode("utf-8"))}
    except HTTPError as exc:
        return {"status": exc.code, "body": exc.read().decode("utf-8", errors="ignore")[:200]}
    except Exception as exc:
        return {"status": "error", "body": str(exc)}


def main() -> int:
    ns = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
    urls = [(loc.text or "").strip() for loc in ET.parse(ROOT / "sitemap.xml").findall("sm:url/sm:loc", ns)]
    pages = [{"url": url, "status": head_status(url)} for url in urls]
    failed = [item for item in pages if item["status"] != 200]
    build_info = get_build_info()

    payload = json.loads(REPORT_JSON.read_text(encoding="utf-8"))
    payload["production_url_audit"] = {
        "pages_checked": len(pages),
        "pages_with_http_failures": len(failed),
        "build_info": build_info,
        "pages": pages,
    }
    REPORT_JSON.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    markdown = REPORT_MD.read_text(encoding="utf-8")
    markdown += "\n## Production URL Audit\n\n"
    markdown += f"- Sitemap URLs checked: **{len(pages)}**\n"
    markdown += f"- HTTP failures: **{len(failed)}**\n"
    markdown += f"- Production build-info.json status: **{build_info['status']}**\n"
    if failed:
      for item in failed:
        markdown += f"- {item['url']}: {item['status']}\n"
    REPORT_MD.write_text(markdown, encoding="utf-8")

    print(f"Production URLs checked: {len(pages)}")
    print(f"HTTP failures: {len(failed)}")
    print(f"Production build-info.json status: {build_info['status']}")
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
