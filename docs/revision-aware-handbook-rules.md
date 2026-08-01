# POLY PMNA Revision-Aware Handbook Rules

These rules apply to every standalone HTML student handbook and generated sample question paper.

## Mandatory source identity

Every generated handbook must record:

- Curriculum revision, such as `2021` or `2026`
- Exact official subject code, including suffix letters
- Official subject name
- Programme/department
- Semester
- Official syllabus PDF URL or source reference
- Official model question paper URL or source reference, when available
- Source verification date

## Non-mixing rule

Content from different curriculum revisions must never be combined. Course outcomes, modules, hours, credits, cognitive levels, practical exercises and question-paper structure must come only from the official source for the selected revision.

## File identity

Existing public filenames remain compatible:

- `lessons/lessons-[SUBJECT_CODE].html`
- `notes/downloadable-notes-[SUBJECT_CODE].pdf`

The HTML must also contain revision metadata. A subject with the same code in two revisions must not overwrite the earlier handbook. Before publishing such a case, introduce a revision-qualified storage path or generated alias.

## Required handbook metadata

Use machine-readable metadata similar to:

```html
<meta name="poly-pmna-revision" content="2021">
<meta name="poly-pmna-subject-code" content="6031A">
<meta name="poly-pmna-source-type" content="official-sitttr-syllabus">
```

The visible cover must show:

- Subject name and exact code
- Programme and semester
- Curriculum revision
- Credits and total hours from the selected official PDF
- Course category/type

## Course outcomes and modules

Extract course outcomes and module structure only from the selected official syllabus PDF. Preserve:

- CO numbering and wording
- Module numbering and titles
- Theory/practical hours
- CO-module mapping
- Cognitive levels, where provided
- Practical exercises, laboratory tasks or menu/workshop requirements

Do not infer missing official values. Mark them as not specified.

## Question paper rules

Do not change the sample question paper pattern merely because a new curriculum revision exists. Update the generated structure only after an official model question paper confirms a changed pattern.

Record separately:

- Revision
- Maximum marks
- Duration
- Part/section structure
- Number of questions
- Choice pattern
- Mark distribution
- CO or cognitive-level mapping, when officially shown

## Material-change triggers

Regenerate or review a handbook only when at least one of these changes:

- Subject code or suffix
- Curriculum revision/version
- Official syllabus PDF or its substantive content
- Subject name tied to the same code/revision
- Course outcomes
- Module topics or sequence
- Theory/practical hours, credits or course category
- Official model question paper structure

Ignore cosmetic website changes, navigation changes, logos, CSS changes and PDF layout-only changes.

## REV 2026 publication guard

REV 2026 subjects must not be published in the subject database until each subject code and official PDF is verified. Existing REV 2021 handbooks must not be overwritten or relabelled as REV 2026.
