/* Service worker de Bahía Cauquén: guarda el programa para que abra sin
   internet. Los datos no pasan por acá. El HTML se pide siempre fresco
   (cache:'reload') para que una versión nueva llegue sin demoras. */
const CACHE = 'bhc-20260922-104048';
const ARCHIVOS = ['./', './index.html', './manifest.webmanifest', './css/app.css?v=20260922-104048',
  './js/firebase-config.js?v=20260922-104048', './js/icons.js?v=20260922-104048', './js/agenda.js?v=20260922-104048', './js/padron.js?v=20260922-104048', './js/core.js?v=20260922-104048', './js/seed.js?v=20260922-104048', './js/clima.js?v=20260922-104048', './js/calendario.js?v=20260922-104048',
  './js/v-inicio.js?v=20260922-104048', './js/v-comunidad.js?v=20260922-104048', './js/v-gestion.js?v=20260922-104048', './js/admin.js?v=20260922-104048', './js/v-vecinos.js?v=20260922-104048', './js/v-expensas.js?v=20260922-104048', './js/nube.js?v=20260922-104048', './js/app.js?v=20260922-104048',
  './img/portada-dia.jpg', './img/portada-noche.jpg', './icons/logo.png', './icons/icon-192.png'];
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
