/* =========================================================
   Gestor de ventanas, arranque y lo que es de toda la app
   (bienvenida, avisos, SOS, tema).

   La navegación es una PILA de ventanas, como en ASHA:
     abrir('reservas')      apila una ventana a la derecha
     volverA(i)             vuelve a la ventana i (cierra las de la derecha)
     cerrarVentana()        cierra la última (también el Atrás del celular)
   Cada ventana se declara en R: { titulo, sub, icon, color, ancha, render(param) }.
   ========================================================= */
const PILA = [];
let ventanaNueva = false;

function abrir(id, param = ''){
  if (!R[id]) return;
  const ya = PILA.findIndex(v => v.id === id);
  if (ya >= 0){
    PILA[ya].param = param;
    const cerrar = PILA.length - 1 - ya;
    if (cerrar > 0){ saltando = true; history.go(-cerrar); }
    PILA.length = ya + 1;
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
  if (cerrar <= 0) return;
  saltando = true;
  history.go(-cerrar);
  PILA.length = i + 1;
  pintar();
}
function cerrarVentana(){ if (PILA.length > 1) history.back(); }
window.addEventListener('popstate', e => {
  if (saltando){ saltando = false; return; }
  const d = $('#hoja');
  if (d && d.open){ d.close(); history.pushState({ n: PILA.length }, ''); return; }
  const n = (e.state && e.state.n) || 1;
  if (PILA.length > n){
    PILA.length = Math.max(1, n);
    pintar();
  }
});
const inicioId = () => esGuardia() ? 'garita' : 'inicio';
const titulo = (def, p) => typeof def.titulo === 'function' ? def.titulo(p) : def.titulo;

/* ---------------- dibujo ---------------- */
function pintarTop(){
  const u = yo(); if (!u) return;
  const nl = noLeidas().length;
  const sos = !esGuardia();
  $('#top').innerHTML = `
    <button class="marca" data-a="volver" data-i="0" aria-label="Ir al inicio">
      <span class="logo">${LOGO}</span>
      <span style="min-width:0"><b>${esc(Store.s.config.nombre)}</b>
        <small><span class="en-vivo"></span>${esc(u.nombre.split(' ')[0])}${u.rol === 'vecino' ? `<span class="casa"> · ${esc(u.casa)}</span>`
          : `<span class="rol-chip">${u.rol === 'admin' ? 'Administración' : 'Guardia'}</span><span class="casa"> · ${esc(u.casa)}</span>`}</small></span>
    </button>
    <button class="icon-btn" data-a="notifs" aria-label="Avisos">${I('bell')}${nl ? `<span class="dot-badge">${nl > 9 ? '9+' : nl}</span>` : ''}</button>
    <button class="icon-btn" data-a="mi-cuenta" aria-label="Mi cuenta">${avatar(u, 'sm')}</button>
    ${sos ? `<button class="sos-btn" id="sosBtn" aria-label="SOS: mantené apretado para pedir ayuda">${I('siren')}<span>SOS</span></button>` : ''}`;
}

function pintar(){
  aplicarTema();
  const u = yo();
  if (!u){ PILA.length = 0; return pintarBienvenida(); }
  if (!$('#lienzo')){
    $('#app').innerHTML = `<header class="top" id="top"></header><div class="lienzo" id="lienzo"></div><div id="alarmas"></div>`;
  }
  if (!PILA.length || PILA[0].id !== inicioId()){ PILA.length = 0; PILA.push({ id: inicioId(), param:'' }); }
  pintarTop();
  const lienzo = $('#lienzo');
  const activa = PILA[PILA.length - 1];
  const def = R[activa.id];
  const lomos = PILA.slice(0, -1).map((v, i) => {
    const d = R[v.id];
    return `<button class="lomo" data-a="volver" data-i="${i}" title="Volver a ${esc(titulo(d, v.param))}">${I(d.icon || 'home')}<b>${esc(titulo(d, v.param))}</b></button>`;
  }).join('');
  const cab = PILA.length > 1 ? `<header>
      <span class="ic ic-${def.color || 'brand'}">${I(def.icon || 'grid')}</span>
      <div class="tit"><h2>${esc(titulo(def, activa.param))}</h2>${def.sub ? `<div class="sub">${esc(typeof def.sub === 'function' ? def.sub(activa.param) : def.sub)}</div>` : ''}</div>
      <button class="cerrar" data-a="cerrar-ventana" aria-label="Cerrar">${I('x')}</button></header>` : '';
  let html;
  try { html = def.render(activa.param); }
  catch(err){ console.error(err); html = `<div class="aviso a-danger">${I('alert')}<div class="txt"><b>Esta ventana tuvo un problema</b>${esc(err.message)}</div></div>`; }
  lienzo.innerHTML = lomos + `<section class="ventana ${PILA.length === 1 ? 'inicio' : ''} ${def.ancha ? 'ancha' : ''} ${ventanaNueva ? 'entra' : ''}" data-id="${activa.id}">${cab}<div class="cuerpo" id="cuerpo">${html}</div></section>`;
  ventanaNueva = false;
  despuesDePintar();
  pintarAlarmas();
}

/* Redibuja solo el cuerpo de la ventana activa sin perder lo que se
   estaba escribiendo ni la posición del scroll. Se usa cuando llega un
   cambio de otra pestaña o de otro vecino. */
function refrescar(){
  const u = yo();
  if (!u || !$('#cuerpo')) return pintar();
  if (!PILA.length) return pintar();
  const activa = PILA[PILA.length - 1];
  const def = R[activa.id];
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
  try { cuerpo.innerHTML = def.render(activa.param); } catch(err){ console.error(err); }
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

function despuesDePintar(){
  Fotos.hidratar($('#cuerpo') || document);
  $$('[data-qr]').forEach(el => pintarQR(el, el.dataset.qr));
  const def = R[PILA[PILA.length - 1]?.id];
  if (def && def.alPintar) def.alPintar(PILA[PILA.length - 1].param);
}

/* Alarma SOS para la guardia y la Administración: ventana grande, luz roja
   latente, sirena y el lugar exacto del vecino en el mapa. */
let sosVistos = new Set(), sirenaOn = false, sirenaTimer = null, sosSilenciada = new Set();
function pintarAlarmas(){
  const box = $('#alarmas'); if (!box) return;
  if (!esStaff()){ box.innerHTML = ''; pararSirena(); return; }
  const act = Store.s.sos.filter(s => s.estado !== 'resuelta');
  const nuevas = act.filter(s => !sosVistos.has(s.id));
  act.forEach(s => sosVistos.add(s.id));
  if (!act.length){ box.innerHTML = ''; pararSirena(); return; }
  const s = act[0], u = usuario(s.userId) || {}, t = TIPOS_SOS[s.tipo] || TIPOS_SOS.otra;
  const punto = s.coords || u.ubicacion;
  const mapa = punto ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(punto)}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((Store.s.config.domicilio || '') + ' ' + (u.casa || ''))}`;
  const L = u.casa && typeof LOTES !== 'undefined' ? LOTES.find(l => 'Lote ' + l.lote === u.casa) : null;
  box.innerHTML = `<div class="sos-pantalla" role="alertdialog" aria-label="Alerta SOS">
    <div class="sos-caja">
      <div class="sos-cab">${I('siren')}<div><b>SOS · ${esc(t.nombre)}</b><span>${hace(s.at)}${act.length > 1 ? ` · y ${act.length - 1} más` : ''}</span></div></div>
      <div class="sos-vecino">
        ${u.fotoCasa ? fotoHTML(u.fotoCasa, 'casa-foto grande') : `<span class="casa-foto grande vacia">${I('home')}</span>`}
        <div class="grow"><b>${esc(u.nombre || 'Vecino/a')}</b>
          <div class="sos-lote">${esc(u.casa || '')}${L ? ' · UF ' + L.uf : ''}</div>
          ${u.direccion ? `<div class="sos-dato">${esc(u.direccion)}</div>` : ''}
          ${u.integrantes ? `<div class="sos-dato">${I('users')} ${esc(u.integrantes)}</div>` : ''}
          ${s.estado === 'en_camino' ? `<div class="sos-dato">${I('check')} Va en camino ${esc(nombreDe(s.atiende))}</div>` : ''}</div></div>
      <div class="sos-botones">
        <a class="btn btn-block" style="background:#fff;color:#a11" href="${mapa}" target="_blank" rel="noopener">${I('pin')}Cómo llegar${s.coords ? ' (GPS de la alerta)' : u.ubicacion ? ' (ubicación del lote)' : ''}</a>
        ${u.tel ? `<a class="btn btn-block" style="background:rgba(255,255,255,.2);color:#fff" href="${telLink(u.tel)}">${I('phone')}Llamar a ${esc((u.nombre || '').split(' ')[0])}</a>` : ''}
        <div class="btns">
          ${s.estado === 'activa' ? `<button class="btn btn-ok" data-a="sos-voy" data-id="${s.id}">${I('check')}Voy en camino</button>` : ''}
          <button class="btn btn-sec" data-a="sos-resuelta" data-id="${s.id}">Resuelta</button>
          <button class="btn btn-sec" data-a="sos-silencio" data-id="${s.id}">${sosSilenciada.has(s.id) ? I('volume') + 'Sonido' : I('volume') + 'Silenciar'}</button>
        </div>
        <a class="btn btn-block" style="background:rgba(0,0,0,.25);color:#fff" href="tel:${t.llamar}">${I('siren')}Llamar al ${t.llamar}</a>
      </div></div></div>`;
  Fotos.hidratar(box);
  if (sosSilenciada.has(s.id)) pararSirena(); else arrancarSirena();
  if (nuevas.length && navigator.vibrate) navigator.vibrate([400, 200, 400, 200, 400]);
}
/* Sirena de dos tonos hasta que alguien atienda o silencie. */
function arrancarSirena(){
  if (sirenaOn || Store.sesion.sinSonido) return;
  sirenaOn = true;
  const sonar = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sawtooth'; g.gain.value = .07;
      o.frequency.setValueAtTime(620, ctx.currentTime);
      o.frequency.linearRampToValueAtTime(1020, ctx.currentTime + .5);
      o.frequency.linearRampToValueAtTime(620, ctx.currentTime + 1);
      o.connect(g); g.connect(ctx.destination);
      o.start(); o.stop(ctx.currentTime + 1.05);
      setTimeout(() => ctx.close().catch(() => {}), 1300);
    } catch(e){}
  };
  sonar();
  sirenaTimer = setInterval(sonar, 1200);
}
function pararSirena(){ sirenaOn = false; if (sirenaTimer){ clearInterval(sirenaTimer); sirenaTimer = null; } }
A['sos-silencio'] = el => { const id = el.dataset.id; sosSilenciada.has(id) ? sosSilenciada.delete(id) : sosSilenciada.add(id); pararSirena(); pintarAlarmas(); };

function pitido(){
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [0, .35, .7].forEach(t => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'square'; o.frequency.value = 880; g.gain.value = .08;
      o.connect(g); g.connect(ctx.destination); o.start(ctx.currentTime + t); o.stop(ctx.currentTime + t + .22);
    });
    if (navigator.vibrate) navigator.vibrate([300, 150, 300, 150, 300]);
  } catch(e){}
}

/* ---------------- modo día y modo noche ----------------
   En automático manda el sol de Ushuaia, no el reloj del equipo ni el
   ajuste del sistema: de día la app va clara y de noche, oscura. En
   invierno eso significa que a las 17:30 ya cambia sola. */
function aplicarTema(){
  const t = Store.sesion?.tema || 'auto';
  const modo = t === 'auto' ? (Clima.esDeDia() ? 'light' : 'dark') : t;
  document.documentElement.setAttribute('data-theme', modo);
  document.querySelector('meta[name=theme-color]')?.setAttribute('content', modo === 'dark' ? '#0a1315' : '#0d6b66');
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
      <div class="portal-foto" style="background-image:url('${Clima.portada()}')">
        <div class="portal-marca"><span class="logo">${LOGO}</span>
          <div><b>Barrio ${esc(c.nombre)}</b><small>${esc(c.ciudad)}</small></div></div>
        <div class="portal-lema"><h1>La vida del barrio,<br>en un solo lugar.</h1>
          ${(() => { const cl = Clima.d?.c; if (!cl) return '';
            const [desc, ico] = Clima.cod(cl.weather_code);
            return `<div class="portal-clima">${I(ico)}<b>${Math.round(cl.temperature_2m)}°</b><span>${esc(desc)} · ráfagas ${Math.round(cl.wind_gusts_10m)} km/h</span></div>`; })()}</div>
      </div>
      <div class="portal-panel">
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
   Se mantiene apretado 1,2 s para que no salga por un toque sin querer. */
const TIPOS_SOS = {
  medica:    { nombre:'Emergencia médica', icon:'heart', llamar:'107' },
  seguridad: { nombre:'Seguridad / intrusión', icon:'shield', llamar:'101' },
  incendio:  { nombre:'Incendio', icon:'flame', llamar:'100' },
  otra:      { nombre:'Otra emergencia', icon:'alert', llamar:'911' },
};
let sosTimer = null;
document.addEventListener('pointerdown', e => {
  const b = e.target.closest('#sosBtn'); if (!b) return;
  e.preventDefault();
  b.classList.add('cargando');
  sosTimer = setTimeout(() => { b.classList.remove('cargando'); if (navigator.vibrate) navigator.vibrate(80); elegirSOS(); }, 1200);
});
['pointerup','pointerleave','pointercancel'].forEach(t => document.addEventListener(t, e => {
  if (!sosTimer) return;
  const b = $('#sosBtn');
  if (t !== 'pointerleave' || e.target === b){
    clearTimeout(sosTimer); sosTimer = null;
    if (b && b.classList.contains('cargando')){ b.classList.remove('cargando'); toast('Mantené apretado SOS un segundo para pedir ayuda', 'siren'); }
  }
}, true));
function elegirSOS(){
  hoja('¿Qué está pasando?', `
    <p class="muted small" style="margin:0 0 12px">Al tocar una opción se avisa al instante a la guardia y a la Administración.</p>
    ${Object.entries(TIPOS_SOS).map(([k, t]) => `<button class="superficie ${k === 'medica' || k === 'incendio' ? 'peligro' : ''}" data-a="sos-enviar" data-v="${k}">
      <span class="ic ic-danger">${I(t.icon)}</span><span class="txt"><b>${t.nombre}</b>
      <small>${k === 'medica' ? 'También avisa a los vecinos con formación en primeros auxilios' : k === 'seguridad' || k === 'incendio' ? 'También avisa a todos los vecinos' : 'Guardia y Administración'}</small></span>${I('right')}</button>`).join('')}`);
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
      <div class="muted tiny">${{ vecino:'Vecino/a', admin:'Administración', guardia:'Guardia' }[u.rol]}${u.rol === 'vecino' ? ' · la app es personal; el voto y las expensas son del lote' : ''}</div></div></div>
    ${u.rol === 'vecino' ? superficie({ v:'perfil', icon:'home', color:'ok', t:'Mi casa', s:'Datos, foto del frente, mascotas' }) : ''}
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
  Store.sesion.userId = null; Store.guardarSesion(); PILA.length = 0; $('#app').innerHTML = ''; pintar();
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

/* Un cambio de otra pestaña (o de otro vecino, cuando haya servidor). */
Store.alCambiar(remoto => {
  if (!yo()){ if (remoto && !$('#lienzo')) return; return; }
  refrescar();
  if (remoto) avisosDelSistema();
});

/* ---------------- arranque ---------------- */
async function arrancar(){
  Store.cargar();
  aplicarTema();
  if (Nube.activa()){
    $('#app').innerHTML = `<div class="vacio" style="padding-top:34vh">${I('refresh')}Conectando con el barrio…</div>`;
    await Nube.iniciar();
    if (!yo()) { if (!$('.bienvenida')) pintarBienvenida(); }
    else pintar();
    Motor.correr();
    setInterval(() => { Motor.correr(); aplicarTema(); if (yo()) refrescar(); }, 60000);
    Clima.pedir().then(() => { if (yo()) refrescar(); });
    if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => {});
    return;
  }
  history.replaceState({ n:1 }, '');
  const h = location.hash;
  if (h.startsWith('#/pedir/')){ pintarPedirPase(decodeURIComponent(h.slice(8))); return; }
  if (h.startsWith('#/inscripcion/')){ pintarInscripcion(decodeURIComponent(h.slice(14))); return; }
  if (yo()){
    Store.sesion.visitaAnterior = Store.sesion.ultimaVisita || 0;
    Store.sesion.ultimaVisita = Date.now();
    Store.guardarSesion();
    sosVistos = new Set(Store.s.sos.map(s => s.id));
  }
  pintar();
  Clima.pedir().then(() => { if (yo() && PILA.length === 1) refrescar(); else if (!yo()) { const f = $('.bienvenida .foto'); if (f) f.style.backgroundImage = `url('${Clima.portada()}')`; } Motor.correr(); });
  Motor.correr();
  setInterval(() => { Motor.correr(); aplicarTema(); if (yo()) refrescar(); }, 60000);
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => {});
}
document.addEventListener('DOMContentLoaded', arrancar);
