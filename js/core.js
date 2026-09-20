/* =========================================================
   Núcleo: utilidades, datos, sesión, avisos y hojas.
   ========================================================= */
'use strict';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const uid = () => Date.now().toString(36).slice(-4) + Math.random().toString(36).slice(2, 8);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
const MIN = 60000, HORA = 3600000, DIA = 86400000;

const pad = n => String(n).padStart(2, '0');
const isoDe = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const hoyISO = () => isoDe(new Date());
const fechaDe = iso => { const [y, m, d] = iso.split('-').map(Number); return new Date(y, m - 1, d); };
const sumarDias = (iso, n) => { const d = fechaDe(iso); d.setDate(d.getDate() + n); return isoDe(d); };
const DIAS = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
const DIAS_L = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
const MESES = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
const hora = ts => new Date(ts).toLocaleTimeString('es-AR', { hour:'2-digit', minute:'2-digit', hourCycle:'h23' });
const fechaHora = ts => new Date(ts).toLocaleString('es-AR', { day:'numeric', month:'numeric', year:'numeric', hour:'2-digit', minute:'2-digit', hourCycle:'h23' });
const fechaCorta = iso => { const d = fechaDe(iso); return `${DIAS[d.getDay()]} ${d.getDate()} ${MESES[d.getMonth()]}`; };
const fechaLarga = iso => { const d = fechaDe(iso); return `${DIAS_L[d.getDay()]} ${d.getDate()} de ${MESES[d.getMonth()]}`; };
const minutosDe = hhmm => { const [h, m] = String(hhmm || '0:0').split(':').map(Number); return h * 60 + (m || 0); };
const ahoraMin = () => { const d = new Date(); return d.getHours() * 60 + d.getMinutes(); };
function relDia(iso){
  const h = hoyISO();
  if (iso === h) return 'hoy';
  if (iso === sumarDias(h, 1)) return 'mañana';
  if (iso === sumarDias(h, -1)) return 'ayer';
  return fechaCorta(iso);
}
function hace(ts){
  const m = Math.floor((Date.now() - ts) / MIN);
  if (m < 1) return 'recién';
  if (m < 60) return `hace ${m} min`;
  const h = Math.floor(m / 60); if (h < 24) return `hace ${h} h`;
  const d = Math.floor(h / 24); if (d < 7) return `hace ${d} d`;
  const f = new Date(ts); return `${f.getDate()} ${MESES[f.getMonth()]}`;
}
const plural = (n, s, p) => `${n} ${n === 1 ? s : (p || s + 's')}`;
const soloDigitos = t => String(t || '').replace(/\D/g, '');
const waLink = (tel, texto) => `https://wa.me/${soloDigitos(tel)}${texto ? '?text=' + encodeURIComponent(texto) : ''}`;
const telLink = t => 'tel:' + String(t).replace(/[^0-9+]/g, '');

const COLORES = ['#0d6b66','#2b6fb3','#7445c0','#b8325a','#b85f24','#1b8f5a','#8a5a12','#3b4fb8'];
function colorDe(s){ let h = 0; s = String(s || '?'); for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return COLORES[h % COLORES.length]; }
const inicial = n => (String(n || '?').trim()[0] || '?').toUpperCase();
function avatar(u, cls = ''){
  const n = u ? u.nombre : '?';
  if (u && u.foto) return `<span class="avatar ${cls}" style="background:center/cover url('${u.foto}')"></span>`;
  return `<span class="avatar ${cls}" style="background:${colorDe(n)}">${esc(inicial(n))}</span>`;
}

/* Achica una foto antes de guardarla: el almacenamiento del navegador es chico. */
function comprimir(file, max = 1000, q = .72){
  return new Promise((ok, mal) => {
    const r = new FileReader();
    r.onerror = () => mal(new Error('No se pudo leer el archivo'));
    r.onload = e => {
      const img = new Image();
      img.onerror = () => mal(new Error('No es una imagen'));
      img.onload = () => {
        const k = Math.min(max / img.width, max / img.height, 1);
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        ok(c.toDataURL('image/jpeg', q));
      };
      img.src = e.target.result;
    };
    r.readAsDataURL(file);
  });
}

/* =========================================================
   DATOS
   Hoy todo vive en este dispositivo (localStorage) y se
   sincroniza entre pestañas con BroadcastChannel, así se
   puede probar la guardia en una pestaña y el vecino en otra.
   Para que lo compartan todos los vecinos, Store.adaptador
   se reemplaza por uno de Firebase con la misma forma
   (ver CONECTAR.md).
   ========================================================= */
