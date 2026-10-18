/* =========================================================
   EL RECORRIDO DE LA RONDA EN EL MAPA (pedido de Claudio, 15-10-2026)
   "El recorrido en tiempo real del policía cuando va marcando los QR,
   además de verlo la garita, que se vea en el mapa interactivo y se vaya
   marcando el recorrido uniendo los puntos consecutivos a través de las
   calles del barrio. Al tocar los vecinos los avatares de la garita y del
   policía, que vean el recorrido o si los hizo. La idea es que el policía
   haga 3 recorridos completos en sus 6 h. La Administración marca los
   puntos con un pin en el mismo plano de la garita, con el número que
   corresponde a la dirección del recorrido; al poner Finalizar ve una
   simulación del recorrido uniendo los puntos por las calles." Y después:
   "que los puntos acepten fotos para localizar mejor el lugar, de baja
   calidad, y que se descarguen en el móvil del policía".
   Ideas de leaflet-routing-machine (1.2k★: ir por las calles de un punto al
   otro) y traccar (7.9k★, Apache-2.0: ver el recorrido en vivo y
   repetirlo): solo las ideas, el código es propio.

   CÓMO FUNCIONA
   · Los puntos de control (staff/puntos, js/v-inicio.js) suman su lugar en
     el plano (x, y, en el sentido del plano original) y una foto chica
     (unos 15 KB, WebP o JPG de 420 px). El número de cada punto es su
     "orden" en la ronda.
   · Las calles del plano (MAPA_CALLES, js/mapa.js) se arman como una red;
     de un punto al siguiente se va por el camino más corto por las calles.
   · La garita, la Administración y la supervisión ven la ronda EN VIVO en
     el mapa del barrio: los puntos ya pasados en verde, el tramo hecho
     pintado y el policía en el último punto que escaneó.
   · LOS VECINOS (al tocar las caritas de la guardia) ven el recorrido y las
     rondas de la noche: cuántas hizo de las 3, a qué hora. Desde el
     17-10-2026 la ronda en curso les llega EN VIVO (pedido de Claudio), sin
     el nombre del policía; la Administración puede ponerle 5, 10 o 15
     minutos de demora. Va en el registro público de la guardia
     (/barrio/guardiaAhora).
   · En todos los mapas, el punto ya leído queda verde y fijo; los que faltan
     titilan (17-10-2026).
   · EL TELÉFONO DEL POLICÍA (sin cuenta) baja una sola vez, con el enlace de
     su tarjeta, "la guía de la ronda": los puntos en orden, su lugar y su
     foto chica. Cada vez que lee un QR le muestra el próximo punto con su
     foto (17-10-2026); la foto grande, solo si la pide. Queda guardada en SU teléfono (no vuelve a bajarla en cada
     punto) y se borra de la base cuando la garita registra su salida. La
     guía vive en /ronda/guia/<clave larga al azar>: solo la lee quien tiene
     el enlace (no se puede listar) y la escriben la garita y la
     Administración.
   ========================================================= */

/* ---------- la meta de la noche: 3 rondas completas ---------- */
const RONDA_META_BASE = 3;
const rondaMeta = () => Math.max(1, Math.min(8, Math.round(+(Store.s.config.rondasMeta || RONDA_META_BASE)) || RONDA_META_BASE));
/* Metros aproximados por unidad del plano (un lote de frente mide unos 27
   unidades y unos 20 m) y paso caminando a 4,5 km/h. */
const RONDA_M = 0.75, RONDA_PASO = 75;

/* ---------- los puntos con lugar en el plano ---------- */
const rondaPuntosMapa = () => puntosActivos().filter(pt => isFinite(pt.x) && isFinite(pt.y));
const rondaSinLugar = () => puntosActivos().filter(pt => !(isFinite(pt.x) && isFinite(pt.y)));

/* ---------- las calles como una red ---------- */
const rgDist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
function rgProy(p, a, b){
  const dx = b[0] - a[0], dy = b[1] - a[1], L = dx * dx + dy * dy || 1;
  const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L));
  const q = [a[0] + dx * t, a[1] + dy * t];
  return { t, q, d:rgDist(p, q) };
}
let rgCache = null, rgGiro = null;
function rondaGrafo(){
  if (rgCache && rgGiro === mapaGiradoYa) return rgCache;
  const nodos = [];
  const nodo = (x, y) => { const i = nodos.findIndex(n => Math.hypot(n[0] - x, n[1] - y) < 6); if (i >= 0) return i; nodos.push([x, y]); return nodos.length - 1; };
  const vistos = new Set(), segs = [];
  MAPA_CALLES.filter(c => !c.afuera).forEach(c => {
    const ids = c.pts.map(p => nodo(p[0], p[1]));
    ids.slice(1).forEach((b, i) => { const a = ids[i], k = Math.min(a, b) + '-' + Math.max(a, b); if (a !== b && !vistos.has(k)){ vistos.add(k); segs.push({ a, b, extra:[] }); } });
  });
  /* Una calle que termina contra otra (sin compartir el vértice) se une a
     la otra donde la toca. */
  const nv = nodos.length, uniones = [];
  for (let v = 0; v < nv; v++) segs.forEach(s => {
    if (s.a === v || s.b === v) return;
    const pr = rgProy(nodos[v], nodos[s.a], nodos[s.b]);
    if (pr.t > 0.001 && pr.t < 0.999 && pr.d < 26){
      const w = pr.d < 3 ? v : (nodos.push(pr.q), nodos.length - 1);
      s.extra.push([pr.t, w]); if (w !== v) uniones.push([v, w]);
    }
  });
  const ady = nodos.map(() => []), aristas = [];
  const unir = (a, b) => { if (a === b) return; const d = rgDist(nodos[a], nodos[b]); ady[a].push([b, d]); ady[b].push([a, d]); aristas.push([a, b]); };
  segs.forEach(s => { const cad = [s.a, ...s.extra.sort((x, y) => x[0] - y[0]).map(x => x[1]), s.b]; cad.slice(1).forEach((b, i) => unir(cad[i], b)); });
  uniones.forEach(([a, b]) => unir(a, b));
  rgGiro = mapaGiradoYa;
  return (rgCache = { nodos, ady, aristas });
}
function rgPegar(G, p){
  let mejor = null;
  G.aristas.forEach(([u, v]) => { const pr = rgProy(p, G.nodos[u], G.nodos[v]); if (!mejor || pr.d < mejor.d) mejor = { ...pr, u, v }; });
  return mejor;
}
/* El camino por las calles entre dos lugares (en el sentido en que se ve). */
function rondaCamino(p1, p2){
  const G = rondaGrafo(), s1 = rgPegar(G, p1), s2 = rgPegar(G, p2);
  if (!s1 || !s2) return [p1, p2];
  const misma = (s1.u === s2.u && s1.v === s2.v) || (s1.u === s2.v && s1.v === s2.u);
  if (misma) return [p1, s1.q, s2.q, p2];
  const n = G.nodos.length, dist = new Array(n).fill(Infinity), prev = new Array(n).fill(-1), hecho = new Array(n).fill(false);
  dist[s1.u] = rgDist(s1.q, G.nodos[s1.u]); dist[s1.v] = rgDist(s1.q, G.nodos[s1.v]);
  for (;;){
    let u = -1; for (let i = 0; i < n; i++) if (!hecho[i] && dist[i] < Infinity && (u < 0 || dist[i] < dist[u])) u = i;
    if (u < 0) break; hecho[u] = true;
    G.ady[u].forEach(([w, d]) => { if (dist[u] + d < dist[w]){ dist[w] = dist[u] + d; prev[w] = u; } });
  }
  const fu = dist[s2.u] + rgDist(G.nodos[s2.u], s2.q), fv = dist[s2.v] + rgDist(G.nodos[s2.v], s2.q);
  let k = fu <= fv ? s2.u : s2.v; if (!isFinite(Math.min(fu, fv))) return [p1, p2];
  const camino = []; while (k >= 0){ camino.unshift(G.nodos[k]); k = prev[k]; }
  return [p1, s1.q, ...camino, s2.q, p2];
}
const rgLargo = pts => pts.slice(1).reduce((s, p, i) => s + rgDist(pts[i], p), 0);
const rgD = pts => pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ');
/* Los tramos de toda la ronda, del 1 al último (y de vuelta al 1 si se pide). */
function rondaTramos(pts, { cerrar = false } = {}){
  const xy = pts.map(pt => mapaP(pt.x, pt.y));
  const tramos = xy.slice(1).map((b, i) => rondaCamino(xy[i], b));
  if (cerrar && xy.length > 2) tramos.push(rondaCamino(xy[xy.length - 1], xy[0]));
  return tramos;
}
const rondaLargoTxt = tramos => { const m = tramos.reduce((s, t) => s + rgLargo(t), 0) * RONDA_M;
  return `${m >= 1000 ? (m / 1000).toLocaleString('es-AR', { maximumFractionDigits:1 }) + ' km' : Math.round(m / 10) * 10 + ' m'} · unos ${Math.max(1, Math.round(m / RONDA_PASO))} min caminando`; };

