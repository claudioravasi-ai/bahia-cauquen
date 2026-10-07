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
  remis:     { n:'Uber, DiDi o taxi', icon:'car', c:'warn' },
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
  return `¡Hola${p.nombre ? ' ' + p.nombre.split(' ')[0] : ''}! ${p.autoriza || u.nombre || 'Un vecino'} (${u.casa || ''}) te autorizó a entrar al barrio ${c.nombre}.\n\n` +
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
      <span>${garita ? `<b style="display:inline;color:var(--ink)">${esc(host.casa || '')}</b> · ` : ''}${t.n} · ${franja}${p.patente ? ' · ' + esc(p.patente) : p.app ? ' · <b>patente a confirmar</b>' : ''}${p.app && p.nota ? ' · ' + esc(p.nota.toLowerCase()) : ''}</span>
      ${garita ? `<span class="autoriza">${I('check')}Autorizó: <b>${esc(p.autoriza || host.nombre || 'vecino')}</b>${host.casa ? ' · ' + esc(host.casa) : ''}</span>` : ''}</div>
    <span class="estado e-${est}">${ESTADO_TXT[est]}</span></div>
    <div class="btns" style="margin-top:10px">
      ${garita ? (!esGuardia() ? '' : est === 'esperado' ? `<button class="btn btn-sm btn-ok" data-a="pase-in" data-id="${p.id}">${I('login')}Ingresó</button>`
        /* PASE VENCIDO (pedido de Claudio, 26-09): pasada la hora, "Ingresó"
           queda deshabilitado y la garita tiene "Pase vencido", que le avisa
           al vecino que lo autorizó (y, si la persona está en la garita, le
           pregunta si la deja pasar). */
        : est === 'vencido' ? `<button class="btn btn-sm btn-sec" disabled title="El pase venció: no se puede registrar el ingreso">${I('login')}Ingresó</button>
          <button class="btn btn-sm btn-danger-soft" data-a="pase-vencido" data-id="${p.id}">${I('clock')}Pase vencido</button>
          ${p.vencidoAviso && p.vencidoAviso.fecha === hoyISO() ? `<span class="pill p-warn">Avisado al vecino ${hora(p.vencidoAviso.at)} h</span>` : ''}` : est === 'adentro' ? `<button class="btn btn-sm btn-sec" data-a="pase-out" data-id="${p.id}">${I('logout')}Salió</button>` : '')
        : `${p.app && (est === 'esperado' || est === 'adentro') ? `<button class="btn btn-sm ${p.patente ? 'btn-sec' : 'btn-pri'}" data-a="pase-app-patente" data-id="${p.id}">${I('car')}${p.patente ? 'Cambiar la patente' : 'Agregar la patente'}</button>`
           : est === 'esperado' || est === 'futuro' || est === 'adentro' ? `<button class="btn btn-sm btn-sec" data-a="ver-pase" data-id="${p.id}">${I('qr')}Ver pase</button>
           <button class="btn btn-sm btn-wa" data-a="compartir-pase" data-id="${p.id}">${I('share')}Enviar</button>` : ''}
           <button class="btn btn-sm btn-sec" data-a="editar-pase" data-id="${p.id}" title="Editar">${I('edit')}Editar</button>
           ${est === 'esperado' || est === 'futuro' ? `<button class="btn btn-sm btn-danger-soft" data-a="cancelar-pase" data-id="${p.id}" title="Cancelar el pase">${I('x')}</button>` : ''}
           <button class="btn btn-sm btn-danger-soft" data-a="borrar-pase" data-id="${p.id}" title="Borrar de mi lista">${I('trash')}</button>`}
    </div>${garita && p.borrado ? `<div class="muted tiny" style="margin-top:6px">${I('trash')} El vecino la sacó de su lista ${hace(p.borrado.at)} · queda en el historial</div>` : ''}${p.editado ? `<div class="muted tiny" style="margin-top:6px">${I('edit')} Editada ${hace(p.editado.at)}</div>` : ''}</div>`;
}

/* ---------- avisos urgentes del inicio ---------- */
function urgentesVecino(){
  const u = yo(), s = Store.s, out = [], hoy = hoyISO();
  const deaMio = typeof Dea !== 'undefined' ? Dea.mio() : null;
  if (deaMio) out.push(aviso(deaMio.estado === 'en_camino' ? 'ok' : 'danger latido', 'heart', deaMio.estado === 'en_camino' ? 'El DEA va en camino' : 'Tu pedido del DEA está en la garita',
    deaMio.estado === 'en_camino' ? 'La garita salió con el desfibrilador.' : 'Esperando que salgan con el DEA. Llamá al 911.', `<button class="btn btn-xs btn-sec" data-a="dea-listo" data-id="${deaMio.id}">Ya no hace falta</button>`));
  s.sos.filter(x => x.userId === u.id && x.estado !== 'resuelta' && x.tipo !== 'dea').forEach(x => out.push(aviso('danger latido', 'siren',
    x.estado === 'en_camino' ? `La guardia va en camino (${nombreDe(x.atiende)})` : x.estado === 'atendida' ? 'La guardia dio por atendida tu alerta' : 'Tu alerta SOS está activa',
    x.estado === 'atendida' ? 'Si ya está todo bien, confirmalo para que se cierre en todo el barrio.' : 'La guardia, la Administración y los vecinos ya fueron avisados.',
    `<button class="btn btn-xs btn-ok" data-a="sos-cancelar" data-id="${x.id}">${I('check')}Ya está solucionado</button>`)));
  s.llegadas.filter(l => l.hostId === u.id && l.estado === 'consultando').forEach(l => out.push(aviso('warn latido', 'gate',
    `En la garita: ${esc(l.nombre)} pregunta por vos`, `${esc(l.motivo || 'Sin aviso previo')}${l.patente ? ' · ' + esc(l.patente) : ''} · ${hace(l.at)}`,
    `<button class="btn btn-xs btn-ok" data-a="llegada-si" data-id="${l.id}">${I('check')}Que pase</button><button class="btn btn-xs btn-danger-soft" data-a="llegada-no" data-id="${l.id}">No lo conozco</button>`)));
  s.solicitudesPase.filter(r => r.hostId === u.id && r.estado === 'pendiente').forEach(r => out.push(aviso('info', 'qr',
    `${esc(r.nombre)} te pide un pase`, `${fechaCorta(r.fecha)} · ${r.desde}${r.patente ? ' · ' + esc(r.patente) : ''}`,
    `<button class="btn btn-xs btn-ok" data-a="sol-pase-si" data-id="${r.id}">${I('check')}Aprobar</button><button class="btn btn-xs btn-sec" data-a="sol-pase-no" data-id="${r.id}">Rechazar</button>`)));
  const paq = hayPaquetes() ? paquetesDelLote(u).filter(p => !p.retirado) : [];
  if (paq.length) out.push(aviso('brand', 'box', `${paq.length > 1 ? 'Hay ' + paq.length + ' paquetes' : 'Hay un paquete'} de ${esc(u.casa)} en la garita`, paq.map(p => esc(p.empresa) + (p.hostId !== u.id ? ' (para ' + esc(nombreDe(p.hostId).split(' ')[0]) + ')' : '')).join(', '),
    `<button class="btn btn-xs btn-pri" data-a="retiro-qr">${I('qr')}Mi QR para retirar</button><button class="btn btn-xs btn-sec" data-a="abrir" data-v="mis-paquetes">Ver</button>`));

  if (typeof alertasParaMi === 'function') alertasParaMi().filter(a => !respuestaDe(a)).forEach(a => out.push(aviso('danger latido', 'siren', `Aviso urgente: ${esc(a.titulo)}`, esc(a.zona),
    `<button class="btn btn-xs btn-ok" data-a="alerta-responder" data-id="${a.id}" data-v="ok">Recibido</button><button class="btn btn-xs btn-danger-soft" data-a="alerta-responder" data-id="${a.id}" data-v="ayuda">Necesito ayuda</button>`)));
  const v = s.votaciones.find(v => v.cierra > Date.now() && !(u.casa in v.votos));
  if (v) out.push(aviso('info', 'vote', 'Votación abierta', esc(v.titulo), `<button class="btn btn-xs btn-sec" data-a="abrir" data-v="votaciones">Votar</button>`));
  return out;
}
/* El último viaje del camión que la garita registró hoy (o null). */
function camionPasoHoy(){
  const l = typeof Camion !== 'undefined' ? Camion.lista() : [];
  return l.find(v => v.entra && isoDe(new Date(v.entra)) === hoyISO()) || null;
}
/* Un aviso del camión que ya quedó viejo: el recordatorio ("mañana pasa",
   "hoy pasa") cuando después entró el camión. El "entró el camión" no va
   en la pizarra: mientras está adentro ya está el renglón en vivo, y cuando
   la garita marca la salida desaparece con él. (Sigue en la campanita.) */
function avisoCamionViejo(n){
  if (!n || String(n.link || '').split(':')[0] !== 'recoleccion') return false;
  const l = typeof Camion !== 'undefined' ? Camion.lista() : [];
  if (n.icon === 'tacho') return true;
  return /cami[oó]n|voluminosos/i.test(n.titulo || '') && l.some(v => v.entra && v.entra > n.at);
}
function recoleccionHoy(){
  const c = Store.s.config, dias = recoleccionDias(), h = new Date(), hoy = h.getDay(), man = (hoy + 1) % 7;
  const vol = volsProximos().find(v => v.fecha === hoyISO() || v.fecha === sumarDias(hoyISO(), 1));
  if (vol) return anuncioCamion(vol.fecha === hoyISO() ? 'Hoy' : 'Mañana', 'Voluminosos', vol.detalle);
  /* El día que pasa, TODO el día hasta que la garita registra la entrada:
     desde ahí el "Hoy pasa…" se va de la pizarra (mientras está adentro se
     ve el aviso en vivo, y cuando sale ya pasó). */
  if (dias[hoy] && !camionPasoHoy()) return anuncioCamion('Hoy', dias[hoy]);
  if (dias[hoy]) return null;
  /* La víspera de un día con camión, todo el día: "Mañana pasa el camión
     de basura". Si mañana no hay camión, no se dice nada. */
  if (dias[man]) return anuncioCamion('Mañana', dias[man]);
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
    sub:'Visitas, emergencias, mensajes y los datos de tu lote',
    /* Si está de salida (Salidas seguras), el "Volví" va arriba de todo
       también acá, además de la portada y de la ventana de la salida. */
    arriba(u){ const x = typeof Cuidado !== 'undefined' ? Cuidado.mio() : null; return x && x.salida && !x.salida.volvio && typeof tarjetaSalidaMia === 'function' ? tarjetaSalidaMia(x) : ''; },
    linea(u, s, hoy){
      const v = s.pases.filter(p => p.hostId === u.id && paseValidoEn(p, hoy)).length;
      const m = s.privados.filter(h => h.userId === u.id).reduce((n, h) => n + h.msgs.filter(x => x.from !== 'vecino' && !x.leido).length, 0) + dmNoLeidos();
      return [v && `${plural(v, 'visita esperada', 'visitas esperadas')} hoy`, m && `${plural(m, 'mensaje sin leer', 'mensajes sin leer')}`].filter(Boolean).join(' · ') || 'Todo en orden en tu lote';
    },
    /* Sin "Reservas" (29-09-2026, pedido de Claudio): el barrio todavía no
       tiene quincho, SUM, cancha ni pileta; no hay nada que reservar. */
    tejas(u, s, hoy){
      const misHoy = s.pases.filter(p => p.hostId === u.id && paseValidoEn(p, hoy));
      const privNoLeidos = s.privados.filter(h => h.userId === u.id).reduce((n, h) => n + h.msgs.filter(m => m.from !== 'vecino' && !m.leido).length, 0);
      return [
        teja({ a:'nuevo-pase', icon:'qr', t:'Autorizar una visita', s:'Visita, delivery, obra, personal o Uber/DiDi', destaca:true }),
        /* Emergencias vive en Tu casa desde el 30-09-2026 (pedido de Claudio): en
           Ushuaia y servicios quedaba perdida. */
        teja({ v:'emergencias', icon:'siren', color:'danger', t:'Emergencias', s:'911 · 107 · DEA · SOS de hoy · hospitales · farmacias' }),
        teja({ v:'visitas', icon:'users', color:'sky', t:'Mis visitas', s: misHoy.length ? `${plural(misHoy.length, 'esperada')} hoy` : 'Nadie anunciado hoy', n: misHoy.length || '' }),
        ...(!hayPaquetes() ? [] : [teja({ v:'mis-paquetes', icon:'box', color:'wood', t:'Mis paquetes', s:(() => { const n = paquetesDelLote(u).filter(p => !p.retirado).length; return n ? `${plural(n, 'paquete')} de tu lote en la garita` : 'Lo que llega a la garita para tu lote'; })(), badge: paquetesDelLote(u).filter(p => !p.retirado).length })]),
        teja({ v:'mensajes', icon:'chat', color:'accent', t:'Mensajes', s:'Privados con vecinos y la Administración', badge: privNoLeidos + dmNoLeidos() }),
        teja({ v:'expensas', icon:'wallet', color:'wood', t:'Mis expensas', s:`Tu cuenta, cupones y pagos` }),
        teja({ v:'sismo', icon:'sismo', color:'warn', t:'Preparados para un sismo', s:(() => { const ok = typeof revisionSemanalHecha === 'function' && tengoLote() ? revisionSemanalHecha() : true; return ok ? 'Mochila, plan familiar y qué hacer' : 'Falta la revisión de esta semana'; })() }),
        teja({ v:'salidas', icon:'pin', color:'sky', t:'Salidas seguras', s:(() => { const x = typeof Cuidado !== 'undefined' ? Cuidado.mio() : null, sa = x && x.salida && !x.salida.volvio ? x.salida : null;
          return sa ? `Estás de salida · al volver, tocá "Volví"` : 'Kayak, montaña y navegación: aviso de salida'; })(), badge:(() => { const x = typeof Cuidado !== 'undefined' ? Cuidado.mio() : null; return x && x.salida && !x.salida.volvio ? 1 : 0; })() }),
        teja({ v:'estoy-bien', icon:'heart', color:'ok', t:'Estoy bien', s:(() => { const x = typeof Cuidado !== 'undefined' ? Cuidado.mio() : null, d = x && x.activo ? Cuidado.estadoDiario(x) : null;
          return !d ? 'Un toque por día, para quien vive solo' : d.estado === 'ok' ? `Hoy avisaste a las ${hora(x.ultimo)}` : d.estado === 'pausa' ? 'En pausa' : 'Todavía no avisaste hoy'; })(),
          badge:(typeof Cuidado !== 'undefined' ? Cuidado.personas().filter(p => Cuidado.enAlerta(p) || (p.contactos[u.id] && !p.contactos[u.id].acepta)).length : 0) }),
        ...((m => m >= 10 || m <= 3)(new Date().getMonth() + 1) ? [teja({ v:'verano', icon:'sun', color:'ok', t:'Tu casa en verano', s:(() => { const n = typeof tareasVeranoQueTocan === 'function' ? tareasVeranoQueTocan().length : 0; return n ? `${plural(n, 'cosa para hacer', 'cosas para hacer')}` : 'Pasto, vereda, basura, viento y fuego'; })() }), teja({ v:'invierno', icon:'flame', color:'warn', t:'Tu casa en invierno', s:(() => { const n = typeof tareasQueTocan === 'function' ? tareasQueTocan().length : 0; return n ? `${plural(n, 'cosa para revisar', 'cosas para revisar')}` : 'Gas, monóxido, chimenea y caños'; })() })] : [teja({ v:'invierno', icon:'flame', color:'warn', t:'Tu casa en invierno', s:(() => { const n = typeof tareasQueTocan === 'function' ? tareasQueTocan().length : 0; return n ? `${plural(n, 'cosa para revisar', 'cosas para revisar')}` : 'Gas, monóxido, chimenea y caños'; })() }), teja({ v:'verano', icon:'sun', color:'ok', t:'Tu casa en verano', s:(() => { const n = typeof tareasVeranoQueTocan === 'function' ? tareasVeranoQueTocan().length : 0; return n ? `${plural(n, 'cosa para hacer', 'cosas para hacer')}` : 'Pasto, vereda, basura, viento y fuego'; })() })]),
        teja({ v:'peticiones', icon:'edit', color:'brand', t:'Peticiones a la garita', s:'Firmadas por vos y la guardia', n: s.peticiones.filter(p => p.userId === u.id && p.estado !== 'cerrada').length || '' }),
        teja({ v:'reclamos', icon:'clipboard', color:'warn', t:'Mis reclamos', s:'Privados con la Administración', n: s.reclamos.filter(r => r.userId === u.id && r.estado !== 'resuelto').length || '' }),
        teja({ v:'perfil', icon:'home', color:'ok', t:'Mi casa', s:'Quiénes están en tu lote, autos y mascotas' }),
        teja({ a:'mi-credencial', icon:'qr', color:'brand', t:'Mi credencial', s:'Tu QR para que la garita te reconozca sin mostrar el DNI' }),
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
      return [piz && `${plural(piz, 'novedad', 'novedades')} en el pizarrón`, vot && `${plural(vot, 'votación abierta', 'votaciones abiertas')}`].filter(Boolean).join(' · ') || 'Pizarrón, vecinos y votaciones';
    },
    /* Sin "Chat vecinal" (29-09-2026, pedido de Claudio): a los vecinos no les
       gustaba, se prestaba a diálogos no deseados. Lo público entre vecinos
       queda en el pizarrón; lo personal, en los mensajes privados. */
    tejas(u, s, hoy){
      const pizNuevas = s.posts.filter(p => p.createdAt > (Store.sesion.pizarronVisto || 0) && p.autor !== u.id).length;
      const votAbiertas = s.votaciones.filter(v => v.cierra > Date.now()).length;
      const compras = s.compras.filter(x => x.cierra > Date.now()).length;
      return [
        teja({ v:'pizarron', icon:'muro', t:'Pizarrón', s:'Guardia, Administración y vecinos', badge: pizNuevas, destaca:true }),
        teja({ v:'manual', icon:'book', color:'accent', t:'Manual y normas', s:'Cómo usar la app · reglamento, convivencia y protocolos' }),
        teja({ v:'vecinos', icon:'users', color:'sky', t:'Vecinos', s:'Buscá por nombre, oficio o dirección' }),
        teja({ v:'votaciones', icon:'vote', color:'accent', t:'Votaciones', s: votAbiertas ? `${plural(votAbiertas, 'abierta')}` : 'Sin votaciones abiertas', n: votAbiertas || '' }),
        teja({ v:'obras', icon:'wrench', color:'wood', t:'Obras', s:(() => { const h = s.obras.filter(o => o.avisoHoy?.fecha === hoy).length; return h ? `${plural(h, 'aviso')} para hoy` : `${plural(s.obras.filter(o => o.estado === 'activa').length, 'en curso', 'en curso')}`; })(), n: s.obras.filter(o => o.estado === 'activa').length || '' }),
        teja({ v:'viajes', icon:'car', color:'sky', t:'Viajes compartidos', s:'Centro, escuela, aeropuerto', n: s.viajes.filter(v => v.fecha >= hoy).length || '' }),
        teja({ v:'servicios', icon:'star', color:'wood', t:'Profesionales y oficios', s:'Vecinos que se pueden contactar' }),
        teja({ v:'mascotas', icon:'paw', color:'ok', t:'Mascotas', s:'Perdidas, encontradas y del barrio' }),
        teja({ v:'compras', icon:'cart', color:'brand', t:'Compras conjuntas', s: compras ? `${plural(compras, 'abierta')}` : 'Leña, gas, lo que sea', n: compras || '' }),
        teja({ v:'cosas', icon:'box', color:'wood', t:'Cosas para prestar', s:(() => { const n = aLista(s.cosas).filter(x => x.userId !== u.id && x.estado === 'disponible').length; return n ? `${plural(n, 'cosa disponible', 'cosas disponibles')}` : 'Escalera, hidrolavadora, generador…'; })() }),
        teja({ v:'nieve', icon:'snow', color:'sky', t:'Ángeles de la nieve', s:(() => { const n = aLista(s.nieve).filter(x => x.tipo === 'ayuda' && x.activo !== false && !x.angel).length; return n ? `${plural(n, 'casa espera', 'casas esperan')} un ángel` : 'Despejar la entrada de quien no puede'; })() }),
        teja({ v:'tablero', icon:'wallet', color:'wood', t:'Las cuentas del barrio', s:'En qué se gasta, mes a mes, y la morosidad (sin nombres)' }),
        teja({ v:'recoleccion', icon:'truck', color:'ok', t:'Residuos', s: proxRecoleccion() }),
        teja({ v:'descargas', icon:'download', color:'sky', t:'Descargas', s:'Apps, instructivos y planillas', n:descargasVisibles().filter(d => (d.url || d.texto) && !esNormaDescarga(d)).length || '' }),
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
        f && `feriado ${relDia(f.fecha)}`].filter(Boolean).join(' · ') || 'Agenda, vuelos, cruceros, feriados y sismos';
    },
    tejas(u, s, hoy){
      const prox = proximoFeriado();
      return [
        teja({ v:'agenda', icon:'book', color:'sky', t:'Agenda de Ushuaia', s:'Comidas, taxis, súper y más', destaca:true }),
        teja({ v:'cruceros', icon:'send', color:'brand', t:'Cruceros', s: Cruceros.linea(), n: Cruceros.hoy().length || '' }),
        teja({ v:'ushuaia', icon:'pin', color:'sky', t:'Ushuaia hoy', s: prox ? `Próximo feriado: ${relDia(prox.fecha)}` : 'Temporadas, feriados, eventos' }),
        teja({ v:'vuelos', icon:'send', color:'accent', t:'Vuelos USH', s:'Arribos y partidas de hoy', n: Vuelos.cuantosHoy() || '' }),
        teja({ v:'municipio', icon:'pin', color:'sky', t:'Municipalidad de Ushuaia', s:'Trámites, reclamos urbanos, turnos' }),
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
      const pagos = s.pagos.filter(x => x.estado === 'informado' && !esPagoMP(x)).length;
      const recl = s.reclamos.filter(r => r.estado !== 'resuelto').length;
      return [pend && `${plural(pend, 'inscripción', 'inscripciones')}`, pagos && `${plural(pagos, 'pago informado', 'pagos informados')}`,
        recl && `${plural(recl, 'reclamo abierto', 'reclamos abiertos')}`].filter(Boolean).join(' · ') || 'Todo al día';
    },
    tejas(u, s){
      const pend = s.users.filter(x => x.estado === 'pendiente').length;
      return `<p class="muted small" style="margin:0 0 14px">Las facturas del mes se cargan y se corrigen en <b>Contabilidad</b>; al cerrar el mes se arman los cupones. <b>Expensas</b> muestra el resultado lote por lote y es donde se cobra: pagos, recibos y morosos.</p>
        <div class="mosaico">
        ${teja({ v:'admin', icon:'sliders', color:'accent', t:'Administración', s:'Inscripciones, vecinos, contenido y ajustes', badge: pend, destaca:true })}
        ${teja({ v:'contabilidad', icon:'file', color:'brand', t:'Contabilidad', s:'Facturas y gastos del mes, cierre, libro y ARCA' })}
        ${teja({ v:'cobranzas', icon:'wallet', color:'wood', t:'Expensas', s:'Cupones, cobros, por acreditar, morosos y recibos', badge: s.pagos.filter(x => x.estado === 'informado' && !esPagoMP(x)).length })}

        </div>
        ${diaADia(u, s)}`;
    },
  },
};
/* =========================================================
   EL DÍA A DÍA DE LA ADMINISTRACIÓN, POR SALAS (pedido de Claudio, 26-09)
   Antes eran dieciséis tejas sueltas, todas iguales, y había que leerlas
   una por una para encontrar algo. Ahora se ordenan por a quién le toca:
     · GARITA Y SEGURIDAD: lo que pasa en la entrada y la guardia;
     · VECINOS: las personas, sus mensajes, reclamos, votos y obras;
     · COMUNICACIÓN: lo que la Administración le dice a todo el barrio;
     · PROVEEDORES Y CUMPLIMIENTO: papeles al día (ART, seguros, datos).
   Cada sala tiene su color, una línea viva de lo que está pasando y, si
   hay algo que pide atención, el número arriba a la derecha. Adentro, cada
   renglón es una ventana. Se sacaron "Conectados ahora" y "Peticiones"
   (las peticiones quedan dentro de "Mensajes con la garita").
   ========================================================= */
function diaADia(u, s){
  const t = turnoAbierto(), hoy = hoyISO();
  const sinLeer = (h, yoSoy) => aLista(h && h.msgs).filter(m => m && m.from !== yoSoy && !m.leido).length;
  const msgVecinos = aLista(s.privados).filter(h => h && h.con !== 'guardia' && h.con !== 'interno' && h.con !== 'supAdmin' && h.con !== 'supGarita').reduce((a, h) => a + sinLeer(h, 'admin'), 0);
  const msgGarita = aLista(s.privados).filter(h => h && h.con === 'interno').reduce((a, h) => a + sinLeer(h, 'admin'), 0);
  const petPend = s.peticiones.filter(p => p.estado === 'pendiente').length;
  const reclamos = s.reclamos.filter(r => r.estado !== 'resuelto').length;
  const descargos = s.infracciones.filter(i => i.estado === 'descargo').length;
  const provMal = s.proveedores.filter(p => artEstado(p)[1] !== 'ok').length;
  const datosPend = typeof tareasDatosPendientes === 'function' ? tareasDatosPendientes() || 0 : 0;
  const votAbiertas = s.votaciones.filter(v => v.cierra > Date.now()).length;
  const obras = s.obras.filter(o => o.estado === 'activa').length;
  const frec = aLista(s.frecuentes).filter(f => f && !f.baja).length;
  const alertasAct = aLista(s.alertas).filter(alertaActiva).length;
  const comAct = (s.comunicados || []).filter(c => !c.archivado).length;
  const conCuenta = s.users.filter(x => x.estado === 'aprobado' && /^Lote\s/.test(x.casa || '')).length;
  const ingresos = pasesDelDia().length;
  const SALAS = [
    { k:'garita', t:'Garita y seguridad', icon:'gate', color:'brand',
      linea: `${t ? `Turno ${esc(t.turno)} · ${esc(aLista(t.guardias).join(', ')) || 'sin guardias anotados'}` : 'Sin turno abierto'} · ${plural(ingresos, 'ingreso', 'ingresos')} hoy`,
      items:[
        { v:'garita', icon:'eye', t:'Garita en vivo', s:`Ingresos, camión${hayPaquetes() ? ' y paquetes' : ''} · solo para mirar`, n:ingresos },
        { v:'bitacora', icon:'book', t:'Bitácora', s:'Libro de guardia · lo escribe la garita, acá se lee' },
        { v:'turnos', icon:'clock', t:'Turnos de la garita', s: t ? 'Abierto ahora · horarios y policías' : 'Horarios, guardias y policías' },
        { v:'privado', p:'interno', icon:'shield', t:'Mensajes con la garita', s:'Chat con la garita y los pedidos firmados de los vecinos', badge: msgGarita + petPend },
        { v:'frecuentes', icon:'qr', t:'Ingresos frecuentes', s:'QR fijo para proveedores y personal', n: frec || '' },
        { v:'supervisores', icon:'eye', t:'Supervisión de la guardia', s: typeof haySupervision === 'function' && haySupervision() ? 'Quién mira la garita en vivo y sus mensajes' : 'Habilitar a quien controla el servicio (solo mira)', badge: typeof sinLeerDeSupervision === 'function' ? sinLeerDeSupervision('supAdmin') : 0 },
      ] },
    { k:'vecinos', t:'Vecinos', icon:'users', color:'accent',
      linea: `${plural(conCuenta, 'vecino con cuenta', 'vecinos con cuenta')} · ${s.padron.length ? plural(s.padron.length, 'unidad', 'unidades') + ' en el padrón' : 'padrón sin cargar'}`,
      items:[
        { v:'padron', icon:'users', t:'Padrón', s:'Buscá por apellido, lote, DNI o correo' },
        { v:'privado', p:'admin', icon:'lock', t:'Mensajes de vecinos', s:'Conversaciones privadas con la Administración', badge: msgVecinos },
        { v:'reclamos', icon:'clipboard', t:'Reclamos', s:'Responder y publicar', badge: reclamos },
        { v:'infracciones', icon:'alert', t:'Infracciones', s:'Graduales, con descargo', badge: descargos },
        { v:'votaciones', icon:'vote', t:'Votaciones', s:'Abrir una, resultados y actas', n: votAbiertas || '' },
        { v:'obras', p: s.obras.some(o => o.estado === 'pendiente') ? 'pendientes' : 'activas', icon:'wrench', t:'Obras', s:'De los vecinos y del barrio', n: obras || '' },
      ] },
    { k:'comunicacion', t:'Comunicación', icon:'bell', color:'sky',
      linea: comAct || alertasAct ? [comAct && plural(comAct, 'comunicado vigente', 'comunicados vigentes'), alertasAct && plural(alertasAct, 'aviso urgente activo', 'avisos urgentes activos')].filter(Boolean).join(' · ') : 'Lo que la Administración le dice a todo el barrio',
      items:[
        { v:'comunicados', icon:'tack', t:'Comunicados importantes', s:'Ventana, sonido y acuse de recibo', n: comAct || '' },
        { a:'nuevo-post', v:'aviso', icon:'muro', t:'Publicar en el pizarrón', s:'Para lo que no es urgente' },
        { v:'manual', icon:'book', t:'Manual de uso', s:'El que leen los vecinos, con los capítulos de garita y Administración' },
        { v:'alertas', icon:'siren', t:'Avisos urgentes por zona', s:'Corte de luz, nieve, portón… con respuesta', n: alertasAct || '' },
      ] },
    { k:'cumplimiento', t:'Proveedores y cumplimiento', icon:'box', color:'wood',
      linea: provMal || datosPend ? [provMal && plural(provMal, 'proveedor con papeles por vencer', 'proveedores con papeles por vencer'), datosPend && plural(datosPend, 'tarea de datos pendiente', 'tareas de datos pendientes')].filter(Boolean).join(' · ') : 'Todo en regla',
      items:[
        { v:'proveedores', icon:'box', t:'Proveedores', s:'ART y seguro al día', badge: provMal },
        { v:'proteccion', icon:'lock', t:'Protección de datos', s:'AAIP, confidencialidad e incidentes', badge: datosPend },
        { v:'aporte', icon:'heart', t:'Publicidad y aporte al barrio', s:'El 50 % de lo que pagan los comercios · compromiso y entregas' },
      ] },
  ];
  /* El Hotel Los Cauquenes tiene su propia sala (js/v-hotel.js), la última,
     después de Proveedores y cumplimiento (pedido de Claudio, 27-09-2026). */
  if (typeof salaHotel === 'function') SALAS.push(salaHotel());
  const renglon = x => `<button class="dd-item" data-a="${x.a || 'abrir'}" data-v="${esc(x.v || '')}" data-p="${esc(x.p || '')}">
      <span class="dd-ic">${I(x.icon)}</span><span class="dd-txt"><b>${x.t}</b><small>${x.s}</small></span>
      ${x.badge ? `<span class="dd-alerta">${x.badge > 99 ? '99+' : x.badge}</span>` : x.n !== undefined && x.n !== '' ? `<span class="dd-n">${x.n}</span>` : ''}${I('right')}</button>`;
  return `<div class="dd-cab"><h2>Día a día</h2><span>Ordenado por sala: lo de la garita, lo de los vecinos, lo que se comunica y los papeles.</span></div>
    <div class="dd-salas">${SALAS.map(g => { const pend = g.items.reduce((a, x) => a + (+x.badge || 0), 0);
      return `<section class="dd-sala dd-${g.color}" aria-label="${esc(g.t)}">
        <header><span class="dd-sala-ic">${I(g.icon)}</span><div><h3>${g.t}</h3><p>${g.linea}</p></div>
          ${pend ? `<span class="dd-pend" title="Piden atención">${pend > 99 ? '99+' : pend}</span>` : `<span class="dd-ok" title="Nada pendiente">${I('check')}</span>`}</header>
        <div class="dd-items">${g.items.map(renglon).join('')}</div></section>`; }).join('')}</div>`;
}
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
        ${S.arriba ? S.arriba(u, s, hoy) : ''}
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
       comunicados, las alertas, un SOS abierto, las obras en curso, los
       viajes compartidos, las compras conjuntas, el clima que complica y el
       camión de mañana. Nadie tiene que acordarse de abrir la campanita
       para enterarse.
     · PARA VOS: lo que es tuyo (alguien pregunta por vos en la garita, un
       paquete, una votación pendiente, un mensaje, tu propia alerta).
   Cada aviso es una ventanita con el tono de su importancia, para priorizar
   de un vistazo:
     ROJO      importante (alertas, SOS, comunicados, lo urgente),
     AMARILLO  tener en cuenta (guardia, avisos, obras hoy, perdidos),
     VERDE     para saber (eventos, viajes, compras, novedades).
   Mientras no lo viste, TITILA en su tono. Al tocarlo se abre y deja de
   titilar (en este equipo).
   ========================================================= */
const TIPOS_PIZARRA = ['guardia', 'aviso', 'alerta', 'evento', 'perdido'];
const NIVELES_PZ = { rojo:'Importante', amarillo:'Tener en cuenta', verde:'Para saber' };
const NIVEL_POST = { alerta:'rojo', guardia:'amarillo', aviso:'amarillo', perdido:'amarillo', evento:'verde' };
const nivelDeColor = c => c === 'danger' ? 'rojo' : c === 'warn' ? 'amarillo' : 'verde';
const ORDEN_NIVEL = { rojo:0, amarillo:1, verde:2 };
/* Los avisos para todos que ya salen por su propio camino en la pizarra
   (el post, la obra, la compra) no se repiten. */
const LINKS_YA_EN_PIZARRA = ['pizarron', 'obras', 'compras', 'viajes', 'mascotas'];

/* Los avisos del tiempo llevan a "Ushuaia hoy", vengan de donde vengan. */
const ICONOS_CLIMA = ['snow', 'wind', 'thermo'];
/* EL MISMO AVISO, UNA SOLA VEZ
   La nieve prevista salía tres veces: como alerta del clima, como aviso
   automático de la tarde y como el aviso de ayer, que seguía. Si dos
   renglones dicen lo mismo, queda uno: el que lleva a una ventana. */
const normTit = t => String(t || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
function sinRepetidos(lista){
  const por = new Map();
  lista.forEach(x => {
    const k = normTit(x.titulo), y = por.get(k);
    if (!y) por.set(k, x);
    else if (y.a !== 'abrir' && x.a === 'abrir') por.set(k, { ...x, nuevo: x.nuevo && y.nuevo });
    else if (!x.nuevo && y.nuevo) y.nuevo = false;
  });
  return [...por.values()];
}

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
  const medianoche = new Date(hoy + 'T00:00').getTime();
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
  /* Lo que publica el SISTEMA solo (el viento, el resultado de una
     votación…) no dura 24 horas: se renueva a las 00 h de cada día, así la
     pizarra de hoy no arrastra los avisos automáticos de ayer. */
  aLista(s.posts).filter(p => p && (TIPOS_PIZARRA.includes(p.type) || p.autor === 'sistema' || usuario(p.autor)?.rol === 'admin') && !p.resuelto
      && (p.autor === 'sistema' ? p.createdAt >= medianoche
        : (p.fijado || ahora - p.createdAt < DIA || (p.type === 'evento' && p.fecha && p.fecha >= hoy)))).forEach(p => {
    const t = TIPOS_POST[p.type] || TIPOS_POST.aviso, au = autorVisible(p.autor);
    poner({ k:'post-' + p.id, nivel: NIVEL_POST[p.type] || 'verde', icon:t.icon, tag:t.n, at:p.createdAt, titulo:p.title, texto:p.body,
      de:`${au.nombre}${au.casa && au.casa !== au.nombre ? ' · ' + au.casa : ''}`, fijo:p.fijado, a:'ver-novedad', v:'post', id:p.id });
  });
  /* Obras en curso: salen solas, y en amarillo si hoy hay movimiento. */
  aLista(s.obras).filter(o => o && o.estado === 'activa' && (!o.inicio || o.inicio <= hoy)).forEach(o => {
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
  /* Los avisos automáticos para todos que no tienen otro lugar: quedan
     en la pizarra aunque ya se hayan leído (leídos, quietos), pero solo los
     del día: a las 00 h se van y entran los nuevos. */
  misNotifs().filter(n => aLista(n.para).includes('todos') && n.at >= medianoche && !avisoCamionViejo(n) && !LINKS_YA_EN_PIZARRA.includes(String(n.link || '').split(':')[0]))
    .forEach(n => out.push({ k:'n-' + n.id, nuevo:!aLista(n.leidas).includes(u.id), nivel: n.urgente ? 'rojo' : nivelDeColor(n.color), icon:n.icon || 'bell', tag:'Aviso', at:n.at, titulo:n.titulo, texto:n.texto,
      ...(ICONOS_CLIMA.includes(n.icon) ? { a:'abrir', v:'ushuaia' } : { a:'notif', id:n.id }) }));
  /* La garita no ve lo que lleva a secciones de vecinos (viajes, compras,
     votaciones): tocarlo no la llevaba a ningún lado. */
  return sinRepetidos(out).filter(x => x.a !== 'abrir' || typeof ventanaPermitida !== 'function' || ventanaPermitida(x.v)).sort((a, b) => (ORDEN_NIVEL[a.nivel] - ORDEN_NIVEL[b.nivel]) || (!!b.fijo - !!a.fijo) || b.at - a.at);
}
/* Los avisos que son tuyos y todavía no abriste. */
function avisosPersonales(){
  const u = yo();
  /* El reloj de TUS expensas (privado: sale de tu cuenta, nadie más lo ve).
     Mientras está, los avisos sueltos de "vencen las expensas" no se
     repiten en la pizarra (siguen en la campanita). */
  const exp = typeof avisoExpensas === 'function' ? avisoExpensas() : null;
  const reloj = exp ? [{ ...exp, nuevo: exp.siempre || Pizarra.nuevo(exp.k, exp.at) }] : [];
  /* Un paquete del lote en la garita queda en "Para vos" hasta que alguien
     del lote lo retira, aunque ya se haya leído el aviso (26-09-2026). */
  const paqs = esStaff() || !hayPaquetes() ? [] : paquetesDelLote(u).filter(p => !p.retirado).map(p => ({ k:'paq-' + p.id, nuevo:Pizarra.nuevo('paq-' + p.id, p.recibido), nivel:'amarillo', icon:'box', tag:'Para vos · paquete', at:p.recibido,
    titulo:`Paquete en la garita${p.hostId !== u.id ? ' para ' + nombreDe(p.hostId).split(' ')[0] : ''}`, texto:`${p.empresa}${p.detalle ? ' · ' + p.detalle : ''} · se retira con el QR de retiro`, a:'abrir', v:'mis-paquetes' }));
  const ids = new Set(paqs.map(x => x.k));
  /* Dos avisos con el mismo título (el de la helada que dio el motor y una
     copia vieja con otro texto) van una sola vez (sinRepetidos). */
  /* Estoy bien, nieve, la casa en invierno y los préstamos (27-09). */
  const cuid = [...(typeof pizarraCuidados === 'function' ? pizarraCuidados() : []), ...(typeof pizarraCasa === 'function' ? pizarraCasa() : []), ...(typeof pizarraSismo === 'function' ? pizarraSismo() : [])];
  return [...reloj, ...paqs, ...cuid, ...sinRepetidos(noLeidas().filter(n => !aLista(n.para).includes('todos') && !avisoCamionViejo(n) && !(ids.size && n.link === 'mis-paquetes' && /paquete/i.test(n.titulo || '') && !/retir/i.test(n.titulo || ''))
      && !(exp && String(n.link || '').split(':')[0] === 'expensas' && /vence|venci|impag|saldo/i.test(n.titulo || '')))
    .map(n => ({ k:'n-' + n.id, nuevo:true, nivel: n.urgente ? 'rojo' : nivelDeColor(n.color), icon:n.icon || 'bell',
      tag: aLista(n.para).includes(u.id) ? 'Para vos' : 'Para el equipo', at:n.at, titulo:n.titulo, texto:n.texto, a:'notif', id:n.id })))]

    .sort((a, b) => (!!b.siempre - !!a.siempre) || (ORDEN_NIVEL[a.nivel] - ORDEN_NIVEL[b.nivel]) || b.at - a.at);
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
const renglonPz = x => `<button class="pzr nv-${x.nivel} ${x.nuevo ? 'titila' : 'leido'}${x.siempre ? ' siempre' : ''}" data-k=
"${esc(x.k)}" data-a="${x.a}" data-v="${esc(x.v || '')}" data-p="${esc(x.p || '')}" data-id="${esc(x.id || '')}" title="${NIVELES_PZ[x.nivel]}">
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
/* El pie de la app: chico y en gris, para que esté pero no moleste.
   "by Claudio A. Ravasi" abre los términos de uso, los datos personales y
   el deslinde de responsabilidad. Hasta el 26-09 había además un renglón
   "Términos de uso · Datos personales · Responsabilidad" que abría
   exactamente lo mismo: se sacó para no repetir (pedido de Claudio). */
