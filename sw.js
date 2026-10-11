/* Service worker de Bahía Cauquén: guarda el programa para que abra sin
   internet. Los datos no pasan por acá. El HTML se pide siempre fresco
   (cache:'reload') para que una versión nueva llegue sin demoras. */
const CACHE = 'bhc-20261011-161601';
const ARCHIVOS = ['./', './index.html', './manifest.webmanifest', './css/app.css?v=20261011-161601',
  './js/firebase-config.js?v=20261011-161601', './js/icons.js?v=20261011-161601', './js/agenda.js?v=20261011-161601', './js/padron.js?v=20261011-161601', './js/core.js?v=20261011-161601', './js/seed.js?v=20261011-161601', './js/clima.js?v=20261011-161601', './js/calendario.js?v=20261011-161601',
  './js/v-inicio.js?v=20261011-161601', './js/v-comunidad.js?v=20261011-161601', './js/v-gestion.js?v=20261011-161601', './js/admin.js?v=20261011-161601', './js/v-vecinos.js?v=20261011-161601', './js/v-expensas.js?v=20261011-161601', './js/v-plan.js?v=20261011-161601', './js/v-contable.js?v=20261011-161601', './js/v-servicio.js?v=20261011-161601', './js/v-legal.js?v=20261011-161601', './js/v-hotel.js?v=20261011-161601', './js/v-cuidados.js?v=20261011-161601', './js/v-casa.js?v=20261011-161601', './js/asistente.js?v=20261011-161601', './js/v-manual.js?v=20261011-161601', './js/push.js?v=20261011-161601', './js/sismos.js?v=20261011-161601', './js/nube.js?v=20261011-161601', './js/adjuntos.js?v=20261011-161601', './js/historial.js?v=20261011-161601', './js/v-supervisor.js?v=20261011-161601', './js/app.js?v=20261011-161601',
  './img/portada-dia.jpg', './img/portada-noche.jpg', './icons/logo.png', './icons/icon-192.png', './icons/badge.png', './img/logo-noche.png',
  './img/correos/correo-argentino.svg', './img/correos/andreani.svg', './img/correos/oca.svg', './img/correos/ocasa.svg', './img/correos/mercadolibre.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(ARCHIVOS)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
/* LA APP ABRE AUNQUE LA SEÑAL SEA MALA (pedido de Claudio, 11-10-2026: "a veces
   en iPhone y Android tarda en abrirse, es como si se trabara"). Antes cada
   pieza del programa (el index y unos 30 archivos) se pedía primero a internet
   y recién si internet fallaba se usaba la guardada: con señal floja (4G débil,
   Wi-Fi que "anda pero no anda") cada pedido quedaba esperando y la app tardaba
   en abrir o se quedaba en blanco. Ahora:
     · los archivos con versión (los .js y el .css llevan ?v=…) no cambian
       nunca: se usan directo de lo guardado, sin preguntar a internet;
     · el index (y lo demás del programa) se pide a internet, pero si en 3
       segundos no contestó, se usa el guardado y la versión nueva llega en
       el próximo arranque. */
const ESPERA_RED = 3000;
const guardar = (req, r) => { if (r && r.ok){ const c = r.clone(); caches.open(CACHE).then(k => k.put(req, c)).catch(() => {}); } return r; };
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return;   /* clima, vuelos, QR: siempre en vivo */
  if (url.searchParams.has('v') && /\.(js|css)$/.test(url.pathname)){
    e.respondWith(caches.match(e.request).then(r => r || fetch(e.request).then(x => guardar(e.request, x))));
    return;
  }
  const programa = e.request.mode === 'navigate' || url.pathname.endsWith('/') || /\.(html|js|css)$/.test(url.pathname);
  const red = fetch(programa ? new Request(e.request, { cache:'reload' }) : e.request).then(r => guardar(e.request, r));
  const guardada = () => caches.match(e.request).then(r => r || (e.request.mode === 'navigate' ? caches.match('./index.html') : null));
  if (!programa){ e.respondWith(red.catch(() => guardada())); return; }
  e.respondWith(new Promise(ok => {
    let listo = false; const dar = r => { if (!listo && r){ listo = true; ok(r); } };
    const reloj = setTimeout(() => guardada().then(dar), ESPERA_RED);
    red.then(r => { clearTimeout(reloj); dar(r); }).catch(() => { clearTimeout(reloj); guardada().then(r => r ? dar(r) : dar(Response.error())); });
  }));
});