const Store = {
  KEY: 'bhc.datos.v3', SKEY: 'bhc.sesion.v3',
  s: null,           /* el estado compartido del barrio */
  sesion: null,      /* lo de este dispositivo: quién soy, preferencias */
  oyentes: [],
  bc: ('BroadcastChannel' in window) ? new BroadcastChannel('bhc') : null,

  cargar(){
    try { this.s = JSON.parse(localStorage.getItem(this.KEY)); } catch(e){ this.s = null; }
    if (!this.s || this.s.v !== 3) this.s = seed();
    migrar(this.s);
    try { this.sesion = JSON.parse(localStorage.getItem(this.SKEY)); } catch(e){ this.sesion = null; }
    if (!this.sesion) this.sesion = { userId:null, ultimaVisita:0, tema:'auto', notifsVistas:0, pendienteEmail:'' };
    /* Cada pestaña recuerda quién entró en ella: así se puede tener la
       garita en una y un vecino en otra, en el mismo equipo. */
    try { const t = sessionStorage.getItem('bhc.pestana'); if (t !== null) this.sesion.userId = t || null; } catch(e){}
    try { const m = sessionStorage.getItem('bhc.modo'); if (m !== null) this.sesion.modo = m || ''; } catch(e){}
    if (this.bc) this.bc.onmessage = e => {
      if (e.data === 'cambio'){
        try { this.s = JSON.parse(localStorage.getItem(this.KEY)); migrar(this.s); } catch(err){}
        this.avisar(true);
      }
    };
    /* Otra pestaña sin BroadcastChannel: el evento storage cubre el hueco. */
    window.addEventListener('storage', e => {
      if (e.key === this.KEY && e.newValue){ try { this.s = JSON.parse(e.newValue); migrar(this.s); this.avisar(true); } catch(err){} }
    });
  },
  guardar(){
    try {
      localStorage.setItem(this.KEY, JSON.stringify(this.s));
    } catch(e){
      toast('El dispositivo se quedó sin espacio. Borrá publicaciones con fotos viejas.', 'alert');
      return false;
    }
    if (this.bc) this.bc.postMessage('cambio');
    if (typeof Nube !== 'undefined' && Nube.activa()) Nube.guardar();
    return true;
  },
  guardarSesion(){
    try { sessionStorage.setItem('bhc.pestana', this.sesion.userId || ''); } catch(e){}
    /* El modo también es de la pestaña: así se puede tener abierta la
       Administración en una y el mismo usuario como vecino en otra. */
    try { sessionStorage.setItem('bhc.modo', this.sesion.modo || ''); } catch(e){}
    try { localStorage.setItem(this.SKEY, JSON.stringify(this.sesion)); } catch(e){}
  },
  /* Toda escritura pasa por acá: cambia, guarda y redibuja. */
  cambiar(fn){ fn(this.s); this.guardar(); this.avisar(false); },
  avisar(remoto){ this.oyentes.forEach(f => f(remoto)); },
  alCambiar(f){ this.oyentes.push(f); },
};

function migrar(s){
  const def = { users:[], posts:[], msgs:[], privados:[], pases:[], llegadas:[], paquetes:[], bitacora:[], reservas:[],
    bloqueos:[], avisos:[], correos:[], peticiones:[], auditoria:[], obras:[], dms:[], viajes:[], infracciones:[], proveedores:[],
    gastos:[], liquidaciones:[], pagos:[], recibos:[], impuestos:[], cruceros:[], reclamos:[], votaciones:[], sos:[], documentos:[], notifs:[], compras:[], solicitudesPase:[], promos:[] };
  for (const k in def) if (!Array.isArray(s[k])) s[k] = def[k];
  /* Lo que es propio del barrio vive en los datos y lo edita la Administración. */
  if (!Array.isArray(s.amenities) || !s.amenities.length) s.amenities = JSON.parse(JSON.stringify(AMENITIES));
  if (!Array.isArray(s.agenda)) s.agenda = agendaInicial();
  if (!Array.isArray(s.temporadas)) s.temporadas = JSON.parse(JSON.stringify(TEMPORADAS));
  if (!Array.isArray(s.feriados)) s.feriados = JSON.parse(JSON.stringify(FERIADOS));
  /* Antes los feriados nacionales estaban escritos a mano, año por año, y se
     desactualizaban solos. Ahora los calcula js/calendario.js: los que
     quedaron guardados de esa época se descartan, y solo se conserva lo que
     no se puede calcular (lo provincial, lo municipal y los puentes). */
  if (s.feriadosV !== 2){
    const esPuente = f => /tur[ií]stic|puente/i.test(f.nombre || '');
    const esProvincial = f => ['provincial','municipal'].includes(f.ambito) || /provincia|fueguin|ushuaia/i.test(f.nombre || '');
    s.feriados = s.feriados.filter(f => f && f.fecha && (esPuente(f) || esProvincial(f))).map(f => ({
      ...f,
      ambito: f.ambito || (esPuente(f) ? 'nacional' : /ushuaia/i.test(f.nombre) ? 'municipal' : 'provincial'),
      tipo: f.tipo || (esPuente(f) ? 'puente turístico' : 'inamovible'),
      laborable: esPuente(f) ? true : f.laborable === true,
      aConfirmar: f.aConfirmar !== false,
      nombre: String(f.nombre || '').replace(/\s*\(provincial, a confirmar\)/i, '').replace(/^.*·\s*/, m => /ushuaia/i.test(f.nombre) ? '' : m),
    }));
    FERIADOS.forEach(d => { if (!s.feriados.some(f => f.fecha === d.fecha && f.ambito === d.ambito)) s.feriados.push(JSON.parse(JSON.stringify(d))); });
    s.feriadosV = 2;
  }
  if (!Array.isArray(s.eventosCiudad)) s.eventosCiudad = eventosCiudadIniciales();
  if (!Array.isArray(s.cruceros)) s.cruceros = [];
  if (!Array.isArray(s.avistamientos)) s.avistamientos = [];
  if (!Array.isArray(s.contactos)) s.contactos = JSON.parse(JSON.stringify(CONTACTOS));
  if (!Array.isArray(s.descargas)) s.descargas = JSON.parse(JSON.stringify(DESCARGAS));
  /* Padrón con nombres de propietarios: se importa desde Administración. */
  if (!Array.isArray(s.padron)) s.padron = [];
  if (!s.motorLog || typeof s.motorLog !== 'object') s.motorLog = {};
  s.config = Object.assign({}, CONFIG_BASE, s.config || {});
}

