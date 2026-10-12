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
   vecinos, el pizarrón, las visitas de los vecinos, la bitácora ni los
   datos de un SOS. Las reglas de Firebase lo hacen cumplir.

   LA GARITA opera los pasos de las vans y los proveedores del hotel (un
   toque o su QR) y ve los huéspedes que llegan. LA ADMINISTRACIÓN mira todo
   en vivo (sin los nombres de los huéspedes), edita promociones, aprueba
   avisos de eventos, revisa proveedores, publica el DEA del hotel y maneja la
   cuenta y el convenio.
   ========================================================= */

/* =========================================================
   EL HOTEL DE EJEMPLO EN LA APP DE VERDAD (pedido de Claudio, 12-10-2026:
   "dejá los datos de demo en el hotel para que se vean hasta que el hotel
   cargue los propios y así se vea su funcionalidad en tiempo real").
   Mientras el hotel no cargó NADA propio (ni vans, ni traslados, ni
   huéspedes, ni eventos, ni proveedores), la cuenta del hotel y la
   Administración ven un hotel de ejemplo (el de la demo: dos vans, sus
   traslados de hoy y los automatizados, huéspedes inventados, un evento,
   dos proveedores), con un cartel que lo dice. Reglas:
     · NO se guarda en la base: se arma en cada equipo, en memoria. Nadie
       más lo recibe y no ocupa lugar.
     · NO lo ven la garita ni la supervisión: que la guardia no espere vans
       ni huéspedes que no existen.
     · No se puede tocar: editar, borrar o registrar algo del ejemplo dice
       "es un ejemplo". Lo nuevo que cargue el hotel es de verdad.
     · Se va solo, para todos, apenas el hotel carga lo primero propio. Cada
       uno lo puede ocultar en su equipo ("Ocultar el ejemplo").
     · El motor del hotel no avisa nada del ejemplo.
   ========================================================= */
const HOTEL_OPERA = ['hotelVans', 'hotelViajes', 'hotelHuespedes', 'hotelEventos', 'hotelProv'];
const HotelEjemplo = {
  KEY:'bhc.hotel.ejemplo', cache:null, dia:'',
  oculto(){ try { return localStorage.getItem(this.KEY) === 'no'; } catch(e){ return false; } },
  hayReal(){ return HOTEL_OPERA.some(c => aLista(Store.s && Store.s[c]).some(Boolean)); },
  puedeVerlo(){ return !!(yo() && (esHotel() || esAdmin())); },
  activo(){ return this.puedeVerlo() && !this.oculto() && !this.hayReal(); },
  datos(){
    const hoy = hoyISO(); if (this.cache && this.dia === hoy) return this.cache;
    const d = { users:[] }; hotelDemo(d);
    /* Ids propios ("ej-…"): así ninguna acción los confunde con uno de verdad. */
    const ids = new Set(); HOTEL_OPERA.concat('hotelMovs').forEach(c => aLista(d[c]).forEach(x => x && x.id && ids.add(x.id)));
    const ej = v => ids.has(v) ? 'ej-' + v : v;
    d.hotelViajes = aLista(d.hotelViajes).filter(x => !x.deRutina);
    HOTEL_OPERA.concat('hotelMovs').forEach(c => { d[c] = aLista(d[c]).map(x => ({ ...x, id:ej(x.id), ...(x.vanId ? { vanId:ej(x.vanId) } : {}), ...(x.huespedes ? { huespedes:aLista(x.huespedes).map(ej) } : {}), ...(/^H-/.test(x.codigo || '') ? { codigo:'EJEMPLO' } : {}) })); });
    generarRutinas(d);
    this.dia = hoy; return this.cache = d;
  },
};
const esEjemplo = id => /^(ej-|hr-ej-)/.test(String(id || ''));
const avisoEjemplo = () => toast('Es un ejemplo: no se puede cambiar. Cargá lo tuyo y el ejemplo desaparece solo.', 'info');
const hotelCol = col => HotelEjemplo.activo() ? aLista(HotelEjemplo.datos()[col]) : aLista(Store.s[col]);
/* ---------- datos ---------- */
const hotelInfo = () => Object.assign({ id:'info', trayAero:20, checkin:90, esperaArribo:15, trayPuerto:15, embarque:120, desembarque:45,
  avisoAntes:30, autoTraslados:true, dea:false, deaLugar:'', auxilios:'', telRecepcion:'', responsable:'', puntoEncuentro:'' },
  ...(HotelEjemplo.activo() ? [aLista(HotelEjemplo.datos().hotelInfo)[0] || {}] : []),
  aLista(Store.s.hotelInfo).find(x => x && x.id === 'info') || {},
  HotelEjemplo.activo() ? { huespedesHoy:(aLista(HotelEjemplo.datos().hotelInfo)[0] || {}).huespedesHoy || 0, huespedesDia:hoyISO() } : {});
const hotelVans = () => hotelCol('hotelVans').filter(v => v && !v.baja);
const hotelProvs = () => hotelCol('hotelProv').filter(Boolean);
const hotelEventos = () => hotelCol('hotelEventos').filter(e => e && !e.cancelado);
const hotelHuespedes = () => hotelCol('hotelHuespedes').filter(Boolean);
const hotelViajes = () => hotelCol('hotelViajes').filter(x => x && !x.rutina);
/* Los traslados automatizados (12-10-2026) viven en la misma colección,
   marcados con rutina:true: son el molde, no un viaje (no tienen fecha). */
