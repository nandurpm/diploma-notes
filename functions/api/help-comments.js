export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const workerUrl = new URL("https://api.polypmna.dpdns.org" + url.pathname + url.search);

  // Copy headers and add Origin for the Worker's CORS check
  const headers = new Headers(request.headers);
  headers.set("Origin", "https://polypmna.dpdns.org");

  try {
    const response = await fetch(workerUrl.toString(), {
      method: request.method,
      headers: headers,
      body: request.method === "POST" ? await request.clone().arrayBuffer() : undefined,
      redirect: "follow"
    });

    // Return the response with its original status and headers
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
