/* =========================================================
   AVISOS CON LA PANTALLA APAGADA (notificaciones push)
   -------------------------------------------------------
   Con la app abierta, los avisos suenan solos. Pero con el
   celular bloqueado (la app sigue "abierta" pero dormida)
   el navegador no corre nada: lo único que lo despierta es
   una notificación push, que manda Google (Firebase Cloud
   Messaging). Así funciona:

     1. Cada vecino toca "Activar avisos" UNA vez en cada
        equipo. El navegador le pide permiso y Google le da
        a ese equipo una dirección (token), que se guarda en
        barrio/pushTokens/<cuenta>/<equipo>. Nadie puede
        leer esa lista desde la app: solo el Apps Script.
     2. Cuando pasa algo (entra el camión, un SOS, un aviso
        urgente, un paquete), el equipo que lo generó le pide
        al Apps Script que avise; el Apps Script busca a
        quién le toca y se lo pide a Google.
     3. El service worker (sw.js) recibe el aviso y lo
        muestra con vibración, aunque la pantalla esté
        apagada. Al tocarlo, se abre la app en esa ventana.

   En iPhone y iPad solo anda con la app INSTALADA en la
   pantalla de inicio (Safari → Compartir → "Agregar a
   inicio"), con iOS 16.4 o más nuevo. Es una regla de Apple.
   La configuración de una sola vez está en AVISOS.md.
   ========================================================= */