/* ---------- cómo va la ronda de esta noche ---------- */
/* La ronda que se dibuja en el mapa: la que está en curso o, si recién
   terminó, esa misma (toda en verde) durante RONDA_FIJA: así el último
   punto leído no "desaparece" en cuanto se completa la ronda. */
const RONDA_FIJA = 15 * MIN;
/* Para la garita, la Administración y la supervisión: en vivo. */
function rondaEnVivo(){
  const t = typeof turnoAbierto === 'function' ? turnoAbierto() : null;
  const p = t ? policiasAdentro(t)[0] : null, pts = rondaPuntosMapa();
  if (!p) return { p:null, pts, hechas:[], curso:null, mapa:null };
  const orden = pt => pts.findIndex(x => x.id === pt) + 1;
  const pasados = r => { const m = new Map(); pasosDeRonda(r).forEach(x => { const n = orden(x.punto); if (n && !m.has(n)) m.set(n, pasoAt(x)); }); return m; };
  const rc = rondaEnCurso(p);
  const hechas = p.rondas.filter(r => r.fin).map(r => { const e = conQR(r) ? estadoRonda(r) : null; return { ini:r.inicio, fin:r.fin, n:e ? e.n : 0, total:e ? e.total : 0, ok: !!e && e.total > 0 && e.n >= e.total && !r.incompleta, inc: !!r.incompleta, qr:conQR(r) }; });
  const curso = rc ? { ini:rc.inicio, pasados:pasados(rc) } : null;
  const ult = !rc ? p.rondas.filter(r => r.fin && conQR(r) && Date.now() - r.fin < RONDA_FIJA).slice(-1)[0] : null;
  return { p, pts, hechas, curso, mapa: curso || (ult ? { ini:ult.inicio, fin:ult.fin, pasados:pasados(ult) } : null) };
}
/* LOS VECINOS, EN VIVO (17-10-2026). Claudio: "que esto se vea en todos los
   usuarios de la app en tiempo real (garita, vecinos, administración,
   supervisión)". Hasta ahora a los vecinos les llegaba con 10 minutos de
   demora; ahora les llega en vivo (sin el nombre del policía). La
   Administración puede volver a ponerle una demora (Turnos → Puntos de
   control → "Los vecinos ven la ronda"): 0, 5, 10 o 15 minutos. */
const rondaDemora = () => { const m = Math.round(+Store.s.config.rondaDemoraVecinos); return isFinite(m) && m > 0 ? Math.min(30, m) * MIN : 0; };
/* Lo que se publica para los vecinos: sin nombres, en vivo o con la demora elegida. */
function rondaPublica(t){
  const pts = rondaPuntosMapa(); if (!pts.length) return null;
  const p = t ? policiasAdentro(t)[0] : null, dem = rondaDemora(), corte = Date.now() - dem, aMin = x => Math.floor(x / MIN) * MIN;
  const o = { meta:rondaMeta(), pts: pts.map(pt => Math.round(pt.x) + ',' + Math.round(pt.y)).join(' '), ...(dem ? { d:Math.round(dem / MIN) } : {}) };
  if (!p) return o;
  const v = rondaEnVivo();
  const hechas = v.hechas.filter(h => h.fin <= corte);
  if (hechas.length) o.r = hechas.map(h => [aMin(h.ini), aMin(h.fin), h.n, h.total, h.ok ? 1 : 0].join(',')).join(';');
  /* La ronda del mapa a la hora del corte: la que estaba en curso o la que
     había terminado hacía menos de RONDA_FIJA, con sus puntos ya leídos. */
  const r = p.rondas.filter(x => conQR(x) && x.inicio <= corte && (!x.fin || x.fin > corte - RONDA_FIJA)).slice(-1)[0];
  if (r){
    const m = new Map(); pasosDeRonda(r).forEach(x => { const n = pts.findIndex(z => z.id === x.punto) + 1; if (n && !m.has(n) && pasoAt(x) <= corte) m.set(n, pasoAt(x)); });
    o.c = aMin(r.inicio); o.cp = [...m].map(([n, at]) => n + '@' + aMin(at)).join(' ');
    if (r.fin && r.fin <= corte) o.cf = aMin(r.fin);
  }
  return o;
}
/* Leer lo publicado (texto compacto) como lo que usa el dibujo. */
function rondaDePublico(r){
  if (!r || !r.pts) return null;
  const pts = String(r.pts).split(' ').map((s, i) => { const [x, y] = s.split(',').map(Number); return { id:'p' + i, x, y, orden:i + 1, nombre:'Punto ' + (i + 1) }; }).filter(p => isFinite(p.x));
  const hechas = String(r.r || '').split(';').filter(Boolean).map(s => { const [ini, fin, n, total, ok] = s.split(',').map(Number); return { ini, fin, n, total, ok:!!ok, qr:true }; });
  const pasados = new Map(String(r.cp || '').split(' ').filter(Boolean).map(s => { const [n, at] = s.split('@').map(Number); return [n, at]; }));
  const mapa = r.c ? { ini:+r.c, pasados, ...(r.cf ? { fin:+r.cf } : {}) } : null;
  return { pts, meta:+r.meta || RONDA_META_BASE, hechas, curso: mapa && !mapa.fin ? mapa : null, mapa, demora:+r.d || 0 };
}

/* ---------- el dibujo de la ronda (capa del mapa y mapa chico) ---------- */
/* LA GORRA DEL POLICÍA (pedido de Claudio, 17-10-2026: "el punto, que sería
   el policía, rediseñalo a una gorra de policía"). Dibujo propio: copa azul
   marino, escudo dorado, cinta y visera negra. Centrada en (0,0). */
const rondaGorra = (cls = '') => `<g class="rm-gorra ${cls}"><ellipse class="rm-g-sombra" cx="0" cy="9" rx="11" ry="2.6"/>
  <path class="rm-g-copa" d="M-13,-1 C-15,-9 -8,-15 0,-15 C8,-15 15,-9 13,-1 Z"/>
  <rect class="rm-g-cinta" x="-11.5" y="-3.2" width="23" height="4.6" rx="1.2"/>
  <path class="rm-g-raya" d="M-11.5,-1 H11.5"/>
  <path class="rm-g-visera" d="M-12.5,1.2 Q0,9.5 12.5,1.2 Q0,4.8 -12.5,1.2 Z"/>
  <path class="rm-g-escudo" d="M0,-11.8 L3.6,-10.4 L3.2,-6.6 Q2.4,-4.6 0,-3.6 Q-2.4,-4.6 -3.2,-6.6 L-3.6,-10.4 Z"/>
  <circle class="rm-g-estrella" cx="0" cy="-7.8" r="1.25"/></g>`;
/* LA SIMULACIÓN, PAREJA Y MÁS DESPACIO (17-10-2026): "que la gorra y la
   línea que une los puntos vayan a la misma velocidad y más despacio". Las
   dos van con el MISMO reloj (las dos animaciones adentro del mismo dibujo,
   con la misma duración y los mismos tiempos) y a velocidad pareja por
   distancia: la línea se pinta justo hasta donde está la gorra. La velocidad
   es fija por largo del recorrido (RONDA_SIM_VEL unidades del plano por
   segundo, unas 3 veces más lenta que antes): un recorrido largo tarda más. */
const RONDA_SIM_VEL = 65;
const rondaSimDur = tramos => Math.max(18, Math.min(90, rgLargo(tramos.flat()) / RONDA_SIM_VEL));
const rondaQuieto = () => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch(e){ return false; } };
/* pasados: Map(número → hora) de la ronda que se muestra. servicio: hay
   policía de servicio (los puntos que faltan titilan). sim: la simulación.
   LEÍDO FIJO, FALTANTE TITILA (17-10-2026): el punto que el policía ya leyó
   queda verde y quieto, con su hora; los que faltan de esa ronda titilan, y
   el próximo además late con una onda. Lo ven igual la garita, la
   Administración, la supervisión y los vecinos. */
