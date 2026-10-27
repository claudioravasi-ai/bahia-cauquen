/* =========================================================
   EL PORTAL DE LA ADMINISTRACIÓN, VIVO (pedido de Claudio, 21-10-2026:
   "hacé todo esto", sobre las cinco ideas de GitHub que le propuse)
   Arriba del "Día a día", en este orden:
     1. EL SEMÁFORO DEL BARRIO: cuatro luces que laten (garita, policía,
        hotel y expensas), en verde, ámbar o rojo, cada una lleva a su lugar.
        Idea de gatus (12,3k★, Apache-2.0).
     2. LOS MEDIDORES: tres relojes que se llenan solos al abrir (lotes al día,
        la meta de rondas de anoche y la ocupación del hotel). Idea de
        justgage (1,9k★, MIT).
     3. EL TABLERO DE PENDIENTES: reclamos, peticiones e inscripciones en
        Nuevo / En curso / Resuelto. Los reclamos se arrastran de columna
        (el mismo arrastre de la ventana Reclamos); los demás se tocan y
        abren su lugar. Idea de react-trello (2,3k★, MIT).
     4. LAS SALAS EN MOSAICO (v-inicio.js, diaADia): colores vivos, la sala
        que tiene algo pendiente se agranda y los números suben contando.
        Idea de magicui (22,7k★, MIT).
     5. "EL DÍA EN 10 SEGUNDOS": al abrir la portada por primera vez en el
        día, cinco tarjetas que pasan solas (como historias), con los
        números que cuentan; después queda el botón para volver a verlo.
        Idea de vizzu (2k★, Apache-2.0).
   Solo la idea de cada repositorio: el código es propio. Todo sale de lo
   que la Administración ya tiene en la app: no se pide nada nuevo a la base.
   ========================================================= */
'use strict';

const PV = { pct:(a, b) => b ? Math.max(0, Math.min(100, Math.round(a / b * 100))) : 0 };
/* Los números del portal, juntos: los usan el semáforo, los medidores y el día en 10 segundos. */
function pvDatos(){
  const s = Store.s, hoy = hoyISO(), ahora = Date.now(), t = turnoAbierto();
  const g = typeof garitaEnLinea === 'function' ? garitaEnLinea() : null;
  const noche = typeof nochePolicia === 'function' ? nochePolicia() : null;
  const pols = t ? policiasAdentro(t) : [];
  const meta = typeof rondaMeta === 'function' ? rondaMeta() : 3;
  /* La última noche con policía (la de ahora si ya hay rondas, si no la anterior). */
  const svs = typeof serviciosPolicia === 'function' ? serviciosPolicia() : [];
  const nocheId = typeof nocheDe === 'function' ? nocheDe : ts => isoDe(new Date(ts - 6 * HORA));
  const ultNoche = svs.length ? nocheId(svs[0].entra) : '';
  const completas = ultNoche && typeof completasDe === 'function' ? svs.filter(sv => nocheId(sv.entra) === ultNoche).reduce((k, sv) => k + completasDe(sv), 0) : 0;
  const lotes = typeof LOTES !== 'undefined' ? LOTES : [];
  const morosos = typeof saldoLote === 'function' ? lotes.filter(L => saldoLote('Lote ' + L.lote) > 0.5).length : 0;
  const porAcred = typeof porAcreditar === 'function' ? aLista(s.pagos).filter(porAcreditar).length : 0;
  const hayHotel = typeof cuentaHotel === 'function' && !!cuentaHotel();
  const hd = hayHotel && typeof huespedesDelDia === 'function' ? huespedesDelDia(hoy) : null;
  const alojados = hd ? hd.pax(hd.estan) + hd.pax(hd.llegan) : 0;
  const capacidad = Math.max(1, +(hayHotel && hotelInfo().capacidad) || 40);
  const vs = hayHotel && typeof viajesDelDia === 'function' ? viajesDelDia(hoy) : [];
  const porHacer = typeof viajePorHacer === 'function' ? vs.filter(viajePorHacer).length : 0;
  const movs = typeof movimientosDeHoy === 'function' ? movimientosDeHoy() : [];
  const sinLeer = h => aLista(h && h.msgs).filter(m => m && m.from !== 'admin' && !m.leido).length;
  return {
    t, g, noche, pols, meta, ultNoche, completas, lotes:lotes.length, morosos, alDia:lotes.length - morosos, porAcred,
    hayHotel, alojados, capacidad, traslados:vs.length, porHacer,
    ingresos:movs.filter(m => !m.sale && !m.no).length, salidas:movs.filter(m => m.sale).length,
    reclamos:aLista(s.reclamos).filter(r => r.estado !== 'resuelto').length,
    inscripciones:aLista(s.users).filter(x => x.estado === 'pendiente').length,
    peticiones:aLista(s.peticiones).filter(p => p.estado === 'pendiente').length,
    mensajes:aLista(s.privados).filter(h => h && h.con !== 'interno' && h.con !== 'guardia' && h.con !== 'supAdmin' && h.con !== 'supGarita').reduce((a, h) => a + sinLeer(h), 0),
    sos:aLista(s.sos).filter(x => x && x.estado !== 'resuelta').length,
    ahora,
  };
}

