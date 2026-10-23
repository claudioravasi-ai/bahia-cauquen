/* =========================================================
   LA AGENDA INTELIGENTE Y LA BITÁCORA DIARIA DEL HOTEL
   (pedido de Claudio, 20-10-2026: "menos actividad para la gerencia del
   hotel": a las 22 h, lo que la app programó para el día siguiente, con
   alarma y una ventana para dar el OK, cambiar, quitar o agregar; a las
   23:59, la bitácora del día ordenada paso a paso y un PDF por correo con
   un agradecimiento por cumplir las normas del barrio).

   CÓMO FUNCIONA
     · A las 22:00, en el equipo del hotel, la app arma la agenda de mañana
       con lo que ya está cargado: huéspedes que llegan y que se van, vans y
       traslados (también los automatizados), eventos, entradas y salidas
       del personal, proveedores que vienen y cuántos clientes de spa y
       restaurante se esperan (el promedio del mismo día de las últimas
       semanas, de las bitácoras ya cerradas). Suena, llega el aviso y se
       abre la ventana. Cada tarea: OK, cambiar, quitar; y "Agregar otra".
       "Dar el OK a todo" la guarda. Un traslado quitado se cancela; uno con
       la hora cambiada sale a esa hora.
     · A las 23:59 la cierra EL TELÉFONO DE LA GARITA (está prendido toda la
       noche y es el único que ve el libro de guardia): junta solo lo del
       hotel, lo ordena por hora, guarda la bitácora del hotel y le manda el
       PDF por correo a la cuenta del hotel. Si a esa hora estaba apagado, lo
       hace a la mañana siguiente (hasta las 12).

   PROTECCIÓN DE DATOS (Ley 25.326, mínimo acceso)
     · hotel/hotelDiario la leen y la escriben solo el hotel y la garita.
     · La bitácora guardada y el PDF no llevan nombres de huéspedes, DNI ni
       patentes de los clientes: solo cantidades, horas y lo que hizo cada
       van y cada empleado del hotel (que son del hotel).
     · Las bitácoras se borran solas a los 90 días.

   Ideas de apps con más de 1000 estrellas en GitHub (solo la idea, el
   código es propio): el "night audit" y el reporte del día de los sistemas
   de hotel como QloApps (14k★); la agenda que se aprueba de Cal.com (34k★);
   el reporte automático en PDF de Metabase (40k★).
   ========================================================= */
const hotelDiario = () => aLista(Store.s.hotelDiario).filter(x => x && x.id);
const agendaDe = f => hotelDiario().find(x => x.id === 'ag-' + f) || null;
const bitacoraHotelDe = f => hotelDiario().find(x => x.id === 'bd-' + f) || null;
const AG_CATS = {
  llegan:['Llegan', 'login', 'var(--sky)'], salen:['Se van', 'logout', 'var(--accent)'], vans:['Vans', 'car', 'var(--wood)'],
  eventos:['Eventos', 'star', 'var(--warn)'], personal:['Personal', 'users', 'var(--ok)'], prov:['Proveedores', 'box', 'var(--brand)'],
  spa:['Spa y resto', 'sparkle', 'var(--danger)'], otro:['Otras', 'edit', 'var(--cobre, var(--wood))'],
};
const agCat = k => AG_CATS[k] || AG_CATS.otro;
const agOrden = ls => ls.sort((a, b) => (a.h || '').localeCompare(b.h || '') || String(a.t).localeCompare(String(b.t), 'es'));
const diaLargo = f => fechaLarga(f).replace(/^./, c => c.toUpperCase());
const tocaElDia = (dias, dow) => !aLista(dias).length || aLista(dias).map(Number).includes(dow);

/* Lo que la app ya tiene programado para el día `f`. */
function armarAgenda(f){
  const dow = fechaDe(f).getDay(), it = [];
  const add = (id, k, h, t, s, ref = null) => it.push({ id, k, h:h || '', t, s, auto:1, est:'', ...(ref ? { ref } : {}) });
  hotelHuespedes().filter(h => h.desde === f).forEach(h => add('ll-' + h.id, 'llegan', h.llegaHora, `Llega ${h.nombre}`,
    `${plural(+h.pax || 1, 'persona')}${h.llegaVuelo ? ' · vuelo ' + h.llegaVuelo : ''}${h.patente ? ' · en auto' : ''} · la garita ya lo tiene en su lista`, { tipo:'huesped', id:h.id }));
  hotelHuespedes().filter(h => h.hasta === f && h.desde < f).forEach(h => add('sa-' + h.id, 'salen', h.saleHora, `Check-out de ${h.nombre}`,
    `${plural(+h.pax || 1, 'persona')}${h.saleVuelo ? ' · vuelo ' + h.saleVuelo : ''} · la garita marca la salida`, { tipo:'huesped', id:h.id }));
  /* (23-10-2026, tarde) Cada viaje del servicio regular al centro va en su renglón, con su vuelta:
     así la gerencia cambia la hora de uno a último momento (✎) y la garita lo ve al instante. */
  const esRegular = x => /^hrsr-/.test(x.deRutina || '');
  hotelViajes().filter(x => x.fecha === f && x.estado === 'programado').forEach(x => { const van = hotelVans().find(v => v.id === x.vanId);
    if (esRegular(x)){ it.push({ id:'vj-' + x.id, k:'vans', h:x.sale || '', t:'Servicio regular al centro', s:`vuelve del centro ${x.vuelve || '—'} h · ${van ? van.nombre : 'van sin asignar'} · la garita marca la salida y la vuelta`, auto:1, est:'', vu:x.vuelve || '', ref:{ tipo:'viaje', id:x.id } }); return; }
    add('vj-' + x.id, 'vans', x.sale, textoViaje(x), `${van ? van.nombre : 'todavía sin van'} · ${plural(+x.pax || 0, 'pasajero')}${x.deRutina ? ' · automatizado' : x.auto ? ' · armado con los vuelos' : ''}`, { tipo:'viaje', id:x.id }); });
  hotelEventos().filter(e => e.fecha === f).forEach(e => add('ev-' + e.id, 'eventos', e.desde, e.titulo,
    `${plural(+e.asistentes || 0, 'invitado')}${e.musicaHasta ? ' · música hasta las ' + e.musicaHasta : ''}${e.publicado ? ' · vecinos avisados' : ''}`, { tipo:'evento', id:e.id }));
  /* El personal, agrupado por la hora en que entra y en la que sale. */
  const emp = hotelEmpleados().filter(e => aLista(e.dias).length && tocaElDia(e.dias, dow));
  const grupos = (campo, verbo, pre) => { const g = {}; emp.forEach(e => { const h = e[campo] || ''; (g[h] = g[h] || []).push(e); });
    Object.entries(g).forEach(([h, ls]) => add(pre + (h || 'x').replace(':', ''), 'personal', h, `${verbo}${ls.length === 1 ? '' : 'n'} ${plural(ls.length, 'empleado', 'empleados')}`,
      ls.map(e => `${e.nombre}${e.puesto ? ' (' + e.puesto + ')' : ''}`).join(', '))); };
  grupos('desde', 'Entra', 'pe-'); grupos('hasta', 'Sale', 'ps-');
  hotelProvs().filter(p => p.estado !== 'suspendido' && aLista(p.dias).length && tocaElDia(p.dias, dow)).forEach(p => { const [c, t] = estadoProv(p, f);
    add('pr-' + p.id, 'prov', p.desde, `Viene ${p.empresa}`, `${p.rubro ? p.rubro + ' · ' : ''}${c === 'danger' ? t + ': así no entra' : t}`); });
  /* Clientes de spa y restaurante: el promedio del mismo día de la semana. */
  const viejas = hotelDiario().filter(b => b.tipo === 'bitacora' && b.fecha < f && b.fecha >= sumarDias(f, -29) && fechaDe(b.fecha).getDay() === dow);
  if (viejas.length){ const prom = k => Math.round(viejas.reduce((a, b) => a + (+(b.resumen || {})[k] || 0), 0) / viejas.length);
    if (prom('spa')) add('pa-spa', 'spa', '', `Se esperan unos ${prom('spa')} clientes de spa`, `Promedio de los últimos ${plural(viejas.length, DIAS[dow].toLowerCase())}: la garita los registra con "Va al hotel"`);
    if (prom('resto')) add('pa-resto', 'spa', '', `Se esperan unos ${prom('resto')} en el restaurante`, `Promedio de los últimos ${plural(viejas.length, DIAS[dow].toLowerCase())}`); }
  return agOrden(it);
}
/* Rearma la agenda pendiente sin perder lo que la gerencia ya tocó. */
function agendaAlDia(f, vieja){
  const prev = new Map(aLista(vieja && vieja.items).map(x => [x.id, x]));
  const items = armarAgenda(f).map(x => { const p = prev.get(x.id); return p ? { ...x, est:p.est || '', ...(p.edit ? { h:p.h, t:p.t, edit:1 } : {}) } : x; });
  aLista(vieja && vieja.items).filter(x => x.mano).forEach(x => items.push(x));
  return agOrden(items);
}

