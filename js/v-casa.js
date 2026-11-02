/* =========================================================
   LA CASA Y LO QUE SE COMPARTE (pedido de Claudio, 27-09-2026)
   -------------------------------------------------------
   1. COSAS PARA PRESTAR (idea de Peerby, Países Bajos): la escalera,
      la hidrolavadora, las cadenas, el generador… que cada vecino
      ofrece prestar. Se pide por mensaje privado al dueño; el dueño
      marca "La presté" y "Me la devolvieron". Vive en barrio/cosas: la
      ven los vecinos aprobados y cada cosa la edita solo su dueño.
   2. TU CASA EN INVIERNO: los cuidados de la casa antes y durante el
      invierno fueguino (gas, detector de monóxido, chimenea, caldera,
      rejillas, canaletas, caños, techo, matafuego…), con la fecha en que
      se hizo cada uno. Es del LOTE: lo ven todas las cuentas del lote y
      nadie más (pv/casaTareas/<cuenta>/…, como los paquetes). Cuando
      algo toca, aparece en "Para vos" de la pizarra.
   ========================================================= */
const CATS_COSAS = {
  herramientas:{ n:'Herramientas',        icon:'wrench' },
  jardin:      { n:'Jardín',              icon:'tree' },
  nieve:       { n:'Nieve e invierno',    icon:'snow' },
  auto:        { n:'Auto',                icon:'car' },
  casa:        { n:'Casa y eventos',      icon:'sofa' },
  deporte:     { n:'Camping y deporte',   icon:'sun' },
  otros:       { n:'Otros',               icon:'box' },
};
/* Lo que más se presta entre vecinos: se suma con un toque. */
const COSAS_SUGERIDAS = [
  ['Escalera extensible', 'herramientas'], ['Hidrolavadora', 'herramientas'], ['Taladro percutor', 'herramientas'], ['Amoladora', 'herramientas'],
  ['Cadenas para nieve', 'nieve'], ['Pala para nieve', 'nieve'], ['Generador eléctrico', 'casa'], ['Soplador de hojas', 'jardin'],
  ['Cortadora de césped', 'jardin'], ['Bordeadora', 'jardin'], ['Carretilla', 'jardin'], ['Motosierra', 'jardin'],
  ['Cables puente para batería', 'auto'], ['Arrancador de batería', 'auto'], ['Gato hidráulico', 'auto'], ['Portaequipajes de techo', 'auto'],
  ['Mesa plegable y sillas', 'casa'], ['Parlante', 'casa'], ['Proyector', 'casa'], ['Carpa', 'deporte'], ['Bolsa de dormir', 'deporte'],
];
const cosasDe = () => aLista(Store.s.cosas).filter(x => x && x.id);
const cosaMia = x => x && x.userId === yo()?.id;
function estadoCosa(x){
  if (x.estado === 'prestada' && x.prestada) return { t:`Prestada${x.prestada.hasta ? ' hasta el ' + fechaCorta(x.prestada.hasta) : ''}`, cls:'p-warn' };
  if (x.estado === 'pausa') return { t:'No disponible ahora', cls:'' };
  return { t:'Disponible', cls:'p-ok' };
}
R.cosas = {
  titulo:'Cosas para prestar', icon:'box', color:'wood', sub:'Escalera, hidrolavadora, generador… entre vecinos',
  render(p){
    const u = yo(), cat = CATS_COSAS[p] ? p : '', todas = cosasDe();
    const mias = todas.filter(cosaMia), otras = todas.filter(x => !cosaMia(x) && (!cat || x.cat === cat))
      .sort((a, b) => (a.estado === 'disponible' ? 0 : 1) - (b.estado === 'disponible' ? 0 : 1) || String(a.nombre).localeCompare(String(b.nombre)));
    const n = k => todas.filter(x => !cosaMia(x) && x.cat === k).length;
    const fila = x => { const c = CATS_COSAS[x.cat] || CATS_COSAS.otros, e = estadoCosa(x), mia = cosaMia(x);
      return `<div class="it">${I(c.icon)}<div class="txt"><b>${esc(x.nombre)}</b>
          <span>${mia ? 'Tuya' : `${esc(primerNombre(nombreDe(x.userId)))} · ${esc(x.casa || '')}`}${x.detalle ? ' · ' + esc(x.detalle) : ''}</span>
          ${x.condiciones ? `<span>${I('info')} ${esc(x.condiciones)}</span>` : ''}</div>
        <div class="cosa-acc"><span class="pill ${e.cls}">${esc(e.t)}</span>
          ${mia ? `<button class="btn btn-xs btn-sec" data-a="cosa-menu" data-id="${esc(x.id)}">${I('more')}</button>`
            : x.estado === 'disponible' ? `<button class="btn btn-xs btn-pri" data-a="cosa-pedir" data-id="${esc(x.id)}">Pedirla</button>` : ''}</div></div>`; };
    return `<p class="muted small" style="margin:0 0 12px">Una idea de los Países Bajos: en vez de que cada casa compre una hidrolavadora que usa dos veces por año, los vecinos se las prestan. Pedís por mensaje privado y el dueño decide.</p>
      <button class="btn btn-pri btn-block" data-a="cosa-nueva">${I('plus')}Sumar algo para prestar</button>
      ${mias.length ? `${sec('Lo que vos prestás')}<div class="card lista">${mias.map(fila).join('')}</div>` : ''}
      ${sec('Lo que prestan los vecinos')}
      <div class="chips"><button class="chip ${!cat ? 'on' : ''}" data-a="abrir" data-v="cosas" data-p="">Todas <span class="n">${todas.filter(x => !cosaMia(x)).length}</span></button>
        ${Object.entries(CATS_COSAS).filter(([k]) => n(k)).map(([k, c]) => `<button class="chip ${cat === k ? 'on' : ''}" data-a="abrir" data-v="cosas" data-p="${k}">${I(c.icon)}${esc(c.n)} <span class="n">${n(k)}</span></button>`).join('')}</div>
      ${otras.length ? `<div class="card lista">${otras.map(fila).join('')}</div>` : vacio('box', cat ? 'Nada en esta categoría todavía.' : 'Todavía nadie sumó nada. ¡Empezá vos!')}
      <p class="muted tiny" style="margin-top:12px">${I('info')} El préstamo es un acuerdo entre vecinos: la app solo los pone en contacto. Devolvé las cosas limpias y a tiempo; si algo se rompe, se arregla entre ustedes.</p>`;
  },
};
A['cosa-nueva'] = el => {
  const x = el && el.dataset.id ? cosasDe().find(c => c.id === el.dataset.id && cosaMia(c)) : null;
  hoja(x ? 'Editar' : 'Sumar algo para prestar', `<form data-f="cosa" data-id="${esc(x?.id || '')}">
    ${x ? '' : `<div class="lbl">Lo más común (tocá para completar)</div><div class="cosa-sug">${COSAS_SUGERIDAS.map(([n, c]) => `<button type="button" class="chip" data-a="cosa-sug" data-v="${esc(n)}" data-p="${c}">${esc(n)}</button>`).join('')}</div>`}
    <div class="field"><label>Qué es</label><input name="nombre" id="cosaNombre" required maxlength="50" value="${esc(x?.nombre || '')}" placeholder="Ej: Escalera extensible de 7 m"></div>
    <div class="field"><label>Categoría</label><select name="cat" id="cosaCat">${Object.entries(CATS_COSAS).map(([k, c]) => `<option value="${k}" ${(x?.cat || 'herramientas') === k ? 'selected' : ''}>${esc(c.n)}</option>`).join('')}</select></div>
    <div class="field"><label>Detalle (opcional)</label><input name="detalle" maxlength="80" value="${esc(x?.detalle || '')}" placeholder="Marca, medida, qué incluye"></div>
    <div class="field"><label>Condiciones (opcional)</label><input name="condiciones" maxlength="100" value="${esc(x?.condiciones || '')}" placeholder="Ej: hasta 3 días · con nafta la devolvés"></div>
    <button class="btn btn-pri btn-block">${I('check')}${x ? 'Guardar' : 'Publicarla'}</button></form>`);
};
A['cosa-sug'] = el => { const n = $('#cosaNombre'), c = $('#cosaCat'); if (n) n.value = el.dataset.v; if (c) c.value = el.dataset.p; };
F['cosa'] = (d, form) => {
  const u = yo(), id = form.dataset.id;
  const datos = { nombre:String(d.nombre || '').trim().slice(0, 50), cat:CATS_COSAS[d.cat] ? d.cat : 'otros', detalle:String(d.detalle || '').trim().slice(0, 80), condiciones:String(d.condiciones || '').trim().slice(0, 100) };
  if (!datos.nombre) return;
  Store.cambiar(s => {
    const x = id && s.cosas.find(c => c.id === id && c.userId === u.id);
    if (x) Object.assign(x, datos, { at:Date.now() });
    else s.cosas.unshift({ id:'c' + uid(), userId:u.id, casa:u.casa || '', ...datos, estado:'disponible', prestamos:0, createdAt:Date.now(), at:Date.now() });
  });
  cerrarHoja(); toast(id ? 'Guardado' : '¡Gracias! Ya la ven los vecinos', 'box');
};
A['cosa-menu'] = el => {
  const x = cosasDe().find(c => c.id === el.dataset.id); if (!x || !cosaMia(x)) return;
  hoja(x.nombre, `<div class="stack">
    ${x.estado === 'prestada' ? `<button class="btn btn-ok btn-block" data-a="cosa-devuelta" data-id="${esc(x.id)}">${I('check')}Me la devolvieron</button>`
      : `<button class="btn btn-pri btn-block" data-a="cosa-prestar" data-id="${esc(x.id)}">${I('send')}La presté</button>`}
    ${x.estado === 'pausa' ? `<button class="btn btn-sec btn-block" data-a="cosa-estado" data-id="${esc(x.id)}" data-v="disponible">Está disponible otra vez</button>`
      : x.estado !== 'prestada' ? `<button class="btn btn-sec btn-block" data-a="cosa-estado" data-id="${esc(x.id)}" data-v="pausa">No la presto por ahora</button>` : ''}
    <button class="btn btn-sec btn-block" data-a="cosa-nueva" data-id="${esc(x.id)}">${I('edit')}Editar</button>
    <button class="btn btn-danger-soft btn-block" data-a="cosa-borrar" data-id="${esc(x.id)}">${I('trash')}Borrarla</button>
    ${x.prestamos ? `<p class="muted small" style="margin:6px 0 0">La prestaste ${plural(x.prestamos, 'vez', 'veces')}.</p>` : ''}</div>`);
};
A['cosa-prestar'] = el => {
  const x = cosasDe().find(c => c.id === el.dataset.id); if (!x) return;
  /* Los que le escribieron por mensaje privado van primero en la lista. */
  const hilos = aLista(Store.s.dms).filter(h => h && (h.a === yo().id || h.b === yo().id)).sort((a, b) => (aLista(b.msgs).at(-1)?.at || 0) - (aLista(a.msgs).at(-1)?.at || 0));
  const lotes = [...new Set([...hilos.map(h => usuario(h.a === yo().id ? h.b : h.a)?.casa).filter(Boolean), ...candidatosCuidado().map(v => v.casa)])];
  hoja('La presté', `<form data-f="cosa-prestar" data-id="${esc(x.id)}">
    <div class="field"><label>A quién</label><select name="casa" required><option value="">Elegí el lote…</option>${lotes.map(c => `<option>${esc(c)}</option>`).join('')}</select></div>
    <div class="field"><label>Hasta (opcional)</label><input type="date" name="hasta" min="${hoyISO()}" value="${sumarDias(hoyISO(), 3)}"></div>
    <p class="muted small" style="margin:0 0 12px">Los vecinos ven "Prestada hasta…", no a quién. El día siguiente a esa fecha te recordamos preguntar por ella.</p>
    <button class="btn btn-pri btn-block">${I('check')}Listo</button></form>`);
};
F['cosa-prestar'] = (d, form) => {
  Store.cambiar(s => { const x = s.cosas.find(c => c.id === form.dataset.id && c.userId === yo().id); if (!x) return;
    x.estado = 'prestada'; x.prestada = { casa:String(d.casa || ''), hasta:d.hasta || '', at:Date.now() }; x.at = Date.now(); });
  cerrarHoja(); toast('Anotado', 'send');
};
A['cosa-devuelta'] = el => {
  Store.cambiar(s => { const x = s.cosas.find(c => c.id === el.dataset.id && c.userId === yo().id); if (!x) return;
    x.estado = 'disponible'; x.prestada = null; x.prestamos = (x.prestamos || 0) + 1; x.at = Date.now(); });
  cerrarHoja(); toast('¡Qué bueno! Vuelve a estar disponible', 'check');
};
A['cosa-estado'] = el => {
  Store.cambiar(s => { const x = s.cosas.find(c => c.id === el.dataset.id && c.userId === yo().id); if (x){ x.estado = el.dataset.v === 'pausa' ? 'pausa' : 'disponible'; x.at = Date.now(); } });
  cerrarHoja();
};
A['cosa-borrar'] = async el => {
  if (!await confirmar('Borrarla', 'Deja de aparecer en la lista del barrio.', { si:'Borrar', peligro:true })) return;
  Store.cambiar(s => { s.cosas = s.cosas.filter(c => !(c.id === el.dataset.id && c.userId === yo().id)); });
};
/* Pedirla = un mensaje privado al dueño (el mismo de "Mensajes"), con
   las fechas. Nadie más ve el pedido. */
