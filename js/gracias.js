/* =========================================================
   GRACIAS A QUIEN TRABAJA EN EL BARRIO (pedido de Claudio, 03-11-2026:
   "hacé la idea 1, Gracias").
   El vecino le deja un agradecimiento corto a un guardia de la garita, a
   toda la guardia, a la policía nocturna o a alguien de mantenimiento.

   CÓMO FUNCIONA
   · El vecino entra por "De guardia" (las caritas de la portada), por la
     tarjeta de cada persona de mantenimiento en vivo o por la teja
     "Agradecer a quien trabaja" de El barrio. Elige a quién, toca una
     frase hecha o escribe la suya (hasta 280 letras) y manda.
   · A la garita le llega el aviso (sin sonido) y lo ve en su portada
     durante el día; la supervisión y la Administración ven el mes entero,
     con quién recibió más (sirve para reconocer a los mejores).
   · Si es para alguien de mantenimiento, además le llega a su teléfono
     por el mensaje de siempre (mantChat), con un corazón adelante.
   · Uno por día por vecino (04-11-2026): después de agradecer, el botón de
     la portada desaparece hasta el día siguiente y las otras entradas avisan.

   PROTECCIÓN DE DATOS (Ley 25.326)
   · Se guarda en pv/gracias/<cuenta>/<id>: el vecino ve solo los suyos;
     la carpeta entera la leen la garita, la supervisión y la
     Administración. Ningún otro vecino ni el hotel.
   · Va con el nombre de pila, la inicial del apellido y el lote de quien
     agradece (no es anónimo: es un reconocimiento). De quien lo recibe va
     el nombre como lo anotó la garita; la policía, sin nombre.
   · Se borra solo a los 12 meses (lo hace la app de la Administración).
   · La Administración puede borrar uno que no corresponda.
   ========================================================= */
