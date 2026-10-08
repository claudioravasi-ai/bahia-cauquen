/* =========================================================
   Entre vecinos: directorio con búsqueda, mensajes privados
   vecino a vecino, obras en tiempo real, viajes compartidos,
   infracciones con descargo y proveedores habilitados.
   ========================================================= */

/* ---------- DIRECTORIO ----------
   Nombre y casa los ve todo el barrio (son vecinos). Profesión,
   teléfono y dirección exacta, solo si cada uno lo comparte. */
const normTxt = t => String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
/* =========================================================
   BUSCAR UN VECINO · LA GUÍA DEL BARRIO (pedido de Claudio, 08-10-2026)
   "Alguien llega a la garita y dice: soy invitado de Pérez y nunca vine,
   ¿qué calle es?". La garita escribe el apellido, el lote o la calle y le
   sale: Juan Pérez y Ana Gómez · Lote 42 · Los Salesianos 3500.

   Salen SIEMPRE los 152 lotes, cada uno con su dirección (está en
   js/padron.js, sin nombres). Encima, según quién mira:
     · la guía del barrio (/barrio/guia): quién vive en cada lote, si es
       propietario o inquilino, si es baldío o una cabaña del hotel. La ven
       los vecinos, la garita, la Administración y la supervisión;
     · los teléfonos de cada lote (/staff/telefonos): solo la garita, la
       Administración y la supervisión, con su botón de llamar;
     · el hotel ve solo el lote y la dirección (sin nombres).
   La guía se carga desde Administración (un CSV hecho con el LISTADO
   GENERAL, que queda en datos-privados/ y no va a GitHub).

   El buscador perdona errores: "Peres" encuentra a Pérez y "Gonsales" a
   González (b y v, s, z y c, ll e y, la h muda y una letra de más o de
   menos). La idea sale de Fuse.js (20.000★ en GitHub); el código es propio.
   ========================================================= */
const guiaDe = id => aLista(Store.s.guia).find(g => g && String(g.lote) === String(id));
const privadoLote = id => aLista(Store.s.telefonos).find(t => t && String(t.lote) === String(id)) || {};
const telsDe = id => aLista(privadoLote(id).tels).filter(t => t && t.n);
/* La nota del lote va con los teléfonos (/staff/telefonos): la ven solo la garita, la Administración y la supervisión. */
const notaDe = id => privadoLote(id).nota || '';
const veTelefonos = () => esStaff() || esSupervisor();
const ESTADO_GUIA = { baldio:'Baldío', cabana:'Cabaña del hotel', hotel:HOTEL_NOMBRE };
/* "Casa A: Rosi y Parmiggiani" (dos casas en un lote) ya trae su "y": esas van separadas con un punto. */
const listaNombres = xs => xs.length < 2 ? (xs[0] || '') : xs.some(x => /:/.test(x)) ? xs.join(' · ') : xs.slice(0, -1).join(', ') + ' y ' + xs.at(-1);

/* Un teléfono tal como lo anotaron ("15489595", "446719", "0111538151639")
   → cómo se lee, el enlace para llamar y el de WhatsApp (si es celular). */
function telInfo(n){
  const d = soloDigitos(n).replace(/^0+/, '');
  if (/^4\d{5}$/.test(d)) return { ver:`${d.slice(0, 2)}-${d.slice(2)}`, tel:'+542901' + d, wa:'', fijo:true };
  const w = typeof waNumeroAR === 'function' ? waNumeroAR(n) : '';
  if (!w) return { ver:String(n), tel:'', wa:'', dudoso:true };
  const diez = w.slice(3), area = diez.startsWith('2901') ? '2901' : diez.startsWith('11') ? '11' : diez.slice(0, 4), resto = diez.slice(area.length);
  return { ver:`${area} ${resto.slice(0, -4)}-${resto.slice(-4)}`, tel:'+' + w, wa:w };
}

/* ---------- El buscador que perdona ---------- */
const fonetica = t => normTxt(t).replace(/[^a-z0-9 ]/g, ' ')
  .replace(/ch/g, '%').replace(/qu(?=[ei])/g, 'k').replace(/c(?=[ei])/g, 's').replace(/g(?=[ei])/g, 'j').replace(/c/g, 'k')
  .replace(/z/g, 's').replace(/v/g, 'b').replace(/ll/g, 'y').replace(/h/g, '').replace(/%/g, 'ch')
  .replace(/([a-z])\1+/g, '$1');
function distancia(a, b, tope){
  if (Math.abs(a.length - b.length) > tope) return tope + 1;
  let prev = Array.from({ length:b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++){
    const cur = [i]; let min = i;
    for (let j = 1; j <= b.length; j++){ cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); min = Math.min(min, cur[j]); }
    if (min > tope) return tope + 1;
    prev = cur;
  }
  return prev[b.length];
}
/* 0 = no coincide; 2 = coincide tal cual; 1 = coincide perdonando un error. */
function coincidePalabra(w, palabras, fon){
  if (palabras.some(p => p.startsWith(w))) return 2;
  if (/^\d+$/.test(w)) return 0;
  const fw = fonetica(w); if (!fw) return 0;
  if (fon.some(p => p.startsWith(fw))) return 1;
  if (fw.length < 4) return 0;
  const tope = fw.length >= 8 ? 2 : 1;
  return fon.some(p => p.length >= 3 && distancia(fw, p.slice(0, Math.max(p.length, fw.length)), tope) <= tope) ? 1 : 0;
}

function fichasDeVecinos(){
  const s = Store.s, hotel = esHotel();
  const cuentas = hotel ? [] : s.users.filter(x => esVecinoDeLote(x) && x.casa);
  const padron = aLista(s.padron).filter(p => p && p.lote !== undefined && p.lote !== '');
  const fichas = LOTES.map(L => {
    const casa = 'Lote ' + L.lote, g = hotel ? null : guiaDe(L.lote), p = padron.find(x => String(x.lote) === L.lote);
    const prop = g ? aLista(g.propietarios) : p && p.propietario ? [p.propietario] : [];
    const inq = g ? aLista(g.inquilinos) : [];
    const cs = cuentas.filter(x => x.casa === casa);
    const estado = g?.estado || (L.grupo === 'hotel' ? 'hotel' : '');
    return { casa, lote:L.lote, L, g, prop, inq, estado, cuentas:cs,
      nombre: inq.length ? listaNombres(inq) : prop.length ? listaNombres(prop) : estado === 'hotel' ? HOTEL_NOMBRE : cs.map(x => x.nombre).join(' · ') };
  });
  cuentas.filter(x => !LOTES.some(L => 'Lote ' + L.lote === x.casa)).forEach(x =>
    fichas.push({ casa:x.casa, lote:x.casa.replace(/^Lote\s*/i, ''), L:null, g:null, prop:[], inq:[], estado:'', nombre:x.nombre, cuentas:[x] }));
  return fichas;
}
function textoFicha(f){
  if (f._t) return f._t;
  const tels = veTelefonos() ? telsDe(f.lote).map(t => soloDigitos(t.n) + ' ' + (t.de || '')) : [];
  const txt = normTxt([...f.prop, ...f.inq, f.nombre, 'lote ' + f.lote, f.L?.dir || '', f.L?.nires ? 'los nires' : '',
    f.g?.cabana ? 'cabana ' + f.g.cabana : '', ESTADO_GUIA[f.estado] || '', veTelefonos() ? notaDe(f.lote) : '', ...tels,
    ...f.cuentas.map(x => [x.nombre, x.enDirectorio ? x.profesion : '', x.skills && x.mostrarTel ? x.skills : ''].join(' '))].join(' '));
  const palabras = txt.split(/[^a-z0-9]+/).filter(Boolean);
  return (f._t = { palabras, fon:palabras.map(fonetica) });
}
/* Devuelve el puntaje (0 = no va). Un número solo, de 1 a 3 cifras, es el
   lote exacto: "14" es el lote 14, no el 140. De 4 cifras o más, la altura
   ("3340") o un teléfono. */
