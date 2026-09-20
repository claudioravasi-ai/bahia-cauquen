/* =========================================================
   Administración: inscripciones, vecinos, contenido del barrio
   (todo lo que no viene de internet), ajustes, motor de
   automatizaciones, correos, auditoría y datos.
   ========================================================= */

/* ---------- MOTOR DE AUTOMATIZACIONES ----------
   Reglas que corren solas cada minuto mientras la app está abierta
   en algún equipo. Cada una deja una marca en motorLog para no
   repetirse (y así dos pestañas abiertas no duplican avisos).
   Con servidor, este mismo archivo corre como tarea programada. */
const REGLAS = [
  { id:'clima-viento', n:'Viento fuerte → aviso en el pizarrón', d:'Con ráfagas de 60 km/h o más publica un aviso para asegurar objetos sueltos.',
    run(s, hoy){ const a = Clima.alertas().find(x => x.icon === 'wind'); if (!a) return 0;
      return marca(s, 'viento-' + hoy, () => { publicarSistema(s, 'aviso', a.t, a.x); notificar(s, { para:'todos', titulo:a.t, texto:a.x, icon:'wind', color:'warn', link:'pizarron', sonido:true }); }); } },
  { id:'clima-nieve', n:'Nieve prevista → no dejar autos en la calle', d:'Si se anuncia nieve, a partir de las 18 h avisa a todos.',
    run(s, hoy){ const a = Clima.alertas().find(x => x.icon === 'snow'); if (!a || new Date().getHours() < 18) return 0;
      return marca(s, 'nieve-' + hoy, () => notificar(s, { para:'todos', titulo:a.t, texto:a.x, icon:'snow', color:'sky', link:'inicio' })); } },
  { id:'clima-hielo', n:'Helada → cuidado en las subidas', d:'Con mínima bajo cero, avisa a la guardia a las 6 h para echar arena o sal.',
    run(s, hoy){ const a = Clima.alertas().find(x => x.icon === 'thermo'); if (!a || new Date().getHours() < 6) return 0;
      return marca(s, 'hielo-' + hoy, () => notificar(s, { para:'staff', titulo:'Helada: revisar subidas', texto:'Echar arena o sal en las subidas y el acceso.', icon:'thermo', color:'warn' })); } },
  { id:'recoleccion', n:'Recolección → recordatorio la noche anterior', d:'A las 20 h avisa qué pasa mañana (y los voluminosos).',
    run(s, hoy){ if (new Date().getHours() < 20) return 0; const man = (new Date().getDay() + 1) % 7, t = s.config.recoleccion[man];
      const vol = s.config.voluminosos === sumarDias(hoy, 1);
      if (!t && !vol) return 0;
      return marca(s, 'reco-' + hoy, () => notificar(s, { para:'todos', titulo: vol ? 'Mañana pasan por los voluminosos' : `Mañana pasa el camión: ${t}`, texto: vol ? s.config.voluminososDetalle : 'Sacá la bolsa en el canasto cerrado.', icon:'truck', color:'ok', link:'recoleccion' })); } },
  { id:'reserva-recordatorio', n:'Reservas → recordatorio el día anterior', d:'Avisa al vecino que al otro día tiene un espacio reservado.',
    run(s, hoy){ let n = 0; const man = sumarDias(hoy, 1);
      s.reservas.filter(r => r.fecha === man && !r.cancelada).forEach(r => { const a = s.amenities.find(x => x.id === r.amenity);
        n += marca(s, 'res-' + r.id, () => notificar(s, { para:r.userId, titulo:`Mañana tenés el ${a?.nombre || 'espacio'}`, texto:(a?.franjas[r.franja] || []).join(' a ') + ' h', icon:a?.icon || 'calendar', color:'wood', link:'reservas' })); });
      return n; } },
  { id:'reclamo-72h', n:'Reclamo sin respuesta 72 h → recordar a la Administración', d:'Evita que un reclamo quede olvidado.',
    run(s){ let n = 0; s.reclamos.filter(r => r.estado === 'abierto' && Date.now() - (r.historial.at(-1)?.at || r.createdAt) > 72 * HORA)
      .forEach(r => n += marca(s, 'r72-' + r.id, () => notificar(s, { para:'rol:admin', titulo:'Reclamo sin respuesta hace 3 días', texto:r.titulo, icon:'clipboard', color:'danger', link:'reclamos' }))); return n; } },
  { id:'votacion-cierre', n:'Votación cerrada → publicar el resultado', d:'Al cerrar, publica el resultado en el pizarrón y avisa a todos.',
    run(s){ let n = 0; s.votaciones.filter(v => v.cierra <= Date.now()).forEach(v => n += marca(s, 'vot-' + v.id, () => {
      const votos = Object.values(v.votos), cuenta = v.opciones.map((_, i) => votos.filter(x => x === i).length), max = Math.max(...cuenta, 0);
      const txt = v.opciones.map((o, i) => `${o}: ${cuenta[i]}`).join(' · ');
      publicarSistema(s, 'aviso', `Resultado: ${v.titulo}`, `${votos.length ? `Ganó "${v.opciones[cuenta.indexOf(max)]}". ` : 'No votó ninguna casa. '}${txt}. Votaron ${votos.length} casas.`);
      notificar(s, { para:'todos', titulo:'Cerró una votación', texto:v.titulo, icon:'vote', color:'accent', link:'votaciones' }); })); return n; } },
  { id:'compra-cierre', n:'Compra conjunta cerrada → avisar a los anotados', d:'Cuenta el total y avisa si se llegó a la meta.',
    run(s){ let n = 0; s.compras.filter(c => c.cierra <= Date.now()).forEach(c => n += marca(s, 'cmp-' + c.id, () => {
      const tot = c.anotados.reduce((a, x) => a + (+x.cant || 0), 0);
      notificar(s, { para:[c.creadaPor, ...c.anotados.map(x => x.userId)], titulo:`Cerró: ${c.titulo}`, texto:`${tot} de ${c.meta} ${c.unidad}${tot >= c.meta ? ' · ¡se llegó a la meta!' : ''}`, icon:'cart', color:'brand', link:'compras' }); })); return n; } },
  { id:'paquete-24h', n:'Paquete sin retirar 24 h → recordar al vecino', d:'',
    run(s){ let n = 0; s.paquetes.filter(p => !p.retirado && Date.now() - p.recibido > DIA).forEach(p => n += marca(s, 'paq-' + p.id, () => notificar(s, { para:p.hostId, titulo:'Tu paquete sigue en la garita', texto:p.empresa, icon:'box', color:'wood' }))); return n; } },
  { id:'viaje-regreso', n:'Fin de un viaje → avisar a la guardia', d:'El día que vuelve el vecino, la guardia lo sabe.',
    run(s, hoy){ let n = 0; s.users.filter(u => u.viaje && u.viaje.hasta === hoy).forEach(u => n += marca(s, 'vj-' + u.id + hoy, () => notificar(s, { para:'rol:guardia', titulo:`Hoy vuelve ${u.casa}`, texto:'Termina el aviso de casa sola.', icon:'home', color:'ok', link:'garita' })));
      s.users.filter(u => u.viaje && u.viaje.hasta < hoy).forEach(u => { delete u.viaje; n++; }); return n; } },
  { id:'expensas', n:'Expensas → aviso tres días antes del vencimiento', d:'',
    run(s, hoy){ const v = s.config.expensasVence, d = new Date(); const venc = new Date(d.getFullYear(), d.getMonth(), v); const faltan = Math.round((venc - fechaDe(hoy)) / DIA);
      if (faltan !== 3) return 0; return marca(s, 'exp-' + hoy, () => notificar(s, { para:'todos', titulo:`Las expensas vencen el ${v}`, texto:'Faltan 3 días.', icon:'wallet', color:'wood', link:'expensas' })); } },
  { id:'temporadas', n:'Temporadas → avisar cuando empiezan o están por terminar', d:'Pesca, cubiertas con clavos, ski, cruceros: aviso al empezar y 7 días antes de terminar.',
    run(s, hoy){ let n = 0; s.temporadas.forEach(t => {
      if (hoy.slice(5) === t.desde) n += marca(s, `tmp-i-${t.id}-${hoy}`, () => notificar(s, { para:'todos', titulo:`Empieza: ${t.nombre}`, texto:t.nota, icon:t.icon || 'calendar', color:'sky', link:'ushuaia' }));
      if (enTemporada(t) && diasHasta(t.hasta) === 7) n += marca(s, `tmp-f-${t.id}-${hoy}`, () => notificar(s, { para:'todos', titulo:`Faltan 7 días: ${t.nombre}`, texto:t.nota, icon:t.icon || 'calendar', color:'warn', link:'ushuaia' })); });
      return n; } },
  { id:'feriado', n:'Feriado mañana → aviso y recolección', d:'El día anterior avisa del feriado (la recolección puede cambiar).',
    run(s, hoy){ const f = s.feriados.find(x => x.fecha === sumarDias(hoy, 1)); if (!f || new Date().getHours() < 12) return 0;
      return marca(s, 'fer-' + f.fecha, () => notificar(s, { para:'todos', titulo:`Mañana es feriado: ${f.nombre}`, texto:'La recolección y los horarios de la Administración pueden cambiar.', icon:'calendar', color:'sky', link:'ushuaia' })); } },
  { id:'zorros', n:'Dos avistamientos en el día → alerta de fauna', d:'Si dos vecinos avisan lo mismo en 24 h, se avisa a todos.',
    run(s, hoy){ let n = 0; Object.keys(ESPECIES).forEach(e => { const v = s.avistamientos.filter(a => a.especie === e && Date.now() - a.at < DIA);
      if (v.length >= 2) n += marca(s, `fau-${e}-${hoy}`, () => { publicarSistema(s, 'aviso', `${ESPECIES[e].n} en el barrio`, `Hubo ${v.length} avisos hoy (${[...new Set(v.map(x => x.lugar))].join(', ')}). Guardá la basura en canastos cerrados y no les des de comer.`);
        notificar(s, { para:'todos', titulo:`${ESPECIES[e].n} en el barrio`, texto:`${v.length} avisos hoy`, icon:'paw', color:'warn', link:'pizarron' }); }); }); return n; } },
  { id:'sos-respondedores', n:'SOS médica → avisar a vecinos con RCP', d:'Los vecinos que marcaron "sé primeros auxilios" reciben la alerta médica.', run(){ return 0; } },
  { id:'privacidad', n:`Datos de visitas → borrar a los N días`, d:'Borra DNI y patente de pases y llegadas viejas (Ley 25.326, principio de finalidad).',
    run(s){ const lim = Date.now() - (s.config.datosDias || 90) * DIA; let n = 0;
      s.pases.forEach(p => { if (p.createdAt < lim && (p.dni || p.patente) && !(p.dias && (p.fechaFin || '') >= hoyISO())){ p.dni = ''; p.patente = ''; n++; } });
      s.llegadas.forEach(l => { if (l.at < lim && (l.patente || l.nombre !== '—')){ l.patente = ''; l.nombre = '—'; n++; } });
      s.solicitudesPase.forEach(r => { if (r.at < lim && r.dni){ r.dni = ''; r.patente = ''; n++; } });
      return n; } },
];
const motorActivo = id => Store.s?.config?.motor?.[id] !== false;
function marca(s, clave, fn){ if (s.motorLog[clave]) return 0; s.motorLog[clave] = Date.now(); fn(); return 1; }
function publicarSistema(s, type, title, body){ s.posts.unshift({ id:uid(), type, title, body, autor:'sistema', createdAt:Date.now(), reactions:{}, comments:[] }); }
const Motor = {
  corriendo:false,
  correr(){
    if (this.corriendo || !Store.s || !yo()) return;
    this.corriendo = true;
    try {
      const hoy = hoyISO(); let total = 0;
      const s = Store.s;
      for (const r of REGLAS){ if (!motorActivo(r.id)) continue; try { const n = r.run(s, hoy) || 0; if (n){ total += n; s.motorCuenta = s.motorCuenta || {}; s.motorCuenta[r.id] = (s.motorCuenta[r.id] || 0) + n; } } catch(e){ console.warn('Regla', r.id, e); } }
      /* limpia marcas de más de 60 días */
      const lim = Date.now() - 60 * DIA; for (const k in s.motorLog) if (s.motorLog[k] < lim) delete s.motorLog[k];
      if (total){ Store.guardar(); Store.avisar(false); }
    } finally { this.corriendo = false; }
  },
};

