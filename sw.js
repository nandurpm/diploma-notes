/* Public offline resources only; never cache APIs, account pages or submissions. */
const CACHE_PREFIX = 'poly-pmna-';
const CACHE_NAME = `${CACHE_PREFIX}20260924-v2`;
const ASSETS_TO_CACHE = ['/offline.html', '/assets/css/style.css', '/assets/js/main.js'];
const PRIVATE_PATH = /^\/(?:admin(?:\/|$)|api(?:\/|$)|(?:ask-poly(?:-v2)?|daily-quiz|mock-exam|login|register|profile|dashboard|reset-password|auth|account)(?:[/.]|$))/i;

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS_TO_CACHE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(name => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME).map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});

async function remember(cache, key, response) {
  if (!response.ok || response.type === 'opaque' || response.redirected || /no-store|private/i.test(response.headers.get('Cache-Control') || '')) return;
  await cache.put(key, response.clone());
  const keys = await cache.keys();
  const removable = keys.filter(request => !ASSETS_TO_CACHE.includes(new URL(request.url).pathname));
  await Promise.all(removable.slice(0, Math.max(0, keys.length - 120)).map(request => cache.delete(request)));
}

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin || request.headers.has('Authorization') || PRIVATE_PATH.test(url.pathname)) return;
  // Queries on pages can contain auth tokens or personalized state.
  const navigation = request.mode === 'navigate' && !url.search;
  const asset = /^\/assets\/(?:css|js|vendor|media)\//.test(url.pathname) && /\.(?:css|js|png|jpg|jpeg|webp|svg|ico|woff2?)$/i.test(url.pathname)
    && [...url.searchParams.keys()].every(key => key === 'v');
  if (!navigation && !asset) return;
  const key = asset ? url.pathname : request;
  const operation = (async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(key);
    const refresh = fetch(request).then(async response => {
      await remember(cache, key, response);
      return response;
    });
    if (navigation) {
      try { return await refresh; }
      catch { return cached || await cache.match('/offline.html') || Response.error(); }
    }
    if (cached) {
      await refresh.catch(() => {});
      return cached;
    }
    return refresh;
  })();
  if (asset) {
    // Return cached assets immediately while the event keeps refresh alive.
    event.respondWith(caches.open(CACHE_NAME).then(async cache => (await cache.match(key)) || operation));
    event.waitUntil(operation.then(() => {}, () => {}));
  } else {
    event.respondWith(operation);
  }
});
