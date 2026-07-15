#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def replace(path: str, old: str, new: str, *, required: bool = True) -> None:
    target = ROOT / path
    text = target.read_text(encoding="utf-8")
    if old not in text:
        if required:
            raise RuntimeError(f"Expected text not found in {path}: {old[:100]!r}")
        return
    target.write_text(text.replace(old, new), encoding="utf-8")


def write(path: str, content: str) -> None:
    target = ROOT / path
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(content, encoding="utf-8")


def patch_website() -> None:
    replace(
        "assets/js/revision-2026-browser.js",
        'const VERSION = "20260716-rev2026-match-2021";',
        'const VERSION = "20260716-rev2026-dedicated-content";',
    )
    replace(
        "assets/js/revision-2026-browser.js",
        'const lesson = `/lessons/lessons-${encodeURIComponent(code)}_REV2026.html`;',
        'const lesson = `/revision-2026-content/lessons/lessons-${encodeURIComponent(code)}.html`;',
    )
    replace(
        "assets/js/revision-2026-browser.js",
        'const notes = `/notes/downloadable-notes-${encodeURIComponent(code)}_REV2026.pdf`;',
        'const notes = `/revision-2026-content/notes/downloadable-notes-${encodeURIComponent(code)}.pdf`;',
    )

    replace(
        "tools/build_revision_2026_pages.py",
        'VERSION = "20260716-rev2026-match-2021"',
        'VERSION = "20260716-rev2026-dedicated-content"',
    )
    replace(
        "tools/build_revision_2026_pages.py",
        'return Path("lessons") / f"lessons-{code}_REV2026.html"',
        'return Path("revision-2026-content/lessons") / f"lessons-{code}.html"',
    )
    replace(
        "tools/build_revision_2026_pages.py",
        'return Path("notes") / f"downloadable-notes-{code}_REV2026.pdf"',
        'return Path("revision-2026-content/notes") / f"downloadable-notes-{code}.pdf"',
    )
    replace(
        "tools/build_revision_2026_pages.py",
        'lesson_url = f"/lessons/lessons-{esc(code)}_REV2026.html"',
        'lesson_url = f"/revision-2026-content/lessons/lessons-{esc(code)}.html"',
    )
    replace(
        "tools/build_revision_2026_pages.py",
        'notes_url = f"/notes/downloadable-notes-{esc(code)}_REV2026.pdf"',
        'notes_url = f"/revision-2026-content/notes/downloadable-notes-{esc(code)}.pdf"',
    )

    replace(
        "tools/build_lesson_pdfs.py",
        'REPORTS = ROOT / "reports"\nMIN_VALID_PDF_BYTES',
        'REPORTS = ROOT / "reports"\nREPORT_FILENAME = "lesson-notes-pdf-build.json"\nMIN_VALID_PDF_BYTES',
    )
    replace(
        "tools/build_lesson_pdfs.py",
        '(REPORTS / "lesson-notes-pdf-build.json").write_text',
        '(REPORTS / REPORT_FILENAME).write_text',
    )

    write(
        "tools/build_missing_revision_2026_lesson_pdfs.py",
        '''from __future__ import annotations

import re
from pathlib import Path

import build_lesson_pdfs as builder

ROOT = Path.cwd()
LESSONS = ROOT / "revision-2026-content" / "lessons"
NOTES = ROOT / "revision-2026-content" / "notes"


def lesson_files() -> list[tuple[str, Path]]:
    items: list[tuple[str, Path]] = []
    if not LESSONS.exists():
        return items
    for path in sorted(LESSONS.glob("lessons-*.html")):
        match = re.fullmatch(r"lessons-([0-9]+[A-Za-z]*)\\.html", path.name)
        if match:
            items.append((match.group(1).upper(), path))
    return items


def valid_pdf(path: Path) -> bool:
    return path.exists() and path.stat().st_size >= builder.MIN_VALID_PDF_BYTES


def main() -> None:
    NOTES.mkdir(parents=True, exist_ok=True)
    pending: list[tuple[str, Path]] = []
    for code, lesson in lesson_files():
        output = NOTES / f"downloadable-notes-{code}.pdf"
        if not valid_pdf(output):
            pending.append((code, lesson))

    print(f"Revision 2026 lesson HTML files found: {len(lesson_files())}")
    print(f"Revision 2026 PDFs to build: {len(pending)}")

    builder.LESSONS = LESSONS
    builder.NOTES = NOTES
    builder.REPORT_FILENAME = "revision-2026-lesson-notes-pdf-build.json"
    builder.PRESERVE_EXISTING_PDF_CODES = set()
    builder.lesson_files = lambda: pending
    builder.main()


if __name__ == "__main__":
    main()
''',
    )

    replace(
        "lessons.html",
        "Revision 2026 subjects are searchable, but dedicated 2026 handbooks and notes are published separately when ready.",
        "Revision 2026 handbooks and notes are published only from the dedicated Revision 2026 content folders.",
    )
    replace(
        "lessons.html",
        "Selecting Revision 2026 clearly shows that dedicated handbooks are not yet published instead of mixing 2021 material into the new scheme.",
        "Revision 2026 lesson files activate automatically from revision-2026-content/lessons without reusing Revision 2021 material.",
    )


