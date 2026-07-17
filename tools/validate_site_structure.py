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

    check("homepage has no floating Ask POLY duplicate", "home-ask-poly-float" not in index, "Floating Ask POLY markup/style must be absent.")
    check("homepage revision cards are not repeated", count(r'class="choice-card[^>]*"[^>]+href="/?revision-202[16]\.html"', index) == 0, "Revision destinations belong in the hero, not repeated feature cards.")
    check("about identifies current curriculum correctly", "Use Revision 2021 for current syllabus preparation" not in about and "Revision 2026 is the current curriculum" in about, "Revision 2026 must be described as current; Revision 2021 as legacy.")
    check("shared shell uses canonical home route", 'href="/"' in shell and 'href="/index.html"' not in shell, "Header logo and Home must use '/'.")
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
    check("Revision 2021 has 43 direct programme cards", count(r"data-programme-card", rev21) == 43, f"Found {count(r'data-programme-card', rev21)} cards; expected 43.")
    check("Revision 2021 directory avoids query routes", "department-view.html?dept=" not in rev21, "Programme cards must link directly to stable static pages.")
    check("Revision 2026 retains 38 programme cards", count(r"data-programme-card", rev26) == 38, f"Found {count(r'data-programme-card', rev26)} cards; expected 38.")

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
