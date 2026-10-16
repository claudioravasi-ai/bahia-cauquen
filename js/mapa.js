/* =========================================================
   MAPA DEL BARRIO EN LA GARITA (pedido de Claudio, 11-10-2026)
   "Al portal GARITA con el mapa del barrio hacele un diseño innovador e
   interactivo, fácil de usar y con colores llamativos."
   Idea de Leaflet (45.7k★ en GitHub, BSD-2): el código es propio.

   El plano sale del "Anteproyecto de subdivisión – Anexo I" que mandó
   Claudio: cada lote está donde está en el plano, con su número. Las calles
   no tienen nombre en el plano; se dedujeron de las direcciones del padrón
   (js/padron.js). Los lotes 48 a 58 quedan fuera del borde derecho de la
   foto del plano: se ubican sobre De las Bahías según su altura.

   Qué muestra, en vivo y con un color por cosa:
     · rojo que late: SOS o pedido del DEA sin resolver;
     · naranja que late: alguien en la entrada esperando que el vecino
       conteste ("Llegó sin aviso"), con una línea desde la garita;
     · verde: visita adentro;      · celeste: visita que llega hoy;
     · violeta: paquete en la garita; · amarillo: casa sola (de viaje);
     · rosa: obra en curso.
   Los contadores de arriba son también filtros. Se acerca con los dedos,
   con la ruedita o con + y −; tocar un lote chico primero lo acerca y
   tocarlo de nuevo abre su ficha: quién vive, teléfonos, las visitas de hoy
   con "Ingresó / Salió", paquetes, casa sola y "Llegó alguien".

   PRIVACIDAD (Ley 25.326, mínimo acceso): lo ven solo la garita, la
   Administración y la supervisión (veGarita), los mismos que ya ven la
   guía y las visitas. Los nombres no se dibujan en el plano: aparecen solo
   al tocar un lote o al buscar. El hotel y los vecinos no tienen el mapa.
   ========================================================= */

/* Lotes por fila, en el orden del plano: "lote:x,y" (coordenadas del plano). */
const MAPA_FILAS = [
  /* Los Salesianos, lado norte (oeste de la garita) */
  '16:99,192 17:131,167 18:158,157 19:184,149 20:212,146 21:237,143 22:270,140 23:307,138 24:332,141 25:360,144 26:387,149 27:414,151 28:441,154 29:469,157 30:496,161 31:524,165 32:551,167 33:577,169',
  /* De la Cuesta */
  '15:104,244 14:110,273 13:110,300',
  /* Manzana del medio: Los Salesianos lado sur y De la Hermita lado norte */
  '87:160,244 88:182,228 89:208,220 90:235,212 91:261,206 92:287,199 93:319,200 94:347,202 95:375,206 96:402,209 97:430,212 98:458,216 99:487,219 100:515,221',
  '86:168,272 85:193,265 84:219,258 83:245,252 82:274,246 81:318,242 80:338,243 79:364,246 78:393,249 77:421,253 76:449,256 75:478,262',
  /* De la Hermita, lado del canal (el hotel del 0 al 5) */
  '12:136,364 11:168,354 10:195,343 9:220,336 8:246,328 7:271,317 6:298,309 5:335,309 4:362,312 3:388,315 2:414,318 1:441,320 0:489,334',
  /* Los Salesianos al este de la garita */
  '34:638,164 35:661,165 36:689,165 37:717,164 38:743,164 39:770,164 40:800,164 41:826,165 42:852,165 43:879,166 44:907,161 45:938,154 46:968,151 47:996,148 48:1024,147 49:1052,147',
  '101:611,243 102:637,227 103:663,227 104:690,227 105:717,226 106:744,226 107:772,226 108:800,226 109:827,226 110:856,226 111:883,226 112:911,227 113:939,234 114:967,235 115:1008,231',
  /* De las Mareas */
  '132:655,266 131:689,272 130:720,267 129:747,266 128:773,265 127:800,265 126:827,265 125:855,265 124:883,265 123:910,265 122:960,289',
  /* De las Bahías, lado oeste, y De la Plaza lado norte (este) */
  '116:1006,257 117:1006,286 118:1004,314',
  '121:942,333 120:973,341 119:1002,349',
  /* De la Plaza, lado sur */
  '133:541,280 133A:562,288 134:585,297 135:612,304 136:639,311 137:666,318 138:694,326 139:720,334 140:747,341 141:773,349 142:800,356 143:826,363 144:853,371 145:879,378 146:905,386 147:932,393 148:960,398 149:996,412',
  /* De las Rocas, sobre la costa */
  '74:573,339 73:598,356 72:624,365 71:648,378 70:675,388 69:703,394 68:731,399 67:759,403 66:785,408 65:811,416 64:839,424 63:867,431 62:898,434 61:928,439 60:957,451',
  '150:994,443 59:997,470',
  /* De las Bahías, lado este (fuera del borde de la foto del plano) */
  '50:1068,228 51:1068,257 52:1068,287 53:1068,318 54:1068,348 55:1068,378 56:1068,410 57:1068,443 58:1068,472',
];
/* Lotes más grandes que el resto en el plano: [ancho, fondo]. */
const MAPA_GRANDES = { '0':[40, 34], '16':[30, 30], '122':[34, 30], '115':[30, 26] };
/* Lotes de esquina que van derechos (no siguen el ángulo de la fila). */
const MAPA_DERECHOS = { '122':0, '115':0 };
const MAPA_CALLES = [
  { n:'Los Ñires', afuera:true, pts:[[290,104],[598,118],[830,96],[1110,110]], lbl:[945,98] },
  { n:'Los Salesianos', pts:[[118,212],[160,200],[230,186],[295,175],[394,183],[566,190],[598,194],[1036,197]], lbl:[440,186] },
  { n:'Los Salesianos', pts:[[598,194],[1036,197]], lbl:[860,196] },
  { n:'De la Cuesta', pts:[[118,212],[130,228],[137,250],[140,280],[146,305],[160,322]], lbl:[139,282], vertical:true },
  { n:'De la Hermita', pts:[[160,322],[200,305],[246,291],[320,282],[400,281],[470,287],[528,283]], lbl:[300,284] },
  { n:'', pts:[[598,118],[598,194],[570,225],[540,255],[524,285],[523,320],[538,352],[570,378]] },
  { n:'De las Rocas', pts:[[538,352],[570,378],[600,385],[650,405],[700,420],[760,430],[820,444],[880,458],[940,468],[1000,488],[1036,492]], lbl:[760,430] },
  { n:'De la Plaza', pts:[[524,268],[600,278],[690,296],[800,332],[900,358],[1000,384],[1036,395]], lbl:[850,346] },
  { n:'De las Mareas', pts:[[690,295],[780,286],[925,287],[934,310],[920,340]], lbl:[820,287] },
  { n:'De las Bahías', pts:[[1036,197],[1036,492]], lbl:[1036,300], vertical:true },
];
const MAPA_GARITA = [598, 152];
const MAPA_CAJA = { x:70, y:95, w:1030, h:420 };   /* lo que se ve con "Ver todo" */
const MAPA_ZONAS = [
  { n:'Oeste', lotes:'13-33,87-100' },
  { n:'Hotel y De la Hermita', lotes:'0-12,75-86' },
  { n:'Centro', lotes:'34-47,101-114,123-132' },
  { n:'De la Plaza y la costa', lotes:'133-149,59-74' },
  { n:'De las Bahías', lotes:'48-58,115-122,150' },
  { n:'Todo el barrio', todo:true },
];
/* Cada estado: color, texto y prioridad (el de más arriba pinta el lote). */
const MAPA_ESTADOS = {
  sos:  { n:'SOS', largo:'SOS sin resolver', c:'#ff4d5e', ic:'siren' },
  cons: { n:'En la entrada', largo:'Esperando que el vecino conteste', c:'#ff9a3d', ic:'gate' },
  adn:  { n:'Adentro', largo:'Visita adentro', c:'#2fe08a', ic:'users' },
  esp:  { n:'Llegan hoy', largo:'Visita anunciada para hoy', c:'#3ec7ff', ic:'clock' },
  paq:  { n:'Paquetes', largo:'Paquete en la garita', c:'#c58bff', ic:'box' },
  sola: { n:'Casas solas', largo:'Casa sola: el vecino está de viaje', c:'#ffd23f', ic:'lock' },
  obra: { n:'Obras', largo:'Obra en curso', c:'#ff6fb5', ic:'wrench' },
};
const MAPA_ORDEN = ['sos', 'cons', 'adn', 'esp', 'paq', 'sola', 'obra'];

