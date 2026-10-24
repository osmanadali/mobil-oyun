// Çevrimdışı: önbellekten anında aç, arkada güncelle (stale-while-revalidate).
const C = 'ray-v5', F = ['./', 'index.html', 'style.css', 'game.js', 'ads.js', 'shop.js', 'manifest.json', 'icon.svg', 'bg.svg', 'fonts/outfit-latin.woff2', 'fonts/outfit-latin-ext.woff2'];
self.addEventListener('install', e => e.waitUntil(caches.open(C).then(c => c.addAll(F)).then(() => self.skipWaiting())));
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== C).map(x => caches.delete(x)))).then(() => self.clients.claim())));
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || !e.request.url.startsWith(self.location.origin)) return;
  e.respondWith(caches.open(C).then(c => c.match(e.request).then(hit => {
    const net = fetch(e.request).then(r => { if (r.ok) c.put(e.request, r.clone()); return r; }).catch(() => hit);
    return hit || net;
  })));
});