/* =========================================================
   LA VENTANA DE LA AGENDA (la misma en la hoja de las 22 h y en su
   ventana). Cielo de noche con la luna, la barra de cuántas tienen OK,
   las categorías (bajan de renglón: nunca se cortan) y cada tarea con
   ✓ / ✎ / ✕.
   ========================================================= */
const AgendaVista = { cat:'todo', editando:'', agregando:false, recien:'' };
function agendaHtml(f, { garita = esGuardia() } = {}){
  const ag = agendaDe(f), items = ag ? aLista(ag.items) : armarAgenda(f), lista = garita || (ag && ag.estado === 'aprobada'), borrador = !ag && !garita;
  const vivos = items.filter(x => x.est !== 'quitado'), ok = vivos.filter(x => x.est === 'ok').length, cat = AgendaVista.cat;
  const cats = [['todo', 'Todo', 'var(--ink)', vivos.length], ...Object.entries(AG_CATS).map(([k, c]) => [k, c[0], c[2], vivos.filter(x => x.k === k).length]).filter(x => x[3] || x[0] === cat)];
  const ls = items.filter(x => cat === 'todo' || x.k === cat);
  const estrellas = Array.from({ length:12 }, (_, i) => `<i style="left:${(i * 37) % 100}%;top:${(i * 53) % 70}%;animation-delay:${(i * .17).toFixed(2)}s"></i>`).join('');
  const fila = (x, i) => { const c = agCat(x.k);
    if (AgendaVista.editando === x.id && !lista) return `<li class="ag-it editando" style="--c:${c[2]}"><form data-f="ag-editar" data-id="${esc(x.id)}" data-fecha="${f}" class="ag-ed">
      <input type="time" name="h" value="${esc(x.h)}" aria-label="${x.vu != null ? 'Sale' : 'Hora'}">${x.vu != null ? `<label class="ag-vu">vuelve<input type="time" name="vu" value="${esc(x.vu)}" aria-label="Vuelve del centro"></label>` : ''}<input name="t" value="${esc(x.t)}" maxlength="80" required aria-label="Tarea">
      <button class="btn btn-pri btn-sm">${I('check')}Guardar</button><button type="button" class="btn btn-sec btn-sm" data-a="ag-cancelar-ed" data-v="${f}">Cancelar</button></form></li>`;
    return `<li class="ag-it ${x.est === 'ok' ? 'ok' : ''} ${x.est === 'quitado' ? 'quitado' : ''} ${AgendaVista.recien === x.id ? 'recien' : ''}" style="--c:${c[2]};--i:${i}">
      <span class="ag-h"><b>${esc(x.h || 'En el día')}</b><small>${esc(c[0])}</small></span>
      <span class="ag-tx"><b>${esc(x.t)}${x.auto ? '<em class="ag-auto">AUTO</em>' : ''}${x.edit ? '<em class="ag-auto mano">CAMBIADA</em>' : ''}${x.mano ? '<em class="ag-auto mano">AGREGADA</em>' : ''}</b><small>${esc(x.s || '')}</small></span>
      ${lista || borrador ? (x.est === 'quitado' ? `<span class="pill">Quitada</span>` : '') : `<span class="ag-acc">${x.est === 'quitado' ? `<button type="button" data-a="ag-volver" data-v="${f}" data-id="${esc(x.id)}" aria-label="Volver a ponerla">${I('refresh')}</button>`
        : `<button type="button" class="${x.est === 'ok' ? 'si' : ''}" data-a="ag-ok" data-v="${f}" data-id="${esc(x.id)}" aria-label="OK" aria-pressed="${x.est === 'ok'}">${I('check')}</button><button type="button" data-a="ag-ed" data-v="${f}" data-id="${esc(x.id)}" aria-label="Cambiar">${I('edit')}</button><button type="button" data-a="ag-quitar" data-v="${f}" data-id="${esc(x.id)}" aria-label="Quitar">${I('x')}</button>`}</span>`}</li>`; };
  const agregar = AgendaVista.agregando && !lista && !borrador ? `<form data-f="ag-agregar" data-fecha="${f}" class="ag-nueva">
      <select name="k" aria-label="Categoría">${Object.entries(AG_CATS).map(([k, c]) => `<option value="${k}" ${k === (cat === 'todo' ? 'otro' : cat) ? 'selected' : ''}>${esc(c[0])}</option>`).join('')}</select>
      <input type="time" name="h" value="12:00" aria-label="Hora"><input name="t" maxlength="80" required placeholder="Qué hay que hacer" aria-label="Tarea">
      <button class="btn btn-pri btn-sm">${I('plus')}Agregar</button></form>` : '';
  return `<div class="ag ${AgendaVista.quieta ? 'quieta' : ''}"><div class="ag-cielo">${estrellas}<span class="ag-luna" aria-hidden="true"></span>
      <small>AGENDA INTELIGENTE · ${esc(diaLargo(f).toUpperCase())}</small><h2>${garita ? `Lo que llega del hotel ${f === hoyISO() ? 'hoy' : 'mañana'}` : lista ? 'Mañana ya está programado' : borrador ? 'Lo que viene para mañana' : 'Mañana, ya programado'}</h2>
      <p>${garita ? (ag && ag.estado === 'aprobada' ? `La gerencia del ${esc(HOTEL_NOMBRE)} la aprobó a las ${hora(ag.aprobadaAt)} h, con sus cambios. Esto es lo que la garita tiene que esperar.${ag.recibido ? ` Recibida por ${esc(ag.recibido.nombre || 'la garita')} a las ${hora(ag.recibido.at)} h.` : ''}` : 'La gerencia del hotel todavía no la aprobó: puede cambiar.') : lista ? `Le diste el OK a las ${hora(ag.aprobadaAt)} h. Quedó en la bitácora del hotel.` : borrador ? 'Se arma sola a las 22 h y te avisa con sonido. Esto es una vista previa.' : `La app armó sola ${plural(vivos.length, 'tarea')} con lo que cargaste. Dales el OK, cambiá lo que quieras o agregá otras.`}</p>
      <p class="ag-base">${I('sparkle')} La agenda inteligente se basa en cómo el hotel se mueve con el barrio: entradas y salidas de huéspedes, personal, autos, vans, proveedores y clientes del restaurante y el spa que registra la garita.</p>
      <div class="ag-prog"><span><i style="width:${vivos.length ? (lista ? 100 : ok / vivos.length * 100) : 0}%"></i></span><b>${lista ? `${vivos.length} con OK` : `${ok} de ${vivos.length} con OK`}</b></div></div>
    <div class="ag-cats">${cats.map(([k, t, c, n]) => `<button type="button" class="ag-cat ${k === cat ? 'on' : ''}" style="--c:${c}" data-a="ag-cat" data-v="${f}" data-k="${k}" aria-pressed="${k === cat}">${esc(t)} <b>${n}</b></button>`).join('')}</div>
    ${ls.length ? `<ol class="ag-lista">${ls.map(fila).join('')}</ol>` : `<p class="ag-nada">${I('check')} ${items.length ? 'Nada en esta categoría.' : 'No hay nada programado para mañana todavía.'}</p>`}
    ${agregar}
    ${garita ? (ag && ag.estado === 'aprobada' && !ag.recibido ? `<div class="ag-pie"><button type="button" class="ag-todo" data-a="ag-recibido" data-v="${f}">${I('check')}Recibido: la garita está al tanto</button></div>` : '')
      : lista ? '' : borrador ? `<div class="ag-pie"><button type="button" class="btn btn-pri btn-block" data-a="ag-armar" data-v="${f}">${I('calendar')}Armarla ahora</button></div>`
      : `${AgendaVista.agregando ? '' : `<button type="button" class="ag-mas" data-a="ag-agregar" data-v="${f}">${I('plus')}Agregar otra tarea para mañana</button>`}
      <div class="ag-pie"><button type="button" class="btn btn-sec" data-a="ag-luego">Más tarde</button><button type="button" class="ag-todo" data-a="ag-aprobar" data-v="${f}">${I('check')}Dar el OK a todo y guardar</button></div>`}</div>`;
}
const HotelDiario = {
  /* La hoja de las 22 h. Se vuelve a dibujar con cada toque, sin repetir la entrada animada. */
  abrir(f){ AgendaVista.quieta = false; hoja('Agenda inteligente', agendaHtml(f), { ancho:'600px' }); $('#hoja').dataset.agenda = f; setTimeout(() => { AgendaVista.quieta = true; }, 900); },
  repintar(f){ const d = $('#hoja'); if (d && d.open && d.dataset.agenda === f){ AgendaVista.quieta = true; $('#hojaCuerpo').innerHTML = agendaHtml(f); } else refrescar(); },
  device:(() => { try { let k = sessionStorage.getItem('bhc.equipo'); if (!k){ k = uid(); sessionStorage.setItem('bhc.equipo', k); } return k; } catch(e){ return uid(); } })(),
  tic(){
    const u = yo(); if (!u) return;
    if (u.rol === 'hotel' && !(typeof HotelEjemplo !== 'undefined' && HotelEjemplo.activo())) this.delHotel(u);
    if (esGuardia()) this.deLaGarita();
  },
  /* En el equipo del hotel: a las 22 h se arma la de mañana, suena y se abre. */
  delHotel(u){
    const f = sumarDias(hoyISO(), 1); if (ahoraMin() < 22 * 60) return;
    const ag = agendaDe(f);
    if (!ag){
      const items = agendaAlDia(f, null);
      Store.cambiar(s => { s.hotelDiario = aLista(s.hotelDiario); if (s.hotelDiario.some(x => x && x.id === 'ag-' + f)) return;
        s.hotelDiario.push({ id:'ag-' + f, tipo:'agenda', fecha:f, estado:'pendiente', items, at:Date.now() });
        notificar(s, { para:[u.id], titulo:'Tu agenda de mañana está lista', texto:`${plural(items.length, 'tarea')} para el ${fechaCorta(f)}. Tocá para darles el OK, cambiarlas o agregar otras.`, icon:'calendar', color:'accent', link:'hotel-agenda', sonido:true }); });
    } else if (ag.estado === 'pendiente'){
      const nuevos = agendaAlDia(f, ag);
      if (JSON.stringify(nuevos) !== JSON.stringify(aLista(ag.items))) Store.cambiar(s => { const x = aLista(s.hotelDiario).find(z => z && z.id === ag.id); if (x && x.estado === 'pendiente') x.items = nuevos; });
    }
    const a2 = agendaDe(f);
    /* En el manual interactivo no se abre sola: taparía la lección. */
    if (!MODO_MANUAL && a2 && a2.estado === 'pendiente' && document.visibilityState === 'visible' && !hojaAbierta() && HotelMotor.marcar('ag-abrir-' + f)){ AgendaVista.cat = 'todo'; setTimeout(() => this.abrir(f), 600); }
  },
  /* En la garita: a las 23:59 (o a la mañana siguiente, si estaba apagada) cierra el día del hotel. */
  deLaGarita(){
    const hoy = hoyISO(), ahora = ahoraMin(), ayer = sumarDias(hoy, -1);
    const f = ahora >= 23 * 60 + 59 ? hoy : ahora < 12 * 60 ? ayer : null;
    if (f && !bitacoraHotelDe(f) && cuentaHotel() && HotelMotor.marcar('bd-' + f + '-' + this.device)) this.cerrarDia(f);
    /* La agenda que aprobó el hotel se le abre a la garita (una vez por equipo) hasta que alguien toca "Recibido". */
    const ag = [sumarDias(hoy, 1), hoy].map(agendaDe).find(a => a && a.estado === 'aprobada' && !a.recibido && (a.fecha !== hoy || ahora < 12 * 60));
    if (!MODO_MANUAL && ag && document.visibilityState === 'visible' && !hojaAbierta() && (typeof turnoListo !== 'function' || turnoListo()) && HotelMotor.marcar('ag-g-' + ag.fecha + '-' + ag.aprobadaAt)){ AgendaVista.cat = 'todo'; setTimeout(() => this.abrir(ag.fecha), 600); }
    if (HotelMotor.marcar('bd-limpieza-' + hoy)){ const lim = sumarDias(hoy, -90);
      if (hotelDiario().some(x => x.fecha < lim)) Store.cambiar(s => { s.hotelDiario = aLista(s.hotelDiario).filter(x => x && !(x.fecha < lim)); }); }
  },
  async cerrarDia(f){
    const doc = bitacoraDelDia(f, { garita:true });
    Store.cambiar(s => { s.hotelDiario = aLista(s.hotelDiario); if (s.hotelDiario.some(x => x && x.id === doc.id)) return; s.hotelDiario.push({ ...doc, por:this.device }); });
    /* Si dos equipos de la garita lo cerraron a la vez, manda el correo solo el que quedó anotado. */
    await new Promise(ok => setTimeout(ok, 6000));
    const g = bitacoraHotelDe(f); if (!g || g.por !== this.device || (g.mail && g.mail.ok)) return;
    await mandarBitacoraHotel(f);
  },
};
/* El motor del hotel ya corre cada minuto en el hotel y en la garita: se le suma esto. */
if (typeof HotelMotor !== 'undefined'){ const correr0 = HotelMotor.correr;
  HotelMotor.correr = function(...a){ const r = correr0.apply(this, a); conRed('agenda del hotel', () => HotelDiario.tic()); return r; }; }

