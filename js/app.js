/* =========================================================
   Gestor de ventanas, arranque y lo que es de toda la app
   (bienvenida, avisos, SOS, tema).

   La navegación es una PILA de ventanas, como en ASHA:
     abrir('reservas')      apila una ventana a la derecha
     volverA(i)             vuelve a la ventana i (cierra las de la derecha)
     cerrarVentana()        cierra la última (también el Atrás del celular)
   Cada ventana se declara en R: { titulo, sub, icon, color, ancha, render(param) }.

   Las ventanas de atrás quedan como LOMOS en el lateral izquierdo: se ve de
   qué son y se vuelve tocándolos. Además, toda ventana apilada tiene una
   flecha "Volver" en su cabecera, y en el celular se puede volver con un
   deslizamiento desde el borde izquierdo.
   ========================================================= */
const PILA = [];
let ventanaNueva = false;

/* La profundidad de la pila se refleja en el historial del navegador para que
   el botón Atrás del celular cierre la última ventana en vez de salir de la
   app. Se sincroniza siempre contra PILA.length: nunca se confía en que el
   estado del historial exista (en la PWA puede venir vacío). */
function sincronizarHistorial(){
  const n = PILA.length;
  const actual = (history.state && history.state.n) || 0;
  if (actual === n) return;
  if (actual === 0) history.replaceState({ n }, '');
  else if (n > actual) for (let i = actual; i < n; i++) history.pushState({ n:i + 1 }, '');
}

/* =========================================================
   LA GARITA VE SOLO LO SUYO
   La cuenta de la garita no es un vecino ni la Administración: tiene su
   propia lista de ventanas. Lo que no está acá (expensas, contabilidad,
   votaciones, reservas, mensajes entre vecinos, los datos de un lote…)
   no se abre desde la garita, ni por un enlace ni por un aviso.
   Y antes de trabajar, cada turno se anota: hasta que no dice quiénes
   están de guardia, la única ventana es la de abrir el turno.
   ========================================================= */
const VENTANAS_GARITA = new Set(['garita', 'bitacora', 'turnos', 'peticiones', 'privado', 'vecinos', 'pizarron', 'chat',
  'obras', 'proveedores', 'agenda', 'emergencias', 'cruceros', 'vuelos', 'recoleccion', 'ushuaia', 'documentos', 'sismos', 'frecuentes', 'alertas', 'municipio', 'legal', 'ayuda']);
const ventanaPermitida = id => !esGuardia() || (VENTANAS_GARITA.has(id) && (id === 'garita' || turnoListo()));
function abrir(id, param = ''){
  if (!R[id]){ console.warn('Ventana desconocida:', id); toast('Esa sección todavía no está disponible', 'alert'); return; }
  if (!ventanaPermitida(id)){ toast(VENTANAS_GARITA.has(id) ? 'Primero anotá quiénes están de turno' : 'Esa sección no es de la garita', 'lock'); return; }
  /* Una ventana nunca se abre DEBAJO de una hoja: antes, tocar un aviso en
     la pizarra abría la ventana detrás y la hoja la seguía tapando. Si la
     hoja era la pizarra, se anota para volver a ella al cerrar la ventana.
     Va antes de mirar si la ventana ya estaba abierta: si no, un aviso que
     lleva a una ventana de atrás (la portada) cerraba la pizarra, la volvía
     a abrir y parecía que "destellaba" sin hacer nada. */
  const alVolver = typeof Pizarra !== 'undefined' && Pizarra.volver ? 'pizarra' : '';
  if (typeof Pizarra !== 'undefined') Pizarra.volver = false;
  if (hojaAbierta()) cerrarHoja();
  const ya = PILA.findIndex(v => v.id === id);
  if (ya >= 0){
    PILA[ya].param = param;
    const cerrar = PILA.length - 1 - ya;
    PILA.length = ya + 1;
    if (cerrar > 0){ saltando = true; history.go(-cerrar); }
    pintar();
    return;
  }
  guardarScroll();
  PILA.push({ id, param, alVolver });
  history.pushState({ n: PILA.length }, '');
  ventanaNueva = true;
  pintar();
}
let saltando = false;
function volverA(i){
  const cerrar = PILA.length - 1 - i;
  if (cerrar <= 0){ $('#cuerpo')?.scrollTo({ top:0, behavior:'smooth' }); return; }
  const top = PILA[PILA.length - 1];
  PILA.length = i + 1;
  saltando = true;
  history.go(-cerrar);
  pintar();
  if (cerrar === 1) volverALaPizarra(top);
}
/* Si la ventana que se cierra se abrió desde la pizarra, se vuelve a la
   pizarra abierta, para seguir leyendo donde se estaba. */
function volverALaPizarra(cerrada){
  if (cerrada && cerrada.alVolver === 'pizarra' && typeof A['pizarra-toda'] === 'function') setTimeout(() => A['pizarra-toda'](), 60);
}
/* =========================================================
   VOLVER AL MISMO LUGAR
   Al abrir una ventana se anota por dónde iba la de atrás; al volver, la
   app la deja exactamente ahí. Antes, entrar a "Tu casa" desde "Por dónde
   seguir" y volver tiraba a la persona arriba de todo, a la foto.
   ========================================================= */
function guardarScroll(){
  const top = PILA[PILA.length - 1], c = $('#cuerpo');
  if (top && c) top.scroll = Math.max(c.scrollTop, document.scrollingElement?.scrollTop || 0);
}
let scrollPendiente = null;
function reponerScroll(){
  const y = scrollPendiente; scrollPendiente = null;
  if (y == null) return;
  const poner = () => { const c = $('#cuerpo'); if (c) c.scrollTop = y; if (document.scrollingElement) document.scrollingElement.scrollTop = y; };
  poner(); requestAnimationFrame(poner); setTimeout(poner, 120);
}
function cerrarVentana(){ if (PILA.length > 1) volverA(PILA.length - 2); }
window.addEventListener('popstate', e => {
  if (saltando){ saltando = false; return; }
  const d = $('#hoja');
  if (d && d.open){ d.close(); history.pushState({ n: PILA.length }, ''); return; }
  const n = (e.state && e.state.n) || 1;
  if (PILA.length > n){ const top = PILA[PILA.length - 1], una = PILA.length - Math.max(1, n) === 1; PILA.length = Math.max(1, n); pintar(); if (una) volverALaPizarra(top); }
  else sincronizarHistorial();
});

/* Deslizar desde el borde izquierdo vuelve atrás, como en el sistema. */
let gesto = null;
document.addEventListener('touchstart', e => {
  const t = e.touches[0];
  gesto = (PILA.length > 1 && t.clientX < 28) ? { x:t.clientX, y:t.clientY, t:Date.now() } : null;
}, { passive:true });
document.addEventListener('touchend', e => {
  if (!gesto) return;
  const t = e.changedTouches[0], dx = t.clientX - gesto.x, dy = Math.abs(t.clientY - gesto.y);
  gesto = null;
  if (dx > 70 && dy < 60) cerrarVentana();
}, { passive:true });

/* =========================================================
   ESTIRAR PARA ACTUALIZAR (sosteniendo un segundo)
   Arriba de todo de una ventana, arrastrar hacia abajo "estira" la
   ventana. Antes alcanzaba con llegar arriba de todo y seguir un poco:
   cualquiera que subía rápido la página terminaba actualizando sin
   querer. Ahora hay que ESTIRAR Y SOSTENER: pasados unos 90 px, un
   anillo se llena durante un segundo; recién cuando está lleno dice
   "Soltá para actualizar". Si se suelta antes, no pasa nada.
   El gesto tiene que EMPEZAR con la ventana ya arriba de todo: el envión
   de una subida rápida no cuenta.
   En la computadora es lo mismo con la rueda o el panel táctil: un tirón
   hacia arriba sostenido más de un segundo, empezando arriba de todo.
   Al actualizar se pide TODO de nuevo: la base del barrio (se reconecta),
   el clima, los vuelos, los cruceros, los sismos y la versión de la app.
   ========================================================= */
const Estirar = {
  UMBRAL: 90, SOSTENER: 1000, y0: null, x0: 0, d: 0, girando: false, el: null,
  listoDesde: 0, armado: false, reloj: null, rueda: 0, ruedaT: 0, ruedaIni: 0, ruedaVale: false,
  indicador(){
    if (this.el && this.el.isConnected) return this.el;
    this.el = document.createElement('div');
    this.el.className = 'estirar'; this.el.setAttribute('aria-live', 'polite');
    this.el.innerHTML = `<span class="estirar-ic">${I('refresh')}</span><b></b>`;
    document.body.appendChild(this.el);
    return this.el;
  },
  /* Cuánto falta del segundo sostenido (0 a 1). */
  progreso(){ return this.armado ? 1 : this.listoDesde ? Math.min(1, (Date.now() - this.listoDesde) / this.SOSTENER) : 0; },
  mostrar(d){
    const el = this.indicador(), llego = d >= this.UMBRAL;
    if (llego && !this.listoDesde && !this.armado){
      this.listoDesde = Date.now();
      clearTimeout(this.reloj);
      this.reloj = setTimeout(() => { if (this.listoDesde){ this.armado = true; this.mostrar(this.d || this.UMBRAL); } }, this.SOSTENER);
      clearInterval(this.anillo);
      this.anillo = setInterval(() => { if (!this.listoDesde || this.armado) return clearInterval(this.anillo); el.style.setProperty('--sostener', this.progreso().toFixed(2)); }, 50);
    }
    if (!llego && !this.armado) this.cancelarEspera();
    el.classList.add('ver'); el.classList.toggle('listo', this.armado); el.classList.toggle('sosteniendo', llego && !this.armado);
    el.style.setProperty('--estirar', Math.min(d, 120) + 'px');
    el.style.setProperty('--giro', Math.round(d * 3) + 'deg');
    el.style.setProperty('--sostener', this.progreso().toFixed(2));
    el.querySelector('b').textContent = this.armado ? 'Soltá para actualizar' : llego ? 'Sostené un segundo…' : 'Estirá y sostené para actualizar';
    const v = $('.ventana'); if (v){ v.style.transition = 'none'; v.style.transform = `translateY(${Math.round(Math.min(d, 120) * .5)}px)`; }
  },
  cancelarEspera(){ this.listoDesde = 0; clearTimeout(this.reloj); clearInterval(this.anillo); },
  /* Se soltó: actualiza solo si llegó a sostener el segundo entero. */
  terminar(){
    const vale = this.armado;
    this.cancelarEspera(); this.armado = false;
    this.soltar();
    if (vale) this.actualizar(); else this.esconder();
  },
  soltar(){
    const v = $('.ventana'); if (v){ v.style.transition = 'transform .28s cubic-bezier(.2,.9,.3,1.2)'; v.style.transform = ''; }
  },
  esconder(demora = 0){
    setTimeout(() => { if (this.el){ this.el.classList.remove('ver', 'listo', 'sosteniendo', 'girando', 'hecho'); } }, demora);
  },
  arriba(){ const c = $('#cuerpo'); return !!c && c.scrollTop <= 0 && (document.scrollingElement?.scrollTop || 0) <= 0; },
  async actualizar(){
    if (this.girando) return;
    this.girando = true;
    const el = this.indicador();
    el.classList.add('ver', 'girando'); el.classList.remove('listo', 'sosteniendo');
    el.style.setProperty('--estirar', '64px');
    el.querySelector('b').textContent = 'Actualizando…';
    const tareas = [];
    try { if (typeof Clima !== 'undefined'){ if (Clima.d) Clima.d.t = 0; tareas.push(Clima.pedir()); } } catch(e){}
    try { if (typeof Vuelos !== 'undefined') tareas.push(Vuelos.pedir(true)); } catch(e){}
    try { if (typeof Cruceros !== 'undefined') tareas.push(Cruceros.pedir(true)); } catch(e){}
    try { if (typeof Sismos !== 'undefined') tareas.push(Sismos.pedir(true)); } catch(e){}
    try {
      if (typeof Nube !== 'undefined' && Nube.activa() && Nube.db){
        /* Cortar y volver a conectar hace que Firebase pida todo de nuevo
           al servidor: si alguna escucha había quedado dormida (el celular
           estuvo en el bolsillo), se despierta. */
        Nube.db.goOffline(); Nube.db.goOnline();
        tareas.push(Nube.db.ref('barrio/config/nombre').get());
      }
    } catch(e){}
    try { if ('serviceWorker' in navigator) tareas.push(navigator.serviceWorker.getRegistration().then(r => r && r.update())); } catch(e){}
    await Promise.race([Promise.allSettled(tareas), new Promise(ok => setTimeout(ok, 8000))]);
    try { refrescar(); } catch(e){}
    Store.sesion.actualizadoAt = Date.now(); Store.guardarSesion();
    el.classList.remove('girando'); el.classList.add('hecho');
    el.querySelector('b').textContent = `Todo al día · ${new Date().toLocaleTimeString('es-AR', { hourCycle:'h23' })}`;
    this.girando = false;
    this.esconder(1400);
  },
};
document.addEventListener('touchstart', e => {
  Estirar.y0 = null; Estirar.d = 0; Estirar.cancelarEspera(); Estirar.armado = false;
  if (Estirar.girando || e.touches.length !== 1 || hojaAbierta()) return;
  const c = $('#cuerpo'), t = e.touches[0];
  if (!c || !c.contains(e.target) || !Estirar.arriba() || t.clientX < 28) return;
  Estirar.y0 = t.clientY; Estirar.x0 = t.clientX;
}, { passive:true });
document.addEventListener('touchmove', e => {
  if (Estirar.y0 == null) return;
  const t = e.touches[0], dy = t.clientY - Estirar.y0, dx = Math.abs(t.clientX - Estirar.x0);
  if (dy <= 0 || !Estirar.arriba() || (dx > dy && Estirar.d < 10)){ if (Estirar.d){ Estirar.cancelarEspera(); Estirar.armado = false; Estirar.soltar(); Estirar.esconder(); } Estirar.y0 = null; Estirar.d = 0; return; }
  /* Resistencia: cuanto más se estira, más cuesta, como una goma. */
  Estirar.d = Math.round(dy * .5);
  if (Estirar.d > 6) Estirar.mostrar(Estirar.d);
}, { passive:true });
['touchend', 'touchcancel'].forEach(ev => document.addEventListener(ev, () => {
  if (Estirar.y0 == null) return;
  Estirar.y0 = null; Estirar.d = 0;
  Estirar.terminar();
}, { passive:true }));
document.addEventListener('wheel', e => {
  const c = $('#cuerpo'), ahora = Date.now();
  /* Un gesto nuevo empieza después de un respiro de la rueda. Solo vale si
     empieza con la ventana ya arriba de todo: el envión de una subida
     rápida que llega arriba no cuenta. */
  if (ahora - Estirar.ruedaT > 450){ Estirar.rueda = 0; Estirar.ruedaIni = ahora; Estirar.ruedaVale = Estirar.arriba() && e.deltaY < 0; }
  Estirar.ruedaT = ahora;
  if (!Estirar.ruedaVale || Estirar.girando || hojaAbierta() || !c || !c.contains(e.target)) return;
  if (e.deltaY > 0 || !Estirar.arriba()){ Estirar.ruedaVale = false; Estirar.rueda = 0; Estirar.cancelarEspera(); Estirar.armado = false; Estirar.soltar(); Estirar.esconder(); return; }
  Estirar.rueda += -e.deltaY;
  Estirar.d = Math.min(120, Estirar.rueda / 4);
  Estirar.mostrar(Estirar.d);
  clearTimeout(Estirar.ruedaFin);
  Estirar.ruedaFin = setTimeout(() => { Estirar.rueda = 0; Estirar.d = 0; Estirar.ruedaVale = false; Estirar.terminar(); }, 300);
}, { passive:true });