/* ---------- editor genérico de listas ----------
   Todo lo que es propio del barrio se edita con la misma pieza:
   un esquema de campos y una colección del estado. */
const LISTAS = {
  contactos:  { t:'Contactos del barrio', icon:'phone', campos:[['nombre','Nombre'],['detalle','Detalle'],['tel','Teléfono','tel']], titulo:x => x.nombre, sub:x => `${x.detalle || ''} · ${x.tel || 'sin teléfono'}` },
  amenities:  { t:'Espacios comunes', icon:'calendar', campos:[['nombre','Nombre'],['reglas','Reglas','area'],['invitadosMax','Máximo de invitados','number'],['franjasTxt','Turnos (uno por renglón, 12:00-17:00)','area']],
                titulo:x => x.nombre, sub:x => x.franjas.map(f => f.join('–')).join(' · '),
                entrada:x => ({ ...x, franjasTxt:(x.franjas || []).map(f => f.join('-')).join('\n') }),
                salida:(d, x) => ({ ...x, nombre:d.nombre, reglas:d.reglas, invitadosMax:+d.invitadosMax || 0, icon:x.icon || 'calendar', color:x.color || 'brand', id:x.id || 'am' + uid(),
                  franjas:d.franjasTxt.split('\n').map(l => l.trim().split(/\s*[-–a]\s*/)).filter(f => f.length === 2 && /\d{1,2}:\d{2}/.test(f[0]) && /\d{1,2}:\d{2}/.test(f[1])).map(f => f.map(h => h.padStart(5, '0'))) }) },
  temporadas: { t:'Temporadas de Ushuaia', icon:'sun', campos:[['nombre','Nombre'],['desde','Empieza (MM-DD)'],['hasta','Termina (MM-DD)'],['nota','Nota','area']], titulo:x => x.nombre, sub:x => `${x.desde} a ${x.hasta}` },
  feriados:   { t:'Feriados', icon:'calendar', campos:[['fecha','Fecha','date'],['nombre','Nombre']], titulo:x => x.nombre, sub:x => fechaLarga(x.fecha), orden:(a, b) => a.fecha.localeCompare(b.fecha) },
  eventosCiudad:{ t:'Eventos de la ciudad', icon:'calendar', campos:[['titulo','Evento'],['tipo','Tipo'],['fecha','Fecha','date'],['hora','Hora','time'],['lugar','Lugar'],['link','Enlace','url'],['nota','Nota','area']], titulo:x => x.titulo, sub:x => `${fechaCorta(x.fecha)} · ${x.lugar || ''}`, orden:(a, b) => a.fecha.localeCompare(b.fecha) },
  cruceros:   { t:'Recaladas de cruceros', icon:'send', campos:[['fecha','Fecha','date'],['barco','Barco'],['llega','Llega','time'],['sale','Sale','time'],['pasajeros','Pasajeros','number'],['muelle','Muelle']],
                titulo:x => x.barco, sub:x => `${fechaCorta(x.fecha)}${x.llega ? ' · ' + x.llega : ''}${x.pasajeros ? ' · ' + x.pasajeros + ' pasajeros' : ''}`, orden:(a, b) => a.fecha.localeCompare(b.fecha) },
  documentos: { t:'Documentos y normas', icon:'file', campos:[['titulo','Título'],['tipo','Tipo (Reglamento, Convivencia, Acta…)'],['texto','Texto','area-grande'],['link','Enlace al PDF (opcional)','url']], titulo:x => x.titulo, sub:x => x.tipo || '' },
  agenda:     { t:'Agenda de Ushuaia', icon:'phone', campos:[['categoria','Categoría'],['nombre','Nombre'],['detalle','Dirección o detalle'],['tel','Teléfono','tel']], titulo:x => x.nombre, sub:x => `${x.categoria} · ${x.tel || 'sin teléfono'}` },
};
function editorLista(clave, q = ''){
  const L = LISTAS[clave], items = Store.s[clave].slice();
  if (L.orden) items.sort(L.orden);
  const qq = q.toLowerCase();
  const vis = qq ? items.filter(x => JSON.stringify(x).toLowerCase().includes(qq)) : items;
  return `<div class="row" style="margin:6px 0 10px"><b class="grow">${L.t} <span class="muted small">(${items.length})</span></b><button class="btn btn-sm btn-pri" data-a="lista-editar" data-v="${clave}" data-id="">${I('plus')}Agregar</button></div>
    ${items.length > 12 ? `<input placeholder="Filtrar…" data-filtro-lista="${clave}" value="${esc(q)}" style="margin-bottom:10px">` : ''}
    <div class="card lista">${vis.map(x => `<div class="it"><div class="txt"><b>${esc(L.titulo(x))}</b><span>${esc(L.sub(x))}</span></div>
      <button class="icon-btn" data-a="lista-editar" data-v="${clave}" data-id="${x.id}" aria-label="Editar">${I('edit')}</button>
      <button class="icon-btn" data-a="lista-borrar" data-v="${clave}" data-id="${x.id}" aria-label="Borrar">${I('trash')}</button></div>`).join('') || '<p class="muted small">Vacío.</p>'}</div>`;
}
let filtroLista = {};
document.addEventListener('input', e => { const k = e.target.dataset?.filtroLista; if (k){ filtroLista[k] = e.target.value; const pos = e.target.selectionStart; refrescar(); const n = $(`[data-filtro-lista="${k}"]`); if (n){ n.focus(); n.setSelectionRange(pos, pos); } } });
A['lista-editar'] = el => {
  const L = LISTAS[el.dataset.v], x0 = Store.s[el.dataset.v].find(z => z.id === el.dataset.id) || {};
  const x = L.entrada ? L.entrada(x0) : x0;
  hoja(el.dataset.id ? 'Editar' : 'Agregar', `<form data-f="lista-guardar" data-v="${el.dataset.v}" data-id="${el.dataset.id}">
    ${L.campos.map(([k, lab, tipo]) => `<div class="field"><label>${lab}</label>${tipo && tipo.startsWith('area') ? `<textarea name="${k}" ${tipo === 'area-grande' ? 'style="min-height:260px"' : ''}>${esc(x[k] ?? '')}</textarea>` : `<input name="${k}" type="${tipo || 'text'}" value="${esc(x[k] ?? '')}">`}</div>`).join('')}
    <button class="btn btn-pri btn-block">${I('check')}Guardar</button></form>`, { ancho: el.dataset.v === 'documentos' ? '760px' : '' });
};
F['lista-guardar'] = (d, form) => {
  const clave = form.dataset.v, id = form.dataset.id, L = LISTAS[clave];
  Store.cambiar(s => {
    const arr = s[clave], i = arr.findIndex(z => z.id === id), prev = i >= 0 ? arr[i] : { id: clave.slice(0, 3) + uid(), createdAt:Date.now() };
    const nuevo = L.salida ? L.salida(d, prev) : { ...prev, ...d };
    nuevo.updatedAt = Date.now();
    if (i >= 0) arr[i] = nuevo; else arr.push(nuevo);
    auditar(s, `${i >= 0 ? 'Editó' : 'Agregó'} en ${L.t}`, L.titulo(nuevo));
  });
  cerrarHoja(); toast('Guardado', 'check');
};
A['lista-borrar'] = async el => {
  const L = LISTAS[el.dataset.v], x = Store.s[el.dataset.v].find(z => z.id === el.dataset.id); if (!x) return;
  if (!await confirmar('Borrar', `¿Borrar "${esc(L.titulo(x))}"?`, { si:'Borrar', peligro:true })) return;
  Store.cambiar(s => { s[el.dataset.v] = s[el.dataset.v].filter(z => z.id !== el.dataset.id); auditar(s, `Borró en ${L.t}`, L.titulo(x)); });
};

