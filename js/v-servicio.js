/* =========================================================
   SERVICIOS DEL DÍA A DÍA
   -------------------------------------------------------
   Lo que hace que la app resuelva cosas y no solo informe:

     · CAMIÓN DE LA BASURA: lo registra la garita (patente, hora de
       entrada y de salida). Mientras está adentro, cruza un camión
       por la pantalla de todos, una y otra vez, hasta que sale. Al
       entrar suena una melodía de camión de helados y llega un aviso
       al celular aunque tenga la pantalla apagada.
     · INGRESOS FRECUENTES: proveedores del hotel, la van, el personal
       doméstico… La Administración los carga UNA vez y les da un QR
       fijo; la garita lo escanea cada vez que entran.
     · AVISOS URGENTES POR ZONA: corte de luz, nieve, portón, calle
       cortada. Cada vecino de la zona responde "Recibido" o "Necesito
       ayuda" y la guardia ve quién necesita qué.
     · PAQUETES: la garita saca foto, anota empresa y hora; el vecino
       recibe el aviso y confirma que lo retiró.
     · CREDENCIAL DEL VECINO: un QR personal para identificarse en la
       garita, en los espacios comunes y al retirar paquetes. No guarda
       fotos del DNI ni datos sensibles: es un código que la app valida.
   ========================================================= */

/* ---------- utilidades de este archivo ---------- */
const codigoLargo = (pref, n = 8) => { const abc = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let c = '';
  const r = new Uint32Array(n); (crypto || window.msCrypto).getRandomValues(r); r.forEach(x => { c += abc[x % abc.length]; }); return pref + '-' + c; };
const numeroDeLote = casa => String(casa || '').replace(/^Lote\s*/i, '').trim().toUpperCase();
/* "1-40, 75, 133A" → ['1','2',…,'40','75','133A'] */
function lotesDeTexto(t){
  const out = new Set();
  String(t || '').split(/[,;\s]+/).filter(Boolean).forEach(p => {
    const m = p.match(/^(\d+)-(\d+)$/);
    if (m){ for (let i = +m[1]; i <= +m[2] && i - +m[1] < 400; i++) out.add(String(i)); }
    else out.add(p.replace(/^lote/i, '').toUpperCase());
  });
  return [...out].filter(l => LOTES.some(L => L.lote.toUpperCase() === l));
}

/* =========================================================
   1. EL CAMIÓN DE LA BASURA
   ========================================================= */
const Camion = {
  PREF:'bhc.camion', OCULTO:'bhc.camion.oculto', SONO:'bhc.camion.sono', el:null,
  lista(){ return aLista(Store.s.camion).filter(Boolean).sort((a, b) => b.entra - a.entra); },
  /* Un viaje abierto: entró y todavía no se registró la salida. Pasadas 8
     horas se da por terminado solo (alguien se olvidó de marcar la salida). */
  adentro(){ return this.lista().find(c => c.entra && !c.sale && Date.now() - c.entra < 8 * HORA) || null; },
  encendido(){ try { return localStorage.getItem(this.PREF) !== 'no'; } catch(e){ return true; } },
  prender(v){ try { localStorage.setItem(this.PREF, v ? 'si' : 'no'); } catch(e){} },
  revisar(){
    const c = this.adentro();
    let oculto = ''; try { oculto = localStorage.getItem(this.OCULTO) || ''; } catch(e){}
    if (!c || !yo() || !this.encendido() || oculto === c.id){ this.quitar(); return; }
    this.mostrar(c);
    /* La melodía suena una sola vez por viaje en cada equipo, y solo si el
       camión entró hace poco (no al abrir la app dos horas después). */
    let sono = ''; try { sono = localStorage.getItem(this.SONO) || ''; } catch(e){}
    if (sono !== c.id && Date.now() - c.entra < 15 * MIN){
      try { localStorage.setItem(this.SONO, c.id); } catch(e){}
      this.melodia();
      Sonido.vibrar([120, 60, 120, 60, 120, 200, 300]);
    }
  },
  /* El camión cruza la pantalla de izquierda a derecha, en bucle, hasta
     que la garita registra la salida. No tapa nada: solo el cartelito se
     puede tocar (para ir a Residuos o para ocultarlo en este equipo). */
  mostrar(c){
    if (this.el && this.el.isConnected && this.el.dataset.id === c.id){ this.el.querySelector('.cam-hora').textContent = `entró ${hora(c.entra)} h`; return; }
    this.quitar();
    const quieto = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const el = this.el = document.createElement('div');
    el.className = 'camion-pasa' + (quieto ? ' quieto' : '');
    el.dataset.id = c.id;
    el.innerHTML = `<div class="cam-pista" aria-hidden="true"><div class="cam-auto">${CAMION_SVG}</div></div>
      <div class="cam-cartel" role="status"><span class="cam-ic">${I('tacho')}</span>
        <button class="cam-txt" data-cam="ver"><b>El camión de la basura está en el barrio</b><span class="cam-hora">entró ${hora(c.entra)} h</span></button>
        <button class="cam-x" data-cam="ocultar" aria-label="Ocultar el camión en este equipo">${I('x')}</button></div>`;
    el.addEventListener('click', e => {
      const b = e.target.closest('[data-cam]'); if (!b) return;
      if (b.dataset.cam === 'ocultar'){ try { localStorage.setItem(this.OCULTO, c.id); } catch(err){} this.quitar(); toast('Listo: el camión no se muestra más hasta la próxima vez', 'tacho'); }
      else abrir('recoleccion');
    });
    document.body.appendChild(el);
  },
  quitar(){ if (this.el){ this.el.remove(); this.el = null; } },
  /* Una melodía de caja de música, como la de los camiones de helados
     norteamericanos de los años 60 (la tonada es propia, no una canción
     con dueño). Suena dos veces y listo. */
  melodia(){
    const N = { G5:784, A5:880, B5:987.8, C6:1046.5, D6:1174.7, E6:1318.5, F6:1396.9, G6:1568, A6:1760 };
    const frase = [['G5',.18],['C6',.18],['E6',.18],['G6',.36],['E6',.18],['G6',.18],['A6',.36],['G6',.18],['E6',.18],['C6',.18],['D6',.18],['E6',.18],['D6',.18],['B5',.18],['C6',.54]];
    const notas = [], bajo = [];
    let t = 0;
    for (let v = 0; v < 2; v++){
      frase.forEach(([n, d]) => { notas.push([N[n], t, d * 1.6]); bajo.push([N[n] / 2, t, d * 1.2]); t += d; });
      t += .35;
    }
    Sonido.tocar(notas, 'triangle', .16);
    Sonido.tocar(bajo, 'sine', .06);
  },
  arrancar(){ if (this.timer) return; this.timer = setInterval(() => this.revisar(), 5000); },
};

const CAMION_SVG = `<svg viewBox="0 0 150 80" width="150" height="80">
  <rect x="4" y="16" width="86" height="42" rx="6" fill="#2f8f4e"/>
  <rect x="4" y="16" width="86" height="10" rx="5" fill="#27793f"/>
  <g stroke="#27793f" stroke-width="3"><path d="M22 30v22M40 30v22M58 30v22M76 30v22"/></g>
  <path d="M90 26h24l16 16v16H90z" fill="#f2f2ec"/><path d="M96 31h16l11 11H96z" fill="#9fd3e8"/>
  <rect x="88" y="54" width="44" height="6" rx="2" fill="#5b5f63"/><rect x="2" y="56" width="92" height="5" rx="2" fill="#5b5f63"/>
  <rect x="126" y="46" width="6" height="5" rx="1" fill="#ffd166"/>
  <g class="cam-rueda"><circle cx="26" cy="63" r="10" fill="#23272b"/><circle cx="26" cy="63" r="4" fill="#bfc5ca"/><path d="M26 55v16M18 63h16" stroke="#8a9096" stroke-width="1.5"/></g>
  <g class="cam-rueda"><circle cx="110" cy="63" r="10" fill="#23272b"/><circle cx="110" cy="63" r="4" fill="#bfc5ca"/><path d="M110 55v16M102 63h16" stroke="#8a9096" stroke-width="1.5"/></g>
  <text x="47" y="46" text-anchor="middle" font-family="Manrope,system-ui,sans-serif" font-size="10" font-weight="800" fill="#fff">RESIDUOS</text></svg>`;

