/* =========================================================
   LA GUARDIA: POLICÍA NOCTURNA, GUARDIAS DE AHORA Y GUARDIAS DIBUJADOS
   (pedido de Claudio, 13-10-2026)

   1. LA POLICÍA NOCTURNA TIENE SU PROPIO HORARIO. La guardia de la garita
      es privada (AVIC, contratada por el barrio); la policía nocturna es
      policía provincial que hace horas adicionales. Antes se le pedía "el
      turno de la garita" al anotarla, como si fueran lo mismo. Ahora tiene
      su horario: de domingo a jueves desde las 21:59 y viernes y sábado
      desde las 23:59; de domingo a jueves hasta las 06:00 y viernes y
      sábado hasta las 08:00 del día siguiente (14-10-2026) (la
      Administración lo cambia en Turnos → Policía nocturna). El turno de
      la garita en que entró o salió se sigue guardando solo, por la hora.

   2. LA TARJETA DEL POLICÍA. Al registrar el ingreso se arma una tarjeta
      con su nombre, matrícula, la noche de servicio, su código de ronda y
      un QR: se comparte por WhatsApp como imagen (o se le muestra en la
      pantalla para que la escanee) y su teléfono queda listo para leer los
      QR de la ronda.

   3. LOS GUARDIAS DE AHORA EN LA PORTADA DE TODOS. La garita publica en
      /barrio/guardiaAhora SOLO el turno abierto, su horario y los nombres
      de pila y apellido de quienes están de guardia (con su dibujo), y si
      hay policía de servicio (sí o no, sin nombre). Los vecinos no leen la
      bitácora: leen ese único registro. Al cerrarse el turno, se vacía.

   4. CADA GUARDIA ELIGE CÓMO APARECE (hombre o mujer, alto o petizo, flaco
      o gordo, el color del pelo, la piel, barba y anteojos), igual que los
      vecinos en el dibujo del lote. Se guarda por nombre en
      /staff/guardiaLooks (garita y Administración) y se copia al registro
      público solo para los que están de guardia.

   Ideas: avataaars-generator (3k★, MIT) y vue-color-avatar (3.8k★, MIT),
   solo la idea de elegir rasgos por partes; el dibujo es propio.
   ========================================================= */

/* ---------- 1. el horario de la policía nocturna ---------- */
const POLICIA_HORARIO_BASE = { semana:'21:59', finde:'23:59', hasta:'06:00', hastaFinde:'08:00' };
const policiaHorario = () => ({ ...POLICIA_HORARIO_BASE, ...(Store.s.config.policiaHorario || {}) });
const conHoraDe = (d, hhmm) => { const [h, m] = String(hhmm || '').split(':').map(Number); const x = new Date(d); x.setHours(h || 0, m || 0, 0, 0); return x.getTime(); };
/* Viernes y sábado empieza más tarde. La noche "del viernes" termina el sábado a las 6. */
const nocheEsFinde = dia => dia === 5 || dia === 6;
function nocheQueEmpieza(d){
  const h = policiaHorario(), dia = d.getDay(), desde = conHoraDe(d, nocheEsFinde(dia) ? h.finde : h.semana);
  const sig = new Date(d); sig.setDate(sig.getDate() + 1);
  return { dia, desde, hasta: conHoraDe(sig, nocheEsFinde(dia) ? h.hastaFinde : h.hasta) };
}
/* La noche que corre ahora (o la próxima, si todavía no empezó). */
function nochePolicia(at = Date.now()){
  const hoy = new Date(at); hoy.setHours(0, 0, 0, 0);
  const ayer = new Date(hoy); ayer.setDate(ayer.getDate() - 1);
  const a = nocheQueEmpieza(ayer), n = at < a.hasta ? a : nocheQueEmpieza(hoy);
  return { ...n, ahora: at >= n.desde && at < n.hasta, falta: Math.max(0, n.desde - at), etiqueta: `Noche del ${DIAS_L[n.dia]}` };
}
const horarioNocheTxt = n => `${hora(n.desde)} a ${hora(n.hasta)} h`;
/* La barra de la noche: de la hora de entrada a las 6, con un punto en "ahora". */
function barraNoche(n = nochePolicia()){
  const pct = Math.min(100, Math.max(0, (Date.now() - n.desde) / (n.hasta - n.desde) * 100));
  return `<div class="pn-barra ${n.ahora ? 'on' : ''}" role="img" aria-label="${esc(n.etiqueta)}: de ${horarioNocheTxt(n)}${n.ahora ? ', en curso' : ''}">
    <span>${I('moon')}${hora(n.desde)}</span><div class="pn-pista"><i style="width:${n.ahora ? pct.toFixed(1) : 0}%"></i>${n.ahora ? `<b style="left:${pct.toFixed(1)}%"></b>` : ''}</div><span>${hora(n.hasta)}${I('sunrise')}</span></div>`;
}
/* La cabecera de las ventanas de ingreso y salida. */
function cabNoche(n = nochePolicia()){
  return `<div class="pn-cab ${n.ahora ? 'on' : ''}"><span class="pn-luna">${I('moon')}<i></i><i></i><i></i></span>
    <div class="grow"><small>Policía nocturna · ${esc(n.etiqueta)}</small><b>${horarioNocheTxt(n)}</b>
      <em>${n.ahora ? 'Horario de servicio en curso' : `Empieza en ${n.falta >= HORA ? Math.floor(n.falta / HORA) + ' h ' : ''}${Math.round(n.falta % HORA / MIN)} min`}</em></div></div>${barraNoche(n)}`;
}
/* La semana entera, para Turnos. */
function semanaPolicia(){
  const h = policiaHorario(), hoy = new Date().getDay();
  return `<div class="pn-semana">${[1, 2, 3, 4, 5, 6, 0].map(d => `<span class="${nocheEsFinde(d) ? 'finde' : ''}${d === hoy ? ' hoy' : ''}"><small>${DIAS[d]}</small><b>${nocheEsFinde(d) ? h.finde : h.semana}</b><i>a ${nocheEsFinde(d) ? h.hastaFinde : h.hasta}</i></span>`).join('')}</div>`;
}
/* En Turnos: el horario y, para la Administración, cambiarlo. */
function seccionPoliciaHorario(){
  const h = policiaHorario();
  return `${sec('Policía nocturna')}
    <div class="card pn-turnos">${cabNoche()}
      ${semanaPolicia()}
      <p class="muted tiny" style="margin:8px 0 0">Es policía provincial que hace horas adicionales: tiene su propio horario, distinto del de los turnos de la garita (AVIC). La garita registra su ingreso y su salida; la app anota sola en qué turno de la garita fue.</p>
      ${esAdmin() ? `<details class="plegable" data-k="pnHorario" style="margin-top:10px"><summary><b>Cambiar el horario</b><span class="muted small">domingo a jueves · viernes y sábado</span></summary>
        <form data-f="policia-horario" style="margin-top:10px"><div class="grid3">
          <div class="field"><label>Dom. a jue. desde</label><input type="time" name="semana" required value="${esc(h.semana)}"></div>
          <div class="field"><label>Vie. y sáb. desde</label><input type="time" name="finde" required value="${esc(h.finde)}"></div>
          <div class="field"><label>Dom. a jue. hasta</label><input type="time" name="hasta" required value="${esc(h.hasta)}"></div></div>
          <div class="grid3"><div class="field"><label>Vie. y sáb. hasta</label><input type="time" name="hastaFinde" required value="${esc(h.hastaFinde)}"></div></div>
          <button class="btn btn-pri btn-block">${I('check')}Guardar el horario</button></form></details>` : ''}</div>`;
}
F['policia-horario'] = d => {
  if (!esAdmin()) return;
  const ok = x => /^\d{2}:\d{2}$/.test(x || '');
  if (![d.semana, d.finde, d.hasta, d.hastaFinde].every(ok)) return toast('Revisá las horas', 'clock');
  Store.cambiar(s => { s.config.policiaHorario = { semana:d.semana, finde:d.finde, hasta:d.hasta, hastaFinde:d.hastaFinde }; auditar(s, 'Cambió el horario de la policía nocturna', `dom-jue ${d.semana} a ${d.hasta} · vie-sáb ${d.finde} a ${d.hastaFinde}`); });
  toast('Horario de la policía guardado', 'check');
};
/* El turno de la garita que estaba abierto en un momento dado. */
function turnoGaritaEn(at){
  const r = registrosTurno().find(b => b.at <= at + MIN && (!b.cerradoAt || at <= b.cerradoAt));
  return (r || turnoAbierto() || {}).turno || (turnoDeAhora() || {}).nombre || '';
}
const inicialesDe = n => String(n || '?').trim().split(/\s+/).filter(Boolean).slice(0, 2).map(x => x[0]).join('').toUpperCase() || '?';
/* Ahora / otra hora: lo de siempre es "ahora", con un toque. */
const elegirCuando = (etq, nombreHora, desde = 0) => `<div class="pn-lbl">${etq}</div>
  <div class="pn-hora" role="radiogroup"><label><input type="radio" name="cuando" value="ahora" checked><span>${I('clock')}<em><b>Ahora</b><small>${hora(Date.now())} h</small></em></span></label>
    <label><input type="radio" name="cuando" value="otra"><span>${I('edit')}<em><b>Otra hora</b><small>Si se anota más tarde</small></em></span></label></div>
  <div class="pn-otra grid2" hidden><div class="field"><label>Día</label><input name="dia" type="date" value="${hoyISO()}" max="${hoyISO()}"${desde ? ` min="${isoDe(new Date(desde))}"` : ''}></div>
    <div class="field"><label>Hora</label><input name="${nombreHora}" type="time" value="${horaInput(Date.now())}"></div></div>`;