const pieApp = () => `<footer class="pie-app">
    <span>Barrio ${esc(Store.s.config.nombre)} · versión ${esc(window.VERSION || 'sin sellar')}</span>
    <span>Ushuaia · Tierra del Fuego, Antártida e Islas del Atlántico Sur</span>
    <button class="pie-autor" data-a="abrir" data-v="legal" title="Términos de uso, datos personales y deslinde de responsabilidad" aria-label="by Claudio A. Ravasi: términos de uso, datos personales y responsabilidad">by Claudio A. Ravasi</button></footer>`;

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
      ? `${sec('Gestión del barrio')}${typeof bandaCuidadoGarita === 'function' ? bandaCuidadoGarita() : ''}${SECCIONES.gestion.tejas(u, s, hoy)}`

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
        ${typeof bloqueCuidado === 'function' ? bloqueCuidado() : ''}
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
  const r = recoleccionDias(), h = new Date().getDay();
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
      ${(() => { const au = ausenciaDe(u); return superficie({ a:'modo-viaje', icon:'lock', color:'wood', t: au ? `Casa sola hasta el ${fechaCorta(au.hasta)}` : 'Me voy de viaje', s: au ? 'La revisan una vez por día y te llega el aviso. Tocá para cambiar.' : 'La garita o el policía la revisa cada día y te avisa que está en orden' }); })()}
      ${superficie({ a:'aviso-guardia', icon:'shield', color:'brand', t:'Aviso rápido a la guardia', s:'Llego tarde, ruidos raros, se cortó la luz…' })}
      ${sec('Historial')}
      ${superficie({ a:'hist-mis-visitas', icon:'clock', color:'sky', t:'Ver mi historial completo', s:'Todas tus visitas desde el primer día. Se trae de la base solo cuando lo pedís.' })}
      <p class="muted tiny" style="margin-top:14px">En la app quedan las visitas de los últimos ${Historial.diasVisitas()} días; las anteriores pasan al archivo histórico del barrio, sin DNI ni patente (Ley 25.326), y las ves con el botón de arriba.</p>`;
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
    <label class="check"><input type="checkbox" name="fijo" ${tipo0 === 'personal' ? 'checked' : ''}><span><b>Viene varias veces</b> (empleada, jardinero, personal de una obra por un tiempo…)</span></label>
    <div id="fijoBox" ${tipo0 === 'personal' ? '' : 'hidden'}><p class="muted tiny" style="margin:6px 0 0">Se genera <b>un solo QR</b> que sirve todos los días elegidos, en ese horario, hasta la fecha final. No hay que hacer uno por día.</p><div class="field" style="margin-top:8px"><label>Días</label><div class="seg dias-sel">${[1,2,3,4,5,6,0].map(d =>
      `<label><input type="checkbox" name="dias" value="${d}" ${d >= 1 && d <= 5 ? 'checked' : ''}><span>${DIAS[d]}</span></label>`).join('')}</div></div>
      <div class="field"><label>Hasta la fecha</label><input type="date" name="fechaFin" value="${sumarDias(hoy, 90)}"></div></div>
    <div class="field" style="margin-top:8px"><label>Nota para la guardia (opcional)</label><input name="nota" maxlength="120" placeholder="Ej: deja la caja en la puerta"></div>
    <button class="btn btn-pri btn-block">${I('qr')}Crear el pase</button></form>`);
};
document.addEventListener('change', e => {
  if (e.target.name === 'fijo'){ const b = $('#fijoBox'); if (b) b.hidden = !e.target.checked; }
  /* UBER, DIDI O TAXI SE AVISA DESDE ACÁ (pedido de Claudio, 28-09): ya no
     hay una teja aparte en Tu casa ni en Mis visitas. Al elegirlo, la hoja
     pasa al aviso corto de siempre (app, patente, en cuánto llega). */
  if (e.target.name === 'tipo' && e.target.value === 'remis' && e.target.closest('form[data-f="nuevo-pase"]')){ A['pase-app'](); return; }
  /* Personal fijo o de obra: casi siempre viene varias veces. */
  if (e.target.name === 'tipo' && e.target.closest('form[data-f="nuevo-pase"]') && ['personal', 'proveedor'].includes(e.target.value)){
    const f = e.target.form.querySelector('[name=fijo]'); if (f && !f.checked){ f.checked = true; const b = $('#fijoBox'); if (b) b.hidden = false; } }
});
F['nuevo-pase'] = d => {
  const u = yo();
  if (minutosDe(d.hasta) <= minutosDe(d.desde) && d.hasta !== '00:00'){ toast('La hora de salida tiene que ser después de la de entrada', 'clock'); return; }
  const dias = d.fijo ? [].concat(d.dias || []).map(Number) : null;
  if (d.fijo && !dias.length){ toast('Elegí al menos un día', 'calendar'); return; }
  const p = { id:uid(), hostId:u.id, tipo:d.tipo, nombre:d.nombre.trim(), dni:soloDigitos(d.dni), patente:(d.patente || '').toUpperCase().trim(),
    fecha:d.fecha, desde:d.desde, hasta:d.hasta, nota:(d.nota || '').trim(), codigo:codigoPase(), log:{}, createdAt:Date.now(), autoriza:u.nombre };
  if (dias){ p.dias = dias; p.fechaFin = d.fechaFin || sumarDias(d.fecha, 90); }
  Store.cambiar(s => { s.pases.unshift(p); if (p.fecha === hoyISO()) notificar(s, { para:'rol:guardia', titulo:'Nueva visita anunciada', texto:`${u.nombre} (${u.casa}) autorizó a ${p.nombre} · ${p.desde}–${p.hasta}`, icon:'users', color:'sky', link:'garita' }); });
  verPase(p.id, true);
};
function verPase(id, recien = false){
  const p = Store.s.pases.find(x => x.id === id); if (!p) return;
  const u = usuario(p.hostId) || {};
  hoja(recien ? '¡Pase listo!' : 'Pase de ingreso', `
    <div class="ticket"><div class="tk-top"><small>Ingreso a ${esc(Store.s.config.nombre)}</small><h3>${esc(p.nombre)}</h3>
      <div style="opacity:.85;font-size:13px">${esc(u.casa || '')} · ${p.dias?.length ? p.dias.map(d => DIAS[d]).join(' ') : relDia(p.fecha)} · ${p.desde}–${p.hasta}</div>
      <div style="opacity:.85;font-size:12px;margin-top:4px">Autorizó: ${esc(p.autoriza || u.nombre || '')}${p.dias?.length ? ` · mismo QR todos esos días hasta el ${fechaCorta(p.fechaFin)}` : ''}</div></div>
      <div class="bottom"><div class="qr-box" data-qr="BHC:${p.codigo}"></div><div class="codigo-grande">${p.codigo}</div>
      <div class="muted small">Mostralo en la garita. También sirve dictar el código.</div></div></div>
    <div class="btns" style="margin-top:14px">
      <button class="btn btn-wa" data-a="compartir-pase" data-id="${p.id}">${I('share')}Enviar por WhatsApp</button>
      <button class="btn btn-sec" data-a="copiar" data-v="${esc(textoPase(p))}">${I('copy')}Copiar</button></div>`);
  $$('#hoja [data-qr]').forEach(el => pintarQR(el, el.dataset.qr));
}
A['ver-pase'] = el => verPase(el.dataset.id);

