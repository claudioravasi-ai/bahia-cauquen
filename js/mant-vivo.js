/* =========================================================
   MANTENIMIENTO EN VIVO: EL BRAZO DE LOS CHICOS DE MANTENIMIENTO
   (pedido de Claudio, 15-10-2026)
   "Cuando la garita anota su nombre, apellido, DNI, mail y móvil (una vez;
   después el botón de entrada lo activa y el de salida lo desactiva), la
   app les manda un enlace por WhatsApp como al policía nocturno. El enlace
   abre un brazo de la app con el mismo mapa del barrio: con el dedo marcan
   dónde están trabajando (uno o más puntos a la vez), los editan y los
   concluyen ('acá cortamos el pasto', 'acá arreglamos la banquina'), en
   tiempo real. La garita, los vecinos, la Administración y el hotel los
   siguen. Cualquiera les puede mandar un mensaje y ellos responder. Al
   salir, queda en su propia bitácora y les llega por mail el parte del
   día en PDF, de una sola página."

   CÓMO FUNCIONA
   · Entrada (garita, js/mantenimiento.js): se crea un enlace secreto que
     vale solo para esa persona y ese turno (staff/mantCodigos/<clave>, 20
     letras al azar, vence a las 16 h) y se abre WhatsApp con el mensaje
     listo para mandar a su celular.
   · El enlace (#/mant/<clave>.<id>) abre el brazo SIN cuenta: el teléfono
     entra a la base como "anónimo" (Firebase) y se anota en
     mantSesion/<su id> con la clave. Las reglas de la base aceptan sus
     puntos y sus mensajes solo mientras la clave esté vigente: con la
     salida se borra y el enlace deja de andar al instante.
   · Los puntos viven en barrio/mantVivo (junto con "quién está trabajando",
     con nombre y la inicial del apellido). Los leen los vecinos, la
     garita, la Administración, la supervisión y el hotel. Cada persona de
     mantenimiento solo puede escribir y borrar los suyos.
   · Los mensajes viven en mantChat/<persona>/<conversación>: cada vecino
     ve solo su conversación; la garita y la Administración ven todas (son
     el personal del barrio). Se borran con la salida.
   · Salida: se guarda la jornada en staff/mantJornadas (la bitácora de
     mantenimiento, aparte de la de la garita: qué hizo, dónde, entrada,
     salida, quiénes trabajaron ese día y cuántos mensajes hubo, sin los
     textos), se borran los puntos, el enlace y los mensajes, y sale el
     parte por correo con el PDF adjunto (Apps Script, versión 14).

   PROTECCIÓN DE DATOS (Ley 25.326)
   · El DNI, el celular y el correo quedan en staff/mantenimiento (garita y
     Administración). Al público va solo "Juan P." y lo que está haciendo.
   · El enlace no lleva nombre ni DNI: solo la clave y un número interno.
   · Las jornadas se guardan 12 meses y después se borran solas.

   Ideas de apps con más de 1000 estrellas en GitHub (solo la idea, código
   propio): el mapa colaborativo en vivo, con un color por persona, de
   Mapus (3.5k★, MIT) y el editor de puntos sobre un plano de Placemark
   (1.5k★, MIT).
   ========================================================= */

const MV_TAREAS = [
  { k:'pasto',     n:'Corte de pasto',    e:'🌱', c:'#22c55e' },
  { k:'banquina',  n:'Arreglo de banquina', e:'🚧', c:'#f59e0b' },
  { k:'poda',      n:'Poda',              e:'🌳', c:'#65a30d' },
  { k:'limpieza',  n:'Limpieza',          e:'🧹', c:'#06b6d4' },
  { k:'luz',       n:'Luminarias',        e:'💡', c:'#eab308' },
  { k:'agua',      n:'Agua y riego',      e:'💧', c:'#3b82f6' },
  { k:'pintura',   n:'Pintura',           e:'🎨', c:'#ec4899' },
  { k:'nieve',     n:'Nieve y sal',       e:'❄️', c:'#818cf8' },
  { k:'arreglo',   n:'Arreglos varios',   e:'🔧', c:'#f97316' },
  { k:'otro',      n:'Otra tarea',        e:'📍', c:'#a855f7' },
];
const mvTarea = k => MV_TAREAS.find(t => t.k === k) || MV_TAREAS[MV_TAREAS.length - 1];
const mvTareaTxt = p => p.tarea === 'otro' && p.txt ? p.txt : mvTarea(p.tarea).n;
const MV_VIGENCIA = 16 * HORA;
const MV_RETENCION = 365 * DIA;
const mvNube = () => typeof Nube !== 'undefined' && Nube.activa() && !!Nube.db;
const mvCorto = m => `${(m.nombre || '').trim().split(/\s+/)[0]}${m.apellido ? ' ' + m.apellido.trim()[0].toUpperCase() + '.' : ''}`;
const mvTono = mid => { let h = 0; String(mid).split('').forEach(c => { h = (h * 31 + c.charCodeAt(0)) % 360; }); return h; };

/* ---------- lo que está en vivo ---------- */
const mvTodo = () => aLista(Store.s.mantVivo).filter(x => x && x.id);
const mvPersonas = () => mvTodo().filter(x => x.tipo === 'p').sort((a, b) => a.entra - b.entra);
const mvPuntos = mid => mvTodo().filter(x => x.tipo === 'pt' && (!mid || x.mid === mid)).sort((a, b) => a.at - b.at);
const mvPersona = mid => mvPersonas().find(p => p.mid === mid) || null;

/* La clave del enlace: 20 letras y números al azar (imposible de adivinar). */
function mvClave(){
  const a = new Uint8Array(20); crypto.getRandomValues(a);
  return Array.from(a, b => 'abcdefghijkmnpqrstuvwxyz23456789'[b % 32]).join('');
}
const mvEnlace = (tok, mid) => location.origin + location.pathname.replace(/[^/]*$/, '') + (mvNube() ? '' : '?local') + `#/mant/${tok}.${mid}`;
const mvCodigoDe = mid => aLista(Store.s.mantCodigos).find(c => c && c.mid === mid && c.vence > Date.now()) || null;
function mvTextoWa(m, c){
  return `Hola ${(m.nombre || '').trim()} 👋 La garita registró tu entrada al Barrio ${Store.s.config.nombre} (${hora(Date.now())} h).\n\n`
    + `Tocá este enlace para marcar en el mapa dónde estás trabajando y qué hiciste: ${mvEnlace(c.id, m.id)}\n\n`
    + `Desde ahí también te pueden escribir la garita, la Administración y los vecinos. El enlace se apaga solo cuando la garita marca tu salida${m.email ? ', y te llega por correo el parte del día' : ''}.`;
}

/* ---------- ENTRADA Y SALIDA (las llama js/mantenimiento.js) ---------- */
/* Entrada: clave nueva y "quién está trabajando" a la vista de todos. */
function mvEntrada(s, m, ahora){
  s.mantCodigos = aLista(s.mantCodigos).filter(c => c && c.vence > ahora && c.mid !== m.id);
  const c = { id:mvClave(), mid:m.id, nombre:mvCorto(m), vence:ahora + MV_VIGENCIA };
  s.mantCodigos.push(c);
  s.mantVivo = aLista(s.mantVivo).filter(x => x && !(x.tipo === 'p' && x.mid === m.id));
  s.mantVivo.push({ id:'p' + m.id, tipo:'p', mid:m.id, nombre:mvCorto(m), entra:ahora });
  if (typeof mantHoyPublico === 'function') mantHoyPublico(s, m.id);
  return c;
}
/* Después de marcar la entrada (en el mismo toque, para que el teléfono
   deje abrir WhatsApp): si tiene celular, sale el mensaje listo; si no, la
   tarjeta con el QR para que lo escanee ahí mismo. */
function mvMandarEnlace(m, { auto = false } = {}){
  const c = mvCodigoDe(m.id); if (!c) return;
  const wa = m.tel && typeof waNumeroAR === 'function' ? waNumeroAR(m.tel) : '';
  if (auto && wa){
    const w = window.open(`https://wa.me/${wa}?text=${encodeURIComponent(mvTextoWa(m, c))}`, '_blank', 'noopener');
    if (w !== null) return;
  }
  mvTarjetaEnlace(m.id);
}
function mvTarjetaEnlace(mid){
  const m = mantLista().find(x => x.id === mid), c = mvCodigoDe(mid);
  if (!m) return;
  if (!c) return toast('El enlace se crea al marcar la entrada', 'info');
  const wa = m.tel && typeof waNumeroAR === 'function' ? waNumeroAR(m.tel) : '';
  hoja('Enlace de mantenimiento', `<div class="mv-tarjeta" style="--h:${mvTono(mid)}">
      <div class="mv-t-cab"><span class="mv-t-av">${esc(mantIniciales(m))}</span><div class="grow"><small>Mantenimiento · hoy</small><b>${esc(mantNombre(m))}</b></div><span class="mv-vivo-dot"></span></div>
      <div class="mv-t-qr" data-qr="${esc(mvEnlace(c.id, mid))}"></div>
      <p class="mv-t-pie">Escaneá con la cámara: abre su mapa de trabajo. Vence ${hora(c.vence)} h o con la salida.</p></div>
    ${wa ? `<a class="btn btn-wa btn-block btn-grande" style="margin-top:12px" href="https://wa.me/${wa}?text=${encodeURIComponent(mvTextoWa(m, c))}" target="_blank" rel="noopener">${I('send')}Mandarle el enlace por WhatsApp</a>`
      : `<p class="muted small" style="margin:12px 2px 0">${I('phone')} No tiene celular cargado: tocá ${I('edit')} en su tarjeta y agregalo para que la próxima vez le llegue solo.</p>`}
    <button class="btn btn-sec btn-block" style="margin-top:8px" data-a="copiar" data-v="${esc(mvTextoWa(m, c))}">${I('copy')}Copiar el mensaje</button>`);
  const q = document.querySelector('#hoja .mv-t-qr'); if (q && typeof pintarQR === 'function') pintarQR(q, q.dataset.qr);
}
A['mv-enlace'] = el => { if (esStaff()) mvTarjetaEnlace(el.dataset.id); };
/* En la tarjeta de la garita: sus trabajos de ahora, el enlace y los mensajes. */
function mvChipsTarjeta(m){
  const pts = mvPuntos(m.id), hechos = pts.filter(p => p.estado === 'hecho').length, nl = MVChat.sinLeer(m.id);
  return `<span class="mv-tchips">
    <button type="button" class="mv-tc" data-a="mv-desplegar" data-id="${esc(m.id)}">${I('map')}<span>${pts.length ? `${plural(pts.length, 'trabajo')}${hechos ? ` · ${hechos} ✓` : ''}` : 'Sin puntos todavía'}</span></button>
    <button type="button" class="mv-tc" data-a="mv-enlace" data-id="${esc(m.id)}" aria-label="Enlace de ${esc(mantNombre(m))}">${I('qr')}<span>Enlace</span></button>
    <button type="button" class="mv-tc${nl ? ' nuevo' : ''}" data-a="mv-chat" data-mid="${esc(m.id)}">${I('chat')}<span>Mensajes</span>${nl ? `<em>${nl}</em>` : ''}</button></span>`;
}