document.addEventListener('change', e => {
  const r = e.target; if (!r || r.name !== 'cuando') return;
  const f = r.closest('form'), o = f && f.querySelector('.pn-otra'); if (o) o.hidden = r.value !== 'otra';
});
/* Los que ya vinieron, para tocar y completar todo de una. */
let pnConocidos = [];
A['pn-elegir'] = el => {
  const p = pnConocidos[+el.dataset.i], f = el.closest('form'); if (!p || !f) return;
  ['nombre', 'matricula', 'tel', 'email'].forEach(k => { if (f[k]) f[k].value = p[k] || ''; });
  f.querySelectorAll('.pn-c.on').forEach(b => b.classList.remove('on')); el.classList.add('on');
  f.querySelector('.pn-datos')?.classList.add('lleno');
};

/* ---------- 2. la tarjeta del policía ---------- */
function tarjetaPoliciaHtml(p, c){
  const n = nochePolicia(p.entra);
  return `<div class="pn-tarjeta">
    <div class="pn-t-cab"><span class="pn-escudo">${I('shield')}</span><div class="grow"><small>Barrio ${esc(Store.s.config.nombre)}</small><b>Policía nocturna</b></div><span class="pn-t-luz" aria-hidden="true"><i></i><i></i></span></div>
    <div class="pn-t-cuerpo">
      <div class="pn-t-datos"><b class="pn-t-nom">${esc(p.nombre)}</b>
        ${p.matricula ? `<span>${I('user')}Mat. ${esc(p.matricula)}</span>` : ''}
        <span>${I('moon')}${esc(n.etiqueta)} · ${horarioNocheTxt(n)}</span>
        <span>${I('clock')}Ingresó ${hora(p.entra)} h</span>
        <div class="pn-t-cod"><small>Código de ronda</small><b>${c.id.slice(0, 3)} ${c.id.slice(3)}</b></div></div>
      <div class="pn-t-qr" data-qr-ronda="${esc(enlaceRonda(c.id, p.nombre))}" aria-label="QR para dejar el teléfono listo"></div></div>
    <div class="pn-t-pie">${I('qr')}<span>Escaneá el QR con la cámara de tu teléfono: queda listo para registrar cada punto de la ronda. Vence a las ${hora(c.vence)} h.</span></div></div>`;
}
/* La misma tarjeta como imagen, para mandarla por WhatsApp. */
async function imagenTarjetaPolicia(p, c){
  const q = await cargarQR(), n = nochePolicia(p.entra), W = 1080, H = 640, cv = document.createElement('canvas');
  cv.width = W; cv.height = H; const x = cv.getContext('2d'), F = 'Manrope, system-ui, sans-serif';
  const redondo = (a, b, w, h, r) => { x.beginPath(); x.moveTo(a + r, b); x.arcTo(a + w, b, a + w, b + h, r); x.arcTo(a + w, b + h, a, b + h, r); x.arcTo(a, b + h, a, b, r); x.arcTo(a, b, a + w, b, r); x.closePath(); };
  const g = x.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#0b1f3a'); g.addColorStop(.6, '#163d73'); g.addColorStop(1, '#0d6b66');
  redondo(0, 0, W, H, 46); x.fillStyle = g; x.fill(); x.save(); redondo(0, 0, W, H, 46); x.clip();
  x.fillStyle = 'rgba(255,255,255,.06)'; x.beginPath(); x.arc(W - 120, -40, 260, 0, Math.PI * 2); x.fill();
  x.fillStyle = '#1e88e5'; x.fillRect(0, 0, W / 2, 12); x.fillStyle = '#e53935'; x.fillRect(W / 2, 0, W / 2, 12); x.restore();
  /* el escudo */
  x.save(); x.translate(98, 104); x.fillStyle = '#ffd54a'; x.beginPath(); x.moveTo(0, -46); x.lineTo(40, -30); x.quadraticCurveTo(40, 26, 0, 50); x.quadraticCurveTo(-40, 26, -40, -30); x.closePath(); x.fill();
  x.fillStyle = '#163d73'; x.font = `800 34px ${F}`; x.textAlign = 'center'; x.fillText('★', 0, 14); x.restore();
  x.textAlign = 'left'; x.fillStyle = 'rgba(255,255,255,.75)'; x.font = `700 24px ${F}`; x.fillText(`BARRIO ${String(Store.s.config.nombre).toUpperCase()}`, 168, 88);
  x.fillStyle = '#fff'; x.font = `800 50px ${F}`; x.fillText('Policía nocturna', 168, 140);
  x.font = `800 54px ${F}`; x.fillText(p.nombre.length > 24 ? p.nombre.slice(0, 23) + '…' : p.nombre, 60, 258);
  x.font = `600 28px ${F}`; x.fillStyle = 'rgba(255,255,255,.88)';
  let y = 306; [p.matricula ? 'Mat. ' + p.matricula : '', `${n.etiqueta} · ${horarioNocheTxt(n)}`, `Ingresó ${hora(p.entra)} h`].filter(Boolean).forEach(t => { x.fillText(t, 60, y); y += 42; });
  redondo(56, 440, 520, 128, 24); x.fillStyle = 'rgba(255,255,255,.12)'; x.fill();
  x.fillStyle = 'rgba(255,255,255,.8)'; x.font = `700 22px ${F}`; x.fillText('CÓDIGO DE RONDA', 84, 478);
  x.fillStyle = '#ffd54a'; x.font = `800 64px ui-monospace, Menlo, Consolas, monospace`; x.fillText(`${c.id.slice(0, 3)} ${c.id.slice(3)}`, 84, 548);
  /* el QR */
  redondo(660, 196, 360, 360, 28); x.fillStyle = '#fff'; x.fill();
  if (q){ const m = q(0, 'M'); m.addData(enlaceRonda(c.id, p.nombre)); m.make(); const k = m.getModuleCount(), s = 316 / k;
    x.fillStyle = '#0b1f3a'; for (let r = 0; r < k; r++) for (let col = 0; col < k; col++) if (m.isDark(r, col)) x.fillRect(682 + col * s, 218 + r * s, Math.ceil(s), Math.ceil(s)); }
  x.fillStyle = 'rgba(255,255,255,.85)'; x.font = `600 21px ${F}`; x.textAlign = 'center'; x.fillText('Escaneá con la cámara · vence ' + hora(c.vence) + ' h', 840, 600);
  return await new Promise(ok => cv.toBlob(ok, 'image/png'));
}
A['pn-compartir'] = async el => {
  const t = turnoAbierto(), p = t && policiasDe(t).find(x => x.id === el.dataset.id), c = p && codigoVigente(p.id); if (!c) return;
  const texto = textoCodigoRonda(p, c), archivo = `tarjeta-policia-${c.id}.png`;
  const blob = await imagenTarjetaPolicia(p, c).catch(() => null);
  if (blob && navigator.canShare){ const f = new File([blob], archivo, { type:'image/png' });
    if (navigator.canShare({ files:[f], text:texto })){ try { await navigator.share({ files:[f], text:texto }); return; } catch(e){ if (e.name === 'AbortError') return; } } }
  if (blob){ const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = archivo; document.body.appendChild(a); a.click(); a.remove();
    toast('Se bajó la tarjeta: adjuntala en el WhatsApp que se abre', 'download'); }
  const wa = p.tel && typeof waNumeroAR === 'function' ? waNumeroAR(p.tel) : '';
  window.open(wa ? `https://wa.me/${wa}?text=${encodeURIComponent(texto)}` : 'https://wa.me/?text=' + encodeURIComponent(texto), '_blank', 'noopener');
};

