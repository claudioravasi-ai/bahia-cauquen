/* =========================================================
   Inicio, Garita, Visitas y el pase que pide la visita.
   ========================================================= */

/* ---------- piezas ---------- */
const teja = ({ v, p = '', a = 'abrir', icon, color = 'brand', t, s = '', n = '', badge = 0, destaca = false, grande = false }) =>
  `<button class="teja ${destaca ? 'destaca' : ''} ${grande ? 'grande' : ''}" data-a="${a}" data-v="${v || ''}" data-p="${esc(p)}">
    <div class="arriba"><span class="ic ic-${color}">${I(icon)}</span>${badge ? `<span class="dot-badge">${badge > 99 ? '99+' : badge}</span>` : n !== '' ? `<span class="n">${n}</span>` : ''}</div>
    <div><b>${t}</b>${s ? `<small>${s}</small>` : ''}</div></button>`;
const superficie = ({ a = 'abrir', v = '', p = '', id = '', icon, color = 'brand', t, s = '', cls = '' }) =>
  `<button class="superficie ${cls}" data-a="${a}" data-v="${esc(v)}" data-p="${esc(p)}" data-id="${esc(id)}">
    <span class="ic ic-${color}">${I(icon)}</span><span class="txt"><b>${t}</b>${s ? `<small>${s}</small>` : ''}</span>${I('right')}</button>`;
const aviso = (nivel, icon, t, x, acciones = '') =>
  `<div class="aviso a-${nivel}">${I(icon)}<div class="txt"><b>${t}</b>${x || ''}${acciones ? `<div class="acciones">${acciones}</div>` : ''}</div></div>`;
const vacio = (icon, t) => `<div class="vacio">${I(icon)}${t}</div>`;
const sec = (t, extra = '') => `<div class="sec"><h2>${t}</h2>${extra}</div>`;