function rondaPoliSVG(pts, pasados){
  const nPas = [...pasados.keys()]; if (!nPas.length) return '';
  const ultimo = nPas.reduce((a, b) => (pasados.get(b) > pasados.get(a) ? b : a)), pt = pts[ultimo - 1];
  if (!pt || !isFinite(pt.x)) return '';
  const [x, y] = mapaP(pt.x, pt.y);
  return `<g class="ronda-capa rm-poli-capa"><g class="rm-poli" transform="translate(${x} ${y - 30})"><circle class="rm-poli-halo" cx="0" cy="-4" r="22"/><g transform="scale(1.5)">${rondaGorra()}</g></g></g>`;
}
function rondaCapaSVG({ pts, pasados = new Map(), sim = false, editar = false, sel = -1, vivo = false, servicio = vivo, sinPoli = false }){
  /* Los puntos sin lugar (en el editor) no se dibujan, pero conservan su número. */
  const idx = pts.map((p, i) => i).filter(i => isFinite(pts[i].x) && isFinite(pts[i].y));
  if (!idx.length) return editar ? '<g class="ronda-capa editar"></g>' : '';
  const ubic = idx.map(i => pts[i]), tramos = rondaTramos(ubic);
  const xy = pts.map(pt => isFinite(pt.x) ? mapaP(pt.x, pt.y) : null);
  const siguiente = pts.findIndex((pt, i) => !pasados.has(i + 1)) + 1;
  const titila = !editar && !sim && (servicio || pasados.size > 0);
  const todo = rgD(tramos.flat());
  const lineas = tramos.map((t, k) => { const hecho = pasados.has(idx[k] + 1) && pasados.has(idx[k + 1] + 1);
    return `<path class="rm-tramo${hecho ? ' hecho' : ''}" d="${rgD(t)}"/>`; }).join('');
  const pins = idx.map(i => { const [x, y] = xy[i], n = i + 1, ok = pasados.has(n), pt = pts[i], prox = titila && !ok && n === siguiente;
    return `<g class="rm-pin${ok ? ' hecho' : titila ? ' falta' : ''}${prox ? ' prox' : ''}${sel === i ? ' sel' : ''}${pt.foto ? ' con-foto' : ''}" data-rp="${i}" role="button" tabindex="0" aria-label="Punto ${n}: ${esc(pt.nombre || '')}${ok ? ' · leído a las ' + hora(pasados.get(n)) + ' h' : titila ? ' · falta' : ''}" style="--d:${(idx.indexOf(i) * 0.55).toFixed(2)}s">
      ${prox ? `<circle class="rm-onda" cx="${x}" cy="${y}" r="11"/>` : ''}
      <circle class="rm-base" cx="${x}" cy="${y}" r="10.5"/>
      <text class="rm-num" x="${x}" y="${y + 0.4}">${ok ? '✓' : n}</text>
      ${pt.foto ? `<circle class="rm-cam" cx="${x + 9}" cy="${y - 8}" r="3.6"/>` : ''}
      ${ok && !editar ? `<text class="rm-hora" x="${x}" y="${y + 19}">${hora(pasados.get(n))}</text>` : ''}</g>`; }).join('');
  /* El policía: la gorra en el último punto que leyó (en el mapa grande va
     en su propia capa, encima de la garita: rondaPoliMapa). */
  const poli = vivo && !sim && !sinPoli ? rondaPoliSVG(pts, pasados) : '';
  let andar = '';
  if (sim && tramos.length){
    const dur = rondaSimDur(tramos).toFixed(1) + 's', kt = '0;0.92;1';
    andar = rondaQuieto() ? `<path class="rm-sim quieta" d="${todo}"/>`
      : `<path class="rm-sim" d="${todo}" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"><animate attributeName="stroke-dashoffset" values="1;0;0" keyTimes="${kt}" dur="${dur}" repeatCount="indefinite"/></path>
    <g class="rm-auto"><g transform="translate(0 -20) scale(1.6)">${rondaGorra('anda')}</g><animateMotion dur="${dur}" repeatCount="indefinite" path="${todo}" calcMode="linear" keyPoints="0;1;1" keyTimes="${kt}"/></g>`;
  }
  return `<g class="ronda-capa${sim ? ' sim' : ''}${editar ? ' editar' : ''}${titila ? ' en-curso' : ''}" style="--n:${tramos.length}">${lineas}${andar}${pins}${poli}</g>`;
}
/* El mapa chico (para los vecinos, la garita y el teléfono del policía). */
function rondaMiniSVG(datos, { sim = false, vivo = false } = {}){
  const [gx, gy] = MAPA_GARITA, giro = mapaGiradoYa ? ` transform="rotate(180 ${MAPA_CENTRO[0]} ${MAPA_CENTRO[1]})"` : '';
  const lotes = Object.values(MAPA_LOTES).map(g => `<rect x="${(-g.w / 2).toFixed(1)}" y="${(-g.d / 2).toFixed(1)}" width="${g.w.toFixed(1)}" height="${g.d}" rx="4" transform="translate(${g.x} ${g.y}) rotate(${g.ang.toFixed(1)})"/>`).join('');
  const calles = MAPA_CALLES.filter(c => !c.afuera).map(c => `<polyline points="${mapaPuntos(c.pts)}"/>`).join('');
  return `<svg class="rm-mini" viewBox="${MAPA_CAJA.x} ${MAPA_CAJA.y} ${MAPA_CAJA.w} ${MAPA_CAJA.h}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Plano del barrio con el recorrido de la ronda">
    <rect x="-400" y="-400" width="2000" height="1400" class="rm-tierra"/>
    <g${giro}><path class="rm-mar" d="M-200,430 L30,420 L140,394 L250,364 L340,344 L470,353 L505,372 L530,396 L600,404 L700,438 L820,462 L940,484 L1000,506 L1300,520 L1300,800 L-200,800 Z"/></g>
    <g class="rm-calles">${calles}</g><g class="rm-lotes">${lotes}</g>
    <g class="rm-garita"><circle cx="${gx}" cy="${gy}" r="11"/><text x="${gx}" y="${gy - 17}">GARITA</text></g>
    ${rondaCapaSVG({ pts:datos.pts, pasados:(datos.mapa || datos.curso || {}).pasados || new Map(), sim, vivo, servicio:!!datos.p })}</svg>`;
}
/* Los anillos de la noche: ronda 1, 2 y 3 (la meta). */
function rondaAnillos(d, meta = rondaMeta()){
  const hechas = d.hechas.filter(h => h.ok), otras = d.hechas.filter(h => !h.ok);
  const n = Math.max(meta, hechas.length + (d.curso ? 1 : 0));
  const total = d.pts.length;
  const items = Array.from({ length:n }, (_, i) => {
    const h = hechas[i];
    if (h) return `<span class="rm-anillo ok" style="--p:1"><i>${I('check')}</i><b>Ronda ${i + 1}</b><small>${hora(h.ini)}–${hora(h.fin)} h</small></span>`;
    if (i === hechas.length && d.curso){ const k = d.curso.pasados.size;
      return `<span class="rm-anillo curso" style="--p:${total ? (k / total).toFixed(2) : 0}"><i>${k}/${total}</i><b>Ronda ${i + 1}</b><small>en curso${d.demora ? ` · con ${d.demora} min de demora` : ` desde ${hora(d.curso.ini)} h`}</small></span>`; }
    return `<span class="rm-anillo" style="--p:0"><i>${i + 1}</i><b>Ronda ${i + 1}</b><small>${i < meta ? 'pendiente' : 'extra'}</small></span>`;
  }).join('');
  return `<div class="rm-anillos">${items}</div>${otras.length ? `<p class="rm-nota-inc">${I('alert')}${plural(otras.length, 'ronda incompleta', 'rondas incompletas')} (no pasó por todos los puntos): no cuentan para la meta.</p>` : ''}`;
}

