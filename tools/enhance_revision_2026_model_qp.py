# Purpose: Enhance revision 2026 model qp - Descriptive comment added for clarity
#!/usr/bin/env python3
"""Normalise and verify official syllabus and model-question-paper links on REV2026 pages."""
from __future__ import annotations

import html
import re
from pathlib import Path
from urllib.parse import quote

INDEX_URL = "https://sitttrkerala.ac.in/index.php?r=site%2Fdiploma-modelqp&scheme=REV2026"
SYLLABUS_URL = (
    "https://www.sitttrkerala.ac.in/index.php?"
    "r=site%2Fdiploma-syllabus-course-contents&course={}"
)
MODEL_QP_URL = (
    "https://www.sitttrkerala.ac.in/index.php?"
    "r=site%2Fdiploma-modelqp-courses-show&course={}"
)
COURSE_CODE_RE = re.compile(r"^[0-9]{4}[A-Z]?$", re.ASCII)
ARTICLE_RE = re.compile(
    r'<article\b(?=[^>]*\bclass="[^"]*\bsubject-card\b[^"]*")[^>]*>.*?</article>',
    re.DOTALL,
)
CODE_RE = re.compile(r'\bdata-subject-code="([^"]+)"')
SYLLABUS_LINK_RE = re.compile(
    r'<a\b(?=[^>]*\bclass="[^"]*\baction\b[^"]*\bsyllabus\b[^"]*")[^>]*>.*?</a>',
    re.DOTALL,
)
QP_LINK_RE = re.compile(
    r'<a\b(?=[^>]*\bclass="[^"]*\baction\b[^"]*\bqp\b[^"]*")[^>]*>.*?</a>',
    re.DOTALL,
)
ACCESS_SECTION = (
    '<section class="section notice" id="rev2026-model-qp-access">'
    '<strong>Official Revision 2026 model question papers:</strong> '
    f'<a class="btn ghost" href="{html.escape(INDEX_URL, quote=True)}" '
    'target="_blank" rel="noopener noreferrer">'
    'Open all REV2026 model papers</a>'
    '</section>'
)


def normalise_code(code: str) -> str:
    value = code.strip().upper()
    if not COURSE_CODE_RE.fullmatch(value):
        raise ValueError(f"Invalid REV2026 course code: {code!r}")
    return value


def syllabus_link(code: str) -> str:
    value = normalise_code(code)
    url = SYLLABUS_URL.format(quote(value, safe=""))
    return (
        f'<a class="action syllabus" href="{html.escape(url, quote=True)}" '
        'target="_blank" rel="noopener noreferrer" '
        f'data-syllabus-course="{html.escape(value, quote=True)}">'
        'Open Syllabus</a>'
    )


def model_paper_link(code: str) -> str:
    value = normalise_code(code)
    url = MODEL_QP_URL.format(quote(value, safe=""))
    return (
        f'<a class="action qp" href="{html.escape(url, quote=True)}" '
        'target="_blank" rel="noopener noreferrer" '
        f'data-model-paper-course="{html.escape(value, quote=True)}">'
        'Open Model Question Paper</a>'
    )


def normalise_subject_card(match: re.Match[str]) -> str:
    card = match.group(0)
    code_match = CODE_RE.search(card)
    if not code_match:
        raise RuntimeError("REV2026 subject card is missing data-subject-code")

    code = code_match.group(1)
    syllabus = syllabus_link(code)
    model_paper = model_paper_link(code)

    if SYLLABUS_LINK_RE.search(card):
        card = SYLLABUS_LINK_RE.sub(syllabus, card, count=1)
    else:
        action_row = card.find('<div class="action-row">')
        if action_row < 0:
            raise RuntimeError(f"Action row not found for course {code}")
        insert_at = action_row + len('<div class="action-row">')
        card = card[:insert_at] + syllabus + card[insert_at:]

    if QP_LINK_RE.search(card):
        card = QP_LINK_RE.sub(model_paper, card, count=1)
    else:
        action_end = card.rfind("</div></article>")
        if action_end < 0:
            raise RuntimeError(f"Action row end not found for course {code}")
        card = card[:action_end] + model_paper + card[action_end:]

    return card


def verify_card(article: str, path: Path) -> None:
    code_match = CODE_RE.search(article)
    syllabus_match = SYLLABUS_LINK_RE.search(article)
    qp_match = QP_LINK_RE.search(article)
    if not code_match or not syllabus_match or not qp_match:
        raise RuntimeError(f"Missing official course links in {path}")

    code = normalise_code(code_match.group(1))
    expected_syllabus = html.escape(
        SYLLABUS_URL.format(quote(code, safe="")), quote=True
    )
    expected_qp = html.escape(
        MODEL_QP_URL.format(quote(code, safe="")), quote=True
    )

    if f'href="{expected_syllabus}"' not in syllabus_match.group(0):
        raise RuntimeError(f"Incorrect syllabus link for {code} in {path}")
    if f'href="{expected_qp}"' not in qp_match.group(0):
        raise RuntimeError(f"Incorrect model-paper link for {code} in {path}")
    if "diploma-syllabus-course-contents" in qp_match.group(0):
        raise RuntimeError(f"Syllabus URL incorrectly used as model paper for {code} in {path}")


def enhance(path: Path) -> tuple[bool, int]:
    original = path.read_text(encoding="utf-8")
    updated, card_count = ARTICLE_RE.subn(normalise_subject_card, original)
    updated = updated.replace(">Sample QP</a>", ">Open Model Question Paper</a>")
    updated = updated.replace(">Sample Question Paper</a>", ">Open Model Question Paper</a>")

    if 'id="rev2026-model-qp-access"' not in updated:
        page_title = updated.find('<section class="page-title')
        if page_title < 0:
            raise RuntimeError(f"Page title section not found in {path}")
        end = updated.find("</section>", page_title)
        if end < 0:
            raise RuntimeError(f"Page title closing tag not found in {path}")
        end += len("</section>")
        updated = updated[:end] + ACCESS_SECTION + updated[end:]

    for article in ARTICLE_RE.findall(updated):
        verify_card(article, path)

    if updated == original:
        return False, card_count
    path.write_text(updated, encoding="utf-8")
    return True, card_count


def main() -> int:
    pages = [Path("revision-2026.html"), *sorted(Path("revision-2026").glob("*.html"))]
    if len(pages) < 39:
        raise RuntimeError(f"Expected the index plus 38 department pages; found {len(pages)}")

    changed = 0
    cards = 0
    for path in pages:
        was_changed, card_count = enhance(path)
        changed += int(was_changed)
        cards += card_count

    if cards == 0:
        raise RuntimeError("No REV2026 subject cards were found")
    print(
        f"Verified {cards} syllabus links and model-paper links across "
        f"{len(pages) - 1} department pages; changed {changed} pages"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