/* ---------- pases ---------- */
const TIPOS_PASE = {
  visita:    { n:'Visita', icon:'users', c:'brand' },
  delivery:  { n:'Delivery', icon:'box', c:'wood' },
  proveedor: { n:'Proveedor / obra', icon:'wrench', c:'accent' },
  personal:  { n:'Personal fijo', icon:'user', c:'sky' },
  remis:     { n:'Remís / taxi', icon:'car', c:'warn' },
  invitado:  { n:'Invitado a evento', icon:'flame', c:'wood' },
};
const ESTADO_TXT = { esperado:'Esperado', adentro:'Adentro', salio:'Salió', vencido:'Vencido', cancelado:'Cancelado', futuro:'Próximo' };
function paseValidoEn(p, iso){
  if (p.cancelado) return false;
  if (p.dias && p.dias.length) return iso >= p.fecha && iso <= (p.fechaFin || p.fecha) && p.dias.includes(fechaDe(iso).getDay());
  return p.fecha === iso;
}
function estadoPase(p, iso = hoyISO()){
  if (p.cancelado) return 'cancelado';
  const l = p.log && p.log[iso];
  if (l && l.out) return 'salio';
  if (l && l.in) return 'adentro';
  if (!p.dias?.length && p.fecha > iso) return 'futuro';
  if (!paseValidoEn(p, iso)) return p.dias?.length && iso < p.fecha ? 'futuro' : 'vencido';
  const d = minutosDe(p.desde), h = minutosDe(p.hasta);
  if (iso === hoyISO() && h > d && ahoraMin() > h + 60) return 'vencido';
  return 'esperado';
}
const pasesDelDia = (iso = hoyISO()) => Store.s.pases.filter(p => paseValidoEn(p, iso) || (p.log && p.log[iso]));
const normPatente = t => String(t || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
function textoPase(p){
  const u = usuario(p.hostId) || {}, c = Store.s.config;
  const cuando = p.dias?.length ? `${p.dias.map(d => DIAS[d]).join(', ')} de ${p.desde} a ${p.hasta} (hasta el ${fechaCorta(p.fechaFin)})` : `${fechaLarga(p.fecha)} de ${p.desde} a ${p.hasta}`;
  return `¡Hola${p.nombre ? ' ' + p.nombre.split(' ')[0] : ''}! Te espero en el barrio ${c.nombre} (${u.casa || ''}).\n\n` +
    `Tu código de ingreso: ${p.codigo}\nVálido: ${cuando}.\nMostralo en la garita (código o QR).\n\n` +
    `Tu pase con QR: ${urlApp('pase/' + p.id)}\nCómo llegar: ${c.mapa}`;
}
function tarjetaPase(p, { garita = false } = {}){
  const t = TIPOS_PASE[p.tipo] || TIPOS_PASE.visita, est = estadoPase(p), host = usuario(p.hostId) || {};
  const casaFoto = garita && host.fotoCasa ? fotoHTML(host.fotoCasa, 'casa-foto chica') : '';
  const franja = p.dias?.length ? `${p.dias.map(d => DIAS[d][0]).join(' ')} · ${p.desde}–${p.hasta}` : `${relDia(p.fecha)} · ${p.desde}–${p.hasta}`;
  return `<div class="card" style="padding:13px 14px"><div class="pase">
    ${casaFoto || `<span class="ic ic-${t.c}">${I(t.icon)}</span>`}
    <div class="datos"><b>${esc(p.nombre)}</b>
      <span>${garita ? `<b style="display:inline;color:var(--ink)">${esc(host.casa || '')}</b> · ` : ''}${t.n} · ${franja}${p.patente ? ' · ' + esc(p.patente) : ''}</span></div>
    <span class="estado e-${est}">${ESTADO_TXT[est]}</span></div>
    <div class="btns" style="margin-top:10px">
      ${garita ? (est === 'esperado' || est === 'vencido' ? `<button class="btn btn-sm btn-ok" data-a="pase-in" data-id="${p.id}">${I('login')}Ingresó</button>` : est === 'adentro' ? `<button class="btn btn-sm btn-sec" data-a="pase-out" data-id="${p.id}">${I('logout')}Salió</button>` : '')
        : `${est === 'esperado' || est === 'futuro' || est === 'adentro' ? `<button class="btn btn-sm btn-sec" data-a="ver-pase" data-id="${p.id}">${I('qr')}Ver pase</button>
           <button class="btn btn-sm btn-wa" data-a="compartir-pase" data-id="${p.id}">${I('share')}Enviar</button>` : ''}
           <button class="btn btn-sm btn-sec" data-a="editar-pase" data-id="${p.id}" title="Editar">${I('edit')}Editar</button>
           ${est === 'esperado' || est === 'futuro' ? `<button class="btn btn-sm btn-danger-soft" data-a="cancelar-pase" data-id="${p.id}" title="Cancelar el pase">${I('x')}</button>` : ''}
           <button class="btn btn-sm btn-danger-soft" data-a="borrar-pase" data-id="${p.id}" title="Borrar de mi lista">${I('trash')}</button>`}
    </div>${garita && p.borrado ? `<div class="muted tiny" style="margin-top:6px">${I('trash')} El vecino la sacó de su lista ${hace(p.borrado.at)} · queda en el historial</div>` : ''}${p.editado ? `<div class="muted tiny" style="margin-top:6px">${I('edit')} Editada ${hace(p.editado.at)}</div>` : ''}</div>`;
}

/* ---------- avisos urgentes del inicio ---------- */
function urgentesVecino(){
  const u = yo(), s = Store.s, out = [], hoy = hoyISO();
  s.sos.filter(x => x.userId === u.id && x.estado !== 'resuelta').forEach(x => out.push(aviso('danger latido', 'siren',
    x.estado === 'en_camino' ? `La guardia va en camino (${nombreDe(x.atiende)})` : x.estado === 'atendida' ? 'La guardia dio por atendida tu alerta' : 'Tu alerta SOS está activa',
    x.estado === 'atendida' ? 'Si ya está todo bien, confirmalo para que se cierre en todo el barrio.' : 'La guardia, la Administración y los vecinos ya fueron avisados.',
    `<button class="btn btn-xs btn-ok" data-a="sos-cancelar" data-id="${x.id}">${I('check')}Ya está solucionado</button>`)));
  s.llegadas.filter(l => l.hostId === u.id && l.estado === 'consultando').forEach(l => out.push(aviso('warn latido', 'gate',
    `En la garita: ${esc(l.nombre)} pregunta por vos`, `${esc(l.motivo || 'Sin aviso previo')}${l.patente ? ' · ' + esc(l.patente) : ''} · ${hace(l.at)}`,
    `<button class="btn btn-xs btn-ok" data-a="llegada-si" data-id="${l.id}">${I('check')}Que pase</button><button class="btn btn-xs btn-danger-soft" data-a="llegada-no" data-id="${l.id}">No lo conozco</button>`)));
  s.solicitudesPase.filter(r => r.hostId === u.id && r.estado === 'pendiente').forEach(r => out.push(aviso('info', 'qr',
    `${esc(r.nombre)} te pide un pase`, `${fechaCorta(r.fecha)} · ${r.desde}${r.patente ? ' · ' + esc(r.patente) : ''}`,
    `<button class="btn btn-xs btn-ok" data-a="sol-pase-si" data-id="${r.id}">${I('check')}Aprobar</button><button class="btn btn-xs btn-sec" data-a="sol-pase-no" data-id="${r.id}">Rechazar</button>`)));
  const paq = s.paquetes.filter(p => p.hostId === u.id && !p.retirado);
  if (paq.length) out.push(aviso('brand', 'box', `Tenés ${plural(paq.length, 'paquete')} en la garita`, paq.map(p => esc(p.empresa)).join(', '),
    `<button class="btn btn-xs btn-sec" data-a="abrir" data-v="mis-paquetes">Ver y confirmar</button>`));
  if (typeof alertasParaMi === 'function') alertasParaMi().filter(a => !respuestaDe(a)).forEach(a => out.push(aviso('danger latido', 'siren', `Aviso urgente: ${esc(a.titulo)}`, esc(a.zona),
    `<button class="btn btn-xs btn-ok" data-a="alerta-responder" data-id="${a.id}" data-v="ok">Recibido</button><button class="btn btn-xs btn-danger-soft" data-a="alerta-responder" data-id="${a.id}" data-v="ayuda">Necesito ayuda</button>`)));
  s.reservas.filter(r => r.userId === u.id && (r.fecha === hoy || r.fecha === sumarDias(hoy, 1)) && !r.cancelada).forEach(r => {
    const a = amenity(r.amenity); if (!a) return;
    out.push(aviso('ok', a.icon, `${r.fecha === hoy ? 'Hoy' : 'Mañana'} tenés el ${a.nombre}`, `${a.franjas[r.franja]?.join(' a ') || ''} h${r.invitados ? ' · ' + plural(+r.invitados, 'invitado') : ''}`));
  });
  const v = s.votaciones.find(v => v.cierra > Date.now() && !(u.casa in v.votos));
  if (v) out.push(aviso('info', 'vote', 'Votación abierta', esc(v.titulo), `<button class="btn btn-xs btn-sec" data-a="abrir" data-v="votaciones">Votar</button>`));
  return out;
}
function recoleccionHoy(){
  const c = Store.s.config, h = new Date(), hoy = h.getDay(), man = (hoy + 1) % 7;
  const vol = volsProximos().find(v => v.fecha === hoyISO() || v.fecha === sumarDias(hoyISO(), 1));
  if (vol) return { vol:true, t:`${vol.fecha === hoyISO() ? 'Hoy' : 'Mañana'} pasan por los voluminosos`, x:vol.detalle || c.voluminososDetalle };
  if (c.recoleccion[hoy] && ahoraMin() < minutosDe(c.recoleccionHora)) return { t:`Hoy pasa el camión: ${c.recoleccion[hoy]}`, x:`Alrededor de las ${c.recoleccionHora} h.` };
  if (c.recoleccion[man] && h.getHours() >= 17) return { t:`Mañana pasa el camión: ${c.recoleccion[man]}`, x:'Sacá la bolsa esta noche, en el canasto cerrado.' };
  return null;
}

/* =========================================================
   INICIO
   La portada no es un tablero con treinta botones: es una puerta.
   Tiene cuatro capas, de arriba abajo:
     1. quién sos y qué tiempo hace (el hero),
     2. QUÉ PASA AHORA: solo lo que pide una decisión tuya,
     3. QUÉ QUERÉS HACER: las cuatro cosas que todos hacen siempre,
     4. POR DÓNDE SEGUIR: cuatro secciones, cada una con su propia
        ventana. Adentro de cada una está el detalle.
   Así cada objetivo queda marcado y la portada invita a recorrerla
   en lugar de abrumar.
   ========================================================= */

/* =========================================================
   LAS ILUSTRACIONES DE LAS SECCIONES
   Cada puerta de la portada es una ventana con un dibujo: una casa para
   "Tu casa", un barrio soleado y colorido para "El barrio" y la bahía de Ushuaia
   (el faro, el crucero, el avión) para "Ushuaia y servicios". Van como
   SVG dentro del código: no pesan, no dependen de internet y se ven
   nítidos en cualquier pantalla.
   Si algún día hay una foto propia para una sección, alcanza con
   ponerla en `foto` (por ejemplo 'img/servicios.jpg').
   ========================================================= */
const ARTE = {
  casa: { svg:`<svg class="arte-svg" viewBox="0 0 400 240" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><linearGradient id="acC" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6fbad6"/><stop offset=".8" stop-color="#d9eff0"/></linearGradient><linearGradient id="acT" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d98a45"/><stop offset="1" stop-color="#a55a26"/></linearGradient></defs><rect width="400" height="240" fill="url(#acC)"/><circle cx="330" cy="52" r="32" fill="#fff6d1" opacity=".35"/><circle cx="330" cy="52" r="19" fill="#fff6d1"/><path d="M-10 150 L60 78 L100 112 L170 48 L235 118 L285 84 L410 160 V240 H-10Z" fill="#5f8fa3"/><path d="M170 48 L150 68 L162 66 L171 76 L181 64 L192 70Z M60 78 L46 92 L57 90 L63 97 L72 89Z M285 84 L272 96 L282 95 L289 101 L297 94Z" fill="#fff"/><path d="M-10 172 Q90 146 200 164 T410 160 V240 H-10Z" fill="#4c8f6e"/><path d="M-10 202 Q140 180 410 198 V240 H-10Z" fill="#2f6e55"/><g fill="#24574a"><path d="M52 202 L70 146 L88 202Z"/><path d="M28 206 L46 164 L64 206Z" opacity=".85"/><path d="M322 200 L342 136 L362 200Z"/><path d="M352 206 L368 160 L384 206Z" opacity=".85"/></g><rect x="236" y="96" width="14" height="36" rx="2" fill="#6b4636"/><g fill="#fff" opacity=".75"><circle cx="243" cy="85" r="6"/><circle cx="252" cy="72" r="8"/><circle cx="264" cy="57" r="10"/></g><rect x="146" y="138" width="112" height="70" fill="url(#acT)"/><path d="M146 152H258M146 166H258M146 180H258M146 194H258" stroke="#7d421b" stroke-opacity=".35" stroke-width="2"/><path d="M132 144 L202 88 L272 144Z" fill="#b23a2e"/><path d="M132 144 L202 88 L272 144" fill="none" stroke="#fff" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"/><circle cx="202" cy="120" r="9" fill="#ffd97a" stroke="#8a4b22" stroke-width="2"/><rect x="158" y="154" width="26" height="22" rx="2" fill="#ffd97a"/><rect x="220" y="154" width="26" height="22" rx="2" fill="#ffd97a"/><path d="M171 154v22M158 165h26M233 154v22M220 165h26" stroke="#8a4b22" stroke-width="2"/><rect x="190" y="166" width="24" height="42" rx="3" fill="#5a331c"/><circle cx="208" cy="188" r="2.2" fill="#f2c14e"/><rect x="140" y="206" width="124" height="5" rx="2" fill="#5b3b2a"/><path d="M194 211 L180 240 H224 L210 211Z" fill="#d9c9a8" opacity=".85"/></svg>` },
  /* El barrio dibujado: casas de colores, sol, lupinos y el Martial nevado. */
  comunidad: { svg:`<svg class="arte-svg" viewBox="0 0 400 240" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><linearGradient id="abC" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4fb3ea"/><stop offset=".75" stop-color="#bfe8fb"/></linearGradient><radialGradient id="abS" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff7c2"/><stop offset=".55" stop-color="#ffd84d"/><stop offset="1" stop-color="#ffd84d" stop-opacity="0"/></radialGradient><linearGradient id="abP" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8fd16a"/><stop offset="1" stop-color="#5eb14f"/></linearGradient></defs><rect width="400" height="240" fill="url(#abC)"/><circle cx="62" cy="50" r="46" fill="url(#abS)"/><circle cx="62" cy="50" r="20" fill="#ffe066"/><g stroke="#ffd84d" stroke-width="3" stroke-linecap="round"><path d="M90.0 50.0 L100.0 50.0"/><path d="M81.8 69.8 L88.9 76.9"/><path d="M62.0 78.0 L62.0 88.0"/><path d="M42.2 69.8 L35.2 76.9"/><path d="M34.0 50.0 L24.0 50.1"/><path d="M42.2 30.2 L35.1 23.2"/><path d="M61.9 22.0 L61.9 12.0"/><path d="M81.7 30.1 L88.8 23.1"/></g><g fill="#fff" opacity=".92"><ellipse cx="250" cy="40" rx="30" ry="10"/><ellipse cx="270" cy="33" rx="18" ry="11"/><ellipse cx="236" cy="35" rx="14" ry="8"/><ellipse cx="350" cy="62" rx="24" ry="8"/><ellipse cx="364" cy="56" rx="13" ry="8"/></g><path d="M-10 128 L50 78 L88 104 L140 56 L190 98 L236 66 L290 108 L338 70 L410 118 V150 H-10Z" fill="#7aa6c2"/><path d="M140 56 L124 72 L135 70 L142 78 L150 70 L160 74Z M236 66 L222 80 L232 78 L238 85 L246 77 L254 80Z M338 70 L326 82 L335 81 L341 87 L348 80Z M50 78 L40 88 L48 87 L53 92 L60 86Z" fill="#fff"/><path d="M-10 150 Q60 118 150 134 T300 126 T410 134 V240 H-10Z" fill="url(#abP)"/><path d="M-10 176 Q120 150 230 166 T410 160 V240 H-10Z" fill="#4fa84a"/><path d="M180 240 C190 214 150 200 186 184 C214 172 250 170 262 160" fill="none" stroke="#e9d7ae" stroke-width="16" stroke-linecap="round"/><path d="M180 240 C190 214 150 200 186 184 C214 172 250 170 262 160" fill="none" stroke="#fff" stroke-width="1.6" stroke-dasharray="6 6" opacity=".8"/><path d="M20 126.6 L29.9 150 L10.1 150Z" fill="#2e7d4f"/><rect x="18.6" y="150" width="2.9" height="4.5" fill="#6b4636"/><path d="M34 121.4 L46.1 150 L21.9 150Z" fill="#2e7d4f"/><rect x="32.2" y="150" width="3.5" height="5.5" fill="#6b4636"/><path d="M372 120 L383 146 L361 146Z" fill="#2e7d4f"/><rect x="370.4" y="146" width="3.2" height="5.0" fill="#6b4636"/><path d="M388 123.9 L397.35 146 L378.65 146Z" fill="#2e7d4f"/><rect x="386.6" y="146" width="2.7" height="4.2" fill="#6b4636"/><path d="M120 131.8 L127.7 150 L112.3 150Z" fill="#2e7d4f"/><rect x="118.9" y="150" width="2.2" height="3.5" fill="#6b4636"/><path d="M300 126.5 L308.25 146 L291.75 146Z" fill="#2e7d4f"/><rect x="298.8" y="146" width="2.4" height="3.8" fill="#6b4636"/><rect x="96" y="134" width="30" height="20" fill="#ff8a5b"/><path d="M91 134 L111.0 121.6 L131 134Z" fill="#c0392b"/><rect x="100.2" y="138.4" width="6.6" height="6.6" rx="1.5" fill="#fff3b0"/><rect x="115.2" y="138.4" width="6.6" height="6.6" rx="1.5" fill="#fff3b0"/><rect x="108.3" y="144.0" width="5.4" height="10.0" rx="1.5" fill="#5a331c"/><rect x="212" y="128" width="28" height="19" fill="#ffd166"/><path d="M207 128 L226.0 116.22 L245 128Z" fill="#3a86ff"/><rect x="215.9" y="132.2" width="6.2" height="6.2" rx="1.5" fill="#fff3b0"/><rect x="229.9" y="132.2" width="6.2" height="6.2" rx="1.5" fill="#fff3b0"/><rect x="223.5" y="137.5" width="5.0" height="9.5" rx="1.5" fill="#5a331c"/><rect x="300" y="132" width="30" height="20" fill="#8ecae6"/><path d="M295 132 L315.0 119.6 L335 132Z" fill="#e76f51"/><rect x="304.2" y="136.4" width="6.6" height="6.6" rx="1.5" fill="#fff3b0"/><rect x="319.2" y="136.4" width="6.6" height="6.6" rx="1.5" fill="#fff3b0"/><rect x="312.3" y="142.0" width="5.4" height="10.0" rx="1.5" fill="#5a331c"/><rect x="30" y="178" width="46" height="32" fill="#f4a261"/><path d="M25 178 L53.0 158.16 L81 178Z" fill="#9b2226"/><rect x="36.4" y="185.0" width="10.1" height="10.1" rx="1.5" fill="#fff3b0"/><rect x="59.4" y="185.0" width="10.1" height="10.1" rx="1.5" fill="#fff3b0"/><rect x="48.9" y="194.0" width="8.3" height="16.0" rx="1.5" fill="#5a331c"/><rect x="110" y="190" width="40" height="28" fill="#a8dadc"/><path d="M105 190 L130.0 172.64 L155 190Z" fill="#6a4c93"/><rect x="115.6" y="196.2" width="8.8" height="8.8" rx="1.5" fill="#fff3b0"/><rect x="135.6" y="196.2" width="8.8" height="8.8" rx="1.5" fill="#fff3b0"/><rect x="126.4" y="204.0" width="7.2" height="14.0" rx="1.5" fill="#5a331c"/><rect x="262" y="182" width="46" height="32" fill="#ffb4c6"/><path d="M257 182 L285.0 162.16 L313 182Z" fill="#2a9d8f"/><rect x="268.4" y="189.0" width="10.1" height="10.1" rx="1.5" fill="#fff3b0"/><rect x="291.4" y="189.0" width="10.1" height="10.1" rx="1.5" fill="#fff3b0"/><rect x="280.9" y="198.0" width="8.3" height="16.0" rx="1.5" fill="#5a331c"/><rect x="334" y="196" width="42" height="30" fill="#ffe29a"/><path d="M329 196 L355.0 177.4 L381 196Z" fill="#d62828"/><rect x="339.9" y="202.6" width="9.2" height="9.2" rx="1.5" fill="#fff3b0"/><rect x="360.9" y="202.6" width="9.2" height="9.2" rx="1.5" fill="#fff3b0"/><rect x="351.2" y="211.0" width="7.6" height="15.0" rx="1.5" fill="#5a331c"/><rect x="58" y="150" width="6" height="14" fill="#6b4636"/><g fill="#fff" opacity=".8"><circle cx="61" cy="144" r="4"/><circle cx="66" cy="136" r="5"/></g><rect x="90.2" y="208.0" width="3.6" height="12.0" fill="#7a5236"/><circle cx="92" cy="202.0" r="10.0" fill="#43a047"/><circle cx="98.0" cy="206.0" r="7.0" fill="#43a047"/><circle cx="86.0" cy="207.0" r="6.5" fill="#43a047"/><rect x="236.0" y="201.6" width="4.0" height="13.2" fill="#7a5236"/><circle cx="238" cy="195.0" r="11.0" fill="#66bb6a"/><circle cx="244.6" cy="199.4" r="7.7" fill="#66bb6a"/><circle cx="231.4" cy="200.5" r="7.2" fill="#66bb6a"/><rect x="316.4" y="222.4" width="3.2" height="10.8" fill="#7a5236"/><circle cx="318" cy="217.0" r="9.0" fill="#43a047"/><circle cx="323.4" cy="220.6" r="6.3" fill="#43a047"/><circle cx="312.6" cy="221.5" r="5.9" fill="#43a047"/><rect x="10.2" y="222.0" width="3.6" height="12.0" fill="#7a5236"/><circle cx="12" cy="216.0" r="10.0" fill="#66bb6a"/><circle cx="18.0" cy="220.0" r="7.0" fill="#66bb6a"/><circle cx="6.0" cy="221.0" r="6.5" fill="#66bb6a"/><rect x="390.6" y="228.8" width="2.9" height="9.6" fill="#7a5236"/><circle cx="392" cy="224.0" r="8.0" fill="#43a047"/><circle cx="396.8" cy="227.2" r="5.6" fill="#43a047"/><circle cx="387.2" cy="228.0" r="5.2" fill="#43a047"/><path d="M129.5 226.1 v-9" stroke="#3f7d4a" stroke-width="1.4"/><ellipse cx="129.5" cy="213.1" rx="2.6" ry="6" fill="#7b4fd6"/><path d="M211.8 225.0 v-9" stroke="#3f7d4a" stroke-width="1.4"/><ellipse cx="211.8" cy="212.0" rx="2.6" ry="6" fill="#b061d9"/><path d="M214.4 229.1 v-9" stroke="#3f7d4a" stroke-width="1.4"/><ellipse cx="214.4" cy="216.1" rx="2.6" ry="6" fill="#e36fb4"/><path d="M155.5 231.1 v-9" stroke="#3f7d4a" stroke-width="1.4"/><ellipse cx="155.5" cy="218.1" rx="2.6" ry="6" fill="#5c6ee0"/><path d="M15.0 230.1 v-9" stroke="#3f7d4a" stroke-width="1.4"/><ellipse cx="15.0" cy="217.1" rx="2.6" ry="6" fill="#7b4fd6"/><path d="M156.6 225.3 v-9" stroke="#3f7d4a" stroke-width="1.4"/><ellipse cx="156.6" cy="212.3" rx="2.6" ry="6" fill="#b061d9"/><path d="M169.8 235.6 v-9" stroke="#3f7d4a" stroke-width="1.4"/><ellipse cx="169.8" cy="222.6" rx="2.6" ry="6" fill="#e36fb4"/><path d="M161.8 227.1 v-9" stroke="#3f7d4a" stroke-width="1.4"/><ellipse cx="161.8" cy="214.1" rx="2.6" ry="6" fill="#5c6ee0"/><path d="M251.0 237.3 v-9" stroke="#3f7d4a" stroke-width="1.4"/><ellipse cx="251.0" cy="224.3" rx="2.6" ry="6" fill="#7b4fd6"/><path d="M204.8 229.6 v-9" stroke="#3f7d4a" stroke-width="1.4"/><ellipse cx="204.8" cy="216.6" rx="2.6" ry="6" fill="#b061d9"/><path d="M390.5 224.7 v-9" stroke="#3f7d4a" stroke-width="1.4"/><ellipse cx="390.5" cy="211.7" rx="2.6" ry="6" fill="#e36fb4"/><path d="M231.6 228.1 v-9" stroke="#3f7d4a" stroke-width="1.4"/><ellipse cx="231.6" cy="215.1" rx="2.6" ry="6" fill="#5c6ee0"/><path d="M57.7 225.6 v-9" stroke="#3f7d4a" stroke-width="1.4"/><ellipse cx="57.7" cy="212.6" rx="2.6" ry="6" fill="#7b4fd6"/><path d="M179.3 235.4 v-9" stroke="#3f7d4a" stroke-width="1.4"/><ellipse cx="179.3" cy="222.4" rx="2.6" ry="6" fill="#b061d9"/><path d="M72.3 232.1 v-9" stroke="#3f7d4a" stroke-width="1.4"/><ellipse cx="72.3" cy="219.1" rx="2.6" ry="6" fill="#e36fb4"/><path d="M210.7 229.2 v-9" stroke="#3f7d4a" stroke-width="1.4"/><ellipse cx="210.7" cy="216.2" rx="2.6" ry="6" fill="#5c6ee0"/><path d="M219.1 224.9 v-9" stroke="#3f7d4a" stroke-width="1.4"/><ellipse cx="219.1" cy="211.9" rx="2.6" ry="6" fill="#7b4fd6"/><path d="M155.7 226.9 v-9" stroke="#3f7d4a" stroke-width="1.4"/><ellipse cx="155.7" cy="213.9" rx="2.6" ry="6" fill="#b061d9"/><path d="M272.2 230.0 v-9" stroke="#3f7d4a" stroke-width="1.4"/><ellipse cx="272.2" cy="217.0" rx="2.6" ry="6" fill="#e36fb4"/><path d="M179.8 232.2 v-9" stroke="#3f7d4a" stroke-width="1.4"/><ellipse cx="179.8" cy="219.2" rx="2.6" ry="6" fill="#5c6ee0"/><path d="M181.3 228.2 v-9" stroke="#3f7d4a" stroke-width="1.4"/><ellipse cx="181.3" cy="215.2" rx="2.6" ry="6" fill="#7b4fd6"/><path d="M225.5 233.8 v-9" stroke="#3f7d4a" stroke-width="1.4"/><ellipse cx="225.5" cy="220.8" rx="2.6" ry="6" fill="#b061d9"/><path d="M97.6 232.0 v-9" stroke="#3f7d4a" stroke-width="1.4"/><ellipse cx="97.6" cy="219.0" rx="2.6" ry="6" fill="#e36fb4"/><path d="M199.9 236.3 v-9" stroke="#3f7d4a" stroke-width="1.4"/><ellipse cx="199.9" cy="223.3" rx="2.6" ry="6" fill="#5c6ee0"/><path d="M291.8 228.0 v-9" stroke="#3f7d4a" stroke-width="1.4"/><ellipse cx="291.8" cy="215.0" rx="2.6" ry="6" fill="#7b4fd6"/><path d="M243.1 225.7 v-9" stroke="#3f7d4a" stroke-width="1.4"/><ellipse cx="243.1" cy="212.7" rx="2.6" ry="6" fill="#b061d9"/><g stroke="#fff" stroke-width="2" opacity=".85"><path d="M0 222 H70 M0 230 H70"/><path d="M4 216 V234"/><path d="M14 216 V234"/><path d="M24 216 V234"/><path d="M34 216 V234"/><path d="M44 216 V234"/><path d="M54 216 V234"/><path d="M64 216 V234"/></g><g fill="none" stroke="#2b3a55" stroke-width="1.8" stroke-linecap="round"><path d="M150 44 q6 -6 12 0 q6 -6 12 0"/><path d="M180 30 q4 -4 8 0 q4 -4 8 0"/></g></svg>` },
  ciudad: { svg:`<svg class="arte-svg" viewBox="0 0 400 240" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><linearGradient id="auC" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2f3f7e"/><stop offset=".55" stop-color="#d9775f"/><stop offset="1" stop-color="#f3c77e"/></linearGradient><linearGradient id="auA" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2d5f80"/><stop offset="1" stop-color="#15344c"/></linearGradient></defs><rect width="400" height="240" fill="url(#auC)"/><circle cx="300" cy="120" r="26" fill="#ffdca0" opacity=".8"/><path d="M40 58 L150 40" stroke="#fff" stroke-opacity=".55" stroke-width="2" stroke-dasharray="6 5"/><g transform="translate(150 38) rotate(-9)"><path d="M0 0 L26 -1 C31 -1 33 1 33 2 C33 3 31 4 26 4 L0 4Z" fill="#fff"/><path d="M12 1 L4 -9 L9 -9 L19 1Z M12 3 L5 12 L10 12 L19 3Z M1 1 L-3 -5 L1 -5 L5 1Z" fill="#fff"/></g><path d="M-10 156 L30 112 L55 128 L92 66 L116 102 L140 82 L170 120 L206 60 L236 100 L262 86 L300 128 L340 90 L410 140 V175 H-10Z" fill="#4b3f6d"/><path d="M92 66 L80 84 L90 80 L96 88 L104 79Z M206 60 L193 79 L203 76 L210 84 L218 74Z M340 90 L329 104 L338 102 L344 108 L351 101Z M140 82 L133 92 L141 90 L146 95Z" fill="#fff"/><path d="M-10 168 L50 140 L110 156 L170 138 L240 158 L300 142 L410 162 V178 H-10Z" fill="#372f57"/><rect x="6" y="161" width="11" height="9" fill="#e63946"/><path d="M5 161 L11.5 156 L18 161Z" fill="#3b2f4f"/><rect x="18" y="158" width="15" height="12" fill="#f4a261"/><path d="M17 158 L25.5 153 L34 158Z" fill="#3b2f4f"/><rect x="21" y="162" width="3" height="3" fill="#ffe7a3"/><rect x="34" y="161" width="13" height="9" fill="#e76f51"/><path d="M33 161 L40.5 156 L48 161Z" fill="#3b2f4f"/><rect x="37" y="165" width="3" height="3" fill="#ffe7a3"/><rect x="51" y="161" width="9" height="9" fill="#f4a261"/><path d="M50 161 L55.5 156 L61 161Z" fill="#3b2f4f"/><rect x="61" y="158" width="15" height="12" fill="#f4a261"/><path d="M60 158 L68.5 153 L77 158Z" fill="#3b2f4f"/><rect x="82" y="158" width="14" height="12" fill="#e76f51"/><path d="M81 158 L89.0 153 L97 158Z" fill="#3b2f4f"/><rect x="100" y="161" width="9" height="9" fill="#e76f51"/><path d="M99 161 L104.5 156 L110 161Z" fill="#3b2f4f"/><rect x="111" y="159" width="11" height="11" fill="#e9c46a"/><path d="M110 159 L116.5 154 L123 159Z" fill="#3b2f4f"/><rect x="127" y="158" width="11" height="12" fill="#e9c46a"/><path d="M126 158 L132.5 153 L139 158Z" fill="#3b2f4f"/><rect x="130" y="162" width="3" height="3" fill="#ffe7a3"/><rect x="143" y="161" width="14" height="9" fill="#f1faee"/><path d="M142 161 L150.0 156 L158 161Z" fill="#3b2f4f"/><rect x="146" y="165" width="3" height="3" fill="#ffe7a3"/><rect x="163" y="158" width="9" height="12" fill="#e76f51"/><path d="M162 158 L167.5 153 L173 158Z" fill="#3b2f4f"/><rect x="176" y="158" width="14" height="12" fill="#e63946"/><path d="M175 158 L183.0 153 L191 158Z" fill="#3b2f4f"/><rect x="194" y="159" width="13" height="11" fill="#f1faee"/><path d="M193 159 L200.5 154 L208 159Z" fill="#3b2f4f"/><rect x="197" y="163" width="3" height="3" fill="#ffe7a3"/><rect x="209" y="156" width="14" height="14" fill="#2a9d8f"/><path d="M208 156 L216.0 151 L224 156Z" fill="#3b2f4f"/><rect x="212" y="160" width="3" height="3" fill="#ffe7a3"/><rect x="226" y="159" width="13" height="11" fill="#f1faee"/><path d="M225 159 L232.5 154 L240 159Z" fill="#3b2f4f"/><rect x="242" y="162" width="13" height="8" fill="#f4a261"/><path d="M241 162 L248.5 157 L256 162Z" fill="#3b2f4f"/><rect x="257" y="160" width="15" height="10" fill="#e9c46a"/><path d="M256 160 L264.5 155 L273 160Z" fill="#3b2f4f"/><rect x="276" y="157" width="9" height="13" fill="#f4a261"/><path d="M275 157 L280.5 152 L286 157Z" fill="#3b2f4f"/><rect x="290" y="156" width="15" height="14" fill="#f1faee"/><path d="M289 156 L297.5 151 L306 156Z" fill="#3b2f4f"/><rect x="293" y="160" width="3" height="3" fill="#ffe7a3"/><rect x="308" y="159" width="13" height="11" fill="#a8dadc"/><path d="M307 159 L314.5 154 L322 159Z" fill="#3b2f4f"/><rect x="311" y="163" width="3" height="3" fill="#ffe7a3"/><rect x="322" y="159" width="11" height="11" fill="#f4a261"/><path d="M321 159 L327.5 154 L334 159Z" fill="#3b2f4f"/><rect x="325" y="163" width="3" height="3" fill="#ffe7a3"/><rect x="339" y="157" width="11" height="13" fill="#a8dadc"/><path d="M338 157 L344.5 152 L351 157Z" fill="#3b2f4f"/><rect x="342" y="161" width="3" height="3" fill="#ffe7a3"/><rect x="354" y="160" width="14" height="10" fill="#e76f51"/><path d="M353 160 L361.0 155 L369 160Z" fill="#3b2f4f"/><rect x="371" y="158" width="10" height="12" fill="#f4a261"/><path d="M370 158 L376.0 153 L382 158Z" fill="#3b2f4f"/><rect x="374" y="162" width="3" height="3" fill="#ffe7a3"/><rect x="383" y="160" width="15" height="10" fill="#e9c46a"/><path d="M382 160 L390.5 155 L399 160Z" fill="#3b2f4f"/><rect x="0" y="170" width="400" height="70" fill="url(#auA)"/><g stroke="#f3c77e" stroke-opacity=".45" stroke-width="2"><path d="M270 182h60M282 190h36M290 198h22"/></g><path d="M226 200 H330 L318 214 H238Z" fill="#fff"/><rect x="246" y="190" width="62" height="10" rx="2" fill="#f1f1f1"/><rect x="258" y="182" width="36" height="8" rx="2" fill="#e8e8e8"/><rect x="286" y="172" width="9" height="12" fill="#d64545"/><path d="M250 195h54" stroke="#2d5f80" stroke-width="2" stroke-dasharray="3 3"/><ellipse cx="86" cy="222" rx="30" ry="8" fill="#2b2445"/><path d="M78 222 L81 180 H91 L94 222Z" fill="#fff"/><path d="M79.6 206 H92.4 L93 214 H79Z M80.6 190 H91.4 L91.9 198 H80.1Z" fill="#d64545"/><rect x="79" y="174" width="14" height="7" rx="2" fill="#2b2445"/><circle cx="86" cy="177" r="10" fill="#ffe9a8" opacity=".55"/></svg>` },
  gestion: { svg:`<svg class="arte-svg" viewBox="0 0 400 240" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><linearGradient id="agC" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5b3fa0"/><stop offset="1" stop-color="#1c6f73"/></linearGradient></defs><rect width="400" height="240" fill="url(#agC)"/><circle cx="340" cy="30" r="80" fill="#fff" opacity=".06"/><circle cx="40" cy="220" r="70" fill="#fff" opacity=".06"/><rect x="110" y="42" width="130" height="164" rx="12" fill="#fff"/><rect x="128" y="62" width="70" height="9" rx="4" fill="#5b3fa0"/><g fill="#d6d9e4"><rect x="128" y="82" width="94" height="6" rx="3"/><rect x="128" y="96" width="80" height="6" rx="3"/><rect x="128" y="110" width="88" height="6" rx="3"/></g><g fill="#1c9e8f"><rect x="132" y="170" width="14" height="20" rx="2"/><rect x="152" y="156" width="14" height="34" rx="2"/><rect x="172" y="144" width="14" height="46" rx="2"/><rect x="192" y="160" width="14" height="30" rx="2" fill="#f2a541"/></g><circle cx="286" cy="98" r="40" fill="#fff" opacity=".95"/><path d="M286 98 L286 58 A40 40 0 0 1 322 116Z" fill="#f2a541"/><path d="M286 98 L322 116 A40 40 0 0 1 262 130Z" fill="#1c9e8f"/><g><ellipse cx="290" cy="196" rx="26" ry="8" fill="#e0a82e"/><rect x="264" y="178" width="52" height="18" fill="#f2c14e"/><ellipse cx="290" cy="178" rx="26" ry="8" fill="#f7d774"/><ellipse cx="290" cy="170" rx="26" ry="8" fill="#e0a82e"/><rect x="264" y="160" width="52" height="10" fill="#f2c14e"/><ellipse cx="290" cy="160" rx="26" ry="8" fill="#f7d774"/></g></svg>` },
};
const arteDe = k => {
  const a = ARTE[k] || {};
  return a.foto ? `<span class="arte-foto" style="background-image:url('${a.foto}')"></span>` : (a.svg || '');
};

/* Las secciones de la app. Cada una es una ventana con su mosaico.
   `tejas(u, s, hoy)` devuelve el contenido y `linea(u, s, hoy)` la frase
   viva que se lee en la portada. */
const SECCIONES = {
  casa: {
    titulo:'Tu casa', icon:'home', color:'ok', ancha:true, lema:'Tu lote, tus visitas y tus cosas',
    sub:'Visitas, reservas, mensajes y los datos de tu lote',
    linea(u, s, hoy){
      const v = s.pases.filter(p => p.hostId === u.id && paseValidoEn(p, hoy)).length;
      const m = s.privados.filter(h => h.userId === u.id).reduce((n, h) => n + h.msgs.filter(x => x.from !== 'vecino' && !x.leido).length, 0) + dmNoLeidos();
      const r = s.reservas.filter(x => x.userId === u.id && x.fecha >= hoy && !x.cancelada).length;
      return [v && `${plural(v, 'visita esperada', 'visitas esperadas')} hoy`, m && `${plural(m, 'mensaje sin leer', 'mensajes sin leer')}`,
        r && `${plural(r, 'reserva')}`].filter(Boolean).join(' · ') || 'Todo en orden en tu lote';
    },
    tejas(u, s, hoy){
      const misHoy = s.pases.filter(p => p.hostId === u.id && paseValidoEn(p, hoy));
      const proxRes = s.reservas.filter(r => r.userId === u.id && r.fecha >= hoy && !r.cancelada).sort((a, b) => a.fecha.localeCompare(b.fecha))[0];
      const privNoLeidos = s.privados.filter(h => h.userId === u.id).reduce((n, h) => n + h.msgs.filter(m => m.from !== 'vecino' && !m.leido).length, 0);
      return [
        teja({ a:'nuevo-pase', icon:'qr', t:'Autorizar una visita', s:'Código y QR para la garita', destaca:true }),
        teja({ v:'visitas', icon:'users', color:'sky', t:'Mis visitas', s: misHoy.length ? `${plural(misHoy.length, 'esperada')} hoy` : 'Nadie anunciado hoy', n: misHoy.length || '' }),
        teja({ v:'reservas', icon:'calendar', color:'wood', t:'Reservas', s: proxRes ? `${amenity(proxRes.amenity)?.nombre} · ${relDia(proxRes.fecha)}` : 'Quincho, SUM y cancha' }),
        teja({ v:'mensajes', icon:'chat', color:'accent', t:'Mensajes', s:'Privados con vecinos y la Administración', badge: privNoLeidos + dmNoLeidos() }),
        teja({ v:'peticiones', icon:'edit', color:'brand', t:'Peticiones a la garita', s:'Firmadas por vos y la guardia', n: s.peticiones.filter(p => p.userId === u.id && p.estado !== 'cerrada').length || '' }),
        teja({ v:'expensas', icon:'wallet', color:'wood', t:'Mis expensas', s:`Tu cuenta, cupones y pagos` }),
        teja({ v:'reclamos', icon:'clipboard', color:'warn', t:'Mis reclamos', s:'Privados con la Administración', n: s.reclamos.filter(r => r.userId === u.id && r.estado !== 'resuelto').length || '' }),
        teja({ v:'perfil', icon:'home', color:'ok', t:'Mi casa', s:'Familia, autos, mascotas' }),
        teja({ v:'mis-paquetes', icon:'box', color:'wood', t:'Mis paquetes', s:(() => { const n = s.paquetes.filter(p => p.hostId === u.id && !p.confirmado).length; return n ? `${plural(n, 'por retirar o confirmar')}` : 'Lo que llega a la garita'; })(), badge: s.paquetes.filter(p => p.hostId === u.id && !p.retirado).length }),
        teja({ a:'mi-credencial', icon:'qr', color:'brand', t:'Mi credencial', s:'Tu QR para la garita y los espacios comunes' }),
        teja({ v:'ayuda', icon:'info', color:'sky', t:'Preguntas frecuentes', s:'Cómo se hace cada cosa' }),
        ...(s.infracciones.some(i => i.casa === u.casa && i.estado === 'notificada')
          ? [teja({ v:'infracciones', icon:'alert', color:'danger', t:'Notificación', s:'Podés presentar tu descargo', badge: s.infracciones.filter(i => i.casa === u.casa && i.estado === 'notificada').length })] : []),
      ].join('');
    },
  },
  comunidad: {
    titulo:'El barrio', icon:'muro', color:'brand', ancha:true, lema:'La vida entre vecinos',
    sub:'Lo que pasa entre vecinos',
    linea(u, s, hoy){
      const piz = s.posts.filter(p => p.createdAt > (Store.sesion.pizarronVisto || 0) && p.autor !== u.id).length;
      const vot = s.votaciones.filter(v => v.cierra > Date.now()).length;
      const cha = s.msgs.filter(m => m.createdAt > (Store.sesion.chatVisto || 0) && m.autor !== u.id).length;
      return [piz && `${plural(piz, 'novedad', 'novedades')} en el pizarrón`, vot && `${plural(vot, 'votación abierta', 'votaciones abiertas')}`,
        cha && `${plural(cha, 'mensaje', 'mensajes')} en el chat`].filter(Boolean).join(' · ') || 'Pizarrón, chat, vecinos y votaciones';
    },
    tejas(u, s, hoy){
      const pizNuevas = s.posts.filter(p => p.createdAt > (Store.sesion.pizarronVisto || 0) && p.autor !== u.id).length;
      const chatNuevos = s.msgs.filter(m => m.createdAt > (Store.sesion.chatVisto || 0) && m.autor !== u.id).length;
      const votAbiertas = s.votaciones.filter(v => v.cierra > Date.now()).length;
      const compras = s.compras.filter(x => x.cierra > Date.now()).length;
      return [
        teja({ v:'pizarron', icon:'muro', t:'Pizarrón', s:'Guardia, Administración y vecinos', badge: pizNuevas, destaca:true }),
        teja({ v:'vecinos', icon:'users', color:'sky', t:'Vecinos', s:'Buscá por nombre, oficio o dirección' }),
        teja({ v:'chat', icon:'chat', color:'sky', t:'Chat vecinal', s:'#general · #seguridad · #mascotas', badge: chatNuevos }),
        teja({ v:'votaciones', icon:'vote', color:'accent', t:'Votaciones', s: votAbiertas ? `${plural(votAbiertas, 'abierta')}` : 'Sin votaciones abiertas', n: votAbiertas || '' }),
        teja({ v:'obras', icon:'wrench', color:'wood', t:'Obras', s:(() => { const h = s.obras.filter(o => o.avisoHoy?.fecha === hoy).length; return h ? `${plural(h, 'aviso')} para hoy` : `${plural(s.obras.filter(o => o.estado === 'activa').length, 'en curso', 'en curso')}`; })(), n: s.obras.filter(o => o.estado === 'activa').length || '' }),
        teja({ v:'viajes', icon:'car', color:'sky', t:'Viajes compartidos', s:'Centro, escuela, aeropuerto', n: s.viajes.filter(v => v.fecha >= hoy).length || '' }),
        teja({ v:'servicios', icon:'star', color:'wood', t:'Profesionales y oficios', s:'Vecinos que se pueden contactar' }),
        teja({ v:'mascotas', icon:'paw', color:'ok', t:'Mascotas', s:'Perdidas, encontradas y del barrio' }),
        teja({ v:'compras', icon:'cart', color:'brand', t:'Compras conjuntas', s: compras ? `${plural(compras, 'abierta')}` : 'Leña, gas, lo que sea', n: compras || '' }),
        teja({ v:'documentos', icon:'file', color:'brand', t:'Normas y reglamento', s:'Convivencia, obras, actas' }),
        teja({ v:'tablero', icon:'wallet', color:'wood', t:'Las cuentas del barrio', s:'En qué se gasta, mes a mes, y la morosidad (sin nombres)' }),
        teja({ v:'recoleccion', icon:'truck', color:'ok', t:'Residuos', s: proxRecoleccion() }),
        teja({ v:'descargas', icon:'download', color:'sky', t:'Descargas', s:'Apps, instructivos y planillas', n:descargasVisibles().filter(d => d.url || d.texto).length || '' }),
      ].join('');
    },
  },
  ciudad: {
    titulo:'Ushuaia y servicios', icon:'pin', color:'sky', ancha:true, lema:'Lo de afuera que igual te toca',
    sub:'Lo de afuera del barrio que igual te toca',
    linea(u, s, hoy){
      const cru = typeof Cruceros !== 'undefined' ? Cruceros.hoy().length : 0;
      const v = Vuelos.cuantosHoy();
      const f = proximoFeriado();
      return [cru && `${plural(cru, 'crucero recala', 'cruceros recalan')} hoy`, v && `${v} vuelos hoy`,
        f && `feriado ${relDia(f.fecha)}`].filter(Boolean).join(' · ') || 'Emergencias, agenda, vuelos, cruceros y feriados';
    },
    tejas(u, s, hoy){
      const prox = proximoFeriado();
      return [
        teja({ v:'emergencias', icon:'siren', color:'danger', t:'Emergencias', s:'911 · 107 · DEA · hospitales · farmacias', destaca:true }),
        teja({ v:'agenda', icon:'book', color:'sky', t:'Agenda de Ushuaia', s:'Comidas, taxis, súper y oficios del barrio' }),
        teja({ v:'cruceros', icon:'send', color:'brand', t:'Cruceros', s: Cruceros.linea(), n: Cruceros.hoy().length || '' }),
        teja({ v:'ushuaia', icon:'pin', color:'sky', t:'Ushuaia hoy', s: prox ? `Próximo feriado: ${relDia(prox.fecha)}` : 'Temporadas, feriados, eventos' }),
        teja({ v:'servicios', icon:'user', color:'wood', t:'Profesionales y oficios del barrio', s:(() => { const n = s.users.filter(enDirectorioProfesional).length; return n ? `${plural(n, 'vecino', 'vecinos')} para contactar` : 'Médicos, abogados, electricistas…'; })(), n: s.users.filter(enDirectorioProfesional).length || '' }),
        teja({ v:'vuelos', icon:'send', color:'accent', t:'Vuelos USH', s:'Arribos y partidas de hoy', n: Vuelos.cuantosHoy() || '' }),
        teja({ v:'municipio', icon:'pin', color:'sky', t:'Municipalidad de Ushuaia', s:'Trámites, reclamos urbanos, residuos, turnos' }),
        teja({ v:'sismos', icon:'sismo', color:'warn', t:'Sismos', s: (() => { const x = typeof Sismos !== 'undefined' && Sismos.destacado(); return x ? `M ${x.mag.toFixed(1)} · ${x.lugar} · ${hace(x.at)}` : 'En vivo en la región'; })() }),
      ].join('');
    },
  },
  gestion: {
    titulo:'Gestión del barrio', icon:'sliders', color:'accent', ancha:true, lema:'La trastienda del barrio',
    sub:'Administración, contabilidad, expensas y garita',
    solo:'admin',
    linea(u, s){
      const pend = s.users.filter(x => x.estado === 'pendiente').length;
      const pagos = s.pagos.filter(x => x.estado === 'informado').length;
      const recl = s.reclamos.filter(r => r.estado !== 'resuelto').length;
      return [pend && `${plural(pend, 'inscripción', 'inscripciones')}`, pagos && `${plural(pagos, 'pago informado', 'pagos informados')}`,
        recl && `${plural(recl, 'reclamo abierto', 'reclamos abiertos')}`].filter(Boolean).join(' · ') || 'Todo al día';
    },
    tejas(u, s){
      const pend = s.users.filter(x => x.estado === 'pendiente').length;
      return `<p class="muted small" style="margin:0 0 14px">Las tres áreas están separadas a propósito: lo que es del barrio y sus vecinos, lo que es contable y lo que es de cobranza de expensas no se mezclan.</p>
        <div class="mosaico">
        ${teja({ v:'admin', icon:'sliders', color:'accent', t:'Administración', s:'Inscripciones, vecinos, contenido y ajustes', badge: pend, destaca:true })}
        ${teja({ v:'contabilidad', icon:'file', color:'brand', t:'Contabilidad', s:'Gastos del mes, cierre y ARCA' })}
        ${teja({ v:'cobranzas', icon:'wallet', color:'wood', t:'Expensas y cobranzas', s:'Automáticas, cupones, pagos, morosos y recibos', badge: s.pagos.filter(x => x.estado === 'informado').length })}
        </div>
        ${sec('Día a día')}<div class="mosaico">
        ${teja({ v:'padron', icon:'users', color:'brand', t:'Padrón', s: s.padron.length ? `${plural(s.padron.length, 'unidad', 'unidades')} · buscá por apellido o lote` : 'Sin cargar' })}
        ${teja({ v:'garita', icon:'gate', color:'brand', t:'Garita', s:'Ingresos de hoy', n: pasesDelDia().length })}
        ${teja({ v:'bitacora', icon:'book', color:'wood', t:'Bitácora', s:'Libro de guardia' })}
        ${teja({ v:'turnos', icon:'clock', color:'sky', t:'Turnos de la garita', s: turnoAbierto() ? `Ahora: ${esc(turnoAbierto().turno)} · ${esc(aLista(turnoAbierto().guardias).join(', '))}` : 'Horarios y guardias' })}
        ${teja({ v:'privado', p:'admin', icon:'lock', color:'accent', t:'Mensajes de vecinos', s:'Conversaciones privadas con la Administración' })}
        ${teja({ v:'privado', p:'interno', icon:'shield', color:'brand', t:'Mensajes con la garita', s:'Entre la Administración y la guardia' })}
        ${teja({ v:'votaciones', icon:'vote', color:'accent', t:'Votaciones', s:'Abrir una, ver resultados y actas', n: s.votaciones.filter(v => v.cierra > Date.now()).length || '' })}
        ${teja({ v:'reclamos', icon:'clipboard', color:'warn', t:'Reclamos', s:'Responder y publicar', n: s.reclamos.filter(r => r.estado !== 'resuelto').length || '' })}
        ${teja({ v:'peticiones', icon:'edit', color:'brand', t:'Peticiones', s:'Firmadas a la garita', n: s.peticiones.filter(p => p.estado === 'pendiente').length || '' })}
        ${teja({ v:'infracciones', icon:'alert', color:'danger', t:'Infracciones', s:'Graduales, con descargo', n: s.infracciones.filter(i => i.estado === 'descargo').length || '' })}
        ${teja({ v:'proveedores', icon:'box', color:'accent', t:'Proveedores', s:'ART y seguro al día', n: s.proveedores.filter(p => artEstado(p)[1] !== 'ok').length || '' })}
        ${teja({ v:'frecuentes', icon:'qr', color:'brand', t:'Ingresos frecuentes', s:'Proveedores del hotel, personal doméstico… con QR fijo', n: aLista(s.frecuentes).filter(f => f && !f.baja).length || '' })}
        ${teja({ v:'alertas', icon:'siren', color:'danger', t:'Avisos urgentes por zona', s:'Corte de luz, nieve, portón… con "Recibido" o "Necesito ayuda"', n: aLista(s.alertas).filter(alertaActiva).length || '' })}
        ${teja({ v:'obras', p:'pendientes', icon:'wrench', color:'wood', t:'Obras por aprobar', s:'Registro de obras', n: s.obras.filter(o => o.estado === 'pendiente').length || '' })}
        ${teja({ v:'comunicados', icon:'tack', color:'danger', t:'Comunicados importantes', s:'Ventana, sonido y acuse de recibo', n:(s.comunicados || []).filter(c => !c.archivado).length || '' })}
        ${teja({ a:'nuevo-post', v:'aviso', icon:'muro', color:'sky', t:'Publicar en el pizarrón', s:'Para lo que no es urgente' })}
        </div>`;
    },
  },
};
/* Cada sección es una ventana de verdad, con su lomo y su vuelta atrás.
   Arriba lleva su ilustración a lo ancho, con el título grande y la frase
   viva de lo que está pasando; abajo, las tejas. La idea es que abrir una
   sección se sienta como entrar a un lugar, no como abrir un menú. */
const bannerSeccion = (k, u, s, hoy) => {
  const S = SECCIONES[k];
  return `<div class="sec-banner s-${k}">
    <div class="sec-banner-arte">${arteDe(k)}</div>
    <div class="sec-banner-txt">
      <span class="sec-banner-ic ic-${S.color}">${I(S.icon)}</span>
      <div><small>${esc(S.lema || '')}</small><h2>${esc(S.titulo)}</h2><p>${esc(S.linea(u, s, hoy))}</p></div>
    </div></div>`;
};
for (const k in SECCIONES){
  const S = SECCIONES[k];
  R[k] = { titulo:S.titulo, icon:S.icon, color:S.color, sub:S.sub, ancha:S.ancha,
    render(){
      if (S.solo === 'admin' && !esAdmin()) return vacio('lock', 'Solo para la Administración.');
      const u = yo(), s = Store.s, hoy = hoyISO();
      const c = S.tejas(u, s, hoy);
      return `<div class="seccion-vista">${bannerSeccion(k, u, s, hoy)}
        ${c.trim().startsWith('<p') ? c : `<div class="mosaico">${c}</div>`}</div>`;
    } };
}

/* =========================================================
   LUZ DEL DÍA
   Una barra que es el día entero, de 0 a 24 h: la franja clara es el
   tiempo con sol y el punto rojo es AHORA. El punto camina solo,
   segundo a segundo, y arriba lleva la hora con segundos. En Ushuaia
   esto no es un adorno: en junio hay siete horas de luz y en diciembre
   diecisiete, y se ve de un vistazo cuánto queda.
   ========================================================= */
function barraLuz(sol){
  const mSale = minutosDe(sol.sale), mPone = minutosDe(sol.pone), luzMin = Math.max(1, mPone - mSale);
  const pc = m => (m / 1440 * 100).toFixed(3);
  const ahora = new Date();
  const seg = ahora.getHours() * 3600 + ahora.getMinutes() * 60 + ahora.getSeconds();
  const esDeDia = Clima.esDeDia();
  const faltan = esDeDia ? mPone - Math.floor(seg / 60) : (mSale > seg / 60 ? mSale - seg / 60 : 1440 - seg / 60 + mSale);
  return `<div class="card">
    <div class="row" style="justify-content:space-between;margin-bottom:14px">
      <b style="font-size:14px">Luz del día</b>
      <span class="muted small">${Math.floor(luzMin / 60)} h ${luzMin % 60} min · ${esDeDia ? `anochece en ${Math.floor(faltan / 60)} h ${Math.round(faltan % 60)} min` : `amanece en ${Math.floor(faltan / 60)} h ${Math.round(faltan % 60)} min`}</span></div>
    <div class="luz24" data-reloj="luz" data-sale="${mSale}" data-pone="${mPone}">
      <div class="luz24-barra">
        <span class="luz24-dia" style="left:${pc(mSale)}%;width:${pc(mPone - mSale)}%"></span>
        ${[6,12,18].map(h => `<span class="luz24-marca" style="left:${pc(h * 60)}%"></span>`).join('')}
        <i class="luz24-punto" style="left:${pc(seg / 60)}%"></i>
        <b class="luz24-hora" style="left:${pc(seg / 60)}%">${String(ahora.getHours()).padStart(2,'0')}:${String(ahora.getMinutes()).padStart(2,'0')}:${String(ahora.getSeconds()).padStart(2,'0')}</b>
      </div>
      <div class="luz24-pie"><span>0 h</span><span>${I('sunrise')}${sol.sale}</span><span>${I('sunset')}${sol.pone}</span><span>24 h</span></div>
    </div></div>`;
}
/* El punto camina sin redibujar la pantalla: se mueve solo el punto y su
   etiqueta. Redibujar toda la portada cada segundo sería un despropósito. */
const Reloj = {
  timer:null,
  arrancar(){
    if (this.timer) return;
    this.timer = setInterval(() => this.paso(), 1000);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) this.paso(); });
  },
  paso(){
    if (document.hidden) return;
    const cajas = $$('[data-reloj="luz"]');
    if (!cajas.length) return;
    const d = new Date();
    const seg = d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds();
    const izq = (seg / 60 / 1440 * 100).toFixed(3) + '%';
    const txt = `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}`;
    cajas.forEach(c => {
      const punto = c.querySelector('.luz24-punto'), hora = c.querySelector('.luz24-hora');
      if (punto) punto.style.left = izq;
      if (hora){ hora.style.left = izq; hora.textContent = txt; }
    });
  },
};