function puntajeFicha(f, qq){
  if (!qq) return 1;
  const ws = qq.split(/\s+/).filter(Boolean);
  if (ws.length === 1 && /^\d{1,3}[a-z]?$/.test(ws[0])) return normTxt(f.lote) === ws[0] ? 3 : 0;
  const { palabras, fon } = textoFicha(f);
  let total = 0;
  for (const w of ws){
    if (w === 'lote' || w === 'calle') continue;
    const m = coincidePalabra(w, palabras, fon); if (!m) return 0; total += m;
  }
  return total || 1;
}
const coincideFicha = (f, qq) => puntajeFicha(f, qq) > 0;

R.vecinos = {
  titulo: () => esHotel() ? 'Direcciones del barrio' : 'Vecinos',
  icon: 'users', color: 'sky',
  sub: () => esHotel() ? 'Calle y altura de cada lote' : veTelefonos() ? 'Por apellido, lote o calle · con teléfonos' : 'Por nombre, apellido, lote o calle',
  render(q){
    const u = yo(), qq = normTxt(q || '').trim(), staff = esStaff(), hotel = esHotel();
    const todas = fichasDeVecinos();
    const ls = todas.map(f => [f, puntajeFicha(f, qq)]).filter(([, p]) => p > 0)
      .sort((a, b) => b[1] - a[1] || String(a[0].lote).localeCompare(String(b[0].lote), 'es', { numeric:true })).map(([f]) => f);
    const mostrar = ls.slice(0, 160);
    const sinGuia = !hotel && !aLista(Store.s.guia).length;
    return `<form data-f="buscar-vecino" class="linea-form" style="margin-bottom:12px"><input name="q" id="qVecino" value="${esc(q || '')}" placeholder="${hotel ? 'Ej: 148, De la Plaza, Salesianos' : 'Ej: Pérez, 42, Los Salesianos 3500'}" autocomplete="off" enterkeyhint="search"><button class="btn btn-pri">${I('search')}</button></form>
      ${sinGuia && esAdmin() ? aviso('warn', 'upload', 'Falta cargar la guía del barrio', 'Sin la guía, acá salen las direcciones y los nombres del padrón, pero no quién vive en cada lote ni los teléfonos.', `<button class="btn btn-xs btn-pri" data-a="abrir" data-v="padron">Cargarla</button>`) : ''}
      ${!staff && !hotel && u.rol === 'vecino' && !u.fotoCasa ? aviso('info', 'camera', 'Subí la foto del frente de tu casa', 'Así te reconocen en el buscador y la garita ubica tu domicilio en una emergencia.', `<button class="btn btn-xs btn-sec" data-a="abrir" data-v="perfil">Subirla</button>`) : ''}
      <div class="muted small" style="margin:0 2px 8px">${qq ? `${plural(ls.length, 'lote encontrado', 'lotes encontrados')}` : `${plural(todas.length, 'lote')} del barrio`}</div>
      <div class="fichas-vecinos">${mostrar.length ? mostrar.map(f => hotel ? fichaDireccion(f) : fichaVecino(f, u, staff)).join('') : vacio('search', 'Nadie coincide con esa búsqueda.')}</div>
      <p class="muted tiny" style="margin-top:12px">${I('lock')} ${hotel ? 'Solo el lote y la dirección. Los nombres y teléfonos de los vecinos no los ve el hotel.'
        : veTelefonos() ? 'Los teléfonos los ven solo la garita, la Administración y la supervisión. Uso exclusivo para el servicio (Ley 25.326).'
        : 'Nombre, lote y dirección los ve todo el barrio. Los teléfonos, solo la garita y la Administración; el tuyo lo compartís vos desde Mi casa.'}</p>`;
  },
};
const lineaDireccion = f => f.L?.dir ? `<span class="ficha-dir">${I('pin')}<span><b>${esc(f.L.dir)}</b>${comoLlegarLote(f.lote) ? `<em>${esc(comoLlegarLote(f.lote))}</em>` : ''}</span></span>` : '';
/* Lo que ve el hotel: lote y dirección, nada más. */
const fichaDireccion = f => `<div class="ficha-vecino"><span class="ficha-foto vacia">${I('home')}</span><div class="ficha-txt">
  <span class="ficha-lote">Lote ${esc(f.lote)}</span>${lineaDireccion(f) || '<small class="muted">Sin dirección cargada</small>'}</div></div>`;
function fichaVecino(f, u, staff){
  const conFoto = f.cuentas.find(x => x.fotoCasa);
  /* "Fernández, Lucía" y "Lucía Fernández" son la misma persona: no se repite. */
  const clave = n => normTxt(n).replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(Boolean).sort().join(' ');
  const yaNombrados = new Set([...f.prop, ...f.inq].map(clave));
  const enApp = f.cuentas.filter(x => !yaNombrados.has(clave(x.nombre)) && clave(x.nombre) !== clave(f.nombre));
  const esMio = f.casa === u.casa && !staff;
  const botones = f.cuentas.filter(x => x.id !== u.id).map(x => {
    const primero = esc(x.nombre.split(' ')[0]);
    const quien = f.cuentas.length > 1 ? ' a ' + primero : '';
    if (staff) return `<button class="btn btn-xs btn-pri" data-a="abrir" data-v="privado" data-p="${esGuardia() ? 'guardia' : 'admin'}|${x.id}">${I('chat')}Escribirle${quien}</button>`;
    if (esSupervisor()) return '';
    return `<button class="btn btn-xs btn-pri" data-a="abrir" data-v="dm" data-p="${x.id}">${I('chat')}Mensaje${quien}</button>
      ${x.enDirectorio && x.tel ? `<a class="btn btn-xs btn-wa" href="${waLink(x.tel)}" target="_blank" rel="noopener">${I('phone')}</a>` : ''}`;
  }).join('');
  const prof = f.cuentas.map(x => x.enDirectorio && x.profesion ? x.profesion : '').filter(Boolean);
  const tels = veTelefonos() ? telsDe(f.lote) : [];
  const quienes = f.inq.length ? `<small>${I('key')} Inquilinos · propietario: ${esc(listaNombres(f.prop) || 'sin cargar')}</small>`
    : f.prop.length > 1 ? `<small>Propietarios</small>` : f.prop.length ? `<small>Propietario/a</small>` : '';
  return `<div class="ficha-vecino ${esMio ? 'mia' : ''} ${f.estado === 'baldio' ? 'baldio' : ''}">
    ${conFoto ? fotoHTML(conFoto.fotoCasa, 'ficha-foto') : `<span class="ficha-foto vacia">${I(f.estado === 'baldio' ? 'pin' : 'home')}</span>`}
    <div class="ficha-txt">
      <span class="ficha-cab"><span class="ficha-lote">Lote ${esc(f.lote)}</span>${f.estado && f.estado !== 'casa' ? `<span class="ficha-estado e-${esc(f.estado)}">${esc(ESTADO_GUIA[f.estado] || '')}${f.g?.cabana ? ' ' + esc(f.g.cabana) : ''}</span>` : ''}</span>
      ${lineaDireccion(f)}
      <b>${esc(f.nombre || 'Sin datos cargados')}</b>
      ${quienes}
      ${enApp.length ? `<small>En la app: ${enApp.map(x => esc(x.nombre)).join(', ')}</small>` : ''}
      ${prof.length ? `<small>${I('user')} ${esc(prof.join(' · '))}</small>` : ''}
      ${tels.length ? `<div class="ficha-tels">${tels.map(t => { const i = telInfo(t.n);
        return `<span class="ficha-tel ${i.dudoso ? 'dudoso' : ''}"><span>${t.de ? `<small>${esc(t.de)}</small>` : ''}${esc(i.ver)}${i.fijo ? ' <small>fijo</small>' : ''}${i.dudoso ? ' <small>a revisar</small>' : ''}</span>
          ${i.tel ? `<a class="btn btn-xs btn-sec" href="${telLink(i.tel)}" aria-label="Llamar">${I('phone')}</a>` : ''}${i.wa ? `<a class="btn btn-xs btn-wa" href="${waLink(i.wa)}" target="_blank" rel="noopener" aria-label="WhatsApp">${I('chat')}</a>` : ''}</span>`; }).join('')}</div>` : ''}
      ${veTelefonos() && notaDe(f.lote) ? `<small class="ficha-nota">${I('info')} ${esc(notaDe(f.lote))}</small>` : ''}
      ${esMio ? `<small>Es tu lote</small>` : !f.cuentas.length && f.estado !== 'baldio' && f.estado !== 'hotel' ? `<small class="muted">Todavía no usa la app</small>` : ''}
      ${botones || esAdmin() ? `<div class="btns">${botones}${esAdmin() ? `<button class="btn btn-xs btn-sec" data-a="editar-guia" data-v="${esc(f.lote)}">${I('edit')}Editar</button>` : ''}</div>` : ''}
    </div></div>`;
}
F['buscar-vecino'] = d => abrir('vecinos', d.q || '');

