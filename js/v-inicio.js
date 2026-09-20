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
    x.estado === 'en_camino' ? `La guardia va en camino (${nombreDe(x.atiende)})` : 'Tu alerta SOS está activa',
    'La guardia y la Administración ya fueron avisadas.', `<button class="btn btn-xs btn-sec" data-a="sos-cancelar" data-id="${x.id}">Ya estoy bien, cancelar</button>`)));
  s.llegadas.filter(l => l.hostId === u.id && l.estado === 'consultando').forEach(l => out.push(aviso('warn latido', 'gate',
    `En la garita: ${esc(l.nombre)} pregunta por vos`, `${esc(l.motivo || 'Sin aviso previo')}${l.patente ? ' · ' + esc(l.patente) : ''} · ${hace(l.at)}`,
    `<button class="btn btn-xs btn-ok" data-a="llegada-si" data-id="${l.id}">${I('check')}Que pase</button><button class="btn btn-xs btn-danger-soft" data-a="llegada-no" data-id="${l.id}">No lo conozco</button>`)));
  s.solicitudesPase.filter(r => r.hostId === u.id && r.estado === 'pendiente').forEach(r => out.push(aviso('info', 'qr',
    `${esc(r.nombre)} te pide un pase`, `${fechaCorta(r.fecha)} · ${r.desde}${r.patente ? ' · ' + esc(r.patente) : ''}`,
    `<button class="btn btn-xs btn-ok" data-a="sol-pase-si" data-id="${r.id}">${I('check')}Aprobar</button><button class="btn btn-xs btn-sec" data-a="sol-pase-no" data-id="${r.id}">Rechazar</button>`)));
  const paq = s.paquetes.filter(p => p.hostId === u.id && !p.retirado);
  if (paq.length) out.push(aviso('brand', 'box', `Tenés ${plural(paq.length, 'paquete')} en la garita`, paq.map(p => esc(p.empresa)).join(', ')));
  Clima.alertas().forEach(a => out.push(aviso(a.nivel, a.icon, a.t, a.x)));
  s.posts.filter(p => p.type === 'alerta' && Date.now() - p.createdAt < DIA && p.autor !== u.id && !p.resuelto).slice(0, 2)
    .forEach(p => out.push(aviso('danger', 'alert', `Alerta vecinal: ${esc(p.title)}`, `${esc(autorVisible(p.autor).casa)} · ${hace(p.createdAt)}`, `<button class="btn btn-xs btn-sec" data-a="abrir" data-v="pizarron">Ver en el pizarrón</button>`)));
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
  const vol = c.voluminosos;
  if (vol && (vol === hoyISO() || vol === sumarDias(hoyISO(), 1))) return aviso('warn', 'truck', `${vol === hoyISO() ? 'Hoy' : 'Mañana'} pasan por los voluminosos`, esc(c.voluminososDetalle));
  if (c.recoleccion[hoy] && ahoraMin() < minutosDe(c.recoleccionHora)) return aviso('info', 'truck', `Hoy pasa el camión: ${esc(c.recoleccion[hoy])}`, `Alrededor de las ${c.recoleccionHora} h.`);
  if (c.recoleccion[man] && h.getHours() >= 17) return aviso('info', 'truck', `Mañana pasa el camión: ${esc(c.recoleccion[man])}`, 'Sacá la bolsa esta noche, en el canasto cerrado.');
  return null;
}