/* La puerta de una sección tal como se ve en la portada: una ventana con
   su dibujo, que se agranda un poco al pasar por encima e invita a entrar. */
const puerta = (k, u, s, hoy) => {
  const S = SECCIONES[k];
  return `<button class="puerta-arte s-${k}" data-a="abrir" data-v="${k}" aria-label="Abrir ${esc(S.titulo)}">
    <span class="pa-arte">${arteDe(k)}</span>
    <span class="pa-pie">
      <span class="pa-ic ic-${S.color}">${I(S.icon)}</span>
      <span class="pa-txt"><b>${esc(S.titulo)}</b><small>${esc(S.linea(u, s, hoy))}</small></span>
      <span class="pa-entrar">Entrar${I('right')}</span>
    </span></button>`;
};

/* =========================================================
   PIZARRA DEL DÍA
   Va arriba de todo en la portada, antes del hotel, en dos columnas:
     · PARA TODO EL BARRIO: avisos de la guardia y la Administración, los
       comunicados, las alertas, un SOS abierto, lo nuevo del chat vecinal,
       las obras en curso, los viajes compartidos, las compras conjuntas,
       el clima que complica y el camión de mañana. Nadie tiene que acordarse
       de abrir la campanita o el chat para enterarse.
     · PARA VOS: lo que es tuyo (alguien pregunta por vos en la garita, un
       paquete, una votación pendiente, un mensaje, tu propia alerta).
   Cada aviso es una ventanita con el tono de su importancia, para priorizar
   de un vistazo:
     ROJO      importante (alertas, SOS, comunicados, lo urgente),
     AMARILLO  tener en cuenta (guardia, avisos, obras hoy, perdidos),
     VERDE     para saber (eventos, viajes, compras, novedades).
   Mientras no lo viste, TITILA en su tono. Al tocarlo se abre y deja de
   titilar (en este equipo). El del chat titila hasta leer el último mensaje.
   ========================================================= */
