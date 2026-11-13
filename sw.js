/* Service worker de Bahía Cauquén: guarda el programa para que abra sin
   internet. Los datos no pasan por acá. El HTML se pide siempre fresco
   (cache:'reload') para que una versión nueva llegue sin demoras. */
const CACHE = 'bhc-20261113-145047';
const ARCHIVOS = ['./', './index.html', './manifest.webmanifest', './css/app.css?v=7b374d52e7',
  './js/firebase-config.js?v=436e2fd7f5', './js/icons.js?v=9438a0dade', './js/agenda.js?v=52eb2c7f4b', './js/padron.js?v=609a9fe311', './js/core.js?v=70f6076421', './js/seed.js?v=bb1e7aba3d', './js/clima.js?v=03cd3e043e', './js/calendario.js?v=4c8c2f6ebc',
  './js/v-inicio.js?v=0f57e9ec56', './js/v-comunidad.js?v=5359065d81', './js/v-gestion.js?v=576befcd8e', './js/admin.js?v=5cfb562d3f', './js/v-vecinos.js?v=e8125016a0', './js/v-expensas.js?v=d8255d3ad9', './js/v-plan.js?v=fd04e5772b', './js/octavo-pdf.js?v=086165add8', './js/v-debito.js?v=c844498343', './js/v-contable.js?v=76ed8cac61', './js/v-servicio.js?v=86308471cc', './js/v-legal.js?v=7a0459329d', './js/v-hotel.js?v=bff5f501fb', './js/hotel-diario.js?v=78327f86dd', './js/v-cuidados.js?v=4f9ff758ab', './js/v-casa.js?v=1560341cd7', './js/mapa.js?v=f2e8f7dd38', './js/ronda-mapa.js?v=459511808e', './js/recorrido.js?v=d04de41dfa', './js/reglas.js?v=90fa01b34e', './js/asistente.js?v=016c84b986', './js/v-manual.js?v=75897056a9', './js/push.js?v=cfbdc889f0', './js/sismos.js?v=50a67626c7', './js/nube.js?v=4207a3a0c6', './js/adjuntos.js?v=f452ad2e36', './js/historial.js?v=e91e6e6e66', './js/v-supervisor.js?v=0358cb2e49', './js/guardia.js?v=26cfd005c6', './js/mantenimiento.js?v=5c31dbb4c1', './js/mant-vivo.js?v=462987e098', './js/relevos.js?v=d4f91679a1', './js/turnos-vivo.js?v=3baf8132c4', './js/informe-policia.js?v=be3a71f643', './js/v-informes.js?v=86cdcc4ba7', './js/portal-vivo.js?v=c1844aff30', './js/van-chofer.js?v=93bcde1a86', './js/frase.js?v=d588c240d5', './js/gracias.js?v=2fbe113e12', './js/v-consejo.js?v=ee2bf4e3fd', './js/app.js?v=3cc2493b96',
  './img/portada-dia.jpg', './img/frase-pizarra.jpg', './img/letras/patrick-hand-sc.woff2', './img/letras/mrs-saint-delafield.woff2', './img/portada-noche.jpg', './icons/logo.png', './icons/icon-192.png', './icons/badge.png', './img/logo-noche.png',
  './img/correos/correo-argentino.svg', './img/correos/andreani.svg', './img/correos/oca.svg', './img/correos/ocasa.svg', './img/correos/mercadolibre.png'];
/* 04-11-2026: cada archivo del programa lleva en ?v= una huella de SU contenido
   (version.py). Al llegar una versión nueva, lo que no cambió se copia de lo ya
   guardado y solo se baja de internet lo que cambió: antes se volvía a bajar
   todo (3,4 MB) con cada versión, y con señal floja la app tardaba en abrir. */
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => Promise.all(ARCHIVOS.map(u =>
  (/[?&]v=/.test(u) ? caches.match(u) : Promise.resolve(null)).then(r => r ? c.put(u, r) : c.add(new Request(u, { cache:'reload' })))))).then(() => self.skipWaiting())); });