/* ---------- geometría (se calcula una vez) ---------- */
const MAPA_LOTES = (() => {
  const out = {};
  MAPA_FILAS.forEach(fila => {
    const ls = fila.split(/\s+/).map(t => { const [l, xy] = t.split(':'), [x, y] = xy.split(',').map(Number); return { l, x, y }; });
    ls.forEach((p, i) => {
      const a = ls[i - 1] || p, b = ls[i + 1] || p;
      const ang = Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI;
      const dist = q => q === p ? 99 : Math.hypot(q.x - p.x, q.y - p.y);
      const g = MAPA_GRANDES[p.l];
      const w = g ? g[0] : Math.max(14, Math.min(30, Math.min(dist(a), dist(b)) * 0.9));
      out[p.l] = { x:p.x, y:p.y, ang: p.l in MAPA_DERECHOS ? MAPA_DERECHOS[p.l] : Math.abs(ang) > 90 ? ang - 180 : ang, w, d: g ? g[1] : 22 };
    });
  });
  return out;
})();
const mapaRango = txt => String(txt).split(',').flatMap(r => { const [a, b] = r.split('-').map(Number); return b === undefined ? [String(a)] : Array.from({ length:b - a + 1 }, (_, i) => String(a + i)); });
const mapaLoteDe = casa => String(casa || '').replace(/^Lote\s*/i, '').trim().toUpperCase();

/* ---------- lo que pasa en cada lote ahora ---------- */
function mapaEstados(){
  const s = Store.s, hoy = hoyISO(), out = {};
  const de = l => l && MAPA_LOTES[l] ? (out[l] || (out[l] = { sos:[], cons:[], adn:[], esp:[], paq:[], sola:null, obra:null, nop:[] })) : null;
  aLista(s.sos).filter(x => x && x.estado !== 'resuelta').forEach(x => de(mapaLoteDe(usuario(x.userId)?.casa))?.sos.push(x));
  aLista(s.llegadas).filter(x => x && x.estado === 'consultando').forEach(x => de(mapaLoteDe(x.lote || usuario(x.hostId)?.casa))?.cons.push(x));
  pasesDelDia(hoy).forEach(p => { const e = estadoPase(p), d = de(mapaLoteDe(usuario(p.hostId)?.casa)); if (!d) return;
    if (e === 'adentro') d.adn.push(p); else if (e === 'esperado' || e === 'noingreso') d.esp.push(p); });
  if (hayPaquetes()) aLista(s.paquetes).filter(p => p && !p.retirado).forEach(p => de(mapaLoteDe(loteDelPaquete(p)))?.paq.push(p));
  if (typeof casasSolas === 'function') casasSolas(hoy).forEach(a => { const d = de(mapaLoteDe(a.casa)); if (d) d.sola = a; });
  aLista(s.obras).filter(o => o && o.estado === 'activa').forEach(o => { const d = de(mapaLoteDe(o.casa)); if (d) d.obra = o; });
  aLista(s.peticiones).filter(p => p && p.tipo === 'nopasar' && p.estado === 'en_funciones' && (!p.hasta || p.hasta >= hoy)).forEach(p => de(mapaLoteDe(p.casa))?.nop.push(p));
  return out;
}
const mapaTiene = (d, k) => !!d && (k === 'sola' || k === 'obra' ? !!d[k] : d[k].length > 0);
const mapaPrincipal = d => MAPA_ORDEN.find(k => mapaTiene(d, k)) || '';

/* ---------- la vista (acercar, mover) ----------
   Se guarda el centro y cuánto está acercado respecto de "ver todo": así
   se mantiene igual al redibujar la garita y entre el mapa chico y el
   de pantalla completa. */
/* z vacío = "automático": en la computadora se ve todo el barrio; con el
   teléfono parado (el barrio es largo y angosto) arranca un poco acercado
   para llenar el alto, y se recorre con el dedo para los costados. */
let mapaVista = { cx: MAPA_CAJA.x + MAPA_CAJA.w / 2, cy: MAPA_CAJA.y + MAPA_CAJA.h / 2, z:0 };
/* EL PLANO DADO VUELTA (pedido de Claudio, 13-10-2026: "la garita abajo y
   el Canal Beagle arriba; la garita está acostumbrada a verlo de esa
   forma"). No se gira el dibujo (los números y los nombres quedarían de
   cabeza): se dan vuelta las coordenadas de los lotes, las calles y la
   garita, 180° alrededor del centro del plano. El mar y el espacio verde
   se dibujan dentro de un grupo girado. Viene así de fábrica; el botón de
   girar lo vuelve a poner como el plano original (lo recuerda cada equipo). */
