#!/usr/bin/env python3
"""Validate the static password-reset route's security invariants."""
from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RESET_PAGE = ROOT / "reset-password.html"
RESET_CLIENT = ROOT / "assets/js/reset-password.js"
AUTH_CLIENT = ROOT / "assets/js/quiz-auth.js"
HEADERS = ROOT / "_headers"


def main() -> int:
    issues: list[str] = []
    page = RESET_PAGE.read_text(encoding="utf-8")
    reset = RESET_CLIENT.read_text(encoding="utf-8")
    auth = AUTH_CLIENT.read_text(encoding="utf-8")
    headers = HEADERS.read_text(encoding="utf-8")

    if 'name="robots" content="noindex, nofollow"' not in page:
        issues.append("reset-password.html must remain noindex/nofollow")
    if "db.auth.getSession()" not in reset or "!sessionData?.session" not in reset:
        issues.append("reset page must require a valid recovery session before enabling the form")
    if "history.replaceState" not in reset:
        issues.append("reset page must remove recovery tokens/codes from the browser URL")
    if 'error?.message || "Password update failed' in reset:
        issues.append("reset page must not display raw backend password-update errors")
    if "genericMessage" not in auth or "resetPasswordForEmail" not in auth:
        issues.append("password reset must use the generic anti-enumeration response")
    if "throw new Error(genericMessage)" not in auth:
        issues.append("unexpected reset-service errors must use the generic response")

    marker = "/reset-password.html\n"
    if marker not in headers:
        issues.append("_headers must define a dedicated reset-password policy")
    else:
        policy = headers.split(marker, 1)[1].split("\n\n", 1)[0]
        if "Content-Security-Policy:" not in policy:
            issues.append("reset-password route is missing its CSP")
        if "style-src 'self' https://fonts.googleapis.com" not in policy:
            issues.append("reset-password CSP must avoid unsafe-inline styles")
        if "frame-ancestors 'none'" not in policy:
            issues.append("reset-password CSP must disallow framing")

    if issues:
        print("Password-reset security validation failed:")
        print("\n".join(f"- {issue}" for issue in issues))
        return 1
    print("Password-reset security validation passed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
