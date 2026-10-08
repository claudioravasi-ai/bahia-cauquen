/* =========================================================
   EL SUPERVISOR DE LA GUARDIA (pedido de Claudio, 07-10-2026)
   -------------------------------------------------------
   Una cuenta personal con rol "supervisor" para quien controla el servicio
   de la garita (el supervisor de la empresa de vigilancia, o quien designe
   la Administración). Ve en tiempo real lo mismo que la garita: ingresos y
   egresos, bitácora, turnos, policía y rondas, peticiones, casas solas,
   avisos urgentes, SOS y pedidos del DEA. NO puede tocar nada: lo único que
   hace es escribirles a la garita y a la Administración.

   Tres capas, para que "solo mirar" sea de verdad:
     1. La pantalla: abre solo VENTANAS_SUPERVISOR (app.js) y las acciones de
        la garita le dicen que eso lo hace la garita (soloGarita, core.js).
     2. Este archivo: Store.cambiar, para el supervisor, primero prueba el
        cambio sobre una copia; si toca algo que no sea su conversación, sus
        avisos o su ficha, no se hace (Supervisor.queToca).
     3. La nube: Nube.guardar no manda nada más que eso, y las reglas de la
        base no le dejan escribir en ningún otro lado (reglas-firebase.txt).

   Lo que NO ve, a propósito (Ley 25.326, mínimo privilegio): los mensajes
   privados de los vecinos con la garita o la Administración, "Estoy bien",
   los huéspedes del hotel, expensas, pagos, reclamos y la auditoría.

   Conversaciones: una por supervisor y por lado, con id fijo
     supGarita-<uid>  (supervisor ↔ garita)        pv/privadosSupGarita/<uid>
     supAdmin-<uid>   (supervisor ↔ Administración) pv/privadosSupAdmin/<uid>
   ========================================================= */
const Supervisor = {
  ensayo:false, toque:0,
  /* Qué cambiaría un Store.cambiar del supervisor. Devuelve '' si es algo
     que puede hacer (su conversación, sus avisos, su ficha) o el nombre de
     lo que tocaría si no. */
  queToca(real, prueba){
    const u = yo(); if (!u) return 'sin sesión';
    const claves = new Set([...Object.keys(real), ...Object.keys(prueba)]);
    for (const k of claves){
      const a = JSON.stringify(real[k] ?? null), b = JSON.stringify(prueba[k] ?? null);
      if (a === b) continue;
      if (k === 'notifs') continue;
      /* El visto de un parte: solo agregar uno nuevo, a su nombre (no cambiar ni borrar). */
      if (k === 'vistos'){ const ids = new Set(aLista(real[k]).map(x => x && x.id));
        const malo = aLista(prueba[k]).some(x => x && !ids.has(x.id) && x.por !== u.id) || aLista(real[k]).some(x => x && JSON.stringify(x) !== JSON.stringify(aLista(prueba[k]).find(z => z && z.id === x.id)));
        if (malo) return k; continue; }
      if (k !== 'privados' && k !== 'users') return k;
      /* Registro por registro: solo lo suyo. */
      const porId = l => new Map(aLista(l).filter(x => x && x.id).map(x => [x.id, JSON.stringify(x)]));
      const va = porId(real[k]), vb = porId(prueba[k]);
      for (const id of new Set([...va.keys(), ...vb.keys()])){
        if (va.get(id) === vb.get(id)) continue;
        const x = aLista(prueba[k]).find(z => z && z.id === id) || aLista(real[k]).find(z => z && z.id === id);
        const mio = k === 'users' ? id === u.id : x && x.userId === u.id && (x.con === 'supGarita' || x.con === 'supAdmin');
        if (!mio || !vb.has(id)) return k;
      }
    }
    return '';
  },
  frenar(que){
    console.info('Supervisión: no se guarda un cambio en', que);
    if (Date.now() - this.toque < 2500) toast('Desde la supervisión solo se mira: eso lo hace la garita o la Administración. Si hace falta, escribiles.', 'eye');
  },
};
/* Lo que toca la persona (un botón, un formulario): si lo que sigue no se
   puede hacer, se le explica. Lo que corre solo (relojes, avisos) se frena
   en silencio. */
['click', 'submit'].forEach(ev => document.addEventListener(ev, () => { Supervisor.toque = Date.now(); }, true));
(() => {
  const original = Store.cambiar;
  Store.cambiar = function(fn){
    if (!esSupervisor()) return original.call(this, fn);
    let prueba;
    try { prueba = structuredClone(this.s); } catch(e){ prueba = JSON.parse(JSON.stringify(this.s)); }
    Supervisor.ensayo = true;
    try { fn(prueba); } finally { Supervisor.ensayo = false; }
    const que = Supervisor.queToca(this.s, prueba);
    if (que){ Supervisor.frenar(que); return; }
    return original.call(this, fn);
  };
})();

/* ---------- quiénes ---------- */
const cuentasSupervision = () => aLista(Store.s.users).filter(x => x && x.rol === 'supervisor' && x.estado === 'aprobado');
const haySupervision = () => cuentasSupervision().length > 0;
/* ¿La app de la garita está abierta ahora? (barrio/presencia) */
function garitaEnLinea(){
  if (typeof Presencia === 'undefined' || !Presencia.d) return null;
  const ids = aLista(Store.s.users).filter(x => x && x.rol === 'guardia' && x.estado === 'aprobado').map(x => x.id);
  const eqs = ids.flatMap(id => { const e = Presencia.d[id]; return e && typeof e === 'object' ? Object.values(e).filter(Boolean) : []; });
  if (!eqs.length) return { conectada:false };
  return { conectada:true, activa:eqs.some(e => e.activa), equipos:eqs.length };
}

/* ---------- conversaciones ---------- */
const CANALES_SUP = {
  supGarita: { t:'Garita', icon:'shield', color:'brand', lado:'guardia' },
  supAdmin:  { t:'Administración', icon:'sliders', color:'accent', lado:'admin' },
};
const esCanalSup = p => /^sup(Garita|Admin)(\||$)/.test(String(p || ''));
const hiloSup = (con, supId) => aLista(Store.s.privados).find(h => h && h.userId === supId && h.con === con);
const quienSoySup = () => esSupervisor() ? 'supervisor' : esGuardia() ? 'guardia' : 'admin';
const sinLeerSup = (con, supId, yoSoy = quienSoySup()) => aLista(hiloSup(con, supId)?.msgs).filter(m => m && m.from !== yoSoy && !m.leido).length;
/* Para la garita o la Administración: cuántos mensajes de supervisores sin leer. */
const sinLeerDeSupervision = con => cuentasSupervision().reduce((n, x) => n + sinLeerSup(con, x.id), 0);
const puedeCanalSup = con => esSupervisor() || (con === 'supGarita' ? esGuardia() : con === 'supAdmin' ? esAdmin() : false);

function chatSupervision(p){
  const [c0, idP] = String(p || '').split('|'), con = CANALES_SUP[c0] ? c0 : 'supGarita', C = CANALES_SUP[con], u = yo();
  if (!u || !puedeCanalSup(con)) return vacio('lock', 'Esta conversación es entre la supervisión de la guardia y ' + (con === 'supGarita' ? 'la garita.' : 'la Administración.'));
  const yoSoy = quienSoySup();
  let supId = esSupervisor() ? u.id : idP;
  if (!supId){
    const sups = cuentasSupervision();
    if (sups.length === 1) supId = sups[0].id;
    else return sups.length ? sups.map(x => { const nl = sinLeerSup(con, x.id), ult = aLista(hiloSup(con, x.id)?.msgs).at(-1);
        return `<button class="superficie" data-a="abrir" data-v="privado" data-p="${con}|${esc(x.id)}">${avatar(x)}<span class="txt"><b>${esc(x.nombre)}</b><small>${ult ? esc(ult.text.slice(0, 70)) + ' · ' + hace(ult.createdAt) : 'Sin mensajes'}</small></span>${nl ? `<span class="pill p-danger">${nl}</span>` : I('right')}</button>`; }).join('')
      : vacio('eye', esAdmin() ? 'Todavía no hay supervisión de la guardia. Se habilita en Gestión → Garita y seguridad → Supervisión de la guardia.' : 'Todavía no hay supervisión de la guardia.');
  }
  const sup = usuario(supId) || {};
  const h = hiloSup(con, supId), msgs = aLista(h && h.msgs);
  if (h && msgs.some(m => m.from !== yoSoy && !m.leido)){ msgs.forEach(m => { if (m.from !== yoSoy) m.leido = true; }); h.msgs = msgs; Store.guardar(); setTimeout(pintarTop, 0); }
  const de = m => m.from === 'supervisor' ? 'Supervisión · ' + esc(primerNombre(sup.nombre))
    : m.from === 'guardia' ? 'Garita' + (guardiasEn(m.createdAt).length ? ' · ' + esc(guardiasEn(m.createdAt).join(', ')) : '') : 'Administración';
  const chips = esSupervisor() ? `<div class="chips">${Object.entries(CANALES_SUP).map(([k, x]) => { const nl = k !== con ? sinLeerSup(k, u.id) : 0;
    return `<button class="chip ${k === con ? 'on' : ''}" data-a="abrir" data-v="privado" data-p="${k}">${I(x.icon)}${x.t}${nl ? `<span class="n">${nl}</span>` : ''}</button>`; }).join('')}</div>` : '';
  const vacioTxt = esSupervisor() ? (con === 'supGarita' ? 'Escribile a la garita: le suena al instante. Lo leen solo la garita y vos.' : 'Escribile a la Administración. Lo leen solo la Administración y vos.')
    : `Mensajes con ${esc(sup.nombre || 'la supervisión')}. Ningún vecino los ve.`;
  return `<div class="chat-wrap">${chips}<div class="chat">${msgs.length ? msgs.map(m => `<div class="msg ${m.from === yoSoy ? 'mia' : ''}">
      <div class="b">${m.from !== yoSoy ? `<small class="msg-de">${de(m)}</small>` : ''}${esc(m.text)}<time>${hora(m.createdAt)}</time></div></div>`).join('')
      : vacio('lock', vacioTxt)}</div>
    <form class="chatbar" data-f="privado-sup" data-u="${esc(supId)}" data-con="${con}"><input name="text" id="privIn" required maxlength="800" autocomplete="off"
      placeholder="${esSupervisor() ? 'Mensaje a ' + (con === 'supGarita' ? 'la garita' : 'la Administración') : 'Mensaje a la supervisión'}"><button class="btn btn-accent">${I('send')}</button></form></div>`;
}
/* R.privado ya existe (js/v-gestion.js): se le suman los dos canales. El
   supervisor, entre en el canal que entre, cae en uno de los suyos. */
