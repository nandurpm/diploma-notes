# Quick Overview — English

- Purpose: Upload visitor popup media here (popup-1.png, popup-2.png, popup-1.mp4 etc.). The site shows one popup per day based on available files.

## ലഘു ഗൈഡ് — മലയാളം

- ഉദ്ദേശ്യം: ദർശകർക്കുള്ള പോപ്-അപ് മീഡിയ ഇവിടെ അപ്ലോഡ് ചെയ്യുക. ഫയൽ നാമവിന്യാസം പാലിക്കുക.

# Visitor Popup Upload Folder

Upload popup media files here when you want visitor popups to appear on the website.

Supported ordered popup file names:

1. `popup-1.png`
2. `popup-2.png`
3. `popup-3.png`
4. `popup-1.mp4`
5. `popup-2.mp4`

How it works:

1. The website first checks which of the above popup files actually exist in this folder.
2. Missing files are skipped automatically.
3. Visitors will see one popup per day, 20 seconds after opening the website.
4. The next visit/day shows the next existing popup in the sequence.
5. After the last existing popup, it starts again from the first existing popup.
6. The popup has a close button.
7. If the visitor does not close it, it disappears automatically after 1 minute.
8. Remove or rename all popup files to stop showing popups.

Example:

If only these files exist:

- `popup-1.png`
- `popup-3.png`
- `popup-2.mp4`

The showing order becomes:

1. `popup-1.png`
2. `popup-3.png`
3. `popup-2.mp4`
4. Repeat again from `popup-1.png`

Recommended image size: 1200 × 700 px or 1080 × 1080 px.
Recommended video: MP4, compressed, short duration, preferably below 10 MB for faster loading.