const CONFIG_BASE = {
  nombre: 'Bahía Cauquén',
  ciudad: 'Ushuaia, Tierra del Fuego',
  domicilio: 'Los Ñires 3333, Ushuaia',
  cuit: '30-71010005-1',
  garitaTel: '',
  adminEmail: 'barriobahiacauquen@gmail.com',
  adminTel: '2901446911',
  cbu: '0070346620000001759042',
  alias: 'bahia.cauquen',
  cuenta: 'Cuenta Corriente 1759-0 346-4 · Banco Galicia',
  mapa: 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent('Barrio Bahía Cauquén, Ushuaia'),
  casas: 152,
  recoleccion: { 1:'Húmedos', 2:'Reciclables', 3:'Húmedos', 4:'Reciclables', 5:'Húmedos' },
  recoleccionHora: '08:00',
  expensasUrl: 'https://www.octavo-piso.com.ar/users/sign_in',
  expensasVence: 10,
  /* --- expensas propias del barrio --- */
  exp: {
    vto1: 10,                 /* día del primer vencimiento */
    vto2: 21,                 /* día del segundo vencimiento */
    recargo2: 1.5,            /* % que se suma en el segundo vencimiento */
    interesMensual: 3,        /* % mensual sobre lo que quedó impago (a confirmar con la administración) */
    fondoFijo: 5000,          /* Fondo de Infraestructura, monto igual para cada lote */
    mpLink: '',               /* enlace de Mercado Pago, si algún día se usa */
    reciboNro: 0,             /* numerador de recibos */
    contador: '',             /* correo del contador */
    condicion: 'Exento',      /* condición frente a ARCA */
    iibb: '',                 /* número de Ingresos Brutos, si tiene */
    empleados: false,         /* ¿el barrio tiene personal propio? (define si va el F.931) */
  },
  voluminosos: '',            /* próxima fecha de retiro de voluminosos (AAAA-MM-DD) */
  voluminososDetalle: 'Muebles, colchones, electrodomésticos y chatarra. Se dejan en el frente la noche anterior.',
  dea: 'Garita de acceso (a confirmar)',
  vuelosProxy: '',            /* opcional: un Worker que reenvía ADS-B para ver los aviones en vivo.
                                 El tablero de arribos y partidas ya no lo necesita. */
  promosUrl: '',              /* opcional: un Worker que lee las promociones del hotel y las
                                 devuelve en JSON. Sin esto, se cargan a mano en Contenido. */
  datosDias: 90,              /* los datos de visitas se borran solos a los N días (Ley 25.326) */
  obraHorario: 'Lunes a viernes de 8 a 18 h · sábados de 9 a 13 h',
  silencio: '22 a 8 h',
};