/* ---------- 1. el semáforo ---------- */
function pvSemaforo(d){
  const luz = (nivel, ic, t, x, ir) => `<button class="pv-luz n-${nivel}" data-a="abrir" data-v="${ir}"><span class="pv-foco" aria-hidden="true"><i></i></span>
    <span class="pv-luz-txt"><small>${I(ic)}${t}</small><b>${x}</b></span></button>`;
  const garita = d.sos ? luz('mal', 'siren', 'Garita', `${plural(d.sos, 'SOS abierto', 'SOS abiertos')}`, 'garita')
    : !d.t ? luz('mal', 'gate', 'Garita', 'Sin turno abierto', 'garita')
    : d.g && !d.g.conectada ? luz('mal', 'gate', 'Garita', 'Desconectada', 'garita')
    : d.g && !d.g.activa ? luz('warn', 'gate', 'Garita', `Turno ${esc(d.t.turno)} · minimizada`, 'garita')
    : luz('ok', 'gate', 'Garita', `Turno ${esc(d.t.turno)}${d.g ? ' · conectada' : ''}`, 'garita');
  const enRonda = d.pols.some(p => typeof rondaEnCurso === 'function' && rondaEnCurso(p));
  const policia = d.pols.length ? luz('ok', 'shield', 'Policía', enRonda ? 'En ronda ahora' : 'De servicio', 'turnos')
    : d.noche && d.noche.ahora ? luz('warn', 'shield', 'Policía', 'En horario, sin ingreso', 'turnos')
    : luz('gris', 'moon', 'Policía', `Desde las ${hora(d.noche ? d.noche.desde : Date.now())} h`, 'turnos');
  const hotel = !d.hayHotel ? luz('gris', 'star', 'Hotel', 'Sin cuenta todavía', 'hotel-vivo')
    : d.porHacer ? luz('warn', 'star', 'Hotel', `${plural(d.porHacer, 'traslado por hacer', 'traslados por hacer')}`, 'hotel-vivo')
    : luz('ok', 'star', 'Hotel', `${plural(d.alojados, 'huésped', 'huéspedes')} hoy`, 'hotel-vivo');
  const p = PV.pct(d.alDia, d.lotes);
  const expensas = !d.lotes ? luz('gris', 'wallet', 'Expensas', 'Sin padrón cargado', 'cobranzas')
    : d.porAcred ? luz('warn', 'wallet', 'Expensas', `${plural(d.porAcred, 'pago por acreditar', 'pagos por acreditar')}`, 'cobranzas')
    : luz(p >= 85 ? 'ok' : p >= 65 ? 'warn' : 'mal', 'wallet', 'Expensas', `${p} % de los lotes al día`, 'cobranzas');
  return `<div class="pv-semaforo" role="group" aria-label="El semáforo del barrio">${garita}${policia}${hotel}${expensas}</div>`;
}

