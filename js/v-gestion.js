/* =========================================================
   Gestión: peticiones firmadas a la garita, reservas, reclamos,
   votaciones, mensajes privados, documentos, expensas, residuos,
   agenda, Ushuaia, vuelos y Mi casa.
   ========================================================= */

/* ---------- FIRMA MANUSCRITA EN PANTALLA ---------- */
const firmaHTML = id => `<div class="firma-box"><canvas id="${id}" class="firma" width="600" height="220"></canvas>
  <div class="row" style="justify-content:space-between;margin-top:6px"><span class="muted tiny">Firmá con el dedo o el mouse</span><button type="button" class="btn btn-xs btn-sec" data-a="firma-borrar" data-v="${id}">Borrar</button></div></div>`;
function iniciarFirma(id){
  const c = document.getElementById(id); if (!c || c._ok) return; c._ok = true; c._vacia = true;
  const ctx = c.getContext('2d');
  const color = getComputedStyle(document.documentElement).getPropertyValue('--ink').trim() || '#0f1f1e';
  ctx.lineWidth = 3.2; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = color;
  let dib = false, ult = null;
  const pos = e => { const r = c.getBoundingClientRect(); return [(e.clientX - r.left) * c.width / r.width, (e.clientY - r.top) * c.height / r.height]; };
  c.addEventListener('pointerdown', e => { dib = true; ult = pos(e); c.setPointerCapture(e.pointerId); e.preventDefault(); });
  c.addEventListener('pointermove', e => { if (!dib) return; const p = pos(e); ctx.beginPath(); ctx.moveTo(ult[0], ult[1]); ctx.lineTo(p[0], p[1]); ctx.stroke(); ult = p; c._vacia = false; });
  ['pointerup','pointercancel'].forEach(t => c.addEventListener(t, () => { dib = false; }));
}
A['firma-borrar'] = el => { const c = document.getElementById(el.dataset.v); if (c){ c.getContext('2d').clearRect(0, 0, c.width, c.height); c._vacia = true; } };
/* La firma se guarda en negro sobre transparente, chica, para que pese poco. */
function leerFirma(id){
  const c = document.getElementById(id); if (!c || c._vacia) return null;
  const o = document.createElement('canvas'); o.width = 300; o.height = 110;
  const x = o.getContext('2d'); x.drawImage(c, 0, 0, 300, 110);
  const img = x.getImageData(0, 0, 300, 110);
  for (let i = 0; i < img.data.length; i += 4) if (img.data[i + 3]) { img.data[i] = img.data[i + 1] = img.data[i + 2] = 20; }
  x.putImageData(img, 0, 0);
  return o.toDataURL('image/png');
}
async function sello(obj){
  try {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(obj)));
    return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
  } catch(e){ return ''; }
}
function auditar(s, accion, detalle, ref = ''){
  s.auditoria.unshift({ id:uid(), at:Date.now(), por:Store.sesion.userId, accion, detalle, ref });
  if (s.auditoria.length > 3000) s.auditoria.length = 3000;
}

/* ---------- PETICIONES A LA GARITA ---------- */
const TIPOS_PET = {
  correo:   { n:'Recibir correo o paquetes', icon:'box', ej:'Recibir y guardar los paquetes a mi nombre mientras no estoy.' },
  nopasar:  { n:'No dejar pasar a alguien', icon:'x', ej:'No autorizar el ingreso de: (nombre, DNI, patente).' },
  viaje:    { n:'Estoy de viaje', icon:'lock', ej:'La casa queda sola. Contacto de emergencia: …' },
  llave:    { n:'Dejar / retirar una llave', icon:'key', ej:'Dejo una llave en la garita para …' },
  permiso:  { n:'Permiso de ingreso especial', icon:'users', ej:'Autorizo a … a ingresar con … (herramientas, vehículo, etc.).' },
  otro:     { n:'Otra petición', icon:'info', ej:'' },
};
const ESTADO_PET = { pendiente:['Pendiente de recepción','warn'], en_funciones:['En funciones','ok'], cerrada:['Cerrada','muted'] };
R.peticiones = {
  titulo: 'Peticiones a la garita', icon: 'shield', color: 'brand', sub: 'Con firma del vecino y de la guardia',
  render(f){
    const u = yo(), s = Store.s, staff = esStaff();
    let lista = staff ? s.peticiones.slice() : s.peticiones.filter(p => p.userId === u.id);
    const filtro = f || (staff ? 'pendiente' : 'todas');
    if (filtro !== 'todas') lista = lista.filter(p => p.estado === filtro);
    const n = e => (staff ? s.peticiones : s.peticiones.filter(p => p.userId === u.id)).filter(p => p.estado === e).length;
    return `${!staff ? superficie({ a:'nueva-peticion', icon:'edit', t:'Nueva petición a la garita', s:'Queda firmada por vos y por el guardia que la recibe', cls:'acento' }) : ''}
      <div class="chips">${[['pendiente','Pendientes'],['en_funciones','En funciones'],['cerrada','Cerradas'],['todas','Todas']].map(([k, t]) =>
        `<button class="chip ${filtro === k ? 'on' : ''}" data-a="abrir" data-v="peticiones" data-p="${k}">${t}${k !== 'todas' && n(k) ? `<span class="n">${n(k)}</span>` : ''}</button>`).join('')}</div>
      ${lista.length ? lista.map(p => { const t = TIPOS_PET[p.tipo] || TIPOS_PET.otro, e = ESTADO_PET[p.estado], v = usuario(p.userId) || {};
        return `<button class="superficie" data-a="ver-peticion" data-id="${p.id}"><span class="ic ic-${e[1] === 'muted' ? 'brand' : e[1]}">${I(t.icon)}</span>
          <span class="txt"><b>${esc(t.n)}</b><small>${staff ? `<b style="display:inline;color:var(--ink)">${esc(v.casa || '')}</b> · ` : ''}${esc(p.texto.slice(0, 70))}${p.texto.length > 70 ? '…' : ''}</small>
          <small>${e[0]} · ${hace(p.at)}</small></span>${I('right')}</button>`; }).join('') : vacio('shield', staff ? 'No hay peticiones en este estado.' : 'Todavía no hiciste peticiones.')}
      <p class="muted tiny" style="margin-top:14px">Cada petición guarda las dos firmas, la fecha y hora, y un sello digital (SHA-256) que permite comprobar que nadie la modificó después.</p>`;
  },
};
A['nueva-peticion'] = el => {
  const t0 = el?.dataset?.v || 'correo', hoy = hoyISO();
  hoja('Nueva petición a la garita', `<form data-f="peticion">
    <div class="field"><label>Tipo</label><select name="tipo" id="petTipo">${Object.entries(TIPOS_PET).map(([k, t]) => `<option value="${k}" ${k === t0 ? 'selected' : ''}>${t.n}</option>`).join('')}</select></div>
    <div class="field"><label>Qué le pedís a la guardia</label><textarea name="texto" id="petTexto" required maxlength="600" placeholder="${esc(TIPOS_PET[t0].ej)}"></textarea></div>
    <div class="grid2"><div class="field"><label>Desde</label><input type="date" name="desde" value="${hoy}" required></div><div class="field"><label>Hasta (opcional)</label><input type="date" name="hasta" min="${hoy}"></div></div>
    <div class="field"><label>Tu firma</label>${firmaHTML('firmaVecino')}</div>
    <button class="btn btn-pri btn-block">${I('send')}Firmar y enviar</button></form>`);
  iniciarFirma('firmaVecino');
};
document.addEventListener('change', e => { if (e.target.id === 'petTipo'){ const t = $('#petTexto'); if (t) t.placeholder = TIPOS_PET[e.target.value].ej; } });
F['peticion'] = async d => {
  const firma = leerFirma('firmaVecino');
  if (!firma){ toast('Falta tu firma', 'edit'); return; }
  const u = yo();
  const p = { id:uid(), userId:u.id, casa:u.casa, tipo:d.tipo, texto:d.texto.trim(), desde:d.desde, hasta:d.hasta || '', at:Date.now(), estado:'pendiente', firmaVecino:firma };
  p.selloVecino = await sello({ id:p.id, userId:p.userId, casa:p.casa, tipo:p.tipo, texto:p.texto, desde:p.desde, hasta:p.hasta, at:p.at, firma });
  Store.cambiar(s => {
    s.peticiones.unshift(p);
    if (p.tipo === 'viaje'){ const x = s.users.find(z => z.id === u.id); x.viaje = { desde:p.desde, hasta:p.hasta || sumarDias(p.desde, 7), contacto:'', nota:p.texto }; }
    auditar(s, 'Petición creada y firmada por el vecino', `${TIPOS_PET[p.tipo].n} · ${u.casa}`, p.id);
    notificar(s, { para:'rol:guardia', titulo:`Petición de ${u.casa}`, texto:TIPOS_PET[p.tipo].n + ' · falta tu firma de recepción', icon:'edit', color:'warn', urgente:true, link:'peticiones', sonido:true });
  });
  cerrarHoja(); abrir('peticiones', 'todas'); toast('Petición enviada a la garita', 'shield');
};
A['ver-peticion'] = el => {
  const p = Store.s.peticiones.find(x => x.id === el.dataset.id); if (!p) return;
  const t = TIPOS_PET[p.tipo] || TIPOS_PET.otro, v = usuario(p.userId) || {}, g = usuario(p.recibe) || {}, e = ESTADO_PET[p.estado];
  hoja(t.n, `<div class="row wrap" style="margin-bottom:10px"><span class="pill p-${e[1] === 'muted' ? 'brand' : e[1]}">${e[0]}</span><span class="muted small">${esc(v.casa || p.casa)} · ${esc(v.nombre || '')}</span></div>
    <div class="card plana" style="white-space:pre-wrap">${esc(p.texto)}</div>
    <p class="small muted" style="margin:0 0 12px">Vigencia: desde ${fechaCorta(p.desde)}${p.hasta ? ' hasta ' + fechaCorta(p.hasta) : ''}</p>
    <div class="firmas"><div><div class="lbl">Firma del vecino</div><img src="${p.firmaVecino}" alt="Firma del vecino" class="firma-img"><div class="tiny muted">${fechaHora(p.at)}</div><div class="tiny mono muted">Sello ${esc((p.selloVecino || '').slice(0, 16))}…</div></div>
      <div><div class="lbl">Recepción de la guardia</div>${p.firmaGuardia ? `<img src="${p.firmaGuardia}" alt="Firma de la guardia" class="firma-img"><div class="tiny muted">${esc(g.nombre || '')} · ${fechaHora(p.recibidaAt)}</div><div class="tiny mono muted">Sello ${esc((p.selloGuardia || '').slice(0, 16))}…</div>` : `<div class="firma-img vacia">Sin recibir</div>`}</div></div>
    ${p.estado === 'pendiente' && esStaff() ? `<form data-f="recibir-peticion" data-id="${p.id}" style="margin-top:14px"><div class="field"><label>Tu firma de recepción</label>${firmaHTML('firmaGuardia')}</div>
      <div class="field"><label>Observación (opcional)</label><input name="obs" maxlength="200"></div><button class="btn btn-ok btn-block">${I('check')}Recibir y poner en funciones</button></form>` : ''}
    ${p.obs ? `<p class="small" style="margin:12px 0 0"><b>Observación de la guardia:</b> ${esc(p.obs)}</p>` : ''}
    ${p.estado === 'en_funciones' && (p.userId === yo().id || esStaff()) ? `<button class="btn btn-sec btn-block" style="margin-top:14px" data-a="cerrar-peticion" data-id="${p.id}">Dar por cumplida / cerrar</button>` : ''}
    <button class="btn btn-sec btn-block" style="margin-top:8px" data-a="verificar-peticion" data-id="${p.id}">${I('shield')}Verificar sellos</button>`);
  if (p.estado === 'pendiente' && esStaff()) iniciarFirma('firmaGuardia');
};
F['recibir-peticion'] = async (d, form) => {
  const firma = leerFirma('firmaGuardia');
  if (!firma){ toast('Falta la firma de recepción', 'edit'); return; }
  const id = form.dataset.id, g = yo(), at = Date.now();
  const p0 = Store.s.peticiones.find(x => x.id === id); if (!p0 || p0.estado !== 'pendiente') return;
  const s2 = await sello({ id, selloVecino:p0.selloVecino, recibe:g.id, recibidaAt:at, obs:d.obs || '', firma });
  Store.cambiar(s => {
    const p = s.peticiones.find(x => x.id === id); if (!p) return;
    Object.assign(p, { estado:'en_funciones', recibe:g.id, recibidaAt:at, firmaGuardia:firma, selloGuardia:s2, obs:(d.obs || '').trim() });
    auditar(s, 'Petición recibida y firmada por la guardia', `${TIPOS_PET[p.tipo].n} · ${p.casa} · ${g.nombre}`, p.id);
    s.bitacora.unshift({ id:uid(), autor:g.id, tipo:'novedad', texto:`Petición de ${p.casa} recibida: ${TIPOS_PET[p.tipo].n}.`, at });
    notificar(s, { para:p.userId, titulo:'La guardia recibió tu petición', texto:`${TIPOS_PET[p.tipo].n} · ya está en funciones`, icon:'check', color:'ok', link:'peticiones' });
  });
  cerrarHoja(); toast('Recibida y en funciones', 'check');
};
A['cerrar-peticion'] = el => {
  Store.cambiar(s => { const p = s.peticiones.find(x => x.id === el.dataset.id); if (!p) return; p.estado = 'cerrada'; p.cerradaAt = Date.now(); p.cierra = yo().id;
    auditar(s, 'Petición cerrada', `${TIPOS_PET[p.tipo].n} · ${p.casa}`, p.id); });
  cerrarHoja(); toast('Petición cerrada', 'check');
};
A['verificar-peticion'] = async el => {
  const p = Store.s.peticiones.find(x => x.id === el.dataset.id); if (!p) return;
  const v = await sello({ id:p.id, userId:p.userId, casa:p.casa, tipo:p.tipo, texto:p.texto, desde:p.desde, hasta:p.hasta, at:p.at, firma:p.firmaVecino });
  const okV = v === p.selloVecino;
  let okG = true;
  if (p.firmaGuardia) okG = (await sello({ id:p.id, selloVecino:p.selloVecino, recibe:p.recibe, recibidaAt:p.recibidaAt, obs:p.obs || '', firma:p.firmaGuardia })) === p.selloGuardia;
  toast(okV && okG ? 'Sellos correctos: la petición no fue modificada' : 'ATENCIÓN: los datos no coinciden con el sello', okV && okG ? 'shield' : 'alert');
};

