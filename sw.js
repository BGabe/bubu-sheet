// Cache-first service worker. Bump CACHE whenever any shipped file changes so
// installed copies pick up the update the next time the app is opened online.
const CACHE = 'bubu-v4';
const ASSETS = [
  './',
  'index.html',
  'manifest.webmanifest',
  'css/app.css',
  'js/app.js',
  'js/checks.js',
  'js/data.js',
  'js/dom.js',
  'js/rules.js',
  'js/store.js',
  'js/ui/inspiration.js',
  'js/ui/inventory.js',
  'js/ui/notes.js',
  'js/ui/roll.js',
  'js/ui/sheet.js',
  'js/ui/spells.js',
  'js/ui/warlock.js',
  'icons/icon-180.png',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon-maskable-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  event.respondWith(
    caches.match(req, { ignoreSearch: true }).then((hit) => {
      if (hit) return hit;
      return fetch(req).catch(() => (req.mode === 'navigate' ? caches.match('index.html') : Response.error()));
    }),
  );
});
