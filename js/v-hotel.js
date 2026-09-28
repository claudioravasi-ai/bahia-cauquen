/* =========================================================
   HOTEL LOS CAUQUENES (pedido de Claudio, 26-09-2026)
   -------------------------------------------------------
   El hotel ocupa 6 unidades del padrón (lotes 0 a 5, ~5,2 % del
   coeficiente). Para el barrio es un propietario más en derechos y
   deberes (vota y paga por su coeficiente, cumple el reglamento: eso
   sigue como hoy, por el padrón), pero genera tránsito de terceros
   —huéspedes, proveedores, sus vans— y por eso tiene una CUENTA
   INSTITUCIONAL con rol propio ("hotel"): ni vecino ni personal del barrio.

   CÓMO ENTRA. Una sola cuenta, que usa la recepción. La crea la
   Administración convirtiendo cualquier cuenta (Gestión → Hotel → Cuenta
   del hotel); después el hotel le cambia el correo y la contraseña desde
   Tu cuenta.

   QUÉ VE Y QUÉ HACE. Lo suyo y lo público de la ciudad:
     · vans (con su QR para la garita) y traslados, que se arman solos con
       los vuelos del aeropuerto, los cruceros del puerto y los huéspedes;
     · huéspedes del día (nombre, fechas, patente, vuelos): los ven SOLO el
       hotel y la garita, y se borran solos al día siguiente del check-out;
     · eventos del hotel (la garita se entera; la Administración decide si
       se avisa a los vecinos);
     · proveedores con ART y seguro, cada uno con su QR;
     · promociones: las cargan, cambian y borran el hotel o la
       Administración, y salen en la tira de todas las apps;
     · emergencias: llamar, avisar a la garita, su DEA y su personal con
       primeros auxilios;
     · comunicación interna: una sola teja y, adentro, se elige con quién
       (la garita o la Administración); cada conversación sigue privada;
     · agenda, vuelos, cruceros, Ushuaia hoy, normas, municipio.
   QUÉ NO VE (Ley 25.326, mínimo acceso): el padrón, las fichas de los
   vecinos, el chat, el pizarrón, las visitas de los vecinos, la bitácora ni
   los datos de un SOS. Las reglas de Firebase lo hacen cumplir.

   LA GARITA opera los pasos de las vans y los proveedores del hotel (un
   toque o su QR) y ve los huéspedes que llegan. LA ADMINISTRACIÓN mira todo
   en vivo (sin los nombres de los huéspedes), edita promociones, aprueba
   avisos de eventos, revisa proveedores, publica el DEA del hotel y maneja la
   cuenta y el convenio.
   ========================================================= */

/* ---------- datos ---------- */
const hotelInfo = () => Object.assign({ id:'info', trayAero:20, checkin:90, esperaArribo:15, trayPuerto:15, embarque:120, desembarque:45,
  avisoAntes:30, autoTraslados:true, dea:false, deaLugar:'', auxilios:'', telRecepcion:'', responsable:'', puntoEncuentro:'' },
  aLista(Store.s.hotelInfo).find(x => x && x.id === 'info') || {});
const hotelVans = () => aLista(Store.s.hotelVans).filter(v => v && !v.baja);
const hotelProvs = () => aLista(Store.s.hotelProv).filter(Boolean);
const hotelEventos = () => aLista(Store.s.hotelEventos).filter(e => e && !e.cancelado);
const hotelHuespedes = () => aLista(Store.s.hotelHuespedes).filter(Boolean);
const hotelViajes = () => aLista(Store.s.hotelViajes).filter(Boolean);
const hotelMovs = () => aLista(Store.s.hotelMovs).filter(Boolean).sort((a, b) => b.at - a.at);
/* ¿Quién puede tocar qué? */
const soloHotel = () => { if (esHotel()) return true; toast('Eso lo carga el hotel desde su cuenta.', 'lock'); return false; };
const hotelId = () => (esHotel() ? yo() : cuentaHotel())?.id || '';

/* Horas: "14:10" ↔ minutos, dando la vuelta a la medianoche. */
const hhmmDe = m => { const x = ((Math.round(m) % 1440) + 1440) % 1440; return `${pad(Math.floor(x / 60))}:${pad(x % 60)}`; };
const minDe = h => /^\d{1,2}:\d{2}$/.test(String(h || '')) ? minutosDe(h) : null;

/* ---------- vans ---------- */
/* Dónde está cada van: por su último paso registrado en la garita. */
function estadoVan(v){
  const m = hotelMovs().find(x => x.vanId === v.id);
  return !m ? { adentro:true, desde:0, sin:true } : { adentro:m.tipo === 'in', desde:m.at };
}
const DESTINOS_HOTEL = { aeropuerto:['Aeropuerto', 'send'], puerto:['Puerto', 'drop'], centro:['Centro', 'pin'], excursion:['Excursión', 'tree'], otro:['Otro', 'car'] };
const ESTADO_VIAJE = { programado:['Programado', 'sky'], en_curso:['En viaje', 'warn'], hecho:['Hecho', 'ok'], cancelado:['Cancelado', ''] };