const GR_MAX = 280;
const GR_GUARDA = 365 * DIA;
const GR_FRASES = ['Gracias por la atención', 'Gracias por la ayuda', 'Gracias por cuidarnos', 'Siempre tan amable', 'Gracias por el trabajo en el barrio'];
const GR_TIPOS = {
  guardia: { n:'Guardia de la garita', icon:'shield', c:'brand' },
  garita:  { n:'Todos los turnos de la garita', icon:'gate', c:'brand' },
  policia: { n:'Policía nocturna · sin su nombre', icon:'moon', c:'sky' },
  mant:    { n:'Mantenimiento',        icon:'wrench', c:'wood' },
};
const Gracias = {
  todas: () => aLista(Store.s.gracias).filter(x => x && x.id && x.at && x.para).sort((a, b) => b.at - a.at),
  delMes(ym){ return this.todas().filter(x => isoDe(new Date(x.at)).startsWith(ym)); },
  clave: p => (p.t === 'guardia' || p.t === 'mant') ? p.t + ':' + normTxt(p.n || '') : p.t,
  nombrePara: p => p.t === 'garita' ? 'Toda la guardia' : p.t === 'policia' ? 'La policía nocturna' : p.t === 'mant' && !p.n ? 'El equipo de mantenimiento' : (p.n || GR_TIPOS[p.t]?.n || ''),
  /* UNO POR DÍA (Claudio, 04-11-2026: "solo es una opción por día"): cada vecino
     agradece una vez por día, a quien elija; después el botón desaparece. */
  hoyYa(){ const u = yo(), hoy = hoyISO(); return !!u && this.todas().some(x => x.userId === u.id && isoDe(new Date(x.at)) === hoy); },
  /* Uno por día a cada persona. */
  yaHoy(p){ const u = yo(), hoy = hoyISO(), k = this.clave(p);
    return !!u && this.todas().some(x => x.userId === u.id && this.clave(x.para) === k && isoDe(new Date(x.at)) === hoy); },
  /* Quién recibió más en una lista. */
  ranking(lista){
    const g = new Map();
    lista.forEach(x => { const k = this.clave(x.para); if (!g.has(k)) g.set(k, { para:x.para, n:0, lotes:new Set() }); const r = g.get(k); r.n++; r.lotes.add(x.lote); });
    return [...g.values()].sort((a, b) => b.n - a.n || this.nombrePara(a.para).localeCompare(this.nombrePara(b.para), 'es'));
  },
  /* A quién se le puede agradecer (04-11-2026, opción A de Claudio: "hay momentos
     del día que el policía o el de mantenimiento no están, o el guardia cambia"):
     por nombre, quienes están trabajando AHORA (cada guardia de turno, la gente de
     mantenimiento en el barrio); y SIEMPRE, estén o no, los tres equipos: toda la
     guardia, la policía nocturna y el equipo de mantenimiento. */
  candidatos(){
    const out = [], g = typeof guardiaAhora === 'function' ? guardiaAhora() : null;
    if (g && g.abierto) aLista(g.guardias).forEach(x => x && x.n && out.push({ t:'guardia', n:x.n, look:x.look, ahora:true }));
    if (typeof mvPersonas === 'function') mvPersonas().forEach(p => out.push({ t:'mant', n:p.nombre, mid:p.mid, ahora:true }));
    out.push({ t:'garita' }, { t:'policia', ahora: !!(g && g.policia) }, { t:'mant' });
    return out;
  },
  /* La carita o el ícono de quien recibe. */
  cara(p, look){
    if (p.t === 'guardia' && typeof caraGuardia === 'function') return `<i class="gr-cara" style="--c:${colorDe(p.n)}">${caraGuardia(p.n, look || (typeof lookDe === 'function' ? lookDe(p.n) : null))}</i>`;
    const t = GR_TIPOS[p.t] || GR_TIPOS.garita;
    return `<span class="ic ic-${t.c} gr-ic">${I(t.icon)}</span>`;
  },
  /* La app de la Administración borra lo de más de 12 meses (una vez por día). */
  limpiar(){
    if (!esAdmin()) return;
    const k = 'bhc.gracias.limpio', hoy = hoyISO();
    try { if (localStorage.getItem(k) === hoy) return; } catch(e){}
    const viejas = this.todas().filter(x => Date.now() - x.at > GR_GUARDA);
    if (viejas.length) Store.cambiar(s => { const ids = new Set(viejas.map(x => x.id)); s.gracias = aLista(s.gracias).filter(x => x && !ids.has(x.id)); });
    try { localStorage.setItem(k, hoy); } catch(e){}
  },
};
let grLimpiarT = 0;
Store.alCambiar(() => { clearTimeout(grLimpiarT); grLimpiarT = setTimeout(() => { try { Gracias.limpiar(); } catch(e){} }, 4000); });

