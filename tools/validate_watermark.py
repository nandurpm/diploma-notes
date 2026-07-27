#!/usr/bin/env python3
"""Validate watermark inclusion in REV2021 and REV2026 lessons."""
from __future__ import annotations
import json
import re
import sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
REPORT = ROOT / "reports" / "watermark-validation.json"

def read(path: Path) -> str:
    return path.read_text(encoding="utf-8", errors="ignore")

def main() -> int:
    rev21 = sorted((ROOT / "lessons").glob("lessons-*.html"))
    rev26 = sorted((ROOT / "revision-2026-content" / "lessons").glob("lessons-*.html"))
    lessons = rev21 + rev26
    
    js = read(ROOT / "assets/js/lesson-navigation-fix.js")
    css = read(ROOT / "assets/css/lesson-watermark.css")
    
    failures: list[str] = []
    missing_runtime: list[str] = []
    
    for path in lessons:
        source = read(path)
        rel = path.relative_to(ROOT).as_posix()
        if "lesson-navigation-fix.js" not in source:
            missing_runtime.append(rel)
            
    if missing_runtime:
        failures.append("missing shared runtime (watermark will not appear): " + ", ".join(missing_runtime))
        
    required_js = {
        "watermark injection logic": "installWatermark",
        "watermark CSS link": "lesson-watermark.css",
        "watermark marker": "data-poly-watermark"
    }
    
    for label, token in required_js.items():
        if token not in js:
            failures.append(f"shared lesson JS missing {label}: {token}")
            
    required_css = {
        "watermark class": ".poly-watermark",
        "watermark image": "poly-pmna-watermark-sm.png"
    }
    
    for label, token in required_css.items():
        if token not in css:
            failures.append(f"shared watermark CSS missing {label}: {token}")
            
    payload = {
        "summary": {
            "passed": not failures,
            "lesson_files": len(lessons),
            "revision_2021": len(rev21),
            "revision_2026": len(rev26),
            "failure_count": len(failures),
        },
        "failures": failures,
    }
    
    REPORT.parent.mkdir(parents=True, exist_ok=True)
    REPORT.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(payload["summary"], indent=2))
    for failure in failures:
        print("FAIL:", failure, file=sys.stderr)
    return 1 if failures else 0

if __name__ == "__main__":
    raise SystemExit(main())
