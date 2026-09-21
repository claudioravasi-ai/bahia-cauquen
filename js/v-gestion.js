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
/* =========================================================
   VOTACIONES
   -------------------------------------------------------
   HASTA DÓNDE LLEGA EL VALOR LEGAL, DICHO SIN VUELTAS

   Lo que obliga a todo el barrio es la decisión de la ASAMBLEA, con el
   quórum y las mayorías que fija el reglamento de copropiedad, asentada
   en el libro de actas (Código Civil y Comercial, arts. 2044 a 2072 para
   propiedad horizontal y 2073 a 2086 para conjuntos inmobiliarios).
   Una encuesta en una app, por sí sola, no reemplaza eso.

   Lo que SÍ puede hacer esta app, y hace:

   1. CONSULTA ESCRITA (art. 2060 CCyC). La ley permite obtener la
      mayoría consultando por escrito a los propietarios ausentes. La
      votación se emite con el texto exacto de la moción, con plazo, con
      un voto por unidad funcional, y al cerrar la app arma el ACTA con
      el detalle de cómo votó cada lote, lista para transcribir al libro
      de actas y firmar. Eso es lo que le da fuerza.

   2. UN VOTO POR LOTE, como manda el régimen: el voto es de la unidad
      funcional, no de la persona. Si en una casa hay cinco cuentas,
      el voto sigue siendo uno.

   3. QUÓRUM Y MAYORÍA calculados según lo que diga el reglamento: por
      cantidad de unidades o por coeficiente, con mayoría simple, absoluta
      o de dos tercios. La app dice si se alcanzó o no, y no redondea a
      favor de nadie.

   4. REGISTRO QUE NO SE PUEDE TOCAR: cada voto queda en la auditoría con
      lote, unidad funcional, quién lo emitió, fecha y hora. La auditoría
      no se edita ni se borra desde la app.

   Y las que se declaran PLEBISCITO / consulta no vinculante quedan
   marcadas como tales, para que nadie las presente como lo que no son.
   ========================================================= */
const TIPOS_VOTACION = {
  consulta:  { n:'Consulta escrita del art. 2060 CCyC', c:'accent',
               d:'Tiene valor de decisión si se alcanza el quórum y la mayoría del reglamento. Al cerrar se emite el acta para el libro.' },
  plebiscito:{ n:'Plebiscito · consulta no vinculante', c:'sky',
               d:'Sirve para conocer la opinión del barrio. No obliga: para que obligue hace falta asamblea o consulta escrita.' },
  asamblea:  { n:'Voto en asamblea', c:'brand',
               d:'Registro del voto de una asamblea que se está celebrando. El acta de la asamblea manda.' },
};
const MAYORIAS = {
  simple:   { n:'Mayoría simple de los que votan', f:(a, favor, total) => favor > (a - favor) },
  absoluta: { n:'Mayoría absoluta del total de unidades', f:(a, favor, total) => favor > total / 2 },
  dosTercios:{ n:'Dos tercios del total de unidades', f:(a, favor, total) => favor >= total * 2 / 3 },
  unanimidad:{ n:'Unanimidad', f:(a, favor, total) => favor === total },
};

/* Cómo se cuenta: por unidad (un lote, un voto) o por coeficiente (el peso
   de cada lote en las expensas). El reglamento dice cuál. */
const pesoLote = (casa, porCoef) => {
  if (!porCoef) return 1;
  const L = typeof LOTES !== 'undefined' ? LOTES.find(l => 'Lote ' + l.lote === casa) : null;
  return L ? L.coef : 0;
};
function escrutinio(v){
  const porCoef = v.conteo === 'coeficiente';
  const total = porCoef ? 100 : (typeof LOTES !== 'undefined' ? LOTES.length : totalLotes());
  const val = x => typeof x === 'object' && x ? x.i : x;
  const entradas = Object.entries(v.votos || {});
  const cuenta = (v.opciones || []).map(() => 0);
  let emitido = 0;
  entradas.forEach(([casa, voto]) => {
    const i = val(voto), p = pesoLote(casa, porCoef);
    if (i >= 0 && i < cuenta.length){ cuenta[i] += p; emitido += p; }
  });
  const lotes = entradas.length;
  const quorumPedido = +v.quorum || 0;                     /* % del total */
  const quorumLogrado = total ? (emitido / total * 100) : 0;
  const hayQuorum = quorumLogrado + 1e-9 >= quorumPedido;
  const ganadora = cuenta.indexOf(Math.max(...cuenta, 0));
  const favor = cuenta[ganadora] || 0;
  const regla = MAYORIAS[v.mayoria] || MAYORIAS.simple;
  const hayMayoria = emitido > 0 && regla.f(emitido, favor, total);
  return { porCoef, total, cuenta, emitido, lotes, quorumPedido, quorumLogrado, hayQuorum, ganadora, favor, regla, hayMayoria,
    valida: hayQuorum && hayMayoria, cerrada: v.cierra <= Date.now() };
}
const fmtPeso = (n, porCoef) => porCoef ? n.toFixed(3) + ' %' : String(Math.round(n));

R.votaciones = {
  titulo: 'Votaciones', icon: 'vote', color: 'accent', sub: 'Un voto por lote · queda asentado en la auditoría',
  render(){
    const u = yo(), s = Store.s;
    const abiertas = s.votaciones.filter(v => v.cierra > Date.now()), cerradas = s.votaciones.filter(v => v.cierra <= Date.now());
    const card = v => {
      const abierta = v.cierra > Date.now();
      const T = TIPOS_VOTACION[v.tipo] || TIPOS_VOTACION.plebiscito;
      const e = escrutinio(v);
      const val = x => typeof x === 'object' && x ? x.i : x;
      const miVoto = v.votos[u.casa], mio = val(miVoto);
      const quien = miVoto && typeof miVoto === 'object' && miVoto.por ? nombreDe(miVoto.por) : '';
      const ver = !abierta || mio !== undefined || esAdmin();
      const puedeVotar = abierta && !esStaff() && /^Lote\s/i.test(u.casa || '');
      return `<div class="card"><div class="row" style="align-items:flex-start"><div class="grow"><b style="font-size:16px">${esc(v.titulo)}</b>
        <div class="muted small">${abierta ? `Cierra el ${fechaLarga(isoDe(new Date(v.cierra)))}` : 'Cerrada'} · votaron ${plural(e.lotes, 'lote')} de ${e.total === 100 ? (typeof LOTES !== 'undefined' ? LOTES.length : '') : e.total}</div></div>
        <span class="pill p-${T.c === 'accent' ? 'accent' : T.c === 'brand' ? 'brand' : ''}">${abierta ? 'Abierta' : 'Cerrada'}</span></div>
        <div class="tiny muted" style="margin:6px 0 2px">${I('shield')} ${esc(T.n)}</div>
        ${v.detalle ? `<p class="small" style="color:var(--ink-2);white-space:pre-wrap">${esc(v.detalle)}</p>` : ''}
        <div class="muted tiny" style="margin-bottom:8px">Se cuenta por ${e.porCoef ? 'coeficiente de expensas' : 'unidad funcional (un lote, un voto)'} · ${esc(e.regla.n.toLowerCase())}${e.quorumPedido ? ` · quórum ${e.quorumPedido} %` : ''}</div>
        <div class="progreso" style="margin:0 0 4px"><i style="width:${Math.min(100, e.quorumLogrado)}%;background:${e.hayQuorum ? 'var(--ok)' : 'var(--accent)'}"></i></div>
        <div class="tiny muted" style="margin-bottom:10px">Participación: ${e.quorumLogrado.toFixed(1)} %${e.quorumPedido ? (e.hayQuorum ? ' · quórum alcanzado' : ` · faltan ${(e.quorumPedido - e.quorumLogrado).toFixed(1)} puntos para el quórum`) : ''}</div>
        ${v.opciones.map((o, i) => { const pct = e.emitido ? (e.cuenta[i] / e.emitido * 100) : 0;
          return puedeVotar ? `<button class="opcion ${mio === i ? 'elegida' : ''}" data-a="votar" data-id="${v.id}" data-v="${i}">${ver ? `<span class="barra" style="width:${pct}%"></span>` : ''}<span>${mio === i ? I('check') : ''}${esc(o)}</span>${ver ? `<span class="pct">${pct.toFixed(0)}%</span>` : ''}</button>`
            : `<div class="opcion ${!abierta && i === e.ganadora && e.emitido ? 'elegida' : ''}"><span class="barra" style="width:${pct}%"></span><span>${esc(o)}</span><span class="pct">${fmtPeso(e.cuenta[i], e.porCoef)} · ${pct.toFixed(0)}%</span></div>`; }).join('')}
        ${abierta && mio !== undefined ? `<p class="muted tiny" style="margin:4px 0 0">${quien && quien !== u.nombre ? `Votó ${esc(quien)} por ${esc(u.casa)}` : 'Tu lote ya votó'} · el voto es de la unidad funcional: cualquiera de la casa puede cambiarlo hasta el cierre, y siempre cuenta uno solo.</p>` : ''}
        ${abierta && !puedeVotar && !esStaff() ? `<p class="muted tiny">Tu cuenta no tiene un lote asignado, así que no puede emitir el voto de una unidad. Avisale a la Administración.</p>` : ''}
        ${!abierta ? `<div class="aviso a-${e.valida ? 'ok' : 'warn'}" style="margin-top:12px">${I(e.valida ? 'check' : 'alert')}<div class="txt">
          <b>${v.tipo === 'plebiscito' ? (e.emitido ? `Ganó "${esc(v.opciones[e.ganadora])}"` : 'Nadie votó') + ' · consulta no vinculante'
            : e.valida ? `Aprobado: "${esc(v.opciones[e.ganadora])}"` : e.emitido ? 'No se alcanzó la mayoría necesaria' : 'Nadie votó'}</b>
          ${e.emitido ? `${fmtPeso(e.favor, e.porCoef)} de ${fmtPeso(e.emitido, e.porCoef)} emitidos${e.porCoef ? '' : ' votos'} · ${esc(e.regla.n.toLowerCase())}${e.quorumPedido ? ` · quórum ${e.hayQuorum ? 'alcanzado' : 'NO alcanzado'}` : ''}` : ''}</div></div>
          ${esAdmin() ? `<div class="btns" style="margin-top:10px"><button class="btn btn-sm btn-pri" data-a="acta-votacion" data-id="${v.id}">${I('file')}Emitir el acta</button></div>` : ''}` : ''}
        </div>`;
    };
    return `${esAdmin() ? superficie({ a:'nueva-votacion', icon:'plus', t:'Nueva votación', s:'Consulta escrita, plebiscito o voto de asamblea', cls:'acento' }) : ''}
      ${abiertas.length ? abiertas.map(card).join('') : vacio('vote', 'No hay votaciones abiertas.')}
      ${cerradas.length ? sec('Cerradas') + cerradas.map(card).join('') : ''}
      <div class="card plana small" style="color:var(--ink-2);line-height:1.6;margin-top:14px">
        <b>Sobre el valor de estos votos.</b> El voto es de la unidad funcional: un lote, un voto, aunque en la casa haya varias cuentas.
        Cada voto queda asentado en la auditoría con lote, UF, quién lo emitió y la hora, y esa auditoría no se edita ni se borra desde la app.
        Las <b>consultas escritas</b> se apoyan en el art. 2060 del Código Civil y Comercial, que permite reunir la mayoría consultando por escrito:
        al cerrarse, la app emite el <b>acta</b> con el detalle para transcribir al libro y firmar. Lo que obliga al barrio es esa acta y el
        reglamento de copropiedad, no la pantalla.</div>`;
  },
};
A['votar'] = el => {
  const u = yo();
  if (!/^Lote\s/i.test(u.casa || '')){ toast('Tu cuenta no tiene un lote asignado', 'alert'); return; }
  let antes;
  Store.cambiar(s => {
    const v = s.votaciones.find(x => x.id === el.dataset.id); if (!v || v.cierra <= Date.now()) return;
    antes = v.votos[u.casa];
    const L = typeof LOTES !== 'undefined' ? LOTES.find(l => 'Lote ' + l.lote === u.casa) : null;
    v.votos[u.casa] = { i:+el.dataset.v, por:u.id, at:Date.now(), uf:L?.uf || '', coef:L?.coef || 0 };
    /* Queda asentado: es lo que le da respaldo al resultado. */
    auditar(s, antes !== undefined ? 'Cambió el voto de una unidad' : 'Emitió el voto de una unidad',
      `${u.casa}${L ? ' (UF ' + L.uf + ')' : ''} · "${v.titulo}" · opción: ${v.opciones[+el.dataset.v]}`, u.id);
  });
  toast(antes !== undefined ? `Cambiaste el voto de ${yo().casa}` : `Voto registrado por ${yo().casa}`, 'vote');
};
A['nueva-votacion'] = () => hoja('Nueva votación', `<form data-f="votacion">
  <div class="field"><label>Tipo</label><select name="tipo" required>${Object.entries(TIPOS_VOTACION).map(([k, T]) => `<option value="${k}">${T.n}</option>`).join('')}</select>
    <div class="ayuda">${Object.values(TIPOS_VOTACION).map(T => `<b>${esc(T.n.split('·')[0].trim())}:</b> ${esc(T.d)}`).join('<br>')}</div></div>
  <div class="field"><label>Moción · el texto exacto que se vota</label><input name="titulo" required maxlength="140" placeholder="Ej: Aprobar la instalación de cámaras en el acceso de servicio"></div>
  <div class="field"><label>Fundamentos y detalle</label><textarea name="detalle" maxlength="1200" style="min-height:120px" placeholder="Presupuestos, plazos, de dónde salen los fondos…"></textarea></div>
  <div class="field"><label>Opciones (una por renglón)</label><textarea name="opciones" required>Sí\nNo\nMe abstengo</textarea>
    <div class="ayuda">La primera opción es la que se considera "a favor" de la moción.</div></div>
  <div class="grid2">
    <div class="field"><label>Cómo se cuenta</label><select name="conteo"><option value="unidad">Un lote, un voto</option><option value="coeficiente">Por coeficiente de expensas</option></select>
      <div class="ayuda">Lo define el reglamento de copropiedad.</div></div>
    <div class="field"><label>Mayoría necesaria</label><select name="mayoria">${Object.entries(MAYORIAS).map(([k, M]) => `<option value="${k}">${M.n}</option>`).join('')}</select></div></div>
  <div class="grid2">
    <div class="field"><label>Quórum mínimo de participación (%)</label><input type="number" name="quorum" min="0" max="100" step="1" value="0"><div class="ayuda">0 = sin exigencia de quórum.</div></div>
    <div class="field"><label>Cierra</label><input type="date" name="cierra" required min="${sumarDias(hoyISO(), 1)}" value="${sumarDias(hoyISO(), 15)}"></div></div>
  <button class="btn btn-pri btn-block">${I('vote')}Abrir la votación</button>
  <p class="muted tiny" style="margin:10px 0 0">Al abrirla se avisa a todo el barrio y queda asentada en la auditoría. Ni la moción ni las opciones se pueden cambiar después: si hay que corregir algo, se abre otra.</p></form>`, { ancho:'620px' });
