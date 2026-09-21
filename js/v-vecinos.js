/* =========================================================
   Entre vecinos: directorio con búsqueda, mensajes privados
   vecino a vecino, obras en tiempo real, viajes compartidos,
   infracciones con descargo y proveedores habilitados.
   ========================================================= */

/* ---------- DIRECTORIO ----------
   Nombre y casa los ve todo el barrio (son vecinos). Profesión,
   teléfono y dirección exacta, solo si cada uno lo comparte. */
const normTxt = t => String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
/* =========================================================
   BUSCAR UN VECINO
   Salen los 152 lotes del padrón, con el nombre del propietario tal como
   figura en la liquidación de expensas y el número de lote, estén o no en
   la app. Si alguien de ese lote ya tiene cuenta y subió la foto del frente
   de su casa, se ve la foto: es lo que la garita necesita para ubicar un
   domicilio y lo que un vecino usa para saber quién es quién.
   Se busca por nombre, apellido o número de lote, sin importar acentos ni
   mayúsculas. Si el padrón todavía no se cargó, salen las cuentas de la app.
   ========================================================= */
function fichasDeVecinos(){
  const s = Store.s;
  const cuentas = s.users.filter(x => x.estado === 'aprobado' && x.rol === 'vecino' && x.casa);
  const padron = aLista(s.padron).filter(p => p && p.lote !== undefined && p.lote !== '');
  const fichas = [];
  if (padron.length){
    padron.forEach(p => { const casa = 'Lote ' + p.lote; fichas.push({ casa, lote:String(p.lote), nombre:p.propietario || '', cuentas:cuentas.filter(x => x.casa === casa) }); });
    cuentas.filter(x => !padron.some(p => 'Lote ' + p.lote === x.casa))
      .forEach(x => fichas.push({ casa:x.casa, lote:x.casa.replace(/^Lote\s*/i, ''), nombre:x.nombre, cuentas:[x] }));
  } else {
    const porCasa = new Map();
    cuentas.forEach(x => { if (!porCasa.has(x.casa)) porCasa.set(x.casa, []); porCasa.get(x.casa).push(x); });
    porCasa.forEach((cs, casa) => fichas.push({ casa, lote:casa.replace(/^Lote\s*/i, ''), nombre:cs.map(x => x.nombre).join(' · '), cuentas:cs }));
  }
  return fichas.sort((a, b) => String(a.lote).localeCompare(String(b.lote), 'es', { numeric:true }));
}
const textoFicha = f => normTxt([f.nombre, f.casa, 'lote ' + f.lote, ...f.cuentas.map(x => [x.nombre,
  x.enDirectorio ? x.profesion : '', x.skills && x.mostrarTel ? x.skills : '', x.enDirectorio ? x.direccion : ''].join(' '))].join(' '));
function coincideFicha(f, qq){
  if (!qq) return true;
  const palabras = qq.split(/\s+/).filter(Boolean), t = textoFicha(f);
  /* Un número solo busca el lote exacto: "14" es el lote 14, no el 140. */
  if (palabras.length === 1 && /^\d+[a-z]?$/.test(palabras[0])) return normTxt(f.lote) === palabras[0];
  return palabras.every(w => t.includes(w));
}
R.vecinos = {
  titulo: 'Vecinos', icon: 'users', color: 'sky', sub: 'Por nombre, apellido o número de lote',
  render(q){
    const u = yo(), qq = normTxt(q || '').trim(), staff = esStaff();
    const todas = fichasDeVecinos(), ls = todas.filter(f => coincideFicha(f, qq));
    const mostrar = ls.slice(0, 160);
    return `<form data-f="buscar-vecino" class="linea-form" style="margin-bottom:12px"><input name="q" id="qVecino" value="${esc(q || '')}" placeholder="Ej: Pérez, Lucía, 148" autocomplete="off"><button class="btn btn-pri">${I('search')}</button></form>
      ${!staff && u.rol === 'vecino' && !u.fotoCasa ? aviso('info', 'camera', 'Subí la foto del frente de tu casa', 'Así te reconocen en el buscador y la garita ubica tu domicilio en una emergencia.', `<button class="btn btn-xs btn-sec" data-a="abrir" data-v="perfil">Subirla</button>`) : ''}
      <div class="muted small" style="margin:0 2px 8px">${qq ? `${plural(ls.length, 'lote encontrado', 'lotes encontrados')}` : `${plural(todas.length, 'lote')} del barrio`}</div>
      <div class="fichas-vecinos">${mostrar.length ? mostrar.map(f => fichaVecino(f, u, staff)).join('') : vacio('search', 'Nadie coincide con esa búsqueda.')}</div>`;
  },
};
function fichaVecino(f, u, staff){
  const conFoto = f.cuentas.find(x => x.fotoCasa);
  /* "Fernández, Lucía" y "Lucía Fernández" son la misma persona: no se repite. */
  const mismas = (a, b) => normTxt(a).replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(Boolean).sort().join(' ') === normTxt(b).replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(Boolean).sort().join(' ');
  const enApp = f.cuentas.filter(x => !mismas(x.nombre, f.nombre));
  const esMio = f.casa === u.casa && !staff;
  const botones = f.cuentas.filter(x => x.id !== u.id).map(x => {
    const primero = esc(x.nombre.split(' ')[0]);
    const quien = f.cuentas.length > 1 ? ' a ' + primero : '';
    if (staff) return `<button class="btn btn-xs btn-pri" data-a="abrir" data-v="privado" data-p="${esGuardia() ? 'guardia' : 'admin'}|${x.id}">${I('chat')}Escribirle${quien}</button>
      ${x.tel ? `<a class="btn btn-xs btn-sec" href="${telLink(x.tel)}">${I('phone')}Llamar${quien}</a>` : ''}`;
    return `<button class="btn btn-xs btn-pri" data-a="abrir" data-v="dm" data-p="${x.id}">${I('chat')}Mensaje${quien}</button>
      ${x.enDirectorio && x.tel ? `<a class="btn btn-xs btn-wa" href="${waLink(x.tel)}" target="_blank" rel="noopener">${I('phone')}</a>` : ''}`;
  }).join('');
  const prof = f.cuentas.map(x => x.enDirectorio && x.profesion ? x.profesion : '').filter(Boolean);
  return `<div class="ficha-vecino ${esMio ? 'mia' : ''}">
    ${conFoto ? fotoHTML(conFoto.fotoCasa, 'ficha-foto') : `<span class="ficha-foto vacia">${I('home')}</span>`}
    <div class="ficha-txt">
      <span class="ficha-lote">Lote ${esc(f.lote)}</span>
      <b>${esc(f.nombre || 'Sin propietario cargado')}</b>
      ${enApp.length ? `<small>En la app: ${enApp.map(x => esc(x.nombre)).join(', ')}</small>` : ''}
      ${prof.length ? `<small>${I('user')} ${esc(prof.join(' · '))}</small>` : ''}
      ${esMio ? `<small>Es tu lote</small>` : !f.cuentas.length ? `<small class="muted">Todavía no usa la app</small>` : ''}
      ${botones ? `<div class="btns">${botones}</div>` : ''}
    </div></div>`;
}
F['buscar-vecino'] = d => abrir('vecinos', d.q || '');

