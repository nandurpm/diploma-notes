#!/usr/bin/env python3
"""Remove the plaintext support address from the Help discussion fallback script."""
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT / "assets/js/help-comments.js"
ADDRESS = "nandakumarmkdpm@gmail.com"
TOKEN = "5a343b343e3b312f373b2837313e2a371a3d373b333674393537"
OLD_DECLARATION = f'const EMAIL = "{ADDRESS}";'
NEW_DECLARATION = f'''const EMAIL_TOKEN = "{TOKEN}";
const decodeEmail = (encoded) => {{
  const key = Number.parseInt(encoded.slice(0, 2), 16);
  let value = "";
  for (let index = 2; index < encoded.length; index += 2) {{
    value += String.fromCharCode(Number.parseInt(encoded.slice(index, index + 2), 16) ^ key);
  }}
  return value;
}};'''
OLD_FALLBACK = 'email.href = `mailto:${EMAIL}?subject=Diploma%20Notes%20Help`;'
NEW_FALLBACK = 'email.href = `mailto:${decodeEmail(EMAIL_TOKEN)}?subject=POLY%20PMNA%20Help`;'


def main() -> int:
    source = TARGET.read_text(encoding="utf-8")
    original = source
    source = source.replace(OLD_DECLARATION, NEW_DECLARATION)
    source = source.replace(OLD_FALLBACK, NEW_FALLBACK)
    if ADDRESS in source:
        raise SystemExit("Plaintext support email remains in help-comments.js")
    if OLD_FALLBACK in source:
        raise SystemExit("Legacy Diploma Notes email fallback remains")
    if source != original:
        TARGET.write_text(source, encoding="utf-8")
        print("Protected Help discussion fallback email.")
    else:
        print("Help discussion fallback email already protected.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