/* ---------- ventana de Administración ---------- */
const PESTANAS_ADMIN = [['resumen','Resumen'],['solicitudes','Inscripciones'],['vecinos','Vecinos'],['contenido','Contenido'],['ajustes','Ajustes'],['motor','Automatizaciones'],['correos','Correos'],['auditoria','Auditoría'],['datos','Datos']];
R.admin = {
  titulo: 'Administración', icon: 'sliders', color: 'accent', ancha: true, sub: 'Todo lo del barrio se maneja desde acá',
  render(p){
    if (!esAdmin()) return vacio('lock', 'Solo para la Administración.');
    const [tab, sub] = String(p || 'resumen').split('|');
    const s = Store.s;
    const pend = s.users.filter(u => u.estado === 'pendiente').length;
    const correosPend = s.correos.filter(c => c.estado !== 'enviado').length;
    const tabs = `<div class="tabs-in">${PESTANAS_ADMIN.map(([k, t]) => `<button class="${k === tab ? 'on' : ''}" data-a="abrir" data-v="admin" data-p="${k}">${t}${k === 'solicitudes' && pend ? `<span class="dot-badge">${pend}</span>` : ''}${k === 'correos' && correosPend ? `<span class="dot-badge">${correosPend}</span>` : ''}</button>`).join('')}</div>`;
    return tabs + (ADMIN_TABS[tab] || ADMIN_TABS.resumen)(sub);
  },
};
const ADMIN_TABS = {
  resumen(){
    const s = Store.s, hoy = hoyISO();
    const ingresos7 = Array.from({ length:7 }, (_, i) => { const d = sumarDias(hoy, i - 6); return { d, n:s.pases.filter(p => p.log?.[d]?.in).length }; });
    const max = Math.max(1, ...ingresos7.map(x => x.n));
    const kpi = (n, t) => `<div class="kpi"><b>${n}</b><span>${t}</span></div>`;
    return `<div class="admin-hero"><b style="font-size:18px">Barrio ${esc(s.config.nombre)}</b><div class="small" style="opacity:.8">${fechaLarga(hoy)}</div>
      <div class="garita-kpis">${kpi(`${casasRegistradas()}/${s.config.casas}`, 'Casas en la app')}${kpi(s.users.filter(u => u.estado === 'pendiente').length, 'Inscripciones')}${kpi(s.reclamos.filter(r => r.estado !== 'resuelto').length, 'Reclamos')}</div>
      <div class="garita-kpis" style="margin-top:8px">${kpi(pasesDelDia().length, 'Visitas hoy')}${kpi(s.reservas.filter(r => r.fecha >= hoy && r.fecha <= sumarDias(hoy, 7) && !r.cancelada).length, 'Reservas 7 días')}${kpi(s.peticiones.filter(p => p.estado === 'pendiente').length, 'Peticiones')}</div></div>
      <div class="card"><b style="font-size:14px">Ingresos por día (últimos 7)</b>
        <div style="display:flex;align-items:flex-end;gap:6px;height:110px;margin-top:12px">${ingresos7.map(x => `<div style="flex:1;text-align:center"><div class="tiny muted">${x.n}</div><div style="height:${x.n / max * 80}px;min-height:3px;background:var(--brand);border-radius:6px 6px 0 0"></div><div class="tiny muted">${DIAS[fechaDe(x.d).getDay()]}</div></div>`).join('')}</div></div>
      <div class="mosaico">
        ${teja({ a:'nuevo-post', v:'aviso', icon:'tack', color:'sky', t:'Comunicado oficial', s:'Suena y llega a todos' })}
        ${teja({ a:'nueva-votacion', icon:'vote', color:'accent', t:'Nueva votación', s:'Un voto por casa' })}
        ${teja({ v:'reclamos', icon:'clipboard', color:'warn', t:'Reclamos', s:'Responder y publicar' })}
        ${teja({ v:'privado', p:'admin', icon:'lock', color:'accent', t:'Mensajes', s:'Conversaciones privadas' })}
        ${teja({ v:'peticiones', icon:'edit', color:'brand', t:'Peticiones', s:'Firmadas a la garita' })}
        ${teja({ v:'garita', icon:'gate', color:'brand', t:'Garita', s:'Ingresos de hoy' })}
        ${teja({ v:'contabilidad', icon:'wallet', color:'wood', t:'Expensas', s:'Gastos, cierre y cobranzas' })}
      </div>`;
  },
  solicitudes(){
    const s = Store.s, pend = s.users.filter(u => u.estado === 'pendiente'), rech = s.users.filter(u => u.estado === 'rechazado');
    const card = u => `<div class="card"><div class="row">${avatar(u)}<div class="grow"><b>${esc(u.nombre)}</b><div class="muted small">${esc(u.casa)} · ${hace(u.createdAt)}</div></div><span class="pill ${u.estado === 'pendiente' ? 'p-warn' : 'p-danger'}">${u.estado}</span></div>
      <div class="small" style="margin:10px 0;color:var(--ink-2)">DNI ${esc(u.dni || '—')} · ${esc(u.email)} · ${esc(u.tel || 'sin teléfono')}${u.consentimiento ? ' · aceptó el uso de datos' : ''}</div>
      ${(() => { const misma = s.users.filter(x => x.id !== u.id && x.casa === u.casa && x.estado === 'aprobado'); return misma.length ? `<div class="small" style="margin-bottom:10px">${I('info')} En ${esc(u.casa)} ya están: ${misma.map(x => esc(x.nombre)).join(', ')}</div>` : ''; })()}
      <div class="btns">${u.estado === 'pendiente' ? `<button class="btn btn-sm btn-ok" data-a="aprobar" data-id="${u.id}">${I('check')}Aprobar y mandar clave</button><button class="btn btn-sm btn-danger-soft" data-a="rechazar" data-id="${u.id}">Rechazar</button>`
        : `<button class="btn btn-sm btn-sec" data-a="reactivar" data-id="${u.id}">Volver a pendiente</button>`}</div></div>`;
    return `${pend.length ? pend.map(card).join('') : vacio('user', 'No hay inscripciones pendientes.')}${rech.length ? sec('Rechazadas') + rech.map(card).join('') : ''}`;
  },
  vecinos(q){
    const s = Store.s, qq = (q || '').toLowerCase();
    const ls = s.users.filter(u => u.estado === 'aprobado' && (!qq || (u.nombre + u.casa + u.email + (u.dni || '')).toLowerCase().includes(qq))).sort((a, b) => a.casa.localeCompare(b.casa, 'es', { numeric:true }));
    return `<form data-f="buscar-vecino-admin" class="linea-form" style="margin-bottom:12px"><input name="q" id="qVecAdm" value="${esc(q || '')}" placeholder="Nombre, casa, email o DNI"><button class="btn btn-pri">${I('search')}</button></form>
      ${superficie({ a:'alta-staff', icon:'plus', color:'accent', t:'Dar de alta guardia o administrador', s:'Cuentas del personal' })}
      ${superficie({ a:'pasar-admin', icon:'key', color:'wood', t:'Pasar la Administración a otro vecino', s:'Por ejemplo, a Paula cuando la app esté andando' })}
      <label class="superficie"><span class="ic ic-brand">${I('upload')}</span><span class="txt"><b>Importar el padrón de propietarios</b>
        <small>${Store.s.padron.length ? `Cargado: ${plural(Store.s.padron.length, 'unidad', 'unidades')}${Store.s.padronPeriodo ? ' · ' + Store.s.padronPeriodo : ''}` : 'Archivo JSON de datos-privados/. Los nombres quedan solo en la base del barrio.'}</small></span>
        <input type="file" accept="application/json" id="importarPadron" hidden></label>
      ${Store.s.padron.length ? `<div class="card plana small"><b>${LOTES.length} lotes</b> · ${lotesVecinos().length} de vecinos y ${LOTES.length - lotesVecinos().length} del hotel y las cabañas · ${casasRegistradas()} con cuenta en la app</div>` : ''}
      <div class="card lista">${ls.map(u => `<div class="it">${avatar(u, 'sm')}<div class="txt"><b>${esc(u.nombre)}</b><span>${esc(u.casa)} · ${esc(u.email)}${u.dni ? ' · DNI ' + esc(u.dni) : ''}</span></div>
        <span class="pill ${u.rol === 'admin' ? 'p-accent' : u.rol === 'guardia' ? 'p-brand' : ''}">${u.rol}</span><button class="icon-btn" data-a="gestionar-vecino" data-id="${u.id}" aria-label="Gestionar">${I('more')}</button></div>`).join('')}</div>`;
  },
  contenido(sub){
    const k = LISTAS[sub] ? sub : 'contactos';
    return `<div class="chips">${Object.entries(LISTAS).map(([c, L]) => `<button class="chip ${c === k ? 'on' : ''}" data-a="abrir" data-v="admin" data-p="contenido|${c}">${I(L.icon)}${L.t}</button>`).join('')}</div>${editorLista(k, filtroLista[k] || '')}`;
  },
  ajustes(){
    const c = Store.s.config;
    const campo = (k, lab, tipo = 'text', ayuda = '') => `<div class="field"><label>${lab}</label><input name="${k}" type="${tipo}" value="${esc(c[k] ?? '')}">${ayuda ? `<div class="ayuda">${ayuda}</div>` : ''}</div>`;
    return `<form data-f="ajustes">
      <div class="card"><h3>El barrio</h3>${campo('nombre', 'Nombre')}${campo('ciudad', 'Ciudad')}<div class="grid2">${campo('casas', 'Cantidad de casas', 'number')}${campo('datosDias', 'Borrar datos de visitas a los (días)', 'number')}</div>
        ${campo('mapa', 'Enlace de Google Maps del acceso', 'url', 'Es el "cómo llegar" que reciben las visitas.')}${campo('dea', 'Dónde está el desfibrilador (DEA)')}</div>
      <div class="card"><h3>Contacto</h3><div class="grid2">${campo('garitaTel', 'Teléfono de la garita', 'tel')}${campo('adminTel', 'Teléfono de la Administración', 'tel')}</div>${campo('adminEmail', 'Email de la Administración (recibe avisos de inscripciones)', 'email')}</div>
      <div class="card"><h3>Residuos</h3><div class="grid3">${[1,2,3,4,5,6,0].map(d => `<div class="field"><label>${DIAS[d]}</label><input name="rec${d}" value="${esc(c.recoleccion[d] || '')}" placeholder="—"></div>`).join('')}</div>
        <div class="grid2">${campo('recoleccionHora', 'Hora del camión', 'time')}${campo('voluminosos', 'Próximo retiro de voluminosos', 'date')}</div>${campo('voluminososDetalle', 'Qué se retira')}</div>
      <div class="card"><h3>Expensas y normas</h3>${campo('expensasUrl', 'Portal de expensas', 'url')}<div class="grid2">${campo('expensasVence', 'Día de vencimiento', 'number')}${campo('silencio', 'Horario de silencio')}</div>${campo('obraHorario', 'Horario de obras')}</div>
      <div class="card"><h3>Expensas</h3><div class="grid3">
        <div class="field"><label>1º vencimiento (día)</label><input name="exp_vto1" type="number" min="1" max="28" value="${c.exp?.vto1 ?? 10}"></div>
        <div class="field"><label>2º vencimiento (día)</label><input name="exp_vto2" type="number" min="1" max="28" value="${c.exp?.vto2 ?? 21}"></div>
        <div class="field"><label>Recargo 2º vto (%)</label><input name="exp_recargo2" type="number" step="0.1" value="${c.exp?.recargo2 ?? 1.5}"></div></div>
        <div class="grid2"><div class="field"><label>Interés mensual por mora (%)</label><input name="exp_interesMensual" type="number" step="0.1" value="${c.exp?.interesMensual ?? 3}"><div class="ayuda">Confirmalo con la administración antes de emitir.</div></div>
          <div class="field"><label>Fondo de Infraestructura por lote</label><input name="exp_fondoFijo" type="number" step="100" value="${c.exp?.fondoFijo ?? 5000}"></div></div>
        <div class="field"><label>Enlace de pago (Mercado Pago, opcional)</label><input name="exp_mpLink" type="url" value="${esc(c.exp?.mpLink || '')}"></div></div>
      <div class="card"><h3>Impositivo (ARCA)</h3>
        <div class="grid2"><div class="field"><label>Condición</label><input name="exp_condicion" value="${esc(c.exp?.condicion || 'Exento')}"></div>
          <div class="field"><label>Ingresos Brutos</label><input name="exp_iibb" value="${esc(c.exp?.iibb || '')}"></div></div>
        <div class="field"><label>Correo del contador</label><input name="exp_contador" type="email" value="${esc(c.exp?.contador || '')}"></div>
        <label class="check"><input type="checkbox" name="exp_empleados" ${c.exp?.empleados ? 'checked' : ''}><span>El barrio tiene personal propio (corresponde F.931 todos los meses)</span></label></div>
      <div class="card"><h3>Correo</h3><p class="muted small" style="margin-top:0">Para que la app mande los mails de inscripción y claves. Instrucciones en <span class="mono">apps-script/Codigo.gs</span>.</p>
        ${campo('correoUrl', 'URL del Apps Script (termina en /exec)', 'url')}${campo('correoClave', 'Frase compartida', 'password')}</div>
      <div class="card"><h3>Vuelos en vivo (opcional)</h3>${campo('vuelosProxy', 'URL del Worker que reenvía OpenSky', 'url', 'Ver CONECTAR.md. Sin esto se muestran igual arribos y partidas.')}</div>
      <button class="btn btn-pri btn-block">${I('check')}Guardar ajustes</button></form>`;
  },
  motor(){
    const s = Store.s;
    return `<p class="muted small" style="margin-top:0">Reglas que la app aplica sola. Hoy corren mientras la app está abierta en algún equipo del barrio; con servidor corren siempre.</p>
      ${REGLAS.map(r => `<div class="card" style="padding:13px 14px"><div class="row"><span class="ic ic-${motorActivo(r.id) ? 'accent' : 'brand'}" style="width:38px;height:38px;border-radius:12px;display:grid;place-items:center;opacity:${motorActivo(r.id) ? 1 : .4}">${I('zap')}</span>
        <div class="grow"><b style="font-size:14px">${esc(r.n.replace('N días', (s.config.datosDias || 90) + ' días'))}</b>${r.d ? `<div class="muted small">${esc(r.d)}</div>` : ''}<div class="tiny muted">${s.motorCuenta?.[r.id] ? `Actuó ${plural(s.motorCuenta[r.id], 'vez', 'veces')}` : 'Todavía no actuó'}</div></div>
        <label class="check" style="margin:0"><input type="checkbox" data-a="regla" data-v="${r.id}" ${motorActivo(r.id) ? 'checked' : ''}></label></div></div>`).join('')}
      <button class="btn btn-sec btn-block" data-a="motor-ahora">${I('zap')}Correr ahora</button>`;
  },
  correos(){
    const cs = Store.s.correos;
    return `${Correo.configurado() ? aviso('ok', 'mail', 'El envío automático está configurado', '') : aviso('warn', 'mail', 'El envío automático no está configurado', 'Los correos quedan acá para mandarlos a mano. Configuralo en Ajustes → Correo.')}
      ${cs.length ? cs.slice(0, 60).map(c => `<div class="card" style="padding:12px 14px"><div class="row"><span class="ic ic-${c.estado === 'enviado' ? 'ok' : c.estado === 'error' ? 'danger' : 'warn'}" style="width:36px;height:36px;border-radius:11px;display:grid;place-items:center">${I('mail')}</span>
        <div class="grow"><b style="font-size:14px">${esc(c.asunto)}</b><div class="muted small">${esc(c.para)} · ${hace(c.at)} · ${c.estado}</div></div>
        ${c.estado !== 'enviado' ? `<button class="btn btn-xs btn-sec" data-a="correo-manual" data-id="${c.id}">${I('send')}Mandar</button>` : ''}</div></div>`).join('') : vacio('mail', 'No hay correos.')}`;
  },
  auditoria(){
    const a = Store.s.auditoria.slice(0, 200);
    return `<p class="muted small" style="margin-top:0">Registro de las acciones sensibles: altas, bajas, peticiones firmadas, cambios de contenido y recordatorios. No se puede editar desde la app.</p>
      <div class="card lista">${a.length ? a.map(x => `<div class="it"><div class="txt"><b>${esc(x.accion)}</b><span>${esc(x.detalle || '')} · ${esc(autorVisible(x.por).nombre)} · ${fechaHora(x.at)}</span></div></div>`).join('') : '<p class="muted small">Vacío.</p>'}</div>
      <button class="btn btn-sec btn-block" data-a="exportar-auditoria">${I('download')}Descargar auditoría (CSV)</button>`;
  },
  datos(){
    return `<div class="card"><h3>Copia de seguridad</h3><p class="muted small">Mientras la app funcione sin servidor, los datos viven en este equipo. Descargá una copia seguido.</p>
      <div class="btns"><button class="btn btn-pri" data-a="exportar">${I('download')}Descargar copia</button><label class="btn btn-sec">${I('upload')}Restaurar copia<input type="file" accept="application/json" id="importar" hidden></label></div></div>
      <div class="card"><h3>Volver a la demo</h3><p class="muted small">Borra todo y carga otra vez los datos de muestra.</p><button class="btn btn-danger-soft" data-a="reiniciar">${I('refresh')}Reiniciar datos</button></div>`;
  },
};
A['regla'] = el => { setTimeout(() => { Store.cambiar(s => { s.config.motor = s.config.motor || {}; s.config.motor[el.dataset.v] = el.checked; }); }, 0); return true; };
A['motor-ahora'] = () => { Motor.correr(); toast('Motor ejecutado', 'zap'); refrescar(); };
F['buscar-vecino-admin'] = d => abrir('admin', 'vecinos|' + (d.q || ''));
F['ajustes'] = d => {
  Store.cambiar(s => {
    const c = s.config;
    ['nombre','ciudad','mapa','dea','garitaTel','adminTel','adminEmail','recoleccionHora','voluminosos','voluminososDetalle','expensasUrl','silencio','obraHorario','correoUrl','correoClave','vuelosProxy'].forEach(k => { if (k in d) c[k] = String(d[k]).trim(); });
    ['casas','datosDias','expensasVence'].forEach(k => { if (d[k] !== '') c[k] = +d[k]; });
    c.exp = Object.assign({}, c.exp || {});
    ['vto1','vto2','recargo2','interesMensual','fondoFijo'].forEach(k => { if (d['exp_' + k] !== undefined && d['exp_' + k] !== '') c.exp[k] = +d['exp_' + k]; });
    ['mpLink','condicion','iibb','contador'].forEach(k => { if (d['exp_' + k] !== undefined) c.exp[k] = String(d['exp_' + k]).trim(); });
    c.exp.empleados = !!d.exp_empleados;
    c.recoleccion = {}; [0,1,2,3,4,5,6].forEach(i => { const v = String(d['rec' + i] || '').trim(); if (v) c.recoleccion[i] = v; });
    auditar(s, 'Cambió los ajustes del barrio', '');
  });
  toast('Ajustes guardados', 'check');
};
A['aprobar'] = async el => {
  const u = Store.s.users.find(x => x.id === el.dataset.id); if (!u) return;
  const nube = typeof Nube !== 'undefined' && Nube.activa();
  const clave = nube ? '' : generarClave(u.rol === 'guardia' ? 'GAR' : u.rol === 'admin' ? 'ADM' : 'VEC');
  Store.cambiar(s => { const x = s.users.find(z => z.id === u.id); x.estado = 'aprobado'; x.clave = clave; x.aprobadoAt = Date.now(); auditar(s, 'Aprobó una inscripción', `${x.nombre} · ${x.casa}`, x.id); });
  const salio = await Correo.enviar({ para:u.email, asunto:'Tu acceso al barrio está aprobado', tipo:'clave',
    html:Correo.plantilla('¡Bienvenido/a al barrio!', `<p>Hola ${esc(u.nombre.split(' ')[0])}: la Administración aprobó tu inscripción para <b>${esc(u.casa)}</b>.</p>` +
      (nube ? `<p>Ya podés entrar con tu email y la contraseña que elegiste al inscribirte.</p>`
        : `<p>Entrás con tu email y esta clave:</p><p style="font-family:monospace;font-size:26px;font-weight:800;letter-spacing:3px;background:#dcefec;color:#0d6b66;padding:12px 16px;border-radius:10px;display:inline-block">${clave}</p><p style="font-size:13px">Es personal: no la compartas.</p>`),
      { texto:'Entrar a la app', url:urlApp() }) });
  const msg = nube ? `Hola ${u.nombre.split(' ')[0]}, ya tenés acceso a la app del barrio ${Store.s.config.nombre}. Entrá con tu email y tu contraseña: ${urlApp()}`
    : `Hola ${u.nombre.split(' ')[0]}, ya tenés acceso a la app del barrio ${Store.s.config.nombre}. Entrá con tu email y la clave ${clave}: ${urlApp()}`;
  hoja('Inscripción aprobada', `${aviso(salio ? 'ok' : 'warn', salio ? 'mail' : 'info', salio ? 'Le avisamos por correo' : 'El correo quedó en la bandeja de salida', salio ? u.email : 'Avisale por WhatsApp:')}
    ${clave ? `<div class="codigo-grande">${clave}</div>` : ''}
    <div class="btns">${u.tel ? `<a class="btn btn-wa" href="${waLink(u.tel, msg)}" target="_blank" rel="noopener">${I('phone')}WhatsApp</a>` : ''}<button class="btn btn-sec" data-a="copiar" data-v="${esc(msg)}">${I('copy')}Copiar mensaje</button></div>`);
};
A['rechazar'] = async el => {
  if (!await confirmar('Rechazar inscripción', 'La persona no va a poder entrar a la app.', { si:'Rechazar', peligro:true })) return;
  const u = Store.s.users.find(x => x.id === el.dataset.id);
  Store.cambiar(s => { const x = s.users.find(z => z.id === el.dataset.id); x.estado = 'rechazado'; auditar(s, 'Rechazó una inscripción', `${x.nombre} · ${x.casa}`, x.id); });
  if (u) Correo.enviar({ para:u.email, asunto:'Tu inscripción al barrio', tipo:'rechazo', html:Correo.plantilla('Sobre tu inscripción', `<p>Hola ${esc(u.nombre.split(' ')[0])}: no pudimos aprobar tu inscripción. Comunicate con la Administración del barrio para revisarla.</p>`) });
};
A['reactivar'] = el => Store.cambiar(s => { const x = s.users.find(z => z.id === el.dataset.id); x.estado = 'pendiente'; });
A['gestionar-vecino'] = el => {
  const u = Store.s.users.find(x => x.id === el.dataset.id); if (!u) return;
  hoja(u.nombre, `<form data-f="gestionar-vecino" data-id="${u.id}">
    <div class="grid2"><div class="field"><label>Casa</label><input name="casa" value="${esc(u.casa)}"></div><div class="field"><label>Rol</label><select name="rol">${['vecino','guardia','admin'].map(r => `<option ${u.rol === r ? 'selected' : ''}>${r}</option>`).join('')}</select></div></div>
    <div class="field"><label>Email</label><input name="email" type="email" value="${esc(u.email)}"></div>
    <button class="btn btn-pri btn-block">${I('check')}Guardar</button></form>
    <div class="btns" style="margin-top:10px"><button class="btn btn-sec" data-a="nueva-clave" data-id="${u.id}">${I('key')}Nueva clave</button><button class="btn btn-danger-soft" data-a="baja-vecino" data-id="${u.id}">${I('trash')}Dar de baja</button></div>`);
};
F['gestionar-vecino'] = (d, form) => { Store.cambiar(s => { const x = s.users.find(z => z.id === form.dataset.id); Object.assign(x, { casa:d.casa.trim(), rol:d.rol, email:d.email.trim().toLowerCase() }); auditar(s, 'Editó un vecino', `${x.nombre} · ${x.casa} · ${x.rol}`, x.id); }); cerrarHoja(); toast('Guardado', 'check'); };
A['nueva-clave'] = el => { const c = generarClave(); Store.cambiar(s => { const x = s.users.find(z => z.id === el.dataset.id); x.clave = c; auditar(s, 'Generó una clave nueva', x.nombre, x.id); }); hoja('Clave nueva', `<div class="codigo-grande">${c}</div><button class="btn btn-sec btn-block" data-a="copiar" data-v="${c}">${I('copy')}Copiar</button>`); };
A['baja-vecino'] = async el => {
  if (!await confirmar('Dar de baja', 'Se borran sus datos personales, sus mensajes privados y sus pases. Lo que publicó en el pizarrón queda sin nombre.', { si:'Dar de baja', peligro:true })) return;
  Store.cambiar(s => { const x = s.users.find(z => z.id === el.dataset.id); auditar(s, 'Dio de baja a un vecino', `${x.nombre} · ${x.casa}`, x.id);
    s.privados = s.privados.filter(h => h.userId !== x.id); s.pases = s.pases.filter(p => p.hostId !== x.id); s.users = s.users.filter(z => z.id !== x.id); });
  cerrarHoja(); toast('Vecino dado de baja', 'trash');
};
/* Traspaso de la Administración. Se puede quedar más de un administrador; lo
   que no se puede es dejar el barrio sin ninguno. */
