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
   · Uno por día a cada persona: así no se usa para insistir.

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
  nombrePara: p => p.t === 'garita' ? 'Toda la guardia' : p.t === 'policia' ? 'La policía nocturna' : (p.n || GR_TIPOS[p.t]?.n || ''),
  /* Uno por día a cada persona. */
  yaHoy(p){ const u = yo(), hoy = hoyISO(), k = this.clave(p);
    return !!u && this.todas().some(x => x.userId === u.id && this.clave(x.para) === k && isoDe(new Date(x.at)) === hoy); },
  /* Quién recibió más en una lista. */
  ranking(lista){
    const g = new Map();
    lista.forEach(x => { const k = this.clave(x.para); if (!g.has(k)) g.set(k, { para:x.para, n:0, lotes:new Set() }); const r = g.get(k); r.n++; r.lotes.add(x.lote); });
    return [...g.values()].sort((a, b) => b.n - a.n || this.nombrePara(a.para).localeCompare(this.nombrePara(b.para), 'es'));
  },
  /* A quién se le puede agradecer ahora: los que están trabajando. */
  candidatos(){
    const out = [], g = typeof guardiaAhora === 'function' ? guardiaAhora() : null;
    if (g && g.abierto) aLista(g.guardias).forEach(x => x && x.n && out.push({ t:'guardia', n:x.n, look:x.look }));
    out.push({ t:'garita' });
    if (g && g.policia) out.push({ t:'policia' });
    if (typeof mvPersonas === 'function') mvPersonas().forEach(p => out.push({ t:'mant', n:p.nombre, mid:p.mid }));
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
  const d = el && el.dataset || {};
  if (!d.t){
    const cs = Gracias.candidatos();
    hoja('¿A quién le querés agradecer?', `<div class="gr-elegir">${cs.map(p => { const ya = Gracias.yaHoy(p);
        return `<button type="button" class="gr-op${ya ? ' hecho' : ''}" ${ya ? 'disabled' : `data-a="gracias-nueva" data-t="${p.t}" data-n="${esc(p.n || '')}" data-mid="${esc(p.mid || '')}"`}>
        ${Gracias.cara(p, p.look)}<span class="grow"><b>${esc(Gracias.nombrePara(p))}</b><small>${ya ? 'Hoy ya le agradeciste · mañana podés de nuevo' : p.t === 'guardia' ? 'De guardia ahora en la garita' : p.t === 'garita' ? 'Todos los turnos de la garita' : p.t === 'policia' ? 'De servicio esta noche · sin su nombre' : 'Trabajando hoy en el barrio'}</small></span>${I(ya ? 'check' : 'right')}</button>`; }).join('')}</div>
      <p class="muted tiny" style="margin:10px 2px 0">${I('info')} Aparecen quienes están trabajando ahora. Para alguien que ya se fue, agradecele a toda la guardia.</p>`);
    return;
  }
  const p = { t:d.t, n:d.n || '', mid:d.mid || '' };
  if (Gracias.yaHoy(p)) return toast(`Hoy ya le agradeciste a ${Gracias.nombrePara(p)}. Mañana podés de nuevo.`, 'heart');
  const quien = p.t === 'mant' ? `${esc(p.n)}, la garita` : p.t === 'guardia' ? `${esc(p.n)} (en la garita)` : 'la garita';
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
  if (Gracias.yaHoy(p)) return toast(`Hoy ya le agradeciste a ${Gracias.nombrePara(p)}`, 'heart');
  const partes = String(u.nombre || '').trim().split(/\s+/), de = `${partes[0] || 'Vecino/a'}${partes.length > 1 ? ' ' + partes[partes.length - 1][0].toUpperCase() + '.' : ''}${u.casa ? ' · ' + u.casa : ''}`;
  const para = p.t === 'garita' || p.t === 'policia' ? { t:p.t } : p.t === 'mant' ? { t:'mant', n:p.n, mid:p.mid } : { t:'guardia', n:p.n };
  Store.cambiar(s => {
    s.gracias = aLista(s.gracias);
    s.gracias.unshift({ id:uid(), userId:u.id, lote:u.casa || '', de, para, txt, at:Date.now() });
    notificar(s, { para:['rol:guardia', 'rol:supervisor'], titulo:`💛 ${de} le agradeció a ${Gracias.nombrePara(para)}`, texto:txt.slice(0, 120), icon:'heart', color:'ok', link:'gracias', push:false });
  });
  if (p.t === 'mant' && typeof MVChat !== 'undefined' && p.mid) await MVChat.mandar(p.mid, MVChat.miHilo(), '💛 ' + txt);
  cerrarHoja();
  toast(`Listo: le llegó tu agradecimiento a ${Gracias.nombrePara(para)}`, 'heart');
};

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
      return `${superficie({ a:'gracias-nueva', icon:'heart', color:'danger', t:'Agradecerle a alguien', s:'A la guardia, la policía nocturna o mantenimiento', cls:'acento' })}
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
/* En el portal de la supervisión y en la Administración: el resumen del mes. */
function graciasResumen(){
  const n = Gracias.delMes(hoyISO().slice(0, 7)).length;
  return superficie({ a:'abrir', v:'gracias', icon:'heart', color:'danger', t:'Agradecimientos de los vecinos', s: n ? `${plural(n, 'agradecimiento')} este mes` : 'Lo que los vecinos le agradecen a quien trabaja' });
}
