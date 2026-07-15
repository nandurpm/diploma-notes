# Revision 2026 lesson and notes content

This directory is exclusively for SITTTR Kerala Revision 2026 learning content.

Revision 2021 files remain in the existing root folders:

- `/lessons/lessons-[CODE].html`
- `/notes/downloadable-notes-[CODE].pdf`

Revision 2026 files must be added only here:

- `/revision-2026-content/lessons/lessons-[CODE].html`
- `/revision-2026-content/notes/downloadable-notes-[CODE].pdf`

## Automatic website activation

The activation rules are the same as Revision 2021:

1. Add a correctly named lesson HTML file to `revision-2026-content/lessons/`.
2. GitHub Actions detects the subject code and activates **View Lessons** on every matching Revision 2026 subject card.
3. If a valid PDF already exists in `revision-2026-content/notes/`, **Download Notes** downloads that PDF.
4. If the PDF is missing, **Download Notes** opens the Revision 2026 lesson in print/PDF mode and the PDF workflow can generate the missing file.
5. Suffix codes such as `2001A`, `6031P`, `6031T`, `6033A` and `6033D` remain separate files and separate subject cards.

## Important separation rule

Never copy or reuse a Revision 2021 lesson or notes PDF merely because the numeric subject code is the same. For example, Revision 2026 course `1001` must use:

- `revision-2026-content/lessons/lessons-1001.html`
- `revision-2026-content/notes/downloadable-notes-1001.pdf`

It must not use `/lessons/lessons-1001.html` or `/notes/downloadable-notes-1001.pdf`.