/* Salida: la jornada a la bitácora de mantenimiento, se apaga todo y sale
   el parte. Se llama DESPUÉS de marcar la salida en la lista. */
function mvSalida(m, entra, sale){
  const pts = mvPuntos(m.id).map(p => ({ tarea:p.tarea, txt:p.txt || '', nota:p.nota || '', lugar:p.lugar || '', x:p.x, y:p.y, estado:p.estado, at:p.at, fin:p.fin || 0 }));
  const charlas = MVChat.resumen(m.id);
  const companeros = mantLista().map(x => { const tr = mantTramosHoy(x); if (!tr.length) return null;
    return { nombre:mvCorto(x), entra:tr[0][0], sale: x.adentro && x.id !== m.id ? 0 : tr[tr.length - 1][1], ms:tr.reduce((k, [a, b]) => k + (b - a), 0) }; }).filter(Boolean);
  const j = { id:'mj' + uid(), fecha:hoyISO(), mid:m.id, nombre:mantNombre(m), corto:mvCorto(m), entra:entra || sale, sale, puntos:pts, charlas, companeros, at:Date.now() };
  Store.cambiar(s => {
    s.mantCodigos = aLista(s.mantCodigos).filter(c => c && c.mid !== m.id && c.vence > Date.now());
    s.mantVivo = aLista(s.mantVivo).filter(x => x && x.mid !== m.id);
    s.mantJornadas = [j, ...aLista(s.mantJornadas).filter(x => x && Date.now() - (x.at || 0) < MV_RETENCION)];
    s.mantChat = aLista(s.mantChat).filter(x => x && x.mid !== m.id);
  });
  MVChat.borrar(m.id);
  mvMandarParte(j.id, m);
}

/* ---------- LOS MENSAJES ----------
   Con la base del barrio, cada equipo escucha solo lo que puede leer: la
   garita y la Administración, todas las conversaciones de quien está
   trabajando; el vecino o el hotel, la suya; el teléfono de
   mantenimiento, las suyas. Sin la base (?local), van en el Store. */
const MVChat = {
  cache:{}, refs:{}, vistos:null, antes:{},
  miHilo(){
    const u = yo(); if (!u) return '';
    return u.rol === 'guardia' ? 'garita' : u.rol === 'admin' && esAdmin() ? 'admin' : u.id;
  },
  miNombre(){
    const u = yo(); if (!u) return '';
    if (u.rol === 'guardia') return 'Garita';
    if (u.rol === 'admin' && esAdmin()) return 'Administración';
    if (u.rol === 'hotel') return typeof HOTEL_NOMBRE !== 'undefined' ? HOTEL_NOMBRE : 'Hotel';
    return `${primerNombreDe(u.nombre)}${u.casa ? ' · ' + u.casa : ''}`;
  },
  /* Todos los mensajes de una persona de mantenimiento que este equipo ve. */
  de(mid){
    if (!mvNube()){
      const ver = MVBrazo.activo ? null : esStaff() ? null : this.miHilo();
      return aLista(Store.s.mantChat).filter(x => x && x.mid === mid && (!ver || x.hilo === ver)).sort((a, b) => a.at - b.at);
    }
    const c = this.cache[mid] || {};
    return Object.entries(c).flatMap(([hilo, ms]) => Object.values(ms || {}).filter(Boolean).map(x => ({ ...x, hilo, mid }))).sort((a, b) => a.at - b.at);
  },
  hilos(mid){
    const g = {};
    this.de(mid).forEach(x => { (g[x.hilo] = g[x.hilo] || []).push(x); });
    return Object.entries(g).map(([hilo, ms]) => ({ hilo, ms, nombre:(ms.find(x => x.yo !== 'mant') || {}).nombre || this.nombreHilo(hilo), ult:ms[ms.length - 1].at })).sort((a, b) => b.ult - a.ult);
  },
  nombreHilo: h => h === 'garita' ? 'Garita' : h === 'admin' ? 'Administración' : 'Vecino',
  resumen(mid){ return this.hilos(mid).map(h => ({ con:h.nombre, n:h.ms.length })); },
  /* Lo que no se leyó: para el lado de mantenimiento, lo que le escribieron;
     para los demás, lo que contestó mantenimiento. */
  leerVistos(){ if (!this.vistos){ try { this.vistos = JSON.parse(localStorage.getItem('bhc.mv.vistos') || '{}'); } catch(e){ this.vistos = {}; } } return this.vistos; },
  marcarVisto(mid, hilo){ const v = this.leerVistos(); v[mid + '|' + hilo] = Date.now(); try { localStorage.setItem('bhc.mv.vistos', JSON.stringify(v)); } catch(e){} },
  sinLeer(mid, hilo){
    const v = this.leerVistos(), soyMant = !!MVBrazo.activo;
    return this.de(mid).filter(x => (!hilo || x.hilo === hilo) && (soyMant ? x.yo !== 'mant' : x.yo === 'mant') && x.at > (v[mid + '|' + x.hilo] || 0)).length;
  },
  async mandar(mid, hilo, texto, { yoSoy = 'otro', nombre = '' } = {}){
    texto = String(texto || '').trim().slice(0, 500); if (!texto) return false;
    if (!mvNube()){
      Store.cambiar(s => { s.mantChat = aLista(s.mantChat); s.mantChat.push({ id:uid(), mid, hilo, de:MVBrazo.activo ? MVBrazo.uid : (yo()?.id || ''), yo:yoSoy, nombre:nombre || this.miNombre(), texto, at:Date.now() }); });
      return true;
    }
    const de = MVBrazo.activo ? MVBrazo.uid : Nube.uid;
    const ref = Nube.db.ref(`mantChat/${mid}/${hilo}`).push();
    try { await ref.set({ id:ref.key, de, yo:yoSoy, nombre:(nombre || this.miNombre()).slice(0, 60), texto, at:firebase.database.ServerValue.TIMESTAMP }); return true; }
    catch(e){ console.warn('Mensaje a mantenimiento', e); toast(/permission/i.test(e.message) ? 'No se pudo mandar: la persona ya salió del barrio o falta publicar las reglas nuevas.' : 'No se pudo mandar: revisá la conexión.', 'alert'); return false; }
  },
  borrar(mid){
    if (!mvNube()) return;
    if (esStaff()) Nube.db.ref('mantChat/' + mid).remove().catch(e => console.warn('Borrar mensajes de mantenimiento', e));
    this.soltar(k => k.startsWith(mid));
  },
  soltar(filtro){ Object.keys(this.refs).filter(filtro).forEach(k => { try { this.refs[k].off(); } catch(e){} delete this.refs[k]; }); },
  /* Engancha (o suelta) las escuchas según quién está trabajando ahora. */
  sincronizar(){
    if (!mvNube()) return this.revisarNuevos();
    const mids = MVBrazo.activo ? [MVBrazo.mid] : yo() && yo().rol !== 'supervisor' ? mvPersonas().map(p => p.mid) : [];
    const todo = MVBrazo.activo || esStaff(), hilo = todo ? '' : this.miHilo();
    const quiero = new Set(mids.map(mid => todo ? mid : mid + '/' + hilo));
    this.soltar(k => !quiero.has(k));
    Object.keys(this.cache).forEach(mid => { if (!mids.includes(mid)) delete this.cache[mid]; });
    quiero.forEach(k => {
      if (this.refs[k]) return;
      const [mid] = k.split('/'), ref = Nube.db.ref('mantChat/' + k);
      this.refs[k] = ref;
      ref.on('value', snap => {
        const v = snap.val() || {};
        this.cache[mid] = todo ? v : { [hilo]: v };
        this.revisarNuevos(); MVBrazo.repintar(); mvRepintarHoja();
        if (!MVBrazo.activo) refrescarPronto();
      }, e => { console.warn('Escucha de mensajes de mantenimiento', e); delete this.refs[k]; });
    });
  },
  /* Un toque de aviso cuando llega algo nuevo del otro lado. */
  revisarNuevos(){
    const soyMant = !!MVBrazo.activo;
    const mids = soyMant ? [MVBrazo.mid] : mvPersonas().map(p => p.mid);
    mids.forEach(mid => {
      const ms = this.de(mid), n = ms.length, antes = this.antes[mid];
      this.antes[mid] = n;
      if (antes === undefined || n <= antes) return;
      const x = ms[ms.length - 1];
      if (!x || (soyMant ? x.yo === 'mant' : x.yo !== 'mant')) return;
      if (MVHoja.chat && MVHoja.chat.mid === mid && MVHoja.chat.hilo === x.hilo && hojaAbierta()) return;
      try { navigator.vibrate && navigator.vibrate([30, 60, 30]); } catch(e){}
      toast(soyMant ? `Mensaje de ${x.nombre}` : `${x.nombre} (mantenimiento) te contestó`, 'chat');
    });
  },
};
const primerNombreDe = n => String(n || '').trim().split(/\s+/)[0] || 'Vecino/a';

/* ---------- EL MAPA (el mismo plano, sin nombres de vecinos) ----------
   Los lotes con su número, las calles, el canal y la garita. Sobre eso,
   los puntos de trabajo: una gota con el dibujito de la tarea, del color
   de la persona; los terminados, en verde con una tilde. */
