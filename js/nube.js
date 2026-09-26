/* =========================================================
   LA NUBE (Firebase Realtime Database)
   -------------------------------------------------------
   Sin configurar, la app funciona en un solo equipo y este
   archivo no hace nada. Con firebase-config.js completo,
   los datos pasan a estar en la base del barrio.

   Hay TRES ZONAS, y esa división es la que hace que lo
   privado sea privado de verdad (las reglas de la base lo
   hacen cumplir, no la pantalla):

     /barrio    lo que ven todos los vecinos aprobados:
                pizarrón, chat, reservas, votaciones, padrón,
                documentos, obras, compras, viajes, perfiles.
     /pv/<carpeta>/<uid>   lo de cada vecino (desde el 25-09-2026;
                antes /privado/<uid>): sus mensajes, reclamos,
                peticiones, pases, pagos y avisos personales. Cada
                vecino lee solo lo suyo; cada carpeta entera la lee
                solo el rol que la necesita (ver Nube.PV). Los
                mensajes entre vecinos no los lee nadie más.
     /staff     lo de la guardia y la Administración: bitácora,
                SOS, correos, auditoría, puntos y pasos de ronda.
   ========================================================= */
/* La configuración puede venir con cualquiera de los dos nombres: el que usa
   este proyecto (FIREBASE) o el que copia y pega la consola de Firebase
   (firebaseConfig). Las dos formas valen. */
function configFirebase(){
  const a = typeof FIREBASE !== 'undefined' ? FIREBASE : null;
  const b = typeof firebaseConfig !== 'undefined' ? firebaseConfig : null;
  if (a && a.databaseURL) return a;
  if (b && b.databaseURL) return b;
  return null;
}

