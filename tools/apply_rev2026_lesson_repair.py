#!/usr/bin/env python3
"""Repair REV2026 lesson rendering and official model-paper navigation."""
from __future__ import annotations

import argparse
import html
import json
import re
import subprocess
from pathlib import Path
from urllib.parse import quote

ROOT = Path(__file__).resolve().parents[1]
LESSON_RUNTIME = "20260718-fullscreen4"
REV2026_RUNTIME = "20260718-rev2026-repair4"
MODEL_RUNTIME = "20260718-model-paper-navigation3"
SITTTR = "https://sitttrkerala.ac.in/index.php"
COURSE_URL = SITTTR + "?r=site%2Fdiploma-modelqp-courses-show&course={}"

LESSON_SCRIPT_RE = re.compile(
    r'<script\b[^>]*src=["\']/assets/js/lesson-navigation-fix\.js\?v=[^"\']+["\'][^>]*>\s*</script>',
    re.I,
)
ARTICLE_RE = re.compile(
    r'<article\b(?=[^>]*\bclass="[^"]*\bsubject-card\b[^"]*")[^>]*>.*?</article>',
    re.I | re.S,
)
CODE_RE = re.compile(r'\bdata-subject-code="([^"]+)"', re.I)
QP_RE = re.compile(
    r'<a\b(?=[^>]*\bclass="[^"]*\baction\b[^"]*\bqp\b[^"]*")[^>]*>.*?</a>',
    re.I | re.S,
)


def write(path: Path, text: str, check: bool) -> bool:
    original = path.read_text(encoding="utf-8")
    if text == original:
        return False
    if check:
        raise RuntimeError(f"stale generated/source file: {path.relative_to(ROOT)}")
    path.write_text(text, encoding="utf-8")
    return True


def repair_lesson_runtime(check: bool) -> int:
    path = ROOT / "assets/js/lesson-navigation-fix.js"
    source = path.read_text(encoding="utf-8")
    updated = source.replace("20260717-fullscreen3", LESSON_RUNTIME)
    updated = updated.replace(
        'root.classList.add("poly-lesson-page", "lesson-all-content");\n    root.classList.toggle("polytechnic-native-app", nativeApp);',
        'root.classList.add("poly-lesson-page", "lesson-all-content");\n'
        '    root.classList.toggle("revision-2026-lesson", revision2026);\n'
        '    root.classList.toggle("revision-2021-lesson", !revision2026);\n'
        '    root.classList.toggle("polytechnic-native-app", nativeApp);',
    )
    updated = updated.replace(
        'body.classList.add("poly-lesson-page", "lesson-all-content");\n      body.classList.remove("portal-page", "has-fixed-site-header");',
        'body.classList.add("poly-lesson-page", "lesson-all-content");\n'
        '      body.classList.toggle("revision-2026-lesson", revision2026);\n'
        '      body.classList.toggle("revision-2021-lesson", !revision2026);\n'
        '      body.classList.remove("portal-page", "has-fixed-site-header");',
    )
    updated = updated.replace(
        'root.style.setProperty("--header-h", "0px");',
        'root.style.setProperty("--header-h", "0px");\n'
        '    root.style.setProperty("--topbar-h", "0px");\n'
        '    root.style.setProperty("--toolbar-h", "0px");\n'
        '    root.style.setProperty("--top", "0px");',
    )
    updated = updated.replace(
        'for (const candidate of [`module-${n + 1}`, `module-${n}`, `m${n + 1}`, `m${n}`, "modules"])',
        'for (const candidate of [`module-${n}`, `m${n}`, `module-${n + 1}`, `m${n + 1}`, "modules"])',
    )
    updated = updated.replace(
        "    await expandDynamicModuleViews();",
        "    if (!revision2026) await expandDynamicModuleViews();",
    )
    if LESSON_RUNTIME not in updated or "if (!revision2026) await expandDynamicModuleViews();" not in updated:
        raise RuntimeError("could not apply REV2026 lesson runtime guard")
    return int(write(path, updated, check))


