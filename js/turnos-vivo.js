/* =========================================================
   TURNOS: LA NOCHE DEL POLICÍA Y EL CALENDARIO DE LA GARITA
   (rediseño, pedido de Claudio, 21-10-2026)

   "Rediseñá con un diseño innovador, interactivo y animado desde Policía
   nocturna hasta Policía contratada este mes. Y Últimos turnos, que es una
   lista larguísima y aburrida: que se elijan por día, mes y año."

   1. POLICÍA NOCTURNA. Un cielo de noche con la luna que cruza de la hora
      de entrada a la de salida, el estado de ahora y la semana. Debajo,
      "Las noches": una tira con las últimas 14 noches, cada una con una
      bolita por ronda (verde completa con QR, ámbar incompleta, gris
      anotada por la garita). Tocar una noche abre su detalle: cada policía
      con su barra de servicio y sus rondas encima, la meta y la constancia.
      Las rondas se agrupan por NOCHE (21:59 del lunes a 06:00 del martes) y
      no por día de calendario: así el lunes no suma las rondas de la
      madrugada del domingo con las de la noche del lunes (la confusión de
      las "7 rondas del lunes 19").
   2. POLICÍA CONTRATADA DEL MES (solo la Administración): mes que se cambia
      con flechas, números que suben contando y, por policía, un renglón de
      cuadraditos con cada noche del mes coloreada por la meta.
   3. ÚLTIMOS TURNOS → CALENDARIO: año, mes y un calendario con cada día
      pintado según cuántos turnos hubo (con un punto rojo si hubo un
      incidente y una lunita si vino el policía). Al tocar un día: la línea
      de 0 a 24 h con cada turno y el policía dibujados, y una tarjeta por
      turno con el parte. Lo de más de 60 días se trae de la base recién
      cuando se elige ese mes.
   Ideas de cal-heatmap (3,1k★, MIT) y react-calendar-timeline (2,1k★, MIT):
   solo la idea, código propio.
   ========================================================= */
'use strict';

/* La noche a la que pertenece un momento: el ingreso de las 21:59 del
   lunes y el de la 1 de la mañana del martes son la noche del lunes. */
const nocheDe = ts => isoDe(new Date(ts - 6 * HORA));
const MESES_TV = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const nocheTitulo = iso => { const a = fechaDe(iso), b = fechaDe(sumarDias(iso, 1));
  return `Noche del ${DIAS_L[a.getDay()]} ${a.getDate()}${a.getMonth() !== b.getMonth() ? ' de ' + MESES_TV[a.getMonth()] : ''} al ${DIAS_L[b.getDay()]} ${b.getDate()} de ${MESES_TV[b.getMonth()]}`; };
/* Un nombre de una sola palabra ("Rojo") no alcanza para la constancia. */
const nombreIncompleto = n => String(n || '').trim().split(/\s+/).filter(Boolean).length < 2;

/* Qué clase de ronda es: solo la completa con QR cuenta para la meta. */
function claseRonda(r){
  if (!r.fin) return 'curso';
  if (r.conQR && r.total && r.qr.length >= r.total && !r.incompleta) return 'ok';
  if (r.conQR || r.incompleta) return 'inc';
  return 'gar';
}
const RONDA_TXT = { ok:'Completa con QR', inc:'Incompleta', gar:'Anotada por la garita', curso:'En curso' };
const completasDe = sv => sv.rondas.filter(r => claseRonda(r) === 'ok').length;

const TV = { noche:'', mes:'', dia:'', extra:{}, trayendo:'' };

/* ---------- 1. el cielo de la noche ---------- */
function cieloNoche(){
  const n = nochePolicia(), ahora = Date.now();
  const f = Math.min(1, Math.max(0, (ahora - n.desde) / (n.hasta - n.desde)));
  /* La luna va por un arco: x de 8 a 92 %, y baja en las puntas. */
  const x = 8 + f * 84, y = 64 - Math.sin(f * Math.PI) * 46;
  const ps = serviciosPolicia().filter(sv => !sv.sale);
  const meta = typeof rondaMeta === 'function' ? rondaMeta() : 3;
  const estrellas = [[12, 18], [24, 40], [33, 12], [47, 30], [58, 14], [66, 42], [74, 20], [85, 34], [92, 12], [40, 52], [18, 60], [80, 58]]
    .map(([a, b], i) => `<i style="left:${a}%;top:${b}%;--d:${(i * .37 % 2.4).toFixed(2)}s"></i>`).join('');
  const estado = ps.length
    ? ps.map(sv => { const c = completasDe(sv), rc = sv.rondas.find(r => !r.fin);
      return `<div class="nc-ag"><span class="nc-ini" style="--c:${colorDe(sv.nombre)}">${esc(inicialesDe(sv.nombre))}</span><span class="grow"><b>${esc(sv.nombre)}</b><small>${esc(pnCargoMat(sv, ' · '))}desde las ${hora(sv.entra)} h${rc ? ' · <em>en ronda ahora</em>' : ''}</small></span>
        <span class="nc-meta" style="--p:${Math.min(1, c / meta)}" title="${c} de ${meta} rondas completas"><b>${c}</b><small>de ${meta}</small></span></div>`; }).join('')
    : `<p class="nc-nadie">${n.ahora ? `${I('alert')} En horario y todavía no se registró su ingreso.` : `${I('clock')} Empieza en ${n.falta >= HORA ? Math.floor(n.falta / HORA) + ' h ' : ''}${Math.round(n.falta % HORA / MIN)} min.`}</p>`;
  return `<div class="nc-cielo ${n.ahora ? 'on' : ''}" style="--x:${x.toFixed(1)}%;--y:${y.toFixed(1)}%;--f:${f.toFixed(3)}">
    <div class="nc-estrellas" aria-hidden="true">${estrellas}</div>
    <svg class="nc-arco" viewBox="0 0 100 70" preserveAspectRatio="none" aria-hidden="true"><path d="M8 64 Q50 -28 92 64" pathLength="1"/><path class="nc-hecho" d="M8 64 Q50 -28 92 64" pathLength="1"/></svg>
    <span class="nc-luna" aria-hidden="true">${I('moon')}</span>
    <div class="nc-cab"><small>Policía nocturna · ${esc(n.etiqueta)}</small><b>${horarioNocheTxt(n)}</b><em>${n.ahora ? `En curso · ${Math.round(f * 100)} % de la noche` : 'Fuera de horario'}</em></div>
    <div class="nc-horas"><span>${I('moon')}${hora(n.desde)}</span><span>${hora(n.hasta)}${I('sunrise')}</span></div>
  </div>
  <div class="nc-estado">${estado}</div>`;
}