F['votacion'] = d => {
  const ops = d.opciones.split('\n').map(x => x.trim()).filter(Boolean);
  if (ops.length < 2){ toast('Hacen falta al menos dos opciones', 'vote'); return; }
  const T = TIPOS_VOTACION[d.tipo] || TIPOS_VOTACION.plebiscito;
  Store.cambiar(s => {
    s.votaciones.unshift({ id:uid(), titulo:d.titulo.trim(), detalle:(d.detalle || '').trim(), opciones:ops,
      tipo:d.tipo, conteo:d.conteo, mayoria:d.mayoria, quorum:+d.quorum || 0,
      cierra:fechaDe(d.cierra).getTime() + 23 * HORA, votos:{}, creadaPor:yo().id, createdAt:Date.now() });
    notificar(s, { para:'todos', titulo:'Nueva votación del barrio', texto:d.titulo.trim(), icon:'vote', color:'accent', link:'votaciones', sonido:true });
    auditar(s, 'Abrió una votación', `${T.n} · "${d.titulo.trim()}" · cierra ${d.cierra}`);
  });
  cerrarHoja(); toast('Votación abierta', 'vote');
};

/* El acta: lo que se transcribe al libro y se firma. Sin esto, el resultado
   en pantalla es solo un número. */
A['acta-votacion'] = el => {
  const v = Store.s.votaciones.find(x => x.id === el.dataset.id); if (!v) return;
  const e = escrutinio(v), c = Store.s.config, T = TIPOS_VOTACION[v.tipo] || TIPOS_VOTACION.plebiscito;
  const filas = Object.entries(v.votos).sort((a, b) => a[0].localeCompare(b[0], 'es', { numeric:true })).map(([casa, voto]) => {
    const i = typeof voto === 'object' ? voto.i : voto;
    const L = typeof LOTES !== 'undefined' ? LOTES.find(l => 'Lote ' + l.lote === casa) : null;
    return `<tr><td>${esc(casa)}</td><td>${esc(voto.uf || L?.uf || '')}</td><td class="n">${(voto.coef ?? L?.coef ?? 0).toFixed(4)}</td>
      <td>${esc(propietarioDe(casa) || '')}</td><td>${esc(v.opciones[i] || '')}</td><td>${voto.at ? fechaHora(voto.at) : ''}</td></tr>`;
  }).join('');
  imprimir(`Acta · ${v.titulo}`, `
    <h1>Acta de ${T.n.toLowerCase()}</h1>
    <p><b>Barrio ${esc(c.nombre)}</b> · ${esc(c.domicilio)} · CUIT ${esc(c.cuit)}</p>
    <p>En ${esc(c.ciudad)}, a los ${new Date().getDate()} días del mes de ${MESES[new Date().getMonth()]} de ${new Date().getFullYear()},
    se deja constancia del resultado de la ${T.n.toLowerCase()} convocada por la Administración el ${fechaLarga(isoDe(new Date(v.createdAt)))},
    con cierre el ${fechaLarga(isoDe(new Date(v.cierra)))}.</p>
    <h2>Moción sometida a votación</h2>
    <p style="font-size:15px"><b>${esc(v.titulo)}</b></p>
    ${v.detalle ? `<p style="white-space:pre-wrap">${esc(v.detalle)}</p>` : ''}
    <h2>Régimen aplicado</h2>
    <table>
      <tr><td>Cómputo</td><td>${e.porCoef ? 'Por coeficiente de expensas' : 'Por unidad funcional (un lote, un voto)'}</td></tr>
      <tr><td>Mayoría exigida</td><td>${esc(e.regla.n)}</td></tr>
      <tr><td>Quórum exigido</td><td>${e.quorumPedido ? e.quorumPedido + ' %' : 'Sin exigencia'}</td></tr>
      <tr><td>Unidades del padrón</td><td>${typeof LOTES !== 'undefined' ? LOTES.length : ''}</td></tr>
      <tr><td>Unidades que votaron</td><td>${e.lotes}</td></tr>
      <tr><td>Participación</td><td>${e.quorumLogrado.toFixed(2)} %${e.quorumPedido ? (e.hayQuorum ? ' — quórum alcanzado' : ' — quórum NO alcanzado') : ''}</td></tr>
    </table>
    <h2>Escrutinio</h2>
    <table><tr><th>Opción</th><th class="n">Votos</th><th class="n">%</th></tr>
      ${v.opciones.map((o, i) => `<tr><td>${esc(o)}</td><td class="n">${fmtPeso(e.cuenta[i], e.porCoef)}</td><td class="n">${e.emitido ? (e.cuenta[i] / e.emitido * 100).toFixed(2) : '0.00'} %</td></tr>`).join('')}
      <tr class="total"><td>Total emitido</td><td class="n">${fmtPeso(e.emitido, e.porCoef)}</td><td class="n">100 %</td></tr></table>
    <h2>Resultado</h2>
    <p style="font-size:15px"><b>${v.tipo === 'plebiscito'
      ? `Consulta no vinculante. Opción más votada: "${esc(v.opciones[e.ganadora] || '—')}".`
      : e.valida ? `APROBADA la opción "${esc(v.opciones[e.ganadora])}", por haberse alcanzado ${esc(e.regla.n.toLowerCase())}${e.quorumPedido ? ' y el quórum exigido' : ''}.`
      : `NO APROBADA: no se alcanzó ${e.hayQuorum ? esc(e.regla.n.toLowerCase()) : 'el quórum exigido'}.`}</b></p>
    ${v.tipo === 'consulta' ? `<p style="font-size:11.5px;color:#555">La presente se emite como consulta escrita en los términos del artículo 2060 del Código Civil y Comercial de la Nación, que admite obtener la mayoría mediante consulta escrita a los propietarios. Se deja constancia de que el voto fue emitido por unidad funcional y que el detalle individual obra a continuación. Corresponde su transcripción al libro de actas del consorcio.</p>` : ''}
    ${v.tipo === 'plebiscito' ? `<p style="font-size:11.5px;color:#555">La presente consulta tiene carácter informativo y no vinculante. No sustituye a la asamblea ni a la consulta escrita del artículo 2060 del Código Civil y Comercial.</p>` : ''}
    <h2>Detalle por unidad</h2>
    <table><tr><th>Lote</th><th>UF</th><th class="n">Coef. %</th><th>Titular según padrón</th><th>Voto</th><th>Fecha y hora</th></tr>${filas || '<tr><td colspan="6">No se emitieron votos.</td></tr>'}</table>
    <p style="font-size:11.5px;color:#555">Cada voto quedó asentado en el registro de auditoría de la aplicación, con lote, unidad funcional, cuenta que lo emitió y marca de fecha y hora. Ese registro no admite edición ni borrado desde la aplicación.</p>
    <div class="firma"><div>Administración</div><div>Consejo de administración</div></div>`);
};

