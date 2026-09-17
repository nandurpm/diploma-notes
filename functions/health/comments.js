export async function onRequest(context) {
  const { request } = context;
  const workerUrl = "https://api.polypmna.dpdns.org/health/comments";

  const headers = new Headers(request.headers);
  headers.set("Origin", "https://polypmna.dpdns.org");

  try {
    const response = await fetch(workerUrl, {
      method: "GET",
      headers: headers
    });

    return new Response(response.body, {
      status: response.status,
      headers: response.headers
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Proxy failed: " + error.message }), {
      status: 502,
      headers: { "Content-Type": "application/json" }
    });
  }
}
