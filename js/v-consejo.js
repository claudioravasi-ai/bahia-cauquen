/* =========================================================
   EL CONSEJO INFORMA (pedido de Claudio, 03-11-2026: "hacé la idea 2, El
   Consejo informa; esta última va en Administración").
   Lo carga la Administración (Administración → Comunicación → "El Consejo
   informa") y lo leen los vecinos en El barrio → "El Consejo informa".

   QUÉ HAY
   · DECISIONES del Consejo: título, qué se decidió, fecha de la reunión y,
     si hay, el número de acta.
   · OBRAS Y COMPRAS del barrio: qué es, el presupuesto aprobado, la etapa
     (aprobada, en curso, terminada) y el avance en %. Cada vez que hay
     novedad, la Administración toca "Contar un avance" y queda la historia.
   · Al publicar (o contar un avance) les llega el aviso a los vecinos; si
     es una coma, se destilda "Avisarles".
   · Cada tarjeta tiene "Preguntar sobre esto": abre la conversación privada
     con la Administración con el tema ya escrito. Las preguntas no quedan
     a la vista de todos (no se arma un foro).

   DATOS
   · barrio/consejo/<id>: lo leen los vecinos aprobados y la Administración
     (no el hotel ni la supervisión); lo escribe solo la Administración (lo
     hacen cumplir las reglas). No lleva datos personales: lo que se
     publica es del barrio. Queda en la auditoría quién publicó y cambió.

   Ideas de Decidim (1,8k★, AGPL-3.0) y Consul Democracy (1,6k★,
   AGPL-3.0), plataformas de participación ciudadana: el seguimiento de
   "lo que se decidió y en qué quedó" con etapas y avance. Solo la idea;
   el código es propio.
   ========================================================= */
const CJ_ETAPAS = { aprobada:['Aprobada', 'accent'], encurso:['En curso', 'warn'], terminada:['Terminada', 'ok'] };
const Consejo = {
  todo: () => aLista(Store.s.consejo).filter(x => x && x.id && x.titulo),
  ultima: x => Math.max(x.at || 0, ...aLista(x.novedades).map(n => (n && n.at) || 0)),
  obras(){ return this.todo().filter(x => x.tipo === 'obra').sort((a, b) => this.ultima(b) - this.ultima(a)); },
  decisiones(){ return this.todo().filter(x => x.tipo !== 'obra').sort((a, b) => (b.fecha || '').localeCompare(a.fecha || '') || b.at - a.at); },
  /* Lo nuevo desde la última vez que el vecino abrió la ventana. */
  nuevas(){ const v = Store.sesion.consejoVisto || 0; return this.todo().filter(x => this.ultima(x) > v && x.por !== yo()?.id).length; },
};

function cjTarjeta(x, admin){
  const obra = x.tipo === 'obra', et = CJ_ETAPAS[x.etapa] || CJ_ETAPAS.aprobada, nov = aLista(x.novedades).filter(n => n && n.txt).sort((a, b) => b.at - a.at);
  const av = Math.max(0, Math.min(100, Number(x.avance) || 0));
  return `<div class="card cj-card" id="cj-${esc(x.id)}">
    <div class="cj-cab"><span class="ic ic-${obra ? 'wood' : 'accent'} cj-ic">${I(obra ? 'wrench' : 'vote')}</span>
      <div class="grow"><b>${esc(x.titulo)}</b><small>${x.fecha ? (obra ? 'Aprobada el ' : 'Reunión del ') + fechaLarga(x.fecha) : ''}${x.acta ? ` · Acta N.º ${esc(x.acta)}` : ''}</small></div>
      ${obra ? `<span class="pill p-${et[1]}">${et[0]}</span>` : ''}</div>
    ${obra ? `<div class="cj-avance" role="img" aria-label="Avance ${av} %"><div class="progreso"><i style="width:${av}%"></i></div><b>${av} %</b></div>` : ''}
    <p class="cj-txt">${esc(x.txt || '')}</p>
    ${obra && Number(x.monto) > 0 ? `<div class="cj-monto">${I('wallet')}Presupuesto aprobado: <b>${plata(Number(x.monto))}</b></div>` : ''}
    ${nov.length ? `<details class="plegable cj-nov"><summary><b>${plural(nov.length, 'avance', 'avances')}</b><span class="muted small">el último ${hace(nov[0].at)}</span></summary>
      <ol class="cj-linea">${nov.map(n => `<li><small>${fechaCorta(isoDe(new Date(n.at)))}${n.avance !== undefined && n.avance !== '' ? ` · ${Number(n.avance)} %` : ''}</small><span>${esc(n.txt)}</span></li>`).join('')}</ol></details>` : ''}
    <div class="btns" style="margin-top:10px">${admin
      ? `${obra ? `<button class="btn btn-sm btn-pri" data-a="consejo-avance" data-id="${esc(x.id)}">${I('plus')}Contar un avance</button>` : ''}
        <button class="btn btn-sm btn-sec" data-a="consejo-nuevo" data-id="${esc(x.id)}">${I('edit')}Editar</button>
        <button class="btn btn-sm btn-danger-soft" data-a="consejo-borrar" data-id="${esc(x.id)}">${I('trash')}Borrar</button>`
      : `<button class="btn btn-sm btn-sec" data-a="consejo-preguntar" data-id="${esc(x.id)}">${I('chat')}Preguntar sobre esto</button>`}</div>
    ${x.editado ? `<div class="muted tiny" style="margin-top:6px">${I('edit')} Actualizado ${hace(x.editado.at)}</div>` : ''}</div>`;
}