/* ---------- PRIVADO con la Administración ---------- */
/* La cuenta de la garita (hay una sola). */
const cuentaGarita = () => Store.s.users.find(x => x.rol === 'guardia' && x.estado === 'aprobado' && esCorreoGarita(x.email))
  || Store.s.users.find(x => x.rol === 'guardia' && x.estado === 'aprobado');
/* Garita ↔ Administración: una conversación interna que no ve ningún vecino.
   Vive en la carpeta privada de la cuenta de la garita, con `con: 'interno'`. */
function chatInterno(idP){
  const u = yo(), s = Store.s;
  if (!esStaff()) return vacio('lock', 'Solo para la garita y la Administración.');
  const garitaId = esGuardia() ? u.id : (idP || cuentaGarita()?.id);
  if (!garitaId) return vacio('shield', 'Todavía no hay una cuenta de la garita aprobada.');
  const yoSoy = esGuardia() ? 'guardia' : 'admin';
  const h = s.privados.find(x => x.userId === garitaId && x.con === 'interno');
  const msgs = h ? aLista(h.msgs) : [];
  if (h && msgs.some(m => m.from !== yoSoy && !m.leido)){ msgs.forEach(m => { if (m.from !== yoSoy) m.leido = true; }); Store.guardar(); setTimeout(pintarTop, 0); }
  return `<div class="chat-wrap"><div class="chat">${msgs.length ? msgs.map(m => `<div class="msg ${m.from === yoSoy ? 'mia' : ''}">
      <div class="b">${m.from !== yoSoy ? `<small class="msg-de">${m.from === 'guardia' ? 'Garita' + (guardiasEn(m.createdAt).length ? ' · ' + esc(guardiasEn(m.createdAt).join(', ')) : '') : 'Administración'}</small>` : ''}${esc(m.text)}<time>${hora(m.createdAt)}</time></div></div>`).join('')
      : vacio('lock', esGuardia() ? 'Escribile a la Administración. Ningún vecino lo ve.' : 'Escribile a la garita. Ningún vecino lo ve.')}</div>
    <form class="chatbar" data-f="privado" data-u="${esc(garitaId)}" data-con="interno"><input name="text" id="privIn" required maxlength="800" placeholder="${esGuardia() ? 'Mensaje a la Administración' : 'Mensaje a la garita'}" autocomplete="off"><button class="btn btn-accent">${I('send')}</button></form></div>`;
}
R.privado = {
  titulo: p => { const [con, id] = String(p || '').split('|'); if (con === 'interno') return esGuardia() ? 'Administración' : 'Garita';
    return esStaff() && id ? (usuario(id)?.nombre || 'Conversación') : con === 'guardia' ? 'Guardia' : 'Administración'; },
  icon: 'lock', color: 'accent',
  sub: p => { const [con, id] = String(p || '').split('|');
    if (con === 'interno') return 'Entre la garita y la Administración · no lo ve ningún vecino';
    return esStaff() && id ? (usuario(id)?.casa || '') : con === 'guardia' ? 'Privado: solo lo ven vos y la guardia' : 'Privado: solo lo ven vos y la Administración'; },
  render(p){
    const u = yo(), s = Store.s;
    const [conP, idP] = String(p || '').split('|');
    if (conP === 'interno') return chatInterno(idP);
    const con = conP === 'guardia' ? 'guardia' : 'admin';
    /* La guardia ve solo sus conversaciones; la Administración, las suyas. */
    const miCanal = esGuardia() ? 'guardia' : esAdmin() ? 'admin' : con;
    if (esStaff() && !idP){
      const hilos = s.privados.filter(h => (h.con || 'admin') === miCanal).sort((a, b) => (b.msgs.at(-1)?.createdAt || 0) - (a.msgs.at(-1)?.createdAt || 0));
      const interno = s.privados.find(h => h.con === 'interno' && (esGuardia() ? h.userId === u.id : true));
      const sinLeerInt = interno ? aLista(interno.msgs).filter(m => m.from !== (esGuardia() ? 'guardia' : 'admin') && !m.leido).length : 0;
      return `${superficie({ v:'privado', p:'interno', icon: esGuardia() ? 'sliders' : 'shield', color:'accent', t: esGuardia() ? 'Administración' : 'Garita',
          s: (sinLeerInt ? plural(sinLeerInt, 'mensaje sin leer', 'mensajes sin leer') + ' · ' : '') + 'Conversación interna, no la ve ningún vecino' })}
        ${superficie({ a:'nuevo-post', v:'aviso', icon:'send', color:'brand', t:'Avisar algo a un lote', s:'Elegí el lote en "¿Para quién?"' })}
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
  const u = yo(), para = form.dataset.u;
  if (form.dataset.con === 'interno'){
    if (!esStaff()) return;
    const from = esGuardia() ? 'guardia' : 'admin';
    Store.cambiar(s => {
      let h = s.privados.find(x => x.userId === para && x.con === 'interno');
      if (!h){ h = { id:uid(), userId:para, con:'interno', msgs:[] }; s.privados.push(h); }
      listaDe(h, 'msgs').push({ id:uid(), from, text:d.text.trim(), createdAt:Date.now() });
      notificar(s, from === 'guardia'
        ? { para:'rol:admin', titulo:'Mensaje de la garita', texto:d.text.trim().slice(0, 90), icon:'shield', color:'brand', link:'privado:interno|' + para, sonido:true }
        : { para, titulo:'Mensaje de la Administración', texto:d.text.trim().slice(0, 90), icon:'sliders', color:'accent', link:'privado:interno', sonido:true });
    });
    const i = $('#privIn'); if (i){ i.value = ''; i.focus(); }
    return;
  }
  const con = form.dataset.con === 'guardia' ? 'guardia' : 'admin';
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

/* Las expensas viven en js/v-expensas.js: el módulo contable completo. */

/* ---------- RESIDUOS ---------- */
R.recoleccion = {
  titulo: 'Residuos', icon: 'truck', color: 'ok', sub: 'Recolección y voluminosos',
  render(){
    const c = Store.s.config, hoy = new Date().getDay(), hoyIso = hoyISO();
    /* Los retiros de voluminosos son una lista de fechas con su detalle:
       la Administración anota todas las del año y la app avisa la víspera. */
    const vols = volsProximos();
    return `<div class="recoleccion">${[1,2,3,4,5,6,0].map(d => `<div class="${d === hoy ? 'hoy-r' : ''}"><b>${DIAS[d]}</b>${c.recoleccion[d] ? I('truck') + esc(c.recoleccion[d]) : '<span class="muted">—</span>'}</div>`).join('')}</div>
      <p class="muted small">El camión pasa desde las ${c.recoleccionHora} h. Si al otro día es feriado, puede cambiar: la app avisa.</p>
      ${(() => { const man = diaInfo(sumarDias(hoyIso, 1));
        return man.feriado ? aviso('warn', 'calendar', `Mañana es feriado: ${esc(man.feriado.nombre)}`, 'La recolección puede no pasar o pasar más tarde.') : ''; })()}
      ${sec('Voluminosos', esAdmin() ? `<button class="link" data-a="nuevo-voluminoso">Anotar un retiro</button>` : '')}
      ${vols.length ? vols.map(v => `<div class="card"><div class="row">
          <span class="ic ic-${v.fecha === hoyIso ? 'danger' : 'wood'}" style="width:42px;height:42px;border-radius:13px;display:grid;place-items:center;flex:none">${I('truck')}</span>
          <div class="grow"><b>${v.fecha === hoyIso ? 'Hoy' : v.fecha === sumarDias(hoyIso, 1) ? 'Mañana' : fechaLarga(v.fecha)}</b>
            <div class="muted small">${esc(v.detalle || c.voluminososDetalle)}</div></div>
          <span class="pill ${v.fecha === hoyIso ? 'p-danger' : ''}">${relDia(v.fecha)}</span>
          ${esAdmin() ? `<button class="icon-btn" data-a="borrar-voluminoso" data-v="${v.fecha}" aria-label="Borrar">${I('trash')}</button>` : ''}</div></div>`).join('')
        : `<div class="card"><b>Sin retiros anotados</b><p class="small" style="margin:6px 0 0;color:var(--ink-2)">${esc(c.voluminososDetalle)}</p>
           ${esAdmin() ? `<button class="btn btn-sm btn-sec" style="margin-top:10px" data-a="nuevo-voluminoso">${I('plus')}Anotar el próximo retiro</button>` : ''}</div>`}
      ${esAdmin() ? superficie({ a:'abrir', v:'admin', p:'ajustes', icon:'sliders', color:'accent', t:'Cambiar los días del camión', s:'Qué se retira cada día y a qué hora pasa' }) : ''}
      ${sec('Para tener en cuenta')}<div class="card small" style="color:var(--ink-2);line-height:1.6">
        • Canasto elevado y cerrado: los perros y los zorros rompen las bolsas.<br>• Con viento fuerte, sacá la bolsa a la mañana y no la noche anterior.<br>• La poda va al contenedor verde, atada.<br>• Pilas, aceite y electrónicos no van a la basura común.</div>
      ${superficie({ a:'avistamiento', icon:'eye', color:'warn', t:'¿Viste zorros o perros en la basura?', s:'Avisá y la app alerta al barrio si se repite' })}`;
  },
};
/* Compatibilidad: la versión vieja guardaba una sola fecha en config.voluminosos. */
function volsProximos(){
  const c = Store.s.config, hoy = hoyISO();
  const lista = Array.isArray(c.volsLista) ? c.volsLista.slice() : [];
  if (c.voluminosos && !lista.some(v => v.fecha === c.voluminosos)) lista.push({ fecha:c.voluminosos, detalle:c.voluminososDetalle });
  return lista.filter(v => v.fecha >= hoy).sort((a, b) => a.fecha.localeCompare(b.fecha));
}
A['nuevo-voluminoso'] = () => hoja('Anotar un retiro de voluminosos', `<form data-f="voluminoso">
  <div class="field"><label>Fecha del retiro</label><input type="date" name="fecha" required min="${hoyISO()}"></div>
  <div class="field"><label>Qué se retira</label><textarea name="detalle" maxlength="220">${esc(Store.s.config.voluminososDetalle || '')}</textarea></div>
  <label class="check"><input type="checkbox" name="avisar" checked><span>Avisar a todo el barrio ahora</span></label>
  <button class="btn btn-pri btn-block" style="margin-top:12px">${I('truck')}Anotar</button>
  <p class="muted tiny" style="margin:10px 0 0">La app vuelve a avisar sola la noche anterior.</p></form>`);
F['voluminoso'] = d => {
  Store.cambiar(s => {
    const c = s.config;
    c.volsLista = (Array.isArray(c.volsLista) ? c.volsLista : []).filter(v => v.fecha !== d.fecha);
    c.volsLista.push({ fecha:d.fecha, detalle:(d.detalle || '').trim() });
    c.volsLista.sort((a, b) => a.fecha.localeCompare(b.fecha));
    c.voluminosos = volsProximos()[0]?.fecha || '';
    if (d.avisar) notificar(s, { para:'todos', titulo:`Retiro de voluminosos el ${fechaLarga(d.fecha)}`, texto:(d.detalle || '').trim(), icon:'truck', color:'wood', link:'recoleccion', sonido:true });
    auditar(s, 'Anotó un retiro de voluminosos', d.fecha);
  });
  cerrarHoja(); toast('Retiro anotado', 'truck');
};
A['borrar-voluminoso'] = async el => {
  if (!await confirmar('Borrar el retiro', `¿Sacar el retiro del ${fechaLarga(el.dataset.v)}?`, { si:'Borrar', peligro:true })) return;
  Store.cambiar(s => {
    const c = s.config;
    c.volsLista = (Array.isArray(c.volsLista) ? c.volsLista : []).filter(v => v.fecha !== el.dataset.v);
    if (c.voluminosos === el.dataset.v) c.voluminosos = '';
  });
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
      ${sosDelDia()}
      ${sec('Del barrio')}<div class="card lista">${s.contactos.map(c => it({ nombre:c.nombre, detalle:c.detalle, tel:c.tel })).join('')}</div>
      <form data-f="buscar-agenda" class="linea-form" style="margin:16px 0 4px"><input name="q" id="qAgenda" value="${esc(q || '')}" placeholder="Buscar farmacia, taxi, veterinaria…"><button class="btn btn-pri">${I('search')}</button></form>
      ${lista ? `<div class="card lista">${lista.length ? lista.map(it).join('') : vacio('search', 'Sin resultados')}</div>`
        : cats.map(c => `${sec(esc(c))}<div class="card lista">${s.agenda.filter(a => a.categoria === c).map(it).join('')}</div>`).join('')}`;
  },
};
F['buscar-agenda'] = d => abrir('agenda', d.q || '');

/* =========================================================
   LOS SOS DEL DÍA
   Debajo del DEA, una ventanita por cada SOS de las últimas 24 horas: qué
   fue, a qué hora y si ya se resolvió. Al pasar el mouse (o tocarla en el
   celular) se despliega con el vecino, el lote y cómo terminó. Pasadas las
   24 h desaparecen solas de acá; el registro completo sigue en la bitácora
   y la auditoría, que no se borran.
   ========================================================= */
function sosDelDia(){
  const lista = aLista(Store.s.sos).filter(x => x && Date.now() - x.at < DIA).sort((a, b) => b.at - a.at);
  const est = x => x.estado === 'resuelta' ? ['ok', 'Resuelta'] : x.estado === 'atendida' ? ['warn', 'Atendida, falta confirmar'] : x.estado === 'en_camino' ? ['warn', 'La guardia va en camino'] : ['danger', 'Activa'];
  const tarjeta = x => {
    const t = TIPOS_SOS[x.tipo] || TIPOS_SOS.otra, v = usuario(x.userId) || {}, [c, e] = est(x);
    const quien = x.estado === 'resuelta' && x.resuelve ? (x.resuelve === x.userId ? 'la dio por solucionada el vecino' : `la cerró ${esc(nombreDe(x.resuelve))}`) : '';
    return `<details class="sos-dia s-${c}" tabindex="0">
      <summary><span class="ic ic-${c === 'ok' ? 'ok' : 'danger'}">${I(t.icon)}</span><span class="sd-txt"><b>${esc(t.nombre)}</b><small>${hora(x.at)} h · ${esc(v.casa || '')}</small></span><span class="pill p-${c}">${e}</span></summary>
      <div class="sd-mas">
        <div><span class="muted">Pidió ayuda</span><b>${esc(v.nombre || 'Un vecino')}${v.casa ? ' · ' + esc(v.casa) : ''}</b></div>
        <div><span class="muted">Cuándo</span><b>${cuandoFue(x.at)} · ${hace(x.at)}</b></div>
        ${x.atiende ? `<div><span class="muted">Atendió</span><b>${esc(nombreDe(x.atiende))}</b></div>` : ''}
        <div><span class="muted">Cómo terminó</span><b>${x.estado === 'resuelta' ? `Resuelta a las ${hora(x.resueltaAt || x.at)} h${quien ? ' · ' + quien : ''}` : e}</b></div>
      </div></details>`;
  };
  return `${sec('SOS de hoy', `<span class="muted small">últimas 24 h · se limpia solo</span>`)}
    ${lista.length ? `<div class="sos-dia-lista">${lista.map(tarjeta).join('')}</div>` : `<div class="card plana small" style="display:flex;gap:8px;align-items:center">${I('check')} No hubo ningún SOS en las últimas 24 horas.</div>`}`;
}
/* En la computadora se despliega con solo pasar el mouse. */
document.addEventListener('mouseover', e => { const d = e.target.closest && e.target.closest('details.sos-dia'); if (d && matchMedia('(hover:hover)').matches) d.open = true; });
document.addEventListener('mouseout', e => { const d = e.target.closest && e.target.closest('details.sos-dia');
  if (d && matchMedia('(hover:hover)').matches && !d.contains(e.relatedTarget)) d.open = false; });

/* ---------- USHUAIA: temporadas, feriados, eventos ---------- */
function enTemporada(t, iso = hoyISO()){
  const md = iso.slice(5);
  return t.desde <= t.hasta ? md >= t.desde && md <= t.hasta : md >= t.desde || md <= t.hasta;
}
function diasHasta(md, iso = hoyISO()){
  const y = +iso.slice(0, 4); let f = `${y}-${md}`; if (f < iso) f = `${y + 1}-${md}`;
  return Math.round((fechaDe(f) - fechaDe(iso)) / DIA);
}
/* El próximo feriado de verdad (nacional, provincial o municipal): los
   días religiosos y los no laborables no cuentan como feriado. */
const proximoFeriado = () => proximoFeriadoReal();
R.ushuaia = {
  titulo: 'Ushuaia hoy', icon: 'pin', color: 'sky', sub: 'Temporadas, feriados y eventos de la ciudad',
  render(){
    const s = Store.s, hoy = hoyISO();
    const temp = s.temporadas.map(t => { const on = enTemporada(t);
      const d = on ? diasHasta(t.hasta) : diasHasta(t.desde);
      return `<div class="card"><div class="row"><span class="ic ic-${on ? 'ok' : 'sky'}" style="width:40px;height:40px;border-radius:13px;display:grid;place-items:center">${I(t.icon || 'calendar')}</span>
        <div class="grow"><b>${esc(t.nombre)}</b><div class="small ${on ? '' : 'muted'}">${on ? `En temporada · termina en ${plural(d, 'día')}` : `Empieza en ${plural(d, 'día')}`}</div></div>
        <span class="pill ${on ? 'p-ok' : ''}">${on ? 'Ahora' : 'Fuera'}</span></div>
        <div class="muted tiny" style="margin-top:8px">${esc(t.nota || '')}</div></div>`; }).join('');
    const info = diaInfo(hoy);
    const agenda = [...feriadosDe(+hoy.slice(0, 4)), ...feriadosDe(+hoy.slice(0, 4) + 1)].filter(f => f.fecha >= hoy);
    const fer = agenda.filter(f => !f.laborable).slice(0, 8);
    const noLab = agenda.filter(f => f.laborable && /no laborable/i.test(f.tipo)).slice(0, 6);
    const relig = agenda.filter(f => f.ambito === 'católica' || f.ambito === 'judía').slice(0, 10);
    const chipAmbito = f => `<span class="pill ${ {nacional:'p-brand', provincial:'p-accent', municipal:'p-wood', 'católica':'', 'judía':''}[f.ambito] || ''}">${esc(f.ambito)}</span>`;
    const evs = s.eventosCiudad.filter(e => e.fecha >= hoy).sort((a, b) => a.fecha.localeCompare(b.fecha));
    const cru = s.cruceros.filter(c => c.fecha >= hoy).sort((a, b) => a.fecha.localeCompare(b.fecha)).slice(0, 8);
    const hoyCru = s.cruceros.filter(c => c.fecha === hoy);
    return `${Clima.alertas().map(a => aviso(a.nivel, a.icon, a.t, a.x)).join('')}
      ${hoyCru.length ? aviso('info', 'send', `Hoy recala${hoyCru.length > 1 ? 'n' : ''} ${hoyCru.map(c => esc(c.barco)).join(', ')}`, `${hoyCru.reduce((a, c) => a + (+c.pasajeros || 0), 0) || ''} pasajeros en el centro · más tránsito y más gente en los comercios`) : ''}
      ${sec('Temporadas')}${temp}
      ${sec('Cruceros', esAdmin() ? `<button class="link" data-a="abrir" data-v="admin" data-p="contenido|cruceros">Cargar recaladas</button>` : '')}
      ${cru.length ? `<div class="card lista">${cru.map(c => `<div class="it"><span class="ic ic-sky" style="width:34px;height:34px;border-radius:11px;display:grid;place-items:center">${I('send')}</span>
        <div class="txt"><b>${esc(c.barco)}</b><span>${fechaCorta(c.fecha)}${c.llega ? ' · llega ' + c.llega : ''}${c.sale ? ' · sale ' + c.sale : ''}${c.pasajeros ? ' · ' + c.pasajeros + ' pasajeros' : ''}${c.muelle ? ' · ' + esc(c.muelle) : ''}</span></div>
        <span class="pill ${c.fecha === hoy ? 'p-ok' : ''}">${relDia(c.fecha)}</span></div>`).join('')}</div>`
        : `<div class="card"><p class="small" style="margin:0;color:var(--ink-2)">No hay recaladas cargadas. ${enTemporada(s.temporadas.find(t => /crucero/i.test(t.nombre)) || {desde:'10-15',hasta:'04-15'}) ? 'Estamos en temporada: el calendario del puerto se carga desde Administración → Contenido → Recaladas de cruceros.' : 'La temporada todavía no empezó.'}</p>
          ${esAdmin() ? `<button class="btn btn-sm btn-sec" style="margin-top:10px" data-a="abrir" data-v="admin" data-p="contenido|cruceros">${I('plus')}Cargar el calendario</button>` : ''}
          <a class="btn btn-sm btn-sec" style="margin-top:10px" href="https://www.puertoushuaia.gob.ar" target="_blank" rel="noopener">${I('link')}Puerto de Ushuaia</a></div>`}
      ${sec('Hoy')}
      <div class="card ${info.laboral ? '' : 'plana'}" style="${info.laboral ? '' : 'background:var(--warn-soft)'}">
        <div class="row"><span class="ic ic-${info.laboral ? 'ok' : 'warn'}" style="width:44px;height:44px;border-radius:14px;display:grid;place-items:center">${I(info.laboral ? 'check' : 'calendar')}</span>
          <div class="grow"><b style="font-size:16px">${esc(info.resumen)}</b>
            <div class="muted small">${fechaLarga(hoy)}${info.laboral ? ' · se trabaja y la Administración atiende' : info.feriado ? ' · no se trabaja; la recolección y los comercios pueden no funcionar' : ''}</div></div></div>
        ${info.todos.filter(f => f.ambito === 'católica' || f.ambito === 'judía').map(f => `<div class="small" style="margin-top:8px;color:var(--ink-2)">${I(f.ambito === 'judía' ? 'star' : 'tree')} ${esc(f.nombre)} (${esc(f.ambito)})${f.noLaboralJudio ? ' · día no laborable para quienes profesan la religión judía' : ''}</div>`).join('')}
      </div>
      ${sec('Próximos feriados', esAdmin() ? `<button class="link" data-a="abrir" data-v="admin" data-p="contenido|feriados">Provinciales y puentes</button>` : '')}
      <div class="card lista">${fer.length ? fer.map(f => `<div class="it"><div class="txt"><b>${esc(f.nombre)}</b>
        <span>${fechaLarga(f.fecha)}${f.tipo === 'trasladable' ? ' · trasladado' : ''}${f.aConfirmar ? ' · a confirmar' : ''}</span></div>
        ${chipAmbito(f)}<span class="pill ${f.fecha === hoy ? 'p-ok' : ''}">${relDia(f.fecha)}</span></div>`).join('') : vacio('calendar', 'No hay feriados próximos.')}</div>
      ${noLab.length ? sec('Días no laborables') + `<div class="card lista">${noLab.map(f => `<div class="it"><div class="txt"><b>${esc(f.nombre)}</b><span>${fechaLarga(f.fecha)} · trabajar o no lo decide el empleador</span></div><span class="pill">${relDia(f.fecha)}</span></div>`).join('')}</div>` : ''}
      ${sec('Calendario religioso', `<span class="muted small">católico y judío</span>`)}
      <div class="card lista">${relig.map(f => `<div class="it"><span class="ic ic-${f.ambito === 'judía' ? 'accent' : 'brand'}" style="width:32px;height:32px;border-radius:10px;display:grid;place-items:center">${I(f.ambito === 'judía' ? 'star' : 'tree')}</span>
        <div class="txt"><b>${esc(f.nombre)}</b><span>${fechaLarga(f.fecha)}${f.noLaboralJudio ? ' · no laborable (Ley 24.571)' : ''}</span></div>
        <span class="pill ${f.fecha === hoy ? 'p-ok' : ''}">${relDia(f.fecha)}</span></div>`).join('') || '<p class="muted small" style="margin:6px 0">Sin fiestas próximas.</p>'}</div>
      <p class="muted tiny">Las fiestas judías empiezan al atardecer del día anterior. Los feriados nacionales, la Pascua y el calendario hebreo los calcula la app con las reglas de la Ley 27.399, el cómputo de la Pascua y la aritmética del calendario hebreo: no dependen de que alguien los cargue.</p>
      ${sec('Eventos en la ciudad', esStaff() || true ? `<button class="link" data-a="nuevo-evento-ciudad">Sumar uno</button>` : '')}
      ${evs.length ? evs.map(e => `<div class="card"><div class="row" style="align-items:flex-start"><div class="evento-box" style="margin:0;padding:0;background:none"><div class="fecha"><small>${MESES[fechaDe(e.fecha).getMonth()]}</small><b>${fechaDe(e.fecha).getDate()}</b></div></div>
        <div class="grow"><b>${esc(e.titulo)}</b><div class="muted small">${esc(e.tipo || '')}${e.hora ? ' · ' + e.hora + ' h' : ''}${e.lugar ? ' · ' + esc(e.lugar) : ''}</div>${e.nota ? `<div class="small" style="margin-top:4px;color:var(--ink-2)">${esc(e.nota)}</div>` : ''}
        ${e.link ? `<a class="small" href="${esc(e.link)}" target="_blank" rel="noopener">Más información</a>` : ''}</div></div></div>`).join('') : vacio('calendar', 'No hay eventos cargados.')}
      ${sec('Fauna en el barrio')}${superficie({ a:'avistamiento', icon:'eye', color:'warn', t:'Avisar un avistamiento', s:`${plural(s.avistamientos.filter(a => Date.now() - a.at < 7 * DIA).length, 'aviso')} esta semana` })}
      <p class="muted tiny">Lo provincial, lo municipal y los "días no laborables con fines turísticos" (los puentes) los fija cada año un decreto o una ordenanza: esos sí los confirma la Administración desde Contenido → Feriados, y hasta entonces aparecen marcados "a confirmar".</p>`;
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
   El aeropuerto de Ushuaia no es de Aeropuertos Argentina: su tablero lo
   publica London Supply en flightstats.londonsupplygroup.com, y ese sí deja
   que la app lo lea directo (manda access-control-allow-origin: *). De ahí
   salen arribos y partidas del día, con estado, estima y puerta.
   El Worker del barrio (Ajustes → Vuelos) ya no hace falta para el tablero:
   queda solo para ver los aviones en vivo sobre el barrio. */
const Vuelos = {
  KEY:'bhc.vuelos', TABLERO:'https://flightstats.londonsupplygroup.com/', d:null, estado:'', cargando:null,
  leer(){ try { this.d = JSON.parse(localStorage.getItem(this.KEY)); } catch(e){} },
  cuantosHoy(){ return this.d && Date.now() - this.d.t < 6 * HORA ? (this.d.arr.length + this.d.dep.length) || '' : ''; },
  campo(o, ...ks){ for (const k of ks) if (o && o[k] != null && o[k] !== '') return o[k]; return ''; },
  hhmm(x){ const m = String(x || '').match(/(\d{1,2}):(\d{2})/); return m ? `${pad(m[1])}:${m[2]}` : ''; },

  /* Una fila del tablero de London Supply. Las columnas son siempre las
     mismas: aerolínea, vuelo, procedencia o destino, horario, estima,
     estado y puerta. */
  fila(li, tipo){
    const txt = c => (li.querySelector('.' + c)?.textContent || '').replace(/\s+/g, ' ').trim();
    const lugar = txt('c3');
    return { tipo, nro:txt('c2'), aerolinea:li.querySelector('.c1 img')?.getAttribute('alt') || '',
      lugar:lugar.replace(/^\(([A-Z]{3})\)\s*/, '').trim() || lugar, iata:(lugar.match(/^\(([A-Z]{3})\)/) || [])[1] || '',
      hora:this.hhmm(txt('c4')), real:this.hhmm(txt('c5')), estado:txt('c6'), puerta:txt('c7') };
  },
  /* La página viene en iso-8859-1: si se lee como UTF-8 los acentos salen rotos. */
  async tablero(mov, tipo){
    const r = await fetch(this.TABLERO + mov + '-USH', { cache:'no-store' });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const doc = new DOMParser().parseFromString(new TextDecoder('iso-8859-1').decode(await r.arrayBuffer()), 'text/html');
    const act = (doc.querySelector('.inf-act')?.textContent || '').match(/(\d{1,2}:\d{2})hs\s*$/);
    return { filas:[...doc.querySelectorAll('li.dl')].map(li => this.fila(li, tipo)).filter(v => v.nro), act:act ? act[1] : '' };
  },

  /* Aviones en el aire sobre el barrio. Los servicios de ADS-B no se dejan
     leer desde una página, así que esto sale solo si hay Worker propio. */
  normalizarVivo(v){
    return Array.isArray(v)
      ? { callsign:(v[1] || '').trim(), alt:Math.round(v[7] || 0), vel:Math.round((v[9] || 0) * 3.6), suelo:v[8] }
      : { callsign:v.callsign || v.flight || '', alt:v.alt || 0, vel:v.vel || 0, suelo:v.suelo };
  },
  async vivos(){
    const px = Store.s.config.vuelosProxy;
    if (!px) return null;
    try {
      const j = await fetch(px + (px.includes('?') ? '&' : '?') + 'apt=USH').then(r => r.json());
      return (j.states || j.vivos || []).map(v => this.normalizarVivo(v));
    } catch(e){ return null; }
  },

  /* Cada cuánto se vuelve a leer el tablero: cada 2 minutos si hay un vuelo
     a menos de media hora (así la estima y el "Despegado" llegan a tiempo),
     y cada 5 el resto del día. */
  cadencia(){
    const d = this.d; if (!d) return 2 * MIN;
    const min = ahoraMin();
    const cerca = [...(d.arr || []), ...(d.dep || [])].some(v => { const t = this.minutos(v.real || v.hora); return t !== null && Math.abs(t - min) <= 30; });
    return cerca ? 2 * MIN : 5 * MIN;
  },
  recien: [],   /* partidas que acaban de pasar a "Despegado" en esta lectura */
  async pedir(forzar = false){
    if (!forzar && this.d && Date.now() - this.d.t < this.cadencia()) return this.d;
    if (this.cargando) return this.cargando;
    this.cargando = (async () => {
      const [a, d, vivos] = await Promise.all([
        this.tablero('arribos', 'A').catch(() => null),
        this.tablero('partidas', 'D').catch(() => null),
        this.vivos(),
      ]);
      if (!a && !d){ this.estado = navigator.onLine ? 'sin-fuente' : 'sin-conexion'; return this.d; }
      this.estado = 'ok';
      /* El momento en que el aeropuerto marca "Despegado" es lo más cercano a
         tiempo real que hay: ese avión está pasando por arriba del barrio. */
      const antes = new Set((this.d?.dep || []).filter(v => /despeg|depart/i.test(v.estado)).map(v => v.nro));
      const hayAntes = !!(this.d && this.d.dep && this.d.dep.length && Date.now() - this.d.t < 15 * MIN);
      this.recien = hayAntes ? (d?.filas || []).filter(v => /despeg|depart/i.test(v.estado) && !antes.has(v.nro)) : [];
      this.d = { t:Date.now(), arr:a?.filas || [], dep:d?.filas || [], act:a?.act || d?.act || '', vivos:vivos || [] };
      try { localStorage.setItem(this.KEY, JSON.stringify(this.d)); } catch(e){}
      return this.d;
    })().finally(() => { this.cargando = null; });
    return this.cargando;
  },

  /* ¿Hay un avión pasando por arriba del barrio ahora mismo?
     El barrio está a 6 km de la cabecera, bajo la traza: los que llegan
     pasan unos minutos antes de tocar tierra y los que salen, poco después
     de despegar. Si hay Worker, lo que manda es el avión de verdad. */
  minutos(h){ const m = String(h || '').match(/(\d{1,2}):(\d{2})/); return m ? +m[1] * 60 + +m[2] : null; },
  sobrevuelos(){
    const d = this.d; if (!d) return [];
    const ahora = new Date(), min = ahora.getHours() * 60 + ahora.getMinutes(), lista = [];
    (d.vivos || []).filter(v => !v.suelo && v.alt && v.alt < 4500).forEach(v => lista.push({
      clave:'vivo-' + (v.callsign || v.alt), titulo:v.callsign || 'Un avión sobre el barrio',
      detalle:`${v.alt} m de altura · ${v.vel} km/h`, sentido:'A', vivo:true }));
    const cerca = (t, desde, hasta) => t !== null && min - t >= desde && min - t <= hasta;
    /* Llegadas: el avión cruza el barrio unos 2 a 5 minutos antes de tocar
       tierra, según la hora ESTIMADA que publica el aeropuerto (se corrige
       sola si viene demorado o adelantado). Si ya figura aterrizado, no. */
    (d.arr || []).forEach(v => { if (/cancel|aterr|arrib|landed/i.test(v.estado)) return;
      if (cerca(this.minutos(v.real || v.hora), -5, -1)) lista.push({ clave:'a-' + v.nro + (v.real || v.hora),
        titulo:`${v.nro} está llegando`, detalle:`Viene de ${v.lugar} · aterriza ${v.real || v.hora}`, sentido:'A', vivo:false }); });
    /* Salidas: en cuanto el aeropuerto lo marca "Despegado"; si no llegó a
       marcarlo, por la hora estimada. */
    this.recien.forEach(v => lista.push({ clave:'d-' + v.nro + (v.real || v.hora), titulo:`${v.nro} acaba de despegar`,
      detalle:`Va a ${v.lugar} · el aeropuerto lo marcó despegado`, sentido:'D', vivo:false }));
    (d.dep || []).forEach(v => { if (/cancel/i.test(v.estado)) return;
      if (cerca(this.minutos(v.real || v.hora), 1, 5)) lista.push({ clave:'d-' + v.nro + (v.real || v.hora),
        titulo:`${v.nro} acaba de despegar`, detalle:`Va a ${v.lugar} · salió ${v.real || v.hora}`, sentido:'D', vivo:false }); });
    return lista;
  },
  /* El próximo vuelo que va a pasar por arriba del barrio, para mostrarlo. */
  proximoPaso(){
    const d = this.d; if (!d) return null;
    const min = ahoraMin(), cand = [];
    (d.arr || []).forEach(v => { if (/cancel|aterr|arrib|landed/i.test(v.estado)) return; const t = this.minutos(v.real || v.hora); if (t !== null && t - 3 >= min - 1) cand.push({ v, t:t - 3, tipo:'llega' }); });
    (d.dep || []).forEach(v => { if (/cancel|despeg|depart/i.test(v.estado)) return; const t = this.minutos(v.real || v.hora); if (t !== null && t + 2 >= min - 1) cand.push({ v, t:t + 2, tipo:'sale' }); });
    return cand.sort((a, b) => a.t - b.t)[0] || null;
  },
};
Vuelos.leer();

/* ---------- EL AVIÓN QUE CRUZA LA APP ----------
   Cuando pasa un avión por arriba del barrio, cruza uno por la pantalla.
   Es un aviso, no una ventana: no tapa nada ni se puede tocar. Cada vuelo
   se muestra una sola vez y se puede apagar desde la ventana de Vuelos. */
const Avion = {
  KEY:'bhc.avion.vistos', PREF:'bhc.avion', timer:null, volando:false,
  encendido(){ return localStorage.getItem(this.PREF) !== 'no'; },
  prender(v){ try { localStorage.setItem(this.PREF, v ? 'si' : 'no'); } catch(e){} },
  vistos(){ try { return JSON.parse(localStorage.getItem(this.KEY)) || {}; } catch(e){ return {}; } },
  marcar(clave){ const v = this.vistos(); const lim = Date.now() - 6 * HORA;
    Object.keys(v).forEach(k => { if (v[k] < lim) delete v[k]; });
    v[clave] = Date.now(); try { localStorage.setItem(this.KEY, JSON.stringify(v)); } catch(e){} },

  arrancar(){
    if (this.timer) return;
    this.timer = setInterval(() => this.mirar(), 45000);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) this.mirar(); });
    this.mirar();
  },
  mirar(){
    if (document.hidden || this.volando || !this.encendido() || !yo()) return;
    Vuelos.pedir().then(() => {
      const v = Vuelos.sobrevuelos().find(x => !(x.clave in this.vistos()));
      if (v){ this.marcar(v.clave); this.pasar(v); }
    }).catch(() => {});
  },

  /* El avión cruza la pantalla en línea recta, con una estela corta detrás, y
     lo hace tres veces. Nada más: es un guiño al pasar, no una animación que
     pida atención. El color lo pone el tema —oscuro de día, claro de noche—
     para que se vea sobre cualquier fondo. El único trozo que se puede tocar
     es el cartel con los datos del vuelo. */
  pasar(v){
    if (this.volando) return;
    this.volando = true;
    const quieto = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const el = document.createElement('div');
    el.className = 'sobrevuelo' + (v.sentido === 'D' ? ' vuelve' : '') + (quieto ? ' quieto' : '');
    el.innerHTML = `<div class="avion">${I('send')}<span class="estela"></span></div>
      <div class="avion-cartel"><b>${esc(v.titulo)}</b><span>${esc(v.detalle)}${v.vivo ? ' · en vivo' : ''}</span></div>`;
    document.body.appendChild(el);
    const fin = () => { if (!el.isConnected) return; el.remove(); this.volando = false; };
    el.querySelector('.avion-cartel').addEventListener('click', () => { fin(); abrir('vuelos'); });
    setTimeout(fin, quieto ? 5000 : 25000);   /* tres pasadas de 7,5 s y el cartel */
  },
};