/* 13-11-2026 · Solo se borran las copias del barrio ('bhc-…'): HRU vive en la misma dirección (claudioravasi-ai.github.io) y antes cada app le borraba a la otra la copia para usar sin señal. */
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE && k.startsWith('bhc-')).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
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
  /* 18-10-2026: el programa de la base (Firebase, con su versión en la
     dirección: no cambia nunca) también queda guardado, así el policía que
     abre un QR sin señal guarda el paso y lo manda apenas vuelve. */
  if (url.hostname === 'www.gstatic.com' && url.pathname.startsWith('/firebasejs/')){
    e.respondWith(caches.match(e.request).then(r => r || fetch(e.request).then(x => { if (x && (x.ok || x.type === 'opaque')){ const c = x.clone(); caches.open(CACHE).then(k => k.put(e.request, c)).catch(() => {}); } return x; })));
    return;
  }
  /* 04-11-2026: la letra de Google (Manrope) queda guardada: se usa la guardada al
     instante y, si hay internet, se renueva por detrás. Antes cada apertura esperaba
     a Google antes de mostrar la primera pantalla. */
  /* El lector de PDF (pdf.js, con su versión en la dirección: no cambia nunca) también queda guardado. */
  if (url.hostname === 'cdnjs.cloudflare.com' && url.pathname.includes('/pdf.js/')){
    e.respondWith(caches.match(e.request).then(r => r || fetch(e.request).then(x => { if (x && (x.ok || x.type === 'opaque')){ const c = x.clone(); caches.open(CACHE).then(k => k.put(e.request, c)).catch(() => {}); } return x; })));
    return;
  }
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com'){
    e.respondWith(caches.match(e.request).then(r => { const red = fetch(e.request).then(x => { if (x && (x.ok || x.type === 'opaque')){ const c = x.clone(); caches.open(CACHE).then(k => k.put(e.request, c)).catch(() => {}); } return x; });
      return r || red; }));
    return;
  }
  if (url.origin !== self.location.origin) return;   /* clima, vuelos, QR: siempre en vivo */
  /* 04-11-2026: las fotos y los dibujos del barrio (portada, logo, íconos) se muestran
     al instante desde lo guardado y se renuevan por detrás. Antes se pedían a internet
     primero y, con señal floja, la portada o el logo quedaban sin cargar. */
  if (/\.(jpe?g|png|svg|webp|gif|ico)$/i.test(url.pathname)){
    e.respondWith(caches.match(e.request, { ignoreSearch:true }).then(r => { const red = fetch(e.request, { cache:'no-cache' }).then(x => guardar(e.request, x));
      if (r){ red.catch(() => {}); return r; } return red; }));
    return;
  }
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
   segundos (18-10-2026: cada 4, hasta 15 minutos, más largo), hasta que se toca (o se desliza), hasta que
   otro del lote contesta (llega "llegada-fin:<id>") o hasta que la app
   abierta lo calla. Cada vez se cierra el anterior y se muestra uno nuevo,
   así suena también donde un aviso repetido llegaría mudo. La garita además
   lo reenvía cada 30 segundos durante 15 minutos (para el iPhone, que no deja insistir solo).
   ========================================================= */
const INSISTE = new Map();
const baseLlegada = link => { const m = /^llegada(?:-fin)?:([^:]+)/.exec(link || ''); return m ? 'llegada-' + m[1] : ''; };
const cerrarLlegada = base => self.registration.getNotifications().then(ns => ns.forEach(n => { if (String(n.tag || '').startsWith(base)) n.close(); }));
async function mostrarLlegada(base, titulo, op){
  await cerrarLlegada(base);
  return self.registration.showNotification(titulo, { ...op, tag: base + '-' + Date.now(), renotify:true, requireInteraction:true });
}
async function insistirLlegada(base, titulo, op){
  const fin = Date.now() + 15 * 60000, marca = {}; INSISTE.set(base, marca);
  while (INSISTE.get(base) === marca && Date.now() < fin){
    await new Promise(r => setTimeout(r, 4000));
    if (INSISTE.get(base) !== marca) break;
    const ns = await self.registration.getNotifications();
    if (!ns.some(n => String(n.tag || '').startsWith(base))) break;      /* la tocó o la deslizó */
    await mostrarLlegada(base, titulo, { ...op, timestamp: Date.now() });
  }
  if (INSISTE.get(base) === marca) INSISTE.delete(base);
}
/* =========================================================
   EL CAMIÓN Y EL CORREO TAMBIÉN SUENAN COMO UNA LLAMADA (pedido de Claudio,
   20-10-2026: "entró el camión, tenía el celular bloqueado cargando y no
   sonó; tiene que avisar como una llamada o un WhatsApp"). Igual que "Llegó
   sin aviso": el teléfono lo vuelve a hacer sonar y vibrar cada 4 segundos
   hasta que se toca o se desliza, como mucho 45 segundos el camión y 1
   minuto el correo que va a tu casa. Cada vez se cierra el anterior y se
   muestra uno nuevo (tag "camion-<id>~<hora>"), porque un aviso repetido
   con el mismo nombre en muchos teléfonos llega mudo.
   ========================================================= */
