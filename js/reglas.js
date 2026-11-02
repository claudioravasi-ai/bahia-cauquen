/* =========================================================
   REGLAS QUE ARMA LA ADMINISTRACIÓN: "CUANDO PASA ESTO → HACÉ ESTO"
   (pedido de Claudio, 11-10-2026; idea de n8n, 207k★, y automatisch, 14k★,
   en GitHub: el código es propio)
   Sin programar: en Administración → Automatizaciones → "Mis reglas", se
   elige CUÁNDO (nieve mañana, helada, ráfagas, un día y hora de cada
   semana, un reclamo de un tema, una obra que avisa trabajos para hoy), A
   QUIÉN avisar (todos, los de la misma calle, la garita, la Administración,
   el pizarrón) y el MENSAJE, que viene escrito y se puede cambiar.
   Las corre el motor de siempre (js/admin.js, regla "reglas-propias"): la
   misma marca en la base hace que cada regla actúe una sola vez por día (o
   una vez por reclamo u obra), aunque la app esté abierta en muchos equipos.
   PRIVACIDAD: las reglas guardan solo el texto del aviso. El de un reclamo
   dice solo el tema, nunca quién lo hizo ni el lote; el de una obra, el
   lote y el aviso que la obra ya publicó para hoy.
   ========================================================= */
const DIAS_SEMANA = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const DISPAROS = {
  nieve:   { n:'Se pronostica nieve para mañana', ic:'snow', c:'sky', campo:['valor', 'Desde cuántos cm', 2],
             titulo:'Mañana nieva en el barrio', texto:'Se esperan {valor} cm de nieve para el {fecha}. Dejá el auto en un lugar que no moleste al quitanieve y tené pala y sal a mano.',
             frase:r => `se pronostican ${r.valor || 2} cm de nieve o más para mañana`,
             ver:r => { const v = Clima.d?.dd?.snowfall_sum?.[1]; return v != null && v >= (+r.valor || 2) ? { valor:Math.round(v) } : null; } },
  helada:  { n:'Mañana hiela', ic:'snow', c:'accent', campo:['valor', 'Mínima de (°C) o menos', 0],
             titulo:'Mañana hiela: cuidado con el hielo', texto:'Mañana la mínima es de {valor} °C. Las subidas y las veredas pueden amanecer con hielo: salí con tiempo y con cuidado.',
             frase:r => `la mínima de mañana es de ${r.valor ?? 0} °C o menos`,
             ver:r => { const v = Clima.d?.dd?.temperature_2m_min?.[1]; return v != null && v <= (+r.valor || 0) ? { valor:Math.round(v) } : null; } },
  viento:  { n:'Ráfagas fuertes hoy', ic:'wind', c:'warn', campo:['valor', 'Ráfagas desde (km/h)', 70],
             titulo:'Hoy hay ráfagas fuertes', texto:'Se esperan ráfagas de {valor} km/h. Asegurá tachos, muebles de jardín y todo lo que pueda volar.',
             frase:r => `hay ráfagas de ${r.valor || 70} km/h o más`,
             ver:r => { const c = Clima.d?.c || {}, dd = Clima.d?.dd || {}; const v = Math.max(c.wind_gusts_10m || 0, dd.wind_gusts_10m_max?.[0] || 0);
               return v && v >= (+r.valor || 70) ? { valor:Math.round(v) } : null; } },
  semana:  { n:'Todas las semanas, un día y hora', ic:'calendar', c:'brand', campo:['semana'],
             titulo:'Recordatorio del barrio', texto:'Escribí acá el recordatorio.',
             frase:r => `es ${DIAS_SEMANA[+r.dia || 0]} a las ${r.hora || '20:00'} h`,
             ver:r => new Date().getDay() === (+r.dia || 0) && ahoraMin() >= minutosDe(r.hora || '20:00') ? {} : null },
  reclamo: { n:'Entra un reclamo de un tema', ic:'clipboard', c:'warn', campo:['tema'], porCosa:true,
             titulo:'Entró un reclamo de {tema}', texto:'Hay un reclamo nuevo de {tema}. La Administración ya lo está viendo.',
             frase:r => `entra un reclamo de ${((typeof CAT_RECL !== 'undefined' && CAT_RECL[r.tema]) || ['un tema'])[0].toLowerCase()}`,
             cosas:(r, s) => aLista(s.reclamos).filter(x => x && x.categoria === r.tema && x.createdAt >= (r.desde || 0))
               .map(x => ({ id:x.id, datos:{ tema:((typeof CAT_RECL !== 'undefined' && CAT_RECL[x.categoria]) || ['Otro'])[0].toLowerCase() } })) },
  obra:    { n:'Una obra avisa trabajos para hoy', ic:'wrench', c:'wood', calle:true, porCosa:true,
             titulo:'Hoy hay trabajos en {lote}', texto:'{detalle}{hora}. Puede haber camiones y ruido en la calle: ¡gracias por la paciencia!',
             frase:() => 'una obra avisa trabajos para hoy',
             cosas:(r, s, hoy) => aLista(s.obras).filter(o => o && o.avisoHoy?.fecha === hoy)
               .map(o => ({ id:o.id + '-' + hoy, lote:o.afuera ? '' : o.casa, datos:{ lote:(typeof enObra === 'function' ? enObra(o) : o.casa) || 'una obra', detalle:o.avisoHoy.texto || 'Trabajos de obra', hora:o.avisoHoy.hora ? ' desde las ' + o.avisoHoy.hora + ' h' : '' } })) },
};
const DESTINOS_REGLA = [
  ['todos', 'Todos los vecinos', 'users'], ['calle', 'Solo los vecinos de esa calle', 'pin'],
  ['garita', 'La garita', 'gate'], ['admin', 'La Administración', 'sliders'], ['pizarron', 'Publicar en el pizarrón', 'muro'],
];
/* Ideas listas: un toque y queda armada (después se puede cambiar). */
/* La app ya trae avisos de nieve (a todos, 18 h), helada (a la garita, 6 h) y
   viento (pizarrón): las ideas los completan, no los repiten. */
