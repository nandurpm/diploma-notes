#!/usr/bin/env python3
"""Verify the redesigned About page and build metadata on the production domain."""
from __future__ import annotations

import argparse
import json
import time
import urllib.request
from pathlib import Path

MARKERS = (
    "Bilingual Kerala Polytechnic Study Portal",
    "data-about-guide",
    'data-about-lang="ml"',
    "/assets/js/about-experience.js",
    "/assets/css/about-experience.css",
)


def fetch(url: str) -> str:
    request = urllib.request.Request(
        url,
        headers={
            "Cache-Control": "no-cache, no-store, max-age=0",
            "Pragma": "no-cache",
            "User-Agent": "POLY-PMNA-Live-About-QA/1.0",
        },
    )
    with urllib.request.urlopen(request, timeout=25) as response:
        return response.read().decode("utf-8", errors="replace")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--domain", default="polypmna.dpdns.org")
    parser.add_argument("--expected-commit", default="")
    parser.add_argument("--attempts", type=int, default=10)
    parser.add_argument("--delay", type=float, default=6)
    parser.add_argument("--report", type=Path, default=Path("/tmp/live-about-verification.md"))
    args = parser.parse_args()

    base = "https://" + args.domain.strip().strip("/")
    observations: list[str] = []
    status = "failed"
    error_message = ""
    live_commit = ""

    for attempt in range(1, max(1, args.attempts) + 1):
        token = f"{int(time.time())}-{attempt}"
        try:
            about = fetch(f"{base}/about.html?live_qa={token}")
            try:
                build_info = json.loads(fetch(f"{base}/build-info.json?live_qa={token}"))
                live_commit = str(build_info.get("commit") or "")
            except Exception as error:  # noqa: BLE001
                build_info = {}
                observations.append(f"Attempt {attempt}: build-info unavailable ({type(error).__name__}: {error})")
            missing = [marker for marker in MARKERS if marker not in about]
            title = ""
            if "<title>" in about.lower():
                lower = about.lower()
                start = lower.find("<title>") + 7
                end = lower.find("</title>", start)
                title = about[start:end].strip() if end > start else ""
            observations.append(
                f"Attempt {attempt}: title={title!r}; live_commit={live_commit or 'unknown'}; missing_markers={missing or 'none'}"
            )
            if missing:
                raise RuntimeError("redesigned About markers are missing")
            if args.expected_commit and live_commit != args.expected_commit:
                raise RuntimeError(f"live commit {live_commit or 'unknown'} != {args.expected_commit}")
            status = "passed"
            break
        except Exception as error:  # noqa: BLE001
            error_message = f"{type(error).__name__}: {error}"
            observations.append(f"Attempt {attempt} failed: {error_message}")
            if attempt < args.attempts:
                time.sleep(args.delay)

    args.report.parent.mkdir(parents=True, exist_ok=True)
    body = [
        f"# Live About page verification: {status}",
        "",
        f"- Domain: `{args.domain}`",
        f"- Expected commit: `{args.expected_commit or 'not enforced'}`",
        f"- Observed commit: `{live_commit or 'unknown'}`",
    ]
    if error_message and status != "passed":
        body.append(f"- Error: `{error_message}`")
    body.extend(["", "```text", *observations[-60:], "```", ""])
    args.report.write_text("\n".join(body), encoding="utf-8")
    return 0 if status == "passed" else 1


if __name__ == "__main__":
    raise SystemExit(main())