/* ---------- el vecino agradece ---------- */
A['gracias-nueva'] = el => {
  const u = yo(); if (!u) return;
  if (veGarita() || esHotel()) return toast('Los agradecimientos los mandan los vecinos', 'info');
  if (Gracias.hoyYa()) return toast('Hoy ya agradeciste. Mañana podés de nuevo 💛', 'heart');
  const d = el && el.dataset || {};
  if (!d.t){
    const cs = Gracias.candidatos();
    hoja('¿A quién le querés agradecer?', `<div class="gr-elegir">${cs.map(p => { const ya = Gracias.yaHoy(p);
        return `<button type="button" class="gr-op${ya ? ' hecho' : ''}" ${ya ? 'disabled' : `data-a="gracias-nueva" data-t="${p.t}" data-n="${esc(p.n || '')}" data-mid="${esc(p.mid || '')}"`}>
        ${Gracias.cara(p, p.look)}<span class="grow"><b>${esc(Gracias.nombrePara(p))}</b><small>${ya ? 'Hoy ya le agradeciste · mañana podés de nuevo' : p.t === 'guardia' ? 'De guardia ahora en la garita' : p.t === 'garita' ? 'Todos los turnos de la garita, también los que ya se fueron' : p.t === 'policia' ? (p.ahora ? 'De servicio esta noche · sin su nombre' : 'Los que hacen la ronda de noche · sin su nombre') : p.n ? 'Trabajando ahora en el barrio' : 'Todos los de mantenimiento, estén o no hoy'}</small></span>${I(ya ? 'check' : 'right')}</button>`; }).join('')}</div>
      <p class="muted tiny" style="margin:10px 2px 0">${I('info')} Por nombre aparecen quienes están trabajando ahora. Para alguien que ya se fue o que hoy no vino, agradecele a su equipo: le llega a la garita, la supervisión y la Administración. Es un agradecimiento por día.</p>`);
    return;
  }
  const p = { t:d.t, n:d.n || '', mid:d.mid || '' };
  if (Gracias.yaHoy(p)) return toast(`Hoy ya le agradeciste a ${Gracias.nombrePara(p)}. Mañana podés de nuevo.`, 'heart');
  const quien = p.t === 'mant' && p.n ? `${esc(p.n)}, la garita` : p.t === 'guardia' ? `${esc(p.n)} (en la garita)` : 'la garita';
  hoja(`Agradecerle a ${esc(Gracias.nombrePara(p))}`, `<form data-f="gracias" class="gr-form" data-t="${esc(p.t)}" data-n="${esc(p.n)}" data-mid="${esc(p.mid)}">
    <div class="gr-cab">${Gracias.cara(p)}<div class="grow"><b>${esc(Gracias.nombrePara(p))}</b><small>${esc(GR_TIPOS[p.t]?.n || '')}</small></div></div>
    <div class="field"><label>Elegí una frase</label><div class="gr-frases">${GR_FRASES.map((f, i) => `<label><input type="radio" name="frase" value="${esc(f)}"><span>${esc(f)}</span></label>`).join('')}</div></div>
    <div class="field"><label>O escribilo con tus palabras <span class="muted">(opcional)</span></label>
      <textarea name="txt" maxlength="${GR_MAX}" rows="3" placeholder="Ej: Gracias por ayudarme anoche con el portón."></textarea>
      <div class="ayuda"><span data-gr-cuenta>0</span> de ${GR_MAX} letras</div></div>
    <button class="btn btn-pri btn-block btn-grande" data-gr-boton disabled>${I('heart')}<span>Elegí una frase o escribí algo</span></button>
    <p class="muted tiny" style="margin:10px 0 0">${I('lock')} Le llega con tu nombre y tu lote. Lo ven ${quien}, la supervisión y la Administración; ningún otro vecino. Se guarda un año.</p></form>`);
};
/* El botón se prende recién cuando hay algo para mandar, y dice qué falta. */
function grRevisar(f){
  const b = f.querySelector('[data-gr-boton]'), t = f.querySelector('[name=txt]'), c = f.querySelector('[data-gr-cuenta]');
  const hay = !!f.querySelector('[name=frase]:checked') || !!(t && t.value.trim());
  if (c && t) c.textContent = t.value.length;
  if (b){ b.disabled = !hay; const s = b.querySelector('span'); if (s) s.textContent = hay ? 'Mandar el agradecimiento' : 'Elegí una frase o escribí algo'; }
}
['input', 'change'].forEach(ev => document.addEventListener(ev, e => { const f = e.target && e.target.closest && e.target.closest('.gr-form'); if (f) grRevisar(f); }));
F['gracias'] = async (d, form) => {
  const u = yo(); if (!u || veGarita() || esHotel()) return;
  const p = { t:form.dataset.t, n:form.dataset.n || '', mid:form.dataset.mid || '' };
  if (!GR_TIPOS[p.t]) return;
  const txt = String(d.txt || '').trim().slice(0, GR_MAX) || String(d.frase || '').trim();
  if (!txt) return toast('Elegí una frase o escribí algo', 'alert');
  if (Gracias.hoyYa()) { cerrarHoja(); return toast('Hoy ya agradeciste. Mañana podés de nuevo 💛', 'heart'); }
  const partes = String(u.nombre || '').trim().split(/\s+/), de = `${partes[0] || 'Vecino/a'}${partes.length > 1 ? ' ' + partes[partes.length - 1][0].toUpperCase() + '.' : ''}${u.casa ? ' · ' + u.casa : ''}`;
  const para = p.t === 'garita' || p.t === 'policia' ? { t:p.t } : p.t === 'mant' ? (p.n ? { t:'mant', n:p.n, mid:p.mid } : { t:'mant' }) : { t:'guardia', n:p.n };
  Store.cambiar(s => {
    s.gracias = aLista(s.gracias);
    s.gracias.unshift({ id:uid(), userId:u.id, lote:u.casa || '', de, para, txt, at:Date.now() });
    notificar(s, { para:['rol:guardia', 'rol:supervisor'], titulo:`💛 ${de} le agradeció a ${Gracias.nombrePara(para)}`, texto:txt.slice(0, 120), icon:'heart', color:'ok', link:'gracias', push:false });
  });
  if (p.t === 'mant' && typeof MVChat !== 'undefined' && p.mid) await MVChat.mandar(p.mid, MVChat.miHilo(), '💛 ' + txt);
  cerrarHoja();
  grFiesta();
  toast(`Listo: le llegó tu agradecimiento a ${Gracias.nombrePara(para)}`, 'heart');
};