const Push = {
  KEY:'bhc.push.token', SDK:'https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js',
  esIOS(){ return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1); },
  instalada(){ return matchMedia('(display-mode: standalone)').matches || navigator.standalone === true; },
  soportado(){ return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window; },
  configurada(){ return !!(Store.s.config.pushVapid && typeof Nube !== 'undefined' && Nube.activa()); },
  token(){ try { return localStorage.getItem(this.KEY) || ''; } catch(e){ return ''; } },
  /* En qué situación está este equipo, en palabras. */
  estado(){
    if (typeof Nube === 'undefined' || !Nube.activa()) return 'demo';
    if (this.esIOS() && !this.instalada()) return 'ios-instalar';
    if (!this.soportado()) return 'no-soportado';
    if (!Store.s.config.pushVapid) return 'sin-config';
    if (Notification.permission === 'denied') return 'bloqueado';
    if (Notification.permission === 'granted' && this.token()) return 'activo';
    return 'apagado';
  },
  TEXTOS: {
    'demo':         ['En la demo no hay avisos push', 'Funcionan con la app conectada a la base del barrio.'],
    'ios-instalar': ['Primero instalá la app', 'En iPhone y iPad los avisos con la pantalla apagada solo andan con la app en la pantalla de inicio: Safari → Compartir → "Agregar a inicio", y después activalos desde ahí.'],
    'no-soportado': ['Este navegador no recibe avisos', 'Probá con Chrome, Edge, Firefox o Safari actualizados.'],
    'sin-config':   ['Falta un paso de la Administración', 'Los avisos push todavía no están configurados (Ajustes → Avisos al celular).'],
    'bloqueado':    ['Los avisos están bloqueados en este equipo', 'Se habilitan desde la configuración del navegador o del teléfono (permisos del sitio → Notificaciones → Permitir).'],
    'activo':       ['Avisos activados en este equipo', 'Te llegan aunque tengas el celular bloqueado: camión de la basura, un correo que va a tu casa, SOS, avisos urgentes, mensajes, "Estoy bien" y lo que escriba la guardia.'],
    'apagado':      ['Activá los avisos en este equipo', 'Para enterarte con el celular bloqueado: camión de la basura, un correo que va a tu casa, SOS, avisos urgentes, mensajes, "Estoy bien" y lo que escriba la guardia.'],
  },
  cargarSDK(){
    if (firebase.messaging) return Promise.resolve();
    if (this.cargando) return this.cargando;
    this.cargando = new Promise((ok, mal) => {
      const s = document.createElement('script'); s.src = this.SDK;
      s.onload = () => ok(); s.onerror = () => { this.cargando = null; mal(new Error('No se pudo bajar el módulo de avisos (¿sin internet?)')); };
      document.head.appendChild(s);
    });
    return this.cargando;
  },
  claveEquipo(t){ let h = 0; for (let i = 0; i < t.length; i++) h = (h * 31 + t.charCodeAt(i)) >>> 0; return 'e' + h.toString(36) + t.length.toString(36); },
  async activar(){
    const est = this.estado();
    if (!['apagado', 'activo'].includes(est)){ const [t, x] = this.TEXTOS[est]; hoja(t, `<p class="small" style="margin:0 0 14px">${x}</p><button class="btn btn-pri btn-block" data-a="cerrar-hoja">Entendido</button>`); return false; }
    try {
      const perm = await Notification.requestPermission();
      if (perm !== 'granted'){ toast('Sin permiso no se pueden mandar avisos a este equipo', 'bell'); refrescar(); return false; }
      await this.cargarSDK();
      const reg = await navigator.serviceWorker.ready;
      const t = await firebase.messaging().getToken({ vapidKey:Store.s.config.pushVapid, serviceWorkerRegistration:reg });
      if (!t) throw new Error('Google no entregó la dirección del equipo');
      await this.anotar(t);
      toast('Listo: este equipo recibe los avisos aunque esté bloqueado', 'bell');
      refrescar();
      return true;
    } catch(e){ console.warn('Push', e); toast('No se pudieron activar los avisos: ' + (e.message || e), 'alert'); return false; }
  },
  async anotar(t){
    const u = yo(); if (!u || !Nube.db) return;
    const viejo = this.token();
    if (viejo && viejo !== t) await Nube.db.ref(`barrio/pushTokens/${Nube.uid}/${this.claveEquipo(viejo)}`).remove().catch(() => {});
    /* El propietario a distancia se anota como 'propietario': el Apps Script le manda solo lo de dueño. */
    const rol = typeof esPropDistancia === 'function' && esPropDistancia(u) ? 'propietario' : u.rol;
    try { localStorage.setItem(this.KEY + '.rol', rol); } catch(e){}
    await Nube.db.ref(`barrio/pushTokens/${Nube.uid}/${this.claveEquipo(t)}`).set({ t, rol, casa:u.casa || '', at:Date.now(),
      equipo: /Android/i.test(navigator.userAgent) ? 'Android' : this.esIOS() ? 'iPhone/iPad' : /Mac/i.test(navigator.userAgent) ? 'Mac' : /Windows/i.test(navigator.userAgent) ? 'Windows' : 'Otro' });
    try { localStorage.setItem(this.KEY, t); localStorage.setItem(this.KEY + '.at', String(Date.now())); } catch(e){}
  },
  async desactivar(){
    const t = this.token();
    try {
      if (t && Nube.db) await Nube.db.ref(`barrio/pushTokens/${Nube.uid}/${this.claveEquipo(t)}`).remove();
      if (firebase.messaging) await firebase.messaging().deleteToken().catch(() => {});
    } catch(e){}
    try { localStorage.removeItem(this.KEY); } catch(e){}
    toast('Este equipo ya no recibe avisos con la pantalla apagada', 'bell'); refrescar();
  },
  /* Una vez por día se renueva la anotación (Google cambia los tokens de
     vez en cuando, y así queda al día el rol y el lote). */
  async alDia(){
    try {
      if (this.estado() !== 'activo' || !yo()) return;
      /* Después de cerrar sesión (at = 0) se anota de nuevo en cuanto se
         vuelve a entrar: así el equipo deja de figurar como "sesión cerrada". */
      const at = +(localStorage.getItem(this.KEY + '.at') || 0);
      /* Si cambió cómo hay que anotarlo (el lote se alquiló o dejó de estarlo), se anota ya. */
      const rol = typeof esPropDistancia === 'function' && esPropDistancia() ? 'propietario' : yo().rol;
      if (Date.now() - at < DIA && localStorage.getItem(this.KEY + '.rol') === rol) return;
      await this.cargarSDK();
      const reg = await navigator.serviceWorker.ready;
      const t = await firebase.messaging().getToken({ vapidKey:Store.s.config.pushVapid, serviceWorkerRegistration:reg });
      if (t) await this.anotar(t);
    } catch(e){ console.warn('No se pudo renovar el aviso push', e.message); }
  },
  /* =========================================================
     AL CERRAR SESIÓN (07-10-2026)
     Antes el equipo seguía anotado tal cual y le seguían llegando TODOS los
     avisos de la cuenta (mensajes privados incluidos) aunque se hubiera
     cerrado la sesión. Ahora, antes de salir:
       · si la persona quiere seguir enterándose de los correos que van a su
         casa, el equipo queda marcado "sesión cerrada" y el Apps Script le
         manda SOLO ese aviso (como un WhatsApp: empresa y hora, nada más),
         durante 90 días o hasta que vuelva a entrar;
       · si no, el equipo se borra de la lista y no le llega nada.
     Si en ese equipo entra otra cuenta, vale la anotación más nueva: la
     anterior deja de recibir (lo resuelve el Apps Script).
     ========================================================= */
  async alCerrarSesion(seguirCorreos){
    const t = this.token();
    if (!t || typeof Nube === 'undefined' || !Nube.db || !Nube.uid) return;
    const ref = Nube.db.ref(`barrio/pushTokens/${Nube.uid}/${this.claveEquipo(t)}`);
    try {
      if (seguirCorreos) await ref.update({ cerrada:Date.now() });
      else await ref.remove();
    } catch(e){ console.warn('Aviso push al salir', e.message); }
    try { localStorage.setItem(this.KEY + '.at', '0'); } catch(e){}
  },
  /* Pedirle al Apps Script que avise. Si falla, no pasa nada: el aviso ya
     está en la campanita y suena en las apps abiertas. */
  enviar({ para = 'todos', titulo, texto = '', link = '', tag = '', urgente = false, sonido = '', incluirme = false }){
    try {
      if (typeof Nube === 'undefined' || !Nube.activa() || !Nube.uid) return;
      const d = Correo.datos(), cfg = configFirebase();
      if (!d || !d.url || !cfg) return;
      fetch(d.url, { method:'POST', headers:{ 'Content-Type':'text/plain;charset=utf-8' },
        body: JSON.stringify({ accion:'push', clave:d.clave, db:cfg.databaseURL, para, excluir: incluirme ? '' : Nube.uid, titulo, texto, link, tag, urgente, sonido }) })
        .then(r => r.json()).then(j => { if (j && !j.ok) console.warn('Aviso push:', j.error); }).catch(() => {});
    } catch(e){}
  },
  /* Igual que enviar(), pero espera la respuesta: para la prueba de Ajustes. */
  async enviarYContar({ para, titulo, texto = '', link = '', urgente = false, incluirme = true }){
    const d = Correo.datos(), cfg = configFirebase();
    if (typeof Nube === 'undefined' || !Nube.activa() || !Nube.uid) throw new Error('En la demo no hay avisos push');
    if (!d || !d.url || !cfg) throw new Error('Falta configurar el correo (los avisos usan el mismo Apps Script)');
    const r = await fetch(d.url, { method:'POST', headers:{ 'Content-Type':'text/plain;charset=utf-8' },
      body: JSON.stringify({ accion:'push', clave:d.clave, db:cfg.databaseURL, para, excluir: incluirme ? '' : Nube.uid, titulo, texto, link, tag:'prueba-' + Date.now(), urgente, sonido:'' }) });
    const j = await r.json();
    if (!j || !j.ok) throw new Error((j && j.error) || 'el Apps Script contestó que no');
    return j;
  },
  /* Tocar el aviso abre la app en la ventana que corresponde. */
  abrirEnlace(link){
    if (!link || !yo()) return;
    /* El recordatorio de "Estoy bien": tocarlo ya cuenta como aviso. Se
       espera a que baje lo propio de la base antes de marcar. */
    if (link === 'estoy-bien:ok' && typeof Cuidado !== 'undefined'){ abrir('estoy-bien'); Cuidado.cuandoListo(() => A['bien-ok']()); return; }
    const [id, p] = String(link).split(':');
    if (R[id]) abrir(id, p || '');
  },
  arrancar(){
    if ('serviceWorker' in navigator) navigator.serviceWorker.addEventListener('message', e => { if (e.data && e.data.abrir) this.abrirEnlace(e.data.abrir); });
    const q = new URLSearchParams(location.search), link = q.get('abrir');
    if (link){
      q.delete('abrir'); history.replaceState(history.state, '', location.pathname + (q.toString() ? '?' + q : '') + location.hash);
      const intentar = (n = 0) => { if (yo() && $('#lienzo')) this.abrirEnlace(link); else if (n < 40) setTimeout(() => intentar(n + 1), 250); };
      setTimeout(intentar, 300);
    }
    setTimeout(() => this.alDia(), 8000);
    /* El aviso "Entró el camión" que quedó en la bandeja del teléfono se
       quita cuando el camión ya salió (igual que en la campanita). */
    /* Lo mismo con "va a tu casa", cuando ese correo ya salió. */
    setInterval(() => {
      if (!('serviceWorker' in navigator) || typeof Camion === 'undefined' || typeof Nube === 'undefined' || !Nube.arrancada) return;
      const camion = !!Camion.adentro(), correos = typeof Mensajeria !== 'undefined' ? Mensajeria.adentro().map(v => 'correo-' + v.id) : [];
      navigator.serviceWorker.ready.then(reg => reg.getNotifications()).then(ns => ns.forEach(n => { const tag = String(n.tag || '');
        if ((tag.startsWith('camion-') && !camion) || (tag.startsWith('correo-') && !correos.includes(tag))) n.close(); })).catch(() => {});
    }, 60000);
  },
};

