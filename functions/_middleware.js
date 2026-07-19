const MAINTENANCE_START = Date.parse("2026-07-21T14:30:00.000Z");
const MAINTENANCE_END = Date.parse("2026-07-21T15:30:00.000Z");
const MAINTENANCE_PAGE = "/maintenance/";
const STATUS_PATHS = new Set(["/maintenance-status", "/maintenance-status.json"]);

function statusPayload(now) {
  return {
    active: now >= MAINTENANCE_START && now < MAINTENANCE_END,
    currentTimeUtc: new Date(now).toISOString(),
    startsAtUtc: new Date(MAINTENANCE_START).toISOString(),
    endsAtUtc: new Date(MAINTENANCE_END).toISOString(),
    startsAtIst: "2026-07-21T20:00:00+05:30",
    endsAtIst: "2026-07-21T21:00:00+05:30",
    timezone: "Asia/Kolkata",
  };
}

export async function onRequest(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);
  const now = Date.now();

  if (STATUS_PATHS.has(url.pathname)) {
    return Response.json(statusPayload(now), {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "X-Robots-Tag": "noindex, nofollow",
      },
    });
  }

  const maintenanceActive = now >= MAINTENANCE_START && now < MAINTENANCE_END;
  if (!maintenanceActive) {
    return next();
  }

  const maintenanceUrl = new URL(MAINTENANCE_PAGE, url.origin);
  const assetRequest = new Request(maintenanceUrl.toString(), {
    method: "GET",
    headers: request.headers,
  });

  let assetResponse;
  try {
    assetResponse = await env.ASSETS.fetch(assetRequest);
  } catch (error) {
    return new Response(
      "POLY PMNA is temporarily unavailable for scheduled maintenance. Please try again after 9:00 PM IST.",
      {
        status: 503,
        headers: {
          "Content-Type": "text/plain; charset=UTF-8",
          "Cache-Control": "no-store, no-cache, must-revalidate",
          "Retry-After": "3600",
          "X-Robots-Tag": "noindex, nofollow",
        },
      },
    );
  }

  const headers = new Headers(assetResponse.headers);
  headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
  headers.set("Pragma", "no-cache");
  headers.set("Expires", "0");
  headers.set("Retry-After", "3600");
  headers.set("X-Robots-Tag", "noindex, nofollow");
  headers.set("X-POLY-Maintenance", "active");

  return new Response(request.method === "HEAD" ? null : assetResponse.body, {
    status: 503,
    statusText: "Service Unavailable",
    headers,
  });
}