/* ---------- 3 y 4. los guardias, dibujados ---------- */
const LOOK_OPC = {
  fig:    { t:'Soy', op:[['hombre', 'Hombre'], ['mujer', 'Mujer'], ['neutra', 'Prefiero no decir']] },
  altura: { t:'Altura', op:[['petizo', 'Petizo/a'], ['mediano', 'Mediano/a'], ['alto', 'Alto/a']] },
  cuerpo: { t:'Contextura', op:[['flaco', 'Flaco/a'], ['mediano', 'Mediano/a'], ['gordo', 'Gordo/a']] },
  pelo:   { t:'Pelo', op:[['morocho', 'Morocho/a'], ['castano', 'Castaño/a'], ['rubio', 'Rubio/a'], ['colorado', 'Colorado/a'], ['canoso', 'Canoso/a'], ['pelado', 'Pelado/a']] },
  piel:   { t:'Piel', op:[['clara', 'Clara'], ['media', 'Trigueña'], ['morena', 'Morena']] },
  extra:  { t:'Detalles', op:[['barba', 'Barba'], ['lentes', 'Anteojos']] },
};
const PELO_COL = { morocho:'#1d1714', castano:'#5b3a22', rubio:'#e2b65c', colorado:'#b8481d', canoso:'#cfd0d6', pelado:'' };
const PIEL_COL = { clara:'#f4d4b6', media:'#d6a078', morena:'#8a5737' };
const slugGuardia = n => claveNombre(n).replace(/\s+/g, '-').slice(0, 60) || 'guardia';
/* Sin elegir: una figura neutra, sin barba; el pelo y la piel salen del
   nombre (como en el dibujo del lote). Nada se adivina por el nombre. */
