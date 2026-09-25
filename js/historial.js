/* =========================================================
   EL HISTORIAL, A PEDIDO (pedido de Claudio, 25-09-2026)
   -------------------------------------------------------
   Con 152 lotes, si cada equipo baja al abrir la app TODO lo que pasó
   desde el primer día (cada visita, cada línea del libro de guardia, cada
   mensaje del chat), la app se hace más lenta cada mes. Por eso:

   1. Al abrir, cada equipo baja solo lo RECIENTE:
        · visitas, llegadas y pedidos de pase: los últimos N días (los de
          Ajustes → "Borrar datos de visitas", 90 por defecto) y el
          personal fijo vigente;
        · libro de guardia (bitácora): 60 días;
        · auditoría: 90 días;
        · chat vecinal: 60 días;
        · conversaciones privadas: los mensajes de los últimos 120 días
          (y siempre los 30 últimos de cada una).
   2. Lo más viejo NO se borra: pasa al ARCHIVO HISTÓRICO de la base
      (hist/<carpeta>/<dueño>/<id>, con las mismas reglas de lectura que la
      carpeta privada: cada vecino ve solo lo suyo; la garita y la
      Administración, lo que les toca por su función). La bitácora, la
      auditoría y el chat no se mudan: quedan donde están y solo se baja
      la ventana reciente.
   3. Quien quiere ver todo, lo pide con un botón ("Ver mi historial
      completo", "Historial histórico de visitas", "Ver el libro completo",
      "Ver mensajes anteriores"). Se baja UNA vez, en ese momento, y no
      entra al resto de la app.

   Al archivar, a las visitas se les sacan el DNI y la patente: el archivo
   guarda quién vino, a qué lote, cuándo entró y cuándo salió, pero nunca
   el documento (Ley 25.326, art. 4 inc. 7).

   La mudanza la hace, una vez por día, un equipo con permiso:
   la Administración (visitas y sus conversaciones), la garita (sus
   conversaciones) y cada vecino (sus mensajes con otros vecinos). Si la
   base rechaza la copia al archivo (reglas sin publicar), NO se borra
   nada del lugar de siempre.
   ========================================================= */
