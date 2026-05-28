// Service Worker AURA — versión dinámica para forzar actualización
const VERSION = 'aura-v' + Date.now();

self.addEventListener('install', e => {
  self.skipWaiting(); // Activar inmediatamente sin esperar
});

self.addEventListener('activate', e => {
  // Borrar TODOS los cachés anteriores
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Network First — siempre intenta red primero, nunca sirve caché viejo
self.addEventListener('fetch', e => {
  // Solo manejar peticiones GET
  if (e.request.method !== 'GET') return;

  e.respondWith(
    fetch(e.request)
      .then(response => {
        // Solo cachear respuestas exitosas
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(VERSION).then(cache => cache.put(e.request, clone));
        }
        return response;
      })
      .catch(() => {
        // Si no hay red, usar caché como fallback
        return caches.match(e.request);
      })
  );
});