const YA_VIENE = { nieve:'clima-nieve', helada:'clima-hielo', viento:'clima-viento' };
const IDEAS_REGLA = [
  { disparo:'nieve', valor:10, para:['garita', 'admin'], titulo:'Nevada fuerte mañana: preparar el quitanieve', texto:'Se esperan {valor} cm de nieve para el {fecha}. Coordinar el quitanieve y la sal para las subidas.' },
  { disparo:'helada', valor:-2, para:['todos'], titulo:'Mañana hiela fuerte: cuidado al salir', texto:'Mañana la mínima es de {valor} °C. Las subidas y las veredas pueden amanecer con hielo: salí con tiempo y con cuidado.' },
  { disparo:'obra', para:['calle'] },
  { disparo:'reclamo', tema:'seguridad', para:['garita'] },
];
const reglasPropias = () => aLista(Store.s?.config?.reglasPropias).filter(r => r && DISPAROS[r.disparo]);
const textoRegla = (t, d) => String(t || '').replace(/\{(\w+)\}/g, (m, k) => d[k] != null ? d[k] : m);
const fraseRegla = r => {
  const p = aLista(r.para).map(k => (DESTINOS_REGLA.find(x => x[0] === k) || [])[1]).filter(Boolean).map(t => t.charAt(0).toLowerCase() + t.slice(1));
  return `Cuando <b>${esc(DISPAROS[r.disparo].frase(r))}</b> → ${p.length ? esc(p.join(', ').replace(/, ([^,]*)$/, ' y $1')) : 'no avisa a nadie'}`;
};
/* Los vecinos que viven sobre la misma calle que un lote (por la dirección del padrón). */
function vecinosDeLaCalle(casa){
  const calles = l => String((typeof lote === 'function' && lote(String(l || '').replace(/^Lote\s*/i, ''))?.dir) || '').split(' y ').map(x => x.replace(/\s*[\d/]+\s*$/, '').trim()).filter(Boolean);
  const mias = calles(casa); if (!mias.length) return [];
  return aLista(Store.s.users).filter(u => u && u.estado === 'aprobado' && /^Lote\s/i.test(u.casa || '') && u.casa !== casa && calles(u.casa).some(c => mias.includes(c))).map(u => u.id);
}
/* Lo que hace una regla cuando se cumple. */
function actuarRegla(s, r, datos, cosa){
  const fecha = typeof fechaLarga === 'function' ? fechaLarga(sumarDias(hoyISO(), 1)).toLowerCase() : '';
  const d = { fecha, ...datos }, titulo = textoRegla(r.titulo, d), texto = textoRegla(r.texto, d), para = aLista(r.para);
  const base = { titulo, texto, icon:DISPAROS[r.disparo].ic, color:DISPAROS[r.disparo].c, link:'' };
  if (para.includes('todos')) notificar(s, { ...base, para:'todos', vence:finDelDia(hoyISO()) });
  else if (para.includes('calle') && cosa?.lote){ const ids = vecinosDeLaCalle(cosa.lote); if (ids.length) notificar(s, { ...base, para:ids }); }
  if (para.includes('garita')) notificar(s, { ...base, para:'rol:guardia', link:'garita' });
  if (para.includes('admin')) notificar(s, { ...base, para:'rol:admin' });
  if (para.includes('pizarron')) publicarSistema(s, 'aviso', titulo, texto);
}
/* La regla del motor que corre todas las de la Administración. */
REGLAS.push({ id:'reglas-propias', n:'Mis reglas ("cuando pasa esto → hacé esto")', d:'Las que arma la Administración más abajo, en "Mis reglas". Apagando esta, se apagan todas.',
  run(s, hoy){ let n = 0;
    reglasPropias().filter(r => r.activa !== false).forEach(r => { const D = DISPAROS[r.disparo];
      if (D.porCosa) D.cosas(r, s, hoy).forEach(c => { n += marca(s, `rp-${r.id}-${c.id}`, () => actuarRegla(s, r, c.datos, c)); });
      else { const datos = D.ver(r); if (datos) n += marca(s, `rp-${r.id}-${hoy}`, () => actuarRegla(s, r, datos)); }
    });
    return n; } });