A['cosa-pedir'] = el => {
  const x = cosasDe().find(c => c.id === el.dataset.id); if (!x) return;
  const duenio = usuario(x.userId); if (!duenio){ toast('El dueño ya no está en la app', 'alert'); return; }
  const hoy = hoyISO();
  hoja(`Pedir: ${x.nombre}`, `<form data-f="cosa-pedir" data-id="${esc(x.id)}">
    <div class="grid2"><div class="field"><label>Desde</label><input type="date" name="desde" required min="${hoy}" value="${hoy}"></div>
      <div class="field"><label>Hasta</label><input type="date" name="hasta" required min="${hoy}" value="${sumarDias(hoy, 2)}"></div></div>
    <div class="field"><label>Mensaje para ${esc(primerNombre(duenio.nombre))}</label><textarea name="texto" rows="3" maxlength="400">Hola ${esc(primerNombre(duenio.nombre))}, ¿me prestarías ${esc(x.nombre.toLowerCase())}? La cuido y la devuelvo limpia.</textarea></div>
    ${x.condiciones ? `<p class="muted small" style="margin:0 0 12px">${I('info')} ${esc(x.condiciones)}</p>` : ''}
    <button class="btn btn-pri btn-block">${I('send')}Mandar el pedido</button></form>`);
};
F['cosa-pedir'] = (d, form) => {
  const u = yo(), x = cosasDe().find(c => c.id === form.dataset.id); if (!x) return;
  if (d.hasta < d.desde){ toast('La fecha "hasta" tiene que ser igual o posterior a "desde"', 'alert'); return; }
  const para = x.userId, texto = `📦 Pedido: ${x.nombre} · del ${fechaCorta(d.desde)} al ${fechaCorta(d.hasta)}\n${String(d.texto || '').trim()}`.slice(0, 800);
  Store.cambiar(s => {
    let h = s.dms.find(z => (z.a === u.id && z.b === para) || (z.a === para && z.b === u.id));
    if (!h){ h = { id:uid(), a:u.id, b:para, msgs:[] }; s.dms.push(h); }
    listaDe(h, 'msgs').push({ id:uid(), de:u.id, text:texto, at:Date.now() });
    notificar(s, { para, titulo:`${primerNombre(u.nombre)} (${u.casa || ''}) te pide: ${x.nombre}`, texto:`Del ${fechaCorta(d.desde)} al ${fechaCorta(d.hasta)}`, icon:'box', color:'accent', link:'dm:' + u.id, sonido:true });
  });
  cerrarHoja(); toast('Listo: le llegó tu pedido por mensaje privado', 'send'); abrir('dm', para);
};

/* =========================================================
   TU CASA EN INVIERNO
   `cada`: cada cuántos meses se hace. `meses`: cuándo conviene (el
   recordatorio aparece desde el primero de esos meses hasta agosto).
   ========================================================= */
const TAREAS_INVIERNO = [
  { id:'co', t:'Pilas del detector de monóxido de carbono', icon:'alert', cada:6, meses:[4, 10],
    por:'El monóxido no tiene olor ni color, y en invierno es la intoxicación más común de la Patagonia.',
    como:'Cambiá las pilas y apretá el botón de prueba. Si no tenés detector, conseguí uno (uno por piso, cerca de los dormitorios). El aparato se cambia cada 5 a 7 años.' },
  { id:'gas', t:'Revisión de la instalación de gas', icon:'flame', cada:12, meses:[3, 4, 5],
    por:'Una pérdida o un artefacto mal regulado puede generar monóxido de carbono.',
    como:'Con un gasista matriculado: artefactos, conexiones, llaves de paso y ventilaciones. Llama azul: bien; amarilla o anaranjada: a revisar.' },
  { id:'rejillas', t:'Rejillas de ventilación destapadas', icon:'wind', cada:12, meses:[5, 6],
    por:'Taparlas por el frío es la causa más común de intoxicación con monóxido.',
    como:'Revisá que ninguna rejilla esté tapada con cinta, muebles o cortinas. Nunca se tapan, ni en la peor helada.' },
  { id:'chimenea', t:'Limpieza de la chimenea o salamandra', icon:'flame', cada:12, meses:[3, 4, 5],
    por:'El hollín acumulado puede prenderse fuego o tapar el tiraje y meter humo y monóxido en la casa.',
    como:'Deshollinado una vez por año, antes de empezar a usarla. Revisá el sombrerete y que no haya nidos.' },
  { id:'caldera', t:'Service de la caldera y los calefactores', icon:'thermo', cada:12, meses:[3, 4, 5],
    por:'Una caldera sin mantenimiento consume más y puede fallar en pleno invierno.',
    como:'Con un técnico o gasista matriculado; que revise también el tiro balanceado de los calefactores.' },
  { id:'canaletas', t:'Canaletas y bajadas limpias', icon:'drop', cada:12, meses:[4, 5],
    por:'Si están tapadas con hojas, el agua se congela y rompe canaletas y techo.',
    como:'Limpialas después de la caída de las hojas y antes de la primera nevada.' },
  { id:'canillas', t:'Canillas y caños de afuera protegidos', icon:'drop', cada:12, meses:[5, 6],
    por:'El agua congelada rompe caños y canillas.',
    como:'Cerrá y vaciá las canillas exteriores, aislá los caños expuestos y, en heladas fuertes, dejá correr un hilo de agua.' },
  { id:'techo', t:'Techo, aleros y ramas', icon:'home', cada:12, meses:[4, 5],
    por:'Una nevada grande pesa mucho, y el hielo que cuelga del alero puede caer.',
    como:'Revisá chapas, tejas y aleros, y cortá las ramas que toquen el techo.' },
  { id:'nieve', t:'Pala, sal gruesa o arena', icon:'snow', cada:12, meses:[5],
    por:'La entrada y los escalones con hielo son la primera causa de caídas en invierno.',
    como:'Tené una pala a mano y sal gruesa o arena para las subidas. Si no podés palear, anotate en Ángeles de la nieve.' },
  { id:'matafuego', t:'Carga del matafuego', icon:'flame', cada:12, meses:[4, 5],
    por:'En invierno se usan más estufas, hogares y velas.',
    como:'Mirá la tarjeta de vencimiento y que la aguja esté en verde. Uno cerca de la cocina y otro del hogar.' },
  { id:'luz', t:'Linterna, pilas y plan para los cortes de luz', icon:'lamp', cada:12, meses:[5, 6],
    por:'Con viento y nieve puede haber cortes largos.',
    como:'Linternas con pilas y cargador portátil. Si tenés generador, probalo: siempre al aire libre, nunca en el garaje ni cerca de ventanas.' },
  { id:'auto', t:'Cubiertas de invierno o cadenas', icon:'car', cada:12, meses:[4, 5],
    por:'Hielo y nieve en las calles del barrio y en la ruta.',
    como:'Cubiertas con clavos o de invierno, o cadenas en el baúl; anticongelante y líquido limpiaparabrisas para frío.' },
  { id:'lena', t:'Leña seca y bajo techo', icon:'tree', cada:12, meses:[3, 4],
    por:'La leña húmeda hace más humo, más hollín y menos calor.',
    como:'Comprala con tiempo y guardala tapada y ventilada.' },
];
const idTarea = (lote, t) => `ct-${String(lote).replace(/\D/g, '') || 'x'}-${t}`;
const registroTarea = (t, lote = yo()?.casa) => aLista(Store.s.casaTareas).find(x => x && x.id === idTarea(lote, t.id)) || null;
/* ¿Es época? Desde el primer mes recomendado (de marzo en adelante) hasta
   agosto; y además cualquier mes que figure en la lista (octubre, las
   pilas del detector). */