const AMENITIES = [
  { id:'quincho', nombre:'Quincho', icon:'flame', color:'wood', invitadosMax:40,
    franjas:[['12:00','17:00'],['19:30','01:00']], reglas:'Hasta 40 invitados. Se entrega limpio y con la parrilla fría. La música se baja a la 1.' },
  { id:'sum', nombre:'SUM', icon:'sofa', color:'accent', invitadosMax:30,
    franjas:[['09:00','13:00'],['14:00','18:00'],['19:00','23:30']], reglas:'Salón de usos múltiples con calefacción. Hasta 30 personas. Ideal para cumpleaños y reuniones.' },
  { id:'cancha', nombre:'Cancha', icon:'ball', color:'ok', invitadosMax:14,
    franjas:[['10:00','11:00'],['11:00','12:00'],['15:00','16:00'],['16:00','17:00'],['17:00','18:00'],['18:00','19:00']], reglas:'Turnos de una hora. Si hay nieve o hielo la administración la cierra.' },
];
const MAX_RESERVAS_FUTURAS = 2, DIAS_ANTICIPACION = 30;
const amenities = () => Store.s.amenities;
const amenity = id => Store.s.amenities.find(a => a.id === id);

/* Contactos propios del barrio: la Administración los carga. */
const CONTACTOS = [
  { id:'c1', nombre:'Garita de acceso', detalle:'Guardia las 24 h', tel:'' },
  { id:'c2', nombre:'Administración', detalle:'Lunes a viernes de 9 a 17 h', tel:'' },
  { id:'c3', nombre:'Electricista del barrio', detalle:'Urgencias eléctricas en espacios comunes', tel:'' },
];

/* Lo que se puede bajar desde la ventana Descargas. La Administración lo
   edita en Contenido → Descargas: para sumar una app alcanza con pegar su
   dirección. Las que vienen de fábrica están sin dirección hasta que
   alguien la pegue: la app no inventa enlaces. */
const DESCARGAS = [
  { id:'d1', tipo:'app', titulo:'VITALIA by Mónica Ponzio', detalle:'Seguimiento nutricional. Pegá su dirección en Contenido → Descargas.', url:'', icon:'heart', color:'ok' },
  { id:'d2', tipo:'planilla', titulo:'Modelo de planilla del padrón', detalle:'CSV con los 152 lotes y sus coeficientes, para completar los propietarios', url:'', icon:'clipboard', color:'wood' },
];

/* Temporadas de Ushuaia. Las fechas cambian por disposición provincial
   u ordenanza municipal: la Administración las confirma y edita cada año.
   desde/hasta son MM-DD; si hasta < desde, la temporada cruza el año. */
const TEMPORADAS = [
  { id:'t1', nombre:'Pesca deportiva', icon:'drop', desde:'11-01', hasta:'04-15', nota:'Con permiso provincial vigente. Fechas a confirmar con la Dirección de Pesca de Tierra del Fuego.' },
  { id:'t2', nombre:'Cubiertas con clavos permitidas', icon:'snow', desde:'04-15', hasta:'10-15', nota:'Fechas a confirmar con la ordenanza municipal vigente. Fuera del período, cambiar a cubiertas normales.' },
  { id:'t3', nombre:'Temporada de ski', icon:'snow', desde:'06-15', hasta:'09-30', nota:'Cerro Castor y centros invernales. Más tránsito en la Ruta 3 los fines de semana.' },
  { id:'t4', nombre:'Temporada de cruceros', icon:'sun', desde:'10-15', hasta:'04-15', nota:'Más movimiento en el centro y el puerto los días de recalada.' },
];

/* FERIADOS QUE NO SE PUEDEN CALCULAR.
   Los nacionales, el calendario católico y el judío los calcula
   js/calendario.js con las reglas de la Ley 27.399, la Pascua y la
   aritmética hebrea: no hace falta cargarlos ni actualizarlos.
   Acá va SOLO lo que depende de una decisión que se toma cada año:
     · lo provincial de Tierra del Fuego,
     · lo municipal de Ushuaia,
     · los "días no laborables con fines turísticos" (los puentes), que
       fija un decreto del Poder Ejecutivo para cada año.
   Vienen marcados "a confirmar": la Administración los verifica contra
   el Boletín Oficial y la ordenanza vigente, y recién ahí la app deja de
   mostrar la advertencia. Se editan en Administración → Contenido → Feriados. */
