/* =========================================================
   Comunidad: pizarrón, chat, oficios, mascotas, compras
   conjuntas y avistamientos. Lo único público entre vecinos
   es el chat y el pizarrón; lo demás es opcional (cada uno
   decide si aparece en oficios o en mascotas).
   ========================================================= */

/* El pizarrón es el tablero de "alertas no tan alertas": avisos de la
   guardia y la Administración, eventos, pedidos y ofrecimientos. Lo
   urgente de verdad va por el botón SOS. */
const TIPOS_POST = {
  guardia: { n:'Guardia', icon:'shield', c:'brand' },
  aviso:   { n:'Aviso', icon:'tack', c:'sky' },
  alerta:  { n:'Alerta', icon:'alert', c:'danger' },
  evento:  { n:'Evento', icon:'calendar', c:'accent' },
  perdido: { n:'Perdido / encontrado', icon:'paw', c:'warn' },
  ofrezco: { n:'Ofrezco', icon:'wrench', c:'ok' },
  busco:   { n:'Busco', icon:'search', c:'wood' },
  mercado: { n:'Vendo / regalo', icon:'cart', c:'wood' },
};
const REACCIONES = ['👍','❤️','🙏','😮','😂'];
const CATEGORIAS = ['Plomería','Electricidad','Gas','Carpintería','Jardinería','Limpieza','Niñera','Clases particulares','Mascotas','Fletes / mudanza','Leña','Tecnología','Préstamos','Otro'];
const tiposQuePuedo = () => {
  const r = yo()?.rol;
  return Object.keys(TIPOS_POST).filter(k => k !== 'guardia' || r === 'guardia' || r === 'admin');
};

