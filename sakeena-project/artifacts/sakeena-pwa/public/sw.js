// __BUILD__ and __PRECACHE__ are filled in at build time (scripts/inject-sw.mjs):
// a fresh cache per deploy, holding every file of the app so it also works offline.
const BUILD = '__BUILD__';
const CACHE = 'sakeena-shell-' + BUILD;
const PRECACHE = (() => { try { return JSON.parse('__PRECACHE__'); } catch { return ['/']; } })();

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await Promise.allSettled(PRECACHE.map((url) => cache.add(url)));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    // Drop the caches of older deploys, otherwise old pages would keep being served.
    for (const key of await caches.keys()) {
      if (key.startsWith('sakeena-shell-') && key !== CACHE) await caches.delete(key);
    }
    await self.clients.claim();
  })());
});

self.addEventListener('push', (event) => {
  let data = { title: 'سَكينة', body: '' };
  try { data = event.data ? event.data.json() : data; } catch { /* non-JSON payload, ignore */ }
  event.waitUntil(
    self.registration.showNotification(data.title || 'سَكينة', {
      body: data.body || '',
      icon: '/icon-192.png',
      badge: '/favicon.svg',
      dir: 'rtl',
      lang: 'ar',
      tag: data.tag || undefined,
      renotify: !!data.tag,
      requireInteraction: !!data.strong,
      vibrate: data.strong ? [400, 150, 400, 150, 700] : [120],
      data: { url: data.url || '/' },
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(async (clients) => {
      const existing = clients.find((client) => 'focus' in client);
      if (existing) {
        if ('navigate' in existing) { try { await existing.navigate(target); } catch { /* cross-origin or unsupported */ } }
        return existing.focus();
      }
      return self.clients.openWindow(target);
    }),
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.hostname.includes('api.aladhan.com')) {
    event.respondWith(networkFirst(request));
  } else if (url.hostname.includes('api.alquran.cloud')) {
    event.respondWith(networkFirst(request));
  } else if (url.hostname.endsWith('mp3quran.net') && url.pathname.endsWith('.mp3')) {
    event.respondWith(audioHandler(request));
  } else if (url.hostname.includes('download.quranicaudio.com')) {
    event.respondWith(cacheFirst(request));
  } else if (url.origin === self.location.origin) {
    if (request.mode === 'navigate') event.respondWith(navigationHandler(request));
    else if (url.pathname.startsWith('/assets/')) event.respondWith(cacheFirst(request)); // hashed files never change
    else event.respondWith(networkFirst(request));
  }
});

async function networkFirst(request) {
  const cache = await caches.open(CACHE);
  try {
    const response = await fetch(request);
    if (response.ok) await cache.put(request, response.clone());
    return response;
  } catch {
    return (await cache.match(request)) || new Response('Offline', { status: 503 });
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) (await caches.open(CACHE)).put(request, response.clone());
  return response;
}

// Pages: always try the network first so a new deploy shows up at once, and fall
// back to the saved copy (offline, or when the connection is very slow).
async function navigationHandler(request) {
  const cache = await caches.open(CACHE);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6000);
  try {
    const response = await fetch(request, { signal: controller.signal });
    clearTimeout(timer);
    if (response.ok) await cache.put('/index.html', response.clone());
    return response;
  } catch {
    clearTimeout(timer);
    return (await cache.match('/index.html')) || (await cache.match('/')) || new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  }
}

// Quran audio. A surah the user downloaded is served from its saved copy (including
// the Range requests the <audio> element makes for seeking); anything else streams
// straight from the network.

async function audioHandler(request) {
  const cached = await caches.match(request.url);
  if (cached) return rangeFromCache(request, cached);
  return fetch(request); // plain streaming, so playback starts immediately
}

async function rangeFromCache(request, response) {
  const range = request.headers.get('range');
  if (!range) return response;
  const match = /bytes=(\d+)-(\d*)/.exec(range);
  if (!match) return response;
  const buffer = await response.arrayBuffer();
  const start = Number(match[1]);
  const end = match[2] ? Math.min(Number(match[2]), buffer.byteLength - 1) : buffer.byteLength - 1;
  return new Response(buffer.slice(start, end + 1), {
    status: 206,
    headers: {
      'Content-Type': response.headers.get('Content-Type') || 'audio/mpeg',
      'Content-Range': `bytes ${start}-${end}/${buffer.byteLength}`,
      'Content-Length': String(end - start + 1),
    },
  });
}