const SUENA_COMO_LLAMADA = { camion:45000, correo:60000 };
const cerrarSerie = base => self.registration.getNotifications().then(ns => ns.forEach(n => { if (String(n.tag || '').split('~')[0] === base) n.close(); }));
async function insistirSerie(base, titulo, op, dura){
  const fin = Date.now() + dura, marca = {}; INSISTE.set(base, marca);
  while (INSISTE.get(base) === marca && Date.now() < fin){
    await new Promise(r => setTimeout(r, 4000));
    if (INSISTE.get(base) !== marca) break;
    const ns = await self.registration.getNotifications();
    if (!ns.some(n => String(n.tag || '').split('~')[0] === base)) break;    /* la tocó o la deslizó */
    await cerrarSerie(base);
    await self.registration.showNotification(titulo, { ...op, tag: base + '~' + Date.now(), timestamp: Date.now() });
  }
  if (INSISTE.get(base) === marca) INSISTE.delete(base);
}
self.addEventListener('message', e => {
  /* La app contestó (o la vio en pantalla): se calla y se saca de la bandeja. */
  /* El camión y el correo solo dejan de sonar: el aviso queda en la bandeja. */
  const b = e.data && e.data.callar; if (b){ INSISTE.delete(b); if (/^llegada-/.test(b)) e.waitUntil(cerrarLlegada(b)); }
});
self.addEventListener('notificationclose', e => { const b = baseLlegada(e.notification.data && e.notification.data.link) || (e.notification.data && e.notification.data.serie); if (b) INSISTE.delete(b); });
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
    if (base){ op.vibrate = [900, 200, 900, 200, 900, 200, 900, 200, 1200]; op.data.link = d.link;
      /* Con la app a la vista, la ventana de adentro hace sonar y pide respuesta: el aviso no insiste. */
      if (!iOS && aLaVista){ op.silent = true; delete op.vibrate; return mostrarLlegada(base, titulo, op); }
      return mostrarLlegada(base, titulo, op).then(() => insistirLlegada(base, titulo, op)); }
    if (!iOS && aLaVista){ op.silent = true; delete op.vibrate; }
    const dura = SUENA_COMO_LLAMADA[d.sonido];
    if (dura && op.tag && !op.silent){ const serie = op.tag;
      const fuerte = { ...op, requireInteraction:true, renotify:true, tag: serie + '~' + Date.now(), data:{ ...op.data, serie },
        vibrate: d.sonido === 'camion' ? [400, 120, 400, 120, 400, 120, 900] : [600, 150, 600, 150, 900] };
      return cerrarSerie(serie).then(() => self.registration.showNotification(titulo, fuerte)).then(() => insistirSerie(serie, titulo, fuerte, dura)); }
    return self.registration.showNotification(titulo, op);
  }));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  let link = (e.notification.data && e.notification.data.link) || '';
  const bl = baseLlegada(link) || (e.notification.data && e.notification.data.serie); if (bl) INSISTE.delete(bl);
  if (/^llegada-fin:/.test(link)) link = 'visitas';
  if (/^llegada:/.test(link) && (e.action === 'si' || e.action === 'no' || e.action === 'noesta')) link = 'responder:' + link + ':' + e.action;
  if (/^visitas:no~/.test(link) && (e.action === 'cambiar' || e.action === 'nollega')) link = link + '~' + e.action;
  e.waitUntil(self.clients.matchAll({ type:'window', includeUncontrolled:true }).then(cs => {
    const c = cs.find(x => x.url.startsWith(self.registration.scope));
    if (c){ c.focus(); if (link) c.postMessage({ abrir: link }); return; }
    return self.clients.openWindow('./' + (link ? '?abrir=' + encodeURIComponent(link) : ''));
  }));
});

