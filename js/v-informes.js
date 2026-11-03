/* =========================================================
   INFORME MENSUAL PARA LA ADMINISTRACIÓN Y CORREOS ENVIADOS
   (pedido de Claudio, 01-11-2026)

   1. EL INFORME: todo el mes del barrio, de lo más importante a lo menos.
      Arriba la MESA DE DECISIONES en tres carriles: urgente (enfrentar ya),
      reclamable (a quién y qué reclamarle) y solucionable (lo resuelve la
      Administración). Después el pulso de los 31 días y el detalle: guardias
      con su bolsa de horas, policías con sus rondas, movimiento del barrio,
      expensas, vecinos, hotel y correos.
      Sale el día 1 por correo a la Administración, con el PDF adjunto.
   2. CORREOS ENVIADOS: un listado simple con fecha y hora de todo lo que
      mandó la app. Tocar "PDF" trae ESE correo de la base, en el momento.
   3. LA FRANJA DE LA GARITA (cabinaGarita): arriba de todo en la portada de
      la Administración, para que lo de la garita no haya que buscarlo.

   QUE NO ENLENTEZCA NI CARGUE LA BASE:
     · El informe se calcula solo al abrirlo o el día 1, con lo que el equipo
       ya tiene. No hay escuchas nuevas ni nada que corra al arrancar.
     · La franja usa los números que la portada ya calculó (pvDatos).
     · El texto de cada correo salía a la colección `correos`, que baja entera
       a la Administración. Ahora, apenas sale, se comprime y se guarda aparte
       (staff/correosCopia/<id>: `z` el texto y `p` el PDF que se adjuntó, sin
       las fotos fijas), y en `correos` queda una línea corta. La copia baja
       solo si alguien toca "PDF", y solo en ese equipo.
       Si la regla todavía no se publicó, no pasa nada: el correo sigue
       guardado como antes.

   PROTECCIÓN DE DATOS (Ley 25.326)
     · El informe en la app lo abre solo la Administración y va completo.
     · Por correo va sin lotes ni nombres de vecinos: los deudores van como
       total y el texto del libro se tapa con taparDatos (js/v-supervisor.js).
     · Las copias de correos las lee solo la Administración y vencen a los
       400 días (o al pasar los últimos 2.000 correos). Los "Estoy bien" a
       familiares no se guardan nunca.

   Ideas de apps con más de 1000 estrellas en GitHub (solo la idea, el código
   es propio): la tira de días de colores de uptime-kuma (93k★, MIT), el saldo
   de horas de kimai (5,1k★, AGPL), la asistencia del mes de frappe/hrms
   (9k★, GPL), los plazos de reclamos de zammad (6k★, AGPL), el correo en
   tablas de mjml (18k★, MIT) y los informes por secciones de evidence
   (7k★, MIT).
   ========================================================= */
'use strict';

/* ---------- los correos, por destinatario ---------- */
const CORREO_GRUPOS = [
  ['admin', 'Administración', 'shield', ['informe-admin', 'parte-turno', 'aviso-admin']],
  ['supGarita', 'Supervisión de garita', 'eye', ['informe-servicio']],
  ['supPolicia', 'Supervisión de policía', 'moon', ['informe-policia']],
  ['policia', 'Policías', 'shield', ['policia-servicio']],
  ['hotel', 'Hotel', 'star', ['bitacora-hotel']],
  ['manten', 'Mantenimiento', 'wrench', ['parte-mantenimiento']],
  ['contador', 'Contador', 'wallet', ['contador']],
  ['vecinos', 'Vecinos', 'users', ['cupon', 'circular', 'comunicado', 'reclamo-expensas', 'clave', 'inscripcion', 'inscripcion-reenvio', 'invitacion', 'rechazo']],
];
const grupoCorreo = tipo => CORREO_GRUPOS.find(g => g[3].includes(tipo)) || ['otros', 'Otros', 'mail', []];
/* Que el listado no muestre la dirección entera de nadie. */
const taparMail = m => String(m || '').replace(/^(.).*?(@.*)$/, '$1•••$2');

