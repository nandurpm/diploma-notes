import json
import os
from datetime import datetime, timezone
from pathlib import Path
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "docs" / "pdf-archive-sync.json"
LOCAL_MANIFEST_DIR = ROOT / "docs" / "pdf-archive" / "manifests"
BASE = "https://raw.githubusercontent.com/nandurpm/poly-pmna-pdf-files/main"
MANIFEST_NAMES = (
    "notes-2021.json",
    "notes-2026.json",
    "notes-template.json",
    "sitttr-2015.json",
    "sitttr-2021.json",
    "sitttr-2026.json",
    "sitttr-general.json",
    "sitttr-index.json",
)


def load_manifest(name: str) -> dict:
    request = Request(f"{BASE}/manifests/{name}", headers={"User-Agent": "POLY-PMNA-archive-sync"})
    with urlopen(request, timeout=30) as response:
        return json.load(response)


def count_published(manifest: dict, key: str) -> int:
    return sum(1 for item in manifest.get(key, []) if item.get("status") == "published")


manifests = {name: load_manifest(name) for name in MANIFEST_NAMES}
notes_2021 = manifests["notes-2021.json"]
notes_2026 = manifests["notes-2026.json"]
LOCAL_MANIFEST_DIR.mkdir(parents=True, exist_ok=True)
for name, manifest in manifests.items():
    (LOCAL_MANIFEST_DIR / name).write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
payload = {
    "sourceRepository": "nandurpm/poly-pmna-pdf-files",
    "sourceBranch": "main",
    "sourceCommit": os.environ.get("PDF_ARCHIVE_SHA", "manual"),
    "updatedAt": datetime.now(timezone.utc).isoformat(),
    "changedFiles": [item for item in os.environ.get("PDF_CHANGED_FILES", "").splitlines() if item],
    "manifests": {
        "notes2021": f"{BASE}/manifests/notes-2021.json",
        "notes2026": f"{BASE}/manifests/notes-2026.json",
    },
    "localManifestDirectory": "docs/pdf-archive/manifests",
    "publishedCounts": {
        "notes2021": count_published(notes_2021, "subjects"),
        "notes2026": count_published(notes_2026, "subjects"),
    },
    "policy": "PDF files and manifests remain canonical in poly-pmna-pdf-files; consumers use the raw URLs above instead of copying binaries.",
}
OUTPUT.parent.mkdir(parents=True, exist_ok=True)
OUTPUT.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
print(f"Wrote {OUTPUT}")