/* ---------- MENSAJES PRIVADOS ENTRE VECINOS ---------- */
const hiloDM = (a, b) => Store.s.dms.find(h => (h.a === a && h.b === b) || (h.a === b && h.b === a));
const dmNoLeidos = () => { const u = yo(); return u ? Store.s.dms.filter(h => h.a === u.id || h.b === u.id).reduce((n, h) => n + h.msgs.filter(m => m.de !== u.id && !m.leido).length, 0) : 0; };
R.mensajes = {
  titulo: 'Mensajes', icon: 'chat', color: 'accent', sub: 'Privados entre vecinos',
  render(){
    const u = yo();
    const hilos = Store.s.dms.filter(h => h.a === u.id || h.b === u.id).sort((x, y) => (y.msgs.at(-1)?.at || 0) - (x.msgs.at(-1)?.at || 0));
    return `${superficie({ v:'dm-nuevo', icon:'search', t:'Buscar un vecino y escribirle', s:'Elegí uno o varios del padrón: a cada uno le llega por separado, en su chat privado con vos', cls:'acento' })}
      ${(() => { const sin = c => Store.s.privados.filter(h => h.userId === u.id && (h.con || 'admin') === c).reduce((n, h) => n + aLista(h.msgs).filter(m => m.from !== 'vecino' && !m.leido).length, 0);
        const a = sin('admin'), g = sin('guardia'), nuevo = [a ? `${a} sin leer de la Administración` : '', g ? `${g} sin leer de la Guardia` : ''].filter(Boolean).join(' · ');
        /* 08-10-2026: abre las dos conversaciones (se elige arriba): el cartel lo dice. */
        return superficie({ v:'privado', p: g && !a ? 'guardia' : 'admin', icon:'lock', color:'accent', t:'Administración o Guardia', s: nuevo || 'Tu conversación privada con cada una · arriba elegís con quién' }); })()}
      ${sec('Conversaciones')}${hilos.length ? hilos.map(h => { const otro = usuario(h.a === u.id ? h.b : h.a) || { nombre:'Ex vecino/a', casa:'' }, ult = h.msgs.at(-1), nl = h.msgs.filter(m => m.de !== u.id && !m.leido).length;
        return `<button class="superficie" data-a="abrir" data-v="dm" data-p="${otro.id || ''}">${avatar(otro)}<span class="txt"><b>${esc(otro.nombre)} · ${esc(otro.casa)}</b><small>${ult ? (ult.de === u.id ? 'Vos: ' : '') + esc(ult.text.slice(0, 60)) + ' · ' + hace(ult.at) : ''}</small></span>${nl ? `<span class="pill p-danger">${nl}</span>` : I('right')}</button>`; }).join('') : vacio('chat', 'Todavía no tenés conversaciones.')}`;
  },
};
R.dm = {
  titulo: p => usuario(p)?.nombre || 'Mensaje', icon: 'chat', color: 'accent', sub: p => `${usuario(p)?.casa || ''} · solo lo ven ustedes dos`,
  render(p){
    const u = yo(), otro = usuario(p);
    if (!otro) return vacio('user', 'Ese vecino ya no está en la app.');
    const h = hiloDM(u.id, p);
    if (h && h.msgs.some(m => m.de !== u.id && !m.leido)){ h.msgs.forEach(m => { if (m.de !== u.id) m.leido = true; }); Store.guardar(); setTimeout(pintarTop, 0); }
    marcarVistoLink('dm:' + p);
    let dia = '';
    return `<div class="chat-wrap">${botonHistHilo('dms', h)}<div class="chat">${h && h.msgs.length ? h.msgs.map(m => { const d = isoDe(new Date(m.at)); const sep = d !== dia ? (dia = d, `<div class="dia-sep">${relDia(d)}</div>`) : '';
        return `${sep}<div class="msg ${m.de === u.id ? 'mia' : ''}"><div class="b">${esc(m.text)}<time>${hora(m.at)}${m.de === u.id && m.leido ? ' ✓✓' : ''}</time></div></div>`; }).join('')
        : vacio('chat', `Escribile a ${esc(otro.nombre.split(' ')[0])}. Nadie más ve esta conversación.`)}</div>
      <form class="chatbar" data-f="dm" data-u="${esc(p)}"><input name="text" id="dmIn" required maxlength="800" placeholder="Mensaje privado…" autocomplete="off"><button class="btn btn-accent">${I('send')}</button></form></div>`;
  },
  alPintar(){ const c = $('#cuerpo'); if (c) c.scrollTop = c.scrollHeight; },
};
F['dm'] = (d, form) => {
  const u = yo(), para = form.dataset.u;
  Store.cambiar(s => {
    let h = s.dms.find(x => (x.a === u.id && x.b === para) || (x.a === para && x.b === u.id));
    if (!h){ h = { id:uid(), a:u.id, b:para, msgs:[] }; s.dms.push(h); }
    h.msgs.push({ id:uid(), de:u.id, text:d.text.trim(), at:Date.now() });
    notificar(s, { para, titulo:`Mensaje de ${u.nombre.split(' ')[0]} (${u.casa})`, texto:d.text.trim().slice(0, 90), icon:'chat', color:'accent', link:'dm:' + u.id });
  });
  const i = $('#dmIn'); if (i){ i.value = ''; i.focus(); }
};
/* =========================================================
   ESCRIBIRLE A UNO O VARIOS VECINOS (pedido de Claudio, 30-09-2026)
   Sin el chat vecinal (se sacó el 29-09) no había cómo hablar en privado
   con un vecino elegido del padrón. Acá se buscan y se tildan uno, dos o
   hasta MAX_DM vecinos, se escribe UN mensaje y a cada uno le llega en su
   propio chat privado con quien escribe (el mismo de R.dm, vecino a
   vecino). NO es un grupo: ninguno ve a quién más se le mandó ni lo que
   contestan los otros; cada respuesta vuelve por separado. El barrio no
   quería un chat de muchos, sí uno privado entre vecinos.
   El tope evita que esto se use como circular: para escribirle a todo el
   barrio está el pizarrón o la Administración.
   ========================================================= */
const MAX_DM = 10;
/* Las cuentas a las que se les puede escribir: vecinos aprobados, menos uno
   mismo. Quien administra y además vive en un lote (08-10-2026: Claudio en el
   148; mañana Paula Juncos) también es vecino de su lote: le pueden escribir
   como a cualquiera. Una cuenta de Administración sin lote, no. */