/* La garita: entrada y salida del camión. */
A['camion-entra'] = () => {
  const c = Store.s.config, ult = Camion.lista()[0];
  hoja('Entró el camión de la basura', `<form data-f="camion-entra">
    <div class="grid2"><div class="field"><label>Patente</label><input name="patente" required maxlength="10" style="text-transform:uppercase" value="${esc(ult?.patente || c.camionPatente || '')}"></div>
      <div class="field"><label>Hora de entrada</label><input name="hora" type="time" required value="${hora(Date.now())}"></div></div>
    <div class="field"><label>Empresa</label><input name="empresa" maxlength="50" value="${esc(ult?.empresa || c.camionEmpresa || 'SEINCO S.A.')}"></div>
    <p class="muted small" style="margin:0 0 12px">Al guardar, a todos (vecinos y Administración) les cruza el camión por la pantalla y les llega un aviso con sonido, aunque tengan la app cerrada o el celular bloqueado (si activaron los avisos). El "Hoy pasa el camión" se borra solo de la pizarra.</p>
    <button class="btn btn-pri btn-block">${I('tacho')}Registrar la entrada y avisar</button></form>`);
};
F['camion-entra'] = d => {
  const [h, m] = String(d.hora || '').split(':').map(Number), f = new Date(); f.setHours(h || 0, m || 0, 0, 0);
  const entra = Math.min(Date.now(), f.getTime()), patente = normPatente(d.patente) || String(d.patente).toUpperCase();
  let viaje;
  Store.cambiar(s => {
    viaje = { id:uid(), patente, empresa:String(d.empresa || '').trim(), entra, sale:null, por:yo().id };
    s.camion.unshift(viaje); if (s.camion.length > 120) s.camion.length = 120;
    s.bitacora.unshift({ id:uid(), autor:yo().id, tipo:'acceso', texto:`Ingreso del camión de residuos · ${patente}${viaje.empresa ? ' · ' + viaje.empresa : ''} · ${hora(entra)} h`, at:Date.now() });
    /* A TODOS: vecinos, Administración y cualquier equipo abierto
       (teléfono, tablet o computadora). Antes iba solo a rol vecino, y
       quien administra y además vive en el barrio no se enteraba. */
    notificar(s, { para:'todos', titulo:'Entró el camión de la basura', texto:`${hora(entra)} h · si todavía no sacaste las bolsas, es ahora.`, icon:'tacho', color:'ok', link:'recoleccion', sonido:true, push:false, camionId:viaje.id });
  });
  /* El push llega aunque la app esté cerrada o la pantalla bloqueada, en
     todos los equipos que activaron los avisos (menos el de la garita). */
  if (typeof Push !== 'undefined') Push.enviar({ para:'todos', titulo:'🚛 Entró el camión de la basura', texto:`${hora(entra)} h · si todavía no sacaste las bolsas, es ahora.`, link:'recoleccion', tag:'camion-' + viaje.id, sonido:'camion' });

  cerrarHoja(); toast('Entrada registrada. Los vecinos ya fueron avisados.', 'tacho');
  Camion.revisar();
};
A['camion-sale'] = async el => {
  const c = Camion.adentro(); if (!c) return;
  if (!await confirmar('Salida del camión', `¿Registrar la salida del camión ${esc(c.patente)} ahora (${hora(Date.now())} h)?`, { si:'Registrar salida' })) return;
  Store.cambiar(s => {
    const x = s.camion.find(z => z.id === c.id); if (!x) return;
    x.sale = Date.now(); x.salePor = yo().id;
    s.bitacora.unshift({ id:uid(), autor:yo().id, tipo:'acceso', texto:`Egreso del camión de residuos · ${x.patente} · ${hora(x.sale)} h (estuvo ${Math.max(1, Math.round((x.sale - x.entra) / MIN))} min)`, at:Date.now() });
  });
  Camion.quitar(); toast('Salida registrada. El camión deja de verse en las pantallas.', 'check');
};
A['camion-aviso'] = () => { Camion.prender(!Camion.encendido()); Camion.revisar(); refrescar(); toast(Camion.encendido() ? 'El camión se va a ver cuando entre' : 'Listo: no se muestra el camión en este equipo', 'tacho'); };
A['camion-probar'] = () => { Camion.melodia(); Sonido.vibrar([120, 60, 120, 60, 120]); };
function bandaCamion(garita = false){
  const c = Camion.adentro();
  if (!c) return garita ? `<button class="superficie" data-a="camion-entra"><span class="ic ic-ok">${I('tacho')}</span><span class="txt"><b>Camión de la basura</b><small>Registrar la entrada (patente y hora)</small></span>${I('right')}</button>` : '';
  const min = Math.max(1, Math.round((Date.now() - c.entra) / MIN));
  return aviso('ok', 'tacho', `Camión de la basura en el barrio · ${esc(c.patente)}`, `Entró a las ${hora(c.entra)} h · hace ${min} min${c.empresa ? ' · ' + esc(c.empresa) : ''}`,
    garita ? `<button class="btn btn-xs btn-pri" data-a="camion-sale">${I('logout')}Registrar la salida</button>` : '');
}

/* =========================================================
   2. INGRESOS FRECUENTES (proveedores asiduos)
   ========================================================= */
const TIPOS_FREC = {
  hotel:      { n:'Proveedor del hotel', icon:'box', ej:'Alimentos, bebidas, lavandería del Hotel Los Cauquenes' },
  van:        { n:'Van o transfer del hotel', icon:'car', ej:'La van de pasajeros del hotel' },
  domestico:  { n:'Personal doméstico', icon:'home', ej:'Empleadas/os de casas del barrio' },
  cuidado:    { n:'Cuidado de personas', icon:'heart', ej:'Niñeras, acompañantes, enfermería' },
  jardin:     { n:'Jardinería y parque', icon:'tree', ej:'Cortes de pasto, poda' },
  mant:       { n:'Mantenimiento', icon:'wrench', ej:'Calderas, piletas, electricidad, plomería' },
  obra:       { n:'Personal de obra', icon:'truck', ej:'Obras en curso con permiso' },
  autos:      { n:'Autos y remises fijos', icon:'car', ej:'Chofer habitual de una casa' },
  mascotas:   { n:'Paseo y cuidado de mascotas', icon:'paw', ej:'Paseadores, veterinaria a domicilio' },
  clases:     { n:'Profesores y terapeutas', icon:'book', ej:'Clases particulares, kinesiología' },
  reparto:    { n:'Reparto fijo', icon:'cart', ej:'Agua, gas, leña, diarios' },
  otro:       { n:'Otro', icon:'user', ej:'' },
};
const frecuentes = () => aLista(Store.s.frecuentes).filter(Boolean);
function frecuenteVigente(f, iso = hoyISO()){
  if (!f || f.baja) return { ok:false, motivo:'Dado de baja' };
  if (f.vence && f.vence < iso) return { ok:false, motivo:`Venció el ${fechaCorta(f.vence)}` };
  const dias = aLista(f.dias).map(Number);
  if (dias.length && !dias.includes(fechaDe(iso).getDay())) return { ok:false, motivo:`Hoy no es su día (${dias.map(d => DIAS[d]).join(', ')})`, aviso:true };
  if (f.desde && f.hasta){ const m = ahoraMin(); if (m < minutosDe(f.desde) - 30 || m > minutosDe(f.hasta) + 30) return { ok:true, motivo:`Fuera de su horario (${f.desde} a ${f.hasta})`, aviso:true }; }
  return { ok:true };
}
const ultimoMovFrec = f => aLista(Store.s.bitacora).find(b => b && b.frecId === f.id);
R.frecuentes = {
  titulo:'Ingresos frecuentes', icon:'qr', color:'brand', ancha:true, sub:'Proveedores y personal que entran siempre, con QR fijo',
  render(q){
    if (!esStaff()) return vacio('lock', 'Solo para la garita y la Administración.');
    const qq = normTxt(q || '');
    const ls = frecuentes().filter(f => !qq || normTxt([f.nombre, f.empresa, f.destino, f.patente, TIPOS_FREC[f.tipo]?.n].join(' ')).includes(qq))
      .sort((a, b) => (!!a.baja - !!b.baja) || a.nombre.localeCompare(b.nombre));
    return `<p class="muted small" style="margin:0 0 12px">Para quien entra todas las semanas: la Administración lo carga una vez y le manda su QR. En la garita se escanea o se escribe el código, y queda anotado el ingreso y la salida. Los que entran de vez en cuando (Uber, DiDi, taxis, correo) no van acá: entran con su patente por "Llegó sin aviso", o con el pase que les manda el vecino.</p>
      ${esAdmin() ? superficie({ a:'frec-editar', icon:'plus', color:'brand', t:'Agregar un ingreso frecuente', s:'Nombre, a dónde va, días y horario: la app arma su QR', cls:'acento' }) : ''}
      <form data-f="buscar-frec" class="linea-form" style="margin:12px 0"><input name="q" id="qFrec" value="${esc(q || '')}" placeholder="Nombre, empresa, patente o destino"><button class="btn btn-pri">${I('search')}</button></form>
      ${ls.length ? ls.map(f => { const t = TIPOS_FREC[f.tipo] || TIPOS_FREC.otro, v = frecuenteVigente(f), ult = ultimoMovFrec(f);
        return `<div class="card" style="padding:13px 14px${f.baja ? ';opacity:.55' : ''}"><div class="pase"><span class="ic ic-${v.ok && !v.aviso ? 'ok' : v.ok ? 'warn' : 'danger'}">${I(t.icon)}</span>
          <div class="datos"><b>${esc(f.nombre)}${f.empresa ? ' · ' + esc(f.empresa) : ''}</b>
            <span>${esc(t.n)} → ${esc(f.destino || 'Barrio')}${f.patente ? ' · ' + esc(f.patente) : ''}${aLista(f.dias).length ? ' · ' + aLista(f.dias).map(d => DIAS[d]).join(' ') : ''}${f.desde ? ` · ${f.desde}–${f.hasta}` : ''}</span>
            <span class="tiny muted">${esc(f.codigo)}${f.vence ? ' · vence ' + fechaCorta(f.vence) : ''}${ult ? ' · último movimiento ' + hace(ult.at) : ''}${v.motivo ? ' · ' + esc(v.motivo) : ''}</span></div></div>
          <div class="btns" style="margin-top:10px">
            ${!f.baja ? `<button class="btn btn-xs btn-ok" data-a="frec-mov" data-id="${f.id}" data-v="in">${I('login')}Entra</button><button class="btn btn-xs btn-sec" data-a="frec-mov" data-id="${f.id}" data-v="out">${I('logout')}Sale</button>` : ''}
            <button class="btn btn-xs btn-sec" data-a="frec-qr" data-id="${f.id}">${I('qr')}QR</button>
            ${esAdmin() ? `<button class="btn btn-xs btn-sec" data-a="frec-editar" data-id="${f.id}">${I('edit')}Editar</button>` : ''}</div></div>`; }).join('')
        : vacio('qr', q ? 'Nadie coincide con esa búsqueda.' : 'Todavía no hay ingresos frecuentes cargados.')}`;
  },
};
F['buscar-frec'] = d => abrir('frecuentes', d.q || '');
A['frec-editar'] = el => {
  const f = frecuentes().find(x => x.id === el.dataset.id) || { dias:[] };
  const dias = aLista(f.dias).map(Number);
  hoja(f.id ? 'Editar ingreso frecuente' : 'Nuevo ingreso frecuente', `<form data-f="frec" data-id="${esc(f.id || '')}">
    <div class="field"><label>Tipo</label><select name="tipo">${Object.entries(TIPOS_FREC).map(([k, t]) => `<option value="${k}" ${f.tipo === k ? 'selected' : ''}>${t.n}</option>`).join('')}</select></div>
    <div class="grid2"><div class="field"><label>Nombre y apellido (o del chofer)</label><input name="nombre" required maxlength="60" value="${esc(f.nombre || '')}"></div>
      <div class="field"><label>Empresa (si tiene)</label><input name="empresa" maxlength="60" value="${esc(f.empresa || '')}" list="provLista"></div></div>
    <datalist id="provLista">${aLista(Store.s.proveedores).map(p => `<option>${esc(p.empresa)}</option>`).join('')}</datalist>
    <div class="grid2"><div class="field"><label>¿A dónde va?</label><select name="destino"><option>Hotel Los Cauquenes</option><option ${f.destino === 'Barrio (partes comunes)' ? 'selected' : ''}>Barrio (partes comunes)</option>${opcionesLotes(f.destino)}</select></div>
      <div class="field"><label>Patente (opcional)</label><input name="patente" maxlength="10" style="text-transform:uppercase" value="${esc(f.patente || '')}"></div></div>
    <div class="field"><label>Días que entra (ninguno = cualquier día)</label><div class="seg dias-sel">${[1,2,3,4,5,6,0].map(d => `<label><input type="checkbox" name="dia${d}" ${dias.includes(d) ? 'checked' : ''}><span>${DIAS[d]}</span></label>`).join('')}</div></div>
    <div class="grid3"><div class="field"><label>Desde</label><input name="desde" type="time" value="${esc(f.desde || '')}"></div>
      <div class="field"><label>Hasta</label><input name="hasta" type="time" value="${esc(f.hasta || '')}"></div>
      <div class="field"><label>Vence</label><input name="vence" type="date" value="${esc(f.vence || '')}"></div></div>
    <div class="field"><label>Teléfono (para mandarle el QR)</label><input name="tel" type="tel" maxlength="30" value="${esc(f.tel || '')}"></div>
    <div class="field"><label>Nota para la garita</label><input name="nota" maxlength="120" value="${esc(f.nota || '')}"></div>
    ${f.id ? `<label class="check"><input type="checkbox" name="baja" ${f.baja ? 'checked' : ''}><span>Dado de baja (el QR deja de valer)</span></label>
      <label class="check"><input type="checkbox" name="nuevoCodigo"><span>Generar un QR nuevo (el anterior deja de valer)</span></label>` : ''}
    <button class="btn btn-pri btn-block" style="margin-top:8px">${I('check')}Guardar</button></form>`);
};
F['frec'] = (d, form) => {
  const id = form.dataset.id;
  let guardado;
  Store.cambiar(s => {
    s.frecuentes = aLista(s.frecuentes);
    let f = s.frecuentes.find(x => x.id === id);
    if (!f){ f = { id:'fr' + uid(), codigo:codigoLargo('F'), createdAt:Date.now() }; s.frecuentes.unshift(f); }
    Object.assign(f, { tipo:d.tipo, nombre:d.nombre.trim(), empresa:(d.empresa || '').trim(), destino:d.destino, patente:normPatente(d.patente || ''),
      dias:[0,1,2,3,4,5,6].filter(x => d['dia' + x]), desde:d.desde || '', hasta:d.hasta || '', vence:d.vence || '', tel:(d.tel || '').trim(),
      nota:(d.nota || '').trim(), baja:!!d.baja, updatedAt:Date.now() });
    if (d.nuevoCodigo) f.codigo = codigoLargo('F');
    auditar(s, id ? 'Editó un ingreso frecuente' : 'Dio de alta un ingreso frecuente', `${f.nombre} → ${f.destino}`, f.id);
    guardado = f;
  });
  toast('Guardado', 'check');
  A['frec-qr']({ dataset:{ id:guardado.id } });
};
A['frec-qr'] = el => {
  const f = frecuentes().find(x => x.id === el.dataset.id); if (!f) return;
  const t = TIPOS_FREC[f.tipo] || TIPOS_FREC.otro;
  const texto = `Hola ${f.nombre.split(' ')[0]}: este es tu pase fijo para entrar al barrio ${Store.s.config.nombre} (${t.n.toLowerCase()} → ${f.destino || 'Barrio'}). En la garita mostrá el QR (te lo mandamos en foto) o decí el código ${f.codigo}.`;
  hoja('Pase fijo', `<div class="ticket"><div class="tk-top"><small>Pase fijo · ${esc(Store.s.config.nombre)}</small><h3>${esc(f.nombre)}</h3><div style="opacity:.85;font-size:13px">${esc(t.n)} → ${esc(f.destino || 'Barrio')}</div></div>
    <div class="bottom"><div class="qr-box" data-qr="BHC:${esc(f.codigo)}"></div><div class="codigo-grande">${esc(f.codigo)}</div>
    <div class="muted small">${aLista(f.dias).length ? 'Días: ' + aLista(f.dias).map(d => DIAS[d]).join(', ') : 'Cualquier día'}${f.desde ? ` · ${f.desde} a ${f.hasta} h` : ''}${f.vence ? ' · hasta el ' + fechaCorta(f.vence) : ''}</div></div></div>
    <div class="btns" style="margin-top:12px">${f.tel ? `<a class="btn btn-wa grow" href="${waLink(f.tel, texto)}" target="_blank" rel="noopener">${I('phone')}Mandarlo por WhatsApp</a>` : ''}
      <button class="btn btn-sec grow" data-a="copiar" data-v="${esc(f.codigo)}">${I('copy')}Copiar el código</button></div>
    <p class="muted tiny" style="margin:10px 2px 0">Sirve para siempre (o hasta la fecha de vencimiento). Si se pierde, desde Editar se genera uno nuevo y el viejo deja de valer.</p>`);
  setTimeout(() => $$('#hoja [data-qr]').forEach(x => pintarQR(x, x.dataset.qr)), 60);
};
A['frec-mov'] = el => {
  const f = frecuentes().find(x => x.id === el.dataset.id); if (!f) return;
  const entra = el.dataset.v === 'in', v = frecuenteVigente(f);
  Store.cambiar(s => {
    s.bitacora.unshift({ id:uid(), autor:yo().id, tipo:'acceso', frecId:f.id, texto:`${entra ? 'Ingreso' : 'Egreso'} frecuente: ${f.nombre}${f.empresa ? ' (' + f.empresa + ')' : ''} → ${f.destino}${f.patente ? ' · ' + f.patente : ''}${v.motivo ? ' · ' + v.motivo : ''}`, at:Date.now() });
    /* Si va a una casa, el vecino se entera (como con cualquier pase). */
    if (/^Lote\s/.test(f.destino || '')){
      const dest = s.users.filter(u => u.casa === f.destino && u.estado === 'aprobado').map(u => u.id);
      if (dest.length) notificar(s, { para:dest, titulo: entra ? `${f.nombre} entró al barrio` : `${f.nombre} salió del barrio`, texto:`${hora(Date.now())} h`, icon: entra ? 'login' : 'logout', color:'ok' });
    }
  });
  cerrarHoja(); toast(entra ? 'Ingreso anotado' : 'Salida anotada', entra ? 'login' : 'logout');
};