/* =========================================================
   AVISOS CON LA PANTALLA APAGADA
   Google (Firebase Cloud Messaging) despierta este service worker aunque la
   app esté dormida o el celular bloqueado, y acá se muestra el aviso: con
   el ícono del barrio, la casita en la barra de estado, el sonido de
   notificación del equipo (silent:false) y vibración.
   Siempre se muestra. Antes se callaba si la app estaba a la vista, pero
   Safari (iPhone) da de baja la suscripción de una página que recibe
   avisos sin mostrarlos, y a partir de ahí no llegaba nada más.
   ========================================================= */
/* 'correo': "Andreani va a tu casa" (07-10-2026). Llega como un WhatsApp: con el
   sonido de avisos del teléfono, aunque la app esté cerrada o la sesión cerrada. */
const ICONO_TIPO = { camion:'🚛 ', correo:'📬 ', sos:'🆘 ', urgente:'⚠️ ', paquete:'📦 ', bien:'💚 ' };
self.addEventListener('push', e => {
  let j = {};
  try { j = e.data ? e.data.json() : {}; } catch(err){ j = { data:{ texto: e.data ? e.data.text() : '' } }; }
  const d = j.data || j.notification || j || {};
  const urgente = d.urgente === '1' || d.urgente === true;
  let titulo = d.titulo || d.title || 'Barrio Bahía Cauquén';
  const pre = ICONO_TIPO[d.sonido] || (urgente ? ICONO_TIPO.urgente : '');
  if (pre && /^[\p{L}\p{N}¡¿]/u.test(titulo)) titulo = pre + titulo;
  const op = {
    body: d.texto || d.body || '', icon:'./icons/icon-192.png', badge:'./icons/badge.png', lang:'es-AR', dir:'ltr',
    tag: d.tag || undefined, renotify: !!d.tag, requireInteraction: urgente || d.sonido === 'sos',
    silent: false, timestamp: Date.now(),
    vibrate: d.sonido === 'camion' ? [120, 60, 120, 60, 120, 200, 300] : d.sonido === 'correo' ? [200, 100, 200, 100, 400] : (urgente || d.sonido === 'sos') ? [500, 150, 500, 150, 500, 150, 500] : [200, 100, 200],
    /* "Llegó sin aviso": se contesta desde la notificación (en Android;
       el iPhone no muestra botones en los avisos de una app web). */
    actions: /^llegada:/.test(d.link || '') ? [{ action:'si', title:'✅ Que pase' }, { action:'no', title:'❌ No lo conozco' }] : [{ action:'abrir', title:'Abrir' }],
    data:{ link: d.link || '', sonido: d.sonido || '' },
  };
  e.waitUntil(self.clients.matchAll({ type:'window', includeUncontrolled:true }).then(cs => {
    /* Con la app a la vista ya sonó adentro (con su melodía): el aviso del
       sistema aparece igual, pero sin repetir el sonido. En iPhone no se
       toca nada, para que Safari no lo tome como un aviso "escondido". */
    const iOS = /iPhone|iPad|iPod/.test(self.navigator.userAgent || '');
    if (!iOS && cs.some(c => c.visibilityState === 'visible' && c.focused)){ op.silent = true; delete op.vibrate; }
    return self.registration.showNotification(titulo, op);
  }));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  let link = (e.notification.data && e.notification.data.link) || '';
  if (/^llegada:/.test(link) && (e.action === 'si' || e.action === 'no')) link = 'responder:' + link + ':' + e.action;
  e.waitUntil(self.clients.matchAll({ type:'window', includeUncontrolled:true }).then(cs => {
    const c = cs.find(x => x.url.startsWith(self.registration.scope));
    if (c){ c.focus(); if (link) c.postMessage({ abrir: link }); return; }
    return self.clients.openWindow('./' + (link ? '?abrir=' + encodeURIComponent(link) : ''));
  }));
});