const TIPOS_PIZARRA = ['guardia', 'aviso', 'alerta', 'evento', 'perdido'];
const NIVELES_PZ = { rojo:'Importante', amarillo:'Tener en cuenta', verde:'Para saber' };
const NIVEL_POST = { alerta:'rojo', guardia:'amarillo', aviso:'amarillo', perdido:'amarillo', evento:'verde' };
const nivelDeColor = c => c === 'danger' ? 'rojo' : c === 'warn' ? 'amarillo' : 'verde';
const ORDEN_NIVEL = { rojo:0, amarillo:1, verde:2 };
/* Los avisos para todos que ya salen por su propio camino en la pizarra
   (el post, la obra, la compra, el chat) no se repiten. */
const LINKS_YA_EN_PIZARRA = ['pizarron', 'obras', 'compras', 'viajes', 'chat', 'mascotas'];

const cuandoFue = at => {
  const d = new Date(at), iso = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const h = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  return iso === hoyISO() ? `Hoy ${h}` : iso === sumarDias(hoyISO(), -1) ? `Ayer ${h}` : `${fechaCorta(iso)} ${h}`;
};

/* Lo visto se recuerda por equipo. La primera vez no titila todo lo viejo:
   solo lo del último día. */
const Pizarra = {
  volver: false,
  vistos(){
    const ses = Store.sesion;
    if (!ses.pzDesde){ ses.pzDesde = Date.now() - DIA; Store.guardarSesion(); }
    if (!ses.pzVistos || typeof ses.pzVistos !== 'object') ses.pzVistos = {};
    return ses.pzVistos;
  },
  nuevo(k, at){
    const v = this.vistos();
    return !v[k] && at > Math.max(Store.sesion.pzDesde || 0, Date.now() - 3 * DIA);
  },
  marcar(k){
    const v = this.vistos(); if (v[k]) return;
    v[k] = Date.now();
    const lim = Date.now() - 10 * DIA;
    Object.keys(v).forEach(x => { if (v[x] < lim) delete v[x]; });
    Store.guardarSesion();
    document.querySelectorAll(`.pz[data-k="${CSS.escape(k)}"],.pzr[data-k="${CSS.escape(k)}"]`).forEach(el => { el.classList.remove('titila'); el.classList.add('leido'); el.querySelector('.pz-nueva')?.remove(); });
  },
};
document.addEventListener('click', e => {
  const b = e.target.closest && e.target.closest('.pz[data-k],.pzr[data-k]');
  if (!b) return;
  Pizarra.marcar(b.dataset.k);
  /* Tocado desde la pizarra abierta en la hoja: lo que se abra (otra hoja o
     una ventana) se cierra con "Atrás" o con la X y deja de nuevo la
     pizarra abierta. */
  Pizarra.volver = !!b.closest('#hoja');
}, true);
/* Se cerró la hoja de un aviso que se abrió desde la pizarra: vuelve la
   pizarra. (Si lo que se abrió fue una ventana, abrir() ya limpió la marca
   y la pizarra vuelve cuando se cierra esa ventana.) */
document.addEventListener('close', e => {
  if (!e.target || e.target.id !== 'hoja' || !Pizarra.volver) return;
  Pizarra.volver = false;
  setTimeout(() => { if (!hojaAbierta()) A['pizarra-toda'](); }, 40);
}, true);

function avisosGenerales(){
  const s = Store.s, u = yo(), hoy = hoyISO(), ahora = Date.now(), out = [];
  const poner = x => out.push({ nuevo: Pizarra.nuevo(x.k, x.at), ...x });
  /* Un SOS de otro vecino que sigue abierto. */
  if (typeof sosEnCampanita === 'function') sosEnCampanita().filter(x => x.userId !== u.id).forEach(x => {
    const v = usuario(x.userId) || {}, t = TIPOS_SOS[x.tipo] || TIPOS_SOS.otra;
    poner({ k:'sos-' + x.id, nivel:'rojo', icon:'siren', tag:'SOS', at:x.at, titulo:`${t.nombre} · ${v.casa || ''}`,
      texto: x.estado === 'resuelta' ? 'Resuelta' : SOS_ESTADO[x.estado] || 'Activa', a:'notifs' });
  });
  aLista(s.comunicados).filter(c => c && c.para === 'todos' && !c.archivado && (!c.vence || c.vence >= hoy)).forEach(c =>
    poner({ k:'com-' + c.id, nivel:'rojo', icon: c.tipo === 'reunion' ? 'calendar' : 'tack', tag: c.tipo === 'reunion' ? 'Invitación' : 'Comunicado',
      at:c.at, titulo:c.titulo, texto:c.texto, de:'Administración', a:'ver-novedad', v:'com', id:c.id }));
  /* LO GENERAL QUEDA 24 HORAS, AUNQUE YA LO HAYAS LEÍDO
     Un aviso para todo el barrio no desaparece al abrirlo: sigue en la
     pizarra (quieto, sin titilar) hasta cumplir 24 horas, o hasta que
     quien lo subió lo baja. Las excepciones: lo que la Administración deja
     fijado, y un evento, que queda hasta el día en que se hace. */
  aLista(s.posts).filter(p => p && (TIPOS_PIZARRA.includes(p.type) || usuario(p.autor)?.rol === 'admin') && !p.resuelto
      && (p.fijado || ahora - p.createdAt < DIA || (p.type === 'evento' && p.fecha && p.fecha >= hoy))).forEach(p => {
    const t = TIPOS_POST[p.type] || TIPOS_POST.aviso, au = autorVisible(p.autor);
    poner({ k:'post-' + p.id, nivel: NIVEL_POST[p.type] || 'verde', icon:t.icon, tag:t.n, at:p.createdAt, titulo:p.title, texto:p.body,
      de:`${au.nombre}${au.casa && au.casa !== au.nombre ? ' · ' + au.casa : ''}`, fijo:p.fijado, a:'ver-novedad', v:'post', id:p.id });
  });
  /* El chat vecinal: titila hasta que se lee el último mensaje. */
  const deOtros = aLista(s.msgs).filter(m => m && m.autor !== u.id).sort((a, b) => a.createdAt - b.createdAt);
  const ult = deOtros.at(-1);
  if (ult){
    const sinLeer = deOtros.filter(m => m.createdAt > (Store.sesion.chatVisto || 0));
    if (sinLeer.length || ahora - ult.createdAt < 12 * HORA){
      const au = autorVisible(ult.autor);
      out.push({ k:'chat', nuevo: sinLeer.length > 0, nivel: sinLeer.some(m => m.channel === 'seguridad') ? 'amarillo' : 'verde', icon:'chat',
        tag:`Chat #${CANALES[ult.channel] || 'General'}`, at:ult.createdAt,
        titulo: sinLeer.length ? `${plural(sinLeer.length, 'mensaje nuevo', 'mensajes nuevos')} en el chat vecinal` : 'Último mensaje del chat vecinal',
        texto:`${au.nombre.split(' ')[0]}${au.casa ? ' (' + au.casa + ')' : ''}: ${ult.text}`, a:'abrir', v:'chat', p:ult.channel || 'general' });
    }
  }
  /* Obras en curso: salen solas, y en amarillo si hoy hay movimiento. */
  aLista(s.obras).filter(o => o && o.estado === 'activa').forEach(o => {
    const hoyHay = o.avisoHoy && o.avisoHoy.fecha === hoy;
    poner({ k:'obra-' + o.id + (hoyHay ? '-' + hoy : ''), nivel: hoyHay ? 'amarillo' : 'verde', icon: hoyHay ? 'truck' : 'wrench', tag: hoyHay ? 'Obra hoy' : 'Obra en curso',
      at: o.ultima || o.createdAt, titulo: hoyHay ? `${o.casa}: ${o.avisoHoy.texto}` : `${o.casa} · ${o.tipo}`,
      texto: hoyHay ? (o.avisoHoy.hora ? `Desde las ${o.avisoHoy.hora} h` : 'Hoy') : `${ETAPAS[o.etapa] || ''}${o.empresa ? ' · ' + o.empresa : ''}${o.finEstimado ? ' · fin estimado ' + fechaCorta(o.finEstimado) : ''}`,
      a:'abrir', v:'obras' });
  });
  aLista(s.viajes).filter(v => v && v.fecha >= hoy && v.userId !== u.id).forEach(v => {
    const au = usuario(v.userId) || {}, libres = v.tipo === 'ofrezco' ? v.lugares - aLista(v.anotados).length : null;
    poner({ k:'viaje-' + v.id, nivel:'verde', icon:'car', tag:'Viaje compartido', at:v.createdAt || ahora,
      titulo:`${v.tipo === 'ofrezco' ? 'Llevo' : 'Busco lugar'} → ${v.destino}`, texto:`${relDia(v.fecha)} ${v.hora} h · ${au.casa || ''}${libres !== null ? ' · ' + (libres > 0 ? plural(libres, 'lugar libre', 'lugares libres') : 'completo') : ''}${v.nota ? ' · ' + v.nota : ''}`,
      a:'abrir', v:'viajes' });
  });
  aLista(s.compras).filter(c => c && c.cierra > ahora).forEach(c =>
    poner({ k:'compra-' + c.id, nivel:'verde', icon:'cart', tag:'Compra conjunta', at:c.createdAt || ahora, titulo:c.titulo,
      texto:`Cierra ${fechaCorta(isoDe(new Date(c.cierra)))} · ${aLista(c.anotados).reduce((a, x) => a + (+x.cant || 0), 0)} de ${c.meta} ${c.unidad}`, a:'abrir', v:'compras' }));
  /* El tiempo y el camión: son de todos. */
  Clima.alertas().forEach(a => poner({ k:'clima-' + hoy + '-' + a.icon, nivel: nivelDeColor(a.nivel), icon:a.icon, tag:'Clima', at: new Date(hoy + 'T06:00').getTime(), titulo:a.t, texto:a.x, a:'abrir', v:'ushuaia' }));
  /* Los sismos fuertes o cercanos de las últimas 24 horas. */
  if (typeof Sismos !== 'undefined') Sismos.paraPizarra().forEach(x => poner({ k:'sismo-' + x.id, nivel: Sismos.nivel(x), icon:'sismo', tag:'Sismo', at:x.at,
    titulo:`Magnitud ${x.mag.toFixed(1)} · ${x.lugar}`, texto:`A ${x.km.toLocaleString('es-AR')} km del barrio${x.tsunami ? ' · con marca de tsunami' : ''}`, a:'abrir', v:'sismos' }));
  /* El camión de la basura adentro del barrio, en vivo. */
  const cam = typeof Camion !== 'undefined' && Camion.adentro();
  if (cam) poner({ k:'camion-' + cam.id, nivel:'amarillo', icon:'tacho', tag:'Residuos · ahora', at:cam.entra, titulo:'El camión de la basura está en el barrio', texto:`Entró a las ${hora(cam.entra)} h`, a:'abrir', v:'recoleccion' });
  /* Los avisos urgentes que siguen activos (para todo el barrio o tu zona). */
  if (typeof alertas === 'function') alertas().filter(a => alertaActiva(a) && (!aLista(a.lotes).length || alertaMeToca(a))).forEach(a =>
    poner({ k:'alerta-' + a.id, nivel:'rojo', icon:(TIPOS_ALERTA[a.tipo] || TIPOS_ALERTA.otro).icon, tag:'Aviso urgente', at:a.at, titulo:a.titulo, texto:`${a.zona}${a.texto ? ' · ' + a.texto : ''}`, a:'abrir', v:'alertas' }));
  const rec = recoleccionHoy();
  if (rec) poner({ k:'reco-' + hoy + '-' + rec.t, nivel: rec.vol ? 'amarillo' : 'verde', icon:'truck', tag:'Residuos', at: new Date(hoy + 'T07:00').getTime(), titulo:rec.t, texto:rec.x, a:'abrir', v:'recoleccion' });
  /* Los avisos automáticos para todos que no tienen otro lugar: también
     quedan 24 horas aunque ya se hayan leído (leídos, quietos). */
  misNotifs().filter(n => aLista(n.para).includes('todos') && ahora - n.at < DIA && !LINKS_YA_EN_PIZARRA.includes(String(n.link || '').split(':')[0]))
    .forEach(n => out.push({ k:'n-' + n.id, nuevo:!aLista(n.leidas).includes(u.id), nivel: n.urgente ? 'rojo' : nivelDeColor(n.color), icon:n.icon || 'bell', tag:'Aviso', at:n.at, titulo:n.titulo, texto:n.texto, a:'notif', id:n.id }));
  return out.sort((a, b) => (ORDEN_NIVEL[a.nivel] - ORDEN_NIVEL[b.nivel]) || (!!b.fijo - !!a.fijo) || b.at - a.at);
}
/* Los avisos que son tuyos y todavía no abriste. */
function avisosPersonales(){
  const u = yo();
  return noLeidas().filter(n => !aLista(n.para).includes('todos'))
    .map(n => ({ k:'n-' + n.id, nuevo:true, nivel: n.urgente ? 'rojo' : nivelDeColor(n.color), icon:n.icon || 'bell',
      tag: aLista(n.para).includes(u.id) ? 'Para vos' : 'Para el equipo', at:n.at, titulo:n.titulo, texto:n.texto, a:'notif', id:n.id }))
    .sort((a, b) => (ORDEN_NIVEL[a.nivel] - ORDEN_NIVEL[b.nivel]) || b.at - a.at);
}
const ventanita = x => `<button class="pz nv-${x.nivel} ${x.nuevo ? 'titila' : ''}" data-k="${esc(x.k)}" data-a="${x.a}" data-v="${esc(x.v || '')}" data-p="${esc(x.p || '')}" data-id="${esc(x.id || '')}" title="${NIVELES_PZ[x.nivel]}">
    <span class="pz-cab"><span class="pz-ic">${I(x.icon)}</span><span class="pz-tag">${esc(x.tag)}</span>${x.fijo ? `<span class="nov-fijo">${I('tack')}</span>` : ''}${x.nuevo ? '<span class="pz-nueva">Nuevo</span>' : ''}<time>${cuandoFue(x.at)}</time></span>
    <b>${esc(x.titulo)}</b>${x.texto ? `<span class="pz-txt">${esc(x.texto)}</span>` : ''}${x.de ? `<span class="pz-de">${esc(x.de)}</span>` : ''}</button>`;

/* =========================================================
   LA PIZARRA, COMPACTA
   En el teléfono la pizarra en dos columnas, con tarjetas de dos
   renglones, ocupaba media portada y todo titilaba a la vez: lo
   importante se perdía entre lo demás. Ahora:
     · arriba, un semáforo que cuenta lo NO LEÍDO por color;
     · una sola lista de renglones finos (lo tuyo y lo del barrio juntos),
       lo no leído primero y, dentro de eso, rojo → amarillo → verde;
     · solo titila lo no leído, en su tono, y la barrita de color es la
       que late: lo ya leído queda quieto y más apagado;
     · se ven pocos (4); el resto, en "Ver todo", que abre la pizarra
       entera en dos columnas.
   Lo que pide una decisión tuya (tu SOS abierto, alguien en la garita
   que pregunta por vos, una visita que pide pase) va arriba como aviso
   con sus botones: eso no puede quedar escondido en una lista.
   ========================================================= */
const MAX_PIZARRA = 4;
function itemsPizarra(){
  const per = avisosPersonales().map(x => ({ ...x, tag: x.tag === 'Para vos' ? 'Para vos' : x.tag }));
  const gen = avisosGenerales();
  return [...per, ...gen].sort((a, b) => (!!b.nuevo - !!a.nuevo) || (ORDEN_NIVEL[a.nivel] - ORDEN_NIVEL[b.nivel]) || (!!b.fijo - !!a.fijo) || b.at - a.at);
}
const renglonPz = x => `<button class="pzr nv-${x.nivel} ${x.nuevo ? 'titila' : 'leido'}" data-k="${esc(x.k)}" data-a="${x.a}" data-v="${esc(x.v || '')}" data-p="${esc(x.p || '')}" data-id="${esc(x.id || '')}" title="${NIVELES_PZ[x.nivel]}">
    <span class="pzr-ic">${I(x.icon)}</span>
    <span class="pzr-txt"><small>${esc(x.tag)}${x.fijo ? ' · fijado' : ''}</small><b>${esc(x.titulo)}</b></span>
    <time>${cuandoFue(x.at).replace(/^Hoy /, '')}</time></button>`;