/* ---------- las noches: tira de 14 y el detalle de la elegida ---------- */
function tiraNoches(svs){
  const meta = typeof rondaMeta === 'function' ? rondaMeta() : 3, hoyN = nocheDe(Math.max(Date.now(), nochePolicia().desde));
  const dias = Array.from({ length:14 }, (_, i) => sumarDias(hoyN, i - 13));
  if (!TV.noche || !dias.includes(TV.noche)){ const con = dias.filter(d => svs.some(sv => nocheDe(sv.entra) === d)); TV.noche = con.at(-1) || hoyN; }
  return `<div class="nc-tira" role="tablist" aria-label="Las últimas 14 noches">${dias.map((d, i) => {
    const ss = svs.filter(sv => nocheDe(sv.entra) === d), rs = ss.flatMap(sv => sv.rondas), c = ss.reduce((k, sv) => k + completasDe(sv), 0), fd = fechaDe(d);
    const tono = !ss.length ? 'vacia' : c >= meta ? 'meta' : c ? 'media' : 'cero';
    return `<button class="nc-n ${tono}${d === TV.noche ? ' sel' : ''}${d === hoyN ? ' hoy' : ''}" role="tab" aria-selected="${d === TV.noche}" data-a="tv-noche" data-v="${d}" style="--i:${i}"
      aria-label="${esc(nocheTitulo(d))}: ${ss.length ? `${plural(rs.length, 'ronda')}, ${c} completas` : 'sin policía'}">
      <small>${DIAS[fd.getDay()]}</small><b>${fd.getDate()}</b>
      <span class="nc-pila">${rs.slice(0, 8).map(r => `<i class="r-${claseRonda(r)}"></i>`).join('')}${rs.length > 8 ? '<em>+' + (rs.length - 8) + '</em>' : ''}</span>
      <span class="nc-c">${ss.length ? `${c}/${meta}` : '—'}</span></button>`; }).join('')}</div>
    <div class="nc-ley"><span><i class="r-ok"></i>Completa con QR</span><span><i class="r-inc"></i>Incompleta</span><span><i class="r-gar"></i>Anotada por la garita</span><span class="muted">Solo la completa con QR cuenta para la meta de ${meta}.</span></div>`;
}
function servicioEnNoche(sv){
  const meta = typeof rondaMeta === 'function' ? rondaMeta() : 3, fin = sv.sale || Date.now(), tot = Math.max(MIN, fin - sv.entra), c = completasDe(sv), cs = sv.constancia;
  const pos = t => Math.max(0, Math.min(100, (t - sv.entra) / tot * 100)).toFixed(1);
  const cuenta = { ok:0, inc:0, gar:0, curso:0 }; sv.rondas.forEach(r => cuenta[claseRonda(r)]++);
  const puedeNombre = (esAdmin() || esGuardia());
  return `<article class="nc-sv" style="--c:${colorDe(sv.nombre)}">
    <header><span class="nc-ini">${esc(inicialesDe(sv.nombre))}</span><div class="grow"><b>${esc(sv.nombre)}</b><small>${esc(pnCargoMat(sv, ' · '))}${hora(sv.entra)} → ${sv.sale ? hora(sv.sale) + ' h' : 'sigue de servicio'} · ${cpDur(tot)}</small>
      ${nombreIncompleto(sv.nombre) ? `<span class="nc-falta">${I('alert')} Falta el apellido: la constancia sale solo con "${esc(sv.nombre)}".${puedeNombre ? ` <button class="link" data-a="pn-nombre" data-id="${esc(sv.id)}">Completar el nombre</button>` : ''}</span>` : ''}</div>
      <span class="nc-meta grande" style="--p:${Math.min(1, c / meta)}"><b>${c}</b><small>de ${meta}</small></span></header>
    <div class="nc-linea" role="img" aria-label="Servicio de ${hora(sv.entra)} a ${sv.sale ? hora(sv.sale) : 'ahora'} con ${plural(sv.rondas.length, 'ronda')}">
      ${sv.rondas.map((r, i) => `<i class="r-${claseRonda(r)}" style="left:${pos(r.inicio)}%;width:${Math.max(2.5, pos(r.fin || Date.now()) - pos(r.inicio)).toFixed(1)}%;--i:${i}"><b>${i + 1}</b></i>`).join('')}
      <span>${hora(sv.entra)}</span><span>${sv.sale ? hora(sv.sale) : 'ahora'}</span></div>
    <ol class="nc-rondas">${sv.rondas.map((r, i) => { const k = claseRonda(r);
      return `<li class="r-${k}"><span class="nc-rn">${i + 1}</span><span class="grow"><b>${hora(r.inicio)}${r.fin ? '–' + hora(r.fin) + ' · ' + minutos(r.inicio, r.fin) + ' min' : ' · en curso'}</b>
        <small>${RONDA_TXT[k]}${r.conQR && r.total ? ` · ${r.qr.length}/${r.total} QR` : ''}${aLista(r.faltan).length && k !== 'ok' ? ' · faltó ' + esc(r.faltan.join(', ')) : ''}${k === 'gar' ? ' · no cuenta para la meta' : ''}${r.motivo ? ' · ' + esc(r.motivo) : ''}</small></span></li>`; }).join('') || '<li class="muted small">No se anotaron rondas.</li>'}</ol>
    ${cuenta.gar || cuenta.inc ? `<p class="nc-por">${I('info')} ${plural(sv.rondas.length, 'ronda anotada', 'rondas anotadas')}: ${[cuenta.ok && plural(cuenta.ok, 'completa con QR', 'completas con QR'), cuenta.inc && plural(cuenta.inc, 'incompleta', 'incompletas'), cuenta.gar && plural(cuenta.gar, 'anotada por la garita', 'anotadas por la garita')].filter(Boolean).join(', ')}. Para la meta cuentan ${c}.</p>` : ''}
    <div class="btns"><button class="btn btn-xs btn-sec" data-a="policia-constancia-ver" data-id="${esc(sv.id)}">${I('file')}Ver la constancia</button>
      ${sv.sale && sv.email && sv.registroSale ? `<button class="btn btn-xs btn-sec" data-a="policia-constancia" data-id="${esc(sv.id)}">${I('mail')}${cs && cs.ok ? 'Reenviar' : 'Mandar'} la constancia</button>` : ''}
      <span class="pill ${!sv.sale ? 'p-accent' : cs && cs.ok ? 'p-ok' : sv.email ? 'p-warn' : ''}">${!sv.sale ? 'En servicio' : cs && cs.ok ? 'Constancia enviada' : sv.email ? 'Constancia sin enviar' : 'Sin correo'}</span></div>
  </article>`;
}
function detalleNoche(svs){
  const ss = svs.filter(sv => nocheDe(sv.entra) === TV.noche);
  return `<div class="nc-det" id="ncDet" aria-live="polite"><div class="nc-det-cab">${I('moon')}<b>${esc(nocheTitulo(TV.noche))}</b></div>
    ${ss.length ? ss.map(servicioEnNoche).join('') : `<p class="muted small" style="margin:6px 2px">Esa noche no se registró el ingreso de ningún policía.</p>`}</div>`;
}
A['tv-noche'] = el => { TV.noche = el.dataset.v; refrescar(); };

