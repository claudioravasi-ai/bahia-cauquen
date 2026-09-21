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
     /privado/<uid>   lo de cada vecino: sus mensajes con la
                Administración, sus mensajes con otros vecinos,
                sus reclamos, sus peticiones, sus pases y sus
                avisos personales. Lo lee él y el personal
                (la guardia necesita los pases; la
                Administración, los reclamos y peticiones).
     /staff     lo de la guardia y la Administración: llegadas,
                paquetes, bitácora, SOS, correos y auditoría.
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
             'gastos','liquidaciones','cruceros','promos','comunicados','notifsTodos'],
    privado: ['privados','dms','reclamos','peticiones','pases','solicitudesPase','infracciones','notifs','llegadas','paquetes','pagos','recibos'],
    staff: ['bitacora','avisos','sos','correos','auditoria','impuestos'],
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
    users:           { listas:['mascotas','vehiculos'] },
    posts:           { listas:['comments','voy'], objetos:['reactions'] },
    notifs:          { listas:['para','leidas'] },
    notifsTodos:     { listas:['para','leidas'] },
    privados:        { listas:['msgs'] },
    bitacora:        { listas:['guardias'] },
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
      case 'infracciones': case 'pagos': case 'recibos':
        return Store.s.users.filter(u => u.casa === x.casa && u.estado === 'aprobado').map(u => u.id);
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
        if (!user){ Store.sesion.userId = null; Store.guardarSesion(); this.arrancada = false; pintar(); return ok(true); }
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
    s.notifs = []; s.motorLog = {}; this.ultimo = {};
    const yoNodo = await this.db.ref('barrio/users/' + this.uid).get().catch(() => null);
    const mio = yoNodo && yoNodo.exists() ? yoNodo.val() : null;
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
    if (staff){
      this.escucharColeccion('staff', this.ZONAS.staff);
      this.escucharPrivadoTodos();
    } else {
      this.escucharColeccion('privado/' + this.uid, this.ZONAS.privado);
      this.escucharColeccion('staff', ['sos'], true);  /* para ver el estado de la propia alerta */
    }
    this.arrancada = true;
    this.anotarPresencia();
    /* Si administra el barrio, elige desde qué brazo entra. */
    if (mio.rol === 'admin' && !Store.sesion.modo) setTimeout(() => { if (typeof elegirModo === 'function' && yo()) elegirModo({ alEntrar:true }); }, 500);
    /* Las alertas que ya estaban abiertas antes de entrar no saltan ni
       suenan: eso lo decide pintarAlarmas() por la hora de cada alerta. */
    if (mio.rol === 'admin') this.sembrarContenido();
    Fotos.relevo = { bajar: id => this.bajarFotoCasa(id), subir: async () => {} };
    setTimeout(() => this.fotoCasaAlDia(), 4000);
    /* La cuenta de la garita se reconoce por el correo: si quedó como vecino
       (se inscribió por el portal común), la Administración la corrige sola. */
    if (mio.rol === 'admin') setTimeout(() => this.corregirGarita(), 5000);
    /* La Administración deja a mano la dirección del correo para quien se
       inscribe, y manda lo que haya quedado sin salir. */
    if (mio.rol === 'admin') setTimeout(async () => {
      await this.publicarCorreo();
      const n = await Correo.reintentar();
      if (n) toast(`Salieron ${plural(n, 'correo que estaba pendiente', 'correos que estaban pendientes')}`, 'mail');
    }, 6000);
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
      this.db.ref(`${base}/${col}`).on('value', snap => {
        const v = snap.val() || {};
        const arr = Object.keys(v).map(k => this.comoLaGuardamos(col, v[k]));
        if (col === 'notifsTodos') Store.s.notifs = [...arr, ...Store.s.notifs.filter(n => !this.esNotifGeneral(n))];
        else if (col === 'notifs') Store.s.notifs = [...Store.s.notifs.filter(n => this.esNotifGeneral(n)), ...arr];
        else Store.s[col] = arr;
        Store.s.notifs.sort((a, b) => b.at - a.at);
        this.recordar(col, arr);
        this.listos.add(base + col);
        if (this.arrancada) this.llegoAlgo();
      }, err => { if (!opcional) console.warn('No se pudo leer', base, col, err.message); });
    });
  },
  /* La guardia y la Administración leen la carpeta privada de todos. */
  escucharPrivadoTodos(){
    this.db.ref('privado').on('value', snap => {
      const v = snap.val() || {};
      const juntado = {};
      this.ZONAS.privado.forEach(c => juntado[c] = []);
      Object.keys(v).forEach(uid => this.ZONAS.privado.forEach(col => {
        const nodo = v[uid] && v[uid][col];
        if (nodo) Object.keys(nodo).forEach(id => { if (!juntado[col].some(x => x.id === id)) juntado[col].push(this.comoLaGuardamos(col, nodo[id])); });
      }));
      this.ZONAS.privado.forEach(col => {
        if (col === 'notifs') Store.s.notifs = [...Store.s.notifs.filter(n => this.esNotifGeneral(n)), ...juntado.notifs].sort((a, b) => b.at - a.at);
        else Store.s[col] = juntado[col];
        this.recordar(col, juntado[col]);
      });
      if (this.arrancada) this.llegoAlgo();
    });
  },
  escucharConfig(){
    this.db.ref('barrio/config').on('value', snap => {
      const c = snap.val(); if (c) Store.s.config = Object.assign({}, CONFIG_BASE, c);
      this.ultimo.config = JSON.stringify(Store.s.config);
      if (this.arrancada) this.llegoAlgo();
    });
    /* Las marcas del motor son compartidas: así un aviso automático sale una
       sola vez para todo el barrio y no una por equipo encendido. */
    this.db.ref('barrio/motorLog').on('value', snap => {
      Store.s.motorLog = snap.val() || {};
      this.ultimo.motorLog = JSON.stringify(Store.s.motorLog);
    });
  },

  recordar(col, arr){ this.ultimo[col] = {}; arr.forEach(x => { if (x && x.id) this.ultimo[col][x.id] = JSON.stringify(x); }); },

  /* Guardar = mandar a la nube solo lo que cambió. */
  guardar(){
    if (!this.arrancada || !this.uid) return;
    const s = Store.s, cambios = {};
    const poner = (ruta, valor) => { cambios[ruta] = valor; };
    const rutasDe = (col, x) => {
      if (this.ZONAS.barrio.includes(col)) return [`barrio/${col}/${x.id}`];
      if (this.ZONAS.staff.includes(col)) return [`staff/${col}/${x.id}`];
      if (col === 'notifs') return this.esNotifGeneral(x) ? [`barrio/notifsTodos/${x.id}`] : this.duenos(col, x).map(u => `privado/${u}/notifs/${x.id}`);
      return this.duenos(col, x).filter(Boolean).map(u => `privado/${u}/${col}/${x.id}`);
    };
    [...this.ZONAS.barrio, ...this.ZONAS.privado, ...this.ZONAS.staff].forEach(col => {
      if (col === 'notifsTodos') return;
      const arr = s[col]; if (!Array.isArray(arr)) return;
      const antes = this.ultimo[col] || {}, ahora = {};
      arr.forEach(x => {
        if (!x || !x.id) return;
        const txt = JSON.stringify(x); ahora[x.id] = txt;
        if (antes[x.id] !== txt) rutasDe(col, x).forEach(r => poner(r, JSON.parse(txt)));
      });
      Object.keys(antes).forEach(id => { if (!(id in ahora)){
        const viejo = JSON.parse(antes[id]);
        rutasDe(col, viejo).forEach(r => poner(r, null));
      }});
      this.ultimo[col] = ahora;
    });
    const cfg = JSON.stringify(s.config);
    if (cfg !== this.ultimo.config){ poner('barrio/config', s.config); this.ultimo.config = cfg; }
    const ml = JSON.stringify(s.motorLog || {});
    if (ml !== this.ultimo.motorLog){ poner('barrio/motorLog', s.motorLog || {}); this.ultimo.motorLog = ml; }
    const n = Object.keys(cambios).length;
    if (n) this.db.ref().update(cambios).catch(e => toast('No se pudo guardar en la nube: ' + e.message, 'alert'));
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
    const g = Store.s.users.find(x => esCorreoGarita(x.email) && x.estado === 'aprobado' && (x.rol !== 'guardia' || x.casa !== 'Garita'));
    if (!g) return;
    Store.cambiar(s => { const x = s.users.find(z => z.id === g.id); x.rol = 'guardia'; x.casa = 'Garita'; x.nombre = 'Garita';
      auditar(s, 'La cuenta de la garita quedó con permisos de garita', x.email, x.id); });
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
