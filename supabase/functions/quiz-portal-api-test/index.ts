// Retired on 2026-06-18. Kept as an authenticated tombstone until the
// Supabase dashboard function entry can be deleted safely.
Deno.serve(() => Response.json(
  { error: "This test endpoint has been retired." },
  { status: 410, headers: { "Cache-Control": "no-store" } },
));