/* ---------- RESERVAS ---------- */
R.reservas = {
  titulo: 'Reservas', icon: 'calendar', color: 'wood', sub: 'Espacios comunes del barrio',
  render(param){
    const [amId, desdeP] = String(param || '').split('|');
    const am = amenity(amId) || amenities()[0];
    const u = yo(), s = Store.s, hoy = hoyISO();
    const inicio = desdeP && desdeP >= hoy ? desdeP : hoy;
    const dias = Array.from({ length:7 }, (_, i) => sumarDias(inicio, i));
    const mias = s.reservas.filter(r => r.userId === u.id && r.fecha >= hoy && !r.cancelada).sort((a, b) => a.fecha.localeCompare(b.fecha));
    const slot = (fecha, i) => {
      const [d0, d1] = am.franjas[i];
      const r = s.reservas.find(x => x.amenity === am.id && x.fecha === fecha && x.franja === i && !x.cancelada);
      const b = s.bloqueos.find(x => x.amenity === am.id && x.fecha === fecha && (x.franja === -1 || x.franja === i));
      const pasada = fecha === hoy && ahoraMin() > minutosDe(d0);
      if (b) return `<button class="slot bloqueada" ${esAdmin() ? `data-a="desbloquear" data-id="${b.id}"` : 'disabled'}>${d0}–${d1}<small>${esc(b.motivo || 'No disponible')}</small></button>`;
      if (r && r.userId === u.id) return `<button class="slot mia" data-a="ver-reserva" data-id="${r.id}">${d0}–${d1}<small>Tuya</small></button>`;
      if (r) return `<button class="slot ocupada" ${esAdmin() ? `data-a="ver-reserva" data-id="${r.id}"` : 'disabled'}>${d0}–${d1}<small>${esc(usuario(r.userId)?.casa || 'Reservado')}</small></button>`;
      return `<button class="slot libre ${pasada ? 'pasada' : ''}" data-a="reservar" data-v="${am.id}" data-p="${fecha}|${i}">${d0}–${d1}<small>Libre</small></button>`;
    };
    return `<div class="amenities">${amenities().map(a => `<button class="amenity ${a.id === am.id ? 'on' : ''}" data-a="abrir" data-v="reservas" data-p="${a.id}|${inicio}"><span class="ic ic-${a.color}">${I(a.icon)}</span>${esc(a.nombre)}</button>`).join('')}</div>
      <div class="card plana small" style="color:var(--ink-2)">${I('info')} ${esc(am.reglas)}</div>
      ${mias.length ? sec('Tus reservas') + mias.map(r => { const a = amenity(r.amenity) || {}; return superficie({ a:'ver-reserva', id:r.id, icon:a.icon || 'calendar', color:a.color || 'wood', t:`${esc(a.nombre || '')} · ${relDia(r.fecha)}`, s:`${(a.franjas?.[r.franja] || []).join(' a ')} h${r.invitados ? ' · ' + plural(+r.invitados, 'invitado') : ''}` }); }).join('') : ''}
      <div class="semana-nav"><button class="icon-btn" data-a="abrir" data-v="reservas" data-p="${am.id}|${sumarDias(inicio, -7)}" ${inicio <= hoy ? 'disabled style="opacity:.3"' : ''} aria-label="Semana anterior">${I('left')}</button>
        <b>${fechaCorta(dias[0])} – ${fechaCorta(dias[6])}</b>
        <button class="icon-btn" data-a="abrir" data-v="reservas" data-p="${am.id}|${sumarDias(inicio, 7)}" ${sumarDias(inicio, 7) > sumarDias(hoy, DIAS_ANTICIPACION) ? 'disabled style="opacity:.3"' : ''} aria-label="Semana siguiente">${I('right')}</button></div>
      <div class="card" style="padding:4px 14px">${dias.map(f => { const d = fechaDe(f);
        return `<div class="dia ${f === hoy ? 'hoy-d' : ''}"><div class="f"><small>${DIAS[d.getDay()]}</small><b>${d.getDate()}</b></div><div class="slots">${am.franjas.map((_, i) => slot(f, i)).join('')}</div></div>`; }).join('')}</div>
      ${esAdmin() ? `<p class="muted tiny">Como Administración: tocá un turno libre para bloquearlo, o uno bloqueado para liberarlo.</p>` : ''}`;
  },
};
A['reservar'] = el => {
  const am = amenity(el.dataset.v), [fecha, fr] = el.dataset.p.split('|'), i = +fr, u = yo();
  if (esAdmin()) return hoja('Turno libre', `<p class="muted small" style="margin:0 0 12px">${esc(am.nombre)} · ${fechaLarga(fecha)} · ${am.franjas[i].join(' a ')} h</p>
    <form data-f="bloquear" data-v="${am.id}" data-p="${fecha}|${i}"><div class="field"><label>Motivo del bloqueo</label><input name="motivo" required maxlength="60" placeholder="Mantenimiento"></div>
    <label class="check"><input type="checkbox" name="todoDia"><span>Bloquear el día completo</span></label>
    <div class="btns" style="margin-top:10px"><button type="button" class="btn btn-sec" data-a="reservar-como-vecino" data-v="${am.id}" data-p="${fecha}|${i}">Reservar igual</button><button class="btn btn-danger">Bloquear</button></div></form>`);
  formReserva(am, fecha, i);
};
A['reservar-como-vecino'] = el => { const am = amenity(el.dataset.v), [f, i] = el.dataset.p.split('|'); formReserva(am, f, +i); };
function formReserva(am, fecha, i){
  const u = yo(), futuras = Store.s.reservas.filter(r => r.amenity === am.id && r.fecha >= hoyISO() && !r.cancelada && usuario(r.userId)?.casa === u.casa).length;
  if (futuras >= MAX_RESERVAS_FUTURAS && !esAdmin()){ toast(`Tu casa ya tiene ${MAX_RESERVAS_FUTURAS} reservas del ${am.nombre} por delante`, 'calendar'); return; }
  hoja(`Reservar ${am.nombre}`, `<form data-f="reservar" data-v="${am.id}" data-p="${fecha}|${i}">
    <div class="card plana"><b>${fechaLarga(fecha)}</b><div class="muted small">${am.franjas[i].join(' a ')} h</div></div>
    <div class="grid2"><div class="field"><label>Invitados</label><input type="number" name="invitados" min="0" max="${am.invitadosMax}" value="0"></div>
      <div class="field"><label>Motivo</label><input name="nota" maxlength="60" placeholder="Cumpleaños"></div></div>
    <div class="field"><label>Lista de invitados (opcional)</label><textarea name="lista" placeholder="Un invitado por renglón. Nombre, patente&#10;Ej: Laura Gómez, AB123CD"></textarea>
      <div class="ayuda">Cada invitado recibe su pase con QR para ese día y ese horario. Así no tenés que anunciarlos de a uno.</div></div>
    <label class="check"><input type="checkbox" required><span>Leí las reglas: ${esc(am.reglas)}</span></label>
    <button class="btn btn-pri btn-block" style="margin-top:10px">${I('calendar')}Confirmar reserva</button></form>`);
}
F['reservar'] = (d, form) => {
  const am = amenity(form.dataset.v), [fecha, fr] = form.dataset.p.split('|'), i = +fr, u = yo();
  if (Store.s.reservas.some(r => r.amenity === am.id && r.fecha === fecha && r.franja === i && !r.cancelada)){ toast('Alguien lo reservó recién. Elegí otro turno.', 'alert'); cerrarHoja(); refrescar(); return; }
  const invitados = String(d.lista || '').split('\n').map(l => l.trim()).filter(Boolean).slice(0, am.invitadosMax).map(l => { const [n, p] = l.split(','); return { nombre:n.trim(), patente:(p || '').trim().toUpperCase() }; });
  const r = { id:uid(), amenity:am.id, userId:u.id, fecha, franja:i, invitados:Math.max(+d.invitados || 0, invitados.length), nota:(d.nota || '').trim(), createdAt:Date.now(), pases:[] };
  const [d0, d1] = am.franjas[i];
  Store.cambiar(s => {
    invitados.forEach(inv => { const p = { id:uid(), hostId:u.id, tipo:'invitado', nombre:inv.nombre, patente:inv.patente, fecha, desde:d0, hasta:d1 === '01:00' ? '23:59' : d1, codigo:codigoPase(), log:{}, createdAt:Date.now(), reserva:r.id, nota:`${am.nombre}${r.nota ? ' · ' + r.nota : ''}` };
      s.pases.unshift(p); r.pases.push(p.id); });
    s.reservas.push(r);
    notificar(s, { para:'staff', titulo:`Reserva: ${am.nombre}`, texto:`${u.casa} · ${fechaCorta(fecha)} ${d0}${invitados.length ? ' · ' + plural(invitados.length, 'invitado') + ' con pase' : ''}`, icon:am.icon, color:am.color, link:'reservas:' + am.id });
  });
  cerrarHoja();
  if (invitados.length) hoja('Reserva confirmada', `${aviso('ok', 'check', `${am.nombre} reservado`, `${fechaLarga(fecha)} · ${d0} a ${d1} h`)}
    <p class="small">Se crearon <b>${plural(invitados.length, 'pase')}</b> para tus invitados. Mandales el mensaje con todos los códigos:</p>
    <button class="btn btn-wa btn-block" data-a="compartir-invitados" data-id="${r.id}">${I('share')}Enviar los pases</button>`);
  else toast(`${am.nombre} reservado para ${relDia(fecha)}`, 'calendar');
};
A['compartir-invitados'] = el => {
  const r = Store.s.reservas.find(x => x.id === el.dataset.id); if (!r) return;
  const am = amenity(r.amenity), ps = Store.s.pases.filter(p => r.pases.includes(p.id));
  compartir(`¡Te espero en el ${am.nombre} del barrio ${Store.s.config.nombre}! ${fechaLarga(r.fecha)}, ${am.franjas[r.franja].join(' a ')} h.\n\nCódigos de ingreso (mostralo en la garita):\n` +
    ps.map(p => `• ${p.nombre}: ${p.codigo}`).join('\n') + `\n\nCómo llegar: ${Store.s.config.mapa}`);
};
A['ver-reserva'] = el => {
  const r = Store.s.reservas.find(x => x.id === el.dataset.id); if (!r) return;
  const am = amenity(r.amenity) || {}, v = usuario(r.userId) || {}, mia = r.userId === yo().id;
  const horas = (fechaDe(r.fecha).getTime() + minutosDe(am.franjas[r.franja][0]) * MIN - Date.now()) / HORA;
  hoja(am.nombre, `<div class="card plana"><b>${fechaLarga(r.fecha)}</b><div class="muted small">${am.franjas[r.franja].join(' a ')} h · ${esc(v.casa || '')}${r.nota ? ' · ' + esc(r.nota) : ''}</div>
      ${r.invitados ? `<div class="small" style="margin-top:6px">${plural(+r.invitados, 'invitado')}${r.pases?.length ? ` · ${r.pases.length} con pase` : ''}</div>` : ''}</div>
    ${r.pases?.length && mia ? `<button class="btn btn-wa btn-block" data-a="compartir-invitados" data-id="${r.id}">${I('share')}Reenviar pases</button>` : ''}
    ${(mia || esAdmin()) ? `${horas < 24 && mia ? aviso('warn', 'clock', 'Falta menos de un día', 'Si cancelás ahora, avisá a la Administración por si alguien más lo necesitaba.') : ''}
      <button class="btn btn-danger-soft btn-block" style="margin-top:10px" data-a="cancelar-reserva" data-id="${r.id}">Cancelar reserva</button>` : ''}`);
};
A['cancelar-reserva'] = async el => {
  if (!await confirmar('Cancelar reserva', 'Se liberan el turno y los pases de tus invitados.', { si:'Cancelar reserva', peligro:true })) return;
  Store.cambiar(s => { const r = s.reservas.find(x => x.id === el.dataset.id); if (!r) return; r.cancelada = Date.now();
    s.pases.forEach(p => { if (p.reserva === r.id) p.cancelado = Date.now(); });
    if (r.userId !== yo().id) notificar(s, { para:r.userId, titulo:'Tu reserva fue cancelada por la Administración', texto:`${amenity(r.amenity)?.nombre} · ${fechaCorta(r.fecha)}`, icon:'calendar', color:'danger' }); });
  toast('Reserva cancelada', 'x');
};
F['bloquear'] = (d, form) => {
  const [fecha, i] = form.dataset.p.split('|');
  Store.cambiar(s => s.bloqueos.push({ id:uid(), amenity:form.dataset.v, fecha, franja: d.todoDia ? -1 : +i, motivo:d.motivo.trim() }));
  cerrarHoja(); toast('Turno bloqueado', 'lock');
};
A['desbloquear'] = el => { Store.cambiar(s => { s.bloqueos = s.bloqueos.filter(b => b.id !== el.dataset.id); }); toast('Turno liberado', 'check'); };