/* Las acciones de lo personal que sí o sí tienen que estar a mano. */
function decisionesPendientes(){
  const u = yo(), s = Store.s;
  return urgentesVecino().filter((h, i) => i < 3 && /latido|a-info/.test(h) && /data-a="(sos-cancelar|llegada-si|sol-pase-si)"/.test(h));
}
function pizarraDelDia(){
  const items = itemsPizarra(), dec = decisionesPendientes();
  const nuevos = items.filter(x => x.nuevo);
  const cuenta = n => nuevos.filter(x => x.nivel === n).length;
  const semaforo = ['rojo', 'amarillo', 'verde'].filter(n => cuenta(n)).map(n =>
    `<span class="pz-luz nv-${n}"><i></i>${cuenta(n)} ${n === 'rojo' ? (cuenta(n) > 1 ? 'importantes' : 'importante') : n === 'amarillo' ? 'a tener en cuenta' : 'para saber'}</span>`).join('');
  const ver = items.slice(0, MAX_PIZARRA);
  const resto = items.length - ver.length;
  return `<div class="pz-compacta">
    <div class="pz-cab2"><h2>Pizarra del día</h2>
      <div class="pz-semaforo">${semaforo || `<span class="pz-luz ok">${I('check')}Nada sin leer</span>`}</div>
      <button class="link" data-a="pizarra-toda">Ver todo${items.length ? ` (${items.length})` : ''}</button></div>
    ${dec.length ? `<div class="pz-decisiones">${dec.join('')}</div>` : ''}
    ${ver.length ? `<div class="pz-renglones">${ver.map(renglonPz).join('')}</div>` : `<div class="pz-nada">${I('check')}<span>Hoy no hay avisos.<small>Lo que llegue para vos o para el barrio aparece acá.</small></span></div>`}
    ${resto > 0 ? `<button class="pz-mas" data-a="pizarra-toda">${resto} ${resto > 1 ? 'avisos más' : 'aviso más'}${nuevos.length > ver.filter(x => x.nuevo).length ? ` · ${nuevos.length - ver.filter(x => x.nuevo).length} sin leer` : ''}${I('right')}</button>` : ''}
  </div>`;
}
/* La pizarra entera, en una hoja: las dos columnas de antes. */
function pizarraCompleta(){
  const gen = avisosGenerales(), urg = urgentesVecino(), per = avisosPersonales();
  const colGen = `<div class="pz-col pz-general">
      <div class="pz-col-cab">${I('muro')}<b>Para todo el barrio</b><button class="link" data-a="novedad-al-pizarron">Pizarrón</button></div>
      ${gen.length ? `<div class="pz-renglones">${gen.map(renglonPz).join('')}</div>` : vacio('muro', 'Hoy no hay avisos para el barrio.')}</div>`;
  const colPer = `<div class="pz-col pz-personal">
      <div class="pz-col-cab">${I('user')}<b>Para vos</b></div>
      ${urg.length || per.length ? `${urg.join('')}<div class="pz-renglones">${per.map(renglonPz).join('')}</div>`
        : `<div class="pz-nada">${I('check')}<span>No tenés nada pendiente.</span></div>`}</div>`;
  return `<div class="pz-leyenda">${Object.entries(NIVELES_PZ).map(([k, t]) => `<span class="nv-${k}"><i></i>${t}</span>`).join('')}</div>
    <div class="pz-dos">${colPer}${colGen}</div>`;
}
A['pizarra-toda'] = () => { Pizarra.volver = false; hoja('Pizarra del día', pizarraCompleta(), { ancho:'900px' }); };
A['ver-novedad'] = el => {
  const s = Store.s, id = el.dataset.id;
  if (el.dataset.v === 'com'){
    const c = aLista(s.comunicados).find(x => x.id === id); if (!c) return;
    return hoja(c.tipo === 'reunion' ? 'Invitación' : 'Comunicado', `
      <div class="novedad-leer"><span class="pill p-danger">${I('tack')}De la Administración</span><time>${cuandoFue(c.at)}</time>
      <h3>${esc(c.titulo)}</h3><p>${esc(c.texto || '')}</p>
      ${c.tipo === 'reunion' && c.fecha ? `<div class="card plana small">${I('calendar')} ${fechaLarga(c.fecha)}${c.hora ? ' · ' + esc(c.hora) + ' h' : ''}${c.lugar ? ' · ' + esc(c.lugar) : ''}</div>` : ''}</div>
      <button class="btn btn-pri btn-block" data-a="cerrar-hoja" style="margin-top:14px">Listo</button>`);
  }
  const p = aLista(s.posts).find(x => x.id === id); if (!p) return;
  const t = TIPOS_POST[p.type] || TIPOS_POST.aviso, a = autorVisible(p.autor);
  hoja(t.n, `<div class="novedad-leer"><span class="pill p-${t.c}">${I(t.icon)}${t.n}</span><time>${cuandoFue(p.createdAt)} · ${esc(a.nombre)}${a.casa && a.casa !== a.nombre ? ' · ' + esc(a.casa) : ''}</time>
    <h3>${esc(p.title)}</h3>${p.body ? `<p>${esc(p.body)}</p>` : ''}
    ${p.type === 'evento' && p.fecha ? `<div class="card plana small">${I('calendar')} ${fechaLarga(p.fecha)}${p.horaEv ? ' · ' + esc(p.horaEv) + ' h' : ''}${p.lugar ? ' · ' + esc(p.lugar) : ''}</div>` : ''}</div>
    <div class="btns" style="margin-top:14px"><button class="btn btn-sec" data-a="novedad-al-pizarron">${I('muro')}Ver en el pizarrón</button>
      <button class="btn btn-pri grow" data-a="cerrar-hoja">Listo</button></div>`);
};
A['novedad-al-pizarron'] = () => { cerrarHoja(); abrir('pizarron'); };

/* El DEA de la garita, sobre la foto: es lo que alguien tiene que saber
   sin buscarlo el día que hace falta. */
const deaHero = () => `<div class="dea-hero">${I('heart')}<span><b>DEA operativo</b>${esc(/garita/i.test(Store.s.config.dea || '') || !Store.s.config.dea ? 'en la garita' : Store.s.config.dea)}</span></div>`;
/* El pie de la app: chico y en gris, para que esté pero no moleste. */
const pieApp = () => `<footer class="pie-app">
    <span>Barrio ${esc(Store.s.config.nombre)} · versión ${esc(window.VERSION || 'sin sellar')}</span>
    <span>Ushuaia · Tierra del Fuego, Antártida e Islas del Atlántico Sur</span>
    <span>by Claudio A. Ravasi</span></footer>`;

R.inicio = {
  titulo: 'Inicio', icon: 'home', ancha: true,
  render(){
    const u = yo(), s = Store.s, hoy = hoyISO(), c = Clima.d?.c;
    const hr = new Date().getHours();
    const saludo = hr < 5 ? 'Buenas noches' : hr < 13 ? 'Buen día' : hr < 20 ? 'Buenas tardes' : 'Buenas noches';
    const [desc] = c ? Clima.cod(c.weather_code) : [''];
    const sol = Clima.sol();
    /* LA FOTO DE PORTADA, CENTRADA Y PAREJA
       El DEA va solo, arriba a la derecha, para que no se mezcle con el
       tiempo. Abajo, todo centrado: saludo, nombre, temperatura, y los
       datos del tiempo en una grilla de casillas iguales (cuatro en una
       fila, o dos y dos en el teléfono), así ningún renglón queda a medio
       llenar. El sismo va debajo, a lo ancho de esa misma grilla. */
    const hero = `<div class="hero"><div class="foto" style="background-image:url('${Clima.portada()}')"></div>
      ${deaHero()}
      <div class="hero-centro">
        <div class="saludo">${saludo},</div>
        <h1>${esc(u.rol === 'vecino' ? u.nombre.split(' ')[0] : u.nombre)}</h1>
        <div class="sub">${esc(u.casa)} · ${fechaLarga(hoy)}</div>
        ${c ? `<div class="clima"><div class="temp">${Math.round(c.temperature_2m)}<small>°C</small></div>
          <div class="desc"><b>${desc}</b>Sensación ${Math.round(c.apparent_temperature)}°</div></div>
          <div class="clima-datos"><span>${I('wind')}${Clima.rumbo(c.wind_direction_10m)} ${Math.round(c.wind_speed_10m)} km/h</span>
            <span>${I('zap')}Ráfagas ${Math.round(c.wind_gusts_10m)}</span>
            <span>${I('sunrise')}${sol.sale}</span><span>${I('sunset')}${sol.pone}</span></div>`
          : `<div class="clima-datos una"><span>${I('cloud')}Cargando el clima de Ushuaia…</span></div>`}
        ${sismoHero()}
      </div>
    </div>`;

    const pron = Clima.d?.dd ? `<div class="pronostico">${[1,2,3].map(i => {
      const dd = Clima.d.dd; if (!dd.time[i]) return '';
      const [, ic] = Clima.cod(dd.weather_code[i]);
      return `<div><b>${i === 1 ? 'Mañana' : DIAS[fechaDe(dd.time[i]).getDay()]}</b>${I(ic)}
        <div class="t">${Math.round(dd.temperature_2m_max[i])}° <span>${Math.round(dd.temperature_2m_min[i])}°</span></div>
        <div class="v">${dd.snowfall_sum[i] >= 1 ? `❄ ${Math.round(dd.snowfall_sum[i])} cm` : `ráf. ${Math.round(dd.wind_gusts_10m_max[i])}`}</div></div>`; }).join('')}</div>`
      : `<div class="card muted small">${I('cloud')} Cargando el pronóstico…</div>`;

    /* LOS DOS BRAZOS NO SE REPITEN
       En modo vecino se ven las tres puertas de cualquier vecino. En modo
       Administración, la portada es SOLO la gestión: sin "Tu casa", "El
       barrio" ni "Ushuaia", que ya están en el modo vecino. Antes el modo
       Administración mostraba todo lo del vecino más lo de la gestión, y
       quien administra veía dos veces lo mismo. */
    const puertas = ['casa', 'comunidad', 'ciudad'].map(k => puerta(k, u, s, hoy)).join('');
    const bloqueSeguir = esAdmin()
      ? `${sec('Gestión del barrio', puedeAdministrar() && tengoLote() ? `<button class="link" data-a="cambiar-modo">Ver como vecino</button>` : '')}${SECCIONES.gestion.tejas(u, s, hoy)}`
      : `${sec('Por dónde seguir')}<div class="puertas-arte">${puertas}</div>`;

    /* =========================================================
       LA PORTADA, DE ARRIBA ABAJO
         1. el saludo y el tiempo de ahora (hero),
         2. los próximos días y la luz del día,
         3. la pizarra del día, compacta: una línea por aviso y por color
            de importancia,
         4. por dónde seguir: las ventanas ilustradas,
         5. al pie, más tranquilas, las dos cintas (Ushuaia hoy y el
            Hotel Los Cauquenes): antes iban una debajo de la otra en el
            medio de la portada y eran demasiado estímulo,
         6. el pie con la versión y el lugar.
       Cada bloque ocupa el ancho entero y reparte su contenido en su
       propia grilla: en el teléfono se apila y en la computadora se abre.
       ========================================================= */
    return `${hero}
      <div class="inicio-lienzo">
        <section class="bloque dia-y-luz">
          <div>${sec('Próximos días')}${pron}</div>
          <div>${sec('Luz del día')}${barraLuz(sol)}</div>
        </section>
        ${(() => { const t = typeof tarjetaPush === 'function' && !esStaff() ? tarjetaPush(true) : ''; return t ? `<section class="bloque">${t}</section>` : ''; })()}
        <section class="bloque pizarra-dia">${pizarraDelDia()}</section>
        <section class="bloque" id="porDondeSeguir">${bloqueSeguir}</section>
        <section class="bloque cintas-pie">${ushuaiaHoy()}${tiraPromos()}</section>
        ${pieApp()}
      </div>`;
  },
};

/* Lo que está pasando hoy en Ushuaia: temporadas abiertas, el crucero que
   recala, el próximo feriado y los vuelos. Va en la portada porque son las
   cosas que cambian todos los días. */
function ushuaiaHoy(){
  const s = Store.s, hoy = hoyISO();
  const chip = (icon, t, x, on) => `<button class="uh-chip ${on ? 'on' : ''}" data-a="abrir" data-v="ushuaia">${I(icon)}<span><b>${t}</b>${x ? `<small>${x}</small>` : ''}</span></button>`;
  const partes = [];
  s.temporadas.forEach(t => {
    const on = enTemporada(t), d = on ? diasHasta(t.hasta) : diasHasta(t.desde);
    partes.push(chip(t.icon || 'calendar', esc(t.nombre), on ? (d <= 15 ? `termina en ${plural(d, 'día')}` : 'abierta') : `abre en ${plural(d, 'día')}`, on));
  });
  const cru = Cruceros.hoy(), cruMan = Cruceros.lista().filter(c => c.fecha === sumarDias(hoy, 1));
  const chipCru = (icon, t, x, on) => `<button class="uh-chip ${on ? 'on' : ''}" data-a="abrir" data-v="cruceros">${I(icon)}<span><b>${t}</b>${x ? `<small>${x}</small>` : ''}</span></button>`;
  if (cru.length) partes.unshift(chipCru('send', `Hoy recala ${esc(conMayusculasBarco(cru[0].barco))}`, `${cru.length > 1 ? `y ${cru.length - 1} más · ` : ''}${horaDe(cru[0].llega)} a ${horaDe(cru[0].sale)} h${cru[0].pasajeros ? ' · ' + cru[0].pasajeros + ' pasajeros' : ''}`, true));
  else if (cruMan.length) partes.unshift(chipCru('send', `Mañana recala ${esc(conMayusculasBarco(cruMan[0].barco))}`, `${horaDe(cruMan[0].llega)} h`, false));
  /* Qué pasa hoy: si es feriado o no laborable, va primero, porque cambia el día. */
  const info = diaInfo(hoy);
  if (info.feriado) partes.unshift(chip('calendar', `Hoy es feriado`, esc(info.feriado.nombre), true));
  else if (info.noLaborable) partes.unshift(chip('calendar', 'Día no laborable', esc(info.noLaborable.nombre), true));
  const fer = proximoFeriado();
  if (fer && fer.fecha !== hoy) partes.push(chip('calendar', esc(fer.nombre), relDia(fer.fecha), false));
  const relig = feriadosDe(+hoy.slice(0, 4)).filter(f => f.fecha === hoy && (f.ambito === 'católica' || f.ambito === 'judía'));
  relig.forEach(f => partes.push(chip(f.ambito === 'judía' ? 'star' : 'tree', esc(f.nombre), f.ambito === 'judía' ? 'fiesta judía' : 'calendario católico', false)));
  const v = Vuelos.cuantosHoy();
  if (v) partes.push(chip('send', 'Vuelos de hoy en USH', v + ' movimientos', false));
  const ev = s.eventosCiudad.filter(e => e.fecha >= hoy).sort((a, b) => a.fecha.localeCompare(b.fecha))[0];
  if (ev) partes.push(chip('star', esc(ev.titulo), relDia(ev.fecha), ev.fecha === hoy));
  if (!partes.length) return '';
  return `<div class="ushuaia-hoy"><div class="uh-cab">${I('pin')}<b>Ushuaia hoy</b><span class="muted small">tocá para ver todo</span></div>
    ${marquesina(partes, 'uh-tira')}</div>`;
}

/* =========================================================
   MARQUESINA
   Una cinta que va pasando sola de derecha a izquierda, para que se vea
   todo sin tener que entrar a la ventana. No parpadea ni salta: se
   desliza despacio y en bucle. Se frena al pasar el dedo o el mouse por
   encima, para poder leer y tocar tranquilo, y queda quieta (y se puede
   arrastrar a mano) si el equipo pide menos movimiento.

   El truco del bucle sin cortes: el contenido va DOS VECES. Cuando la
   cinta se corrió la mitad de su ancho, la segunda copia está justo
   donde arrancó la primera y la animación vuelve a empezar sin que se
   note. La copia lleva aria-hidden para que un lector de pantalla no
   lea todo dos veces.
   ========================================================= */
function marquesina(items, cls = ''){
  const seg = Math.max(18, Math.round(items.length * 4.5));   /* más cosas, más lento */
  const grupo = `<div class="marq-grupo">${items.join('')}</div>`;
  return `<div class="marquesina ${cls}" data-marq>
    <div class="marq-pista" style="--marq-dur:${seg}s">${grupo}${grupo.replace('<div class="marq-grupo">', '<div class="marq-grupo" aria-hidden="true">')}</div>
  </div>`;
}

function proxRecoleccion(){
  const r = Store.s.config.recoleccion, h = new Date().getDay();
  for (let i = 0; i < 7; i++){ const d = (h + i) % 7; if (r[d] && (i > 0 || ahoraMin() < minutosDe(Store.s.config.recoleccionHora))) return `${i === 0 ? 'Hoy' : i === 1 ? 'Mañana' : DIAS_L[d]}: ${r[d]}`; }
  return 'Días de recolección';
}

