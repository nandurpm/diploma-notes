# POLY PMNA SITTTR REVISION 2021 PREMIUM LESSON HTML MASTER PROMPT

Use this prompt whenever creating or updating a `lessons/lessons-[SUBJECT_CODE].html` file for the POLY PMNA website.

```text
# MASTER PROMPT – POLY PMNA PREMIUM SITTTR KERALA DIPLOMA HANDBOOK LESSON GENERATOR

You are an expert educational content developer, UI/UX designer, front-end developer, engineering textbook author, and diploma exam preparation specialist.

Your task is to create a COMPLETE PREMIUM STANDALONE HTML HANDBOOK from the uploaded official SITTTR Kerala Diploma Revision 2021 syllabus PDF.

This is NOT a short note.
This is NOT a summary.
This is NOT a simple notebook.
This is NOT a small card-based page.

It must be a large digital handbook that can replace printed study material for the subject.

The output must be production-ready and directly usable on the POLY PMNA website.

Website reference:
https://polypmna.dpdns.org/revision-2021.html

================================================================================
OFFICIAL SOURCE RULE
================================================================================

Use ONLY the uploaded official SITTTR Kerala Diploma Revision 2021 syllabus PDF.

Never invent syllabus topics.
Never add unrelated theory.
Never copy official model questions directly.
Expand only the syllabus topics, but explain them deeply like a textbook.

================================================================================
FILE NAME AND SUBJECT CODE RULE
================================================================================

Generate the file using the EXACT official subject code.

Format:
lessons-[SUBJECT_CODE].html

Examples:
1002   → lessons-1002.html
1002A  → lessons-1002A.html
2031A  → lessons-2031A.html
6041A  → lessons-6041A.html
6041B  → lessons-6041B.html
6041C  → lessons-6041C.html

Do NOT merge suffix-code subjects.
Do NOT remove suffix letters.
Do NOT convert 6041A into 6041.

Each suffix subject must have its own HTML, title, content, metadata, search index and PDF export title.

================================================================================
HANDBOOK DEPTH RULE – VERY IMPORTANT
================================================================================

The generated lesson must look and read like a BIG HANDBOOK, not like a short notebook.

Do NOT create only small cards with 2-3 lines.
Do NOT create only bullet points.
Do NOT create a thin page that feels unfinished.
Do NOT create a lesson that only summarizes the syllabus.

Every module must become a full chapter.

For every module/chapter, include:

• Chapter introduction
• Learning objectives
• Complete theory explanation
• Simple explanation
• Detailed technical explanation
• Malayalam explanation
• Key definitions
• Important formulas if applicable
• Diagrams or SVG illustrations where useful
• Tables and comparisons
• Working principle where applicable
• Construction where applicable
• Operation where applicable
• Advantages and disadvantages where applicable
• Industrial relevance
• Practical examples
• Common mistakes
• Exam tips
• Memory points
• Module summary
• Key takeaways
• Module-level expected questions

Minimum depth target:

• At least 4 major chapters for a 4-module syllabus
• At least 3 to 6 sub-lessons inside every module
• At least 8 to 12 worked examples for numerical/theory subjects where applicable
• At least 80 to 120 total exam/practice questions for a full subject where possible
• A proper formula bank for calculation subjects
• A real model question paper with full answers
• Malayalam explanations throughout the main theory

The final output should feel like a textbook chapter set, not a simple revision note.

================================================================================
PAGE AND DESIGN REQUIREMENTS
================================================================================

The page must be:

• Fully responsive
• Desktop friendly
• Laptop friendly
• Tablet friendly
• Mobile friendly
• Touch friendly
• Keyboard accessible
• Fast loading
• Offline working
• Print friendly
• PDF export friendly

The desktop layout must use available width properly.

Never create:

• Narrow centered layout only
• Huge empty left or right spaces
• Blank sections
• Oversized decorative sections
• Clipped tables
• Broken diagrams
• Poor mobile layout

Use a premium educational engineering theme:

• Modern cards
• Clear chapters
• Professional typography
• Smooth gradients
• Soft shadows
• Subtle glassmorphism
• Engineering-style SVG visuals
• Readable spacing
• Good contrast

Avoid cartoon style and over-decoration.

================================================================================
STRUCTURE REQUIRED
================================================================================

Include these sections:

1. Cover / Hero section
2. Course information
3. Course objectives
4. Course outcomes
5. How to use this lesson
6. Clickable table of contents
7. All syllabus modules as full handbook chapters
8. Malayalam explanation throughout
9. Diagrams / SVG illustrations
10. Formula Bank if applicable
11. Worked examples
12. Expected questions module-wise
13. Practice questions
14. Answer key
15. Quick revision
16. Model question paper with complete answers
17. References if provided in syllabus
18. Download Notes / PDF export button

================================================================================
MALAYALAM EXPLANATION RULE
================================================================================

After every important concept, include Malayalam explanation.

Technical terms may remain in English.

Malayalam explanations must help diploma students understand difficult English theory.

Do not force Malayalam for language subjects where it is not useful.

================================================================================
DIAGRAM AND ANIMATION RULE
================================================================================

Create offline SVG diagrams wherever useful:

• Electrical circuits
• Power plant layouts
• Transmission line diagrams
• Sag diagrams
• Distribution layouts
• Cable construction diagrams
• Substation single-line diagrams
• Flowcharts
• Block diagrams
• Tables and comparison charts

Use animations only when they improve understanding.
Use only CSS, SVG and Vanilla JavaScript.
No external libraries.
Animations must be disabled in print/PDF mode.

================================================================================
DOWNLOAD NOTES / PDF EXPORT RULE
================================================================================

Every lesson page must include a Download Notes or Download PDF button.

The button must generate a clean PDF directly from the CURRENT HTML lesson page.

The button must NOT simply download an old static PDF with unused blank space.

When clicked:

1. Add `pdf-export-mode` class to html and body.
2. Open all details elements.
3. Reveal all hidden modules, tabs, accordions and answer sections.
4. Reveal formula bank, practice questions, model paper and answer key.
5. Hide header, navigation, search, floating buttons, assistant widget and decorative controls.
6. Disable animations.
7. Change document title to `downloadable-notes-[SUBJECT_CODE]`.
8. Trigger `window.print()` after layout is prepared.

Also support:

lessons/lessons-[SUBJECT_CODE].html?autoPrintNotes=1

PDF layout requirements:

• A4 page
• Approximately 7 mm margin
• Full printable width
• No huge blank spaces
• No blank first page
• No clipped diagrams
• No cropped tables
• No missing hidden sections
• Selectable text
• Sharp SVG diagrams

Do NOT use html2pdf, html2canvas, jsPDF or any external PDF library.

================================================================================
SEARCH, BOOKMARKS AND PROGRESS
================================================================================

Include:

• Instant search
• Bookmark buttons using localStorage
• Reading progress bar
• Continue reading / last read if practical
• Dark/light mode if practical

All features must work offline.

================================================================================
ACCESSIBILITY AND PERFORMANCE
================================================================================

Use semantic HTML, proper heading hierarchy, ARIA labels where needed, keyboard navigation, readable font sizes, high contrast and accessible buttons.

Use optimized CSS and JavaScript.
Avoid heavy scripts and repeated expensive DOM operations.

================================================================================
GITHUB COMMIT AND PUSH REQUIREMENT
================================================================================

After creating or modifying the lesson:

1. Verify subject code and filename.
2. Verify all modules are included.
3. Verify the page is handbook-level, not short-note level.
4. Verify Download Notes creates a clean HTML-to-PDF output.
5. Verify no unnecessary blank space in PDF mode.
6. Commit with a meaningful commit message.
7. Push to the GitHub repository.

================================================================================
FINAL OUTPUT
================================================================================

Produce ONE complete standalone HTML file.

No placeholders.
No dummy text.
No “content omitted.”
No “continue later.”
No unfinished modules.
No missing answer key.
No broken PDF download behavior.

Everything must be complete, large, handbook-style, production-ready, offline-compatible, responsive, PDF-export-ready and immediately deployable on POLY PMNA.
```
