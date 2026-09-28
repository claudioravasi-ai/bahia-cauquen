/* =========================================================
   CUIDARNOS ENTRE VECINOS (pedido de Claudio, 27-09-2026)
   -------------------------------------------------------
   Cuatro cosas con el mismo corazón: que nadie quede solo con un
   problema sin que alguien se entere.

   1. "ESTOY BIEN" (idea de Japón: los "mimamori", los que cuidan de
      lejos). Quien vive solo y se anota tiene en la portada un botón
      verde que titila hasta que lo toca, una vez por día. Si llega la
      hora que eligió y no lo tocó, la app avisa SOLO a la garita, a la
      Administración y a sus familiares (por correo y, si alguno vive en
      el barrio, en su app). Decisión de Claudio (27-09): el resto de los
      vecinos no se entera. Puede elegir además hasta 3 personas del barrio
      (un familiar o un vecino de confianza), que tienen que aceptar. A la mañana, una hora antes, le llega un
      recordatorio al celular; tocar ese aviso ya cuenta como "estoy bien".
   2. AVISO DE SALIDA (verano: kayak, montaña, escalada, navegar).
      Se deja dicho a dónde, con quién y a qué hora se vuelve; si no
      toca "Volví" a tiempo, se avisa a los mismos (garita, Administración
      y familiares). Junto a la
      guía de seguridad de verano ("Salidas seguras").
   3. EL DEA Y LOS VECINOS DEL EQUIPO DE SALUD. Cuando la garita toca
      "Voy en camino con el DEA", el mismo toque avisa a los vecinos que
      marcaron que son del equipo de salud o saben RCP (Respondedores).
   4. ÁNGELES DE LA NIEVE (idea de Canadá). Vecinos que se anotan para
      despejar la entrada de quien no puede palear, después de cada
      nevada.

   DÓNDE VIVEN LOS DATOS DE "ESTOY BIEN" (y por qué no en /barrio)
     cuidado/<vecino>   su horario, sus familiares, a qué hora avisó y su
                        salida. Lo leen SOLO él, la garita, la
                        Administración y los familiares que viven en el
                        barrio y eligió (contactos/<uid>). Los demás
                        vecinos no: que alguien vive solo no es un dato
                        que tenga que andar a la vista.
     cuidadoDe/<familiar>/<vecino>   a quién cuida cada familiar con la
                        app. Lo lee solo él. La garita y la Administración
                        leen cuidado/ entero.
   QUIÉN DA LA ALARMA: cualquier equipo que la vea vencida (la garita,
   la Administración, un familiar, el del propio vecino) y el reloj del Apps Script
   cada 10 minutos (revisarCuidados en apps-script/Codigo.gs), aunque
   todos los teléfonos estén bloqueados. La alarma se RECLAMA con una
   transacción en cuidado/<vecino>/aviso/<día>: sale una sola vez.
   ========================================================= */
const BIEN_HORAS = ['07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00'];
const BIEN_HORA = '10:00';
const BIEN_CONTACTOS = 3;
const BIEN_INSISTE = HORA;          /* si en una hora nadie lo resolvió, se insiste una vez */
const BIEN_GUARDA = 30 * DIA;       /* los avisos viejos se borran a los 30 días */
const SALIDA_MARGENES = [30, 60, 90, 120, 180];
const TIPOS_SALIDA = {
  kayak:      { n:'Kayak, remo o SUP',          icon:'drop',  llamar:'106' },
  navegacion: { n:'Navegación',                 icon:'send',  llamar:'106' },
  trekking:   { n:'Trekking o caminata',        icon:'tree',  llamar:'911' },
  montana:    { n:'Montaña o escalada',         icon:'tree',  llamar:'911' },
  pesca:      { n:'Pesca',                      icon:'drop',  llamar:'911' },
  bici:       { n:'Bici o MTB',                 icon:'pin',   llamar:'911' },
  nieve:      { n:'Esquí o travesía con nieve', icon:'snow',  llamar:'911' },
  otra:       { n:'Otra salida',                icon:'pin',   llamar:'911' },
};
const primerNombre = n => String(n || '').trim().split(/\s+/)[0] || 'Vecino/a';
const cuentasGarita = () => Store.s.users.filter(x => x.rol === 'guardia' && x.estado === 'aprobado').map(x => x.id);
const cuentasAdministracion = () => Store.s.users.filter(x => x.rol === 'admin' && x.estado === 'aprobado').map(x => x.id);
/* Los familiares (hasta 3), con correo y teléfono. Acepta el formato viejo
   de un solo familiar. */
const familiaresDe = x => [...aLista(x && x.familiares), ...(x && x.familiar ? [x.familiar] : [])].filter(f => f && (f.email || f.tel || f.nombre));
/* La garita y la Administración reciben siempre el aviso y ven la lista. */
const cuidaPorRol = u => !!u && (u.rol === 'guardia' || u.rol === 'admin');
/* En pantalla, la Administración ve la lista solo desde su brazo de gestión. */
const veListaCuidados = () => esGuardia() || esAdmin();
/* Cuentas de vecinos aprobados con lote (sin la garita ni el hotel): para
   elegir al familiar que vive en el barrio, o a quién se prestó algo. */
const candidatosCuidado = () => { const u = yo();
  return Store.s.users.filter(x => x.estado === 'aprobado' && x.id !== u?.id && x.rol !== 'hotel' && x.rol !== 'guardia' && /^Lote\s/i.test(x.casa || ''))
    .sort((a, b) => (parseInt(String(a.casa).replace(/\D/g, ''), 10) || 0) - (parseInt(String(b.casa).replace(/\D/g, ''), 10) || 0) || String(a.nombre).localeCompare(String(b.nombre))); };

