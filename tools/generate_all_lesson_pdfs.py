#!/usr/bin/env python3
"""Generate release-ready PDFs from POLY PMNA lesson HTML pages.

The script renders lesson pages through local headless Chromium, validates every
PDF, and writes manifests that can be committed after release assets are live.
It can render the complete archive or only paths supplied through --files-from.
"""

from __future__ import annotations

import argparse
import concurrent.futures
import hashlib
import json
import os
import re
import shutil
import subprocess
import tempfile
import time
from dataclasses import asdict, dataclass
from pathlib import Path
from urllib.parse import quote


@dataclass
class RenderResult:
    revision: str
    code: str
    source: str
    output: str
    pdf_url: str
    release_tag: str
    status: str
    bytes: int = 0
    sha256: str = ""
    pages: int = 0
    title: str = ""
    error: str = ""


def lesson_title(path: Path) -> str:
    text = path.read_text(encoding="utf-8", errors="replace")
    match = re.search(r"<title[^>]*>\s*(.*?)\s*</title>", text, flags=re.I | re.S)
    if not match:
        return path.stem
    value = re.sub(r"\s+", " ", match.group(1)).strip()
    return value or path.stem


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def pdf_pages(path: Path) -> int:
    completed = subprocess.run(
        ["pdfinfo", str(path)], capture_output=True, text=True, check=False
    )
    if completed.returncode != 0:
        raise RuntimeError(completed.stderr.strip() or "pdfinfo failed")
    match = re.search(r"^Pages:\s+(\d+)\s*$", completed.stdout, flags=re.M)
    if not match:
        raise RuntimeError("PDF page count is missing")
    return int(match.group(1))


def chromium_binary() -> str:
    configured = os.environ.get("CHROMIUM_BIN")
    if configured:
        return configured
    for candidate in ("chromium", "chromium-browser", "google-chrome"):
        resolved = shutil.which(candidate)
        if resolved:
            return resolved
    raise RuntimeError("No Chromium-compatible browser was found")


def render_one(task: tuple[str, Path, Path, str, str, str]) -> RenderResult:
    revision, source, output, base_url, release_tag, chrome = task
    code = source.stem.removeprefix("lessons-")
    output.parent.mkdir(parents=True, exist_ok=True)
    source_relative = (
        f"lessons/{source.name}"
        if revision == "2021"
        else f"revision-2026-content/lessons/{source.name}"
    )
    rendered_url = f"{base_url.rstrip('/')}/{quote(source_relative)}?autoPrintNotes=1"
    pdf_url = (
        "https://github.com/nandurpm/poly-pmna-pdf-files/releases/download/"
        f"{release_tag}/{quote(code)}.pdf"
    )
    title = lesson_title(source)

    profile_dir = Path(tempfile.mkdtemp(prefix="poly-pdf-chrome-"))
    try:
        command = [
            chrome,
            "--headless",
            "--no-sandbox",
            "--disable-gpu",
            "--disable-dev-shm-usage",
            "--run-all-compositor-stages-before-draw",
            "--virtual-time-budget=3500",
            "--print-to-pdf-no-header",
            f"--user-data-dir={profile_dir}",
            f"--print-to-pdf={output}",
            rendered_url,
        ]
        completed = subprocess.run(
            command,
            capture_output=True,
            text=True,
            timeout=100,
            check=False,
        )
        if completed.returncode != 0:
            raise RuntimeError(completed.stderr.strip() or "Chromium exited with an error")
        if not output.is_file() or output.stat().st_size < 1024:
            raise RuntimeError("Chromium did not create a usable PDF")

        pages = pdf_pages(output)
        if pages < 1:
            raise RuntimeError("PDF has no pages")

        return RenderResult(
            revision=revision,
            code=code,
            source=source_relative,
            output=str(output),
            pdf_url=pdf_url,
            release_tag=release_tag,
            status="published",
            bytes=output.stat().st_size,
            sha256=sha256(output),
            pages=pages,
            title=title,
        )
    except Exception as exc:  # Capture every failure and allow remaining pages to render.
        if output.exists():
            output.unlink()
        return RenderResult(
            revision=revision,
            code=code,
            source=source_relative,
            output=str(output),
            pdf_url=pdf_url,
            release_tag=release_tag,
            status="failed",
            title=title,
            error=str(exc),
        )
    finally:
        shutil.rmtree(profile_dir, ignore_errors=True)