/* =========================================================
   UBER, DIDI, CABIFY O TAXI (pedido de Claudio, 27-09)
   El chofer no tiene la app del barrio ni un QR: lo que la garita ve es su
   patente. Por eso el vecino, cuando pide el viaje, avisa en 10 segundos:
   qué app, si lo viene a buscar o le trae algo, en cuánto llega y la
   patente (la muestra Uber/DiDi apenas el chofer acepta; si todavía no la
   sabe, la agrega después). Se arma un pase corto, que vence solo, y la
   garita lo encuentra escribiendo la patente o en "Ingresos de hoy". Al
   entrar y al salir, al vecino le llega el aviso como con cualquier visita.
   Sin aviso, el chofer entra por "Llegó sin aviso" (se le pregunta al vecino).
   ========================================================= */
const APPS_VIAJE = { uber:'Uber', didi:'DiDi', cabify:'Cabify', taxi:'Taxi / remís' };
A['pase-app'] = () => hoja('Viene un Uber, DiDi o taxi', `<form data-f="pase-app">
  <p class="small" style="margin:0 0 12px"><button type="button" class="link" data-a="nuevo-pase">${I('left')}Es otro tipo de visita</button></p>
  <div class="field"><label>¿De qué app?</label><div class="seg">${Object.entries(APPS_VIAJE).map(([k, n], i) => `<label><input type="radio" name="app" value="${k}" ${i === 0 ? 'checked' : ''}><span>${esc(n)}</span></label>`).join('')}</div></div>
  <div class="field"><label>¿Para qué viene?</label><div class="seg">
    <label><input type="radio" name="para" value="buscar" checked><span>${I('logout')}Me viene a buscar</span></label>
    <label><input type="radio" name="para" value="traer"><span>${I('login')}Trae a alguien o algo</span></label></div></div>
  <div class="grid2"><div class="field"><label>Patente</label><input name="patente" maxlength="10" style="text-transform:uppercase" placeholder="AB 123 CD" autocomplete="off"></div>
    <div class="field"><label>Llega en</label><select name="en"><option value="10">10 minutos</option><option value="20" selected>20 minutos</option><option value="30">30 minutos</option><option value="60">1 hora</option></select></div></div>
  <div class="field"><label>Nombre del chofer (opcional)</label><input name="chofer" maxlength="40" autocomplete="off" placeholder="Lo muestra la app cuando acepta el viaje"></div>
  <p class="muted tiny" style="margin:0 0 12px">La patente la ves en la app apenas el chofer acepta. Si todavía no la sabés, avisá igual y agregala después desde Mis visitas. El aviso vence solo una hora después de la hora de llegada.</p>
  <button class="btn btn-pri btn-block">${I('send')}Avisar a la garita</button></form>`);
F['pase-app'] = d => {
  const u = yo(), app = APPS_VIAJE[d.app] ? d.app : 'uber', ahora = new Date(), en = Math.min(120, Math.max(5, +d.en || 20));
  const hhmm = ms => { const x = new Date(ms); return `${pad(x.getHours())}:${pad(x.getMinutes())}`; };
  const fin = Math.min(ahora.getTime() + (en + 60) * MIN, new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), 23, 59).getTime());
  const chofer = String(d.chofer || '').trim(), patente = normPatente(d.patente);
  const p = { id:uid(), hostId:u.id, tipo:'remis', app, nombre:`${APPS_VIAJE[app]}${chofer ? ' · ' + chofer : ''}`, dni:'', patente,
    fecha:hoyISO(), desde:hhmm(ahora.getTime() - 5 * MIN), hasta:hhmm(fin), nota: d.para === 'traer' ? 'Trae a alguien o algo' : 'Viene a buscar al vecino',
    codigo:codigoPase(), log:{}, createdAt:Date.now(), autoriza:u.nombre };
  Store.cambiar(s => { s.pases.unshift(p);
    notificar(s, { para:'rol:guardia', titulo:`Viene un ${APPS_VIAJE[app]} a ${u.casa}`, texto:`${patente ? 'Patente ' + patente : 'Patente a confirmar'} · llega en ~${en} min · ${p.nota.toLowerCase()}`, icon:'car', color:'warn', link:'garita' }); });
  hoja('La garita ya sabe', `${aviso('ok', 'check', `${esc(APPS_VIAJE[app])} a ${esc(u.casa)} · vence a las ${p.hasta} h`, patente ? `Patente <b class="mono">${esc(patente)}</b>. Cuando entre y cuando salga te llega el aviso.` : 'Falta la patente: agregala cuando el chofer acepte, así la garita lo reconoce al llegar.')}
    ${patente ? '' : `<button class="btn btn-pri btn-block" data-a="pase-app-patente" data-id="${p.id}">${I('car')}Agregar la patente</button>`}
    <button class="btn btn-sec btn-block" style="margin-top:8px" data-a="cerrar-hoja">Listo</button>`);
};
A['pase-app-patente'] = el => { const p = Store.s.pases.find(x => x.id === el.dataset.id); if (!p) return;
  hoja('Patente del viaje', `<form data-f="pase-app-patente" data-id="${esc(p.id)}"><div class="field"><label>Patente de ${esc(p.nombre)}</label><input name="patente" required maxlength="10" style="text-transform:uppercase" value="${esc(p.patente || '')}" placeholder="AB 123 CD" autocomplete="off"></div>
    <button class="btn btn-pri btn-block">${I('check')}Guardar y avisar a la garita</button></form>`); };
F['pase-app-patente'] = (d, form) => {
  const patente = normPatente(d.patente); if (patente.length < 6) return toast('Revisá la patente', 'car');
  const u = yo();
  Store.cambiar(s => { const p = s.pases.find(x => x.id === form.dataset.id && x.hostId === u.id); if (!p) return; p.patente = patente;
    notificar(s, { para:'rol:guardia', titulo:`Patente del ${APPS_VIAJE[p.app] || 'viaje'} a ${u.casa}`, texto:`${patente} · ${p.nota || ''}`, icon:'car', color:'warn', link:'garita' }); });
  cerrarHoja(); toast('Patente guardada. La garita ya la tiene.', 'car');
};
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
    nuevo = { id:uid(), hostId:u.id, tipo:'visita', nombre:r.nombre, dni:r.dni, patente:r.patente, fecha:r.fecha, desde:r.desde, hasta:r.hasta, codigo:codigoPase(), log:{}, createdAt:Date.now(), autoriza:u.nombre };
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
  const u = yo(), v = (typeof ausenciaDe === 'function' ? ausenciaDe(u) : u.viaje) || {}, hoy = hoyISO();
  hoja('Me voy de viaje', `<form data-f="modo-viaje">
    <p class="muted small" style="margin:0 0 12px">Tu casa entra en la lista de "casas solas" de la garita: la garita o el policía de la ronda la revisa una vez por día y te llega el aviso "Tu casa está en orden". Lo ven solo la garita, la Administración y las cuentas de tu lote.</p>
    <div class="grid2"><div class="field"><label>Desde</label><input type="date" name="desde" value="${v.desde || hoy}" required></div>
      <div class="field"><label>Hasta</label><input type="date" name="hasta" value="${v.hasta || sumarDias(hoy, 7)}" required></div></div>
    <div class="field"><label>Contacto si pasa algo</label><input name="contacto" maxlength="80" value="${esc(v.contacto || '')}" placeholder="Nombre y teléfono"></div>
    <div class="field"><label>¿Alguien tiene llave o pasa a regar?</label><input name="nota" maxlength="120" value="${esc(v.nota || '')}" placeholder="Ej: mi hermana Ana pasa los martes"></div>
    <div class="btns">${v.hasta ? `<button type="button" class="btn btn-sec" data-a="viaje-fin">Ya volví</button>` : ''}<button class="btn btn-pri">${I('lock')}Avisar a la guardia</button></div></form>`);
};
F['modo-viaje'] = d => {
  const u = yo();
  if (!d.desde || !d.hasta || d.hasta < d.desde){ toast('Revisá las fechas: "hasta" tiene que ser igual o posterior a "desde"', 'alert'); return; }
  /* Va a la carpeta privada (pv/ausencias) y el aviso, a cada cuenta de la
     garita en privado: que una casa está sola no puede andar a la vista. */
  Store.cambiar(s => { guardarAusencia(s, u, { desde:d.desde, hasta:d.hasta, contacto:String(d.contacto || '').trim(), nota:String(d.nota || '').trim() });
    notificar(s, { para:cuentasGarita(), titulo:`Casa sola: ${u.casa}`, texto:`Del ${fechaCorta(d.desde)} al ${fechaCorta(d.hasta)}. Revisarla una vez por día (al tocar "Revisada", al vecino le llega el aviso).`, icon:'lock', color:'wood', link:'garita' }); });
  /* Si usa "Estoy bien", queda en pausa mientras dura el viaje. */
  const eb = typeof Cuidado !== 'undefined' ? Cuidado.mio() : null;
  if (eb && eb.activo && d.hasta >= hoyISO()) Cuidado.poner(u.id, { pausaHasta:d.hasta }).catch(() => {});
  cerrarHoja(); toast(eb && eb.activo ? 'La guardia ya sabe y "Estoy bien" queda en pausa. ¡Buen viaje!' : 'La guardia ya sabe. ¡Buen viaje!', 'send');
};
A['viaje-fin'] = () => { const u = yo(), eb = typeof Cuidado !== 'undefined' ? Cuidado.mio() : null, au = ausenciaDe(u), hasta = au?.hasta;
  Store.cambiar(s => { const yu = s.users.find(z => z.id === u.id); if (yu && yu.viaje) delete yu.viaje;
    s.ausencias = aLista(s.ausencias).filter(a => !(a.userId === u.id || (u.casa && a.casa === u.casa)));
    notificar(s, { para:cuentasGarita(), titulo:`Volvió: ${u.casa}`, texto:'Termina el aviso de casa sola.', icon:'home', color:'ok', link:'garita' }); });
  if (eb && eb.pausaHasta && eb.pausaHasta === hasta) Cuidado.poner(u.id, { pausaHasta:null }).catch(() => {});
  cerrarHoja(); toast('Bienvenido/a de vuelta', 'home'); };
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
/* =========================================================
   EL TURNO ABIERTO ES SOLO EL ÚLTIMO (pedido de Claudio, 28-09-2026)
   Antes se buscaba CUALQUIER turno sin cerrar: si uno viejo había quedado
   abierto (por ejemplo, el siguiente se empezó desde otro equipo), al cerrar
   el turno de ahora aparecía "El turno Mañana sigue abierto · Soy de ese
   turno: seguir", aunque ya estaba todo cerrado. Ahora cuenta solo el
   último turno anotado: si está cerrado, no hay turno abierto. Y al empezar
   o cerrar un turno se cierran también los viejos que hubieran quedado
   abiertos, con un renglón en la bitácora.
   "Soy de ese turno: seguir" se ofrece solo si ese último turno sigue
   abierto y empezó hace menos de TURNO_RETOMAR (16 h): es para retomar
   cuando la app se cerró en pleno turno o se entra desde otro equipo. En
   el mismo equipo que lo abrió no se pregunta nada: sigue solo.
   ========================================================= */