const CorreoCopia = {
  DIAS:400, TOPE:2000, MISMO_CUERPO:['bitacora-hotel', 'parte-mantenimiento'],
  enBase: () => typeof Nube !== 'undefined' && Nube.activa() && !!Nube.db,
  async zip(txt){
    const st = new Blob([txt]).stream().pipeThrough(new CompressionStream('gzip'));
    const b = new Uint8Array(await new Response(st).arrayBuffer());
    let s = ''; for (let i = 0; i < b.length; i += 8192) s += String.fromCharCode(...b.subarray(i, i + 8192));
    return btoa(s);
  },
  async unzip(z){
    const b = Uint8Array.from(atob(z), c => c.charCodeAt(0));
    return new Response(new Blob([b]).stream().pipeThrough(new DecompressionStream('gzip'))).text();
  },
  /* Guarda la copia y deja en `correos` solo la línea. Si algo falla, el
     correo sigue como estaba: nunca se pierde el texto. */
  async guardar(id, pdf = ''){
    if (!this.enBase() || typeof CompressionStream === 'undefined') return false;
    const c = aLista(Store.s.correos).find(x => x && x.id === id);
    if (!c || !c.html || c.estado !== 'enviado') return false;
    try {
      const z = await this.zip(await this.achicarFotos(c.html)); if (z.length > 400000) return false;
      /* El PDF del hotel y el de mantenimiento son el mismo texto del correo. */
      const p = pdf && !this.MISMO_CUERPO.includes(c.tipo) ? await this.zip(pdf) : '';
      await Nube.db.ref('staff/correosCopia/' + id).update({ z, at:c.at, ...(p && p.length <= 400000 ? { p } : {}) });
      Store.cambiar(s => { const x = aLista(s.correos).find(y => y && y.id === id); if (x){ x.html = ''; x.copia = true; } });
      return true;
    } catch(e){ console.warn('No se guardó la copia del correo', e); return false; }
  },
  /* El plano del parte de mantenimiento es una imagen que no se comprime y sola
     pesa más que todo el resto: en la copia va más liviana. El correo no cambia. */
  async achicarFotos(html){
    const m = /data:image\/png;base64,[A-Za-z0-9+/=]{20000,}/.exec(html); if (!m) return html;
    try { return html.replace(m[0], await new Promise((ok, mal) => { const i = new Image(); i.onload = () => { const c = document.createElement('canvas'), k = Math.min(1, 900 / i.width); c.width = i.width * k; c.height = i.height * k;
      const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.drawImage(i, 0, 0, c.width, c.height); ok(c.toDataURL('image/jpeg', .55)); }; i.onerror = mal; i.src = m[0]; })); }
    catch(e){ return html; }
  },
  /* Si el correo no salió, su PDF se guarda igual: el reintento lo necesita y
     no queda en la lista que baja sola. El del hotel y mantenimiento no hace
     falta: es el mismo texto del correo. */
  async reservar(id, pdf){
    if (!this.enBase() || typeof CompressionStream === 'undefined') return false;
    const c = aLista(Store.s.correos).find(x => x && x.id === id);
    if (!c || !c.html || this.MISMO_CUERPO.includes(c.tipo)) return false;
    try { const z = await this.zip(c.html), p = await this.zip(pdf); if (z.length > 400000 || p.length > 400000) return false;
      await Nube.db.ref('staff/correosCopia/' + id).set({ z, at:c.at, p }); return true;
    } catch(e){ console.warn('No se guardó el PDF para reintentar', e); return false; }
  },
  conFotos: async h => h.includes(IP_PORTADA) || h.includes(IP_LOGO) ? ipConFotos(h, await constanciaImgs()) : h,
  /* El adjunto de un correo que se vuelve a mandar. */
  async adjunto(c){
    if (!c.pdfNombre) return null;
    const nombre = c.pdfNombre;
    if (this.MISMO_CUERPO.includes(c.tipo)) return { html:(c.tipo === 'bitacora-hotel' ? bhPdfDoc : mvPdfDoc)(c.html), nombre };
    const v = !c.pdfHtml && this.enBase() ? (await Nube.db.ref('staff/correosCopia/' + c.id).get()).val() : null;
    const h = c.pdfHtml || (v && v.p ? await this.unzip(v.p) : '');
    return h ? { html:await this.conFotos(h), nombre } : null;
  },
  /* El servicio de una constancia vieja. Se busca por la noche que dice el
     asunto, no por la hora: la garita puede cargar la salida horas después. Si
     ya no está en lo que tiene el equipo, se traen solo esos días del libro. */
  async servicioDe(c){
    const dia = String(c.asunto || '').split(' · ').pop();
    const cerca = l => l.filter(x => x.sale && fechaCorta(isoDe(new Date(x.entra))) === dia)
      .sort((a, b) => (b.email === c.para) - (a.email === c.para) || Math.abs(a.sale - c.at) - Math.abs(b.sale - c.at))[0];
    const sv = cerca(serviciosPolicia()); if (sv || !Historial.hayNube()) return sv;
    const regs = Object.values((await Nube.db.ref('staff/bitacora').orderByChild('at').startAt(c.at - 3 * DIA).endAt(c.at + DIA).get()).val() || {}).filter(Boolean);
    return cerca(serviciosPolicia(regs.filter(b => b.tipo === 'turno' && b.abre), regs));
  },
  /* Lo que se ve al tocar "PDF": primero el archivo que se adjuntó; en los
     correos viejos, lo que todavía se puede sacar de la base; si el correo no
     llevaba adjunto, el correo tal cual llegó. */
  async vista(c){
    const v = (c.copia || c.pdfNombre) && this.enBase() ? (await Nube.db.ref('staff/correosCopia/' + c.id).get()).val() : null;
    const html = c.html || (v && v.z ? await this.unzip(v.z) : '');
    const conFotos = h => this.conFotos(h);
    const pdf = c.pdfHtml || (v && v.p ? await this.unzip(v.p) : '');
    if (pdf) return { doc:await conFotos(pdf), nota:'Es el PDF que salió adjunto, tal cual.' };
    if (this.MISMO_CUERPO.includes(c.tipo) && html) return { doc:(c.tipo === 'bitacora-hotel' ? bhPdfDoc : mvPdfDoc)(html), nota:'Es el PDF que salió adjunto, tal cual.' };
    if (c.tipo === 'informe-policia'){ const i = (await IPCopia.lista()).filter(x => x && Math.abs((x.at || 0) - c.at) < 6 * HORA).sort((a, b) => Math.abs(a.at - c.at) - Math.abs(b.at - c.at))[0], cp = i && await IPCopia.copia(i.id);
      if (cp && cp.html) return { doc:await conFotos(cp.html), nota:'Es el PDF que salió adjunto, de la copia del informe semanal.' }; }
    if (c.tipo === 'policia-servicio'){ const sv = await this.servicioDe(c);
      if (sv) return { doc:cpPdfDoc(constanciaPdfHtml(sv, await constanciaImgs())), nota:'Es la constancia completa, rearmada con el libro de guardia: este correo es anterior al guardado del PDF, así que la fecha de emisión es la de hoy.' }; }
    /* El parte de turno nunca llevó PDF. Los que salieron con la plantilla vieja
       se rearman con la nueva desde el libro de guardia (se detectan por la tapa). */
    if (c.tipo === 'parte-turno' && !html.includes('border-radius:16px 16px 0 0')){ const [tit, dia, gu] = String(c.asunto || '').split(' · ');
      const ls = registrosTurno().filter(t => `Parte del turno ${t.turno}` === tit && fechaCorta(isoDe(new Date(t.at))) === dia), t = ls.find(x => aLista(x.guardias).join(', ') === gu) || ls[0];
      if (t) return { doc:docParte(t), nota:'Salió con el diseño anterior y sin PDF. Acá se ve rearmado con el diseño nuevo, desde el libro de guardia.' }; }
    if (!html) return null;
    return { doc:docCorreo(c.asunto || 'Correo', html), nota:c.pdfNombre || ['informe-admin', 'informe-servicio', 'informe-policia', 'policia-servicio'].includes(c.tipo) ? 'Este correo es anterior al guardado del PDF: se ve el texto del correo, no el adjunto.' : 'Este correo no llevaba PDF adjunto: se ve tal cual llegó.' };
  },
  /* Una vez por día, en el equipo de la Administración: pasa los correos
     viejos a copia, de a pocos, y borra los que ya vencieron. */
  async aliviar(n = 25){
    const lista = aLista(Store.s.correos).filter(Boolean).sort((a, b) => b.at - a.at), lim = Date.now() - this.DIAS * DIA;
    /* La línea y su copia se van juntas: si no, la copia queda en la base sin
       que nadie pueda llegar a ella. Son 400 días o los últimos TOPE correos. */
    const vencidos = lista.filter((c, i) => c.at < lim || i >= this.TOPE), fuera = new Set(vencidos.map(c => c.id));
    if (vencidos.length){
      if (this.enBase()) await Promise.all(vencidos.filter(c => c.copia || c.pdfNombre).map(c => Nube.db.ref('staff/correosCopia/' + c.id).remove().catch(() => {})));
      Store.cambiar(s => { s.correos = aLista(s.correos).filter(c => c && !fuera.has(c.id)); });
    }
    for (const c of lista.filter(x => !fuera.has(x.id) && x.html && x.estado === 'enviado').slice(0, n)) if (!await this.guardar(c.id)) break;
  },
};
REGLAS.push({ id:'correos-aliviar', n:'Cada día → la copia de los correos sale de la lista que baja sola',
  d:'En el equipo de la Administración: comprime los correos que ya salieron y los guarda aparte, para que la lista pese poco. Se traen solo al tocar "PDF". Vencen a los 400 días.',
  run(s, hoy){ if (!esAdmin()) return 0; return marca(s, 'correos-aliviar-' + hoy, () => { setTimeout(() => CorreoCopia.aliviar(), 4000); }); } });

/* ---------- el PDF con diseño propio ----------
   Sin posiciones fijas ni columnas flexibles: lo convierte el Apps Script de
   Google, que entiende mucho menos que un navegador. */
function docPdf({ titulo, sello, color = '#0d6b66', cuerpo }){
  const c = Store.s.config;
  return `<!DOCTYPE html><html lang="es-AR"><head><meta charset="utf-8"><title>${esc(titulo)}</title><style>
    @page{size:A4;margin:10mm}*{-webkit-print-color-adjust:exact;print-color-adjust:exact}
    body{margin:0;background:#fff;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#13211f}
    tr{page-break-inside:avoid}h2,h2+p{page-break-after:avoid}
  </style></head><body><table role="presentation" width="100%" style="border-collapse:collapse;margin:0 0 10px;border-bottom:3px solid ${color}"><tr>
    <td style="font-size:9pt;color:#5f6f6c;padding:0 0 6px"><b style="color:#13211f">${esc(titulo)}</b> · Barrio ${esc(c.nombre)}</td>
    <td align="right" style="text-align:right;padding:0 0 6px"><span style="border:1.5px solid ${color};color:${color};border-radius:6px;padding:2px 8px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;font-size:7.5pt">${esc(sello)}</span></td></tr></table>${cuerpo}</body></html>`;
}
const docCorreo = (titulo, html) => `<!DOCTYPE html><html lang="es-AR"><head><meta charset="utf-8"><title>${esc(titulo)}</title><style>@page{size:A4;margin:8mm}*{-webkit-print-color-adjust:exact;print-color-adjust:exact}body{margin:0}</style></head><body>${html}</body></html>`;
const docParte = t => docCorreo(`Parte del turno ${t.turno}`, parteTurnoHtml(t).replace('<!--sello-->', ' · Administración'));
/* Muestra un documento adentro de la app, tal cual, listo para imprimir o guardar en PDF. */
function verDoc(titulo, doc, nota = ''){
  hoja(titulo, `${nota ? `<p class="muted small" style="margin:0 0 8px">${nota}</p>` : ''}<iframe class="mv-parte-frame" title="${esc(titulo)}" sandbox="allow-same-origin allow-modals"></iframe>
    <button class="btn btn-pri btn-block" style="margin-top:10px" data-a="mv-parte-imprimir">${I('download')}Imprimir o guardar en PDF</button>`, { ancho:'820px' });
  const f = $('#hoja .mv-parte-frame'); if (f){ encuadrarPdf(f); f.srcdoc = doc; }
}

/* ---------- los datos del informe ---------- */
const DIAS_DEL_MES = p => { const [y, m] = p.split('-').map(Number); return new Date(y, m, 0).getDate(); };
const horasTxt = h => (Math.round(h * 10) / 10).toLocaleString('es-AR', { maximumFractionDigits:1 });
const conSigno = h => (h > 0 ? '+' : h < 0 ? '−' : '') + horasTxt(Math.abs(h));