R.pizarron = {
  titulo: 'Pizarrón', icon: 'muro', color: 'brand', sub: 'Avisos de la guardia, la Administración y los vecinos', ancha: true,
  render(filtro){
    const u = yo(), s = Store.s;
    /* Al verlo, lo que avisaba el pizarrón deja de contar en la campanita. */
    marcarVisto('pizarron');
    const f = filtro || 'todo';
    let ps = s.posts.slice();
    if (f === 'servicios') ps = ps.filter(p => p.type === 'ofrezco' || p.type === 'busco' || p.type === 'mercado');
    else if (f !== 'todo') ps = ps.filter(p => p.type === f);
    ps.sort((a, b) => (!!b.fijado - !!a.fijado) || b.createdAt - a.createdAt);
    const chip = (v, t) => `<button class="chip ${f === v ? 'on' : ''}" data-a="abrir" data-v="pizarron" data-p="${v}">${t}</button>`;
    return `
      ${superficie({ a:'nuevo-post', icon:'plus', t: u.rol === 'guardia' ? 'Escribir un aviso de la guardia' : 'Publicar en el pizarrón', s: u.rol === 'guardia' ? 'Les suena y les llega a todos los vecinos' : 'Aviso, evento, perdido, ofrezco, busco…', cls:'acento' })}
      <div class="chips">${chip('todo','Todo')}${chip('guardia','Guardia')}${chip('aviso','Avisos')}${chip('alerta','Alertas')}${chip('evento','Eventos')}${chip('perdido','Perdidos')}${chip('servicios','Ofrezco / busco')}</div>
      <div class="muro-cols">${ps.length ? ps.map(cardPost).join('') : vacio('muro', 'Todavía no hay nada acá.')}</div>`;
  },
};
function cardPost(p){
  const u = yo(), t = TIPOS_POST[p.type] || TIPOS_POST.aviso, a = autorVisible(p.autor);
  const puedoBorrar = p.autor === u.id || esAdmin();
  const rx = REACCIONES.map(e => {
    const l = (p.reactions || {})[e] || [], on = l.includes(u.id);
    if (!l.length && !['👍','❤️'].includes(e)) return '';
    return `<button class="rx ${on ? 'on' : ''}" data-a="react" data-id="${p.id}" data-v="${e}">${e}${l.length ? `<span class="n">${l.length}</span>` : ''}</button>`;
  }).join('');
  const cm = p.comments || [];
  const abiertos = abiertosCm.has(p.id);
  const ev = p.type === 'evento' && p.fecha ? (() => { const d = fechaDe(p.fecha), voy = p.voy || [];
    return `<div class="evento-box"><div class="fecha"><small>${MESES[d.getMonth()]}</small><b>${d.getDate()}</b></div>
      <div class="grow small"><b>${DIAS_L[d.getDay()]}${p.horaEv ? ' · ' + p.horaEv + ' h' : ''}</b><br>${esc(p.lugar || '')} · ${plural(voy.length, 'va', 'van')}</div>
      <button class="btn btn-xs ${voy.includes(u.id) ? 'btn-accent' : 'btn-sec'}" data-a="voy" data-id="${p.id}">${voy.includes(u.id) ? I('check') + 'Voy' : '¿Vas?'}</button></div>`; })() : '';
  return `<article class="card post t-${p.type} ${p.fijado ? 'fijado' : ''} ${p.resuelto ? 'resuelto' : ''}">
    <div class="post-head">${p.autor === 'sistema' ? `<span class="avatar" style="background:var(--accent)">${I('sparkle')}</span>` : p.type === 'guardia' ? `<span class="avatar" style="background:var(--brand)">${I('shield')}</span>` : avatar(usuario(p.autor))}
      <div class="who"><b>${esc(a.nombre)}</b><span>${esc(a.casa || '')} · ${hace(p.createdAt)}</span></div>
      ${p.fijado ? `<span class="pill p-brand">${I('tack')}Fijado</span>` : ''}</div>
    <span class="pill p-${t.c}">${I(t.icon)}${t.n}${p.category ? ' · ' + esc(p.category) : ''}${p.resuelto ? ' · Resuelto' : ''}</span>
    <h3>${esc(p.title)}</h3>
    ${p.body ? `<p class="post-texto">${esc(p.body)}</p>` : ''}
    ${p.price ? `<div class="precio">${esc(p.price)}</div>` : ''}
    ${ev}
    ${fotoHTML(p.foto)}
    <div class="reacciones">${rx}</div>
    <div class="post-pie">
      <button class="accion" data-a="comentarios" data-id="${p.id}">${I('chat')}${cm.length ? cm.length : 'Comentar'}</button>
      ${(() => { const au = usuario(p.autor); return au && au.tel && au.mostrarTel && au.id !== u.id ? `<a class="accion wa" href="${waLink(au.tel)}" target="_blank" rel="noopener">${I('phone')}WhatsApp</a>` : ''; })()}
      <span class="grow"></span>
      ${p.type === 'perdido' && p.autor === u.id && !p.resuelto ? `<button class="accion" data-a="post-resuelto" data-id="${p.id}">${I('check')}Apareció</button>` : ''}
      ${esAdmin() ? `<button class="accion" data-a="fijar" data-id="${p.id}" title="${p.fijado ? 'Desfijar' : 'Fijar arriba'}">${I('tack')}</button>` : ''}
      ${puedoBorrar ? `<button class="accion" data-a="borrar-post" data-id="${p.id}" title="Borrar">${I('trash')}</button>` : ''}
    </div>
    ${abiertos ? `<div class="comentarios">${cm.map(c => `<div class="cmt">${avatar(usuario(c.autor), 'sm')}<div><div class="burb"><b>${esc(autorVisible(c.autor).nombre)}</b>${esc(c.text)}</div><time>${hace(c.createdAt)}</time></div></div>`).join('')}
      <form class="linea-form" data-f="comentar" data-id="${p.id}"><input name="text" id="cm-${p.id}" required maxlength="300" placeholder="Escribí un comentario…" autocomplete="off"><button class="btn btn-pri">${I('send')}</button></form></div>` : ''}
  </article>`;
}
const abiertosCm = new Set();
A['comentarios'] = el => { const id = el.dataset.id; abiertosCm.has(id) ? abiertosCm.delete(id) : abiertosCm.add(id); refrescar(); setTimeout(() => $('#cm-' + id)?.focus(), 30); };
F['comentar'] = (d, form) => {
  const id = form.dataset.id, u = yo();
  Store.cambiar(s => { const p = s.posts.find(x => x.id === id); if (!p) return; (p.comments = p.comments || []).push({ id:uid(), autor:u.id, text:d.text.trim(), createdAt:Date.now() });
    if (p.autor !== u.id && usuario(p.autor)) notificar(s, { para:p.autor, titulo:`${u.nombre.split(' ')[0]} comentó tu publicación`, texto:d.text.trim().slice(0, 80), icon:'chat', color:'sky', link:'pizarron' }); });
  const i = $('#cm-' + id); if (i){ i.value = ''; i.focus(); }
};
A['react'] = el => {
  const u = yo();
  Store.cambiar(s => { const p = s.posts.find(x => x.id === el.dataset.id); if (!p) return; p.reactions = p.reactions || {};
    const l = p.reactions[el.dataset.v] = p.reactions[el.dataset.v] || []; const i = l.indexOf(u.id); i >= 0 ? l.splice(i, 1) : l.push(u.id); if (!l.length) delete p.reactions[el.dataset.v]; });
  const b = $(`.rx[data-id="${el.dataset.id}"][data-v="${el.dataset.v}"]`); if (b){ b.classList.add('pop'); }
};
A['voy'] = el => { const u = yo(); Store.cambiar(s => { const p = s.posts.find(x => x.id === el.dataset.id); if (!p) return; p.voy = p.voy || []; const i = p.voy.indexOf(u.id); i >= 0 ? p.voy.splice(i, 1) : p.voy.push(u.id); }); };
A['fijar'] = el => Store.cambiar(s => { const p = s.posts.find(x => x.id === el.dataset.id); if (p) p.fijado = !p.fijado; });
A['post-resuelto'] = el => Store.cambiar(s => { const p = s.posts.find(x => x.id === el.dataset.id); if (p){ p.resuelto = Date.now(); notificar(s, { para:'todos', titulo:'¡Apareció!', texto:p.title, icon:'heart', color:'ok', link:'pizarron' }); } });
A['borrar-post'] = async el => {
  if (!await confirmar('Borrar publicación', 'Se borra para todos los vecinos.', { si:'Borrar', peligro:true })) return;
  Store.cambiar(s => { const p = s.posts.find(x => x.id === el.dataset.id); if (p?.foto?.fotoId) Fotos.borrar(p.foto.fotoId); s.posts = s.posts.filter(x => x.id !== el.dataset.id); });
  toast('Publicación borrada', 'trash');
};
A['nuevo-post'] = (el) => {
  const tipos = tiposQuePuedo(), pre = el?.dataset?.v && tipos.includes(el.dataset.v) ? el.dataset.v : (yo().rol === 'guardia' ? 'guardia' : 'aviso');
  hoja(yo().rol === 'guardia' ? 'Aviso de la guardia' : 'Publicar en el pizarrón', `<form data-f="nuevo-post">
    <div class="field"><label>Tipo</label><div class="seg">${tipos.map(k => `<label><input type="radio" name="type" value="${k}" ${k === pre ? 'checked' : ''}><span>${I(TIPOS_POST[k].icon)}${TIPOS_POST[k].n}</span></label>`).join('')}</div></div>
    ${esStaff() ? `<div class="field"><label>¿Para quién?</label><select name="destino" id="postDestino">
      <option value="todos">Todo el barrio (va al pizarrón)</option>${opcionesLotes()}</select>
      <div class="ayuda">Si elegís un lote, no se publica: le llega solo a ese vecino, como mensaje privado con sonido.</div></div>` : ''}
    <div class="field"><label>Título</label><input name="title" required maxlength="90" placeholder="${pre === 'guardia' ? 'Ej: Portón de servicio cerrado por mantenimiento' : 'Ej: Corte de luz en la calle 2'}"></div>
    <div class="field"><label>Detalle</label><textarea name="body" maxlength="800" placeholder="Contá un poco más…"></textarea></div>
    <div id="extraEvento" ${pre === 'evento' ? '' : 'hidden'} class="grid3"><div class="field"><label>Fecha</label><input type="date" name="fecha" min="${hoyISO()}"></div>
      <div class="field"><label>Hora</label><input type="time" name="horaEv"></div><div class="field"><label>Lugar</label><input name="lugar" maxlength="40" placeholder="Quincho"></div></div>
    <div id="extraServicio" ${['ofrezco','busco'].includes(pre) ? '' : 'hidden'} class="grid2"><div class="field"><label>Rubro</label><select name="category">${CATEGORIAS.map(c => `<option>${c}</option>`).join('')}</select></div>
      <div class="field"><label>Precio (opcional)</label><input name="price" maxlength="30" placeholder="$ por hora"></div></div>
    ${campoFoto('fotoPost')}
    <p class="muted tiny" style="margin:-4px 0 12px">Las alertas y los avisos de la guardia suenan y les llegan a todos. Si es una emergencia, usá el botón SOS.</p>
    <button class="btn btn-pri btn-block">${I('send')}Publicar</button></form>`);
};
document.addEventListener('change', e => {
  if (e.target.name === 'type' && e.target.closest('form[data-f="nuevo-post"]')){
    const v = e.target.value;
    $('#extraEvento').hidden = v !== 'evento';
    $('#extraServicio').hidden = !['ofrezco','busco'].includes(v);
  }
});
F['nuevo-post'] = d => {
  const u = yo();
  if (!tiposQuePuedo().includes(d.type)) return;
  /* Aviso dirigido a un solo lote: no va al pizarrón, va a su bandeja privada. */
  if (esStaff() && d.destino && d.destino !== 'todos'){
    const dest = Store.s.users.filter(x => x.casa === d.destino && x.estado === 'aprobado');
    if (!dest.length){ toast(`${d.destino} todavía no tiene vecinos con cuenta en la app`, 'alert'); return; }
    const texto = `${d.title.trim()}${d.body ? '\n' + d.body.trim() : ''}`;
    Store.cambiar(s => {
      const canal = u.rol === 'guardia' ? 'guardia' : 'admin';
      dest.forEach(x => { let h = s.privados.find(z => z.userId === x.id && (z.con || 'admin') === canal);
        if (!h){ h = { id:uid(), userId:x.id, con:canal, msgs:[] }; s.privados.push(h); }
        h.msgs.push({ id:uid(), from:canal, text:texto, createdAt:Date.now() }); });
      notificar(s, { para:dest.map(x => x.id), titulo: u.rol === 'guardia' ? 'Aviso de la guardia' : 'Aviso de la Administración', texto:d.title.trim(), icon: u.rol === 'guardia' ? 'shield' : 'tack', color:'brand', link:'privado:' + (u.rol === 'guardia' ? 'guardia' : 'admin'), sonido:true });
    });
    cerrarHoja(); toast(`Aviso enviado a ${d.destino}`, 'send'); return;
  }
  const p = { id:uid(), type:d.type, title:d.title.trim(), body:(d.body || '').trim(), autor:u.id, createdAt:Date.now(), reactions:{}, comments:[], foto:leerFoto(d.foto) };
  if (d.type === 'evento'){ p.fecha = d.fecha || ''; p.horaEv = d.horaEv || ''; p.lugar = d.lugar || ''; p.voy = [u.id]; }
  if (d.type === 'ofrezco' || d.type === 'busco'){ p.category = d.category; p.price = (d.price || '').trim(); }
  Store.cambiar(s => {
    s.posts.unshift(p);
    /* La guardia, la Administración y las alertas suenan en todos los celulares. */
    if (d.type === 'guardia' || d.type === 'alerta' || u.rol === 'admin')
      notificar(s, { para:'todos', titulo: d.type === 'guardia' ? `Guardia: ${p.title}` : d.type === 'alerta' ? `Alerta: ${p.title}` : p.title,
        texto:p.body.slice(0, 100), icon:TIPOS_POST[d.type].icon, color:TIPOS_POST[d.type].c, link:'pizarron', sonido:true });
    else if (d.type === 'perdido' || d.type === 'evento')
      notificar(s, { para:'todos', titulo:`${TIPOS_POST[d.type].n}: ${p.title}`, texto:`${u.casa}`, icon:TIPOS_POST[d.type].icon, color:TIPOS_POST[d.type].c, link:'pizarron' });
  });
  cerrarHoja(); if (PILA[PILA.length - 1]?.id !== 'pizarron') abrir('pizarron');
  toast('Publicado', 'check');
};
/* Marca como leídos los avisos que llevan a esta ventana. */
function marcarVisto(link){
  const u = yo(); if (!u) return;
  const clave = link === 'pizarron' ? 'pizarronVisto' : link === 'chat' ? 'chatVisto' : null;
  if (clave){ Store.sesion[clave] = Date.now(); Store.guardarSesion(); }
  const pend = aLista(Store.s.notifs).filter(n => n.link && n.link.split(':')[0] === link && meToca(n, u) && !aLista(n.leidas).includes(u.id));
  if (pend.length){ pend.forEach(n => listaDe(n, 'leidas').push(u.id)); Store.guardar(); setTimeout(pintarTop, 0); }
}