def revision_for_relative(relative: Path) -> str | None:
    if relative.parts[:1] == ("lessons",) and relative.name.startswith("lessons-"):
        return "2021"
    if (
        relative.parts[:2] == ("revision-2026-content", "lessons")
        and relative.name.startswith("lessons-")
    ):
        return "2026"
    return None


def revision_sources(source_root: Path, revision: str) -> list[Path]:
    directory = (
        source_root / "lessons"
        if revision == "2021"
        else source_root / "revision-2026-content" / "lessons"
    )
    return sorted(directory.glob("lessons-*.html"))


def selected_sources(source_root: Path, files_from: str | None) -> list[tuple[str, Path]]:
    if not files_from:
        return [
            (revision, source)
            for revision in ("2021", "2026")
            for source in revision_sources(source_root, revision)
        ]

    selected: dict[str, tuple[str, Path]] = {}
    for raw in Path(files_from).read_text(encoding="utf-8").splitlines():
        value = raw.strip().replace("\\", "/")
        if not value:
            continue
        relative = Path(value)
        revision = revision_for_relative(relative)
        if revision is None:
            raise ValueError(f"Not a lesson HTML path: {value}")
        source = source_root / relative
        if not source.is_file():
            raise FileNotFoundError(f"Changed lesson is missing from checkout: {value}")
        selected[relative.as_posix()] = (revision, source)
    return [selected[key] for key in sorted(selected)]


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source-root", default=".")
    parser.add_argument("--output-root", default="/tmp/poly-pmna-generated-pdfs")
    parser.add_argument("--base-url", default="http://127.0.0.1:9876")
    parser.add_argument("--workers", type=int, default=4)
    parser.add_argument("--source-commit", required=True)
    parser.add_argument("--files-from", help="newline-delimited changed lesson paths")
    parser.add_argument("--release-suffix", default="v1")
    args = parser.parse_args()

    source_root = Path(args.source_root).resolve()
    output_root = Path(args.output_root).resolve()
    output_root.mkdir(parents=True, exist_ok=True)
    chrome = chromium_binary()
    sources = selected_sources(source_root, args.files_from)

    task_list: list[tuple[str, Path, Path, str, str, str]] = []
    for revision, source in sources:
        release_tag = f"notes-{revision}-{args.release_suffix}"
        code = source.stem.removeprefix("lessons-")
        output = output_root / revision / f"{code}.pdf"
        task_list.append((revision, source, output, args.base_url, release_tag, chrome))

    started = time.time()
    results: list[RenderResult] = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=max(1, args.workers)) as executor:
        future_map = {executor.submit(render_one, task): task for task in task_list}
        for index, future in enumerate(concurrent.futures.as_completed(future_map), start=1):
            result = future.result()
            results.append(result)
            state = "OK" if result.status == "published" else "FAILED"
            print(f"[{index}/{len(task_list)}] {state} {result.revision} {result.code}", flush=True)

    results.sort(key=lambda item: (item.revision, item.code))
    for revision in ("2021", "2026"):
        subjects = [
            {
                "code": item.code,
                "title": item.title,
                "revision": item.revision,
                "version": args.release_suffix,
                "status": item.status,
                "releaseTag": item.release_tag,
                "pdfUrl": item.pdf_url,
                "bytes": item.bytes,
                "sha256": item.sha256,
                "pages": item.pages,
                "source": item.source,
            }
            for item in results
            if item.revision == revision and item.status == "published"
        ]
        manifest = {
            "schemaVersion": 1,
            "revision": revision,
            "generatedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "sourceCommit": args.source_commit,
            "releaseTag": f"notes-{revision}-{args.release_suffix}",
            "subjects": subjects,
        }
        (output_root / f"notes-{revision}.json").write_text(
            json.dumps(manifest, indent=2, ensure_ascii=False) + "\n",
            encoding="utf-8",
        )

    payload = {
        "sourceCommit": args.source_commit,
        "generatedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "durationSeconds": round(time.time() - started, 2),
        "total": len(results),
        "published": sum(item.status == "published" for item in results),
        "failed": sum(item.status == "failed" for item in results),
        "results": [asdict(item) for item in results],
    }
    (output_root / "generation-report.json").write_text(
        json.dumps(payload, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    print(json.dumps({key: payload[key] for key in ("total", "published", "failed", "durationSeconds")}, indent=2))
    return 0 if payload["failed"] == 0 else 2


if __name__ == "__main__":
    raise SystemExit(main())
