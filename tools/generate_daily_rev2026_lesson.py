# Purpose: Generate daily rev2026 lesson - Descriptive comment added for clarity
from __future__ import annotations

import html
import json
import os
import re
import subprocess
import tempfile
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterable

ROOT = Path(__file__).resolve().parents[1]
QUEUE_FILE = ROOT / "automation" / "rev2026-syllabus-queue.txt"
LESSONS_DIR = ROOT / "revision-2026-content" / "lessons"
MASTER_PROMPT_CANDIDATES = (
    ROOT / "docs" / "poly-pmna-lesson-html-master-prompt.md",
    ROOT / "docs" / "syllabus-structure-master-prompt.md",
)

LIVE_SITE_BASE = os.environ.get("LIVE_SITE_BASE", "https://polypmna.dpdns.org").rstrip("/")
SYLLABUS_URL_TEMPLATE = os.environ.get(
    "REV2026_SYLLABUS_URL_TEMPLATE",
    "https://www.sitttrkerala.ac.in/index.php?r=site%2Fdiploma-syllabus-course-contents&course={code}",
)
GITHUB_MODELS_ENDPOINT = os.environ.get(
    "GITHUB_MODELS_ENDPOINT",
    "https://models.github.ai/inference/chat/completions",
)
GITHUB_MODELS_MODEL = os.environ.get("GITHUB_MODELS_MODEL", "openai/gpt-4.1")
ASK_POLY_ENDPOINT = os.environ.get(
    "ASK_POLY_ENDPOINT",
    "https://hwobooljdvynsajtrvnk.supabase.co/functions/v1/ask-poly-proxy",
)

MIN_HTML_CHARS = int(os.environ.get("REV2026_MIN_HTML_CHARS", "30000"))
HTTP_TIMEOUT = int(os.environ.get("REV2026_HTTP_TIMEOUT", "90"))
USER_AGENT = "POLY-PMNA-REV2026-LessonBot/1.0 (+https://polypmna.dpdns.org)"
CODE_RE = re.compile(r"^[12][0-9]{3}[A-Z]*$")


class GenerationError(RuntimeError):
    pass


def log(message: str) -> None:
    print(f"[daily-rev2026] {message}", flush=True)


def write_github_output(**values: str) -> None:
    output_path = os.environ.get("GITHUB_OUTPUT")
    if not output_path:
        return
    with Path(output_path).open("a", encoding="utf-8") as handle:
        for key, value in values.items():
            clean = str(value).replace("\r", " ").replace("\n", " ").strip()
            handle.write(f"{key}={clean}\n")


def code_sort_key(code: str) -> tuple[int, int, str]:
    match = re.fullmatch(r"([0-9]+)([A-Z]*)", code)
    if not match:
        return (999, 999999, code)
    return (int(code[0]), int(match.group(1)), match.group(2))


def load_queue() -> list[str]:
    if not QUEUE_FILE.exists():
        raise GenerationError(f"Queue file is missing: {QUEUE_FILE.relative_to(ROOT)}")
    codes: list[str] = []
    for raw in QUEUE_FILE.read_text(encoding="utf-8").splitlines():
        value = raw.split("#", 1)[0].strip().upper()
        if not value:
            continue
        if not CODE_RE.fullmatch(value):
            raise GenerationError(f"Invalid subject code in queue: {value!r}")
        codes.append(value)
    unique = sorted(set(codes), key=code_sort_key)
    if not unique:
        raise GenerationError("The REV2026 queue is empty.")
    return unique


def lesson_path(code: str) -> Path:
    return LESSONS_DIR / f"lessons-{code}.html"


def live_lesson_url(code: str) -> str:
    return f"{LIVE_SITE_BASE}/revision-2026-content/lessons/lessons-{code}.html"


def request_bytes(url: str, *, method: str = "GET", timeout: int = HTTP_TIMEOUT) -> tuple[bytes, str, int, str]:
    request = urllib.request.Request(
        url,
        method=method,
        headers={
            "User-Agent": USER_AGENT,
            "Accept": "application/pdf,text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
            "Cache-Control": "no-cache",
        },
    )
    with urllib.request.urlopen(request, timeout=timeout) as response:
        data = response.read()
        content_type = response.headers.get("Content-Type", "")
        return data, content_type, int(response.status), response.geturl()