(() => {
  const P = R.privado, render = P.render, titulo = P.titulo, sub = P.sub;
  P.render = p => esCanalSup(p) || esSupervisor() ? chatSupervision(esCanalSup(p) ? p : 'supGarita') : render.call(P, p);
  P.titulo = p => { if (!(esCanalSup(p) || esSupervisor())) return typeof titulo === 'function' ? titulo(p) : titulo;
    const [c, id] = String(p || '').split('|'); if (esSupervisor()) return 'Mensajes';
    return id ? (usuario(id)?.nombre || 'Supervisión') : 'Supervisión de la guardia'; };
  P.sub = p => { if (!(esCanalSup(p) || esSupervisor())) return typeof sub === 'function' ? sub(p) : sub;
    const c = String(p || '').split('|')[0];
    return c === 'supAdmin' ? 'Supervisión y Administración · no lo ve ningún vecino' : 'Supervisión y garita · no lo ve ningún vecino'; };
})();
F['privado-sup'] = (d, form) => {
  const con = form.dataset.con, supId = form.dataset.u, texto = String(d.text || '').trim(), u = yo();
  if (!CANALES_SUP[con] || !texto || !u || !puedeCanalSup(con) || (esSupervisor() && supId !== u.id)) return;
  const yoSoy = quienSoySup();
  const para = yoSoy === 'supervisor' ? (con === 'supGarita' ? cuentasGarita() : cuentasAdministracion()) : [supId];
  Store.cambiar(s => {
    let h = s.privados.find(x => x.userId === supId && x.con === con);
    if (!h){ h = { id:`${con}-${supId}`, userId:supId, con, msgs:[] }; s.privados.push(h); }
    listaDe(h, 'msgs').push({ id:uid(), from:yoSoy, text:texto, createdAt:Date.now() });
    if (para.length) notificar(s, { para, titulo: yoSoy === 'supervisor' ? `Mensaje de la supervisión (${primerNombre(u.nombre)})` : yoSoy === 'guardia' ? 'Mensaje de la garita' : 'Mensaje de la Administración',
      texto:texto.slice(0, 90), icon:'eye', color:'brand', link: yoSoy === 'supervisor' ? `privado:${con}|${supId}` : `privado:${con}`, sonido:true });
  });
  const i = $('#privIn'); if (i){ i.value = ''; i.focus(); }
};

/* =========================================================
   LA PORTADA DEL SUPERVISOR
   Lo primero que importa: ¿la garita está conectada?, ¿hay turno?, ¿hay
   una emergencia? Después los números del día, lo último que pasó (en
   vivo, de la bitácora) y las puertas a cada cosa.
   ========================================================= */
