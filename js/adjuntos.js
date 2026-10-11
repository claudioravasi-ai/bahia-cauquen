/* =========================================================
   FOTOS Y ARCHIVOS EN LOS MENSAJES (pedido de Claudio, 11-10-2026: "¿los
   mensajes de chat pueden aceptar fotos o archivos, o se enlentece la app?")
   No se enlentece, porque por la app viaja muy poco:
     · en el mensaje va solo una MINIATURA de la foto (220 px, unos 8 KB) o,
       si es un archivo, su nombre y su peso. Eso es lo que baja con la
       conversación;
     · la foto buena (1600 px) o el archivo (hasta 5 MB) se guardan aparte,
       en barrio/adjuntos/<id>, que NO baja con nada: solo lo trae quien
       toca la miniatura, y queda guardado en SU equipo;
     · se borra solo de la base una hora después de que lo baja la otra
       persona (la hora es por si la descarga falló y hay que repetirla).
       Si nadie lo baja, a los 3 días. Lo borra el reloj del Apps Script
       (cada 10 minutos) y, por las dudas, la app de la Administración.
   Quien lo manda lo tiene siempre en su equipo. Se puede mandar en las
   conversaciones privadas: vecino ↔ garita, vecino ↔ Administración,
   vecino ↔ vecino, hotel ↔ garita o Administración, garita ↔
   Administración y la supervisión con la garita o la Administración.
   ========================================================= */
const ADJ = { maxArchivo: 5 * 1024 * 1024, horaTrasBajar: 3600000, diasSinBajar: 3, mini: 220, foto: 1600 };
const leerComoDato = file => new Promise((ok, mal) => { const r = new FileReader(); r.onload = () => ok(r.result); r.onerror = () => mal(new Error('No se pudo leer el archivo')); r.readAsDataURL(file); });
const pesoTexto = b => b >= 1048576 ? `${(b / 1048576).toLocaleString('es-AR', { maximumFractionDigits:1 })} MB` : `${Math.max(1, Math.round((b || 0) / 1024))} KB`;
/* El texto que acompaña a un adjunto sin mensaje (para la lista de conversaciones y los avisos). */
const etiquetaAdj = a => !a ? '' : a.mini ? '📷 Foto' : '📎 ' + (a.nombre || 'Archivo');
const leerAdj = v => { try { const a = typeof v === 'string' ? JSON.parse(v) : v; return a && a.id ? a : null; } catch(e){ return null; } };
/* El texto y el adjunto de un mensaje nuevo, a partir del formulario. */
function mensajeConAdj(d){
  const adj = leerAdj(d.adj), text = String(d.text || '').trim() || etiquetaAdj(adj);
  return { text, extra: adj ? { adj } : {} };
}