/* Lo que va en Turnos, desde "Policía nocturna" hasta abajo. */
function seccionNochePolicia(){
  const h = policiaHorario(), svs = serviciosPolicia();
  return `${sec('Policía nocturna')}
    <div class="card nc-card">${cieloNoche()}
      ${semanaPolicia()}
      ${esAdmin() ? `<button class="nh-boton" data-a="pn-horario"><span class="nh-reloj" aria-hidden="true"><i></i><i></i></span><span class="grow"><b>Cambiar el horario</b><small>Dom. a jue. ${esc(h.semana)}–${esc(h.hasta)} · Vie. y sáb. ${esc(h.finde)}–${esc(h.hastaFinde)}</small></span>${I('right')}</button>` : ''}
      <p class="muted tiny" style="margin:8px 0 0">Policía provincial con horas adicionales: su horario es aparte del de la garita (AVIC). La garita registra su ingreso y su salida; las rondas las anota él solo leyendo los QR.</p></div>
    ${sec('Las noches del policía', `<span class="muted small">tocá una noche</span>`)}
    <div class="card nc-noches">${tiraNoches(svs)}${detalleNoche(svs)}
      <button class="btn btn-sm btn-sec" style="margin-top:10px" data-a="hist-policias">${I('clock')}Ver servicios anteriores</button></div>
    ${seccionPuntos()}
    ${esAdmin() ? mesPolicia(svs) : ''}`;
}

