// Kill-switch service worker.
// A previous version of this site (or another project on this localhost port,
// or a browser extension) registered a service worker with the browser. The
// browser keeps polling /sw.js for updates, which produced repeated 404s in
// the dev server log.
//
// This worker takes over the registration, then immediately unregisters
// itself and reloads any open tabs. After it runs once per client, no
// service worker remains and the /sw.js requests stop.

self.addEventListener('install', () => {
  // Activate this worker without waiting for old clients to close.
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    // 1. Wipe every cache the previous worker may have left behind.
    const cacheKeys = await caches.keys();
    await Promise.all(cacheKeys.map((key) => caches.delete(key)));

    // 2. Unregister this worker.
    await self.registration.unregister();

    // 3. Reload all controlled clients so they fetch fresh, un-SW-controlled.
    const clients = await self.clients.matchAll({ type: 'window' });
    for (const client of clients) {
      client.navigate(client.url);
    }
  })());
});
