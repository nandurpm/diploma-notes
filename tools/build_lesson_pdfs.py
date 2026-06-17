from __future__ import annotations

import json
import re
from pathlib import Path

from playwright.sync_api import sync_playwright
from pypdf import PdfReader

ROOT = Path.cwd()
LESSONS = ROOT / "lessons"
NOTES = ROOT / "notes"
REPORTS = ROOT / "reports"
EXCLUDED_CODES = {"1003", "1004"}

PANEL_SELECTORS = [
    ".panel",
    ".tab-panel",
    ".tab-content",
    ".module-panel",
    ".lesson-panel",
    ".content-panel",
    ".content-section",
    ".section-panel",
    "[role='tabpanel']",
]

PRINT_CSS = r"""
@page { size: A4; margin: 0 !important; }
@media print {
  html, body {
    width: 100% !important;
    max-width: none !important;
    height: auto !important;
    min-height: 0 !important;
    margin: 0 !important;
    padding: 0 !important;
    overflow: visible !important;
    background: #fff !important;
  }
  body::before, body::after { display: none !important; }
  header, nav, .topbar, .bar, .lesson-nav, .reading-progress,
  .revision-back-button, #toTop, .download-pdf-btn, .pdf-button,
  .search-tools, button {
    display: none !important;
  }
  main, .wrap, .shell, .page-shell, .content, .container {
    display: block !important;
    width: 100% !important;
    max-width: none !important;
    height: auto !important;
    margin: 0 !important;
    padding: 0 !important;
    overflow: visible !important;
  }
  [hidden], [aria-hidden="true"], .panel, .tab-panel, .tab-content,
  .module-panel, .lesson-panel, .content-panel, .content-section,
  .section-panel, [role="tabpanel"] {
    display: block !important;
    visibility: visible !important;
    opacity: 1 !important;
    height: auto !important;
    max-height: none !important;
    overflow: visible !important;
    transform: none !important;
    position: static !important;
  }
  .hero, .hero-inner, .lesson-layout, .grid, .grid-2, .grid-3,
  .grid-4, .formula-grid, .meta-grid, .two, .quick-grid, .toc {
    display: block !important;
    width: 100% !important;
    max-width: none !important;
    height: auto !important;
    position: static !important;
    inset: auto !important;
    overflow: visible !important;
  }
  .hero > *, .hero-inner > *, .lesson-layout > *, .grid > *,
  .grid-2 > *, .grid-3 > *, .grid-4 > *, .formula-grid > *,
  .meta-grid > *, .two > *, .quick-grid > * {
    width: 100% !important;
    max-width: none !important;
    margin: 0 0 4mm !important;
  }
  section, article, .sec, .card, .c, .worked, .case-card,
  .question-paper, .module-banner, .hero {
    break-inside: auto !important;
    page-break-inside: auto !important;
    break-before: auto !important;
    page-break-before: auto !important;
    break-after: auto !important;
    page-break-after: auto !important;
  }
  h1, h2, h3, h4, h5, h6, figure, table, pre, blockquote,
  .diagram, .formula, .formula-card, .info-box, .callout, .q,
  details, summary {
    break-inside: avoid !important;
    page-break-inside: avoid !important;
  }
  .toc, aside { position: static !important; top: auto !important; }
  img, svg, canvas {
    max-width: 100% !important;
    height: auto !important;
    break-inside: avoid !important;
    page-break-inside: avoid !important;
  }
  table {
    width: 100% !important;
    min-width: 0 !important;
    max-width: 100% !important;
    table-layout: auto !important;
  }
  .table-wrap, .tbl {
    overflow: visible !important;
    max-width: 100% !important;
  }
  details > * { display: block !important; }
  * { animation: none !important; transition: none !important; }
}
"""