/* ---------- 2. la policía contratada del mes (Administración) ---------- */
function mesPolicia(svs){
  const meses = [...new Set([hoyISO().slice(0, 7), ...svs.map(sv => nocheDe(sv.entra).slice(0, 7))])].sort();
  if (!TV.mes || !meses.includes(TV.mes)) TV.mes = hoyISO().slice(0, 7);
  const i = meses.indexOf(TV.mes), [y, m] = TV.mes.split('-').map(Number), dm = new Date(y, m, 0).getDate();
  const meta = typeof rondaMeta === 'function' ? rondaMeta() : 3;
  const del = svs.filter(sv => nocheDe(sv.entra).slice(0, 7) === TV.mes);
  const pm = new Map();
  del.forEach(sv => { const k = claveNombre(sv.nombre), r = pm.get(k) || { nombre:sv.nombre, cargo:sv.cargo, matricula:sv.matricula, noches:{}, horas:0, rondas:0, ok:0 };
    const d = nocheDe(sv.entra), c = completasDe(sv); r.noches[d] = (r.noches[d] || 0) + c;
    r.horas += ((sv.sale || Date.now()) - sv.entra) / HORA; r.rondas += sv.rondas.length; r.ok += c; pm.set(k, r); });
  const ps = [...pm.values()].sort((a, b) => a.nombre.localeCompare(b.nombre));
  const noches = new Set(del.map(sv => nocheDe(sv.entra))), conMeta = [...noches].filter(d => del.filter(sv => nocheDe(sv.entra) === d).reduce((k, sv) => k + completasDe(sv), 0) >= meta).length;
  const horas = ps.reduce((k, p) => k + p.horas, 0), ok = ps.reduce((k, p) => k + p.ok, 0);
  const kpi = (k, n, t, sub, col) => `<div class="nm-k" style="--col:var(--${col})"><b class="dn-num" data-k="nm-${k}-${TV.mes}" data-n="${n}">${n}</b><span>${t}</span><small>${sub}</small></div>`;
  return `${sec('Policía contratada', `<span class="nm-mes"><button class="icon-btn" data-a="tv-mes" data-v="-1" aria-label="Mes anterior" ${i > 0 ? '' : 'disabled'}>${I('left')}</button><b>${MESES_TV[m - 1]} ${y}</b><button class="icon-btn" data-a="tv-mes" data-v="1" aria-label="Mes siguiente" ${i < meses.length - 1 ? '' : 'disabled'}>${I('right')}</button></span>`)}
    <div class="card nm-card">
      <div class="nm-kpis">${kpi('noches', noches.size, 'noches', 'con policía', 'sky')}${kpi('horas', Math.round(horas), 'horas', 'de servicio', 'accent')}${kpi('ok', ok, 'rondas', 'completas con QR', 'ok')}${kpi('meta', conMeta, 'noches', `con la meta de ${meta}`, 'warn')}</div>
      ${ps.length ? ps.map(p => `<div class="nm-p" style="--c:${colorDe(p.nombre)}"><span class="nc-ini">${esc(inicialesDe(p.nombre))}</span>
        <div class="grow"><b>${esc(p.nombre)}${nombreIncompleto(p.nombre) ? ' <span class="nc-falta corto">falta el apellido</span>' : ''}</b><small>${esc(pnCargoMat(p, ' · '))}${plural(Object.keys(p.noches).length, 'noche')} · ${p.horas.toFixed(1).replace('.', ',')} h · ${p.ok} de ${p.rondas} rondas completas</small>
          <div class="nm-cal" role="img" aria-label="Noches de ${esc(p.nombre)} en ${MESES_TV[m - 1]}">${Array.from({ length:dm }, (_, j) => { const d = `${TV.mes}-${String(j + 1).padStart(2, '0')}`, v = p.noches[d];
            return `<i class="${v == null ? '' : v >= meta ? 'meta' : v ? 'media' : 'cero'}" title="${j + 1}: ${v == null ? 'no vino' : v + ' completas'}" style="--j:${j}"></i>`; }).join('')}</div></div></div>`).join('')
        : `<p class="muted small" style="margin:8px 2px 0">En ${MESES_TV[m - 1]} la garita no anotó ingresos del policía.</p>`}
      <p class="muted tiny" style="margin:10px 0 0">Horas desde el ingreso hasta la salida que anotó la garita; cada cuadradito es una noche del mes (verde: cumplió la meta · ámbar: menos rondas completas · rojo: ninguna completa). Sirve para controlar lo que se le paga.</p></div>`;
}
A['tv-mes'] = el => { const svs = serviciosPolicia(), ms = [...new Set([hoyISO().slice(0, 7), ...svs.map(sv => nocheDe(sv.entra).slice(0, 7))])].sort();
  const i = ms.indexOf(TV.mes) + +el.dataset.v; if (ms[i]){ TV.mes = ms[i]; refrescar(); } };

/* Completar el nombre de un policía (el "ROJO" de la constancia). Cambia
   el nombre en todos los registros de ese servicio: la constancia se
   vuelve a armar sola con el nombre nuevo. */
