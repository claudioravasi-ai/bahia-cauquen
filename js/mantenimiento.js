/* =========================================================
   EL PERSONAL DE MANTENIMIENTO DEL BARRIO (pedido de Claudio, 14-10-2026)
   "Que la garita le pueda dar entrada al personal de mantenimiento del
   barrio: nombre, apellido y DNI se cargan una vez, quedan grabados y se
   pueden editar; la entrada y la salida se marcan con un solo botón."
   Y después: "que cuando los chicos de mantenimiento estén trabajando en el
   barrio se muestre un loguito en la app, y desaparezca cuando la garita
   marca su salida".

   QUÉ SE GUARDA Y QUIÉN LO VE (protección de datos, Ley 25.326)
   · /staff/mantenimiento: nombre, apellido, DNI y (si se quiere) la tarea
     de cada persona, y si está adentro desde qué hora. Lo leen y lo
     escriben SOLO la garita y la Administración. La supervisión no lo baja
     (ve las entradas y salidas en la bitácora, con el nombre y sin el DNI).
   · Cada entrada y salida va a la bitácora con el nombre y la tarea, nunca
     con el DNI.
   · A los vecinos les llega solo "hay N de mantenimiento trabajando, desde
     las X h", dentro del registro público de la guardia de ahora
     (/barrio/guardiaAhora, js/guardia.js): sin nombres ni DNI.
   · "Borrar" lo saca de la lista para siempre (con su DNI); lo que ya
     entró y salió queda en la bitácora, sin DNI.

   Ideas de apps con más de 1000 estrellas en GitHub (solo la idea, código
   propio): el reloj fichador con contador que corre de Kimai (5k★) y Super
   Productivity (22.8k★), y la línea de tiempo del día de timesheet.js (7k★).
   ========================================================= */
const mantLista = () => aLista(Store.s.mantenimiento).filter(x => x && x.id);
const mantAdentro = () => mantLista().filter(x => x.adentro);
const mantNombre = m => `${m.nombre || ''} ${m.apellido || ''}`.trim();
const mantIniciales = m => ((m.nombre || '?')[0] + (m.apellido || '')[0] || '').toUpperCase();
const mantDniLindo = d => String(d || '').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
/* En la tarjeta (que se ve desde la ventanilla) el DNI va tapado; entero, en "Editar". */
const mantDniTapado = d => d ? '••• ' + String(d).slice(-3) : '';
const mantTono = m => { let h = 0; String(m.id).split('').forEach(c => { h = (h * 31 + c.charCodeAt(0)) % 360; }); return h; };
const mantDur = ms => { const min = Math.max(0, Math.round(ms / MIN)); return min < 60 ? `${min} min` : `${Math.floor(min / 60)} h ${String(min % 60).padStart(2, '0')} min`; };
const MANT_TAREAS = ['Mantenimiento general', 'Jardinería y parque', 'Electricidad', 'Plomería y agua', 'Limpieza', 'Calles y nieve', 'Portón y barrera'];
const MANT_OLVIDO = 12 * HORA;   /* más de 12 h adentro: ¿se olvidaron de marcar la salida? */

/* Las entradas y salidas de hoy de una persona, de la bitácora. Devuelve
   los tramos [desde, hasta] (el último, si sigue adentro, hasta ahora). */
function mantTramosHoy(m){
  const ini = new Date(); ini.setHours(0, 0, 0, 0);
  const movs = aLista(Store.s.bitacora).filter(b => b && b.mantId === m.id && b.at >= +ini).sort((a, b) => a.at - b.at);
  const out = []; let abierto = 0;
  movs.forEach(b => { if (b.mov === 'in') abierto = b.at; else if (b.mov === 'out'){ out.push([abierto || +ini, b.at]); abierto = 0; } });
  if (m.adentro) out.push([Math.max(+ini, m.adentro), Date.now()]);
  return out;
}
const mantHorasHoy = m => mantTramosHoy(m).reduce((k, [a, b]) => k + (b - a), 0);
/* La barrita del día, de 6 a 22 h, con un tramo de color por cada vez que estuvo adentro. */
function mantBarra(m){
  const d0 = new Date(); d0.setHours(6, 0, 0, 0); const largo = 16 * HORA;
  const pos = t => Math.min(100, Math.max(0, (t - d0) / largo * 100));
  const tr = mantTramosHoy(m).map(([a, b]) => `<i style="left:${pos(a).toFixed(1)}%;width:${Math.max(1.2, pos(b) - pos(a)).toFixed(1)}%"></i>`).join('');
  return `<span class="mt-barra" aria-hidden="true">${tr}<b style="left:${pos(Date.now()).toFixed(1)}%"></b></span>`;
}

/* El engranaje dibujado (dientes = un trazo punteado), para la cabecera y el logo. */
const mantEngranaje = (cls = '') => `<svg class="mt-gear ${cls}" viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="11" fill="none" stroke="currentColor" stroke-width="5" stroke-dasharray="4.3 4.34"/><circle cx="16" cy="16" r="9" fill="currentColor"/><circle cx="16" cy="16" r="3.6" fill="var(--mt-hueco,#ff5e62)"/></svg>`;