const Adjuntos = {
  esFoto: f => /^image\//.test(f.type || '') || /\.(heic|heif|jpe?g|png|webp|gif)$/i.test(f.name || ''),
  nube: () => typeof Nube !== 'undefined' && Nube.activa() && !!Nube.db,
  /* Del archivo elegido a lo que va en el mensaje: { id, nombre, tipo, peso, vence, mini? } */
  async preparar(file){
    const id = 'a' + uid(), at = Date.now();
    let d = null, mini = '', tipo = file.type || 'application/octet-stream', nombre = String(file.name || 'archivo').slice(0, 80);
    if (this.esFoto(file)){
      try { d = await comprimir(file, ADJ.foto, .8); } catch(e){ d = null; }
      if (d){ mini = await achicarDato(d, ADJ.mini, .5); tipo = 'image/jpeg'; nombre = nombre.replace(/\.[a-z0-9]+$/i, '') + '.jpg'; }
    }
    if (!d){
      if (file.size > ADJ.maxArchivo) throw new Error(`Ese archivo pesa ${pesoTexto(file.size)}. El máximo es 5 MB.`);
      d = await leerComoDato(file);
    }
    await Fotos.poner(id, d);
    const vence = at + ADJ.diasSinBajar * DIA;
    /* No se espera a que suba: sin señal, la subida queda en la cola y el
       mensaje sale con su relojito (ver Salida, más abajo). */
    if (this.nube()) this.subir(id, d, { nombre, tipo, at, vence });
    return { id, nombre, tipo, peso: Math.round(d.length * .75), vence, ...(mini ? { mini } : {}) };
  },
  /* Sube la foto o el archivo a la base. Firebase manda las escrituras en
     orden: la del archivo sale antes que la del mensaje que lo nombra. */
  subiendo: {},
  subir(id, d, { nombre, tipo, at, vence }){
    const p = Nube.db.ref('barrio/adjuntos/' + id).set({ d, nombre, tipo, at, vence, de:Nube.uid });
    Nube.db.ref('barrio/adjuntosIdx/' + id).set({ at, vence, de:Nube.uid }).catch(() => {});
    return this.subiendo[id] = p.then(() => ({ ok:true }), e => ({ ok:false, msg:e.message }));
  },
  /* Lo trae a este equipo. La primera vez que lo baja alguien que no lo
     mandó, le queda una hora en la base. */
  async bajar(id){
    const local = await Fotos.sacar(id, false);
    if (local) return local;
    if (!this.nube()) return null;
    const v = (await Nube.db.ref('barrio/adjuntos/' + id).get()).val();
    if (!v || typeof v.d !== 'string') return null;
    await Fotos.poner(id, v.d);
    if (v.de !== Nube.uid){
      const vence = Math.min(v.vence || Infinity, Date.now() + ADJ.horaTrasBajar);
      if (vence !== v.vence) await Nube.db.ref().update({ ['barrio/adjuntos/' + id + '/vence']:vence, ['barrio/adjuntosIdx/' + id + '/vence']:vence }).catch(() => {});
    }
    return v.d;
  },
  /* La Administración borra los vencidos (por si el reloj del Apps Script no está). */
  async limpiar(){
    if (!this.nube() || !esAdmin()) return;
    try {
      const idx = (await Nube.db.ref('barrio/adjuntosIdx').get()).val() || {}, ahora = Date.now(), cambios = {};
      Object.entries(idx).forEach(([id, x]) => { if (!x || !x.vence || x.vence < ahora){ cambios['barrio/adjuntos/' + id] = null; cambios['barrio/adjuntosIdx/' + id] = null; } });
      if (Object.keys(cambios).length) await Nube.db.ref().update(cambios);
    } catch(e){ console.warn('No se pudieron limpiar los adjuntos vencidos', e.message); }
  },
};

/* Guardar un archivo en el equipo: en el celular, el menú de compartir
   ("Guardar en Archivos", "Guardar imagen"); en la computadora, descargas. */
async function guardarArchivoEnEquipo(dato, nombre, tipo){
  if (/^image\//.test(tipo || '')) return guardarFotoEnEquipo(dato, nombre);
  try {
    const blob = await (await fetch(dato)).blob(), archivo = new File([blob], nombre, { type: tipo || blob.type });
    if (matchMedia('(pointer:coarse)').matches && navigator.canShare && navigator.canShare({ files:[archivo] })){
      try { await navigator.share({ files:[archivo], title:nombre }); return true; } catch(e){ if (e && e.name === 'AbortError') return false; }
    }
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = nombre;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 20000);
    return true;
  } catch(e){ toast('No se pudo guardar el archivo: ' + e.message, 'alert'); return false; }
}