A['pn-nombre'] = el => {
  if (!esAdmin() && !esGuardia()) return;
  const sv = serviciosPolicia().find(x => x.id === el.dataset.id); if (!sv) return;
  hoja('Nombre del policía', `<form data-f="pn-nombre"><input type="hidden" name="pid" value="${esc(sv.id)}">
    <div class="field"><label>Nombre y apellido completos</label><input name="nombre" required maxlength="60" autocomplete="off" value="${esc(sv.nombre)}"></div>
    <p class="muted tiny" style="margin:0 0 12px">Así figura en su constancia, en el libro de guardia y en Turnos. Si la constancia ya salió, después tocá "Reenviar la constancia".</p>
    <button class="btn btn-pri btn-block">${I('check')}Guardar</button></form>`);
};
F['pn-nombre'] = d => {
  const nombre = conMayusculas(d.nombre || '');
  if (nombreIncompleto(nombre)) return toast('Escribí nombre y apellido', 'users');
  let viejo = '';
  Store.cambiar(s => {
    aLista(s.bitacora).forEach(b => { if (!b || b.tipo !== 'turno' || !b.abre) return;
      const ps = policiasDe(b); if (!ps.some(p => p.id === d.pid)) return;
      b.policias = ps.map(p => { if (p.id !== d.pid) return p; viejo = viejo || p.nombre; return { ...p, nombre }; }); });
    s.rondaCodigos = aLista(s.rondaCodigos).map(c => c && c.pid === d.pid ? { ...c, nombre } : c);
    if (viejo) s.bitacora.unshift({ id:uid(), autor:yo().id, tipo:'acceso', texto:`Se completó el nombre del policía: "${viejo}" ahora es ${nombre}.`, at:Date.now() });
  });
  cerrarHoja(); toast('Nombre guardado', 'check'); refrescar();
};

/* ---------- 3. los turnos de la garita en un calendario ---------- */
/* Lo que hubo en un día: los turnos que lo tocan (aunque empiecen la noche
   anterior), sus incidentes y el policía. */
function turnosDelCal(){ const ids = new Set(), out = [];
  [...registrosTurno(), ...Object.values(TV.extra).flat()].forEach(r => { if (r && r.tipo === 'turno' && r.abre && !ids.has(r.id)){ ids.add(r.id); out.push(r); } });
  return out.sort((a, b) => a.at - b.at); }
