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
  // Pasadas las 24 h se cuentan días de calendario, no bloques de 24 h:
  // algo del 25 a las 9:37 visto el 27 a las 8:00 fue "hace 2 días", no 1.
  const a = new Date(ts), b = new Date(); a.setHours(0, 0, 0, 0); b.setHours(0, 0, 0, 0);
  const d = Math.round((b - a) / DIA);
  if (d === 1) return 'ayer';
  if (d < 7) return `hace ${d} días`;
  const f = new Date(ts); return `${f.getDate()} ${MESES[f.getMonth()]}`;
}
const plural = (n, s, p) => `${n} ${n === 1 ? s : (p || s + 's')}`;
const soloDigitos = t => String(t || '').replace(/\D/g, '');
/* WhatsApp necesita el número internacional (549 + característica sin 0 +
   número sin 15). Antes se mandaba tal cual se escribió ("2901 15 123456")
   y WhatsApp no encontraba el chat. Un número con "+" adelante (de otro
   país) va como está; uno de 6 a 8 cifras se toma de Ushuaia (2901). */
function waNumero(tel){
  const t = String(tel || '').trim(); let d = soloDigitos(t);
  if (!d || t.startsWith('+') && !d.startsWith('54')) return d;
  if (d.startsWith('549')) return d;
  if (d.startsWith('54')) d = d.slice(2);
  d = d.replace(/^0+/, '');
  if (d.length === 12) for (const k of [4, 3, 2]) if (d.slice(k, k + 2) === '15'){ d = d.slice(0, k) + d.slice(k + 2); break; }
  if (d.length >= 6 && d.length <= 8) d = '2901' + (d.length === 8 && d.startsWith('15') ? d.slice(2) : d);
  return d.length === 10 ? '549' + d : d;
}
const waLink = (tel, texto) => `https://wa.me/${waNumero(tel)}${texto ? '?text=' + encodeURIComponent(texto) : ''}`;
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
/* FOTOS MÁS LIVIANAS (pedido de Claudio, 12-10-2026; idea de
   browser-image-compression, 1.7k★, MIT: solo la idea, el código es propio).
   Donde el navegador sabe guardar en WebP (Chrome, Android, Edge, Firefox y
   los iPhone nuevos), las fotos se guardan en WebP: con la misma calidad a la
   vista pesan cerca de la mitad que en JPG, suben rápido con poca señal y la
   base dura más. Donde no sabe, siguen en JPG como siempre. Todos los
   teléfonos que pueden abrir la app pueden mostrar WebP. */
const WEBP_OK = (() => { try { const c = document.createElement('canvas'); c.width = c.height = 2; return c.toDataURL('image/webp', .8).startsWith('data:image/webp'); } catch(e){ return false; } })();
const aImagen = (c, q) => WEBP_OK ? c.toDataURL('image/webp', Math.min(.86, q)) : c.toDataURL('image/jpeg', q);
/* Qué es una foto guardada, para el nombre del archivo al bajarla. */
const tipoDeDato = d => (/^data:([^;,]+)/.exec(String(d || '')) || [])[1] || 'image/jpeg';
const extDeTipo = t => ({ 'image/webp':'webp', 'image/png':'png', 'image/jpeg':'jpg', 'application/pdf':'pdf' })[t] || 'jpg';
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
        ok(aImagen(c, q));
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
/* LA PRUEBA (?local) GUARDA APARTE (12-10-2026). La app de prueba y la de
   verdad usaban el mismo lugar del navegador: abrir la prueba (o
   expensas.html, que la lleva adentro) en el mismo teléfono donde se usa la
   app real podía mezclar los datos de ejemplo con la sesión y la copia de
   la app real. Ahora la prueba tiene sus propias llaves y su propio canal. */
const MODO_PRUEBA = /[?&]local\b/.test(location.search);
const llavePrueba = k => MODO_PRUEBA ? k.replace(/^bhc\./, 'bhc.prueba.') : k;
const Store = {
  KEY: llavePrueba('bhc.datos.v3'), SKEY: llavePrueba('bhc.sesion.v3'),
  s: null,           /* el estado compartido del barrio */
  sesion: null,      /* lo de este dispositivo: quién soy, preferencias */
  oyentes: [],
  bc: ('BroadcastChannel' in window) ? new BroadcastChannel(MODO_PRUEBA ? 'bhc-prueba' : 'bhc') : null,

  cargar(){
    try { this.s = JSON.parse(localStorage.getItem(this.KEY)); } catch(e){ this.s = null; }
    if (!this.s || this.s.v !== 3) this.s = seed();
    migrar(this.s);
    try { this.sesion = JSON.parse(localStorage.getItem(this.SKEY)); } catch(e){ this.sesion = null; }
    if (!this.sesion) this.sesion = { userId:null, ultimaVisita:0, tema:'auto', notifsVistas:0, pendienteEmail:'' };
    /* Cada pestaña recuerda quién entró en ella: así se puede tener la
       garita en una y un vecino en otra, en el mismo equipo. */
    try { const t = sessionStorage.getItem(llavePrueba('bhc.pestana')); if (t !== null) this.sesion.userId = t || null; } catch(e){}
    try { const m = sessionStorage.getItem(llavePrueba('bhc.modo')); if (m !== null) this.sesion.modo = m || ''; } catch(e){}
    if (this.bc) this.bc.onmessage = e => {
      if (e.data === 'cambio'){
        try { this.deOtraPestana(JSON.parse(localStorage.getItem(this.KEY))); } catch(err){}
        this.avisar(true);
      }
    };
    /* Otra pestaña sin BroadcastChannel: el evento storage cubre el hueco. */
    window.addEventListener('storage', e => {
      if (e.key === this.KEY && e.newValue){ try { this.deOtraPestana(JSON.parse(e.newValue)); this.avisar(true); } catch(err){} }
    });
  },
  /* Con la base del barrio, la configuración de esta pestaña es la que
     bajó de la nube: la copia de otra pestaña (que puede ser vieja) no la
     reemplaza. */
  /* LO QUE LLEGA DE OTRA PESTAÑA (arreglado el 08-10-2026)
     Con la base del barrio, cada pestaña escucha la nube por su cuenta: lo
     que vive en la nube NO se toma de la copia de otra pestaña. Antes sí, y
     una pestaña abierta desde una versión vieja (que no conocía los
     correos) le pasaba a la nueva una lista vacía: la nueva creía que el
     correo se había borrado y lo borraba de la base. El camión de correos
     daba una vuelta y desaparecía en todas las pantallas. */
  deOtraPestana(nuevo){
    if (!nuevo || typeof nuevo !== 'object') return;
    const cfg = this.cfgPropia(); migrar(nuevo);
    if (typeof Nube !== 'undefined' && Nube.activa() && this.s){
      [...Nube.ZONAS.barrio, ...Nube.ZONAS.privado, ...Nube.ZONAS.staff, ...Nube.ZONAS.hotel, 'notifs', 'motorLog'].forEach(c => { if (c in this.s) nuevo[c] = this.s[c]; });
    }
    this.s = nuevo; if (cfg) this.s.config = cfg;
  },
  cfgPropia(){ return typeof Nube !== 'undefined' && Nube.activa() && Nube.configLista && this.s ? this.s.config : null; },
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
    try { sessionStorage.setItem(llavePrueba('bhc.pestana'), this.sesion.userId || ''); } catch(e){}
    /* El modo también es de la pestaña: así se puede tener abierta la
       Administración en una y el mismo usuario como vecino en otra. */
    try { sessionStorage.setItem(llavePrueba('bhc.modo'), this.sesion.modo || ''); } catch(e){}
    try { localStorage.setItem(this.SKEY, JSON.stringify(this.sesion)); } catch(e){}
  },
  /* Toda escritura pasa por acá: cambia, guarda y redibuja. */
  cambiar(fn){ fn(this.s); this.guardar(); this.avisar(false); },
  avisar(remoto){ this.oyentes.forEach(f => f(remoto)); },
  alCambiar(f){ this.oyentes.push(f); },
};