R.vuelos = {
  titulo: 'Vuelos de Ushuaia', icon: 'send', color: 'accent', sub: 'Aeropuerto Malvinas Argentinas · a 6 km del barrio',
  render(){
    const d = Vuelos.d, hay = d && (d.arr.length || d.dep.length);
    const fila = v => `<div class="it"><div class="mono" style="font-weight:800;width:52px">${esc(v.hora)}</div><div class="txt"><b>${esc(v.lugar)}</b><span>${esc(v.nro)}${v.aerolinea ? ' · ' + esc(v.aerolinea) : ''}${v.puerta ? ' · puerta ' + esc(v.puerta) : ''}</span></div>
      <span class="pill ${/cancel/i.test(v.estado) ? 'p-danger' : /demor|delay/i.test(v.estado) ? 'p-warn' : /aterr|arrib|despeg|landed|departed/i.test(v.estado) ? 'p-ok' : ''}">${esc(v.estado || (v.real ? 'Est. ' + v.real : 'Programado'))}</span></div>`;
    const porHora = {}; if (hay) [...d.arr, ...d.dep].forEach(v => { const h = v.hora.slice(0, 2); if (h) porHora[h] = (porHora[h] || 0) + 1; });
    const horas = Object.keys(porHora).sort(), pico = Math.max(1, ...Object.values(porHora));
    const estados = {
      '': `<div class="vacio">${I('refresh')}Buscando los vuelos de hoy…</div>`,
      'sin-fuente': aviso('info', 'info', 'No se pudo leer el tablero del aeropuerto',
        'El tablero lo publica London Supply y a veces no responde. Probá de nuevo en un rato o mirá el sitio oficial acá abajo.'),
      'sin-conexion': aviso('warn', 'cloud', 'Sin internet', 'Cuando vuelva la conexión, se actualiza solo.'),
    };
    return `${hay ? '' : (estados[Vuelos.estado] || estados[''])}
      ${(() => { const pp = Vuelos.proximoPaso(); if (!pp) return '';
        const hh = `${pad(Math.floor(pp.t / 60) % 24)}:${pad(pp.t % 60)}`, falta = pp.t - ahoraMin();
        return `<div class="card vuelo-prox"><span class="ic ic-accent">${I('send')}</span><div class="grow"><small class="muted">Próximo paso sobre el barrio</small>
          <b>${esc(pp.v.nro)} · ${pp.tipo === 'llega' ? 'llegando de' : 'saliendo a'} ${esc(pp.v.lugar)}</b>
          <span class="small">cerca de las ${hh} h${falta > 0 ? ` · en ${falta >= 60 ? Math.floor(falta / 60) + ' h ' : ''}${falta % 60} min` : ' · ahora'}${pp.v.real && pp.v.real !== pp.v.hora ? ` · estimado ${esc(pp.v.real)} (programado ${esc(pp.v.hora)})` : ''}</span></div></div>`; })()}
      ${hay ? `<div class="garita-kpis"><div class="kpi"><b>${d.arr.length}</b><span>Arribos</span></div><div class="kpi"><b>${d.dep.length}</b><span>Partidas</span></div><div class="kpi"><b>${d.arr.length + d.dep.length}</b><span>Hoy</span></div></div>
        ${horas.length ? `<div class="card"><b style="font-size:14px">Movimientos por hora</b><div style="display:flex;align-items:flex-end;gap:4px;height:70px;margin-top:10px">${horas.map(h => `<div style="flex:1;text-align:center"><div style="height:${Math.round(porHora[h] / pico * 56) + 4}px;background:var(--g-accent);border-radius:4px 4px 0 0"></div><div class="tiny muted">${h}</div></div>`).join('')}</div>
          <p class="muted tiny" style="margin:8px 0 0">El barrio está bajo la traza de aproximación: así se ve cuándo hay más movimiento.</p></div>` : ''}
        ${sec('Arribos')}<div class="card lista">${d.arr.map(fila).join('') || vacio('send', 'Sin arribos')}</div>
        ${sec('Partidas')}<div class="card lista">${d.dep.map(fila).join('') || vacio('send', 'Sin partidas')}</div>` : ''}
      ${d?.vivos?.length ? sec('En el aire ahora, cerca del barrio') + `<div class="card lista">${d.vivos.map(v => `<div class="it"><span class="ic ic-sky" style="width:34px;height:34px;border-radius:11px;display:grid;place-items:center">${I('send')}</span>
        <div class="txt"><b>${esc(v.callsign || 'Sin identificar')}</b><span>${v.suelo ? 'En tierra' : `${v.alt} m de altura · ${v.vel} km/h`}</span></div></div>`).join('')}</div>` : ''}
      ${sec('Cuando pasa un avión')}
      ${superficie({ a:'avion-aviso', icon:'send', color:Avion.encendido() ? 'ok' : 'accent', t:Avion.encendido() ? 'Avisarme: está activado' : 'Avisarme: está apagado',
        s:'Cruza un avión por la pantalla cuando uno sobrevuela el barrio' })}
      <details class="card plana small como-funciona"><summary><b>${I('info')} ¿Cómo sabe la app que pasa un avión?</b></summary>
        <p>No hay radar: en Tierra del Fuego no hay receptores públicos de aviones (se probaron OpenSky, adsb.lol, adsb.fi y el mapa de Flightradar24, y sobre Ushuaia no devuelven ningún avión; Flightradar24 además no deja que otra página lea sus datos). Lo más cercano a tiempo real es el tablero del aeropuerto:</p>
        <p>· <b>Llegadas:</b> el avión cruza el barrio unos 3 minutos antes de aterrizar. La app usa la hora <b>estimada</b> del aeropuerto, que se corrige si viene demorado o adelantado.<br>
           · <b>Salidas:</b> en cuanto el aeropuerto lo marca <b>Despegado</b>, cruza el avión; si todavía no lo marcó, se guía por la hora estimada.<br>
           · El tablero se vuelve a leer cada 2 minutos cuando hay un vuelo cerca y cada 5 el resto del día.</p>
        <p>${Store.s.config.vuelosProxy ? 'Hay un Worker configurado: si algún día aparece un receptor en la zona, se usa el avión real.' : 'Si algún día hay un receptor ADS-B en la zona, se puede conectar con un Worker (Ajustes → Aviones en vivo) y el aviso pasa a ser con el avión real.'}</p></details>
      ${sec('Ver en el sitio oficial')}
      ${superficie({ a:'link', v:'https://flightstats.londonsupplygroup.com/arribos-USH', icon:'login', color:'accent', t:'Arribos a Ushuaia', s:'Tablero del aeropuerto · horarios y estado' })}
      ${superficie({ a:'link', v:'https://flightstats.londonsupplygroup.com/partidas-USH', icon:'logout', color:'accent', t:'Partidas de Ushuaia', s:'Tablero del aeropuerto' })}
      ${superficie({ a:'link', v:'https://www.flightradar24.com/-54.84,-68.30/11', icon:'eye', color:'sky', t:'Mapa de aviones en vivo', s:'Flightradar24 sobre el barrio' })}
      ${esAdmin() ? superficie({ a:'abrir', v:'admin', p:'ajustes', icon:'sliders', color:'brand', t:'Configurar el Worker de vuelos', s:'Opcional: para ver los aviones en vivo dentro de la app' }) : ''}
      <button class="btn btn-sec btn-block" data-a="vuelos-actualizar">${I('refresh')}Actualizar</button>
      ${d ? `<p class="muted tiny center">Última actualización: ${hora(d.t)}${d.act ? ` · el aeropuerto actualizó ${d.act}` : ''}</p>` : ''}`;
  },
  alPintar(){ if (!Vuelos.d || Date.now() - Vuelos.d.t > 5 * MIN) Vuelos.pedir().then(() => { if (PILA.at(-1)?.id === 'vuelos') refrescar(); }); },
};
A['vuelos-actualizar'] = () => Vuelos.pedir(true).then(() => { refrescar(); toast('Vuelos actualizados', 'refresh'); });
A['avion-aviso'] = () => { Avion.prender(!Avion.encendido()); refrescar(); toast(Avion.encendido() ? 'Te avisamos cuando pase un avión' : 'Aviso de aviones apagado', 'send'); };
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
        <label class="check"><input type="checkbox" name="mostrarTel" ${u.mostrarTel ? 'checked' : ''}><span>Publicar mi oficio en <b>Profesionales y oficios</b> (Ushuaia y servicios) con mi WhatsApp</span></label>
        <label class="check"><input type="checkbox" name="respondedor" ${u.respondedor ? 'checked' : ''}><span><b>Sé primeros auxilios / RCP o soy del equipo de salud.</b> Avisame si un vecino pide ayuda médica con el SOS.</span></label>
        <hr class="sep"><div class="lbl">Directorio de vecinos</div>
        <div class="grid2"><div class="field"><label>Profesión</label><input name="profesion" id="pfProf" value="${esc(u.profesion || '')}" maxlength="60" placeholder="Médica, abogado, docente…"></div>
          <div class="field"><label>Dirección dentro del barrio</label><input name="direccion" id="pfDir" value="${esc(u.direccion || '')}" maxlength="60" placeholder="Calle 3 N° 42"></div></div>
        <div class="field"><label>Ubicación exacta (para "Cómo llegar")</label><div class="linea-form"><input name="ubicacion" id="pfUbi" value="${esc(u.ubicacion || '')}" placeholder="-54.8195,-68.3790"><button type="button" class="btn btn-sec" data-a="mi-ubicacion" title="Usar mi ubicación actual">${I('pin')}</button></div><div class="ayuda">Tocá el pin estando en tu casa.</div></div>
        <label class="check"><input type="checkbox" name="enDirectorio" ${u.enDirectorio ? 'checked' : ''}><span>Publicar mi profesión en <b>Profesionales y oficios</b> (Ushuaia y servicios) y mostrar mi teléfono y dirección en el buscador, para que me puedan contactar</span></label>
        <div class="field" style="margin-top:10px"><label>Quiénes viven en la casa</label><input name="integrantes" id="pfInt" value="${esc(u.integrantes || '')}" maxlength="160"></div>
        <button class="btn btn-pri btn-block">${I('check')}Guardar</button></form>
      ${sec('Vehículos', `<button class="link" data-a="nuevo-vehiculo">Sumar</button>`)}
      <div class="card lista">${(u.vehiculos || []).length ? u.vehiculos.map((v, i) => `<div class="it">${I('car')}<div class="txt"><b class="mono">${esc(v.patente)}</b><span>${esc(v.modelo || '')}</span></div><button class="icon-btn" data-a="borrar-vehiculo" data-v="${i}" aria-label="Quitar">${I('trash')}</button></div>`).join('') : '<p class="muted small" style="margin:4px 0">La guardia reconoce tus patentes al instante.</p>'}</div>
      ${sec('Mascotas', `<button class="link" data-a="nueva-mascota">Sumar</button>`)}
      <div class="card lista">${(u.mascotas || []).length ? u.mascotas.map(m => `<div class="it">${m.foto ? fotoHTML(m.foto, 'mini-foto') : I('paw')}<div class="txt"><b>${esc(m.nombre)}</b><span>${esc(m.especie || '')} · ${esc(m.desc || '')}${m.foto ? '' : ' · sin foto'}</span></div><button class="icon-btn" data-a="editar-mascota" data-v="${m.id}" aria-label="Editar o sumar foto">${I(m.foto ? 'edit' : 'camera')}</button><button class="icon-btn" data-a="borrar-mascota" data-v="${m.id}" aria-label="Quitar">${I('trash')}</button></div>`).join('') : '<p class="muted small" style="margin:4px 0">Si se pierde, la avisás a todo el barrio con un toque.</p>'}</div>
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
      toast('Foto de tu casa guardada', 'home');
      if (typeof Nube !== 'undefined' && Nube.activa()) setTimeout(() => Nube.fotoCasaAlDia(), 400); }
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
/* La foto de la mascota: la grande queda en este equipo; a la base va una
   de 320 px (unos 20 KB) que los vecinos bajan solo si la tocan. */
