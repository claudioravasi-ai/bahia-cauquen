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
        : `<button class="btn btn-sm btn-sec" data-a="ver-pase" data-id="${p.id}">${I('qr')}Ver pase</button>
           <button class="btn btn-sm btn-wa" data-a="compartir-pase" data-id="${p.id}">${I('share')}Enviar</button>
           ${est === 'esperado' || est === 'futuro' ? `<button class="btn btn-sm btn-danger-soft" data-a="cancelar-pase" data-id="${p.id}">${I('x')}</button>` : ''}`}
    </div></div>`;
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
  if (paq.length) out.push(aviso('brand', 'box', `Tenés ${plural(paq.length, 'paquete')} en la garita`, paq.map(p => esc(p.empresa)).join(', ')));
  Clima.alertas().forEach(a => out.push(aviso(a.nivel, a.icon, a.t, a.x)));
  const rec = recoleccionAviso(); if (rec) out.push(rec);
  s.reservas.filter(r => r.userId === u.id && (r.fecha === hoy || r.fecha === sumarDias(hoy, 1)) && !r.cancelada).forEach(r => {
    const a = amenity(r.amenity); if (!a) return;
    out.push(aviso('ok', a.icon, `${r.fecha === hoy ? 'Hoy' : 'Mañana'} tenés el ${a.nombre}`, `${a.franjas[r.franja]?.join(' a ') || ''} h${r.invitados ? ' · ' + plural(+r.invitados, 'invitado') : ''}`));
  });
  const v = s.votaciones.find(v => v.cierra > Date.now() && !(u.casa in v.votos));
  if (v) out.push(aviso('info', 'vote', 'Votación abierta', esc(v.titulo), `<button class="btn btn-xs btn-sec" data-a="abrir" data-v="votaciones">Votar</button>`));
  return out;
}
function recoleccionAviso(){
  const c = Store.s.config, h = new Date(), hoy = h.getDay(), man = (hoy + 1) % 7;
  const vol = volsProximos().find(v => v.fecha === hoyISO() || v.fecha === sumarDias(hoyISO(), 1));
  if (vol) return aviso('warn', 'truck', `${vol.fecha === hoyISO() ? 'Hoy' : 'Mañana'} pasan por los voluminosos`, esc(vol.detalle || c.voluminososDetalle));
  if (c.recoleccion[hoy] && ahoraMin() < minutosDe(c.recoleccionHora)) return aviso('info', 'truck', `Hoy pasa el camión: ${esc(c.recoleccion[hoy])}`, `Alrededor de las ${c.recoleccionHora} h.`);
  if (c.recoleccion[man] && h.getHours() >= 17) return aviso('info', 'truck', `Mañana pasa el camión: ${esc(c.recoleccion[man])}`, 'Sacá la bolsa esta noche, en el canasto cerrado.');
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
   "Tu casa", la foto del barrio para "El barrio" y la bahía de Ushuaia
   (el faro, el crucero, el avión) para "Ushuaia y servicios". Van como
   SVG dentro del código: no pesan, no dependen de internet y se ven
   nítidos en cualquier pantalla.
   Si algún día hay una foto propia para una sección, alcanza con
   ponerla en `foto` (por ejemplo 'img/servicios.jpg').
   ========================================================= */
const ARTE = {
  casa: { svg:`<svg class="arte-svg" viewBox="0 0 400 240" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><linearGradient id="acC" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6fbad6"/><stop offset=".8" stop-color="#d9eff0"/></linearGradient><linearGradient id="acT" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d98a45"/><stop offset="1" stop-color="#a55a26"/></linearGradient></defs><rect width="400" height="240" fill="url(#acC)"/><circle cx="330" cy="52" r="32" fill="#fff6d1" opacity=".35"/><circle cx="330" cy="52" r="19" fill="#fff6d1"/><path d="M-10 150 L60 78 L100 112 L170 48 L235 118 L285 84 L410 160 V240 H-10Z" fill="#5f8fa3"/><path d="M170 48 L150 68 L162 66 L171 76 L181 64 L192 70Z M60 78 L46 92 L57 90 L63 97 L72 89Z M285 84 L272 96 L282 95 L289 101 L297 94Z" fill="#fff"/><path d="M-10 172 Q90 146 200 164 T410 160 V240 H-10Z" fill="#4c8f6e"/><path d="M-10 202 Q140 180 410 198 V240 H-10Z" fill="#2f6e55"/><g fill="#24574a"><path d="M52 202 L70 146 L88 202Z"/><path d="M28 206 L46 164 L64 206Z" opacity=".85"/><path d="M322 200 L342 136 L362 200Z"/><path d="M352 206 L368 160 L384 206Z" opacity=".85"/></g><rect x="236" y="96" width="14" height="36" rx="2" fill="#6b4636"/><g fill="#fff" opacity=".75"><circle cx="243" cy="85" r="6"/><circle cx="252" cy="72" r="8"/><circle cx="264" cy="57" r="10"/></g><rect x="146" y="138" width="112" height="70" fill="url(#acT)"/><path d="M146 152H258M146 166H258M146 180H258M146 194H258" stroke="#7d421b" stroke-opacity=".35" stroke-width="2"/><path d="M132 144 L202 88 L272 144Z" fill="#b23a2e"/><path d="M132 144 L202 88 L272 144" fill="none" stroke="#fff" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"/><circle cx="202" cy="120" r="9" fill="#ffd97a" stroke="#8a4b22" stroke-width="2"/><rect x="158" y="154" width="26" height="22" rx="2" fill="#ffd97a"/><rect x="220" y="154" width="26" height="22" rx="2" fill="#ffd97a"/><path d="M171 154v22M158 165h26M233 154v22M220 165h26" stroke="#8a4b22" stroke-width="2"/><rect x="190" y="166" width="24" height="42" rx="3" fill="#5a331c"/><circle cx="208" cy="188" r="2.2" fill="#f2c14e"/><rect x="140" y="206" width="124" height="5" rx="2" fill="#5b3b2a"/><path d="M194 211 L180 240 H224 L210 211Z" fill="#d9c9a8" opacity=".85"/></svg>` },
  comunidad: { foto:'img/portada-dia.jpg' },
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
        teja({ v:'servicios', icon:'star', color:'wood', t:'Oficios de vecinos', s:'Recomendados por el barrio' }),
        teja({ v:'mascotas', icon:'paw', color:'ok', t:'Mascotas', s:'Perdidas, encontradas y del barrio' }),
        teja({ v:'compras', icon:'cart', color:'brand', t:'Compras conjuntas', s: compras ? `${plural(compras, 'abierta')}` : 'Leña, gas, lo que sea', n: compras || '' }),
        teja({ v:'documentos', icon:'file', color:'brand', t:'Normas y reglamento', s:'Convivencia, obras, actas' }),
        teja({ v:'descargas', icon:'download', color:'sky', t:'Descargas', s:'Apps, instructivos y planillas', n:(s.descargas || []).filter(d => d.url || d.texto).length || '' }),
      ].join('');
    },
  },
  ciudad: {
    titulo:'Ushuaia y servicios', icon:'pin', color:'sky', ancha:true, lema:'Lo de afuera que igual te toca',
    sub:'Lo de afuera del barrio que igual te toca',
    linea(u, s, hoy){
      const cru = s.cruceros.filter(c => c.fecha === hoy).length;
      const v = Vuelos.cuantosHoy();
      const f = proximoFeriado();
      return [cru && `${plural(cru, 'crucero recala', 'cruceros recalan')} hoy`, v && `${v} vuelos hoy`,
        f && `feriado ${relDia(f.fecha)}`].filter(Boolean).join(' · ') || 'Vuelos, residuos, feriados y emergencias';
    },
    tejas(u, s, hoy){
      const prox = proximoFeriado();
      return [
        teja({ v:'agenda', icon:'phone', color:'danger', t:'Emergencias y agenda', s:'Bomberos, policía, hospital', destaca:true }),
        teja({ v:'ushuaia', icon:'pin', color:'sky', t:'Ushuaia', s: prox ? `Próximo feriado: ${relDia(prox.fecha)}` : 'Temporadas, feriados, eventos' }),
        teja({ v:'vuelos', icon:'send', color:'accent', t:'Vuelos USH', s:'Arribos y partidas de hoy', n: Vuelos.cuantosHoy() || '' }),
        teja({ v:'recoleccion', icon:'truck', color:'ok', t:'Residuos', s: proxRecoleccion() }),
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
        ${teja({ v:'cobranzas', icon:'wallet', color:'wood', t:'Expensas y cobranzas', s:'Cupones, pagos, morosos y recibos', badge: s.pagos.filter(x => x.estado === 'informado').length })}
        </div>
        ${sec('Día a día')}<div class="mosaico">
        ${teja({ v:'padron', icon:'users', color:'brand', t:'Padrón', s: s.padron.length ? `${plural(s.padron.length, 'unidad', 'unidades')} · buscá por apellido o lote` : 'Sin cargar' })}
        ${teja({ v:'garita', icon:'gate', color:'brand', t:'Garita', s:'Ingresos de hoy', n: pasesDelDia().length })}
        ${teja({ v:'bitacora', icon:'book', color:'wood', t:'Bitácora', s:'Libro de guardia' })}
        ${teja({ v:'reclamos', icon:'clipboard', color:'warn', t:'Reclamos', s:'Responder y publicar', n: s.reclamos.filter(r => r.estado !== 'resuelto').length || '' })}
        ${teja({ v:'peticiones', icon:'edit', color:'brand', t:'Peticiones', s:'Firmadas a la garita', n: s.peticiones.filter(p => p.estado === 'pendiente').length || '' })}
        ${teja({ v:'infracciones', icon:'alert', color:'danger', t:'Infracciones', s:'Graduales, con descargo', n: s.infracciones.filter(i => i.estado === 'descargo').length || '' })}
        ${teja({ v:'proveedores', icon:'box', color:'accent', t:'Proveedores', s:'ART y seguro al día', n: s.proveedores.filter(p => artEstado(p)[1] !== 'ok').length || '' })}
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
   Todo lo que se anotó para el barrio, lo último primero: los avisos de
   la guardia y de la Administración, los comunicados, las alertas y las
   novedades de los vecinos. Se ven los primeros renglones; al tocar uno se
   lee completo. Lo de compra y venta queda en el pizarrón, para no tapar
   lo importante.
   ========================================================= */
const TIPOS_PIZARRA = ['guardia', 'aviso', 'alerta', 'evento', 'perdido'];
function novedadesDelBarrio(){
  const s = Store.s, hoy = hoyISO();
  const posts = aLista(s.posts).filter(p => p && (TIPOS_PIZARRA.includes(p.type) || usuario(p.autor)?.rol === 'admin'))
    .map(p => ({ tipo:'post', id:p.id, at:p.createdAt, p }));
  const coms = aLista(s.comunicados).filter(c => c && c.para === 'todos' && !c.archivado && (!c.vence || c.vence >= hoy))
    .map(c => ({ tipo:'com', id:c.id, at:c.at, c }));
  return [...posts, ...coms].sort((a, b) => b.at - a.at);
}
const cuandoFue = at => {
  const d = new Date(at), iso = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const h = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  return iso === hoyISO() ? `Hoy ${h}` : iso === sumarDias(hoyISO(), -1) ? `Ayer ${h}` : `${fechaCorta(iso)} ${h}`;
};
function tarjetaNovedad(n, ant){
  const nueva = ant && n.at > ant;
  if (n.tipo === 'com'){
    const c = n.c;
    return `<button class="novedad n-com ${nueva ? 'nueva' : ''}" data-a="ver-novedad" data-v="com" data-id="${esc(c.id)}">
      <span class="nov-cab"><span class="pill p-danger">${I(c.tipo === 'reunion' ? 'calendar' : 'tack')}${c.tipo === 'reunion' ? 'Invitación' : 'Comunicado'}</span><time>${cuandoFue(c.at)}</time></span>
      <b>${esc(c.titulo)}</b><span class="nov-texto">${esc(c.texto || '')}</span>
      <span class="nov-de">Administración</span></button>`;
  }
  const p = n.p, t = TIPOS_POST[p.type] || TIPOS_POST.aviso, a = autorVisible(p.autor);
  return `<button class="novedad n-${esc(p.type)} ${nueva ? 'nueva' : ''}" data-a="ver-novedad" data-v="post" data-id="${esc(p.id)}">
    <span class="nov-cab"><span class="pill p-${t.c}">${I(t.icon)}${t.n}</span>${p.fijado ? `<span class="nov-fijo">${I('tack')}</span>` : ''}<time>${cuandoFue(p.createdAt)}</time></span>
    <b>${esc(p.title)}</b>${p.body ? `<span class="nov-texto">${esc(p.body)}</span>` : ''}
    <span class="nov-de">${esc(a.nombre)}${a.casa && a.casa !== a.nombre ? ' · ' + esc(a.casa) : ''}</span></button>`;
}
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

R.inicio = {
  titulo: 'Inicio', icon: 'home', ancha: true,
  render(){
    const u = yo(), s = Store.s, hoy = hoyISO(), c = Clima.d?.c;
    const hr = new Date().getHours();
    const saludo = hr < 5 ? 'Buenas noches' : hr < 13 ? 'Buen día' : hr < 20 ? 'Buenas tardes' : 'Buenas noches';
    const [desc] = c ? Clima.cod(c.weather_code) : [''];
    const sol = Clima.sol();
    const hero = `<div class="hero"><div class="foto" style="background-image:url('${Clima.portada()}')"></div>
      <div class="saludo">${saludo},</div>
      <h1>${esc(u.rol === 'vecino' ? u.nombre.split(' ')[0] : u.nombre)}</h1>
      <div class="sub">${esc(u.casa)} · ${fechaLarga(hoy)}</div>
      ${c ? `<div class="clima"><div class="temp">${Math.round(c.temperature_2m)}<small>°C</small></div>
        <div class="desc"><b>${desc}</b>Sensación ${Math.round(c.apparent_temperature)}°</div></div>
        <div class="clima-datos"><span>${I('wind')}${Clima.rumbo(c.wind_direction_10m)} ${Math.round(c.wind_speed_10m)} km/h</span>
          <span>${I('zap')}Ráfagas ${Math.round(c.wind_gusts_10m)}</span>
          <span>${I('sunrise')}${sol.sale}</span><span>${I('sunset')}${sol.pone}</span></div>`
        : `<div class="clima-datos" style="margin-top:14px"><span>${I('cloud')}Cargando el clima de Ushuaia…</span></div>`}
    </div>`;

    const pron = Clima.d?.dd ? `<div class="pronostico">${[1,2,3].map(i => {
      const dd = Clima.d.dd; if (!dd.time[i]) return '';
      const [, ic] = Clima.cod(dd.weather_code[i]);
      return `<div><b>${i === 1 ? 'Mañana' : DIAS[fechaDe(dd.time[i]).getDay()]}</b>${I(ic)}
        <div class="t">${Math.round(dd.temperature_2m_max[i])}° <span>${Math.round(dd.temperature_2m_min[i])}°</span></div>
        <div class="v">${dd.snowfall_sum[i] >= 1 ? `❄ ${Math.round(dd.snowfall_sum[i])} cm` : `ráf. ${Math.round(dd.wind_gusts_10m_max[i])}`}</div></div>`; }).join('')}</div>`
      : `<div class="card muted small">${I('cloud')} Cargando el pronóstico…</div>`;

    /* Lo que te pide algo a vos (alguien en la garita, un paquete, tu
       propia alerta) va arriba de la pizarra, y sólo si hay algo. */
    const urg = urgentesVecino();
    const paraVos = urg.length ? `<div class="para-vos">${urg.join('')}</div>` : '';

    const ant = Store.sesion.visitaAnterior || 0;
    const nov = novedadesDelBarrio();
    const nuevas = ant ? nov.filter(n => n.at > ant).length : 0;
    const pizarra = nov.length
      ? `<div class="pizarra">${nov.slice(0, 6).map(n => tarjetaNovedad(n, ant)).join('')}</div>`
      : vacio('muro', 'Todavía no hay novedades para el barrio.');

    const puertas = ['casa', 'comunidad', 'ciudad', ...(esAdmin() ? ['gestion'] : [])]
      .map(k => puerta(k, u, s, hoy)).join('');

    /* =========================================================
       LA PORTADA, DE ARRIBA ABAJO
         1. el saludo y el tiempo de ahora (hero),
         2. los próximos días y la luz del día,
         3. las propuestas del Hotel Los Cauquenes,
         4. la pizarra del día: lo último del barrio primero,
         5. Ushuaia hoy,
         6. por dónde seguir: tres ventanas ilustradas.
       Cada bloque ocupa el ancho entero y reparte su contenido en su
       propia grilla: en el teléfono se apila y en la computadora se abre.
       ========================================================= */
    return `${hero}
      <div class="inicio-lienzo">
        <section class="bloque dia-y-luz">
          <div>${sec('Próximos días')}${pron}</div>
          <div>${sec('Luz del día')}${barraLuz(sol)}</div>
        </section>
        <section class="bloque">${tiraPromos()}</section>
        <section class="bloque">${sec('Pizarra del día', `<span class="sec-extra">${nuevas ? `<span class="pill p-brand">${plural(nuevas, 'nueva', 'nuevas')}</span>` : ''}<button class="link" data-a="abrir" data-v="pizarron">Ver todo</button></span>`)}
          ${paraVos}${pizarra}</section>
        <section class="bloque">${ushuaiaHoy()}</section>
        <section class="bloque">${sec('Por dónde seguir')}<div class="puertas-arte">${puertas}</div></section>
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
  const cru = s.cruceros.filter(c => c.fecha === hoy), cruMan = s.cruceros.filter(c => c.fecha === sumarDias(hoy, 1));
  if (cru.length) partes.unshift(chip('send', `Hoy recala ${esc(cru[0].barco)}`, `${cru.length > 1 ? `y ${cru.length - 1} más · ` : ''}${cru[0].llega ? cru[0].llega + ' h' : ''}${cru[0].pasajeros ? ' · ' + cru[0].pasajeros + ' pasajeros' : ''}`, true));
  else if (cruMan.length) partes.unshift(chip('send', `Mañana recala ${esc(cruMan[0].barco)}`, cruMan[0].llega ? cruMan[0].llega + ' h' : '', false));
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
    const mios = s.pases.filter(p => p.hostId === u.id && !p.cancelado);
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
R.garita = {
  titulo: 'Garita', icon: 'gate', color: 'brand', ancha: true, sub: () => fechaLarga(hoyISO()),
  render(){
    if (!esStaff()) return vacio('lock', 'La garita es solo para la guardia y la Administración.');
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
      ${PILA.length === 1 ? `<div class="titulo-vista" style="margin-top:16px"><h1>Garita</h1><p>${esc(u.nombre)} · ${fechaLarga(hoy)}</p></div>` : ''}
      ${Clima.alertas().map(a => aviso(a.nivel, a.icon, a.t, a.x)).join('')}
      <div class="garita-kpis"><div class="kpi"><b>${esperados}</b><span>Esperados</span></div><div class="kpi"><b>${adentro}</b><span>Adentro</span></div><div class="kpi"><b>${paq.length}</b><span>Paquetes</span></div></div>
      <form data-f="validar" class="card">
        <div class="lbl">Código, patente o DNI</div>
        <div class="validador"><input name="q" id="qValidar" autocomplete="off" placeholder="482913" maxlength="12" inputmode="text">
          <button class="btn btn-pri">${I('search')}</button></div>
        <div class="btns" style="margin-top:10px"><button type="button" class="btn btn-sm btn-sec" data-a="escanear">${I('scan')}Escanear QR</button>
          <button type="button" class="btn btn-sm btn-sec" data-a="llegada-nueva">${I('gate')}Llegó sin aviso</button>
          <button type="button" class="btn btn-sm btn-sec" data-a="paquete-nuevo">${I('box')}Llegó un paquete</button></div>
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
        ${teja({ v:'privado', icon:'lock', color:'accent', t:'Mensajes con vecinos', s:'Avisar algo a un lote', badge: s.privados.filter(h => (h.con || 'admin') === 'guardia').reduce((n, h) => n + h.msgs.filter(m => m.from === 'vecino' && !m.leido).length, 0) })}
        ${teja({ v:'proveedores', icon:'box', color:'accent', t:'Proveedores', s:'Controlar ART', n: s.proveedores.filter(p => artEstado(p)[1] === 'danger').length || '' })}
        ${teja({ v:'obras', icon:'wrench', color:'wood', t:'Obras', s:'Avisos del día' })}
        ${teja({ v:'chat', icon:'chat', color:'sky', t:'Chat vecinal', s:'#seguridad y más' })}
        ${teja({ v:'vuelos', icon:'send', color:'accent', t:'Vuelos USH', s:'Arribos y partidas' })}
        ${teja({ v:'agenda', icon:'phone', color:'danger', t:'Emergencias', s:'Teléfonos útiles' })}
        ${teja({ a:'salir', icon:'logout', color:'warn', t:'Cerrar sesión', s:'Cambio de turno' })}</div>` : ''}`;
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
A['paquete-nuevo'] = () => hoja('Llegó un paquete', `<form data-f="paquete">
  <div class="field"><label>¿Para qué casa?</label><select name="hostId" required>${opcionesCasas()}</select></div>
  <div class="grid2"><div class="field"><label>Empresa</label><input name="empresa" required maxlength="40" list="empresas" placeholder="Mercado Libre"></div>
    <div class="field"><label>Detalle</label><input name="detalle" maxlength="60" placeholder="Caja chica"></div></div>
  <datalist id="empresas"><option>Mercado Libre</option><option>Correo Argentino</option><option>Andreani</option><option>OCA</option><option>DHL</option><option>Via Cargo</option></datalist>
  <button class="btn btn-pri btn-block">${I('box')}Guardar y avisar</button></form>`);
F['paquete'] = d => {
  Store.cambiar(s => { s.paquetes.unshift({ id:uid(), hostId:d.hostId, empresa:d.empresa, detalle:d.detalle, recibido:Date.now(), retirado:null });
    notificar(s, { para:d.hostId, titulo:'Tenés un paquete en la garita', texto:`${d.empresa}${d.detalle ? ' · ' + d.detalle : ''}`, icon:'box', color:'wood' }); });
  cerrarHoja(); toast('Paquete guardado. El vecino ya sabe.', 'box');
};
A['paquete-entregado'] = el => Store.cambiar(s => { const p = s.paquetes.find(x => x.id === el.dataset.id); if (p) p.retirado = Date.now(); });
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
        <div class="linea-form"><input name="texto" id="bitTxt" required maxlength="300" placeholder="¿Qué pasó?"><button class="btn btn-pri">${I('send')}</button></div></form>
      <div class="chips">${['todo', ...Object.keys(TIPOS_BIT)].map(k => `<button class="chip ${filtro === k ? 'on' : ''}" data-a="abrir" data-v="bitacora" data-p="${k}">${k === 'todo' ? 'Todo' : TIPOS_BIT[k][0]}</button>`).join('')}</div>
      <div class="card">${lista.length ? lista.map(b => {
        const d = isoDe(new Date(b.at)); const sep = d !== dia ? (dia = d, `<div class="sec" style="margin:14px 0 4px"><h2>${relDia(d)}</h2></div>`) : '';
        const t = TIPOS_BIT[b.tipo] || TIPOS_BIT.novedad;
        return `${sep}<div class="lista"><div class="it"><span class="ic ic-${t[2]}" style="width:34px;height:34px;border-radius:11px;display:grid;place-items:center">${I(t[1])}</span>
          <div class="txt"><b>${esc(b.texto)}</b><span>${hora(b.at)} · ${esc(autorVisible(b.autor).nombre)}</span></div></div></div>`; }).join('') : vacio('book', 'Sin registros.')}</div>`;
  },
};
F['bitacora'] = (d, form) => { Store.cambiar(s => s.bitacora.unshift({ id:uid(), autor:yo().id, tipo:d.tipo, texto:d.texto.trim(), at:Date.now() })); form.reset(); const i = $('#bitTxt'); if (i) i.value = ''; toast('Anotado', 'book'); };

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