A['pasar-admin'] = () => {
  const yoId = yo().id;
  const gente = Store.s.users.filter(u => u.estado === 'aprobado' && u.id !== yoId).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  if (!gente.length){ toast('Todavía no hay otra cuenta aprobada en el barrio', 'users'); return; }
  hoja('Pasar la Administración', `<form data-f="pasar-admin">
    <p class="muted small" style="margin:0 0 12px">La persona que elijas pasa a tener el panel completo: inscripciones, datos del barrio, reclamos, expensas y auditoría.</p>
    <div class="field"><label>¿A quién?</label><select name="id" required>${gente.map(u => `<option value="${u.id}">${esc(u.nombre)} · ${esc(u.casa)}${u.rol !== 'vecino' ? ' (' + u.rol + ')' : ''}</option>`).join('')}</select></div>
    <label class="check"><input type="checkbox" name="dejar"><span>Además, dejo de ser Administración y paso a ser vecino/a de mi lote</span></label>
    <button class="btn btn-pri btn-block" style="margin-top:12px">${I('key')}Pasar la Administración</button>
    <p class="muted tiny" style="margin:10px 0 0">Queda asentado en la auditoría, con fecha y hora.</p></form>`);
};
F['pasar-admin'] = async d => {
  const yoId = yo().id, nuevo = usuario(d.id);
  if (!nuevo) return;
  if (!await confirmar('Pasar la Administración', `${esc(nuevo.nombre)} va a poder administrar todo el barrio${d.dejar ? ', y vos pasás a ser vecino/a' : ''}.`, { si:'Sí, pasarla' })) return;
  Store.cambiar(s => {
    const n = s.users.find(x => x.id === d.id);
    n.rol = 'admin'; n.estado = 'aprobado';
    if (d.dejar){
      const quedan = s.users.filter(x => x.rol === 'admin' && x.id !== yoId).length;
      if (quedan >= 1) s.users.find(x => x.id === yoId).rol = 'vecino';
    }
    notificar(s, { para:d.id, titulo:'Ahora sos Administración del barrio', texto:'Ya tenés el panel completo en la app.', icon:'shield', color:'accent', link:'admin', sonido:true });
    auditar(s, 'Pasó la Administración', `${nuevo.nombre} (${nuevo.casa})${d.dejar ? ' · quien la pasó quedó como vecino' : ''}`, d.id);
  });
  cerrarHoja();
  toast(`${nuevo.nombre.split(' ')[0]} ya es Administración`, 'shield');
  if (d.dejar) pintar();
};
A['alta-staff'] = () => hoja('Alta de personal', `<form data-f="alta-staff"><div class="field"><label>Nombre</label><input name="nombre" required></div>
  <div class="grid2"><div class="field"><label>Rol</label><select name="rol"><option value="guardia">Guardia</option><option value="admin">Administración</option></select></div><div class="field"><label>DNI</label><input name="dni" inputmode="numeric"></div></div>
  <div class="field"><label>Email</label><input name="email" type="email" required></div><button class="btn btn-pri btn-block">Crear y generar clave</button></form>`);
