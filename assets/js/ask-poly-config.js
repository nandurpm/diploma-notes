/* Purpose: Ask poly config - Descriptive comment added for clarity */
globalThis.ASK_POLY_CONFIG = Object.freeze({
  endpoint: "https://api.polypmna.dpdns.org/api/ask-poly",
  // Fallback for deployments whose edge CSP still blocks the protected API hostname.
  fallbackEndpoint: "https://hwobooljdvynsajtrvnk.supabase.co/functions/v1/ask-poly-proxy",
  healthEndpoint: "https://api.polypmna.dpdns.org/health",
  fallbackHealthEndpoint: "https://hwobooljdvynsajtrvnk.supabase.co/functions/v1/ask-poly-proxy/health",
  mockExamEndpoint: "https://api.polypmna.dpdns.org/api/evaluate-mock-exam",
  supabasePublishableKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh3b2Jvb2xqZHZ5bnNhanRydm5rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3Mzc1MzAsImV4cCI6MjA5NzMxMzUzMH0.z0AfKVsZ89p4ddJiMcvfFel3WryAdlxp7usAl9nDVzs",
  timeoutMs: 45000,
  mockExamTimeoutMs: 30000,
  maxHistory: 12
});