function mvPinSVG(p, { mio = false, sel = false, tenue = false } = {}){
  const [x, y] = mapaP(p.x, p.y), t = mvTarea(p.tarea), hecho = p.estado === 'hecho', h = mvTono(p.mid);
  const col = hecho ? '#16a34a' : `hsl(${h} 85% 52%)`;
  return `<g class="mv-pin${hecho ? ' hecho' : ' curso'}${mio ? ' mio' : ''}${sel ? ' sel' : ''}${tenue ? ' tenue' : ''}${Date.now() - (p.upd || p.at || 0) < 90000 ? ' recien' : ''}" data-mv-pt="${esc(p.id)}" role="button" tabindex="0" aria-label="${esc(mvTareaTxt(p))}${p.lugar ? ' · ' + esc(p.lugar) : ''} · ${hecho ? 'terminado' : 'en curso'} · ${esc(p.quien || '')}">
    ${hecho ? '' : `<circle class="mv-onda" cx="${x}" cy="${y - 13}" r="9" style="stroke:${col}"/>`}
    <path class="mv-gota" style="fill:${col}" d="M${x} ${y} C${x - 3} ${y - 4.5} ${x - 9} ${y - 7.5} ${x - 9} ${y - 13} a9 9 0 1 1 18 0 C${x + 9} ${y - 7.5} ${x + 3} ${y - 4.5} ${x} ${y}Z"/>
    <circle cx="${x}" cy="${y - 13}" r="6.6" class="mv-cara"/>
    <text class="mv-emo" x="${x}" y="${y - 10.4}">${t.e}</text>
    ${hecho ? `<g class="mv-tilde"><circle cx="${x + 7}" cy="${y - 19}" r="4"/><path d="M${x + 5.2} ${y - 19} l1.3 1.4 l2.6 -2.8"/></g>` : ''}
    <text class="mv-pl" x="${x}" y="${y + 6}">${esc(mapaRecortar(mvTareaTxt(p), 18))}</text></g>`;
}
function mvMapaSVG({ puntos = mvPuntos(), mio = '', sel = '', borrador = null, foco = '' } = {}){
  const [gx, gy] = MAPA_GARITA;
  const tiles = Object.entries(MAPA_LOTES).map(([l, g]) => {
    const L = typeof lote === 'function' ? lote(l) : null, gu = typeof guiaDe === 'function' ? guiaDe(l) : null;
    const base = L?.grupo === 'hotel' || L?.grupo === 'cabanas' || gu?.estado === 'cabana' ? 'h' : gu?.estado === 'baldio' ? 'b' : 'c';
    return `<g class="mv-lote ${base}"><rect x="${(-g.w / 2).toFixed(1)}" y="${(-g.d / 2).toFixed(1)}" width="${g.w.toFixed(1)}" height="${g.d}" rx="4" transform="translate(${g.x} ${g.y}) rotate(${g.ang.toFixed(1)})"/><text x="${g.x}" y="${g.y + 0.5}">${esc(l)}</text></g>`;
  }).join('');
  const calles = MAPA_CALLES.map(c => `<polyline class="calle ${c.afuera ? 'afuera' : ''}" points="${mapaPuntos(c.pts)}"/>`).join('');
  const lineas = MAPA_CALLES.filter(c => !c.afuera).map(c => `<polyline class="calle-linea" points="${mapaPuntos(c.pts)}"/>`).join('');
  const nombres = MAPA_CALLES.filter(c => c.n && c.lbl).map(c => `<text class="nombre-calle" x="${c.lbl[0]}" y="${c.lbl[1]}"${c.vertical ? ` transform="rotate(90 ${c.lbl[0]} ${c.lbl[1]})"` : ''}>${esc(c.n)}</text>`).join('');
  const ordenados = puntos.slice().sort((a, b) => (a.mid === mio) - (b.mid === mio) || (a.estado === 'hecho') - (b.estado === 'hecho'));
  const bor = borrador ? (([x, y]) => `<g class="mv-borrador"><circle cx="${x}" cy="${y}" r="14"/><circle cx="${x}" cy="${y}" r="3.2" class="c"/></g>`)(mapaP(borrador.x, borrador.y)) : '';
  return `<svg class="mapa-svg mv-svg" viewBox="${MAPA_CAJA.x} ${MAPA_CAJA.y} ${MAPA_CAJA.w} ${MAPA_CAJA.h}" preserveAspectRatio="xMidYMid meet" role="group" aria-label="Plano del barrio con los trabajos de mantenimiento">
    <defs><radialGradient id="mvTierra" cx=".5" cy=".35" r=".8"><stop offset="0" stop-color="#16384a"/><stop offset="1" stop-color="#0b1f2e"/></radialGradient>
      <linearGradient id="mvMar" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1fb6e8"/><stop offset="1" stop-color="#0a4f8a"/></linearGradient>
      <pattern id="mvOlas" width="40" height="14" patternUnits="userSpaceOnUse"><path d="M0 7 Q10 2 20 7 T40 7" fill="none" stroke="rgba(255,255,255,.18)" stroke-width="1.2"/></pattern></defs>
    <rect x="-400" y="-400" width="2000" height="1400" fill="url(#mvTierra)"/>
    <g${mapaGiradoYa ? ` transform="rotate(180 ${MAPA_CENTRO[0]} ${MAPA_CENTRO[1]})"` : ''}>
      <path class="mar" d="M-200,430 L30,420 L140,394 L250,364 L340,344 L470,353 L505,372 L530,396 L600,404 L700,438 L820,462 L940,484 L1000,506 L1300,520 L1300,800 L-200,800 Z"/>
      <path class="olas" d="M-200,430 L30,420 L140,394 L250,364 L340,344 L470,353 L505,372 L530,396 L600,404 L700,438 L820,462 L940,484 L1000,506 L1300,520 L1300,800 L-200,800 Z"/>
      <path class="verde" d="M735,298 L915,298 L924,314 L908,346 Z"/></g>
    ${[[250, 430], [780, 500]].map(([x, y]) => { const [a, b] = mapaP(x, y); return `<text class="nombre-mar" x="${a}" y="${b}">Canal Beagle</text>`; }).join('')}
    ${(([a, b]) => `<text class="nombre-verde" x="${a}" y="${b}">Espacio verde</text>`)(mapaP(850, 312))}
    ${calles}${lineas}${nombres}
    <g class="mv-lotes">${tiles}</g>
    <g class="garita-pin"><circle class="g-halo" cx="${gx}" cy="${gy}" r="16"/><circle class="g-base" cx="${gx}" cy="${gy}" r="11"/>
      ${I('shield').replace('<svg class="i ', `<svg x="${gx - 7}" y="${gy - 7}" width="14" height="14" class="i g-ic `)}<text class="g-txt" x="${gx}" y="${gy - 18}">GARITA</text></g>
    ${typeof mantCapaPines === 'function' ? mantCapaPines() : ''}
    <g class="mv-pines${foco ? ' con-foco' : ''}">${ordenados.map(p => mvPinSVG(p, { mio: p.mid === mio, sel: p.id === sel, tenue: !!foco && p.mid !== foco })).join('')}</g>${bor}
  </svg>`;
}
/* Las gotas de trabajo también en el mapa de la garita (js/mapa.js). */
const mvCapaGarita = () => { const ps = mvPuntos(); return ps.length ? `<g class="mv-pines">${ps.map(p => mvPinSVG(p)).join('')}</g>` : ''; };
/* El mapa con sus botones (acercar, alejar, todo, girar). */
function mvLienzo(opts = {}){
  setTimeout(mapaAplicar, 0);
  return `<div class="mapa-lienzo mv-lienzo">${mvMapaSVG(opts)}
    <div class="mapa-ctrl">
      <button type="button" data-a="mapa-zoom" data-v="+" aria-label="Acercar">${I('plus')}</button>
      <button type="button" data-a="mapa-zoom" data-v="-" aria-label="Alejar">${I('minus')}</button>
      <button type="button" data-a="mapa-zoom" data-v="todo" aria-label="Ver todo el barrio">${I('target')}</button>
      <button type="button" data-a="mv-girar" aria-label="Girar el plano">${I('refresh')}</button></div></div>`;
}
/* =========================================================
   EN LA GARITA: TOCAR A UNO Y VER DÓNDE ESTÁ (pedido de Claudio, 15-10-2026)
   "En la garita, al tocar en Mantenimiento a Juan Pérez, se despliega el
   mapa de mantenimiento y ven dónde está en tiempo real." Debajo de su
   tarjeta se abre el plano con SUS gotas resaltadas (las de los demás,
   tenues), centrado en lo suyo. Se redibuja solo cada vez que él marca,
   edita o termina algo (y se vuelve a centrar si cambió de lugar).
   ========================================================= */
const MVDesp = { mid:'', firma:'' };
function mvDespliegue(m){
  if (MVDesp.mid !== m.id) return '';
  const on = !!m.adentro, suyos = mvPuntos(m.id), hechos = suyos.filter(p => p.estado === 'hecho').length;
  const ult = suyos.reduce((k, p) => Math.max(k, p.upd || p.at || 0), 0);
  const recien = suyos.slice().sort((a, b) => (b.upd || b.at) - (a.upd || a.at))[0];
  const firma = suyos.map(p => `${p.id}:${p.x},${p.y}`).join('|');
  if (firma !== MVDesp.firma){ MVDesp.firma = firma; setTimeout(() => mvCentrarEn(m.id), 40); }
  return `<div class="mv-desp" style="--h:${mvTono(m.id)}" aria-label="Dónde está ${esc(mantNombre(m))}">
    <div class="mv-desp-cab"><div class="grow"><b>${I('map')}Dónde está ${esc((m.nombre || '').trim())}</b>
      <small>${on ? `<span class="mv-vivo"><i></i>En vivo</span> ${plural(suyos.length, 'trabajo')}${hechos ? ` · ${plural(hechos, 'terminado')}` : ''}${ult ? ` · último cambio ${hora(ult)} h` : ''}` : 'Está afuera del barrio'}</small></div>
      <button type="button" class="mv-desp-x" data-a="mv-desplegar" data-id="${esc(m.id)}" aria-label="Cerrar el mapa">${I('x')}</button></div>
    ${on ? `${mvLienzo({ puntos:mvPuntos(), mio:m.id, foco:m.id, sel: recien && Date.now() - (recien.upd || recien.at) < 90000 ? recien.id : '' })}
      ${suyos.length ? `<div class="mv-chips">${suyos.slice().reverse().map(p => `<button class="mv-chip ${p.estado === 'hecho' ? 'hecho' : ''}" data-a="mv-ir-punto" data-id="${esc(p.id)}" style="--c:${mvTarea(p.tarea).c}"><span>${mvTarea(p.tarea).e}</span>${esc(mvTareaTxt(p))}${p.lugar ? ` <small>${esc(p.lugar)}</small>` : ''}${p.estado === 'hecho' ? I('check') : ''}</button>`).join('')}</div>`
        : `<p class="muted small" style="margin:8px 2px 0">${I('info')} Todavía no marcó dónde está trabajando. Si no le llegó el enlace, tocá "Enlace".</p>`}`
      : `<p class="muted small" style="margin:8px 2px 0">Cuando marques su entrada, acá se ve en vivo dónde trabaja.</p>`}
  </div>`;
}
/* Centra el plano en sus gotas: una sola, bien de cerca; varias, que entren todas. */
function mvCentrarEn(mid){
  const ps = mvPuntos(mid).map(p => mapaP(p.x, p.y));
  if (!ps.length) return mapaIr({ cx:MAPA_CAJA.x + MAPA_CAJA.w / 2, cy:MAPA_CAJA.y + MAPA_CAJA.h / 2, z:1 });
  const xs = ps.map(p => p[0]), ys = ps.map(p => p[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  const z = ps.length === 1 ? 3 : Math.max(1, Math.min(3, Math.min(MAPA_CAJA.w / (x1 - x0 + 200), MAPA_CAJA.h / (y1 - y0 + 140))));
  mapaIr({ cx:(x0 + x1) / 2, cy:(y0 + y1) / 2 - 8, z });
}
A['mv-desplegar'] = el => {
  const id = el.dataset.id;
  MVDesp.mid = MVDesp.mid === id ? '' : id; MVDesp.firma = '';
  refrescar();
  if (MVDesp.mid) setTimeout(() => { const d = document.querySelector('.mv-desp'); if (d) d.scrollIntoView({ behavior:'smooth', block:'nearest' }); }, 80);
};
A['mv-ir-punto'] = el => {
  const p = mvTodo().find(x => x.id === el.dataset.id); if (!p) return;
  const [x, y] = mapaP(p.x, p.y); mapaIr({ cx:x, cy:y - 8, z:3.4 });
};
A['mv-girar'] = () => { mapaVoltear(); try { localStorage.setItem('bhc.mapa.girado', mapaGiradoYa ? '1' : '0'); } catch(e){} MVBrazo.repintar(true); mvRepintarHoja(true); };

/* Dónde cayó el dedo: el lote más cercano y la calle. */
function mvLugarDe(x, y){
  let lote = '', dl = 1e9;
  Object.entries(MAPA_LOTES).forEach(([l, g]) => { const d = Math.hypot(g.x - x, g.y - y); if (d < dl){ dl = d; lote = l; } });
  const dSeg = (p, a, b) => { const vx = b[0] - a[0], vy = b[1] - a[1], t = Math.max(0, Math.min(1, ((p[0] - a[0]) * vx + (p[1] - a[1]) * vy) / (vx * vx + vy * vy || 1))); return Math.hypot(a[0] + t * vx - p[0], a[1] + t * vy - p[1]); };
  let calle = '', dc = 1e9;
  MAPA_CALLES.filter(c => c.n && !c.afuera).forEach(c => c.pts.slice(1).forEach((b, i) => { const d = dSeg([x, y], c.pts[i], b); if (d < dc){ dc = d; calle = c.n; } }));
  const [vx, vy] = mapaP(850, 312);
  if (Math.hypot(vx - x, vy - y) < 40 && dl > 18) return 'Espacio verde';
  if (dl < 24) return `Lote ${lote}${calle && dc < 40 ? ' · ' + calle : ''}`;
  if (dc < 26) return calle;
  if (Math.hypot(MAPA_GARITA[0] - x, MAPA_GARITA[1] - y) < 30) return 'Garita y portón';
  return `Cerca del lote ${lote}`;
}

/* El toque sobre el mapa: una gota abre el trabajo; en modo "marcar", el
   lugar vacío pone un trabajo nuevo. Si el dedo arrastró, no hace nada. */
document.addEventListener('click', e => {
  const svg = e.target.closest && e.target.closest('.mv-svg, .mapa-svg'); if (!svg) return;
  if (Date.now() - mapaMovido < 350) return;
  const pin = e.target.closest('[data-mv-pt]');
  if (pin){ mvAbrirPunto(pin.dataset.mvPt); return; }
  if (MVBrazo.activo && MVBrazo.marcando && svg.classList.contains('mv-svg')){
    const p = mapaPunto(svg, e.clientX, e.clientY), [x, y] = mapaP(p.x, p.y);
    /* Afuera del plano (el mar, más allá del borde) no se marca. */
    if (x < MAPA_CAJA.x || x > MAPA_CAJA.x + MAPA_CAJA.w || y < MAPA_CAJA.y || y > MAPA_CAJA.y + MAPA_CAJA.h) return toast('Tocá dentro del barrio', 'pin');
    MVBrazo.nuevo(x, y, mvLugarDe(p.x, p.y));
  }
});
document.addEventListener('keydown', e => { const p = e.target.closest && e.target.closest('[data-mv-pt]'); if (p && (e.key === 'Enter' || e.key === ' ')){ e.preventDefault(); mvAbrirPunto(p.dataset.mvPt); } });
function mvAbrirPunto(id){
  const p = mvTodo().find(x => x.id === id); if (!p) return;
  if (MVBrazo.activo && p.mid === MVBrazo.mid) return MVBrazo.editar(id);
  const t = mvTarea(p.tarea), per = mvPersona(p.mid);
  hoja(mvTareaTxt(p), `<div class="mv-ficha" style="--c:${t.c}">
      <span class="mv-ficha-emo">${t.e}</span>
      <div class="grow"><b>${esc(mvTareaTxt(p))}</b><small>${esc(p.lugar || 'En el barrio')}</small></div>
      <span class="mv-estado ${p.estado === 'hecho' ? 'hecho' : 'curso'}">${p.estado === 'hecho' ? I('check') + 'Terminado' : '<i></i>En curso'}</span></div>
    ${p.nota ? `<p class="mv-nota">${esc(p.nota)}</p>` : ''}
    <p class="muted small" style="margin:10px 2px 0">${esc(p.quien || 'Mantenimiento')} · empezó ${hora(p.at)} h${p.fin ? ` · terminó ${hora(p.fin)} h` : ''}</p>
    ${per && !MVBrazo.activo && mvPuedeEscribir() ? `<button class="btn btn-pri btn-block" style="margin-top:12px" data-a="mv-chat" data-mid="${esc(p.mid)}">${I('chat')}Mandarle un mensaje a ${esc(per.nombre)}</button>` : ''}`);
}
const mvPuedeEscribir = () => !!yo() && !esSupervisor() && !(typeof esPropDistancia === 'function' && esPropDistancia());

/* =========================================================
   LO QUE VEN TODOS: "Mantenimiento en vivo"
   (vecinos, garita, Administración, supervisión y hotel)
   ========================================================= */
const MVHoja = { abierta:false, chat:null };
function mvRepintarHoja(forzar){
  if (!hojaAbierta()) { MVHoja.abierta = false; MVHoja.chat = null; return; }
  if (MVHoja.chat){ const c = $('#hoja .mv-chat'); if (c) mvPintarChat(); return; }
  if (MVHoja.abierta && $('#hoja .mv-en-vivo')){
    const sc = $('#hojaCuerpo')?.scrollTop || 0;
    $('#hojaCuerpo').innerHTML = mvEnVivoHtml(); if ($('#hojaCuerpo')) $('#hojaCuerpo').scrollTop = sc; mapaAplicar();
  }
}
function mvEnVivoHtml(){
  const ps = mvPersonas(), pts = mvPuntos(), hechos = pts.filter(p => p.estado === 'hecho').length;
  return `<div class="mv-en-vivo">
    <div class="mv-kpis"><span><b>${ps.length}</b><small>${ps.length === 1 ? 'trabajando' : 'trabajando'}</small></span>
      <span class="c"><b>${pts.length - hechos}</b><small>en curso</small></span><span class="h"><b>${hechos}</b><small>terminados hoy</small></span></div>
    ${mvLienzo({ puntos:pts })}
    <p class="mv-pista">${I('info')}Tocá una gota para ver qué están haciendo. Se mueve con el dedo y se acerca con dos dedos.</p>
    ${ps.length ? ps.map(per => {
      const suyos = mvPuntos(per.mid), nl = mvPuedeEscribir() ? MVChat.sinLeer(per.mid, esStaff() ? '' : MVChat.miHilo()) : 0;
      return `<div class="mv-persona" style="--h:${mvTono(per.mid)}">
        <div class="mv-per-cab"><span class="mv-av">${esc(per.nombre.slice(0, 1))}</span>
          <div class="grow"><b>${esc(per.nombre)}</b><small><i class="mv-vivo-dot"></i>desde ${hora(per.entra)} h · ${plural(suyos.length, 'trabajo')}</small></div>
          ${mvPuedeEscribir() ? `<button class="btn btn-sm btn-pri mv-msj" data-a="mv-chat" data-mid="${esc(per.mid)}">${I('chat')}<span>Mensaje</span>${nl ? `<em>${nl}</em>` : ''}</button>` : ''}</div>
        ${per.hoy && per.hoy.fecha === hoyISO() && typeof mantLugarDe === 'function' ? `<div class="mv-chips"><button class="mv-chip" data-a="mt-pin-ver" data-id="${esc(per.mid)}" style="--c:hsl(${mvTono(per.mid)} 85% 55%)"><span>⛑️</span>Hoy: ${esc([per.hoy.tarea, mantLugarDe(per.hoy.lugar)?.n].filter(Boolean).join(' · ') || 'Mantenimiento')}</button></div>` : ''}
        ${suyos.length ? `<div class="mv-chips">${suyos.map(p => `<button class="mv-chip ${p.estado === 'hecho' ? 'hecho' : ''}" data-a="mv-ver-punto" data-id="${esc(p.id)}" style="--c:${mvTarea(p.tarea).c}"><span>${mvTarea(p.tarea).e}</span>${esc(mvTareaTxt(p))}${p.lugar ? ` <small>${esc(p.lugar)}</small>` : ''}${p.estado === 'hecho' ? I('check') : ''}</button>`).join('')}</div>`
          : per.hoy && per.hoy.fecha === hoyISO() ? '' : '<p class="muted small" style="margin:6px 0 0">Todavía no marcó dónde está trabajando.</p>'}</div>`; }).join('')
      : aviso('info', 'check', 'Nadie de mantenimiento en el barrio ahora', 'Cuando la garita registre una entrada, aparece acá en vivo.')}
    ${esStaff() ? `<button class="btn btn-sec btn-block" style="margin-top:12px" data-a="mv-a-bitacora">${I('book')}Bitácora de mantenimiento</button>` : ''}
    <p class="muted tiny" style="margin:12px 2px 0">Es el personal del barrio. Los mensajes los ven la persona de mantenimiento, vos, la garita y la Administración, y se borran cuando sale.</p></div>`;
}
A['mant-ver'] = () => {
  MVHoja.chat = null; MVHoja.abierta = true;
  hoja('Mantenimiento en vivo', mvEnVivoHtml(), { ancho:'720px' });
  setTimeout(() => { mapaAplicar(); MVChat.sincronizar(); }, 30);
};
A['mv-ver-punto'] = el => mvAbrirPunto(el.dataset.id);
A['mv-a-bitacora'] = () => { cerrarHoja(); abrir('mant-bitacora'); };

/* ---------- la conversación ---------- */
A['mv-chat'] = el => {
  const mid = el.dataset.mid, per = mvPersona(mid);
  if (!per) return toast('Ya salió del barrio', 'info');
  if (esStaff() && !el.dataset.hilo){
    const hs = MVChat.hilos(mid), mio = MVChat.miHilo();
    if (hs.some(h => h.hilo !== mio)){
      MVHoja.chat = null;
      hoja(`Mensajes con ${per.nombre}`, `<div class="mv-hilos">${[{ hilo:mio, nombre: esGuardia() ? 'Garita (vos)' : 'Administración (vos)', ms:hs.find(h => h.hilo === mio)?.ms || [] }, ...hs.filter(h => h.hilo !== mio)].map(h => {
        const nl = MVChat.sinLeer(mid, h.hilo), u = h.ms[h.ms.length - 1];
        return `<button class="mv-hilo" data-a="mv-chat" data-mid="${esc(mid)}" data-hilo="${esc(h.hilo)}"><span class="mv-av">${esc(h.nombre.slice(0, 1))}</span><span class="grow"><b>${esc(h.nombre)}</b><small>${u ? esc(u.texto.slice(0, 60)) : 'Escribirle'}</small></span>${nl ? `<em>${nl}</em>` : ''}${I('right')}</button>`; }).join('')}</div>
        <p class="muted tiny" style="margin:10px 2px 0">La garita y la Administración ven todas las conversaciones del personal de mantenimiento; escribir solo pueden en la propia.</p>`);
      return;
    }
  }
  MVHoja.chat = { mid, hilo: el.dataset.hilo || MVChat.miHilo() };
  hoja(`${per.nombre} · mantenimiento`, '<div class="mv-chat"></div>', { ancho:'560px' });
  mvPintarChat();
  MVChat.sincronizar();
};
function mvPintarChat(){
  const c = MVHoja.chat, box = $('#hoja .mv-chat'); if (!c || !box) return;
  const soyMant = !!MVBrazo.activo, mio = soyMant || c.hilo === MVChat.miHilo();
  const ms = MVChat.de(c.mid).filter(x => x.hilo === c.hilo);
  MVChat.marcarVisto(c.mid, c.hilo);
  const t = box.querySelector('textarea'), borrador = t ? t.value : '', foco = t && document.activeElement === t;
  box.innerHTML = `<div class="mv-burbujas">${ms.length ? ms.map(x => { const propio = soyMant ? x.yo === 'mant' : x.yo !== 'mant';
      return `<div class="mv-b ${propio ? 'yo' : 'el'}"><small>${esc(x.nombre)} · ${hora(x.at)}</small><span>${esc(x.texto)}</span></div>`; }).join('')
      : `<p class="mv-vacio">${I('chat')}${soyMant ? 'Todavía no hay mensajes.' : 'Escribile: le llega al instante a su teléfono.'}</p>`}</div>
    ${mio ? `<form class="mv-escribir" data-f="mv-mandar"><textarea name="t" rows="1" maxlength="500" placeholder="Escribí un mensaje…" class="crece"></textarea><button class="btn btn-pri" aria-label="Mandar">${I('send')}</button></form>
      ${soyMant ? '' : `<div class="mv-rapidos">${['¿Dónde estás?', '¿Podés pasar por mi lote?', '¡Gracias!'].map(r => `<button type="button" data-a="mv-rapido" data-v="${esc(r)}">${esc(r)}</button>`).join('')}</div>`}`
      : '<p class="muted small" style="margin:8px 2px 0">Solo lectura: es la conversación de un vecino.</p>'}`;
  const nt = box.querySelector('textarea'); if (nt){ nt.value = borrador; if (foco) nt.focus(); }
  const b = box.querySelector('.mv-burbujas'); if (b) b.scrollTop = b.scrollHeight;
}
F['mv-mandar'] = async (d, form) => {
  const c = MVHoja.chat; if (!c) return;
  const t = form.querySelector('textarea'), texto = String(d.t || '').trim(); if (!texto) return;
  t.value = '';
  const ok = await MVChat.mandar(c.mid, c.hilo, texto, MVBrazo.activo ? { yoSoy:'mant', nombre:MVBrazo.nombre() } : {});
  if (!ok) t.value = texto;
  mvPintarChat();
};
A['mv-rapido'] = el => { const t = $('#hoja .mv-escribir textarea'); if (t){ t.value = el.dataset.v; t.focus(); } };
/* Enter manda; Shift+Enter, renglón nuevo (en la computadora). */
document.addEventListener('keydown', e => {
  if (e.key !== 'Enter' || e.shiftKey || !e.target.closest || !e.target.closest('.mv-escribir textarea') || matchMedia('(pointer:coarse)').matches) return;
  e.preventDefault(); e.target.form.requestSubmit();
});
document.addEventListener('close', e => { if (e.target && e.target.id === 'hoja'){ MVHoja.abierta = false; MVHoja.chat = null; MVBrazo.repintar(); } }, true);

/* =========================================================
   EL BRAZO: lo que ve el teléfono de mantenimiento (#/mant/<clave>.<id>)
   ========================================================= */
const MVBrazo = {
  KEY:'bhc.mant', activo:false, tok:'', mid:'', uid:'', marcando:false, pesta:'mapa', sel:'', borrador:null, estado:'',
  nombre(){ return (mvPersona(this.mid) || {}).nombre || 'Mantenimiento'; },
  async abrir(ruta){
    const [tok, mid] = String(ruta || '').split('.');
    this.activo = true; this.tok = tok || ''; this.mid = mid || ''; this.estado = 'conectando';
    document.body.classList.add('mv-modo');
    this.pintar();
    if (!/^[a-z2-9]{20}$/.test(this.tok) || !/^mt[a-z0-9]+$/i.test(this.mid)) { this.estado = 'malo'; return this.pintar(); }
    try {
      if (mvNube()) await this.conectarNube();
      else this.conectarLocal();
    } catch(e){
      console.warn('Brazo de mantenimiento', e);
      this.estado = /permission|vencid/i.test(String(e && e.message)) ? 'vencido' : 'sinred';
      return this.pintar();
    }
  },
  /* Con la base: entra como "anónimo", se anota con la clave y escucha. */
  async conectarNube(){
    for (let i = 0; i < 50 && !(Nube.auth && Nube.db); i++) await new Promise(r => setTimeout(r, 200));
    if (!Nube.auth) throw new Error('sin conexión');
    /* Se espera a que la base diga si ya había una sesión en este teléfono
       (si era un vecino, se usa esa: no se la cierra). */
    let u = await new Promise(r => { const off = Nube.auth.onAuthStateChanged(x => { off(); r(x); }); });
    if (!u){ const cred = await Nube.auth.signInAnonymously(); u = cred.user; }
    this.uid = u.uid;
    await Nube.db.ref('mantSesion/' + u.uid).set({ tok:this.tok, mid:this.mid, at:firebase.database.ServerValue.TIMESTAMP });
    Nube.db.ref('barrio/mantVivo').on('value', snap => {
      Store.s.mantVivo = Object.values(snap.val() || {}).filter(Boolean);
      if (!mvPersona(this.mid) && this.estado === 'listo'){ this.estado = 'salio'; }
      else if (this.estado !== 'salio') this.estado = 'listo';
      this.repintar();
    }, e => { this.estado = /permission/i.test(e.message) ? (this.estado === 'listo' ? 'salio' : 'vencido') : 'sinred'; this.pintar(); });
    MVChat.sincronizar();
  },
  /* Sin la base (?local, para probar): todo en este equipo. */
  conectarLocal(){
    const c = aLista(Store.s.mantCodigos).find(x => x && x.id === this.tok && x.mid === this.mid && x.vence > Date.now());
    if (!c) throw new Error('vencido');
    try { this.uid = localStorage.getItem('bhc.mant.uid') || ('anon' + uid()); localStorage.setItem('bhc.mant.uid', this.uid); } catch(e){ this.uid = 'anon' + uid(); }
    this.estado = 'listo';
    if (!this.oyendo){ this.oyendo = true; Store.alCambiar(() => { if (!this.activo) return;
      const vale = aLista(Store.s.mantCodigos).some(x => x && x.id === this.tok && x.vence > Date.now());
      if (!vale && this.estado === 'listo') this.estado = 'salio';
      MVChat.revisarNuevos(); this.repintar(); mvRepintarHoja(); }); }
    this.pintar();
  },
  puede(){ return this.estado === 'listo'; },
  /* ---- dibujo ---- */
  pintar(){
    const app = $('#app'); if (!app) return;
    if (this.estado !== 'listo'){
      const msg = { conectando:['Conectando con el barrio…', 'Un segundo.'], malo:['Este enlace no es válido', 'Pedile a la garita que te lo mande de nuevo.'],
        vencido:['Este enlace ya no vale', 'Se apaga cuando la garita marca tu salida. Si estás trabajando, pedile a la garita uno nuevo.'],
        salio:['Tu turno terminó', 'La garita marcó tu salida: el enlace se apagó. Si dejaste tu correo, te llega el parte del día. ¡Gracias!'],
        sinred:['Sin conexión', 'Revisá internet y volvé a tocar el enlace.'] }[this.estado] || ['…', ''];
      app.innerHTML = `<section class="mv-brazo mv-solo" id="mantPublico"><div class="mv-b-cab">${this.marca()}</div>
        <div class="mv-mensaje">${this.estado === 'conectando' ? '<div class="cargando"><span></span><span></span><span></span></div>' : `<span class="mv-m-ic">${I(this.estado === 'salio' ? 'check' : 'alert')}</span>`}
          <b>${msg[0]}</b><small>${msg[1]}</small></div></section>`;
      return;
    }
    app.innerHTML = `<section class="mv-brazo" id="mantPublico" style="--h:${mvTono(this.mid)}">${this.cuerpo()}</section>`;
    mapaAplicar();
  },
  repintar(forzar){
    if (!this.activo) return;
    if (this.estado !== 'listo' || !$('#mantPublico .mv-b-cuerpo')) return this.pintar();
    /* El mapa no se redibuja si la persona lo está moviendo. */
    if (!forzar && typeof mapaGesto !== 'undefined' && mapaGesto) return setTimeout(() => this.repintar(), 400);
    const c = $('#mantPublico'), sc = $('#mantPublico .mv-b-cuerpo')?.scrollTop || 0;
    c.innerHTML = this.cuerpo(); const nb = $('#mantPublico .mv-b-cuerpo'); if (nb) nb.scrollTop = sc;
    mapaAplicar();
  },
  marca(){ return `<span class="mv-logo">${typeof mantEngranaje === 'function' ? mantEngranaje('g1') : I('wrench')}</span><div class="grow"><small>Barrio ${esc(Store.s.config.nombre)}</small><b>Mantenimiento</b></div>`; },
  cuerpo(){
    const per = mvPersona(this.mid), mios = mvPuntos(this.mid), hechos = mios.filter(p => p.estado === 'hecho').length;
    const nl = MVChat.sinLeer(this.mid), otros = mvPersonas().filter(p => p.mid !== this.mid);
    const tab = (k, ic, t, n) => `<button type="button" class="${this.pesta === k ? 'on' : ''}" data-a="mvb-pesta" data-v="${k}" aria-pressed="${this.pesta === k}">${I(ic)}<span>${t}</span>${n ? `<em>${n}</em>` : ''}</button>`;
    return `<header class="mv-b-cab">${this.marca()}<span class="mv-vivo"><i></i>En vivo</span></header>
      <div class="mv-hola"><div class="grow"><small>Hola,</small><b>${esc((per?.nombre || '').split(' ')[0] || 'compañero')}</b></div>
        <div class="mv-reloj"><small>Entraste ${per ? hora(per.entra) + ' h' : ''}</small><b data-mv-desde="${per?.entra || Date.now()}">${mantDur(Date.now() - (per?.entra || Date.now()))}</b></div></div>
      <div class="mv-b-stats"><span><b>${mios.length - hechos}</b>en curso</span><span class="h"><b>${hechos}</b>terminados</span><span><b>${otros.length}</b>${otros.length === 1 ? 'compañero' : 'compañeros'}</span></div>
      <nav class="mv-tabs">${tab('mapa', 'map', 'Mapa')}${tab('lista', 'list', 'Trabajos', mios.length)}${tab('msj', 'chat', 'Mensajes', nl)}</nav>
      <div class="mv-b-cuerpo">${this.pesta === 'lista' ? this.lista(mios) : this.pesta === 'msj' ? this.mensajes() : this.mapa()}</div>`;
  },
  mapa(){
    return `${this.marcando ? `<div class="mv-marcando">${I('pin')}<b>Tocá en el mapa dónde estás trabajando</b><button type="button" data-a="mvb-cancelar">Cancelar</button></div>` : ''}
      <div class="mv-b-mapa${this.marcando ? ' marcando' : ''}">${mvLienzo({ mio:this.mid, sel:this.sel, borrador:this.borrador })}</div>
      ${this.marcando ? '' : `<button type="button" class="mv-fab" data-a="mvb-marcar">${I('plus')}<span>Marcar un trabajo</span></button>`}
      <p class="mv-pista">${I('info')}Podés marcar varios puntos a la vez. Tocá tu gota para editarla o darla por terminada.</p>`;
  },
  lista(mios){
    if (!mios.length) return `<div class="mv-vacio-g">${I('pin')}<b>Todavía no marcaste trabajos</b><small>Andá al mapa, tocá "Marcar un trabajo" y después el lugar.</small><button type="button" class="btn btn-pri" data-a="mvb-marcar">${I('plus')}Marcar un trabajo</button></div>`;
    return `<div class="mv-lista">${mios.slice().reverse().map(p => { const t = mvTarea(p.tarea), hecho = p.estado === 'hecho';
      return `<article class="mv-item${hecho ? ' hecho' : ''}" style="--c:${t.c}"><span class="mv-i-emo">${t.e}</span>
        <div class="grow"><b>${esc(mvTareaTxt(p))}</b><small>${I('pin')}${esc(p.lugar || 'En el barrio')} · ${hora(p.at)}${p.fin ? '–' + hora(p.fin) : ''} h</small>${p.nota ? `<p>${esc(p.nota)}</p>` : ''}
          <div class="mv-i-acc"><button type="button" class="${hecho ? 'sec' : 'ok'}" data-a="mvb-estado" data-id="${esc(p.id)}">${I(hecho ? 'refresh' : 'check')}${hecho ? 'Reabrir' : 'Terminado'}</button>
            <button type="button" data-a="mvb-editar" data-id="${esc(p.id)}">${I('edit')}Editar</button><button type="button" data-a="mvb-ir" data-id="${esc(p.id)}">${I('map')}Ver</button></div></div>
        <span class="mv-estado ${hecho ? 'hecho' : 'curso'}">${hecho ? I('check') : '<i></i>'}</span></article>`; }).join('')}</div>`;
  },
  mensajes(){
    const hs = MVChat.hilos(this.mid);
    const base = [{ hilo:'garita', nombre:'Garita' }, { hilo:'admin', nombre:'Administración' }];
    const todos = [...hs, ...base.filter(b => !hs.some(h => h.hilo === b.hilo)).map(b => ({ ...b, ms:[] }))];
    return `<div class="mv-hilos">${todos.map(h => { const nl = MVChat.sinLeer(this.mid, h.hilo), u = h.ms[h.ms.length - 1];
      return `<button type="button" class="mv-hilo" data-a="mvb-chat" data-hilo="${esc(h.hilo)}" data-n="${esc(h.nombre)}"><span class="mv-av">${I(h.hilo === 'garita' ? 'shield' : h.hilo === 'admin' ? 'clipboard' : 'home')}</span><span class="grow"><b>${esc(h.nombre)}</b><small>${u ? (u.yo === 'mant' ? 'Vos: ' : '') + esc(u.texto.slice(0, 60)) : 'Escribirle'}</small></span>${nl ? `<em>${nl}</em>` : ''}${I('right')}</button>`; }).join('')}</div>
      <p class="mv-pista">${I('info')}Cuando un vecino te escriba, aparece acá. Los mensajes se borran al terminar tu turno.</p>`;
  },
  /* ---- acciones ---- */
  nuevo(x, y, lugar){
    this.borrador = { x, y }; this.marcando = false; this.repintar(true);
    this.formulario({ x, y, lugar, tarea:'', nota:'', estado:'curso' });
  },
  editar(id){ const p = mvPuntos(this.mid).find(z => z.id === id); if (p){ this.sel = id; this.formulario(p); } },
  formulario(p){
    hoja(p.id ? 'Editar el trabajo' : '¿Qué estás haciendo acá?', `<form data-f="mvb-guardar" class="mv-form" data-id="${esc(p.id || '')}">
      <input type="hidden" name="x" value="${p.x}"><input type="hidden" name="y" value="${p.y}">
      <div class="mv-donde">${I('pin')}<input name="lugar" maxlength="60" value="${esc(p.lugar || '')}" aria-label="Lugar"></div>
      <div class="mv-tareas" role="radiogroup" aria-label="Tarea">${MV_TAREAS.map(t => `<label style="--c:${t.c}"><input type="radio" name="tarea" value="${t.k}" ${p.tarea === t.k ? 'checked' : ''} required><span><i>${t.e}</i>${esc(t.n)}</span></label>`).join('')}</div>
      <div class="field mv-otro" ${p.tarea === 'otro' ? '' : 'hidden'}><label>¿Qué tarea?</label><input name="txt" maxlength="40" value="${esc(p.txt || '')}" placeholder="Ej.: cambio de cartel"></div>
      <div class="field"><label>Detalle (opcional)</label><textarea name="nota" rows="2" maxlength="300" placeholder="Ej.: cortamos todo el frente y la vereda">${esc(p.nota || '')}</textarea></div>
      <div class="mv-seg"><label><input type="radio" name="estado" value="curso" ${p.estado !== 'hecho' ? 'checked' : ''}><span><i class="mv-dot"></i>En curso</span></label><label class="h"><input type="radio" name="estado" value="hecho" ${p.estado === 'hecho' ? 'checked' : ''}><span>${I('check')}Terminado</span></label></div>
      <button class="btn btn-pri btn-block btn-grande">${I('check')}${p.id ? 'Guardar los cambios' : 'Marcar en el mapa'}</button>
      ${p.id ? `<button type="button" class="btn btn-danger-soft btn-block" style="margin-top:8px" data-a="mvb-borrar" data-id="${esc(p.id)}">${I('trash')}Borrar este punto</button>` : ''}</form>`);
    const f = $('#hojaCuerpo form'); if (!f) return;
    f.addEventListener('change', e => { if (e.target.name === 'tarea') f.querySelector('.mv-otro').hidden = e.target.value !== 'otro'; });
  },
  async guardar(d, form){
    if (!this.puede()) return;
    const id = form.dataset.id || 'pt' + uid(), viejo = mvPuntos(this.mid).find(z => z.id === id), ahora = Date.now();
    const estado = d.estado === 'hecho' ? 'hecho' : 'curso';
    const p = { id, tipo:'pt', mid:this.mid, uid:this.uid, quien:this.nombre(), tarea:d.tarea || 'otro', txt:d.tarea === 'otro' ? String(d.txt || '').trim().slice(0, 40) : '',
      nota:String(d.nota || '').trim().slice(0, 300), lugar:String(d.lugar || '').trim().slice(0, 60), x:Math.round(+d.x * 10) / 10, y:Math.round(+d.y * 10) / 10,
      estado, at:viejo ? viejo.at : ahora, fin: estado === 'hecho' ? (viejo && viejo.fin) || ahora : 0, upd:ahora };
    if (!(await this.escribir(p))) return;
    this.borrador = null; this.sel = ''; cerrarHoja(); this.repintar(true);
    toast(viejo ? 'Cambios guardados' : estado === 'hecho' ? 'Trabajo marcado como terminado' : 'Marcado en el mapa: todos lo ven en vivo', 'pin');
  },
  async escribir(p, borrar = false){
    try {
      if (mvNube()){ const ref = Nube.db.ref('barrio/mantVivo/' + p.id); await (borrar ? ref.remove() : ref.set(p)); }
      else Store.cambiar(s => { s.mantVivo = aLista(s.mantVivo).filter(x => x && x.id !== p.id); if (!borrar) s.mantVivo.push(p); });
      return true;
    } catch(e){
      console.warn('Punto de mantenimiento', e);
      toast(/permission/i.test(e.message) ? 'No se pudo guardar: tu turno terminó o el enlace venció.' : 'No se pudo guardar: revisá la conexión.', 'alert');
      return false;
    }
  },
};
F['mvb-guardar'] = (d, form) => MVBrazo.guardar(d, form);
A['mvb-pesta'] = el => { MVBrazo.pesta = el.dataset.v; MVBrazo.marcando = false; MVBrazo.repintar(true); };
A['mvb-marcar'] = () => { MVBrazo.pesta = 'mapa'; MVBrazo.marcando = true; MVBrazo.repintar(true); try { navigator.vibrate && navigator.vibrate(15); } catch(e){} };
A['mvb-cancelar'] = () => { MVBrazo.marcando = false; MVBrazo.borrador = null; MVBrazo.repintar(true); };
A['mvb-editar'] = el => MVBrazo.editar(el.dataset.id);
A['mvb-ir'] = el => { const p = mvPuntos(MVBrazo.mid).find(z => z.id === el.dataset.id); if (!p) return;
  MVBrazo.pesta = 'mapa'; MVBrazo.sel = p.id; MVBrazo.repintar(true); const [x, y] = mapaP(p.x, p.y); setTimeout(() => mapaIr({ cx:x, cy:y, z:3 }), 60); };
A['mvb-estado'] = async el => {
  const p = mvPuntos(MVBrazo.mid).find(z => z.id === el.dataset.id); if (!p) return;
  const hecho = p.estado !== 'hecho', ahora = Date.now();
  if (await MVBrazo.escribir({ ...p, estado: hecho ? 'hecho' : 'curso', fin: hecho ? ahora : 0, upd:ahora })){
    MVBrazo.repintar(true); toast(hecho ? '¡Terminado! Queda en verde en el mapa' : 'Vuelve a estar en curso', 'check');
    try { navigator.vibrate && navigator.vibrate(hecho ? [20, 40, 20] : 15); } catch(e){}
  }
};
A['mvb-borrar'] = async el => {
  const p = mvPuntos(MVBrazo.mid).find(z => z.id === el.dataset.id); if (!p) return;
  if (!await confirmar('Borrar el punto', `${esc(mvTareaTxt(p))}${p.lugar ? ' · ' + esc(p.lugar) : ''}. Se saca del mapa y no va al parte del día.`, { si:'Borrar', peligro:true })) return;
  if (await MVBrazo.escribir(p, true)){ MVBrazo.sel = ''; MVBrazo.repintar(true); toast('Punto borrado', 'trash'); }
};
A['mvb-chat'] = el => {
  MVHoja.chat = { mid:MVBrazo.mid, hilo:el.dataset.hilo };
  hoja(el.dataset.n || 'Mensajes', '<div class="mv-chat"></div>', { ancho:'560px' });
  mvPintarChat();
};
/* El reloj del turno corre solo. */
setInterval(() => { document.querySelectorAll('[data-mv-desde]').forEach(e => { const t = mantDur(Date.now() - Number(e.dataset.mvDesde)); if (e.textContent !== t) e.textContent = t; }); }, 20000);
/* Quien sigue el mapa desde la app: las escuchas de los mensajes al día. */
setInterval(() => { try { if (!MVBrazo.activo && yo()) MVChat.sincronizar(); } catch(e){ console.warn('Mensajes de mantenimiento', e); } }, 8000);

function pintarMantBrazo(ruta){
  if (MVBrazo.activo && $('#mantPublico')) return;
  MVBrazo.abrir(ruta);
}

/* =========================================================
   LA BITÁCORA DE MANTENIMIENTO Y EL PARTE DEL DÍA
   ========================================================= */
const mvJornadas = () => aLista(Store.s.mantJornadas).filter(x => x && x.id).sort((a, b) => b.sale - a.sale);
R['mant-bitacora'] = {
  titulo:'Bitácora de mantenimiento', icon:'book', color:'wood', ancha:true, sub:'Cada jornada, con lo que se hizo y dónde',
  render(){
    if (!esStaff()) return vacio('lock', 'Solo para la garita y la Administración.');
    const js = mvJornadas(), dias = [...new Set(js.map(j => j.fecha))];
    return `<p class="muted small" style="margin:0 0 12px">Es aparte de la bitácora de la garita. Cada vez que la garita marca la salida de alguien de mantenimiento queda su jornada acá y le llega el parte por correo. Se guarda 12 meses.</p>
      ${js.length ? dias.map(f => `${sec(fechaLarga(f), `<span class="muted small">${plural(js.filter(j => j.fecha === f).length, 'jornada')}</span>`)}
        <div class="mv-jornadas">${js.filter(j => j.fecha === f).map(j => { const hechos = aLista(j.puntos).filter(p => p.estado === 'hecho').length, ml = j.mail;
          return `<article class="mv-jor" style="--h:${mvTono(j.mid)}"><span class="mv-av">${esc((j.nombre || '?').slice(0, 1))}</span>
            <div class="grow"><b>${esc(j.nombre)}</b><small>${hora(j.entra)} a ${hora(j.sale)} h · ${mantDur(j.sale - j.entra)} · ${plural(aLista(j.puntos).length, 'trabajo')} (${plural(hechos, 'terminado')})</small>
              <div class="mv-jor-tareas">${aLista(j.puntos).slice(0, 6).map(p => `<span style="--c:${mvTarea(p.tarea).c}">${mvTarea(p.tarea).e} ${esc(mvTareaTxt(p))}</span>`).join('')}</div></div>
            <div class="mv-jor-acc"><span class="pill ${ml && ml.ok ? 'p-ok' : ml ? 'p-warn' : ''}">${ml && ml.ok ? 'Parte enviado' : ml && ml.sinCorreo ? 'Sin correo' : ml ? 'No salió' : 'Enviando…'}</span>
              <button class="btn btn-xs btn-sec" data-a="mv-parte" data-id="${esc(j.id)}">${I('file')}Ver el parte</button>
              <button class="btn btn-xs btn-sec" data-a="mv-parte-mail" data-id="${esc(j.id)}">${I('mail')}${ml && ml.ok ? 'Reenviar' : 'Mandar'}</button></div></article>`; }).join('')}</div>`).join('')
        : vacio('book', 'Todavía no hay jornadas. Aparecen cuando la garita marca la salida de alguien de mantenimiento.')}`;
  },
};

/* El plano chiquito para el parte: dibujo plano, con colores puestos a
   mano (sin las clases de la app), así se puede pasar a imagen. Las gotas
   llevan el número del renglón de la lista. */
function mvPlanoParte(puntos){
  /* Lotes, calles y garita ya están en el sentido en que se ve el plano (js/mapa.js); los puntos se guardan como el plano original. */
  const lotes = Object.values(MAPA_LOTES).map(g => `<rect x="${(g.x - g.w / 2).toFixed(1)}" y="${(g.y - g.d / 2).toFixed(1)}" width="${g.w.toFixed(1)}" height="${g.d}" rx="3" fill="#dfe8e6" transform="rotate(${g.ang.toFixed(1)} ${g.x} ${g.y})"/>`).join('');
  const calles = MAPA_CALLES.filter(c => !c.afuera).map(c => `<polyline points="${mapaPuntos(c.pts)}" fill="none" stroke="#b7c6c3" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>`).join('');
  const pins = puntos.map((p, i) => { const t = mvTarea(p.tarea), [x, y] = mapaP(p.x, p.y);
    return `<circle cx="${x}" cy="${y}" r="15" fill="${p.estado === 'hecho' ? '#16a34a' : t.c}" stroke="#fff" stroke-width="4"/><text x="${x}" y="${y + 6}" font-family="Arial" font-weight="700" font-size="17" fill="#fff" text-anchor="middle">${i + 1}</text>`; }).join('');
  const [gx, gy] = MAPA_GARITA, giro = mapaGiradoYa ? ` transform="rotate(180 ${MAPA_CENTRO[0]} ${MAPA_CENTRO[1]})"` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${MAPA_CAJA.x} ${MAPA_CAJA.y} ${MAPA_CAJA.w} ${MAPA_CAJA.h}" width="1030" height="420">
    <rect x="0" y="0" width="1300" height="700" fill="#f4f8f7"/><g${giro}><path d="M-200,430 L30,420 L140,394 L250,364 L340,344 L470,353 L505,372 L530,396 L600,404 L700,438 L820,462 L940,484 L1000,506 L1300,520 L1300,800 L-200,800 Z" fill="#bfe3f2"/><path d="M735,298 L915,298 L924,314 L908,346 Z" fill="#cdebc6"/></g>
    ${calles}${lotes}<g transform="translate(${gx} ${gy})"><circle r="10" fill="#0b3c47"/><text y="-15" font-family="Arial" font-weight="700" font-size="14" fill="#0b3c47" text-anchor="middle">GARITA</text></g>${pins}</svg>`;
}
/* El plano a imagen PNG (para que vaya dentro del PDF y del correo). */
function mvPlanoPng(puntos){
  return new Promise(ok => {
    try {
      const img = new Image(), url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(mvPlanoParte(puntos));
      img.onload = () => { try { const c = document.createElement('canvas'); c.width = 1030; c.height = 420; c.getContext('2d').drawImage(img, 0, 0, 1030, 420); ok(c.toDataURL('image/png')); } catch(e){ ok(''); } };
      img.onerror = () => ok('');
      img.src = url;
    } catch(e){ ok(''); }
  });
}
/* EL PARTE DEL DÍA: una sola hoja A4. Tablas y estilos escritos en cada
   elemento, porque así lo entienden los correos y el conversor a PDF de
   Google (no usan las hojas de estilo de la app). */