async function compartirFotoMascota(mid){
  const u = yo(), m = (u.mascotas || []).find(x => x.id === mid);
  if (!m || !m.foto || !m.foto.fotoId || typeof Nube === 'undefined' || !Nube.activa()) return;
  if (await Nube.compartirFoto(m.foto.fotoId, 320))
    Store.cambiar(s => { const x = s.users.find(z => z.id === u.id), mm = (x?.mascotas || []).find(z => z.id === mid); if (mm && mm.foto) mm.foto.nube = true; });
}
F['mascota'] = (d, form) => {
  const u = yo(), mid = form?.dataset?.id || '', foto = leerFoto(d.foto);
  const id = mid || uid();
  Store.cambiar(s => { const x = s.users.find(z => z.id === u.id); x.mascotas = x.mascotas || [];
    const ya = x.mascotas.find(m => m.id === id);
    if (ya){ Object.assign(ya, { nombre:d.nombre.trim(), especie:d.especie.trim(), desc:d.desc.trim() }); if (foto){ if (ya.foto?.fotoId) Fotos.borrar(ya.foto.fotoId); ya.foto = foto; } }
    else x.mascotas.push({ id, nombre:d.nombre.trim(), especie:d.especie.trim(), desc:d.desc.trim(), foto }); });
  cerrarHoja();
  if (foto) setTimeout(() => compartirFotoMascota(id), 300);
};
A['editar-mascota'] = el => {
  const m = (yo().mascotas || []).find(x => x.id === el.dataset.v); if (!m) return;
  hoja(`Editar a ${m.nombre}`, `<form data-f="mascota" data-id="${m.id}"><div class="grid2"><div class="field"><label>Nombre</label><input name="nombre" required maxlength="30" value="${esc(m.nombre)}"></div><div class="field"><label>Especie</label><input name="especie" maxlength="20" value="${esc(m.especie || '')}"></div></div>
    <div class="field"><label>Cómo es</label><input name="desc" maxlength="120" value="${esc(m.desc || '')}"></div>${campoFoto('fotoMasc', m.foto ? 'Cambiar la foto' : 'Sumar una foto')}
    <button class="btn btn-pri btn-block">Guardar</button></form>`);
};
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

