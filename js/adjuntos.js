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
    if (this.nube()){
      await Nube.db.ref('barrio/adjuntos/' + id).set({ d, nombre, tipo, at, vence, de:Nube.uid });
      await Nube.db.ref('barrio/adjuntosIdx/' + id).set({ at, vence, de:Nube.uid }).catch(() => {});
    }
    return { id, nombre, tipo, peso: Math.round(d.length * .75), vence, ...(mini ? { mini } : {}) };
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

A['adjuntar'] = el => {
  const form = el.closest('form'); if (!form) return;
  const inp = document.createElement('input');
  inp.type = 'file'; inp.accept = 'image/*,.heic,.heif,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.odt,.ods'; inp.style.display = 'none';
  document.body.appendChild(inp);
  inp.addEventListener('change', async () => {
    const file = inp.files && inp.files[0]; inp.remove(); if (!file) return;
    el.disabled = true; el.classList.add('bajando');
    try {
      toast(Adjuntos.esFoto(file) ? 'Preparando la foto…' : 'Preparando el archivo…', 'upload');
      const adj = await Adjuntos.preparar(file);
      let h = form.querySelector('input[name="adj"]');
      if (!h){ h = document.createElement('input'); h.type = 'hidden'; h.name = 'adj'; form.appendChild(h); }
      h.value = JSON.stringify(adj);
      const t = form.querySelector('textarea[name="text"]'); if (t) t.required = false;
      form.requestSubmit ? form.requestSubmit() : form.dispatchEvent(new Event('submit', { cancelable:true, bubbles:true }));
      h.remove(); if (t) t.required = true;
    } catch(e){ toast(e.message || 'No se pudo mandar el archivo', 'alert'); }
    finally { el.disabled = false; el.classList.remove('bajando'); }
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