const Cuidado = {
  datos:{}, idx:{}, oyentes:{}, revisando:false, listoMio:false,
  enNube(){ return typeof Nube !== 'undefined' && Nube.activa() && !!Nube.db && !!Nube.uid && Nube.arrancada; },
  /* En la demo (?local) todo vive en Store.s.cuidado, en este equipo. */
  local(){ const s = Store.s; if (!s.cuidado || typeof s.cuidado !== 'object' || Array.isArray(s.cuidado)) s.cuidado = {}; return s.cuidado; },
  forma(x, id){
    if (!x || typeof x !== 'object') return null;
    const y = { ...x, id:x.id || id };
    ['contactos', 'aviso', 'recordado'].forEach(k => { if (!y[k] || typeof y[k] !== 'object' || Array.isArray(y[k])) y[k] = {}; });
    return y;
  },
  de(id){ if (!id) return null; return this.forma(this.enNube() ? this.datos[id] : this.local()[id], id); },
  mio(){ const u = yo(); return u ? this.de(u.id) : null; },
  soyContacto(x, u = yo()){ return !!(x && u && x.id !== u.id && (x.contactos[u.id] || cuidaPorRol(u))); },
  /* A quiénes vigila este equipo para dar la alarma (la garita y la
     Administración, a todos los anotados; un familiar, a su familiar). */
  vigilados(){
    const u = yo(); if (!u) return [];
    const ids = Object.keys(this.enNube() ? this.datos : this.local());
    return ids.map(id => this.de(id)).filter(x => this.soyContacto(x, u));
  },
  /* Los que se muestran en pantalla: la Administración en su modo vecino
     ve solo a sus familiares (la lista completa, en el brazo de gestión). */
  personas(){
    const u = yo(); if (!u) return [];
    return this.vigilados().filter(x => x.contactos[u.id] || veListaCuidados()).sort((a, b) => String(a.nombre).localeCompare(String(b.nombre)));
  },

  /* ---------- con la base: escuchar lo mío y lo de quienes cuido ---------- */
  escuchar(rol){
    if (typeof Nube === 'undefined' || !Nube.db || !Nube.uid) return;
    this.soltar();
    /* La garita y la Administración leen a todos los anotados. */
    if (rol === 'guardia' || rol === 'admin'){
      const ref = Nube.db.ref('cuidado');
      const fn = snap => { this.datos = snap.val() || {}; this.listoMio = true; this.cambio(); };
      ref.on('value', fn, err => { this.listoMio = true; console.warn('Estoy bien: no se pudo leer (¿faltan publicar las reglas?)', err.message); this.seguir(Nube.uid); });
      this.oyentes.todo = () => ref.off('value', fn);
      return;
    }
    this.seguir(Nube.uid);
    const indice = clave => {
      const ref = Nube.db.ref('cuidadoDe/' + clave);
      const fn = snap => { this.idx[clave] = snap.val() || {}; this.alDia(); };
      ref.on('value', fn, err => console.warn('Estoy bien: no se pudo leer a quién cuidás (¿faltan publicar las reglas?)', err.message));
      this.oyentes['i:' + clave] = () => ref.off('value', fn);
    };
    indice(Nube.uid);
  },
  alDia(){
    const quiero = new Set([Nube.uid]);
    Object.values(this.idx).forEach(o => Object.keys(o || {}).forEach(id => quiero.add(id)));
    quiero.forEach(id => this.seguir(id));
    Object.keys(this.oyentes).filter(k => k.startsWith('p:') && !quiero.has(k.slice(2))).forEach(k => { this.oyentes[k](); delete this.oyentes[k]; delete this.datos[k.slice(2)]; });
    this.cambio();
  },
  seguir(id){
    if (this.oyentes['p:' + id]) return;
    const ref = Nube.db.ref('cuidado/' + id);
    const fn = snap => { const v = snap.val(); if (v) this.datos[id] = v; else delete this.datos[id]; if (id === Nube.uid) this.listoMio = true; this.cambio(); };
    /* Si alguien me anotó en su índice pero no me eligió (o me sacó),
       la base no me deja leerlo: se ignora. */
    ref.on('value', fn, err => { delete this.datos[id]; if (id === Nube.uid){ this.listoMio = true; console.warn('Estoy bien: no se pudo leer (¿faltan publicar las reglas?)', err.message); } });
    this.oyentes['p:' + id] = () => ref.off('value', fn);
  },
  soltar(){ Object.values(this.oyentes).forEach(f => { try { f(); } catch(e){} }); this.oyentes = {}; this.datos = {}; this.idx = {}; this.listoMio = false; },
  /* Al abrir la app desde el recordatorio del celular: esperar a que baje
     lo propio antes de marcar (hasta 8 segundos). */
  cuandoListo(fn, n = 0){
    if (!this.enNube() || this.listoMio || n > 32) return fn();
    setTimeout(() => this.cuandoListo(fn, n + 1), 250);
  },
  cambio(){ if (typeof Nube !== 'undefined' && Nube.arrancada) Nube.llegoAlgo(); },

  /* ---------- escribir ---------- */
  async poner(id, cambios){
    if (this.enNube()){
      const up = {};
      Object.entries(cambios).forEach(([r, v]) => { up[r ? `cuidado/${id}/${r}` : `cuidado/${id}`] = v === undefined ? null : v; });
      await Nube.db.ref().update(JSON.parse(JSON.stringify(up, (k, v) => v === undefined ? null : v)));
      return;
    }
    Store.cambiar(() => {
      const L = this.local();
      Object.entries(cambios).forEach(([r, v]) => {
        if (!r){ if (v == null) delete L[id]; else L[id] = JSON.parse(JSON.stringify(v)); return; }
        L[id] = L[id] || { id };
        const partes = r.split('/'); let o = L[id];
        partes.slice(0, -1).forEach(p => { if (!o[p] || typeof o[p] !== 'object') o[p] = {}; o = o[p]; });
        const k = partes[partes.length - 1];
        if (v == null) delete o[k]; else o[k] = v && typeof v === 'object' ? JSON.parse(JSON.stringify(v)) : v;
      });
    });
  },
  async indice(contacto, persona, si){
    if (!this.enNube()) return;
    try { await Nube.db.ref(`cuidadoDe/${contacto}/${persona}`).set(si ? true : null); }
    catch(e){ console.warn('Estoy bien: índice', e.message); }
  },
  /* La alarma de un día (o de una salida) la da UN equipo: el que gana la
     transacción. Los demás ven que ya está y no repiten nada. */
  async reclamar(id, ruta, valor){
    if (this.enNube()){
      try {
        const r = await Nube.db.ref(`cuidado/${id}/${ruta}`).transaction(cur => cur ? undefined : valor, undefined, false);
        const v = r && r.committed && r.snapshot.val();
        return !!(v && v.quien === valor.quien && v.at === valor.at);
      } catch(e){ console.warn('Estoy bien: no se pudo reclamar el aviso', e.message); return false; }
    }
    const x = this.local()[id]; if (!x) return false;
    let o = x; const partes = ruta.split('/');
    for (const p of partes.slice(0, -1)){ if (!o[p] || typeof o[p] !== 'object') o[p] = {}; o = o[p]; }
    const k = partes[partes.length - 1];
    if (o[k]) return false;
    o[k] = valor; Store.guardar();
    return true;
  },

  /* ---------- en qué está cada uno ---------- */
  estadoDiario(x, ahora = Date.now()){
    if (!x || !x.activo) return { estado:'apagado' };
    const hoy = isoDe(new Date(ahora)), ini = fechaDe(hoy).getTime();
    const limite = ini + minutosDe(x.hora || BIEN_HORA) * MIN;
    if (x.pausaHasta && x.pausaHasta >= hoy) return { estado:'pausa', k:hoy, limite };
    if ((x.ultimo || 0) >= ini) return { estado:'ok', k:hoy, limite, at:x.ultimo };
    const av = x.aviso[hoy];
    if (av && av.resuelto) return { estado:'resuelto', k:hoy, limite, aviso:av };
    if (av) return { estado:'alerta', k:hoy, limite, aviso:av };
    /* El día que se anota después (o cerca) de su hora, arranca mañana. */
    if ((x.creado || 0) >= ini && (x.creado || 0) > limite - HORA) return { estado:'desde-manana', k:hoy, limite };
    if (ahora >= limite) return { estado:'vencido', k:hoy, limite };
    return { estado:'pendiente', k:hoy, limite };
  },
  estadoSalida(x, ahora = Date.now()){
    const sa = x && x.salida;
    if (!sa || !sa.vuelta || !sa.creada) return null;
    const k = 's-' + sa.creada, lim = sa.vuelta + (sa.margen || 60) * MIN, av = x.aviso[k];
    if (sa.volvio) return { estado:'volvio', k, lim };
    if (av && av.resuelto) return { estado:'resuelto', k, lim, aviso:av };
    if (av) return { estado:'alerta', k, lim, aviso:av };
    if (ahora >= lim) return { estado:'vencido', k, lim };
    if (ahora >= sa.vuelta) return { estado:'demorado', k, lim };
    return { estado:'afuera', k, lim };
  },
  enAlerta(x){
    const d = this.estadoDiario(x), sa = this.estadoSalida(x);
    return ['vencido', 'alerta'].includes(d.estado) || !!(sa && ['vencido', 'alerta'].includes(sa.estado));
  },

  /* ---------- la alarma ---------- */
  revisar(){
    const u = yo(); if (!u || esHotel() || this.revisando) return 0;
    const mio = this.mio(), lista = [...this.vigilados(), ...(mio ? [mio] : [])];
    if (!lista.length) return 0;
    this.revisando = true;
    (async () => {
      for (const x of lista){
        const d = this.estadoDiario(x);
        if (d.estado === 'vencido') await this.alarma(x, 'diario', d.k);
        else if (d.estado === 'alerta' && !d.aviso.insiste && Date.now() - (d.aviso.at || 0) >= BIEN_INSISTE) await this.insistir(x, 'diario', d.k);
        const sa = this.estadoSalida(x);
        if (sa && sa.estado === 'vencido') await this.alarma(x, 'salida', sa.k);
        else if (sa && sa.estado === 'alerta' && !sa.aviso.insiste && Date.now() - (sa.aviso.at || 0) >= BIEN_INSISTE) await this.insistir(x, 'salida', sa.k);
      }
    })().catch(e => console.warn('Estoy bien', e)).finally(() => { this.revisando = false; });
    return 0;
  },
  async alarma(x, tipo, k){
    const valor = { at:Date.now(), tipo, quien:yo().id, por:'app' };
    if (await this.reclamar(x.id, 'aviso/' + k, valor)) this.avisar(x, tipo, k, false);
  },
  async insistir(x, tipo, k){
    if (await this.reclamar(x.id, `aviso/${k}/insiste`, { at:Date.now(), quien:yo().id })) this.avisar(x, tipo, k, true);
  },
  /* La garita y la Administración (siempre) y las personas del barrio que eligió.
     Cada aviso va a la carpeta privada de cada cuenta: NO al pizarrón de
     avisos generales, que lee todo el barrio. */
  destinatarios(x){
    const ids = [...cuentasGarita(), ...cuentasAdministracion(), ...Object.keys(x.contactos || {})];
    return [...new Set(ids)].filter(id => id && id !== x.id);
  },
  textoAlarma(x, tipo, otraVez){
    const pila = primerNombre(x.nombre);
    if (tipo === 'diario') return { titulo:`${otraVez ? 'Sigue sin avisar: ' : ''}${pila} no avisó hoy que está bien`,
      texto:`${x.casa || ''} · tenía hasta las ${x.hora || BIEN_HORA}. Llamalo/a o pasá a ver. Si ya sabés que está bien, avisalo en la app.` };
    const sa = x.salida || {}, t = TIPOS_SALIDA[sa.tipo] || TIPOS_SALIDA.otra;
    return { titulo:`${otraVez ? 'Sigue sin volver: ' : ''}${pila} no volvió de su salida`,
      texto:`${t.n}${sa.donde ? ' · ' + sa.donde : ''} · volvía a las ${hora(sa.vuelta)}${sa.con ? ' · con ' + sa.con : ''}. Probá llamarlo/a; si no contesta, ${t.llamar === '106' ? 'Prefectura: 106' : 'emergencias: 911'}.` };
  },
  avisar(x, tipo, k, otraVez){
    const para = this.destinatarios(x), { titulo, texto } = this.textoAlarma(x, tipo, otraVez);
    const clave = `bien-${x.id}-${k}${otraVez ? '-otra' : ''}`;
    /* Firmado por "sistema", con id fijo: así lo ve también el contacto
       cuyo equipo dio la alarma, y si el reloj del Apps Script lo escribe
       igual, queda uno solo. */
    Store.cambiar(s => Motor.conMarca(clave, () => {
      if (para.length) notificar(s, { para, titulo, texto, icon: tipo === 'diario' ? 'heart' : 'pin', color:'danger', link: tipo === 'diario' ? 'estoy-bien' : 'salidas', urgente:true, push:false });
      if (!otraVez) notificar(s, { para:[x.id], titulo: tipo === 'diario' ? 'Hoy no avisaste que estás bien' : 'No marcaste que volviste',
        texto: tipo === 'diario' ? 'Avisamos a la garita, a la Administración y a tus familiares. Si estás bien, tocá "Estoy bien" para tranquilizarlos.' : 'Avisamos a la garita, a la Administración y a tus familiares. Si ya volviste, tocá "Volví" para tranquilizarlos.',
        icon:'heart', color:'warn', link: tipo === 'diario' ? 'estoy-bien' : 'salidas', sonido:true, push:false });
    }));
    if (typeof Push !== 'undefined'){
      if (para.length) Push.enviar({ para, titulo, texto, link: tipo === 'diario' ? 'estoy-bien' : 'salidas', tag:`bien-${x.id}-${tipo}`, urgente:true, sonido:'sos', incluirme:true });
      if (!otraVez) Push.enviar(tipo === 'diario'
        ? { para:[x.id], titulo:'¿Estás bien?', texto:'Tocá acá para avisar que estás bien.', link:'estoy-bien:ok', tag:'bien-yo', urgente:true, sonido:'bien', incluirme:true }
        : { para:[x.id], titulo:'¿Ya volviste?', texto:'Tocá acá y después "Volví" para que se queden tranquilos.', link:'salidas', tag:'bien-salida', urgente:true, sonido:'bien', incluirme:true });
    }
    if (!otraVez) familiaresDe(x).filter(f => f.email).forEach(f => this.correoFamiliar(x, tipo, f));
  },
  correoFamiliar(x, tipo, f){
    const pila = primerNombre(x.nombre), { texto } = this.textoAlarma(x, tipo, false), c = Store.s.config;
    const titulo = tipo === 'diario' ? `${pila} no avisó hoy que está bien` : `${pila} no volvió de su salida`;
    const html = Correo.plantilla(titulo,
      `<p>Hola${f.nombre ? ' ' + esc(f.nombre) : ''}:</p>
       <p><b>${esc(x.nombre)}</b> (${esc(x.casa || '')}, barrio ${esc(c.nombre)}) te eligió para avisarte ${tipo === 'diario' ? 'si algún día no confirmaba en la app del barrio que está bien' : 'si no volvía a tiempo de una salida'}.</p>
       <p>${esc(texto)}</p>
       ${x.tel ? `<p>Su teléfono: <b>${esc(x.tel)}</b></p>` : ''}
       <p>La garita y la Administración del barrio ya fueron avisadas.${c.garitaTel ? ` Teléfono de la garita: <b>${esc(c.garitaTel)}</b>.` : ''}</p>
       <p style="font-size:12.5px;color:#6c7d7a">Lo mandó la app del barrio en forma automática. Puede ser un olvido: probá comunicarte antes de alarmarte.</p>`);
    Correo.enviarDetalle({ para:f.email, asunto:titulo, html, tipo:'estoy-bien', privado:true })
      .then(r => { if (!r.ok) console.warn('Estoy bien: no salió el correo al familiar', r.error); });
  },
  /* Buenas noticias: van a la garita, la Administración y las personas elegidas, con sonido (y push). */
  avisarBien(x, titulo, texto, link = 'estoy-bien'){
    const u = yo(), para = this.destinatarios(x).filter(id => id !== u?.id);
    if (para.length) Store.cambiar(s => notificar(s, { para, titulo, texto, icon:'heart', color:'ok', link, sonido:true }));
  },

  /* ---------- lo que hace la persona ---------- */
  async marcar(){
    const u = yo(), x = this.mio(); if (!u || !x || !x.activo) return false;
    const hoy = hoyISO(), av = x.aviso[hoy], ahora = Date.now();
    /* Se decide ANTES de escribir: en la demo el registro es el mismo objeto
       y después de poner() el aviso ya figura resuelto. */
    const habiaAlarma = !!(av && !av.resuelto);
    const cambios = { ultimo: this.enNube() ? firebase.database.ServerValue.TIMESTAMP : ahora };
    if (habiaAlarma) cambios[`aviso/${hoy}/resuelto`] = { at:ahora, por:u.id, como:'avisó' };
    /* Lo viejo se borra (más de 30 días). */
    Object.keys(x.aviso).forEach(k => { const t = /^\d{4}-\d{2}-\d{2}$/.test(k) ? fechaDe(k).getTime() : +(k.split('-')[1] || 0); if (t && ahora - t > BIEN_GUARDA) cambios['aviso/' + k] = null; });
    Object.keys(x.recordado).forEach(k => { if (/^\d{4}-\d{2}-\d{2}$/.test(k) && ahora - fechaDe(k).getTime() > 7 * DIA) cambios['recordado/' + k] = null; });
    await this.poner(u.id, cambios);
    if (habiaAlarma) this.avisarBien(x, `${primerNombre(x.nombre)} ya avisó que está bien`, `Lo hizo a las ${hora(ahora)}.`);
    return true;
  },
  async resolver(id, k, nota = ''){
    const u = yo(), x = this.de(id); if (!u || !x) return false;
    const av = x.aviso[k]; if (!av || av.resuelto) return false;
    await this.poner(id, { [`aviso/${k}/resuelto`]:{ at:Date.now(), por:u.id, como:'contacto', nota:String(nota || '').slice(0, 140) } });
    this.avisarBien(x, `${primerNombre(x.nombre)} está bien`, `Lo confirmó ${u.rol === 'guardia' ? 'la garita' : primerNombre(u.nombre) + ' (' + (u.casa || '') + ')'}${nota ? ': ' + nota : '.'}`, String(k).startsWith('s-') ? 'salidas' : 'estoy-bien');
    return true;
  },
};

/* =========================================================
   LA PORTADA: el botón verde y lo que pasa con quienes cuido
   ========================================================= */