const esVecinoDeLote = x => !!x && x.estado === 'aprobado' && (x.rol === 'vecino' || (x.rol === 'admin' && /^Lote\s/i.test(x.casa || '')));
const destinatarioDM = (x, u) => x && x.id !== u.id && esVecinoDeLote(x);
R['dm-nuevo'] = {
  titulo: 'Escribirle a vecinos', icon: 'chat', color: 'accent', sub: 'Del padrón · a cada uno por separado',
  render(p){
    const u = yo();
    if (esStaff() || esHotel()) return vacio('lock', 'Los mensajes entre vecinos son solo para las cuentas de vecinos.');
    const pre = String(p || '').split(',').filter(Boolean);
    const fichas = fichasDeVecinos();
    const conCuenta = fichas.filter(f => f.cuentas.some(x => destinatarioDM(x, u)));
    const sinCuenta = fichas.filter(f => !f.cuentas.some(x => destinatarioDM(x, u)) && f.casa !== u.casa && !['baldio', 'hotel', 'cabana'].includes(f.estado));
    /* "Todo el lote" (08-10-2026): con un toque se tildan todas las cuentas del lote; o se elige a quién. */
    const fila = f => { const cs = f.cuentas.filter(x => destinatarioDM(x, u)); return `<div class="dmv-lote" data-busca="${esc(textoFicha(f).palabras.join(' '))}" data-lote="${esc(normTxt(f.lote))}">
        <div class="dmv-cab"><span class="ficha-lote">Lote ${esc(f.lote)}</span><small>${esc(f.nombre || '')}</small>${cs.length > 1 ? `<label class="dmv-todo"><input type="checkbox" data-todo-lote>Todo el lote (${cs.length})</label>` : ''}</div>
        ${cs.map(x => `<label class="dmv-it">
          <input type="checkbox" name="u~${esc(x.id)}" ${pre.includes(x.id) ? 'checked' : ''}>${avatar(x)}
          <span class="txt"><b>${esc(x.nombre)}</b><small>${esc(x.casa)}${x.relacion && typeof RELACIONES !== 'undefined' ? ' · ' + esc(RELACIONES[x.relacion] || '') : ''}${x.enDirectorio && x.profesion ? ' · ' + esc(x.profesion) : ''}</small></span></label>`).join('')}</div>`; };
    return `<form data-f="dm-varios" class="dmv">
      <p class="muted small" style="margin:0 0 10px">${I('lock')} Tildá a quién le querés escribir (hasta ${MAX_DM}). A cada uno le llega <b>por separado</b>, en su chat privado con vos: nadie ve a quién más se lo mandaste y cada uno te contesta en su propia conversación.</p>
      <input type="search" id="dmvBusca" data-filtro-dm placeholder="Apellido, nombre, oficio o lote" autocomplete="off" style="margin-bottom:10px">
      <div class="dmv-lista" id="dmvLista">${conCuenta.length ? conCuenta.map(fila).join('') : vacio('users', 'Todavía no hay otros vecinos con cuenta en la app.')}
        <p class="muted small dmv-nada" hidden>Nadie coincide con esa búsqueda entre los vecinos que usan la app.</p></div>
      ${sinCuenta.length ? `<details class="dmv-sin"><summary>${plural(sinCuenta.length, 'lote todavía no usa', 'lotes todavía no usan')} la app</summary>
        <p class="muted small">A ellos no se les puede escribir por acá hasta que se inscriban.</p>
        <p class="small">${sinCuenta.map(f => `Lote ${esc(f.lote)}${f.nombre ? ' · ' + esc(f.nombre) : ''}`).join('<br>')}</p></details>` : ''}
      <div class="dmv-barra">
        <div class="dmv-elegidos" id="dmvElegidos">Nadie elegido todavía</div>
        <textarea name="text" id="dmvTexto" required maxlength="800" rows="3" placeholder="Tu mensaje privado…"></textarea>
        <button class="btn btn-accent btn-block" id="dmvEnviar" disabled>${I('send')}Enviar</button>
      </div></form>`;
  },
  alPintar(){ dmvContar(); },
};
function dmvContar(){
  const cajas = $$('#dmvLista input[name^="u~"]'); if (!cajas.length && !$('#dmvElegidos')) return;
  $$('#dmvLista [data-todo-lote]').forEach(t => { const cs = $$('input[name^="u~"]', t.closest('.dmv-lote')); t.checked = cs.length > 0 && cs.every(c => c.checked); });
  const tild = cajas.filter(c => c.checked);
  const nombres = tild.map(c => c.closest('.dmv-it')?.querySelector('b')?.textContent || '').filter(Boolean);
  cajas.forEach(c => { c.disabled = !c.checked && tild.length >= MAX_DM; });
  const e = $('#dmvElegidos'), b = $('#dmvEnviar');
  if (e) e.innerHTML = tild.length ? `<b>${plural(tild.length, 'vecino elegido', 'vecinos elegidos')}</b>${tild.length >= MAX_DM ? ` (el máximo)` : ''}: ${esc(nombres.join(', '))}` : 'Nadie elegido todavía';
  if (b) b.disabled = !tild.length;
}
document.addEventListener('change', e => {
  if (!e.target.closest || !e.target.closest('#dmvLista')) return;
  if (e.target.matches('[data-todo-lote]')) $$('input[name^="u~"]', e.target.closest('.dmv-lote')).forEach(c => { c.checked = e.target.checked; });
  dmvContar(); });
document.addEventListener('input', e => {
  if (!e.target.matches || !e.target.matches('[data-filtro-dm]')) return;
  const qq = normTxt(e.target.value).trim(), palabras = qq.split(/\s+/).filter(Boolean);
  let hay = 0;
  $$('#dmvLista .dmv-lote').forEach(l => {
    const ps = l.dataset.busca.split(' '), fon = l._fon || (l._fon = ps.map(fonetica));
    const ok = !qq || (palabras.length === 1 && /^\d+[a-z]?$/.test(palabras[0]) ? l.dataset.lote === palabras[0] : palabras.every(w => coincidePalabra(w, ps, fon) > 0));
    /* Lo tildado no se esconde: se ve siempre a quién se le va a mandar. */
    const tildado = !!l.querySelector('input:checked');
    l.hidden = !ok && !tildado; if (!l.hidden) hay++;
  });
  const n = $('#dmvLista .dmv-nada'); if (n) n.hidden = !!hay;
});
F['dm-varios'] = d => {
  const u = yo(), texto = String(d.text || '').trim();
  const para = [...new Set(Object.keys(d).filter(k => k.startsWith('u~')).map(k => k.slice(2)))].filter(id => destinatarioDM(usuario(id), u));
  if (!para.length){ toast('Tildá al menos un vecino', 'alert'); return; }
  if (para.length > MAX_DM){ toast(`Hasta ${MAX_DM} vecinos por mensaje`, 'alert'); return; }
  if (!texto){ toast('Escribí el mensaje', 'alert'); return; }
  Store.cambiar(s => para.forEach(id => {
    let h = s.dms.find(x => (x.a === u.id && x.b === id) || (x.a === id && x.b === u.id));
    if (!h){ h = { id:uid(), a:u.id, b:id, msgs:[] }; s.dms.push(h); }
    h.msgs.push({ id:uid(), de:u.id, text:texto, at:Date.now() });
    /* Un aviso por persona: nadie ve a quién más le llegó. */
    notificar(s, { para:id, titulo:`Mensaje de ${u.nombre.split(' ')[0]} (${u.casa})`, texto:texto.slice(0, 90), icon:'chat', color:'accent', link:'dm:' + u.id });
  }));
  toast(para.length > 1 ? `Enviado a ${para.length} vecinos, a cada uno por separado` : `Enviado a ${usuario(para[0]).nombre.split(' ')[0]}`, 'send');
  if (para.length === 1) abrir('dm', para[0]); else abrir('mensajes');
};
function marcarVistoLink(link){
  const u = yo(); const pend = aLista(Store.s.notifs).filter(n => n.link === link && meToca(n, u) && !aLista(n.leidas).includes(u.id));
  if (pend.length){ pend.forEach(n => listaDe(n, 'leidas').push(u.id)); Store.guardar(); setTimeout(pintarTop, 0); }
}