PREPARE_JS = r"""
() => {
  document.documentElement.classList.add('pdf-export-mode');
  document.body?.classList.add('pdf-export-mode');

  document.querySelectorAll('details').forEach((item) => {
    item.open = true;
  });

  document.querySelectorAll('[hidden]').forEach((item) => {
    item.hidden = false;
    item.removeAttribute('hidden');
  });

  document.querySelectorAll('[aria-hidden="true"]').forEach((item) => {
    item.setAttribute('aria-hidden', 'false');
  });

  document.querySelectorAll('[inert]').forEach((item) => {
    item.removeAttribute('inert');
  });

  const selectors = [
    '.panel', '.tab-panel', '.tab-content', '.module-panel',
    '.lesson-panel', '.content-panel', '.content-section',
    '.section-panel', '[role="tabpanel"]'
  ].join(',');

  document.querySelectorAll(selectors).forEach((item) => {
    item.hidden = false;
    item.removeAttribute('hidden');
    item.setAttribute('aria-hidden', 'false');
    item.style.setProperty('display', 'block', 'important');
    item.style.setProperty('visibility', 'visible', 'important');
    item.style.setProperty('opacity', '1', 'important');
    item.style.setProperty('height', 'auto', 'important');
    item.style.setProperty('max-height', 'none', 'important');
    item.style.setProperty('overflow', 'visible', 'important');
    item.style.setProperty('transform', 'none', 'important');
  });

  document.querySelectorAll('main [style*="display: none"], main [style*="display:none"]').forEach((item) => {
    if (!['SCRIPT', 'STYLE', 'TEMPLATE', 'NOSCRIPT'].includes(item.tagName)) {
      item.style.setProperty('display', 'block', 'important');
    }
  });

  window.scrollTo(0, 0);
}
"""


def lesson_files() -> list[tuple[str, Path]]:
    items: list[tuple[str, Path]] = []
    for path in sorted(LESSONS.glob("lessons-*.html")):
        match = re.fullmatch(r"lessons-(\d+[A-Za-z]?)\.html", path.name)
        if not match:
            continue
        code = match.group(1)
        if code in EXCLUDED_CODES:
            continue
        items.append((code, path))
    return items


def normalize_text(value: str) -> str:
    return re.sub(r"\s+", " ", value or "").strip()


def clean_pdf_page_text(value: str, code: str) -> str:
    text = value or ""
    text = re.sub(rf"\bCourse\s+{re.escape(code)}\b", " ", text, flags=re.I)
    text = re.sub(r"\bPolytechnic Study Hub\b", " ", text, flags=re.I)
    text = re.sub(r"\bpolypmna\.dpdns\.org\b", " ", text, flags=re.I)
    text = re.sub(r"\bPage\s+\d+\s+of\s+\d+\b", " ", text, flags=re.I)
    return normalize_text(text)