/* ---------- INICIO del vecino y la Administración ---------- */
R.inicio = {
  titulo: 'Inicio', icon: 'home', ancha: true,
  render(){
    const u = yo(), s = Store.s, hoy = hoyISO(), c = Clima.d?.c;
    const hr = new Date().getHours();
    const saludo = hr < 5 ? 'Buenas noches' : hr < 13 ? 'Buen día' : hr < 20 ? 'Buenas tardes' : 'Buenas noches';
    const [desc, icoClima] = c ? Clima.cod(c.weather_code) : ['', 'cloud'];
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

    const urg = urgentesVecino();
    const misHoy = s.pases.filter(p => p.hostId === u.id && paseValidoEn(p, hoy));
    const proxRes = s.reservas.filter(r => r.userId === u.id && r.fecha >= hoy && !r.cancelada).sort((a, b) => a.fecha.localeCompare(b.fecha))[0];
    const pizNuevas = s.posts.filter(p => p.createdAt > (Store.sesion.pizarronVisto || 0) && p.autor !== u.id).length;
    const chatNuevos = s.msgs.filter(m => m.createdAt > (Store.sesion.chatVisto || 0) && m.autor !== u.id).length;
    const privNoLeidos = s.privados.filter(h => h.userId === u.id).reduce((n, h) => n + h.msgs.filter(m => m.from !== 'vecino' && !m.leido).length, 0);
    const votAbiertas = s.votaciones.filter(v => v.cierra > Date.now()).length;
    const misRecl = s.reclamos.filter(r => r.userId === u.id && r.estado !== 'resuelto').length;
    const compras = s.compras.filter(x => x.cierra > Date.now()).length;
    const prox = proximoFeriado();
    const pend = s.users.filter(x => x.estado === 'pendiente').length;
    const vuelosHoy = Vuelos.cuantosHoy();

    const tuCasa = [
      teja({ a:'nuevo-pase', icon:'qr', t:'Autorizar una visita', s:'Código y QR para la garita', destaca:true }),
      teja({ v:'visitas', icon:'users', color:'sky', t:'Mis visitas', s: misHoy.length ? `${plural(misHoy.length, 'esperada')} hoy` : 'Nadie anunciado hoy', n: misHoy.length || '' }),
      teja({ v:'reservas', icon:'calendar', color:'wood', t:'Reservas', s: proxRes ? `${amenity(proxRes.amenity)?.nombre} · ${relDia(proxRes.fecha)}` : 'Quincho, SUM y cancha' }),
      teja({ v:'mensajes', icon:'chat', color:'accent', t:'Mensajes', s:'Privados con vecinos y la Administración', badge: privNoLeidos + dmNoLeidos() }),
      teja({ v:'peticiones', icon:'edit', color:'brand', t:'Peticiones a la garita', s:'Firmadas por vos y la guardia', n: s.peticiones.filter(p => p.userId === u.id && p.estado !== 'cerrada').length || '' }),
      teja({ v:'perfil', icon:'home', color:'ok', t:'Mi casa', s:'Familia, autos, mascotas' }),
      ...(s.infracciones.some(i => i.casa === u.casa && i.estado === 'notificada') ? [teja({ v:'infracciones', icon:'alert', color:'danger', t:'Notificación', s:'Podés presentar tu descargo', badge: s.infracciones.filter(i => i.casa === u.casa && i.estado === 'notificada').length })] : []),
    ].join('');
    const barrio = [
      teja({ v:'pizarron', icon:'muro', t:'Pizarrón', s:'Guardia, Administración y vecinos', badge: pizNuevas }),
      teja({ v:'vecinos', icon:'users', color:'sky', t:'Vecinos', s:'Buscá por nombre, oficio o dirección' }),
      teja({ v:'obras', icon:'wrench', color:'wood', t:'Obras', s: (() => { const a = s.obras.filter(o => o.estado === 'activa'); const h = s.obras.filter(o => o.avisoHoy?.fecha === hoy).length; return h ? `${plural(h, 'aviso')} para hoy` : `${plural(a.length, 'en curso', 'en curso')}`; })(), n: s.obras.filter(o => o.estado === 'activa').length || '' }),
      teja({ v:'viajes', icon:'car', color:'sky', t:'Viajes compartidos', s:'Centro, escuela, aeropuerto', n: s.viajes.filter(v => v.fecha >= hoy).length || '' }),
      teja({ v:'chat', icon:'chat', color:'sky', t:'Chat vecinal', s:'#general · #seguridad · #mascotas', badge: chatNuevos }),
      teja({ v:'votaciones', icon:'vote', color:'accent', t:'Votaciones', s: votAbiertas ? `${plural(votAbiertas, 'abierta')}` : 'Sin votaciones abiertas', n: votAbiertas || '' }),
      teja({ v:'reclamos', icon:'clipboard', color:'warn', t:'Reclamos', s: misRecl ? `${plural(misRecl, 'abierto')}` : 'Privados con la Administración', n: misRecl || '' }),
      teja({ v:'servicios', icon:'star', color:'wood', t:'Oficios de vecinos', s:'Recomendados por el barrio' }),
      teja({ v:'mascotas', icon:'paw', color:'ok', t:'Mascotas', s:'Perdidas, encontradas y del barrio' }),
      teja({ v:'compras', icon:'cart', color:'brand', t:'Compras conjuntas', s: compras ? `${plural(compras, 'abierta')}` : 'Leña, gas, lo que sea', n: compras || '' }),
    ].join('');
    const ciudad = [
      teja({ v:'ushuaia', icon:'pin', color:'sky', t:'Ushuaia', s: prox ? `Próximo feriado: ${relDia(prox.fecha)}` : 'Temporadas, feriados, eventos' }),
      teja({ v:'vuelos', icon:'send', color:'accent', t:'Vuelos USH', s:'Arribos y partidas de hoy', n: vuelosHoy || '' }),
      teja({ v:'recoleccion', icon:'truck', color:'ok', t:'Residuos', s: proxRecoleccion() }),
      teja({ v:'agenda', icon:'phone', color:'danger', t:'Emergencias', s:'Y agenda de Ushuaia' }),
      teja({ v:'expensas', icon:'wallet', color:'wood', t:'Expensas', s:`Vencen el ${Store.s.config.expensasVence} de cada mes` }),
      teja({ v:'documentos', icon:'file', color:'brand', t:'Normas', s:'Reglamento y convivencia' }),
    ].join('');
    const gestion = esAdmin() ? [
      teja({ v:'admin', icon:'sliders', color:'accent', t:'Administración', s:'Inscripciones, datos y motor', badge: pend }),
      teja({ v:'contabilidad', icon:'wallet', color:'wood', t:'Contabilidad', s:'Expensas, cobranzas y ARCA', badge: s.pagos.filter(x => x.estado === 'informado').length }),
      teja({ v:'garita', icon:'gate', color:'brand', t:'Garita', s:'Ingresos de hoy', n: pasesDelDia().length }),
      teja({ v:'bitacora', icon:'book', color:'wood', t:'Bitácora', s:'Libro de guardia' }),
      teja({ v:'infracciones', icon:'alert', color:'danger', t:'Infracciones', s:'Graduales, con descargo', n: s.infracciones.filter(i => i.estado === 'descargo').length || '' }),
      teja({ v:'proveedores', icon:'box', color:'accent', t:'Proveedores', s:'ART y seguro al día', n: s.proveedores.filter(p => artEstado(p)[1] !== 'ok').length || '' }),
      teja({ v:'obras', p:'pendientes', icon:'wrench', color:'wood', t:'Obras por aprobar', s:'Registro de obras', n: s.obras.filter(o => o.estado === 'pendiente').length || '' }),
    ].join('') : '';

    const pron = Clima.d?.dd ? `<div class="pronostico">${[1,2,3].map(i => {
      const dd = Clima.d.dd; if (!dd.time[i]) return '';
      const [dsc, ic] = Clima.cod(dd.weather_code[i]);
      return `<div><b>${i === 1 ? 'Mañana' : DIAS[fechaDe(dd.time[i]).getDay()]}</b>${I(ic)}
        <div class="t">${Math.round(dd.temperature_2m_max[i])}° <span>${Math.round(dd.temperature_2m_min[i])}°</span></div>
        <div class="v">${dd.snowfall_sum[i] >= 1 ? `❄ ${Math.round(dd.snowfall_sum[i])} cm` : `ráf. ${Math.round(dd.wind_gusts_10m_max[i])}`}</div></div>`; }).join('')}</div>` : '';
    const mSale = minutosDe(sol.sale), mPone = minutosDe(sol.pone), luzMin = mPone - mSale;
    const pos = Math.max(0, Math.min(100, (ahoraMin() - mSale) / luzMin * 100));
    const luz = `<div class="card"><div class="row" style="justify-content:space-between;margin-bottom:10px"><b style="font-size:14px">Luz del día</b><span class="muted small">${Math.floor(luzMin / 60)} h ${luzMin % 60} min</span></div>
      <div class="luz"><span class="small">${sol.sale}</span><div class="barra"><i style="left:${pos}%"></i></div><span class="small">${sol.pone}</span></div></div>`;
    const ant = Store.sesion.visitaAnterior || 0;
    const nPost = s.posts.filter(p => p.createdAt > ant && p.autor !== u.id).length, nMsg = s.msgs.filter(m => m.createdAt > ant && m.autor !== u.id).length;
    const desde = ant && (nPost || nMsg) ? `<div class="card" style="display:flex;gap:12px;align-items:center"><span class="ic ic-accent" style="width:40px;height:40px;border-radius:13px;display:grid;place-items:center">${I('sparkle')}</span>
      <div class="grow"><b style="font-size:14px">Desde tu última visita</b><div class="muted small">${[nPost && plural(nPost, 'publicación nueva', 'publicaciones nuevas'), nMsg && plural(nMsg, 'mensaje nuevo', 'mensajes nuevos') + ' en el chat'].filter(Boolean).join(' · ')}</div></div></div>` : '';
    const ultimas = s.posts.slice().sort((a, b) => (b.fijado - a.fijado) || b.createdAt - a.createdAt).slice(0, 3).map(p => {
      const t = TIPOS_POST[p.type] || TIPOS_POST.aviso;
      return superficie({ v:'pizarron', icon:t.icon, color:t.c, t:esc(p.title), s:`${t.n} · ${esc(autorVisible(p.autor).nombre)} · ${hace(p.createdAt)}` });
    }).join('');

    return `${hero}
      <div class="panel-sube">${urg.join('')}${ushuaiaHoy()}</div>
      <div class="inicio-cols"><div>
        ${sec('Tu casa')}<div class="mosaico">${tuCasa}</div>
        ${sec('El barrio')}<div class="mosaico">${barrio}</div>
        ${sec('Ushuaia y servicios')}<div class="mosaico">${ciudad}</div>
        ${gestion ? sec('Gestión') + `<div class="mosaico">${gestion}</div>` : ''}
      </div><div>
        ${sec('Próximos días')}${pron}<div style="height:10px"></div>${luz}${desde}
        ${sec('Último en el pizarrón', `<button class="link" data-a="abrir" data-v="pizarron">Ver todo</button>`)}${ultimas}
      </div></div>`;
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
  const fer = proximoFeriado();
  if (fer) partes.push(chip('calendar', esc(fer.nombre), relDia(fer.fecha), fer.fecha === hoy));
  const v = Vuelos.cuantosHoy();
  if (v) partes.push(chip('send', 'Vuelos de hoy en USH', v + ' movimientos', false));
  const ev = s.eventosCiudad.filter(e => e.fecha >= hoy).sort((a, b) => a.fecha.localeCompare(b.fecha))[0];
  if (ev) partes.push(chip('star', esc(ev.titulo), relDia(ev.fecha), ev.fecha === hoy));
  if (!partes.length) return '';
  return `<div class="ushuaia-hoy"><div class="uh-cab">${I('pin')}<b>Ushuaia hoy</b><span class="muted small">tocá para ver todo</span></div>
    <div class="uh-tira">${partes.join('')}</div></div>`;
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
    <div class="panel" style="color:var(--ink)">${p && !p.cancelado ? `<div class="ticket"><div class="tk-top"><small>Pase de ingreso</small><h3>${esc(p.nombre)}</h3>
      <div style="opacity:.85;font-size:13px">${esc(u?.casa || '')} · ${p.dias?.length ? p.dias.map(d => DIAS[d]).join(' ') : relDia(p.fecha)} · ${p.desde}–${p.hasta}</div></div>
      <div class="bottom"><div class="qr-box" data-qr="BHC:${p.codigo}"></div><div class="codigo-grande">${p.codigo}</div></div></div>
      <a class="btn btn-sec btn-block" style="margin-top:10px" href="${esc(Store.s.config.mapa)}" target="_blank" rel="noopener">${I('pin')}Cómo llegar</a>`
      : aviso('danger', 'x', 'Este pase no existe o fue cancelado', '')}</div></section>`;
  $$('[data-qr]').forEach(el => pintarQR(el, el.dataset.qr));
}
/* La página pública se actualiza sola cuando el vecino aprueba. */
Store.alCambiar(() => { const h = location.hash; if (!yo() && h.startsWith('#/pedir/')) pintarPedirPase(decodeURIComponent(h.slice(8))); });