const MAPA_CENTRO = [MAPA_CAJA.x + MAPA_CAJA.w / 2, MAPA_CAJA.y + MAPA_CAJA.h / 2];
const mapaGiro = ([x, y]) => [2 * MAPA_CENTRO[0] - x, 2 * MAPA_CENTRO[1] - y];
let mapaGiradoYa = false;
function mapaVoltear(){
  Object.values(MAPA_LOTES).forEach(g => { [g.x, g.y] = mapaGiro([g.x, g.y]); });
  [MAPA_GARITA[0], MAPA_GARITA[1]] = mapaGiro(MAPA_GARITA);
  MAPA_CALLES.forEach(c => { c.pts = c.pts.map(mapaGiro); if (c.lbl) c.lbl = mapaGiro(c.lbl); });
  const [cx, cy] = mapaGiro([mapaVista.cx, mapaVista.cy]); mapaVista = { ...mapaVista, cx, cy };
  mapaGiradoYa = !mapaGiradoYa;
}
const mapaP = (x, y) => mapaGiradoYa ? mapaGiro([x, y]) : [x, y];
try { if (localStorage.getItem('bhc.mapa.girado') !== '0') mapaVoltear(); } catch(e){ mapaVoltear(); }
A['mapa-girar'] = () => {
  mapaVoltear();
  try { localStorage.setItem('bhc.mapa.girado', mapaGiradoYa ? '1' : '0'); } catch(e){}
  toast(mapaGiradoYa ? 'La garita abajo y el canal arriba' : 'Como el plano original: el canal abajo', 'map');
  refrescar();
};
const mapaZAuto = svg => { const cw = svg.clientWidth || 600, ch = svg.clientHeight || 300;
  return Math.max(1, Math.min(2, (ch / MAPA_CAJA.h) / (cw / MAPA_CAJA.w) * 0.92)); };
const mapaZ = (svg, v = mapaVista) => v.z || mapaZAuto(svg);
let mapaFiltro = '', mapaMovido = 0, mapaAnim = 0, mapaMarcados = [];
function mapaCaja(svg, v = mapaVista){
  const cw = svg.clientWidth || 600, ch = svg.clientHeight || 300;
  const k = Math.min(cw / MAPA_CAJA.w, ch / MAPA_CAJA.h) * mapaZ(svg, v);
  return { x:v.cx - cw / 2 / k, y:v.cy - ch / 2 / k, w:cw / k, h:ch / k, k };
}
/* Se puede acercar hasta que un lote mida unos 190 píxeles, en cualquier pantalla. */
const mapaZMax = () => { const svg = document.querySelector('.mapa-svg'); if (!svg) return 9;
  const k0 = Math.min((svg.clientWidth || 600) / MAPA_CAJA.w, (svg.clientHeight || 300) / MAPA_CAJA.h); return Math.max(9, 7 / k0); };
function mapaLimitar(v){
  const z = Math.max(1, Math.min(mapaZMax(), v.z));
  return { z, cx:Math.max(MAPA_CAJA.x, Math.min(MAPA_CAJA.x + MAPA_CAJA.w, v.cx)), cy:Math.max(MAPA_CAJA.y, Math.min(MAPA_CAJA.y + MAPA_CAJA.h, v.cy)) };
}
function mapaAplicar(){
  document.querySelectorAll('.mapa-svg').forEach(svg => {
    const c = mapaCaja(svg);
    svg.setAttribute('viewBox', `${c.x.toFixed(1)} ${c.y.toFixed(1)} ${c.w.toFixed(1)} ${c.h.toFixed(1)}`);
    /* Con los lotes chiquitos (de lejos) no se dibujan los números. */
    svg.classList.toggle('lejos', c.k * 22 < 15);
    svg.classList.toggle('cerca', c.k >= 2.5);      /* se leen los nombres y la dirección */
  });
}
function mapaIr(destino, ms = 320){
  cancelAnimationFrame(mapaAnim);
  const svg0 = document.querySelector('.mapa-svg'), ini = { ...mapaVista, z: svg0 ? mapaZ(svg0) : mapaVista.z || 1 }, fin = mapaLimitar(destino), t0 = performance.now();
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) ms = 0;
  const paso = t => {
    const p = ms ? Math.min(1, (t - t0) / ms) : 1, e = 1 - Math.pow(1 - p, 3);
    mapaVista = { cx:ini.cx + (fin.cx - ini.cx) * e, cy:ini.cy + (fin.cy - ini.cy) * e, z:ini.z + (fin.z - ini.z) * e };
    mapaAplicar();
    if (p < 1) mapaAnim = requestAnimationFrame(paso);
  };
  mapaAnim = requestAnimationFrame(paso);
}
const mapaZoomLote = () => { const svg = document.querySelector('.mapa-svg'); if (!svg) return 4;
  const k0 = Math.min((svg.clientWidth || 600) / MAPA_CAJA.w, (svg.clientHeight || 300) / MAPA_CAJA.h);
  return Math.max(2.2, 3 / k0); };   /* acercado hasta que se lean los nombres y la dirección */

/* QUIÉN VIVE EN CADA LOTE, ESCRITO EN EL PLANO (pedido de Claudio,
   11-10-2026: "así la garita sabe adónde va una visita"). Salen de la guía
   del barrio (inquilinos si el lote está alquilado; si no, propietarios),
   y si no hay guía, del padrón o de las cuentas de la app: estén o no
   registrados. No quedan escritos en el código: se leen de la base del
   barrio en el momento. Al acercar aparecen los nombres; más cerca, la
   dirección. */
function mapaNombresLotes(){
  const out = {};
  (typeof fichasDeVecinos === 'function' ? fichasDeVecinos() : []).forEach(f => {
    const l = String(f.lote).toUpperCase(); if (!MAPA_LOTES[l]) return;
    let ns = f.inq.length ? f.inq : f.prop.length ? f.prop : f.cuentas.map(x => x.nombre);
    if (f.estado === 'hotel' || f.L?.grupo === 'hotel') ns = [typeof HOTEL_NOMBRE !== 'undefined' ? HOTEL_NOMBRE : 'Hotel'];
    else if (f.estado === 'cabana' && !ns.length) ns = ['Cabaña' + (f.g?.cabana ? ' ' + f.g.cabana : '')];
    out[l] = ns.map(n => String(n).replace(/^[^:]*:\s*/, '').trim()).filter(Boolean);
  });
  return out;
}
const mapaRecortar = (t, n) => t.length > n ? t.slice(0, n - 1).trimEnd() + '…' : t;

