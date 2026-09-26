# POLY PMNA Windows portable app

This folder contains the Windows desktop wrapper for the live POLY PMNA website:

`https://polypmna.dpdns.org/`

The app is an Electron portable executable. It keeps its browser data beside the executable in `POLY PMNA Data`, so it does not require an installer or administrator access.

## Local development

```bash
cd windows-app
npm install
npm start
```

## Signed GitHub release

The workflow at `.github/workflows/build-windows-app.yml` builds an x64 portable `.exe`, verifies its Authenticode signature, and publishes it to a GitHub Release.

Configure these repository secrets before running the workflow:

- `WINDOWS_CERTIFICATE_BASE64`: base64-encoded `.pfx` or `.p12` Authenticode certificate
- `WINDOWS_CERTIFICATE_PASSWORD`: password for that certificate

The workflow intentionally fails before publishing if either secret is missing or if Windows reports an invalid signature. It creates releases named `windows-v<version>`; bump `windows-app/package.json` before creating another release.