function migrar(s){
  const def = { users:[], posts:[], privados:[], pases:[], llegadas:[], paquetes:[], bitacora:[],
    avisos:[], correos:[], peticiones:[], auditoria:[], obras:[], dms:[], viajes:[], infracciones:[], proveedores:[],
    gastos:[], liquidaciones:[], pagos:[], recibos:[], impuestos:[], cruceros:[], reclamos:[], votaciones:[], sos:[], documentos:[], notifs:[], compras:[], solicitudesPase:[], promos:[], comunicados:[], camion:[], mensajeria:[], alertas:[], frecuentes:[], asientos:[], puntos:[], pasos:[], rondaCodigos:[],
    hotelInfo:[], hotelVans:[], hotelMovs:[], hotelViajes:[], hotelEventos:[], hotelHuespedes:[], hotelProv:[], hotelPromos:[], hotelLiqs:[],
    /* 08-10: el resumen de cada liquidación y las cuotas de cada lote (ExpLote, js/v-expensas.js) */
    liqResumen:[], cuotasLote:[], morosos:[],
    cosas:[], nieve:[], casaTareas:[], ausencias:[],
    /* 07-10: supervisión de la guardia (js/v-supervisor.js) */
    alertasSup:[], vistos:[] };
  for (const k in def) if (!Array.isArray(s[k])) s[k] = def[k];
  /* El chat vecinal y las reservas de espacios comunes se sacaron el 29-09-2026:
     lo que haya quedado guardado en este equipo se borra al abrir la app. */
  ['msgs', 'reservas', 'bloqueos', 'amenities'].forEach(k => { delete s[k]; });
  /* Lo que es propio del barrio vive en los datos y lo edita la Administración. */
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
  /* Lo que viene de fábrica y el equipo tenía guardado sin dirección (la
     Vitalia, antes de tener su enlace) se completa con la versión nueva. */
  DESCARGAS.forEach(f => { const x = s.descargas.find(d => d && d.id === f.id);
    if (!x) s.descargas.push(JSON.parse(JSON.stringify(f))); else if (!x.url && f.url) Object.assign(x, f); });
  /* Padrón con nombres de propietarios: se importa desde Administración. */
  if (!Array.isArray(s.padron)) s.padron = [];
  /* La guía del barrio (quién vive en cada lote) y los teléfonos de cada lote (08-10-2026). */
  if (!Array.isArray(s.guia)) s.guia = [];
  if (!Array.isArray(s.telefonos)) s.telefonos = [];
  if (!s.motorLog || typeof s.motorLog !== 'object') s.motorLog = {};
  /* En la demo (?local) hay un hotel de muestra para probar su portal. */
  if (typeof hotelDemo === 'function' && !(typeof Nube !== 'undefined' && Nube.activa())) hotelDemo(s);
  /* Y una cuenta de supervisión de la guardia (js/v-supervisor.js). */
  if (typeof supervisionDemo === 'function' && !(typeof Nube !== 'undefined' && Nube.activa())) supervisionDemo(s);
  s.config = Object.assign({}, CONFIG_BASE, s.config || {});
}

/* LOS DÍAS DEL CAMIÓN
   De fábrica venían de lunes a viernes, y el barrio los tiene martes,
   jueves y sábado (SEINCO). Si la Administración nunca los cambió (siguen
   exactamente los de fábrica viejos), se toman martes, jueves y sábado.
   No se reescribe la configuración desde acá: un vecino no puede guardarla
   y el guardado entero fallaría. Al guardar Ajustes queda lo que se cargue. */
const RECOLECCION_VIEJA = { 1:'Húmedos', 2:'Reciclables', 3:'Húmedos', 4:'Reciclables', 5:'Húmedos' };
/* Lo que hace SEINCO en el barrio (dicho por Claudio el 25-09-2026): martes
   y jueves a la mañana se llevan todos los residuos; los sábados, los
   voluminosos. Es lo que se usa mientras la configuración siga siendo una de
   las de fábrica (la vieja de lunes a viernes o la provisoria "Residuos"
   martes, jueves y sábado). */
const RECOLECCION_BARRIO = { 2:'Todos los residuos', 4:'Todos los residuos', 6:'Voluminosos' };
const RECOLECCION_PROVISORIA = { 2:'Residuos', 4:'Residuos', 6:'Residuos' };
/* Un día cargado en Ajustes como "No pasa", "No hay", "—" o "Sin servicio"
   es un día SIN camión. Antes se tomaba como el tipo de residuo del día y el
   aviso de la noche decía "Mañana pasa el camión: No pasa". ("No
   reciclables" sí es un tipo de residuo: ese no se toca.) */
