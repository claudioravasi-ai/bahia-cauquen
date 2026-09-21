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
      const vol = volsProximos().some(v => v.fecha === sumarDias(hoy, 1));
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
  /* ---- el calendario de las expensas, que corre solo todos los meses ---- */
  { id:'expensas-cerrar', n:'Expensas → recordarle a la Administración que cierre el mes',
    d:'Cinco días antes del primer vencimiento, si el mes todavía está en borrador.',
    run(s, hoy){
      const per = periodoHoy(), vto = vtoDe(per, 1), faltan = Math.round((fechaDe(vto) - fechaDe(hoy)) / DIA);
      if (faltan !== 5 || liquidacionDe(per)?.estado === 'emitida') return 0;
      return marca(s, 'expcerrar-' + per, () => notificar(s, { para:'rol:admin', titulo:`Falta cerrar ${nombrePeriodo(per)}`,
        texto:`El primer vencimiento es el ${fechaCorta(vto)} y todavía no se emitieron los cupones.`, icon:'zap', color:'warn', link:'contabilidad:cierre', sonido:true })); } },

  { id:'expensas-aviso', n:'Expensas → aviso tres días antes del primer vencimiento',
    d:'A todos los vecinos, por aviso en la app.',
    run(s, hoy){
      const per = periodoHoy(); if (liquidacionDe(per)?.estado !== 'emitida') return 0;
      const vto = vtoDe(per, 1), faltan = Math.round((fechaDe(vto) - fechaDe(hoy)) / DIA);
      if (faltan !== 3) return 0;
      return marca(s, 'expaviso-' + per, () => notificar(s, { para:'todos', titulo:`Las expensas vencen el ${fechaCorta(vto)}`,
        texto:'Faltan 3 días. Podés ver tu cupón y pagar desde la app.', icon:'wallet', color:'wood', link:'expensas' })); } },

  { id:'expensas-vence-hoy', n:'Expensas → aviso el día del primer vencimiento',
    d:'Solo a los lotes que todavía tienen saldo.',
    run(s, hoy){
      const per = periodoHoy(); if (liquidacionDe(per)?.estado !== 'emitida') return 0;
      if (vtoDe(per, 1) !== hoy) return 0;
      const deben = s.users.filter(u => u.estado === 'aprobado' && u.rol === 'vecino' && saldoLote(u.casa) > 0.5).map(u => u.id);
      if (!deben.length) return 0;
      return marca(s, 'expvto1-' + per, () => notificar(s, { para:deben, titulo:'Hoy vencen las expensas',
        texto:`Después de hoy se suma el recargo del ${cfgExp().recargo2} %.`, icon:'wallet', color:'warn', link:'expensas', sonido:true })); } },

  { id:'expensas-impaga', n:'Expensas → reclamo por correo al día siguiente del segundo vencimiento',
    d:'A cada lote con saldo, con el detalle de lo que debe. Queda asentado en la auditoría.',
    run(s, hoy){
      const per = periodoHoy(); if (liquidacionDe(per)?.estado !== 'emitida') return 0;
      if (sumarDias(vtoDe(per, 2), 1) !== hoy) return 0;
      return marca(s, 'expimpaga-' + per, () => {
        const conDeuda = (typeof LOTES === 'undefined' ? [] : LOTES).filter(L => saldoLote('Lote ' + L.lote) > 0.5);
        conDeuda.forEach(L => {
          const casa = 'Lote ' + L.lote, saldo = saldoLote(casa);
          const us = s.users.filter(u => u.casa === casa && u.estado === 'aprobado');
          if (us.length) notificar(s, { para:us.map(u => u.id), titulo:`Tu cuenta de expensas quedó con saldo`,
            texto:`${plata(saldo)} al ${fechaCorta(hoy)}. Si ya pagaste, informalo desde la app.`, icon:'alert', color:'danger', link:'expensas', sonido:true });
          const p = s.padron.find(x => x.lote === L.lote);
          const mail = p?.email || us.find(u => u.email)?.email;
          if (mail) Correo.enviar({ para:mail, asunto:`Expensas impagas · ${casa}`, tipo:'reclamo-expensas',
            html:Correo.plantilla('Tu cuenta de expensas quedó con saldo',
              `<p>Al ${fechaCorta(hoy)}, la cuenta de <b>${esc(casa)}</b> registra un saldo de:</p>
               <p style="font-size:26px;font-weight:800;color:#b91c1c;margin:14px 0">${plata(saldo)}</p>
               <p>Venció el segundo plazo de ${nombrePeriodo(per)} (${fechaCorta(vtoDe(per, 2))}). A partir de ahora corre un interés del ${cfgExp().interesMensual} % mensual sobre el saldo impago.</p>
               <p>Si ya lo abonaste, informalo desde la app con el comprobante y la Administración lo confirma.</p>`,
              { texto:'Ver mi cuenta', url:urlApp('expensas') }) });
        });
        if (conDeuda.length) auditar(s, 'Reclamo automático de expensas', `${nombrePeriodo(per)} · ${conDeuda.length} lotes`);
      }); } },
  { id:'temporadas', n:'Temporadas → avisar cuando empiezan o están por terminar', d:'Pesca, cubiertas con clavos, ski, cruceros: aviso al empezar y 7 días antes de terminar.',
    run(s, hoy){ let n = 0; s.temporadas.forEach(t => {
      if (hoy.slice(5) === t.desde) n += marca(s, `tmp-i-${t.id}-${hoy}`, () => notificar(s, { para:'todos', titulo:`Empieza: ${t.nombre}`, texto:t.nota, icon:t.icon || 'calendar', color:'sky', link:'ushuaia' }));
      if (enTemporada(t) && diasHasta(t.hasta) === 7) n += marca(s, `tmp-f-${t.id}-${hoy}`, () => notificar(s, { para:'todos', titulo:`Faltan 7 días: ${t.nombre}`, texto:t.nota, icon:t.icon || 'calendar', color:'warn', link:'ushuaia' })); });
      return n; } },
  { id:'feriado', n:'Feriado mañana → aviso y recolección', d:'El día anterior avisa del feriado (la recolección puede cambiar).',
    run(s, hoy){ const man = sumarDias(hoy, 1), info = diaInfo(man);
      const f = info.feriado || info.noLaborable; if (!f || new Date().getHours() < 12) return 0;
      return marca(s, 'fer-' + f.fecha, () => notificar(s, { para:'todos',
        titulo: info.feriado ? `Mañana es feriado ${f.ambito}: ${f.nombre}` : `Mañana es día no laborable: ${f.nombre}`,
        texto:'La recolección, la Administración y los comercios pueden cambiar sus horarios.', icon:'calendar', color:'sky', link:'ushuaia' })); } },
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
  /* Solo lo provincial, lo municipal y los puentes: los nacionales y los
     religiosos los calcula la app sola y no se cargan a mano. */
  feriados:   { t:'Feriados provinciales, municipales y puentes', icon:'calendar',
                campos:[['fecha','Fecha','date'],['nombre','Nombre'],['ambito','Ámbito (provincial, municipal, nacional)'],
                        ['tipo','Tipo (inamovible, trasladable, no laborable, puente turístico)'],['nota','Nota o fuente','area']],
                titulo:x => x.nombre, sub:x => `${fechaLarga(x.fecha)} · ${x.ambito || 'nacional'}${x.aConfirmar ? ' · a confirmar' : ''}`,
                orden:(a, b) => a.fecha.localeCompare(b.fecha),
                salida:(d, x) => ({ ...x, ...d, laborable:/no laborable|puente/i.test(d.tipo || ''), aConfirmar:false }) },
  eventosCiudad:{ t:'Eventos de la ciudad', icon:'calendar', campos:[['titulo','Evento'],['tipo','Tipo'],['fecha','Fecha','date'],['hora','Hora','time'],['lugar','Lugar'],['link','Enlace','url'],['nota','Nota','area']], titulo:x => x.titulo, sub:x => `${fechaCorta(x.fecha)} · ${x.lugar || ''}`, orden:(a, b) => a.fecha.localeCompare(b.fecha) },
  cruceros:   { t:'Recaladas de cruceros', icon:'send', campos:[['fecha','Fecha','date'],['barco','Barco'],['llega','Llega','time'],['sale','Sale','time'],['pasajeros','Pasajeros','number'],['muelle','Muelle']],
                titulo:x => x.barco, sub:x => `${fechaCorta(x.fecha)}${x.llega ? ' · ' + x.llega : ''}${x.pasajeros ? ' · ' + x.pasajeros + ' pasajeros' : ''}`, orden:(a, b) => a.fecha.localeCompare(b.fecha) },
  documentos: { t:'Documentos y normas', icon:'file', campos:[['titulo','Título'],['tipo','Tipo (Reglamento, Convivencia, Acta…)'],['texto','Texto','area-grande'],['link','Enlace al PDF (opcional)','url']], titulo:x => x.titulo, sub:x => x.tipo || '' },
  descargas:  { t:'Descargas', icon:'download', campos:[['titulo','Título'],['detalle','Descripción'],
                ['tipo','Tipo (app, doc, planilla, enlace)'],['url','Dirección (https://…)','url'],['texto','Texto, si es un documento propio','area']],
                titulo:x => x.titulo, sub:x => `${(TIPOS_DESCARGA[x.tipo] || {}).n || 'Documento'}${x.url ? ' · ' + x.url : ' · sin dirección'}` },
  promos:     { t:'Promociones del Hotel Los Cauquenes y beneficios', icon:'star', campos:[['titulo','Título'],['detalle','Detalle'],
                ['descuento','Descuento para vecinos (ej: 20 %)'],['desde','Desde','date'],['hasta','Hasta','date'],['url','Enlace','url']],
                titulo:x => x.titulo, sub:x => `${x.descuento ? x.descuento + ' · ' : ''}${x.desde ? fechaCorta(x.desde) : ''}${x.hasta ? ' a ' + fechaCorta(x.hasta) : ''}`,
                orden:(a, b) => String(a.desde || '').localeCompare(String(b.desde || '')) },
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
        ${teja({ v:'cobranzas', icon:'wallet', color:'wood', t:'Expensas y cobranzas', s:'Cupones, pagos y morosos' })}
        ${teja({ v:'contabilidad', icon:'file', color:'brand', t:'Contabilidad', s:'Gastos, cierre y ARCA' })}
      </div>`;
  },
  solicitudes(){
    const s = Store.s, pend = s.users.filter(u => u.estado === 'pendiente'), rech = s.users.filter(u => u.estado === 'rechazado');
    const card = u => `<div class="card">${esCorreoGarita(u.email) ? `<div class="pill p-brand" style="margin-bottom:8px">${I('shield')}Cuenta de la GARITA · al aprobarla ve solo lo de la garita</div>` : ''}<div class="row">${avatar(u)}<div class="grow"><b>${esc(u.nombre)}</b><div class="muted small">${esc(u.casa)} · ${hace(u.createdAt)}</div></div><span class="pill ${u.estado === 'pendiente' ? 'p-warn' : 'p-danger'}">${u.estado}</span></div>
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
      ${superficie({ v:'padron', icon:'users', color:'brand', t:'Padrón de propietarios',
        s: Store.s.padron.length ? `${plural(Store.s.padron.length, 'unidad', 'unidades')} · buscá por apellido, lote, calle o DNI` : 'Todavía sin cargar: subí la planilla de expensas' })}
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
        <div class="grid2">${campo('recoleccionHora', 'Hora del camión', 'time')}${campo('voluminososDetalle', 'Qué se retira en los voluminosos')}</div>
        <div class="card plana small" style="margin:0">${I('info')} Las fechas de los retiros de voluminosos se anotan en <b>Residuos</b>, una por una: ahí se pueden cargar todas las del año.
          <div class="btns" style="margin-top:10px"><button type="button" class="btn btn-xs btn-sec" data-a="abrir" data-v="recoleccion">${I('truck')}Ir a Residuos</button></div></div></div>
      <div class="card"><h3>Convivencia</h3><div class="grid2">${campo('silencio', 'Horario de silencio')}${campo('obraHorario', 'Horario de obras')}</div></div>
      <div class="card plana small">${I('info')} Los vencimientos, el recargo, el interés, el CBU y lo impositivo se configuran en <b>Contabilidad → Parámetros</b>, junto a las expensas.
        <div class="btns" style="margin-top:10px"><button type="button" class="btn btn-xs btn-sec" data-a="abrir" data-v="contabilidad" data-p="parametros">${I('right')}Ir a Parámetros</button></div></div>
      <div class="card"><h3>Correo</h3><p class="muted small" style="margin-top:0">Para que la app mande los mails de inscripción y claves. Instrucciones en <span class="mono">apps-script/Codigo.gs</span>.</p>
        ${campo('correoUrl', 'URL del Apps Script (termina en /exec)', 'url')}${campo('correoClave', 'Frase compartida', 'password')}</div>
      <div class="card"><h3>Promociones del Hotel Los Cauquenes (opcional)</h3>
        <p class="muted small" style="margin-top:0">Las promociones se cargan a mano en <b>Contenido → Promociones</b> y eso ya funciona. Esto es solo si querés que se lean solas del sitio del Hotel Los Cauquenes: hace falta un programita propio que las devuelva en JSON (está explicado en CONECTAR.md), porque el navegador no puede leer otra web directamente.</p>
        ${campo('promosUrl', 'Dirección del lector de promociones', 'url')}</div>
      <div class="card"><h3>Aviones en vivo (opcional)</h3>${campo('vuelosProxy', 'URL del Worker que reenvía ADS-B', 'url', 'Ver CONECTAR.md. Arribos y partidas se leen solos del tablero del aeropuerto: esto es solo para ver los aviones que están en el aire.')}</div>
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
    const hoy = hoyISO();
    const salidosHoy = cs.filter(c => c.estado === 'enviado' && isoDe(new Date(c.at)) === hoy).length;
    return `${Correo.configurado() ? aviso('ok', 'mail', 'El envío automático está configurado', `Salieron ${plural(salidosHoy, 'correo')} hoy.`) : aviso('warn', 'mail', 'El envío automático no está configurado', 'Los correos quedan acá para mandarlos a mano. Configuralo en Ajustes → Correo, siguiendo CORREO.md.')}
      ${superficie({ a:'circular', icon:'send', color:'accent', t:'Escribirles a los vecinos', s:'Una circular del barrio, a todos o a quien elijas', cls:'acento' })}
      ${sec('Historial')}
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
    ['nombre','ciudad','mapa','dea','garitaTel','adminTel','adminEmail','recoleccionHora','voluminososDetalle','silencio','obraHorario','correoUrl','correoClave','vuelosProxy','promosUrl'].forEach(k => { if (k in d) c[k] = String(d[k]).trim(); });
    ['casas','datosDias'].forEach(k => { if (d[k] !== '' && d[k] !== undefined) c[k] = +d[k]; });
    c.recoleccion = {}; [0,1,2,3,4,5,6].forEach(i => { const v = String(d['rec' + i] || '').trim(); if (v) c.recoleccion[i] = v; });
    auditar(s, 'Cambió los ajustes del barrio', '');
  });
  toast('Ajustes guardados', 'check');
};
A['aprobar'] = async el => {
  const u = Store.s.users.find(x => x.id === el.dataset.id); if (!u) return;
  const nube = typeof Nube !== 'undefined' && Nube.activa();
  const clave = nube ? '' : generarClave(u.rol === 'guardia' ? 'GAR' : u.rol === 'admin' ? 'ADM' : 'VEC');
  const garita = esCorreoGarita(u.email);
  if (garita && !await confirmar('Aprobar la cuenta de la garita', `Esta cuenta (${esc(u.email)}) va a ver todo lo de la garita: ingresos, paquetes, peticiones y datos de contacto de los vecinos. Aprobala solo si la inscribiste vos o la guardia te lo confirmó.`, { si:'Aprobar como garita' })) return;
  Store.cambiar(s => { const x = s.users.find(z => z.id === u.id); x.estado = 'aprobado'; x.clave = clave; x.aprobadoAt = Date.now();
    if (garita){ x.rol = 'guardia'; x.casa = 'Garita'; x.nombre = 'Garita'; }
    auditar(s, garita ? 'Aprobó la cuenta de la garita' : 'Aprobó una inscripción', `${x.nombre} · ${x.casa}`, x.id); });
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
    const f = e.target.files[0];
    try {
      const { us, periodo } = leerPadron(await f.text(), f.name);
      if (!us.length) throw new Error('No encontré ninguna unidad');
      /* Lo que ya estaba cargado no se pierde: si la planilla nueva no trae
         correo o teléfono de un lote, se conserva el que había. */
      const antes = {}; Store.s.padron.forEach(x => antes[x.lote] = x);
      const fusion = us.map(x => {
        const v = antes[x.lote] || {};
        return { ...v, ...Object.fromEntries(Object.entries(x).filter(([k, val]) => val !== '' && val !== 0 || v[k] === undefined)) };
      });
      const sinNombre = fusion.filter(x => !x.propietario).length;
      Store.cambiar(s => {
        s.padron = fusion;
        s.padronPeriodo = periodo || s.padronPeriodo || '';
        auditar(s, 'Importó el padrón de propietarios', `${fusion.length} unidades${periodo ? ' · ' + periodo : ''}`);
      });
      toast(`Padrón cargado: ${plural(fusion.length, 'unidad', 'unidades')}${sinNombre ? ` (${sinNombre} sin propietario)` : ''}`, 'check');
      abrir('padron');
    } catch(err){ toast('No pude leer ese archivo: ' + err.message, 'alert'); }
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

/* =========================================================
   PADRÓN DE PROPIETARIOS
   -------------------------------------------------------
   El padrón llega de la liquidación de expensas: puede venir como JSON
   (el que arma la app) o como CSV, que es lo que sale de guardar el Excel
   de la administración con "Guardar como → CSV". Una vez cargado, se puede
   buscar por apellido, nombre, lote, UF, calle, DNI, correo o teléfono, y
   cada ficha muestra la cuenta de expensas de ese lote y si el propietario
   ya tiene cuenta en la app.
   ========================================================= */

/* Nombres de columna que se aceptan, en el orden en que se prueban. */
const COLS_PADRON = {
  uf:          ['uf','unidad','unidad funcional','u.f.','ufunc'],
  lote:        ['lote','lotes','nro lote','numero de lote','n° lote'],
  propietario: ['propietario','titular','apellido y nombre','apellido y nombres','nombre y apellido','nombre','razon social','razón social'],
  dni:         ['dni','documento','cuit','cuil','dni/cuit'],
  direccion:   ['direccion','dirección','domicilio','calle','domicilio real','calle y numero','calle y número'],
  email:       ['email','e-mail','correo','mail','correo electronico','correo electrónico'],
  tel:         ['tel','telefono','teléfono','celular','cel','whatsapp','movil','móvil'],
  coef:        ['coef','coeficiente','porcentaje','%','prorrateo'],
  deuda:       ['deuda','saldo','saldo anterior','deuda anterior'],
  expensas:    ['expensas','expensa','importe','total','total cupon','total cupón','monto'],
};
const sinAcentos = t => String(t ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
const numeroAR = v => {
  const t = String(v ?? '').replace(/[^\d,.\-]/g, '');
  if (!t) return 0;
  /* 1.234.567,89 (argentino) contra 1,234,567.89 (inglés): manda el último separador. */
  const coma = t.lastIndexOf(','), punto = t.lastIndexOf('.');
  const limpio = coma > punto ? t.replace(/\./g, '').replace(',', '.') : t.replace(/,/g, '');
  return parseFloat(limpio) || 0;
};

/* Una línea de CSV, respetando las comillas y los ; o , como separador. */
function filasCSV(texto){
  const sep = (texto.split('\n')[0].match(/;/g) || []).length > (texto.split('\n')[0].match(/,/g) || []).length ? ';' : ',';
  const filas = []; let campo = '', fila = [], enComillas = false;
  for (let i = 0; i < texto.length; i++){
    const c = texto[i];
    if (enComillas){
      if (c === '"' && texto[i + 1] === '"'){ campo += '"'; i++; }
      else if (c === '"') enComillas = false;
      else campo += c;
    } else if (c === '"') enComillas = true;
    else if (c === sep){ fila.push(campo); campo = ''; }
    else if (c === '\n'){ fila.push(campo); filas.push(fila); fila = []; campo = ''; }
    else if (c !== '\r') campo += c;
  }
  if (campo || fila.length){ fila.push(campo); filas.push(fila); }
  return filas.filter(f => f.some(x => String(x).trim()));
}

/* De un archivo (JSON o CSV) a la lista de unidades del padrón. */
function leerPadron(texto, nombreArchivo = ''){
  let periodo = '';
  if (/^\s*[\{\[]/.test(texto)){
    const j = JSON.parse(texto);
    const lista = j.unidades || j.padron || (Array.isArray(j) ? j : null);
    if (!Array.isArray(lista)) throw new Error('El JSON no trae una lista de unidades');
    return { us: lista.map(normalizarUnidad), periodo: j.periodo || '' };
  }
  const filas = filasCSV(texto);
  if (filas.length < 2) throw new Error('El CSV no tiene filas');
  /* La fila de encabezados puede no ser la primera: se busca la que tenga "lote". */
  let iCab = filas.findIndex(f => f.some(c => COLS_PADRON.lote.includes(sinAcentos(c))));
  if (iCab < 0) iCab = 0;
  const cab = filas[iCab].map(sinAcentos);
  const indice = {};
  for (const clave in COLS_PADRON){
    const i = cab.findIndex(c => COLS_PADRON[clave].includes(c));
    if (i >= 0) indice[clave] = i;
  }
  if (indice.lote === undefined) throw new Error('No encontré la columna "Lote"');
  const m = nombreArchivo.match(/(20\d\d)[-_ ]?(0[1-9]|1[0-2])/);
  if (m) periodo = m[1] + '-' + m[2];
  const us = filas.slice(iCab + 1).map(f => {
    const g = k => indice[k] === undefined ? '' : String(f[indice[k]] ?? '').trim();
    return normalizarUnidad({ uf:g('uf'), lote:g('lote'), propietario:g('propietario'), dni:g('dni'),
      direccion:g('direccion'), email:g('email'), tel:g('tel'),
      coef:numeroAR(g('coef')), deuda:numeroAR(g('deuda')), expensas:numeroAR(g('expensas')) });
  }).filter(x => x.lote);
  return { us, periodo };
}
function normalizarUnidad(x){
  const lote = String(x.lote ?? '').trim().replace(/^lote\s*/i, '');
  const L = typeof LOTES !== 'undefined' ? LOTES.find(l => l.lote.toUpperCase() === lote.toUpperCase()) : null;
  return {
    id: 'lote-' + lote,
    uf: String(x.uf || L?.uf || lote).trim(),
    lote,
    propietario: String(x.propietario || '').trim(),
    dni: soloDigitos(x.dni || ''),
    direccion: String(x.direccion || x.calle || '').trim(),
    email: String(x.email || '').trim().toLowerCase(),
    tel: String(x.tel || '').trim(),
    coef: +x.coef || L?.coef || 0,
    deuda: +x.deuda || 0,
    expensasAgosto: +x.expensas || +x.expensasAgosto || 0,
  };
}

/* Todo lo que se puede escribir en el buscador para encontrar una unidad. */
const textoPadron = p => sinAcentos([p.propietario, 'lote ' + p.lote, p.lote, 'uf ' + p.uf, p.uf, p.direccion, p.dni, p.email, p.tel].join(' '));
function buscarPadron(q){
  const ps = Store.s.padron.slice().sort((a, b) => String(a.lote).localeCompare(String(b.lote), 'es', { numeric:true }));
  const palabras = sinAcentos(q).split(/\s+/).filter(Boolean);
  if (!palabras.length) return ps;
  return ps.filter(p => { const t = textoPadron(p); return palabras.every(w => t.includes(w)); });
}
const cuentaDeApp = p => Store.s.users.find(u => u.estado === 'aprobado' && (u.casa === 'Lote ' + p.lote || (p.email && (u.email || '').toLowerCase() === p.email)));

R.padron = {
  titulo: 'Padrón de propietarios', icon: 'users', color: 'brand', ancha: true,
  sub: 'Buscá por apellido, nombre, lote, UF, calle, DNI, correo o teléfono',
  render(q){
    if (!esAdmin()) return vacio('lock', 'Solo para la Administración.');
    const s = Store.s;
    if (!s.padron.length) return `${aviso('warn', 'upload', 'Todavía no cargaste el padrón',
      'Sin padrón, la app conoce los 152 lotes y sus coeficientes pero no sabe de quién es cada uno. Se carga una sola vez y se actualiza cuando cambia un propietario.')}
      ${cajaImportarPadron()}
      ${superficie({ a:'padron-modelo', icon:'download', color:'sky', t:'Bajar el modelo de planilla', s:'Un CSV con las columnas que espera la app, ya con los 152 lotes' })}`;
    const ls = buscarPadron(q || '');
    const conCuenta = s.padron.filter(cuentaDeApp).length;
    const conMail = s.padron.filter(p => p.email).length;
    return `<form data-f="buscar-padron" class="linea-form" style="margin-bottom:12px">
        <input name="q" id="qPadron" value="${esc(q || '')}" placeholder="Ej: Pérez, Lote 42, Los Ñires, 27123456, @gmail"><button class="btn btn-pri">${I('search')}</button></form>
      <div class="garita-kpis"><div class="kpi"><b>${s.padron.length}</b><span>Unidades</span></div>
        <div class="kpi"><b>${conCuenta}</b><span>Con cuenta en la app</span></div>
        <div class="kpi"><b>${conMail}</b><span>Con correo cargado</span></div></div>
      ${s.padronPeriodo ? `<div class="card plana small">${I('info')} Cargado de la liquidación de <b>${esc(nombrePeriodo(s.padronPeriodo))}</b>.</div>` : ''}
      <div class="muted small" style="margin:0 2px 8px">${plural(ls.length, 'unidad', 'unidades')}${q ? ' que coinciden' : ''}</div>
      ${ls.slice(0, 200).map(p => { const u = cuentaDeApp(p), saldo = saldoLote('Lote ' + p.lote);
        return `<button class="superficie" data-a="ficha-lote" data-v="${esc(p.lote)}">
          <span class="ic ic-${saldo > .5 ? 'danger' : u ? 'ok' : 'brand'}">${I(u ? 'user' : 'home')}</span>
          <span class="txt"><b>${esc(p.propietario || 'Sin propietario cargado')}</b>
            <small>Lote ${esc(p.lote)} · UF ${esc(p.uf)}${p.direccion ? ' · ' + esc(p.direccion) : ''}${u ? ' · tiene cuenta' : ''}${saldo > .5 ? ' · debe ' + plata(saldo) : ''}</small></span>${I('right')}</button>`;
      }).join('') || vacio('search', 'Nadie coincide con esa búsqueda.')}
      ${ls.length > 200 ? `<p class="muted small center">Se muestran las primeras 200. Afiná la búsqueda.</p>` : ''}
      ${sec('Mantenimiento')}
      ${cajaImportarPadron()}
      ${superficie({ a:'exportar-padron', icon:'download', color:'sky', t:'Descargar el padrón (CSV)', s:'Para editarlo en Excel y volver a subirlo' })}`;
  },
};
const cajaImportarPadron = () => `<label class="superficie acento"><span class="ic">${I('upload')}</span>
  <span class="txt"><b>${Store.s.padron.length ? 'Actualizar el padrón' : 'Cargar el padrón'}</b>
  <small>Archivo CSV (Excel → Guardar como CSV) o JSON. Los nombres quedan solo en la base del barrio.</small></span>
  <input type="file" accept=".csv,.json,text/csv,application/json" id="importarPadron" hidden></label>`;
F['buscar-padron'] = d => abrir('padron', d.q || '');

A['ficha-lote'] = el => {
  const lote = el.dataset.v, p = Store.s.padron.find(x => x.lote === lote) || { lote };
  const u = cuentaDeApp(p), cuenta = cuentaLote('Lote ' + lote), L = typeof LOTES !== 'undefined' ? LOTES.find(l => l.lote === lote) : null;
  const dato = (t, v, accion = '') => v ? `<div class="it"><div class="txt"><b>${t}</b><span>${esc(v)}</span></div>${accion}</div>` : '';
  hoja(`Lote ${esc(lote)}`, `
    <div class="card" style="margin-bottom:10px"><b style="font-size:17px">${esc(p.propietario || 'Sin propietario cargado')}</b>
      <div class="muted small">UF ${esc(p.uf || '—')}${L ? ` · coeficiente ${L.coef.toFixed(4)} %` : ''}${L?.grupo && L.grupo !== 'vecino' ? ` · ${L.grupo}` : ''}</div></div>
    <div class="card lista">
      ${dato('Dirección', p.direccion)}
      ${dato('DNI / CUIT', p.dni)}
      ${dato('Correo', p.email, p.email ? `<button class="btn btn-xs btn-sec" data-a="copiar" data-v="${esc(p.email)}">${I('copy')}</button>` : '')}
      ${dato('Teléfono', p.tel, p.tel ? `<a class="btn btn-xs btn-wa" href="${waLink(p.tel)}" target="_blank" rel="noopener">${I('phone')}</a>` : '')}
      <div class="it"><div class="txt"><b>Cuenta en la app</b><span>${u ? esc(u.nombre) + ' · ' + esc(u.email) : 'Todavía no tiene'}</span></div></div>
      <div class="it"><div class="txt"><b>Saldo de expensas</b><span>${cuenta.movs.length ? plural(cuenta.movs.length, 'movimiento') : 'sin movimientos'}</span></div>
        <b class="num" style="color:${cuenta.saldo > .5 ? 'var(--danger)' : 'var(--ok)'}">${plata(Math.max(0, cuenta.saldo))}</b></div>
    </div>
    <div class="btns">
      <button class="btn btn-sm btn-sec" data-a="ver-cuenta" data-v="Lote ${esc(lote)}">${I('eye')}Ver la cuenta</button>
      ${cuenta.saldo > .5 ? `<button class="btn btn-sm btn-sec" data-a="certificado-deuda" data-v="Lote ${esc(lote)}">${I('file')}Certificado</button>` : ''}
      ${u ? `<button class="btn btn-sm btn-pri" data-a="gestionar-vecino" data-id="${u.id}">${I('user')}Su cuenta</button>`
          : p.email ? `<button class="btn btn-sm btn-pri" data-a="invitar-propietario" data-v="${esc(lote)}">${I('mail')}Invitarlo a la app</button>` : ''}
      <button class="btn btn-sm btn-sec" data-a="editar-lote" data-v="${esc(lote)}">${I('edit')}Editar</button>
    </div>`);
};
A['editar-lote'] = el => {
  const p = Store.s.padron.find(x => x.lote === el.dataset.v) || { lote:el.dataset.v };
  hoja(`Editar Lote ${esc(p.lote)}`, `<form data-f="editar-lote" data-v="${esc(p.lote)}">
    <div class="field"><label>Propietario</label><input name="propietario" value="${esc(p.propietario || '')}" maxlength="80"></div>
    <div class="grid2"><div class="field"><label>UF</label><input name="uf" value="${esc(p.uf || '')}"></div>
      <div class="field"><label>DNI / CUIT</label><input name="dni" inputmode="numeric" value="${esc(p.dni || '')}"></div></div>
    <div class="field"><label>Dirección dentro del barrio</label><input name="direccion" value="${esc(p.direccion || '')}" placeholder="Ej: Los Ñires 3333, calle 3"></div>
    <div class="grid2"><div class="field"><label>Correo</label><input name="email" type="email" value="${esc(p.email || '')}"></div>
      <div class="field"><label>Teléfono</label><input name="tel" inputmode="tel" value="${esc(p.tel || '')}"></div></div>
    <button class="btn btn-pri btn-block">${I('check')}Guardar</button></form>`);
};
F['editar-lote'] = (d, form) => {
  const lote = form.dataset.v;
  Store.cambiar(s => {
    const i = s.padron.findIndex(x => x.lote === lote);
    const base = i >= 0 ? s.padron[i] : normalizarUnidad({ lote });
    const nuevo = { ...base, ...d, dni:soloDigitos(d.dni), email:(d.email || '').trim().toLowerCase() };
    if (i >= 0) s.padron[i] = nuevo; else s.padron.push(nuevo);
    auditar(s, 'Editó el padrón', `Lote ${lote} · ${d.propietario || ''}`);
  });
  cerrarHoja(); toast('Guardado', 'check');
};
A['invitar-propietario'] = async el => {
  const p = Store.s.padron.find(x => x.lote === el.dataset.v);
  if (!p || !p.email){ toast('Ese lote no tiene correo cargado', 'alert'); return; }
  const salio = await Correo.enviar({ para:p.email, asunto:`Te invitamos a la app del barrio ${Store.s.config.nombre}`, tipo:'invitacion',
    html:Correo.plantilla('La app del barrio', `<p>Hola${p.propietario ? ' ' + esc(p.propietario.split(',')[0].split(' ')[0]) : ''}: ya está andando la app del barrio <b>${esc(Store.s.config.nombre)}</b>.</p>
      <p>Con ella autorizás visitas con QR, reservás el quincho, ves tus expensas y recibís los avisos de la guardia. Tu lote es el <b>${esc(p.lote)}</b>.</p>
      <p>Para entrar, inscribite con este enlace y la Administración te habilita.</p>`, { texto:'Inscribirme', url:urlApp() }) });
  cerrarHoja();
  toast(salio ? 'Invitación enviada' : 'Quedó en la bandeja de salida de Correos', salio ? 'mail' : 'clock');
};
A['exportar-padron'] = () => {
  const cab = ['uf','lote','propietario','dni','direccion','email','tel','coef','deuda'];
  const csv = cab.join(';') + '\n' + Store.s.padron.map(p => cab.map(k => `"${String(p[k] ?? '').replace(/"/g, '""')}"`).join(';')).join('\n');
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + csv], { type:'text/csv;charset=utf-8' }));
  a.download = `padron-${Store.s.config.nombre.toLowerCase().replace(/\s+/g, '-')}-${hoyISO()}.csv`; a.click();
};
A['padron-modelo'] = () => {
  const cab = ['uf','lote','propietario','dni','direccion','email','tel','coef','deuda'];
  const filas = LOTES.map(L => [L.uf, L.lote, '', '', '', '', '', L.coef, 0]);
  const csv = cab.join(';') + '\n' + filas.map(f => f.map(v => `"${v}"`).join(';')).join('\n');
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + csv], { type:'text/csv;charset=utf-8' }));
  a.download = 'modelo-padron-bahia-cauquen.csv'; a.click();
  toast('Completá la columna "propietario" y volvé a subirlo', 'download');
};


