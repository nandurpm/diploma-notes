#!/usr/bin/env python3
"""Build reviewable handbook-upgrade batches from the readiness audit.

The manifest intentionally contains no generated lesson prose. It records only
the ordered candidates and the official-source verification work required
before a lesson may be rewritten.
"""

from __future__ import annotations

import json
from collections import defaultdict
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
AUDIT = ROOT / "reports" / "handbook-readiness-audit.json"
OUT = ROOT / "reports" / "handbook-upgrade-manifest.json"
BATCH_SIZE = 5

WEIGHTS = {
    "below_20k_character_handbook_floor": 5,
    "missing_handbook_sections": 4,
    "insufficient_explicit_module_headings": 3,
    "low_explanatory_paragraph_density": 3,
    "low_structured_learning_detail": 2,
    "missing_explicit_official_source_citation": 2,
    "missing_malayalam_learning_support": 1,
    "missing_main_landmark": 1,
}


def main() -> None:
    audit = json.loads(AUDIT.read_text(encoding="utf-8"))
    candidates = []
    for item in audit["lessons"]:
        if not item["requires_syllabus_grounded_expansion"]:
            continue
        score = sum(WEIGHTS.get(problem, 0) for problem in item["deficiencies"])
        candidates.append(
            {
                "revision": item["revision"],
                "course_code": item["course_code"],
                "path": item["path"],
                "priority_score": score,
                "current_characters": item["characters"],
                "observed_deficiencies": item["deficiencies"],
                "required_before_rewrite": [
                    "Match revision and course code to the stored official SITTTR PDF.",
                    "Extract every module and syllabus point into a checklist.",
                    "Map every checklist point to a detailed explanation, example or procedure, and practice item.",
                    "Preserve existing valid content and validate the proposed HTML against all handbook, accessibility, and link gates.",
                ],
            }
        )

    candidates.sort(key=lambda item: (-item["priority_score"], item["current_characters"], item["revision"], item["course_code"] or ""))
    grouped: dict[str, list[dict]] = defaultdict(list)
    for candidate in candidates:
        grouped[candidate["revision"]].append(candidate)

    batches = []
    batch_number = 1
    # Keep revisions separate so source selection and navigation contracts stay homogeneous.
    for revision in sorted(grouped):
        rows = grouped[revision]
        for offset in range(0, len(rows), BATCH_SIZE):
            entries = rows[offset : offset + BATCH_SIZE]
            batches.append(
                {
                    "batch_id": f"REV{revision}-HANDBOOK-{batch_number:03d}",
                    "revision": revision,
                    "status": "awaiting_official_source_check",
                    "entries": entries,
                }
            )
            batch_number += 1

    payload = {
        "purpose": "Controlled source-grounded upgrade sequencing; no entry may be rewritten until its official syllabus PDF has been verified.",
        "batch_size": BATCH_SIZE,
        "candidate_count": len(candidates),
        "batches": batches,
    }
    OUT.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Created {len(batches)} batches for {len(candidates)} candidate lessons.")
    for batch in batches[:3]:
        codes = ", ".join(entry["course_code"] or "unknown" for entry in batch["entries"])
        print(f"{batch['batch_id']}: {codes}")


if __name__ == "__main__":
    main()