const sinCamion = v => { const t = String(v || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return !t || /^[-–—.x\s]+$/.test(t) || /^(no|ninguno|ninguna|nada|feriado)$/.test(t) || /\bno (pasa|hay|viene)\b/.test(t) || /^sin (servicio|recoleccion|camion|residuos)\b/.test(t); };
function recoleccionDias(){
  const r = Store.s.config.recoleccion || {}, t = JSON.stringify(r);
  if (!Object.keys(r).length || t === JSON.stringify(RECOLECCION_VIEJA) || t === JSON.stringify(RECOLECCION_PROVISORIA)) return RECOLECCION_BARRIO;
  const out = {}; Object.keys(r).forEach(d => { if (!sinCamion(r[d])) out[d] = r[d]; });
  return Object.keys(out).length ? out : RECOLECCION_BARRIO;
}
const esVoluminoso = t => /volumin/i.test(String(t || ''));
/* =========================================================
   CÓMO SE ANUNCIA EL CAMIÓN (con las palabras de Claudio, 26-09-2026)
   En la pizarra general, TODO el día:
     · la víspera (lunes, miércoles y viernes): "Mañana pasa el camión de
       basura — No saque sus bolsas hasta mañana a la mañana, evitemos que
       animales rompan las mismas";
     · el día que pasa (martes, jueves y sábado): "Hoy pasa el camión de
       basura — Saque sus bolsas temprano en la mañana".
   El sábado son los voluminosos y el título lo dice entre paréntesis.
   Cuando la garita registra la entrada del camión, el "Hoy pasa…"
   desaparece de la pizarra y a todos les llega el aviso push.
   Si al otro día no hay camión, no se anuncia nada.
   ========================================================= */
function anuncioCamion(cuando, tipo, detalle = ''){
  const c = Store.s.config, vol = esVoluminoso(tipo);
  const t = `${cuando} pasa el camión de basura${vol ? ' (voluminosos)' : ''}`;
  const extra = vol && (detalle || c.voluminososDetalle) ? ' ' + (detalle || c.voluminososDetalle) : '';
  const x = cuando === 'Hoy'
    ? `Saque sus bolsas temprano en la mañana.${extra}`
    : `No saque sus bolsas hasta mañana a la mañana, evitemos que animales rompan las mismas.${extra}`;
  return { t, x, vol };
}

const CONFIG_BASE = {
  nombre: 'Bahía Cauquén',
  ciudad: 'Ushuaia, Tierra del Fuego',
  domicilio: 'Los Ñires 3333, Ushuaia',
  cuit: '30-71010005-1',
  garitaTel: '',
  adminEmail: 'barriobahiacauquen@gmail.com',
  /* La garita entra con UNA sola cuenta: este correo. La app la reconoce por
     el correo y le muestra solamente lo de la garita. */
  garitaEmail: 'garitabarriobahiacauquen@gmail.com',
  /* Turnos de la garita: los edita la Administración (de 2 a 4). */
  turnosGarita: [
    { nombre:'Mañana', desde:'06:00', hasta:'14:00' },
    { nombre:'Tarde',  desde:'14:00', hasta:'22:00' },
    { nombre:'Noche',  desde:'22:00', hasta:'06:00' },
  ],
  adminTel: '2901446911',
  cbu: '0070346620000001759042',
  alias: 'bahia.cauquen',
  cuenta: 'Cuenta Corriente 1759-0 346-4 · Banco Galicia',
  mapa: 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent('Barrio Bahía Cauquén, Ushuaia'),
  casas: 152,
  recoleccion: { 2:'Todos los residuos', 4:'Todos los residuos', 6:'Voluminosos' },
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
    mpLink: '',               /* enlace de cobro de Mercado Pago */
    modoLink: '',             /* enlace de cobro de MODO */
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
  { id:'d1', tipo:'app', titulo:'Vitalia by Mónica Ponzio', detalle:'Seguimiento nutricional y hábitos saludables. No es una app médica.', url:'https://claudioravasi-ai.github.io/Vitalia/#/inicio', icon:'heart', color:'ok', deslinde:true },
  { id:'d2', tipo:'planilla', titulo:'Modelo de planilla del padrón', detalle:'CSV con los 152 lotes y sus coeficientes, para completar los propietarios', url:'', icon:'clipboard', color:'wood' },
];

/* =========================================================
   MARCO LEGAL DEL BARRIO (normas públicas)
   Buscado el 22-09-2026 en el sistema legislativo del Concejo Deliberante
   de Ushuaia. El reglamento interno y el estatuto de la Asociación Civil
   Barrio Bahía Cauquén NO están publicados en internet: los tiene que
   cargar la Administración (Contenido → Documentos).
   Estas normas se suman solas a la base del barrio la primera vez que
   entra la Administración (ver Nube.sumarNuevos).
   ========================================================= */
const MARCO_LEGAL = [
  { id:'ley-om2102', tipo:'Norma municipal', titulo:'Ordenanza 2102/1999 · Barrios cerrados en Ushuaia',
    link:'https://sistemalegislativo.concejoushuaia.gob.ar/files/ORDENANZA/2102.pdf', texto:
`Ordenanza Municipal N° 2102, sancionada el 10/11/1999 por el Concejo Deliberante de Ushuaia. Incorpora al Código de Planeamiento Urbano el capítulo "Barrios Cerrados". Es la norma municipal bajo la que funciona Bahía Cauquén.

1.1 DEFINICIÓN
Barrio cerrado es todo emprendimiento urbanístico destinado al uso residencial predominante, con equipamiento comunitario propio, dentro del ejido urbano y con su perímetro materializado mediante cercamiento.

1.2 MODALIDAD
Se implanta en terrenos de dominio privado y se constituye mediante un Convenio de Cesión de Uso Exclusivo de las Calles y Espacios Públicos Municipales, firmado entre el Municipio y una Sociedad Civil que deben conformar todos los propietarios de las parcelas del barrio. El convenio lo refrenda el Concejo Deliberante y sigue vigente mientras se cumplan las condiciones de la norma y no se manifieste en contra la mitad más uno de esa Sociedad Civil.

1.3 LOCALIZACIÓN
Solo en zonas residenciales R3 y R4, o en Áreas de Proyectos Especiales con aprobación del Concejo Deliberante.

1.4 REQUISITOS (lo que más toca a los vecinos)
• No se requiere la prestación de servicios municipales dentro del barrio.
• El mantenimiento de las redes de servicios, las calles, el equipamiento comunitario y los espacios verdes es SIEMPRE responsabilidad de los propietarios, conformados en Sociedad Civil.
• Los organismos públicos (poder de policía) y las empresas de servicios públicos tienen libre acceso a las calles internas y control sobre los servicios comunes.
• Superficie máxima afectada al régimen: 15 hectáreas (con un margen del 10 % por topografía).

1.6 INDICADORES Y ASPECTOS CONSTRUCTIVOS
• Barrios sobre la costa de mar o ríos: deben garantizar el libre acceso público por una franja de al menos 25 metros desde la línea máxima de marea.
• Circulación pública perimetral por una calle de no menos de 20 metros (o cesión de una franja de 10 metros donde no exista).
• El cerramiento del perímetro debe ser TRANSPARENTE: está prohibido hacerlo con muro.
• Agua y cloaca aprobadas por la Dirección Provincial de Obras y Servicios Sanitarios. Si hay planta depuradora propia, está a cargo de la entidad que nuclea a los residentes; tercerizarla requiere aprobación del Municipio y de la DPOSS.
• Energía eléctrica y alumbrado para viviendas, espacios comunes y calles.
• Recolección de residuos domiciliaria y diaria, con transporte al relleno sanitario municipal.
• Calles mejoradas o pavimentadas con red pluvial; todas las redes de infraestructura, subterráneas (no se permite tendido aéreo).

1.7 TASAS MUNICIPALES
Mientras esté vigente el convenio por el que la asociación presta los servicios, el barrio tributa como Zona "C" de la Ordenanza Tarifaria.

1.8 AUTORIDAD DE APLICACIÓN
El Departamento Ejecutivo Municipal, a través de la Subsecretaría de Planeamiento y Gestión del Espacio Urbano.

Promulgada por el Intendente Jorge A. Garramuño (Expediente 7578/99). Texto transcripto del PDF oficial del Concejo Deliberante; ante cualquier duda vale el original.` },
  { id:'ley-om6600', tipo:'Norma municipal', titulo:'Ordenanza 6600/2026 · Pavimentación de Los Ñires, Etapa II',
    link:'https://sistemalegislativo.concejoushuaia.gob.ar/files/ORDENANZA/6600.pdf', texto:
`Ordenanza Municipal N° 6600, del 23/02/2026. Es la única ordenanza vigente que nombra expresamente a la Asociación Civil Barrio Bahía Cauquén.

QUÉ DISPONE
• Art. 1: declara de utilidad pública, bajo el régimen de Contribución por Mejoras, la obra "Pavimentación Calle Los Ñires. Etapa II": asfalto en unos 2.700 metros.
• Art. 3: el Municipio paga el 20 % del costo; los beneficiarios, el 80 % (60 % los frentistas de Los Ñires por metro de frente y 40 % los no frentistas, con un monto fijo por contribuyente), más un 10 % de redeterminación de precios e imprevistos.
• Art. 4: quiénes pagan: propietarios, condóminos, sucesiones, personas jurídicas, fideicomisos, y en forma solidaria usufructuarios y quienes exploten el inmueble.
• Art. 9: el certificado de deuda de Rentas es título ejecutivo; la mora en una cuota habilita a reclamar todo el saldo.

LO QUE TOCA AL BARRIO
• Art. 10: la Asociación Civil Barrio Bahía Cauquén (CUIT 30-71010005-1), por pedido propio, abona el total de lo que el Municipio facture por esta contribución, sin distinguir parcela ni beneficiario (Sección J, macizos 39 a 46, 115, 116 y 117). Es decir: la contribución no le llega a cada propietario por separado, la paga el barrio.
• Art. 12: antes de firmar el contrato de obra, el Municipio tiene que haber cobrado el 30 % del 80 % a cargo de los beneficiarios.
• Art. 14: crea la Mesa de Representación Vecinal Los Ñires, con un representante titular y un suplente por cada barrio del sector. Es consultiva: acompaña y hace aportes, sin frenar plazos.

Resumen hecho a partir del texto publicado por el Concejo Deliberante; ante cualquier duda vale el original.` },
  { id:'ley-ccyc-conjuntos', tipo:'Ley nacional', titulo:'Código Civil y Comercial · Conjuntos inmobiliarios (arts. 2073 a 2086)',
    link:'https://servicios.infoleg.gob.ar/infolegInternet/anexos/235000-239999/235975/norma.htm', texto:
`Desde 2015 el Código Civil y Comercial de la Nación regula los barrios cerrados como "conjuntos inmobiliarios". En pocas palabras:

• Art. 2073 · Qué son: barrios cerrados, clubes de campo, parques industriales y todo emprendimiento urbanístico con usos mixtos.
• Art. 2074 · Características: cerramiento, partes comunes y privativas, estado de indivisión forzosa y perpetua de lo común, un reglamento con sus órganos de funcionamiento, limitaciones y restricciones, y una entidad con personería que agrupa a los propietarios.
• Art. 2075 · Marco legal: lo urbanístico (zonas, dimensiones, usos) lo fijan las normas de cada jurisdicción —en Ushuaia, la Ordenanza 2102—. Además, todos los conjuntos deben someterse al derecho real de propiedad horizontal, y los que ya existían (como los organizados como asociación civil) deben adecuarse.
• Art. 2076 y 2077 · Qué es común y qué es de cada uno: calles, cercos, accesos, espacios verdes y equipamiento son comunes; el lote y lo construido son privativos.
• Art. 2078 · Facultades y obligaciones: cada propietario usa lo suyo y lo común según el reglamento, sin perturbar a los demás.
• Art. 2079 y 2080 · Límites perimetrales y restricciones: el reglamento puede fijar normas de construcción, uso, seguridad, horarios y ambiente.
• Art. 2081 · Gastos y contribuciones: los propietarios pagan las expensas comunes en la proporción que fija el reglamento.
• Art. 2082 · Cesión de la unidad: si el propietario presta o alquila su lote, el reglamento puede fijar cómo usan los terceros los espacios e instalaciones comunes.
• Art. 2083 · Invitados y usuarios no propietarios: el reglamento puede extender el uso de lo común al grupo familiar y prever un régimen de invitados (en la app, los pases de visita).
• Art. 2085 · Transmisión: el reglamento puede poner limitaciones pero no impedir vender; puede prever un derecho de preferencia para el consorcio o los demás propietarios.
• Art. 2086 · Sanciones: ante conductas graves o reiteradas contra el reglamento, el consorcio puede aplicar las sanciones que ese reglamento prevea (en la app, las infracciones, con descargo del vecino).

Relacionados que usa la app: art. 2048 (el certificado de deuda de expensas es título ejecutivo) y art. 2060 (decisiones por consulta escrita a los propietarios, base de las votaciones).

Resumen orientativo. No reemplaza el texto del Código ni el consejo de un abogado.` },
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
/* Quien administra el barrio tiene los dos sombreros SIEMPRE que su rol sea
   admin. Antes se le exigía además tener un lote asignado, y si la ficha
   tenía la casa escrita de otra forma (o vacía) el botón para cambiar de
   modo simplemente no aparecía: la app parecía no distinguir vecino de
   administrador. Ahora aparece siempre, y si no hay lote, la propia pantalla
   lo dice en vez de esconderse. */
const puedeAdministrar = () => yo()?.rol === 'admin';
const tengoLote = () => /^Lote\s/i.test(yo()?.casa || '');
const modoActivo = () => { const u = yo(); if (!u) return ''; return u.rol === 'admin' ? (Store.sesion.modo || 'admin') : u.rol; };
const esAdmin = () => yo()?.rol === 'admin' && modoActivo() !== 'vecino';
const esGuardia = () => yo()?.rol === 'guardia';
/* ¿Este correo es el de la garita? Sin mayúsculas ni espacios que molesten. */
const correoGarita = () => String(Store.s.config.garitaEmail || CONFIG_BASE.garitaEmail).trim().toLowerCase();
const esCorreoGarita = e => !!e && String(e).trim().toLowerCase() === correoGarita();
const esStaff = () => esAdmin() || esGuardia();
/* EL HOTEL LOS CAUQUENES (26-09-2026): una cuenta institucional con rol
   propio. No es vecino ni personal del barrio: ve y maneja solo lo suyo
   (vans, traslados, eventos, huéspedes, proveedores, promociones) y lo
   público de la ciudad. Ver js/v-hotel.js. */
const HOTEL_NOMBRE = 'Hotel Los Cauquenes';
const esHotel = () => yo()?.rol === 'hotel';
/* EL SUPERVISOR DE LA GUARDIA (07-10-2026, pedido de Claudio). Una cuenta
   personal con rol propio que mira la garita en vivo (ingresos, bitácora,
   turnos, rondas, SOS, DEA…) sin poder tocar nada: solo les escribe a la
   garita y a la Administración. Ver js/v-supervisor.js. */
const esSupervisor = () => yo()?.rol === 'supervisor';
/* Quién puede MIRAR la garita: la garita, la Administración y el supervisor. */
const veGarita = () => esStaff() || esSupervisor();
const cuentaHotel = () => Store.s.users.find(x => x.rol === 'hotel' && x.estado === 'aprobado') || null;
/* =========================================================
   LA GARITA OPERA, LA ADMINISTRACIÓN MIRA (pedido de Claudio, 26-09-2026)
   Lo que es deber de la guardia (validar códigos, registrar ingresos y
   egresos, paquetes, camión, policía y rondas, bitácora, peticiones, SOS)
   lo hace SOLO la cuenta de la garita. La Administración lo ve todo en vivo
   pero no lo toca: así no se pisan datos ni se cruzan responsabilidades.
   Lo que sí es de la Administración es la configuración: horarios de los
   turnos, puntos de la ronda, zonas, proveedores e ingresos frecuentes.
   Para pedirle algo a la garita está "Mensajes con la garita".
   ========================================================= */
const soloGarita = () => {
  if (esGuardia()) return true;
  if (esSupervisor()) toast('Eso lo hace solo la garita. Desde la supervisión se mira en vivo; para pedirle algo, escribile a la garita.', 'lock');
  else toast('Eso lo hace solo la garita. Desde la Administración se ve en vivo; para pedirle algo, escribile en "Mensajes con la garita".', 'lock');
  return false;
};
/* Las cuentas aprobadas de un lote (en el 148 viven Mónica y Claudio: los
   dos tienen que enterarse de lo que llega al lote). */
const cuentasDelLote = casa => casa ? Store.s.users.filter(u => u.estado === 'aprobado' && u.casa === casa) : [];
/* =========================================================
   LOTE ALQUILADO: EL PROPIETARIO A DISTANCIA (pedido de Claudio, 07-10-2026)
   -------------------------------------------------------
   Un lote queda ALQUILADO solo, sin tocar nada más, cuando la
   Administración aprueba una cuenta inscripta como "Inquilino/a" en él.
   Desde ahí:
     · el inquilino y su familia (relación "inquilino" o "familiar") usan la
       app completa: es su casa y el día a día es de ellos (la garita le
       consulta a ellos, las visitas, los correos, los paquetes, el SOS);
     · el propietario y los cotitulares pasan a PROPIETARIO A DISTANCIA: un
       portal propio con lo que les toca como dueños (expensas, votaciones,
       comunicados, las cuentas del barrio, las normas, la Administración y
       un canal privado con su inquilino). No ven el día a día ni les llegan
       sus avisos, y no autorizan visitas a una casa donde no viven.
   Cuando la cuenta del inquilino se da de baja, el lote vuelve a ser del
   propietario. Un propietario que no vive en el barrio (casa vacía, o un
   inquilino sin la app) también puede pasar a este portal desde Mi casa
   ("No vivo en el lote"). El padrón no se toca: el titular sigue siendo el
   titular, para las expensas y los votos.
   ========================================================= */
const inquilinosDe = casa => casa ? Store.s.users.filter(u => u && u.estado === 'aprobado' && u.rol === 'vecino' && u.casa === casa && u.relacion === 'inquilino') : [];
const loteAlquilado = casa => inquilinosDe(casa).length > 0;
const esDuenoDelLote = u => !!u && (u.relacion === 'propietario' || u.relacion === 'cotitular');
function esPropDistancia(u = yo()){
  return !!u && u.rol === 'vecino' && /^Lote\s/i.test(u.casa || '') && esDuenoDelLote(u) && (!!u.noVive || loteAlquilado(u.casa));
}
/* Quienes VIVEN en el lote: a ellos les llega lo del día a día. */
const residentesDelLote = casa => cuentasDelLote(casa).filter(u => !esPropDistancia(u));
/* De lo que va a todo el barrio, al propietario a distancia le toca solo
   lo de dueño: votaciones, expensas, las cuentas, las normas y los
   comunicados de la Administración. El Apps Script aplica la misma regla a
   los avisos al celular (ver tokensDe). */
const LINKS_PROPIETARIO = ['votaciones', 'expensas', 'tablero', 'documentos', 'privado', 'inicio'];
const avisoDePropietario = n => LINKS_PROPIETARIO.includes(String(n.link || '').split(':')[0]) || /^(Comunicado|Invitación):/.test(n.titulo || '');
/* PAQUETES EN PAUSA (30-09-2026, pedido de Claudio): el barrio no aprobó
   que la garita reciba correo ni paquetes de los vecinos. Todo el módulo
   (Mis paquetes, "Llegó un paquete", el QR de retiro, los avisos de 24 h,
   la pizarra, el asistente, la petición "Recibir correo o paquetes") queda
   GUARDADO en el código pero no se ve ni se usa en ningún portal: vecinos,
   garita, Administración ni hotel. Si algún día se aprueba, alcanza con
   poner esto en true (y volver a escribir el capítulo del manual, que
   también quedó guardado en js/v-manual.js). */
const PAQUETES_ACTIVOS = false;
const hayPaquetes = () => PAQUETES_ACTIVOS;
/* Los paquetes de todo el lote, no solo los que llegaron a mi nombre. */
const loteDelPaquete = p => (p && (p.lote || usuario(p.hostId)?.casa)) || '';
const paquetesDelLote = (u = yo()) => !u ? [] : aLista(Store.s.paquetes).filter(p => p && (p.hostId === u.id || (u.casa && loteDelPaquete(p) === u.casa)));
const vecinosAprobados = () => Store.s.users.filter(u => u.estado === 'aprobado' && u.rol === 'vecino');
const casasRegistradas = () => new Set(Store.s.users.filter(u => u.estado === 'aprobado' && u.casa && u.rol === 'vecino').map(u => u.casa)).size;
const totalLotes = () => (typeof LOTES !== 'undefined' ? lotesVecinos().length : Store.s.config.casas);
const loteDe = u => typeof LOTES !== 'undefined' ? LOTES.find(l => 'Lote ' + l.lote === u.casa) : null;
/* El titular de expensas lo conoce solo la Administración (padrón); los
   demás ven el propietario que figura en la guía del barrio. */
const propietarioDe = casa => (Store.s.padron.find(p => 'Lote ' + p.lote === casa) || {}).propietario
  || aLista((aLista(Store.s.guia).find(g => g && 'Lote ' + g.lote === casa) || {}).propietarios).join(' y ') || '';

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
/* =========================================================
   LOS AVISOS AUTOMÁTICOS SALEN UNA VEZ PARA TODO EL BARRIO
   El motor corre en cada equipo que tiene la app abierta. El aviso que da
   ("Helada: revisar subidas") lleva un id FIJO sacado de su marca
   (m-hielo-2026-09-25-1): si otro equipo lo diera en el mismo instante,
   escribe en el mismo lugar de la base y queda uno solo. Además lo firma
   "sistema" y no el vecino cuyo equipo lo generó (antes, ese vecino era el
   único del barrio que no lo veía).
   ========================================================= */
const Automatico = { clave:null, n:0 };
const idAutomatico = () => 'm-' + String(Automatico.clave).replace(/[.#$\[\]\/\s]/g, '_') + '-' + (++Automatico.n);
function notificar(s, { para, titulo, texto = '', icon = 'bell', color = 'brand', link = '', urgente = false, sonido = false, push = true, camionId = '', mensId = '', vence = 0, postId = '', llegadaId = '', ref = '' }){
  const auto = !!Automatico.clave, id = auto ? idAutomatico() : uid();
  /* Ya está (lo dio otro equipo y ya bajó): no se repite ni se le borra a
     nadie el "visto". */
  if (auto && aLista(s.notifs).some(x => x && x.id === id)) return;
  const n = { id, para: [].concat(para), titulo, texto, icon, color, link, urgente, sonido: sonido || urgente, de: auto ? 'sistema' : Store.sesion.userId, at: Date.now(), leidas: [] };
  if (camionId) n.camionId = camionId;
  /* "Andreani va a tu casa" queda atado a ese correo (js/v-servicio.js). */
  if (mensId) n.mensId = mensId;
  /* El aviso de una publicación (una mascota perdida) se va con ella (10-10-2026). */
  if (postId) n.postId = postId;
  /* "En la garita: Ana pregunta por vos" se va apenas alguien del lote contesta (10-10-2026). */
  if (llegadaId) n.llegadaId = llegadaId;
  /* Un aviso que pide una decisión queda atado a lo que pregunta ("pagos:<id>",
     "solicitudesPase:<id>"…) y se va solo cuando se resuelve (ver AVISO_RESUELTO). */
  if (ref || llegadaId) n.ref = ref || 'llegadas:' + llegadaId;
  if (vence) n.vence = vence;
  s.notifs.unshift(n);
  if (s.notifs.length > 400) s.notifs.length = 400;
  /* Lo que suena también sale como aviso push: llega con el celular
     bloqueado (ver js/push.js). */
  /* (En el ensayo que hace la cuenta del supervisor antes de guardar, ver
     js/v-supervisor.js, no sale nada: se manda cuando se guarda de verdad.) */
  if (push && !(typeof Supervisor !== 'undefined' && Supervisor.ensayo) && typeof empujarAviso === 'function') setTimeout(() => empujarAviso(n), 0);
}
/* =========================================================
   LO QUE LA BASE SE COME: LAS LISTAS VACÍAS
   -------------------------------------------------------
   Firebase no guarda listas ni objetos vacíos. Un aviso creado con
   `leidas: []` llega a la base SIN ese campo, y al volver a leerlo
   `n.leidas` es `undefined`. Entonces `n.leidas.includes(...)` revienta; y
   como eso pasa dentro de `pintarTop()`, se rompe el dibujo entero: no
   abren las ventanas, no se puede cambiar de modo, la app parece muerta.
   Con `?local` no pasa nunca, porque los datos no dan esa vuelta por la
   base: por eso la demo andaba y el barrio de verdad no.

   Además, una lista con huecos vuelve como objeto `{0:…, 2:…}`.

   `aLista()` devuelve siempre una lista, venga como venga. Se usa en todos
   los lugares donde lo que se lee pudo haber pasado por la base. */
const aLista = v => Array.isArray(v) ? v
  : (v && typeof v === 'object') ? Object.keys(v).sort((a, b) => a - b).map(k => v[k])
  : [];
/* Igual que aLista, pero además deja el campo arreglado en el objeto, para
   poder hacerle push sin que explote. */
const listaDe = (obj, campo) => { const l = aLista(obj[campo]); obj[campo] = l; return l; };

function meToca(n, u = yo()){
  if (!u || !n || n.de === u.id) return false;
  /* Al supervisor le llega solo lo suyo: no los avisos de todo el barrio
     (el camión, la pizarra), que no son para él. Los SOS los ve aparte. */
  if (u.rol === 'supervisor') return aLista(n.para).some(p => p === u.id || p === 'rol:supervisor');
  /* El propietario a distancia: lo que es para él y, de lo de todos, lo de dueño. */
  if (esPropDistancia(u)){ const para = aLista(n.para); return para.includes(u.id) || (para.some(p => p === 'todos' || p === 'rol:vecino') && avisoDePropietario(n)); }
  return aLista(n.para).some(p => p === 'todos' || p === u.id || p === 'rol:' + u.rol || (p === 'staff' && (u.rol === 'admin' || u.rol === 'guardia')));
}
/* "Entró el camión de la basura" sirve solo mientras el camión está en el
   barrio. Cuando la garita registra la salida (o pasaron 8 horas), el aviso
   deja de existir para todos: antes quedaba en la campanita y a las 20 h un
   vecino abría la app y leía que el camión había entrado, cuando ya se había
   ido a la mañana. Confunde y no sirve para nada. */
/* =========================================================
   LOS AVISOS QUE PIDEN UNA DECISIÓN SE VAN SOLOS AL RESOLVERSE
   (pedido de Claudio, 10-10-2026, sobre la idea de novu, 40.000★: cada
   aviso atado a lo que pregunta). Si quedaban, se malinterpretaban:
   "Te piden un pase" cuando ya lo había aprobado otro, "Pago por
   acreditar" ya acreditado, "Llegó un paquete" ya retirado. El aviso lleva
   `ref` ("colección:id") y desaparece de la campanita, de la Pizarra y de
   la bandeja del teléfono (ver Push.arrancar) en todos los equipos apenas
   alguien lo resuelve. Si lo que pregunta todavía no bajó a este equipo,
   el aviso queda (no se lo da por resuelto a ciegas).
   ========================================================= */
const AVISO_RESUELTO = {
  llegadas:        x => x.estado !== 'consultando',
  solicitudesPase: x => x.estado !== 'pendiente',
  paquetes:        x => !!x.retirado,
  peticiones:      x => x.estado !== 'pendiente',
  pagos:           x => x.estado !== 'informado',
  users:           x => x.estado !== 'pendiente',
  reclamos:        x => x.estado !== 'abierto',
  /* "… todavía no llegó" (12-10-2026): se va si entró, se canceló, la borraron o pasó la hora. */
  pases:           x => !!x.cancelado || !!x.borrado || (typeof estadoPase === 'function' && estadoPase(x) !== 'noingreso'),
  /* El recordatorio de una hora antes (12-10-2026): se va cuando la visita
     entra, se cancela o la borran, o media hora después de su hora. */
  pasesRec:        x => !!x.cancelado || !!x.borrado || (typeof estadoPase === 'function' && estadoPase(x) !== 'esperado') || ahoraMin() > minutosDe(x.desde) + 30,
};
const HORAS_AVISO_REF = { llegadas:6, pasesRec:3 };
/* Un mismo registro puede tener avisos que se resuelven distinto. */
const COL_DEL_REF = { pasesRec:'pases' };
function avisoResuelto(n){
  const [col, id] = String(n.ref || (n.llegadaId ? 'llegadas:' + n.llegadaId : '')).split(':');
  const f = AVISO_RESUELTO[col]; if (!f || !id) return false;
  if (HORAS_AVISO_REF[col] && Date.now() - (n.at || 0) > HORAS_AVISO_REF[col] * HORA) return true;
  const x = aLista(Store.s[COL_DEL_REF[col] || col]).find(z => z && z.id === id);
  return !!(x && f(x));
}
function avisoCaduco(n){
  if (n && (n.ref || n.llegadaId)) return avisoResuelto(n);
  /* "Un correo va a tu casa": lo mismo, mientras el correo está adentro. */
  if (n && n.mensId){
    if (Date.now() - (n.at || 0) > 4 * HORA) return true;
    const v = typeof Mensajeria !== 'undefined' ? Mensajeria.lista().find(x => x.id === n.mensId) : null;
    return !!(v && v.sale);
  }
  if (!n || n.icon !== 'tacho' || String(n.link || '').split(':')[0] !== 'recoleccion') return false;
  if (Date.now() - (n.at || 0) > 8 * HORA) return true;
  if (typeof Camion === 'undefined') return false;
  /* Atado a su viaje: si el aviso llega un instante antes que el registro
     del camión, NO se lo toma por viejo (tiene que sonar). */
  if (n.camionId){ const v = Camion.lista().find(c => c.id === n.camionId); return !!(v && v.sale); }
  return Date.now() - (n.at || 0) > 2 * MIN && !Camion.adentro();
}
/* =========================================================
   HASTA CUÁNDO SIRVE UN AVISO
   Los avisos automáticos del día (la helada, la nieve, el viento, el
   camión de mañana, el feriado de mañana) traen `vence` y a esa hora se
   van solos. Los anteriores a esta versión no lo traen: los del tiempo y el
   "mañana pasa el camión" valen el día en que salieron — y si al otro día
   no había camión (los viejos "Mañana pasa el camión: No pasa" o "Húmedos"
   de un jueves a la noche), no valieron nunca. El del camión, además, se va
   apenas la garita registra la entrada.
   ========================================================= */
const finDelDia = (iso, dias = 0) => fechaDe(sumarDias(iso, dias + 1)).getTime() - 1;
function avisoVencido(n, ahora = Date.now()){
  if (!n) return true;
  const dia = isoDe(new Date(n.at || 0));
  /* El "mañana pasa el camión" se va apenas la garita registra la entrada. */
  const recordatorio = n.icon === 'truck' && String(n.link || '').split(':')[0] === 'recoleccion' && /^(ma[nñ]ana|hoy)\b.*(cami[oó]n|volumin)/i.test(n.titulo || '');
  if (recordatorio && typeof Camion !== 'undefined' && Camion.lista().some(v => v.entra && v.entra > n.at)) return true;
  if (n.vence) return n.vence < ahora;
  if (['thermo', 'snow', 'wind'].includes(n.icon)) return ahora > finDelDia(dia);
  if (recordatorio && /^ma[nñ]ana/i.test(n.titulo || '')){
    const man = sumarDias(dia, 1);
    const hay = recoleccionDias()[fechaDe(man).getDay()] || (typeof volsProximos === 'function' && volsProximos().some(v => v.fecha === man));
    return !hay || ahora > finDelDia(dia);
  }
  return false;
}
/* EL MISMO AVISO, UNA SOLA VEZ EN LA CAMPANITA
   Iguales = mismo título, mismo texto y misma ventana. Se muestra el último;
   al abrirlo se dan por vistos todos (marcarVistoAviso, en app.js). */
const normAviso = t => String(t || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
const claveAviso = n => [n.titulo, n.texto, String(n.link || '').split(':')[0]].map(normAviso).join('|');
function unoDeCada(lista){
  const vistos = new Set();
  return lista.slice().sort((a, b) => (b.at || 0) - (a.at || 0)).filter(n => { const k = claveAviso(n); if (vistos.has(k)) return false; vistos.add(k); return true; });
}
const misNotifs = () => { const u = yo(); if (!u) return []; const ahora = Date.now(); return aLista(Store.s.notifs).filter(n => meToca(n, u) && !avisoCaduco(n) && !avisoVencido(n, ahora)); };
/* Todos los no vistos, repetidos incluidos (para marcarlos). */
const noLeidasTodas = () => { const u = yo(); return misNotifs().filter(n => !aLista(n.leidas).includes(u.id)); };
const noLeidas = () => unoDeCada(noLeidasTodas());

/* Aviso del sistema operativo cuando la app está en segundo plano
   (en esta versión, mientras esté abierta en alguna pestaña). */
let ultimoAvisoSO = Date.now();
function avisosDelSistema(){
  const u = yo(); if (!u) return;
  const nuevas = misNotifs().filter(n => n.at > ultimoAvisoSO && !aLista(n.leidas).includes(u.id));
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
/* LOS CARTELITOS, SIEMPRE ARRIBA (pedido de Claudio, 28-09-2026)
   Una hoja abierta (Tu cuenta, un formulario) es un <dialog> modal: va en la
   "capa superior" del navegador, por encima de todo lo demás, y tapaba los
   cartelitos ("Pedido enviado…", "Guardado"…): se veía que algo salía por
   debajo pero no se leía. Se probó hacerlos "popover" y tampoco pasan por
   encima de un modal abierto. Lo que sí anda: mientras hay una hoja abierta,
   el contenedor de cartelitos se muda ADENTRO de la hoja (queda en su misma
   capa, fijo arriba de la pantalla); al cerrarse la hoja vuelve al cuerpo de
   la página (ver el 'close' de la hoja en app.js). */
function toast(msg, icon = 'check'){
  const box = $('#toasts'), d = $('#hoja');
  if (box && d){ if (d.open){ if (box.parentNode !== d) d.appendChild(box); } else if (box.parentNode !== document.body) document.body.appendChild(box); }
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
  d.dataset.origen = '';   /* "Tu cuenta" lo vuelve a marcar (ver Cuenta en app.js) */
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
/* =========================================================
   LA TARJETA DEL PASE (rediseño, pedido de Claudio, 10-10-2026: "a la
   visita le tiene que llegar el QR con el código abajo; los enlaces son
   feos")
   Una sola imagen, como una tarjeta de embarque: arriba el barrio y a quién
   va a ver; en el medio el QR grande y el código debajo, en números
   grandes y separados; abajo un mapita con el pin y "Cómo llegar".
   WhatsApp no deja que una imagen sea un botón: el mapa de Google se abre
   tocando el único enlace del mensaje, que va solo al final, con 📍.
   `datos` (opcional): { nombre, espera, cuando, horario }.
   ========================================================= */
const codigoEspaciado = c => String(c || '').replace(/^(\d{3})(\d{3})$/, '$1 $2');
let logoPase = null;
const cargarLogoPase = () => logoPase || (logoPase = new Promise(ok => { const im = new Image(); im.onload = () => ok(im); im.onerror = () => ok(null); im.src = 'icons/logo.png'; }));
async function imagenQR(contenido, codigo, titulo = '', sub = '', datos = null){
  const q = await cargarQR(); if (!q) return null;
  const logo = await cargarLogoPase();
  const qr = q(0, 'M'); qr.addData(contenido); qr.make();
  const n = qr.getModuleCount(), W = 1080, M = 54, CW = W - 2 * M;
  const d = datos || {}, tieneInfo = !!(d.espera || d.cuando || d.horario);
  const lado = 600, cel = lado / n;
  const topH = 330, infoH = tieneInfo ? 170 : 0, qrY0 = M + topH + infoH + 70, codY = qrY0 + lado + 120, mapY = codY + 110, mapH = 230;
  const H = mapY + mapH + M + 40;
  const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
  const F = (peso, px, fam = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif') => `${peso} ${px}px ${fam}`;
  const redondo = (x, y, w, h, r) => { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); };
  /* fondo */
  const bg = g.createLinearGradient(0, 0, W, H); bg.addColorStop(0, '#0b3c47'); bg.addColorStop(1, '#0d6b66'); g.fillStyle = bg; g.fillRect(0, 0, W, H);
  g.globalAlpha = .07; g.fillStyle = '#fff'; g.beginPath(); g.arc(W - 60, 80, 260, 0, 7); g.fill(); g.beginPath(); g.arc(40, H - 60, 220, 0, 7); g.fill(); g.globalAlpha = 1;
  /* la tarjeta */
  g.save(); g.shadowColor = 'rgba(0,0,0,.35)'; g.shadowBlur = 40; g.shadowOffsetY = 14; redondo(M, M, CW, H - 2 * M, 44); g.fillStyle = '#ffffff'; g.fill(); g.restore();
  g.save(); redondo(M, M, CW, H - 2 * M, 44); g.clip();
  const tg = g.createLinearGradient(M, M, W - M, M + topH); tg.addColorStop(0, '#0d6b66'); tg.addColorStop(1, '#14968c'); g.fillStyle = tg; g.fillRect(M, M, CW, topH);
  /* montañas suaves en la cabecera */
  g.fillStyle = 'rgba(255,255,255,.10)'; g.beginPath(); g.moveTo(M, M + topH); g.lineTo(M + 170, M + topH - 120); g.lineTo(M + 300, M + topH - 50); g.lineTo(M + 470, M + topH - 170); g.lineTo(M + 650, M + topH - 40); g.lineTo(M + 820, M + topH - 140); g.lineTo(W - M, M + topH - 60); g.lineTo(W - M, M + topH); g.fill();
  g.restore();
  g.textAlign = 'left'; g.fillStyle = '#ffffff';
  let tx = M + 48;
  if (logo){ g.save(); g.beginPath(); g.arc(M + 48 + 42, M + 76, 42, 0, 7); g.fillStyle = '#fff'; g.fill(); g.clip(); g.drawImage(logo, M + 48, M + 34, 84, 84); g.restore(); tx = M + 48 + 84 + 22; }
  g.fillStyle = '#ffffff'; g.font = F(800, 34); g.fillText(titulo || ('Barrio ' + Store.s.config.nombre), tx, M + 70);
  g.globalAlpha = .85; g.font = F(600, 24); g.fillText(Store.s.config.ciudad || 'Ushuaia', tx, M + 104); g.globalAlpha = 1;
  /* etiqueta */
  g.font = F(800, 22); const et = 'PASE DE INGRESO', ew = g.measureText(et).width + 40;
  redondo(W - M - 48 - ew, M + 46, ew, 46, 23); g.fillStyle = 'rgba(255,255,255,.18)'; g.fill(); g.fillStyle = '#fff'; g.textAlign = 'center'; g.fillText(et, W - M - 48 - ew / 2, M + 77);
  g.textAlign = 'left'; g.globalAlpha = .8; g.font = F(700, 22); g.fillText(d.nombre ? 'BIENVENIDO/A' : 'PASE', M + 48, M + 190); g.globalAlpha = 1;
  g.font = F(800, 58); let nom = d.nombre || sub || 'Pase de ingreso'; while (g.measureText(nom).width > CW - 96 && nom.length > 4) nom = nom.slice(0, -2);
  g.fillText(nom, M + 48, M + 258);
  /* datos: a quién visita, el día y el horario */
  if (tieneInfo){
    const cols = [['TE ESPERA', d.espera], ['DÍA', d.cuando], ['HORARIO', d.horario]].filter(x => x[1]), cw = (CW - 96) / cols.length;
    cols.forEach(([k, v], i) => { const x = M + 48 + i * cw;
      g.fillStyle = '#667775'; g.font = F(800, 20); g.fillText(k, x, M + topH + 62);
      g.fillStyle = '#0f1f1e'; g.font = F(700, 30); let t = String(v); while (g.measureText(t).width > cw - 20 && t.length > 4) t = t.slice(0, -2); g.fillText(t, x, M + topH + 104); });
  }
  /* línea troquelada, con las muescas a los costados */
  const yT = M + topH + infoH + 20;
  g.fillStyle = bg; [M, W - M].forEach(x => { g.beginPath(); g.arc(x, yT, 26, 0, 7); g.fill(); });
  g.strokeStyle = '#c9d6d3'; g.lineWidth = 4; g.setLineDash([14, 12]); g.beginPath(); g.moveTo(M + 40, yT); g.lineTo(W - M - 40, yT); g.stroke(); g.setLineDash([]);
  /* el QR */
  const x0 = (W - lado) / 2;
  redondo(x0 - 44, qrY0 - 44, lado + 88, lado + 88, 34); g.fillStyle = '#ffffff'; g.fill(); g.strokeStyle = '#e6eeec'; g.lineWidth = 3; g.stroke();
  g.fillStyle = '#0f1f1e';
  for (let r = 0; r < n; r++) for (let k = 0; k < n; k++) if (qr.isDark(r, k)) g.fillRect(Math.floor(x0 + k * cel), Math.floor(qrY0 + r * cel), Math.ceil(cel), Math.ceil(cel));
  /* el código, debajo del QR */
  g.textAlign = 'center'; g.fillStyle = '#667775'; g.font = F(800, 22); g.fillText('CÓDIGO DE INGRESO', W / 2, codY - 46);
  g.fillStyle = '#0d6b66'; g.font = F(800, 92, 'ui-monospace, "SF Mono", Menlo, Consolas, monospace'); g.fillText(codigoEspaciado(codigo), W / 2, codY + 40);
  g.fillStyle = '#3d4f4d'; g.font = F(600, 24); g.fillText('Mostrá el QR en la garita o decí el código', W / 2, codY + 84);
  /* el mapita */
  const mx = M + 48, mw = 300, my = mapY;
  g.save(); redondo(mx, my, mw, mapH - 30, 26); g.clip();
  g.fillStyle = '#e4efe2'; g.fillRect(mx, my, mw, mapH);
  g.fillStyle = '#bcdcf0'; g.beginPath(); g.moveTo(mx, my + 140); g.bezierCurveTo(mx + 90, my + 110, mx + 180, my + 175, mx + mw, my + 130); g.lineTo(mx + mw, my + mapH); g.lineTo(mx, my + mapH); g.fill();
  g.strokeStyle = '#ffffff'; g.lineWidth = 12; g.lineCap = 'round';
  g.beginPath(); g.moveTo(mx - 10, my + 60); g.bezierCurveTo(mx + 90, my + 40, mx + 170, my + 100, mx + mw + 10, my + 70); g.stroke();
  g.lineWidth = 8; g.beginPath(); g.moveTo(mx + 120, my - 10); g.lineTo(mx + 150, my + 120); g.stroke();
  g.restore();
  const px = mx + 150, py = my + 86;
  g.fillStyle = 'rgba(0,0,0,.18)'; g.beginPath(); g.ellipse(px, py + 6, 18, 6, 0, 0, 7); g.fill();
  g.fillStyle = '#d33a3a'; g.beginPath(); g.moveTo(px, py); g.bezierCurveTo(px - 34, py - 40, px - 30, py - 86, px, py - 86); g.bezierCurveTo(px + 30, py - 86, px + 34, py - 40, px, py); g.fill();
  g.fillStyle = '#fff'; g.beginPath(); g.arc(px, py - 58, 11, 0, 7); g.fill();
  g.textAlign = 'left'; g.fillStyle = '#0f1f1e'; g.font = F(800, 36); g.fillText('Cómo llegar', mx + mw + 36, my + 72);
  /* Va sola, sin texto ni enlace (10-10-2026): se dice qué buscar en el mapa. */
  g.fillStyle = '#3d4f4d'; g.font = F(600, 25); g.fillText('Buscá en Google Maps:', mx + mw + 36, my + 118);
  g.fillStyle = '#0d6b66'; g.font = F(800, 27); g.fillText('Barrio ' + (Store.s.config.nombre || 'Bahía Cauquén'), mx + mw + 36, my + 154);
  return new Promise(ok => c.toBlob(ok, 'image/png'));
}
/* Mandar el pase: SOLO LA TARJETA (pedido de Claudio, 10-10-2026: "que
   llegue la invitación tal cual, sin nada escrito ni enlaces; es más
   elegante"). La imagen tiene todo: nombre, día, horario, QR, código y
   qué buscar en el mapa. El texto queda solo para cuando no se puede
   mandar la imagen (sin internet para dibujar el QR): ahí va el texto. En
   la computadora, que no adjunta desde la web, se baja la imagen y se abre
   WhatsApp vacío para adjuntarla. */
async function compartirPase({ texto, contenido, codigo, titulo = '', sub = '', tel = '', archivo = 'pase-barrio.png', datos = null }){
  const blob = await imagenQR(contenido, codigo, titulo, sub, datos).catch(() => null);
  if (blob && navigator.canShare){
    const f = new File([blob], archivo, { type:'image/png' });
    if (navigator.canShare({ files:[f] })){ try { await navigator.share({ files:[f] }); return; } catch(e){ if (e.name === 'AbortError') return; } }
  }
  if (blob){ const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = archivo; document.body.appendChild(a); a.click(); a.remove();
    toast('Se bajó la tarjeta del pase: adjuntala en el WhatsApp que se abre', 'download');
    window.open(tel ? waLink(tel, '') : 'https://web.whatsapp.com/', '_blank', 'noopener'); return; }
  window.open(tel ? waLink(tel, texto) : 'https://wa.me/?text=' + encodeURIComponent(texto), '_blank', 'noopener');
}
/* "Cómo llegar" como un mapita que se toca (10-10-2026): en vez de un
   botón con texto o un enlace largo, un dibujo de mapa con el pin. */
/* El enlace del mapa, legible: la búsqueda de Google Maps larga y llena de
   %C3%AD pasa a "maps.google.com/?q=Barrio+Bahia+Cauquen+Ushuaia". Si la
   Administración cargó otro enlace (uno corto de "Compartir"), va tal cual. */
const mapaCorto = (u = Store.s.config.mapa) => { const m = String(u || '').match(/google\.[a-z.]+\/maps\/search\/\?api=1&query=([^&#]+)/);
  if (!m) return u || ''; let q = m[1]; try { q = decodeURIComponent(q); } catch(e){}
  return 'https://maps.google.com/?q=' + q.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Za-z0-9,.\-]+/g, '+').replace(/^\+|\+$/g, ''); };
const botonMapa = () => `<a class="mapa-tile" href="${esc(mapaCorto())}" target="_blank" rel="noopener" aria-label="Cómo llegar: abre Google Maps">
  <svg viewBox="0 0 120 84" aria-hidden="true"><rect width="120" height="84" fill="#e4efe2"/><path d="M0 60 C30 50 60 74 120 56 V84 H0Z" fill="#bcdcf0"/>
  <path d="M-4 26 C36 16 66 42 124 28" stroke="#fff" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M48 -4 L60 52" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round"/>
  <ellipse cx="60" cy="42" rx="8" ry="3" fill="rgba(0,0,0,.18)"/><path d="M60 40 C46 24 47 6 60 6 C73 6 74 24 60 40Z" fill="#d33a3a"/><circle cx="60" cy="18" r="5" fill="#fff"/></svg>
  <span><b>Cómo llegar</b><small>Tocá el mapa: se abre Google Maps</small></span></a>`;
const enlaceQR = contenido => urlApp('qr/' + encodeURIComponent(contenido));
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
  db: null, cache: new Map(), relevo: null, faltan: new Set(),
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
  async sacar(id, nube = true){
    if (this.cache.has(id)) return this.cache.get(id);
    const db = await this.abrir(); if (!db) return null;
    const v = await new Promise(ok => { const r = db.transaction('fotos').objectStore('fotos').get(id); r.onsuccess = () => ok(r.result || null); r.onerror = () => ok(null); });
    /* Lo que no está en el equipo se pide una sola vez a la nube (hoy, solo
       las fotos del frente de las casas); si no está, no se vuelve a pedir. */
    if (!v && nube && this.relevo && !this.faltan.has(id)){ try { const b = await this.relevo.bajar(id); if (b){ await this.poner(id, b); return b; } } catch(e){} this.faltan.add(id); }
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
    /* La vista previa que viaja con el registro: 96 px, unos 3 KB. Antes
       era de 48 px y se veía como una mancha. La foto buena se baja al
       tocarla (ver Nube.compartirDescarga). */
    const mini = await achicarDato(grande, 96, .6);
    const fotoId = 'f' + uid();
    await this.poner(fotoId, grande);
    if (this.relevo){ try { await this.relevo.subir(fotoId, grande); } catch(e){} }
    return { fotoId, mini };
  },
  /* Después de cada dibujo: cambia la miniatura por la foto local. */
  async hidratar(raiz = document){
    for (const el of $$('[data-foto]', raiz)){
      const id = el.dataset.foto; if (!id || el.dataset.ok) continue;
      /* Las marcadas "a pedido" (las mascotas) no se bajan solas: se ven con
         la miniatura y la foto se trae recién cuando alguien la toca. */
      const v = await this.sacar(id, !('pedido' in el.dataset));
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
      ok(aImagen(c, q));
    };
    img.onerror = () => ok('');
    img.src = dato;
  });
}
/* HTML de una foto: arranca con la miniatura y se hidrata sola. */
const fotoHTML = (f, cls = 'foto', { aPedido = false } = {}) => f && f.fotoId
  ? `<div class="${cls}" data-foto="${esc(f.fotoId)}" data-a="ver-foto" role="button" tabindex="0" aria-label="Ver la foto y guardarla en este equipo" ${aPedido ? 'data-pedido' : ''} title="Tocá para ver la foto y guardarla en este equipo" style="background-image:url('${f.mini || ''}')"></div>` : '';

/* Guardar una foto en el equipo (descargas, o Fotos en el celular). No queda
   en la app ni en la base del barrio: es un archivo del equipo. En el
   celular se abre el menú de compartir, que tiene "Guardar imagen"; en la
   computadora se descarga directo. */
async function guardarFotoEnEquipo(dato, nombre = 'foto-barrio.jpg'){
  try {
    const blob = await (await fetch(dato)).blob();
    /* El nombre lleva la extensión de lo que es de verdad (una foto WebP no se guarda como .jpg). */
    nombre = String(nombre).replace(/\.(jpe?g|png|webp)$/i, '') + '.' + extDeTipo(blob.type || tipoDeDato(dato));
    const archivo = new File([blob], nombre, { type: blob.type || 'image/jpeg' });
    const tactil = matchMedia('(pointer:coarse)').matches;
    if (tactil && navigator.canShare && navigator.canShare({ files:[archivo] })){
      try { await navigator.share({ files:[archivo], title:'Foto del barrio' }); return true; }
      catch(e){ if (e && e.name === 'AbortError') return false; }
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = nombre;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 20000);
    return true;
  } catch(e){ toast('No se pudo guardar la foto: ' + e.message, 'alert'); return false; }
}

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
  /* A dónde se piden los correos. Lo normal es leerlo de los ajustes del
     barrio; pero quien se está inscribiendo todavía no puede leer los
     ajustes (las reglas se los tapan hasta que lo aprueban), y por eso los
     mails de inscripción NO SALÍAN NUNCA. Para ese caso la Administración
     deja una copia en barrio/publico/correo, que sí se puede leer. */
  publico: null,
  datos(){
    const c = Store.s.config;
    if (c.correoUrl && c.correoClave) return { url:c.correoUrl, clave:c.correoClave, adminEmail:c.adminEmail || '' };
    const p = this.publico;
    return p && p.url && p.clave ? p : null;
  },
  configurado(){ return !!this.datos(); },
  async traerPublico(){
    if (this.publico || typeof Nube === 'undefined' || !Nube.activa() || !Nube.db) return;
    try { this.publico = (await Nube.db.ref('barrio/publico/correo').get()).val(); } catch(e){}
  },
  /* Quien todavía no está aprobado no puede anotar en la bandeja de la
     Administración (la base se lo niega y, peor, frena todo el guardado).
     Su correo sale igual, sin quedar en el historial. */
  anota(){
    if (typeof Nube === 'undefined' || !Nube.activa()) return true;
    /* La supervisión no anota en la bandeja de la Administración (solo mira). */
    const u = yo(); return !!(u && u.estado === 'aprobado' && u.rol !== 'supervisor');
  },
  /* Lo que devuelve Google cuando algo está mal configurado, en castellano. */
  motivo(err){
    const m = String(err && err.message || err || '');
    if (/Unexpected token|JSON|<!DOCTYPE|not valid JSON/i.test(m)) return 'Google devolvió una página en lugar de una respuesta: la implementación no está como "Quién tiene acceso: Cualquier persona", o la URL no es la de /exec.';
    if (/Failed to fetch|Load failed|NetworkError|CORS/i.test(m)) return 'No se pudo llegar al Apps Script. Suele ser el acceso ("Cualquier persona", no "Cualquier persona con cuenta de Google"), una URL mal copiada o falta de internet.';
    if (/no autorizado/i.test(m)){
      /* El Apps Script nuevo dice en qué difieren, sin revelar la frase. */
      const p = err && err.pista;
      if (p && p.scriptSinFrase) return 'El Apps Script no tiene frase: en la línea var CLAVE_COMPARTIDA quedó "CAMBIAR-por-una-frase…". Escribí ahí tu frase, Guardar, e Implementar → Gestionar implementaciones → editar → Nueva versión.';
      if (p && p.soloMayusculas) return 'Las dos frases son iguales salvo MAYÚSCULAS y minúsculas. Tienen que ser idénticas letra por letra: corregila en Ajustes → Correo.';
      if (p && p.soloEspacios) return 'Las dos frases son iguales salvo los espacios. Corregila en Ajustes → Correo para que sea idéntica a la del Apps Script.';
      if (p) return `La frase de Ajustes no es la del Apps Script: la del Apps Script tiene ${p.largoScript} caracteres y la de Ajustes ${p.largoApp}. Copiá la que está entre comillas en la línea var CLAVE_COMPARTIDA del Apps Script y pegala en Ajustes → Correo → Frase compartida (con "Mostrar" tildado para ver que quedó bien) y tocá Guardar.`;
      return 'La frase compartida de Ajustes no coincide con CLAVE_COMPARTIDA del Apps Script (o se cambió y no se hizo "Nueva versión").';
    }
    if (/tope/i.test(m)) return 'Se alcanzó el tope diario del Apps Script (TOPE_DIARIO).';
    return m || 'Error desconocido';
  },
  async pedir(d, cuerpo){
    const r = await fetch(d.url, { method:'POST', headers:{ 'Content-Type':'text/plain;charset=utf-8' }, body: JSON.stringify({ ...cuerpo, clave:d.clave }) });
    const j = await r.json();
    if (!j || !j.ok){ const e = new Error((j && j.error) || 'el Apps Script contestó que no'); e.pista = j && j.pista; throw e; }
    return j;
  },
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
  async enviar(x){ return (await this.enviarDetalle(x)).ok; },
  /* Lo mismo, pero dice el motivo si no salió: para mostrarlo en pantalla. */
  /* `privado`: no queda en la bandeja de salida de la Administración (el
     aviso de "Estoy bien" a un familiar: que alguien vive solo no tiene
     por qué verlo nadie más). */
  async enviarDetalle({ para, asunto, html, tipo, privado = false }){
    if (!para) return { ok:false, error:'Sin dirección de correo' };
    const anota = !privado && this.anota();
    const reg = { id:uid(), para, asunto, html, tipo, at:Date.now(), estado:'pendiente', intentos:0 };
    if (anota) Store.cambiar(s => { s.correos.unshift(reg); if (s.correos.length > 300) s.correos.length = 300; });
    if (!this.configurado()) await this.traerPublico();
    const d = this.datos();
    if (!d){ const error = 'El envío automático no está configurado (Ajustes → Correo): quedó en la bandeja de salida.'; if (anota) Store.cambiar(s => { const x = s.correos.find(c => c.id === reg.id); if (x) x.error = error; }); return { ok:false, error }; }
    const marcar = (estado, error = '') => { if (anota) Store.cambiar(s => { const x = s.correos.find(c => c.id === reg.id); if (x){ x.estado = estado; x.intentos = (x.intentos || 0) + 1; x.error = error; } }); };
    try { await this.pedir(d, { para, asunto, html, tipo }); marcar('enviado'); return { ok:true }; }
    catch(e){ console.warn('No salió el correo', tipo, e); const error = this.motivo(e); marcar('error', error); return { ok:false, error }; }
  },
  /* Lo que quedó sin salir (el Apps Script no estaba configurado, se cayó
     internet, lo mandó un equipo sin la dirección…) se reintenta solo la
     próxima vez que la Administración abre la app. Hasta tres intentos por
     correo y solo de la última semana, para no mandar cosas viejas. */
  async reintentar(){
    if (this.reintentando || !esAdmin() || !this.configurado()) return 0;
    this.reintentando = true; this.ultimoError = ''; this.enCola = 0;
    const d = this.datos(), lim = Date.now() - 7 * DIA;
    const cola = aLista(Store.s.correos).filter(c => c && c.estado !== 'enviado' && c.at > lim && (c.intentos || 0) < 3 && c.para && c.html).slice(0, 20);
    let n = 0; this.enCola = cola.length;
    for (const c of cola){
      let estado = 'enviado', error = '';
      try { await this.pedir(d, { para:c.para, asunto:c.asunto, html:c.html, tipo:c.tipo }); n++; }
      catch(e){ estado = 'error'; error = this.motivo(e); this.ultimoError = error; }
      Store.cambiar(s => { const x = s.correos.find(z => z.id === c.id); if (x){ x.estado = estado; x.error = error; x.intentos = (x.intentos || 0) + 1; } });
      if (/no autorizado|página en lugar|No se pudo llegar/.test(error)) break;   /* si es la configuración, no insistir */
    }
    this.reintentando = false;
    return n;
  },
  /* La prueba de Ajustes: primero pregunta si el Apps Script está vivo y
     después manda un correo de verdad. Devuelve qué pasó, paso por paso. */
  async probar(para){
    const d = this.datos();
    if (!d) return { ok:false, paso:'ajustes', txt:'Falta la URL del Apps Script o la frase compartida en Ajustes → Correo.' };
    if (!/^https:\/\/script\.google(usercontent)?\.com\/.+\/exec(\?|$)/.test(d.url)) return { ok:false, paso:'url', txt:'La URL tiene que ser la de la aplicación web y terminar en /exec (no la del editor, que termina en /edit).' };
    try {
      const vivo = await fetch(d.url).then(r => r.json());
      if (!vivo || !vivo.ok) return { ok:false, paso:'vivo', txt:'El Apps Script respondió, pero no dice que esté activo. ¿Es el código de apps-script/Codigo.gs?' };
    } catch(e){ return { ok:false, paso:'vivo', txt:this.motivo(e) }; }
    try {
      await this.pedir(d, { para, tipo:'prueba', asunto:'Prueba de correo · Barrio ' + Store.s.config.nombre,
        html:this.plantilla('Prueba de envío', `<p>Si leés esto, la app del barrio ya manda los correos sola.</p><p style="font-size:13px;color:#6c7d7a">Enviado desde la app el ${fechaLarga(hoyISO())} a las ${hora(Date.now())} h.</p>`) });
      return { ok:true, txt:`Salió un correo de prueba a ${para}. Si en unos minutos no está en la bandeja de entrada, mirá en Spam.` };
    } catch(e){ return { ok:false, paso:'envio', txt:this.motivo(e) }; }
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