const inicioId = () => esGuardia() ? 'garita' : 'inicio';
const titulo = (def, p) => typeof def.titulo === 'function' ? def.titulo(p) : def.titulo;

/* ---------------- dibujo ---------------- */
function pintarTop(){
  const u = yo(); if (!u) return;
  const nl = noLeidas().length + sosEnCampanita().length;
  const modo = modoActivo();
  const rol = { vecino:'Vecino/a', admin:'Administración', guardia:'Guardia' }[modo] || '';
  $('#top').classList.toggle('con-modo', puedeAdministrar());
  $('#top').innerHTML = `
    <button class="marca" data-a="volver" data-i="0" aria-label="Ir al inicio">
      <span class="logo">${LOGO}</span>
      <span class="marca-txt"><b><span class="marca-pre">Barrio </span>${esc(Store.s.config.nombre)}</b>
        <small><span class="en-vivo ${Conexion.estado}" title="${Conexion.texto()}"></span>${esc(u.nombre.split(' ')[0])}${modo === 'vecino' ? `<span class="casa"> · ${esc(u.casa)}</span>`
          : `<span class="rol-chip">${rol}</span><span class="casa"> · ${esc(u.casa)}</span>`}</small></span>
    </button>
    ${Presencia.chip()}
    ${puedeAdministrar() ? `<button class="modo-btn ${modo}" data-a="cambiar-modo" aria-label="Cambiar de modo">${I(modo === 'admin' ? 'sliders' : 'home')}<span>${modo === 'admin' ? 'Admin' : 'Vecino'}</span></button>` : ''}
    <button class="icon-btn" data-a="notifs" aria-label="Avisos">${I('bell')}${nl ? `<span class="dot-badge">${nl > 9 ? '9+' : nl}</span>` : ''}</button>
    <button class="icon-btn" data-a="mi-cuenta" aria-label="Mi cuenta">${avatar(u, 'sm')}</button>
    <button class="sos-btn" id="sosBtn" aria-label="SOS: pedir ayuda">${I('siren')}<span>SOS</span></button>`;
}

function pintar(){
  aplicarTema();
  const u = yo();
  if (!u){ PILA.length = 0; return pintarBienvenida(); }
  if (!$('#lienzo')){
    $('#app').innerHTML = `<header class="top" id="top"></header><div class="lienzo" id="lienzo"></div><div id="alarmas"></div>`;
  }
  if (!PILA.length || PILA[0].id !== inicioId()){ PILA.length = 0; PILA.push({ id: inicioId(), param:'' }); }
  /* Una ventana que ya no existe (por un enlace viejo o un cambio de rol) no
     puede dejar la app en blanco: se descarta y se vuelve al inicio. */
  while (PILA.length > 1 && (!R[PILA[PILA.length - 1].id] || !ventanaPermitida(PILA[PILA.length - 1].id))) PILA.pop();
  sincronizarHistorial();
  /* La barra de arriba se dibuja aparte y con red: si algo de ahí falla (un
     aviso mal formado, por ejemplo), antes se caía `pintar()` entero y la
     app dejaba de responder a todo. Un encabezado incompleto se aguanta;
     una app muda, no. */
  try { pintarTop(); } catch(err){ console.error('Falló el encabezado', err); avisarFalla(err, 'encabezado'); }
  const lienzo = $('#lienzo');
  const activa = PILA[PILA.length - 1];
  const def = R[activa.id] || R[inicioId()];
  const lomos = PILA.slice(0, -1).map((v, i) => {
    const d = R[v.id] || {};
    const t = titulo(d, v.param) || 'Atrás';
    return `<button class="lomo ${i === PILA.length - 2 ? 'ultimo' : ''}" data-a="volver" data-i="${i}" aria-label="Volver a ${esc(t)}" title="Volver a ${esc(t)}">
      <span class="lomo-flecha">${I('left')}</span>${I(d.icon || 'home')}<b>${esc(t)}</b></button>`;
  }).join('');
  const cab = PILA.length > 1 ? `<header>
      <button class="volver-btn" data-a="cerrar-ventana" aria-label="Volver a ${esc(titulo(R[PILA[PILA.length - 2].id] || {}, PILA[PILA.length - 2].param) || 'atrás')}">${I('left')}</button>
      <span class="ic ic-${def.color || 'brand'}">${I(def.icon || 'grid')}</span>
      <div class="tit"><h2>${esc(titulo(def, activa.param))}</h2>${def.sub ? `<div class="sub">${esc(typeof def.sub === 'function' ? def.sub(activa.param) : def.sub)}</div>` : ''}</div>
      <button class="cerrar" data-a="volver" data-i="0" aria-label="Cerrar e ir al inicio">${I('x')}</button></header>` : '';
  let html;
  try { html = def.render(activa.param); }
  catch(err){ console.error(err); html = panelDeError(err); }
  lienzo.innerHTML = `<div class="lomos">${lomos}</div>` + `<section class="ventana ${PILA.length === 1 ? 'inicio' : ''} ${def.ancha ? 'ancha' : ''} ${ventanaNueva ? 'entra' : ''}" data-id="${activa.id}">${cab}<div class="cuerpo" id="cuerpo">${html}</div></section>`;
  lienzo.classList.toggle('apilado', PILA.length > 1);
  if (!ventanaNueva && activa.scroll != null && pintar.ultimaPila > PILA.length) scrollPendiente = activa.scroll;
  pintar.ultimaPila = PILA.length;
  ventanaNueva = false;
  reponerScroll();
  conRed('después de pintar', despuesDePintar);
  conRed('alarmas', pintarAlarmas);
  conRed('comunicados', mostrarComunicado);
}
/* Corre algo que adorna la pantalla sin dejar que se lleve puesto el resto. */
function conRed(qué, fn){ try { fn(); } catch(err){ console.error('Falló ' + qué, err); avisarFalla(err, qué); } }
const panelDeError = err => `<div class="aviso a-danger">${I('alert')}<div class="txt"><b>Esta ventana tuvo un problema</b>${esc(err.message)}
  <div class="acciones"><button class="btn btn-xs btn-sec" data-a="volver" data-i="0">Volver al inicio</button></div></div></div>`;

/* Redibuja solo el cuerpo de la ventana activa sin perder lo que se
   estaba escribiendo ni la posición del scroll. Se usa cuando llega un
   cambio de otra pestaña o de otro vecino. */
function refrescar(){
  const u = yo();
  if (!u || !$('#cuerpo')) return pintar();
  if (!PILA.length) return pintar();
  const activa = PILA[PILA.length - 1];
  const def = R[activa.id];
  if (!def) return pintar();
  if (def.noRefrescar) { pintarTop(); pintarAlarmas(); return; }
  const cuerpo = $('#cuerpo');
  const y = cuerpo.scrollTop;
  const act = document.activeElement;
  const foco = act && cuerpo.contains(act) && act.id ? act.id : null;
  const sel = foco && 'selectionStart' in act ? [act.selectionStart, act.selectionEnd] : null;
  const valores = {};
  $$('input[id],textarea[id],select[id]', cuerpo).forEach(el => { if (el.type !== 'file') valores[el.id] = el.type === 'checkbox' ? el.checked : el.value; });
  /* La foto grande del inicio se conserva entre redibujos. Si se rehace el
     nodo, el navegador vuelve a pintar la imagen y se ve un parpadeo cada
     vez que llega un dato (el clima, un aviso, el motor). */
  const fotoVieja = cuerpo.querySelector('.hero .foto');
  try { cuerpo.innerHTML = def.render(activa.param); } catch(err){ console.error(err); cuerpo.innerHTML = panelDeError(err); }
  const fotoNueva = cuerpo.querySelector('.hero .foto');
  if (fotoVieja && fotoNueva && fotoVieja.style.backgroundImage === fotoNueva.style.backgroundImage)
    fotoNueva.replaceWith(fotoVieja);
  for (const id in valores){ const el = document.getElementById(id); if (el){ if (el.type === 'checkbox') el.checked = valores[id]; else el.value = valores[id]; } }
  if (foco){ const el = document.getElementById(foco); if (el){ el.focus({ preventScroll:true }); if (sel) try { el.setSelectionRange(sel[0], sel[1]); } catch(e){} } }
  cuerpo.scrollTop = y;
  conRed('encabezado', pintarTop);
  conRed('después de pintar', despuesDePintar);
  conRed('alarmas', pintarAlarmas);
  conRed('comunicados', mostrarComunicado);
}

/* =========================================================
   CUÁNDO SE PUEDE REDIBUJAR, Y CUÁNDO NO
   -------------------------------------------------------
   Acá estaba la causa de que la app "no respondiera al tocar".

   Al conectar con la base del barrio llegan más de veinte colecciones, una
   por una, durante varios segundos. Antes, cada una redibujaba la ventana
   entera. Y un toque en el celular son DOS cosas separadas en el tiempo: el
   dedo que baja (pointerdown) y el toque que se confirma (click), con 100 a
   300 ms en el medio. Si justo en ese ratito llega un dato y se rehace el
   HTML, el botón que tocaste **deja de existir** antes de que el toque se
   confirme: el navegador no dispara el click y no pasa nada. Tocás de nuevo,
   y de nuevo nada. Con buena conexión no se nota; con la conexión de un
   celular, pasa todo el tiempo.

   Tres reglas, entonces:
     1. mientras el dedo está apoyado, NO se redibuja;
     2. lo que llega se junta y se dibuja UNA vez, cuando dejó de llegar;
     3. con una hoja abierta tampoco: redibujar lo de atrás no sirve y puede
        cerrarla.
   Lo que queda pendiente se dibuja apenas se suelta el dedo.
   ========================================================= */
let refrescoPedido = false, refrescoTimer = null, tocando = false, tocandoDesde = 0;

document.addEventListener('pointerdown', () => { tocando = true; tocandoDesde = Date.now(); }, true);
['pointerup','pointercancel','click'].forEach(ev =>
  document.addEventListener(ev, () => {
    /* Un respiro después de soltar, para que el click llegue a destino. */
    setTimeout(() => { tocando = false; if (refrescoPedido) refrescarPronto(); }, 140);
  }, true));
/* Red de seguridad: si nunca llega el pointerup (el dedo se fue de la
   pantalla, la app pasó a segundo plano), no puede quedar trabado. */
setInterval(() => { if (tocando && Date.now() - tocandoDesde > 3000){ tocando = false; if (refrescoPedido) refrescarPronto(); } }, 1000);

const hojaAbierta = () => { const d = $('#hoja'); return !!(d && d.open); };

function refrescarPronto(){
  refrescoPedido = true;
  if (refrescoTimer) clearTimeout(refrescoTimer);
  refrescoTimer = setTimeout(() => {
    refrescoTimer = null;
    if (tocando || hojaAbierta()) return;     /* se reintenta al soltar o al cerrar */
    refrescoPedido = false;
    if (yo()) refrescar();
  }, 220);
}
/* Al cerrar una hoja se pone al día lo que quedó esperando. */
document.addEventListener('close', e => { if (e.target && e.target.id === 'hoja' && refrescoPedido) refrescarPronto(); }, true);

/* =========================================================
   TIRAS QUE AVANZAN SOLAS
   Las tiras de "Ushuaia hoy", las promociones del hotel y las secciones
   van pasando solas para que se vea todo sin tener que entrar. Se frenan
   cuando la persona las toca, cuando la app está en segundo plano y
   cuando el equipo pide menos movimiento. No es un cartel que parpadea:
   avanza despacio y con desplazamiento suave.
   ========================================================= */
const Tiras = {
  arrancar(){
    $$('[data-marq]').forEach(m => {
      this.acomodar(m);
      if (m.dataset.enganchada) return;
      m.dataset.enganchada = '1';
      const pausa = v => m.classList.toggle('quieta', v);
      ['pointerenter','focusin','touchstart','pointerdown'].forEach(ev => m.addEventListener(ev, () => pausa(true), { passive:true }));
      ['pointerleave','focusout','touchend','touchcancel'].forEach(ev => m.addEventListener(ev, () => setTimeout(() => pausa(false), 2500), { passive:true }));
    });
  },

  /* EL BUCLE SIN SALTO
     -------------------------------------------------------
     La cinta es el contenido repetido, y la animación lo corre exactamente
     el ancho de UNA copia: cuando termina, la copia siguiente está justo
     donde arrancó la primera y no se nota el corte.

     Eso sólo funciona si la cinta es MÁS ANCHA que su ventana. Con pocas
     propuestas y una pantalla grande, dos copias no alcanzan: al final queda
     un hueco vacío a la derecha y la vuelta al principio se ve como un
     salto. Acá se mide después de dibujar y se agregan copias hasta que
     sobre, y el paso se fija en píxeles exactos (no en 50 %, que depende de
     cuántas copias haya). La velocidad se mantiene pareja, unos 55 px por
     segundo, así una cinta larga no sale disparada. */
  acomodar(m){
    const pista = m.querySelector('.marq-pista'); if (!pista) return;
    const grupo = pista.querySelector('.marq-grupo'); if (!grupo) return;
    const ancho = grupo.getBoundingClientRect().width;
    if (!ancho) return;                       /* todavía no se dibujó */
    const copias = Math.max(2, Math.ceil((m.clientWidth + ancho) / ancho) + 1);
    for (let i = pista.children.length; i < copias; i++){
      const c = grupo.cloneNode(true);
      c.setAttribute('aria-hidden', 'true');
      pista.appendChild(c);
    }
    pista.style.setProperty('--marq-paso', ancho + 'px');
    pista.style.setProperty('--marq-dur', Math.max(14, Math.round(ancho / 55)) + 's');
  },
};
/* Si cambia el ancho de la ventana, las cintas se vuelven a medir. */
addEventListener('resize', () => { clearTimeout(Tiras._t); Tiras._t = setTimeout(() => $$('[data-marq]').forEach(m => Tiras.acomodar(m)), 200); });

/* =========================================================
   CUÁNTOS HAY EN LA APP AHORA
   Al lado del nombre va, en tiempo real: vecinos con la app abierta
   ahora / vecinos con cuenta aprobada / lotes del barrio (152). Cada app
   abierta se anota en barrio/presencia/<uid>/<equipo> y Firebase la borra
   sola cuando esa app se cierra o pierde la conexión (onDisconnect). Una
   persona con la app en el celular y en la computadora cuenta una vez;
   "en pantalla" quiere decir que no la tiene en segundo plano.
   ========================================================= */
