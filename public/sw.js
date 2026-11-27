/* BIG JEFF SOLAR — service worker: network first, cache fallback (works offline) */
const CACHE = 'bigjeff-v2';
self.addEventListener('install', e => { self.skipWaiting(); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin || req.headers.has('range')) return;
  e.respondWith(
    fetch(req).then(res => {
      if (res.ok && !/\.(mp4|webm|mov)$/i.test(url.pathname)) { const c = res.clone(); caches.open(CACHE).then(ch => ch.put(req, c)); }
      return res;
    }).catch(() => caches.match(req).then(r => r || caches.match('/')))
  );
});