/* ---------- RECLAMOS (privados entre el vecino y la Administración) ---------- */
const CAT_RECL = {
  alumbrado:['Alumbrado','lamp'], calles:['Calles, nieve y hielo','snow'], agua:['Agua y cloacas','drop'], verdes:['Espacios verdes','tree'],
  seguridad:['Seguridad','shield'], convivencia:['Convivencia (ruidos, mascotas, tránsito)','users'], residuos:['Residuos','truck'], otro:['Otro','info'],
};
const EST_RECL = { abierto:['Abierto','warn'], en_curso:['En curso','sky'], resuelto:['Resuelto','ok'] };
R.reclamos = {
  titulo: 'Reclamos', icon: 'clipboard', color: 'warn', sub: () => esAdmin() ? 'Todos los reclamos del barrio' : 'Privados entre vos y la Administración',
  render(f){
    const u = yo(), s = Store.s;
    let ls = esAdmin() ? s.reclamos.slice() : s.reclamos.filter(r => r.userId === u.id || r.publico);
    const filtro = f || 'activos';
    if (filtro === 'activos') ls = ls.filter(r => r.estado !== 'resuelto'); else if (filtro === 'resuelto') ls = ls.filter(r => r.estado === 'resuelto');
    ls.sort((a, b) => (b.apoyos?.length || 0) - (a.apoyos?.length || 0) || b.createdAt - a.createdAt);
    return `${!esStaff() ? superficie({ a:'nuevo-reclamo', icon:'plus', t:'Hacer un reclamo', s:'Solo lo ven vos y la Administración', cls:'acento' }) : ''}
      ${!esStaff() ? superficie({ a:'avistamiento', icon:'eye', color:'ok', t:'Vi un zorro, perros sueltos…', s:'Aviso rápido de avistamiento' }) : ''}
      <div class="chips">${[['activos','Activos'],['resuelto','Resueltos'],['todos','Todos']].map(([k, t]) => `<button class="chip ${filtro === k ? 'on' : ''}" data-a="abrir" data-v="reclamos" data-p="${k}">${t}</button>`).join('')}</div>
      ${ls.length ? ls.map(r => { const c = CAT_RECL[r.categoria] || CAT_RECL.otro, e = EST_RECL[r.estado], dias = Math.floor((Date.now() - r.createdAt) / DIA);
        return `<div class="card"><div class="row" style="align-items:flex-start"><span class="ic ic-${e[1]}" style="width:40px;height:40px;border-radius:13px;display:grid;place-items:center;flex:none">${I(c[1])}</span>
          <div class="grow"><b style="font-size:15px">${esc(r.titulo)}</b><div class="muted small">${c[0]}${esAdmin() ? ' · ' + esc(r.anonimo ? 'Anónimo para los vecinos' : autorVisible(r.userId).casa) : ''} · ${dias ? `hace ${dias} d` : 'hoy'}${r.publico ? ' · Publicado en el pizarrón' : ''}</div></div>
          <span class="pill p-${e[1]}">${e[0]}</span></div>
          ${r.lugar ? `<div class="small" style="margin-top:8px">${I('pin')} ${esc(r.lugar)}</div>` : ''}
          <p class="small" style="margin:8px 0 0;color:var(--ink-2)">${esc(r.detalle)}</p>${fotoHTML(r.foto, 'post-foto')}
          <div class="timeline">${(r.historial || []).map(h => `<div class="ev"><b>${EST_RECL[h.estado]?.[0] || ''}</b> · ${esc(h.texto)}<small>${esc(autorVisible(h.por).nombre)} · ${hace(h.at)}</small></div>`).join('')}</div>
          <div class="btns" style="margin-top:12px">${r.publico && r.userId !== u.id && !esStaff() ? `<button class="btn btn-sm ${r.apoyos?.includes(u.id) ? 'btn-accent' : 'btn-sec'}" data-a="apoyar" data-id="${r.id}">${I('users')}Me pasa también · ${r.apoyos?.length || 0}</button>` : r.apoyos?.length ? `<span class="pill">${I('users')}${plural(r.apoyos.length, 'vecino más', 'vecinos más')}</span>` : ''}
            ${esAdmin() ? `<button class="btn btn-sm btn-pri" data-a="gestionar-reclamo" data-id="${r.id}">${I('edit')}Actualizar</button>` : ''}</div></div>`; }).join('') : vacio('clipboard', 'No hay reclamos acá.')}`;
  },
};
A['nuevo-reclamo'] = () => hoja('Nuevo reclamo', `<form data-f="reclamo">
  <div class="field"><label>Tema</label><select name="categoria" id="reclCat">${Object.entries(CAT_RECL).map(([k, c]) => `<option value="${k}">${c[0]}</option>`).join('')}</select></div>
  <div class="field"><label>Título</label><input name="titulo" required maxlength="80" placeholder="Ej: Luminaria apagada"></div>
  <div class="field"><label>Detalle</label><textarea name="detalle" required maxlength="800"></textarea></div>
  <div class="field"><label>¿Dónde?</label><input name="lugar" maxlength="80" placeholder="Calle 3, frente a la casa 12"></div>
  ${campoFoto('fotoRecl')}
  <label class="check" id="anonBox" hidden><input type="checkbox" name="anonimo"><span>Si la Administración le manda un recordatorio amable al vecino, que no sepa que fui yo.</span></label>
  <button class="btn btn-pri btn-block" style="margin-top:8px">${I('send')}Enviar a la Administración</button></form>`);