const Historial = {
  /* Lo que baja al abrir, en días. */
  VENTANA: { bitacora:['at', 60], auditoria:['at', 90], msgs:['createdAt', 60] },
  HILO_DIAS: 120, HILO_MIN: 30,
  diasVisitas: () => Math.max(30, +(Store.s.config.datosDias || 90)),

  /* Consulta con ventana para las colecciones planas (la usa Nube). */
  consulta(ref, col){
    const v = this.VENTANA[col];
    return v ? ref.orderByChild(v[0]).startAt(Date.now() - v[1] * DIA) : ref;
  },
  hayNube: () => typeof Nube !== 'undefined' && !!Nube.db && !!Nube.arrancada,

  /* ---------- la mudanza diaria ---------- */
  async archivar(){
    if (!this.hayNube()) return;
    const u = yo(); if (!u || u.estado !== 'aprobado') return;
    const hoy = hoyISO(), clave = 'bhc.archivo.' + u.id;
    try { if (localStorage.getItem(clave) === hoy) return; } catch(e){}
    let n = 0;
    try {
      if (u.rol === 'admin' && await Nube.reclamarMarca('archivo-' + hoy)) n += await this.archivarVisitas();
      if (u.rol === 'admin') n += await this.archivarHilos('privados', h => (h.con || 'admin') === 'admin' || h.con === 'interno');
      if (u.rol === 'guardia') n += await this.archivarHilos('privados', h => h.con === 'guardia');
      n += await this.archivarHilos('dms', h => h.a === u.id || h.b === u.id);
      try { localStorage.setItem(clave, hoy); } catch(e){}
      if (n) console.info(`Archivo histórico: ${n} registros pasaron al archivo`);
    } catch(e){ console.warn('Archivo histórico: no se completó (¿faltan publicar las reglas?)', e.message); }
  },
  sinDatos(x){ const c = JSON.parse(JSON.stringify(x)); ['dni', 'patente'].forEach(k => { if (k in c) c[k] = ''; }); c.archivadoAt = Date.now(); return c; },
  async subir(cambios){
    const rutas = Object.keys(cambios);
    for (let i = 0; i < rutas.length; i += 300){ const t = {}; rutas.slice(i, i + 300).forEach(r => { t[r] = cambios[r]; }); await Nube.db.ref().update(t); }
  },
  async archivarVisitas(){
    const s = Store.s, lim = sumarDias(hoyISO(), -this.diasVisitas()), limMs = Date.now() - this.diasVisitas() * DIA;
    const viejo = {
      pases: aLista(s.pases).filter(p => p && p.id && (p.fechaFin || p.fecha || '9999') < lim && (p.createdAt || 0) < limMs),
      llegadas: aLista(s.llegadas).filter(l => l && l.id && (l.at || Date.now()) < limMs),
      solicitudesPase: aLista(s.solicitudesPase).filter(r => r && r.id && (r.at || r.createdAt || Date.now()) < limMs && r.estado !== 'pendiente'),
    };
    let n = 0;
    for (const col in viejo){
      const lista = viejo[col]; if (!lista.length) continue;
      const cambios = {};
      lista.forEach(x => Nube.duenos(col, x).filter(Boolean).forEach(d => { cambios[`hist/${col}/${d}/${x.id}`] = this.sinDatos(x); }));
      if (!Object.keys(cambios).length) continue;
      await this.subir(cambios);                     /* si falla, sale por el catch y no se borra nada */
      const ids = new Set(lista.map(x => x.id));
      Store.cambiar(st => { st[col] = aLista(st[col]).filter(x => !ids.has(x.id)); });
      n += lista.length;
    }
    return n;
  },
  /* Una conversación larga deja en la base del día a día solo lo reciente;
     lo viejo va al archivo en un paquete con clave fija (hilo + último
     mensaje archivado), así dos equipos que lo hacen a la vez escriben lo
     mismo en el mismo lugar. */
  async archivarHilos(col, mio){
    const lim = Date.now() - this.HILO_DIAS * DIA, cuando = m => m.createdAt || m.at || 0;
    const hilos = aLista(Store.s[col]).filter(h => h && h.id && mio(h) && aLista(h.msgs).length > this.HILO_MIN);
    let n = 0;
    for (const h of hilos){
      const msgs = aLista(h.msgs), corte = msgs.length - this.HILO_MIN;
      const viejos = msgs.slice(0, corte).filter(m => cuando(m) < lim);
      if (!viejos.length) continue;
      const hasta = Math.max(...viejos.map(cuando)), paquete = { hilo:h.id, desde:Math.min(...viejos.map(cuando)), hasta, msgs:viejos, archivadoAt:Date.now() };
      const cambios = {};
      Nube.duenos(col, h).filter(Boolean).forEach(d => { cambios[`hist/${Nube.carpetaDe(col, h)}/${d}/${h.id}-${hasta}`] = paquete; });
      if (!Object.keys(cambios).length) continue;
      await this.subir(cambios);
      const ids = new Set(viejos.map(m => m.id || cuando(m)));
      Store.cambiar(st => { const x = aLista(st[col]).find(z => z.id === h.id); if (!x) return;
        x.msgs = aLista(x.msgs).filter(m => !ids.has(m.id || cuando(m))); x.archivados = (x.archivados || 0) + viejos.length; });
      n += viejos.length;
    }
    return n;
  },

  /* ---------- traer a pedido ---------- */
  async traer(ruta){
    if (!this.hayNube()) return null;
    return (await Nube.db.ref(ruta).get()).val() || {};
  },
  /* hist/<carpeta>/<uid>/<id> → lista (de un vecino o de todos). */
  async archivo(carpeta, uid){
    const v = await this.traer(uid ? `hist/${carpeta}/${uid}` : `hist/${carpeta}`);
    if (!v) return [];
    const out = [], meter = nodo => Object.values(nodo || {}).forEach(x => { if (x && typeof x === 'object') out.push(x); });
    if (uid) meter(v); else Object.values(v).forEach(meter);
    return out;
  },
  cargando(titulo){ hoja(titulo, `<div class="card plana small" style="display:flex;gap:10px;align-items:center">${I('refresh')} Trayendo el historial de la base del barrio…</div>`); },
  fallo(e){ hoja('No se pudo traer el historial', aviso('danger', 'alert', 'La base no lo entregó', esc(e && e.message || 'Revisá la conexión.'))); },
};

