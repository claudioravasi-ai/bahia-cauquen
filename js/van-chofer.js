/* =========================================================
   EL CHOFER DE LA VAN Y LOS PASAJEROS A BORDO
   (propuesta de los guardias de la garita, pedido de Claudio, 27-10-2026)
   "Que el chofer de la van pueda escanear el QR de cada huésped al subir y
   ponga: salen (o entran) del barrio 9 personas en la Van 1, matrícula
   tanto, y la garita ve en tiempo real si las 9 son huéspedes, empleados
   del hotel o personas sin permiso. Si no es huésped ni empleado, el
   chofer escribe a qué corresponden los que sobran y lo justifica."

   Las vans tienen oblea y la barrera se abre sola, pero siguen con su QR en
   el parabrisas: ahora lo lee el propio chofer para empezar su turno.

   CÓMO FUNCIONA
   · El hotel le manda a cada chofer SU enlace (Empleados del hotel →
     "Enlace de chofer"): una clave de 20 letras al azar que vale 120 días o
     hasta que el hotel la da de baja (hotel/choferCodigos/<clave>). Sin
     usuario ni contraseña: el teléfono entra a la base como "anónimo" y se
     anota en choferSesion/<su id> con la clave (como el de mantenimiento).
   · Turno: el chofer escanea el QR del parabrisas de la van que maneja.
   · Viaje: el horario del servicio regular propone el que toca (sale del
     barrio o entra); se cambia con un toque.
   · Subir: cada pasajero muestra su QR (pase de huésped o credencial de
     empleado). Pantalla verde, amarilla o roja de un vistazo; un QR que ya
     subió no se cuenta dos veces; el pase de una familia pregunta cuántos
     suben. Los que no tienen QR se suman con "+ Sin QR" y su motivo.
   · Sin señal: lo leído queda anotado "por verificar" y se verifica solo
     cuando vuelve la señal.
   · "Cerrar y avisar a la garita": la garita lo ve en vivo y contesta "OK"
     o "Detener y revisar". La salida se anota sola en la garita; la
     entrada, sola cuando el GPS del chofer llega a la garita (o con un
     toque de la garita).
   · El aviso de llegada: en la vuelta, el teléfono del chofer manda SOLO
     la distancia a la garita (ni la ubicación ni el recorrido) y la garita
     ve "llegando, a 1,2 km".

   CÓMO SE VERIFICA UN QR SIN DARLE AL CHOFER LA LISTA DE HUÉSPEDES
   · La garita y el hotel mantienen hotel/vanPases: una ficha por pase
     vigente, guardada bajo una huella (SHA-256) del código, con lo mínimo
     (tipo, nombre e inicial del apellido, fechas o días). El teléfono del
     chofer solo puede leer la ficha cuya huella calcula del QR que tiene
     adelante: no puede listar las fichas ni ver las de otros.

   PROTECCIÓN DE DATOS (Ley 25.326)
   · Al chofer le aparece "Huésped ✓ Martina O.": sin habitación, DNI,
     fechas de otros ni teléfonos. A la garita, lo mismo.
   · La lista de cada viaje (vanAbordo) se borra a los 7 días; en la
     bitácora queda solo el conteo y los motivos, sin nombres.
   · El GPS: solo la distancia redondeada, mientras dura la vuelta.

   Ideas de apps con más de 1000 estrellas en GitHub (solo la idea, código
   propio): la pantalla verde/roja de pantalla completa y el "ya usado" de
   pretix y su lector pretixSCAN (2,5k★) y de Hi.Events (4,1k★); escanear
   sin señal y verificar después, de pretixSCAN; el aviso de llegada por
   distancia a un punto (geocerca) de traccar (8k★, Apache-2.0). El lector
   de QR es el de la garita (detector del navegador o jsQR, como
   html5-qrcode, 6,2k★).
   ========================================================= */

const VC_VIGENCIA = 120 * DIA;
const VC_RETENCION = 7 * DIA;
const VC_CERCA = 2000;      /* a 2 km la garita recibe el aviso "llegando" */
const VC_LLEGO = 150;       /* a 150 m se anota la entrada sola */
const vcNube = () => typeof Nube !== 'undefined' && Nube.activa() && !!Nube.db;
/* "Martina Olsen" → "Martina O." */
const vcCorto = n => { const p = String(n || '').trim().split(/\s+/).filter(Boolean); return p.length > 1 ? `${p[0]} ${p[p.length - 1][0].toUpperCase()}.` : (p[0] || ''); };
const VC_MOTIVOS = [
  { k:'acomp',   n:'Acompañante de un huésped',      p:'acompañantes de huéspedes' },
  { k:'visita',  n:'Visita de un vecino',            p:'visitas de vecinos' },
  { k:'prov',    n:'Personal de afuera o proveedor', p:'personas de afuera o proveedores' },
  { k:'sinpase', n:'Huésped sin su QR a mano',       p:'huéspedes sin su QR a mano' },
  { k:'otro',    n:'Otro motivo',                    p:'con otro motivo' },
];
const vcMotivoDe = k => VC_MOTIVOS.find(m => m.k === k) || VC_MOTIVOS[VC_MOTIVOS.length - 1];
const vcMotivo = k => vcMotivoDe(k).n;
/* "2 acompañantes de huéspedes", "1 visita de un vecino", "1 con otro motivo" */
const vcMotivoN = (k, n) => `${n} ${n === 1 && k !== 'otro' ? vcMotivoDe(k).n.toLowerCase() : vcMotivoDe(k).p}`;

