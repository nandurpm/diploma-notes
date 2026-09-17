#!/usr/bin/env python3
"""Fail closed when tracked project files contain likely credential material."""
from __future__ import annotations

import re
import subprocess
import sys
from pathlib import Path

HIGH_CONFIDENCE = [
    re.compile(r"AKIA[0-9A-Z]{16}"),
    re.compile(r"AIza[0-9A-Za-z_-]{20,}"),
    re.compile(r"gh[pousr]_[A-Za-z0-9_]{20,}"),
    re.compile(r"(?<![A-Za-z0-9])sk-(?:proj-)?[A-Za-z0-9]{20,}(?![A-Za-z0-9])"),
    re.compile(r"xox[baprs]-[A-Za-z0-9-]{20,}"),
    re.compile(r"-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----"),
]
PRIVILEGED_ASSIGNMENT = re.compile(
    r"(?:OPENAI|NVIDIA|OPENROUTER|GEMINI|GOOGLE_AI_STUDIO|FREE_API|"
    r"CLOUDFLARE_(?:API_TOKEN|AI_API_TOKEN)|SUPABASE_SERVICE_ROLE_KEY|"
    r"DATABASE_URL|JWT_SECRET|SMTP_PASSWORD)"
    r"\s*[:=]\s*([\"'])(?!\s*(?:\1|test(?:-key)?|example|placeholder|changeme|your[_-]))"
)
SECRET_FILES = re.compile(
    r"(?:^|/)(?:\.env(?:\..*)?|.*\.(?:pem|key|p12|pfx|jks|keystore)|"
    r".*credentials.*|.*service-account.*|id_rsa)$",
    re.IGNORECASE,
)


def tracked_files() -> list[Path]:
    result = subprocess.run(
        ["git", "ls-files", "-z"], check=True, capture_output=True, text=False
    )
    return [Path(item) for item in result.stdout.decode().split("\0") if item]


def main() -> int:
    findings: list[str] = []
    for path in tracked_files():
        if SECRET_FILES.search(path.as_posix()):
            findings.append(f"sensitive filename: {path}")
            continue
        try:
            text = path.read_text(encoding="utf-8")
        except (UnicodeDecodeError, OSError):
            continue
        for pattern in HIGH_CONFIDENCE:
            if pattern.search(text):
                findings.append(f"credential pattern {pattern.pattern!r}: {path}")
        for line_number, line in enumerate(text.splitlines(), 1):
            if PRIVILEGED_ASSIGNMENT.search(line):
                findings.append(f"privileged assignment at {path}:{line_number}")
    if findings:
        print("\n".join(sorted(set(findings))), file=sys.stderr)
        return 1
    print("No high-confidence secrets or non-placeholder privileged assignments found in tracked files.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
