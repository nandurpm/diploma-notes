# Purpose: Validate lesson fullscreen - Descriptive comment added for clarity
#!/usr/bin/env python3
"""Validate the no-header full-screen lesson standard for REV2021 and REV2026."""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REPORT = ROOT / "reports" / "lesson-fullscreen-validation.json"
LESSON_RUNTIME = "20260725-watermark1"


def read(path: Path) -> str:
    return path.read_text(encoding="utf-8", errors="ignore")


def main() -> int:
    rev21 = sorted((ROOT / "lessons").glob("lessons-*.html"))
    rev26 = sorted((ROOT / "revision-2026-content" / "lessons").glob("lessons-*.html"))
    lessons = rev21 + rev26
    js = read(ROOT / "assets/js/lesson-navigation-fix.js")
    css = read(ROOT / "assets/css/lesson-page-fix.css")

    failures: list[str] = []
    missing_runtime: list[str] = []
    stale_runtime: list[str] = []
    missing_viewport: list[str] = []
    missing_doctype: list[str] = []

    for path in lessons:
        source = read(path)
        rel = path.relative_to(ROOT).as_posix()
        if "lesson-navigation-fix.js" not in source:
            missing_runtime.append(rel)
        elif LESSON_RUNTIME not in source:
            stale_runtime.append(rel)
        if not re.search(r'<meta\b[^>]*name=["\']viewport["\']', source, flags=re.I):
            missing_viewport.append(rel)
        if not re.match(r"\s*<!doctype\s+html\b", source, flags=re.I):
            missing_doctype.append(rel)

    if len(rev21) != 91 or len(rev26) != 22:
        failures.append(f"lesson inventory mismatch: REV2021={len(rev21)}, REV2026={len(rev26)}")
    if missing_runtime:
        failures.append("missing shared runtime: " + ", ".join(missing_runtime))
    if stale_runtime:
        failures.append("stale shared runtime: " + ", ".join(stale_runtime))
    if missing_viewport:
        failures.append("missing viewport metadata: " + ", ".join(missing_viewport))
    if missing_doctype:
        failures.append("missing HTML doctype: " + ", ".join(missing_doctype))

    required_js = {
        "both revision routes": "revision-2026-content",
        "explicit APK detection": "PolytechnicStudyHubAndroid",
        "all-section expansion": "revealAllLessonSections",
        "dynamic module expansion": "expandDynamicModuleViews",
        "REV2026 clone guard": "if (!revision2026) await expandDynamicModuleViews();",
        "revision-specific lesson class": "revision-2026-lesson",
        "end-of-document print actions": "polyLessonEndActions",
        "current no-header runtime": LESSON_RUNTIME,
    }
    for label, token in required_js.items():
        if token not in js:
            failures.append(f"shared lesson JS missing {label}: {token}")
    if "stopImmediatePropagation" in js:
        failures.append("shared lesson JS must not intercept lesson-specific module handlers")

    required_css = {
        "public header suppression": "#site-header",
        "lesson header suppression": ".lesson-header",
        "topbar suppression": ".topbar",
        "chapter sidebar suppression": ".chapter-nav",
        "REV2026 sidebar suppression": "#chapterNav",
        "full-width max override": "max-width: none !important",
        "single-column lesson shell": "grid-template-columns:minmax(0,1fr)!important",
        "zero top scroll offset": "scroll-padding-top: 0 !important",
        "mobile safe area": "env(safe-area-inset-left)",
        "dynamic module list": ".poly-expanded-dynamic-list",
        "REV2026 source preservation": "html.revision-2026-lesson .poly-dynamic-source",
        "print support": "@media print",
    }
    for label, token in required_css.items():
        if token not in css:
            failures.append(f"shared lesson CSS missing {label}: {token}")

    payload = {
        "summary": {
            "passed": not failures,
            "lesson_files": len(lessons),
            "revision_2021": len(rev21),
            "revision_2026": len(rev26),
            "runtime": LESSON_RUNTIME,
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