const agMod = (f, fn) => Store.cambiar(s => { const ag = aLista(s.hotelDiario).find(x => x && x.id === 'ag-' + f); if (ag && ag.estado === 'pendiente'){ ag.items = aLista(ag.items); fn(ag, s); } });
const soloHotelAg = () => esHotel() || (toast('La agenda la maneja el hotel desde su cuenta.', 'lock'), false);
A['ag-cat'] = el => { AgendaVista.cat = el.dataset.k || 'todo'; HotelDiario.repintar(el.dataset.v); };
A['ag-ok'] = el => { if (!soloHotelAg()) return; agMod(el.dataset.v, ag => { const x = ag.items.find(z => z.id === el.dataset.id); if (x) x.est = x.est === 'ok' ? '' : 'ok'; }); HotelDiario.repintar(el.dataset.v); };
A['ag-quitar'] = el => { if (!soloHotelAg()) return; agMod(el.dataset.v, ag => { const x = ag.items.find(z => z.id === el.dataset.id); if (x) x.est = 'quitado'; }); HotelDiario.repintar(el.dataset.v); };
A['ag-volver'] = el => { if (!soloHotelAg()) return; agMod(el.dataset.v, ag => { const x = ag.items.find(z => z.id === el.dataset.id); if (x) x.est = ''; }); HotelDiario.repintar(el.dataset.v); };
A['ag-ed'] = el => { AgendaVista.editando = el.dataset.id; AgendaVista.agregando = false; HotelDiario.repintar(el.dataset.v); };
A['ag-cancelar-ed'] = el => { AgendaVista.editando = ''; HotelDiario.repintar(el.dataset.v); };
A['ag-agregar'] = el => { AgendaVista.agregando = true; AgendaVista.editando = ''; HotelDiario.repintar(el.dataset.v); };
A['ag-luego'] = () => { cerrarHoja(); toast('Te queda en "Agenda de mañana": dale el OK antes de que empiece el día', 'calendar'); };
A['ag-armar'] = el => { if (!soloHotelAg()) return; const f = el.dataset.v;
  Store.cambiar(s => { s.hotelDiario = aLista(s.hotelDiario); if (!s.hotelDiario.some(x => x && x.id === 'ag-' + f)) s.hotelDiario.push({ id:'ag-' + f, tipo:'agenda', fecha:f, estado:'pendiente', items:agendaAlDia(f, null), at:Date.now() }); });
  HotelDiario.repintar(f); };
