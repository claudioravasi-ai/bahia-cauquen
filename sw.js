/* Service worker de Bahía Cauquén: guarda el programa para que abra sin
   internet. Los datos no pasan por acá. El HTML se pide siempre fresco
   (cache:'reload') para que una versión nueva llegue sin demoras. */
const CACHE = 'bhc-20260924-183504';
const ARCHIVOS = ['./', './index.html', './manifest.webmanifest', './css/app.css?v=20260924-183504',
  './js/firebase-config.js?v=20260924-183504', './js/icons.js?v=20260924-183504', './js/agenda.js?v=20260924-183504', './js/padron.js?v=20260924-183504', './js/core.js?v=20260924-183504', './js/seed.js?v=20260924-183504', './js/clima.js?v=20260924-183504', './js/calendario.js?v=20260924-183504',
  './js/v-inicio.js?v=20260924-183504', './js/v-comunidad.js?v=20260924-183504', './js/v-gestion.js?v=20260924-183504', './js/admin.js?v=20260924-183504', './js/v-vecinos.js?v=20260924-183504', './js/v-expensas.js?v=20260924-183504', './js/v-plan.js?v=20260924-183504', './js/v-contable.js?v=20260924-183504', './js/v-servicio.js?v=20260924-183504', './js/v-legal.js?v=20260924-183504', './js/push.js?v=20260924-183504', './js/sismos.js?v=20260924-183504', './js/nube.js?v=20260924-183504', './js/app.js?v=20260924-183504',
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

/* =========================================================
   AVISOS CON LA PANTALLA APAGADA
   Google (Firebase Cloud Messaging) despierta este service worker aunque la
   app esté dormida o el celular bloqueado, y acá se muestra el aviso. Si la
   app está a la vista, no se muestra nada: ya sonó adentro.
   ========================================================= */
self.addEventListener('push', e => {
  let j = {};
  try { j = e.data ? e.data.json() : {}; } catch(err){ j = { data:{ texto: e.data ? e.data.text() : '' } }; }
  const d = j.data || j.notification || j || {};
  const titulo = d.titulo || d.title || 'Barrio Bahía Cauquén';
  const urgente = d.urgente === '1' || d.urgente === true;
  const op = {
    body: d.texto || d.body || '', icon:'./icons/icon-192.png', badge:'./icons/icon-192.png', lang:'es-AR',
    tag: d.tag || undefined, renotify: !!d.tag, requireInteraction: urgente,
    vibrate: d.sonido === 'camion' ? [120, 60, 120, 60, 120, 200, 300] : urgente ? [400, 150, 400, 150, 400] : [150, 80, 150],
    data:{ link: d.link || '' },
  };
  e.waitUntil(self.clients.matchAll({ type:'window', includeUncontrolled:true }).then(cs => {
    if (cs.some(c => c.visibilityState === 'visible' && c.focused)) return;
    return self.registration.showNotification(titulo, op);
  }));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const link = (e.notification.data && e.notification.data.link) || '';
  e.waitUntil(self.clients.matchAll({ type:'window', includeUncontrolled:true }).then(cs => {
    const c = cs.find(x => x.url.startsWith(self.registration.scope));
    if (c){ c.focus(); if (link) c.postMessage({ abrir: link }); return; }
    return self.clients.openWindow('./' + (link ? '?abrir=' + encodeURIComponent(link) : ''));
  }));
});