/* ---------- MENSAJES PRIVADOS ENTRE VECINOS ---------- */
const hiloDM = (a, b) => Store.s.dms.find(h => (h.a === a && h.b === b) || (h.a === b && h.b === a));
const dmNoLeidos = () => { const u = yo(); return u ? Store.s.dms.filter(h => h.a === u.id || h.b === u.id).reduce((n, h) => n + h.msgs.filter(m => m.de !== u.id && !m.leido).length, 0) : 0; };
R.mensajes = {
  titulo: 'Mensajes', icon: 'chat', color: 'accent', sub: 'Privados entre vecinos',
  render(){
    const u = yo();
    const hilos = Store.s.dms.filter(h => h.a === u.id || h.b === u.id).sort((x, y) => (y.msgs.at(-1)?.at || 0) - (x.msgs.at(-1)?.at || 0));
    return `${superficie({ v:'vecinos', icon:'search', t:'Buscar un vecino', s:'Por nombre, apellido, profesión, oficio o dirección', cls:'acento' })}
      ${superficie({ v:'privado', icon:'lock', color:'accent', t:'Administración', s:'Tu conversación privada con la Administración' })}
      ${sec('Conversaciones')}${hilos.length ? hilos.map(h => { const otro = usuario(h.a === u.id ? h.b : h.a) || { nombre:'Ex vecino/a', casa:'' }, ult = h.msgs.at(-1), nl = h.msgs.filter(m => m.de !== u.id && !m.leido).length;
        return `<button class="superficie" data-a="abrir" data-v="dm" data-p="${otro.id || ''}">${avatar(otro)}<span class="txt"><b>${esc(otro.nombre)} · ${esc(otro.casa)}</b><small>${ult ? (ult.de === u.id ? 'Vos: ' : '') + esc(ult.text.slice(0, 60)) + ' · ' + hace(ult.at) : ''}</small></span>${nl ? `<span class="pill p-danger">${nl}</span>` : I('right')}</button>`; }).join('') : vacio('chat', 'Todavía no tenés conversaciones.')}`;
  },
};
R.dm = {
  titulo: p => usuario(p)?.nombre || 'Mensaje', icon: 'chat', color: 'accent', sub: p => `${usuario(p)?.casa || ''} · solo lo ven ustedes dos`,
  render(p){
    const u = yo(), otro = usuario(p);
    if (!otro) return vacio('user', 'Ese vecino ya no está en la app.');
    const h = hiloDM(u.id, p);
    if (h && h.msgs.some(m => m.de !== u.id && !m.leido)){ h.msgs.forEach(m => { if (m.de !== u.id) m.leido = true; }); Store.guardar(); setTimeout(pintarTop, 0); }
    marcarVistoLink('dm:' + p);
    let dia = '';
    return `<div class="chat-wrap"><div class="chat">${h && h.msgs.length ? h.msgs.map(m => { const d = isoDe(new Date(m.at)); const sep = d !== dia ? (dia = d, `<div class="dia-sep">${relDia(d)}</div>`) : '';
        return `${sep}<div class="msg ${m.de === u.id ? 'mia' : ''}"><div class="b">${esc(m.text)}<time>${hora(m.at)}${m.de === u.id && m.leido ? ' ✓✓' : ''}</time></div></div>`; }).join('')
        : vacio('chat', `Escribile a ${esc(otro.nombre.split(' ')[0])}. Nadie más ve esta conversación.`)}</div>
      <form class="chatbar" data-f="dm" data-u="${esc(p)}"><input name="text" id="dmIn" required maxlength="800" placeholder="Mensaje privado…" autocomplete="off"><button class="btn btn-accent">${I('send')}</button></form></div>`;
  },
  alPintar(){ const c = $('#cuerpo'); if (c) c.scrollTop = c.scrollHeight; },
};
F['dm'] = (d, form) => {
  const u = yo(), para = form.dataset.u;
  Store.cambiar(s => {
    let h = s.dms.find(x => (x.a === u.id && x.b === para) || (x.a === para && x.b === u.id));
    if (!h){ h = { id:uid(), a:u.id, b:para, msgs:[] }; s.dms.push(h); }
    h.msgs.push({ id:uid(), de:u.id, text:d.text.trim(), at:Date.now() });
    notificar(s, { para, titulo:`Mensaje de ${u.nombre.split(' ')[0]} (${u.casa})`, texto:d.text.trim().slice(0, 90), icon:'chat', color:'accent', link:'dm:' + u.id });
  });
  const i = $('#dmIn'); if (i){ i.value = ''; i.focus(); }
};
function marcarVistoLink(link){
  const u = yo(); const pend = aLista(Store.s.notifs).filter(n => n.link === link && meToca(n, u) && !aLista(n.leidas).includes(u.id));
  if (pend.length){ pend.forEach(n => listaDe(n, 'leidas').push(u.id)); Store.guardar(); setTimeout(pintarTop, 0); }
}