const nombresContactos = x => {
  const n = ['la garita', 'la Administración', ...Object.values(x.contactos || {}).map(c => primerNombre(c.nombre)),
    ...familiaresDe(x).map(f => f.nombre ? primerNombre(f.nombre) : 'tu familiar')];
  return [...new Set(n)].join(', ').replace(/, ([^,]*)$/, ' y $1');
};
function botonEstoyBien(x, d){
  const alerta = d.estado === 'alerta', vencido = d.estado === 'vencido';
  return `<button class="eb-boton${alerta || vencido ? ' alerta' : ''}" data-a="bien-ok" aria-label="Estoy bien: avisar que hoy estoy bien">
    <span class="eb-corazon">${I('heart')}</span>
    <span class="eb-txt"><b>ESTOY BIEN</b><small>${alerta ? 'Ya avisamos a la garita, a la Administración y a tus familiares: tocalo para tranquilizarlos' : vencido ? `Pasaron las ${esc(x.hora || BIEN_HORA)}: tocalo ya y no avisamos a nadie` : `Tocalo una vez por día, antes de las ${esc(x.hora || BIEN_HORA)}`}</small></span></button>`;
}
function tarjetaSalidaMia(x){
  const sa = x.salida, e = Cuidado.estadoSalida(x); if (!sa || !e || e.estado === 'volvio') return '';
  const t = TIPOS_SALIDA[sa.tipo] || TIPOS_SALIDA.otra, tarde = ['demorado', 'vencido', 'alerta'].includes(e.estado);
  return `<div class="eb-salida${tarde ? ' tarde' : ''}">${I(t.icon)}<div class="grow"><b>Estás de salida · ${esc(t.n)}</b>
      <span>${esc(sa.donde || '')}${sa.donde ? ' · ' : ''}volvés ${hora(sa.vuelta)}${e.estado === 'alerta' ? ' · ya avisamos a la garita y a tus familiares' : tarde ? ` · a las ${hora(e.lim)} avisamos a la garita y a tus familiares` : ''}</span></div>
    <button class="btn btn-ok" data-a="salida-volvi">${I('check')}Volví</button></div>`;
}
function bloqueCuidado(){
  const u = yo(); if (!u || esStaff() || esHotel()) return '';
  const x = Cuidado.mio(), partes = [];
  /* Si la casa está sola (Me voy de viaje): si hoy ya la revisaron. */
  const sola = typeof lineaCasaSola === 'function' ? lineaCasaSola() : ''; if (sola) partes.push(sola);
  if (x && x.activo){
    const d = Cuidado.estadoDiario(x);
    if (['pendiente', 'vencido', 'alerta'].includes(d.estado)) partes.push(botonEstoyBien(x, d));
    else if (d.estado === 'ok' || d.estado === 'resuelto') partes.push(`<button class="eb-listo" data-a="abrir" data-v="estoy-bien">${I('check')}<span><b>Hoy ya avisaste que estás bien</b><small>${d.estado === 'ok' ? 'a las ' + hora(x.ultimo) + ' · ' : ''}lo saben ${esc(nombresContactos(x))}</small></span></button>`);
  }
  if (x && x.salida && !x.salida.volvio) partes.push(tarjetaSalidaMia(x));
  Cuidado.personas().forEach(p => {
    const pila = esc(primerNombre(p.nombre));
    if (Cuidado.enAlerta(p)){
      const d = Cuidado.estadoDiario(p), diario = ['vencido', 'alerta'].includes(d.estado);
      partes.push(aviso('danger latido', diario ? 'heart' : 'pin', diario ? `${pila} (${esc(p.casa || '')}) no avisó hoy que está bien` : `${pila} (${esc(p.casa || '')}) no volvió de su salida`,
        diario ? `Tenía hasta las ${esc(p.hora || BIEN_HORA)}.` : `Volvía a las ${hora(p.salida.vuelta)}.`, `<button class="btn btn-xs btn-danger" data-a="abrir" data-v="${diario ? 'estoy-bien' : 'salidas'}">Ver qué hacer</button>`));
    } else if (p.contactos[u.id] && !p.contactos[u.id].acepta){
      partes.push(aviso('info', p.activo ? 'heart' : 'pin', `${pila} (${esc(p.casa || '')}) te eligió para avisarte`, p.activo ? 'Si un día no avisa que está bien, te llega un aviso.' : 'Si no vuelve de una salida a tiempo, te llega un aviso.', `<button class="btn btn-xs btn-pri" data-a="abrir" data-v="${p.activo ? 'estoy-bien' : 'salidas'}">Ver</button>`));
    }
  });
  return partes.length ? `<section class="bloque eb-bloque">${partes.join('')}</section>` : '';
}
/* La garita y la Administración: una banda con los vecinos anotados. */
function bandaCuidadoGarita(){
  if (!veListaCuidados()) return '';
  const ps = Cuidado.personas(); if (!ps.length) return '';
  const mal = ps.filter(p => Cuidado.enAlerta(p)), diarios = ps.filter(p => p.activo);
  const afuera = ps.filter(p => { const e = Cuidado.estadoSalida(p); return e && ['afuera', 'demorado'].includes(e.estado); });
  if (!mal.length) return `${diarios.length ? `<button class="garita-bien" data-a="abrir" data-v="estoy-bien">${I('heart')}<span><b>Estoy bien</b><small>${plural(diarios.length, 'vecino anotado', 'vecinos anotados')} · ${diarios.filter(p => Cuidado.estadoDiario(p).estado === 'ok').length} ya avisaron hoy</small></span>${I('right')}</button>` : ''}
    ${afuera.length ? `<button class="garita-bien salida" data-a="abrir" data-v="salidas">${I('pin')}<span><b>Salidas en curso</b><small>${plural(afuera.length, 'vecino afuera', 'vecinos afuera')} (agua o montaña)</small></span>${I('right')}</button>` : ''}`;
  return mal.map(p => { const d = Cuidado.estadoDiario(p), diario = ['vencido', 'alerta'].includes(d.estado);
    return aviso('danger latido', diario ? 'heart' : 'pin', `${esc(p.casa || '')} · ${esc(p.nombre || '')} ${diario ? 'no avisó hoy que está bien' : 'no volvió de su salida'}`,
      diario ? `Tenía hasta las ${esc(p.hora || BIEN_HORA)}. Llamalo/a o pasá a ver.` : esc(Cuidado.textoAlarma(p, 'salida', false).texto),
      `<button class="btn btn-xs btn-danger" data-a="abrir" data-v="${diario ? 'estoy-bien' : 'salidas'}">Ver</button>`); }).join('');
}

/* =========================================================
   LA VENTANA "ESTOY BIEN"
   ========================================================= */
/* `modo`: 'diario' (ventana Estoy bien) o 'salida' (ventana Salidas seguras):
   son dos cosas aparte (pedido de Claudio, 27-09). */
