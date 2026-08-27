const CACHE_NAME = 'wildlife-atlas-v3';
const STATIC_CACHE = 'wildlife-static-v3';

// Critical assets to precache
const PRECACHE_URLS = [
  '/',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
];

// Install: precache critical assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME && k !== STATIC_CACHE)
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch: strategy based on request type
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests and chrome-extension URLs
  if (request.method !== 'GET') return;
  if (url.protocol === 'chrome-extension:') return;

  // Strategy: Cache-First for static assets (JS, CSS, images, fonts)
  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Strategy: Stale-While-Revalidate for HTML pages
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  // Strategy: Network-First for API calls, fallback to cache
  if (url.hostname !== self.location.hostname) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Default: Stale-While-Revalidate
  event.respondWith(staleWhileRevalidate(request));
});

/** Returns true if the URL points to a static asset */
function isStaticAsset(url) {
  const ext = url.pathname.split('.').pop()?.toLowerCase();
  return ['js', 'css', 'png', 'jpg', 'jpeg', 'webp', 'svg', 'woff2', 'woff', 'ico', 'json'].includes(ext || '');
}

/** Cache-First: use cache if available, otherwise fetch and cache */
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
  }
}

/** Stale-While-Revalidate: return cache immediately, update in background */
async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => null);

  return cached || (await fetchPromise) || offlineFallback();
}

/** Network-First: try network, fall back to cache */
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached || offlineFallback();
  }
}

/** Returns an offline fallback response */
async function offlineFallback() {
  const cached = await caches.match('/');
  return cached || new Response(
    '<html><body style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;color:#666"><div style="text-align:center"><h1>🌍 Offline</h1><p>World Wildlife Atlas is not available offline yet.</p></div></body></html>',
    { headers: { 'Content-Type': 'text/html' } }
  );
}