/* ---------- OBRAS EN EL BARRIO ---------- */
const ETAPAS = ['Planos aprobados','Movimiento de suelo','Fundaciones','Estructura','Techo y cerramientos','Instalaciones','Terminaciones','Final de obra'];
const TIPOS_OBRA = ['Casa nueva','Ampliación','Reforma','Quincho / pileta','Paisajismo','Cerco / deck','Otra'];
R.obras = {
  titulo: 'Obras en el barrio', icon: 'wrench', color: 'wood', sub: () => `Horario de obra: ${Store.s.config.obraHorario}`,
  render(f){
    const u = yo(), s = Store.s;
    const filtro = f || 'activas';
    let ls = s.obras.slice();
    if (filtro === 'activas') ls = ls.filter(o => o.estado === 'activa' || o.estado === 'pausada');
    else if (filtro === 'finalizadas') ls = ls.filter(o => o.estado === 'finalizada');
    else if (filtro === 'pendientes') ls = ls.filter(o => o.estado === 'pendiente');
    const hoyObra = s.obras.filter(o => o.avisoHoy && o.avisoHoy.fecha === hoyISO());
    ls.sort((a, b) => (b.ultima || b.createdAt) - (a.ultima || a.createdAt));
    const puede = o => o.userId === u.id || esAdmin();
    return `${!esGuardia() ? superficie({ a:'nueva-obra', icon:'plus', t:'Registrar mi obra', s:'La Administración la aprueba y queda visible para el barrio', cls:'acento' }) : ''}
      ${hoyObra.map(o => aviso('warn', 'truck', `Hoy en ${esc(o.casa)}: ${esc(o.avisoHoy.texto)}`, o.avisoHoy.hora ? `Desde las ${o.avisoHoy.hora} h` : '')).join('')}
      <div class="chips">${[['activas','En curso'],['pendientes','Por aprobar'],['finalizadas','Terminadas'],['todas','Todas']].map(([k, t]) => `<button class="chip ${k === filtro ? 'on' : ''}" data-a="abrir" data-v="obras" data-p="${k}">${t}</button>`).join('')}</div>
      ${ls.length ? ls.map(o => { const pct = Math.round((o.etapa + 1) / ETAPAS.length * 100), ult = o.historial?.at(-1);
        return `<div class="card"><div class="row" style="align-items:flex-start"><span class="ic ic-wood" style="width:42px;height:42px;border-radius:13px;display:grid;place-items:center;flex:none">${I('wrench')}</span>
          <div class="grow"><b style="font-size:15px">${esc(o.casa)} · ${esc(o.tipo)}</b><div class="muted small">${esc(o.empresa || 'Sin empresa cargada')}${o.finEstimado ? ' · fin estimado ' + fechaCorta(o.finEstimado) : ''}</div></div>
          <span class="pill ${o.estado === 'activa' ? 'p-ok' : o.estado === 'pendiente' ? 'p-warn' : o.estado === 'pausada' ? 'p-danger' : ''}">${{ activa:'En curso', pendiente:'Por aprobar', pausada:'Pausada', finalizada:'Terminada' }[o.estado]}</span></div>
          <div class="etapas">${ETAPAS.map((e, i) => `<i class="${i < o.etapa ? 'hecha' : i === o.etapa ? 'actual' : ''}" title="${e}"></i>`).join('')}</div>
          <div class="row small" style="justify-content:space-between"><b>${esc(ETAPAS[o.etapa])}</b><span class="muted">${pct}%</span></div>
          ${ult ? `<div class="small" style="margin-top:8px;color:var(--ink-2)">${esc(ult.texto)} <span class="muted">· ${hace(ult.at)}</span></div>${fotoHTML(ult.foto, 'post-foto')}` : ''}
          ${puede(o) ? `<div class="btns" style="margin-top:12px">
            ${o.estado === 'pendiente' && esAdmin() ? `<button class="btn btn-sm btn-ok" data-a="obra-aprobar" data-id="${o.id}">${I('check')}Aprobar</button>` : ''}
            ${o.estado !== 'finalizada' && o.estado !== 'pendiente' ? `<button class="btn btn-sm btn-pri" data-a="obra-avance" data-id="${o.id}">${I('edit')}Actualizar etapa</button><button class="btn btn-sm btn-sec" data-a="obra-hoy" data-id="${o.id}">${I('truck')}Aviso del día</button>` : ''}
            ${o.userId === u.id ? `<button class="btn btn-sm btn-sec" data-a="nuevo-pase" data-v="proveedor">${I('qr')}Pase para el personal</button>` : ''}
            ${esAdmin() && o.estado === 'activa' ? `<button class="btn btn-sm btn-danger-soft" data-a="obra-pausa" data-id="${o.id}">Pausar</button>` : ''}
            ${esAdmin() && o.estado === 'pausada' ? `<button class="btn btn-sm btn-ok" data-a="obra-reanudar" data-id="${o.id}">Reanudar</button>` : ''}</div>` : ''}</div>`; }).join('') : vacio('wrench', 'No hay obras en esta lista.')}
      <p class="muted tiny">El personal de obra ingresa con ART vigente (Ley 24.557). La guardia lo verifica en Proveedores.</p>`;
  },
};
A['nueva-obra'] = () => hoja('Registrar mi obra', `<form data-f="nueva-obra">
  <div class="grid2"><div class="field"><label>Tipo</label><select name="tipo">${TIPOS_OBRA.map(t => `<option>${t}</option>`).join('')}</select></div>
    <div class="field"><label>Etapa actual</label><select name="etapa">${ETAPAS.map((e, i) => `<option value="${i}">${e}</option>`).join('')}</select></div></div>
  <div class="grid2"><div class="field"><label>Empresa / constructor</label><input name="empresa" maxlength="60"></div><div class="field"><label>Teléfono del responsable</label><input name="tel" inputmode="tel" maxlength="20"></div></div>
  <div class="grid2"><div class="field"><label>Inicio</label><input type="date" name="inicio" value="${hoyISO()}"></div><div class="field"><label>Fin estimado</label><input type="date" name="finEstimado"></div></div>
  <div class="field"><label>Detalle</label><textarea name="detalle" maxlength="400" placeholder="Qué se hace, si va a haber camiones, mixer, grúa…"></textarea></div>
  <label class="check"><input type="checkbox" required><span>Respeto el horario de obra (${esc(Store.s.config.obraHorario)}) y el personal ingresa con ART.</span></label>
  <button class="btn btn-pri btn-block" style="margin-top:10px">${I('send')}Enviar a la Administración</button></form>`);