/* ---------- 2. los medidores ---------- */
function pvMedidor(k, n, de, titulo, sub, color, ir, sufijo = ''){
  const p = PV.pct(n, de);
  return `<button class="pv-med" data-a="abrir" data-v="${ir}" style="--c:${color};--p:${p}" aria-label="${esc(titulo)}: ${n}${sufijo} de ${de}">
    <svg viewBox="0 0 120 70" aria-hidden="true"><path class="pv-med-fondo" d="M10 64 A50 50 0 0 1 110 64" pathLength="100"/><path class="pv-med-arco" d="M10 64 A50 50 0 0 1 110 64" pathLength="100"/></svg>
    <span class="pv-med-n"><b class="dn-num" data-k="pv-${k}" data-n="${n}">${n}</b><small>${sufijo || 'de ' + de}</small></span>
    <span class="pv-med-t"><b>${titulo}</b><small>${sub}</small></span></button>`;
}
function pvMedidores(d){
  return `<div class="pv-medidores">
    ${pvMedidor('alDia', PV.pct(d.alDia, d.lotes), 100, 'Lotes al día', d.lotes ? `${d.alDia} de ${d.lotes} · ${d.morosos} con deuda` : 'sin padrón', 'var(--ok)', 'cobranzas', '%')}
    ${pvMedidor('rondas', d.completas, d.meta, 'Meta de rondas', d.ultNoche ? 'completas con QR, última noche' : 'todavía sin noches', 'var(--sky)', 'turnos')}
    ${d.hayHotel ? pvMedidor('hotel', d.alojados, d.capacidad, 'Ocupación del hotel', `${PV.pct(d.alojados, d.capacidad)} % · ${plural(d.traslados, 'traslado', 'traslados')} hoy`, 'var(--wood)', 'hotel-vivo') : ''}
  </div>`;
}

/* ---------- 3. el tablero de pendientes ---------- */
const PV_COLS = [['abierto', 'Nuevo', 'danger'], ['en_curso', 'En curso', 'warn'], ['resuelto', 'Resuelto', 'ok']];
function pvTablero(){
  const s = Store.s, ahora = Date.now(), reciente = t => t && ahora - t < 7 * DIA;
  const col = { abierto:[], en_curso:[], resuelto:[] };
  aLista(s.reclamos).forEach(r => { const k = r.estado === 'resuelto' ? 'resuelto' : r.estado === 'abierto' ? 'abierto' : 'en_curso';
    const ult = aLista(r.historial).at(-1); if (k === 'resuelto' && !reciente(ult && ult.at)) return;
    col[k].push({ tipo:'reclamo', id:r.id, at:r.createdAt || 0, t:r.titulo || 'Reclamo', s:`${esc(r.casa || '')}${r.lugar ? ' · ' + esc(r.lugar) : ''}` }); });
  aLista(s.peticiones).forEach(p => { const k = p.estado === 'pendiente' ? 'abierto' : p.estado === 'cerrada' ? 'resuelto' : 'en_curso';
    if (k === 'resuelto' && !reciente(p.cerradaAt)) return;
    col[k].push({ tipo:'peticion', id:p.id, at:p.at || 0, t:((typeof TIPOS_PET !== 'undefined' && (TIPOS_PET[p.tipo] || TIPOS_PET.otro).n) || 'Petición'), s:esc(p.casa || '') }); });
  aLista(s.users).forEach(x => { if (x.estado === 'pendiente') col.abierto.push({ tipo:'inscripcion', id:x.id, at:x.createdAt || 0, t:`Inscripción de ${esc(String(x.nombre || '').split(' ')[0])}`, s:esc(x.casa || '') });
    else if (x.estado === 'aprobado' && reciente(x.aprobadoAt)) col.resuelto.push({ tipo:'inscripcion', id:x.id, at:x.aprobadoAt, t:`Inscripción de ${esc(String(x.nombre || '').split(' ')[0])}`, s:esc(x.casa || '') }); });
  const TIPO = { reclamo:['clipboard', 'Reclamo', 'accent'], peticion:['edit', 'Petición a la garita', 'sky'], inscripcion:['user', 'Inscripción', 'ok'] };
  const tarjeta = (c, i) => { const [ic, n, color] = TIPO[c.tipo];
    const abrir = c.tipo === 'reclamo' ? `data-a="recl-ver" data-id="${esc(c.id)}"` : c.tipo === 'peticion' ? 'data-a="abrir" data-v="peticiones"' : 'data-a="abrir" data-v="admin"';
    return `<div class="${c.tipo === 'reclamo' ? 'rk-card ' : ''}pv-card t-${color}" data-id="${esc(c.id)}" style="--i:${i}">
      ${c.tipo === 'reclamo' ? `<span class="rk-asa" aria-hidden="true">${I('grip')}</span>` : ''}
      <button class="pv-card-b" ${abrir}><small>${I(ic)}${n}</small><b>${esc(c.t)}</b><span>${c.s}${c.at ? ' · ' + hace(c.at) : ''}</span></button></div>`; };
  const total = col.abierto.length + col.en_curso.length;
  return `<section class="pv-tablero" aria-label="Pendientes">
    <div class="pv-cab"><h3>${I('list')}Pendientes</h3><span>${total ? plural(total, 'cosa espera', 'cosas esperan') + ' · los reclamos se arrastran de columna' : 'Nada esperando: ¡al día!'}</span></div>
    <div class="pv-cols">${PV_COLS.map(([k, n, c]) => `<div class="rk-col pv-col c-${c}" data-estado="${k}"><header><b>${n}</b><span class="dn-num" data-k="pv-col-${k}" data-n="${col[k].length}">${col[k].length}</span></header>
      <div class="pv-col-lista">${col[k].sort((a, b) => b.at - a.at).slice(0, 6).map(tarjeta).join('') || '<p class="pv-vacia">Nada por acá.</p>'}${col[k].length > 6 ? `<p class="pv-vacia">y ${col[k].length - 6} más</p>` : ''}</div></div>`).join('')}</div>
  </section>`;
}