function tarjetaMant(m, opera, i = 0){
  const on = !!m.adentro, h = mantTono(m), hoy = mantHorasHoy(m), olvido = on && Date.now() - m.adentro > MANT_OLVIDO;
  const estado = on ? `<em class="mt-vivo" data-mt-desde="${m.adentro}">Adentro hace ${mantDur(Date.now() - m.adentro)}</em><small class="mt-desde">entró ${hora(m.adentro)} h</small>`
    : `<em class="mt-fuera">${hoy ? `Afuera · hoy trabajó ${mantDur(hoy)}` : 'Afuera'}</em>`;
  return `<div class="mt-p${on ? ' on' : ''}${olvido ? ' olvido' : ''}" style="--h:${h};--i:${i}">
    <span class="mt-av" data-a="mv-desplegar" data-id="${esc(m.id)}" role="button" aria-label="Ver dónde está ${esc(mantNombre(m))}"><b>${esc(mantIniciales(m))}</b></span>
    <span class="mt-d"><button type="button" class="mt-nom${typeof MVDesp !== 'undefined' && MVDesp.mid === m.id ? ' abierto' : ''}" data-a="mv-desplegar" data-id="${esc(m.id)}" aria-expanded="${typeof MVDesp !== 'undefined' && MVDesp.mid === m.id}"><b>${esc(mantNombre(m))}</b>${I('right')}</button><small>${esc(m.tarea || 'Mantenimiento')} · DNI ${esc(mantDniTapado(m.dni))}</small>${estado}${mantChipLugar(m, on)}
      ${olvido ? `<small class="mt-ojo">${I('alert')}¿Se olvidaron de marcar la salida?</small>` : ''}${on && typeof mvChipsTarjeta === 'function' ? mvChipsTarjeta(m) : ''}${mantBarra(m)}</span>
    <span class="mt-acc">
      ${opera ? `<button type="button" class="mt-btn ${on ? 'sale' : 'entra'}" data-a="mt-mov" data-id="${esc(m.id)}" aria-label="${on ? 'Marcar la salida' : 'Marcar la entrada'} de ${esc(mantNombre(m))}">${I(on ? 'logout' : 'login')}<span>${on ? 'Salida' : 'Entrada'}</span></button>` : ''}
      <button type="button" class="mt-ed" data-a="mt-editar" data-id="${esc(m.id)}" aria-label="Editar a ${esc(mantNombre(m))}">${I('edit')}</button></span></div>`;
}

/* En la garita: la banda de color con el personal y sus botones. La garita
   marca entradas y salidas; la Administración mira y puede editar. */
function bandaMantenimiento(opera){
  if (!esStaff()) return '';
  const ls = mantLista().sort((a, b) => (!!b.adentro - !!a.adentro) || mantNombre(a).localeCompare(mantNombre(b), 'es'));
  const n = ls.filter(m => m.adentro).length;
  if (!ls.length && !opera) return '';
  /* PLEGADA (pedido de Claudio, 23-10-2026: "dejalo solo en título y si uno quiere verlo, que se
     despliegue"). Arriba queda el título con cuántos hay adentro; la lista y los botones, al tocarla.
     data-k: al redibujar queda como la dejó la garita. */
  return `<details class="mt" id="garMant" data-k="garMant" aria-label="Personal de mantenimiento">
    <summary class="mt-cab">
      <span class="mt-escena" aria-hidden="true">${mantEngranaje('g1')}${mantEngranaje('g2')}<span class="mt-llave">${I('wrench')}</span></span>
      <span class="mt-tit"><small>Personal de mantenimiento</small><b>${n ? `${plural(n, 'trabajando', 'trabajando')} en el barrio` : ls.length ? 'Nadie adentro' : 'Cargalos una sola vez'}</b>
        <span>${ls.length ? `${plural(ls.length, 'persona')} en la lista · tocá para ${opera ? 'marcar la entrada o la salida' : 'ver la lista'}` : 'Tocá para cargarlos: nombre, apellido y DNI.'}</span></span>
      ${n ? `<span class="mt-n" aria-label="${n} adentro">${n}</span>` : ''}
      <span class="mt-flecha" aria-hidden="true">${I('right')}</span>
    </summary>
    ${ls.length ? `<div class="mt-lista">${ls.map((m, i) => tarjetaMant(m, opera, i) + (typeof mvDespliegue === 'function' ? mvDespliegue(m) : '')).join('')}</div>` : ''}
    <div class="mt-pie">
      <button type="button" class="mt-mas" data-a="mt-editar">${I('plus')}Agregar a alguien</button>
      ${ls.length ? `<button type="button" class="mt-hist" data-a="abrir" data-v="mantenimiento">${I('clock')}Movimientos de hoy</button>` : ''}
      ${typeof R !== 'undefined' && R['mant-bitacora'] ? `<button type="button" class="mt-hist" data-a="abrir" data-v="mant-bitacora">${I('book')}Bitácora</button>` : ''}
      ${n && typeof mvPersonas === 'function' ? `<button type="button" class="mt-hist" data-a="mant-ver">${I('map')}En vivo</button>` : ''}</div>
  </details>`;
}