function enEpoca(t, mes = new Date().getMonth() + 1){
  if (t.meses.includes(mes)) return true;
  const inv = t.meses.filter(m => m >= 3 && m <= 8);
  return !!inv.length && mes >= Math.min(...inv) && mes <= 8;
}
function estadoTarea(t, x){
  const ahora = Date.now();
  /* Los que se repiten cada tantos días (el pasto, la vereda): tocan de
     nuevo un día antes de cumplirse el plazo. */
  if (t.dias){ if (x && x.hecho && x.hecho + (t.dias - 1) * DIA > ahora) return { toca:false, prox:x.hecho + t.dias * DIA, hecho:x.hecho };
    return { toca:true, hecho:x && x.hecho, pospuesto: x && x.pospuesto > ahora ? x.pospuesto : 0 }; }
  if (x && x.hecho){ const prox = new Date(x.hecho); prox.setMonth(prox.getMonth() + t.cada);
    if (prox.getTime() - 20 * DIA > ahora) return { toca:false, prox:prox.getTime(), hecho:x.hecho }; }
  return { toca:true, hecho:x && x.hecho, pospuesto: x && x.pospuesto > ahora ? x.pospuesto : 0 };
}
const tareasQueTocan = () => { if (!tengoLote()) return [];
  return TAREAS_INVIERNO.filter(t => { const e = estadoTarea(t, registroTarea(t)); return e.toca && !e.pospuesto && enEpoca(t); }); };
R.invierno = {
  titulo:'Tu casa en invierno', icon:'flame', color:'warn', sub:'Gas, monóxido, chimenea, caños y nieve',
  render(){
    if (!tengoLote()) return vacio('home', 'Esta sección es para los vecinos con lote.');
    const u = yo(), tocan = new Set(tareasQueTocan().map(t => t.id));
    const orden = [...TAREAS_INVIERNO].sort((a, b) => tocan.has(b.id) - tocan.has(a.id));
    return `<p class="muted small" style="margin:0 0 12px">Lo que conviene revisar antes y durante el invierno fueguino. Anotá cuándo lo hiciste y la app te lo recuerda cuando vuelva a tocar. Lo ven solo las cuentas de ${esc(u.casa)}.</p>
      ${tocan.size ? aviso('warn', 'flame', `${plural(tocan.size, 'cosa para revisar', 'cosas para revisar')} esta temporada`, 'Empezá por el detector de monóxido y el gas.') : aviso('ok', 'check', 'Todo al día por ahora', 'Te avisamos cuando vuelva a tocar algo.')}
      ${orden.map(t => { const x = registroTarea(t), e = estadoTarea(t, x), toca = tocan.has(t.id);
        return `<details class="card eb-guia tarea${toca ? ' toca' : ''}"><summary>${I(t.icon)}<b>${esc(t.t)}</b>
            <span class="pill ${e.toca ? (toca ? 'p-warn' : '') : 'p-ok'}">${!e.toca ? `Hecho ${fechaCorta(isoDe(new Date(e.hecho)))}` : e.pospuesto ? `Te lo recuerdo el ${fechaCorta(isoDe(new Date(e.pospuesto)))}` : toca ? 'Toca ahora' : e.hecho ? `Última: ${fechaCorta(isoDe(new Date(e.hecho)))}` : 'Sin anotar'}</span></summary>
          <p><b>Por qué:</b> ${esc(t.por)}</p><p><b>Cómo:</b> ${esc(t.como)}</p>
          <p class="muted small">Se hace ${t.cada === 6 ? 'cada 6 meses' : 'una vez por año'}${!e.toca ? ` · la próxima, en ${MESES[new Date(e.prox).getMonth()]} ${new Date(e.prox).getFullYear()}` : ''}.${x && x.por && x.hecho ? ` Lo anotó ${esc(primerNombre(nombreDe(x.por)))}.` : ''}</p>
          <div class="btns"><button class="btn btn-sm btn-ok" data-a="tarea-hecha" data-v="${t.id}">${I('check')}Lo hice${e.toca ? '' : ' otra vez'}</button>
            ${e.toca && !e.pospuesto ? `<button class="btn btn-sm btn-sec" data-a="tarea-despues" data-v="${t.id}">Recordame en una semana</button>` : ''}
            ${x && x.hecho ? `<button class="btn btn-sm btn-sec" data-a="tarea-deshacer" data-v="${t.id}">Deshacer</button>` : ''}</div></details>`; }).join('')}
      <p class="muted tiny">Consejos generales. Ante olor a gas: no prendas ni apagues luces, abrí puertas y ventanas, cerrá la llave de paso y llamá a la distribuidora desde afuera. Dolor de cabeza, mareos o náuseas de varios en la casa: salgan al aire libre y llamen al 107.</p>`;
  },
};
function cambiarTarea(tid, fn){
  const u = yo(), lote = u.casa, id = idTarea(lote, tid);
  Store.cambiar(s => { let x = s.casaTareas.find(z => z.id === id);
    if (!x){ x = { id, lote, tarea:tid }; s.casaTareas.push(x); }
    fn(x); x.at = Date.now(); x.por = u.id; });
  refrescar();
}
A['tarea-hecha'] = el => { cambiarTarea(el.dataset.v, x => { x.hecho = Date.now(); x.pospuesto = 0; }); toast('Anotado', 'check'); };
A['tarea-despues'] = el => { cambiarTarea(el.dataset.v, x => { x.pospuesto = Date.now() + 7 * DIA; }); toast('Te lo recordamos en una semana', 'clock'); };
A['tarea-deshacer'] = el => { cambiarTarea(el.dataset.v, x => { x.hecho = 0; }); };

/* =========================================================
   TU CASA EN VERANO (pedido de Claudio, 28-09-2026)
   La otra mitad del año, pensada para un barrio privado en Ushuaia: pasto
   y vereda, el cesto con tapa (perros, zorros y aves rompen las bolsas),
   las bolsas recién la mañana del camión, nada suelto con el viento
   fueguino, el fuego con cuidado (bosque seco), el sol con el agujero de
   ozono, las mascotas dentro del lote, la leña del invierno que viene,
   los arreglos de afuera, el riego y las vacaciones.
   Tres clases de cosas:
     · `dias`: se repite cada tantos días en temporada (pasto, vereda);
     · `cada`: una vez por año, en los meses que convienen (poda, leña…);
     · sin ninguno de los dos: un hábito de todo el verano (sin anotar).
   Como el invierno, es del LOTE (pv/casaTareas): lo ven y lo marcan todas
   las cuentas del lote y nadie más.
   ========================================================= */
const MESES_VERANO = [11, 12, 1, 2, 3];
const TAREAS_VERANO = [
  { id:'ver-pasto', t:'Pasto corto y frente prolijo', icon:'tree', dias:15, meses:MESES_VERANO,
    por:'El pasto alto junta humedad y roedores, hace que la casa parezca sola y, en un verano seco, es lo primero que se prende.',
    como:'Cortalo cada 10 a 15 días en temporada, en un horario razonable (respetá el horario de descanso del reglamento), y juntá lo cortado: no va a la vereda ni a la calle. Los restos de poda, embolsados, para el día de voluminosos.' },
  { id:'ver-vereda', t:'Vereda y cordón limpios', icon:'home', dias:7, meses:MESES_VERANO,
    por:'Hojas, ramas y la tierra que trae el viento tapan los desagües y hacen resbalar; la vereda es de los que caminan, andan en bici o empujan un cochecito.',
    como:'Barrela una vez por semana, destapá la rejilla o el desagüe del frente y no dejes autos, leña ni materiales de obra sobre la vereda.' },
  { id:'ver-cesto', t:'Cesto de residuos alto y con tapa', icon:'tacho', cada:12, meses:[10, 11],
    por:'Perros sueltos, zorros y aves (gaviotas, caranchos) rompen las bolsas y desparraman la basura por el barrio. En verano, además, hay más olor y moscas.',
    como:'Un cesto elevado del piso, con tapa que cierre y trabe (el viento la abre). Si está roto o sin tapa, arreglalo antes del verano.' },
  { id:'ver-bolsas', t:'Las bolsas, recién la mañana que pasa el camión', icon:'truck',
    por:'Una bolsa que pasa la noche afuera termina rota por los perros, los zorros o las aves.',
    como:'Sacalas temprano el día que pasa el camión (lo ves en El barrio → Residuos; la app te avisa la víspera), nunca la noche anterior, y bien cerradas.', ir:['abrir', 'recoleccion', 'Días del camión'] },
  { id:'ver-viento', t:'Nada suelto con el viento', icon:'wind',
    por:'En Ushuaia las ráfagas pasan los 80 km/h: una cama elástica, una reposera, una sombrilla, una chapa o el nylon del invernadero pueden volar y romper la casa de un vecino o lastimar a alguien.',
    como:'Anclá la cama elástica al piso; guardá reposeras, sombrillas, juguetes y tachos vacíos; asegurá el invernadero, el cerco y las tapas. Si anuncian viento fuerte (sale en la pizarra), repasá el patio antes de irte.' },
  { id:'ver-fuego', t:'Asado sí, fuego descuidado no', icon:'flame',
    por:'En verano el bosque de lengas y ñires y el pasto están secos, y el viento lleva las chispas lejos. La mayoría de los incendios forestales empiezan por un fuego mal apagado.',
    como:'Solo en parrilla o fogonero, lejos de cercos, leñeros y árboles, con un balde de agua o la manguera a mano. Las brasas se apagan con agua hasta que no humeen. No quemes pasto, hojas ni ramas. Si hay alerta de incendio, nada de fuego al aire libre. Humo o fuego en el bosque: 100 (bomberos) y avisá a la garita.' },
  { id:'ver-sol', t:'Sol: protector aunque esté fresco', icon:'sun',
    por:'En primavera el agujero de ozono puede pasar sobre Ushuaia y el índice ultravioleta llega a muy alto aun con frío o nublado; en verano, además, hay luz casi todo el día.',
    como:'Protector solar, anteojos y gorro para chicos y grandes, también para trabajar en el jardín y en las salidas al agua o a la montaña.' },
  { id:'ver-mascotas', t:'Mascotas dentro del lote', icon:'paw',
    por:'Los perros sueltos rompen bolsas, persiguen la fauna y asustan a los chicos y a los que salen a caminar o en bici.',
    como:'Que no salgan solos del lote; a pasear, con correa, y juntá lo que dejan en la vereda. En la chapita del collar, tu teléfono.' },
  { id:'ver-agua', t:'Riego con cabeza', icon:'drop',
    por:'Los días de calor sube mucho el consumo de agua y puede bajar la presión en todo el barrio.',
    como:'Regá temprano o al atardecer, nunca al mediodía, y no dejes la manguera corriendo.' },
  { id:'ver-poda', t:'Ramas y cerco vivo', icon:'tree', cada:12, meses:[11, 12],
    por:'Las ramas que tocan cables o el techo son un riesgo con el viento y, en invierno, con el peso de la nieve; las que invaden la vereda molestan al que camina.',
    como:'Podá lo que toca el techo o invade la vereda. Si toca los cables de luz, no lo hagas vos: llamá a la distribuidora o a un profesional.' },
  { id:'ver-lena', t:'Leña para el invierno que viene', icon:'tree', cada:12, meses:[12, 1, 2],
    por:'La leña necesita meses para secarse: la que se compra en verano llega seca al invierno, calienta más y hace menos humo y hollín.',
    como:'Comprala ahora y estibala tapada arriba, ventilada a los costados y lejos de la casa y de la parrilla.' },
  { id:'ver-afuera', t:'Pintura, techo y arreglos de afuera', icon:'wrench', cada:12, meses:[12, 1, 2],
    por:'El verano es la época buena para trabajar afuera: después vienen la lluvia del otoño y la nieve.',
    como:'Pintura, sellado de ventanas, chapas, canaletas y cerco. Si hay obra, cargala en El barrio → Obras y respetá los horarios del reglamento.', ir:['abrir', 'obras', 'Obras'] },
  { id:'ver-viaje', t:'Si te vas de vacaciones', icon:'lock',
    por:'Una casa con el pasto alto, folletos en la puerta y la basura sin sacar se ve sola de lejos.',
    como:'Avisá con "Me voy de viaje": la garita o el policía la revisa cada día y te avisa que está en orden. Pedile a alguien que corte el pasto y saque la basura, y que no se junten paquetes ni folletos en la puerta.', ir:['modo-viaje', '', 'Me voy de viaje'] },
  { id:'ver-salidas', t:'Kayak, trekking o navegación', icon:'pin',
    por:'El agua del Canal está fría todo el año y en la montaña el tiempo cambia en minutos.',
    como:'Antes de salir, dejá el Aviso de salida (a dónde vas, con quién y a qué hora volvés) y al regresar tocá "Volví".', ir:['abrir', 'salidas', 'Salidas seguras'] },
];
const esVerano = (mes = new Date().getMonth() + 1) => mes >= 10 || mes <= 3;
const tareasVeranoQueTocan = (soloDelAnio = false) => { if (!tengoLote()) return []; const mes = new Date().getMonth() + 1;
  return TAREAS_VERANO.filter(t => (t.dias || t.cada) && (!soloDelAnio || t.cada) && t.meses.includes(mes)).filter(t => { const e = estadoTarea(t, registroTarea(t)); return e.toca && !e.pospuesto; }); };