/* =========================================================
   CIRCULARES: la Administración le escribe a los vecinos
   -------------------------------------------------------
   El correo del barrio sale desde acá, con el membrete de la app y el pie
   de la Ley 25.326. Se elige a quién y la app arma la lista sola.

   Ojo con el tope de Gmail: una casilla común manda unos 100 por día. Por
   eso la pantalla dice de antemano a cuántos va a salir, y si son muchos
   los manda de a poco para que Google no los frene.
   ========================================================= */
const DESTINOS_CIRCULAR = {
  vecinos:   { n:'Todos los vecinos con cuenta', d:'Los que ya entraron a la app',
               lista: () => Store.s.users.filter(u => u.estado === 'aprobado' && u.rol === 'vecino' && u.email).map(u => ({ email:u.email, nombre:u.nombre, casa:u.casa })) },
  padron:    { n:'Todos los propietarios del padrón', d:'Tengan cuenta o no',
               lista: () => Store.s.padron.filter(p => p.email).map(p => ({ email:p.email, nombre:p.propietario, casa:'Lote ' + p.lote })) },
  sinCuenta: { n:'Los que todavía no tienen cuenta', d:'Para invitarlos a usar la app',
               lista: () => Store.s.padron.filter(p => p.email && !cuentaDeApp(p)).map(p => ({ email:p.email, nombre:p.propietario, casa:'Lote ' + p.lote })) },
  morosos:   { n:'Los lotes con deuda', d:'Para el reclamo de expensas',
               lista: () => (typeof LOTES === 'undefined' ? [] : LOTES).filter(L => saldoLote('Lote ' + L.lote) > 0.5)
                 .map(L => { const p = Store.s.padron.find(x => x.lote === L.lote) || {};
                   const u = Store.s.users.find(z => z.casa === 'Lote ' + L.lote && z.estado === 'aprobado' && z.email);
                   return { email:p.email || u?.email || '', nombre:p.propietario || u?.nombre || '', casa:'Lote ' + L.lote, saldo:saldoLote('Lote ' + L.lote) }; })
                 .filter(x => x.email) },
  staff:     { n:'Guardia y Administración', d:'El personal del barrio',
               lista: () => Store.s.users.filter(u => u.estado === 'aprobado' && u.rol !== 'vecino' && u.email).map(u => ({ email:u.email, nombre:u.nombre, casa:u.casa })) },
  uno:       { n:'Un lote en particular', d:'Elegís cuál', lista: () => [] },
};
A['circular'] = () => {
  const cuentas = Object.fromEntries(Object.entries(DESTINOS_CIRCULAR).map(([k, D]) => [k, D.lista().length]));
  hoja('Escribirles a los vecinos', `<form data-f="circular">
    <div class="field"><label>¿A quiénes?</label>
      <select name="destino" id="circDestino">${Object.entries(DESTINOS_CIRCULAR).map(([k, D]) =>
        `<option value="${k}">${D.n}${k !== 'uno' ? ` (${cuentas[k]})` : ''}</option>`).join('')}</select>
      <div class="ayuda">Solo entran los que tienen correo cargado. Los que no, se pueden completar en el Padrón.</div></div>
    <div class="field"><label>Si elegiste un lote, ¿cuál?</label>
      <input name="lote" list="lotesCirc" placeholder="Ej: Lote 42"><datalist id="lotesCirc">${(typeof LOTES === 'undefined' ? [] : LOTES).map(L => `<option>Lote ${L.lote}</option>`).join('')}</datalist></div>
    <div class="field"><label>Asunto</label><input name="asunto" required maxlength="120" placeholder="Ej: Corte de agua programado"></div>
    <div class="field"><label>Mensaje</label><textarea name="cuerpo" required style="min-height:200px" placeholder="Escribilo como se lo dirías a un vecino. Cada renglón en blanco separa un párrafo."></textarea>
      <div class="ayuda">Se manda con el membrete del barrio y el pie de la Ley 25.326. Si escribís <b>{nombre}</b> o <b>{lote}</b>, la app los reemplaza en cada correo.</div></div>
    <label class="check"><input type="checkbox" name="pizarron" checked><span>Publicarlo también en el pizarrón de la app</span></label>
    <label class="check"><input type="checkbox" name="aviso" checked><span>Avisarles dentro de la app (suena y aparece en Avisos)</span></label>
    <button class="btn btn-pri btn-block btn-grande" style="margin-top:14px">${I('send')}Continuar</button>
    ${Correo.configurado() ? '' : `<p class="muted tiny" style="margin:10px 0 0">${I('info')} El envío automático no está configurado: los correos van a quedar en la bandeja de salida para mandarlos a mano. El aviso dentro de la app sale igual.</p>`}</form>`,
    { ancho:'620px' });
};
F['circular'] = async d => {
  const D = DESTINOS_CIRCULAR[d.destino];
  let gente = D.lista();
  if (d.destino === 'uno'){
    const lote = (d.lote || '').trim();
    if (!/^Lote\s/i.test(lote)){ toast('Escribí el lote, por ejemplo "Lote 42"', 'alert'); return; }
    const p = Store.s.padron.find(x => 'Lote ' + x.lote === lote) || {};
    const us = Store.s.users.filter(u => u.casa === lote && u.estado === 'aprobado' && u.email);
    gente = [...us.map(u => ({ email:u.email, nombre:u.nombre, casa:lote })),
             ...(p.email && !us.some(u => u.email.toLowerCase() === p.email) ? [{ email:p.email, nombre:p.propietario, casa:lote }] : [])];
  }
  /* Un mismo correo puede estar en el padrón y en una cuenta: se manda una vez. */
  const vistos = new Set();
  gente = gente.filter(x => { const e = (x.email || '').toLowerCase(); if (!e || vistos.has(e)) return false; vistos.add(e); return true; });
  if (!gente.length){ toast('No hay nadie con correo cargado en ese grupo', 'alert'); return; }

  const cuerpo = String(d.cuerpo || '').trim();
  const previa = gente[0];
  const armar = x => cuerpo.replace(/\{nombre\}/g, (x.nombre || '').split(/[ ,]/)[0] || 'vecino/a').replace(/\{lote\}/g, x.casa || '');
  const html = x => Correo.plantilla(d.asunto, armar(x).split(/\n\s*\n/).map(pp => `<p>${esc(pp).replace(/\n/g, '<br>')}</p>`).join(''),
    { texto:'Abrir la app del barrio', url:urlApp() });

  const ok = await confirmar('Revisá antes de mandar', `
    <b>${esc(d.asunto)}</b><br>
    Va a salir a <b>${plural(gente.length, 'persona')}</b> (${esc(D.n.toLowerCase())}).<br><br>
    <span style="display:block;max-height:180px;overflow:auto;background:var(--surface-2);border-radius:12px;padding:12px;font-size:13px;white-space:pre-wrap">${esc(armar(previa))}</span>
    <span class="tiny" style="display:block;margin-top:8px;opacity:.8">Así lo va a ver ${esc(previa.nombre || previa.email)}.</span>
    ${gente.length > 80 ? '<br><b style="color:var(--warn)">Son más de 80: Gmail puede frenar los últimos. Conviene mandarlos en dos días o subir el tope en el Apps Script.</b>' : ''}`,
    { si:`Mandar a ${gente.length}` });
  if (!ok) return;
  cerrarHoja();

  if (d.pizarron || d.aviso){
    Store.cambiar(s => {
      if (d.pizarron) publicarSistema(s, 'aviso', d.asunto, cuerpo.replace(/\{nombre\}/g, 'vecino/a').replace(/\{lote\}/g, 'tu lote'));
      if (d.aviso) notificar(s, { para:'todos', titulo:d.asunto, texto:cuerpo.slice(0, 140), icon:'mail', color:'sky', link:'pizarron', sonido:true });
      auditar(s, 'Mandó una circular', `${d.asunto} · ${gente.length} destinatarios`);
    });
  }

  /* De a diez, con una pausa: así Gmail no lo toma por un envío masivo. */
  let salieron = 0;
  toast(`Mandando a ${gente.length}…`, 'send');
  for (let i = 0; i < gente.length; i += 10){
    const tanda = gente.slice(i, i + 10);
    const r = await Promise.all(tanda.map(x => Correo.enviar({ para:x.email, asunto:d.asunto, tipo:'circular', html:html(x) })));
    salieron += r.filter(Boolean).length;
    if (i + 10 < gente.length) await new Promise(res => setTimeout(res, 800));
  }
  toast(salieron ? `Salieron ${plural(salieron, 'correo')}` : 'Quedaron en la bandeja de salida', salieron ? 'mail' : 'clock');
  refrescar();
};

