/* Purpose: Ask poly config - Descriptive comment added for clarity */
globalThis.ASK_POLY_CONFIG = Object.freeze({
  // Use the canonical Worker hostname first. The custom api.polypmna.dpdns.org
  // hostname is currently not reachable from browser fetch, which forced the
  // client through a slow failover before an answer could be rendered.
  endpoint: "https://ask-poly-ai.nandakumarkdpm.workers.dev/api/ask-poly",
  // Fallback for temporary Worker or edge failures.
  fallbackEndpoint: "https://hwobooljdvynsajtrvnk.supabase.co/functions/v1/ask-poly-proxy/api/ask-poly",
  healthEndpoint: "https://ask-poly-ai.nandakumarkdpm.workers.dev/health",
  fallbackHealthEndpoint: "https://hwobooljdvynsajtrvnk.supabase.co/functions/v1/ask-poly-proxy/health",
  mockExamEndpoint: "https://api.polypmna.dpdns.org/api/evaluate-mock-exam",
  supabasePublishableKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh3b2Jvb2xqZHZ5bnNhanRydm5rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3Mzc1MzAsImV4cCI6MjA5NzMxMzUzMH0.z0AfKVsZ89p4ddJiMcvfFel3WryAdlxp7usAl9nDVzs",
  timeoutMs: 30000,
  mockExamTimeoutMs: 30000,
  maxHistory: 6
});