/* =========================================================
   DESCARGAS
   Una ventana más de la app, con la misma lógica: superficies que se
   tocan. Lo que hay adentro lo carga la Administración desde
   Contenido → Descargas, así se puede sumar una app, un instructivo o
   una planilla sin tocar el programa.
   ========================================================= */
const TIPOS_DESCARGA = {
  app:      { n:'Aplicación', icon:'smartphone', c:'accent' },
  doc:      { n:'Documento', icon:'file', c:'brand' },
  planilla: { n:'Planilla', icon:'clipboard', c:'wood' },
  enlace:   { n:'Enlace', icon:'link', c:'sky' },
};
R.descargas = {
  titulo: 'Descargas', icon: 'download', color: 'sky', sub: 'Apps, documentos y planillas del barrio',
  render(){
    const s = Store.s, ds = (s.descargas || []).filter(d => d.url || d.texto);
    const porTipo = {};
    ds.forEach(d => { const t = TIPOS_DESCARGA[d.tipo] ? d.tipo : 'doc'; (porTipo[t] = porTipo[t] || []).push(d); });
    const bloque = (t) => {
      const T = TIPOS_DESCARGA[t];
      return `${sec(T.n === 'Aplicación' ? 'Aplicaciones' : T.n + 's')}
        ${porTipo[t].map(d => `<button class="superficie" data-a="descargar" data-id="${d.id}">
          <span class="ic ic-${d.color || T.c}">${I(d.icon || T.icon)}</span>
          <span class="txt"><b>${esc(d.titulo)}</b>${d.detalle ? `<small>${esc(d.detalle)}</small>` : ''}</span>${I(d.url && /^https?:/.test(d.url) ? 'right' : 'download')}</button>`).join('')}`;
    };
    return `${ds.length ? Object.keys(TIPOS_DESCARGA).filter(t => porTipo[t]).map(bloque).join('')
      : vacio('download', 'Todavía no hay nada para descargar.')}
      ${sec('Del barrio')}
      ${superficie({ v:'documentos', icon:'file', color:'brand', t:'Reglamento y normas', s:'Convivencia, obras, actas · se pueden imprimir o guardar en PDF' })}
      ${esAdmin() ? superficie({ a:'exportar-padron', icon:'users', color:'wood', t:'Padrón de propietarios (CSV)', s:'Para abrirlo en Excel' }) : ''}
      ${esAdmin() ? superficie({ a:'exportar', icon:'download', color:'sky', t:'Copia de seguridad de los datos', s:'Todo el barrio en un archivo' }) : ''}
      ${esAdmin() ? superficie({ a:'abrir', v:'admin', p:'contenido|descargas', icon:'plus', color:'accent', t:'Agregar algo a esta ventana', s:'Apps, instructivos, planillas o enlaces', cls:'acento' }) : ''}
      <p class="muted tiny">Las aplicaciones se abren en el navegador y se instalan desde ahí: en el iPhone con Compartir → Agregar a la pantalla de inicio, y en Android con el menú → Instalar aplicación.</p>`;
  },
};
A['descargar'] = el => {
  const d = (Store.s.descargas || []).find(x => x.id === el.dataset.id); if (!d) return;
  if (d.url && /^https?:/i.test(d.url)){
    hoja(d.titulo, `${d.detalle ? `<p class="small" style="margin:0 0 14px;color:var(--ink-2)">${esc(d.detalle)}</p>` : ''}
      ${d.texto ? `<div class="card plana small" style="white-space:pre-wrap">${esc(d.texto)}</div>` : ''}
      <a class="btn btn-pri btn-block btn-grande" href="${esc(d.url)}" target="_blank" rel="noopener">${I(d.tipo === 'app' ? 'smartphone' : 'download')}${d.tipo === 'app' ? 'Abrir la aplicación' : 'Descargar'}</a>
      <button class="btn btn-sec btn-block" style="margin-top:8px" data-a="copiar" data-v="${esc(d.url)}">${I('copy')}Copiar el enlace</button>
      ${d.tipo === 'app' ? `<p class="muted tiny" style="margin-top:12px">Para tenerla como una app en el teléfono: abrila y después, en el iPhone, tocá Compartir → Agregar a la pantalla de inicio; en Android, el menú de tres puntos → Instalar aplicación.</p>` : ''}`);
    return;
  }
  if (d.texto) imprimir(d.titulo, `<h1>${esc(d.titulo)}</h1><div style="white-space:pre-wrap">${esc(d.texto)}</div>`);
};

