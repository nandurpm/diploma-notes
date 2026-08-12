/* Purpose:  middleware - Descriptive comment added for clarity */
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const WEEK_MS = 7 * DAY_MS;
const MAINTENANCE_PAGE = "/maintenance/";
const STATUS_PATHS = new Set(["/maintenance-status", "/maintenance-status.json"]);
const PASSTHROUGH_ASSET_PATHS = new Set([
  "/maintenance/runtime-guard.js",
  "/assets/css/new-year-theme.css",
  "/assets/js/new-year-theme.js",
  "/assets/css/independence-day-theme.css",
  "/assets/js/independence-day-theme.js",
]);
const NEW_YEAR_STYLESHEET = '<link rel="stylesheet" href="/assets/css/new-year-theme.css?v=annual-midnight-circuit-1">';
const NEW_YEAR_SCRIPT = '<script src="/assets/js/new-year-theme.js?v=annual-midnight-circuit-1" defer></script>';
const INDEPENDENCE_DAY_STYLESHEET = '<link rel="stylesheet" href="/assets/css/independence-day-theme.css?v=annual-tricolour-circuit-1">';
const INDEPENDENCE_DAY_SCRIPT = '<script src="/assets/js/independence-day-theme.js?v=annual-tricolour-circuit-1" defer></script>';
const MAINTENANCE_RUNTIME_SCRIPT = '<script src="/maintenance/runtime-guard.js"></script>';

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

function getIstParts(timestamp) {
  const date = new Date(timestamp + IST_OFFSET_MS);
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
    hour: date.getUTCHours(),
    minute: date.getUTCMinutes(),
    second: date.getUTCSeconds(),
  };
}

function resolveNewYearTheme(now) {
  const parts = getIstParts(now);
  const active = (parts.month === 12 && parts.day >= 28) || (parts.month === 1 && parts.day <= 3);
  const targetYear = parts.month === 12 ? parts.year + 1 : parts.year;
  const seasonStartYear = parts.month === 12 ? parts.year : parts.year - 1;
  const startsAt = Date.UTC(seasonStartYear, 11, 28, 0, 0, 0) - IST_OFFSET_MS;
  const endsAt = Date.UTC(targetYear, 0, 4, 0, 0, 0) - IST_OFFSET_MS;
  let phase = "inactive";

  if (active && parts.month === 12 && parts.day < 31) phase = "approaching";
  if (active && parts.month === 12 && parts.day === 31) phase = "countdown";
  if (active && parts.month === 1 && parts.day === 1) phase = "celebration";
  if (active && parts.month === 1 && parts.day >= 2) phase = "welcome";

  return { active, targetYear, phase, startsAt, endsAt };
}

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
  const newYearTheme = resolveNewYearTheme(now);
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
    newYearTheme: {
      active: newYearTheme.active,
      targetYear: newYearTheme.targetYear,
      phase: newYearTheme.phase,
      annualSchedule: "28 December 00:00 IST through 4 January 00:00 IST",
      startsAtIst: toIstIso(newYearTheme.startsAt),
      endsAtIst: toIstIso(newYearTheme.endsAt),
    },
  };
}

function injectHtml(html, options = {}) {
  let output = html;
  const scripts = [];

  if (!output.includes("/assets/css/independence-day-theme.css")) {
    if (/<\/head>/i.test(output)) {
      output = output.replace(/<\/head>/i, `${INDEPENDENCE_DAY_STYLESHEET}</head>`);
    } else {
      output = `${INDEPENDENCE_DAY_STYLESHEET}${output}`;
    }
  }

  if (options.newYearTheme?.active && !output.includes("/assets/css/new-year-theme.css")) {
    if (/<\/head>/i.test(output)) {
      output = output.replace(/<\/head>/i, `${NEW_YEAR_STYLESHEET}</head>`);
    } else {
      output = `${NEW_YEAR_STYLESHEET}${output}`;
    }
  }

  if (options.maintenanceRuntime && !output.includes("/maintenance/runtime-guard.js")) {
    scripts.push(MAINTENANCE_RUNTIME_SCRIPT);
  }

  if (!output.includes("/assets/js/independence-day-theme.js")) {
    scripts.push(INDEPENDENCE_DAY_SCRIPT);
  }

  if (options.newYearTheme?.active && !output.includes("/assets/js/new-year-theme.js")) {
    scripts.push(NEW_YEAR_SCRIPT);
  }

  if (scripts.length > 0) {
    const scriptMarkup = scripts.join("");
    if (/<\/body>/i.test(output)) {
      output = output.replace(/<\/body>/i, `${scriptMarkup}</body>`);
    } else {
      output += scriptMarkup;
    }
  }

  return output;
}

function transformedHeaders(sourceHeaders, newYearTheme, additionalHeaders = {}) {
  const headers = new Headers(sourceHeaders);
  headers.delete("Content-Length");
  headers.delete("Content-Encoding");
  headers.delete("ETag");

  if (newYearTheme?.active) {
    headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
    headers.set("Pragma", "no-cache");
    headers.set("Expires", "0");
    headers.set("X-POLY-New-Year-Theme", String(newYearTheme.targetYear));
    headers.set("X-POLY-New-Year-Phase", newYearTheme.phase);
  }

  Object.entries(additionalHeaders).forEach(([name, value]) => headers.set(name, String(value)));
  return headers;
}

async function applyThemeToResponse(response, newYearTheme = { active: false }) {
  if (!response || response.status === 204 || response.status === 304) return response;
  const contentType = response.headers.get("Content-Type") || "";
  if (!contentType.toLowerCase().includes("text/html")) return response;

  const html = await response.text();
  const body = injectHtml(html, { newYearTheme });
  if (body === html) return response;
  const headers = transformedHeaders(response.headers, newYearTheme);
  return new Response(body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export async function onRequest(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);
  const now = Date.now();
  const { currentWindow } = resolveSchedule(now);
  const newYearTheme = resolveNewYearTheme(now);

  if (STATUS_PATHS.has(url.pathname)) {
    return Response.json(statusPayload(now), {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "X-Robots-Tag": "noindex, nofollow",
      },
    });
  }

  if (PASSTHROUGH_ASSET_PATHS.has(url.pathname)) {
    return next();
  }

  if (!currentWindow) {
    const response = await next();
    if (request.method === "HEAD") return response;
    return applyThemeToResponse(response, newYearTheme);
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

  const headers = transformedHeaders(assetResponse.headers, newYearTheme, {
    "Cache-Control": "no-store, no-cache, must-revalidate",
    Pragma: "no-cache",
    Expires: "0",
    "Retry-After": String(retryAfterSeconds),
    "X-Robots-Tag": "noindex, nofollow",
    "X-POLY-Maintenance": "active",
    "X-POLY-Maintenance-Window": currentWindow.id,
    "X-POLY-Activity-Index": String(currentWindow.activityIndex),
  });

  let responseBody = request.method === "HEAD" ? null : assetResponse.body;
  const contentType = headers.get("Content-Type") || "";
  if (request.method !== "HEAD" && contentType.toLowerCase().includes("text/html")) {
    const html = await assetResponse.text();
    responseBody = injectHtml(html, { maintenanceRuntime: true, newYearTheme });
  }

  return new Response(responseBody, {
    status: 503,
    statusText: "Service Unavailable",
    headers,
  });
}