const TURNO_RETOMAR = 16 * HORA;
const turnoAbierto = () => { const r = registrosTurno()[0]; return r && !r.cerradoAt ? r : null; };
const turnoParaRetomar = () => { const t = turnoAbierto(); return t && Date.now() - t.at < TURNO_RETOMAR ? t : null; };
/* Cierra los turnos que quedaron abiertos (menos `salvo`). Devuelve cuántos. */
function cerrarTurnosOlvidados(s, ahora, salvo = ''){
  const viejos = aLista(s.bitacora).filter(b => b && b.tipo === 'turno' && b.abre && !b.cerradoAt && b.id !== salvo);
  viejos.forEach(b => { b.cerradoAt = ahora; b.cierreAuto = true; });
  if (viejos.length) s.bitacora.unshift({ id:uid(), autor:yo()?.id || 'sistema', tipo:'turno', texto:`${viejos.length === 1 ? 'Se cerró el turno ' + viejos[0].turno + ' (' + aLista(viejos[0].guardias).join(', ') + '), que había quedado abierto' : 'Se cerraron ' + viejos.length + ' turnos que habían quedado abiertos (' + viejos.map(b => b.turno + ' del ' + fechaCorta(isoDe(new Date(b.at)))).join(', ') + ')'}.`, at:ahora - 3 });
  return viejos.length;
}
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
  const u = yo(), t = turnoDeAhora(), abierto = turnoParaRetomar(), conocidos = [...guardiasConocidos().values()];
  const fila = i => `<div class="turno-fila"><span class="turno-n">${i + 1}</span><input name="g" list="guardiasLista" autocomplete="off" maxlength="50" ${i === 0 ? 'required' : ''} placeholder="${i === 0 ? 'Nombre y apellido' : 'Otro guardia (opcional)'}"></div>`;
  return `<div class="turno-portada">
    <span class="turno-ic">${I('shield')}</span>
    <h1>Nuevo turno en la garita</h1>
    <p>${fechaLarga(hoyISO())} · ${hora(Date.now())} h</p></div>
    ${abierto ? `<div class="card turno-previo"><b>${I('clock')} El turno ${esc(abierto.turno)} no se cerró</b>
      <span>${esc(aLista(abierto.guardias).join(', '))} · desde las ${hora(abierto.at)} h${isoDe(new Date(abierto.at)) !== hoyISO() ? ' del ' + fechaCorta(isoDe(new Date(abierto.at))) : ''}</span>
      <div class="btns" style="margin-top:10px"><button class="btn btn-sm btn-sec" data-a="seguir-turno">Soy de ese turno: seguir</button></div>
      <p class="muted tiny" style="margin:8px 0 0">Pasa si la app se cerró en pleno turno o se entra desde otro equipo. Si sos de ese turno, seguí; si no, empezá el nuevo y ese se cierra solo (queda anotado en la bitácora).</p></div>` : ''}
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
A['seguir-turno'] = () => { const t = turnoParaRetomar(); if (!t) return; Store.sesion.turnoId = t.id; Store.guardarSesion(); toast(`Seguís en el turno ${t.turno}`, 'shield'); pintar(); };
F['abrir-turno'] = d => {
  const u = yo(), conocidos = guardiasConocidos(), vistos = new Set(), guardias = [];
  [].concat(d.g || []).forEach(n => {
    const k = claveNombre(n); if (!k || vistos.has(k)) return;
    vistos.add(k); guardias.push(conocidos.get(k) || conMayusculas(n));
  });
  if (!guardias.length){ toast('Anotá al menos un guardia', 'users'); return; }
  const turno = turnosConfig().find(x => x.nombre === d.turno)?.nombre || turnoDeAhora().nombre;
  const id = uid(), ahora = Date.now();
  let previoId = '';
  Store.cambiar(s => {
    const previo = turnoAbierto();
    if (previo){
      previoId = previo.id;
      previo.cerradoAt = ahora; previo.cierreAuto = true;
      s.bitacora.unshift({ id:uid(), autor:u.id, tipo:'turno', texto:`Se cerró el turno ${previo.turno} (${aLista(previo.guardias).join(', ')}) al empezar el siguiente.`, at:ahora - 1 });
    }
    cerrarTurnosOlvidados(s, ahora);
    /* El policía que sigue de servicio pasa al turno que entra, con la
       ronda que tenga en curso. */
    const ultimo = aLista(s.bitacora).filter(b => b.tipo === 'turno' && b.abre).sort((a, b) => b.at - a.at)[0];
    const siguen = [];
    if (ultimo && Date.now() - ultimo.at < 16 * HORA){
      ultimo.policias = policiasDe(ultimo).map(p => {
        if (p.sale || p.paso) return p;
        const rc = rondaEnCurso(p);
        siguen.push({ id:p.id, nombre:p.nombre, matricula:p.matricula || '', tel:p.tel || '', email:p.email || '', entra:p.entra, turnoEntra:p.turnoEntra || ultimo.turno, viene:ultimo.turno, rondas: rc ? [rc] : [] });
        return { ...p, paso:ahora, rondas: p.rondas.filter(r => r.fin) };
      });
    }
    s.bitacora.unshift({ id, autor:u.id, tipo:'turno', abre:true, turno, guardias, policias:siguen, texto:`Empieza el turno ${turno}: ${guardias.join(', ')}.${siguen.length ? ' Sigue de servicio: ' + siguen.map(p => p.nombre).join(', ') + '.' : ''}`, at:ahora });
  });
  Store.sesion.turnoId = id; Store.guardarSesion();
  toast(`Turno ${turno} en marcha`, 'shield');
  pintar();
  if (previoId) mandarParteTurno(previoId);
};
A['cerrar-turno'] = () => {
  const t = turnoAbierto();
  hoja('Cerrar el turno', `<form data-f="cerrar-turno">
    ${t ? `<p class="small" style="margin:0 0 12px">Turno <b>${esc(t.turno)}</b> · ${esc(aLista(t.guardias).join(', '))} · desde las ${hora(t.at)} h.</p>` : ''}
    <div class="field"><label>Novedades para el turno que entra (opcional)</label><textarea name="nota" maxlength="500" placeholder="Ej: quedó un paquete para el lote 40; el portón del fondo cierra mal."></textarea></div>
    ${policiasAdentro(t).length ? `<div class="field"><label>Policía que sigue en el barrio</label>${policiasAdentro(t).map(p => `<label class="check"><input type="checkbox" name="polSale" value="${esc(p.id)}"><span>${esc(p.nombre)} ya se fue (anotar la salida ahora)</span></label>`).join('')}
      <div class="ayuda">Si sigue de servicio, dejalo sin tildar: pasa al turno que entra con sus rondas.</div></div>` : ''}
    <button class="btn btn-pri btn-block">${I('check')}Cerrar el turno y anotar el siguiente</button>
    <p class="muted tiny" style="margin:10px 0 0">No se sale de la app: queda abierta la pantalla para anotar el turno que entra y sus guardias. Para salir de la cuenta de la garita: tu inicial, arriba → Cerrar sesión.</p></form>`);
};
/* Cerrar el turno ya no saca de la app: se anotan las novedades, el turno
   queda cerrado en la bitácora y la garita pasa directo a la pantalla de
   "Nuevo turno" para que el que entra anote a sus guardias. Salir de la
   cuenta es aparte, como cualquier vecino: la inicial de arriba → Cerrar sesión. */
F['cerrar-turno'] = d => {
  const u = yo(), t = turnoAbierto(), nota = (d.nota || '').trim(), ahora = Date.now();
  const salen = new Set([].concat(d.polSale || []));
  Store.cambiar(s => {
    const x = t && aLista(s.bitacora).find(b => b.id === t.id);
    if (x){
      x.cerradoAt = ahora;
      x.policias = policiasDe(x).map(p => salen.has(p.id) && !p.sale ? { ...p, sale:ahora, turnoSale:t.turno } : p);
      /* La ronda que el que se va dejó abierta queda INCOMPLETA en la bitácora. */
      x.policias.filter(p => salen.has(p.id)).forEach(p => { const rc = rondaEnCurso(p); if (rc) cerrarRondaIncompleta(s, p, rc, ahora, 'el policía se retiró en plena ronda'); });
      x.policias.filter(p => salen.has(p.id)).forEach(p => cerrarServicio(s, p));
      salen.forEach(pid => bajarCodigo(s, pid));
      x.policias.filter(p => salen.has(p.id)).forEach(p => s.bitacora.unshift({ id:uid(), autor:u.id, tipo:'acceso', texto:`Salida del policía ${p.nombre}${p.matricula ? ' (' + p.matricula + ')' : ''} · ${hora(ahora)} h · ${plural(p.rondas.length, 'ronda')}.`, at:ahora - 2 }));
    }
    s.bitacora.unshift({ id:uid(), autor:u.id, tipo:'turno', texto:`Termina el turno ${t ? t.turno + ' (' + aLista(t.guardias).join(', ') + ')' : ''}.${x ? resumenPolicia(x) : ''}${nota ? ' Novedades: ' + nota : ''}`, at:ahora });
    cerrarTurnosOlvidados(s, ahora);
  });
  Store.sesion.turnoId = ''; Store.guardarSesion();
  cerrarHoja();
  toast('Turno cerrado. Anotá el turno que entra.', 'check');
  PILA.length = 0;
  pintar();
  if (t) mandarParteTurno(t.id, nota);
  salen.forEach(pid => mandarConstanciaPolicia(pid));
};

/* =========================================================
   PARTE DEL TURNO POR CORREO
   Al cerrarse cada turno (a mano o al abrir el siguiente) sale un correo a
   la Administración con el resumen: quiénes estuvieron, novedades, policía
   y rondas (con los puntos de control), y todo lo que se anotó en la
   bitácora en ese horario. Se apaga en Ajustes → Correo.
   ========================================================= */
function parteTurnoHtml(t, nota = ''){
  const fin = t.cerradoAt || Date.now();
  const lineas = aLista(Store.s.bitacora).filter(b => b && b.at >= t.at && b.at <= fin + MIN && b.id !== t.id).sort((a, b) => a.at - b.at);
  const cuenta = re => lineas.filter(b => re.test(b.texto || '')).length;
  const ps = policiasDe(t);
  const fila = (a, b) => `<tr><td style="padding:4px 10px 4px 0;color:#6c7d7a;white-space:nowrap;vertical-align:top">${a}</td><td style="padding:4px 0">${b}</td></tr>`;
  return Correo.plantilla(`Parte del turno ${t.turno}`, `
    <table style="border-collapse:collapse;font-size:14px;margin:0 0 14px">
      ${fila('Fecha', fechaLarga(isoDe(new Date(t.at))))}
      ${fila('Horario', `${hora(t.at)} a ${hora(fin)} h${t.cierreAuto ? ' (se cerró al abrir el siguiente)' : ''}`)}
      ${fila('Guardias', esc(aLista(t.guardias).join(', ')))}
      ${fila('Ingresos y egresos', String(cuenta(/^(Ingreso|Egreso)/)))}
      ${hayPaquetes() ? fila('Paquetes', String(cuenta(/paquete/i))) : ''}
      ${fila('SOS', String(cuenta(/^SOS/)))}
    </table>
    ${nota ? `<p style="background:#fff7e0;border-radius:10px;padding:10px 12px;margin:0 0 14px"><b>Novedades para el turno siguiente:</b><br>${esc(nota)}</p>` : ''}
    ${ps.length ? `<h3 style="font-size:15px;margin:16px 0 6px">Policía contratada</h3>${ps.map(p => `<p style="margin:0 0 8px"><b>${esc(p.nombre)}</b>${p.matricula ? ' · mat. ' + esc(p.matricula) : ''} · ingresó ${hora(p.entra)} h${p.sale ? ' · salió ' + hora(p.sale) + ' h' : p.paso ? ' · siguió en el turno siguiente' : ' · sigue en el barrio'}<br>
      ${p.rondas.length ? p.rondas.map((r, i) => `Ronda ${i + 1}${r.incompleta ? ' (INCOMPLETA)' : ''}: ${hora(r.inicio)}${r.fin ? ' a ' + hora(r.fin) + ' (' + minutos(r.inicio, r.fin) + ' min)' : ' · en curso'}${r.pasos.length ? ` · QR ${new Set(pasosDeRonda(r).map(x => x.punto)).size}/${puntosActivos().length}: ${pasosDeRonda(r).map(x => esc(nombrePunto(x.punto)) + ' ' + hora(x.at)).join(', ')}` : ''}`).join('<br>') : 'Sin rondas anotadas.'}</p>`).join('')}` : ''}
    <h3 style="font-size:15px;margin:16px 0 6px">Bitácora del turno</h3>
    ${lineas.length ? `<table style="border-collapse:collapse;font-size:13px">${lineas.map(b => fila(hora(b.at), esc(b.texto || ''))).join('')}</table>` : '<p style="margin:0">Sin anotaciones.</p>'}
    ${(() => { const v = typeof vistoDe === 'function' ? vistoDe(t.id) : null; return v ? `<p style="background:${v.estado === 'obs' ? '#fff7e0' : '#eaf7ef'};border-radius:10px;padding:10px 12px;margin:14px 0 0"><b>Visto de la supervisión:</b> ${v.estado === 'obs' ? 'con observaciones' : 'sin observaciones'} · ${esc(v.nombre || '')} · ${fechaCorta(isoDe(new Date(v.at)))} ${hora(v.at)} h${v.obs ? '<br>' + esc(v.obs) : ''}</p>` : ''; })()}
    <p style="font-size:12px;color:#6c7d7a;margin-top:16px">Lo mandó la app de la garita al cerrarse el turno. Tiene datos personales: es para uso interno de la Administración (Ley 25.326, art. 10).</p>`);
}
async function mandarParteTurno(turnoId, nota = ''){
  const c = Store.s.config;
  if (c.parteTurno === false || !c.adminEmail) return;
  const t = registrosTurno().find(x => x.id === turnoId); if (!t) return;
  const r = await Correo.enviarDetalle({ para:c.adminEmail, asunto:`Parte del turno ${t.turno} · ${fechaCorta(isoDe(new Date(t.at)))} · ${aLista(t.guardias).join(', ')}`, html:parteTurnoHtml(t, nota), tipo:'parte-turno' });
  toast(r.ok ? 'El parte del turno salió por correo a la Administración' : 'El parte del turno no salió por correo: ' + r.error, r.ok ? 'mail' : 'alert');
}
A['parte-ver'] = el => { const t = registrosTurno().find(x => x.id === el.dataset.id); if (!t) return;
  hoja(`Parte del turno ${t.turno}`, `<div class="card plana" style="padding:0;overflow:hidden">${parteTurnoHtml(t)}</div>
    ${esAdmin() && Store.s.config.adminEmail ? `<button class="btn btn-sec btn-block" style="margin-top:10px" data-a="parte-reenviar" data-id="${t.id}">${I('mail')}Mandármelo por correo</button>` : ''}
    ${esSupervisor() && t.cerradoAt && typeof vistoDe === 'function' && !vistoDe(t.id) ? `<button class="btn btn-pri btn-block" style="margin-top:10px" data-a="visto-parte" data-id="${t.id}">${I('eye')}Dar el visto</button>` : ''}`, { ancho:'640px' }); };
A['parte-reenviar'] = el => { mandarParteTurno(el.dataset.id); cerrarHoja(); };
/* "Cerrar turno" está SOLO en su ventana (la teja "Cerrar el turno" de la
   garita): antes también estaba en esta banda y en "Tu cuenta", y
   confundía (pedido de Claudio, 27-09). */
const bandaTurno = () => {
  const t = turnoAbierto(); if (!t) return '';
  return `<div class="turno-banda">${I('shield')}<div class="grow"><b>Turno ${esc(t.turno)}</b><span>${esc(aLista(t.guardias).join(' · '))} · desde las ${hora(t.at)} h</span></div></div>`;
};

/* =========================================================
   POLICÍA CONTRATADA POR EL BARRIO
   Suele venir de noche (22 a 6 h). La guardia anota, dentro del turno:
   nombre, matrícula, hora de ingreso y de salida, y cada ronda caminando
   por el barrio (unos 20 minutos cada una; puede haber varias por turno y
   más de un policía). Todo vive dentro del registro del turno en la
   bitácora (campo `policias`), así no hace falta una regla nueva en
   Firebase, y cada ingreso, ronda y salida deja además su renglón en la
   bitácora. Si el policía sigue cuando cambia el turno, pasa al que entra.
   ========================================================= */
const RONDA_MIN = 20, RONDA_LARGA = 40;
const policiasDe = t => aLista(t && t.policias).filter(p => p && p.id).map(p => ({ ...p, rondas: aLista(p.rondas).filter(r => r && r.inicio).map(r => ({ ...r, pasos: aLista(r.pasos) })) }));
const policiasAdentro = t => policiasDe(t).filter(p => !p.sale && !p.paso);
const rondaEnCurso = p => p.rondas.find(r => !r.fin) || null;
const minutos = (a, b) => Math.max(1, Math.round((b - a) / MIN));
/* "23:40" escrito a mano → la última vez que fue esa hora (hoy o anoche). */
function horaPasada(hhmm){
  const [h, m] = String(hhmm || '').split(':').map(Number); if (isNaN(h)) return Date.now();
  const d = new Date(); d.setHours(h, m || 0, 0, 0);
  if (d.getTime() > Date.now() + 10 * MIN) d.setDate(d.getDate() - 1);
  return d.getTime();
}
const horaInput = ts => { const d = new Date(ts); return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); };
function policiasConocidos(){
  const m = new Map();
  registrosTurno().slice().reverse().forEach(r => policiasDe(r).forEach(p => { const k = claveNombre(p.nombre); if (!k) return; const ya = m.get(k) || {};
    m.set(k, { nombre:p.nombre, matricula:p.matricula || ya.matricula || '', tel:p.tel || ya.tel || '', email:p.email || ya.email || '' }); }));
  return m;
}
function resumenPolicia(t){
  const ps = policiasDe(t); if (!ps.length) return '';
  return ' Policía: ' + ps.map(p => { const inc = p.rondas.filter(r => r.incompleta).length, rc = rondaEnCurso(p);
    return `${p.nombre}${p.matricula ? ' (' + p.matricula + ')' : ''} desde ${hora(p.entra)}${p.sale ? ' a ' + hora(p.sale) : ''}, ${plural(p.rondas.length, 'ronda')}${inc ? ` (${plural(inc, 'incompleta', 'incompletas')})` : ''}${rc ? ', una en curso' : ''}`; }).join('; ') + '.';
}
/* Cambia un policía del turno abierto y guarda. */
function cambiarPolicia(pid, fn, renglon){
  const t = turnoAbierto(); if (!t) return toast('No hay un turno abierto', 'clock');
  Store.cambiar(s => {
    const x = aLista(s.bitacora).find(b => b.id === t.id); if (!x) return;
    x.policias = policiasDe(x);
    const p = x.policias.find(q => q.id === pid); if (!p) return;
    fn(p, x, s);
    const texto = renglon && renglon(p);
    if (texto) s.bitacora.unshift({ id:uid(), autor:yo().id, tipo:'acceso', texto, at:Date.now() });
  });
  refrescar();
}
/* La portada de la garita muestra SOLO al policía que está de servicio
   (pedido de Claudio, 27-09): cuando se registra su salida, desaparece de
   acá y queda en Turnos → "Servicios del policía", con todo su recorrido.
   Sin nadie de servicio queda la solapa y "Registrar ingreso". */
function bandaPolicia(){
  const t = turnoAbierto(); if (!t) return '';
  const ps = policiasAdentro(t), ahora = Date.now();
  /* Solo la garita registra al policía y sus rondas; la Administración lo ve. */
  const guardia = esGuardia();
  const sueltos = pasosSueltos(t).filter(x => Date.now() - x.at > 30000);
  const avisoSueltos = sueltos.length ? `<div class="aviso a-warn" style="margin:10px 0 0">${I('qr')}<div class="txt"><b>${plural(sueltos.length, 'paso escaneado', 'pasos escaneados')} sin asignar</b>${sueltos.slice(0, 4).map(x => `${esc(nombrePunto(x.punto))} · ${esc(x.nombre)} · ${hora(x.at)} h`).join('<br>')}<br>Son de un código que ya no corresponde a ningún policía de este turno (por ejemplo, se registró la salida antes).</div></div>` : '';
  const cab = `<div class="row" style="justify-content:space-between;gap:8px;flex-wrap:wrap"><b class="row" style="gap:8px">${I('shield')}Policía contratada${ps.length ? '' : `<span class="muted small" style="font-weight:600">· nadie de servicio ahora</span>`}</b>
      ${guardia ? `<button class="btn btn-xs btn-sec" data-a="policia-nuevo">${I('plus')}Registrar ingreso</button>` : ''}</div>`;
  if (!ps.length) return `<div class="card policia-card policia-solapa">${cab}${avisoSueltos}</div>`;
  return `<div class="card policia-card">${cab}
    ${ps.map(p => { const rc = rondaEnCurso(p), dur = rc ? minutos(rc.inicio, ahora) : 0;
      return `<div class="policia">
        <div class="policia-cab"><div class="grow"><b>${esc(p.nombre)}</b><span class="muted small">${p.matricula ? 'Mat. ' + esc(p.matricula) + ' · ' : ''}ingresó ${isoDe(new Date(p.entra)) !== hoyISO() ? fechaCorta(isoDe(new Date(p.entra))) + ' ' : ''}${hora(p.entra)} h${p.turnoEntra ? ' · turno ' + esc(p.turnoEntra) : ''}${codigoVigente(p.id) ? ` · código <span class="mono">${codigoVigente(p.id).id}</span>` : ''}${p.email ? '' : ' · <b>sin correo para la constancia</b>'}</span></div>
          <span class="pill ${rc ? (dur > RONDA_LARGA ? 'p-danger' : 'p-accent') : ''}">${plural(p.rondas.length, 'ronda')}</span></div>
        ${rc ? `<div class="aviso a-${dur > RONDA_LARGA ? 'danger latido' : 'info'}" style="margin:8px 0 0">${I('clock')}<div class="txt"><b>En ronda desde las ${hora(rc.inicio)} h · ${dur} min</b>${dur > RONDA_LARGA ? `Una ronda lleva unos ${RONDA_MIN} minutos: conviene comunicarse con el policía.` : `Vuelve alrededor de las ${hora(rc.inicio + RONDA_MIN * MIN)} h.`}</div></div>` : ''}
        ${p.rondas.length ? `<div class="rondas">${p.rondas.map((r, i) => `<span class="ronda">${i + 1}. ${hora(r.inicio)}${r.fin ? '–' + hora(r.fin) + ' · ' + minutos(r.inicio, r.fin) + ' min' : ' · en curso'}${r.pasos.length ? ` · QR ${new Set(pasosDeRonda(r).map(x => x.punto)).size}/${puntosActivos().length}` : ''}${r.incompleta ? ' · <b>incompleta</b>' : ''}${guardia ? `<button class="x" data-a="policia-ronda-borrar" data-id="${p.id}" data-v="${r.id}" aria-label="Borrar la ronda">×</button>` : ''}</span>`).join('')}</div>` : ''}
        ${(() => { const r = rc || p.rondas.filter(x => x.pasos.length).slice(-1)[0]; return r && puntosActivos().length ? recorridoRonda(r) : ''; })()}
        ${guardia ? `<div class="btns" style="margin-top:8px">
          <button class="btn btn-sm ${rc ? 'btn-ok' : 'btn-pri'}" data-a="policia-ronda" data-id="${p.id}">${I(rc ? 'check' : 'pin')}${rc ? 'Terminó la ronda' : 'Sale a una ronda'}</button>
          <button class="btn btn-sm btn-sec" data-a="policia-ronda-mano" data-id="${p.id}">${I('edit')}Anotar ronda a mano</button>
          <button class="btn btn-sm btn-sec" data-a="policia-salida" data-id="${p.id}">${I('logout')}Salida</button>
          ${codigoVigente(p.id) ? `<button class="btn btn-sm btn-sec" data-a="policia-codigo" data-id="${p.id}">${I('qr')}Código de ronda</button>` : ''}
          <button class="btn btn-sm btn-sec" data-a="policia-codigo-nuevo" data-id="${p.id}">${I('refresh')}Código nuevo</button></div>` : ''}
      </div>`; }).join('')}
    ${avisoSueltos}
  </div>`;
}

/* =========================================================
   PUNTOS DE CONTROL CON QR (rondas comprobables)
   La Administración define los puntos (6 de fábrica, de 2 a 12) y los
   imprime. Cada QR es un enlace a esta misma app: #/punto/<id>.<clave>/<nombre>.
   El policía lo escanea con la cámara de SU teléfono, sin instalar nada ni
   tener cuenta: se abre una pantallita, pone su nombre (la primera vez) y
   toca "Registrar paso". El paso va a staff/pasos con la HORA DEL SERVIDOR
   (no la del teléfono). Las reglas lo aceptan solo si trae la clave del
   punto, que está impresa en el QR: hay que estar frente al QR.
   La garita no tiene que hacer nada: el primer punto abre la ronda, cada
   punto se tilda y al completarlos todos la ronda se cierra sola
   (procesarPasos, corre en el equipo de la garita).
   Los puntos (con su clave) viven en staff/puntos: los leen la garita y la
   Administración; los vecinos no.
   ========================================================= */
const PUNTOS_SUGERIDOS = [
  ['Acceso de servicio / portón', 'Junto al portón, en el poste de luz'],
  ['Fondo del barrio', 'El punto más alejado de la garita'],
  ['Perímetro norte', 'Cerco lindero con el bosque o terreno abierto'],
  ['Perímetro sur', 'Cerco lindero con la costa o terreno abierto'],
  ['Contenedores de residuos', 'Donde se juntan las bolsas antes de que pase el camión'],
  ['Calle más oscura', 'Donde hay lotes baldíos u obras'],
];
const claveAzar = () => { const a = new Uint8Array(9); crypto.getRandomValues(a); return [...a].map(b => 'abcdefghjkmnpqrstuvwxyz23456789'[b % 31]).join(''); };
function puntosSugeridos(){ return PUNTOS_SUGERIDOS.map(([nombre, lugar], i) => ({ id:'pt' + (i + 1) + claveAzar().slice(0, 3), nombre, lugar, orden:i + 1, k:claveAzar(), activo:true, at:Date.now() })); }
const puntosActivos = () => aLista(Store.s.puntos).filter(x => x && x.activo !== false).sort((a, b) => (a.orden || 0) - (b.orden || 0));
const nombrePunto = id => (aLista(Store.s.puntos).find(x => x.id === id) || {}).nombre || 'Punto';
const pasosDeRonda = r => { const ids = new Set(aLista(r.pasos)); return aLista(Store.s.pasos).filter(x => ids.has(x.id)).sort((a, b) => a.at - b.at); };
/* El recorrido de una ronda, como lista de control: barra de avance arriba y
   un renglón por punto, en el orden de la ronda, con la hora a la derecha. */
function recorridoRonda(r){
  const hechos = new Map(); pasosDeRonda(r).forEach(x => { if (!hechos.has(x.punto)) hechos.set(x.punto, x.at); });
  const pts = puntosActivos(), n = pts.filter(pt => hechos.has(pt.id)).length, total = pts.length;
  const fin = r.fin || Date.now();
  const completa = total && n >= total;
  return `<div class="recorrido ${completa ? 'completa' : ''}">
    <div class="rec-cab"><b>${completa ? 'Ronda completa' : r.incompleta ? 'Ronda incompleta' : r.fin ? 'Ronda cerrada' : 'Ronda en curso'}</b>
      <span>${n} de ${total} puntos · ${minutos(r.inicio, fin)} min</span></div>
    <div class="rec-barra" role="progressbar" aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="${n}"><i style="width:${total ? Math.round(n / total * 100) : 0}%"></i></div>
    <ol class="rec-lista">${pts.map((pt, i) => { const at = hechos.get(pt.id);
      return `<li class="${at ? 'hecho' : ''}"><span class="rec-n">${at ? I('check') : i + 1}</span>
        <span class="rec-txt"><b>${esc(pt.nombre)}</b>${pt.lugar ? `<small>${esc(pt.lugar)}</small>` : ''}</span>
        <span class="rec-hora">${at ? hora(at) + ' h' : 'pendiente'}</span></li>`; }).join('')}</ol></div>`;
}
/* Pasos del turno que no se pudieron asignar a ningún policía. */
function pasosSueltos(t){
  const asignados = new Set(); registrosTurno().forEach(x => policiasDe(x).forEach(p => p.rondas.forEach(r => r.pasos.forEach(id => asignados.add(id)))));
  return aLista(Store.s.pasos).filter(x => x && x.at >= t.at && !asignados.has(x.id)).sort((a, b) => a.at - b.at);
}
/* Cómo quedó una ronda con QR: cuántos puntos se pasaron y cuáles faltaron. */
function estadoRonda(r){
  const pts = puntosActivos(), hechos = new Set(pasosDeRonda(r).map(x => x.punto));
  const faltan = pts.filter(pt => !hechos.has(pt.id)).map(pt => pt.nombre);
  return { n: pts.length - faltan.length, total: pts.length, faltan };
}
const conQR = r => !!(r && (r.qr || aLista(r.pasos).length));
const ultimoPaso = r => Math.max(r.inicio + MIN, ...pasosDeRonda(r).map(z => z.at));
/* =========================================================
   LA RONDA QUE NO SE TERMINÓ TAMBIÉN VA A LA BITÁCORA
   La completa ya dejaba su renglón. La que quedaba a medias (faltó escanear
   algún punto, pasó más de una hora, el policía se fue en plena ronda) se
   cerraba en silencio. Ahora se cierra como INCOMPLETA y deja su renglón en
   la bitácora de la garita, con los puntos que faltaron: así figura en el
   parte del turno. (Pregunta de Claudio, 25-09-2026.)
   El renglón lleva un id fijo por ronda: si la garita tiene la app abierta
   en dos equipos, queda uno solo.
   ========================================================= */
function cerrarRondaIncompleta(s, p, r, fin, motivo){
  if (!r) return false;
  r.fin = r.fin || Math.max(r.inicio + MIN, fin || Date.now());
  const e = estadoRonda(r);
  if (conQR(r) && e.total && e.n >= e.total) return false;
  r.incompleta = true;
  const id = 'ri-' + r.id;
  if (aLista(s.bitacora).some(b => b && b.id === id)) return true;
  s.bitacora.unshift({ id, autor:yo()?.id || 'sistema', tipo:'acceso', at:Date.now() - 1,
    texto:`Ronda ${p.rondas.indexOf(r) + 1} del policía ${p.nombre} INCOMPLETA (${motivo}): ${conQR(r) && e.total ? `${e.n}/${e.total} puntos, faltó ${e.faltan.join(', ')}` : 'no se anotó el regreso'} · ${hora(r.inicio)} a ${hora(r.fin)} h.` });
  return true;
}
/* El equipo de la garita arma las rondas con los pasos que llegan, y
   cierra como incompleta la ronda con QR que pasó una hora sin terminarse. */
function procesarPasos(){
  if (!esGuardia()) return;
  const t = turnoAbierto(); if (!t) return;
  const sueltos = pasosSueltos(t), ahora = Date.now();
  const vencida = r => r && !r.fin && conQR(r) && ahora - r.inicio > HORA;
  if (!sueltos.length && !policiasAdentro(t).some(p => vencida(rondaEnCurso(p)))) return;
  const total = puntosActivos().length;
  let cambios = false; const renglones = [];
  Store.cambiar(s => {
    const x = aLista(s.bitacora).find(b => b.id === t.id); if (!x) return;
    x.policias = policiasDe(x);
    const adentro = x.policias.filter(p => !p.sale && !p.paso);
    sueltos.forEach(ps => {
      /* El paso se asigna por el CÓDIGO de ronda, no por el nombre escrito. */
      const cod = aLista(s.rondaCodigos).find(c => c && c.id === ps.c);
      const p = cod && adentro.find(q => q.id === cod.pid);
      if (!p) return;
      let r = rondaEnCurso(p);
      /* Una ronda abierta hace más de una hora no se estira: se cierra
         (incompleta, a la bitácora) y empieza otra. */
      if (r && ps.at - r.inicio > HORA){ r.fin = r.fin || ultimoPaso(r); cerrarRondaIncompleta(s, p, r, r.fin, 'pasó más de una hora sin completar los puntos'); r = null; }
      if (!r){ r = { id:'q-' + ps.id, inicio:ps.at, qr:true, pasos:[] }; p.rondas.push(r); }
      if (!r.pasos.includes(ps.id)) r.pasos.push(ps.id);
      cambios = true;
      const pts = new Set(r.pasos.map(id => (aLista(s.pasos).find(z => z.id === id) || {}).punto));
      if (total && pts.size >= total){
        r.fin = ps.at;
        renglones.push({ id:'rc-' + r.id, texto:`Ronda ${p.rondas.indexOf(r) + 1} del policía ${p.nombre} completa por QR: ${total}/${total} puntos, ${hora(r.inicio)} a ${hora(r.fin)} h (${minutos(r.inicio, r.fin)} min).` });
      }
    });
    /* La que quedó abierta más de una hora sin completarse, aunque no
       lleguen más pasos. */
    adentro.forEach(p => { const r = rondaEnCurso(p); if (vencida(r)){ r.fin = ultimoPaso(r); cerrarRondaIncompleta(s, p, r, r.fin, 'pasó más de una hora sin completar los puntos'); cambios = true; } });
    renglones.forEach(({ id, texto }) => { if (!aLista(s.bitacora).some(b => b && b.id === id)) s.bitacora.unshift({ id, autor:yo().id, tipo:'acceso', texto, at:Date.now() }); });
  });
  if (cambios) refrescarPronto();
}

/* ---------- la pantallita que abre el QR (sin cuenta) ---------- */
/* El teléfono del policía recuerda su código y su nombre por 14 horas. */
const Ronda = {
  KEY:'bhc.ronda',
  leer(){ try { const r = JSON.parse(localStorage.getItem(this.KEY) || 'null'); return r && r.c && Date.now() - r.at < CODIGO_VIGENCIA ? r : null; } catch(e){ return null; } },
  guardar(c, nombre){ try { localStorage.setItem(this.KEY, JSON.stringify({ c, nombre, at:Date.now() })); } catch(e){} },
  olvidar(){ try { localStorage.removeItem(this.KEY); } catch(e){} },
};
/* El enlace que recibe el policía por WhatsApp: deja el teléfono listo. */
function pintarRondaHabilitar(ruta){
  const [c, n] = String(ruta || '').split('/');
  const ok = /^\d{6}$/.test(c || ''), nombre = decodeURIComponent(n || '');
  if (ok) Ronda.guardar(c, nombre);
  $('#app').innerHTML = `<section class="bienvenida" id="puntoPublico"><div class="foto" style="background-image:url('${Clima.portada()}')"></div>
    <div class="marca"><span class="logo">${LOGO}</span><div><b style="font-size:16px">Barrio ${esc(Store.s.config.nombre)}</b></div></div>
    <h1 style="font-size:28px">${I('shield')} Ronda de esta noche</h1>
    <div class="panel">${ok ? `${aviso('ok', 'check', `Listo${nombre ? ', ' + esc(nombre) : ''}: tu teléfono quedó habilitado`, 'En cada punto de control escaneá el QR con la cámara y tocá "Registrar paso".')}
      <p style="margin:12px 0 4px;opacity:.9">Tu código de ronda (por si te lo pide):</p><div class="codigo-grande">${c.slice(0, 3)} ${c.slice(3)}</div>`
      : `<p style="margin:0"><b>Este enlace no es válido.</b> Pedile a la garita que te lo mande de nuevo.</p>`}</div></section>`;
}
function pintarPunto(codigo){
  const [idk, nombreUrl] = String(codigo || '').split('/');
  const [id, k] = String(idk || '').split('.');
  const nombre = decodeURIComponent(nombreUrl || '') || 'Punto de control';
  const r = Ronda.leer();
  $('#app').innerHTML = `<section class="bienvenida" id="puntoPublico"><div class="foto" style="background-image:url('${Clima.portada()}')"></div>
    <div class="marca"><span class="logo">${LOGO}</span><div><b style="font-size:16px">Barrio ${esc(Store.s.config.nombre)}</b></div></div>
    <h1 style="font-size:28px">${I('pin')} ${esc(nombre)}</h1>
    <div class="panel">${!id || !k ? `<p style="margin:0"><b>Este QR no es válido.</b> Avisá a la garita.</p>` : `
      <form id="puntoForm"><p style="margin:0 0 12px;opacity:.9">Punto de control de la ronda. Registrá tu paso: queda anotado con la hora exacta en la garita.</p>
        ${r ? `<p style="margin:0 0 12px"><b>${esc(r.nombre || 'Policía de ronda')}</b> · código ••${esc(r.c.slice(-2))} <button type="button" class="enlace" id="puntoOtro" style="color:inherit;text-decoration:underline">no soy yo</button></p>`
          : `<div class="field"><label>Código de ronda (6 números)</label><input name="c" required inputmode="numeric" pattern="[0-9]{6}" maxlength="6" autocomplete="one-time-code" placeholder="Te lo da la garita al empezar"></div>`}
        <button class="btn btn-pri btn-block btn-grande">${I('check')}Registrar paso</button>
        <p class="tiny" style="opacity:.75;margin:10px 0 0">Solo cuenta con el código que la garita le da al policía de turno. Tu nombre y la hora del paso los ven solo la garita y la Administración del barrio (Ley 25.326).</p></form>
      <div id="puntoRes"></div>`}</div></section>`;
  $('#puntoOtro')?.addEventListener('click', () => { Ronda.olvidar(); pintarPunto(codigo); });
  const f = $('#puntoForm'); if (!f) return;
  f.addEventListener('submit', async e => {
    e.preventDefault();
    const c = r ? r.c : soloDigitos(f.c.value);
    if (!/^\d{6}$/.test(c)) return;
    const b = f.querySelector('button:not([type="button"])'); b.disabled = true;
    const res = $('#puntoRes');
    try {
      if (typeof Nube !== 'undefined' && Nube.activa() && Nube.db){
        const ref = Nube.db.ref('staff/pasos').push();
        await ref.set({ id:ref.key, punto:id, k, c, nombre:(r && r.nombre) || 'Policía de ronda', at:firebase.database.ServerValue.TIMESTAMP });
      } else {
        const pt = aLista(Store.s.puntos).find(x => x.id === id), cod = aLista(Store.s.rondaCodigos).find(x => x && x.id === c && x.vence > Date.now());
        if (!pt || pt.k !== k || pt.activo === false || !cod) throw new Error('PERMISSION_DENIED');
        Store.cambiar(s => { s.pasos.unshift({ id:uid(), punto:id, k, c, nombre:cod.nombre, at:Date.now() }); });
      }
      if (!r) Ronda.guardar(c, '');
      let hoy = []; try { hoy = JSON.parse(localStorage.getItem('bhc.ronda.pasos') || '[]').filter(x => Date.now() - x.at < 90 * MIN); } catch(err){}
      if (!hoy.some(x => x.id === id)) hoy.push({ id, at:Date.now() });
      try { localStorage.setItem('bhc.ronda.pasos', JSON.stringify(hoy)); } catch(err){}
      f.hidden = true;
      res.innerHTML = `${aviso('ok', 'check', `Paso registrado · ${hora(Date.now())} h`, `${esc(nombre)}. Llevás ${plural(hoy.length, 'punto', 'puntos')} en esta ronda. Seguí al próximo.`)}`;
    } catch(err){
      b.disabled = false;
      const permiso = /permission|PERMISSION/i.test(String(err && err.message));
      if (permiso) Ronda.olvidar();
      res.innerHTML = aviso('danger', 'alert', 'No se pudo registrar', permiso ? 'El código de ronda no es válido o venció, o este QR ya no vale. Pedile el código a la garita.' : 'Revisá la conexión a internet y probá de nuevo.');
      if (permiso && r) setTimeout(() => pintarPunto(codigo), 2500);
    }
  });
}

/* ---------- la Administración: puntos e impresión ---------- */
/* Información fija, de consulta: va plegada y se abre si alguien la
   quiere ver (pedido de Claudio, 27-09). */
function seccionPuntos(){
  const pts = aLista(Store.s.puntos).slice().sort((a, b) => (a.orden || 0) - (b.orden || 0));
  return `<details class="plegable card puntos-plegable" data-k="puntos"><summary><b>${I('qr')} Puntos de control de la ronda (QR)</b><span class="muted small">${pts.length ? plural(pts.filter(x => x.activo !== false).length, 'punto activo', 'puntos activos') : 'sin cargar'} · ver</span></summary>
    ${esAdmin() && pts.length ? `<div style="text-align:right;margin-top:6px"><button class="link" data-a="punto-nuevo">Agregar punto</button></div>` : ''}
    <div style="margin-top:10px">${pts.length ? `<div class="lista">${pts.map(pt => `<div class="it"><span class="ic ic-${pt.activo === false ? 'brand' : 'ok'}" style="width:34px;height:34px;border-radius:11px;display:grid;place-items:center;opacity:${pt.activo === false ? .4 : 1}">${I('qr')}</span>
        <div class="txt"><b>${pt.orden || ''}. ${esc(pt.nombre)}${pt.activo === false ? ' (apagado)' : ''}</b><span>${esc(pt.lugar || '')}</span></div>
        ${esAdmin() ? `<button class="icon-btn" data-a="punto-editar" data-id="${pt.id}" aria-label="Editar">${I('edit')}</button>` : ''}</div>`).join('')}</div>
      ${esAdmin() ? `<div class="btns" style="margin-top:10px"><button class="btn btn-sm btn-pri" data-a="puntos-imprimir">${I('qr')}Imprimir los QR</button></div>` : ''}
      <p class="muted tiny" style="margin:10px 0 0">Conviene ponerlos donde obliguen a recorrer lo importante (no solo las esquinas): el acceso de servicio, el punto más alejado de la garita, el perímetro que linda con bosque o costa, los espacios comunes y la calle más oscura. A 1,5 m de altura, en un poste (nunca frente a una casa), plastificados y con algo de luz.</p>`
      : `<p class="small" style="margin:0 0 10px">Con puntos de control, el policía escanea un QR en cada punto con su teléfono y la ronda queda anotada sola, con la hora exacta de cada punto.</p>
        ${esAdmin() ? `<button class="btn btn-sm btn-pri" data-a="puntos-crear">${I('plus')}Crear los ${PUNTOS_SUGERIDOS.length} puntos sugeridos</button>` : `<p class="muted small" style="margin:0">Los crea la Administración.</p>`}`}</div></details>`;
}
A['puntos-crear'] = () => { if (aLista(Store.s.puntos).length) return; Store.cambiar(s => { s.puntos = puntosSugeridos(); auditar(s, 'Creó los puntos de control de la ronda', `${s.puntos.length} puntos`); }); toast('Puntos creados. Ahora cambiales el nombre si hace falta e imprimí los QR.', 'qr'); refrescar(); };
A['punto-nuevo'] = () => A['punto-editar']({ dataset:{ id:'' } });
A['punto-editar'] = el => {
  const pt = aLista(Store.s.puntos).find(x => x.id === el.dataset.id) || { nombre:'', lugar:'', orden:aLista(Store.s.puntos).length + 1, activo:true };
  hoja(pt.id ? 'Punto de control' : 'Nuevo punto de control', `<form data-f="punto" data-id="${esc(pt.id || '')}">
    <div class="field"><label>Nombre</label><input name="nombre" required maxlength="40" value="${esc(pt.nombre)}"></div>
    <div class="field"><label>Dónde está (para quien lo busque)</label><input name="lugar" maxlength="80" value="${esc(pt.lugar || '')}"></div>
    <div class="grid2"><div class="field"><label>Orden en la ronda</label><input name="orden" type="number" min="1" max="12" value="${pt.orden || 1}"></div>
      <label class="check" style="align-self:end"><input type="checkbox" name="activo" ${pt.activo !== false ? 'checked' : ''}><span>Activo</span></label></div>
    ${pt.id ? `<label class="check"><input type="checkbox" name="nuevaClave"><span>Cambiar la clave (el QR impreso deja de valer: hay que imprimirlo de nuevo)</span></label>` : ''}
    <button class="btn btn-pri btn-block">${I('check')}Guardar</button>
    ${pt.id ? `<button type="button" class="btn btn-danger-soft btn-block" style="margin-top:8px" data-a="punto-borrar" data-id="${pt.id}">${I('trash')}Borrar el punto</button>` : ''}</form>`);
};
F['punto'] = (d, form) => {
  const id = form.dataset.id;
  if (!id && aLista(Store.s.puntos).length >= 12) return toast('Hasta 12 puntos', 'qr');
  Store.cambiar(s => {
    let pt = s.puntos.find(x => x.id === id);
    if (!pt){ pt = { id:'pt' + claveAzar().slice(0, 6), k:claveAzar(), at:Date.now() }; s.puntos.push(pt); }
    Object.assign(pt, { nombre:d.nombre.trim(), lugar:(d.lugar || '').trim(), orden:Math.min(12, Math.max(1, +d.orden || 1)), activo:!!d.activo });
    if (d.nuevaClave) pt.k = claveAzar();
    auditar(s, id ? 'Editó un punto de control' : 'Agregó un punto de control', pt.nombre + (d.nuevaClave ? ' (clave nueva)' : ''));
  });
  cerrarHoja(); toast(d.nuevaClave ? 'Guardado. Imprimí de nuevo el QR de ese punto.' : 'Guardado', 'check'); refrescar();
};
A['punto-borrar'] = async el => {
  if (aLista(Store.s.puntos).length <= 2) return toast('Tienen que quedar al menos dos puntos', 'qr');
  if (!await confirmar('Borrar el punto', 'Su QR deja de valer. Los pasos ya registrados quedan en la historia.', { si:'Borrar', peligro:true })) return;
  Store.cambiar(s => { const pt = s.puntos.find(x => x.id === el.dataset.id); s.puntos = s.puntos.filter(x => x.id !== el.dataset.id); auditar(s, 'Borró un punto de control', pt?.nombre || ''); });
  cerrarHoja(); refrescar();
};
const enlacePunto = pt => location.origin + location.pathname.replace(/[^/]*$/, '') + (typeof Nube !== 'undefined' && Nube.activa() ? '' : '?local') + `#/punto/${pt.id}.${pt.k}/${encodeURIComponent(pt.nombre)}`;
A['puntos-imprimir'] = async () => {
  const q = await cargarQR();
  if (!q) return toast('Hace falta internet para dibujar los QR', 'alert');
  const svg = t => { const qr = q(0, 'M'); qr.addData(t); qr.make(); return qr.createSvgTag({ cellSize:6, margin:2, scalable:true }); };
  imprimir('Puntos de control de la ronda', `<style>.pq{page-break-inside:avoid;border:2px solid #0b3c47;border-radius:16px;padding:18px;margin:0 0 18px;text-align:center}.pq svg{width:62mm;height:62mm}.pq h2{margin:4px 0}.pq p{margin:4px 0}</style>
    ${puntosActivos().map(pt => `<div class="pq"><p style="letter-spacing:.1em;text-transform:uppercase;font-size:11px">Barrio ${esc(Store.s.config.nombre)} · Punto de control ${pt.orden || ''}</p>
      <h2>${esc(pt.nombre)}</h2>${svg(enlacePunto(pt))}
      <p><b>Ronda: escaneá este código con la cámara de tu teléfono</b> y tocá "Registrar paso".</p>
      <p style="font-size:11px;color:#555">${esc(pt.lugar || '')} · Si lo ves dañado o arrancado, avisá a la garita.</p></div>`).join('')}`);
};