/* ---------- OBRAS EN EL BARRIO ---------- */
const ETAPAS = ['Planos aprobados','Movimiento de suelo','Fundaciones','Estructura','Techo y cerramientos','Instalaciones','Terminaciones','Final de obra'];
const TIPOS_OBRA = ['Casa nueva','Ampliación','Reforma','Quincho / pileta','Paisajismo','Cerco / deck','Otra'];
R.obras = {
  titulo: 'Obras en el barrio', icon: 'wrench', color: 'wood', sub: () => `Horario de obra: ${Store.s.config.obraHorario}`,
  render(f){
    const u = yo(), s = Store.s;
    const filtro = f || 'activas';
    let ls = s.obras.slice();
    if (filtro === 'activas') ls = ls.filter(o => o.estado === 'activa' || o.estado === 'pausada');
    else if (filtro === 'finalizadas') ls = ls.filter(o => o.estado === 'finalizada');
    else if (filtro === 'pendientes') ls = ls.filter(o => o.estado === 'pendiente');
    const hoyObra = s.obras.filter(o => o.avisoHoy && o.avisoHoy.fecha === hoyISO());
    ls.sort((a, b) => (b.ultima || b.createdAt) - (a.ultima || a.createdAt));
    const puede = o => !esGuardia() && !esSupervisor() && (o.userId === u.id || esAdmin());
    return `${!esGuardia() && !esSupervisor() ? superficie({ a:'nueva-obra', icon:'plus', t: esAdmin() ? 'Registrar una obra' : 'Registrar mi obra', s: esAdmin() ? 'De un lote o del barrio (espacios comunes). La ven al instante todos: vecinos y garita.' : 'La ven al instante la Administración, la garita y todo el barrio', cls:'acento' }) : ''}
      <p class="muted tiny" style="margin:0 0 10px">${I('info')} Cada obra en curso aparece todos los días en la Pizarra del día, desde que empieza hasta que termina. Los días con movimiento (mixer, camión, grúa) su dueño manda el "Aviso del día" y sale en amarillo. ${esGuardia() ? 'La garita las ve pero no las edita.' : 'La garita las ve pero no las puede editar; la Administración sí.'}</p>
      ${hoyObra.map(o => aviso('warn', 'truck', `Hoy en ${esc(o.casa)}: ${esc(o.avisoHoy.texto)}`, o.avisoHoy.hora ? `Desde las ${o.avisoHoy.hora} h` : '')).join('')}
      <div class="chips">${[['activas','En curso'], ...(s.obras.some(o => o.estado === 'pendiente') ? [['pendientes','Por aprobar']] : []),['finalizadas','Terminadas'],['todas','Todas']].map(([k, t]) => `<button class="chip ${k === filtro ? 'on' : ''}" data-a="abrir" data-v="obras" data-p="${k}">${t}</button>`).join('')}</div>
      ${ls.length ? ls.map(o => { const pct = Math.round((o.etapa + 1) / ETAPAS.length * 100), ult = o.historial?.at(-1);
        return `<div class="card"><div class="row" style="align-items:flex-start"><span class="ic ic-wood" style="width:42px;height:42px;border-radius:13px;display:grid;place-items:center;flex:none">${I('wrench')}</span>
          <div class="grow"><b style="font-size:15px">${esc(o.casa)} · ${esc(o.tipo)}</b><div class="muted small">${esc(o.empresa || 'Sin empresa cargada')}${o.inicio ? ' · desde ' + fechaCorta(o.inicio) : ''}${o.finEstimado ? ' · fin estimado ' + fechaCorta(o.finEstimado) : ''}</div>
            <div class="muted tiny">Cargada por ${o.porAdmin ? 'la Administración' : esc(autorVisible(o.userId).nombre)}${o.detalle ? ' · ' + esc(o.detalle) : ''}</div></div>
          <span class="pill ${o.estado === 'activa' ? 'p-ok' : o.estado === 'pendiente' ? 'p-warn' : o.estado === 'pausada' ? 'p-danger' : ''}">${{ activa:'En curso', pendiente:'Por aprobar', pausada:'Pausada', finalizada:'Terminada' }[o.estado]}</span></div>
          <div class="etapas">${ETAPAS.map((e, i) => `<i class="${i < o.etapa ? 'hecha' : i === o.etapa ? 'actual' : ''}" title="${e}"></i>`).join('')}</div>
          <div class="row small" style="justify-content:space-between"><b>${esc(ETAPAS[o.etapa])}</b><span class="muted">${pct}%</span></div>
          ${ult ? `<div class="small" style="margin-top:8px;color:var(--ink-2)">${esc(ult.texto)} <span class="muted">· ${hace(ult.at)}</span></div>${fotoHTML(ult.foto, 'post-foto')}` : ''}
          ${puede(o) ? `<div class="btns" style="margin-top:12px">
            ${o.estado === 'pendiente' && esAdmin() ? `<button class="btn btn-sm btn-ok" data-a="obra-aprobar" data-id="${o.id}">${I('check')}Aprobar</button>` : ''}
            ${o.estado !== 'finalizada' && o.estado !== 'pendiente' ? `<button class="btn btn-sm btn-pri" data-a="obra-avance" data-id="${o.id}">${I('edit')}Actualizar etapa</button><button class="btn btn-sm btn-sec" data-a="obra-hoy" data-id="${o.id}">${I('truck')}Aviso del día</button>` : ''}
            <button class="btn btn-sm btn-sec" data-a="obra-editar" data-id="${o.id}">${I('edit')}Editar</button>
            ${o.userId === u.id && !o.porAdmin ? `<button class="btn btn-sm btn-sec" data-a="nuevo-pase" data-v="proveedor">${I('qr')}Pase para el personal</button>` : ''}
            ${esAdmin() ? `<button class="btn btn-sm btn-danger-soft" data-a="obra-borrar" data-id="${o.id}" title="Borrar la obra">${I('trash')}</button>` : ''}
            ${esAdmin() && o.estado === 'activa' ? `<button class="btn btn-sm btn-danger-soft" data-a="obra-pausa" data-id="${o.id}">Pausar</button>` : ''}
            ${esAdmin() && o.estado === 'pausada' ? `<button class="btn btn-sm btn-ok" data-a="obra-reanudar" data-id="${o.id}">Reanudar</button>` : ''}</div>` : ''}</div>`; }).join('') : vacio('wrench', 'No hay obras en esta lista.')}
      <p class="muted tiny">El personal de obra ingresa con ART vigente (Ley 24.557). La guardia lo verifica en Proveedores.</p>`;
  },
};
const formObra = (o = {}) => `
  ${esAdmin() && !o.id ? `<div class="field"><label>¿De quién es la obra?</label><select name="casa"><option value="Barrio">Del barrio (espacios comunes, calles, portón…)</option>${opcionesLotes('')}</select>
    <div class="ayuda">Cada obra es un registro aparte: una del barrio y la de un vecino conviven sin pisarse.</div></div>` : ''}
  <div class="grid2"><div class="field"><label>Tipo</label><select name="tipo">${[...TIPOS_OBRA, 'Obra del barrio'].map(t => `<option ${t === o.tipo ? 'selected' : ''}>${t}</option>`).join('')}</select></div>
    <div class="field"><label>Etapa actual</label><select name="etapa">${ETAPAS.map((e, i) => `<option value="${i}" ${i === (o.etapa || 0) ? 'selected' : ''}>${e}</option>`).join('')}</select></div></div>
  <div class="grid2"><div class="field"><label>Empresa / constructor</label><input name="empresa" maxlength="60" value="${esc(o.empresa || '')}"></div><div class="field"><label>Teléfono del responsable</label><input name="tel" inputmode="tel" maxlength="20" value="${esc(o.tel || '')}"></div></div>
  <div class="grid2"><div class="field"><label>Inicio</label><input type="date" name="inicio" value="${o.inicio || hoyISO()}" required></div><div class="field"><label>Fin estimado</label><input type="date" name="finEstimado" value="${o.finEstimado || ''}"></div></div>
  <div class="field"><label>Detalle</label><textarea name="detalle" maxlength="400" placeholder="Qué se hace, si va a haber camiones, mixer, grúa…">${esc(o.detalle || '')}</textarea></div>`;
A['obra-editar'] = el => { const o = Store.s.obras.find(x => x.id === el.dataset.id); if (!o || esGuardia()) return;
  hoja(`Editar la obra · ${o.casa}`, `<form data-f="obra-editar" data-id="${o.id}">${formObra(o)}<button class="btn btn-pri btn-block">${I('check')}Guardar</button></form>`); };