/* Expensas: la foto de la última liquidación emitida. */
function expensasInforme(){
  const sim = Store.s.simulacion && Store.s.simulacion.expensas; if (sim) return sim;
  const l = typeof liquidacionesEmitidas === 'function' ? liquidacionesEmitidas().slice(-1)[0] : null;
  if (!l || typeof Morosos === 'undefined') return null;
  const todos = Morosos.armar(), ms = todos.filter(m => m.total > (m.interes || 0) + 1), jud = ms.filter(m => m.judicial), total = todos.reduce((a, m) => a + m.total, 0);
  const cobros = aLista(Store.s.pagos).filter(p => p && p.estado === 'confirmado' && !esPrueba(p));
  return { periodo:l.periodo, lotes:LOTES.length, conDeuda:ms.length, soloInteres:todos.length - ms.length, total, interes:todos.reduce((a, m) => a + (m.interes || 0), 0),
    judiciales:jud.length, judMonto:jud.reduce((a, m) => a + m.total, 0), top:ms.slice().sort((a, b) => b.total - a.total).slice(0, 10).map(m => ({ lote:m.lote, total:m.total, judicial:m.judicial, meses:m.meses.length })),
    gastos:+l.totalGastos || 0, banco:l.banco || null, cobros:cobros.length };
}

