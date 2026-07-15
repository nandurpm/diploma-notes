# POLY PMNA Android App

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
- A matching Revision 2021 code cannot be used as a Revision 2026 handbook or PDF.
- Adds trusted Android DownloadManager handling for Revision 2026 notes PDFs.
- Improves active drawer highlighting for department and lesson pages.
- Enables WebView database storage and normal cache mode while preserving the exact-page offline retry screen.
- Opens approved SITTTR, Google Drive and GitHub links through the appropriate external app.
- Keeps Ask POLY AI, Mock Exams, Tools, Question Papers, 2015 Materials, About and Contact.

## Content separation

Revision 2021 assets:

- `/lessons/lessons-[CODE].html`
- `/notes/downloadable-notes-[CODE].pdf`

Revision 2026 assets:

- `/revision-2026-content/lessons/lessons-[CODE].html`
- `/revision-2026-content/notes/downloadable-notes-[CODE].pdf`

The APK does not bundle or copy Revision 2021 lessons into Revision 2026. It opens the corresponding website files only when they exist in the correct revision folder.

## Build locally

From the repository root:

```bash
gradle -p android-app :app:assembleDebug --no-daemon
```

Debug APK output:

```text
android-app/app/build/outputs/apk/debug/app-debug.apk
```

## Signed public release

A public update must use the existing release signing key. Configure these encrypted GitHub Actions secrets:

- `ANDROID_KEYSTORE_BASE64`
- `ANDROID_KEYSTORE_PASSWORD`
- `ANDROID_KEY_ALIAS`
- `ANDROID_KEY_PASSWORD`

Never commit the signing keystore or passwords. Replacing the original key prevents Android from installing the new APK as an update over the existing app.
