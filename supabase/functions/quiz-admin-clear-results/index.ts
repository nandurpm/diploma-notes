// Retired on 2026-06-18. Admin mutations now run through quiz-portal-api.
Deno.serve(() => Response.json(
  { error: "This legacy administrator endpoint has been retired." },
  { status: 410, headers: { "Cache-Control": "no-store" } },
));