/* Lo que trae el QR (o lo que se escribe): "BHC:G-ABC123" huésped, "BHC:E-K7M3P" empleado, "BHC:H-…" van. */
function vcCodigo(txt){
  const t = String(txt || '').toUpperCase().replace(/^BHC:/, '').replace(/[\s.]/g, ''); let m;
  if ((m = t.match(/^G-([A-Z0-9]{6})$/))) return 'G-' + m[1];
  if ((m = t.match(/^E-([A-Z0-9]{5})$/))) return 'E-' + m[1];
  if (/^H-[A-Z0-9]{4,}$/.test(t)) return t;
  if (/^[A-Z0-9]{6}$/.test(t)) return 'G-' + t;
  if (/^[A-Z0-9]{5}$/.test(t)) return 'E-' + t;
  return '';
}
/* La huella del código: con ella se busca la ficha sin que el código viaje ni se guarde. */
async function vcHash(cod){
  const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('bhc-van|' + cod));
  return [...new Uint8Array(b)].slice(0, 12).map(x => x.toString(16).padStart(2, '0')).join('');
}
/* JSON con las claves ordenadas (lo que vuelve de la base viene en otro orden). */
const vcCanon = x => JSON.stringify(x, (k, v) => v && typeof v === 'object' && !Array.isArray(v) ? Object.keys(v).sort().reduce((o, kk) => (o[kk] = v[kk], o), {}) : v);
function vcDistancia(lat1, lon1, lat2, lon2){
  const R = 6371000, r = x => x * Math.PI / 180, dLa = r(lat2 - lat1), dLo = r(lon2 - lon1);
  const a = Math.sin(dLa / 2) ** 2 + Math.cos(r(lat1)) * Math.cos(r(lat2)) * Math.sin(dLo / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}
const vcKm = d => d >= 1000 ? `${(d / 1000).toFixed(1).replace('.', ',')} km` : `${Math.round(d / 10) * 10} m`;
/* A unos 35 km/h de promedio por la ruta y el barrio. */
const vcEta = d => { const m = Math.max(1, Math.round(d / 1000 / 35 * 60)); return d <= VC_LLEGO ? 'llegando' : `~${m} min`; };

/* ¿Vale hoy este pase? */
function vcEvaluar(p, hoy = hoyISO()){
  if (p.t === 'h'){
    if (p.fuera || p.hasta < hoy) return { ok:false, msg:'Ya hizo el check-out', sub:'El pase de huésped ya no vale. Consultá con la recepción del hotel.' };
    if (p.desde > hoy) return { ok:false, msg:`El pase vale desde el ${fechaCorta(p.desde)}`, sub:'Todavía no es huésped. Consultá con la recepción del hotel.' };
    return { ok:true };
  }
  if (p.t === 'e'){
    const ds = aLista(p.dias).map(Number);
    return { ok:true, av: ds.length && !ds.includes(new Date().getDay()) ? 'Hoy no es su día de trabajo' : '' };
  }
  return { ok:false, msg:'No es un pase de pasajero', sub:'' };
}

/* =========================================================
   LAS FICHAS DE LOS PASES (las mantienen la garita y el hotel)
   ========================================================= */
function vcPasesBase(){
  const hoy = hoyISO(), desde = sumarDias(hoy, -2), out = [];
  hotelHuespedes().forEach(h => { if (h && h.codigo && h.hasta >= desde) out.push({ k:'G-' + h.codigo, t:'h', ref:h.id, n:vcCorto(h.nombre), pax:+h.pax || 1, desde:h.desde, hasta:h.hasta, ...(h.salida ? { fuera:1 } : {}) }); });
  hotelEmpleados().forEach(e => { if (e && e.codigo) out.push({ k:'E-' + e.codigo, t:'e', ref:e.id, n:vcCorto(hEmpNombre(e)), puesto:e.puesto || '', dias:aLista(e.dias).map(Number) }); });
  hotelVans().forEach(v => { if (v && v.codigo && v.activa !== false) out.push({ k:v.codigo, t:'v', ref:v.id, n:v.nombre || 'Van', pat:v.patente || '' }); });
  return out;
}
const VanPases = {
  firma:'', t:0,
  pedir(){ clearTimeout(this.t); this.t = setTimeout(() => this.alDia().catch(e => console.warn('Pases de las vans', e)), 1200); },
  async alDia(){
    if (!yo() || !(esGuardia() || esHotel()) || HotelEjemplo.activo() || !(window.crypto && crypto.subtle)) return;
    const base = vcPasesBase(), firma = JSON.stringify(base);
    if (firma === this.firma) return;
    const lista = [];
    for (const x of base){ const { k, ...r } = x; lista.push({ id:await vcHash(k), ...r }); }
    lista.sort((a, b) => a.id < b.id ? -1 : 1);
    const actual = aLista(Store.s.vanPases).filter(x => x && x.id).slice().sort((a, b) => a.id < b.id ? -1 : 1);
    this.firma = firma;
    if (vcCanon(lista) !== vcCanon(actual)) Store.cambiar(s => { s.vanPases = lista; });
  },
};

/* =========================================================
   EL ENLACE DEL CHOFER (lo arma el hotel, desde la ficha del empleado)
   ========================================================= */
function vcClave(){
  const a = new Uint8Array(20); crypto.getRandomValues(a);
  return Array.from(a, b => 'abcdefghijkmnpqrstuvwxyz23456789'[b % 32]).join('');
}
const vcEnlace = tok => location.origin + location.pathname.replace(/[^/]*$/, '') + (vcNube() ? '' : '?local') + `#/van/${tok}`;
const vcCodigoDe = empId => aLista(Store.s.choferCodigos).find(c => c && c.empId === empId && c.vence > Date.now()) || null;
function vcTextoWa(e, c){
  return `Hola ${(e.nombre || '').trim()} 👋 Este es tu enlace de *chofer de las vans* del ${HOTEL_NOMBRE}:\n${vcEnlace(c.id)}\n\n`
    + `1️⃣ Al empezar tu turno, abrilo y escaneá el QR del parabrisas de la van que manejás.\n`
    + `2️⃣ Antes de salir (o en la parada del centro, antes de volver), escaneá el QR de cada pasajero al subir. Los que no tienen QR, sumalos con "+ Sin QR" y su motivo.\n`
    + `3️⃣ Tocá "Cerrar y avisar a la garita". La garita ve en vivo quién va a bordo.\n\n`
    + `Es personal: no lo compartas. Escanear siempre con la van parada, nunca manejando.`;
}
A['vc-enlace'] = el => {
  if (!soloHotel()) return;
  const e = hotelEmpleados().find(x => x.id === el.dataset.id); if (!e) return;
  let c = vcCodigoDe(e.id);
  if (!c || el.dataset.v === 'nuevo'){
    c = { id:vcClave(), empId:e.id, nombre:vcCorto(hEmpNombre(e)), vence:Date.now() + VC_VIGENCIA, at:Date.now() };
    const nuevo = c;
    Store.cambiar(s => { s.choferCodigos = aLista(s.choferCodigos).filter(x => x && x.empId !== e.id && x.vence > Date.now()); s.choferCodigos.push(nuevo); });
  }
  const wa = e.tel && typeof waLink === 'function' ? waLink(e.tel, vcTextoWa(e, c)) : 'https://wa.me/?text=' + encodeURIComponent(vcTextoWa(e, c));
  hoja('Enlace de chofer', `<div class="vc-tarjeta"><div class="vc-t-cab"><span class="vc-t-ic">${I('car')}</span><div class="grow"><small>Chofer de las vans · ${esc(HOTEL_NOMBRE)}</small><b>${esc(hEmpNombre(e))}</b></div></div>
      <div class="vc-t-qr" data-qr="${esc(vcEnlace(c.id))}"></div>
      <p class="vc-t-pie">Escaneá con la cámara del teléfono del chofer: abre su pantalla de chofer. Vale hasta el ${fechaCorta(isoDe(new Date(c.vence)))}.</p></div>
    <a class="btn btn-wa btn-block" style="margin-top:12px" href="${esc(wa)}" target="_blank" rel="noopener">${I('share')}Mandárselo por WhatsApp</a>
    <div class="btns" style="margin-top:8px"><button class="btn btn-sec grow" data-a="copiar" data-v="${esc(vcEnlace(c.id))}">${I('copy')}Copiar el enlace</button>
      <button class="btn btn-sec grow" data-a="vc-enlace" data-id="${esc(e.id)}" data-v="nuevo">${I('refresh')}Enlace nuevo</button></div>
    <button class="btn btn-danger-soft btn-block" style="margin-top:8px" data-a="vc-baja" data-id="${esc(e.id)}">${I('lock')}Dar de baja el enlace</button>
    <p class="muted tiny" style="margin-top:10px">${I('lock')} El enlace no lleva nombre ni datos: solo una clave al azar. "Enlace nuevo" o "Dar de baja" lo apagan al instante (por ejemplo, si el chofer cambia de teléfono o deja de trabajar).</p>`);
  setTimeout(() => $$('#hoja [data-qr]').forEach(x => pintarQR(x, x.dataset.qr)), 60);
};
A['vc-baja'] = async el => {
  if (!soloHotel()) return;
  if (!await confirmar('Dar de baja el enlace', 'El enlace de chofer deja de andar en ese teléfono. Para volver a manejar, le mandás uno nuevo.', { si:'Dar de baja', peligro:true })) return;
  Store.cambiar(s => { s.choferCodigos = aLista(s.choferCodigos).filter(x => x && x.empId !== el.dataset.id); });
  toast('Enlace dado de baja', 'lock');
};

/* =========================================================
   LA PANTALLA DEL CHOFER (#/van/<clave>), sin cuenta
   ========================================================= */
const VanChofer = {
  activo:false, tok:'', uid:'', estado:'', cod:null, st:null, resp:null, geo:null, gpsId:null, gpsEstado:'', cam:null, flash:null, oyendo:'', ultimoLeido:'', ultimoAt:0, enRed:true,
  /* Lo de este teléfono: el turno, el viaje en curso y los de hoy. */
  cargarSt(){
    try { this.st = JSON.parse(localStorage.getItem('bhc.chofer.' + this.tok)) || {}; } catch(e){ this.st = {}; }
    if (this.st.dia !== hoyISO()) this.st = { dia:hoyISO(), turno:null, actual:this.st.actual && this.st.actual.estado !== 'subiendo' ? null : this.st.actual || null, hechos:[] };
  },
  guardarSt(){ try { localStorage.setItem('bhc.chofer.' + this.tok, JSON.stringify(this.st)); } catch(e){} },
  nombre(){ return (this.cod && this.cod.nombre) || 'Chofer'; },
  async abrir(tok){
    this.activo = true; this.tok = String(tok || ''); this.estado = 'conectando';
    document.body.classList.add('vc-modo');
    this.pintar();
    if (!/^[a-z2-9]{20}$/.test(this.tok)){ this.estado = 'malo'; return this.pintar(); }
    this.cargarSt();
    try {
      if (vcNube()) await this.conectarNube();
      else this.conectarLocal();
    } catch(e){
      console.warn('Chofer de la van', e);
      this.estado = /permission|vencid/i.test(String(e && e.message)) ? 'vencido' : 'sinred';
      return this.pintar();
    }
    this.estado = 'listo'; this.pintar();
    if (this.st.actual){ this.oirGarita(this.st.actual.id); if (this.st.actual.sentido === 'in' && this.st.actual.estado === 'cerrado') this.gpsArrancar(); }
    this.cargarGeo();
    addEventListener('online', () => { this.enRed = true; this.verificarPendientes(); this.repintar(); });
    addEventListener('offline', () => { this.enRed = false; this.repintar(); });
    setInterval(() => { if (this.activo) this.verificarPendientes(); }, 15000);
  },
  async conectarNube(){
    for (let i = 0; i < 50 && !(Nube.auth && Nube.db); i++) await new Promise(r => setTimeout(r, 200));
    if (!Nube.auth) throw new Error('sin conexión');
    let u = await new Promise(r => { const off = Nube.auth.onAuthStateChanged(x => { off(); r(x); }); });
    if (!u){ const cred = await Nube.auth.signInAnonymously(); u = cred.user; }
    this.uid = u.uid;
    const c = (await Nube.db.ref('hotel/choferCodigos/' + this.tok).once('value')).val();
    if (!c || !(c.vence > Date.now())) throw new Error('vencido');
    this.cod = c;
    await Nube.db.ref('choferSesion/' + u.uid).set({ tok:this.tok, at:firebase.database.ServerValue.TIMESTAMP });
    Nube.db.ref('.info/connected').on('value', s => { this.enRed = !!s.val(); this.repintar(); if (this.enRed) this.verificarPendientes(); });
  },
  conectarLocal(){
    const c = aLista(Store.s.choferCodigos).find(x => x && x.id === this.tok && x.vence > Date.now());
    if (!c) throw new Error('vencido');
    this.cod = c;
    try { this.uid = localStorage.getItem('bhc.chofer.uid') || ('anon' + uid()); localStorage.setItem('bhc.chofer.uid', this.uid); } catch(e){ this.uid = 'anon' + uid(); }
    if (!this.oyendoLocal){ this.oyendoLocal = true; Store.alCambiar(() => {
      if (!this.activo) return;
      const vale = aLista(Store.s.choferCodigos).some(x => x && x.id === this.tok && x.vence > Date.now());
      if (!vale && this.estado === 'listo'){ this.estado = 'vencido'; return this.pintar(); }
      if (this.st && this.st.actual){ this.resp = aLista(Store.s.vanGarita).find(x => x && x.id === this.st.actual.id) || null; this.alResp(); }
      this.geo = aLista(Store.s.vanGarita).find(x => x && x.id === 'geo') || this.geo;
      this.repintar(); }); }
  },
  /* ---- la base: leer una ficha, poner el viaje, escuchar a la garita ---- */
  async leer(col, id){
    if (vcNube()){
      const snap = await Promise.race([Nube.db.ref(`hotel/${col}/${id}`).once('value'), new Promise((_, no) => setTimeout(() => no(new Error('sinred')), this.enRed ? 6000 : 800))]);
      return snap.val();
    }
    return aLista(Store.s[col]).find(x => x && x.id === id) || null;
  },
  subir(){
    const a = this.st.actual; if (!a) return;
    a.upd = Date.now(); this.guardarSt();
    const doc = JSON.parse(JSON.stringify(a));
    if (vcNube()) Nube.db.ref('hotel/vanAbordo/' + doc.id).set(doc).catch(e => { console.warn('Viaje de la van', e); if (/permission/i.test(e.message)) toast('No se pudo avisar: el enlace venció. Pedile uno nuevo al hotel.', 'alert'); });
    else { Store.cambiar(s => { s.vanAbordo = aLista(s.vanAbordo).filter(x => x && x.id !== doc.id); s.vanAbordo.push(doc); }); vcGuardarYa(); }
  },
  oirGarita(id){
    if (this.oyendo === id) return; this.oyendo = id; this.resp = null;
    if (vcNube()) Nube.db.ref('hotel/vanGarita/' + id).on('value', s => { if (this.oyendo !== id) return; this.resp = s.val(); this.alResp(); this.repintar(); }, () => {});
    else { this.resp = aLista(Store.s.vanGarita).find(x => x && x.id === id) || null; }
  },
  async cargarGeo(){ try { this.geo = await this.leer('vanGarita', 'geo'); } catch(e){} },
  /* La respuesta de la garita: suena y vibra una sola vez. */
  alResp(){
    const r = this.resp, k = r ? `${r.id}:${r.resp || ''}:${r.respAt || 0}:${r.movAt || 0}` : '';
    if (!r || k === this.respVisto) return; this.respVisto = k;
    if (r.resp === 'detener'){ vcPitido(false); try { navigator.vibrate && navigator.vibrate([200, 100, 200, 100, 200]); } catch(e){} }
    else if (r.resp === 'ok' || r.movAt){ vcPitido(true); try { navigator.vibrate && navigator.vibrate(40); } catch(e){} }
  },
  /* ---- dibujo ---- */
  pintar(){
    const app = $('#app'); if (!app) return;
    if (this.estado !== 'listo'){
      const msg = { conectando:['Conectando…', 'Un segundo.'], malo:['Este enlace no es válido', 'Pedile al hotel que te lo mande de nuevo.'],
        vencido:['Este enlace ya no vale', 'El hotel lo dio de baja o venció. Pedile uno nuevo a la recepción.'],
        sinred:['Sin conexión', 'Revisá internet y volvé a tocar el enlace.'] }[this.estado] || ['…', ''];
      app.innerHTML = `<section class="vc-chofer vc-solo" id="vanChofer"><header class="vc-cab">${this.marca()}</header>
        <div class="vc-mensaje">${this.estado === 'conectando' ? '<div class="cargando"><span></span><span></span><span></span></div>' : `<span class="vc-m-ic">${I('alert')}</span>`}<b>${msg[0]}</b><small>${msg[1]}</small></div></section>`;
      return;
    }
    app.innerHTML = `<section class="vc-chofer" id="vanChofer">${this.cuerpo()}</section>`;
    if (this.cam) this.camEnganchar();
    this.pintarFlash();
  },
  /* La pantalla verde, amarilla o roja va aparte, encima de todo. */
  pintarFlash(){
    const viejo = document.getElementById('vcFlash'), html = this.flashHtml();
    if (viejo && html && viejo.dataset.k === String(this.flashK)) return;
    if (viejo) viejo.remove();
    if (html) document.body.insertAdjacentHTML('beforeend', html);
  },
  repintar(){
    if (!this.activo || this.estado !== 'listo') return;
    const c = $('#vanChofer'); if (!c) return this.pintar();
    const sc = window.scrollY, video = this.cam && $('#vcVideo');
    /* La cámara no se corta al redibujar: el video se saca y se vuelve a poner. */
    if (video) video.remove();
    c.innerHTML = this.cuerpo();
    const lugar = $('#vcCamLugar'); if (video && lugar) lugar.appendChild(video); else if (this.cam) this.camEnganchar();
    this.pintarFlash();
    scrollTo(0, sc);
  },
  marca(){ return `<span class="vc-logo">${I('car')}</span><div class="grow"><small>${esc(HOTEL_NOMBRE)}</small><b>Chofer de la van</b></div>`; },
  cuerpo(){
    const t = this.st.turno, a = this.st.actual;
    const red = `<span class="vc-red ${this.enRed ? '' : 'no'}"><i></i>${this.enRed ? 'En vivo' : 'Sin señal'}</span>`;
    return `<header class="vc-cab">${this.marca()}${red}</header>
      ${!t ? this.sinTurno() : a ? this.viaje(a) : this.conTurno(t)}`;
  },
  sinTurno(){
    return `<div class="vc-hola"><small>Hola,</small><b>${esc(this.nombre().split(' ')[0])}</b></div>
      <div class="vc-paso"><div class="vc-parabrisas" aria-hidden="true"><span class="vc-pb-qr">${I('qr')}</span></div>
        <b>Escaneá el QR del parabrisas de tu van</b><small>Así la garita sabe qué van manejás en este turno.</small>
        ${this.camHtml('van')}
        ${this.cam ? '' : `<button type="button" class="vc-boton" data-a="vc-escanear" data-v="van">${I('scan')}Escanear el QR de la van</button>`}
        <button type="button" class="vc-link" data-a="vc-tipear" data-v="van">No puedo escanear: escribir el código</button></div>`;
  },
  /* El viaje que toca según el horario: después de una salida, su vuelta. */
  proximo(){
    const t = ahoraMin(), ult = aLista(this.st.hechos).slice(-1)[0];
    if (this.st.forzar) return this.st.forzar;
    if (ult && ult.sentido === 'out'){ const r = SERVICIO_REGULAR.find(([s]) => s === ult.sale); return { sentido:'in', sale: r ? r[1] : '' }; }
    const prox = SERVICIO_REGULAR.find(([s]) => minutosDe(s) >= t - 20);
    return { sentido:'out', sale: prox ? prox[0] : '' };
  },
  conTurno(t){
    const p = this.proximo(), sale = p.sentido === 'out', hs = aLista(this.st.hechos);
    return `<div class="vc-van"><span class="vc-v-ic">${I('car')}</span><div class="grow"><b>${esc(t.van)}</b><small>Tu turno desde las ${hora(t.desde)}</small></div><span class="vc-chapa">${esc(typeof chapaTexto === 'function' ? chapaTexto(t.pat) : t.pat)}</span></div>
      <div class="vc-prox ${sale ? 'sale' : 'entra'}"><small>Próximo viaje</small>
        <div class="vc-p-fila"><b class="vc-p-hora">${esc(p.sale || '—')}</b><span class="vc-dir">${I(sale ? 'logout' : 'login')}${sale ? 'SALE DEL BARRIO' : 'ENTRA AL BARRIO'}</span></div>
        <p>${sale ? 'Hotel → Centro de Ushuaia (Av. Maipú 465)' : 'Centro (Av. Maipú 465) → Hotel'}</p>
        <button type="button" class="vc-boton" data-a="vc-empezar">${I('users')}Empezar a subir pasajeros</button>
        <div class="vc-p-otros"><button type="button" data-a="vc-sentido">${I('refresh')}${sale ? 'Es una entrada' : 'Es una salida'}</button><button type="button" data-a="vc-horario">${I('clock')}Otro horario</button></div></div>
      ${hs.length ? `<div class="vc-hechos"><small>Hoy</small>${hs.slice().reverse().map(h => `<div class="vc-h-fila"><span class="vc-dir chica ${h.sentido === 'out' ? 'sale' : 'entra'}">${h.sentido === 'out' ? 'Salió' : 'Entró'}</span><b>${esc(h.sale || hora(h.at))}</b><span class="grow">${plural(h.total, 'pasajero')}</span>${h.problema ? `<span class="vc-tag warn">${I('alert')}</span>` : `<span class="vc-tag ok">${I('check')}</span>`}</div>`).join('')}</div>` : ''}
      <div class="vc-pie"><button type="button" class="vc-link" data-a="vc-cambiar-van">${I('car')}Cambiar de van</button><button type="button" class="vc-link" data-a="vc-terminar">${I('logout')}Terminar mi turno</button></div>`;
  },
  viaje(a){
    const r = vaResumen(a), sale = a.sentido === 'out', subiendo = a.estado === 'subiendo';
    const cab = `<div class="vc-viaje-cab ${sale ? 'sale' : 'entra'}"><span class="vc-dir">${I(sale ? 'logout' : 'login')}${sale ? 'SALE DEL BARRIO' : 'ENTRA AL BARRIO'}</span><b>${esc(a.sale || hora(a.at))}</b><small>${esc(a.van)} · ${esc(a.pat)}</small></div>`;
    const chips = vaChips(r);
    if (subiendo) return `${cab}
      <div class="vc-cuenta"><b data-vc-total>${r.total}</b><span>${r.total === 1 ? 'pasajero a bordo' : 'pasajeros a bordo'}</span></div>
      <div class="va-chips grande">${chips || '<span class="muted">Todavía no subió nadie</span>'}</div>
      ${this.camHtml('pax')}
      <div class="vc-acciones">${this.cam ? '' : `<button type="button" class="vc-boton" data-a="vc-escanear" data-v="pax">${I('scan')}Escanear pasajero</button>`}
        <button type="button" class="vc-b2" data-a="vc-sinqr">${I('plus')}Sin QR</button><button type="button" class="vc-b2" data-a="vc-tipear" data-v="pax">${I('edit')}Escribir código</button></div>
      ${this.lista(a, true)}
      <div class="vc-fijo"><button type="button" class="vc-boton ok" data-a="vc-cerrar" ${r.total ? '' : 'disabled'}>${I('send')}Cerrar y avisar a la garita${r.total ? ` · ${r.total}` : ''}</button>
        <button type="button" class="vc-link" data-a="vc-anular">Anular este viaje</button></div>`;
    /* Ya avisado: la respuesta de la garita y, en la vuelta, el aviso de llegada. */
    const g = this.resp || {}, entro = !!g.movAt;
    const estado = g.resp === 'detener' && !entro ? `<div class="vc-resp bad">${I('siren')}<b>La garita te pide que pares en la barrera</b><small>Quiere revisar a los pasajeros. Esperá a que te habiliten.</small></div>`
      : sale && g.movAt ? `<div class="vc-resp ok">${I('check')}<b>${g.resp === 'ok' ? 'La garita dio el OK · ¡buen viaje!' : 'La garita ya anotó tu salida'}</b><small>Salida anotada a las ${hora(g.movAt)} con ${plural(r.total, 'pasajero')}.</small></div>`
      : !sale && entro ? `<div class="vc-resp ok">${I('check')}<b>Entraste al barrio</b><small>La garita anotó tu entrada a las ${hora(g.movAt)} con ${plural(r.total, 'pasajero')}.</small></div>`
      : g.resp === 'ok' ? `<div class="vc-resp ok">${I('check')}<b>La garita dio el OK</b><small>${sale ? '¡Buen viaje!' : 'Te espera en la barrera.'}</small></div>`
      : `<div class="vc-resp espera">${I('send')}<b>Avisado a la garita</b><small>${plural(r.total, 'pasajero')} a bordo. La garita lo está viendo en vivo.</small></div>`;
    const gps = !sale && !entro ? this.gpsHtml(a) : '';
    const fin = sale ? `<button type="button" class="vc-boton" data-a="vc-listo">${I('pin')}Llegué al centro: preparar la vuelta</button>`
      : entro ? `<button type="button" class="vc-boton ok" data-a="vc-listo">${I('check')}Listo</button>`
      : `<button type="button" class="vc-boton" data-a="vc-llegue">${I('gate')}Ya pasé la garita</button>`;
    return `${cab}${estado}${gps}
      <div class="va-chips grande">${chips}</div>
      ${this.lista(a, false)}
      <div class="vc-fijo">${fin}</div>`;
  },
  gpsHtml(a){
    const d = a.gps && a.gps.d;
    if (!this.geo) return `<div class="vc-gps"><small>${I('pin')} Aviso de llegada</small><p>La garita todavía no marcó su ubicación. Al pasar, tocá "Ya pasé la garita".</p></div>`;
    if (this.gpsEstado === 'denegado') return `<div class="vc-gps"><small>${I('pin')} Aviso de llegada</small><p>Para que la garita sepa que venís, permití la ubicación en el navegador. Si no, tocá "Ya pasé la garita" al entrar.</p><button type="button" class="vc-b2" data-a="vc-gps">${I('pin')}Activar la ubicación</button></div>`;
    const pct = d == null ? 0 : Math.max(4, Math.min(100, 100 - d / 80));
    return `<div class="vc-gps vivo"><small>${I('pin')} Avisándole a la garita que venís</small>
      <div class="vc-g-fila"><b>${d == null ? 'Buscando señal…' : 'a ' + vcKm(d)}</b><span>${d == null ? '' : vcEta(d)}</span></div>
      <div class="vc-g-barra"><i style="width:${pct}%"></i></div><p>Solo viaja la distancia a la garita, no tu ubicación.</p></div>`;
  },
  lista(a, editar){
    const ps = aLista(a.pax); if (!ps.length) return '';
    const fila = p => { const tt = p.t === 'h' ? ['Huésped', 'ok', 'star'] : p.t === 'e' ? ['Empleado', p.av ? 'warn' : 'ok', 'users'] : p.t === '?' ? ['Por verificar', 'pend', 'clock'] : [p.rech ? 'Pase no válido' : 'Sin QR', p.rech ? 'bad' : 'warn', 'alert'];
      return `<li class="vc-pax ${tt[1]}"><span class="vc-pax-ic">${I(tt[2])}</span><span class="grow"><b>${esc(p.t === 'x' ? vcMotivo(p.motivo) : p.t === '?' ? 'QR leído sin señal' : p.n || '')}</b><small>${tt[0]}${p.puesto ? ' · ' + esc(p.puesto) : ''}${p.av ? ' · ' + esc(p.av) : ''}${p.txt ? ' · ' + esc(p.txt) : ''}</small></span>
        ${editar ? `<button type="button" class="vc-bajo" data-a="vc-bajo" data-v="${esc(p.i)}" aria-label="Se bajó">Bajó</button>` : ''}</li>`; };
    return `<ul class="vc-lista">${ps.slice().reverse().map(fila).join('')}</ul>`;
  },
  /* ---- la cámara, abierta mientras suben (lee uno detrás de otro) ---- */
  camHtml(modo){
    if (!this.cam || this.cam.modo !== modo) return '';
    return `<div class="vc-cam"><div class="vc-cam-vista" id="vcCamLugar"><span class="vc-cam-marco"></span></div>
      <div class="vc-cam-pie"><small>${modo === 'van' ? 'Apuntá al QR del parabrisas' : 'Apuntá al QR de cada pasajero: lee uno detrás de otro'}</small><button type="button" data-a="vc-cam-cerrar">Listo</button></div></div>`;
  },
  async camAbrir(modo){
    this.cam = { modo }; this.repintar();
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia){ this.cam = null; this.repintar(); return toast('Este teléfono no puede usar la cámara. Escribí el código.', 'scan'); }
    const nativo = 'BarcodeDetector' in window, lector = nativo ? null : await cargarJsQR();
    if (!nativo && !lector){ this.cam = null; this.repintar(); return toast('Sin conexión para cargar el lector de QR. Escribí el código.', 'scan'); }
    let stream;
    try { stream = await navigator.mediaDevices.getUserMedia({ video:{ facingMode:'environment' } }); }
    catch(e){ this.cam = null; this.repintar(); return toast('No se pudo usar la cámara', 'camera'); }
    if (!this.cam){ stream.getTracks().forEach(t => t.stop()); return; }
    const v = document.createElement('video'); v.id = 'vcVideo'; v.playsInline = true; v.muted = true; v.setAttribute('playsinline', ''); v.srcObject = stream;
    Object.assign(this.cam, { stream, v, det: nativo ? new BarcodeDetector({ formats:['qr_code'] }) : null, lector, lienzo:document.createElement('canvas') });
    this.camEnganchar(); await v.play().catch(() => {});
    const ciclo = async () => {
      const c = this.cam; if (!c || c.v !== v) return;
      try { const txt = await this.camLeer(c); if (txt) this.alLeer(txt); } catch(e){}
      setTimeout(ciclo, 220);
    };
    ciclo();
  },
  camEnganchar(){ const c = this.cam, l = $('#vcCamLugar'); if (c && c.v && l && c.v.parentNode !== l) l.appendChild(c.v); },
  async camLeer(c){
    if (this.flash || hojaAbiertaVc()) return '';
    if (c.det){ const r = await c.det.detect(c.v); return r[0] ? r[0].rawValue : ''; }
    if (!c.v.videoWidth) return '';
    const k = Math.min(1, 720 / c.v.videoWidth), ctx = c.lienzo.getContext('2d', { willReadFrequently:true });
    c.lienzo.width = Math.round(c.v.videoWidth * k); c.lienzo.height = Math.round(c.v.videoHeight * k);
    ctx.drawImage(c.v, 0, 0, c.lienzo.width, c.lienzo.height);
    const r = c.lector(ctx.getImageData(0, 0, c.lienzo.width, c.lienzo.height).data, c.lienzo.width, c.lienzo.height, { inversionAttempts:'dontInvert' });
    return r ? r.data : '';
  },
  camCerrar(){ const c = this.cam; this.cam = null; if (c && c.stream) c.stream.getTracks().forEach(t => t.stop()); this.repintar(); },
  /* El mismo QR delante de la cámara no se lee dos veces seguidas. */
  alLeer(txt){
    if (txt === this.ultimoLeido && Date.now() - this.ultimoAt < 3500) return;
    this.ultimoLeido = txt; this.ultimoAt = Date.now();
    this.leido(txt);
  },
  /* ---- lo leído (también lo que se escribe a mano) ---- */
  async leido(txt){
    const cod = vcCodigo(txt), modo = this.cam ? this.cam.modo : (!this.st.turno ? 'van' : 'pax');
    if (!this.st.turno || modo === 'van') return this.leidoVan(cod);
    const a = this.st.actual; if (!a || a.estado !== 'subiendo') return;
    if (!cod) return this.mostrar({ cls:'bad', ic:'x', t:'No es un pase del hotel', x:'Ese QR no es de un huésped ni de un empleado del hotel.', sube:true });
    if (cod.startsWith('H-')) return this.mostrar({ cls:'warn', ic:'car', t:'Es el QR de una van', x:'Escaneá el pase del pasajero.' });
    const id = await vcHash(cod);
    let p;
    try { p = await this.leer('vanPases', id); }
    catch(e){
      /* Sin señal: queda anotado y se verifica cuando vuelve. */
      if (aLista(a.pax).some(x => x.k === id && x.t === '?')) return this.mostrar({ cls:'warn', ic:'clock', t:'Ya lo anotaste', x:'Se verifica apenas vuelva la señal.' });
      this.agregar([{ k:id, t:'?' }]);
      return this.mostrar({ cls:'pend', ic:'clock', t:'Sin señal: anotado', x:'Lo verifico apenas vuelva la señal. Seguí subiendo pasajeros.' });
    }
    if (!p || (p.t !== 'h' && p.t !== 'e')) return this.mostrar({ cls:'bad', ic:'x', t: p && p.t === 'v' ? 'Es el QR de una van' : 'Pase no válido', x: p ? 'Escaneá el pase del pasajero.' : 'No es de un huésped ni de un empleado del hotel, o ya se dio de baja.', sube:!p });
    const ev = vcEvaluar(p);
    if (!ev.ok) return this.mostrar({ cls:'bad', ic:'x', t:ev.msg, x:`${p.t === 'h' ? 'Huésped' : 'Empleado'}: ${p.n}. ${ev.sub}`, sube:true, motivoTxt:`${ev.msg} (${p.n})` });
    const ya = aLista(a.pax).filter(x => x.k === id).length, cupo = p.t === 'h' ? (+p.pax || 1) : 1;
    if (ya >= cupo) return this.mostrar({ cls:'warn', ic:'refresh', t: cupo > 1 ? `Ya subieron los ${cupo}` : 'Ya subió', x:`${p.n}: ese QR ya está a bordo. No se cuenta dos veces.` });
    const base = { k:id, t:p.t, n:p.n, ref:p.ref || '', ...(p.puesto ? { puesto:p.puesto } : {}), ...(ev.av ? { av:ev.av } : {}) };
    if (cupo - ya > 1) return this.cuantos(p, base, cupo - ya, ya);
    this.agregar([base]);
    this.mostrar({ cls: ev.av ? 'warn' : 'ok', ic:'check', t: p.t === 'h' ? 'HUÉSPED ✓' : 'EMPLEADO ✓', x:`${p.n}${p.puesto ? ' · ' + p.puesto : ''}${ev.av ? ' · ' + ev.av : ''}` });
  },
  async leidoVan(cod){
    if (!cod || !cod.startsWith('H-')) return this.mostrar({ cls:'bad', ic:'x', t:'No es el QR de una van', x:'Buscá el QR del parabrisas, del lado del acompañante.' });
    let p;
    try { p = await this.leer('vanPases', await vcHash(cod)); } catch(e){ return this.mostrar({ cls:'bad', ic:'alert', t:'Sin señal', x:'Para empezar el turno hace falta internet un momento.' }); }
    if (!p || p.t !== 'v') return this.mostrar({ cls:'bad', ic:'x', t:'Van desconocida', x:'Esa van no está cargada en el hotel o se dio de baja.' });
    this.st.turno = { vid:p.ref, van:p.n, pat:p.pat || '', desde:Date.now() }; this.st.forzar = null; this.guardarSt();
    if (this.cam) this.camCerrar();
    this.mostrar({ cls:'ok', ic:'car', t:`${p.n} ✓`, x:`Turno empezado · ${p.pat || ''}` });
  },
  /* La familia con un solo pase: ¿cuántos suben ahora? */
  cuantos(p, base, max, ya){
    vcPitido(true);
    hoja('¿Cuántos suben con este pase?', `<div class="vc-cuantos"><p><b>${esc(p.n)}</b> · pase para ${plural(+p.pax || 1, 'persona')}${ya ? ` · ya ${ya === 1 ? 'subió 1' : 'subieron ' + ya}` : ''}</p>
      <div class="vc-c-grilla">${Array.from({ length:max }, (_, i) => i + 1).map(n => `<button type="button" class="${n === max ? 'on' : ''}" data-a="vc-cuantos" data-v="${n}">${n}</button>`).join('')}</div></div>`);
    this.pendiente = base;
  },
  agregar(ps){
    const a = this.st.actual; if (!a) return;
    a.pax = aLista(a.pax).concat(ps.map(p => ({ i:'p' + uid(), at:Date.now(), ...p })));
    this.subir(); this.repintar();
  },
  mostrar(f){
    this.flash = f; this.flashK = (this.flashK || 0) + 1; vcPitido(f.cls === 'ok' || f.cls === 'pend');
    try { navigator.vibrate && navigator.vibrate(f.cls === 'bad' ? [90, 60, 90] : 35); } catch(e){}
    this.repintar();
    clearTimeout(this.flashT);
    if (!f.sube) this.flashT = setTimeout(() => { if (this.flash === f){ this.flash = null; this.repintar(); } }, f.cls === 'ok' ? 1400 : 2400);
  },
  flashHtml(){
    const f = this.flash; if (!f) return '';
    return `<div class="vc-flash ${f.cls}" id="vcFlash" data-k="${this.flashK}" role="alert"><span class="vc-f-ic">${I(f.ic)}</span><b>${esc(f.t)}</b><small>${esc(f.x || '')}</small>
      ${f.sube ? `<div class="vc-f-btns"><button type="button" data-a="vc-nosube">No sube</button><button type="button" data-a="vc-subeigual">Sube igual: explicar</button></div>` : '<button type="button" class="vc-f-x" data-a="vc-flash-x" aria-label="Cerrar">' + I('x') + '</button>'}</div>`;
  },
  /* Lo leído sin señal, cuando vuelve. */
  async verificarPendientes(){
    const a = this.st && this.st.actual; if (!a || !this.enRed || this.verificando) return;
    const ps = aLista(a.pax).filter(x => x.t === '?'); if (!ps.length) return;
    this.verificando = true; let cambio = false;
    try {
      for (const x of ps){
        let p; try { p = await this.leer('vanPases', x.k); } catch(e){ break; }
        const ev = p && (p.t === 'h' || p.t === 'e') ? vcEvaluar(p) : { ok:false, msg:'Pase no válido' };
        if (ev.ok) Object.assign(x, { t:p.t, n:p.n, ref:p.ref || '', ...(p.puesto ? { puesto:p.puesto } : {}), ...(ev.av ? { av:ev.av } : {}) });
        else Object.assign(x, { t:'x', motivo:'otro', rech:1, txt:`Leído sin señal: ${ev.msg}${p && p.n ? ' (' + p.n + ')' : ''}` });
        cambio = true;
      }
    } finally { this.verificando = false; }
    if (cambio){ this.subir(); this.repintar(); toast('Volvió la señal: pasajeros verificados', 'check'); }
  },
  /* ---- el viaje ---- */
  empezar(){
    const t = this.st.turno, p = this.proximo(); if (!t) return;
    this.st.actual = { id:'va' + uid(), uid:this.uid, tok:this.tok, chofer:this.nombre(), vid:t.vid, van:t.van, pat:t.pat, sentido:p.sentido, sale:p.sale || '', fecha:hoyISO(), at:Date.now(), estado:'subiendo', pax:[] };
    this.st.forzar = null; this.resp = null;
    this.subir(); this.oirGarita(this.st.actual.id);
    this.camAbrir('pax');
  },
  cerrar(){
    const a = this.st.actual; if (!a) return;
    a.estado = 'cerrado'; a.cerradoAt = Date.now();
    if (this.cam) this.camCerrar();
    this.subir(); this.repintar();
    if (a.sentido === 'in') this.gpsArrancar();
    toast('Avisado a la garita', 'send');
  },
  listo(){
    const a = this.st.actual; if (!a) return;
    const r = vaResumen(a);
    this.st.hechos = aLista(this.st.hechos).concat({ id:a.id, sentido:a.sentido, sale:a.sale, total:r.total, problema:r.problema, at:a.at });
    this.st.actual = null; this.oyendo = ''; this.resp = null; this.gpsParar(); this.guardarSt(); this.repintar();
  },
  /* ---- el aviso de llegada (solo la distancia) ---- */
  gpsArrancar(){
    if (this.gpsId != null) return;
    if (!navigator.geolocation){ this.gpsEstado = 'no'; return; }
    this.gpsId = navigator.geolocation.watchPosition(p => { this.gpsEstado = 'ok'; if (this.geo) this.gpsDist(vcDistancia(p.coords.latitude, p.coords.longitude, this.geo.lat, this.geo.lon)); },
      e => { this.gpsEstado = e.code === 1 ? 'denegado' : 'error'; this.repintar(); }, { enableHighAccuracy:true, maximumAge:10000, timeout:30000 });
  },
  gpsParar(){ if (this.gpsId != null && navigator.geolocation) navigator.geolocation.clearWatch(this.gpsId); this.gpsId = null; },
  gpsDist(d){
    const a = this.st.actual; if (!a || a.sentido !== 'in' || a.estado !== 'cerrado') return;
    d = Math.round(d / 10) * 10; const g = a.gps || {};
    if (g.d != null && Math.abs(g.d - d) < 50 && Date.now() - (g.at || 0) < 20000 && !(d <= VC_LLEGO && g.d > VC_LLEGO)) return;
    a.gps = { d, at:Date.now() }; this.subir(); this.repintar();
    if (d <= VC_LLEGO) this.gpsParar();
  },
};
/* Sin la base (la prueba y la demo): la copia del equipo se escribe en el acto, para que el otro teléfono no la pise. */
const vcGuardarYa = () => { if (!vcNube()) Store.guardarCopia(); };
const hojaAbiertaVc = () => { const d = $('#hoja'); return !!(d && d.open); };
function vcPitido(ok){
  if (typeof Sonido === 'undefined') return;
  try { Sonido.tocar(ok ? [[880, 0, .12], [1320, .1, .18]] : [[220, 0, .25], [180, .22, .3]], ok ? 'sine' : 'square', ok ? .16 : .1, true); } catch(e){}
}