R.verano = {
  titulo:'Tu casa en verano', icon:'sun', color:'ok', sub:'Pasto, vereda, basura, viento, fuego y sol',
  render(){
    if (!tengoLote()) return vacio('home', 'Esta sección es para los vecinos con lote.');
    const u = yo(), tocan = new Set(tareasVeranoQueTocan().map(t => t.id)), mes = new Date().getMonth() + 1;
    const conFecha = TAREAS_VERANO.filter(t => t.dias || t.cada).sort((a, b) => tocan.has(b.id) - tocan.has(a.id)), habitos = TAREAS_VERANO.filter(t => !t.dias && !t.cada);
    const ir = t => t.ir ? `<button class="btn btn-sm btn-sec" data-a="${t.ir[0]}" data-v="${esc(t.ir[1])}">${esc(t.ir[2])}${I('right')}</button>` : '';
    const tarjeta = t => { const x = registroTarea(t), e = estadoTarea(t, x), toca = tocan.has(t.id), epoca = t.meses.includes(mes);
      return `<details class="card eb-guia tarea${toca ? ' toca' : ''}"><summary>${I(t.icon)}<b>${esc(t.t)}</b>
          <span class="pill ${e.toca ? (toca ? 'p-warn' : '') : 'p-ok'}">${!e.toca ? `Hecho ${fechaCorta(isoDe(new Date(e.hecho)))}` : e.pospuesto ? `Te lo recuerdo el ${fechaCorta(isoDe(new Date(e.pospuesto)))}` : toca ? 'Toca ahora' : !epoca ? 'Fuera de temporada' : e.hecho ? `Último: ${fechaCorta(isoDe(new Date(e.hecho)))}` : 'Sin anotar'}</span></summary>
        <p><b>Por qué:</b> ${esc(t.por)}</p><p><b>Cómo:</b> ${esc(t.como)}</p>
        <p class="muted small">${t.dias ? `En temporada, cada ${t.dias === 7 ? 'semana' : t.dias + ' días'}` : 'Una vez por año'}${!e.toca && e.prox ? ` · la próxima, ${t.dias ? 'el ' + fechaCorta(isoDe(new Date(e.prox))) : `en ${MESES[new Date(e.prox).getMonth()]}`}` : ''}.${x && x.por && x.hecho ? ` Lo anotó ${esc(primerNombre(nombreDe(x.por)))}.` : ''}</p>
        <div class="btns"><button class="btn btn-sm btn-ok" data-a="tarea-hecha" data-v="${t.id}">${I('check')}Lo hice${e.toca ? '' : ' otra vez'}</button>
          ${e.toca && !e.pospuesto && epoca ? `<button class="btn btn-sm btn-sec" data-a="tarea-despues" data-v="${t.id}">Recordame en una semana</button>` : ''}
          ${x && x.hecho ? `<button class="btn btn-sm btn-sec" data-a="tarea-deshacer" data-v="${t.id}">Deshacer</button>` : ''}${ir(t)}</div></details>`; };
    return `<p class="muted small" style="margin:0 0 12px">Lo que hace falta para que la casa y el barrio estén lindos y seguros en el verano fueguino. Anotá cuándo lo hiciste y la app te lo recuerda cuando vuelva a tocar. Lo ven solo las cuentas de ${esc(u.casa)}.</p>
      ${!esVerano() ? aviso('info', 'sun', 'Todavía no es temporada', 'El verano en Ushuaia va de noviembre a marzo. Mientras tanto, mirá "Tu casa en invierno".', `<button class="btn btn-xs btn-sec" data-a="abrir" data-v="invierno">Tu casa en invierno</button>`)
        : tocan.size ? aviso('warn', 'sun', `${plural(tocan.size, 'cosa para hacer', 'cosas para hacer')} ahora`, 'Tocá cada una, hacela y marcá "Lo hice".') : aviso('ok', 'check', 'Todo al día por ahora', 'Te avisamos cuando vuelva a tocar algo.')}
      ${sec('Para anotar')}${conFecha.map(tarjeta).join('')}
      ${sec('Todo el verano')}
      ${habitos.map(t => `<details class="card eb-guia"><summary>${I(t.icon)}<b>${esc(t.t)}</b></summary><p><b>Por qué:</b> ${esc(t.por)}</p><p><b>Cómo:</b> ${esc(t.como)}</p>${ir(t) ? `<div class="btns">${ir(t)}</div>` : ''}</details>`).join('')}
      <p class="muted tiny">Consejos generales. Ante humo o fuego en el bosque: 100 (bomberos) y la garita. Emergencias: 911. Para lo que es norma del barrio (horarios de obra y de ruidos, animales, residuos) vale el reglamento interno, en El barrio → Manual y normas.</p>`;
  },
};

/* ---------- "Para vos" de la pizarra ---------- */
function pizarraCasa(){
  const u = yo(); if (!u || esStaff() || esHotel() || esSupervisor()) return [];
  const out = [], tocan = tareasQueTocan();
  if (tocan.length){ const mes = hoyISO().slice(0, 7);
    out.push({ k:`invierno-${mes}-${tocan.length}`, nuevo:Pizarra.nuevo(`invierno-${mes}-${tocan.length}`, fechaDe(mes + '-01').getTime()), nivel:'amarillo', icon:'flame', tag:'Para vos · tu casa', at:fechaDe(mes + '-01').getTime(),
      titulo:`Tu casa en invierno: ${plural(tocan.length, 'cosa para revisar', 'cosas para revisar')}`, texto:tocan.slice(0, 3).map(t => t.t).join(' · '), a:'abrir', v:'invierno' }); }
  const ver = tareasVeranoQueTocan(true);
  if (ver.length){ const mes = hoyISO().slice(0, 7);
    out.push({ k:`verano-${mes}-${ver.length}`, nuevo:Pizarra.nuevo(`verano-${mes}-${ver.length}`, fechaDe(mes + '-01').getTime()), nivel:'verde', icon:'sun', tag:'Para vos · tu casa', at:fechaDe(mes + '-01').getTime(),
      titulo:`Tu casa en verano: ${plural(ver.length, 'cosa para hacer', 'cosas para hacer')}`, texto:ver.slice(0, 3).map(t => t.t).join(' · '), a:'abrir', v:'verano' }); }
  /* Lo que prestaste y ya tendría que haber vuelto. */
  cosasDe().filter(x => cosaMia(x) && x.estado === 'prestada' && x.prestada?.hasta && x.prestada.hasta < hoyISO()).forEach(x => out.push({ k:'cosa-' + x.id + '-' + x.prestada.hasta,
    nuevo:Pizarra.nuevo('cosa-' + x.id + '-' + x.prestada.hasta, fechaDe(x.prestada.hasta).getTime()), nivel:'verde', icon:'box', tag:'Para vos · préstamo', at:fechaDe(x.prestada.hasta).getTime(),
    titulo:`¿Te devolvieron ${x.nombre.toLowerCase()}?`, texto:`Se la prestaste a ${x.prestada.casa || 'un vecino'} hasta el ${fechaCorta(x.prestada.hasta)}`, a:'abrir', v:'cosas' }));
  return out;
}

/* ---------- el motor ---------- */
REGLAS.push({ id:'invierno-casa', n:'Otoño e invierno → recordatorio de los cuidados de la casa', d:'El 1.º de abril, mayo, junio, julio y agosto recuerda revisar gas, detector de monóxido, chimenea, rejillas, caños y nieve. Cada lote ve en "Para vos" lo que le toca.',
  run(s, hoy){
    const [, m, d] = hoy.split('-').map(Number); if (d !== 1 || m < 4 || m > 8 || new Date().getHours() < 10) return 0;
    const T = { 4:['Se viene el invierno: revisá tu casa', 'Detector de monóxido, gas, chimenea y caldera: mejor antes del frío.'],
      5:['Antes de la primera nevada', 'Canaletas limpias, caños de afuera protegidos, pala y sal a mano.'],
      6:['Frío en serio: las rejillas no se tapan', 'Taparlas es la causa más común de intoxicación con monóxido.'],
      7:['Mitad del invierno', 'Probá el detector de monóxido y fijate la leña y el matafuego.'],
      8:['Último tramo del invierno', 'Ojo con el hielo en la entrada: sal gruesa o arena en escalones y subidas.'] }[m];
    return marca(s, 'invierno-' + hoy, () => notificar(s, { para:'todos', titulo:T[0], texto:T[1], icon:'flame', color:'warn', link:'invierno', vence:finDelDia(hoy) }));
  } });