/* ---------- la capa en el mapa grande de la garita ---------- */
let rondaCapaOn = (() => { try { return localStorage.getItem('bhc.mapa.ronda') !== '0'; } catch(e){ return true; } })();
let rondaSimHasta = 0;
function rondaCapaMapa(){
  if (RondaEd.activo) return rondaCapaSVG({ pts:RondaEd.pts, editar:true, sel:RondaEd.sel });
  if (!rondaCapaOn) return '';
  const v = rondaEnVivo(); if (!v.pts.length) return '';
  const sim = Date.now() < rondaSimHasta;
  return rondaCapaSVG({ pts:v.pts, pasados: !sim && v.mapa ? v.mapa.pasados : new Map(), vivo: !!v.mapa, servicio: !!v.p, sim, sinPoli:true });
}
/* La gorra del policía en el mapa grande: se dibuja después de la garita, así no queda tapada. */
function rondaPoliMapa(){
  if (RondaEd.activo || !rondaCapaOn || Date.now() < rondaSimHasta) return '';
  const v = rondaEnVivo(); return v.mapa ? rondaPoliSVG(v.pts, v.mapa.pasados) : '';
}
/* La tira de arriba del mapa: cómo va la noche, o el editor de la Administración. */
function rondaTiraMapa(){
  if (RondaEd.activo) return rondaEditorHTML();
  const pts = rondaPuntosMapa(), sin = rondaSinLugar();
  if (!pts.length && !sin.length) return esAdmin() ? `<div class="rm-tira vacia">${I('pin')}<span><b>Ronda del policía</b>Marcá en el plano dónde va cada QR y en qué orden.</span><button class="btn btn-xs btn-pri" data-a="ronda-editar">Marcar el recorrido</button></div>` : '';
  const v = rondaEnVivo(), meta = rondaMeta(), ok = v.hechas.filter(h => h.ok).length;
  const estado = !v.p ? `Sin policía de servicio · ${plural(pts.length, 'punto')}` : v.curso ? `En ronda · ${v.curso.pasados.size} de ${pts.length} puntos` : `${ok} de ${meta} rondas completas`;
  return `<div class="rm-tira${v.curso ? ' vivo' : ''}">
    <button class="rm-tira-on ${rondaCapaOn ? 'on' : ''}" data-a="ronda-capa" aria-pressed="${rondaCapaOn}">${I('shield')}<span><b>Ronda del policía</b>${esc(estado)}</span><i class="rm-sw" aria-hidden="true"></i></button>
    <div class="rm-tira-acc">${pts.length > 1 ? `<button class="btn btn-xs btn-sec" data-a="ronda-sim">${I('target')}Simular</button>` : ''}${esAdmin() ? `<button class="btn btn-xs btn-sec" data-a="ronda-editar">${I('edit')}Editar recorrido</button>` : ''}</div>
    ${sin.length && esAdmin() ? `<p class="rm-falta">${I('alert')}${plural(sin.length, 'punto', 'puntos')} sin lugar en el plano: ${sin.map(p => esc(p.nombre)).join(', ')}. Tocá "Editar recorrido" para ubicarlos.</p>` : ''}
  </div>`;
}
A['ronda-capa'] = () => { rondaCapaOn = !rondaCapaOn; try { localStorage.setItem('bhc.mapa.ronda', rondaCapaOn ? '1' : '0'); } catch(e){} refrescar(); };
/* La simulación dura dos vueltas (mínimo un minuto) y después vuelve a la ronda en vivo. */
const rondaSimMs = () => Math.max(60000, Math.round(rondaSimDur(rondaTramos(rondaPuntosMapa())) * 2000) + 1500);
A['ronda-sim'] = () => { rondaCapaOn = true; const ms = rondaSimMs(); rondaSimHasta = Date.now() + ms; refrescar(); setTimeout(() => { if (Date.now() >= rondaSimHasta) refrescar(); }, ms + 500);
  toast(`Simulación: del 1 al ${rondaPuntosMapa().length} por las calles · ${rondaLargoTxt(rondaTramos(rondaPuntosMapa()))}`, 'shield'); };

/* ---------- el editor de la Administración ----------
   Se trabaja sobre una copia (borrador): nada cambia para la garita hasta
   tocar "Finalizar". Cada toque en el plano pone el punto elegido; si no
   hay uno elegido, ubica el primero que falta o agrega uno nuevo al final. */
const RondaEd = {
  activo:false, pts:[], sel:-1, hist:[], grandes:new Map(),
  abrir(){
    this.pts = puntosActivos().map(pt => ({ ...pt }));
    this.sel = this.pts.findIndex(p => !isFinite(p.x));
    this.hist = []; this.grandes = new Map(); this.activo = true;
  },
  guardarHist(){ this.hist.push(JSON.stringify(this.pts)); if (this.hist.length > 40) this.hist.shift(); },
  tocar(x, y, lugar){
    this.guardarHist();
    let i = this.sel >= 0 ? this.sel : this.pts.findIndex(p => !isFinite(p.x));
    if (i < 0){
      if (this.pts.length >= 12) return toast('Hasta 12 puntos por ronda', 'pin');
      this.pts.push({ id:'', nombre:'', lugar:'', activo:true }); i = this.pts.length - 1;
    }
    const p = this.pts[i];
    Object.assign(p, { x:Math.round(x), y:Math.round(y) });
    if (!p.nombre) p.nombre = lugar ? `${lugar}`.slice(0, 40) : 'Punto ' + (i + 1);
    if (!p.lugar && lugar) p.lugar = lugar.slice(0, 80);
    const falta = this.pts.findIndex(q => !isFinite(q.x));
    this.sel = falta;
    this.pintar();
  },
  pintar(){
    const g = document.querySelector('.mapa-card .mapa-svg .ronda-capa'), lz = document.querySelector('.mapa-card .mapa-svg');
    const nuevo = rondaCapaSVG({ pts:this.pts, editar:true, sel:this.sel });
    if (g) g.outerHTML = nuevo;
    else if (lz){ const t = document.createElementNS('http://www.w3.org/2000/svg', 'g'); lz.insertBefore(t, lz.querySelector('.garita-pin')); t.outerHTML = nuevo; }
    const ed = document.querySelector('.rm-editor'); if (ed) ed.outerHTML = rondaEditorHTML();
  },
};
/* En el editor, los puntos sin lugar no se dibujan (y el número sigue el orden de la lista). */
function rondaEditorHTML(){
  const ps = RondaEd.pts, ubicados = ps.filter(p => isFinite(p.x));
  const prox = RondaEd.sel >= 0 ? RondaEd.sel : ps.findIndex(p => !isFinite(p.x));
  const consigna = prox >= 0 ? `Tocá en el plano dónde va el <b>punto ${prox + 1}${ps[prox].nombre ? ' · ' + esc(ps[prox].nombre) : ''}</b>` : ps.length < 12 ? 'Tocá en el plano para <b>agregar el punto ' + (ps.length + 1) + '</b>, o elegí uno de la lista para moverlo' : 'Elegí un punto de la lista para moverlo';
  return `<div class="rm-editor">
    <div class="rm-ed-cab"><span class="rm-ed-ic">${I('pin')}</span><div class="grow"><b>Marcar el recorrido de la ronda</b><small>${consigna}. El número es el orden en que el policía los recorre.</small></div></div>
    <ol class="rm-ed-lista">${ps.map((p, i) => `<li class="${RondaEd.sel === i ? 'sel' : ''}${isFinite(p.x) ? '' : ' falta'}">
      <button class="rm-ed-n" data-a="ronda-ed-sel" data-i="${i}" aria-label="Elegir el punto ${i + 1} para ubicarlo">${i + 1}</button>
      <label class="rm-ed-foto${p.foto ? ' tiene' : ''}" title="${p.foto ? 'Cambiar la foto' : 'Agregar una foto del lugar'}">${p.foto ? `<img src="${p.foto}" alt="">` : I('camera')}<input type="file" accept="image/*" data-ronda-foto="${i}" hidden></label>
      <span class="rm-ed-txt"><input class="rm-ed-nom" data-ronda-nom="${i}" value="${esc(p.nombre || '')}" maxlength="40" placeholder="Nombre del punto" aria-label="Nombre del punto ${i + 1}"><small>${isFinite(p.x) ? esc(p.lugar || 'En el plano') : 'Falta ubicarlo: tocá el número y después el plano'}${p.id ? '' : ' · nuevo: hay que imprimir su QR'}</small></span>
      <span class="rm-ed-mov"><button data-a="ronda-ed-mover" data-i="${i}" data-v="-1" aria-label="Subir" ${i ? '' : 'disabled'}>▲</button><button data-a="ronda-ed-mover" data-i="${i}" data-v="1" aria-label="Bajar" ${i < ps.length - 1 ? '' : 'disabled'}>▼</button></span>
      <button class="rm-ed-x" data-a="ronda-ed-quitar" data-i="${i}" aria-label="Quitar el punto ${i + 1}">${I('x')}</button></li>`).join('')}</ol>
    ${ubicados.length > 1 ? `<p class="rm-ed-largo">${I('target')}Recorrido de ${esc(rondaLargoTxt(rondaTramos(ubicados)))}</p>` : ''}
    <div class="rm-ed-acc"><button class="btn btn-sm btn-sec" data-a="ronda-ed-deshacer" ${RondaEd.hist.length ? '' : 'disabled'}>${I('refresh')}Deshacer</button>
      <button class="btn btn-sm btn-sec" data-a="ronda-ed-cancelar">${I('x')}Cancelar</button>
      <button class="btn btn-sm btn-pri" data-a="ronda-ed-fin" ${ubicados.length >= 2 && ubicados.length === ps.length ? '' : 'disabled'}>${I('check')}Finalizar</button></div>
    ${ps.length && ubicados.length < ps.length ? `<p class="rm-ed-nota">Para finalizar, ubicá todos los puntos (o quitá los que no van). Mínimo 2.</p>` : ''}
    <p class="rm-ed-nota">${I('camera')} La foto es del poste o del lugar donde va el QR, sin personas, patentes ni el frente de una casa: le llega al teléfono del policía.</p>
  </div>`;
}
A['ronda-editar'] = () => {
  if (!esAdmin()) return;
  RondaEd.abrir(); rondaCapaOn = true;
  if (PILA.length && PILA[PILA.length - 1].id === 'mapa') refrescar(); else abrir('mapa');
  setTimeout(() => document.querySelector('.rm-editor')?.scrollIntoView({ block:'nearest', behavior:'smooth' }), 200);
};
A['ronda-ed-sel'] = el => { const i = +el.dataset.i; RondaEd.sel = RondaEd.sel === i ? -1 : i; RondaEd.pintar();
  const p = RondaEd.pts[i]; if (RondaEd.sel === i && p && isFinite(p.x)) mapaIr({ cx:mapaP(p.x, p.y)[0], cy:mapaP(p.x, p.y)[1], z:Math.max(mapaVista.z || 1, 2.2) }); };