/* =========================================================
   3. CREDENCIAL DEL VECINO
   Un código propio de cada cuenta (V-XXXXXXXX). La garita lo escanea y
   ve quién es, de qué lote y la foto del frente de la casa. No lleva
   foto del DNI ni el número de documento.
   ========================================================= */
A['mi-credencial'] = () => {
  const u = yo(); if (!u) return;
  if (!u.credencial) Store.cambiar(s => { const x = s.users.find(z => z.id === u.id); if (x) x.credencial = codigoLargo('V'); });
  const c = yo().credencial;
  hoja('Tu credencial del barrio', `<div class="ticket"><div class="tk-top"><small>Credencial · Barrio ${esc(Store.s.config.nombre)}</small><h3>${esc(u.nombre)}</h3><div style="opacity:.85;font-size:13px">${esc(u.casa)}</div></div>
    <div class="bottom"><div class="qr-box" data-qr="BHC:${esc(c)}"></div><div class="codigo-grande">${esc(c)}</div>
    <div class="muted small">Mostralo en la garita o en los espacios comunes.</div></div></div>
    <p class="muted small" style="margin:12px 2px 0">Es personal. No lleva tu DNI ni ningún dato sensible: la garita solo ve tu nombre, tu lote y la foto del frente de tu casa. Si alguien lo copió, generá uno nuevo y el anterior deja de valer.</p>
    <p class="muted small" style="margin:8px 2px 0">${I('box')} <b>Para retirar un paquete</b> no sirve esta credencial: se usa el <b>QR de retiro</b>, que cambia cada 30 segundos y solo sale de tu teléfono (Tus paquetes → Mi QR para retirar).</p>
    <button class="btn btn-sec btn-block" data-a="credencial-nueva" style="margin-top:10px">${I('refresh')}Generar una credencial nueva</button>`);
  setTimeout(() => $$('#hoja [data-qr]').forEach(x => pintarQR(x, x.dataset.qr)), 60);
};
A['credencial-nueva'] = async () => {
  if (!await confirmar('Credencial nueva', 'La credencial que tenés ahora deja de valer en la garita.', { si:'Generar otra' })) return;
  Store.cambiar(s => { const x = s.users.find(z => z.id === yo().id); if (x) x.credencial = codigoLargo('V'); });
  A['mi-credencial']();
};

/* La garita recibe un código especial (frecuente o credencial). Devuelve
   true si lo resolvió; si no, validar() sigue con pases, patentes y DNI. */