/* Ingreso y salida del policía: DÍA, TURNO de la garita y HORA, en ese
   orden (pedido de Claudio, 27-09). El turno es el de la garita en que
   entró o salió (puede no ser el que está abierto si se anota tarde). */
const momentoDe = (dia, hhmm) => { const d = /^\d{4}-\d{2}-\d{2}$/.test(dia || '') ? fechaDe(dia) : new Date(); const [h, m] = String(hhmm || '').split(':').map(Number); if (isNaN(h)) return Date.now(); d.setHours(h, m || 0, 0, 0); return d.getTime(); };
const camposDiaTurnoHora = (etqHora, nombreHora, turnoSel = '') => `<div class="grid3 dia-turno-hora">
    <div class="field"><label>Día</label><input name="dia" type="date" required value="${hoyISO()}" max="${hoyISO()}"></div>
    <div class="field"><label>Turno de la garita</label><select name="turno">${turnosConfig().map(x => `<option value="${esc(x.nombre)}" ${x.nombre === turnoSel ? 'selected' : ''}>${esc(x.nombre)} · ${x.desde}–${x.hasta}</option>`).join('')}</select></div>
    <div class="field"><label>${etqHora}</label><input name="${nombreHora}" type="time" required value="${horaInput(Date.now())}"></div></div>`;
const turnoElegido = n => (turnosConfig().find(x => x.nombre === n) || turnoAbierto() || turnoDeAhora() || {}).nombre || (turnoAbierto() || {}).turno || '';
const correoValido = e => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
A['policia-nuevo'] = () => {
  const t = turnoAbierto(); if (!t) return toast('Primero tiene que haber un turno abierto', 'clock');
  const con = [...policiasConocidos().values()];
  hoja('Ingreso del policía', `<form data-f="policia-nuevo">
    ${camposDiaTurnoHora('Hora de ingreso', 'entra', t.turno)}
    <div class="field"><label>Nombre y apellido</label><input name="nombre" list="policiasLista" required maxlength="60" autocomplete="off" placeholder="Nombre y apellido"></div>
    <datalist id="policiasLista">${con.map(p => `<option value="${esc(p.nombre)}">${p.matricula ? 'Mat. ' + esc(p.matricula) : ''}</option>`).join('')}</datalist>
    <div class="grid2"><div class="field"><label>Matrícula / legajo</label><input name="matricula" maxlength="20" autocomplete="off" placeholder="Si ya vino antes, se completa sola"></div>
      <div class="field"><label>Celular del policía</label><input name="tel" type="tel" inputmode="tel" maxlength="20" autocomplete="off" placeholder="2901 15 123456"></div></div>
    <div class="field"><label>Correo del policía</label><input name="email" type="email" inputmode="email" maxlength="80" autocomplete="off" placeholder="Si ya vino antes, se completa solo">
      <div class="ayuda">Al registrar su salida, la app le manda por correo la <b>constancia de su servicio</b>: día, turno y hora de ingreso y de salida, con qué guardias estuvo y cada ronda con la hora de cada QR.</div></div>
    <div class="ayuda" style="margin:-4px 0 12px">Con el celular se le manda por WhatsApp su <b>código de ronda</b> de esta noche. Sin ese código, los QR de los puntos no registran nada: así un vecino que escanee un punto no puede hacer pasar una ronda.</div>
    <button class="btn btn-pri btn-block">${I('check')}Registrar el ingreso</button></form>`);
};
F['policia-nuevo'] = d => {
  const t = turnoAbierto(); if (!t) return;
  const k = claveNombre(d.nombre); if (!k) return toast('Falta el nombre', 'users');
  const entra = momentoDe(d.dia, d.entra);
  if (entra > Date.now() + 10 * MIN) return toast('El ingreso no puede ser más tarde que ahora: revisá el día y la hora', 'clock');
  if (Date.now() - entra > DIA) return toast('Revisá el día: el ingreso da más de 24 horas atrás', 'clock');
  const email = String(d.email || '').trim().toLowerCase();
  if (email && !correoValido(email)) return toast('Revisá el correo del policía', 'mail');
  const ya = policiasConocidos().get(k) || {};
  const p = { id:uid(), nombre: ya.nombre || conMayusculas(d.nombre), matricula: String(d.matricula || '').trim() || ya.matricula || '', tel: String(d.tel || '').trim() || ya.tel || '',
    email: email || ya.email || '', entra, turnoEntra: turnoElegido(d.turno), rondas:[] };
  if (policiasAdentro(t).some(q => claveNombre(q.nombre) === k)) return toast('Ese policía ya está anotado en este turno', 'users');
  p.codigo = codigoRondaNuevo();
  Store.cambiar(s => {
    const x = aLista(s.bitacora).find(b => b.id === t.id); if (!x) return;
    x.policias = [...policiasDe(x), p];
    s.rondaCodigos = [...aLista(s.rondaCodigos).filter(c => c && c.vence > Date.now()), { id:p.codigo, pid:p.id, nombre:p.nombre, vence:Date.now() + CODIGO_VIGENCIA }];
    s.bitacora.unshift({ id:uid(), autor:yo().id, tipo:'acceso', texto:`Ingreso del policía ${p.nombre}${p.matricula ? ' (mat. ' + p.matricula + ')' : ''} · ${fechaCorta(isoDe(new Date(entra)))} · turno ${p.turnoEntra} · ${hora(p.entra)} h.`, at:Date.now() });
  });
  cerrarHoja(); toast(`Ingreso de ${p.nombre} anotado`, 'shield'); refrescar();
  mostrarCodigoRonda(p.id);
};

/* =========================================================
   CÓDIGO DE RONDA: que el paso lo registre EL POLICÍA y no cualquiera
   Una página web no puede saber el número del teléfono que la abre (ni en
   Android ni en iPhone). Por eso, al registrar el ingreso, la app le da al
   policía un código de 6 números solo para él y solo por esa noche, y la
   garita se lo manda por WhatsApp a su celular con un enlace que deja el
   teléfono habilitado. Cada escaneo lleva el código, y LA BASE rechaza los
   pasos sin un código vigente (staff/rondaCodigos/<código>, que solo leen la
   garita y la Administración): un vecino que escanee un QR no registra nada.
   Vence a las 14 h y se borra con la salida del policía.
   ========================================================= */
const CODIGO_VIGENCIA = 14 * HORA;
function codigoRondaNuevo(){
  const usados = new Set(aLista(Store.s.rondaCodigos).map(c => c && c.id));
  let c; do { const a = new Uint32Array(1); crypto.getRandomValues(a); c = String(100000 + a[0] % 900000); } while (usados.has(c));
  return c;
}
const codigoVigente = pid => aLista(Store.s.rondaCodigos).find(c => c && c.pid === pid && c.vence > Date.now()) || null;
const bajarCodigo = (s, pid) => { s.rondaCodigos = aLista(s.rondaCodigos).filter(c => c && c.pid !== pid); };
const enlaceRonda = (codigo, nombre) => location.origin + location.pathname.replace(/[^/]*$/, '') + (typeof Nube !== 'undefined' && Nube.activa() ? '' : '?local') + `#/ronda/${codigo}/${encodeURIComponent(nombre)}`;
function textoCodigoRonda(p, c){
  return `${p.nombre}: tu código de ronda de hoy en el Barrio ${Store.s.config.nombre} es ${c.id}.\n\nTocá este enlace para dejar tu teléfono listo: ${enlaceRonda(c.id, p.nombre)}\n\nEn cada punto de control escaneá el QR con la cámara y tocá "Registrar paso". Si te pide el código, es ${c.id}. Vence mañana a las ${hora(c.vence)} h.`;
}
function mostrarCodigoRonda(pid){
  const t = turnoAbierto(), p = t && policiasDe(t).find(x => x.id === pid), c = codigoVigente(pid);
  if (!p || !c) return;
  const wa = p.tel && typeof waNumeroAR === 'function' ? waNumeroAR(p.tel) : '';
  hoja('Código de ronda', `<p class="small" style="margin:0 0 10px">Es de <b>${esc(p.nombre)}</b>, solo por esta noche (vence a las ${hora(c.vence)} h). Sin este código, los QR de los puntos no registran nada.</p>
    <div class="codigo-grande">${c.id.slice(0, 3)} ${c.id.slice(3)}</div>
    ${wa ? `<a class="btn btn-ok btn-block" href="https://wa.me/${wa}?text=${encodeURIComponent(textoCodigoRonda(p, c))}" target="_blank" rel="noopener">${I('send')}Mandárselo por WhatsApp</a>`
      : `<p class="muted small" style="margin:10px 0">No se anotó su celular: dictáselo o copiá el mensaje y mandáselo.</p>`}
    <button class="btn btn-sec btn-block" style="margin-top:8px" data-a="copiar" data-v="${esc(textoCodigoRonda(p, c))}">${I('copy')}Copiar el mensaje</button>
    <p class="muted tiny" style="margin:10px 0 0">El código se borra cuando registrás la salida del policía. Si hace falta uno nuevo (por ejemplo, si se lo pasó a otra persona), tocá "Código nuevo" en su tarjeta.</p>`);
}
A['policia-codigo'] = el => mostrarCodigoRonda(el.dataset.id);
A['policia-codigo-nuevo'] = async el => {
  if (!await confirmar('Código nuevo', 'El código anterior deja de valer al instante. Hay que mandarle el nuevo al policía.', { si:'Generar otro' })) return;
  const t = turnoAbierto(), p = t && policiasDe(t).find(x => x.id === el.dataset.id); if (!p) return;
  const c = codigoRondaNuevo();
  Store.cambiar(s => { bajarCodigo(s, p.id); s.rondaCodigos.push({ id:c, pid:p.id, nombre:p.nombre, vence:Date.now() + CODIGO_VIGENCIA });
    s.bitacora.unshift({ id:uid(), autor:yo().id, tipo:'acceso', texto:`Se cambió el código de ronda del policía ${p.nombre}.`, at:Date.now() }); });
  mostrarCodigoRonda(p.id);
};
A['policia-ronda'] = el => {
  const pid = el.dataset.id, ahora = Date.now();
  let fin = null;
  let incompleta = false;
  cambiarPolicia(pid, (p, x, s) => {
    const rc = rondaEnCurso(p);
    if (!rc){ p.rondas.push({ id:uid(), inicio:ahora }); return; }
    rc.fin = ahora; fin = rc;
    /* Si escaneó QR y le faltaron puntos, queda INCOMPLETA en la bitácora. */
    if (conQR(rc)) incompleta = cerrarRondaIncompleta(s, p, rc, ahora, 'la garita la dio por terminada');
  }, p => incompleta ? null : fin ? `Ronda ${p.rondas.indexOf(fin) + 1} del policía ${p.nombre}: ${hora(fin.inicio)} a ${hora(fin.fin)} h (${minutos(fin.inicio, fin.fin)} min)${conQR(fin) ? ` · QR ${estadoRonda(fin).n}/${estadoRonda(fin).total} puntos` : ''}.` : `El policía ${p.nombre} sale a la ronda ${p.rondas.length} · ${hora(ahora)} h.`);
  toast(fin ? (incompleta ? 'Ronda cerrada como incompleta' : 'Ronda terminada') : 'Ronda en marcha', 'shield');
};
A['policia-ronda-mano'] = el => hoja('Anotar una ronda', `<form data-f="policia-ronda-mano"><input type="hidden" name="pid" value="${esc(el.dataset.id)}">
  <div class="grid2"><div class="field"><label>Salió</label><input name="desde" type="time" required value="${horaInput(Date.now() - RONDA_MIN * MIN)}"></div>
    <div class="field"><label>Volvió</label><input name="hasta" type="time" required value="${horaInput(Date.now())}"></div></div>
  <div class="ayuda" style="margin-bottom:12px">Para las rondas que no se anotaron en el momento. Una ronda caminando lleva unos ${RONDA_MIN} minutos.</div>
  <button class="btn btn-pri btn-block">${I('check')}Anotar la ronda</button></form>`);