def live_lesson_exists(code: str) -> bool:
    url = live_lesson_url(code)
    try:
        data, content_type, status, final_url = request_bytes(url, timeout=30)
    except urllib.error.HTTPError as error:
        if error.code in {403, 404, 410}:
            return False
        log(f"Live check warning for {code}: HTTP {error.code}; treating as missing.")
        return False
    except Exception as error:
        log(f"Live check warning for {code}: {error}; treating as missing.")
        return False

    if status != 200 or not data:
        return False
    sample = data[:500_000].decode("utf-8", errors="ignore").lower()
    if "404" in sample[:2000] and "not found" in sample[:4000]:
        return False
    expected = f"lessons-{code.lower()}"
    has_html = "<html" in sample or "<!doctype html" in sample or "text/html" in content_type.lower()
    has_identity = expected in sample or code.lower() in sample or expected in final_url.lower()
    return has_html and has_identity


def select_next_code(codes: Iterable[str]) -> str | None:
    for code in codes:
        target = lesson_path(code)
        if target.exists():
            log(f"Skip {code}: {target.relative_to(ROOT)} already exists in GitHub checkout.")
            continue
        if live_lesson_exists(code):
            log(f"Skip {code}: valid lesson already exists on the live website.")
            continue
        return code
    return None


def find_pdf_links(page_url: str, payload: bytes) -> list[str]:
    text = payload.decode("utf-8", errors="ignore")
    candidates: list[str] = []
    patterns = (
        r"(?:href|src)=[\"']([^\"']+\.pdf(?:\?[^\"']*)?)[\"']",
        r"[\"']([^\"']*(?:download|syllabus|course-content)[^\"']*)[\"']",
    )
    for pattern in patterns:
        for match in re.finditer(pattern, text, flags=re.I):
            candidate = html.unescape(match.group(1)).strip()
            if not candidate or candidate.startswith(("javascript:", "data:")):
                continue
            absolute = urllib.parse.urljoin(page_url, candidate)
            if absolute not in candidates:
                candidates.append(absolute)
    return candidates[:20]


def download_syllabus_pdf(code: str, destination: Path) -> str:
    source_url = SYLLABUS_URL_TEMPLATE.format(code=urllib.parse.quote(code))
    log(f"Downloading official syllabus for {code}.")
    data, content_type, status, final_url = request_bytes(source_url)
    if status != 200:
        raise GenerationError(f"SITTTR syllabus request failed with HTTP {status} for {code}.")

    if not data.startswith(b"%PDF"):
        for candidate in find_pdf_links(final_url, data):
            try:
                candidate_data, candidate_type, candidate_status, candidate_final = request_bytes(candidate)
            except Exception:
                continue
            if candidate_status == 200 and candidate_data.startswith(b"%PDF"):
                data, content_type, final_url = candidate_data, candidate_type, candidate_final
                break

    if not data.startswith(b"%PDF"):
        preview = data[:180].decode("utf-8", errors="replace").replace("\n", " ")
        raise GenerationError(
            f"Official syllabus endpoint did not return a PDF for {code}. "
            f"Content-Type={content_type!r}; preview={preview!r}"
        )

    destination.write_bytes(data)
    if destination.stat().st_size < 20_000:
        raise GenerationError(f"Downloaded syllabus PDF for {code} is unexpectedly small.")
    return final_url


def extract_pdf_text(pdf_path: Path, code: str) -> str:
    try:
        result = subprocess.run(
            ["pdftotext", "-layout", str(pdf_path), "-"],
            check=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            timeout=120,
        )
    except FileNotFoundError as error:
        raise GenerationError("pdftotext is not installed on the runner.") from error
    except subprocess.CalledProcessError as error:
        raise GenerationError(f"pdftotext failed: {error.stderr.strip()}") from error

    text = result.stdout.replace("\x00", "").strip()
    if len(text) < 2000:
        raise GenerationError(f"Extracted syllabus text for {code} is too short ({len(text)} characters).")
    if code not in text:
        log(f"Warning: extracted PDF text does not visibly contain code {code}; continuing with filename authority.")
    return text


def normalize_space(value: str) -> str:
    return re.sub(r"\s+", " ", value.replace("\u00a0", " ")).strip()


