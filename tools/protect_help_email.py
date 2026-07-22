# Purpose: Protect help email - Descriptive comment added for clarity
#!/usr/bin/env python3
"""Ensure the Help fallback does not contain a directly scrapeable address."""
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT / "assets/js/help-comments.js"
FORBIDDEN_ADDRESS = "nandakumarmkdpm" + "@" + "gmail" + ".com"
TOKEN = "5a343b343e3b312f373b2837313e2a371a3d373b333674393537"
LEGACY_DECLARATION = 'const EMAIL = "' + FORBIDDEN_ADDRESS + '";'
PROTECTED_DECLARATION = f'const EMAIL_TOKEN = "{TOKEN}";'
LEGACY_SUBJECT = "Diploma%20Notes%20Help"


def main() -> int:
    source = TARGET.read_text(encoding="utf-8")
    original = source
    source = source.replace(LEGACY_DECLARATION, PROTECTED_DECLARATION)
    source = source.replace(LEGACY_SUBJECT, "POLY%20PMNA%20Help")

    if FORBIDDEN_ADDRESS in source:
        raise SystemExit("Plaintext support email remains in help-comments.js")
    if LEGACY_SUBJECT in source:
        raise SystemExit("Legacy Help email branding remains")
    if "EMAIL_TOKEN" not in source or "decodeEmail" not in source:
        raise SystemExit("Protected email decoder is missing")

    if source != original:
        TARGET.write_text(source, encoding="utf-8")
        print("Protected Help discussion fallback email.")
    else:
        print("Help discussion fallback email already protected.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