function lookCompleto(nombre, look){
  const h = hashTxt(nombre), L = look && typeof look === 'object' ? look : {};
  const de = (k, lista) => L[k] && lista.includes(L[k]) ? L[k] : null;
  return { fig: de('fig', ['hombre', 'mujer', 'neutra']) || 'neutra', altura: de('altura', ['petizo', 'mediano', 'alto']) || 'mediano', cuerpo: de('cuerpo', ['flaco', 'mediano', 'gordo']) || 'mediano',
    pelo: de('pelo', Object.keys(PELO_COL)) || ['morocho', 'castano', 'morocho', 'castano', 'rubio'][h % 5], piel: de('piel', Object.keys(PIEL_COL)) || ['clara', 'media', 'media', 'morena'][(h >>> 3) % 4],
    barba: !!L.barba, lentes: !!L.lentes, elegido: !!(L.fig || L.altura || L.cuerpo || L.pelo) };
}
const lookAltura = L => ({ petizo:.87, mediano:1, alto:1.12 })[L.altura] || 1;
/* Un guardia de frente, con el uniforme de la garita: camisa azul con el
   parche en el hombro, la placa y la radio con su lucecita. Los pies en (0, 0). */
function svgGuardia(nombre, look, { saluda = false, d = 0 } = {}){
  const L = lookCompleto(nombre, look), wx = ({ flaco:.84, mediano:1, gordo:1.3 })[L.cuerpo] || 1, hy = lookAltura(L), sube = (hy - 1) * 64;
  const piel = PIEL_COL[L.piel], pelo = PELO_COL[L.pelo] || '#3b2a20', calvo = L.pelo === 'pelado', camisa = '#24477a', camisa2 = '#1b3760', pant = '#1b2331';
  const brazo = (s, modo) => { const hx = s * 11, p = modo === 'saluda' ? `M${hx} -59 q${s * 7} -6 ${s * 8} -18` : `M${hx} -59 q${s * 4} 8 ${s * 4} 20`, fin = modo === 'saluda' ? [hx + s * 8, -77] : [hx + s * 4, -39];
    return `<g class="dl-brazo ${modo}"><path d="${p}" stroke="${camisa}" stroke-width="5.6" fill="none" stroke-linecap="round"/><circle cx="${fin[0]}" cy="${fin[1]}" r="2.7" fill="${piel}"/></g>`; };
  const torso = L.fig === 'mujer' ? 'M-11 -37 q1.2 -8 -.6 -16.6 q.4 -10 9 -11 h5.2 q8.6 1 9 11 q-1.8 8.6 -.6 16.6 q-11 3 -22 0z' : 'M-12 -37 v-17 q0 -9.6 9.4 -10.6 h5.2 q9.4 1 9.4 10.6 v17 q-12 3 -24 0z';
  const detras = calvo ? '' : L.fig === 'mujer' ? `<path d="M-10.6 -79 q0 -15 10.6 -15 q10.6 0 10.6 15 q2 6 -1 9 q-3 4 -6 1 v-6 h-8.4 v6 q-3 3 -6 -1 q-3 -3 -1 -9z" fill="${pelo}"/><circle cx="0" cy="-64" r="3.6" fill="${pelo}"/>`
    : L.fig === 'neutra' ? `<path d="M-10.2 -79 q0 -14 10.2 -14 q10.2 0 10.2 14 v7 q-1.8 2.2 -3.8 0 v-4 h-12.8 v4 q-2 2.2 -3.8 0z" fill="${pelo}"/>` : '';
  const arriba = calvo ? `<path d="M-8.4 -77 q-1.2 4 .4 7 M8.4 -77 q1.2 4 -.4 7" stroke="${L.barba ? pelo : 'rgba(0,0,0,.18)'}" stroke-width="2.2" fill="none" stroke-linecap="round"/><ellipse cx="-3" cy="-84" rx="3" ry="1.6" fill="rgba(255,255,255,.35)"/>`
    : L.fig === 'hombre' ? `<path d="M-8.6 -78.5 q-.8 -11.4 8.6 -11.6 q9.4 .2 8.6 11.6 q-1.2 -4.2 -3 -5.4 q-6 1.4 -11.6 -.6 q-1.6 1.6 -2.6 6z" fill="${pelo}"/>`
    : `<path d="M-8.8 -77 q-.6 -12.6 8.8 -12.8 q9.4 .2 8.8 12.8 q-2.4 -6.2 -8.8 -6.8 q-6.4 .6 -8.8 6.8z" fill="${pelo}"/>`;
  const barba = L.barba && L.fig !== 'mujer' ? `<path d="M-8.2 -77 q-.4 10.4 8.2 11 q8.6 -.6 8.2 -11 q-1.6 4.6 -8.2 5 q-6.6 -.4 -8.2 -5z" fill="${calvo ? '#3b2a20' : pelo}"/>` : '';
  const lentes = L.lentes ? `<g fill="rgba(255,255,255,.25)" stroke="#20242c" stroke-width=".9"><rect x="-6.6" y="-79.6" width="5.2" height="4.2" rx="1.6"/><rect x="1.4" y="-79.6" width="5.2" height="4.2" rx="1.6"/></g><path d="M-1.4 -77.8 h2.8" stroke="#20242c" stroke-width=".9"/>` : '';
  const panza = L.cuerpo === 'gordo' ? `<ellipse cx="0" cy="-44" rx="12.6" ry="9.4" fill="${camisa}"/><path d="M0 -60 v22" stroke="${camisa2}" stroke-width=".8"/>` : '';
  return `<g class="dl-p ga-p dl-${L.fig}" style="--d:${d}s">
    <ellipse cx="0" cy="0" rx="${(13 * wx).toFixed(1)}" ry="2.4" fill="rgba(0,0,0,.16)"/>
    <g class="dl-cuerpo">
      <g transform="scale(${wx} ${hy})">
        <rect x="-8" y="-38" width="7.4" height="35" rx="3.2" fill="${pant}"/><rect x=".6" y="-38" width="7.4" height="35" rx="3.2" fill="${pant}"/>
        <path d="M-9.6 -4.5 h8.4 v3.4 h-9.2 q-1.8 0 -1.4 -1.8z M1.2 -4.5 h8.4 q2.2 1.6 1.2 3.4 h-9.6z" fill="#14161b"/>
        ${brazo(-1, 'baja')}
        <path d="${torso}" fill="${camisa}"/>${panza}
        <rect x="-12" y="-40" width="24" height="3.4" rx="1" fill="#14161b"/><rect x="-2" y="-40.2" width="4" height="3.8" rx=".8" fill="#c9a43a"/>
        <path d="M-12 -57 q-2.6 -5 3 -7.6 l4 -.2z" fill="${camisa2}"/><circle cx="-10.2" cy="-58" r="2.2" fill="#ffd54a"/>
        <path d="M4 -55 l3 1.2 v3 q0 2.6 -3 3.6 q-3 -1 -3 -3.6 v-3z" fill="#e0b84a"/>
        <rect x="6.4" y="-63" width="3.6" height="6" rx="1" fill="#14161b"/><circle class="ga-led" cx="8.2" cy="-61.4" r=".9" fill="#ff3b3b"/>
        <path d="M-3.4 -64.8 l3.4 4.6 l3.4 -4.6z" fill="${piel}"/>
        ${brazo(1, saluda ? 'saluda' : 'baja')}
      </g>
      <g transform="translate(0 ${(-sube).toFixed(1)})">
        ${detras}
        <rect x="-2.6" y="-69" width="5.2" height="6" rx="2" fill="${piel}"/>
        <ellipse cx="-8.3" cy="-76.5" rx="1.7" ry="2.4" fill="${piel}"/><ellipse cx="8.3" cy="-76.5" rx="1.7" ry="2.4" fill="${piel}"/>
        <ellipse cx="0" cy="-77" rx="8.3" ry="9.6" fill="${piel}"/>
        ${barba}${arriba}
        <path d="M-5.4 -80.6 q1.6 -1 3.2 0 M2.2 -80.6 q1.6 -1 3.2 0" stroke="${calvo ? '#3b2a20' : pelo}" stroke-width="1" fill="none" stroke-linecap="round"/>
        <g class="dl-ojos"><ellipse cx="-3.2" cy="-77.4" rx="1" ry="1.35" fill="#24242c"/><ellipse cx="3.2" cy="-77.4" rx="1" ry="1.35" fill="#24242c"/></g>
        ${lentes}
        <circle cx="-5" cy="-73.6" r="1.5" fill="rgba(255,110,110,.25)"/><circle cx="5" cy="-73.6" r="1.5" fill="rgba(255,110,110,.25)"/>
        <path d="M-2.8 -72 q2.8 2.2 5.6 0" stroke="${L.fig === 'mujer' ? '#c2455a' : '#8a3b2e'}" stroke-width="1.1" fill="none" stroke-linecap="round"/>
      </g></g></g>`;
}
/* Solo la cara, para las fichitas. */
const caraGuardia = (nombre, look) => `<svg class="ga-cara" viewBox="-12.5 -93 25 27" aria-hidden="true">${svgGuardia(nombre, { ...lookCompleto(nombre, look), altura:'mediano', cuerpo:'mediano' })}</svg>`;
/* La escena: la casilla de la garita con su barrera y los guardias al frente. */
function escenaGuardias(gs, { noche = false, conNombres = true } = {}){
  const paso = 31, x0 = 82, H = 122, W = Math.max(170, x0 + gs.length * paso + 6);
  const gente = gs.map((g, i) => { const L = lookCompleto(g.n, g.look), alto = 96 * lookAltura(L), nom = String(g.n).split(' ')[0], an = nom.length * 4.9 + 10;
    return `<g transform="translate(${x0 + i * paso + 10} ${H - 6})" data-a="guardia-saluda" data-i="${i}" role="button" aria-label="${esc(g.n)}"><g class="dl-salto">${svgGuardia(g.n, g.look, { saluda: i === 0, d:(i * .45).toFixed(2) })}
      ${conNombres ? `<g class="dl-nom" transform="translate(0 ${(-alto - 9).toFixed(1)})"><rect x="${-an / 2}" y="-8" width="${an}" height="12" rx="6" fill="${colorDe(g.n)}"/><text x="0" y="1.4" text-anchor="middle" font-size="8" font-weight="700" fill="#fff">${esc(nom)}</text></g>` : ''}</g></g>`; }).join('');
  return `<svg class="dl-svg ga-svg" viewBox="0 -16 ${W} ${H + 16}" role="img" aria-label="La garita${gs.length ? ' con ' + esc(gs.map(g => g.n).join(', ')) : ''}">
    <ellipse cx="${W / 2}" cy="${H - 5}" rx="${W / 2 - 4}" ry="5" fill="rgba(46,125,50,.14)"/>
    <g class="ga-casilla"><path d="M4 46 L32 30 L60 46z" fill="#0d6b66"/><rect x="9" y="46" width="46" height="70" rx="3" fill="#eef3f2" stroke="#c9d6d3" stroke-width=".8"/>
      <rect x="15" y="54" width="34" height="22" rx="2.4" class="ga-ventana ${noche ? 'ga-noche' : ''}"/><path d="M32 54 v22" stroke="#c9d6d3" stroke-width=".8"/>
      <rect x="14" y="36" width="36" height="9" rx="2" fill="#0b3c47"/><text x="32" y="43" text-anchor="middle" font-size="6.4" font-weight="800" fill="#fff" letter-spacing=".6">GARITA</text>
      <rect x="25" y="84" width="14" height="32" rx="1.6" fill="#c9d6d3"/><circle class="ga-baliza" cx="32" cy="27" r="2.6" fill="#ffb300"/></g>
    <rect x="62" y="96" width="4" height="20" rx="1" fill="#3d4f4d"/><g class="ga-barrera"><rect x="64" y="96" width="${Math.min(W - 70, 70)}" height="3.4" rx="1.7" fill="#fff" stroke="#d33a3a" stroke-width=".6" stroke-dasharray="5 5"/></g>
    ${gente}</svg>`;
}
A['guardia-saluda'] = el => {
  const caja = el.closest('.ga-caja, .gc, .tl, .dl-caja') || el.closest('svg')?.parentElement; const i = el.dataset.i;
  const g = caja && caja.querySelector(`.dl-svg g[data-i="${i}"]`); if (!g) return;
  caja.querySelectorAll('.ga-n.on').forEach(b => b.classList.remove('on')); caja.querySelectorAll(`.ga-n[data-i="${i}"]`).forEach(b => b.classList.add('on'));
  g.classList.remove('salta'); void caja.offsetWidth; g.classList.add('salta');
  clearTimeout(g._t); g._t = setTimeout(() => { g.classList.remove('salta'); caja.querySelectorAll('.ga-n.on').forEach(b => b.classList.remove('on')); }, 1800);
};