const Presencia = {
  d: null,
  poner(v){ this.d = v || {}; if (yo() && $('#top')) conRed('encabezado', pintarTop); },
  /* Sin nube (modo local) la única app abierta es esta. */
  personas(){ return this.d ? Object.keys(this.d).filter(k => this.d[k] && typeof this.d[k] === 'object').length : 1; },
  enPantalla(){ return this.d ? Object.values(this.d).filter(eqs => eqs && typeof eqs === 'object' && Object.values(eqs).some(e => e && e.activa)).length : 1; },
  equipos(){ return this.d ? Object.values(this.d).reduce((n, eqs) => n + (eqs && typeof eqs === 'object' ? Object.keys(eqs).length : 0), 0) : 1; },
  inscriptos(){ return aLista(Store.s.users).filter(x => x && x.estado === 'aprobado' && x.casa !== 'Garita' && !esCorreoGarita(x.email)).length; },
  lotes(){ return +Store.s.config.casas || 152; },
  chip(){
    const n = this.personas(), ins = this.inscriptos(), lot = this.lotes();
    return `<button class="presencia" data-a="ver-presencia" aria-label="${n} con la app abierta, ${ins} vecinos con cuenta, ${lot} lotes" title="Con la app abierta ahora / vecinos con cuenta / lotes">
      <span class="pr-arriba"><i></i><b>${n}</b><span>/${ins}</span></span><span class="pr-lotes"><span class="pr-bar">/</span>${lot}<span class="pr-lt"> lotes</span></span></button>`;
  },
};
A['ver-presencia'] = () => {
  const P = Presencia, lotesCon = casasRegistradas();
  const fila = (n, t, x) => `<div class="it"><b class="pr-n">${n}</b><div class="txt"><b>${t}</b><span>${x}</span></div></div>`;
  hoja('Quiénes están en la app', `<div class="card lista">
    ${fila(P.personas(), 'Con la app abierta ahora', `${plural(P.enPantalla(), 'la tiene', 'la tienen')} en pantalla${P.equipos() > P.personas() ? ` · ${P.equipos()} equipos en total` : ''}`)}
    ${fila(P.inscriptos(), 'Vecinos con cuenta aprobada', `de ${plural(lotesCon, 'lote distinto', 'lotes distintos')}`)}
    ${fila(P.lotes(), 'Lotes del barrio', `${Math.max(0, P.lotes() - lotesCon)} todavía sin nadie en la app`)}</div>
    <p class="muted small" style="margin:10px 2px 0">Se actualiza solo. Una app cuenta como abierta mientras está conectada con el barrio; al cerrarla sale de la cuenta en unos segundos.</p>
    ${typeof Nube !== 'undefined' && Nube.activa() ? '' : `<p class="muted tiny" style="margin:6px 2px 0">Estás en modo local: la única app que se cuenta es esta.</p>`}`);
};

/* Estado de la conexión con la base del barrio: el puntito verde del
   encabezado deja de ser decorativo y dice la verdad. */
const Conexion = {
  estado: 'local',   /* local | conectando | vivo | caido */
  poner(e){ if (this.estado === e) return; this.estado = e; if (yo() && $('#top')) pintarTop(); },
  texto(){ return { local:'Modo local: los datos quedan en este equipo', conectando:'Conectando con la base del barrio…',
    vivo:'Conectado con el barrio', caido:'Sin conexión con el barrio: se reintenta solo' }[this.estado] || ''; },
};

function despuesDePintar(){
  Fotos.hidratar($('#cuerpo') || document);
  $$('[data-qr]').forEach(el => pintarQR(el, el.dataset.qr));
  Tiras.arrancar();
  if (typeof Reloj !== 'undefined') Reloj.arrancar();
  const def = R[PILA[PILA.length - 1]?.id];
  if (def && def.alPintar) def.alPintar(PILA[PILA.length - 1].param);
  if (typeof Servicio !== 'undefined') conRed('servicio', () => Servicio.despues());
}

/* =========================================================
   SONIDO
   Los navegadores no dejan sonar si el audio no se "despertó" antes con un
   toque de la persona. Por eso hay un solo AudioContext, que se despierta
   con el primer toque de la sesión y queda listo: así, cuando llega una
   alerta de otro equipo (que no es un toque), suena de verdad. Sin esto el
   SOS llegaba mudo a las demás terminales.
   ========================================================= */
const Sonido = {
  ctx: null,
  despertar(){
    try {
      if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      if (this.ctx.state === 'suspended') this.ctx.resume();
    } catch(e){}
    return this.ctx;
  },
  /* notas: [frecuencia, cuándo empieza, cuánto dura] */
  tocar(notas, tipo = 'sine', vol = .18){
    if (Store.sesion?.sinSonido) return;
    const ctx = this.despertar(); if (!ctx || ctx.state !== 'running') return;
    notas.forEach(([f, t, d = .5]) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = tipo; o.frequency.value = f;
      g.gain.setValueAtTime(0, ctx.currentTime + t);
      g.gain.linearRampToValueAtTime(vol, ctx.currentTime + t + .02);
      g.gain.exponentialRampToValueAtTime(.001, ctx.currentTime + t + d);
      o.connect(g); g.connect(ctx.destination);
      o.start(ctx.currentTime + t); o.stop(ctx.currentTime + t + d + .05);
    });
  },
  vibrar(patron){ try { if (navigator.vibrate) navigator.vibrate(patron); } catch(e){} },
};
['pointerdown','keydown','touchstart'].forEach(ev =>
  document.addEventListener(ev, () => Sonido.despertar(), { once:false, passive:true }));

/* =========================================================
   ALARMA SOS
   Cuando un vecino aprieta el SOS, en TODAS las terminales del barrio que
   estén abiertas en ese momento salta la pantalla roja titilante, suena UNA
   vez y dice qué pasa, en qué lote y quién la pidió.

   Lo que NO tiene que pasar (y pasaba): que alguien abra la app doce horas
   después y le salte una alerta vieja como si fuera nueva. Por eso:
     · a un vecino la pantalla roja le salta sólo si la alerta llega EN VIVO
       (creada hace menos de SOS_EN_VIVO) y este equipo todavía no la mostró;
     · una alerta vieja no salta ni suena: queda en la campanita;
     · en la campanita de cada app queda hasta que el vecino que la pidió
       marca "Ya está solucionado" (o, si no puede, la guardia la cierra).
   La guardia y la Administración siguen viendo la ficha completa mientras
   la alerta esté abierta: atenderla es su trabajo.
   ========================================================= */
const SOS_EN_VIVO = 3 * 60e3;          /* cuánto dura "recién llegada" */
const SOS_EN_CAMPANITA = 24 * 3600e3;  /* los vecinos dejan de verla pasado un día */
const SOS_ESTADO = { activa:'Activa', en_camino:'La guardia va en camino', atendida:'Atendida por la guardia · falta que el vecino confirme' };
/* Lo que ya saltó en este equipo se recuerda aunque se recargue la app. */
const sosMemoria = (clave) => {
  let ids = [];
  try { ids = JSON.parse(localStorage.getItem(clave) || '[]'); } catch(e){}
  const set = new Set(Array.isArray(ids) ? ids : []);
  const guardar = () => { try { localStorage.setItem(clave, JSON.stringify([...set].slice(-60))); } catch(e){} };
  return { has: id => set.has(id), add(id){ if (!set.has(id)){ set.add(id); guardar(); } }, delete(id){ if (set.delete(id)) guardar(); } };
};
const sosAvisadas = sosMemoria('bhc.sosAvisadas');   /* ya sonó y saltó acá */
const sosOcultas = sosMemoria('bhc.sosOcultas');     /* la sacaron de la pantalla con "Entendido" */
const sosEnPantalla = new Set();                      /* vecinos: las que saltaron en esta sesión */

