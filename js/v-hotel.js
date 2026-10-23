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
  /* (23-10-2026) Una salida de un día anterior que nadie cerró ya no deja la
     van "afuera para siempre": las vans entran y salen solas con la oblea,
     así que a la mañana siguiente se la da por adentro (supuesto). */
  if (m && m.tipo === 'out' && isoDe(new Date(m.at)) < hoyISO()) return { adentro:true, desde:m.at, mov:m, supuesto:true };
  return !m ? { adentro:true, desde:0, sin:true } : { adentro:m.tipo === 'in', desde:m.at, mov:m };
}
/* ¿CUÁNDO VUELVE LA VAN? (pedido de Claudio, 22-10-2026: "la Van 2 que
   muestra afuera, ¿cómo sé dónde está?"). La app no tiene GPS: sabe que
   salió por la garita y con qué traslado. Con eso y los tiempos de la
   Ficha del hotel estima el regreso:
     · aeropuerto o puerto, llevar: ida y vuelta más 10 min para bajar;
     · aeropuerto, buscar: aterriza + espera + viaje de vuelta;
     · puerto, buscar: ida y vuelta más el desembarque;
     · centro, excursión u otro: la hora de "Vuelve a las…" del traslado
       (o de la nota, "Vuelve a las 23 h"); si no la tiene, no se inventa.
   Devuelve 'HH:MM' o ''. */
function regresoViaje(x, info = hotelInfo()){
  if (!x) return '';
  if (x.vuelve) return x.vuelve;
  const m = String(x.nota || '').match(/vuelve\s+(?:a\s+las\s+)?(\d{1,2})(?:[:.](\d{2}))?/i);
  if (m) return `${String(+m[1] % 24).padStart(2, '0')}:${m[2] || '00'}`;
  const sale = x.salioAt ? new Date(x.salioAt).getHours() * 60 + new Date(x.salioAt).getMinutes() : minDe(x.sale);
  if (sale == null) return '';
  const aero = +info.trayAero || 20, puerto = +info.trayPuerto || 15;
  if (x.destino === 'aeropuerto'){
    if (x.sentido !== 'buscar') return hhmmDe(sale + 2 * aero + 10);
    const at = x.ref && x.ref.hora ? minDe(x.ref.hora) : null;
    return hhmmDe(at != null ? Math.max(sale + aero, at + (+info.esperaArribo || 15)) + aero : sale + 2 * aero + 30);
  }
  if (x.destino === 'puerto') return hhmmDe(sale + 2 * puerto + (x.sentido === 'buscar' ? (+info.desembarque || 45) : 10));
  return '';
}
/* Lo que se sabe de una van afuera: el traslado en viaje, a qué hora salió
   y cuándo vuelve (con "se atrasó" si pasaron 20 min de esa hora). */
function vanAfuera(v, e = estadoVan(v)){
  if (e.adentro) return null;
  const x = viajesDelDia().find(y => y.vanId === v.id && y.estado === 'en_curso') || null;
  const vuelve = regresoViaje(x), t = minDe(vuelve);
  return { x, que: x ? textoViaje(x) : (e.mov && e.mov.viaje) || '', salio: e.desde ? hora(e.desde) : '', vuelve, tarde: t != null && ahoraMin() > t + 20 };
}
const DESTINOS_HOTEL = { aeropuerto:['Aeropuerto', 'send'], puerto:['Puerto', 'barco'], centro:['Centro', 'pin'], excursion:['Excursión', 'tree'], otro:['Otro', 'car'] };
const ESTADO_VIAJE = { programado:['Programado', 'sky'], en_curso:['En viaje', 'warn'], hecho:['Hecho', 'ok'], cancelado:['Cancelado', ''], sin_marcar:['Sin marcar', 'warn'] };

/* =========================================================
   EL SERVICIO REGULAR AL CENTRO (pedido de Claudio, 23-10-2026)
   Las vans del hotel tienen una oblea en el parabrisas que les abre la
   barrera sola: nadie está obligado a registrarlas. Pero salen siempre a
   la misma hora (cartel del hotel "Servicio regular transfer Hotel - Centro
   de Ushuaia"): con ese horario a la vista, la garita marca "Salió" y
   "Volvió" en un toque y dice si iba vacía o con huéspedes (cuántos).
     · Los 9 viajes de todos los días se cargan solos como traslados
       automatizados (una sola vez: si el hotel después los cambia, los
       pausa o los borra, no vuelven). "vuelve" es la hora en que la van
       sale del centro de regreso (parada: Av. Maipú 465).
     · Lo que nadie marcó se cierra solo al día siguiente como "sin marcar"
       (ver cerrarViajesViejos): la van nunca queda "afuera para siempre".
     · Conteo del día y del mes: salidas, entradas y huéspedes (solo
       números, sin nombres). Lo ven el hotel, la garita y la Administración.
   ========================================================= */
const SERVICIO_REGULAR = [['08:10', '08:30'], ['10:00', '10:30'], ['13:00', '13:30'], ['14:00', '15:30'], ['16:10', '16:30'], ['17:10', '17:30'], ['19:00', '19:30'], ['22:00', '22:30'], ['23:10', '23:30']];
const rutinasRegulares = () => SERVICIO_REGULAR.map(([sale, vuelve]) => ({ id:'hrsr-' + sale.replace(':', ''), rutina:true, activa:true, regular:true,
  nombre:'Servicio regular al centro', dias:[1, 2, 3, 4, 5, 6, 0], sale, vuelve, destino:'centro', sentido:'llevar', pax:0, vanId:'', chofer:'', desde:hoyISO(), hasta:'',
  nota:'Parada en el centro: Av. Maipú 465', at:Date.now() }));
