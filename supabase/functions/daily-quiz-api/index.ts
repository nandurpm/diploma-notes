// Retired on 2026-06-18. The supported endpoint is quiz-portal-api.
Deno.serve(() => Response.json(
  { error: "This legacy endpoint has been retired." },
  { status: 410, headers: { "Cache-Control": "no-store" } },
));