def repair_lesson_css(check: bool) -> int:
    path = ROOT / "assets/css/lesson-page-fix.css"
    source = path.read_text(encoding="utf-8")
    marker = "REV2026 full-screen repair v4"
    block = f'''\n\n/* {marker}: preserve complete modules, remove duplicate sidebar, and eliminate top gaps. */
html.poly-lesson-page {{
  --fixed-site-header-height:0px!important;
  --fixed-site-header-gap:0px!important;
  --header-h:0px!important;
  --topbar-h:0px!important;
  --toolbar-h:0px!important;
  --top:0px!important;
}}
html.poly-lesson-page :is(.sidebar,#chapterNav,.lesson-sidebar,.chapter-sidebar,.side-nav,[data-lesson-sidebar]) {{
  display:none!important;visibility:hidden!important;width:0!important;height:0!important;
  min-width:0!important;max-width:0!important;margin:0!important;padding:0!important;
  border:0!important;overflow:hidden!important;
}}
html.poly-lesson-page :is(.shell,.lesson-shell,.page-shell,.main-content) {{
  width:100%!important;max-width:none!important;min-width:0!important;margin:0!important;
  padding-top:var(--lesson-edge)!important;grid-template-columns:minmax(0,1fr)!important;
}}
html.revision-2026-lesson .poly-dynamic-source {{display:block!important;visibility:visible!important;opacity:1!important}}
html.revision-2026-lesson .poly-expanded-dynamic-list {{display:none!important}}
'''
    if marker in source:
        updated = re.sub(
            rf"\n/\* {re.escape(marker)}:.*?html\.revision-2026-lesson \.poly-expanded-dynamic-list \{{display:none!important\}}\n?",
            block,
            source,
            flags=re.S,
        )
    else:
        updated = source.rstrip() + block
    return int(write(path, updated, check))


def repair_model_runtime(check: bool) -> int:
    path = ROOT / "assets/js/lesson-availability-hotfix.js"
    source = path.read_text(encoding="utf-8")
    updated = source.replace("20260717-model-paper-navigation2", MODEL_RUNTIME)
    old = '''  function bindReliableOfficialNavigation(link) {
    if (!link || link.dataset.officialNavigationBound === "true") return;
    link.dataset.officialNavigationBound = "true";
    link.addEventListener("click", event => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      location.assign(link.href);
    }, true);
  }'''
    new = '''  function bindReliableOfficialNavigation(link) {
    if (!link) return;
    link.dataset.officialNavigationBound = "native-anchor";
  }'''
    updated = updated.replace(old, new)
    if MODEL_RUNTIME not in updated or "event.preventDefault()" in updated:
        raise RuntimeError("could not remove model-paper click interception")
    return int(write(path, updated, check))


def repair_support_files(check: bool) -> int:
    changed = 0
    replacements = {
        ROOT / "tools/update_lesson_assistant.py": [
            ("20260717-fullscreen3", LESSON_RUNTIME),
        ],
        ROOT / "tools/validate_lesson_fullscreen.py": [
            ("20260717-fullscreen3", LESSON_RUNTIME),
        ],
        ROOT / ".github/workflows/update-lesson-assistant.yml": [
            ("20260717-fullscreen3", LESSON_RUNTIME),
        ],
        ROOT / "tools/build_revision_2026_pages.py": [
            ('VERSION = "20260717-fixed-header-restore1"', f'VERSION = "{REV2026_RUNTIME}"'),
            ("20260717-availability-stable1", MODEL_RUNTIME),
            (">Sample Question Paper</a>", ">Open Model Question Paper</a>"),
        ],
        ROOT / "tools/enhance_revision_2026_model_qp.py": [
            (">Model Question Paper</a>", ">Open Model Question Paper</a>"),
        ],
    }
    for path, pairs in replacements.items():
        source = path.read_text(encoding="utf-8")
        updated = source
        for old, new in pairs:
            updated = updated.replace(old, new)
        changed += int(write(path, updated, check))
    return changed


def repair_lesson_pages(check: bool) -> int:
    changed = 0
    tag = f'<script src="/assets/js/lesson-navigation-fix.js?v={LESSON_RUNTIME}" defer></script>'
    pages = sorted((ROOT / "lessons").glob("lessons-*.html")) + sorted(
        (ROOT / "revision-2026-content/lessons").glob("lessons-*.html")
    )
    for path in pages:
        source = path.read_text(encoding="utf-8")
        updated, count = LESSON_SCRIPT_RE.subn(tag, source)
        if count == 0:
            if "</body>" not in source:
                raise RuntimeError(f"lesson page has no body close: {path.relative_to(ROOT)}")
            updated = source.replace("</body>", f"\n{tag}</body>", 1)
        changed += int(write(path, updated, check))
    return changed


def model_link(code: str) -> str:
    normal = code.strip().upper()
    url = COURSE_URL.format(quote(normal, safe=""))
    return (
        f'<a class="action qp" href="{html.escape(url, quote=True)}" '
        'target="_blank" rel="noopener noreferrer external" '
        f'data-model-paper-course="{html.escape(normal, quote=True)}" data-scheme="REV2026">'
        'Open Model Question Paper</a>'
    )