/* =========================================================
   EL BOTÓN "GRACIAS" EN LA FOTO DE LA PORTADA (pedido de Claudio, 04-11-2026:
   "el diseño como antes, solo que el botón sea un poco más emblemático e
   interaccione con una primera impresión del vecino para agradecer").
   Debajo de "De guardia", con el mismo vidrio: (13-11-2026: unas manos juntas 🙏, sin círculo,
   para no confundirse con el corazón del DEA) que late
   con un halo y la palabra "Gracias". Un toque abre "¿A quién le querés
   agradecer?". La primera vez del día que el vecino abre la app, un globito
   lo invita ("¿Le das las gracias a Juan y Ana?") y se va solo a los pocos
   segundos (o al tocarlo). Es UN agradecimiento por día: después de mandarlo,
   el botón desaparece hasta mañana. Solo vecinos (no la garita, el hotel ni el modo
   Administración). Respeta "reducir movimiento".
   ========================================================= */
const GR_GLOBO = 'bhc.gracias.globo';
function graciasBoton(){
  const u = yo(); if (!u || veGarita() || esHotel() || (esAdmin() ? Store.sesion.modo === 'admin' : esStaff())) return '';
  const hoy = hoyISO(); if (Gracias.hoyYa()) return '';   /* hoy ya agradeció: el botón no aparece hasta mañana */
  /* El globito: una vez por día, y sigue visible unos segundos aunque la pantalla se redibuje. */
  let globo = false;
  try { const g = JSON.parse(localStorage.getItem(GR_GLOBO) || 'null');
    if (!g || g.d !== hoy){ localStorage.setItem(GR_GLOBO, JSON.stringify({ d:hoy, t:Date.now() })); globo = true; } else globo = Date.now() - g.t < 9000; } catch(e){}
  const g = typeof guardiaAhora === 'function' ? guardiaAhora() : null, ns = g && g.abierto ? aLista(g.guardias).map(x => String(x.n).split(' ')[0]).filter(Boolean) : [];
  const a = ns.length === 1 ? ns[0] : ns.length === 2 ? `${ns[0]} y ${ns[1]}` : ns.length > 2 ? 'la guardia' : 'quien te cuida';
  return `<div class="gr-boton"><button type="button" class="gr-b" data-a="gracias-nueva" aria-label="Agradecer a quien trabaja en el barrio">
      <span class="gr-b-cor gr-b-manos" aria-hidden="true">🙏</span><b>Gracias</b></button>
    ${globo ? `<button type="button" class="gr-globo" data-a="gracias-nueva">¿Le das las gracias a ${esc(a)}? 💛</button>` : ''}</div>`;
}
/* La lluvia de corazones al mandar (sin nada si el teléfono pide menos movimiento). */
function grFiesta(){
  try { if (matchMedia('(prefers-reduced-motion: reduce)').matches) return; } catch(e){}
  const caja = document.createElement('div'); caja.className = 'gr-fiesta'; caja.setAttribute('aria-hidden', 'true');
  caja.innerHTML = Array.from({ length:18 }, (_, k) => `<i style="--x:${Math.round(Math.random() * 100)}%;--d:${(Math.random() * .6).toFixed(2)}s;--s:${(0.7 + Math.random() * .9).toFixed(2)};--r:${Math.round(Math.random() * 60 - 30)}deg">${['💛', '❤️', '💚', '🧡'][k % 4]}</i>`).join('');
  document.body.appendChild(caja); setTimeout(() => caja.remove(), 2600);
}