A['ronda-ed-mover'] = el => { const i = +el.dataset.i, j = i + +el.dataset.v, ps = RondaEd.pts; if (j < 0 || j >= ps.length) return;
  RondaEd.guardarHist(); [ps[i], ps[j]] = [ps[j], ps[i]]; if (RondaEd.sel === i) RondaEd.sel = j; else if (RondaEd.sel === j) RondaEd.sel = i; RondaEd.pintar(); };
A['ronda-ed-quitar'] = el => { const i = +el.dataset.i; if (!RondaEd.pts[i]) return;
  RondaEd.guardarHist(); RondaEd.pts.splice(i, 1); RondaEd.sel = -1; RondaEd.pintar(); };
A['ronda-ed-deshacer'] = () => { const h = RondaEd.hist.pop(); if (!h) return; RondaEd.pts = JSON.parse(h); RondaEd.sel = -1; RondaEd.pintar(); };
A['ronda-ed-cancelar'] = () => { RondaEd.activo = false; refrescar(); toast('Sin cambios en el recorrido', 'info'); };
A['ronda-ed-fin'] = async () => {
  const ps = RondaEd.pts; if (ps.length < 2 || ps.some(p => !isFinite(p.x))) return;
  const antes = new Map(aLista(Store.s.puntos).map(p => [p.id, p]));
  const quedan = new Set(ps.map(p => p.id).filter(Boolean));
  const fuera = [...antes.values()].filter(p => p.activo !== false && !quedan.has(p.id));
  if (fuera.length && !await confirmar('Puntos que salen del recorrido', `${fuera.map(p => p.nombre).join(', ')}: sus QR dejan de valer. Los pasos ya registrados quedan en la historia.`, { si:'Seguir' })) return;
  let nuevos = 0; const sueltas = [];
  Store.cambiar(s => {
    aLista(s.puntos).filter(p => !(quedan.has(p.id) || p.activo === false) && p.fg).forEach(p => sueltas.push(p.fg));
    s.puntos = aLista(s.puntos).filter(p => quedan.has(p.id) || p.activo === false);
    ps.forEach((p, i) => {
      let pt = s.puntos.find(x => x.id === p.id);
      if (!pt){ pt = { id:'pt' + claveAzar().slice(0, 6), k:claveAzar(), at:Date.now(), activo:true }; s.puntos.push(pt); nuevos++; }
      Object.assign(pt, { nombre:String(p.nombre || 'Punto ' + (i + 1)).trim().slice(0, 40), lugar:String(p.lugar || '').slice(0, 80), orden:i + 1, x:p.x, y:p.y, activo:true });
      const fgViejo = pt.fg;
      if (p.foto){ pt.foto = p.foto; if (p._g && RondaEd.grandes.has(p._g)) pt.fg = rondaGrandeGuardar(RondaEd.grandes.get(p._g)); else if (p.fg) pt.fg = p.fg; else delete pt.fg; }
      else { delete pt.foto; delete pt.fg; }
      if (fgViejo && fgViejo !== pt.fg) sueltas.push(fgViejo);
    });
    auditar(s, 'Marcó el recorrido de la ronda en el plano', `${ps.length} puntos${nuevos ? ` (${nuevos} nuevos)` : ''}${fuera.length ? `, salieron ${fuera.length}` : ''}`);
  });
  sueltas.forEach(rondaGrandeBorrar);
  RondaEd.activo = false;
  rondaGuiasAlDia();
  rondaSimHasta = Date.now() + rondaSimMs();
  refrescar();
  hoja('Recorrido guardado', `<div class="rm-sim-hoja">${rondaMiniSVG({ pts:rondaPuntosMapa(), hechas:[], curso:null }, { sim:true })}</div>
    <p style="margin:12px 2px 6px"><b>${plural(ps.length, 'punto', 'puntos')} en orden, del 1 al ${ps.length}</b> · ${esc(rondaLargoTxt(rondaTramos(rondaPuntosMapa())))}.</p>
    <p class="muted small" style="margin:0 2px 10px">La garita ya lo ve en su mapa y el policía lo recibe con su tarjeta (con las fotos). ${nuevos ? `<b>Hay ${plural(nuevos, 'punto nuevo', 'puntos nuevos')}: imprimí sus QR y pegalos en el lugar.</b>` : 'Los QR que ya estaban pegados siguen valiendo.'}</p>
    <div class="btns"><button class="btn btn-pri grow" data-a="ronda-compartir">${I('share')}Compartir el plano</button>${nuevos ? `<button class="btn btn-sec grow" data-a="puntos-imprimir">${I('qr')}Imprimir los QR</button>` : ''}</div>`);
};
/* El toque en el plano mientras se edita: va antes que el de los lotes. */
document.addEventListener('click', e => {
  if (!RondaEd.activo) return;
  const svg = e.target.closest && e.target.closest('.mapa-card .mapa-svg'); if (!svg || svg.classList.contains('mv-svg')) return;
  e.stopPropagation(); e.preventDefault();
  if (Date.now() - mapaMovido < 350) return;
  const pin = e.target.closest('[data-rp]');
  if (pin){ const i = +pin.dataset.rp; RondaEd.sel = RondaEd.sel === i ? -1 : i; RondaEd.pintar(); return; }
  const p = mapaPunto(svg, e.clientX, e.clientY), [x, y] = mapaP(p.x, p.y);
  if (x < MAPA_CAJA.x || x > MAPA_CAJA.x + MAPA_CAJA.w || y < MAPA_CAJA.y || y > MAPA_CAJA.y + MAPA_CAJA.h) return toast('Tocá dentro del barrio', 'pin');
  const lugar = typeof mvLugarDe === 'function' ? mvLugarDe(p.x, p.y) : '';
  RondaEd.tocar(x, y, lugar);
}, true);
/* Fuera del editor, tocar un punto en el mapa abre su ficha (con la foto). */
document.addEventListener('click', e => {
  if (RondaEd.activo) return;
  const pin = e.target.closest && e.target.closest('.mapa-card .ronda-capa [data-rp]'); if (!pin) return;
  e.stopPropagation(); if (Date.now() - mapaMovido < 350) return;
  const v = rondaEnVivo(), i = +pin.dataset.rp, pt = v.pts[i]; if (!pt) return;
  const at = v.mapa && v.mapa.pasados.get(i + 1);
  hoja(`Punto ${i + 1} · ${pt.nombre}`, `${pt.foto ? `<img class="rm-foto-grande" src="${pt.foto}" alt="Foto del lugar del punto ${i + 1}">` : `<p class="muted small">${I('camera')} Todavía no tiene foto${esAdmin() ? ': agregala en "Editar recorrido".' : '.'}</p>`}
    ${rondaBotonGrande(pt.fg, i + 1, pt.nombre)}
    <p style="margin:10px 2px 4px"><b>${esc(pt.lugar || 'En el plano')}</b></p>
    <p class="muted small" style="margin:0 2px">${at ? `${I('check')} En esta ronda lo leyó a las ${hora(at)} h.` : v.curso ? 'En esta ronda todavía falta leerlo.' : 'Sin ronda en curso.'}</p>`);
}, true);
document.addEventListener('input', e => {
  const i = e.target && e.target.dataset && e.target.dataset.rondaNom; if (i === undefined || !RondaEd.pts[+i]) return;
  RondaEd.pts[+i].nombre = e.target.value;
});
document.addEventListener('change', async e => {
  const inp = e.target; if (!inp || inp.dataset.rondaFoto === undefined) return;
  const f = inp.files && inp.files[0], i = +inp.dataset.rondaFoto; if (!f) return;
  try { const { chica, grande } = await rondaFotoDoble(f); RondaEd.guardarHist(); const gid = 'g' + uid(); RondaEd.grandes.set(gid, grande); Object.assign(RondaEd.pts[i], { foto:chica, _g:gid }); RondaEd.pintar(); toast(`Foto lista: ${pesoTexto(Math.round(chica.length * 0.75))} en la app (la grande, solo a pedido)`, 'camera'); }
  catch(err){ toast('No se pudo usar esa foto', 'alert'); }
});
/* ---------- LAS FOTOS: CHICAS EN LA APP, GRANDES SOLO A PEDIDO (17-10-2026) ----------
   Claudio: "que las fotos viajen en la app con bajo uso de datos, pequeñas,
   y solo en grande si alguien la quiere bajar a su dispositivo".
   · La CHICA (420 px, calidad baja, unos 10 a 25 KB) es la que va con el
     punto: la ven la garita, la Administración, la supervisión y la baja una
     sola vez el teléfono del policía con su guía.
   · La GRANDE (1280 px, unos 100 a 250 KB) se guarda aparte, en
     /ronda/fotos/<clave larga al azar>, que NO baja con nada: solo la trae
     quien toca "Bajar la foto en grande", y queda guardada en SU equipo.
     Se borra de la base cuando la Administración cambia o quita la foto.
   Idea de browser-image-compression (1.7k★, MIT) y de la carga progresiva
   de BlurImageView (1.3k★): primero lo liviano, lo pesado a pedido. Código
   propio (comprimir y achicarDato, js/core.js). */