F['obra-editar'] = (d, form) => {
  if (esGuardia()) return;
  Store.cambiar(s => { const o = s.obras.find(x => x.id === form.dataset.id); if (!o || !(o.userId === yo().id || esAdmin())) return;
    Object.assign(o, { tipo:d.tipo, etapa:+d.etapa, empresa:d.empresa.trim(), tel:d.tel.trim(), inicio:d.inicio, finEstimado:d.finEstimado, detalle:d.detalle.trim(), ultima:Date.now() });
    if (o.etapa === ETAPAS.length - 1 && o.estado !== 'finalizada'){ o.estado = 'finalizada'; }
    listaDe(o, 'historial').push({ at:Date.now(), etapa:o.etapa, texto:'Datos de la obra editados', por:yo().id });
    auditar(s, 'Editó una obra', `${o.casa} · ${o.tipo}`, o.id); });
  cerrarHoja(); toast('Obra actualizada', 'wrench');
};
A['obra-borrar'] = async el => {
  if (!esAdmin()) return;
  if (!await confirmar('Borrar la obra', 'Sale de la lista y de la pizarra. Queda anotado en la auditoría.', { si:'Borrar', peligro:true })) return;
  Store.cambiar(s => { const o = s.obras.find(x => x.id === el.dataset.id); if (!o) return; auditar(s, 'Borró una obra', `${o.casa} · ${o.tipo}`, o.id); s.obras = s.obras.filter(x => x.id !== o.id); });
  toast('Obra borrada', 'trash');
};
A['nueva-obra'] = () => hoja(esAdmin() ? 'Registrar una obra' : 'Registrar mi obra', `<form data-f="nueva-obra">
  ${formObra()}
  <label class="check"><input type="checkbox" required><span>Respeto el horario de obra (${esc(Store.s.config.obraHorario)}) y el personal ingresa con ART.</span></label>
  <button class="btn btn-pri btn-block" style="margin-top:10px">${I('send')}Publicar la obra</button></form>`);
F['nueva-obra'] = d => {
  const u = yo();
  if (esGuardia()) return;
  /* Sin aprobación previa (pedido de Claudio): la obra queda en curso al
     instante y la ven la Administración, la garita y todo el barrio. La
     Administración igual puede pausarla, editarla o borrarla. */
  const casa = esAdmin() && d.casa ? d.casa : u.casa, porAdmin = esAdmin() && d.casa && d.casa !== u.casa;
  Store.cambiar(s => { s.obras.unshift({ id:uid(), userId:u.id, casa, porAdmin: !!porAdmin, tipo:d.tipo, etapa:+d.etapa, empresa:d.empresa.trim(), tel:d.tel.trim(), inicio:d.inicio, finEstimado:d.finEstimado, detalle:d.detalle.trim(),
      estado:'activa', createdAt:Date.now(), ultima:Date.now(), historial:[{ at:Date.now(), etapa:+d.etapa, texto:d.detalle.trim() || 'Obra registrada', por:u.id }] });
    notificar(s, { para:'todos', titulo:`Nueva obra en ${casa === 'Barrio' ? 'el barrio' : casa}`, texto:`${d.tipo}${d.empresa.trim() ? ' · ' + d.empresa.trim() : ''}${d.inicio ? ' · desde ' + fechaCorta(d.inicio) : ''}${d.finEstimado ? ' hasta ' + fechaCorta(d.finEstimado) : ''}`, icon:'wrench', color:'wood', link:'obras' });
    auditar(s, 'Registró una obra', `${casa} · ${d.tipo}`); });
  cerrarHoja(); abrir('obras', 'activas'); toast('Obra publicada: ya la ve todo el barrio', 'wrench');
};
A['obra-aprobar'] = el => Store.cambiar(s => { const o = s.obras.find(x => x.id === el.dataset.id); if (!o) return; o.estado = 'activa'; o.ultima = Date.now();
  o.historial.push({ at:Date.now(), etapa:o.etapa, texto:'Aprobada por la Administración', por:yo().id });
  notificar(s, { para:o.userId, titulo:'Tu obra fue aprobada', texto:o.tipo, icon:'check', color:'ok', link:'obras' });
  notificar(s, { para:'todos', titulo:`Nueva obra en ${o.casa}`, texto:`${o.tipo} · ${o.empresa || ''}`, icon:'wrench', color:'wood', link:'obras' });
  auditar(s, 'Aprobó una obra', `${o.casa} · ${o.tipo}`, o.id); });
A['obra-avance'] = el => { const o = Store.s.obras.find(x => x.id === el.dataset.id); if (!o) return;
  hoja(`Obra de ${o.casa}`, `<form data-f="obra-avance" data-id="${o.id}"><div class="field"><label>Etapa</label><select name="etapa">${ETAPAS.map((e, i) => `<option value="${i}" ${i === o.etapa ? 'selected' : ''}>${e}</option>`).join('')}</select></div>
    <div class="field"><label>Novedad</label><textarea name="texto" required maxlength="300" placeholder="Ej: se terminó de hormigonar la platea"></textarea></div>${campoFoto('fotoObra')}
    <button class="btn btn-pri btn-block">${I('check')}Guardar</button></form>`); };
F['obra-avance'] = (d, form) => {
  Store.cambiar(s => { const o = s.obras.find(x => x.id === form.dataset.id); if (!o) return; o.etapa = +d.etapa; o.ultima = Date.now();
    o.historial.push({ at:Date.now(), etapa:+d.etapa, texto:d.texto.trim(), foto:fotoParaOtros(d.foto, 30), por:yo().id });
    if (o.etapa === ETAPAS.length - 1){ o.estado = 'finalizada'; auditar(s, 'Obra finalizada', o.casa, o.id); }
    if (o.userId !== yo().id) notificar(s, { para:o.userId, titulo:'Novedad en tu obra', texto:d.texto.trim(), icon:'wrench', color:'wood', link:'obras' }); });
  cerrarHoja(); toast('Obra actualizada', 'wrench');
};
A['obra-hoy'] = el => hoja('Aviso de obra para hoy', `<form data-f="obra-hoy" data-id="${el.dataset.id}"><div class="field"><label>¿Qué va a pasar hoy?</label><input name="texto" required maxlength="100" placeholder="Entra un mixer, corte de calle 20 min…"></div>
  <div class="field"><label>Hora</label><input type="time" name="hora"></div><button class="btn btn-pri btn-block">${I('send')}Avisar a los vecinos</button></form>`);
F['obra-hoy'] = (d, form) => {
  Store.cambiar(s => { const o = s.obras.find(x => x.id === form.dataset.id); if (!o) return; o.avisoHoy = { fecha:hoyISO(), texto:d.texto.trim(), hora:d.hora };
    notificar(s, { para:'todos', titulo:`Obra en ${o.casa}: ${d.texto.trim()}`, texto:d.hora ? `Desde las ${d.hora} h` : 'Hoy', icon:'truck', color:'warn', link:'obras' }); });
  cerrarHoja(); toast('Aviso enviado', 'truck');
};
A['obra-pausa'] = el => Store.cambiar(s => { const o = s.obras.find(x => x.id === el.dataset.id); if (!o) return; o.estado = 'pausada'; o.historial.push({ at:Date.now(), etapa:o.etapa, texto:'Pausada por la Administración', por:yo().id }); notificar(s, { para:o.userId, titulo:'Tu obra fue pausada', texto:'Consultá con la Administración', icon:'wrench', color:'danger', link:'obras' }); auditar(s, 'Pausó una obra', o.casa, o.id); });
A['obra-reanudar'] = el => Store.cambiar(s => { const o = s.obras.find(x => x.id === el.dataset.id); if (!o) return; o.estado = 'activa'; o.historial.push({ at:Date.now(), etapa:o.etapa, texto:'Reanudada', por:yo().id }); });

