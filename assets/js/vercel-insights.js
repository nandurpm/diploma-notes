/* Vercel Speed Insights is useful only when this static build is hosted by Vercel. */
const host = window.location.hostname;
const isVercelHost = host === "vercel.app" || host.endsWith(".vercel.app");

if (isVercelHost) {
  import("https://cdn.jsdelivr.net/npm/@vercel/speed-insights@1/dist/index.mjs")
    .then(({ injectSpeedInsights }) => injectSpeedInsights())
    .catch(() => {
      // Observability must never affect page rendering or study resources.
    });
}