const RONDA_CHICA = 420, RONDA_GRANDE = 1280;
const rondaFotoChica = f => comprimir(f, RONDA_CHICA, .5);
async function rondaFotoDoble(f){
  const grande = await comprimir(f, RONDA_GRANDE, .72);
  const chica = await achicarDato(grande, RONDA_CHICA, .5);
  return { chica: chica || await rondaFotoChica(f), grande };
}
const rondaNube = () => typeof Nube !== 'undefined' && Nube.activa() && !!Nube.db;
/* Guarda la grande (en este equipo y en la base) y devuelve su clave. */
function rondaGrandeGuardar(grande){
  if (!grande) return '';
  const k = rondaToken();
  Fotos.poner('rg-' + k, grande);
  if (rondaNube()) Nube.db.ref('ronda/fotos/' + k).set({ d:grande, at:firebase.database.ServerValue.TIMESTAMP }).catch(e => { console.warn('Foto grande del punto', e && e.message); toast('La foto grande no se pudo subir (falta publicar las reglas nuevas de Firebase): la chica sí quedó.', 'alert'); });
  return k;
}
function rondaGrandeBorrar(k){
  if (!k) return;
  Fotos.borrar('rg-' + k);
  if (rondaNube()) Nube.db.ref('ronda/fotos/' + k).remove().catch(() => {});
}
async function rondaGrandeBajar(k){
  const local = await Fotos.sacar('rg-' + k, false); if (local) return local;
  if (!rondaNube()) return null;
  const v = (await Nube.db.ref('ronda/fotos/' + k).once('value')).val();
  if (v && v.d){ Fotos.poner('rg-' + k, v.d); return v.d; }
  return null;
}
const rondaBotonGrande = (k, n, nombre) => k ? `<button type="button" class="btn btn-sm btn-sec rm-bajar" data-a="ronda-foto-bajar" data-k="${esc(k)}" data-n="${n}" data-nom="${esc(nombre || '')}">${I('download')}Bajar la foto en grande</button>` : '';
A['ronda-foto-bajar'] = async el => {
  const k = el.dataset.k; if (!k) return;
  el.disabled = true; const antes = el.innerHTML; el.innerHTML = `${I('download')}Bajando…`;
  try {
    const d = await rondaGrandeBajar(k);
    if (!d) throw new Error('sin foto');
    const b = await (await fetch(d)).blob();
    const nom = `punto-${el.dataset.n || ''}-${String(el.dataset.nom || 'ronda').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}.${(b.type.split('/')[1] || 'jpg').replace('jpeg', 'jpg')}`;
    const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = nom; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    toast(`Foto en grande guardada en este equipo (${pesoTexto(b.size)})`, 'download');
  } catch(e){ toast('No se pudo bajar la foto en grande. Probá con internet.', 'alert'); }
  el.disabled = false; el.innerHTML = antes;
};