const FERIADOS = [
  { fecha:'2026-06-01', nombre:'Día de la Provincia de Tierra del Fuego', ambito:'provincial', tipo:'inamovible', laborable:false, aConfirmar:true,
    nota:'Aniversario de la provincialización (Ley 23.775). Confirmar el alcance con la ley provincial vigente.' },
  { fecha:'2026-10-12', nombre:'Aniversario de la fundación de Ushuaia', ambito:'municipal', tipo:'inamovible', laborable:false, aConfirmar:true,
    nota:'Ushuaia se fundó el 12 de octubre de 1884. Confirmar con la ordenanza municipal del año.' },
  { fecha:'2026-03-23', nombre:'Día no laborable con fines turísticos', ambito:'nacional', tipo:'puente turístico', laborable:true, aConfirmar:true,
    nota:'Los puentes los fija un decreto para cada año. Verificar en el Boletín Oficial.' },
  { fecha:'2026-07-10', nombre:'Día no laborable con fines turísticos', ambito:'nacional', tipo:'puente turístico', laborable:true, aConfirmar:true, nota:'Verificar en el Boletín Oficial.' },
  { fecha:'2026-12-07', nombre:'Día no laborable con fines turísticos', ambito:'nacional', tipo:'puente turístico', laborable:true, aConfirmar:true, nota:'Verificar en el Boletín Oficial.' },
  { fecha:'2027-06-01', nombre:'Día de la Provincia de Tierra del Fuego', ambito:'provincial', tipo:'inamovible', laborable:false, aConfirmar:true, nota:'' },
  { fecha:'2027-10-12', nombre:'Aniversario de la fundación de Ushuaia', ambito:'municipal', tipo:'inamovible', laborable:false, aConfirmar:true, nota:'' },
].map((f, i) => ({ id:'fer' + i, ...f }));

/* Eventos típicos de la ciudad. Las fechas exactas se confirman cada año. */
function eventosCiudadIniciales(){
  const y = new Date().getFullYear();
  return [
    { id:'ev1', titulo:'Fiesta de la Noche Más Larga', tipo:'Festival', fecha:`${y}-06-20`, hora:'', lugar:'Ushuaia', link:'', nota:'Alrededor del solsticio de invierno. Fecha a confirmar.' },
    { id:'ev2', titulo:'Marcha Blanca', tipo:'Deporte', fecha:`${y}-08-15`, hora:'', lugar:'Valle de Tierra Mayor', link:'', nota:'Travesía de esquí de fondo. Fecha a confirmar.' },
    { id:'ev3', titulo:'Aniversario de Ushuaia', tipo:'Acto', fecha:`${y}-10-12`, hora:'', lugar:'Centro', link:'', nota:'Actos y desfile.' },
  ];
}
function agendaInicial(){
  const out = [];
  const fuente = typeof AGENDA !== 'undefined' ? AGENDA : {};
  for (const cat in fuente) fuente[cat].forEach(it => out.push({ id:'ag' + out.length, categoria:cat, nombre:it.n, detalle:it.d, tel:it.t }));
  return out;
}

/* =========================================================
   SESIÓN Y ROLES
   ========================================================= */
const yo = () => Store.s && Store.sesion.userId ? Store.s.users.find(u => u.id === Store.sesion.userId && u.estado === 'aprobado') : null;
const usuario = id => Store.s.users.find(u => u.id === id);
const nombreDe = id => { const u = usuario(id); return u ? u.nombre : 'Vecino/a'; };
/* =========================================================
   LOS DOS BRAZOS DE LA APP
   -------------------------------------------------------
   Quien administra el barrio también es vecino de su lote. Si las dos
   cosas se mezclan en la misma pantalla, no se entiende nunca desde qué
   lugar está mirando: por eso al entrar elige, y puede cambiar cuando
   quiera desde su cuenta.

   En MODO VECINO la app se comporta como para cualquier otro: no ve
   inscripciones, ni gastos, ni la bitácora, y las alertas le llegan como
   a un vecino. En MODO ADMINISTRACIÓN tiene todo el panel.

   Esto existe SOLO para el rol admin. La guardia y los vecinos tienen un
   solo modo y ni siquiera ven la opción.
   ========================================================= */
/* Tiene los dos sombreros solo quien administra Y además es dueño de un
   lote. Una cuenta de administración pura (la del estudio, por ejemplo) no
   tiene vista de vecino que mostrar, así que ni siquiera ve la opción. */
const puedeAdministrar = () => { const u = yo(); return u?.rol === 'admin' && /^Lote\s/i.test(u.casa || ''); };
const modoActivo = () => { const u = yo(); if (!u) return ''; return puedeAdministrar() ? (Store.sesion.modo || 'admin') : u.rol; };
const esAdmin = () => yo()?.rol === 'admin' && modoActivo() !== 'vecino';
const esGuardia = () => yo()?.rol === 'guardia';
const esStaff = () => esAdmin() || esGuardia();
const vecinosAprobados = () => Store.s.users.filter(u => u.estado === 'aprobado' && u.rol === 'vecino');
const casasRegistradas = () => new Set(Store.s.users.filter(u => u.estado === 'aprobado' && u.casa && u.rol === 'vecino').map(u => u.casa)).size;
const totalLotes = () => (typeof LOTES !== 'undefined' ? lotesVecinos().length : Store.s.config.casas);
const loteDe = u => typeof LOTES !== 'undefined' ? LOTES.find(l => 'Lote ' + l.lote === u.casa) : null;
const propietarioDe = casa => (Store.s.padron.find(p => 'Lote ' + p.lote === casa) || {}).propietario || '';

