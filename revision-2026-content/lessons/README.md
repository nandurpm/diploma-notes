# Quick Overview — English

- Purpose: Add Revision 2026 lesson HTML files here. Filenames must follow `lessons-[SUBJECT_CODE].html`.
- After commit: GitHub Actions will detect new lessons and enable site links automatically. If PDFs are missing, the site opens the lesson in print mode so a PDF can be created.
- Local preview: start a static server and open the lesson HTML in a browser to check layout and print behaviour.

```bash
python -m http.server 8000
```

## ലഘു ഗൈഡ് — മലയാളം

- ഉദ്ദേശ്യം: Revision 2026-ന് അനുയോജ്യമായ lesson HTML ഫയലുകൾ ഇവിടെ ചേർക്കുക. ഫയൽ നാമം `lessons-[CODE].html` എന്നതായിരിക്കണം.
- commit ചെയ്തശേഷം GitHub Actions പുതുക്കലുകൾ അവതരിപ്പിക്കും. PDF ഇല്ലെങ്കിൽ സൈറ്റ് lesson പിൻവലിച്ച് print mode വഴി PDF സൃഷ്ടിക്കാൻ സത്യവാങ്മൂലം നൽകും.

# Revision 2026 lesson HTML files

Add Revision 2026 lesson pages here using this exact filename format:

`lessons-[SUBJECT_CODE].html`

Examples:

- `lessons-1001.html`
- `lessons-2001C.html`
- `lessons-6031P.html`
- `lessons-6031T.html`
- `lessons-6033D.html`

The subject code and suffix must exactly match the official Revision 2026 code. Do not add `_REV2026` to the filename because this dedicated parent folder already identifies the revision.

After the file is committed, GitHub Actions updates lesson availability automatically. The matching Revision 2026 subject card will show **View Lessons** and **Download Notes**. Until a PDF exists, Download Notes opens the lesson with `?autoPrintNotes=1`.

## How to Add a New Lesson

To add a new lesson file, you only need to create the HTML file with the correct naming convention and ensure it includes the shared runtime script. 

1. Create the HTML file in this directory with the format: `lessons-XXXX.html`
2. Ensure the file contains the shared lesson runtime script before the closing `</body>` tag:
   ```html
   <!-- Shared full-screen lesson standard -->
   <script src="/assets/js/lesson-navigation-fix.js?v=20260725-watermark1" defer></script>
   ```
3. The `lesson-navigation-fix.js` script will automatically detect the page as a lesson and inject the watermark styles and overlay. No manual watermark code is required in your HTML file.

Do not place Revision 2021 lesson files in this folder, and do not copy Revision 2021 content into a Revision 2026 file.