/* La ventana completa: buscador, la lista y los movimientos de hoy. */
R.mantenimiento = {
  titulo:'Personal de mantenimiento', icon:'wrench', color:'wood', ancha:true, sub:'Entradas y salidas de hoy',
  render(q){
    if (!esStaff()) return vacio('lock', 'Solo para la garita y la Administración.');
    const qq = normTxt(q || ''), opera = esGuardia();
    const ls = mantLista().filter(m => !qq || normTxt([mantNombre(m), m.dni, m.tarea].join(' ')).includes(qq))
      .sort((a, b) => (!!b.adentro - !!a.adentro) || mantNombre(a).localeCompare(mantNombre(b), 'es'));
    const ini = new Date(); ini.setHours(0, 0, 0, 0);
    const movs = aLista(Store.s.bitacora).filter(b => b && b.mantId && b.at >= +ini).sort((a, b) => b.at - a.at);
    return `<form data-f="buscar-mant" class="linea-form" style="margin:0 0 12px"><input name="q" value="${esc(q || '')}" placeholder="Nombre, apellido, DNI o tarea"><button class="btn btn-pri">${I('search')}</button></form>
      <button type="button" class="mt-mas solo" data-a="mt-editar">${I('plus')}Agregar a alguien</button>
      ${R['mant-bitacora'] ? `<div class="btns" style="margin:10px 0 0"><button type="button" class="btn btn-sm btn-sec" data-a="abrir" data-v="mant-bitacora">${I('book')}Bitácora de mantenimiento</button><button type="button" class="btn btn-sm btn-sec" data-a="mant-ver">${I('map')}En vivo</button></div>` : ''}
      ${sec('En la lista', `<span class="muted small">${ls.length} · ${mantAdentro().length} adentro</span>`)}
      ${ls.length ? `<div class="mt-lista sueltas">${ls.map(m => tarjetaMant(m, opera) + (typeof mvDespliegue === 'function' ? mvDespliegue(m) : '')).join('')}</div>` : vacio('wrench', qq ? 'Nadie coincide con la búsqueda.' : 'Todavía no hay nadie cargado.')}
      ${sec('Movimientos de hoy', `<span class="muted small">${movs.length}</span>`)}
      ${movs.length ? `<div class="mt-movs">${movs.map(b => `<div class="mt-mv ${b.mov === 'in' ? 'in' : b.mov === 'tarea' ? 'tarea' : 'out'}"><span>${I(b.mov === 'in' ? 'login' : b.mov === 'tarea' ? 'pin' : 'logout')}</span><b>${hora(b.at)} h</b><em>${esc(b.texto)}</em></div>`).join('')}</div>`
        : vacio('clock', 'Hoy todavía no entró nadie de mantenimiento.')}
      <p class="muted tiny" style="margin:14px 2px 0">El DNI lo ven solo la garita y la Administración. En la bitácora y en el aviso a los vecinos va sin DNI: los vecinos ven solo cuántos están trabajando.</p>`;
  },
};
F['buscar-mant'] = d => abrir('mantenimiento', d.q || '');

A['mt-editar'] = el => {
  if (!esStaff()) return;
  const m = mantLista().find(x => x.id === el.dataset.id) || {};
  hoja(m.id ? 'Editar personal de mantenimiento' : 'Agregar personal de mantenimiento', `<form data-f="mant" data-id="${esc(m.id || '')}" class="mt-form">
    <div class="mt-form-cab" style="--h:${m.id ? mantTono(m) : 28}"><span class="mt-av"><b>${m.id ? esc(mantIniciales(m)) : I('user')}</b></span><span>${m.id ? 'Los cambios quedan grabados para la próxima vez.' : 'Se carga <b>una sola vez</b>. Después, en la garita, un toque marca la entrada y otro la salida.'}</span></div>
    <div class="grid2"><div class="field"><label>Nombre</label><input name="nombre" required maxlength="40" autocomplete="off" value="${esc(m.nombre || '')}"></div>
      <div class="field"><label>Apellido</label><input name="apellido" required maxlength="40" autocomplete="off" value="${esc(m.apellido || '')}"></div></div>
    <div class="grid2"><div class="field"><label>DNI (solo números)</label><input name="dni" required inputmode="numeric" pattern="[0-9.]{7,10}" maxlength="10" autocomplete="off" value="${esc(mantDniLindo(m.dni || ''))}"></div>
      <div class="field"><label>Tarea (opcional)</label><input name="tarea" maxlength="40" list="mtTareas" value="${esc(m.tarea || '')}" placeholder="Jardinería, electricidad…"></div></div>
    <datalist id="mtTareas">${MANT_TAREAS.map(t => `<option>${esc(t)}</option>`).join('')}</datalist>
    <div class="grid2"><div class="field"><label>Celular (le llega el enlace por WhatsApp)</label><input name="tel" type="tel" inputmode="tel" maxlength="20" autocomplete="off" value="${esc(m.tel || '')}" placeholder="2901 15 123456"></div>
      <div class="field"><label>Correo (le llega el parte del día)</label><input name="email" type="email" inputmode="email" maxlength="80" autocomplete="off" value="${esc(m.email || '')}" placeholder="nombre@gmail.com"></div></div>
    <button class="btn btn-pri btn-block" style="margin-top:8px">${I('check')}${m.id ? 'Guardar los cambios' : 'Guardar'}</button>
    ${m.id ? `<button type="button" class="btn btn-danger-soft btn-block" style="margin-top:8px" data-a="mt-borrar" data-id="${esc(m.id)}">${I('trash')}Sacarlo de la lista</button>` : ''}
    <p class="muted tiny" style="margin:10px 2px 0">El DNI, el celular y el correo los ven solo la garita y la Administración. No van a la bitácora ni a los vecinos: los vecinos ven solo el nombre con la inicial del apellido y lo que está haciendo.</p></form>`);
};
F['mant'] = (d, form) => {
  if (!esStaff()) return;
  const id = form.dataset.id, dni = soloDigitos(d.dni), nombre = (d.nombre || '').trim(), apellido = (d.apellido || '').trim();
  if (!nombre || !apellido){ toast('Faltan el nombre o el apellido', 'alert'); return; }
  if (dni.length < 7 || dni.length > 8){ toast('El DNI tiene que tener 7 u 8 números', 'alert'); return; }
  const tel = String(d.tel || '').trim(), email = String(d.email || '').trim().toLowerCase();
  if (tel && typeof waNumeroAR === 'function' && !waNumeroAR(tel)){ toast('Revisá el celular: con la característica, por ejemplo 2901 15 123456', 'phone'); return; }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){ toast('Revisá el correo', 'mail'); return; }
  const otro = mantLista().find(x => x.dni === dni && x.id !== id);
  if (otro){ toast(`Ese DNI ya está cargado: ${mantNombre(otro)}`, 'alert'); return; }
  Store.cambiar(s => {
    s.mantenimiento = aLista(s.mantenimiento);
    let m = s.mantenimiento.find(x => x && x.id === id);
    if (!m){ m = { id:'mt' + uid(), adentro:0, createdAt:Date.now(), por:yo().id }; s.mantenimiento.push(m); }
    Object.assign(m, { nombre, apellido, dni, tarea:(d.tarea || '').trim(), tel, email, updatedAt:Date.now() });
    /* La auditoría lleva el nombre, no el DNI. */
    auditar(s, id ? 'Editó personal de mantenimiento' : 'Agregó personal de mantenimiento', `${nombre} ${apellido}`, m.id);
  });
  cerrarHoja(); toast(id ? 'Cambios guardados' : `Quedó en la lista: ${nombre} ${apellido}`, 'check');
};
A['mt-borrar'] = async el => {
  if (!esStaff()) return;
  const m = mantLista().find(x => x.id === el.dataset.id); if (!m) return;
  if (!await confirmar('Sacar de la lista', `${esc(mantNombre(m))}${m.adentro ? ' <b>figura adentro del barrio</b>.' : '.'} Se borran sus datos (también el DNI). Lo que ya entró y salió queda en la bitácora, sin el DNI.`, { si:'Sacarlo', peligro:true })) return;
  Store.cambiar(s => { s.mantenimiento = aLista(s.mantenimiento).filter(x => x && x.id !== m.id); auditar(s, 'Sacó de la lista a personal de mantenimiento', mantNombre(m), m.id); });
  toast('Sacado de la lista', 'trash');
};