const Nube = {
  app: null, db: null, auth: null, uid: null,
  ultimo: {},          /* última versión escrita, para no reescribir de más */
  listos: new Set(),
  arrancada: false,

  /* Con ?local en la dirección, la app trabaja solo en este equipo, sin tocar
     la base del barrio. Sirve para probar cambios sin ensuciar los datos. */
  activa(){ return !/[?&]local\b/.test(location.search) && typeof firebase !== 'undefined' && !!configFirebase(); },

  /* Colecciones de cada zona. El resto (config, motorLog) va aparte. */
  ZONAS: {
    barrio: ['users','padron','amenities','agenda','temporadas','feriados','eventosCiudad','contactos','documentos',
             'posts','msgs','reservas','bloqueos','votaciones','compras','viajes','obras','proveedores','avistamientos',
             'gastos','liquidaciones','cruceros','promos','comunicados','notifsTodos','descargas','camion','alertas'],
    privado: ['privados','dms','reclamos','peticiones','pases','solicitudesPase','infracciones','notifs','llegadas','paquetes','pagos','recibos'],
    staff: ['bitacora','avisos','sos','correos','auditoria','impuestos','frecuentes','asientos','puntos','pasos','rondaCodigos'],
  },

  /* =========================================================
     LO QUE LA BASE SE COME
     -------------------------------------------------------
     Firebase no guarda listas ni objetos vacíos: `comments: []` o
     `reactions: {}` desaparecen, y al leerlos vuelven como `undefined`.
     Después, `x.comments.map(...)` revienta y se lleva puesta la ventana
     entera. Con `?local` no se nota, porque los datos no pasan por la base:
     por eso la demo anda y el barrio de verdad no.

     Acá está, por colección, qué campos son lista y cuáles objeto. Todo lo
     que baja pasa por `comoLaGuardamos()` antes de entrar al estado, así el
     resto de la app puede confiar en que están. Poner un campo de más no
     molesta; que falte uno rompe la app. */
  FORMAS: {
    users:           { listas:['mascotas','vehiculos'], objetos:['retiroPubs'] },

    posts:           { listas:['comments','voy'], objetos:['reactions'] },
    notifs:          { listas:['para','leidas'] },
    notifsTodos:     { listas:['para','leidas'] },
    privados:        { listas:['msgs'] },
    bitacora:        { listas:['guardias','policias'] },
    dms:             { listas:['msgs'] },
    msgs:            { listas:[] },
    pases:           { listas:['dias','listaInvitados'], objetos:['log'] },
    solicitudesPase: { listas:['dias'], objetos:['log'] },
    reservas:        { listas:['listaInvitados'] },
    reclamos:        { listas:['apoyos','historial'] },
    peticiones:      { listas:['apoyos','historial','firmas'] },
    votaciones:      { listas:['opciones'], objetos:['votos'] },
    comunicados:     { listas:['vistos'], objetos:['respuestas'] },
    compras:         { listas:['anotados'] },
    viajes:          { listas:['anotados'] },
    obras:           { listas:['historial'], objetos:['avisoHoy'] },
    infracciones:    { listas:['historial'] },
    liquidaciones:   { listas:['filas'] },
    documentos:      { listas:['versiones'] },
    padron:          { listas:['titulares'] },
    amenities:       { listas:['franjas'] },
    cruceros:        { listas:['escalas'] },
    descargas:       { listas:[] },
    alertas:         { listas:['lotes'], objetos:['respuestas'] },
    frecuentes:      { listas:['dias'] },
    camion:          { listas:[] },
  },
  comoLaGuardamos(col, x){
    const f = this.FORMAS[col];
    if (!f || !x || typeof x !== 'object') return x;
    (f.listas || []).forEach(k => { x[k] = aLista(x[k]); });
    (f.objetos || []).forEach(k => { if (!x[k] || typeof x[k] !== 'object' || Array.isArray(x[k])) x[k] = {}; });
    return x;
  },

  /* De quién es cada cosa de la zona privada (puede ser de más de uno). */
  duenos(col, x){
    switch (col){
      case 'privados': return [x.userId];
      case 'dms': return [x.a, x.b];
      case 'reclamos': case 'peticiones': return [x.userId];
      case 'pases': case 'solicitudesPase': case 'llegadas': case 'paquetes': return [x.hostId];
      case 'infracciones':
        return Store.s.users.filter(u => u.casa === x.casa && u.estado === 'aprobado').map(u => u.id);
      /* PAGOS Y RECIBOS VAN POR LOTE (arreglado el 26-09-2026). Antes se
         buscaba `x.casa`, pero un pago guarda `lote`: no coincidía con
         nadie y el pago informado por un vecino NO llegaba a la base (o
         iba a parar a la carpeta de una cuenta sin casa, que el vecino no
         puede escribir, y Firebase rechazaba todo el guardado). Ahora van a
         todas las cuentas aprobadas de ese lote, más quien lo informó; y si
         el lote no tiene ninguna cuenta (un propietario sin la app), a una
         carpeta del lote ("lote-148") que lee la Administración. */
      case 'pagos': case 'recibos': {
        const lote = x.lote || x.casa;
        const us = Store.s.users.filter(u => u.casa === lote && u.estado === 'aprobado').map(u => u.id);
        if (x.userId && usuario(x.userId)?.casa === lote && !us.includes(x.userId)) us.push(x.userId);
        return us.length ? us : lote ? ['lote-' + String(lote).replace(/^Lote\s*/i, '').replace(/[.#$/\[\]\s]/g, '')] : [];
      }
      case 'notifs': return aLista(x.para).filter(p => p && !String(p).startsWith('rol:') && p !== 'todos' && p !== 'staff');
      default: return [];
    }
  },
  /* Un aviso para todos o para un rol no puede ir a la carpeta de nadie:
     va al pizarrón de avisos del barrio, y cada uno filtra lo suyo. */
  esNotifGeneral: n => aLista(n.para).some(p => p === 'todos' || p === 'staff' || String(p).startsWith('rol:')),

  async iniciar(){
    if (!this.activa()) return false;
    this.app = firebase.initializeApp(configFirebase());
    this.auth = firebase.auth();
    this.db = firebase.database();
    await this.auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL).catch(() => {});
    return new Promise(ok => {
      this.auth.onAuthStateChanged(async user => {
        this.uid = user ? user.uid : null;
        if (!user){ Store.sesion.userId = null; Store.guardarSesion(); this.arrancada = false; if (!(typeof rutaPublica === 'function' && location.hash.startsWith('#/') && rutaPublica())) pintar(); return ok(true); }
        await this.cargar();
        ok(true);
      });
    });
  },

  /* Trae todo lo que este usuario tiene permitido ver y queda escuchando. */
  async cargar(){
    const s = Store.s;
    /* Se vacía todo lo que maneja la nube: si quedaron datos de la demo o de
       otra sesión en este equipo, no tienen que subir a la base del barrio. */
    [...this.ZONAS.barrio, ...this.ZONAS.privado, ...this.ZONAS.staff].forEach(col => { if (Array.isArray(s[col])) s[col] = []; });
    s.notifs = []; s.motorLog = {}; this.ultimo = {}; this.configLista = false; this.motorListo = false;
    this.listos = new Set(); this.esperados = new Set(); this.arranqueAt = Date.now();
    /* Leer la ficha propia. Si la base falla (conexión lenta, un corte),
       NO es lo mismo que "no hay ficha": antes se confundía y la cuenta de
       la garita terminaba en la pantalla de completar datos. Se reintenta. */
    let yoNodo = null, fallo = null;
    for (let i = 0; i < 4; i++){
      try { yoNodo = await this.db.ref('barrio/users/' + this.uid).get(); fallo = null; break; }
      catch(e){ fallo = e; await new Promise(r => setTimeout(r, 1200 * (i + 1))); }
    }
    if (fallo){ toast('No se pudo leer tu ficha en la base del barrio. Revisá la conexión y volvé a entrar.', 'alert'); console.warn('Ficha', fallo); return; }
    let mio = yoNodo && yoNodo.exists() ? yoNodo.val() : null;
    /* =========================================================
       LA GARITA ENTRA SOLA, SIN LA ADMINISTRACIÓN
       La cuenta garitabarriobahiacauquen@gmail.com se habilita ella misma
       como garita: si su ficha no está, o quedó como vecino o pendiente, la
       escribe con rol "guardia", lote "Garita" y aprobada. Las reglas de
       Firebase lo permiten SOLO a quien entra con ese correo exacto (y con
       su contraseña), y solo como garita: nunca como Administración.
       No pide nombre, DNI ni nada.
       ========================================================= */
    const correo = this.auth.currentUser.email || '';
    if (esCorreoGarita(correo) && (!mio || mio.estado !== 'aprobado' || mio.rol !== 'guardia' || mio.casa !== 'Garita')){
      const g = { ...(mio || {}), id:this.uid, nombre:'Garita', casa:'Garita', dni:'', email:correo.toLowerCase(), tel:(mio && mio.tel) || '',
        rol:'guardia', estado:'aprobado', aprobadoAt:(mio && mio.aprobadoAt) || Date.now(), consentimiento:(mio && mio.consentimiento) || Date.now(), createdAt:(mio && mio.createdAt) || Date.now() };
      try { await this.db.ref('barrio/users/' + this.uid).set(g); mio = g; }
      catch(e){
        /* Solo pasa si en Firebase siguen las reglas viejas. */
        console.warn('La garita no pudo habilitarse sola', e.message);
        $('#app').innerHTML = `<section class="bienvenida"><div class="foto" style="background-image:url('${Clima.portada()}')"></div>
          <div class="marca"><span class="logo">${LOGO}</span><div><b style="font-size:16px">Barrio ${esc(Store.s.config.nombre)}</b></div></div>
          <h1 style="font-size:30px">Garita</h1><div class="panel"><p style="margin:0 0 10px"><b>Falta publicar las reglas nuevas de Firebase.</b></p>
          <p style="margin:0 0 12px;opacity:.9">La garita entra sola, pero para eso Firebase tiene que tener las reglas del archivo <b>reglas-firebase.txt</b> nuevo (Realtime Database → Reglas → pegar → Publicar). Después tocá "Probar de nuevo".</p>
          <button class="btn btn-pri btn-block" onclick="location.reload()">Probar de nuevo</button></div></section>`;
        return;
      }
    }
    Store.sesion.userId = this.uid; Store.guardarSesion();
    if (!mio){
      /* Hay cuenta pero no hay ficha de vecino. Pasa cuando el alta quedó a
         medias. Si el barrio todavía no tiene ninguna ficha, esta es la
         primera y queda como Administración; si no, se completa y espera
         aprobación. En los dos casos se le pide que complete sus datos. */
      s.users = [];
      this.libre = false;
      try { this.libre = !(await this.db.ref('barrio/publico/instalado').get()).exists(); } catch(e){}
      pintarBienvenida('completar');
      this.escuchar('barrio/users/' + this.uid, v => { if (v && v.estado === 'aprobado' && !this.arrancada) location.reload(); });
      return;
    }
    /* Si cambió el correo de la cuenta, la ficha lo toma al entrar. */
    if (this.auth.currentUser.email && mio.email !== this.auth.currentUser.email){
      mio.email = this.auth.currentUser.email;
      this.db.ref('barrio/users/' + this.uid + '/email').set(mio.email).catch(() => {});
    }
    /* La ficha propia entra al estado antes de escuchar nada: así la app se
       dibuja ya logueada y no aparece un parpadeo del portal mientras bajan
       las colecciones. */
    Store.s.users = [this.comoLaGuardamos('users', mio)];
    Store.sesion.visitaAnterior = Store.sesion.ultimaVisita || 0;
    Store.sesion.ultimaVisita = Date.now();
    Store.guardarSesion();
    const staff = mio.rol === 'admin' || mio.rol === 'guardia';
    this.escucharColeccion('barrio', this.ZONAS.barrio);
    this.escucharConfig();
    if (staff) this.escucharColeccion('staff', this.ZONAS.staff);
    else this.escucharColeccion('staff', ['sos'], true);  /* para ver el estado de la propia alerta */
    this.escucharPv(mio.rol);
    if (mio.rol === 'admin') setTimeout(() => this.mudarPrivado(), 3000);
    this.arrancada = true;
    this.anotarPresencia();
    /* Si administra el barrio, elige desde qué brazo entra. */
    if (mio.rol === 'admin' && !Store.sesion.modo) setTimeout(() => { if (typeof elegirModo === 'function' && yo()) elegirModo({ alEntrar:true }); }, 500);
    /* Las alertas que ya estaban abiertas antes de entrar no saltan ni
       suenan: eso lo decide pintarAlarmas() por la hora de cada alerta. */
    if (mio.rol === 'admin') this.sembrarContenido().then(() => this.sumarNuevos());
    Fotos.relevo = { bajar: id => this.bajarFotoCasa(id), subir: async () => {} };
    setTimeout(() => this.fotoCasaAlDia(), 4000);
    /* La cuenta de la garita se reconoce por el correo: si quedó como vecino
       (se inscribió por el portal común), la Administración la corrige sola. */
    if (mio.rol === 'admin'){ setTimeout(() => this.corregirGarita(), 5000); setInterval(() => this.corregirGarita(), 60000); }
    if (mio.rol === 'admin') setTimeout(() => this.limpiarFotos(), 20000);
    if (mio.rol === 'admin' && !this.repartiendo){ this.repartiendo = true; setTimeout(() => this.repartirPagos(), 30000); setInterval(() => this.repartirPagos(), 10 * MIN); }

    /* Lo viejo pasa al archivo histórico una vez por día (js/historial.js). */
    setTimeout(() => { if (typeof Historial !== 'undefined' && this.listoParaMotor()) Historial.archivar(); }, 45000);
    /* La Administración deja a mano la dirección del correo para quien se
       inscribe, y manda lo que haya quedado sin salir. */
    if (mio.rol === 'admin') setTimeout(async () => {
      await this.publicarCorreo();
      const n = await Correo.reintentar();
      if (n) toast(`Salieron ${plural(n, 'correo que estaba pendiente', 'correos que estaban pendientes')}`, 'mail');
    }, 6000);
  },
  /* =========================================================
     LO NUEVO DE CADA VERSIÓN LLEGA A LA BASE
     sembrarContenido() solo llena lo que está VACÍO. Si la base ya tiene
     agenda, un lugar nuevo que se agregó al código no aparecería nunca.
     Esto suma, por id, lo que falta, y anota en config.sumados qué ids ya
     se sumaron, para no volver a poner algo que la Administración borró a
     propósito.
     ========================================================= */
  async sumarNuevos(){
    if (!this.db || !esAdmin()) return;
    const hechos = new Set(aLista(Store.s.config.sumados));
    const nuevos = {
      agenda: agendaInicial().filter(a => AGENDA_NUEVOS.includes(a.categoria)),
      documentos: MARCO_LEGAL.map(d => ({ ...d, createdAt:Date.now(), updatedAt:Date.now() })),
      descargas: DESCARGAS,
    };
    let n = 0; const cambios = {};
    for (const col in nuevos){
      let hay = {};
      try { hay = (await this.db.ref('barrio/' + col).get()).val() || {}; } catch(e){ continue; }
      nuevos[col].forEach(x => {
        const clave = col + ':' + x.id;
        if (hechos.has(clave)) return;
        hechos.add(clave);
        if (!hay[x.id]) { cambios[`barrio/${col}/${x.id}`] = JSON.parse(JSON.stringify(x)); n++; }
      });
    }
    try {
      if (n) await this.db.ref().update(cambios);
      if (hechos.size !== aLista(Store.s.config.sumados).length) Store.cambiar(s => { s.config.sumados = [...hechos]; });
      if (n) toast(`Se sumaron ${plural(n, 'novedad', 'novedades')} a la agenda, las normas y las descargas`, 'check');
    } catch(e){ console.warn('No se pudo sumar lo nuevo', e.message); }
  },
  async publicarCorreo(){
    const c = Store.s.config;
    if (!this.db || !esAdmin() || !c.correoUrl || !c.correoClave) return;
    const nuevo = { url:c.correoUrl, clave:c.correoClave, adminEmail:c.adminEmail || '' };
    try {
      const ref = this.db.ref('barrio/publico/correo');
      if (JSON.stringify((await ref.get()).val()) !== JSON.stringify(nuevo)) await ref.set(nuevo);
    } catch(e){ console.warn('No se pudo publicar la dirección del correo (¿faltan publicar las reglas?)', e.message); }
  },

  /* La primera vez, la base está vacía: no tiene los espacios comunes, la
     agenda de Ushuaia, las temporadas, los feriados ni el reglamento. Eso
     vive en el código como punto de partida, así que la Administración lo
     sube una vez y a partir de ahí lo edita desde Contenido. */
  async sembrarContenido(){
    const base = seed();
    const arranque = {
      amenities: JSON.parse(JSON.stringify(AMENITIES)),
      agenda: agendaInicial(),
      temporadas: JSON.parse(JSON.stringify(TEMPORADAS)),
      feriados: JSON.parse(JSON.stringify(FERIADOS)),
      eventosCiudad: eventosCiudadIniciales(),
      contactos: JSON.parse(JSON.stringify(CONTACTOS)),
      documentos: base.documentos,
      /* Promociones de ejemplo, para que la tira del hotel se vea desde el
         primer día y se entienda para qué sirve. Son de muestra: la
         Administración las edita o las borra en Contenido → Promociones, y
         si pone la dirección del lector en Ajustes, las reemplazan las que
         publica el hotel. */
      promos: base.promos,
      descargas: JSON.parse(JSON.stringify(DESCARGAS)),
    };
    let puestos = 0;
    for (const col in arranque){
      try {
        const snap = await this.db.ref('barrio/' + col).get();
        if (snap.exists() && Object.keys(snap.val() || {}).length) continue;
        const obj = {};
        (arranque[col] || []).forEach(x => { if (x && x.id) obj[x.id] = x; });
        if (!Object.keys(obj).length) continue;
        await this.db.ref('barrio/' + col).set(obj);
        puestos++;
      } catch(e){ console.warn('No se pudo sembrar', col, e.message); }
    }
    if (puestos) toast('Se cargó el contenido inicial del barrio', 'check');
  },

  /* =========================================================
     PRESENCIA: esta app está abierta
     Cada equipo se anota en barrio/presencia/<uid>/<equipo>. El
     onDisconnect lo registra el SERVIDOR: si el celular se queda sin
     batería o se cierra la pestaña, Firebase lo borra solo. Se vuelve a
     anotar cada vez que se recupera la conexión.
     ========================================================= */
  presRef: null,
  anotarPresencia(){
    if (this.presRef) return;
    let eq = '';
    try { eq = sessionStorage.getItem('bhc.equipo') || ''; } catch(e){}
    if (!eq){ eq = 'e' + uid(); try { sessionStorage.setItem('bhc.equipo', eq); } catch(e){} }
    const ref = this.presRef = this.db.ref(`barrio/presencia/${this.uid}/${eq}`);
    const ahora = firebase.database.ServerValue.TIMESTAMP;
    this.db.ref('.info/connected').on('value', snap => {
      if (snap.val() !== true || !this.presRef) return;
      ref.onDisconnect().remove().then(() => ref.set({ at:ahora, activa:!document.hidden })).catch(() => {});
    });
    document.addEventListener('visibilitychange', () => { if (this.presRef) ref.update({ activa:!document.hidden, at:ahora }).catch(() => {}); });
    this.db.ref('barrio/presencia').on('value', snap => { if (typeof Presencia !== 'undefined') Presencia.poner(snap.val()); },
      err => console.warn('No se pudo leer la presencia (¿faltan publicar las reglas?)', err.message));
  },
  async borrarPresencia(){
    const r = this.presRef; this.presRef = null;
    if (r) try { await r.onDisconnect().cancel(); await r.remove(); } catch(e){}
  },

  escuchar(ruta, fn){ this.db.ref(ruta).on('value', snap => fn(snap.val())); },

  /* Al conectar llegan veinte colecciones casi juntas. Si cada una redibujara
     la ventana, la app se arrastraría y los botones no responderían durante
     varios segundos: por eso se junta todo en un dibujo por cuadro. Y lo que
     llega de otro equipo pasa por el mismo camino que un cambio local, así
     los avisos de la guardia y el SOS suenan también acá. */
  llegoAlgo(){
    if (typeof Conexion !== 'undefined') Conexion.poner('vivo');
    if (this.tanda) return;
    this.tanda = setTimeout(() => {
      this.tanda = null;
      if (typeof refrescarPronto === 'function') refrescarPronto(); else refrescar();
      if (typeof avisosDelSistema === 'function' && yo()) avisosDelSistema();
    }, 60);
  },
  tanda: null,

  escucharColeccion(base, cols, opcional = false){
    cols.forEach(col => {
      /* Bitácora, auditoría y chat bajan solo lo reciente (ver js/historial.js). */
      const ref = this.db.ref(`${base}/${col}`), q = typeof Historial !== 'undefined' ? Historial.consulta(ref, col) : ref;
      q.on('value', snap => {
        const v = snap.val() || {};
        const arr = Object.keys(v).map(k => this.comoLaGuardamos(col, v[k]));
        if (col === 'notifsTodos') Store.s.notifs = [...arr, ...Store.s.notifs.filter(n => !this.esNotifGeneral(n))];
        else if (col === 'notifs') Store.s.notifs = [...Store.s.notifs.filter(n => this.esNotifGeneral(n)), ...arr];
        else Store.s[col] = arr;
        Store.s.notifs.sort((a, b) => b.at - a.at);
        this.recordar(col, arr);
        /* Los avisos generales también quedan anotados como "lo que ya está
           en la base". Antes no: cada equipo, al guardar por primera vez,
           volvía a escribir TODOS los avisos generales con su copia, y si en
           el medio alguien había marcado uno como visto, se lo borraba (el
           aviso volvía a aparecer). Lo encontró la prueba de varios equipos. */
        if (col === 'notifsTodos') this.recordar('notifs', Store.s.notifs);
        this.listos.add(base + col);
        if (this.arrancada) this.llegoAlgo();
      }, err => { this.listos.add(base + col); if (!opcional) console.warn('No se pudo leer', base, col, err.message); });
      if (!opcional) this.esperados.add(base + col);
    });
  },
  /* =========================================================
     EL MOTOR ESPERA A QUE HAYA LLEGADO TODO
     Las reglas del motor deciden por lo que hay (y por lo que NO hay): con
     la configuración todavía de fábrica, el camión "pasaba" los días viejos
     ("Mañana pasa el camión: Húmedos"); sin las liquidaciones, "falta
     cerrar el mes". Por eso el motor recién corre cuando llegaron la
     configuración, las marcas y la primera lectura de cada colección (o su
     error). Si algo no contesta en 30 s, corre igual.
     ========================================================= */
  listoParaMotor(){
    if (!this.arrancada || !this.configLista || !this.motorListo) return false;
    if (Date.now() - (this.arranqueAt || 0) > 30000) return true;
    for (const k of this.esperados || []) if (!this.listos.has(k)) return false;
    return true;
  },
  esperarMotor(){
    clearInterval(this.esperandoMotor);
    this.esperandoMotor = setInterval(() => {
      if (!this.arrancada){ clearInterval(this.esperandoMotor); return; }
      if (!this.listoParaMotor()) return;
      clearInterval(this.esperandoMotor);
      if (typeof Motor !== 'undefined') setTimeout(() => Motor.correr(), 800);
    }, 400);
  },
  /* =========================================================
     LA CARPETA PRIVADA, ORDENADA POR COLECCIÓN (desde el 25-09-2026)
     Antes era privado/<vecino>/<colección>, y la garita y la Administración
     tenían permiso para leer "privado" entero: en Firebase un permiso dado
     arriba no se puede quitar abajo, así que técnicamente podían leer todo,
     también los mensajes entre vecinos. Ahora es pv/<carpeta>/<vecino>/<id>:
     las reglas dan cada CARPETA solo al rol que la necesita, y cada vecino
     lee únicamente lo suyo (pv/<carpeta>/<su uid>).
     Los mensajes privados se guardan en tres carpetas según con quién son:
     "privados" (con la Administración), "privadosGuardia" (con la garita) e
     "privadosInterno" (garita ↔ Administración). En la app siguen siendo una
     sola colección (Store.s.privados) con su campo `con`.
     ========================================================= */
  PV: {
    privados:        { col:'privados',        leen:['admin'] },
    privadosGuardia: { col:'privados',        leen:['guardia'] },
    privadosInterno: { col:'privados',        leen:['admin', 'guardia'] },
    dms:             { col:'dms',             leen:[] },
    notifs:          { col:'notifs',          leen:[] },
    reclamos:        { col:'reclamos',        leen:['admin'] },
    infracciones:    { col:'infracciones',    leen:['admin'] },
    pagos:           { col:'pagos',           leen:['admin'] },
    recibos:         { col:'recibos',         leen:['admin'] },
    peticiones:      { col:'peticiones',      leen:['admin', 'guardia'] },
    pases:           { col:'pases',           leen:['admin', 'guardia'] },
    solicitudesPase: { col:'solicitudesPase', leen:['admin', 'guardia'] },
    llegadas:        { col:'llegadas',        leen:['admin', 'guardia'] },
    paquetes:        { col:'paquetes',        leen:['admin', 'guardia'] },
  },
  carpetaDe(col, x){
    if (col !== 'privados') return col;
    return x && x.con === 'guardia' ? 'privadosGuardia' : x && x.con === 'interno' ? 'privadosInterno' : 'privados';
  },
  pvDatos: {}, pvDonde: {},
  /* =========================================================
     CADA PAGO Y CADA RECIBO, EN LA CARPETA DE CADA VECINO DEL LOTE
     La app de la Administración revisa (al abrir y cada tanto) que cada
     pago y cada recibo esté en la carpeta de todas las cuentas del lote:
       · un vecino que se inscribió después ve igual sus pagos anteriores;
       · lo que quedó en "lote-148" (propietario sin cuenta) pasa a la
         carpeta del vecino cuando se inscribe;
       · las copias que quedaron en la carpeta equivocada (el error de
         "casa" y "lote", arreglado el 26-09-2026) se borran.
     ========================================================= */
  repartirPagos(){
    if (!this.db || yo()?.rol !== 'admin' || !this.listoParaMotor || !this.listoParaMotor()) return 0;
    if (!Store.s.users.some(u => u.estado === 'aprobado' && /^Lote\s/.test(u.casa || ''))) return 0;
    const cambios = {};
    ['pagos', 'recibos'].forEach(f => {
      const donde = this.pvDonde[f] || {};
      aLista(Store.s[f]).forEach(x => {
        if (!x || !x.id) return;
        const quiero = this.duenos(f, x), hay = donde[x.id] || [];
        quiero.filter(d => !hay.includes(d)).forEach(d => { cambios[`pv/${f}/${d}/${x.id}`] = x; });
        hay.filter(d => !quiero.includes(d) && (d.startsWith('lote-') || (usuario(d) && usuario(d).casa !== (x.lote || x.casa)) || !usuario(d)))
          .forEach(d => { cambios[`pv/${f}/${d}/${x.id}`] = null; });
      });
    });
    const n = Object.keys(cambios).length;
    if (n) this.db.ref().update(JSON.parse(JSON.stringify(cambios, (k, v) => v === undefined ? null : v))).catch(e => console.warn('No se pudieron repartir los pagos', e.message));
    return n;
  },

  escucharPv(rol){
    this.pvDatos = {};
    Object.entries(this.PV).forEach(([f, def]) => {
      const todo = def.leen.includes(rol);
      this.db.ref(todo ? `pv/${f}` : `pv/${f}/${this.uid}`).on('value', snap => {
        const v = snap.val() || {}, arr = [];
        const meter = nodo => { if (nodo && typeof nodo === 'object') Object.keys(nodo).forEach(id => { const x = nodo[id]; if (x && typeof x === 'object') arr.push(this.comoLaGuardamos(def.col, x)); }); };
        /* Quien lee la carpeta entera (la Administración) anota además en
           qué carpetas está cada registro: lo usa repartirPagos(). */
        if (todo){ const donde = {}; Object.entries(v).forEach(([dueno, nodo]) => { meter(nodo); if (nodo && typeof nodo === 'object') Object.keys(nodo).forEach(id => { (donde[id] = donde[id] || []).push(dueno); }); }); this.pvDonde[f] = donde; }
        else meter(v);
        this.pvDatos[f] = arr;
        this.juntarPv(def.col);
        this.listos.add('pv/' + f);
        if (this.arrancada) this.llegoAlgo();
      }, err => { this.listos.add('pv/' + f); console.warn('No se pudo leer', 'pv/' + f, err.message); });
      this.esperados.add('pv/' + f);
    });
  },
  juntarPv(col){
    const vistos = new Map(), arr = [];
    /* El mismo registro puede estar en la carpeta de varios vecinos del
       lote. Si alguna copia quedó vieja (un pago "informado" que en otra
       carpeta ya figura "confirmado"), gana la más avanzada. */
    const peso = x => col === 'pagos' ? (x.estado === 'confirmado' || x.estado === 'rechazado' ? 2 : 1) * 1e13 + (x.confirmadoAt || x.at || 0) : 0;
    Object.entries(this.PV).filter(([, d]) => d.col === col).forEach(([f]) => (this.pvDatos[f] || []).forEach(x => {
      if (!x.id) return;
      if (!vistos.has(x.id)){ vistos.set(x.id, arr.length); arr.push(x); }
      else if (peso(x) > peso(arr[vistos.get(x.id)])) arr[vistos.get(x.id)] = x;
    }));
    if (col === 'notifs') Store.s.notifs = [...Store.s.notifs.filter(n => this.esNotifGeneral(n)), ...arr].sort((a, b) => b.at - a.at);
    else Store.s[col] = arr;
    this.recordar(col, col === 'notifs' ? Store.s.notifs : arr);
  },
  /* Mudanza, una sola vez: lo que había en la carpeta vieja (privado/…) pasa
     a pv/… y la carpeta vieja se borra, para que no quede ninguna copia con
     el permiso viejo. La hace la Administración al abrir la app (es la única
     que puede leer la carpeta vieja con las reglas nuevas). Si algo falla,
     no borra nada y lo vuelve a intentar la próxima vez. */
  async mudarPrivado(){
    if (!this.db || yo()?.rol !== 'admin') return;
    let viejo;
    try { viejo = (await this.db.ref('privado').get()).val(); } catch(e){ console.warn('Mudanza de la carpeta privada: no se pudo leer la vieja', e.message); return; }
    if (!viejo) return;
    const cambios = {}; let n = 0;
    Object.entries(viejo).forEach(([uid, cols]) => Object.entries(cols || {}).forEach(([col, nodo]) => {
      if (!this.ZONAS.privado.includes(col) || !nodo || typeof nodo !== 'object') return;
      Object.entries(nodo).forEach(([id, x]) => { if (x && typeof x === 'object'){ cambios[`pv/${this.carpetaDe(col, x)}/${uid}/${id}`] = x; n++; } });
    }));
    /* En tandas de 400: si una tanda falla, no se borra nada y se reintenta
       la próxima vez. Los de privadosGuardia van de a uno: ahí la
       Administración solo puede CREAR, así que en un reintento los que ya
       pasaron se rechazan (y está bien: ya están). */
    try {
      const rutas = Object.keys(cambios).filter(r => !r.startsWith('pv/privadosGuardia/'));
      for (const r of Object.keys(cambios).filter(r => r.startsWith('pv/privadosGuardia/'))) await this.db.ref(r).set(cambios[r]).catch(() => {});
      for (let i = 0; i < rutas.length; i += 400){ const t = {}; rutas.slice(i, i + 400).forEach(r => { t[r] = cambios[r]; }); await this.db.ref().update(t); }
      await this.db.ref('privado').remove();
      console.info(`Carpeta privada mudada: ${n} registros`);
    } catch(e){ console.warn('Mudanza de la carpeta privada: no se completó, se reintenta al volver a entrar', e.message); }
  },
  escucharConfig(){
    this.configLista = false;
    this.db.ref('barrio/config').on('value', snap => {
      const c = snap.val(); if (c) Store.s.config = Object.assign({}, CONFIG_BASE, c);
      this.ultimo.config = JSON.stringify(Store.s.config);
      this.configLista = true;
      if (this.arrancada) this.llegoAlgo();
    });
    /* Las marcas del motor son compartidas: así un aviso automático sale una
       sola vez para todo el barrio y no una por equipo encendido. Hasta que
       no llega esta lectura, el motor no corre (Motor.correr mira motorListo). */
    this.motorListo = false;
    this.db.ref('barrio/motorLog').on('value', snap => {
      Store.s.motorLog = snap.val() || {};
      this.ultimo.motorLog = JSON.stringify(Store.s.motorLog);
      if (!this.motorListo){ this.motorListo = true; this.esperarMotor(); }
    });
  },
  motorListo: false,
  /* Pide una marca del motor: la gana el primer equipo que la anota en la
     base (transacción de Firebase) y solo ese da el aviso. Si ya estaba,
     o la anotó otro un instante antes, devuelve false. */
  async reclamarMarca(clave){
    if (!this.db || !this.arrancada) return false;
    const at = Date.now();
    const r = await this.db.ref('barrio/motorLog/' + clave).transaction(cur => cur ? undefined : at, undefined, false);
    if (!r || !r.committed || r.snapshot.val() !== at) return false;
    Store.s.motorLog[clave] = at;
    let antes = {}; try { antes = JSON.parse(this.ultimo.motorLog || '{}') || {}; } catch(e){}
    antes[clave] = at; this.ultimo.motorLog = JSON.stringify(antes);
    return true;
  },

  recordar(col, arr){ this.ultimo[col] = {}; arr.forEach(x => { if (x && x.id) this.ultimo[col][x.id] = JSON.stringify(x); }); },

  /* =========================================================
     LO QUE UN VECINO ESCRIBE EN UN REGISTRO QUE NO ES SUYO
     Una votación, un comunicado o un aviso urgente los crea la
     Administración; el vecino solo agrega SU voto, SU "visto" o SU
     respuesta. Las reglas le permiten escribir únicamente esa parte, así
     que si la app manda el registro entero, Firebase lo rechaza todo: los
     votos y los acuses de los vecinos no se guardaban (en ?local no se nota
     porque no hay reglas). Acá se dice, por colección, quién puede escribir
     el registro completo y qué campos van sueltos para los demás:
       'hijos' → cada clave del objeto por separado (votos[lote], respuestas[uid])
       'campo' → el campo entero (la lista de vistos, la de recomendaciones)
     ========================================================= */
  PARCIALES: {
    votaciones:  { quien:'admin', campos:{ votos:'hijos' } },
    comunicados: { quien:'admin', campos:{ vistos:'campo', respuestas:'hijos' } },
    alertas:     { quien:'staff', campos:{ respuestas:'hijos' } },
    users:       { quien:'admin', propio:true, campos:{ recomiendan:'campo' } },
  },
  soloSuParte(col, x){
    const P = this.PARCIALES[col], u = yo(); if (!P || !u) return null;
    if (P.quien === 'staff' ? (u.rol === 'admin' || u.rol === 'guardia') : u.rol === 'admin') return null;
    if (P.propio && x && x.id === u.id) return null;
    return P;
  },
  cambiosSueltos(col, P, viejo, nuevo){
    const base = `barrio/${col}/${nuevo.id}`, out = [];
    Object.entries(P.campos).forEach(([f, modo]) => {
      const a = viejo && viejo[f], b = nuevo[f];
      if (JSON.stringify(a ?? null) === JSON.stringify(b ?? null)) return;
      if (modo === 'campo'){ out.push([`${base}/${f}`, b ?? null]); return; }
      const va = a && typeof a === 'object' ? a : {}, vb = b && typeof b === 'object' ? b : {};
      new Set([...Object.keys(va), ...Object.keys(vb)]).forEach(k => {
        if (JSON.stringify(va[k] ?? null) !== JSON.stringify(vb[k] ?? null)) out.push([`${base}/${f}/${k}`, vb[k] ?? null]);
      });
    });
    return out;
  },

  /* Guardar = mandar a la nube solo lo que cambió. */
  guardar(){
    if (!this.arrancada || !this.uid) return;
    const s = Store.s, cambios = {};
    const poner = (ruta, valor) => { cambios[ruta] = valor; };
    const rutasDe = (col, x) => {
      if (this.ZONAS.barrio.includes(col)) return [`barrio/${col}/${x.id}`];
      if (this.ZONAS.staff.includes(col)) return [`staff/${col}/${x.id}`];
      if (col === 'notifs') return this.esNotifGeneral(x) ? [`barrio/notifsTodos/${x.id}`] : this.duenos(col, x).map(u => `pv/notifs/${u}/${x.id}`);
      return this.duenos(col, x).filter(Boolean).map(u => `pv/${this.carpetaDe(col, x)}/${u}/${x.id}`);
    };
    [...this.ZONAS.barrio, ...this.ZONAS.privado, ...this.ZONAS.staff].forEach(col => {
      if (col === 'notifsTodos') return;
      const arr = s[col]; if (!Array.isArray(arr)) return;
      const antes = this.ultimo[col] || {}, ahora = {};
      arr.forEach(x => {
        if (!x || !x.id) return;
        const txt = JSON.stringify(x); ahora[x.id] = txt;
        if (antes[x.id] === txt) return;
        const P = this.soloSuParte(col, x);
        if (P){ if (antes[x.id]) this.cambiosSueltos(col, P, JSON.parse(antes[x.id]), JSON.parse(txt)).forEach(([r, v]) => poner(r, v)); return; }
        rutasDe(col, x).forEach(r => poner(r, JSON.parse(txt)));
      });
      Object.keys(antes).forEach(id => { if (!(id in ahora) && !this.soloSuParte(col, { id })){
        const viejo = JSON.parse(antes[id]);
        rutasDe(col, viejo).forEach(r => poner(r, null));
      }});
      this.ultimo[col] = ahora;
    });
    /* =========================================================
       LA CONFIGURACIÓN SE GUARDA CAMPO POR CAMPO, Y NUNCA ANTES DE LEERLA
       Antes se mandaba la configuración ENTERA cada vez que cambiaba algo, y
       también apenas arrancaba la app, cuando todavía tenía la copia vieja
       que quedó guardada en el equipo (la de la nube tarda un instante en
       llegar). Cualquier equipo de la Administración que se abría pisaba así
       lo último que se había guardado desde otro: por eso la clave de los
       avisos push y los días de residuos "se borraban solos" al rato.
       Ahora: (1) nada de la configuración sale hasta que llegó la de la nube;
       (2) sale solo el campo que cambió en este equipo (barrio/config/<campo>),
       así dos equipos que tocan cosas distintas no se pisan; (3) solo la
       Administración la escribe (a los demás, las reglas se lo niegan igual).
       ========================================================= */
    const cfg = JSON.stringify(s.config);
    if (this.configLista && cfg !== this.ultimo.config && yo()?.rol === 'admin'){
      let antes = {}; try { antes = JSON.parse(this.ultimo.config || '{}') || {}; } catch(e){}
      new Set([...Object.keys(antes), ...Object.keys(s.config)]).forEach(k => {
        if (JSON.stringify(antes[k] ?? null) !== JSON.stringify(s.config[k] ?? null)) poner('barrio/config/' + k, s.config[k] === undefined ? null : JSON.parse(JSON.stringify(s.config[k])));
      });
      this.ultimo.config = cfg;
    }
    /* Las marcas del motor van DE A UNA (barrio/motorLog/<marca>) y solo
       después de haber leído las de la base. Antes se mandaba la lista
       entera: un equipo que todavía no tenía la marca que otro acababa de
       poner la borraba, y el aviso volvía a salir. Borrar, solo las de más
       de 60 días (una copia vieja de otra pestaña no puede borrar marcas). */
    if (this.motorListo){
      const ml = s.motorLog || {}, txt = JSON.stringify(ml);
      if (txt !== this.ultimo.motorLog){
        let antes = {}; try { antes = JSON.parse(this.ultimo.motorLog || '{}') || {}; } catch(e){}
        const lim = Date.now() - 59 * DIA;
        new Set([...Object.keys(antes), ...Object.keys(ml)]).forEach(k => {
          if ((antes[k] ?? null) === (ml[k] ?? null)) return;
          if (ml[k] == null){ if (antes[k] < lim) poner('barrio/motorLog/' + k, null); return; }
          poner('barrio/motorLog/' + k, ml[k]);
        });
        this.ultimo.motorLog = txt;
      }
    }
    /* =========================================================
       CADA COLECCIÓN VIAJA POR SEPARADO
       Un update() con varias rutas es TODO O NADA: si una sola ruta no
       tiene permiso, Firebase rechaza el paquete entero. Así fue como el
       "Ya está solucionado" del SOS no cerraba nada: junto con la alerta
       se mandaba una línea a la bitácora de la guardia, que un vecino no
       puede escribir, y se caía también el cierre de la alerta. La alerta
       volvía a aparecer como activa en todas las apps.
       Ahora se agrupa por colección (staff/sos, staff/bitacora, …) y cada
       grupo se manda solo: si uno falla, los demás llegan igual.
       ========================================================= */
    const grupos = {};
    /* En pv/ el grupo es la carpeta DE CADA VECINO (pv/pagos/<uid>): un pago
       que se copia a los otros titulares del lote no puede arrastrar al
       propio si alguna copia se rechaza. */
    Object.keys(cambios).forEach(r => { const g = r.split('/').slice(0, r.startsWith('pv/') ? 3 : 2).join('/'); (grupos[g] = grupos[g] || {})[r] = cambios[r]; });
    Object.entries(grupos).forEach(([g, paquete]) => {
      this.db.ref().update(paquete).catch(e => {
        console.warn('No se pudo guardar', g, e.message);
        /* Lo que es del personal (bitácora, auditoría) no es tarea del vecino:
           si no llega, no se lo asusta con un cartel. */
        if (!/^staff\/(bitacora|auditoria)$/.test(g)) toast('No se pudo guardar en la nube (' + g.split('/')[1] + '): ' + e.message, 'alert');
      });
    });
  },

  /* ---------- cuentas ---------- */
  async entrar(email, clave){
    const cred = await this.auth.signInWithEmailAndPassword(email, clave);
    return cred.user.uid;
  },
  /* =========================================================
     LA FOTO DEL FRENTE DE LA CASA
     Las fotos viven en el equipo de cada uno y a la base va solo una
     miniatura de 48 px. Con la del frente de la casa no alcanza: la garita
     y los vecinos tienen que reconocerla en el buscador. Por eso de esa
     foto (y solo de esa) se sube una versión mediana, de 480 px, a
     barrio/fotosCasa. No baja con todo lo demás: se pide recién cuando
     aparece en pantalla, así no pesa en el arranque de nadie.
     ========================================================= */
  corregirGarita(){
    /* También la que quedó pendiente: la cuenta de la garita entra sin que
       la Administración tenga que aprobarla a mano. Solo puede entrar con ese
       correo quien tiene su contraseña. */
    const g = Store.s.users.find(x => esCorreoGarita(x.email) && x.estado !== 'rechazado' && (x.estado !== 'aprobado' || x.rol !== 'guardia' || x.casa !== 'Garita'));
    if (!g) return;
    Store.cambiar(s => { const x = s.users.find(z => z.id === g.id); x.rol = 'guardia'; x.casa = 'Garita'; x.nombre = 'Garita'; x.estado = 'aprobado'; x.aprobadoAt = x.aprobadoAt || Date.now();
      auditar(s, 'La cuenta de la garita quedó habilitada como garita', x.email, x.id); });
  },
  async bajarFotoCasa(id){
    if (!this.db || !this.uid) return null;
    const v = (await this.db.ref('barrio/fotosCasa/' + id).get()).val();
    return typeof v === 'string' ? v : null;
  },
  /* Si mi foto todavía no está en la nube (la subí antes de esta versión,
     o recién la cambié), se sube desde este equipo. */
  async fotoCasaAlDia(){
    /* Las fotos de mis mascotas cargadas antes de esta versión también se
       comparten, en chico, para que los vecinos las puedan ver. */
    for (const m of aLista(yo()?.mascotas)) if (m && m.foto && m.foto.fotoId && !m.foto.nube) await compartirFotoMascota(m.id);
    try {
      const u = yo(); if (!this.arrancada || !u || !u.fotoCasa || !u.fotoCasa.fotoId || u.fotoCasa.nube) return;
      const dato = await Fotos.sacar(u.fotoCasa.fotoId); if (!dato) return;
      const med = await achicarDato(dato, 480, .7);
      await this.db.ref('barrio/fotosCasa/' + u.fotoCasa.fotoId).set(med);
      Store.cambiar(s => { const x = s.users.find(z => z.id === u.id); if (x && x.fotoCasa && x.fotoCasa.fotoId === u.fotoCasa.fotoId) x.fotoCasa.nube = true; });
    } catch(e){ console.warn('No se pudo subir la foto de la casa', e.message); }
  },
  /* Una foto chica que pueden ver los demás (hoy, las de las mascotas):
     320 px, unos 20 KB. Se guarda junto a las de las casas y cada uno la
     baja solo cuando la toca. */
  async compartirFoto(fotoId, max = 320){
    try {
      if (!this.arrancada || !fotoId) return false;
      const dato = await Fotos.sacar(fotoId, false); if (!dato) return false;
      await this.db.ref('barrio/fotosCasa/' + fotoId).set(await achicarDato(dato, max, .7));
      return true;
    } catch(e){ console.warn('No se pudo compartir la foto', e.message); return false; }
  },
  /* =========================================================
     LA COPIA "PARA BAJAR" DE UNA FOTO
     Una foto que ven otros (aviso, mascota perdida, reclamo, obra) deja una
     copia de 1280 px en barrio/fotosDescarga/<id>. NO baja con el resto
     de los datos: cada uno la pide al tocar la foto, la ve y la guarda en su
     equipo. Vence sola (7 días un aviso, más un reclamo o un comprobante) y
     la app de la Administración borra las vencidas: la base no se llena.
     Se lee solo sabiendo el id (nadie puede listar todas las fotos): el id
     está únicamente en el registro donde se publicó.
     ========================================================= */
  async compartirDescarga(fotoId, dias = 7){
    try {
      if (!this.arrancada || !fotoId) return false;
      const dato = await Fotos.sacar(fotoId, false); if (!dato) return false;
      let buena = await achicarDato(dato, 1280, .76);
      if (buena.length > 590000) buena = await achicarDato(dato, 1024, .68);
      const at = Date.now(), vence = at + dias * DIA;
      await this.db.ref('barrio/fotosDescarga/' + fotoId).set({ d:buena, at, vence });
      await this.db.ref('barrio/fotosIdx/' + fotoId).set({ at, vence, de:this.uid }).catch(() => {});
      return true;
    } catch(e){ console.warn('No se pudo dejar la foto para bajar (¿faltan publicar las reglas?)', e.message); return false; }
  },
  async bajarDescarga(fotoId){
    if (!this.db || !this.uid) return null;
    const v = (await this.db.ref('barrio/fotosDescarga/' + fotoId).get()).val();
    return v && typeof v.d === 'string' ? v.d : null;
  },
  /* La Administración borra las copias vencidas (una vez por día). */
  async limpiarFotos(){
    if (!this.db || !esAdmin()) return;
    try {
      const idx = (await this.db.ref('barrio/fotosIdx').get()).val() || {}, ahora = Date.now(), fotos = {}, indice = {};
      Object.entries(idx).forEach(([id, x]) => { if (!x || !x.vence || x.vence < ahora){ fotos['barrio/fotosDescarga/' + id] = null; indice['barrio/fotosIdx/' + id] = null; } });
      if (Object.keys(fotos).length){ await this.db.ref().update(fotos); await this.db.ref().update(indice); }
    } catch(e){ console.warn('No se pudieron limpiar las fotos vencidas', e.message); }
  },
  async registrar(d){
    const cred = await this.auth.createUserWithEmailAndPassword(d.email, d.clave);
    const uid = cred.user.uid;
    /* ¿Es la primera cuenta del barrio? No se puede preguntar leyendo la lista
       de vecinos (las reglas la tapan para quien todavía no está aprobado), así
       que hay un único dato público: barrio/publico/instalado. Dice sí o no, y
       nada más: ni quién, ni cuántos, ni ningún correo. */
    let primero = false;
    try { primero = !(await this.db.ref('barrio/publico/instalado').get()).exists(); } catch(e){}
    const u = { id:uid, nombre:d.nombre, casa:d.casa, dni:d.dni, email:d.email, tel:d.tel || '',
      rol: primero ? 'admin' : 'vecino', estado: primero ? 'aprobado' : 'pendiente',
      profesion:d.profesion || '', enDirectorio:!!d.publicar, mostrarTel:!!d.publicar,
      consentimiento:Date.now(), createdAt:Date.now() };
    await this.db.ref('barrio/users/' + uid).set(u);
    if (primero) await this.db.ref('barrio/publico/instalado').set(true).catch(() => {});
    return u;
  },
  /* Completar la ficha de una cuenta que ya existe en Firebase. */
  async completar(d){
    const uid = this.uid;
    const u = { id:uid, nombre:d.nombre, casa:d.casa, dni:d.dni, email:this.auth.currentUser.email, tel:d.tel || '',
      rol: this.libre ? 'admin' : 'vecino', estado: this.libre ? 'aprobado' : 'pendiente',
      consentimiento:Date.now(), createdAt:Date.now() };
    await this.db.ref('barrio/users/' + uid).set(u);
    if (this.libre) await this.db.ref('barrio/publico/instalado').set(true).catch(() => {});
    return u;
  },
  async salir(){ await this.borrarPresencia(); try { await this.auth.signOut(); } catch(e){} },
  async cambiarClave(nueva){ return this.auth.currentUser.updatePassword(nueva); },
  /* Cambio de correo: Firebase manda un aviso a la dirección nueva y el
     cambio se hace efectivo cuando la persona lo confirma desde ahí. */
  async cambiarEmail(nuevo){
    const u = this.auth.currentUser;
    if (u.verifyBeforeUpdateEmail) return u.verifyBeforeUpdateEmail(nuevo).then(() => 'confirmar');
    return u.updateEmail(nuevo).then(() => 'listo');
  },
  async recuperar(email){ return this.auth.sendPasswordResetEmail(email); },
};