F['alta-staff'] = d => {
  const clave = generarClave(d.rol === 'guardia' ? 'GAR' : 'ADM');
  Store.cambiar(s => { s.users.push({ id:'u' + uid(), nombre:d.nombre.trim(), casa: d.rol === 'guardia' ? 'Garita' : 'Administración', dni:soloDigitos(d.dni), email:d.email.trim().toLowerCase(), rol:d.rol, estado:'aprobado', clave, createdAt:Date.now() });
    auditar(s, 'Dio de alta personal', `${d.nombre} · ${d.rol}`); });
  hoja('Cuenta creada', `<p class="small">Entra con <b>${esc(d.email)}</b> y esta clave:</p><div class="codigo-grande">${clave}</div><button class="btn btn-sec btn-block" data-a="copiar" data-v="${clave}">${I('copy')}Copiar</button>`);
};
A['correo-manual'] = el => {
  const c = Store.s.correos.find(x => x.id === el.dataset.id); if (!c) return;
  const tmp = document.createElement('div'); tmp.innerHTML = c.html;
  const texto = tmp.innerText.replace(/\n{3,}/g, '\n\n').trim();
  window.open(`mailto:${encodeURIComponent(c.para)}?subject=${encodeURIComponent(c.asunto)}&body=${encodeURIComponent(texto)}`);
  Store.cambiar(s => { const x = s.correos.find(z => z.id === c.id); x.estado = 'enviado'; x.manual = true; });
};
A['exportar'] = () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(Store.s)], { type:'application/json' })); a.download = `bahia-cauquen-${hoyISO()}.json`; a.click(); };
A['exportar-auditoria'] = () => {
  const csv = 'fecha,accion,detalle,por\n' + Store.s.auditoria.map(x => [new Date(x.at).toISOString(), x.accion, x.detalle, autorVisible(x.por).nombre].map(v => `"${String(v || '').replace(/"/g, '""')}"`).join(',')).join('\n');
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type:'text/csv' })); a.download = `auditoria-${hoyISO()}.csv`; a.click();
};
document.addEventListener('change', async e => {
  if (e.target.id === 'importarPadron' && e.target.files[0]){
    try {
      const j = JSON.parse(await e.target.files[0].text());
      const us = j.unidades || j;
      if (!Array.isArray(us) || !us[0].lote) throw 0;
      Store.cambiar(s => {
        s.padron = us.map(x => ({ id:'lote-' + x.lote, uf:x.uf, lote:String(x.lote), propietario:x.propietario || '', coef:x.coef, expensasAgosto:x.expensasAgosto || 0 }));
        s.padronPeriodo = j.periodo || '';
        auditar(s, 'Importó el padrón de propietarios', `${us.length} unidades · ${j.periodo || ''}`);
      });
      toast(`Padrón cargado: ${us.length} unidades`, 'check');
    } catch(err){ toast('Ese archivo no tiene el formato del padrón', 'alert'); }
    e.target.value = ''; return;
  }
  if (e.target.id !== 'importar' || !e.target.files[0]) return;
  try { const j = JSON.parse(await e.target.files[0].text()); if (j.v !== 3 || !Array.isArray(j.users)) throw 0;
    if (!await confirmar('Restaurar copia', 'Se reemplazan todos los datos de este equipo por los de la copia.', { si:'Restaurar', peligro:true })) return;
    Store.s = j; migrar(Store.s); Store.guardar(); Store.avisar(false); toast('Copia restaurada', 'upload');
  } catch(err){ toast('Ese archivo no es una copia válida', 'alert'); }
});
A['reiniciar'] = async () => {
  if (!await confirmar('Reiniciar datos', 'Se borra todo lo de este equipo y vuelve la demo.', { si:'Reiniciar', peligro:true })) return;
  const quien = Store.sesion.userId;
  Store.s = seed(); migrar(Store.s); Store.guardar();
  if (!Store.s.users.find(u => u.id === quien)) Store.sesion.userId = null;
  Store.guardarSesion(); PILA.length = 0; $('#app').innerHTML = ''; pintar();
};