/* UN TOQUE: si está afuera, entra; si está adentro, sale. */
A['mt-mov'] = el => {
  if (!esGuardia()) return;
  const m = mantLista().find(x => x.id === el.dataset.id); if (!m) return;
  const entra = !m.adentro, ahora = Date.now(), desde = m.adentro;
  mantFiesta(el, entra);
  Store.cambiar(s => {
    const x = aLista(s.mantenimiento).find(z => z && z.id === m.id); if (!x) return;
    const estuvo = x.adentro ? ahora - x.adentro : 0;
    x.adentro = entra ? ahora : 0; x.ultMov = ahora;
    s.bitacora.unshift({ id:uid(), autor:yo().id, tipo:'acceso', mantId:m.id, mov: entra ? 'in' : 'out', at:ahora,
      texto:`${entra ? 'Entrada' : 'Salida'} de mantenimiento: ${mantNombre(m)}${m.tarea ? ' (' + m.tarea + ')' : ''}${!entra && estuvo ? ' · estuvo ' + mantDur(estuvo) : ''}` });
    /* El brazo de mantenimiento en vivo (js/mant-vivo.js): la entrada crea
       su enlace; la salida lo apaga y guarda la jornada. */
    if (entra && typeof mvEntrada === 'function') mvEntrada(s, x, ahora);
  });
  toast(entra ? `${m.nombre} entró · ${hora(ahora)} h` : `${m.nombre} salió · ${hora(ahora)} h`, entra ? 'login' : 'logout');
  if (typeof mvMandarEnlace !== 'function') return;
  if (entra) mvMandarEnlace(m, { auto:true });
  else mvSalida(m, desde, ahora);
};
/* La chispa al tocar: anillo y papelitos que saltan desde el botón. Va en
   una capa aparte, así sigue aunque la tarjeta se redibuje. */
function mantFiesta(el, entra){
  try { navigator.vibrate && navigator.vibrate(entra ? 25 : [15, 40, 15]); } catch(e){}
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const r = el.getBoundingClientRect(), fx = document.createElement('div');
  fx.className = 'mt-fx ' + (entra ? 'entra' : 'sale');
  fx.style.left = (r.left + r.width / 2) + 'px'; fx.style.top = (r.top + r.height / 2) + 'px';
  const cols = entra ? ['#22c55e', '#facc15', '#14b8a6', '#a3e635'] : ['#f97316', '#ef4444', '#f472b6', '#facc15'];
  fx.innerHTML = '<span class="mt-fx-ring"></span>' + Array.from({ length:16 }, (_, i) => {
    const ang = i / 16 * Math.PI * 2, dist = 46 + Math.random() * 38;
    return `<i style="--dx:${(Math.cos(ang) * dist).toFixed(0)}px;--dy:${(Math.sin(ang) * dist).toFixed(0)}px;--c:${cols[i % 4]};--r:${Math.round(Math.random() * 360)}deg"></i>`;
  }).join('');
  document.body.appendChild(fx);
  setTimeout(() => fx.remove(), 900);
}
/* El "adentro hace…" corre solo, sin redibujar la pantalla. */
setInterval(() => {
  document.querySelectorAll('[data-mt-desde]').forEach(e => { const t = 'Adentro hace ' + mantDur(Date.now() - Number(e.dataset.mtDesde)); if (e.textContent !== t) e.textContent = t; });
  document.querySelectorAll('[data-mh-desde]').forEach(e => { const t = 'hace ' + mantDur(Date.now() - Number(e.dataset.mhDesde)); if (e.textContent !== t) e.textContent = t; });
}, 20000);

/* ---------- LO QUE VEN TODOS: el loguito "trabajando en el barrio" ----------
   La garita y la Administración lo arman de su lista; los demás lo leen del
   registro público de la guardia de ahora (js/guardia.js, campo "mant"). */
