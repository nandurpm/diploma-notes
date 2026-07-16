# Automatic new-lesson app notifications

POLY PMNA Android v3.1 includes Firebase Cloud Messaging support. The repository also contains a GitHub Actions workflow that detects newly added lesson HTML files and sends one notification per new lesson.

## Supported lesson paths

Revision 2021:

```text
lessons/lessons-[SUBJECT_CODE].html
```

Revision 2026:

```text
revision-2026-content/lessons/lessons-[SUBJECT_CODE].html
```

Suffix codes are preserved. Examples: `6031A`, `6041C`, `2001A`, `6031P`.

## GitHub repository secrets required

### `FIREBASE_GOOGLE_SERVICES_JSON`

Register the Android application below in the Firebase project:

```text
org.diplomanotes.polytechnicstudyhub
```

Download its `google-services.json` file. Copy the entire JSON content into the GitHub Actions repository secret named:

```text
FIREBASE_GOOGLE_SERVICES_JSON
```

The Android build workflow writes this secret to:

```text
android-app/app/google-services.json
```

The file is never committed to the repository.

### `FIREBASE_SERVICE_ACCOUNT_JSON`

Create a Firebase/Google Cloud service-account private key with permission to send Firebase Cloud Messaging messages. Copy the entire JSON key into the GitHub Actions repository secret named:

```text
FIREBASE_SERVICE_ACCOUNT_JSON
```

The notification workflow uses this secret only during the workflow run and deletes it with the temporary runner.

## Automatic process

1. A new lesson HTML file is committed to `main`.
2. `update-lesson-availability.yml` updates website lesson availability.
3. `notify-new-lessons.yml` detects only newly added lesson files (`git diff --diff-filter=A`).
4. `tools/notify_new_lessons.py` reads the subject code and title from the lesson HTML.
5. A high-priority FCM data message is sent to topic `new-lessons`.
6. Android devices subscribed to that topic display a **New Lessons** notification.
7. Tapping the notification opens the exact lesson URL inside the POLY PMNA native WebView.
8. `notifications/new-lessons-log.json` records the sent item so a manual re-run does not duplicate it.

Editing an existing lesson does not send a new-lesson notification. Only a newly added standard lesson file triggers it.

## Android app behavior

- Android 13 and newer: requests notification permission on first launch.
- Android 8 and newer: uses the `New Lessons` notification channel.
- All installations subscribe to `new-lessons` and `all-users`.
- Notification links are restricted to `https://polypmna.dpdns.org`.
- The notification tap opens either the Revision 2021 or the separate Revision 2026 lesson path.

## Publishing the updated APK

After both secrets are configured, run:

```text
Actions → Build and publish Android app → Run workflow
```

The workflow builds and publishes POLY PMNA Android v3.1 and updates `downloads/app-update.json` so installed users receive the app-update prompt.
