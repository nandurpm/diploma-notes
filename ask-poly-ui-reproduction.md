# Ask POLY UI reproduction

Date: 2026-09-03

After opening `https://polypmna.dpdns.org/ask-poly.html?stream-spacing-fix=20260903`, entering `Explain why a fuse is used in an electrical circuit.`, and pressing Send, the browser saved the user message and updated the chat title. The page then stayed on `POLY is thinking…` with the `Stop generating` button visible. No assistant streaming bubble or final assistant answer appeared after waiting and refreshing the browser view.

The backend endpoint had separately been verified to return HTTP 200 and a complete `text/event-stream`, so the remaining defect is in the deployed client request/stream path or its runtime JavaScript, not the Worker’s HTTP response status.

The earlier screenshot also showed assistant content with words run together. The source client’s smoothing function appends raw chunks, and the browser bundle may be loading an older or different script than the patched repository asset. The next diagnostic must inspect the live page’s actual script URLs, script version/signatures, browser console errors, and the live `callAI`/`readSseAnswer` path.


Additional diagnosis: the live browser’s recovery state selected the Supabase fallback during health checks because browser fetches to `https://api.polypmna.dpdns.org/health` failed, while `https://ask-poly-ai.nandakumarkdpm.workers.dev/health` returned HTTP 200. The client’s `callAI` still started with the broken custom API endpoint, so the recovery wrapper spent about 29 seconds failing that route before returning a successful Supabase stream. A direct wrapped browser request eventually returned HTTP 200 SSE with correctly spaced delta chunks, confirming the apparent hang was primarily endpoint-selection latency and stale client/config assets, not an incomplete Worker stream.

The source fix now makes the verified Worker hostname the primary endpoint and health endpoint, retains Supabase as fallback, and changes the HTML cache-busting query for the config, recovery wrapper, and streaming client.