R.supervisor = {
  titulo:'Supervisión', icon:'eye', color:'brand', ancha:true, sub:() => fechaLarga(hoyISO()),
  render(){
    if (!esSupervisor()) return vacio('lock', 'Solo para la supervisión de la guardia.');
    const s = Store.s, hoy = hoyISO(), u = yo();
    const g = garitaEnLinea(), t = turnoAbierto();
    const lista = pasesDelDia(hoy), adentro = lista.filter(p => estadoPase(p) === 'adentro').length, esperados = lista.filter(p => estadoPase(p) === 'esperado').length;
    const petPend = aLista(s.peticiones).filter(p => p && p.estado === 'pendiente').length;
    const solas = typeof casasSolas === 'function' ? casasSolas(hoy) : [];
    const sos = typeof sosAbiertas === 'function' ? sosAbiertas() : [];
    const deas = typeof Dea !== 'undefined' ? Dea.pedidos() : [];
    const alertasAct = typeof alertas === 'function' ? alertas().filter(alertaActiva) : [];
    const ps = t && typeof policiasAdentro === 'function' ? policiasAdentro(t) : [];
    const bit = aLista(s.bitacora).filter(b => b && b.at).sort((a, b) => b.at - a.at);
    const ult = bit[0];
    const hoyBit = bit.filter(b => isoDe(new Date(b.at)) === hoy).slice(0, 15);
    const estado = (ok, ic, tt, x) => `<div class="it"><span class="ic ic-${ok === true ? 'ok' : ok === false ? 'danger' : 'warn'}" style="width:34px;height:34px;border-radius:11px;display:grid;place-items:center">${I(ic)}</span><div class="txt"><b>${tt}</b><span style="white-space:normal">${x}</span></div></div>`;
    return `${PILA.length === 1 ? `<div class="titulo-vista"><h1>Supervisión de la guardia</h1><p>${fechaLarga(hoy)} · ${esc(primerNombre(u.nombre))}</p></div>` : ''}
      <div class="garita-vivo">${I('eye')}<div class="grow"><b>Solo para mirar, en tiempo real</b><span>Ves lo mismo que la garita, al instante. Registrar, firmar o cambiar algo lo hace la garita; vos les escribís a la garita o a la Administración (en Mensajes elegís a quién), das el visto a cada parte de turno y recibís las alertas.</span></div>
        ${(() => { const nl = sinLeerSup('supGarita', u.id) + sinLeerSup('supAdmin', u.id); return `<button class="btn btn-xs btn-pri" data-a="abrir" data-v="privado" data-p="${sinLeerSup('supAdmin', u.id) && !sinLeerSup('supGarita', u.id) ? 'supAdmin' : 'supGarita'}">${I('chat')}Mensajes${nl ? ` (${nl} sin leer)` : ''}</button>`; })()}</div>
      ${deas.map(x => { const v = usuario(x.userId) || {}; return aviso('danger latido', 'heart', `PIDEN EL DEA · ${esc(v.casa || '')} · ${esc(apellidoDe(v.nombre) || '')}`, `${hace(x.at)} · la garita todavía no salió con el DEA`, `<button class="btn btn-xs btn-sec" data-a="abrir" data-v="privado" data-p="supGarita">Escribirle a la garita</button>`); }).join('')}
      ${typeof bandaDeaEnCurso === 'function' ? bandaDeaEnCurso() : ''}
      ${sos.map(x => { const v = usuario(x.userId) || {}, tp = TIPOS_SOS[x.tipo] || TIPOS_SOS.otra;
        return aviso(x.estado === 'activa' ? 'danger latido' : 'warn', 'siren', `SOS · ${esc(tp.nombre)} · ${esc(v.casa || '')}`, `${esc(v.nombre || '')} · ${hace(x.at)} · ${esc(SOS_ESTADO[x.estado] || x.estado)}`, `<button class="btn btn-xs btn-sec" data-a="sos-ver" data-id="${esc(x.id)}">Ver</button>`); }).join('')}
      ${alertasAct.map(a => aviso('warn', 'siren', `Aviso urgente activo: ${esc(a.titulo)}`, esc(a.zona || ''), `<button class="btn btn-xs btn-sec" data-a="abrir" data-v="alertas">Ver respuestas</button>`)).join('')}
      ${sec('La garita ahora')}
      <div class="card lista">
        ${g === null ? estado(null, 'wifi', 'Conexión de la garita', 'Sin dato en este modo (la app no está conectada con la base del barrio).')
          : estado(g.conectada ? (g.activa ? true : null) : false, 'wifi', g.conectada ? (g.activa ? 'La app de la garita está abierta' : 'La app de la garita está conectada, pero no en pantalla') : 'La app de la garita NO está conectada',
            g.conectada ? (g.activa ? 'Lo que pasa en la entrada lo ven al instante.' : 'Puede estar minimizada o con la pantalla apagada: los avisos le llegan igual al celular.') : 'Ni abierta ni conectada. Llamá a la garita o escribile: el mensaje le queda.')}
        ${estado(!!t, 'clock', t ? `Turno ${esc(t.turno)} · desde las ${hora(t.at)} h` : 'Sin turno abierto', t ? (aLista(t.guardias).length ? 'De guardia: ' + esc(aLista(t.guardias).join(', ')) : 'No anotaron quiénes están') : 'La garita todavía no anotó quiénes están de turno.')}
        ${estado(ult ? (Date.now() - ult.at < 3 * HORA ? true : null) : null, 'book', ult ? `Último registro: ${hace(ult.at)}` : 'Sin registros en el libro', ult ? esc(ult.texto.slice(0, 110)) : 'Cuando la garita anote algo, aparece acá.')}
        ${t ? estado(ps.length ? true : null, 'shield', ps.length ? `Policía de servicio: ${esc(ps.map(p => p.nombre).join(', '))}` : 'Sin policía de servicio ahora', ps.length ? ps.map(p => { const rc = typeof rondaEnCurso === 'function' ? rondaEnCurso(p) : null; return `${esc(p.nombre)}: ${plural(aLista(p.rondas).length, 'ronda')}${rc ? ' · ronda en curso' : ''}`; }).join(' · ') : 'Si hoy corresponde, lo registra la garita al llegar.') : ''}
      </div>
      ${sec('Hoy en la entrada')}
      <div class="garita-kpis sup-kpis"><div class="kpi"><b>${esperados}</b><span>Visitas anunciadas que todavía no llegaron</span></div><div class="kpi"><b>${adentro}</b><span>Visitas que entraron y siguen en el barrio</span></div><div class="kpi"><b>${petPend}</b><span>Pedidos firmados de vecinos que la garita no recibió</span></div><div class="kpi"><b>${solas.length}</b><span>Casas de vecinos de viaje para revisar hoy</span></div></div>
      <p class="muted tiny" style="margin:-4px 2px 12px">Las visitas son las que los vecinos anunciaron para hoy con su código o QR. Cuando la garita registra que una entra, pasa de "no llegaron" a "en el barrio"; cuando registra la salida, deja de contarse.</p>
      ${sec('Lo último, en vivo', `<button class="link" data-a="abrir" data-v="bitacora">Libro completo</button>`)}
      <div class="card">${hoyBit.length ? `<div class="lista">${hoyBit.map(b => { const tb = TIPOS_BIT[b.tipo] || TIPOS_BIT.novedad;
        return `<div class="it"><span class="ic ic-${tb[2]}" style="width:34px;height:34px;border-radius:11px;display:grid;place-items:center">${I(tb[1])}</span><div class="txt"><b>${esc(b.texto)}</b><span>${hora(b.at)} · ${esc(tb[0])}</span></div></div>`; }).join('')}</div>` : vacio('book', 'Hoy todavía no hay registros en el libro de guardia.')}</div>
      ${(() => { const ps = typeof partesSinVisto === 'function' ? partesSinVisto() : []; return ps.length ? sec(`Partes de turno para dar el visto (${ps.length})`) + `<div class="card lista">${ps.slice(0, 8).map(r => `<div class="it"><div class="txt"><b>${esc(r.turno)} · ${relDia(isoDe(new Date(r.at)))}</b><span>${hora(r.at)} a ${hora(r.cerradoAt)} h · ${esc(aLista(r.guardias).join(', '))}</span></div>
          <button class="btn btn-xs btn-sec" data-a="parte-ver" data-id="${esc(r.id)}">Leer</button><button class="btn btn-xs btn-pri" data-a="visto-parte" data-id="${esc(r.id)}">${I('eye')}Visto</button></div>`).join('')}</div>` : ''; })()}
      ${(() => { const as = aLista(s.alertasSup).filter(a => a && Date.now() - a.at < 7 * DIA).sort((a, b) => b.at - a.at).slice(0, 8); return as.length ? sec('Alertas de los últimos 7 días') + `<div class="card lista">${as.map(a => { const tt = (typeof TIPOS_ALERTA_SUP !== 'undefined' && TIPOS_ALERTA_SUP[a.tipo]) || ['Alerta', 'alert', 'warn'];
          return `<div class="it"><span class="ic ic-${tt[2]}" style="width:34px;height:34px;border-radius:11px;display:grid;place-items:center">${I(tt[1])}</span><div class="txt"><b>${esc(a.titulo || tt[0])}</b><span style="white-space:normal">${esc(a.texto || '')} · ${relDia(isoDe(new Date(a.at))).toLowerCase()} ${hora(a.at)} h${a.hasta ? ' · volvió ' + hora(a.hasta) + ' h' : ''}</span></div></div>`; }).join('')}</div>` : ''; })()}
      ${sec('Mirar')}
      <div class="mosaico">
        ${teja({ v:'garita', icon:'gate', color:'brand', t:'Garita en vivo', s:'Ingresos, avisos, camión, policía', n: lista.length || '' })}
        ${teja({ v:'vecinos', icon:'search', color:'sky', t:'Buscar un vecino', s:'Lote, dirección y teléfonos' })}
        ${teja({ v:'bitacora', icon:'book', color:'wood', t:'Bitácora', s:'El libro de guardia' })}
        ${teja({ v:'turnos', icon:'clock', color:'sky', t:'Turnos y policía', s:'Quién trabajó, rondas y servicios' })}
        ${teja({ v:'peticiones', icon:'edit', color:'warn', t:'Peticiones', s:'Pedidos firmados de los vecinos', badge: petPend })}
        ${teja({ v:'hotel-vivo', icon:'star', color:'wood', t:HOTEL_NOMBRE, s:'Vans, traslados y eventos (sin huéspedes)' })}
        ${teja({ v:'obras', icon:'wrench', color:'wood', t:'Obras', s:'Las del día y en curso' })}
        ${teja({ v:'proveedores', icon:'box', color:'accent', t:'Proveedores', s:'ART y seguro al día' })}
        ${teja({ v:'informe-servicio', icon:'file', color:'ok', t:'Informe mensual', s:'Turnos, rondas, emergencias y alertas del mes' })}
        ${teja({ v:'manual', icon:'book', color:'accent', t:'Manual de uso', s:'El capítulo de la supervisión' })}
      </div>
      <p class="muted tiny" style="margin-top:12px">${I('lock')} Estás obligado/a a guardar secreto sobre lo que ves (art. 10 de la Ley 25.326). <button class="link" data-a="compromiso-imprimir" data-id="${esc(u.id)}">Mi compromiso de confidencialidad</button></p>`;
  },
};

/* =========================================================
   LA ADMINISTRACIÓN HABILITA Y QUITA LA SUPERVISIÓN
   Quien supervisa se inscribe como cualquiera ("Todavía no tengo cuenta")
   y en "Tu lote" elige "Supervisión de la guardia". La Administración lo
   aprueba desde Inscripciones o desde acá; al aprobarlo se le borra el
   DNI y el lote (no los necesita). Puede haber más de una.
   ========================================================= */
