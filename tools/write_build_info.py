from __future__ import annotations

import json
import os
import subprocess
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

data = {
    "commit": commit,
    "builtAt": datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
    "branch": branch,
}

(ROOT / "build-info.json").write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")