/* ---------- VIAJES COMPARTIDOS ---------- */
const DESTINOS = ['Centro','Aeropuerto','Escuela','Cerro Castor','Río Grande','Tolhuin','Otro'];
R.viajes = {
  titulo: 'Viajes compartidos', icon: 'car', color: 'sky', sub: 'Al centro, a la escuela, al aeropuerto, al cerro',
  render(){
    const u = yo(), ahora = hoyISO();
    const ls = Store.s.viajes.filter(v => v.fecha >= ahora).sort((a, b) => (a.fecha + a.hora).localeCompare(b.fecha + b.hora));
    return `${superficie({ a:'nuevo-viaje', icon:'plus', t:'Ofrecer o pedir un lugar', s:'Menos autos en la ruta, más charla entre vecinos', cls:'acento' })}
      ${ls.length ? ls.map(v => { const au = usuario(v.userId) || {}, yoEstoy = v.anotados.includes(u.id), libres = v.tipo === 'ofrezco' ? v.lugares - v.anotados.length : null;
        return `<div class="card"><div class="row"><span class="ic ic-${v.tipo === 'ofrezco' ? 'sky' : 'wood'}" style="width:40px;height:40px;border-radius:13px;display:grid;place-items:center">${I('car')}</span>
          <div class="grow"><b>${v.tipo === 'ofrezco' ? 'Llevo' : 'Busco lugar'} → ${esc(v.destino)}</b><div class="muted small">${relDia(v.fecha)} · ${v.hora} h · ${esc(au.nombre || '')} (${esc(au.casa || '')})</div></div>
          ${libres !== null ? `<span class="pill ${libres > 0 ? 'p-ok' : ''}">${libres > 0 ? plural(libres, 'lugar', 'lugares') : 'Completo'}</span>` : ''}</div>
          ${v.nota ? `<p class="small" style="margin:8px 0 0;color:var(--ink-2)">${esc(v.nota)}${v.vuelta ? ' · con vuelta' : ''}</p>` : ''}
          <div class="btns" style="margin-top:10px">${v.userId === u.id ? `<span class="muted small">${plural(v.anotados.length, 'vecino anotado', 'vecinos anotados')}: ${v.anotados.map(id => esc(usuario(id)?.casa || '')).join(', ') || '—'}</span><button class="btn btn-xs btn-danger-soft" data-a="borrar-viaje" data-id="${v.id}">Quitar</button>`
            : `<button class="btn btn-sm ${yoEstoy ? 'btn-accent' : 'btn-pri'}" data-a="sumarme-viaje" data-id="${v.id}" ${libres === 0 && !yoEstoy ? 'disabled' : ''}>${yoEstoy ? I('check') + 'Anotado' : v.tipo === 'ofrezco' ? 'Me sumo' : 'Yo te llevo'}</button>
               <button class="btn btn-sm btn-sec" data-a="abrir" data-v="dm" data-p="${v.userId}">${I('chat')}</button>`}</div></div>`; }).join('') : vacio('car', 'No hay viajes publicados.')}`;
  },
};
A['nuevo-viaje'] = () => hoja('Viaje compartido', `<form data-f="viaje">
  <div class="seg" style="margin-bottom:12px"><label><input type="radio" name="tipo" value="ofrezco" checked><span>${I('car')}Tengo lugar</span></label><label><input type="radio" name="tipo" value="busco"><span>${I('search')}Busco lugar</span></label></div>
  <div class="grid2"><div class="field"><label>Destino</label><select name="destino">${DESTINOS.map(d => `<option>${d}</option>`).join('')}</select></div><div class="field"><label>Lugares</label><input type="number" name="lugares" min="1" max="7" value="3"></div></div>
  <div class="grid2"><div class="field"><label>Día</label><input type="date" name="fecha" min="${hoyISO()}" value="${hoyISO()}" required></div><div class="field"><label>Hora de salida</label><input type="time" name="hora" required value="08:00"></div></div>
  <div class="field"><label>Nota</label><input name="nota" maxlength="120" placeholder="Salgo de la garita, vuelvo 13 h…"></div>
  <label class="check"><input type="checkbox" name="vuelta"><span>También hay vuelta</span></label>
  <button class="btn btn-pri btn-block" style="margin-top:10px">${I('send')}Publicar</button></form>`);
F['viaje'] = d => { const u = yo(); Store.cambiar(s => s.viajes.push({ id:uid(), userId:u.id, tipo:d.tipo, destino:d.destino, lugares:+d.lugares || 1, fecha:d.fecha, hora:d.hora, nota:d.nota.trim(), vuelta:!!d.vuelta, anotados:[], createdAt:Date.now() })); cerrarHoja(); toast('Viaje publicado', 'car'); };
A['sumarme-viaje'] = el => { const u = yo(); Store.cambiar(s => { const v = s.viajes.find(x => x.id === el.dataset.id); if (!v) return; const i = v.anotados.indexOf(u.id);
  if (i >= 0) v.anotados.splice(i, 1); else { v.anotados.push(u.id); notificar(s, { para:v.userId, titulo:`${u.nombre.split(' ')[0]} (${u.casa}) se sumó a tu viaje`, texto:`${v.destino} · ${relDia(v.fecha)} ${v.hora}`, icon:'car', color:'sky', link:'dm:' + u.id }); } }); };
A['borrar-viaje'] = el => Store.cambiar(s => { s.viajes = s.viajes.filter(v => v.id !== el.dataset.id); });

/* ---------- INFRACCIONES (graduales, con derecho a descargo) ---------- */
const TIPOS_INF = { velocidad:'Exceso de velocidad', ruidos:'Ruidos molestos', mascotas:'Mascota suelta o sin correa', obra:'Obra fuera de horario', residuos:'Residuos fuera de día u horario', estacionamiento:'Estacionamiento indebido', otro:'Otra' };
const NIVELES = [['llamado','Llamado de atención'],['apercibimiento','Apercibimiento'],['multa','Multa'],['suspension','Suspensión de espacios comunes']];
const nivelSugerido = casa => { const n = Store.s.infracciones.filter(i => i.casa === casa && i.estado !== 'anulada' && Date.now() - i.at < 365 * DIA).length; return NIVELES[Math.min(n, NIVELES.length - 1)][0]; };
R.infracciones = {
  titulo: 'Infracciones', icon: 'alert', color: 'danger', sub: () => esAdmin() ? 'Sanciones graduales con derecho a descargo (art. 2086 CCyC)' : 'Las de tu casa',
  render(){
    const u = yo(), s = Store.s;
    const ls = (esAdmin() ? s.infracciones : s.infracciones.filter(i => i.casa === u.casa)).slice().sort((a, b) => b.at - a.at);
    if (esGuardia()) return vacio('lock', 'Las infracciones las maneja la Administración.');
    return `${esAdmin() ? superficie({ a:'nueva-infraccion', icon:'plus', t:'Registrar una infracción', s:'La app sugiere el nivel según los antecedentes de la casa', cls:'acento' }) : aviso('info', 'info', 'Siempre podés presentar tu descargo', 'La Administración lo revisa antes de dejar firme la sanción.')}
      ${ls.length ? ls.map(i => `<div class="card"><div class="row" style="align-items:flex-start"><span class="ic ic-danger" style="width:40px;height:40px;border-radius:13px;display:grid;place-items:center;flex:none">${I('alert')}</span>
        <div class="grow"><b>${esc(TIPOS_INF[i.tipo] || i.tipo)}</b><div class="muted small">${esc(i.casa)} · ${new Date(i.at).toLocaleDateString('es-AR')} · ${esc(NIVELES.find(n => n[0] === i.nivel)?.[1] || '')}${i.monto ? ' · ' + esc(i.monto) : ''}</div></div>
        <span class="pill ${i.estado === 'firme' ? 'p-danger' : i.estado === 'anulada' ? '' : 'p-warn'}">${{ notificada:'Notificada', descargo:'Con descargo', firme:'Firme', anulada:'Anulada' }[i.estado]}</span></div>
        <p class="small" style="margin:8px 0 0;color:var(--ink-2)">${esc(i.detalle)}</p>${fotoHTML(i.foto, 'post-foto')}
        ${i.descargo ? `<div class="card plana small" style="margin:10px 0 0"><b>Descargo:</b> ${esc(i.descargo)}</div>` : ''}
        <div class="btns" style="margin-top:10px">${!esAdmin() && i.estado === 'notificada' ? `<button class="btn btn-sm btn-pri" data-a="descargo" data-id="${i.id}">${I('edit')}Presentar descargo</button>` : ''}
          ${esAdmin() && i.estado !== 'firme' && i.estado !== 'anulada' ? `<button class="btn btn-sm btn-danger" data-a="inf-estado" data-v="firme" data-id="${i.id}">Dejar firme</button><button class="btn btn-sm btn-sec" data-a="inf-estado" data-v="anulada" data-id="${i.id}">Anular</button>` : ''}</div></div>`).join('') : vacio('check', 'Sin infracciones.')}`;
  },
};
A['nueva-infraccion'] = () => hoja('Registrar infracción', `<form data-f="infraccion">
  <div class="grid2"><div class="field"><label>Casa</label><select name="casa" id="infCasa">${opcionesLotes()}</select></div>
    <div class="field"><label>Tipo</label><select name="tipo">${Object.entries(TIPOS_INF).map(([k, t]) => `<option value="${k}">${t}</option>`).join('')}</select></div></div>
  <div class="field"><label>Qué pasó</label><textarea name="detalle" required maxlength="500"></textarea></div>
  <div class="grid2"><div class="field"><label>Nivel</label><select name="nivel" id="infNivel">${NIVELES.map(n => `<option value="${n[0]}">${n[1]}</option>`).join('')}</select><div class="ayuda" id="infSug"></div></div>
    <div class="field"><label>Monto (si es multa)</label><input name="monto" maxlength="30"></div></div>
  ${campoFoto('fotoInf', 'Prueba (opcional)')}
  <button class="btn btn-danger btn-block">${I('send')}Notificar a la casa</button></form>`);