R.supervisores = {
  titulo:'Supervisión de la guardia', icon:'eye', color:'brand', sub:'Quién mira la garita en vivo, sin tocarla',
  render(q){
    if (!esAdmin()) return vacio('lock', 'Solo para la Administración.');
    const sups = cuentasSupervision(), qq = normTxt(q || '');
    const cands = aLista(Store.s.users).filter(u => u && u.estado === 'pendiente' && u.rol === 'vecino' && !esCorreoGarita(u.email))
      .filter(u => !qq || normTxt(`${u.nombre} ${u.email}`).includes(qq))
      .sort((a, b) => (b.casa === 'Supervisión') - (a.casa === 'Supervisión')).slice(0, 30);
    return `<div class="card plana small" style="margin-bottom:12px;line-height:1.55">${I('eye')} <b>Qué puede hacer la supervisión:</b> ver en tiempo real lo mismo que la garita (ingresos y egresos, bitácora, turnos, policía y rondas, peticiones, casas solas, avisos urgentes, SOS y pedidos del DEA), escribirles a la garita y a la Administración, dar el visto a cada parte de turno y leer el informe mensual. Le llegan alertas al celular. <b>No puede</b> registrar, firmar, borrar ni cambiar nada de la garita, y no ve los mensajes de los vecinos, "Estoy bien", los huéspedes del hotel ni las expensas.</div>
      ${sups.length ? sups.map(x => { const nl = sinLeerSup('supAdmin', x.id);
        return `<div class="card"><div class="row" style="gap:12px">${avatar(x)}<div class="grow"><b>${esc(x.nombre)}</b><div class="muted small">${esc(x.email || '')}${x.tel ? ' · ' + esc(x.tel) : ''}</div><div class="muted tiny">Supervisión desde ${x.supervisorDesde ? fechaCorta(isoDe(new Date(x.supervisorDesde))) : '—'}</div></div></div>
          <div class="btns" style="margin-top:10px"><button class="btn btn-sm btn-sec" data-a="abrir" data-v="privado" data-p="supAdmin|${esc(x.id)}">${I('chat')}Mensajes${nl ? ` (${nl})` : ''}</button>
            <button class="btn btn-sm btn-sec" data-a="compromiso-imprimir" data-id="${esc(x.id)}">${I('file')}Su compromiso de confidencialidad</button>
            <button class="btn btn-sm btn-danger-soft" data-a="sup-quitar" data-id="${esc(x.id)}">${I('x')}Quitarle el acceso</button></div></div>`; }).join('')
        : aviso('info', 'eye', 'Todavía no hay supervisión', 'Quien supervisa se inscribe desde "Soy vecino nuevo" (o "Todavía no tengo cuenta") y en "Tu lote" elige "Supervisión de la guardia". Después lo habilitás abajo.')}
      <div class="card plana small" style="margin-top:10px">${I('file')} Antes de habilitarlo, que firme el compromiso de confidencialidad: imprimilo con el botón "Su compromiso de confidencialidad" de cada supervisor (sale con su nombre y su función) o en blanco desde Protección de datos. El firmado se guarda en papel, en la Administración.</div>
      ${sec('Alertas, vistos e informe')}
      ${ajustesSupervision()}
      ${superficie({ a:'abrir', v:'informe-servicio', icon:'file', color:'ok', t:'Informe mensual del servicio', s:'El mismo que le llega por correo a la supervisión el día 1' })}
      <form data-f="sup-buscar" class="linea-form" style="margin:14px 0 8px"><input name="q" value="${esc(q || '')}" placeholder="Buscar una inscripción por nombre o correo"><button class="btn btn-pri">${I('search')}</button></form>
      ${sec('Habilitar una inscripción como supervisión')}
      ${cands.length ? `<div class="card lista">${cands.map(u => `<div class="it"><div class="txt"><b>${esc(u.nombre)}</b><span>${esc(u.email || '')} · ${u.casa === 'Supervisión' ? '<b>pidió supervisión</b>' : 'inscripción pendiente · ' + esc(u.casa || 'sin lote')}</span></div>
        <button class="btn btn-xs btn-pri" data-a="sup-hacer" data-id="${esc(u.id)}">Habilitar</button></div>`).join('')}</div>`
        : vacio('users', 'No hay inscripciones pendientes.')}
      <p class="muted tiny" style="margin-top:12px">${I('lock')} Al habilitarla, la cuenta pasa a "Supervisión", se le borran el DNI y el lote cargados y solo ve lo de la garita. Al quitarle el acceso vuelve a inscripción pendiente y deja de ver todo.</p>`;
  },
};
F['sup-buscar'] = d => abrir('supervisores', d.q || '');
const hacerSupervision = (s, id) => { const x = s.users.find(z => z.id === id); if (!x) return null;
  Object.assign(x, { rol:'supervisor', estado:'aprobado', casa:'Supervisión', dni:'', representante:false, poderOk:false, relacion:'', aprobadoAt:x.aprobadoAt || Date.now(), supervisorDesde:Date.now() });
  return x; };
A['sup-hacer'] = async el => {
  if (!esAdmin()) return;
  const u = usuario(el.dataset.id); if (!u || u.estado !== 'pendiente' || u.rol !== 'vecino') return;
  if (!await confirmar('Habilitar la supervisión de la guardia', `${u.nombre} (${u.email}) va a ver en tiempo real todo lo de la garita, con los datos de las visitas y de los vecinos, sin poder cambiar nada. Habilitalo solo si es la persona que controla el servicio y ya firmó el compromiso de confidencialidad.`, { si:'Habilitar' })) return;
  Store.cambiar(s => { const x = hacerSupervision(s, u.id); if (x) auditar(s, 'Habilitó la supervisión de la guardia', `${x.nombre} · ${x.email || ''}`, x.id); });
  Correo.enviar({ para:u.email, asunto:'Tu acceso a la supervisión de la garita', tipo:'clave',
    html:Correo.plantilla('Ya tenés acceso', `<p>Hola ${esc(primerNombre(u.nombre))}: la Administración del barrio ${esc(Store.s.config.nombre)} habilitó tu cuenta como <b>supervisión de la guardia</b>. Entrá con tu correo y la contraseña que elegiste.</p><p style="font-size:13px">Ves la garita en vivo, sin poder cambiar nada. Lo que ves es reservado (art. 10 de la Ley 25.326).</p>`, { texto:'Entrar a la app', url:urlApp() }) });
  toast('Listo: ya puede entrar como supervisión', 'eye'); refrescar();
};
A['sup-quitar'] = async el => {
  if (!esAdmin() || !await confirmar('Quitar el acceso de supervisión', 'La cuenta deja de ver la garita y queda como inscripción pendiente. Sus mensajes con la garita y la Administración quedan guardados.', { si:'Quitar', peligro:true })) return;
  Store.cambiar(s => { const x = s.users.find(z => z.id === el.dataset.id); if (x){ x.rol = 'vecino'; x.estado = 'pendiente'; x.casa = ''; auditar(s, 'Quitó la supervisión de la guardia', x.email || x.id, x.id); } });
  toast('Acceso quitado', 'check'); refrescar();
};

/* DEMO LOCAL (?local): una cuenta de supervisión de muestra para probar. */
function supervisionDemo(s){
  if (s.supervisionDemoV || aLista(s.users).some(u => u.rol === 'supervisor')) return;
  s.users.push({ id:'u_super', nombre:'Marcelo Supervisor', casa:'Supervisión', email:'supervision@bahiacauquen.demo', tel:'2901 15 222333', rol:'supervisor', estado:'aprobado',
    clave:'SUP-2026', createdAt:Date.now() - 5 * DIA, aprobadoAt:Date.now() - 5 * DIA, supervisorDesde:Date.now() - 5 * DIA });
  s.supervisionDemoV = 1;
}

/* =========================================================
   07-10-2026 (2.ª tanda, pedido de Claudio): ALERTAS A LA SUPERVISIÓN,
   VISTO DE CADA PARTE DE TURNO E INFORME MENSUAL DEL SERVICIO.
   Todo se configura en Gestión → Supervisión de la guardia
   (config.supervision) y lo que pasa queda en staff/alertasSup y
   staff/vistos, que leen la Administración, la garita y la supervisión.
   ========================================================= */
const cfgSup = () => Object.assign({ alertas:true, garitaMin:20, sosMin:3, rondaMin:90, informe:true, informeAdmin:true }, Store.s.config.supervision || {});
const idsSupervision = () => cuentasSupervision().map(x => x.id);
const TIPOS_ALERTA_SUP = {
  garita: ['La garita sin conexión', 'wifi', 'warn'], sos: ['SOS sin respuesta', 'siren', 'danger'],
  dea: ['DEA sin salir', 'heart', 'danger'], ronda: ['Policía sin ronda', 'shield', 'warn'],
};
/* Una alerta: queda anotada (staff/alertasSup) y le llega, con sonido, a la
   supervisión y a quien se agregue (la Administración, la garita). */