/* ---------- lo que va arriba del Día a día ---------- */
function portalVivo(){
  const d = pvDatos();
  return `<div class="pv">
    <div class="pv-tit"><div><h2>El barrio ahora</h2><span>${fechaLarga(hoyISO()).replace(/^./, c => c.toUpperCase())} · ${hora(Date.now())} h</span></div>
      <button class="pv-play" data-a="dia10"><span aria-hidden="true">▶</span>El día en 10 segundos</button></div>
    ${pvSemaforo(d)}${pvMedidores(d)}${pvTablero()}</div>`;
}

/* ---------- 5. el día en 10 segundos ---------- */
const DIA10 = { i:0, t:0, ini:0, dur:2000 };
function dia10Tarjetas(){
  const d = pvDatos();
  return [
    { e:'🚪', c:'#0d6b66', t:'La entrada', n:d.ingresos, u:d.ingresos === 1 ? 'ingreso hoy' : 'ingresos hoy', x:`${plural(d.salidas, 'salida', 'salidas')} · ${d.t ? `turno ${esc(d.t.turno)} de guardia` : 'sin turno abierto'}` },
    { e:'🌙', c:'#2a3f8a', t:'La ronda', n:d.completas, u:`de ${d.meta} rondas completas`, x:d.ultNoche ? 'con QR, en la última noche con policía' : 'todavía no hubo noches con policía' },
    { e:'🏡', c:'#7445c0', t:'Los vecinos', n:d.reclamos + d.inscripciones + d.mensajes, u:'cosas esperan', x:`${plural(d.reclamos, 'reclamo', 'reclamos')} · ${plural(d.inscripciones, 'inscripción', 'inscripciones')} · ${plural(d.mensajes, 'mensaje', 'mensajes')} sin leer` },
    { e:'💰', c:'#1b8f5a', t:'Las expensas', n:PV.pct(d.alDia, d.lotes), u:'% de los lotes al día', x:d.porAcred ? `${plural(d.porAcred, 'pago', 'pagos')} por acreditar` : 'ningún pago esperando' },
    { e:'🏨', c:'#b85f24', t:'El hotel', n:d.alojados, u:d.alojados === 1 ? 'huésped hoy' : 'huéspedes hoy', x:d.hayHotel ? `${plural(d.traslados, 'traslado', 'traslados')} · ${d.porHacer} por hacer` : 'sin cuenta del hotel' },
  ];
}
function dia10Pintar(){
  const caja = $('#dia10'); if (!caja) return;
  const ts = dia10Tarjetas(), k = ts[DIA10.i]; if (!k) return dia10Cerrar();
  caja.style.setProperty('--c', k.c);
  caja.innerHTML = `<div class="d10-barras">${ts.map((_, j) => `<i class="${j < DIA10.i ? 'lleno' : j === DIA10.i ? 'va' : ''}"><b></b></i>`).join('')}</div>
    <button class="d10-x" data-a="dia10-cerrar" aria-label="Cerrar">${I('x')}</button>
    <div class="d10-t" aria-live="polite"><span class="d10-e">${k.e}</span><small>${k.t}</small>
      <b class="dn-num" data-k="d10-${DIA10.i}" data-n="${k.n}">${k.n}</b><em>${k.u}</em><p>${k.x}</p></div>
    <button class="d10-ant" data-a="dia10-ir" data-v="-1" aria-label="Anterior"></button><button class="d10-sig" data-a="dia10-ir" data-v="1" aria-label="Siguiente"></button>
    <p class="d10-pie">El día en 10 segundos · tocá a los costados para pasar</p>`;
  /* Que el número cuente desde cero cada vez. */
  if (typeof NUM_ANTES !== 'undefined') delete NUM_ANTES['d10-' + DIA10.i];
  if (typeof animarNumeros === 'function') animarNumeros(caja);
  clearTimeout(DIA10.t); DIA10.t = setTimeout(() => { DIA10.i++; dia10Pintar(); }, DIA10.dur);
}
function dia10Abrir(){
  if (!esAdmin()) return;
  let caja = $('#dia10');
  if (!caja){ caja = document.createElement('div'); caja.id = 'dia10'; caja.setAttribute('role', 'dialog'); caja.setAttribute('aria-label', 'El día en 10 segundos'); document.body.appendChild(caja); }
  DIA10.i = 0; dia10Pintar();
  document.addEventListener('keydown', dia10Tecla);
}
function dia10Cerrar(){ clearTimeout(DIA10.t); $('#dia10')?.remove(); document.removeEventListener('keydown', dia10Tecla); }
function dia10Tecla(e){ if (e.key === 'Escape') dia10Cerrar(); else if (e.key === 'ArrowRight') A['dia10-ir']({ dataset:{ v:'1' } }); else if (e.key === 'ArrowLeft') A['dia10-ir']({ dataset:{ v:'-1' } }); }
A['dia10'] = () => dia10Abrir();
A['dia10-cerrar'] = () => dia10Cerrar();
A['dia10-ir'] = el => { DIA10.i = Math.max(0, DIA10.i + +el.dataset.v); dia10Pintar(); };

/* Al pintar la portada de la Administración: los números cuentan y, la
   primera vez del día, se ve solo el día en 10 segundos (en el manual
   interactivo, no: ahí guía el manual). */
{
  const antes = R.inicio.alPintar;
  R.inicio.alPintar = p => {
    if (antes) antes(p);
    const pv = document.querySelector('#cuerpo .pv'); if (!pv) return;
    if (typeof animarNumeros === 'function') animarNumeros(document.querySelector('#cuerpo'));
    const u = yo(), clave = `bhc.admin.dia10.${u ? u.id : ''}`;
    let visto = '';
    try { visto = localStorage.getItem(clave) || ''; } catch(e){ visto = hoyISO(); }
    if (visto !== hoyISO() && !(typeof MODO_MANUAL !== 'undefined' && MODO_MANUAL) && !document.querySelector('dialog[open]')){
      try { localStorage.setItem(clave, hoyISO()); } catch(e){}
      setTimeout(() => { if (document.querySelector('#cuerpo .pv') && !document.querySelector('dialog[open]')) dia10Abrir(); }, 700);
    }
  };
}
