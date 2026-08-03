# Quick Overview — English

- Purpose: Contains the maintenance landing page and runtime guard used during scheduled maintenance windows.
- To change schedule: edit `assets/js/maintenance-controller.js` and coordinate Deployment.

## ലഘു ഗൈഡ് — മലയാളം

- ഉദ്ദേശ്യം: മെയിന്റനൻസ് സമയത്ത് കാണിക്കുന്ന പേജ്, അതിന്റെ സ്‌ക്രിപ്റ്റുകൾ എന്നിവ ഇവിടെ സൂക്ഷിക്കുന്നു. ഷെഡ്യൂൾ മാറ്റാൻ `assets/js/maintenance-controller.js` ഞങ്ങൾ എഡിറ്റ് ചെയ്യുക.

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