function validarCodigoEspecial(txt){
  /* El QR de retiro de paquetes (firmado, cambia cada 30 s). */
  if (/^BHR1\./.test(String(txt || '').trim())){ const pid = Retiro.paqueteId || ''; Retiro.paqueteId = ''; Retiro.alLeer(String(txt).trim(), pid); return true; }
  const t = String(txt || '').trim().toUpperCase().replace(/^BHC:/, '').replace(/\s/g, '');
  const m = t.match(/^([FV])-?([A-Z0-9]{6,})$/); if (!m) return false;
  const codigo = m[1] + '-' + m[2];
  if (m[1] === 'F'){
    const f = frecuentes().find(x => String(x.codigo).toUpperCase() === codigo);
    if (!f){ hoja('Código desconocido', aviso('danger', 'x', 'Ese pase fijo no existe', 'Puede ser uno viejo que se reemplazó. Consultá con la Administración.')); return true; }
    const v = frecuenteVigente(f), t2 = TIPOS_FREC[f.tipo] || TIPOS_FREC.otro;
    const pr = f.empresa ? aLista(Store.s.proveedores).find(x => normTxt(x.empresa) === normTxt(f.empresa)) : null;
    const art = pr ? artEstado(pr) : null;
    hoja('Ingreso frecuente', `${!v.ok ? aviso('danger', 'x', 'NO HABILITADO HOY', esc(v.motivo)) : v.aviso ? aviso('warn', 'clock', 'Habilitado, con una observación', esc(v.motivo)) : aviso('ok', 'check', 'Habilitado', `${esc(t2.n)} → ${esc(f.destino || 'Barrio')}`)}
      ${art ? aviso(art[1] === 'ok' ? 'ok' : art[1] === 'danger' ? 'danger' : 'warn', 'box', `${esc(pr.empresa)}: ${art[0]}`, '') : ''}
      <div class="card"><b style="font-size:17px">${esc(f.nombre)}</b><div class="muted small">${esc(f.empresa || t2.n)}${f.patente ? ' · ' + esc(f.patente) : ''}</div>${f.nota ? `<p class="small" style="margin:8px 0 0"><b>Nota:</b> ${esc(f.nota)}</p>` : ''}</div>
      ${v.ok ? `<div class="btns"><button class="btn btn-ok grow" data-a="frec-mov" data-id="${f.id}" data-v="in">${I('login')}Registrar ingreso</button><button class="btn btn-sec grow" data-a="frec-mov" data-id="${f.id}" data-v="out">${I('logout')}Registrar salida</button></div>` : ''}`);
    return true;
  }
  const u = Store.s.users.find(x => String(x.credencial || '').toUpperCase() === codigo && x.estado === 'aprobado');
  if (!u){ hoja('Credencial desconocida', aviso('danger', 'x', 'Esa credencial no es válida', 'Puede ser una vieja que el vecino reemplazó. Pedile que la abra de nuevo en la app.')); return true; }
  hoja('Credencial de vecino', `${aviso('ok', 'check', 'Vecino/a del barrio', esc(u.casa))}
    <div class="card" style="display:flex;gap:12px;align-items:center">${u.fotoCasa ? fotoHTML(u.fotoCasa, 'casa-foto chica') : avatar(u)}
      <div><b style="font-size:17px">${esc(u.nombre)}</b><div class="muted small">${esc(u.casa)}${aLista(u.vehiculos).length ? ' · ' + aLista(u.vehiculos).map(v => esc(v.patente)).join(', ') : ''}</div></div></div>
    <p class="muted small">${I('box')} Esta credencial identifica, pero <b>no sirve para entregar paquetes</b>: para eso pedile el QR de retiro de su teléfono (cambia cada 30 segundos).</p>
    <button class="btn btn-pri btn-block" data-a="cerrar-hoja">Listo</button>`);
  setTimeout(() => Fotos.hidratar($('#hojaCuerpo')), 30);
  return true;
}

/* =========================================================
   4. AVISOS URGENTES POR ZONA
   ========================================================= */
const TIPOS_ALERTA = {
  luz:     { n:'Corte de luz', icon:'bolt', c:'warn' },
  agua:    { n:'Corte de agua', icon:'drop', c:'sky' },
  gas:     { n:'Gas', icon:'flame', c:'danger' },
  nieve:   { n:'Nieve o hielo', icon:'snow', c:'sky' },
  porton:  { n:'Portón o acceso', icon:'gate', c:'warn' },
  calle:   { n:'Calle cortada', icon:'alert', c:'warn' },
  clima:   { n:'Alerta meteorológica', icon:'wind', c:'danger' },
  seguridad:{ n:'Seguridad', icon:'shield', c:'danger' },
  incendio:{ n:'Incendio forestal o humo', icon:'flame', c:'danger' },
  otro:    { n:'Otro', icon:'siren', c:'danger' },
};
const zonasBarrio = () => [{ id:'todo', nombre:'Todo el barrio', lotes:'' }, ...aLista(Store.s.config.zonas).filter(z => z && z.nombre)];
const alertas = () => aLista(Store.s.alertas).filter(Boolean).sort((a, b) => b.at - a.at);
const alertaActiva = a => a && !a.cerrada && (!a.hasta || a.hasta > Date.now());
const alertaMeToca = (a, u = yo()) => !!u && alertaActiva(a) && a.por !== u.id && u.rol === 'vecino' && (!aLista(a.lotes).length || aLista(a.lotes).includes(numeroDeLote(u.casa)));
const respuestaDe = (a, u = yo()) => u && a.respuestas ? a.respuestas[u.id] : null;
const alertasParaMi = () => alertas().filter(a => alertaMeToca(a));

R.alertas = {
  titulo:'Avisos urgentes', icon:'siren', color:'danger', ancha:true, sub:'Por zona, con "Recibido" o "Necesito ayuda"',
  render(){
    const u = yo();
    if (!esStaff()){
      const mias = alertas().filter(a => alertaMeToca(a) || (respuestaDe(a) && Date.now() - a.at < 3 * DIA));
      return mias.length ? mias.map(a => tarjetaAlertaVecino(a)).join('') : vacio('check', 'No hay avisos urgentes para tu zona.');
    }
    const act = alertas().filter(alertaActiva), viejas = alertas().filter(a => !alertaActiva(a)).slice(0, 15);
    return `${superficie({ a:'alerta-nueva', icon:'siren', color:'danger', t:'Mandar un aviso urgente', s:'A todo el barrio o a una zona: suena y pide respuesta', cls:'peligro' })}
      ${esAdmin() ? superficie({ a:'zonas-editar', icon:'pin', color:'sky', t:'Zonas del barrio', s:`${plural(zonasBarrio().length - 1, 'zona definida', 'zonas definidas')} · por rango de lotes` }) : ''}
      ${act.length ? sec('Activos') + act.map(tarjetaAlertaStaff).join('') : ''}
      ${viejas.length ? sec('Anteriores') + viejas.map(tarjetaAlertaStaff).join('') : ''}
      ${!act.length && !viejas.length ? vacio('siren', 'Todavía no se mandó ningún aviso urgente.') : ''}`;
  },
};
function destinatariosAlerta(a){
  const lotes = aLista(a.lotes);
  return Store.s.users.filter(u => u.estado === 'aprobado' && u.rol === 'vecino' && (!lotes.length || lotes.includes(numeroDeLote(u.casa))));
}
function tarjetaAlertaStaff(a){
  const t = TIPOS_ALERTA[a.tipo] || TIPOS_ALERTA.otro, dest = destinatariosAlerta(a), rs = a.respuestas || {};
  const ok = dest.filter(u => rs[u.id]?.r === 'ok'), ayuda = dest.filter(u => rs[u.id]?.r === 'ayuda'), sin = dest.filter(u => !rs[u.id]);
  return `<div class="card"><div class="row" style="align-items:flex-start"><span class="ic ic-${t.c}" style="width:40px;height:40px;border-radius:13px;display:grid;place-items:center;flex:none">${I(t.icon)}</span>
      <div class="grow"><b style="font-size:15px">${esc(a.titulo)}</b><div class="muted small">${esc(t.n)} · ${esc(a.zona || 'Todo el barrio')} · ${hace(a.at)}${alertaActiva(a) ? '' : ' · cerrado'}</div></div></div>
    ${a.texto ? `<p class="small" style="margin:8px 0 0;color:var(--ink-2)">${esc(a.texto)}</p>` : ''}
    <div class="garita-kpis" style="margin:10px 0 0"><div class="kpi"><b>${ok.length}</b><span>Recibido</span></div><div class="kpi"><b style="color:var(--danger)">${ayuda.length}</b><span>Piden ayuda</span></div><div class="kpi"><b>${sin.length}</b><span>Sin responder</span></div></div>
    ${ayuda.length ? `<div class="card lista" style="margin:10px 0 0">${ayuda.map(v => `<div class="it"><span class="ic ic-danger" style="width:32px;height:32px;border-radius:10px;display:grid;place-items:center">${I('alert')}</span>
      <div class="txt"><b>${esc(v.casa)} · ${esc(v.nombre)}</b><span>${esc(rs[v.id].nota || 'Sin detalle')} · ${hace(rs[v.id].at)}</span></div>${v.tel ? `<a class="btn btn-xs btn-sec" href="${telLink(v.tel)}">${I('phone')}</a>` : ''}</div>`).join('')}</div>` : ''}
    ${sin.length && sin.length <= 40 ? `<details class="small" style="margin-top:8px"><summary class="muted">Ver quién no respondió (${sin.length})</summary><p style="margin:6px 0 0">${sin.map(v => esc(v.casa)).join(', ')}</p></details>` : ''}
    ${alertaActiva(a) ? `<div class="btns" style="margin-top:10px"><button class="btn btn-xs btn-sec" data-a="alerta-cerrar" data-id="${a.id}">${I('check')}Cerrar el aviso</button></div>` : ''}</div>`;
}
function tarjetaAlertaVecino(a){
  const t = TIPOS_ALERTA[a.tipo] || TIPOS_ALERTA.otro, r = respuestaDe(a);
  return `<div class="card alerta-vecino nv-${r ? 'verde' : 'rojo'}"><div class="row" style="align-items:flex-start"><span class="ic ic-${t.c}" style="width:40px;height:40px;border-radius:13px;display:grid;place-items:center;flex:none">${I(t.icon)}</span>
      <div class="grow"><b style="font-size:15px">${esc(a.titulo)}</b><div class="muted small">${esc(t.n)} · ${esc(a.zona || 'Todo el barrio')} · ${hace(a.at)}</div></div></div>
    ${a.texto ? `<p class="small" style="margin:8px 0 0;color:var(--ink-2)">${esc(a.texto)}</p>` : ''}
    ${r ? `<p class="small" style="margin:10px 0 0"><b>${r.r === 'ayuda' ? '🆘 Pediste ayuda' : '✔ Respondiste: recibido'}</b> · ${hace(r.at)}${r.nota ? ' · ' + esc(r.nota) : ''}</p>` : ''}
    ${alertaActiva(a) ? `<div class="btns" style="margin-top:10px"><button class="btn btn-sm ${r?.r === 'ok' ? 'btn-ok' : 'btn-sec'}" data-a="alerta-responder" data-id="${a.id}" data-v="ok">${I('check')}Recibido</button>
      <button class="btn btn-sm ${r?.r === 'ayuda' ? 'btn-danger' : 'btn-danger-soft'}" data-a="alerta-responder" data-id="${a.id}" data-v="ayuda">${I('alert')}Necesito ayuda</button></div>` : ''}</div>`;
}
A['alerta-nueva'] = () => hoja('Aviso urgente', `<form data-f="alerta">
  <div class="field"><label>¿Qué pasa?</label><select name="tipo" id="alertaTipo">${Object.entries(TIPOS_ALERTA).map(([k, t]) => `<option value="${k}">${t.n}</option>`).join('')}</select></div>
  <div class="field"><label>Título</label><input name="titulo" required maxlength="80" placeholder="Ej: Corte de luz en todo el barrio hasta las 18 h"></div>
  <div class="field"><label>Detalle e indicaciones</label><textarea name="texto" maxlength="600" placeholder="Qué pasa, hasta cuándo y qué hacer."></textarea></div>
  <div class="grid2"><div class="field"><label>¿A quién?</label><select name="zona" id="alertaZona">${zonasBarrio().map(z => `<option value="${esc(z.id)}">${esc(z.nombre)}</option>`).join('')}<option value="lotes">Lotes puntuales…</option></select></div>
    <div class="field"><label>Vigente por</label><select name="horas"><option value="3">3 horas</option><option value="6">6 horas</option><option value="12" selected>12 horas</option><option value="24">24 horas</option><option value="72">3 días</option></select></div></div>
  <div class="field" id="alertaLotesBox" hidden><label>Lotes (ej: 1-40, 75, 133A)</label><input name="lotes" maxlength="200"></div>
  <p class="muted small" style="margin:0 0 12px">A cada vecino de la zona le aparece en pantalla con sonido (y en el celular aunque esté bloqueado, si activó los avisos) y responde <b>Recibido</b> o <b>Necesito ayuda</b>. Acá ves quién respondió qué.</p>
  <button class="btn btn-danger btn-block">${I('siren')}Mandar el aviso</button></form>`);
