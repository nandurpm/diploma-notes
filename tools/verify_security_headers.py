#!/usr/bin/env python3
"""Validate browser security response headers on source artifacts or live HTTPS."""
from __future__ import annotations

import argparse
import os
import re
import sys
import urllib.error
import urllib.request
from pathlib import Path


def header_errors(headers: dict[str, str]) -> list[str]:
    normalized = {str(name).lower(): str(value) for name, value in headers.items()}
    errors = []
    hsts = normalized.get("strict-transport-security", "")
    match = re.search(r"(?:^|;)\s*max-age\s*=\s*(\d+)\b", hsts, re.I)
    if not match or int(match.group(1)) < 31536000:
        errors.append("HSTS max-age must be at least 31536000 seconds")
    if normalized.get("x-content-type-options", "").strip().lower() != "nosniff":
        errors.append("X-Content-Type-Options must be nosniff")
    if not normalized.get("referrer-policy", "").strip():
        errors.append("Referrer-Policy is missing")
    if not normalized.get("permissions-policy", "").strip():
        errors.append("Permissions-Policy is missing")
    if not normalized.get("x-frame-options", "").strip():
        errors.append("X-Frame-Options is missing")
    csp = normalized.get("content-security-policy", "")
    for directive in ("default-src", "script-src", "object-src", "base-uri", "frame-ancestors"):
        if not re.search(r"(?:^|;)\s*" + re.escape(directive) + r"\s+", csp, re.I):
            errors.append("CSP is missing " + directive)
    return errors


def read_headers_file(path: Path) -> dict[str, str]:
    """Read the global /* Cloudflare Pages _headers rule, not per-path overrides."""
    current_rule = None
    global_headers = {}
    for line in path.read_text(encoding="utf-8").splitlines():
        if not line.strip() or line.lstrip().startswith("#"):
            continue
        if not line[0].isspace():
            current_rule = line.strip()
            continue
        if current_rule == "/*" and ":" in line:
            key, value = line.strip().split(":", 1)
            global_headers[key] = value.strip()
    if not global_headers:
        raise ValueError("The Cloudflare Pages global /* header rule is missing")
    return global_headers


def fetch_headers(url: str, timeout: int) -> dict[str, str]:
    if not url.startswith("https://"):
        raise ValueError("Only HTTPS response headers can be checked")
    request = urllib.request.Request(
        url, headers={"Cache-Control": "no-cache", "User-Agent": "POLY-PMNA-Security-Headers-Check/1.0"}
    )
    with urllib.request.urlopen(request, timeout=timeout) as response:
        if response.status != 200:
            raise RuntimeError(f"Unexpected HTTP {response.status}")
        return dict(response.headers.items())


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--headers-file", type=Path, help="Validate the deployment _headers artifact")
    parser.add_argument("--url", help="Verify actual security headers from a live HTTPS endpoint")
    parser.add_argument("--warn-only", action="store_true", help="Report failure without blocking deployments")
    parser.add_argument("--timeout", type=int, default=15)
    args = parser.parse_args()
    if not args.headers_file and not args.url:
        parser.error("--headers-file or --url is required")

    checks = []
    try:
        if args.headers_file:
            checks.append((f"artifact:{args.headers_file}", header_errors(read_headers_file(args.headers_file))))
        if args.url:
            checks.append((args.url, header_errors(fetch_headers(args.url, args.timeout))))
    except (OSError, ValueError, RuntimeError, urllib.error.URLError) as error:
        checks.append(("security headers", [str(error)]))

    failures = False
    for target, errors in checks:
        if errors:
            failures = True
            print(f"SEC-1 FAIL [{target}]: " + "; ".join(errors))
        else:
            print(f"SEC-1 PASS [{target}]: required browser security headers are present")

    if failures and args.warn_only:
        print("::warning::SEC-1: production host may lack CSP/HSTS. A Cloudflare Pages custom-domain cutover is required.")
    report = os.environ.get("GITHUB_STEP_SUMMARY", "")
    if report:
        with open(report, "a", encoding="utf-8") as summary:
            summary.write("### SEC-1 security header checks\n\n")
            for target, errors in checks:
                summary.write(f"- **{target}**: {'FAIL — ' + '; '.join(errors) if errors else 'PASS'}\n")
            summary.write("\n")

    return 1 if failures and not args.warn_only else 0


if __name__ == "__main__":
    sys.exit(main())
