# POLY PMNA Lesson Handbook Upgrade Standard

## Purpose

This standard governs improvements to existing Revision 2021 and Revision 2026 lesson pages. A lesson is upgraded only when its teaching content can be checked against the corresponding **official SITTTR syllabus PDF**. A visual template, a long page, or generic generated prose is not evidence that every syllabus point has been covered.

> **Publication rule:** Do not replace an existing lesson merely to make its structure uniform. Preserve it unless the official-source comparison identifies a coverage gap or the lesson fails a required handbook-quality gate.

## Required evidence before a rewrite

| Gate | Required evidence | Failure outcome |
|---|---|---|
| Official source match | Exact revision, course code, title, source URL, storage checksum, and source PDF available | Do not rewrite; record `missing_source` or `invalid_source`. |
| Module extraction | Every named module and syllabus point is extracted from the official PDF into a machine-readable checklist | Do not claim complete coverage. |
| Content coverage | Each extracted syllabus point links to at least one substantive lesson section, explanation, example, diagram, calculation, or practice item | Queue for source-grounded expansion. |
| Explanatory detail | Definitions, method/steps, worked example where applicable, common misconception or safety/quality note, and practice for every module | Queue for expansion. |
| Student handbook utilities | Course outcomes, module navigation, glossary, formula/notation reference where applicable, visual explanations, assessment, quick revision, and official citation | Repair missing utilities without deleting meaningful existing content. |
| Accessibility and mobile safety | One `main` landmark, document language, labelled controls, unique IDs, no reveal-hidden content, and responsive reading layout | Repair alongside content; reject an otherwise complete rewrite if it regresses these checks. |
| Bilingual learning support | Malayalam learning support where it is pedagogically appropriate, with terminology kept technically accurate | Add or retain support before publication. |

## Upgrade decision levels

| Level | Deterministic indication | Required action |
|---|---|---|
| A — preserve | All structural gates pass and official module checklist maps fully to detailed content | Retain the lesson; optionally add small, reviewed corrections only. |
| B — enrich | Official coverage is present but one or more handbook utilities or detailed explanations are weak | Add focused module-level content; preserve the original lesson structure and working links. |
| C — rebuild from source | Missing module coverage, major explanatory gaps, or several core handbook sections absent | Produce a full source-grounded replacement in a separate review branch, then validate before merging. |
| D — hold | Official PDF is unavailable, wrong revision, incomplete, or not a syllabus PDF | Do not invent content; hold until a valid official source is available. |

## Controlled-batch workflow

1. Generate a conservative readiness report for every existing lesson. This report is triage only, not proof of syllabus completeness.
2. Join each lesson to its stored official source by revision and course code. Reject a source mismatch before generation.
3. Extract official module headings and individual syllabus points from the PDF. Store a source checksum and a point-level coverage checklist.
4. Select a small homogeneous batch, normally no more than five courses in one programme and revision.
5. Create a proposed upgraded HTML file without touching the published lesson. It must preserve course-code, revision, PDF-download, accessibility, and navigation contracts.
6. Run the structure, source-citation, module-checklist, link, syntax, accessibility, and diff-safety validators. Reject any proposal that adds unsupported topics or loses useful existing material.
7. Publish only validated proposals. Retain commit-level traceability to the official source checksum and notify the owner of the exact course codes changed.
8. Re-run the portal quality gate and bounded production checks after each batch.

## Current baseline

The conservative local readiness audit examines **264** existing lesson HTML files: **133** Revision 2021 and **131** Revision 2026. It distinguishes static HTML pages from Revision 2021 shells whose full course handbook is rendered by the shared client-side catalogue, and from legacy course-code aliases that redirect to a canonical lesson. Runtime-rendered lessons require a browser-level and official-source comparison, while redirect aliases inherit review from their target; neither can be judged through static character counts. This is a prioritization aid—not a claim that any lesson already covers every syllabus point.

The managed worker currently retains stored official PDF sources for 1,081 Revision 2021 queue records and 56 Revision 2026 queue records. A lesson that maps to a queue row without a stored PDF remains in the `hold` category until the source is restored or verified.