/* ---------- la ventana: lo mandado (vecino) o el mes entero (garita, supervisión y Administración) ---------- */
const grMesTxt = ym => { const [a, m] = ym.split('-').map(Number), t = MESES_LARGO[m] || ''; return `${t.charAt(0).toUpperCase() + t.slice(1)} ${a}`; };
const grMesAnterior = ym => { const [a, m] = ym.split('-').map(Number); return m === 1 ? `${a - 1}-12` : `${a}-${String(m - 1).padStart(2, '0')}`; };
function grTarjeta(x, borrar){
  return `<div class="card gr-card"><div class="gr-cab">${Gracias.cara(x.para)}<div class="grow"><b>Para ${esc(Gracias.nombrePara(x.para))}</b><small>${esc(x.de || 'Un vecino')} · ${hace(x.at)}</small></div>
      ${borrar ? `<button class="btn btn-xs btn-danger-soft" data-a="gracias-borrar" data-id="${esc(x.id)}">${I('trash')}Borrar</button>` : ''}</div>
    <p class="gr-txt">«${esc(x.txt)}»</p></div>`;
}
R.gracias = {
  titulo: () => veGarita() ? 'Agradecimientos de los vecinos' : 'Agradecer a quien trabaja',
  icon: 'heart', color: 'danger',
  sub: () => veGarita() ? 'Lo que los vecinos le agradecen a quien trabaja' : 'Guardia, policía nocturna y mantenimiento',
  render(p){
    if (esHotel()) return vacio('lock', 'No disponible para el hotel.');
    if (!veGarita()){
      const mias = Gracias.todas().filter(x => x.userId === yo()?.id);
      return `${Gracias.hoyYa() ? aviso('ok', 'heart', 'Hoy ya agradeciste', 'Es un agradecimiento por día. Mañana podés de nuevo.') : superficie({ a:'gracias-nueva', icon:'heart', color:'danger', t:'Agradecerle a alguien', s:'A la guardia, la policía nocturna o mantenimiento (uno por día)', cls:'acento' })}
        <p class="muted small" style="margin:8px 2px 14px">Un gesto chico que a quien trabaja le cambia el día. Le llega con tu nombre y tu lote; lo ven esa persona, la garita, la supervisión y la Administración.</p>
        ${mias.length ? sec('Los que mandaste') + mias.slice(0, 30).map(x => grTarjeta(x, false)).join('') : vacio('heart', 'Todavía no mandaste ninguno.')}`;
    }
    const ym = /^\d{4}-\d{2}$/.test(p || '') ? p : hoyISO().slice(0, 7), ant = grMesAnterior(ym), hoyYm = hoyISO().slice(0, 7);
    const lista = Gracias.delMes(ym), rk = Gracias.ranking(lista), lotes = new Set(lista.map(x => x.lote)).size;
    return `<div class="chips" style="margin-bottom:12px"><button class="chip" data-a="abrir" data-v="gracias" data-p="${ant}">${I('left')}${esc(grMesTxt(ant))}</button>
        <span class="chip on">${esc(grMesTxt(ym))}</span>${ym < hoyYm ? `<button class="chip" data-a="abrir" data-v="gracias" data-p="${hoyYm}">Este mes${I('right')}</button>` : ''}</div>
      <div class="garita-kpis"><div class="kpi"><b>${lista.length}</b><span>Gracias</span></div><div class="kpi"><b>${rk.length}</b><span>${rk.length === 1 ? 'Persona' : 'Personas'}</span></div><div class="kpi"><b>${lotes}</b><span>${lotes === 1 ? 'Lote' : 'Lotes'}</span></div></div>
      ${rk.length ? sec('Quién recibió más') + `<div class="card lista">${rk.map((r, i) => `<div class="it gr-rk">${Gracias.cara(r.para)}<div class="txt"><b>${i < 3 ? ['🥇', '🥈', '🥉'][i] + ' ' : ''}${esc(Gracias.nombrePara(r.para))}</b><span>${esc(GR_TIPOS[r.para.t]?.n || '')} · de ${plural(r.lotes.size, 'lote', 'lotes')}</span></div><b class="num">${r.n}</b></div>`).join('')}</div>` : ''}
      ${lista.length ? sec('Lo que escribieron') + lista.map(x => grTarjeta(x, esAdmin())).join('') : vacio('heart', `No hubo agradecimientos en ${esc(grMesTxt(ym))}.`)}
      <p class="muted tiny" style="margin-top:12px">${I('lock')} Lo ven la garita, la supervisión y la Administración. Ningún vecino ve los de los demás. Se borran solos a los 12 meses.</p>`;
  },
};
A['gracias-borrar'] = async el => {
  if (!esAdmin()) return;
  const x = Gracias.todas().find(z => z.id === el.dataset.id); if (!x) return;
  if (!await confirmar('Borrar este agradecimiento', `Se borra el de ${esc(x.de || 'un vecino')} para ${esc(Gracias.nombrePara(x.para))}. No se puede deshacer.`, { si:'Borrar', peligro:true })) return;
  Store.cambiar(s => { s.gracias = aLista(s.gracias).filter(z => z && z.id !== x.id); auditar(s, 'Borró un agradecimiento', `${x.de || ''} → ${Gracias.nombrePara(x.para)}`); });
  toast('Agradecimiento borrado', 'check');
};

