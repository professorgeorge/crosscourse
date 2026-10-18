const VERSION = 'crosscourse-v1.9.9';
const SHELL = [
  './', './index.html', './manifest.webmanifest', './css/style.css',
  './js/main.js', './js/app.js', './js/store.js', './js/time.js', './js/checks.js', './js/ai.js', './js/ui.js', './js/demo.js', './js/autopilot.js', './js/lms.js',
  './js/views/home.js', './js/views/proposals.js', './js/views/project.js', './js/views/design.js', './js/views/govern.js', './js/views/schedule.js', './js/views/sync.js',
  './icons/icon.svg', './icons/icon-192.png', './icons/icon-512.png'
];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;
  const fontish = /fontshare\.com|fonts\.(googleapis|gstatic)\.com|cdn\.fontshare/.test(url.host);
  if (!sameOrigin && !fontish) return; // AI providers, CDNs for PDF/DOCX parsing: network only
  if (sameOrigin && req.mode === 'navigate') {
    e.respondWith(fetch(req).then(r => { const c = r.clone(); caches.open(VERSION).then(x => x.put('./index.html', c)); return r; }).catch(() => caches.match('./index.html')));
    return;
  }
  // Stale-while-revalidate for shell files and fonts.
  e.respondWith(caches.open(VERSION).then(async cache => {
    const hit = await cache.match(req);
    const net = fetch(req).then(r => { if (r.ok || r.type === 'opaque') cache.put(req, r.clone()); return r; }).catch(() => hit);
    return hit || net;
  }));
});