/* Cuándo tiene que salir la van, según el vuelo o el crucero. */
function salidaVuelo(v, info = hotelInfo()){
  const t = Vuelos.minutos(v.real || v.hora); if (t == null) return '';
  return v.tipo === 'D' ? hhmmDe(t - info.checkin - info.trayAero) : hhmmDe(t + info.esperaArribo - info.trayAero);
}
function salidaCrucero(c, sentido, info = hotelInfo()){
  const t = minDe(horaDe(sentido === 'llevar' ? c.sale : c.llega)); if (t == null) return '';
  return sentido === 'llevar' ? hhmmDe(t - info.embarque - info.trayPuerto) : hhmmDe(t + info.desembarque - info.trayPuerto);
}
/* El vuelo de un traslado, tal como está hoy en el tablero del aeropuerto. */
const normVuelo = n => String(n || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
function vueloDelTablero(nro, sentido){
  const d = Vuelos.d; if (!d || Date.now() - (d.t || 0) > 6 * HORA) return null;
  const lista = sentido === 'A' ? d.arr : d.dep;
  return aLista(lista).map(v => ({ ...v, tipo:sentido })).find(v => normVuelo(v.nro) === normVuelo(nro)) || null;
}
/* Si el vuelo cambió de horario, cuándo conviene salir ahora. */
function ajusteViaje(x){
  if (!x || x.estado !== 'programado' || x.fecha !== hoyISO() || !x.ref || x.ref.tipo !== 'vuelo') return null;
  const v = vueloDelTablero(x.ref.nro, x.ref.sentido); if (!v) return null;
  if (/cancel/i.test(v.estado)) return { cancelado:true, v };
  const sug = salidaVuelo(v); if (!sug || !x.sale) return sug && !x.sale ? { sale:sug, v } : null;
  return Math.abs(minutosDe(sug) - minutosDe(x.sale)) >= 10 ? { sale:sug, v } : null;
}
const textoViaje = x => { const d = DESTINOS_HOTEL[x.destino] || DESTINOS_HOTEL.otro;
  return `${x.sentido === 'buscar' ? 'Buscar en' : 'Llevar a'} ${d[0].toLowerCase()}${x.ref && x.ref.tipo === 'vuelo' ? ' · vuelo ' + x.ref.nro + (x.ref.hora ? ' ' + x.ref.hora : '') : x.ref && x.ref.tipo === 'crucero' ? ' · ' + conMayusculasBarco(x.ref.barco) : x.ref && x.ref.desc ? ' · ' + x.ref.desc : ''}`; };
const viajesDelDia = (f = hoyISO()) => hotelViajes().filter(x => x.fecha === f && x.estado !== 'cancelado').sort((a, b) => (a.sale || '99').localeCompare(b.sale || '99'));

/* =========================================================
   LOS TRASLADOS SE ARMAN SOLOS CON LOS HUÉSPEDES
   Si un huésped trae vuelo de llegada o de salida, la app arma (o suma
   pasajeros a) el traslado de ese vuelo ese día. La hora de salida de la
   van sale del tablero del aeropuerto el mismo día; antes, de la hora que
   cargó el hotel. Un traslado armado solo se reconoce por su id fijo
   (va-<fecha>-<A|D>-<vuelo>): no se duplica.
   ========================================================= */
function trasladosDeHuespedes(s){
  const info = hotelInfo(); if (!info.autoTraslados) return 0;
  const grupos = {};
  hotelHuespedes().forEach(h => {
    if (h.llegaVuelo && h.desde >= hoyISO()) (grupos[`${h.desde}|A|${normVuelo(h.llegaVuelo)}`] = grupos[`${h.desde}|A|${normVuelo(h.llegaVuelo)}`] || { fecha:h.desde, sentido:'A', nro:h.llegaVuelo, hora:h.llegaHora || '', hs:[] }).hs.push(h);
    if (h.saleVuelo && h.hasta >= hoyISO()) (grupos[`${h.hasta}|D|${normVuelo(h.saleVuelo)}`] = grupos[`${h.hasta}|D|${normVuelo(h.saleVuelo)}`] || { fecha:h.hasta, sentido:'D', nro:h.saleVuelo, hora:h.saleHora || '', hs:[] }).hs.push(h);
  });
  let n = 0;
  s.hotelViajes = aLista(s.hotelViajes);
  Object.values(grupos).forEach(g => {
    const id = `va-${g.fecha}-${g.sentido}-${normVuelo(g.nro)}`;
    const tab = g.fecha === hoyISO() ? vueloDelTablero(g.nro, g.sentido) : null;
    const hora = tab ? (tab.real || tab.hora) : g.hora;
    const sale = tab ? salidaVuelo(tab, info) : hora ? salidaVuelo({ tipo:g.sentido, hora }, info) : '';
    const pax = g.hs.reduce((a, h) => a + (+h.pax || 1), 0), ids = g.hs.map(h => h.id).sort();
    const x = s.hotelViajes.find(v => v.id === id);
    if (!x){ s.hotelViajes.push({ id, auto:true, vanId:'', fecha:g.fecha, sale, destino:'aeropuerto', sentido: g.sentido === 'A' ? 'buscar' : 'llevar',
      ref:{ tipo:'vuelo', nro:g.nro.toUpperCase(), sentido:g.sentido, hora }, pax, huespedes:ids, nota:'', estado:'programado', at:Date.now() }); n++; return; }
    if (x.estado !== 'programado') return;
    if (x.pax !== pax || JSON.stringify(aLista(x.huespedes)) !== JSON.stringify(ids)){ x.pax = pax; x.huespedes = ids; n++; }
    if (hora && (!x.ref.hora || (tab && x.ref.hora !== hora))){ x.ref.hora = hora; if (!x.saleAMano && sale) x.sale = sale; n++; }
  });
  return n;
}

/* =========================================================
   EL MOTOR DEL HOTEL (corre solo en el equipo del hotel)
   Cada minuto: recordatorio antes de que salga una van, aviso si el vuelo
   de un traslado cambió de hora o se canceló, traslados de los huéspedes
   al día, y borrado de los huéspedes que ya se fueron (al día siguiente
   del check-out). Cada aviso sale una sola vez (marcas en este equipo).
   ========================================================= */
const HotelMotor = {
  KEY:'bhc.hotel.marcas', timer:null,
  marcas(){ try { return JSON.parse(localStorage.getItem(this.KEY)) || {}; } catch(e){ return {}; } },
  marcar(k){ const m = this.marcas(); if (m[k]) return false; m[k] = Date.now(); const lim = Date.now() - 3 * DIA;
    Object.keys(m).forEach(x => { if (m[x] < lim) delete m[x]; }); try { localStorage.setItem(this.KEY, JSON.stringify(m)); } catch(e){} return true; },
  arrancar(){ if (this.timer) return; this.timer = setInterval(() => this.correr(), 60000); setTimeout(() => this.correr(), 4000); },
  correr(){
    const u = yo(); if (!u) return;
    if (esGuardia()) return this.garita();
    if (u.rol !== 'hotel') return;
    const hoy = hoyISO(), ahora = ahoraMin(), info = hotelInfo(), avisos = [];
    viajesDelDia(hoy).filter(x => x.estado === 'programado').forEach(x => {
      const aj = ajusteViaje(x);
      if (aj && aj.cancelado && this.marcar(`canc-${x.id}`)) avisos.push({ titulo:`Se canceló el vuelo ${x.ref.nro}`, texto:`Revisá el traslado de las ${x.sale || '—'} h (${x.pax || 0} pasajeros).`, urgente:true });
      else if (aj && aj.sale && this.marcar(`aj-${x.id}-${aj.sale}`)) avisos.push({ titulo:`Cambió el horario del ${x.ref.nro}`, texto:`${aj.v.estado || 'Nuevo horario'} ${aj.v.real || aj.v.hora} h · conviene que la van salga a las ${aj.sale} (estaba ${x.sale || 'sin hora'}).`, urgente:false });
      const falta = x.sale ? minutosDe(x.sale) - ahora : null;
      if (falta != null && falta >= 0 && falta <= info.avisoAntes && this.marcar(`rec-${x.id}-${x.sale}`)) {
        const van = hotelVans().find(v => v.id === x.vanId);
        avisos.push({ titulo:`En ${falta} min sale la van${van ? ' ' + van.nombre : ''}`, texto:`${x.sale} h · ${textoViaje(x)} · ${plural(+x.pax || 0, 'pasajero')}`, urgente:false });
      }
    });
    const hs = hotelHuespedes(), viejos = hs.filter(h => h.hasta && h.hasta < sumarDias(hoy, -1));
    const hoyN = hs.filter(h => h.desde <= hoy && h.hasta >= hoy).reduce((a, h) => a + (+h.pax || 1), 0);
    const hayCambios = viejos.length || avisos.length || info.huespedesHoy !== hoyN || info.huespedesDia !== hoy;
    Store.cambiar(s => {
      if (viejos.length){ const fuera = new Set(viejos.map(h => h.id)); s.hotelHuespedes = aLista(s.hotelHuespedes).filter(h => !fuera.has(h.id)); }
      trasladosDeHuespedes(s);
      if (info.huespedesHoy !== hoyN || info.huespedesDia !== hoy) guardarInfo(s, { huespedesHoy:hoyN, huespedesDia:hoy });
      avisos.forEach(a => notificar(s, { para:[u.id], titulo:a.titulo, texto:a.texto, icon:'car', color: a.urgente ? 'danger' : 'wood', link:'hotel-traslados', sonido:true, urgente:a.urgente }));
    });
    if (hayCambios) refrescarPronto();
  },
  /* En la garita: los pasos de las vans de más de 30 días se van. */
  garita(){
    if (!this.marcar('limpieza-movs-' + hoyISO())) return;
    const lim = Date.now() - 30 * DIA;
    if (hotelMovs().some(m => m.at < lim)) Store.cambiar(s => { s.hotelMovs = aLista(s.hotelMovs).filter(m => m && m.at >= lim); });
  },
};
function guardarInfo(s, cambios){
  s.hotelInfo = aLista(s.hotelInfo);
  let x = s.hotelInfo.find(i => i && i.id === 'info');
  if (!x){ x = { id:'info' }; s.hotelInfo.push(x); }
  Object.assign(x, cambios, { actualizado:Date.now() });
}

/* =========================================================
   LA PORTADA DEL HOTEL
   ========================================================= */
const tejaHotel = (v, icon, color, t, s, extra = {}) => teja({ v, icon, color, t, s, ...extra });

/* COMUNICACIÓN INTERNA (pedido de Claudio, 27-09): antes eran dos tejas,
   "Administración" y "Garita"; ahora es una sola y adentro se elige con
   quién. Por debajo siguen siendo las dos conversaciones de siempre
   (privados con:'guardia' y con:'admin'), cada una en su carpeta: la de la
   garita no la ve la Administración y al revés. Lo usa R.privado. */
const CANALES_HOTEL = [
  { con:'guardia', icon:'shield', color:'brand', t:'Garita', s:'Ingresos, vans, proveedores, huéspedes que llegan' },
  { con:'admin', icon:'sliders', color:'accent', t:'Administración', s:'Expensas, convenio, promociones, eventos, reclamos' },
];
const hiloHotel = con => aLista(Store.s.privados).find(h => h.userId === yo()?.id && (h.con || 'admin') === con);
const sinLeerHotel = con => { const h = hiloHotel(con); return h ? aLista(h.msgs).filter(m => m.from !== 'vecino' && !m.leido).length : 0; };
function comunicacionHotel(){
  return `${sec('¿Con quién querés hablar?')}
    ${CANALES_HOTEL.map(c => { const h = hiloHotel(c.con), ult = h ? aLista(h.msgs).at(-1) : null, nl = sinLeerHotel(c.con);
      return `<button class="superficie" data-a="abrir" data-v="privado" data-p="${c.con}"><span class="ic ic-${c.color}">${I(c.icon)}</span>
        <span class="txt"><b>${c.t}</b><small>${ult ? `${ult.from === 'vecino' ? 'Vos: ' : ''}${esc(ult.text.slice(0, 70))} · ${hace(ult.createdAt)}` : c.s}</small></span>
        ${nl ? `<span class="pill p-danger">${nl}</span>` : I('right')}</button>`; }).join('')}
    <p class="muted tiny" style="margin-top:12px">${I('lock')} Cada conversación es privada: la de la garita la ven solo el hotel y la garita; la de la Administración, solo el hotel y la Administración. Para una urgencia, el botón rojo <b>Garita</b> de arriba.</p>`;
}
/* Arriba de la conversación, para pasar de una a la otra sin volver. */
const chipsHotel = con => `<div class="chips">${CANALES_HOTEL.map(c => { const nl = c.con !== con ? sinLeerHotel(c.con) : 0;
  return `<button class="chip ${con === c.con ? 'on' : ''}" data-a="abrir" data-v="privado" data-p="${c.con}">${I(c.icon)}${c.t}${nl ? `<span class="n">${nl}</span>` : ''}</button>`; }).join('')}</div>`;
function tarjetaVan(v, { garita = false } = {}){
  const e = estadoVan(v), prox = viajesDelDia().find(x => x.vanId === v.id && x.estado === 'programado');
  return `<div class="hv-van ${e.adentro ? 'adentro' : 'afuera'}"><span class="hv-van-ic">${I('car')}</span>
    <div class="grow"><b>${esc(v.nombre)}</b><span class="mono">${esc(v.patente || '')}</span>
      <small>${e.sin ? 'Sin pasos registrados' : e.adentro ? `En el barrio desde las ${hora(e.desde)} h` : `Afuera desde las ${hora(e.desde)} h`}${prox ? ` · próximo: ${prox.sale || '—'} h` : ''}</small></div>
    ${garita && esGuardia() ? `<button class="btn btn-xs ${e.adentro ? 'btn-sec' : 'btn-ok'}" data-a="hvan-mov" data-id="${esc(v.id)}" data-v="${e.adentro ? 'out' : 'in'}">${I(e.adentro ? 'logout' : 'login')}${e.adentro ? 'Salió' : 'Entró'}</button>` : `<span class="pill ${e.adentro ? 'p-ok' : 'p-warn'}">${e.adentro ? 'Adentro' : 'Afuera'}</span>`}</div>`;
}
function filaViaje(x, { acciones = false } = {}){
  const d = DESTINOS_HOTEL[x.destino] || DESTINOS_HOTEL.otro, e = ESTADO_VIAJE[x.estado] || ESTADO_VIAJE.programado, van = hotelVans().find(v => v.id === x.vanId), aj = ajusteViaje(x);
  return `<div class="hv-viaje"><div class="hv-hora"><b>${esc(x.sale || '—')}</b><small>${x.fecha === hoyISO() ? 'hoy' : fechaCorta(x.fecha)}</small></div>
    <div class="grow"><b>${I(d[1])} ${esc(textoViaje(x))}</b>
      <small>${plural(+x.pax || 0, 'pasajero')}${van ? ' · ' + esc(van.nombre) : ' · sin van asignada'}${x.auto ? ' · armado con los huéspedes' : ''}${x.nota ? ' · ' + esc(x.nota) : ''}</small>
      ${aj && aj.cancelado ? `<span class="hv-alerta">${I('alert')} El vuelo figura CANCELADO en el aeropuerto</span>` : aj ? `<span class="hv-alerta">${I('clock')} ${esc(aj.v.estado || 'Nuevo horario')} ${esc(aj.v.real || aj.v.hora)} h: conviene salir ${esc(aj.sale)}${acciones && esHotel() ? ` <button class="link" data-a="hviaje-ajustar" data-id="${esc(x.id)}" data-v="${esc(aj.sale)}">Ajustar</button>` : ''}</span>` : ''}</div>
    <span class="pill ${e[1] ? 'p-' + e[1] : ''}">${e[0]}</span>
    ${acciones && esHotel() ? `<button class="icon-btn" data-a="hviaje-editar" data-id="${esc(x.id)}" aria-label="Editar el traslado">${I('edit')}</button>` : ''}</div>`;
}
/* Lo que pasa hoy en Ushuaia que le importa al hotel: vuelos, cruceros y
   eventos, con el botón para programar el traslado ya calculado. */
function hoyEnUshuaiaHotel(){
  const d = Vuelos.d, ahora = ahoraMin(), hoy = hoyISO();
  const prox = (lista, tipo) => aLista(lista).map(v => ({ ...v, tipo })).filter(v => !/cancel/i.test(v.estado) && (Vuelos.minutos(v.real || v.hora) ?? 0) >= ahora - 20).slice(0, 5);
  const filaVuelo = v => { const sale = salidaVuelo(v), ya = viajesDelDia().some(x => x.ref && x.ref.tipo === 'vuelo' && normVuelo(x.ref.nro) === normVuelo(v.nro));
    return `<div class="hv-mini"><span class="mono"><b>${esc(v.real || v.hora)}</b></span><span class="grow">${esc(v.nro)} · ${esc(v.lugar)}${v.estado ? ` <small>${esc(v.estado)}</small>` : ''}</span>
      ${esHotel() ? (ya ? `<span class="pill p-ok">${I('check')}Traslado</span>` : `<button class="btn btn-xs btn-sec" data-a="hviaje-nuevo" data-v="vuelo|${esc(v.nro)}|${v.tipo}|${esc(v.real || v.hora)}|${esc(sale)}" title="La van tendría que salir a las ${esc(sale)}">${I('plus')}Van ${esc(sale)}</button>`) : ''}</div>`; };
  const cr = Cruceros.lista().filter(c => c.fecha >= hoy && c.fecha <= sumarDias(hoy, 2)).slice(0, 6);
  const ev = aLista(Store.s.eventosCiudad).filter(e => e && e.fecha >= hoy && e.fecha <= sumarDias(hoy, 7)).sort((a, b) => a.fecha.localeCompare(b.fecha)).slice(0, 5);
  return `<div class="hv-hoy">
    <div class="card"><div class="hv-cab">${I('send')}<b>Salen del aeropuerto</b><button class="link" data-a="abrir" data-v="vuelos">Todos</button></div>
      ${d ? prox(d.dep, 'D').map(filaVuelo).join('') || '<p class="muted small">No quedan partidas hoy.</p>' : '<p class="muted small">Leyendo el tablero del aeropuerto…</p>'}
      <div class="hv-cab" style="margin-top:10px">${I('send')}<b>Llegan al aeropuerto</b></div>
      ${d ? prox(d.arr, 'A').map(filaVuelo).join('') || '<p class="muted small">No quedan arribos hoy.</p>' : ''}
      <p class="muted tiny" style="margin:8px 0 0">"Van 14:10" = cuándo tendría que salir la van según la ficha del hotel (${hotelInfo().checkin} min de check-in, ${hotelInfo().trayAero} min al aeropuerto).</p></div>
    <div class="card"><div class="hv-cab">${I('drop')}<b>Cruceros</b><button class="link" data-a="abrir" data-v="cruceros">Todos</button></div>
      ${cr.length ? cr.map(c => `<div class="hv-mini"><span class="grow"><b>${esc(conMayusculasBarco(c.barco))}</b><small>${c.fecha === hoy ? 'hoy' : relDia(c.fecha)} · llega ${horaDe(c.llega) || '—'} · sale ${horaDe(c.sale) || '—'}</small></span>
        ${esHotel() ? `<button class="btn btn-xs btn-sec" data-a="hviaje-nuevo" data-v="crucero|${esc(c.barco)}|buscar|${esc(c.fecha)}|${esc(salidaCrucero(c, 'buscar'))}">${I('plus')}Buscar</button><button class="btn btn-xs btn-sec" data-a="hviaje-nuevo" data-v="crucero|${esc(c.barco)}|llevar|${esc(c.sale.slice(0, 10))}|${esc(salidaCrucero(c, 'llevar'))}">${I('plus')}Llevar</button>` : ''}</div>`).join('')
        : `<p class="muted small">${Cruceros.url() ? 'No hay recaladas en los próximos tres días.' : 'El cronograma de cruceros todavía no está conectado.'}</p>`}</div>
    <div class="card"><div class="hv-cab">${I('calendar')}<b>Eventos en la ciudad</b><button class="link" data-a="abrir" data-v="ushuaia">Ushuaia hoy</button></div>
      ${ev.length ? ev.map(e => `<div class="hv-mini"><span class="grow"><b>${esc(e.titulo)}</b><small>${e.fecha === hoy ? 'hoy' : relDia(e.fecha)}${e.hora ? ' · ' + esc(e.hora) + ' h' : ''}${e.lugar ? ' · ' + esc(e.lugar) : ''}</small></span>
        ${esHotel() ? `<button class="btn btn-xs btn-sec" data-a="hviaje-nuevo" data-v="evento|${esc(e.titulo)}|llevar|${esc(e.fecha)}|${esc(e.hora || '')}">${I('plus')}Van</button>` : ''}</div>`).join('') : '<p class="muted small">Sin eventos cargados para esta semana.</p>'}</div>
  </div>`;
}
R.hotel = {
  titulo: HOTEL_NOMBRE, icon:'star', color:'wood', ancha:true,
  render(){
    if (!esHotel()) return R['hotel-vivo'].render();
    const hoy = hoyISO(), info = hotelInfo(), c = Clima.d?.c, vans = hotelVans();
    const vs = viajesDelDia(hoy), prox = vs.filter(x => x.estado === 'programado' || x.estado === 'en_curso');
    const ajustes = vs.filter(x => ajusteViaje(x));
    const evHoy = hotelEventos().filter(e => e.fecha === hoy);
    const hsHoy = hotelHuespedes().filter(h => h.desde === hoy), hsSalen = hotelHuespedes().filter(h => h.hasta === hoy);
    const promosPend = promosViejasPend().length;
    const sinLeer = aLista(Store.s.privados).reduce((a, h) => a + aLista(h.msgs).filter(m => m.from !== 'vecino' && !m.leido).length, 0);
    return `<div class="hotel-hero"><img src="img/logo-noche.png" alt="" width="54" height="54">
        <div class="grow"><small>${fechaLarga(hoy)}</small><h1>${HOTEL_NOMBRE}</h1><span>Recepción${info.responsable ? ' · responsable: ' + esc(info.responsable) : ''}</span></div>
        ${c ? `<div class="hotel-temp"><b>${Math.round(c.temperature_2m)}°</b><small>${Clima.cod(c.weather_code)[0]}</small></div>` : ''}</div>
      <div class="inicio-lienzo">
        ${ajustes.length || evHoy.length ? `<section class="bloque">${ajustes.map(x => { const aj = ajusteViaje(x); return aviso(aj.cancelado ? 'danger latido' : 'warn', 'clock', aj.cancelado ? `Vuelo ${esc(x.ref.nro)} cancelado` : `Cambió el ${esc(x.ref.nro)}: la van conviene que salga ${esc(aj.sale)}`, esc(textoViaje(x)), aj.cancelado ? '' : `<button class="btn btn-xs btn-pri" data-a="hviaje-ajustar" data-id="${esc(x.id)}" data-v="${esc(aj.sale)}">Ajustar a las ${esc(aj.sale)}</button>`); }).join('')}
          ${evHoy.map(e => aviso('info', 'star', `Hoy: ${esc(e.titulo)}`, `${esc(e.desde || '')}${e.hasta ? '–' + esc(e.hasta) : ''} h · ${plural(+e.asistentes || 0, 'invitado')}${e.publicado ? ' · avisado a los vecinos' : ''}`)).join('')}</section>` : ''}
        <section class="bloque hv-dos">
          <div>${sec('Vans ahora', `<button class="link" data-a="abrir" data-v="hotel-traslados">Vans y traslados</button>`)}
            ${vans.length ? `<div class="hv-vans">${vans.map(v => tarjetaVan(v)).join('')}</div>` : `<div class="card plana small">${I('car')} Cargá las vans del hotel (patente y chofer): cada una tiene su QR para la garita. <button class="link" data-a="hvan-editar">Cargar una van</button></div>`}</div>
          <div>${sec(`Traslados de hoy (${prox.length})`, `<button class="link" data-a="hviaje-nuevo">+ Traslado</button>`)}
            ${prox.length ? `<div class="card lista">${prox.slice(0, 6).map(x => filaViaje(x)).join('')}</div>` : `<div class="card plana small">${I('check')} No hay traslados pendientes hoy.</div>`}</div>
        </section>
        <section class="bloque"><div class="garita-kpis"><div class="kpi"><b>${hsHoy.length}</b><span>Llegan hoy</span></div><div class="kpi"><b>${hsSalen.length}</b><span>Se van hoy</span></div><div class="kpi"><b>${info.huespedesHoy || 0}</b><span>Huéspedes</span></div></div></section>
        <section class="bloque">${sec('Hoy en Ushuaia, para el hotel')}${hoyEnUshuaiaHotel()}</section>
        <section class="bloque">${sec('El hotel en la app')}<div class="mosaico">
          ${tejaHotel('hotel-traslados', 'car', 'wood', 'Vans y traslados', 'Aeropuerto, puerto, excursiones · con el QR de cada van', { destaca:true, n: prox.length || '' })}
          ${tejaHotel('hotel-huespedes', 'users', 'sky', 'Huéspedes', 'Lista del día para la garita · se borran solos')}
          ${tejaHotel('hotel-eventos', 'star', 'accent', 'Eventos del hotel', 'La garita se entera; a los vecinos, si hace falta')}
          ${tejaHotel('hotel-proveedores', 'box', 'brand', 'Proveedores', 'ART, seguro y su QR de ingreso')}
          ${tejaHotel('hotel-promos', 'sparkle', 'wood', 'Promociones', 'Agregar, editar o borrar · salen en la tira de todas las apps', { n: promosPend || '' })}
          ${tejaHotel('hotel-emergencias', 'siren', 'danger', 'Emergencias', 'Llamar, avisar a la garita, DEA y primeros auxilios')}
          ${teja({ v:'privado', p:'hotel', icon:'chat', color:'accent', t:'Comunicación interna', s:'Mensajes privados con la garita o la Administración', badge: sinLeer })}
          ${tejaHotel('hotel-ficha', 'sliders', 'sky', 'Ficha del hotel', 'Responsable, tiempos de traslado, DEA')}
          ${tejaHotel('documentos', 'file', 'brand', 'Normas y reglamentos', 'Reglamento del barrio y convivencia')}
          ${tejaHotel('hotel-convenio', 'clipboard', 'wood', 'Convenio con el barrio', 'Modelo de convivencia y servicios')}
          ${teja({ a:'hotel-hoja-dia', icon:'download', color:'ok', t:'Hoja del día', s:'Vuelos, cruceros, eventos y traslados para el mostrador' })}
          ${tejaHotel('agenda', 'book', 'sky', 'Agenda de Ushuaia', 'Taxis, comidas, farmacias')}
          ${tejaHotel('manual', 'book', 'accent', 'Manual de uso', 'El capítulo del hotel, paso a paso')}
        </div></section>
        ${pieApp()}
      </div>`;
  },
  alPintar(){ if (!Vuelos.d || Date.now() - Vuelos.d.t > Vuelos.cadencia()) Vuelos.pedir().then(() => { if (PILA.at(-1)?.id === 'hotel') refrescarPronto(); }).catch(() => {}); },
};

/* =========================================================
   VANS Y TRASLADOS
   ========================================================= */
R['hotel-traslados'] = {
  titulo:'Vans y traslados', icon:'car', color:'wood', ancha:true, sub:'Cada van con su QR · traslados con vuelos y cruceros',
  render(p){
    const hoy = hoyISO(), dia = p && /^\d{4}-\d{2}-\d{2}$/.test(p) ? p : hoy, vans = hotelVans();
    const vs = hotelViajes().filter(x => x.fecha === dia).sort((a, b) => (a.sale || '99').localeCompare(b.sale || '99'));
    const dias = [0, 1, 2, 3].map(i => sumarDias(hoy, i));
    const movs = hotelMovs().filter(m => m.vanId && Date.now() - m.at < DIA).slice(0, 12);
    return `${sec('Vans', esHotel() ? `<button class="link" data-a="hvan-editar">+ Van</button>` : '')}
      ${vans.length ? `<div class="hv-vans">${vans.map(v => `${tarjetaVan(v, { garita:true })}${esHotel() ? `<div class="btns hv-van-acc"><button class="btn btn-xs btn-sec" data-a="hvan-qr" data-id="${esc(v.id)}">${I('qr')}QR para la garita</button><button class="btn btn-xs btn-sec" data-a="hvan-editar" data-id="${esc(v.id)}">${I('edit')}Editar</button></div>` : ''}`).join('')}</div>`
        : vacio('car', esHotel() ? 'Todavía no cargaste ninguna van.' : 'El hotel todavía no cargó sus vans.')}
      ${sec('Traslados', esHotel() ? `<button class="link" data-a="hviaje-nuevo">+ Traslado</button>` : '')}
      <div class="chips">${dias.map(d => `<button class="chip ${d === dia ? 'on' : ''}" data-a="abrir" data-v="hotel-traslados" data-p="${d}">${d === hoy ? 'Hoy' : relDia(d)}</button>`).join('')}</div>
      ${vs.length ? `<div class="card lista">${vs.map(x => filaViaje(x, { acciones:true })).join('')}</div>` : vacio('calendar', 'No hay traslados ese día.')}
      ${movs.length ? sec('Pasos por la garita (últimas 24 h)') + `<div class="card lista">${movs.map(m => { const v = hotelVans().find(x => x.id === m.vanId) || {};
        return `<div class="it"><div class="txt"><b>${esc(v.nombre || 'Van')} · ${m.tipo === 'in' ? 'entró' : 'salió'}</b><span>${hora(m.at)} h${m.viaje ? ' · ' + esc(m.viaje) : ''}</span></div></div>`; }).join('')}</div>` : ''}
      <p class="muted tiny" style="margin-top:12px">${I('info')} Cuando la garita registra que una van sale (con un toque o leyendo su QR), el traslado que le tocaba pasa a "En viaje"; cuando vuelve, a "Hecho". Si el vuelo de un traslado cambia de horario en el aeropuerto, la app avisa cuándo conviene salir.</p>`;
  },
};
A['hvan-editar'] = el => {
  if (!soloHotel()) return;
  const v = hotelVans().find(x => x.id === el.dataset.id) || {};
  hoja(v.id ? 'Editar van' : 'Nueva van', `<form data-f="hvan" data-id="${esc(v.id || '')}">
    <div class="grid2"><div class="field"><label>Nombre</label><input name="nombre" required maxlength="30" value="${esc(v.nombre || '')}" placeholder="Van 1"></div>
      <div class="field"><label>Patente</label><input name="patente" required maxlength="10" style="text-transform:uppercase" value="${esc(v.patente || '')}" placeholder="AB 123 CD"></div></div>
    <div class="grid2"><div class="field"><label>Modelo y color</label><input name="modelo" maxlength="40" value="${esc(v.modelo || '')}" placeholder="Mercedes Sprinter blanca"></div>
      <div class="field"><label>Plazas</label><input name="plazas" type="number" min="1" max="60" value="${esc(v.plazas || 15)}"></div></div>
    <div class="grid2"><div class="field"><label>Chofer habitual</label><input name="chofer" maxlength="40" value="${esc(v.chofer || '')}"></div>
      <div class="field"><label>Celular del chofer</label><input name="telChofer" inputmode="tel" maxlength="20" value="${esc(v.telChofer || '')}"></div></div>
    <button class="btn btn-pri btn-block">${I('check')}Guardar</button>
    ${v.id ? `<button type="button" class="btn btn-danger-soft btn-block" style="margin-top:8px" data-a="hvan-baja" data-id="${esc(v.id)}">${I('trash')}Dar de baja esta van (su QR deja de valer)</button>` : ''}</form>`);
};
F['hvan'] = (d, form) => {
  if (!soloHotel()) return;
  const id = form.dataset.id;
  Store.cambiar(s => { s.hotelVans = aLista(s.hotelVans);
    const datos = { nombre:d.nombre.trim(), patente:normPatente(d.patente), modelo:(d.modelo || '').trim(), plazas:+d.plazas || 0, chofer:(d.chofer || '').trim(), telChofer:(d.telChofer || '').trim() };
    const x = id && s.hotelVans.find(v => v.id === id);
    if (x) Object.assign(x, datos); else s.hotelVans.push({ id:'hv' + uid(), codigo:codigoLargo('H'), activa:true, at:Date.now(), ...datos });
    auditar(s, id ? 'El hotel editó una van' : 'El hotel cargó una van', datos.nombre + ' · ' + datos.patente); });
  cerrarHoja(); toast('Van guardada. Imprimí su QR para el parabrisas.', 'car');
};
A['hvan-baja'] = async el => {
  if (!soloHotel() || !await confirmar('Dar de baja la van', 'Deja de figurar y su QR ya no vale en la garita.', { si:'Dar de baja', peligro:true })) return;
  Store.cambiar(s => { const x = aLista(s.hotelVans).find(v => v.id === el.dataset.id); if (x){ x.baja = Date.now(); auditar(s, 'El hotel dio de baja una van', x.nombre); } });
  cerrarHoja(); toast('Van dada de baja', 'check');
};
/* El QR de cada van (y de cada proveedor) es fijo: se imprime y se pega en
   el parabrisas o se lo lleva el proveedor. La garita lo lee y registra el
   paso con un toque. */
async function hojaQRHotel(titulo, sub, codigo, nota){
  hoja(titulo, `<div class="ticket"><div class="tk-top"><small>${HOTEL_NOMBRE} · ingreso al barrio</small><h3>${esc(sub)}</h3></div>
    <div class="bottom"><div class="qr-box" id="hotelQR"></div><div class="codigo-grande">${esc(codigo)}</div><div class="muted small">${esc(nota)}</div></div></div>
    <div class="btns" style="margin-top:12px"><button class="btn btn-pri grow" data-a="hqr-imprimir" data-v="${esc(codigo)}" data-t="${esc(sub)}">${I('download')}Imprimir el QR</button>
      <button class="btn btn-sec grow" data-a="copiar" data-v="${esc(codigo)}">${I('copy')}Copiar el código</button></div>`);
  setTimeout(() => pintarQR($('#hotelQR'), 'BHC:' + codigo), 40);
}
A['hvan-qr'] = el => { const v = hotelVans().find(x => x.id === el.dataset.id); if (v) hojaQRHotel('QR de la van', `${v.nombre} · ${v.patente}`, v.codigo, 'Pegalo en el parabrisas, del lado del acompañante. La garita lo lee al entrar y al salir.'); };
A['hqr-imprimir'] = async el => {
  const q = await cargarQR(); if (!q) return toast('Sin conexión para dibujar el QR', 'alert');
  const qr = q(0, 'M'); qr.addData('BHC:' + el.dataset.v); qr.make();
  imprimir('QR · ' + el.dataset.t, `<div style="text-align:center;padding:20px"><h2 style="border:0">${esc(HOTEL_NOMBRE)}</h2><p style="font-size:18px"><b>${esc(el.dataset.t)}</b></p>
    <div style="width:260px;margin:14px auto">${qr.createSvgTag({ cellSize:8, margin:2, scalable:true })}</div><p style="font-size:22px;letter-spacing:2px"><b>${esc(el.dataset.v)}</b></p>
    <p style="color:#555">Mostrar en la garita del Barrio ${esc(Store.s.config.nombre)} al entrar y al salir.</p></div>`, { pie:'QR fijo del hotel. Si se pierde, dar de baja y cargar de nuevo.' });
};
/* La garita registra el paso de una van: el traslado que le tocaba se
   actualiza solo. Si viene de la solapa de las vans, trae el traslado
   exacto (`data-p`); si no, se busca el más cercano en hora. */
A['hvan-mov'] = el => moverVan(el.dataset.id, el.dataset.v === 'in' ? 'in' : 'out', el.dataset.p || '');
function moverVan(vanId, tipo, viajeId = ''){
  if (!soloGarita()) return;
  const v = hotelVans().find(x => x.id === vanId); if (!v) return;
  const at = Date.now(), ahora = ahoraMin(), hoy = hoyISO();
  let viaje = null;
  Store.cambiar(s => {
    const vs = aLista(s.hotelViajes).filter(x => x.fecha === hoy);
    const elegido = viajeId ? vs.find(x => x.id === viajeId && x.estado === (tipo === 'out' ? 'programado' : 'en_curso')) : null;
    if (tipo === 'out'){
      viaje = elegido || vs.filter(x => x.estado === 'programado' && (!x.vanId || x.vanId === v.id) && (!x.sale || Math.abs(minutosDe(x.sale) - ahora) <= 90))
        .sort((a, b) => (!!b.vanId - !!a.vanId) || Math.abs(minutosDe(a.sale || '12:00') - ahora) - Math.abs(minutosDe(b.sale || '12:00') - ahora))[0] || null;
      if (viaje){ viaje.estado = 'en_curso'; viaje.salioAt = at; viaje.vanId = viaje.vanId || v.id; }
    } else {
      viaje = elegido || vs.find(x => x.estado === 'en_curso' && x.vanId === v.id) || null;
      if (viaje){ viaje.estado = 'hecho'; viaje.volvioAt = at; }
    }
    s.hotelMovs = aLista(s.hotelMovs); s.hotelMovs.unshift({ id:'hm' + uid(), vanId:v.id, tipo, at, por:yo().id, viaje: viaje ? textoViaje(viaje) : '' });
    s.bitacora.unshift({ id:uid(), autor:yo().id, tipo:'acceso', texto:`${tipo === 'in' ? 'Ingreso' : 'Egreso'}: van del hotel ${v.nombre} (${v.patente})${viaje ? ' · ' + textoViaje(viaje) : ''}`, at });
    const h = hotelId(); if (h) notificar(s, { para:[h], titulo:`${v.nombre} ${tipo === 'in' ? 'entró al barrio' : 'salió del barrio'}`, texto:`${hora(at)} h${viaje ? ' · ' + textoViaje(viaje) : ''}`, icon:'car', color:'wood', link:'hotel-traslados', push:false });
  });
  cerrarHoja(); toast(`${v.nombre}: ${tipo === 'in' ? 'entrada' : 'salida'} registrada`, tipo === 'in' ? 'login' : 'logout');
}
/* Desde la solapa: el traslado sin van asignada pregunta cuál sale. */
A['hviaje-mov'] = el => {
  if (!soloGarita()) return;
  const x = hotelViajes().find(v => v.id === el.dataset.id); if (!x) return;
  const tipo = el.dataset.v === 'in' ? 'in' : 'out', vans = hotelVans();
  if (x.vanId || vans.length === 1) return moverVan(x.vanId || vans[0].id, tipo, x.id);
  if (!vans.length) return toast('El hotel todavía no cargó sus vans', 'car');
  hoja('¿Qué van sale?', `<p class="muted small" style="margin:0 0 10px">${esc(x.sale || '')} h · ${esc(textoViaje(x))}</p>
    ${vans.map(v => `<button class="superficie" data-a="hvan-mov" data-id="${esc(v.id)}" data-v="${tipo}" data-p="${esc(x.id)}"><span class="ic ic-wood">${I('car')}</span><span class="txt"><b>${esc(v.nombre)}</b><small class="mono">${esc(v.patente || '')}${v.chofer ? ' · ' + esc(v.chofer) : ''}</small></span>${I('right')}</button>`).join('')}`);
};

/* =========================================================
   LAS VANS DEL HOTEL EN LA GARITA, A UN TOQUE (pedido de Claudio, 27-09)
   "Tan fácil y accesible como la solapa del camión": los traslados
   programados para HOY, por hora, cada uno con su botón grande "Salió" y,
   cuando vuelve, "Volvió". Un toque anota todo: la bitácora, el traslado
   ("En viaje" → "Hecho") y el aviso a la recepción del hotel. Abajo, las
   vans con un botón para las salidas que no estaban programadas.
   ========================================================= */
function bandaVansGarita(opera){
  const vans = hotelVans(), vs = viajesDelDia(hoyISO());
  if (!vans.length && !vs.length) return '';
  const pend = vs.filter(x => x.estado !== 'hecho'), hechos = vs.filter(x => x.estado === 'hecho');
  const vanDe = x => vans.find(v => v.id === x.vanId);
  const fila = x => { const v = vanDe(x), d = DESTINOS_HOTEL[x.destino] || DESTINOS_HOTEL.otro, aj = ajusteViaje(x), curso = x.estado === 'en_curso';
    const tarde = x.estado === 'programado' && x.sale && ahoraMin() > minutosDe(x.sale) + 15;
    return `<div class="vg-fila ${curso ? 'curso' : ''} ${tarde ? 'tarde' : ''}"><div class="vg-hora"><b>${esc(x.sale || '—')}</b><small>${curso ? 'en viaje' : 'sale'}</small></div>
      <div class="grow"><b>${I(d[1])} ${esc(textoViaje(x))}</b>
        <small>${v ? `${esc(v.nombre)} · <span class="mono">${esc(v.patente || '')}</span>` : 'van sin asignar'} · ${plural(+x.pax || 0, 'pasajero')}${curso && x.salioAt ? ` · salió ${hora(x.salioAt)} h` : ''}${tarde ? ' · <b>se atrasó</b>' : ''}</small>
        ${aj ? `<small class="hv-alerta">${I(aj.cancelado ? 'alert' : 'clock')} ${aj.cancelado ? 'El vuelo figura CANCELADO' : `El vuelo cambió: conviene salir ${esc(aj.sale)}`}</small>` : ''}</div>
      ${opera ? `<button class="btn btn-sm ${curso ? 'btn-ok' : 'btn-pri'}" data-a="hviaje-mov" data-id="${esc(x.id)}" data-v="${curso ? 'in' : 'out'}">${I(curso ? 'login' : 'logout')}${curso ? 'Volvió' : 'Salió'}</button>`
        : `<span class="pill ${curso ? 'p-warn' : 'p-sky'}">${curso ? 'En viaje' : 'Programado'}</span>`}</div>`; };
  return `<div class="card vans-garita">
    <div class="row" style="justify-content:space-between;gap:8px;flex-wrap:wrap"><b class="row" style="gap:8px">${I('car')}Vans del hotel · hoy</b>
      <span class="muted small">${pend.length ? plural(pend.length, 'salida pendiente', 'salidas pendientes') : vs.length ? 'todas hechas' : 'sin traslados programados'}${hechos.length ? ` · ${plural(hechos.length, 'hecha', 'hechas')}` : ''}</span></div>
    ${pend.length ? `<div class="vg-lista">${pend.map(fila).join('')}</div>` : ''}
    ${hechos.length ? `<details class="vg-hechos" data-k="vans-hechas"><summary class="muted small">Hechas hoy (${hechos.length})</summary>${hechos.map(x => { const v = vanDe(x); return `<div class="small" style="margin:4px 0">${I('check')} ${esc(x.sale || '—')} · ${esc(textoViaje(x))}${v ? ' · ' + esc(v.nombre) : ''} · salió ${x.salioAt ? hora(x.salioAt) : '—'} · volvió ${x.volvioAt ? hora(x.volvioAt) : '—'}</div>`; }).join('')}</details>` : ''}
    ${vans.length ? `<div class="vg-vans"><span class="muted tiny">Salida o entrada sin traslado programado:</span>${vans.map(v => { const e = estadoVan(v);
      return `<span class="vg-van">${esc(v.nombre)} <span class="mono muted">${esc(v.patente || '')}</span> · ${e.adentro ? 'en el barrio' : 'afuera'}${opera ? ` <button class="btn btn-xs btn-sec" data-a="hvan-mov" data-id="${esc(v.id)}" data-v="${e.adentro ? 'out' : 'in'}">${e.adentro ? 'Salió' : 'Entró'}</button>` : ''}</span>`; }).join('')}</div>` : ''}
  </div>`;
}

/* Programar un traslado. `data-v` trae lo que ya se sabe:
   "vuelo|AR1881|D|15:40|13:30", "crucero|<barco>|buscar|<fecha>|<sale>",
   "evento|<título>|llevar|<fecha>|<hora>". */
A['hviaje-nuevo'] = el => {
  if (!soloHotel()) return;
  const [t, a, b, c, dd] = String(el?.dataset?.v || '').split('|');
  const x = { fecha:hoyISO(), sale:'', destino:'aeropuerto', sentido:'llevar', ref:{ tipo:'' }, pax:1, vanId:'' };
  if (t === 'vuelo'){ Object.assign(x, { sentido: b === 'A' ? 'buscar' : 'llevar', sale:dd || '', ref:{ tipo:'vuelo', nro:a, sentido:b, hora:c } }); }
  if (t === 'crucero'){ Object.assign(x, { destino:'puerto', sentido:b, fecha:c || hoyISO(), sale:dd || '', ref:{ tipo:'crucero', barco:a } }); }
  if (t === 'evento'){ Object.assign(x, { destino:'centro', fecha:c || hoyISO(), sale:dd || '', ref:{ tipo:'evento', desc:a } }); }
  formViaje(x);
};
A['hviaje-editar'] = el => { if (!soloHotel()) return; const x = hotelViajes().find(v => v.id === el.dataset.id); if (x) formViaje(x); };
function formViaje(x){
  const vans = hotelVans();
  hoja(x.id ? 'Editar traslado' : 'Nuevo traslado', `<form data-f="hviaje" data-id="${esc(x.id || '')}">
    ${x.ref && x.ref.tipo ? `<div class="card plana small">${I(x.ref.tipo === 'vuelo' ? 'send' : x.ref.tipo === 'crucero' ? 'drop' : 'star')} ${esc(x.ref.tipo === 'vuelo' ? `Vuelo ${x.ref.nro}${x.ref.hora ? ' · ' + x.ref.hora + ' h' : ''} (${x.ref.sentido === 'A' ? 'llega' : 'sale'})` : x.ref.tipo === 'crucero' ? conMayusculasBarco(x.ref.barco) : x.ref.desc)}${x.sale ? ` · la hora de salida ya está calculada con la ficha del hotel` : ''}</div>` : ''}
    <input type="hidden" name="ref" value="${esc(JSON.stringify(x.ref || {}))}">
    <div class="grid2"><div class="field"><label>Qué</label><select name="sentido"><option value="llevar" ${x.sentido === 'llevar' ? 'selected' : ''}>Llevar</option><option value="buscar" ${x.sentido === 'buscar' ? 'selected' : ''}>Buscar</option></select></div>
      <div class="field"><label>A dónde</label><select name="destino">${Object.entries(DESTINOS_HOTEL).map(([k, d]) => `<option value="${k}" ${x.destino === k ? 'selected' : ''}>${d[0]}</option>`).join('')}</select></div></div>
    <div class="grid3"><div class="field"><label>Día</label><input type="date" name="fecha" required value="${esc(x.fecha)}"></div>
      <div class="field"><label>Sale la van</label><input type="time" name="sale" value="${esc(x.sale || '')}"></div>
      <div class="field"><label>Pasajeros</label><input type="number" name="pax" min="0" max="60" value="${esc(x.pax || 1)}"></div></div>
    <div class="field"><label>Van</label><select name="vanId"><option value="">Sin asignar todavía</option>${vans.map(v => `<option value="${esc(v.id)}" ${x.vanId === v.id ? 'selected' : ''}>${esc(v.nombre)} · ${esc(v.patente)}</option>`).join('')}</select></div>
    <div class="field"><label>Nota (opcional)</label><input name="nota" maxlength="120" value="${esc(x.nota || '')}" placeholder="Ej: grupo de 4, con equipaje de esquí"></div>
    <button class="btn btn-pri btn-block">${I('check')}Guardar el traslado</button>
    ${x.id ? `<button type="button" class="btn btn-danger-soft btn-block" style="margin-top:8px" data-a="hviaje-cancelar" data-id="${esc(x.id)}">${I('x')}Cancelar el traslado</button>` : ''}</form>`);
}
F['hviaje'] = (d, form) => {
  if (!soloHotel()) return;
  let ref = {}; try { ref = JSON.parse(d.ref || '{}') || {}; } catch(e){}
  const id = form.dataset.id;
  Store.cambiar(s => { s.hotelViajes = aLista(s.hotelViajes);
    const datos = { fecha:d.fecha, sale:d.sale || '', destino:d.destino, sentido:d.sentido, pax:+d.pax || 0, vanId:d.vanId || '', nota:(d.nota || '').trim() };
    const x = id && s.hotelViajes.find(v => v.id === id);
    if (x){ if (x.sale !== datos.sale) datos.saleAMano = true; Object.assign(x, datos); }
    else s.hotelViajes.push({ id:'ht' + uid(), ref, estado:'programado', at:Date.now(), ...datos });
    /* Si es de hoy, la garita lo tiene que saber. */
    if (datos.fecha === hoyISO()) notificar(s, { para:'rol:guardia', titulo:'Traslado del hotel', texto:`${datos.sale || 'Sin hora'} · ${textoViaje({ ...datos, ref })}`, icon:'car', color:'wood', link:'hotel-vivo', push:false });
  });
  cerrarHoja(); toast('Traslado guardado', 'car');
};
A['hviaje-ajustar'] = el => { if (!soloHotel()) return; Store.cambiar(s => { const x = aLista(s.hotelViajes).find(v => v.id === el.dataset.id); if (x){ x.sale = el.dataset.v; x.saleAMano = false; } }); toast(`La van sale a las ${el.dataset.v}`, 'clock'); };
A['hviaje-cancelar'] = el => { if (!soloHotel()) return; Store.cambiar(s => { const x = aLista(s.hotelViajes).find(v => v.id === el.dataset.id); if (x) x.estado = 'cancelado'; }); cerrarHoja(); toast('Traslado cancelado', 'check'); };

/* =========================================================
   HUÉSPEDES
   Lo mínimo para que la garita deje pasar: nombre, fechas, patente si
   vienen en auto, y (opcional) los vuelos, que arman los traslados. Los
   ven SOLO el hotel y la garita; la Administración ve cuántos hay, sin
   nombres. Se borran solos al día siguiente del check-out.
   ========================================================= */
R['hotel-huespedes'] = {
  titulo:'Huéspedes', icon:'users', color:'sky', sub:'Solo los ven el hotel y la garita · se borran solos',
  render(){
    if (esAdmin()) return `<div class="card"><b style="font-size:22px">${hotelInfo().huespedesHoy || 0}</b> <span class="muted">huéspedes hoy en el hotel</span></div>
      <p class="muted small">${I('lock')} La lista con nombres la ven solo el hotel y la garita, que la necesita para dejar pasar. La Administración ve únicamente la cantidad (Ley 25.326: mínimo acceso).</p>`;
    const hoy = hoyISO(), hs = hotelHuespedes().sort((a, b) => a.desde.localeCompare(b.desde) || a.nombre.localeCompare(b.nombre));
    const llegan = hs.filter(h => h.desde === hoy), estan = hs.filter(h => h.desde < hoy && h.hasta >= hoy), futuros = hs.filter(h => h.desde > hoy);
    const fila = h => `<div class="it"><div class="txt"><b>${esc(h.nombre)}${+h.pax > 1 ? ` <small>(${h.pax})</small>` : ''}</b>
        <span>${fechaCorta(h.desde)} → ${fechaCorta(h.hasta)}${h.patente ? ' · ' + esc(h.patente) : ''}${h.llegaVuelo ? ' · llega ' + esc(h.llegaVuelo) : ''}${h.saleVuelo ? ' · se va ' + esc(h.saleVuelo) : ''}${h.ingreso ? ` · ${I('check')} ingresó ${hora(h.ingreso)} h` : ''}</span></div>
      ${esGuardia() && h.desde <= hoy && !h.ingreso ? `<button class="btn btn-xs btn-ok" data-a="hhuesped-ingreso" data-id="${esc(h.id)}">${I('login')}Ingresó</button>` : ''}
      ${esHotel() ? `<button class="icon-btn" data-a="hhuesped-editar" data-id="${esc(h.id)}" aria-label="Editar">${I('edit')}</button>` : ''}</div>`;
    return `${esHotel() ? superficie({ a:'hhuesped-editar', icon:'plus', t:'Cargar un huésped', s:'Nombre, fechas, patente y vuelos (opcional)', cls:'acento' }) : ''}
      ${sec(`Llegan hoy (${llegan.length})`)}${llegan.length ? `<div class="card lista">${llegan.map(fila).join('')}</div>` : vacio('users', 'Nadie anunciado para hoy.')}
      ${estan.length ? sec(`En el hotel (${estan.length})`) + `<div class="card lista">${estan.map(fila).join('')}</div>` : ''}
      ${futuros.length && esHotel() ? sec(`Próximos (${futuros.length})`) + `<div class="card lista">${futuros.map(fila).join('')}</div>` : ''}
      <p class="muted tiny" style="margin-top:12px">${I('lock')} Datos de terceros: se cargan solo los necesarios para el ingreso y los traslados, los ven únicamente el hotel y la garita y se borran solos al día siguiente del check-out. El hotel es responsable de informarle a su huésped que comparte estos datos con la guardia del barrio.</p>`;
  },
};
A['hhuesped-editar'] = el => {
  if (!soloHotel()) return;
  const h = hotelHuespedes().find(x => x.id === el.dataset.id) || { desde:hoyISO(), hasta:sumarDias(hoyISO(), 2), pax:1 };
  hoja(h.id ? 'Editar huésped' : 'Nuevo huésped', `<form data-f="hhuesped" data-id="${esc(h.id || '')}">
    <div class="grid2"><div class="field"><label>Nombre y apellido</label><input name="nombre" required maxlength="60" value="${esc(h.nombre || '')}"></div>
      <div class="field"><label>Personas</label><input name="pax" type="number" min="1" max="30" value="${esc(h.pax || 1)}"></div></div>
    <div class="grid3"><div class="field"><label>Check-in</label><input type="date" name="desde" required value="${esc(h.desde)}"></div>
      <div class="field"><label>Check-out</label><input type="date" name="hasta" required value="${esc(h.hasta)}"></div>
      <div class="field"><label>Patente (si viene en auto)</label><input name="patente" maxlength="10" style="text-transform:uppercase" value="${esc(h.patente || '')}"></div></div>
    <div class="grid2"><div class="field"><label>Vuelo de llegada</label><input name="llegaVuelo" maxlength="10" style="text-transform:uppercase" value="${esc(h.llegaVuelo || '')}" placeholder="AR1880"></div>
      <div class="field"><label>Hora de llegada</label><input type="time" name="llegaHora" value="${esc(h.llegaHora || '')}"></div></div>
    <div class="grid2"><div class="field"><label>Vuelo de salida</label><input name="saleVuelo" maxlength="10" style="text-transform:uppercase" value="${esc(h.saleVuelo || '')}" placeholder="AR1881"></div>
      <div class="field"><label>Hora de salida</label><input type="time" name="saleHora" value="${esc(h.saleHora || '')}"></div></div>
    <p class="muted tiny" style="margin:0 0 10px">Con los vuelos, la app arma sola el traslado (y junta a los que viajan en el mismo vuelo). La hora de la van se recalcula el mismo día con el tablero del aeropuerto.</p>
    <button class="btn btn-pri btn-block">${I('check')}Guardar</button>
    ${h.id ? `<button type="button" class="btn btn-danger-soft btn-block" style="margin-top:8px" data-a="hhuesped-borrar" data-id="${esc(h.id)}">${I('trash')}Borrar</button>` : ''}</form>`);
};
F['hhuesped'] = (d, form) => {
  if (!soloHotel()) return;
  if (d.hasta < d.desde){ toast('El check-out no puede ser antes del check-in', 'calendar'); return; }
  const id = form.dataset.id;
  Store.cambiar(s => { s.hotelHuespedes = aLista(s.hotelHuespedes);
    const datos = { nombre:d.nombre.trim(), pax:+d.pax || 1, desde:d.desde, hasta:d.hasta, patente:normPatente(d.patente),
      llegaVuelo:normVuelo(d.llegaVuelo), llegaHora:d.llegaHora || '', saleVuelo:normVuelo(d.saleVuelo), saleHora:d.saleHora || '' };
    const x = id && s.hotelHuespedes.find(h => h.id === id);
    if (x) Object.assign(x, datos); else s.hotelHuespedes.push({ id:'hh' + uid(), at:Date.now(), ...datos });
    trasladosDeHuespedes(s); });
  cerrarHoja(); toast('Huésped guardado', 'users');
};
A['hhuesped-borrar'] = el => { if (!soloHotel()) return; Store.cambiar(s => { s.hotelHuespedes = aLista(s.hotelHuespedes).filter(h => h.id !== el.dataset.id); trasladosDeHuespedes(s); }); cerrarHoja(); toast('Borrado', 'trash'); };
A['hhuesped-ingreso'] = el => {
  if (!soloGarita()) return;
  Store.cambiar(s => { const h = aLista(s.hotelHuespedes).find(x => x.id === el.dataset.id); if (!h) return; h.ingreso = Date.now();
    s.bitacora.unshift({ id:uid(), autor:yo().id, tipo:'acceso', texto:`Ingreso: huésped del hotel${h.patente ? ' · ' + h.patente : ''}`, at:Date.now() }); });
  cerrarHoja(); toast('Ingreso registrado', 'login');
};

/* =========================================================
   EVENTOS DEL HOTEL
   ========================================================= */
const TIPOS_EVENTO_H = { cena:'Cena o fiesta', boda:'Casamiento', conferencia:'Congreso o reunión', deportivo:'Evento deportivo', otro:'Otro' };
R['hotel-eventos'] = {
  titulo:'Eventos del hotel', icon:'star', color:'accent', sub:'La garita se entera; los vecinos, si hace falta',
  render(){
    const hoy = hoyISO(), es = hotelEventos().filter(e => e.fecha >= sumarDias(hoy, -1)).sort((a, b) => a.fecha.localeCompare(b.fecha));
    const pend = es.filter(e => e.avisarVecinos && !e.publicado);
    return `${esHotel() ? superficie({ a:'hevento-editar', icon:'plus', t:'Anunciar un evento', s:'Fecha, horario, invitados, estacionamiento y música', cls:'acento' }) : ''}
      ${esAdmin() && pend.length ? aviso('warn', 'bell', `${plural(pend.length, 'evento pide', 'eventos piden')} avisar a los vecinos`, 'Revisalo y publicalo en el pizarrón si corresponde.') : ''}
      ${es.length ? es.map(e => `<div class="card"><div class="row" style="align-items:flex-start;gap:10px"><span class="ic ic-accent" style="width:40px;height:40px;border-radius:13px;display:grid;place-items:center;flex:none">${I('star')}</span>
          <div class="grow"><b>${esc(e.titulo)}</b><div class="muted small">${e.fecha === hoy ? 'Hoy' : fechaLarga(e.fecha)} · ${esc(e.desde || '')}${e.hasta ? '–' + esc(e.hasta) : ''} h · ${esc(TIPOS_EVENTO_H[e.tipo] || 'Evento')} · ${plural(+e.asistentes || 0, 'invitado')}</div>
          ${e.ingreso ? `<div class="small" style="margin-top:4px"><b>Ingreso de invitados:</b> ${esc(e.ingreso)}</div>` : ''}${e.estacionamiento ? `<div class="small"><b>Estacionamiento:</b> ${esc(e.estacionamiento)}</div>` : ''}${e.musicaHasta ? `<div class="small"><b>Música hasta:</b> ${esc(e.musicaHasta)} h</div>` : ''}${e.nota ? `<div class="small muted">${esc(e.nota)}</div>` : ''}
          <div class="small" style="margin-top:4px">${e.publicado ? `<span class="pill p-ok">${I('check')}Avisado a los vecinos</span>` : e.avisarVecinos ? `<span class="pill p-warn">Pidió avisar a los vecinos</span>` : `<span class="pill">Solo garita y Administración</span>`}</div></div></div>
        <div class="btns" style="margin-top:8px">${esHotel() ? `<button class="btn btn-xs btn-sec" data-a="hevento-editar" data-id="${esc(e.id)}">${I('edit')}Editar</button>` : ''}
          ${esAdmin() && e.avisarVecinos && !e.publicado ? `<button class="btn btn-xs btn-pri" data-a="hevento-publicar" data-id="${esc(e.id)}">${I('muro')}Publicar para los vecinos</button>` : ''}</div></div>`).join('')
        : vacio('star', 'No hay eventos anunciados.')}
      <p class="muted tiny" style="margin-top:12px">${I('info')} Lo que anuncia el hotel le llega a la garita al instante. A los vecinos se les avisa solo si el hotel lo pide y la Administración lo publica (por ejemplo, un casamiento con música hasta tarde o autos en la calle).</p>`;
  },
};
A['hevento-editar'] = el => {
  if (!soloHotel()) return;
  const e = hotelEventos().find(x => x.id === el?.dataset?.id) || { fecha:hoyISO(), desde:'20:00', hasta:'01:00', tipo:'cena' };
  hoja(e.id ? 'Editar evento' : 'Anunciar un evento', `<form data-f="hevento" data-id="${esc(e.id || '')}">
    <div class="field"><label>Qué evento</label><input name="titulo" required maxlength="60" value="${esc(e.titulo || '')}" placeholder="Casamiento Pérez-Gómez"></div>
    <div class="grid2"><div class="field"><label>Tipo</label><select name="tipo">${Object.entries(TIPOS_EVENTO_H).map(([k, t]) => `<option value="${k}" ${e.tipo === k ? 'selected' : ''}>${t}</option>`).join('')}</select></div>
      <div class="field"><label>Invitados (aprox.)</label><input name="asistentes" type="number" min="0" max="2000" value="${esc(e.asistentes || '')}"></div></div>
    <div class="grid3"><div class="field"><label>Día</label><input type="date" name="fecha" required value="${esc(e.fecha)}"></div>
      <div class="field"><label>Desde</label><input type="time" name="desde" value="${esc(e.desde || '')}"></div>
      <div class="field"><label>Hasta</label><input type="time" name="hasta" value="${esc(e.hasta || '')}"></div></div>
    <div class="field"><label>Cómo ingresan los invitados</label><input name="ingreso" maxlength="140" value="${esc(e.ingreso || '')}" placeholder="Con la van del hotel desde el centro / con lista en la garita"></div>
    <div class="grid2"><div class="field"><label>Estacionamiento</label><input name="estacionamiento" maxlength="100" value="${esc(e.estacionamiento || '')}" placeholder="Dentro del predio del hotel"></div>
      <div class="field"><label>Música hasta</label><input type="time" name="musicaHasta" value="${esc(e.musicaHasta || '')}"></div></div>
    <div class="field"><label>Nota para la garita (opcional)</label><input name="nota" maxlength="140" value="${esc(e.nota || '')}"></div>
    <label class="check"><input type="checkbox" name="avisarVecinos" ${e.avisarVecinos ? 'checked' : ''}><span>Pedir a la Administración que avise a los vecinos (música, tránsito o autos en la calle)</span></label>
    <button class="btn btn-pri btn-block" style="margin-top:10px">${I('check')}Guardar y avisar a la garita</button>
    ${e.id ? `<button type="button" class="btn btn-danger-soft btn-block" style="margin-top:8px" data-a="hevento-cancelar" data-id="${esc(e.id)}">${I('x')}Cancelar el evento</button>` : ''}</form>`);
};
F['hevento'] = (d, form) => {
  if (!soloHotel()) return;
  const id = form.dataset.id;
  Store.cambiar(s => { s.hotelEventos = aLista(s.hotelEventos);
    const datos = { titulo:d.titulo.trim(), tipo:d.tipo, asistentes:+d.asistentes || 0, fecha:d.fecha, desde:d.desde || '', hasta:d.hasta || '', ingreso:(d.ingreso || '').trim(),
      estacionamiento:(d.estacionamiento || '').trim(), musicaHasta:d.musicaHasta || '', nota:(d.nota || '').trim(), avisarVecinos:!!d.avisarVecinos };
    const x = id && s.hotelEventos.find(e => e.id === id);
    if (x) Object.assign(x, datos); else s.hotelEventos.push({ id:'he' + uid(), at:Date.now(), ...datos });
    notificar(s, { para:'rol:guardia', titulo:`Evento en el hotel: ${datos.titulo}`, texto:`${fechaCorta(datos.fecha)} · ${datos.desde}${datos.hasta ? '–' + datos.hasta : ''} h · ${plural(datos.asistentes, 'invitado')}`, icon:'star', color:'accent', link:'hotel-eventos', sonido:true });
    if (datos.avisarVecinos) notificar(s, { para:'rol:admin', titulo:'El hotel pide avisar a los vecinos', texto:datos.titulo, icon:'star', color:'accent', link:'hotel-eventos' });
  });
  cerrarHoja(); toast('Evento anunciado. La garita ya lo sabe.', 'star');
};
A['hevento-cancelar'] = el => { if (!soloHotel()) return; Store.cambiar(s => { const x = aLista(s.hotelEventos).find(e => e.id === el.dataset.id); if (x){ x.cancelado = Date.now();
  notificar(s, { para:'rol:guardia', titulo:`Se canceló el evento del hotel: ${x.titulo}`, icon:'star', color:'accent', link:'hotel-eventos', push:false }); } }); cerrarHoja(); toast('Evento cancelado', 'check'); };
A['hevento-publicar'] = el => {
  if (!esAdmin()) return;
  const e = hotelEventos().find(x => x.id === el.dataset.id); if (!e) return;
  Store.cambiar(s => {
    s.posts.unshift({ id:'hep-' + e.id, type:'evento', title:`${HOTEL_NOMBRE}: ${e.titulo}`, body:`${e.desde ? 'De ' + e.desde + (e.hasta ? ' a ' + e.hasta : '') + ' h. ' : ''}${e.musicaHasta ? 'Música hasta las ' + e.musicaHasta + ' h. ' : ''}${e.estacionamiento ? 'Estacionamiento: ' + e.estacionamiento + '. ' : ''}Aviso publicado por la Administración a pedido del hotel.`,
      autor:yo().id, createdAt:Date.now(), reactions:{}, comments:[], fecha:e.fecha, horaEv:e.desde || '', lugar:HOTEL_NOMBRE, voy:[] });
    const x = aLista(s.hotelEventos).find(v => v.id === e.id); if (x){ x.publicado = Date.now(); x.publicadoPor = yo().id; }
    notificar(s, { para:'todos', titulo:`Evento en el ${HOTEL_NOMBRE}`, texto:`${e.titulo} · ${fechaCorta(e.fecha)}${e.desde ? ' · ' + e.desde + ' h' : ''}`, icon:'star', color:'accent', link:'pizarron' });
    auditar(s, 'Publicó un evento del hotel para los vecinos', e.titulo);
  });
  toast('Publicado en el pizarrón', 'muro');
};

/* =========================================================
   PROVEEDORES DEL HOTEL (con ART y seguro, cada uno con su QR)
   ========================================================= */
function estadoProv(p, hoy = hoyISO()){
  if (p.estado === 'suspendido') return ['danger', 'Suspendido por la Administración'];
  if (!p.artVence || p.artVence < hoy) return ['danger', p.artVence ? `ART vencida el ${fechaCorta(p.artVence)}` : 'Sin ART cargada'];
  if (p.seguroVence && p.seguroVence < hoy) return ['warn', `Seguro vencido el ${fechaCorta(p.seguroVence)}`];
  if (p.artVence <= sumarDias(hoy, 10)) return ['warn', `ART vence el ${fechaCorta(p.artVence)}`];
  return ['ok', 'ART y seguro al día'];
}
R['hotel-proveedores'] = {
  titulo:'Proveedores del hotel', icon:'box', color:'brand', sub:'ART, seguro y QR de ingreso',
  render(){
    const ps = hotelProvs().sort((a, b) => a.empresa.localeCompare(b.empresa));
    return `${esHotel() ? superficie({ a:'hprov-editar', icon:'plus', t:'Cargar un proveedor', s:'Empresa, personal, patentes, días, ART y seguro', cls:'acento' }) : ''}
      ${ps.length ? ps.map(p => { const [c, t] = estadoProv(p);
        return `<div class="card"><div class="row" style="align-items:flex-start;gap:10px"><span class="ic ic-${c === 'ok' ? 'ok' : c === 'warn' ? 'warn' : 'danger'}" style="width:40px;height:40px;border-radius:13px;display:grid;place-items:center;flex:none">${I('box')}</span>
          <div class="grow"><b>${esc(p.empresa)}</b><div class="muted small">${esc(p.rubro || '')}${aLista(p.dias).length ? ' · ' + aLista(p.dias).map(d => DIAS[d]).join(' ') : ''}${p.desde ? ` · ${esc(p.desde)} a ${esc(p.hasta)} h` : ''}${p.patentes ? ' · ' + esc(p.patentes) : ''}</div>
            <div class="hv-pills"><span class="pill p-${c === 'ok' ? 'ok' : c === 'warn' ? 'warn' : 'danger'}">${esc(t)}</span>${p.revisado ? `<span class="pill">${I('check')}Revisado</span>` : ''}</div></div></div>
          <div class="btns" style="margin-top:8px">${esHotel() ? `<button class="btn btn-xs btn-sec" data-a="hprov-qr" data-id="${esc(p.id)}">${I('qr')}QR</button><button class="btn btn-xs btn-sec" data-a="hprov-editar" data-id="${esc(p.id)}">${I('edit')}Editar</button>` : ''}
            ${esGuardia() && c !== 'danger' ? `<button class="btn btn-xs btn-ok" data-a="hprov-mov" data-id="${esc(p.id)}" data-v="in">${I('login')}Entra</button><button class="btn btn-xs btn-sec" data-a="hprov-mov" data-id="${esc(p.id)}" data-v="out">${I('logout')}Sale</button>` : ''}
            ${esAdmin() ? `<button class="btn btn-xs btn-sec" data-a="hprov-revisar" data-id="${esc(p.id)}">${I('check')}${p.revisado ? 'Quitar revisión' : 'Marcar revisado'}</button><button class="btn btn-xs ${p.estado === 'suspendido' ? 'btn-ok' : 'btn-danger-soft'}" data-a="hprov-suspender" data-id="${esc(p.id)}">${p.estado === 'suspendido' ? 'Rehabilitar' : 'Suspender'}</button>` : ''}</div></div>`; }).join('')
        : vacio('box', 'El hotel todavía no cargó proveedores.')}
      <p class="muted tiny" style="margin-top:12px">${I('info')} Con la ART vencida o sin cargar, la garita ve el proveedor en rojo y no lo deja pasar. La Administración puede suspenderlo.</p>`;
  },
};
A['hprov-editar'] = el => {
  if (!soloHotel()) return;
  const p = hotelProvs().find(x => x.id === el?.dataset?.id) || { dias:[1, 2, 3, 4, 5] };
  hoja(p.id ? 'Editar proveedor' : 'Nuevo proveedor', `<form data-f="hprov" data-id="${esc(p.id || '')}">
    <div class="grid2"><div class="field"><label>Empresa</label><input name="empresa" required maxlength="50" value="${esc(p.empresa || '')}"></div>
      <div class="field"><label>Rubro</label><input name="rubro" maxlength="40" value="${esc(p.rubro || '')}" placeholder="Alimentos, lavandería, mantenimiento…"></div></div>
    <div class="field"><label>Personal que ingresa (uno por renglón)</label><textarea name="personal" maxlength="400">${esc(p.personal || '')}</textarea></div>
    <div class="grid2"><div class="field"><label>Patentes</label><input name="patentes" maxlength="60" style="text-transform:uppercase" value="${esc(p.patentes || '')}"></div>
      <div class="field"><label>Teléfono de contacto</label><input name="tel" inputmode="tel" maxlength="20" value="${esc(p.tel || '')}"></div></div>
    <div class="field"><label>Días</label><div class="seg dias-sel">${[1,2,3,4,5,6,0].map(d => `<label><input type="checkbox" name="dias" value="${d}" ${aLista(p.dias).map(Number).includes(d) ? 'checked' : ''}><span>${DIAS[d]}</span></label>`).join('')}</div></div>
    <div class="grid2"><div class="field"><label>Desde</label><input type="time" name="desde" value="${esc(p.desde || '07:00')}"></div><div class="field"><label>Hasta</label><input type="time" name="hasta" value="${esc(p.hasta || '18:00')}"></div></div>
    <div class="grid2"><div class="field"><label>ART vigente hasta</label><input type="date" name="artVence" required value="${esc(p.artVence || '')}"></div>
      <div class="field"><label>Seguro vigente hasta</label><input type="date" name="seguroVence" value="${esc(p.seguroVence || '')}"></div></div>
    <button class="btn btn-pri btn-block">${I('check')}Guardar</button></form>`);
};
F['hprov'] = (d, form) => {
  if (!soloHotel()) return;
  const id = form.dataset.id;
  Store.cambiar(s => { s.hotelProv = aLista(s.hotelProv);
    const datos = { empresa:d.empresa.trim(), rubro:(d.rubro || '').trim(), personal:(d.personal || '').trim(), patentes:String(d.patentes || '').toUpperCase().trim(), tel:(d.tel || '').trim(),
      dias:[].concat(d.dias || []).map(Number), desde:d.desde || '', hasta:d.hasta || '', artVence:d.artVence || '', seguroVence:d.seguroVence || '' };
    const x = id && s.hotelProv.find(p => p.id === id);
    if (x){ Object.assign(x, datos); x.revisado = false; } else s.hotelProv.push({ id:'hp' + uid(), codigo:codigoLargo('H'), estado:'activo', at:Date.now(), ...datos });
    auditar(s, id ? 'El hotel editó un proveedor' : 'El hotel cargó un proveedor', datos.empresa); });
  cerrarHoja(); toast('Proveedor guardado', 'box');
};
A['hprov-qr'] = el => { const p = hotelProvs().find(x => x.id === el.dataset.id); if (p) hojaQRHotel('QR del proveedor', p.empresa, p.codigo, 'Se lo mandás al proveedor: lo muestra en la garita. Vale solo con la ART al día, los días y en el horario cargados.'); };
A['hprov-revisar'] = el => { if (!esAdmin()) return; Store.cambiar(s => { const p = aLista(s.hotelProv).find(x => x.id === el.dataset.id); if (p){ p.revisado = !p.revisado; auditar(s, p.revisado ? 'Revisó un proveedor del hotel' : 'Quitó la revisión de un proveedor del hotel', p.empresa); } }); };
A['hprov-suspender'] = el => { if (!esAdmin()) return; Store.cambiar(s => { const p = aLista(s.hotelProv).find(x => x.id === el.dataset.id); if (!p) return; p.estado = p.estado === 'suspendido' ? 'activo' : 'suspendido';
  auditar(s, p.estado === 'suspendido' ? 'Suspendió un proveedor del hotel' : 'Rehabilitó un proveedor del hotel', p.empresa);
  const h = hotelId(); if (h) notificar(s, { para:[h], titulo: p.estado === 'suspendido' ? `La Administración suspendió a ${p.empresa}` : `${p.empresa} está habilitado de nuevo`, icon:'box', color: p.estado === 'suspendido' ? 'danger' : 'ok', link:'hotel-proveedores' }); }); };
A['hprov-mov'] = el => {
  if (!soloGarita()) return;
  const p = hotelProvs().find(x => x.id === el.dataset.id); if (!p) return;
  const tipo = el.dataset.v === 'in' ? 'in' : 'out';
  Store.cambiar(s => { s.hotelMovs = aLista(s.hotelMovs); s.hotelMovs.unshift({ id:'hm' + uid(), provId:p.id, tipo, at:Date.now(), por:yo().id });
    s.bitacora.unshift({ id:uid(), autor:yo().id, tipo:'acceso', texto:`${tipo === 'in' ? 'Ingreso' : 'Egreso'}: proveedor del hotel ${p.empresa}`, at:Date.now() }); });
  cerrarHoja(); toast(`${p.empresa}: ${tipo === 'in' ? 'ingreso' : 'salida'} registrada`, tipo === 'in' ? 'login' : 'logout');
};

/* ---------- lo que la garita lee: el QR H- de una van o un proveedor ---------- */
function hotelCodigo(codigo){
  const v = hotelVans().find(x => String(x.codigo).toUpperCase() === codigo);
  if (v){ const e = estadoVan(v), prox = viajesDelDia().find(x => x.estado === 'programado' && (!x.vanId || x.vanId === v.id));
    hoja('Van del hotel', `${aviso('ok', 'car', `${esc(v.nombre)} · ${esc(v.patente)}`, `${HOTEL_NOMBRE}${v.chofer ? ' · chofer ' + esc(v.chofer) : ''}`)}
      ${prox ? `<div class="card plana small">${I('clock')} Traslado previsto: ${esc(prox.sale || '—')} h · ${esc(textoViaje(prox))}</div>` : ''}
      <button class="btn btn-block btn-grande ${e.adentro ? 'btn-sec' : 'btn-ok'}" data-a="hvan-mov" data-id="${esc(v.id)}" data-v="${e.adentro ? 'out' : 'in'}">${I(e.adentro ? 'logout' : 'login')}Registrar ${e.adentro ? 'la salida' : 'la entrada'}</button>`);
    return true; }
  const p = hotelProvs().find(x => String(x.codigo).toUpperCase() === codigo);
  if (p){ const [c, t] = estadoProv(p), hoy = new Date(), dias = aLista(p.dias).map(Number), m = ahoraMin();
    const hoyNo = dias.length && !dias.includes(hoy.getDay()), fuera = p.desde && p.hasta && (m < minutosDe(p.desde) - 30 || m > minutosDe(p.hasta) + 30);
    hoja('Proveedor del hotel', `${c === 'danger' ? aviso('danger', 'x', 'NO HABILITADO', esc(t)) : hoyNo ? aviso('warn', 'calendar', 'Hoy no es su día', aLista(p.dias).map(d => DIAS[d]).join(', ')) : fuera ? aviso('warn', 'clock', 'Fuera de su horario', `${esc(p.desde)} a ${esc(p.hasta)} h`) : aviso(c, c === 'ok' ? 'check' : 'alert', 'Habilitado', esc(t))}
      <div class="card"><b style="font-size:17px">${esc(p.empresa)}</b><div class="muted small">${esc(p.rubro || '')} → ${HOTEL_NOMBRE}${p.patentes ? ' · ' + esc(p.patentes) : ''}</div>${p.personal ? `<p class="small" style="margin:8px 0 0;white-space:pre-wrap"><b>Personal:</b>\n${esc(p.personal)}</p>` : ''}</div>
      ${c !== 'danger' ? `<div class="btns"><button class="btn btn-ok grow" data-a="hprov-mov" data-id="${esc(p.id)}" data-v="in">${I('login')}Registrar ingreso</button><button class="btn btn-sec grow" data-a="hprov-mov" data-id="${esc(p.id)}" data-v="out">${I('logout')}Registrar salida</button></div>` : ''}`);
    return true; }
  hoja('Código desconocido', aviso('danger', 'x', 'Ese QR del hotel no existe', 'Puede ser de una van o un proveedor dado de baja. Consultá con la recepción del hotel.'));
  return true;
}
/* Una patente escrita en la garita que es de una van, de un proveedor o de
   un huésped del hotel. */
function hotelValidar(pat){
  if (!pat || pat.length < 6 || !esGuardia()) return false;
  const v = hotelVans().find(x => normPatente(x.patente) === pat);
  if (v) return hotelCodigo(String(v.codigo).toUpperCase());
  const p = hotelProvs().find(x => normPatente(x.patentes).includes(pat));
  if (p) return hotelCodigo(String(p.codigo).toUpperCase());
  const h = hotelHuespedes().find(x => normPatente(x.patente) === pat && x.desde <= hoyISO() && x.hasta >= hoyISO());
  if (h){ hoja('Huésped del hotel', `${aviso('ok', 'users', 'Huésped del ' + HOTEL_NOMBRE, `${fechaCorta(h.desde)} → ${fechaCorta(h.hasta)}`)}<div class="card"><b style="font-size:17px">${esc(h.nombre)}</b><div class="muted small">${esc(h.patente)} · ${plural(+h.pax || 1, 'persona')}</div></div>
      ${!h.ingreso ? `<button class="btn btn-ok btn-block btn-grande" data-a="hhuesped-ingreso" data-id="${esc(h.id)}">${I('login')}Registrar el ingreso</button>` : `<div class="card plana small">${I('check')} Ingresó a las ${hora(h.ingreso)} h</div>`}`); return true; }
  return false;
}

/* =========================================================
   PROMOCIONES: las cargan el hotel o la Administración
   Pedido de Claudio (27-09): antes el hotel las proponía y la
   Administración las publicaba. Ahora los dos agregan, editan y borran
   directo en barrio/promos, que es lo que muestra la tira del hotel en la
   app de todos. Resguardos: cada cambio queda en la auditoría con quién
   lo hizo y le avisa al otro (si cambia el hotel, a la Administración; si
   cambia la Administración, al hotel); el enlace solo puede ser http(s).
   Las propuestas del circuito viejo que quedaron sin resolver (hotelPromos
   en 'propuesta' o 'baja') se muestran aparte para publicarlas o
   descartarlas.
   ========================================================= */
const puedePromos = () => esHotel() || esAdmin();
const promosCargadas = () => aLista(Store.s.promos).filter(p => p && p.id);
const promosViejasPend = () => aLista(Store.s.hotelPromos).filter(p => p && (p.estado === 'propuesta' || p.estado === 'baja'));
/* Un enlace que se abre desde la app de todos: nada de "javascript:" ni
   otros esquemas, solo páginas web. */
const enlaceWeb = u => /^https?:\/\/[^\s"'<>]+$/i.test(String(u || '').trim()) ? String(u).trim() : '';
const estadoPromo = p => { const hoy = hoyISO();
  if (p.hasta && p.hasta < hoy) return ['', 'Vencida · no se ve'];
  if (p.desde && p.desde > hoy) return ['warn', 'Sale el ' + fechaCorta(p.desde)];
  return ['ok', 'En la tira']; };
/* El descuento como en la tira (o una estrella), para reconocerla de un vistazo. */
const marcaPromo = p => p.descuento ? `<span class="promo-desc">${esc(p.descuento)}</span>` : `<span class="ic ic-wood">${I('star')}</span>`;
const quienPromo = x => x === 'hotel' ? 'el hotel' : 'la Administración';
const autorPromo = p => p.autor || (p.hotel ? 'hotel' : 'admin');
/* Deja rastro y le avisa al otro lado. que = 'Publicó' | 'Cambió' | 'Sacó'. */
function avisarPromo(s, que, p){
  auditar(s, `${que} una promoción del hotel`, p.titulo);
  const aviso = { titulo:`${esHotel() ? 'El hotel' : 'La Administración'} ${que.toLowerCase()} una promoción`, texto:p.titulo, icon:'sparkle', color:'wood', link:'hotel-promos' };
  if (esHotel()) notificar(s, { para:'rol:admin', ...aviso });
  else { const h = hotelId(); if (h) notificar(s, { para:[h], ...aviso }); }
}
R['hotel-promos'] = {
  titulo:'Promociones del hotel', icon:'sparkle', color:'wood', sub:'Las cargan el hotel o la Administración · salen en la tira de todas las apps',
  render(){
    if (!puedePromos()) return vacio('lock', 'Las promociones las manejan el hotel y la Administración.');
    const peso = p => ({ ok:0, warn:1 })[estadoPromo(p)[0]] ?? 2;
    const ps = promosCargadas().sort((a, b) => peso(a) - peso(b) || String(b.desde || '').localeCompare(String(a.desde || '')));
    const viejas = promosViejasPend(), enTira = ps.filter(p => estadoPromo(p)[0] === 'ok').length;
    return `${superficie({ a:'hpromo-editar', icon:'plus', t:'Nueva promoción', s:'Sale enseguida en la tira del hotel, en la app de todos', cls:'acento' })}
      ${viejas.length ? sec(`Propuestas que quedaron pendientes (${viejas.length})`) + viejas.map(p => `<div class="card"><div class="row" style="gap:10px;align-items:flex-start">${marcaPromo(p)}
          <div class="grow" style="min-width:0"><b>${esc(p.titulo)}</b><div class="muted small">${esc(p.detalle || '')}${p.estado === 'baja' ? ' · el hotel había pedido sacarla' : ''}</div></div></div>
          <div class="btns" style="margin-top:8px">${p.estado === 'baja' ? `<button class="btn btn-xs btn-pri" data-a="hpromo-retirar" data-id="${esc(p.id)}">${I('trash')}Sacarla de la tira</button>` : `<button class="btn btn-xs btn-ok" data-a="hpromo-aprobar" data-id="${esc(p.id)}">${I('check')}Publicarla</button>`}
            <button class="btn btn-xs btn-sec" data-a="hpromo-descartar" data-id="${esc(p.id)}">Descartar</button></div></div>`).join('') : ''}
      ${sec(`En la tira ahora (${enTira})`)}
      ${ps.length ? ps.map(p => { const e = estadoPromo(p);
        return `<div class="card"><div class="row" style="gap:10px;align-items:flex-start">${marcaPromo(p)}
          <div class="grow" style="min-width:0"><b>${esc(p.titulo)}</b>
          <div class="muted small">${esc(p.detalle || '')}${p.desde || p.hasta ? `${p.detalle ? ' · ' : ''}${p.desde ? 'desde ' + fechaCorta(p.desde) : ''}${p.hasta ? ' hasta ' + fechaCorta(p.hasta) : ''}` : ''}</div>
          <div class="muted tiny" style="margin-top:6px"><span class="pill ${e[0] ? 'p-' + e[0] : ''}">${e[1]}</span> Cargada por ${quienPromo(autorPromo(p))}${p.editadoAt ? ` · último cambio: ${quienPromo(p.editadoPor)}, ${hace(p.editadoAt)}` : ''}</div></div></div>
          <div class="btns" style="margin-top:8px"><button class="btn btn-xs btn-sec" data-a="hpromo-editar" data-id="${esc(p.id)}">${I('edit')}Editar</button>
            <button class="btn btn-xs btn-danger-soft" data-a="hpromo-borrar" data-id="${esc(p.id)}">${I('trash')}Borrar</button></div></div>`; }).join('')
        : vacio('sparkle', 'Todavía no hay promociones cargadas. Mientras tanto, la tira muestra ejemplos marcados como tales.')}
      <p class="muted tiny" style="margin-top:12px">${I('info')} Lo que cargan el hotel o la Administración sale en la tira del hotel, en la app de todos los vecinos. Cada cambio queda registrado con quién lo hizo y al otro le llega el aviso. Las vencidas dejan de verse solas.</p>`;
  },
};
A['hpromo-editar'] = el => {
  if (!puedePromos()) return;
  const p = promosCargadas().find(x => x.id === el?.dataset?.id) || {};
  hoja(p.id ? 'Editar promoción' : 'Nueva promoción', `<form data-f="hpromo" data-id="${esc(p.id || '')}">
    <div class="field"><label>Título</label><input name="titulo" required maxlength="60" value="${esc(p.titulo || '')}" placeholder="Cena de los viernes"></div>
    <div class="field"><label>Detalle</label><input name="detalle" maxlength="120" value="${esc(p.detalle || '')}"></div>
    <div class="grid3"><div class="field"><label>Descuento</label><input name="descuento" maxlength="12" value="${esc(p.descuento || '')}" placeholder="20 %"></div>
      <div class="field"><label>Desde</label><input type="date" name="desde" value="${esc(p.desde || hoyISO())}"></div>
      <div class="field"><label>Hasta</label><input type="date" name="hasta" value="${esc(p.hasta || '')}"></div></div>
    <div class="field"><label>Enlace para reservar (opcional)</label><input name="url" type="url" maxlength="200" value="${esc(p.url || '')}" placeholder="https://…"></div>
    <p class="muted tiny" style="margin:0 0 10px">${p.id ? 'Los cambios se ven enseguida en la app de todos.' : 'Sale enseguida en la tira del hotel, en la app de todos.'} ${esHotel() ? 'La Administración recibe el aviso.' : 'El hotel recibe el aviso.'}</p>
    <button class="btn btn-pri btn-block">${I('check')}${p.id ? 'Guardar los cambios' : 'Publicar en la tira'}</button></form>`);
};
F['hpromo'] = (d, form) => {
  if (!puedePromos()) return;
  if (d.desde && d.hasta && d.hasta < d.desde){ toast('"Hasta" no puede ser antes de "Desde"', 'calendar'); return; }
  const url = (d.url || '').trim();
  if (url && !enlaceWeb(url)){ toast('El enlace tiene que empezar con https://', 'link'); return; }
  const id = form.dataset.id, quien = esHotel() ? 'hotel' : 'admin';
  Store.cambiar(s => { s.promos = aLista(s.promos);
    const datos = { titulo:d.titulo.trim().slice(0, 60), detalle:(d.detalle || '').trim().slice(0, 120), descuento:(d.descuento || '').trim().slice(0, 12), desde:d.desde || '', hasta:d.hasta || '', url, hotel:true };
    const x = id && s.promos.find(p => p.id === id);
    if (x){ Object.assign(x, datos, { editadoAt:Date.now(), editadoPor:quien }); avisarPromo(s, 'Cambió', x); }
    else { const n = { id:'hp' + uid(), ...datos, autor:quien, createdAt:Date.now() }; s.promos.unshift(n); avisarPromo(s, 'Publicó', n); } });
  cerrarHoja(); toast(id ? 'Promoción actualizada' : 'Publicada en la tira del hotel', 'check');
};
A['hpromo-borrar'] = async el => {
  if (!puedePromos()) return;
  const p = promosCargadas().find(x => x.id === el.dataset.id); if (!p) return;
  if (!await confirmar('Borrar la promoción', `"${esc(p.titulo)}" deja de verse en la app de todos.`, { si:'Borrar', peligro:true })) return;
  Store.cambiar(s => { s.promos = aLista(s.promos).filter(x => x.id !== p.id);
    aLista(s.hotelPromos).forEach(v => { if (v && v.promoId === p.id) v.estado = 'retirada'; });
    avisarPromo(s, 'Sacó', p); });
  toast('Promoción borrada', 'trash');
};
/* Las que quedaron del circuito viejo. */
A['hpromo-aprobar'] = el => {
  if (!puedePromos()) return;
  Store.cambiar(s => { const p = aLista(s.hotelPromos).find(x => x.id === el.dataset.id); if (!p) return;
    const promoId = 'hp-' + p.id; s.promos = aLista(s.promos).filter(x => x.id !== promoId);
    const n = { id:promoId, titulo:p.titulo, detalle:p.detalle || '', descuento:p.descuento || '', desde:p.desde || '', hasta:p.hasta || '', url:enlaceWeb(p.url), hotel:true, autor:'hotel', createdAt:Date.now() };
    s.promos.unshift(n); p.estado = 'publicada'; p.promoId = promoId; p.motivo = '';
    avisarPromo(s, 'Publicó', n); });
  toast('Publicada en la tira del hotel', 'check');
};
A['hpromo-retirar'] = el => { if (!puedePromos()) return; Store.cambiar(s => { const p = aLista(s.hotelPromos).find(x => x.id === el.dataset.id); if (!p) return;
  s.promos = aLista(s.promos).filter(x => x.id !== p.promoId); p.estado = 'retirada'; avisarPromo(s, 'Sacó', p); }); toast('Promoción retirada', 'check'); };
A['hpromo-descartar'] = el => { if (!puedePromos()) return; Store.cambiar(s => { const p = aLista(s.hotelPromos).find(x => x.id === el.dataset.id); if (p) p.estado = 'descartada'; }); toast('Descartada', 'check'); };

/* =========================================================
   EMERGENCIAS DEL HOTEL, SU DEA Y LA FICHA
   ========================================================= */
R['hotel-emergencias'] = {
  titulo:'Emergencias', icon:'siren', color:'danger', sub:'Llamar, avisar a la garita, DEA y primeros auxilios',
  render(){
    const info = hotelInfo(), cfg = Store.s.config;
    return `<div class="btns" style="margin-bottom:12px"><a class="btn btn-danger" href="tel:911">${I('phone')}911</a><a class="btn btn-danger-soft" href="tel:107">107 Ambulancia</a><a class="btn btn-danger-soft" href="tel:100">100 Bomberos</a><a class="btn btn-danger-soft" href="tel:101">101 Policía</a></div>
      ${telGarita() || telAdmin() ? `<div class="btns" style="margin-bottom:12px">${telGarita() ? `<a class="btn btn-pri grow" href="${telLink(telGarita())}">${I('gate')}Garita · ${esc(telGarita())}</a>` : ''}${telAdmin() ? `<a class="btn btn-sec grow" href="${telLink(telAdmin())}">${I('sliders')}Administración · ${esc(telAdmin())}</a>` : ''}</div>` : ''}
      ${esHotel() ? `<button class="btn btn-danger btn-block btn-grande" data-a="hotel-urgente">${I('siren')}Avisar a la garita ya</button>` : ''}
      ${sec('El plan de emergencias del hotel')}
      <div class="card lista">
        <div class="it"><div class="txt"><b>DEA (desfibrilador) del hotel</b><span>${info.dea ? esc(info.deaLugar || 'Sí, en el hotel') : 'No declarado'}${cfg.deaHotel ? ' · publicado para los vecinos' : ''}</span></div></div>
        <div class="it"><div class="txt"><b>Personal con primeros auxilios</b><span>${esc(info.auxilios || 'Sin cargar')}</span></div></div>
        <div class="it"><div class="txt"><b>Punto de encuentro</b><span>${esc(info.puntoEncuentro || 'Sin cargar')}</span></div></div>
        <div class="it"><div class="txt"><b>Teléfono de la recepción</b><span>${esc(info.telRecepcion || 'Sin cargar')}</span></div></div></div>
      ${esHotel() ? `<button class="btn btn-sec btn-block" data-a="abrir" data-v="hotel-ficha">${I('edit')}Completar en la ficha del hotel</button>` : ''}
      ${esAdmin() && info.dea ? `<button class="btn btn-pri btn-block btn-envuelve" style="margin-top:8px" data-a="hotel-dea-publicar">${I('heart')}${cfg.deaHotel ? 'Actualizar' : 'Publicar'} el DEA para los vecinos</button>` : ''}
      <p class="muted tiny" style="margin-top:12px">${I('info')} Si hay una emergencia médica en el barrio, la garita puede pedirle al hotel su DEA o su personal con primeros auxilios: al hotel le llega el aviso con el lote, nada más. El hotel no ve los SOS de los vecinos.</p>`;
  },
};
/* El botón rojo del encabezado del hotel: una urgencia en el hotel. */
A['hotel-urgente'] = () => {
  if (!esHotel()) return;
  hoja('Urgencia en el hotel', `<div class="btns" style="margin-bottom:12px"><a class="btn btn-danger grow" href="tel:911">${I('phone')}911</a><a class="btn btn-danger-soft grow" href="tel:107">107</a><a class="btn btn-danger-soft grow" href="tel:100">100</a>${telGarita() ? `<a class="btn btn-pri grow" href="${telLink(telGarita())}">${I('gate')}Garita</a>` : ''}</div>
    <form data-f="hotel-urgente"><div class="seg" style="margin-bottom:10px">${[['medica', 'Médica'], ['seguridad', 'Seguridad'], ['incendio', 'Incendio'], ['otra', 'Otra']].map(([k, t], i) => `<label><input type="radio" name="tipo" value="${k}" ${i === 0 ? 'checked' : ''}><span>${t}</span></label>`).join('')}</div>
      <div class="field"><label>Qué pasa y dónde (opcional)</label><input name="texto" maxlength="160" placeholder="Huésped descompuesto en el lobby"></div>
      <button class="btn btn-danger btn-block btn-grande">${I('siren')}Avisar a la garita ya</button>
      <p class="muted tiny" style="margin:8px 0 0">A la garita le suena al instante y le queda en su chat con el hotel. Llamá también al número de emergencia que corresponda.</p></form>`);
};
F['hotel-urgente'] = d => {
  if (!esHotel()) return;
  const t = { medica:'emergencia médica', seguridad:'seguridad', incendio:'incendio', otra:'urgencia' }[d.tipo] || 'urgencia', u = yo();
  const texto = `URGENCIA EN EL HOTEL (${t})${d.texto ? ': ' + d.texto.trim() : ''}`;
  Store.cambiar(s => {
    let h = s.privados.find(z => z.userId === u.id && (z.con || 'admin') === 'guardia');
    if (!h){ h = { id:uid(), userId:u.id, con:'guardia', msgs:[] }; s.privados.push(h); }
    h.msgs = aLista(h.msgs); h.msgs.push({ id:uid(), from:'vecino', text:texto, createdAt:Date.now() });
    notificar(s, { para:'rol:guardia', titulo:`Urgencia en el ${HOTEL_NOMBRE}`, texto:`${t}${d.texto ? ' · ' + d.texto.trim() : ''}`, icon:'siren', color:'danger', link:'privado:guardia|' + u.id, urgente:true });
  });
  cerrarHoja(); toast('La garita ya fue avisada', 'siren');
};
/* La garita, ante un SOS médico, le pide ayuda al hotel. */
A['sos-pedir-hotel'] = el => {
  if (!soloGarita()) return;
  const x = aLista(Store.s.sos).find(z => z.id === el.dataset.id), h = hotelId(); if (!x || !h) return;
  const v = usuario(x.userId) || {};
  Store.cambiar(s => { notificar(s, { para:[h], titulo:'La garita pide ayuda al hotel', texto:`Emergencia en ${v.casa || 'el barrio'}: si pueden, acerquen el DEA o personal con primeros auxilios.`, icon:'heart', color:'danger', link:'hotel-emergencias', urgente:true });
    s.bitacora.unshift({ id:uid(), autor:yo().id, tipo:'novedad', texto:`Se pidió ayuda al hotel (DEA / primeros auxilios) para ${v.casa || 'un SOS'}`, at:Date.now() }); });
  toast('El hotel ya recibió el pedido', 'heart');
};
A['hotel-dea-publicar'] = () => {
  if (!esAdmin()) return;
  const info = hotelInfo();
  Store.cambiar(s => { s.config.deaHotel = { lugar:info.deaLugar || 'Recepción del hotel', tel:info.telRecepcion || '', at:Date.now() }; auditar(s, 'Publicó el DEA del hotel en Emergencias', info.deaLugar || ''); });
  toast('Los vecinos ya ven el DEA del hotel en Emergencias', 'heart');
};
R['hotel-ficha'] = {
  titulo:'Ficha del hotel', icon:'sliders', color:'sky', sub:'Responsable, tiempos de traslado y emergencias',
  render(){
    const i = hotelInfo(), ro = !esHotel() ? 'disabled' : '';
    const num = (k, t, ayuda) => `<div class="field"><label>${t}</label><input type="number" name="${k}" min="0" max="600" value="${esc(i[k])}" ${ro}>${ayuda ? `<div class="ayuda">${ayuda}</div>` : ''}</div>`;
    return `<form data-f="hotel-ficha" class="card">
      <div class="grid2"><div class="field"><label>Responsable ante el barrio</label><input name="responsable" maxlength="60" value="${esc(i.responsable)}" ${ro} placeholder="Gerente o jefe de recepción"></div>
        <div class="field"><label>Teléfono de la recepción</label><input name="telRecepcion" inputmode="tel" maxlength="20" value="${esc(i.telRecepcion)}" ${ro}></div></div>
      <div class="lbl" style="margin:8px 0">Tiempos para calcular la salida de las vans</div>
      <div class="grid3">${num('trayAero', 'Al aeropuerto (min)')}${num('checkin', 'Check-in antes del vuelo (min)')}${num('esperaArribo', 'Espera del equipaje al llegar (min)')}</div>
      <div class="grid3">${num('trayPuerto', 'Al puerto (min)')}${num('embarque', 'Embarque antes del zarpe (min)')}${num('desembarque', 'Desembarque después del arribo (min)')}</div>
      <div class="grid2">${num('avisoAntes', 'Recordar antes de cada salida (min)')}
        <label class="check" style="align-self:end"><input type="checkbox" name="autoTraslados" ${i.autoTraslados ? 'checked' : ''} ${ro}><span>Armar los traslados solos con los vuelos de los huéspedes</span></label></div>
      <div class="lbl" style="margin:8px 0">Emergencias</div>
      <div class="grid2"><label class="check"><input type="checkbox" name="dea" ${i.dea ? 'checked' : ''} ${ro}><span>El hotel tiene DEA (desfibrilador)</span></label>
        <div class="field"><label>Dónde está el DEA</label><input name="deaLugar" maxlength="80" value="${esc(i.deaLugar)}" ${ro} placeholder="Recepción, detrás del mostrador"></div></div>
      <div class="field"><label>Personal con primeros auxilios (nombre y turno)</label><input name="auxilios" maxlength="200" value="${esc(i.auxilios)}" ${ro}></div>
      <div class="field"><label>Punto de encuentro en una evacuación</label><input name="puntoEncuentro" maxlength="100" value="${esc(i.puntoEncuentro)}" ${ro}></div>
      ${esHotel() ? `<button class="btn btn-pri btn-block">${I('check')}Guardar la ficha</button>` : '<p class="muted small" style="margin:0">La completa el hotel.</p>'}</form>`;
  },
};
F['hotel-ficha'] = d => {
  if (!soloHotel()) return;
  const n = k => Math.max(0, Math.min(600, +d[k] || 0));
  Store.cambiar(s => guardarInfo(s, { responsable:(d.responsable || '').trim(), telRecepcion:(d.telRecepcion || '').trim(), trayAero:n('trayAero'), checkin:n('checkin'), esperaArribo:n('esperaArribo'),
    trayPuerto:n('trayPuerto'), embarque:n('embarque'), desembarque:n('desembarque'), avisoAntes:n('avisoAntes') || 30, autoTraslados:!!d.autoTraslados,
    dea:!!d.dea, deaLugar:(d.deaLugar || '').trim(), auxilios:(d.auxilios || '').trim(), puntoEncuentro:(d.puntoEncuentro || '').trim() }));
  toast('Ficha guardada', 'check');
};

/* =========================================================
   LA HOJA DEL DÍA PARA EL MOSTRADOR (imprimible)
   ========================================================= */
A['hotel-hoja-dia'] = () => {
  const hoy = hoyISO(), d = Vuelos.d, c = Clima.d?.c;
  const vuelos = (l, t) => aLista(l).map(v => `<tr><td>${esc(v.real || v.hora)}</td><td>${esc(v.nro)}</td><td>${esc(v.lugar)}</td><td>${esc(v.estado || '')}</td>${esHotel() ? `<td>${esc(salidaVuelo({ ...v, tipo:t }))}</td>` : ''}</tr>`).join('');
  const cr = Cruceros.lista().filter(x => x.fecha === hoy || (x.llega.slice(0, 10) <= hoy && x.sale.slice(0, 10) >= hoy));
  const ev = aLista(Store.s.eventosCiudad).filter(e => e && e.fecha >= hoy && e.fecha <= sumarDias(hoy, 3));
  imprimir('Hoja del día', `<p><b>${HOTEL_NOMBRE}</b> · ${fechaLarga(hoy)}${c ? ` · ${Math.round(c.temperature_2m)} °C, ${Clima.cod(c.weather_code)[0].toLowerCase()}` : ''} · sol ${Clima.sol().sale} a ${Clima.sol().pone}</p>
    <h2>Traslados de hoy</h2>${viajesDelDia(hoy).length ? `<table><tr><th>Sale</th><th>Traslado</th><th>Pax</th><th>Van</th></tr>${viajesDelDia(hoy).map(x => `<tr><td>${esc(x.sale || '—')}</td><td>${esc(textoViaje(x))}</td><td>${+x.pax || 0}</td><td>${esc((hotelVans().find(v => v.id === x.vanId) || {}).nombre || '—')}</td></tr>`).join('')}</table>` : '<p>Sin traslados.</p>'}
    <h2>Partidas del aeropuerto</h2>${d ? `<table><tr><th>Hora</th><th>Vuelo</th><th>Destino</th><th>Estado</th>${esHotel() ? '<th>Van</th>' : ''}</tr>${vuelos(d.dep, 'D')}</table>` : '<p>Sin datos del tablero.</p>'}
    <h2>Arribos al aeropuerto</h2>${d ? `<table><tr><th>Hora</th><th>Vuelo</th><th>Origen</th><th>Estado</th>${esHotel() ? '<th>Van</th>' : ''}</tr>${vuelos(d.arr, 'A')}</table>` : ''}
    <h2>Cruceros</h2>${cr.length ? `<table><tr><th>Barco</th><th>Llega</th><th>Sale</th><th>Pasajeros</th></tr>${cr.map(x => `<tr><td>${esc(conMayusculasBarco(x.barco))}</td><td>${horaDe(x.llega)}</td><td>${horaDe(x.sale)}</td><td>${x.pasajeros || '—'}</td></tr>`).join('')}</table>` : '<p>No recalan cruceros hoy.</p>'}
    <h2>Eventos en la ciudad</h2>${ev.length ? `<ul>${ev.map(e => `<li><b>${esc(e.titulo)}</b> · ${fechaCorta(e.fecha)}${e.hora ? ' ' + esc(e.hora) + ' h' : ''}${e.lugar ? ' · ' + esc(e.lugar) : ''}</li>`).join('')}</ul>` : '<p>Sin eventos cargados.</p>'}`,
    { pie:'Datos del tablero del aeropuerto, del cronograma oficial de cruceros y de la agenda de la app. Confirmar horarios antes de salir.' });
};

/* =========================================================
   CONVENIO DE CONVIVENCIA Y SERVICIOS (MODELO)
   ========================================================= */
const CONVENIO_HOTEL = [
  ['Partes', 'Entre la Asociación Civil Barrio Bahía Cauquén (CUIT 30-71010005-1), en adelante "el Barrio", representada por quien designe su órgano de administración, y el titular de las unidades funcionales 000 a 005 donde funciona el Hotel Los Cauquenes, en adelante "el Hotel", se celebra el presente convenio, sujeto a su aprobación por la asamblea del Barrio.'],
  ['Objeto', 'Ordenar la convivencia entre la actividad hotelera y la vida del barrio: el ingreso de huéspedes, proveedores, personal y vehículos del Hotel; los eventos; el uso de las calles y espacios comunes; la seguridad y las emergencias; y el uso de la aplicación del barrio.'],
  ['Derechos y deberes como propietario', 'El Hotel mantiene los derechos y deberes de cualquier propietario según su coeficiente (voto y expensas) y cumple el reglamento interno y las normas de convivencia. Nada de este convenio modifica el régimen de expensas ni de votación.'],
  ['Ingreso de huéspedes', 'El Hotel informa en la aplicación, con la anticipación posible, los huéspedes que ingresan por la guardia (nombre, fechas y, si corresponde, patente). Los huéspedes circulan solo por el trayecto al Hotel y no usan los espacios comunes del Barrio salvo acuerdo expreso (arts. 2082 y 2083 del Código Civil y Comercial).'],
  ['Vans y proveedores', 'Cada vehículo y cada proveedor del Hotel se registra en la aplicación con su QR. Los proveedores ingresan solo con ART y seguro vigentes, en los días y horarios declarados. La guardia registra cada ingreso y egreso.'],
  ['Eventos', 'El Hotel anuncia sus eventos con al menos 72 horas de anticipación, indicando horario, cantidad de invitados, ingreso y estacionamiento. La música y los ruidos respetan el horario que fije el reglamento. El estacionamiento de invitados es dentro del predio del Hotel; las calles del Barrio no se usan como estacionamiento.'],
  ['Seguridad y emergencias', 'El Hotel informa si cuenta con DEA y personal con primeros auxilios, y colabora ante emergencias del Barrio a pedido de la guardia. El Barrio puede publicar la ubicación del DEA del Hotel para los vecinos.'],
  ['Protección de datos personales', 'Cada parte es responsable de los datos que trata (Ley 25.326). El Hotel comparte con la guardia solo los datos mínimos para el ingreso y los traslados, informa de ello a sus huéspedes, y esos datos se eliminan automáticamente al día siguiente del egreso. El Hotel no accede al padrón, a las fichas de los vecinos, al chat, a la bitácora ni a los datos de los SOS.'],
  ['Uso de la aplicación', 'El Hotel usa una única cuenta institucional, bajo la responsabilidad de la persona que designe, y se obliga a darla de baja o cambiar su contraseña cuando esa persona deje el cargo. La Administración puede suspender la cuenta ante un uso indebido.'],
  ['Aporte por uso diferencial', 'Si el estatuto lo permite y la asamblea lo aprueba, el Hotel realiza un aporte mensual por el mayor uso de la guardia y de las calles del Barrio, cuyo monto y actualización se fijan en anexo.'],
  ['Vigencia y controversias', 'El convenio rige por un año desde su aprobación y se renueva automáticamente salvo aviso con 60 días de anticipación. Las partes procurarán resolver sus diferencias de buena fe; subsidiariamente, se someten a los tribunales ordinarios de Ushuaia.'],
];
R['hotel-convenio'] = {
  titulo:'Convenio con el barrio', icon:'clipboard', color:'wood', sub:'Modelo de convivencia y servicios · a revisar por un abogado',
  render(){
    return `${aviso('warn', 'alert', 'Modelo, no un documento firmado', 'Es un punto de partida para que lo revise un abogado matriculado y lo apruebe la asamblea. Hasta que esté firmado, la app funciona igual, pero conviene que las reglas queden por escrito.')}
      <div class="card legal-texto">${CONVENIO_HOTEL.map(([t, x], i) => `<h4 class="man-h">${i + 1}. ${esc(t)}</h4><p class="man-p">${esc(x)}</p>`).join('')}
        <div class="doc-final"><span class="muted small">${I('check')} Fin del modelo</span></div>
        <div class="btns" style="margin-top:10px"><button class="btn btn-pri grow" data-a="hotel-convenio-pdf">${I('download')}Descargar o imprimir</button></div></div>`;
  },
};
A['hotel-convenio-pdf'] = () => imprimir('Convenio de convivencia y servicios', `<p><b>MODELO</b> · Convenio de convivencia y servicios entre la Asociación Civil Barrio Bahía Cauquén y el ${HOTEL_NOMBRE}</p>
  ${CONVENIO_HOTEL.map(([t, x], i) => `<h2>${i + 1}. ${esc(t)}</h2><p>${esc(x)}</p>`).join('')}
  <div class="firma"><div>Por el Barrio</div><div>Por el Hotel</div></div>`, { pie:'Modelo a revisar por un abogado matriculado y a aprobar por la asamblea del Barrio.' });

/* =========================================================
   LA CUENTA DEL HOTEL (Administración)
   Para probar y poner en marcha: se convierte CUALQUIER cuenta en la del
   hotel (pedido de Claudio). Después el hotel le cambia el correo y la
   contraseña desde Tu cuenta. Hay una sola: al convertir otra, la anterior
   vuelve a vecino pendiente.
   ========================================================= */
R['hotel-cuenta'] = {
  titulo:'Cuenta del hotel', icon:'key', color:'accent', sub:'Una sola cuenta institucional, para la recepción',
  render(q){
    if (!esAdmin()) return vacio('lock', 'Solo para la Administración.');
    const h = cuentaHotel(), qq = normTxt(q || '');
    const cands = Store.s.users.filter(u => u.rol !== 'admin' && u.rol !== 'guardia' && u.rol !== 'hotel' && u.estado === 'pendiente')
      .filter(u => !qq || normTxt(`${u.nombre} ${u.email}`).includes(qq)).slice(0, 30);
    return `${h ? `<div class="card"><div class="row" style="gap:12px"><span class="ic ic-wood" style="width:44px;height:44px;border-radius:14px;display:grid;place-items:center">${I('star')}</span>
        <div class="grow"><b>${esc(h.nombre)}</b><div class="muted small">${esc(h.email || '')}</div><div class="muted tiny">Cuenta del hotel desde ${h.hotelDesde ? fechaCorta(isoDe(new Date(h.hotelDesde))) : '—'}</div></div></div>
        <div class="btns" style="margin-top:10px"><button class="btn btn-sm btn-sec" data-a="abrir" data-v="privado" data-p="admin|${esc(h.id)}">${I('chat')}Mensajes con el hotel</button><button class="btn btn-sm btn-danger-soft" data-a="hotel-quitar" data-id="${esc(h.id)}">${I('x')}Quitarle el rol de hotel</button></div></div>`
      : aviso('info', 'star', 'Todavía no hay cuenta del hotel', 'Inscribí la cuenta del hotel desde "Todavía no tengo cuenta" (como cualquier usuario) y convertila abajo. Después el hotel cambia su correo y su contraseña en Tu cuenta.')}
      ${h ? `<div class="card plana small" style="margin-top:12px">${I('user')} El hotel maneja su cuenta como cualquier usuario: en <b>Tu cuenta</b> (arriba a la derecha) → <b>Cambiar mi correo</b> y <b>Cambiar mi contraseña</b>. El nombre del responsable lo carga en la <b>Ficha del hotel</b>. La Administración no ve la contraseña.</div>`
      : `<form data-f="hotel-cuenta-buscar" class="linea-form" style="margin:14px 0 8px"><input name="q" value="${esc(q || '')}" placeholder="Buscar por nombre o correo"><button class="btn btn-pri">${I('search')}</button></form>
      ${sec('Convertir una inscripción en la cuenta del hotel')}
      ${cands.length ? `<div class="card lista">${cands.map(u => `<div class="it"><div class="txt"><b>${esc(u.nombre)}</b><span>${esc(u.email || '')} · inscripción pendiente</span></div>
        <button class="btn btn-xs btn-pri" data-a="hotel-hacer" data-id="${esc(u.id)}">Hacerla del hotel</button></div>`).join('')}</div>` : vacio('users', 'No hay inscripciones pendientes. Inscribí la cuenta del hotel desde "Todavía no tengo cuenta" y va a aparecer acá.')}
      <p class="muted tiny" style="margin-top:12px">${I('lock')} Solo aparecen inscripciones pendientes: los vecinos ya aprobados no se listan. Al convertirla, la cuenta pasa a llamarse "Recepción ${HOTEL_NOMBRE}", pierde el lote y el DNI cargados y solo ve lo del hotel y lo público de la ciudad. Nada de los vecinos.</p>`}`;
  },
};
F['hotel-cuenta-buscar'] = d => abrir('hotel-cuenta', d.q || '');
A['hotel-hacer'] = async el => {
  if (!esAdmin()) return;
  const u = usuario(el.dataset.id); if (!u || u.estado !== 'pendiente' || u.rol === 'admin' || u.rol === 'guardia') return;
  if (!await confirmar('Hacerla la cuenta del hotel', `${u.nombre} (${u.email}) pasa a ser la cuenta de la recepción del ${HOTEL_NOMBRE}: deja de ser vecino y solo ve lo del hotel.`, { si:'Convertir' })) return;
  Store.cambiar(s => {
    s.users.filter(x => x.rol === 'hotel' && x.id !== u.id).forEach(x => { x.rol = 'vecino'; x.estado = 'pendiente'; x.casa = ''; });
    const x = s.users.find(z => z.id === u.id);
    Object.assign(x, { rol:'hotel', estado:'aprobado', casa:HOTEL_NOMBRE, nombre:'Recepción ' + HOTEL_NOMBRE, dni:'', representante:false, poderOk:false, aprobadoAt:x.aprobadoAt || Date.now(), hotelDesde:Date.now() });
    auditar(s, 'Designó la cuenta del hotel', x.email || x.id, x.id);
  });
  toast('Listo: esa cuenta ya es la del hotel', 'star'); refrescar();
};
A['hotel-quitar'] = async el => {
  if (!esAdmin() || !await confirmar('Quitar el rol de hotel', 'La cuenta deja de ver lo del hotel y queda como inscripción pendiente.', { si:'Quitar', peligro:true })) return;
  Store.cambiar(s => { const x = s.users.find(z => z.id === el.dataset.id); if (x){ x.rol = 'vecino'; x.estado = 'pendiente'; x.casa = ''; auditar(s, 'Quitó la cuenta del hotel', x.email || x.id, x.id); } });
  toast('Rol de hotel quitado', 'check');
};

/* =========================================================
   EL HOTEL VISTO DESDE LA GARITA Y LA ADMINISTRACIÓN
   ========================================================= */
R['hotel-vivo'] = {
  titulo:HOTEL_NOMBRE, icon:'star', color:'wood', ancha:true, sub:() => esGuardia() ? 'Vans, traslados, huéspedes y eventos de hoy' : 'En vivo · sin los nombres de los huéspedes',
  render(){
    const hoy = hoyISO(), vans = hotelVans(), vs = viajesDelDia(hoy), ev = hotelEventos().filter(e => e.fecha === hoy), h = cuentaHotel(), info = hotelInfo();
    const hs = esGuardia() ? hotelHuespedes().filter(x => x.desde <= hoy && x.hasta >= hoy) : [];
    const promosPend = promosViejasPend().length;
    const evPend = hotelEventos().filter(e => e.avisarVecinos && !e.publicado && e.fecha >= hoy).length;
    const provMal = hotelProvs().filter(p => estadoProv(p)[0] !== 'ok').length;
    return `${!h ? aviso('info', 'star', 'El hotel todavía no tiene su cuenta', esAdmin() ? 'Se crea en "Cuenta del hotel".' : 'La crea la Administración.', esAdmin() ? `<button class="btn btn-xs btn-pri" data-a="abrir" data-v="hotel-cuenta">Cuenta del hotel</button>` : '') : ''}
      ${ev.map(e => aviso('info', 'star', `Hoy en el hotel: ${esc(e.titulo)}`, `${esc(e.desde || '')}${e.hasta ? '–' + esc(e.hasta) : ''} h · ${plural(+e.asistentes || 0, 'invitado')}${e.ingreso ? ' · ingreso: ' + esc(e.ingreso) : ''}`)).join('')}
      <section class="hv-dos">
        <div>${sec('Vans')}${vans.length ? `<div class="hv-vans">${vans.map(v => tarjetaVan(v, { garita:true })).join('')}</div>` : vacio('car', 'El hotel no cargó vans.')}</div>
        <div>${sec(`Traslados de hoy (${vs.length})`, `<button class="link" data-a="abrir" data-v="hotel-traslados">Ver todos</button>`)}${vs.length ? `<div class="card lista">${vs.map(x => filaViaje(x)).join('')}</div>` : vacio('calendar', 'Sin traslados hoy.')}</div>
      </section>
      ${esGuardia() ? `${sec(`Huéspedes de hoy (${hs.length})`, `<button class="link" data-a="abrir" data-v="hotel-huespedes">Lista completa</button>`)}${hs.filter(x => x.desde === hoy && !x.ingreso).length ? `<div class="card lista">${hs.filter(x => x.desde === hoy && !x.ingreso).map(x => `<div class="it"><div class="txt"><b>${esc(x.nombre)}</b><span>${x.patente ? esc(x.patente) + ' · ' : ''}${plural(+x.pax || 1, 'persona')}</span></div><button class="btn btn-xs btn-ok" data-a="hhuesped-ingreso" data-id="${esc(x.id)}">${I('login')}Ingresó</button></div>`).join('')}</div>` : `<div class="card plana small">${I('check')} No quedan huéspedes por llegar hoy.</div>`}`
        : `<div class="garita-kpis"><div class="kpi"><b>${info.huespedesHoy || 0}</b><span>Huéspedes hoy</span></div><div class="kpi"><b>${vans.length}</b><span>Vans</span></div><div class="kpi"><b>${hotelProvs().length}</b><span>Proveedores</span></div></div>`}
      ${sec('Más')}<div class="mosaico">
        ${teja({ v:'hotel-traslados', icon:'car', color:'wood', t:'Vans y traslados', s:'Pasos por la garita y viajes' })}
        ${teja({ v:'hotel-proveedores', icon:'box', color:'brand', t:'Proveedores del hotel', s:'ART, seguro y QR', badge: esAdmin() ? provMal : 0 })}
        ${teja({ v:'hotel-eventos', icon:'star', color:'accent', t:'Eventos del hotel', s: esAdmin() ? 'Publicar para los vecinos' : 'Lo que anunció el hotel', badge: esAdmin() ? evPend : 0 })}
        ${esGuardia() ? teja({ v:'hotel-huespedes', icon:'users', color:'sky', t:'Huéspedes', s:'Los de hoy y los que están' }) : teja({ v:'hotel-huespedes', icon:'users', color:'sky', t:'Huéspedes', s:'Solo la cantidad (sin nombres)' })}
        ${esAdmin() ? teja({ v:'hotel-promos', icon:'sparkle', color:'wood', t:'Promociones', s:'Agregar, editar o borrar', badge: promosPend }) : ''}
        ${teja({ v:'hotel-emergencias', icon:'siren', color:'danger', t:'Emergencias del hotel', s:'DEA y primeros auxilios' })}
        ${h ? teja({ v:'privado', p:(esGuardia() ? 'guardia' : 'admin') + '|' + h.id, icon:'chat', color:'accent', t:'Mensajes con el hotel', s:'Privado, con la recepción' }) : ''}
        ${esAdmin() ? teja({ v:'hotel-cuenta', icon:'key', color:'accent', t:'Cuenta del hotel', s: h ? 'Activa' : 'Crearla' }) : ''}
        ${teja({ v:'hotel-convenio', icon:'clipboard', color:'wood', t:'Convenio (modelo)', s:'Convivencia y servicios' })}
        ${teja({ v:'hotel-ficha', icon:'sliders', color:'sky', t:'Ficha del hotel', s:'Responsable y tiempos' })}
      </div>`;
  },
};
/* La banda del hotel en la portada de la garita: eventos y huéspedes que
   llegan hoy. Las vans y sus traslados tienen su propia solapa
   (bandaVansGarita), para marcar salidas y regresos a un toque. */
function bandaHotel(opera){
  const ev = hotelEventos().filter(e => e.fecha === hoyISO());
  const hs = hotelHuespedes().filter(x => x.desde === hoyISO() && !x.ingreso);
  if (!ev.length && !hs.length) return '';
  return `<div class="card hv-banda"><div class="hv-cab">${I('star')}<b>${HOTEL_NOMBRE}</b><button class="link" data-a="abrir" data-v="hotel-vivo">Ver todo</button></div>
    ${ev.map(e => `<div class="small" style="margin:4px 0">${I('star')} <b>Evento hoy:</b> ${esc(e.titulo)} · ${esc(e.desde || '')}${e.hasta ? '–' + esc(e.hasta) : ''} h · ${plural(+e.asistentes || 0, 'invitado')}</div>`).join('')}
    ${hs.length ? `<div class="small" style="margin-top:6px">${I('users')} ${plural(hs.length, 'huésped llega', 'huéspedes llegan')} hoy · <button class="link" data-a="abrir" data-v="hotel-huespedes">ver la lista</button></div>` : ''}</div>`;
}
/* La sala del hotel en el Día a día de la Administración. */
function salaHotel(){
  const h = cuentaHotel(), hoy = hoyISO();
  const promos = promosViejasPend().length;
  const evs = hotelEventos().filter(e => e.avisarVecinos && !e.publicado && e.fecha >= hoy).length;
  const prov = hotelProvs().filter(p => !p.revisado || estadoProv(p)[0] === 'danger').length;
  const vs = viajesDelDia(hoy).length;
  return { k:'hotel', t:HOTEL_NOMBRE, icon:'star', color:'cobre',
    linea: h ? `${plural(hotelVans().length, 'van', 'vans')} · ${plural(vs, 'traslado', 'traslados')} hoy · ${plural(hotelInfo().huespedesHoy || 0, 'huésped', 'huéspedes')}` : 'Sin cuenta del hotel todavía',
    items:[
      { v:'hotel-vivo', icon:'eye', t:'El hotel en vivo', s:'Vans, traslados, eventos · sin nombres de huéspedes' },
      { v:'hotel-promos', icon:'sparkle', t:'Promociones del hotel', s:'Agregar, editar o borrar · salen en la tira', badge:promos },
      { v:'hotel-eventos', icon:'star', t:'Eventos del hotel', s:'Avisar a los vecinos si lo pide', badge:evs },
      { v:'hotel-proveedores', icon:'box', t:'Proveedores del hotel', s:'Revisar ART y seguro', badge:prov },
      ...(h ? [{ v:'privado', p:'admin|' + h.id, icon:'chat', t:'Mensajes con el hotel', s:'Privado, con la recepción' }] : []),
      { v:'hotel-cuenta', icon:'key', t:'Cuenta del hotel', s: h ? 'Activa · cambiarla o quitarla' : 'Convertir una cuenta' },
      { v:'hotel-convenio', icon:'clipboard', t:'Convenio (modelo)', s:'Para revisar con un abogado' },
    ] };
}

/* =========================================================
   DEMO LOCAL: un hotel de muestra para probar con ?local
   ========================================================= */
function hotelDemo(s){
  if (s.hotelDemoV || aLista(s.users).some(u => u.rol === 'hotel')) return;
  const n = Date.now(), h = hoyISO(), D = k => sumarDias(h, k);
  s.users.push({ id:'u_hotel', nombre:'Recepción ' + HOTEL_NOMBRE, casa:HOTEL_NOMBRE, email:'hotel@bahiacauquen.demo', tel:'', rol:'hotel', estado:'aprobado', clave:'HOT-2026', createdAt:n - 10 * DIA, hotelDesde:n - 10 * DIA, vehiculos:[], mascotas:[] });
  s.hotelInfo = [{ id:'info', trayAero:20, checkin:90, esperaArribo:15, trayPuerto:15, embarque:120, desembarque:45, avisoAntes:30, autoTraslados:true, dea:true, deaLugar:'Recepción, detrás del mostrador',
    auxilios:'Laura (mañana), Pedro (noche)', telRecepcion:'2901 44 1234', responsable:'Gerencia', puntoEncuentro:'Estacionamiento principal', huespedesHoy:9, huespedesDia:h }];
  s.hotelVans = [
    { id:'hv1', nombre:'Van 1', patente:'AD123XY', modelo:'Mercedes Sprinter blanca', plazas:15, chofer:'Ramón', telChofer:'2901 15 111111', codigo:'H-VAN1DEMO', activa:true, at:n - 9 * DIA },
    { id:'hv2', nombre:'Van 2', patente:'AE456ZW', modelo:'Renault Master gris', plazas:12, chofer:'Julio', telChofer:'', codigo:'H-VAN2DEMO', activa:true, at:n - 9 * DIA },
  ];
  s.hotelMovs = [{ id:'hm1', vanId:'hv2', tipo:'out', at:n - 50 * MIN, por:'u_garita', viaje:'Llevar a centro' }];
  s.hotelHuespedes = [
    { id:'hh1', nombre:'Familia Rossi', pax:4, desde:h, hasta:D(3), patente:'', llegaVuelo:'AR1880', llegaHora:'13:05', saleVuelo:'AR1881', saleHora:'15:40', at:n - 2 * DIA },
    { id:'hh2', nombre:'Martina Olsen', pax:2, desde:D(-1), hasta:D(1), patente:'AC987QP', llegaVuelo:'', saleVuelo:'', at:n - 3 * DIA },
    { id:'hh3', nombre:'Grupo congreso', pax:3, desde:D(1), hasta:D(4), patente:'', llegaVuelo:'FO5022', llegaHora:'11:30', saleVuelo:'', at:n - DIA },
  ];
  s.hotelViajes = [{ id:'ht1', vanId:'hv1', fecha:h, sale:'17:30', destino:'puerto', sentido:'llevar', ref:{ tipo:'crucero', barco:'Ushuaia expedition' }, pax:6, huespedes:[], nota:'', estado:'programado', at:n - DIA }];
  s.hotelEventos = [{ id:'he1', titulo:'Cena de gala del congreso', tipo:'cena', asistentes:80, fecha:D(1), desde:'20:30', hasta:'01:00', ingreso:'Con la van del hotel desde el centro', estacionamiento:'Dentro del predio del hotel', musicaHasta:'00:30', nota:'', avisarVecinos:true, at:n - DIA }];
  s.hotelProv = [
    { id:'hp1', empresa:'Lavandería Austral', rubro:'Lavandería', personal:'Carlos Díaz', patentes:'AB111CD', tel:'', dias:[1, 3, 5], desde:'08:00', hasta:'12:00', artVence:D(120), seguroVence:D(200), codigo:'H-PRV1DEMO', estado:'activo', revisado:true, at:n - 20 * DIA },
    { id:'hp2', empresa:'Pescados del Beagle', rubro:'Alimentos', personal:'Nora Paz', patentes:'', tel:'', dias:[2, 4], desde:'07:00', hasta:'10:00', artVence:D(5), seguroVence:'', codigo:'H-PRV2DEMO', estado:'activo', revisado:false, at:n - 5 * DIA },
  ];
  s.hotelPromos = [{ id:'hpr1', titulo:'Almuerzo de domingo para vecinos', detalle:'Menú de pasos con cordero fueguino', descuento:'15 %', desde:h, hasta:D(30), url:'', estado:'propuesta', at:n - HORA }];
  s.hotelDemoV = 1;
}
