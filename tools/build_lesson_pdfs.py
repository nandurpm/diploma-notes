# Purpose: Build lesson pdfs - Descriptive comment added for clarity
from __future__ import annotations

import json
import re
from pathlib import Path

from playwright.sync_api import TimeoutError as PlaywrightTimeoutError
from playwright.sync_api import sync_playwright
from pypdf import PdfReader, PdfWriter

ROOT = Path.cwd()
LESSONS = ROOT / "lessons"
NOTES = ROOT / "notes"
REPORTS = ROOT / "reports"
MIN_VALID_PDF_BYTES = 20000
PRESERVE_EXISTING_PDF_CODES = {"1003", "1004"}

PANEL_SELECTORS = [
    ".panel",
    ".tab-panel",
    ".tab-content",
    ".module-panel",
    ".lesson-panel",
    ".content-panel",
    ".content-section",
    ".section-panel",
    ".view-section",
    ".hb-section",
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
  .revision-back-button, #toTop, #hbToTop, .download-pdf-btn, .pdf-button,
  .search-tools, button, #polySiteAssistant {
    display: none !important;
  }
  main, .wrap, .shell, .page-shell, .hb-shell, .hb-layout, .hb-main,
  .content, .container {
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
  .section-panel, .view-section, .hb-section, [role="tabpanel"] {
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
  .grid-4, .formula-grid, .meta-grid, .two, .quick-grid, .toc,
  .hb-hero, .hb-grid, .hb-two, .hb-three, .app-grid {
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
  .meta-grid > *, .two > *, .quick-grid > *, .hb-grid > *, .hb-two > *,
  .hb-three > *, .app-grid > * {
    width: 100% !important;
    max-width: none !important;
    margin: 0 0 4mm !important;
    break-inside: auto !important;
    page-break-inside: auto !important;
  }
  section, article, .sec, .card, .c, .worked, .case-card,
  .question-paper, .module-banner, .hb-chapter-head, .hero, .hb-hero,
  .experiment, .solution, .program-card, .paper, .hb-card {
    break-inside: auto !important;
    page-break-inside: auto !important;
    break-before: auto !important;
    page-break-before: auto !important;
    break-after: auto !important;
    page-break-after: auto !important;
  }
  h1, h2, h3, h4, h5, h6, figure, table, pre, blockquote,
  .diagram, .hb-diagram, .formula, .hb-formula, .formula-card, .info-box,
  .callout, .hb-callout, .q, details, summary {
    break-inside: avoid !important;
    page-break-inside: avoid !important;
  }
  .toc, aside, .hb-left, .hb-right, .left-rail, .right-rail {
    position: static !important;
    top: auto !important;
    max-height: none !important;
    overflow: visible !important;
  }
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
  .table-wrap, .tbl, .hb-table-wrap {
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

  document.querySelectorAll('details').forEach((item) => { item.open = true; });
  document.querySelectorAll('[hidden]').forEach((item) => { item.hidden = false; item.removeAttribute('hidden'); });
  document.querySelectorAll('[aria-hidden="true"]').forEach((item) => { item.setAttribute('aria-hidden', 'false'); });
  document.querySelectorAll('[inert]').forEach((item) => { item.removeAttribute('inert'); });

  const selectors = [
    '.panel', '.tab-panel', '.tab-content', '.module-panel',
    '.lesson-panel', '.content-panel', '.content-section',
    '.section-panel', '.view-section', '.hb-section', '[role="tabpanel"]'
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
    item.style.setProperty('position', 'static', 'important');
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
        if match:
            items.append((match.group(1), path))
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


def page_has_raster_image(page: object) -> bool:
    try:
        resources = page.get("/Resources")
        if not resources:
            return False
        resources = resources.get_object()
        xobjects = resources.get("/XObject")
        if not xobjects:
            return False
        xobjects = xobjects.get_object()
        for reference in xobjects.values():
            item = reference.get_object()
            if item.get("/Subtype") == "/Image":
                return True
    except Exception:
        return True
    return False


def remove_genuinely_blank_pages(output: Path, code: str) -> list[int]:
    reader = PdfReader(str(output))
    removed: list[int] = []
    writer = PdfWriter()
    for index, page in enumerate(reader.pages, start=1):
        text = clean_pdf_page_text(page.extract_text() or "", code)
        genuinely_blank = len(text) < 10 and not page_has_raster_image(page)
        if genuinely_blank:
            removed.append(index)
            continue
        writer.add_page(page)
    if removed and writer.pages:
        temporary = output.with_suffix(".cleaned.pdf")
        with temporary.open("wb") as stream:
            writer.write(stream)
        temporary.replace(output)
    return removed


def inspect_pdf(output: Path, code: str) -> dict[str, object]:
    reader = PdfReader(str(output))
    page_texts = [clean_pdf_page_text(pdf_page.extract_text() or "", code) for pdf_page in reader.pages]
    blank_pages = [
        index + 1 for index, (pdf_page, text) in enumerate(zip(reader.pages, page_texts))
        if len(text) < 10 and not page_has_raster_image(pdf_page)
    ]
    near_blank_pages = [index + 1 for index, text in enumerate(page_texts) if len(text) < 80]
    pdf_text = normalize_text(" ".join(page_texts))
    return {
        "pages": len(reader.pages),
        "bytes": output.stat().st_size,
        "pdfCharacters": len(pdf_text),
        "blankPages": blank_pages,
        "nearBlankPages": near_blank_pages,
    }


def wait_best_effort(page, expression: str, timeout: int, label: str) -> str | None:
    try:
        page.wait_for_function(expression, timeout=timeout)
        return None
    except PlaywrightTimeoutError:
        return f"timeout while waiting for {label}"


def render_all() -> tuple[list[dict[str, object]], list[dict[str, str]]]:
    NOTES.mkdir(exist_ok=True)
    REPORTS.mkdir(exist_ok=True)
    results: list[dict[str, object]] = []
    errors: list[dict[str, str]] = []

    with sync_playwright() as playwright:
        browser = playwright.chromium.launch()
        for code, lesson in lesson_files():
            output = NOTES / f"downloadable-notes-{code}.pdf"
            relative_url = lesson.relative_to(ROOT).as_posix()
            if code in PRESERVE_EXISTING_PDF_CODES and output.exists() and output.stat().st_size >= MIN_VALID_PDF_BYTES:
                info = inspect_pdf(output, code)
                warnings = ["preserved existing approved notes PDF"]
                if info["nearBlankPages"]:
                    warnings.append(f"near-empty pages require review: {info['nearBlankPages']}")
                results.append({
                    "code": code,
                    "pages": info["pages"],
                    "bytes": info["bytes"],
                    "source": relative_url,
                    "sourceCharacters": 0,
                    "pdfCharacters": info["pdfCharacters"],
                    "textCoverage": None,
                    "panelCount": 0,
                    "visiblePanelCount": 0,
                    "removedBlankPages": [],
                    "blankPages": info["blankPages"],
                    "nearBlankPages": info["nearBlankPages"],
                    "warnings": warnings,
                })
                print(f"Preserved existing Course {code} PDF")
                continue

            url = f"http://127.0.0.1:8000/{relative_url}"
            print(f"Rendering Course {code} from {url}")
            page = browser.new_page(viewport={"width": 1440, "height": 1800})
            warnings: list[str] = []
            try:
                page.goto(url, wait_until="domcontentloaded", timeout=120000)
                try:
                    page.wait_for_load_state("networkidle", timeout=25000)
                except PlaywrightTimeoutError:
                    warnings.append("network idle timeout ignored")

                if page.locator(".fragment-slot").count():
                    warning = wait_best_effort(
                        page,
                        "document.querySelectorAll('.fragment-slot').length === 0",
                        15000,
                        "fragment slots",
                    )
                    if warning:
                        warnings.append(warning)

                warning = wait_best_effort(page, "document.fonts ? document.fonts.status === 'loaded' : true", 20000, "fonts")
                if warning:
                    warnings.append(warning)
                warning = wait_best_effort(page, "Array.from(document.images).every((img) => img.complete)", 20000, "images")
                if warning:
                    warnings.append(warning)

                page.evaluate(PREPARE_JS)
                page.add_style_tag(content=PRINT_CSS)
                page.wait_for_timeout(750)

                selectors = ",".join(PANEL_SELECTORS)
                panel_count = page.locator(selectors).count()
                visible_panel_count = page.evaluate(
                    """
                    (selectors) => [...document.querySelectorAll(selectors)]
                      .filter((item) => getComputedStyle(item).display !== 'none')
                      .length
                    """,
                    selectors,
                )
                source_text = page.locator("main").inner_text() if page.locator("main").count() else page.locator("body").inner_text()
                source_text = normalize_text(source_text)
                if len(source_text) < 500:
                    raise RuntimeError(f"prepared lesson text is unexpectedly short ({len(source_text)} characters)")

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
            except Exception as error:
                errors.append({"code": code, "source": relative_url, "error": str(error)})
                print(f"Course {code} failed: {error}")
                page.close()
                continue
            finally:
                if not page.is_closed():
                    page.close()

            if not output.exists() or output.stat().st_size < MIN_VALID_PDF_BYTES:
                errors.append({"code": code, "source": relative_url, "error": "generated PDF is missing or invalid"})
                continue

            removed_blank_pages = remove_genuinely_blank_pages(output, code)
            info = inspect_pdf(output, code)
            pdf_characters = int(info["pdfCharacters"])
            coverage = pdf_characters / max(1, len(source_text))
            if panel_count and visible_panel_count != panel_count:
                warnings.append(f"only {visible_panel_count}/{panel_count} detected panels were visible")
            if coverage < 0.45:
                warnings.append(f"extracted text coverage is {coverage:.1%}")
            if info["nearBlankPages"]:
                warnings.append(f"near-empty pages require review: {info['nearBlankPages']}")
            results.append({
                "code": code,
                "pages": info["pages"],
                "bytes": info["bytes"],
                "source": relative_url,
                "sourceCharacters": len(source_text),
                "pdfCharacters": pdf_characters,
                "textCoverage": round(coverage, 4),
                "panelCount": panel_count,
                "visiblePanelCount": visible_panel_count,
                "removedBlankPages": removed_blank_pages,
                "blankPages": info["blankPages"],
                "nearBlankPages": info["nearBlankPages"],
                "warnings": warnings,
            })
        browser.close()
    return results, errors


def main() -> None:
    generated, errors = render_all()
    lesson_codes = [code for code, _ in lesson_files()]
    generated_codes = sorted(str(item["code"]) for item in generated)
    missing_codes = sorted(set(lesson_codes) - set(generated_codes))
    report = {
        "generated": generated,
        "errors": errors,
        "requiredLessonCodes": lesson_codes,
        "generatedCodes": generated_codes,
        "missingCodes": missing_codes,
        "preservedExistingPdfCodes": sorted(PRESERVE_EXISTING_PDF_CODES),
        "renderer": "Playwright Chromium through local HTTP server",
        "validation": {
            "everyLessonHtmlRequiresPdf": True,
            "allKnownPanelsForcedVisible": True,
            "largeContainersAllowedToSplit": True,
            "genuinelyBlankPagesRemoved": True,
            "blankPageTextThreshold": 10,
            "minimumPdfBytes": MIN_VALID_PDF_BYTES,
            "textCoverageReported": True,
            "buildContinuesAfterNonCriticalWaits": True,
        },
    }
    (REPORTS / "lesson-notes-pdf-build.json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    if missing_codes or errors:
        print("Downloadable notes generation completed with warnings.")
        print(json.dumps({"missingCodes": missing_codes, "errors": errors}, indent=2))


if __name__ == "__main__":
    main()
