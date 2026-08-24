# Ask POLY Repair Findings

## Confirmed live failure

The live page `https://polypmna.dpdns.org/ask-poly.html` loads, but normal browser submissions fall back to local answers with `Retrying AI relay…` and `Live AI was unavailable; please verify this answer.`

The live API health endpoint `https://api.polypmna.dpdns.org/health` returns HTTP 200 and reports providers `cloudflare-workers-ai`, `cloudflare-workers-ai-rest`, `openrouter`, and `nvidia`.

A browser-shaped POST with `Origin: https://polypmna.dpdns.org`, `Sec-Fetch-Site: cross-site`, `Sec-Fetch-Mode: cors`, `Sec-Fetch-Dest: empty`, and a normal Chrome user agent succeeds from the shell. A mathematical request returns a local-math SSE answer. A non-mathematical transformer question returns HTTP 200 SSE with `X-Ask-Poly-Provider: nvidia` and `X-Ask-Poly-Model: meta/llama-3.1-8b-instruct`. This confirms the Worker and provider fallback are operational.

## Root cause

The live homepage response for `ask-poly.html` served a stale Content-Security-Policy `connect-src` directive that allowed only `https://ask-poly-ai.nandakumardpm.workers.dev`, not the configured production endpoint `https://api.polypmna.dpdns.org`. The browser therefore blocked the custom-domain API request at the page security layer, causing the frontend recovery wrapper to report `TypeError: Failed to fetch` and show the local fallback.

The repository `_headers` file was patched to allow both the protected custom domain and the Worker fallback:

`connect-src ... https://api.polypmna.dpdns.org https://ask-poly-ai.nandakumardpm.workers.dev;`

The fix was committed and pushed as commit `411b02ca` (`Fix Ask POLY API CSP allowlist`). GitHub Pages run `32477197224` completed successfully. The live response was checked immediately after deployment but still showed the old Worker-only CSP, indicating deployment/CDN propagation had not yet converged or another generated header source is overriding the expected `_headers` artifact.

## Cloudflare documentation check

Official Cloudflare documentation confirms that `@cf/meta/llama-3.1-8b-instruct-fp8` is a supported Cloudflare-hosted text-generation model. The unquantized `@cf/meta/llama-3.1-8b-instruct` page is marked deprecated as of 2026-05-30. The repository's configured model is the supported FP8 variant, and a live NVIDIA fallback request was independently observed to succeed.

References:
- https://developers.cloudflare.com/workers-ai/models/llama-3.1-8b-instruct-fp8/
- https://developers.cloudflare.com/workers-ai/models/llama-3.1-8b-instruct/
- https://developers.cloudflare.com/workers-ai/models/llama-3.1-8b-instruct-fast/

Further verification: the live `/_headers` file contains the corrected custom-domain CSP, and the GitHub Pages workflow and Cloudflare Pages mirror deployment both completed their build/deploy steps. However, the live `ask-poly.html` response still emits a Worker-only CSP (`connect-src ... https://ask-poly-ai.nandakumardpm.workers.dev`) and omits `https://api.polypmna.dpdns.org`. The live host identifies as GitHub Pages behind Cloudflare (`x-github-request-id`, `x-github-edge-region`, `via: varnish`, `cf-cache-status`). The GitHub Pages API reports an older errored build, suggesting platform-level/custom-domain header behavior is overriding the repository `_headers` response. The repository remains correct, but a client-side Worker-domain fallback is needed for reliable browser connectivity under the currently served CSP.

The latest static-site deployment completed successfully for commit `a2f1a91b`. The live page now serves the new versioned scripts (`ask-poly-config.js?v=a2f1a91b8255` and `ask-poly-client-recovery.js?v=a2f1a91b8255`), and the status shows `Ready` after the new primary/fallback health checks. The page still displays the previously saved local-fallback arithmetic conversation, so a fresh non-math question is required to validate the new request failover.

A fresh browser test after the fallback deployment loaded the versioned scripts and showed `Ready`. Submitting `Explain what a transformer does in an electrical circuit in two sentences.` still produced `Retrying AI relay…` and a local unavailable answer, despite the direct shell test proving the Supabase relay returns HTTP 200 SSE with the exact repository key. This narrows the remaining issue to browser-side fallback request execution or its response parsing, not provider availability.

