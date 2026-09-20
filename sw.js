/* Service worker de Bahía Cauquén: guarda el programa para que abra sin
   internet. Los datos no pasan por acá. El HTML se pide siempre fresco
   (cache:'reload') para que una versión nueva llegue sin demoras. */
const CACHE = 'bhc-v2';
const ARCHIVOS = ['./', './index.html', './manifest.webmanifest', './css/app.css',
  './js/firebase-config.js', './js/icons.js', './js/agenda.js', './js/padron.js', './js/core.js', './js/seed.js', './js/clima.js',
  './js/v-inicio.js', './js/v-comunidad.js', './js/v-gestion.js', './js/admin.js', './js/v-vecinos.js', './js/v-expensas.js', './js/nube.js', './js/app.js',
  './img/portada-dia.jpg', './img/portada-noche.jpg', './icons/icon.svg', './icons/icon-192.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(ARCHIVOS)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return;   /* clima, vuelos, QR: siempre en vivo */
  const programa = e.request.mode === 'navigate' || url.pathname.endsWith('/') || /\.(html|js|css)$/.test(url.pathname);
  e.respondWith(fetch(programa ? new Request(e.request, { cache:'reload' }) : e.request)
    .then(r => { const c = r.clone(); caches.open(CACHE).then(k => k.put(e.request, c)).catch(() => {}); return r; })
    .catch(() => caches.match(e.request).then(r => r || caches.match('./index.html'))));
});