/* Una fila de visita para las listas de historial. */
function filaHistVisita(p, conCasa){
  const t = TIPOS_PASE[p.tipo] || TIPOS_PASE.visita, host = usuario(p.hostId) || {};
  const log = p.log || {}, dias = Object.keys(log).sort();
  const mov = dias.length ? dias.map(d => `${fechaCorta(d)}${log[d].in ? ' entró ' + hora(log[d].in) : ''}${log[d].out ? ' · salió ' + hora(log[d].out) : ''}`).slice(-3).join(' / ') + (dias.length > 3 ? ` (+${dias.length - 3} días)` : '') : (p.cancelado ? 'Cancelado' : 'No vino');
  return `<div class="it"><span class="ic ic-${t.c}" style="width:32px;height:32px;border-radius:10px;display:grid;place-items:center">${I(t.icon)}</span>
    <div class="txt"><b>${esc(p.nombre || '—')}${conCasa ? ` → ${esc(host.casa || p.casa || '')}` : ''}</b><span>${esc(t.n)} · ${p.dias?.length ? 'fijo hasta ' + fechaCorta(p.fechaFin) : fechaCorta(p.fecha)} · ${esc(mov)}${p.autoriza ? ' · autorizó ' + esc(p.autoriza) : ''}${p.archivadoAt ? ' · archivo' : ''}</span></div></div>`;
}
const csvDe = (filas, nombre) => { const csv = filas.map(f => f.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + csv], { type:'text/csv' })); a.download = nombre; a.click(); };
const filasCSVVisitas = ls => [['fecha','lote','visita','tipo','autorizó','movimientos'], ...ls.map(p => [p.fecha || '', (usuario(p.hostId) || {}).casa || '', p.nombre || '', (TIPOS_PASE[p.tipo] || {}).n || '', p.autoriza || nombreDe(p.hostId) || '',
  Object.keys(p.log || {}).sort().map(d => `${d} ${p.log[d].in ? 'in ' + hora(p.log[d].in) : ''} ${p.log[d].out ? 'out ' + hora(p.log[d].out) : ''}`.trim()).join(' | ')])];

/* ---------- Mis visitas: todo, lo reciente y lo del archivo ---------- */
let histVisitas = [];
A['hist-mis-visitas'] = async () => {
  const u = yo(); Historial.cargando('Mi historial de visitas');
  try {
    const arch = await Historial.archivo('pases', u.id) || [];
    const vivos = aLista(Store.s.pases).filter(p => p.hostId === u.id);
    const ids = new Set(vivos.map(p => p.id));
    histVisitas = [...vivos, ...arch.filter(p => !ids.has(p.id))].sort((a, b) => (b.fechaFin || b.fecha || '').localeCompare(a.fechaFin || a.fecha || ''));
    pintarHistVisitas('Mi historial de visitas', false);
  } catch(e){ Historial.fallo(e); }
};
/* La garita y la Administración: todas las visitas del barrio. */
A['hist-visitas-todo'] = async () => {
  if (!esStaff()) return;
  Historial.cargando('Historial histórico de visitas');
  try {
    const arch = await Historial.archivo('pases') || [];
    const vivos = aLista(Store.s.pases), ids = new Set(vivos.map(p => p.id));
    histVisitas = [...vivos, ...arch.filter(p => !ids.has(p.id))].sort((a, b) => (b.fechaFin || b.fecha || '').localeCompare(a.fechaFin || a.fecha || ''));
    pintarHistVisitas('Historial histórico de visitas', true);
  } catch(e){ Historial.fallo(e); }
};
function pintarHistVisitas(titulo, conCasa, q = ''){
  const qq = normTxt(q);
  const ls = qq ? histVisitas.filter(p => normTxt(`${p.nombre} ${(usuario(p.hostId) || {}).casa || ''} ${p.autoriza || ''} ${p.fecha}`).includes(qq)) : histVisitas;
  hoja(titulo, `<form class="linea-form" data-f="hist-visitas-buscar" data-t="${esc(titulo)}" data-c="${conCasa ? 1 : ''}" style="margin-bottom:10px">
      <input name="q" value="${esc(q)}" placeholder="${conCasa ? 'Nombre, lote o fecha (2026-09)…' : 'Nombre o fecha (2026-09)…'}"><button class="btn btn-pri">${I('search')}</button></form>
    <p class="muted small" style="margin:0 0 10px">${plural(ls.length, 'visita')}${qq ? ' encontradas' : ' en total'}. Las de más de ${Historial.diasVisitas()} días vienen del archivo histórico, sin DNI ni patente.</p>
    <div class="card lista">${ls.length ? ls.slice(0, 400).map(p => filaHistVisita(p, conCasa)).join('') : '<p class="muted small">No hay visitas.</p>'}</div>
    ${ls.length > 400 ? `<p class="muted tiny">Se muestran las 400 más recientes. Buscá por nombre, lote o mes para ver otras, o bajá la planilla.</p>` : ''}
    <button class="btn btn-sec btn-block" data-a="hist-visitas-csv">${I('download')}Descargar la planilla (CSV)</button>`);
}
F['hist-visitas-buscar'] = (d, form) => pintarHistVisitas(form.dataset.t, !!form.dataset.c, d.q || '');
A['hist-visitas-csv'] = () => csvDe(filasCSVVisitas(histVisitas), `visitas-${hoyISO()}.csv`);