/* Las notificaciones que ya existían (las que suenan) también salen como
   aviso push, así llegan con la pantalla apagada. Solo las que suenan: las
   silenciosas no justifican despertar un teléfono. */
function empujarAviso(n){
  if (!n || !(n.sonido || n.urgente)) return;
  Push.enviar({ para:n.para, titulo:n.titulo, texto:n.texto, link:n.link, tag:'n-' + n.id, urgente:n.urgente });
}

/* La tarjeta para activar los avisos, que va en "Tu cuenta" y en la portada. */
function tarjetaPush(compacta = false){
  const est = Push.estado();
  if (est === 'demo' || (compacta && ['activo', 'no-soportado', 'sin-config'].includes(est))) return '';
  if (compacta){ let no = false; try { no = localStorage.getItem('bhc.push.nomolestar') === '1'; } catch(e){} if (no) return ''; }
  const [t, x] = Push.TEXTOS[est];
  const boton = est === 'apagado' ? `<button class="btn btn-sm btn-pri" data-a="push-activar">${I('bell')}Activar avisos</button>`
    : est === 'activo' ? `<button class="btn btn-sm btn-sec" data-a="push-desactivar">Desactivar en este equipo</button><button class="btn btn-sm btn-sec" data-a="push-probar">${I('send')}Probar</button>` : '';
  return aviso(est === 'activo' ? 'ok' : est === 'apagado' ? 'info' : 'warn', 'bell', t, x,
    `${boton}${compacta ? `<button class="btn btn-sm btn-sec" data-a="push-nomolestar">Ahora no</button>` : ''}`) + (est === 'activo' && !compacta ? '<div id="pushProbarRes"></div>' : '');
}
A['push-activar'] = () => Push.activar();
A['push-desactivar'] = () => Push.desactivar();
A['push-nomolestar'] = () => { try { localStorage.setItem('bhc.push.nomolestar', '1'); } catch(e){} refrescar(); };
/* PROBAR, CON EL RESULTADO A LA VISTA (28-09): antes mandaba el pedido sin
   esperar respuesta y lo único que decía era un cartelito que quedaba tapado
   por Tu cuenta: no se veía ni se oía nada. Ahora suena un tono al tocarlo
   (el botón anda), espera la respuesta del servidor y dice ahí mismo a
   cuántos equipos de tu cuenta salió, o por qué no salió. Con la app en
   pantalla (fuera de iPhone) el aviso llega a la bandeja sin sonido, para no
   sonar dos veces: se aclara para que nadie crea que no anduvo. */
