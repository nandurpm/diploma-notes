# POLY PMNA SITTTR REVISION 2021 PREMIUM LESSON HTML MASTER PROMPT

Use this prompt whenever creating a new `lessons/lessons-[SUBJECT_CODE].html` file for the POLY PMNA website.

```text
# MASTER PROMPT – POLY PMNA SITTTR REVISION 2021 PREMIUM LESSON FILE GENERATOR

You are an expert educational content developer, engineering textbook author, UI/UX designer, and front-end developer.

Create a COMPLETE PREMIUM STANDALONE HTML LESSON FILE from the uploaded official SITTTR Kerala Diploma Revision 2021 syllabus PDF.

This is NOT a summary.
This is NOT short notes.
This is NOT a syllabus outline.

It must be a complete digital textbook suitable for diploma students.

The final file must be directly usable on:
https://polypmna.dpdns.org

===============================================================================
WEBSITE CONTEXT
===============================================================================

This lesson file belongs to the POLY PMNA Revision 2021 section.

The main site uses:

Home
About
Revision 2021
Mock Exams
Ask POLY AI
2015 Materials
Tools New
Help

The Revision 2021 page uses department cards.
Each department opens one stable subject viewer.
The subject viewer contains Semester 1 to Semester 6 subject cards.

This lesson page must visually and structurally fit inside that system.

Do not create a design that looks disconnected from POLY PMNA.

===============================================================================
OFFICIAL SOURCE RULE
===============================================================================

Use only the uploaded official SITTTR Kerala Revision 2021 syllabus PDF.

The official source is:
SITTTR Kerala Revision 2021 syllabus page.

Do not invent syllabus topics.
Do not add unrelated content.
Do not copy official model questions directly.
Expand only the topics present in the syllabus.

===============================================================================
FILE NAME RULE
===============================================================================

Generate the HTML file using the EXACT official subject code.

Format:

lessons-[SUBJECT_CODE].html

Examples:

1002   → lessons-1002.html
1002A  → lessons-1002A.html
1002B  → lessons-1002B.html
2031   → lessons-2031.html
2031A  → lessons-2031A.html
6041   → lessons-6041.html
6041A  → lessons-6041A.html
6041B  → lessons-6041B.html
6041C  → lessons-6041C.html

Do NOT merge suffix codes.
Do NOT remove suffix letters.
Do NOT convert 6041A into 6041.

Each suffix code is a separate subject and must have:

Own HTML file
Own title
Own content
Own metadata
Own navigation entry
Own search indexing
Own clean HTML-to-PDF download behavior

===============================================================================
PAGE TYPE
===============================================================================

Create one complete standalone HTML file.

Use only:

HTML
CSS
Vanilla JavaScript
Inline SVG where needed

Do NOT use:

CDN
External JS libraries
External CSS libraries
React
Vue
Angular
Bootstrap JS
jQuery
Online fonts

Everything must work offline.

===============================================================================
DESIGN STYLE
===============================================================================

Design must match a premium POLY PMNA educational website.

Use:

Modern cards
Clean header
Professional typography
Soft gradients
Glassmorphism only where useful
Smooth animations
Rounded sections
Responsive layout
Readable spacing
Engineering textbook feel

Avoid:

Cartoon style
Over-decoration
Huge empty spaces
Narrow centered layout
Poor mobile layout
Unnecessary animations

===============================================================================
DESKTOP LAYOUT RULE
===============================================================================

The page must properly use full desktop width.

Do not create large blank left or right spaces.

Use a professional content layout:

Main content area
Side navigation / module navigator
Responsive cards
Wide tables where useful
Readable but not cramped layout

On mobile, convert to single-column layout.

===============================================================================
HEADER
===============================================================================

Create a sticky header.

Include:

POLY PMNA branding
Subject code
Subject name
Revision 2021 label
Search box
Reading progress
Dark / Light mode toggle
Download PDF / Download Notes button
Back to top button

===============================================================================
DOWNLOAD NOTES / PDF BUTTON – VERY IMPORTANT
===============================================================================

The lesson page must create a Download Notes / Download PDF button that generates a clean PDF from the CURRENT HTML lesson content.

The button must NOT simply link to an old static PDF with unused/blank space.

Required behavior:

1. User clicks Download Notes / Download PDF.
2. The page switches into PDF export mode.
3. All hidden modules, tabs, accordions, details, answer keys, revision sections, formulas, expected questions, and model question paper become visible.
4. Navigation UI, sticky header, assistant widget, floating buttons, search UI, decorative animations, and unnecessary controls are hidden from print/PDF.
5. The page title becomes:
   downloadable-notes-[SUBJECT_CODE]
6. The browser print/download flow opens so the student can save the HTML lesson as a clean PDF.
7. The PDF must have minimum unused space.
8. The print layout must use full A4 width properly.
9. No large blank left/right spaces.
10. No broken hidden sections.
11. No clipped tables or diagrams.
12. No empty cover-only PDF.
13. No narrow centered PDF layout.

Use CSS `@media print` and a dedicated `.pdf-export-mode` class.

Required print CSS rules:

- `@page { size: A4; margin: 7mm; }`
- Hide header/nav/search/buttons/floating UI.
- Force hidden content visible.
- Force grids/cards to print cleanly.
- Set main containers to `width:100%` and `max-width:none`.
- Remove unnecessary shadows and animation.
- Prevent major blank spaces.

Required JavaScript behavior:

- Add click listener to the Download Notes / Download PDF button.
- Add `.pdf-export-mode` to `html` and `body`.
- Open all `details` elements.
- Remove `[hidden]` from all lesson sections.
- Set all tab/panel sections visible.
- Set document title as `downloadable-notes-[SUBJECT_CODE]`.
- Trigger `window.print()` after the content is fully visible.

Do NOT use:

html2pdf
html2canvas
jsPDF
External PDF library
CDN
Old separate static PDF as the primary download

Static PDFs may exist as backup only, but the main lesson download behavior must be HTML-to-clean-PDF.

Subject viewer card rule:

If a lesson HTML file exists, the subject card Download Notes button should open:

lessons/lessons-[SUBJECT_CODE].html?autoPrintNotes=1

This should generate the PDF from the lesson HTML itself.

Examples:

1003 → lessons/lessons-1003.html?autoPrintNotes=1
6041A → lessons/lessons-6041A.html?autoPrintNotes=1
6041B → lessons/lessons-6041B.html?autoPrintNotes=1

===============================================================================
BREADCRUMB
===============================================================================

Add breadcrumb:

Home > Revision 2021 > Department > Semester > Subject

The breadcrumb should visually match the POLY PMNA site.

===============================================================================
COVER SECTION
===============================================================================

Include:

Subject name
Subject code
Semester
Department
Scheme: Revision 2021
Credits
Total hours
Course category
Course type
Beautiful hero section
Engineering-style SVG illustration

===============================================================================
COURSE INFORMATION
===============================================================================

Include:

Course overview
Why this subject is important
Where it is used
Industrial applications
Engineering relevance
Career relevance
Prerequisites
Course objectives
Course outcomes

Use official syllabus data where available.

===============================================================================
HOW TO USE THIS LESSON
===============================================================================

Explain how students should use the lesson:

Read module-wise
Study Malayalam explanation
Practice questions
Use formula bank
Revise quick notes
Attempt model exam
Download PDF if needed

===============================================================================
TABLE OF CONTENTS
===============================================================================

Create clickable table of contents.

Include:

Course overview
Objectives
Outcomes
All modules
Formula bank
Expected questions
Practice questions
Model question paper
Answer key
Quick revision

Smooth scroll must work.

===============================================================================
MODULE STRUCTURE
===============================================================================

Create every module from the uploaded syllabus.

Example:

Module 1
Module 2
Module 3
Module 4
Module 5 if available
Module 6 if available

Do not skip any syllabus module.

Each module must become a complete textbook chapter.

For every module include:

Module title
Module introduction
Learning objectives
Complete explanation
Simple explanation
Detailed technical explanation
Malayalam explanation
Diagrams
Tables
Definitions
Important points
Applications
Industrial examples
Exam tips
Common mistakes
Summary
Key takeaways

===============================================================================
MALAYALAM EXPLANATION
===============================================================================

For every important concept, add Malayalam explanation.

Technical terms may remain in English.

Example style:

Malayalam Explanation:
ഈ ഭാഗം വിദ്യാർത്ഥികൾക്ക് എളുപ്പത്തിൽ മനസ്സിലാകുന്ന രീതിയിൽ വിശദീകരിക്കുക.

Do not force Malayalam sections for language subjects.

===============================================================================
DIAGRAMS AND VISUALS
===============================================================================

Create clean offline SVG diagrams wherever useful.

Examples:

Electrical circuits
Electronic circuits
Mechanical systems
Block diagrams
Flow charts
Signal flow
Logic diagrams
Timing diagrams
Graphs
Tables
Comparison charts
Process diagrams

All visuals must be inside the HTML file.

No image dependency unless explicitly provided.

===============================================================================
ANIMATIONS
===============================================================================

Use animations only when they improve understanding.

Allowed animation examples:

Signal flow
Waveform movement
Motor rotation
Current flow
Logic operation
Communication process
Mechanical motion
Data transfer

Use only CSS, SVG, and Vanilla JavaScript.

Avoid useless decorative animation.

===============================================================================
CALLOUT BOXES
===============================================================================

Add useful callout boxes:

Important
Remember
Exam Tip
Definition
Formula
Warning
Industrial Note
Practical Note
Common Mistake

===============================================================================
WORKED EXAMPLES
===============================================================================

Include solved examples where applicable.

For numerical subjects include:

Given
Formula
Substitution
Calculation
Final answer
Unit

For theory subjects include:

Question
Structured answer
Important keywords
Exam writing style

===============================================================================
FORMULA BANK
===============================================================================

Include Formula Bank if the subject needs formulas.

For each formula include:

Formula
Meaning
Variables
Units
Usage
Example

Skip Formula Bank for language subjects.

===============================================================================
EXPECTED QUESTIONS
===============================================================================

For every module generate:

2 mark questions
5 mark questions
10 mark questions
15 mark questions

Questions must match syllabus scope.

Do not add out-of-syllabus questions.

===============================================================================
PRACTICE QUESTIONS
===============================================================================

Include:

MCQ
True or False
Fill in the blanks
Match the following
Short answer
Long answer
Numerical problems if applicable
Case study questions

===============================================================================
ANSWER KEY
===============================================================================

Provide answers for all practice questions.

Do not leave answers incomplete.

===============================================================================
QUICK REVISION
===============================================================================

Create:

One-page revision
Important definitions
Important formulas
Important diagrams
Important tables
Module-wise summary
Last-minute exam notes

===============================================================================
MODEL QUESTION PAPER
===============================================================================

Generate a complete model examination.

Follow the official SITTTR Kerala Revision 2021 model question paper pattern for that subject code.

Follow only:

Question structure
Marks distribution
Section order
Exam style

Do NOT copy official questions.

Generate original questions from the syllabus.

Provide complete answers after the question paper.

===============================================================================
SEARCH FUNCTION
===============================================================================

Add instant search.

Search should find:

Topics
Definitions
Formulas
Examples
Questions
Module names

Highlight search results.

===============================================================================
READING PROGRESS
===============================================================================

Add reading progress bar.

Use localStorage to remember progress.

===============================================================================
LAST READ SECTION
===============================================================================

Use localStorage to remember the last opened module/topic.

Show “Continue Reading” button.

===============================================================================
BOOKMARKS
===============================================================================

Allow users to bookmark important sections.

Store bookmarks using localStorage.

===============================================================================
PRINT SUPPORT
===============================================================================

Add print-friendly CSS.

Use @media print.

Hide unnecessary UI during print.

Keep content clean and readable.

The print/PDF output must be treated as the official downloadable notes version.

===============================================================================
ACCESSIBILITY
===============================================================================

Use:

Semantic HTML
Proper headings
ARIA labels
Keyboard navigation
Readable contrast
Alt text for diagrams
Accessible buttons

===============================================================================
PERFORMANCE
===============================================================================

The page must load fast.

Use optimized CSS and JavaScript.

Do not create heavy scripts.

Avoid unnecessary effects.

===============================================================================
SUBJECT CARD / INDEX COMPATIBILITY
===============================================================================

The lesson file must be compatible with the POLY PMNA Revision 2021 subject viewer.

Use metadata in the HTML:

Subject code
Subject name
Department
Semester
Revision 2021
Lesson filename
HTML-to-PDF download filename

Suffix subjects must be indexed separately.

Example:

6041A Medical Electronics
lessons-6041A.html
downloadable-notes-6041A.pdf generated from HTML export mode

Do not list it as 6041.

===============================================================================
CONTENT QUALITY
===============================================================================

The final lesson must feel like a professionally authored engineering textbook.

Avoid AI-style shallow explanations.

Every syllabus point must be expanded into useful study material.

Students should be able to study the full subject using this single HTML lesson file.

===============================================================================
FINAL OUTPUT
===============================================================================

Produce one complete standalone HTML file.

No placeholders.
No dummy text.
No “content omitted.”
No “continue later.”
No unfinished sections.

The file must be complete, polished, responsive, offline-compatible, PDF-export-ready, and ready to deploy on POLY PMNA.
```