const hotelRutinas = () => hotelCol('hotelViajes').filter(x => x && x.rutina);
const hotelMovs = () => hotelCol('hotelMovs').filter(Boolean).sort((a, b) => b.at - a.at);
/* Las vans de verdad (para elegir en un formulario: nunca una del ejemplo). */
const vansReales = () => aLista(Store.s.hotelVans).filter(v => v && !v.baja);
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
  return `${x.sentido === 'buscar' ? 'Buscar en' : 'Llevar a'} ${d[0].toLowerCase()}${x.ref && x.ref.tipo === 'vuelo' ? ' · vuelo ' + x.ref.nro + (x.ref.hora ? ' ' + x.ref.hora : '') : x.ref && x.ref.tipo === 'crucero' ? ' · ' + conMayusculasBarco(x.ref.barco) : x.ref && x.ref.desc && x.ref.tipo !== 'rutina' ? ' · ' + x.ref.desc : ''}`; };
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
  aLista(s.hotelHuespedes).filter(Boolean).forEach(h => {
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
    if (u.rol !== 'hotel' || HotelEjemplo.activo()) return;
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
      generarRutinas(s);
      if (info.huespedesHoy !== hoyN || info.huespedesDia !== hoy) guardarInfo(s, { huespedesHoy:hoyN, huespedesDia:hoy });
      avisos.forEach(a => notificar(s, { para:[u.id], titulo:a.titulo, texto:a.texto, icon:'car', color: a.urgente ? 'danger' : 'wood', link:'hotel-traslados', sonido:true, urgente:a.urgente }));
    });
    if (hayCambios) refrescarPronto();
  },
  /* En la garita: los traslados automatizados de hoy y mañana (por si el
     equipo del hotel está apagado) y los pasos de las vans de más de 30
     días se van. */
  garita(){
    if (rutinasQueFaltan(2).length) Store.cambiar(s => { generarRutinas(s, 2); });
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
    ${CANALES_HOTEL.map(c => { const h = hiloHotel(c.con), ult = h ? msgsVisibles(h, 'vecino').at(-1) : null, nl = sinLeerHotel(c.con);
      return `<button class="superficie" data-a="abrir" data-v="privado" data-p="${c.con}"><span class="ic ic-${c.color}">${I(c.icon)}</span>
        <span class="txt"><b>${c.t}</b><small>${ult ? `${ult.from === 'vecino' ? 'Vos: ' : ''}${esc(ult.text.slice(0, 70))} · ${hace(ult.createdAt)}` : c.s}</small></span>
        ${nl ? `<span class="pill p-danger">${nl}</span>` : I('right')}</button>`; }).join('')}
    <p class="muted tiny" style="margin-top:12px">${I('lock')} Cada conversación es privada: la de la garita la ven solo el hotel y la garita; la de la Administración, solo el hotel y la Administración. Para una urgencia, el botón rojo <b>Garita</b> de arriba.</p>`;
}
/* Arriba de la conversación, para pasar de una a la otra sin volver. */
const chipsHotel = con => `<div class="chips">${CANALES_HOTEL.map(c => { const nl = c.con !== con ? sinLeerHotel(c.con) : 0;
  return `<button class="chip ${con === c.con ? 'on' : ''}" data-a="abrir" data-v="privado" data-p="${c.con}">${I(c.icon)}${c.t}${nl ? `<span class="n">${nl}</span>` : ''}</button>`; }).join('')}</div>`;
/* =========================================================
   LA PORTADA DEL HOTEL, REDISEÑADA (pedido de Claudio, 11-10-2026: "más
   innovador, agradable a la vista y de fácil interpretación"; las ideas,
   de tabler, 41.8k★ — tarjetas de estado —, react-chrono, 4.2k★ — línea
   de tiempo — y packery, 4.3k★ — grilla bento —; el código es propio).
     · El encabezado trae el PULSO del día: cuatro números que se tocan.
     · "Lo próximo": la van que sale después, con la cuenta regresiva.
     · Vans ahora: cada van dibujada, con su chapa y una franja verde
       (adentro) o naranja (afuera), cuánto hace y su próximo traslado.
     · Traslados: un RIEL del día (de 6 a 24 h, con la marca de ahora y un
       punto por traslado que se toca), filtros y una línea de tiempo donde
       cada traslado se abre con sus detalles y botones.
     · Hoy en Ushuaia: pestañas Vuelos / Cruceros / Eventos; los vuelos en
       un tablero como el del aeropuerto, con el botón de la van ya
       calculado.
   ========================================================= */
const HotelVista = { hoyTab:'vuelos', filtro:'todos', abierto:'' };
/* "en 1 h 20 min", "en 5 min", "ahora", "hace 10 min". */
function faltaTexto(hhmm){
  const t = minDe(hhmm); if (t == null) return '';
  const d = t - ahoraMin(), a = Math.abs(d), txt = a >= 60 ? `${Math.floor(a / 60)} h${a % 60 ? ' ' + (a % 60) : ''}` : `${a} min`;
  return a < 2 ? 'ahora' : d > 0 ? 'en ' + txt : 'hace ' + txt;
}
function pulsoHotel(prox, hsHoy, hsSalen, info){
  const k = (v, n, t, ic, cls) => `<button type="button" class="hp-kpi ${cls}" data-a="abrir" data-v="${v}">${I(ic)}<b>${n}</b><span>${t}</span></button>`;
  return `<div class="hp-pulso">${k('hotel-traslados', prox, prox === 1 ? 'traslado por hacer' : 'traslados por hacer', 'car', 'k-wood')}
    ${k('hotel-huespedes', hsHoy, 'llegan hoy', 'login', 'k-sky')}${k('hotel-huespedes', hsSalen, 'se van hoy', 'logout', 'k-accent')}
    ${k('hotel-ficha', info.huespedesHoy || 0, 'huéspedes', 'users', 'k-ok')}</div>`;
}
/* La van que sale después: grande, con cuenta regresiva. */
function proximaVan(vs){
  const ahora = ahoraMin(), x = vs.find(v => v.estado === 'en_curso') || vs.find(v => v.estado === 'programado' && (minDe(v.sale) ?? 9999) >= ahora - 15);
  if (!x) return `<div class="hp-prox tranqui">${I('check')}<div><b>Sin vans por salir</b><small>No quedan traslados pendientes hoy.</small></div>
    ${esHotel() ? `<button class="hp-prox-btn" data-a="hviaje-nuevo">${I('plus')}Traslado</button>` : ''}</div>`;
  const d = DESTINOS_HOTEL[x.destino] || DESTINOS_HOTEL.otro, van = hotelVans().find(v => v.id === x.vanId), enViaje = x.estado === 'en_curso';
  const t = minDe(x.sale), falta = t == null ? null : t - ahora, pct = falta == null ? 0 : Math.max(4, Math.min(100, 100 - falta / 1.8));
  return `<button type="button" class="hp-prox ${enViaje ? 'viaje' : falta != null && falta <= 30 ? 'pronto' : ''}" data-a="hviaje-ver" data-id="${esc(x.id)}">
    <span class="hp-prox-ic">${I(d[1])}</span>
    <span class="grow"><small>${enViaje ? 'En viaje ahora' : 'Lo próximo'}</small><b>${esc(textoViaje(x))}</b>
      <span class="hp-prox-sub">${van ? esc(van.nombre) : '<em>sin van asignada</em>'} · ${plural(+x.pax || 0, 'pasajero')}</span>
      ${enViaje ? '' : `<span class="hp-barra"><i style="width:${pct}%"></i></span>`}</span>
    <span class="hp-prox-hora"><b>${esc(x.sale || '—')}</b><small>${enViaje ? 'salió' : esc(faltaTexto(x.sale))}</small></span></button>`;
}
/* Una van, dibujada, con su chapa y su estado. */
function vanViva(v, { acciones = false } = {}){
  const e = estadoVan(v), prox = viajesDelDia().find(x => x.vanId === v.id && x.estado === 'programado');
  const hace = e.sin ? 'sin pasos registrados' : `${e.adentro ? 'adentro' : 'afuera'} desde las ${hora(e.desde)}`;
  return `<div class="hp-van ${e.adentro ? 'adentro' : 'afuera'}">
    <div class="hp-van-arte">${VAN_SVG}<span class="hp-van-luz">${e.adentro ? 'Adentro' : 'Afuera'}</span></div>
    <div class="hp-van-txt"><b>${esc(v.nombre)}</b><span class="hp-chapa">${esc(chapaTexto(v.patente || ''))}</span>
      <small>${esc(hace)}${v.chofer ? ' · ' + esc(v.chofer) : ''}</small>
      <small class="hp-van-prox">${prox ? `${I('clock')} Próximo: ${esc(prox.sale || '—')} · ${esc((DESTINOS_HOTEL[prox.destino] || DESTINOS_HOTEL.otro)[0])}` : `${I('check')} Sin traslados pendientes`}</small></div>
    ${acciones && esHotel() ? `<div class="hp-van-acc"><button class="btn btn-xs btn-sec" data-a="hvan-qr" data-id="${esc(v.id)}">${I('qr')}QR</button><button class="btn btn-xs btn-sec" data-a="hvan-editar" data-id="${esc(v.id)}">${I('edit')}Editar</button>${v.telChofer ? `<a class="btn btn-xs btn-sec" href="tel:${esc(String(v.telChofer).replace(/[^\d+]/g, ''))}">${I('phone')}Chofer</a>` : ''}</div>` : ''}</div>`;
}
/* El riel del día: de 6 a 24 h, la marca de ahora y un punto por traslado. */
function rielDia(vs, dia){
  const desde = 6 * 60, hasta = 24 * 60, pos = m => Math.max(0, Math.min(100, (m - desde) / (hasta - desde) * 100));
  const ahora = dia === hoyISO() ? `<span class="hr-ahora" style="left:${pos(ahoraMin())}%"><small>ahora</small></span>` : '';
  const puntos = vs.filter(x => minDe(x.sale) != null).map(x => { const e = ESTADO_VIAJE[x.estado] || ESTADO_VIAJE.programado;
    return `<button type="button" class="hr-punto e-${esc(x.estado)}" style="left:${pos(minDe(x.sale))}%" data-a="hviaje-ver" data-id="${esc(x.id)}" title="${esc(x.sale)} · ${esc(textoViaje(x))} · ${e[0]}" aria-label="${esc(x.sale)} ${esc(textoViaje(x))}">${I((DESTINOS_HOTEL[x.destino] || DESTINOS_HOTEL.otro)[1])}</button>`; }).join('');
  const marcas = [6, 9, 12, 15, 18, 21, 24].map(h => `<i style="left:${pos(h * 60)}%"><small>${h}</small></i>`).join('');
  return `<div class="hr-riel" role="group" aria-label="Los traslados del día en una línea de 6 a 24 horas"><div class="hr-pista">${marcas}${ahora}${puntos}</div></div>`;
}
/* La línea de tiempo: cada traslado se toca y se abre. */
function lineaTraslados(vs, { dia = hoyISO(), acciones = false, max = 99 } = {}){
  const F = { todos:() => true, pendientes:x => x.estado === 'programado', viaje:x => x.estado === 'en_curso', hechos:x => x.estado === 'hecho' };
  const n = k => vs.filter(F[k]).length, f = F[HotelVista.filtro] ? HotelVista.filtro : 'todos', lista = vs.filter(F[f]).slice(0, max);
  const chips = `<div class="hl-filtros" role="tablist">${[['todos', 'Todos'], ['pendientes', 'Pendientes'], ['viaje', 'En viaje'], ['hechos', 'Hechos']].map(([k, t]) =>
    `<button type="button" role="tab" aria-selected="${k === f}" class="hl-f ${k === f ? 'on' : ''}" data-a="htras-filtro" data-v="${k}">${t}<span>${n(k)}</span></button>`).join('')}</div>`;
  const ahora = ahoraMin(), esHoy = dia === hoyISO();
  let marcoAhora = !esHoy;
  const filas = lista.map(x => {
    const d = DESTINOS_HOTEL[x.destino] || DESTINOS_HOTEL.otro, e = ESTADO_VIAJE[x.estado] || ESTADO_VIAJE.programado, van = hotelVans().find(v => v.id === x.vanId), aj = ajusteViaje(x);
    let linea = '';
    if (!marcoAhora && (minDe(x.sale) ?? 0) > ahora){ marcoAhora = true; linea = `<li class="hl-ahora"><span>${I('clock')} Ahora · ${hhmmDe(ahora)}</span></li>`; }
    const abierto = HotelVista.abierto === x.id;
    return `${linea}<li class="hl-item e-${esc(x.estado)} ${abierto ? 'abierto' : ''}" id="tras-${esc(x.id)}">
      <span class="hl-hora"><b>${esc(x.sale || '—')}</b><small>${esHoy && x.estado === 'programado' ? esc(faltaTexto(x.sale)) : e[0]}</small></span>
      <span class="hl-nodo">${I(d[1])}</span>
      <div class="hl-card"><button type="button" class="hl-cab" data-a="hviaje-ver" data-id="${esc(x.id)}" aria-expanded="${abierto}">
          <span class="grow"><b>${x.deRutina ? `<i class="hl-auto" title="Traslado automatizado">${I('refresh')}</i>` : ''}${esc(textoViaje(x))}</b><small>${x.deRutina && x.ref && x.ref.desc ? esc(x.ref.desc) + ' · ' : ''}${plural(+x.pax || 0, 'pasajero')} · ${van ? esc(van.nombre) : '<em>sin van</em>'}${choferDe(x) ? ' · ' + esc(choferDe(x)) : ''}</small></span>
          <span class="pill ${e[1] ? 'p-' + e[1] : ''}">${e[0]}</span></button>
        ${aj ? `<span class="hv-alerta">${I(aj.cancelado ? 'alert' : 'clock')} ${aj.cancelado ? 'El vuelo figura CANCELADO' : `${esc(aj.v.estado || 'Nuevo horario')} ${esc(aj.v.real || aj.v.hora)} h: conviene salir ${esc(aj.sale)}`}${!aj.cancelado && esHotel() ? ` <button class="link" data-a="hviaje-ajustar" data-id="${esc(x.id)}" data-v="${esc(aj.sale)}">Ajustar</button>` : ''}</span>` : ''}
        ${abierto ? `<div class="hl-det">
          <span>${I('car')} ${van ? `${esc(van.nombre)} · <span class="hp-chapa chica">${esc(chapaTexto(van.patente || ''))}</span>` : 'Todavía sin van: asignala al editar'}${choferDe(x) ? ' · ' + esc(choferDe(x)) : ''}</span>
          ${x.auto ? `<span>${I('users')} Armado solo con los huéspedes del vuelo</span>` : ''}
          ${x.deRutina ? (r => r ? `<span>${I('refresh')} Traslado automatizado · ${esc(textoDias(r.dias))}${esHotel() ? ` · <button class="link" data-a="hrutina-editar" data-id="${esc(r.id)}">cambiarlo todos los días</button>` : ''}</span>` : '')(hotelRutinas().find(z => z.id === x.deRutina)) : ''}
          ${x.nota ? `<span>${I('edit')} ${esc(x.nota)}</span>` : ''}
          <span>${I('calendar')} ${x.fecha === hoyISO() ? 'Hoy' : fechaCorta(x.fecha)} · sale ${esc(x.sale || '—')} h</span>
          ${esHotel() ? `<div class="btns"><button class="btn btn-xs btn-pri" data-a="hviaje-editar" data-id="${esc(x.id)}">${I('edit')}Editar</button>${van ? `<button class="btn btn-xs btn-sec" data-a="hvan-qr" data-id="${esc(van.id)}">${I('qr')}QR de la van</button>` : ''}</div>` : ''}</div>` : ''}</div></li>`;
  }).join('');
  const fin = !marcoAhora && lista.length ? `<li class="hl-ahora"><span>${I('clock')} Ahora · ${hhmmDe(ahora)}</span></li>` : '';
  return `${chips}${lista.length ? `<ol class="hl-linea">${filas}${fin}</ol>` : `<div class="hl-vacio">${I('check')} ${vs.length ? 'Nada con ese filtro.' : `No hay traslados ese día.${esHotel() ? ' Se agregan con "+ Traslado", arriba.' : ''}`}</div>`}`;
}
/* PASOS POR LA GARITA (pedido de Claudio, 11-10-2026: "hacele un diseño
   más innovador"). Un PORTÓN: arriba, cuántas salidas y entradas hubo y
   dónde está cada van; abajo, una línea central (el portón) con las
   salidas a la izquierda y las entradas a la derecha, cada paso con su
   hora, la van, su chapa, el traslado y hace cuánto. En el teléfono, una
   sola columna con la flecha de para dónde fue. */
function portonHotel(movs){
  const vans = hotelVans(), sal = movs.filter(m => m.tipo !== 'in').length, ent = movs.length - sal;
  const haceTxt = t => { const m = Math.round((Date.now() - t) / 60000); return m < 1 ? 'recién' : m < 60 ? `hace ${m} min` : `hace ${Math.floor(m / 60)} h${m % 60 ? ' ' + (m % 60) + ' min' : ''}`; };
  const cab = `<div class="pt-cab"><div class="pt-num sale">${I('logout')}<b>${sal}</b><span>${sal === 1 ? 'salida' : 'salidas'}</span></div>
      <div class="pt-porton" aria-hidden="true"><span class="pt-poste"></span><span class="pt-brazo"></span><span class="pt-poste"></span></div>
      <div class="pt-num entra">${I('login')}<b>${ent}</b><span>${ent === 1 ? 'entrada' : 'entradas'}</span></div></div>
    ${vans.length ? `<div class="pt-vans">${vans.map(v => { const e = estadoVan(v); return `<span class="pt-van ${e.adentro ? 'adentro' : 'afuera'}"><i></i>${esc(v.nombre)} · ${e.adentro ? 'adentro' : 'afuera'}</span>`; }).join('')}</div>` : ''}`;
  if (!movs.length) return `<div class="pt-caja">${cab}<p class="pt-nada">${I('shield')} Ninguna van pasó por la garita en las últimas 24 horas. Cuando la garita marque una salida o una entrada (con un toque o leyendo el QR), aparece acá al instante.</p></div>`;
  return `<div class="pt-caja">${cab}<ol class="pt-linea">${movs.map(m => { const v = vans.find(x => x.id === m.vanId) || hotelVans().find(x => x.id === m.vanId) || {}, entra = m.tipo === 'in';
    return `<li class="pt-paso ${entra ? 'entra' : 'sale'}"><span class="pt-nodo">${I(entra ? 'login' : 'logout')}</span>
      <div class="pt-tarj"><span class="pt-hora">${hora(m.at)}</span><span class="grow"><b>${esc(v.nombre || 'Van')} ${entra ? 'entró al barrio' : 'salió del barrio'}</b>
        <small>${v.patente ? `<span class="hp-chapa chica">${esc(chapaTexto(v.patente))}</span> ` : ''}${m.viaje ? esc(m.viaje) + ' · ' : ''}${haceTxt(m.at)}</small></span>
        <span class="pt-flecha" aria-hidden="true">${entra ? '→' : '←'}</span></div></li>`; }).join('')}</ol></div>`;
}
A['htras-filtro'] = el => { HotelVista.filtro = el.dataset.v || 'todos'; refrescar(); };
A['hviaje-ver'] = el => {
  const id = el.dataset.id; HotelVista.abierto = HotelVista.abierto === id ? '' : id;
  /* El filtro no puede esconder el que se quiere ver. */
  const x = hotelViajes().find(v => v.id === id);
  if (x && HotelVista.abierto && !({ todos:1, pendientes:x.estado === 'programado', viaje:x.estado === 'en_curso', hechos:x.estado === 'hecho' })[HotelVista.filtro]) HotelVista.filtro = 'todos';
  refrescar();
  setTimeout(() => { const li = document.getElementById('tras-' + id); if (li) li.scrollIntoView({ block:'nearest', behavior: matchMedia('(prefers-reduced-motion:reduce)').matches ? 'auto' : 'smooth' }); }, 60);
};
/* =========================================================
   LOS VUELOS PARA LAS VANS, COMO EL TABLERO DEL AEROPUERTO (pedido de
   Claudio, 12-10-2026: "un diseño más innovador de los vuelos de llegada y
   salida, con colores más vivos y animaciones"). Ideas de flipoff (3k★,
   tablero de paletas que giran) y scottbez1/splitflap (4.2k★); el código es
   propio y liviano: solo CSS, sin librerías.
     · Arriba, Salidas / Llegadas con un avión que despega o aterriza.
     · "La próxima van": el vuelo que pide la van más pronto, con su cuenta
       regresiva y el botón para programarla.
     · Cada vuelo en paletas amarillas sobre negro que giran al aparecer, el
       estado en color (demorado, cancelado, embarcando, aterrizó) y la van
       ya calculada con la ficha del hotel ("Van 14:10 · en 35 min"); si ya
       está programada, una tilde verde.
   ========================================================= */
const HotelVuelos = { tab:'D' };
A['hvue-tab'] = el => { HotelVuelos.tab = el.dataset.v === 'A' ? 'A' : 'D'; refrescar(); };
const paletas = (txt, cls = '') => `<span class="sf ${cls}" aria-label="${esc(txt)}">${[...String(txt || '—')].map((ch, i) => `<i style="--i:${i}">${ch === ' ' ? '&nbsp;' : esc(ch)}</i>`).join('')}</span>`;
const claseEstadoVuelo = e => /cancel/i.test(e) ? 'cancel' : /demor|delay|retras/i.test(e) ? 'demora' : /embar|board/i.test(e) ? 'embarca' : /aterr|arrib|landed/i.test(e) ? 'llego' : /despeg|depart|sali/i.test(e) ? 'salio' : 'prog';
function vuelosParaVan(sentido, { todos = false } = {}){
  const d = Vuelos.d, ahora = ahoraMin(); if (!d) return [];
  return aLista(sentido === 'A' ? d.arr : d.dep).map(v => ({ ...v, tipo:sentido }))
    .filter(v => todos || (!/cancel/i.test(v.estado) && (Vuelos.minutos(v.real || v.hora) ?? 0) >= ahora - 20));
}
const vanYaProgramada = v => viajesDelDia().some(x => x.ref && x.ref.tipo === 'vuelo' && normVuelo(x.ref.nro) === normVuelo(v.nro));
function filaTablero(v, i){
  const sale = salidaVuelo(v), ya = vanYaProgramada(v), est = v.estado || (v.real && v.real !== v.hora ? 'Est. ' + v.real : 'Programado'), ce = claseEstadoVuelo(est);
  const pasada = sale && minDe(sale) < ahoraMin() - 5;
  return `<div class="tv-fila tv-e-${ce}" style="--f:${i}">
    <span class="tv-hora">${paletas(v.real || v.hora, 'sf-hora')}${v.real && v.real !== v.hora ? `<s>${esc(v.hora)}</s>` : ''}</span>
    <span class="tv-vuelo">${paletas(v.nro)}<small>${esc(v.aerolinea || '')}</small></span>
    <span class="tv-lugar"><b data-vuelo="${esc(v.nro)}">${esc(v.lugar)}</b><em class="tv-est">${esc(est)}</em></span>
    ${esHotel() ? (ya ? `<span class="tv-van ok">${I('check')}<b>Van</b><small>programada</small></span>`
      : `<button class="tv-van ${pasada ? 'tarde' : ''}" data-a="hviaje-nuevo" data-v="vuelo|${esc(v.nro)}|${v.tipo}|${esc(v.real || v.hora)}|${esc(sale)}" title="La van tendría que salir a las ${esc(sale)}">${I('car')}<b>Van ${esc(sale || '—')}</b><small>${sale ? esc(faltaTexto(sale)) : 'programar'}</small></button>`)
      : `<span class="tv-van info"><b>${esc(sale || '—')}</b><small>van</small></span>`}</div>`;
}
function tableroVuelos({ max = 99, todos = false } = {}){
  const d = Vuelos.d, tab = HotelVuelos.tab, ls = vuelosParaVan(tab, { todos }), info = hotelInfo();
  const n = k => vuelosParaVan(k, { todos }).length;
  /* La próxima van: el vuelo (de ida o de vuelta) que pide la van más pronto y todavía no la tiene. */
  const prox = esHotel() ? [...vuelosParaVan('D'), ...vuelosParaVan('A')].filter(v => !vanYaProgramada(v) && !/cancel/i.test(v.estado || '')).map(v => ({ v, t:minDe(salidaVuelo(v)) })).filter(x => x.t != null && x.t >= ahoraMin() - 5).sort((a, b) => a.t - b.t)[0] : null;
  return `<div class="tv-caja ${tab === 'A' ? 'llegadas' : 'salidas'}">
    <div class="tv-cielo" aria-hidden="true"><span class="tv-avion">${I('send')}</span><i></i><i></i><i></i></div>
    <div class="tv-tabs" role="tablist"><span class="tv-ind"></span>
      <button type="button" role="tab" aria-selected="${tab === 'D'}" class="${tab === 'D' ? 'on' : ''}" data-a="hvue-tab" data-v="D">${I('logout')}Salidas<span>${n('D')}</span></button>
      <button type="button" role="tab" aria-selected="${tab === 'A'}" class="${tab === 'A' ? 'on' : ''}" data-a="hvue-tab" data-v="A">${I('login')}Llegadas<span>${n('A')}</span></button></div>
    ${prox ? `<button type="button" class="tv-prox" data-a="hviaje-nuevo" data-v="vuelo|${esc(prox.v.nro)}|${prox.v.tipo}|${esc(prox.v.real || prox.v.hora)}|${esc(salidaVuelo(prox.v))}">
        <span class="tv-prox-ic">${I('car')}</span><span class="grow"><small>La próxima van</small><b>${prox.v.tipo === 'A' ? 'Buscar' : 'Llevar'} · vuelo ${esc(prox.v.nro)} ${prox.v.tipo === 'A' ? 'de' : 'a'} ${esc(prox.v.lugar)}</b><span>${prox.v.tipo === 'A' ? 'Aterriza' : 'Despega'} ${esc(prox.v.real || prox.v.hora)} h · tocá para programarla</span></span>
        <span class="tv-prox-h"><b>${esc(salidaVuelo(prox.v))}</b><small>${esc(faltaTexto(salidaVuelo(prox.v)))}</small></span></button>` : ''}
    <div class="tv-tablero">
      <div class="tv-tit"><span>Hora</span><span>Vuelo</span><span>${tab === 'A' ? 'Desde' : 'Destino'}</span><span>${esHotel() ? 'Van' : 'Sale la van'}</span></div>
      ${!d ? `<p class="tv-nada">${I('refresh')} Leyendo el tablero del aeropuerto…</p>` : ls.length ? ls.slice(0, max).map(filaTablero).join('') : `<p class="tv-nada">${I('check')} No quedan ${tab === 'A' ? 'llegadas' : 'salidas'} hoy.</p>`}
    </div>
    <p class="tv-pie">${I('info')} "Van 14:10" = cuándo tendría que salir la van: ${tab === 'A' ? `${info.esperaArribo} min después de que aterriza, menos ${info.trayAero} min de viaje al aeropuerto` : `${info.checkin} min de check-in más ${info.trayAero} min de viaje al aeropuerto`}. Se cambia en la Ficha del hotel.</p>
  </div>`;
}
R['hotel-vuelos'] = {
  titulo:'Vuelos para las vans', icon:'send', color:'sky', ancha:true, sub:'Aeropuerto de Ushuaia · con la hora de la van ya calculada',
  render(){
    const d = Vuelos.d;
    return `${tableroVuelos({ todos:true })}
      <div class="btns" style="margin-top:12px"><button class="btn btn-sec grow" data-a="vuelos-actualizar">${I('refresh')}Actualizar</button><button class="btn btn-sec grow" data-a="abrir" data-v="vuelos">${I('send')}El tablero completo</button></div>
      ${d ? `<p class="muted tiny center">Última lectura: ${hora(d.t)}${d.act ? ` · el aeropuerto actualizó ${d.act}` : ''}</p>` : ''}`;
  },
  alPintar(){ if (!Vuelos.d || Date.now() - Vuelos.d.t > 5 * MIN) Vuelos.pedir().then(() => { if (PILA.at(-1)?.id === 'hotel-vuelos') refrescar(); }).catch(() => {}); },
};
/* Hoy en Ushuaia, en pestañas. */
function hoyEnUshuaiaHotel(){
  const hoy = hoyISO();
  const cr = Cruceros.lista().filter(c => c.fecha >= hoy && c.fecha <= sumarDias(hoy, 2)).slice(0, 6);
  const ev = aLista(Store.s.eventosCiudad).filter(e => e && e.fecha >= hoy && e.fecha <= sumarDias(hoy, 7)).sort((a, b) => a.fecha.localeCompare(b.fecha)).slice(0, 5);
  const tabs = [['vuelos', 'send', 'Vuelos', vuelosParaVan('D').length + vuelosParaVan('A').length], ['cruceros', 'drop', 'Cruceros', cr.length], ['eventos', 'calendar', 'Eventos', ev.length]];
  const tab = tabs.some(t => t[0] === HotelVista.hoyTab) ? HotelVista.hoyTab : 'vuelos';
  const cuerpo = tab === 'vuelos' ? `${tableroVuelos({ max:5 })}<button class="hu-todos" data-a="abrir" data-v="hotel-vuelos">${I('send')}Todos los vuelos de hoy${I('right')}</button>`
    : tab === 'cruceros' ? `<div class="hc-lista">${cr.length ? cr.map(tarjetaCrucero).join('')
        : `<p class="hu-nada">${I('drop')} ${Cruceros.url() ? 'No hay recaladas en los próximos tres días.' : 'El cronograma de cruceros todavía no está conectado.'}</p>`}
        <button class="hu-todos" data-a="abrir" data-v="cruceros">${I('drop')}Ver todos los cruceros${I('right')}</button></div>`
    : `<div class="he-lista">${ev.length ? ev.map(tarjetaEventoCiudad).join('') : `<p class="hu-nada">${I('calendar')} Sin eventos cargados para esta semana.</p>`}
        <button class="hu-todos" data-a="abrir" data-v="ushuaia">${I('calendar')}Ushuaia hoy: agenda completa${I('right')}</button></div>`;
  return `<div class="hu-caja"><div class="hu-tabs" role="tablist">${tabs.map(([k, ic, t, n]) => `<button type="button" role="tab" aria-selected="${k === tab}" class="hu-tab ${k === tab ? 'on' : ''}" data-a="hhoy-tab" data-v="${k}">${I(ic)}${t}${n ? `<span>${n}</span>` : ''}</button>`).join('')}</div>${cuerpo}</div>`;
}
/* Un crucero: el barco, su día, la estadía en el puerto (llega → sale) y
   los dos botones con la hora de la van ya calculada. */
const BARCO_SVG = `<svg viewBox="0 0 64 32" aria-hidden="true"><path d="M4 20h56l-6 9H11Z" fill="currentColor"/><path d="M12 20v-6h36l6 6Z" fill="currentColor" opacity=".75"/><path d="M20 14V9h20v5Z" fill="currentColor" opacity=".55"/><rect x="26" y="3" width="5" height="6" rx="1" fill="currentColor" opacity=".55"/><path d="M15 17h3M22 17h3M29 17h3M36 17h3M43 17h3" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/></svg>`;
function tarjetaCrucero(c){
  const hoy = hoyISO(), ll = horaDe(c.llega) || '', sa = horaDe(c.sale) || '', mL = minDe(ll), mS = minDe(sa);
  const pos = m => m == null ? 0 : Math.max(0, Math.min(100, m / 1440 * 100));
  const enPuerto = c.fecha === hoy && mL != null && mS != null && ahoraMin() >= mL && ahoraMin() <= mS;
  const sB = salidaCrucero(c, 'buscar'), sL = salidaCrucero(c, 'llevar');
  return `<div class="hc-barco ${enPuerto ? 'en-puerto' : ''}"><div class="hc-cab"><span class="hc-ic">${BARCO_SVG}</span>
      <span class="grow"><b>${esc(conMayusculasBarco(c.barco))}</b><small>${enPuerto ? '<em>En el puerto ahora</em>' : c.fecha === hoy ? 'Hoy' : esc(relDia(c.fecha))}</small></span></div>
    <div class="hc-estadia"><span class="hc-t"><small>Llega</small><b>${esc(ll || '—')}</b></span>
      <span class="hc-barra"><i style="left:${pos(mL)}%;right:${100 - (mS != null && mS > (mL ?? 0) ? pos(mS) : 100)}%"></i>${c.fecha === hoy ? `<u style="left:${pos(ahoraMin())}%"></u>` : ''}</span>
      <span class="hc-t"><small>Sale</small><b>${esc(sa || '—')}</b></span></div>
    ${esHotel() ? `<div class="hc-acc"><button class="hc-btn buscar" data-a="hviaje-nuevo" data-v="crucero|${esc(c.barco)}|buscar|${esc(c.fecha)}|${esc(sB)}">${I('login')}<span><b>Buscar pasajeros</b><small>${sB ? 'la van sale ' + esc(sB) : 'programar'}</small></span></button>
      <button class="hc-btn llevar" data-a="hviaje-nuevo" data-v="crucero|${esc(c.barco)}|llevar|${esc(String(c.sale || '').slice(0, 10))}|${esc(sL)}">${I('logout')}<span><b>Llevar al barco</b><small>${sL ? 'la van sale ' + esc(sL) : 'programar'}</small></span></button></div>` : ''}</div>`;
}
/* Un evento de la ciudad, como una entrada con su talón. */
function tarjetaEventoCiudad(e){
  const f = new Date(e.fecha + 'T12:00:00'), hoy = hoyISO();
  const mes = f.toLocaleDateString('es-AR', { month:'short' }).replace('.', ''), sem = e.fecha === hoy ? 'hoy' : f.toLocaleDateString('es-AR', { weekday:'short' }).replace('.', '');
  return `<div class="he-ticket"><span class="he-talon"><small>${esc(sem)}</small><b>${f.getDate()}</b><small>${esc(mes)}</small></span>
    <span class="he-cuerpo"><b>${esc(e.titulo)}</b><small>${e.hora ? `${I('clock')} ${esc(e.hora)} h` : ''}${e.lugar ? ` ${I('pin')} ${esc(e.lugar)}` : ''}</small></span>
    ${esHotel() ? `<button class="he-van" data-a="hviaje-nuevo" data-v="evento|${esc(e.titulo)}|llevar|${esc(e.fecha)}|${esc(e.hora || '')}" aria-label="Programar una van para ${esc(e.titulo)}">${I('car')}<span>Van</span></button>` : ''}</div>`;
}
A['hhoy-tab'] = el => { HotelVista.hoyTab = el.dataset.v || 'vuelos'; refrescar(); };
/* =========================================================
   EL HOTEL EN LA APP, REDISEÑADO (pedido de Claudio, 12-10-2026: "un
   diseño innovador y más atractivo, con alguna animación que llame a su
   uso"). Un mosaico de colores vivos (grilla "bento", idea de magicui,
   22.5k★, y animate.css, 82k★; el código es propio):
     · la teja grande de Vans y traslados, con la van que anda por la ruta;
     · cada teja con su color y su ícono que se mueve al pasar o tocar;
     · un brillo que recorre las tejas de a una, cada tanto, como una
       invitación a tocarlas; las que tienen algo pendiente laten;
     · al abrir la portada, las tejas entran de a una (solo la primera vez).
   Con "reducir movimiento" del teléfono queda todo quieto.
   ========================================================= */
function hotelEnLaApp({ prox = 0, promosPend = 0, sinLeer = 0 } = {}){
  const lotes = typeof lotesDelHotel === 'function' ? lotesDelHotel() : [];
  let exp = null;
  if (lotes.length){ const d = deudaGrupo(lotes), tot = totalDeuda(d), l = liquidacionesEmitidas().slice(-1)[0];
    exp = { t:'Expensas del hotel', s: tot > .5 ? `${plata(tot)} entre las ${lotes.length} UF${l ? ' · vence el ' + fechaCorta(vtoDe(l.periodo, 1)) : ''}` : `Las ${lotes.length} UF al día · cupones y recibos`, badge: tot > .5 ? '!' : '' }; }
  const rs = hotelRutinas().filter(r => r.activa !== false).length;
  const T = [
    { v:'hotel-traslados', ic:'car', c:'wood', t:'Vans y traslados', s:'Aeropuerto, puerto, excursiones · con el QR de cada van', n:prox, grande:true },
    { v:'hotel-vuelos', ic:'send', c:'sky', t:'Vuelos para las vans', s:'La hora de la van, ya calculada' },
    { v:'hotel-rutinas', ic:'refresh', c:'ok', t:'Traslados automatizados', s: rs ? `${plural(rs, 'activo', 'activos')} · se arman solos` : 'Las salidas de siempre, una vez' },
    { v:'hotel-huespedes', ic:'users', c:'accent', t:'Huéspedes', s:'Lista del día para la garita · se borran solos' },
    { v:'privado', p:'hotel', ic:'chat', c:'brand', t:'Comunicación interna', s:'Con la garita o la Administración', badge:sinLeer },
    { v:'hotel-promos', ic:'sparkle', c:'cobre', t:'Promociones', s:'Salen en la tira de todas las apps', badge:promosPend },
    { v:'hotel-eventos', ic:'star', c:'accent', t:'Eventos del hotel', s:'La garita se entera; los vecinos, si hace falta' },
    { v:'hotel-proveedores', ic:'box', c:'brand', t:'Proveedores', s:'ART, seguro y su QR de ingreso' },
    { v:'hotel-emergencias', ic:'siren', c:'danger', t:'Emergencias', s:'Llamar, avisar a la garita, DEA', alerta:true },
    ...(exp ? [{ v:'expensas', ic:'wallet', c:'wood', t:exp.t, s:exp.s, badge:exp.badge }] : []),
    { a:'hotel-hoja-dia', ic:'download', c:'ok', t:'Hoja del día', s:'Vuelos, cruceros y traslados para el mostrador' },
    { v:'vecinos', ic:'pin', c:'sky', t:'Direcciones del barrio', s:'Para guiar a un huésped' },
    { v:'hotel-ficha', ic:'sliders', c:'sky', t:'Ficha del hotel', s:'Responsable, tiempos de traslado, DEA' },
    { v:'agenda', ic:'book', c:'cobre', t:'Agenda de Ushuaia', s:'Taxis, comidas, farmacias' },
    { v:'documentos', ic:'file', c:'brand', t:'Normas', s:'Reglamento y convivencia' },
    { v:'hotel-convenio', ic:'clipboard', c:'wood', t:'Convenio con el barrio', s:'Modelo de convivencia y servicios' },
    { v:'manual', ic:'book', c:'accent', t:'Manual de uso', s:'El capítulo del hotel' },
  ];
  const primera = !HotelVista.hapVista; HotelVista.hapVista = true;
  return `<div class="hap ${primera ? 'entra' : ''}">${T.map((x, i) => { const b = +x.badge || (x.badge === '!' ? '!' : 0);
    return `<button type="button" class="hap-t c-${x.c} ${x.grande ? 'grande' : ''} ${b ? 'pide' : ''} ${x.alerta ? 'alerta' : ''}" data-a="${x.a || 'abrir'}" data-v="${esc(x.v || '')}" data-p="${esc(x.p || '')}" style="--i:${i}">
      ${x.grande ? `<span class="hap-ruta" aria-hidden="true">${VAN_SVG}<i></i></span>` : ''}
      <span class="hap-ic">${I(x.ic)}</span><span class="hap-txt"><b>${esc(x.t)}</b><small>${esc(x.s)}</small></span>
      ${b ? `<span class="hap-badge">${b === '!' ? '!' : b > 99 ? '99+' : b}</span>` : x.n ? `<span class="hap-n">${x.n}</span>` : ''}
      <span class="hap-brillo" aria-hidden="true"></span></button>`; }).join('')}</div>`;
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
    return `<div class="hotel-hero hp-hero"><img src="img/logo-noche.png" alt="" width="54" height="54">
        <div class="grow"><small>${fechaLarga(hoy)}</small><h1>${HOTEL_NOMBRE}</h1><span>Recepción${info.responsable ? ' · responsable: ' + esc(info.responsable) : ''}</span></div>
        ${c ? `<div class="hotel-temp"><b>${Math.round(c.temperature_2m)}°</b><small>${Clima.cod(c.weather_code)[0]}</small></div>` : ''}</div>
      ${pulsoHotel(prox.length, hsHoy.length, hsSalen.length, info)}
      <div class="inicio-lienzo">
        ${ajustes.length || evHoy.length ? `<section class="bloque">${ajustes.map(x => { const aj = ajusteViaje(x); return aviso(aj.cancelado ? 'danger latido' : 'warn', 'clock', aj.cancelado ? `Vuelo ${esc(x.ref.nro)} cancelado` : `Cambió el ${esc(x.ref.nro)}: la van conviene que salga ${esc(aj.sale)}`, esc(textoViaje(x)), aj.cancelado ? '' : `<button class="btn btn-xs btn-pri" data-a="hviaje-ajustar" data-id="${esc(x.id)}" data-v="${esc(aj.sale)}">Ajustar a las ${esc(aj.sale)}</button>`); }).join('')}
          ${evHoy.map(e => aviso('info', 'star', `Hoy: ${esc(e.titulo)}`, `${esc(e.desde || '')}${e.hasta ? '–' + esc(e.hasta) : ''} h · ${plural(+e.asistentes || 0, 'invitado')}${e.publicado ? ' · avisado a los vecinos' : ''}`)).join('')}</section>` : ''}
        <section class="bloque">${proximaVan(vs)}</section>
        <section class="bloque hv-dos">
          <div>${sec('Vans ahora', `<button class="link" data-a="abrir" data-v="hotel-traslados">Vans y traslados</button>`)}
            ${vans.length ? `<div class="hp-vans">${vans.map(v => vanViva(v)).join('')}</div>` : garajeVacio()}</div>
          <div>${sec(`Traslados de hoy`, `<button class="link" data-a="hviaje-nuevo">+ Traslado</button>`)}
            <div class="card hl-caja">${rielDia(vs, hoy)}${lineaTraslados(vs, { dia:hoy, max:8 })}</div></div>
        </section>
        <section class="bloque">${sec('Hoy en Ushuaia, para el hotel')}${hoyEnUshuaiaHotel()}</section>
        <section class="bloque">${sec('El hotel en la app', '<span class="muted small">tocá y entrá</span>')}${hotelEnLaApp({ prox:prox.length, promosPend, sinLeer })}</section>
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
    const diaTxt = iso => { const f = new Date(iso + 'T12:00:00'); return { sem: iso === hoy ? 'Hoy' : f.toLocaleDateString('es-AR', { weekday:'short' }).replace('.', ''), n: f.getDate() }; };
    const cuantos = iso => viajesDelDia(iso).length;
    return `<div class="ht-cab"><div class="grow"><small>${vans.length ? `${plural(vans.length, 'van')} · ${vans.filter(v => estadoVan(v).adentro).length} adentro` : 'Sin vans cargadas'}</small>
        <b>${dia === hoy ? 'Traslados de hoy' : 'Traslados del ' + fechaCorta(dia)}</b></div>
        ${esHotel() ? `<button class="btn btn-sm btn-pri" data-a="hviaje-nuevo">${I('plus')}Traslado</button>` : ''}</div>
      ${(() => { const rs = hotelRutinas(), act = rs.filter(r => r.activa !== false).length; if (!rs.length && !esHotel()) return '';
        return `<button type="button" class="ht-auto" data-a="abrir" data-v="hotel-rutinas"><span class="ht-auto-ic">${I('refresh')}</span><span class="grow"><b>${rs.length ? plural(act, 'traslado automatizado', 'traslados automatizados') : 'Traslados automatizados'}</b><small>${rs.length ? `Se arman solos cada día${rs.length > act ? ` · ${rs.length - act} en pausa` : ''}` : 'Las salidas de siempre, cargadas una vez'}</small></span>${I('right')}</button>`; })()}
      <div class="ht-dias" role="tablist">${[0, 1, 2, 3, 4, 5, 6].map(i => sumarDias(hoy, i)).map(d => { const t = diaTxt(d), n = cuantos(d);
        return `<button type="button" role="tab" aria-selected="${d === dia}" class="ht-dia ${d === dia ? 'on' : ''}" data-a="abrir" data-v="hotel-traslados" data-p="${d}"><small>${esc(t.sem)}</small><b>${t.n}</b>${n ? `<span>${n}</span>` : '<i></i>'}</button>`; }).join('')}</div>
      <div class="card hl-caja">${rielDia(vs.filter(x => x.estado !== 'cancelado'), dia)}${lineaTraslados(vs.filter(x => x.estado !== 'cancelado'), { dia, acciones:true })}</div>
      ${sec('Vans', esHotel() ? `<button class="link" data-a="hvan-editar">+ Van</button>` : '')}
      ${vans.length ? `<div class="hp-vans">${vans.map(v => vanViva(v, { acciones:true })).join('')}</div>`
        : esHotel() ? garajeVacio() : vacio('car', 'El hotel todavía no cargó sus vans.')}
      ${sec('Pasos por la garita', '<span class="muted small">últimas 24 h</span>')}${portonHotel(movs)}
      <p class="muted tiny" style="margin-top:12px">${I('info')} Cuando la garita registra que una van sale (con un toque o leyendo su QR), el traslado que le tocaba pasa a "En viaje"; cuando vuelve, a "Hecho". Si el vuelo de un traslado cambia de horario en el aeropuerto, la app avisa cuándo conviene salir.</p>`;
  },
};
/* =========================================================
   LA COCHERA DEL HOTEL (pedido de Claudio, 11-10-2026: "la ventana Carga
   las vans del hotel es gris y mal diseñada, hacele un diseño innovador").
   Sin vans, en vez de un cartel gris con un botón gris: una cochera de
   noche con la van que entra por la ruta, los tres pasos (cargarla,
   imprimir su QR, la garita la deja pasar con un toque) y un botón grande.
   Al cargarla, arriba del formulario se arma EN VIVO su credencial: la
   patente como la chapa de verdad, el nombre, el modelo, las plazas y el
   chofer, igual a como la va a ver la garita.
   ========================================================= */
