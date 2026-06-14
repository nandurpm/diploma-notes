# Polytechnic Study Hub Android App

This folder contains a lightweight Android application for:

https://polypmna.dpdns.org/

## App details

- App name: Polytechnic Study Hub
- Application ID: `org.diplomanotes.polytechnicstudyhub`
- Minimum Android version: Android 6.0 (API 23)
- Target SDK: API 35
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

## Build a debug APK

From the `android-app` directory, run:

```bash
gradle :app:assembleDebug
```

The APK is generated at:

```text
app/build/outputs/apk/debug/app-debug.apk
```

GitHub Actions also builds and uploads the debug APK whenever files under `android-app/` change.

## Play Store release

Before publishing:

1. Create a private release keystore.
2. Keep the keystore and passwords outside the repository.
3. Configure release signing through GitHub encrypted secrets or a local `keystore.properties` file.
4. Increase `versionCode` and update `versionName` for every release.
5. Build an Android App Bundle with:

```bash
gradle :app:bundleRelease
```

Do not commit signing keys or passwords.
