/* Service worker de Bahía Cauquén: guarda el programa para que abra sin
   internet. Los datos no pasan por acá. El HTML se pide siempre fresco
   (cache:'reload') para que una versión nueva llegue sin demoras. */
const CACHE = 'bhc-20261014-211605';
const ARCHIVOS = ['./', './index.html', './manifest.webmanifest', './css/app.css?v=20261014-211605',
  './js/firebase-config.js?v=20261014-211605', './js/icons.js?v=20261014-211605', './js/agenda.js?v=20261014-211605', './js/padron.js?v=20261014-211605', './js/core.js?v=20261014-211605', './js/seed.js?v=20261014-211605', './js/clima.js?v=20261014-211605', './js/calendario.js?v=20261014-211605',
  './js/v-inicio.js?v=20261014-211605', './js/v-comunidad.js?v=20261014-211605', './js/v-gestion.js?v=20261014-211605', './js/admin.js?v=20261014-211605', './js/v-vecinos.js?v=20261014-211605', './js/v-expensas.js?v=20261014-211605', './js/v-plan.js?v=20261014-211605', './js/v-contable.js?v=20261014-211605', './js/v-servicio.js?v=20261014-211605', './js/v-legal.js?v=20261014-211605', './js/v-hotel.js?v=20261014-211605', './js/v-cuidados.js?v=20261014-211605', './js/v-casa.js?v=20261014-211605', './js/mapa.js?v=20261014-211605', './js/recorrido.js?v=20261014-211605', './js/reglas.js?v=20261014-211605', './js/asistente.js?v=20261014-211605', './js/v-manual.js?v=20261014-211605', './js/push.js?v=20261014-211605', './js/sismos.js?v=20261014-211605', './js/nube.js?v=20261014-211605', './js/adjuntos.js?v=20261014-211605', './js/historial.js?v=20261014-211605', './js/v-supervisor.js?v=20261014-211605', './js/guardia.js?v=20261014-211605', './js/mantenimiento.js?v=20261014-211605', './js/relevos.js?v=20261014-211605', './js/app.js?v=20261014-211605',
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
/* =========================================================
   LLEGÓ SIN AVISO: EL TELÉFONO INSISTE SOLO (pedido de Claudio, 12-10-2026:
   "que le suene al vecino, con la app apagada o en stand-by, cada 5
   segundos hasta que responda"). Cuando llega el aviso "En la garita: …"
   (link llegada:<id>), el propio teléfono lo vuelve a hacer sonar cada 5
   segundos durante 3 minutos, hasta que se toca (o se desliza), hasta que
   otro del lote contesta (llega "llegada-fin:<id>") o hasta que la app
   abierta lo calla. Cada vez se cierra el anterior y se muestra uno nuevo,
   así suena también donde un aviso repetido llegaría mudo. La garita además
   lo reenvía cada 45 segundos (para el iPhone, que no deja insistir solo).
   ========================================================= */
const INSISTE = new Map();
const baseLlegada = link => { const m = /^llegada(?:-fin)?:([^:]+)/.exec(link || ''); return m ? 'llegada-' + m[1] : ''; };
const cerrarLlegada = base => self.registration.getNotifications().then(ns => ns.forEach(n => { if (String(n.tag || '').startsWith(base)) n.close(); }));
async function mostrarLlegada(base, titulo, op){
  await cerrarLlegada(base);
  return self.registration.showNotification(titulo, { ...op, tag: base + '-' + Date.now(), renotify:true, requireInteraction:true });
}
async function insistirLlegada(base, titulo, op){
  const fin = Date.now() + 3 * 60000, marca = {}; INSISTE.set(base, marca);
  while (INSISTE.get(base) === marca && Date.now() < fin){
    await new Promise(r => setTimeout(r, 5000));
    if (INSISTE.get(base) !== marca) break;
    const ns = await self.registration.getNotifications();
    if (!ns.some(n => String(n.tag || '').startsWith(base))) break;      /* la tocó o la deslizó */
    await mostrarLlegada(base, titulo, { ...op, timestamp: Date.now() });
  }
  if (INSISTE.get(base) === marca) INSISTE.delete(base);
}
self.addEventListener('message', e => {
  /* La app contestó (o la vio en pantalla): se calla y se saca de la bandeja. */
  const b = e.data && e.data.callar; if (b){ INSISTE.delete(b); e.waitUntil(cerrarLlegada(b)); }
});
self.addEventListener('notificationclose', e => { const b = baseLlegada(e.notification.data && e.notification.data.link); if (b) INSISTE.delete(b); });
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
    actions: /^llegada:/.test(d.link || '') ? [{ action:'si', title:'✅ Que pase' }, { action:'noesta', title:'🏠 No estoy en casa' }]
      /* "Tu visita todavía no llegó" (12-10-2026) */
      : /^visitas:no~/.test(d.link || '') ? [{ action:'cambiar', title:'🕑 Cambiar el horario' }, { action:'nollega', title:'❌ Ya no viene' }]
      /* "… viene hoy a las 9 h" (12-10-2026): abre el mensaje listo para WhatsApp */
      : /^visitas:rec~/.test(d.link || '') ? [{ action:'abrir', title:'💬 Mandar el recordatorio' }] : [{ action:'abrir', title:'Abrir' }],
    data:{ link: d.link || '', sonido: d.sonido || '' },
  };
  const base = baseLlegada(d.link);
  e.waitUntil(self.clients.matchAll({ type:'window', includeUncontrolled:true }).then(cs => {
    /* Con la app a la vista ya sonó adentro (con su melodía): el aviso del
       sistema aparece igual, pero sin repetir el sonido. En iPhone no se
       toca nada, para que Safari no lo tome como un aviso "escondido". */
    const iOS = /iPhone|iPad|iPod/.test(self.navigator.userAgent || '');
    const aLaVista = cs.some(c => c.visibilityState === 'visible' && c.focused);
    /* Ya contestó otro del lote: se calla y queda dicho quién y qué. */
    if (/^llegada-fin:/.test(d.link || '')){ INSISTE.delete(base);
      const callado = { ...op, actions:[], tag: base + '-fin', renotify:false, requireInteraction:false, silent:true }; delete callado.vibrate;
      return cerrarLlegada(base).then(() => self.registration.showNotification(titulo, callado)); }
    if (base){ op.vibrate = [600, 200, 600, 200, 600, 200, 900]; op.data.link = d.link;
      /* Con la app a la vista, la ventana de adentro hace sonar y pide respuesta: el aviso no insiste. */
      if (!iOS && aLaVista){ op.silent = true; delete op.vibrate; return mostrarLlegada(base, titulo, op); }
      return mostrarLlegada(base, titulo, op).then(() => insistirLlegada(base, titulo, op)); }
    if (!iOS && aLaVista){ op.silent = true; delete op.vibrate; }
    return self.registration.showNotification(titulo, op);
  }));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  let link = (e.notification.data && e.notification.data.link) || '';
  const bl = baseLlegada(link); if (bl) INSISTE.delete(bl);
  if (/^llegada-fin:/.test(link)) link = 'visitas';
  if (/^llegada:/.test(link) && (e.action === 'si' || e.action === 'no' || e.action === 'noesta')) link = 'responder:' + link + ':' + e.action;
  if (/^visitas:no~/.test(link) && (e.action === 'cambiar' || e.action === 'nollega')) link = link + '~' + e.action;
  e.waitUntil(self.clients.matchAll({ type:'window', includeUncontrolled:true }).then(cs => {
    const c = cs.find(x => x.url.startsWith(self.registration.scope));
    if (c){ c.focus(); if (link) c.postMessage({ abrir: link }); return; }
    return self.clients.openWindow('./' + (link ? '?abrir=' + encodeURIComponent(link) : ''));
  }));
});
