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
  const p = { id:uid(), type:d.type, title:d.title.trim(), body:(d.body || '').trim(), autor:u.id, createdAt:Date.now(), reactions:{}, comments:[], foto:fotoParaOtros(d.foto, 7) };
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
      <div class="chips">${Object.entries(CANALES).map(([k, n]) => `<button class="chip ${k === canal ? 'on' : ''}" data-a="abrir" data-v="chat" data-p="${k}"># ${n}</button>`).join('')}
        <button class="chip" data-a="hist-chat" data-v="${canal}" title="Mensajes de hace más de ${Historial.VENTANA.msgs[1]} días">${I('clock')}Anteriores</button></div>
      <div class="chat" id="chatBox">${msgs.length ? msgs.map((m, i) => {
        const d = isoDe(new Date(m.createdAt)); const sep = d !== dia ? (dia = d, `<div class="dia-sep">${relDia(d)}</div>`) : '';
        const mia = m.autor === u.id, au = autorVisible(m.autor), oficial = ['admin','guardia'].includes(usuario(m.autor)?.rol);
        const mismo = i > 0 && msgs[i - 1].autor === m.autor && !sep && m.createdAt - msgs[i - 1].createdAt < 5 * MIN;
        return `${sep}<div class="msg ${mia ? 'mia' : ''} ${oficial && !mia ? 'oficial' : ''}">${!mia && !mismo ? `<div class="quien">${esc(au.nombre)}${au.casa ? ' · ' + esc(au.casa) : ''}</div>` : ''}
          <div class="b">${esc(m.text)}<time>${hora(m.createdAt)}</time></div></div>`; }).join('') : vacio('chat', 'Nadie escribió todavía. ¡Arrancá la charla!')}</div>
      <form class="chatbar" data-f="chat" data-canal="${canal}"><input name="text" id="chatIn" required maxlength="600" placeholder="Mensaje en #${CANALES[canal]} · sin nombres, usá el lote" autocomplete="off"><button class="btn btn-pri">${I('send')}</button></form></div>`;
  },
  alPintar(){ const c = $('#cuerpo'); if (c && !refrescandoChat) c.scrollTop = c.scrollHeight; },
};
let refrescandoChat = false;
/* =========================================================
   NORMA DE CONDUCTA DEL CHAT VECINAL (pedido de Claudio, 25-09-2026)
   En el chat no se nombra a nadie: ni vecinos ni gente de la
   Administración o de la garita. Se habla del lote ("el Lote 148"), no de
   la persona. La app lo revisa ANTES de enviar: si el mensaje trae un
   nombre o un apellido de alguien del barrio, no sale.
   De dónde salen los nombres: las cuentas de la app y el padrón. Se toman
   las palabras de 3 letras o más y se dejan afuera las que también son
   palabras comunes del castellano (Rosa, Luna, Paz, Flores…): un
   "florecen las flores" no puede quedar bloqueado. El número de lote
   siempre se puede escribir.
   ========================================================= */
const PALABRAS_COMUNES = new Set(('rosa luna paz sol luz mar cruz flores flor campos campo rios rio torres torre vega sierra costa lago monte montes blanco blanca '
  + 'franco bravo rico leal prado roca leon bosque fuentes fuente calle valle mesa lobo cano rey reyes santos santo alegre moreno morena rubio castillo palacios iglesias '
  + 'ramos olivera olivares pinto nieves nieve dolores angeles angel pilar mercedes gloria soledad consuelo esperanza aurora victoria amparo rocio paloma estrella '
  + 'clara blanco sosa miel oro plata piedra piedras manzano pereira robles soria salas mena bueno buena justo justa feliz serrano marino rivera ribera toro toros '
  + 'gallo cordero conejo lobos peña pena sala casa casas villa villar barrio lote lotes garita guardia administracion admin vecino vecina vecinos todos todas '
  + 'hola gracias buenas buenos dias tardes noches que como para por con los las del una uno unos unas este esta esto ese esa eso hay muy mas bien mal '
  + 'agua gas luz cable perro perros gato gatos auto autos obra obras').split(' '));
function nombresDelBarrio(){
  const s = Store.s, set = new Set();
  const sumar = t => normTxt(t).split(/[^a-zñ]+/).forEach(w => { if (w.length >= 3 && !PALABRAS_COMUNES.has(w)) set.add(w); });
  aLista(s.users).forEach(x => { if (x && x.nombre && x.nombre !== 'Garita') sumar(x.nombre); });
  aLista(s.padron).forEach(p => { if (!p) return; sumar(p.propietario || ''); aLista(p.titulares).forEach(t => sumar(typeof t === 'string' ? t : (t && t.nombre) || '')); });
  aLista(Store.s.config.nombresChat).forEach(sumar);   /* por si la Administración quiere sumar alguno (guardias, personal) */
  ['sa', 'srl', 'sas', 'suc', 'sucesion', 'otros', 'otra', 'otro'].forEach(w => set.delete(w));
  return set;
}
/* Devuelve la palabra que no puede ir, o '' si el mensaje está bien. */
function nombreEnMensaje(texto){
  const nombres = nombresDelBarrio();
  const palabras = normTxt(texto).split(/[^a-zñ]+/).filter(Boolean);
  return palabras.find(w => nombres.has(w)) || '';
}
F['chat'] = (d, form) => {
  const canal = form.dataset.canal, u = yo();
  const prohibido = nombreEnMensaje(d.text);
  if (prohibido){
    hoja('El mensaje no se envió', `${aviso('danger', 'alert', 'Norma de conducta del chat vecinal', `En el chat no se nombra a vecinos ni a personas de la Administración o de la garita. La palabra "${esc(prohibido)}" coincide con un nombre del barrio.`)}
      <p class="small" style="margin:0 0 12px;color:var(--ink-2)">Nombrá el lote en lugar de la persona: por ejemplo, <b>"el Lote 148"</b>. Si es algo privado, escribile directamente desde Vecinos o a la Administración desde Tu casa → Mensajes.</p>
      <button class="btn btn-pri btn-block" data-a="cerrar-hoja">Entendido, lo corrijo</button>`);
    return;
  }
  Store.cambiar(s => { s.msgs.push({ id:uid(), channel:canal, autor:u.id, text:d.text.trim(), createdAt:Date.now() }); });
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
  ['¿Cómo aviso que viene una visita?', 'En Tu casa → Autorizar una visita. Cargás el nombre (y la patente si viene en auto) y la app arma un código y un QR para mandarle por WhatsApp. La garita lo ve al instante, con tu nombre como quien autorizó. Si viene varias veces (empleada, personal de una obra), marcá "Viene varias veces": es un solo QR para todos esos días.', 'nuevo-pase', '', 'Autorizar una visita'],
  ['¿Cuánto tiempo queda mi historial de visitas?', 'En la app ves las visitas de los últimos {DIAS} días. Las anteriores no se pierden: pasan al archivo histórico del barrio, sin DNI ni patente, y las ves cuando quieras en Mis visitas → "Ver mi historial completo". Así la app no baja todo cada vez que la abrís y sigue rápida.', 'abrir', 'visitas', 'Mis visitas'],
  ['¿Cómo pido el DEA (desfibrilador)?', 'En Ushuaia y servicios → Emergencias, al lado del corazón rojo: mantené apretado el botón verde SOLICITARLO durante 2 segundos y contestá SÍ. A la garita le salta la alarma con tu lote y tu apellido hasta que salen con el DEA; a vos te avisa cuando va en camino. Llamá también al 911.', 'abrir', 'emergencias', 'Ver Emergencias'],
  ['¿Puedo nombrar a alguien en el chat vecinal?', 'No. Es una norma de conducta: en el chat no se escriben nombres ni apellidos de vecinos ni de la Administración o la garita, y la app no deja enviar el mensaje. Se nombra el lote ("el Lote 148"). Para algo personal, escribile en privado.', 'abrir', 'chat', 'Chat vecinal'],
  ['¿Cómo aviso que tengo una obra?', 'En El barrio → Obras → Registrar mi obra. La ven al instante la Administración, la garita y todo el barrio, y aparece en la Pizarra del día mientras dure. Los días con mixer o camión mandá el "Aviso del día". La garita no la puede editar; la Administración sí.', 'abrir', 'obras', 'Obras'],
  ['¿Qué hago en una emergencia?', 'Mantené apretado el botón rojo SOS arriba a la derecha durante 3 segundos y elegí qué pasa. Salta en la garita, en la Administración y en las apps abiertas del barrio. Cuando se resuelva, tocá "Ya está solucionado". El DEA (desfibrilador) está en la garita y se pide desde Emergencias.', 'abrir', 'emergencias', 'Ver Emergencias'],
  ['¿Cómo pago las expensas?', 'En Tu casa → Mis expensas ves el saldo y el cupón del mes. Tocá la tarjeta para pagar por transferencia (alias y CBU a mano) y avisá el pago con el comprobante: la Administración lo confirma y te llega el recibo.', 'abrir', 'expensas', 'Mis expensas'],
  ['¿Cómo reservo el quincho, el SUM o la cancha?', 'En Tu casa → Reservas elegís el espacio, el día y el turno. Si está ocupado se ve en gris.', 'abrir', 'reservas', 'Reservas'],
  ['¿Cómo hago un reclamo a la Administración?', 'En Tu casa → Mis reclamos. Es privado: lo ven solo vos y la Administración, que te contesta por ahí. Si otros vecinos tienen el mismo problema, la Administración puede publicarlo en el pizarrón.', 'abrir', 'reclamos', 'Mis reclamos'],
  ['¿Qué ven los otros vecinos de mí?', 'Tu nombre y tu lote en el pizarrón y el chat. Tu teléfono, tu profesión u oficio y tu dirección, solo si vos marcás compartirlos en Mi casa. Tus mensajes privados y tus reclamos no los ve ningún otro vecino. Más abajo, en "Tus datos: privacidad y seguridad", está todo el detalle.', 'abrir', 'perfil', 'Mi casa'],
  ['¿Cómo aparezco en la agenda como profesional u oficio?', 'En Mi casa cargá tu profesión u oficio y tu celular, y marcá que se muestre al barrio. Aparecés solo en Profesionales y oficios y en la Agenda, con botón de WhatsApp.', 'abrir', 'perfil', 'Mi casa'],
  ['¿Dónde están las normas del barrio?', 'En El barrio → Normas y reglamento, con un buscador ("¿hasta qué hora puedo hacer obra?"). Ahí también están la ordenanza municipal de barrios cerrados y lo que dice el Código Civil.', 'abrir', 'documentos', 'Normas'],
  ['¿Qué significan los colores de la Pizarra del día?', 'Rojo: importante. Amarillo: para tener en cuenta. Verde: para saber. Lo que todavía no leíste titila en su color; al tocarlo se queda quieto.', '', '', ''],
  ['¿Quién responde por la app y por mis datos?', 'La app la hizo un vecino, Claudio A. Ravasi, en forma gratuita. La maneja la Administración del barrio, que es la responsable de los datos (Ley 25.326 de Protección de Datos Personales). Cada uno responde por lo que publica. No reemplaza al 911, al 107 ni a los bomberos. Todo el detalle legal está en los términos de uso; también se abren tocando "by Claudio A. Ravasi" al pie de la portada.', 'abrir', 'legal', 'Términos de uso y responsabilidad'],
  ['La app quedó rara o no abre una ventana', 'Tu cuenta (tu foto arriba a la derecha) → Actualizar la app. Baja todo de nuevo sin borrar tus datos.', 'actualizar-app', '', 'Actualizar la app'],
];
/* =========================================================
   TUS DATOS: PRIVACIDAD Y SEGURIDAD
   Pedido de Claudio (25-09-2026): que cualquier vecino, y también un vecino
   abogado, entienda cómo se cuidan los datos y bajo qué normas.
   REGLA DE ORO al editar esto: escribir solo lo que la app HACE. Nada de
   "todo está encriptado" o "cumple todo" a secas: una promesa exagerada es
   lo primero que un abogado detecta, y le quita valor a todo lo demás.
   Si cambia el comportamiento de la app (reglas de Firebase, qué baja cada
   rol, fotos, plazos de borrado), hay que cambiar también este texto.
   ========================================================= */
const FAQ_DATOS = [
  ['En pocas palabras: ¿mis datos están seguros?', [
    'Sí. La app pide solo lo necesario; cada persona ve únicamente lo que le corresponde según su función, y eso lo controla el servidor, no la pantalla; todo viaja cifrado y queda guardado cifrado; las contraseñas no las puede ver nadie; los datos de las visitas se borran solos; y nada se vende, se publica ni se entrega a terceros ajenos al barrio sin tu consentimiento.',
    'Está hecha conforme a la Ley 25.326 de Protección de los Datos Personales, a las garantías de privacidad de la Constitución Nacional y a los tratados internacionales de derechos humanos que tienen su misma jerarquía. En cada punto de abajo está primero la explicación en simple y después el fundamento jurídico, para que cualquier vecino (también quien sea abogado) lo pueda controlar.',
  ]],
  ['¿Qué normas la rigen?', [
    'En simple: la privacidad está protegida por la Constitución, por tratados de derechos humanos, por una ley específica de datos personales y por el Código Civil y el Código Penal. La app aplica todas.',
    '• Constitución Nacional: art. 18 (inviolabilidad de la correspondencia y los papeles privados), art. 19 (esfera de intimidad y autonomía personal) y art. 43, tercer párrafo (hábeas data: conocer, rectificar, actualizar, suprimir y exigir confidencialidad de los datos propios). La Corte Suprema definió el alcance del derecho a la intimidad en "Ponzetti de Balbín c/ Editorial Atlántida" (Fallos 306:1892, 1984) y extendió la protección a las comunicaciones y los datos personales en "Halabi c/ PEN" (Fallos 332:111, 2009).',
    '• Tratados con jerarquía constitucional (art. 75 inc. 22 CN): Declaración Universal de Derechos Humanos, art. 12; Declaración Americana de los Derechos y Deberes del Hombre, arts. V, IX y X; Pacto Internacional de Derechos Civiles y Políticos, art. 17; Convención Americana sobre Derechos Humanos, art. 11.2 y 11.3. Todos prohíben las injerencias arbitrarias en la vida privada, el domicilio y la correspondencia, y obligan a protegerlas por ley.',
    '• Ley 25.326 de Protección de los Datos Personales y su Decreto Reglamentario 1558/2001. Sus capítulos I a IV son de orden público y rigen en todo el país (art. 44), también en Tierra del Fuego. Ley 27.483, que aprueba el Convenio 108 del Consejo de Europa para la protección de las personas respecto del tratamiento automatizado de datos de carácter personal.',
    '• Normas de la autoridad de control: Ley 27.275 y Decreto 746/2017 (la Agencia de Acceso a la Información Pública, AAIP, es la autoridad de aplicación de la Ley 25.326), Resolución AAIP 47/2018 (medidas de seguridad recomendadas para el tratamiento informatizado de datos) y Disposición DNPDP 60-E/2016 (transferencias internacionales).',
    '• Código Civil y Comercial: arts. 51 (inviolabilidad de la persona humana y su dignidad), 52 (intimidad, honor, imagen e identidad), 53 (derecho a la propia imagen), 1770 (protección de la vida privada) y 2073 a 2086 (conjuntos inmobiliarios).',
    '• Código Penal, según la Ley 26.388 de delitos informáticos: arts. 153 (violación de comunicaciones electrónicas), 153 bis (acceso indebido a un sistema informático), 157 bis (acceso ilegítimo a un banco de datos personales y revelación de sus datos) y 117 bis (inserción de datos falsos en un archivo de datos personales).',
    '• Ámbito local: Ordenanza Municipal 2102/1999 de barrios cerrados de Ushuaia, el estatuto y el reglamento interno del barrio.',
  ]],
  ['¿Quién es el responsable de los datos? ¿Qué papel cumple cada uno?', [
    'En simple: el dueño y responsable de la base es el barrio. La empresa del servidor solo presta los equipos donde se guarda la base y no puede usar los datos para nada más. Quien hizo la app no es el responsable de la base.',
    '• Responsable del archivo (art. 2 de la Ley 25.326): el barrio, por medio de su entidad administradora, que decide la finalidad del tratamiento, aprueba las cuentas, asigna los roles y responde los pedidos de los titulares.',
    '• Prestador de servicios informatizados, o encargado del tratamiento (art. 25): la empresa que presta el servidor, la base de datos y el servicio de correo de la aplicación, bajo sus condiciones de tratamiento y seguridad de datos. Por ley no puede aplicar los datos a un fin distinto del contratado ni cederlos, ni siquiera para conservarlos, y debe destruirlos al terminar la prestación.',
    '• Personas autorizadas (Administración y garita): acceden solo a lo que su función requiere y están obligadas al secreto profesional sobre los datos (art. 10), una obligación que sigue vigente aun después de dejar la función.',
    '• Autor de la app (Claudio A. Ravasi, vecino, en forma gratuita): desarrolló la herramienta. No es el responsable del archivo ni decide sobre los datos. Su rol, si tiene alguno dentro del barrio, es el mismo que el de cualquier otro vecino con esa función.',
  ]],
  ['¿Con qué derecho se tratan mis datos? (base de licitud)', [
    'En simple: porque lo aceptaste expresamente al inscribirte, después de poder leer para qué se usan; y, en lo básico del padrón y las expensas, porque lo exige tu relación con el barrio.',
    '• Consentimiento libre, expreso e informado (art. 5 inc. 1): la inscripción exige tildar una casilla de aceptación de los términos de uso y la política de datos, que se pueden leer completos antes de aceptar. Queda registrada la fecha y la hora de la aceptación.',
    '• Deber de información previa (art. 6): la app informa la finalidad, quiénes reciben los datos, quién es el responsable, qué datos son obligatorios y cuáles optativos, y cómo ejercer los derechos de acceso, rectificación y supresión.',
    '• Además, los datos del padrón (nombre, DNI, domicilio) y los de expensas no requieren consentimiento: están comprendidos en las excepciones del art. 5 inc. 2, apartado c (listados limitados a nombre, DNI, identificación tributaria, ocupación, fecha de nacimiento y domicilio) y apartado d (datos que derivan de una relación contractual y son necesarios para cumplirla), en este caso la relación de cada propietario con el conjunto inmobiliario.',
  ]],
  ['¿Qué datos pide y cómo se aplican los principios de la ley?', [
    'En simple: se pide lo mínimo, se usa solo para lo que se dijo, se puede corregir y se borra cuando ya no hace falta.',
    '• Calidad y minimización (art. 4 inc. 1): los datos obligatorios son nombre y apellido, lote, correo y DNI (este último, para verificar que sos del barrio antes de aprobar la cuenta). Teléfono, profesión u oficio, vehículos, mascotas y foto del frente de la casa son optativos.',
    '• Finalidad (art. 4 inc. 3): comunicación, seguridad, administración y convivencia del barrio. Ningún dato se usa para publicidad ni para un fin distinto o incompatible. La app no tiene publicidad ni herramientas de seguimiento o de estadística de terceros.',
    '• Exactitud (art. 4 inc. 4 y 5): cada vecino corrige sus propios datos en Mi casa, en cualquier momento.',
    '• Conservación limitada (art. 4 inc. 7): los datos de las visitas (DNI y patente) se borran solos a los {DIAS} días; las copias de fotos para descargar vencen y se borran. Pasado ese plazo, la visita queda solo en el archivo histórico del barrio (quién vino, a qué lote y cuándo), sin DNI ni patente, con las mismas reglas de acceso que el resto: cada vecino ve solo las suyas.',
    '• Privacidad por defecto: lo optativo nace oculto. Tu teléfono, tu oficio o tu dirección se muestran a otros vecinos solo si vos lo marcás, y lo podés quitar cuando quieras.',
    '• Minimización por rol: la base está ordenada en carpetas y el servidor le abre a cada rol solo las que necesita. Por ejemplo, la garita no puede leer expensas, pagos, reclamos ni las conversaciones de los vecinos con la Administración, y la Administración no puede leer las conversaciones de un vecino con la garita.',
  ]],
  ['¿Está todo cifrado (encriptado)? ¿Qué medidas de seguridad hay?', [
    'En simple: sí, en el viaje y en el guardado. Y además el servidor decide quién puede leer cada cosa.',
    '• En el viaje: toda la comunicación entre tu equipo y la base del barrio viaja cifrada (HTTPS/TLS, el estándar de la banca en línea). Nadie en el camino (un wifi público, el proveedor de internet) puede leerla ni alterarla.',
    '• En el guardado: los servidores de la base de datos almacenan los datos cifrados con AES-256.',
    '• Contraseñas: no se guardan. El sistema de cuentas del servidor conserva solo una huella criptográfica irreversible (hash). Nadie puede verlas: ni la Administración, ni la garita, ni quien hizo la app. Si alguien la olvida, pide una nueva por correo.',
    '• Control de acceso en el servidor: las reglas de la base definen, carpeta por carpeta, qué puede leer y escribir cada rol, y cada vecino solo puede abrir su propia carpeta. Aunque alguien manipulara la app en su teléfono, el servidor no le entrega lo que no le corresponde. Es la medida central que recomienda la Resolución AAIP 47/2018, junto con la identificación de cada usuario y el registro de lo que se hace.',
    '• Trazabilidad: cada acción relevante de la Administración (aprobar una cuenta, cambiar un rol, confirmar un pago, editar datos) queda en un registro de auditoría con autor, fecha y hora.',
    '• Equipos compartidos: al cerrar sesión se borra de ese equipo todo lo que vino del barrio.',
    '• El programa de la app no contiene ningún nombre ni dato de vecinos: el padrón se carga aparte, dentro de la base protegida.',
    '• Límite, dicho con honestidad: no es un cifrado "de punta a punta" como el de WhatsApp. Quien tiene un rol autorizado ve lo que necesita para su tarea. El art. 9 de la Ley 25.326 exige adoptar las medidas técnicas y organizativas necesarias; ninguna ley exige, porque nadie la puede dar, una garantía de seguridad absoluta. La seguridad también depende de que cada uno cuide su contraseña y su teléfono.',
  ]],
  ['¿Quién puede ver cada cosa?', [
    '• Los otros vecinos: tu nombre y tu lote en el pizarrón y el chat del barrio; tu teléfono, oficio o dirección solo si vos lo autorizás. Nunca tu DNI, tu correo, tus expensas, tus reclamos, tus visitas ni tus mensajes.',
    '• La garita: lo que necesita para la seguridad: tus visitas y pases, tus paquetes, tus peticiones firmadas, los avisos que le mandás, las conversaciones con ella y la foto del frente de tu casa para ubicar el domicilio.',
    '• Retiro de paquetes: tu teléfono crea una llave que nunca sale de él. En tu ficha queda solo su parte pública (sirve para comprobar la firma del QR, no para firmar) y el tipo de equipo (por ejemplo "iPhone"). Cada entrega queda asentada con quién recibió, quién entregó, la hora y un sello SHA-256. Si retirás sin teléfono, de tu DNI se guardan solo los tres últimos números. Al cerrar sesión, la llave se borra de ese equipo.',

    '• La Administración: lo que necesita para administrar: el padrón, las expensas y los pagos, los reclamos y las conversaciones con ella.',
    '• Mensajes entre vecinos: solo los ven los dos que conversan. Las reglas del servidor no dejan que nadie más los lea: ni otro vecino, ni la garita, ni la Administración.',
    '• Rondas del policía con QR: cuando escanea un punto de control, se guardan su nombre, el punto y la hora (del servidor, no del teléfono). Solo cuenta si el teléfono tiene el código de ronda que la garita le da al policía de turno esa noche: un vecino que escanee un QR no puede registrar nada. Lo ven solo la garita y la Administración, y sirve para comprobar que la ronda se hizo.',
    '• Si pedís un SOS: la alerta salta en la pantalla de todos, con el tipo de emergencia, tu nombre, tu lote y la ubicación GPS de ese momento, para que cualquiera sepa dónde está pasando y pueda ayudar. La ubicación se toma solo cuando vos apretás el SOS, nunca antes ni después. Tu teléfono lo ven solo la garita y la Administración. Es un uso consentido por el propio titular al pedir ayuda y limitado a la emergencia (arts. 4 y 5 de la Ley 25.326).',
    '• La lista de equipos anotados para recibir avisos en el celular: no la puede leer ninguna persona desde la app; solo el programa que envía los avisos.',
  ]],
  ['¿Qué pasa con los datos sensibles, como la salud?', [
    'En simple: la app no arma fichas de salud de nadie. Si pedís ayuda por una emergencia médica, ese dato se usa solo para atenderte.',
    'Los datos de salud son "datos sensibles" (arts. 2 y 7 de la Ley 25.326) y tienen la protección más alta: nadie está obligado a darlos, y está prohibido formar archivos que los revelen. La app no los pide. El único caso es el SOS de emergencia médica: lo activa el propio titular, se registra solo el tipo de emergencia (no diagnósticos) y se trata exclusivamente para atenderla.',
  ]],
  ['¿Y mis fotos, y la imagen de otras personas?', [
    'La foto original queda en tu equipo. A la base del barrio va solo una versión reducida, lo justo para verla en la pantalla. Las copias en buena calidad que se comparten para descargar tienen vencimiento.',
    'Nadie puede captar ni publicar la imagen de otra persona sin su consentimiento (art. 53 del Código Civil y Comercial). Está prohibido en los términos de uso y la Administración puede retirarla.',
  ]],
  ['¿Y los datos de mis visitas, que no son usuarios de la app?', [
    'La visita completa un formulario donde se le informa que sus datos (DNI y patente) sirven solo para el ingreso al barrio y que se borran solos a los {DIAS} días. Debe aceptarlo para continuar (arts. 5 y 6 de la Ley 25.326). El registro de auditoría no guarda ni el DNI ni la patente.',
  ]],
  ['¿Tienen valor las firmas que se hacen en la pantalla?', [
    'En simple: sí, como prueba, y no se pueden alterar sin que se note.',
    'Las peticiones a la garita se firman a mano en la pantalla, por el vecino y por el guardia. Jurídicamente es una firma electrónica (art. 5 de la Ley 25.506), no una firma digital con certificado. Por eso no reemplaza la firma de un instrumento que la ley exige firmado (art. 288 del Código Civil y Comercial), pero sí es un medio de prueba que el juez valora (art. 319). Cada petición lleva un sello criptográfico SHA-256: si alguien cambiara una sola letra después de firmada, el sello deja de coincidir y la alteración queda en evidencia.',
  ]],
  ['¿Dónde están guardados los datos? ¿Salen del país?', [
    'En los servidores de la base de datos, en los Estados Unidos, con certificaciones internacionales de seguridad (ISO 27001 y SOC 2, entre otras). Los correos los envía el servicio de correo de la aplicación y, si pagás en línea, el pago lo procesa Mercado Pago con sus propios resguardos.',
    'La Ley 25.326 restringe la transferencia a países sin un nivel de protección adecuado (art. 12), y los Estados Unidos no figuran en la lista de la Disposición DNPDP 60-E/2016. La transferencia es lícita porque el titular la consiente expresamente al inscribirse: el Decreto 1558/2001 (art. 12) dispone que en ese caso la prohibición no rige. Además, la empresa del servidor actúa como prestador de servicios con las obligaciones del art. 25 de la ley.',
  ]],
  ['¿Qué derechos tengo y cómo los ejerzo?', [
    '• Acceso: saber qué datos tuyos hay, de dónde salieron y para qué se usan. Es gratuito cada seis meses (antes, si acreditás un interés legítimo), y la respuesta debe llegar dentro de los 10 días corridos (art. 14). Tiene que ser clara y comprensible (art. 15).',
    '• Rectificación, actualización y supresión: que se corrija lo inexacto o se borre lo que no corresponde, dentro de los 5 días hábiles (art. 16). Muchos datos los corregís vos mismo en Mi casa.',
    '• Baja: podés pedir la baja de tu cuenta y la supresión de tus datos. La excepción es la que prevé la propia ley (art. 16 inc. 5): los datos que el barrio tiene obligación legal de conservar, como los contables y los de expensas, que se guardan diez años (art. 328 del Código Civil y Comercial).',
    '• Cómo: se pide a la Administración, desde Tu casa → Mensajes o por correo.',
    '• Si no te responden o la respuesta no te satisface, tenés dos caminos: la denuncia administrativa ante la AAIP (argentina.gob.ar/aaip) y la acción judicial de hábeas data (art. 43 CN y arts. 33 y siguientes de la Ley 25.326).',
  ]],
  ['¿Quién controla que se cumpla? ¿Qué pasa si alguien no cumple?', [
    'La autoridad de control es la Agencia de Acceso a la Información Pública (AAIP), un organismo nacional con facultades de fiscalización, que puede recibir denuncias, inspeccionar y sancionar (arts. 29 y 31 de la Ley 25.326). Las sanciones administrativas van del apercibimiento a la suspensión, la multa, la clausura o la cancelación del archivo, y se aplican con independencia de la responsabilidad civil por los daños y de la penal.',
    'En lo penal, quien acceda sin autorización a los datos o los revele comete un delito (arts. 153 bis y 157 bis del Código Penal). En lo civil, la afectación de la intimidad o la imagen se repara según los arts. 52, 53 y 1770 del Código Civil y Comercial. Dentro del barrio, el uso indebido de la app habilita a la Administración a suspender la cuenta.',
    'Las decisiones internas también siguen reglas de debido proceso: las infracciones al reglamento son graduales, se notifican y se puede presentar un descargo antes de cualquier sanción, y las votaciones dejan acta y registro de cada voto.',
  ]],
  ['¿Qué le corresponde hacer al barrio para cumplir del todo?', [
    'La app pone las herramientas técnicas. Hay obligaciones que son del barrio como responsable del archivo, y se dicen acá con transparencia:',
    '• Inscribir la base de datos en el Registro Nacional de Bases de Datos de la AAIP (art. 21). La ley condiciona la licitud del archivo a su inscripción (art. 3). Es un trámite en línea y gratuito. Estado hoy: {AAIP}.',
    '• Designar a quién se dirigen los pedidos de los titulares y responderlos en los plazos legales. Hoy: {ARCO}.',
    '• Pedir a quienes tienen acceso por su función (Administración, guardias) que suscriban un compromiso de confidencialidad (art. 10), y quitar el acceso a quien deja la función. Hoy: {CONF}.',
    '• Llevar un registro de incidentes de seguridad y avisar a los afectados si alguno ocurre, como recomienda la Resolución AAIP 47/2018.',
    '• Cargar en la app el estatuto y el reglamento interno vigentes.',
    '• Recomendación del autor: que un abogado del barrio revise los términos de uso y esta política antes de aprobarlos formalmente.',
  ]],
];
/* El plazo de borrado de las visitas es el de Ajustes: se completa al mostrar. */
const faqTexto = t => { const c = typeof cfgDatos === 'function' ? cfgDatos() : {};
  return esc(t).replace(/\{DIAS\}/g, String(Store.s.config.datosDias || 90))
    .replace(/\{AAIP\}/g, c.inscripta ? `inscripta${c.inscripcionFecha ? ' el ' + fechaCorta(c.inscripcionFecha) : ''}${c.inscripcionNro ? ', N.º ' + esc(c.inscripcionNro) : ''}` : 'en trámite')
    .replace(/\{ARCO\}/g, c.responsableArco ? esc(c.responsableArco) : 'la Administración del barrio')
    .replace(/\{CONF\}/g, c.compromisosFirmados ? 'firmados' : 'en preparación'); };
R.ayuda = {
  titulo: 'Preguntas frecuentes', icon: 'info', color: 'ok', sub: 'Cómo se hace cada cosa',
  render(){
    const item = (p, cuerpo) => `<details class="faq card"><summary><b>${esc(p)}</b>${I('right')}</summary>${cuerpo}</details>`;
    return `${FAQ.map(([p, r, a, v, b]) => item(p, `<p class="small" style="color:var(--ink-2);margin:10px 0 0;line-height:1.55">${faqTexto(r)}</p>
      ${a ? `<button class="btn btn-sm btn-sec" style="margin-top:10px" data-a="${a}" data-v="${v}">${esc(b)}${I('right')}</button>` : ''}`)).join('')}
      <div class="sec" id="faqDatos"><h2>${I('lock')} Tus datos: privacidad y seguridad</h2></div>
      ${FAQ_DATOS.map(([p, ps]) => item(p, ps.map(t => `<p class="small" style="color:var(--ink-2);margin:10px 0 0;line-height:1.6">${faqTexto(t)}</p>`).join(''))).join('')}
      <div class="btns" style="margin:4px 0 16px"><button class="btn btn-sm btn-sec" data-a="faq-datos-pdf">${I('download')}Descargar o imprimir esta sección</button>
        <button class="btn btn-sm btn-sec" data-a="abrir" data-v="legal">${I('file')}Términos de uso completos${I('right')}</button></div>
      <p class="muted small">¿No está lo que buscás? Escribile a la Administración desde Tu casa → Mensajes.</p>`;
  },
};
A['abrir-ayuda'] = () => { cerrarHoja(); abrir('ayuda'); };
A['faq-datos-pdf'] = () => imprimir('Tus datos: privacidad y seguridad', `<h1>Barrio ${esc(Store.s.config.nombre)}</h1>
  <p><b>Tus datos: privacidad y seguridad</b><br>Cómo cuida la app la información de los vecinos, y su fundamento jurídico · ${fechaLarga(hoyISO())}</p>
  ${FAQ_DATOS.map(([p, ps]) => `<h2>${esc(p)}</h2>${ps.map(t => `<p>${faqTexto(t)}</p>`).join('')}`).join('')}
  <p style="margin-top:24px"><small>Texto informativo. No reemplaza los términos de uso ni el asesoramiento de un abogado.</small></p>`);