/* =========================================================
   COMUNICADOS — el lado de la Administración
   Crear, y sobre todo VER quién respondió. Cada comunicado lleva su propio
   conteo: abre, cierra y cuenta lo suyo, sin mezclarse con los demás.
   ========================================================= */
R.comunicados = {
  titulo: 'Comunicados importantes', icon: 'tack', color: 'danger', ancha: true,
  sub: 'Salen como ventana, suenan y piden acuse de recibo',
  render(){
    if (!esAdmin()) return vacio('lock', 'Solo para la Administración.');
    const s = Store.s, hoy = hoyISO();
    const cs = (s.comunicados || []).slice().sort((a, b) => b.at - a.at);
    const vivos = cs.filter(c => !c.archivado && (!c.vence || c.vence >= hoy));
    const viejos = cs.filter(c => c.archivado || (c.vence && c.vence < hoy));
    const card = c => {
      const alcance = c.para === 'todos'
        ? Store.s.users.filter(u => u.estado === 'aprobado' && u.rol === 'vecino').length
        : Store.s.users.filter(u => u.estado === 'aprobado' && u.casa === c.para).length;
      const vistos = (c.vistos || []).length;
      const resp = Object.entries(c.respuestas || {});
      const van = resp.filter(([, r]) => r.va), noVan = resp.filter(([, r]) => !r.va);
      const lotesTotal = c.para === 'todos' ? (typeof LOTES !== 'undefined' ? LOTES.length : totalLotes()) : 1;
      return `<div class="card">
        <div class="row" style="align-items:flex-start">
          <span class="ic ic-${c.tipo === 'reunion' ? 'accent' : 'danger'}" style="width:42px;height:42px;border-radius:13px;display:grid;place-items:center;flex:none">${I(c.tipo === 'reunion' ? 'calendar' : 'tack')}</span>
          <div class="grow"><b style="font-size:16px">${esc(c.titulo)}</b>
            <div class="muted small">${c.para === 'todos' ? 'Todo el barrio' : esc(c.para)} · ${hace(c.at)}${c.vence ? ' · vence ' + fechaCorta(c.vence) : ''}</div></div>
          <span class="pill ${c.tipo === 'reunion' ? 'p-accent' : 'p-danger'}">${c.tipo === 'reunion' ? 'Invitación' : 'Aviso'}</span></div>
        <p class="small" style="color:var(--ink-2);white-space:pre-wrap;margin:10px 0 0">${esc(c.texto)}</p>
        ${c.tipo === 'reunion' && c.fecha ? `<div class="card plana small" style="margin:10px 0 0">${I('calendar')} ${fechaLarga(c.fecha)}${c.hora ? ' · ' + esc(c.hora) + ' h' : ''}${c.lugar ? ' · ' + esc(c.lugar) : ''}</div>` : ''}
        ${c.tipo === 'reunion' ? `
          <div class="garita-kpis" style="margin-top:12px">
            <div class="kpi"><b style="color:var(--ok)">${van.length}</b><span>Lotes que van</span></div>
            <div class="kpi"><b style="color:var(--danger)">${noVan.length}</b><span>No pueden</span></div>
            <div class="kpi"><b>${Math.max(0, lotesTotal - resp.length)}</b><span>Sin responder</span></div></div>
          ${resp.length ? `<div class="chips">${van.map(([lote]) => `<span class="chip" style="background:var(--ok-soft);color:var(--ok);border-color:transparent">${I('check')}${esc(lote)}</span>`).join('')}
            ${noVan.map(([lote]) => `<span class="chip" style="background:var(--danger-soft);color:var(--danger);border-color:transparent">${esc(lote)}</span>`).join('')}</div>` : ''}`
        : `<div class="muted small" style="margin-top:10px">${I('eye')} Lo acusaron ${vistos} de ${alcance} cuentas</div>`}
        <div class="btns" style="margin-top:10px">
          ${c.tipo === 'reunion' ? `<button class="btn btn-sm btn-sec" data-a="comunicado-lista" data-id="${c.id}">${I('users')}Ver lote por lote</button>` : ''}
          <button class="btn btn-sm btn-sec" data-a="comunicado-repetir" data-id="${c.id}">${I('refresh')}Volver a mostrarlo</button>
          <button class="btn btn-sm btn-danger-soft" data-a="comunicado-cerrar" data-id="${c.id}">${c.archivado ? 'Cerrado' : 'Cerrar'}</button></div></div>`;
    };
    return `${superficie({ a:'nuevo-comunicado', icon:'plus', color:'danger', t:'Nuevo comunicado importante', s:'Sale como ventana, suena y pide acuse', cls:'acento' })}
      ${aviso('info', 'info', 'Usalo poco', 'Un comunicado importante interrumpe lo que el vecino esté haciendo. Si se usa para todo, deja de significar algo. Lo común va al pizarrón.')}
      ${vivos.length ? sec('Activos') + vivos.map(card).join('') : vacio('tack', 'No hay comunicados activos.')}
      ${viejos.length ? sec('Cerrados') + viejos.slice(0, 10).map(card).join('') : ''}`;
  },
};
A['nuevo-comunicado'] = () => {
  const lotes = (typeof LOTES !== 'undefined' ? LOTES : []).map(l => 'Lote ' + l.lote);
  hoja('Nuevo comunicado importante', `<form data-f="comunicado">
    <div class="field"><label>¿A quién?</label>
      <select name="para" required><option value="todos">A todo el barrio</option>${lotes.map(l => `<option value="${esc(l)}">Solo a ${esc(l)}</option>`).join('')}</select>
      <div class="ayuda">Si elegís un lote, lo ven todas las cuentas de ese lote y nadie más.</div></div>
    <div class="field"><label>¿Qué tipo?</label>
      <select name="tipo" required><option value="aviso">Aviso · solo acusar recibo</option><option value="reunion">Invitación · con "voy / no puedo"</option></select></div>
    <div class="field"><label>Título</label><input name="titulo" required maxlength="110" placeholder="Ej: Reunión extraordinaria del barrio"></div>
    <div class="field"><label>Mensaje</label><textarea name="texto" required maxlength="900" style="min-height:130px" placeholder="Ej: El lunes próximo hay reunión extraordinaria. Tema: pavimento y asfalto."></textarea></div>
    <div class="grid3">
      <div class="field"><label>Fecha (si es reunión)</label><input type="date" name="fecha" min="${hoyISO()}"></div>
      <div class="field"><label>Hora</label><input type="time" name="hora"></div>
      <div class="field"><label>Deja de mostrarse</label><input type="date" name="vence" min="${hoyISO()}" value="${sumarDias(hoyISO(), 30)}"></div></div>
    <div class="field"><label>Lugar</label><input name="lugar" maxlength="80" placeholder="Ej: SUM del barrio"></div>
    <label class="check"><input type="checkbox" name="mail"><span>Mandarlo también por correo</span></label>
    <button class="btn btn-pri btn-block btn-grande" style="margin-top:14px">${I('send')}Publicar el comunicado</button>
    <p class="muted tiny" style="margin:10px 0 0">Aparece como ventana en la app de cada vecino, suena una vez y no se va hasta que lo acusan. Queda asentado en la auditoría.</p></form>`, { ancho:'620px' });
};
F['comunicado'] = async d => {
  const id = uid(), esReunion = d.tipo === 'reunion';
  Store.cambiar(s => {
    s.comunicados.unshift({ id, titulo:d.titulo.trim(), texto:d.texto.trim(), para:d.para, tipo:d.tipo,
      fecha:d.fecha || '', hora:d.hora || '', lugar:(d.lugar || '').trim(), vence:d.vence || '',
      creadoPor:yo().id, at:Date.now(), respuestas:{}, vistos:[] });
    notificar(s, { para: d.para === 'todos' ? 'todos' : s.users.filter(u => u.casa === d.para && u.estado === 'aprobado').map(u => u.id),
      titulo: (esReunion ? 'Invitación: ' : 'Comunicado: ') + d.titulo.trim(), texto:d.texto.trim().slice(0, 120),
      icon: esReunion ? 'calendar' : 'tack', color:'danger', link:'pizarron', urgente:true });
    auditar(s, 'Publicó un comunicado importante', `${d.para} · ${d.titulo.trim()}`);
  });
  cerrarHoja();
  toast('Comunicado publicado', 'tack');
  if (d.mail){
    const gente = d.para === 'todos'
      ? Store.s.users.filter(u => u.estado === 'aprobado' && u.email)
      : Store.s.users.filter(u => u.casa === d.para && u.estado === 'aprobado' && u.email);
    for (const u of gente){
      await Correo.enviar({ para:u.email, asunto:d.titulo.trim(), tipo:'comunicado',
        html:Correo.plantilla(d.titulo.trim(),
          `<p>${esc(d.texto.trim()).replace(/\n/g, '<br>')}</p>` +
          (esReunion && d.fecha ? `<p><b>${fechaLarga(d.fecha)}${d.hora ? ' · ' + esc(d.hora) + ' h' : ''}</b>${d.lugar ? '<br>' + esc(d.lugar) : ''}</p>` : ''),
          { texto: esReunion ? 'Confirmar si voy' : 'Abrir la app', url:urlApp() }) });
    }
  }
};
A['comunicado-repetir'] = el => {
  Store.cambiar(s => { const c = s.comunicados.find(x => x.id === el.dataset.id); if (c){ c.vistos = []; c.at = Date.now(); c.archivado = false; } });
  toast('Va a volver a aparecer en todas las pantallas', 'refresh');
};
A['comunicado-cerrar'] = async el => {
  if (!await confirmar('Cerrar el comunicado', 'Deja de mostrarse. El conteo de respuestas se conserva.', { si:'Cerrar' })) return;
  Store.cambiar(s => { const c = s.comunicados.find(x => x.id === el.dataset.id); if (c) c.archivado = true; });
};
A['comunicado-lista'] = el => {
  const c = Store.s.comunicados.find(x => x.id === el.dataset.id); if (!c) return;
  const lotes = (typeof LOTES !== 'undefined' ? LOTES : []).map(l => 'Lote ' + l.lote);
  const fila = lote => { const r = (c.respuestas || {})[lote];
    return `<div class="it"><div class="txt"><b>${esc(lote)}</b><span>${esc(propietarioDe(lote) || '')}</span></div>
      <span class="pill ${r ? (r.va ? 'p-ok' : 'p-danger') : ''}">${r ? (r.va ? 'Va' : 'No puede') : 'Sin responder'}</span></div>`; };
  hoja(c.titulo, `<div class="card lista">${(c.para === 'todos' ? lotes : [c.para]).map(fila).join('')}</div>
    <button class="btn btn-sec btn-block" data-a="copiar" data-v="${esc(Object.entries(c.respuestas || {}).map(([l, r]) => `${l}: ${r.va ? 'va' : 'no'}`).join('\n'))}">${I('copy')}Copiar la lista</button>`);
};