/* (23-10-2026, tarde) Cambiar la hora de una van en la agenda la cambia EN EL ACTO en el traslado
   (y su vuelta, si es del servicio regular): la garita lo ve enseguida y le llega el aviso. Antes el
   cambio esperaba al "Dar el OK a todo". */
F['ag-editar'] = (d, form) => { if (!soloHotelAg()) return; const f = form.dataset.fecha, id = form.dataset.id; let cambio = '';
  agMod(f, (ag, s) => { const x = ag.items.find(z => z.id === id); if (!x) return; x.h = d.h || x.h; x.t = String(d.t || x.t).trim().slice(0, 80); x.edit = 1; x.est = 'ok';
    if (x.vu != null && /^\d{2}:\d{2}$/.test(d.vu || '')){ x.vu = d.vu; x.s = String(x.s || '').replace(/vuelve del centro [^ ]+ h/, `vuelve del centro ${x.vu} h`); }
    const v = x.ref && x.ref.tipo === 'viaje' ? aLista(s.hotelViajes).find(y => y && y.id === x.ref.id) : null;
    if (!v || v.estado !== 'programado') return;
    const antes = `${v.sale || '—'}${v.vuelve ? ' (vuelve ' + v.vuelve + ')' : ''}`;
    if (/^\d{2}:\d{2}$/.test(x.h) && x.h !== v.sale){ v.sale = x.h; v.saleAMano = true; v.aMano = true; }
    if (x.vu && x.vu !== v.vuelve){ v.vuelve = x.vu; v.aMano = true; }
    const ahora = `${v.sale || '—'}${v.vuelve ? ' (vuelve ' + v.vuelve + ')' : ''}`;
    if (ahora === antes) return;
    cambio = `${textoViaje(v)}: ${antes} → ${ahora}`;
    const garitas = aLista(s.users).filter(u => u && u.rol === 'guardia' && u.estado === 'aprobado').map(u => u.id);
    if (garitas.length) notificar(s, { para:garitas, titulo:`El hotel cambió una van del ${f === hoyISO() ? 'día de hoy' : fechaCorta(f)}`, texto:`Sale ${v.sale} h${v.vuelve ? ' y vuelve ' + v.vuelve + ' h' : ''} (antes ${antes}) · ${textoViaje(v)}`, icon:'car', color:'wood', link:'garita', sonido:true });
    auditar(s, 'El hotel cambió la hora de una van en la agenda', cambio);
  });
  AgendaVista.editando = ''; AgendaVista.recien = id; HotelDiario.repintar(f);
  if (cambio) toast('Cambiado: la garita ya lo ve', 'car'); };
F['ag-agregar'] = (d, form) => { if (!soloHotelAg()) return; const f = form.dataset.fecha, id = 'mn-' + uid();
  agMod(f, ag => { ag.items.push({ id, k:AG_CATS[d.k] ? d.k : 'otro', h:d.h || '', t:String(d.t || '').trim().slice(0, 80), s:'Agregada por la gerencia', mano:1, est:'ok' }); agOrden(ag.items); });
  AgendaVista.agregando = false; AgendaVista.recien = id; HotelDiario.repintar(f); };
