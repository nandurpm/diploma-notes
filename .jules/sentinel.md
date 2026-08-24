# Sentinel's Journal - Critical Security Learnings

## 2026-03-31 - Safe HTTP Status Code Validation in Edge Workers
**Vulnerability:** In `workers/ask-poly-ai/src/secure-index.js`, uncaught or malformed status codes on auth errors (such as `NaN`, `0`, or values outside `100..599`) passed directly to `new Response(..., { status })` throw an unhandled `RangeError` in Cloudflare Workers, causing worker crashes and 500 responses without CORS or security headers.
**Learning:** `Number(error?.status || 401)` evaluates to `NaN` when `error.status` is a non-numeric string or invalid object property, which breaks the native `Response` constructor contract.
**Prevention:** Always validate status codes using `Number.isInteger(status) && status >= 100 && status <= 599` before initializing HTTP `Response` objects in worker middleware.