document.addEventListener('change', e => { if (e.target.id === 'alertaZona'){ const b = $('#alertaLotesBox'); if (b) b.hidden = e.target.value !== 'lotes'; } });
F['alerta'] = d => {
  let lotes = [], zona = 'Todo el barrio';
  if (d.zona === 'lotes'){ lotes = lotesDeTexto(d.lotes); if (!lotes.length){ toast('Escribí al menos un lote válido', 'alert'); return; } zona = 'Lotes ' + (d.lotes || '').trim(); }
  else if (d.zona !== 'todo'){ const z = zonasBarrio().find(x => x.id === d.zona); if (z){ lotes = lotesDeTexto(z.lotes); zona = z.nombre; } }
  const a = { id:'al' + uid(), tipo:d.tipo, titulo:d.titulo.trim(), texto:(d.texto || '').trim(), zona, lotes, at:Date.now(), hasta:Date.now() + (+d.horas || 12) * HORA, por:yo().id, respuestas:{} };
  const dest = destinatariosAlerta(a).map(u => u.id);
  Store.cambiar(s => {
    s.alertas = aLista(s.alertas); s.alertas.unshift(a); if (s.alertas.length > 80) s.alertas.length = 80;
    s.bitacora.unshift({ id:uid(), autor:yo().id, tipo:'novedad', texto:`Aviso urgente (${TIPOS_ALERTA[a.tipo]?.n || ''}) a ${zona}: ${a.titulo}`, at:Date.now() });
  });
  if (typeof Push !== 'undefined' && dest.length) Push.enviar({ para:dest, titulo:'⚠ ' + a.titulo, texto:a.texto || (TIPOS_ALERTA[a.tipo]?.n + ' · ' + zona), link:'alertas', tag:'alerta-' + a.id, urgente:true });
  cerrarHoja(); toast(`Aviso enviado a ${plural(dest.length, 'cuenta')}`, 'siren'); refrescar();
};
A['alerta-responder'] = async el => {
  const r = el.dataset.v, u = yo();
  let nota = '';
  if (r === 'ayuda'){ nota = prompt('¿Qué necesitás? (opcional: la guardia lo lee enseguida)') || ''; }
  Store.cambiar(s => {
    const a = aLista(s.alertas).find(x => x.id === el.dataset.id); if (!a) return;
    a.respuestas = a.respuestas && typeof a.respuestas === 'object' ? a.respuestas : {};
    a.respuestas[u.id] = { r, at:Date.now(), casa:u.casa, nota:nota.trim().slice(0, 200) };
    if (r === 'ayuda') notificar(s, { para:'staff', titulo:`${u.casa} necesita ayuda`, texto:`${a.titulo}${nota ? ' · ' + nota : ''}`, icon:'alert', color:'danger', link:'alertas', urgente:true });
  });
  $('#alertaPantalla')?.remove(); alertaEnPantalla = null;
  toast(r === 'ayuda' ? 'La guardia ya sabe que necesitás ayuda' : 'Gracias: quedó anotado', r === 'ayuda' ? 'alert' : 'check');
  refrescar();
};
A['alerta-cerrar'] = el => { Store.cambiar(s => { const a = aLista(s.alertas).find(x => x.id === el.dataset.id); if (a){ a.cerrada = Date.now(); a.cerradaPor = yo().id; } }); toast('Aviso cerrado', 'check'); };
A['zonas-editar'] = () => {
  const zs = aLista(Store.s.config.zonas);
  hoja('Zonas del barrio', `<form data-f="zonas"><p class="muted small" style="margin:0 0 10px">Cada zona es un nombre y los lotes que abarca (rangos con guion, separados por coma). Sirven para mandar un aviso solo a quien le toca.</p>
    ${[...zs, {}, {}].map((z, i) => `<div class="grid2"><div class="field"><label>Zona ${i + 1}</label><input name="n${i}" maxlength="40" value="${esc(z.nombre || '')}" placeholder="Ej: Calle Los Ñires"></div>
      <div class="field"><label>Lotes</label><input name="l${i}" maxlength="200" value="${esc(z.lotes || '')}" placeholder="1-40, 133A"></div></div>`).join('')}
    <button class="btn btn-pri btn-block">${I('check')}Guardar zonas</button></form>`);
};
F['zonas'] = d => {
  const zs = []; for (let i = 0; i < 40; i++){ if (d['n' + i] && String(d['n' + i]).trim()) zs.push({ id:'z' + i + '-' + normTxt(d['n' + i]).replace(/\W+/g, '').slice(0, 12), nombre:String(d['n' + i]).trim(), lotes:String(d['l' + i] || '').trim() }); }
  Store.cambiar(s => { s.config.zonas = zs; auditar(s, 'Editó las zonas del barrio', `${zs.length} zonas`); });
  cerrarHoja(); toast('Zonas guardadas', 'check'); refrescar();
};
/* El aviso urgente se planta en la pantalla del vecino (como un
   comunicado) hasta que responde. Suena una vez por aviso y por equipo. */
let alertaEnPantalla = null;
function mostrarAlertaUrgente(){
  const u = yo(); if (!u || esStaff()) return;
  const a = alertasParaMi().find(x => !respuestaDe(x));
  const box = $('#alertaPantalla');
  if (!a){ if (box) box.remove(); alertaEnPantalla = null; return; }
  if (alertaEnPantalla === a.id && box) return;
  alertaEnPantalla = a.id;
  let sonadas = []; try { sonadas = JSON.parse(localStorage.getItem('bhc.alertas.sonadas')) || []; } catch(e){}
  if (!sonadas.includes(a.id)){ sonadas.push(a.id); try { localStorage.setItem('bhc.alertas.sonadas', JSON.stringify(sonadas.slice(-40))); } catch(e){}
    Sonido.tocar([[880, 0, .3], [660, .25, .3], [880, .5, .3], [660, .75, .45]], 'square', .12); Sonido.vibrar([300, 120, 300, 120, 300]); }
  const t = TIPOS_ALERTA[a.tipo] || TIPOS_ALERTA.otro;
  const div = box || document.createElement('div');
  div.id = 'alertaPantalla'; div.className = 'comunicado-pantalla alerta-pantalla';
  div.innerHTML = `<div class="comunicado-caja"><div class="comunicado-cab"><span class="ic ic-${t.c}">${I(t.icon)}</span>
      <div><b>Aviso urgente · ${esc(t.n)}</b><span>${esc(a.zona || 'Todo el barrio')} · ${hace(a.at)}</span></div></div>
    <h2>${esc(a.titulo)}</h2>${a.texto ? `<div class="comunicado-texto">${esc(a.texto).replace(/\n/g, '<br>')}</div>` : ''}
    <div class="btns" style="margin-top:16px"><button class="btn btn-ok grow btn-grande" data-a="alerta-responder" data-id="${a.id}" data-v="ok">${I('check')}Recibido</button>
      <button class="btn btn-danger grow btn-grande" data-a="alerta-responder" data-id="${a.id}" data-v="ayuda">${I('alert')}Necesito ayuda</button></div>
    <p class="muted tiny" style="margin:10px 0 0">Tu respuesta la ve la guardia y la Administración.</p></div>`;
  if (!box) document.body.appendChild(div);
}

/* =========================================================
   5. PAQUETES: foto, empresa, hora y confirmación del vecino
   ========================================================= */
A['paquete-nuevo'] = () => hoja('Llegó un paquete', `<form data-f="paquete">
  <div class="field"><label>¿Para qué casa?</label><select name="hostId" required>${opcionesCasas()}</select></div>
  <div class="grid2"><div class="field"><label>Empresa</label><input name="empresa" required maxlength="40" list="empresas" placeholder="Mercado Libre"></div>
    <div class="field"><label>Detalle</label><input name="detalle" maxlength="60" placeholder="Caja chica"></div></div>
  <datalist id="empresas"><option>Mercado Libre</option><option>Correo Argentino</option><option>Andreani</option><option>OCA</option><option>DHL</option><option>Via Cargo</option><option>Farmacia</option><option>Supermercado</option></datalist>
  ${campoFoto('fotoPaq', 'Foto del paquete o de la etiqueta')}
  <button class="btn btn-pri btn-block">${I('box')}Guardar y avisar</button></form>`);
