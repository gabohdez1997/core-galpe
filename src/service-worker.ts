import { build, files, version } from '$service-worker';

// Configurar el Service Worker para almacenamiento en caché
const CACHE_NAME = `cache-${version}`;
const ASSETS = [
    ...build, // Archivos construidos de SvelteKit
    ...files  // Archivos del directorio estático
];

// Instalar el Service Worker y almacenar los activos
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
    );
    self.skipWaiting();
});

// Eliminar cachés antiguos durante la activación
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((key) => {
                    if (key !== CACHE_NAME) {
                        return caches.delete(key);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Interceptar solicitudes y devolver desde el caché o la red
self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
                return cachedResponse;
            }
            return fetch(event.request).then((response) => {
                // Opcional: Almacenar en caché las nuevas solicitudes exitosas (ej. imágenes externas)
                return response;
            });
        })
    );
});