/* ---------- la pantalla: "Mis reglas" en Automatizaciones ---------- */
function reglasPropiasHTML(){
  const ls = reglasPropias();
  return `<div class="rp-cab"><span class="rp-ic">${I('zap')}</span><div class="grow"><b>Mis reglas</b><small>Cuando pasa algo, la app avisa sola. Se arman eligiendo, sin programar.</small></div>
      <button class="btn btn-sm btn-pri" data-a="regla-nueva">${I('plus')}Armar una regla</button></div>
    ${ls.length ? ls.map(r => { const D = DISPAROS[r.disparo];
      return `<div class="rp-card ${r.activa === false ? 'apagada' : ''}" style="--c:var(--${D.c})"><span class="rp-d">${I(D.ic)}</span>
        <div class="grow"><p class="rp-frase">${fraseRegla(r)}</p><small class="rp-msj">«${esc(r.titulo)}»</small>
          <div class="btns"><button class="btn btn-xs btn-sec" data-a="regla-probar" data-id="${r.id}">${I('eye')}Probar</button><button class="btn btn-xs btn-sec" data-a="regla-nueva" data-id="${r.id}">${I('edit')}Editar</button><button class="btn btn-xs btn-danger-soft" data-a="regla-borrar" data-id="${r.id}">${I('trash')}</button></div></div>
        <label class="check rp-sw" title="Encendida o apagada"><input type="checkbox" data-a="regla-onoff" data-id="${r.id}" ${r.activa === false ? '' : 'checked'}></label></div>`; }).join('')
      : `<div class="rp-ideas"><p class="muted small" style="margin:0 0 8px">Ideas para empezar (un toque y queda armada; después la cambiás como quieras):</p>
        ${IDEAS_REGLA.map((x, i) => `<button class="rp-idea" data-a="regla-idea" data-v="${i}" style="--c:var(--${DISPAROS[x.disparo].c})"><span>${I(DISPAROS[x.disparo].ic)}</span>${fraseRegla(x)}</button>`).join('')}</div>`}
    ${sec('Las que vienen con la app')}`;
}
A['regla-idea'] = el => { const x = IDEAS_REGLA[+el.dataset.v]; if (!x) return; const D = DISPAROS[x.disparo];
  guardarRegla({ id:uid(), activa:true, desde:Date.now(), titulo:D.titulo, texto:D.texto, dia:1, hora:'20:00', ...x });
  toast('Regla armada. Tocá "Probar" para ver el aviso', 'zap'); };