def extract_course_title(text: str, code: str) -> str:
    compact = normalize_space(text)
    patterns = (
        r"Course\s+Title\s+(.{3,180}?)\s+Course\s+Code",
        rf"Course\s+Title\s+(.{{3,180}}?)\s+{re.escape(code)}\b",
    )
    for pattern in patterns:
        match = re.search(pattern, compact, flags=re.I)
        if match:
            title = normalize_space(match.group(1)).strip(" :-|")
            if 2 < len(title) <= 180:
                return title

    for line in text.splitlines():
        if re.search(r"\bCourse\s+Title\b", line, flags=re.I):
            title = re.sub(r".*?\bCourse\s+Title\b", "", line, flags=re.I)
            title = re.split(r"\bCourse\s+Code\b|\bSemester\b", title, maxsplit=1, flags=re.I)[0]
            title = normalize_space(title).strip(" :-|")
            if 2 < len(title) <= 180:
                return title
    return f"Revision 2026 Course {code}"


def extract_module_labels(text: str) -> list[str]:
    labels: list[str] = []
    for token in re.findall(r"\bModule\s+([IVXLC]+|[0-9]+)\b", text, flags=re.I):
        normalized = token.upper()
        if normalized not in labels:
            labels.append(normalized)
    return labels


def load_master_prompt() -> str:
    for path in MASTER_PROMPT_CANDIDATES:
        if path.exists():
            text = path.read_text(encoding="utf-8", errors="replace").strip()
            if text:
                return text[:50_000]
    return """
Create a complete standalone Revision 2026 POLY PMNA HTML handbook from the supplied official syllabus text. Cover every official topic, include detailed English teaching content, useful Malayalam support while retaining technical terms in English, diagrams using inline SVG, tables, solved examples where relevant, expected questions with answers, quick revision, glossary, references, responsive full-width layout, accessible controls, Print / Save PDF, Download Notes with correct Revision 2026 paths, autoPrintNotes and downloadNotes query handling, and book-like A4 print CSS. Do not add a duplicate site header or permanent sidebar. Return only one complete HTML5 document.
""".strip()


def build_generation_prompt(code: str, title: str, syllabus_url: str, syllabus_text: str) -> str:
    master = load_master_prompt()
    return f"""
You are running inside the approved POLY PMNA daily lesson generator.

TASK
Create exactly one complete, production-ready standalone HTML5 handbook for Revision 2026 subject {code} — {title}.

AUTHORITATIVE SOURCE
The official SITTTR syllabus was downloaded from:
{syllabus_url}
The extracted text is included below and is the only curriculum authority.

OUTPUT CONTRACT — NON-NEGOTIABLE
- Return ONLY the final HTML document, beginning with <!doctype html> and ending with </html>.
- Do not use Markdown fences, explanations, status reports, TODOs, placeholders, or abbreviated sections.
- The exact output path will be revision-2026-content/lessons/lessons-{code}.html.
- Preserve the full code including suffix letters.
- Use the correct notes path /revision-2026-content/notes/downloadable-notes-{code}.pdf.
- Include Print / Save PDF and Download Notes controls.
- Support ?autoPrintNotes=1 and ?downloadNotes=1.
- Use full-width responsive layout with no duplicate website header, no fixed site header, and no permanent left sidebar.
- Include substantial Malayalam support for major concepts; keep technical terms, formulas, units, standards and component names in English.
- Include every official module/topic/outcome/experiment/activity from the source.
- Disclose official-source inconsistencies instead of silently correcting them.
- Use semantic HTML, internal CSS, vanilla JavaScript, inline SVG and local/root-relative assets only.
- Include accessible diagrams, expected/practice questions with answers, course-appropriate formula/rule/procedure bank, quick revision, glossary and references.
- Print mode must reveal all hidden content and produce a clean A4 handbook.
- Do not copy content from another course or Revision 2021.
- Make this a detailed handbook, not a short notes page. Target at least {MIN_HTML_CHARS} characters of meaningful HTML.

CURRENT REPOSITORY HANDBOOK RULES
{master}

OFFICIAL SYLLABUS TEXT FOR {code}
--- BEGIN OFFICIAL SYLLABUS TEXT ---
{syllabus_text}
--- END OFFICIAL SYLLABUS TEXT ---

Return only the complete final HTML now.
""".strip()


def post_json(url: str, payload: dict, headers: dict[str, str], timeout: int = 180) -> dict:
    request = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        method="POST",
        headers={"Content-Type": "application/json", "User-Agent": USER_AGENT, **headers},
    )
    with urllib.request.urlopen(request, timeout=timeout) as response:
        body = response.read().decode("utf-8", errors="replace")
        if response.status < 200 or response.status >= 300:
            raise GenerationError(f"AI endpoint returned HTTP {response.status}: {body[:500]}")
        try:
            return json.loads(body)
        except json.JSONDecodeError as error:
            raise GenerationError(f"AI endpoint returned invalid JSON: {body[:500]}") from error


