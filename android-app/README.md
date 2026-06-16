# Polytechnic Study Hub Android App

This folder contains the Android application for:

https://polypmna.dpdns.org/

## Current release

- Version: `1.0.1`
- Application ID: `org.diplomanotes.polytechnicstudyhub`
- Minimum Android version: Android 6.0 (API 23)
- Target SDK: API 35

Version 1.0.1 replaces the original debug-distributed build with a signed release build and fixes the audited WebView and Android API issues:

- Release builds are explicitly non-debuggable through the release build type.
- Back navigation uses `OnBackPressedDispatcher` and `OnBackPressedCallback`.
- Mixed content is blocked with `MIXED_CONTENT_NEVER_ALLOW`.
- WebView file and content access are disabled.
- Deprecated Web SQL database support is not enabled.
- Orientation and screen-size changes preserve the current WebView instance.
- File selection uses `ActivityResultLauncher` instead of `startActivityForResult`.

## App behaviour

- Website pages from `polypmna.dpdns.org` open inside the app.
- External syllabus, Google Drive, email, telephone and other links open in the appropriate external app.
- Secure HTTPS downloads are sent to the Android Downloads folder.
- Back navigation follows WebView history before closing the app.
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

The GitHub Actions workflow builds and verifies a signed release APK. Production signing should use these encrypted repository secrets:

- `ANDROID_KEYSTORE_BASE64`
- `ANDROID_KEYSTORE_PASSWORD`
- `ANDROID_KEY_ALIAS`
- `ANDROID_KEY_PASSWORD`

When no signing secrets are configured, the workflow creates the first private release key and includes it with the release artifact. Download that key once, keep it private, and configure it as the repository secret for every later update. Losing the release key prevents future APKs from updating an installed release.

Build locally with the same signing environment variables and run:

```bash
gradle :app:assembleRelease
```

The signed APK is generated at:

```text
app/build/outputs/apk/release/app-release.apk
```

The workflow verifies both the APK signature and the final merged manifest's non-debuggable status before publishing the artifact. It also retains a Gradle diagnostic log when validation fails.

The old v1.0.0 download was signed as a debug build. Android will not accept a differently signed release APK as an in-place update. Users must uninstall v1.0.0 once before installing v1.0.1. Future versions signed with the preserved v1.0.1 release key will update normally.

Never commit a signing keystore or its passwords to the repository.