function tarjetaCuidado(x, modo = 'diario'){
  const u = yo(), d = modo === 'diario' ? Cuidado.estadoDiario(x) : { estado:'-' }, sa = modo === 'salida' ? Cuidado.estadoSalida(x) : null, pila = esc(primerNombre(x.nombre));
  const pend = x.contactos[u.id] && !x.contactos[u.id].acepta;
  const lin = [];
  const quien = r => r.por === x.id ? pila : r.por && usuario(r.por) ? esc(primerNombre(usuario(r.por).nombre)) : 'un contacto';
  if (modo === 'diario') switch (d.estado){
    case 'ok':           lin.push(`<span class="eb-ok">${I('check')}Avisó hoy a las ${hora(x.ultimo)}</span>`); break;
    case 'pendiente':    lin.push(`<span>${I('clock')}Todavía no avisó hoy · tiene hasta las ${esc(x.hora || BIEN_HORA)}</span>`); break;
    case 'vencido': case 'alerta': lin.push(`<span class="eb-mal">${I('alert')}No avisó hoy (tenía hasta las ${esc(x.hora || BIEN_HORA)})</span>`); break;
    case 'resuelto':     lin.push(`<span class="eb-ok">${I('check')}Está bien: lo confirmó ${quien(d.aviso.resuelto)}${d.aviso.resuelto.nota ? ' · ' + esc(d.aviso.resuelto.nota) : ''}</span>`); break;
    case 'pausa':        lin.push(`<span>${I('clock')}En pausa hasta el ${fechaCorta(x.pausaHasta)}</span>`); break;
    case 'desde-manana': lin.push(`<span>${I('clock')}Empieza mañana (antes de las ${esc(x.hora || BIEN_HORA)})</span>`); break;
    default:             lin.push(`<span>${I('clock')}"Estoy bien" apagado</span>`);
  }
  if (sa && sa.estado !== 'volvio'){
    const t = TIPOS_SALIDA[x.salida.tipo] || TIPOS_SALIDA.otra;
    const txt = `${esc(t.n)}${x.salida.donde ? ' · ' + esc(x.salida.donde) : ''}${x.salida.con ? ' · con ' + esc(x.salida.con) : ''} · vuelve ${hora(x.salida.vuelta)}`;
    lin.push(['vencido', 'alerta'].includes(sa.estado) ? `<span class="eb-mal">${I(t.icon)}No volvió: ${txt}</span>`
      : sa.estado === 'resuelto' ? `<span class="eb-ok">${I('check')}Está bien (salida): lo confirmó ${quien(sa.aviso.resuelto)}</span>`
      : `<span>${I(t.icon)}De salida: ${txt}</span>`);
  }
  const alerta = ['vencido', 'alerta'].includes(d.estado) ? d.k : sa && ['vencido', 'alerta'].includes(sa.estado) ? sa.k : '';
  const esGarita = veListaCuidados();
  /* La garita y la Administración ven a quién llamar de la familia. */
  const fams = esGarita ? familiaresDe(x) : [];
  return `<div class="card eb-persona${alerta ? ' mal' : ''}">
    <div class="eb-persona-cab">${avatar(usuario(x.id) || { nombre:x.nombre })}<div class="grow"><b>${esc(x.nombre || '')}</b><small>${esc(x.casa || '')}</small></div></div>
    <div class="eb-lineas">${lin.join('')}</div>
    ${fams.length ? `<div class="eb-fams">${fams.map(f => `<span>${I('users')}${esc(f.nombre || 'Familiar')}${f.tel ? ` · <a href="${telLink(f.tel)}">${esc(f.tel)}</a>` : ''}${f.email ? ` · ${esc(f.email)}` : ''}</span>`).join('')}</div>` : ''}
    ${pend ? `<p class="small" style="margin:10px 0 6px">${pila} te eligió para avisarte. Si ${modo === 'salida' ? 'no vuelve de una salida a tiempo' : 'un día no avisa que está bien'}, te llega un aviso para que lo llames o pases a ver.</p>
      <div class="btns"><button class="btn btn-sm btn-ok" data-a="bien-acepto" data-id="${esc(x.id)}">${I('check')}Acepto</button><button class="btn btn-sm btn-sec" data-a="bien-nopuedo" data-id="${esc(x.id)}">No puedo</button></div>` : ''}
    <div class="btns" style="margin-top:10px">
      ${x.tel ? `<a class="btn btn-sm ${alerta ? 'btn-danger' : 'btn-sec'}" href="${telLink(x.tel)}">${I('phone')}Llamar</a>` : ''}
      ${x.tel && /^(549)?2901(15|5|6)/.test(soloDigitos(x.tel)) ? `<a class="btn btn-sm btn-sec" href="${waLink(x.tel)}" target="_blank" rel="noopener">${I('chat')}WhatsApp</a>` : ''}
      ${alerta ? `<button class="btn btn-sm btn-ok" data-a="bien-resolver" data-id="${esc(x.id)}" data-k="${esc(alerta)}">${I('check')}${u.rol === 'guardia' ? 'Fuimos: está bien' : 'Ya hablé: está bien'}</button>` : ''}
      ${alerta && !esGarita ? `<button class="btn btn-sm btn-sec" data-a="bien-garita" data-id="${esc(x.id)}">${I('gate')}Pedir a la garita que pase</button>` : ''}
    </div>
    ${!pend && x.contactos[u.id] ? `<button class="link tiny" style="margin-top:10px" data-a="bien-dejar" data-id="${esc(x.id)}">Dejar de recibir sus avisos</button>` : ''}
  </div>`;
}
R['estoy-bien'] = {
  titulo:'Estoy bien', icon:'heart', color:'ok', sub:'Un toque por día, y alguien de confianza se entera si falta',
  render(){
    const u = yo();
    if (veListaCuidados()){
      const ps = Cuidado.personas().filter(p => p.activo);
      return `<p class="muted small" style="margin:0 0 14px">Vecinos que viven solos y usan "Estoy bien". Cada día tocan el botón en su app; si a su hora no lo hicieron, acá se pone en rojo, suena y hay que llamarlos, pasar a ver o avisar a su familia. Esta lista la ven solo la garita y la Administración (y cada persona elegida, a quien la eligió): el resto del barrio no.</p>
        ${ps.length ? ps.sort((a, b) => Cuidado.enAlerta(b) - Cuidado.enAlerta(a)).map(tarjetaCuidado).join('') : vacio('heart', 'Por ahora ningún vecino usa "Estoy bien".')}`;
    }
    const x = Cuidado.mio(), activo = !!(x && x.activo), ps = Cuidado.personas().filter(p => p.activo);
    let mio;
    if (!activo){
      mio = `<div class="card eb-intro">${I('heart')}<div><b>Para quien vive solo o sola</b>
          <p>Una vez por día tocás el botón verde <b>ESTOY BIEN</b> de la portada. Si a la hora que elegís no lo tocaste, la app avisa a <b>la garita</b>, a <b>la Administración</b>, a <b>tus familiares</b> (por correo) y a las personas del barrio que elijas (en su app).</p>
          <p class="muted small">Es una idea de Japón, donde muchas personas mayores viven solas. El resto del barrio no se entera de que lo usás.</p></div></div>
        <ol class="eb-pasos"><li><b>Elegís tu hora</b> (por ejemplo, las 10). Una hora antes te llega un recordatorio al celular.</li>
          <li><b>Anotás a tus familiares</b> (hasta 3, con correo y teléfono) y, si querés, <b>hasta 3 personas del barrio</b> (un familiar o un vecino de confianza, que tiene que aceptar). La garita y la Administración ya están incluidas.</li>
          <li><b>Cada mañana, un toque</b>: en el botón verde o en el aviso del celular.</li>
          <li><b>Si un día no tocás</b>, la garita te llama o pasa a ver y tu familia recibe el aviso. Si te vas de viaje, lo pausás.</li></ol>
        <button class="btn btn-ok btn-block btn-grande" data-a="bien-config">${I('heart')}Quiero usar "Estoy bien"</button>`;
    } else {
      const d = Cuidado.estadoDiario(x);
      const contactos = Object.entries(x.contactos).map(([id, c]) => `<div class="it">${avatar(usuario(id) || { nombre:c.nombre })}<div class="txt"><b>${esc(c.nombre || nombreDe(id))}</b><span>${esc(c.casa || usuario(id)?.casa || '')} · ${c.acepta ? 'aceptó' : 'todavía no lo vio'}</span></div>${c.acepta ? `<span class="pill p-ok">${I('check')}Listo</span>` : '<span class="pill">Pendiente</span>'}</div>`);
      contactos.unshift(`<div class="it">${I('gate')}<div class="txt"><b>La garita y la Administración</b><span>Siempre reciben el aviso</span></div><span class="pill p-ok">${I('check')}Listo</span></div>`);
      familiaresDe(x).forEach(f => contactos.push(`<div class="it">${I('users')}<div class="txt"><b>${esc(f.nombre || 'Familiar')}</b><span>${[f.email && 'Por correo · ' + esc(f.email), f.tel && 'Tel. ' + esc(f.tel)].filter(Boolean).join(' · ') || 'Sin correo'}</span></div></div>`));
      mio = `${['pendiente', 'vencido', 'alerta'].includes(d.estado) ? botonEstoyBien(x, d)
          : d.estado === 'ok' ? `<div class="eb-hecho">${I('check')}<div><b>Hoy ya avisaste que estás bien</b><span>a las ${hora(x.ultimo)}</span></div></div>`
          : d.estado === 'resuelto' ? `<div class="eb-hecho">${I('check')}<div><b>Hoy un contacto confirmó que estás bien</b><span>Igual podés tocar el botón mañana</span></div></div>`
          : d.estado === 'pausa' ? aviso('info', 'clock', `En pausa hasta el ${fechaLarga(x.pausaHasta)}`, 'Mientras tanto no se avisa a nadie.', `<button class="btn btn-xs btn-pri" data-a="bien-reanudar">Volver a activarlo</button>`)
          : aviso('info', 'clock', 'Empieza mañana', `Mañana tocá el botón verde antes de las ${esc(x.hora || BIEN_HORA)}.`)}
        <div class="card"><div class="lbl">Tu hora</div><p style="margin:0 0 4px"><b>Hasta las ${esc(x.hora || BIEN_HORA)}</b> todos los días. Una hora antes te llega un recordatorio al celular${typeof Push !== 'undefined' && Push.estado() !== 'activo' && Push.estado() !== 'demo' ? ' (activá los avisos en este equipo, en Tu cuenta)' : ''}.</p>
          <div class="lbl" style="margin-top:14px">A quién se avisa</div><div class="lista">${contactos.join('') || '<p class="small muted">Sin contactos.</p>'}</div>
          <div class="btns" style="margin-top:12px"><button class="btn btn-sm btn-sec" data-a="bien-config">${I('edit')}Cambiar hora o familiares</button>
            ${d.estado === 'pausa' ? '' : `<button class="btn btn-sm btn-sec" data-a="bien-pausa">${I('clock')}Pausar unos días</button>`}</div>
          <button class="link tiny" style="margin-top:12px" data-a="bien-baja">Dejar de usar "Estoy bien"</button></div>`;
    }
    /* Si alguien que cuido está en alerta (o me eligió y todavía no acepté),
       eso va primero: es lo que hay que resolver. */
    const urge = ps.some(p => Cuidado.enAlerta(p) || (p.contactos[u.id] && !p.contactos[u.id].acepta));
    const cuido = ps.length ? `${sec('Personas que cuidás')}${ps.sort((a, b) => Cuidado.enAlerta(b) - Cuidado.enAlerta(a)).map(tarjetaCuidado).join('')}` : '';
    return `${urge ? cuido + sec('Tu "Estoy bien"') : ''}${mio}
      ${urge ? '' : cuido}
      <p class="muted tiny" style="margin-top:14px">${I('lock')} Lo ven solo vos, la garita, la Administración y las personas del barrio que elijas; tus familiares reciben el aviso por correo. El resto del barrio no. Se guarda la hora a la que avisás cada día; los avisos se borran a los 30 días. Podés dejar de usarlo cuando quieras.</p>`;
  },
};

/* ---------- elegir la hora y los familiares ---------- */
function formCuidado(soloSalidas = false){
  const u = yo(), x = Cuidado.mio() || {}, cands = candidatosCuidado();
  const elegidos = Object.keys(x.contactos || {}), fams = familiaresDe(x);
  const sel = i => `<select name="c${i}"><option value="">${i === 1 ? 'Nadie' : 'Otra persona (opcional)'}</option>${cands.map(c => `<option value="${esc(c.id)}" ${elegidos[i - 1] === c.id ? 'selected' : ''}>${esc(c.nombre)} · ${esc(c.casa)}</option>`).join('')}</select>`;
  const fam = i => { const f = fams[i - 1] || {};
    return `<div class="eb-fam-form"><div class="grid2"><div class="field"><label>Familiar ${i}${i > 1 ? ' (opcional)' : ''}</label><input name="fn${i}" maxlength="40" value="${esc(f.nombre || '')}" placeholder="Nombre (ej.: Ana, hermana)"></div>
      <div class="field"><label>Teléfono</label><input name="ft${i}" inputmode="tel" maxlength="20" value="${esc(f.tel || '')}" placeholder="549 …"></div></div>
      <div class="field"><label>Correo (le llega el aviso)</label><input name="fe${i}" type="email" maxlength="80" value="${esc(f.email || '')}" placeholder="correo@mail.com"></div></div>`; };
  return `<form data-f="bien-config" data-solo="${soloSalidas ? '1' : ''}">
    ${soloSalidas ? '' : `<div class="field"><label>Todos los días, avisar antes de las</label><select name="hora">${BIEN_HORAS.map(h => `<option ${h === (x.hora || BIEN_HORA) ? 'selected' : ''}>${h}</option>`).join('')}</select>
      <div class="ayuda">Una hora antes te llega un recordatorio al celular. Si a esa hora no tocaste el botón, se avisa a la garita, a la Administración y a tus familiares.</div></div>`}
    <div class="aviso a-info">${I('gate')}<div class="txt"><b>La garita y la Administración ya están incluidas</b>Reciben siempre el aviso y pueden llamarte o pasar a ver. El resto del barrio no se entera.</div></div>
    ${[1, 2, 3].map(fam).join('')}
    <div class="field"><label>Personas del barrio que elijas (opcional, hasta 3)</label>${[1, 2, 3].map(sel).join('<div style="height:8px"></div>')}
      <div class="ayuda">Un familiar que vive en el barrio o un vecino de confianza. Le llega el aviso en su app (con sonido) y tiene que aceptar.</div></div>
    <div class="field"><label>Tu teléfono (para que te llamen)</label><input name="tel" inputmode="tel" maxlength="20" value="${esc(x.tel || u.tel || '')}"></div>
    <label class="check"><input type="checkbox" name="acepto" required ${x.consentimiento ? 'checked' : ''}><span>Acepto que la garita, la Administración, los familiares y las personas que elijo vean mi nombre, mi lote, mi teléfono, a qué hora avisé${soloSalidas ? ' y mis salidas' : ''}, y que reciban un aviso si no aviso o no vuelvo. Lo puedo cambiar o borrar cuando quiera.</span></label>
    <button class="btn btn-ok btn-block" style="margin-top:12px">${I('check')}${soloSalidas ? 'Guardar' : Cuidado.mio()?.activo ? 'Guardar' : 'Activar "Estoy bien"'}</button></form>`;
}
A['bien-config'] = el => hoja(el && el.dataset.v === 'salidas' ? 'Salidas seguras: a quién avisar' : '"Estoy bien"', formCuidado(el && el.dataset.v === 'salidas'));
F['bien-config'] = async (d, form) => {
  const u = yo(), antes = Cuidado.mio(), solo = form.dataset.solo === '1';
  const contactos = {};
  [d.c1, d.c2, d.c3].filter(Boolean).forEach(id => { const c = usuario(id); if (!c || contactos[id] || id === u.id) return;
    const viejo = antes && antes.contactos[id];
    contactos[id] = { nombre:c.nombre, casa:c.casa || '', agregado:viejo?.agregado || Date.now(), ...(viejo?.acepta ? { acepta:viejo.acepta } : {}) }; });
  const familiares = [];
  for (const i of [1, 2, 3]){
    const nombre = String(d['fn' + i] || '').trim().slice(0, 40), email = String(d['fe' + i] || '').trim().slice(0, 80), tel = String(d['ft' + i] || '').trim().slice(0, 20);
    if (!nombre && !email && !tel) continue;
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){ toast(`El correo del familiar ${i} no parece válido`, 'alert'); return; }
    familiares.push({ nombre, email, tel });
  }
  const reg = { nombre:u.nombre, casa:u.casa || '', tel:String(d.tel || '').trim(), contactos, garita:true, familiares, familiar:null, consentimiento:Date.now() };
  if (!solo){ reg.activo = true; reg.hora = BIEN_HORAS.includes(d.hora) ? d.hora : BIEN_HORA; }
  if (!antes){ reg.id = u.id; reg.creado = Date.now(); if (solo) reg.activo = false; }
  else if (!solo && !antes.activo) reg.creado = Date.now();
  try {
    await Cuidado.poner(u.id, reg);
    /* El índice de cada familiar con la app: así su app sabe a quién cuida.
       (La garita y la Administración leen la lista entera.) */
    const nuevos = Object.keys(contactos).filter(id => !antes || !antes.contactos[id]);
    const fuera = antes ? Object.keys(antes.contactos).filter(id => !contactos[id]) : [];
    for (const id of Object.keys(contactos)) await Cuidado.indice(id, u.id, true);
    for (const id of fuera) await Cuidado.indice(id, u.id, false);
    if (nuevos.length) Store.cambiar(s => notificar(s, { para:nuevos, titulo:`${primerNombre(u.nombre)} (${u.casa || ''}) te eligió para avisarte`,
      texto:solo ? 'Para sus salidas al agua o a la montaña: si no vuelve a tiempo, te llega un aviso.' : 'De "Estoy bien": si un día no avisa que está bien, te llega un aviso. Entrá para aceptar.', icon:'heart', color:'ok', link:'estoy-bien', sonido:true }));
    cerrarHoja();
    toast(solo ? 'Listo: ya podés avisar tus salidas' : antes?.activo ? 'Guardado' : 'Listo: desde ahora, un toque por día en el botón verde', 'heart');
    refrescar();
  } catch(e){ toast('No se pudo guardar: ' + (e.message || e), 'alert'); }
};
A['bien-ok'] = async () => {
  Sonido.despertar();
  const x = Cuidado.mio();
  if (!x || !x.activo){ abrir('estoy-bien'); return; }
  if (await Cuidado.marcar()){
    Sonido.tocar([[660, 0, .18], [880, .16, .3]], 'sine', .14); Sonido.vibrar(60);
    toast(`Listo: hoy ya avisaste que estás bien 💚`, 'heart');
    refrescar();
  }
};
A['bien-pausa'] = () => hoja('Pausar "Estoy bien"', `<form data-f="bien-pausa"><p class="small muted" style="margin:0 0 12px">Por ejemplo, si te vas de viaje o pasás unos días en otra casa. Mientras dura la pausa no se avisa a nadie.</p>
  <div class="field"><label>Hasta el día (inclusive)</label><input type="date" name="hasta" required min="${hoyISO()}" value="${sumarDias(hoyISO(), 7)}"></div>
  <button class="btn btn-pri btn-block">${I('clock')}Pausar</button></form>`);
