# Revision 2026 lesson content

This directory is exclusively for SITTTR Kerala Revision 2026 learning content.

Revision 2021 lesson files remain in the existing root folder:

- `/lessons/lessons-[CODE].html`

Revision 2026 lesson files must be added only here:

- `/revision-2026-content/lessons/lessons-[CODE].html`

## Automatic website activation

The activation rules are the same as Revision 2021:

1. Add a correctly named lesson HTML file to `revision-2026-content/lessons/`.
2. GitHub Actions detects the subject code and activates **View Lessons** on every matching Revision 2026 subject card.
3. **Save as PDF** opens the matching Revision 2026 lesson in print mode.
4. Students can use the browser or app print/share menu to save a local PDF copy for offline study.
5. Suffix codes such as `2001A`, `6031P`, `6031T`, `6033A` and `6033D` remain separate files and separate subject cards.

## Important separation rule

Never copy or reuse a Revision 2021 lesson merely because the numeric subject code is the same. For example, Revision 2026 course `1001` must use:

- `revision-2026-content/lessons/lessons-1001.html`

It must not use `/lessons/lessons-1001.html`.