F['paquete'] = d => {
  const foto = fotoParaOtros(d.foto, 14);
  Store.cambiar(s => { s.paquetes.unshift({ id:uid(), hostId:d.hostId, empresa:d.empresa, detalle:d.detalle, foto, recibido:Date.now(), recibidoPor:yo().id, retirado:null, confirmado:null });
    notificar(s, { para:d.hostId, titulo:'Tenés un paquete en la garita', texto:`${d.empresa}${d.detalle ? ' · ' + d.detalle : ''} · llegó ${hora(Date.now())} h · para retirarlo mostrá tu QR de retiro`, icon:'box', color:'wood', link:'mis-paquetes', sonido:true });

    s.bitacora.unshift({ id:uid(), autor:yo().id, tipo:'acceso', texto:`Paquete de ${d.empresa} para ${usuario(d.hostId)?.casa || ''}`, at:Date.now() }); });
  cerrarHoja(); toast('Paquete guardado. El vecino ya sabe.', 'box');
};
/* =========================================================
   5b. RETIRO DE PAQUETES CON QR FIRMADO (pedido de Claudio, 26-09-2026)
   -------------------------------------------------------
   Lo que tiene valor y es de un vecino (un paquete, un sobre, una llave)
   se entrega SOLO contra una prueba de que quien lo retira es él:

   · EL QR DE RETIRO. La primera vez, el teléfono del vecino crea un par de
     llaves (ECDSA P-256, WebCrypto). La PRIVADA queda en ese equipo y no se
     puede sacar de ahí (no exportable, IndexedDB "bhc-llaves"); la PÚBLICA
     va a su ficha (users/<uid>/retiroPubs). El QR dice quién es, la hora y
     de qué equipo, y va FIRMADO con la llave privada. Cambia cada 30
     segundos y vale 90 (margen para relojes corridos): una captura vieja
     no sirve, y cada firma se usa una sola vez.
   · LA GARITA lo lee y verifica la firma con la llave pública. Ni la garita
     ni la Administración pueden fabricar un QR de un vecino: no tienen su
     llave privada. Ve el nombre, el lote y la foto del frente para
     compararlos con la persona, y entrega.
   · QUEDA ASENTADO en el paquete, en la auditoría y en la bitácora: quién
     recibió, quién entregó (y los guardias del turno), cuándo, cómo, y un
     sello SHA-256 de todo eso. Al vecino le llega "Retiraste tu paquete":
     si no fue él, se entera al instante.
   · SIN TELÉFONO: firma en la pantalla de la garita + DNI. Se compara con el
     DNI de la cuenta; si retira otra persona, queda como "retiro por un
     tercero" y el vecino recibe el aviso. Del DNI se guardan solo los tres
     últimos números.
   Es una firma electrónica (Ley 25.506, art. 5): un medio de prueba fuerte,
   no una "firma digital" con certificado.
   ========================================================= */
const b64u = buf => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const deB64u = s => Uint8Array.from(atob(String(s).replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((String(s).length + 3) % 4)), c => c.charCodeAt(0));
const Retiro = {
  VALE: 90, PASO: 30,
  base: null,
  abrir(){
    return this.base = this.base || new Promise(ok => {
      try { const r = indexedDB.open('bhc-llaves', 1); r.onupgradeneeded = () => r.result.createObjectStore('k'); r.onsuccess = () => ok(r.result); r.onerror = () => ok(null); }
      catch(e){ ok(null); }
    });
  },
  async leer(id){ const db = await this.abrir(); if (!db) return null;
    return new Promise(ok => { const q = db.transaction('k').objectStore('k').get(id); q.onsuccess = () => ok(q.result || null); q.onerror = () => ok(null); }); },
  async poner(id, v){ const db = await this.abrir(); if (!db) return;
    await new Promise(ok => { const t = db.transaction('k', 'readwrite'); t.objectStore('k').put(v, id); t.oncomplete = ok; t.onerror = ok; }); },
  /* Al cerrar sesión la llave se borra: en ese equipo ya no se puede retirar. */
  async olvidar(){ try { const db = await this.abrir(); if (db) db.close(); } catch(e){} this.base = null; try { indexedDB.deleteDatabase('bhc-llaves'); } catch(e){} },
  equipo(){ const ua = navigator.userAgent; return /iPhone/.test(ua) ? 'iPhone' : /iPad/.test(ua) ? 'iPad' : /Android/.test(ua) ? (/Mobile/.test(ua) ? 'Celular Android' : 'Tablet Android') : 'Computadora'; },
  /* La llave de este equipo para quien está adentro (la crea la primera vez)
     y su parte pública publicada en la ficha. */
  async llave(){
    const u = yo(); if (!u) throw new Error('Tenés que entrar con tu cuenta');
    if (!window.crypto || !crypto.subtle) throw new Error('Este navegador no puede firmar (hace falta https)');
    let r = await this.leer(u.id);
    if (!r){
      const par = await crypto.subtle.generateKey({ name:'ECDSA', namedCurve:'P-256' }, false, ['sign', 'verify']);
      const j = await crypto.subtle.exportKey('jwk', par.publicKey);
      r = { id:'e' + uid().replace(/[^a-z0-9]/gi, '').slice(-7), priv:par.privateKey, pub:{ kty:j.kty, crv:j.crv, x:j.x, y:j.y }, at:Date.now() };
      await this.poner(u.id, r);
    }
    const ya = (yo().retiroPubs || {})[r.id];
    if (!ya || ya.x !== r.pub.x) Store.cambiar(s => { const x = s.users.find(z => z.id === u.id); if (!x) return;
      const pubs = Object.assign({}, x.retiroPubs || {}); pubs[r.id] = { ...r.pub, at:r.at, equipo:this.equipo() };
      /* hasta cuatro equipos por persona: el más viejo se cae */
      Object.keys(pubs).sort((a, b) => (pubs[b].at || 0) - (pubs[a].at || 0)).slice(4).forEach(k => delete pubs[k]);
      x.retiroPubs = pubs; });
    return r;
  },
  async codigo(){
    const r = await this.llave(), u = yo(), ts = Math.floor(Date.now() / 1000);
    const firma = await crypto.subtle.sign({ name:'ECDSA', hash:'SHA-256' }, r.priv, new TextEncoder().encode(`BHR1|${u.id}|${ts}|${r.id}`));
    return `BHR1.${u.id}.${ts.toString(36)}.${r.id}.${b64u(firma)}`;
  },
  usados: new Set(),
  yaUsada(firma){ return this.usados.has(firma) || Store.s.paquetes.some(p => p.entrega && p.entrega.qr && p.entrega.qr.firma === firma); },
  async verificar(txt){
    const m = String(txt || '').trim().match(/^BHR1\.([^.]+)\.([0-9a-z]+)\.([^.]+)\.([A-Za-z0-9_-]+)$/);
    if (!m) return { ok:false, motivo:'No es un QR de retiro del barrio.' };
    const [, uidV, ts36, eq, firma] = m, ts = parseInt(ts36, 36), u = Store.s.users.find(x => x.id === uidV && x.estado === 'aprobado');
    if (!u) return { ok:false, motivo:'Ese QR no es de ningún vecino con cuenta aprobada.' };
    const pub = (u.retiroPubs || {})[eq];
    if (!pub) return { ok:false, u, motivo:`El teléfono que muestra el QR no está habilitado para retirar a nombre de ${u.nombre}. Si lo dio de baja o cambió de teléfono, que abra de nuevo "Mi QR para retirar" en su teléfono.` };
    const edad = Math.abs(Date.now() / 1000 - ts);
    if (edad > this.VALE) return { ok:false, u, motivo:'El QR está vencido (dura 30 segundos). Pedile que lo muestre de nuevo en su teléfono: se renueva solo. Una captura de pantalla no sirve.' };
    if (this.yaUsada(firma)) return { ok:false, u, motivo:'Ese QR ya se usó para una entrega. Pedile que muestre el nuevo.' };
    try {
      const k = await crypto.subtle.importKey('jwk', { kty:pub.kty, crv:pub.crv, x:pub.x, y:pub.y, ext:true }, { name:'ECDSA', namedCurve:'P-256' }, false, ['verify']);
      const bien = await crypto.subtle.verify({ name:'ECDSA', hash:'SHA-256' }, k, deB64u(firma), new TextEncoder().encode(`BHR1|${uidV}|${ts}|${eq}`));
      if (!bien) return { ok:false, u, motivo:'La firma del QR no coincide: no salió del teléfono de ese vecino. No entregues.' };
    } catch(e){ return { ok:false, u, motivo:'No se pudo verificar la firma: ' + e.message }; }
    return { ok:true, u, ts, equipo:eq, equipoNombre:pub.equipo || '', firma };
  },
  /* Los paquetes que puede retirar esa persona: los de su lote. */
  pendientesDe(u){ const casa = u && u.casa; return Store.s.paquetes.filter(p => !p.retirado && (p.hostId === u.id || usuario(p.hostId)?.casa === casa)).sort((a, b) => a.recibido - b.recibido); },
  /* La garita leyó un QR de retiro. */
  async alLeer(txt, paqueteId = ''){
    if (!esGuardia() && !esAdmin()){ toast('Solo la garita o la Administración entregan paquetes', 'lock'); return; }
    const v = await this.verificar(txt);
    if (!v.ok){ hoja('QR de retiro', `${aviso('danger', 'x', 'NO ENTREGAR', esc(v.motivo))}
      ${v.u ? `<div class="card plana small">${I('user')} El QR dice ser de <b>${esc(v.u.nombre)}</b> · ${esc(v.u.casa)}. Si es esa persona y no le anda el teléfono, usá "Sin teléfono: firma y DNI".</div>` : ''}
      <button class="btn btn-sec btn-block" data-a="escanear" data-v="Apuntá al QR de retiro del vecino (cambia cada 30 segundos)">${I('scan')}Leer de nuevo</button>`); return; }
    this.usados.add(v.firma);
    const u = v.u, paq = this.pendientesDe(u);
    this.leido = { ...v, uid:u.id };
    hoja('Retiro de paquetes', `${aviso('ok', 'check', 'QR válido y firmado', `Salió del ${esc(v.equipoNombre || 'teléfono')} de ${esc(u.nombre)} hace ${Math.max(0, Math.round(Date.now() / 1000 - v.ts))} s.`)}
      <div class="retiro-quien">${u.fotoCasa ? fotoHTML(u.fotoCasa, 'casa-foto chica') : avatar(u, 'lg')}
        <div><b>${esc(u.nombre)}</b><span>${esc(u.casa)}</span><small>Compará con la persona que tenés enfrente.</small></div></div>
      ${paq.length ? `<form data-f="retiro-qr">${sec(`Paquetes de ${esc(u.casa)} (${paq.length})`)}
        <div class="card lista">${paq.map(p => `<label class="it ci-fila"><input type="checkbox" name="p~${esc(p.id)}" ${!paqueteId || p.id === paqueteId ? 'checked' : ''}>
          <div class="txt"><b>${esc(p.empresa)}${p.detalle ? ' · ' + esc(p.detalle) : ''}</b><span>Para ${esc(nombreDe(p.hostId))} · llegó ${hace(p.recibido)}</span></div></label>`).join('')}</div>
        <button class="btn btn-ok btn-block btn-grande" style="margin-top:10px">${I('check')}Entregar los tildados</button></form>`
        : vacio('box', `${esc(u.casa)} no tiene paquetes en la garita.`)}`);
    setTimeout(() => Fotos.hidratar($('#hojaCuerpo')), 30);
  },
  /* Lo que queda asentado de una entrega, con su sello. */
  async entregar(ids, recibe, prueba){
    const guardias = typeof turnoAbierto === 'function' && turnoAbierto() ? aLista(turnoAbierto().guardias) : [];
    const at = Date.now(), entrega = { uid:yo().id, nombre:yo().nombre, guardias };
    const registro = { paquetes:ids.slice().sort(), recibe, entrega, at, prueba };
    const sello_ = await sello(registro);
    let casa = '';
    Store.cambiar(s => {
      ids.forEach(id => { const p = s.paquetes.find(x => x.id === id); if (!p || p.retirado) return;
        casa = usuario(p.hostId)?.casa || casa;
        p.retirado = at; p.entregadoPor = yo().id; p.confirmado = at;
        p.entrega = { metodo:prueba.metodo, recibe, entrega, at, sello:sello_, ...(prueba.metodo === 'qr' ? { qr:{ ts:prueba.ts, equipo:prueba.equipo, firma:prueba.firma } } : { firma:prueba.firma, dniFin:prueba.dniFin, dniVerificado:prueba.dniVerificado, tercero:!!prueba.tercero }) };
        const aviso_ = prueba.tercero || (recibe.uid && recibe.uid !== p.hostId) ? `${recibe.nombre} retiró tu paquete` : 'Retiraste tu paquete';

        notificar(s, { para:p.hostId, titulo:aviso_, texto:`${p.empresa} · ${hora(at)} h · lo entregó la garita${prueba.metodo === 'qr' ? ' contra tu QR' : ' con firma y DNI'}. Si no fuiste vos, avisá enseguida.`, icon:'box', color: prueba.tercero ? 'warn' : 'ok', link:'mis-paquetes', sonido:true });
      });
      const quien = `${recibe.nombre}${prueba.tercero ? ' (tercero)' : ''}`;
      auditar(s, 'Entregó paquetes', `${casa} · ${plural(ids.length, 'paquete')} · recibió ${quien} · entregó ${yo().nombre}${guardias.length ? ' (' + guardias.join(', ') + ')' : ''} · ${prueba.metodo === 'qr' ? 'QR firmado' : 'firma + DNI ***' + prueba.dniFin} · sello ${sello_.slice(0, 16)}`, ids[0]);
      s.bitacora.unshift({ id:uid(), autor:yo().id, tipo:'acceso', texto:`Entrega de ${plural(ids.length, 'paquete')} a ${quien} · ${casa} · ${prueba.metodo === 'qr' ? 'QR firmado' : 'firma y DNI'}`, at });
    });
    return sello_;
  },
};
F['retiro-qr'] = async d => {
  const l = Retiro.leido; if (!l){ toast('Leé de nuevo el QR', 'alert'); return; }
  const ids = Object.keys(d).filter(k => k.startsWith('p~')).map(k => k.slice(2));
  if (!ids.length){ toast('Tildá al menos un paquete', 'alert'); return; }
  if (Date.now() / 1000 - l.ts > 600){ toast('Pasaron más de 10 minutos desde que leíste el QR: leelo de nuevo', 'alert'); return; }
  const u = usuario(l.uid);
  const s_ = await Retiro.entregar(ids, { uid:u.id, nombre:u.nombre, lote:u.casa }, { metodo:'qr', ts:l.ts, equipo:l.equipo, firma:l.firma });
  Retiro.leido = null; cerrarHoja();
  toast(`Entregado a ${u.nombre}. Sello ${s_.slice(0, 8)}…`, 'check');
};
/* "Entregar" en un paquete de la lista de la garita. */
A['paquete-entregar'] = el => {
  const p = Store.s.paquetes.find(x => x.id === el.dataset.id); if (!p) return;
  hoja(`Entregar · ${esc(usuario(p.hostId)?.casa || '')}`, `<div class="card plana small">${I('box')} ${esc(p.empresa)}${p.detalle ? ' · ' + esc(p.detalle) : ''} · para ${esc(nombreDe(p.hostId))}</div>
    <button class="btn btn-pri btn-block btn-grande" data-a="retiro-escanear" data-id="${p.id}">${I('scan')}Leer el QR de retiro del vecino</button>
    <button class="btn btn-sec btn-block" style="margin-top:8px" data-a="retiro-manual" data-id="${p.id}">${I('edit')}Sin teléfono: firma y DNI</button>
    <p class="muted tiny" style="margin-top:10px">El QR de retiro cambia cada 30 segundos y solo sale del teléfono del vecino: es la prueba de que se lo entregaste a él. La credencial fija NO sirve para esto.</p>`);
};
A['paquete-entregado'] = A['paquete-entregar'];
A['retiro-escanear'] = el => { Retiro.paqueteId = el.dataset.id || ''; A['escanear']({ dataset:{ v:'Apuntá al QR de retiro del vecino (cambia cada 30 segundos)' } }); };
/* Sin teléfono: firma en la pantalla de la garita + DNI. */
A['retiro-manual'] = el => {
  const p = Store.s.paquetes.find(x => x.id === el.dataset.id); if (!p) return;
  const casa = usuario(p.hostId)?.casa || '', cuentas = Store.s.users.filter(u => u.estado === 'aprobado' && u.casa === casa && casa);
  hoja('Retiro sin teléfono', `<form data-f="retiro-manual" data-id="${p.id}">
    <div class="card plana small">${I('box')} ${esc(p.empresa)} · ${esc(casa)}</div>
    <div class="field"><label>¿Quién lo retira?</label><select name="quien" required>${cuentas.map(u => `<option value="${esc(u.id)}" ${u.id === p.hostId ? 'selected' : ''}>${esc(u.nombre)}</option>`).join('')}<option value="tercero">Otra persona (familiar, empleado…)</option></select></div>
    <div class="field"><label>Nombre y apellido (si es otra persona)</label><input name="nombre" maxlength="60" placeholder="Como figura en el DNI"></div>
    <div class="field"><label>DNI de quien retira</label><input name="dni" required inputmode="numeric" maxlength="11" placeholder="Solo números"><div class="ayuda">Se compara con el de la cuenta. Se guardan solo los tres últimos números.</div></div>
    <div class="field"><label>Firma de quien retira</label>${firmaHTML('firmaRetiro')}</div>
    <button class="btn btn-ok btn-block btn-grande">${I('check')}Entregar</button></form>`);
  setTimeout(() => iniciarFirma('firmaRetiro'), 60);
};
F['retiro-manual'] = async (d, form) => {
  const p = Store.s.paquetes.find(x => x.id === form.dataset.id); if (!p) return;
  const firma = leerFirma('firmaRetiro'); if (!firma){ toast('Falta la firma de quien retira', 'alert'); return; }
  const dni = soloDigitos(d.dni); if (dni.length < 7){ toast('El DNI tiene que tener al menos 7 números', 'alert'); return; }
  const tercero = d.quien === 'tercero', u = tercero ? null : usuario(d.quien);
  if (tercero && String(d.nombre || '').trim().length < 4){ toast('Escribí el nombre y apellido de quien retira', 'alert'); return; }
  let verificado = false;
  if (u && u.dni){ if (soloDigitos(u.dni) !== dni){ toast(`El DNI no coincide con el de ${u.nombre}. No entregues.`, 'alert'); return; } verificado = true; }
  const recibe = tercero ? { nombre:String(d.nombre).trim(), lote:usuario(p.hostId)?.casa || '' } : { uid:u.id, nombre:u.nombre, lote:u.casa };
  const s_ = await Retiro.entregar([p.id], recibe, { metodo:'firma', firma, dniFin:dni.slice(-3), dniVerificado:verificado, tercero });
  cerrarHoja(); toast(`Entregado a ${recibe.nombre}${tercero ? ' (tercero: el vecino recibe el aviso)' : ''}. Sello ${s_.slice(0, 8)}…`, 'check');
};
/* EL VECINO: su QR de retiro, que se renueva solo cada 30 segundos. Si la
   garita le entrega mientras lo mira, se cierra solo y lo festeja. */