REGLAS.push({ id:'verano-casa', n:'Primavera y verano → recordatorio de los cuidados de la casa', d:'El 15 de noviembre, diciembre, enero y febrero recuerda el pasto, la vereda, el cesto con tapa, el viento, el fuego y la leña del invierno que viene. Cada lote ve en "Para vos" lo que le toca.',
  run(s, hoy){
    const [, m, d] = hoy.split('-').map(Number); if (d !== 15 || ![11, 12, 1, 2].includes(m) || new Date().getHours() < 10) return 0;
    const T = { 11:['Se viene el verano: tu casa y el barrio', 'Cesto alto y con tapa, pasto corto y nada suelto con el viento.'],
      12:['Fuego con cuidado', 'Asado solo en parrilla, con agua a mano; las brasas se apagan con agua. Nada de quemar pasto ni ramas.'],
      1:['Leña para el invierno que viene', 'La que se compra ahora llega seca al invierno. Y las bolsas, recién la mañana del camión.'],
      2:['Último tramo del verano', 'Aprovechá para pintar y arreglar afuera; ramas lejos de cables y techo.'] }[m];
    return marca(s, 'verano-' + hoy, () => notificar(s, { para:'todos', titulo:T[0], texto:T[1], icon:'sun', color:'ok', link:'verano', vence:finDelDia(hoy) }));
  } });

/* =========================================================
   PREPARADOS PARA UN SISMO (pedido de Claudio, 27-09-2026)
   -------------------------------------------------------
   Tierra del Fuego está sobre el sistema de fallas Magallanes–Fagnano,
   donde se tocan las placas Sudamericana y de Scotia (el terremoto de
   1949 fue de magnitud cercana a 7,5). Base de esta sección: las
   recomendaciones de Defensa Civil de Ushuaia (febrero de 2026: plan
   familiar, zonas seguras, objetos asegurados, llaves de corte y mochila
   de emergencia) y los protocolos internacionales (agacharse, cubrirse y
   sujetarse; mochila para 72 horas; simulacros).
   Es del LOTE, como "Tu casa en invierno" (pv/casaTareas): qué tiene la
   mochila y cuándo se revisó, el plan familiar y la revisión semanal.
   Todos los domingos a las 10 sale el recordatorio de la revisión
   semanal para todo el barrio (la Administración lo puede apagar en
   Ajustes → Avisos automáticos), y cada lote ve en "Para vos" si ya la
   hizo o no.
   ========================================================= */
const SISMO_DIA = 0;   /* domingo */
const MOCHILA = [
  { id:'agua',      t:'Agua potable',                               d:'4 litros por persona por día, para 3 días. Renovala cada 6 meses.', cada:6 },
  { id:'comida',    t:'Alimentos no perecederos',                   d:'Para 3 días y que no haya que cocinar: latas con abrefácil, barras, frutos secos. Mirá los vencimientos.', cada:6 },
  { id:'linterna',  t:'Linterna y pilas de repuesto',               d:'Mejor de LED o a manivela. Probala cada semana.', cada:6 },
  { id:'radio',     t:'Radio a pilas',                              d:'Para escuchar a Defensa Civil si no hay luz ni internet.', cada:12 },
  { id:'botiquin',  t:'Botiquín y medicamentos de todos los días',  d:'Para al menos 7 días, con copia de las recetas. Mirá los vencimientos.', cada:6 },
  { id:'abrigo',    t:'Ropa de abrigo y manta térmica',             d:'En Ushuaia, después de un sismo el frío es el mayor riesgo: gorro, guantes, medias, campera y manta térmica.', cada:12 },
  { id:'documentos',t:'Documentos en bolsa hermética',              d:'Copias del DNI, la escritura, la obra social y una lista de teléfonos en papel.', cada:12 },
  { id:'bateria',   t:'Batería externa cargada',                    d:'Cargala una vez por mes.', cada:1 },
  { id:'silbato',   t:'Silbato',                                    d:'Para pedir ayuda si quedás atrapado, sin gastar la voz.', cada:0 },
  { id:'efectivo',  t:'Algo de efectivo',                           d:'Sin luz no andan los posnet ni los cajeros.', cada:12 },
  { id:'llaves',    t:'Llaves de repuesto (casa y auto)',           d:'', cada:0 },
  { id:'higiene',   t:'Higiene: papel, alcohol en gel, barbijos y guantes', d:'', cada:12 },
  { id:'mascotas',  t:'Para las mascotas (si tenés)',               d:'Comida y agua para 3 días, correa y una foto de cada una.', cada:12 },
];
const PROTOCOLO_SISMO = [
  { t:'Durante el sismo: agachate, cubrite y sujetate', icon:'alert', items:[
    'Agachate (antes de que el temblor te tire), cubrite la cabeza y el cuello debajo de una mesa firme o junto a una pared interior, y sujetate hasta que pare.',
    'Lejos de ventanas, espejos, estanterías y lámparas colgantes. No corras hacia afuera mientras tiembla: la mayoría de las lesiones son por cosas que caen.',
    'El marco de la puerta no es más seguro en las casas de hoy.',
    'En la cama: quedate, boca abajo, y cubrite la cabeza con la almohada.',
    'En la cocina: alejate de la hornalla y de lo que pueda volcarse.',
    'Afuera: alejate de cables, árboles, postes y fachadas.',
    'Manejando: frená despacio en un lugar abierto, lejos de puentes y cables, y quedate adentro con el cinturón puesto.',
  ]},
  { t:'En la costa del Canal', icon:'drop', items:[
    'Si el sismo es tan fuerte que cuesta mantenerse en pie, o dura mucho, apenas termine alejate del agua hacia un lugar alto, sin esperar un aviso.',
    'Seguí después las indicaciones de Defensa Civil y de Prefectura.',
  ]},
  { t:'Después del sismo', icon:'check', items:[
    'Revisá si alguien está herido. Ponete calzado y abrigo antes de moverte: puede haber vidrios.',
    'Si olés gas: cerrá la llave general, no prendas luces ni fósforos, abrí puertas y ventanas y salí.',
    'Cortá la luz si ves cables dañados, y el agua si hay pérdidas.',
    'Salí con la mochila por la vía de escape que planeaste y andá al punto de encuentro. Esperá réplicas.',
    'Comunicate por mensaje (WhatsApp o SMS), no con llamadas: así no se saturan las líneas.',
    'Escuchá la radio y seguí solo la información oficial (Defensa Civil, municipio, provincia).',
    'Avisá en la app si necesitás ayuda (SOS) y fijate si tus vecinos, sobre todo los que viven solos, están bien.',
  ]},
  { t:'Antes: la casa', icon:'home', items:[
    'Elegí en cada ambiente un lugar seguro (debajo de una mesa firme, junto a una pared interior) y uno afuera, lejos de construcciones.',
    'Fijá a la pared las estanterías, roperos y el termotanque; los objetos pesados, abajo.',
    'Tené despejadas las salidas: pasillos, escaleras y puertas.',
    'Sabé dónde están las llaves de corte del gas, la luz y el agua, y que todos en la casa sepan cerrarlas.',
  ]},
  { t:'Chicos, mayores y mascotas', icon:'users', items:[
    'Practicá con los chicos "agacharse, cubrirse y sujetarse" como un juego, y que sepan el punto de encuentro.',
    'Si alguien necesita ayuda para moverse, acordá quién lo asiste.',
    'Las mascotas se asustan y se escapan: tené a mano la correa y una foto de cada una.',
  ]},
  { t:'Cómo se hace en otros países', icon:'sparkle', items:[
    'Japón: cada casa tiene su kit de emergencia y todas las escuelas y oficinas hacen simulacros varias veces por año.',
    'Chile: la mochila de emergencia es una campaña nacional y en la costa hay zonas seguras señalizadas para tsunamis.',
    'Estados Unidos, Nueva Zelanda y otros: el simulacro "ShakeOut" (agacharse, cubrirse y sujetarse) se hace en simultáneo una vez por año, en octubre.',
  ]},
];
const regLote = (sufijo, lote = yo()?.casa) => aLista(Store.s.casaTareas).find(x => x && x.id === idTarea(lote, sufijo)) || null;
function cambiarLote(sufijo, fn){
  const u = yo(), id = idTarea(u.casa, sufijo);
  Store.cambiar(s => { let x = s.casaTareas.find(z => z.id === id);
    if (!x){ x = { id, lote:u.casa, tarea:sufijo }; s.casaTareas.push(x); }
    fn(x); x.at = Date.now(); x.por = u.id; });
}
/* El domingo (o el último domingo que pasó) de esta semana, a las 00 h. */
const ultimoDomingo = () => { const d = fechaDe(hoyISO()); d.setDate(d.getDate() - ((d.getDay() - SISMO_DIA + 7) % 7)); return d.getTime(); };
const revisionSemanalHecha = () => (regLote('sismo-semana')?.hecho || 0) >= ultimoDomingo();
function estadoMochila(m, x){
  if (!x || !x.hecho) return { falta:true };
  if (!m.cada) return { ok:true, hecho:x.hecho };
  const prox = new Date(x.hecho); prox.setMonth(prox.getMonth() + m.cada);
  return prox.getTime() <= Date.now() ? { renovar:true, hecho:x.hecho } : { ok:true, hecho:x.hecho, prox:prox.getTime() };
}
const mochilaQueFalta = () => MOCHILA.filter(m => { const e = estadoMochila(m, regLote('moch-' + m.id)); return (e.falta && m.id !== 'mascotas') || e.renovar; });
R.sismo = {
  titulo:'Preparados para un sismo', icon:'sismo', color:'warn', sub:'Mochila de emergencia, plan familiar y qué hacer',
  alPintar(){ const k = claveCambioPlan(); if (k) Pizarra.marcar(k); },
  render(){
    if (!tengoLote()) return vacio('home', 'Esta sección es para los vecinos con lote.');
    const u = yo(), plan = regLote('sismo-plan') || {}, sem = regLote('sismo-semana'), falta = mochilaQueFalta();
    const listos = MOCHILA.filter(m => estadoMochila(m, regLote('moch-' + m.id)).ok).length;
    const fila = m => { const x = regLote('moch-' + m.id), e = estadoMochila(m, x);
      return `<div class="it mochila-it${e.ok ? ' ok' : ''}"><button class="mochila-tilde" data-a="mochila" data-v="${m.id}" aria-label="${e.ok ? 'Revisado' : 'Marcar como revisado'}">${I(e.ok ? 'check' : e.renovar ? 'refresh' : 'plus')}</button>
        <div class="txt"><b>${esc(m.t)}</b><span>${e.ok ? `Revisado el ${fechaCorta(isoDe(new Date(e.hecho)))}${e.prox ? ` · renovar en ${MESES[new Date(e.prox).getMonth()]}` : ''}` : e.renovar ? `<b class="eb-mal">Toca renovarlo</b> (último: ${fechaCorta(isoDe(new Date(e.hecho)))})` : 'Falta'}${m.d ? ' · ' + esc(m.d) : ''}</span></div></div>`; };
    return `<div class="card eb-intro">${I('sismo')}<div><b>Tierra del Fuego es zona sísmica</b>
        <p>El barrio está cerca del sistema de fallas Magallanes–Fagnano, donde se tocan dos placas (la Sudamericana y la de Scotia). En 1949 hubo un terremoto de magnitud cercana a 7,5. Prepararse lleva poco y cambia mucho.</p>
        <p class="muted small" style="margin:0">Basado en las recomendaciones de Defensa Civil de Ushuaia y en los protocolos internacionales. Defensa Civil da capacitaciones gratuitas: consultá en el 103.</p></div></div>
      ${revisionSemanalHecha() ? `<div class="eb-hecho">${I('check')}<div><b>Esta semana ya revisaron la mochila</b><span>${sem && sem.por ? 'Lo marcó ' + esc(primerNombre(nombreDe(sem.por))) + ' · ' : ''}${fechaCorta(isoDe(new Date(sem.hecho)))}</span></div></div>`
        : `<button class="eb-boton sismo-boton" data-a="sismo-semana"><span class="eb-corazon">${I('sismo')}</span><span class="eb-txt"><b>REVISIÓN SEMANAL</b><small>Mochila, agua, linterna, pilas y abrigo: fijate que esté todo y tocá acá</small></span></button>`}
      ${sec('Tu mochila de emergencia', `<span class="muted small">${listos} de ${MOCHILA.length}</span>`)}
      <div class="card lista">${MOCHILA.map(fila).join('')}</div>
      ${falta.length ? `<p class="muted small" style="margin:-4px 2px 12px">Tocá el círculo de cada cosa cuando la tengas o la renueves. Es del lote: lo ven y lo marcan todas las cuentas de ${esc(u.casa)}.</p>` : ''}
      ${sec('Tu plan familiar', `<button class="link" data-a="sismo-plan">${plan.encuentro ? 'Cambiar' : 'Armarlo'}</button>`)}
      <div class="card">${planIntegrantes(u, plan)}${plan.encuentro || plan.cortes ? `<div class="plan-sismo">
          ${[['Punto de encuentro', plan.encuentro], ['Contacto fuera de Tierra del Fuego', plan.contacto], ['Llaves de corte (gas, luz, agua)', plan.cortes], ['Lugares seguros de la casa', plan.seguros], ['Quién se ocupa de qué', plan.roles]].filter(([, v]) => v)
            .map(([t, v]) => `<div><small>${esc(t)}</small><b>${esc(v)}</b></div>`).join('')}</div>
          <div class="btns" style="margin-top:12px"><button class="btn btn-sm btn-sec" data-a="sismo-plan-imprimir">${I('download')}Imprimirlo para la heladera</button><button class="btn btn-sm btn-sec" data-a="sismo-simulacro">${I('clock')}Hacer un simulacro</button></div>`
        : `<p class="small" style="margin:0 0 10px">Defensa Civil recomienda que cada casa tenga su plan: dónde se encuentran, a quién llaman, dónde se corta el gas y quién hace cada cosa.</p>
          <div class="btns"><button class="btn btn-pri" data-a="sismo-plan">${I('edit')}Armar el plan</button><button class="btn btn-sec" data-a="sismo-simulacro">${I('clock')}Hacer un simulacro</button></div>`}
        ${plan.simulacro ? `<p class="muted tiny" style="margin:10px 0 0">Último simulacro: ${fechaCorta(isoDe(new Date(plan.simulacro)))}. Conviene uno cada 6 meses.</p>` : ''}
        ${plan.encuentro || plan.cortes ? planSugerencias(u, plan) : ''}</div>
      ${sec('Qué hacer')}
      ${PROTOCOLO_SISMO.map((g, i) => `<details class="card eb-guia" ${i === 0 ? 'open' : ''}><summary>${I(g.icon)}<b>${esc(g.t)}</b></summary><ul>${g.items.map(x => `<li>${esc(x)}</li>`).join('')}</ul></details>`).join('')}
      ${sec('Teléfonos')}<div class="eb-tels">${[['103', 'Defensa Civil'], ['911', 'Emergencias'], ['100', 'Bomberos'], ['107', 'Emergencias médicas']].map(([n, q]) => `<a class="eb-tel" href="tel:${n}"><b>${n}</b><span>${esc(q)}</span></a>`).join('')}</div>
      ${superficie({ v:'sismos', icon:'sismo', color:'warn', t:'Sismos en vivo', s:'Los movimientos de la región, al momento' })}
      <p class="muted tiny" style="margin-top:12px">Guía general. Ante una emergencia, seguí siempre las indicaciones de Defensa Civil y de los bomberos.</p>`;
  },
};
A['mochila'] = el => { const m = MOCHILA.find(z => z.id === el.dataset.v); if (!m) return;
  const e = estadoMochila(m, regLote('moch-' + m.id));
  cambiarLote('moch-' + m.id, x => { x.hecho = e.ok && Date.now() - e.hecho < 5 * MIN ? 0 : Date.now(); });
  refrescar(); };