const mantBajada = () => typeof Nube === 'undefined' || !Nube.activa() || !!(Nube.listos && (Nube.listos.has('staffmantenimiento') || Nube.listos.has('staff/mantenimiento')));
function mantPublico(){
  /* Desde el 15-10-2026 también se publica quién está trabajando en
     barrio/mantVivo (js/mant-vivo.js), que lo leen también el hotel. */
  const pv = typeof mvPersonas === 'function' ? mvPersonas() : [];
  if (pv.length) return { n:pv.length, desde:Math.min(...pv.map(p => p.entra || Date.now())) };
  if (['guardia', 'admin'].includes(yo()?.rol) && mantBajada()){
    const ad = mantAdentro();
    return { n:ad.length, desde: ad.length ? Math.min(...ad.map(m => m.adentro)) : 0 };
  }
  const g = aLista(Store.s.guardiaAhora).find(x => x && x.id === 'ahora');
  if (!g || !g.mant) return { n:0, desde:0 };
  /* Si el registro quedó viejo (más de 16 h sin tocarse), no se muestra. */
  if (Date.now() - (g.mantDesde || g.at || 0) > 16 * HORA && Date.now() - (g.at || 0) > 16 * HORA) return { n:0, desde:0 };
  return { n:Number(g.mant) || 0, desde:g.mantDesde || 0 };
}
/* LA ISLA EN VIVO (rediseño, pedido de Claudio, 14-10-2026: "no me gusta el
   cartel, esmerate con un diseño innovador"). En vez de una franja con
   texto, una cápsula oscura como la "isla dinámica" de los teléfonos (ideas
   de Atoll, 5k★, y cult-ui, 6.5k★): se abre como una burbuja al aparecer,
   una luz de colores le recorre el borde (Border Beam de magicui, 22.7k★) y
   adentro hay una escena dibujada y animada como un Lottie (lottie-web,
   32k★): las montañas de Ushuaia, el cielo de la hora (sol de día, luna y
   estrellas de noche) y un operario por cada persona trabajando, con casco
   y chaleco: uno con la llave, otro con el rastrillo, otro con la
   carretilla. Al lado, cuántos son, el reloj que corre y los cascos.
   Todo dibujo propio, sin librerías. Sin nombres ni DNI. */
const mantEsNoche = () => { const h = new Date().getHours(); return h < 7 || h >= 20; };
/* Un operario de casco y chaleco. "herr": llave, rastrillo o carretilla. */
function mantOperario(x, herr, retraso, quieto){
  const piernas = `<rect class="mo-pi a" x="-2.9" y="-9" width="2.5" height="9" rx="1.2"/><rect class="mo-pi b" x=".4" y="-9" width="2.5" height="9" rx="1.2"/>`;
  const cuerpo = `<rect class="mo-chaleco" x="-4.2" y="-17.4" width="8.4" height="9.4" rx="2.6"/><rect class="mo-cinta" x="-4.2" y="-13.6" width="8.4" height="1.4"/>
    <circle class="mo-cara" cy="-20.4" r="3.2"/><path class="mo-casco" d="M-3.7 -21a3.7 3.7 0 0 1 7.4 0z"/><rect class="mo-ala" x="-4.6" y="-21.4" width="9.2" height="1.2" rx=".6"/>`;
  const tools = {
    llave: `<g class="mo-brazo golpe"><rect class="mo-manga" x="2.6" y="-16.6" width="2.2" height="7" rx="1.1"/><path class="mo-metal" d="M3.7 -9.6 l4.6 -4.6"/><circle class="mo-metal-o" cx="9" cy="-14.9" r="1.7"/></g>`,
    rastrillo: `<g class="mo-brazo"><rect class="mo-manga" x="2.6" y="-16.6" width="2.2" height="7" rx="1.1"/><path class="mo-palo" d="M3.7 -10 L11 0"/><path class="mo-metal" d="M8.6 .2 h5.4 M9.6 .2 v-1.6 M11.3 .2 v-1.6 M13 .2 v-1.6"/></g>`,
    carretilla: `<g class="mo-carro"><path class="mo-palo" d="M3 -11 L8 -6"/><path class="mo-batea" d="M7 -8 h11 l-2.4 5 h-7z"/><circle class="mo-rueda" cx="15.6" cy="-1.6" r="1.7"/><circle class="mo-carga" cx="11.5" cy="-8.6" r="1.6"/><circle class="mo-carga b" cx="13.8" cy="-8.8" r="1.3"/></g>`,
  };
  const camina = herr !== 'llave' && !quieto;
  return `<g transform="translate(${x} 52)"><g class="mo ${camina ? 'camina' : 'trabaja'}" style="animation-delay:${retraso}s">${piernas}${cuerpo}${tools[herr]}</g></g>`;
}
function mantEscena(n, { grande = false } = {}){
  const noche = mantEsNoche(), quieto = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const herrs = ['llave', 'rastrillo', 'carretilla'], xs = n === 1 ? [62] : n === 2 ? [40, 82] : [30, 62, 94];
  const cielo = noche ? `<circle class="me-luna" cx="98" cy="13" r="5"/><circle cx="96" cy="11.4" r="4.4" class="me-luna-sombra"/>${[[18, 10], [34, 18], [52, 8], [76, 15], [112, 24]].map(([x, y], i) => `<circle class="me-estrella" cx="${x}" cy="${y}" r=".8" style="animation-delay:${i * .4}s"/>`).join('')}`
    : `<g class="me-sol"><circle cx="98" cy="14" r="5.5"/>${Array.from({ length:8 }, (_, i) => `<path d="M98 14 m0 -8.6 v-2.6" transform="rotate(${i * 45} 98 14)"/>`).join('')}</g><g class="me-nube"><ellipse cx="30" cy="14" rx="7" ry="2.6"/><ellipse cx="34" cy="12" rx="4" ry="2.6"/></g>`;
  return `<svg class="me ${noche ? 'noche' : 'dia'} ${grande ? 'grande' : ''}" viewBox="0 0 124 64" preserveAspectRatio="${grande ? 'xMidYMid' : 'xMidYMax'} slice" aria-hidden="true">
    <rect class="me-cielo" width="124" height="64"/>${cielo}
    <path class="me-monte lejos" d="M0 40 L14 26 L24 33 L38 18 L52 31 L64 22 L80 34 L96 20 L110 30 L124 24 V64 H0Z"/>
    <path class="me-nieve" d="M34.6 21.6 L38 18 L41.6 21.4 L39.6 21 L38 22.4 L36.4 21.2Z M92.6 23.6 L96 20 L99.2 23.2 L97.4 22.8 L96 24 L94.4 23Z M61 24.6 L64 22 L67 24.4 L65.4 24.2 L64 25.2Z"/>
    <path class="me-monte cerca" d="M0 46 Q20 38 40 44 T80 42 T124 44 V64 H0Z"/>
    ${[[8, 46], [116, 45], [104, 47]].map(([x, y]) => `<path class="me-arbol" d="M${x} ${y - 10} l4 8 h-2.4 l3 5 h-9.2 l3 -5 h-2.4z"/>`).join('')}
    <rect class="me-suelo" y="52" width="124" height="12"/>
    <path class="me-senda" d="M0 57 H124"/>
    <g class="me-cono" transform="translate(${n === 2 ? 61 : 112} 52)"><path d="M-3.4 0 L-1 -8 H1 L3.4 0Z"/><path class="me-cono-b" d="M-2.2 -3.6 H2.2 L1.8 -5 H-1.8Z"/><rect x="-4.2" y="-.8" width="8.4" height="1.6" rx=".6"/></g>
    ${xs.slice(0, Math.min(3, n)).map((x, i) => mantOperario(x, herrs[i], -i * 1.3, quieto)).join('')}
  </svg>`;
}
function mantHero(){
  const p = mantPublico(); if (!p.n) return '';
  const cascos = Array.from({ length:Math.min(p.n, 4) }, (_, i) => `<i style="--k:${i}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 16a8 8 0 0 1 16 0z"/><rect x="2.5" y="15.4" width="19" height="3" rx="1.5"/><path class="mh-cr" d="M12 8.2v-1.4"/></svg></i>`).join('');
  return `<button type="button" class="mant-isla" data-a="mant-ver" aria-label="Mantenimiento trabajando en el barrio: ${plural(p.n, 'persona')}${p.desde ? ', desde las ' + hora(p.desde) + ' h' : ''}">
    <span class="mi-escena">${mantEscena(p.n)}</span>
    <span class="mi-txt"><small><i class="mi-punto"></i>Mantenimiento</small>
      <b>${p.n === 1 ? 'Trabajando ahora' : `${p.n} trabajando ahora`}</b>
      <span>${p.desde ? `desde ${hora(p.desde)} · <em data-mh-desde="${p.desde}">hace ${mantDur(Date.now() - p.desde)}</em>` : 'en el barrio'}</span></span>
    <span class="mi-cascos" aria-hidden="true">${cascos}${p.n > 4 ? `<b>+${p.n - 4}</b>` : ''}</span></button>`;
}
/* Tocar la isla abre "Mantenimiento en vivo" (el mapa con los trabajos y
   los mensajes): A['mant-ver'] está en js/mant-vivo.js. */

