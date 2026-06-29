# Polytechnic Study Hub Android App

This folder contains the Android application for:

https://polypmna.dpdns.org/

## Current source release

- Version: `2.1`
- Application ID: `org.diplomanotes.polytechnicstudyhub`
- Minimum Android version: Android 6.0 (API 23)
- Target SDK: API 35

Version 2.1 updates the native app source for the new website changes:

- Adds **Ask POLY AI** as a separate drawer item.
- Opens Ask POLY directly at `/ask-poly.html`.
- Updates the native app subtitle and launch text to include Ask POLY AI.
- Keeps Revision 2021, Mock Exams, Tools, Question Papers, 2015 Materials, About and Contact available in the drawer.
- Keeps duplicate website headers hidden inside the native WebView shell.
- Keeps the WebView security hardening, trusted-host downloads and deep-link handling from the previous release.

## APK publishing note

The source is ready for the next APK build, but the public update metadata should only point to version 2.1 after a signed APK is built and uploaded to `downloads/`.

A signed production APK must use the existing release key. Do not publish a debug APK as a public update.

## Why the APK is small

The app is intentionally a lightweight WebView client. Lesson pages, notes, question papers, Ask POLY AI and most visual assets remain on the website and are downloaded only when needed. Android System WebView supplies the browser engine, so the APK does not bundle another browser, the full website, PDFs or offline lesson files. A small APK is therefore expected and is not evidence that features are missing.

## App behaviour

- Website pages from `polypmna.dpdns.org` open inside the app.
- Ask POLY AI opens inside the native app shell.
- External syllabus, Google Drive, email, telephone and other approved links open in the appropriate external app.
- Approved secure downloads are sent to the Android Downloads folder.
- Back navigation closes the native drawer first, then follows WebView history before closing the app.
- The offline screen retries the exact failed page or returns to Home.

## Open in Android Studio

1. Open Android Studio.
2. Choose **Open**.
3. Select the `android-app` directory.
4. Allow Gradle synchronization to complete.
5. Run the `app` configuration on a device or emulator.

## Local testing build

From the `android-app` directory, run:

```bash
gradle :app:assembleDebug
```

The debug APK is generated at:

```text
app/build/outputs/apk/debug/app-debug.apk
```

Debug APKs are for local testing only and must not be published as production downloads.

## Signed release build

Production builds must use the private release key created for the earlier release. Configure these encrypted repository secrets:

- `ANDROID_KEYSTORE_BASE64`
- `ANDROID_KEYSTORE_PASSWORD`
- `ANDROID_KEY_ALIAS`
- `ANDROID_KEY_PASSWORD`

Losing or replacing that key prevents Android from accepting a future APK as an update to an already installed release.

Never commit a signing keystore or its passwords to the repository.