document.addEventListener('change', e => { if (e.target.id === 'reclCat'){ const b = $('#anonBox'); if (b) b.hidden = e.target.value !== 'convivencia'; } });
F['reclamo'] = d => {
  const u = yo();
  Store.cambiar(s => {
    const r = { id:uid(), userId:u.id, categoria:d.categoria, titulo:d.titulo.trim(), detalle:d.detalle.trim(), lugar:(d.lugar || '').trim(), foto:leerFoto(d.foto), anonimo:!!d.anonimo,
      estado:'abierto', apoyos:[], createdAt:Date.now(), historial:[{ at:Date.now(), por:u.id, estado:'abierto', texto:'Reclamo creado' }] };
    s.reclamos.unshift(r);
    notificar(s, { para:'rol:admin', titulo:`Reclamo: ${r.titulo}`, texto:`${CAT_RECL[r.categoria][0]} · ${u.casa}`, icon:'clipboard', color:'warn', link:'reclamos' });
  });
  cerrarHoja(); toast('Reclamo enviado. Te avisamos cada novedad.', 'send');
};
A['apoyar'] = el => { const u = yo(); Store.cambiar(s => { const r = s.reclamos.find(x => x.id === el.dataset.id); if (!r) return; r.apoyos = r.apoyos || []; const i = r.apoyos.indexOf(u.id); i >= 0 ? r.apoyos.splice(i, 1) : r.apoyos.push(u.id); }); };
A['gestionar-reclamo'] = el => {
  const r = Store.s.reclamos.find(x => x.id === el.dataset.id); if (!r) return;
  hoja('Actualizar reclamo', `<form data-f="gestionar-reclamo" data-id="${r.id}">
    <div class="field"><label>Estado</label><div class="seg">${Object.entries(EST_RECL).map(([k, e]) => `<label><input type="radio" name="estado" value="${k}" ${r.estado === k ? 'checked' : ''}><span>${e[0]}</span></label>`).join('')}</div></div>
    <div class="field"><label>Mensaje para el vecino</label><textarea name="texto" required maxlength="400" placeholder="Ej: El electricista viene el viernes."></textarea></div>
    <label class="check"><input type="checkbox" name="publico" ${r.publico ? 'checked' : ''}><span>Es de interés general: publicarlo en el pizarrón (sin el nombre del vecino)</span></label>
    ${r.categoria === 'convivencia' ? `<hr class="sep"><div class="field"><label>Recordatorio amable a una casa (opcional)</label><select name="casaAviso"><option value="">No mandar</option>${opcionesLotes()}</select>
      <div class="ayuda">Le llega un aviso cordial con la norma de convivencia, sin decir quién reclamó.</div></div>` : ''}
    <button class="btn btn-pri btn-block">${I('check')}Guardar y avisar</button></form>`);
};
F['gestionar-reclamo'] = (d, form) => {
  Store.cambiar(s => {
    const r = s.reclamos.find(x => x.id === form.dataset.id); if (!r) return;
    r.estado = d.estado; r.historial.push({ at:Date.now(), por:yo().id, estado:d.estado, texto:d.texto.trim() });
    const para = [r.userId, ...(r.apoyos || [])];
    notificar(s, { para, titulo:`Reclamo ${EST_RECL[d.estado][0].toLowerCase()}: ${r.titulo}`, texto:d.texto.trim(), icon:'clipboard', color:EST_RECL[d.estado][1], link:'reclamos' });
    if (d.publico && !r.publico){ r.publico = true;
      s.posts.unshift({ id:uid(), type:'aviso', title:r.titulo, body:`${d.texto.trim()}${r.lugar ? '\nLugar: ' + r.lugar : ''}`, autor:yo().id, createdAt:Date.now(), reactions:{}, comments:[] }); }
    if (d.casaAviso){ const dest = s.users.filter(x => x.casa === d.casaAviso && x.estado === 'aprobado').map(x => x.id);
      notificar(s, { para:dest, titulo:'Un recordatorio amable de la Administración', texto:`Te recordamos las normas de convivencia del barrio (${CAT_RECL.convivencia[0].toLowerCase()}). ¡Gracias por colaborar!`, icon:'users', color:'sky', link:'documentos' });
      auditar(s, 'Recordatorio de convivencia enviado', d.casaAviso, r.id); }
  });
  cerrarHoja(); toast('Reclamo actualizado', 'check');
};

/* ---------- VOTACIONES (un voto por casa, secreto) ---------- */
R.votaciones = {
  titulo: 'Votaciones', icon: 'vote', color: 'accent', sub: 'Un voto por casa · el voto de cada casa es secreto',
  render(){
    const u = yo(), s = Store.s;
    const abiertas = s.votaciones.filter(v => v.cierra > Date.now()), cerradas = s.votaciones.filter(v => v.cierra <= Date.now());
    const card = v => {
      const abierta = v.cierra > Date.now();
      /* Un voto por lote: si en la casa hay cinco vecinos con cuenta, el voto es uno solo. */
      const val = x => typeof x === 'object' && x ? x.i : x;
      const votos = Object.values(v.votos).map(val), n = votos.length;
      const miVoto = v.votos[u.casa], mio = val(miVoto);
      const quien = miVoto && typeof miVoto === 'object' && miVoto.por ? nombreDe(miVoto.por) : '';
      const ver = !abierta || mio !== undefined || esAdmin();
      const cuenta = v.opciones.map((_, i) => votos.filter(x => x === i).length), gana = Math.max(...cuenta);
      const totalCasas = Math.max(totalLotes(), n, 1);
      return `<div class="card"><div class="row" style="align-items:flex-start"><div class="grow"><b style="font-size:16px">${esc(v.titulo)}</b>
        <div class="muted small">${abierta ? `Cierra el ${new Date(v.cierra).toLocaleDateString('es-AR', { day:'numeric', month:'short' })}` : 'Cerrada'} · ${plural(n, 'lote votó', 'lotes votaron')} de ${totalCasas}</div></div>
        <span class="pill ${abierta ? 'p-ok' : ''}">${abierta ? 'Abierta' : 'Cerrada'}</span></div>
        ${v.detalle ? `<p class="small" style="color:var(--ink-2)">${esc(v.detalle)}</p>` : ''}
        <div class="progreso" style="margin:8px 0 12px"><i style="width:${Math.min(100, n / totalCasas * 100)}%;background:var(--accent)"></i></div>
        ${v.opciones.map((o, i) => { const pct = n ? Math.round(cuenta[i] / n * 100) : 0;
          return abierta && !esStaff() ? `<button class="opcion ${mio === i ? 'elegida' : ''}" data-a="votar" data-id="${v.id}" data-v="${i}">${ver ? `<span class="barra" style="width:${pct}%"></span>` : ''}<span>${mio === i ? I('check') : ''}${esc(o)}</span>${ver ? `<span class="pct">${pct}%</span>` : ''}</button>`
            : `<div class="opcion ${!abierta && cuenta[i] === gana && n ? 'elegida' : ''}"><span class="barra" style="width:${pct}%"></span><span>${esc(o)}</span><span class="pct">${cuenta[i]} · ${pct}%</span></div>`; }).join('')}
        ${abierta && mio !== undefined ? `<p class="muted tiny" style="margin:4px 0 0">${quien && quien !== u.nombre ? `Votó ${esc(quien)} por ${esc(u.casa)}` : 'Tu lote ya votó'} · el voto es uno por lote y cualquiera de la casa puede cambiarlo hasta el cierre.</p>` : ''}</div>`;
    };
    return `${esAdmin() ? superficie({ a:'nueva-votacion', icon:'plus', t:'Nueva votación', s:'Asambleas, obras, reglas', cls:'acento' }) : ''}
      ${abiertas.length ? abiertas.map(card).join('') : vacio('vote', 'No hay votaciones abiertas.')}
      ${cerradas.length ? sec('Cerradas') + cerradas.map(card).join('') : ''}`;
  },
};
A['votar'] = el => { const u = yo(); let antes;
  Store.cambiar(s => { const v = s.votaciones.find(x => x.id === el.dataset.id); if (!v || v.cierra <= Date.now()) return;
    antes = v.votos[u.casa]; v.votos[u.casa] = { i:+el.dataset.v, por:u.id, at:Date.now() }; });
  toast(antes !== undefined ? `Cambiaste el voto de ${yo().casa}` : `Voto registrado por ${yo().casa}`, 'vote'); };
A['nueva-votacion'] = () => hoja('Nueva votación', `<form data-f="votacion">
  <div class="field"><label>Pregunta</label><input name="titulo" required maxlength="120"></div>
  <div class="field"><label>Detalle</label><textarea name="detalle" maxlength="600"></textarea></div>
  <div class="field"><label>Opciones (una por renglón)</label><textarea name="opciones" required>Sí\nNo\nMe abstengo</textarea></div>
  <div class="field"><label>Cierra</label><input type="date" name="cierra" required min="${sumarDias(hoyISO(), 1)}" value="${sumarDias(hoyISO(), 7)}"></div>
  <button class="btn btn-pri btn-block">${I('vote')}Abrir votación</button></form>`);
F['votacion'] = d => {
  const ops = d.opciones.split('\n').map(x => x.trim()).filter(Boolean);
  if (ops.length < 2){ toast('Hacen falta al menos dos opciones', 'vote'); return; }
  Store.cambiar(s => { s.votaciones.unshift({ id:uid(), titulo:d.titulo.trim(), detalle:d.detalle.trim(), opciones:ops, cierra:fechaDe(d.cierra).getTime() + 23 * HORA, votos:{}, creadaPor:yo().id, createdAt:Date.now() });
    notificar(s, { para:'todos', titulo:'Nueva votación', texto:d.titulo.trim(), icon:'vote', color:'accent', link:'votaciones', sonido:true }); });
  cerrarHoja(); toast('Votación abierta', 'vote');
};