/* ---------- TAREA DEL DÍA Y LUGAR EN EL MAPA (pedido de Claudio, 14-10-2026) ----------
   "La garita ve dónde trabaja cada uno (plaza, portón, calle 3)". Idea de
   OpenProject (16.4k★, GPL: solo la idea): cada persona tiene su tarea del
   día con un lugar, y el lugar se ve en el mapa del barrio de la garita
   como un pin con su color, sus iniciales y un casco. Vale solo por el día
   (al día siguiente se vuelve a asignar). Lo asignan la garita o la
   Administración; queda una línea en la bitácora. */
const MANT_TAREAS_HOY = ['Corte de pasto', 'Poda', 'Limpieza de calles', 'Barrer nieve y sal', 'Arreglo de luminarias', 'Reparación del portón', 'Riego', 'Recolección de ramas', 'Pintura'];
function mantLugares(){
  const out = [
    { k:'garita', n:'Garita y portón', xy:() => typeof MAPA_GARITA !== 'undefined' ? MAPA_GARITA : null, g:'Lugares comunes' },
    { k:'verde', n:'Espacio verde', xy:() => typeof mapaP === 'function' ? mapaP(850, 312) : null, g:'Lugares comunes' },
    { k:'costa', n:'La costa del Canal', xy:() => typeof mapaP === 'function' ? mapaP(760, 438) : null, g:'Lugares comunes' },
    { k:'barrio', n:'Recorre todo el barrio', xy:() => null, g:'Lugares comunes' },
  ];
  if (typeof MAPA_CALLES !== 'undefined'){
    const vistas = new Set();
    MAPA_CALLES.filter(c => c.n && c.lbl && !c.afuera).forEach(c => { if (vistas.has(c.n)) return; vistas.add(c.n); out.push({ k:'calle:' + c.n, n:'Calle ' + c.n, xy:() => (MAPA_CALLES.find(x => x.n === c.n && x.lbl) || {}).lbl || null, g:'Calles' }); });
  }
  if (typeof MAPA_LOTES !== 'undefined') Object.keys(MAPA_LOTES).sort((a, b) => a.localeCompare(b, 'es', { numeric:true })).forEach(l => out.push({ k:'lote:' + l, n:'Lote ' + l, xy:() => MAPA_LOTES[l] ? [MAPA_LOTES[l].x, MAPA_LOTES[l].y] : null, g:'Frente a un lote' }));
  return out;
}
const mantHoy = m => m && m.hoy && m.hoy.fecha === hoyISO() ? m.hoy : null;
const mantLugarDe = k => mantLugares().find(x => x.k === k) || null;
function mantChipLugar(m, on){
  const h = mantHoy(m), L = h && h.lugar ? mantLugarDe(h.lugar) : null;
  if (h && (L || h.tarea)) return `<span class="mt-lugar"><button type="button" class="mt-chip" data-a="mt-lugar" data-id="${esc(m.id)}">${I('pin')}<span>${esc([L ? L.n : '', h.tarea].filter(Boolean).join(' · '))}</span></button>${L && L.xy() ? `<button type="button" class="mt-chip mapa" data-a="mt-ver-mapa" data-id="${esc(m.id)}" aria-label="Ver en el mapa">${I('map')}</button>` : ''}</span>`;
  return `<span class="mt-lugar"><button type="button" class="mt-chip vacio${on ? ' llama' : ''}" data-a="mt-lugar" data-id="${esc(m.id)}">${I('pin')}<span>¿Dónde trabaja hoy?</span></button></span>`;
}
A['mt-lugar'] = el => {
  if (!esStaff()) return;
  const m = mantLista().find(x => x.id === el.dataset.id); if (!m) return;
  const h = mantHoy(m) || {}, ls = mantLugares(), grupos = [...new Set(ls.map(x => x.g))];
  const fijos = ls.filter(x => x.g === 'Lugares comunes');
  hoja('Tarea de hoy', `<form data-f="mant-lugar" data-id="${esc(m.id)}" class="mt-form">
    <div class="mt-form-cab" style="--h:${mantTono(m)}"><span class="mt-av"><b>${esc(mantIniciales(m))}</b></span><span><b>${esc(mantNombre(m))}</b><br>Qué hace hoy y dónde: se ve en el mapa de la garita y en Mantenimiento en vivo de los vecinos. Vale solo por hoy.</span></div>
    <div class="field"><label>Tarea de hoy</label><input name="tarea" maxlength="50" list="mtTareasHoy" value="${esc(h.tarea || '')}" placeholder="Corte de pasto, poda, luminarias…"></div>
    <datalist id="mtTareasHoy">${MANT_TAREAS_HOY.map(t => `<option>${esc(t)}</option>`).join('')}</datalist>
    <div class="field"><label>¿Dónde?</label>
      <div class="mt-sitios">${fijos.map(x => `<label><input type="radio" name="rapido" value="${esc(x.k)}" ${h.lugar === x.k ? 'checked' : ''}><span>${I(x.k === 'garita' ? 'gate' : x.k === 'verde' ? 'tree' : x.k === 'costa' ? 'drop' : 'map')}${esc(x.n)}</span></label>`).join('')}</div>
      <select name="lugar" style="margin-top:8px"><option value="">… o elegí una calle o un lote</option>${grupos.filter(g => g !== 'Lugares comunes').map(g => `<optgroup label="${esc(g)}">${ls.filter(x => x.g === g).map(x => `<option value="${esc(x.k)}" ${h.lugar === x.k ? 'selected' : ''}>${esc(x.n)}</option>`).join('')}</optgroup>`).join('')}</select></div>
    <button class="btn btn-pri btn-block" style="margin-top:8px">${I('check')}Guardar la tarea de hoy</button>
    ${h.lugar || h.tarea ? `<button type="button" class="btn btn-sec btn-block" style="margin-top:8px" data-a="mt-lugar-quitar" data-id="${esc(m.id)}">${I('x')}Quitar la tarea de hoy</button>` : ''}</form>`);
  /* Elegir un lugar común borra la calle o el lote, y al revés. */
  const f = $('#hojaCuerpo form'); if (!f) return;
  f.addEventListener('change', e => { if (e.target.name === 'rapido') f.lugar.value = ''; if (e.target.name === 'lugar' && f.lugar.value) f.querySelectorAll('[name=rapido]').forEach(r => { r.checked = false; }); });
};
F['mant-lugar'] = (d, form) => {
  if (!esStaff()) return;
  const id = form.dataset.id, lugar = d.lugar || d.rapido || '', tarea = (d.tarea || '').trim().slice(0, 50);
  if (!lugar && !tarea){ toast('Elegí una tarea o un lugar', 'alert'); return; }
  const m = mantLista().find(x => x.id === id); if (!m) return;
  const L = mantLugarDe(lugar);
  Store.cambiar(s => {
    const x = aLista(s.mantenimiento).find(z => z && z.id === id); if (!x) return;
    x.hoy = { fecha:hoyISO(), tarea, lugar, at:Date.now() }; x.updatedAt = Date.now();
    mantHoyPublico(s, id);
    s.bitacora.unshift({ id:uid(), autor:yo().id, tipo:'acceso', mantId:id, mov:'tarea', at:Date.now(), texto:`Tarea de hoy de mantenimiento: ${mantNombre(m)} → ${[L ? L.n : '', tarea].filter(Boolean).join(' · ')}` });
  });
  cerrarHoja(); toast(`${m.nombre}: ${L ? L.n : tarea}`, 'pin');
};
A['mt-lugar-quitar'] = el => {
  if (!esStaff()) return;
  Store.cambiar(s => { const x = aLista(s.mantenimiento).find(z => z && z.id === el.dataset.id); if (x){ x.hoy = null; x.updatedAt = Date.now(); mantHoyPublico(s, x.id); } });
  cerrarHoja(); toast('Tarea de hoy quitada', 'x');
};
A['mt-ver-mapa'] = el => {
  const m = mantLista().find(x => x.id === el.dataset.id), h = mantHoy(m), L = h && mantLugarDe(h.lugar), xy = L && L.xy(); if (!xy) return;
  cerrarHoja(); abrir('mapa');
  setTimeout(() => { if (typeof mapaIr === 'function') mapaIr({ cx:xy[0], cy:xy[1], z:3 }); }, 750);
};
/* Los pines en el mapa de la garita: quien está adentro y tiene lugar hoy.
   Si varios trabajan en el mismo lugar, se ponen uno al lado del otro.
   Los vecinos, el hotel y la supervisión ven los mismos pines (pedido de
   Claudio, 16-10-2026: "lo tengo que ver igual que la garita"): la garita
   publica en barrio/mantVivo solo el nombre corto, el lugar y la tarea de
   hoy (sin DNI ni teléfono), y se borra con la salida. */
