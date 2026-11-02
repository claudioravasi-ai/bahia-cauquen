/* =========================================================
   LA GUARDIA DE HOY: HORARIOS QUE SE SUPERPONEN Y RELEVO DE A UNO
   (pedido de Claudio, 14-10-2026)
   "Hay uno que ingresa de 7 a 15 h, otro que entra de 8 a 20 h, otro que
   ingresa de 15 a 23 h y otro de 23 a 7 h, sin contar el policía nocturno,
   que va aparte."

   Ya no se abre "un turno" para todos: cada guardia entra con su horario y
   marca su propia salida. La pantalla tiene:
   · la línea del día (24 h desde que empieza el primer horario), con un
     carril por horario: lo previsto en contorno, lo que de verdad estuvo
     cada uno relleno con su nombre, y la raya roja de "ahora" (idea de las
     barras de frappe/gantt, 6.1k★ en GitHub, MIT: solo la idea);
   · quién está en la garita, con lo que le falta de su horario y "Sale";
   · los horarios que empiezan pronto o que ya empezaron sin nadie, con
     "Entra" (la entrega de guardia de linkedin/oncall, 1.3k★: la idea de
     avisar el hueco y al que se pasó de su horario).
   El núcleo (relevosDe, abrirGuardia, horarioSugerido) está en
   js/v-inicio.js, junto a los turnos de siempre. El policía nocturno sigue
   igual: pasa de un registro al siguiente con su ronda.
   ========================================================= */
const RELEVO_PALETA = ['#f59e0b', '#0ea5e9', '#ec4899', '#6366f1', '#10b981', '#f97316'];
const colorHorario = h => RELEVO_PALETA[Math.max(0, ordenHorarios().indexOf(h)) % RELEVO_PALETA.length];
const hhCorto = hhmm => { const [h, m] = String(hhmm || '').split(':'); return m && m !== '00' ? `${+h}:${m}` : String(+h); };
const rangoHorario = h => h ? `${hhCorto(h.desde)} a ${hhCorto(h.hasta)} h` : '';

/* El día de guardia empieza con el primer horario (las 7) y dura 24 h. */
function inicioDiaGuardia(){
  const base = minutosDe(turnosConfig()[0]?.desde || '07:00'), d = new Date(); d.setHours(0, 0, 0, 0);
  let ini = +d + base * MIN; if (Date.now() < ini) ini -= DIA;
  return ini;
}
/* Lo que de verdad estuvo cada guardia: tramos [desde, hasta] por persona y
   horario, armados con los registros de la guardia de las últimas 30 h. */
function presenciasGuardia(desde = inicioDiaGuardia() - 6 * HORA){
  const out = new Map();
  registrosTurno().filter(r => (r.cerradoAt || Date.now()) >= desde).forEach(r => {
    const fin = r.cerradoAt || Date.now();
    relevosDe(r).forEach(x => {
      const k = `${claveNombre(x.n)}|${x.h}|${x.entra || r.at}`;
      const p = out.get(k) || { n:x.n, h:x.h, entra:x.entra || r.at, desde:r.at, hasta:fin, abierto:false };
      p.desde = Math.min(p.desde, r.at); p.hasta = Math.max(p.hasta, fin); p.abierto = p.abierto || !r.cerradoAt;
      out.set(k, p);
    });
  });
  return [...out.values()];
}
/* La línea del día: un carril por horario. */
function lineaGuardia(){
  const ini = inicioDiaGuardia(), base = minutosDe(turnosConfig()[0]?.desde || '07:00');
  const pct = ts => Math.max(0, Math.min(100, (ts - ini) / DIA * 100));
  const ahora = pct(Date.now()), pres = presenciasGuardia();
  const marcas = [0, 4, 8, 12, 16, 20, 24].map(k => `<i style="left:${(k / 24 * 100).toFixed(2)}%">${(Math.floor(base / 60) + k) % 24}</i>`).join('');
  const filas = turnosConfig().map(h => {
    const d = (minutosDe(h.desde) - base + 1440) % 1440, largo = ((minutosDe(h.hasta) - minutosDe(h.desde) + 1440) % 1440) || 1440;
    const plan = `<i class="lg-plan" style="left:${(d / 1440 * 100).toFixed(2)}%;width:${(Math.min(largo, 1440 - d) / 1440 * 100).toFixed(2)}%"></i>`;
    const reales = pres.filter(p => p.h === h.nombre && p.hasta > ini).map(p => {
      const a = pct(p.desde), b = pct(p.hasta);
      return `<i class="lg-real${p.abierto ? ' on' : ''}" style="left:${a.toFixed(2)}%;width:${Math.max(1.5, b - a).toFixed(2)}%" title="${esc(p.n)} · ${hora(p.desde)}${p.abierto ? ' · sigue' : ' a ' + hora(p.hasta)}"><em>${esc(String(p.n).split(' ')[0])}</em></i>`; }).join('');
    return `<div class="lg-fila" style="--c:${colorHorario(h.nombre)}"><span class="lg-lbl"><b>${esc(h.nombre)}</b><small>${hhCorto(h.desde)}–${hhCorto(h.hasta)}</small></span>
      <span class="lg-pista">${plan}${reales}<b class="lg-ahora" style="left:${ahora.toFixed(2)}%"></b></span></div>`;
  }).join('');
  return `<div class="lg" role="img" aria-label="Horarios de la guardia de hoy y quién estuvo en cada uno">
    <div class="lg-fila lg-reglas"><span class="lg-lbl"></span><span class="lg-pista lg-horas">${marcas}<b class="lg-ahora-et" style="left:${ahora.toFixed(2)}%">${hora(Date.now())}</b></span></div>
    ${filas}
    <div class="lg-ref"><span><i class="r-plan"></i>Horario</span><span><i class="r-real"></i>Estuvo</span><span><i class="r-on"></i>Está ahora</span></div></div>`;
}
/* Lo que la garita no puede dejar pasar: un horario empezado sin nadie, o
   alguien que se pasó más de 20 min de su horario sin marcar la salida. */