F['nueva-obra'] = d => {
  const u = yo();
  Store.cambiar(s => { s.obras.unshift({ id:uid(), userId:u.id, casa:u.casa, tipo:d.tipo, etapa:+d.etapa, empresa:d.empresa.trim(), tel:d.tel.trim(), inicio:d.inicio, finEstimado:d.finEstimado, detalle:d.detalle.trim(),
      estado: esAdmin() ? 'activa' : 'pendiente', createdAt:Date.now(), ultima:Date.now(), historial:[{ at:Date.now(), etapa:+d.etapa, texto:d.detalle.trim() || 'Obra registrada', por:u.id }] });
    notificar(s, { para:'rol:admin', titulo:`Obra para aprobar: ${u.casa}`, texto:d.tipo, icon:'wrench', color:'wood', link:'obras:pendientes' });
    auditar(s, 'Registró una obra', `${u.casa} · ${d.tipo}`); });
  cerrarHoja(); abrir('obras', esAdmin() ? 'activas' : 'pendientes'); toast('Obra registrada', 'wrench');
};
A['obra-aprobar'] = el => Store.cambiar(s => { const o = s.obras.find(x => x.id === el.dataset.id); if (!o) return; o.estado = 'activa'; o.ultima = Date.now();
  o.historial.push({ at:Date.now(), etapa:o.etapa, texto:'Aprobada por la Administración', por:yo().id });
  notificar(s, { para:o.userId, titulo:'Tu obra fue aprobada', texto:o.tipo, icon:'check', color:'ok', link:'obras' });
  notificar(s, { para:'todos', titulo:`Nueva obra en ${o.casa}`, texto:`${o.tipo} · ${o.empresa || ''}`, icon:'wrench', color:'wood', link:'obras' });
  auditar(s, 'Aprobó una obra', `${o.casa} · ${o.tipo}`, o.id); });