/* ---------- CHAT ---------- */
const CANALES = { general:'General', seguridad:'Seguridad', mascotas:'Mascotas', servicios:'Oficios', compras:'Compras' };
R.chat = {
  titulo: 'Chat vecinal', icon: 'chat', color: 'sky', sub: p => '#' + (CANALES[p] ? p : 'general'),
  render(p){
    const canal = CANALES[p] ? p : 'general', u = yo();
    marcarVisto('chat');
    const msgs = Store.s.msgs.filter(m => m.channel === canal).sort((a, b) => a.createdAt - b.createdAt).slice(-200);
    let dia = '';
    return `<div class="chat-wrap">
      <div class="chips">${Object.entries(CANALES).map(([k, n]) => `<button class="chip ${k === canal ? 'on' : ''}" data-a="abrir" data-v="chat" data-p="${k}"># ${n}</button>`).join('')}</div>
      <div class="chat" id="chatBox">${msgs.length ? msgs.map((m, i) => {
        const d = isoDe(new Date(m.createdAt)); const sep = d !== dia ? (dia = d, `<div class="dia-sep">${relDia(d)}</div>`) : '';
        const mia = m.autor === u.id, au = autorVisible(m.autor), oficial = ['admin','guardia'].includes(usuario(m.autor)?.rol);
        const mismo = i > 0 && msgs[i - 1].autor === m.autor && !sep && m.createdAt - msgs[i - 1].createdAt < 5 * MIN;
        return `${sep}<div class="msg ${mia ? 'mia' : ''} ${oficial && !mia ? 'oficial' : ''}">${!mia && !mismo ? `<div class="quien">${esc(au.nombre)}${au.casa ? ' · ' + esc(au.casa) : ''}</div>` : ''}
          <div class="b">${esc(m.text)}<time>${hora(m.createdAt)}</time></div></div>`; }).join('') : vacio('chat', 'Nadie escribió todavía. ¡Arrancá la charla!')}</div>
      <form class="chatbar" data-f="chat" data-canal="${canal}"><input name="text" id="chatIn" required maxlength="600" placeholder="Mensaje en #${CANALES[canal]}" autocomplete="off"><button class="btn btn-pri">${I('send')}</button></form></div>`;
  },
  alPintar(){ const c = $('#cuerpo'); if (c && !refrescandoChat) c.scrollTop = c.scrollHeight; },
};
let refrescandoChat = false;
F['chat'] = (d, form) => {
  const canal = form.dataset.canal, u = yo();
  Store.cambiar(s => { s.msgs.push({ id:uid(), channel:canal, autor:u.id, text:d.text.trim(), createdAt:Date.now() }); if (s.msgs.length > 2000) s.msgs.splice(0, s.msgs.length - 2000); });
  const i = $('#chatIn'); if (i){ i.value = ''; i.focus(); }
  const c = $('#cuerpo'); if (c) c.scrollTop = c.scrollHeight;
};

/* =========================================================
   PROFESIONALES Y OFICIOS DE VECINOS
   Aparece todo vecino que lo haya permitido, de dos maneras:
     · su PROFESIÓN, si marcó "mostrar a los vecinos" (enDirectorio),
     · su OFICIO, si marcó "aparecer con mi WhatsApp" (mostrarTel).
   Cualquier cuenta con lote cuenta: antes se pedía rol "vecino" y por eso
   quien además administra (o una profesión sin oficio) no salía nunca.
   Se ve desde "Ushuaia y servicios" y desde "El barrio".
   ========================================================= */
const publicaProfesion = x => !!(x && x.profesion && x.enDirectorio);
const publicaOficio = x => !!(x && x.skills && x.mostrarTel);
const enDirectorioProfesional = x => x && x.estado === 'aprobado' && x.rol !== 'guardia' && x.casa !== 'Garita' && (publicaProfesion(x) || publicaOficio(x));
R.servicios = {
  titulo: 'Profesionales y oficios', icon: 'wrench', color: 'wood', sub: 'Vecinos del barrio que se pueden contactar',
  render(q){
    const u = yo(), s = Store.s;
    const qq = normTxt(q || '');
    const gente = s.users.filter(enDirectorioProfesional)
      .filter(x => !qq || normTxt([x.nombre, x.casa, publicaProfesion(x) ? x.profesion : '', publicaOficio(x) ? x.skills : ''].join(' ')).includes(qq))
      .sort((a, b) => (aLista(b.recomiendan).length - aLista(a.recomiendan).length) || (a.profesion || a.skills || '').localeCompare(b.profesion || b.skills || '', 'es'));
    const ofertas = s.posts.filter(p => p.type === 'ofrezco' && (!qq || normTxt(p.title + ' ' + p.body + ' ' + (p.category || '')).includes(qq)));
    const estoy = enDirectorioProfesional(u);
    return `<form data-f="buscar-oficio" class="linea-form" style="margin-bottom:12px"><input name="q" id="qOficio" value="${esc(q || '')}" placeholder="Buscar: médico, electricista, clases, leña…"><button class="btn btn-pri">${I('search')}</button></form>
      ${estoy ? '' : aviso('info', 'info', '¿Sos profesional o tenés un oficio?', u.profesion && !u.enDirectorio ? `Cargaste "${esc(u.profesion)}" pero no marcaste que se muestre. Activalo en Mi casa y aparecés acá.` : 'Sumalo desde Mi casa, marcá que se publique y aparecés acá para que te contacten.', `<button class="btn btn-xs btn-sec" data-a="abrir" data-v="perfil">Ir a Mi casa</button>`)}
      ${gente.length ? `<div class="fichas-prof">${gente.map(x => { const rec = aLista(x.recomiendan), mia = rec.includes(u.id), tel = x.tel && (x.mostrarTel || x.enDirectorio);
        return `<div class="card prof ${x.id === u.id ? 'mia' : ''}"><div class="row">${avatar(x)}<div class="grow"><b>${esc(x.nombre)}</b><div class="muted small">${esc(x.casa)}${x.enDirectorio && x.direccion ? ' · ' + esc(x.direccion) : ''}</div></div>
          ${rec.length ? `<span class="pill p-warn">${I('star')}${rec.length}</span>` : ''}</div>
          ${publicaProfesion(x) ? `<div class="prof-que"><span class="pill p-brand">${I('user')}Profesión</span><b>${esc(x.profesion)}</b></div>` : ''}
          ${publicaOficio(x) ? `<div class="prof-que"><span class="pill p-wood">${I('wrench')}Oficio</span><b>${esc(x.skills)}</b></div>` : ''}
          <div class="btns" style="margin-top:12px">${x.id !== u.id ? `${tel ? `<a class="btn btn-sm btn-wa" href="${waLink(x.tel, 'Hola ' + x.nombre.split(' ')[0] + ', te escribo por la app del barrio.')}" target="_blank" rel="noopener">${I('phone')}WhatsApp</a>
              <a class="btn btn-sm btn-sec" href="${telLink(x.tel)}">${I('phone')}Llamar</a>` : ''}
            <button class="btn btn-sm btn-sec" data-a="abrir" data-v="dm" data-p="${x.id}">${I('chat')}Mensaje</button>
            <button class="btn btn-sm ${mia ? 'btn-accent' : 'btn-sec'}" data-a="recomendar" data-id="${x.id}">${I('star')}${mia ? 'Lo recomiendo' : 'Recomendar'}</button>` : `<span class="muted small">Así te ven los vecinos</span><button class="btn btn-xs btn-sec" data-a="abrir" data-v="perfil">${I('edit')}Cambiar</button>`}</div></div>`; }).join('')}</div>`
        : vacio('wrench', qq ? 'No encontramos a nadie con esa búsqueda.' : 'Todavía nadie publicó su profesión u oficio.')}
      ${ofertas.length ? sec('Ofrecimientos en el pizarrón') + ofertas.map(cardPost).join('') : ''}`;
  },
};
F['buscar-oficio'] = d => abrir('servicios', d.q || '');
A['recomendar'] = el => { const u = yo(); Store.cambiar(s => { const x = s.users.find(z => z.id === el.dataset.id); if (!x) return; x.recomiendan = x.recomiendan || []; const i = x.recomiendan.indexOf(u.id); i >= 0 ? x.recomiendan.splice(i, 1) : x.recomiendan.push(u.id); }); };

/* ---------- MASCOTAS ---------- */
R.mascotas = {
  titulo: 'Mascotas', icon: 'paw', color: 'ok', sub: 'Del barrio, perdidas y encontradas',
  render(){
    const u = yo(), s = Store.s;
    const perdidas = s.posts.filter(p => p.type === 'perdido' && !p.resuelto);
    const todas = s.users.filter(x => x.estado === 'aprobado').flatMap(x => (x.mascotas || []).map(m => ({ ...m, dueno:x })));
    return `${perdidas.length ? sec('Se buscan') + perdidas.map(cardPost).join('') : ''}
      ${sec('Las mascotas del barrio', `<button class="link" data-a="abrir" data-v="perfil">Sumar la mía</button>`)}
      <p class="muted small" style="margin:-4px 2px 12px">Si ves una suelta, la reconocés acá y le avisás al dueño con un toque. Tocá la foto para verla más grande: se baja recién ahí, así no te ocupa datos.</p>
      ${todas.length ? `<div class="hoy">${todas.map(m => `<div class="card">
        ${m.foto ? `<span class="masc-foto">${fotoHTML(m.foto, 'mini-foto', { aPedido: m.dueno.id !== u.id })}${m.dueno.id !== u.id ? `<i>${I('eye')}</i>` : ''}</span>` : `<span class="ic ic-ok" style="width:56px;height:56px;border-radius:12px;display:grid;place-items:center;flex:none">${I('paw')}</span>`}
        <div class="txt"><b>${esc(m.nombre)}</b><span>${esc(m.especie || '')} · ${esc(m.dueno.casa)}</span><span style="margin-top:4px;color:var(--ink-2)">${esc(m.desc || '')}</span>
        <div class="btns" style="margin-top:8px">${m.dueno.id === u.id
          ? `<button class="btn btn-xs btn-danger-soft" data-a="se-perdio" data-v="${m.id}">${I('alert')}Se perdió</button>`
          : `<button class="btn btn-xs btn-sec" data-a="la-vi" data-v="${m.id}" data-id="${m.dueno.id}">${I('eye')}La vi suelta</button>`}</div></div></div>`).join('')}</div>` : vacio('paw', 'Todavía nadie sumó su mascota.')}
      ${sec('Normas')}<div class="card small" style="color:var(--ink-2)">En espacios comunes, siempre con correa. Vacuna antirrábica al día e identificación. Se levantan los desechos. Queda prohibido el maltrato o el abandono (Ley 14.346).</div>`;
  },
};
A['se-perdio'] = el => {
  const u = yo(), m = (u.mascotas || []).find(x => x.id === el.dataset.v); if (!m) return;
  Store.cambiar(s => {
    s.posts.unshift({ id:uid(), type:'perdido', title:`Se perdió ${m.nombre}`, body:`${m.especie || ''}. ${m.desc || ''}\nSi la ven, avisen a ${u.casa}.`, autor:u.id, createdAt:Date.now(), reactions:{}, comments:[], foto:m.foto || null });
    s.msgs.push({ id:uid(), channel:'mascotas', autor:u.id, text:`Se perdió ${m.nombre}. ¿Alguien la vio?`, createdAt:Date.now() });
    notificar(s, { para:'todos', titulo:`Se busca a ${m.nombre}`, texto:`${m.especie || ''} de ${u.casa}`, icon:'paw', color:'warn', link:'mascotas', sonido:true });
  });
  toast('Avisamos a todo el barrio', 'paw');
};
A['la-vi'] = el => hoja('¿Dónde la viste?', `<form data-f="la-vi" data-m="${el.dataset.v}" data-id="${el.dataset.id}"><div class="field"><label>Lugar</label><input name="lugar" required maxlength="80" placeholder="Ej: calle 3, cerca de la cancha"></div><button class="btn btn-pri btn-block">${I('send')}Avisar al dueño</button></form>`);
F['la-vi'] = (d, form) => {
  const u = yo(), dueno = usuario(form.dataset.id), m = (dueno?.mascotas || []).find(x => x.id === form.dataset.m);
  Store.cambiar(s => notificar(s, { para:form.dataset.id, titulo:`${u.nombre.split(' ')[0]} vio a ${m?.nombre || 'tu mascota'}`, texto:`${d.lugar} · ${hora(Date.now())} h`, icon:'paw', color:'warn', urgente:true }));
  cerrarHoja(); toast('Le avisamos al dueño', 'check');
};

/* ---------- COMPRAS CONJUNTAS ---------- */
R.compras = {
  titulo: 'Compras conjuntas', icon: 'cart', color: 'brand', sub: 'Juntos se consigue mejor precio',
  render(){
    const u = yo(), s = Store.s;
    const abiertas = s.compras.filter(c => c.cierra > Date.now()), cerradas = s.compras.filter(c => c.cierra <= Date.now()).slice(0, 5);
    const card = c => { const tot = c.anotados.reduce((a, x) => a + (+x.cant || 0), 0), mio = c.anotados.find(x => x.userId === u.id), pct = Math.min(100, tot / c.meta * 100), abierta = c.cierra > Date.now();
      return `<div class="card"><div class="row"><span class="ic ic-brand" style="width:40px;height:40px;border-radius:13px;display:grid;place-items:center">${I('cart')}</span>
        <div class="grow"><b>${esc(c.titulo)}</b><div class="muted small">${abierta ? `Cierra ${hace(c.cierra).replace('hace', 'en')}`.replace('en recién', 'ahora') : 'Cerrada'} · propone ${esc(autorVisible(c.creadaPor).casa)}</div></div></div>
        <p class="small" style="margin:10px 0">${esc(c.detalle)}${c.precio ? `<br><b>${esc(c.precio)}</b>` : ''}</p>
        <div class="row small" style="justify-content:space-between;margin-bottom:6px"><b>${tot} de ${c.meta} ${esc(c.unidad)}</b><span class="muted">${plural(c.anotados.length, 'casa')}</span></div>
        <div class="progreso"><i style="width:${pct}%"></i></div>
        ${abierta ? `<form data-f="anotarme" data-id="${c.id}" class="linea-form" style="margin-top:12px"><input name="cant" type="number" min="0" step="0.5" id="cant-${c.id}" value="${mio ? mio.cant : ''}" placeholder="¿Cuánto querés? (${esc(c.unidad)})"><button class="btn btn-pri">${I('check')}</button></form>` : ''}</div>`; };
    const hoy = hoyISO();
    return `${superficie({ a:'nueva-compra', icon:'plus', t:'Proponer una compra conjunta', s:'Leña, garrafas, sal para el hielo, cubiertas…', cls:'acento' })}
      ${abiertas.length ? abiertas.map(card).join('') : vacio('cart', 'No hay compras abiertas.')}
      ${cerradas.length ? sec('Cerradas') + cerradas.map(card).join('') : ''}`;
  },
};
A['nueva-compra'] = () => hoja('Proponer una compra conjunta', `<form data-f="nueva-compra">
  <div class="field"><label>¿Qué compramos?</label><input name="titulo" required maxlength="80" placeholder="Leña de lenga seca"></div>
  <div class="field"><label>Detalle</label><textarea name="detalle" maxlength="400" placeholder="Proveedor, calidad, cómo se entrega…"></textarea></div>
  <div class="grid3"><div class="field"><label>Unidad</label><input name="unidad" required maxlength="12" value="unidades"></div>
    <div class="field"><label>Meta</label><input name="meta" type="number" min="1" required value="20"></div>
    <div class="field"><label>Cierra</label><input name="cierra" type="date" required min="${hoyISO()}" value="${sumarDias(hoyISO(), 5)}"></div></div>
  <div class="field"><label>Precio de referencia (opcional)</label><input name="precio" maxlength="60"></div>
  <button class="btn btn-pri btn-block">${I('send')}Publicar</button></form>`);
F['nueva-compra'] = d => {
  const u = yo();
  Store.cambiar(s => { s.compras.unshift({ id:uid(), titulo:d.titulo.trim(), detalle:d.detalle.trim(), unidad:d.unidad.trim(), meta:+d.meta, precio:d.precio.trim(), cierra:fechaDe(d.cierra).getTime() + 22 * HORA, creadaPor:u.id, anotados:[], createdAt:Date.now() });
    notificar(s, { para:'todos', titulo:'Compra conjunta: ' + d.titulo.trim(), texto:`Propone ${u.casa}`, icon:'cart', color:'brand', link:'compras' }); });
  cerrarHoja(); toast('Compra publicada', 'cart');
};
F['anotarme'] = (d, form) => {
  const u = yo(), cant = Math.max(0, +d.cant || 0);
  Store.cambiar(s => { const c = s.compras.find(x => x.id === form.dataset.id); if (!c) return; c.anotados = c.anotados.filter(x => x.userId !== u.id); if (cant) c.anotados.push({ userId:u.id, cant }); });
  toast(cant ? 'Anotado' : 'Te sacamos de la lista', 'check');
};

/* ---------- AVISTAMIENTOS (zorros, perros sueltos, castores…) ---------- */
const ESPECIES = { zorro:{ n:'Zorro', icon:'paw' }, perros:{ n:'Perros sueltos', icon:'paw' }, castor:{ n:'Castor', icon:'drop' }, caballo:{ n:'Caballos sueltos', icon:'paw' }, otro:{ n:'Otro animal', icon:'eye' } };
A['avistamiento'] = () => hoja('¿Qué viste?', `<form data-f="avistamiento">
  <div class="seg" style="margin-bottom:12px">${Object.entries(ESPECIES).map(([k, e], i) => `<label><input type="radio" name="especie" value="${k}" ${i === 0 ? 'checked' : ''}><span>${e.n}</span></label>`).join('')}</div>
  <div class="field"><label>¿Dónde?</label><input name="lugar" required maxlength="80" placeholder="Ej: contenedores de la calle 4"></div>
  <button class="btn btn-pri btn-block">${I('send')}Avisar</button>
  <p class="muted tiny" style="margin:10px 0 0">No alimentes a la fauna silvestre. Si hay dos avisos en el día, la app avisa sola a todo el barrio.</p></form>`);
F['avistamiento'] = d => {
  const u = yo();
  Store.cambiar(s => s.avistamientos.unshift({ id:uid(), especie:d.especie, lugar:d.lugar.trim(), userId:u.id, at:Date.now() }));
  cerrarHoja(); toast('Gracias por avisar', 'eye'); Motor.correr();
};

/* =========================================================
   PREGUNTAS FRECUENTES
   Idea tomada de BarrioHub: una ayuda corta, en castellano de vecino,
   para lo que más se pregunta. Cada respuesta tiene su botón que lleva
   directo a donde se hace.
   ========================================================= */
const FAQ = [
  ['¿Cómo aviso que viene una visita?', 'En Tu casa → Autorizar una visita. Cargás el nombre (y la patente si viene en auto) y la app arma un código y un QR para mandarle por WhatsApp. La garita lo ve al instante.', 'nuevo-pase', '', 'Autorizar una visita'],
  ['¿Qué hago en una emergencia?', 'Mantené apretado el botón rojo SOS arriba a la derecha durante 3 segundos y elegí qué pasa. Salta en la garita, en la Administración y en las apps abiertas del barrio. Cuando se resuelva, tocá "Ya está solucionado". El DEA (desfibrilador) está en la garita.', 'abrir', 'emergencias', 'Ver Emergencias'],
  ['¿Cómo pago las expensas?', 'En Tu casa → Mis expensas ves el saldo y el cupón del mes. Tocá la tarjeta para pagar por transferencia (alias y CBU a mano) y avisá el pago con el comprobante: la Administración lo confirma y te llega el recibo.', 'abrir', 'expensas', 'Mis expensas'],
  ['¿Cómo reservo el quincho, el SUM o la cancha?', 'En Tu casa → Reservas elegís el espacio, el día y el turno. Si está ocupado se ve en gris.', 'abrir', 'reservas', 'Reservas'],
  ['¿Cómo hago un reclamo a la Administración?', 'En Tu casa → Mis reclamos. Es privado: lo ven solo vos y la Administración, que te contesta por ahí. Si otros vecinos tienen el mismo problema, la Administración puede publicarlo en el pizarrón.', 'abrir', 'reclamos', 'Mis reclamos'],
  ['¿Qué ven los otros vecinos de mí?', 'Tu nombre y tu lote en el pizarrón y el chat. Tu teléfono, tu profesión u oficio y tu dirección, solo si vos marcás compartirlos en Mi casa. Los mensajes privados y los reclamos no los ve nadie más.', 'abrir', 'perfil', 'Mi casa'],
  ['¿Cómo aparezco en la agenda como profesional u oficio?', 'En Mi casa cargá tu profesión u oficio y tu celular, y marcá que se muestre al barrio. Aparecés solo en Profesionales y oficios y en la Agenda, con botón de WhatsApp.', 'abrir', 'perfil', 'Mi casa'],
  ['¿Dónde están las normas del barrio?', 'En El barrio → Normas y reglamento, con un buscador ("¿hasta qué hora puedo hacer obra?"). Ahí también están la ordenanza municipal de barrios cerrados y lo que dice el Código Civil.', 'abrir', 'documentos', 'Normas'],
  ['¿Qué significan los colores de la Pizarra del día?', 'Rojo: importante. Amarillo: para tener en cuenta. Verde: para saber. Lo que todavía no leíste titila en su color; al tocarlo se queda quieto.', '', '', ''],
  ['La app quedó rara o no abre una ventana', 'Tu cuenta (tu foto arriba a la derecha) → Actualizar la app. Baja todo de nuevo sin borrar tus datos.', 'actualizar-app', '', 'Actualizar la app'],
];
R.ayuda = {
  titulo: 'Preguntas frecuentes', icon: 'info', color: 'ok', sub: 'Cómo se hace cada cosa',
  render(){
    return `${FAQ.map(([p, r, a, v, b]) => `<details class="faq card"><summary><b>${esc(p)}</b>${I('right')}</summary>
      <p class="small" style="color:var(--ink-2);margin:10px 0 0;line-height:1.55">${esc(r)}</p>
      ${a ? `<button class="btn btn-sm btn-sec" style="margin-top:10px" data-a="${a}" data-v="${v}">${esc(b)}${I('right')}</button>` : ''}</details>`).join('')}
      <p class="muted small">¿No está lo que buscás? Escribile a la Administración desde Tu casa → Mensajes.</p>`;
  },
};
A['abrir-ayuda'] = () => { cerrarHoja(); abrir('ayuda'); };