function datosAdmin(periodo){
  const b = datosInforme(periodo), s = Store.s, cfg = cfgSup(), hoy = hoyISO(), ini = b.ini, fin = b.fin, en = at => at >= ini && at < fin;
  const dMes = DIAS_DEL_MES(periodo), isoDia = i => `${periodo}-${String(i).padStart(2, '0')}`;
  /* Las horas de garita cubiertas por día. */
  const todos = registrosTurno().slice().sort((a, x) => a.at - x.at);
  const iv = b.turnos.map(t => { const sig = todos[todos.indexOf(t) + 1]; return [t.at, t.cerradoAt || (sig ? sig.at : Math.min(fin, t.at + 12 * HORA))]; }).sort((a, x) => a[0] - x[0]);
  const cubiertas = (a, z) => { let h = 0, hasta = a; iv.forEach(([u, v]) => { const d = Math.max(u, hasta), f = Math.min(v, z); if (f > d){ h += f - d; hasta = f; } }); return h / HORA; };
  /* Los policías: lo que hicieron contra lo que había que hacer. */
  const meta = rondaMeta(), porNoche = {};
  b.servicios.forEach(sv => { const n = nocheDe(sv.entra); (porNoche[n] = porNoche[n] || []).push(sv); });
  const noches = Object.entries(porNoche).map(([f, svs]) => ({ f, svs, completas:svs.reduce((a, x) => a + x.completas, 0), ok:svs.reduce((a, x) => a + x.completas, 0) >= meta }));
  const pols = {};
  b.servicios.forEach(sv => { const k = normTxt(sv.nombre) + '|' + (sv.matricula || ''), n = nochePolicia(sv.entra), nc = noches.find(x => x.f === nocheDe(sv.entra));
    const x = pols[k] = pols[k] || { nombre:sv.nombre, cargo:sv.cargo, matricula:sv.matricula, noches:0, horas:0, pactadas:0, hechas:0, debidas:0, incompletas:0, sinSalida:0, nochesOk:0 };
    x.noches++; x.horas += sv.horas || 0; if (sv.horas == null) x.sinSalida++; x.pactadas += (n.hasta - n.desde) / HORA; x.hechas += sv.completas; x.incompletas += sv.incompletas;
    x.debidas += meta / nc.svs.length; if (nc.ok) x.nochesOk++; });
  const policias = Object.values(pols).sort((a, x) => (a.hechas / (a.debidas || 1)) - (x.hechas / (x.debidas || 1)));
  /* La última noche del mes puede arrancar pasada la medianoche (sábado 23:59):
     ese ingreso cae en el mes siguiente y no es una noche sin policía. */
  const ultima = isoDia(dMes), cruza = !b.parcial && !noches.some(n => n.f === ultima) && todos.some(t => policiasDe(t).some(p => p.entra >= fin && nocheDe(p.entra) === ultima));
  const nochesMes = b.dias - (cruza ? 1 : 0), delMes = noches.filter(n => n.f.startsWith(periodo));
  const nochesSin = Math.max(0, nochesMes - delMes.length), nochesOk = delMes.filter(n => n.ok).length;
  /* Los guardias: la bolsa. Saldo = lo trabajado menos lo debido; la que
     queda del mes anterior se suma (cierre del día 1). */
  const debe = cfg.horasGuardiaMes * (b.dias / dMes), cierre = cfg.bolsa && cfg.bolsa.periodo === mesAnterior(periodo) ? cfg.bolsa.saldos || {} : {};
  const guardias = b.guardias.map(g => { const k = normTxt(g.nombre), mes = g.horas - debe, antes = +cierre[k] || 0; return { ...g, k, debe, mes, antes, bolsa:mes + antes }; }).sort((a, x) => a.bolsa - x.bolsa);
  /* El movimiento del barrio. */
  const porTipo = {}; let visitasEn = 0;
  const diasIng = Array(dMes + 1).fill(0);
  aLista(s.pases).filter(Boolean).forEach(p => Object.entries(p.log || {}).forEach(([iso, l]) => { if (!l || !l.in || !en(l.in)) return; const t = p.tipo || 'visita'; porTipo[t] = (porTipo[t] || 0) + 1; visitasEn++; diasIng[+iso.slice(8)]++; }));
  const mens = aLista(s.mensajeria).filter(v => v && en(v.entra || 0)), paq = aLista(s.paquetes).filter(x => x && en(x.recibido || 0));
  const camion = aLista(s.camion).filter(c => c && en(c.entra || 0)), diasCamion = new Set(camion.map(c => +isoDe(new Date(c.entra)).slice(8)));
  const hs = aLista(s.hotelHuespedes).filter(h => h && h.desde && h.desde.slice(0, 7) === periodo), vans = aLista(s.hotelViajes).filter(v => v && v.fecha && v.fecha.slice(0, 7) === periodo);
  const bit = aLista(s.hotelDiario).filter(x => x && x.id && String(x.id).startsWith('bd-') && String(x.id).slice(3, 10) === periodo && x.nota != null);
  const jornadas = aLista(s.mantJornadas).filter(j => j && j.fecha && j.fecha.slice(0, 7) === periodo);
  const obras = aLista(s.obras).filter(Boolean), activas = obras.filter(o => o.estado === 'activa');
  const provs = aLista(s.proveedores).filter(Boolean).map(p => ({ p, e:artEstado(p) }));
  /* Vecinos. */
  const recl = aLista(s.reclamos).filter(Boolean), recAb = recl.filter(r => r.estado !== 'resuelto');
  const finRec = r => { const u = aLista(r.historial).filter(h => h && h.estado === 'resuelto').at(-1); return u ? u.at : 0; };
  const recRes = recl.filter(r => en(finRec(r))), demoras = recRes.map(r => finRec(r) - r.createdAt).filter(v => v > 0);
  const users = aLista(s.users).filter(Boolean), altas = users.filter(u => u.rol === 'vecino' && u.estado === 'aprobado' && en(u.createdAt || 0));
  const inf = aLista(s.infracciones).filter(i => i && en(i.at || 0)), desc = aLista(s.infracciones).filter(i => i && i.estado === 'descargo');
  const sinLeer = aLista(s.privados).filter(h => h && h.con !== 'interno' && h.con !== 'guardia' && h.con !== 'supAdmin' && h.con !== 'supGarita').reduce((a, h) => a + aLista(h.msgs).filter(m => m && m.from !== 'admin' && !m.leido).length, 0);
  const pendIns = users.filter(u => u.estado === 'pendiente');
  const casas = casasRegistradas(), totalCasas = +s.config.casas || 152;
  const correos = aLista(s.correos).filter(c => c && en(c.at || 0)), errores = correos.filter(c => c.estado !== 'enviado');
  const ex = expensasInforme();
  /* El pulso: una fila por tema, una celda por día. */
  const dias = Array.from({ length:dMes }, (_, i) => { const n = i + 1, a = new Date(+periodo.slice(0, 4), +periodo.slice(5) - 1, n).getTime(), z = a + DIA, f = isoDia(n);
    const futuro = a >= fin, noche = noches.find(x => x.f === f), inc = b.incidentes.filter(x => x.at >= a && x.at < z).length, sos = [...b.sos, ...b.dea].filter(x => x.at >= a && x.at < z).length;
    return { n, f, futuro, cruza:cruza && f === ultima, horas:futuro ? 0 : cubiertas(a, Math.min(z, fin)), noche, rondas:noche ? noche.completas : 0, inc, sos, ingresos:diasIng[n], camion:diasCamion.has(n) }; });
  /* El índice del mes: el promedio simple de cinco porcentajes a la vista. */
  const pctGarita = pct(b.cubierto, b.cubierto + b.sinTurno), pctRondas = pct(nochesOk, nochesMes);
  const pctEmerg = b.sos.length + b.dea.length ? pct([...b.sos, ...b.dea].filter(x => x.resp != null).length, b.sos.length + b.dea.length) : 100;
  const pctLotes = ex ? pct(ex.lotes - ex.conDeuda, ex.lotes) : null, recTot = recRes.length + recAb.length, pctRec = recTot ? pct(recRes.length, recTot) : 100;
  const partes = [['Garita con turno abierto', pctGarita], ['Noches con rondas completas', pctRondas], ['Emergencias con respuesta', pctEmerg], ['Lotes al día', pctLotes], ['Reclamos resueltos', pctRec]].filter(x => x[1] != null);
  const indice = partes.length ? Math.round(partes.reduce((a, x) => a + x[1], 0) / partes.length) : null;

  /* LA MESA DE DECISIONES: cada cosa, en su carril y con su peso. */
  const mesa = [], add = (carril, peso, t, x, quien, hacer, v, p = '') => mesa.push({ carril, peso, t, x, quien, hacer, v, p });
  const escal = [...b.sos, ...b.dea].filter(x => x.escaladoAt).length, sinResp = [...b.sos, ...b.dea].filter(x => x.resp == null).length;
  if (escal || sinResp) add('urgente', 100, `${plural(escal + sinResp, 'emergencia', 'emergencias')} sin respuesta a tiempo`, [escal && plural(escal, 'escalada a la supervisión', 'escaladas a la supervisión'), sinResp && plural(sinResp, 'sin registro de la garita', 'sin registro de la garita')].filter(Boolean).join(' y ') + '.', 'Empresa de vigilancia', 'Pedir explicación por escrito y repasar el protocolo del SOS.', 'informe-servicio', periodo);
  if (b.sinTurno >= HORA) add('urgente', 90, `${minTxt(b.sinTurno)} sin turno abierto en la garita`, `La garita estuvo cubierta el ${pctGarita ?? '—'} % del mes.`, 'Empresa de vigilancia', 'Revisar los días en rojo del pulso y descontar lo no cubierto.', 'turnos');
  if (nochesSin) add('urgente', 85, `${plural(nochesSin, 'noche', 'noches')} sin policía`, `Hubo servicio ${delMes.length} de ${nochesMes} noches.`, 'Supervisión de policía', 'Confirmar si faltó el servicio o no se registró el ingreso.', 'turnos');
  const artMal = provs.filter(x => x.e[1] === 'danger');
  if (artMal.length) add('urgente', 80, `${plural(artMal.length, 'proveedor', 'proveedores')} con ART vencida`, artMal.slice(0, 3).map(x => x.p.empresa).join(', '), 'Proveedor', 'No dejar ingresar hasta que presente la ART al día.', 'proveedores');
  if (b.incidentes.length) add('urgente', 70, `${plural(b.incidentes.length, 'incidente', 'incidentes')} en el libro de guardia`, 'Revisar cada uno y dejar por escrito cómo se cerró.', 'Administración', 'Leerlos abajo y decidir si van al Consejo.', 'bitacora');
  if (ex && ex.judiciales) add('reclamable', 75, `${plural(ex.judiciales, 'lote', 'lotes')} en gestión judicial`, `${plataCorta(ex.judMonto)}: el ${pct(ex.judMonto, ex.total)} % de toda la deuda.`, 'Estudio jurídico', 'Pedir el estado de cada expediente.', 'cobranzas', 'morosos');
  if (ex && ex.conDeuda) add('reclamable', 72, `${plural(ex.conDeuda, 'lote', 'lotes')} con deuda de expensas`, `${plataCorta(ex.total)} a cobrar (liquidación de ${nombrePeriodo(ex.periodo)})${ex.soloInteres ? `, con ${ex.soloInteres} lotes más que deben solo interés` : ''}.`, 'Propietarios', 'Mandar el aviso de deuda; empezar por los diez más grandes.', 'cobranzas', 'morosos');
  const bajos = policias.filter(x => x.hechas < x.debidas);
  if (bajos.length) add('reclamable', 60, `${plural(bajos.length, 'policía', 'policías')} por debajo de las rondas obligatorias`, `Faltaron ${Math.round(bajos.reduce((a, x) => a + x.debidas - x.hechas, 0))} rondas completas.`, 'Supervisión de policía', 'Reclamar con el detalle por policía de este informe.', 'turnos');
  const hNeg = guardias.filter(g => g.bolsa < -0.5), faltan = hNeg.reduce((a, g) => a - g.bolsa, 0);
  if (hNeg.length) add('reclamable', 55, `Faltan ${horasTxt(faltan)} h de guardia`, `${plural(hNeg.length, 'guardia', 'guardias')} por debajo de ${cfg.horasGuardiaMes} h.`, 'Empresa de vigilancia', 'Pedir que se recuperen o descontar de la factura.', 'turnos');
  const obrasV = activas.filter(o => o.finEstimado && o.finEstimado < hoy);
  if (obrasV.length) add('reclamable', 45, `${plural(obrasV.length, 'obra pasada de fecha', 'obras pasadas de fecha')}`, obrasV.slice(0, 3).map(o => o.casa).join(', '), 'Propietario', 'Pedir fecha nueva o aplicar el reglamento.', 'obras', 'activas');
  if (recAb.length){ const viejos = recAb.filter(r => Date.now() - r.createdAt > 7 * DIA).length;
    add('solucionable', 50 + viejos, `${plural(recAb.length, 'reclamo abierto', 'reclamos abiertos')}`, viejos ? `${viejos === 1 ? 'Uno lleva' : viejos + ' llevan'} más de 7 días sin cerrar.` : 'Todos de esta semana.', 'Administración', 'Contestar y cerrar los más viejos primero.', 'reclamos'); }
  if (pendIns.length) add('solucionable', 40, `${plural(pendIns.length, 'inscripción', 'inscripciones')} sin aprobar`, 'Vecinos esperando para entrar a la app.', 'Administración', 'Aprobar o rechazar.', 'admin', 'pendientes');
  if (b.petPend) add('solucionable', 38, `${plural(b.petPend, 'pedido firmado', 'pedidos firmados')} sin recibir por la garita`, 'Lo firmó el vecino y la garita todavía no lo tomó.', 'Garita', 'Mandarle un mensaje a la garita.', 'privado', 'interno');
  if (desc.length) add('solucionable', 36, `${plural(desc.length, 'descargo', 'descargos')} por resolver`, 'Infracciones con descargo presentado.', 'Administración', 'Resolver cada descargo.', 'infracciones');
  if (sinLeer) add('solucionable', 34, `${plural(sinLeer, 'mensaje', 'mensajes')} de vecinos sin leer`, 'Conversaciones privadas con la Administración.', 'Administración', 'Responder.', 'privado', 'admin');
  if (b.sinVisto) add('solucionable', 30, `${plural(b.sinVisto, 'parte', 'partes')} de turno sin visto`, 'La supervisión todavía no los revisó.', 'Supervisión de garita', 'Pedirle que los vise.', 'turnos');
  if (errores.length) add('solucionable', 28, `${plural(errores.length, 'correo', 'correos')} sin salir`, 'Quedaron en la bandeja de salida.', 'Administración', 'Mandarlos de nuevo.', 'correos-enviados');
  mesa.sort((a, x) => x.peso - a.peso);
  /* Ideas para el mes que viene, según lo que pasó. */
  const ideas = [];
  if (casas / totalCasas < .7) ideas.push(`Solo ${casas} de ${totalCasas} casas están en la app (${pct(casas, totalCasas)} %). Conviene una campaña con la garita, que los invite al entregar paquetes.`);
  if (ex && ex.conDeuda / ex.lotes > .2) ideas.push('Más de uno de cada cinco lotes tiene deuda: conviene ofrecer un plan de pagos en la app.');
  if (recl.length) { const cat = {}; recl.forEach(r => { cat[r.categoria || 'otros'] = (cat[r.categoria || 'otros'] || 0) + 1; }); const top = Object.entries(cat).sort((a, x) => x[1] - a[1])[0]; if (top[1] >= 3) ideas.push(`El tema que más se repite en los reclamos es «${top[0]}» (${top[1]}): vale un comunicado o una obra de fondo.`); }
  if (activas.length) ideas.push(`Hay ${plural(activas.length, 'obra activa', 'obras activas')}: conviene avisar a los vecinos de al lado los días de camiones.`);
  return { ...b, dMes, dias_:dias, meta, noches, nochesMes, nochesOk, nochesSin, policias, guardias, debeMes:debe, horasMes:cfg.horasGuardiaMes, porTipo, visitasEn, mens, paq, camion, diasCamion:diasCamion.size,
    hs, paxNoches:hs.reduce((a, h) => a + (+h.pax || 1) * Math.max(1, Math.round((fechaDe(h.hasta) - fechaDe(h.desde)) / DIA)), 0), vans, vansHechos:vans.filter(v => v.estado === 'hecho').length, notaHotel:bit.length ? bit.reduce((a, x) => a + (+x.nota || 0), 0) / bit.length : null,
    jornadas, obrasNuevas:obras.filter(o => en(o.createdAt || 0)), activas, obrasV, provs, artMal, recl, recAb, recRes, recNuevos:recl.filter(r => en(r.createdAt || 0)), demoraRec:demoras.length ? demoras.reduce((a, v) => a + v, 0) / demoras.length : null,
    altas, pendIns, inf, desc, sinLeer, casas, totalCasas, comunicados:aLista(s.comunicados).filter(c => c && en(c.at || c.creado || 0)), correosMes:correos, errores, ex, partes, indice, mesa, ideas, sim:s.simulacion || null };
}