document.addEventListener('change', e => { if (e.target.id === 'infCasa') sugerirNivel(); });
function sugerirNivel(){ const c = $('#infCasa'), n = $('#infNivel'), s = $('#infSug'); if (!c || !n) return; n.value = nivelSugerido(c.value);
  const k = Store.s.infracciones.filter(i => i.casa === c.value && i.estado !== 'anulada' && Date.now() - i.at < 365 * DIA).length; s.textContent = `Sugerido por ${plural(k, 'antecedente')} en 12 meses`; }
const _nuevaInf = A['nueva-infraccion']; A['nueva-infraccion'] = () => { _nuevaInf(); sugerirNivel(); };
F['infraccion'] = d => {
  Store.cambiar(s => { const i = { id:uid(), casa:d.casa, tipo:d.tipo, detalle:d.detalle.trim(), nivel:d.nivel, monto:d.monto.trim(), foto:fotoParaOtros(d.foto, 45), at:Date.now(), estado:'notificada', por:yo().id };
    s.infracciones.unshift(i);
    notificar(s, { para:s.users.filter(x => x.casa === d.casa && x.estado === 'aprobado').map(x => x.id), titulo:'Notificación de la Administración', texto:`${TIPOS_INF[d.tipo]} · podés presentar tu descargo`, icon:'alert', color:'danger', link:'infracciones' });
    auditar(s, 'Registró una infracción', `${d.casa} · ${TIPOS_INF[d.tipo]} · ${d.nivel}`, i.id); });
  cerrarHoja(); toast('Infracción notificada', 'alert');
};
A['descargo'] = el => hoja('Presentar descargo', `<form data-f="descargo" data-id="${el.dataset.id}"><div class="field"><label>Tu descargo</label><textarea name="texto" required maxlength="1000" style="min-height:140px"></textarea></div><button class="btn btn-pri btn-block">${I('send')}Enviar</button></form>`);
F['descargo'] = (d, form) => { Store.cambiar(s => { const i = s.infracciones.find(x => x.id === form.dataset.id); if (!i) return; i.descargo = d.texto.trim(); i.estado = 'descargo';
  notificar(s, { para:'rol:admin', titulo:`Descargo de ${i.casa}`, texto:TIPOS_INF[i.tipo], icon:'edit', color:'warn', link:'infracciones' }); auditar(s, 'Presentó descargo', i.casa, i.id); }); cerrarHoja(); toast('Descargo enviado', 'send'); };
A['inf-estado'] = el => Store.cambiar(s => { const i = s.infracciones.find(x => x.id === el.dataset.id); if (!i) return; i.estado = el.dataset.v;
  notificar(s, { para:s.users.filter(x => x.casa === i.casa).map(x => x.id), titulo: el.dataset.v === 'firme' ? 'La sanción quedó firme' : 'La infracción fue anulada', texto:TIPOS_INF[i.tipo], icon:'alert', color: el.dataset.v === 'firme' ? 'danger' : 'ok', link:'infracciones' });
  auditar(s, el.dataset.v === 'firme' ? 'Dejó firme una infracción' : 'Anuló una infracción', i.casa, i.id); });

/* ---------- PROVEEDORES HABILITADOS ---------- */
const artEstado = p => { if (!p.artVence) return ['Sin ART cargada','warn']; const d = Math.round((fechaDe(p.artVence) - fechaDe(hoyISO())) / DIA); return d < 0 ? ['ART vencida','danger'] : d <= 7 ? [`ART vence en ${plural(d, 'día')}`,'warn'] : ['ART vigente','ok']; };
R.proveedores = {
  titulo: 'Proveedores habilitados', icon: 'box', color: 'accent', sub: 'Con ART y seguro al día',
  render(q){
    const qq = normTxt(q);
    const ls = Store.s.proveedores.filter(p => !qq || normTxt(p.empresa + ' ' + p.rubro + ' ' + (p.personal || '')).includes(qq)).sort((a, b) => a.empresa.localeCompare(b.empresa));
    return `<form data-f="buscar-prov" class="linea-form" style="margin-bottom:12px"><input name="q" id="qProv" value="${esc(q || '')}" placeholder="Empresa, rubro o nombre de un operario"><button class="btn btn-pri">${I('search')}</button></form>
      ${esAdmin() ? superficie({ a:'abrir', v:'admin', p:'contenido|proveedores', icon:'edit', color:'accent', t:'Editar proveedores', s:'Desde Administración → Contenido' }) : ''}
      ${ls.length ? ls.map(p => { const [t, c] = artEstado(p);
        return `<div class="card"><div class="row"><div class="grow"><b>${esc(p.empresa)}</b><div class="muted small">${esc(p.rubro || '')}${p.tel ? ' · ' + esc(p.tel) : ''}</div></div><span class="pill p-${c}">${t}</span></div>
          ${p.personal ? `<div class="small" style="margin-top:8px;color:var(--ink-2)">${I('users')} ${esc(String(p.personal).split('\n').join(', '))}</div>` : ''}
          ${p.seguroVence ? `<div class="tiny muted" style="margin-top:4px">Seguro hasta ${fechaCorta(p.seguroVence)}</div>` : ''}</div>`; }).join('') : vacio('box', 'No hay proveedores cargados.')}`;
  },
};
F['buscar-prov'] = d => abrir('proveedores', d.q || '');
LISTAS.proveedores = { t:'Proveedores habilitados', icon:'box', campos:[['empresa','Empresa'],['rubro','Rubro'],['cuit','CUIT'],['tel','Teléfono','tel'],['artVence','ART vence','date'],['seguroVence','Seguro vence','date'],['personal','Personal (uno por renglón)','area']],
  titulo:x => x.empresa, sub:x => `${x.rubro || ''} · ${artEstado(x)[0]}` };
REGLAS.push({ id:'art-vencida', n:'ART de proveedor por vencer → avisar', d:'Siete días antes y el día que vence, avisa a la Administración y a la guardia.',
  run(s, hoy){ let n = 0; s.proveedores.forEach(p => { if (!p.artVence) return; const d = Math.round((fechaDe(p.artVence) - fechaDe(hoy)) / DIA);
    if (d === 7 || d === 0) n += marca(s, `art-${p.id}-${d}`, () => notificar(s, { para:'staff', titulo: d ? `ART de ${p.empresa} vence en 7 días` : `ART de ${p.empresa} vence hoy`, texto:'Pedir la renovación antes de dejarlos ingresar.', icon:'box', color:'warn', link:'proveedores' })); }); return n; } });