/* ---------- en la conversación ---------- */
/* El botón del clip, al lado de la caja de escribir. */
const clipChat = () => `<button type="button" class="chat-clip" data-a="adjuntar" aria-label="Mandar una foto o un archivo" title="Mandar una foto o un archivo">${I('clip')}</button>`;
/* Lo que se ve dentro de la burbuja: la miniatura o el archivo, y el texto si lo hay. */
function cuerpoMsg(m){
  const a = leerAdj(m && m.adj), txt = m && m.text && (!a || m.text !== etiquetaAdj(a)) ? esc(m.text) : '';
  if (!a) return txt;
  const datos = `data-a="adj-abrir" data-id="${esc(a.id)}" data-n="${esc(a.nombre || '')}" data-t="${esc(a.tipo || '')}"`;
  const caja = a.mini
    ? `<button type="button" class="msg-foto" ${datos} style="background-image:url('${a.mini}')" aria-label="Ver la foto en buena calidad y guardarla en este equipo"><span>${I('download')}</span></button>`
    : `<button type="button" class="msg-arch" ${datos} aria-label="Bajar ${esc(a.nombre || 'el archivo')}">${I('file')}<span><b>${esc(a.nombre || 'Archivo')}</b><small>${pesoTexto(a.peso)} · tocá para bajarlo</small></span></button>`;
  return caja + (txt ? `<span class="msg-pie">${txt}</span>` : '');
}

/* Arreglo del 11-10-2026 ("no se suben ni las fotos ni los archivos"):
   mientras se elige la foto o se sube, la conversación se vuelve a dibujar
   (llega un dato de la nube, se vuelve de la cámara, etc.) y el formulario
   del clic ya no está en la pantalla. Antes se lo "enviaba" igual, y un
   formulario que ya no está no envía nada: el adjunto se perdía sin aviso.
   Ahora se anota a qué conversación iba y se manda directo a esa. */
const formDelChat = ({ f, u, con }) => [...document.querySelectorAll('form.chatbar[data-f]')]
  .find(x => x.dataset.f === f && (x.dataset.u || '') === u && (x.dataset.con || '') === con) || null;
A['adjuntar'] = el => {
  const form = el.closest('form'); if (!form || !F[form.dataset.f]) return;
  const destino = { f: form.dataset.f, u: form.dataset.u || '', con: form.dataset.con || '' };
  const escrito = (form.querySelector('textarea[name="text"]') || {}).value || '';
  const inp = document.createElement('input');
  inp.type = 'file'; inp.accept = 'image/*,.heic,.heif,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.odt,.ods';
  inp.style.cssText = 'position:fixed;left:-9999px;top:0;width:1px;height:1px;opacity:0';
  document.body.appendChild(inp);
  inp.addEventListener('change', async () => {
    const file = inp.files && inp.files[0]; inp.remove(); if (!file) return;
    const boton = () => { const f = formDelChat(destino); return f && f.querySelector('.chat-clip'); };
    const ocupado = si => { const b = boton(); if (b){ b.disabled = si; b.classList.toggle('bajando', si); } };
    ocupado(true);
    try {
      toast(Adjuntos.esFoto(file) ? 'Subiendo la foto…' : 'Subiendo el archivo…', 'upload');
      const adj = await Adjuntos.preparar(file);
      const vivo = formDelChat(destino), t = vivo && vivo.querySelector('textarea[name="text"]');
      const d = { text: (t && t.value.trim()) ? t.value : escrito, adj: JSON.stringify(adj) };
      const r = F[destino.f](d, vivo || { dataset: { ...destino } });
      if (r && r.then) await r;
      if (t){ t.value = ''; if (typeof ajustarCaja === 'function') ajustarCaja(t); }
      if (!Salida.sinSenal()) toast(adj.mini ? 'Foto enviada' : 'Archivo enviado', 'check');
    } catch(e){ toast(e.message || 'No se pudo mandar el archivo', 'alert'); }
    finally { ocupado(false); }
  }, { once:true });
  inp.click();
};