A['vc-escanear'] = el => VanChofer.camAbrir(el.dataset.v === 'van' ? 'van' : 'pax');
A['vc-cam-cerrar'] = () => VanChofer.camCerrar();
A['vc-flash-x'] = () => { VanChofer.flash = null; VanChofer.repintar(); };
A['vc-tipear'] = el => {
  const van = el.dataset.v === 'van';
  hoja(van ? 'Código de la van' : 'Código del pasajero', `<form data-f="vc-tipeado" class="vc-form"><input type="hidden" name="modo" value="${van ? 'van' : 'pax'}">
    <div class="field"><label>${van ? 'El código que está abajo del QR del parabrisas (H-…)' : 'Los 6 signos del pase del huésped o los 5 de la credencial del empleado'}</label>
      <input name="c" required autocomplete="off" autocapitalize="characters" maxlength="14" class="mono" placeholder="${van ? 'H-XXXXXXXX' : 'ABC 123'}" style="font-size:22px;letter-spacing:2px"></div>
    <button class="btn btn-pri btn-block btn-grande">${I('check')}Verificar</button></form>`);
};
F['vc-tipeado'] = d => { cerrarHoja(); VanChofer.leido(d.modo === 'van' ? (/^H-/i.test(d.c) ? d.c : 'H-' + d.c) : d.c); };
A['vc-cuantos'] = el => { const b = VanChofer.pendiente, n = +el.dataset.v; if (!b || !n) return; VanChofer.pendiente = null; cerrarHoja();
  VanChofer.agregar(Array.from({ length:n }, () => ({ ...b })));
  VanChofer.mostrar({ cls:'ok', ic:'check', t:'HUÉSPED ✓', x:`${b.n} · ${n === 1 ? 'sube 1' : 'suben ' + n}` }); };