F['bien-pausa'] = async d => { if (!d.hasta || d.hasta < hoyISO()){ toast('Elegí una fecha de hoy en adelante', 'alert'); return; }
  await Cuidado.poner(yo().id, { pausaHasta:d.hasta }); cerrarHoja(); toast(`En pausa hasta el ${fechaCorta(d.hasta)}`, 'clock'); refrescar(); };
A['bien-reanudar'] = async () => { await Cuidado.poner(yo().id, { pausaHasta:null }); toast('"Estoy bien" otra vez activo', 'heart'); refrescar(); };
A['bien-baja'] = async () => {
  const u = yo(), x = Cuidado.mio(); if (!x) return;
  if (!await confirmar('Dejar de usar "Estoy bien"', 'Se borran tu horario, tus familiares, la hora a la que avisaste cada día y tu aviso de salida. La garita, la Administración y tu familia dejan de verte en la lista.', { si:'Borrar todo', peligro:true })) return;
  try {
    for (const id of Object.keys(x.contactos)) await Cuidado.indice(id, u.id, false);
    await Cuidado.poner(u.id, { '':null });
    toast('Listo: se borró todo', 'check'); refrescar();
  } catch(e){ toast('No se pudo borrar: ' + (e.message || e), 'alert'); }
};
/* Lo que hace un contacto. */
A['bien-acepto'] = async el => {
  const u = yo(), x = Cuidado.de(el.dataset.id); if (!x) return;
  await Cuidado.poner(x.id, { [`contactos/${u.id}/acepta`]:Date.now() });
  Store.cambiar(s => notificar(s, { para:[x.id], titulo:`${primerNombre(u.nombre)} aceptó ser tu contacto`, texto:'Si un día no avisás que estás bien, le llega un aviso.', icon:'heart', color:'ok', link:'estoy-bien' }));
  toast(`Listo: cuidás a ${primerNombre(x.nombre)}`, 'heart'); refrescar();
};
async function dejarDeCuidar(id, motivo){
  const u = yo(), x = Cuidado.de(id); if (!x) return;
  await Cuidado.poner(x.id, { [`contactos/${u.id}`]:null });
  await Cuidado.indice(u.id, x.id, false);
  Store.cambiar(s => notificar(s, { para:[x.id], titulo:`${primerNombre(u.nombre)} ${motivo}`, texto:'La garita y la Administración siguen recibiendo tus avisos. Podés cambiarlo en "Estoy bien" → Cambiar hora o familiares.', icon:'heart', color:'warn', link:'estoy-bien', sonido:true }));
  refrescar();
}
A['bien-nopuedo'] = async el => { await dejarDeCuidar(el.dataset.id, 'no puede recibir tus avisos'); toast('Listo: le avisamos', 'check'); };
A['bien-dejar'] = async el => {
  const x = Cuidado.de(el.dataset.id); if (!x) return;
  if (!await confirmar('Dejar de recibir sus avisos', `A ${esc(primerNombre(x.nombre))} le llega un aviso. La garita y la Administración siguen cuidándolo/a.`, { si:'Dejar de recibirlos', peligro:true })) return;
  await dejarDeCuidar(el.dataset.id, 'dejó de recibir tus avisos'); toast('Listo', 'check');
};
A['bien-resolver'] = async el => {
  const x = Cuidado.de(el.dataset.id); if (!x) return;
  hoja(`¿${primerNombre(x.nombre)} está bien?`, `<form data-f="bien-resolver" data-id="${esc(x.id)}" data-k="${esc(el.dataset.k)}">
    <p class="small" style="margin:0 0 12px">Confirmalo solo si hablaste con ${esc(primerNombre(x.nombre))} o lo/la viste. A la garita, la Administración y la familia con la app les llega que ya está resuelto.</p>
    <div class="field"><label>Nota (opcional)</label><input name="nota" maxlength="140" placeholder="Ej: se olvidó el celular, está bien"></div>
    <button class="btn btn-ok btn-block">${I('check')}Sí, está bien</button></form>`);
};
F['bien-resolver'] = async (d, form) => { if (await Cuidado.resolver(form.dataset.id, form.dataset.k, d.nota)){ cerrarHoja(); toast('Gracias: les avisamos a los demás', 'heart'); refrescar(); } };
A['bien-garita'] = el => {
  const u = yo(), x = Cuidado.de(el.dataset.id), g = cuentasGarita(); if (!x) return;
  if (!g.length){ toast('La garita no tiene cuenta en la app: llamala por teléfono', 'alert'); return; }
  const diario = ['vencido', 'alerta'].includes(Cuidado.estadoDiario(x).estado);
  const titulo = `Pasar a ver: ${x.casa || primerNombre(x.nombre)}`, texto = `${primerNombre(u.nombre)} (${u.casa || ''}) pide que pasen por ${x.casa || ''}: ${primerNombre(x.nombre)} ${diario ? 'no avisó hoy que está bien' : 'no volvió de su salida'}.`;
  Store.cambiar(s => notificar(s, { para:g, titulo, texto, icon:'heart', color:'danger', link:'garita', urgente:true, push:false }));
  if (typeof Push !== 'undefined') Push.enviar({ para:g, titulo, texto, link:'garita', tag:'bien-garita-' + x.id, urgente:true, sonido:'sos' });
  toast('Listo: la garita ya recibió el pedido', 'gate');
};

/* =========================================================
   SALIDAS SEGURAS: el aviso de salida y la guía de verano
   ========================================================= */
