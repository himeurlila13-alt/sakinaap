// L'ancienne version web de SakinApp utilisait ce service worker. Il se retire
// de lui-même et vide son cache, pour que le site s'affiche toujours à jour.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((cles) => Promise.all(cles.map((c) => caches.delete(c))))
      .then(() => self.registration.unregister())
      .then(() => self.clients.matchAll())
      .then((clients) => clients.forEach((c) => c.navigate(c.url))),
  );
});