/* ---------- el informe: en tablas, para que salga igual en la app, el correo y el PDF ---------- */
const INF_COL = { urgente:['#c9302c', '#fdecea', 'Urgente', 'Enfrentar ya'], reclamable:['#946000', '#fdf4dc', 'Reclamable', 'A quién y qué reclamarle'], solucionable:['#14784b', '#e6f6ee', 'Solucionable', 'Lo resuelve la Administración'] };
function informeAdminHTML(d, { correo = false } = {}){
  const AZ = '#0b3c47', VE = '#0d6b66', GR = '#5f6f6c', BO = '#e2e8e6', c = Store.s.config;
  const OK = '#14784b', AM = '#e0a100', RO = '#c9302c', VA = '#e4eaE8';
  const ir = (v, p, txt) => correo ? `<a href="${esc(urlApp(p ? v + '/' + p : v))}" style="color:${VE};font-weight:700">${txt}</a>` : `<a href="#" data-a="abrir" data-v="${esc(v)}" data-p="${esc(p || '')}" style="color:${VE};font-weight:700;display:inline-block;padding:5px 2px;margin:-5px -2px">${txt}</a>`;
  const sello = (real, txt) => d.sim ? `<span style="font-size:9.5px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;padding:2px 7px;border-radius:99px;margin-left:8px;vertical-align:2px;background:${real ? '#e6f6ee' : '#f0e9fb'};color:${real ? OK : '#6a3fb5'}">${txt || (real ? 'Dato real' : 'Simulado')}</span>` : '';
  const h2 = (n, t, real) => `<h2 style="font-size:17px;color:${AZ};margin:30px 0 10px;padding:0 0 7px;border-bottom:3px solid ${VE}"><span style="color:${VE};font-weight:800">${n}</span>&nbsp; ${t}${sello(real)}</h2>`;
  const kpi = (n, t, sub = '', col = AZ) => `<td style="width:25%;padding:4px;vertical-align:top"><div style="border:1px solid ${BO};border-radius:12px;padding:12px 6px;text-align:center;background:#fff"><div style="font-size:23px;font-weight:800;color:${col};line-height:1.1">${n}</div><div style="font-size:10px;color:${GR};text-transform:uppercase;letter-spacing:.03em;margin-top:5px;line-height:1.25">${t}</div>${sub ? `<div style="font-size:10.5px;color:${GR};margin-top:2px">${sub}</div>` : ''}</div></td>`;
  const kpis = (...f) => `<table style="width:100%;border-collapse:collapse;table-layout:fixed;margin:0 0 8px"><tr>${f.join('')}</tr></table>`;
  const tabla = (cab, filas, vacioTxt, der = []) => filas.length ? `<div style="overflow-x:auto"><table style="width:100%;min-width:440px;border-collapse:collapse;font-size:12.5px"><tr>${cab.map((x, i) => `<th style="text-align:${der.includes(i) ? 'right' : 'left'};background:#f0f4f3;color:#456;font-size:10px;text-transform:uppercase;letter-spacing:.04em;padding:7px 8px;border-bottom:1px solid ${BO}">${x}</th>`).join('')}</tr>
    ${filas.map((f, n) => `<tr style="background:${n % 2 ? '#fafcfb' : '#fff'}">${f.map((x, i) => `<td style="padding:7px 8px;border-bottom:1px solid ${BO};vertical-align:top;${der.includes(i) ? 'text-align:right;font-variant-numeric:tabular-nums' : ''}">${x}</td>`).join('')}</tr>`).join('')}</table></div>` : `<p style="margin:0;color:${GR};font-size:13px">${vacioTxt}</p>`;
  const barra = (p, col) => `<table style="width:100%;border-collapse:collapse;height:8px"><tr><td style="width:${Math.max(0, Math.min(100, p))}%;background:${col};height:8px;border-radius:4px 0 0 4px;font-size:0;line-height:0">&nbsp;</td><td style="background:${VA};height:8px;font-size:0;line-height:0">&nbsp;</td></tr></table>`;
  const colPct = p => p >= 90 ? OK : p >= 70 ? AM : RO;
  const tapar = t => correo ? taparDatos(t) : t;
  const fh = at => `${fechaCorta(isoDe(new Date(at)))} ${hora(at)}`;
  /* La tapa. */
  const [ay, am] = d.periodo.split('-').map(Number), mesTxt = (MESES_LARGO[am] || '').replace(/^./, x => x.toUpperCase());
  const colI = d.indice == null ? GR : d.indice >= 85 ? '#6fe0a8' : d.indice >= 65 ? '#ffd166' : '#ff9d94';
  const nU = d.mesa.filter(x => x.carril === 'urgente').length, nR = d.mesa.filter(x => x.carril === 'reclamable').length, nS = d.mesa.filter(x => x.carril === 'solucionable').length;
  const tapa = `<table style="width:100%;border-collapse:collapse;background:${AZ};background:linear-gradient(135deg,${VE},${AZ});border-radius:16px"><tr>
    <td style="padding:24px 10px 24px 24px;color:#fff;vertical-align:middle"><div style="font-size:11px;letter-spacing:.2em;text-transform:uppercase;opacity:.82">Barrio ${esc(c.nombre)} · para la Administración</div>
      <div style="font-size:42px;font-weight:800;line-height:1.05;margin-top:6px;letter-spacing:-.02em">${esc(mesTxt)}</div><div style="font-size:16px;opacity:.85;margin-top:2px">${ay} · informe mensual${d.parcial ? ' · parcial, hasta hoy' : ''}</div></td>
    <td style="width:150px;padding:18px 22px 18px 0;text-align:center;vertical-align:middle;color:#fff"><div style="font-size:54px;font-weight:800;line-height:1;color:${colI}">${d.indice ?? '—'}</div><div style="font-size:10px;letter-spacing:.1em;text-transform:uppercase;opacity:.85;margin-top:5px">índice del barrio<br>sobre 100</div></td></tr></table>`;
  const aviso = d.sim ? `<table style="width:100%;border-collapse:collapse;margin:12px 0 0"><tr><td style="background:#f0e9fb;border-left:5px solid #6a3fb5;border-radius:8px;padding:11px 14px;font-size:13px;color:#3d2a66"><b>Simulación para ver el diseño.</b> ${esc(d.sim.texto || '')}</td></tr></table>` : '';
  /* Los tres números de arriba. */
  const carriles = `<table style="width:100%;border-collapse:collapse;table-layout:fixed;margin-top:14px"><tr>${[['urgente', nU], ['reclamable', nR], ['solucionable', nS]].map(([k, n]) => `<td style="padding:0 3px"><div style="background:${INF_COL[k][1]};border-radius:12px;padding:11px 2px;text-align:center"><div style="font-size:27px;font-weight:800;color:${INF_COL[k][0]};line-height:1">${n}</div><div style="font-size:9.5px;font-weight:800;color:${INF_COL[k][0]};text-transform:uppercase;letter-spacing:.02em;margin-top:4px">${INF_COL[k][2]}</div></div></td>`).join('')}</tr></table>`;
  /* La mesa. */
  const carril = k => { const ls = d.mesa.filter(x => x.carril === k), [col, fon, nom, sub] = INF_COL[k];
    return `<table style="width:100%;border-collapse:collapse;margin:0 0 10px;border:1px solid ${BO};border-radius:12px;overflow:hidden"><tr><td colspan="2" style="background:${col};color:#fff;padding:9px 14px;font-size:13px"><b style="font-size:14px">${nom}</b> &nbsp;·&nbsp; ${sub}</td></tr>
      ${ls.length ? ls.map((x, i) => `<tr style="background:${i % 2 ? '#fff' : fon}"><td style="width:34px;padding:10px 0 10px 12px;vertical-align:top;font-size:18px;font-weight:800;color:${col}">${i + 1}</td>
        <td style="padding:9px 14px 9px 8px;font-size:13px;vertical-align:top"><b style="font-size:14px">${esc(x.t)}</b><br><span style="color:${GR}">${esc(tapar(x.x))}</span><br><span style="font-size:12px"><b>${esc(x.quien)}:</b> ${esc(x.hacer)} ${x.v ? ir(x.v, x.p, 'Ir →') : ''}</span></td></tr>`).join('') : `<tr><td colspan="2" style="padding:11px 14px;font-size:13px;color:${GR}">Nada en este carril. Bien.</td></tr>`}</table>`; };
  /* El pulso: una tira por tema, como las páginas de estado. */
  const celda = (col, tit, txt = '') => `<td title="${esc(tit)}" style="background:${col};height:20px;border:1px solid #fff;font-size:8.5px;color:#fff;text-align:center;padding:0;line-height:1">${txt}</td>`;
  const maxIng = Math.max(1, ...d.dias_.map(x => x.ingresos));
  const secu = v => { const t = v / maxIng; return t === 0 ? '#eef3f1' : t < .25 ? '#bfe3dd' : t < .5 ? '#7cc7bc' : t < .75 ? '#2f9b90' : '#0d6b66'; };
  const fila = (nom, fn) => `<tr><td style="font-size:11px;color:${GR};padding:0 8px 0 0;white-space:nowrap;width:70px">${nom}</td>${d.dias_.map(fn).join('')}</tr>`;
  const pulso = `<div style="overflow-x:auto"><table style="width:100%;min-width:560px;border-collapse:collapse;table-layout:auto"><tr><td></td>${d.dias_.map(x => `<td style="font-size:8.5px;color:${GR};text-align:center;padding-bottom:2px">${x.n}</td>`).join('')}</tr>
    ${fila('Garita', x => x.futuro ? celda(VA, 'Sin datos') : celda(x.horas >= 23 ? OK : x.horas >= 20 ? AM : RO, `Día ${x.n}: ${horasTxt(x.horas)} h con turno`))}
    ${fila('Rondas', x => x.futuro || x.cruza ? celda(VA, x.cruza ? 'Esta noche entró después de medianoche: cuenta en el mes siguiente' : 'Sin datos') : celda(!x.noche ? RO : x.rondas >= d.meta ? OK : AM, `Noche del ${x.n}: ${x.noche ? x.rondas + ' de ' + d.meta + ' rondas' : 'sin policía'}`))}
    ${fila('Novedades', x => x.futuro ? celda(VA, 'Sin datos') : celda(x.sos ? RO : x.inc ? AM : OK, `Día ${x.n}: ${x.sos} emergencias, ${x.inc} incidentes`, x.sos + x.inc || ''))}
    ${fila('Ingresos', x => x.futuro ? celda(VA, 'Sin datos') : celda(secu(x.ingresos), `Día ${x.n}: ${x.ingresos} ingresos`))}
    ${fila('Camión', x => celda(x.camion ? AZ : '#eef3f1', `Día ${x.n}: ${x.camion ? 'pasó' : 'sin registro'}`))}</table></div>
    <table style="border-collapse:collapse;margin-top:8px;font-size:11px;color:${GR}"><tr>${[[OK, 'Bien'], [AM, 'Parcial'], [RO, 'Falta']].map(([k, t]) => `<td style="width:11px;background:${k};font-size:0">&nbsp;</td><td style="padding:0 12px 0 5px">${t}</td>`).join('')}<td style="width:11px;background:#0d6b66;font-size:0">&nbsp;</td><td style="padding:0 5px">Más ingresos</td></tr></table>`;
  const indiceDet = `<table style="width:100%;border-collapse:collapse;font-size:12.5px">${d.partes.map(([t, p]) => `<tr><td style="padding:4px 10px 4px 0;width:44%">${t}</td><td style="padding:4px 0;vertical-align:middle">${barra(p, colPct(p))}</td><td style="padding:4px 0 4px 10px;width:58px;text-align:right;font-weight:800;white-space:nowrap">${p} %</td></tr>`).join('')}</table><p style="font-size:11.5px;color:${GR};margin:6px 0 0">El índice ${d.indice ?? '—'} es el promedio simple de estos ${d.partes.length} porcentajes. Sin secretos.</p>`;
  /* Personal. */
  const sgn = v => v > .5 ? OK : v < -.5 ? RO : GR;
  const tGuardias = tabla(['Guardia', 'Turnos', 'Trabajó', 'Debía', 'Del mes', 'Venía', 'Bolsa'], d.guardias.map(g => [esc(g.nombre), g.turnos, horasTxt(g.horas), horasTxt(g.debe), conSigno(g.mes), conSigno(g.antes), `<b style="color:${sgn(g.bolsa)}">${conSigno(g.bolsa)} h</b>`]), 'No se anotaron guardias.', [1, 2, 3, 4, 5, 6]);
  const tPol = tabla(['Policía', 'Noches', 'Horas', 'Pactadas', 'Dif.', 'Rondas', 'Cumplió'], d.policias.map(p => { const pc = pct(p.hechas, p.debidas) ?? 0, dif = p.horas - p.pactadas;
    return [`${esc(p.nombre)}${p.matricula ? `<br><span style="color:${GR};font-size:11px">Mat. ${esc(p.matricula)}</span>` : ''}`, `${p.nochesOk}/${p.noches}`, horasTxt(p.horas), horasTxt(p.pactadas), `<span style="color:${sgn(dif)}">${conSigno(dif)}</span>`, `${p.hechas}/${Math.round(p.debidas)}${p.incompletas ? `<br><span style="color:${RO};font-size:11px">${p.incompletas} incompl.</span>` : ''}`, `<b style="color:${colPct(pc)}">${pc} %</b>`]; }), 'No hubo servicios de policía.', [1, 2, 3, 4, 5, 6]);
  /* Movimiento. */
  const mov = [['Visitas', d.porTipo.visita], ['Proveedores y obras', d.porTipo.proveedor], ['Personal fijo', d.porTipo.personal], ['Delivery', d.porTipo.delivery], ['Uber, DiDi y taxis', d.porTipo.remis], ['Invitados a eventos', d.porTipo.invitado], ['Correo y mensajería', d.mens.length], ...(d.paq.length ? [['Paquetes en garita', d.paq.length]] : []), ['Camión de la basura', d.camion.length], ['Llegadas sin aviso', d.llegadas.length]].map(([a, n]) => [a, n || 0]).sort((a, x) => x[1] - a[1]);
  const maxMov = Math.max(1, ...mov.map(x => x[1]));
  const tMov = `<table style="width:100%;border-collapse:collapse;font-size:12.5px">${mov.map(([a, n]) => `<tr><td style="padding:3px 10px 3px 0;width:42%">${a}</td><td style="padding:3px 0;vertical-align:middle">${barra(n / maxMov * 100, VE)}</td><td style="padding:3px 0 3px 10px;width:50px;text-align:right;font-weight:800">${n}</td></tr>`).join('')}</table>`;
  /* Expensas. */
  const ex = d.ex, tEx = !ex ? `<p style="color:${GR};font-size:13px">Todavía no hay una liquidación emitida.</p>` : `
    ${kpis(kpi(plataCorta(ex.total), 'Deuda a cobrar', `liquidación de ${esc(nombrePeriodo(ex.periodo))}`, RO), kpi(`${ex.conDeuda}/${ex.lotes}`, 'Lotes con deuda', `${pct(ex.conDeuda, ex.lotes)} %${ex.soloInteres ? ` · ${ex.soloInteres} más solo con interés` : ''}`, AM), kpi(plataCorta(ex.judMonto), 'En juicio', plural(ex.judiciales, 'lote', 'lotes')), kpi(plataCorta(ex.gastos), 'Gastos del mes'))}
    ${ex.banco ? `<p style="font-size:12.5px;margin:6px 0 10px">Banco: entró <b>${plata((ex.banco.cobrosTermino || 0) + (ex.banco.cobrosAdeudadas || 0) + (ex.banco.cobrosIntereses || 0) + (ex.banco.cobrosACuenta || 0))}</b>, salió <b>${plata(ex.banco.egresos)}</b>, saldo al cierre <b>${plata(ex.banco.saldoCierre)}</b>.</p>` : ''}
    ${correo ? `<p style="font-size:12.5px;color:${GR};margin:6px 0 0">El detalle por lote no viaja por correo: está en la app, en este mismo informe.</p>` : tabla(['Los 10 más grandes', 'Deuda', ''], ex.top.map(m => [esc(m.lote), plata(m.total), m.judicial ? `<b style="color:${RO}">Judicial</b>` : `${m.meses ? plural(m.meses, 'mes', 'meses') : ''}`]), 'Sin deudas.', [1])}`;
  /* Vecinos. */
  const tVec = kpis(kpi(`${d.casas}/${d.totalCasas}`, 'Casas en la app', `${pct(d.casas, d.totalCasas)} %`), kpi(d.altas.length, 'Altas del mes'), kpi(d.pendIns.length, 'Sin aprobar', '', d.pendIns.length ? AM : OK), kpi(d.inf.length, 'Infracciones'))
    + kpis(kpi(d.recNuevos.length, 'Reclamos nuevos'), kpi(d.recRes.length, 'Resueltos', '', OK), kpi(d.recAb.length, 'Abiertos', '', d.recAb.length ? AM : OK), kpi(d.demoraRec == null ? '—' : Math.round(d.demoraRec / DIA) + ' d', 'Demora media'));
  return `<div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:760px;margin:0 auto;color:#13211f;line-height:1.5;background:#fff">
    ${tapa}${aviso}${carriles}
    ${h2(1, 'Mesa de decisiones', false).replace(/<span style="font-size:9.5px[^]*?<\/span>/, '')}
    <p style="font-size:13px;color:${GR};margin:-2px 0 10px">Ordenado de lo más importante a lo menos, con quién tiene que actuar y qué hacer.</p>
    ${carril('urgente')}${carril('reclamable')}${carril('solucionable')}
    ${h2(2, 'El pulso del mes, día por día', false)}${pulso}<div style="height:12px"></div>${indiceDet}
    ${h2(3, 'Seguridad', false)}
    ${kpis(kpi(d.sos.length + d.dea.length, 'Emergencias', '', d.sos.length + d.dea.length ? AM : OK), kpi(minTxt(d.respMedia), 'Respuesta media'), kpi(d.incidentes.length, 'Incidentes', '', d.incidentes.length ? AM : OK), kpi(d.alertas.length, 'Alertas'))}
    ${tabla(['Fecha y hora', 'Lo que anotó la garita'], d.incidentes.map(b => [fh(b.at), esc(tapar(b.texto))]), 'No se anotaron incidentes.')}
    ${h2(4, 'Guardias: horas y bolsa', false)}
    <p style="font-size:13px;margin:0 0 8px">${plural(d.turnos.length, 'turno', 'turnos')} · ${minTxt(d.cubierto)} con turno abierto${d.sinTurno >= HORA ? ` · <b style="color:${RO}">${minTxt(d.sinTurno)} sin turno</b>` : ''}. Cada guardia debía ${horasTxt(d.debeMes)} h (base ${d.horasMes} h por mes, se cambia en Supervisión).</p>${tGuardias}
    ${h2(5, 'Policías: horas y rondas obligatorias', false)}
    <p style="font-size:13px;margin:0 0 8px">Obligatorias: ${d.meta} rondas completas por noche, repartidas si hubo más de uno. Noches cumplidas: <b>${d.nochesOk} de ${d.nochesMes}</b>${d.nochesSin ? ` · <b style="color:${RO}">${plural(d.nochesSin, 'noche', 'noches')} sin policía</b>` : ''}.</p>${tPol}
    ${h2(6, 'Movimiento del barrio', false)}
    ${kpis(kpi(d.ingresos, 'Ingresos'), kpi(d.egresos, 'Egresos'), kpi(d.diasCamion, 'Días de camión'), kpi(d.revisiones, 'Casas solas revisadas'))}${tMov}
    ${h2(7, 'Expensas', !!ex)}${tEx}
    ${h2(8, 'Vecinos', false)}${tVec}
    ${h2(9, 'Obras y proveedores', false)}
    ${kpis(kpi(d.activas.length, 'Obras activas'), kpi(d.obrasNuevas.length, 'Obras nuevas'), kpi(d.obrasV.length, 'Pasadas de fecha', '', d.obrasV.length ? AM : OK), kpi(d.artMal.length, 'ART vencidas', '', d.artMal.length ? RO : OK))}
    ${h2(10, 'Hotel y mantenimiento', false)}
    ${kpis(kpi(d.hs.reduce((a, h) => a + (+h.pax || 1), 0), 'Huéspedes', plural(d.hs.length, 'reserva', 'reservas')), kpi(d.paxNoches, 'Noches por persona'), kpi(`${d.vansHechos}/${d.vans.length}`, 'Traslados hechos'), kpi(d.notaHotel == null ? '—' : d.notaHotel.toFixed(1).replace('.', ','), 'Nota media del hotel'))}
    <p style="font-size:13px;margin:4px 0 0">Mantenimiento: ${plural(d.jornadas.length, 'jornada registrada', 'jornadas registradas')}.</p>
    ${h2(11, 'Lo que mandó la app este mes', false)}
    <table style="width:100%;border-collapse:collapse;font-size:12.5px">${CORREO_GRUPOS.map(g => [g[1], d.correosMes.filter(c => g[3].includes(c.tipo)).length]).filter(x => x[1]).map(([a, n]) => `<tr><td style="padding:3px 0;border-bottom:1px solid ${BO}">${a}</td><td style="padding:3px 0;border-bottom:1px solid ${BO};text-align:right;font-weight:800">${n}</td></tr>`).join('') || `<tr><td style="color:${GR}">Sin correos en el período.</td></tr>`}</table>
    <p style="font-size:12.5px;margin:6px 0 0">${ir('correos-enviados', '', 'Ver el listado completo y traer cada PDF →')}</p>
    ${d.ideas.length ? `${h2(12, 'Ideas para el mes que viene', false).replace(/<span style="font-size:9.5px[^]*?<\/span>/, '')}<table style="width:100%;border-collapse:collapse;font-size:13px">${d.ideas.map(t => `<tr><td style="width:20px;vertical-align:top;color:${VE};font-weight:800;padding:4px 0">→</td><td style="padding:4px 0">${esc(t)}</td></tr>`).join('')}</table>` : ''}
    <div style="margin-top:26px;padding-top:12px;border-top:1px solid ${BO};font-size:11.5px;color:${GR}">Informe generado por la app del barrio el ${fechaLarga(hoyISO())} a las ${hora(Date.now())} h. ${correo ? 'Por correo va sin lotes ni nombres de vecinos; completo, en la app. ' : ''}Contiene datos personales: es de uso interno y reservado (Ley 25.326, arts. 9 y 10).</div>
  </div>`;
}
const docInformeAdmin = (d, correo = false) => docPdf({ titulo:`Informe mensual · ${d.nombre}`, sello:'Administración', cuerpo:informeAdminHTML(d, { correo }) });

/* Al cerrar el mes, la bolsa de cada guardia pasa al mes siguiente. */
function cerrarBolsa(periodo){
  const saldos = {}; datosAdmin(periodo).guardias.forEach(g => { saldos[g.k] = Math.round(g.bolsa * 10) / 10; });
  Store.cambiar(s => { s.config.supervision = Object.assign({}, cfgSup(), { bolsa:{ periodo, saldos } }); });
}
async function mandarInformeAdmin(periodo, para){
  const d = datosAdmin(periodo);
  return Correo.enviarDetalle({ para, asunto:`Informe mensual del barrio · ${d.nombre}`, html:informeAdminHTML(d, { correo:true }), tipo:'informe-admin',
    pdf:{ html:docInformeAdmin(d, true), nombre:`Informe mensual ${periodo}.pdf` } });
}
REGLAS.push({ id:'informe-admin', n:'Día 1 → informe mensual del barrio a la Administración',
  d:'El primer día de cada mes le manda a la Administración, con el PDF adjunto, el mes anterior ordenado por importancia: urgente, reclamable y solucionable, más guardias, policías, movimiento, expensas y vecinos. Sale sin lotes ni nombres de vecinos: completo, en la app.',
  run(s, hoy){
    if (!esAdmin() || cfgSup().informeBarrio === false || +hoy.slice(8) > 7 || new Date().getHours() < 8) return 0;
    const prev = mesAnterior(hoy.slice(0, 7)), para = s.config.adminEmail; if (!para) return 0;
    return marca(s, 'informe-admin-' + prev, () => { setTimeout(() => { cerrarBolsa(prev); mandarInformeAdmin(prev, para).then(r => console.info('Informe mensual del barrio', prev, r)); }, 0); });
  } });

R['informe-admin'] = {
  titulo:'Informe mensual del barrio', icon:'file', color:'brand', ancha:true, sub:p => nombreMesInf(/^\d{4}-\d{2}$/.test(p || '') ? p : mesAnterior(hoyISO().slice(0, 7))),
  render(p){
    if (!esAdmin()) return vacio('lock', 'Solo para la Administración.');
    const actual = hoyISO().slice(0, 7), per = /^\d{4}-\d{2}$/.test(p || '') ? p : mesAnterior(actual), meses = [actual, mesAnterior(actual), mesAnterior(mesAnterior(actual))];
    return `<div class="chips">${meses.map(m => `<button class="chip ${m === per ? 'on' : ''}" data-a="abrir" data-v="informe-admin" data-p="${m}">${esc(nombreMesInf(m))}${m === actual ? ' (parcial)' : ''}</button>`).join('')}</div>
      <div class="btns" style="margin:0 0 12px"><button class="btn btn-sm btn-pri" data-a="informe-admin-pdf" data-v="${per}">${I('download')}Ver el PDF</button>
        <button class="btn btn-sm btn-sec" data-a="informe-admin-mandar" data-v="${per}">${I('mail')}Mandármelo por correo</button></div>
      <div class="informe-hoja">${informeAdminHTML(datosAdmin(per))}</div>
      <p class="muted tiny" style="margin-top:10px">${I('clock')} El día 1 de cada mes sale solo por correo el del mes anterior. El correo va sin lotes ni nombres de vecinos; acá se ve completo.</p>`;
  },
};
A['informe-admin-pdf'] = el => { const d = datosAdmin(el.dataset.v); verDoc(`Informe mensual · ${d.nombre}`, docInformeAdmin(d)); };
A['informe-admin-mandar'] = async el => {
  const para = Store.s.config.adminEmail; if (!para){ toast('Falta el correo de la Administración en Ajustes', 'mail'); return; }
  toast('Mandando el informe…', 'mail');
  const r = await mandarInformeAdmin(el.dataset.v, para);
  toast(r.ok ? `Listo: salió a ${para}` : 'No salió: ' + r.error, r.ok ? 'mail' : 'alert');
};

/* ---------- los correos enviados: un listado simple ---------- */
R['correos-enviados'] = {
  titulo:'Correos enviados', icon:'mail', color:'sky', ancha:true, sub:() => 'Todo lo que mandó la app',
  render(p){
    if (!esAdmin()) return vacio('lock', 'Solo para la Administración.');
    const todos = aLista(Store.s.correos).filter(Boolean).slice().sort((a, b) => b.at - a.at);
    const hay = CORREO_GRUPOS.filter(g => todos.some(c => g[3].includes(c.tipo)));
    const g = hay.find(x => x[0] === p), ls = (g ? todos.filter(c => g[3].includes(c.tipo)) : todos).slice(0, 300);
    const est = c => c.estado === 'enviado' ? `<span class="ce-est ok">${I('check')}Salió</span>` : `<span class="ce-est ${c.estado === 'error' ? 'mal' : 'esp'}">${c.estado === 'error' ? 'No salió' : 'En espera'}</span>`;
    return `<div class="chips"><button class="chip ${g ? '' : 'on'}" data-a="abrir" data-v="correos-enviados">Todos · ${todos.length}</button>${hay.map(x => `<button class="chip ${g === x ? 'on' : ''}" data-a="abrir" data-v="correos-enviados" data-p="${x[0]}">${esc(x[1])} · ${todos.filter(c => x[3].includes(c.tipo)).length}</button>`).join('')}</div>
      <p class="muted small" style="margin:0 0 10px">Tocá <b>PDF</b> para ver lo que salió, tal cual. Baja solo ese, y solo en este equipo.</p>
      ${ls.length ? `<div class="ce-lista">${ls.map(c => { const gr = grupoCorreo(c.tipo);
        return `<div class="ce-fila"><time><b>${fechaCorta(isoDe(new Date(c.at)))}</b><span>${hora(c.at)} h</span></time>
          <span class="ce-ic">${I(gr[2])}</span><div class="ce-txt"><b>${esc(c.asunto || '(sin asunto)')}</b><small>${esc(gr[1])} · ${esc(taparMail(c.para))}</small></div>${est(c)}
          <button class="btn btn-xs btn-sec" data-a="correo-traer" data-id="${esc(c.id)}">${I('download')}PDF</button></div>`; }).join('')}</div>` : vacio('mail', 'Todavía no salió ningún correo.')}
      <p class="muted tiny" style="margin-top:10px">${I('lock')} Solo los ve la Administración y se guardan 400 días, hasta los últimos 2.000. Los avisos "Estoy bien" a familiares no quedan acá.</p>`;
  },
};
A['parte-pdf'] = el => { const t = registrosTurno().find(x => x.id === el.dataset.id); if (t) verDoc(`Parte del turno ${t.turno}`, docParte(t)); };
A['correo-traer'] = async el => {
  const c = aLista(Store.s.correos).find(x => x && x.id === el.dataset.id); if (!c) return;
  toast('Trayendo el correo…', 'mail');
  try {
    const v = await CorreoCopia.vista(c);
    if (!v){ toast('Ese correo ya no tiene copia guardada', 'alert'); return; }
    verDoc(c.asunto || 'Correo', v.doc, `${esc(v.nota)} Salió el ${fechaHora(c.at)} h a ${esc(c.para)}.`);
  } catch(e){ toast('No se pudo traer el correo: ' + (e.message || e), 'alert'); }
};

/* ---------- la franja de la garita, arriba de todo ---------- */
function cabinaGarita(d){
  const s = Store.s, t = d.t, g = d.g, nivel = d.sos ? 'mal' : !t || (g && !g.conectada) ? 'mal' : g && !g.activa ? 'warn' : 'ok';
  const msg = aLista(s.privados).filter(h => h && h.con === 'interno').reduce((a, h) => a + aLista(h.msgs).filter(m => m && m.from !== 'admin' && !m.leido).length, 0);
  const estado = d.sos ? plural(d.sos, 'SOS abierto', 'SOS abiertos') : !t ? 'Sin turno abierto' : g && !g.conectada ? 'Desconectada' : g && !g.activa ? 'Minimizada' : 'Conectada';
  const ult = aLista(s.bitacora).filter(b => b && b.texto && b.tipo !== 'turno').slice().sort((a, b) => b.at - a.at).slice(0, 3);
  const prev = mesAnterior(hoyISO().slice(0, 7)), nuevo = +hoyISO().slice(8) <= 10, mes = (MESES_LARGO[+prev.slice(5)] || '');
  const acc = (v, p, ic, tt, sub, n = 0, cls = '') => `<button class="cg-acc ${n ? 'pide' : ''} ${cls}" data-a="abrir" data-v="${v}" data-p="${p}"><span class="cg-acc-ic">${I(ic)}</span><b>${tt}</b><small>${sub}</small>${n ? `<em>${n > 99 ? '99+' : n}</em>` : ''}</button>`;
  return `<section class="cg n-${nivel}" aria-label="La garita ahora">
    <header class="cg-cab"><span class="cg-radar" aria-hidden="true"><i></i><i></i>${I('gate')}</span>
      <div class="cg-tit"><small><span class="cg-punto"></span>La garita ahora · ${esc(estado)}</small><b>${t ? `Turno ${esc(t.turno)}` : 'Sin turno abierto'}</b><span>${t ? esc(aLista(t.guardias).join(', ')) || 'Sin guardias anotados' : 'Hablale a la garita'} · ${plural(d.ingresos, 'ingreso', 'ingresos')} hoy${d.pols.length ? ` · ${plural(d.pols.length, 'policía', 'policías')} de servicio` : ''}</span></div></header>
    ${ult.length ? `<div class="cg-cinta" role="list">${ult.map((b, i) => `<div class="cg-linea" role="listitem" style="--i:${i}"><time>${hora(b.at)}</time><span>${esc(b.texto)}</span></div>`).join('')}</div>` : ''}
    <div class="cg-acciones">
      ${acc('privado', 'interno', 'send', 'Hablar con la garita', msg + d.peticiones ? `${msg ? plural(msg, 'mensaje nuevo', 'mensajes nuevos') : ''}${msg && d.peticiones ? ' · ' : ''}${d.peticiones ? plural(d.peticiones, 'pedido firmado', 'pedidos firmados') : ''}` : 'Mensajes y pedidos', msg + d.peticiones, 'fuerte')}
      ${acc('garita', '', 'eye', 'Mirar la garita', 'Tal cual la ve la guardia')}
      ${acc('bitacora', '', 'book', 'Libro de guardia', 'Todo lo anotado')}
      ${acc('turnos', '', 'clock', 'Turnos y policías', 'Horarios y rondas')}
      ${acc('visitas-barrio', '', 'users', 'Visitas', 'Hoy y próximas')}
      ${acc('alertas', '', 'siren', 'Aviso urgente', 'A todo el barrio')}
    </div>
    <div class="cg-inf"><button class="cg-doc ${nuevo ? 'brilla' : ''}" data-a="abrir" data-v="informe-admin" data-p="${prev}">${I('file')}<span><b>Informe de ${esc(mes)}</b><small>${nuevo ? 'Ya está listo: mirá qué urge' : 'El mes entero, por importancia'}</small></span></button>
      <button class="cg-doc" data-a="abrir" data-v="correos-enviados">${I('mail')}<span><b>Correos enviados</b><small>Con fecha, hora y PDF</small></span></button></div>
  </section>`;
}