/* ---------- la guardia de ahora (lo que ven todos) ---------- */
const lookDe = n => { const x = aLista(Store.s.guardiaLooks).find(z => z && z.id === slugGuardia(n)); return x && x.look ? x.look : null; };
/* Lo que la garita publica: el turno abierto y sus guardias, nada más. */
function guardiaAhoraDeseada(){
  const t = turnoAbierto();
  /* 14-10: cuántos de mantenimiento están trabajando en el barrio y desde
     qué hora (sin nombres ni DNI), para el loguito de la portada
     (js/mantenimiento.js). Si este equipo todavía no bajó la lista, se deja
     lo que ya había publicado, así no lo borra. */
  const cur = aLista(Store.s.guardiaAhora).find(x => x && x.id === 'ahora') || {};
  const mp = typeof mantPublico === 'function' && typeof mantBajada === 'function' && mantBajada() ? mantPublico() : { n:cur.mant || 0, desde:cur.mantDesde || 0 };
  const mant = mp.n ? { mant:mp.n, mantDesde:mp.desde } : {};
  if (!t) return { id:'ahora', abierto:false, ...mant };
  const c = turnosConfig().find(x => x.nombre === t.turno) || {};
  /* 14-10: cada guardia con su horario (los horarios se superponen). */
  return { id:'ahora', abierto:true, turno:t.turno, desde:c.desde || '', hasta:c.hasta || '', inicio:t.at,
    guardias: relevosDe(t).map(r => { const l = lookDe(r.n), h = horarioDe(r.h); return { n:r.n, ...(l ? { look:l } : {}), ...(h ? { h:r.h, desde:h.desde, hasta:h.hasta } : {}) }; }), policia: policiasAdentro(t).length ? 1 : 0, ...mant };
}
/* ¿Este equipo tiene el libro de guardia? Lo bajan las cuentas de la garita,
   la Administración (en cualquier modo, también "como vecino") y la supervisión.
   Nube anota lo que ya bajó como base + colección, sin barra ("staffbitacora"). */