A direct browser-native XHR to the deployed Supabase fallback returned HTTP 200 `text/event-stream` and produced a valid streamed response, confirming the browser, CSP, CORS, and Supabase relay are all capable of carrying the request. The normal Ask POLY flow still shows the unavailable fallback for the transformer question. The remaining defect is inside the recovery wrapper’s interaction with the primary/fallback request or the frontend’s streamed-response handling, not network reachability.

The browser console did not show uncaught errors because the app handles failures internally. A temporary fetch probe was installed around the live page’s current fetch wrapper; the next fresh submission will reveal which endpoint returns or throws.

The second instrumented normal submission (`What is the purpose of a capacitor in a DC circuit?`) also produced a diagram and then the local unavailable fallback. The direct browser XHR remains successful, so the next step is to inspect the fetch probe logs to see whether the application’s request body or stream parser causes the failure.

The live runtime has the expected configuration: primary `https://api.polypmna.dpdns.org/api/ask-poly`, verified Supabase fallback, and verified Supabase fallback health endpoint. A browser-side event buffer is now installed around the current fetch wrapper to capture the exact request sequence on the next submission.

The attempted fuse submission was not dispatched: the live form showed the browser’s native `Please fill out this field` validation, so the fetch event buffer did not receive a new request. The dynamic question list changes element indices after each response; the next test should use the current textarea index from a fresh page view.

The fetch probe captured the exact remaining bug: the normal UI request reaches `https://api.polypmna.dpdns.org/api/ask-poly`, which returns HTTP `400 application/json`. The recovery wrapper’s `RETRYABLE_STATUS` set excludes 400, so it immediately returns that response and never tries the verified Supabase fallback. This is why direct fallback XHR succeeds while the normal UI still shows the local unavailable answer. The repair is to permit fallback on HTTP 400 (and optionally 404 for stale route compatibility), while still returning the final response if every candidate rejects the request.

The latest live deployment serves the corrected recovery script, and the fresh page reports `Ready` after checking both routes. The prior saved local-fallback conversations remain in browser storage; a fresh question on this new page will be used to confirm that HTTP 400 now triggers the Supabase relay.

The final live test submitted `What is the purpose of a fuse in an electrical circuit?` on the latest deployment. The UI remains in `Stop generating` / `Retrying AI relay…` state while the stream is active; the question was accepted and no native validation error occurred. I will wait for completion before declaring the fix successful.

The HTTP-400 patch reached the live page and the fresh request was accepted, but after completion it still displayed the local unavailable answer. This confirms the wrapper no longer stops at the primary 400, but the fallback attempt is either returning another non-success response for the full UI payload or the frontend parser is rejecting the fallback response. A fresh runtime probe on the latest page is needed to capture both candidates.

The latest page has a fresh fetch-event probe installed. The next full UI submission will capture whether the primary HTTP 400 is followed by a Supabase HTTP 200 or another response that the frontend rejects.

The latest full UI request (`What does a fuse protect in an electrical circuit?`) was accepted but still completed as a local unavailable answer. The dual-endpoint probe is now ready to show whether the Supabase fallback was attempted and what it returned.

A direct browser-native XHR using the full Ask POLY payload, including `diagramRequest`, returned HTTP 200 `text/event-stream` from the Supabase fallback. The wrapper’s outer probe still reported the final UI fetch response as primary HTTP 400, proving the deployed page is not executing the updated retry-on-400 path despite the repository script containing it. The next check will inspect the exact recovery script URL/content loaded by the live page and bypass stale HTML/asset caching if necessary.

The current browser DOM loads the exact recovery script URL `...ask-poly-client-recovery.js?v=7b6baff86b39`, and fetching that exact URL confirms the executed source contains the HTTP-400 retry set, the fallback endpoint logic, and the new explanatory comment. The remaining discrepancy is therefore runtime control flow or fallback fetch options, not stale assets.

A direct invocation of the live page’s current wrapped `fetch(primaryEndpoint, fullPayload)` returned HTTP 200 `text/event-stream`; its event buffer showed a primary HTTP 400 followed by a successful primary HTTP 200 on a subsequent invocation. This proves the deployed HTTP-400 failover logic can reach a live stream. A request-body probe is now installed to compare the actual UI payload, especially saved-history size and contents, with the working direct payload.

The latest coordinate-based submission again hit native required-field validation because the dynamic chat DOM changed indices before the click. No request was sent. I will use a DOM-native `requestSubmit()` against the current form to capture the real UI payload without stale element targeting.
