#!/usr/bin/env python3
"""Guard browser mock-exam assets against answer-key and rubric leakage."""
from __future__ import annotations

import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PUBLIC_FILES = [
    ROOT / "assets/js/mock-exam-papers.js",
    ROOT / "assets/js/mock-exam-service.js",
    ROOT / "assets/js/mock-exam-loader.js",
    ROOT / "assets/js/mock-exam-ai-evaluator.js",
]
FORBIDDEN_PATTERNS = [
    ("exactAnswers property", re.compile(r"(?:^|[,{\s])exactAnswers\s*[:=]")),
    ("keywords rubric property", re.compile(r"(?:^|[,{\s])keywords\s*[:=]")),
    ("modelPoints property", re.compile(r"(?:^|[,{\s])modelPoints\s*[:=]")),
    ("rubric property", re.compile(r"(?:^|[,{\s])rubric\s*[:=]")),
    ("browser fallback marker", re.compile(r"(?:rubricFallback|localFallback|clientGrading|browserRubric)", re.I)),
]

failures: list[str] = []
for path in PUBLIC_FILES:
    if not path.is_file():
        failures.append(f"missing public mock-exam asset: {path.relative_to(ROOT)}")
        continue
    text = path.read_text(encoding="utf-8")
    for label, pattern in FORBIDDEN_PATTERNS:
        if pattern.search(text):
            failures.append(f"{path.relative_to(ROOT)}: contains {label}")

papers = ROOT / "assets/js/mock-exam-papers.js"
if papers.is_file():
    try:
        completed = subprocess.run(
            ["node", "--check", str(papers)],
            cwd=ROOT,
            text=True,
            capture_output=True,
            check=False,
        )
        if completed.returncode:
            failures.append(f"assets/js/mock-exam-papers.js: JavaScript syntax error: {completed.stderr.strip()}")
    except OSError as exc:
        failures.append(f"could not execute node for public registry validation: {exc}")

if failures:
    raise SystemExit("\n".join(failures))

print("Verified public mock-exam assets contain no browser-shipped answer keys, rubrics, or client grading fallback.")