const GUIA_VERANO = [
  { t:'Kayak, remo y SUP en el Canal Beagle', icon:'drop', items:[
    'El agua del Beagle está entre 4 y 10 °C todo el año. Al caer, el frío corta la respiración y en minutos entumece las manos. Es la regla 1-10-1: 1 minuto para controlar la respiración, unos 10 de movimientos útiles, y menos de 1 hora antes de perder la conciencia por hipotermia.',
    'Chaleco salvavidas siempre puesto (no atado al kayak) y traje seco o de neoprene.',
    'Nunca solo: salí con otro kayak y quedate cerca de la costa.',
    'Comunicación encima, no en el kayak: handy VHF (canal 16) o celular en bolsa estanca colgado del cuerpo, más silbato y luz.',
    'El viento cambia en minutos: las ráfagas bajan de la montaña al agua. Mirá el pronóstico de viento antes de salir y volvé apenas se levante.',
    'Dejá el Aviso de salida en la app y consultá en Prefectura los requisitos vigentes para salir.',
  ]},
  { t:'Navegación a vela o a motor', icon:'send', items:[
    'Despacho de salida en Prefectura cuando corresponda, y el equipo reglamentario a bordo.',
    'Radio VHF encendida en el canal 16, chalecos para todos y bengalas vigentes.',
    'Combustible por tercios: uno para ir, uno para volver y uno de reserva.',
    'Plan de navegación (a dónde, cuántos a bordo, hora de regreso): es lo que en Estados Unidos llaman "float plan". En la app, el Aviso de salida.',
  ]},
  { t:'Trekking y montaña', icon:'tree', items:[
    'Salí temprano y ponete una hora de regreso. Aunque en verano oscurece tarde, el tiempo cambia rápido.',
    'Si vas solo, dejá siempre el Aviso de salida. Mejor todavía: no vayas solo por senderos poco transitados.',
    'Los "10 esenciales" de montaña: mapa o GPS con batería, linterna, protección solar, botiquín, navaja, encendedor, abrigo extra, comida y agua de más, y algo con qué refugiarte.',
    'Respetá las sendas marcadas y lo que indiquen los guardaparques; consultá el estado de los senderos antes de salir.',
    'Turberas y mallines: no se camina fuera del sendero (te hundís y se dañan por años).',
    'Si te perdés: quedate quieto, abrigate, llamá al 911 o al 103 y cuidá la batería.',
  ]},
  { t:'Escalada', icon:'tree', items:[
    'Casco siempre, también quien asegura.',
    'Control cruzado antes de cada vía: nudo, arnés, dispositivo, mosquetón cerrado y nudo al final de la cuerda.',
    'Roca fría o húmeda agarra menos. Revisá los anclajes y no escales con lluvia o hielo.',
    'Nunca solo, y con aviso de a dónde vas y cuándo volvés.',
  ]},
  { t:'Pesca', icon:'drop', items:[
    'La pesca deportiva requiere el permiso provincial vigente: consultá temporadas y cupos.',
    'Vadear ríos fríos con corriente es peligroso: cinturón en el vadeador, bastón, y nunca solo.',
  ]},
  { t:'Fuego y bosque', icon:'flame', items:[
    'Fuego solo en lugares habilitados y cuando esté permitido. El bosque fueguino tarda décadas en recuperarse.',
    'Apagá con agua y tierra hasta que las cenizas estén frías al tacto.',
    'Incendio forestal: 100 (bomberos) o 911.',
  ]},
  { t:'Sol, viento y frío', icon:'sun', items:[
    'En primavera y verano el índice UV puede ser muy alto (a veces pasa el agujero de ozono): protector, anteojos y gorro aunque esté nublado.',
    'Vestite en capas: con viento, la sensación térmica baja mucho.',
  ]},
  { t:'Fauna', icon:'paw', items:[
    'No alimentes zorros ni otros animales silvestres, y guardá la comida.',
    'Distancia con lobos marinos y aves de la costa.',
    'Perros con correa en senderos y áreas protegidas.',
  ]},
  { t:'Cómo se hace en otros lugares del mundo', icon:'sparkle', items:[
    'Nueva Zelanda: el formulario "Outdoor Intentions" se le deja a un contacto de confianza, y el código de seguridad pide planificar, avisar a alguien, mirar el tiempo, conocer los propios límites y llevar lo necesario.',
    'Canadá (AdventureSmart): plan de viaje por escrito dejado con un contacto, formación previa y equipo esencial.',
    'Estados Unidos: la Guardia Costera pide un plan de navegación antes de salir en bote o kayak; en montaña, los 10 esenciales.',
    'Alpes: se avisa en el refugio la ruta y el regreso; en glaciar, siempre encordados y nunca solos.',
    'Chile (Torres del Paine) y el Aconcagua: registro o permiso obligatorio para entrar, con control de salida.',
    'Donde no hay señal de celular (en Tierra del Fuego hay muchas zonas así), se usan radiobalizas personales o mensajeros satelitales.',
  ]},
];
const TELEFONOS_VERANO = [['911', 'Emergencias'], ['106', 'Prefectura: emergencias en el agua'], ['100', 'Bomberos'], ['103', 'Defensa Civil'], ['107', 'Emergencias médicas']];
R.salidas = {
  titulo:'Salidas seguras', icon:'pin', color:'sky', sub:'Kayak, montaña y navegación: el aviso de salida y la guía',
  render(){
    const x = Cuidado.mio(), sa = x && x.salida && !x.salida.volvio ? x.salida : null, e = sa ? Cuidado.estadoSalida(x) : null;
    const hayContactos = !!(x && x.consentimiento);
    const t = sa ? TIPOS_SALIDA[sa.tipo] || TIPOS_SALIDA.otra : null;
    const aviso1 = sa ? `<div class="card eb-salida-grande">${I(t.icon)}<div class="grow"><b>Estás de salida · ${esc(t.n)}</b>
          <span>${esc(sa.donde || '')}${sa.con ? ' · con ' + esc(sa.con) : ''}</span>
          <span>Volvés a las <b>${hora(sa.vuelta)}</b>. ${e.estado === 'alerta' ? 'Ya avisamos a la garita y a tu familia: tocá Volví.' : `Si a las ${hora(e.lim)} no tocaste "Volví", avisamos a ${esc(nombresContactos(x))}.`}</span></div></div>
        <div class="btns"><button class="btn btn-ok btn-grande grow" data-a="salida-volvi">${I('check')}Volví</button><button class="btn btn-sec" data-a="salida-nueva">${I('edit')}Cambiar</button></div>`
      : `<p class="small" style="margin:0 0 12px">Antes de salir al agua o a la montaña, dejá dicho a dónde vas, con quién y a qué hora volvés. Si no tocás <b>Volví</b> a tiempo, la app avisa a la garita, a la Administración y a tus familiares. Mientras estés afuera, el botón verde <b>Volví</b> te espera arriba de todo en la portada, en Tu casa y acá.</p>
        ${hayContactos ? `<p class="muted small" style="margin:0 0 12px">Se avisa a ${esc(nombresContactos(x))}. <button class="link" data-a="bien-config" data-v="salidas">Cambiar mis familiares</button></p>` : ''}
        <button class="btn btn-pri btn-block btn-grande" data-a="${hayContactos ? 'salida-nueva' : 'bien-config'}" data-v="salidas">${I('pin')}${hayContactos ? 'Voy a salir' : 'Anotar a mis familiares y salir'}</button>`;
    /* Las salidas de otros: la garita y la Administración ven todas; cada
       persona elegida, la de quien la eligió. */
    const otras = Cuidado.personas().filter(p => { const e = Cuidado.estadoSalida(p); return e && e.estado !== 'volvio'; });
    const listaOtras = otras.length ? `${sec(veListaCuidados() ? 'Salidas en curso' : 'Salidas de quienes te eligieron')}${otras.sort((a, b) => Cuidado.enAlerta(b) - Cuidado.enAlerta(a)).map(p => tarjetaCuidado(p, 'salida')).join('')}` : '';
    if (veListaCuidados()) return `${listaOtras || vacio('pin', 'Ningún vecino está de salida ahora.')}${sec('Teléfonos')}<div class="eb-tels">${TELEFONOS_VERANO.map(([n, q]) => `<a class="eb-tel" href="tel:${n}"><b>${n}</b><span>${esc(q)}</span></a>`).join('')}</div>`;
    return `${otras.some(p => Cuidado.enAlerta(p)) ? listaOtras : ''}<div class="card">${aviso1}</div>
      ${otras.some(p => Cuidado.enAlerta(p)) ? '' : listaOtras}
      ${sec('Teléfonos')}<div class="eb-tels">${TELEFONOS_VERANO.map(([n, q]) => `<a class="eb-tel" href="tel:${n}"><b>${n}</b><span>${esc(q)}</span></a>`).join('')}</div>
      ${sec('Guía de seguridad de verano')}
      ${GUIA_VERANO.map((g, i) => `<details class="card eb-guia" ${i === 0 ? 'open' : ''}><summary>${I(g.icon)}<b>${esc(g.t)}</b></summary><ul>${g.items.map(x => `<li>${esc(x)}</li>`).join('')}</ul></details>`).join('')}
      <p class="muted tiny">Guía orientativa y general. Antes de salir, consultá a Prefectura, a los guardaparques y a guías habilitados; las normas cambian y no reemplaza su palabra.</p>`;
  },
};
A['salida-nueva'] = () => {
  const x = Cuidado.mio(), sa = x && x.salida && !x.salida.volvio ? x.salida : null;
  const d = new Date(sa ? sa.vuelta : Date.now() + 4 * HORA); d.setMinutes(Math.round(d.getMinutes() / 15) * 15, 0, 0);
  const local = `${isoDe(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  hoja(sa ? 'Cambiar mi salida' : 'Voy a salir', `<form data-f="salida">
    <div class="field"><label>¿Qué vas a hacer?</label><select name="tipo">${Object.entries(TIPOS_SALIDA).map(([k, t]) => `<option value="${k}" ${sa && sa.tipo === k ? 'selected' : ''}>${esc(t.n)}</option>`).join('')}</select></div>
    <div class="field"><label>¿A dónde?</label><input name="donde" required maxlength="80" value="${esc(sa?.donde || '')}" placeholder="Ej: Bahía Encerrada hasta Punta Observatorio"></div>
    <div class="field"><label>¿Con quién?</label><input name="con" maxlength="80" value="${esc(sa?.con || '')}" placeholder="Nombres, o solo/a"></div>
    <div class="grid2"><div class="field"><label>Vuelvo a las</label><input type="datetime-local" name="vuelta" required value="${local}"></div>
      <div class="field"><label>Avisar si no vuelvo</label><select name="margen">${SALIDA_MARGENES.map(m => `<option value="${m}" ${(sa?.margen || 60) === m ? 'selected' : ''}>${m < 60 ? m + ' min' : m / 60 + (m === 60 ? ' hora' : ' horas')} después</option>`).join('')}</select></div></div>
    <p class="muted small" style="margin:0 0 12px">Se avisa a ${esc(nombresContactos(x || {}))}. Al volver, tocá el botón verde <b>Volví</b>: mientras estés de salida aparece arriba de todo en la portada, en Tu casa y en esta ventana, y si se pasa la hora te llega un aviso al celular para tocarlo.</p>
    <button class="btn btn-pri btn-block">${I('pin')}${sa ? 'Guardar' : 'Salgo'}</button></form>`);
};
F['salida'] = async d => {
  const u = yo(), x = Cuidado.mio();
  if (!x || !x.consentimiento){ A['bien-config']({ dataset:{ v:'salidas' } }); return; }
  const vuelta = new Date(d.vuelta).getTime();
  if (!vuelta || vuelta < Date.now() + 5 * MIN){ toast('La hora de regreso tiene que ser más adelante', 'alert'); return; }
  if (vuelta > Date.now() + 14 * DIA){ toast('Para más de dos semanas, mejor pausá "Estoy bien" y avisá por otro lado', 'alert'); return; }
  const previa = x.salida && !x.salida.volvio ? x.salida : null;
  const sal = { tipo: TIPOS_SALIDA[d.tipo] ? d.tipo : 'otra', donde:String(d.donde || '').trim().slice(0, 80), con:String(d.con || '').trim().slice(0, 80),
    vuelta, margen: SALIDA_MARGENES.includes(+d.margen) ? +d.margen : 60, creada: previa && !x.aviso['s-' + previa.creada] ? previa.creada : Date.now(), volvio:0 };
  await Cuidado.poner(u.id, { salida:sal, nombre:u.nombre, casa:u.casa || '' });
  const t = TIPOS_SALIDA[sal.tipo], para = Cuidado.destinatarios(x);
  if (para.length && !previa) Store.cambiar(s => notificar(s, { para, titulo:`${primerNombre(u.nombre)} salió: ${t.n}`, texto:`${sal.donde} · vuelve a las ${hora(vuelta)}. Si no marca que volvió, te avisamos.`, icon:t.icon, color:'sky', link:'salidas' }));
  cerrarHoja(); toast(previa ? 'Salida actualizada' : '¡Buena salida! Al volver, tocá "Volví"', 'pin'); refrescar();
};
A['salida-volvi'] = async () => {
  const u = yo(), x = Cuidado.mio(); if (!x || !x.salida) return;
  const k = 's-' + x.salida.creada, av = x.aviso[k], habiaAlarma = !!(av && !av.resuelto);
  const cambios = { 'salida/volvio':Date.now() };
  if (habiaAlarma) cambios[`aviso/${k}/resuelto`] = { at:Date.now(), por:u.id, como:'volvió' };
  await Cuidado.poner(u.id, cambios);
  if (habiaAlarma) Cuidado.avisarBien(x, `${primerNombre(x.nombre)} ya volvió de su salida`, `Marcó que volvió a las ${hora(Date.now())}.`, 'salidas');
  else { const para = Cuidado.destinatarios(x); if (para.length) Store.cambiar(s => notificar(s, { para, titulo:`${primerNombre(x.nombre)} volvió de su salida`, texto:'', icon:'check', color:'ok', link:'salidas' })); }
  toast('¡Bienvenido/a de vuelta!', 'home'); refrescar();
};

/* =========================================================
   EL DEA Y LOS VECINOS DEL EQUIPO DE SALUD (pedido de Claudio)
   El SOS ya les llega a todos. Pero cuando la garita confirma que sale
   con el DEA ("Voy en camino con el DEA"), ya se sabe que es una
   emergencia de verdad: en ese momento, el mismo botón avisa a los
   vecinos que marcaron en Mi casa que son del equipo de salud o saben
   RCP. Es lo que hacen en otros países (PulsePoint, GoodSAM): un aviso a
   pocos, justo cuando hace falta, en vez de alarmar a todos.
   Su respuesta ("Voy" / "No puedo") viaja SOLO en staff/sos/<id>/responden
   (ver Nube.PARCIALES): la garita ve quién va en camino.
   ========================================================= */
const PROF_SALUD = { medico:'Médico/a', enfermeria:'Enfermero/a', emergencias:'Paramédico/a o emergencias', otro:'Otra profesión de la salud', rcp:'Curso de RCP y primeros auxilios' };
const Respondedores = {
  /* sosMemoria vive en js/app.js, que carga después: se arma al primer uso. */
  get ocultas(){ return this._ocultas || (this._ocultas = sosMemoria('bhc.respOcultas')); },
  get sonadas(){ return this._sonadas || (this._sonadas = sosMemoria('bhc.respSonadas')); },
  VIGENCIA: 40 * MIN,
  lista(excluir){ return Store.s.users.filter(x => x.estado === 'aprobado' && x.respondedor && x.id !== excluir && x.rol !== 'hotel' && x.rol !== 'guardia'); },
  prof(x){ return x && x.saludProf && PROF_SALUD[x.saludProf] ? PROF_SALUD[x.saludProf] : 'Equipo de salud o RCP'; },
  /* Lo llama A['dea-voy'] (js/app.js), adentro del mismo Store.cambiar. */
  alertar(s, x){
    const quienes = this.lista(x.userId).map(v => v.id); if (!quienes.length) return [];
    const casa = usuario(x.userId)?.casa || 'un lote del barrio';
    x.respAvisados = quienes.length; x.respAt = Date.now();
    notificar(s, { para:quienes, titulo:`Emergencia médica en ${casa}`, texto:'La garita va con el DEA. Si podés, acercate: abrí la app y tocá VOY.', icon:'heart', color:'danger', link:'emergencias', urgente:true, push:false });
    return quienes;
  },
  empujar(x, quienes){
    if (!quienes.length || typeof Push === 'undefined') return;
    Push.enviar({ para:quienes, titulo:`Emergencia médica · ${usuario(x.userId)?.casa || 'en el barrio'}`, texto:'La garita va con el DEA. Si podés ir, abrí la app y tocá VOY.', link:'emergencias', tag:'dear-' + x.id, urgente:true, sonido:'sos' });
  },
  pendiente(){
    const u = yo(); if (!u || !u.respondedor || u.rol === 'guardia' || u.rol === 'hotel') return null;
    return aLista(Store.s.sos).filter(x => x && x.tipo === 'dea' && x.estado === 'en_camino' && x.userId !== u.id
      && Date.now() - (x.enCaminoAt || x.at) < this.VIGENCIA && !(x.responden && x.responden[u.id]) && !this.ocultas.has(x.id))
      .sort((a, b) => b.at - a.at)[0] || null;
  },
  /* La pantalla roja del vecino del equipo de salud. Suena una vez. */
  pintar(box){
    const x = this.pendiente(); if (!x) return false;
    const v = usuario(x.userId) || {};
    if (!this.sonadas.has(x.id)){ this.sonadas.add(x.id); if (hojaAbierta()) cerrarHoja(); Sonido.tocar([[1175, 0, .3], [880, .32, .3], [1175, .64, .4]], 'square', .18); Sonido.vibrar([500, 150, 500, 150, 500]); }
    const punto = x.coords || v.ubicacion;
    const mapa = punto ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(punto)}` : '';
    const van = Object.entries(x.responden || {}).filter(([, r]) => r && r.v === 'voy').map(([id]) => primerNombre(nombreDe(id)));
    box.innerHTML = `<div class="sos-pantalla dea-pantalla" role="alertdialog" aria-label="Emergencia médica: la garita va con el DEA"><div class="sos-caja">
      <div class="sos-cab">${I('heart')}<div><b>EMERGENCIA MÉDICA</b><span>La garita salió con el DEA · ${hace(x.enCaminoAt || x.at)}</span></div></div>
      <div class="sos-vecino"><div class="grow"><b class="dea-apellido">${esc((v.casa || 'Lote sin dato').toUpperCase())}</b><div class="sos-dato">${esc(v.nombre || '')}</div>
        ${v.direccion ? `<div class="sos-dato">${esc(v.direccion)}</div>` : ''}
        ${van.length ? `<div class="sos-dato">${I('check')} Ya van: ${esc(van.join(', '))}</div>` : ''}</div></div>
      <div class="sos-texto">Marcaste que sos del equipo de salud o sabés RCP. Si podés, acercate: la garita llega con el desfibrilador.</div>
      <div class="sos-botones">
        <button class="btn btn-block dea-voy" data-a="resp-voy" data-id="${esc(x.id)}">${I('heart')}VOY</button>
        ${mapa ? `<a class="btn btn-block sos-b-claro" href="${mapa}" target="_blank" rel="noopener">${I('pin')}Cómo llegar</a>` : ''}
        <div class="btns"><a class="btn btn-sec grow" href="tel:107">${I('phone')}107</a><button class="btn btn-sec grow" data-a="resp-no" data-id="${esc(x.id)}">No puedo ir</button></div>
      </div></div></div>`;
    return true;
  },
  responder(id, v){
    const u = yo();
    Store.cambiar(s => {
      const x = s.sos.find(o => o.id === id); if (!x) return;
      if (!x.responden || typeof x.responden !== 'object') x.responden = {};
      x.responden[u.id] = { v, at:Date.now() };
      if (v === 'voy'){
        const para = [...cuentasGarita(), x.userId].filter(Boolean);
        notificar(s, { para, titulo:`Va en camino: ${u.nombre}`, texto:`${this.prof(u)} · ${u.casa || ''}${u.tel ? ' · ' + u.tel : ''}`, icon:'heart', color:'ok', link:'emergencias', urgente:true });
      }
    });
  },
};
A['resp-voy'] = el => { Respondedores.responder(el.dataset.id, 'voy'); Respondedores.ocultas.add(el.dataset.id);
  const x = aLista(Store.s.sos).find(o => o.id === el.dataset.id), v = x && usuario(x.userId), punto = x && (x.coords || v?.ubicacion);
  toast('Gracias: la garita y el vecino saben que vas', 'heart'); pintarAlarmas();
  if (punto) hoja('Vas en camino', `<p class="small" style="margin:0 0 12px">${esc(v?.casa || '')}${v?.direccion ? ' · ' + esc(v.direccion) : ''}</p>
    <a class="btn btn-pri btn-block" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(punto)}" target="_blank" rel="noopener">${I('pin')}Cómo llegar</a>`); };