function generarClave(pref = 'VEC'){
  const c = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let r = ''; for (let i = 0; i < 4; i++) r += c[Math.floor(Math.random() * c.length)];
  return `${pref}-${r}`;
}
function codigoPase(){
  const usados = new Set(Store.s.pases.map(p => p.codigo));
  let c; do { c = String(Math.floor(100000 + Math.random() * 900000)); } while (usados.has(c));
  return c;
}

/* =========================================================
   AVISOS (centro de notificaciones)
   para: id de usuario, 'todos', 'rol:guardia', 'rol:admin',
   'staff' o una lista de esos.
   ========================================================= */
function notificar(s, { para, titulo, texto = '', icon = 'bell', color = 'brand', link = '', urgente = false, sonido = false }){
  s.notifs.unshift({ id: uid(), para: [].concat(para), titulo, texto, icon, color, link, urgente, sonido: sonido || urgente, de: Store.sesion.userId, at: Date.now(), leidas: [] });
  if (s.notifs.length > 400) s.notifs.length = 400;
}
function meToca(n, u = yo()){
  if (!u || n.de === u.id) return false;
  return n.para.some(p => p === 'todos' || p === u.id || p === 'rol:' + u.rol || (p === 'staff' && (u.rol === 'admin' || u.rol === 'guardia')));
}
const misNotifs = () => { const u = yo(); return u ? Store.s.notifs.filter(n => meToca(n, u)) : []; };
const noLeidas = () => { const u = yo(); return misNotifs().filter(n => !n.leidas.includes(u.id)); };

/* Aviso del sistema operativo cuando la app está en segundo plano
   (en esta versión, mientras esté abierta en alguna pestaña). */
let ultimoAvisoSO = Date.now();
function avisosDelSistema(){
  const u = yo(); if (!u) return;
  const nuevas = misNotifs().filter(n => n.at > ultimoAvisoSO && !n.leidas.includes(u.id));
  ultimoAvisoSO = Date.now();
  /* Lo que escribe la guardia o la Administración suena y se anuncia arriba. */
  const conSonido = nuevas.filter(n => n.sonido);
  if (conSonido.length){
    if (!Store.sesion.sinSonido) campanita(conSonido.some(n => n.urgente));
    toast(conSonido[0].titulo, conSonido[0].icon);
  }
  if (!('Notification' in window) || Notification.permission !== 'granted' || !document.hidden) return;
  nuevas.slice(0, 3).forEach(n => {
    try { new Notification(n.titulo, { body: n.texto, icon: 'icons/icon-192.png', tag: n.id, requireInteraction: n.urgente }); } catch(e){}
  });
}

/* =========================================================
   TOASTS Y HOJAS
   ========================================================= */
function toast(msg, icon = 'check'){
  const box = $('#toasts');
  const el = document.createElement('div');
  el.className = 'toast';
  el.innerHTML = `${I(icon)}<span>${esc(msg)}</span>`;
  box.appendChild(el);
  setTimeout(() => { el.classList.add('fuera'); setTimeout(() => el.remove(), 260); }, 2800);
}

/* Una sola hoja reutilizable. El contenido es HTML; los formularios
   de adentro se manejan con data-f como el resto de la app. */
function hoja(titulo, html, { ancho } = {}){
  const d = $('#hoja');
  $('#hojaTitulo').textContent = titulo;
  $('#hojaCuerpo').innerHTML = html;
  d.style.maxWidth = ancho || '';
  if (!d.open) d.showModal();
  const f = $('#hojaCuerpo input:not([type=hidden]):not([type=checkbox]):not([type=radio]), #hojaCuerpo textarea');
  if (f && matchMedia('(pointer:fine)').matches) setTimeout(() => f.focus(), 60);
  return d;
}
const cerrarHoja = () => { const d = $('#hoja'); if (d.open) d.close(); };
function confirmar(titulo, texto, { si = 'Confirmar', peligro = false } = {}){
  return new Promise(ok => {
    hoja(titulo, `<p style="margin:0 0 18px;color:var(--ink-2)">${texto}</p>
      <div class="btns"><button class="btn btn-sec" data-r="0">Cancelar</button><button class="btn ${peligro ? 'btn-danger' : 'btn-pri'}" data-r="1">${esc(si)}</button></div>`);
    const d = $('#hoja');
    const fin = v => { d.removeEventListener('click', clic); d.removeEventListener('close', cerro); ok(v); };
    const clic = e => { const b = e.target.closest('[data-r]'); if (b){ cerrarHoja(); fin(b.dataset.r === '1'); } };
    const cerro = () => fin(false);
    d.addEventListener('click', clic);
    /* El listener de cierre se engancha en el ciclo siguiente: si la hoja
       venía de cerrarse, ese cierre viejo cancelaba la pregunta sola. */
    setTimeout(() => d.addEventListener('close', cerro, { once:true }), 0);
  });
}
async function copiar(t){
  try { await navigator.clipboard.writeText(t); toast('Copiado', 'copy'); }
  catch(e){ prompt('Copiá el texto:', t); }
}
async function compartir(texto, titulo = 'Bahía Cauquén'){
  if (navigator.share){ try { await navigator.share({ title: titulo, text: texto }); return; } catch(e){ if (e.name === 'AbortError') return; } }
  window.open('https://wa.me/?text=' + encodeURIComponent(texto), '_blank', 'noopener');
}

