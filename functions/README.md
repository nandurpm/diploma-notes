# Cloudflare Functions (Pages Functions)

Middleware and serverless functions deployed on Cloudflare Pages for server-side request handling.

## Files

| File | Purpose |
|------|---------|
| `_middleware.js` | Request middleware that handles maintenance mode redirects, CORS headers, and security headers |

## How It Works

Cloudflare Pages Functions run as middleware on every request. The `_middleware.js` file:

1. Checks if the current time falls within a maintenance window
2. If so, redirects non-exempt paths to `/maintenance/`
3. Passes through all other requests to the static site

This complements the client-side maintenance controller (`assets/js/maintenance-controller.js`) by providing server-side enforcement.

## Deployment

Functions are automatically deployed when the site is built and published on Cloudflare Pages.