A['obra-avance'] = el => { const o = Store.s.obras.find(x => x.id === el.dataset.id); if (!o) return;
  hoja(`Obra de ${o.casa}`, `<form data-f="obra-avance" data-id="${o.id}"><div class="field"><label>Etapa</label><select name="etapa">${ETAPAS.map((e, i) => `<option value="${i}" ${i === o.etapa ? 'selected' : ''}>${e}</option>`).join('')}</select></div>
    <div class="field"><label>Novedad</label><textarea name="texto" required maxlength="300" placeholder="Ej: se terminó de hormigonar la platea"></textarea></div>${campoFoto('fotoObra')}
    <button class="btn btn-pri btn-block">${I('check')}Guardar</button></form>`); };
F['obra-avance'] = (d, form) => {
  Store.cambiar(s => { const o = s.obras.find(x => x.id === form.dataset.id); if (!o) return; o.etapa = +d.etapa; o.ultima = Date.now();
    o.historial.push({ at:Date.now(), etapa:+d.etapa, texto:d.texto.trim(), foto:leerFoto(d.foto), por:yo().id });
    if (o.etapa === ETAPAS.length - 1){ o.estado = 'finalizada'; auditar(s, 'Obra finalizada', o.casa, o.id); }
    if (o.userId !== yo().id) notificar(s, { para:o.userId, titulo:'Novedad en tu obra', texto:d.texto.trim(), icon:'wrench', color:'wood', link:'obras' }); });
  cerrarHoja(); toast('Obra actualizada', 'wrench');
};
A['obra-hoy'] = el => hoja('Aviso de obra para hoy', `<form data-f="obra-hoy" data-id="${el.dataset.id}"><div class="field"><label>¿Qué va a pasar hoy?</label><input name="texto" required maxlength="100" placeholder="Entra un mixer, corte de calle 20 min…"></div>
  <div class="field"><label>Hora</label><input type="time" name="hora"></div><button class="btn btn-pri btn-block">${I('send')}Avisar a los vecinos</button></form>`);
F['obra-hoy'] = (d, form) => {
  Store.cambiar(s => { const o = s.obras.find(x => x.id === form.dataset.id); if (!o) return; o.avisoHoy = { fecha:hoyISO(), texto:d.texto.trim(), hora:d.hora };
    notificar(s, { para:'todos', titulo:`Obra en ${o.casa}: ${d.texto.trim()}`, texto:d.hora ? `Desde las ${d.hora} h` : 'Hoy', icon:'truck', color:'warn', link:'obras' }); });
  cerrarHoja(); toast('Aviso enviado', 'truck');
};
A['obra-pausa'] = el => Store.cambiar(s => { const o = s.obras.find(x => x.id === el.dataset.id); if (!o) return; o.estado = 'pausada'; o.historial.push({ at:Date.now(), etapa:o.etapa, texto:'Pausada por la Administración', por:yo().id }); notificar(s, { para:o.userId, titulo:'Tu obra fue pausada', texto:'Consultá con la Administración', icon:'wrench', color:'danger', link:'obras' }); auditar(s, 'Pausó una obra', o.casa, o.id); });
A['obra-reanudar'] = el => Store.cambiar(s => { const o = s.obras.find(x => x.id === el.dataset.id); if (!o) return; o.estado = 'activa'; o.historial.push({ at:Date.now(), etapa:o.etapa, texto:'Reanudada', por:yo().id }); });