const sosAbiertas = () => aLista(Store.s.sos).filter(x => x && x.estado !== 'resuelta');
/* Las que van en la campanita de quien mira. */
const sosEnCampanita = () => {
  const u = yo(); if (!u) return [];
  return sosAbiertas().filter(x => esStaff() || x.userId === u.id || Date.now() - x.at < SOS_EN_CAMPANITA)
    .sort((a, b) => b.at - a.at);
};
const sosQueVeo = () => {
  const u = yo(); if (!u) return [];
  return sosAbiertas().filter(x => !sosOcultas.has(x.id)).filter(x => {
    if (x.userId === u.id) return true;
    if (esStaff()) return x.estado !== 'atendida';
    return sosEnPantalla.has(x.id);
  });
};
function pintarAlarmas(){
  const box = $('#alarmas'); if (!box) return;
  const u = yo();
  if (!u){ box.innerHTML = ''; return; }
  /* Las que llegan en vivo y este equipo todavía no mostró: saltan y suenan una vez. */
  const recien = sosAbiertas().filter(x => x.userId !== u.id && x.estado !== 'atendida' && !sosAvisadas.has(x.id) && Date.now() - x.at < SOS_EN_VIVO);
  recien.forEach(x => { sosAvisadas.add(x.id); sosEnPantalla.add(x.id); sosOcultas.delete(x.id); });
  if (recien.length){
    Sonido.tocar([[988, 0, .35], [988, .28, .35], [988, .56, .5]], 'square', .16);
    Sonido.vibrar([400, 160, 400, 160, 400]);
    sosAvisoDelSistema(recien[0]);
  }
  /* A la guardia, una alerta vieja se le muestra (tiene que atenderla) pero
     no le suena de nuevo cada vez que abre la app. */
  sosAbiertas().forEach(x => sosAvisadas.add(x.id));
  const act = sosQueVeo();
  if (!act.length){ box.innerHTML = ''; return; }
  const s0 = act[0], t = TIPOS_SOS[s0.tipo] || TIPOS_SOS.otra;
  box.innerHTML = `<div class="sos-pantalla" role="alertdialog" aria-label="Alerta SOS"><div class="sos-caja">
    ${s0.userId === u.id ? sosPanelMio(s0, t) : esStaff() ? sosPanelStaff(s0, t, act.length) : sosPanelVecino(s0, t)}
  </div></div>`;
  Fotos.hidratar(box);
}
/* Si la app está abierta pero en segundo plano, el aviso del sistema. */
function sosAvisoDelSistema(x){
  try {
    if (!('Notification' in window) || Notification.permission !== 'granted' || !document.hidden) return;
    const v = usuario(x.userId) || {}, t = TIPOS_SOS[x.tipo] || TIPOS_SOS.otra;
    new Notification(`SOS · ${t.nombre}`, { body:`${v.casa || ''} · ${v.nombre || ''}`, icon:'icons/icon-192.png', tag:'sos-' + x.id, requireInteraction:true });
  } catch(e){}
}
function sosPanelStaff(s0, t, cuantas){
  const u = usuario(s0.userId) || {};
  const punto = s0.coords || u.ubicacion;
  const mapa = punto ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(punto)}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((Store.s.config.domicilio || '') + ' ' + (u.casa || ''))}`;
  const L = u.casa && typeof LOTES !== 'undefined' ? LOTES.find(l => 'Lote ' + l.lote === u.casa) : null;
  return `<div class="sos-cab">${I('siren')}<div><b>SOS · ${esc(t.nombre)}</b><span>${hace(s0.at)}${cuantas > 1 ? ` · y ${cuantas - 1} más` : ''}</span></div></div>
    <div class="sos-vecino">
      ${u.fotoCasa ? fotoHTML(u.fotoCasa, 'casa-foto grande') : `<span class="casa-foto grande vacia">${I('home')}</span>`}
      <div class="grow"><b>${esc(u.nombre || 'Vecino/a')}</b>
        <div class="sos-lote">${esc(u.casa || '')}${L ? ' · UF ' + L.uf : ''}</div>
        ${u.direccion ? `<div class="sos-dato">${esc(u.direccion)}</div>` : ''}
        ${u.integrantes ? `<div class="sos-dato">${I('users')} ${esc(u.integrantes)}</div>` : ''}
        ${s0.estado === 'en_camino' ? `<div class="sos-dato">${I('check')} Va en camino ${esc(nombreDe(s0.atiende))}</div>` : ''}</div></div>
    <div class="sos-botones">
      <a class="btn btn-block sos-b-claro" href="${mapa}" target="_blank" rel="noopener">${I('pin')}Cómo llegar${s0.coords ? ' (GPS de la alerta)' : u.ubicacion ? ' (ubicación del lote)' : ''}</a>
      ${u.tel ? `<a class="btn btn-block sos-b-tenue" href="${telLink(u.tel)}">${I('phone')}Llamar a ${esc((u.nombre || '').split(' ')[0])}</a>` : ''}
      <div class="btns">
        ${s0.estado === 'activa' ? `<button class="btn btn-ok" data-a="sos-voy" data-id="${s0.id}">${I('check')}Voy en camino</button>` : ''}
        <button class="btn btn-sec" data-a="sos-atendida" data-id="${s0.id}">Ya la atendimos</button>
        <button class="btn btn-sec" data-a="sos-repetir" data-id="${s0.id}">${I('volume')}Repetir sonido</button>
      </div>
      <a class="btn btn-block sos-b-oscuro" href="tel:${t.llamar}">${I('siren')}Llamar al ${t.llamar}</a>
    </div>`;
}
/* Lo que ve el resto del barrio: qué pasa, en qué lote y quién la pidió. */
function sosPanelVecino(s0, t){
  const u = usuario(s0.userId) || {};
  const medicaRespondedor = s0.tipo === 'medica' && yo()?.respondedor;
  return `<div class="sos-cab">${I('siren')}<div><b>SOS · ${esc(t.nombre)}</b><span>${hace(s0.at)}</span></div></div>
    <div class="sos-vecino">
      <div class="grow"><b>${esc(u.nombre || 'Un vecino')}</b>
        <div class="sos-lote">${esc(u.casa || 'Lote sin dato')}</div>
        ${s0.estado === 'en_camino' ? `<div class="sos-dato">${I('check')} La guardia va en camino</div>` : ''}</div></div>
    <div class="sos-texto">${medicaRespondedor
      ? 'Marcaste que sabés primeros auxilios. Si podés, acercate. La guardia ya fue avisada.'
      : s0.tipo === 'incendio' ? 'Alejate de la zona, no bloquees las calles y dejá paso a los bomberos. La guardia y la Administración ya fueron avisadas.'
      : s0.tipo === 'seguridad' ? 'Quedate adentro, cerrá con llave y no salgas a mirar. La guardia y la Administración ya fueron avisadas.'
      : s0.tipo === 'medica' ? 'La guardia ya fue avisada y está yendo. No bloquees la calle: puede venir una ambulancia.'
      : 'La guardia y la Administración ya fueron avisadas.'}</div>
    <div class="sos-botones">
      ${medicaRespondedor ? `<a class="btn btn-block sos-b-claro" href="tel:107">${I('heart')}Llamar al 107</a>` : ''}
      <div class="btns"><button class="btn btn-sec grow" data-a="sos-entendido" data-id="${s0.id}">${I('check')}Entendido</button></div>
      <a class="btn btn-block sos-b-oscuro" href="tel:${t.llamar}">${I('phone')}Emergencias ${t.llamar}</a>
      <p class="sos-nota">Queda en tu campanita hasta que ${esc((u.nombre || 'el vecino').split(' ')[0])} avise que ya está solucionado.</p>
    </div>`;
}
function sosPanelMio(s0, t){
  return `<div class="sos-cab">${I('siren')}<div><b>Tu alerta está activa</b><span>${esc(t.nombre)} · ${hace(s0.at)}</span></div></div>
    <div class="sos-texto">${s0.estado === 'en_camino' ? `La guardia va en camino (${esc(nombreDe(s0.atiende))}). Quedate en un lugar seguro.`
      : s0.estado === 'atendida' ? 'La guardia la dio por atendida. Si ya está todo bien, confirmalo: así deja de figurar como emergencia en las apps del barrio.'
      : 'La guardia, la Administración y los vecinos ya la recibieron. Quedate en un lugar seguro.'}</div>
    <div class="sos-botones">
      <a class="btn btn-block sos-b-claro" href="tel:${t.llamar}">${I('phone')}Llamar al ${t.llamar}</a>
      ${Store.s.config.garitaTel ? `<a class="btn btn-block sos-b-tenue" href="${telLink(Store.s.config.garitaTel)}">${I('gate')}Llamar a la garita</a>` : ''}
      <div class="btns"><button class="btn btn-ok grow" data-a="sos-cancelar" data-id="${s0.id}">${I('check')}Ya está solucionado</button>
        <button class="btn btn-sec" data-a="sos-entendido" data-id="${s0.id}">Ocultar</button></div>
      <p class="sos-nota">"Ocultar" la saca de tu pantalla pero la alerta sigue abierta: la encontrás en la campanita.</p>
    </div>`;
}
/* Cómo se ve una alerta abierta dentro de la campanita. */
function sosEnLista(x){
  const u = yo(), v = usuario(x.userId) || {}, t = TIPOS_SOS[x.tipo] || TIPOS_SOS.otra, mia = x.userId === u.id;
  return `<div class="notif-sos">
    <span class="ic">${I('siren')}</span>
    <div class="txt"><b>SOS · ${esc(t.nombre)}</b>
      <span>${mia ? 'Tu alerta' : `${esc(v.casa || '')} · ${esc(v.nombre || 'Vecino/a')}`} · ${hace(x.at)}</span>
      <small>${SOS_ESTADO[x.estado] || ''}</small>
      <div class="btns">
        ${mia ? `<button class="btn btn-xs btn-ok" data-a="sos-cancelar" data-id="${x.id}">${I('check')}Ya está solucionado</button>` : ''}
        <button class="btn btn-xs btn-sec" data-a="sos-ver" data-id="${x.id}">Ver la alerta</button>
        ${!mia && esStaff() ? `<button class="btn btn-xs btn-danger-soft" data-a="sos-cerrar" data-id="${x.id}">Cerrarla</button>` : ''}
      </div></div></div>`;
}
A['sos-repetir'] = () => { Sonido.tocar([[988, 0, .35], [988, .28, .35], [988, .56, .5]], 'square', .16); Sonido.vibrar([400, 160, 400]); };
/* "Entendido" saca el cartel de la pantalla de este vecino; la alerta sigue
   en su campanita hasta que quien la pidió avise que está solucionada. */
A['sos-entendido'] = el => { sosOcultas.add(el.dataset.id); sosEnPantalla.delete(el.dataset.id); pintarAlarmas(); pintarTop(); };
A['sos-ver'] = el => { cerrarHoja(); sosOcultas.delete(el.dataset.id); sosEnPantalla.add(el.dataset.id); pintarAlarmas(); };

function pitido(){ Sonido.tocar([[880, 0, .22], [880, .35, .22], [880, .7, .22]], 'square', .1); Sonido.vibrar([300, 150, 300, 150, 300]); }

/* ---------------- modo día y modo noche ----------------
   En automático manda el sol de Ushuaia, no el reloj del equipo ni el
   ajuste del sistema: de día la app va clara y de noche, oscura. En
   invierno eso significa que a las 17:30 ya cambia sola. */
function aplicarTema(){
  const t = Store.sesion?.tema || 'auto';
  const modo = t === 'auto' ? (Clima.esDeDia() ? 'light' : 'dark') : t;
  document.documentElement.setAttribute('data-theme', modo);
  document.querySelector('meta[name=theme-color]')?.setAttribute('content', modo === 'dark' ? '#0a1315' : '#0b3c47');
}
const modoActual = () => document.documentElement.getAttribute('data-theme') === 'dark' ? 'noche' : 'día';

/* ---------------- bienvenida (sin sesión) ---------------- */
function pintarBienvenida(modo = 'inicio'){
  const pend = Store.sesion.pendienteEmail && Store.s.users.find(u => u.email === Store.sesion.pendienteEmail);
  const nube = Nube.activa();
  const c = Store.s.config;
  const grupo = (t, campos, ayuda = '') => `<section class="grupo"><h3>${t}</h3>${campos}${ayuda ? `<p class="grupo-ayuda">${ayuda}</p>` : ''}</section>`;
  const campo = (label, input, ancho = '') => `<div class="field ${ancho}"><label>${label}</label>${input}</div>`;
  const selectLote = (sel = '') => `<select name="casa" required><option value="">Elegí tu lote…</option>${LOTES.map(l => `<option value="Lote ${l.lote}" ${'Lote ' + l.lote === sel ? 'selected' : ''}>${esc(nombreLote(l))}</option>`).join('')}</select>`;

  let titulo, bajada, cuerpo, pie = '';

  if (modo === 'entrar'){
    titulo = 'Entrar';
    bajada = 'Con el correo y la clave de tu cuenta.';
    cuerpo = `<form data-f="entrar">
      ${grupo('Tu acceso',
        campo('Correo', `<input name="email" type="email" required autocomplete="username" inputmode="email" placeholder="tucorreo@mail.com" value="${esc(Store.sesion.pendienteEmail || '')}">`) +
        campo(nube ? 'Contraseña' : 'Clave de vecino', `<input name="clave" type="${nube ? 'password' : 'text'}" required autocomplete="current-password" placeholder="${nube ? '••••••••' : 'VEC-XXXX'}" ${nube ? '' : 'style="text-transform:uppercase;letter-spacing:2px"'}>`))}
      <button class="btn btn-pri btn-block btn-grande">${I('login')}Entrar</button>
      ${nube ? `<button type="button" class="btn btn-sec btn-block" data-a="olvide">Olvidé mi contraseña</button>` : ''}
    </form>`;
    pie = `<button class="enlace" data-a="bienvenida" data-v="inicio">${I('left')}Volver</button>
           <button class="enlace" data-a="bienvenida" data-v="registro">Todavía no tengo cuenta</button>`;
  }

  else if (modo === 'registro'){
    titulo = 'Inscribite';
    bajada = 'La Administración revisa el pedido y te habilita.';
    cuerpo = `<form data-f="registro">
      ${grupo('Quién sos',
        campo('Nombre y apellido', `<input name="nombre" required maxlength="60" autocomplete="name" placeholder="Como figura en la escritura">`) +
        `<div class="grid2">${campo('DNI', `<input name="dni" required inputmode="numeric" pattern="[0-9.]{7,11}" maxlength="11" placeholder="Sin puntos">`)}
          ${campo('Tu lote', selectLote())}</div>`,
        `El barrio tiene ${lotesVecinos().length} lotes de vecinos. Si no encontrás el tuyo, escribinos.`)}
      ${grupo('Cómo te contactamos',
        campo('Correo', `<input name="email" type="email" required maxlength="80" autocomplete="email" inputmode="email" placeholder="tucorreo@mail.com">`) +
        campo('Teléfono o WhatsApp', `<input name="tel" inputmode="tel" maxlength="20" autocomplete="tel" placeholder="549 2901 …">`),
        'Al correo te llega el estado de tu inscripción.')}
      ${grupo('Tu profesión u oficio (opcional)',
        campo('A qué te dedicás', `<input name="profesion" maxlength="60" placeholder="Médico, electricista, abogada, clases de inglés…">`) +
        `<label class="check"><input type="checkbox" name="publicar"><span>Publicarlo en <b>Ushuaia y servicios → Profesionales y oficios</b>, con mi teléfono, para que los vecinos me puedan contactar.</span></label>`,
        'Lo podés cambiar cuando quieras desde Mi casa.')}
      ${nube ? grupo('Tu contraseña', campo('Elegila', `<input name="clave" type="password" required minlength="6" autocomplete="new-password" placeholder="Mínimo 6 caracteres">`), 'Es personal. Si en tu casa hay más de un vecino, cada uno tiene la suya.') : ''}
      ${grupo('Privacidad',
        `<label class="check"><input type="checkbox" name="acepto" required><span>Acepto que la Administración use estos datos solo para la vida del barrio y el control de acceso (Ley 25.326). Puedo pedir verlos, corregirlos o borrarlos.</span></label>
         <label class="check"><input type="checkbox" name="aceptoTerminos" required><span>Leí y acepto los <button type="button" class="link" data-a="ver-legal">Términos de uso y el deslinde de responsabilidad</button>.</span></label>`)}
      <button class="btn btn-pri btn-block btn-grande">${I('send')}Enviar mi inscripción</button>
    </form>`;
    pie = `<button class="enlace" data-a="bienvenida" data-v="inicio">${I('left')}Volver</button>
           <button class="enlace" data-a="bienvenida" data-v="entrar">Ya tengo cuenta</button>`;
  }

  else if (modo === 'completar'){
    titulo = Nube.libre ? 'Sos la primera cuenta' : 'Completá tu ficha';
    bajada = Nube.libre ? 'Con estos datos quedás como Administración del barrio.' : 'Tu cuenta existe pero le falta la ficha de vecino.';
    cuerpo = `<form data-f="completar">
      ${grupo('Quién sos',
        campo('Nombre y apellido', `<input name="nombre" required maxlength="60" autocomplete="name">`) +
        `<div class="grid2">${campo('DNI', `<input name="dni" required inputmode="numeric" maxlength="11" placeholder="Sin puntos">`)}
          ${campo('Tu lote', selectLote())}</div>`)}
      ${grupo('Contacto', campo('Teléfono o WhatsApp', `<input name="tel" inputmode="tel" maxlength="20" autocomplete="tel">`))}
      <button class="btn btn-pri btn-block btn-grande">${I('check')}Completar mi ficha</button>
    </form>`;
    pie = `<button class="enlace" data-a="salir-espera">Salir</button>`;
  }

  else if (modo === 'espera'){
    titulo = 'Inscripción enviada';
    bajada = 'La Administración la revisa y te avisa por correo.';
    cuerpo = `<div class="aviso a-warn">${I('clock')}<div class="txt"><b>En revisión</b>Podés cerrar la app: cuando te habiliten, entrás con tu correo y tu contraseña.</div></div>`;
    pie = `<button class="enlace" data-a="salir-espera">Salir</button>`;
  }

  else {
    titulo = 'Bienvenido al barrio';
    bajada = 'Visitas con QR, reservas, avisos de la guardia, clima y vuelos de Ushuaia, votaciones y todo lo que pasa entre vecinos.';
    cuerpo = `
      ${pend && pend.estado === 'pendiente' ? `<div class="aviso a-warn">${I('clock')}<div class="txt"><b>Tu inscripción está en revisión</b>Cuando la aprueben te llega un correo.${pend.token ? `<div class="acciones"><button class="btn btn-xs btn-sec" data-a="ver-inscripcion" data-v="${pend.token}">Ver mi inscripción</button></div>` : ''}</div></div>` : ''}
      ${pend && pend.estado === 'rechazado' ? `<div class="aviso a-danger">${I('x')}<div class="txt"><b>Tu pedido no fue aprobado</b>Comunicate con la Administración.</div></div>` : ''}
      <div class="portal-acciones">
        <button class="btn btn-pri btn-block btn-grande" data-a="bienvenida" data-v="entrar">${I('login')}Entrar</button>
        <button class="btn btn-sec btn-block btn-grande" data-a="bienvenida" data-v="registro">${I('user')}Soy vecino nuevo</button>
      </div>
      ${nube ? '' : `<section class="grupo"><h3>Probar la demo</h3><div class="demo">
        <button data-a="demo" data-v="u_claudio">Claudio · Lote 148</button>
        <button data-a="demo" data-v="u_lucia">Lucía · Lote 42</button>
        <button data-a="demo" data-v="u_diego">Diego · Lote 18</button>
        <button data-a="demo" data-v="u_garita">Guardia</button>
        <button data-a="demo" data-v="u_admin">Administración</button></div>
        <p class="grupo-ayuda">Datos inventados, solo para mirar cómo funciona.</p></section>`}`;
  }

  $('#app').innerHTML = `
    <div class="portal">
      <div class="portal-foto" style="background-image:url('${Clima.portada()}')"></div>
      <div class="portal-contenido">
        <header class="portal-marca"><span class="logo">${LOGO}</span>
          <div><b>Barrio ${esc(c.nombre)}</b><small>${esc(c.ciudad)}</small></div></header>
        <div class="portal-lema"><h1>La vida del barrio,<br>en un solo lugar.</h1>
          ${(() => { const cl = Clima.d?.c; if (!cl) return '';
            const [desc, ico] = Clima.cod(cl.weather_code);
            return `<div class="portal-clima">${I(ico)}<b>${Math.round(cl.temperature_2m)}°</b><span>${esc(desc)} · ráfagas ${Math.round(cl.wind_gusts_10m)} km/h</span></div>`; })()}</div>
        <div class="portal-caja">
          <header class="portal-cab"><h2>${esc(titulo)}</h2><p>${esc(bajada)}</p></header>
          ${cuerpo}
          ${pie ? `<nav class="portal-enlaces">${pie}</nav>` : ''}
        </div>
        <footer class="portal-pie">
          <a href="tel:911">${I('phone')}Emergencias 911</a>
          ${c.garitaTel ? `<a href="${telLink(c.garitaTel)}">${I('gate')}Garita</a>` : ''}
          <span class="version">v${esc(window.VERSION || 'sin sellar')}</span>
        </footer>
      </div>
    </div>`;
}

/* ¿La persona está escribiendo en el portal? Si Firebase tarda y contesta
   tarde que la sesión seguía abierta, no se le borra de un plumazo lo que
   estaba tecleando: se le avisa y decide ella. */
function portalEnUso(){
  const portal = $('.portal'); if (!portal) return false;
  return $$('input', portal).some(i => i.type !== 'checkbox' && String(i.value || '').trim().length > 1);
}
function avisarSesionAbierta(){
  const u = yo(); if (!u) return;
  if ($('#sesionAbierta')) return;
  const bar = document.createElement('div');
  bar.id = 'sesionAbierta';
  bar.className = 'barra-sesion';
  bar.innerHTML = `<div class="txt"><b>Tu sesión ya estaba abierta</b><span>Entraste antes como ${esc(u.email || u.nombre)}.</span></div>
    <button class="btn btn-xs btn-pri" data-a="seguir-sesion">Seguir</button>
    <button class="btn btn-xs btn-sec" data-a="salir-y-entrar">Otra cuenta</button>`;
  document.body.appendChild(bar);
}
A['seguir-sesion'] = () => { $('#sesionAbierta')?.remove(); pintar(); };
A['salir-y-entrar'] = async () => { $('#sesionAbierta')?.remove(); await Nube.salir(); Store.sesion.userId = null; Store.guardarSesion(); pintarBienvenida('entrar'); };

/* En la inscripción: si el correo es el de la garita, no se piden lote ni DNI. */
document.addEventListener('input', e => {
  const i = e.target; if (i.name !== 'email' || !i.closest('form[data-f="registro"]')) return;
  const f = i.form, g = esCorreoGarita(i.value);
  ['nombre', 'dni', 'casa'].forEach(n => { const el = f.elements[n]; if (!el) return; el.required = !g; const c = el.closest('.field'); if (c) c.hidden = g; });
  let nota = f.querySelector('.nota-garita');
  if (g && !nota){ nota = document.createElement('div'); nota.className = 'aviso a-info nota-garita';
    nota.innerHTML = `${I('shield')}<div class="txt"><b>Cuenta de la garita</b>Es una sola para todos los turnos. Cuando la Administración la apruebe, entra con este correo y ve solamente lo de la garita.</div>`;
    i.closest('.grupo')?.after(nota); }
  if (!g && nota) nota.remove();
});

/* ---------------- avisos ----------------
   La campanita muestra SOLO lo que todavía no viste. Cada aviso que abrís
   desaparece de la lista y resta del número; "Marcar todos como vistos"
   la deja vacía. Lo único que no se va con un toque es un SOS abierto:
   queda arriba de todo hasta que el vecino que lo pidió avisa que ya está
   solucionado. */
function abrirNotifs(){
  const sos = sosEnCampanita();
  const ns = noLeidas().slice(0, 80);
  if (!sos.length && !ns.length)
    return hoja('Avisos', `<div class="vacio">${I('bell')}<b>No tenés avisos nuevos</b><span class="muted small">Cuando llegue uno, lo vas a ver con un número en la campanita.</span></div>`);
  hoja('Avisos', `
    ${sos.map(sosEnLista).join('')}
    ${ns.length ? `<div class="notifs-cab"><span>${plural(ns.length, 'aviso sin ver', 'avisos sin ver')}</span>
      <button class="btn btn-xs btn-sec" data-a="notifs-leidas">${I('check')}Marcar todos como vistos</button></div>
    ${ns.map(n => `<button class="notif nueva" data-a="notif" data-id="${n.id}">
      <span class="ic ic-${n.color || 'brand'}">${I(n.icon || 'bell')}</span>
      <span class="txt"><b>${esc(n.titulo)}</b>${n.texto ? `<span>${esc(n.texto)}</span>` : ''}<time>${hace(n.at)}</time></span>${I('right')}</button>`).join('')}` : ''}`);
}
const marcarVistoAviso = (n, u) => { const l = listaDe(n, 'leidas'); if (!l.includes(u.id)) l.push(u.id); };
A['notifs'] = abrirNotifs;
A['notifs-leidas'] = () => { const u = yo(); Store.cambiar(() => noLeidas().forEach(n => marcarVistoAviso(n, u))); pintarTop(); abrirNotifs(); };
/* Abrir un aviso lo da por visto: si lleva a una ventana, va ahí; si no,
   se lee entero en la hoja y al cerrarla ya no está en la lista. */
A['notif'] = el => {
  const u = yo(); const n = aLista(Store.s.notifs).find(x => x.id === el.dataset.id); if (!n) return;
  Store.cambiar(() => marcarVistoAviso(n, u));
  pintarTop();
  /* Los avisos del tiempo van a "Ushuaia hoy"; uno que "lleva" a la
     portada (donde ya se está) se lee acá, en vez de no hacer nada. */
  const link = typeof ICONOS_CLIMA !== 'undefined' && ICONOS_CLIMA.includes(n.icon) && (!n.link || n.link === 'inicio') ? 'ushuaia' : n.link;
  if (link && R[link.split(':')[0]] && link.split(':')[0] !== inicioId() && ventanaPermitida(link.split(':')[0])){ cerrarHoja(); const [id, p] = link.split(':'); abrir(id, p || ''); return; }
  const quedan = noLeidas().length + sosEnCampanita().length;
  hoja('Aviso', `<div class="aviso-leido"><span class="ic ic-${n.color || 'brand'}">${I(n.icon || 'bell')}</span>
      <div><b>${esc(n.titulo)}</b><time>${hace(n.at)}</time></div></div>
    ${n.texto ? `<p class="aviso-leido-texto">${esc(n.texto)}</p>` : ''}
    <div class="btns" style="margin-top:16px">${quedan ? `<button class="btn btn-sec" data-a="notifs">${I('left')}Ver ${plural(quedan, 'aviso más', 'avisos más')}</button>` : ''}
      <button class="btn btn-pri grow" data-a="cerrar-hoja">Listo</button></div>`);
};

/* ---------------- SOS ----------------
   Un solo toque. Antes había que mantenerlo apretado 1,2 segundos: nadie lo
   adivinaba y parecía roto. Ahora abre al instante la lista de emergencias, y
   la alerta recién sale cuando se elige una: ese segundo toque es la
   confirmación, así no se dispara sola en el bolsillo. */
const TIPOS_SOS = {
  medica:    { nombre:'Emergencia médica', icon:'heart', llamar:'107' },
  seguridad: { nombre:'Seguridad / intrusión', icon:'shield', llamar:'101' },
  incendio:  { nombre:'Incendio', icon:'flame', llamar:'100' },
  otra:      { nombre:'Otra emergencia', icon:'alert', llamar:'911' },
};
/* Se mantiene apretado TRES SEGUNDOS. Mientras se aprieta, el botón se va
   llenando de rojo cada vez más fuerte y cuenta 3, 2, 1: así se ve que algo
   está pasando y no queda la duda de si anda o no. Soltar antes lo cancela,
   con un aviso que explica qué hacer. Los tres segundos son a propósito:
   evitan que la alerta salga sola desde el bolsillo, y a la vez el gesto es
   inequívoco cuando de verdad hace falta.
   Se usan eventos de puntero, que en iPhone, Android y computadora son los
   mismos; si el navegador fuese muy viejo, quedan los de toque y de mouse. */
const SOS_ESPERA = 3000;
let sosTimer = null, sosCuenta = null;
function sosSoltar(cancelado = true){
  const b = $('#sosBtn');
  if (sosTimer){ clearTimeout(sosTimer); sosTimer = null; }
  if (sosCuenta){ clearInterval(sosCuenta); sosCuenta = null; }
  if (!b) return;
  const estaba = b.classList.contains('cargando');
  b.classList.remove('cargando');
  b.style.removeProperty('--sos-carga');
  const txt = b.querySelector('span'); if (txt) txt.textContent = 'SOS';
  if (cancelado && estaba) toast('Mantené apretado el SOS 3 segundos para pedir ayuda', 'siren');
}
function sosApretar(e){
  const b = e.target.closest('#sosBtn'); if (!b) return;
  e.preventDefault();
  if (sosTimer) return;
  Sonido.despertar();
  b.classList.add('cargando');
  const txt = b.querySelector('span');
  const desde = Date.now();
  Sonido.vibrar(40);
  sosCuenta = setInterval(() => {
    const p = Math.min(1, (Date.now() - desde) / SOS_ESPERA);
    b.style.setProperty('--sos-carga', (p * 100).toFixed(1) + '%');
    const quedan = Math.ceil((SOS_ESPERA - (Date.now() - desde)) / 1000);
    if (txt) txt.textContent = quedan > 0 ? String(quedan) : 'SOS';
    if (p >= .34 && p < .36) Sonido.vibrar(30);
    if (p >= .67 && p < .69) Sonido.vibrar(30);
  }, 50);
  sosTimer = setTimeout(() => {
    sosSoltar(false);
    Sonido.vibrar([90, 60, 90]);
    elegirSOS();
  }, SOS_ESPERA);
}
document.addEventListener('pointerdown', sosApretar);
['pointerup','pointercancel'].forEach(t => document.addEventListener(t, () => sosSoltar(true)));
/* Si el dedo se va del botón, también se cancela. */
document.addEventListener('pointermove', e => {
  if (!sosTimer) return;
  const b = $('#sosBtn'); if (!b) return;
  const r = b.getBoundingClientRect();
  if (e.clientX < r.left - 24 || e.clientX > r.right + 24 || e.clientY < r.top - 24 || e.clientY > r.bottom + 24) sosSoltar(true);
});
window.addEventListener('blur', () => sosSoltar(false));
/* Un clic suelto (sin mantener) no dispara nada, pero sí explica qué hacer. */
document.addEventListener('click', e => { if (e.target.closest('#sosBtn')) e.preventDefault(); });
function elegirSOS(){
  hoja('¿Qué está pasando?', `
    <p class="muted small" style="margin:0 0 12px">Elegí una y la alerta sale al instante a la guardia, a la Administración y a las terminales del barrio.</p>
    ${Object.entries(TIPOS_SOS).map(([k, t]) => `<button class="superficie ${k === 'medica' || k === 'incendio' ? 'peligro' : ''}" data-a="sos-enviar" data-v="${k}">
      <span class="ic ic-danger">${I(t.icon)}</span><span class="txt"><b>${t.nombre}</b>
      <small>${k === 'medica' ? 'Guardia, Administración y vecinos (con aviso a quienes saben primeros auxilios)' : 'Guardia, Administración y todos los vecinos'}</small></span>${I('right')}</button>`).join('')}
    <p class="muted tiny" style="margin:14px 0 0">Si te equivocaste, cerrá esta ventana: todavía no se mandó nada.</p>`);
}
A['sos-enviar'] = el => {
  const u = yo(), tipo = el.dataset.v, t = TIPOS_SOS[tipo];
  const idSos = uid();
  /* Se pide la ubicación en el momento: si el vecino la da, la guardia ve
     exactamente dónde está (puede no estar en su casa). */
  if (navigator.geolocation) navigator.geolocation.getCurrentPosition(pos => {
    const coords = `${pos.coords.latitude.toFixed(5)},${pos.coords.longitude.toFixed(5)}`;
    Store.cambiar(s => { const x = s.sos.find(o => o.id === idSos); if (x) x.coords = coords;
      const me = s.users.find(z => z.id === u.id); if (me && !me.ubicacion) me.ubicacion = coords; });
  }, () => {}, { enableHighAccuracy:true, timeout:8000 });
  Store.cambiar(s => {
    const id = idSos;
    s.sos.unshift({ id, userId: u.id, tipo, at: Date.now(), estado:'activa' });
    /* No se manda además un aviso a la campanita: la alerta misma salta en
       todas las apps abiertas y queda en la campanita de cada una. Antes se
       mandaban las dos cosas y sonaba dos veces. */
    s.bitacora.unshift({ id:uid(), autor:'sistema', tipo:'incidente', texto:`SOS ${t.nombre} desde ${u.casa} (${u.nombre}).`, at:Date.now() });
  });
  /* A todos los equipos del barrio, aunque tengan la pantalla apagada. */
  if (typeof Push !== 'undefined') Push.enviar({ para:'todos', titulo:`🚨 SOS · ${t.nombre}`, texto:`${u.casa} · ${u.nombre}`, tag:'sos-' + idSos, urgente:true });
  const g = Store.s.config.garitaTel || contactoTel('Garita');
  hoja('Ayuda en camino', `
    <div class="aviso a-danger latido">${I('siren')}<div class="txt"><b>La guardia ya recibió tu alerta</b>Quedate en un lugar seguro. Si podés, llamá también:</div></div>
    <div class="btns" style="margin-top:6px">
      <a class="btn btn-danger" href="tel:${t.llamar}">${I('phone')}Llamar al ${t.llamar}</a>
      ${g ? `<a class="btn btn-sec" href="${telLink(g)}">${I('gate')}Llamar a la garita</a>` : ''}
    </div>
    <p class="muted small" style="margin:14px 0 0">Tu alerta queda abierta en todas las apps del barrio hasta que vos marques que ya está solucionado.</p>`);
};
A['sos-voy'] = el => Store.cambiar(s => {
  const x = s.sos.find(o => o.id === el.dataset.id); if (!x) return;
  x.estado = 'en_camino'; x.atiende = yo().id;
  notificar(s, { para:x.userId, titulo:'La guardia va en camino', texto:'Recibimos tu alerta. Ya salimos.', icon:'shield', color:'ok', urgente:true });
});
/* La guardia la da por atendida: sale de su pantalla, pero en el barrio
   sigue figurando hasta que el vecino confirme que está todo bien. */
A['sos-atendida'] = el => Store.cambiar(s => {
  const x = s.sos.find(o => o.id === el.dataset.id); if (!x) return;
  x.estado = 'atendida'; x.atendidaAt = Date.now(); x.atiende = x.atiende || yo().id;
  s.bitacora.unshift({ id:uid(), autor:yo().id, tipo:'incidente', texto:`SOS de ${usuario(x.userId)?.casa || ''} atendida por la guardia.`, at:Date.now() });
  notificar(s, { para:x.userId, titulo:'La guardia dio por atendida tu alerta', texto:'Cuando esté todo bien, tocá "Ya está solucionado".', icon:'shield', color:'ok', urgente:true });
});
/* Quien la pidió avisa que ya está: se cierra en todas las apps. */
A['sos-cancelar'] = el => {
  Store.cambiar(s => {
    const x = s.sos.find(o => o.id === el.dataset.id); if (!x) return;
    x.estado = 'resuelta'; x.resueltaAt = Date.now(); x.resuelve = yo().id;
    s.bitacora.unshift({ id:uid(), autor:yo().id, tipo:'incidente', texto:`SOS de ${usuario(x.userId)?.casa || ''}: el vecino avisó que ya está solucionado.`, at:Date.now() });
    notificar(s, { para:'staff', titulo:'SOS solucionada', texto:`${usuario(x.userId)?.casa || ''} avisó que ya está todo bien`, icon:'check', color:'ok' });
  });
  if ($('#hoja')?.open && $('#hojaTitulo')?.textContent === 'Avisos') abrirNotifs();
  toast('Listo: la alerta se cerró en todo el barrio', 'check');
};
/* Si el vecino no puede confirmarlo, la guardia la cierra a mano. */
A['sos-cerrar'] = async el => {
  const x = aLista(Store.s.sos).find(o => o.id === el.dataset.id); if (!x) return;
  if (!await confirmar('Cerrar la alerta', `El vecino de ${esc(usuario(x.userId)?.casa || '')} todavía no confirmó que está todo bien. ¿La cerrás igual? Queda en la bitácora.`, { si:'Cerrarla' })) return;
  Store.cambiar(s => {
    const y = s.sos.find(o => o.id === x.id); if (!y) return;
    y.estado = 'resuelta'; y.resueltaAt = Date.now(); y.resuelve = yo().id;
    s.bitacora.unshift({ id:uid(), autor:yo().id, tipo:'incidente', texto:`SOS de ${usuario(y.userId)?.casa || ''} cerrada por la guardia sin confirmación del vecino.`, at:Date.now() });
  });
  abrirNotifs();
};
const contactoTel = nombre => (Store.s.contactos.find(c => c.nombre.toLowerCase().includes(nombre.toLowerCase())) || {}).tel || '';

/* ---------------- acciones comunes ---------------- */
A['abrir'] = el => abrir(el.dataset.v, el.dataset.p || '');
A['volver'] = el => { const i = +el.dataset.i; if (i === 0 && PILA.length === 1) { $('#cuerpo')?.scrollTo({ top:0 }); return; } volverA(i); };
A['cerrar-ventana'] = () => cerrarVentana();
A['cerrar-hoja'] = () => cerrarHoja();
A['bienvenida'] = el => { pintarBienvenida(el.dataset.v); window.scrollTo({ top:0 }); };
A['mi-cuenta'] = () => { const u = yo();
  hoja('Tu cuenta', `<div class="row" style="margin-bottom:14px">${avatar(u, 'lg')}<div class="grow"><b style="font-size:16px">${esc(u.nombre)}</b>
      <div class="muted small">${esc(u.casa)} · ${esc(u.email)}</div>
      <div class="muted tiny">${{ vecino:'Vecino/a', admin:'Administración', guardia:'Garita' + (turnoAbierto() ? ' · turno ' + esc(turnoAbierto().turno) + ': ' + esc(aLista(turnoAbierto().guardias).join(', ')) : '') }[modoActivo()]}${modoActivo() === 'vecino' ? ' · la app es personal; el voto y las expensas son del lote' : ''}</div></div></div>
    ${puedeAdministrar() ? superficie({ a:'cambiar-modo', icon: modoActivo() === 'admin' ? 'sliders' : 'home', color: modoActivo() === 'admin' ? 'accent' : 'ok',
      t: modoActivo() === 'admin' ? 'Estás como Administración' : 'Estás como vecino/a',
      s: modoActivo() === 'admin' ? 'Tocá para pasar a tu vista de vecino/a' : 'Tocá para volver al panel de administración', cls:'acento' }) : ''}
    <div class="card" style="margin-bottom:8px"><div class="lbl">Modo de pantalla · ahora está en ${modoActual()}</div>
      <div class="seg">${[['auto', 'Automático', 'sunrise'], ['light', 'Día', 'sun'], ['dark', 'Noche', 'moon']].map(([k, t, ic]) =>
        `<label><input type="radio" name="temaRapido" ${(Store.sesion.tema || 'auto') === k ? 'checked' : ''} data-a="tema" data-v="${k}"><span>${I(ic)}${t}</span></label>`).join('')}</div>
      <div class="ayuda">En automático sigue la salida y la puesta del sol en Ushuaia (hoy: ${Clima.sol().sale} a ${Clima.sol().pone}).</div></div>
    ${esGuardia() ? superficie({ a:'cerrar-turno', icon:'logout', color:'warn', t:'Cerrar el turno', s:'Deja anotado quién trabajó y sale de la app' }) : ''}
    ${(() => { const otros = esGuardia() ? [] : Store.s.users.filter(x => x.estado === 'aprobado' && x.casa === u.casa && x.id !== u.id);
      return otros.length ? `<div class="card plana small" style="margin-bottom:8px">${I('users')} En ${esc(u.casa)} también tienen cuenta: ${otros.map(x => esc(x.nombre.split(' ')[0])).join(', ')}. Entre todos son un solo lote: un voto y una expensa.</div>` : ''; })()}
    ${superficie({ a:'cambiar-clave', icon:'key', color:'brand', t: Nube.activa() ? 'Cambiar mi contraseña' : 'Cambiar mi clave', s:'Cuando quieras, desde acá' })}
    ${superficie({ a:'cambiar-email', icon:'mail', color:'sky', t:'Cambiar mi correo', s:esc(u.email) })}
    ${esGuardia() ? '' : superficie({ a:'abrir-ayuda', icon:'info', color:'ok', t:'Preguntas frecuentes', s:'Cómo se hace cada cosa en la app' })}
    ${superficie({ a:'diagnostico', icon:'info', color:'sky', t:'Datos técnicos de esta sesión', s:'Por si algo no anda y hay que contarlo' })}
    ${superficie({ a:'actualizar-app', icon:'refresh', color:'warn', t:'Actualizar la app', s:'Si algo quedó raro: baja todo de nuevo. No borra datos.' })}
    ${superficie({ a:'salir', icon:'logout', color:'danger', t:'Cerrar sesión', s:'Salís de esta app en este equipo', cls:'peligro' })}`); };

/* Una pantalla chica con todo lo que hace falta para entender un problema sin
   tener que adivinar: quién sos para la app, en qué modo estás, qué versión
   corre y si está hablando con la base del barrio. Se copia de un toque. */
A['actualizar-app'] = async () => {
  if (!await confirmar('Actualizar la app', 'Se baja el programa de nuevo y la app se reinicia. Los datos del barrio están en la nube: no se pierde nada.', { si:'Actualizar' })) return;
  toast('Bajando la versión nueva…', 'refresh');
  reinstalar();
};

A['diagnostico'] = () => {
  const u = yo(), c = Store.s.config;
  const datos = {
    version: window.VERSION || 'sin sellar',
    cuenta: u?.email || '—',
    nombre: u?.nombre || '—',
    rol: u?.rol || '—',
    estado: u?.estado || '—',
    casa: u?.casa || '(vacía)',
    modo: modoActivo(),
    puedeAdministrar: puedeAdministrar(),
    esAdmin: esAdmin(),
    tieneLote: tengoLote(),
    conexion: Conexion.estado,
    nube: typeof Nube !== 'undefined' && Nube.activa(),
    vecinosCargados: Store.s.users.length,
    padron: Store.s.padron.length,
    ventana: PILA.map(v => v.id).join(' → '),
    pantalla: `${innerWidth}×${innerHeight}`,
    correo: Correo.configurado() ? 'configurado' : 'sin configurar',
  };
  const txt = Object.entries(datos).map(([k, v]) => `${k}: ${v}`).join('\n');
  hoja('Datos técnicos', `
    <div class="card lista">${Object.entries(datos).map(([k, v]) =>
      `<div class="it"><div class="txt"><b>${esc(k)}</b><span class="mono small">${esc(String(v))}</span></div></div>`).join('')}</div>
    <button class="btn btn-pri btn-block" data-a="copiar" data-v="${esc(txt)}">${I('copy')}Copiar todo</button>
    <p class="muted tiny" style="margin-top:10px">Si algo no funciona, copiá esto y pasalo: dice exactamente qué versión estás usando y cómo te ve la app.</p>`);
};

/* ---------------- cambiar la clave ---------------- */
A['cambiar-clave'] = () => {
  const nube = Nube.activa();
  hoja(nube ? 'Cambiar mi contraseña' : 'Cambiar mi clave', `<form data-f="cambiar-clave">
    <div class="field"><label>${nube ? 'Contraseña actual' : 'Clave actual'}</label><input name="vieja" type="password" required autocomplete="current-password"></div>
    <div class="field"><label>${nube ? 'Contraseña nueva' : 'Clave nueva'}</label><input name="nueva" type="password" required minlength="${nube ? 6 : 4}" autocomplete="new-password" placeholder="${nube ? 'Mínimo 6 caracteres' : 'Mínimo 4 caracteres'}"></div>
    <div class="field"><label>Repetila</label><input name="nueva2" type="password" required autocomplete="new-password"></div>
    <button class="btn btn-pri btn-block">${I('key')}Guardar</button>
    ${nube ? `<button type="button" class="btn btn-sec btn-block" style="margin-top:8px" data-a="olvide-adentro">No me acuerdo la actual</button>` : ''}
    <p class="muted tiny" style="margin:10px 0 0">Es personal: no la compartas. Si alguien más de tu casa usa la app, que tenga su propia cuenta.</p></form>`);
};
F['cambiar-clave'] = async d => {
  const u = yo();
  if (d.nueva !== d.nueva2){ toast('Las dos no coinciden', 'alert'); return; }
  if (Nube.activa()){
    try {
      await Nube.entrar(u.email, d.vieja);          /* confirma que es quien dice ser */
      await Nube.cambiarClave(d.nueva);
      cerrarHoja(); toast('Contraseña cambiada', 'check');
    } catch(e){
      toast({ 'auth/invalid-credential':'La contraseña actual no coincide', 'auth/wrong-password':'La contraseña actual no coincide',
        'auth/weak-password':'La nueva es muy corta' }[e.code] || e.message, 'alert');
    }
    return;
  }
  if ((u.clave || '').toUpperCase() !== String(d.vieja).trim().toUpperCase()){ toast('La clave actual no coincide', 'alert'); return; }
  Store.cambiar(s => { s.users.find(x => x.id === u.id).clave = String(d.nueva).trim().toUpperCase(); });
  cerrarHoja(); toast('Clave cambiada', 'check');
};
A['cambiar-email'] = () => {
  const u = yo(), nube = Nube.activa();
  hoja('Cambiar mi correo', `<form data-f="cambiar-email">
    <p class="muted small" style="margin:0 0 12px">Ahora entrás con <b>${esc(u.email)}</b>.</p>
    <div class="field"><label>Correo nuevo</label><input name="email" type="email" required autocomplete="email"></div>
    ${nube ? `<div class="field"><label>Tu contraseña</label><input name="clave" type="password" required autocomplete="current-password"></div>` : ''}
    <button class="btn btn-pri btn-block">${I('mail')}Cambiar</button>
    ${nube ? `<p class="muted tiny" style="margin:10px 0 0">Te llega un aviso a la dirección nueva: hay que confirmarlo desde ahí. Hasta entonces seguís entrando con la vieja.</p>` : ''}</form>`);
};
F['cambiar-email'] = async d => {
  const u = yo(), email = (d.email || '').trim().toLowerCase();
  if (email === u.email){ toast('Es el mismo correo', 'info'); return; }
  if (Store.s.users.some(x => x.id !== u.id && (x.email || '').toLowerCase() === email)){ toast('Ese correo ya está en uso en el barrio', 'alert'); return; }
  if (Nube.activa()){
    try {
      await Nube.entrar(u.email, d.clave);
      const r = await Nube.cambiarEmail(email);
      cerrarHoja();
      toast(r === 'confirmar' ? 'Revisá el correo nuevo y confirmá desde ahí' : 'Correo cambiado', 'mail');
    } catch(e){
      toast({ 'auth/invalid-credential':'La contraseña no coincide', 'auth/wrong-password':'La contraseña no coincide',
        'auth/email-already-in-use':'Ese correo ya tiene cuenta', 'auth/invalid-email':'Ese correo no es válido',
        'auth/operation-not-allowed':'Firebase pide confirmar el correo actual primero' }[e.code] || e.message, 'alert');
    }
    return;
  }
  Store.cambiar(s => { s.users.find(x => x.id === u.id).email = email; });
  cerrarHoja(); toast('Correo cambiado', 'mail');
};
A['olvide-adentro'] = async () => {
  const u = yo();
  try { await Nube.recuperar(u.email); cerrarHoja(); toast('Te mandamos un correo para cambiarla', 'mail'); }
  catch(e){ toast('No se pudo mandar: ' + e.message, 'alert'); }
};
/* ---------------- los dos brazos: vecino o Administración ---------------- */
function elegirModo({ alEntrar = false } = {}){
  const u = yo(); if (!puedeAdministrar()) return;
  const conLote = tengoLote();
  hoja(alEntrar ? `Hola, ${esc(u.nombre.split(' ')[0])}` : 'Cambiar de modo', `
    <p class="muted small" style="margin:0 0 14px">${alEntrar ? (conLote ? 'Administrás el barrio y además sos vecino/a de ' + esc(u.casa) + '. ¿Desde dónde querés entrar?' : 'Administrás el barrio. ¿Desde dónde querés entrar?') : 'Podés cambiar cuando quieras: la app se reacomoda entera.'}</p>
    ${!conLote ? aviso('warn', 'info', 'Tu cuenta no tiene lote asignado', `Figura como <b>${esc(u.casa || 'sin casa')}</b>. En modo vecino no vas a ver expensas ni visitas propias. Podés corregirlo en Administración → Vecinos.`) : ''}
    <button class="superficie ${modoActivo() === 'vecino' ? 'acento' : ''}" data-a="modo" data-v="vecino">
      <span class="ic ic-ok">${I('home')}</span><span class="txt"><b>${conLote ? 'Como vecino/a de ' + esc(u.casa) : 'Como vecino/a'}</b>
      <small>Lo mismo que ve cualquier vecino: tu casa, el barrio y Ushuaia. Sin nada de la gestión.</small></span>${I('right')}</button>
    <button class="superficie ${modoActivo() === 'admin' ? 'acento' : ''}" data-a="modo" data-v="admin">
      <span class="ic ic-accent">${I('sliders')}</span><span class="txt"><b>Como Administración</b>
      <small>Solo la gestión: inscripciones, padrón, contabilidad, expensas, garita y reclamos. Lo tuyo como vecino queda en el otro modo.</small></span>${I('right')}</button>
    <p class="muted tiny" style="margin:14px 0 0">Esta elección es solo tuya, porque administrás el barrio. Los vecinos y la guardia no la ven.</p>`);
}
A['cambiar-modo'] = () => elegirModo();
A['modo'] = el => {
  const nuevo = el.dataset.v;
  Store.sesion.modo = nuevo; Store.guardarSesion();
  cerrarHoja();
  PILA.length = 0;
  history.replaceState({ n:1 }, '');
  pintar();
  toast(nuevo === 'admin' ? 'Estás en la Administración' : 'Estás como vecino/a', nuevo === 'admin' ? 'sliders' : 'home');
};

A['demo'] = el => { entrarComo(el.dataset.v); toast(`Entraste como ${nombreDe(el.dataset.v)}`, 'login'); };
/* =========================================================
   TOCAR UNA FOTO = VERLA BIEN Y BAJARLA AL EQUIPO
   En la lista se ve la vista previa chica (96 px). Al tocarla:
     1. si la foto está en este equipo (la subí yo), se usa esa;
     2. si no, se baja la copia "para bajar" que dejó quien la subió
        (barrio/fotosDescarga, 1280 px, se borra sola a los pocos días);
     3. las fotos del frente de las casas y de las mascotas, de su lugar.
   Se muestra grande y se guarda en el equipo (en la computadora se
   descarga sola; en el celular, con el botón, que abre "Guardar imagen").
   En la app no queda guardada: no ocupa lugar ni en la base ni acá.
   ========================================================= */
let fotoAbierta = null;
A['ver-foto'] = async el => {
  const id = el.dataset.foto; if (!id) return;
  if (el.dataset.bajando) return;
  el.dataset.bajando = '1'; el.classList.add('bajando');
  let v = await Fotos.sacar(id, false);
  try { if (!v && typeof Nube !== 'undefined' && Nube.activa()) v = await Nube.bajarDescarga(id); } catch(e){}
  if (!v) v = await Fotos.sacar(id);
  delete el.dataset.bajando; el.classList.remove('bajando');
  if (!v){ toast('Esa foto ya no está disponible para bajar: las copias duran unos días y esta es anterior o ya venció.', 'image'); return; }
  el.style.backgroundImage = `url('${v}')`; el.classList.remove('solo-mini');
  const nombre = `barrio-bahia-cauquen-${hoyISO()}-${id}.jpg`;
  fotoAbierta = { v, nombre };
  hoja('Foto', `<img class="foto-full" src="${v}" alt="">
    <div class="btns" style="margin-top:12px"><button class="btn btn-pri grow" data-a="guardar-foto">${I('download')}Guardar en este equipo</button></div>
    <p class="muted small" style="margin:8px 2px 0">Queda en las descargas o en la galería de este equipo, no en la app.</p>`, { ancho:'760px' });
  if (matchMedia('(pointer:fine)').matches && await guardarFotoEnEquipo(v, nombre)) toast('La foto se guardó en las descargas', 'download');
};
A['guardar-foto'] = async () => { if (fotoAbierta && await guardarFotoEnEquipo(fotoAbierta.v, fotoAbierta.nombre)) toast('Foto guardada en este equipo', 'download'); };
A['copiar'] = el => copiar(el.dataset.v);
A['ver-inscripcion'] = el => { location.hash = '#/inscripcion/' + el.dataset.v; pintarInscripcion(el.dataset.v); };

/* Página pública que el vecino abre desde el mail para ver su inscripción. */
function pintarInscripcion(token){
  const u = Store.s.users.find(x => x.token && x.token === token);
  const estado = !u ? null : u.estado;
  const txt = { pendiente:['En revisión','La Administración todavía no la revisó. Te avisamos por correo.','clock','warn'],
    aprobado:['Aprobada','Ya podés entrar con tu email y la clave que te mandamos por correo.','check','ok'],
    rechazado:['No aprobada','Comunicate con la Administración del barrio.','x','danger'] }[estado] || ['Enlace no válido','Puede que la inscripción se haya dado de baja.','alert','danger'];
  $('#app').innerHTML = `<section class="bienvenida"><div class="foto" style="background-image:url('${Clima.portada()}')"></div>
    <div class="marca"><span class="logo">${LOGO}</span><div><b style="font-size:16px">Barrio ${esc(Store.s.config.nombre)}</b></div></div>
    <h1 style="font-size:34px">Tu inscripción</h1>
    <div class="panel">
      ${u ? `<p style="margin:0 0 12px"><b>${esc(u.nombre)}</b><br><span style="opacity:.85">${esc(u.casa)} · DNI ${esc(String(u.dni || '').replace(/\d(?=\d{3})/g, '•'))} · ${esc(u.email)}</span></p>` : ''}
      <div class="aviso a-${txt[3]}">${I(txt[2])}<div class="txt"><b>${txt[0]}</b>${txt[1]}</div></div>
      <button class="btn btn-pri btn-block" data-a="ir-app">${I('login')}Ir a la app</button>
    </div></section>`;
}
F['completar'] = async d => {
  const dni = soloDigitos(d.dni);
  if (dni.length < 7 || dni.length > 9){ toast('Revisá el DNI', 'alert'); return; }
  try {
    const u = await Nube.completar({ nombre:d.nombre.trim(), casa:d.casa, dni, tel:(d.tel || '').trim() });
    if (u.estado === 'aprobado'){ toast('Listo: quedás como Administración del barrio', 'shield'); location.reload(); }
    else { toast('Ficha enviada. La Administración la revisa.', 'send'); pintarBienvenida('espera'); }
  } catch(e){ toast('No se pudo guardar: ' + e.message, 'alert'); }
};
A['olvide'] = async () => {
  const email = prompt('¿Cuál es tu email?');
  if (!email) return;
  try { await Nube.recuperar(email.trim().toLowerCase()); toast('Te mandamos un correo para cambiar la contraseña', 'mail'); }
  catch(e){ toast('No pudimos mandarlo: ' + e.message, 'alert'); }
};
A['salir-espera'] = async () => { await Nube.salir(); pintarBienvenida(); };
A['ir-app'] = () => { history.replaceState({ n:1 }, '', location.pathname); pintarBienvenida(estadoInscripcionModo()); };
const estadoInscripcionModo = () => 'entrar';
A['tema'] = el => { Store.sesion.tema = el.dataset.v; Store.guardarSesion(); aplicarTema();
  const d = $('#hoja'); if (d && d.open) A['mi-cuenta'](); else refrescar();
  toast(el.dataset.v === 'auto' ? `Automático: ahora está en modo ${modoActual()}` : `Modo ${el.dataset.v === 'dark' ? 'noche' : 'día'}`, el.dataset.v === 'dark' ? 'moon' : 'sun'); };

function entrarComo(id){
  Store.sesion.userId = id;
  Store.sesion.visitaAnterior = Store.sesion.ultimaVisita || 0;
  Store.sesion.ultimaVisita = Date.now();
  Store.guardarSesion();
  PILA.length = 0;
  history.replaceState({ n:1 }, '');
  pintar();
  Motor.correr();
  if (puedeAdministrar()) setTimeout(() => elegirModo({ alEntrar:true }), 250);
}
F['entrar'] = async d => {
  const email = (d.email || '').trim().toLowerCase();
  if (Nube.activa()){
    try { await Nube.entrar(email, d.clave); toast('¡Bienvenido/a!', 'home'); }
    catch(e){ toast({ 'auth/invalid-credential':'El email o la contraseña no coinciden', 'auth/user-not-found':'No encontramos ese email',
      'auth/wrong-password':'La contraseña no coincide', 'auth/too-many-requests':'Demasiados intentos: esperá unos minutos' }[e.code] || e.message, 'alert'); }
    return;
  }
  const clave = (d.clave || '').trim().toUpperCase();
  const u = Store.s.users.find(x => x.email.toLowerCase() === email);
  if (!u){ toast('No encontramos ese email', 'alert'); return; }
  if (u.estado !== 'aprobado'){ toast(u.estado === 'pendiente' ? 'Tu pedido todavía está en revisión' : 'Ese usuario no está activo', 'clock'); return; }
  if ((u.clave || '').toUpperCase() !== clave){ toast('La clave no coincide', 'x'); return; }
  entrarComo(u.id);
  toast(`¡Hola, ${u.nombre.split(' ')[0]}!`, 'home');
};
F['registro'] = async d => {
  const email = (d.email || '').trim().toLowerCase();
  /* La garita se inscribe una sola vez con su correo; no tiene lote ni DNI.
     Queda pendiente igual que cualquiera y la Administración la aprueba:
     al aprobarla, la app le da los permisos de garita. */
  if (esCorreoGarita(email)){ d.nombre = 'Garita'; d.casa = 'Garita'; d.dni = d.dni || '00000000'; }
  const dni = soloDigitos(d.dni);
  if (dni.length < 7 || dni.length > 9){ toast('Revisá el DNI', 'alert'); return; }
  if (Nube.activa()){
    if (!d.clave || d.clave.length < 6){ toast('La contraseña tiene que tener al menos 6 caracteres', 'lock'); return; }
    try {
      const u = await Nube.registrar({ nombre:d.nombre.trim(), casa:d.casa, dni, email, tel:(d.tel || '').trim(), clave:d.clave,
        profesion:(d.profesion || '').trim(), publicar:!!d.publicar });
      if (u.estado === 'aprobado'){ toast('Primera cuenta del barrio: quedás como Administración', 'shield'); return; }
      /* Quien se inscribe todavía no puede leer los ajustes del barrio: la
         dirección del correo y el mail de la Administración salen de la
         copia pública que deja la Administración. */
      await Correo.traerPublico();
      const mailAdmin = Correo.datos()?.adminEmail || Store.s.config.adminEmail;
      await Correo.enviar({ para:email, asunto:'Recibimos tu inscripción', tipo:'inscripcion',
        html:Correo.plantilla('Recibimos tu inscripción', `<p>Hola ${esc(u.nombre.split(' ')[0])}: tu pedido de acceso para <b>${esc(u.casa)}</b> quedó registrado. Cuando la Administración lo apruebe vas a poder entrar con tu email y la contraseña que elegiste.</p>`, { texto:'Abrir la app', url:urlApp() }) });
      if (mailAdmin) Correo.enviar({ para:mailAdmin, asunto:`Nueva inscripción: ${u.nombre} (${u.casa})`, tipo:'aviso-admin',
        html:Correo.plantilla('Nueva inscripción', `<p><b>${esc(u.nombre)}</b><br>${esc(u.casa)} · DNI ${esc(dni)}<br>${esc(email)}</p><p>Aprobala desde Administración → Inscripciones.</p>`, { texto:'Abrir la app', url:urlApp() }) });
      pintarBienvenida('espera');
    } catch(e){ toast({ 'auth/email-already-in-use':'Ese email ya tiene cuenta. Probá "Entrar".', 'auth/weak-password':'La contraseña es muy corta' }[e.code] || e.message, 'alert'); }
    return;
  }
  const yaEsta = Store.s.users.find(u => u.email.toLowerCase() === email || (u.dni && u.dni === dni));
  Store.sesion.pendienteEmail = email; Store.guardarSesion();
  if (yaEsta){
    /* No se dice si el email o el DNI existen: se responde igual en los dos casos
       y se le reenvía el enlace a la casilla que ya estaba registrada. */
    if (yaEsta.token) Correo.enviar({ para:yaEsta.email, asunto:'Tu inscripción en el barrio', tipo:'inscripcion-reenvio',
      html:Correo.plantilla('Tu inscripción', `<p>Hola ${esc(yaEsta.nombre.split(' ')[0])}: alguien pidió de nuevo el acceso con tus datos. Si fuiste vos, seguí tu inscripción desde acá.</p>`, { texto:'Ver mi inscripción', url:urlApp('inscripcion/' + yaEsta.token) }) });
    toast('Inscripción recibida. Revisá tu correo.', 'mail'); pintarBienvenida(); return;
  }
  const token = uid() + uid();
  const nuevo = { id:'u' + uid(), nombre:d.nombre.trim(), casa:d.casa.trim(), dni, email, tel:(d.tel || '').trim(), rol:'vecino', estado:'pendiente', clave:'',
    profesion:(d.profesion || '').trim(), enDirectorio:!!d.publicar, mostrarTel:!!d.publicar,
    token, skills:'', consentimiento:Date.now(), createdAt:Date.now(), vehiculos:[], mascotas:[] };
  Store.cambiar(s => {
    s.users.push(nuevo);
    notificar(s, { para:'rol:admin', titulo:'Nueva inscripción', texto:`${nuevo.nombre} · ${nuevo.casa} · DNI ${nuevo.dni}`, icon:'user', color:'accent', link:'admin:solicitudes' });
  });
  const salio = await Correo.enviar({ para:email, asunto:'Recibimos tu inscripción', tipo:'inscripcion',
    html:Correo.plantilla('Recibimos tu inscripción', `<p>Hola ${esc(nuevo.nombre.split(' ')[0])}:</p>
      <p>Tu pedido de acceso para <b>${esc(nuevo.casa)}</b> quedó registrado. La Administración lo revisa y, cuando lo apruebe, te llega otro correo con tu clave.</p>
      <p>Desde este enlace podés ver en qué estado está tu inscripción cuando quieras:</p>`, { texto:'Ver mi inscripción', url:urlApp('inscripcion/' + token) }) });
  if (Store.s.config.adminEmail) Correo.enviar({ para:Store.s.config.adminEmail, asunto:`Nueva inscripción: ${nuevo.nombre} (${nuevo.casa})`, tipo:'aviso-admin',
    html:Correo.plantilla('Nueva inscripción', `<p><b>${esc(nuevo.nombre)}</b><br>${esc(nuevo.casa)} · DNI ${esc(nuevo.dni)}<br>${esc(nuevo.email)} · ${esc(nuevo.tel || 'sin teléfono')}</p><p>Aprobala o rechazala desde Administración → Inscripciones.</p>`, { texto:'Abrir la app', url:urlApp() }) });
  toast(salio ? 'Listo. Te mandamos un correo con el enlace.' : 'Inscripción enviada. La Administración te va a contactar.', 'mail');
  if (!salio) Store.sesion.enlaceInscripcion = urlApp('inscripcion/' + token), Store.guardarSesion();
  pintarBienvenida();
};
A['salir'] = async () => {
  if (!await confirmar('Cerrar sesión', 'Vas a tener que volver a entrar con tu correo y tu clave.', { si:'Cerrar sesión' })) return;
  await cerrarSesion();
};
async function cerrarSesion(){
  cerrarHoja();
  Store.sesion.turnoId = '';
  if (typeof Nube !== 'undefined' && Nube.activa()){
    await Nube.salir();
    /* En un equipo compartido no puede quedar nada del barrio después de
       salir: se borra lo que vino de la nube y queda solo la preferencia de
       pantalla. Al volver a entrar se baja todo de nuevo. */
    [...Nube.ZONAS.barrio, ...Nube.ZONAS.privado, ...Nube.ZONAS.staff].forEach(col => { if (Array.isArray(Store.s[col])) Store.s[col] = []; });
    Store.s.notifs = []; Store.s.motorLog = {}; Nube.ultimo = {}; Nube.arrancada = false;
    Store.guardar();
  }
  Store.sesion.userId = null; Store.sesion.modo = ''; Store.guardarSesion(); PILA.length = 0; $('#app').innerHTML = ''; pintar();
}

/* =========================================================
   NINGÚN BOTÓN SE QUEDA MUDO
   -------------------------------------------------------
   Un botón que no hace nada es lo peor que le puede pasar a esta app: la
   persona toca, toca otra vez, y no tiene forma de saber si se rompió algo o
   si tocó donde no era. Pasó, y costó días entender por qué.

   Desde acá, cualquier error de una acción sale en pantalla con el nombre de
   la acción y el motivo. No arregla el error, pero lo saca de la oscuridad:
   con ese texto se sabe en un minuto qué archivo falta o qué se rompió.
   ========================================================= */
let fallasContadas = 0;
function avisarFalla(err, donde){
  console.error('Falló ' + donde, err);
  if (fallasContadas++ > 6) return;                 /* no tapar la pantalla de avisos */
  const motivo = (err && err.message) ? err.message : String(err);
  toast(`No se pudo hacer "${donde}": ${motivo}`, 'alert');
}
/* Si el que se rompe es el programa entero (por ejemplo, falta un archivo),
   se avisa igual y se ofrece la reparación, en vez de quedar en silencio. */
window.addEventListener('error', e => {
  if (!e.message) return;
  if (fallasContadas++ > 6) return;
  const falta = typeof piezasQueFaltan === 'function' ? piezasQueFaltan() : [];
  if (falta.length){ toast('Falta parte del programa. Abrí Tu cuenta → Actualizar la app.', 'alert'); return; }
  toast('Algo se rompió: ' + e.message, 'alert');
});
window.addEventListener('unhandledrejection', e => {
  if (fallasContadas++ > 6) return;
  const r = e.reason;
  toast('Algo quedó a medias: ' + ((r && r.message) ? r.message : r), 'alert');
});

/* ---------------- delegación de eventos ---------------- */
document.addEventListener('click', e => {
  const el = e.target.closest('[data-a]');
  if (!el) return;
  const f = A[el.dataset.a];
  if (!el.dataset.a) return;   /* data-a vacío: no es un botón */
  if (!f){ console.warn('Acción sin código:', el.dataset.a); toast(`Esa acción no está en esta versión ("${el.dataset.a}")`, 'alert'); return; }
  /* Los tildes y opciones tienen que poder marcarse: a ellos no se les frena el clic. */
  if (el.tagName !== 'INPUT') e.preventDefault();
  try { const r = f(el, e); if (r && r.catch) r.catch(err => avisarFalla(err, el.dataset.a)); }
  catch(err){ avisarFalla(err, el.dataset.a); }
});
document.addEventListener('submit', e => {
  const form = e.target.closest('form[data-f]');
  if (!form) return;
  e.preventDefault();
  const f = F[form.dataset.f];
  if (!f){ toast(`Ese formulario no está en esta versión ("${form.dataset.f}")`, 'alert'); return; }
  const fd = new FormData(form), d = {};
  for (const [k, v] of fd.entries()){ if (v instanceof File) continue; if (k in d){ d[k] = [].concat(d[k], v); } else d[k] = v; }
  try { const r = f(d, form, e); if (r && r.catch) r.catch(err => avisarFalla(err, form.dataset.f)); }
  catch(err){ avisarFalla(err, form.dataset.f); }
});
/* Las entradas de archivo con data-foto-in guardan la foto en el
   equipo y dejan { fotoId, mini } en un campo oculto. */
document.addEventListener('change', async e => {
  const inp = e.target.closest('input[type=file][data-foto-in]');
  if (!inp || !inp.files[0]) return;
  const destino = document.getElementById(inp.dataset.fotoIn);
  const prev = document.getElementById(inp.dataset.fotoIn + 'Prev');
  try {
    toast('Preparando la foto…', 'image');
    const f = await Fotos.desdeArchivo(inp.files[0]);
    destino.value = JSON.stringify(f);
    if (prev){ prev.style.backgroundImage = `url('${f.mini}')`; prev.classList.add('lleno'); prev.innerHTML = ''; Fotos.sacar(f.fotoId).then(v => v && (prev.style.backgroundImage = `url('${v}')`)); }
    toast('Foto lista. Queda guardada en este equipo.', 'check');
  } catch(err){ toast('No se pudo leer esa imagen', 'alert'); }
});
const leerFoto = v => { try { return v ? JSON.parse(v) : null; } catch(e){ return null; } };
/* La foto de algo que ven otros (un aviso, un reclamo, una obra): además de
   la vista previa que va en el registro, deja por unos días una copia
   buena "para bajar", que cada uno trae recién cuando la toca. */
const fotoParaOtros = (v, dias = 7) => {
  const f = leerFoto(v);
  if (f && f.fotoId && typeof Nube !== 'undefined' && Nube.activa()) setTimeout(() => Nube.compartirDescarga(f.fotoId, dias), 200);
  return f;
};
const campoFoto = (id, etiqueta = 'Foto (opcional)') => `
  <div class="field"><label>${etiqueta}</label><div class="foto-in">
    <label class="foto-prev" id="${id}Prev" style="cursor:pointer">${I('camera')}<input type="file" accept="image/*" capture="environment" data-foto-in="${id}" hidden></label>
    <div class="muted small">A los demás les llega una vista previa; la foto buena la bajan al tocarla (queda para bajar unos días).</div>
    <input type="hidden" name="foto" id="${id}"></div></div>`;

/* Un cambio de otra pestaña, o de otro vecino a través de la base del barrio. */
Store.alCambiar(remoto => {
  if (!yo()){ if (remoto && !$('#lienzo')) return; return; }
  refrescarPronto();
  if (remoto) avisosDelSistema();
});

/* ---------------- arranque ----------------
   La app se dibuja PRIMERO y se conecta después. Antes esperaba a que
   Firebase respondiera para mostrar algo, y con una conexión lenta se veía
   un "Conectando con el barrio…" durante varios segundos con todo trabado.
   Ahora entra directo: el puntito del encabezado dice si ya está conectada, y
   lo que llega de la base se va sumando solo.
   ========================================================= */
function rutaPublica(){
  const h = location.hash;
  if (h.startsWith('#/pedir/')){ pintarPedirPase(decodeURIComponent(h.slice(8))); return true; }
  if (h.startsWith('#/inscripcion/')){ pintarInscripcion(decodeURIComponent(h.slice(14))); return true; }
  return false;
}

/* Lo que viene de internet (clima, vuelos) se pide en paralelo y se dibuja
   cuando llega: nunca frena la apertura de la app. */
function datosDeAfuera(){
  Clima.pedir().then(() => { aplicarTema(); refrescarPronto(); });
  Vuelos.pedir().then(() => refrescarPronto()).catch(() => {});
  if (typeof Cruceros !== 'undefined') Cruceros.pedir().then(v => { if (v) refrescarPronto(); }).catch(() => {});
  if (typeof Promos !== 'undefined') Promos.pedir().then(v => { if (v) refrescarPronto(); }).catch(() => {});
}

/* =========================================================
   QUE NUNCA QUEDE UNA APP MITAD VIEJA Y MITAD NUEVA
   -------------------------------------------------------
   El navegador y el service worker guardan el programa para que la app abra
   sin internet. Si por lo que sea queda guardado un index.html viejo, ese
   index carga una LISTA DE ARCHIVOS vieja: falta alguno de los .js y media
   app deja de responder sin decir por qué. Es exactamente el cuadro que se
   ve desde afuera: se entra, se elige Administración, y después no se puede
   volver a vecino, no abre ninguna ventana, no están los lomos del costado
   y no aparece la tira de promociones del hotel.

   Por eso, antes de dibujar nada, se comprueba que TODAS las piezas estén.
   Si falta una, se tira lo guardado, se da de baja el service worker y se
   recarga una sola vez: la app vuelve entera y la persona no tiene que
   saber nada de cachés. Si después de esa recarga sigue faltando algo, no
   se recarga en bucle: se explica en pantalla qué hacer.
   ========================================================= */
const PIEZAS = [
  ['js/icons.js',      () => typeof I],
  ['js/agenda.js',     () => typeof AGENDA],
  ['js/padron.js',     () => typeof LOTES],
  ['js/core.js',       () => typeof Store],
  ['js/seed.js',       () => typeof seed],
  ['js/clima.js',      () => typeof Clima],
  ['js/calendario.js', () => typeof diaInfo],
  ['js/v-inicio.js',   () => typeof teja],
  ['js/v-comunidad.js',() => typeof TIPOS_POST],
  ['js/v-gestion.js',  () => typeof Promos],
  ['js/admin.js',      () => typeof REGLAS],
  ['js/v-vecinos.js',  () => typeof normTxt],
  ['js/v-expensas.js', () => typeof RUBROS],
  ['js/v-plan.js',     () => typeof anioPlan],
  ['js/v-contable.js', () => typeof Libro],
  ['js/v-servicio.js', () => typeof Servicio],
  ['js/v-legal.js',   () => typeof LEGAL],
  ['js/push.js',       () => typeof Push],
  ['js/sismos.js',     () => typeof Sismos],
  ['js/nube.js',       () => typeof Nube],
];
function piezasQueFaltan(){
  const falta = [];
  PIEZAS.forEach(([archivo, hay]) => { let t; try { t = hay(); } catch(e){ t = 'undefined'; } if (t === 'undefined') falta.push(archivo); });
  return falta;
}
/* Borra todo lo guardado del programa (no los datos del barrio) y recarga. */
async function tirarLoGuardado(){
  try { const ks = await caches.keys(); await Promise.all(ks.map(k => caches.delete(k))); } catch(e){}
  try { const rs = await navigator.serviceWorker.getRegistrations(); await Promise.all(rs.map(r => r.unregister())); } catch(e){}
}
async function programaCompleto(){
  const falta = piezasQueFaltan();
  if (!falta.length){ try { sessionStorage.removeItem('bhc.reparando'); } catch(e){} return true; }
  console.error('Faltan piezas del programa:', falta.join(', '));
  let yaIntenté = false;
  try { yaIntenté = !!sessionStorage.getItem('bhc.reparando'); } catch(e){}
  if (yaIntenté){
    document.getElementById('app').innerHTML = `<div class="reparar">
      <h1>La app quedó a medio actualizar</h1>
      <p>Este equipo tiene guardada una versión vieja y no la suelta. No se perdió nada: los datos del barrio están en la nube.</p>
      <p><b>En el celular:</b> cerrá la app del todo y volvé a abrirla. Si sigue igual, borrala de la pantalla de inicio y volvé a instalarla desde el navegador.<br>
         <b>En la computadora:</b> recargá con la tecla Mayúsculas apretada.</p>
      <button class="btn btn-pri btn-grande" onclick="reinstalar()">Intentar de nuevo</button>
      <p class="mini">Faltan: ${falta.join(', ')} · versión ${window.VERSION || 'sin sellar'}</p></div>`;
    return false;
  }
  try { sessionStorage.setItem('bhc.reparando', '1'); } catch(e){}
  document.getElementById('app').innerHTML = `<div class="reparar"><h1>Actualizando la app…</h1><p>Un momento: se está bajando la versión nueva.</p></div>`;
  await tirarLoGuardado();
  const sep = location.search ? '&' : '?';
  location.replace(location.pathname + location.search + sep + 'nuevo=' + Date.now() + location.hash);
  return false;
}
/* Botón de emergencia, siempre a mano desde Tu cuenta. */
async function reinstalar(){
  try { sessionStorage.removeItem('bhc.reparando'); } catch(e){}
  await tirarLoGuardado();
  const sep = location.search ? '&' : '?';
  location.replace(location.pathname + location.search + sep + 'nuevo=' + Date.now());
}

/* Pantalla de espera mientras la base del barrio dice quién está entrando.
   Sin esto, se veía el portal un segundo, la persona empezaba a escribir su
   correo y la app entraba sola por la sesión que ya estaba abierta. */
/* Saca de la pantalla de espera y deja algo usable. Se llama por tiempo, y
   también desde el botón "Entrar igual" de la propia espera.

   Acá estaba la falla: antes esto preguntaba `if (!yo())` antes de dibujar el
   portal. Pero `yo()` es verdadero para cualquiera que ya hubiera entrado
   alguna vez en ese equipo, porque la sesión queda guardada. O sea: justo a
   quien ya usaba la app, la pantalla de espera se le quedaba fija, y esa
   pantalla no tiene un solo botón. La app parecía muerta al tocarla. */
function salirDeLaEspera(){
  if (rutaPublica()) return;
  if (!$('.portal-caja.esperando')) return;   /* ya hay otra cosa dibujada */
  if (yo()) pintar(); else pintarBienvenida();
}
A['salir-espera-ya'] = () => salirDeLaEspera();

function pintarEspera(){
  $('#app').innerHTML = `<div class="portal">
    <div class="portal-foto" style="background-image:url('${Clima.portada()}')"></div>
    <div class="portal-contenido">
      <header class="portal-marca"><span class="logo">${LOGO}</span>
        <div><b>Barrio ${esc(Store.s.config.nombre)}</b><small>${esc(Store.s.config.ciudad)}</small></div></header>
      <div class="portal-caja esperando">
        <div class="cargando"><span></span><span></span><span></span></div>
        <b>Conectando con el barrio…</b>
        <small>Un segundo: estamos viendo si tu sesión sigue abierta.</small>
        <button class="btn btn-sec" data-a="salir-espera-ya">Entrar igual</button>
        <small class="version">Versión ${esc(window.VERSION || 'sin sellar')}</small>
      </div></div></div>`;
}

async function arrancar(){
  Store.cargar();
  aplicarTema();
  history.replaceState({ n:1 }, '');
  if (!await programaCompleto()) return;

  if (Nube.activa()){
    Conexion.poner('conectando');
    /* Primero la espera, no el portal: si la sesión estaba abierta, mostrar
       el portal sería mentirle a la persona y hacerla escribir de gusto. */
    if (!rutaPublica()) pintarEspera();
    /* La espera NO puede quedarse colgada: a los 3 segundos se muestra algo
       que se pueda tocar, pase lo que pase con la base. Si en este equipo ya
       había una sesión, se dibuja la app con lo último que se bajó y la nube
       va completando sola; si no había ninguna, el portal. */
    const aSalvo = setTimeout(salirDeLaEspera, 3000);
    Nube.iniciar()
      .then(() => { clearTimeout(aSalvo); Conexion.poner('vivo');
        if (!rutaPublica()){
          if (yo()){ if (portalEnUso()) avisarSesionAbierta(); else pintar(); }
          else if (!$('.portal')) pintarBienvenida();
        }
        Motor.correr(); })
      .catch(err => { clearTimeout(aSalvo); console.error(err); Conexion.poner('caido');
        salirDeLaEspera();
        toast('No se pudo conectar con la base del barrio. Reintentando…', 'alert'); });
    window.addEventListener('online', () => { Conexion.poner('vivo'); datosDeAfuera(); });
    window.addEventListener('offline', () => Conexion.poner('caido'));
  } else {
    Conexion.poner('local');
    if (rutaPublica()) { datosDeAfuera(); return; }
    if (yo()){
      Store.sesion.visitaAnterior = Store.sesion.ultimaVisita || 0;
      Store.sesion.ultimaVisita = Date.now();
      Store.guardarSesion();
    }
    pintar();
  }

  datosDeAfuera();
  Motor.correr();
  setInterval(() => { Motor.correr(); aplicarTema(); if (yo()) refrescarPronto(); }, 60000);
  /* El clima y los vuelos se refrescan solos, sin que haya que entrar. */
  setInterval(datosDeAfuera, 10 * MIN);
  Avion.arrancar();
  Sismos.arrancar();
  Servicio.arrancar();
  Push.arrancar();
  registrarServiceWorker();
}

/* El service worker guarda el programa para que abra sin internet. Dos
   cuidados: se pide la versión nueva sin pasar por el caché del navegador, y
   cuando entra una versión nueva se recarga UNA vez, para que el index.html y
   los .js sean siempre del mismo juego. */
function registrarServiceWorker(){
  if (!('serviceWorker' in navigator) || !location.protocol.startsWith('http')) return;
  const habia = !!navigator.serviceWorker.controller;
  let recargando = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!habia || recargando) return;            /* la primera instalación no recarga */
    recargando = true;
    location.reload();
  });
  navigator.serviceWorker.register('sw.js', { updateViaCache:'none' }).then(reg => {
    reg.update().catch(() => {});
    setInterval(() => reg.update().catch(() => {}), 30 * MIN);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) reg.update().catch(() => {}); });
  }).catch(() => {});
}
document.addEventListener('DOMContentLoaded', arrancar);

/* =========================================================
   COMUNICADOS IMPORTANTES
   -------------------------------------------------------
   Lo que la Administración necesita que NO se pase por alto. A diferencia
   del pizarrón, que espera a que el vecino entre, un comunicado importante
   se planta en la pantalla apenas la app está abierta, suena una vez y no
   se va hasta que la persona lo acusa.

   Puede ir a TODO el barrio o a UN LOTE. Cuando va a un lote lo ven todas
   las cuentas de ese lote y nadie más: sirve para el aviso puntual
   ("saquen la basura en horario") sin exponer a nadie delante del resto.

   Si es una invitación a una reunión, trae los botones Voy / No puedo. La
   respuesta es POR LOTE, como el voto: si en la casa hay cinco cuentas, la
   respuesta es una sola y cualquiera puede cambiarla. La Administración ve
   el conteo en vivo, y cada comunicado lleva el suyo: abre, cierra y cuenta
   lo propio.
   ========================================================= */
const comunicadosParaMi = () => {
  const u = yo(); if (!u) return [];
  const hoy = hoyISO();
  return (Store.s.comunicados || []).filter(c =>
    !c.archivado &&
    (!c.vence || c.vence >= hoy) &&
    (c.para === 'todos' || c.para === u.casa) &&
    c.creadoPor !== u.id);
};
const comunicadoPendiente = () => {
  const u = yo(); if (!u) return null;
  return comunicadosParaMi().find(c => !(c.vistos || []).includes(u.id)) || null;
};
let comunicadoEnPantalla = null;
function mostrarComunicado(){
  const u = yo(); if (!u) return;
  const c = comunicadoPendiente();
  const box = $('#comunicado');
  if (!c){ if (box) box.remove(); comunicadoEnPantalla = null; return; }
  if (comunicadoEnPantalla === c.id) return;      /* ya está en pantalla */
  comunicadoEnPantalla = c.id;
  /* Suena una vez, por el mismo canal que el SOS (se despierta con el primer
     toque de la persona; si no, el navegador lo dejaría mudo). */
  Sonido.tocar([[740, 0, .45], [988, .22, .55]], 'sine', .2);
  Sonido.vibrar([180, 90, 180]);

  const esMio = c.para !== 'todos';
  const r = (c.respuestas || {})[u.casa];
  const div = box || document.createElement('div');
  div.id = 'comunicado';
  div.className = 'comunicado-pantalla';
  div.innerHTML = `<div class="comunicado-caja">
    <div class="comunicado-cab">
      <span class="ic ic-${c.tipo === 'reunion' ? 'accent' : 'danger'}">${I(c.tipo === 'reunion' ? 'calendar' : 'tack')}</span>
      <div><b>${c.tipo === 'reunion' ? 'Invitación' : 'Comunicado de la Administración'}</b>
        <span>${esMio ? 'Para ' + esc(c.para) : 'Para todo el barrio'} · ${hace(c.at)}</span></div></div>
    <h2>${esc(c.titulo)}</h2>
    <div class="comunicado-texto">${esc(c.texto).replace(/\n/g, '<br>')}</div>
    ${c.tipo === 'reunion' && c.fecha ? `<div class="comunicado-cuando">${I('calendar')}
      <div><b>${fechaLarga(c.fecha)}${c.hora ? ' · ' + esc(c.hora) + ' h' : ''}</b>${c.lugar ? `<span>${esc(c.lugar)}</span>` : ''}</div></div>` : ''}
    ${c.tipo === 'reunion' ? `
      <p class="comunicado-pregunta">¿Va alguien de ${esc(u.casa)}?</p>
      <div class="btns">
        <button class="btn ${r?.va === true ? 'btn-ok' : 'btn-sec'}" data-a="comunicado-voy" data-id="${c.id}" data-v="1">${I('check')}Sí, vamos</button>
        <button class="btn ${r?.va === false ? 'btn-danger-soft' : 'btn-sec'}" data-a="comunicado-voy" data-id="${c.id}" data-v="0">No podemos</button>
      </div>
      <p class="muted tiny" style="margin:10px 0 0">La respuesta es del lote: cualquiera de la casa puede cambiarla hasta la reunión.</p>`
    : ''}
    <button class="btn btn-pri btn-block btn-grande" style="margin-top:14px" data-a="comunicado-visto" data-id="${c.id}">
      ${I('check')}${c.tipo === 'reunion' && !r ? 'Después respondo' : 'Entendido'}</button>
  </div>`;
  if (!box) document.body.appendChild(div);
}
A['comunicado-voy'] = el => {
  const u = yo(), va = el.dataset.v === '1';
  Store.cambiar(s => {
    const c = s.comunicados.find(x => x.id === el.dataset.id); if (!c) return;
    c.respuestas = c.respuestas || {};
    c.respuestas[u.casa] = { va, por:u.id, at:Date.now() };
    notificar(s, { para:c.creadoPor, titulo:`${u.casa}: ${va ? 'asiste' : 'no asiste'}`, texto:c.titulo, icon:'calendar', color: va ? 'ok' : 'warn', link:'comunicados' });
  });
  toast(va ? `Anotado: ${u.casa} asiste` : `Anotado: ${u.casa} no asiste`, va ? 'check' : 'info');
  comunicadoEnPantalla = null; mostrarComunicado();
};
A['comunicado-visto'] = el => {
  const u = yo();
  Store.cambiar(s => {
    const c = s.comunicados.find(x => x.id === el.dataset.id); if (!c) return;
    c.vistos = c.vistos || []; if (!c.vistos.includes(u.id)) c.vistos.push(u.id);
  });
  comunicadoEnPantalla = null;
  $('#comunicado')?.remove();
  setTimeout(mostrarComunicado, 400);            /* si hay otro esperando, sigue */
};