A['push-probar'] = async el => {
  const caja = $('#pushProbarRes'), decir = h => { if (caja) caja.innerHTML = `<div style="margin-top:8px">${h}</div>`; };
  const b = el && el.tagName === 'BUTTON' ? el : null; if (b) b.disabled = true;
  if (typeof Sonido !== 'undefined'){ Sonido.tocar([[880, 0, .14], [1175, .14, .28]], 'sine', .16); Sonido.vibrar(120); }
  decir(`<div class="card plana small">${I('refresh')} Mandando la prueba a los equipos de tu cuenta…</div>`);
  if (!caja) toast('Mandando la prueba…', 'send');
  try {
    const j = await Push.enviarYContar({ para:[yo().id], titulo:'Prueba de aviso', texto:'Si ves esto, los avisos al celular funcionan.', link:'inicio', incluirme:true });
    const n = +j.enviados || 0, ios = Push.esIOS && Push.esIOS();
    const txt = n ? `Salió a ${plural(n, 'equipo')} de tu cuenta. Aparece en unos segundos en la bandeja de avisos del teléfono.${ios ? '' : ' Si la app está abierta en pantalla, llega sin sonido (para no sonar dos veces). Para oírlo: tocá Probar y bloqueá el teléfono enseguida; en unos segundos suena.'}`
      : 'Tu cuenta no tiene ningún equipo anotado todavía. Tocá "Desactivar en este equipo" y después "Activar avisos" otra vez.';
    decir(aviso(n ? 'ok' : 'warn', 'bell', n ? 'Prueba enviada' : 'No había a quién mandarla', esc(txt)));
    if (!caja) toast(n ? `Prueba enviada a ${plural(n, 'equipo')}` : 'Tu cuenta no tiene equipos anotados', 'bell');
  } catch(e){ decir(aviso('danger', 'alert', 'La prueba no salió', esc(e.message || 'sin respuesta del servidor'))); if (!caja) toast('La prueba no salió: ' + (e.message || ''), 'alert'); }
  if (b) b.disabled = false;
};