/* ---------- PRIVADO con la Administración ---------- */
R.privado = {
  titulo: p => { const [con, id] = String(p || '').split('|'); return esStaff() && id ? (usuario(id)?.nombre || 'Conversación') : con === 'guardia' ? 'Guardia' : 'Administración'; },
  icon: 'lock', color: 'accent',
  sub: p => { const [con, id] = String(p || '').split('|');
    return esStaff() && id ? (usuario(id)?.casa || '') : con === 'guardia' ? 'Privado: solo lo ven vos y la guardia' : 'Privado: solo lo ven vos y la Administración'; },
  render(p){
    const u = yo(), s = Store.s;
    const [conP, idP] = String(p || '').split('|');
    const con = conP === 'guardia' ? 'guardia' : 'admin';
    /* La guardia ve solo sus conversaciones; la Administración, las suyas. */
    const miCanal = esGuardia() ? 'guardia' : esAdmin() ? 'admin' : con;
    if (esStaff() && !idP){
      const hilos = s.privados.filter(h => (h.con || 'admin') === miCanal).sort((a, b) => (b.msgs.at(-1)?.createdAt || 0) - (a.msgs.at(-1)?.createdAt || 0));
      return `${superficie({ a:'nuevo-post', v:'aviso', icon:'send', color:'brand', t:'Avisar algo a un lote', s:'Elegí el lote en "¿Para quién?"' })}
        ${hilos.length ? hilos.map(h => { const v = usuario(h.userId) || {}, ult = h.msgs.at(-1), nl = h.msgs.filter(m => m.from === 'vecino' && !m.leido).length;
          return `<button class="superficie" data-a="abrir" data-v="privado" data-p="${miCanal}|${h.userId}">${v.fotoCasa ? fotoHTML(v.fotoCasa, 'casa-foto chica') : avatar(v)}<span class="txt"><b>${esc(v.nombre || '')} · ${esc(v.casa || '')}</b><small>${ult ? esc(ult.text.slice(0, 70)) + ' · ' + hace(ult.createdAt) : 'Sin mensajes'}</small></span>${nl ? `<span class="pill p-danger">${nl}</span>` : I('right')}</button>`; }).join('')
          : vacio('lock', 'No hay conversaciones.')}`;
    }
    const quienId = esStaff() ? idP : u.id;
    let h = s.privados.find(x => x.userId === quienId && (x.con || 'admin') === miCanal);
    const yoSoy = esStaff() ? miCanal : 'vecino';
    const mio = m => esStaff() ? m.from !== 'vecino' : m.from === 'vecino';
    if (h && h.msgs.some(m => !mio(m) && !m.leido)){ h.msgs.forEach(m => { if (!mio(m)) m.leido = true; }); Store.guardar(); setTimeout(pintarTop, 0); }
    const msgs = h ? h.msgs : [];
    const chips = esStaff() ? '' : `<div class="chips">
      <button class="chip ${con === 'admin' ? 'on' : ''}" data-a="abrir" data-v="privado" data-p="admin">${I('sliders')}Administración</button>
      <button class="chip ${con === 'guardia' ? 'on' : ''}" data-a="abrir" data-v="privado" data-p="guardia">${I('shield')}Guardia</button></div>`;
    return `<div class="chat-wrap">${chips}<div class="chat">${msgs.length ? msgs.map(m => `<div class="msg ${mio(m) ? 'mia' : ''}">
        <div class="b">${esc(m.text)}<time>${hora(m.createdAt)}</time></div></div>`).join('')
        : vacio('lock', esStaff() ? 'Sin mensajes con este lote.' : con === 'guardia' ? 'Escribile a la guardia. Nadie más lo ve.' : 'Escribí tu consulta. Solo la lee la Administración.')}</div>
      <form class="chatbar" data-f="privado" data-u="${esc(quienId)}" data-con="${miCanal}"><input name="text" id="privIn" required maxlength="800" placeholder="${esStaff() ? 'Responder…' : con === 'guardia' ? 'Mensaje a la guardia' : 'Mensaje a la Administración'}" autocomplete="off"><button class="btn btn-accent">${I('send')}</button></form></div>`;
  },
  alPintar(){ const c = $('#cuerpo'); if (c) c.scrollTop = c.scrollHeight; },
};
F['privado'] = (d, form) => {
  const u = yo(), para = form.dataset.u, con = form.dataset.con === 'guardia' ? 'guardia' : 'admin';
  const from = esStaff() ? con : 'vecino';
  Store.cambiar(s => {
    let h = s.privados.find(x => x.userId === para && (x.con || 'admin') === con);
    if (!h){ h = { id:uid(), userId:para, con, msgs:[] }; s.privados.push(h); }
    h.msgs.push({ id:uid(), from, text:d.text.trim(), createdAt:Date.now() });
    notificar(s, from !== 'vecino'
      ? { para, titulo: con === 'guardia' ? 'Mensaje de la guardia' : 'Mensaje de la Administración', texto:d.text.trim().slice(0, 90), icon:'lock', color:'accent', link:'privado:' + con, sonido:true }
      : { para: con === 'guardia' ? 'rol:guardia' : 'rol:admin', titulo:`Mensaje de ${u.casa}`, texto:d.text.trim().slice(0, 90), icon:'lock', color:'accent', link:'privado:' + con + '|' + u.id });
  });
  const i = $('#privIn'); if (i){ i.value = ''; i.focus(); }
};