function mvParteHtml(j, png = ''){
  const pts = aLista(j.puntos), hechos = pts.filter(p => p.estado === 'hecho').length, dur = mantDur(j.sale - j.entra);
  const MAXF = 8, filas = pts.slice(0, MAXF), resto = pts.length - filas.length;
  const comp = aLista(j.companeros), ch = aLista(j.charlas), nMsj = ch.reduce((k, c) => k + (c.n || 0), 0);
  const kpi = (n, t, c) => `<td width="25%" style="padding:0 5px"><div style="background:${c};border-radius:12px;padding:10px 12px;color:#fff"><div style="font-size:22px;font-weight:800;line-height:1.1">${n}</div><div style="font-size:10.5px;letter-spacing:.06em;text-transform:uppercase;opacity:.9">${t}</div></div></td>`;
  return `<div style="font-family:Arial,Helvetica,sans-serif;color:#0f1f1e;max-width:700px;margin:0 auto;font-size:12px;line-height:1.4">
  <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:#0b3c47;border-radius:16px 16px 0 0"><tr>
    <td style="padding:18px 20px;color:#fff"><div style="font-size:10.5px;letter-spacing:.18em;text-transform:uppercase;color:#7ee0d0">Parte diario · Mantenimiento · Barrio ${esc(Store.s.config.nombre)}</div>
      <div style="font-size:26px;font-weight:800;margin-top:4px">${esc(j.nombre)}</div>
      <div style="font-size:13px;opacity:.85">${esc(fechaLarga(j.fecha).replace(/^./, c => c.toUpperCase()))}</div></td>
    <td width="130" align="center" style="padding:14px 18px 14px 0"><div style="width:104px;height:104px;border-radius:52px;background:#ff8a00;color:#fff;text-align:center"><div style="padding-top:28px;font-size:23px;font-weight:800;line-height:1">${esc(dur.replace(' min', '′').replace(' h ', 'h '))}</div><div style="font-size:9.5px;letter-spacing:.1em;text-transform:uppercase;margin-top:5px">trabajadas</div></div></td></tr></table>
  <div style="height:5px;background:#ff8a00"></div>
  <table width="100%" cellpadding="0" cellspacing="0" style="margin:12px 0 4px;border-collapse:separate"><tr>
    ${kpi(hora(j.entra) + ' h', 'Entrada', '#0d6b66')}${kpi(hora(j.sale) + ' h', 'Salida', '#0b3c47')}${kpi(pts.length, pts.length === 1 ? 'Trabajo' : 'Trabajos', '#7c3aed')}${kpi(hechos, hechos === 1 ? 'Terminado' : 'Terminados', '#16a34a')}</tr></table>
  ${png ? `<div style="margin:10px 0 0;border:1px solid #dfe8e6;border-radius:12px;overflow:hidden"><img src="${png}" width="700" style="display:block;width:100%;height:auto" alt="Plano del barrio con los trabajos del día"></div>` : ''}
  <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px;border-collapse:collapse"><tr>
    <td valign="top" style="padding-right:12px">
      <div style="font-size:11px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#0d6b66;margin-bottom:6px">Lo que hiciste hoy</div>
      ${filas.length ? `<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">${filas.map((p, i) => { const t = mvTarea(p.tarea), ok = p.estado === 'hecho';
        return `<tr><td width="28" valign="top" style="padding:5px 0"><div style="width:22px;height:22px;border-radius:11px;background:${ok ? '#16a34a' : t.c};color:#fff;font-weight:800;text-align:center;line-height:22px;font-size:11px">${i + 1}</div></td>
          <td valign="top" style="padding:5px 6px;border-bottom:1px solid #edf2f1"><b style="font-size:12.5px">${esc(mvTareaTxt(p))}</b> <span style="color:#56706c">· ${esc(p.lugar || 'En el barrio')}</span>${p.nota ? `<div style="color:#35504c;font-size:11px">${esc(p.nota.slice(0, 110))}</div>` : ''}</td>
          <td width="92" valign="top" align="right" style="padding:5px 0;border-bottom:1px solid #edf2f1;white-space:nowrap"><span style="font-size:10.5px;font-weight:700;color:${ok ? '#16a34a' : '#c2410c'}">${ok ? '✓ Terminado' : '● En curso'}</span><div style="font-size:10.5px;color:#6c7d7a">${hora(p.at)}${p.fin ? '–' + hora(p.fin) : ''} h</div></td></tr>`; }).join('')}</table>
        ${resto > 0 ? `<div style="color:#6c7d7a;font-size:11px;margin-top:4px">y ${plural(resto, 'trabajo')} más.</div>` : ''}`
        : '<div style="color:#6c7d7a">No se marcaron trabajos en el mapa.</div>'}</td>
    <td width="210" valign="top" style="padding-left:12px;border-left:1px solid #e2e8e6">
      <div style="font-size:11px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#0d6b66;margin-bottom:6px">El equipo de hoy · ${comp.length}</div>
      ${comp.map(c => `<div style="padding:4px 0;border-bottom:1px solid #edf2f1"><b>${esc(c.nombre)}</b><div style="color:#56706c;font-size:11px">${c.sale ? `${hora(c.entra)} a ${hora(c.sale)} h` : `desde ${hora(c.entra)} h · sigue`} · ${mantDur(c.ms || 0)}</div></div>`).join('') || '<div style="color:#6c7d7a">—</div>'}
      <div style="font-size:11px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#0d6b66;margin:12px 0 6px">Mensajes · ${nMsj}</div>
      ${ch.length ? ch.map(c => `<div style="color:#35504c">${esc(c.con)}: ${c.n}</div>`).join('') : '<div style="color:#6c7d7a">Sin mensajes.</div>'}</td></tr></table>
  <div style="margin-top:14px;padding:10px 12px;border-radius:10px;background:#f1f6f5;color:#56706c;font-size:10px">Parte generado solo por la app del barrio al marcar tu salida en la garita. Si algún dato no coincide, avisá a la garita o a la Administración. Tus datos los ven solo la garita y la Administración del barrio (Ley 25.326).</div></div>`;
}
/* El documento del PDF: una hoja A4 con márgenes chicos. */
const mvPdfDoc = cuerpo => `<!DOCTYPE html><html><head><meta charset="utf-8"><style>@page{size:A4;margin:10mm}body{margin:0}</style></head><body>${cuerpo}</body></html>`;