const rolDeGuardia = () => ['guardia', 'admin', 'supervisor'].includes(yo()?.rol);
const bitacoraBajada = () => typeof Nube === 'undefined' || !Nube.activa() || !!(Nube.listos && (Nube.listos.has('staffbitacora') || Nube.listos.has('staff/bitacora')));
/* Quien tiene el libro lo arma de ahí; los vecinos leen el registro público. */
function guardiaAhora(){
  if (rolDeGuardia() && bitacoraBajada() && aLista(Store.s.bitacora).length) return guardiaAhoraDeseada();
  const g = aLista(Store.s.guardiaAhora).find(x => x && x.id === 'ahora');
  if (!g) return null;
  if (g.abierto && Date.now() - (g.inicio || 0) > 16 * HORA) return { id:'ahora', abierto:false, viejo:true };
  return { ...g, guardias: aLista(g.guardias).filter(x => x && x.n) };
}
/* El registro público se mantiene al día solo cuando cambia algo (14-10-2026):
   lo escribe la garita y también cualquier equipo de la Administración (en
   cualquier modo), así los vecinos ven a los guardias aunque el teléfono de
   la garita todavía no tenga la versión nueva. Todos lo arman igual, del
   mismo libro, y cada uno escribe solo si difiere de lo que hay en la base.
   Hasta que la bitácora no bajó de la nube no se sabe si hay turno: nada. */
let gaT = 0, gaUlt = 0, gaVeces = 0, gaVentana = 0;
/* COMPARAR BIEN, O LA PANTALLA TITILA (13-10-2026)
   Lo que vuelve de la base del barrio trae las mismas cosas pero con las
   claves en otro orden, sin los nulos y sin las listas vacías. Comparando el
   texto tal cual, SIEMPRE daba "distinto": la garita y la Administración
   volvían a publicar lo mismo cada 400 ms, cada publicación redibujaba la
   ventana y además le llegaba a todos los demás, así que la pantalla
   titilaba en la garita, la Administración, la supervisión y el hotel.
   Ahora se compara el contenido, sin que importe el orden ni lo que la nube
   no guarda. */