/* =========================================================
   PROMOCIONES DEL HOTEL Y BENEFICIOS PARA VECINOS
   -------------------------------------------------------
   El Hotel Los Cauquenes está dentro del predio y suele tener propuestas
   de la semana y descuentos para los vecinos. La app las muestra en una
   tira debajo de la foto de la portada.

   DE DÓNDE SALEN
   Un navegador no puede leer la web del hotel directamente: el sitio no
   autoriza que otra página lo lea (es la misma limitación que con los
   aviones en vivo). Hay dos caminos, y los dos funcionan:
     1. La Administración las carga a mano en Contenido → Promociones.
        Es lo que anda hoy, sin depender de nadie.
     2. Con un programita propio (un Worker de Cloudflare o un Apps
        Script) que lea la página del hotel y devuelva la lista en JSON.
        Se pega su dirección en Ajustes → Promociones y la app las
        actualiza sola cada hora. El formato esperado está en CONECTAR.md.
   ========================================================= */
const Promos = {
  KEY:'bhc.promos', d:null, cargando:null,
  leer(){ try { this.d = JSON.parse(localStorage.getItem(this.KEY)); } catch(e){} },
  /* Ejemplos que viajan en el código. Están para que la tira del hotel se vea
     desde el primer día, aunque la base del barrio todavía no tenga nada
     cargado: si no, la portada queda con un hueco y parece rota. En cuanto la
     Administración carga una promoción de verdad (Contenido → Promociones) o
     pega la dirección del lector en Ajustes, estos ejemplos desaparecen. */
  MUESTRA: [
    { id:'demo1', titulo:'Cena de los viernes en el restaurante', detalle:'Menú de tres pasos con productos fueguinos', descuento:'20 %', muestra:true },
    { id:'demo2', titulo:'Spa · circuito de aguas', detalle:'De lunes a jueves, con reserva previa', descuento:'25 %', muestra:true },
    { id:'demo3', titulo:'Noche para vecinos del barrio', detalle:'Alojamiento para familiares que vienen de visita', descuento:'15 %', muestra:true },
    { id:'demo4', titulo:'Té de la tarde con vista al canal', detalle:'Todos los días de 16 a 18 h, sin reserva', descuento:'10 %', muestra:true },
  ],
  vigentes(){
    const hoy = hoyISO();
    const propias = aLista(Store.s.promos).filter(p => (!p.desde || p.desde <= hoy) && (!p.hasta || p.hasta >= hoy));
    const web = aLista(this.d?.lista).filter(p => (!p.hasta || p.hasta >= hoy));
    if (!propias.length && !web.length) return this.MUESTRA;
    /* Si una promo está cargada a mano y también vino de la web, manda la
       cargada a mano: la escribió alguien del barrio. */
    const titulos = new Set(propias.map(p => (p.titulo || '').toLowerCase()));
    return [...propias, ...web.filter(p => !titulos.has((p.titulo || '').toLowerCase()))];
  },
  async pedir(forzar = false){
    const url = Store.s.config.promosUrl;
    if (!url) return null;
    if (!forzar && this.d && Date.now() - this.d.t < HORA) return this.d;
    if (this.cargando) return this.cargando;
    this.cargando = fetch(url).then(r => r.json()).then(j => {
      const lista = (j.promociones || j.lista || (Array.isArray(j) ? j : [])).map(p => ({
        id:'w' + (p.id || uid()), titulo:String(p.titulo || p.title || '').trim(),
        detalle:String(p.detalle || p.descripcion || p.description || '').trim(),
        descuento:String(p.descuento || p.discount || '').trim(),
        desde:p.desde || '', hasta:p.hasta || '', url:p.url || p.link || '', web:true,
      })).filter(p => p.titulo);
      this.d = { t:Date.now(), lista };
      try { localStorage.setItem(this.KEY, JSON.stringify(this.d)); } catch(e){}
      return this.d;
    }).catch(() => this.d).finally(() => { this.cargando = null; });
    return this.cargando;
  },
};
Promos.leer();

