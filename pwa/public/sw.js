// Service Worker — Când reciclăm?
// Offline-first: cache shell, stale-while-revalidate for API, cache-first for fonts/icons

// v2 (27 iul 2026): cache-first .js/.json ar fi pinuit /webmcp.js și
// snapshot-urile /data/agents/* — bump obligatoriu la orice fișier static nou.
const VERSION = 'v2';
const SHELL_CACHE = `cr-shell-${VERSION}`;
const API_CACHE = `cr-api-${VERSION}`;
const STATIC_CACHE = `cr-static-${VERSION}`;

const SHELL = ['/', '/index.html', '/manifest.webmanifest', '/favicon.svg'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => ![SHELL_CACHE, API_CACHE, STATIC_CACHE].includes(k))
          .map((k) => caches.delete(k)),
      ),
    ).then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // API: stale-while-revalidate (show cached fast, update in background)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      caches.open(API_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        const fetchPromise = fetch(request)
          .then((res) => {
            if (res.ok) cache.put(request, res.clone());
            return res;
          })
          .catch(() => cached);
        return cached || fetchPromise;
      }),
    );
    return;
  }

  // Navigations: network first, fall back to shell
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(async () => {
        const cache = await caches.open(SHELL_CACHE);
        return (await cache.match('/')) ?? Response.error();
      }),
    );
    return;
  }

  // Static assets: cache first, network fallback
  if (
    url.origin === location.origin &&
    (url.pathname.match(/\.(?:png|svg|webp|woff2?|css|js|json)$/) ||
      url.pathname.startsWith('/assets/'))
  ) {
    event.respondWith(
      caches.open(STATIC_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        const res = await fetch(request);
        if (res.ok) cache.put(request, res.clone());
        return res;
      }),
    );
  }
});

// Push notifications (VAPID) — Week 4 wire-up
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title ?? 'Când reciclăm?';
  const body = data.body ?? 'Verifică programul de mâine.';
  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: 'reminder',
      data: data.url ? { url: data.url } : undefined,
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((wins) => {
      for (const w of wins) {
        if (w.url.endsWith(url) && 'focus' in w) return w.focus();
      }
      return self.clients.openWindow(url);
    }),
  );
});