/* ---------- VIAJES COMPARTIDOS ---------- */
const DESTINOS = ['Centro','Aeropuerto','Escuela','Cerro Castor','Río Grande','Tolhuin','Otro'];
R.viajes = {
  titulo: 'Viajes compartidos', icon: 'car', color: 'sky', sub: 'Al centro, a la escuela, al aeropuerto, al cerro',
  render(){
    const u = yo(), ahora = hoyISO();
    const ls = Store.s.viajes.filter(v => v.fecha >= ahora).sort((a, b) => (a.fecha + a.hora).localeCompare(b.fecha + b.hora));
    return `${superficie({ a:'nuevo-viaje', icon:'plus', t:'Ofrecer o pedir un lugar', s:'Menos autos en la ruta, más charla entre vecinos', cls:'acento' })}
      ${ls.length ? ls.map(v => { const au = usuario(v.userId) || {}, yoEstoy = v.anotados.includes(u.id), libres = v.tipo === 'ofrezco' ? v.lugares - v.anotados.length : null;
        return `<div class="card"><div class="row"><span class="ic ic-${v.tipo === 'ofrezco' ? 'sky' : 'wood'}" style="width:40px;height:40px;border-radius:13px;display:grid;place-items:center">${I('car')}</span>
          <div class="grow"><b>${v.tipo === 'ofrezco' ? 'Llevo' : 'Busco lugar'} → ${esc(v.destino)}</b><div class="muted small">${relDia(v.fecha)} · ${v.hora} h · ${esc(au.nombre || '')} (${esc(au.casa || '')})</div></div>
          ${libres !== null ? `<span class="pill ${libres > 0 ? 'p-ok' : ''}">${libres > 0 ? plural(libres, 'lugar', 'lugares') : 'Completo'}</span>` : ''}</div>
          ${v.nota ? `<p class="small" style="margin:8px 0 0;color:var(--ink-2)">${esc(v.nota)}${v.vuelta ? ' · con vuelta' : ''}</p>` : ''}
          <div class="btns" style="margin-top:10px">${v.userId === u.id ? `<span class="muted small">${plural(v.anotados.length, 'vecino anotado', 'vecinos anotados')}: ${v.anotados.map(id => esc(usuario(id)?.casa || '')).join(', ') || '—'}</span><button class="btn btn-xs btn-danger-soft" data-a="borrar-viaje" data-id="${v.id}">Quitar</button>`
            : `<button class="btn btn-sm ${yoEstoy ? 'btn-accent' : 'btn-pri'}" data-a="sumarme-viaje" data-id="${v.id}" ${libres === 0 && !yoEstoy ? 'disabled' : ''}>${yoEstoy ? I('check') + 'Anotado' : v.tipo === 'ofrezco' ? 'Me sumo' : 'Yo te llevo'}</button>
               <button class="btn btn-sm btn-sec" data-a="abrir" data-v="dm" data-p="${v.userId}">${I('chat')}</button>`}</div></div>`; }).join('') : vacio('car', 'No hay viajes publicados.')}`;
  },
};
A['nuevo-viaje'] = () => hoja('Viaje compartido', `<form data-f="viaje">
  <div class="seg" style="margin-bottom:12px"><label><input type="radio" name="tipo" value="ofrezco" checked><span>${I('car')}Tengo lugar</span></label><label><input type="radio" name="tipo" value="busco"><span>${I('search')}Busco lugar</span></label></div>
  <div class="grid2"><div class="field"><label>Destino</label><select name="destino">${DESTINOS.map(d => `<option>${d}</option>`).join('')}</select></div><div class="field"><label>Lugares</label><input type="number" name="lugares" min="1" max="7" value="3"></div></div>
  <div class="grid2"><div class="field"><label>Día</label><input type="date" name="fecha" min="${hoyISO()}" value="${hoyISO()}" required></div><div class="field"><label>Hora de salida</label><input type="time" name="hora" required value="08:00"></div></div>
  <div class="field"><label>Nota</label><input name="nota" maxlength="120" placeholder="Salgo de la garita, vuelvo 13 h…"></div>
  <label class="check"><input type="checkbox" name="vuelta"><span>También hay vuelta</span></label>
  <button class="btn btn-pri btn-block" style="margin-top:10px">${I('send')}Publicar</button></form>`);
F['viaje'] = d => { const u = yo(); Store.cambiar(s => s.viajes.push({ id:uid(), userId:u.id, tipo:d.tipo, destino:d.destino, lugares:+d.lugares || 1, fecha:d.fecha, hora:d.hora, nota:d.nota.trim(), vuelta:!!d.vuelta, anotados:[], createdAt:Date.now() })); cerrarHoja(); toast('Viaje publicado', 'car'); };
A['sumarme-viaje'] = el => { const u = yo(); Store.cambiar(s => { const v = s.viajes.find(x => x.id === el.dataset.id); if (!v) return; const i = v.anotados.indexOf(u.id);
  if (i >= 0) v.anotados.splice(i, 1); else { v.anotados.push(u.id); notificar(s, { para:v.userId, titulo:`${u.nombre.split(' ')[0]} (${u.casa}) se sumó a tu viaje`, texto:`${v.destino} · ${relDia(v.fecha)} ${v.hora}`, icon:'car', color:'sky', link:'dm:' + u.id }); } }); };
A['borrar-viaje'] = el => Store.cambiar(s => { s.viajes = s.viajes.filter(v => v.id !== el.dataset.id); });