def call_github_models(prompt: str) -> str:
    token = os.environ.get("GITHUB_TOKEN", "").strip()
    if not token:
        raise GenerationError("GITHUB_TOKEN is unavailable for GitHub Models.")

    last_error: Exception | None = None
    for max_tokens in (30000, 16000, 8000):
        payload = {
            "model": GITHUB_MODELS_MODEL,
            "messages": [
                {
                    "role": "system",
                    "content": "You are a senior curriculum author and front-end engineer. Return only complete production HTML.",
                },
                {"role": "user", "content": prompt},
            ],
            "temperature": 0.2,
            "max_tokens": max_tokens,
        }
        try:
            data = post_json(
                GITHUB_MODELS_ENDPOINT,
                payload,
                {
                    "Authorization": f"Bearer {token}",
                    "Accept": "application/vnd.github+json",
                    "X-GitHub-Api-Version": "2026-03-10",
                },
                timeout=300,
            )
            choices = data.get("choices") or []
            content = ((choices[0].get("message") or {}).get("content") if choices else "") or ""
            if content.strip():
                return content
            raise GenerationError(f"GitHub Models returned no content: {json.dumps(data)[:800]}")
        except urllib.error.HTTPError as error:
            detail = error.read().decode("utf-8", errors="replace")
            last_error = GenerationError(f"GitHub Models HTTP {error.code}: {detail[:800]}")
            if error.code in {400, 413, 422, 429, 500, 502, 503, 504}:
                time.sleep(4)
                continue
            raise last_error
        except Exception as error:
            last_error = error
            time.sleep(3)
    raise GenerationError(f"GitHub Models failed after retries: {last_error}")


def call_ask_poly_fallback(prompt: str) -> str:
    payload = {"message": prompt, "history": []}
    data = post_json(ASK_POLY_ENDPOINT, payload, {}, timeout=180)
    return str(data.get("answer") or data.get("message") or data.get("reply") or "")


def clean_html_document(raw: str) -> str:
    text = raw.strip()
    text = re.sub(r"^```(?:html)?\s*", "", text, flags=re.I)
    text = re.sub(r"\s*```$", "", text)
    start = re.search(r"<!doctype\s+html\s*>", text, flags=re.I)
    if start:
        text = text[start.start():]
    else:
        html_start = re.search(r"<html\b", text, flags=re.I)
        if html_start:
            text = "<!doctype html>\n" + text[html_start.start():]
    end_matches = list(re.finditer(r"</html\s*>", text, flags=re.I))
    if end_matches:
        text = text[: end_matches[-1].end()]
    return text.strip() + "\n"


def html_plain_text(value: str) -> str:
    without_scripts = re.sub(r"<(script|style)\b[^>]*>[\s\S]*?</\1>", " ", value, flags=re.I)
    without_tags = re.sub(r"<[^>]+>", " ", without_scripts)
    return normalize_space(html.unescape(without_tags)).lower()


