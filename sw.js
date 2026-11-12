/* Service worker de HRU Quirófanos.
 *
 * Objetivo: que la app abra siempre, incluso sin conexión, en cualquier
 * computadora o teléfono. Solo cachea el "shell" propio (HTML, manifiesto e
 * iconos). Los datos viven en Firebase y en localStorage, no acá.
 *
 * Estrategia:
 *  - Navegaciones y HTML: red primero, con la copia cacheada como respaldo.
 *    Así el personal recibe las actualizaciones apenas se publican.
 *  - Iconos y manifiesto: cache primero, refrescando en segundo plano.
 *  - Todo lo demás (Firebase, gstatic): pasa directo a la red, sin
 *    intervención del worker.
 */
/* Al publicar cambios hay que subir esta constante (y APP_VERSION en
   index.html): es lo que hace que los dispositivos ya instalados descarten la
   copia cacheada y estrenen la versión nueva. */
const VERSION = 'hru-quirofanos-v130';
const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png',
  // Manual institucional: se precarga para poder consultarlo sin conexión.
  './libro-blanco-quirofanos-hru.pdf',
  // Manual funcional de la plataforma: mismo criterio, se consulta sin red.
  './manual-funcional-hru-quirofanos.pdf',
  // Foto del lema, en el ingreso y en la bienvenida: tiene que verse sin red.
  './equipo-quirurgico.jpg',
];

/* A propósito no se llama a skipWaiting() acá: el worker nuevo queda en espera
   y es la app la que decide cuándo estrenarlo (mensaje 'skipWaiting'). Si se
   activara solo, la página se recargaría sin aviso y una incidencia o una
   solicitud a medio escribir se perdería. */
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(VERSION)
      // addAll falla entero si un recurso falla; se agregan de a uno.
      .then((c) => Promise.all(SHELL.map((u) => c.add(u).catch(() => null))))
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((ks) => Promise.all(ks.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (e) => {
  if (e.data === 'skipWaiting') self.skipWaiting();
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  // Solo se gestiona el propio origen y dentro del alcance de la app.
  if (url.origin !== self.location.origin) return;

  const scope = new URL('./', self.location.href).pathname;
  if (!url.pathname.startsWith(scope)) return;
  // Los demos y el manual interactivo (carpeta demo/) no se guardan: se
  // descargan solo cuando alguien los abre y no ocupan lugar en la app.
  if (url.pathname.startsWith(scope + 'demo/')) return;

  const esHTML = req.mode === 'navigate'
    || (req.headers.get('accept') || '').includes('text/html');

  if (esHTML) {
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copia = res.clone();
          // Solo la app misma se guarda como respaldo sin conexión.
          const esApp = url.pathname === scope || url.pathname === scope + 'index.html';
          if (esApp && res.ok) caches.open(VERSION).then((c) => c.put('./index.html', copia)).catch(() => {});
          return res;
        })
        .catch(() => caches.match('./index.html').then((r) => r || caches.match('./')))
    );
    return;
  }

  e.respondWith(
    caches.match(req).then((hit) => {
      const red = fetch(req).then((res) => {
        if (res && res.ok) {
          const copia = res.clone();
          caches.open(VERSION).then((c) => c.put(req, copia)).catch(() => {});
        }
        return res;
      }).catch(() => hit);
      return hit || red;
    })
  );
});

/* (3.23) Aviso de cierre de la lista que manda el Apps Script por Firebase
   Cloud Messaging. Llega aunque la app esté cerrada o sin sesión: el navegador
   despierta a este worker, que muestra la notificación (con sonido y vibración
   del teléfono) y, si hay una pestaña de la app abierta, le pide que lo diga en voz. */
self.addEventListener('push', (e) => {
  let p = {};
  try { p = e.data ? e.data.json() : {}; } catch (err) { p = {}; }
  const d = p.data || p;
  const titulo = d.titulo || 'HRU Quirófanos — Aviso';
  e.waitUntil(Promise.all([
    self.registration.showNotification(titulo, {
      body: d.texto || '', tag: d.tag || 'hru-aviso', renotify: true, requireInteraction: true,
      icon: 'icon-192.png', badge: 'icon-192.png', vibrate: [400, 150, 400, 150, 400],
      actions: d.acuse ? [{ action: 'recibido', title: '✓ Recibido' }] : [],
      data: { acuse: d.acuse || '', dia: d.dia || '', k: d.k || '', f: d.f || '', vista: vistaDeAviso(d) },
    }),
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((lista) => lista.forEach((c) => c.postMessage({ tipo: 'aviso-cierre', voz: d.voz || '' }))),
  ]));
});
/* (3.31) Pantalla a la que lleva cada aviso. Si el Apps Script no la manda, se
   deduce de la etiqueta (sirve también para los avisos de versiones anteriores). */
function vistaDeAviso(d) {
  if (/^[a-z]+$/.test(d.vista || '')) return d.vista;
  const tag = String(d.tag || '');
  if (tag.indexOf('equipos-') === 0) return 'propuesta';
  if (/^(nollego|reemp|baja)-/.test(tag)) return 'propuestahoy';
  if (tag.indexOf('guardia-vispera-') === 0) return 'guardias';
  if (tag.indexOf('anest-') === 0) return 'anestesia';
  return 'recordatorios';
}
/* Tocar la notificación (o «Recibido») confirma la recepción ante el Apps Script. */
function acusar(n) {
  const a = (n && n.data) || {};
  if (!a.acuse) return Promise.resolve();
  return fetch(a.acuse, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify({ accion: 'acuse', dia: a.dia, k: a.k, f: a.f, via: 'push' }) }).catch(() => {});
}

/* Notificaciones: si el navegador entrega el aviso al worker, al tocarlo se
   enfoca la pestaña de la app en lugar de abrir una nueva. */
/* (3.31) Abre la app EN la pantalla del aviso (…#guardias, …#propuesta). Si ya
   está abierta, la trae al frente y le pide ir ahí; si no se puede enfocar
   (pasa en algunos Android con la app instalada), abre una ventana nueva en
   lugar de quedarse sin hacer nada. Un solo waitUntil para todo. */
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const datos = e.notification.data || {};
  const vista = /^[a-z]+$/.test(datos.vista || '') ? datos.vista : '';
  const url = new URL('./' + (vista ? '#' + vista : ''), self.registration.scope).href;
  const abrir = () => (self.clients.openWindow ? self.clients.openWindow(url) : null);
  e.waitUntil(Promise.all([
    acusar(e.notification),
    e.action === 'recibido' ? null : self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((lista) => {
      const app = lista.find((c) => c.url.indexOf(self.registration.scope) === 0 && c.url.indexOf('/demo/') < 0);
      if (!app) return abrir();
      if (vista) app.postMessage({ tipo: 'ir', vista });
      return 'focus' in app ? app.focus().catch(abrir) : abrir();
    }).catch(abrir),
  ]));
});