/* Aviso de prueba a un grupo (Ajustes → Avisos al celular). */
A['push-grupo'] = async el => {
  const v = $('#pushGrupo')?.value || 'yo', caja = $('#pushGrupoRes');
  const para = v === 'yo' ? [yo().id] : v.startsWith('lote:') ? Store.s.users.filter(u => u.casa === v.slice(5) && u.estado === 'aprobado').map(u => u.id) : v;
  if (Array.isArray(para) && !para.length){ caja.innerHTML = `<div style="margin-top:8px">${aviso('warn', 'users', 'Ese lote no tiene cuentas en la app', 'No hay a quién mandarle el aviso.')}</div>`; return; }
  const nombre = $('#pushGrupo').selectedOptions[0]?.textContent || '';
  el.disabled = true; caja.innerHTML = `<div class="card plana small" style="margin:8px 0 0">${I('refresh')} Mandando…</div>`;
  try {
    const j = await Push.enviarYContar({ para, titulo:'Aviso de prueba del barrio', texto:`Prueba mandada por la Administración (${nombre.toLowerCase()}). Si lo ves con el teléfono bloqueado, los avisos andan.`, link:'inicio' });
    caja.innerHTML = `<div style="margin-top:8px">${aviso(j.enviados ? 'ok' : 'warn', 'bell', j.enviados ? `Llegó a ${plural(j.enviados, 'equipo')}` : 'No había equipos anotados en ese grupo',
      j.enviados ? (j.borrados ? `${plural(j.borrados, 'equipo viejo se sacó', 'equipos viejos se sacaron')} de la lista.` : 'Fijate en los teléfonos: tiene que haber sonado.') : 'Cada persona tiene que tocar "Activar avisos" en Tu cuenta (su inicial, arriba a la derecha), en cada equipo.')}</div>`;
    auditar(Store.s, 'Mandó un aviso de prueba', nombre + ' · ' + (j.enviados || 0) + ' equipos'); Store.guardar();
  } catch(e){ caja.innerHTML = `<div style="margin-top:8px">${aviso('danger', 'alert', 'No salió', esc(e.message))}</div>`; }
  el.disabled = false;
};