const gaCanon = x => {
  if (Array.isArray(x)) return x.map(gaCanon);
  if (!x || typeof x !== 'object') return x;
  const o = {};
  Object.keys(x).sort().forEach(k => {
    const v = x[k];
    if (v == null || v === '') return;                 /* la nube no guarda nulos ni vacíos */
    if (Array.isArray(v) && !v.length) return;         /* ni las listas vacías */
    o[k] = gaCanon(v);
  });
  return o;
};
const gaHuella = x => { if (!x) return ''; const y = { ...x, guardias: aLista(x.guardias) }; delete y.at; return JSON.stringify(gaCanon(y)); };
function sincroGuardiaAhora(){
  const u = yo();
  if (!u || !['guardia', 'admin'].includes(u.rol) || u.estado !== 'aprobado') return;
  if (!bitacoraBajada()) return;
  const d = guardiaAhoraDeseada(), cur = aLista(Store.s.guardiaAhora).find(x => x && x.id === 'ahora');
  if (gaHuella(cur) === gaHuella(d)) return;
  const ahora = Date.now();
  /* La Administración es el respaldo de la garita: solo publica si en la base
     no hay nada o lo que hay quedó viejo (más de un minuto). Así los dos
     equipos no se pisan uno al otro escribiendo por turnos. */
  if (u.rol === 'admin' && cur && ahora - (cur.at || 0) < 60000){ clearTimeout(gaT); gaT = setTimeout(sincroGuardiaAhora, 60000); return; }
  /* Freno de seguridad: nunca más de una publicación cada 10 segundos, ni más
     de seis en cinco minutos. Si algo volviera a dar "distinto" para siempre,
     la pantalla no titila: deja de publicar y queda anotado en la consola. */
  if (ahora - gaUlt < 10000){ clearTimeout(gaT); gaT = setTimeout(sincroGuardiaAhora, 10000 - (ahora - gaUlt)); return; }
  if (ahora - gaVentana > 300000){ gaVentana = ahora; gaVeces = 0; }
  if (++gaVeces > 6){ console.warn('Guardia en la portada: se publicó demasiadas veces seguidas, se frena un rato.'); return; }
  gaUlt = ahora;
  Store.cambiar(s => { s.guardiaAhora = [{ ...d, at:ahora }]; });
}
Store.alCambiar(() => { clearTimeout(gaT); gaT = setTimeout(sincroGuardiaAhora, 400); });

/* En la portada: debajo del DEA, las caritas de quienes están de guardia. */
function guardiaHero(){
  const g = guardiaAhora(); if (!g) return '';
  if (!g.abierto || !g.guardias.length) return `<button class="guardia-hero sin" data-a="guardia-ver" aria-label="La guardia de la garita">${I('shield')}<span><b>Garita</b>Turno sin anotar</span></button>`;
  const ns = g.guardias.map(x => String(x.n).split(' ')[0]);
  return `<button class="guardia-hero" data-a="guardia-ver" aria-label="De guardia ahora en la garita: ${esc(g.guardias.map(x => x.n).join(', '))}. Ver la guardia">
    <span class="gh-caras">${g.guardias.slice(0, 3).map(x => `<i style="--c:${colorDe(x.n)}">${caraGuardia(x.n, x.look)}</i>`).join('')}</span>
    <span><b>De guardia${g.policia ? ` <em>${I('shield')}+ policía</em>` : ''}</b>${esc(ns.length > 2 ? ns.slice(0, 2).join(', ') + ' +' + (ns.length - 2) : ns.join(' y '))}</span></button>`;
}
A['guardia-ver'] = () => {
  const g = guardiaAhora(), n = nochePolicia(), c = Store.s.config;
  const hr = new Date().getHours(), noche = hr < 7 || hr >= 20;
  if (!g || !g.abierto || !g.guardias.length){
    hoja('La guardia de la garita', `${aviso('info', 'clock', 'Ahora no hay un turno anotado', 'La garita anota quiénes están de guardia al empezar cada turno. En cuanto lo haga, aparecen acá.')}
      ${c.garitaTel ? `<a class="btn btn-pri btn-block" style="margin-top:12px" href="${telLink(c.garitaTel)}">${I('phone')}Llamar a la garita</a>` : ''}`);
    return;
  }
  const pol = g.policia ? `<span class="ga-pol on">${I('shield')}<b>Policía nocturna de servicio</b><small>${esc(n.etiqueta)} · ${horarioNocheTxt(n)}</small></span>`
    : `<span class="ga-pol">${I('moon')}<b>Policía nocturna</b><small>${n.ahora ? 'En horario: todavía no se registró' : `${esc(n.etiqueta)}: desde las ${hora(n.desde)} h`}</small></span>`;
  hoja('De guardia ahora', `<div class="ga-caja ${noche ? 'ga-noche' : 'ga-dia'}">
      <div class="ga-cielo"><i class="tl-astro"></i>${noche ? '<i class="tl-estrella s1"></i><i class="tl-estrella s2"></i><i class="tl-estrella s3"></i>' : '<i class="tl-nube n1"></i><i class="tl-nube n2"></i>'}</div>
      ${escenaGuardias(g.guardias, { noche })}</div>
    <div class="ga-turno"><span class="ga-tic ${turnoEsNoche(g.turno) ? 'ga-noche' : ''}">${I(turnoEsNoche(g.turno) ? 'moon' : 'sun')}</span>
      <div class="grow"><b>Guardia · ${esc(g.turno)}</b><small>${g.desde && g.hasta ? `${esc(g.desde)} a ${esc(g.hasta)} h · ` : ''}desde las ${hora(g.inicio)} h</small></div><span class="pill p-ok">${I('check')}En la garita</span></div>
    <div class="ga-nombres">${g.guardias.map((x, i) => `<button type="button" class="ga-n" data-a="guardia-saluda" data-i="${i}" style="--c:${colorDe(x.n)}">${caraGuardia(x.n, x.look)}<span>${esc(x.n)}${x.desde ? `<small class="ga-h">${esc(x.h || '')} · ${esc(x.desde)} a ${esc(x.hasta)} h</small>` : ''}</span></button>`).join('')}</div>
    ${pol}
    <div class="btns" style="margin-top:12px">${c.garitaTel ? `<a class="btn btn-pri grow" href="${telLink(c.garitaTel)}">${I('phone')}Llamar a la garita</a>` : ''}
      ${!veGarita() && !esHotel() ? `<button class="btn btn-sec grow" data-a="abrir" data-v="privado" data-p="guardia">${I('chat')}Escribirle a la garita</button>` : ''}</div>
    <p class="muted tiny" style="margin:10px 2px 0">${I('lock')} Se ve solo el nombre de quienes están de guardia ahora, su horario, tal como lo anotó la garita, y cómo eligió aparecer cada uno. Cambia solo cuando entra o sale cada guardia.</p>`);
  setTimeout(() => { const hc = document.getElementById('hojaCuerpo'); if (hc) hc.scrollTop = 0;
    const b = document.querySelector('#hoja .ga-caja g[data-i="0"]'); if (b) A['guardia-saluda'](b); }, 350);
};