A['retiro-qr'] = async () => {
  const u = yo(); if (!u) return;
  const antes = Retiro.pendientesDe(u).length;
  hoja('Mi QR para retirar', `<div class="retiro-qr">
      <div class="retiro-qr-caja" id="retiroQR"><p class="muted small center" style="margin:40px 0">Preparando tu QR…</p></div>
      <div class="retiro-reloj"><i id="retiroBarra"></i></div>
      <b>${esc(u.nombre)}</b><span>${esc(u.casa)}${antes ? ` · ${plural(antes, 'paquete')} en la garita` : ''}</span></div>
    <p class="muted small" style="margin:12px 2px 0">${I('lock')} Mostralo en la garita desde tu teléfono. <b>Cambia cada 30 segundos</b> y va firmado por este equipo: una foto o una captura no sirven. No lo mandes por WhatsApp.</p>
    <button class="link" data-a="retiro-equipos" style="margin-top:6px">Mis teléfonos habilitados</button>`, { ancho:'420px' });
  const d = $('#hoja');
  let vivo = true; d.addEventListener('close', () => { vivo = false; }, { once:true });
  const pintar_ = async () => {
    if (!vivo || !d.open) return;
    try { const c = await Retiro.codigo(); const el = $('#retiroQR'); if (el) await pintarQR(el, c); }
    catch(e){ const el = $('#retiroQR'); if (el) el.innerHTML = `<p class="small center" style="margin:30px 8px;color:var(--danger)">${esc(e.message)}</p>`; return; }
    const b = $('#retiroBarra'); if (b){ b.style.transition = 'none'; b.style.width = '100%'; void b.offsetWidth; b.style.transition = `width ${Retiro.PASO}s linear`; b.style.width = '0%'; }
    setTimeout(pintar_, Retiro.PASO * 1000);
  };
  pintar_();
  const mirar = setInterval(() => {
    if (!vivo || !d.open){ clearInterval(mirar); return; }
    const ahora = Retiro.pendientesDe(yo()).length;
    if (ahora < antes){ clearInterval(mirar); cerrarHoja();
      hoja('¡Listo!', `<div class="pago-ok">${I('box')}<b>${plural(antes - ahora, 'paquete retirado', 'paquetes retirados')}</b><span>Quedó asentado con tu QR firmado</span></div>`, { ancho:'380px' });
      setTimeout(() => { if ($('#hoja .pago-ok')) cerrarHoja(); }, 3000); }
  }, 1500);
};
A['retiro-equipos'] = () => {
  const u = yo(), pubs = Object.entries(u.retiroPubs || {}).sort((a, b) => (b[1].at || 0) - (a[1].at || 0));
  hoja('Teléfonos habilitados para retirar', `<p class="muted small" style="margin-top:0">Cada equipo donde abriste tu QR de retiro. Si perdiste uno o lo cambiaste, sacalo: su QR deja de valer en la garita.</p>
    <div class="card lista">${pubs.map(([k, x]) => `<div class="it"><span class="ic ic-brand" style="width:34px;height:34px;border-radius:11px;display:grid;place-items:center">${I('smartphone')}</span>
      <div class="txt"><b>${esc(x.equipo || 'Equipo')}</b><span>Habilitado ${x.at ? fechaCorta(isoDe(new Date(x.at))) : ''}</span></div>
      <button class="btn btn-xs btn-danger-soft" data-a="retiro-quitar" data-v="${esc(k)}">Quitar</button></div>`).join('') || '<p class="muted small" style="margin:6px 0">Todavía ninguno.</p>'}</div>`);
};
A['retiro-quitar'] = async el => {
  if (!await confirmar('Quitar este equipo', 'Su QR de retiro deja de valer en la garita.', { si:'Quitar', peligro:true })) return;
  const k = el.dataset.v, u = yo();
  Store.cambiar(s => { const x = s.users.find(z => z.id === u.id); if (!x || !x.retiroPubs) return; const p = Object.assign({}, x.retiroPubs); delete p[k]; x.retiroPubs = p; auditar(s, 'Quitó un equipo para retirar paquetes', k); });
  const r = await Retiro.leer(u.id); if (r && r.id === k) await Retiro.olvidar();
  A['retiro-equipos']();
};
A['paquete-confirmar'] = el => {
  Store.cambiar(s => { const p = s.paquetes.find(x => x.id === el.dataset.id); if (!p) return;
    p.confirmado = Date.now(); if (!p.retirado) p.retirado = p.confirmado;
    notificar(s, { para:'rol:guardia', titulo:`${yo().casa} confirmó que retiró su paquete`, texto:p.empresa, icon:'box', color:'ok' }); });
  toast('Gracias: quedó confirmado', 'check');
};
R['mis-paquetes'] = {
  titulo:'Tus paquetes', icon:'box', color:'wood', sub:'Lo que llegó a la garita a tu nombre',
  render(){
    const u = yo(), ls = Store.s.paquetes.filter(p => p.hostId === u.id).sort((a, b) => b.recibido - a.recibido).slice(0, 40);
    const enGarita = Retiro.pendientesDe(u), viejos = ls.filter(p => p.retirado && !p.confirmado), listos = ls.filter(p => p.confirmado);
    const como = p => !p.entrega ? '' : p.entrega.metodo === 'qr' ? ' · con tu QR firmado' : p.entrega.tercero ? ` · lo retiró ${esc(p.entrega.recibe?.nombre || 'otra persona')}` : ' · con firma y DNI';
    return `${enGarita.length ? `<button class="retiro-cta" data-a="retiro-qr">${I('qr')}<span><b>Mi QR para retirar</b><small>${plural(enGarita.length, 'paquete')} en la garita · mostralo desde tu teléfono</small></span>${I('right')}</button>` : ''}
      ${!ls.length && !enGarita.length ? vacio('box', 'No te llegó ningún paquete todavía.') : ''}
      ${enGarita.length ? sec('En la garita') : ''}
      ${enGarita.map(p => `<div class="card"><div class="row"><span class="ic ic-wood" style="width:40px;height:40px;border-radius:13px;display:grid;place-items:center">${I('box')}</span>
        <div class="grow"><b>${esc(p.empresa)}${p.detalle ? ' · ' + esc(p.detalle) : ''}</b><div class="muted small">Llegó ${fechaCorta(isoDe(new Date(p.recibido)))} ${hora(p.recibido)} h${p.hostId !== u.id ? ' · a nombre de ' + esc(nombreDe(p.hostId)) : ''}</div></div></div>
        ${fotoHTML(p.foto, 'post-foto')}</div>`).join('')}
      ${viejos.length ? sec('Entregados sin confirmar') + viejos.map(p => `<div class="card"><b>${esc(p.empresa)}</b><div class="muted small">La garita lo entregó ${hace(p.retirado)}</div>
        <div class="btns" style="margin-top:8px"><button class="btn btn-sm btn-ok" data-a="paquete-confirmar" data-id="${p.id}">${I('check')}Confirmo que lo recibí</button></div></div>`).join('') : ''}
      ${listos.length ? sec('Ya retirados') + `<div class="card lista">${listos.map(p => `<div class="it"><div class="txt"><b>${esc(p.empresa)}</b><span>Llegó ${fechaCorta(isoDe(new Date(p.recibido)))} · retirado ${hace(p.confirmado)}${como(p)}</span></div>${p.entrega && p.entrega.sello ? `<span class="pill p-ok" title="Sello ${esc(p.entrega.sello)}">${I('lock')}sellado</span>` : ''}</div>`).join('')}</div>` : ''}
      <p class="muted tiny" style="margin-top:12px">${I('lock')} La garita entrega tus paquetes solo contra tu QR de retiro (cambia cada 30 segundos y sale únicamente de tu teléfono) o, si no tenés el teléfono, con tu firma y tu DNI. Cada entrega queda en la auditoría con un sello.</p>`;
  },
};