/* ---------- INFRACCIONES (graduales, con derecho a descargo) ---------- */
const TIPOS_INF = { velocidad:'Exceso de velocidad', ruidos:'Ruidos molestos', mascotas:'Mascota suelta o sin correa', obra:'Obra fuera de horario', residuos:'Residuos fuera de día u horario', estacionamiento:'Estacionamiento indebido', otro:'Otra' };
const NIVELES = [['llamado','Llamado de atención'],['apercibimiento','Apercibimiento'],['multa','Multa'],['suspension','Suspensión de espacios comunes']];
const nivelSugerido = casa => { const n = Store.s.infracciones.filter(i => i.casa === casa && i.estado !== 'anulada' && Date.now() - i.at < 365 * DIA).length; return NIVELES[Math.min(n, NIVELES.length - 1)][0]; };
R.infracciones = {
  titulo: 'Infracciones', icon: 'alert', color: 'danger', sub: () => esAdmin() ? 'Sanciones graduales con derecho a descargo (art. 2086 CCyC)' : 'Las de tu casa',
  render(){
    const u = yo(), s = Store.s;
    const ls = (esAdmin() ? s.infracciones : s.infracciones.filter(i => i.casa === u.casa)).slice().sort((a, b) => b.at - a.at);
    if (esGuardia()) return vacio('lock', 'Las infracciones las maneja la Administración.');
    return `${esAdmin() ? superficie({ a:'nueva-infraccion', icon:'plus', t:'Registrar una infracción', s:'La app sugiere el nivel según los antecedentes de la casa', cls:'acento' }) : aviso('info', 'info', 'Siempre podés presentar tu descargo', 'La Administración lo revisa antes de dejar firme la sanción.')}
      ${ls.length ? ls.map(i => `<div class="card"><div class="row" style="align-items:flex-start"><span class="ic ic-danger" style="width:40px;height:40px;border-radius:13px;display:grid;place-items:center;flex:none">${I('alert')}</span>
        <div class="grow"><b>${esc(TIPOS_INF[i.tipo] || i.tipo)}</b><div class="muted small">${esc(i.casa)} · ${new Date(i.at).toLocaleDateString('es-AR')} · ${esc(NIVELES.find(n => n[0] === i.nivel)?.[1] || '')}${i.monto ? ' · ' + esc(i.monto) : ''}</div></div>
        <span class="pill ${i.estado === 'firme' ? 'p-danger' : i.estado === 'anulada' ? '' : 'p-warn'}">${{ notificada:'Notificada', descargo:'Con descargo', firme:'Firme', anulada:'Anulada' }[i.estado]}</span></div>
        <p class="small" style="margin:8px 0 0;color:var(--ink-2)">${esc(i.detalle)}</p>${fotoHTML(i.foto, 'post-foto')}
        ${i.descargo ? `<div class="card plana small" style="margin:10px 0 0"><b>Descargo:</b> ${esc(i.descargo)}</div>` : ''}
        <div class="btns" style="margin-top:10px">${!esAdmin() && i.estado === 'notificada' ? `<button class="btn btn-sm btn-pri" data-a="descargo" data-id="${i.id}">${I('edit')}Presentar descargo</button>` : ''}
          ${esAdmin() && i.estado !== 'firme' && i.estado !== 'anulada' ? `<button class="btn btn-sm btn-danger" data-a="inf-estado" data-v="firme" data-id="${i.id}">Dejar firme</button><button class="btn btn-sm btn-sec" data-a="inf-estado" data-v="anulada" data-id="${i.id}">Anular</button>` : ''}</div></div>`).join('') : vacio('check', 'Sin infracciones.')}`;
  },
};
A['nueva-infraccion'] = () => hoja('Registrar infracción', `<form data-f="infraccion">
  <div class="grid2"><div class="field"><label>Casa</label><select name="casa" id="infCasa">${opcionesLotes()}</select></div>
    <div class="field"><label>Tipo</label><select name="tipo">${Object.entries(TIPOS_INF).map(([k, t]) => `<option value="${k}">${t}</option>`).join('')}</select></div></div>
  <div class="field"><label>Qué pasó</label><textarea name="detalle" required maxlength="500"></textarea></div>
  <div class="grid2"><div class="field"><label>Nivel</label><select name="nivel" id="infNivel">${NIVELES.map(n => `<option value="${n[0]}">${n[1]}</option>`).join('')}</select><div class="ayuda" id="infSug"></div></div>
    <div class="field"><label>Monto (si es multa)</label><input name="monto" maxlength="30"></div></div>
  ${campoFoto('fotoInf', 'Prueba (opcional)')}
  <button class="btn btn-danger btn-block">${I('send')}Notificar a la casa</button></form>`);
document.addEventListener('change', e => { if (e.target.id === 'infCasa') sugerirNivel(); });
function sugerirNivel(){ const c = $('#infCasa'), n = $('#infNivel'), s = $('#infSug'); if (!c || !n) return; n.value = nivelSugerido(c.value);
  const k = Store.s.infracciones.filter(i => i.casa === c.value && i.estado !== 'anulada' && Date.now() - i.at < 365 * DIA).length; s.textContent = `Sugerido por ${plural(k, 'antecedente')} en 12 meses`; }