R.consejo = {
  titulo: 'El Consejo informa', icon: 'vote', color: 'accent', ancha: true,
  sub: () => esAdmin() ? 'Lo que ven los vecinos: decisiones, obras y compras' : 'Decisiones, obras y compras del barrio',
  render(){
    if (esHotel() || esSupervisor() || esGuardia()) return vacio('lock', 'Es para los vecinos y la Administración.');
    const admin = esAdmin();
    if (!admin){ Store.sesion.consejoVisto = Date.now(); Store.guardarSesion(); }
    const obras = Consejo.obras(), vivas = obras.filter(x => x.etapa !== 'terminada'), hechas = obras.filter(x => x.etapa === 'terminada');
    const dec = Consejo.decisiones();
    return `${admin ? `<div class="cj-acciones">${superficie({ a:'consejo-nuevo', v:'decision', icon:'vote', color:'accent', t:'Publicar una decisión', s:'Lo que resolvió el Consejo, con fecha y acta', cls:'acento' })}
        ${superficie({ a:'consejo-nuevo', v:'obra', icon:'wrench', color:'wood', t:'Cargar una obra o compra', s:'Presupuesto, etapa y avance' })}</div>`
        : `<p class="muted small" style="margin:0 2px 14px">${I('info')} Lo publica la Administración en nombre del Consejo. Si tenés una duda, tocá "Preguntar sobre esto": le llega solo a la Administración.</p>`}
      ${sec('Obras y compras en marcha')}${vivas.length ? vivas.map(x => cjTarjeta(x, admin)).join('') : vacio('wrench', 'No hay obras ni compras en marcha.')}
      ${sec('Decisiones del Consejo')}${dec.length ? dec.map(x => cjTarjeta(x, admin)).join('') : vacio('vote', 'Todavía no se publicó ninguna decisión.')}
      ${hechas.length ? `<details class="plegable" style="margin-top:14px"><summary><b>Terminadas</b><span class="muted small">${plural(hechas.length, 'obra o compra', 'obras o compras')}</span></summary>${hechas.map(x => cjTarjeta(x, admin)).join('')}</details>` : ''}
      ${admin ? `<p class="muted tiny" style="margin-top:12px">${I('lock')} Lo ven los vecinos aprobados (también el propietario a distancia). No lo ven el hotel ni la supervisión. Cada publicación y cada cambio quedan en la auditoría.</p>` : ''}`;
  },
};