A['vc-nosube'] = () => { VanChofer.flash = null; VanChofer.repintar(); toast('No sube: no se cuenta', 'x'); };
A['vc-subeigual'] = () => { const f = VanChofer.flash; VanChofer.flash = null; VanChofer.repintar(); A['vc-sinqr']({ dataset:{ rech:'1', txt:(f && f.motivoTxt) || (f && f.t) || 'Pase no válido' } }); };
A['vc-sinqr'] = el => {
  const rech = el && el.dataset && el.dataset.rech === '1', txt = (el && el.dataset && el.dataset.txt) || '';
  hoja(rech ? 'Sube sin pase válido' : 'Pasajeros sin QR', `<form data-f="vc-sinqr" class="vc-form">${rech ? `<input type="hidden" name="rech" value="1">${aviso('danger', 'alert', 'La garita lo va a ver en rojo', esc(txt))}` : ''}
    <p class="muted small" style="margin:0 0 8px"><b>¿Quiénes son?</b> La garita lo ve en vivo.</p>
    <div class="vc-motivos" role="radiogroup" aria-label="Motivo">${VC_MOTIVOS.map((m, i) => `<label><input type="radio" name="motivo" value="${m.k}" required ${rech && m.k === 'otro' ? 'checked' : ''}><span>${esc(m.n)}</span></label>`).join('')}</div>
    ${rech ? '' : `<p class="muted small" style="margin:12px 0 6px"><b>¿Cuántos?</b></p><div class="vc-cant">${[1, 2, 3, 4, 5, 6].map(n => `<label><input type="radio" name="n" value="${n}" ${n === 1 ? 'checked' : ''}><span>${n}</span></label>`).join('')}</div>`}
    <div class="field" style="margin-top:12px"><label>Explicalo para la garita <span class="muted">(obligatorio en "Otro motivo")</span></label>
      <input name="txt" maxlength="80" value="${esc(rech ? txt : '')}" placeholder="Ej.: van a la casa del lote 148 · acompañan a la familia Rossi"></div>
    <button class="btn btn-pri btn-block btn-grande">${I('plus')}Sumarlos a bordo</button></form>`);
};
F['vc-sinqr'] = d => {
  const txt = String(d.txt || '').trim().slice(0, 80);
  if ((d.motivo === 'otro' || d.rech) && txt.length < 4) return toast('Escribí el motivo para la garita', 'edit');
  const n = d.rech ? 1 : Math.max(1, Math.min(6, +d.n || 1));
  cerrarHoja();
  VanChofer.agregar(Array.from({ length:n }, () => ({ t:'x', motivo:d.motivo || 'otro', ...(txt ? { txt } : {}), ...(d.rech ? { rech:1 } : {}) })));
  toast(`${n === 1 ? 'Sumado' : `Sumados ${n}`}: ${vcMotivo(d.motivo).toLowerCase()}`, 'plus');
};
A['vc-bajo'] = el => { const a = VanChofer.st.actual; if (!a) return; a.pax = aLista(a.pax).filter(p => p.i !== el.dataset.v); VanChofer.subir(); VanChofer.repintar(); toast('Se bajó: ya no cuenta', 'logout'); };
A['vc-empezar'] = () => VanChofer.empezar();
A['vc-sentido'] = () => { const p = VanChofer.proximo(), sale = p.sentido === 'out';
  const r = sale ? SERVICIO_REGULAR.find(([, v]) => minutosDe(v) >= ahoraMin() - 20) : SERVICIO_REGULAR.find(([s]) => minutosDe(s) >= ahoraMin() - 20);
  VanChofer.st.forzar = { sentido: sale ? 'in' : 'out', sale: r ? r[sale ? 1 : 0] : '' }; VanChofer.guardarSt(); VanChofer.repintar(); };