F['policia-ronda-mano'] = d => {
  const inicio = horaPasada(d.desde); let fin = horaPasada(d.hasta);
  if (fin < inicio) fin += DIA;
  if (fin - inicio > 4 * HORA) return toast('Revisá las horas: la ronda da más de 4 horas', 'clock');
  cambiarPolicia(d.pid, p => { p.rondas.push({ id:uid(), inicio, fin, aMano:true }); p.rondas.sort((a, b) => a.inicio - b.inicio); },
    p => `Ronda del policía ${p.nombre} (anotada a mano): ${hora(inicio)} a ${hora(fin)} h (${minutos(inicio, fin)} min).`);
  cerrarHoja(); toast('Ronda anotada', 'check');
};
A['policia-ronda-borrar'] = async el => {
  if (!await confirmar('Borrar la ronda', 'Queda anotado en la bitácora que se borró.', { si:'Borrar' })) return;
  cambiarPolicia(el.dataset.id, p => { p.rondas = p.rondas.filter(r => r.id !== el.dataset.v); }, p => `Se borró una ronda del policía ${p.nombre}.`);
};
A['policia-salida'] = el => {
  const t = turnoAbierto(), p = t && policiasDe(t).find(x => x.id === el.dataset.id); if (!p) return;
  hoja('Salida del policía', `<form data-f="policia-salida"><input type="hidden" name="pid" value="${esc(p.id)}">
    <p class="small" style="margin:0 0 10px"><b>${esc(p.nombre)}</b> · ingresó ${fechaCorta(isoDe(new Date(p.entra)))} ${hora(p.entra)} h${p.turnoEntra ? ' · turno ' + esc(p.turnoEntra) : ''} · ${plural(p.rondas.length, 'ronda')}</p>
    ${camposDiaTurnoHora('Hora de salida', 'sale', t.turno)}
    ${p.email ? '' : `<div class="field"><label>Correo del policía (para mandarle la constancia)</label><input name="email" type="email" inputmode="email" maxlength="80" autocomplete="off" placeholder="Opcional"></div>`}
    <p class="muted tiny" style="margin:0 0 12px">Al registrar la salida se cierra su servicio: deja de verse en la portada y queda en <b>Turnos → Servicios del policía</b>, con todo su recorrido. ${p.email ? `La constancia sale por correo a <b>${esc(p.email)}</b>.` : 'Si dejás su correo, le sale la constancia.'}</p>
    <button class="btn btn-pri btn-block">${I('logout')}Registrar la salida</button></form>`);
};
F['policia-salida'] = d => {
  const t = turnoAbierto(), p0 = t && policiasDe(t).find(x => x.id === d.pid); if (!p0) return;
  const sale = momentoDe(d.dia, d.sale);
  if (sale > Date.now() + 10 * MIN) return toast('La salida no puede ser más tarde que ahora: revisá el día y la hora', 'clock');
  if (sale < p0.entra) return toast(`La salida no puede ser antes del ingreso (${fechaCorta(isoDe(new Date(p0.entra)))} ${hora(p0.entra)} h)`, 'clock');
  const email = String(d.email || '').trim().toLowerCase();
  if (email && !correoValido(email)) return toast('Revisá el correo del policía', 'mail');
  const turnoSale = turnoElegido(d.turno);
  Store.cambiar(s => bajarCodigo(s, d.pid));
  cambiarPolicia(d.pid, (p, x, s) => { const rc = rondaEnCurso(p); if (rc) cerrarRondaIncompleta(s, p, rc, Math.max(rc.inicio + MIN, sale), 'el policía se retiró en plena ronda');
      p.sale = Math.max(sale, p.entra + MIN); p.turnoSale = turnoSale; if (email && !p.email) p.email = email; cerrarServicio(s, p); },
    p => `Salida del policía ${p.nombre}${p.matricula ? ' (mat. ' + p.matricula + ')' : ''} · ${fechaCorta(isoDe(new Date(p.sale)))} · turno ${turnoSale} · ${hora(p.sale)} h · ${plural(p.rondas.length, 'ronda')} en el servicio.`);
  cerrarHoja(); toast('Salida anotada. El servicio quedó en Turnos.', 'check');
  mandarConstanciaPolicia(d.pid);
};

/* =========================================================
   EL SERVICIO COMPLETO DE CADA POLICÍA (pedido de Claudio, 27-09)
   Un servicio puede cruzar dos turnos de la garita (entra de tarde y
   sigue de noche): se junta todo por el id del policía. Al registrarse la
   salida se guarda una FOTO del servicio en su registro (p.servicio):
   rondas con la hora de cada QR, guardias con los que estuvo y lo que
   anotó la garita. Así el histórico no depende de que sigan en la base
   los pasos de ronda ni la bitácora de esas horas.
   ========================================================= */
function serviciosPolicia(registros = registrosTurno(), lineas = aLista(Store.s.bitacora)){
  const m = new Map(), regs = registros.filter(r => r && r.tipo === 'turno' && r.abre).sort((a, b) => a.at - b.at);
  regs.forEach(r => policiasDe(r).forEach(p => {
    const sv = m.get(p.id) || { id:p.id, nombre:p.nombre, matricula:'', tel:'', email:'', entra:p.entra, turnoEntra:p.turnoEntra || r.turno, sale:0, turnoSale:'', rondas:[], registros:[] };
    ['matricula', 'tel', 'email'].forEach(k => { if (p[k]) sv[k] = p[k]; });
    p.rondas.forEach(x => { const i = sv.rondas.findIndex(y => y.id === x.id); if (i < 0) sv.rondas.push(x); else sv.rondas[i] = x; });
    sv.registros.push(r.id);
    if (p.sale){ sv.sale = p.sale; sv.turnoSale = p.turnoSale || r.turno; sv.registroSale = r.id; sv.foto = p.servicio || null; sv.constancia = p.constancia || null; }
    m.set(p.id, sv);
  }));
  return [...m.values()].map(sv => {
    /* Firebase no guarda las listas vacías: se rearman al leer. */
    if (sv.foto) return { ...sv, ...sv.foto, rondas: aLista(sv.foto.rondas).filter(Boolean).map(r => ({ ...r, qr:aLista(r.qr), faltan:aLista(r.faltan) })), guardias: aLista(sv.foto.guardias), acciones: aLista(sv.foto.acciones).filter(Boolean) };
    const fin = sv.sale || Date.now();
    const guardias = [...new Set(regs.filter(r => r.at <= fin && (!r.cerradoAt || r.cerradoAt >= sv.entra)).flatMap(r => aLista(r.guardias)))];
    const rondas = sv.rondas.sort((a, b) => a.inicio - b.inicio).map(fotoRonda);
    const acciones = lineas.filter(b => b && b.at >= sv.entra - MIN && b.at <= fin + 5 * MIN && b.tipo !== 'turno' && (b.texto || '').includes(sv.nombre)).sort((a, b) => a.at - b.at).map(b => ({ at:b.at, texto:b.texto }));
    return { ...sv, guardias, rondas, acciones };
  }).sort((a, b) => b.entra - a.entra);
}
/* Una ronda con sus QR "congelados": nombre del punto y hora. */
function fotoRonda(r){
  if (r.qrFoto) return r;
  const pasos = pasosDeRonda(r), vistos = new Set(), qr = [];
  pasos.forEach(x => { if (!vistos.has(x.punto)){ vistos.add(x.punto); qr.push({ n:nombrePunto(x.punto), at:x.at }); } });
  const e = conQR(r) ? estadoRonda(r) : null;
  return { id:r.id, inicio:r.inicio, fin:r.fin || 0, incompleta:!!r.incompleta, aMano:!!r.aMano, conQR:conQR(r), qr, total: e ? e.total : 0, faltan: e ? e.faltan : [], qrFoto:true };
}
/* Guarda la foto del servicio en el registro donde salió el policía. */
function cerrarServicio(s, p){
  const regs = aLista(s.bitacora).filter(b => b && b.tipo === 'turno' && b.abre);
  const sv = serviciosPolicia(regs, aLista(s.bitacora)).find(x => x.id === p.id); if (!sv) return;
  p.servicio = { guardias:sv.guardias, rondas:sv.rondas.map(fotoRonda), acciones:sv.acciones.slice(-60), turnoEntra:sv.turnoEntra, entra:sv.entra, sale:p.sale, turnoSale:p.turnoSale || '' };
}
const estadoRondaTxt = r => r.incompleta ? `INCOMPLETA${r.conQR && r.total ? ` · ${r.qr.length}/${r.total} QR · faltó ${r.faltan.join(', ')}` : ''}`
  : r.conQR && r.total ? `completa · ${r.qr.length}/${r.total} QR` : r.aMano ? 'anotada a mano' : r.fin ? 'sin QR (la anotó la garita)' : 'en curso';
function constanciaHtml(sv){
  const c = Store.s.config, fila = (a, b) => `<tr><td style="padding:4px 10px 4px 0;color:#6c7d7a;white-space:nowrap;vertical-align:top">${a}</td><td style="padding:4px 0">${b}</td></tr>`;
  const inc = sv.rondas.filter(r => r.incompleta).length, dur = sv.sale ? Math.round((sv.sale - sv.entra) / MIN) : 0;
  return Correo.plantilla('Constancia de servicio', `
    <p style="margin:0 0 12px">Hola, ${esc(sv.nombre)}: esta es la constancia de tu servicio en el Barrio ${esc(c.nombre)}, tal como la registró la garita.</p>
    <table style="border-collapse:collapse;font-size:14px;margin:0 0 14px">
      ${fila('Policía', `<b>${esc(sv.nombre)}</b>${sv.matricula ? ' · mat. ' + esc(sv.matricula) : ''}`)}
      ${fila('Ingreso', `${fechaLarga(isoDe(new Date(sv.entra)))} · turno ${esc(sv.turnoEntra || '')} · <b>${hora(sv.entra)} h</b>`)}
      ${fila('Salida', sv.sale ? `${fechaLarga(isoDe(new Date(sv.sale)))} · turno ${esc(sv.turnoSale || '')} · <b>${hora(sv.sale)} h</b>` : 'sigue de servicio')}
      ${dur ? fila('Duración', `${Math.floor(dur / 60)} h ${String(dur % 60).padStart(2, '0')} min`) : ''}
      ${fila('Guardias de la garita', esc(sv.guardias.join(', ') || '—'))}
      ${fila('Rondas', `${sv.rondas.length}${inc ? ` (${inc} incompleta${inc > 1 ? 's' : ''})` : sv.rondas.length && sv.rondas.every(r => r.conQR && r.total) ? ' · todas completas por QR' : ''}`)}
    </table>
    <h3 style="font-size:15px;margin:16px 0 6px">Rondas</h3>
    ${sv.rondas.length ? sv.rondas.map((r, i) => `<p style="margin:0 0 10px"><b>Ronda ${i + 1}</b> · ${hora(r.inicio)}${r.fin ? ' a ' + hora(r.fin) + ' h (' + minutos(r.inicio, r.fin) + ' min)' : ' h · en curso'} · ${esc(estadoRondaTxt(r))}
      ${r.qr.length ? `<br><span style="color:#35504c">${r.qr.map(q => `${esc(q.n)} ${hora(q.at)}`).join(' · ')}</span>` : ''}</p>`).join('') : '<p style="margin:0">No se anotaron rondas.</p>'}
    ${sv.acciones.length ? `<h3 style="font-size:15px;margin:16px 0 6px">Todo lo anotado por la garita</h3>
      <table style="border-collapse:collapse;font-size:13px">${sv.acciones.map(a => fila(hora(a.at), esc(a.texto))).join('')}</table>` : ''}
    <p style="font-size:12px;color:#6c7d7a;margin-top:16px">Constancia emitida por la app del barrio al registrarse tu salida. Si algún dato no coincide, avisá a la garita o a la Administración. Tu nombre, matrícula, celular y correo los ven solo la garita y la Administración del barrio (Ley 25.326).</p>`);
}
async function mandarConstanciaPolicia(pid, { avisar = true } = {}){
  const sv = serviciosPolicia().find(x => x.id === pid); if (!sv || !sv.sale) return;
  if (!sv.email){ if (avisar) toast('El policía no dejó correo: la constancia no salió (queda en Turnos)', 'mail'); return; }
  const r = await Correo.enviarDetalle({ para:sv.email, asunto:`Constancia de servicio · Barrio ${Store.s.config.nombre} · ${fechaCorta(isoDe(new Date(sv.entra)))}`, html:constanciaHtml(sv), tipo:'policia-servicio' });
  /* Queda anotado en su registro si salió o no (se ve en Turnos). */
  Store.cambiar(s => { const x = aLista(s.bitacora).find(b => b.id === sv.registroSale); if (!x) return; x.policias = policiasDe(x);
    const p = x.policias.find(q => q.id === pid); if (p) p.constancia = { at:Date.now(), ok:r.ok, error:r.ok ? '' : String(r.error || '').slice(0, 120), para:sv.email }; });
  if (avisar) toast(r.ok ? `La constancia salió por correo a ${sv.email}` : 'La constancia no salió por correo: ' + r.error, r.ok ? 'mail' : 'alert');
}
A['policia-constancia'] = el => mandarConstanciaPolicia(el.dataset.id);
A['policia-constancia-ver'] = el => { const sv = [...serviciosPolicia(), ...aLista(typeof Historial !== 'undefined' && Historial.servPolicia)].find(x => x.id === el.dataset.id); if (!sv) return;
  hoja('Constancia de servicio', `<div class="card plana" style="padding:0;overflow:hidden">${constanciaHtml(sv)}</div>`, { ancho:'640px' }); };
/* Un servicio en la ventana Turnos: se despliega con todo el recorrido. */
function tarjetaServicio(sv, { conAcciones = true } = {}){
  const inc = sv.rondas.filter(r => r.incompleta).length, c = sv.constancia;
  return `<details class="servicio-pol" data-k="sv-${esc(sv.id)}">
    <summary><span class="ic ic-sky">${I('shield')}</span><span class="sd-txt"><b>${esc(sv.nombre)}${sv.matricula ? ' · mat. ' + esc(sv.matricula) : ''}</b>
      <small>${fechaCorta(isoDe(new Date(sv.entra)))} ${hora(sv.entra)}${sv.sale ? ' → ' + (isoDe(new Date(sv.sale)) !== isoDe(new Date(sv.entra)) ? fechaCorta(isoDe(new Date(sv.sale))) + ' ' : '') + hora(sv.sale) + ' h' : ' · sigue de servicio'} · ${plural(sv.rondas.length, 'ronda')}${inc ? ` (${inc} incompleta${inc > 1 ? 's' : ''})` : ''}</small></span>
      <span class="pill ${!sv.sale ? 'p-accent' : c && c.ok ? 'p-ok' : sv.email ? 'p-warn' : ''}">${!sv.sale ? 'En servicio' : c && c.ok ? 'Constancia enviada' : sv.email ? 'Constancia sin enviar' : 'Sin correo'}</span></summary>
    <div class="sd-mas">
      <div><span class="muted">Ingreso</span><b>${fechaCorta(isoDe(new Date(sv.entra)))} · turno ${esc(sv.turnoEntra || '—')} · ${hora(sv.entra)} h</b></div>
      <div><span class="muted">Salida</span><b>${sv.sale ? `${fechaCorta(isoDe(new Date(sv.sale)))} · turno ${esc(sv.turnoSale || '—')} · ${hora(sv.sale)} h` : '—'}</b></div>
      <div><span class="muted">Guardias</span><b>${esc(sv.guardias.join(', ') || '—')}</b></div>
      ${sv.rondas.map((r, i) => `<div><span class="muted">Ronda ${i + 1}</span><b>${hora(r.inicio)}${r.fin ? '–' + hora(r.fin) + ' (' + minutos(r.inicio, r.fin) + ' min)' : ' · en curso'} · ${esc(estadoRondaTxt(r))}${r.qr.length ? `<br><small class="muted">${r.qr.map(q => `${esc(q.n)} ${hora(q.at)}`).join(' · ')}</small>` : ''}</b></div>`).join('')}
      ${c ? `<div><span class="muted">Constancia</span><b>${c.ok ? `enviada a ${esc(c.para || sv.email)} · ${fechaHora(c.at)}` : `no salió: ${esc(c.error || '')}`}</b></div>` : ''}
      ${conAcciones ? `<div class="btns" style="margin-top:6px"><button class="btn btn-xs btn-sec" data-a="policia-constancia-ver" data-id="${esc(sv.id)}">${I('file')}Ver la constancia</button>
        ${sv.sale && sv.email && sv.registroSale ? `<button class="btn btn-xs btn-sec" data-a="policia-constancia" data-id="${esc(sv.id)}">${I('mail')}${c && c.ok ? 'Reenviar' : 'Mandar'} la constancia</button>` : ''}</div>` : ''}
    </div></details>`;
}
/* En Turnos: los últimos 7 servicios; los anteriores, a pedido. */
function seccionServiciosPolicia(){
  const ls = serviciosPolicia().filter(x => x.sale).slice(0, 7);
  return `${sec('Servicios del policía contratado', `<span class="muted small">últimos 7</span>`)}
    ${ls.length ? `<div class="servicios-lista">${ls.map(sv => tarjetaServicio(sv)).join('')}</div>` : `<div class="card plana small">${I('shield')} Cuando se registre la salida de un policía, su servicio queda acá con todo su recorrido.</div>`}
    <button class="btn btn-sm btn-sec" style="margin-top:8px" data-a="hist-policias">${I('clock')}Ver servicios anteriores</button>`;
}
/* Los anteriores se traen de la base recién cuando se piden: así la app no
   baja meses de rondas al abrir. */
A['hist-policias'] = async () => {
  if (!veGarita()) return;
  Historial.cargando('Servicios del policía');
  try {
    let regs = aLista(Store.s.bitacora);
    if (Historial.hayNube()){
      const v = (await Nube.db.ref('staff/bitacora').orderByChild('at').endAt(Date.now() - Historial.VENTANA.bitacora[1] * DIA).get()).val() || {};
      const ids = new Set(regs.map(b => b && b.id));
      regs = [...regs, ...Object.values(v).filter(b => b && !ids.has(b.id))];
    }
    Historial.servPolicia = serviciosPolicia(regs.filter(b => b && b.tipo === 'turno' && b.abre), regs).filter(x => x.sale);
    pintarHistPolicias('');
  } catch(e){ Historial.fallo(e); }
};
function pintarHistPolicias(q){
  const qq = normTxt(q), todos = aLista(Historial.servPolicia);
  const ls = qq ? todos.filter(x => normTxt(`${x.nombre} ${x.matricula} ${isoDe(new Date(x.entra))} ${x.guardias.join(' ')}`).includes(qq)) : todos;
  hoja('Servicios del policía', `<form class="linea-form" data-f="hist-policias-buscar" style="margin-bottom:10px"><input name="q" value="${esc(q)}" placeholder="Nombre, matrícula, guardia o fecha (2026-09)"><button class="btn btn-pri">${I('search')}</button></form>
    <p class="muted small" style="margin:0 0 10px">${plural(ls.length, 'servicio')}${qq ? ' encontrados' : ' desde el primer día'}.</p>
    <div class="servicios-lista">${ls.slice(0, 200).map(sv => tarjetaServicio(sv, { conAcciones:false })).join('') || '<p class="muted small">Sin servicios.</p>'}</div>
    <button class="btn btn-sec btn-block" style="margin-top:10px" data-a="hist-policias-csv">${I('download')}Descargar la planilla (CSV)</button>`, { ancho:'640px' });
}
F['hist-policias-buscar'] = d => pintarHistPolicias(d.q || '');
A['hist-policias-csv'] = () => csvDe([['ingreso','turno ingreso','salida','turno salida','policía','matrícula','guardias','rondas','incompletas','constancia'],
  ...aLista(Historial.servPolicia).map(x => [fechaHora(x.entra), x.turnoEntra || '', x.sale ? fechaHora(x.sale) : '', x.turnoSale || '', x.nombre, x.matricula || '', x.guardias.join(' / '), x.rondas.length, x.rondas.filter(r => r.incompleta).length, x.constancia && x.constancia.ok ? 'enviada' : ''])], `servicios-policia-${hoyISO()}.csv`);

/* Para la Administración: horas y rondas de cada policía en el mes (sirve
   para controlar lo que se le paga). */
function policiaDelMes(mes = hoyISO().slice(0, 7)){
  const m = new Map();
  registrosTurno().forEach(t => policiasDe(t).forEach(p => {
    if (isoDe(new Date(p.entra)).slice(0, 7) !== mes) return;
    const k = claveNombre(p.nombre), r = m.get(k) || { nombre:p.nombre, matricula:p.matricula, noches:new Set(), horas:0, rondas:0 };
    r.noches.add(isoDe(new Date(p.entra - 6 * HORA)));
    if (p.sale && !p.paso) r.horas += (p.sale - p.entra) / HORA;
    r.rondas += p.rondas.length; m.set(k, r);
  }));
  /* Un policía que pasó de un turno a otro figura en los dos: las horas se
     cuentan donde salió, desde su ingreso original. */
  return [...m.values()].sort((a, b) => a.nombre.localeCompare(b.nombre));
}

/* Quiénes hacen cada turno: el abierto, o el último que se anotó con ese
   nombre (pedido de Claudio, 27-09: "donde dice mañana, tarde y noche
   deben aparecer los nombres de los guardias"). */
