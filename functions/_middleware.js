const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const WEEK_MS = 7 * DAY_MS;
const MAINTENANCE_PAGE = "/maintenance/";
const STATUS_PATHS = new Set(["/maintenance-status", "/maintenance-status.json"]);

const SPECIAL_WINDOW = {
  id: "2026-07-21-special",
  activityIndex: 0,
  start: Date.parse("2026-07-21T14:30:00.000Z"),
  end: Date.parse("2026-07-21T15:30:00.000Z"),
  label: "Tuesday special maintenance",
};

function buildThursdayWindows() {
  const windows = [];
  const firstLocalDate = Date.UTC(2026, 6, 23);
  const lastLocalDate = Date.UTC(2026, 11, 31);

  for (let localDate = firstLocalDate, index = 0; localDate <= lastLocalDate; localDate += WEEK_MS, index += 1) {
    const date = new Date(localDate);
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth();
    const day = date.getUTCDate();
    const start = Date.UTC(year, month, day, 20, 45) - IST_OFFSET_MS;
    const end = Date.UTC(year, month, day, 21, 0) - IST_OFFSET_MS;
    const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

    windows.push({
      id: `${dateKey}-thursday`,
      activityIndex: index + 1,
      start,
      end,
      label: "Thursday scheduled maintenance",
    });
  }

  return windows;
}

const MAINTENANCE_WINDOWS = [SPECIAL_WINDOW, ...buildThursdayWindows()];

function toIstIso(timestamp) {
  const date = new Date(timestamp + IST_OFFSET_MS);
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}T${String(date.getUTCHours()).padStart(2, "0")}:${String(date.getUTCMinutes()).padStart(2, "0")}:00+05:30`;
}

function serializeWindow(window) {
  if (!window) return null;
  return {
    id: window.id,
    label: window.label,
    activityIndex: window.activityIndex,
    startsAtUtc: new Date(window.start).toISOString(),
    endsAtUtc: new Date(window.end).toISOString(),
    startsAtIst: toIstIso(window.start),
    endsAtIst: toIstIso(window.end),
  };
}

function resolveSchedule(now) {
  const currentWindow = MAINTENANCE_WINDOWS.find(window => now >= window.start && now < window.end) || null;
  const nextWindow = MAINTENANCE_WINDOWS.find(window => window.start > now) || null;
  return { currentWindow, nextWindow };
}

function statusPayload(now) {
  const { currentWindow, nextWindow } = resolveSchedule(now);
  return {
    active: Boolean(currentWindow),
    currentTimeUtc: new Date(now).toISOString(),
    timezone: "Asia/Kolkata",
    currentWindow: serializeWindow(currentWindow),
    nextWindow: serializeWindow(nextWindow),
    schedule: {
      special: "21 July 2026, 8:00 PM–9:00 PM IST",
      recurring: "Every Thursday, 8:45 PM–9:00 PM IST, from 23 July through 31 December 2026",
      totalWindows: MAINTENANCE_WINDOWS.length,
      finalWindowEndsAtIst: "2026-12-31T21:00:00+05:30",
    },
  };
}

export async function onRequest(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);
  const now = Date.now();
  const { currentWindow } = resolveSchedule(now);

  if (STATUS_PATHS.has(url.pathname)) {
    return Response.json(statusPayload(now), {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "X-Robots-Tag": "noindex, nofollow",
      },
    });
  }

  if (!currentWindow) {
    return next();
  }

  const maintenanceUrl = new URL(MAINTENANCE_PAGE, url.origin);
  const assetRequest = new Request(maintenanceUrl.toString(), {
    method: "GET",
    headers: request.headers,
  });

  const retryAfterSeconds = Math.max(1, Math.ceil((currentWindow.end - now) / 1000));
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
          "Retry-After": String(retryAfterSeconds),
          "X-Robots-Tag": "noindex, nofollow",
          "X-POLY-Maintenance-Window": currentWindow.id,
        },
      },
    );
  }

  const headers = new Headers(assetResponse.headers);
  headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
  headers.set("Pragma", "no-cache");
  headers.set("Expires", "0");
  headers.set("Retry-After", String(retryAfterSeconds));
  headers.set("X-Robots-Tag", "noindex, nofollow");
  headers.set("X-POLY-Maintenance", "active");
  headers.set("X-POLY-Maintenance-Window", currentWindow.id);
  headers.set("X-POLY-Activity-Index", String(currentWindow.activityIndex));

  return new Response(request.method === "HEAD" ? null : assetResponse.body, {
    status: 503,
    statusText: "Service Unavailable",
    headers,
  });
}
