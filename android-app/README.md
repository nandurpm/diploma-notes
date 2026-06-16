# Polytechnic Study Hub Android App

This folder contains the Android application for:

https://polypmna.dpdns.org/

## Current release

- Version: `1.0.2`
- Application ID: `org.diplomanotes.polytechnicstudyhub`
- Minimum Android version: Android 6.0 (API 23)
- Target SDK: API 35

Version 1.0.2 adds a polished native Android shell around the website:

- Branded blue-to-cyan launch screen instead of a blank white screen.
- Native top app bar with menu, page title and refresh controls.
- Slide-out navigation drawer for Home, Revision 2021, Lessons, Study Materials, Syllabus, question papers, 2015 materials, About and Contact.
- Loading feedback while the website is opening.
- Active menu highlighting and WebView-aware Android back navigation.
- Automatic online update notification through `downloads/app-update.json`.

The security and compatibility fixes from v1.0.1 remain enabled:

- Release builds are non-debuggable.
- Back navigation uses `OnBackPressedDispatcher` and `OnBackPressedCallback`.
- Mixed content is blocked with `MIXED_CONTENT_NEVER_ALLOW`.
- WebView file and content access are disabled.
- Deprecated Web SQL database support is not enabled.
- Orientation and screen-size changes preserve the current WebView instance.
- File selection uses `ActivityResultLauncher` instead of `startActivityForResult`.

## Why the APK is small

The app is intentionally a lightweight WebView client. Lesson pages, notes, question papers and most visual assets remain on the website and are downloaded only when needed. Android System WebView supplies the browser engine, so the APK does not bundle another browser, the full website, PDFs or offline lesson files. A small APK is therefore expected and is not evidence that features are missing.

## App behaviour

- Website pages from `polypmna.dpdns.org` open inside the app.
- External syllabus, Google Drive, email, telephone and other links open in the appropriate external app.
- Secure HTTPS downloads are sent to the Android Downloads folder.
- Back navigation closes the native drawer first, then follows WebView history before closing the app.
- An offline fallback page is included.

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

Production builds must use the private release key created for v1.0.1. Configure these encrypted repository secrets:

- `ANDROID_KEYSTORE_BASE64`
- `ANDROID_KEYSTORE_PASSWORD`
- `ANDROID_KEY_ALIAS`
- `ANDROID_KEY_PASSWORD`

Losing or replacing that key prevents Android from accepting a future APK as an update to an installed v1.0.1 or v1.0.2 release.

Never commit a signing keystore or its passwords to the repository.
