# MASTER PROMPT – POLY PMNA SITTTR REVISION 2021 PREMIUM LESSON FILE GENERATOR

Use this prompt whenever a new POLY PMNA Revision 2021 lesson file is created from an official SITTTR Kerala syllabus PDF.

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

The main site uses this navigation:

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

The official source is the SITTTR Kerala Revision 2021 syllabus page.

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
Own PDF link
Own metadata
Own navigation entry
Own search indexing

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
PDF-READY LAYOUT RULE
===============================================================================

The HTML must be designed so it can be converted into a clean downloadable PDF without unused blank space.

The PDF output must:

Use A4 page width properly
Avoid large empty left/right margins
Avoid empty pages
Avoid half-empty pages where possible
Avoid cards or sections creating unnecessary page gaps
Allow long sections to split naturally across pages
Keep tables readable inside A4 width
Keep diagrams inside page width
Open all hidden/tabbed/module content during PDF generation
Avoid fixed-height hero sections in print/PDF mode
Avoid sticky/fixed elements in print/PDF mode
Hide navigation, buttons, search, back button, assistant widgets, and decorative controls in print/PDF mode

Use @media print and .pdf-export-mode styles so the generated PDF is compact, clean, and student-friendly.

Do not depend on browser window.print() for the Download Notes button.
The website already builds downloadable PDF notes from lesson HTML.
The HTML must be compatible with that build system.

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
Download Notes button
Back to top button

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

Do not make the hero section too tall.
It must not create wasted PDF space.

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
Use Download Notes for offline PDF study

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

Disable animations in print/PDF mode.

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
DOWNLOAD NOTES / PDF BUTTON RULE
===============================================================================

Add a Download Notes button, not a fake print button.

The button must directly link to:

../notes/downloadable-notes-[SUBJECT_CODE].pdf

or the correct relative path from the lesson file.

Examples:

../notes/downloadable-notes-1002.pdf
../notes/downloadable-notes-6041A.pdf

The button text should be:

Download Notes

The button behavior must match the POLY PMNA subject cards:

If the PDF exists, clicking Download Notes downloads/opens the PDF directly.
If the PDF is not yet generated, the website may fall back to opening the lesson HTML for PDF generation/printing.

Do NOT use:

window.print()
html2pdf
html2canvas
jsPDF
Browser-side PDF generation
Fake PDF buttons
Dead links

The lesson HTML must be PDF-build friendly so the website/server/build script can generate:

notes/downloadable-notes-[SUBJECT_CODE].pdf

The generated PDF must not contain unused blank space.

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

Show Continue Reading button.

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
Do not create empty pages or large unused spaces.

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
PDF filename
Lesson filename

Suffix subjects must be indexed separately.

Example:

6041A Medical Electronics
lessons-6041A.html
notes/downloadable-notes-6041A.pdf

Do not list it as 6041.

===============================================================================
CONTENT QUALITY
===============================================================================

The final lesson must feel like a professionally authored engineering textbook.

Avoid AI-style shallow explanations.
Every syllabus point must be expanded into useful study material.

Students should be able to study the full subject using this single HTML lesson file and the generated Download Notes PDF.

===============================================================================
FINAL OUTPUT
===============================================================================

Produce one complete standalone HTML file.

No placeholders.
No dummy text.
No “content omitted.”
No “continue later.”
No unfinished sections.

The file must be complete, polished, responsive, offline-compatible, PDF-build friendly, and ready to deploy on POLY PMNA.
```
