## 2026-03-25 - Duplicate Module Element IDs in Auto-Generated Syllabus Lessons

**Finding:** `revision-2026-content/lessons/lessons-3421.html` contained duplicate `id="module-1"`, `id="module-2"`, `id="module-3"`, and `id="module-4"` attributes across repeated section blocks.
**Learning:** Automated syllabus conversion or lesson generator scripts may emit duplicate `<section id="module-N">` containers when a course syllabus has multiple module parts or multi-stage topic extracts.
**Prevention:** Always validate element ID uniqueness across auto-generated HTML lesson files using HTML parser scripts to detect and suffix recurring section IDs before publishing.