/* Se cargan una sola vez: con la marca en la ficha del hotel, o si ya hay alguno. */
function sembrarServicioRegular(s){
  const info = hotelInfo();
  if (info.servicioRegular || aLista(s.hotelViajes).some(x => x && x.rutina && (x.regular || /^hrsr-/.test(x.id || '')))) return 0;
  s.hotelViajes = aLista(s.hotelViajes).concat(rutinasRegulares());
  generarRutinas(s);
  return SERVICIO_REGULAR.length;
}
/* La garita lo carga a mano si todavía no está (ignora la marca: solo si no hay ninguno). */
A['hsr-cargar'] = async () => {
  if (!soloGarita()) return;
  if (aLista(Store.s.hotelViajes).some(x => x && x.rutina && /^hrsr-/.test(x.id || ''))) return toast('El servicio regular ya está cargado', 'check');
  if (!await confirmar('Cargar el servicio regular al centro', 'Los 9 viajes de todos los días del cartel del hotel: sale 08:10, 10:00, 13:00, 14:00, 16:10, 17:10, 19:00, 22:00 y 23:10, y vuelve del centro 20 o 30 minutos después. El hotel los puede cambiar o pausar desde su portal.', { si:'Cargarlos' })) return;
  Store.cambiar(s => { s.hotelViajes = aLista(s.hotelViajes).concat(rutinasRegulares()); generarRutinas(s);
    s.bitacora.unshift({ id:uid(), autor:yo().id, tipo:'acceso', texto:'La garita cargó el servicio regular de las vans del hotel al centro (9 viajes por día).', at:Date.now() }); });
  toast('Listo: el servicio regular al centro quedó cargado', 'car');
};
/* Lo de días anteriores que quedó sin marcar se cierra como "sin marcar". */
function cerrarViajesViejos(s){
  const hoy = hoyISO(); let n = 0;
  aLista(s.hotelViajes).forEach(x => { if (x && !x.rutina && x.fecha && x.fecha < hoy && (x.estado === 'programado' || x.estado === 'en_curso')){
    x.sinMarcar = x.estado === 'en_curso' ? 'vuelta' : 'salida'; x.estado = 'sin_marcar'; x.cerradoAt = Date.now(); n++; } });
  return n;
}
/* Cuántos iban en la van, en palabras. */
const paxTexto = n => n == null || n === '' ? '' : +n === 0 ? 'vacía' : `con ${plural(+n, 'huésped', 'huéspedes')}`;
/* EL CONTEO: salidas, entradas, huéspedes y viajes sin marcar, entre dos fechas (inclusive). */
function conteoVans(desde, hasta){
  const movs = hotelMovs().filter(m => m.vanId && isoDe(new Date(m.at)) >= desde && isoDe(new Date(m.at)) <= hasta);
  const c = { salidas:0, entradas:0, conHuespedes:0, vacias:0, huespedesSalen:0, huespedesEntran:0,
    sinMarcar: hotelViajes().filter(x => x.fecha >= desde && x.fecha <= hasta && (x.estado === 'sin_marcar' || (x.fecha === hoyISO() && x.estado === 'programado' && x.sale && minutosDe(x.sale) + 60 < ahoraMin()))).length };
  movs.forEach(m => { const out = m.tipo === 'out'; c[out ? 'salidas' : 'entradas']++;
    if (m.pax == null) return; if (+m.pax > 0){ c.conHuespedes++; c[out ? 'huespedesSalen' : 'huespedesEntran'] += +m.pax; } else c.vacias++; });
  return c;
}
function conteoVansHTML({ chico = false } = {}){
  if (!hotelVans().length && !hotelRutinas().length) return '';
  const hoy = hoyISO(), d = conteoVans(hoy, hoy), m = conteoVans(hoy.slice(0, 8) + '01', hoy);
  const fila = (t, c) => `<div class="cv2-fila"><span class="cv2-t">${t}</span>
    <span><b>${c.salidas}</b><small>salidas</small></span><span><b>${c.entradas}</b><small>entradas</small></span>
    <span><b>${c.huespedesSalen + c.huespedesEntran}</b><small>huéspedes</small></span><span class="${c.sinMarcar ? 'falta' : ''}"><b>${c.sinMarcar}</b><small>sin marcar</small></span></div>`;
  if (chico) return `<p class="cv2-chico">${I('car')} Hoy: <b>${plural(d.salidas, 'salida')}</b> · <b>${plural(d.entradas, 'entrada')}</b> · <b>${plural(d.huespedesSalen + d.huespedesEntran, 'huésped', 'huéspedes')}</b> en las vans${d.sinMarcar ? ` · <b>${d.sinMarcar} sin marcar</b>` : ''}</p>`;
  return `<div class="card cv2"><div class="cv2-cab"><b>${I('car')} Las vans por la garita</b><small>Lo que marca la garita · solo números, sin nombres</small></div>
    ${fila('Hoy', d)}${fila(new Date().toLocaleDateString('es-AR', { month:'long' }).replace(/^./, x => x.toUpperCase()), m)}
    <p class="muted tiny" style="margin:6px 0 0">Huéspedes: ${d.huespedesSalen} salieron y ${d.huespedesEntran} entraron hoy (${m.huespedesSalen} y ${m.huespedesEntran} en el mes). ${m.vacias ? `${plural(m.vacias, 'viaje vacío', 'viajes vacíos')} en el mes.` : ''}</p></div>`;
}

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
  return `${x.sentido === 'buscar' ? 'Buscar en' : 'Llevar a'} ${d[0].toLowerCase()}${x.ref && x.ref.tipo === 'vuelo' ? ' · vuelo ' + x.ref.nro + (x.ref.hora ? ' ' + x.ref.hora : '') : x.ref && x.ref.tipo === 'crucero' ? ' · crucero ' + conMayusculasBarco(x.ref.barco) : x.ref && x.ref.desc && x.ref.tipo !== 'rutina' ? ' · ' + x.ref.desc : ''}`; };
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
    if (u.rol !== 'hotel') return;
    /* (23-10-2026, tarde) El servicio regular al centro se carga de verdad aunque el hotel esté mirando el
       ejemplo (antes el ejemplo lo mostraba, pero en la base no había nada y la garita no lo veía). */
    if (HotelEjemplo.activo()){
      if (!hotelInfo().servicioRegular && !aLista(Store.s.hotelViajes).some(x => x && x.rutina && /^hrsr-/.test(x.id || '')))
        Store.cambiar(s => { sembrarServicioRegular(s); guardarInfo(s, { servicioRegular:hoyISO() }); });
      return;
    }
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
    const hayCambios = viejos.length || avisos.length || info.huespedesHoy !== hoyN || info.huespedesDia !== hoy || !info.servicioRegular || aLista(Store.s.hotelViajes).some(x => x && !x.rutina && x.fecha < hoy && (x.estado === 'programado' || x.estado === 'en_curso'));
    Store.cambiar(s => {
      if (viejos.length){ const fuera = new Set(viejos.map(h => h.id)); s.hotelHuespedes = aLista(s.hotelHuespedes).filter(h => !fuera.has(h.id)); }
      trasladosDeHuespedes(s);
      /* (23-10-2026) El servicio regular al centro, una sola vez (queda la marca en la ficha). */
      if (!info.servicioRegular){ sembrarServicioRegular(s); guardarInfo(s, { servicioRegular:hoy }); }
      cerrarViajesViejos(s);
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
    /* (23-10-2026) El servicio regular al centro y el cierre de lo que quedó sin marcar. */
    if (!Nube.activa || !Nube.activa() || Nube.listoParaMotor()){
      /* Con lo de verdad (Store.s), no con el ejemplo que puede estar a la vista. */
      const reales = aLista(Store.s.hotelViajes).filter(Boolean);
      const viejos = reales.some(x => !x.rutina && x.fecha < hoyISO() && (x.estado === 'programado' || x.estado === 'en_curso'));
      /* (23-10-2026, tarde) Sin esperar a que el hotel cargue sus vans: antes no se cargaba nada y la garita no veía el servicio. */
      const sembrar = !hotelInfo().servicioRegular && !reales.some(x => x.rutina && (x.regular || /^hrsr-/.test(x.id || '')));
      if (viejos || sembrar) Store.cambiar(s => { if (sembrar) sembrarServicioRegular(s); cerrarViajesViejos(s); });
    }
    if (!this.marcar('limpieza-movs-' + hoyISO())) return;
    /* 40 días (23-10-2026): el conteo del mes necesita el mes entero. */
    const lim = Date.now() - 40 * DIA;
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
const HotelVista = { hoyTab:'vuelos', filtro:'porhacer', abierto:'' };
/* QUÉ QUEDA POR HACER (pedido de Claudio, 20-10-2026: "si son las 19 h y
   solo falta uno a las 20 h, que me muestre solo eso"). Por hacer = la van
   que está en viaje, o la programada que todavía no tendría que haber
   salido (con 15 min de gracia, como "Lo próximo"). La programada cuya hora
   ya pasó y nadie registró en la garita queda como "Sin registrar": no se
   cuenta como por hacer, pero se ve en "Todos". */
const viajeSinRegistrar = x => x.estado === 'programado' && (x.fecha < hoyISO() || (x.fecha === hoyISO() && (minDe(x.sale) ?? 9999) < ahoraMin() - 15));
const viajePorHacer = x => x.estado === 'en_curso' || (x.estado === 'programado' && !viajeSinRegistrar(x));
const FILTROS_TRAS = { porhacer:viajePorHacer, viaje:x => x.estado === 'en_curso', hechos:x => x.estado === 'hecho', todos:() => true };
/* Una botonera de pestañas con una pastilla de color que se desliza hasta
   la elegida y una onda al tocar (idea de BetterSegmentedControl, 2,4k★, y
   Segmentio, 2,5k★; el código es propio, solo CSS). La usan los filtros de
   los traslados, los de huéspedes y Hoy en Ushuaia. Cada opción: k (clave),
   t (texto), n (cantidad, opcional), ic (ícono, opcional), c (color). */
function segmento(items, actual, accion, cls = ''){
  const i = Math.max(0, items.findIndex(x => x.k === actual));
  return `<div class="seg-vivo ${cls}" role="tablist" style="--n:${items.length};--i:${i};--sc:${items[i].c || 'var(--ink)'}"><span class="seg-ind" aria-hidden="true"></span>${items.map((x, j) =>
    `<button type="button" role="tab" aria-selected="${j === i}" class="seg-b ${j === i ? 'on' : ''}" data-a="${accion}" data-v="${esc(x.k)}" style="--c:${x.c || 'var(--ink)'}">${x.ic ? I(x.ic) : ''}${x.n != null ? `<b class="seg-n">${x.n}</b>` : ''}<span class="seg-t">${x.t}</span></button>`).join('')}</div>`;
}
/* "en 1 h 20 min", "en 5 min", "ahora", "hace 10 min". */
function faltaTexto(hhmm){
  const t = minDe(hhmm); if (t == null) return '';
  const d = t - ahoraMin(), a = Math.abs(d), txt = a >= 60 ? `${Math.floor(a / 60)} h${a % 60 ? ' ' + (a % 60) : ''}` : `${a} min`;
  return a < 2 ? 'ahora' : d > 0 ? 'en ' + txt : 'hace ' + txt;
}
/* LA RECEPCIÓN EN VIVO, DE UN VISTAZO (pedido de Claudio, 20-10-2026:
   "que en una sola mirada se vea todo lo que el hotel está en tiempo real").
   Cuatro tarjetas que se tocan, cada una con su número que sube contando
   cuando cambia, una línea que explica y una barra de avance (idea de las
   tarjetas de tremor, 16k★, number-flow, 7,7k★, y el "Hoy: llegadas,
   salidas, alojados" de los sistemas de hotel como QloApps, 14k★; el
   código es propio):
     · Traslados por hacer: solo lo que falta desde ahora, y el próximo.
     · Llegan hoy: personas que hacen check-in hoy, y cuántas ya entraron.
     · Se van hoy: check-out de hoy, y cuántas ya salieron.
     · Alojados: los que siguen en el hotel (ni llegan ni se van hoy).
   Cada una abre su lista con ese filtro puesto. */
function huespedesDelDia(hoy = hoyISO()){
  const hs = hotelHuespedes(), pax = ls => ls.reduce((a, h) => a + (+h.pax || 1), 0);
  const llegan = hs.filter(h => h.desde === hoy), salen = hs.filter(h => h.hasta === hoy && h.desde <= hoy), estan = hs.filter(h => h.desde < hoy && h.hasta > hoy);
  return { llegan, salen, estan, futuros:hs.filter(h => h.desde > hoy), pax };
}
function pulsoHotel(vs){
  const hd = huespedesDelDia(), ph = vs.filter(viajePorHacer), hechos = vs.filter(x => x.estado === 'hecho').length, viaje = vs.filter(x => x.estado === 'en_curso').length;
  const prox = ph.find(x => x.estado === 'programado'), pct = (a, b) => b ? Math.round(a / b * 100) : 0;
  const nLl = hd.pax(hd.llegan), inLl = hd.pax(hd.llegan.filter(h => h.ingreso)), nSa = hd.pax(hd.salen), outSa = hd.pax(hd.salen.filter(h => h.salida)), nEs = hd.pax(hd.estan);
  const k = ({ a, v, p, n, t, s, ic, c, barra, i }) => `<button type="button" class="hp-kpi ${n ? '' : 'cero'}" data-a="${a}" data-v="${v}" data-p="${p || ''}" style="--k:${c};--i:${i}">
      <span class="hp-kpi-top"><span class="hp-kpi-ic">${I(ic)}</span><i class="hp-kpi-vivo" aria-hidden="true"></i></span>
      <b class="dn-num" data-k="hp-${v}${p || ''}" data-n="${n}">${n}</b><span class="hp-kpi-t">${t}</span><small class="hp-kpi-s">${s}</small>
      <span class="hp-kpi-barra" aria-hidden="true"><i style="width:${barra}%"></i></span></button>`;
  return `<div class="hp-pulso" aria-label="El hotel ahora">
    ${k({ a:'hkpi-tras', v:'porhacer', n:ph.length, t:ph.length === 1 ? 'traslado por hacer' : 'traslados por hacer', ic:'car', c:'var(--wood)', i:0,
      s: viaje ? `${viaje} en viaje ahora${prox ? ' · después ' + esc(prox.sale) : ''}` : prox ? `próximo ${esc(prox.sale)} · ${esc(faltaTexto(prox.sale))}` : vs.length ? 'no queda nada por hoy' : 'sin traslados hoy', barra:pct(hechos, vs.length) })}
    ${k({ a:'abrir', v:'hotel-huespedes', p:'llegan', n:nLl, t:'llegan hoy', ic:'login', c:'var(--sky)', i:1,
      s: hd.llegan.length ? (inLl >= nLl ? 'ya entraron todos' : `${plural(hd.llegan.length, 'reserva')} · ${nLl - inLl} sin entrar`) : 'nadie anunciado', barra:pct(inLl, nLl) })}
    ${k({ a:'abrir', v:'hotel-huespedes', p:'salen', n:nSa, t:'se van hoy', ic:'logout', c:'var(--accent)', i:2,
      s: hd.salen.length ? (outSa >= nSa ? 'ya salieron todos' : `${plural(hd.salen.length, 'reserva')} · ${nSa - outSa} por salir`) : 'ningún check-out', barra:pct(outSa, nSa) })}
    ${k({ a:'abrir', v:'hotel-huespedes', p:'estan', n:nEs, t:nEs === 1 ? 'alojado' : 'alojados', ic:'users', c:'var(--ok)', i:3,
      s: hd.estan.length ? `en ${plural(hd.estan.length, 'reserva')} · siguen mañana` : 'nadie de estadía', barra: nEs ? 100 : 0 })}</div>`;
}
/* "Traslados por hacer": abre Vans y traslados con ese filtro puesto. */
A['hkpi-tras'] = () => { HotelVista.filtro = 'porhacer'; abrir('hotel-traslados'); };
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
  const e = estadoVan(v), prox = viajesDelDia().find(x => x.vanId === v.id && x.estado === 'programado' && (minDe(x.sale) ?? 9999) >= ahoraMin() - 15);
  const fu = vanAfuera(v, e);
  const hace = e.sin ? 'sin pasos registrados' : fu ? `salió ${fu.salio} h${fu.que ? ' · ' + fu.que : ' · sin traslado programado'}` : `adentro desde las ${hora(e.desde)}`;
  return `<div class="hp-van ${e.adentro ? 'adentro' : 'afuera'}">
    <div class="hp-van-arte">${VAN_SVG}<span class="hp-van-luz">${e.adentro ? 'Adentro' : 'Afuera'}</span></div>
    <div class="hp-van-txt"><b>${esc(v.nombre)}</b><span class="hp-chapa">${esc(chapaTexto(v.patente || ''))}</span>
      <small>${esc(hace)}${v.chofer ? ' · ' + esc(v.chofer) : ''}</small>
      ${fu ? `<small class="hp-van-vuelve ${fu.tarde ? 'tarde' : ''}">${I('login')} ${fu.vuelve ? `${fu.tarde ? 'Tendría que haber vuelto' : 'Vuelve'} ~${esc(fu.vuelve)} h` : 'Sin hora de regreso: avisá al chofer'}</small>` : ''}
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
  const F = FILTROS_TRAS, n = k => vs.filter(F[k]).length, f = F[HotelVista.filtro] ? HotelVista.filtro : 'porhacer', lista = vs.filter(F[f]).slice(0, max);
  const chips = segmento([{ k:'porhacer', t:'Por hacer', c:'var(--wood)' }, { k:'viaje', t:'En viaje', c:'var(--warn)' }, { k:'hechos', t:'Hechos', c:'var(--ok)' }, { k:'todos', t:'Todos', c:'var(--sky)' }]
    .map(x => ({ ...x, n:n(x.k) })), f, 'htras-filtro', 'apilado');
  const ahora = ahoraMin(), esHoy = dia === hoyISO();
  let marcoAhora = !esHoy;
  const filas = lista.map(x => {
    const d = DESTINOS_HOTEL[x.destino] || DESTINOS_HOTEL.otro, sinReg = viajeSinRegistrar(x), e = sinReg ? ['Sin registrar', 'danger'] : ESTADO_VIAJE[x.estado] || ESTADO_VIAJE.programado, van = hotelVans().find(v => v.id === x.vanId), aj = ajusteViaje(x);
    let linea = '';
    if (!marcoAhora && (minDe(x.sale) ?? 0) > ahora){ marcoAhora = true; linea = `<li class="hl-ahora"><span>${I('clock')} Ahora · ${hhmmDe(ahora)}</span></li>`; }
    const abierto = HotelVista.abierto === x.id;
    return `${linea}<li class="hl-item e-${esc(x.estado)} ${sinReg ? 'sin-reg' : ''} ${abierto ? 'abierto' : ''}" id="tras-${esc(x.id)}">
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
  return `${chips}${lista.length ? `<ol class="hl-linea">${filas}${fin}</ol>` : `<div class="hl-vacio">${I('check')} ${vs.length ? (f === 'porhacer' ? 'No queda nada por hacer: todo salió o ya se hizo.' : 'Nada con ese filtro.') : `No hay traslados ese día.${esHotel() ? ' Se agregan con "+ Traslado", arriba.' : ''}`}</div>`}`;
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
A['htras-filtro'] = el => { HotelVista.filtro = FILTROS_TRAS[el.dataset.v] ? el.dataset.v : 'porhacer'; refrescar(); };
A['hviaje-ver'] = el => {
  const id = el.dataset.id; HotelVista.abierto = HotelVista.abierto === id ? '' : id;
  /* El filtro no puede esconder el que se quiere ver. */
  const x = hotelViajes().find(v => v.id === id);
  if (x && HotelVista.abierto && !(FILTROS_TRAS[HotelVista.filtro] || FILTROS_TRAS.todos)(x)) HotelVista.filtro = 'todos';
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
  const tabs = [{ k:'vuelos', ic:'send', t:'Vuelos', n:vuelosParaVan('D').length + vuelosParaVan('A').length, c:'var(--sky)' }, { k:'cruceros', ic:'barco', t:'Cruceros', n:cr.length, c:'var(--brand)' }, { k:'eventos', ic:'calendar', t:'Eventos', n:ev.length, c:'var(--accent)' }];
  const tab = tabs.some(t => t.k === HotelVista.hoyTab) ? HotelVista.hoyTab : 'vuelos';
  const cuerpo = tab === 'vuelos' ? `${tableroVuelos({ max:5 })}<button class="hu-todos" data-a="abrir" data-v="hotel-vuelos">${I('send')}Todos los vuelos de hoy${I('right')}</button>`
    : tab === 'cruceros' ? `<div class="hc-lista">${cr.length ? cr.map(tarjetaCrucero).join('')
        : `<p class="hu-nada">${I('barco')} ${Cruceros.url() ? 'No hay recaladas en los próximos tres días.' : 'El cronograma de cruceros todavía no está conectado.'}</p>`}
        <button class="hu-todos" data-a="abrir" data-v="cruceros">${I('barco')}Ver todos los cruceros${I('right')}</button></div>`
    : `<div class="he-lista">${ev.length ? ev.map(tarjetaEventoCiudad).join('') : `<p class="hu-nada">${I('calendar')} Sin eventos cargados para esta semana.</p>`}
        <button class="hu-todos" data-a="abrir" data-v="ushuaia">${I('calendar')}Ushuaia hoy: agenda completa${I('right')}</button></div>`;
  return `<div class="hu-caja"><div class="hu-tabs">${segmento(tabs.map(x => ({ ...x, n:x.n || null })), tab, 'hhoy-tab', 'iconos')}</div><div class="hu-cuerpo" data-k="hu-${tab}">${cuerpo}</div></div>`;
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
function hotelEnLaApp({ promosPend = 0, sinLeer = 0 } = {}){
  const lotes = typeof lotesDelHotel === 'function' ? lotesDelHotel() : [];
  let exp = null;
  if (lotes.length && typeof cuentasBajadas === 'function' && !cuentasBajadas()) exp = { t:'Expensas del hotel', s:'Trayendo la cuenta…' };
  else if (lotes.length){ const d = deudaGrupo(lotes), tot = totalDeuda(d), l = liquidacionesEmitidas().slice(-1)[0];
    exp = { t:'Expensas del hotel', s: tot > .5 ? `${plata(tot)} entre las ${lotes.length} UF${l ? ' · vence el ' + fechaCorta(vtoDe(l.periodo, 1)) : ''}` : `Las ${lotes.length} UF al día · cupones y recibos`, badge: tot > .5 ? '!' : '' }; }
  const rs = hotelRutinas().filter(r => r.activa !== false).length;
  const T = [
    /* Vans y traslados, Vuelos para las vans y Huéspedes ya no van acá:
       están arriba, en las tarjetas en vivo, "Vans ahora" y Hoy en Ushuaia
       (pedido de Claudio, 20-10-2026: "ventanas que redundan"). */
    ...(typeof agendaDe === 'function' ? [(() => { const f = sumarDias(hoyISO(), 1), ag = agendaDe(f);
      return { v:'hotel-agenda', ic:'calendar', c:'accent', t:'Agenda de mañana', s: !ag ? 'Se arma sola a las 22 h' : ag.estado === 'aprobada' ? `Aprobada${ag.recibido ? ' · la garita la recibió' : ''}` : 'Espera tu OK', badge: ag && ag.estado === 'pendiente' ? '!' : '' }; })(),
      { v:'hotel-bitacora', ic:'book', c:'ok', t:'Bitácora del hotel', s:'El día paso a paso · PDF por correo a las 23:59' }] : []),
    { v:'hotel-rutinas', ic:'refresh', c:'ok', t:'Traslados automatizados', s: rs ? `${plural(rs, 'activo', 'activos')} · se arman solos` : 'Las salidas de siempre, una vez' },
    { v:'privado', p:'hotel', ic:'chat', c:'brand', t:'Comunicación interna', s:'Con la garita o la Administración', badge:sinLeer },
    { v:'hotel-promos', ic:'sparkle', c:'cobre', t:'Promociones', s:'Salen en la tira de todas las apps', badge:promosPend },
    { v:'hotel-eventos', ic:'star', c:'accent', t:'Eventos del hotel', s:'La garita se entera; los vecinos, si hace falta' },
    { v:'hotel-empleados', ic:'users', c:'wood', t:'Empleados del hotel', s: hotelEmpleados().length ? `${hEmpAdentro().length} adentro ahora · QR, patente o código` : 'Credencial permanente: QR, patente o código', n: hEmpAdentro().length || '' },
    { v:'hotel-proveedores', ic:'box', c:'brand', t:'Proveedores', s:'ART, seguro y su QR de ingreso' },
    { v:'hotel-emergencias', ic:'siren', c:'danger', t:'Emergencias', s:'Llamar, avisar a la garita, DEA', alerta:true },
    ...(exp ? [{ v:'expensas', ic:'wallet', c:'wood', t:exp.t, s:exp.s, badge:exp.badge }] : []),
    { a:'hotel-hoja-dia', ic:'download', c:'ok', t:'Hoja del día', s:'Vuelos, cruceros y traslados para el mostrador' },
    { v:'vecinos', ic:'pin', c:'sky', t:'Direcciones del barrio', s:'Para guiar a un huésped' },
    { v:'hotel-ficha', ic:'sliders', c:'sky', t:'Ficha del hotel', s:'Responsable, tiempos de traslado, DEA' },
    { v:'agenda', ic:'book', c:'cobre', t:'Agenda de Ushuaia', s:'Taxis, comidas, farmacias' },
    { v:'hotel-convenio', ic:'clipboard', c:'wood', t:'Convenio con el barrio', s:'Modelo de convivencia y servicios' },
    /* Normas y Manual de uso eran dos tejas que llevaban a la misma ventana
       con dos solapas (pedido de Claudio, 23-10-2026: "son lo mismo,
       unificalo"): una sola puerta, como en El barrio. */
    { v:'manual', ic:'book', c:'accent', t:'Manual y normas', s:'Cómo usar la app · reglamento y convivencia' },
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
    const vs = viajesDelDia(hoy);
    const ajustes = vs.filter(x => ajusteViaje(x));
    const evHoy = hotelEventos().filter(e => e.fecha === hoy);
    const promosPend = promosViejasPend().length;
    const sinLeer = aLista(Store.s.privados).reduce((a, h) => a + aLista(h.msgs).filter(m => m.from !== 'vecino' && !m.leido).length, 0);
    return `<div class="hotel-hero hp-hero"><img src="img/logo-noche.png" alt="" width="54" height="54">
        <div class="grow"><small>${fechaLarga(hoy)}</small><h1>${HOTEL_NOMBRE}</h1><span>Recepción${info.responsable ? ' · responsable: ' + esc(info.responsable) : ''}</span>
          ${typeof Agua !== 'undefined' && Agua.d && Agua.d.temp != null ? `<span class="hp-agua" title="${esc(Agua.FUENTE)}">${I('drop')}Agua del Canal Beagle <b>${Agua.grados(Agua.d.temp)}</b>${Agua.tendencia() ? ' · ' + esc(Agua.tendencia()) : ''}</span>` : ''}</div>
        ${c ? `<div class="hotel-temp"><b>${Math.round(c.temperature_2m)}°</b><small>${Clima.cod(c.weather_code)[0]}</small></div>` : ''}</div>
      ${pulsoHotel(vs)}
      ${typeof bandaAgenda === 'function' ? bandaAgenda() : ''}
      <div class="inicio-lienzo">
        ${typeof mantHero === 'function' ? mantHero() : ''}
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
        <section class="bloque">${sec('El hotel en la app', '<span class="muted small">tocá y entrá</span>')}${hotelEnLaApp({ promosPend, sinLeer })}</section>
        ${pieApp()}
      </div>`;
  },
  alPintar(){ if (typeof animarNumeros === 'function') animarNumeros();
    if (!Vuelos.d || Date.now() - Vuelos.d.t > Vuelos.cadencia()) Vuelos.pedir().then(() => { if (PILA.at(-1)?.id === 'hotel') refrescarPronto(); }).catch(() => {}); },
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
      ${dia === hoy ? conteoVansHTML() : ''}
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
/* ¿VACÍA O CON HUÉSPEDES? (pedido de Claudio, 23-10-2026). Antes de anotar
   el paso, la garita dice en un toque cuántos huéspedes iban: así se cuenta
   cuántos entran y salen del barrio. "No se ve" deja el paso sin ese dato. */
A['hvan-mov'] = el => {
  const tipo = el.dataset.v === 'in' ? 'in' : 'out';
  if (el.dataset.pax === undefined) return pedirPaxVan(el.dataset.id, tipo, el.dataset.p || '');
  moverVan(el.dataset.id, tipo, el.dataset.p || '', el.dataset.pax === '' ? null : +el.dataset.pax);
};
/* Mientras el hotel no cargó sus vans, la garita marca igual: "la van del hotel" (vanId 'sin-van'). */
const VAN_SIN_CARGAR = { id:'sin-van', nombre:'La van del hotel', patente:'' };
const vanOGenerica = id => hotelVans().find(x => x.id === id) || (id === 'sin-van' ? VAN_SIN_CARGAR : null);
function pedirPaxVan(vanId, tipo, viajeId = ''){
  if (!soloGarita()) return;
  const v = vanOGenerica(vanId); if (!v) return;
  const x = viajeId ? hotelViajes().find(y => y.id === viajeId) : null;
  const b = (pax, t, cls = '') => `<button type="button" class="vp-b ${cls}" data-a="hvan-mov" data-id="${esc(vanId)}" data-v="${tipo}" data-p="${esc(viajeId)}" data-pax="${pax}">${t}</button>`;
  hoja(`${v.nombre} ${tipo === 'in' ? 'volvió' : 'salió'}`, `<p class="muted small" style="margin:0 0 12px">${x ? `${esc(x.sale || '')} h · ${esc(textoViaje(x))} · ` : ''}<span class="mono">${esc(v.patente || '')}</span></p>
    <p style="margin:0 0 8px"><b>¿Cómo ${tipo === 'in' ? 'vino' : 'iba'}?</b></p>
    <div class="vp-grilla">${b(0, `${I('car')}Vacía`, 'vacia')}${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15].map(n => b(n, n)).join('')}</div>
    <p class="muted tiny" style="margin:10px 0 8px">El número es la cantidad de huéspedes (sin contar al chofer). Solo se guarda el número, sin nombres.</p>
    ${b('', 'No se ve: anotar sin el número', 'nose')}`);
}
function moverVan(vanId, tipo, viajeId = '', pax = null){
  if (!soloGarita()) return;
  const v = vanOGenerica(vanId); if (!v) return;
  const at = Date.now(), ahora = ahoraMin(), hoy = hoyISO();
  let viaje = null;
  Store.cambiar(s => {
    const vs = aLista(s.hotelViajes).filter(x => x.fecha === hoy);
    const elegido = viajeId ? vs.find(x => x.id === viajeId && x.estado === (tipo === 'out' ? 'programado' : 'en_curso')) : null;
    if (tipo === 'out'){
      viaje = elegido || vs.filter(x => x.estado === 'programado' && (!x.vanId || x.vanId === v.id) && (!x.sale || Math.abs(minutosDe(x.sale) - ahora) <= 90))
        .sort((a, b) => (!!b.vanId - !!a.vanId) || Math.abs(minutosDe(a.sale || '12:00') - ahora) - Math.abs(minutosDe(b.sale || '12:00') - ahora))[0] || null;
      if (viaje){ viaje.estado = 'en_curso'; viaje.salioAt = at; if (v.id !== 'sin-van') viaje.vanId = viaje.vanId || v.id; if (pax != null) viaje.paxSale = pax; }
    } else {
      viaje = elegido || vs.find(x => x.estado === 'en_curso' && (x.vanId === v.id || (v.id === 'sin-van' && !x.vanId))) || null;
      if (viaje){ viaje.estado = 'hecho'; viaje.volvioAt = at; if (pax != null) viaje.paxVuelve = pax; }
    }
    const px = paxTexto(pax);
    s.hotelMovs = aLista(s.hotelMovs); s.hotelMovs.unshift({ id:'hm' + uid(), vanId:v.id, tipo, at, por:yo().id, viaje: viaje ? textoViaje(viaje) : '', ...(pax != null ? { pax } : {}) });
    s.bitacora.unshift({ id:uid(), autor:yo().id, tipo:'acceso', texto:`${tipo === 'in' ? 'Ingreso' : 'Egreso'}: ${v.id === 'sin-van' ? 'la van del hotel' : `van del hotel ${v.nombre} (${v.patente})`}${viaje ? ' · ' + textoViaje(viaje) : ''}${px ? ' · ' + px : ''}`, at });
    const h = hotelId(); if (h) notificar(s, { para:[h], titulo:`${v.nombre} ${tipo === 'in' ? 'entró al barrio' : 'salió del barrio'}`, texto:`${hora(at)} h${viaje ? ' · ' + textoViaje(viaje) : ''}${px ? ' · ' + px : ''}`, icon:'car', color:'wood', link:'hotel-traslados', push:false });
  });
  cerrarHoja(); toast(`${v.nombre}: ${tipo === 'in' ? 'entrada' : 'salida'} registrada${pax != null ? ' · ' + paxTexto(pax) : ''}`, tipo === 'in' ? 'login' : 'logout');
  vanArranca(tipo, v, pax);
}
/* =========================================================
   LA VAN QUE ARRANCA (pedido de Claudio, 23-10-2026: "al marcar la salida o
   la entrada, que aparezca la van animada sobre la pantalla de la garita,
   que salga de izquierda a derecha acelerada, con ruido a motor como si
   tomara carrera, y deje una estela de humo que desaparece en uno o dos
   segundos"). Va en su propia capa, por encima de todo y sin tapar los
   toques (pointer-events: none): la garita puede seguir trabajando. El
   motor se arma con el sonido del equipo (WebAudio, nada que bajar) y
   respeta "sin sonido". Con "reducir movimiento" del teléfono, solo suena.
   ========================================================= */
function vanArranca(tipo, v, pax){
  if (document.hidden) return;
  motorArranca();
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  document.querySelector('.van-arranca')?.remove();
  /* La que sale va de izquierda a derecha; la que entra, al revés (pedido de Claudio): la escena se da vuelta entera. */
  const entra = tipo === 'in';
  const capa = document.createElement('div'); capa.className = 'van-arranca' + (entra ? ' entra' : ''); capa.setAttribute('aria-hidden', 'true');
  capa.innerHTML = `<div class="va-van"><span class="va-cartel">${tipo === 'in' ? 'Entró' : 'Salió'} · ${esc(v.nombre || 'la van')}${pax != null ? ' · ' + esc(paxTexto(pax)) : ''}</span>${VAN_SVG}</div>`;
  document.body.appendChild(capa);
  const van = capa.querySelector('.va-van'), t0 = performance.now();
  /* El humo sale del caño de escape (atrás, abajo) mientras la van corre. */
  /* (23-10-2026, "que haya más humo") Dos o tres bocanadas cada 30 ms, más grandes, y una nube fuerte en el acelerón. */
  const bocanada = (r, grande = false) => {
    const p = document.createElement('i'); p.className = 'va-humo' + (grande ? ' grande' : '');
    /* En la escena dada vuelta, la x se cuenta desde la derecha de la pantalla. */
    p.style.left = Math.round((entra ? innerWidth - r.right : r.left) + r.width * (.02 + Math.random() * .06)) + 'px'; p.style.top = Math.round(r.top + r.height * (.62 + Math.random() * .2)) + 'px';
    p.style.setProperty('--s', ((grande ? 1.4 : .8) + Math.random() * .9).toFixed(2)); p.style.setProperty('--dy', Math.round(-8 - Math.random() * 40) + 'px'); p.style.setProperty('--dx', Math.round(-50 - Math.random() * 70) + 'px');
    capa.appendChild(p); setTimeout(() => p.remove(), 2300);
  };
  const humo = setInterval(() => {
    const r = van.getBoundingClientRect(); if (r.right < 0 || r.left > innerWidth){ if (performance.now() - t0 > 900) clearInterval(humo); return; }
    const n = 2 + (Math.random() < .5 ? 1 : 0); for (let i = 0; i < n; i++) bocanada(r);
  }, 30);
  /* el acelerón en el lugar: una nube grande justo antes de salir disparada */
  setTimeout(() => { const r = van.getBoundingClientRect(); for (let i = 0; i < 7; i++) bocanada(r, true); }, 700);
  setTimeout(() => { clearInterval(humo); capa.remove(); }, 3800);
}
/* El motor: arranca grave, acelera y se va (un diente de sierra que sube de
   tono, con su "tac-tac" de cilindros y un soplido de escape al salir). */
function motorArranca(){
  if (Store.sesion?.sinSonido || typeof Sonido === 'undefined') return;
  const ctx = Sonido.despertar(); if (!ctx || ctx.state !== 'running') return;
  try {
    const t = ctx.currentTime, fin = t + 2.1, sal = ctx.createGain(); sal.connect(ctx.destination);
    sal.gain.setValueAtTime(.0001, t); sal.gain.exponentialRampToValueAtTime(.22, t + .08);
    sal.gain.setValueAtTime(.22, t + .5); sal.gain.exponentialRampToValueAtTime(.3, t + 1.2); sal.gain.exponentialRampToValueAtTime(.0001, fin);
    const filtro = ctx.createBiquadFilter(); filtro.type = 'lowpass'; filtro.frequency.setValueAtTime(380, t); filtro.frequency.exponentialRampToValueAtTime(1600, t + 1.5); filtro.connect(sal);
    /* el motor: ralentí, un acelerón y la carrera */
    const o = ctx.createOscillator(); o.type = 'sawtooth';
    o.frequency.setValueAtTime(42, t); o.frequency.linearRampToValueAtTime(70, t + .22); o.frequency.linearRampToValueAtTime(48, t + .5);
    o.frequency.exponentialRampToValueAtTime(190, t + 1.6); o.frequency.exponentialRampToValueAtTime(140, fin);
    /* el golpeteo de los cilindros: un temblor del volumen que se acelera con el motor */
    const tac = ctx.createGain(); tac.gain.value = .55; const lfo = ctx.createOscillator(), prof = ctx.createGain();
    lfo.frequency.setValueAtTime(14, t); lfo.frequency.exponentialRampToValueAtTime(48, t + 1.6); prof.gain.value = .45; lfo.connect(prof); prof.connect(tac.gain);
    o.connect(tac); tac.connect(filtro);
    /* el soplido del escape (ruido) */
    const n = Math.floor(ctx.sampleRate * 2.2), buf = ctx.createBuffer(1, n, ctx.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * .35;
    const ruido = ctx.createBufferSource(); ruido.buffer = buf; const rg = ctx.createGain();
    rg.gain.setValueAtTime(.0001, t); rg.gain.exponentialRampToValueAtTime(.5, t + .55); rg.gain.exponentialRampToValueAtTime(.0001, fin);
    ruido.connect(rg); rg.connect(filtro);
    [o, lfo, ruido].forEach(x => { x.start(t); x.stop(fin + .05); });
  } catch(e){}
}
/* Desde la solapa: el traslado sin van asignada pregunta cuál sale. */
A['hviaje-mov'] = el => {
  if (!soloGarita()) return;
  const x = hotelViajes().find(v => v.id === el.dataset.id); if (!x) return;
  const tipo = el.dataset.v === 'in' ? 'in' : 'out', vans = hotelVans();
  if (x.vanId || vans.length === 1) return pedirPaxVan(x.vanId || vans[0].id, tipo, x.id);
  if (!vans.length) return pedirPaxVan('sin-van', tipo, x.id);
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
/* ¿Es la hora de marcar este viaje? 5 min antes de salir (hasta que se atrasa) o de la vuelta. */
function viajeEsLaHora(x, t = ahoraMin()){
  if (!x) return false;
  if (x.estado === 'programado') return !!x.sale && t >= minutosDe(x.sale) - 5 && t <= minutosDe(x.sale) + 15;
  if (x.estado === 'en_curso'){ const v = minDe(regresoViaje(x)); return v != null && t >= v - 5; }
  return false;
}
/* LA TARJETA "VANS DEL HOTEL" EN LA FILA DE ARRIBA DE LA GARITA (pedido de
   Claudio, 23-10-2026: "no las veo de un simple vistazo"). Junto a Guardia,
   Policía, Camión y Correos: lo que importa ahora (es la hora de marcar, la
   van que está afuera y cuándo vuelve, la próxima salida). Tocarla baja a
   la lista. */
function tarjetaVansGarita(tarjeta){
  /* (23-10-2026, tarde) Siempre a la vista en la garita: si todavía no hay ningún traslado, lo dice y,
     con un toque, carga el servicio regular al centro (antes no aparecía nada y no se sabía por qué). */
  if (!hotelVans().length && !hotelRutinas().length) return esGuardia()
    ? tarjeta({ cls:'tg-van', ic:'car', tag:'Vans del hotel', t:'Sin traslados cargados', x:'Tocá para cargar el servicio regular al centro (9 viajes por día)', a:'hsr-cargar' })
    : tarjeta({ cls:'tg-van', ic:'car', tag:'Vans del hotel', t:'Sin traslados cargados', x:'Los carga el hotel o la garita' });
  const vs = viajesDelDia(hoyISO()), t = ahoraMin(), vans = hotelVans();
  const vanDe = x => vans.find(v => v.id === x.vanId);
  const ya = vs.find(x => viajeEsLaHora(x, t)), afuera = vs.filter(x => x.estado === 'en_curso');
  const prox = vs.filter(x => x.estado === 'programado' && x.sale && minutosDe(x.sale) + 15 >= t);
  const falta = vs.filter(x => x.estado === 'programado').length, pendientes = vs.filter(x => x.estado !== 'hecho').length;
  const lugar = x => ((DESTINOS_HOTEL[x.destino] || DESTINOS_HOTEL.otro)[0]).toLowerCase();
  const en = x => { const m = minutosDe(x.sale) - t; return m <= 0 ? 'ahora' : m < 60 ? `en ${m} min` : `en ${Math.floor(m / 60)} h${m % 60 ? ' ' + (m % 60) + ' min' : ''}`; };
  let tt, x;
  if (ya){ const v = vanDe(ya); tt = ya.estado === 'en_curso' ? `Es la hora: vuelve ${v ? v.nombre : 'la van'}` : `Es la hora: ${esc(ya.sale)} al ${esc(lugar(ya))}`;
    x = ya.estado === 'en_curso' ? `Del ${esc(lugar(ya))} · tocá y marcá "Volvió"` : 'Tocá y marcá "Salió" cuando pase'; }
  else if (afuera.length){ const a = afuera[0], v = vanDe(a), r = regresoViaje(a);
    tt = `${esc(v ? v.nombre : 'Una van')} afuera${r ? ' · vuelve ' + esc(r) : ''}`;
    x = prox[0] ? `Próxima: ${esc(prox[0].sale)} al ${esc(lugar(prox[0]))} · ${en(prox[0])}` : `Salió ${a.salioAt ? hora(a.salioAt) + ' h' : ''} al ${esc(lugar(a))}`; }
  else if (prox[0]){ tt = `Próxima: ${esc(prox[0].sale)} al ${esc(lugar(prox[0]))}`; x = `${en(prox[0])}${prox[1] ? ` · después ${esc(prox[1].sale)}` : ''}`; }
  else { const c = conteoVans(hoyISO(), hoyISO()); tt = falta ? plural(falta, 'salida sin marcar', 'salidas sin marcar') : 'Sin salidas pendientes';
    x = `Hoy: ${plural(c.salidas, 'salida')} · ${plural(c.huespedesSalen + c.huespedesEntran, 'huésped', 'huéspedes')}`; }
  return tarjeta({ cls:'tg-van' + (ya ? ' ahora' : ''), ic:'car', tag:'Vans del hotel', t:tt, x, a:'garita-ir', v:'.vans-garita', on: !!(ya || afuera.length), n: pendientes || '' });
}
function bandaVansGarita(opera){
  const vans = hotelVans(), vs = viajesDelDia(hoyISO());
  if (!vans.length && !vs.length) return '';
  const pend = vs.filter(x => x.estado !== 'hecho'), hechos = vs.filter(x => x.estado === 'hecho');
  const vanDe = x => vans.find(v => v.id === x.vanId);
  const fila = x => { const v = vanDe(x), d = DESTINOS_HOTEL[x.destino] || DESTINOS_HOTEL.otro, aj = ajusteViaje(x), curso = x.estado === 'en_curso';
    const tarde = x.estado === 'programado' && x.sale && ahoraMin() > minutosDe(x.sale) + 15;
    /* (23-10-2026) Cuando llega la hora (5 min antes de salir, o de la vuelta) la fila se resalta, sin alarmas ni sonidos. */
    const ahora = !tarde && viajeEsLaHora(x);
    return `<div class="vg-fila ${curso ? 'curso' : ''} ${tarde ? 'tarde' : ''} ${ahora ? 'ahora' : ''}"><div class="vg-hora"><b>${esc(x.sale || '—')}</b><small>${curso ? 'en viaje' : 'sale'}</small></div>
      <div class="grow"><b>${I(d[1])} ${esc(textoViaje(x))}${x.deRutina && /^hrsr-/.test(x.deRutina) ? ' · servicio regular' : ''}</b>${ahora ? `<small class="vg-ya">${I('clock')} ${curso ? 'Es la hora de la vuelta' : 'Es la hora de salir'}</small>` : ''}
        <small>${v ? `${esc(v.nombre)} · <span class="mono">${esc(v.patente || '')}</span>` : 'van sin asignar'}${choferDe(x) ? ' · ' + esc(choferDe(x)) : ''}${+x.pax ? ' · ' + plural(+x.pax, 'pasajero') : ''}${curso && x.salioAt ? ` · salió ${hora(x.salioAt)} h${x.paxSale != null ? ' ' + paxTexto(x.paxSale) : ''}${regresoViaje(x) ? ` · vuelve ~${esc(regresoViaje(x))} h` : ''}` : !curso && x.vuelve ? ` · vuelve del centro ${esc(x.vuelve)} h` : ''}${tarde ? ' · <b>se atrasó</b>' : ''}</small>
        ${aj ? `<small class="hv-alerta">${I(aj.cancelado ? 'alert' : 'clock')} ${aj.cancelado ? 'El vuelo figura CANCELADO' : `El vuelo cambió: conviene salir ${esc(aj.sale)}`}</small>` : ''}</div>
      ${opera ? `<button class="btn btn-sm ${curso ? 'btn-ok' : 'btn-pri'}" data-a="hviaje-mov" data-id="${esc(x.id)}" data-v="${curso ? 'in' : 'out'}">${I(curso ? 'login' : 'logout')}${curso ? 'Volvió' : 'Salió'}</button>`
        : `<span class="pill ${curso ? 'p-warn' : 'p-sky'}">${curso ? 'En viaje' : 'Programado'}</span>`}</div>`; };
  return `<div class="card vans-garita">
    <div class="row" style="justify-content:space-between;gap:8px;flex-wrap:wrap"><b class="row" style="gap:8px">${I('car')}Vans del hotel · hoy</b>
      <span class="muted small">${pend.length ? plural(pend.length, 'salida pendiente', 'salidas pendientes') : vs.length ? 'todas hechas' : 'sin traslados programados'}${hechos.length ? ` · ${plural(hechos.length, 'hecha', 'hechas')}` : ''}</span></div>
    ${conteoVansHTML({ chico:true })}
    ${!vans.length ? `<p class="vg-sinvans">${I('info')} El hotel todavía no cargó sus vans: se marca igual, como "la van del hotel". Cuando las cargue (Vans y traslados → Agregar van), cada paso dice cuál fue.</p>` : ''}
    ${(() => { if (!pend.length) return '';
      /* LA LISTA CORTA (23-10-2026): a la vista, las vans afuera, lo atrasado
         de la última hora y media y las 2 próximas salidas; el resto del día,
         plegado ("Más tarde hoy"), y lo que quedó atrás sin marcar, aparte. */
      const t = ahoraMin(), viejo = x => x.estado === 'programado' && x.sale && minutosDe(x.sale) + 90 < t;
      const curso = pend.filter(x => x.estado === 'en_curso'), atras = pend.filter(viejo);
      const prog = pend.filter(x => x.estado === 'programado' && !viejo(x));
      const ver = [...curso, ...prog.slice(0, 2)].sort((a, b) => (a.sale || '99').localeCompare(b.sale || '99')), luego = prog.slice(2);
      return `${ver.length ? `<div class="vg-lista">${ver.map(fila).join('')}</div>` : ''}
        ${luego.length ? `<details class="vg-mas" data-k="vans-luego"><summary>${I('clock')} Más tarde hoy (${luego.length}) <span class="muted">${luego.map(x => esc(x.sale || '—')).join(' · ')}</span></summary><div class="vg-lista">${luego.map(fila).join('')}</div></details>` : ''}
        ${atras.length ? `<details class="vg-mas vg-atras" data-k="vans-atras"><summary>${I('alert')} Sin marcar hoy (${atras.length}) <span class="muted">${atras.map(x => esc(x.sale || '—')).join(' · ')}</span></summary><div class="vg-lista">${atras.map(fila).join('')}</div></details>` : ''}`; })()}
    ${hechos.length ? `<details class="vg-hechos" data-k="vans-hechas"><summary class="muted small">Hechas hoy (${hechos.length})</summary>${hechos.map(x => { const v = vanDe(x); return `<div class="small" style="margin:4px 0">${I('check')} ${esc(x.sale || '—')} · ${esc(textoViaje(x))}${v ? ' · ' + esc(v.nombre) : ''} · salió ${x.salioAt ? hora(x.salioAt) : '—'}${x.paxSale != null ? ' ' + paxTexto(x.paxSale) : ''} · volvió ${x.volvioAt ? hora(x.volvioAt) : '—'}${x.paxVuelve != null ? ' ' + paxTexto(x.paxVuelve) : ''}</div>`; }).join('')}</details>` : ''}
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
    const datos = { sale:r.sale || '', vuelve:r.vuelve || '', destino:r.destino, sentido:r.sentido, pax:+r.pax || 0, vanId:r.vanId || '', chofer:r.chofer || '', nota:r.nota || '' };
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
          <div class="grow"><b>${esc(nombreRutina(r))}</b><small>${r.sentido === 'buscar' ? 'Buscar en' : 'Llevar a'} ${esc(d[0].toLowerCase())}${r.vuelve ? ` · vuelve ${esc(r.vuelve)} h` : ''}${+r.pax ? ' · ' + plural(+r.pax, 'pasajero') : ''}${r.nota ? ' · ' + esc(r.nota) : ''}</small></div>
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
      <div class="field"><label>Vuelve (sale de allá, opcional)</label><input type="time" name="vuelve" value="${esc(r.vuelve || '')}"></div></div>
    <div class="field"><label>Pasajeros (aprox.)</label><input type="number" name="pax" min="0" max="60" value="${esc(r.pax ?? 1)}"></div>
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
    const datos = { nombre:(d.nombre || '').trim(), dias:DIAS_SEM.filter(x => dias.includes(x)), sale:d.sale, vuelve:d.vuelve || '', destino:d.destino, sentido:d.sentido, pax:+d.pax || 0, vanId:d.vanId || '', chofer:(d.chofer || '').trim(), desde:d.desde || hoyISO(), hasta:d.hasta || '', nota:(d.nota || '').trim() };
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
  render(p){
    if (esAdmin()) return `<div class="card"><b style="font-size:22px">${hotelInfo().huespedesHoy || 0}</b> <span class="muted">huéspedes hoy en el hotel</span></div>
      <p class="muted small">${I('lock')} La lista con nombres la ven solo el hotel y la garita, que la necesita para dejar pasar. La Administración ve únicamente la cantidad (Ley 25.326: mínimo acceso).</p>`;
    /* Las tarjetas de la portada abren esta lista con un filtro puesto
       (pedido de Claudio, 20-10-2026): "Llegan hoy" muestra solo a los que
       llegan, "Se van hoy" solo a los que se van y "Alojados" solo a los
       que siguen en el hotel. Arriba se cambia de filtro con un toque. */
    const hoy = hoyISO(), hd = huespedesDelDia(hoy), orden = ls => ls.sort((a, b) => a.desde.localeCompare(b.desde) || a.nombre.localeCompare(b.nombre));
    const G = { llegan:['Llegan hoy', hd.llegan, 'Nadie anunciado para hoy.', 'var(--sky)'], estan:['Alojados', hd.estan, 'No hay huéspedes de estadía: los de hoy llegan o se van.', 'var(--ok)'],
      salen:['Se van hoy', hd.salen, 'Nadie hace check-out hoy.', 'var(--accent)'], ...(esHotel() ? { futuros:['Próximos', hd.futuros, 'No hay reservas cargadas para los próximos días.', 'var(--brand)'] } : {}) };
    const f = G[p] ? p : 'todos';
    const fila = h => `<div class="it"><div class="txt"><b>${esc(h.nombre)}${+h.pax > 1 ? ` <small>(${h.pax})</small>` : ''}</b>
        <span>${fechaCorta(h.desde)} → ${fechaCorta(h.hasta)}${h.patente ? ' · ' + esc(h.patente) : ''}${h.llegaVuelo ? ' · llega ' + esc(h.llegaVuelo) : ''}${h.saleVuelo ? ' · se va ' + esc(h.saleVuelo) : ''}${h.ingreso ? ` · ${I('check')} ingresó ${hora(h.ingreso)} h` : ''}${h.salida ? ` · ${I('logout')} salió ${hora(h.salida)} h` : ''}</span></div>
      ${esGuardia() && h.desde <= hoy && !h.ingreso ? `<button class="btn btn-xs btn-ok" data-a="hhuesped-ingreso" data-id="${esc(h.id)}">${I('login')}Ingresó</button>` : ''}
      ${esGuardia() && h.hasta === hoy && h.ingreso && !h.salida ? `<button class="btn btn-xs btn-sec" data-a="hhuesped-salida" data-id="${esc(h.id)}">${I('logout')}Salió</button>` : ''}
      ${esHotel() && h.hasta >= hoy ? `<button class="icon-btn" data-a="hhuesped-pase" data-id="${esc(h.id)}" aria-label="Pase HUÉSPED DEL HOTEL por WhatsApp" title="Pase por WhatsApp">${I('qr')}</button>` : ''}
      ${esHotel() ? `<button class="icon-btn" data-a="hhuesped-editar" data-id="${esc(h.id)}" aria-label="Editar">${I('edit')}</button>` : ''}</div>`;
    const grupo = k => { const [t, ls, nada] = G[k]; return f === 'todos' && !ls.length ? '' : `${sec(`${t} (${hd.pax(ls)} ${hd.pax(ls) === 1 ? 'persona' : 'personas'})`)}${ls.length ? `<div class="card lista">${orden(ls).map(fila).join('')}</div>` : vacio('users', nada)}`; };
    const chips = segmento([...Object.entries(G).map(([k, g]) => ({ k, t:g[0].replace(' hoy', ''), n:hd.pax(g[1]), c:g[3] })), { k:'todos', t:'Todos', n:hd.pax([...hd.llegan, ...hd.estan, ...hd.salen.filter(h => h.desde !== hoy), ...(esHotel() ? hd.futuros : [])]), c:'var(--ink)' }], f, 'hhs-filtro', 'apilado');
    return `${esHotel() ? superficie({ a:'hhuesped-editar', icon:'plus', t:'Cargar un huésped', s:'Nombre, fechas, patente y vuelos (opcional)', cls:'acento' }) : ''}
      ${chips}
      <div class="hhs-lista" data-k="hhs-${f}">${f === 'todos' ? Object.keys(G).map(grupo).join('') || vacio('users', 'No hay huéspedes cargados.') : grupo(f)}</div>
      <p class="muted tiny" style="margin-top:12px">${I('lock')} Datos de terceros: se cargan solo los necesarios para el ingreso y los traslados, los ven únicamente el hotel y la garita y se borran solos al día siguiente del check-out. El hotel es responsable de informarle a su huésped que comparte estos datos con la guardia del barrio.</p>`;
  },
};
A['hhs-filtro'] = el => { const t = PILA.at(-1); if (t && t.id === 'hotel-huespedes') t.param = el.dataset.v || ''; refrescar(); };
A['hhuesped-editar'] = el => {
  if (!soloHotel()) return;
  const h = hotelHuespedes().find(x => x.id === el.dataset.id) || { desde:hoyISO(), hasta:sumarDias(hoyISO(), 2), pax:1 };
  hoja(h.id ? 'Editar huésped' : 'Nuevo huésped', `<form data-f="hhuesped" data-id="${esc(h.id || '')}">
    <div class="grid2"><div class="field"><label>Nombre y apellido</label><input name="nombre" required maxlength="60" value="${esc(h.nombre || '')}"></div>
      <div class="field"><label>Personas</label><input name="pax" type="number" min="1" max="30" value="${esc(h.pax || 1)}"></div></div>
    <div class="grid3"><div class="field"><label>Check-in</label><input type="date" name="desde" required value="${esc(h.desde)}"></div>
      <div class="field"><label>Check-out</label><input type="date" name="hasta" required value="${esc(h.hasta)}"></div>
      <div class="field"><label>Patente (auto propio o rentado)</label><input name="patente" maxlength="10" style="text-transform:uppercase" value="${esc(h.patente || '')}"></div></div>
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
  const id = form.dataset.id; let nuevo = '';
  Store.cambiar(s => { s.hotelHuespedes = aLista(s.hotelHuespedes);
    const datos = { nombre:d.nombre.trim(), pax:+d.pax || 1, desde:d.desde, hasta:d.hasta, patente:normPatente(d.patente),
      llegaVuelo:normVuelo(d.llegaVuelo), llegaHora:d.llegaHora || '', saleVuelo:normVuelo(d.saleVuelo), saleHora:d.saleHora || '' };
    const x = id && s.hotelHuespedes.find(h => h.id === id);
    if (x){ Object.assign(x, datos); if (!x.codigo) x.codigo = codigoHuesped(); nuevo = x.id; }
    else { nuevo = 'hh' + uid(); s.hotelHuespedes.push({ id:nuevo, at:Date.now(), codigo:codigoHuesped(), ...datos }); }
    trasladosDeHuespedes(s); });
  cerrarHoja(); toast('Huésped guardado: mandale su pase por WhatsApp', 'users');
  if (!id && nuevo) setTimeout(() => A['hhuesped-pase']({ dataset:{ id:nuevo } }), 80);
};
/* EL PASE "HUÉSPED DEL HOTEL" (pedido de Claudio, 20-10-2026: "que el hotel
   lo envíe a su WhatsApp como hacemos los vecinos con nuestras visitas, solo
   que diga HUÉSPED DEL HOTEL y no visita"). Vale del check-in al check-out,
   para entrar y salir cuantas veces quiera: a pie, en la van o en un auto
   (propio o rentado: el hotel suma la patente al editarlo y la garita
   también lo reconoce por la patente). El QR lleva solo un código al azar
   ("BHC:G-XXXXXX"): ni el nombre, ni las fechas, ni nada del huésped. */
/* LAS NORMAS DEL BARRIO EN LOS PASES DEL HOTEL (pedido de Claudio,
   20-10-2026: "un barrio privado, donde se respetan las normas de
   convivencia: 20 km/h, no fotografiar las casas, no afectar la flora ni la
   fauna; agradable y a la vez educativo"). Van dibujadas en la tarjeta del
   pase (como las indicaciones de una tarjeta de embarque), escritas en la
   ventana del pase y resumidas en el texto de WhatsApp. */
const NORMAS_PASE = [
  { ic:'20', t:'Máximo 20 km/h', s:'Cruzan chicos, mascotas, zorros y aves' },
  { ic:'foto', t:'Casas sin fotos', s:'La privacidad de los vecinos es su seguridad' },
  { ic:'hoja', t:'Flora y fauna', s:'Sin arrancar plantas ni alimentar animales' },
  { ic:'silencio', t:'Silencio', s:'Sin bocinas ni música fuerte: acá vive gente' },
];
const normasEscritoHtml = () => `<details class="card plana small normas-pase" data-k="normas-pase" open><summary><b>${I('sparkle')} Bienvenido/a a ${esc(Store.s.config.nombre || 'Bahía Cauquén')}: así se cuida el barrio</b></summary>
  <p>Vas a entrar a un barrio donde viven familias, entre el bosque fueguino de lengas y ñires y la costa del Canal Beagle. Para que tu visita sea tan linda como el lugar, te pedimos cuatro gestos simples:</p>
  <ul><li><b>A 20 km/h como máximo.</b> Por estas calles caminan chicos, vecinos con sus mascotas, y cruzan zorros, liebres y aves. A esa velocidad se frena a tiempo.</li>
    <li><b>Las casas no se fotografían.</b> Para los vecinos, su casa es su lugar más privado, y cuidarla también es cuidar su seguridad. El paisaje, el canal y las montañas, sí: ¡son para disfrutarlos!</li>
    <li><b>La naturaleza se mira y se cuida.</b> No arranques plantas ni flores, no alimentes ni persigas a los animales y llevate tu basura. Muchas aves anidan acá, y el bosque tarda décadas en crecer.</li>
    <li><b>Convivencia:</b> sin bocinazos ni música fuerte, respetando el descanso de quienes viven acá.</li></ul>
  <p style="margin:0"><b>Gracias por cuidar este lugar como si fuera tu casa. ¡Que lo disfrutes!</b></p></details>`;
const NORMAS_WA = `\n\n🌿 *Así se cuida el barrio:*\n🚗 Máximo *20 km/h*: cruzan chicos, mascotas y fauna.\n📷 *No fotografíes las casas* de los vecinos.\n🌱 Cuidá la flora y la fauna: no arranques plantas ni alimentes animales.\n🤫 Sin bocinas ni música fuerte.\n¡Gracias por cuidarlo como si fuera tu casa!`;
/* LA TARJETA DEL HOTEL, REDISEÑADA (pedido de Claudio, 20-10-2026: "más
   innovadora, atractiva y amigable"). Como un pase de embarque de la
   Patagonia, en los colores del Canal Beagle (azul noche, verde agua y
   turquesa; sin naranja, pedido de Claudio): cielo con estrellas, montañas y el canal; un
   saludo grande; las fechas como un vuelo (llega → se va) con la van en el
   camino; el código en dos "asientos"; las normas del barrio como cuatro
   stickers; y un talón troquelado con "Cómo llegar". Solo para los pases
   del hotel (huéspedes y personal): el de las visitas sigue igual.
   { contenido, codigo, etiqueta, saludo, nombre, tramo:[[k, v], [k, v]], chips:[...] } */
async function tarjetaHotelPng({ contenido, codigo, etiqueta, saludo, nombre, tramo, chips = [] }){
  const q = await cargarQR(); if (!q) return null;
  const logo = await cargarLogoPase();
  const qr = q(0, 'M'); qr.addData(contenido); qr.make();
  const W = 1080, H = 2190, X = 60, CW = W - 120, n = qr.getModuleCount();
  const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
  const F = (peso, px, fam = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif') => `${peso} ${px}px ${fam}`;
  const redondo = (x, y, w, h, r) => { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); };
  const recortar = (t, ancho) => { t = String(t || ''); while (g.measureText(t).width > ancho && t.length > 3) t = t.slice(0, -2).trimEnd() + '…'; return t; };
  /* el cielo: de la noche azul al atardecer cobre, con estrellas, montañas y el canal */
  const cielo = g.createLinearGradient(0, 0, 0, H); cielo.addColorStop(0, '#0b1f3a'); cielo.addColorStop(.45, '#0d4f63'); cielo.addColorStop(.78, '#0d6b66'); cielo.addColorStop(1, '#5fc4b8'); g.fillStyle = cielo; g.fillRect(0, 0, W, H);
  g.fillStyle = 'rgba(255,255,255,.85)'; for (let i = 0; i < 70; i++){ const x = (i * 157) % W, y = (i * 89) % 900, r = i % 5 ? 1.6 : 3; g.globalAlpha = .3 + (i % 4) * .15; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); } g.globalAlpha = 1;
  g.fillStyle = '#ffe7a8'; g.beginPath(); g.arc(W - 120, 120, 44, 0, 7); g.fill(); g.fillStyle = cielo; g.beginPath(); g.arc(W - 100, 108, 40, 0, 7); g.fill();
  const montes = (y, alt, col, fase) => { g.fillStyle = col; g.beginPath(); g.moveTo(0, H); g.lineTo(0, y); for (let x = 0; x <= W; x += 90){ g.lineTo(x + 45, y - alt * (0.5 + 0.5 * Math.abs(Math.sin((x + fase) / 140)))); g.lineTo(x + 90, y - alt * 0.25); } g.lineTo(W, H); g.fill(); };
  montes(H - 250, 160, 'rgba(13,43,69,.35)', 0); montes(H - 170, 110, 'rgba(13,43,69,.5)', 70);
  g.fillStyle = 'rgba(11,31,58,.45)'; g.fillRect(0, H - 110, W, 110); g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 3;
  for (let k = 0; k < 3; k++){ g.beginPath(); for (let x = 0; x <= W; x += 20) g.lineTo(x, H - 80 + k * 26 + Math.sin(x / 40 + k) * 5); g.stroke(); }
  /* la tarjeta, con sombra, y el troquel con muescas */
  const Y0 = 70, YT1 = 640, YT2 = 1950, Y1 = H - 70;
  g.save(); g.shadowColor = 'rgba(0,0,0,.4)'; g.shadowBlur = 50; g.shadowOffsetY = 18; redondo(X, Y0, CW, Y1 - Y0, 48); g.fillStyle = '#fbfefd'; g.fill(); g.restore();
  g.save(); redondo(X, Y0, CW, Y1 - Y0, 48); g.clip();
  /* cabecera cobre con montañas */
  const cab = g.createLinearGradient(X, Y0, X + CW, Y0 + 330); cab.addColorStop(0, '#0d2b45'); cab.addColorStop(.55, '#0d6b66'); cab.addColorStop(1, '#14968c'); g.fillStyle = cab; g.fillRect(X, Y0, CW, 330);
  g.fillStyle = 'rgba(255,255,255,.12)'; g.beginPath(); g.moveTo(X, Y0 + 330); [[160, 210], [300, 270], [470, 170], [640, 280], [800, 190], [960, 250]].forEach(([dx, dy]) => g.lineTo(X + dx, Y0 + dy)); g.lineTo(X + CW, Y0 + 330); g.fill();
  g.restore();
  let tx = X + 48;
  if (logo){ g.save(); g.beginPath(); g.arc(X + 48 + 40, Y0 + 78, 40, 0, 7); g.fillStyle = '#fff'; g.fill(); g.clip(); g.drawImage(logo, X + 48, Y0 + 38, 80, 80); g.restore(); tx += 100; }
  g.textAlign = 'left'; g.fillStyle = '#fff'; g.font = F(800, 34); g.fillText(HOTEL_NOMBRE, tx, Y0 + 72); g.globalAlpha = .85; g.font = F(600, 23); g.fillText(`Barrio ${Store.s.config.nombre || 'Bahía Cauquén'} · Ushuaia`, tx, Y0 + 106); g.globalAlpha = 1;
  g.font = F(900, 22); const ew = g.measureText(etiqueta).width + 44; redondo(X + CW - 48 - ew, Y0 + 150, ew, 48, 24); g.fillStyle = '#ffd36b'; g.fill(); g.fillStyle = '#3a2a00'; g.textAlign = 'center'; g.fillText(etiqueta, X + CW - 48 - ew / 2, Y0 + 182);
  g.textAlign = 'left'; g.fillStyle = '#fff'; g.font = F(700, 30); g.fillText(saludo, X + 48, Y0 + 238); g.font = F(900, 60); g.fillText(recortar(nombre, CW - 96), X + 48, Y0 + 300);
  /* el tramo, como un vuelo: llega → se va, con la van en el camino */
  const ty = Y0 + 400, colA = X + 56, colB = X + CW - 56;
  g.fillStyle = '#7f9a96'; g.font = F(800, 21); g.fillText(tramo[0][0], colA, ty); g.textAlign = 'right'; g.fillText(tramo[1][0], colB, ty);
  g.fillStyle = '#1b2a33'; g.font = F(900, 52); g.textAlign = 'left'; g.fillText(tramo[0][1], colA, ty + 60); g.textAlign = 'right'; g.fillText(tramo[1][1], colB, ty + 60);
  g.textAlign = 'left'; const ax = colA + 270, bx = colB - 270, ay = ty + 40;
  g.strokeStyle = '#b9dcd6'; g.lineWidth = 4; g.setLineDash([12, 12]); g.beginPath(); g.moveTo(ax, ay); g.quadraticCurveTo((ax + bx) / 2, ay - 60, bx, ay); g.stroke(); g.setLineDash([]);
  const vx = (ax + bx) / 2, vy = ay - 30; g.fillStyle = '#0d6b66'; redondo(vx - 34, vy - 18, 68, 30, 9); g.fill(); g.fillStyle = '#9fd6ec'; redondo(vx - 26, vy - 13, 18, 11, 3); g.fill(); redondo(vx - 4, vy - 13, 18, 11, 3); g.fill();
  g.fillStyle = '#1d2430'; [vx - 20, vx + 20].forEach(x => { g.beginPath(); g.arc(x, vy + 13, 8, 0, 7); g.fill(); });
  /* los chips: personas, acceso */
  let cx = colA; g.font = F(800, 22);
  chips.forEach(t => { const w = g.measureText(t).width + 40; redondo(cx, ty + 96, w, 46, 23); g.fillStyle = '#e3f3f0'; g.fill(); g.fillStyle = '#0d5f5a'; g.fillText(t, cx + 20, ty + 127); cx += w + 12; });
  /* troquel */
  const troquel = y => { g.fillStyle = cielo; [X, X + CW].forEach(x => { g.beginPath(); g.arc(x, y, 30, 0, 7); g.fill(); }); g.strokeStyle = '#d3e6e2'; g.lineWidth = 4; g.setLineDash([16, 14]); g.beginPath(); g.moveTo(X + 46, y); g.lineTo(X + CW - 46, y); g.stroke(); g.setLineDash([]); };
  troquel(YT1);
  /* el QR en un marco con borde de colores */
  const lado = 560, qx = (W - lado) / 2, qy = YT1 + 70, cel = lado / n;
  const marco = g.createLinearGradient(qx, qy, qx + lado, qy + lado); marco.addColorStop(0, '#14968c'); marco.addColorStop(.5, '#1d7fb0'); marco.addColorStop(1, '#7a4bc2');
  redondo(qx - 40, qy - 40, lado + 80, lado + 80, 40); g.fillStyle = marco; g.fill(); redondo(qx - 30, qy - 30, lado + 60, lado + 60, 32); g.fillStyle = '#fff'; g.fill();
  g.fillStyle = '#16212a'; for (let r = 0; r < n; r++) for (let k = 0; k < n; k++) if (qr.isDark(r, k)) g.fillRect(Math.floor(qx + k * cel), Math.floor(qy + r * cel), Math.ceil(cel), Math.ceil(cel));
  /* el código, en dos "asientos" */
  const cy = qy + lado + 96; g.textAlign = 'center'; g.fillStyle = '#7f9a96'; g.font = F(800, 21); g.fillText('TU CÓDIGO PARA LA GARITA', W / 2, cy);
  const partes = String(codigo).split(' ').filter(Boolean), pw = 230, gapP = 24, x0 = W / 2 - (partes.length * pw + (partes.length - 1) * gapP) / 2;
  partes.forEach((p, i) => { const px = x0 + i * (pw + gapP); redondo(px, cy + 20, pw, 100, 22); g.fillStyle = '#1b2a33'; g.fill(); g.fillStyle = '#ffd36b'; g.font = F(900, 64, 'ui-monospace, "SF Mono", Menlo, Consolas, monospace'); g.fillText(p, px + pw / 2, cy + 92); });
  g.fillStyle = '#4f6662'; g.font = F(600, 23); g.fillText('Mostrá el QR o decí el código, al entrar y al salir', W / 2, cy + 168);
  /* las normas, como cuatro stickers */
  const ny = cy + 220; g.fillStyle = '#2f6b3a'; g.font = F(900, 25); g.fillText('EN EL BARRIO, NOS RESPETAMOS ENTRE TODOS', W / 2, ny + 6);
  const ST = [['20', '#d33a3a', '#fde7e4', 'Máximo', '20 km/h'], ['foto', '#7a4bc2', '#efe6fb', 'Casas', 'sin fotos'], ['hoja', '#2f8f5b', '#e3f3e8', 'Cuidá flora', 'y fauna'], ['silencio', '#1d7fb0', '#e1f0f8', 'Silencio y', 'descanso']];
  const sw = CW / 4;
  ST.forEach(([ic, col, fondo, l1, l2], i) => { const ix = X + sw * i + sw / 2, iy = ny + 110;
    g.save(); g.translate(ix, iy); g.rotate((i % 2 ? 1 : -1) * 0.06); g.beginPath(); g.arc(0, 0, 68, 0, 7); g.fillStyle = fondo; g.fill(); g.lineWidth = 5; g.strokeStyle = '#fff'; g.stroke();
    g.lineCap = 'round'; g.lineJoin = 'round';
    if (ic === '20'){ g.beginPath(); g.arc(0, 0, 44, 0, 7); g.fillStyle = '#fff'; g.fill(); g.lineWidth = 10; g.strokeStyle = col; g.stroke(); g.fillStyle = '#111'; g.font = F(900, 36); g.textAlign = 'center'; g.fillText('20', 0, 13); }
    else { g.strokeStyle = col; g.fillStyle = col; g.lineWidth = 6;
      if (ic === 'foto'){ redondo(-26, -16, 52, 36, 8); g.stroke(); g.beginPath(); g.arc(0, 2, 10, 0, 7); g.stroke(); g.beginPath(); g.moveTo(-10, -16); g.lineTo(-5, -24); g.lineTo(6, -24); g.lineTo(10, -16); g.stroke(); g.strokeStyle = '#d33a3a'; g.lineWidth = 7; g.beginPath(); g.moveTo(-34, -34); g.lineTo(34, 34); g.stroke(); }
      else if (ic === 'hoja'){ g.beginPath(); g.moveTo(-24, 26); g.bezierCurveTo(-32, -18, 6, -36, 28, -28); g.bezierCurveTo(32, 6, 4, 32, -24, 26); g.fill(); g.strokeStyle = fondo; g.lineWidth = 4; g.beginPath(); g.moveTo(-24, 26); g.quadraticCurveTo(0, 0, 18, -18); g.stroke(); }
      else { g.beginPath(); g.moveTo(-26, -9); g.lineTo(-12, -9); g.lineTo(4, -24); g.lineTo(4, 24); g.lineTo(-12, 9); g.lineTo(-26, 9); g.closePath(); g.fill(); g.strokeStyle = '#d33a3a'; g.lineWidth = 6; g.beginPath(); g.moveTo(14, -12); g.lineTo(34, 12); g.moveTo(34, -12); g.lineTo(14, 12); g.stroke(); } }
    g.restore(); g.textAlign = 'center'; g.fillStyle = '#1b2a33'; g.font = F(800, 25); g.fillText(l1, ix, iy + 112); g.fillText(l2, ix, iy + 142); });
  g.fillStyle = '#5f7773'; g.font = F(600, 22); g.fillText('Por las calles cruzan chicos, mascotas, zorros y aves. ¡Gracias por cuidarlo!', W / 2, ny + 316);
  troquel(YT2);
  /* el talón: cómo llegar */
  const sy = YT2 + 40; g.fillStyle = '#d33a3a'; const px = X + 90, py = sy + 96;
  g.beginPath(); g.moveTo(px, py); g.bezierCurveTo(px - 34, py - 40, px - 30, py - 86, px, py - 86); g.bezierCurveTo(px + 30, py - 86, px + 34, py - 40, px, py); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(px, py - 58, 11, 0, 7); g.fill();
  g.textAlign = 'left'; g.fillStyle = '#1b2a33'; g.font = F(900, 32); g.fillText('Cómo llegar', X + 150, sy + 40);
  g.fillStyle = '#4f6662'; g.font = F(600, 24); g.fillText('Buscá en Google Maps:', X + 150, sy + 78); g.fillStyle = '#0d6b66'; g.font = F(900, 27); g.fillText('Barrio ' + (Store.s.config.nombre || 'Bahía Cauquén'), X + 150, sy + 114);
  g.textAlign = 'right'; g.fillStyle = '#7f9a96'; g.font = F(800, 20); g.fillText('VÁLIDO EN LA GARITA', X + CW - 48, sy + 40); g.fillStyle = '#1b2a33'; g.font = F(900, 28); g.fillText('A pie o en auto', X + CW - 48, sy + 78);
  return new Promise(ok => c.toBlob(ok, 'image/png'));
}
function codigoHuesped(){
  const todos = EMP_ABC + EMP_NUM, usados = new Set(hotelHuespedes().map(h => h.codigo));
  for (let k = 0; k < 50; k++){ const r = new Uint32Array(6); (crypto || window.msCrypto).getRandomValues(r);
    const c = [...r].map(x => todos[x % todos.length]).join(''); if (/[A-Z]/.test(c) && /\d/.test(c) && !usados.has(c)) return c; }
  return 'G' + Date.now().toString(36).toUpperCase().slice(-5);
}
const codHuespedLindo = c => String(c || '').replace(/^(.{3})(.{3})$/, '$1 $2');
const huespedVigente = (h, hoy = hoyISO()) => h.desde <= hoy && h.hasta >= hoy && !h.salida;
A['hhuesped-pase'] = el => {
  if (!soloHotel()) return; let h = hotelHuespedes().find(x => x.id === el.dataset.id); if (!h) return;
  if (!h.codigo){ const c = codigoHuesped(); Store.cambiar(s => { const x = aLista(s.hotelHuespedes).find(z => z.id === h.id); if (x && !x.codigo) x.codigo = c; }); h = { ...h, codigo:c }; }
  hoja('Pase del huésped', `<div class="ticket hemp-cred"><div class="tk-top" style="background:linear-gradient(120deg,#0d2b45,#0d6b66 55%,#14968c)"><small>${I('star')} HUÉSPED DEL HOTEL · ${HOTEL_NOMBRE}</small><h3>${esc(h.nombre)}</h3><div style="opacity:.85;font-size:13px">${plural(+h.pax || 1, 'persona')} · ${fechaCorta(h.desde)} → ${fechaCorta(h.hasta)}</div></div>
    <div class="bottom"><div class="qr-box" data-qr="BHC:G-${esc(h.codigo)}"></div><div class="muted tiny" style="margin-top:8px">Código</div><div class="codigo-grande hemp-cod">${esc(codHuespedLindo(h.codigo))}</div>
      ${h.patente ? `<div class="cv-chapa lista" style="margin:10px auto 0;max-width:220px"><small>REPÚBLICA ARGENTINA</small><b>${esc(chapaTexto(h.patente))}</b></div>` : ''}</div></div>
    <button class="btn btn-wa btn-block" style="margin-top:12px" data-a="hhuesped-wa" data-id="${esc(h.id)}">${I('share')}Mandárselo por WhatsApp</button>
    ${normasEscritoHtml()}
    <div class="card plana small" style="margin-top:12px;line-height:1.5"><b>Sirve para entrar y salir del barrio cuantas veces quiera</b>, hasta el check-out: a pie, en la van o en auto. Si alquila un auto, sumá la patente en "Editar" y la garita también lo reconoce por la patente. El QR no lleva datos: solo un código que la app reconoce.</div>`);
  setTimeout(() => $$('#hoja [data-qr]').forEach(x => pintarQR(x, x.dataset.qr)), 60);
};
A['hhuesped-wa'] = el => {
  const h = hotelHuespedes().find(x => x.id === el.dataset.id); if (!h || !h.codigo) return;
  const texto = `🏨 *HUÉSPED DEL HOTEL · ${HOTEL_NOMBRE}*\n\nHola ${h.nombre}: este es tu pase para entrar y salir del Barrio ${Store.s.config.nombre} hasta el ${fechaCorta(h.hasta)}.\n\n🔑 Código: *${codHuespedLindo(h.codigo)}*\n\nEn la garita mostrá el QR o decí el código, a pie o en auto.${NORMAS_WA}\n\n📍 *Cómo llegar:* ${mapaCorto()}`;
  const mes = f => fechaDe(f).toLocaleDateString('es-AR', { day:'numeric', month:'short' }).replace('.', '').toUpperCase();
  compartirPase({ texto, contenido:'BHC:G-' + h.codigo, codigo:codHuespedLindo(h.codigo), titulo:HOTEL_NOMBRE, sub:h.nombre, archivo:`huesped-${h.codigo}.png`,
    imagen:() => tarjetaHotelPng({ contenido:'BHC:G-' + h.codigo, codigo:codHuespedLindo(h.codigo), etiqueta:'HUÉSPED DEL HOTEL', saludo:+h.pax > 1 ? '¡Bienvenidos!' : '¡Bienvenido/a!', nombre:h.nombre,
      tramo:[['LLEGA', mes(h.desde)], ['SE VA', mes(h.hasta)]], chips:[plural(+h.pax || 1, 'persona'), 'Entra y sale libre'] }),
    datos:{ nombre:h.nombre, cuando:`${fechaCorta(h.desde)} al ${fechaCorta(h.hasta)}`, horario:'Entra y sale libre', etiqueta:'HUÉSPED DEL HOTEL', normas:NORMAS_PASE } });
};
/* En la garita: el QR del huésped (o el código que dice) abre su ficha con "Salió" / "Volvió". */
const hMovsHuesped = h => aLista(Store.s.hotelMovs).filter(m => m && m.huespedId === h.id).sort((a, b) => b.at - a.at);
const huespedAdentro = h => { const m = hMovsHuesped(h)[0]; return m ? m.tipo === 'in' : !!h.ingreso && !h.salida; };
function hotelHuespedCodigo(txt){
  if (!esGuardia()) return false;
  const crudo = String(txt || '').toUpperCase().replace(/^BHC:/, '').replace(/[\s.]/g, ''), m = crudo.match(/^G-?([A-Z0-9]{6})$/); if (!m) return false;
  const h = hotelHuespedes().find(x => x.codigo === m[1]);
  if (!h){ if (crudo.includes('-')){ hoja('Pase desconocido', aviso('danger', 'x', 'Ese pase de huésped no vale', 'Puede ser de alguien que ya hizo el check-out. Consultá con la recepción del hotel.')); return true; } return false; }
  const hoy = hoyISO(), vale = huespedVigente(h, hoy), dentro = huespedAdentro(h);
  hoja('Huésped del hotel', `${vale ? aviso('ok', 'check', 'HUÉSPED DEL HOTEL · autorizado', `${esc(HOTEL_NOMBRE)} · hasta el ${fechaCorta(h.hasta)}`) : aviso('danger', 'x', 'EL PASE NO VALE HOY', h.salida ? 'Ya hizo el check-out.' : `Vale del ${fechaCorta(h.desde)} al ${fechaCorta(h.hasta)}. Consultá con la recepción del hotel.`)}
    <div class="card"><b style="font-size:18px">${esc(h.nombre)}</b><div class="muted small">${plural(+h.pax || 1, 'persona')} · ${fechaCorta(h.desde)} → ${fechaCorta(h.hasta)}${h.patente ? ` · <span class="hp-chapa chica">${esc(chapaTexto(h.patente))}</span>` : ''}</div>
      <div class="small" style="margin-top:4px">${dentro ? `${I('login')} <b>Adentro</b>` : `${I('logout')} Afuera`}</div></div>
    ${vale ? `<div class="btns"><button class="btn btn-grande ${dentro ? 'btn-sec' : 'btn-ok'} grow" data-a="hhuesped-paso" data-id="${esc(h.id)}" data-v="${dentro ? 'out' : 'in'}">${I(dentro ? 'logout' : 'login')}${dentro ? 'Sale' : 'Entra'}</button>
      <button class="btn btn-sec grow" data-a="hhuesped-paso" data-id="${esc(h.id)}" data-v="${dentro ? 'in' : 'out'}">No: ${dentro ? 'está entrando' : 'está saliendo'}</button></div>
      <label class="check" style="margin-top:10px"><input type="checkbox" id="hhAPie"> Va a pie (sin auto)</label>` : ''}`);
  return true;
}
A['hhuesped-paso'] = el => {
  if (!soloGarita()) return;
  const h = hotelHuespedes().find(x => x.id === el.dataset.id); if (!h) return;
  const tipo = el.dataset.v === 'in' ? 'in' : 'out', at = Date.now(), aPie = !!($('#hhAPie') && $('#hhAPie').checked);
  Store.cambiar(s => { s.hotelMovs = aLista(s.hotelMovs); s.hotelMovs.unshift({ id:'hm' + uid(), huespedId:h.id, tipo, at, por:yo().id, ...(aPie ? { aPie:true } : {}) });
    const x = aLista(s.hotelHuespedes).find(z => z.id === h.id); if (x && tipo === 'in' && !x.ingreso) x.ingreso = at;
    s.bitacora.unshift({ id:uid(), autor:yo().id, tipo:'acceso', texto:`${tipo === 'in' ? 'Ingreso' : 'Egreso'}: huésped del hotel con su pase${aPie ? ' · a pie' : h.patente ? ' · ' + h.patente : ''}`, at }); });
  cerrarHoja(); toast(`Huésped: ${tipo === 'in' ? 'entrada' : 'salida'} registrada`, tipo === 'in' ? 'login' : 'logout');
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
/* Una patente escrita (o leída por la cámara) en la garita que es de una
   van, de un proveedor, de un empleado o de un huésped del hotel. */
function hotelValidar(pat){
  if (!pat || pat.length < 6 || !esGuardia()) return false;
  const v = hotelVans().find(x => normPatente(x.patente) === pat);
  if (v) return hotelCodigo(String(v.codigo).toUpperCase());
  const p = hotelProvs().find(x => normPatente(x.patentes).includes(pat));
  if (p) return hotelCodigo(String(p.codigo).toUpperCase());
  /* 15-10-2026: el auto de un empleado del hotel (el lector de patentes lo reconoce). */
  const em = typeof hotelEmpleados === 'function' ? hotelEmpleados().find(x => x.patente && normPatente(x.patente) === pat) : null;
  if (em) return hojaEmpleadoGarita(em, 'por su patente');
  const h = hotelHuespedes().find(x => normPatente(x.patente) === pat && x.desde <= hoyISO() && x.hasta >= hoyISO());
  /* Con su pase (20-10-2026): la misma ficha que el QR, con "Entra" y "Sale" cada vez (auto propio o rentado). */
  if (h && h.codigo) return hotelHuespedCodigo('BHC:G-' + h.codigo);
  if (h){ hoja('Huésped del hotel', `${aviso('ok', 'users', 'Huésped del ' + HOTEL_NOMBRE, `${fechaCorta(h.desde)} → ${fechaCorta(h.hasta)}`)}<div class="card"><b style="font-size:17px">${esc(h.nombre)}</b><div class="muted small">${esc(h.patente)} · ${plural(+h.pax || 1, 'persona')}</div></div>
      ${!h.ingreso ? `<button class="btn btn-ok btn-block btn-grande" data-a="hhuesped-ingreso" data-id="${esc(h.id)}">${I('login')}Registrar el ingreso</button>` : `<div class="card plana small">${I('check')} Ingresó a las ${hora(h.ingreso)} h</div>`}`); return true; }
  return false;
}

/* =========================================================
   LOS EMPLEADOS DEL HOTEL, CON CREDENCIAL PERMANENTE (pedido de Claudio,
   15-10-2026: "que la gerencia pueda cargar como visitas frecuentes a sus
   empleados una vez y sirva para siempre o se pueda editar si cambian o se
   pierde la entrada: un QR pegado en el parabrisas, el lector de patentes
   o un código alfanumérico que diga el empleado al entrar y salir").

   CÓMO ANDA
   · El hotel carga a cada empleado UNA vez (nombre, apellido, DNI, puesto,
     y si quiere la patente, los días y el horario). Lo edita cuando cambia
     y lo da de baja cuando se va.
   · Cada uno tiene una credencial: un QR para imprimir y pegar en el
     parabrisas y un CÓDIGO CORTO para decir en voz alta (5 signos, sin las
     letras y números que se confunden al hablar o al leer: ni O/0, ni I/1,
     ni B/V/8, ni S/5, ni N/M, ni Z/2). Si se pierde, "Credencial nueva": el
     QR y el código viejos dejan de valer al instante.
   · En la garita se lo reconoce de tres maneras: leyendo el QR, con el
     lector de patentes (si cargó su auto) o escribiendo el código que dice.
     La entrada y la salida se marcan con un toque.
   · El hotel ve en vivo quién de los suyos está adentro.

   Se reusa lo que ya había: el horario y los días se controlan con
   frecuenteVigente (los ingresos frecuentes), los pasos van a hotelMovs
   (como las vans y los proveedores del hotel), el DNI se muestra tapado
   como en mantenimiento, el pedido firmado de "no dejar pasar" se cruza
   igual que con cualquier visita, y la tarjeta para WhatsApp es la del
   pase fijo.

   PROTECCIÓN DE DATOS (Ley 25.326, mínimo acceso)
   · hotel/hotelEmpleados: lo escribe solo el hotel; lo leen el hotel y la
     garita. Ni la Administración, ni la supervisión, ni los vecinos.
   · La garita ve el DNI tapado (los tres últimos números, para cotejar).
   · Los pasos (hotel/hotelMovs) llevan solo el id del empleado y la hora;
     la bitácora, el nombre y el puesto, nunca el DNI. Se borran solos a
     los 30 días, como los de las vans.
   · "Dar de baja" borra la ficha entera (con el DNI): la credencial deja
     de valer y en la bitácora queda solo lo que ya pasó.

   Ideas de apps con más de 1000 estrellas en GitHub (solo la idea, código
   propio): el pase de empleado con QR fijo y el "quién está adentro" de
   Snipe-IT (11k★) y de los sistemas de visitas tipo "Envoy" de código
   abierto (Lobby Track); el código corto sin signos ambiguos, del
   alfabeto "Crockford Base32" (sin I, L, O, U).
   ========================================================= */
const hotelEmpleados = () => aLista(Store.s.hotelEmpleados).filter(e => e && e.id);
const hEmpNombre = e => `${e.nombre || ''} ${e.apellido || ''}`.trim();
/* El código para decir: 5 signos con al menos una letra y un número. */
const EMP_ABC = 'ACDEFGHJKPRTUXY', EMP_NUM = '34679';
function codigoEmpleado(){
  const todos = EMP_ABC + EMP_NUM, usados = new Set(hotelEmpleados().map(e => e.codigo));
  for (let k = 0; k < 50; k++){
    const r = new Uint32Array(5); (crypto || window.msCrypto).getRandomValues(r);
    const c = [...r].map(x => todos[x % todos.length]).join('');
    if (/[A-Z]/.test(c) && /\d/.test(c) && !usados.has(c)) return c;
  }
  return 'E' + Date.now().toString(36).toUpperCase().slice(-4);
}
/* Lo que escribe la garita o lee el QR ("BHC:E-K7M3P", "e k7m-3p", "K7M3P"). */
/* El QR trae "E-" adelante; el que dice el empleado, solo los 5 signos.
   Sin el guion no se saca la E: una patente vieja como "EKA347" no es un código. */
const codigoEmpDe = txt => String(txt || '').toUpperCase().replace(/^BHC:/, '').replace(/[\s.]/g, '').replace(/^E-(?=[A-Z0-9]{5}$)/, '').replace(/-/g, '');
const codigoEmpLindo = c => String(c || '').replace(/^(.{3})(.{2})$/, '$1 $2');
/* Adentro o afuera: por su último paso por la garita. */
const hEmpMovs = e => aLista(Store.s.hotelMovs).filter(m => m && m.empId === e.id).sort((a, b) => b.at - a.at);
function estadoEmp(e){
  const m = hEmpMovs(e)[0];
  return m ? { adentro:m.tipo === 'in', desde:m.at } : { adentro:false, desde:0 };
}
const hEmpAdentro = () => hotelEmpleados().filter(e => estadoEmp(e).adentro);
const hEmpHoy = e => { const ini = new Date(); ini.setHours(0, 0, 0, 0); return hEmpMovs(e).filter(m => m.at >= +ini).reverse(); };
const hEmpHoyTxt = e => { const ms = hEmpHoy(e); return ms.length ? 'Hoy: ' + ms.map(m => `${m.tipo === 'in' ? 'entró' : 'salió'} ${hora(m.at)}`).join(' · ') : ''; };
const hEmpHorario = e => `${aLista(e.dias).length ? textoDias(e.dias) : 'Cualquier día'}${e.desde && e.hasta ? ` · ${e.desde} a ${e.hasta} h` : ''}`;
const hEmpIniciales = e => ((e.nombre || '?')[0] + ((e.apellido || '')[0] || '')).toUpperCase();
/* LOS DÍAS AUTORIZADOS (Claudio, 15-10-2026: "los empleados del hotel le
   deben llegar a la garita como visitas frecuentes para permitir el ingreso
   y egreso los días autorizados"). Igual que un ingreso frecuente: un día
   que no es suyo, la garita NO le marca la entrada (lo ve en rojo y llama a
   la recepción del hotel); fuera del horario, entra con una observación.
   La salida se marca siempre: nadie queda "adentro" por error. */
const hEmpHoyLeToca = e => !aLista(e.dias).length || aLista(e.dias).map(Number).includes(new Date().getDay());
const hEmpPuedeEntrar = e => hEmpHoyLeToca(e);
/* Más de 14 h adentro: ¿se olvidaron de marcar la salida? */
const hEmpOlvido = e => { const s = estadoEmp(e); return s.adentro && Date.now() - s.desde > 14 * HORA; };

R['hotel-empleados'] = {
  titulo:'Empleados del hotel', icon:'users', color:'wood', ancha:true,
  sub:() => esGuardia() ? 'Entran con su QR, su patente o su código' : 'Credencial permanente: QR, patente o código',
  render(q){
    if (!esHotel() && !esGuardia()) return vacio('lock', 'Los empleados del hotel los ven solo el hotel y la garita.');
    const qq = normTxt(q || ''), todos = hotelEmpleados();
    const ls = todos.filter(e => !qq || normTxt([hEmpNombre(e), e.puesto, e.patente, e.codigo, esHotel() ? e.dni : ''].join(' ')).includes(qq))
      .sort((a, b) => (estadoEmp(b).adentro - estadoEmp(a).adentro) || hEmpNombre(a).localeCompare(hEmpNombre(b), 'es'));
    const adentro = hEmpAdentro();
    const tarjeta = e => { const st = estadoEmp(e), hoy = hEmpHoyTxt(e);
      return `<div class="card hemp-card ${st.adentro ? 'adentro' : ''}"><div class="row" style="align-items:flex-start;gap:12px">
          <span class="hemp-av" style="--h:${mantTono(e)}">${esc(hEmpIniciales(e))}</span>
          <div class="grow"><b>${esc(hEmpNombre(e))}</b><div class="muted small">${esc(e.puesto || 'Empleado/a')}${e.patente ? ` · <span class="hp-chapa chica">${esc(chapaTexto(e.patente))}</span>` : ''}</div>
            <div class="muted tiny">${esc(hEmpHorario(e))}${esGuardia() && e.dni ? ' · DNI ' + esc(mantDniTapado(e.dni)) : ''}</div>
            <div class="hv-pills"><span class="pill ${st.adentro ? 'p-ok' : ''}">${st.adentro ? `${I('login')}Adentro desde las ${hora(st.desde)}` : 'Afuera'}</span>
              ${hEmpOlvido(e) ? `<span class="pill p-warn">${I('alert')}¿Falta marcar la salida?</span>` : ''}
              ${aLista(e.dias).length && !st.adentro ? (hEmpHoyLeToca(e) ? `<span class="pill p-sky">${I('clock')}Hoy le toca</span>` : `<span class="pill">Hoy no le toca</span>`) : ''}
              ${esHotel() ? `<span class="pill mono">${esc(codigoEmpLindo(e.codigo))}</span>` : ''}</div>
            ${hoy ? `<div class="muted tiny" style="margin-top:4px">${esc(hoy)}</div>` : ''}</div></div>
        <div class="btns" style="margin-top:10px">
          ${esGuardia() ? (st.adentro || hEmpPuedeEntrar(e) ? `<button class="btn btn-sm ${st.adentro ? 'btn-sec' : 'btn-ok'}" data-a="hemp-mov" data-id="${esc(e.id)}" data-v="${st.adentro ? 'out' : 'in'}">${I(st.adentro ? 'logout' : 'login')}${st.adentro ? 'Salió' : 'Entró'}</button>` : `<span class="pill p-danger">${I('calendar')}Hoy no es su día</span>`) : ''}
          ${esHotel() ? `<button class="btn btn-xs btn-pri" data-a="hemp-cred" data-id="${esc(e.id)}">${I('qr')}Credencial</button>
            <button class="btn btn-xs btn-sec" data-a="hemp-editar" data-id="${esc(e.id)}">${I('edit')}Editar</button>` : ''}</div></div>`; };
    return `${esHotel() ? `<div class="hemp-intro"><span class="hemp-intro-ic">${I('qr')}</span><div class="grow"><b>Cargalos una vez y sirve para siempre</b>
          <small>Cada empleado entra al barrio con su QR en el parabrisas, con la patente de su auto o diciendo su código en la garita. Si pierde la credencial, generás una nueva y la vieja deja de valer.</small></div></div>
        ${superficie({ a:'hemp-editar', icon:'plus', color:'wood', t:'Cargar un empleado', s:'Nombre, apellido, DNI y, si tiene, la patente', cls:'acento' })}` : ''}
      <div class="hemp-kpis"><div class="kpi"><b>${adentro.length}</b><span>adentro ahora</span></div><div class="kpi"><b>${todos.length}</b><span>${todos.length === 1 ? 'empleado' : 'empleados'}</span></div></div>
      ${todos.length > 4 ? `<form data-f="buscar-hemp" class="linea-form" style="margin:12px 0"><input name="q" value="${esc(q || '')}" placeholder="Nombre, puesto, patente o código"><button class="btn btn-pri">${I('search')}</button></form>` : ''}
      ${ls.length ? ls.map(tarjeta).join('') : vacio('users', qq ? 'Nadie coincide con la búsqueda.' : esHotel() ? 'Todavía no cargaste empleados.' : 'El hotel todavía no cargó a sus empleados.')}
      <p class="muted tiny" style="margin-top:12px">${I('lock')} ${esHotel() ? 'Los datos de tus empleados los ven solo el hotel y la garita (la garita, el DNI tapado). En la bitácora del barrio quedan el nombre, el puesto y la hora, nunca el DNI. Al dar de baja a alguien se borra su ficha.' : 'El DNI va tapado: los tres últimos números alcanzan para cotejar con el documento. En la bitácora queda el nombre y el puesto, nunca el DNI.'}</p>`;
  },
};
F['buscar-hemp'] = d => abrir('hotel-empleados', d.q || '');

/* ---------- el hotel: cargar, editar, credencial nueva y baja ---------- */
A['hemp-editar'] = el => {
  if (!soloHotel()) return;
  const e = hotelEmpleados().find(x => x.id === el?.dataset?.id) || { dias:[] };
  const dias = aLista(e.dias).map(Number);
  hoja(e.id ? 'Editar empleado' : 'Nuevo empleado', `<form data-f="hemp" data-id="${esc(e.id || '')}">
    <div class="grid2"><div class="field"><label>Nombre</label><input name="nombre" required maxlength="40" value="${esc(e.nombre || '')}" autocomplete="off"></div>
      <div class="field"><label>Apellido</label><input name="apellido" required maxlength="40" value="${esc(e.apellido || '')}" autocomplete="off"></div></div>
    <div class="grid2"><div class="field"><label>DNI (solo números)</label><input name="dni" required inputmode="numeric" maxlength="10" autocomplete="off" value="${esc(mantDniLindo(e.dni || ''))}"></div>
      <div class="field"><label>Puesto (opcional)</label><input name="puesto" maxlength="40" list="hEmpPuestos" value="${esc(e.puesto || '')}" placeholder="Recepción, cocina, mucama…"><datalist id="hEmpPuestos">${['Recepción', 'Cocina', 'Mucama', 'Mantenimiento', 'Mozo/a', 'Chofer', 'Gerencia', 'Seguridad'].map(p => `<option value="${p}">`).join('')}</datalist></div></div>
    <div class="field"><label>Patente del auto (opcional: así lo reconoce el lector de patentes)</label><input name="patente" maxlength="10" class="cv-pat-in" autocapitalize="characters" value="${esc(e.patente || '')}" placeholder="AB 123 CD"></div>
    <div class="field"><label>Días que trabaja (opcional; ninguno = cualquier día)</label><div class="seg dias-sel">${[1,2,3,4,5,6,0].map(d => `<label><input type="checkbox" name="dia${d}" ${dias.includes(d) ? 'checked' : ''}><span>${DIAS[d]}</span></label>`).join('')}</div></div>
    <div class="grid2"><div class="field"><label>Entra (opcional)</label><input name="desde" type="time" value="${esc(e.desde || '')}"></div>
      <div class="field"><label>Sale (opcional)</label><input name="hasta" type="time" value="${esc(e.hasta || '')}"></div></div>
    <p class="muted tiny" style="margin:0 2px 12px">${I('info')} La garita lo ve en <b>Ingresos frecuentes</b> y le marca la entrada <b>solo los días autorizados</b> (sin días marcados, cualquier día). Fuera del horario entra igual, con una observación. Si cambia de turno, editalo acá.</p>
    <button class="btn btn-pri btn-block">${I('check')}${e.id ? 'Guardar los cambios' : 'Guardar y ver su credencial'}</button>
    ${e.id ? `<button type="button" class="btn btn-sec btn-block" style="margin-top:8px" data-a="hemp-nueva" data-id="${esc(e.id)}">${I('refresh')}Perdió la credencial: hacerle una nueva</button>
      <button type="button" class="btn btn-danger-soft btn-block" style="margin-top:8px" data-a="hemp-baja" data-id="${esc(e.id)}">${I('trash')}Dar de baja (ya no trabaja en el hotel)</button>` : ''}</form>`);
};
F['hemp'] = (d, form) => {
  if (!soloHotel()) return;
  const id = form.dataset.id, dni = soloDigitos(d.dni), nombre = (d.nombre || '').trim(), apellido = (d.apellido || '').trim();
  if (!nombre || !apellido){ toast('Faltan el nombre y el apellido', 'alert'); return; }
  if (dni.length < 7 || dni.length > 8){ toast('El DNI tiene que tener 7 u 8 números', 'alert'); return; }
  const otro = hotelEmpleados().find(x => x.dni === dni && x.id !== id);
  if (otro){ toast(`Ese DNI ya está cargado: ${hEmpNombre(otro)}`, 'alert'); return; }
  const desde = d.desde || '', hasta = d.hasta || '';
  if (!!desde !== !!hasta){ toast('Poné la hora de entrada y la de salida, o ninguna', 'alert'); return; }
  let guardado = '';
  Store.cambiar(s => { s.hotelEmpleados = aLista(s.hotelEmpleados);
    let e = id && s.hotelEmpleados.find(x => x && x.id === id);
    if (!e){ e = { id:'he' + uid(), codigo:codigoEmpleado(), at:Date.now() }; s.hotelEmpleados.push(e); }
    Object.assign(e, { nombre, apellido, dni, puesto:(d.puesto || '').trim(), patente:normPatente(d.patente || ''),
      dias:[0, 1, 2, 3, 4, 5, 6].filter(x => d['dia' + x]), desde, hasta, updatedAt:Date.now() });
    auditar(s, id ? 'El hotel editó un empleado' : 'El hotel cargó un empleado', hEmpNombre(e), e.id);
    guardado = e.id; });
  cerrarHoja();
  if (id) toast('Cambios guardados', 'check');
  else { toast('Empleado cargado', 'check'); setTimeout(() => A['hemp-cred']({ dataset:{ id:guardado } }), 60); }
};
A['hemp-nueva'] = async el => {
  if (!soloHotel()) return;
  const e = hotelEmpleados().find(x => x.id === el.dataset.id); if (!e) return;
  if (!await confirmar('Credencial nueva', `${esc(hEmpNombre(e))}: el QR y el código que tiene ahora (${esc(codigoEmpLindo(e.codigo))}) dejan de valer en la garita en este mismo momento. Después imprimí el QR nuevo y avisale el código nuevo.`, { si:'Hacer una nueva' })) return;
  Store.cambiar(s => { const x = aLista(s.hotelEmpleados).find(z => z && z.id === e.id); if (!x) return;
    x.codigo = codigoEmpleado(); x.updatedAt = Date.now(); auditar(s, 'El hotel le hizo una credencial nueva a un empleado', hEmpNombre(x), x.id); });
  cerrarHoja(); toast('Credencial nueva: la anterior ya no vale', 'refresh');
  setTimeout(() => A['hemp-cred']({ dataset:{ id:e.id } }), 60);
};
A['hemp-baja'] = async el => {
  if (!soloHotel()) return;
  const e = hotelEmpleados().find(x => x.id === el.dataset.id); if (!e) return;
  if (!await confirmar('Dar de baja al empleado', `${esc(hEmpNombre(e))}. Se borra su ficha con el DNI y su credencial deja de valer en la garita. Lo que ya entró y salió queda en la bitácora del barrio, sin el DNI.${estadoEmp(e).adentro ? '<br><b>Figura adentro del barrio:</b> avisale a la garita.' : ''}`, { si:'Dar de baja', peligro:true })) return;
  Store.cambiar(s => { s.hotelEmpleados = aLista(s.hotelEmpleados).filter(x => x && x.id !== e.id); auditar(s, 'El hotel dio de baja a un empleado', hEmpNombre(e), e.id); });
  cerrarHoja(); toast('Empleado dado de baja', 'trash');
};
/* La credencial: QR, código para decir, patente. Se imprime para el
   parabrisas o se le manda por WhatsApp. */
A['hemp-cred'] = el => {
  const e = hotelEmpleados().find(x => x.id === el.dataset.id); if (!e || !esHotel()) return;
  hoja('Credencial del empleado', `<div class="ticket hemp-cred"><div class="tk-top"><small>${HOTEL_NOMBRE} · empleado/a</small><h3>${esc(hEmpNombre(e))}</h3><div style="opacity:.85;font-size:13px">${esc(e.puesto || 'Personal del hotel')}</div></div>
    <div class="bottom"><div class="qr-box" data-qr="BHC:E-${esc(e.codigo)}"></div>
      <div class="muted tiny" style="margin-top:8px">Código para decir en la garita</div><div class="codigo-grande hemp-cod">${esc(codigoEmpLindo(e.codigo))}</div>
      ${e.patente ? `<div class="cv-chapa lista" style="margin:10px auto 0;max-width:220px"><small>REPÚBLICA ARGENTINA</small><b>${esc(chapaTexto(e.patente))}</b></div>` : ''}
      <div class="muted small" style="margin-top:8px">${esc(hEmpHorario(e))}</div></div></div>
    <div class="btns" style="margin-top:12px"><button class="btn btn-pri grow" data-a="hemp-imprimir" data-id="${esc(e.id)}">${I('download')}Imprimir para el parabrisas</button>
      <button class="btn btn-wa grow" data-a="hemp-wa" data-id="${esc(e.id)}">${I('share')}Mandársela por WhatsApp</button></div>
    <div class="card plana small" style="margin-top:12px;line-height:1.5"><b>Tres maneras de entrar, la que le quede más cómoda:</b>
      <ul style="margin:4px 0 0;padding-left:18px"><li><b>El QR pegado en el parabrisas</b> (del lado del acompañante): la garita lo lee con el celular.</li>
        <li><b>La patente</b>${e.patente ? '' : ' (si cargás la de su auto)'}: el lector de patentes de la garita lo reconoce.</li>
        <li><b>El código ${esc(codigoEmpLindo(e.codigo))}</b>: lo dice en la garita, a pie, en bici o en otro auto.</li></ul>
      <p style="margin:6px 0 0">Vale para siempre, al entrar y al salir. Si la pierde o alguien la copió: Editar → "Perdió la credencial".</p></div>
    ${normasEscritoHtml()}`);
  setTimeout(() => $$('#hoja [data-qr]').forEach(x => pintarQR(x, x.dataset.qr)), 60);
};
A['hemp-imprimir'] = async el => {
  const e = hotelEmpleados().find(x => x.id === el.dataset.id); if (!e) return;
  const q = await cargarQR(); if (!q) return toast('Sin conexión para dibujar el QR', 'alert');
  const qr = q(0, 'M'); qr.addData('BHC:E-' + e.codigo); qr.make();
  imprimir('Credencial · ' + hEmpNombre(e), `<div style="max-width:360px;margin:0 auto;border:3px solid #0d6b66;border-radius:18px;padding:18px 20px;text-align:center">
    <p style="margin:0;font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#0d6b66"><b>Barrio ${esc(Store.s.config.nombre)}</b> · ingreso</p>
    <h2 style="border:0;margin:6px 0 0;color:#111;font-size:20px">${esc(HOTEL_NOMBRE)}</h2>
    <p style="margin:2px 0 0;font-size:17px"><b>${esc(hEmpNombre(e))}</b></p><p style="margin:0;color:#555">${esc(e.puesto || 'Personal del hotel')}</p>
    <div style="width:230px;margin:14px auto">${qr.createSvgTag({ cellSize:8, margin:2, scalable:true })}</div>
    <p style="margin:0;font-size:11px;color:#555">Código</p><p style="margin:0;font-size:30px;letter-spacing:4px;font-family:monospace"><b>${esc(codigoEmpLindo(e.codigo))}</b></p>
    ${e.patente ? `<p style="margin:8px 0 0;font-size:16px;letter-spacing:2px;font-family:monospace">${esc(chapaTexto(e.patente))}</p>` : ''}
    <p style="margin:10px 0 0;color:#555;font-size:12px">Mostrar en la garita al entrar y al salir.</p>
    <p style="margin:10px 0 0;padding:8px 10px;border-radius:10px;background:#f3f8f1;color:#2f6b3a;font-size:11.5px;line-height:1.45"><b>En el barrio:</b> máximo 20 km/h · no fotografiar las casas · cuidar la flora y la fauna · sin bocinas ni música fuerte.</p></div>`, { pie:'Credencial permanente del hotel. Si se pierde, el hotel hace una nueva y esta deja de valer. No lleva el DNI.' });
};
A['hemp-wa'] = el => {
  const e = hotelEmpleados().find(x => x.id === el.dataset.id); if (!e) return;
  const texto = `🎟️ *Tu credencial para entrar al Barrio ${Store.s.config.nombre}*\n\nHola ${e.nombre}: sos personal del ${HOTEL_NOMBRE}.\n\n🔑 Código: *${codigoEmpLindo(e.codigo)}*\n\nEn la garita mostrá el QR de la imagen o decí el código, al entrar y al salir. Vale para siempre.${NORMAS_WA}\n\n📍 *Cómo llegar:* ${mapaCorto()}`;
  compartirPase({ imagen:() => tarjetaHotelPng({ contenido:'BHC:E-' + e.codigo, codigo:codigoEmpLindo(e.codigo), etiqueta:'PERSONAL DEL HOTEL', saludo:`¡Hola, ${e.nombre}!`, nombre:hEmpNombre(e),
      tramo:[['DÍAS', aLista(e.dias).length ? textoDias(e.dias) : 'Todos'], ['HORARIO', e.desde ? `${e.desde}–${e.hasta}` : 'Libre']], chips:[e.puesto || 'Personal del hotel', 'Credencial permanente'] }),
    texto, contenido:'BHC:E-' + e.codigo, codigo:codigoEmpLindo(e.codigo), sub:`${HOTEL_NOMBRE} · ${hEmpNombre(e)}`, archivo:`credencial-${e.codigo}.png`,
    datos:{ nombre:hEmpNombre(e), cuando: aLista(e.dias).length ? textoDias(e.dias) : 'Todos los días', horario: e.desde ? `${e.desde} a ${e.hasta} h` : 'Todo el día', etiqueta:'PERSONAL DEL HOTEL', normas:NORMAS_PASE } });
};

/* ---------- la garita: lo reconoce y marca la entrada o la salida ---------- */
function hojaEmpleadoGarita(e, por = ''){
  const st = estadoEmp(e), v = frecuenteVigente(e);
  const r = typeof restriccionPara === 'function' ? restriccionPara(hEmpNombre(e), e.dni, e.patente) : null;
  hoja('Empleado del hotel', `${r ? avisoRestriccion(r) : ''}
    ${!v.ok && !st.adentro ? aviso('danger', 'x', 'HOY NO ESTÁ AUTORIZADO', `${esc(v.motivo)}. Consultá con la recepción del hotel: si hoy trabaja, que le agreguen el día.`) : v.aviso ? aviso('warn', 'clock', 'Empleado del hotel, con una observación', esc(v.motivo)) : aviso('ok', 'check', 'Empleado del hotel · autorizado', `${HOTEL_NOMBRE}${por ? ' · ' + esc(por) : ''}`)}
    <div class="card" style="display:flex;gap:12px;align-items:center"><span class="hemp-av grande" style="--h:${mantTono(e)}">${esc(hEmpIniciales(e))}</span>
      <div class="grow"><b style="font-size:18px">${esc(hEmpNombre(e))}</b><div class="muted small">${esc(e.puesto || 'Personal del hotel')}${e.dni ? ' · DNI ' + esc(mantDniTapado(e.dni)) : ''}</div>
        <div class="muted small">${e.patente ? `<span class="hp-chapa chica">${esc(chapaTexto(e.patente))}</span> · ` : ''}${esc(hEmpHorario(e))}</div>
        <div class="small" style="margin-top:4px">${st.adentro ? `${I('login')} <b>Adentro</b> desde las ${hora(st.desde)} h` : `${I('logout')} Afuera`}</div></div></div>
    ${st.adentro ? `<button class="btn btn-block btn-grande btn-sec" data-a="hemp-mov" data-id="${esc(e.id)}" data-v="out">${I('logout')}Registrar la salida</button>
      ${hEmpPuedeEntrar(e) ? `<button class="btn btn-block btn-sec" style="margin-top:8px" data-a="hemp-mov" data-id="${esc(e.id)}" data-v="in">No: está entrando</button>` : ''}`
    : hEmpPuedeEntrar(e) ? `<button class="btn btn-block btn-grande btn-ok" data-a="hemp-mov" data-id="${esc(e.id)}" data-v="in">${I('login')}Registrar la entrada</button>
      <button class="btn btn-block btn-sec" style="margin-top:8px" data-a="hemp-mov" data-id="${esc(e.id)}" data-v="out">No: está saliendo</button>`
    : `<button class="btn btn-block btn-sec" data-a="hemp-mov" data-id="${esc(e.id)}" data-v="out">${I('logout')}Está saliendo: registrar la salida</button>`}`);
  return true;
}
/* Un código que llega a la garita: el QR (E-XXXXX) o los 5 signos que
   dice el empleado. Devuelve true si lo resolvió. */
function hotelEmpCodigo(txt){
  if (!esGuardia() && !esHotel()) return false;
  const crudo = String(txt || '').toUpperCase().replace(/^BHC:/, '').trim(), conPref = /^E-[A-Z0-9]{5}$/.test(crudo.replace(/\s/g, ''));
  const c = codigoEmpDe(crudo); if (!/^[A-Z0-9]{5}$/.test(c)) return false;
  const e = hotelEmpleados().find(x => x.codigo === c);
  if (e) return hojaEmpleadoGarita(e, conPref ? 'leído del QR' : 'por su código');
  if (conPref){ hoja('Credencial desconocida', aviso('danger', 'x', 'Esa credencial del hotel no vale', 'Puede ser una vieja que el hotel reemplazó, o de alguien que ya no trabaja ahí. Consultá con la recepción del hotel.')); return true; }
  return false;
}
A['hemp-mov'] = el => {
  if (!soloGarita()) return;
  const e = hotelEmpleados().find(x => x.id === el.dataset.id); if (!e) return;
  const tipo = el.dataset.v === 'in' ? 'in' : 'out', at = Date.now();
  if (tipo === 'in' && !hEmpPuedeEntrar(e)){ toast('Hoy no es un día autorizado: consultá con la recepción del hotel', 'calendar'); return; }
  Store.cambiar(s => { s.hotelMovs = aLista(s.hotelMovs); s.hotelMovs.unshift({ id:'hm' + uid(), empId:e.id, tipo, at, por:yo().id });
    s.bitacora.unshift({ id:uid(), autor:yo().id, tipo:'acceso', hotelEmpId:e.id, texto:`${tipo === 'in' ? 'Ingreso' : 'Egreso'}: empleado del hotel ${hEmpNombre(e)}${e.puesto ? ' (' + e.puesto + ')' : ''}${e.patente ? ' · ' + e.patente : ''}`, at }); });
  cerrarHoja(); toast(`${hEmpNombre(e)}: ${tipo === 'in' ? 'entrada' : 'salida'} registrada`, tipo === 'in' ? 'login' : 'logout');
};
/* LOS EMPLEADOS DEL HOTEL EN "INGRESOS FRECUENTES" DE LA GARITA, al lado
   del personal fijo de los vecinos: los que hoy tienen día autorizado
   primero, con su horario y "Entró" / "Salió" a un toque. */
function seccionEmpleadosHotel(qq = ''){
  const ts = hotelEmpleados(); if (!ts.length || !esGuardia()) return '';
  const ls = ts.filter(e => !qq || normTxt([hEmpNombre(e), e.puesto, e.patente, e.codigo, 'hotel'].join(' ')).includes(qq))
    .sort((a, b) => (estadoEmp(b).adentro - estadoEmp(a).adentro) || (hEmpHoyLeToca(b) - hEmpHoyLeToca(a)) || String(a.desde).localeCompare(String(b.desde)) || hEmpNombre(a).localeCompare(hEmpNombre(b), 'es'));
  const hoy = ts.filter(e => aLista(e.dias).length && hEmpHoyLeToca(e)).length, ad = hEmpAdentro().length;
  return `${sec(`Empleados del ${HOTEL_NOMBRE}`, `<span class="muted small">${ts.length}${hoy ? ` · ${plural(hoy, 'trabaja hoy', 'trabajan hoy')}` : ''}${ad ? ` · ${ad} adentro` : ''}</span>`)}
    ${ls.length ? `<div class="card lista">${ls.map(e => { const st = estadoEmp(e), toca = hEmpHoyLeToca(e), hoyTxt = hEmpHoyTxt(e);
      return `<div class="it"><span class="hemp-av" style="--h:${mantTono(e)}">${esc(hEmpIniciales(e))}</span><div class="txt"><b>${esc(hEmpNombre(e))}</b>
        <span>${esc(e.puesto || 'Personal del hotel')}${e.patente ? ' · ' + esc(e.patente) : ''} · ${esc(hEmpHorario(e))}</span>
        <span class="tiny" style="color:${st.adentro ? 'var(--ok)' : toca ? 'var(--ink-2)' : 'var(--danger)'}">${st.adentro ? `Adentro desde las ${hora(st.desde)} h` : toca ? (aLista(e.dias).length ? 'Hoy le toca' : 'Cualquier día') : 'Hoy no es su día: no entra'}${hoyTxt && !st.adentro ? ' · ' + esc(hoyTxt) : ''}</span></div>
        ${st.adentro || toca ? `<button class="btn btn-xs ${st.adentro ? 'btn-sec' : 'btn-ok'}" data-a="hemp-mov" data-id="${esc(e.id)}" data-v="${st.adentro ? 'out' : 'in'}">${I(st.adentro ? 'logout' : 'login')}${st.adentro ? 'Salió' : 'Entró'}</button>` : ''}</div>`; }).join('')}</div>`
      : vacio('users', 'Ningún empleado del hotel coincide con la búsqueda.')}
    <p class="muted tiny" style="margin:6px 2px 14px">${I('qr')} Los carga el hotel. Entran con el QR del parabrisas, su patente o el código que dicen (escribilo en "Código, patente o DNI").</p>`;
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
      <section class="bloque">${conteoVansHTML()}</section>
      ${esGuardia() ? `<section class="bloque">${sec(`Huéspedes por llegar (${hs.filter(x => x.desde === hoy && !x.ingreso).length})`, `<button class="link" data-a="abrir" data-v="hotel-huespedes">Lista completa</button>`)}${hs.filter(x => x.desde === hoy && !x.ingreso).length ? `<div class="card lista">${hs.filter(x => x.desde === hoy && !x.ingreso).map(x => `<div class="it"><div class="txt"><b>${esc(x.nombre)}</b><span>${x.patente ? esc(x.patente) + ' · ' : ''}${plural(+x.pax || 1, 'persona')}</span></div><button class="btn btn-xs btn-ok" data-a="hhuesped-ingreso" data-id="${esc(x.id)}">${I('login')}Ingresó</button></div>`).join('')}</div>` : `<div class="card plana small">${I('check')} No quedan huéspedes por llegar hoy.</div>`}</section>` : ''}
      <section class="bloque hv-dos">
        <div>${sec('Las vans ahora')}${vans.length ? `<div class="hp-vans">${vans.map(v => vanViva(v)).join('')}</div>` : vacio('car', 'El hotel no cargó vans.')}</div>
        <div>${sec('Pasos por la garita', '<span class="muted small">últimas 24 h</span>')}${portonHotel(movs)}</div>
      </section>
      ${evs.length ? `<section class="bloque">${sec('Eventos del hotel', '<span class="muted small">próximos 7 días</span>')}<div class="he-lista">${evs.map(ticket).join('')}</div></section>` : ''}
      ${!esAdmin() ? `<section class="bloque">${sec('Atajos')}<div class="hvv-atajos">
        ${esGuardia() ? `<button type="button" data-a="abrir" data-v="hotel-huespedes">${I('users')}Huéspedes</button>` : ''}
        ${esGuardia() ? `<button type="button" data-a="abrir" data-v="hotel-empleados">${I('user')}Empleados</button>` : ''}
        ${esGuardia() ? `<button type="button" data-a="abrir" data-v="hotel-agenda">${I('calendar')}Agenda del hotel</button><button type="button" data-a="abrir" data-v="hotel-bitacora">${I('book')}Bitácora del hotel</button>` : ''}
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
  s.hotelMovs = [{ id:'hm1', vanId:'hv2', tipo:'out', at:n - 50 * MIN, por:'u_garita', viaje:'Llevar a centro', pax:5 }];
  s.hotelHuespedes = [
    { id:'hh1', nombre:'Familia Rossi', pax:4, desde:h, hasta:D(3), patente:'', llegaVuelo:'AR1880', llegaHora:'13:05', saleVuelo:'AR1881', saleHora:'15:40', at:n - 2 * DIA },
    { id:'hh2', nombre:'Martina Olsen', pax:2, desde:D(-1), hasta:D(1), patente:'AC987QP', llegaVuelo:'', saleVuelo:'', at:n - 3 * DIA },
    { id:'hh3', nombre:'Grupo congreso', pax:3, desde:D(1), hasta:D(4), patente:'', llegaVuelo:'FO5022', llegaHora:'11:30', saleVuelo:'', at:n - DIA },
  ];
  s.hotelViajes = [{ id:'ht1', vanId:'hv1', fecha:h, sale:'17:30', destino:'puerto', sentido:'llevar', ref:{ tipo:'crucero', barco:'Ushuaia expedition' }, pax:6, huespedes:[], nota:'', estado:'programado', at:n - DIA },
    { id:'hr1', rutina:true, activa:true, nombre:'Aeropuerto de la mañana', dias:[1, 2, 3, 4, 5], sale:'07:30', destino:'aeropuerto', sentido:'llevar', pax:6, vanId:'hv1', chofer:'Ramón', desde:D(-10), hasta:'', nota:'', at:n - 10 * DIA },
    /* El servicio regular al centro (23-10-2026): los 9 viajes del cartel del hotel, en la Van 2. */
    ...rutinasRegulares().map(r => ({ ...r, vanId:'hv2', chofer:'Julio', desde:D(-10), at:n - 10 * DIA }))];
  generarRutinas(s);
  /* EL SERVICIO REGULAR DE HOY, SEGÚN LA HORA (23-10-2026): los viajes que
     ya pasaron, hechos (salió y volvió, con cuántos huéspedes), y el que
     está en la calle, "En viaje" con la Van 2 afuera. Antes de las 08:10, la
     Van 2 figura afuera con una salida suelta. */
  { const ahoraM = new Date().getHours() * 60 + new Date().getMinutes(), at = hhmm => fechaDe(h).getTime() + minutosDe(hhmm) * 60000, PAX = [3, 0, 5, 2, 0, 4, 6, 1, 2];
    s.hotelMovs = [];
    SERVICIO_REGULAR.forEach(([sale, vuelve], i) => {
      const x = s.hotelViajes.find(v => v.id === `hr-hrsr-${sale.replace(':', '')}-${h}`); if (!x || minutosDe(sale) > ahoraM) return;
      const salio = at(sale) + 3 * MIN, volvio = at(vuelve) + 16 * MIN;
      x.salioAt = salio; x.vanId = 'hv2'; x.paxSale = PAX[i];
      s.hotelMovs.unshift({ id:'hm' + i + 'o', vanId:'hv2', tipo:'out', at:salio, por:'u_garita', viaje:textoViaje(x), pax:PAX[i] });
      if (volvio > Date.now()){ x.estado = 'en_curso'; return; }
      x.estado = 'hecho'; x.volvioAt = volvio; x.paxVuelve = PAX[(i + 4) % 9];
      s.hotelMovs.unshift({ id:'hm' + i + 'i', vanId:'hv2', tipo:'in', at:volvio, por:'u_garita', viaje:textoViaje(x), pax:PAX[(i + 4) % 9] });
    });
    if (!s.hotelMovs.length) s.hotelMovs = [{ id:'hm1', vanId:'hv2', tipo:'out', at:n - 50 * MIN, por:'u_garita', viaje:'Llevar a centro', pax:5 }]; }
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