/* ---------- DOCUMENTOS Y NORMAS, con buscador ---------- */
R.documentos = {
  titulo: 'Normas y documentos', icon: 'file', color: 'brand', sub: 'Reglamento, convivencia y protocolos',
  render(q){
    const docs = Store.s.documentos;
    const qq = (q || '').trim().toLowerCase();
    let resultados = '';
    if (qq){
      const pal = qq.split(/\s+/).filter(w => w.length > 2);
      const hits = [];
      docs.forEach(d => d.texto.split(/\n+/).forEach(par => { const pl = par.toLowerCase(); const n = pal.filter(w => pl.includes(w)).length; if (n) hits.push({ d, par, n }); }));
      hits.sort((a, b) => b.n - a.n);
      resultados = sec(`Respuestas para "${esc(q)}"`) + (hits.length ? hits.slice(0, 6).map(h => `<div class="card" style="padding:12px 14px"><div class="muted tiny">${esc(h.d.titulo)}</div><div class="small">${esc(h.par).replace(new RegExp(`(${pal.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi'), '<mark>$1</mark>')}</div></div>`).join('')
        : vacio('search', 'No encontramos eso en las normas. Preguntale a la Administración.'));
    }
    return `<form data-f="buscar-norma" class="linea-form" style="margin-bottom:12px"><input name="q" id="qNorma" value="${esc(q || '')}" placeholder="Preguntá: ¿hasta qué hora puedo hacer obra?"><button class="btn btn-pri">${I('search')}</button></form>
      ${resultados}${sec('Documentos')}
      ${docs.map(d => superficie({ a:'ver-doc', id:d.id, icon:'file', color: d.tipo === 'Convivencia' ? 'accent' : 'brand', t:esc(d.titulo), s:`${esc(d.tipo || 'Documento')} · actualizado ${hace(d.updatedAt || d.createdAt)}` })).join('')}
      ${esAdmin() ? superficie({ a:'abrir', v:'admin', p:'contenido', icon:'edit', color:'accent', t:'Editar documentos', s:'Desde Administración → Contenido' }) : ''}`;
  },
};
F['buscar-norma'] = d => abrir('documentos', d.q || '');
A['ver-doc'] = el => { const d = Store.s.documentos.find(x => x.id === el.dataset.id); if (d) hoja(d.titulo, `<div style="white-space:pre-wrap;font-size:14.5px;line-height:1.6">${esc(d.texto)}</div>${d.link ? `<a class="btn btn-sec btn-block" style="margin-top:14px" href="${esc(d.link)}" target="_blank" rel="noopener">${I('file')}Abrir el documento completo</a>` : ''}`, { ancho:'720px' }); };

/* ---------- EXPENSAS ---------- */
R.expensas = {
  titulo: 'Expensas', icon: 'wallet', color: 'wood', sub: 'Resumen, cupones y pagos',
  render(){
    const c = Store.s.config, hoy = new Date(), vence = new Date(hoy.getFullYear(), hoy.getMonth() + (hoy.getDate() > c.expensasVence ? 1 : 0), c.expensasVence);
    const dias = Math.ceil((vence - hoy) / DIA);
    return `<div class="card" style="background:linear-gradient(140deg,#b85f24,#7a3a12);color:#fff;border:0"><div class="small" style="opacity:.85">Próximo vencimiento</div>
      <div style="font-size:30px;font-weight:800;letter-spacing:-1px">${vence.getDate()} de ${MESES[vence.getMonth()]}</div><div class="small" style="opacity:.9">${dias === 0 ? 'Vence hoy' : `Faltan ${plural(dias, 'día')}`}</div>
      <a class="btn" style="background:#fff;color:#7a3a12;margin-top:14px" href="${esc(c.expensasUrl)}" target="_blank" rel="noopener">${I('wallet')}Ver y pagar en el portal</a></div>
      ${(() => { const L = loteDe(yo()); if (!L) return '';
        const ult = Store.s.padron.find(x => 'Lote ' + x.lote === yo().casa);
        return `<div class="card"><b style="font-size:15px">Tu lote</b>
          <div class="lista"><div class="it"><div class="txt"><b>${esc(nombreLote(L))} · UF ${L.uf}</b><span>Coeficiente de prorrateo</span></div><span class="pill p-brand">${L.coef.toFixed(3)} %</span></div>
          ${ult ? `<div class="it"><div class="txt"><b>Última liquidación cargada</b><span>${esc(Store.s.padronPeriodo || '')}</span></div><span class="pill">$ ${ult.expensasAgosto.toLocaleString('es-AR', { minimumFractionDigits:2 })}</span></div>` : ''}</div>
          <p class="muted tiny" style="margin:8px 0 0">De cada $100 de gastos del barrio, a tu lote le corresponden $${L.coef.toFixed(2)}.</p></div>`; })()}
      <div class="card"><b style="font-size:15px">Datos para transferir</b>
        <div class="lista"><div class="it"><div class="txt"><b>Alias</b><span>${esc(Store.s.config.alias)}</span></div><button class="btn btn-xs btn-sec" data-a="copiar" data-v="${esc(Store.s.config.alias)}">${I('copy')}</button></div>
        <div class="it"><div class="txt"><b>CBU</b><span class="mono">${esc(Store.s.config.cbu)}</span></div><button class="btn btn-xs btn-sec" data-a="copiar" data-v="${esc(Store.s.config.cbu)}">${I('copy')}</button></div>
        <div class="it"><div class="txt"><b>Titular</b><span>Barrio Bahía Cauquén · CUIT ${esc(Store.s.config.cuit)}</span></div></div></div></div>
      ${superficie({ a:'abrir', v:'privado', icon:'lock', color:'accent', t:'Consultar a la Administración', s:'Cupones, planes de pago, dudas' })}
      <p class="muted small">Hoy el resumen y el pago se hacen en el portal de expensas. La app te avisa sola tres días antes de cada vencimiento, y la contabilidad propia del barrio está en camino.</p>`;
  },
};

/* ---------- RESIDUOS ---------- */
R.recoleccion = {
  titulo: 'Residuos', icon: 'truck', color: 'ok', sub: 'Recolección y voluminosos',
  render(){
    const c = Store.s.config, hoy = new Date().getDay();
    return `<div class="recoleccion">${[1,2,3,4,5,6,0].map(d => `<div class="${d === hoy ? 'hoy-r' : ''}"><b>${DIAS[d]}</b>${c.recoleccion[d] ? I('truck') + esc(c.recoleccion[d]) : '<span class="muted">—</span>'}</div>`).join('')}</div>
      <p class="muted small">El camión pasa desde las ${c.recoleccionHora} h. Si al otro día es feriado, puede cambiar: la app avisa.</p>
      ${sec('Voluminosos')}<div class="card">${c.voluminosos ? `<b>Próximo retiro: ${fechaLarga(c.voluminosos)}</b>` : '<b>Sin fecha de retiro cargada</b>'}<p class="small" style="margin:6px 0 0;color:var(--ink-2)">${esc(c.voluminososDetalle)}</p></div>
      ${sec('Para tener en cuenta')}<div class="card small" style="color:var(--ink-2);line-height:1.6">
        • Canasto elevado y cerrado: los perros y los zorros rompen las bolsas.<br>• Con viento fuerte, sacá la bolsa a la mañana y no la noche anterior.<br>• La poda va al contenedor verde, atada.<br>• Pilas, aceite y electrónicos no van a la basura común.</div>
      ${superficie({ a:'avistamiento', icon:'eye', color:'warn', t:'¿Viste zorros o perros en la basura?', s:'Avisá y la app alerta al barrio si se repite' })}`;
  },
};

/* ---------- EMERGENCIAS Y AGENDA ---------- */
R.agenda = {
  titulo: 'Emergencias y agenda', icon: 'phone', color: 'danger', sub: 'Tocá un teléfono para llamar',
  render(q){
    const s = Store.s, qq = (q || '').toLowerCase();
    const cats = [...new Set(s.agenda.map(a => a.categoria))];
    const it = a => `<div class="it"><div class="txt"><b>${esc(a.nombre)}</b>${a.detalle ? `<span>${esc(a.detalle)}</span>` : ''}</div>${a.tel ? `<a class="tel-btn" href="${telLink(a.tel)}">${I('phone')}${esc(a.tel)}</a>` : '<span class="muted tiny">sin teléfono</span>'}</div>`;
    const lista = qq ? s.agenda.filter(a => (a.nombre + ' ' + a.detalle + ' ' + a.categoria).toLowerCase().includes(qq)) : null;
    return `<div class="btns" style="margin-bottom:12px"><a class="btn btn-danger" href="tel:911">${I('phone')}911</a><a class="btn btn-danger-soft" href="tel:107">107 Ambulancia</a><a class="btn btn-danger-soft" href="tel:100">100 Bomberos</a><a class="btn btn-danger-soft" href="tel:101">101 Policía</a></div>
      <div class="card"><b>${I('heart')} Desfibrilador (DEA) del barrio</b><div class="small" style="color:var(--ink-2);margin-top:4px">${esc(s.config.dea)}</div></div>
      ${sec('Del barrio')}<div class="card lista">${s.contactos.map(c => it({ nombre:c.nombre, detalle:c.detalle, tel:c.tel })).join('')}</div>
      <form data-f="buscar-agenda" class="linea-form" style="margin:16px 0 4px"><input name="q" id="qAgenda" value="${esc(q || '')}" placeholder="Buscar farmacia, taxi, veterinaria…"><button class="btn btn-pri">${I('search')}</button></form>
      ${lista ? `<div class="card lista">${lista.length ? lista.map(it).join('') : vacio('search', 'Sin resultados')}</div>`
        : cats.map(c => `${sec(esc(c))}<div class="card lista">${s.agenda.filter(a => a.categoria === c).map(it).join('')}</div>`).join('')}`;
  },
};
F['buscar-agenda'] = d => abrir('agenda', d.q || '');

/* ---------- USHUAIA: temporadas, feriados, eventos ---------- */
function enTemporada(t, iso = hoyISO()){
  const md = iso.slice(5);
  return t.desde <= t.hasta ? md >= t.desde && md <= t.hasta : md >= t.desde || md <= t.hasta;
}
function diasHasta(md, iso = hoyISO()){
  const y = +iso.slice(0, 4); let f = `${y}-${md}`; if (f < iso) f = `${y + 1}-${md}`;
  return Math.round((fechaDe(f) - fechaDe(iso)) / DIA);
}
const proximoFeriado = () => Store.s.feriados.filter(f => f.fecha >= hoyISO()).sort((a, b) => a.fecha.localeCompare(b.fecha))[0];
R.ushuaia = {
  titulo: 'Ushuaia', icon: 'pin', color: 'sky', sub: 'Temporadas, feriados y eventos de la ciudad',
  render(){
    const s = Store.s, hoy = hoyISO();
    const temp = s.temporadas.map(t => { const on = enTemporada(t);
      const d = on ? diasHasta(t.hasta) : diasHasta(t.desde);
      return `<div class="card"><div class="row"><span class="ic ic-${on ? 'ok' : 'sky'}" style="width:40px;height:40px;border-radius:13px;display:grid;place-items:center">${I(t.icon || 'calendar')}</span>
        <div class="grow"><b>${esc(t.nombre)}</b><div class="small ${on ? '' : 'muted'}">${on ? `En temporada · termina en ${plural(d, 'día')}` : `Empieza en ${plural(d, 'día')}`}</div></div>
        <span class="pill ${on ? 'p-ok' : ''}">${on ? 'Ahora' : 'Fuera'}</span></div>
        <div class="muted tiny" style="margin-top:8px">${esc(t.nota || '')}</div></div>`; }).join('');
    const fer = s.feriados.filter(f => f.fecha >= hoy).sort((a, b) => a.fecha.localeCompare(b.fecha)).slice(0, 6);
    const evs = s.eventosCiudad.filter(e => e.fecha >= hoy).sort((a, b) => a.fecha.localeCompare(b.fecha));
    return `${Clima.alertas().map(a => aviso(a.nivel, a.icon, a.t, a.x)).join('')}
      ${sec('Temporadas')}${temp}
      ${sec('Próximos feriados')}<div class="card lista">${fer.length ? fer.map(f => `<div class="it"><div class="txt"><b>${esc(f.nombre)}</b><span>${fechaLarga(f.fecha)}</span></div><span class="pill ${f.fecha === hoy ? 'p-ok' : ''}">${relDia(f.fecha)}</span></div>`).join('') : vacio('calendar', 'No hay feriados cargados.')}</div>
      ${sec('Eventos en la ciudad', esStaff() || true ? `<button class="link" data-a="nuevo-evento-ciudad">Sumar uno</button>` : '')}
      ${evs.length ? evs.map(e => `<div class="card"><div class="row" style="align-items:flex-start"><div class="evento-box" style="margin:0;padding:0;background:none"><div class="fecha"><small>${MESES[fechaDe(e.fecha).getMonth()]}</small><b>${fechaDe(e.fecha).getDate()}</b></div></div>
        <div class="grow"><b>${esc(e.titulo)}</b><div class="muted small">${esc(e.tipo || '')}${e.hora ? ' · ' + e.hora + ' h' : ''}${e.lugar ? ' · ' + esc(e.lugar) : ''}</div>${e.nota ? `<div class="small" style="margin-top:4px;color:var(--ink-2)">${esc(e.nota)}</div>` : ''}
        ${e.link ? `<a class="small" href="${esc(e.link)}" target="_blank" rel="noopener">Más información</a>` : ''}</div></div></div>`).join('') : vacio('calendar', 'No hay eventos cargados.')}
      ${sec('Fauna en el barrio')}${superficie({ a:'avistamiento', icon:'eye', color:'warn', t:'Avisar un avistamiento', s:`${plural(s.avistamientos.filter(a => Date.now() - a.at < 7 * DIA).length, 'aviso')} esta semana` })}
      <p class="muted tiny">Las fechas de temporadas y feriados cambian por decreto u ordenanza: la Administración las confirma cada año.</p>`;
  },
};
A['nuevo-evento-ciudad'] = () => hoja('Sumar un evento de la ciudad', `<form data-f="evento-ciudad">
  <div class="field"><label>Evento</label><input name="titulo" required maxlength="80" placeholder="Recital, partido, feria…"></div>
  <div class="grid3"><div class="field"><label>Tipo</label><select name="tipo"><option>Deporte</option><option>Recital</option><option>Festival</option><option>Feria</option><option>Acto</option><option>Otro</option></select></div>
    <div class="field"><label>Fecha</label><input type="date" name="fecha" required min="${hoyISO()}"></div><div class="field"><label>Hora</label><input type="time" name="hora"></div></div>
  <div class="field"><label>Lugar</label><input name="lugar" maxlength="60"></div>
  <div class="field"><label>Enlace con la fuente (opcional)</label><input name="link" type="url" placeholder="https://"></div>
  <button class="btn btn-pri btn-block">${I('plus')}Sumar</button></form>`);
F['evento-ciudad'] = d => { Store.cambiar(s => s.eventosCiudad.push({ id:uid(), titulo:d.titulo.trim(), tipo:d.tipo, fecha:d.fecha, hora:d.hora, lugar:d.lugar, link:d.link, nota:'', por:yo().id })); cerrarHoja(); toast('Evento sumado', 'calendar'); };

/* ---------- VUELOS USH ----------
   Aeropuertos Argentina publica arribos y partidas. Su servicio acepta
   pedidos desde otras páginas, pero a veces responde vacío: en ese caso
   se muestran los enlaces oficiales. Con un Worker propio (vuelosProxy)
   se suman además los aviones en vivo de OpenSky sobre el barrio. */
const Vuelos = {
  KEY:'bhc.vuelos', d:null, estado:'', cargando:null,
  leer(){ try { this.d = JSON.parse(localStorage.getItem(this.KEY)); } catch(e){} },
  cuantosHoy(){ return this.d && Date.now() - this.d.t < 6 * HORA ? (this.d.arr.length + this.d.dep.length) || '' : ''; },
  campo(o, ...ks){ for (const k of ks) if (o && o[k] != null && o[k] !== '') return o[k]; return ''; },
  normalizar(x, tipo){
    const h = String(this.campo(x, 'stda', 'sched', 'std', 'sta', 'scheduled', 'hora', 'fecha')).match(/(\d{1,2}):(\d{2})/);
    return { tipo, nro:this.campo(x, 'nro', 'flight', 'vuelo') || `${this.campo(x, 'idaerolinea', 'id_airline', 'airline')} ${this.campo(x, 'flight_number', 'numero')}`.trim(),
      aerolinea:this.campo(x, 'aerolinea', 'airline_name', 'airline', 'idaerolinea'), lugar:this.campo(x, 'destorig', 'destino', 'origen', 'city', 'ciudad'),
      hora:h ? `${pad(h[1])}:${h[2]}` : '', estado:this.campo(x, 'estes', 'estado', 'status', 'remark'), real:String(this.campo(x, 'atda', 'etda', 'actual', 'estimated')).match(/\d{1,2}:\d{2}/)?.[0] || '' };
  },
  async pedir(forzar = false){
    if (!forzar && this.d && Date.now() - this.d.t < 5 * MIN) return this.d;
    if (this.cargando) return this.cargando;
    const base = 'https://webaa-api-h4d5amdfcze7hthn.a02.azurefd.net/web-prod/v1/api-aa/all-flights';
    const f = hoyISO().split('-').reverse().join('-');
    const traer = mov => fetch(`${base}?c=900&idarpt=USH&movtp=${mov}&f=${f}`).then(r => r.ok ? r.text() : '[]').then(t => { try { const j = JSON.parse(t || '[]'); return Array.isArray(j) ? j : (j.data || j.vuelos || []); } catch(e){ return []; } }).catch(() => null);
    this.cargando = Promise.all([traer('A'), traer('D')]).then(async ([a, d]) => {
      let vivos = [];
      const px = Store.s.config.vuelosProxy;
      if (px){ try { const j = await fetch(px).then(r => r.json()); vivos = (j.states || []).map(s => ({ callsign:(s[1] || '').trim(), alt:Math.round(s[7] || 0), vel:Math.round((s[9] || 0) * 3.6), suelo:s[8] })); } catch(e){} }
      if (a === null && d === null){ this.estado = 'sin-conexion'; return this.d; }
      this.estado = (a || []).length + (d || []).length ? 'ok' : 'vacio';
      this.d = { t:Date.now(), arr:(a || []).map(x => this.normalizar(x, 'A')), dep:(d || []).map(x => this.normalizar(x, 'D')), vivos };
      try { localStorage.setItem(this.KEY, JSON.stringify(this.d)); } catch(e){}
      return this.d;
    }).finally(() => { this.cargando = null; });
    return this.cargando;
  },
};
Vuelos.leer();
R.vuelos = {
  titulo: 'Vuelos USH', icon: 'send', color: 'accent', sub: 'Aeropuerto Malvinas Argentinas · arribos y partidas',
  render(){
    const d = Vuelos.d, ok = d && (d.arr.length || d.dep.length);
    const fila = v => `<div class="it"><div class="mono" style="font-weight:800;width:52px">${esc(v.hora)}</div><div class="txt"><b>${esc(v.lugar)}</b><span>${esc(v.nro)}${v.aerolinea ? ' · ' + esc(v.aerolinea) : ''}</span></div>
      <span class="pill ${/cancel/i.test(v.estado) ? 'p-danger' : /demor|delay/i.test(v.estado) ? 'p-warn' : /aterr|arrib|desp|landed|departed/i.test(v.estado) ? 'p-ok' : ''}">${esc(v.estado || (v.real ? 'Est. ' + v.real : 'Programado'))}</span></div>`;
    const porHora = {}; if (ok) [...d.arr, ...d.dep].forEach(v => { const h = v.hora.slice(0, 2); if (h) porHora[h] = (porHora[h] || 0) + 1; });
    const horas = Object.keys(porHora).sort();
    return `${!d && !Vuelos.estado ? `<div class="vacio">${I('refresh')}Buscando vuelos de hoy…</div>` : ''}
      ${ok ? `<div class="garita-kpis"><div class="kpi"><b>${d.arr.length}</b><span>Arribos</span></div><div class="kpi"><b>${d.dep.length}</b><span>Partidas</span></div><div class="kpi"><b>${d.arr.length + d.dep.length}</b><span>Hoy</span></div></div>
        ${horas.length ? `<div class="card"><b style="font-size:14px">Movimientos por hora</b><div style="display:flex;align-items:flex-end;gap:4px;height:70px;margin-top:10px">${horas.map(h => `<div style="flex:1;text-align:center"><div style="height:${porHora[h] * 16}px;background:var(--accent);border-radius:4px 4px 0 0;opacity:.8"></div><div class="tiny muted">${h}</div></div>`).join('')}</div></div>` : ''}
        ${sec('Arribos')}<div class="card lista">${d.arr.map(fila).join('') || vacio('send', 'Sin arribos')}</div>
        ${sec('Partidas')}<div class="card lista">${d.dep.map(fila).join('') || vacio('send', 'Sin partidas')}</div>`
      : Vuelos.estado ? aviso('info', 'info', 'El listado oficial no respondió desde la app', 'Mientras tanto, estos son los enlaces directos de Aeropuertos Argentina:') : ''}
      ${d?.vivos?.length ? sec('En el aire ahora, cerca del barrio') + `<div class="card lista">${d.vivos.map(v => `<div class="it"><div class="txt"><b>${esc(v.callsign || 'Sin identificar')}</b><span>${v.suelo ? 'En tierra' : `${v.alt} m · ${v.vel} km/h`}</span></div></div>`).join('')}</div>` : ''}
      ${sec('Enlaces')}
      ${superficie({ a:'link', v:'https://www.aeropuertosargentina.com/es/vuelos?movtp=arribos&idarpt=USH', icon:'login', color:'accent', t:'Arribos a Ushuaia', s:'Aeropuertos Argentina' })}
      ${superficie({ a:'link', v:'https://www.aeropuertosargentina.com/es/vuelos?movtp=partidas&idarpt=USH', icon:'logout', color:'accent', t:'Partidas de Ushuaia', s:'Aeropuertos Argentina' })}
      ${superficie({ a:'link', v:'https://www.flightradar24.com/-54.84,-68.30/12', icon:'eye', color:'sky', t:'Mapa de aviones en vivo', s:'Flightradar24 sobre Ushuaia' })}
      <button class="btn btn-sec btn-block" data-a="vuelos-actualizar">${I('refresh')}Actualizar</button>`;
  },
  alPintar(){ if (!Vuelos.d || Date.now() - Vuelos.d.t > 5 * MIN) Vuelos.pedir().then(() => { if (PILA.at(-1)?.id === 'vuelos') refrescar(); }); },
};
A['vuelos-actualizar'] = () => Vuelos.pedir(true).then(() => { refrescar(); toast('Vuelos actualizados', 'refresh'); });
A['link'] = el => window.open(el.dataset.v, '_blank', 'noopener');

/* ---------- MI CASA ---------- */
R.perfil = {
  titulo: 'Mi casa', icon: 'home', color: 'ok', sub: 'Tus datos, familia, autos y mascotas',
  render(){
    const u = yo(), tema = Store.sesion.tema || 'auto';
    const notif = 'Notification' in window ? Notification.permission : 'no';
    const L = loteDe(u);
    return `<div class="card"><div class="perfil-cab">${avatar(u, 'lg')}<div class="grow"><b style="font-size:18px">${esc(u.nombre)}</b><div class="muted small">${esc(u.casa)} · ${esc(u.email)}</div>
      <div class="muted tiny">${{ vecino:'Vecino/a', admin:'Administración', guardia:'Guardia' }[u.rol]}${u.dni ? ' · DNI ' + esc(u.dni) : ''}${L ? ' · UF ' + L.uf + ' · coeficiente ' + L.coef.toFixed(3) + '%' : ''}</div></div></div></div>
      <div class="card"><div class="row" style="align-items:flex-start;gap:14px">
        ${u.fotoCasa ? fotoHTML(u.fotoCasa, 'casa-foto') : `<span class="casa-foto vacia">${I('home')}</span>`}
        <div class="grow"><b style="font-size:14.5px">Foto del frente de tu casa</b>
          <p class="muted small" style="margin:4px 0 10px">Sirve para que la guardia y los vecinos reconozcan tu domicilio de una mirada. La foto grande queda en este equipo; a la app solo sube una miniatura.</p>
          <label class="btn btn-sm btn-sec">${I('camera')}${u.fotoCasa ? 'Cambiar foto' : 'Sacar o elegir foto'}<input type="file" accept="image/*" capture="environment" data-foto-in="fotoCasaIn" hidden></label>
          <input type="hidden" id="fotoCasaIn" data-a="" >
        </div></div></div>
      <form data-f="perfil" class="card">
        <div class="field"><label>Teléfono / WhatsApp</label><input name="tel" id="pfTel" value="${esc(u.tel || '')}" inputmode="tel" maxlength="20"></div>
        <div class="field"><label>Oficios o servicios que ofrecés</label><input name="skills" id="pfSkills" value="${esc(u.skills || '')}" maxlength="120" placeholder="Ej: electricista, clases de inglés"></div>
        <label class="check"><input type="checkbox" name="mostrarTel" ${u.mostrarTel ? 'checked' : ''}><span>Aparecer en "Oficios de vecinos" con mi WhatsApp</span></label>
        <label class="check"><input type="checkbox" name="respondedor" ${u.respondedor ? 'checked' : ''}><span><b>Sé primeros auxilios / RCP o soy del equipo de salud.</b> Avisame si un vecino pide ayuda médica con el SOS.</span></label>
        <hr class="sep"><div class="lbl">Directorio de vecinos</div>
        <div class="grid2"><div class="field"><label>Profesión</label><input name="profesion" id="pfProf" value="${esc(u.profesion || '')}" maxlength="60" placeholder="Médica, abogado, docente…"></div>
          <div class="field"><label>Dirección dentro del barrio</label><input name="direccion" id="pfDir" value="${esc(u.direccion || '')}" maxlength="60" placeholder="Calle 3 N° 42"></div></div>
        <div class="field"><label>Ubicación exacta (para "Cómo llegar")</label><div class="linea-form"><input name="ubicacion" id="pfUbi" value="${esc(u.ubicacion || '')}" placeholder="-54.8195,-68.3790"><button type="button" class="btn btn-sec" data-a="mi-ubicacion" title="Usar mi ubicación actual">${I('pin')}</button></div><div class="ayuda">Tocá el pin estando en tu casa.</div></div>
        <label class="check"><input type="checkbox" name="enDirectorio" ${u.enDirectorio ? 'checked' : ''}><span>Mostrar a los vecinos mi profesión, teléfono y dirección en el buscador</span></label>
        <div class="field" style="margin-top:10px"><label>Quiénes viven en la casa</label><input name="integrantes" id="pfInt" value="${esc(u.integrantes || '')}" maxlength="160"></div>
        <button class="btn btn-pri btn-block">${I('check')}Guardar</button></form>
      ${sec('Vehículos', `<button class="link" data-a="nuevo-vehiculo">Sumar</button>`)}
      <div class="card lista">${(u.vehiculos || []).length ? u.vehiculos.map((v, i) => `<div class="it">${I('car')}<div class="txt"><b class="mono">${esc(v.patente)}</b><span>${esc(v.modelo || '')}</span></div><button class="icon-btn" data-a="borrar-vehiculo" data-v="${i}" aria-label="Quitar">${I('trash')}</button></div>`).join('') : '<p class="muted small" style="margin:4px 0">La guardia reconoce tus patentes al instante.</p>'}</div>
      ${sec('Mascotas', `<button class="link" data-a="nueva-mascota">Sumar</button>`)}
      <div class="card lista">${(u.mascotas || []).length ? u.mascotas.map(m => `<div class="it">${m.foto ? fotoHTML(m.foto, 'mini-foto') : I('paw')}<div class="txt"><b>${esc(m.nombre)}</b><span>${esc(m.especie || '')} · ${esc(m.desc || '')}</span></div><button class="icon-btn" data-a="borrar-mascota" data-v="${m.id}" aria-label="Quitar">${I('trash')}</button></div>`).join('') : '<p class="muted small" style="margin:4px 0">Si se pierde, la avisás a todo el barrio con un toque.</p>'}</div>
      ${Store.s.infracciones.some(i => i.casa === u.casa) ? superficie({ v:'infracciones', icon:'alert', color:'danger', t:'Notificaciones de la Administración', s:'Infracciones y descargos de tu casa' }) : ''}
      ${sec('Guardia')}
      ${superficie({ a:'abrir', v:'peticiones', icon:'edit', color:'brand', t:'Peticiones a la garita', s:'Firmadas y con historial' })}
      ${superficie({ a:'modo-viaje', icon:'lock', color:'wood', t:'Me voy de viaje', s: u.viaje ? `Casa sola hasta el ${fechaCorta(u.viaje.hasta)}` : 'Rondas extra mientras no estás' })}
      ${sec('Este equipo')}
      <div class="card"><div class="lbl">Modo de pantalla · ahora está en ${modoActual()}</div>
        <div class="seg">${[['auto','Automático','sunrise'],['light','Día','sun'],['dark','Noche','moon']].map(([k, t, ic]) => `<label><input type="radio" name="tema" ${tema === k ? 'checked' : ''} data-a="tema" data-v="${k}"><span>${I(ic)}${t}</span></label>`).join('')}</div>
        <div class="ayuda">En automático sigue el sol de Ushuaia: hoy amanece ${Clima.sol().sale} y anochece ${Clima.sol().pone}.</div>
        <div class="lbl" style="margin-top:14px">Avisos en este equipo</div>
        ${notif === 'granted' ? '<p class="small" style="margin:0">Activados.</p>' : notif === 'no' ? '<p class="small muted" style="margin:0">Este navegador no los permite.</p>' : `<button class="btn btn-sm btn-sec" data-a="pedir-notifs">${I('bell')}Activar avisos</button>`}
        <label class="check" style="margin-top:10px"><input type="checkbox" data-a="sonido" ${Store.sesion.sinSonido ? '' : 'checked'}><span>Sonido cuando escribe la guardia o la Administración</span></label></div>
      ${superficie({ a:'cambiar-clave', icon:'key', color:'brand', t: Nube.activa() ? 'Cambiar mi contraseña' : 'Cambiar mi clave', s:'Cuando quieras' })}
      ${superficie({ a:'cambiar-email', icon:'mail', color:'sky', t:'Cambiar mi correo', s:esc(u.email) })}
      ${superficie({ a:'mis-datos', icon:'download', color:'sky', t:'Mis datos personales', s:'Descargarlos o pedir que se borren (Ley 25.326)' })}
      ${superficie({ a:'salir', icon:'logout', color:'danger', t:'Cerrar sesión', cls:'peligro' })}`;
  },
};
F['perfil'] = d => { const u = yo(); Store.cambiar(s => Object.assign(s.users.find(x => x.id === u.id), { tel:d.tel.trim(), skills:d.skills.trim(), mostrarTel:!!d.mostrarTel, respondedor:!!d.respondedor, integrantes:d.integrantes.trim(),
  profesion:(d.profesion || '').trim(), direccion:(d.direccion || '').trim(), ubicacion:(d.ubicacion || '').trim(), enDirectorio:!!d.enDirectorio })); toast('Guardado', 'check'); };
/* La foto del frente se guarda apenas se elige. */
document.addEventListener('change', e => {
  const i = e.target.closest('input[data-foto-in="fotoCasaIn"]');
  if (!i) return;
  const esperar = setInterval(() => {
    const v = document.getElementById('fotoCasaIn');
    if (v && v.value){ clearInterval(esperar); const f = leerFoto(v.value);
      Store.cambiar(s => { const x = s.users.find(z => z.id === yo().id); if (x.fotoCasa?.fotoId) Fotos.borrar(x.fotoCasa.fotoId); x.fotoCasa = f; });
      toast('Foto de tu casa guardada', 'home'); }
  }, 300);
  setTimeout(() => clearInterval(esperar), 15000);
});
A['mi-ubicacion'] = () => { if (!navigator.geolocation){ toast('Este equipo no da la ubicación', 'pin'); return; }
  navigator.geolocation.getCurrentPosition(p => { const i = $('#pfUbi'); if (i) i.value = `${p.coords.latitude.toFixed(5)},${p.coords.longitude.toFixed(5)}`; toast('Ubicación tomada. Tocá Guardar.', 'pin'); }, () => toast('No se pudo tomar la ubicación', 'pin'), { enableHighAccuracy:true, timeout:10000 }); };
A['nuevo-vehiculo'] = () => hoja('Sumar vehículo', `<form data-f="vehiculo"><div class="grid2"><div class="field"><label>Patente</label><input name="patente" required maxlength="10" style="text-transform:uppercase"></div><div class="field"><label>Modelo y color</label><input name="modelo" maxlength="40"></div></div><button class="btn btn-pri btn-block">Sumar</button></form>`);
F['vehiculo'] = d => { const u = yo(); Store.cambiar(s => { const x = s.users.find(z => z.id === u.id); (x.vehiculos = x.vehiculos || []).push({ patente:d.patente.toUpperCase().trim(), modelo:d.modelo.trim() }); }); cerrarHoja(); };
A['borrar-vehiculo'] = el => { const u = yo(); Store.cambiar(s => s.users.find(z => z.id === u.id).vehiculos.splice(+el.dataset.v, 1)); };
A['nueva-mascota'] = () => hoja('Sumar mascota', `<form data-f="mascota"><div class="grid2"><div class="field"><label>Nombre</label><input name="nombre" required maxlength="30"></div><div class="field"><label>Especie</label><input name="especie" maxlength="20" placeholder="Perro, gata…"></div></div>
  <div class="field"><label>Cómo es</label><input name="desc" maxlength="120" placeholder="Color, tamaño, collar"></div>${campoFoto('fotoMasc')}<button class="btn btn-pri btn-block">Sumar</button></form>`);
F['mascota'] = d => { const u = yo(); Store.cambiar(s => { const x = s.users.find(z => z.id === u.id); (x.mascotas = x.mascotas || []).push({ id:uid(), nombre:d.nombre.trim(), especie:d.especie.trim(), desc:d.desc.trim(), foto:leerFoto(d.foto) }); }); cerrarHoja(); };
A['borrar-mascota'] = el => { const u = yo(); Store.cambiar(s => { const x = s.users.find(z => z.id === u.id); x.mascotas = x.mascotas.filter(m => m.id !== el.dataset.v); }); };
A['pedir-notifs'] = async () => { try { const r = await Notification.requestPermission(); toast(r === 'granted' ? 'Avisos activados' : 'No se activaron', 'bell'); refrescar(); } catch(e){} };
A['sonido'] = el => { setTimeout(() => { Store.sesion.sinSonido = !el.checked; Store.guardarSesion(); }, 0); return true; };
A['mis-datos'] = () => {
  const u = yo(), s = Store.s;
  const datos = { usuario:u, pases:s.pases.filter(p => p.hostId === u.id), reservas:s.reservas.filter(r => r.userId === u.id), reclamos:s.reclamos.filter(r => r.userId === u.id), peticiones:s.peticiones.filter(p => p.userId === u.id).map(p => ({ ...p, firmaVecino:'[firma]', firmaGuardia:p.firmaGuardia ? '[firma]' : '' })) };
  const blob = URL.createObjectURL(new Blob([JSON.stringify(datos, null, 2)], { type:'application/json' }));
  hoja('Mis datos personales', `<p class="small" style="margin:0 0 12px;color:var(--ink-2)">Por la Ley 25.326 podés ver, corregir y pedir que se borren tus datos. Descargá una copia o pedile la baja a la Administración.</p>
    <div class="btns"><a class="btn btn-sec" href="${blob}" download="mis-datos-bahia-cauquen.json">${I('download')}Descargar</a><button class="btn btn-danger-soft" data-a="pedir-baja">Pedir la baja</button></div>`);
};
A['pedir-baja'] = () => { const u = yo(); Store.cambiar(s => { notificar(s, { para:'rol:admin', titulo:'Pedido de baja de datos', texto:`${u.nombre} · ${u.casa}`, icon:'trash', color:'danger', link:'admin:vecinos' }); auditar(s, 'Pedido de baja de datos personales', u.casa, u.id); }); cerrarHoja(); toast('Pedido enviado a la Administración', 'send'); };