function datosDia(iso, regs, lineas){
  const ini = fechaDe(iso).getTime(), fin = ini + DIA;
  const ts = regs.filter(r => r.at < fin && (r.cerradoAt || Date.now()) > ini);
  const inc = lineas.filter(b => b && b.tipo === 'incidente' && b.at >= ini && b.at < fin);
  const pol = ts.flatMap(r => policiasDe(r).map(p => ({ ...p, reg:r.id }))).filter(p => p.entra < fin && (p.sale || Date.now()) > ini);
  return { ini, fin, ts, inc, pol };
}
function calTurnos(){
  const regs = turnosDelCal(), lineas = [...aLista(Store.s.bitacora), ...Object.values(TV.extra).flat()];
  const hoy = hoyISO();
  if (!TV.dia) TV.dia = hoy;
  const [y, m] = TV.dia.split('-').map(Number);
  const primero = regs.length ? new Date(regs[0].at).getFullYear() : y, anios = []; for (let a = Math.min(primero, y); a <= new Date().getFullYear(); a++) anios.push(a);
  const dm = new Date(y, m, 0).getDate(), corre = (new Date(y, m - 1, 1).getDay() + 6) % 7;
  const porDia = {}; for (let d = 1; d <= dm; d++){ const iso = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`; porDia[iso] = datosDia(iso, regs, lineas); }
  const max = Math.max(1, ...Object.values(porDia).map(x => x.ts.length));
  const ventana = Date.now() - (Historial.VENTANA.bitacora[1] - 1) * DIA, mesViejo = new Date(y, m, 0).getTime() < ventana;
  const clave = `${y}-${String(m).padStart(2, '0')}`;
  const sel = porDia[TV.dia] || datosDia(TV.dia, regs, lineas);
  return `<div class="card tc-card">
    <div class="tc-anios" role="tablist" aria-label="Año">${anios.map(a => `<button class="tc-chip ${a === y ? 'on' : ''}" role="tab" aria-selected="${a === y}" data-a="tv-anio" data-v="${a}">${a}</button>`).join('')}</div>
    <div class="tc-meses" role="tablist" aria-label="Mes">${MESES.map((t, i) => { const fut = new Date(y, i, 1) > new Date();
      return `<button class="tc-mes ${i + 1 === m ? 'on' : ''}" role="tab" aria-selected="${i + 1 === m}" data-a="tv-mesc" data-v="${i + 1}" ${fut ? 'disabled' : ''}>${t}</button>`; }).join('')}</div>
    ${mesViejo && !TV.extra[clave] && Historial.hayNube() ? `<div class="aviso a-info" style="margin:8px 0">${I('download')}<div class="txt"><b>${TV.trayendo === clave ? 'Trayendo los turnos de la base…' : 'Mes guardado en la base'}</b>En la app quedan los últimos ${Historial.VENTANA.bitacora[1]} días. <button class="link" data-a="tv-traer" data-v="${clave}">Traer ${MESES_TV[m - 1]}</button></div></div>` : ''}
    <div class="tc-sem">${['L', 'M', 'M', 'J', 'V', 'S', 'D'].map(x => `<span>${x}</span>`).join('')}</div>
    <div class="tc-grid">${'<span></span>'.repeat(corre)}${Object.entries(porDia).map(([iso, x], i) => {
      const fut = iso > hoy, n = x.ts.length;
      return `<button class="tc-d ${iso === TV.dia ? 'sel' : ''}${iso === hoy ? ' hoy' : ''}${n && n / max >= .45 ? ' lleno' : ''}" data-a="tv-dia" data-v="${iso}" ${fut ? 'disabled' : ''} style="--h:${n ? (.18 + .82 * n / max).toFixed(2) : 0};--i:${i}"
        aria-label="${fechaLarga(iso)}: ${plural(n, 'turno')}${x.inc.length ? ', ' + plural(x.inc.length, 'incidente') : ''}${x.pol.length ? ', vino el policía' : ''}"><b>${+iso.slice(8)}</b>
        <span class="tc-marcas">${x.inc.length ? '<i class="inc"></i>' : ''}${x.pol.length ? '<i class="pol"></i>' : ''}</span></button>`; }).join('')}</div>
    <div class="nc-ley"><span><i class="tc-l0"></i>sin turnos</span><span><i class="tc-l1"></i>más turnos</span><span><i class="r-inc-dot"></i>incidente</span><span><i class="r-pol-dot"></i>vino el policía</span></div>
    ${diaTurnos(TV.dia, sel)}</div>`;
}
function diaTurnos(iso, x){
  const pos = t => (Math.max(0, Math.min(DIA, t - x.ini)) / DIA * 100).toFixed(2);
  const barra = (a, b, cls, txt, i, extra = '') => `<div class="tl-fila ${cls}" style="--i:${i}"><span class="tl-n">${txt}</span><div class="tl-pista"><i style="left:${pos(a)}%;width:${Math.max(.8, pos(b) - pos(a))}%">${a < x.ini ? '<em class="izq">‹</em>' : ''}${b > x.fin ? '<em class="der">›</em>' : ''}</i>${extra}</div></div>`;
  const ahora = iso === hoyISO() ? `<span class="tl-ahora" style="left:${pos(Date.now())}%"></span>` : '';
  return `<div class="tc-dia" id="tcDia" aria-live="polite">
    <div class="tc-dia-cab"><b>${esc(fechaLarga(iso).replace(/^./, c => c.toUpperCase()))}</b><span class="muted small">${plural(x.ts.length, 'turno')}${x.inc.length ? ` · <span class="txt-danger">${plural(x.inc.length, 'incidente')}</span>` : ''}${x.pol.length ? ' · policía' : ''}</span></div>
    ${x.ts.length || x.pol.length ? `<div class="tl">
      <div class="tl-regla">${[0, 6, 12, 18, 24].map(h => `<span style="left:${h / 24 * 100}%">${h}</span>`).join('')}</div>
      ${x.ts.map((r, i) => barra(r.at, r.cerradoAt || Date.now(), r.cerradoAt ? 'turno' : 'turno vivo', esc(r.turno), i, ahora)).join('')}
      ${x.pol.map((p, i) => barra(p.entra, p.sale || Date.now(), 'poli', 'Policía', x.ts.length + i,
        p.rondas.filter(r => r.inicio >= x.ini && r.inicio < x.fin).map(r => `<b class="tl-r" style="left:${pos(r.inicio)}%"></b>`).join('') + ahora)).join('')}
      ${x.inc.length ? `<div class="tl-capa">${x.inc.map(b => `<span class="tl-inc" style="left:${pos(b.at)}%" title="${hora(b.at)} h · ${esc(b.texto || '')}"></span>`).join('')}</div>` : ''}</div>` : ''}
    ${x.ts.length ? x.ts.slice().reverse().map(r => { const rs = relevosDe(r), incs = x.inc.filter(b => b.at >= r.at && b.at <= (r.cerradoAt || Date.now()));
      return `<div class="tc-turno ${r.cerradoAt ? '' : 'vivo'}">
        <div class="tc-t-cab"><span class="tc-sol">${I(turnoEsNoche(r.turno) ? 'moon' : 'sun')}</span><div class="grow"><b>${esc(r.turno)}</b><small>${isoDe(new Date(r.at)) !== iso ? fechaCorta(isoDe(new Date(r.at))) + ' ' : ''}${hora(r.at)} a ${r.cerradoAt ? (isoDe(new Date(r.cerradoAt)) !== iso ? fechaCorta(isoDe(new Date(r.cerradoAt))) + ' ' : '') + hora(r.cerradoAt) + ' h · ' + cpDur(r.cerradoAt - r.at) + (r.cierreAuto ? ' · se cerró al abrir el siguiente' : '') : 'ahora · en curso'}</small></div>
          ${incs.length ? `<span class="pill p-danger">${plural(incs.length, 'incidente')}</span>` : r.cerradoAt ? '' : '<span class="pill p-ok">En curso</span>'}</div>
        <div class="tc-guardias">${rs.map(g => `<span class="chip-nombre" style="--c:${colorDe(g.n)}"><i>${esc(inicialesDe(g.n))}</i>${esc(g.n)}</span>`).join('')}</div>
        ${policiasDe(r).map(p => `<div class="tc-poli">${I('shield')}<span>Policía <b>${esc(p.nombre)}</b>${esc(pnCargoMat(p, '', ' · '))} · ${hora(p.entra)}${p.sale ? '–' + hora(p.sale) : p.paso ? ' · siguió en el turno siguiente' : ' · sigue'} · ${plural(p.rondas.length, 'ronda')}</span></div>`).join('')}
        <div class="tc-acc">${r.cerradoAt ? `<button class="btn btn-xs btn-sec" data-a="parte-ver" data-id="${esc(r.id)}">${I('file')}Ver el parte</button>` : ''}${typeof vistoRenglon === 'function' ? vistoRenglon(r) : ''}</div></div>`; }).join('')
      : `<p class="muted small" style="margin:8px 2px 0">${iso > hoyISO() ? 'Ese día todavía no llegó.' : 'Ese día no se abrió ningún turno de la garita.'}</p>`}</div>`;
}
A['tv-dia'] = el => { TV.dia = el.dataset.v; refrescar(); };
A['tv-anio'] = el => { const [, m] = TV.dia.split('-'), y = +el.dataset.v, hoy = hoyISO();
  let d = `${y}-${m}-01`; if (d > hoy) d = `${y}-${hoy.slice(5, 7)}-01`; if (d > hoy) d = hoy; TV.dia = d; refrescar(); };
A['tv-mesc'] = el => { const y = TV.dia.slice(0, 4), m = String(el.dataset.v).padStart(2, '0'), hoy = hoyISO();
  /* Al elegir el mes queda marcado el último día con turnos (o el 1). */
  const regs = turnosDelCal().filter(r => isoDe(new Date(r.at)).slice(0, 7) === `${y}-${m}`);
  TV.dia = `${y}-${m}` === hoy.slice(0, 7) ? hoy : regs.length ? isoDe(new Date(regs.at(-1).at)) : `${y}-${m}-01`; refrescar(); };
/* Un mes viejo se trae de la base solo cuando se pide. */
A['tv-traer'] = async el => {
  if (!Historial.hayNube() || TV.trayendo) return;
  const k = el.dataset.v, [y, m] = k.split('-').map(Number), ini = new Date(y, m - 1, 1).getTime() - DIA, fin = new Date(y, m, 1).getTime() + DIA;
  TV.trayendo = k; refrescar();
  try {
    const v = (await Nube.db.ref('staff/bitacora').orderByChild('at').startAt(ini).endAt(fin).get()).val() || {};
    TV.extra[k] = Object.values(v).filter(b => b && b.id);
  } catch(e){ toast('No se pudo traer ese mes: ' + (e.message || e), 'alert'); }
  TV.trayendo = ''; refrescar();
};

/* Al pintar Turnos: la tira de noches y los meses quedan mostrando lo elegido. */
function tvAlPintar(){
  const ver = (caja, el) => { if (caja && el) caja.scrollLeft = el.offsetLeft - caja.clientWidth / 2 + el.clientWidth / 2; };
  ver(document.querySelector('.nc-tira'), document.querySelector('.nc-n.sel'));
  ver(document.querySelector('.tc-meses'), document.querySelector('.tc-mes.on'));
}

/* CAMBIAR EL HORARIO DEL POLICÍA (pedido de Claudio, 21-10-2026: "rediseñá
   también el botón de cambio del horario"). Antes eran cuatro casillas de
   hora sueltas. Ahora es una ventana con las dos noches (domingo a jueves y
   viernes y sábado), cada una dibujada sobre una franja de 18 a 10 h que se
   mueve mientras se cambian las horas, con cuántas horas da la noche y
   atajos de un toque. Guarda con el mismo formulario de siempre. */
const NH_DESDE = 18;   /* la franja va de las 18 a las 10 del día siguiente (16 h) */
const nhMin = hhmm => { const [h, m] = String(hhmm || '0:0').split(':').map(Number); return (h || 0) * 60 + (m || 0); };
/* Minutos desde las 18 h, para dibujar en la franja. */
const nhPos = hhmm => { let x = nhMin(hhmm) - NH_DESDE * 60; if (x < 0) x += 1440; return x; };
function nhDur(a, b){ let d = nhMin(b) - nhMin(a); if (d <= 0) d += 1440; return d; }
const nhDurTxt = m => `${Math.floor(m / 60)} h${m % 60 ? ' ' + String(m % 60).padStart(2, '0') + ' min' : ''}`;
function nhFranja(k, desde, hasta){
  const a = nhPos(desde), d = nhDur(desde, hasta), w = Math.min(960 - a, d);
  return `<div class="nh-franja" data-nh="${k}"><div class="nh-pista">
      <i class="nh-span" style="left:${(a / 960 * 100).toFixed(2)}%;width:${(Math.max(0, w) / 960 * 100).toFixed(2)}%"><em>${I('moon')}</em></i>
      <span class="nh-medianoche" style="left:${(360 / 960 * 100).toFixed(2)}%"></span></div>
    <div class="nh-regla">${[18, 21, 0, 3, 6, 9].map(hh => `<span style="left:${((hh - NH_DESDE + 24) % 24 * 60 / 960 * 100).toFixed(2)}%">${hh}</span>`).join('')}</div></div>`;
}
function nhNoche(k, titulo, sub, nd, nh, desde, hasta, atajos){
  return `<section class="nh-noche nh-${k}">
    <header><span class="nh-ic">${I(k === 'semana' ? 'moon' : 'star')}</span><div class="grow"><b>${titulo}</b><small>${sub}</small></div><span class="nh-dur" data-nh-dur="${k}">${nhDurTxt(nhDur(desde, hasta))}</span></header>
    ${nhFranja(k, desde, hasta)}
    <div class="nh-horas"><label><small>${I('moon')}Entra</small><input type="time" name="${nd}" required value="${esc(desde)}" data-nh-k="${k}"></label>
      <span class="nh-flecha" aria-hidden="true">→</span>
      <label><small>${I('sunrise')}Se va</small><input type="time" name="${nh}" required value="${esc(hasta)}" data-nh-k="${k}"></label></div>
    <div class="nh-atajos">${atajos.map(([a, b]) => `<button type="button" class="nh-atajo" data-a="nh-atajo" data-k="${k}" data-d="${a}" data-h="${b}">${a} a ${b}</button>`).join('')}</div></section>`;
}
A['pn-horario'] = () => {
  if (!esAdmin()) return;
  const h = policiaHorario();
  hoja('Horario de la policía nocturna', `<form data-f="policia-horario" class="nh-form">
    <p class="muted small" style="margin:0 0 10px">Tocá una hora para cambiarla: la franja se mueve sola. La noche del viernes termina el sábado a la mañana.</p>
    ${nhNoche('semana', 'Domingo a jueves', '5 noches por semana', 'semana', 'hasta', h.semana, h.hasta, [['21:59', '06:00'], ['22:00', '06:00'], ['23:00', '07:00']])}
    ${nhNoche('finde', 'Viernes y sábado', '2 noches por semana', 'finde', 'hastaFinde', h.finde, h.hastaFinde, [['23:59', '08:00'], ['23:00', '07:00'], ['22:00', '06:00']])}
    <div class="nh-total" data-nh-total>${nhTotalTxt(h.semana, h.hasta, h.finde, h.hastaFinde)}</div>
    <button class="btn btn-pri btn-block btn-grande">${I('check')}Guardar el horario</button></form>`);
};
function nhTotalTxt(s, sh, f, fh){ const m = 5 * nhDur(s, sh) + 2 * nhDur(f, fh); return `${I('clock')}<span>En total, <b>${nhDurTxt(m)}</b> de policía por semana.</span>`; }
/* Mientras se cambian las horas, la franja y las cuentas se rehacen. */
function nhRepintar(f){
  if (!f) return;
  [['semana', 'semana', 'hasta'], ['finde', 'finde', 'hastaFinde']].forEach(([k, a, b]) => {
    const fr = f.querySelector(`[data-nh="${k}"]`), d = f.querySelector(`[data-nh-dur="${k}"]`);
    if (fr) fr.outerHTML = nhFranja(k, f[a].value, f[b].value);
    if (d) d.textContent = nhDurTxt(nhDur(f[a].value, f[b].value));
  });
  const t = f.querySelector('[data-nh-total]'); if (t) t.innerHTML = nhTotalTxt(f.semana.value, f.hasta.value, f.finde.value, f.hastaFinde.value);
}
document.addEventListener('input', e => { const x = e.target; if (x && x.dataset && x.dataset.nhK) nhRepintar(x.closest('form')); });
A['nh-atajo'] = el => { const f = el.closest('form'); if (!f) return;
  const [a, b] = el.dataset.k === 'semana' ? ['semana', 'hasta'] : ['finde', 'hastaFinde'];
  f[a].value = el.dataset.d; f[b].value = el.dataset.h; nhRepintar(f);
  f.querySelectorAll(`.nh-atajo[data-k="${el.dataset.k}"]`).forEach(x => x.classList.toggle('on', x === el)); };

/* LA LUNA CORRE COMO UN RELOJ (pregunta de Claudio, 21-10-2026: "la
   animación de la luna corre como el reloj, ¿sí?"). Cada 30 segundos la luna,
   la línea dorada y el porcentaje avanzan solos con la hora, sin redibujar
   la pantalla. Cuando la noche empieza o termina, se redibuja Turnos para que
   cambie el cartel ("En curso" / "Fuera de horario"). */
setInterval(() => {
  const c = document.querySelector('.nc-cielo'); if (!c || document.hidden) return;
  const n = nochePolicia(), f = Math.min(1, Math.max(0, (Date.now() - n.desde) / (n.hasta - n.desde)));
  if (n.ahora !== c.classList.contains('on')){ refrescar(); return; }
  if (!n.ahora) return;
  c.style.setProperty('--x', (8 + f * 84).toFixed(1) + '%'); c.style.setProperty('--y', (64 - Math.sin(f * Math.PI) * 46).toFixed(1) + '%'); c.style.setProperty('--f', f.toFixed(3));
  const em = c.querySelector('.nc-cab em'); if (em) em.textContent = `En curso · ${Math.round(f * 100)} % de la noche`;
}, 30000);