A['sismo-semana'] = () => {
  const falta = mochilaQueFalta();
  hoja('Revisión semanal', `<p class="small" style="margin:0 0 12px">Fijate que en la mochila esté todo y que funcione:</p>
    <ul class="small" style="margin:0 0 14px;padding-left:20px;line-height:1.6"><li>Agua y comida (sin vencer).</li><li>Linterna y radio: probalas; pilas de repuesto.</li><li>Batería externa cargada.</li><li>Abrigo, manta térmica y botiquín.</li><li>Que las salidas de la casa estén despejadas.</li></ul>
    ${falta.length ? aviso('warn', 'alert', `Falta o toca renovar: ${plural(falta.length, 'cosa', 'cosas')}`, esc(falta.slice(0, 4).map(m => m.t).join(' · ') + (falta.length > 4 ? '…' : ''))) : ''}
    <button class="btn btn-ok btn-block" data-a="sismo-semana-ok">${I('check')}Listo, revisado</button>`);
};
A['sismo-semana-ok'] = () => { cambiarLote('sismo-semana', x => { x.hecho = Date.now(); }); cerrarHoja(); toast('¡Bien! Hasta el domingo que viene', 'check'); refrescar(); };
A['sismo-plan'] = () => { const p = regLote('sismo-plan') || {};
  hoja('Tu plan familiar', `<form data-f="sismo-plan">
    <div class="field"><label>Punto de encuentro</label><input name="encuentro" maxlength="100" value="${esc(p.encuentro || '')}" placeholder="Ej: la plaza de la entrada del barrio"></div>
    <div class="field"><label>Contacto fuera de Tierra del Fuego</label><input name="contacto" maxlength="100" value="${esc(p.contacto || '')}" placeholder="Nombre y teléfono (todos avisan ahí)"></div>
    <div class="field"><label>Llaves de corte (gas, luz, agua)</label><input name="cortes" maxlength="140" value="${esc(p.cortes || '')}" placeholder="Ej: gas al lado del medidor, luz en el tablero del garaje"></div>
    <div class="field"><label>Lugares seguros de la casa</label><input name="seguros" maxlength="140" value="${esc(p.seguros || '')}" placeholder="Ej: debajo de la mesa del comedor"></div>
    <div class="field"><label>Quién se ocupa de qué</label><input name="roles" maxlength="140" value="${esc(p.roles || '')}" placeholder="Ej: mamá busca a los chicos, papá corta el gas"></div>
    <p class="muted small" style="margin:0 0 12px">Lo ven solo las cuentas de tu lote. No pongas contraseñas ni datos de salud.</p>
    <button class="btn btn-pri btn-block">${I('check')}Guardar</button></form>`); };
F['sismo-plan'] = d => {
  const u = yo(), antes = regLote('sismo-plan') || {}, primero = !(antes.encuentro || antes.cortes);
  const campos = ['encuentro', 'contacto', 'cortes', 'seguros', 'roles'], nuevo = {};
  campos.forEach(k => { nuevo[k] = String(d[k] || '').trim().slice(0, 140); });
  const cambio = campos.filter(k => nuevo[k] !== (antes[k] || ''));
  if (!primero && !cambio.length){ cerrarHoja(); toast('No cambiaste nada', 'check'); return; }
  cambiarLote('sismo-plan', x => { Object.assign(x, nuevo); x.hecho = Date.now(); x.cambio = Date.now(); x.cambioPor = u.id; x.cambioQue = cambio; x.cambioArmo = primero; });
  const otros = familiaParaAvisar(u);
  if (otros.length) Store.cambiar(s => notificar(s, { para:otros, titulo: primero ? `${primerNombre(u.nombre)} armó el plan ante un sismo de ${u.casa}` : `${primerNombre(u.nombre)} cambió el plan ante un sismo`,
    texto: primero ? 'Miralo: es de toda la casa. Si algo no te cierra, sugerí un cambio o cambialo vos.' : `Cambió: ${cambio.map(k => CAMPOS_PLAN[k].toLowerCase()).join(', ')}. Miralo y, si querés, sugerí algo.`, icon:'sismo', color:'warn', link:'sismo', sonido:true }));
  cerrarHoja(); toast(otros.length ? `Plan guardado. Les avisamos a ${plural(otros.length, 'cuenta', 'cuentas')} de ${u.casa}` : 'Plan guardado', 'check'); refrescar(); };
/* =========================================================
   EL PLAN ES DE TODA LA CASA (pedido de Claudio, 28-09-2026)
   Todas las cuentas del lote quedan dentro del plan solas, sin invitar a
   nadie: el plan vive en pv/casaTareas (copiado a cada cuenta del lote,
   ver Nube.duenos) y cualquiera de ellas lo ve y lo cambia. Cuando uno lo
   arma o lo cambia, a los demás les llega el aviso (campanita, celular y
   "Para vos" en la pizarra) para que lo miren. Y entre ellos se pueden
   SUGERIR cambios: una lista corta de sugerencias dentro del mismo plan,
   que cualquiera del lote marca como "Hecho" cuando la pasa al plan. Nadie
   de afuera del lote lo ve (ni la garita ni la Administración).
   ========================================================= */