function alertaSup(s, { tipo, ref, titulo, texto, para = [], link = 'garita', urgente = false }){
  const id = 'as-' + String(ref || uid()).replace(/[.#$/\[\]\s]/g, '_');
  if (!aLista(s.alertasSup).some(x => x && x.id === id)) s.alertasSup.unshift({ id, tipo, ref:ref || '', titulo, texto, at:Date.now() });
  const sup = idsSupervision(), otros = [...new Set(para)].filter(x => x && !sup.includes(x));
  if (sup.length) notificar(s, { para:sup, titulo, texto, icon:'eye', color:'danger', link:'supervisor', urgente, sonido:true });
  if (otros.length) notificar(s, { para:otros, titulo, texto, icon:'eye', color:'danger', link, urgente, sonido:true });
}
/* SOS o DEA sin "Voy en camino" a los N minutos → supervisión y
   Administración. La marca es la misma que usa el reloj del Apps Script
   (sos-esc-<id>): sale una sola vez, la dé un equipo o el servidor. */
REGLAS.push({ id:'sup-sos', n:'SOS o DEA sin respuesta → avisar a la supervisión y a la Administración',
  d:'Si a los minutos fijados (3, de fábrica) nadie de la garita tocó "Voy en camino", les suena en el celular a la supervisión de la guardia y a la Administración.',
  run(s){
    const c = cfgSup(); if (!c.alertas) return 0;
    const lim = Math.max(1, +c.sosMin || 3) * MIN; let n = 0;
    aLista(s.sos).filter(x => x && x.estado === 'activa' && !x.escaladoAt && Date.now() - x.at >= lim && Date.now() - x.at < 6 * HORA).forEach(x => {
      const v = usuario(x.userId) || {}, dea = x.tipo === 'dea', tp = (typeof TIPOS_SOS !== 'undefined' && (TIPOS_SOS[x.tipo] || TIPOS_SOS.otra)) || { nombre:'Emergencia' };
      n += marca(s, 'sos-esc-' + x.id, () => {
        const y = aLista(s.sos).find(z => z.id === x.id); if (y) y.escaladoAt = Date.now();
        alertaSup(s, { tipo: dea ? 'dea' : 'sos', ref:'sos-' + x.id, urgente:true, para:cuentasAdministracion(), link:'garita',
          titulo: dea ? 'El DEA todavía no salió' : 'SOS sin respuesta de la garita',
          texto:`${v.casa || 'Un lote'} · ${dea ? 'pidieron el DEA' : tp.nombre} hace ${Math.round((Date.now() - x.at) / MIN)} min y la garita no tocó "Voy en camino".` });
      });
    });
    return n;
  } });
/* El policía de servicio sin ronda en la última hora y media (o lo que se
   fije) → supervisión y garita. Lo mira el equipo de la garita (que tiene
   el libro de guardia) o el de la Administración. */
REGLAS.push({ id:'sup-ronda', n:'Policía sin ronda → avisar a la supervisión y a la garita',
  d:'Si el policía de servicio pasa el tiempo fijado (90 minutos, de fábrica) sin empezar una ronda, desde que ingresó o desde que terminó la última, avisa a la supervisión y a la garita.',
  run(s){
    const c = cfgSup(); if (!c.alertas || !(esGuardia() || esAdmin())) return 0;
    const t = turnoAbierto(); if (!t) return 0;
    const lim = Math.max(20, +c.rondaMin || 90) * MIN, ahora = Date.now(); let n = 0;
    policiasAdentro(t).forEach(p => {
      if (rondaEnCurso(p)) return;
      const ult = p.rondas.reduce((m, r) => Math.max(m, r.fin || r.inicio || 0), 0), ref = Math.max(p.entra || 0, ult);
      if (!ref || ahora - ref < lim) return;
      n += marca(s, `ronda-falta-${p.id}-${ref}`, () => alertaSup(s, { tipo:'ronda', ref:`ronda-${p.id}-${ref}`, para:cuentasGarita(), link:'garita',
        titulo:`Sin ronda hace ${Math.round((Date.now() - ref) / MIN)} min`,
        texto:`Policía ${p.nombre}: ${ult ? 'la última ronda terminó a las ' + hora(ult) : 'ingresó a las ' + hora(p.entra)} h y no empezó otra.` }));
    });
    return n;
  } });

/* ---------- el visto de la supervisión en cada parte de turno ---------- */
const vistoDe = turnoId => aLista(Store.s.vistos).find(v => v && v.id === turnoId) || null;
const textoVisto = v => !v ? '' : `${v.estado === 'obs' ? 'Con observaciones' : 'Visto, sin observaciones'} · ${esc(primerNombre(v.nombre))} · ${fechaCorta(isoDe(new Date(v.at)))} ${hora(v.at)} h`;
/* Lo que se ve en "Últimos turnos" (Turnos) y en el parte. */
function vistoRenglon(t){
  if (!t.cerradoAt) return '';
  const v = vistoDe(t.id);
  if (v) return `<span class="${v.estado === 'obs' ? 'visto-obs' : 'visto-ok'}">${I(v.estado === 'obs' ? 'alert' : 'check')} ${textoVisto(v)}${v.obs ? ': ' + esc(v.obs) : ''}</span>`;
  return esSupervisor() ? `<span><button class="link" data-a="visto-parte" data-id="${esc(t.id)}">${I('eye')} Dar el visto</button></span>` : haySupervision() ? '<span class="muted">Sin el visto de la supervisión</span>' : '';
}
A['visto-parte'] = el => {
  if (!esSupervisor()) return;
  const t = registrosTurno().find(x => x.id === el.dataset.id); if (!t) return;
  if (vistoDe(t.id)){ toast('Ese parte ya tiene el visto', 'check'); return; }
  hoja(`Visto del parte · turno ${t.turno}`, `<p class="small" style="margin:0 0 12px">${fechaLarga(isoDe(new Date(t.at)))} · ${hora(t.at)} a ${hora(t.cerradoAt)} h · ${esc(aLista(t.guardias).join(', '))}</p>
    <button class="btn btn-sec btn-block" data-a="parte-ver" data-id="${esc(t.id)}" style="margin-bottom:12px">${I('file')}Leer el parte</button>
    <form data-f="visto-parte" data-id="${esc(t.id)}">
      <div class="seg" style="margin-bottom:10px"><label><input type="radio" name="estado" value="ok" checked><span>${I('check')}Sin observaciones</span></label>
        <label><input type="radio" name="estado" value="obs"><span>${I('alert')}Con observaciones</span></label></div>
      <div class="field"><label>Observaciones (si las hay)</label><textarea name="obs" maxlength="600" placeholder="Ej: la ronda de las 3 quedó incompleta y no se anotó el motivo."></textarea></div>
      <button class="btn btn-pri btn-block">${I('check')}Dar el visto</button>
      <p class="muted tiny" style="margin:10px 0 0">Queda como constancia y no se puede cambiar. Si hay observaciones, les llega un aviso a la garita y a la Administración.</p></form>`);
};
F['visto-parte'] = (d, form) => {
  const u = yo(); if (!esSupervisor() || !u) return;
  const id = form.dataset.id, t = registrosTurno().find(x => x.id === id); if (!t || vistoDe(id)) return;
  const obs = String(d.obs || '').trim();
  if (d.estado === 'obs' && !obs){ toast('Escribí la observación', 'edit'); return; }
  const estado = d.estado === 'obs' ? 'obs' : 'ok';
  Store.cambiar(s => {
    s.vistos.unshift({ id, turnoId:id, por:u.id, nombre:u.nombre, at:Date.now(), estado, obs: estado === 'obs' ? obs : '' });
    if (estado === 'obs') notificar(s, { para:[...cuentasGarita(), ...cuentasAdministracion()], titulo:`Observaciones de la supervisión · turno ${t.turno}`, texto:obs.slice(0, 90), icon:'eye', color:'warn', link:'turnos', sonido:true });
  });
  cerrarHoja(); toast(estado === 'obs' ? 'Visto con observaciones: les avisamos a la garita y a la Administración' : 'Visto dado', 'check'); refrescar();
};
/* Partes cerrados de la última semana que esperan el visto. */
const partesSinVisto = () => registrosTurno().filter(t => t.cerradoAt && Date.now() - t.cerradoAt < 7 * DIA && !vistoDe(t.id));

/* =========================================================
   INFORME MENSUAL DEL SERVICIO DE VIGILANCIA
   Lo arma la app con lo que ya está en la base (turnos, policía y rondas,
   SOS y DEA, peticiones, accesos, incidentes, alertas y vistos). Se lee en
   la app (Gestión → Supervisión, o la portada de la supervisión), se
   imprime, y el día 1 sale solo por correo a cada supervisión (y a la
   Administración, si está tildado) con el mes anterior.
   Por correo va SIN datos de vecinos: los SOS y el DEA sin lote ni nombre,
   y en el texto del libro se tapan lotes, DNI y patentes. En la app, que
   solo abren la supervisión y la Administración, va completo.
   ========================================================= */
const mesAnterior = p => { const [y, m] = p.split('-').map(Number); return m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, '0')}`; };
const nombreMesInf = p => { const [y, m] = p.split('-').map(Number), n = MESES_LARGO[m] || ''; return `${n.charAt(0).toUpperCase() + n.slice(1)} de ${y}`; };
const minTxt = ms => ms == null ? '—' : ms < MIN ? 'menos de 1 min' : ms < HORA ? Math.round(ms / MIN) + ' min' : (ms / HORA).toFixed(1).replace('.', ',') + ' h';
const pct = (a, b) => b ? Math.round(a / b * 100) : null;
/* Para el correo: el texto libre del libro sin datos que identifiquen a nadie del barrio. */
const taparDatos = t => String(t || '').replace(/\blote\s*\d+\b/gi, 'un lote').replace(/\b\d{1,2}\.?\d{3}\.?\d{3}\b/g, '[DNI]')
  .replace(/\b[A-Z]{2}\s?\d{3}\s?[A-Z]{2}\b|\b[A-Z]{3}\s?\d{3}\b/gi, '[patente]');

function datosInforme(periodo){
  const [y, m] = periodo.split('-').map(Number), ini = new Date(y, m - 1, 1).getTime(), finMes = new Date(y, m, 1).getTime();
  const fin = Math.min(finMes, Date.now()), parcial = finMes > Date.now(), en = at => at >= ini && at < fin, s = Store.s;
  const bit = aLista(s.bitacora).filter(b => b && b.at && en(b.at));
  const todos = registrosTurno().slice().sort((a, b) => a.at - b.at);
  const turnos = todos.filter(t => en(t.at));
  /* Horas con un turno abierto (la unión de los intervalos) y horas sin turno. */
  const iv = turnos.map((t, i) => { const sig = todos[todos.indexOf(t) + 1]; const hasta = t.cerradoAt || (sig ? sig.at : Math.min(fin, t.at + 12 * HORA)); return [Math.max(ini, t.at), Math.min(fin, hasta)]; })
    .filter(([a, b]) => b > a).sort((a, b) => a[0] - b[0]);
  let cubierto = 0, hasta = ini; iv.forEach(([a, b]) => { const d = Math.max(a, hasta); if (b > d){ cubierto += b - d; hasta = b; } });
  const dias = Math.max(1, Math.round((fin - ini) / DIA)), esperados = dias * turnosConfig().length;
  const porGuardia = {};
  turnos.forEach(t => aLista(t.guardias).forEach(g => { const k = normTxt(g); porGuardia[k] = porGuardia[k] || { nombre:g, turnos:0, horas:0 }; porGuardia[k].turnos++; porGuardia[k].horas += Math.max(0, (t.cerradoAt || fin) - t.at) / HORA; }));
  /* Policía: cada servicio (un ingreso), con sus rondas aunque haya pasado de un turno a otro. */
  const pol = {};
  todos.forEach(t => policiasDe(t).forEach(p => { if (!en(p.entra || 0)) return;
    const x = pol[p.id] = pol[p.id] || { id:p.id, nombre:p.nombre, matricula:p.matricula || '', entra:p.entra, sale:0, rondas:new Map() };
    if (p.sale) x.sale = Math.max(x.sale, p.sale);
    p.rondas.forEach(r => { const v = x.rondas.get(r.inicio); if (!v || (r.fin && !v.fin)) x.rondas.set(r.inicio, r); }); }));
  const servicios = Object.values(pol).map(p => { const rs = [...p.rondas.values()].sort((a, b) => a.inicio - b.inicio);
    return { ...p, rondas:rs, horas: p.sale ? (p.sale - p.entra) / HORA : null, completas: rs.filter(r => r.fin && !r.incompleta).length, incompletas: rs.filter(r => r.incompleta).length }; })
    .sort((a, b) => a.entra - b.entra);
  const rondasTot = servicios.reduce((n, p) => n + p.rondas.length, 0), rondasOk = servicios.reduce((n, p) => n + p.completas, 0);
  /* SOS y DEA: el tiempo hasta "Voy en camino" (o hasta que la dieron por atendida). */
  const emerg = aLista(s.sos).filter(x => x && en(x.at)).sort((a, b) => a.at - b.at).map(x => ({ ...x, resp: x.enCaminoAt ? x.enCaminoAt - x.at : x.atendidaAt ? x.atendidaAt - x.at : null }));
  const sos = emerg.filter(x => x.tipo !== 'dea'), dea = emerg.filter(x => x.tipo === 'dea');
  const resps = emerg.map(x => x.resp).filter(v => v != null);
  const pets = aLista(s.peticiones).filter(p => p && en(p.at)), petRec = pets.filter(p => p.recibidaAt);
  const llegadas = aLista(s.llegadas).filter(l => l && en(l.at));
  const revisiones = aLista(s.ausencias).reduce((n, a) => n + Object.keys(a && a.revisiones && typeof a.revisiones === 'object' ? a.revisiones : {}).filter(d => en(fechaDe(d).getTime() + 12 * HORA)).length, 0);
  const alertasM = aLista(s.alertasSup).filter(a => a && en(a.at)).sort((a, b) => a.at - b.at);
  const cerrados = turnos.filter(t => t.cerradoAt), vist = cerrados.map(t => ({ t, v:vistoDe(t.id) }));
  return { periodo, nombre:nombreMesInf(periodo), ini, fin, parcial, dias, turnos, esperados, cubierto, sinTurno: Math.max(0, fin - ini - cubierto),
    guardias:Object.values(porGuardia).sort((a, b) => b.turnos - a.turnos), servicios, rondasTot, rondasOk,
    sos, dea, respMedia: resps.length ? resps.reduce((a, b) => a + b, 0) / resps.length : null, respMax: resps.length ? Math.max(...resps) : null,
    escalados: emerg.filter(x => x.escaladoAt).length, pets, petRec, petPend: pets.filter(p => p.estado === 'pendiente').length,
    petDemora: petRec.length ? petRec.reduce((a, p) => a + (p.recibidaAt - p.at), 0) / petRec.length : null,
    ingresos: bit.filter(b => /^Ingreso/.test(b.texto || '')).length, egresos: bit.filter(b => /^Egreso/.test(b.texto || '')).length,
    llegadas, incidentes: bit.filter(b => b.tipo === 'incidente').sort((a, b) => a.at - b.at), novedades: bit.filter(b => b.tipo === 'novedad').length,
    revisiones, alertas:alertasM, vistos:vist, vistosOk: vist.filter(x => x.v && x.v.estado === 'ok').length, vistosObs: vist.filter(x => x.v && x.v.estado === 'obs'), sinVisto: vist.filter(x => !x.v).length };
}

/* El informe, con estilos en línea: el mismo HTML sirve para la app, para
   imprimir y para el correo (los programas de correo ignoran las hojas de
   estilo). `correo`: sin datos de vecinos. */
function informeHTML(d, { correo = false } = {}){
  const c = Store.s.config, AZ = '#0b3c47', VE = '#0d6b66', GR = '#5f6f6c', BO = '#e2e8e6';
  const sem = (v, bien, mal, alReves = false) => v == null ? '#9aa8a5' : (alReves ? v <= bien : v >= bien) ? '#1f9d55' : (alReves ? v <= mal : v >= mal) ? '#e0a100' : '#d64545';
  const cobertura = pct(d.turnos.length, d.esperados), rondasPct = pct(d.rondasOk, d.rondasTot);
  const kpi = (n, t, col = AZ) => `<td class="inf-kpi" style="width:25%;padding:5px;vertical-align:top"><div style="border:1px solid ${BO};border-radius:10px;padding:11px 6px;text-align:center;background:#fff">
    <div style="font-size:22px;font-weight:800;color:${col};line-height:1.1">${n}</div><div style="font-size:10px;color:${GR};text-transform:uppercase;letter-spacing:.02em;margin-top:4px;line-height:1.25;word-break:break-word">${t}</div></div></td>`;
  const linea = (col, txt) => `<tr><td style="width:14px;vertical-align:top;padding:5px 0"><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${col};margin-top:4px"></span></td><td style="padding:4px 0 4px 8px;font-size:14px">${txt}</td></tr>`;
  const h2 = (n, t) => `<h2 style="font-size:16px;color:${VE};margin:26px 0 8px;padding-bottom:6px;border-bottom:2px solid ${VE}">${n}. ${t}</h2>`;
  const tabla = (cab, filas, vacioTxt) => filas.length ? `<table style="width:100%;border-collapse:collapse;font-size:12.5px"><tr>${cab.map(x => `<th style="text-align:left;background:#f0f4f3;color:#456;font-size:10.5px;text-transform:uppercase;letter-spacing:.04em;padding:7px 8px;border-bottom:1px solid ${BO}">${x}</th>`).join('')}</tr>
    ${filas.map((f, i) => `<tr style="background:${i % 2 ? '#fafcfb' : '#fff'}">${f.map(x => `<td style="padding:7px 8px;border-bottom:1px solid ${BO};vertical-align:top">${x}</td>`).join('')}</tr>`).join('')}</table>` : `<p style="margin:0;color:${GR};font-size:13px">${vacioTxt}</p>`;
  const fh = at => `${fechaCorta(isoDe(new Date(at)))} ${hora(at)}`;
  const tipoSos = x => esc((typeof TIPOS_SOS !== 'undefined' && (TIPOS_SOS[x.tipo] || TIPOS_SOS.otra).nombre) || 'Emergencia');
  const quien = x => correo ? '' : ` · ${esc(usuario(x.userId)?.casa || '')}`;
  const logo = (() => { try { return new URL('icons/logo.png', urlApp()).href; } catch(e){ return ''; } })();
  const resumen = [
    [sem(cobertura, 95, 85), `<b>Turnos:</b> ${d.turnos.length} de ${d.esperados} esperados (${cobertura ?? '—'} %). ${d.sinTurno >= HORA ? `Hubo <b>${minTxt(d.sinTurno)}</b> sin turno abierto.` : 'Sin horas descubiertas.'}`],
    [sem(rondasPct, 90, 70), `<b>Rondas del policía:</b> ${d.rondasTot ? `${d.rondasOk} completas de ${d.rondasTot} (${rondasPct} %)` : 'no se registraron rondas'} en ${plural(d.servicios.length, 'servicio')}.`],
    [d.sos.length + d.dea.length ? sem(d.respMedia == null ? null : d.respMedia / MIN, 3, 6, true) : '#1f9d55', `<b>Emergencias:</b> ${plural(d.sos.length, 'SOS', 'SOS')} y ${plural(d.dea.length, 'pedido', 'pedidos')} del DEA${d.respMedia != null ? `; respuesta media ${minTxt(d.respMedia)}, la más lenta ${minTxt(d.respMax)}` : ''}${d.escalados ? `; <b>${plural(d.escalados, 'escalada', 'escaladas')}</b> por falta de respuesta` : ''}.`],
    [d.alertas.length ? '#e0a100' : '#1f9d55', `<b>Alertas a la supervisión:</b> ${d.alertas.length ? Object.entries(TIPOS_ALERTA_SUP).map(([k, t]) => [t[0], d.alertas.filter(a => a.tipo === k).length]).filter(x => x[1]).map(x => `${x[0].toLowerCase()} (${x[1]})`).join(', ') : 'ninguna'}.`],
    [d.vistosObs.length ? '#e0a100' : d.sinVisto ? '#9aa8a5' : '#1f9d55', `<b>Partes de turno:</b> ${d.vistosOk} con visto sin observaciones, ${d.vistosObs.length} con observaciones y ${d.sinVisto} sin visto.`],
  ];
  return `<div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:760px;margin:0 auto;color:#13211f;line-height:1.5;background:#fff">
    <table style="width:100%;border-collapse:collapse;background:${AZ};background:linear-gradient(135deg,${VE},${AZ});border-radius:14px 14px 0 0"><tr>
      <td style="padding:18px 14px 18px 20px;width:56px;vertical-align:middle">${logo ? `<img src="${logo}" alt="" width="56" height="56" style="width:56px;height:56px;min-width:56px;max-width:none;border-radius:50%;background:#fff;display:block;object-fit:cover">` : ''}</td>
      <td style="padding:20px 22px 20px 0;color:#fff"><div style="font-size:11px;letter-spacing:.14em;text-transform:uppercase;opacity:.85">Barrio ${esc(c.nombre)} · Seguridad</div>
        <div style="font-size:22px;font-weight:800;margin-top:2px">Informe mensual del servicio de vigilancia</div>
        <div style="font-size:14px;opacity:.9;margin-top:2px">${esc(d.nombre)}${d.parcial ? ' · parcial, hasta hoy' : ''}</div></td></tr></table>
    <div style="border:1px solid ${BO};border-top:0;border-radius:0 0 14px 14px;padding:20px 22px">
      <div style="background:#f6faf9;border-left:4px solid ${VE};border-radius:8px;padding:12px 14px">
        <div style="font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:${VE};font-weight:700;margin-bottom:4px">El mes en 30 segundos</div>
        <table style="border-collapse:collapse">${resumen.map(([col, t]) => linea(col, t)).join('')}</table></div>
      <table class="inf-kpis" style="width:100%;border-collapse:collapse;margin-top:14px;table-layout:fixed"><tr>${kpi(cobertura == null ? '—' : cobertura + ' %', 'Turnos cubiertos', sem(cobertura, 95, 85))}${kpi(rondasPct == null ? '—' : rondasPct + ' %', 'Rondas completas', sem(rondasPct, 90, 70))}${kpi(minTxt(d.respMedia), 'Respuesta a emergencias')}${kpi(d.alertas.length, 'Alertas', d.alertas.length ? '#e0a100' : '#1f9d55')}</tr>
        <tr>${kpi(d.ingresos, 'Ingresos registrados')}${kpi(d.llegadas.length, 'Llegadas sin aviso')}${kpi(d.pets.length, 'Peticiones')}${kpi(d.incidentes.length, 'Incidentes', d.incidentes.length ? '#e0a100' : AZ)}</tr></table>
      <p style="font-size:12px;color:${GR};margin:12px 0 0">Período: del ${fechaLarga(isoDe(new Date(d.ini)))} al ${fechaLarga(isoDe(new Date(d.fin - 1)))}. Abajo, el detalle de cada cosa para leer con tiempo.</p>

      ${h2(1, 'Turnos y guardias')}
      <p style="font-size:13px;margin:0 0 8px">${plural(d.turnos.length, 'turno abierto', 'turnos abiertos')} de ${d.esperados} esperados (${d.dias} días × ${turnosConfig().length} turnos) · ${minTxt(d.cubierto)} con turno abierto${d.sinTurno >= HORA ? ` · <b style="color:#d64545">${minTxt(d.sinTurno)} sin turno</b>` : ''}.</p>
      ${tabla(['Guardia', 'Turnos', 'Horas'], d.guardias.map(g => [esc(g.nombre), g.turnos, g.horas.toFixed(1).replace('.', ',')]), 'No se anotaron guardias.')}
      <div style="height:10px"></div>
      ${tabla(['Fecha', 'Turno', 'Horario', 'Guardias', 'Visto'], d.turnos.map(t => { const v = vistoDe(t.id);
        return [fechaCorta(isoDe(new Date(t.at))), esc(t.turno), `${hora(t.at)}–${t.cerradoAt ? hora(t.cerradoAt) : 'abierto'}${t.cierreAuto ? ' (cierre automático)' : ''}`, esc(aLista(t.guardias).join(', ')),
          v ? (v.estado === 'obs' ? '<b style="color:#c47f00">Con observaciones</b>' : '<span style="color:#1f9d55">Sin observaciones</span>') : t.cerradoAt ? '<span style="color:#9aa8a5">Sin visto</span>' : '—']; }), 'No se abrieron turnos en el período.')}

      ${h2(2, 'Policía contratada y rondas')}
      ${tabla(['Ingreso', 'Policía', 'Salida', 'Horas', 'Rondas'], d.servicios.map(p => [fh(p.entra), `${esc(p.nombre)}${p.matricula ? '<br><span style="color:' + GR + '">mat. ' + esc(p.matricula) + '</span>' : ''}`, p.sale ? fh(p.sale) : 'sin salida anotada',
        p.horas == null ? '—' : p.horas.toFixed(1).replace('.', ','), `${p.completas} completas${p.incompletas ? `, <b style="color:#d64545">${p.incompletas} incompletas</b>` : ''}${p.rondas.length ? '<br><span style="color:' + GR + ';font-size:11.5px">' + p.rondas.map(r => hora(r.inicio) + (r.fin ? '–' + hora(r.fin) : '') + (r.incompleta ? ' (inc.)' : '')).join(' · ') + '</span>' : ''}`]), 'No hubo servicios del policía en el período.')}

      ${h2(3, 'Emergencias: SOS y DEA')}
      ${tabla(['Fecha y hora', 'Tipo', 'Respuesta de la garita', 'Escalada', 'Cierre'], [...d.sos, ...d.dea].sort((a, b) => a.at - b.at).map(x => [fh(x.at),
        (x.tipo === 'dea' ? 'Pedido del DEA' : tipoSos(x)) + quien(x), x.resp == null ? '<span style="color:#d64545">sin registro</span>' : `<b style="color:${sem(x.resp / MIN, 3, 6, true)}">${minTxt(x.resp)}</b>`,
        x.escaladoAt ? '<b style="color:#d64545">Sí</b>' : 'No', esc({ resuelta:'Solucionada', atendida:'Atendida', en_camino:'En camino', activa:'Abierta' }[x.estado] || x.estado || '')]), 'No hubo emergencias en el período.')}
      ${correo && d.sos.length + d.dea.length ? `<p style="font-size:11.5px;color:${GR};margin:6px 0 0">Por correo no van el lote ni el nombre de quien pidió ayuda; están en el informe dentro de la app.</p>` : ''}

      ${h2(4, 'Alertas a la supervisión')}
      ${tabla(['Fecha y hora', 'Alerta', 'Detalle'], d.alertas.map(a => [fh(a.at), `<b>${esc((TIPOS_ALERTA_SUP[a.tipo] || [a.titulo])[0])}</b>`,
        esc(correo ? taparDatos(a.texto) : a.texto) + (a.hasta ? ` · volvió a las ${hora(a.hasta)} (${minTxt(a.hasta - (a.desde || a.at))})` : '')]), 'Ninguna: la garita estuvo conectada, las emergencias tuvieron respuesta y el policía hizo sus rondas a tiempo.')}

      ${h2(5, 'Accesos, peticiones y casas solas')}
      <table style="border-collapse:collapse;font-size:13.5px">
        ${[['Ingresos registrados', d.ingresos], ['Egresos registrados', d.egresos], ['Llegadas sin aviso (se consultó al vecino)', d.llegadas.length],
          ['Peticiones firmadas de los vecinos', d.pets.length], ['… recibidas por la garita', `${d.petRec.length}${d.petDemora != null ? ' · demora media ' + minTxt(d.petDemora) : ''}`], ['… todavía sin recibir', d.petPend],
          ['Revisiones de casas solas', d.revisiones], ['Novedades anotadas en el libro', d.novedades]].map(([a, b]) => `<tr><td style="padding:4px 18px 4px 0;color:${GR}">${a}</td><td style="padding:4px 0;font-weight:700">${b}</td></tr>`).join('')}</table>

      ${h2(6, 'Incidentes del libro de guardia')}
      ${tabla(['Fecha y hora', 'Lo que anotó la garita'], d.incidentes.map(b => [fh(b.at), esc(correo ? taparDatos(b.texto) : b.texto)]), 'No se anotaron incidentes.')}

      ${h2(7, 'Observaciones de la supervisión a los partes')}
      ${tabla(['Turno', 'Observación', 'Supervisión'], d.vistosObs.map(({ t, v }) => [`${fechaCorta(isoDe(new Date(t.at)))} · ${esc(t.turno)}`, esc(correo ? taparDatos(v.obs) : v.obs), `${esc(primerNombre(v.nombre))} · ${fh(v.at)}`]), 'Sin observaciones en el período.')}

      <div style="margin-top:26px;padding-top:12px;border-top:1px solid ${BO};font-size:11.5px;color:${GR}">
        Informe generado por la app del barrio el ${fechaLarga(hoyISO())} a las ${hora(Date.now())} h con los registros de la garita${d.parcial ? ' (mes en curso: parcial)' : ''}.
        ${correo ? `El detalle completo se ve en la app: Supervisión → Informe mensual. <a href="${esc(urlApp())}" style="color:${VE}">Abrir la app</a>.<br>` : ''}
        Contiene datos personales del personal y de la operación del barrio: es de uso interno y reservado (Ley 25.326, arts. 9 y 10).</div>
    </div></div>`;
}
/* A quién va el informe: cada supervisión y, si está tildado, la Administración. */
function destinatariosInforme(){
  const c = cfgSup(), out = cuentasSupervision().map(x => x.email).filter(Boolean);
  if (c.informeAdmin && Store.s.config.adminEmail) out.push(Store.s.config.adminEmail);
  return [...new Set(out.map(e => String(e).trim().toLowerCase()))];
}
async function mandarInforme(periodo, para){
  const d = datosInforme(periodo), html = informeHTML(d, { correo:true }); let ok = 0, error = '';
  for (const p of para){ const r = await Correo.enviarDetalle({ para:p, asunto:`Informe mensual del servicio de vigilancia · ${d.nombre}`, html, tipo:'informe-servicio' }); if (r.ok) ok++; else error = r.error; }
  return { ok, error, total:para.length };
}
/* El día 1 (o el primer día que se abra la app de la garita o de la
   Administración, hasta el 7) sale el informe del mes anterior. */