function alertasGuardia(t = turnoAbierto()){
  if (!t) return [];
  const rs = relevosDe(t), out = [], m = ahoraMin();
  turnosConfig().forEach(h => {
    if (rs.some(r => r.h === h.nombre) || !enFranja(h, m)) return;
    const empezo = (m - minutosDe(h.desde) + 1440) % 1440;
    if (empezo >= 15 && faltanDe(h) > 30) out.push({ tipo:'falta', h:h.nombre, corto:`Falta el guardia de ${h.nombre} (${rangoHorario(h)})`, largo:`El horario ${h.nombre} empezó a las ${hhCorto(h.desde)} h y nadie marcó la entrada.` });
  });
  rs.forEach(r => { const h = horarioDe(r.h), f = faltanDe(h); if (h && f < -20) out.push({ tipo:'paso', n:r.n, corto:`${String(r.n).split(' ')[0]} terminó a las ${hhCorto(h.hasta)}: ¿ya salió?`, largo:`${r.n} (${r.h}) terminó su horario a las ${hhCorto(h.hasta)} h y no marcó la salida.` }); });
  return out;
}
const durGuardia = min => { min = Math.abs(Math.round(min)); return min < 60 ? `${min} min` : `${Math.floor(min / 60)} h${min % 60 ? ' ' + String(min % 60).padStart(2, '0') + ' min' : ''}`; };