const _nuevaInf = A['nueva-infraccion']; A['nueva-infraccion'] = () => { _nuevaInf(); sugerirNivel(); };
F['infraccion'] = d => {
  Store.cambiar(s => { const i = { id:uid(), casa:d.casa, tipo:d.tipo, detalle:d.detalle.trim(), nivel:d.nivel, monto:d.monto.trim(), foto:leerFoto(d.foto), at:Date.now(), estado:'notificada', por:yo().id };
    s.infracciones.unshift(i);
    notificar(s, { para:s.users.filter(x => x.casa === d.casa && x.estado === 'aprobado').map(x => x.id), titulo:'Notificación de la Administración', texto:`${TIPOS_INF[d.tipo]} · podés presentar tu descargo`, icon:'alert', color:'danger', link:'infracciones' });
    auditar(s, 'Registró una infracción', `${d.casa} · ${TIPOS_INF[d.tipo]} · ${d.nivel}`, i.id); });
  cerrarHoja(); toast('Infracción notificada', 'alert');
};
A['descargo'] = el => hoja('Presentar descargo', `<form data-f="descargo" data-id="${el.dataset.id}"><div class="field"><label>Tu descargo</label><textarea name="texto" required maxlength="1000" style="min-height:140px"></textarea></div><button class="btn btn-pri btn-block">${I('send')}Enviar</button></form>`);
F['descargo'] = (d, form) => { Store.cambiar(s => { const i = s.infracciones.find(x => x.id === form.dataset.id); if (!i) return; i.descargo = d.texto.trim(); i.estado = 'descargo';
  notificar(s, { para:'rol:admin', titulo:`Descargo de ${i.casa}`, texto:TIPOS_INF[i.tipo], icon:'edit', color:'warn', link:'infracciones' }); auditar(s, 'Presentó descargo', i.casa, i.id); }); cerrarHoja(); toast('Descargo enviado', 'send'); };
A['inf-estado'] = el => Store.cambiar(s => { const i = s.infracciones.find(x => x.id === el.dataset.id); if (!i) return; i.estado = el.dataset.v;
  notificar(s, { para:s.users.filter(x => x.casa === i.casa).map(x => x.id), titulo: el.dataset.v === 'firme' ? 'La sanción quedó firme' : 'La infracción fue anulada', texto:TIPOS_INF[i.tipo], icon:'alert', color: el.dataset.v === 'firme' ? 'danger' : 'ok', link:'infracciones' });
  auditar(s, el.dataset.v === 'firme' ? 'Dejó firme una infracción' : 'Anuló una infracción', i.casa, i.id); });

/* ---------- PROVEEDORES HABILITADOS ---------- */
const artEstado = p => { if (!p.artVence) return ['Sin ART cargada','warn']; const d = Math.round((fechaDe(p.artVence) - fechaDe(hoyISO())) / DIA); return d < 0 ? ['ART vencida','danger'] : d <= 7 ? [`ART vence en ${plural(d, 'día')}`,'warn'] : ['ART vigente','ok']; };
R.proveedores = {
  titulo: 'Proveedores habilitados', icon: 'box', color: 'accent', sub: 'Con ART y seguro al día',
  render(q){
    const qq = normTxt(q);
    const ls = Store.s.proveedores.filter(p => !qq || normTxt(p.empresa + ' ' + p.rubro + ' ' + (p.personal || '')).includes(qq)).sort((a, b) => a.empresa.localeCompare(b.empresa));
    return `<form data-f="buscar-prov" class="linea-form" style="margin-bottom:12px"><input name="q" id="qProv" value="${esc(q || '')}" placeholder="Empresa, rubro o nombre de un operario"><button class="btn btn-pri">${I('search')}</button></form>
      ${esAdmin() ? superficie({ a:'abrir', v:'admin', p:'contenido|proveedores', icon:'edit', color:'accent', t:'Editar proveedores', s:'Desde Administración → Contenido' }) : ''}
      ${ls.length ? ls.map(p => { const [t, c] = artEstado(p);
        return `<div class="card"><div class="row"><div class="grow"><b>${esc(p.empresa)}</b><div class="muted small">${esc(p.rubro || '')}${p.tel ? ' · ' + esc(p.tel) : ''}</div></div><span class="pill p-${c}">${t}</span></div>
          ${p.personal ? `<div class="small" style="margin-top:8px;color:var(--ink-2)">${I('users')} ${esc(String(p.personal).split('\n').join(', '))}</div>` : ''}
          ${p.seguroVence ? `<div class="tiny muted" style="margin-top:4px">Seguro hasta ${fechaCorta(p.seguroVence)}</div>` : ''}</div>`; }).join('') : vacio('box', 'No hay proveedores cargados.')}`;
  },
};
F['buscar-prov'] = d => abrir('proveedores', d.q || '');
LISTAS.proveedores = { t:'Proveedores habilitados', icon:'box', campos:[['empresa','Empresa'],['rubro','Rubro'],['cuit','CUIT'],['tel','Teléfono','tel'],['artVence','ART vence','date'],['seguroVence','Seguro vence','date'],['personal','Personal (uno por renglón)','area']],
  titulo:x => x.empresa, sub:x => `${x.rubro || ''} · ${artEstado(x)[0]}` };
REGLAS.push({ id:'art-vencida', n:'ART de proveedor por vencer → avisar', d:'Siete días antes y el día que vence, avisa a la Administración y a la guardia.',
  run(s, hoy){ let n = 0; s.proveedores.forEach(p => { if (!p.artVence) return; const d = Math.round((fechaDe(p.artVence) - fechaDe(hoy)) / DIA);
    if (d === 7 || d === 0) n += marca(s, `art-${p.id}-${d}`, () => notificar(s, { para:'staff', titulo: d ? `ART de ${p.empresa} vence en 7 días` : `ART de ${p.empresa} vence hoy`, texto:'Pedir la renovación antes de dejarlos ingresar.', icon:'box', color:'warn', link:'proveedores' })); }); return n; } });