A['resp-no'] = el => { Respondedores.responder(el.dataset.id, 'no'); Respondedores.ocultas.add(el.dataset.id); pintarAlarmas(); toast('Entendido', 'check'); };
/* Para la garita y la Administración: el pedido del DEA en curso. */
function bandaDeaEnCurso(){
  if (!esStaff()) return '';
  return aLista(Store.s.sos).filter(x => x && x.tipo === 'dea' && x.estado === 'en_camino' && Date.now() - (x.enCaminoAt || x.at) < 3 * HORA).map(x => {
    const v = usuario(x.userId) || {}, r = x.responden || {};
    const van = Object.entries(r).filter(([, y]) => y && y.v === 'voy').map(([id]) => { const w = usuario(id); return `${esc(w?.nombre || 'Vecino/a')} (${esc(Respondedores.prof(w))}${w?.casa ? ', ' + esc(w.casa) : ''})`; });
    return aviso('danger', 'heart', `El DEA va hacia ${esc(v.casa || '')} · ${esc(v.nombre || '')}`,
      `${x.respAvisados ? `Avisamos a ${plural(x.respAvisados, 'vecino del equipo de salud', 'vecinos del equipo de salud')}. ` : 'No hay vecinos del equipo de salud anotados. '}${van.length ? 'Van en camino: ' + van.join(', ') + '.' : x.respAvisados ? 'Todavía nadie respondió.' : ''}`,
      esGuardia() ? `<button class="btn btn-xs btn-sec" data-a="dea-listo" data-id="${esc(x.id)}">${I('check')}Terminó: cerrar el pedido</button>` : '');
  }).join('');
}

/* =========================================================
   ÁNGELES DE LA NIEVE (idea de Canadá, "Snow Angels")
   Vecinos que se anotan como ángeles y "adoptan" por la temporada la
   entrada de alguien que no puede palear (una persona mayor, alguien
   operado). Cuando nieva, a cada ángel le llega el aviso; al terminar
   toca "Listo, despejada" y a la otra persona le llega que ya puede
   salir. Quien necesita ayuda también puede pedirla en el momento.
   Vive en barrio/nieve (un registro por vecino, n-<uid>): lo ven los
   vecinos aprobados, porque cualquiera puede ser ángel. Por eso se
   guarda lo mínimo: lote, nombre de pila y una nota; nada de edad ni de
   salud. Un ángel solo puede escribir el campo "angel" (adoptar o soltar
   la casa) y el pedido del día (ver Nube.PARCIALES y las reglas).
   ========================================================= */