A['guardia-hoy'] = () => {
  const t = turnoAbierto(), rs = relevosDe(t), opera = esGuardia(), m = ahoraMin(), conocidos = [...guardiasConocidos().values()];
  const alertas = alertasGuardia(t);
  const tarjeta = r => {
    const h = horarioDe(r.h), f = faltanDe(h), largo = h ? (((minutosDe(h.hasta) - minutosDe(h.desde) + 1440) % 1440) || 1440) : 0;
    const hecho = h ? Math.max(0, Math.min(100, (largo - f) / largo * 100)) : 0;
    return `<div class="gh-p${f < -20 ? ' paso' : ''}" style="--c:${colorHorario(r.h)}">
      <span class="gh-cara" style="--cc:${colorDe(r.n)}">${typeof caraGuardia === 'function' ? caraGuardia(r.n, typeof lookDe === 'function' ? lookDe(r.n) : null) : esc(inicialesDe(r.n))}</span>
      <span class="gh-d"><b>${esc(r.n)}</b><small><i class="gh-h">${esc(r.h)}</i>${h ? rangoHorario(h) : ''} · entró ${hora(r.entra || t.at)} h</small>
        <span class="gh-barra"><i style="width:${hecho.toFixed(1)}%"></i></span>
        <em>${!h ? 'Horario de antes del cambio' : f >= 0 ? `Termina a las ${hhCorto(h.hasta)} h · faltan ${durGuardia(f)}` : `Terminó a las ${hhCorto(h.hasta)} h · hace ${durGuardia(f)}`}</em></span>
      ${opera ? `<button type="button" class="gh-sale" data-a="guardia-sale" data-v="${esc(r.n)}">${I('logout')}<span>Sale</span></button>` : ''}</div>`;
  };
  /* Los horarios sin nadie que empiezan en las próximas 2 h o ya empezaron. */
  const libres = turnosConfig().filter(h => !rs.some(r => r.h === h.nombre)).map(h => {
    let en = (minutosDe(h.desde) - m + 1440) % 1440; if (enFranja(h, m)) en = -((m - minutosDe(h.desde) + 1440) % 1440);
    return { h, en };
  }).filter(x => x.en <= 120 && faltanDe(x.h) > 30).sort((a, b) => a.en - b.en);
  const entra = ({ h, en }) => `<form data-f="guardia-entra" class="gh-entra${en < -15 ? ' falta' : ''}" style="--c:${colorHorario(h.nombre)}">
      <input type="hidden" name="h" value="${esc(h.nombre)}">
      <span class="gh-entra-cab"><b>${esc(h.nombre)}</b><small>${rangoHorario(h)} · ${en > 0 ? `empieza en ${durGuardia(en)}` : en < -15 ? `empezó hace ${durGuardia(en)}: falta el guardia` : 'empieza ahora'}</small></span>
      ${opera ? `<span class="gh-entra-f"><input name="n" list="guardiasListaHoy" autocomplete="off" maxlength="50" required placeholder="Nombre y apellido"><button class="btn btn-ok">${I('login')}Entra</button></span>` : ''}</form>`;
  hoja('La guardia de hoy', `${lineaGuardia()}
    ${alertas.map(a => aviso(a.tipo === 'falta' ? 'danger latido' : 'warn', a.tipo === 'falta' ? 'alert' : 'clock', esc(a.corto), esc(a.largo))).join('')}
    ${sec('En la garita ahora', `<span class="muted small">${rs.length ? esc(t.turno) : ''}</span>`)}
    ${rs.length ? `<div class="gh-lista">${rs.map(tarjeta).join('')}</div>` : vacio('users', 'Ahora no hay nadie anotado en la garita.')}
    ${libres.length ? sec('Por entrar') + libres.map(entra).join('') : ''}
    <datalist id="guardiasListaHoy">${conocidos.map(n => `<option value="${esc(n)}">`).join('')}</datalist>
    ${opera && t ? `<button type="button" class="btn btn-sec btn-block" style="margin-top:14px" data-a="cerrar-turno">${I('clock')}Cerrar la guardia (se van todos)</button>` : ''}
    <p class="muted tiny" style="margin:10px 2px 0">Cada guardia marca su entrada y su salida. Al salir, deja las novedades y sale el parte de su tramo. El policía nocturno va aparte y sigue de un tramo al otro.${esAdmin() ? ' Los horarios se cambian en Turnos de la garita.' : ''}</p>`, { ancho:'640px' });
};
F['guardia-entra'] = d => {
  if (!esGuardia()) return;
  const h = horarioDe(d.h), k = claveNombre(d.n || ''); if (!h || !k) return toast('Escribí el nombre', 'users');
  const n = guardiasConocidos().get(k) || conMayusculas(d.n), t = turnoAbierto(), ahora = Date.now();
  if (!t){ abrirGuardia([{ n, h:h.nombre, entra:ahora }], `Empieza la guardia: ${n} (${h.nombre}).`); cerrarHoja(); toast(`${n} entró · ${h.nombre}`, 'login'); pintar(); return; }
  if (relevosDe(t).some(r => claveNombre(r.n) === k)) return toast(`${n} ya está en la garita`, 'users');
  Store.cambiar(s => {
    const x = aLista(s.bitacora).find(b => b.id === t.id); if (!x) return;
    x.relevos = relevosDe(x).concat({ n, h:h.nombre, entra:ahora });
    x.guardias = x.relevos.map(r => r.n); x.turno = etiquetaGuardia(x.relevos);
    s.bitacora.unshift({ id:uid(), autor:yo().id, tipo:'turno', texto:`Entra a la guardia: ${n} (${h.nombre}, ${rangoHorario(h)}). En la garita: ${x.guardias.join(', ')}.`, at:ahora });
  });
  toast(`${n} entró · ${h.nombre}`, 'login');
  A['guardia-hoy']();
};
A['guardia-sale'] = el => {
  if (!esGuardia()) return;
  const t = turnoAbierto(), rs = relevosDe(t), r = rs.find(x => x.n === el.dataset.v); if (!r) return;
  const solo = rs.length === 1, h = horarioDe(r.h), presentes = new Set(rs.map(x => x.h));
  const sug = turnosConfig().filter(x => !presentes.has(x.nombre)).sort((a, b) => Math.abs(faltanDe({ hasta:a.desde })) - Math.abs(faltanDe({ hasta:b.desde })))[0] || horarioSugerido();
  hoja(`Sale ${String(r.n).split(' ')[0]}`, `<form data-f="guardia-sale">
    <input type="hidden" name="n" value="${esc(r.n)}">
    <p class="small" style="margin:0 0 12px"><b>${esc(r.n)}</b> · ${esc(r.h)}${h ? ' · ' + rangoHorario(h) : ''} · entró ${hora(r.entra || t.at)} h.</p>
    <div class="field"><label>Novedades para el que sigue (opcional)</label><textarea name="nota" placeholder="Ej: quedó un paquete para el lote 40; el portón del fondo cierra mal."></textarea></div>
    <div class="field"><label>¿Entra alguien en su lugar?</label><div class="turno-fila"><input name="en" list="guardiasListaSale" autocomplete="off" maxlength="50" placeholder="Nombre (opcional)">
      <select name="eh" class="turno-h" aria-label="Horario">${turnosConfig().map(x => `<option value="${esc(x.nombre)}" ${x.nombre === sug.nombre ? 'selected' : ''}>${esc(x.nombre)} ${hhCorto(x.desde)}–${hhCorto(x.hasta)}</option>`).join('')}</select></div>
      <datalist id="guardiasListaSale">${[...guardiasConocidos().values()].map(n => `<option value="${esc(n)}">`).join('')}</datalist>
      <div class="ayuda">${solo ? 'Es el último en la garita: si nadie entra ahora, la guardia se cierra y queda la pantalla para anotar al que llegue.' : `Siguen en la garita: ${esc(rs.filter(x => x !== r).map(x => x.n).join(', '))}.`}</div></div>
    ${solo && policiasAdentro(t).length ? `<div class="field"><label>Policía que sigue en el barrio</label>${policiasAdentro(t).map(p => `<label class="check"><input type="checkbox" name="polSale" value="${esc(p.id)}"><span>${esc(p.nombre)} ya se fue (anotar la salida ahora)</span></label>`).join('')}
      <div class="ayuda">Si sigue de servicio, dejalo sin tildar: pasa al que entra con sus rondas.</div></div>` : ''}
    <button class="btn btn-pri btn-block">${I('logout')}Marcar la salida</button></form>`);
};
F['guardia-sale'] = d => {
  if (!esGuardia()) return;
  const t = turnoAbierto(), rs = relevosDe(t), r = rs.find(x => x.n === d.n); if (!t || !r) return;
  const nota = (d.nota || '').trim(), ahora = Date.now(), quedan = rs.filter(x => x !== r);
  const ke = claveNombre(d.en || ''), he = horarioDe(d.eh);
  let entra = null;
  if (ke && he){
    if (quedan.some(x => claveNombre(x.n) === ke)) return toast('Ese guardia ya está en la garita', 'users');
    entra = { n:guardiasConocidos().get(ke) || conMayusculas(d.en), h:he.nombre, entra:ahora };
    quedan.push(entra);
  }
  /* El último se va y nadie entra: se cierra la guardia como siempre. */
  if (!quedan.length){ F['cerrar-turno'](d); return; }
  const { previoId } = abrirGuardia(quedan,
    entra ? `Relevo: entra ${entra.n} (${entra.h}) por ${r.n}. En la garita: ${quedan.map(x => `${x.n} (${x.h})`).join(', ')}.` : `Sigue la guardia: ${quedan.map(x => `${x.n} (${x.h})`).join(', ')}.`,
    { cierre:`Sale de la guardia: ${r.n} (${r.h}) · ${hora(ahora)} h.${nota ? ' Novedades: ' + nota : ''}`, nota, notaPor:`${r.n} (${r.h})` });
  cerrarHoja();
  toast(entra ? `Salió ${String(r.n).split(' ')[0]} · entró ${String(entra.n).split(' ')[0]}` : `Salió ${String(r.n).split(' ')[0]}`, 'logout');
  pintar();
  if (previoId) mandarParteTurno(previoId, nota);
};
/* La Administración vuelve a los horarios de fábrica (7-15, 8-20, 15-23, 23-7). */
A['turnos-base'] = async () => {
  if (!esAdmin()) return;
  if (!await confirmar('Horarios de la guardia', 'Se cargan Mañana 7 a 15, Día 8 a 20, Tarde 15 a 23 y Noche 23 a 7. El policía nocturno no cambia.', { si:'Cargar' })) return;
  Store.cambiar(s => { s.config.turnosGarita = TURNOS_BASE.map(x => ({ ...x })); auditar(s, 'Cambió los turnos de la garita', TURNOS_BASE.map(t => `${t.nombre} ${t.desde}-${t.hasta}`).join(' · ')); });
  toast('Horarios cargados', 'check');
};