def repair_article(match: re.Match[str]) -> str:
    article = match.group(0)
    code_match = CODE_RE.search(article)
    if not code_match:
        raise RuntimeError("REV2026 subject card without data-subject-code")
    replacement = model_link(code_match.group(1))
    used = False

    def replace(_: re.Match[str]) -> str:
        nonlocal used
        if used:
            return ""
        used = True
        return replacement

    updated, count = QP_RE.subn(replace, article)
    if count:
        return updated
    position = article.rfind("</div></article>")
    if position < 0:
        raise RuntimeError(f"action row missing for {code_match.group(1)}")
    return article[:position] + replacement + article[position:]


def revision_department_pages() -> list[Path]:
    registry_path = ROOT / "assets/data/revision-2026-programmes.json"
    registry = json.loads(registry_path.read_text(encoding="utf-8"))
    programmes = registry.get("programmes", [])
    if len(programmes) != 38:
        raise RuntimeError(f"expected 38 programme records, found {len(programmes)}")
    pages = [ROOT / "revision-2026" / f"{item['slug']}.html" for item in programmes]
    missing = [path.name for path in pages if not path.exists()]
    if missing:
        raise RuntimeError("missing REV2026 department pages: " + ", ".join(missing))
    return pages


def repair_revision_pages(check: bool) -> int:
    changed = 0
    pages = [ROOT / "revision-2026.html", *revision_department_pages()]
    for path in pages:
        source = path.read_text(encoding="utf-8")
        updated = re.sub(
            r"revision-2026-browser\.js\?v=[^\"']+",
            f"revision-2026-browser.js?v={REV2026_RUNTIME}",
            source,
        )
        updated = re.sub(
            r"lesson-availability-hotfix\.js\?v=[^\"']+",
            f"lesson-availability-hotfix.js?v={MODEL_RUNTIME}",
            updated,
        )
        updated, _ = ARTICLE_RE.subn(repair_article, updated)
        updated = updated.replace(
            "Official Revision 2026 sample question papers:",
            "Official Revision 2026 model question papers:",
        )
        changed += int(write(path, updated, check))
    return changed


def validate() -> None:
    rev26_lessons = sorted((ROOT / "revision-2026-content/lessons").glob("lessons-*.html"))
    if len(rev26_lessons) != 10:
        raise RuntimeError(f"expected 10 existing REV2026 lessons, found {len(rev26_lessons)}")
    for path in rev26_lessons:
        text = path.read_text(encoding="utf-8", errors="ignore")
        if LESSON_RUNTIME not in text or len(text) < 15_000 or "</html>" not in text.lower():
            raise RuntimeError(f"incomplete/stale REV2026 lesson: {path.name}")

    pages = revision_department_pages()
    total_cards = 0
    for path in pages:
        text = path.read_text(encoding="utf-8")
        if f"lesson-availability-hotfix.js?v={MODEL_RUNTIME}" not in text:
            raise RuntimeError(f"stale model runtime: {path.name}")
        cards = ARTICLE_RE.findall(text)
        if not cards:
            raise RuntimeError(f"no subject cards: {path.name}")
        total_cards += len(cards)
        for card in cards:
            code = CODE_RE.search(card).group(1).strip().upper()
            links = QP_RE.findall(card)
            if len(links) != 1 or f"course={code}" not in links[0] or "Open Model Question Paper" not in links[0]:
                raise RuntimeError(f"broken model-paper action {code} in {path.name}")
    if total_cards < 100:
        raise RuntimeError(f"unexpectedly low REV2026 subject-card count: {total_cards}")

    js = (ROOT / "assets/js/lesson-navigation-fix.js").read_text(encoding="utf-8")
    if "if (!revision2026) await expandDynamicModuleViews();" not in js:
        raise RuntimeError("REV2026 module cloning guard is missing")
    model_js = (ROOT / "assets/js/lesson-availability-hotfix.js").read_text(encoding="utf-8")
    if "event.preventDefault()" in model_js:
        raise RuntimeError("model-paper links are still click-intercepted")

    subprocess.run(["node", "--check", "assets/js/lesson-navigation-fix.js"], cwd=ROOT, check=True)
    subprocess.run(["node", "--check", "assets/js/lesson-availability-hotfix.js"], cwd=ROOT, check=True)
    print(f"Validated 10 REV2026 lessons and {total_cards} direct model-paper actions.")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true", help="Validate without modifying files")
    args = parser.parse_args()

    changed = 0
    changed += repair_lesson_runtime(args.check)
    changed += repair_lesson_css(args.check)
    changed += repair_model_runtime(args.check)
    changed += repair_support_files(args.check)
    changed += repair_lesson_pages(args.check)
    changed += repair_revision_pages(args.check)
    validate()
    print(("Verified" if args.check else f"Updated {changed} files; verified") + " REV2026 repair.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