/* ---------- en la portada de la garita: los de las últimas 24 horas ---------- */
function bandaGracias(){
  const xs = Gracias.todas().filter(x => Date.now() - x.at < DIA);
  if (!xs.length) return '';
  return `<section class="gr-banda" aria-label="Agradecimientos de los vecinos"><div class="gr-banda-cab"><span class="gr-corazon">${I('heart')}</span>
      <div class="grow"><b>${xs.length === 1 ? 'Un vecino les agradeció' : `${xs.length} agradecimientos de los vecinos`}</b><small>En las últimas 24 horas</small></div>
      <button class="btn btn-xs btn-sec" data-a="abrir" data-v="gracias">Ver todos</button></div>
    ${xs.slice(0, 3).map(x => `<div class="gr-linea">${Gracias.cara(x.para)}<span class="grow"><b>${esc(Gracias.nombrePara(x.para))}</b> «${esc(x.txt.length > 110 ? x.txt.slice(0, 110) + '…' : x.txt)}»<small>${esc(x.de || '')} · ${hace(x.at)}</small></span></div>`).join('')}</section>`;
}
/* LOS AGRADECIMIENTOS EN LOS PARTES POR CORREO (13-11-2026, pedido de Claudio):
   cuántos, a quién, qué vecino y de qué lote. Estilos escritos en cada
   elemento, como el resto de los correos. Va en el parte del turno de la
   garita (que ve la supervisión y le llega a la Administración) y en el parte
   del día de cada persona de mantenimiento (solo los suyos y los de su equipo). */
function graciasCorreoHtml(lista){
  const personas = new Set(lista.map(x => Gracias.clave(x.para))).size, lotes = new Set(lista.map(x => x.lote)).size;
  const kpi = (n, t) => `<td align="center" style="background:#fdf0f4;border-radius:10px;padding:8px"><b style="display:block;font-size:20px;color:#c0265b">${n}</b><span style="font-size:11px;color:#7a1430">${t}</span></td>`;
  const td = 'padding:6px 4px;border-top:1px solid #e3e8ea;vertical-align:top';
  return `<table width="100%" cellpadding="0" cellspacing="6" style="border-collapse:separate"><tr>${kpi(lista.length, 'gracias')}${kpi(personas, personas === 1 ? 'persona' : 'personas')}${kpi(lotes, lotes === 1 ? 'lote' : 'lotes')}</tr></table>
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:13px">${lista.map(x => `<tr><td style="${td}"><b>${esc(Gracias.nombrePara(x.para))}</b> «${esc(x.txt)}»</td><td style="${td};color:#6c7d7a;font-size:12px;white-space:nowrap" align="right">${esc(x.de || 'Un vecino')} · ${hora(x.at)}</td></tr>`).join('')}</table>`;
}
/* En el portal de la supervisión y en la Administración: el resumen del mes. */
function graciasResumen(){
  const n = Gracias.delMes(hoyISO().slice(0, 7)).length;
  return superficie({ a:'abrir', v:'gracias', icon:'heart', color:'danger', t:'Agradecimientos de los vecinos', s: n ? `${plural(n, 'agradecimiento')} este mes` : 'Lo que los vecinos le agradecen a quien trabaja' });
}
