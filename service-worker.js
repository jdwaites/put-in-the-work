// App-shell cache so the installed home-screen icon still opens with zero
// signal (gym wifi/cellular is exactly the case this app has to survive).
// Only same-origin app files are cached here — requests to
// api.airtable.com are left alone and go through the normal
// online/offline queue logic in js/sync.js.
//
// Bump CACHE_NAME whenever the app-shell file list changes materially; the
// activate handler deletes any previously cached version.
const CACHE_NAME = 'put-in-the-work-v7';

const APP_SHELL = [
  './',
  './index.html',
  './style.css',
  './manifest.json',
  './js/data.js',
  './js/storage.js',
  './js/sync.js',
  './js/ui.js',
  './js/recent.js',
  './js/charts.js',
  './js/export.js',
  './js/app.js',
  './js/screens/onboarding.js',
  './js/screens/home.js',
  './js/screens/workout.js',
  './js/screens/strength.js',
  './js/screens/shooting.js',
  './js/screens/benchmark.js',
  './js/screens/game.js',
  './js/screens/reports.js',
  './js/screens/settings.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/players/mal.jpg',
  './icons/players/ike.jpg',
  './icons/players/khi.jpg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) {
    return; // let cross-origin (Airtable) and non-GET requests pass through untouched
  }

  // Stale-while-revalidate: answer instantly from cache when we have it (so
  // the app opens with no network at all), then refresh the cache in the
  // background so the next launch has whatever changed.
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) =>
      cache.match(event.request).then((cached) => {
        const network = fetch(event.request)
          .then((response) => {
            if (response.ok) cache.put(event.request, response.clone());
            return response;
          })
          .catch(() => cached);
        return cached || network;
      })
    )
  );
});
