/* Purpose: Global maintenance controller for GitHub Pages */
(() => {
  "use strict";

  const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
  const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
  const MAINTENANCE_PATH = "/maintenance/";
  
  const PASSTHROUGH_PATHS = [
    "/maintenance/",
    "/maintenance/index.html",
    "/maintenance/runtime-guard.js",
    "/assets/css/new-year-theme.css",
    "/assets/js/new-year-theme.js",
    "/assets/media/",
    "/favicon.ico"
  ];

  const SPECIAL_WINDOW = {
    id: "2026-07-21-special",
    start: Date.parse("2026-07-21T14:30:00.000Z"), // 8:00 PM IST = 14:30 UTC
    end: Date.parse("2026-07-21T15:30:00.000Z"),   // 9:00 PM IST = 15:30 UTC
  };

  function buildThursdayWindows() {
    const windows = [];
    // Start from July 23, 2026 (Thursday)
    const firstThursday = Date.UTC(2026, 6, 23);
    const lastThursday = Date.UTC(2026, 11, 31);

    for (let time = firstThursday; time <= lastThursday; time += WEEK_MS) {
      const d = new Date(time);
      const y = d.getUTCFullYear();
      const m = d.getUTCMonth();
      const day = d.getUTCDate();
      
      // 8:45 PM IST = 15:15 UTC
      // 9:00 PM IST = 15:30 UTC
      const start = Date.UTC(y, m, day, 15, 15);
      const end = Date.UTC(y, m, day, 15, 30);
      
      windows.push({
        id: `${y}-${String(m + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}-thursday`,
        start,
        end
      });
    }
    return windows;
  }

  const MAINTENANCE_WINDOWS = [SPECIAL_WINDOW, ...buildThursdayWindows()];

  function isMaintenanceActive(now) {
    return MAINTENANCE_WINDOWS.some(w => now >= w.start && now < w.end);
  }

  function checkMaintenance() {
    const now = Date.now();
    const path = window.location.pathname;
    
    // Allow access to maintenance page and assets
    if (PASSTHROUGH_PATHS.some(p => path.startsWith(p))) {
      return;
    }

    if (isMaintenanceActive(now)) {
      // Redirect to maintenance page
      window.location.href = MAINTENANCE_PATH;
    }
  }

  // Run immediately and also check periodically
  checkMaintenance();
  setInterval(checkMaintenance, 30000); // Check every 30 seconds
})();
