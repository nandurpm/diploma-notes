# Purpose: Write build info - Descriptive comment added for clarity
from __future__ import annotations

import json
import os
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def git_value(*args: str) -> str:
    try:
        return subprocess.check_output(["git", *args], cwd=ROOT, text=True).strip()
    except Exception:
        return ""


commit = (
    os.getenv("CF_PAGES_COMMIT_SHA")
    or os.getenv("GITHUB_SHA")
    or git_value("rev-parse", "HEAD")
)
branch = (
    os.getenv("CF_PAGES_BRANCH")
    or os.getenv("GITHUB_REF_NAME")
    or git_value("branch", "--show-current")
    or "main"
)

built_at = datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")
data = {
    "commit": commit,
    "builtAt": built_at,
    "branch": branch,
    "buildId": (commit[:12] if commit else built_at.replace(":", "").replace("-", "")),
}

# Write atomically and validate the payload before replacing the file.
# A previous appending writer concatenated two build objects without a
# separator and corrupted build-info.json on disk (failed JSON.parse and
# broke version/caching consumers). Always overwrite — never append.
serialized = json.dumps(data, indent=2) + "\n"
json.loads(serialized)
tmp = ROOT / "build-info.json.tmp"
tmp.write_text(serialized, encoding="utf-8")
tmp.replace(ROOT / "build-info.json")

# Deployment environments set CI=true. Local audit runs do not rewrite source
# unless POLY_INJECT_BUILD_ID=1 is supplied explicitly.
if os.getenv("CI", "").lower() == "true" or os.getenv("POLY_INJECT_BUILD_ID") == "1":
    subprocess.check_call(
        [sys.executable, str(ROOT / "tools/inject_build_id.py"), data["buildId"], "--root", str(ROOT)],
        cwd=ROOT,
    )
