#!/usr/bin/env python3
"""Validate high-risk POLY PMNA site structure and regression rules."""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REPORT = ROOT / "reports" / "site-structure-validation.json"


def read(path: str) -> str:
    file_path = ROOT / path
    if not file_path.exists():
        raise FileNotFoundError(path)
    return file_path.read_text(encoding="utf-8", errors="ignore")


def count(pattern: str, text: str) -> int:
    return len(re.findall(pattern, text, flags=re.I))


def programme_card_count(text: str) -> int:
    """Count actual programme-card anchor elements, not JavaScript selector strings."""
    return count(r"<a\b[^>]*\bdata-programme-card\b[^>]*>", text)


def main() -> int:
    checks: list[dict[str, object]] = []

    def check(name: str, passed: bool, detail: str) -> None:
        checks.append({"name": name, "passed": bool(passed), "detail": detail})

    index = read("index.html")
    about = read("about.html")
    shell = read("assets/js/site-shell.js")
    main_js = read("assets/js/main.js")
    fixed = read("assets/js/fixed-site-header.js")
    consistency = read("assets/js/site-consistency-fix.js")
    ask = read("ask-poly.html")
    ask_loader = read("assets/js/ask-poly-knowledge-loader.js")
    tools_html = read("tools.html")
    tools_js = read("assets/js/tools-stable-rebuild.js")
    quiz_auth = read("assets/js/quiz-auth.js")
    rev21 = read("revision-2021.html")
    rev26 = read("revision-2026.html")
    lesson_js = read("assets/js/lesson-navigation-fix.js")
    lesson_css = read("assets/css/lesson-page-fix.css")
    android_activity = read("android-app/app/src/main/java/org/diplomanotes/polytechnicstudyhub/MainActivity.java")

    check("homepage has no floating Ask POLY duplicate", "home-ask-poly-float" not in index, "Floating Ask POLY markup/style must be absent.")
    check("homepage revision cards are not repeated", count(r'class="choice-card[^>]*"[^>]+href="/?revision-202[16]\.html"', index) == 0, "Revision destinations belong in the hero, not repeated feature cards.")
    check("about identifies current curriculum correctly", "Use Revision 2021 for current syllabus preparation" not in about and "Revision 2026 is the current curriculum" in about, "Revision 2026 must be described as current; Revision 2021 as legacy.")
    check("shared shell uses canonical home route", 'href="/"' in shell and 'href="/index.html"' not in shell, "Header logo and Home must use '/'.")
    header_labels = ["Home", "About", "Revision 2026", "Revision 2021", "Mock Exams", "Ask POLY AI", "2015 Materials", "Tools", "Help"]
    header_positions = [shell.find(f'label: "{label}"') for label in header_labels]
    check("shared shell keeps the full direct header menu", all(position >= 0 for position in header_positions) and header_positions == sorted(header_positions) and "nav-group" not in shell, "The fixed header must keep the nine direct menu choices shown on the public website.")
    check("main does not rewrite metadata", "normalizeMetadata" not in main_js and "og:description" not in main_js, "Metadata belongs in source HTML.")
    check("main does not load consistency patch", "site-consistency-fix" not in main_js, "No circular repair-script loading.")
    check("fixed header has explicit native-app detection", "isAndroidWebView" not in fixed and "PolyPmnaAndroid" in fixed, "Normal Android WebViews must not be treated as the POLY PMNA app.")
    check("fixed header does not inject unrelated scripts", "loadScriptOnce" not in fixed and "visitor-popup" not in fixed and "onam-render" not in fixed, "Fixed header script must only manage header state and measurement.")
    check("consistency patch has no delayed rewrites", "setTimeout" not in consistency and "document.head.append" not in consistency, "Deprecated compatibility file must remain a no-op.")
    check("Ask POLY H1 is accessible", 'class="ask-hero" aria-hidden="true"' not in ask, "The hero containing the H1 must not be hidden from assistive technology.")
    check("Ask POLY has a failed-index status", "Website index unavailable; AI-only mode" in ask_loader, "Knowledge loading must not remain indefinitely in a loading state.")
    check("quiz auth contains no fake restart claim", "I restarted the Supabase project" not in quiz_auth, "Browser code must not claim an administrator action occurred.")
    check("tools use one calculator implementation", "tools-expression-hotfix.js" not in tools_html, "The duplicate calculator override must not be loaded.")
    check("generic converter excludes RPM", "speed:{" not in tools_js and "rpm:1" not in tools_js, "RPM is angular speed and cannot be directly converted to linear speed.")
    check("RPM calculator requires diameter", "Diameter mm" in tools_js and "Math.PI*diameterM*rpm/60" in tools_js, "Linear speed must use v = pi*D*N/60.")
    check("scientific parser validates function tokens", "Unsupported function:" in tools_js and "evaluateExpression" in tools_js, "Scientific expressions must use one validated parser.")

    rev21_count = programme_card_count(rev21)
    rev26_count = programme_card_count(rev26)
    check("Revision 2021 has 43 direct programme cards", rev21_count == 43, f"Found {rev21_count} cards; expected 43.")
    check("Revision 2021 directory avoids query routes", "department-view.html?dept=" not in rev21, "Programme cards must link directly to stable static pages.")
    check("Revision 2026 retains 38 programme cards", rev26_count == 38, f"Found {rev26_count} cards; expected 38.")

    rev21_lessons = sorted((ROOT / "lessons").glob("lessons-*.html"))
    rev26_lessons = sorted((ROOT / "revision-2026-content" / "lessons").glob("lessons-*.html"))
    lesson_files = rev21_lessons + rev26_lessons
    missing_doctype: list[str] = []
    missing_viewport: list[str] = []
    missing_shell: list[str] = []
    for path in lesson_files:
        source = path.read_text(encoding="utf-8", errors="ignore")
        relative = path.relative_to(ROOT).as_posix()
        if not re.match(r"\s*<!doctype\s+html\b", source, flags=re.I):
            missing_doctype.append(relative)
        if not re.search(r'<meta\b[^>]*\bname=["\']viewport["\']', source, flags=re.I):
            missing_viewport.append(relative)
        if "lesson-navigation-fix.js" not in source:
            missing_shell.append(relative)

    lesson_count_detail = f"Found {len(rev21_lessons)} REV2021 and {len(rev26_lessons)} REV2026 lesson files."
    check("all 102 lesson files are in the validation set", len(rev21_lessons) == 91 and len(rev26_lessons) == 11, lesson_count_detail)
    check("all lesson files have an HTML doctype", not missing_doctype, "Missing: " + (", ".join(missing_doctype) if missing_doctype else "none"))
    check("all lesson files have responsive viewport metadata", not missing_viewport, "Missing: " + (", ".join(missing_viewport) if missing_viewport else "none"))
    check("all lesson files load the shared responsive shell", not missing_shell, "Missing: " + (", ".join(missing_shell) if missing_shell else "none"))

    lesson_sources = "\n".join(path.read_text(encoding="utf-8", errors="ignore") for path in lesson_files)
    rev26_sources = "\n".join(path.read_text(encoding="utf-8", errors="ignore") for path in rev26_lessons)
    check("REV2026 lessons are standalone HTML", "DecompressionStream" not in rev26_sources and "Loading Course" not in rev26_sources, "Compressed browser-only lesson wrappers must not return.")
    check("lesson files do not load the public site header", "fixed-site-header.js" not in lesson_sources, "Lesson pages use only their compact internal course navigation.")
    check("lesson shell recognizes both revision route families", "revision-2026-content" in lesson_js and "lessonPath" in lesson_js and "lessons-" in lesson_js, "REV2021 and REV2026 routes must share one shell.")
    check("lesson shell uses explicit APK detection", "PolytechnicStudyHubAndroid" in lesson_js and "PolyPmnaAndroid" in lesson_js, "Only the official APK user agents may enable native-app mode.")
    check("lesson CSS removes width limits", "max-width: none !important" in lesson_css and ".polytechnic-native-app" in lesson_css, "Lessons must fill desktop, mobile and APK viewports.")
    check("Android WebView removes duplicate lesson chrome", "revision-2026-content" in android_activity and "poly-lesson-page" in android_activity and "lesson-header" in android_activity, "The APK must keep only its native app bar around lessons.")

    core_pages = ["index.html", "about.html", "revision-2021.html", "revision-2026.html", "daily-quiz.html", "ask-poly.html", "materials-2015.html", "tools.html", "contact.html"]
    stale_home_links = []
    for path in core_pages:
        source = read(path)
        if 'href="/index.html"' in source or 'href="../index.html"' in source:
            stale_home_links.append(path)
    check("mandatory pages use canonical home links", not stale_home_links, "Stale pages: " + (", ".join(stale_home_links) if stale_home_links else "none"))

    failures = [item for item in checks if not item["passed"]]
    payload = {
        "summary": {"passed": len(checks) - len(failures), "failed": len(failures), "total": len(checks)},
        "checks": checks,
    }
    REPORT.parent.mkdir(parents=True, exist_ok=True)
    REPORT.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(payload["summary"], indent=2))
    for failure in failures:
        print(f"FAIL: {failure['name']} — {failure['detail']}", file=sys.stderr)
    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