/* ---------- en Tu cuenta de la garita: los de turno y cómo aparece cada uno ---------- */
function tarjetaGuardiasCuenta(){
  const t = turnoAbierto(); if (!t) return '';
  const gs = aLista(t.guardias).map(n => ({ n, look:lookDe(n) }));
  if (!gs.length) return '';
  const hr = new Date().getHours(), noche = hr < 7 || hr >= 20;
  return `<section class="gc ${noche ? 'ga-noche' : 'ga-dia'}" aria-label="De guardia ahora">
    <div class="ga-caja"><div class="ga-cielo"><i class="tl-astro"></i>${noche ? '<i class="tl-estrella s1"></i><i class="tl-estrella s2"></i>' : '<i class="tl-nube n1"></i><i class="tl-nube n2"></i>'}</div>
      ${escenaGuardias(gs, { noche })}<span class="tl-chapa">${I('shield')}Turno ${esc(t.turno)}</span></div>
    <div class="gc-cuerpo"><div class="tl-tit"><b>De guardia ahora</b><small>Así los ven los vecinos en la portada. Cada uno elige cómo aparece: tocá tu nombre.</small></div>
      <div class="ga-nombres">${gs.map((g, i) => { const L = lookCompleto(g.n, g.look);
        return `<button type="button" class="ga-n edita" data-a="guardia-look" data-v="${esc(g.n)}" data-i="${i}" style="--c:${colorDe(g.n)}">${caraGuardia(g.n, g.look)}<span>${esc(g.n)}<small>${L.elegido ? 'Cambiar cómo aparezco' : 'Elegir cómo aparezco'}</small></span>${I('edit')}</button>`; }).join('')}</div></div></section>`;
}
A['guardia-look'] = el => {
  const n = el.dataset.v; if (!n || !esGuardia()) return;
  const L = lookCompleto(n, lookDe(n));
  const grupo = (k, multi = false) => `<div class="gl-g"><b>${LOOK_OPC[k].t}</b><div class="gl-op">${LOOK_OPC[k].op.map(([v, t]) => {
    const on = multi ? !!L[v] : L[k] === v;
    return `<label><input type="${multi ? 'checkbox' : 'radio'}" name="${multi ? v : k}" value="${multi ? '1' : v}" ${on ? 'checked' : ''}><span>${k === 'pelo' ? `<i class="gl-col" style="background:${PELO_COL[v] || 'transparent'}"></i>` : k === 'piel' ? `<i class="gl-col" style="background:${PIEL_COL[v]}"></i>` : ''}${t}</span></label>`; }).join('')}</div></div>`;
  Cuenta.enSub = true;
  hoja(`Cómo aparece ${n.split(' ')[0]}`, `<form data-f="guardia-look" data-n="${esc(n)}" class="gl-form">
    <div class="gl-vista"><svg class="dl-svg" viewBox="-24 -112 48 116" aria-hidden="true">${svgGuardia(n, L, { saluda:true })}</svg><span>${esc(n)}</span></div>
    ${grupo('fig')}${grupo('altura')}${grupo('cuerpo')}${grupo('pelo')}${grupo('piel')}${grupo('extra', true)}
    <button class="btn btn-pri btn-block btn-grande">${I('check')}Listo, así aparezco</button>
    <p class="muted tiny" style="margin:8px 0 0">Es un dibujo, no una foto: lo ven los vecinos en la portada mientras estás de guardia. Lo elige cada uno, nada se adivina por el nombre.</p></form>`);
};
const lookDelForm = f => ({ fig:f.querySelector('[name=fig]:checked')?.value || '', altura:f.querySelector('[name=altura]:checked')?.value || '', cuerpo:f.querySelector('[name=cuerpo]:checked')?.value || '',
  pelo:f.querySelector('[name=pelo]:checked')?.value || '', piel:f.querySelector('[name=piel]:checked')?.value || '', barba:!!f.querySelector('[name=barba]:checked'), lentes:!!f.querySelector('[name=lentes]:checked') });
document.addEventListener('change', e => {
  const f = e.target && e.target.closest && e.target.closest('.gl-form'); if (!f) return;
  const svg = f.querySelector('.gl-vista svg'); if (svg) svg.innerHTML = svgGuardia(f.dataset.n, lookDelForm(f), { saluda:true });
});
F['guardia-look'] = (d, form) => {
  if (!esGuardia()) return;
  const n = form.dataset.n, look = lookDelForm(form), id = slugGuardia(n);
  Store.cambiar(s => { s.guardiaLooks = aLista(s.guardiaLooks).filter(x => x && x.id !== id); s.guardiaLooks.push({ id, nombre:n, look, at:Date.now() }); });
  sincroGuardiaAhora();
  toast(`Listo: ${n.split(' ')[0]} ya aparece así`, 'check');
  Cuenta.enSub = false; cerrarHoja(); setTimeout(() => A['mi-cuenta'](), 80);
};