function quienesDelTurno(nombre){
  const r = registrosTurno().find(x => claveNombre(x.turno) === claveNombre(nombre));
  return r ? { guardias:aLista(r.guardias), at:r.at, abierto:!r.cerradoAt } : null;
}
/* La Administración arma los turnos y ve quién trabajó en cada uno. */
R.turnos = {
  titulo: 'Turnos de la garita', icon: 'clock', color: 'sky', sub: 'Horarios y quién trabajó en cada turno',
  render(){
    if (!veGarita()) return vacio('lock', 'Solo para la garita, la Administración y la supervisión.');
    const ts = turnosConfig(), hist = registrosTurno().slice(0, 40);
    const fila = i => { const t = ts[i] || {}; return `<div class="grid3 turno-edit"><div class="field"><label>Turno ${i + 1}${i >= 2 ? ' (opcional)' : ''}</label><input name="n${i}" value="${esc(t.nombre || '')}" maxlength="20" placeholder="${['Mañana', 'Tarde', 'Noche', 'Madrugada'][i]}" ${i < 2 ? 'required' : ''}></div>
      <div class="field"><label>Desde</label><input type="time" name="d${i}" value="${esc(t.desde || '')}" ${i < 2 ? 'required' : ''}></div>
      <div class="field"><label>Hasta</label><input type="time" name="h${i}" value="${esc(t.hasta || '')}" ${i < 2 ? 'required' : ''}></div></div>`; };
    return `${bandaTurno()}
      ${sec('Quién hace cada turno')}
      <div class="card turnos-quien">${ts.map(t => { const q = quienesDelTurno(t.nombre);
        return `<div class="tq-fila ${q && q.abierto ? 'ahora' : ''}"><div class="tq-cab"><b>${esc(t.nombre)}</b><span class="muted">${t.desde} a ${t.hasta} h</span>${q && q.abierto ? '<span class="pill p-ok">En curso</span>' : ''}</div>
          <div class="tq-nombres">${q ? `${q.guardias.map(n => `<span class="chip-nombre">${I('user')}${esc(n)}</span>`).join('')}<small class="muted">${q.abierto ? 'desde las ' + hora(q.at) + ' h' : 'último: ' + relDia(isoDe(new Date(q.at))).toLowerCase()}</small>` : '<small class="muted">Todavía no se anotó quién lo hace.</small>'}</div></div>`; }).join('')}
        <p class="muted tiny" style="margin:8px 0 0">Los nombres salen de lo que anota cada turno al empezar. ${esAdmin() ? 'Los horarios se cambian abajo.' : 'Los horarios los define la Administración.'}</p></div>
      ${esAdmin() ? `<details class="plegable card" data-k="horarios"><summary><b>Horarios de los turnos</b><span class="muted small">cambiar</span></summary><form data-f="turnos" style="margin-top:10px">
        ${[0, 1, 2, 3].map(fila).join('')}
        <p class="muted tiny" style="margin:0 0 10px">De 2 a 4 turnos. Un turno puede pasar la medianoche (por ejemplo, de 22:00 a 06:00). Dejá vacíos los que no uses.</p>
        <button class="btn btn-pri btn-block">${I('check')}Guardar los turnos</button></form></details>` : ''}
      ${sec('Últimos turnos')}
      ${hist.length ? `<div class="card">${hist.map(r => `<div class="lista"><div class="it"><span class="ic ic-sky" style="width:34px;height:34px;border-radius:11px;display:grid;place-items:center">${I('shield')}</span>
        <div class="txt"><b>${esc(r.turno)} · ${esc(aLista(r.guardias).join(', '))}</b>
        <span>${relDia(isoDe(new Date(r.at)))} de ${hora(r.at)} a ${r.cerradoAt ? hora(r.cerradoAt) + ' h' + (r.cierreAuto ? ' (se cerró al abrir el siguiente)' : '') : 'ahora · en curso'}${r.cerradoAt ? ` · <button class="link" data-a="parte-ver" data-id="${r.id}">Ver el parte</button>` : ''}</span>
        ${typeof vistoRenglon === 'function' ? vistoRenglon(r) : ''}
        ${policiasDe(r).map(p => `<span>${I('shield')} Policía ${esc(p.nombre)}${p.matricula ? ' · mat. ' + esc(p.matricula) : ''} · ${hora(p.entra)}${p.sale ? '–' + hora(p.sale) : p.paso ? ' · siguió en el turno siguiente' : ' · sigue'} · ${plural(p.rondas.length, 'ronda')}${p.rondas.length ? ': ' + p.rondas.map(x => hora(x.inicio) + (x.fin ? '–' + hora(x.fin) : '')).join(', ') : ''}</span>`).join('')}</div></div></div>`).join('')}</div>`
        : vacio('clock', 'Todavía no se abrió ningún turno.')}
      ${seccionServiciosPolicia()}
      ${seccionPuntos()}
      ${esAdmin() ? (() => { const ms = policiaDelMes(); return sec('Policía contratada · este mes') + (ms.length ? `<div class="card lista">${ms.map(p => `<div class="it"><div class="txt"><b>${esc(p.nombre)}${p.matricula ? ' · mat. ' + esc(p.matricula) : ''}</b>
          <span>${plural(p.noches.size, 'servicio')} · ${p.horas.toFixed(1).replace('.', ',')} h · ${plural(p.rondas, 'ronda')}</span></div></div>`).join('')}</div>
          <p class="muted tiny">Horas desde el ingreso hasta la salida anotados por la garita. Sirve para controlar lo que se le paga.</p>` : vacio('shield', 'Este mes la garita no anotó ingresos del policía.')); })() : ''}`;
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

/* =========================================================
   LO QUE LA GARITA NO PUEDE OLVIDAR HOY (pedido de Claudio, 27-09)
   Al lado de "Garita · domingo 27 de sep.", la lista del día. Cada tarea
   se tilda SOLA cuando la app ve que está hecha (el camión registrado, la
   casa sola revisada, los paquetes entregados, la bitácora con novedades…):
   la guardia no tiene que marcar nada. Arriba lo pendiente, después los
   recordatorios de siempre y abajo lo hecho. Tocar una tarea lleva a
   donde se hace. Lo que no toca hoy (no pasa el camión, no hay casas
   solas) no aparece.
   ========================================================= */
const turnoEsNoche = nombre => { const c = turnosConfig().find(x => x.nombre === nombre); return /noche|madrug/i.test(nombre || '') || (c ? enFranja(c, 23 * 60) || enFranja(c, 2 * 60) : false); };
/* =========================================================
   HOY LA GARITA NO PUEDE OLVIDAR (rehecho a pedido de Claudio, 28-09-2026)
   Antes era una lista fija: salían tachadas cosas que hoy no tocaban
   ("Nadie anunciado", "Ningún paquete") mezcladas con cosas que sí había
   que hacer, y el control de la ART aparecía aunque no viniera nadie.
   Ahora la lista se ARMA SOLA con lo que de verdad hay hoy:
     · lo pedido a la garita (peticiones sin recibir y las vigentes, avisos
       de vecinos, consultas de "llegó sin aviso");
     · lo programado para hoy (visitas y viajes anunciados, ingresos
       frecuentes de este día, obras y proveedores que vienen, el camión,
       los traslados del hotel, el policía del turno de noche, las casas
       solas para revisar);
     · lo pendiente (quién está adentro sin salida, paquetes por entregar,
       alertas de "Estoy bien");
     · y lo de todo turno (la bitácora y el cierre del turno).
   Lo que no está pedido, programado ni pendiente NO sale. Lo ya hecho no
   se lista tachado: queda resumido en un renglón ("Hecho hoy: …").
   ========================================================= */
function tareasGarita(){
  const s = Store.s, hoy = hoyISO(), t = turnoAbierto(), ahora = Date.now(), inicioDia = fechaDe(hoy).getTime(), L = [], hechas = [];
  /* prioridad: 0 urgente · 1 con hora · 2 del día · 3 de todo turno */
  const add = (prio, icon, titulo, det, ir = {}, extra = {}) => L.push({ prio, icon, titulo, det, ir, ...extra });
  const hecho = txt => hechas.push(txt);
  const nombreCasa = id => esc(usuario(id)?.casa || '');
  const lista3 = (xs, f) => xs.slice(0, 3).map(f).join(' · ') + (xs.length > 3 ? ` y ${xs.length - 3} más` : '');

  if (!t) add(0, 'shield', 'Anotar el turno y quiénes están', 'Todavía no se abrió el turno de hoy');
  else hecho(`turno ${esc(t.turno)} abierto (${esc(aLista(t.guardias).join(', '))})`);

  /* Lo urgente: gente esperando en la entrada, alertas y pedidos sin leer. */
  const cons = s.llegadas.filter(l => l.estado === 'consultando');
  if (cons.length) add(0, 'gate', 'Llegó sin aviso: esperando la respuesta del vecino', lista3(cons, l => `${esc(l.nombre)} → ${esc(l.casa || usuario(l.hostId)?.casa || '')}`), { ir:'#garLlegadas' });
  if (typeof Cuidado !== 'undefined' && typeof veListaCuidados === 'function' && veListaCuidados()){ const mal = Cuidado.personas().filter(p => Cuidado.enAlerta(p));
    if (mal.length) add(0, 'heart', '"Estoy bien" o salida sin regreso: llamar o pasar', lista3(mal, p => `${esc(p.casa || '')} · ${esc(primerNombre(p.nombre))}`), { v:'estoy-bien' }); }
  const av = s.avisos.filter(a => !a.visto && ahora - a.at < 6 * HORA);
  if (av.length) add(0, 'bell', 'Avisos de vecinos: leer y marcar "Visto"', plural(av.length, 'sin ver', 'sin ver'), { ir:'#garAvisos' });
  const petP = s.peticiones.filter(p => p.estado === 'pendiente');
  if (petP.length) add(0, 'edit', 'Peticiones de vecinos: recibir y firmar', lista3(petP, p => `${esc(p.casa || '')} · ${esc((TIPOS_PET[p.tipo] || TIPOS_PET.otro).n.toLowerCase())}`), { v:'peticiones' });

  /* El camión, solo el día que pasa. */
  const dias = recoleccionDias(), dh = dias[new Date().getDay()], vol = typeof volsProximos === 'function' && volsProximos().find(v => v.fecha === hoy);
  if (dh || vol){ const ad = Camion.adentro(), paso = camionPasoHoy();
    if (ad) add(0, 'tacho', 'Camión de residuos adentro: registrar la salida', `Entró a las ${hora(ad.entra)} h`, { a:'camion-sale' });
    else if (paso) hecho(`camión (entró ${hora(paso.entra)} h)`);
    else add(1, 'tacho', 'Camión de residuos: registrar la entrada y la salida', `Hoy pasa (${esc(vol ? 'voluminosos' : String(dh).toLowerCase())}). Al registrar la entrada, se avisa solo a todo el barrio.`, { a:'camion-entra' }); }

  /* Quién viene hoy y quién está adentro. */
  const lista = pasesDelDia(hoy), esp = lista.filter(p => estadoPase(p) === 'esperado').sort((a, b) => String(a.desde).localeCompare(String(b.desde))), adn = lista.filter(p => estadoPase(p) === 'adentro');
  if (esp.length) add(1, 'users', `Vienen hoy: ${plural(esp.length, 'visita anunciada', 'visitas anunciadas')}`, lista3(esp, p => `${esc(p.desde || '')} ${esc(p.nombre)} → ${nombreCasa(p.hostId)}${p.patente ? ' · ' + esc(p.patente) : ''}`), { ir:'#garIngresos' }, { hora:esp[0].desde || '' });
  if (adn.length) add(2, 'logout', `Adentro: falta registrar la salida de ${adn.length}`, lista3(adn, p => `${esc(p.nombre)} → ${nombreCasa(p.hostId)}`), { ir:'#garIngresos' });
  const fueron = lista.filter(p => estadoPase(p) === 'salio').length;
  if (fueron) hecho(plural(fueron, 'visita con entrada y salida', 'visitas con entrada y salida'));

  /* Ingresos frecuentes que tienen HOY entre sus días (los de "cualquier día" no son programados). */
  const movsHoy = aLista(s.bitacora).filter(b => b && b.frecId && b.at >= inicioDia);
  const frecHoy = (typeof frecuentes === 'function' ? frecuentes() : []).filter(f => aLista(f.dias).length && frecuenteVigente(f).ok && !frecuenteVigente(f).aviso);
  const frecEntro = f => movsHoy.some(b => b.frecId === f.id && /^Ingreso/.test(b.texto || ''));
  const frecFalta = frecHoy.filter(f => !frecEntro(f));
  if (frecFalta.length) add(1, 'user', `Ingresos frecuentes de hoy: ${plural(frecFalta.length, 'falta llegar', 'faltan llegar')}`, lista3(frecFalta.sort((a, b) => String(a.desde).localeCompare(String(b.desde))), f => `${f.desde ? esc(f.desde) + ' ' : ''}${esc(f.nombre)}${f.empresa ? ' (' + esc(f.empresa) + ')' : ''} → ${esc(f.destino || 'Barrio')}`), { v:'frecuentes' }, { hora:frecFalta[0].desde || '' });

  /* ART: solo si hoy viene alguien de una obra o un proveedor. */
  const deObra = [...esp.filter(p => p.tipo === 'proveedor').map(p => esc(p.nombre)),
    ...frecFalta.filter(f => ['obra', 'proveedor'].includes(f.tipo)).map(f => esc(f.empresa || f.nombre)),
    ...s.obras.filter(o => o.avisoHoy?.fecha === hoy).map(o => `${esc(o.empresa || 'Obra')}${o.casa ? ' (' + esc(o.casa) + ')' : ''}`)];
  const provVencida = aLista(s.proveedores).filter(p => p && p.empresa && (!p.artVence || p.artVence < hoy) && deObra.some(n => normTxt(n).includes(normTxt(p.empresa || '').slice(0, 12))));
  if (deObra.length) add(1, 'wrench', 'Obras y proveedores de hoy: controlar la ART al entrar', `${lista3([...new Set(deObra)], x => x)}${provVencida.length ? ` · <b style="color:var(--danger)">ART vencida: ${provVencida.map(p => esc(p.empresa)).join(', ')} (no entra)</b>` : ''}`, { v:'proveedores' });

  /* Paquetes por entregar y los entregados hoy. */
  const paq = hayPaquetes() ? s.paquetes.filter(p => !p.retirado) : [], entregados = hayPaquetes() ? s.paquetes.filter(p => p.retirado && p.retirado >= inicioDia).length : 0;
  if (paq.length) add(2, 'box', `Paquetes para entregar: ${paq.length}`, `${lista3([...new Set(paq.map(p => loteDelPaquete(p) || '—'))], l => esc(l))} · se entregan con el QR del vecino`, { ir:'#garPaquetes' });
  if (entregados) hecho(plural(entregados, 'paquete entregado', 'paquetes entregados'));

  /* Vans del hotel. */
  if (typeof viajesDelDia === 'function' && viajesDelDia(hoy).length){ const vp = viajesDelDia(hoy).filter(x => x.estado !== 'hecho'), vh = viajesDelDia(hoy).length - vp.length;
    if (vp.length) add(1, 'car', `Vans del hotel: ${plural(vp.length, 'traslado', 'traslados')} por marcar`, `${vp[0].sale ? 'El próximo sale a las ' + esc(vp[0].sale) + ' · ' : ''}marcá cada salida y regreso`, { ir:'.vans-garita' }, { hora:vp[0].sale || '' });
    if (vh) hecho(plural(vh, 'traslado del hotel', 'traslados del hotel')); }

  /* Casas solas. */
  const solas = typeof casasSolas === 'function' ? casasSolas(hoy) : [];
  if (solas.length){ const falta = solas.filter(a => !revisionDeHoy(a));
    if (falta.length) add(2, 'lock', `Casas solas: revisar ${falta.length}`, `${lista3(falta, a => esc(a.casa))} · tocá "Revisada" en cada una (al vecino le llega el aviso)`, { ir:'#garCasas' });
    if (solas.length - falta.length) hecho(plural(solas.length - falta.length, 'casa sola revisada', 'casas solas revisadas')); }

  /* Lo que los vecinos pidieron por escrito y sigue vigente hoy (no dejar pasar, llaves, permisos, paquetes a guardar). */
  const vig = s.peticiones.filter(p => p.estado === 'en_funciones' && p.tipo !== 'viaje' && (!p.desde || p.desde <= hoy) && (!p.hasta || p.hasta >= hoy));
  if (vig.length) add(2, 'edit', `Pedidos vigentes de vecinos: ${vig.length}`, lista3(vig.sort((a, b) => (b.tipo === 'nopasar') - (a.tipo === 'nopasar')), p => `${p.tipo === 'nopasar' ? '<b>' : ''}${esc(p.casa || '')} · ${esc((TIPOS_PET[p.tipo] || TIPOS_PET.otro).n.toLowerCase())}${p.tipo === 'nopasar' ? '</b>' : ''}`), { v:'peticiones', p:'en_funciones' }, { info:true });

  /* El policía contratado: en el turno de noche, o si ya está registrado. */
  const pols = t ? policiasDe(t) : [], adentroP = t ? policiasAdentro(t) : [];
  if (adentroP.length){ const rondas = pols.reduce((n, p) => n + p.rondas.length, 0), enCurso = adentroP.map(rondaEnCurso).find(Boolean);
    add(1, 'shield', 'Policía contratado: rondas y, al irse, su salida', `${adentroP.map(p => esc(p.nombre)).join(', ')} de servicio · ${enCurso ? `ronda en curso desde las ${hora(enCurso.inicio)} h` : plural(rondas, 'ronda') + ' hechas'}`, { ir:'.policia-card' }); }
  else if (t && turnoEsNoche(t.turno) && !pols.length) add(1, 'shield', 'Policía contratado: registrar su ingreso', 'Turno de noche: cuando llegue, anotalo y mandale su código de ronda', { a:'policia-nuevo' });
  else if (pols.length) hecho(`servicio del policía (${plural(pols.reduce((n, p) => n + p.rondas.length, 0), 'ronda')})`);

  /* De todo turno: la bitácora y el cierre. */
  const manual = t && aLista(s.bitacora).some(b => b && b.at >= t.at && b.autor && b.autor !== 'sistema' && ['novedad', 'incidente', 'ronda'].includes(b.tipo));
  if (t && !manual) add(3, 'book', 'Bitácora: anotar las novedades del turno', 'Todavía no se anotó ninguna en este turno', { v:'bitacora' });
  else if (manual) hecho('novedades en la bitácora');
  if (t){ const fin = (turnosConfig().find(x => x.nombre === t.turno) || {}).hasta || '';
    add(3, 'clock', 'Al terminar: cerrar el turno con las novedades', fin ? `El turno ${esc(t.turno)} termina a las ${fin} h` : 'Deja todo anotado para el que entra', { a:'cerrar-turno' }); }

  const orden = L.sort((a, b) => a.prio - b.prio || String(a.hora || '99').localeCompare(String(b.hora || '99')));
  const pend = orden.filter(x => !x.info && x.prio < 3).length;
  const opera = esGuardia();
  const attrs = x => x.ir.a && opera ? `data-a="${x.ir.a}"` : x.ir.v ? `data-a="abrir" data-v="${x.ir.v}"${x.ir.p ? ` data-p="${esc(x.ir.p)}"` : ''}` : x.ir.ir ? `data-a="garita-ir" data-v="${esc(x.ir.ir)}"` : 'disabled';
  return `<details class="tareas-dia card" data-k="tareas-dia" open>
    <summary><b>${I('clipboard')}Hoy la garita no puede olvidar</b><span class="pill ${pend ? 'p-warn' : 'p-ok'}">${pend ? plural(pend, 'para hacer', 'para hacer') : 'todo al día'}</span></summary>
    <div class="td-lista">${orden.map(x => `<button type="button" class="td-item td-${x.prio === 0 ? 'urge' : x.prio === 3 ? 'turno' : x.info ? 'info' : 'pend'}" ${attrs(x)}><span class="td-ic">${I(x.icon)}</span><span class="td-txt"><b>${x.titulo}</b><small>${x.det}</small></span></button>`).join('')}</div>
    ${hechas.length ? `<p class="td-hecho-hoy">${I('check')} <b>Hecho hoy:</b> ${hechas.join(' · ')}</p>` : ''}
    <p class="muted tiny" style="margin:8px 2px 0">Se arma sola con lo pedido, lo programado y lo pendiente de hoy; lo que no hay, no aparece. Cada cosa sale de la lista cuando la app ve que está hecha.</p></details>`;
}
A['garita-ir'] = el => { const d = document.querySelector(el.dataset.v); if (d) d.scrollIntoView({ behavior:'smooth', block:'start' }); else toast('Ahora no hay nada de eso en la garita', 'check'); };

R.garita = {
  titulo: 'Garita', icon: 'gate', color: 'brand', ancha: true, sub: () => fechaLarga(hoyISO()),
  render(){
    if (!veGarita()) return vacio('lock', 'La garita es solo para la guardia, la Administración y la supervisión.');
    if (esGuardia() && !turnoListo()) return formularioTurno();
    const s = Store.s, hoy = hoyISO();
    const lista = pasesDelDia(hoy).sort((a, b) => a.desde.localeCompare(b.desde));
    const adentro = lista.filter(p => estadoPase(p) === 'adentro').length;
    const esperados = lista.filter(p => estadoPase(p) === 'esperado').length;
    const paq = hayPaquetes() ? s.paquetes.filter(p => !p.retirado) : [];
    const llegadas = s.llegadas.filter(l => l.estado === 'consultando' || Date.now() - l.at < 30 * MIN);
    const solas = typeof casasSolas === 'function' ? casasSolas(hoy) : [];
    const avisos = s.avisos.filter(a => Date.now() - a.at < 6 * HORA);
    const vol = s.avistamientos.filter(a => Date.now() - a.at < DIA);
    const u = yo();
    /* La Administración mira la garita en vivo, sin tocarla (soloGarita). */
    const opera = esGuardia();
    /* En computadora: el título arriba a la izquierda y, a su derecha, la
       lista del día en una columna que acompaña al bajar. En el celular,
       la lista va debajo del título. */
    return `<div class="garita-grid ${PILA.length === 1 ? '' : 'sin-titulo'}">
      ${PILA.length === 1 ? `<div class="garita-titulo titulo-vista"><h1>Garita</h1><p>${fechaLarga(hoy)}</p></div>` : ''}
      <aside class="garita-lado">${tareasGarita()}</aside>
      <div class="garita-main">
      ${opera ? '' : `<div class="garita-vivo">${I('eye')}<div class="grow"><b>Garita en vivo · solo para mirar</b><span>Registrar ingresos${hayPaquetes() ? ', paquetes' : ''}, el camión, el policía, la bitácora y las peticiones es tarea exclusiva de la garita. Desde acá se ve todo al instante, sin tocar nada.</span></div>
        <button class="btn btn-xs btn-pri" data-a="abrir" data-v="privado" data-p="${esSupervisor() ? 'supGarita' : 'interno'}">${I('chat')}Escribirle a la garita</button></div>`}
      ${bandaTurno()}
      ${bandaPolicia()}
      ${bandaCamion(opera)}
      ${typeof bandaVansGarita === 'function' ? bandaVansGarita(opera) : ''}
      ${typeof bandaHotel === 'function' ? bandaHotel(opera) : ''}
      ${typeof bandaDeaEnCurso === 'function' ? bandaDeaEnCurso() : ''}
      ${typeof bandaCuidadoGarita === 'function' ? bandaCuidadoGarita() : ''}
      ${alertas().filter(alertaActiva).map(a => { const ay = destinatariosAlerta(a).filter(v => a.respuestas?.[v.id]?.r === 'ayuda').length;
        return aviso(ay ? 'danger latido' : 'warn', 'siren', `Aviso urgente activo: ${esc(a.titulo)}`, `${esc(a.zona)} · ${ay ? plural(ay, 'casa pide', 'casas piden') + ' ayuda' : 'nadie pidió ayuda'}`, `<button class="btn btn-xs btn-sec" data-a="abrir" data-v="alertas">Ver respuestas</button>`); }).join('')}
      ${Clima.alertas().map(a => aviso(a.nivel, a.icon, a.t, a.x)).join('')}
      <div class="garita-kpis"><div class="kpi"><b>${esperados}</b><span>Esperados</span></div><div class="kpi"><b>${adentro}</b><span>Adentro</span></div>${hayPaquetes() ? `<div class="kpi"><b>${paq.length}</b><span>Paquetes</span></div>` : ''}</div>
      ${opera ? `<form data-f="validar" class="card">
        <div class="lbl">Código, patente o DNI</div>
        <div class="validador"><input name="q" id="qValidar" autocomplete="off" placeholder="482913" maxlength="12" inputmode="text">
          <button class="btn btn-pri">${I('search')}</button></div>
        <div class="btns" style="margin-top:10px"><button type="button" class="btn btn-sm btn-sec" data-a="escanear">${I('scan')}Escanear QR</button>
          <button type="button" class="btn btn-sm btn-sec" data-a="llegada-nueva">${I('gate')}Llegó sin aviso</button>
          ${hayPaquetes() ? `<button type="button" class="btn btn-sm btn-sec" data-a="paquete-nuevo">${I('box')}Llegó un paquete</button>` : ''}
          <button type="button" class="btn btn-sm btn-sec" data-a="abrir" data-v="frecuentes">${I('qr')}Ingresos frecuentes</button>
          <button type="button" class="btn btn-sm btn-sec" data-a="hist-visitas-todo">${I('clock')}Historial de visitas</button>
          <button type="button" class="btn btn-sm btn-sec" data-a="alerta-nueva">${I('siren')}Aviso urgente</button></div>
      </form>` : `<div class="btns" style="margin:0 0 12px"><button type="button" class="btn btn-sm btn-sec" data-a="hist-visitas-todo">${I('clock')}Historial de visitas</button>
          <button type="button" class="btn btn-sm btn-sec" data-a="abrir" data-v="bitacora">${I('book')}Bitácora</button>
          <button type="button" class="btn btn-sm btn-sec" data-a="abrir" data-v="frecuentes">${I('qr')}Ingresos frecuentes</button></div>`}
      ${s.peticiones.filter(p => p.estado === 'pendiente').map(p => aviso('warn latido', 'edit', `Petición de ${esc(p.casa)} sin recibir`, esc(TIPOS_PET[p.tipo]?.n || '') + (opera ? '' : ' · la recibe y la firma la garita'), `<button class="btn btn-xs btn-sec" data-a="ver-peticion" data-id="${p.id}">${opera ? 'Leer y firmar' : 'Ver'}</button>`)).join('')}
      ${s.obras.filter(o => o.avisoHoy?.fecha === hoy).map(o => aviso('info', 'truck', `Obra en ${esc(o.casa)}: ${esc(o.avisoHoy.texto)}`, o.avisoHoy.hora ? `Desde las ${o.avisoHoy.hora} h · ${esc(o.empresa || '')}` : esc(o.empresa || ''))).join('')}
      ${(() => { const rs = s.peticiones.filter(p => p.tipo === 'nopasar' && p.estado === 'en_funciones' && (!p.hasta || p.hasta >= hoy)); return rs.length ? sec('Restricciones de ingreso vigentes') + rs.map(p => `<button class="superficie peligro" data-a="ver-peticion" data-id="${p.id}"><span class="ic ic-danger">${I('x')}</span><span class="txt"><b>${esc(p.casa)}</b><small>${esc(p.texto.slice(0, 90))}</small></span>${I('right')}</button>`).join('') : ''; })()}
      ${llegadas.length ? '<span id="garLlegadas" class="ancla"></span>' + sec('Consultando al vecino') + llegadas.map(l => { const h = usuario(l.hostId) || {}; const min = Math.floor((Date.now() - l.at) / MIN);
        return `<div class="card" style="padding:13px 14px"><div class="pase"><span class="ic ic-warn">${I('gate')}</span><div class="datos"><b>${esc(l.nombre)} → ${esc(h.casa || '')}</b><span>${esc(l.motivo || '')}${l.patente ? ' · ' + esc(l.patente) : ''} · hace ${min} min</span></div>
          <span class="estado e-${l.estado}">${{ consultando:'Esperando', autorizado:'Puede pasar', rechazado:'No autorizado' }[l.estado]}</span></div>
          ${opera && l.estado === 'consultando' && min >= 2 && h.tel ? `<div class="btns" style="margin-top:10px"><a class="btn btn-sm btn-sec" href="${telLink(h.tel)}">${I('phone')}Llamar a ${esc(h.nombre.split(' ')[0])}</a></div>` : ''}</div>`; }).join('') : ''}
      ${avisos.length ? '<span id="garAvisos" class="ancla"></span>' + sec('Avisos de vecinos') + avisos.map(a => { const v = usuario(a.userId) || {}, t = AVISOS_GUARDIA[a.tipo] || AVISOS_GUARDIA.otro;
        return `<div class="card" style="padding:12px 14px"><div class="pase"><span class="ic ic-warn">${I(t.icon)}</span><div class="datos"><b>${esc(v.casa || '')}: ${t.t}</b><span>${esc(a.texto || t.x)} · ${hace(a.at)}</span></div>
          ${a.visto ? `<span class="estado e-autorizado">Visto</span>` : opera ? `<button class="btn btn-xs btn-ok" data-a="aviso-visto" data-id="${a.id}">Visto</button>` : `<span class="estado e-consultando">Sin ver</span>`}</div></div>`; }).join('') : ''}
      <span id="garIngresos" class="ancla"></span>${sec('Ingresos de hoy', `<span class="muted small">${lista.length}</span>`)}
      ${lista.length ? lista.map(p => tarjetaPase(p, { garita:true })).join('') : vacio('users', 'Nadie anunciado para hoy.')}
      ${paq.length ? '<span id="garPaquetes" class="ancla"></span>' + sec('Paquetes en la garita', opera ? `<button class="link" data-a="escanear" data-v="Apuntá al QR de retiro del vecino (cambia cada 30 segundos)">${I('scan')}Leer QR de retiro</button>` : '') + paq.map(p =>
 `<div class="card" style="padding:12px 14px"><div class="pase"><span class="ic ic-wood">${I('box')}</span>
        <div class="datos"><b>${esc(loteDelPaquete(p))} · ${esc(p.empresa)}</b><span>${esc(p.detalle || '')} · llegó ${hace(p.recibido)}</span></div>
        ${opera ? `<button class="btn btn-xs btn-ok" data-a="paquete-entregar" data-id="${p.id}">${I('qr')}Entregar</button>` : `<span class="estado e-esperado">En la garita</span>`}</div></div>`).join('') : ''}

      ${solas.length && typeof bandaCasasSolas === 'function' ? '<span id="garCasas" class="ancla"></span>' + bandaCasasSolas(opera) : ''}
      ${vol.length ? sec('Avistamientos de hoy') + vol.map(a => `<div class="card plana" style="padding:10px 14px"><b>${esc(ESPECIES[a.especie]?.n || a.especie)}</b> · ${esc(a.lugar || '')} <span class="muted small">· ${hace(a.at)}</span></div>`).join('') : ''}
      ${PILA.length === 1 ? sec('Más') + `<div class="mosaico">
        ${teja({ v:'peticiones', icon:'edit', color:'warn', t:'Peticiones', s:'Recibir y firmar', badge: s.peticiones.filter(p => p.estado === 'pendiente').length })}
        ${teja({ v:'bitacora', icon:'book', color:'wood', t:'Bitácora', s:'Libro de guardia' })}
        ${teja({ a:'nuevo-post', v:'guardia', icon:'muro', t:'Escribir en el pizarrón', s:'Les suena a todos los vecinos' })}
        ${teja({ v:'vecinos', icon:'search', color:'brand', t:'Buscar un vecino', s:'Por nombre, apellido o lote, con la foto de la casa' })}
        ${teja({ v:'privado', icon:'lock', color:'accent', t:'Mensajes con vecinos', s:'Avisar algo a un lote', badge: s.privados.filter(h => (h.con || 'admin') === 'guardia').reduce((n, h) => n + aLista(h.msgs).filter(m => m.from === 'vecino' && !m.leido).length, 0) })}
        ${esGuardia() && typeof haySupervision === 'function' && haySupervision() ? teja({ v:'privado', p:'supGarita', icon:'eye', color:'brand', t:'Supervisión', s:'Mensajes con quien supervisa la guardia', badge: sinLeerDeSupervision('supGarita') }) : ''}
        ${esGuardia() ? teja({ v:'privado', p:'interno', icon:'sliders', color:'accent', t:'Administración', s:'Mensajes entre la garita y la Administración', badge: s.privados.filter(h => h.con === 'interno' && h.userId === u.id).reduce((n, h) => n + aLista(h.msgs).filter(m => m.from === 'admin' && !m.leido).length, 0) }) : ''}
        ${teja({ v:'turnos', icon:'clock', color:'sky', t:'Turnos', s:'Horarios y quién trabajó' })}
        ${teja({ v:'proveedores', icon:'box', color:'accent', t:'Proveedores', s:'Controlar ART', n: s.proveedores.filter(p => artEstado(p)[1] === 'danger').length || '' })}
        ${teja({ v:'obras', icon:'wrench', color:'wood', t:'Obras', s:'Avisos del día' })}
        ${teja({ v:'vuelos', icon:'send', color:'accent', t:'Vuelos USH', s:'Arribos y partidas' })}
        ${teja({ v:'emergencias', icon:'siren', color:'danger', t:'Emergencias', s:'Teléfonos útiles y DEA' })}
        ${teja({ v:'documentos', icon:'file', color:'brand', t:'Reglamento', s:'Normas y protocolos' })}
        ${teja({ v:'hotel-vivo', icon:'star', color:'wood', t:HOTEL_NOMBRE, s:'Vans, traslados, huéspedes y eventos' })}
        ${teja({ v:'manual', icon:'book', color:'accent', t:'Manual de uso', s:'El capítulo de la garita, paso a paso' })}
        ${esGuardia() ? teja({ a:'cerrar-turno', icon:'clock', color:'warn', t:'Cerrar el turno', s:'Cambio de guardia, sin salir' }) : ''}</div>` : ''}
      </div></div>`;
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
  /* Pase fijo de un ingreso frecuente (F-…), credencial de vecino (V-…) o
     QR del hotel (H-…: sus vans y proveedores). */
  if (typeof validarCodigoEspecial === 'function' && validarCodigoEspecial(txt)) return;
  /* Una patente de una van, un proveedor o un huésped del hotel. */
  if (typeof hotelValidar === 'function' && pat.length >= 6 && !s.pases.some(p => !p.cancelado && normPatente(p.patente) === pat) && hotelValidar(pat)) return;
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
A['pase-in'] = el => { const p = Store.s.pases.find(x => x.id === el.dataset.id);
  if (p && estadoPase(p) === 'vencido'){ toast('El pase venció: usá "Pase vencido" para avisarle al vecino', 'clock'); return; }
  movimiento(el.dataset.id, 'in'); };
A['pase-vencido'] = el => {
  const p = Store.s.pases.find(x => x.id === el.dataset.id); if (!p) return;
  const v = usuario(p.hostId) || {};
  hoja('Pase vencido', `${aviso('warn', 'clock', `${esc(p.nombre)} · ${esc(TIPOS_PASE[p.tipo]?.n || '')}`, `Autorizó ${esc(p.autoriza || v.nombre || 'el vecino')} · ${esc(v.casa || '')} · era de ${esc(p.desde)} a ${esc(p.hasta)} h`)}
    <button class="btn btn-pri btn-block btn-grande" data-a="pase-vencido-avisar" data-id="${p.id}" data-v="garita">${I('gate')}Está en la garita: preguntarle al vecino</button>
    <button class="btn btn-sec btn-block" style="margin-top:8px" data-a="pase-vencido-avisar" data-id="${p.id}" data-v="aviso">${I('bell')}No vino: solo avisarle que venció</button>
    <p class="muted tiny" style="margin-top:10px">Al vecino le llega al celular. Si está en la garita, le aparece "Que pase" / "No lo conozco", como una llegada sin aviso.</p>`);
};
A['pase-vencido-avisar'] = el => {
  if (!soloGarita()) return;
  const p0 = Store.s.pases.find(x => x.id === el.dataset.id); if (!p0) return;
  const enGarita = el.dataset.v === 'garita', at = Date.now();
  Store.cambiar(s => {
    const p = s.pases.find(x => x.id === p0.id); if (!p) return;
    p.vencidoAviso = { at, fecha:hoyISO(), tipo: enGarita ? 'garita' : 'aviso', por:yo().id };
    const casa = usuario(p.hostId)?.casa || '';
    if (enGarita){
      s.llegadas.unshift({ id:uid(), hostId:p.hostId, nombre:p.nombre, patente:p.patente || '', motivo:`Pase vencido (era de ${p.desde} a ${p.hasta} h)`, at, estado:'consultando', paseId:p.id });
      notificar(s, { para:p.hostId, titulo:`En la garita: ${p.nombre} (pase vencido)`, texto:`Tu pase era de ${p.desde} a ${p.hasta} h · ¿Lo dejamos pasar?`, icon:'gate', color:'warn', urgente:true, link:'inicio' });
    } else notificar(s, { para:p.hostId, titulo:`Venció el pase de ${p.nombre}`, texto:`Era de ${p.desde} a ${p.hasta} h y no ingresó. Si todavía viene, cambiale el horario o hacé uno nuevo.`, icon:'clock', color:'warn', link:'visitas', sonido:true });
    s.bitacora.unshift({ id:uid(), autor:yo().id, tipo:'acceso', texto:`Pase vencido: ${p.nombre} → ${casa} · ${enGarita ? 'se presentó; se consultó al vecino' : 'no ingresó; se avisó al vecino'}`, at });
  });
  cerrarHoja(); toast(enGarita ? 'Consultando al vecino…' : 'Le avisamos al vecino que el pase venció', 'send');
};
A['pase-out'] = el => movimiento(el.dataset.id, 'out');
function movimiento(id, tipo){
  const hoy = hoyISO();
  Store.cambiar(s => {
    const p = s.pases.find(x => x.id === id); if (!p) return;
    p.log = p.log || {}; p.log[hoy] = p.log[hoy] || {}; p.log[hoy][tipo] = Date.now();
    const casa = usuario(p.hostId)?.casa || '';
    notificar(s, { para:p.hostId, titulo: tipo === 'in' ? `${p.nombre} entró al barrio` : `${p.nombre} salió del barrio`, texto:`${hora(Date.now())} h`, icon: tipo === 'in' ? 'login' : 'logout', color:'ok', link:'visitas' });
    s.bitacora.unshift({ id:uid(), autor:yo().id, tipo:'acceso', texto:`${tipo === 'in' ? 'Ingreso' : 'Egreso'}: ${p.nombre} (${TIPOS_PASE[p.tipo]?.n || ''}) → ${casa} · autorizó ${p.autoriza || nombreDe(p.hostId)}${p.patente ? ' · ' + p.patente : ''}`, at:Date.now() });
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
    <div class="field"><label>Motivo</label><select name="motivo"><option>Visita</option><option>Delivery</option><option>Uber / DiDi / taxi</option><option>Proveedor / obra</option><option>Correo / paquete</option><option>Otro</option></select></div></div>
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
/* EL LECTOR DE QR DE LA GARITA
   Usa el detector del navegador cuando existe (Chrome, Android). Safari
   (iPhone, iPad) y Firefox no lo traen: ahí se baja jsQR, que lee el QR de
   la imagen de la cámara. Antes, en un iPhone la garita no podía leer nada.
   `el.dataset.v` = qué se espera leer (el texto de ayuda). */
let jsQRcargando = null;
const cargarJsQR = () => window.jsQR ? Promise.resolve(window.jsQR) : (jsQRcargando = jsQRcargando || new Promise(ok => {
  const s = document.createElement('script'); s.src = 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js';
  s.onload = () => ok(window.jsQR || null); s.onerror = () => { jsQRcargando = null; ok(null); }; document.head.appendChild(s); }));
A['escanear'] = async el => {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia){ toast('Este equipo no puede usar la cámara. Escribí el código.', 'scan'); return; }
  const nativo = 'BarcodeDetector' in window;
  const lector = nativo ? null : await cargarJsQR();
  if (!nativo && !lector){ toast('Sin conexión para cargar el lector de QR. Escribí el código.', 'scan'); return; }
  hoja('Escanear QR', `<video class="video-scan" id="scanVideo" playsinline muted></video><p class="muted small center">${esc(el && el.dataset && el.dataset.v || 'Apuntá al QR del pase')}</p>`);
  let stream;
  try { stream = await navigator.mediaDevices.getUserMedia({ video:{ facingMode:'environment' } }); }
  catch(e){ cerrarHoja(); toast('No se pudo usar la cámara', 'camera'); return; }
  const v = $('#scanVideo'); v.srcObject = stream; await v.play().catch(() => {});
  const det = nativo ? new BarcodeDetector({ formats:['qr_code'] }) : null;
  const lienzo = document.createElement('canvas'), ctx = lienzo.getContext('2d', { willReadFrequently:true });
  const d = $('#hoja');
  const parar = () => stream.getTracks().forEach(t => t.stop());
  d.addEventListener('close', parar, { once:true });
  const leer = async () => {
    if (det){ const r = await det.detect(v); return r[0] ? r[0].rawValue : ''; }
    if (!v.videoWidth) return '';
    const k = Math.min(1, 720 / v.videoWidth); lienzo.width = Math.round(v.videoWidth * k); lienzo.height = Math.round(v.videoHeight * k);
    ctx.drawImage(v, 0, 0, lienzo.width, lienzo.height);
    const r = lector(ctx.getImageData(0, 0, lienzo.width, lienzo.height).data, lienzo.width, lienzo.height, { inversionAttempts:'dontInvert' });
    return r ? r.data : '';
  };
  const ciclo = async () => {
    if (!d.open) return;
    try { const txt = await leer(); if (txt){ parar(); cerrarHoja(); validar(txt); return; } } catch(e){}
    setTimeout(ciclo, 250);
  };
  ciclo();
};

/* ---------- BITÁCORA ---------- */
const TIPOS_BIT = { turno:['Cambio de turno','clock','sky'], ronda:['Ronda','shield','brand'], novedad:['Novedad','info','accent'], incidente:['Incidente','alert','danger'], acceso:['Acceso','gate','ok'] };
R.bitacora = {
  titulo: 'Bitácora', icon: 'book', color: 'wood', sub: 'Libro de guardia',
  render(p){
    if (!veGarita()) return vacio('lock', 'El libro de guardia es solo para la guardia, la Administración y la supervisión.');
    const filtro = p || 'todo';
    const lista = aLista(Store.s.bitacora).filter(b => b && (filtro === 'todo' || b.tipo === filtro)).sort((a, b) => b.at - a.at).slice(0, 120);
    let dia = '';
    return `${!esGuardia() ? `<div class="garita-vivo">${I('eye')}<div class="grow"><b>El libro de guardia lo escribe la garita</b><span>${esSupervisor() ? 'Desde la supervisión' : 'La Administración'} lo lee en vivo pero no anota ni corrige: es el registro de la guardia. Para pedirle o avisarle algo a la garita, escribile: le llega al instante, con sonido.</span></div>
        <button class="btn btn-xs btn-pri" data-a="abrir" data-v="privado" data-p="${esSupervisor() ? 'supGarita' : 'interno'}">${I('chat')}Escribirle a la garita</button></div>` : `<form data-f="bitacora" class="card">
        <div class="seg" style="margin-bottom:10px">${Object.entries(TIPOS_BIT).filter(([k]) => k !== 'acceso').map(([k, t], i) => `<label><input type="radio" name="tipo" value="${k}" ${i === 1 ? 'checked' : ''}><span>${I(t[1])}${t[0]}</span></label>`).join('')}</div>
        <div class="linea-form"><input name="texto" id="bitTxt" required maxlength="300" placeholder="¿Qué pasó?"><button class="btn btn-pri">${I('send')}</button></div>
        <label class="check" style="margin:10px 0 0"><input type="checkbox" name="avisar"><span>Además, que le suene a la Administración (le aparece en su campanita)</span></label>
        <p class="muted tiny" style="margin:8px 0 0">${I('info')} Lo que se anota acá queda en el <b>libro de guardia</b>: lo leen solo la garita, la Administración y la supervisión de la guardia, con fecha, hora y quién lo escribió. No lo ven los vecinos y no se puede borrar.</p></form>`}
      <div class="chips">${['todo', ...Object.keys(TIPOS_BIT)].map(k => `<button class="chip ${filtro === k ? 'on' : ''}" data-a="abrir" data-v="bitacora" data-p="${k}">${k === 'todo' ? 'Todo' : TIPOS_BIT[k][0]}</button>`).join('')}</div>
      <div class="btns" style="margin:0 0 10px"><button class="btn btn-sm btn-sec" data-a="hist-bitacora">${I('clock')}Ver el libro completo</button><button class="btn btn-sm btn-sec" data-a="hist-visitas-todo">${I('users')}Historial de visitas</button></div>
      <p class="muted tiny" style="margin:-4px 0 10px">Acá se ven los últimos ${Historial.VENTANA.bitacora[1]} días; lo anterior se trae de la base solo cuando lo pedís, así la app no se hace pesada.</p>
      <div class="card">${lista.length ? lista.map(b => {
        const d = isoDe(new Date(b.at)); const sep = d !== dia ? (dia = d, `<div class="sec" style="margin:14px 0 4px"><h2>${relDia(d)}</h2></div>`) : '';
        const t = TIPOS_BIT[b.tipo] || TIPOS_BIT.novedad;
        return `${sep}<div class="lista"><div class="it"><span class="ic ic-${t[2]}" style="width:34px;height:34px;border-radius:11px;display:grid;place-items:center">${I(t[1])}</span>
          <div class="txt"><b>${esc(b.texto)}</b><span>${hora(b.at)} · ${esc(autorVisible(b.autor).nombre)}${usuario(b.autor)?.rol === 'guardia' && b.tipo !== 'turno' && guardiasEn(b.at).length ? ' (' + esc(guardiasEn(b.at).join(', ')) + ')' : ''}</span></div></div></div>`; }).join('') : vacio('book', 'Sin registros.')}</div>`;
  },
};
F['bitacora'] = (d, form) => {
  /* El libro lo escribe solo la garita (26-09-2026: la Administración lo
     lee y le escribe por "Mensajes con la garita"). Anota mucho de rutina:
     a la Administración le suena solo si la garita lo pide. */
  const texto = d.texto.trim(), para = 'rol:admin', avisar = !!d.avisar;
  Store.cambiar(s => {
    s.bitacora.unshift({ id:uid(), autor:yo().id, tipo:d.tipo, texto, at:Date.now() });
    if (avisar) notificar(s, { para, titulo:`Libro de guardia · ${(TIPOS_BIT[d.tipo] || TIPOS_BIT.novedad)[0]}`, texto, icon:'book', color: d.tipo === 'incidente' ? 'danger' : 'wood', link:'bitacora', sonido:true, urgente: d.tipo === 'incidente' });
  });
  form.reset(); const i = $('#bitTxt'); if (i) i.value = '';
  toast(avisar ? 'Anotado en el libro de guardia y avisado a la Administración' : 'Anotado en el libro de guardia', 'book');
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