/* ---------- compartir el plano del recorrido como imagen ---------- */
function rondaPlanoPlano(pts){
  const lotes = Object.values(MAPA_LOTES).map(g => `<rect x="${(g.x - g.w / 2).toFixed(1)}" y="${(g.y - g.d / 2).toFixed(1)}" width="${g.w.toFixed(1)}" height="${g.d}" rx="3" fill="#dfe8e6" transform="rotate(${g.ang.toFixed(1)} ${g.x} ${g.y})"/>`).join('');
  const calles = MAPA_CALLES.filter(c => !c.afuera).map(c => `<polyline points="${mapaPuntos(c.pts)}" fill="none" stroke="#b7c6c3" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>`).join('');
  const tramos = rondaTramos(pts), [gx, gy] = MAPA_GARITA, giro = mapaGiradoYa ? ` transform="rotate(180 ${MAPA_CENTRO[0]} ${MAPA_CENTRO[1]})"` : '';
  const ruta = tramos.map(t => `<path d="${rgD(t)}" fill="none" stroke="#1d4ed8" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>`).join('');
  const pins = pts.map((pt, i) => { const [x, y] = mapaP(pt.x, pt.y); return `<circle cx="${x}" cy="${y}" r="13" fill="#1d4ed8" stroke="#fff" stroke-width="3.5"/><text x="${x}" y="${y + 5}" font-family="Arial" font-weight="700" font-size="14" fill="#fff" text-anchor="middle">${i + 1}</text>`; }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${MAPA_CAJA.x} ${MAPA_CAJA.y} ${MAPA_CAJA.w} ${MAPA_CAJA.h}" width="1030" height="420">
    <rect x="0" y="0" width="1300" height="700" fill="#f4f8f7"/><g${giro}><path d="M-200,430 L30,420 L140,394 L250,364 L340,344 L470,353 L505,372 L530,396 L600,404 L700,438 L820,462 L940,484 L1000,506 L1300,520 L1300,800 L-200,800 Z" fill="#bfe3f2"/></g>
    ${calles}${lotes}${ruta}<g transform="translate(${gx} ${gy})"><circle r="10" fill="#0b3c47"/><text y="-15" font-family="Arial" font-weight="700" font-size="14" fill="#0b3c47" text-anchor="middle">GARITA</text></g>${pins}</svg>`;
}
A['ronda-compartir'] = () => {
  const pts = rondaPuntosMapa(); if (pts.length < 2) return;
  const img = new Image();
  img.onload = async () => {
    const c = document.createElement('canvas'); c.width = 1030; c.height = 470; const x = c.getContext('2d');
    x.fillStyle = '#fff'; x.fillRect(0, 0, 1030, 470); x.drawImage(img, 0, 0, 1030, 420);
    x.fillStyle = '#0b3c47'; x.font = '700 22px Manrope, Arial, sans-serif';
    x.fillText(`Ronda del policía · ${pts.map((p, i) => (i + 1) + '. ' + p.nombre).join('  ')}`.slice(0, 120), 16, 452);
    c.toBlob(async b => {
      const archivo = new File([b], 'recorrido-ronda.png', { type:'image/png' });
      try { if (navigator.canShare && navigator.canShare({ files:[archivo] })) { await navigator.share({ files:[archivo], title:'Recorrido de la ronda' }); return; } } catch(e){ if (e && e.name === 'AbortError') return; }
      const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'recorrido-ronda.png'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      toast('Plano del recorrido descargado', 'download');
    }, 'image/png');
  };
  img.onerror = () => toast('No se pudo armar la imagen', 'alert');
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(rondaPlanoPlano(pts));
};

/* ---------- lo que ven los vecinos al tocar las caritas de la guardia ---------- */
function rondaParaVecinos(g){
  if (veGarita()){ const v = rondaEnVivo(); return v.pts.length ? { ...v, vivo:true, meta:rondaMeta() } : null; }
  const d = rondaDePublico(g && g.ronda); return d && d.pts.length ? { ...d, p:g.policia ? {} : null } : null;
}
function rondaSeccionGuardia(g){
  const d = rondaParaVecinos(g); if (!d) return '';
  rmUltimo = rondaSeccionInterior(d);
  return `<section class="rm-vecinos" id="rmVecinos">${rmUltimo}</section>`;
}
function rondaSeccionInterior(d){
  const meta = d.meta || rondaMeta();
  return `<div class="rm-v-cab"><span class="rm-v-ic">${I('shield')}</span><div class="grow"><b>La ronda del policía</b><small>${d.p ? `Meta de la noche: ${meta} rondas completas por los ${d.pts.length} puntos` : 'Ahora no hay policía de servicio · así es el recorrido'}</small></div>${d.p && !d.demora ? `<span class="rm-envivo"><i></i>En vivo</span>` : ''}</div>
    <div class="rm-mini-caja">${rondaMiniSVG(d, { vivo:!!d.vivo, sim:!d.p })}</div>
    ${d.p ? `<p class="rm-ley"><span><i class="rm-l-ok"></i>Ya leído</span><span><i class="rm-l-falta"></i>Falta (titila)</span>${d.vivo ? `<span><i class="rm-l-gorra"></i>Último punto</span>` : ''}</p>${rondaAnillos(d, meta)}` : ''}
    <p class="muted tiny" style="margin:8px 2px 0">${I('lock')} ${d.vivo ? 'Lo ves en vivo porque tenés el libro de guardia.' : d.demora ? `Por seguridad, la ronda que está en curso se ve con ${d.demora} minutos de demora y sin el nombre del policía.` : 'Se actualiza solo cada vez que el policía lee un QR. No se ve su nombre.'}</p>`;
}
/* Con la hoja de la guardia abierta, la ronda se redibuja sola cuando llega
   un punto leído (solo si cambió algo, así la simulación no se reinicia). */
let rmVT = 0, rmUltimo = '';
Store.alCambiar(() => { clearTimeout(rmVT); rmVT = setTimeout(() => {
  const el = document.getElementById('rmVecinos'); if (!el || typeof guardiaAhora !== 'function') return;
  const d = rondaParaVecinos(guardiaAhora()); if (!d) return;
  const html = rondaSeccionInterior(d); if (html === rmUltimo) return;
  rmUltimo = html; el.innerHTML = html;
}, 350); });

/* ---------- la guía del teléfono del policía (con las fotos) ---------- */
const rondaToken = () => { const a = new Uint8Array(20); crypto.getRandomValues(a); return [...a].map(b => "abcdefghijkmnpqrstuvwxyz23456789"[b % 32]).join(""); };
function rondaGuiaArmar(vence){
  return { vence, meta:rondaMeta(), pts: puntosActivos().map((pt, i) => ({ n:i + 1, id:pt.id, nombre:pt.nombre, lugar:pt.lugar || '', ...(isFinite(pt.x) ? { x:Math.round(pt.x), y:Math.round(pt.y) } : {}), ...(pt.foto ? { f:pt.foto } : {}), ...(pt.foto && pt.fg ? { fg:pt.fg } : {}) })) };
}
/* LA GUÍA TAMBIÉN POR EL CÓDIGO (18-10-2026). Claudio probó la ronda sin
   abrir el enlace de la tarjeta (el WhatsApp no se abrió desde la PC): el
   policía puso el código a mano en el primer QR y registraba bien, pero su
   teléfono no tenía la guía, así que nunca le mostraba la foto del próximo
   punto. Ahora la guía se guarda además con una clave que sale del código
   de 6 números: con el enlace O con el código, el teléfono baja la guía. La
   clave es un resumen (SHA-256) del código, no el código mismo, y se borra
   con la salida igual que la otra. */
async function rondaClaveCodigo(c){
  if (!/^\d{6}$/.test(String(c || '')) || !(window.crypto && crypto.subtle)) return '';
  const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('bhc-ronda-guia:' + c));
  return 'c' + [...new Uint8Array(b)].slice(0, 12).map(x => x.toString(16).padStart(2, '0')).join('');
}
function rondaGuiaPublicar(token, vence, codigo){
  if (typeof Nube === 'undefined' || !Nube.activa() || !Nube.db) return;
  const g = rondaGuiaArmar(vence), poner = t => t && Nube.db.ref('ronda/guia/' + t).set(g).catch(e => console.warn('Guía de la ronda', e && e.message));
  poner(token);
  if (codigo) rondaClaveCodigo(codigo).then(poner).catch(() => {});
}
function rondaGuiaBorrar(token, codigo){
  if (typeof Nube === 'undefined' || !Nube.activa() || !Nube.db) return;
  const sacar = t => t && Nube.db.ref('ronda/guia/' + t).remove().catch(() => {});
  sacar(token);
  if (codigo) rondaClaveCodigo(codigo).then(sacar).catch(() => {});
}
/* Cuando la Administración cambia el recorrido, se actualizan las guías de los policías de servicio. */
function rondaGuiasAlDia(){ aLista(Store.s.rondaCodigos).filter(c => c && c.vence > Date.now()).forEach(c => rondaGuiaPublicar(c.g, c.vence, c.id)); }
const RondaGuia = {
  KEY:'bhc.ronda.guia',
  leer(){ try { const g = JSON.parse(localStorage.getItem(this.KEY) || 'null'); return g && g.vence > Date.now() ? g : null; } catch(e){ return null; } },
  guardar(g){ try { localStorage.setItem(this.KEY, JSON.stringify(g)); return true; } catch(e){ return false; } },
  async bajar(token, codigo){
    if (typeof Nube !== 'undefined' && Nube.activa() && Nube.db){
      if (!token) token = await rondaClaveCodigo(codigo);
      if (!token) return null;
      const snap = await Nube.db.ref('ronda/guia/' + token).once('value'); const v = snap.val();
      return v ? { ...v, pts: aLista(v.pts).filter(Boolean) } : null;
    }
    /* Sin la nube (prueba en esta computadora): se arma de los puntos guardados acá. */
    return aLista(Store.s.puntos).length ? rondaGuiaArmar(Date.now() + CODIGO_VIGENCIA) : null;
  },
};
const rondaGuiaPeso = g => pesoTexto(Math.round(JSON.stringify(g || {}).length));
function rondaGuiaHTML(g, { hechos = [] } = {}){
  const pts = aLista(g && g.pts); if (!pts.length) return '';
  const conLugar = pts.filter(p => isFinite(p.x)).map(p => ({ ...p, id:'n' + p.n, nombre:p.nombre, foto:p.f }));
  const pas = new Map(hechos.map(h => [h.n, h.at])), prox = (rondaProximo(g, hechos).p || {}).n;
  return `<div class="rm-guia">
    ${conLugar.length > 1 ? `<div class="rm-mini-caja">${rondaMiniSVG({ pts:conLugar, curso: pas.size ? { pasados:pas } : null })}</div>` : ''}
    <ol class="rm-guia-lista">${pts.map(p => `<li class="${pas.has(p.n) ? 'hecho' : p.n === prox ? 'prox' : ''}"><span class="rm-gn">${pas.has(p.n) ? '✓' : p.n}</span>
      ${p.f ? `<img src="${p.f}" alt="Foto del lugar del punto ${p.n}" loading="lazy">` : `<span class="rm-gsin">${I('camera')}</span>`}
      <span class="rm-gt"><b>${esc(p.nombre)}</b><small>${esc(p.lugar || '')}${pas.has(p.n) ? ` · pasaste ${hora(pas.get(p.n))} h` : ''}</small></span></li>`).join('')}</ol>
  </div>`;
}
/* Los pasos que este teléfono registró en la ronda actual (para tildar la guía). */
const RondaLocal = {
  KEY:'bhc.ronda.pasos',
  leer(){ try { return JSON.parse(localStorage.getItem(this.KEY) || '[]').filter(x => x && Date.now() - x.at < 90 * MIN); } catch(e){ return []; } },
  /* Anota el punto leído. Si ese punto ya estaba en la ronda (o la ronda ya
     estaba completa), empieza una ronda nueva en este teléfono. */
  anotar(id, g){
    let hoy = this.leer();
    const ids = aLista(g && g.pts).map(p => p.id).filter(Boolean);
    const completa = ids.length && ids.every(i => hoy.some(x => x.id === i));
    if (completa || hoy.some(x => x.id === id)) hoy = [];
    hoy.push({ id, at:Date.now() });
    try { localStorage.setItem(this.KEY, JSON.stringify(hoy)); } catch(e){}
    return hoy;
  },
};
/* LEER EL QR SIN SEÑAL (pedido de Claudio, 18-10-2026): "el paso queda
   guardado en el teléfono y se manda solo cuando vuelve la señal; sirve
   para el perímetro o la calle oscura". Idea de serviceworker-cookbook
   (2.9k★, MIT): solo la idea, el código es propio.
   · Sin señal (o si la base no contesta en 8 segundos), el paso se guarda
     en ESTE teléfono con la hora exacta en que lo leyó (campo "t") y el
     policía sigue al próximo punto igual.
   · Se manda solo, en orden, apenas vuelve la señal: con la página abierta,
     al abrir otro QR o al volver a tocar el enlace de su tarjeta.
   · La base anota igual su propia hora ("at", la del servidor); la garita
     usa "t" solo si el paso llegó tarde (más de 2 minutos y menos de 6
     horas después): así ve la hora real de cada punto (pasoAt, js/v-inicio.js).
   · Si la base lo rechaza al mandarlo (el código venció, o ya había
     llegado), se descarta y se le avisa. Se guarda hasta 14 horas. */
const RondaCola = {
  KEY:'bhc.ronda.cola',
  leer(){ try { return JSON.parse(localStorage.getItem(this.KEY) || '[]').filter(x => x && x.id && Date.now() - x.t < CODIGO_VIGENCIA); } catch(e){ return []; } },
  escribir(l){ try { localStorage.setItem(this.KEY, JSON.stringify(l)); return true; } catch(e){ return false; } },
  sumar(x){ const l = this.leer(); if (!l.some(y => y.id === x.id)) l.push(x); return this.escribir(l); },
  sacar(id){ this.escribir(this.leer().filter(y => y.id !== id)); },
  mandando:false,
  /* Manda lo guardado, de a uno y en orden. Devuelve cuántos salieron y cuántos rechazó la base. */
  async mandar(){
    if (this.mandando) return { ok:0, no:0, quedan:this.leer().length };
    this.mandando = true; let ok = 0, no = 0;
    try {
      for (const x of this.leer()){
        if (navigator.onLine === false) break;
        const r = await rondaEscribirPaso(x);
        if (r === 'ok'){ ok++; this.sacar(x.id); }
        else if (r === 'no'){ no++; this.sacar(x.id); }
        else break;
      }
    } finally { this.mandando = false; }
    return { ok, no, quedan:this.leer().length };
  },
};
/* Escribe un paso en la base: 'ok', 'no' (la base no lo acepta) o 'sin' (sin señal). */
async function rondaEscribirPaso(x){
  if (navigator.onLine === false) return 'sin';
  try {
    if (typeof Nube !== 'undefined' && Nube.activa() && Nube.db){
      const espera = new Promise((_, mal) => setTimeout(() => mal(new Error('SIN_SENAL')), 8000));
      await Promise.race([Nube.db.ref('staff/pasos/' + x.id).set({ id:x.id, punto:x.punto, k:x.k, c:x.c, nombre:x.nombre, t:x.t, at:firebase.database.ServerValue.TIMESTAMP }), espera]);
    } else if (!/[?&]local\b/.test(location.search)){
      /* La app real abierta sin señal: el programa de la base no llegó a cargar. Queda guardado. */
      return 'sin';
    } else {
      /* Sin la nube (prueba en esta computadora): se valida contra lo guardado acá. */
      const pt = aLista(Store.s.puntos).find(z => z.id === x.punto), cod = aLista(Store.s.rondaCodigos).find(z => z && z.id === x.c && z.vence > Date.now());
      if (!pt || pt.k !== x.k || pt.activo === false || !cod) throw new Error('PERMISSION_DENIED');
      if (!aLista(Store.s.pasos).some(z => z.id === x.id)) Store.cambiar(s => { s.pasos.unshift({ id:x.id, punto:x.punto, k:x.k, c:x.c, nombre:cod.nombre, t:x.t, at:Date.now() }); });
    }
    return 'ok';
  } catch(e){ return /permission/i.test(String(e && e.message)) ? 'no' : 'sin'; }
}
const rondaIdPaso = () => (typeof Nube !== 'undefined' && Nube.activa() && Nube.db) ? Nube.db.ref('staff/pasos').push().key : 'p' + uid();
/* El cartelito de lo que está guardado sin mandar (en la pantalla del policía). */
function rondaColaAviso(){
  const n = RondaCola.leer().length; if (!n) return '';
  return `<div class="rm-cola" role="status">${I('clock')}<span><b>${n === 1 ? 'Tenés 1 paso guardado en tu teléfono' : `Tenés ${n} pasos guardados en tu teléfono`}</b>Se ${n === 1 ? 'manda' : 'mandan'} solo${n === 1 ? '' : 's'} cuando vuelva la señal. No hace falta que hagas nada.</span></div>`;
}
/* Mandar lo guardado y avisar. Con la página del policía abierta, se reintenta solo. */
async function rondaColaVaciar(){
  if (!RondaCola.leer().length) return;
  const r = await RondaCola.mandar();
  document.querySelectorAll('#puntoPublico .rm-cola').forEach(el => { el.outerHTML = rondaColaAviso(); });
  if (r.ok) toast(r.ok === 1 ? 'Volvió la señal: se mandó el paso que estaba guardado' : `Volvió la señal: se mandaron los ${r.ok} pasos guardados`, 'check');
  if (r.no) toast(`${plural(r.no, 'paso guardado no se aceptó', 'pasos guardados no se aceptaron')} (el código venció). Avisá a la garita.`, 'alert');
}
window.addEventListener('online', () => setTimeout(rondaColaVaciar, 1500));
setInterval(() => { if (document.getElementById('puntoPublico') && navigator.onLine !== false) rondaColaVaciar(); }, 20000);

function rondaHechosLocales(g){
  return RondaLocal.leer().map(x => { const p = aLista(g && g.pts).find(z => z.id === x.id || z.n === x.n); return p ? { n:p.n, at:x.at } : null; }).filter(Boolean);
}
/* EL PRÓXIMO PUNTO, CON SU FOTO (pedido de Claudio, 17-10-2026): "que el
   enlace que le envía la garita al policía le avise cuál sigue y le muestre
   automáticamente la foto de dónde está colocado el QR". El próximo es el
   primero que falta DESPUÉS del último que leyó (si saltó uno, se le avisa);
   si ya leyó todos, la ronda está completa y la próxima empieza por el 1.
   La foto es la chica que ya está guardada en su teléfono: no gasta datos. */
function rondaProximo(g, hechos){
  const pts = aLista(g && g.pts).slice().sort((a, b) => a.n - b.n); if (!pts.length) return { p:null, completa:false, salteados:[] };
  const ya = new Set(hechos.map(h => h.n));
  if (pts.every(p => ya.has(p.n))) return { p:pts[0], completa:true, salteados:[] };
  const ult = hechos.length ? hechos.reduce((a, b) => (b.at >= a.at ? b : a)).n : 0;
  const p = pts.find(x => x.n > ult && !ya.has(x.n)) || pts.find(x => !ya.has(x.n));
  return { p, completa:false, salteados: pts.filter(x => x.n < ult && !ya.has(x.n)) };
}
function rondaProximoHTML(g, hechos, { inicio = false } = {}){
  const { p, completa, salteados } = rondaProximo(g, hechos); if (!p) return '';
  const total = aLista(g.pts).length, k = new Set(hechos.map(h => h.n)).size;
  const tit = completa ? `¡Ronda completa! (${total} de ${total})` : inicio || !hechos.length ? 'Empezá por el punto' : `Seguí al punto (llevás ${k} de ${total})`;
  return `<div class="rm-prox${completa ? ' completa' : ''}" role="status">
    <small>${completa ? I('check') : I('right')} ${tit}</small>
    ${completa ? '<p class="rm-prox-sub">La próxima ronda empieza de nuevo por el punto 1:</p>' : ''}
    ${p.f ? `<img class="rm-prox-foto" src="${p.f}" alt="Foto del lugar donde está el QR del punto ${p.n}">` : `<span class="rm-prox-sin">${I('camera')}<span>Este punto todavía no tiene foto</span></span>`}
    <div class="rm-prox-pie"><span class="rm-prox-n">${p.n}</span><span class="grow"><b>${esc(p.nombre)}</b><small>${esc(p.lugar || '')}</small></span></div>
    ${p.fg ? rondaBotonGrande(p.fg, p.n, p.nombre) : ''}
    ${salteados.length ? `<p class="rm-prox-falta">${I('alert')} Te ${salteados.length > 1 ? 'faltaron los puntos' : 'faltó el punto'} ${salteados.map(x => x.n).join(', ')}: si podés, volvé a leer${salteados.length > 1 ? 'los' : 'lo'} para que la ronda quede completa.</p>` : ''}
  </div>`;
}
const rondaVibrar = () => { try { navigator.vibrate && navigator.vibrate([120, 80, 120]); } catch(e){} };

/* Desde Turnos: ver el recorrido y la meta de rondas por noche. */
A['ronda-ver'] = () => { rondaCapaOn = true; rondaSimHasta = Date.now() + rondaSimMs(); abrir('mapa'); };
F['rondas-meta'] = d => {
  if (!esAdmin()) return;
  const n = Math.max(1, Math.min(8, Math.round(+d.meta) || RONDA_META_BASE));
  const dem = [0, 5, 10, 15].includes(+d.demora) ? +d.demora : Math.round(rondaDemora() / MIN);
  Store.cambiar(s => { s.config.rondasMeta = n; s.config.rondaDemoraVecinos = dem; auditar(s, 'Cambió la ronda del policía', `${n} rondas completas por noche · vecinos: ${dem ? `con ${dem} min de demora` : 'en vivo'}`); });
  toast(`Meta: ${plural(n, 'ronda completa', 'rondas completas')} por noche · vecinos ${dem ? `con ${dem} min de demora` : 'en vivo'}`, 'check'); refrescar();
};