/* LOS PASOS DE LA RONDA SALEN CON EL TELÉFONO BLOQUEADO (pedido de Claudio,
   09-11-2026: "que el policía lea el último Hub, cierre el teléfono y le
   llegue igual a la garita"). Con la pantalla apagada o el navegador cerrado
   la página no puede hacer nada; este programa (el service worker) sí: en
   Android (Chrome), cuando vuelve la señal el propio navegador lo despierta
   ("sync") y manda los pasos guardados directo a la base, por la dirección
   pública de Firebase, con las mismas reglas que si los mandara la página
   (la clave del Hub y el código de ronda vigente; la hora "at" la pone el
   servidor). Si todavía no hay señal, el navegador vuelve a intentar solo.
   La página le deja la lista en IndexedDB (js/ronda-mapa.js, RondaFondo) y
   después lee qué salió. En iPhone (Safari) esto no existe: ahí salen al
   prender la pantalla con la página abierta o al leer el próximo QR. */
const RF_DB = 'bhc-ronda', RF_ST = 'kv';
const rfAbrir = () => new Promise((ok, mal) => { const r = indexedDB.open(RF_DB, 1); r.onupgradeneeded = () => r.result.createObjectStore(RF_ST); r.onsuccess = () => ok(r.result); r.onerror = () => mal(r.error); });
const rfLeer = k => rfAbrir().then(db => new Promise((ok, mal) => { const q = db.transaction(RF_ST).objectStore(RF_ST).get(k); q.onsuccess = () => ok(q.result); q.onerror = () => mal(q.error); }));
const rfPoner = (k, v) => rfAbrir().then(db => new Promise((ok, mal) => { const t = db.transaction(RF_ST, 'readwrite'); t.objectStore(RF_ST).put(v, k); t.oncomplete = () => ok(); t.onerror = () => mal(t.error); }));
async function rondaFondo(){
  const d = await rfLeer('cola'); if (!d || !d.db || !Array.isArray(d.lista) || !d.lista.length) return;
  if (!/^https:\/\/[a-z0-9-]+\.(firebaseio\.com|[a-z0-9-]+\.firebasedatabase\.app)$|^http:\/\/localhost:\d+$/.test(d.db)) return;
  const hechos = (await rfLeer('hechos')) || [], ya = new Set(hechos.map(h => h.id)), quedan = [];
  for (const x of d.lista){
    if (!x || !x.id || ya.has(x.id)) continue;
    let r = null;
    try { r = await fetch(`${d.db}/staff/pasos/${encodeURIComponent(x.id)}.json`, { method:'PUT', headers:{ 'Content-Type':'application/json' },
      body: JSON.stringify({ id:x.id, punto:x.punto, k:x.k, c:x.c, nombre:x.nombre, t:x.t, ...(x.h ? { h:x.h } : {}), at:{ '.sv':'timestamp' } }) }); }
    catch(e){ quedan.push(x); continue; }   /* sin señal todavía */
    if (r.ok) hechos.push({ id:x.id, ok:1, at:Date.now() });
    else if (r.status === 401 || r.status === 403) hechos.push({ id:x.id, ok:0, at:Date.now() });   /* la base no lo acepta: ya estaba o venció */
    else { quedan.push(x); continue; }
    await rfPoner('hechos', hechos.slice(-200));   /* uno por uno: la página lo ve enseguida */
  }
  await rfPoner('cola', { ...d, lista:quedan });
  /* Avisarle a la página si está abierta (aunque sea de fondo). */
  try { (await self.clients.matchAll({ type:'window', includeUncontrolled:true })).forEach(c => c.postMessage({ rondaFondo:1 })); } catch(e){}
  if (quedan.length) throw new Error('Quedan pasos sin mandar: el navegador reintenta solo');
}
self.addEventListener('sync', e => { if (e.tag === 'ronda-cola') e.waitUntil(rondaFondo()); });
self.addEventListener('message', e => { if (e.data && e.data.rondaFondo) e.waitUntil(rondaFondo().catch(() => {})); });
