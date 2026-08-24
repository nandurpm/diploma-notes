# POLY PMNA Android App

This folder contains the Android WebView application for:

https://polypmna.dpdns.org/

## Current source release

- Version: `3.13`
- Version code: `22`
- Application ID: `org.diplomanotes.polytechnicstudyhub`
- Minimum Android version: Android 6.0 (API 23)
- Target SDK: API 35

## Version 3.13 signed release

- Publishes the public APK only as a signed release build (`POLY_PMNA_v3.13.apk`).
- Makes the homepage Android download/update button target the GitHub Release APK for version 3.13.
- The internal `versionName`/`versionCode` in `build.gradle` match the release asset name and `downloads/app-update.json`.
- Existing Android app users on an older version see an in-app update button on the homepage.
- Adds **Revision 2026** as a dedicated native drawer destination.
- Keeps **Revision 2021** as a separate destination for legacy batches.
- Supports nested Revision 2026 department pages and dedicated lesson/notes paths.
- Revision 2026 lesson HTML files load only from `/revision-2026-content/lessons/`.
- Revision 2026 notes PDFs load only from `/revision-2026-content/notes/`.
- A matching Revision 2021 code cannot be used as a Revision 2026 handbook or PDF.
- Adds trusted Android DownloadManager handling for Revision 2026 notes PDFs.
- Improves active drawer highlighting for department and lesson pages.
- Enables WebView database storage and normal cache mode while preserving the exact-page offline retry screen.
- Clears the WebView HTTP cache once on an APK version change so security-critical website JavaScript updates are loaded without clearing cookies, sessions, or local storage.
- Adds a native Kotlin force-update gate before WebView content is loaded: it validates the HTTPS update manifest, compares `versionCode`, blocks outdated APKs with a non-dismissible update screen, downloads only allowlisted HTTPS release assets, verifies the manifest SHA-256, and hands the verified APK to Android’s package installer.
- The native gate fails closed when the update policy cannot be verified; users can retry or exit, but cannot bypass the gate into the WebView.
- Because updates are distributed outside Google Play, Android may require the user to enable **Allow from this source** for POLY PMNA before the verified APK can be installed.
- Opens approved SITTTR, Google Drive and GitHub links through the appropriate external app.
- Keeps Ask POLY AI, Mock Exams, Tools, Question Papers, 2015 Materials, About and Contact.
- Re-registers for Firebase lesson-notification topics from the main app activity as well as the notification bootstrap activity.

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
gradle -p android-app :app:assembleRelease --no-daemon \
  -PANDROID_KEYSTORE_FILE=/path/to/release.keystore \
  -PANDROID_KEYSTORE_PASSWORD=... \
  -PANDROID_KEY_ALIAS=... \
  -PANDROID_KEY_PASSWORD=...
```

Signed release APK output:

```text
android-app/app/build/outputs/apk/release/app-release.apk
```

## Signed public release

A public update must use the existing release signing key. Configure these encrypted GitHub Actions secrets:

- `ANDROID_KEYSTORE_BASE64`
- `ANDROID_KEYSTORE_PASSWORD`
- `ANDROID_KEY_ALIAS`
- `ANDROID_KEY_PASSWORD`

Never commit the signing keystore or passwords. Replacing the original key prevents Android from installing the new APK as an update over the existing app.

## Force-update rollout

The gate blocks only when the live manifest contains both `forceUpdate: true` and a `versionCode` greater than the installed APK. To require an update from a previously released APK, publish a new signed APK whose native policy includes the desired minimum version or raise the remote policy after the new APK is available. The Android package installer still verifies the APK signature; the manifest SHA-256 is an additional integrity check and is not a replacement for Android signing.