/* ---------- la Administración publica y edita ---------- */
A['consejo-nuevo'] = el => {
  if (!esAdmin()) return;
  const d = el && el.dataset || {}, x = d.id ? Consejo.todo().find(z => z.id === d.id) : null;
  const tipo = x ? x.tipo : d.v === 'obra' ? 'obra' : 'decision', obra = tipo === 'obra', v = x || {};
  hoja(x ? 'Editar' : obra ? 'Cargar una obra o compra' : 'Publicar una decisión', `<form data-f="consejo" class="cj-form" data-id="${esc(v.id || '')}" data-t="${tipo}">
    <div class="field"><label>Título</label><input name="titulo" required maxlength="110" value="${esc(v.titulo || '')}" placeholder="${obra ? 'Ej: Recambio de luminarias en Los Salesianos' : 'Ej: Se aprobó el horario de obras de invierno'}"></div>
    <div class="field"><label>${obra ? 'Qué es y por qué' : 'Qué se decidió'}</label><textarea name="txt" required maxlength="1200" style="min-height:120px" placeholder="${obra ? 'Ej: Se cambian las 24 luminarias por LED. Baja el consumo y mejora la luz de la calle.' : 'Ej: De mayo a agosto las obras terminan a las 17 h por la poca luz.'}">${esc(v.txt || '')}</textarea></div>
    <div class="grid2"><div class="field"><label>${obra ? 'Aprobada el' : 'Fecha de la reunión'}</label><input type="date" name="fecha" required value="${esc(v.fecha || hoyISO())}"></div>
      <div class="field"><label>Acta N.º <span class="muted">(si hay)</span></label><input name="acta" maxlength="20" value="${esc(v.acta || '')}" placeholder="Ej: 112"></div></div>
    ${obra ? `<div class="grid3"><div class="field"><label>Presupuesto ($)</label><input type="number" name="monto" min="0" step="1" inputmode="numeric" value="${esc(v.monto || '')}" placeholder="Ej: 4500000"></div>
      <div class="field"><label>Etapa</label><select name="etapa">${Object.entries(CJ_ETAPAS).map(([k, e]) => `<option value="${k}" ${(v.etapa || 'aprobada') === k ? 'selected' : ''}>${e[0]}</option>`).join('')}</select></div>
      <div class="field"><label>Avance (%)</label><input type="number" name="avance" min="0" max="100" step="5" inputmode="numeric" value="${esc(v.avance ?? 0)}"></div></div>` : ''}
    <label class="check"><input type="checkbox" name="avisar" ${x ? '' : 'checked'}><span><b>Avisarles a los vecinos</b> (campanita y celular)${x ? ' · destildado: es un cambio chico' : ''}</span></label>
    <button class="btn btn-pri btn-block btn-grande" style="margin-top:14px" data-cj-boton data-listo="${esc(x ? 'Guardar los cambios' : obra ? 'Publicar la obra o compra' : 'Publicar la decisión')}" data-falta="Escribí el título y el texto" ${x ? '' : 'disabled'}>${I(x ? 'check' : 'send')}<span>${x ? 'Guardar los cambios' : 'Escribí el título y el texto'}</span></button>
    <p class="muted tiny" style="margin:10px 0 0">Lo ven todos los vecinos aprobados. Queda en la auditoría.</p></form>`, { ancho:'620px' });
};
F['consejo'] = (d, form) => {
  if (!esAdmin()) return;
  const id = form.dataset.id || uid(), tipo = form.dataset.t === 'obra' ? 'obra' : 'decision', obra = tipo === 'obra';
  const titulo = String(d.titulo || '').trim(), txt = String(d.txt || '').trim();
  if (!titulo || !txt) return toast('Faltan el título y el texto', 'alert');
  const datos = { titulo, txt, fecha:d.fecha || hoyISO(), acta:String(d.acta || '').trim() };
  if (obra) Object.assign(datos, { monto:Math.max(0, Math.round(Number(d.monto) || 0)), etapa:CJ_ETAPAS[d.etapa] ? d.etapa : 'aprobada', avance:Math.max(0, Math.min(100, Math.round(Number(d.avance) || 0))) });
  if (obra && datos.etapa === 'terminada') datos.avance = 100;
  const editar = !!form.dataset.id;
  Store.cambiar(s => {
    s.consejo = aLista(s.consejo);
    const x = s.consejo.find(z => z && z.id === id);
    if (x) Object.assign(x, datos, { editado:{ at:Date.now(), por:yo().id } });
    else s.consejo.unshift({ id, tipo, ...datos, novedades:[], at:Date.now(), por:yo().id });
    if (d.avisar) notificar(s, { para:'rol:vecino', titulo:`El Consejo informa: ${titulo}`, texto:txt.slice(0, 120), icon:obra ? 'wrench' : 'vote', color:'accent', link:'consejo' });
    auditar(s, editar ? 'Editó una publicación de El Consejo informa' : 'Publicó en El Consejo informa', `${obra ? 'Obra o compra' : 'Decisión'} · ${titulo}`);
  });
  cerrarHoja(); toast(editar ? 'Cambios guardados' : 'Publicado: ya lo ven los vecinos', 'check');
};
A['consejo-avance'] = el => {
  if (!esAdmin()) return;
  const x = Consejo.todo().find(z => z.id === el.dataset.id); if (!x) return;
  hoja(`Avance: ${esc(x.titulo)}`, `<form data-f="consejo-avance" class="cj-form" data-id="${esc(x.id)}">
    <div class="field"><label>Qué hay de nuevo</label><textarea name="txt" required maxlength="500" style="min-height:100px" placeholder="Ej: Ya se cambiaron 12 de las 24 luminarias."></textarea></div>
    <div class="grid2"><div class="field"><label>Avance (%)</label><input type="number" name="avance" min="0" max="100" step="5" inputmode="numeric" value="${esc(x.avance ?? 0)}"></div>
      <div class="field"><label>Etapa</label><select name="etapa">${Object.entries(CJ_ETAPAS).map(([k, e]) => `<option value="${k}" ${(x.etapa || 'aprobada') === k ? 'selected' : ''}>${e[0]}</option>`).join('')}</select></div></div>
    <label class="check"><input type="checkbox" name="avisar" checked><span><b>Avisarles a los vecinos</b> (campanita y celular)</span></label>
    <button class="btn btn-pri btn-block btn-grande" style="margin-top:14px" data-cj-boton data-listo="Guardar el avance" data-falta="Contá qué hay de nuevo" disabled>${I('check')}<span>Contá qué hay de nuevo</span></button></form>`, { ancho:'560px' });
};
F['consejo-avance'] = (d, form) => {
  if (!esAdmin()) return;
  const id = form.dataset.id, txt = String(d.txt || '').trim(); if (!txt) return toast('Contá qué hay de nuevo', 'alert');
  let titulo = '', av = 0;
  Store.cambiar(s => {
    const x = aLista(s.consejo).find(z => z && z.id === id); if (!x) return;
    x.etapa = CJ_ETAPAS[d.etapa] ? d.etapa : x.etapa || 'aprobada';
    x.avance = x.etapa === 'terminada' ? 100 : Math.max(0, Math.min(100, Math.round(Number(d.avance) || 0)));
    x.novedades = [...aLista(x.novedades), { at:Date.now(), txt, avance:x.avance, por:yo().id }].slice(-40);
    titulo = x.titulo; av = x.avance;
    if (d.avisar) notificar(s, { para:'rol:vecino', titulo:`${x.etapa === 'terminada' ? 'Terminada' : 'Avance ' + av + ' %'}: ${titulo}`, texto:txt.slice(0, 120), icon:'wrench', color:'accent', link:'consejo' });
    auditar(s, 'Contó un avance en El Consejo informa', `${titulo} · ${av} %`);
  });
  cerrarHoja(); toast('Avance guardado', 'check');
};
A['consejo-borrar'] = async el => {
  if (!esAdmin()) return;
  const x = Consejo.todo().find(z => z.id === el.dataset.id); if (!x) return;
  if (!await confirmar('Borrar la publicación', `"${esc(x.titulo)}" deja de verse para los vecinos. No se puede deshacer.`, { si:'Borrar', peligro:true })) return;
  Store.cambiar(s => { s.consejo = aLista(s.consejo).filter(z => z && z.id !== x.id); auditar(s, 'Borró una publicación de El Consejo informa', x.titulo); });
  toast('Publicación borrada', 'check');
};
/* El botón se prende recién cuando están los campos obligatorios, y mientras tanto dice qué falta. */
['input', 'change'].forEach(ev => document.addEventListener(ev, e => {
  const f = e.target && e.target.closest && e.target.closest('.cj-form'); if (!f) return;
  const b = f.querySelector('[data-cj-boton]'); if (!b) return;
  const listo = [...f.querySelectorAll('[required]')].every(c => String(c.value || '').trim());
  b.disabled = !listo; const s = b.querySelector('span'); if (s) s.textContent = listo ? b.dataset.listo : b.dataset.falta;
}));
/* El vecino pregunta: la conversación privada con la Administración, con el tema ya escrito. */
A['consejo-preguntar'] = el => {
  const x = Consejo.todo().find(z => z.id === el.dataset.id); if (!x) return;
  abrir('privado', 'admin');
  setTimeout(() => { const t = $('#privIn'); if (t && !t.value.trim()){ t.value = `Consulta sobre «${x.titulo}»: `; t.focus(); try { t.setSelectionRange(t.value.length, t.value.length); } catch(e){} } }, 250);
};