A['vc-horario'] = () => { const p = VanChofer.proximo(), sale = p.sentido === 'out';
  hoja('¿Qué viaje es?', `<p class="muted small" style="margin:0 0 10px">${sale ? 'Salidas del hotel al centro' : 'Vueltas del centro al hotel'} (servicio regular)</p>
    <div class="vc-c-grilla horas">${SERVICIO_REGULAR.map(r => r[sale ? 0 : 1]).map(h => `<button type="button" class="${h === p.sale ? 'on' : ''}" data-a="vc-hora" data-v="${h}">${h}</button>`).join('')}<button type="button" data-a="vc-hora" data-v="">Fuera de horario</button></div>`); };
A['vc-hora'] = el => { const p = VanChofer.proximo(); VanChofer.st.forzar = { sentido:p.sentido, sale:el.dataset.v || '' }; VanChofer.guardarSt(); cerrarHoja(); VanChofer.repintar(); };
A['vc-cerrar'] = async () => {
  const a = VanChofer.st.actual; if (!a) return; const r = vaResumen(a);
  if (r.p) return toast('Hay pasajeros por verificar: esperá a que vuelva la señal o bajalos', 'clock');
  if (!await confirmar('Cerrar y avisar a la garita', `<b style="font-size:20px">${plural(r.total, 'pasajero')} a bordo</b><br>${esc(vaTexto(r))}<br><span class="muted small">${a.sentido === 'out' ? 'Sale del barrio' : 'Entra al barrio'} · ${esc(a.van)} · ${esc(a.pat)}</span>`, { si:'Cerrar y avisar' })) return;
  VanChofer.cerrar();
};
A['vc-anular'] = async () => {
  if (!await confirmar('Anular este viaje', 'Se borra la lista de este viaje y la garita deja de verla.', { si:'Anular', peligro:true })) return;
  const a = VanChofer.st.actual; if (!a) return; a.estado = 'anulado'; VanChofer.subir(); VanChofer.st.actual = null; VanChofer.oyendo = ''; if (VanChofer.cam) VanChofer.camCerrar(); VanChofer.guardarSt(); VanChofer.repintar();
};
A['vc-listo'] = () => VanChofer.listo();
A['vc-llegue'] = () => { const a = VanChofer.st.actual; if (!a) return; a.estado = 'llego'; a.llegoAt = Date.now(); VanChofer.gpsParar(); VanChofer.subir(); VanChofer.repintar(); toast('Avisado: la garita anota tu entrada', 'gate'); };
A['vc-gps'] = () => { VanChofer.gpsParar(); VanChofer.gpsEstado = ''; VanChofer.gpsArrancar(); VanChofer.repintar(); };
A['vc-cambiar-van'] = () => { VanChofer.st.turno = null; VanChofer.guardarSt(); VanChofer.camAbrir('van'); };
A['vc-terminar'] = async () => {
  if (!await confirmar('Terminar mi turno', 'La van queda libre para el próximo chofer. Tus viajes de hoy ya están en la garita.', { si:'Terminar' })) return;
  VanChofer.st.turno = null; VanChofer.st.forzar = null; VanChofer.guardarSt(); VanChofer.repintar(); toast('Turno terminado. ¡Gracias!', 'check');
};
function pintarVanChofer(tok){ if (VanChofer.activo && $('#vanChofer')) return; VanChofer.abrir(tok); }