const CAMPOS_PLAN = { encuentro:'Punto de encuentro', contacto:'Contacto fuera de Tierra del Fuego', cortes:'Llaves de corte', seguros:'Lugares seguros', roles:'Quién se ocupa de qué' };
const familiaParaAvisar = u => Store.s.users.filter(x => x && x.casa === u.casa && x.estado === 'aprobado' && x.id !== u.id && x.rol !== 'hotel' && x.rol !== 'guardia').map(x => x.id);
/* La clave de la pizarra para "tu familia cambió el plan": una por cambio. */
const claveCambioPlan = () => { const p = regLote('sismo-plan'); return p && p.cambio && p.cambioPor && p.cambioPor !== yo()?.id ? 'sismo-plan-' + p.cambio : ''; };
function planIntegrantes(u, plan){
  const fam = Store.s.users.filter(x => x && x.casa === u.casa && x.estado === 'aprobado' && x.rol !== 'hotel' && x.rol !== 'guardia');
  const quien = plan.cambioPor ? usuario(plan.cambioPor) : null;
  return `<div class="plan-fam">${I('users')}<div><b>En este plan: ${fam.map(x => esc(primerNombre(x.nombre)) + (x.id === u.id ? ' (vos)' : '')).join(', ')}</b>
    <span>Todas las cuentas de ${esc(u.casa)} entran solas: lo ven, lo cambian y se enteran de cada cambio.${quien && plan.cambio ? ` Último cambio: ${esc(primerNombre(quien.nombre))}, ${fechaCorta(isoDe(new Date(plan.cambio)))}.` : ''}</span></div></div>`;
}
function planSugerencias(u, plan){
  const ls = aLista(plan.sugerencias).filter(x => x && x.id).sort((a, b) => (!!a.hecha - !!b.hecha) || b.at - a.at);
  return `<div class="plan-sug">
    <div class="lbl" style="margin:14px 0 6px">Sugerencias de la familia${ls.filter(x => !x.hecha).length ? ` · ${ls.filter(x => !x.hecha).length} sin pasar al plan` : ''}</div>
    ${ls.length ? `<div class="lista">${ls.slice(0, 12).map(x => `<div class="it${x.hecha ? ' hecha' : ''}"><span class="ic ic-${x.hecha ? 'ok' : 'warn'}" style="width:30px;height:30px;border-radius:10px;display:grid;place-items:center">${I(x.hecha ? 'check' : 'chat')}</span>
        <div class="txt"><b>${esc(x.texto)}</b><span>${esc(primerNombre(nombreDe(x.de)))} · ${fechaCorta(isoDe(new Date(x.at)))}${x.hecha ? ` · pasada al plan${x.hechaPor ? ' por ' + esc(primerNombre(nombreDe(x.hechaPor))) : ''}` : ''}</span></div>
        ${x.hecha ? '' : `<button class="btn btn-xs btn-ok" data-a="sismo-sug-hecha" data-id="${esc(x.id)}" title="Ya la pasé al plan">${I('check')}Hecho</button>`}
        ${x.de === u.id ? `<button class="icon-btn" data-a="sismo-sug-borrar" data-id="${esc(x.id)}" aria-label="Borrar mi sugerencia">${I('trash')}</button>` : ''}</div>`).join('')}</div>`
      : '<p class="muted small" style="margin:0 0 8px">¿Algo para cambiar o agregar? Sugerilo y les llega a los demás de la casa.</p>'}
    <button class="btn btn-sm btn-sec" data-a="sismo-sugerir">${I('chat')}Sugerir un cambio</button></div>`;
}
A['sismo-sugerir'] = () => hoja('Sugerir un cambio en el plan', `<form data-f="sismo-sugerir">
  <div class="field"><label>¿Qué cambiarías o agregarías?</label><textarea name="texto" rows="3" maxlength="200" required placeholder="Ej: que el punto de encuentro sea la plaza, no la vereda · falta anotar la llave del agua"></textarea></div>
  <p class="muted small" style="margin:0 0 12px">Les llega a las demás cuentas de ${esc(yo().casa)}. Quien la pase al plan la marca como "Hecho". No escribas contraseñas ni datos de salud.</p>
  <button class="btn btn-pri btn-block">${I('send')}Mandar la sugerencia</button></form>`);
F['sismo-sugerir'] = d => {
  const u = yo(), texto = String(d.texto || '').trim().slice(0, 200); if (!texto) return;
  cambiarLote('sismo-plan', x => { x.sugerencias = [...aLista(x.sugerencias), { id:'sg' + uid(), de:u.id, texto, at:Date.now() }].slice(-20); });
  const otros = familiaParaAvisar(u);
  if (otros.length) Store.cambiar(s => notificar(s, { para:otros, titulo:`${primerNombre(u.nombre)} sugiere un cambio en el plan ante un sismo`, texto:texto.slice(0, 90), icon:'sismo', color:'warn', link:'sismo', sonido:true }));
  cerrarHoja(); toast(otros.length ? 'Listo: les llegó a los de tu casa' : 'Sugerencia guardada', 'send'); refrescar();
};
A['sismo-sug-hecha'] = el => { const u = yo();
  cambiarLote('sismo-plan', x => { const sg = aLista(x.sugerencias).find(z => z && z.id === el.dataset.id); if (sg){ sg.hecha = Date.now(); sg.hechaPor = u.id; } x.sugerencias = aLista(x.sugerencias); });
  refrescar(); toast('Marcada como hecha', 'check'); };
A['sismo-sug-borrar'] = async el => {
  if (!await confirmar('Borrar la sugerencia', 'Deja de verse en el plan.', { si:'Borrar', peligro:true })) return;
  cambiarLote('sismo-plan', x => { x.sugerencias = aLista(x.sugerencias).filter(z => !(z && z.id === el.dataset.id && z.de === yo().id)); });
  refrescar(); };
A['sismo-plan-imprimir'] = () => { const p = regLote('sismo-plan') || {}, u = yo();
  imprimir(`Plan ante un sismo · ${u.casa}`, `<div class="cab"><div><h1>Plan ante un sismo</h1><div>${esc(u.casa)} · Barrio ${esc(Store.s.config.nombre)}</div></div><div class="der">Agachate · cubrite · sujetate</div></div>
    ${[['Punto de encuentro', p.encuentro], ['Contacto fuera de Tierra del Fuego', p.contacto], ['Llaves de corte', p.cortes], ['Lugares seguros', p.seguros], ['Quién se ocupa de qué', p.roles]].filter(([, v]) => v).map(([t, v]) => `<div class="caja"><b>${esc(t)}</b><br>${esc(v)}</div>`).join('')}
    <h2>Teléfonos</h2><p>Defensa Civil 103 · Emergencias 911 · Bomberos 100 · Emergencias médicas 107${Store.s.config.garitaTel ? ' · Garita ' + esc(Store.s.config.garitaTel) : ''}</p>
    <h2>Durante el sismo</h2><p>Agachate, cubrite la cabeza y el cuello y sujetate hasta que pare. Lejos de ventanas. No salgas corriendo mientras tiembla.</p>
    <h2>Después</h2><p>Calzado y abrigo. Si hay olor a gas, cerrá la llave y salí. Tomá la mochila y andá al punto de encuentro. Mensajes, no llamadas.</p>`, { pie:'Plan familiar armado en la app del barrio, según las recomendaciones de Defensa Civil de Ushuaia.' }); };
/* Un simulacro de un minuto: agacharse, cubrirse y sujetarse, y salir. */
A['sismo-simulacro'] = () => {
  const p = regLote('sismo-plan') || {};
  hoja('Simulacro', `<div class="simulacro"><div class="sim-num" id="simNum">3</div><p id="simTxt">Preparados…</p></div>
    <p class="muted small" style="text-align:center;margin:0">Hacelo con todos los de la casa. Tarda un minuto.</p>`);
  let n = 3, fase = 0;
  const num = () => $('#simNum'), txt = () => $('#simTxt');
  clearInterval(A._sim);
  A._sim = setInterval(() => {
    if (!hojaAbierta() || !num()){ clearInterval(A._sim); return; }
    n--;
    if (fase === 0 && n <= 0){ fase = 1; n = 45; Sonido.tocar([[220, 0, .6], [196, .5, .8]], 'sawtooth', .12); Sonido.vibrar([400, 200, 400]); txt().innerHTML = '<b>¡TIEMBLA!</b> Agachate, cubrite la cabeza y sujetate.'; }
    else if (fase === 1 && n <= 0){ fase = 2; n = 15; txt().innerHTML = `<b>Paró.</b> Calzado y abrigo, mochila, y salí al punto de encuentro${p.encuentro ? ': ' + esc(p.encuentro) : ''}.`; }
    else if (fase === 2 && n <= 0){ clearInterval(A._sim); num().textContent = '✓';
      txt().innerHTML = '<b>¡Listo!</b> ¿Todos llegaron? ¿Faltó algo? Anotalo para mejorar el plan.';
      cambiarLote('sismo-plan', x => { x.simulacro = Date.now(); }); return; }
    num().textContent = n;
  }, 1000);
};
/* ---------- "Para vos" y el recordatorio de los domingos ---------- */
function pizarraSismo(){
  const u = yo(); if (!u || esStaff() || esHotel() || !tengoLote()) return [];
  const out = [], dom = ultimoDomingo();
  /* Otro de la casa armó o cambió el plan: queda en "Para vos" hasta que se abre (3 días como mucho). */
  const pl = regLote('sismo-plan'), kc = claveCambioPlan();
  if (kc && !Pizarra.vistos()[kc] && pl.cambio > Date.now() - 3 * DIA){ const q = primerNombre(nombreDe(pl.cambioPor));
    out.push({ k:kc, nuevo:Pizarra.nuevo(kc, pl.cambio), nivel:'amarillo', icon:'sismo', tag:'Para vos · sismo', at:pl.cambio,
      titulo:`${q} ${pl.cambioArmo ? 'armó' : 'cambió'} el plan ante un sismo`, texto:'Miralo: es de toda la casa. Podés sugerir cambios.', a:'abrir', v:'sismo' }); }
  if (!revisionSemanalHecha()) out.push({ k:'sismo-sem-' + isoDe(new Date(dom)), nuevo:Pizarra.nuevo('sismo-sem-' + isoDe(new Date(dom)), dom + 10 * HORA), nivel:'amarillo', icon:'sismo', tag:'Para vos · sismo', at:dom + 10 * HORA,
    titulo:'Revisión semanal de la mochila de emergencia', texto:'Agua, linterna, pilas, abrigo y botiquín', a:'abrir', v:'sismo' });
  return out;
}
REGLAS.push({ id:'sismo-semanal', n:'Domingos → revisión semanal de la mochila de emergencia', d:'Todos los domingos a las 10 recuerda a todo el barrio revisar la mochila (agua, linterna, pilas, abrigo, botiquín). Tierra del Fuego es zona sísmica.',
  run(s, hoy){
    if (new Date().getDay() !== SISMO_DIA || new Date().getHours() < 10) return 0;
    return marca(s, 'sismo-' + hoy, () => notificar(s, { para:'todos', titulo:'Domingo de revisión: tu mochila de emergencia', texto:'Agua, linterna y pilas, radio, abrigo y botiquín. Tocá acá y marcá "Revisado".', icon:'sismo', color:'warn', link:'sismo', sonido:true, vence:finDelDia(hoy) }));
  } });

/* =========================================================
   CASA SOLA, REVISADA TODOS LOS DÍAS (pedido de Claudio, 27-09-2026)
   -------------------------------------------------------
   Cuando un vecino avisa "Me voy de viaje", su casa entra en la lista de
   casas solas de la garita. Revisarla una vez por día es una tarea más de
   la garita o del policía de la ronda nocturna: se toca "Revisada", se
   elige quién fue y cómo estaba, y al vecino le llega "Tu casa está en
   orden" (o la novedad, con urgencia). Si a las 21 h alguna casa sola no
   se revisó, la garita recibe un recordatorio.
   DÓNDE VIVE: pv/ausencias/<cuenta>/au-<uid> (una por cuenta, copiada a
   las cuentas del lote). La leen solo el vecino, su lote, la garita y la
   Administración. Antes el viaje se guardaba en la ficha (barrio/users),
   que pueden leer todos los vecinos aprobados, y el aviso a la garita iba
   por el canal general: que una casa está sola no puede andar a la vista.
   Lo viejo (users.viaje) se muda solo la primera vez que el vecino abre
   la app con esta versión.
   ========================================================= */