/* =========================================================
   6. SERVICIOS DE USHUAIA: atajos a la Municipalidad
   Direcciones verificadas en el sitio oficial (ushuaia.gob.ar) el
   24-09-2026 y otra vez el 25-09-2026, una por una. Se sacaron las que
   no llevaban a su página: "Turnos" terminaba en el ingreso a la
   Ventanilla Digital (el mismo lugar que la teja de la Ventanilla) y
   "Guía de servicios" era solo un índice de las demás. Queda solo lo que
   abre directo lo que dice. Si alguna cambia, se corrige acá.
   ========================================================= */
const MUNICIPIO = [
  ['Trámites en línea', 'Requisitos de cada trámite y cómo iniciarlo', 'https://tramites.ushuaia.gob.ar/', 'file', 'brand'],
  ['Atención al vecino', 'Formulario de reclamos: alumbrado, calles, baches', 'https://www.ushuaia.gob.ar/atencion-vecino', 'clipboard', 'warn'],
  ['Ventanilla digital', 'Ingresás con tu DNI: presentaciones y turnos', 'https://ventanilla.ushuaia.gob.ar/', 'send', 'sky'],
  ['Autogestión y tasas', 'Imprimir boletas de inmuebles, autos y comercios', 'https://www.ushuaia.gob.ar/autogestion', 'wallet', 'wood'],
  ['Defensa Civil', 'Emergencias, nieve, incendios · teléfono 103', 'https://www.ushuaia.gob.ar/defensa-civil', 'siren', 'danger'],
  ['Farmacias de turno', 'Las de hoy, al día', 'https://www.ushuaia.gob.ar/farmacias-de-turno', 'heart', 'danger'],
  ['Cuándo llega el colectivo', 'Mi Bondi: el colectivo en tiempo real', 'https://www.ushuaia.gob.ar/mi-bondi', 'car', 'sky'],
  ['Zoonosis', 'Castraciones, vacunas y mascotas', 'https://www.ushuaia.gob.ar/zoonosis', 'paw', 'ok'],
  ['Juzgado de Faltas', 'Multas y actas de tránsito', 'https://www.ushuaia.gob.ar/juzgado-faltas', 'alert', 'warn'],
  ['Rentas', 'Dirección General de Rentas', 'https://www.ushuaia.gob.ar/rentas', 'file', 'brand'],
];
R.municipio = {
  titulo:'Municipalidad de Ushuaia', icon:'pin', color:'sky', ancha:true, sub:'Trámites, reclamos urbanos y servicios',
  render(){
    return `<p class="muted small" style="margin:0 0 12px">Atajos al sitio oficial de la Municipalidad. Lo que es del barrio (reclamos internos, la garita, las expensas, la recolección de residuos que hace la empresa contratada) sigue siendo por la app.</p>
      <div class="mosaico">${MUNICIPIO.map(([t, x, url, icon, color]) => teja({ a:'link', v:url, icon, color, t, s:x })).join('')}</div>
      <p class="muted tiny" style="margin-top:12px">Cada teja abre la página oficial en una pestaña aparte; la app queda abierta atrás.</p>`;
  },
};

/* Reservas: recordatorio y cierre (la regla va acá porque el motor de
   reglas, REGLAS, se define en admin.js, que carga después de v-gestion.js). */
REGLAS.push({ id:'reservas-recordatorio', n:'Reservas → recordatorio la víspera y "¿cómo quedó?" al terminar', d:'El día anterior (desde las 12) recuerda el turno con el reglamento; al terminar, pide que cuenten cómo quedó el espacio.',
  run(s, hoy){ let n = 0; const man = sumarDias(hoy, 1);
    s.reservas.filter(r => !r.cancelada).forEach(r => { const am = amenity(r.amenity); if (!am) return;
      if (r.fecha === man && new Date().getHours() >= 12) n += marca(s, 'res-rec-' + r.id, () => notificar(s, { para:r.userId, titulo:`Mañana tenés el ${am.nombre}`, texto:`${am.franjas[r.franja].join(' a ')} h${r.deposito && r.depositoEstado === 'pendiente' ? ' · acordate del depósito de ' + plata(r.deposito) : ''}. ${am.reglas || ''}`.slice(0, 180), icon:am.icon || 'calendar', color:'ok', link:'reservas' }));
      if (!r.cierre && reservaTermino(r) && r.fecha >= sumarDias(hoy, -2)) n += marca(s, 'res-fin-' + r.id, () => notificar(s, { para:r.userId, titulo:`¿Cómo quedó el ${am.nombre}?`, texto:'Contanos en un toque si quedó bien o si hubo daños o faltantes.', icon:am.icon || 'calendar', color:'sky', link:'reservas' }));
    }); return n; } });

/* Todo lo que tiene que revisarse después de cada dibujo o cada tanto. */
const Servicio = {
  despues(){ Camion.revisar(); mostrarAlertaUrgente(); },
  arrancar(){ Camion.arrancar(); setInterval(() => { try { mostrarAlertaUrgente(); } catch(e){} }, 6000); },
};
