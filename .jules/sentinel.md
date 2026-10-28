# Sentinel's Journal - Critical Security Learnings

## 2026-03-31 - Safe HTTP Status Code Validation in Edge Workers
**Vulnerability:** In `workers/ask-poly-ai/src/secure-index.js`, uncaught or malformed status codes on auth errors (such as `NaN`, `0`, or values outside `100..599`) passed directly to `new Response(..., { status })` throw an unhandled `RangeError` in Cloudflare Workers, causing worker crashes and 500 responses without CORS or security headers.
**Learning:** `Number(error?.status || 401)` evaluates to `NaN` when `error.status` is a non-numeric string or invalid object property, which breaks the native `Response` constructor contract.
**Prevention:** Always validate status codes using `Number.isInteger(status) && status >= 100 && status <= 599` before initializing HTTP `Response` objects in worker middleware.

## 2026-04-01 - Preventing Information Disclosure of Secrets in Health Endpoints
**Vulnerability:** In `workers/ask-poly-ai/src/comments.js`, `commentsHealth` returned `secretLength: raw.length` in the `diagnostics` object of an unauthenticated `GET /health/comments` response, disclosing structural information about internal credentials to unauthenticated callers.
**Learning:** Returning numeric metadata (like length) of environment variables or secret objects in health checks introduces information disclosure without providing security benefit.
**Prevention:** Health and diagnostic endpoints should only expose simple boolean capability flags (e.g., `hasSecret`, `configured`) and never return secret lengths, hashes, or structural details.

## 2026-04-02 - External API Timeout Controls in Cloudflare Workers
**Vulnerability:** In `workers/ask-poly-ai/src/comments.js`, raw `fetch()` calls to Google OAuth and Firestore APIs lacked `AbortController` timeout handling, leaving worker threads vulnerable to connection hanging and resource exhaustion when external services stall.
**Learning:** External API dependencies in edge workers without explicit request timeouts can hang indefinitely until worker runtime limits are reached, degrading performance and increasing DoS risks.
**Prevention:** Wrap all outgoing worker `fetch` calls with an `AbortController` timeout (e.g. 7000ms) and convert timeout errors into standard 504/503 HTTP responses.

## 2026-04-03 - SSRF Prevention on Dynamic External API Endpoints
**Vulnerability:** In `workers/ask-poly-ai/src/ask-handler.js`, `FREE_API_URL` environment variables passed to `askFreeApi` / `askOpenAiCompatibleStream` lacked URL scheme and host validation, permitting SSRF attacks against internal network endpoints (e.g., `169.254.169.254`, `127.0.0.1`, private IP ranges).
**Learning:** User-configured or dynamic API endpoint URLs in edge workers can be leveraged to scan internal ports or query internal/cloud metadata services if not validated prior to fetching.
**Prevention:** Validate outbound target URLs using an explicit `isSafeExternalUrl` check that enforces `http:`/`https:` schemes and blocks loopback, private, link-local, CGNAT, and cloud metadata IP ranges.

## 2026-10-06 - Preventing SSRF Bypass via IPv4-Mapped IPv6 and Unspecified IPv6 Hostnames
**Vulnerability:** In `workers/ask-poly-ai/src/http.js`, `isSafeExternalUrl` only evaluated IPv4 dotted-decimal patterns, allowing SSRF bypasses via IPv4-mapped IPv6 hostnames (such as `::ffff:127.0.0.1`, `::ffff:7f00:1`, `::ffff:a9fe:a9fe`) and unspecified IPv6 addresses (`::`, `0:0:0:0:0:0:0:0`).
**Learning:** Standard URL parsers preserve IPv6 bracket notation and IPv4-mapped IPv6 prefix forms without converting them to standard IPv4 dotted quads, bypassing regex checks designed solely for IPv4 decimal strings.
**Prevention:** Unwrap IPv4-mapped IPv6 hostnames (`::ffff:...`) to IPv4 dotted quads before private CIDR evaluation, and explicitly reject unspecified IPv6 targets (`::`, `0:0:0:0:0:0:0:0`).

## 2026-10-13 - Preventing DoS via NaN Timeout Coercion on Misconfigured Env Vars
**Vulnerability:** In `workers/ask-poly-ai/src/ask-handler.js`, `mock-evaluator.js`, and `index.js`, environment variables like `PROVIDER_TIMEOUT_MS` parsed via `Number(env.VAR)` evaluated to `NaN` when misconfigured with non-numeric text. In Cloudflare Workers runtime, passing `NaN` to `setTimeout()` coerces the delay to `0ms`, causing instant request aborts and total service outage.
**Learning:** Math bounds like `Math.max(4000, Math.min(20000, NaN))` produce `NaN` without throwing, masking configuration bugs until timer execution instantly aborts outgoing fetch calls.
**Prevention:** Always check `Number.isFinite(...)` when parsing numeric configuration environment variables before calculating bounds or scheduling timer delays.

## 2026-10-20 - Preventing DoS and Unbounded Memory Growth in Rate Limiters
**Vulnerability:** In `workers/ask-poly-ai/src/http.js`, `createRateLimiter` placed Map capacity eviction logic *after* the rate-limit threshold check (`recent.length >= maximum`), returning `false` early on rate-limited calls and preventing stale bucket pruning under DoS floods.
**Learning:** Early returns in rate limiters on blocked requests skip cleanup routines, causing unbounded `Map` memory growth when an endpoint receives floods from many IP keys.
**Prevention:** Always run Map capacity eviction routines *before* evaluating rate-limit thresholds or returning early from limiter functions.

## 2026-10-27 - Blocking IPv4/IPv6 Multicast and Reserved Ranges in SSRF Protection
**Vulnerability:** In `workers/ask-poly-ai/src/http.js`, `isSafeExternalUrl` checked IPv4 loopback/private/link-local/CGNAT and IPv6 loopback/private ranges, but permitted IPv4 multicast/reserved/broadcast addresses (`224.0.0.0/4`, `255.255.255.255`) and IPv6 multicast addresses (`ff00::/8`).
**Learning:** Standard URL parsers accept multicast and broadcast IP targets as valid HTTP hostnames. Outbound requests to multicast/broadcast IPs in edge runtimes can trigger internal network noise or unexpected traffic routing.
**Prevention:** SSRF URL validators must explicitly reject IPv4 multicast/reserved/broadcast ranges (`a >= 224`) and IPv6 multicast prefixes (`ff`).
