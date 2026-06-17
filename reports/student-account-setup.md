# POLY PMNA Student Account Deployment

The repository now contains a username/password student-account frontend and a secure Firebase Cloud Functions backend.

## What is implemented

- Username and password login without Google login.
- Username availability checking.
- Account creation using:
  - Username
  - Password
  - Confirm Password
  - Kerala district
  - College filtered by district
  - Recovery email
- Recovery-email verification.
- Username-based password-reset requests without exposing the student's email.
- Firebase Authentication password storage. Passwords are never written to Firestore.
- Firestore student profiles and protected username mapping.
- A verified-student Daily Exams page that reads only genuinely published exam documents.
- Existing Help-page anonymous authentication remains supported.

## Required Firebase Console settings

Use the existing Firebase project:

`diploma-notes-comments`

1. Upgrade the project to the Blaze plan so Cloud Functions can be deployed.
2. Open **Authentication → Sign-in method**.
3. Enable **Email/Password**.
4. Keep **Anonymous** enabled because the Help discussion currently uses it.
5. Open **Authentication → Settings → Authorized domains**.
6. Add:
   - `polypmna.dpdns.org`
   - the active GitHub Pages or Cloudflare Pages preview domain used for testing
   - `localhost` for local emulator testing
7. Open **Authentication → Templates** and customize:
   - Email address verification
   - Password reset
8. Set the sender name to `POLY PMNA` or `Polytechnic Study Hub`.

## Install and test

From the repository root:

```bash
npm install -g firebase-tools
firebase login
firebase use diploma-notes-comments
cd functions
npm install
npm run lint
cd ..
firebase emulators:start
```

Open the locally served site through your normal static-site development server. The Firebase emulator configuration is included, but the frontend currently points to production Firebase until emulator connection lines are intentionally enabled.

## Deploy backend and Firestore security

```bash
firebase deploy --only functions,firestore
```

The callable functions deploy to `asia-south1`.

## Deploy website

Publish the repository branch through the existing GitHub Pages or Cloudflare Pages workflow. These new public files must be included:

- `student-account.html`
- `daily-exams.html`
- `assets/css/student-account.css`
- `assets/css/daily-exams.css`
- `assets/js/student-account.js`
- `assets/js/daily-exams.js`
- `assets/data/polytechnic-colleges.json`

## Firestore collections created by the backend

```text
usernames/{normalizedUsername}
users/{firebaseUid}
privateRateLimits/{rateLimitBucket}
```

The client cannot read `usernames` or `privateRateLimits`. All username lookups, registration, login mapping and recovery requests run through callable Cloud Functions.

## Optional production hardening

After verifying the system:

1. Enable Firebase App Check for the web application.
2. Change callable functions to enforce App Check.
3. Configure a Firestore TTL policy for:
   - Collection group: `privateRateLimits`
   - Timestamp field: `expiresAt`
4. Add monitoring and billing-budget alerts.
5. Test verification and password-reset emails on Gmail and non-Gmail addresses.

## College directory

The current directory contains 14 Kerala districts and 113 institution entries based on SITTTR Kerala Government, Aided, Self-Financing and IHRD institution lists reviewed on 17 June 2026.

Review the list before production launch and update both copies together:

- `assets/data/polytechnic-colleges.json`
- `functions/data/polytechnic-colleges.json`

The backend intentionally rejects a district/college pair that does not match its own protected copy.