/* ---------- El libro de guardia completo ---------- */
let histBitacora = [];
A['hist-bitacora'] = async () => {
  if (!esStaff()) return;
  Historial.cargando('Libro de guardia completo');
  try {
    const v = Historial.hayNube() ? await Historial.traer('staff/bitacora') : null;
    histBitacora = (v ? Object.values(v) : aLista(Store.s.bitacora)).filter(b => b && b.at).sort((a, b) => b.at - a.at);
    pintarHistBitacora('');
  } catch(e){ Historial.fallo(e); }
};
function pintarHistBitacora(q){
  const qq = normTxt(q), ls = qq ? histBitacora.filter(b => normTxt(`${b.texto} ${isoDe(new Date(b.at))} ${autorVisible(b.autor).nombre}`).includes(qq)) : histBitacora;
  hoja('Libro de guardia completo', `<form class="linea-form" data-f="hist-bitacora-buscar" style="margin-bottom:10px"><input name="q" value="${esc(q)}" placeholder="Palabra, nombre, lote o fecha (2026-09-14)"><button class="btn btn-pri">${I('search')}</button></form>
    <p class="muted small" style="margin:0 0 10px">${plural(ls.length, 'registro')}${qq ? ' encontrados' : ' desde el primer día'}.</p>
    <div class="card lista">${ls.slice(0, 400).map(b => { const t = TIPOS_BIT[b.tipo] || TIPOS_BIT.novedad;
      return `<div class="it"><span class="ic ic-${t[2]}" style="width:30px;height:30px;border-radius:10px;display:grid;place-items:center">${I(t[1])}</span><div class="txt"><b>${esc(b.texto)}</b><span>${fechaHora(b.at)} · ${esc(autorVisible(b.autor).nombre)}</span></div></div>`; }).join('') || '<p class="muted small">Sin registros.</p>'}</div>
    ${ls.length > 400 ? `<p class="muted tiny">Se muestran los 400 más recientes. Buscá por fecha o palabra, o bajá la planilla.</p>` : ''}
    <button class="btn btn-sec btn-block" data-a="hist-bitacora-csv">${I('download')}Descargar la planilla (CSV)</button>`);
}
F['hist-bitacora-buscar'] = d => pintarHistBitacora(d.q || '');
A['hist-bitacora-csv'] = () => csvDe([['fecha','tipo','texto','autor'], ...histBitacora.map(b => [new Date(b.at).toISOString(), b.tipo, b.texto, autorVisible(b.autor).nombre])], `libro-de-guardia-${hoyISO()}.csv`);