const VAN_SVG = `<svg class="cv-van" viewBox="0 0 120 56" aria-hidden="true"><path d="M6 40V18a8 8 0 0 1 8-8h62c4 0 7 1.6 9.6 4.4L104 30l8 3.2c2.4 1 4 3.3 4 5.9V40a4 4 0 0 1-4 4H10a4 4 0 0 1-4-4Z" fill="#fff"/><path d="M80 15h-8v14h26L86 17.6A6 6 0 0 0 80 15Z" fill="#9fd6ec"/><rect x="14" y="15" width="16" height="12" rx="2.5" fill="#9fd6ec"/><rect x="34" y="15" width="16" height="12" rx="2.5" fill="#9fd6ec"/><rect x="54" y="15" width="14" height="12" rx="2.5" fill="#9fd6ec"/><path d="M6 33h110" stroke="var(--wood)" stroke-width="3"/><circle cx="28" cy="44" r="8" fill="#1d2430"/><circle cx="28" cy="44" r="3.4" fill="#cfd6df"/><circle cx="92" cy="44" r="8" fill="#1d2430"/><circle cx="92" cy="44" r="3.4" fill="#cfd6df"/><rect x="108" y="34" width="6" height="3" rx="1.5" fill="#ffd36b"/></svg>`;
function garajeVacio(){
  if (!esHotel()) return vacio('car', 'El hotel todavía no cargó sus vans.');
  const paso = (n, ic, t, x) => `<li><span class="cv-n">${n}</span>${I(ic)}<span><b>${t}</b><small>${x}</small></span></li>`;
  return `<div class="cochera"><div class="cv-cielo" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>
    <div class="cv-cab"><small>${I('car')} Cochera del hotel</small><h3>Cargá tus vans y que pasen solas</h3>
      <p>Cada van tiene su QR en el parabrisas: la garita la reconoce al instante y vos ves desde acá si está adentro o afuera.</p></div>
    <div class="cv-ruta" aria-hidden="true">${VAN_SVG}<span class="cv-barrera"><i></i></span></div>
    <ol class="cv-pasos">${paso(1, 'edit', 'Patente y chofer', 'Un minuto por van')}${paso(2, 'qr', 'Imprimí su QR', 'Para el parabrisas')}${paso(3, 'shield', 'Pasa con un toque', 'La garita anota todo')}</ol>
    <button class="cv-btn" data-a="hvan-editar">${I('plus')}Cargar la primera van</button></div>`;
}
/* La credencial de la van, la misma arriba del formulario y en vivo. */
/* AB123CD → "AB 123 CD" (Mercosur); ABC123 → "ABC 123" (la vieja). */
const chapaTexto = t => { const p = normPatente(t); return /^[A-Z]{2}\d{3}[A-Z]{2}$/.test(p) ? `${p.slice(0, 2)} ${p.slice(2, 5)} ${p.slice(5)}` : /^[A-Z]{3}\d{3}$/.test(p) ? `${p.slice(0, 3)} ${p.slice(3)}` : p; };
function credVan(v){
  const pat = chapaTexto(v.patente || '') || 'AB 123 CD', pl = Math.max(0, Math.min(60, +v.plazas || 0));
  return `<div class="cv-cred" id="cvCred"><div class="cv-cred-top"><span class="cv-cred-ic">${VAN_SVG}</span>
      <span class="grow"><small>${HOTEL_NOMBRE}</small><b data-cv="nombre">${esc(v.nombre || 'Van 1')}</b><span data-cv="modelo">${esc(v.modelo || 'Modelo y color')}</span></span></div>
    <div class="cv-chapa"><small>REPÚBLICA ARGENTINA</small><b data-cv="patente">${esc(pat)}</b></div>
    <div class="cv-cred-pie"><span>${I('users')}<b data-cv="plazas">${pl || '—'}</b> plazas</span><span>${I('user')}<b data-cv="chofer">${esc(v.chofer || 'Sin chofer habitual')}</b></span></div></div>`;
}
A['hvan-editar'] = el => {
  if (!soloHotel()) return;
  const v = hotelVans().find(x => x.id === el.dataset.id) || {};
  hoja(v.id ? 'Editar van' : 'Nueva van', `<form data-f="hvan" class="cv-form" data-id="${esc(v.id || '')}">
    ${credVan(v)}
    <p class="cv-sec">${I('car')} La van</p>
    <div class="grid2"><div class="field"><label>Nombre</label><input name="nombre" required maxlength="30" value="${esc(v.nombre || '')}" placeholder="Van 1" data-cv-in="nombre"></div>
      <div class="field"><label>Patente</label><input name="patente" required maxlength="10" class="cv-pat-in" value="${esc(v.patente || '')}" placeholder="AB 123 CD" autocapitalize="characters" data-cv-in="patente"></div></div>
    <div class="grid2"><div class="field"><label>Modelo y color</label><input name="modelo" maxlength="40" value="${esc(v.modelo || '')}" placeholder="Mercedes Sprinter blanca" data-cv-in="modelo"></div>
      <div class="field"><label>Plazas</label><div class="cv-plazas"><button type="button" class="icon-btn" data-a="hvan-plazas" data-v="-1" aria-label="Una plaza menos">−</button><input name="plazas" type="number" min="1" max="60" value="${esc(v.plazas || 15)}" data-cv-in="plazas" inputmode="numeric"><button type="button" class="icon-btn" data-a="hvan-plazas" data-v="1" aria-label="Una plaza más">+</button></div></div></div>
    <p class="cv-sec">${I('user')} El chofer</p>
    <div class="grid2"><div class="field"><label>Chofer habitual</label><input name="chofer" maxlength="40" value="${esc(v.chofer || '')}" data-cv-in="chofer"></div>
      <div class="field"><label>Celular del chofer</label><input name="telChofer" inputmode="tel" maxlength="20" value="${esc(v.telChofer || '')}"></div></div>
    <p class="muted tiny" style="margin:4px 2px 12px">${I('qr')} Al guardarla se arma su QR para el parabrisas: lo imprimís desde "Vans y traslados".</p>
    <button class="btn btn-pri btn-block">${I('check')}${v.id ? 'Guardar los cambios' : 'Guardar la van'}</button>
    ${v.id ? `<button type="button" class="btn btn-danger-soft btn-block" style="margin-top:8px" data-a="hvan-baja" data-id="${esc(v.id)}">${I('trash')}Dar de baja esta van (su QR deja de valer)</button>` : ''}</form>`);
};
A['hvan-plazas'] = el => {
  const i = el.closest('.cv-plazas')?.querySelector('input'); if (!i) return;
  i.value = Math.max(1, Math.min(60, (+i.value || 0) + (+el.dataset.v || 0))); i.dispatchEvent(new Event('input', { bubbles:true }));
};
/* La credencial se arma mientras se escribe. */
document.addEventListener('input', e => {
  const i = e.target.closest && e.target.closest('[data-cv-in]'); if (!i) return;
  const k = i.dataset.cvIn, c = document.getElementById('cvCred'), out = c && c.querySelector(`[data-cv="${k}"]`); if (!out) return;
  const v = String(i.value || '').trim();
  out.textContent = k === 'patente' ? (chapaTexto(v) || 'AB 123 CD') : k === 'plazas' ? (v || '—') : k === 'nombre' ? (v || 'Van 1') : k === 'modelo' ? (v || 'Modelo y color') : (v || 'Sin chofer habitual');
  if (k === 'patente') out.parentElement.classList.toggle('lista', !!v);
});
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
        <small>${v ? `${esc(v.nombre)} · <span class="mono">${esc(v.patente || '')}</span>` : 'van sin asignar'}${choferDe(x) ? ' · ' + esc(choferDe(x)) : ''} · ${plural(+x.pax || 0, 'pasajero')}${curso && x.salioAt ? ` · salió ${hora(x.salioAt)} h` : ''}${tarde ? ' · <b>se atrasó</b>' : ''}</small>
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