def render_all() -> list[dict[str, object]]:
    NOTES.mkdir(exist_ok=True)
    REPORTS.mkdir(exist_ok=True)
    results: list[dict[str, object]] = []

    with sync_playwright() as playwright:
        browser = playwright.chromium.launch()

        for code, lesson in lesson_files():
            output = NOTES / f"downloadable-notes-{code}.pdf"
            relative_url = lesson.relative_to(ROOT).as_posix()
            url = f"http://127.0.0.1:8000/{relative_url}"
            print(f"Rendering Course {code} from {url}")

            page = browser.new_page(viewport={"width": 1440, "height": 1800})
            try:
                page.goto(url, wait_until="networkidle", timeout=120000)

                if page.locator(".fragment-slot").count():
                    page.wait_for_function(
                        "document.querySelectorAll('.fragment-slot').length === 0",
                        timeout=120000,
                    )

                page.wait_for_function(
                    "document.fonts ? document.fonts.status === 'loaded' : true",
                    timeout=60000,
                )
                page.wait_for_function(
                    "Array.from(document.images).every((img) => img.complete)",
                    timeout=60000,
                )

                page.evaluate(PREPARE_JS)
                page.add_style_tag(content=PRINT_CSS)
                page.wait_for_timeout(750)

                panel_count = page.locator(",".join(PANEL_SELECTORS)).count()
                visible_panel_count = page.evaluate(
                    """
                    () => {
                      const selectors = [
                        '.panel', '.tab-panel', '.tab-content', '.module-panel',
                        '.lesson-panel', '.content-panel', '.content-section',
                        '.section-panel', '[role="tabpanel"]'
                      ].join(',');
                      return [...document.querySelectorAll(selectors)]
                        .filter((item) => getComputedStyle(item).display !== 'none')
                        .length;
                    }
                    """
                )
                if panel_count and visible_panel_count != panel_count:
                    raise SystemExit(
                        f"Course {code}: only {visible_panel_count}/{panel_count} lesson panels are visible"
                    )

                source_text = page.locator("main").inner_text() if page.locator("main").count() else page.locator("body").inner_text()
                source_text = normalize_text(source_text)
                if len(source_text) < 2500:
                    raise SystemExit(
                        f"Course {code}: prepared lesson text is unexpectedly short ({len(source_text)} characters)"
                    )

                page.emulate_media(media="print")
                page.pdf(
                    path=str(output),
                    format="A4",
                    print_background=True,
                    prefer_css_page_size=False,
                    margin={"top": "11mm", "right": "9mm", "bottom": "13mm", "left": "9mm"},
                    display_header_footer=True,
                    header_template=(
                        f'<div style="font-size:8px;color:#64748b;width:100%;padding:0 9mm;'
                        f'font-family:Arial,sans-serif">Course {code}</div>'
                    ),
                    footer_template=(
                        '<div style="font-size:8px;color:#64748b;width:100%;padding:0 9mm;'
                        'font-family:Arial,sans-serif;display:flex;justify-content:space-between">'
                        '<span>Polytechnic Study Hub</span>'
                        '<span>polypmna.dpdns.org</span>'
                        '<span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>'
                        '</div>'
                    ),
                )
            finally:
                page.close()

            reader = PdfReader(str(output))
            page_texts = [clean_pdf_page_text(page.extract_text() or "", code) for page in reader.pages]
            blank_pages = [index + 1 for index, text in enumerate(page_texts) if len(text) < 25]
            near_blank_pages = [index + 1 for index, text in enumerate(page_texts) if len(text) < 80]
            pdf_text = normalize_text(" ".join(page_texts))
            coverage = len(pdf_text) / max(1, len(source_text))

            if output.stat().st_size < 20000 or not reader.pages:
                raise SystemExit(f"Course {code}: generated PDF is invalid")
            if blank_pages:
                raise SystemExit(f"Course {code}: blank PDF pages detected: {blank_pages}")
            if coverage < 0.45:
                raise SystemExit(
                    f"Course {code}: PDF text coverage is too low ({coverage:.1%}); hidden content may be missing"
                )

            results.append(
                {
                    "code": code,
                    "pages": len(reader.pages),
                    "bytes": output.stat().st_size,
                    "source": relative_url,
                    "sourceCharacters": len(source_text),
                    "pdfCharacters": len(pdf_text),
                    "textCoverage": round(coverage, 4),
                    "panelCount": panel_count,
                    "visiblePanelCount": visible_panel_count,
                    "blankPages": blank_pages,
                    "nearBlankPages": near_blank_pages,
                }
            )

        browser.close()

    return results


def main() -> None:
    generated = render_all()
    report = {
        "generated": generated,
        "preservedSeparateNotes": sorted(EXCLUDED_CODES),
        "renderer": "Playwright Chromium through local HTTP server",
        "validation": {
            "allKnownPanelsForcedVisible": True,
            "largeContainersAllowedToSplit": True,
            "blankPagesRejected": True,
            "minimumTextCoverage": 0.45,
        },
    }
    (REPORTS / "lesson-notes-pdf-build.json").write_text(
        json.dumps(report, indent=2) + "\n",
        encoding="utf-8",
    )


if __name__ == "__main__":
    main()