async function mvMandarParte(jid, m, { avisar = true } = {}){
  const j = mvJornadas().find(x => x.id === jid); if (!j) return;
  m = m || mantLista().find(x => x.id === j.mid) || {};
  const marcar = mail => Store.cambiar(s => { const x = aLista(s.mantJornadas).find(z => z && z.id === jid); if (x) x.mail = mail; });
  if (!m.email){ marcar({ at:Date.now(), ok:false, sinCorreo:true }); if (avisar) toast(`${m.nombre || 'No'} no tiene correo cargado: el parte quedó en la bitácora de mantenimiento`, 'mail'); return; }
  const png = await mvPlanoPng(aLista(j.puntos)), html = mvParteHtml(j, png);
  const r = await Correo.enviarDetalle({ para:m.email, asunto:`Tu parte del día · Mantenimiento · ${fechaCorta(j.fecha)}`, html, tipo:'parte-mantenimiento',
    pdf:{ html:mvPdfDoc(html), nombre:`Parte ${j.fecha} ${j.corto || ''}.pdf`.replace(/\s+/g, ' ') } });
  marcar({ at:Date.now(), ok:r.ok, error:r.ok ? '' : String(r.error || '').slice(0, 120) });
  if (avisar) toast(r.ok ? `El parte salió por correo a ${m.email}` : 'El parte no salió por correo: ' + r.error, r.ok ? 'mail' : 'alert');
}
A['mv-parte-mail'] = el => { if (esStaff()) mvMandarParte(el.dataset.id); };
A['mv-parte'] = async el => {
  const j = mvJornadas().find(x => x.id === el.dataset.id); if (!j) return;
  const png = await mvPlanoPng(aLista(j.puntos)), doc = mvPdfDoc(mvParteHtml(j, png));
  hoja('Parte del día', `<iframe class="mv-parte-frame" title="Parte del día" sandbox="allow-same-origin allow-modals"></iframe>
    <button class="btn btn-pri btn-block" style="margin-top:10px" data-a="mv-parte-imprimir">${I('download')}Imprimir o guardar en PDF</button>`, { ancho:'820px' });
  const f = $('#hoja .mv-parte-frame'); if (f) f.srcdoc = doc;
};
A['mv-parte-imprimir'] = () => { const f = $('#hoja .mv-parte-frame'); try { f.contentWindow.focus(); f.contentWindow.print(); } catch(e){ toast('No se pudo abrir la impresión', 'alert'); } };