REGLAS.push({ id:'informe-servicio', n:'Día 1 → informe mensual del servicio de vigilancia por correo',
  d:'El primer día de cada mes manda a la supervisión de la guardia (y a la Administración, si está tildado) el informe del mes anterior: turnos, policía y rondas, emergencias, alertas, peticiones, incidentes y partes visados.',
  run(s, hoy){
    const c = cfgSup(); if (!c.informe || !(esGuardia() || esAdmin())) return 0;
    if (+hoy.slice(8) > 7 || new Date().getHours() < 8) return 0;
    const prev = mesAnterior(hoy.slice(0, 7)), para = destinatariosInforme(); if (!para.length) return 0;
    return marca(s, 'informe-sup-' + prev, () => { setTimeout(() => mandarInforme(prev, para).then(r => console.info('Informe mensual', prev, r)), 0); });
  } });

R['informe-servicio'] = {
  titulo:'Informe mensual del servicio', icon:'file', color:'brand', ancha:true, sub:p => nombreMesInf(/^\d{4}-\d{2}$/.test(p || '') ? p : hoyISO().slice(0, 7)),
  render(p){
    if (!(esSupervisor() || esAdmin())) return vacio('lock', 'Solo para la supervisión de la guardia y la Administración.');
    const actual = hoyISO().slice(0, 7), per = /^\d{4}-\d{2}$/.test(p || '') ? p : mesAnterior(actual), meses = [actual, mesAnterior(actual), mesAnterior(mesAnterior(actual))];
    const d = datosInforme(per);
    return `<div class="chips">${meses.map(m => `<button class="chip ${m === per ? 'on' : ''}" data-a="abrir" data-v="informe-servicio" data-p="${m}">${esc(nombreMesInf(m))}${m === actual ? ' (parcial)' : ''}</button>`).join('')}</div>
      <div class="btns" style="margin:0 0 12px"><button class="btn btn-sm btn-pri" data-a="informe-imprimir" data-v="${per}">${I('download')}Descargar o imprimir</button>
        <button class="btn btn-sm btn-sec" data-a="informe-mandar" data-v="${per}">${I('mail')}Mandármelo por correo</button></div>
      <div class="informe-hoja">${informeHTML(d)}</div>
      <p class="muted tiny" style="margin-top:10px">${I('clock')} El día 1 de cada mes sale solo por correo el del mes anterior${cfgSup().informe ? '' : ' (ahora está apagado: se prende en Gestión → Supervisión de la guardia)'}. El correo va sin lotes ni nombres de vecinos; acá se ve completo. Se arma con lo que hay en la app: los meses más viejos que dos pueden venir incompletos.</p>`;
  },
};
A['informe-imprimir'] = el => { const d = datosInforme(el.dataset.v); imprimir(`Informe del servicio · ${d.nombre}`, informeHTML(d), { pie:'Uso interno y reservado (Ley 25.326, arts. 9 y 10).' }); };
A['informe-mandar'] = async el => {
  const u = yo(), para = esSupervisor() ? [u.email] : [Store.s.config.adminEmail || u.email];
  if (!para[0]){ toast('No hay un correo para mandarlo', 'mail'); return; }
  toast('Mandando el informe…', 'mail');
  const r = await mandarInforme(el.dataset.v, para.filter(Boolean));
  toast(r.ok ? `Listo: salió a ${para[0]}` : 'No salió: ' + r.error, r.ok ? 'mail' : 'alert');
};
/* Ajustes de la supervisión (solo la Administración). */
F['sup-ajustes'] = d => {
  if (!esAdmin()) return;
  const n = (v, def, min, max) => Math.min(max, Math.max(min, Math.round(+v || def)));
  Store.cambiar(s => { s.config.supervision = Object.assign({}, cfgSup(), { alertas:!!d.alertas, garitaMin:n(d.garitaMin, 20, 10, 240), sosMin:n(d.sosMin, 3, 1, 30), rondaMin:n(d.rondaMin, 90, 30, 360), informe:!!d.informe, informeAdmin:!!d.informeAdmin });
    auditar(s, 'Cambió los ajustes de la supervisión de la guardia', `alertas ${d.alertas ? 'sí' : 'no'} · garita ${d.garitaMin} min · SOS ${d.sosMin} min · ronda ${d.rondaMin} min · informe ${d.informe ? 'sí' : 'no'}`); });
  toast('Guardado', 'check'); refrescar();
};
function ajustesSupervision(){
  const c = cfgSup();
  return `<details class="plegable card" data-k="sup-ajustes"><summary><b>${I('sliders')} Alertas e informe mensual</b><span class="muted small">${c.alertas ? 'alertas prendidas' : 'alertas apagadas'} · ${c.informe ? 'informe por correo' : 'sin informe por correo'}</span></summary>
    <form data-f="sup-ajustes" style="margin-top:10px">
      <label class="check"><input type="checkbox" name="alertas" ${c.alertas ? 'checked' : ''}><span>Avisarle a la supervisión (al celular, con sonido):</span></label>
      <div class="grid3"><div class="field"><label>La garita sin conexión más de (min)</label><input type="number" name="garitaMin" min="10" max="240" value="${c.garitaMin}"></div>
        <div class="field"><label>Un SOS o el DEA sin "Voy en camino" a los (min)</label><input type="number" name="sosMin" min="1" max="30" value="${c.sosMin}"></div>
        <div class="field"><label>El policía sin ronda más de (min)</label><input type="number" name="rondaMin" min="30" max="360" value="${c.rondaMin}"></div></div>
      <p class="muted tiny" style="margin:-4px 0 10px">El SOS sin respuesta también le llega a la Administración, y el policía sin ronda, a la garita. La garita sin conexión la vigila el reloj del Apps Script cada 10 minutos (hace falta el Codigo.gs versión 10 con el reloj instalado).</p>
      <label class="check"><input type="checkbox" name="informe" ${c.informe ? 'checked' : ''}><span>Mandar el informe mensual por correo el día 1</span></label>
      <label class="check"><input type="checkbox" name="informeAdmin" ${c.informeAdmin ? 'checked' : ''}><span style="min-width:0;overflow-wrap:anywhere">También a la Administración (${esc(Store.s.config.adminEmail || 'falta el correo en Ajustes')})</span></label>
      <button class="btn btn-pri btn-block">${I('check')}Guardar</button></form></details>`;
}