/* ---------- VISITAS del vecino ---------- */
R.visitas = {
  titulo: 'Mis visitas', icon: 'users', color: 'sky', sub: 'Pases con código y QR para la garita',
  render(){
    const u = yo(), s = Store.s, hoy = hoyISO();
    const mios = s.pases.filter(p => p.hostId === u.id && !p.cancelado && !p.borrado);
    const deHoy = mios.filter(p => paseValidoEn(p, hoy) || p.log?.[hoy]);
    const futuros = mios.filter(p => !p.dias?.length && p.fecha > hoy).sort((a, b) => a.fecha.localeCompare(b.fecha));
    const fijos = mios.filter(p => p.dias?.length && (p.fechaFin || '') >= hoy);
    const llegadas = s.llegadas.filter(l => l.hostId === u.id).slice(0, 5);
    const pedidos = s.solicitudesPase.filter(r => r.hostId === u.id && r.estado === 'pendiente');
    const mes = hoy.slice(0, 7);
    return `
      ${superficie({ a:'nuevo-pase', icon:'plus', t:'Autorizar una visita', s:'Visita, delivery, proveedor, personal fijo o remís', cls:'acento' })}
      ${superficie({ a:'link-pedir', icon:'share', color:'accent', t:'Pasale un enlace a tu visita', s:'Completa sus datos desde su celular y vos lo aprobás con un toque' })}
      ${pedidos.map(r => aviso('info', 'qr', `${esc(r.nombre)} te pide un pase`, `${fechaCorta(r.fecha)} · ${r.desde}`, `<button class="btn btn-xs btn-ok" data-a="sol-pase-si" data-id="${r.id}">Aprobar</button><button class="btn btn-xs btn-sec" data-a="sol-pase-no" data-id="${r.id}">Rechazar</button>`)).join('')}
      ${sec('Hoy')}${deHoy.length ? deHoy.map(p => tarjetaPase(p)).join('') : vacio('users', 'No anunciaste a nadie para hoy.')}
      ${futuros.length ? sec('Próximas') + futuros.map(p => tarjetaPase(p)).join('') : ''}
      ${(() => { const idas = s.pases.filter(p => p.hostId === u.id && !p.borrado && !deHoy.includes(p) && !futuros.includes(p) && !fijos.includes(p)
          && (p.fechaFin || p.fecha) < hoy && (p.fechaFin || p.fecha) >= sumarDias(hoy, -60)).sort((a, b) => (b.fechaFin || b.fecha).localeCompare(a.fechaFin || a.fecha));
        return idas.length ? sec('Visitas pasadas', `<span class="muted small">últimos 60 días</span>`) + idas.slice(0, 20).map(p => {
          const dias = Object.keys(p.log || {}).sort(), ult = dias.at(-1), l = ult ? p.log[ult] : null;
          return tarjetaPase(p).replace(/<span class="estado [^"]*">[^<]*<\/span>/, `<span class="estado e-${p.cancelado ? 'cancelado' : l?.out ? 'salio' : l?.in ? 'adentro' : 'vencido'}">${p.cancelado ? 'Cancelado' : l?.out ? `Salió ${hora(l.out)}` : l?.in ? `Entró ${hora(l.in)}` : 'No vino'}</span>`);
        }).join('') : ''; })()}
      ${fijos.length ? sec('Personal fijo') + fijos.map(p => {
        const dias = Object.keys(p.log || {}).filter(d => d.startsWith(mes) && p.log[d].in).length;
        return tarjetaPase(p) .replace('</div></div>', `</div><div class="muted small" style="margin-top:8px">${I('check')} Asistencia de este mes: ${plural(dias, 'día')}</div></div>`);
      }).join('') : ''}
      ${llegadas.length ? sec('Llegadas sin aviso') + llegadas.map(l => `<div class="card" style="padding:12px 14px"><div class="pase"><span class="ic ic-warn">${I('gate')}</span>
        <div class="datos"><b>${esc(l.nombre)}</b><span>${esc(l.motivo || '')} · ${hace(l.at)}</span></div><span class="estado e-${l.estado}">${{ consultando:'Esperando', autorizado:'Autorizado', rechazado:'Rechazado' }[l.estado]}</span></div></div>`).join('') : ''}
      ${sec('Avisos a la guardia')}
      ${superficie({ a:'modo-viaje', icon:'lock', color:'wood', t: u.viaje && u.viaje.hasta >= hoy ? `Casa sola hasta el ${fechaCorta(u.viaje.hasta)}` : 'Me voy de viaje', s: u.viaje && u.viaje.hasta >= hoy ? 'La guardia suma rondas. Tocá para cambiar.' : 'La guardia suma rondas mientras la casa está sola' })}
      ${superficie({ a:'aviso-guardia', icon:'shield', color:'brand', t:'Aviso rápido a la guardia', s:'Llego tarde, ruidos raros, se cortó la luz…' })}
      <p class="muted tiny" style="margin-top:14px">Los datos de tus visitas (DNI y patente) se borran solos a los ${Store.s.config.datosDias} días (Ley 25.326).</p>`;
  },
};
A['nuevo-pase'] = (el) => {
  const tipo0 = el?.dataset?.v && TIPOS_PASE[el.dataset.v] ? el.dataset.v : 'visita';
  const hoy = hoyISO(), h = new Date(); h.setMinutes(0);
  const desde = `${pad(Math.min(h.getHours() + 1, 22))}:00`, hasta = `${pad(Math.min(h.getHours() + 5, 23))}:00`;
  hoja('Autorizar una visita', `<form data-f="nuevo-pase">
    <div class="field"><label>¿Quién viene?</label><div class="seg">${Object.entries(TIPOS_PASE).filter(([k]) => k !== 'invitado').map(([k, t], i) =>
      `<label><input type="radio" name="tipo" value="${k}" ${k === tipo0 ? 'checked' : ''}><span>${I(t.icon)}${t.n}</span></label>`).join('')}</div></div>
    <div class="field"><label>Nombre o empresa</label><input name="nombre" required maxlength="60" placeholder="Ej: Juan Pérez, Flete Sur, Pedidos Ya"></div>
    <div class="grid2"><div class="field"><label>DNI (opcional)</label><input name="dni" inputmode="numeric" maxlength="11"></div>
      <div class="field"><label>Patente (opcional)</label><input name="patente" maxlength="10" style="text-transform:uppercase" placeholder="AB 123 CD"></div></div>
    <div class="grid3"><div class="field"><label>Día</label><input type="date" name="fecha" value="${hoy}" min="${hoy}" required></div>
      <div class="field"><label>Desde</label><input type="time" name="desde" value="${desde}" required></div>
      <div class="field"><label>Hasta</label><input type="time" name="hasta" value="${hasta}" required></div></div>
    <label class="check"><input type="checkbox" name="fijo"><span><b>Viene siempre</b> (empleada, jardinero, niñera…)</span></label>
    <div id="fijoBox" hidden><div class="field" style="margin-top:8px"><label>Días</label><div class="seg dias-sel">${[1,2,3,4,5,6,0].map(d =>
      `<label><input type="checkbox" name="dias" value="${d}" ${d >= 1 && d <= 5 ? 'checked' : ''}><span>${DIAS[d]}</span></label>`).join('')}</div></div>
      <div class="field"><label>Hasta la fecha</label><input type="date" name="fechaFin" value="${sumarDias(hoy, 90)}"></div></div>
    <div class="field" style="margin-top:8px"><label>Nota para la guardia (opcional)</label><input name="nota" maxlength="120" placeholder="Ej: deja la caja en la puerta"></div>
    <button class="btn btn-pri btn-block">${I('qr')}Crear el pase</button></form>`);
};
document.addEventListener('change', e => { if (e.target.name === 'fijo'){ const b = $('#fijoBox'); if (b) b.hidden = !e.target.checked; } });
F['nuevo-pase'] = d => {
  const u = yo();
  if (minutosDe(d.hasta) <= minutosDe(d.desde) && d.hasta !== '00:00'){ toast('La hora de salida tiene que ser después de la de entrada', 'clock'); return; }
  const dias = d.fijo ? [].concat(d.dias || []).map(Number) : null;
  if (d.fijo && !dias.length){ toast('Elegí al menos un día', 'calendar'); return; }
  const p = { id:uid(), hostId:u.id, tipo:d.tipo, nombre:d.nombre.trim(), dni:soloDigitos(d.dni), patente:(d.patente || '').toUpperCase().trim(),
    fecha:d.fecha, desde:d.desde, hasta:d.hasta, nota:(d.nota || '').trim(), codigo:codigoPase(), log:{}, createdAt:Date.now() };
  if (dias){ p.dias = dias; p.fechaFin = d.fechaFin || sumarDias(d.fecha, 90); }
  Store.cambiar(s => { s.pases.unshift(p); if (p.fecha === hoyISO()) notificar(s, { para:'rol:guardia', titulo:'Nueva visita anunciada', texto:`${p.nombre} → ${u.casa} · ${p.desde}–${p.hasta}`, icon:'users', color:'sky', link:'garita' }); });
  verPase(p.id, true);
};
function verPase(id, recien = false){
  const p = Store.s.pases.find(x => x.id === id); if (!p) return;
  const u = usuario(p.hostId) || {};
  hoja(recien ? '¡Pase listo!' : 'Pase de ingreso', `
    <div class="ticket"><div class="tk-top"><small>Ingreso a ${esc(Store.s.config.nombre)}</small><h3>${esc(p.nombre)}</h3>
      <div style="opacity:.85;font-size:13px">${esc(u.casa || '')} · ${p.dias?.length ? p.dias.map(d => DIAS[d]).join(' ') : relDia(p.fecha)} · ${p.desde}–${p.hasta}</div></div>
      <div class="bottom"><div class="qr-box" data-qr="BHC:${p.codigo}"></div><div class="codigo-grande">${p.codigo}</div>
      <div class="muted small">Mostralo en la garita. También sirve dictar el código.</div></div></div>
    <div class="btns" style="margin-top:14px">
      <button class="btn btn-wa" data-a="compartir-pase" data-id="${p.id}">${I('share')}Enviar por WhatsApp</button>
      <button class="btn btn-sec" data-a="copiar" data-v="${esc(textoPase(p))}">${I('copy')}Copiar</button></div>`);
  $$('#hoja [data-qr]').forEach(el => pintarQR(el, el.dataset.qr));
}
A['ver-pase'] = el => verPase(el.dataset.id);
A['compartir-pase'] = el => { const p = Store.s.pases.find(x => x.id === el.dataset.id); if (p) compartir(textoPase(p), 'Pase de ingreso'); };
A['cancelar-pase'] = async el => {
  if (!await confirmar('Cancelar el pase', 'El código deja de servir en la garita.', { si:'Cancelar pase', peligro:true })) return;
  Store.cambiar(s => { const p = s.pases.find(x => x.id === el.dataset.id); if (p) p.cancelado = Date.now(); });
  toast('Pase cancelado', 'x');
};
/* =========================================================
   EDITAR Y BORRAR UNA VISITA
   El vecino puede corregir o sacar de su lista cualquier visita, también
   las que ya entraron y salieron. Pero nada se pierde: borrar la esconde
   de SU lista y la garita la sigue viendo en el historial del día, y cada
   cambio queda en la auditoría del barrio (qué visita, qué campos, cuándo
   y quién). Los datos personales de la visita (DNI, patente) no se copian
   a la auditoría: solo se anota que cambiaron (Ley 25.326).
   ========================================================= */
const resumenPase = p => {
  const dias = Object.keys(p.log || {}).sort(), ult = dias.at(-1), l = ult ? p.log[ult] : null;
  return `${p.nombre} · ${(TIPOS_PASE[p.tipo] || TIPOS_PASE.visita).n} · ${p.dias?.length ? 'fijo' : fechaCorta(p.fecha)}${l?.in ? ' · entró ' + hora(l.in) : ''}${l?.out ? ' · salió ' + hora(l.out) : ''}`;
};
A['editar-pase'] = el => {
  const p = Store.s.pases.find(x => x.id === el.dataset.id); if (!p) return;
  const usado = p.log && Object.keys(p.log).length;
  hoja('Editar la visita', `<form data-f="editar-pase" data-id="${p.id}">
    <div class="field"><label>Nombre o empresa</label><input name="nombre" required maxlength="60" value="${esc(p.nombre)}"></div>
    <div class="grid2"><div class="field"><label>DNI</label><input name="dni" inputmode="numeric" maxlength="11" value="${esc(p.dni || '')}"></div>
      <div class="field"><label>Patente</label><input name="patente" maxlength="10" style="text-transform:uppercase" value="${esc(p.patente || '')}"></div></div>
    ${usado || p.dias?.length ? '' : `<div class="grid3"><div class="field"><label>Día</label><input type="date" name="fecha" value="${p.fecha}" required></div>
      <div class="field"><label>Desde</label><input type="time" name="desde" value="${p.desde}" required></div>
      <div class="field"><label>Hasta</label><input type="time" name="hasta" value="${p.hasta}" required></div></div>`}
    <div class="field"><label>Nota</label><input name="nota" maxlength="120" value="${esc(p.nota || '')}"></div>
    ${usado ? `<p class="muted tiny" style="margin:-2px 0 12px">Esta visita ya pasó por la garita: el día y los horarios de entrada y salida no se cambian.</p>` : ''}
    <p class="muted tiny" style="margin:0 0 12px">El cambio queda anotado en la auditoría del barrio.</p>
    <button class="btn btn-pri btn-block">${I('check')}Guardar</button></form>`);
};
F['editar-pase'] = (d, form) => {
  Store.cambiar(s => {
    const p = s.pases.find(x => x.id === form.dataset.id); if (!p) return;
    const nuevo = { nombre:d.nombre.trim(), dni:soloDigitos(d.dni), patente:normPatente(d.patente), nota:(d.nota || '').trim() };
    if (d.fecha){ nuevo.fecha = d.fecha; nuevo.desde = d.desde; nuevo.hasta = d.hasta; }
    const nombres = { nombre:'nombre', dni:'DNI', patente:'patente', nota:'nota', fecha:'día', desde:'desde', hasta:'hasta' };
    const cambios = Object.keys(nuevo).filter(k => String(p[k] || '') !== String(nuevo[k] || ''));
    if (!cambios.length) return;
    const antes = resumenPase(p);
    Object.assign(p, nuevo);
    p.editado = { at:Date.now(), por:yo().id };
    auditar(s, 'Editó una visita', `${yo().casa} · ${antes} · cambió: ${cambios.map(k => nombres[k]).join(', ')}`, p.id);
  });
  cerrarHoja(); toast('Visita actualizada', 'check');
};
A['borrar-pase'] = async el => {
  const p = Store.s.pases.find(x => x.id === el.dataset.id); if (!p) return;
  const est = estadoPase(p);
  if (!await confirmar('Borrar la visita', `Sale de tu lista.${est === 'esperado' || est === 'futuro' ? ' El código deja de servir en la garita.' : ''} Queda en el historial de la garita y en la auditoría del barrio.`, { si:'Borrar', peligro:true })) return;
  Store.cambiar(s => {
    const x = s.pases.find(z => z.id === p.id); if (!x) return;
    if (est === 'esperado' || est === 'futuro') x.cancelado = Date.now();
    x.borrado = { at:Date.now(), por:yo().id };
    auditar(s, 'Borró una visita de su lista', `${yo().casa} · ${resumenPase(x)}`, x.id);
  });
  toast('Visita borrada de tu lista', 'trash');
};
A['link-pedir'] = () => {
  const link = urlApp('pedir/' + yo().id);
  hoja('Enlace para tu visita', `<p style="margin:0 0 12px;color:var(--ink-2)">Tu visita abre este enlace, completa su nombre, patente y horario, y a vos te llega el pedido para aprobarlo con un toque. Cuando lo aprobás, en su celular aparece el QR.</p>
    <div class="card plana mono small" style="word-break:break-all">${esc(link)}</div>
    <div class="btns"><button class="btn btn-wa" data-a="compartir-link" data-v="${esc(link)}">${I('share')}Enviar</button><button class="btn btn-sec" data-a="copiar" data-v="${esc(link)}">${I('copy')}Copiar</button></div>`);
};
A['compartir-link'] = el => compartir(`Para entrar al barrio ${Store.s.config.nombre}, completá tus datos acá y te mando el pase: ${el.dataset.v}`);
A['sol-pase-si'] = el => {
  const u = yo(); let nuevo;
  Store.cambiar(s => {
    const r = s.solicitudesPase.find(x => x.id === el.dataset.id); if (!r) return;
    nuevo = { id:uid(), hostId:u.id, tipo:'visita', nombre:r.nombre, dni:r.dni, patente:r.patente, fecha:r.fecha, desde:r.desde, hasta:r.hasta, codigo:codigoPase(), log:{}, createdAt:Date.now() };
    s.pases.unshift(nuevo); r.estado = 'aprobado'; r.paseId = nuevo.id;
  });
  toast('Aprobado. Su QR ya aparece en su celular.', 'check');
};
A['sol-pase-no'] = el => Store.cambiar(s => { const r = s.solicitudesPase.find(x => x.id === el.dataset.id); if (r) r.estado = 'rechazado'; });
A['llegada-si'] = el => responderLlegada(el.dataset.id, 'autorizado');
A['llegada-no'] = el => responderLlegada(el.dataset.id, 'rechazado');
function responderLlegada(id, estado){
  Store.cambiar(s => {
    const l = s.llegadas.find(x => x.id === id); if (!l) return;
    l.estado = estado; l.respondido = Date.now();
    notificar(s, { para:'rol:guardia', titulo:`${usuario(l.hostId)?.casa}: ${estado === 'autorizado' ? 'que pase' : 'NO autoriza'}`, texto:l.nombre, icon: estado === 'autorizado' ? 'check' : 'x', color: estado === 'autorizado' ? 'ok' : 'danger', urgente:true, link:'garita' });
  });
  toast(estado === 'autorizado' ? 'Avisamos a la guardia: puede pasar' : 'Avisamos a la guardia: no pasa', estado === 'autorizado' ? 'check' : 'x');
}
A['modo-viaje'] = () => {
  const u = yo(), v = u.viaje || {}, hoy = hoyISO();
  hoja('Me voy de viaje', `<form data-f="modo-viaje">
    <p class="muted small" style="margin:0 0 12px">La guardia ve tu casa en la lista de "casas solas" y suma rondas. Nadie más lo ve.</p>
    <div class="grid2"><div class="field"><label>Desde</label><input type="date" name="desde" value="${v.desde || hoy}" required></div>
      <div class="field"><label>Hasta</label><input type="date" name="hasta" value="${v.hasta || sumarDias(hoy, 7)}" required></div></div>
    <div class="field"><label>Contacto si pasa algo</label><input name="contacto" maxlength="80" value="${esc(v.contacto || '')}" placeholder="Nombre y teléfono"></div>
    <div class="field"><label>¿Alguien tiene llave o pasa a regar?</label><input name="nota" maxlength="120" value="${esc(v.nota || '')}" placeholder="Ej: mi hermana Ana pasa los martes"></div>
    <div class="btns">${u.viaje ? `<button type="button" class="btn btn-sec" data-a="viaje-fin">Ya volví</button>` : ''}<button class="btn btn-pri">${I('lock')}Avisar a la guardia</button></div></form>`);
};
F['modo-viaje'] = d => {
  const u = yo();
  Store.cambiar(s => { const x = s.users.find(z => z.id === u.id); x.viaje = { desde:d.desde, hasta:d.hasta, contacto:d.contacto, nota:d.nota };
    notificar(s, { para:'rol:guardia', titulo:`Casa sola: ${u.casa}`, texto:`Del ${fechaCorta(d.desde)} al ${fechaCorta(d.hasta)}`, icon:'lock', color:'wood', link:'garita' }); });
  cerrarHoja(); toast('La guardia ya sabe. ¡Buen viaje!', 'send');
};
A['viaje-fin'] = () => { const u = yo(); Store.cambiar(s => { delete s.users.find(z => z.id === u.id).viaje; }); cerrarHoja(); toast('Bienvenido/a de vuelta', 'home'); };
const AVISOS_GUARDIA = {
  tarde:  { t:'Llego tarde', x:'Estén atentos a mi llegada', icon:'car' },
  ruido:  { t:'Ruidos raros cerca de casa', x:'¿Pueden pasar a mirar?', icon:'volume' },
  luz:    { t:'Se cortó la luz', x:'En mi casa o en la calle', icon:'bolt' },
  perro:  { t:'Perro suelto', x:'Anda un perro suelto por la calle', icon:'paw' },
  otro:   { t:'Otro aviso', x:'', icon:'info' },
};
A['aviso-guardia'] = () => hoja('Aviso rápido a la guardia', `<form data-f="aviso-guardia">
  <div class="seg" style="margin-bottom:12px">${Object.entries(AVISOS_GUARDIA).map(([k, a], i) => `<label><input type="radio" name="tipo" value="${k}" ${i === 0 ? 'checked' : ''}><span>${I(a.icon)}${a.t}</span></label>`).join('')}</div>
  <div class="field"><label>Detalle (opcional)</label><input name="texto" maxlength="140" placeholder="Ej: llego 1:30 en un remís blanco"></div>
  <button class="btn btn-pri btn-block">${I('send')}Avisar</button></form>`);
F['aviso-guardia'] = d => {
  const u = yo(), a = AVISOS_GUARDIA[d.tipo];
  Store.cambiar(s => {
    s.avisos.unshift({ id:uid(), userId:u.id, tipo:d.tipo, texto:(d.texto || '').trim(), at:Date.now(), visto:null });
    notificar(s, { para:'rol:guardia', titulo:`${u.casa}: ${a.t}`, texto:d.texto || a.x, icon:a.icon, color:'warn', link:'garita' });
  });
  cerrarHoja(); toast('La guardia recibió tu aviso', 'shield');
};

/* ---------- GARITA (guardia y Administración) ---------- */
/* =========================================================
   TURNOS DE LA GARITA
   La garita entra con una sola cuenta. Lo que cambia es quién está de
   guardia: cada turno, al entrar, anota los nombres de los que trabajan.
   La Administración define los turnos (de 2 a 4, con su horario); la app
   propone el que corresponde a la hora y la guardia confirma.
   Los nombres se reconocen sin importar mayúsculas, acentos ni espacios:
   "jose  perez", "José Pérez" y "JOSE PEREZ" son la misma persona, y se
   guarda como se escribió la primera vez.
   Cada turno queda en la bitácora (abre y cierra), así todo lo que se
   anota ahí se puede atribuir a los guardias que estaban.
   ========================================================= */
const TURNOS_BASE = [{ nombre:'Mañana', desde:'06:00', hasta:'14:00' }, { nombre:'Tarde', desde:'14:00', hasta:'22:00' }, { nombre:'Noche', desde:'22:00', hasta:'06:00' }];
const turnosConfig = () => { const t = aLista(Store.s.config.turnosGarita).filter(x => x && x.nombre && x.desde && x.hasta); return t.length ? t : TURNOS_BASE; };
const enFranja = (t, min) => { const d = minutosDe(t.desde), h = minutosDe(t.hasta); return d < h ? min >= d && min < h : (min >= d || min < h); };
const turnoDeAhora = () => turnosConfig().find(t => enFranja(t, ahoraMin())) || turnosConfig()[0];
const registrosTurno = () => aLista(Store.s.bitacora).filter(b => b && b.tipo === 'turno' && b.abre).sort((a, b) => b.at - a.at);
const turnoAbierto = () => registrosTurno().find(b => !b.cerradoAt) || null;
/* ¿Esta sesión ya anotó (o retomó) su turno? Mientras la bitácora todavía
   está bajando de la nube se le cree a la sesión, para que no parpadee. */
