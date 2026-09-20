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
             'posts','msgs','reservas','bloqueos','votaciones','compras','viajes','obras','proveedores','avistamientos','notifsTodos'],
    privado: ['privados','dms','reclamos','peticiones','pases','solicitudesPase','infracciones','notifs','llegadas','paquetes'],
    staff: ['bitacora','avisos','sos','correos','auditoria'],
  },

  /* De quién es cada cosa de la zona privada (puede ser de más de uno). */
  duenos(col, x){
    switch (col){
      case 'privados': return [x.userId];
      case 'dms': return [x.a, x.b];
      case 'reclamos': case 'peticiones': return [x.userId];
      case 'pases': case 'solicitudesPase': case 'llegadas': case 'paquetes': return [x.hostId];
      case 'infracciones': return Store.s.users.filter(u => u.casa === x.casa && u.estado === 'aprobado').map(u => u.id);
      case 'notifs': return x.para.filter(p => p && !String(p).startsWith('rol:') && p !== 'todos' && p !== 'staff');
      default: return [];
    }
  },
  /* Un aviso para todos o para un rol no puede ir a la carpeta de nadie:
     va al pizarrón de avisos del barrio, y cada uno filtra lo suyo. */
  esNotifGeneral: n => n.para.some(p => p === 'todos' || p === 'staff' || String(p).startsWith('rol:')),

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
  },

  escuchar(ruta, fn){ this.db.ref(ruta).on('value', snap => fn(snap.val())); },

  escucharColeccion(base, cols, opcional = false){
    cols.forEach(col => {
      this.db.ref(`${base}/${col}`).on('value', snap => {
        const v = snap.val() || {};
        const arr = Object.keys(v).map(k => v[k]);
        if (col === 'notifsTodos') Store.s.notifs = [...arr, ...Store.s.notifs.filter(n => !this.esNotifGeneral(n))];
        else if (col === 'notifs') Store.s.notifs = [...Store.s.notifs.filter(n => this.esNotifGeneral(n)), ...arr];
        else Store.s[col] = arr;
        Store.s.notifs.sort((a, b) => b.at - a.at);
        this.recordar(col, arr);
        this.listos.add(base + col);
        if (this.arrancada) refrescar();
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
        if (nodo) Object.keys(nodo).forEach(id => { if (!juntado[col].some(x => x.id === id)) juntado[col].push(nodo[id]); });
      }));
      this.ZONAS.privado.forEach(col => {
        if (col === 'notifs') Store.s.notifs = [...Store.s.notifs.filter(n => this.esNotifGeneral(n)), ...juntado.notifs].sort((a, b) => b.at - a.at);
        else Store.s[col] = juntado[col];
        this.recordar(col, juntado[col]);
      });
      if (this.arrancada) refrescar();
    });
  },
  escucharConfig(){
    this.db.ref('barrio/config').on('value', snap => {
      const c = snap.val(); if (c) Store.s.config = Object.assign({}, CONFIG_BASE, c);
      this.ultimo.config = JSON.stringify(Store.s.config);
      if (this.arrancada) refrescar();
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
  async salir(){ try { await this.auth.signOut(); } catch(e){} },
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