/* =========================================================
   LA GARITA (y el hotel, para mirar): LOS PASAJEROS A BORDO EN VIVO
   ========================================================= */
const vanAbordo = () => aLista(Store.s.vanAbordo).filter(x => x && x.id && x.estado !== 'anulado');
const vgDe = id => aLista(Store.s.vanGarita).find(x => x && x.id === id) || {};
function vaResumen(m){
  const ps = aLista(m.pax), r = { total:ps.length, h:0, e:0, x:0, p:0, rech:0, av:0, motivos:{} };
  ps.forEach(p => { if (p.t === 'h') r.h++; else if (p.t === 'e'){ r.e++; if (p.av) r.av++; } else if (p.t === '?') r.p++; else { r.x++; if (p.rech) r.rech++; r.motivos[p.motivo || 'otro'] = (r.motivos[p.motivo || 'otro'] || 0) + 1; } });
  r.problema = r.x > 0 || r.av > 0 || r.p > 0;
  r.nivel = r.rech ? 'bad' : r.problema ? 'warn' : 'ok';
  return r;
}
function vaTexto(r){
  const partes = [r.h && plural(r.h, 'huésped', 'huéspedes'), r.e && plural(r.e, 'empleado'), r.x && `${r.x} sin QR (${Object.entries(r.motivos).map(([k, n]) => vcMotivoN(k, n)).join(', ')})`, r.p && `${r.p} por verificar`].filter(Boolean);
  return `${plural(r.total, 'pasajero')} a bordo${partes.length ? ': ' + partes.join(', ') : ''}`;
}
const vaChips = r => [r.h && `<span class="ok">${I('check')}${plural(r.h, 'huésped', 'huéspedes')}</span>`, r.e && `<span class="${r.av ? 'warn' : 'ok'}">${I('check')}${plural(r.e, 'empleado')}</span>`,
  r.x && `<span class="${r.rech ? 'bad' : 'warn'}">${I('alert')}${r.x} sin QR</span>`, r.p && `<span class="pend">${I('clock')}${r.p} por verificar</span>`].filter(Boolean).join('');