const nieveId = uid => 'n-' + uid;
const nieveDe = id => aLista(Store.s.nieve).find(x => x && x.id === nieveId(id)) || null;
const nieveAngeles = () => aLista(Store.s.nieve).filter(x => x && x.tipo === 'angel' && x.activo !== false);
const nieveAyuda = () => aLista(Store.s.nieve).filter(x => x && x.tipo === 'ayuda' && x.activo !== false);
/* ¿Nevó hoy en el barrio? (Open-Meteo: nieve caída hoy o nevando ahora). */
function nevoHoy(){
  const d = Clima.d; if (!d || !d.dd || !d.c) return 0;
  const i = d.dd.time ? d.dd.time.indexOf(hoyISO()) : 0;
  const cm = i >= 0 ? d.dd.snowfall_sum?.[i] || 0 : 0;
  return cm >= 2 || (d.c.snowfall || 0) >= 0.3 ? Math.max(cm, d.c.snowfall || 0) : 0;
}
const pedidoDeHoy = x => x && x.pedido && x.pedido.fecha === hoyISO() ? x.pedido : null;
R.nieve = {
  titulo:'Ángeles de la nieve', icon:'snow', color:'sky', sub:'Vecinos que despejan la entrada de quien no puede',
  render(){
    const u = yo(), yoN = nieveDe(u.id), cm = nevoHoy();
    const ayuda = nieveAyuda(), angeles = nieveAngeles();
    const intro = `<div class="card eb-intro">${I('snow')}<div><b>Una idea de Canadá</b><p>Después de cada nevada, los vecinos que se anotan como <b>ángeles</b> despejan la entrada y la vereda de quien no puede palear: personas mayores, alguien operado o con la espalda a la miseria. Cada ángel adopta una casa por la temporada.</p>
      <p class="muted small" style="margin:0">${plural(angeles.length, 'ángel anotado', 'ángeles anotados')} · ${plural(ayuda.length, 'casa pide', 'casas piden')} ayuda${cm ? ` · ${I('snow')} hoy nevó (${Math.round(cm)} cm)` : ''}</p></div></div>`;
    if (!yoN || yoN.activo === false) return `${intro}
      <div class="btns"><button class="btn btn-pri grow" data-a="nieve-anotar" data-v="angel">${I('snow')}Me anoto como ángel</button>
        <button class="btn btn-sec grow" data-a="nieve-anotar" data-v="ayuda">${I('heart')}Necesito ayuda con la nieve</button></div>
      <p class="muted tiny" style="margin-top:14px">${I('lock')} Lo ven los vecinos de la app: tu lote, tu nombre de pila y la nota que dejes. Nada de edad ni de salud.</p>`;
    if (yoN.tipo === 'ayuda'){
      const p = pedidoDeHoy(yoN), angel = yoN.angel && usuario(yoN.angel);
      return `${intro}
        <div class="card"><div class="lbl">Tu entrada</div>
          ${angel ? `<p style="margin:0 0 8px">${I('heart')} Tu ángel esta temporada: <b>${esc(angel.nombre)}</b> (${esc(angel.casa || '')})</p>` : `<p class="small" style="margin:0 0 8px">Todavía ningún ángel adoptó tu casa. Los ángeles del barrio ya la ven en su lista.</p>`}
          ${p ? (p.estado === 'hecho' ? aviso('ok', 'check', 'Hoy ya despejaron tu entrada', `${p.por ? 'Lo hizo ' + esc(primerNombre(nombreDe(p.por))) : ''}${p.hechoAt ? ' a las ' + hora(p.hechoAt) : ''}.`)
              : aviso('info', 'clock', 'Pediste ayuda hoy', p.por ? `${esc(primerNombre(nombreDe(p.por)))} va en camino.` : 'Ya les llegó el aviso a los ángeles.'))
            : `<button class="btn btn-pri btn-block" data-a="nieve-pedir">${I('snow')}Hoy necesito que despejen mi entrada</button>`}
          ${yoN.nota ? `<p class="muted small" style="margin:10px 0 0">Tu nota: ${esc(yoN.nota)}</p>` : ''}
          <button class="link tiny" style="margin-top:12px" data-a="nieve-salir">Ya no necesito ayuda</button></div>`;
    }
    const mias = ayuda.filter(x => x.angel === u.id), libres = ayuda.filter(x => !x.angel && x.userId !== u.id), otras = ayuda.filter(x => x.angel && x.angel !== u.id);
    const fila = x => { const p = pedidoDeHoy(x), hecho = p && p.estado === 'hecho';
      const pide = p && !hecho, mia = x.angel === u.id;
      return `<div class="card eb-persona${pide ? ' mal' : ''}"><div class="eb-persona-cab">${I('home')}<div class="grow"><b>${esc(x.casa)} · ${esc(x.nombre || '')}</b><small>${esc(x.nota || 'Sin nota')}</small></div></div>
        <div class="eb-lineas">${hecho ? `<span class="eb-ok">${I('check')}Despejada hoy${p.por ? ' por ' + esc(primerNombre(nombreDe(p.por))) : ''}</span>` : pide ? `<span class="eb-mal">${I('snow')}Pidió ayuda hoy${p.por ? ' · va ' + esc(primerNombre(nombreDe(p.por))) : ''}</span>` : cm && mia ? `<span class="eb-mal">${I('snow')}Hoy nevó: falta despejarla</span>` : ''}
          ${x.angel && !mia ? `<span>${I('heart')}La adoptó ${esc(primerNombre(nombreDe(x.angel)))}</span>` : ''}</div>
        <div class="btns" style="margin-top:8px">${!x.angel ? `<button class="btn btn-sm btn-pri" data-a="nieve-adoptar" data-id="${esc(x.id)}">${I('heart')}La adopto esta temporada</button>` : ''}
          ${(mia || pide) && !hecho ? `<button class="btn btn-sm btn-ok" data-a="nieve-listo" data-id="${esc(x.id)}">${I('check')}Listo, despejada</button>` : ''}
          ${pide && !p.por && !mia ? `<button class="btn btn-sm btn-sec" data-a="nieve-voy" data-id="${esc(x.id)}">Voy yo</button>` : ''}
          ${mia ? `<button class="btn btn-sm btn-sec" data-a="nieve-soltar" data-id="${esc(x.id)}">Soltarla</button>` : ''}</div></div>`; };
    return `${intro}
      ${sec('Tus casas')}${mias.length ? mias.map(fila).join('') : `<p class="muted small">Todavía no adoptaste ninguna. Elegí una de abajo.</p>`}
      ${libres.length ? `${sec('Sin ángel todavía')}${libres.map(fila).join('')}` : ''}
      ${otras.length ? `${sec('Con ángel')}${otras.map(fila).join('')}` : ''}
      ${!ayuda.length ? vacio('snow', 'Por ahora nadie pidió ayuda. Cuando alguien se anote, te llega un aviso.') : ''}
      <div class="card plana small" style="margin-top:14px">${I('info')} Primero la seguridad: calzado con clavos o antideslizante, sal gruesa o arena en los escalones, y pausas: palear nieve pesada exige al corazón.</div>
      <button class="link tiny" style="margin-top:8px" data-a="nieve-salir">Dejar de ser ángel</button>`;
  },
};
A['nieve-anotar'] = el => {
  const angel = el.dataset.v === 'angel';
  hoja(angel ? 'Me anoto como ángel' : 'Necesito ayuda con la nieve', `<form data-f="nieve-anotar" data-v="${angel ? 'angel' : 'ayuda'}">
    <div class="field"><label>${angel ? 'Con qué contás (opcional)' : 'Una nota para tu ángel (opcional)'}</label><input name="nota" maxlength="90" placeholder="${angel ? 'Pala, sal, quitanieves…' : 'Ej: la rampa del garaje y los escalones de la entrada'}"></div>
    <p class="muted small" style="margin:0 0 12px">${angel ? 'Te llega un aviso cuando alguien pide ayuda y cada vez que nieva, para las casas que adoptes.' : 'Tu lote, tu nombre de pila y esta nota los ven los vecinos de la app, para que un ángel te adopte. No pongas datos de salud.'}</p>
    <button class="btn btn-pri btn-block">${I(angel ? 'snow' : 'heart')}Anotarme</button></form>`);
};
F['nieve-anotar'] = (d, form) => {
  const u = yo(), tipo = form.dataset.v === 'angel' ? 'angel' : 'ayuda';
  Store.cambiar(s => {
    const id = nieveId(u.id); let x = s.nieve.find(z => z.id === id);
    if (!x){ x = { id, userId:u.id }; s.nieve.push(x); }
    Object.assign(x, { casa:u.casa || '', nombre:primerNombre(u.nombre), tipo, nota:String(d.nota || '').trim().slice(0, 90), activo:true, at:Date.now() });
    if (tipo === 'ayuda'){ const ang = nieveAngeles().map(a => a.userId).filter(id2 => id2 !== u.id);
      if (ang.length) notificar(s, { para:ang, titulo:`${u.casa || 'Un vecino'} necesita un ángel de la nieve`, texto:x.nota || 'Entrá para adoptar la casa esta temporada.', icon:'snow', color:'sky', link:'nieve', sonido:true }); }
  });
  cerrarHoja(); toast(tipo === 'angel' ? '¡Gracias, ángel! 🤍' : 'Listo: los ángeles del barrio ya te ven', 'snow'); refrescar();
};
A['nieve-salir'] = async () => {
  const u = yo(), x = nieveDe(u.id); if (!x) return;
  if (!await confirmar(x.tipo === 'angel' ? 'Dejar de ser ángel' : 'Ya no necesito ayuda', x.tipo === 'angel' ? 'Las casas que adoptaste vuelven a quedar sin ángel.' : 'Se borra tu pedido de ayuda.', { si:'Confirmar' })) return;
  Store.cambiar(s => {
    s.nieve = s.nieve.filter(z => z.id !== x.id);
    if (x.tipo === 'angel') s.nieve.filter(z => z.angel === u.id).forEach(z => { notificar(s, { para:[z.userId], titulo:'Tu ángel de la nieve dejó de participar', texto:'Tu casa vuelve a la lista para que otro ángel la adopte.', icon:'snow', color:'warn', link:'nieve' }); z.angel = null; });
  });
  refrescar();
};
A['nieve-adoptar'] = el => {
  const u = yo();
  Store.cambiar(s => { const x = s.nieve.find(z => z.id === el.dataset.id); if (!x || x.angel) return; x.angel = u.id;
    notificar(s, { para:[x.userId], titulo:'Tenés un ángel de la nieve 🤍', texto:`${u.nombre} (${u.casa || ''}) va a despejar tu entrada esta temporada.`, icon:'snow', color:'ok', link:'nieve', sonido:true }); });
  toast('¡Gracias! Cuando nieve, te avisamos', 'snow');
};
A['nieve-soltar'] = async el => {
  if (!await confirmar('Soltar esta casa', 'Vuelve a la lista para que la adopte otro ángel.', { si:'Soltarla' })) return;
  Store.cambiar(s => { const x = s.nieve.find(z => z.id === el.dataset.id); if (!x) return; x.angel = null;
    notificar(s, { para:[x.userId], titulo:'Tu ángel de la nieve ya no puede', texto:'Tu casa vuelve a la lista para que otro ángel la adopte.', icon:'snow', color:'warn', link:'nieve' }); });
};
A['nieve-pedir'] = () => {
  const u = yo();
  Store.cambiar(s => { const x = s.nieve.find(z => z.id === nieveId(u.id)); if (!x) return;
    x.pedido = { fecha:hoyISO(), at:Date.now(), estado:'abierto' };
    const para = x.angel ? [x.angel] : nieveAngeles().map(a => a.userId).filter(id => id !== u.id);
    if (para.length) notificar(s, { para, titulo:`Piden ayuda con la nieve: ${u.casa || ''}`, texto:x.nota || 'Hay que despejar la entrada.', icon:'snow', color:'warn', link:'nieve', urgente:true }); });
  toast('Listo: ya les avisamos a los ángeles', 'snow');
};
A['nieve-voy'] = el => {
  const u = yo();
  Store.cambiar(s => { const x = s.nieve.find(z => z.id === el.dataset.id); if (!x) return;
    x.pedido = { ...(x.pedido || { fecha:hoyISO(), at:Date.now() }), estado:'tomado', por:u.id };
    notificar(s, { para:[x.userId], titulo:'Un ángel va en camino', texto:`${u.nombre} (${u.casa || ''}) va a despejar tu entrada.`, icon:'snow', color:'ok', link:'nieve', sonido:true }); });
};
A['nieve-listo'] = el => {
  const u = yo();
  Store.cambiar(s => { const x = s.nieve.find(z => z.id === el.dataset.id); if (!x) return;
    x.pedido = { ...(pedidoDeHoy(x) || { fecha:hoyISO(), at:Date.now() }), estado:'hecho', por:u.id, hechoAt:Date.now() };
    notificar(s, { para:[x.userId], titulo:'Tu entrada ya está despejada 🤍', texto:`Lo hizo ${u.nombre} (${u.casa || ''}).`, icon:'snow', color:'ok', link:'nieve', sonido:true }); });
  toast('¡Gracias, ángel!', 'snow');
};

/* ---------- lo que va en "Para vos" de la pizarra ---------- */
function pizarraCuidados(){
  const u = yo(); if (!u || esStaff() || esHotel()) return [];
  const out = [], hoy = hoyISO(), cm = nevoHoy();
  aLista(Store.s.nieve).filter(x => x && x.tipo === 'ayuda' && x.activo !== false).forEach(x => {
    const p = pedidoDeHoy(x), mia = x.angel === u.id, pide = p && p.estado !== 'hecho';
    const soyAngel = nieveDe(u.id)?.tipo === 'angel';
    /* Mi casa adoptada: si nevó y falta despejarla, o si pidió ayuda hoy.
       Una casa sin ángel que pidió ayuda: a todos los ángeles. */
    if ((mia && (pide || (cm && !(p && p.estado === 'hecho')))) || (pide && !x.angel && soyAngel))
      out.push({ k:`nieve-${x.id}-${hoy}`, nuevo:Pizarra.nuevo(`nieve-${x.id}-${hoy}`, p?.at || Date.now()), nivel:'amarillo', icon:'snow', tag:'Para vos · nieve', at:p?.at || Date.now(),
        titulo:`Despejar la entrada de ${x.casa}`, texto:x.nota || '', a:'abrir', v:'nieve' });
  });
  return out;
}

/* ---------- el motor ---------- */
REGLAS.push({ id:'estoy-bien', n:'Estoy bien y salidas → avisar a los contactos', d:'Si alguien anotado no tocó "Estoy bien" a su hora, o no marcó que volvió de una salida, avisa a sus contactos (y a la garita si la eligió). Una hora después, si nadie lo resolvió, insiste una vez.',
  run(){ return Cuidado.revisar(); } });
REGLAS.push({ id:'nieve-angeles', n:'Nevó → avisar a los ángeles de la nieve', d:'Si cayeron 2 cm o más (o está nevando), a partir de las 7 avisa a cada ángel las casas que tiene para despejar, y a quien pidió ayuda que su ángel ya sabe.',
  run(s, hoy){
    const cm = nevoHoy(); if (!cm || new Date().getHours() < 7) return 0;
    const ayuda = nieveAyuda(); if (!ayuda.length) return 0;
    return marca(s, 'angeles-' + hoy, () => {
      const por = {}; ayuda.forEach(x => { const a = x.angel; if (a) (por[a] = por[a] || []).push(x.casa); });
      Object.entries(por).forEach(([a, casas]) => notificar(s, { para:[a], titulo:'Nevó: te toca ser ángel 🤍', texto:`Despejá la entrada de ${casas.join(', ')}. Al terminar, tocá "Listo, despejada".`, icon:'snow', color:'sky', link:'nieve', sonido:true }));
      const sin = ayuda.filter(x => !x.angel);
      if (sin.length){ const ang = nieveAngeles().map(x => x.userId); if (ang.length) notificar(s, { para:ang, titulo:`Nevó: ${plural(sin.length, 'casa necesita', 'casas necesitan')} un ángel`, texto:sin.map(x => x.casa).join(', '), icon:'snow', color:'sky', link:'nieve', sonido:true }); }
      const con = ayuda.filter(x => x.angel).map(x => x.userId);
      if (con.length) notificar(s, { para:con, titulo:'Nevó: tu ángel ya sabe', texto:'Te avisamos cuando tu entrada esté despejada.', icon:'snow', color:'ok', link:'nieve' });
    });
  } });
REGLAS.push({ id:'verano-salidas', n:'Temporada de verano → recordatorio de salidas seguras', d:'El 1.º de noviembre, diciembre, enero, febrero y marzo recuerda la guía de seguridad (kayak, montaña, navegación) y el aviso de salida.',
  run(s, hoy){
    const [, m, d] = hoy.split('-').map(Number); if (d !== 1 || ![11, 12, 1, 2, 3].includes(m) || new Date().getHours() < 10) return 0;
    const T = { 11:['Arranca la temporada de salidas', 'Kayak, montaña o navegación: repasá la guía y dejá el Aviso de salida antes de salir.'],
      12:['Kayak en el Beagle: el agua está a menos de 10 °C', 'Chaleco puesto, traje de neoprene o seco, comunicación encima y nunca solo.'],
      1:['Montaña: salí temprano y con hora de regreso', 'Los 10 esenciales en la mochila y el Aviso de salida en la app.'],
      2:['El viento en el Canal cambia en minutos', 'Mirá el pronóstico de viento antes de salir al agua y volvé apenas se levante.'],
      3:['Se acortan los días: ojo con la hora de regreso', 'Oscurece antes y refresca rápido: linterna y abrigo extra.'] }[m];
    return marca(s, 'verano-' + hoy, () => notificar(s, { para:'todos', titulo:T[0], texto:T[1], icon:'pin', color:'sky', link:'salidas', vence:finDelDia(hoy) }));
  } });