/* QR: la librería se pide recién cuando hace falta. Sin internet
   queda el código de seis dígitos, que en la garita alcanza. */
let qrLib = null;
function cargarQR(){
  if (window.qrcode) return Promise.resolve(window.qrcode);
  if (qrLib) return qrLib;
  qrLib = new Promise(ok => {
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js';
    s.onload = () => ok(window.qrcode || null);
    s.onerror = () => { qrLib = null; ok(null); };
    document.head.appendChild(s);
  });
  return qrLib;
}
async function pintarQR(el, texto){
  const q = await cargarQR();
  if (!el) return;
  if (!q){ el.innerHTML = `<p class="muted small center" style="margin:30px 0">Sin conexión para dibujar el QR.<br>El código numérico alcanza.</p>`; return; }
  const qr = q(0, 'M'); qr.addData(texto); qr.make();
  el.innerHTML = qr.createSvgTag({ cellSize: 6, margin: 0, scalable: true });
}

/* =========================================================
   FOTOS: viven en el dispositivo, no en la base compartida.
   La foto entera se guarda en IndexedDB de este equipo; a los
   datos compartidos solo va { fotoId, mini }, una miniatura de
   48 px (1–2 KB) para que los demás vean de qué se trata.
   Cuando haya servidor, Fotos.relevo puede pasar la foto a los
   otros equipos como un envío de ida (se baja, se guarda en su
   IndexedDB y el servidor la borra), sin ocupar la base.
   ========================================================= */
const Fotos = {
  db: null, cache: new Map(), relevo: null,
  abrir(){
    if (this.db) return this.db;
    this.db = new Promise(ok => {
      try {
        const r = indexedDB.open('bhc-fotos', 1);
        r.onupgradeneeded = () => r.result.createObjectStore('fotos');
        r.onsuccess = () => ok(r.result);
        r.onerror = () => ok(null);
      } catch(e){ ok(null); }
    });
    return this.db;
  },
  async poner(id, dato){
    this.cache.set(id, dato);
    const db = await this.abrir(); if (!db) return;
    await new Promise(ok => { const t = db.transaction('fotos', 'readwrite'); t.objectStore('fotos').put(dato, id); t.oncomplete = ok; t.onerror = ok; });
  },
  async sacar(id){
    if (this.cache.has(id)) return this.cache.get(id);
    const db = await this.abrir(); if (!db) return null;
    const v = await new Promise(ok => { const r = db.transaction('fotos').objectStore('fotos').get(id); r.onsuccess = () => ok(r.result || null); r.onerror = () => ok(null); });
    if (!v && this.relevo){ try { const b = await this.relevo.bajar(id); if (b){ await this.poner(id, b); return b; } } catch(e){} }
    if (v) this.cache.set(id, v);
    return v;
  },
  async borrar(id){
    this.cache.delete(id);
    const db = await this.abrir(); if (!db) return;
    db.transaction('fotos', 'readwrite').objectStore('fotos').delete(id);
  },
  /* De un archivo del celular a { fotoId, mini } listo para guardar. */
  async desdeArchivo(file, max = 1280){
    const grande = await comprimir(file, max, .8);
    const mini = await achicarDato(grande, 48, .5);
    const fotoId = 'f' + uid();
    await this.poner(fotoId, grande);
    if (this.relevo){ try { await this.relevo.subir(fotoId, grande); } catch(e){} }
    return { fotoId, mini };
  },
  /* Después de cada dibujo: cambia la miniatura por la foto local. */
  async hidratar(raiz = document){
    for (const el of $$('[data-foto]', raiz)){
      const id = el.dataset.foto; if (!id || el.dataset.ok) continue;
      const v = await this.sacar(id);
      if (v){ el.style.backgroundImage = `url('${v}')`; el.dataset.ok = '1'; el.classList.remove('solo-mini'); }
      else el.classList.add('solo-mini');
    }
  },
};
function achicarDato(dato, max, q){
  return new Promise(ok => {
    const img = new Image();
    img.onload = () => {
      const k = Math.min(max / img.width, max / img.height, 1);
      const c = document.createElement('canvas');
      c.width = Math.max(1, Math.round(img.width * k)); c.height = Math.max(1, Math.round(img.height * k));
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      ok(c.toDataURL('image/jpeg', q));
    };
    img.onerror = () => ok('');
    img.src = dato;
  });
}
/* HTML de una foto: arranca con la miniatura y se hidrata sola. */
const fotoHTML = (f, cls = 'foto') => f && f.fotoId
  ? `<div class="${cls}" data-foto="${esc(f.fotoId)}" data-a="ver-foto" style="background-image:url('${f.mini || ''}')"></div>` : '';