/* ---------- el dibujo ---------- */
const mapaPuntos = pts => pts.map(p => p.join(',')).join(' ');
function mapaSVG(est){
  const ecos = new Set(mapaRecientes().filter(m => Date.now() - m.at < 10 * MIN).map(m => m.lote));
  const quieto = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const s = Store.s, guia = l => (typeof guiaDe === 'function' ? guiaDe(l) : null);
  const dirDe = l => (typeof lote === 'function' && lote(l)?.dir) || '';
  const [gx, gy] = MAPA_GARITA, quienes = mapaNombresLotes();
  const tiles = Object.entries(MAPA_LOTES).map(([l, g]) => {
    const d = est[l], k = mapaPrincipal(d), L = typeof lote === 'function' ? lote(l) : null;
    const base = L?.grupo === 'hotel' ? 'm-hotel' : L?.grupo === 'cabanas' || guia(l)?.estado === 'cabana' ? 'm-hotel' : guia(l)?.estado === 'baldio' ? 'm-baldio' : 'm-casa';
    const otros = d ? MAPA_ORDEN.filter(x => x !== k && mapaTiene(d, x)) : [];
    const apagado = mapaFiltro && !mapaTiene(d, mapaFiltro);
    const ns = quienes[l] || [];
    const desc = [`Lote ${l}`, ns.length ? (typeof listaNombres === 'function' ? listaNombres(ns) : ns.join(' y ')) : '', dirDe(l), k ? MAPA_ESTADOS[k].largo : '', ...otros.map(x => MAPA_ESTADOS[x].n.toLowerCase())].filter(Boolean).join(' · ');
    const lineas = ns.length > 2 ? [ns[0], `${ns[1]} +${ns.length - 2}`] : ns;
    return `<g class="lote ${base} ${k ? 'm-' + k : ''}${apagado ? ' apagado' : ''}${d?.nop.length ? ' m-nop' : ''}" data-a="mapa-lote" data-v="${esc(l)}" tabindex="0" role="button" aria-label="${esc(desc)}">
      ${k === 'sos' || k === 'cons' ? `<circle class="latido" cx="${g.x}" cy="${g.y}" r="${Math.max(g.w, g.d) * 0.62}"/>` : ''}
      <rect x="${(-g.w / 2).toFixed(1)}" y="${(-g.d / 2).toFixed(1)}" width="${g.w.toFixed(1)}" height="${g.d}" rx="4" transform="translate(${g.x} ${g.y}) rotate(${g.ang.toFixed(1)})"/>
      <text class="r-num" x="${g.x}" y="${g.y + 0.5}">${esc(l)}</text>
      ${lineas.map((n, i) => `<text class="r-nom" x="${g.x}" y="${(g.y + 1.2 + i * 3.9).toFixed(1)}">${esc(mapaRecortar(n, 19))}</text>`).join('')}
      ${dirDe(l) ? `<text class="r-dir" x="${g.x}" y="${(g.y + 1.2 + lineas.length * 3.9 + 0.4).toFixed(1)}">${esc(mapaRecortar(dirDe(l).split(' y ')[0], 24))}</text>` : ''}
      ${ecos.has(l) ? `<circle class="eco" cx="${g.x}" cy="${g.y}" r="${Math.max(g.w, g.d) * 0.7}"/>` : ''}
      ${otros.slice(0, 3).map((x, i) => `<circle class="punto" cx="${(g.x - (Math.min(otros.length, 3) - 1) * 3.5 + i * 7).toFixed(1)}" cy="${g.y - g.d / 2 + 1}" r="2.8" style="fill:${MAPA_ESTADOS[x].c}"/>`).join('')}
    </g>`; }).join('');
  /* Una línea desde la garita hasta cada casa con alguien esperando en la entrada. */
  const rutas = Object.entries(est).filter(([, d]) => d.cons.length || d.sos.length).map(([l, d]) => { const g = MAPA_LOTES[l], [gx, gy] = MAPA_GARITA;
    const mx = (gx + g.x) / 2, my = Math.min(gy, g.y) - 40;
    return `<path class="ruta ${d.sos.length ? 'r-sos' : ''}" d="M${gx},${gy} Q${mx},${my} ${g.x},${g.y}"/>`; }).join('');
  const calles = MAPA_CALLES.map(c => `<polyline class="calle ${c.afuera ? 'afuera' : ''}" points="${mapaPuntos(c.pts)}"/>`).join('');
  const lineas = MAPA_CALLES.filter(c => !c.afuera).map(c => `<polyline class="calle-linea" points="${mapaPuntos(c.pts)}"/>`).join('');
  const nombres = MAPA_CALLES.filter(c => c.n && c.lbl).map(c => `<text class="nombre-calle" x="${c.lbl[0]}" y="${c.lbl[1]}"${c.vertical ? ` transform="rotate(90 ${c.lbl[0]} ${c.lbl[1]})"` : ''}>${esc(c.n)}</text>`).join('');
  return `<svg class="mapa-svg" viewBox="${MAPA_CAJA.x} ${MAPA_CAJA.y} ${MAPA_CAJA.w} ${MAPA_CAJA.h}" preserveAspectRatio="xMidYMid meet" role="group" aria-label="Plano del barrio con los lotes">
    <defs>
      <linearGradient id="mapaMar" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1fb6e8"/><stop offset="1" stop-color="#0a4f8a"/></linearGradient>
      <radialGradient id="mapaTierra" cx=".5" cy=".35" r=".8"><stop offset="0" stop-color="#16384a"/><stop offset="1" stop-color="#0b1f2e"/></radialGradient>
      <pattern id="mapaOlas" width="40" height="14" patternUnits="userSpaceOnUse"><path d="M0 7 Q10 2 20 7 T40 7" fill="none" stroke="rgba(255,255,255,.18)" stroke-width="1.2"/></pattern>
    </defs>
    <rect x="-400" y="-400" width="2000" height="1400" fill="url(#mapaTierra)"/>
    <g${mapaGiradoYa ? ` transform="rotate(180 ${MAPA_CENTRO[0]} ${MAPA_CENTRO[1]})"` : ''}>
    <path class="mar" d="M-200,430 L30,420 L140,394 L250,364 L340,344 L470,353 L505,372 L530,396 L600,404 L700,438 L820,462 L940,484 L1000,506 L1300,520 L1300,800 L-200,800 Z"/>
    <path class="olas" d="M-200,430 L30,420 L140,394 L250,364 L340,344 L470,353 L505,372 L530,396 L600,404 L700,438 L820,462 L940,484 L1000,506 L1300,520 L1300,800 L-200,800 Z"/>
    <path class="verde" d="M735,298 L915,298 L924,314 L908,346 Z"/></g>
    ${[[250, 430], [780, 500]].map(([x, y]) => { const [a, b] = mapaP(x, y); return `<text class="nombre-mar" x="${a}" y="${b}">Canal Beagle</text>`; }).join('')}
    ${(([a, b]) => `<text class="nombre-verde" x="${a}" y="${b}">Espacio verde</text>`)(mapaP(850, 312))}
    ${calles}${lineas}${nombres}
    <g class="radar"><path d="M${gx},${gy} L${(gx + 640 * Math.cos(-0.6)).toFixed(1)},${(gy + 640 * Math.sin(-0.6)).toFixed(1)} A640,640 0 0,1 ${gx + 640},${gy} Z"/><line x1="${gx}" y1="${gy}" x2="${gx + 640}" y2="${gy}"/>
      ${quieto ? '' : `<animateTransform attributeName="transform" type="rotate" from="0 ${gx} ${gy}" to="360 ${gx} ${gy}" dur="9s" repeatCount="indefinite"/>`}</g>
    <g class="rutas">${rutas}</g>
    <g class="lotes">${tiles}</g>
    ${typeof mantCapaMapa === 'function' ? mantCapaMapa() : ''}
    ${typeof rondaCapaMapa === 'function' ? rondaCapaMapa() : ''}
    <g class="garita-pin" data-a="mapa-garita" role="button" aria-label="La garita">
      <circle class="g-halo" cx="${gx}" cy="${gy}" r="16"/><circle class="g-base" cx="${gx}" cy="${gy}" r="11"/>
      ${I('shield').replace('<svg class="i ', `<svg x="${gx - 7}" y="${gy - 7}" width="14" height="14" class="i g-ic `)}
      <text class="g-txt" x="${gx}" y="${gy - 18}">GARITA</text></g>
    ${(([a, b]) => `<text class="nombre-hotel" x="${a}" y="${b}">`)(mapaP(410, 352))}${esc(typeof HOTEL_NOMBRE !== 'undefined' ? HOTEL_NOMBRE : 'Hotel')}</text>
  </svg>`;
}

/* El tablero completo: contadores (que son filtros), buscador, mapa y zonas. */
function mapaBarrio({ grande = false } = {}){
  if (!veGarita()) return '';
  const est = mapaEstados();
  const cuenta = k => Object.values(est).filter(d => mapaTiene(d, k)).length;
  /* Casillas iguales y parejas (Claudio, 11-10-2026: "simétricos y
     congruentes"): 6 casillas, 3 por renglón en el celular y las 6 en una
     fila en la computadora. Paquetes, solo si la garita recibe paquetes; en
     ese caso son 8 (se suma "Todo") y van de a 4. */
  const casillas = MAPA_ORDEN.filter(k => k !== 'paq' || hayPaquetes());
  if (casillas.length % 2) casillas.push('todo');
  const ult = mapaRecientes()[0];
  if (mapaFiltro && !cuenta(mapaFiltro)) mapaFiltro = '';
  setTimeout(mapaAplicar, 0);
  return `<section class="mapa-card ${grande ? 'mapa-grande' : ''}" aria-label="Mapa del barrio">
    <div class="mapa-cab"><span class="mapa-ic">${I('map')}</span>
      <div class="grow"><b>Mapa del barrio</b><small><i class="mapa-vivo"></i>En vivo · tocá un lote</small></div>
      ${grande ? '' : `<button class="mapa-btn-txt" data-a="abrir" data-v="mapa" aria-label="Ver el mapa en pantalla completa">${I('expand')}<span>Grande</span></button>`}</div>
    ${grande ? `<p class="mapa-girar">${I('smartphone')}Girá el teléfono para ver el barrio entero más grande</p>` : ''}
    <div class="mapa-stats n${casillas.length}" role="toolbar" aria-label="Filtrar el mapa">
      ${casillas.map(k => { if (k === 'todo') return `<button class="mapa-stat todo ${mapaFiltro ? '' : 'on'}" style="--c:#ffffff" data-a="mapa-filtro" data-v="" aria-pressed="${!mapaFiltro}"><span class="ms-ic">${I('map')}</span><b>${Object.keys(est).length}</b><small>Todo</small></button>`;
        const n = cuenta(k), e = MAPA_ESTADOS[k];
        return `<button class="mapa-stat ${mapaFiltro === k ? 'on' : ''} ${n ? '' : 'cero'} ${(k === 'sos' || k === 'cons') && n ? 'urge' : ''}" style="--c:${e.c}" data-a="mapa-filtro" data-v="${k}" aria-pressed="${mapaFiltro === k}" aria-label="${esc(e.largo)}: ${n}"><span class="ms-ic">${I(e.ic)}</span><b>${n}</b><small>${esc(e.n)}</small></button>`; }).join('')}
    </div>
    <div class="mapa-filtrado" ${mapaFiltro && MAPA_ESTADOS[mapaFiltro] ? '' : 'hidden'}><span>Mostrando solo: <b>${esc(MAPA_ESTADOS[mapaFiltro]?.n || '')}</b></span><button data-a="mapa-filtro" data-v="${esc(mapaFiltro)}">${I('x')}Ver todo</button></div>
    ${ult ? `<button class="mapa-ultimo" data-a="mapa-ir" data-v="${esc(ult.lote)}" style="--c:${ult.sale ? '#ffd23f' : '#2fe08a'}"><i></i><b>${esc(hace(ult.at))}</b><span>${ult.no ? 'No entró' : ult.sale ? 'Salió' : 'Entró'}: ${esc(ult.texto)}</span>${I('right')}</button>` : ''}
    ${typeof rondaTiraMapa === 'function' ? rondaTiraMapa() : ''}
    <div class="mapa-buscar">${I('search')}<input id="mapaQ" type="search" autocomplete="off" enterkeyhint="search" placeholder="¿A qué dirección va? Ej: De la Plaza 3340" aria-label="Buscar un lote en el mapa"></div>
    <div class="mapa-res" id="mapaRes"></div>
    <div class="mapa-lienzo">${mapaSVG(est)}
      <div class="mapa-ctrl">
        <button data-a="mapa-zoom" data-v="+" aria-label="Acercar">${I('plus')}</button>
        <button data-a="mapa-zoom" data-v="-" aria-label="Alejar">${I('minus')}</button>
        <button data-a="mapa-zoom" data-v="todo" aria-label="Ver todo el barrio">${I('target')}</button>
        <button data-a="mapa-girar" aria-label="Girar el plano 180 grados" title="${mapaGiradoYa ? 'Ver como el plano original' : 'Garita abajo, canal arriba'}">${I('refresh')}</button>
      </div>
      <div class="mapa-pista">${I('info')}<span>${MAPA_PISTA}</span></div>
      <div class="mapa-tip" hidden></div>
    </div>
    <div class="mapa-zonas" role="toolbar" aria-label="Ir a una zona">${MAPA_ZONAS.map((z, i) => `<button data-a="mapa-zona" data-v="${i}">${esc(z.n)}</button>`).join('')}</div>
    <div class="mapa-base"><span><i class="b-casa"></i>Casa</span><span><i class="b-baldio"></i>Baldío</span><span><i class="b-hotel"></i>Hotel</span><span><i class="b-nop"></i>No dejar pasar</span></div>
  </section>`;
}

R.mapa = {
  titulo: 'Mapa del barrio', icon: 'map', color: 'sky', ancha: true, sub: 'Lotes, calles y lo que pasa en vivo',
  render(){ return veGarita() ? mapaBarrio({ grande:true }) : vacio('lock', 'El mapa del barrio es para la garita, la Administración y la supervisión.'); },
};

/* Los últimos movimientos de la garita con su lote (de "Ingresos de hoy"). */
function mapaRecientes(){
  if (typeof movimientosDeHoy !== 'function') return [];
  const desde = Date.now() - HORA;
  return movimientosDeHoy().filter(m => m.at >= desde).map(m => { const x = /→\s*Lote\s*([0-9]+[a-z]?)/i.exec(m.texto || '');
    return x && MAPA_LOTES[x[1].toUpperCase()] ? { ...m, lote:x[1].toUpperCase() } : null; }).filter(Boolean);
}

/* ---------- la ficha del lote ---------- */
function mapaFicha(l){
  const s = Store.s, d = mapaEstados()[l], k = mapaPrincipal(d), L = typeof lote === 'function' ? lote(l) : null;
  const f = typeof fichasDeVecinos === 'function' ? fichasDeVecinos().find(x => String(x.lote).toUpperCase() === l) : null;
  const opera = esGuardia(), hoy = hoyISO();
  const tipo = L?.grupo === 'hotel' ? (typeof HOTEL_NOMBRE !== 'undefined' ? HOTEL_NOMBRE : 'Hotel') : f?.estado === 'baldio' ? 'Baldío' : f?.estado === 'cabana' ? 'Cabaña del hotel' : 'Casa';
  const fila = (key, html) => `<div class="mf-estado" style="--c:${MAPA_ESTADOS[key].c}"><span class="mf-ic">${I(MAPA_ESTADOS[key].ic)}</span><div class="grow">${html}</div></div>`;
  const partes = [];
  if (d){
    d.sos.forEach(x => partes.push(fila('sos', `<b>${x.tipo === 'dea' ? 'Pidieron el DEA' : 'SOS'} · ${hace(x.at)}</b><small>${esc(nombreDe(x.userId))} · atendelo desde el aviso rojo</small>`)));
    d.cons.forEach(x => { const min = Math.floor((Date.now() - x.at) / MIN);
      partes.push(fila('cons', `<b>${esc(x.nombre)} está en la entrada</b><small>${esc(x.motivo || 'Visita')}${x.patente ? ' · ' + esc(x.patente) : ''} · esperando la respuesta hace ${min} min</small>`)); });
    d.nop.forEach(p => partes.push(`<div class="mf-estado nop"><span class="mf-ic">${I('x')}</span><div class="grow"><b>No dejar pasar</b><small>${esc(String(p.texto || '').slice(0, 120))}</small></div><button class="btn btn-xs btn-sec" data-a="ver-peticion" data-id="${p.id}">Ver</button></div>`));
    if (d.sola){ const r = typeof revisionDeHoy === 'function' ? revisionDeHoy(d.sola) : null;
      partes.push(fila('sola', `<b>Casa sola hasta el ${esc(fechaCorta(d.sola.hasta))}</b><small>${r ? `Revisada hoy a las ${hora(r.at)} h · ${r.novedad ? 'con novedad' : 'en orden'}` : 'Hoy todavía no se revisó'}</small>${opera ? `<div class="btns" style="margin-top:6px"><button class="btn btn-xs ${r ? 'btn-sec' : 'btn-ok'}" data-a="casa-revisar" data-v="${esc(d.sola.casa)}">${I('check')}${r ? 'Otra vez' : 'Revisada'}</button></div>` : ''}`)); }
    if (d.paq.length) partes.push(fila('paq', `<b>${plural(d.paq.length, 'paquete', 'paquetes')} en la garita</b><small>${d.paq.map(p => esc(p.empresa || 'Paquete') + ' · llegó ' + hace(p.recibido)).join('<br>')}</small>`));
    if (d.obra) partes.push(fila('obra', `<b>Obra: ${esc(d.obra.empresa || 'en curso')}</b><small>${d.obra.avisoHoy?.fecha === hoy ? 'Hoy: ' + esc(d.obra.avisoHoy.texto || '') : esc(d.obra.etapa || 'En curso')}</small>`));
  }
  const pases = [...(d?.adn || []), ...(d?.esp || [])];
  const cuentaLote = aLista(s.users).find(x => x && x.casa === 'Lote ' + l && x.estado === 'aprobado' && x.rol !== 'hotel');
  return `<div class="mapa-ficha" data-lote="${esc(l)}">
    <div class="mf-cab ${k ? 'm-' + k : ''}" style="${k ? '--c:' + MAPA_ESTADOS[k].c : ''}"><span class="mf-num">${esc(l)}</span>
      <div class="grow"><b>${esc(L?.dir || 'Lote ' + l)}</b><small>${esc(tipo)} · Lote ${esc(l)}${k ? ' · ' + esc(MAPA_ESTADOS[k].largo) : ''}</small></div></div>
    ${partes.length ? `<div class="mf-estados">${partes.join('')}</div>` : `<p class="muted small" style="margin:10px 2px">${I('check')} Hoy no hay nada pendiente en este lote.</p>`}
    ${pases.length ? `<div class="lbl" style="margin-top:12px">Visitas de hoy</div>${pases.map(p => tarjetaPase(p, { garita:true })).join('')}` : ''}
    ${f && typeof fichaVecino === 'function' ? `<div class="lbl" style="margin-top:12px">Quién vive</div><div class="fichas-vecinos">${fichaVecino(f, yo(), esStaff())}</div>` : ''}
    ${(() => { /* Lo que el vecino anotó en "Quiénes viven en la casa" (Mi perfil): la guía a veces trae solo al titular. */
      const ints = [...new Set(aLista(s.users).filter(x => x && x.casa === 'Lote ' + l && x.estado === 'aprobado' && x.integrantes).map(x => String(x.integrantes).trim()))];
      return ints.length ? `<p class="mf-integrantes">${I('users')}<span><b>Viven en la casa:</b> ${ints.map(esc).join(' · ')}<small>Lo cargó el vecino en su perfil</small></span></p>` : ''; })()}
    ${opera ? `<div class="btns" style="margin-top:12px">
      ${cuentaLote ? `<button class="btn btn-sm btn-pri" data-a="llegada-nueva" data-u="${esc(cuentaLote.id)}">${I('gate')}Llegó alguien para este lote</button>` : `<span class="muted small">${I('info')} Nadie de este lote usa la app: para avisar, llamalos.</span>`}
    </div>` : ''}
  </div>`;
}
function mapaAbrirFicha(l){
  hoja(`Lote ${l}`, mapaFicha(l));
  document.querySelectorAll('.lote.elegido').forEach(e => e.classList.remove('elegido'));
  document.querySelector(`.lote[data-v="${CSS.escape(l)}"]`)?.classList.add('elegido');
}
/* Con la ficha abierta, si algo cambia (entró la visita, contestó el vecino), la ficha se pone al día sola. */
Store.alCambiar(() => setTimeout(() => {
  const c = document.querySelector('#hojaCuerpo .mapa-ficha'), d = document.getElementById('hoja');
  /* Retocada, no rehecha: con la ficha abierta llegaban datos del barrio cada
     pocos segundos y la ficha entera parpadeaba (13-10-2026). */
  if (c && d && d.open){
    const molde = document.createElement('template'); molde.innerHTML = mapaFicha(c.dataset.lote);
    const nuevo = molde.content.firstElementChild;
    if (nuevo && typeof morfarNodo === 'function' && nuevo.nodeName === c.nodeName) morfarNodo(c, nuevo);
    else if (nuevo) c.replaceWith(nuevo);
  }
}, 0));

/* ---------- acciones ---------- */
A['mapa-lote'] = el => {
  if (Date.now() - mapaMovido < 400) return;   /* fue un arrastre, no un toque */
  const l = el.dataset.v, g = MAPA_LOTES[l]; if (!g) return;
  const svg = el.closest('.mapa-svg'), c = svg ? mapaCaja(svg) : null;
  /* De lejos, el primer toque acerca; con el lote grande, abre la ficha. */
  if (c && c.k * 22 < 18) return mapaIr({ cx:g.x, cy:g.y, z:mapaZoomLote() });
  mapaAbrirFicha(l);
};
A['mapa-garita'] = () => mapaIr({ cx:MAPA_GARITA[0], cy:MAPA_GARITA[1] + (mapaGiradoYa ? -40 : 40), z:Math.max(mapaVista.z || 1, 2.5) });
A['mapa-zoom'] = el => {
  const v = el.dataset.v;
  if (v === 'todo') return mapaIr({ cx:MAPA_CAJA.x + MAPA_CAJA.w / 2, cy:MAPA_CAJA.y + MAPA_CAJA.h / 2, z:1 });
  const svg = document.querySelector('.mapa-svg'), z = svg ? mapaZ(svg) : 1;
  mapaIr({ ...mapaVista, z:z * (v === '+' ? 1.6 : 1 / 1.6) }, 220);
};
A['mapa-zona'] = el => {
  const z = MAPA_ZONAS[+el.dataset.v]; if (!z) return;
  if (z.todo) return mapaIr({ cx:MAPA_CAJA.x + MAPA_CAJA.w / 2, cy:MAPA_CAJA.y + MAPA_CAJA.h / 2, z:1 });
  const ps = mapaRango(z.lotes).map(l => MAPA_LOTES[l]).filter(Boolean);
  const x0 = Math.min(...ps.map(p => p.x)) - 30, x1 = Math.max(...ps.map(p => p.x)) + 30, y0 = Math.min(...ps.map(p => p.y)) - 30, y1 = Math.max(...ps.map(p => p.y)) + 30;
  const svg = document.querySelector('.mapa-svg'), cw = svg?.clientWidth || 600, ch = svg?.clientHeight || 300;
  const k0 = Math.min(cw / MAPA_CAJA.w, ch / MAPA_CAJA.h), k = Math.min(cw / (x1 - x0), ch / (y1 - y0));
  mapaIr({ cx:(x0 + x1) / 2, cy:(y0 + y1) / 2, z:k / k0 });
};
A['mapa-filtro'] = el => {
  mapaFiltro = mapaFiltro === el.dataset.v ? '' : el.dataset.v;
  const est = mapaEstados();
  document.querySelectorAll('.mapa-svg .lote').forEach(g => g.classList.toggle('apagado', !!mapaFiltro && !mapaTiene(est[g.dataset.v], mapaFiltro)));
  document.querySelectorAll('.mapa-stat').forEach(b => { const on = b.dataset.v === mapaFiltro; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
  document.querySelectorAll('.mapa-filtrado').forEach(f => { f.hidden = !mapaFiltro;
    if (mapaFiltro){ f.querySelector('b').textContent = MAPA_ESTADOS[mapaFiltro]?.n || ''; f.querySelector('button').dataset.v = mapaFiltro; } });
  /* Si hay uno solo de esos, se va derecho a él. */
  const ls = mapaFiltro ? Object.keys(est).filter(l => mapaTiene(est[l], mapaFiltro)) : [];
  if (ls.length === 1) mapaIr({ cx:MAPA_LOTES[ls[0]].x, cy:MAPA_LOTES[ls[0]].y, z:mapaZoomLote() });
};
A['mapa-ir'] = el => {
  const l = el.dataset.v, g = MAPA_LOTES[l]; if (!g) return;
  const i = document.getElementById('mapaQ'); if (i) i.blur();
  mapaIr({ cx:g.x, cy:g.y, z:mapaZoomLote() });
  setTimeout(() => mapaAbrirFicha(l), 360);
};

/* ---------- el buscador ---------- */
function mapaBuscar(q){
  const caja = document.getElementById('mapaRes'), qq = normTxt(q || '').trim();
  mapaMarcados.forEach(l => document.querySelector(`.mapa-svg .lote[data-v="${CSS.escape(l)}"]`)?.classList.remove('encontrado'));
  mapaMarcados = [];
  if (!caja) return;
  if (!qq){ caja.innerHTML = ''; return; }
  const fichas = typeof fichasDeVecinos === 'function' ? fichasDeVecinos() : [];
  const ls = fichas.map(f => [f, puntajeFicha(f, qq)]).filter(([f, p]) => p > 0 && MAPA_LOTES[String(f.lote).toUpperCase()])
    .sort((a, b) => b[1] - a[1] || String(a[0].lote).localeCompare(String(b[0].lote), 'es', { numeric:true })).map(([f]) => f).slice(0, 6);
  mapaMarcados = ls.map(f => String(f.lote).toUpperCase());
  mapaMarcados.forEach(l => document.querySelector(`.mapa-svg .lote[data-v="${CSS.escape(l)}"]`)?.classList.add('encontrado'));
  caja.innerHTML = ls.length ? ls.map(f => `<button data-a="mapa-ir" data-v="${esc(String(f.lote).toUpperCase())}"><span class="mr-num"><small>Lote</small>${esc(f.lote)}</span><span class="mr-txt"><b>${esc(f.nombre || 'Sin nombres cargados')}</b><small>${I('pin')}${esc(f.L?.dir || 'Sin dirección cargada')}</small></span>${I('right')}</button>`).join('')
    : `<p class="mapa-nada">Ningún lote coincide con "${esc(q)}".</p>`;
}
document.addEventListener('input', e => { if (e.target && e.target.id === 'mapaQ') mapaBuscar(e.target.value); });
document.addEventListener('keydown', e => {
  if (e.target && e.target.id === 'mapaQ' && e.key === 'Enter'){ e.preventDefault(); const b = document.querySelector('#mapaRes [data-a="mapa-ir"]'); if (b) b.click(); return; }
  /* Con el teclado: Enter o espacio sobre un lote abre su ficha. */
  const g = e.target && e.target.closest && e.target.closest('.mapa-svg .lote');
  if (g && (e.key === 'Enter' || e.key === ' ')){ e.preventDefault(); mapaAbrirFicha(g.dataset.v); }
});

/* ---------- dedos, mouse y ruedita ----------
   Un dedo arrastra; dos dedos acercan o alejan. Si el dedo se movió más de
   6 píxeles, el toque no abre nada (era un arrastre). */
const mapaDedos = new Map();
let mapaPistaT = 0;
const MAPA_PISTA = 'Pellizcá o tocá un lote para acercarte';
let mapaGesto = null;
const mapaPunto = (svg, x, y) => { const r = svg.getBoundingClientRect(), c = mapaCaja(svg); return { x:c.x + (x - r.left) / c.k, y:c.y + (y - r.top) / c.k, c }; };
document.addEventListener('pointerdown', e => {
  const svg = e.target.closest && e.target.closest('.mapa-svg'); if (!svg) return;
  cancelAnimationFrame(mapaAnim);
  mapaDedos.set(e.pointerId, { x:e.clientX, y:e.clientY });
  mapaGesto = { svg, ini:{ ...mapaVista, z:mapaZ(svg) }, dedos:new Map([...mapaDedos].map(([k, v]) => [k, { ...v }])), movio:false };
});
document.addEventListener('pointermove', e => {
  if (!mapaGesto || !mapaDedos.has(e.pointerId)) return;
  mapaDedos.set(e.pointerId, { x:e.clientX, y:e.clientY });
  const { svg, ini, dedos } = mapaGesto, c = mapaCaja(svg, ini);
  const ids = [...mapaDedos.keys()].filter(k => dedos.has(k));
  if (ids.length >= 2){
    const [a, b] = ids, a0 = dedos.get(a), b0 = dedos.get(b), a1 = mapaDedos.get(a), b1 = mapaDedos.get(b);
    const d0 = Math.hypot(a0.x - b0.x, a0.y - b0.y) || 1, d1 = Math.hypot(a1.x - b1.x, a1.y - b1.y) || 1;
    const m0 = { x:(a0.x + b0.x) / 2, y:(a0.y + b0.y) / 2 }, m1 = { x:(a1.x + b1.x) / 2, y:(a1.y + b1.y) / 2 };
    const r = svg.getBoundingClientRect(), z = Math.max(1, Math.min(mapaZMax(), ini.z * d1 / d0)), k = c.k * z / ini.z;
    const px = c.x + (m0.x - r.left) / c.k, py = c.y + (m0.y - r.top) / c.k;   /* el punto del plano que estaba entre los dedos */
    mapaVista = mapaLimitar({ z, cx:px - (m1.x - r.left) / k + svg.clientWidth / 2 / k, cy:py - (m1.y - r.top) / k + svg.clientHeight / 2 / k });
    mapaGesto.movio = true;
  } else if (ids.length === 1){
    const p0 = dedos.get(ids[0]), p1 = mapaDedos.get(ids[0]), dx = p1.x - p0.x, dy = p1.y - p0.y;
    if (!mapaGesto.movio && Math.hypot(dx, dy) < 6) return;
    mapaGesto.movio = true;
    mapaVista = mapaLimitar({ ...ini, cx:ini.cx - dx / c.k, cy:ini.cy - dy / c.k });
  } else return;
  svg.classList.add('moviendo');
  mapaAplicar();
});
const mapaSoltar = e => {
  if (!mapaDedos.has(e.pointerId)) return;
  mapaDedos.delete(e.pointerId);
  if (mapaGesto){
    if (mapaGesto.movio) mapaMovido = Date.now();
    mapaGesto.svg.classList.remove('moviendo');
    /* Si queda un dedo, sigue arrastrando desde donde está. */
    mapaGesto = mapaDedos.size ? { svg:mapaGesto.svg, ini:{ ...mapaVista, z:mapaZ(mapaGesto.svg) }, dedos:new Map([...mapaDedos].map(([k, v]) => [k, { ...v }])), movio:mapaGesto.movio } : null;
  }
};
document.addEventListener('pointerup', mapaSoltar);
document.addEventListener('pointercancel', mapaSoltar);
document.addEventListener('wheel', e => {
  const svg = e.target.closest && e.target.closest('.mapa-svg'); if (!svg) return;
  /* En la garita la ruedita sigue bajando la página; para acercar, Ctrl o ⌘
     + ruedita (el pellizco del touchpad ya llega con Ctrl). En el mapa de
     pantalla completa, la ruedita acerca directo. */
  if (!svg.closest('.mapa-grande') && !e.ctrlKey && !e.metaKey){
    const pista = svg.parentElement.querySelector('.mapa-pista');
    if (pista){ pista.classList.add('aviso'); pista.lastChild.textContent = 'Para acercar: Ctrl + ruedita, o los botones + y −';
      clearTimeout(mapaPistaT); mapaPistaT = setTimeout(() => { pista.classList.remove('aviso'); pista.lastChild.textContent = MAPA_PISTA; }, 2200); }
    return;
  }
  e.preventDefault();
  const z0 = mapaZ(svg), p = mapaPunto(svg, e.clientX, e.clientY), z = Math.max(1, Math.min(mapaZMax(), z0 * Math.exp(-e.deltaY * 0.0022)));
  const k = p.c.k * z / z0, r = svg.getBoundingClientRect();
  mapaVista = mapaLimitar({ z, cx:p.x - (e.clientX - r.left) / k + svg.clientWidth / 2 / k, cy:p.y - (e.clientY - r.top) / k + svg.clientHeight / 2 / k });
  mapaAplicar();
}, { passive:false });
window.addEventListener('resize', () => mapaAplicar());

/* En la computadora: al pasar el mouse por un lote, una tarjetita con su
   número, la dirección y lo que pasa ahí. */
function mapaTip(e, mostrar){
  const lz = e.target.closest && e.target.closest('.mapa-lienzo'), tip = lz && lz.querySelector('.mapa-tip'), g = lz && e.target.closest('.mapa-svg .lote');
  if (!tip) return;
  if (!mostrar || !g || e.pointerType !== 'mouse' || mapaGesto){ tip.hidden = true; return; }
  const [num, ...resto] = (g.getAttribute('aria-label') || '').split(' · ');
  const color = getComputedStyle(g.querySelector('rect')).fill;
  if (tip.dataset.v !== g.dataset.v){ tip.dataset.v = g.dataset.v;
    tip.innerHTML = `<span class="mt-num" style="background:${color}">${esc(num.replace(/^Lote\s*/, ''))}</span><span class="mt-txt">${resto.map((t, i) => i ? `<small>${esc(t)}</small>` : `<b>${esc(t)}</b>`).join('') || '<b>' + esc(num) + '</b>'}</span>`; }
  const r = lz.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
  tip.hidden = false;
  tip.style.left = Math.min(r.width - tip.offsetWidth - 8, Math.max(8, x + 14)) + 'px';
  tip.style.top = Math.max(8, y - tip.offsetHeight - 12) + 'px';
}
document.addEventListener('pointermove', e => { if (e.pointerType === 'mouse' && e.target.closest && e.target.closest('.mapa-lienzo')) mapaTip(e, !!e.target.closest('.mapa-svg .lote')); });
document.addEventListener('pointerout', e => { if (e.target.closest && e.target.closest('.mapa-svg .lote')) mapaTip(e, false); });
