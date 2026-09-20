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

function abrir(id, param = ''){
  if (!R[id]){ console.warn('Ventana desconocida:', id); toast('Esa sección todavía no está disponible', 'alert'); return; }
  const ya = PILA.findIndex(v => v.id === id);
  if (ya >= 0){
    PILA[ya].param = param;
    const cerrar = PILA.length - 1 - ya;
    PILA.length = ya + 1;
    if (cerrar > 0){ saltando = true; history.go(-cerrar); }
    pintar();
    return;
  }
  PILA.push({ id, param });
  history.pushState({ n: PILA.length }, '');
  ventanaNueva = true;
  pintar();
}
let saltando = false;
function volverA(i){
  const cerrar = PILA.length - 1 - i;
  if (cerrar <= 0){ $('#cuerpo')?.scrollTo({ top:0, behavior:'smooth' }); return; }
  PILA.length = i + 1;
  saltando = true;
  history.go(-cerrar);
  pintar();
}
function cerrarVentana(){ if (PILA.length > 1) volverA(PILA.length - 2); }
window.addEventListener('popstate', e => {
  if (saltando){ saltando = false; return; }
  const d = $('#hoja');
  if (d && d.open){ d.close(); history.pushState({ n: PILA.length }, ''); return; }
  const n = (e.state && e.state.n) || 1;
  if (PILA.length > n){ PILA.length = Math.max(1, n); pintar(); }
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

const inicioId = () => esGuardia() ? 'garita' : 'inicio';
const titulo = (def, p) => typeof def.titulo === 'function' ? def.titulo(p) : def.titulo;

/* ---------------- dibujo ---------------- */
function pintarTop(){
  const u = yo(); if (!u) return;
  const nl = noLeidas().length;
  const modo = modoActivo();
  const rol = { vecino:'Vecino/a', admin:'Administración', guardia:'Guardia' }[modo] || '';
  $('#top').innerHTML = `
    <button class="marca" data-a="volver" data-i="0" aria-label="Ir al inicio">
      <span class="logo">${LOGO}</span>
      <span style="min-width:0"><b>Barrio ${esc(Store.s.config.nombre)}</b>
        <small><span class="en-vivo ${Conexion.estado}" title="${Conexion.texto()}"></span>${esc(u.nombre.split(' ')[0])}${modo === 'vecino' ? `<span class="casa"> · ${esc(u.casa)}</span>`
          : `<span class="rol-chip">${rol}</span><span class="casa"> · ${esc(u.casa)}</span>`}</small></span>
    </button>
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
  while (PILA.length > 1 && !R[PILA[PILA.length - 1].id]) PILA.pop();
  sincronizarHistorial();
  pintarTop();
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
  ventanaNueva = false;
  despuesDePintar();
  pintarAlarmas();
}
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
  pintarTop();
  despuesDePintar();
  pintarAlarmas();
}

/* Al conectar con la base del barrio llegan veinte colecciones casi juntas.
   Si cada una redibujara la ventana, la app se arrastraría y los botones no
   responderían. Se juntan todas en un solo dibujo por cuadro de pantalla. */
let refrescoPedido = false;
function refrescarPronto(){
  if (refrescoPedido) return;
  refrescoPedido = true;
  requestAnimationFrame(() => { refrescoPedido = false; if (yo()) refrescar(); });
}

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
      if (m.dataset.enganchada) return;
      m.dataset.enganchada = '1';
      const pausa = v => m.classList.toggle('quieta', v);
      ['pointerenter','focusin','touchstart','pointerdown'].forEach(ev => m.addEventListener(ev, () => pausa(true), { passive:true }));
      ['pointerleave','focusout','touchend','touchcancel'].forEach(ev => m.addEventListener(ev, () => setTimeout(() => pausa(false), 2500), { passive:true }));
    });
  },
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
   Una alerta se ve en TODAS las terminales del barrio que estén abiertas y
   suena UNA VEZ en cada una. Lo que se muestra depende de quién mira:
     · Guardia y Administración: la ficha completa, con el lugar exacto,
       el teléfono del vecino y los botones para atenderla.
     · El resto de los vecinos: el aviso de que hay una emergencia y en qué
       lote, sin datos personales. Si es médica y el vecino marcó que sabe
       primeros auxilios, además le aparece el botón para acercarse.
     · Quien la mandó: su propio panel, con el botón para cancelarla.
   ========================================================= */
let sosVistos = new Set(), sosSilenciada = new Set(), sosOcultas = new Set();
const sosQueVeo = () => {
  const u = yo(); if (!u) return [];
  return Store.s.sos.filter(x => x.estado !== 'resuelta' && !sosOcultas.has(x.id)).filter(x =>
    esStaff() || x.userId === u.id || x.tipo === 'seguridad' || x.tipo === 'incendio' || (x.tipo === 'medica' && u.respondedor));
};
function pintarAlarmas(){
  const box = $('#alarmas'); if (!box) return;
  const u = yo();
  const act = sosQueVeo();
  if (!u || !act.length){ box.innerHTML = ''; return; }
  /* Suena una sola vez por alerta, en cada terminal. */
  const nuevas = act.filter(x => !sosVistos.has(x.id));
  act.forEach(x => sosVistos.add(x.id));
  if (nuevas.length && !sosSilenciada.has(nuevas[0].id)){
    Sonido.tocar([[988, 0, .35], [988, .28, .35], [988, .56, .5]], 'square', .16);
    Sonido.vibrar([400, 160, 400, 160, 400]);
  }
  const s0 = act[0], t = TIPOS_SOS[s0.tipo] || TIPOS_SOS.otra;
  box.innerHTML = `<div class="sos-pantalla" role="alertdialog" aria-label="Alerta SOS"><div class="sos-caja">
    ${s0.userId === u.id ? sosPanelMio(s0, t) : esStaff() ? sosPanelStaff(s0, t, act.length) : sosPanelVecino(s0, t)}
  </div></div>`;
  Fotos.hidratar(box);
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
        <button class="btn btn-sec" data-a="sos-resuelta" data-id="${s0.id}">Resuelta</button>
        <button class="btn btn-sec" data-a="sos-repetir" data-id="${s0.id}">${I('volume')}Repetir sonido</button>
      </div>
      <a class="btn btn-block sos-b-oscuro" href="tel:${t.llamar}">${I('siren')}Llamar al ${t.llamar}</a>
    </div>`;
}
function sosPanelVecino(s0, t){
  const u = usuario(s0.userId) || {};
  const medicaRespondedor = s0.tipo === 'medica' && yo()?.respondedor;
  return `<div class="sos-cab">${I('siren')}<div><b>${esc(t.nombre)} en el barrio</b><span>${esc(u.casa || 'Un vecino')} · ${hace(s0.at)}</span></div></div>
    <div class="sos-texto">${medicaRespondedor
      ? 'Marcaste que sabés primeros auxilios. Si podés, acercate. La guardia ya fue avisada.'
      : s0.tipo === 'incendio' ? 'Alejate de la zona, no bloquees las calles y dejá paso a los bomberos. La guardia y la Administración ya fueron avisadas.'
      : s0.tipo === 'seguridad' ? 'Quedate adentro, cerrá con llave y no salgas a mirar. La guardia y la Administración ya fueron avisadas.'
      : 'La guardia y la Administración ya fueron avisadas.'}</div>
    <div class="sos-botones">
      ${medicaRespondedor ? `<a class="btn btn-block sos-b-claro" href="tel:107">${I('heart')}Llamar al 107</a>` : ''}
      <div class="btns"><button class="btn btn-sec grow" data-a="sos-entendido" data-id="${s0.id}">${I('check')}Entendido</button></div>
      <a class="btn btn-block sos-b-oscuro" href="tel:${t.llamar}">${I('phone')}Emergencias ${t.llamar}</a>
    </div>`;
}
function sosPanelMio(s0, t){
  return `<div class="sos-cab">${I('siren')}<div><b>Tu alerta está activa</b><span>${esc(t.nombre)} · ${hace(s0.at)}</span></div></div>
    <div class="sos-texto">${s0.estado === 'en_camino' ? `La guardia va en camino (${esc(nombreDe(s0.atiende))}). Quedate en un lugar seguro.`
      : 'La guardia y la Administración ya la recibieron. Quedate en un lugar seguro.'}</div>
    <div class="sos-botones">
      <a class="btn btn-block sos-b-claro" href="tel:${t.llamar}">${I('phone')}Llamar al ${t.llamar}</a>
      ${Store.s.config.garitaTel ? `<a class="btn btn-block sos-b-tenue" href="${telLink(Store.s.config.garitaTel)}">${I('gate')}Llamar a la garita</a>` : ''}
      <div class="btns"><button class="btn btn-sec grow" data-a="sos-cancelar" data-id="${s0.id}">Ya estoy bien, cancelar</button></div>
    </div>`;
}
A['sos-repetir'] = () => { Sonido.tocar([[988, 0, .35], [988, .28, .35], [988, .56, .5]], 'square', .16); Sonido.vibrar([400, 160, 400]); };
/* "Entendido" saca el cartel de la pantalla de este vecino; la alerta sigue
   activa para la guardia hasta que la den por resuelta. */
A['sos-entendido'] = el => { sosSilenciada.add(el.dataset.id); sosOcultas.add(el.dataset.id); pintarAlarmas(); };

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
      ${nube ? grupo('Tu contraseña', campo('Elegila', `<input name="clave" type="password" required minlength="6" autocomplete="new-password" placeholder="Mínimo 6 caracteres">`), 'Es personal. Si en tu casa hay más de un vecino, cada uno tiene la suya.') : ''}
      ${grupo('Privacidad',
        `<label class="check"><input type="checkbox" name="acepto" required><span>Acepto que la Administración use estos datos solo para la vida del barrio y el control de acceso (Ley 25.326). Puedo pedir verlos, corregirlos o borrarlos.</span></label>`)}
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
        </footer>
      </div>
    </div>`;
}

/* ---------------- avisos ---------------- */
function abrirNotifs(){
  const u = yo();
  const ns = misNotifs().slice(0, 60);
  hoja('Avisos', ns.length ? `
    <div class="row" style="justify-content:flex-end;margin:-4px 0 6px"><button class="btn btn-xs btn-sec" data-a="notifs-leidas">${I('check')}Marcar todo como leído</button></div>
    ${ns.map(n => `<div class="notif ${n.leidas.includes(u.id) ? '' : 'nueva'}" data-a="notif" data-id="${n.id}">
      <span class="ic ic-${n.color}">${I(n.icon)}</span>
      <div class="txt"><b>${esc(n.titulo)}</b>${n.texto ? `<span>${esc(n.texto)}</span>` : ''}<time>${hace(n.at)}</time></div></div>`).join('')}`
    : `<div class="vacio">${I('bell')}No tenés avisos todavía.</div>`);
}
A['notifs'] = abrirNotifs;
A['notifs-leidas'] = () => { const u = yo(); Store.cambiar(s => s.notifs.forEach(n => { if (meToca(n, u) && !n.leidas.includes(u.id)) n.leidas.push(u.id); })); abrirNotifs(); };
A['notif'] = el => {
  const u = yo(); const n = Store.s.notifs.find(x => x.id === el.dataset.id); if (!n) return;
  Store.cambiar(() => { if (!n.leidas.includes(u.id)) n.leidas.push(u.id); });
  cerrarHoja();
  if (n.link){ const [id, p] = n.link.split(':'); abrir(id, p || ''); }
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
      <small>${k === 'medica' ? 'También avisa a los vecinos con formación en primeros auxilios' : k === 'seguridad' || k === 'incendio' ? 'También avisa a todos los vecinos' : 'Guardia y Administración'}</small></span>${I('right')}</button>`).join('')}
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
    notificar(s, { para:'staff', titulo:`SOS · ${t.nombre}`, texto:`${u.nombre} · ${u.casa}`, icon:'siren', color:'danger', urgente:true, link:'garita' });
    if (tipo === 'medica' && motorActivo('sos-respondedores')){
      const resp = s.users.filter(x => x.respondedor && x.id !== u.id && x.estado === 'aprobado').map(x => x.id);
      if (resp.length) notificar(s, { para:resp, titulo:'Emergencia médica cerca', texto:`${u.casa} pidió ayuda médica. Si podés, acercate.`, icon:'heart', color:'danger', urgente:true });
    }
    if (tipo === 'seguridad' || tipo === 'incendio')
      notificar(s, { para:'todos', titulo:`Alerta: ${t.nombre.toLowerCase()}`, texto:`Reportado desde ${u.casa}. La guardia ya está avisada.`, icon:t.icon, color:'danger', urgente:true });
    s.bitacora.unshift({ id:uid(), autor:'sistema', tipo:'incidente', texto:`SOS ${t.nombre} desde ${u.casa} (${u.nombre}).`, at:Date.now() });
  });
  const g = Store.s.config.garitaTel || contactoTel('Garita');
  hoja('Ayuda en camino', `
    <div class="aviso a-danger latido">${I('siren')}<div class="txt"><b>La guardia ya recibió tu alerta</b>Quedate en un lugar seguro. Si podés, llamá también:</div></div>
    <div class="btns" style="margin-top:6px">
      <a class="btn btn-danger" href="tel:${t.llamar}">${I('phone')}Llamar al ${t.llamar}</a>
      ${g ? `<a class="btn btn-sec" href="${telLink(g)}">${I('gate')}Llamar a la garita</a>` : ''}
    </div>
    <p class="muted small" style="margin:14px 0 0">Tu alerta queda activa hasta que la guardia la marque como resuelta.</p>`);
};
A['sos-voy'] = el => Store.cambiar(s => {
  const x = s.sos.find(o => o.id === el.dataset.id); if (!x) return;
  x.estado = 'en_camino'; x.atiende = yo().id;
  notificar(s, { para:x.userId, titulo:'La guardia va en camino', texto:'Recibimos tu alerta. Ya salimos.', icon:'shield', color:'ok', urgente:true });
});
A['sos-resuelta'] = el => Store.cambiar(s => {
  const x = s.sos.find(o => o.id === el.dataset.id); if (!x) return;
  x.estado = 'resuelta'; x.resueltaAt = Date.now(); x.resuelve = yo().id;
  s.bitacora.unshift({ id:uid(), autor:yo().id, tipo:'incidente', texto:`SOS de ${usuario(x.userId)?.casa || ''} resuelta.`, at:Date.now() });
});
A['sos-cancelar'] = el => Store.cambiar(s => {
  const x = s.sos.find(o => o.id === el.dataset.id); if (!x) return;
  x.estado = 'resuelta'; x.resueltaAt = Date.now(); x.resuelve = yo().id;
  notificar(s, { para:'staff', titulo:'SOS cancelada por el vecino', texto:usuario(x.userId)?.casa || '', icon:'check', color:'ok' });
});
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
      <div class="muted tiny">${{ vecino:'Vecino/a', admin:'Administración', guardia:'Guardia' }[modoActivo()]}${modoActivo() === 'vecino' ? ' · la app es personal; el voto y las expensas son del lote' : ''}</div></div></div>
    ${puedeAdministrar() ? superficie({ a:'cambiar-modo', icon: modoActivo() === 'admin' ? 'sliders' : 'home', color: modoActivo() === 'admin' ? 'accent' : 'ok',
      t: modoActivo() === 'admin' ? 'Estás como Administración' : 'Estás como vecino/a',
      s: modoActivo() === 'admin' ? 'Tocá para pasar a tu vista de vecino/a' : 'Tocá para volver al panel de administración', cls:'acento' }) : ''}
    ${modoActivo() === 'vecino' ? superficie({ v:'perfil', icon:'home', color:'ok', t:'Mi casa', s:'Datos, foto del frente, mascotas' }) : ''}
    <div class="card" style="margin-bottom:8px"><div class="lbl">Modo de pantalla · ahora está en ${modoActual()}</div>
      <div class="seg">${[['auto', 'Automático', 'sunrise'], ['light', 'Día', 'sun'], ['dark', 'Noche', 'moon']].map(([k, t, ic]) =>
        `<label><input type="radio" name="temaRapido" ${(Store.sesion.tema || 'auto') === k ? 'checked' : ''} data-a="tema" data-v="${k}"><span>${I(ic)}${t}</span></label>`).join('')}</div>
      <div class="ayuda">En automático sigue la salida y la puesta del sol en Ushuaia (hoy: ${Clima.sol().sale} a ${Clima.sol().pone}).</div></div>
    ${(() => { const otros = Store.s.users.filter(x => x.estado === 'aprobado' && x.casa === u.casa && x.id !== u.id);
      return otros.length ? `<div class="card plana small" style="margin-bottom:8px">${I('users')} En ${esc(u.casa)} también tienen cuenta: ${otros.map(x => esc(x.nombre.split(' ')[0])).join(', ')}. Entre todos son un solo lote: un voto y una expensa.</div>` : ''; })()}
    ${superficie({ a:'cambiar-clave', icon:'key', color:'brand', t: Nube.activa() ? 'Cambiar mi contraseña' : 'Cambiar mi clave', s:'Cuando quieras, desde acá' })}
    ${superficie({ a:'cambiar-email', icon:'mail', color:'sky', t:'Cambiar mi correo', s:esc(u.email) })}
    ${superficie({ a:'salir', icon:'logout', color:'danger', t:'Cerrar sesión', s:'Salís de esta app en este equipo', cls:'peligro' })}`); };

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
  hoja(alEntrar ? `Hola, ${esc(u.nombre.split(' ')[0])}` : 'Cambiar de modo', `
    <p class="muted small" style="margin:0 0 14px">${alEntrar ? 'Administrás el barrio y además sos vecino/a de ' + esc(u.casa) + '. ¿Desde dónde querés entrar?' : 'Podés cambiar cuando quieras: la app se reacomoda entera.'}</p>
    <button class="superficie ${modoActivo() === 'vecino' ? 'acento' : ''}" data-a="modo" data-v="vecino">
      <span class="ic ic-ok">${I('home')}</span><span class="txt"><b>Como vecino/a de ${esc(u.casa)}</b>
      <small>Tus visitas, tus reservas, tus expensas y el pizarrón. Sin panel de administración.</small></span>${I('right')}</button>
    <button class="superficie ${modoActivo() === 'admin' ? 'acento' : ''}" data-a="modo" data-v="admin">
      <span class="ic ic-accent">${I('sliders')}</span><span class="txt"><b>Como Administración</b>
      <small>Inscripciones, padrón, contabilidad, expensas, garita, reclamos y auditoría.</small></span>${I('right')}</button>
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
A['ver-foto'] = async el => {
  const id = el.dataset.foto; const v = await Fotos.sacar(id);
  if (!v){ toast('Esa foto quedó guardada en el equipo de quien la subió', 'image'); return; }
  hoja('Foto', `<img class="foto-full" src="${v}" alt=""><div class="btns" style="margin-top:12px"><a class="btn btn-sec" href="${v}" download="foto-barrio.jpg">${I('download')}Guardar en este equipo</a></div>`, { ancho:'760px' });
};
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
  sosVistos = new Set(Store.s.sos.map(s => s.id));
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
  const dni = soloDigitos(d.dni);
  if (dni.length < 7 || dni.length > 9){ toast('Revisá el DNI', 'alert'); return; }
  if (Nube.activa()){
    if (!d.clave || d.clave.length < 6){ toast('La contraseña tiene que tener al menos 6 caracteres', 'lock'); return; }
    try {
      const u = await Nube.registrar({ nombre:d.nombre.trim(), casa:d.casa, dni, email, tel:(d.tel || '').trim(), clave:d.clave });
      if (u.estado === 'aprobado'){ toast('Primera cuenta del barrio: quedás como Administración', 'shield'); return; }
      await Correo.enviar({ para:email, asunto:'Recibimos tu inscripción', tipo:'inscripcion',
        html:Correo.plantilla('Recibimos tu inscripción', `<p>Hola ${esc(u.nombre.split(' ')[0])}: tu pedido de acceso para <b>${esc(u.casa)}</b> quedó registrado. Cuando la Administración lo apruebe vas a poder entrar con tu email y la contraseña que elegiste.</p>`, { texto:'Abrir la app', url:urlApp() }) });
      if (Store.s.config.adminEmail) Correo.enviar({ para:Store.s.config.adminEmail, asunto:`Nueva inscripción: ${u.nombre} (${u.casa})`, tipo:'aviso-admin',
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
  cerrarHoja();
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
};

/* ---------------- delegación de eventos ---------------- */
document.addEventListener('click', e => {
  const el = e.target.closest('[data-a]');
  if (!el) return;
  const f = A[el.dataset.a];
  /* Los tildes y opciones tienen que poder marcarse: a ellos no se les frena el clic. */
  if (f){ if (el.tagName !== 'INPUT') e.preventDefault(); f(el, e); }
});
document.addEventListener('submit', e => {
  const form = e.target.closest('form[data-f]');
  if (!form) return;
  e.preventDefault();
  const f = F[form.dataset.f];
  if (!f) return;
  const fd = new FormData(form), d = {};
  for (const [k, v] of fd.entries()){ if (v instanceof File) continue; if (k in d){ d[k] = [].concat(d[k], v); } else d[k] = v; }
  f(d, form, e);
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
const campoFoto = (id, etiqueta = 'Foto (opcional)') => `
  <div class="field"><label>${etiqueta}</label><div class="foto-in">
    <label class="foto-prev" id="${id}Prev" style="cursor:pointer">${I('camera')}<input type="file" accept="image/*" capture="environment" data-foto-in="${id}" hidden></label>
    <div class="muted small">La foto se guarda en este equipo. A los demás les llega una miniatura.</div>
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
  if (typeof Promos !== 'undefined') Promos.pedir().then(v => { if (v) refrescarPronto(); }).catch(() => {});
}

async function arrancar(){
  Store.cargar();
  aplicarTema();
  history.replaceState({ n:1 }, '');

  if (Nube.activa()){
    Conexion.poner('conectando');
    /* Mientras Firebase resuelve quién es, se muestra el portal o la app con
       lo último que había guardado en este equipo. Nada de pantallas vacías. */
    if (!rutaPublica()) pintarBienvenida();
    Nube.iniciar()
      .then(() => { Conexion.poner('vivo'); if (!rutaPublica()){ if (yo()) pintar(); else if (!$('.portal')) pintarBienvenida(); } Motor.correr(); })
      .catch(err => { console.error(err); Conexion.poner('caido'); toast('No se pudo conectar con la base del barrio. Reintentando…', 'alert'); });
    window.addEventListener('online', () => { Conexion.poner('vivo'); datosDeAfuera(); });
    window.addEventListener('offline', () => Conexion.poner('caido'));
  } else {
    Conexion.poner('local');
    if (rutaPublica()) { datosDeAfuera(); return; }
    if (yo()){
      Store.sesion.visitaAnterior = Store.sesion.ultimaVisita || 0;
      Store.sesion.ultimaVisita = Date.now();
      Store.guardarSesion();
      sosVistos = new Set(Store.s.sos.map(x => x.id));
    }
    pintar();
  }

  datosDeAfuera();
  Motor.correr();
  setInterval(() => { Motor.correr(); aplicarTema(); if (yo()) refrescarPronto(); }, 60000);
  /* El clima y los vuelos se refrescan solos, sin que haya que entrar. */
  setInterval(datosDeAfuera, 10 * MIN);
  Avion.arrancar();
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => {});
}
document.addEventListener('DOMContentLoaded', arrancar);