/* ---------- La auditoría completa (solo la Administración) ---------- */
A['hist-auditoria'] = async () => {
  if (yo()?.rol !== 'admin') return;
  Historial.cargando('Auditoría completa');
  try {
    const v = Historial.hayNube() ? await Historial.traer('staff/auditoria') : null;
    const ls = (v ? Object.values(v) : aLista(Store.s.auditoria)).filter(x => x && x.at).sort((a, b) => b.at - a.at);
    hoja('Auditoría completa', `<p class="muted small" style="margin:0 0 10px">${plural(ls.length, 'registro')} desde el primer día. No se pueden editar ni borrar.</p>
      <div class="card lista">${ls.slice(0, 500).map(x => `<div class="it"><div class="txt"><b>${esc(x.accion)}</b><span>${esc(x.detalle || '')} · ${esc(autorVisible(x.por).nombre)} · ${fechaHora(x.at)}</span></div></div>`).join('') || '<p class="muted small">Vacío.</p>'}</div>
      ${ls.length > 500 ? `<p class="muted tiny">Se muestran los 500 más recientes; la planilla trae todos.</p>` : ''}
      <button class="btn btn-sec btn-block" data-a="hist-auditoria-csv">${I('download')}Descargar toda la auditoría (CSV)</button>`);
    Historial.auditoria = ls;
  } catch(e){ Historial.fallo(e); }
};
A['hist-auditoria-csv'] = () => csvDe([['fecha','accion','detalle','por'], ...aLista(Historial.auditoria).map(x => [new Date(x.at).toISOString(), x.accion, x.detalle, autorVisible(x.por).nombre])], `auditoria-completa-${hoyISO()}.csv`);

/* ---------- Chat vecinal: lo anterior a la ventana ---------- */
A['hist-chat'] = async el => {
  const canal = el.dataset.v || 'general', v0 = Historial.VENTANA.msgs;
  Historial.cargando('Mensajes anteriores');
  try {
    let ls;
    if (Historial.hayNube()){
      const v = (await Nube.db.ref('barrio/msgs').orderByChild('createdAt').endAt(Date.now() - v0[1] * DIA).get()).val() || {};
      ls = Object.values(v);
    } else ls = aLista(Store.s.msgs).filter(m => m.createdAt < Date.now() - v0[1] * DIA);
    ls = ls.filter(m => m && m.channel === canal).sort((a, b) => b.createdAt - a.createdAt);
    hoja(`#${CANALES[canal] || canal} · anteriores`, ls.length ? `<p class="muted small" style="margin:0 0 10px">${plural(ls.length, 'mensaje')} de hace más de ${v0[1]} días, del más nuevo al más viejo.</p>
      <div class="card lista">${ls.slice(0, 500).map(m => { const au = autorVisible(m.autor); return `<div class="it"><div class="txt"><b>${esc(m.text)}</b><span>${esc(au.nombre)}${au.casa ? ' · ' + esc(au.casa) : ''} · ${fechaHora(m.createdAt)}</span></div></div>`; }).join('')}</div>`
      : vacio('chat', `No hay mensajes de hace más de ${v0[1]} días en este canal.`));
  } catch(e){ Historial.fallo(e); }
};

/* ---------- Conversaciones privadas: lo archivado de un hilo ---------- */
A['hist-hilo'] = async el => {
  const [col, id] = String(el.dataset.v || '').split('|');
  const h = aLista(Store.s[col]).find(x => x.id === id); if (!h) return;
  const carpeta = Nube.carpetaDe ? Nube.carpetaDe(col, h) : col;
  const dueno = col === 'dms' ? yo().id : h.userId;
  Historial.cargando('Mensajes anteriores');
  try {
    const paquetes = (await Historial.archivo(carpeta, dueno) || []).filter(p => p.hilo === id);
    const msgs = paquetes.flatMap(p => aLista(p.msgs)).sort((a, b) => (a.createdAt || a.at) - (b.createdAt || b.at));
    const mio = m => col === 'dms' ? m.de === yo().id : (esStaff() ? m.from !== 'vecino' : m.from === 'vecino');
    hoja('Mensajes anteriores', msgs.length ? `<div class="chat">${msgs.map(m => `<div class="msg ${mio(m) ? 'mia' : ''}"><div class="b">${esc(m.text)}<time>${fechaHora(m.createdAt || m.at)}</time></div></div>`).join('')}</div>`
      : vacio('chat', 'No hay mensajes archivados de esta conversación.'));
  } catch(e){ Historial.fallo(e); }
};
const botonHistHilo = (col, h) => h && h.archivados ? `<button class="btn btn-sm btn-sec" style="align-self:center;margin:4px auto 10px" data-a="hist-hilo" data-v="${col}|${h.id}">${I('clock')}Ver ${plural(h.archivados, 'mensaje anterior', 'mensajes anteriores')}</button>` : '';