/* =========================================================
   + TRASLADO: UN SOLO BOTÓN, DOS CAMINOS (pedido de Claudio, 12-10-2026:
   "tiene un botón +Traslado arriba y otro abajo; que adentro empiece con
   NUEVO TRASLADO o TRASLADOS AUTOMATIZADOS").
     · Nuevo traslado: uno solo, un día y una hora (como siempre).
     · Traslados automatizados: las salidas y entradas que el hotel hace
       siempre (todos los días, o los días que elija, a la misma hora). Se
       cargan una vez y la app arma sola el traslado de cada día, con su
       van y su chofer, una semana para adelante. Se editan, se pausan y se
       borran; un día suelto se cancela o se cambia sin tocar los demás.
   Si viene de un vuelo, un crucero o un evento (`data-v` con lo que ya se
   sabe: "vuelo|AR1881|D|15:40|13:30", "crucero|<barco>|buscar|<fecha>|<sale>",
   "evento|<título>|llevar|<fecha>|<hora>"), va directo al traslado suelto.
   ========================================================= */
A['hviaje-nuevo'] = el => {
  if (!soloHotel()) return;
  const [t, a, b, c, dd] = String(el?.dataset?.v || '').split('|');
  if (!t){
    const rs = hotelRutinas(), act = rs.filter(r => r.activa !== false).length;
    return hoja('Agregar un traslado', `<div class="tr-elige">
      <button class="tr-op uno" data-a="hviaje-uno"><span class="tr-op-arte" aria-hidden="true"><i class="tr-pin"></i>${I('car')}</span>
        <span class="tr-op-txt"><small>Una sola vez</small><b>Nuevo traslado</b><span>Un día y una hora: un vuelo, un crucero, una excursión.</span></span>${I('right')}</button>
      <button class="tr-op auto" data-a="abrir" data-v="hotel-rutinas"><span class="tr-op-arte" aria-hidden="true"><i class="tr-giro"></i>${I('refresh')}</span>
        <span class="tr-op-txt"><small>Se repiten solos</small><b>Traslados automatizados</b><span>${rs.length ? `${plural(act, 'activo', 'activos')}${rs.length > act ? ` · ${rs.length - act} en pausa` : ''} · ` : ''}Todos los días o los que elijas, a la misma hora, con su van y su chofer.</span></span>${I('right')}</button>
    </div>`);
  }
  const x = { fecha:hoyISO(), sale:'', destino:'aeropuerto', sentido:'llevar', ref:{ tipo:'' }, pax:1, vanId:'' };
  if (t === 'vuelo'){ Object.assign(x, { sentido: b === 'A' ? 'buscar' : 'llevar', sale:dd || '', ref:{ tipo:'vuelo', nro:a, sentido:b, hora:c } }); }
  if (t === 'crucero'){ Object.assign(x, { destino:'puerto', sentido:b, fecha:c || hoyISO(), sale:dd || '', ref:{ tipo:'crucero', barco:a } }); }
  if (t === 'evento'){ Object.assign(x, { destino:'centro', fecha:c || hoyISO(), sale:dd || '', ref:{ tipo:'evento', desc:a } }); }
  formViaje(x);
};
A['hviaje-uno'] = () => { if (soloHotel()) formViaje({ fecha:hoyISO(), sale:'', destino:'aeropuerto', sentido:'llevar', ref:{ tipo:'' }, pax:1, vanId:'' }); };
A['hviaje-editar'] = el => { if (!soloHotel()) return; const x = hotelViajes().find(v => v.id === el.dataset.id); if (x) formViaje(x); };
/* Los choferes que el hotel ya usó (de las vans y de los traslados), para elegir sin escribir. */
const choferesHotel = () => [...new Set([...vansReales().map(v => v.chofer), ...aLista(Store.s.hotelViajes).map(x => x && x.chofer)].map(x => String(x || '').trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es'));
const choferDe = x => (x && x.chofer) || hotelVans().find(v => v.id === x?.vanId)?.chofer || '';
const campoChofer = (v = '') => `<div class="field"><label>Chofer</label><input name="chofer" maxlength="40" list="hChoferes" value="${esc(v)}" placeholder="El habitual de la van" autocomplete="off"><datalist id="hChoferes">${choferesHotel().map(c => `<option value="${esc(c)}">`).join('')}</datalist></div>`;
function formViaje(x){
  const vans = vansReales(), r = x.deRutina ? hotelRutinas().find(z => z.id === x.deRutina) : null;
  hoja(x.id ? 'Editar traslado' : 'Nuevo traslado', `<form data-f="hviaje" data-id="${esc(x.id || '')}">
    ${r ? `<div class="tr-de-rutina">${I('refresh')}<span>Es de un traslado automatizado (<b>${esc(nombreRutina(r))}</b>). Lo que cambies acá vale solo para el ${fechaCorta(x.fecha)}. <button type="button" class="link" data-a="hrutina-editar" data-id="${esc(r.id)}">Cambiarlo todos los días</button></span></div>` : ''}
    ${x.ref && x.ref.tipo && x.ref.tipo !== 'rutina' ? `<div class="card plana small">${I(x.ref.tipo === 'vuelo' ? 'send' : x.ref.tipo === 'crucero' ? 'drop' : 'star')} ${esc(x.ref.tipo === 'vuelo' ? `Vuelo ${x.ref.nro}${x.ref.hora ? ' · ' + x.ref.hora + ' h' : ''} (${x.ref.sentido === 'A' ? 'llega' : 'sale'})` : x.ref.tipo === 'crucero' ? conMayusculasBarco(x.ref.barco) : x.ref.desc)}${x.sale ? ` · la hora de salida ya está calculada con la ficha del hotel` : ''}</div>` : ''}
    <input type="hidden" name="ref" value="${esc(JSON.stringify(x.ref || {}))}">
    <div class="grid2"><div class="field"><label>Qué</label><select name="sentido"><option value="llevar" ${x.sentido === 'llevar' ? 'selected' : ''}>Llevar</option><option value="buscar" ${x.sentido === 'buscar' ? 'selected' : ''}>Buscar</option></select></div>
      <div class="field"><label>A dónde</label><select name="destino">${Object.entries(DESTINOS_HOTEL).map(([k, d]) => `<option value="${k}" ${x.destino === k ? 'selected' : ''}>${d[0]}</option>`).join('')}</select></div></div>
    <div class="grid3"><div class="field"><label>Día</label><input type="date" name="fecha" required value="${esc(x.fecha)}"></div>
      <div class="field"><label>Sale la van</label><input type="time" name="sale" value="${esc(x.sale || '')}"></div>
      <div class="field"><label>Pasajeros</label><input type="number" name="pax" min="0" max="60" value="${esc(x.pax || 1)}"></div></div>
    <div class="grid2"><div class="field"><label>Van</label><select name="vanId"><option value="">Sin asignar todavía</option>${vans.map(v => `<option value="${esc(v.id)}" ${x.vanId === v.id ? 'selected' : ''}>${esc(v.nombre)} · ${esc(v.patente)}</option>`).join('')}</select></div>
      ${campoChofer(x.chofer || '')}</div>
    <div class="field"><label>Nota (opcional)</label><input name="nota" maxlength="120" value="${esc(x.nota || '')}" placeholder="Ej: grupo de 4, con equipaje de esquí"></div>
    <button class="btn btn-pri btn-block">${I('check')}Guardar el traslado</button>
    ${x.id ? `<div class="btns" style="margin-top:8px"><button type="button" class="btn btn-sec grow" data-a="hviaje-cancelar" data-id="${esc(x.id)}">${I('x')}${r ? 'Cancelar solo este día' : 'Cancelar el traslado'}</button>
      <button type="button" class="btn btn-danger-soft grow" data-a="hviaje-borrar" data-id="${esc(x.id)}">${I('trash')}Borrar</button></div>` : ''}</form>`);
}
F['hviaje'] = (d, form) => {
  if (!soloHotel()) return;
  let ref = {}; try { ref = JSON.parse(d.ref || '{}') || {}; } catch(e){}
  const id = form.dataset.id;
  Store.cambiar(s => { s.hotelViajes = aLista(s.hotelViajes);
    const datos = { fecha:d.fecha, sale:d.sale || '', destino:d.destino, sentido:d.sentido, pax:+d.pax || 0, vanId:d.vanId || '', chofer:(d.chofer || '').trim(), nota:(d.nota || '').trim() };
    const x = id && s.hotelViajes.find(v => v.id === id);
    if (x){ if (x.sale !== datos.sale) datos.saleAMano = true; if (x.deRutina) datos.aMano = true; Object.assign(x, datos); }
    else s.hotelViajes.push({ id:'ht' + uid(), ref, estado:'programado', at:Date.now(), ...datos });
    /* Si es de hoy, la garita lo tiene que saber. */
    if (datos.fecha === hoyISO()) notificar(s, { para:'rol:guardia', titulo:'Traslado del hotel', texto:`${datos.sale || 'Sin hora'} · ${textoViaje({ ...datos, ref })}`, icon:'car', color:'wood', link:'hotel-vivo', push:false });
  });
  cerrarHoja(); toast('Traslado guardado', 'car');
};
A['hviaje-ajustar'] = el => { if (!soloHotel()) return; Store.cambiar(s => { const x = aLista(s.hotelViajes).find(v => v.id === el.dataset.id); if (x){ x.sale = el.dataset.v; x.saleAMano = false; } }); toast(`La van sale a las ${el.dataset.v}`, 'clock'); };
A['hviaje-cancelar'] = el => { if (!soloHotel()) return; Store.cambiar(s => { const x = aLista(s.hotelViajes).find(v => v.id === el.dataset.id); if (x) x.estado = 'cancelado'; }); cerrarHoja(); toast('Traslado cancelado', 'check'); };
/* Borrar del todo: sale de la lista. Si era de un traslado automatizado,
   queda una marca de "borrado" para que la app no lo vuelva a armar ese día. */
A['hviaje-borrar'] = async el => {
  if (!soloHotel()) return; const x = hotelViajes().find(v => v.id === el.dataset.id); if (!x) return;
  if (x.estado === 'en_curso') return toast('La van está en viaje: esperá a que vuelva o cancelalo después', 'car');
  if (!await confirmar('Borrar el traslado', `${esc(x.sale || '')} h · ${esc(textoViaje(x))}. ${x.deRutina ? 'Es de un traslado automatizado: se borra solo este día.' : 'Sale de la lista.'}`, { si:'Borrar', peligro:true })) return;
  Store.cambiar(s => { s.hotelViajes = aLista(s.hotelViajes);
    if (x.deRutina){ const y = s.hotelViajes.find(v => v.id === x.id); if (y){ y.estado = 'cancelado'; y.borrado = Date.now(); } }
    else s.hotelViajes = s.hotelViajes.filter(v => v && v.id !== x.id); });
  cerrarHoja(); toast('Traslado borrado', 'trash');
};

/* ---------- TRASLADOS AUTOMATIZADOS ---------- */
const DIAS_SEM = [1, 2, 3, 4, 5, 6, 0], INI_DIA = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];
const textoDias = ds => { const d = aLista(ds).map(Number); if (d.length === 7) return 'Todos los días'; const lv = [1, 2, 3, 4, 5];
  if (d.length === 5 && lv.every(x => d.includes(x))) return 'De lunes a viernes'; if (d.length === 2 && d.includes(6) && d.includes(0)) return 'Sábados y domingos';
  return DIAS_SEM.filter(x => d.includes(x)).map(x => DIAS[x]).join(', '); };
const nombreRutina = r => r.nombre || `${r.sentido === 'buscar' ? 'Buscar en' : 'Llevar a'} ${((DESTINOS_HOTEL[r.destino] || DESTINOS_HOTEL.otro)[0]).toLowerCase()} · ${r.sale || ''}`;
const rutinaVale = (r, f) => r && r.activa !== false && aLista(r.dias).map(Number).includes(fechaDe(f).getDay()) && (!r.desde || f >= r.desde) && (!r.hasta || f <= r.hasta);
/* Qué días de la semana que viene le falta su traslado a cada rutina. */
function rutinasQueFaltan(dias = 7){
  const hoy = hoyISO(), hay = new Set(aLista(Store.s.hotelViajes).map(x => x && x.id)), out = [];
  hotelRutinas().forEach(r => { for (let k = 0; k < dias; k++){ const f = sumarDias(hoy, k); if (rutinaVale(r, f) && !hay.has(`hr-${r.id}-${f}`)) out.push([r, f]); } });
  return out;
}
/* Arma (o pone al día) el traslado de cada día de cada rutina. Id fijo
   (hr-<rutina>-<fecha>): si dos equipos lo arman a la vez, queda uno. Los
   que el hotel cambió a mano, canceló o ya salieron no se tocan. */
function generarRutinas(s, dias = 7){
  const hoy = hoyISO(); let n = 0;
  s.hotelViajes = aLista(s.hotelViajes);
  const rs = s.hotelViajes.filter(x => x && x.rutina);
  rs.forEach(r => {
    const datos = { sale:r.sale || '', destino:r.destino, sentido:r.sentido, pax:+r.pax || 0, vanId:r.vanId || '', chofer:r.chofer || '', nota:r.nota || '' };
    for (let k = 0; k < dias; k++){
      const f = sumarDias(hoy, k), id = `hr-${r.id}-${f}`, x = s.hotelViajes.find(v => v && v.id === id);
      if (!rutinaVale(r, f)){
        /* Pausada, sin ese día o fuera de fechas: se saca lo que estaba armado y no empezó. */
        if (x && x.estado === 'programado' && !x.aMano){ s.hotelViajes = s.hotelViajes.filter(v => v !== x); n++; }
        continue;
      }
      if (!x){ s.hotelViajes.push({ id, deRutina:r.id, fecha:f, ref:{ tipo:'rutina', desc:r.nombre || '' }, estado:'programado', at:Date.now(), ...datos }); n++; continue; }
      if (x.estado !== 'programado' || x.aMano) continue;
      const cambia = Object.keys(datos).filter(k2 => String(x[k2] ?? '') !== String(datos[k2] ?? ''));
      if (cambia.length){ Object.assign(x, datos); n++; }
      if ((x.ref && x.ref.desc) !== (r.nombre || '')){ x.ref = { tipo:'rutina', desc:r.nombre || '' }; n++; }
    }
  });
  return n;
}
const proximaDeRutina = r => { const hoy = hoyISO(); for (let k = 0; k < 14; k++){ const f = sumarDias(hoy, k); if (rutinaVale(r, f) && !(k === 0 && minDe(r.sale) != null && minDe(r.sale) < ahoraMin())) return f; } return ''; };
R['hotel-rutinas'] = {
  titulo:'Traslados automatizados', icon:'refresh', color:'wood', ancha:true, sub:'Las salidas de siempre: se cargan una vez y se arman solas cada día',
  render(){
    const rs = hotelRutinas().sort((a, b) => (a.activa === false) - (b.activa === false) || String(a.sale).localeCompare(String(b.sale))), vans = hotelVans();
    const tarjeta = r => { const d = DESTINOS_HOTEL[r.destino] || DESTINOS_HOTEL.otro, van = vans.find(v => v.id === r.vanId), prox = proximaDeRutina(r), pausa = r.activa === false, ds = aLista(r.dias).map(Number);
      return `<article class="ru-card ${pausa ? 'pausa' : ''}">
        <div class="ru-cab"><span class="ru-hora"><b>${esc(r.sale || '—')}</b><small>sale</small></span>
          <span class="ru-ic">${I(d[1])}</span>
          <div class="grow"><b>${esc(nombreRutina(r))}</b><small>${r.sentido === 'buscar' ? 'Buscar en' : 'Llevar a'} ${esc(d[0].toLowerCase())} · ${plural(+r.pax || 0, 'pasajero')}${r.nota ? ' · ' + esc(r.nota) : ''}</small></div>
          <span class="pill ${pausa ? 'p-warn' : 'p-ok'}">${pausa ? 'En pausa' : 'Activo'}</span></div>
        <div class="ru-dias" aria-label="${esc(textoDias(ds))}">${DIAS_SEM.map(x => `<i class="${ds.includes(x) ? 'on' : ''}">${INI_DIA[x]}</i>`).join('')}<span>${esc(textoDias(ds))}</span></div>
        <div class="ru-datos"><span>${I('car')} ${van ? `${esc(van.nombre)} <span class="hp-chapa chica">${esc(chapaTexto(van.patente || ''))}</span>` : '<em>Van sin asignar</em>'}</span>
          <span>${I('user')} ${esc(r.chofer || van?.chofer || 'Chofer sin asignar')}</span>
          <span>${I('calendar')} ${r.desde && r.desde > hoyISO() ? 'Desde el ' + fechaCorta(r.desde) : 'Vigente'}${r.hasta ? ' hasta el ' + fechaCorta(r.hasta) : ', sin fecha de fin'}</span>
          ${!pausa && prox ? `<span class="ru-prox">${I('clock')} Próximo: ${prox === hoyISO() ? 'hoy' : esc(relDia(prox).toLowerCase())} a las ${esc(r.sale)} h</span>` : ''}</div>
        <div class="btns"><button class="btn btn-sm btn-pri" data-a="hrutina-editar" data-id="${esc(r.id)}">${I('edit')}Editar</button>
          <button class="btn btn-sm btn-sec" data-a="hrutina-pausa" data-id="${esc(r.id)}">${I(pausa ? 'refresh' : 'clock')}${pausa ? 'Reanudar' : 'Pausar'}</button>
          <button class="btn btn-sm btn-danger-soft" data-a="hrutina-borrar" data-id="${esc(r.id)}">${I('trash')}Borrar</button></div></article>`; };
    return `<div class="ru-hero"><div class="ru-hero-arte" aria-hidden="true"><span class="ru-orbita"><i>${I('car')}</i></span><b>${I('refresh')}</b></div>
        <div><b>Cargalos una vez y se arman solos</b><small>Cada traslado automatizado arma el de cada día, una semana para adelante, con su van y su chofer. La garita los ve en su lista de vans. Un día suelto lo cancelás o lo cambiás desde la lista de traslados, sin tocar los demás.</small></div></div>
      ${esHotel() ? superficie({ a:'hrutina-editar', icon:'plus', color:'wood', t:'Nuevo traslado automatizado', s:'Días, hora, destino, van y chofer', cls:'acento' }) : ''}
      ${rs.length ? `<div class="ru-lista">${rs.map(tarjeta).join('')}</div>` : vacio('refresh', 'Todavía no hay traslados automatizados. Ejemplo: "Aeropuerto de la mañana", de lunes a viernes a las 07:30.')}`;
  },
};
A['hrutina-editar'] = el => {
  if (!soloHotel()) return;
  const r = hotelRutinas().find(x => x.id === el?.dataset?.id) || { dias:[1, 2, 3, 4, 5], sale:'', destino:'aeropuerto', sentido:'llevar', pax:1, vanId:'', desde:hoyISO() }, vans = vansReales(), ds = aLista(r.dias).map(Number);
  hoja(r.id ? 'Editar el traslado automatizado' : 'Nuevo traslado automatizado', `<form data-f="hrutina" data-id="${esc(r.id || '')}">
    <div class="field"><label>Nombre (opcional)</label><input name="nombre" maxlength="40" value="${esc(r.nombre || '')}" placeholder="Ej: Aeropuerto de la mañana"></div>
    <div class="grid2"><div class="field"><label>Qué</label><select name="sentido"><option value="llevar" ${r.sentido === 'llevar' ? 'selected' : ''}>Llevar</option><option value="buscar" ${r.sentido === 'buscar' ? 'selected' : ''}>Buscar</option></select></div>
      <div class="field"><label>A dónde</label><select name="destino">${Object.entries(DESTINOS_HOTEL).map(([k, d]) => `<option value="${k}" ${r.destino === k ? 'selected' : ''}>${d[0]}</option>`).join('')}</select></div></div>
    <div class="field"><label>Qué días</label><div class="ru-rapidos"><button type="button" class="chip" data-a="hrutina-dias" data-v="1,2,3,4,5,6,0">Todos los días</button><button type="button" class="chip" data-a="hrutina-dias" data-v="1,2,3,4,5">Lunes a viernes</button><button type="button" class="chip" data-a="hrutina-dias" data-v="6,0">Fines de semana</button></div>
      <div class="seg dias-sel">${DIAS_SEM.map(d => `<label><input type="checkbox" name="dias" value="${d}" ${ds.includes(d) ? 'checked' : ''}><span>${DIAS[d]}</span></label>`).join('')}</div></div>
    <div class="grid2"><div class="field"><label>Sale la van</label><input type="time" name="sale" required value="${esc(r.sale || '')}"></div>
      <div class="field"><label>Pasajeros (aprox.)</label><input type="number" name="pax" min="0" max="60" value="${esc(r.pax || 1)}"></div></div>
    <div class="grid2"><div class="field"><label>Van</label><select name="vanId"><option value="">Sin asignar</option>${vans.map(v => `<option value="${esc(v.id)}" ${r.vanId === v.id ? 'selected' : ''}>${esc(v.nombre)} · ${esc(v.patente)}</option>`).join('')}</select></div>
      ${campoChofer(r.chofer || '')}</div>
    <div class="grid2"><div class="field"><label>Desde</label><input type="date" name="desde" value="${esc(r.desde || hoyISO())}" required></div>
      <div class="field"><label>Hasta (opcional)</label><input type="date" name="hasta" value="${esc(r.hasta || '')}"></div></div>
    <div class="field"><label>Nota (opcional)</label><input name="nota" maxlength="120" value="${esc(r.nota || '')}" placeholder="Ej: pasa también por el centro"></div>
    <p class="muted tiny" style="margin:0 0 12px">${I('refresh')} Al guardar se arman los traslados de los próximos 7 días. ${r.id ? 'Los días que ya cambiaste a mano, cancelaste o que ya salieron no se tocan.' : ''}</p>
    <button class="btn btn-pri btn-block">${I('check')}${r.id ? 'Guardar los cambios' : 'Guardar y armar los traslados'}</button></form>`);
};
A['hrutina-dias'] = el => { const f = el.closest('form'); if (!f) return; const v = String(el.dataset.v).split(',');
  f.querySelectorAll('input[name="dias"]').forEach(c => { c.checked = v.includes(c.value); }); };
F['hrutina'] = (d, form) => {
  if (!soloHotel()) return;
  const dias = [].concat(d.dias || []).map(Number);
  if (!dias.length) return toast('Elegí al menos un día', 'calendar');
  if (!d.sale) return toast('Poné la hora en que sale la van', 'clock');
  if (d.hasta && d.hasta < d.desde) return toast('La fecha "hasta" tiene que ser después de "desde"', 'calendar');
  const id = form.dataset.id;
  Store.cambiar(s => { s.hotelViajes = aLista(s.hotelViajes);
    const datos = { nombre:(d.nombre || '').trim(), dias:DIAS_SEM.filter(x => dias.includes(x)), sale:d.sale, destino:d.destino, sentido:d.sentido, pax:+d.pax || 0, vanId:d.vanId || '', chofer:(d.chofer || '').trim(), desde:d.desde || hoyISO(), hasta:d.hasta || '', nota:(d.nota || '').trim() };
    const r = id && s.hotelViajes.find(x => x && x.id === id && x.rutina);
    if (r) Object.assign(r, datos, { editado:Date.now() }); else s.hotelViajes.push({ id:'hr' + uid(), rutina:true, activa:true, at:Date.now(), ...datos });
    generarRutinas(s);
    auditar(s, r ? 'El hotel editó un traslado automatizado' : 'El hotel cargó un traslado automatizado', `${datos.nombre || datos.destino} · ${datos.sale} · ${textoDias(datos.dias)}`);
  });
  cerrarHoja(); if (PILA.at(-1)?.id !== 'hotel-rutinas') abrir('hotel-rutinas');
  toast(id ? 'Traslado automatizado actualizado' : 'Listo: se arma solo cada día', 'refresh');
};
A['hrutina-pausa'] = el => { if (!soloHotel()) return;
  let pausa = false;
  Store.cambiar(s => { const r = aLista(s.hotelViajes).find(x => x && x.id === el.dataset.id && x.rutina); if (!r) return; r.activa = r.activa === false; pausa = !r.activa; generarRutinas(s); });
  toast(pausa ? 'En pausa: no se arman más traslados hasta que lo reanudes' : 'Reanudado: se arman los de la semana', pausa ? 'clock' : 'refresh'); };
A['hrutina-borrar'] = async el => { if (!soloHotel()) return; const r = hotelRutinas().find(x => x.id === el.dataset.id); if (!r) return;
  if (!await confirmar('Borrar el traslado automatizado', `${esc(nombreRutina(r))} · ${esc(textoDias(r.dias))}. Se dejan de armar y se sacan los que estaban programados y no salieron. Los que ya se hicieron quedan.`, { si:'Borrar', peligro:true })) return;
  Store.cambiar(s => { s.hotelViajes = aLista(s.hotelViajes).filter(x => x && x.id !== r.id && !(x.deRutina === r.id && x.estado === 'programado' && x.fecha >= hoyISO() && !x.aMano));
    auditar(s, 'El hotel borró un traslado automatizado', `${nombreRutina(r)} · ${textoDias(r.dias)}`); });
  toast('Traslado automatizado borrado', 'trash');
};

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
/* El huésped que se va: queda en Ingresos de hoy y en el libro de guardia (10-10-2026). */
A['hhuesped-salida'] = el => {
  if (!soloGarita()) return;
  Store.cambiar(s => { const h = aLista(s.hotelHuespedes).find(x => x.id === el.dataset.id); if (!h || h.salida) return; h.salida = Date.now();
    s.bitacora.unshift({ id:uid(), autor:yo().id, tipo:'acceso', texto:`Egreso: huésped del hotel${h.patente ? ' · ' + h.patente : ''}`, at:Date.now() }); });
  cerrarHoja(); toast('Salida registrada', 'logout');
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
          <div class="btns" style="margin-top:8px">${esHotel() ? `<button class="btn btn-xs btn-sec" data-a="hprov-qr" data-id="${esc(p.id)}">${I('qr')}QR</button>` : ''}${esHotel() || esAdmin() ? `<button class="btn btn-xs btn-sec" data-a="hprov-editar" data-id="${esc(p.id)}">${I('edit')}Editar</button><button class="btn btn-xs btn-danger-soft" data-a="hprov-borrar" data-id="${esc(p.id)}">${I('trash')}Borrar</button>` : ''}
            ${esGuardia() && c !== 'danger' ? `<button class="btn btn-xs btn-ok" data-a="hprov-mov" data-id="${esc(p.id)}" data-v="in">${I('login')}Entra</button><button class="btn btn-xs btn-sec" data-a="hprov-mov" data-id="${esc(p.id)}" data-v="out">${I('logout')}Sale</button>` : ''}
            ${esAdmin() ? `<button class="btn btn-xs btn-sec" data-a="hprov-revisar" data-id="${esc(p.id)}">${I('check')}${p.revisado ? 'Quitar revisión' : 'Marcar revisado'}</button><button class="btn btn-xs ${p.estado === 'suspendido' ? 'btn-ok' : 'btn-danger-soft'}" data-a="hprov-suspender" data-id="${esc(p.id)}">${p.estado === 'suspendido' ? 'Rehabilitar' : 'Suspender'}</button>` : ''}</div></div>`; }).join('')
        : vacio('box', 'El hotel todavía no cargó proveedores.')}
      <p class="muted tiny" style="margin-top:12px">${I('info')} Con la ART vencida o sin cargar, la garita ve el proveedor en rojo y no lo deja pasar. La Administración puede suspenderlo.</p>`;
  },
};
/* La Administración también edita y borra los proveedores del hotel
   (pedido de Claudio, 11-10-2026); el hotel, además, los borra. */
const hotelOAdmin = () => esAdmin() || soloHotel();
A['hprov-editar'] = el => {
  if (!hotelOAdmin()) return;
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
  if (!hotelOAdmin()) return;
  const id = form.dataset.id;
  Store.cambiar(s => { s.hotelProv = aLista(s.hotelProv);
    const datos = { empresa:d.empresa.trim(), rubro:(d.rubro || '').trim(), personal:(d.personal || '').trim(), patentes:String(d.patentes || '').toUpperCase().trim(), tel:(d.tel || '').trim(),
      dias:[].concat(d.dias || []).map(Number), desde:d.desde || '', hasta:d.hasta || '', artVence:d.artVence || '', seguroVence:d.seguroVence || '' };
    const x = id && s.hotelProv.find(p => p.id === id);
    if (x){ Object.assign(x, datos); if (!esAdmin()) x.revisado = false; } else s.hotelProv.push({ id:'hp' + uid(), codigo:codigoLargo('H'), estado:'activo', at:Date.now(), ...datos });
    const quien = esAdmin() ? 'La Administración' : 'El hotel';
    auditar(s, id ? `${quien} editó un proveedor del hotel` : `${quien} cargó un proveedor del hotel`, datos.empresa);
    const h = hotelId(); if (esAdmin() && h) notificar(s, { para:[h], titulo:`La Administración ${id ? 'editó' : 'cargó'} a ${datos.empresa}`, texto:'Proveedores del hotel', icon:'box', color:'sky', link:'hotel-proveedores' }); });
  cerrarHoja(); toast('Proveedor guardado', 'box');
};
A['hprov-borrar'] = async el => {
  if (!hotelOAdmin()) return;
  const p = hotelProvs().find(x => x.id === el.dataset.id); if (!p) return;
  if (!await confirmar('Borrar el proveedor', `${esc(p.empresa)}. Su QR deja de servir en la garita. Los ingresos que ya tuvo quedan en la bitácora.`, { si:'Borrar', peligro:true })) return;
  Store.cambiar(s => { s.hotelProv = aLista(s.hotelProv).filter(x => x && x.id !== p.id);
    auditar(s, esAdmin() ? 'La Administración borró un proveedor del hotel' : 'El hotel borró un proveedor', p.empresa);
    const h = hotelId(); if (esAdmin() && h) notificar(s, { para:[h], titulo:`La Administración borró a ${p.empresa}`, texto:'Proveedores del hotel: su QR ya no sirve en la garita.', icon:'trash', color:'warn', link:'hotel-proveedores' }); });
  toast('Proveedor borrado', 'trash');
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
   REDISEÑO "EN VIVO" (pedido de Claudio, 12-10-2026: "más innovador e
   interactivo, con animaciones y colores vivos; al entrar se vuelven a
   repetir todas las ventanas que ya están en la sala del hotel").
   Ya no repite la sala: es un tablero de lo que pasa AHORA.
     · Arriba, el hotel de noche con el punto "EN VIVO" que late y cuatro
       anillos que se llenan (huéspedes, vans adentro, traslados hechos,
       proveedores al día), con los números que suben contando.
     · Lo próximo: la van que sale después, con su cuenta regresiva.
     · La ruta del día: el riel de 6 a 24 h y cada traslado en una línea
       de tiempo que se abre al tocarla.
     · Las vans dibujadas (la que está afuera, andando), el portón con los
       pasos por la garita y los eventos como entradas.
     · "Para resolver" aparece solo si hay algo pendiente.
   Ideas de tabler (41.8k★, tarjetas de estado) y animate.css (82k★); el
   código es propio. La garita y la supervisión, que no tienen la sala,
   conservan sus atajos al final.
   ========================================================= */
const anilloVivo = (p, c) => `<svg class="hvv-anillo" viewBox="0 0 36 36" aria-hidden="true" style="--c:${c}"><circle class="f" cx="18" cy="18" r="15.5"/><circle class="v" cx="18" cy="18" r="15.5" pathLength="100" style="--p:${Math.max(0, Math.min(100, Math.round(p)))}"/></svg>`;
R['hotel-vivo'] = {
  titulo:HOTEL_NOMBRE, icon:'star', color:'wood', ancha:true, sub:() => esGuardia() ? 'Vans, traslados, huéspedes y eventos de hoy' : 'En vivo · sin los nombres de los huéspedes',
  render(){
    const hoy = hoyISO(), vans = hotelVans(), vs = viajesDelDia(hoy), h = cuentaHotel(), info = hotelInfo(), c = Clima.d?.c;
    const evs = hotelEventos().filter(e => e.fecha >= hoy && e.fecha <= sumarDias(hoy, 7)).sort((a, b) => (a.fecha + (a.desde || '')).localeCompare(b.fecha + (b.desde || '')));
    const hs = esGuardia() ? hotelHuespedes().filter(x => x.desde <= hoy && x.hasta >= hoy) : [];
    const adentro = vans.filter(v => estadoVan(v).adentro).length, hechos = vs.filter(x => x.estado === 'hecho').length;
    const provs = hotelProvs(), provOk = provs.filter(p => estadoProv(p)[0] === 'ok').length;
    const movs = hotelMovs().filter(m => m.vanId && Date.now() - m.at < DIA).slice(0, 10);
    const promosPend = promosViejasPend().length, evPend = hotelEventos().filter(e => e.avisarVecinos && !e.publicado && e.fecha >= hoy).length;
    const provRev = provs.filter(p => !p.revisado || estadoProv(p)[0] === 'danger').length;
    const huesp = esGuardia() ? hs.reduce((a, x) => a + (+x.pax || 1), 0) : (info.huespedesHoy || 0);
    const kpi = (k, n, de, t, p, c2, v) => `<button type="button" class="hvv-kpi" data-a="abrir" data-v="${v}" style="--c:${c2}">${anilloVivo(p, c2)}
      <span class="hvv-kpi-n"><b class="dn-num" data-k="hvv-${k}" data-n="${n}">${n}</b>${de != null ? `<small>/${de}</small>` : ''}</span><span class="hvv-kpi-t">${t}</span></button>`;
    const pend = esAdmin() ? [promosPend && { v:'hotel-promos', ic:'sparkle', t:plural(promosPend, 'promoción para revisar', 'promociones para revisar') },
      evPend && { v:'hotel-eventos', ic:'star', t:plural(evPend, 'evento para avisar a los vecinos', 'eventos para avisar a los vecinos') },
      provRev && { v:'hotel-proveedores', ic:'box', t:plural(provRev, 'proveedor para revisar', 'proveedores para revisar') }].filter(Boolean) : [];
    const ticket = e => { const f = new Date(e.fecha + 'T12:00:00');
      return `<div class="he-ticket"><span class="he-talon"><small>${e.fecha === hoy ? 'hoy' : esc(f.toLocaleDateString('es-AR', { weekday:'short' }).replace('.', ''))}</small><b>${f.getDate()}</b><small>${esc(f.toLocaleDateString('es-AR', { month:'short' }).replace('.', ''))}</small></span>
        <span class="he-cuerpo"><b>${esc(e.titulo)}</b><small>${e.desde ? `${I('clock')} ${esc(e.desde)}${e.hasta ? '–' + esc(e.hasta) : ''} h` : ''} ${I('users')} ${plural(+e.asistentes || 0, 'invitado')}${e.publicado ? ' · avisado a los vecinos' : ''}</small></span></div>`; };
    return `${!h ? aviso('info', 'star', 'El hotel todavía no tiene su cuenta', esAdmin() ? 'Se crea en "Cuenta del hotel", en la sala del hotel.' : 'La crea la Administración.') : ''}
      <section class="hvv-hero">
        <div class="hvv-cielo" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i></div>
        <div class="hvv-cab"><img src="img/logo-noche.png" alt="" width="46" height="46">
          <div class="grow"><span class="hvv-vivo"><i></i>EN VIVO</span><b>${HOTEL_NOMBRE}</b><small>${fechaLarga(hoy)} · ${hhmmDe(ahoraMin())} h</small></div>
          ${c ? `<span class="hvv-clima"><b>${Math.round(c.temperature_2m)}°</b><small>${Clima.cod(c.weather_code)[0]}</small></span>` : ''}</div>
        <div class="hvv-kpis">
          ${kpi('hues', huesp, null, esGuardia() ? 'huéspedes hoy' : 'huéspedes', huesp ? 100 : 0, '#ffb46b', 'hotel-huespedes')}
          ${kpi('vans', adentro, vans.length, 'vans adentro', vans.length ? adentro / vans.length * 100 : 0, '#5ee0a0', 'hotel-traslados')}
          ${kpi('tras', hechos, vs.length, 'traslados hechos', vs.length ? hechos / vs.length * 100 : 0, '#7fc8ff', 'hotel-traslados')}
          ${kpi('prov', provOk, provs.length, 'proveedores al día', provs.length ? provOk / provs.length * 100 : 0, '#c9a7ff', 'hotel-proveedores')}</div>
      </section>
      ${pend.length ? `<section class="hvv-pend"><b>${I('alert')} Para resolver</b>${pend.map(x => `<button type="button" class="hvv-pend-b" data-a="abrir" data-v="${x.v}">${I(x.ic)}<span>${esc(x.t)}</span>${I('right')}</button>`).join('')}</section>` : ''}
      <section class="bloque">${proximaVan(vs)}</section>
      <section class="bloque">${sec('La ruta de hoy', `<button class="link" data-a="abrir" data-v="hotel-traslados">Todos los días</button>`)}
        <div class="card hl-caja">${rielDia(vs, hoy)}${lineaTraslados(vs, { dia:hoy })}</div></section>
      ${esGuardia() ? `<section class="bloque">${sec(`Huéspedes por llegar (${hs.filter(x => x.desde === hoy && !x.ingreso).length})`, `<button class="link" data-a="abrir" data-v="hotel-huespedes">Lista completa</button>`)}${hs.filter(x => x.desde === hoy && !x.ingreso).length ? `<div class="card lista">${hs.filter(x => x.desde === hoy && !x.ingreso).map(x => `<div class="it"><div class="txt"><b>${esc(x.nombre)}</b><span>${x.patente ? esc(x.patente) + ' · ' : ''}${plural(+x.pax || 1, 'persona')}</span></div><button class="btn btn-xs btn-ok" data-a="hhuesped-ingreso" data-id="${esc(x.id)}">${I('login')}Ingresó</button></div>`).join('')}</div>` : `<div class="card plana small">${I('check')} No quedan huéspedes por llegar hoy.</div>`}</section>` : ''}
      <section class="bloque hv-dos">
        <div>${sec('Las vans ahora')}${vans.length ? `<div class="hp-vans">${vans.map(v => vanViva(v)).join('')}</div>` : vacio('car', 'El hotel no cargó vans.')}</div>
        <div>${sec('Pasos por la garita', '<span class="muted small">últimas 24 h</span>')}${portonHotel(movs)}</div>
      </section>
      ${evs.length ? `<section class="bloque">${sec('Eventos del hotel', '<span class="muted small">próximos 7 días</span>')}<div class="he-lista">${evs.map(ticket).join('')}</div></section>` : ''}
      ${!esAdmin() ? `<section class="bloque">${sec('Atajos')}<div class="hvv-atajos">
        ${esGuardia() ? `<button type="button" data-a="abrir" data-v="hotel-huespedes">${I('users')}Huéspedes</button>` : ''}
        <button type="button" data-a="abrir" data-v="hotel-proveedores">${I('box')}Proveedores</button>
        <button type="button" data-a="abrir" data-v="hotel-eventos">${I('star')}Eventos</button>
        <button type="button" data-a="abrir" data-v="hotel-emergencias">${I('siren')}Emergencias</button>
        ${h && esGuardia() ? `<button type="button" data-a="abrir" data-v="privado" data-p="guardia|${esc(h.id)}">${I('chat')}Mensajes</button>` : ''}</div></section>` : ''}
      <p class="muted tiny" style="margin-top:12px">${I('lock')} ${esAdmin() ? 'La Administración ve cuántos huéspedes hay, nunca sus nombres (Ley 25.326). Lo demás del hotel está en su sala, en el Día a día.' : 'Los huéspedes los ven solo el hotel y la garita, y se borran solos al día siguiente del check-out.'}</p>`;
  },
  alPintar(){ if (typeof animarNumeros === 'function') animarNumeros(); },
};
/* La banda del hotel en la portada de la garita: eventos y huéspedes que
   llegan hoy. Las vans y sus traslados tienen su propia solapa
   (bandaVansGarita), para marcar salidas y regresos a un toque. */
/* LA TARJETA DEL HOTEL EN LA GARITA (rediseño pedido por Claudio, 07-10-2026)
   Antes eran dos renglones con enlaces grises. Ahora: un encabezado con la
   identidad del hotel, tres números grandes que se tocan (llegan hoy,
   eventos, vans en el barrio) y, abajo, lo que la garita tiene que hacer:
   cada huésped que llega con su botón "Ingresó" y cada evento con su hora. */
function bandaHotel(opera){
  const hoy = hoyISO(), ev = hotelEventos().filter(e => e.fecha === hoy).sort((a, b) => String(a.desde).localeCompare(String(b.desde)));
  const hs = hotelHuespedes().filter(x => x.desde === hoy), falta = hs.filter(x => !x.ingreso), vans = hotelVans(), adentro = vans.filter(v => estadoVan(v).adentro).length;
  if (!ev.length && !hs.length) return '';
  const kpi = (v, n, t, cls = '') => `<button type="button" class="hg-kpi ${cls}" data-a="abrir" data-v="${v}"><b>${n}</b><span>${t}</span></button>`;
  const llega = h => `<div class="hg-fila"><span class="hg-av">${esc(String(h.nombre || '?').trim().charAt(0).toUpperCase())}</span>
      <div class="grow"><b>${esc(h.nombre)}${+h.pax > 1 ? ` <small>+${+h.pax - 1}</small>` : ''}</b><small>${h.llegaVuelo ? `${I('send')} vuelo ${esc(h.llegaVuelo)}` : 'llega hoy'}${h.patente ? ` · <span class="mono">${esc(h.patente)}</span>` : ''}</small></div>
      ${opera ? `<button class="btn btn-sm btn-ok" data-a="hhuesped-ingreso" data-id="${esc(h.id)}">${I('login')}Ingresó</button>` : '<span class="pill p-sky">Esperado</span>'}</div>`;
  const evento = e => `<div class="hg-fila"><span class="hg-hora">${esc(e.desde || '—')}</span>
      <div class="grow"><b>${esc(e.titulo)}</b><small>${e.hasta ? 'hasta las ' + esc(e.hasta) + ' h · ' : ''}${plural(+e.asistentes || 0, 'invitado')}</small></div>${I('star')}</div>`;
  return `<section class="hotel-garita">
    <header class="hg-cab"><span class="hg-sello">${I('star')}</span>
      <div class="grow"><small>Hoy en el hotel</small><b>${HOTEL_NOMBRE}</b></div>
      <button type="button" class="hg-vivo" data-a="abrir" data-v="hotel-vivo">${I('eye')}En vivo</button></header>
    <div class="hg-kpis">${kpi('hotel-huespedes', falta.length, falta.length === 1 ? 'huésped por llegar' : 'huéspedes por llegar', falta.length ? 'activo' : '')}
      ${kpi('hotel-eventos', ev.length, ev.length === 1 ? 'evento hoy' : 'eventos hoy', ev.length ? 'activo' : '')}
      ${kpi('hotel-vivo', vans.length ? `${adentro}<small>/${vans.length}</small>` : '—', 'vans en el barrio')}</div>
    ${falta.length ? `<div class="hg-bloque"><div class="hg-tit">Llegan hoy</div>${falta.slice(0, 4).map(llega).join('')}${falta.length > 4 ? `<button type="button" class="hg-mas" data-a="abrir" data-v="hotel-huespedes">Ver los ${falta.length} huéspedes ${I('right')}</button>` : ''}</div>` : ''}
    ${ev.length ? `<div class="hg-bloque"><div class="hg-tit">Eventos</div>${ev.map(evento).join('')}</div>` : ''}
    ${hs.length && !falta.length ? `<p class="hg-listo">${I('check')} Ya ingresaron los ${plural(hs.length, 'huésped', 'huéspedes')} de hoy</p>` : ''}
  </section>`;
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
  s.hotelViajes = [{ id:'ht1', vanId:'hv1', fecha:h, sale:'17:30', destino:'puerto', sentido:'llevar', ref:{ tipo:'crucero', barco:'Ushuaia expedition' }, pax:6, huespedes:[], nota:'', estado:'programado', at:n - DIA },
    { id:'hr1', rutina:true, activa:true, nombre:'Aeropuerto de la mañana', dias:[1, 2, 3, 4, 5], sale:'07:30', destino:'aeropuerto', sentido:'llevar', pax:6, vanId:'hv1', chofer:'Ramón', desde:D(-10), hasta:'', nota:'', at:n - 10 * DIA },
    { id:'hr2', rutina:true, activa:true, nombre:'Centro, ida y vuelta', dias:[1, 2, 3, 4, 5, 6, 0], sale:'19:00', destino:'centro', sentido:'llevar', pax:8, vanId:'hv2', chofer:'Julio', desde:D(-10), hasta:'', nota:'Vuelve a las 23 h', at:n - 10 * DIA }];
  generarRutinas(s);
  s.hotelEventos = [{ id:'he1', titulo:'Cena de gala del congreso', tipo:'cena', asistentes:80, fecha:D(1), desde:'20:30', hasta:'01:00', ingreso:'Con la van del hotel desde el centro', estacionamiento:'Dentro del predio del hotel', musicaHasta:'00:30', nota:'', avisarVecinos:true, at:n - DIA }];
  s.hotelProv = [
    { id:'hp1', empresa:'Lavandería Austral', rubro:'Lavandería', personal:'Carlos Díaz', patentes:'AB111CD', tel:'', dias:[1, 3, 5], desde:'08:00', hasta:'12:00', artVence:D(120), seguroVence:D(200), codigo:'H-PRV1DEMO', estado:'activo', revisado:true, at:n - 20 * DIA },
    { id:'hp2', empresa:'Pescados del Beagle', rubro:'Alimentos', personal:'Nora Paz', patentes:'', tel:'', dias:[2, 4], desde:'07:00', hasta:'10:00', artVence:D(5), seguroVence:'', codigo:'H-PRV2DEMO', estado:'activo', revisado:false, at:n - 5 * DIA },
  ];
  s.hotelPromos = [{ id:'hpr1', titulo:'Almuerzo de domingo para vecinos', detalle:'Menú de pasos con cordero fueguino', descuento:'15 %', desde:h, hasta:D(30), url:'', estado:'propuesta', at:n - HORA }];
  s.hotelDemoV = 1;
}
/* El cartel del ejemplo, arriba de cada ventana del hotel; y, si se ocultó,
   el enlace para volver a verlo (solo mientras no haya nada cargado). */
function bannerEjemplo(){
  if (!HotelEjemplo.puedeVerlo() || HotelEjemplo.hayReal()) return '';
  if (HotelEjemplo.oculto()) return `<p class="hej-otra"><button type="button" class="link" data-a="hotel-ejemplo" data-v="si">${I('eye')}Ver cómo se ve el hotel con datos de ejemplo</button></p>`;
  return `<div class="hej-banda"><span class="hej-sello">EJEMPLO</span><div class="grow"><b>Así se ve el hotel funcionando</b><small>${esHotel() ? 'Vans, traslados, huéspedes y eventos inventados para que veas cómo anda todo. Desaparecen solos apenas cargues tu primera van, traslado, huésped, evento o proveedor.' : 'El hotel todavía no cargó nada propio: esto es un ejemplo para ver cómo funciona. Desaparece solo cuando el hotel carga lo suyo. La garita no lo ve.'}</small></div>
    <button type="button" class="hej-ocultar" data-a="hotel-ejemplo" data-v="no">Ocultar</button></div>`;
}
A['hotel-ejemplo'] = el => { try { if (el.dataset.v === 'no') localStorage.setItem(HotelEjemplo.KEY, 'no'); else localStorage.removeItem(HotelEjemplo.KEY); } catch(e){} refrescar(); };
['hotel', 'hotel-vivo', 'hotel-traslados', 'hotel-rutinas', 'hotel-vuelos', 'hotel-huespedes', 'hotel-eventos', 'hotel-proveedores'].forEach(k => {
  const r0 = R[k] && R[k].render; if (!r0) return;
  R[k].render = function(...a){ const h = r0.apply(this, a); return h.includes('hej-banda') || h.includes('hej-otra') ? h : bannerEjemplo() + h; };
});
/* Nada del ejemplo se edita, se borra ni se registra. */
['hvan-editar', 'hvan-baja', 'hvan-qr', 'hvan-mov', 'hviaje-editar', 'hviaje-cancelar', 'hviaje-borrar', 'hviaje-ajustar', 'hviaje-mov', 'hhuesped-editar', 'hhuesped-borrar', 'hhuesped-ingreso', 'hhuesped-salida',
  'hevento-editar', 'hevento-cancelar', 'hevento-publicar', 'hprov-editar', 'hprov-borrar', 'hprov-qr', 'hprov-revisar', 'hprov-suspender', 'hprov-mov', 'hrutina-editar', 'hrutina-pausa', 'hrutina-borrar'].forEach(k => {
  const a0 = A[k]; if (!a0) return;
  A[k] = function(el, ...r){ if (el && el.dataset && esEjemplo(el.dataset.id)) return avisoEjemplo(); return a0.call(this, el, ...r); };
});