function mantPinesHoy(){
  if (esStaff()) return mantAdentro().map(m => ({ m, h:mantHoy(m), id:m.id, nombre:mantNombre(m), ini:mantIniciales(m), tono:mantTono(m), staff:true }));
  return typeof mvPersonas === 'function' ? mvPersonas().filter(p => p.hoy && p.hoy.fecha === hoyISO()).map(p => ({ h:p.hoy, id:p.mid, nombre:p.nombre, ini:String(p.nombre || '?').split(/\s+/).map(x => x[0] || '').join('').slice(0, 2).toUpperCase(), tono:mvTono(p.mid) })) : [];
}
function mantCapaPines(){
  const porLugar = {};
  mantPinesHoy().forEach(e => { const L = e.h && mantLugarDe(e.h.lugar), xy = L && L.xy(); if (!xy) return; (porLugar[e.h.lugar] = porLugar[e.h.lugar] || { xy, es:[] }).es.push(e); });
  /* Si dos pines caen casi en el mismo punto (el espacio verde y la calle de
     al lado), el segundo se corre hasta que no se tapan. */
  const puestos = [];
  const lugar = (x, y) => { let k = 0; while (k < 12 && puestos.some(([a, b]) => Math.abs(a - x) < 48 && Math.abs(b - y) < 44)){ x += 48; k++; } puestos.push([x, y]); return x; };
  const pins = Object.values(porLugar).flatMap(({ xy, es }) => es.map((e, i) => {
    const y = xy[1] - 20, x = lugar(xy[0] + (i - (es.length - 1) / 2) * 34, y), h = e.h, que = [mantLugarDe(h.lugar)?.n, h.tarea].filter(Boolean).join(', ');
    return `<g class="mt-pin" data-a="${e.staff ? 'mt-lugar' : 'mt-pin-ver'}" data-id="${esc(e.id)}" role="button" tabindex="0" style="--h:${e.tono}" transform="translate(${x} ${y}) scale(1.5) translate(${-x} ${-y})" aria-label="${esc(e.nombre)}: ${esc(que)}">
      <circle class="mp-onda" cx="${x}" cy="${y}" r="10"/>
      <path class="mp-gota" d="M${x} ${y + 15} C${x - 4} ${y + 9} ${x - 10} ${y + 5} ${x - 10} ${y} a10 10 0 1 1 20 0 C${x + 10} ${y + 5} ${x + 4} ${y + 9} ${x} ${y + 15}Z"/>
      <text class="mp-ini" x="${x}" y="${y + 2.6}">${esc(e.ini)}</text>
      <path class="mp-casco" d="M${x - 6} ${y - 7.6}a6 6 0 0 1 12 0z"/><rect class="mp-ala" x="${x - 7.4}" y="${y - 8.2}" width="14.8" height="2" rx="1"/>
      ${h.tarea ? `<text class="mp-tarea" x="${x}" y="${y + 24}">${esc(h.tarea.length > 16 ? h.tarea.slice(0, 15) + '…' : h.tarea)}</text>` : ''}</g>`; }));
  return pins.length ? `<g class="mt-pines">${pins.join('')}</g>` : '';
}
/* Quien ya tenía tarea de hoy antes de este cambio (o si algo quedó
   desparejo): la garita lo pone al día al dibujar su mapa. */