A['ag-aprobar'] = el => { if (!soloHotelAg()) return; const f = el.dataset.v; let res = null;
  agMod(f, (ag, s) => {
    ag.items.forEach(x => { if (x.est !== 'quitado') x.est = 'ok'; });
    /* Lo que cambia de verdad: un traslado quitado se cancela; uno con otra hora, sale a esa hora. */
    ag.items.filter(x => x.ref && x.ref.tipo === 'viaje').forEach(x => { const v = aLista(s.hotelViajes).find(y => y && y.id === x.ref.id); if (!v || v.estado !== 'programado') return;
      if (x.est === 'quitado'){ v.estado = 'cancelado'; v.aMano = true; v.nota = [v.nota, 'Cancelado en la agenda de la gerencia'].filter(Boolean).join(' · '); }
      else if (x.edit && /^\d{2}:\d{2}$/.test(x.h) && x.h !== v.sale){ v.sale = x.h; v.saleAMano = true; v.aMano = true; } });
    res = { ok:ag.items.filter(x => x.est === 'ok').length, quitadas:ag.items.filter(x => x.est === 'quitado').length, cambios:ag.items.filter(x => x.edit || x.mano).length };
    ag.estado = 'aprobada'; ag.aprobadaAt = Date.now(); ag.por = yo().id; ag.resumen = res;
    /* A la garita le llega en una ventana (pedido de Claudio, 20-10-2026): qué esperar del hotel mañana. */
    const garitas = aLista(s.users).filter(u => u && u.rol === 'guardia').map(u => u.id);
    if (garitas.length) notificar(s, { para:garitas, titulo:`Agenda del hotel para ${f === hoyISO() ? 'hoy' : 'mañana'}`, texto:`${plural(res.ok, 'tarea')}: huéspedes, vans, personal y proveedores. Tocá para verla.`, icon:'calendar', color:'accent', link:'hotel-agenda', sonido:true });
  });
  if (!res) return;
  const d = $('#hoja');
  if (d && d.open && d.dataset.agenda === f) $('#hojaCuerpo').innerHTML = `<div class="ag-listo"><div class="ag-sello">${I('check')}</div><h2>¡Listo! Mañana está programado</h2><p class="muted">Todo quedó guardado en la bitácora del hotel.</p>
    <div class="ag-bit"><div>${I('book')} <b>${hora(Date.now())} h</b> · la gerencia aprobó la agenda del ${esc(fechaCorta(f))}</div><div>${I('check')} ${plural(res.ok, 'tarea')} con OK${res.quitadas ? ` · ${res.quitadas} quitada${res.quitadas > 1 ? 's' : ''}` : ''}</div>
      ${res.cambios ? `<div>${I('edit')} ${plural(res.cambios, 'cambio')} a mano</div>` : ''}<div>${I('shield')} La garita ya ve lo que le toca: huéspedes, vans y personal</div><div>${I('mail')} A las 23:59 te llega por correo la bitácora de hoy en PDF</div></div>
    <button class="btn btn-pri btn-block" data-a="cerrar-hoja-ag">Cerrar</button></div><div class="ag-confeti" aria-hidden="true">${Array.from({ length:28 }, (_, i) => `<i style="--x:${(i * 37) % 100};--d:${(i % 7) * .09}s;--c:${['#ffd36b', '#7be0a6', '#c46a2c', '#1d7fb0', '#d14b6a', '#7a4bc2'][i % 6]}"></i>`).join('')}</div>`;
  else refrescar();
  toast('Agenda de mañana aprobada', 'check');
};
A['cerrar-hoja-ag'] = () => cerrarHoja();
A['ag-recibido'] = el => { if (!soloGarita()) return; const f = el.dataset.v;
  Store.cambiar(s => { const ag = aLista(s.hotelDiario).find(x => x && x.id === 'ag-' + f); if (!ag || ag.recibido) return;
    ag.recibido = { at:Date.now(), por:yo().id, nombre:(typeof guardiaDeTurnoTexto === 'function' && guardiaDeTurnoTexto()) || yo().nombre || 'La garita' };
    const hoteles = aLista(s.users).filter(u => u && u.rol === 'hotel' && u.estado === 'aprobado').map(u => u.id);
    if (hoteles.length) notificar(s, { para:hoteles, titulo:'La garita recibió tu agenda', texto:`Ya sabe qué esperar el ${fechaCorta(f)}.`, icon:'shield', color:'ok', link:'hotel-agenda' }); });
  cerrarHoja(); toast('Recibido: el hotel ya lo sabe', 'check'); };
R['hotel-agenda'] = {
  titulo:'Agenda de mañana', icon:'calendar', color:'accent', ancha:true, sub:'Se arma sola a las 22 h · OK, cambiar, quitar o agregar',
  render(p){ const f = /^\d{4}-\d{2}-\d{2}$/.test(p || '') ? p : sumarDias(hoyISO(), 1); return agendaHtml(f); },
};
/* La franja de la portada del hotel: la agenda espera el OK. */
function bandaAgenda(){
  const f = sumarDias(hoyISO(), 1), ag = agendaDe(f), hoyAg = agendaDe(hoyISO());
  const pend = ag && ag.estado === 'pendiente' ? ag : hoyAg && hoyAg.estado === 'pendiente' && ahoraMin() < 12 * 60 ? hoyAg : null;
  if (!pend) return '';
  const n = aLista(pend.items).filter(x => x.est !== 'quitado').length;
  return `<button type="button" class="ag-banda" data-a="ag-abrir" data-v="${pend.fecha}"><span class="ag-banda-ic">${I('calendar')}</span><span class="grow"><b>La agenda de ${pend.fecha === f ? 'mañana' : 'hoy'} espera tu OK</b><small>${plural(n, 'tarea')} que la app programó sola · tocá para revisarla</small></span>${I('right')}</button>`;
}
A['ag-abrir'] = el => { AgendaVista.cat = 'todo'; HotelDiario.abrir(el.dataset.v); };

/* =========================================================
   LA BITÁCORA DEL DÍA DEL HOTEL: todo lo que pasó, paso a paso y en orden.
   ========================================================= */