/* La tira de promociones de la portada: una debajo de la foto, se cambia
   sola cada tanto y se puede arrastrar con el dedo. No es un cartel
   parpadeante: avanza despacio, se frena cuando la tocás y se queda
   quieta si el equipo pide menos movimiento. */
function tiraPromos(){
  const ps = Promos.vigentes();
  if (!ps.length) return '';
  /* Si lo que se está mostrando son los ejemplos que viajan en el código,
     a quien administra se le dice dónde se cargan las de verdad. Al vecino
     no se le cuenta: para él son propuestas del hotel y punto. */
  const aviso = (ps[0] && ps[0].muestra && esAdmin())
    ? `<div class="card plana small" style="margin:8px 0 0">${I('info')} Estas son promociones <b>de ejemplo</b>.
        Las reales se cargan en <b>Administración → Contenido → Promociones</b>, o pegando la dirección del lector del hotel en <b>Ajustes</b>.</div>`
    : '';
  const chips = ps.map(p => `<button class="promo-chip" data-a="ver-promo" data-id="${esc(p.id)}">
      ${p.descuento ? `<span class="promo-desc">${esc(p.descuento)}</span>` : `<span class="ic ic-wood">${I('star')}</span>`}
      <span class="txt"><b>${esc(p.titulo)}</b>${p.detalle ? `<small>${esc(p.detalle)}</small>` : ''}</span></button>`);
  return `<div class="tira-promos">
    <div class="tira-cab">${I('star')}<b>Hotel Los Cauquenes · esta semana</b>
      ${ps[0] && ps[0].muestra ? `<span class="muted small">ejemplos</span>` : ps.length > 1 ? `<span class="muted small">${ps.length} propuestas</span>` : ''}</div>
    ${marquesina(chips, 'promo-tira')}
    ${aviso}
  </div>`;
}
A['ver-promo'] = el => {
  const p = Promos.vigentes().find(x => x.id === el.dataset.id); if (!p) return;
  hoja(p.titulo, `
    ${p.descuento ? `<div class="card plana center" style="background:var(--wood-soft);color:var(--wood)">
      <div style="font-size:30px;font-weight:800;letter-spacing:-1px">${esc(p.descuento)}</div>
      <div class="small">de descuento para vecinos del barrio</div></div>` : ''}
    ${p.detalle ? `<p style="margin:0 0 14px;color:var(--ink-2)">${esc(p.detalle)}</p>` : ''}
    ${p.desde || p.hasta ? `<div class="card plana small">${I('calendar')} ${p.desde ? 'Desde ' + fechaLarga(p.desde) : ''}${p.hasta ? (p.desde ? ' · hasta ' : 'Hasta ') + fechaLarga(p.hasta) : ''}</div>` : ''}
    ${p.url ? `<a class="btn btn-pri btn-block" href="${esc(p.url)}" target="_blank" rel="noopener">${I('link')}Ver en el Hotel Los Cauquenes</a>` : ''}
    <p class="muted tiny" style="margin-top:12px">${p.muestra ? 'Promoción de MUESTRA, para ver cómo se ve la sección: no es una oferta real. La Administración las reemplaza desde Contenido → Promociones. ' : p.web ? 'Tomado del sitio del Hotel Los Cauquenes. ' : 'Cargada por la Administración del barrio. '}Confirmá las condiciones directamente con el Hotel Los Cauquenes antes de reservar.</p>`);
};
A['promos-actualizar'] = () => Promos.pedir(true).then(() => { refrescar(); toast('Promociones actualizadas', 'refresh'); });