function mantHoyRevisar(){
  const clave = h => h ? `${h.lugar || ''}|${h.tarea || ''}` : '';
  const mal = mantAdentro().filter(m => { const p = typeof mvPersona === 'function' && mvPersona(m.id); if (!p) return false; const h = mantHoy(m); return clave(h) !== clave(p.hoy && p.hoy.fecha === hoyISO() ? p.hoy : null); });
  if (mal.length) Store.cambiar(s => mal.forEach(m => mantHoyPublico(s, m.id)));
}
function mantCapaMapa(){
  if (esStaff()) setTimeout(mantHoyRevisar, 0);
  return mantCapaPines() + (typeof mvCapaGarita === 'function' ? mvCapaGarita() : '');
}
/* El vecino toca el casco: quién es, dónde y qué hace hoy, y el botón para escribirle. */
A['mt-pin-ver'] = el => {
  const p = typeof mvPersona === 'function' && mvPersona(el.dataset.id); if (!p || !p.hoy) return;
  const L = mantLugarDe(p.hoy.lugar);
  hoja(p.nombre, `<div class="mv-ficha" style="--c:hsl(${mvTono(p.mid)} 85% 55%)"><span class="mv-ficha-emo">⛑️</span>
      <div class="grow"><b>${esc(p.hoy.tarea || 'Mantenimiento')}</b><small>${esc(L ? L.n : 'En el barrio')}</small></div>
      <span class="mv-estado curso"><i></i>Hoy</span></div>
    <p class="muted small" style="margin:10px 2px 0">Personal de mantenimiento del barrio · desde las ${hora(p.entra)} h</p>
    ${typeof mvPuedeEscribir === 'function' && mvPuedeEscribir() ? `<button class="btn btn-pri btn-block" style="margin-top:12px" data-a="mv-chat" data-mid="${esc(p.mid)}">${I('chat')}Mandarle un mensaje a ${esc(p.nombre)}</button>` : ''}`);
};
/* Lo que la garita publica para todos: copia el lugar y la tarea de hoy en "quién está trabajando". */
function mantHoyPublico(s, id){
  const x = aLista(s.mantenimiento).find(z => z && z.id === id), h = x && x.hoy && x.hoy.fecha === hoyISO() ? x.hoy : null;
  aLista(s.mantVivo).forEach(p => { if (p && p.tipo === 'p' && p.mid === id){ if (h) p.hoy = { fecha:h.fecha, lugar:h.lugar || '', tarea:h.tarea || '' }; else delete p.hoy; } });
}