function turnoListo(){
  if (!esGuardia()) return true;
  const t = turnoAbierto();
  if (t) return Store.sesion.turnoId === t.id;
  return !!Store.sesion.turnoId && !registrosTurno().length && !(Store.s.bitacora || []).length;
}
/* Quiénes estaban de guardia en un momento dado. */
const guardiasEn = at => { const t = registrosTurno().find(b => b.at <= at && (!b.cerradoAt || at <= b.cerradoAt)); return t ? aLista(t.guardias) : []; };
const claveNombre = t => normTxt(t).replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
const conMayusculas = t => String(t).trim().replace(/\s+/g, ' ').toLowerCase().replace(/(^|[\s'-])(\p{L})/gu, (m, a, b) => a + b.toUpperCase());
/* Los guardias que ya trabajaron alguna vez, con su nombre como quedó escrito. */
function guardiasConocidos(){
  const m = new Map();
  registrosTurno().slice().reverse().forEach(r => aLista(r.guardias).forEach(n => { const k = claveNombre(n); if (k && !m.has(k)) m.set(k, n); }));
  return m;
}
function formularioTurno(){
  const u = yo(), t = turnoDeAhora(), abierto = turnoAbierto(), conocidos = [...guardiasConocidos().values()];
  const fila = i => `<div class="turno-fila"><span class="turno-n">${i + 1}</span><input name="g" list="guardiasLista" autocomplete="off" maxlength="50" ${i === 0 ? 'required' : ''} placeholder="${i === 0 ? 'Nombre y apellido' : 'Otro guardia (opcional)'}"></div>`;
  return `<div class="turno-portada">
    <span class="turno-ic">${I('shield')}</span>
    <h1>Nuevo turno en la garita</h1>
    <p>${fechaLarga(hoyISO())} · ${hora(Date.now())} h</p></div>
    ${abierto ? `<div class="card turno-previo"><b>${I('clock')} El turno ${esc(abierto.turno)} sigue abierto</b>
      <span>${esc(aLista(abierto.guardias).join(', '))} · desde las ${hora(abierto.at)} h${isoDe(new Date(abierto.at)) !== hoyISO() ? ' del ' + fechaCorta(isoDe(new Date(abierto.at))) : ''}</span>
      <div class="btns" style="margin-top:10px"><button class="btn btn-sm btn-sec" data-a="seguir-turno">Soy de ese turno: seguir</button></div>
      <p class="muted tiny" style="margin:8px 0 0">Si abrís uno nuevo, ese se cierra solo y queda anotado en la bitácora.</p></div>` : ''}
    <form data-f="abrir-turno" class="card">
      <div class="field"><label>¿Qué turno es?</label><select name="turno">${turnosConfig().map(x => `<option value="${esc(x.nombre)}" ${x.nombre === t.nombre ? 'selected' : ''}>${esc(x.nombre)} · ${x.desde} a ${x.hasta} h</option>`).join('')}</select></div>
      <div class="field"><label>¿Quiénes trabajan hoy?</label>${[0, 1, 2].map(fila).join('')}<div id="turnoMas"></div>
        <button type="button" class="btn btn-xs btn-sec" data-a="turno-otro" style="margin-top:4px">${I('plus')}Agregar otro guardia</button>
        <div class="ayuda">No importan mayúsculas ni acentos: si ya trabajó antes, se reconoce solo.</div></div>
      <datalist id="guardiasLista">${conocidos.map(n => `<option value="${esc(n)}">`).join('')}</datalist>
      <button class="btn btn-pri btn-block btn-grande">${I('check')}Empezar el turno</button>
    </form>
    <p class="muted tiny center">Cuenta de la garita · ${esc(u.email || '')}</p>`;
}
A['turno-otro'] = () => {
  const box = $('#turnoMas'); if (!box) return;
  const n = $$('input[name="g"]').length;
  if (n >= 8){ toast('Hasta ocho guardias por turno', 'users'); return; }
  box.insertAdjacentHTML('beforeend', `<div class="turno-fila"><span class="turno-n">${n + 1}</span><input name="g" list="guardiasLista" autocomplete="off" maxlength="50" placeholder="Otro guardia"></div>`);
  box.lastElementChild.querySelector('input').focus();
};
A['seguir-turno'] = () => { const t = turnoAbierto(); if (!t) return; Store.sesion.turnoId = t.id; Store.guardarSesion(); toast(`Seguís en el turno ${t.turno}`, 'shield'); pintar(); };
F['abrir-turno'] = d => {
  const u = yo(), conocidos = guardiasConocidos(), vistos = new Set(), guardias = [];
  [].concat(d.g || []).forEach(n => {
    const k = claveNombre(n); if (!k || vistos.has(k)) return;
    vistos.add(k); guardias.push(conocidos.get(k) || conMayusculas(n));
  });
  if (!guardias.length){ toast('Anotá al menos un guardia', 'users'); return; }
  const turno = turnosConfig().find(x => x.nombre === d.turno)?.nombre || turnoDeAhora().nombre;
  const id = uid(), ahora = Date.now();
  Store.cambiar(s => {
    const previo = aLista(s.bitacora).find(b => b.tipo === 'turno' && b.abre && !b.cerradoAt);
    if (previo){
      previo.cerradoAt = ahora; previo.cierreAuto = true;
      s.bitacora.unshift({ id:uid(), autor:u.id, tipo:'turno', texto:`Se cerró el turno ${previo.turno} (${aLista(previo.guardias).join(', ')}) al empezar el siguiente.`, at:ahora - 1 });
    }
    s.bitacora.unshift({ id, autor:u.id, tipo:'turno', abre:true, turno, guardias, texto:`Empieza el turno ${turno}: ${guardias.join(', ')}.`, at:ahora });
  });
  Store.sesion.turnoId = id; Store.guardarSesion();
  toast(`Turno ${turno} en marcha`, 'shield');
  pintar();
};
A['cerrar-turno'] = () => {
  const t = turnoAbierto();
  hoja('Cerrar el turno', `<form data-f="cerrar-turno">
    ${t ? `<p class="small" style="margin:0 0 12px">Turno <b>${esc(t.turno)}</b> · ${esc(aLista(t.guardias).join(', '))} · desde las ${hora(t.at)} h.</p>` : ''}
    <div class="field"><label>Novedades para el turno que entra (opcional)</label><textarea name="nota" maxlength="500" placeholder="Ej: quedó un paquete para el lote 40; el portón del fondo cierra mal."></textarea></div>
    <button class="btn btn-pri btn-block">${I('logout')}Cerrar el turno y salir</button>
    <p class="muted tiny" style="margin:10px 0 0">El turno siguiente entra con el mismo correo y la misma clave de la garita, y anota a sus guardias.</p></form>`);
};
F['cerrar-turno'] = async d => {
  const u = yo(), t = turnoAbierto(), nota = (d.nota || '').trim();
  Store.cambiar(s => {
    const x = t && aLista(s.bitacora).find(b => b.id === t.id);
    if (x) x.cerradoAt = Date.now();
    s.bitacora.unshift({ id:uid(), autor:u.id, tipo:'turno', texto:`Termina el turno ${t ? t.turno + ' (' + aLista(t.guardias).join(', ') + ')' : ''}.${nota ? ' Novedades: ' + nota : ''}`, at:Date.now() });
  });
  if (typeof Nube !== 'undefined' && Nube.activa()) await new Promise(r => setTimeout(r, 700));   /* que llegue a la base antes de salir */
  toast('Turno cerrado', 'check');
  await cerrarSesion();
};
const bandaTurno = () => {
  const t = turnoAbierto(); if (!t) return '';
  return `<div class="turno-banda">${I('shield')}<div class="grow"><b>Turno ${esc(t.turno)}</b><span>${esc(aLista(t.guardias).join(' · '))} · desde las ${hora(t.at)} h</span></div>
    ${esGuardia() ? `<button class="btn btn-xs btn-sec" data-a="cerrar-turno">${I('logout')}Cerrar turno</button>` : ''}</div>`;
};

/* La Administración arma los turnos y ve quién trabajó en cada uno. */
R.turnos = {
  titulo: 'Turnos de la garita', icon: 'clock', color: 'sky', sub: 'Horarios y quién trabajó en cada turno',
  render(){
    if (!esStaff()) return vacio('lock', 'Solo para la garita y la Administración.');
    const ts = turnosConfig(), hist = registrosTurno().slice(0, 40);
    const fila = i => { const t = ts[i] || {}; return `<div class="grid3 turno-edit"><div class="field"><label>Turno ${i + 1}${i >= 2 ? ' (opcional)' : ''}</label><input name="n${i}" value="${esc(t.nombre || '')}" maxlength="20" placeholder="${['Mañana', 'Tarde', 'Noche', 'Madrugada'][i]}" ${i < 2 ? 'required' : ''}></div>
      <div class="field"><label>Desde</label><input type="time" name="d${i}" value="${esc(t.desde || '')}" ${i < 2 ? 'required' : ''}></div>
      <div class="field"><label>Hasta</label><input type="time" name="h${i}" value="${esc(t.hasta || '')}" ${i < 2 ? 'required' : ''}></div></div>`; };
    return `${bandaTurno()}
      ${esAdmin() ? `<form data-f="turnos" class="card"><div class="lbl" style="margin-bottom:8px">Horarios de los turnos</div>
        ${[0, 1, 2, 3].map(fila).join('')}
        <p class="muted tiny" style="margin:0 0 10px">De 2 a 4 turnos. Un turno puede pasar la medianoche (por ejemplo, de 22:00 a 06:00). Dejá vacíos los que no uses.</p>
        <button class="btn btn-pri btn-block">${I('check')}Guardar los turnos</button></form>`
      : `<div class="card">${ts.map(t => `<div class="row" style="justify-content:space-between;padding:6px 0"><b>${esc(t.nombre)}</b><span class="muted">${t.desde} a ${t.hasta} h</span></div>`).join('')}
        <p class="muted tiny" style="margin:6px 0 0">Los horarios los define la Administración.</p></div>`}
      ${sec('Últimos turnos')}
      ${hist.length ? `<div class="card">${hist.map(r => `<div class="lista"><div class="it"><span class="ic ic-sky" style="width:34px;height:34px;border-radius:11px;display:grid;place-items:center">${I('shield')}</span>
        <div class="txt"><b>${esc(r.turno)} · ${esc(aLista(r.guardias).join(', '))}</b>
        <span>${relDia(isoDe(new Date(r.at)))} de ${hora(r.at)} a ${r.cerradoAt ? hora(r.cerradoAt) + ' h' + (r.cierreAuto ? ' (se cerró al abrir el siguiente)' : '') : 'ahora · en curso'}</span></div></div></div>`).join('')}</div>`
        : vacio('clock', 'Todavía no se abrió ningún turno.')}`;
  },
};
F['turnos'] = d => {
  const ts = [0, 1, 2, 3].map(i => ({ nombre:String(d['n' + i] || '').trim(), desde:d['d' + i] || '', hasta:d['h' + i] || '' })).filter(t => t.nombre && t.desde && t.hasta);
  if (ts.length < 2){ toast('Tienen que ser al menos dos turnos', 'clock'); return; }
  if (new Set(ts.map(t => claveNombre(t.nombre))).size !== ts.length){ toast('Dos turnos no pueden llamarse igual', 'clock'); return; }
  if (ts.some(t => t.desde === t.hasta)){ toast('Un turno no puede empezar y terminar a la misma hora', 'clock'); return; }
  Store.cambiar(s => { s.config.turnosGarita = ts; auditar(s, 'Cambió los turnos de la garita', ts.map(t => `${t.nombre} ${t.desde}-${t.hasta}`).join(' · ')); });
  toast('Turnos guardados', 'check');
};

R.garita = {
  titulo: 'Garita', icon: 'gate', color: 'brand', ancha: true, sub: () => fechaLarga(hoyISO()),
  render(){
    if (!esStaff()) return vacio('lock', 'La garita es solo para la guardia y la Administración.');
    if (esGuardia() && !turnoListo()) return formularioTurno();
    const s = Store.s, hoy = hoyISO();
    const lista = pasesDelDia(hoy).sort((a, b) => a.desde.localeCompare(b.desde));
    const adentro = lista.filter(p => estadoPase(p) === 'adentro').length;
    const esperados = lista.filter(p => estadoPase(p) === 'esperado').length;
    const paq = s.paquetes.filter(p => !p.retirado);
    const llegadas = s.llegadas.filter(l => l.estado === 'consultando' || Date.now() - l.at < 30 * MIN);
    const solas = s.users.filter(u => u.viaje && u.viaje.desde <= hoy && u.viaje.hasta >= hoy);
    const avisos = s.avisos.filter(a => Date.now() - a.at < 6 * HORA);
    const vol = s.avistamientos.filter(a => Date.now() - a.at < DIA);
    const u = yo();
    return `
      ${PILA.length === 1 ? `<div class="titulo-vista" style="margin-top:16px"><h1>Garita</h1><p>${fechaLarga(hoy)}</p></div>` : ''}
      ${bandaTurno()}
      ${bandaCamion(true)}
      ${alertas().filter(alertaActiva).map(a => { const ay = destinatariosAlerta(a).filter(v => a.respuestas?.[v.id]?.r === 'ayuda').length;
        return aviso(ay ? 'danger latido' : 'warn', 'siren', `Aviso urgente activo: ${esc(a.titulo)}`, `${esc(a.zona)} · ${ay ? plural(ay, 'casa pide', 'casas piden') + ' ayuda' : 'nadie pidió ayuda'}`, `<button class="btn btn-xs btn-sec" data-a="abrir" data-v="alertas">Ver respuestas</button>`); }).join('')}
      ${Clima.alertas().map(a => aviso(a.nivel, a.icon, a.t, a.x)).join('')}
      <div class="garita-kpis"><div class="kpi"><b>${esperados}</b><span>Esperados</span></div><div class="kpi"><b>${adentro}</b><span>Adentro</span></div><div class="kpi"><b>${paq.length}</b><span>Paquetes</span></div></div>
      <form data-f="validar" class="card">
        <div class="lbl">Código, patente o DNI</div>
        <div class="validador"><input name="q" id="qValidar" autocomplete="off" placeholder="482913" maxlength="12" inputmode="text">
          <button class="btn btn-pri">${I('search')}</button></div>
        <div class="btns" style="margin-top:10px"><button type="button" class="btn btn-sm btn-sec" data-a="escanear">${I('scan')}Escanear QR</button>
          <button type="button" class="btn btn-sm btn-sec" data-a="llegada-nueva">${I('gate')}Llegó sin aviso</button>
          <button type="button" class="btn btn-sm btn-sec" data-a="paquete-nuevo">${I('box')}Llegó un paquete</button>
          <button type="button" class="btn btn-sm btn-sec" data-a="abrir" data-v="frecuentes">${I('qr')}Ingresos frecuentes</button>
          <button type="button" class="btn btn-sm btn-sec" data-a="alerta-nueva">${I('siren')}Aviso urgente</button></div>
      </form>
      ${s.peticiones.filter(p => p.estado === 'pendiente').map(p => aviso('warn latido', 'edit', `Petición de ${esc(p.casa)} sin recibir`, esc(TIPOS_PET[p.tipo]?.n || ''), `<button class="btn btn-xs btn-sec" data-a="ver-peticion" data-id="${p.id}">Leer y firmar</button>`)).join('')}
      ${s.obras.filter(o => o.avisoHoy?.fecha === hoy).map(o => aviso('info', 'truck', `Obra en ${esc(o.casa)}: ${esc(o.avisoHoy.texto)}`, o.avisoHoy.hora ? `Desde las ${o.avisoHoy.hora} h · ${esc(o.empresa || '')}` : esc(o.empresa || ''))).join('')}
      ${(() => { const rs = s.peticiones.filter(p => p.tipo === 'nopasar' && p.estado === 'en_funciones' && (!p.hasta || p.hasta >= hoy)); return rs.length ? sec('Restricciones de ingreso vigentes') + rs.map(p => `<button class="superficie peligro" data-a="ver-peticion" data-id="${p.id}"><span class="ic ic-danger">${I('x')}</span><span class="txt"><b>${esc(p.casa)}</b><small>${esc(p.texto.slice(0, 90))}</small></span>${I('right')}</button>`).join('') : ''; })()}
      ${llegadas.length ? sec('Consultando al vecino') + llegadas.map(l => { const h = usuario(l.hostId) || {}; const min = Math.floor((Date.now() - l.at) / MIN);
        return `<div class="card" style="padding:13px 14px"><div class="pase"><span class="ic ic-warn">${I('gate')}</span><div class="datos"><b>${esc(l.nombre)} → ${esc(h.casa || '')}</b><span>${esc(l.motivo || '')}${l.patente ? ' · ' + esc(l.patente) : ''} · hace ${min} min</span></div>
          <span class="estado e-${l.estado}">${{ consultando:'Esperando', autorizado:'Puede pasar', rechazado:'No autorizado' }[l.estado]}</span></div>
          ${l.estado === 'consultando' && min >= 2 && h.tel ? `<div class="btns" style="margin-top:10px"><a class="btn btn-sm btn-sec" href="${telLink(h.tel)}">${I('phone')}Llamar a ${esc(h.nombre.split(' ')[0])}</a></div>` : ''}</div>`; }).join('') : ''}
      ${avisos.length ? sec('Avisos de vecinos') + avisos.map(a => { const v = usuario(a.userId) || {}, t = AVISOS_GUARDIA[a.tipo] || AVISOS_GUARDIA.otro;
        return `<div class="card" style="padding:12px 14px"><div class="pase"><span class="ic ic-warn">${I(t.icon)}</span><div class="datos"><b>${esc(v.casa || '')}: ${t.t}</b><span>${esc(a.texto || t.x)} · ${hace(a.at)}</span></div>
          ${a.visto ? `<span class="estado e-autorizado">Visto</span>` : `<button class="btn btn-xs btn-ok" data-a="aviso-visto" data-id="${a.id}">Visto</button>`}</div></div>`; }).join('') : ''}
      ${sec('Ingresos de hoy', `<span class="muted small">${lista.length}</span>`)}
      ${lista.length ? lista.map(p => tarjetaPase(p, { garita:true })).join('') : vacio('users', 'Nadie anunciado para hoy.')}
      ${paq.length ? sec('Paquetes en la garita') + paq.map(p => `<div class="card" style="padding:12px 14px"><div class="pase"><span class="ic ic-wood">${I('box')}</span>
        <div class="datos"><b>${esc(usuario(p.hostId)?.casa || '')} · ${esc(p.empresa)}</b><span>${esc(p.detalle || '')} · llegó ${hace(p.recibido)}</span></div>
        <button class="btn btn-xs btn-ok" data-a="paquete-entregado" data-id="${p.id}">Entregado</button></div></div>`).join('') : ''}
      ${solas.length ? sec('Casas solas') + solas.map(v => `<div class="card" style="padding:12px 14px"><div class="pase"><span class="ic ic-wood">${I('lock')}</span>
        <div class="datos"><b>${esc(v.casa)}</b><span>Hasta el ${fechaCorta(v.viaje.hasta)}${v.viaje.contacto ? ' · ' + esc(v.viaje.contacto) : ''}${v.viaje.nota ? ' · ' + esc(v.viaje.nota) : ''}</span></div>
        <button class="btn btn-xs btn-sec" data-a="ronda-casa" data-v="${esc(v.casa)}">Ronda hecha</button></div></div>`).join('') : ''}
      ${vol.length ? sec('Avistamientos de hoy') + vol.map(a => `<div class="card plana" style="padding:10px 14px"><b>${esc(ESPECIES[a.especie]?.n || a.especie)}</b> · ${esc(a.lugar || '')} <span class="muted small">· ${hace(a.at)}</span></div>`).join('') : ''}
      ${PILA.length === 1 ? sec('Más') + `<div class="mosaico">
        ${teja({ v:'peticiones', icon:'edit', color:'warn', t:'Peticiones', s:'Recibir y firmar', badge: s.peticiones.filter(p => p.estado === 'pendiente').length })}
        ${teja({ v:'bitacora', icon:'book', color:'wood', t:'Bitácora', s:'Libro de guardia' })}
        ${teja({ a:'nuevo-post', v:'guardia', icon:'muro', t:'Escribir en el pizarrón', s:'Les suena a todos los vecinos' })}
        ${teja({ v:'vecinos', icon:'search', color:'brand', t:'Buscar un vecino', s:'Por nombre, apellido o lote, con la foto de la casa' })}
        ${teja({ v:'privado', icon:'lock', color:'accent', t:'Mensajes con vecinos', s:'Avisar algo a un lote', badge: s.privados.filter(h => (h.con || 'admin') === 'guardia').reduce((n, h) => n + aLista(h.msgs).filter(m => m.from === 'vecino' && !m.leido).length, 0) })}
        ${esGuardia() ? teja({ v:'privado', p:'interno', icon:'sliders', color:'accent', t:'Administración', s:'Mensajes entre la garita y la Administración', badge: s.privados.filter(h => h.con === 'interno' && h.userId === u.id).reduce((n, h) => n + aLista(h.msgs).filter(m => m.from === 'admin' && !m.leido).length, 0) }) : ''}
        ${teja({ v:'turnos', icon:'clock', color:'sky', t:'Turnos', s:'Horarios y quién trabajó' })}
        ${teja({ v:'proveedores', icon:'box', color:'accent', t:'Proveedores', s:'Controlar ART', n: s.proveedores.filter(p => artEstado(p)[1] === 'danger').length || '' })}
        ${teja({ v:'obras', icon:'wrench', color:'wood', t:'Obras', s:'Avisos del día' })}
        ${teja({ v:'chat', icon:'chat', color:'sky', t:'Chat vecinal', s:'#seguridad y más' })}
        ${teja({ v:'vuelos', icon:'send', color:'accent', t:'Vuelos USH', s:'Arribos y partidas' })}
        ${teja({ v:'emergencias', icon:'siren', color:'danger', t:'Emergencias', s:'Teléfonos útiles y DEA' })}
        ${teja({ v:'documentos', icon:'file', color:'brand', t:'Reglamento', s:'Normas y protocolos' })}
        ${esGuardia() ? teja({ a:'cerrar-turno', icon:'logout', color:'warn', t:'Cerrar el turno', s:'Cambio de guardia' }) : ''}</div>` : ''}`;
  },
};
F['validar'] = d => validar(d.q);
/* Peticiones firmadas de "no dejar pasar" que siguen en funciones. */
function restriccionPara(nombre = '', dni = '', patente = ''){
  const n = normTxt(nombre).split(/\s+/).filter(w => w.length > 2), d = soloDigitos(dni), pa = normPatente(patente);
  return Store.s.peticiones.find(p => p.tipo === 'nopasar' && p.estado === 'en_funciones' && (!p.hasta || p.hasta >= hoyISO()) && (() => {
    const t = normTxt(p.texto), td = soloDigitos(p.texto), tp = normPatente(p.texto);
    return (d.length >= 7 && td.includes(d)) || (pa.length >= 6 && tp.includes(pa)) || (n.length >= 2 && n.filter(w => t.includes(w)).length >= 2);
  })());
}
const avisoRestriccion = r => r ? aviso('danger latido', 'x', `NO DEJAR PASAR · pedido de ${esc(r.casa)}`, esc(r.texto), `<button class="btn btn-xs btn-sec" data-a="ver-peticion" data-id="${r.id}">Ver petición firmada</button>`) : '';
function validar(q){
  const s = Store.s, hoy = hoyISO();
  const txt = String(q || '').trim().replace(/^BHC:/i, '');
  const dig = soloDigitos(txt), pat = normPatente(txt);
  if (!txt){ toast('Escribí un código, una patente o un DNI', 'search'); return; }
  /* Pase fijo de un ingreso frecuente (F-…) o credencial de vecino (V-…). */
  if (typeof validarCodigoEspecial === 'function' && validarCodigoEspecial(txt)) return;
  const pases = s.pases.filter(p => !p.cancelado && ((dig.length === 6 && p.codigo === dig) || (pat.length >= 6 && normPatente(p.patente) === pat) || (dig.length >= 7 && p.dni === dig)));
  const vecino = pat.length >= 6 ? s.users.find(u => (u.vehiculos || []).some(v => normPatente(v.patente) === pat)) : null;
  if (!pases.length && !vecino){
    hoja('Sin coincidencias', `${avisoRestriccion(restriccionPara('', dig, pat))}${aviso('danger', 'x', 'No hay ningún pase con ese dato', 'Si dice venir a una casa, registrá la llegada y consultamos al vecino.')}
      <button class="btn btn-pri btn-block" data-a="llegada-nueva">${I('gate')}Registrar llegada sin aviso</button>`); return;
  }
  const restr = pases.map(p => restriccionPara(p.nombre, p.dni, p.patente)).find(Boolean) || restriccionPara('', dig, pat);
  hoja('Resultado', `${avisoRestriccion(restr)}${vecino ? aviso('ok', 'car', `Vehículo de vecino: ${esc(vecino.casa)}`, `${esc(vecino.nombre)} · ${esc((vecino.vehiculos.find(v => normPatente(v.patente) === pat) || {}).modelo || '')}`) : ''}
    ${pases.map(p => {
      const valido = paseValidoEn(p, hoy), est = estadoPase(p), dentroHora = ahoraMin() >= minutosDe(p.desde) - 30 && ahoraMin() <= minutosDe(p.hasta) + 30;
      return `${!valido ? aviso('danger', 'alert', 'Este pase no es para hoy', p.dias?.length ? `Días: ${p.dias.map(d => DIAS[d]).join(', ')}` : `Es para el ${fechaLarga(p.fecha)}`) : !dentroHora && est === 'esperado' ? aviso('warn', 'clock', 'Fuera del horario anunciado', `${p.desde} a ${p.hasta}`) : ''}
        ${(() => { if (p.tipo !== 'proveedor') return ''; const pr = Store.s.proveedores.find(x => normTxt(p.nombre).includes(normTxt(x.empresa)) || normTxt(x.empresa).includes(normTxt(p.nombre)));
          if (!pr) return aviso('warn', 'box', 'Proveedor no habilitado', 'No figura en la lista de proveedores. Pedí la constancia de ART.');
          const [t, c] = artEstado(pr); return aviso(c === 'ok' ? 'ok' : c === 'danger' ? 'danger' : 'warn', 'box', `${esc(pr.empresa)}: ${t}`, pr.personal ? 'Personal: ' + esc(String(pr.personal).split('\n').join(', ')) : ''); })()}
        ${tarjetaPase(p, { garita:true })}${p.nota ? `<p class="small" style="margin:-4px 4px 12px"><b>Nota:</b> ${esc(p.nota)}</p>` : ''}`;
    }).join('')}`);
}
A['pase-in'] = el => movimiento(el.dataset.id, 'in');
A['pase-out'] = el => movimiento(el.dataset.id, 'out');
function movimiento(id, tipo){
  const hoy = hoyISO();
  Store.cambiar(s => {
    const p = s.pases.find(x => x.id === id); if (!p) return;
    p.log = p.log || {}; p.log[hoy] = p.log[hoy] || {}; p.log[hoy][tipo] = Date.now();
    const casa = usuario(p.hostId)?.casa || '';
    notificar(s, { para:p.hostId, titulo: tipo === 'in' ? `${p.nombre} entró al barrio` : `${p.nombre} salió del barrio`, texto:`${hora(Date.now())} h`, icon: tipo === 'in' ? 'login' : 'logout', color:'ok', link:'visitas' });
    s.bitacora.unshift({ id:uid(), autor:yo().id, tipo:'acceso', texto:`${tipo === 'in' ? 'Ingreso' : 'Egreso'}: ${p.nombre} (${TIPOS_PASE[p.tipo]?.n || ''}) → ${casa}${p.patente ? ' · ' + p.patente : ''}`, at:Date.now() });
  });
  cerrarHoja();
  toast(tipo === 'in' ? 'Ingreso registrado. El vecino ya fue avisado.' : 'Salida registrada', tipo === 'in' ? 'login' : 'logout');
}
const opcionesCasas = () => vecinosAprobados().sort((a, b) => a.casa.localeCompare(b.casa, 'es', { numeric:true }))
  .map(u => `<option value="${u.id}">${esc(u.casa)} · ${esc(u.nombre)}</option>`).join('');
/* Todos los lotes del padrón, estén o no registrados en la app. */
const opcionesLotes = (sel = '') => LOTES.map(l => `<option value="Lote ${l.lote}" ${'Lote ' + l.lote === sel ? 'selected' : ''}>${esc(nombreLote(l))}${propietarioDe('Lote ' + l.lote) ? ' · ' + esc(propietarioDe('Lote ' + l.lote)) : ''}</option>`).join('');
A['llegada-nueva'] = () => hoja('Llegó alguien sin aviso', `<form data-f="llegada">
  <div class="field"><label>¿A qué casa va?</label><select name="hostId" required>${opcionesCasas()}</select></div>
  <div class="field"><label>Nombre</label><input name="nombre" required maxlength="60"></div>
  <div class="grid2"><div class="field"><label>Patente</label><input name="patente" maxlength="10" style="text-transform:uppercase"></div>
    <div class="field"><label>Motivo</label><select name="motivo"><option>Visita</option><option>Delivery</option><option>Remís / taxi</option><option>Proveedor / obra</option><option>Correo / paquete</option><option>Otro</option></select></div></div>
  <button class="btn btn-pri btn-block">${I('send')}Consultar al vecino</button>
  <p class="muted tiny" style="margin:10px 0 0">Al vecino le aparece en el celular con dos botones: "Que pase" o "No lo conozco".</p></form>`);
F['llegada'] = d => {
  const r = restriccionPara(d.nombre, '', d.patente);
  if (r){ hoja('Atención', `${avisoRestriccion(r)}<p class="small">No se consulta al vecino: hay un pedido firmado para no dejar pasar a esta persona.</p>`);
    Store.cambiar(s => { s.bitacora.unshift({ id:uid(), autor:yo().id, tipo:'incidente', texto:`Se presentó ${d.nombre.trim()} (restricción de ${r.casa}). No ingresó.`, at:Date.now() });
      notificar(s, { para:r.userId, titulo:'Se presentó en la garita alguien con restricción', texto:d.nombre.trim(), icon:'x', color:'danger', urgente:true, link:'peticiones' }); });
    return; }
  Store.cambiar(s => {
    s.llegadas.unshift({ id:uid(), hostId:d.hostId, nombre:d.nombre.trim(), patente:(d.patente || '').toUpperCase(), motivo:d.motivo, at:Date.now(), estado:'consultando' });
    notificar(s, { para:d.hostId, titulo:`En la garita: ${d.nombre.trim()}`, texto:`${d.motivo} · ¿Lo dejamos pasar?`, icon:'gate', color:'warn', urgente:true, link:'inicio' });
  });
  cerrarHoja(); toast('Consultando al vecino…', 'send');
};
/* Los paquetes (con foto y confirmación del vecino) están en v-servicio.js. */
A['aviso-visto'] = el => Store.cambiar(s => { const a = s.avisos.find(x => x.id === el.dataset.id); if (a){ a.visto = Date.now();
  notificar(s, { para:a.userId, titulo:'La guardia vio tu aviso', texto:AVISOS_GUARDIA[a.tipo]?.t || '', icon:'shield', color:'ok' }); } });
A['ronda-casa'] = el => { Store.cambiar(s => s.bitacora.unshift({ id:uid(), autor:yo().id, tipo:'ronda', texto:`Ronda por ${el.dataset.v} (casa sola): sin novedades.`, at:Date.now() })); toast('Anotado en la bitácora', 'book'); };

/* Escáner de QR con la cámara (Chrome en Android lo trae de fábrica). */
A['escanear'] = async () => {
  if (!('BarcodeDetector' in window) || !navigator.mediaDevices){ toast('Este equipo no puede leer QR. Escribí el código.', 'scan'); return; }
  hoja('Escanear QR', `<video class="video-scan" id="scanVideo" playsinline muted></video><p class="muted small center">Apuntá al QR del pase</p>`);
  let stream;
  try { stream = await navigator.mediaDevices.getUserMedia({ video:{ facingMode:'environment' } }); }
  catch(e){ cerrarHoja(); toast('No se pudo usar la cámara', 'camera'); return; }
  const v = $('#scanVideo'); v.srcObject = stream; await v.play().catch(() => {});
  const det = new BarcodeDetector({ formats:['qr_code'] });
  const d = $('#hoja');
  const parar = () => stream.getTracks().forEach(t => t.stop());
  d.addEventListener('close', parar, { once:true });
  const ciclo = async () => {
    if (!d.open) return;
    try { const r = await det.detect(v); if (r[0]){ parar(); cerrarHoja(); validar(r[0].rawValue); return; } } catch(e){}
    setTimeout(ciclo, 250);
  };
  ciclo();
};

/* ---------- BITÁCORA ---------- */
const TIPOS_BIT = { turno:['Cambio de turno','clock','sky'], ronda:['Ronda','shield','brand'], novedad:['Novedad','info','accent'], incidente:['Incidente','alert','danger'], acceso:['Acceso','gate','ok'] };
R.bitacora = {
  titulo: 'Bitácora', icon: 'book', color: 'wood', sub: 'Libro de guardia',
  render(p){
    if (!esStaff()) return vacio('lock', 'El libro de guardia es solo para la guardia y la Administración.');
    const filtro = p || 'todo';
    const lista = Store.s.bitacora.filter(b => filtro === 'todo' || b.tipo === filtro).slice(0, 120);
    let dia = '';
    return `<form data-f="bitacora" class="card">
        <div class="seg" style="margin-bottom:10px">${Object.entries(TIPOS_BIT).filter(([k]) => k !== 'acceso').map(([k, t], i) => `<label><input type="radio" name="tipo" value="${k}" ${i === 1 ? 'checked' : ''}><span>${I(t[1])}${t[0]}</span></label>`).join('')}</div>
        <div class="linea-form"><input name="texto" id="bitTxt" required maxlength="300" placeholder="¿Qué pasó?"><button class="btn btn-pri">${I('send')}</button></div>
        <label class="check" style="margin:10px 0 0"><input type="checkbox" name="avisar" ${esAdmin() ? 'checked' : ''}><span>${esAdmin() ? 'Avisarle también a la garita (le suena y le aparece en la campanita)' : 'Avisarle también a la Administración'}</span></label>
        <p class="muted tiny" style="margin:8px 0 0">${I('info')} Lo que se anota acá queda en el <b>libro de guardia</b>: lo leen solo la garita y la Administración, con fecha, hora y quién lo escribió. No lo ven los vecinos y no se puede borrar.</p></form>
      <div class="chips">${['todo', ...Object.keys(TIPOS_BIT)].map(k => `<button class="chip ${filtro === k ? 'on' : ''}" data-a="abrir" data-v="bitacora" data-p="${k}">${k === 'todo' ? 'Todo' : TIPOS_BIT[k][0]}</button>`).join('')}</div>
      <div class="card">${lista.length ? lista.map(b => {
        const d = isoDe(new Date(b.at)); const sep = d !== dia ? (dia = d, `<div class="sec" style="margin:14px 0 4px"><h2>${relDia(d)}</h2></div>`) : '';
        const t = TIPOS_BIT[b.tipo] || TIPOS_BIT.novedad;
        return `${sep}<div class="lista"><div class="it"><span class="ic ic-${t[2]}" style="width:34px;height:34px;border-radius:11px;display:grid;place-items:center">${I(t[1])}</span>
          <div class="txt"><b>${esc(b.texto)}</b><span>${hora(b.at)} · ${esc(autorVisible(b.autor).nombre)}${usuario(b.autor)?.rol === 'guardia' && b.tipo !== 'turno' && guardiasEn(b.at).length ? ' (' + esc(guardiasEn(b.at).join(', ')) + ')' : ''}</span></div></div></div>`; }).join('') : vacio('book', 'Sin registros.')}</div>`;
  },
};
F['bitacora'] = (d, form) => {
  const texto = d.texto.trim(), para = esAdmin() ? 'rol:guardia' : 'rol:admin';
  Store.cambiar(s => {
    s.bitacora.unshift({ id:uid(), autor:yo().id, tipo:d.tipo, texto, at:Date.now() });
    if (d.avisar) notificar(s, { para, titulo:`Libro de guardia · ${(TIPOS_BIT[d.tipo] || TIPOS_BIT.novedad)[0]}`, texto, icon:'book', color: d.tipo === 'incidente' ? 'danger' : 'wood', link:'bitacora', sonido:true, urgente: d.tipo === 'incidente' });
  });
  form.reset(); const i = $('#bitTxt'); if (i) i.value = '';
  toast(d.avisar ? `Anotado en el libro de guardia y avisado a ${esAdmin() ? 'la garita' : 'la Administración'}` : 'Anotado en el libro de guardia', 'book');
};

/* ---------- Páginas públicas: la visita pide su pase / ve su QR ---------- */
function pintarPedirPase(hostId){
  const host = usuario(hostId);
  const miPedido = sessionStorage.getItem('bhc.pedido');
  const r = miPedido && Store.s.solicitudesPase.find(x => x.id === miPedido);
  let panel;
  if (!host) panel = aviso('danger', 'alert', 'Enlace no válido', 'Pedile a quien te invitó que te mande uno nuevo.');
  else if (r && r.estado === 'aprobado'){
    const p = Store.s.pases.find(x => x.id === r.paseId);
    panel = p ? `<div class="ticket" style="color:var(--ink)"><div class="tk-top"><small>Pase aprobado</small><h3>${esc(p.nombre)}</h3><div style="opacity:.85;font-size:13px">${esc(host.casa)} · ${relDia(p.fecha)} · ${p.desde}–${p.hasta}</div></div>
      <div class="bottom"><div class="qr-box" data-qr="BHC:${p.codigo}"></div><div class="codigo-grande">${p.codigo}</div><div class="muted small">Mostralo en la garita</div></div></div>
      <a class="btn btn-sec btn-block" style="margin-top:10px" href="${esc(Store.s.config.mapa)}" target="_blank" rel="noopener">${I('pin')}Cómo llegar</a>` : '';
  } else if (r && r.estado === 'rechazado') panel = aviso('danger', 'x', 'El pedido no fue aprobado', 'Comunicate con quien te invitó.');
  else if (r) panel = aviso('warn latido', 'clock', 'Esperando que te aprueben…', `Le avisamos a ${esc(host.nombre.split(' ')[0])}. Esta pantalla se actualiza sola.`);
  else panel = `<form data-f="pedir-pase" data-host="${esc(hostId)}">
    <p style="margin:0 0 12px">Vas a ver a <b>${esc(host.nombre.split(' ')[0])}</b> (${esc(host.casa)}).</p>
    <div class="field"><label style="color:#fff">Tu nombre</label><input name="nombre" required maxlength="60"></div>
    <div class="grid2"><div class="field"><label style="color:#fff">DNI</label><input name="dni" inputmode="numeric" maxlength="11"></div>
      <div class="field"><label style="color:#fff">Patente</label><input name="patente" maxlength="10" style="text-transform:uppercase"></div></div>
    <div class="grid3"><div class="field"><label style="color:#fff">Día</label><input type="date" name="fecha" value="${hoyISO()}" min="${hoyISO()}" required></div>
      <div class="field"><label style="color:#fff">Llego</label><input type="time" name="desde" required value="18:00"></div>
      <div class="field"><label style="color:#fff">Me voy</label><input type="time" name="hasta" required value="23:00"></div></div>
    <label class="check" style="color:#fff;font-size:12px"><input type="checkbox" required><span>Mis datos se usan solo para el ingreso al barrio y se borran a los ${Store.s.config.datosDias} días (Ley 25.326).</span></label>
    <button class="btn btn-pri btn-block" style="margin-top:8px">${I('send')}Pedir mi pase</button></form>`;
  $('#app').innerHTML = `<section class="bienvenida"><div class="foto" style="background-image:url('${Clima.portada()}')"></div>
    <div class="marca"><span class="logo">${LOGO}</span><div><b style="font-size:16px">Barrio ${esc(Store.s.config.nombre)}</b><div class="tiny" style="opacity:.85">${esc(Store.s.config.ciudad)}</div></div></div>
    <h1 style="font-size:34px">Tu pase de ingreso</h1><div class="panel">${panel}</div></section>`;
  $$('[data-qr]').forEach(el => pintarQR(el, el.dataset.qr));
}
F['pedir-pase'] = (d, form) => {
  const hostId = form.dataset.host, id = uid();
  Store.cambiar(s => {
    s.solicitudesPase.unshift({ id, hostId, nombre:d.nombre.trim(), dni:soloDigitos(d.dni), patente:(d.patente || '').toUpperCase(), fecha:d.fecha, desde:d.desde, hasta:d.hasta, estado:'pendiente', at:Date.now() });
    notificar(s, { para:hostId, titulo:`${d.nombre.trim()} te pide un pase`, texto:`${fechaCorta(d.fecha)} · ${d.desde}`, icon:'qr', color:'sky', urgente:true, link:'visitas' });
  });
  sessionStorage.setItem('bhc.pedido', id);
  pintarPedirPase(hostId);
};
function pintarPaseQR(id){
  const p = Store.s.pases.find(x => x.id === id), u = p && usuario(p.hostId);
  $('#app').innerHTML = `<section class="bienvenida"><div class="foto" style="background-image:url('${Clima.portada()}')"></div>
    <div class="marca"><span class="logo">${LOGO}</span><div><b style="font-size:16px">Barrio ${esc(Store.s.config.nombre)}</b></div></div>
    <div class="panel">${p && !p.cancelado ? `<div class="ticket"><div class="tk-top"><small>Pase de ingreso</small><h3>${esc(p.nombre)}</h3>
      <div style="opacity:.85;font-size:13px">${esc(u?.casa || '')} · ${p.dias?.length ? p.dias.map(d => DIAS[d]).join(' ') : relDia(p.fecha)} · ${p.desde}–${p.hasta}</div></div>
      <div class="bottom"><div class="qr-box" data-qr="BHC:${p.codigo}"></div><div class="codigo-grande">${p.codigo}</div></div></div>
      <a class="btn btn-sec btn-block" style="margin-top:10px" href="${esc(Store.s.config.mapa)}" target="_blank" rel="noopener">${I('pin')}Cómo llegar</a>`
      : aviso('danger', 'x', 'Este pase no existe o fue cancelado', '')}</div></section>`;
  $$('[data-qr]').forEach(el => pintarQR(el, el.dataset.qr));
}
/* La página pública se actualiza sola cuando el vecino aprueba. */
Store.alCambiar(() => { const h = location.hash; if (!yo() && h.startsWith('#/pedir/')) pintarPedirPase(decodeURIComponent(h.slice(8))); });