def patch_android() -> None:
    main_activity = "android-app/app/src/main/java/org/diplomanotes/polytechnicstudyhub/MainActivity.java"
    replace(
        main_activity,
        'bindNavigation(R.id.navHome, "/");\n        bindNavigation(R.id.navRevision2021, "/revision-2021.html");',
        'bindNavigation(R.id.navHome, "/");\n        bindNavigation(R.id.navRevision2026, "/revision-2026.html");\n        bindNavigation(R.id.navRevision2021, "/revision-2021.html");',
    )
    replace(
        main_activity,
        'version.setText("Version " + BuildConfig.VERSION_NAME + "  •  Ask POLY AI ready");',
        'version.setText("Version " + BuildConfig.VERSION_NAME + "  •  REV2026 content ready");',
    )
    replace(
        main_activity,
        'settings.setDomStorageEnabled(true);',
        'settings.setDomStorageEnabled(true);\n        settings.setDatabaseEnabled(true);\n        settings.setCacheMode(WebSettings.LOAD_DEFAULT);',
    )
    replace(
        main_activity,
        'entry.getKey().setActivated(entry.getValue().equals(currentPath));',
        'entry.getKey().setActivated(pathMatches(currentPath, entry.getValue()));',
    )
    replace(
        main_activity,
        '    private void configureBackNavigation() {',
        '''    private boolean pathMatches(String currentPath, String targetPath) {
        if ("/revision-2026.html".equals(targetPath)) {
            return "/revision-2026.html".equals(currentPath)
                    || currentPath.startsWith("/revision-2026/")
                    || currentPath.startsWith("/revision-2026-content/");
        }
        if ("/revision-2021.html".equals(targetPath)) {
            return "/revision-2021.html".equals(currentPath)
                    || currentPath.startsWith("/revision-2021/")
                    || currentPath.startsWith("/lessons/")
                    || currentPath.startsWith("/notes/");
        }
        return targetPath.equals(currentPath);
    }

    private void configureBackNavigation() {''',
    )
    replace(
        main_activity,
        'path.startsWith("/notes/")\n                            || path.startsWith("/downloads/")',
        'path.startsWith("/notes/")\n                            || path.startsWith("/revision-2026-content/notes/")\n                            || path.startsWith("/downloads/")',
    )

    layout = "android-app/app/src/main/res/layout/activity_main.xml"
    replace(
        layout,
        '''                <TextView
                    android:id="@+id/navRevision2021"
                    style="@style/DrawerMenuItem"
                    android:drawableStart="@drawable/ic_book"
                    android:text="@string/nav_revision_2021" />''',
        '''                <TextView
                    android:id="@+id/navRevision2026"
                    style="@style/DrawerMenuItem"
                    android:drawableStart="@drawable/ic_book"
                    android:text="@string/nav_revision_2026" />

                <TextView
                    android:id="@+id/navRevision2021"
                    style="@style/DrawerMenuItem"
                    android:drawableStart="@drawable/ic_book"
                    android:text="@string/nav_revision_2021" />''',
    )
    replace(layout, 'android:text="Ask POLY"', 'android:text="REV 2026"')
    replace(layout, 'android:text="Mock"', 'android:text="REV 2021"')
    replace(layout, 'android:text="Tools"', 'android:text="POLY AI"')

    strings = "android-app/app/src/main/res/values/strings.xml"
    replace(
        strings,
        '<string name="app_subtitle">Revision 2021 • Ask POLY AI • Mock Exams</string>',
        '<string name="app_subtitle">Revision 2026 &amp; 2021 • Ask POLY AI</string>',
    )
    replace(
        strings,
        '<string name="loading_subtitle">Revision 2021, Ask POLY AI, Mock Exams, notes and student tools</string>',
        '<string name="loading_subtitle">Revision 2026 and 2021 syllabus, lessons, notes, Ask POLY AI and mock exams</string>',
    )
    replace(
        strings,
        '<string name="nav_revision_2021">Revision 2021</string>',
        '<string name="nav_revision_2026">Revision 2026</string>\n    <string name="nav_revision_2021">Revision 2021</string>',
    )

    gradle = "android-app/app/build.gradle"
    replace(gradle, "// Build trigger: publish POLY PMNA Android app v2.01 with Ask POLY AI", "// Build trigger: POLY PMNA Android app v3.0 with separate REV2026 content")
    replace(gradle, "versionCode 8", "versionCode 9")
    replace(gradle, "versionName '2.01'", "versionName '3.0'")

    workflow = ".github/workflows/build-android-app.yml"
    replace(workflow, "POLY_PMNA_v2.01_debug_apk", "POLY_PMNA_v3.0_debug_apk")
    replace(workflow, "downloads/POLY_PMNA_v2.01.apk", "downloads/POLY_PMNA_v3.0.apk")
    replace(workflow, '"versionCode": 8', '"versionCode": 9')
    replace(workflow, '"versionName": "2.01"', '"versionName": "3.0"')
    replace(workflow, '"apkUrl": "/downloads/POLY_PMNA_v2.01.apk"', '"apkUrl": "/downloads/POLY_PMNA_v3.0.apk"')
    replace(workflow, '"publishedAt": "2026-06-29"', '"publishedAt": "2026-07-16"')
    replace(workflow, '"title": "POLY PMNA Android app 2.01"', '"title": "POLY PMNA Android app 3.0"')
    replace(
        workflow,
        '"message": "Updated Android app includes Ask POLY AI in the left sidebar and refreshed website sections."',
        '"message": "Major update adds Revision 2026 navigation and fully separates 2026 lessons and notes from Revision 2021."',
    )
    replace(
        workflow,
        '''              "Added Ask POLY AI as a separate drawer item.",
              "Updated drawer order to match the website navigation.",
              "Updated launch text and version label for Ask POLY AI.",
              "Kept Revision 2021, Mock Exams, Tools, Question Papers, 2015 Materials, About and Contact available."''',
        '''              "Added Revision 2026 as a separate native drawer destination.",
              "Added support for dedicated Revision 2026 lesson and notes folders.",
              "Prevented Revision 2026 subject codes from opening Revision 2021 content.",
              "Improved nested department and lesson deep-link highlighting.",
              "Updated WebView cache and trusted Revision 2026 PDF download handling."''',
    )
    replace(workflow, "POLY_PMNA_v2.01_signed_apk", "POLY_PMNA_v3.0_signed_apk")
    replace(workflow, 'git commit -m "Publish Android app v2.01"', 'git commit -m "Publish Android app v3.0"')

    write(
        "android-app/README.md",
        '''# POLY PMNA Android App

This folder contains the Android WebView application for:

https://polypmna.dpdns.org/

## Current source release

- Version: `3.0`
- Version code: `9`
- Application ID: `org.diplomanotes.polytechnicstudyhub`
- Minimum Android version: Android 6.0 (API 23)
- Target SDK: API 35

## Version 3.0 major update

- Adds **Revision 2026** as a dedicated native drawer destination.
- Keeps **Revision 2021** as a separate destination for legacy batches.
- Supports nested Revision 2026 department pages and dedicated lesson/notes paths.
- Revision 2026 lesson HTML files load only from `/revision-2026-content/lessons/`.
- Revision 2026 notes PDFs load only from `/revision-2026-content/notes/`.
- A matching Revision 2021 code can never be used as a Revision 2026 handbook or PDF.
- Adds trusted Android DownloadManager handling for Revision 2026 notes PDFs.
- Improves active drawer highlighting for department pages and lesson pages.
- Enables WebView database storage and standard cache mode while retaining the exact-page offline retry screen.
- Keeps Ask POLY AI, Mock Exams, Tools, Question Papers, 2015 Materials, About and Contact.

## APK publishing

The GitHub workflow always builds a debug APK for testing. A public update is published only through a manually requested signed release build using the existing release key.

Required encrypted repository secrets:

- `ANDROID_KEYSTORE_BASE64`
- `ANDROID_KEYSTORE_PASSWORD`
- `ANDROID_KEY_ALIAS`
- `ANDROID_KEY_PASSWORD`

Never commit the signing keystore or passwords.

## Local build

From the repository root:

```bash
gradle -p android-app :app:assembleDebug --no-daemon
```

Output:

```text
android-app/app/build/outputs/apk/debug/app-debug.apk
```
''',
    )


def main() -> None:
    patch_website()
    patch_android()
    print("Applied dedicated Revision 2026 content paths and Android app v3.0 migration.")


if __name__ == "__main__":
    main()