/* Registros de rutas (R), acciones de clic (A) y formularios (F).
   Cada archivo de vistas agrega lo suyo. */
const R = {}, A = {}, F = {};
const ir = ruta => { if (location.hash !== '#/' + ruta) location.hash = '#/' + ruta; else render(); };
const miCasa = () => yo()?.casa || '';
const autorVisible = id => { const u = usuario(id); if (id === 'sistema') return { nombre:'Asistente del barrio', casa:'Automático' }; return u || { nombre:'Ex vecino/a', casa:'' }; };

/* =========================================================
   CORREO
   Un navegador no puede mandar mails: se los pide a un programa
   chico en Google Apps Script (apps-script/Codigo.gs), igual que ASHA.
   Si no está configurado, el correo queda en la bandeja de salida
   de la Administración para mandarlo a mano. No se pierde nada.
   ========================================================= */
const Correo = {
  configurado(){ const c = Store.s.config; return !!(c.correoUrl && c.correoClave); },
  plantilla(titulo, cuerpoHtml, boton){
    const c = Store.s.config;
    return `<div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;color:#0f1f1e;line-height:1.55">
      <div style="background:linear-gradient(140deg,#0d6b66,#0b3c47);color:#fff;padding:22px 24px;border-radius:14px 14px 0 0">
        <div style="font-size:12px;letter-spacing:.1em;text-transform:uppercase;opacity:.8">Barrio ${esc(c.nombre)}</div>
        <div style="font-size:21px;font-weight:800;margin-top:4px">${esc(titulo)}</div></div>
      <div style="border:1px solid #e2e8e6;border-top:0;padding:22px 24px;border-radius:0 0 14px 14px">${cuerpoHtml}
      ${boton ? `<p style="margin:24px 0"><a href="${boton.url}" style="background:#0d6b66;color:#fff;padding:13px 22px;border-radius:10px;text-decoration:none;font-weight:700;display:inline-block">${esc(boton.texto)}</a></p>
      <p style="font-size:12px;color:#6c7d7a">Si el botón no funciona, copiá esta dirección:<br><span style="font-family:monospace;word-break:break-all">${esc(boton.url)}</span></p>` : ''}
      <hr style="border:0;border-top:1px solid #e2e8e6;margin:22px 0">
      <p style="font-size:11.5px;color:#6c7d7a">Tus datos se usan solo para la vida del barrio y el control de acceso (Ley 25.326). Podés pedir verlos, corregirlos o borrarlos escribiendo a la Administración.</p></div></div>`;
  },
  /* Registra el correo y, si se puede, lo manda. Devuelve true si salió. */
  async enviar({ para, asunto, html, tipo }){
    if (!para) return false;
    const reg = { id:uid(), para, asunto, html, tipo, at:Date.now(), estado:'pendiente' };
    Store.cambiar(s => { s.correos.unshift(reg); if (s.correos.length > 300) s.correos.length = 300; });
    if (!this.configurado()) return false;
    try {
      const r = await fetch(Store.s.config.correoUrl, { method:'POST', headers:{ 'Content-Type':'text/plain;charset=utf-8' },
        body: JSON.stringify({ para, asunto, html, tipo, clave: Store.s.config.correoClave }) }).then(r => r.json());
      Store.cambiar(s => { const x = s.correos.find(c => c.id === reg.id); if (x) x.estado = r && r.ok ? 'enviado' : 'error'; });
      return !!(r && r.ok);
    } catch(e){
      Store.cambiar(s => { const x = s.correos.find(c => c.id === reg.id); if (x) x.estado = 'error'; });
      return false;
    }
  },
};
const urlApp = (hash = '') => location.origin + location.pathname + (hash ? '#/' + hash : '');

/* Dos notas suaves: "ding-dong" para avisos; tres agudas si es urgente.
   Suena por el mismo canal que el SOS, que se despierta con el primer toque
   de la persona: si no, el navegador deja los avisos mudos. */
function campanita(urgente = false){
  const notas = urgente ? [[988, 0, .5], [988, .18, .5], [988, .36, .5]] : [[880, 0, .5], [660, .22, .5]];
  if (typeof Sonido !== 'undefined') { Sonido.tocar(notas, 'sine', .18); Sonido.vibrar(urgente ? [200, 100, 200] : 120); }
}