/* Lo que la garita tiene que ver ahora: lo que está subiendo, lo avisado y lo que viene (hasta un rato después de pasar). */
function vaVisibles(){
  const ahora = Date.now();
  return vanAbordo().filter(m => { const g = vgDe(m.id); if (m.fecha !== hoyISO() && ahora - (m.upd || m.at) > 6 * HORA) return false;
    return !g.movAt || ahora - g.movAt < 20 * MIN; }).sort((a, b) => b.at - a.at);
}
function vaTarjetas(opera){
  const ms = vaVisibles(); if (!ms.length) return '';
  return `<div class="va-lista">${ms.map(m => vaTarjeta(m, opera)).join('')}</div>`;
}
function vaTarjeta(m, opera){
  const r = vaResumen(m), g = vgDe(m.id), sale = m.sentido === 'out', subiendo = m.estado === 'subiendo';
  const estado = g.movAt ? `${sale ? 'Salió' : 'Entró'} ${hora(g.movAt)} h` : subiendo ? 'subiendo pasajeros' : m.estado === 'llego' ? 'en la barrera' : sale ? 'avisó: sale ahora' : 'viene en camino';
  const d = m.gps && m.gps.d, geo = vgDe('geo');
  const motivos = aLista(m.pax).filter(p => p.t === 'x' || p.av).map(p => p.t === 'x' ? `${vcMotivo(p.motivo)}${p.txt ? ': ' + p.txt : ''}` : `${p.n}: ${p.av}`);
  const cuenta = {}; motivos.forEach(t => { cuenta[t] = (cuenta[t] || 0) + 1; });
  return `<article class="va-card ${r.nivel}${subiendo ? ' vivo' : ''}" data-va="${esc(m.id)}">
    <div class="va-cab"><span class="va-dir ${sale ? 'sale' : 'entra'}">${I(sale ? 'logout' : 'login')}${sale ? 'SALE' : 'ENTRA'}</span>
      <div class="grow"><b>${esc(m.van)} · <span class="mono">${esc(m.pat)}</span></b><small>${esc(m.chofer)}${m.sale ? ' · ' + esc(m.sale) + ' h' : ''} · ${sale ? 'Hotel → Centro' : 'Centro → Hotel'}</small></div>
      <span class="va-estado">${subiendo ? '<i></i>' : ''}${esc(estado)}</span></div>
    <div class="va-cuerpo"><div class="va-num"><b>${r.total}</b><small>a bordo</small></div><div class="va-chips">${vaChips(r) || '<span class="muted small">Todavía no subió nadie</span>'}</div></div>
    ${Object.keys(cuenta).length ? `<ul class="va-motivos">${Object.entries(cuenta).map(([t, n]) => `<li>${I('alert')}${n > 1 ? `<b>${n}</b> · ` : ''}${esc(t)}</li>`).join('')}</ul>` : ''}
    ${!sale && !g.movAt && m.estado === 'cerrado' ? (d != null ? `<div class="va-gps ${d <= VC_CERCA ? 'cerca' : ''}"><span>${I('pin')}${d <= VC_LLEGO ? 'Llegando a la barrera' : 'a ' + vcKm(d) + ' de la garita'}</span><b>${vcEta(d)}</b><div class="vc-g-barra"><i style="width:${Math.max(4, Math.min(100, 100 - d / 80))}%"></i></div></div>`
      : `<p class="va-nota">${I('pin')}${geo.lat ? 'Esperando la señal del GPS del chofer…' : 'Para el aviso de llegada por GPS, la garita marca su ubicación una vez.'}${opera && !geo.lat ? ` <button type="button" class="link" data-a="va-geo">Marcar la garita acá</button>` : ''}</p>`) : ''}
    ${g.resp ? `<p class="va-resp ${g.resp}">${I(g.resp === 'ok' ? 'check' : 'siren')}${g.resp === 'ok' ? 'Le diste el OK' : 'Le pediste que pare a revisar'} · ${hora(g.respAt)} h</p>` : ''}
    <div class="va-btns">${opera && !g.resp && (sale || !g.movAt) ? `<button type="button" class="btn btn-sm btn-ok" data-a="va-resp" data-id="${esc(m.id)}" data-v="ok">${I('check')}OK, que pase</button>
        <button type="button" class="btn btn-sm btn-danger-soft" data-a="va-resp" data-id="${esc(m.id)}" data-v="detener">${I('siren')}Detener y revisar</button>
        ${!sale && !g.movAt && m.estado !== 'subiendo' ? `<button type="button" class="btn btn-sm btn-sec" data-a="va-entro" data-id="${esc(m.id)}">${I('login')}Entró</button>` : ''}` : ''}
      <button type="button" class="btn btn-sm btn-sec" data-a="va-ver" data-id="${esc(m.id)}">${I('list')}Ver la lista</button></div></article>`;
}
A['va-ver'] = el => {
  const m = vanAbordo().find(x => x.id === el.dataset.id); if (!m) return; const r = vaResumen(m);
  const fila = p => { const tt = p.t === 'h' ? ['Huésped', 'p-ok'] : p.t === 'e' ? ['Empleado', p.av ? 'p-warn' : 'p-ok'] : p.t === '?' ? ['Por verificar', ''] : [p.rech ? 'Pase no válido' : 'Sin QR', p.rech ? 'p-danger' : 'p-warn'];
    return `<li class="va-l-fila"><span class="pill ${tt[1]}">${tt[0]}</span><span class="grow"><b>${esc(p.t === 'x' ? vcMotivo(p.motivo) : p.n || 'QR leído sin señal')}</b>${p.puesto || p.av || p.txt ? `<small>${esc([p.puesto, p.av, p.txt].filter(Boolean).join(' · '))}</small>` : ''}</span><small class="muted">${hora(p.at)}</small></li>`; };
  hoja(`${m.van} · ${m.sentido === 'out' ? 'sale' : 'entra'}`, `<p class="muted small" style="margin:0 0 6px">${esc(m.chofer)} · ${esc(m.pat)}${m.sale ? ' · ' + esc(m.sale) + ' h' : ''}</p>
    <p style="margin:0 0 10px"><b>${esc(vaTexto(r))}</b></p><ul class="va-l">${aLista(m.pax).map(fila).join('')}</ul>
    <p class="muted tiny" style="margin-top:10px">${I('lock')} Solo nombre e inicial del apellido. La lista se borra sola a los 7 días; en la bitácora queda el conteo, sin nombres.</p>`);
};
A['va-resp'] = el => {
  if (!soloGarita()) return;
  const id = el.dataset.id, v = el.dataset.v === 'ok' ? 'ok' : 'detener';
  Store.cambiar(s => { vgPoner(s, id, { resp:v, respAt:Date.now(), por:yo().id }); }); vcGuardarYa();
  toast(v === 'ok' ? 'OK enviado al chofer' : 'Le avisamos al chofer que pare en la barrera', v === 'ok' ? 'check' : 'siren');
};
A['va-entro'] = el => { if (!soloGarita()) return; const m = vanAbordo().find(x => x.id === el.dataset.id); if (m) vaPaso(m); };
A['va-geo'] = () => {
  if (!soloGarita()) return;
  if (!navigator.geolocation) return toast('Este equipo no tiene ubicación', 'pin');
  toast('Buscando la ubicación de la garita…', 'pin');
  navigator.geolocation.getCurrentPosition(p => {
    Store.cambiar(s => { vgPoner(s, 'geo', { lat:+p.coords.latitude.toFixed(5), lon:+p.coords.longitude.toFixed(5), at:Date.now() }); });
    toast('Listo: la garita quedó marcada para el aviso de llegada', 'check');
  }, () => toast('No se pudo leer la ubicación. Permitila en el navegador y probá de nuevo.', 'alert'), { enableHighAccuracy:true, timeout:20000 });
};
function vgPoner(s, id, campos){
  s.vanGarita = aLista(s.vanGarita); let x = s.vanGarita.find(z => z && z.id === id);
  if (!x){ x = { id, at:Date.now() }; s.vanGarita.push(x); }
  Object.assign(x, campos);
}
/* El paso por la garita, anotado solo: la van, los huéspedes y los empleados que iban. */
function vaPaso(m){
  const r = vaResumen(m), tipo = m.sentido === 'in' ? 'in' : 'out', movId = 'hm-' + m.id;
  if (!vanOGenerica(m.vid)) return;
  if (aLista(Store.s.hotelMovs).some(x => x && x.id === movId)){ if (!vgDe(m.id).movAt) Store.cambiar(s => vgPoner(s, m.id, { movAt:Date.now(), tipo })); return; }
  /* El traslado del servicio regular que corresponde: la salida por su hora, la vuelta por la del centro. */
  const vs = aLista(Store.s.hotelViajes).filter(x => x && x.fecha === hoyISO() && /^hrsr-/.test(x.deRutina || ''));
  const viaje = !m.sale ? null : tipo === 'out' ? vs.find(x => x.estado === 'programado' && x.sale === m.sale) : vs.find(x => x.estado === 'en_curso' && (x.vuelve || regresoViaje(x)) === m.sale);
  moverVan(m.vid, tipo, viaje ? viaje.id : '', r.h, { auto:true, movId, sinAdivinar:true, detalle:vaTexto(r), chofer:m.chofer, abordo:{ h:r.h, e:r.e, x:r.x, total:r.total },
    enCambio:(s, at) => {
      vgPoner(s, m.id, { movAt:at, tipo });
      /* Cada huésped (una vez por pase) y cada empleado: "salió en la Van 1". */
      const vistos = new Set();
      aLista(m.pax).forEach(p => { if (!p.ref || vistos.has(p.ref) || (p.t !== 'h' && p.t !== 'e')) return; vistos.add(p.ref);
        s.hotelMovs.unshift({ id:`hm-${m.id}-${p.ref}`, ...(p.t === 'h' ? { huespedId:p.ref } : { empId:p.ref }), tipo, at, por:yo().id, enVan:m.vid }); });
    } });
}
/* La garita mira sola: avisos de una sola vez, la salida y la llegada que se anotan solas, y la limpieza. */
const VA_VISTO = new Set();
const vaUnaVez = k => { if (VA_VISTO.has(k)) return false; VA_VISTO.add(k); try { const ks = JSON.parse(sessionStorage.getItem('bhc.va.vistos') || '[]'); if (ks.includes(k)) return false; ks.push(k); sessionStorage.setItem('bhc.va.vistos', JSON.stringify(ks.slice(-200))); } catch(e){} return true; };
function vaRevisar(){
  if (!yo() || !esGuardia() || HotelEjemplo.activo()) return;
  vaVisibles().forEach(m => {
    const g = vgDe(m.id), r = vaResumen(m);
    if (m.estado === 'subiendo' && vaUnaVez(m.id + ':sube')){ toast(`${m.van}: ${m.chofer} está subiendo pasajeros (${m.sentido === 'out' ? 'sale' : 'entra'})`, 'car'); try { Sonido.tocar([[660, 0, .15], [880, .15, .2]]); } catch(e){} }
    if (m.estado !== 'subiendo' && r.problema && vaUnaVez(m.id + ':prob')){ toast(`${m.van}: ${r.x ? r.x + ' sin QR' : 'revisar la lista'} · ${vaTexto(r)}`, 'alert'); try { Sonido.tocar([[520, 0, .2], [390, .22, .3]], 'triangle', .2, true); } catch(e){} }
    if (g.movAt) return;
    if (m.sentido === 'out' && m.estado === 'cerrado') vaPaso(m);
    if (m.sentido === 'in' && m.estado !== 'subiendo'){
      const d = m.gps && m.gps.d;
      if (d != null && d <= VC_CERCA && vaUnaVez(m.id + ':cerca')){ toast(`${m.van} llegando: a ${vcKm(d)} · ${plural(r.total, 'pasajero')}`, 'pin'); try { Sonido.tocar([[740, 0, .14], [988, .14, .14], [1175, .28, .2]], 'sine', .2, true); } catch(e){} }
      if (m.estado === 'llego' || (d != null && d <= VC_LLEGO)) vaPaso(m);
    }
  });
  /* A los 7 días se borra la lista; queda el paso en la bitácora (sin nombres). */
  const viejo = Date.now() - VC_RETENCION;
  if (aLista(Store.s.vanAbordo).some(x => x && (x.upd || x.at) < viejo) || aLista(Store.s.vanGarita).some(x => x && x.id !== 'geo' && x.at < viejo))
    Store.cambiar(s => { s.vanAbordo = aLista(s.vanAbordo).filter(x => x && (x.upd || x.at) >= viejo); s.vanGarita = aLista(s.vanGarita).filter(x => x && (x.id === 'geo' || x.at >= viejo)); });
}
/* El hotel limpia los enlaces vencidos. */
function vcLimpiarEnlaces(){
  if (!yo() || !esHotel()) return;
  if (aLista(Store.s.choferCodigos).some(c => c && !(c.vence > Date.now()))) Store.cambiar(s => { s.choferCodigos = aLista(s.choferCodigos).filter(c => c && c.vence > Date.now()); });
}
let vaPend = 0;
Store.alCambiar(() => { if (VanChofer.activo) return; VanPases.pedir(); clearTimeout(vaPend); vaPend = setTimeout(() => { try { vaRevisar(); } catch(e){ console.warn('Vans a bordo', e); } }, 300); });
setInterval(() => { if (VanChofer.activo) return; try { VanPases.pedir(); vaRevisar(); vcLimpiarEnlaces(); } catch(e){ console.warn('Vans a bordo', e); } }, 30000);