function bitacoraDelDia(f, { garita = false } = {}){
  const enDia = at => at && isoDe(new Date(at)) === f, P = [], add = (at, k, t) => P.push({ at, k, t });
  const vans = aLista(Store.s.hotelVans).filter(Boolean), emps = hotelEmpleados();
  aLista(Store.s.hotelMovs).filter(m => m && enDia(m.at)).forEach(m => {
    if (m.vanId){ const v = vans.find(x => x.id === m.vanId) || {}; add(m.at, 'vans', `${v.nombre || 'Una van'} ${m.tipo === 'in' ? 'volvió al barrio' : 'salió del barrio'}${m.viaje ? ' · ' + m.viaje : ''}${m.pax != null && typeof paxTexto === 'function' ? ' · ' + paxTexto(m.pax) : ''}`); }
    else if (m.empId){ const e = emps.find(x => x.id === m.empId); add(m.at, 'personal', `${m.tipo === 'in' ? 'Entró' : 'Salió'} ${e ? `${hEmpNombre(e)}${e.puesto ? ' (' + e.puesto + ')' : ''}` : 'un empleado del hotel'}`); }
    else if (m.huespedId) add(m.at, m.tipo === 'in' ? 'llegan' : 'salen', `Un huésped ${m.tipo === 'in' ? 'volvió' : 'salió'} con su pase${m.aPie ? ', a pie' : ''}`);
  });
  hotelHuespedes().forEach(h => { if (enDia(h.ingreso)) add(h.ingreso, 'llegan', `Llegó un huésped · ${plural(+h.pax || 1, 'persona')}`); if (enDia(h.salida)) add(h.salida, 'salen', `Se fue un huésped (check-out) · ${plural(+h.pax || 1, 'persona')}`); });
  const vs = aLista(Store.s.hotelViajes).filter(x => x && !x.rutina && x.fecha === f);
  const atDe = hhmm => { const m = minDe(hhmm); return m == null ? 0 : fechaDe(f).getTime() + m * 60000; };
  vs.filter(x => x.estado === 'cancelado').forEach(x => add(atDe(x.sale) || fechaDe(f).getTime(), 'vans', `Traslado cancelado: ${textoViaje(x)}${x.sale ? ' (' + x.sale + ' h)' : ''}`));
  /* (23-10-2026) Lo que la garita no marcó: con la oblea la van pasa sola, así que queda dicho "sin marcar" (no es una falta del hotel). */
  const pasoHora = x => { const t = x.estado === 'en_curso' ? (minDe(regresoViaje(x)) ?? (minDe(x.sale) != null ? minDe(x.sale) + 180 : null)) : minDe(x.sale); return t != null && t + 60 < ahoraMin(); };
  const sinMarcar = vs.filter(x => x.estado === 'sin_marcar' || ((x.estado === 'programado' || x.estado === 'en_curso') && (f < hoyISO() || (f === hoyISO() && pasoHora(x)))));
  sinMarcar.forEach(x => add(atDe(x.sale) || fechaDe(f).getTime(), 'vans', `Sin marcar en la garita: ${textoViaje(x)}${x.sale ? ' (' + x.sale + ' h)' : ''}${x.estado === 'en_curso' || x.sinMarcar === 'vuelta' ? ' · salió, no se marcó la vuelta' : ''}`));
  hotelEventos().filter(e => e.fecha === f).forEach(e => add(atDe(e.desde) || fechaDe(f).getTime() + 12 * 3600000, 'eventos', `Evento: ${e.titulo} · ${plural(+e.asistentes || 0, 'invitado')}${e.musicaHasta ? ' · música hasta las ' + e.musicaHasta : ''}`));
  hotelDiario().filter(a => a.tipo === 'agenda' && a.estado === 'aprobada' && enDia(a.aprobadaAt)).forEach(a => { const r = a.resumen || {};
    add(a.aprobadaAt, 'otro', `La gerencia aprobó la agenda del ${fechaCorta(a.fecha)} · ${plural(r.ok || 0, 'tarea')}${r.cambios ? ` · ${plural(r.cambios, 'cambio')} a mano` : ''}`); });
  hotelDiario().filter(a => a.tipo === 'agenda' && a.recibido && enDia(a.recibido.at)).forEach(a => add(a.recibido.at, 'otro', `La garita recibió la agenda del ${fechaCorta(a.fecha)}`));
  /* Solo la garita ve el libro de guardia: los clientes de spa y restaurante y sus observaciones sobre el hotel. */
  const cli = { spa:0, resto:0 }; let obs = 0;
  if (garita) aLista(Store.s.bitacora).filter(b => b && enDia(b.at)).forEach(b => {
    if (b.hc){ const n = +b.hc.n || 1, spa = b.hc.m === 'spa'; cli[spa ? 'spa' : 'resto'] += n; add(b.at, 'spa', `Llegaron ${n} ${spa ? 'al spa' : 'al restaurante'}${!spa && typeof hcMotivo === 'function' ? ' · ' + hcMotivo(b.hc.m)[1] : ''}`); }
    else if (b.hcRef) add(b.at, 'spa', 'Se fueron clientes del restaurante o del spa');
    else if (b.tipo !== 'acceso' && /hotel/i.test(b.texto || '')){ obs++; add(b.at, 'obs', `Observación de la garita: ${String(b.texto).slice(0, 140)}`); }
  });
  P.sort((a, b) => a.at - b.at);
  const vansMovs = P.filter(p => p.k === 'vans' && !/cancelado|sin marcar/i.test(p.t)).length;
  const cv = typeof conteoVans === 'function' ? conteoVans(f, f) : null;
  const provMal = hotelProvs().filter(p => p.estado !== 'suspendido' && estadoProv(p, f)[0] === 'danger');
  const evs = hotelEventos().filter(e => e.fecha === f);
  const controles = [
    { ok:true, t: vansMovs ? `Las vans pasaron ${vansMovs} veces por la garita${cv ? ` (${plural(cv.salidas, 'salida')} y ${plural(cv.entradas, 'entrada')}, ${plural(cv.huespedesSalen + cv.huespedesEntran, 'huésped', 'huéspedes')} a bordo)` : ''}${sinMarcar.length ? `; ${plural(sinMarcar.length, 'viaje quedó', 'viajes quedaron')} sin marcar` : ', todas registradas'}` : sinMarcar.length ? `${plural(sinMarcar.length, 'viaje', 'viajes')} sin marcar en la garita` : 'Sin movimientos de vans para revisar' },
    { ok:!provMal.length, t: provMal.length ? `${plural(provMal.length, 'proveedor')} con la ART o el seguro vencidos: ${provMal.map(p => p.empresa).join(', ')}` : 'Proveedores con ART y seguro al día' },
    { ok:true, t:'Huéspedes anunciados a la garita antes de llegar' },
    ...evs.map(e => ({ ok:true, t:`Evento "${e.titulo}" avisado${e.musicaHasta ? `, con música hasta las ${e.musicaHasta}` : ''}` })),
    { ok:!obs, t: obs ? `${plural(obs, 'observación', 'observaciones')} de la garita sobre el hotel` : 'Sin observaciones de la garita' },
  ];
  const nota = Math.max(0, 10 - obs * 2 - (provMal.length ? 1 : 0));
  let racha = nota === 10 ? 1 : 0;
  if (racha) for (let i = 1; i < 90; i++){ const b = bitacoraHotelDe(sumarDias(f, -i)); if (b && +b.nota === 10) racha++; else break; }
  const pax = ls => ls.reduce((a, h) => a + (+h.pax || 1), 0);
  const resumen = { traslados:vs.filter(x => x.estado !== 'cancelado').length, hechos:vs.filter(x => x.estado === 'hecho').length, cancelados:vs.filter(x => x.estado === 'cancelado').length,
    llegaron:pax(hotelHuespedes().filter(h => enDia(h.ingreso))), sefueron:pax(hotelHuespedes().filter(h => enDia(h.salida))), personal:P.filter(p => p.k === 'personal' && /^Entró/.test(p.t)).length, spa:cli.spa, resto:cli.resto };
  const m = sumarDias(f, 1), agM = agendaDe(m);
  const manana = (agM ? aLista(agM.items).filter(x => x.est !== 'quitado') : armarAgenda(m)).slice(0, 9).map(x => ({ h:x.h, t:x.k === 'llegan' && x.auto ? 'Llega un huésped' : x.k === 'salen' && x.auto ? 'Check-out de un huésped' : x.t }));
  return { id:'bd-' + f, tipo:'bitacora', fecha:f, pasos:P.map(p => ({ ...p, t:String(p.t).slice(0, 180) })), resumen, controles, nota, racha, obs,
    manana, agendaOk: agM ? agM.estado === 'aprobada' : false, at:Date.now() };
}
const IDEAS_COMUNIDAD = [
  ['Una promo de almuerzo de domingo para los vecinos', 'sale en la tira de todas las apps del barrio'],
  ['Invitar a los vecinos a una charla o degustación en el salón', 'se carga como evento del hotel'],
  ['Sumar el DEA del hotel a la red de emergencias del barrio', 'la garita ya sabe dónde está'],
  ['Un pase de spa o gym con precio especial para vecinos', 'como promoción del hotel'],
  ['Prestar el salón para una reunión de la comisión del barrio', 'un gesto que suma mucho'],
  ['Contar a los huéspedes las normas de convivencia del barrio al hacer el check-in', 'velocidad, ruidos y mascotas'],
];
/* El PDF (y el cuerpo del correo): tablas y estilos en línea, como el parte de mantenimiento, porque Google lo convierte sin las hojas de la app. */
function bitacoraHotelHtml(b){
  const r = b.resumen || {}, C = { vans:'#c46a2c', llegan:'#1d7fb0', salen:'#7a4bc2', personal:'#2f8f5b', eventos:'#b8860b', spa:'#d14b6a', obs:'#d1453b', otro:'#0d6b66' };
  const N = { vans:'Van', llegan:'Llega', salen:'Se va', personal:'Personal', eventos:'Evento', spa:'Spa y resto', obs:'Garita', otro:'Agenda' };
  const kpi = (n, t, s, c) => `<td width="20%" style="padding:0 4px" valign="top"><div style="background:#fff;border-radius:12px;border-top:5px solid ${c};padding:10px 10px 9px;box-shadow:0 2px 6px rgba(13,43,69,.12)"><div style="font-size:24px;font-weight:800;color:${c};line-height:1">${n}</div><div style="font-size:10.5px;font-weight:700;color:#3d4f4d;margin-top:3px">${t}</div><div style="font-size:9px;color:#6b7b79;margin-top:2px">${s}</div></div></td>`;
  const ideas = [0, 1, 2].map(i => IDEAS_COMUNIDAD[(fechaDe(b.fecha).getDate() + i * 2) % IDEAS_COMUNIDAD.length]);
  const cab = (t, c) => `<div style="font-size:12px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:${c};margin:16px 0 8px">${t}</div>`;
  return `<div style="font-family:Arial,Helvetica,sans-serif;color:#13232a;max-width:700px;margin:0 auto;font-size:12px;line-height:1.4;background:#fbfaf7">
  <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:#0d2b45;border-radius:16px 16px 0 0"><tr>
    <td style="padding:20px 22px;color:#fff"><div style="font-size:10.5px;letter-spacing:.18em;color:#ffd36b;font-weight:800">BITÁCORA DEL DÍA · BARRIO ${esc(String(Store.s.config.nombre || '').toUpperCase())}</div>
      <div style="font-size:26px;font-weight:800;margin-top:6px">${esc(HOTEL_NOMBRE)}</div><div style="font-size:13px;opacity:.85">${esc(diaLargo(b.fecha))} · todo lo que pasó, paso a paso</div></td>
    <td width="120" align="center" style="padding:14px 20px 14px 0"><div style="width:96px;height:96px;border-radius:48px;background:${b.nota === 10 ? '#2f8f5b' : b.nota >= 7 ? '#d99a1a' : '#d1453b'};color:#fff;text-align:center"><div style="padding-top:24px;font-size:26px;font-weight:800;line-height:1">${b.nota}/10</div><div style="font-size:9px;letter-spacing:.1em;margin-top:5px">CONVIVENCIA</div></div></td></tr></table>
  <div style="height:5px;background:#c46a2c"></div>
  <table width="100%" cellpadding="0" cellspacing="0" style="margin:14px 0 4px;border-collapse:separate"><tr>
    ${kpi(r.traslados || 0, 'traslados', `${r.hechos || 0} hechos${r.cancelados ? ' · ' + r.cancelados + ' cancel.' : ''}`, '#c46a2c')}${kpi(r.llegaron || 0, 'llegaron', 'huéspedes', '#1d7fb0')}${kpi(r.sefueron || 0, 'se fueron', 'huéspedes', '#7a4bc2')}${kpi(r.personal || 0, 'entradas', 'del personal', '#2f8f5b')}${kpi((r.spa || 0) + (r.resto || 0), 'clientes', `${r.resto || 0} resto · ${r.spa || 0} spa`, '#d14b6a')}</tr></table>
  ${cab('Paso a paso, en orden', '#0d2b45')}
  ${b.pasos.length ? `<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">${b.pasos.slice(0, 60).map(p => `<tr><td width="46" valign="top" style="padding:5px 0;font-weight:800;color:#0d2b45">${hora(p.at)}</td>
      <td width="16" valign="top" style="padding:8px 0 0"><div style="width:10px;height:10px;border-radius:5px;background:${C[p.k] || '#0d6b66'}"></div></td>
      <td valign="top" style="padding:5px 0;border-bottom:1px solid #ece7de"><span style="font-size:9.5px;font-weight:800;color:${C[p.k] || '#0d6b66'};text-transform:uppercase">${N[p.k] || ''}</span> ${esc(p.t)}</td></tr>`).join('')}</table>${b.pasos.length > 60 ? `<div style="color:#6b7b79;font-size:11px;margin-top:4px">y ${b.pasos.length - 60} pasos más (están en la app).</div>` : ''}`
    : '<div style="color:#6b7b79">Fue un día tranquilo: no hubo movimientos del hotel en la garita.</div>'}
  <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;border-collapse:collapse"><tr>
    <td width="50%" valign="top" style="padding-right:8px"><div style="background:#fff;border-radius:12px;padding:12px 14px;box-shadow:0 1px 4px rgba(13,43,69,.08)">${cab('Normas del barrio', '#2f8f5b').replace('margin:16px 0 8px', 'margin:0 0 8px')}
      ${aLista(b.controles).map(c => `<div style="padding:4px 0;border-bottom:1px dashed #e2ddd3"><b style="color:${c.ok ? '#2f8f5b' : '#d1453b'}">${c.ok ? '✓' : '!'}</b> ${esc(c.t)}</div>`).join('')}</div></td>
    <td width="50%" valign="top" style="padding-left:8px"><div style="background:#fff;border-radius:12px;padding:12px 14px;box-shadow:0 1px 4px rgba(13,43,69,.08)">${cab('Mañana, ya programado', '#c46a2c').replace('margin:16px 0 8px', 'margin:0 0 8px')}
      ${aLista(b.manana).length ? aLista(b.manana).map(x => `<div style="padding:3px 0"><b style="display:inline-block;width:44px;color:#0d2b45">${esc(x.h || '—')}</b>${esc(x.t)}</div>`).join('') : '<div style="color:#6b7b79">Nada cargado todavía.</div>'}
      <div style="font-size:10px;color:#6b7b79;margin-top:6px">${b.agendaOk ? 'Aprobado por la gerencia en la agenda de las 22 h.' : 'La agenda de mañana todavía espera el OK de la gerencia.'}</div></div></td></tr></table>
  <div style="margin-top:16px;padding:16px 18px;border-radius:14px;background:#fff7ee;border:1px solid #f0d3b5;font-size:12.5px;line-height:1.55">
    <div style="font-size:17px;font-weight:800;color:#c46a2c;margin-bottom:6px">¡Gracias, ${esc(HOTEL_NOMBRE)}!</div>
    ${b.nota === 10 ? `Hoy se cumplieron todas las normas del barrio${b.racha > 1 ? ` y ya son <b>${b.racha} días seguidos</b> sin observaciones` : ''}.` : 'Gracias por el trabajo de hoy. Hay algún punto para revisar en "Normas del barrio".'}
    Cada van que pasa registrada, cada huésped anunciado a tiempo y cada evento que respeta el descanso de los vecinos hacen que Bahía Cauquén sea un lugar mejor para todos. Seguimos contando con ustedes para que el barrio siga siendo tranquilo, seguro y cálido, para quienes viven acá y para quienes nos visitan desde todo el mundo.</div>
  ${cab('Ideas para seguir sumando con la comunidad', '#1d7fb0')}
  ${ideas.map((x, i) => `<div style="padding:4px 0"><b style="display:inline-block;width:20px;height:20px;border-radius:6px;background:${['#c46a2c', '#7a4bc2', '#2f8f5b'][i]};color:#fff;text-align:center;line-height:20px;margin-right:8px">${i + 1}</b>${esc(x[0])} <span style="color:#6b7b79">· ${esc(x[1])}</span></div>`).join('')}
  <div style="margin-top:16px;padding:10px 12px;border-radius:10px;background:#f1f3f0;color:#6b7b79;font-size:10px">Bitácora armada sola por la app del barrio a las 23:59 con lo que registró la garita. No lleva nombres de huéspedes, DNI ni patentes de clientes (Ley 25.326). Si algún dato no coincide, escribile a la garita desde la app.</div></div>`;
}
const bhPdfDoc = cuerpo => `<!DOCTYPE html><html><head><meta charset="utf-8"><style>@page{size:A4;margin:10mm}body{margin:0;background:#fbfaf7}</style></head><body>${cuerpo}</body></html>`;
async function mandarBitacoraHotel(f, { avisar = false } = {}){
  const b = bitacoraHotelDe(f), h = cuentaHotel(); if (!b) return;
  const marcar = mail => Store.cambiar(s => { const x = aLista(s.hotelDiario).find(z => z && z.id === b.id); if (x) x.mail = mail; });
  if (!h || !h.email){ marcar({ at:Date.now(), ok:false, error:'La cuenta del hotel no tiene correo' }); if (avisar) toast('La cuenta del hotel no tiene correo cargado', 'mail'); return; }
  const html = bitacoraHotelHtml(b);
  const r = await Correo.enviarDetalle({ para:h.email, asunto:`Bitácora del día · ${HOTEL_NOMBRE} · ${fechaCorta(f)}`, html, tipo:'bitacora-hotel',
    pdf:{ html:bhPdfDoc(html), nombre:`Bitacora hotel ${f}.pdf` } });
  marcar({ at:Date.now(), ok:r.ok, error:r.ok ? '' : String(r.error || '').slice(0, 120) });
  if (avisar) toast(r.ok ? `La bitácora salió por correo a ${h.email}` : 'No salió por correo: ' + r.error, r.ok ? 'mail' : 'alert');
}
const BitVista = { dia:'' };
R['hotel-bitacora'] = {
  titulo:'Bitácora del hotel', icon:'book', color:'ok', ancha:true, sub:'Todo el día, paso a paso · el PDF llega por correo a las 23:59',
  render(){
    const hoy = hoyISO(), dias = [0, 1, 2, 3, 4, 5, 6].map(i => sumarDias(hoy, -i)), f = dias.includes(BitVista.dia) ? BitVista.dia : hoy;
    const guardada = bitacoraHotelDe(f), b = guardada || bitacoraDelDia(f, { garita:esGuardia() }), r = b.resumen || {};
    const C = { vans:'wood', llegan:'sky', salen:'accent', personal:'ok', eventos:'warn', spa:'danger', obs:'danger', otro:'brand' };
    const IC = { vans:'car', llegan:'login', salen:'logout', personal:'users', eventos:'star', spa:'sparkle', obs:'alert', otro:'calendar' };
    return `${segmento(dias.map(d => ({ k:d, t:d === hoy ? 'Hoy' : DIAS[fechaDe(d).getDay()], n:fechaDe(d).getDate(), c: bitacoraHotelDe(d) ? 'var(--ok)' : 'var(--sky)' })), f, 'bh-dia', 'apilado')}
      <div class="bh-cab"><div class="grow"><small>${esc(diaLargo(f))}</small><b>${guardada ? `Cerrada a las ${hora(guardada.at)} h` : f === hoy ? 'En curso: se cierra sola a las 23:59' : 'Sin cerrar'}</b>
        ${guardada && guardada.mail ? `<span class="small ${guardada.mail.ok ? '' : 'muted'}">${I('mail')} ${guardada.mail.ok ? 'Enviada por correo a las ' + hora(guardada.mail.at) + ' h' : 'No salió por correo: ' + esc(guardada.mail.error || '')}</span>` : ''}</div>
        <span class="bh-nota ${b.nota === 10 ? 'diez' : ''}"><b>${guardada ? b.nota : '—'}</b><small>/10</small></span></div>
      <div class="bh-kpis">${[['traslados', r.traslados, 'car', 'wood'], ['llegaron', r.llegaron, 'login', 'sky'], ['se fueron', r.sefueron, 'logout', 'accent'], ['del personal', r.personal, 'users', 'ok'], ['clientes', (r.spa || 0) + (r.resto || 0), 'sparkle', 'danger']]
        .map(([t, n, ic, c]) => `<div class="bh-k c-${c}">${I(ic)}<b>${n || 0}</b><small>${t}</small></div>`).join('')}</div>
      ${!guardada && !esGuardia() ? `<p class="muted tiny">${I('info')} Los clientes de spa y restaurante y las observaciones de la garita se suman al cierre de las 23:59.</p>` : ''}
      ${sec('Paso a paso, en orden')}
      ${aLista(b.pasos).length ? `<ol class="bh-linea">${aLista(b.pasos).map(p => `<li class="c-${C[p.k] || 'brand'}"><span class="bh-h">${hora(p.at)}</span><span class="bh-n">${I(IC[p.k] || 'dot')}</span><span class="bh-t">${esc(p.t)}</span></li>`).join('')}</ol>` : vacio('book', 'Todavía no hay movimientos del hotel este día.')}
      ${guardada ? `${sec('Normas del barrio')}<div class="card lista">${aLista(b.controles).map(c => `<div class="it"><span class="ic ic-${c.ok ? 'ok' : 'danger'}">${I(c.ok ? 'check' : 'alert')}</span><div class="txt"><b>${esc(c.t)}</b></div></div>`).join('')}</div>
        <div class="btns" style="margin-top:12px"><button class="btn btn-pri grow" data-a="bh-pdf" data-v="${f}">${I('download')}Ver el PDF</button>${esHotel() || esGuardia() ? `<button class="btn btn-sec grow" data-a="bh-mail" data-v="${f}">${I('mail')}Mandarlo de nuevo</button>` : ''}</div>` : ''}
      <p class="muted tiny" style="margin-top:12px">${I('lock')} La ven solo el hotel y la garita. No lleva nombres de huéspedes, DNI ni patentes de clientes. Se borra sola a los 90 días.</p>`;
  },
};
A['bh-dia'] = el => { BitVista.dia = el.dataset.v; refrescar(); };
A['bh-mail'] = el => mandarBitacoraHotel(el.dataset.v, { avisar:true });
A['bh-pdf'] = el => { const b = bitacoraHotelDe(el.dataset.v); if (!b) return;
  hoja('Bitácora del día', `<iframe class="mv-parte-frame" title="Bitácora del día" sandbox="allow-same-origin allow-modals"></iframe>
    <button class="btn btn-pri btn-block" style="margin-top:10px" data-a="mv-parte-imprimir">${I('download')}Imprimir o guardar en PDF</button>`, { ancho:'820px' });
  const fr = $('#hoja .mv-parte-frame'); if (fr){ encuadrarPdf(fr); fr.srcdoc = bhPdfDoc(bitacoraHotelHtml(b)); } };