function guardarRegla(r){
  Store.cambiar(s => { s.config.reglasPropias = s.config.reglasPropias && typeof s.config.reglasPropias === 'object' && !Array.isArray(s.config.reglasPropias) ? s.config.reglasPropias : {};
    s.config.reglasPropias[r.id] = r;
    auditar(s, 'Armó o cambió una regla automática', DISPAROS[r.disparo].n, r.id); });
}
A['regla-nueva'] = el => {
  const r = reglasPropias().find(x => x.id === el?.dataset?.id) || { id:'', disparo:'nieve', valor:2, dia:1, hora:'20:00', tema:'seguridad', para:['todos'], titulo:DISPAROS.nieve.titulo, texto:DISPAROS.nieve.texto };
  const solo = k => `data-solo="${k}" ${r.disparo === k || (Array.isArray(k) && k.includes(r.disparo)) ? '' : 'hidden'}`;
  hoja(r.id ? 'Cambiar la regla' : 'Armar una regla', `<form data-f="regla" data-id="${esc(r.id)}" class="rp-form">
    <div class="rp-paso"><span>1</span><b>Cuando…</b></div>
    <div class="rp-opciones" id="rpDisparo">${Object.entries(DISPAROS).map(([k, D]) => `<label style="--c:var(--${D.c})"><input type="radio" name="disparo" value="${k}" ${r.disparo === k ? 'checked' : ''}><span>${I(D.ic)}${esc(D.n)}</span></label>`).join('')}</div>
    <div class="grid2">
      ${['nieve', 'helada', 'viento'].map(k => `<div class="field" ${solo(k)}><label>${esc(DISPAROS[k].campo[1])}</label><input type="number" step="1" name="valor_${k}" value="${esc(r.disparo === k ? r.valor : DISPAROS[k].campo[2])}"></div>`).join('')}
      <div class="field" ${solo('semana')}><label>Día</label><select name="dia">${DIAS_SEMANA.map((d, i) => `<option value="${i}" ${+r.dia === i ? 'selected' : ''}>${d}</option>`).join('')}</select></div>
      <div class="field" ${solo('semana')}><label>Hora</label><input type="time" name="hora" value="${esc(r.hora || '20:00')}"></div>
      <div class="field" ${solo('reclamo')}><label>Tema del reclamo</label><select name="tema">${Object.entries(typeof CAT_RECL !== 'undefined' ? CAT_RECL : {}).map(([k, c]) => `<option value="${k}" ${r.tema === k ? 'selected' : ''}>${esc(c[0])}</option>`).join('')}</select></div>
    </div>
    ${Object.entries(YA_VIENE).map(([k, id]) => { const R0 = REGLAS.find(x => x.id === id); return R0 ? `<p class="rp-nota" ${solo(k)}>${I('info')}<span>La app ya trae <b>«${esc(R0.n)}»</b>${motorActivo(id) ? ' (encendida)' : ' (apagada)'}. Usá esta para un aviso distinto o para otras personas, así no llegan dos iguales.</span></p>` : ''; }).join('')}
    <div class="rp-paso"><span>2</span><b>Avisarle a…</b></div>
    <div class="rp-destinos">${DESTINOS_REGLA.map(([k, t, ic]) => `<label ${k === 'calle' ? solo('obra') : ''}><input type="checkbox" name="para" value="${k}" ${aLista(r.para).includes(k) ? 'checked' : ''}><span>${I(ic)}${esc(t)}</span></label>`).join('')}</div>
    <div class="rp-paso"><span>3</span><b>El mensaje</b></div>
    <div class="field"><label>Título</label><input name="titulo" id="rpTitulo" required maxlength="80" value="${esc(r.titulo)}"></div>
    <div class="field"><label>Texto</label><textarea name="texto" id="rpTexto" required maxlength="400">${esc(r.texto)}</textarea>
      <div class="ayuda">Podés usar {fecha} (la de mañana) y, según la regla, {valor}, {tema}, {lote}, {detalle} y {hora}: la app los completa sola.</div></div>
    <button class="btn btn-pri btn-block">${I('check')}Guardar la regla</button></form>`);
};
/* Al cambiar el "cuándo": se muestran sus datos y, si el mensaje era uno de ejemplo, se escribe el del nuevo. */
document.addEventListener('change', e => {
  if (e.target.name !== 'disparo' || !e.target.closest('.rp-form')) return;
  const k = e.target.value, f = e.target.form;
  f.querySelectorAll('[data-solo]').forEach(x => { x.hidden = x.dataset.solo !== k; });
  const t = f.querySelector('#rpTitulo'), x = f.querySelector('#rpTexto'), ejemplos = Object.values(DISPAROS);
  if (!t.value.trim() || ejemplos.some(D => D.titulo === t.value)) t.value = DISPAROS[k].titulo;
  if (!x.value.trim() || ejemplos.some(D => D.texto === x.value)) x.value = DISPAROS[k].texto;
});
F['regla'] = (d, form) => {
  const k = d.disparo, para = [].concat(d.para || []).filter(p => p !== 'calle' || k === 'obra');
  if (!para.length) return toast('Elegí a quién avisarle', 'users');
  const viejo = reglasPropias().find(x => x.id === form.dataset.id);
  guardarRegla({ id:form.dataset.id || uid(), activa:viejo ? viejo.activa : true, desde:viejo?.desde || Date.now(), disparo:k, para,
    valor: ['nieve', 'helada', 'viento'].includes(k) ? +d['valor_' + k] : null, dia:+d.dia || 0, hora:d.hora || '20:00', tema:d.tema || '',
    titulo:d.titulo.trim(), texto:d.texto.trim() });
  cerrarHoja(); toast('Regla guardada: la app la aplica sola', 'zap');
};
A['regla-onoff'] = el => { setTimeout(() => { const r = reglasPropias().find(x => x.id === el.dataset.id); if (r) guardarRegla({ ...r, activa:el.checked }); }, 0); return true; };
A['regla-borrar'] = async el => {
  const r = reglasPropias().find(x => x.id === el.dataset.id); if (!r) return;
  if (!await confirmar('Borrar la regla', `${fraseRegla(r)}. Deja de aplicarse.`, { si:'Borrar', peligro:true })) return;
  Store.cambiar(s => { if (s.config.reglasPropias) delete s.config.reglasPropias[r.id]; auditar(s, 'Borró una regla automática', DISPAROS[r.disparo].n, r.id); });
  toast('Regla borrada', 'trash');
};
/* Muestra el aviso tal como llegaría, con datos de ejemplo, sin mandar nada. */
A['regla-probar'] = el => {
  const r = reglasPropias().find(x => x.id === el.dataset.id); if (!r) return;
  const D = DISPAROS[r.disparo], ahora = D.porCosa ? null : D.ver(r);
  const ej = { fecha:fechaLarga(sumarDias(hoyISO(), 1)).toLowerCase(), valor: ahora?.valor ?? r.valor ?? '', tema:'seguridad', lote:'Lote 23', detalle:'Llega el hormigón', hora:' desde las 9 h', ...(ahora || {}) };
  const dest = r.para.includes('calle') ? 'los vecinos de la misma calle de la obra' : '';
  hoja('Así llegaría el aviso', `<div class="rp-prueba" style="--c:var(--${D.c})"><span>${I(D.ic)}</span><div><b>${esc(textoRegla(r.titulo, ej))}</b><p>${esc(textoRegla(r.texto, ej))}</p></div></div>
    <p class="small" style="margin:12px 2px 0">${fraseRegla(r)}${dest ? ` (${esc(dest)})` : ''}.</p>
    <p class="muted small" style="margin:8px 2px 0">${I('info')} ${D.porCosa ? 'Es un ejemplo: se manda solo cuando pase.' : ahora ? '<b>Hoy se cumple</b>: el motor lo manda la próxima vez que corra (una sola vez por día).' : 'Hoy no se cumple: se manda solo el día que pase, una sola vez.'} No se mandó nada.</p>`);
};