let adjAbierto = null;
A['adj-abrir'] = async el => {
  const { id, n:nombre, t:tipo } = el.dataset; if (!id || el.dataset.bajando) return;
  el.dataset.bajando = '1'; el.classList.add('bajando');
  let v = null;
  try { v = await Adjuntos.bajar(id); } catch(e){}
  delete el.dataset.bajando; el.classList.remove('bajando');
  if (!v){ toast('Ya no está para bajar: se borra de la base una hora después de que la otra persona lo baja, o a los 3 días. Pedile que te lo mande de nuevo.', 'clock'); return; }
  el.classList.add('bajado');
  adjAbierto = { v, nombre: nombre || 'archivo', tipo };
  if (/^image\//.test(tipo || '')) return hoja('Foto', `<img class="foto-full" src="${v}" alt="">
    <div class="btns" style="margin-top:12px"><button class="btn btn-pri grow" data-a="adj-guardar">${I('download')}Guardar en este equipo</button></div>
    <p class="muted small" style="margin:8px 2px 0">Ya quedó en esta app, en este equipo. Para tenerla en la galería o en las descargas, tocá "Guardar".</p>`, { ancho:'760px' });
  if (await guardarArchivoEnEquipo(v, adjAbierto.nombre, tipo)) toast('Archivo guardado en este equipo', 'download');
};
A['adj-guardar'] = async () => { if (adjAbierto && await guardarArchivoEnEquipo(adjAbierto.v, adjAbierto.nombre, adjAbierto.tipo)) toast('Guardado en este equipo', 'download'); };

/* =========================================================
   MENSAJES QUE SALEN SOLOS AL VOLVER LA SEÑAL (pedido de Claudio,
   11-10-2026; la idea, de resumable.js, 4.7k★ en GitHub; el código es
   propio). Como en WhatsApp: sin internet, el mensaje se ve igual en la
   conversación, con un RELOJITO al lado de la hora, y sale solo cuando
   vuelve la señal; ahí el relojito desaparece.
     · Con la app abierta, Firebase guarda lo que no pudo mandar y lo manda
       al reconectar. Acá solo se mira cuándo llegó, para sacar el relojito.
     · Si la app se cierra antes, lo que estaba esperando queda anotado en
       este equipo (bhc.salida.v1; la foto o el archivo, en el almacén de
       fotos del equipo). Al volver a abrirla, cuando ya llegaron las
       conversaciones de la base, lo que no está se vuelve a mandar solo.
     · Lo que la base rechaza (no por falta de señal) no se reintenta: se
       avisa, como cualquier otro guardado.
     · Lo anotado guarda solo lo que ya iba en el mensaje, y es de quien lo
       escribió: al cerrar sesión se borra, y a los 3 días también.
   ========================================================= */
const Salida = {
  KEY: 'bhc.salida.v1', lista: null, enCurso: new Set(), conectado: null, oyendo: false, revisando: false,
  CARPETAS: { privados: /^pv\/privados/, dms: /^pv\/dms\// },
  cargar(){ if (this.lista) return this.lista; try { this.lista = JSON.parse(localStorage.getItem(this.KEY)) || {}; } catch(e){ this.lista = {}; } return this.lista; },
  grabar(){ try { localStorage.setItem(this.KEY, JSON.stringify(this.lista || {})); } catch(e){} },
  nube: () => typeof Nube !== 'undefined' && Nube.activa() && !!Nube.db && !!Nube.uid,
  pendiente(id){ return !!(id && this.cargar()[id]); },
  sinSenal(){ return this.conectado === false || (typeof navigator !== 'undefined' && navigator.onLine === false); },
  oir(){
    if (this.oyendo || !this.nube()) return; this.oyendo = true;
    Nube.db.ref('.info/connected').on('value', snap => { this.conectado = snap.val() === true; if (this.conectado) setTimeout(() => this.revisar(), 1500); });
  },
  /* fn hace el Store.cambiar y devuelve { h, m }: la conversación y el mensaje nuevo. */
  vigilar(col, fn){
    const antes = Object.assign({}, (typeof Nube !== 'undefined' && Nube.enviado) || {});
    const r = fn();
    if (!r || !r.m || !r.h || !this.nube()) return r;
    this.oir();
    const promesas = Object.entries(Nube.enviado || {}).filter(([g, p]) => antes[g] !== p && this.CARPETAS[col].test(g)).map(([, p]) => p);
    const a = leerAdj(r.m.adj);
    if (a && Adjuntos.subiendo[a.id]) promesas.unshift(Adjuntos.subiendo[a.id]);
    const { msgs, ...hilo } = r.h;
    this.cargar()[r.m.id] = { col, hilo, msg:r.m, de:Nube.uid, at:Date.now() };
    this.grabar();
    /* Sin nada en viaje (la app todavía no terminó de conectarse), queda
       anotado y lo manda revisar() cuando llegan las conversaciones. */
    if (promesas.length) this.esperar(r.m.id, promesas);
    if (this.sinSenal()) toast(a ? 'Sin señal: queda esperando y sale sola cuando vuelva la conexión' : 'Sin señal: el mensaje sale solo cuando vuelva la conexión', 'clock');
    return r;
  },
  esperar(id, promesas){
    this.enCurso.add(id);
    Promise.all(promesas).then(rs => {
      this.enCurso.delete(id);
      const mal = rs.find(x => x && x.ok === false);
      if (mal && this.cargar()[id]) toast('Un mensaje no se pudo mandar: ' + mal.msg, 'alert');
      delete this.cargar()[id]; this.grabar();
      if (typeof refrescarPronto === 'function') refrescarPronto();
    });
  },
  /* Al abrir la app (y al volver la señal): lo que quedó de antes. */
  listas(){
    if (!this.nube() || !Nube.arrancada || !Nube.esperados || !Nube.listos) return false;
    return [...Nube.esperados].filter(k => /^pv\/(privados|dms)/.test(k)).every(k => Nube.listos.has(k));
  },
  async revisar(){
    const L = this.cargar(), ahora = Date.now();
    if (this.revisando || !Object.keys(L).length || !this.listas()) return;
    this.revisando = true;
    try {
      for (const [id, e] of Object.entries(L)){
        if (this.enCurso.has(id)) continue;
        if (!e || e.de !== Nube.uid){ if (!e || ahora - (e.at || 0) > 3 * DIA){ delete L[id]; this.grabar(); } continue; }
        if (ahora - (e.at || 0) > 3 * DIA){ delete L[id]; this.grabar(); continue; }
        const lista = Store.s[e.col] || [], h = lista.find(x => x && x.id === e.hilo.id);
        /* Ya está en la base: llegó antes de que se cerrara la app. */
        if (h && aLista(h.msgs).some(m => m && m.id === id)){ delete L[id]; this.grabar(); continue; }
        const a = leerAdj(e.msg.adj);
        if (a){
          const d = await Fotos.sacar(a.id, false);
          if (d) Adjuntos.subir(a.id, d, { nombre:a.nombre, tipo:a.tipo, at:e.at, vence:a.vence || e.at + ADJ.diasSinBajar * DIA });
        }
        this.vigilar(e.col, () => {
          let r = null;
          Store.cambiar(s => {
            let hh = (s[e.col] = s[e.col] || []).find(x => x && x.id === e.hilo.id);
            if (!hh){ hh = { ...e.hilo, msgs:[] }; s[e.col].push(hh); }
            const ms = listaDe(hh, 'msgs');
            if (!ms.some(m => m && m.id === id)){ ms.push(e.msg); ms.sort((x, y) => (x.createdAt || x.at || 0) - (y.createdAt || y.at || 0)); }
            r = { h:hh, m:e.msg };
          });
          return r;
        });
      }
    } finally { this.revisando = false; }
  },
  borrarTodo(){ this.lista = {}; this.enCurso.clear(); try { localStorage.removeItem(this.KEY); } catch(e){} },
};
/* El relojito, al lado de la hora del mensaje que todavía no salió. */
const relojMsg = m => m && Salida.pendiente(m.id) ? `<span class="msg-reloj" title="Sin señal: sale solo cuando vuelva la conexión" aria-label="Esperando señal">${I('clock')}</span>` : '';
/* Se revisa al cambiar algo, al volver la señal y, mientras quede algo
   esperando, cada 4 segundos (así arranca solo al abrir la app). */
Store.alCambiar(() => { if (Object.keys(Salida.cargar()).length) setTimeout(() => Salida.revisar(), 0); });
setInterval(() => { Salida.oir(); if (Object.keys(Salida.cargar()).length) Salida.revisar(); }, 4000);
window.addEventListener('online', () => setTimeout(() => Salida.revisar(), 2000));