def validate_html(document: str, code: str, title: str, syllabus_text: str) -> list[str]:
    errors: list[str] = []
    lower = document.lower()
    plain = html_plain_text(document)

    if len(document) < MIN_HTML_CHARS:
        errors.append(f"HTML is too short: {len(document)} < {MIN_HTML_CHARS} characters")
    if not re.search(r"^\s*<!doctype\s+html\s*>", document, flags=re.I):
        errors.append("missing HTML5 doctype")
    if "<html" not in lower or "</html>" not in lower:
        errors.append("incomplete html element")
    if code.lower() not in lower:
        errors.append(f"subject code {code} is missing")
    title_words = [word.lower() for word in re.findall(r"[A-Za-z0-9]+", title) if len(word) >= 4]
    if title_words and sum(word in plain for word in title_words) < max(1, len(title_words) // 2):
        errors.append(f"course title appears to be missing or incorrect: {title}")
    if not re.search(r"[\u0D00-\u0D7F]", document):
        errors.append("Malayalam support is missing")
    for phrase in ("print / save pdf", "download notes"):
        if phrase not in plain:
            errors.append(f"required control is missing: {phrase}")
    expected_pdf = f"/revision-2026-content/notes/downloadable-notes-{code}.pdf".lower()
    if expected_pdf not in lower:
        errors.append("correct Revision 2026 notes PDF path is missing")
    if "autoprintnotes" not in lower or "downloadnotes" not in lower:
        errors.append("required notes query-parameter handling is missing")
    if len(re.findall(r"<h2\b", lower)) < 6:
        errors.append("too few major handbook sections")

    forbidden = (
        "lorem ipsum",
        "insert image here",
        "coming soon",
        "as an ai language model",
        "module content unavailable",
        "generated based on assumptions",
        "<!-- todo",
    )
    for marker in forbidden:
        if marker in lower:
            errors.append(f"forbidden placeholder/filler found: {marker}")

    for module in extract_module_labels(syllabus_text):
        if f"module {module.lower()}" not in plain:
            errors.append(f"official Module {module} is missing")

    if re.search(r"<(?:script|link)[^>]+(?:cdn\.|cdnjs|unpkg|jsdelivr|bootstrap|tailwind)", lower):
        errors.append("external CDN dependency detected")

    return errors


def repair_html(code: str, title: str, syllabus_text: str, draft: str, errors: list[str]) -> str:
    repair_prompt = f"""
Return ONLY one complete corrected HTML5 document for Revision 2026 {code} — {title}.
The draft below failed validation. Correct every issue, complete all truncated sections, preserve every syllabus module and topic, and return the entire HTML from <!doctype html> through </html>. Do not explain.

VALIDATION FAILURES
- """ + "\n- ".join(errors) + f"""

OFFICIAL SYLLABUS TEXT
{syllabus_text}

FAILED DRAFT
{draft[:120_000]}
"""
    return call_github_models(repair_prompt)


def generate_document(code: str, title: str, source_url: str, syllabus_text: str) -> tuple[str, str]:
    prompt = build_generation_prompt(code, title, source_url, syllabus_text)
    provider = f"GitHub Models ({GITHUB_MODELS_MODEL})"
    try:
        raw = call_github_models(prompt)
    except Exception as primary_error:
        log(f"GitHub Models failed: {primary_error}. Trying existing Ask POLY endpoint once.")
        provider = "Ask POLY fallback"
        raw = call_ask_poly_fallback(prompt)

    document = clean_html_document(raw)
    errors = validate_html(document, code, title, syllabus_text)
    if errors and provider.startswith("GitHub Models"):
        log("Initial model output failed validation; requesting one full-document repair.")
        repaired = clean_html_document(repair_html(code, title, syllabus_text, document, errors))
        repaired_errors = validate_html(repaired, code, title, syllabus_text)
        if not repaired_errors:
            return repaired, provider + " + repair"
        errors = repaired_errors

    if errors:
        raise GenerationError("Generated lesson failed validation:\n- " + "\n- ".join(errors))
    return document, provider


def main() -> int:
    LESSONS_DIR.mkdir(parents=True, exist_ok=True)
    codes = load_queue()
    log(f"Loaded {len(codes)} queued syllabus codes.")

    code = select_next_code(codes)
    if code is None:
        log("No pending lesson remains. Nothing will be committed.")
        write_github_output(status="complete", code="", title="", generated_path="")
        return 0

    target = lesson_path(code)
    log(f"Selected next missing subject: {code}.")

    with tempfile.TemporaryDirectory(prefix=f"rev2026-{code}-") as temp_dir:
        pdf_path = Path(temp_dir) / f"{code}.pdf"
        source_url = download_syllabus_pdf(code, pdf_path)
        syllabus_text = extract_pdf_text(pdf_path, code)
        title = extract_course_title(syllabus_text, code)
        log(f"Extracted title: {title}")

        if target.exists() or live_lesson_exists(code):
            log(f"Skip {code}: lesson appeared during this run.")
            write_github_output(status="skipped", code=code, title=title, generated_path="")
            return 0

        document, provider = generate_document(code, title, source_url, syllabus_text)

    if target.exists():
        log(f"Skip write for {code}: target was created concurrently.")
        write_github_output(status="skipped", code=code, title=title, generated_path="")
        return 0

    temporary_target = target.with_suffix(".html.tmp")
    temporary_target.write_text(document, encoding="utf-8")
    temporary_target.replace(target)

    relative = target.relative_to(ROOT).as_posix()
    log(f"Generated and validated {relative} using {provider} ({len(document)} characters).")
    write_github_output(
        status="generated",
        code=code,
        title=title,
        generated_path=relative,
        provider=provider,
        generated_at=datetime.now(timezone.utc).isoformat(),
    )
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except GenerationError as error:
        log(f"ERROR: {error}")
        write_github_output(status="failed", code="", title="", generated_path="")
        raise SystemExit(1)
