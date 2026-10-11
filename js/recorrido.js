/* =========================================================
   RECORRIDO DE BIENVENIDA (pedido de Claudio, 11-10-2026)
   Idea de intro.js (23.4k★) y usertour (2.3k★) en GitHub: el código es
   propio. La primera vez que alguien entra, la app ilumina los botones
   importantes de SU pantalla, uno por uno, con una explicación corta:
   "Siguiente", "Atrás" o "Saltar". Cambia según el perfil (vecino, garita,
   Administración, supervisión, hotel).
   · Solo muestra lo que de verdad está en la pantalla: si un botón no está
     (una función apagada, como los paquetes, o un permiso que no tiene),
     ese paso se saltea solo.
   · Se ve una sola vez por cuenta y por equipo (queda anotado en el propio
     equipo, no en la base). Se vuelve a ver desde el Manual de uso.
   ========================================================= */
const RECORRIDOS = {
  vecino: [
    { sel:'#sosBtn', t:'El botón SOS', x:'Si tenés una emergencia, <b>mantenelo apretado 3 segundos</b>: le avisa al instante a la garita y a los vecinos que saben primeros auxilios. Si lo soltás antes, no manda nada.' },
    { sel:'#cuerpo [data-a="abrir"][data-v="casa"]', t:'Tu casa', x:'Acá anunciás tus visitas (les llega el QR por WhatsApp), les pasás el enlace para que completen sus datos, y tenés tus mensajes, reclamos y expensas.' },
    { sel:'#cuerpo [data-a="abrir"][data-v="comunidad"]', t:'El barrio', x:'El pizarrón, la guía de vecinos, las votaciones, las normas y el manual de uso.' },
    { sel:'#cuerpo [data-a="abrir"][data-v="emergencias"]', t:'El DEA y las emergencias', x:'Dice si el desfibrilador (DEA) del barrio está listo en la garita. Tocándolo, los teléfonos de emergencia y qué hacer.' },
    { sel:'header.top [data-a="notifs"]', t:'La campanita', x:'Todos tus avisos: la visita que llegó, la respuesta de la Administración, el camión de residuos…' },
    { sel:'header.top [data-a="mi-cuenta"]', t:'Tu cuenta', x:'Tus datos, los avisos al celular y tu privacidad. Este recorrido lo podés volver a ver desde el <b>Manual de uso</b>.' },
  ],
  garita: [
    { sel:'.tareas-dia', t:'Lo que no se puede olvidar', x:'La lista del turno se arma sola con lo de hoy: visitas por llegar, casas solas, el camión, el policía. Cada cosa sale de la lista cuando se hace.' },
    { sel:'#qValidar', t:'Código, patente o DNI', x:'Cuando llega alguien, escribí el <b>código de 6 números</b>, la patente o el DNI y tocá la lupa: dice si tiene pase y a qué casa va.' },
    { sel:'[data-a="escanear"]', t:'Escanear el QR', x:'Con la cámara del teléfono se lee el QR del pase de la visita.' },
    { sel:'[data-a="llegada-nueva"]', t:'Llegó sin aviso', x:'Si alguien llega sin pase, le preguntás al vecino desde acá: le aparece "Que pase" o "No lo conozco".' },
    { sel:'.mapa-card', t:'El mapa del barrio', x:'Cada lote con su color según lo que pasa ahí. Escribí la <b>dirección</b> que te dice la visita y el mapa va a la casa, con los nombres de los que viven.' },
    { sel:'header.top [data-a="notifs"]', t:'Los avisos', x:'Lo que mandan los vecinos y la Administración, con sonido.' },
  ],
  admin: [
    { sel:'header.top [data-a="cambiar-modo"]', t:'Administración o vecino', x:'Si además vivís en el barrio, con este botón pasás de la gestión a tu casa y vuelta.' },
    { sel:'#cuerpo [data-a="abrir"][data-v="garita"]', t:'La garita en vivo', x:'Lo que pasa en la entrada, al instante, con el mapa del barrio. Desde acá solo se mira: la que registra es la garita.' },
    { sel:'#cuerpo [data-a="abrir"][data-v="reclamos"]', t:'Reclamos', x:'Un tablero con tarjetas: arrastrás cada reclamo de "Reportado" a "Resuelto" y al vecino le llega el aviso solo.' },
    { sel:'#cuerpo [data-a="abrir"][data-v="padron"]', t:'Padrón y guía', x:'Quién vive en cada lote, sus teléfonos y los coeficientes de expensas.' },
    { sel:'#cuerpo [data-a="abrir"][data-v="contabilidad"]', t:'Expensas y cuentas', x:'La liquidación del mes, los pagos y la carpeta del contador.' },
    { sel:'#cuerpo [data-a="abrir"][data-v="admin"]', t:'Ajustes y automatizaciones', x:'Los datos del barrio, las reglas automáticas ("si pasa esto, hacé esto") y la auditoría.' },
  ],
  supervisor: [
    { sel:'#cuerpo [data-a="abrir"][data-v="garita"]', t:'La garita en vivo', x:'Ves lo mismo que la garita, al instante, para controlar el servicio. No se puede tocar nada.' },
    { sel:'#cuerpo [data-a="abrir"][data-v="bitacora"]', t:'El libro de guardia', x:'Lo que anota la garita en cada turno.' },
    { sel:'#cuerpo [data-a="abrir"][data-v="informe-servicio"]', t:'Informe del servicio', x:'El parte de cada turno para dar el visto o anotar una observación.' },
    { sel:'#cuerpo [data-a="abrir"][data-v="privado"]', t:'Mensajes', x:'Para escribirle a la garita y a la Administración.' },
  ],
  hotel: [
    { sel:'#cuerpo [data-a="abrir"][data-v="hotel-traslados"]', t:'Vans y traslados', x:'Cargás cada traslado y la garita lo ve para dejar pasar la van.' },
    { sel:'#cuerpo [data-a="abrir"][data-v="hotel-huespedes"]', t:'Huéspedes', x:'Quién llega y quién se va: la garita los deja pasar sin llamar.' },
    { sel:'header.top [data-a="hotel-urgente"]', t:'Urgencia', x:'Para avisarle a la garita algo urgente del hotel.' },
    { sel:'#cuerpo [data-a="abrir"][data-v="privado"]', t:'Mensajes', x:'Con la garita y con la Administración.' },
  ],
};
const Recorrido = {
  pasos:[], i:0, perfil:'',
  perfilActual(){ const u = yo(); if (!u) return '';
    if (u.rol === 'guardia') return 'garita';
    if (u.rol === 'admin') return modoActivo() === 'admin' ? 'admin' : 'vecino';
    return RECORRIDOS[u.rol] ? u.rol : ''; },
  clave(p){ return `bhc.recorrido.${p}.${yo()?.id || ''}`; },
  visto(p){ try { return !!localStorage.getItem(this.clave(p)); } catch(e){ return true; } },   /* sin almacenamiento, no molesta */
  marcar(p){ try { localStorage.setItem(this.clave(p), String(Date.now())); } catch(e){} },
  /* Se llama después de cada dibujo: arranca solo la primera vez, en la pantalla principal de cada perfil. */
  quizas(){
    if (this.abierto() || this.espera) return;
    const p = this.perfilActual(); if (!p || this.visto(p)) return;
    const vista = PILA[PILA.length - 1]?.id || 'inicio';
    if (p === 'garita' ? !(vista === 'garita' || vista === 'inicio') || !$('#qValidar') : vista !== 'inicio') return;
    this.espera = setTimeout(() => { this.espera = 0;
      /* Si en el medio entró otra cuenta, se vuelve a fijar con la nueva. */
      if (this.perfilActual() !== p) return this.quizas();
      if (!this.visto(p) && !document.querySelector('dialog[open]') && !$('.portal')) this.empezar(p, true); }, 1200);
  },
  empezar(p = this.perfilActual(), primera = false){
    this.perfil = p;
    this.pasos = (RECORRIDOS[p] || []).filter(s => { const el = document.querySelector(s.sel); return el && el.getClientRects().length; });
    if (!this.pasos.length){ if (!primera) toast('El recorrido se ve en la pantalla principal: volvé al inicio y tocalo de nuevo', 'info'); return; }
    this.marcar(p);
    this.i = 0; this.pintar();
  },
  abierto(){ return !!$('#recorrido'); },
  cerrar(){ $('#recorrido')?.remove(); document.removeEventListener('keydown', this._tecla); window.removeEventListener('resize', this._ubicar); document.removeEventListener('scroll', this._ubicar, true); },
  pintar(){
    const s = this.pasos[this.i], el = s && document.querySelector(s.sel);
    if (!el){ if (this.i < this.pasos.length - 1){ this.i++; return this.pintar(); } return this.cerrar(); }
    let caja = $('#recorrido');
    if (!caja){ caja = document.createElement('div'); caja.id = 'recorrido'; caja.setAttribute('role', 'dialog'); caja.setAttribute('aria-modal', 'true');
      document.body.appendChild(caja);
      this._tecla = e => { if (e.key === 'Escape') this.cerrar(); else if (e.key === 'ArrowRight' || e.key === 'Enter') A['rec-sig'](); else if (e.key === 'ArrowLeft') A['rec-ant'](); };
      this._ubicar = () => this.ubicar();
      document.addEventListener('keydown', this._tecla); window.addEventListener('resize', this._ubicar);
      /* Mientras la pantalla se desplaza hasta el botón, la luz y el globo lo acompañan. */
      document.addEventListener('scroll', this._ubicar, true); }
    const n = this.pasos.length, ultimo = this.i === n - 1;
    caja.innerHTML = `<div class="rec-foco"></div>
      <div class="rec-globo" aria-live="polite"><div class="rec-cab"><span class="rec-num">${this.i + 1}<small>/${n}</small></span><b>${s.t}</b>
        <button class="rec-x" data-a="rec-cerrar" aria-label="Cerrar el recorrido">${I('x')}</button></div>
        <p>${s.x}</p>
        <div class="rec-puntos">${this.pasos.map((_, j) => `<i class="${j === this.i ? 'on' : j < this.i ? 'hecho' : ''}"></i>`).join('')}</div>
        <div class="rec-btns">${this.i ? `<button class="btn btn-sm btn-sec" data-a="rec-ant">${I('left')}Atrás</button>` : `<button class="btn btn-sm btn-sec" data-a="rec-cerrar">Saltar</button>`}
          <button class="btn btn-sm btn-pri" data-a="rec-sig">${ultimo ? `${I('check')}¡Listo!` : `Siguiente${I('right')}`}</button></div></div>`;
    el.scrollIntoView({ block:'center', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    this.ubicar(); setTimeout(() => this.ubicar(), 380);
    caja.querySelector('[data-a="rec-sig"]')?.focus({ preventScroll:true });
  },
  /* La luz sobre el botón y el globo al lado (abajo si entra; si no, arriba). */
  ubicar(){
    const caja = $('#recorrido'), s = this.pasos[this.i], el = s && document.querySelector(s.sel); if (!caja || !el) return;
    const r = el.getBoundingClientRect(), m = 6, foco = caja.querySelector('.rec-foco'), g = caja.querySelector('.rec-globo');
    Object.assign(foco.style, { left:(r.left - m) + 'px', top:(r.top - m) + 'px', width:(r.width + 2 * m) + 'px', height:(r.height + 2 * m) + 'px' });
    const W = innerWidth, H = innerHeight, gw = Math.min(340, W - 24), gh = g.offsetHeight || 180;
    g.style.width = gw + 'px';
    g.style.left = Math.max(12, Math.min(W - gw - 12, r.left + r.width / 2 - gw / 2)) + 'px';
    const abajo = r.bottom + m + 14 + gh < H, arriba = r.top - m - 14 - gh > 0;
    g.style.top = (abajo ? r.bottom + m + 14 : arriba ? r.top - m - 14 - gh : Math.max(12, H - gh - 12)) + 'px';
    g.dataset.lado = abajo ? 'abajo' : arriba ? 'arriba' : 'centro';
  },
};
A['rec-sig'] = () => { if (Recorrido.i < Recorrido.pasos.length - 1){ Recorrido.i++; Recorrido.pintar(); } else { Recorrido.cerrar(); toast('¡Listo! Si querés verlo otra vez, está en el Manual de uso', 'check'); } };
A['rec-ant'] = () => { if (Recorrido.i > 0){ Recorrido.i--; Recorrido.pintar(); } };
A['rec-cerrar'] = () => Recorrido.cerrar();
/* Desde el Manual: vuelve a la pantalla principal y lo arranca. */
A['recorrido'] = () => {
  const p = Recorrido.perfilActual(); if (!p) return;
  PILA.length = 0; pintar();
  if (p === 'garita' && $('#qValidar') === null && typeof abrir === 'function') abrir('garita');
  setTimeout(() => Recorrido.empezar(p), 450);
};