const ausencias = () => aLista(Store.s.ausencias).filter(x => x && x.id && x.casa);
/* La ausencia vigente (o próxima) de una cuenta o de su lote. */
function ausenciaDe(u = yo()){
  if (!u) return null; const hoy = hoyISO();
  const x = ausencias().filter(a => (a.userId === u.id || (u.casa && a.casa === u.casa)) && a.hasta >= hoy).sort((a, b) => a.desde.localeCompare(b.desde))[0];
  return x || (u.viaje && u.viaje.hasta >= hoy ? { ...u.viaje, id:'viejo-' + u.id, userId:u.id, casa:u.casa, viejo:true, revisiones:{} } : null);
}
/* Las casas solas de hoy, una por lote (para la garita). */
function casasSolas(hoy = hoyISO()){
  const porCasa = new Map();
  ausencias().filter(a => a.desde <= hoy && a.hasta >= hoy).forEach(a => { if (!porCasa.has(a.casa)) porCasa.set(a.casa, a); });
  Store.s.users.filter(u => u.viaje && u.viaje.desde <= hoy && u.viaje.hasta >= hoy && !porCasa.has(u.casa))
    .forEach(u => porCasa.set(u.casa, { ...u.viaje, id:'viejo-' + u.id, userId:u.id, casa:u.casa, viejo:true, revisiones:{} }));
  return [...porCasa.values()].sort((a, b) => (parseInt(String(a.casa).replace(/\D/g, ''), 10) || 0) - (parseInt(String(b.casa).replace(/\D/g, ''), 10) || 0));
}
const revisionDeHoy = a => a && a.revisiones && typeof a.revisiones === 'object' ? a.revisiones[hoyISO()] || null : null;
const QUIEN_REVISA = { garita:'la garita', policia:'el policía de la ronda' };
function guardarAusencia(s, u, datos){
  if (!Array.isArray(s.ausencias)) s.ausencias = [];
  const id = 'au-' + u.id; let x = s.ausencias.find(a => a.id === id);
  const nueva = !x;
  if (!x){ x = { id, userId:u.id, revisiones:{} }; s.ausencias.push(x); }
  Object.assign(x, { casa:u.casa || '', ...datos, at:Date.now() });
  const yu = s.users.find(z => z.id === u.id); if (yu && yu.viaje) delete yu.viaje;
  return { x, nueva };
}
/* La ficha vieja (users.viaje) pasa a la carpeta privada. */
function mudarViaje(s){
  const u = yo(); if (!u || !u.viaje || esStaff() || esHotel() || esSupervisor()) return 0;
  const v = u.viaje;
  if (v.hasta >= hoyISO()) guardarAusencia(s, u, { desde:v.desde, hasta:v.hasta, contacto:v.contacto || '', nota:v.nota || '' });
  else { const yu = s.users.find(z => z.id === u.id); if (yu) delete yu.viaje; }
  return 1;
}
/* ---------- la garita ---------- */
function bandaCasasSolas(opera){
  const solas = casasSolas(); if (!solas.length) return '';
  const faltan = solas.filter(a => !revisionDeHoy(a)).length;
  return sec('Casas solas', `<span class="muted small">${faltan ? `${faltan} sin revisar hoy` : 'todas revisadas hoy'}</span>`) + solas.map(a => { const r = revisionDeHoy(a);
    return `<div class="card casa-sola${r ? '' : ' falta'}" style="padding:12px 14px"><div class="pase"><span class="ic ${r ? 'ic-ok' : 'ic-wood'}">${I(r ? 'check' : 'lock')}</span>
      <div class="datos"><b>${esc(a.casa)}</b><span>Hasta el ${fechaCorta(a.hasta)}${a.contacto ? ' · ' + esc(a.contacto) : ''}${a.nota ? ' · ' + esc(a.nota) : ''}</span>
        <span class="${r ? 'eb-ok' : 'eb-mal'}">${r ? `${r.novedad ? 'Con novedad' : 'En orden'} · ${hora(r.at)} · ${esc(QUIEN_REVISA[r.por] || 'la garita')}${r.policia ? ' (' + esc(r.policia) + ')' : ''}` : 'Falta revisarla hoy'}</span></div>
      ${opera ? `<button class="btn btn-xs ${r ? 'btn-sec' : 'btn-ok'}" data-a="casa-revisar" data-v="${esc(a.casa)}">${I('check')}${r ? 'Otra vez' : 'Revisada'}</button>` : ''}</div></div>`; }).join('');
}
A['casa-revisar'] = el => {
  const a = casasSolas().find(x => x.casa === el.dataset.v); if (!a) return;
  const t = typeof turnoAbierto === 'function' ? turnoAbierto() : null, pols = t && typeof policiasAdentro === 'function' ? policiasAdentro(t) : [];
  hoja(`Revisar ${a.casa}`, `<form data-f="casa-revisada" data-v="${esc(a.casa)}">
    <div class="field"><label>¿Quién la revisó?</label><div class="seg">
      <label><input type="radio" name="por" value="policia" ${pols.length ? 'checked' : ''}><span>${I('shield')}Policía de la ronda</span></label>
      <label><input type="radio" name="por" value="garita" ${pols.length ? '' : 'checked'}><span>${I('gate')}Garita</span></label></div></div>
    ${pols.length ? `<div class="field"><label>Policía</label><select name="policia">${pols.map(p => `<option>${esc(p.nombre)}</option>`).join('')}</select></div>` : ''}
    <div class="field"><label>¿Cómo estaba?</label><div class="seg">
      <label><input type="radio" name="estado" value="ok" checked><span>${I('check')}Todo en orden</span></label>
      <label><input type="radio" name="estado" value="novedad"><span>${I('alert')}Hay una novedad</span></label></div></div>
    <div class="field"><label>Detalle (opcional; si hay novedad, contala)</label><input name="nota" maxlength="140" placeholder="Ej: portón cerrado, luces apagadas, sin novedades"></div>
    <p class="muted small" style="margin:0 0 12px">Al vecino le llega el aviso al celular.</p>
    <button class="btn btn-ok btn-block">${I('check')}Listo</button></form>`);
};
F['casa-revisada'] = (d, form) => {
  const a = casasSolas().find(x => x.casa === form.dataset.v); if (!a) return;
  const novedad = d.estado === 'novedad', nota = String(d.nota || '').trim().slice(0, 140);
  if (novedad && !nota){ toast('Contá cuál es la novedad', 'alert'); return; }
  const r = { at:Date.now(), quien:yo().id, por:d.por === 'policia' ? 'policia' : 'garita', policia:d.por === 'policia' ? String(d.policia || '').slice(0, 60) : '', novedad, nota };
  const lote = residentesDelLote(a.casa).map(u => u.id); if (a.userId && !lote.includes(a.userId)) lote.push(a.userId);
  Store.cambiar(s => {
    if (a.viejo){ const u = s.users.find(z => z.id === a.userId); if (u) guardarAusencia(s, u, { desde:a.desde, hasta:a.hasta, contacto:a.contacto || '', nota:a.nota || '' }); }
    const x = aLista(s.ausencias).find(z => z.casa === a.casa && z.desde <= hoyISO() && z.hasta >= hoyISO());
    if (x){ if (!x.revisiones || typeof x.revisiones !== 'object' || Array.isArray(x.revisiones)) x.revisiones = {}; x.revisiones[hoyISO()] = r; x.at = Date.now(); }
    s.bitacora.unshift({ id:uid(), autor:yo().id, tipo:'ronda', texto:`Casa sola ${a.casa} revisada por ${QUIEN_REVISA[r.por]}${r.policia ? ' (' + r.policia + ')' : ''}: ${novedad ? 'NOVEDAD · ' + nota : 'en orden' + (nota ? ' · ' + nota : '')}.`, at:Date.now() });
    if (lote.length) notificar(s, { para:lote, titulo: novedad ? `Novedad en tu casa (${a.casa})` : `Tu casa está en orden 🏠`,
      texto: novedad ? `${nota} · La revisó ${QUIEN_REVISA[r.por]}. Comunicate con la garita.` : `La revisó ${QUIEN_REVISA[r.por]} a las ${hora(r.at)}${nota ? ' · ' + nota : ''}.`,
      icon:'home', color: novedad ? 'danger' : 'ok', link:'visitas', urgente:novedad, sonido:true });
  });
  cerrarHoja(); toast(novedad ? 'Anotado: le avisamos al vecino la novedad' : 'Listo: al vecino le llega que su casa está en orden', 'home');
};
/* ---------- el vecino ---------- */
function lineaCasaSola(){
  const u = yo(); if (!u || esStaff() || esHotel() || esSupervisor()) return '';
  const a = ausenciaDe(u); if (!a || a.desde > hoyISO()) return '';
  const r = revisionDeHoy(a);
  return `<button class="eb-listo${r && r.novedad ? ' novedad' : ''}" data-a="abrir" data-v="visitas">${I(r ? (r.novedad ? 'alert' : 'check') : 'lock')}<span><b>${r ? (r.novedad ? 'Novedad en tu casa' : 'Tu casa sola: en orden') : 'Tu casa sola: todavía sin revisar hoy'}</b>
    <small>${r ? `${r.novedad ? esc(r.nota) + ' · ' : ''}la revisó ${esc(QUIEN_REVISA[r.por] || 'la garita')} a las ${hora(r.at)}` : `La garita o el policía de la ronda la revisa una vez por día · hasta el ${fechaCorta(a.hasta)}`}</small></span></button>`;
}
/* ---------- el motor ---------- */
REGLAS.push({ id:'casas-solas', n:'Casas solas → recordar a la garita las que faltan revisar', d:'A las 21 h, si alguna casa sola no se revisó en el día, le avisa a la garita. Además, la ficha vieja de "Me voy de viaje" pasa a la carpeta privada.',
  run(s, hoy){
    let n = mudarViaje(s);
    if (new Date().getHours() >= 21 && (esGuardia() || esAdmin())){
      const faltan = casasSolas(hoy).filter(a => !revisionDeHoy(a));
      if (faltan.length) n += marca(s, 'solas-' + hoy, () => notificar(s, { para:cuentasGarita(), titulo:`Faltan revisar ${plural(faltan.length, 'casa sola', 'casas solas')}`, texto:faltan.map(a => a.casa).join(', ') + '. Al revisarlas, al vecino le llega el aviso.', icon:'lock', color:'warn', link:'garita', sonido:true, vence:finDelDia(hoy) }));
    }
    return n;
  } });
