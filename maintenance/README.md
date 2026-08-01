# Maintenance Page

The maintenance page displayed to visitors during scheduled maintenance windows.

## Files

| File | Purpose |
|------|---------|
| `index.html` | The maintenance page HTML with branded messaging |
| `runtime-guard.js` | Script that prevents the maintenance page from redirecting away during maintenance windows |

## How It Works

When a maintenance window is active (Thursday 9:00 PM - 9:05 PM IST, or during one-off windows), the following scripts redirect users to this page:

1. **Server-side**: `functions/_middleware.js` (Cloudflare Worker) intercepts requests
2. **Client-side**: `assets/js/maintenance-controller.js` redirects on the browser

The `runtime-guard.js` ensures that once a user is on the maintenance page, they are not redirected away even if the client-side controller re-runs.

## Configuration

Maintenance windows are configured in `assets/js/maintenance-controller.js`. To schedule a new maintenance window, edit the `specialWindow` object in that file.
