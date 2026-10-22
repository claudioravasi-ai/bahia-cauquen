/* =========================================================
   Inicio, Garita, Visitas y el pase que pide la visita.
   ========================================================= */

/* ---------- piezas ---------- */
const teja = ({ v, p = '', a = 'abrir', icon, color = 'brand', t, s = '', n = '', badge = 0, destaca = false, grande = false, busca = '' }) =>
  `<button class="teja ${destaca ? 'destaca' : ''} ${grande ? 'grande' : ''}" data-a="${a}" data-v="${v || ''}" data-p="${esc(p)}"${busca ? ` data-busca="${esc(normTxt(busca + ' ' + t + ' ' + s))}"` : ''}>
    <div class="arriba"><span class="ic ic-${color}">${I(icon)}</span>${badge ? `<span class="dot-badge">${badge > 99 ? '99+' : badge}</span>` : n !== '' ? `<span class="n">${n}</span>` : ''}</div>
    <div><b>${t}</b>${s ? `<small>${s}</small>` : ''}</div></button>`;
const superficie = ({ a = 'abrir', v = '', p = '', id = '', icon, color = 'brand', t, s = '', cls = '' }) =>
  `<button class="superficie ${cls}" data-a="${a}" data-v="${esc(v)}" data-p="${esc(p)}" data-id="${esc(id)}">
    <span class="ic ic-${color}">${I(icon)}</span><span class="txt"><b>${t}</b>${s ? `<small>${s}</small>` : ''}</span>${I('right')}</button>`;
const aviso = (nivel, icon, t, x, acciones = '') =>
  `<div class="aviso a-${nivel}">${I(icon)}<div class="txt"><b>${t}</b>${x || ''}${acciones ? `<div class="acciones">${acciones}</div>` : ''}</div></div>`;
const vacio = (icon, t) => `<div class="vacio">${I(icon)}${t}</div>`;
const sec = (t, extra = '') => `<div class="sec"><h2>${t}</h2>${extra}</div>`;

/* ---------- pases ---------- */
const TIPOS_PASE = {
  visita:    { n:'Visita', icon:'users', c:'brand' },
  delivery:  { n:'Delivery', icon:'box', c:'wood' },
  proveedor: { n:'Proveedor / obra', icon:'wrench', c:'accent' },
  personal:  { n:'Personal fijo', icon:'user', c:'sky' },
  remis:     { n:'Uber, DiDi o taxi', icon:'car', c:'warn' },
  invitado:  { n:'Invitado a evento', icon:'flame', c:'wood' },
};
const ESTADO_TXT = { esperado:'Esperado', adentro:'Adentro', salio:'Salió', vencido:'Vencido', cancelado:'Cancelado', futuro:'Próximo', noingreso:'No ingresó', nollego:'Cancelado · no ingresó' };
function paseValidoEn(p, iso){
  if (p.cancelado) return false;
  if (p.dias && p.dias.length) return iso >= p.fecha && iso <= (p.fechaFin || p.fecha) && p.dias.includes(fechaDe(iso).getDay());
  return p.fecha === iso;
}
function estadoPase(p, iso = hoyISO()){
  if (p.cancelado) return 'cancelado';
  const l = p.log && p.log[iso];
  if (l && l.out) return 'salio';
  if (l && l.in) return 'adentro';
  if (!p.dias?.length && p.fecha > iso) return 'futuro';
  if (!paseValidoEn(p, iso)) return p.dias?.length && iso < p.fecha ? 'futuro' : 'vencido';
  /* LA VISITA QUE NO VINO (pedido de Claudio, 12-10-2026): a las 2 horas
     de la hora anunciada pasa sola a "No ingresó" (todavía puede llegar:
     "Ingresó" sigue andando); pasada la hora de salida queda "Cancelado ·
     no ingresó", se anota en la bitácora (regla visita-no-ingreso) y sale
     de la pantalla de la garita y de la supervisión (pasesEnPantalla). Si
     igual aparece, la garita la busca y tiene "Pase vencido". */
  const d = minutosDe(p.desde), h = minutosDe(p.hasta);
  if (iso === hoyISO() && h > d){ const m = ahoraMin();
    if (m > h) return 'nollego';
    if (m > d + 120) return 'noingreso'; }
  return 'esperado';
}
/* LAS VISITAS DEL LOTE (pedido de Claudio, 12-10-2026): las que autoriza
   cualquiera de los que viven en el lote las ven todos ("Estela, del 148,
   les aparece a Claudio y a Mónica"), con quién la autorizó, cuándo, y
   cuándo entró y salió. El propietario a distancia no (no vive ahí). */
const paseDeMiLote = (p, u = yo()) => !!p && !!u && (p.hostId === u.id || (/^Lote\s/i.test(u.casa || '') && !esPropDistancia(u) && usuario(p.hostId)?.casa === u.casa));
const pasesDelDia = (iso = hoyISO()) => Store.s.pases.filter(p => paseValidoEn(p, iso) || (p.log && p.log[iso]));
/* Lo que se ve en la garita: sin las visitas que ya no van a venir. */
const pasesEnPantalla = (iso = hoyISO()) => pasesDelDia(iso).filter(p => estadoPase(p, iso) !== 'nollego');
const normPatente = t => String(t || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
/* EL MENSAJE DEL PASE (rediseño 10-10-2026): el QR y el código van en la
   imagen (imagenQR, js/core.js); el texto es corto, con los datos en
   negrita de WhatsApp, y un solo enlace, el del mapa, al final con 📍.
   Ya no va el enlace "Tu QR": la visita recibe el QR en la imagen. */
function datosPase(p){
  const u = usuario(p.hostId) || {};
  return { nombre:p.nombre || '', espera:`${(p.autoriza || u.nombre || 'Vecino').split(' ')[0]} · ${u.casa || ''}`,
    cuando: p.dias?.length ? p.dias.map(d => DIAS[d]).join(' ') : fechaCorta(p.fecha), horario:`${p.desde} a ${p.hasta} h` };
}
function textoPase(p){
  const u = usuario(p.hostId) || {}, c = Store.s.config;
  const cuando = p.dias?.length ? `${p.dias.map(d => DIAS[d]).join(', ')}, de ${p.desde} a ${p.hasta} h (hasta el ${fechaCorta(p.fechaFin)})` : `${fechaLarga(p.fecha)}, de ${p.desde} a ${p.hasta} h`;
  return `🎟️ *Tu pase para el Barrio ${c.nombre}*\n\n` +
    `¡Hola${p.nombre ? ' ' + p.nombre.split(' ')[0] : ''}! ${p.autoriza || u.nombre || 'Un vecino'} (${u.casa || ''}) te espera.\n\n` +
    `📅 ${cuando}\n🔑 Código: *${codigoEspaciado(p.codigo)}*\n\n` +
    `En la garita mostrá el QR de la imagen o decí el código.\n\n` +
    `📍 *Cómo llegar:* ${mapaCorto(c.mapa)}`;
}
/* =========================================================
   EL RECORDATORIO DE UNA HORA ANTES (pedido de Claudio, 12-10-2026: "que
   una hora antes le llegue a la visita por WhatsApp: Hoy vas al barrio, a
   lo de …, no olvides tener preparado el QR de ingreso").
   Una app web no puede mandar un WhatsApp sola desde el número del barrio:
   WhatsApp lo permite solo con su servicio para empresas (Meta), con el
   número verificado, cada mensaje aprobado y un costo por mensaje. Lo que
   sí hace la app, sin costo: una hora antes de la hora anunciada, al
   vecino que la autorizó le llega el aviso (también con el celular
   bloqueado) con el mensaje ya escrito, y con un toque se abre WhatsApp en
   el chat de la visita (si cargó su celular) o para elegirla. Sirve para
   cada día del personal fijo, sin volver a cargar nada. Se apaga por visita
   ("Una hora antes, avisame") o para todo el barrio en Automatizaciones.
   El celular de la visita es opcional y lo ven solo el vecino, la garita
   y la Administración, como el que deja la visita en el enlace.
   ========================================================= */
const telVisita = t => { const x = String(t || '').trim(); return soloDigitos(x).length >= 8 ? x.slice(0, 20) : ''; };
const camposRecordatorio = (p = {}) => `<div class="rec-campos">
    <div class="field"><label>Celular de la visita (opcional)</label><input name="tel" type="tel" inputmode="tel" maxlength="20" autocomplete="off" value="${esc(p.tel || '')}" placeholder="Ej: 2901 15 123456"><div class="ayuda">Para que el pase y el recordatorio se abran directo en su WhatsApp.</div></div>
    <label class="check"><input type="checkbox" name="recordar" ${p.recordar !== false ? 'checked' : ''}><span><b>Una hora antes, avisame</b> para mandarle por WhatsApp que tenga el QR a mano (cada día que viene)</span></label></div>`;
function textoRecordatorio(p){
  const u = usuario(p.hostId) || {}, c = Store.s.config;
  return `🚗 *Hoy vas al Barrio ${c.nombre}*, a lo de *${p.autoriza || u.nombre || 'tu vecino'}*${u.casa ? ` (${u.casa})` : ''}, a las *${p.desde} h*.\n\n` +
    `📲 No olvides tener preparado el *QR de ingreso*: evitá demoras en la barrera de ingreso.${p.codigo ? `\nSi no lo encontrás, decí el código *${codigoEspaciado(p.codigo)}*.` : ''}\n\n¡Te esperamos!`;
}
const waRecordatorio = p => p.tel ? waLink(p.tel, textoRecordatorio(p)) : 'https://wa.me/?text=' + encodeURIComponent(textoRecordatorio(p));
A['visita-recordar'] = el => {
  const p = aLista(Store.s.pases).find(x => x && x.id === el.dataset.id), u = yo();
  if (!p || !u || p.hostId !== u.id) return;
  const est = estadoPase(p);
  if (est === 'adentro' || est === 'salio'){ toast(`${p.nombre} ya entró`, 'check'); return; }
  if (est === 'cancelado'){ toast('Esa visita está cancelada', 'x'); return; }
  hoja(`Recordale a ${esc(p.nombre.split(' ')[0])}`, `<div class="rcd-cab"><span class="rec-reloj">${I('clock')}</span><div><b>${esc(p.nombre)} viene ${p.dias?.length || p.fecha === hoyISO() ? 'hoy' : relDia(p.fecha).toLowerCase()} a las ${esc(p.desde)} h</b><small>Mandale el recordatorio: así tiene el QR a mano y no se demora en la barrera.</small></div></div>
    <div class="rec-burbuja">${esc(textoRecordatorio(p)).replace(/\*([^*]+)\*/g, '<b>$1</b>').replace(/\n/g, '<br>')}<time>${hora(Date.now())}</time></div>
    <a class="btn btn-wa btn-block btn-grande rec-wa" href="${esc(waRecordatorio(p))}" target="_blank" rel="noopener" data-a="visita-recordar-enviado" data-id="${esc(p.id)}">${I('chat')}${p.tel ? `Mandárselo a su WhatsApp` : 'Mandar por WhatsApp'}</a>
    <div class="btns" style="margin-top:8px"><button class="btn btn-sec grow" data-a="copiar" data-v="${esc(textoRecordatorio(p))}">${I('copy')}Copiar el mensaje</button>
      <button class="btn btn-sec grow" data-a="editar-pase" data-id="${esc(p.id)}">${I('edit')}${p.tel ? 'Cambiar su celular' : 'Cargar su celular'}</button></div>
    <button class="cal-boton" data-a="visita-calendario" data-id="${esc(p.id)}"><span class="cal-hoja" aria-hidden="true"><b>${fechaDe(primerDiaCal(datosCalendario(p))).getDate()}</b><small>${esc(MESES[fechaDe(primerDiaCal(datosCalendario(p))).getMonth()])}</small><i>${I('bell')}</i></span><span><b>Mejor: que su teléfono se lo recuerde solo</b><small>Mandale una vez el recordatorio para su calendario y no tenés que acordarte más.</small></span>${I('right')}</button>
    <p class="muted tiny" style="margin:10px 2px 0">${p.tel ? 'Se abre el chat con su número.' : 'Se abre WhatsApp y elegís a quién mandarlo. Si cargás su celular, la próxima vez va directo a su chat.'} Para no recibir más este aviso con ${esc(p.nombre.split(' ')[0])}, destildá "Una hora antes, avisame" en Editar.</p>`);
};
/* Al tocar "Mandar", el enlace abre WhatsApp; acá solo se cierra la hoja. */
A['visita-recordar-enviado'] = () => setTimeout(cerrarHoja, 400);

/* =========================================================
   EL RECORDATORIO EN EL CALENDARIO DE LA VISITA (pedido de Claudio,
   12-10-2026; idea de rrule, 3.7k★: solo la idea, el código es propio).
   El vecino le manda UNA vez un enlace; la visita lo abre y toca "Agregar a
   mi calendario": su teléfono le avisa solo una hora antes, cada día que
   viene, hasta la fecha final, sin la app y sin WhatsApp. Gratis.
   El enlace lleva solo lo que la visita ya sabe (a lo de quién va, el lote,
   los días y el horario), sin DNI, sin patente y sin el código del pase:
   un calendario se copia a la nube del teléfono. No se guarda en la base.
   ========================================================= */
const DIA_ICS = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
const b64url = { a: t => btoa(unescape(encodeURIComponent(t))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''),
  de: t => decodeURIComponent(escape(atob(String(t).replace(/-/g, '+').replace(/_/g, '/')))) };
function datosCalendario(p){ const u = usuario(p.hostId) || {};
  return { n:String(p.nombre || '').split(' ')[0], a:p.autoriza || u.nombre || '', c:u.casa || '', d:aLista(p.dias).join(''), f:p.fecha, u:aLista(p.dias).length ? p.fechaFin || p.fecha : p.fecha, h:p.desde, k:p.hasta }; }
const enlaceCalendario = x => urlApp('cal/' + b64url.a(JSON.stringify(x)));
function leerCalendario(arg){ try { const x = JSON.parse(b64url.de(decodeURIComponent(arg || ''))); return x && /^\d{4}-\d{2}-\d{2}$/.test(x.f) && /^\d{1,2}:\d{2}$/.test(x.h) ? x : null; } catch(e){ return null; } }
const diasDe = x => String(x.d || '').split('').filter(c => /[0-6]/.test(c)).map(Number);
function primerDiaCal(x){ const ds = diasDe(x); if (!ds.length) return x.f; let f = x.f; for (let i = 0; i < 7; i++){ if (ds.includes(fechaDe(f).getDay())) return f; f = sumarDias(f, 1); } return x.f; }
function textosCal(x){ const c = Store.s.config;
  return { titulo:`Barrio ${c.nombre} · a lo de ${x.a || 'tu vecino'}`,
    det:`Hoy vas al Barrio ${c.nombre}, a lo de ${x.a || 'tu vecino'}${x.c ? ' (' + x.c + ')' : ''}, de ${x.h} a ${x.k} h. No olvides tener preparado el QR de ingreso: evitá demoras en la barrera de ingreso.`,
    lugar:`Barrio ${c.nombre}, ${c.domicilio || c.ciudad || 'Ushuaia'}` }; }
/* Los días en palabras: seguidos, "de lunes a viernes"; sueltos, "lunes, miércoles y viernes". */
const diasEnPalabras = ds => { const o = [1, 2, 3, 4, 5, 6, 0].filter(d => ds.includes(d)), n = o.map(d => DIAS_L[d].toLowerCase()), pos = o.map(d => (d + 6) % 7);
  if (o.length === 7) return 'todos los días';
  if (o.length >= 3 && pos.every((p, i) => !i || p === pos[i - 1] + 1)) return `de ${n[0]} a ${n.at(-1)}`;
  return n.length > 1 ? `${n.slice(0, -1).join(', ')} y ${n.at(-1)}` : n[0]; };
const cuandoCal = x => { const ds = diasDe(x); return ds.length ? `${diasEnPalabras(ds)}, de ${x.h} a ${x.k} h, hasta el ${fechaCorta(x.u)}` : `el ${fechaLarga(x.f).toLowerCase()}, de ${x.h} a ${x.k} h`; };
/* El archivo de calendario (formato iCalendar, el que entienden iPhone, Android y Outlook). */
function icsVisita(x){
  const t = textosCal(x), f0 = primerDiaCal(x), ds = diasDe(x);
  const fh = (f, h) => f.replace(/-/g, '') + 'T' + h.replace(':', '').padStart(4, '0') + '00';
  const fin = minutosDe(x.k) > minutosDe(x.h) ? fh(f0, x.k) : f0.replace(/-/g, '') + 'T235900';
  const txt = v => String(v).replace(/\\/g, '\\\\').replace(/;/g, '\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
  const enc = new TextEncoder();
  const plegar = l => { let out = '', act = '', b = 0; for (const ch of l){ const n = enc.encode(ch).length; if (b + n > (out ? 74 : 75)){ out += act + '\r\n '; act = ''; b = 0; } act += ch; b += n; } return out + act; };
  const ahora = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Barrio Bahia Cauquen//App del barrio//ES', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
    'BEGIN:VEVENT', `UID:${uid()}-${f0.replace(/-/g, '')}@bahiacauquen`, `DTSTAMP:${ahora}`, `DTSTART:${fh(f0, x.h)}`, `DTEND:${fin}`,
    ...(ds.length ? [`RRULE:FREQ=WEEKLY;BYDAY=${ds.map(d => DIA_ICS[d]).join(',')};UNTIL=${String(x.u || x.f).replace(/-/g, '')}T235959`] : []),
    `SUMMARY:${txt(t.titulo)}`, `DESCRIPTION:${txt(t.det)}`, `LOCATION:${txt(t.lugar)}`,
    'BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${txt(t.det)}`, 'TRIGGER:-PT1H', 'END:VALARM',
    'END:VEVENT', 'END:VCALENDAR'].map(plegar).join('\r\n') + '\r\n';
}
/* Lo mismo para Google Calendar (abre la app de Google o la página). */
function googleCalendar(x){
  const t = textosCal(x), f0 = primerDiaCal(x).replace(/-/g, ''), ds = diasDe(x);
  const hh = h => h.replace(':', '') + '00', fin = minutosDe(x.k) > minutosDe(x.h) ? hh(x.k) : '235900';
  const q = new URLSearchParams({ action:'TEMPLATE', text:t.titulo, dates:`${f0}T${hh(x.h)}/${f0}T${fin}`, ctz:'America/Argentina/Ushuaia', details:t.det, location:t.lugar });
  if (ds.length) q.set('recur', `RRULE:FREQ=WEEKLY;BYDAY=${ds.map(d => DIA_ICS[d]).join(',')};UNTIL=${String(x.u || x.f).replace(/-/g, '')}`);
  return 'https://calendar.google.com/calendar/render?' + q.toString();
}
/* El vecino se lo manda una vez a su visita. */
A['visita-calendario'] = el => {
  const p = aLista(Store.s.pases).find(x => x && x.id === el.dataset.id); if (!p) return;
  const x = datosCalendario(p), link = enlaceCalendario(x), c = Store.s.config;
  const texto = `📅 *Para que tu teléfono te avise solo*, una hora antes cada vez que venís al Barrio ${c.nombre} (a lo de ${x.a}), abrí este enlace y tocá "Agregar a mi calendario":\n${link}`;
  hoja('Recordatorio en su calendario', `<div class="cal-cab"><span class="cal-hoja" aria-hidden="true"><b>${fechaDe(primerDiaCal(x)).getDate()}</b><small>${esc(MESES[fechaDe(primerDiaCal(x)).getMonth()])}</small><i>${I('bell')}</i></span>
      <div><b>Que su teléfono le avise solo</b><small>Se lo mandás una vez. ${esc(p.nombre.split(' ')[0])} toca "Agregar a mi calendario" y su teléfono le recuerda <b>una hora antes</b>, ${esc(cuandoCal(x))}. Gratis, sin la app y sin WhatsApp.</small></div></div>
    <div class="rec-burbuja">${esc(texto).replace(/\*([^*]+)\*/g, '<b>$1</b>').replace(/\n/g, '<br>')}<time>${hora(Date.now())}</time></div>
    <a class="btn btn-wa btn-block btn-grande rec-wa" href="${esc(p.tel ? waLink(p.tel, texto) : 'https://wa.me/?text=' + encodeURIComponent(texto))}" target="_blank" rel="noopener" data-a="visita-recordar-enviado">${I('chat')}${p.tel ? 'Mandárselo a su WhatsApp' : 'Mandar por WhatsApp'}</a>
    <div class="btns" style="margin-top:8px"><button class="btn btn-sec grow" data-a="copiar" data-v="${esc(link)}">${I('copy')}Copiar el enlace</button><a class="btn btn-sec grow" href="${esc(link)}" target="_blank" rel="noopener">${I('eye')}Ver lo que le llega</a></div>
    <p class="muted tiny" style="margin:10px 2px 0">${I('lock')} El enlace dice solo a lo de quién va, el lote, los días y el horario: sin DNI, sin patente y sin el código del pase. Si cambiás los días o el horario, mandáselo de nuevo.</p>`);
};
/* La página que abre la visita (#/cal/…): no necesita cuenta ni la app. */
function pintarCalendarioPublico(arg){
  const x = leerCalendario(arg), c = Store.s.config;
  $('#app').innerHTML = `<section class="bienvenida" id="calPublico"><div class="foto" style="background-image:url('${Clima.portada()}')"></div>
    <div class="marca"><span class="logo">${LOGO}</span><div><b style="font-size:16px">Barrio ${esc(c.nombre)}</b><div class="tiny" style="opacity:.85">${esc(c.ciudad || '')}</div></div></div>
    <h1 style="font-size:32px">Tu recordatorio</h1>
    <div class="panel">${!x ? aviso('danger', 'alert', 'Enlace no válido', 'Pedile a quien te invitó que te lo mande de nuevo.') : `
      <div class="cal-pub"><span class="cal-hoja grande" aria-hidden="true"><b>${fechaDe(primerDiaCal(x)).getDate()}</b><small>${esc(MESES[fechaDe(primerDiaCal(x)).getMonth()])}</small><i>${I('bell')}</i></span>
        <p>${x.n ? `¡Hola ${esc(x.n)}! ` : ''}Vas a lo de <b>${esc(x.a || 'tu vecino')}</b>${x.c ? ` (${esc(x.c)})` : ''}, ${esc(cuandoCal(x))}.</p></div>
      <p style="margin:12px 0 14px;opacity:.95">Agregalo a tu calendario y <b>tu teléfono te avisa solo una hora antes</b>${diasDe(x).length ? ', cada día que venís' : ''}: <i>"No olvides tener preparado el QR de ingreso"</i>.</p>
      <button class="btn btn-pri btn-block btn-grande" data-a="cal-ics" data-v="${esc(arg)}">${I('calendar')}Agregar a mi calendario</button>
      <a class="btn btn-sec btn-block" style="margin-top:8px" href="${esc(googleCalendar(x))}" target="_blank" rel="noopener">${I('calendar')}Usar Google Calendar</a>
      <p class="tiny" style="margin:10px 2px 0;opacity:.9">En iPhone se abre "Agregar al calendario". En Android, si no se abre solo, tocá el archivo que se bajó o usá "Google Calendar". El QR de ingreso es el que te mandaron por WhatsApp.</p>
      ${botonMapa()}`}</div></section>`;
}
A['cal-ics'] = el => {
  const x = leerCalendario(el.dataset.v); if (!x) return toast('Enlace no válido', 'alert');
  const blob = new Blob([icsVisita(x)], { type:'text/calendar;charset=utf-8' }), url = URL.createObjectURL(blob);
  const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (ios){ location.href = url; }
  else { const a = document.createElement('a'); a.href = url; a.download = 'recordatorio-barrio.ics'; document.body.appendChild(a); a.click(); a.remove(); }
  setTimeout(() => URL.revokeObjectURL(url), 60000);
  toast('Abrilo con tu calendario y tocá "Agregar"', 'calendar');
};

/* La cronología de una visita, para los del lote: quién la autorizó y
   cuándo, y cuándo entró y salió (hoy, o el último día que vino). */
function cronoPase(p){
  const u = yo(), host = usuario(p.hostId) || {}, quien = p.hostId === u?.id ? 'vos' : (p.autoriza || host.nombre || 'alguien del lote').split(' ')[0];
  const dias = Object.keys(p.log || {}).filter(d => p.log[d] && (p.log[d].in || p.log[d].out)).sort(), d = dias.at(-1), l = d ? p.log[d] : null;
  const cuando = x => `${isoDe(new Date(x)) === hoyISO() ? 'hoy' : fechaCorta(isoDe(new Date(x)))} ${hora(x)} h`;
  return `<span class="crono-pase"><i class="${p.hostId === u?.id ? 'yo' : ''}">${I('check')}${quien === 'vos' ? 'Autorizaste vos' : 'Autorizó ' + esc(quien)}${p.createdAt ? ' · ' + cuando(p.createdAt) : ''}</i>${l && l.in ? `<i class="in">${I('login')}Entró ${cuando(l.in)}</i>` : ''}${l && l.out ? `<i class="out">${I('logout')}Salió ${cuando(l.out)}</i>` : ''}</span>`;
}
function tarjetaPase(p, { garita = false } = {}){
  const t = TIPOS_PASE[p.tipo] || TIPOS_PASE.visita, est = estadoPase(p), host = usuario(p.hostId) || {};
  const casaFoto = garita && host.fotoCasa ? fotoHTML(host.fotoCasa, 'casa-foto chica') : '';
  const franja = p.dias?.length ? `${p.dias.map(d => DIAS[d][0]).join(' ')} · ${p.desde}–${p.hasta}` : `${relDia(p.fecha)} · ${p.desde}–${p.hasta}`;
  return `<div class="card" style="padding:13px 14px"><div class="pase">
    ${casaFoto || `<span class="ic ic-${t.c}">${I(t.icon)}</span>`}
    <div class="datos"><b>${esc(p.nombre)}</b>
      <span>${garita ? `<b style="display:inline;color:var(--ink)">${esc(host.casa || '')}</b> · ` : ''}${t.n} · ${franja}${p.patente ? ' · ' + esc(p.patente) : p.app ? ' · <b>patente a confirmar</b>' : ''}${p.app && p.nota ? ' · ' + esc(p.nota.toLowerCase()) : ''}</span>
      ${garita ? `<span class="autoriza">${I('check')}Autorizó: <b>${esc(p.autoriza || host.nombre || 'vecino')}</b>${host.casa ? ' · ' + esc(host.casa) : ''}</span>` : cronoPase(p)}</div>
    <span class="estado e-${est}">${ESTADO_TXT[est]}</span></div>
    ${!garita && est === 'noingreso' && p.hostId === yo()?.id ? `<div class="vnl-franja">${I('clock')}<span>Todavía no llegó.</span><button class="btn btn-xs btn-sec" data-a="editar-pase" data-id="${p.id}">Cambiar el horario</button><button class="btn btn-xs btn-danger-soft" data-a="visita-no-viene" data-id="${p.id}">Ya no viene</button></div>` : ''}
    <div class="btns" style="margin-top:10px">
      ${garita ? (!esGuardia() ? (esAdmin() ? botonesAdminPase(p, est) : '') : est === 'esperado' || est === 'noingreso' ? `<button class="btn btn-sm btn-ok" data-a="pase-in" data-id="${p.id}">${I('login')}Ingresó</button>`
        /* PASE VENCIDO (pedido de Claudio, 26-09): pasada la hora, "Ingresó"
           queda deshabilitado y la garita tiene "Pase vencido", que le avisa
           al vecino que lo autorizó (y, si la persona está en la garita, le
           pregunta si la deja pasar). */
        : est === 'vencido' || est === 'nollego' ? `<button class="btn btn-sm btn-sec" disabled title="El pase venció: no se puede registrar el ingreso">${I('login')}Ingresó</button>
          <button class="btn btn-sm btn-danger-soft" data-a="pase-vencido" data-id="${p.id}">${I('clock')}Pase vencido</button>
          ${p.vencidoAviso && p.vencidoAviso.fecha === hoyISO() ? `<span class="pill p-warn">Avisado al vecino ${hora(p.vencidoAviso.at)} h</span>` : ''}` : est === 'adentro' ? `<button class="btn btn-sm btn-sec" data-a="pase-out" data-id="${p.id}">${I('logout')}Salió</button>` : '')
        : `${p.app && (est === 'esperado' || est === 'noingreso' || est === 'adentro') ? `<button class="btn btn-sm ${p.patente ? 'btn-sec' : 'btn-pri'}" data-a="pase-app-patente" data-id="${p.id}">${I('car')}${p.patente ? 'Cambiar la patente' : 'Agregar la patente'}</button>`
           : est === 'esperado' || est === 'noingreso' || est === 'futuro' || est === 'adentro' ? `<button class="btn btn-sm btn-sec" data-a="ver-pase" data-id="${p.id}">${I('qr')}Ver pase</button>
           ${est === 'adentro' ? '' : `<button class="btn btn-sm btn-wa" data-a="compartir-pase" data-id="${p.id}">${I('share')}Enviar</button>`}` : ''}
           ${/* Con la visita ya adentro, mandar el pase o editarlo no tiene sentido (Claudio, 10-10-2026): quedan "Ver pase" y borrar. */ est === 'adentro' ? '' : `<button class="btn btn-sm btn-sec" data-a="editar-pase" data-id="${p.id}" title="Editar">${I('edit')}Editar</button>`}
           ${est === 'esperado' || est === 'noingreso' || est === 'futuro' ? `<button class="btn btn-sm btn-danger-soft" data-a="cancelar-pase" data-id="${p.id}" title="Cancelar el pase">${I('x')}</button>` : ''}
           <button class="btn btn-sm btn-danger-soft" data-a="borrar-pase" data-id="${p.id}" title="Borrar de mi lista">${I('trash')}</button>`}
      ${/* El celular que la visita dejó en el enlace: la garita y el vecino que la espera la pueden llamar (si se demora, si no la encuentran). */
        p.tel && ['esperado', 'noingreso', 'vencido', 'nollego', 'futuro', 'adentro'].includes(est) && (garita ? esGuardia() || esAdmin() : p.hostId === yo()?.id) ? `<a class="btn btn-sm btn-sec" href="${telLink(p.tel)}">${I('phone')}Llamar</a>` : ''}
    </div>${garita && p.borrado ? `<div class="muted tiny" style="margin-top:6px">${I('trash')} ${p.borrado.admin ? 'La Administración la borró' : 'El vecino la sacó de su lista'} ${hace(p.borrado.at)} · queda en el historial</div>` : ''}${p.editado ? `<div class="muted tiny" style="margin-top:6px">${I('edit')} Editada ${hace(p.editado.at)}</div>` : ''}</div>`;
}

/* PERSONAL FIJO EN UNA SOLA TARJETA (pedido de Claudio, 16-10-2026: "Estela
   figura en Hoy y en Personal fijo con la misma entrada y salida: no quiero
   contaminación visual"). El personal fijo ya no se repite en "Hoy": tiene
   su propia tarjeta con un anillo de estado (verde latiendo si está adentro,
   tilde si ya se fue), la barra del día (el horario autorizado de fondo y
   encima el rato que estuvo, con la marca de "ahora") y la semana en
   puntitos (los días que vino, los que viene y los que faltó). Las acciones
   quedan en una fila de íconos. */
function tarjetaFijo(p){
  const hoy = hoyISO(), est = estadoPase(p), l = (p.log || {})[hoy] || {}, vieneHoy = paseValidoEn(p, hoy);
  const ini = String(p.nombre || '?').trim().split(/\s+/).map(x => x[0] || '').join('').slice(0, 2).toUpperCase();
  const mins = x => { const d = new Date(x); return d.getHours() * 60 + d.getMinutes(); };
  const dur = ms => { const m = Math.max(0, Math.round(ms / 60000)); return m < 60 ? `${m} min` : `${Math.floor(m / 60)} h${m % 60 ? ' ' + String(m % 60).padStart(2, '0') + ' min' : ''}`; };
  /* El estado en palabras, corto. */
  const estado = l.out ? { k:'fuera', t:`Se fue ${hora(l.out)} h`, s:`estuvo ${dur(l.out - l.in)}` }
    : l.in ? { k:'adentro', t:'Está adentro', s:`desde las ${hora(l.in)} h` }
    : vieneHoy ? { k: est === 'noingreso' || est === 'nollego' ? 'tarde' : 'espera', t: est === 'nollego' ? 'Hoy no vino' : est === 'noingreso' ? 'Todavía no llegó' : 'La esperás hoy', s:`de ${p.desde} a ${p.hasta} h` }
    : { k:'libre', t:'Hoy no viene', s:'' };
  /* La barra del día: del horario autorizado (con media hora de margen) a lo que estuvo de verdad. */
  let barra = '';
  if (vieneHoy || l.in){
    const d = minutosDe(p.desde), h = minutosDe(p.hasta), a = l.in ? mins(l.in) : null, b = l.out ? mins(l.out) : l.in ? ahoraMin() : null;
    const ini0 = Math.min(d, a ?? d) - 30, fin0 = Math.max(h, b ?? h) + 30, pc = m => ((m - ini0) / (fin0 - ini0) * 100).toFixed(1) + '%';
    const ya = ahoraMin();
    barra = `<div class="pf-dia" aria-label="Horario ${p.desde} a ${p.hasta}${l.in ? `, entró ${hora(l.in)}` : ''}${l.out ? `, salió ${hora(l.out)}` : ''}">
      <div class="pf-pista"><i class="pf-aut" style="left:${pc(d)};width:calc(${pc(h)} - ${pc(d)})"></i>
        ${a != null ? `<i class="pf-real${l.out ? '' : ' vivo'}" style="left:${pc(a)};width:calc(${pc(b)} - ${pc(a)})"></i>` : ''}
        ${ya > ini0 && ya < fin0 && !l.out ? `<i class="pf-ahora" style="left:${pc(ya)}"></i>` : ''}</div>
      <div class="pf-horas"><span style="left:${pc(d)}">${p.desde}</span><span style="left:${pc(h)}">${p.hasta}</span>
        ${a != null ? `<b class="in" style="left:${pc(a)}">${I('login')}${hora(l.in)}</b>` : ''}${l.out ? `<b class="out" style="left:${pc(b)}">${I('logout')}${hora(l.out)}</b>` : ''}</div></div>`;
  }
  /* La semana (de lunes a domingo). */
  const f = fechaDe(hoy), lunes = sumarDias(hoy, -((f.getDay() + 6) % 7));
  const semana = Array.from({ length:7 }, (_, i) => { const iso = sumarDias(lunes, i), dw = fechaDe(iso).getDay(), toca = paseValidoEn(p, iso), vino = !!(p.log && p.log[iso] && p.log[iso].in);
    const k = vino ? 'vino' : !toca ? 'no' : iso > hoy || (iso === hoy && !l.in) ? 'toca' : 'falto';
    return `<span class="pf-d ${k}${iso === hoy ? ' hoy' : ''}" title="${DIAS[dw]}: ${{ vino:'vino', no:'no viene', toca:'viene', falto:'no vino' }[k]}"><i></i>${DIAS[dw][0]}</span>`; }).join('');
  const mes = hoy.slice(0, 7), enMes = Object.keys(p.log || {}).filter(d => d.startsWith(mes) && p.log[d].in).length;
  const t = TIPOS_PASE[p.tipo] || TIPOS_PASE.personal || TIPOS_PASE.visita;
  return `<div class="card pf ${estado.k}">
    <div class="pf-cab"><span class="pf-av"><b>${esc(ini)}</b>${estado.k === 'fuera' ? `<em>${I('check')}</em>` : ''}</span>
      <div class="pf-nom"><b>${esc(p.nombre)}</b><small>${p.tipo && p.tipo !== 'personal' ? esc(t.n) + ' · ' : ''}${p.dias.slice().sort((a, b) => (a + 6) % 7 - (b + 6) % 7).map(d => DIAS[d][0]).join(' ')} · ${p.desde}–${p.hasta}</small></div>
      <div class="pf-est"><b>${estado.t}</b>${estado.s ? `<small>${estado.s}</small>` : ''}</div></div>
    ${barra}
    <div class="pf-pie"><div class="pf-sem" aria-label="Esta semana">${semana}</div><span class="pf-mes">${plural(enMes, 'día')} este mes</span></div>
    <div class="pf-acc">
      <button class="btn btn-sm btn-sec" data-a="ver-pase" data-id="${p.id}" title="Ver pase">${I('qr')}<span>Pase</span></button>
      <button class="btn btn-sm btn-sec" data-a="compartir-pase" data-id="${p.id}" title="Enviar el pase">${I('share')}<span>Enviar</span></button>
      ${p.tel ? `<a class="btn btn-sm btn-sec" href="${telLink(p.tel)}" title="Llamar">${I('phone')}<span>Llamar</span></a>` : ''}
      <button class="btn btn-sm btn-sec" data-a="editar-pase" data-id="${p.id}" title="Editar">${I('edit')}<span>Editar</span></button>
      <button class="btn btn-sm btn-danger-soft" data-a="borrar-pase" data-id="${p.id}" title="Borrar de mi lista">${I('trash')}</button></div>
  </div>`;
}

/* LA ADMINISTRACIÓN EDITA Y BORRA CUALQUIER VISITA (pedido de Claudio,
   11-10-2026). En "Visitas del barrio" y en la garita en vivo: ver el
   pase, editarlo y borrarlo. Lo que hace queda en la auditoría y al vecino
   que la anunció le llega el aviso. */
const botonesAdminPase = (p, est) => `${est === 'cancelado' ? '' : `<button class="btn btn-sm btn-sec" data-a="ver-pase" data-id="${p.id}">${I('qr')}Ver pase</button>`}
  <button class="btn btn-sm btn-sec" data-a="editar-pase" data-id="${p.id}">${I('edit')}Editar</button>
  <button class="btn btn-sm btn-danger-soft" data-a="borrar-pase" data-id="${p.id}" title="Borrar la visita">${I('trash')}Borrar</button>`;

/* ---------- avisos urgentes del inicio ---------- */
function urgentesVecino(){
  const u = yo(), s = Store.s, out = [], hoy = hoyISO();
  const deaMio = typeof Dea !== 'undefined' ? Dea.mio() : null;
  if (deaMio) out.push(aviso(deaMio.estado === 'en_camino' ? 'ok' : 'danger latido', 'heart', deaMio.estado === 'en_camino' ? 'El DEA va en camino' : 'Tu pedido del DEA está en la garita',
    deaMio.estado === 'en_camino' ? 'La garita salió con el desfibrilador.' : 'Esperando que salgan con el DEA. Llamá al 911.', `<button class="btn btn-xs btn-sec" data-a="dea-listo" data-id="${deaMio.id}">Ya no hace falta</button>`));
  s.sos.filter(x => x.userId === u.id && x.estado !== 'resuelta' && x.tipo !== 'dea').forEach(x => out.push(aviso('danger latido', 'siren',
    x.estado === 'en_camino' ? `La guardia va en camino (${nombreDe(x.atiende)})` : x.estado === 'atendida' ? 'La guardia dio por atendida tu alerta' : 'Tu alerta SOS está activa',
    x.estado === 'atendida' ? 'Si ya está todo bien, confirmalo para que se cierre en todo el barrio.' : 'La guardia, la Administración y los vecinos ya fueron avisados.',
    `<button class="btn btn-xs btn-ok" data-a="sos-cancelar" data-id="${x.id}">${I('check')}Ya está solucionado</button>`)));
  s.llegadas.filter(l => llegadaDeMiLote(l, u) && l.estado === 'consultando').forEach(l => out.push(aviso('warn latido', 'gate',
    `En la garita: ${esc(l.nombre)} pregunta por ${l.hostId === u.id && !l.porLote ? 'vos' : 'tu casa'}`, `${esc(l.motivo || 'Sin aviso previo')}${l.patente ? ' · ' + esc(l.patente) : ''} · ${hace(l.at)}`,
    `<button class="btn btn-xs btn-ok" data-a="llegada-si" data-id="${l.id}">${I('check')}Que pase</button><button class="btn btn-xs btn-danger-soft" data-a="llegada-noesta" data-id="${l.id}">${I('home')}No estoy en casa</button><button class="btn btn-xs btn-sec" data-a="llegada-no" data-id="${l.id}">No lo conozco</button>`)));
  s.solicitudesPase.filter(r => r.hostId === u.id && r.estado === 'pendiente').forEach(r => out.push(aviso('info', 'qr',
    `${esc(r.nombre)} te pide un pase`, `${fechaCorta(r.fecha)} · ${r.desde}${r.patente ? ' · ' + esc(r.patente) : ''}`,
    `<button class="btn btn-xs btn-ok" data-a="sol-pase-si" data-id="${r.id}">${I('check')}Aprobar</button><button class="btn btn-xs btn-sec" data-a="sol-pase-no" data-id="${r.id}">Rechazar</button>`)));
  const paq = hayPaquetes() ? paquetesDelLote(u).filter(p => !p.retirado) : [];
  if (paq.length) out.push(aviso('brand', 'box', `${paq.length > 1 ? 'Hay ' + paq.length + ' paquetes' : 'Hay un paquete'} de ${esc(u.casa)} en la garita`, paq.map(p => esc(p.empresa) + (p.hostId !== u.id ? ' (para ' + esc(nombreDe(p.hostId).split(' ')[0]) + ')' : '')).join(', '),
    `<button class="btn btn-xs btn-pri" data-a="retiro-qr">${I('qr')}Mi QR para retirar</button><button class="btn btn-xs btn-sec" data-a="abrir" data-v="mis-paquetes">Ver</button>`));

  if (typeof alertasParaMi === 'function') alertasParaMi().filter(a => !respuestaDe(a)).forEach(a => out.push(aviso('danger latido', 'siren', `Aviso urgente: ${esc(a.titulo)}`, esc(a.zona),
    `<button class="btn btn-xs btn-ok" data-a="alerta-responder" data-id="${a.id}" data-v="ok">Recibido</button><button class="btn btn-xs btn-danger-soft" data-a="alerta-responder" data-id="${a.id}" data-v="ayuda">Necesito ayuda</button>`)));
  const v = s.votaciones.find(v => v.cierra > Date.now() && !(u.casa in v.votos));
  if (v) out.push(aviso('info', 'vote', 'Votación abierta', esc(v.titulo), `<button class="btn btn-xs btn-sec" data-a="abrir" data-v="votaciones">Votar</button>`));
  return out;
}
/* El último viaje del camión que la garita registró hoy (o null). */
function camionPasoHoy(){
  const l = typeof Camion !== 'undefined' ? Camion.lista() : [];
  return l.find(v => v.entra && isoDe(new Date(v.entra)) === hoyISO()) || null;
}
/* Un aviso del camión que ya quedó viejo: el recordatorio ("mañana pasa",
   "hoy pasa") cuando después entró el camión. El "entró el camión" no va
   en la pizarra: mientras está adentro ya está el renglón en vivo, y cuando
   la garita marca la salida desaparece con él. (Sigue en la campanita.) */
function avisoCamionViejo(n){
  if (!n || String(n.link || '').split(':')[0] !== 'recoleccion') return false;
  const l = typeof Camion !== 'undefined' ? Camion.lista() : [];
  if (n.icon === 'tacho') return true;
  return /cami[oó]n|voluminosos/i.test(n.titulo || '') && l.some(v => v.entra && v.entra > n.at);
}
function recoleccionHoy(){
  const c = Store.s.config, dias = recoleccionDias(), h = new Date(), hoy = h.getDay(), man = (hoy + 1) % 7;
  const vol = volsProximos().find(v => v.fecha === hoyISO() || v.fecha === sumarDias(hoyISO(), 1));
  if (vol) return anuncioCamion(vol.fecha === hoyISO() ? 'Hoy' : 'Mañana', 'Voluminosos', vol.detalle);
  /* El día que pasa, TODO el día hasta que la garita registra la entrada:
     desde ahí el "Hoy pasa…" se va de la pizarra (mientras está adentro se
     ve el aviso en vivo, y cuando sale ya pasó). */
  if (dias[hoy] && !camionPasoHoy()) return anuncioCamion('Hoy', dias[hoy]);
  if (dias[hoy]) return null;
  /* La víspera de un día con camión, todo el día: "Mañana pasa el camión
     de basura". Si mañana no hay camión, no se dice nada. */
  if (dias[man]) return anuncioCamion('Mañana', dias[man]);
  return null;

}

/* =========================================================
   INICIO
   La portada no es un tablero con treinta botones: es una puerta.
   Tiene cuatro capas, de arriba abajo:
     1. quién sos y qué tiempo hace (el hero),
     2. QUÉ PASA AHORA: solo lo que pide una decisión tuya,
     3. QUÉ QUERÉS HACER: las cuatro cosas que todos hacen siempre,
     4. POR DÓNDE SEGUIR: cuatro secciones, cada una con su propia
        ventana. Adentro de cada una está el detalle.
   Así cada objetivo queda marcado y la portada invita a recorrerla
   en lugar de abrumar.
   ========================================================= */

/* =========================================================
   LAS ILUSTRACIONES DE LAS SECCIONES
   Cada puerta de la portada es una ventana con un dibujo: una casa para
   "Tu casa", un barrio soleado y colorido para "El barrio" y la bahía de Ushuaia
   (el faro, el crucero, el avión) para "Ushuaia y servicios". Van como
   SVG dentro del código: no pesan, no dependen de internet y se ven
   nítidos en cualquier pantalla.
   Si algún día hay una foto propia para una sección, alcanza con
   ponerla en `foto` (por ejemplo 'img/servicios.jpg').
   ========================================================= */
const ARTE = {
  casa: { svg:`<svg class="arte-svg" viewBox="0 0 400 240" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><linearGradient id="acC" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6fbad6"/><stop offset=".8" stop-color="#d9eff0"/></linearGradient><linearGradient id="acT" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d98a45"/><stop offset="1" stop-color="#a55a26"/></linearGradient></defs><rect width="400" height="240" fill="url(#acC)"/><circle cx="330" cy="52" r="32" fill="#fff6d1" opacity=".35"/><circle cx="330" cy="52" r="19" fill="#fff6d1"/><path d="M-10 150 L60 78 L100 112 L170 48 L235 118 L285 84 L410 160 V240 H-10Z" fill="#5f8fa3"/><path d="M170 48 L150 68 L162 66 L171 76 L181 64 L192 70Z M60 78 L46 92 L57 90 L63 97 L72 89Z M285 84 L272 96 L282 95 L289 101 L297 94Z" fill="#fff"/><path d="M-10 172 Q90 146 200 164 T410 160 V240 H-10Z" fill="#4c8f6e"/><path d="M-10 202 Q140 180 410 198 V240 H-10Z" fill="#2f6e55"/><g fill="#24574a"><path d="M52 202 L70 146 L88 202Z"/><path d="M28 206 L46 164 L64 206Z" opacity=".85"/><path d="M322 200 L342 136 L362 200Z"/><path d="M352 206 L368 160 L384 206Z" opacity=".85"/></g><rect x="236" y="96" width="14" height="36" rx="2" fill="#6b4636"/><g fill="#fff" opacity=".75"><circle cx="243" cy="85" r="6"/><circle cx="252" cy="72" r="8"/><circle cx="264" cy="57" r="10"/></g><rect x="146" y="138" width="112" height="70" fill="url(#acT)"/><path d="M146 152H258M146 166H258M146 180H258M146 194H258" stroke="#7d421b" stroke-opacity=".35" stroke-width="2"/><path d="M132 144 L202 88 L272 144Z" fill="#b23a2e"/><path d="M132 144 L202 88 L272 144" fill="none" stroke="#fff" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"/><circle cx="202" cy="120" r="9" fill="#ffd97a" stroke="#8a4b22" stroke-width="2"/><rect x="158" y="154" width="26" height="22" rx="2" fill="#ffd97a"/><rect x="220" y="154" width="26" height="22" rx="2" fill="#ffd97a"/><path d="M171 154v22M158 165h26M233 154v22M220 165h26" stroke="#8a4b22" stroke-width="2"/><rect x="190" y="166" width="24" height="42" rx="3" fill="#5a331c"/><circle cx="208" cy="188" r="2.2" fill="#f2c14e"/><rect x="140" y="206" width="124" height="5" rx="2" fill="#5b3b2a"/><path d="M194 211 L180 240 H224 L210 211Z" fill="#d9c9a8" opacity=".85"/></svg>` },
  /* El barrio dibujado: casas de colores, sol, lupinos y el Martial nevado. */
  comunidad: { svg:`<svg class="arte-svg" viewBox="0 0 400 240" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><linearGradient id="abC" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4fb3ea"/><stop offset=".75" stop-color="#bfe8fb"/></linearGradient><radialGradient id="abS" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff7c2"/><stop offset=".55" stop-color="#ffd84d"/><stop offset="1" stop-color="#ffd84d" stop-opacity="0"/></radialGradient><linearGradient id="abP" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8fd16a"/><stop offset="1" stop-color="#5eb14f"/></linearGradient></defs><rect width="400" height="240" fill="url(#abC)"/><circle cx="62" cy="50" r="46" fill="url(#abS)"/><circle cx="62" cy="50" r="20" fill="#ffe066"/><g stroke="#ffd84d" stroke-width="3" stroke-linecap="round"><path d="M90.0 50.0 L100.0 50.0"/><path d="M81.8 69.8 L88.9 76.9"/><path d="M62.0 78.0 L62.0 88.0"/><path d="M42.2 69.8 L35.2 76.9"/><path d="M34.0 50.0 L24.0 50.1"/><path d="M42.2 30.2 L35.1 23.2"/><path d="M61.9 22.0 L61.9 12.0"/><path d="M81.7 30.1 L88.8 23.1"/></g><g fill="#fff" opacity=".92"><ellipse cx="250" cy="40" rx="30" ry="10"/><ellipse cx="270" cy="33" rx="18" ry="11"/><ellipse cx="236" cy="35" rx="14" ry="8"/><ellipse cx="350" cy="62" rx="24" ry="8"/><ellipse cx="364" cy="56" rx="13" ry="8"/></g><path d="M-10 128 L50 78 L88 104 L140 56 L190 98 L236 66 L290 108 L338 70 L410 118 V150 H-10Z" fill="#7aa6c2"/><path d="M140 56 L124 72 L135 70 L142 78 L150 70 L160 74Z M236 66 L222 80 L232 78 L238 85 L246 77 L254 80Z M338 70 L326 82 L335 81 L341 87 L348 80Z M50 78 L40 88 L48 87 L53 92 L60 86Z" fill="#fff"/><path d="M-10 150 Q60 118 150 134 T300 126 T410 134 V240 H-10Z" fill="url(#abP)"/><path d="M-10 176 Q120 150 230 166 T410 160 V240 H-10Z" fill="#4fa84a"/><path d="M180 240 C190 214 150 200 186 184 C214 172 250 170 262 160" fill="none" stroke="#e9d7ae" stroke-width="16" stroke-linecap="round"/><path d="M180 240 C190 214 150 200 186 184 C214 172 250 170 262 160" fill="none" stroke="#fff" stroke-width="1.6" stroke-dasharray="6 6" opacity=".8"/><path d="M20 126.6 L29.9 150 L10.1 150Z" fill="#2e7d4f"/><rect x="18.6" y="150" width="2.9" height="4.5" fill="#6b4636"/><path d="M34 121.4 L46.1 150 L21.9 150Z" fill="#2e7d4f"/><rect x="32.2" y="150" width="3.5" height="5.5" fill="#6b4636"/><path d="M372 120 L383 146 L361 146Z" fill="#2e7d4f"/><rect x="370.4" y="146" width="3.2" height="5.0" fill="#6b4636"/><path d="M388 123.9 L397.35 146 L378.65 146Z" fill="#2e7d4f"/><rect x="386.6" y="146" width="2.7" height="4.2" fill="#6b4636"/><path d="M120 131.8 L127.7 150 L112.3 150Z" fill="#2e7d4f"/><rect x="118.9" y="150" width="2.2" height="3.5" fill="#6b4636"/><path d="M300 126.5 L308.25 146 L291.75 146Z" fill="#2e7d4f"/><rect x="298.8" y="146" width="2.4" height="3.8" fill="#6b4636"/><rect x="96" y="134" width="30" height="20" fill="#ff8a5b"/><path d="M91 134 L111.0 121.6 L131 134Z" fill="#c0392b"/><rect x="100.2" y="138.4" width="6.6" height="6.6" rx="1.5" fill="#fff3b0"/><rect x="115.2" y="138.4" width="6.6" height="6.6" rx="1.5" fill="#fff3b0"/><rect x="108.3" y="144.0" width="5.4" height="10.0" rx="1.5" fill="#5a331c"/><rect x="212" y="128" width="28" height="19" fill="#ffd166"/><path d="M207 128 L226.0 116.22 L245 128Z" fill="#3a86ff"/><rect x="215.9" y="132.2" width="6.2" height="6.2" rx="1.5" fill="#fff3b0"/><rect x="229.9" y="132.2" width="6.2" height="6.2" rx="1.5" fill="#fff3b0"/><rect x="223.5" y="137.5" width="5.0" height="9.5" rx="1.5" fill="#5a331c"/><rect x="300" y="132" width="30" height="20" fill="#8ecae6"/><path d="M295 132 L315.0 119.6 L335 132Z" fill="#e76f51"/><rect x="304.2" y="136.4" width="6.6" height="6.6" rx="1.5" fill="#fff3b0"/><rect x="319.2" y="136.4" width="6.6" height="6.6" rx="1.5" fill="#fff3b0"/><rect x="312.3" y="142.0" width="5.4" height="10.0" rx="1.5" fill="#5a331c"/><rect x="30" y="178" width="46" height="32" fill="#f4a261"/><path d="M25 178 L53.0 158.16 L81 178Z" fill="#9b2226"/><rect x="36.4" y="185.0" width="10.1" height="10.1" rx="1.5" fill="#fff3b0"/><rect x="59.4" y="185.0" width="10.1" height="10.1" rx="1.5" fill="#fff3b0"/><rect x="48.9" y="194.0" width="8.3" height="16.0" rx="1.5" fill="#5a331c"/><rect x="110" y="190" width="40" height="28" fill="#a8dadc"/><path d="M105 190 L130.0 172.64 L155 190Z" fill="#6a4c93"/><rect x="115.6" y="196.2" width="8.8" height="8.8" rx="1.5" fill="#fff3b0"/><rect x="135.6" y="196.2" width="8.8" height="8.8" rx="1.5" fill="#fff3b0"/><rect x="126.4" y="204.0" width="7.2" height="14.0" rx="1.5" fill="#5a331c"/><rect x="262" y="182" width="46" height="32" fill="#ffb4c6"/><path d="M257 182 L285.0 162.16 L313 182Z" fill="#2a9d8f"/><rect x="268.4" y="189.0" width="10.1" height="10.1" rx="1.5" fill="#fff3b0"/><rect x="291.4" y="189.0" width="10.1" height="10.1" rx="1.5" fill="#fff3b0"/><rect x="280.9" y="198.0" width="8.3" height="16.0" rx="1.5" fill="#5a331c"/><rect x="334" y="196" width="42" height="30" fill="#ffe29a"/><path d="M329 196 L355.0 177.4 L381 196Z" fill="#d62828"/><rect x="339.9" y="202.6" width="9.2" height="9.2" rx="1.5" fill="#fff3b0"/><rect x="360.9" y="202.6" width="9.2" height="9.2" rx="1.5" fill="#fff3b0"/><rect x="351.2" y="211.0" width="7.6" height="15.0" rx="1.5" fill="#5a331c"/><rect x="58" y="150" width="6" height="14" fill="#6b4636"/><g fill="#fff" opacity=".8"><circle cx="61" cy="144" r="4"/><circle cx="66" cy="136" r="5"/></g><rect x="90.2" y="208.0" width="3.6" height="12.0" fill="#7a5236"/><circle cx="92" cy="202.0" r="10.0" fill="#43a047"/><circle cx="98.0" cy="206.0" r="7.0" fill="#43a047"/><circle cx="86.0" cy="207.0" r="6.5" fill="#43a047"/><rect x="236.0" y="201.6" width="4.0" height="13.2" fill="#7a5236"/><circle cx="238" cy="195.0" r="11.0" fill="#66bb6a"/><circle cx="244.6" cy="199.4" r="7.7" fill="#66bb6a"/><circle cx="231.4" cy="200.5" r="7.2" fill="#66bb6a"/><rect x="316.4" y="222.4" width="3.2" height="10.8" fill="#7a5236"/><circle cx="318" cy="217.0" r="9.0" fill="#43a047"/><circle cx="323.4" cy="220.6" r="6.3" fill="#43a047"/><circle cx="312.6" cy="221.5" r="5.9" fill="#43a047"/><rect x="10.2" y="222.0" width="3.6" height="12.0" fill="#7a5236"/><circle cx="12" cy="216.0" r="10.0" fill="#66bb6a"/><circle cx="18.0" cy="220.0" r="7.0" fill="#66bb6a"/><circle cx="6.0" cy="221.0" r="6.5" fill="#66bb6a"/><rect x="390.6" y="228.8" width="2.9" height="9.6" fill="#7a5236"/><circle cx="392" cy="224.0" r="8.0" fill="#43a047"/><circle cx="396.8" cy="227.2" r="5.6" fill="#43a047"/><circle cx="387.2" cy="228.0" r="5.2" fill="#43a047"/><path d="M129.5 226.1 v-9" stroke="#3f7d4a" stroke-width="1.4"/><ellipse cx="129.5" cy="213.1" rx="2.6" ry="6" fill="#7b4fd6"/><path d="M211.8 225.0 v-9" stroke="#3f7d4a" stroke-width="1.4"/><ellipse cx="211.8" cy="212.0" rx="2.6" ry="6" fill="#b061d9"/><path d="M214.4 229.1 v-9" stroke="#3f7d4a" stroke-width="1.4"/><ellipse cx="214.4" cy="216.1" rx="2.6" ry="6" fill="#e36fb4"/><path d="M155.5 231.1 v-9" stroke="#3f7d4a" stroke-width="1.4"/><ellipse cx="155.5" cy="218.1" rx="2.6" ry="6" fill="#5c6ee0"/><path d="M15.0 230.1 v-9" stroke="#3f7d4a" stroke-width="1.4"/><ellipse cx="15.0" cy="217.1" rx="2.6" ry="6" fill="#7b4fd6"/><path d="M156.6 225.3 v-9" stroke="#3f7d4a" stroke-width="1.4"/><ellipse cx="156.6" cy="212.3" rx="2.6" ry="6" fill="#b061d9"/><path d="M169.8 235.6 v-9" stroke="#3f7d4a" stroke-width="1.4"/><ellipse cx="169.8" cy="222.6" rx="2.6" ry="6" fill="#e36fb4"/><path d="M161.8 227.1 v-9" stroke="#3f7d4a" stroke-width="1.4"/><ellipse cx="161.8" cy="214.1" rx="2.6" ry="6" fill="#5c6ee0"/><path d="M251.0 237.3 v-9" stroke="#3f7d4a" stroke-width="1.4"/><ellipse cx="251.0" cy="224.3" rx="2.6" ry="6" fill="#7b4fd6"/><path d="M204.8 229.6 v-9" stroke="#3f7d4a" stroke-width="1.4"/><ellipse cx="204.8" cy="216.6" rx="2.6" ry="6" fill="#b061d9"/><path d="M390.5 224.7 v-9" stroke="#3f7d4a" stroke-width="1.4"/><ellipse cx="390.5" cy="211.7" rx="2.6" ry="6" fill="#e36fb4"/><path d="M231.6 228.1 v-9" stroke="#3f7d4a" stroke-width="1.4"/><ellipse cx="231.6" cy="215.1" rx="2.6" ry="6" fill="#5c6ee0"/><path d="M57.7 225.6 v-9" stroke="#3f7d4a" stroke-width="1.4"/><ellipse cx="57.7" cy="212.6" rx="2.6" ry="6" fill="#7b4fd6"/><path d="M179.3 235.4 v-9" stroke="#3f7d4a" stroke-width="1.4"/><ellipse cx="179.3" cy="222.4" rx="2.6" ry="6" fill="#b061d9"/><path d="M72.3 232.1 v-9" stroke="#3f7d4a" stroke-width="1.4"/><ellipse cx="72.3" cy="219.1" rx="2.6" ry="6" fill="#e36fb4"/><path d="M210.7 229.2 v-9" stroke="#3f7d4a" stroke-width="1.4"/><ellipse cx="210.7" cy="216.2" rx="2.6" ry="6" fill="#5c6ee0"/><path d="M219.1 224.9 v-9" stroke="#3f7d4a" stroke-width="1.4"/><ellipse cx="219.1" cy="211.9" rx="2.6" ry="6" fill="#7b4fd6"/><path d="M155.7 226.9 v-9" stroke="#3f7d4a" stroke-width="1.4"/><ellipse cx="155.7" cy="213.9" rx="2.6" ry="6" fill="#b061d9"/><path d="M272.2 230.0 v-9" stroke="#3f7d4a" stroke-width="1.4"/><ellipse cx="272.2" cy="217.0" rx="2.6" ry="6" fill="#e36fb4"/><path d="M179.8 232.2 v-9" stroke="#3f7d4a" stroke-width="1.4"/><ellipse cx="179.8" cy="219.2" rx="2.6" ry="6" fill="#5c6ee0"/><path d="M181.3 228.2 v-9" stroke="#3f7d4a" stroke-width="1.4"/><ellipse cx="181.3" cy="215.2" rx="2.6" ry="6" fill="#7b4fd6"/><path d="M225.5 233.8 v-9" stroke="#3f7d4a" stroke-width="1.4"/><ellipse cx="225.5" cy="220.8" rx="2.6" ry="6" fill="#b061d9"/><path d="M97.6 232.0 v-9" stroke="#3f7d4a" stroke-width="1.4"/><ellipse cx="97.6" cy="219.0" rx="2.6" ry="6" fill="#e36fb4"/><path d="M199.9 236.3 v-9" stroke="#3f7d4a" stroke-width="1.4"/><ellipse cx="199.9" cy="223.3" rx="2.6" ry="6" fill="#5c6ee0"/><path d="M291.8 228.0 v-9" stroke="#3f7d4a" stroke-width="1.4"/><ellipse cx="291.8" cy="215.0" rx="2.6" ry="6" fill="#7b4fd6"/><path d="M243.1 225.7 v-9" stroke="#3f7d4a" stroke-width="1.4"/><ellipse cx="243.1" cy="212.7" rx="2.6" ry="6" fill="#b061d9"/><g stroke="#fff" stroke-width="2" opacity=".85"><path d="M0 222 H70 M0 230 H70"/><path d="M4 216 V234"/><path d="M14 216 V234"/><path d="M24 216 V234"/><path d="M34 216 V234"/><path d="M44 216 V234"/><path d="M54 216 V234"/><path d="M64 216 V234"/></g><g fill="none" stroke="#2b3a55" stroke-width="1.8" stroke-linecap="round"><path d="M150 44 q6 -6 12 0 q6 -6 12 0"/><path d="M180 30 q4 -4 8 0 q4 -4 8 0"/></g></svg>` },
  ciudad: { svg:`<svg class="arte-svg" viewBox="0 0 400 240" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><linearGradient id="auC" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2f3f7e"/><stop offset=".55" stop-color="#d9775f"/><stop offset="1" stop-color="#f3c77e"/></linearGradient><linearGradient id="auA" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2d5f80"/><stop offset="1" stop-color="#15344c"/></linearGradient></defs><rect width="400" height="240" fill="url(#auC)"/><circle cx="300" cy="120" r="26" fill="#ffdca0" opacity=".8"/><path d="M40 58 L150 40" stroke="#fff" stroke-opacity=".55" stroke-width="2" stroke-dasharray="6 5"/><g transform="translate(150 38) rotate(-9)"><path d="M0 0 L26 -1 C31 -1 33 1 33 2 C33 3 31 4 26 4 L0 4Z" fill="#fff"/><path d="M12 1 L4 -9 L9 -9 L19 1Z M12 3 L5 12 L10 12 L19 3Z M1 1 L-3 -5 L1 -5 L5 1Z" fill="#fff"/></g><path d="M-10 156 L30 112 L55 128 L92 66 L116 102 L140 82 L170 120 L206 60 L236 100 L262 86 L300 128 L340 90 L410 140 V175 H-10Z" fill="#4b3f6d"/><path d="M92 66 L80 84 L90 80 L96 88 L104 79Z M206 60 L193 79 L203 76 L210 84 L218 74Z M340 90 L329 104 L338 102 L344 108 L351 101Z M140 82 L133 92 L141 90 L146 95Z" fill="#fff"/><path d="M-10 168 L50 140 L110 156 L170 138 L240 158 L300 142 L410 162 V178 H-10Z" fill="#372f57"/><rect x="6" y="161" width="11" height="9" fill="#e63946"/><path d="M5 161 L11.5 156 L18 161Z" fill="#3b2f4f"/><rect x="18" y="158" width="15" height="12" fill="#f4a261"/><path d="M17 158 L25.5 153 L34 158Z" fill="#3b2f4f"/><rect x="21" y="162" width="3" height="3" fill="#ffe7a3"/><rect x="34" y="161" width="13" height="9" fill="#e76f51"/><path d="M33 161 L40.5 156 L48 161Z" fill="#3b2f4f"/><rect x="37" y="165" width="3" height="3" fill="#ffe7a3"/><rect x="51" y="161" width="9" height="9" fill="#f4a261"/><path d="M50 161 L55.5 156 L61 161Z" fill="#3b2f4f"/><rect x="61" y="158" width="15" height="12" fill="#f4a261"/><path d="M60 158 L68.5 153 L77 158Z" fill="#3b2f4f"/><rect x="82" y="158" width="14" height="12" fill="#e76f51"/><path d="M81 158 L89.0 153 L97 158Z" fill="#3b2f4f"/><rect x="100" y="161" width="9" height="9" fill="#e76f51"/><path d="M99 161 L104.5 156 L110 161Z" fill="#3b2f4f"/><rect x="111" y="159" width="11" height="11" fill="#e9c46a"/><path d="M110 159 L116.5 154 L123 159Z" fill="#3b2f4f"/><rect x="127" y="158" width="11" height="12" fill="#e9c46a"/><path d="M126 158 L132.5 153 L139 158Z" fill="#3b2f4f"/><rect x="130" y="162" width="3" height="3" fill="#ffe7a3"/><rect x="143" y="161" width="14" height="9" fill="#f1faee"/><path d="M142 161 L150.0 156 L158 161Z" fill="#3b2f4f"/><rect x="146" y="165" width="3" height="3" fill="#ffe7a3"/><rect x="163" y="158" width="9" height="12" fill="#e76f51"/><path d="M162 158 L167.5 153 L173 158Z" fill="#3b2f4f"/><rect x="176" y="158" width="14" height="12" fill="#e63946"/><path d="M175 158 L183.0 153 L191 158Z" fill="#3b2f4f"/><rect x="194" y="159" width="13" height="11" fill="#f1faee"/><path d="M193 159 L200.5 154 L208 159Z" fill="#3b2f4f"/><rect x="197" y="163" width="3" height="3" fill="#ffe7a3"/><rect x="209" y="156" width="14" height="14" fill="#2a9d8f"/><path d="M208 156 L216.0 151 L224 156Z" fill="#3b2f4f"/><rect x="212" y="160" width="3" height="3" fill="#ffe7a3"/><rect x="226" y="159" width="13" height="11" fill="#f1faee"/><path d="M225 159 L232.5 154 L240 159Z" fill="#3b2f4f"/><rect x="242" y="162" width="13" height="8" fill="#f4a261"/><path d="M241 162 L248.5 157 L256 162Z" fill="#3b2f4f"/><rect x="257" y="160" width="15" height="10" fill="#e9c46a"/><path d="M256 160 L264.5 155 L273 160Z" fill="#3b2f4f"/><rect x="276" y="157" width="9" height="13" fill="#f4a261"/><path d="M275 157 L280.5 152 L286 157Z" fill="#3b2f4f"/><rect x="290" y="156" width="15" height="14" fill="#f1faee"/><path d="M289 156 L297.5 151 L306 156Z" fill="#3b2f4f"/><rect x="293" y="160" width="3" height="3" fill="#ffe7a3"/><rect x="308" y="159" width="13" height="11" fill="#a8dadc"/><path d="M307 159 L314.5 154 L322 159Z" fill="#3b2f4f"/><rect x="311" y="163" width="3" height="3" fill="#ffe7a3"/><rect x="322" y="159" width="11" height="11" fill="#f4a261"/><path d="M321 159 L327.5 154 L334 159Z" fill="#3b2f4f"/><rect x="325" y="163" width="3" height="3" fill="#ffe7a3"/><rect x="339" y="157" width="11" height="13" fill="#a8dadc"/><path d="M338 157 L344.5 152 L351 157Z" fill="#3b2f4f"/><rect x="342" y="161" width="3" height="3" fill="#ffe7a3"/><rect x="354" y="160" width="14" height="10" fill="#e76f51"/><path d="M353 160 L361.0 155 L369 160Z" fill="#3b2f4f"/><rect x="371" y="158" width="10" height="12" fill="#f4a261"/><path d="M370 158 L376.0 153 L382 158Z" fill="#3b2f4f"/><rect x="374" y="162" width="3" height="3" fill="#ffe7a3"/><rect x="383" y="160" width="15" height="10" fill="#e9c46a"/><path d="M382 160 L390.5 155 L399 160Z" fill="#3b2f4f"/><rect x="0" y="170" width="400" height="70" fill="url(#auA)"/><g stroke="#f3c77e" stroke-opacity=".45" stroke-width="2"><path d="M270 182h60M282 190h36M290 198h22"/></g><path d="M226 200 H330 L318 214 H238Z" fill="#fff"/><rect x="246" y="190" width="62" height="10" rx="2" fill="#f1f1f1"/><rect x="258" y="182" width="36" height="8" rx="2" fill="#e8e8e8"/><rect x="286" y="172" width="9" height="12" fill="#d64545"/><path d="M250 195h54" stroke="#2d5f80" stroke-width="2" stroke-dasharray="3 3"/><ellipse cx="86" cy="222" rx="30" ry="8" fill="#2b2445"/><path d="M78 222 L81 180 H91 L94 222Z" fill="#fff"/><path d="M79.6 206 H92.4 L93 214 H79Z M80.6 190 H91.4 L91.9 198 H80.1Z" fill="#d64545"/><rect x="79" y="174" width="14" height="7" rx="2" fill="#2b2445"/><circle cx="86" cy="177" r="10" fill="#ffe9a8" opacity=".55"/></svg>` },
  gestion: { svg:`<svg class="arte-svg" viewBox="0 0 400 240" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><linearGradient id="agC" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5b3fa0"/><stop offset="1" stop-color="#1c6f73"/></linearGradient></defs><rect width="400" height="240" fill="url(#agC)"/><circle cx="340" cy="30" r="80" fill="#fff" opacity=".06"/><circle cx="40" cy="220" r="70" fill="#fff" opacity=".06"/><rect x="110" y="42" width="130" height="164" rx="12" fill="#fff"/><rect x="128" y="62" width="70" height="9" rx="4" fill="#5b3fa0"/><g fill="#d6d9e4"><rect x="128" y="82" width="94" height="6" rx="3"/><rect x="128" y="96" width="80" height="6" rx="3"/><rect x="128" y="110" width="88" height="6" rx="3"/></g><g fill="#1c9e8f"><rect x="132" y="170" width="14" height="20" rx="2"/><rect x="152" y="156" width="14" height="34" rx="2"/><rect x="172" y="144" width="14" height="46" rx="2"/><rect x="192" y="160" width="14" height="30" rx="2" fill="#f2a541"/></g><circle cx="286" cy="98" r="40" fill="#fff" opacity=".95"/><path d="M286 98 L286 58 A40 40 0 0 1 322 116Z" fill="#f2a541"/><path d="M286 98 L322 116 A40 40 0 0 1 262 130Z" fill="#1c9e8f"/><g><ellipse cx="290" cy="196" rx="26" ry="8" fill="#e0a82e"/><rect x="264" y="178" width="52" height="18" fill="#f2c14e"/><ellipse cx="290" cy="178" rx="26" ry="8" fill="#f7d774"/><ellipse cx="290" cy="170" rx="26" ry="8" fill="#e0a82e"/><rect x="264" y="160" width="52" height="10" fill="#f2c14e"/><ellipse cx="290" cy="160" rx="26" ry="8" fill="#f7d774"/></g></svg>` },
};
const arteDe = k => {
  const a = ARTE[k] || {};
  return a.foto ? `<span class="arte-foto" style="background-image:url('${a.foto}')"></span>` : (a.svg || '');
};

/* Las secciones de la app. Cada una es una ventana con su mosaico.
   `tejas(u, s, hoy)` devuelve el contenido y `linea(u, s, hoy)` la frase
   viva que se lee en la portada. */
const SECCIONES = {
  casa: {
    titulo:'Tu casa', icon:'home', color:'ok', ancha:true, lema:'Tu lote, tus visitas y tus cosas',
    sub:'Visitas, mensajes, paquetes y los datos de tu lote',
    /* Si está de salida (Salidas seguras), el "Volví" va arriba de todo
       también acá, además de la portada y de la ventana de la salida. */
    arriba(u){ const x = typeof Cuidado !== 'undefined' ? Cuidado.mio() : null; return x && x.salida && !x.salida.volvio && typeof tarjetaSalidaMia === 'function' ? tarjetaSalidaMia(x) : ''; },
    linea(u, s, hoy){
      const v = s.pases.filter(p => paseDeMiLote(p, u) && paseValidoEn(p, hoy)).length;
      const m = s.privados.filter(h => h.userId === u.id).reduce((n, h) => n + h.msgs.filter(x => x.from !== 'vecino' && !x.leido).length, 0) + dmNoLeidos();
      return [v && `${plural(v, 'visita esperada', 'visitas esperadas')} hoy`, m && `${plural(m, 'mensaje sin leer', 'mensajes sin leer')}`].filter(Boolean).join(' · ') || 'Todo en orden en tu lote';
    },
    /* Sin "Reservas" (29-09-2026, pedido de Claudio): el barrio todavía no
       tiene quincho, SUM, cancha ni pileta; no hay nada que reservar. */
    tejas(u, s, hoy){
      const misHoy = s.pases.filter(p => paseDeMiLote(p, u) && paseValidoEn(p, hoy));
      const privNoLeidos = s.privados.filter(h => h.userId === u.id).reduce((n, h) => n + h.msgs.filter(m => m.from !== 'vecino' && !m.leido).length, 0);
      return [
        teja({ a:'nuevo-pase', icon:'qr', t:'Autorizar una visita', s:'Visita, delivery, obra, personal o Uber/DiDi', destaca:true }),
        /* Emergencias se abre desde el corazón del DEA de la portada (09-10-2026, pedido de Claudio). */
        teja({ v:'visitas', icon:'users', color:'sky', t:'Mis visitas', s: misHoy.length ? `${plural(misHoy.length, 'esperada')} hoy` : 'Nadie anunciado hoy', n: misHoy.length || '' }),
        ...(!hayPaquetes() ? [] : [teja({ v:'mis-paquetes', icon:'box', color:'wood', t:'Mis paquetes', s:(() => { const n = paquetesDelLote(u).filter(p => !p.retirado).length; return n ? `${plural(n, 'paquete')} de tu lote en la garita` : 'Lo que llega a la garita para tu lote'; })(), badge: paquetesDelLote(u).filter(p => !p.retirado).length })]),
        teja({ v:'mensajes', icon:'chat', color:'accent', t:'Mensajes', s:'Privados con vecinos, la Administración y la Guardia', badge: privNoLeidos + dmNoLeidos() }),
        teja({ v:'expensas', icon:'wallet', color:'wood', t:'Mis expensas', s:`Tu cuenta, cupones y pagos` }),
        teja({ v:'sismo', icon:'sismo', color:'warn', t:'Preparados para un sismo', s:(() => { const ok = typeof revisionSemanalHecha === 'function' && tengoLote() ? revisionSemanalHecha() : true; return ok ? 'Mochila, plan familiar y qué hacer' : 'Falta la revisión de esta semana'; })() }),
        teja({ v:'salidas', icon:'pin', color:'sky', t:'Salidas seguras', s:(() => { const x = typeof Cuidado !== 'undefined' ? Cuidado.mio() : null, sa = x && x.salida && !x.salida.volvio ? x.salida : null;
          return sa ? `Estás de salida · al volver, tocá "Volví"` : 'Kayak, montaña y navegación: aviso de salida'; })(), badge:(() => { const x = typeof Cuidado !== 'undefined' ? Cuidado.mio() : null; return x && x.salida && !x.salida.volvio ? 1 : 0; })() }),
        teja({ v:'estoy-bien', icon:'heart', color:'ok', t:'Estoy bien', s:(() => { const x = typeof Cuidado !== 'undefined' ? Cuidado.mio() : null, d = x && x.activo ? Cuidado.estadoDiario(x) : null;
          return !d ? 'Un toque por día, para quien vive solo' : d.estado === 'ok' ? `Hoy avisaste a las ${hora(x.ultimo)}` : d.estado === 'pausa' ? 'En pausa' : 'Todavía no avisaste hoy'; })(),
          badge:(typeof Cuidado !== 'undefined' ? Cuidado.personas().filter(p => Cuidado.enAlerta(p) || (p.contactos[u.id] && !p.contactos[u.id].acepta)).length : 0) }),
        ...((m => m >= 10 || m <= 3)(new Date().getMonth() + 1) ? [teja({ v:'verano', icon:'sun', color:'ok', t:'Tu casa en verano', s:(() => { const n = typeof tareasVeranoQueTocan === 'function' ? tareasVeranoQueTocan().length : 0; return n ? `${plural(n, 'cosa para hacer', 'cosas para hacer')}` : 'Pasto, vereda, basura, viento y fuego'; })() }), teja({ v:'invierno', icon:'flame', color:'warn', t:'Tu casa en invierno', s:(() => { const n = typeof tareasQueTocan === 'function' ? tareasQueTocan().length : 0; return n ? `${plural(n, 'cosa para revisar', 'cosas para revisar')}` : 'Gas, monóxido, chimenea y caños'; })() })] : [teja({ v:'invierno', icon:'flame', color:'warn', t:'Tu casa en invierno', s:(() => { const n = typeof tareasQueTocan === 'function' ? tareasQueTocan().length : 0; return n ? `${plural(n, 'cosa para revisar', 'cosas para revisar')}` : 'Gas, monóxido, chimenea y caños'; })() }), teja({ v:'verano', icon:'sun', color:'ok', t:'Tu casa en verano', s:(() => { const n = typeof tareasVeranoQueTocan === 'function' ? tareasVeranoQueTocan().length : 0; return n ? `${plural(n, 'cosa para hacer', 'cosas para hacer')}` : 'Pasto, vereda, basura, viento y fuego'; })() })]),
        teja({ v:'peticiones', icon:'edit', color:'brand', t:'Peticiones a la garita', s:'Firmadas por vos y la guardia', n: s.peticiones.filter(p => p.userId === u.id && p.estado !== 'cerrada').length || '' }),
        teja({ v:'reclamos', icon:'clipboard', color:'warn', t:'Mis reclamos', s:'Privados con la Administración', n: s.reclamos.filter(r => r.userId === u.id && r.estado !== 'resuelto').length || '' }),
        teja({ v:'perfil', icon:'home', color:'ok', t:'Mi casa', s:'Quiénes están en tu lote, autos y mascotas' }),
        teja({ a:'mi-credencial', icon:'qr', color:'brand', t:'Mi credencial', s:'Tu QR para que la garita te reconozca sin mostrar el DNI' }),
        teja({ v:'ayuda', icon:'info', color:'sky', t:'Preguntas frecuentes', s:'Cómo se hace cada cosa' }),
        ...(s.infracciones.some(i => i.casa === u.casa && i.estado === 'notificada')
          ? [teja({ v:'infracciones', icon:'alert', color:'danger', t:'Notificación', s:'Podés presentar tu descargo', badge: s.infracciones.filter(i => i.casa === u.casa && i.estado === 'notificada').length })] : []),

      ].join('');
    },
  },
  comunidad: {
    titulo:'El barrio', icon:'muro', color:'brand', ancha:true, lema:'La vida entre vecinos',
    sub:'Lo que pasa entre vecinos',
    linea(u, s, hoy){
      const piz = s.posts.filter(p => p.createdAt > (Store.sesion.pizarronVisto || 0) && p.autor !== u.id).length;
      const vot = s.votaciones.filter(v => v.cierra > Date.now()).length;
      return [piz && `${plural(piz, 'novedad', 'novedades')} en el pizarrón`, vot && `${plural(vot, 'votación abierta', 'votaciones abiertas')}`].filter(Boolean).join(' · ') || 'Pizarrón, vecinos y votaciones';
    },
    /* Sin "Chat vecinal" (29-09-2026, pedido de Claudio): a los vecinos no les
       gustaba, se prestaba a diálogos no deseados. Lo público entre vecinos
       queda en el pizarrón; lo personal, en los mensajes privados. */
    tejas(u, s, hoy){
      const pizNuevas = s.posts.filter(p => p.createdAt > (Store.sesion.pizarronVisto || 0) && p.autor !== u.id).length;
      const votAbiertas = s.votaciones.filter(v => v.cierra > Date.now()).length;
      const compras = s.compras.filter(x => x.cierra > Date.now()).length;
      return [
        teja({ v:'pizarron', icon:'muro', t:'Pizarrón', s:'Guardia, Administración y vecinos', badge: pizNuevas, destaca:true }),
        teja({ v:'manual', icon:'book', color:'accent', t:'Manual y normas', s:'Cómo usar la app · reglamento, convivencia y protocolos' }),
        teja({ v:'vecinos', icon:'users', color:'sky', t:'Vecinos', s:'Buscá por nombre, oficio o dirección' }),
        teja({ v:'votaciones', icon:'vote', color:'accent', t:'Votaciones', s: votAbiertas ? `${plural(votAbiertas, 'abierta')}` : 'Sin votaciones abiertas', n: votAbiertas || '' }),
        teja({ v:'obras', icon:'wrench', color:'wood', t:'Obras', s:(() => { const h = s.obras.filter(o => o.avisoHoy?.fecha === hoy).length; return h ? `${plural(h, 'aviso')} para hoy` : `${plural(s.obras.filter(o => o.estado === 'activa').length, 'en curso', 'en curso')}`; })(), n: s.obras.filter(o => o.estado === 'activa').length || '' }),
        teja({ v:'viajes', icon:'car', color:'sky', t:'Viajes compartidos', s:'Centro, escuela, aeropuerto', n: s.viajes.filter(v => v.fecha >= hoy).length || '' }),
        teja({ v:'servicios', icon:'star', color:'wood', t:'Profesionales y oficios', s:'Vecinos que se pueden contactar' }),
        teja({ v:'mascotas', icon:'paw', color:'ok', t:'Mascotas', s:'Perdidas, encontradas y del barrio' }),
        teja({ v:'compras', icon:'cart', color:'brand', t:'Compras conjuntas', s: compras ? `${plural(compras, 'abierta')}` : 'Leña, gas, lo que sea', n: compras || '' }),
        teja({ v:'cosas', icon:'box', color:'wood', t:'Cosas para prestar', s:(() => { const n = aLista(s.cosas).filter(x => x.userId !== u.id && x.estado === 'disponible').length; return n ? `${plural(n, 'cosa disponible', 'cosas disponibles')}` : 'Escalera, hidrolavadora, generador…'; })() }),
        teja({ v:'nieve', icon:'snow', color:'sky', t:'Ángeles de la nieve', s:(() => { const n = aLista(s.nieve).filter(x => x.tipo === 'ayuda' && x.activo !== false && !x.angel).length; return n ? `${plural(n, 'casa espera', 'casas esperan')} un ángel` : 'Despejar la entrada de quien no puede'; })() }),
        teja({ v:'tablero', icon:'wallet', color:'wood', t:'Las cuentas del barrio', s:'En qué se gasta, mes a mes, y la morosidad (sin nombres)' }),
        teja({ v:'recoleccion', icon:'truck', color:'ok', t:'Residuos', s: proxRecoleccion() }),
        teja({ v:'mensajeria', icon:'mail', color:'sky', t:'Correos en el barrio', s:(() => { const n = typeof Mensajeria !== 'undefined' ? Mensajeria.adentro().length : 0; return n ? `${plural(n, 'correo', 'correos')} adentro ahora` : 'Andreani, OCA, Mercado Libre… en vivo'; })(), n: typeof Mensajeria !== 'undefined' && Mensajeria.adentro().length || '' }),
        teja({ v:'descargas', icon:'download', color:'sky', t:'Descargas', s:'Apps, instructivos y planillas', n:descargasVisibles().filter(d => (d.url || d.texto) && !esNormaDescarga(d)).length || '' }),
      ].join('');
    },
  },
  ciudad: {
    titulo:'Ushuaia y servicios', icon:'pin', color:'sky', ancha:true, lema:'Lo de afuera que igual te toca',
    sub:'Lo de afuera del barrio que igual te toca',
    linea(u, s, hoy){
      const cru = typeof Cruceros !== 'undefined' ? Cruceros.hoy().length : 0;
      const v = Vuelos.cuantosHoy();
      const f = proximoFeriado();
      return [cru && `${plural(cru, 'crucero recala', 'cruceros recalan')} hoy`, v && `${v} vuelos hoy`,
        f && `feriado ${relDia(f.fecha)}`].filter(Boolean).join(' · ') || 'Agenda, vuelos, cruceros, feriados y sismos';
    },
    tejas(u, s, hoy){
      const prox = proximoFeriado();
      return [
        teja({ v:'agenda', icon:'book', color:'sky', t:'Agenda de Ushuaia', s:'Comidas, taxis, súper y más', destaca:true }),
        teja({ v:'cruceros', icon:'send', color:'brand', t:'Cruceros', s: Cruceros.linea(), n: Cruceros.hoy().length || '' }),
        teja({ v:'ushuaia', icon:'pin', color:'sky', t:'Ushuaia hoy', s: prox ? `Próximo feriado: ${relDia(prox.fecha)}` : 'Temporadas, feriados, eventos' }),
        teja({ v:'vuelos', icon:'send', color:'accent', t:'Vuelos USH', s:'Arribos y partidas de hoy', n: Vuelos.cuantosHoy() || '' }),
        teja({ v:'municipio', icon:'pin', color:'sky', t:'Municipalidad de Ushuaia', s:'Trámites, reclamos urbanos, turnos' }),
        teja({ v:'sismos', icon:'sismo', color:'warn', t:'Sismos', s: (() => { const x = typeof Sismos !== 'undefined' && Sismos.destacado(); return x ? `M ${x.mag.toFixed(1)} · ${x.lugar} · ${hace(x.at)}` : 'En vivo en la región'; })() }),
      ].join('');
    },
  },
  gestion: {
    titulo:'Gestión del barrio', icon:'sliders', color:'accent', ancha:true, lema:'La trastienda del barrio',
    sub:'Administración, contabilidad, expensas y garita',
    solo:'admin',
    linea(u, s){
      const pend = s.users.filter(x => x.estado === 'pendiente').length;
      const pagos = s.pagos.filter(x => x.estado === 'informado' && !esPagoMP(x)).length;
      const recl = s.reclamos.filter(r => r.estado !== 'resuelto').length;
      return [pend && `${plural(pend, 'inscripción', 'inscripciones')}`, pagos && `${plural(pagos, 'pago informado', 'pagos informados')}`,
        recl && `${plural(recl, 'reclamo abierto', 'reclamos abiertos')}`].filter(Boolean).join(' · ') || 'Todo al día';
    },
    tejas(u, s){
      const pend = s.users.filter(x => x.estado === 'pendiente').length;
      return `<p class="muted small" style="margin:0 0 14px">Las facturas del mes se cargan y se corrigen en <b>Contabilidad</b>; al cerrar el mes se arman los cupones. <b>Expensas</b> muestra el resultado lote por lote y es donde se cobra: pagos, recibos y morosos.</p>
        <div class="mosaico">
        ${teja({ v:'admin', icon:'sliders', color:'accent', t:'Administración', s:'Inscripciones, vecinos, contenido y ajustes', badge: pend, destaca:true })}
        ${teja({ v:'contabilidad', icon:'file', color:'brand', t:'Contabilidad', s:'Facturas y gastos del mes, cierre, libro y ARCA' })}
        ${teja({ v:'cobranzas', icon:'wallet', color:'wood', t:'Expensas', s:'Cupones, cobros, por acreditar, morosos y recibos', badge: s.pagos.filter(x => x.estado === 'informado' && !esPagoMP(x)).length })}

        </div>
        ${diaADia(u, s)}`;
    },
  },
};
/* =========================================================
   EL DÍA A DÍA DE LA ADMINISTRACIÓN, POR SALAS (pedido de Claudio, 26-09)
   Antes eran dieciséis tejas sueltas, todas iguales, y había que leerlas
   una por una para encontrar algo. Ahora se ordenan por a quién le toca:
     · GARITA Y SEGURIDAD: lo que pasa en la entrada y la guardia;
     · VECINOS: las personas, sus mensajes, reclamos, votos y obras;
     · COMUNICACIÓN: lo que la Administración le dice a todo el barrio;
     · PROVEEDORES Y CUMPLIMIENTO: papeles al día (ART, seguros, datos).
   Cada sala tiene su color, una línea viva de lo que está pasando y, si
   hay algo que pide atención, el número arriba a la derecha. Adentro, cada
   renglón es una ventana. Se sacaron "Conectados ahora" y "Peticiones"
   (las peticiones quedan dentro de "Mensajes con la garita").
   ========================================================= */
function diaADia(u, s){
  const t = turnoAbierto(), hoy = hoyISO();
  const sinLeer = (h, yoSoy) => aLista(h && h.msgs).filter(m => m && m.from !== yoSoy && !m.leido).length;
  const msgVecinos = aLista(s.privados).filter(h => h && h.con !== 'guardia' && h.con !== 'interno' && h.con !== 'supAdmin' && h.con !== 'supGarita').reduce((a, h) => a + sinLeer(h, 'admin'), 0);
  const msgGarita = aLista(s.privados).filter(h => h && h.con === 'interno').reduce((a, h) => a + sinLeer(h, 'admin'), 0);
  const petPend = s.peticiones.filter(p => p.estado === 'pendiente').length;
  const reclamos = s.reclamos.filter(r => r.estado !== 'resuelto').length;
  const descargos = s.infracciones.filter(i => i.estado === 'descargo').length;
  const provMal = s.proveedores.filter(p => artEstado(p)[1] !== 'ok').length;
  const datosPend = typeof tareasDatosPendientes === 'function' ? tareasDatosPendientes() || 0 : 0;
  const votAbiertas = s.votaciones.filter(v => v.cierra > Date.now()).length;
  const obras = s.obras.filter(o => o.estado === 'activa').length;
  const frec = aLista(s.frecuentes).filter(f => f && !f.baja).length + (typeof personalFijoVecinos === 'function' ? personalFijoVecinos().length : 0);
  const alertasAct = aLista(s.alertas).filter(alertaActiva).length;
  const comAct = (s.comunicados || []).filter(c => !c.archivado).length;
  const conCuenta = s.users.filter(x => x.estado === 'aprobado' && /^Lote\s/.test(x.casa || '')).length;
  const ingresos = pasesDelDia().length;
  const SALAS = [
    { k:'garita', t:'Garita y seguridad', icon:'gate', color:'brand',
      linea: `${t ? `Turno ${esc(t.turno)} · ${esc(aLista(t.guardias).join(', ')) || 'sin guardias anotados'}` : 'Sin turno abierto'} · ${plural(ingresos, 'ingreso', 'ingresos')} hoy`,
      items:[
        { v:'garita', icon:'eye', t:'Garita en vivo', s:`Ingresos, camión${hayPaquetes() ? ' y paquetes' : ''} · solo para mirar`, n:ingresos },
        { v:'visitas-barrio', icon:'users', t:'Visitas del barrio', s:'Todas las anunciadas: ver, editar o borrar' },
        { v:'bitacora', icon:'book', t:'Bitácora', s:'Libro de guardia · lo escribe la garita, acá se lee' },
        { v:'turnos', icon:'clock', t:'Turnos de la garita', s: t ? 'Abierto ahora · horarios y policías' : 'Horarios, guardias y policías' },
        { v:'privado', p:'interno', icon:'shield', t:'Mensajes con la garita', s:'Chat con la garita y los pedidos firmados de los vecinos', badge: msgGarita + petPend },
        { v:'frecuentes', icon:'qr', t:'Ingresos frecuentes', s:'QR fijo de proveedores y el personal fijo de los vecinos', n: frec || '' },
        { v:'supervisores', icon:'eye', t:'Supervisión de la guardia', s: typeof haySupervision === 'function' && haySupervision() ? 'Quién mira la garita en vivo y sus mensajes' : 'Habilitar a quien controla el servicio (solo mira)', badge: typeof sinLeerDeSupervision === 'function' ? sinLeerDeSupervision('supAdmin') : 0 },
      ] },
    { k:'vecinos', t:'Vecinos', icon:'users', color:'accent',
      linea: `${plural(conCuenta, 'vecino con cuenta', 'vecinos con cuenta')} · ${s.padron.length ? plural(s.padron.length, 'unidad', 'unidades') + ' en el padrón' : 'padrón sin cargar'}`,
      items:[
        { v:'padron', icon:'users', t:'Padrón', s:'Buscá por apellido, lote, DNI o correo' },
        { v:'privado', p:'admin', icon:'lock', t:'Mensajes de vecinos', s:'Conversaciones privadas con la Administración', badge: msgVecinos },
        { v:'reclamos', icon:'clipboard', t:'Reclamos', s:'Responder y publicar', badge: reclamos },
        { v:'infracciones', icon:'alert', t:'Infracciones', s:'Graduales, con descargo', badge: descargos },
        { v:'votaciones', icon:'vote', t:'Votaciones', s:'Abrir una, resultados y actas', n: votAbiertas || '' },
        { v:'obras', p: s.obras.some(o => o.estado === 'pendiente') ? 'pendientes' : 'activas', icon:'wrench', t:'Obras', s:'De los vecinos y del barrio', n: obras || '' },
      ] },
    { k:'comunicacion', t:'Comunicación', icon:'bell', color:'sky',
      linea: comAct || alertasAct ? [comAct && plural(comAct, 'comunicado vigente', 'comunicados vigentes'), alertasAct && plural(alertasAct, 'aviso urgente activo', 'avisos urgentes activos')].filter(Boolean).join(' · ') : 'Lo que la Administración le dice a todo el barrio',
      items:[
        { v:'comunicados', icon:'tack', t:'Comunicados importantes', s:'Ventana, sonido y acuse de recibo', n: comAct || '' },
        { a:'nuevo-post', v:'aviso', icon:'muro', t:'Publicar en el pizarrón', s:'Para lo que no es urgente' },
        { v:'manual', icon:'book', t:'Manual de uso', s:'El que leen los vecinos, con los capítulos de garita y Administración' },
        { v:'alertas', icon:'siren', t:'Avisos urgentes por zona', s:'Corte de luz, nieve, portón… con respuesta', n: alertasAct || '' },
      ] },
    { k:'cumplimiento', t:'Proveedores y cumplimiento', icon:'box', color:'wood',
      linea: provMal || datosPend ? [provMal && plural(provMal, 'proveedor con papeles por vencer', 'proveedores con papeles por vencer'), datosPend && plural(datosPend, 'tarea de datos pendiente', 'tareas de datos pendientes')].filter(Boolean).join(' · ') : 'Todo en regla',
      items:[
        { v:'proveedores', icon:'box', t:'Proveedores', s:'ART y seguro al día', badge: provMal },
        { v:'proteccion', icon:'lock', t:'Protección de datos', s:'AAIP, confidencialidad e incidentes', badge: datosPend },
        { v:'aporte', icon:'heart', t:'Publicidad y aporte al barrio', s:'El 50 % de lo que pagan los comercios · compromiso y entregas' },
      ] },
  ];
  /* El Hotel Los Cauquenes tiene su propia sala (js/v-hotel.js), la última,
     después de Proveedores y cumplimiento (pedido de Claudio, 27-09-2026). */
  if (typeof salaHotel === 'function') SALAS.push(salaHotel());
  const renglon = x => `<button class="dd-item" data-a="${x.a || 'abrir'}" data-v="${esc(x.v || '')}" data-p="${esc(x.p || '')}">
      <span class="dd-ic">${I(x.icon)}</span><span class="dd-txt"><b>${x.t}</b><small>${x.s}</small></span>
      ${x.badge ? `<span class="dd-alerta">${x.badge > 99 ? '99+' : x.badge}</span>` : x.n !== undefined && x.n !== '' ? `<span class="dd-n">${x.n}</span>` : ''}${I('right')}</button>`;
  /* (21-10-2026) Arriba, el barrio ahora: semáforo, medidores y pendientes
     (js/portal-vivo.js). Las salas van en MOSAICO: la que tiene algo
     pendiente se agranda, con su color vivo, y el número cuenta. */
  return `${typeof portalVivo === 'function' ? portalVivo() : ''}<div class="dd-cab"><h2>Día a día</h2><span>Ordenado por sala: lo de la garita, lo de los vecinos, lo que se comunica y los papeles.</span></div>
    <div class="dd-salas dd-mosaico">${SALAS.map((g, i) => { const pend = g.items.reduce((a, x) => a + (+x.badge || 0), 0);
      return `<section class="dd-sala dd-${g.color}${pend ? ' grande' : ''}" aria-label="${esc(g.t)}" style="--i:${i}">
        <header><span class="dd-sala-ic">${I(g.icon)}</span><div><h3>${g.t}</h3><p>${g.linea}</p></div>
          ${pend ? `<span class="dd-pend" title="Piden atención"><span class="dn-num" data-k="dd-${g.k}" data-n="${Math.min(pend, 99)}">${pend > 99 ? '99+' : pend}</span></span>` : `<span class="dd-ok" title="Nada pendiente">${I('check')}</span>`}</header>
        <div class="dd-items">${g.items.map(renglon).join('')}</div></section>`; }).join('')}</div>`;
}
/* Cada sección es una ventana de verdad, con su lomo y su vuelta atrás.
   Arriba lleva su ilustración a lo ancho, con el título grande y la frase
   viva de lo que está pasando; abajo, las tejas. La idea es que abrir una
   sección se sienta como entrar a un lugar, no como abrir un menú. */
const bannerSeccion = (k, u, s, hoy) => {
  const S = SECCIONES[k];
  return `<div class="sec-banner s-${k}">
    <div class="sec-banner-arte">${arteDe(k)}</div>
    <div class="sec-banner-txt">
      <span class="sec-banner-ic ic-${S.color}">${I(S.icon)}</span>
      <div><small>${esc(S.lema || '')}</small><h2>${esc(S.titulo)}</h2><p>${esc(S.linea(u, s, hoy))}</p></div>
    </div></div>`;
};
for (const k in SECCIONES){
  const S = SECCIONES[k];
  R[k] = { titulo:S.titulo, icon:S.icon, color:S.color, sub:S.sub, ancha:S.ancha,
    render(){
      if (S.solo === 'admin' && !esAdmin()) return vacio('lock', 'Solo para la Administración.');
      const u = yo(), s = Store.s, hoy = hoyISO();
      const c = S.tejas(u, s, hoy);
      return `<div class="seccion-vista">${bannerSeccion(k, u, s, hoy)}
        ${S.arriba ? S.arriba(u, s, hoy) : ''}
        ${c.trim().startsWith('<p') ? c : `<div class="mosaico">${c}</div>`}</div>`;
    } };
}

/* =========================================================
   LUZ DEL DÍA
   Una barra que es el día entero, de 0 a 24 h: la franja clara es el
   tiempo con sol y el punto rojo es AHORA. El punto camina solo,
   segundo a segundo, y arriba lleva la hora con segundos. En Ushuaia
   esto no es un adorno: en junio hay siete horas de luz y en diciembre
   diecisiete, y se ve de un vistazo cuánto queda.
   ========================================================= */
function barraLuz(sol){
  const mSale = minutosDe(sol.sale), mPone = minutosDe(sol.pone), luzMin = Math.max(1, mPone - mSale);
  const pc = m => (m / 1440 * 100).toFixed(3);
  const ahora = new Date();
  const seg = ahora.getHours() * 3600 + ahora.getMinutes() * 60 + ahora.getSeconds();
  const esDeDia = Clima.esDeDia();
  const faltan = esDeDia ? mPone - Math.floor(seg / 60) : (mSale > seg / 60 ? mSale - seg / 60 : 1440 - seg / 60 + mSale);
  return `<div class="card">
    <div class="row" style="justify-content:space-between;margin-bottom:14px">
      <b style="font-size:14px">Luz del día</b>
      <span class="muted small">${Math.floor(luzMin / 60)} h ${luzMin % 60} min · ${esDeDia ? `anochece en ${Math.floor(faltan / 60)} h ${Math.round(faltan % 60)} min` : `amanece en ${Math.floor(faltan / 60)} h ${Math.round(faltan % 60)} min`}</span></div>
    <div class="luz24" data-reloj="luz" data-sale="${mSale}" data-pone="${mPone}">
      <div class="luz24-barra">
        <span class="luz24-dia" style="left:${pc(mSale)}%;width:${pc(mPone - mSale)}%"></span>
        ${[6,12,18].map(h => `<span class="luz24-marca" style="left:${pc(h * 60)}%"></span>`).join('')}
        <i class="luz24-punto" style="left:${pc(seg / 60)}%"></i>
        <b class="luz24-hora" style="left:${pc(seg / 60)}%">${String(ahora.getHours()).padStart(2,'0')}:${String(ahora.getMinutes()).padStart(2,'0')}:${String(ahora.getSeconds()).padStart(2,'0')}</b>
      </div>
      <div class="luz24-pie"><span>0 h</span><span>${I('sunrise')}${sol.sale}</span><span>${I('sunset')}${sol.pone}</span><span>24 h</span></div>
    </div></div>`;
}
/* El punto camina sin redibujar la pantalla: se mueve solo el punto y su
   etiqueta. Redibujar toda la portada cada segundo sería un despropósito. */
const Reloj = {
  timer:null,
  arrancar(){
    if (this.timer) return;
    this.timer = setInterval(() => this.paso(), 1000);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) this.paso(); });
  },
  paso(){
    if (document.hidden) return;
    const cajas = $$('[data-reloj="luz"]');
    if (!cajas.length) return;
    const d = new Date();
    const seg = d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds();
    const izq = (seg / 60 / 1440 * 100).toFixed(3) + '%';
    const txt = `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}`;
    cajas.forEach(c => {
      const punto = c.querySelector('.luz24-punto'), hora = c.querySelector('.luz24-hora');
      if (punto) punto.style.left = izq;
      if (hora){ hora.style.left = izq; hora.textContent = txt; }
    });
  },
};

/* La puerta de una sección tal como se ve en la portada: una ventana con
   su dibujo, que se agranda un poco al pasar por encima e invita a entrar. */
const puerta = (k, u, s, hoy) => {
  const S = SECCIONES[k];
  return `<button class="puerta-arte s-${k}" data-a="abrir" data-v="${k}" aria-label="Abrir ${esc(S.titulo)}">
    <span class="pa-arte">${arteDe(k)}</span>
    <span class="pa-pie">
      <span class="pa-ic ic-${S.color}">${I(S.icon)}</span>
      <span class="pa-txt"><b>${esc(S.titulo)}</b><small>${esc(S.linea(u, s, hoy))}</small></span>
      <span class="pa-entrar">Entrar${I('right')}</span>
    </span></button>`;
};

/* =========================================================
   PIZARRA DEL DÍA
   Va arriba de todo en la portada, antes del hotel, en dos columnas:
     · PARA TODO EL BARRIO: avisos de la guardia y la Administración, los
       comunicados, las alertas, un SOS abierto, las obras en curso, los
       viajes compartidos, las compras conjuntas, el clima que complica y el
       camión de mañana. Nadie tiene que acordarse de abrir la campanita
       para enterarse.
     · PARA VOS: lo que es tuyo (alguien pregunta por vos en la garita, un
       paquete, una votación pendiente, un mensaje, tu propia alerta).
   Cada aviso es una ventanita con el tono de su importancia, para priorizar
   de un vistazo:
     ROJO      importante (alertas, SOS, comunicados, lo urgente),
     AMARILLO  tener en cuenta (guardia, avisos, obras hoy, perdidos),
     VERDE     para saber (eventos, viajes, compras, novedades).
   Mientras no lo viste, TITILA en su tono. Al tocarlo se abre y deja de
   titilar (en este equipo).
   ========================================================= */
const TIPOS_PIZARRA = ['guardia', 'aviso', 'alerta', 'evento', 'perdido'];
const NIVELES_PZ = { rojo:'Importante', amarillo:'Tener en cuenta', verde:'Para saber' };
const NIVEL_POST = { alerta:'rojo', guardia:'amarillo', aviso:'amarillo', perdido:'amarillo', evento:'verde' };
const nivelDeColor = c => c === 'danger' ? 'rojo' : c === 'warn' ? 'amarillo' : 'verde';
const ORDEN_NIVEL = { rojo:0, amarillo:1, verde:2 };
/* Los avisos para todos que ya salen por su propio camino en la pizarra
   (el post, la obra, la compra) no se repiten. */
const LINKS_YA_EN_PIZARRA = ['pizarron', 'obras', 'compras', 'viajes', 'mascotas'];

/* Los avisos del tiempo llevan a "Ushuaia hoy", vengan de donde vengan. */
const ICONOS_CLIMA = ['snow', 'wind', 'thermo'];
/* EL MISMO AVISO, UNA SOLA VEZ
   La nieve prevista salía tres veces: como alerta del clima, como aviso
   automático de la tarde y como el aviso de ayer, que seguía. Si dos
   renglones dicen lo mismo, queda uno: el que lleva a una ventana. */
const normTit = t => String(t || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
function sinRepetidos(lista){
  const por = new Map();
  lista.forEach(x => {
    const k = normTit(x.titulo), y = por.get(k);
    if (!y) por.set(k, x);
    else if (y.a !== 'abrir' && x.a === 'abrir') por.set(k, { ...x, nuevo: x.nuevo && y.nuevo });
    else if (!x.nuevo && y.nuevo) y.nuevo = false;
  });
  return [...por.values()];
}

const cuandoFue = at => {
  const d = new Date(at), iso = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const h = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  return iso === hoyISO() ? `Hoy ${h}` : iso === sumarDias(hoyISO(), -1) ? `Ayer ${h}` : `${fechaCorta(iso)} ${h}`;
};

/* Lo visto se recuerda por equipo. La primera vez no titila todo lo viejo:
   solo lo del último día. */
const Pizarra = {
  volver: false,
  vistos(){
    const ses = Store.sesion;
    if (!ses.pzDesde){ ses.pzDesde = Date.now() - DIA; Store.guardarSesion(); }
    if (!ses.pzVistos || typeof ses.pzVistos !== 'object') ses.pzVistos = {};
    return ses.pzVistos;
  },
  nuevo(k, at){
    const v = this.vistos();
    return !v[k] && at > Math.max(Store.sesion.pzDesde || 0, Date.now() - 3 * DIA);
  },
  marcar(k){
    const v = this.vistos(); if (v[k]) return;
    v[k] = Date.now();
    const lim = Date.now() - 10 * DIA;
    Object.keys(v).forEach(x => { if (v[x] < lim) delete v[x]; });
    Store.guardarSesion();
    document.querySelectorAll(`.pz[data-k="${CSS.escape(k)}"],.pzr[data-k="${CSS.escape(k)}"],.pzt[data-k="${CSS.escape(k)}"]`).forEach(el => { el.classList.remove('titila'); el.classList.add('leido'); el.querySelector('.pz-nueva')?.remove(); });
  },
};
document.addEventListener('click', e => {
  const b = e.target.closest && e.target.closest('.pz[data-k],.pzr[data-k],.pzt[data-k]');
  if (!b) return;
  Pizarra.marcar(b.dataset.k);
  /* Tocado desde la pizarra abierta en la hoja: lo que se abra (otra hoja o
     una ventana) se cierra con "Atrás" o con la X y deja de nuevo la
     pizarra abierta. */
  Pizarra.volver = !!b.closest('#hoja');
}, true);
/* Se cerró la hoja de un aviso que se abrió desde la pizarra: vuelve la
   pizarra. (Si lo que se abrió fue una ventana, abrir() ya limpió la marca
   y la pizarra vuelve cuando se cierra esa ventana.) */
document.addEventListener('close', e => {
  if (!e.target || e.target.id !== 'hoja' || !Pizarra.volver) return;
  Pizarra.volver = false;
  setTimeout(() => { if (!hojaAbierta()) A['pizarra-toda'](); }, 40);
}, true);

function avisosGenerales(){
  const s = Store.s, u = yo(), hoy = hoyISO(), ahora = Date.now(), out = [];
  const medianoche = new Date(hoy + 'T00:00').getTime();
  const poner = x => out.push({ nuevo: Pizarra.nuevo(x.k, x.at), ...x });
  /* Un SOS de otro vecino que sigue abierto. */
  if (typeof sosEnCampanita === 'function') sosEnCampanita().filter(x => x.userId !== u.id).forEach(x => {
    const v = usuario(x.userId) || {}, t = TIPOS_SOS[x.tipo] || TIPOS_SOS.otra;
    poner({ k:'sos-' + x.id, nivel:'rojo', icon:'siren', tag:'SOS', at:x.at, titulo:`${t.nombre} · ${v.casa || ''}`,
      texto: x.estado === 'resuelta' ? 'Resuelta' : SOS_ESTADO[x.estado] || 'Activa', a:'notifs' });
  });
  aLista(s.comunicados).filter(c => c && c.para === 'todos' && !c.archivado && (!c.vence || c.vence >= hoy)).forEach(c =>
    poner({ k:'com-' + c.id, nivel:'rojo', icon: c.tipo === 'reunion' ? 'calendar' : 'tack', tag: c.tipo === 'reunion' ? 'Invitación' : 'Comunicado',
      at:c.at, titulo:c.titulo, texto:c.texto, de:'Administración', a:'ver-novedad', v:'com', id:c.id }));
  /* LO GENERAL QUEDA 24 HORAS, AUNQUE YA LO HAYAS LEÍDO
     Un aviso para todo el barrio no desaparece al abrirlo: sigue en la
     pizarra (quieto, sin titilar) hasta cumplir 24 horas, o hasta que
     quien lo subió lo baja. Las excepciones: lo que la Administración deja
     fijado, y un evento, que queda hasta el día en que se hace. */
  /* Lo que publica el SISTEMA solo (el viento, el resultado de una
     votación…) no dura 24 horas: se renueva a las 00 h de cada día, así la
     pizarra de hoy no arrastra los avisos automáticos de ayer. */
  aLista(s.posts).filter(p => p && (TIPOS_PIZARRA.includes(p.type) || p.autor === 'sistema' || usuario(p.autor)?.rol === 'admin') && !p.resuelto && !(typeof postVencido === 'function' && postVencido(p))
      && (p.type === 'servicio' ? true : p.autor === 'sistema' ? p.createdAt >= medianoche
        : (p.fijado || ahora - p.createdAt < DIA || (p.type === 'evento' && p.fecha && p.fecha >= hoy)))).forEach(p => {
    const t = TIPOS_POST[p.type] || TIPOS_POST.aviso, au = autorVisible(p.autor), c = typeof corteDe === 'function' ? corteDe(p) : null;
    /* Un corte de luz, agua o gas: rojo mientras dura, amarillo antes; el ícono titila (srv). */
    if (c) return poner({ k:'post-' + p.id, nivel: p.desde && p.desde <= ahora ? 'rojo' : 'amarillo', icon:c.icon, srv:p.servicio, tag: p.desde && p.desde <= ahora ? c.n + ' · ahora' : c.n, at:p.createdAt, titulo:p.title, texto:p.body,
      de:`Automático · ${p.fuente || ''}`, a:'ver-novedad', v:'post', id:p.id });
    poner({ k:'post-' + p.id, nivel: NIVEL_POST[p.type] || 'verde', icon:t.icon, tag:t.n, at:p.createdAt, titulo:p.title, texto:p.body,
      de:`${au.nombre}${au.casa && au.casa !== au.nombre ? ' · ' + au.casa : ''}`, fijo:p.fijado, a:'ver-novedad', v:'post', id:p.id });
  });
  /* Obras en curso: salen solas, y en amarillo si hoy hay movimiento. */
  aLista(s.obras).filter(o => o && o.estado === 'activa' && (!o.inicio || o.inicio <= hoy)).forEach(o => {
    const hoyHay = o.avisoHoy && o.avisoHoy.fecha === hoy;
    poner({ k:'obra-' + o.id + (hoyHay ? '-' + hoy : ''), nivel: hoyHay ? 'amarillo' : 'verde', icon: hoyHay ? 'truck' : 'wrench', tag: hoyHay ? 'Obra hoy' : 'Obra en curso',
      at: o.ultima || o.createdAt, titulo: hoyHay ? `${enObra(o)}: ${o.avisoHoy.texto}` : `${dondeObra(o)} · ${o.tipo}`,
      texto: hoyHay ? (o.avisoHoy.hora ? `Desde las ${o.avisoHoy.hora} h` : 'Hoy') + (aLista(o.avisoHoy.maq).includes('pesada') ? ' · entra maquinaria pesada' : '') : `${ETAPAS[o.etapa] || ''}${aLista(o.maq).includes('pesada') ? ' · con maquinaria pesada' : ''}${o.empresa ? ' · ' + o.empresa : ''}${o.finEstimado ? ' · fin estimado ' + fechaCorta(o.finEstimado) : ''}`,
      a:'abrir', v:'obras' });
  });
  aLista(s.viajes).filter(v => v && v.fecha >= hoy && v.userId !== u.id).forEach(v => {
    const au = usuario(v.userId) || {}, libres = v.tipo === 'ofrezco' ? v.lugares - aLista(v.anotados).length : null;
    poner({ k:'viaje-' + v.id, nivel:'verde', icon:'car', tag:'Viaje compartido', at:v.createdAt || ahora,
      titulo:`${v.tipo === 'ofrezco' ? 'Llevo' : 'Busco lugar'} → ${v.destino}`, texto:`${relDia(v.fecha)} ${v.hora} h · ${au.casa || ''}${libres !== null ? ' · ' + (libres > 0 ? plural(libres, 'lugar libre', 'lugares libres') : 'completo') : ''}${v.nota ? ' · ' + v.nota : ''}`,
      a:'abrir', v:'viajes' });
  });
  aLista(s.compras).filter(c => c && c.cierra > ahora).forEach(c =>
    poner({ k:'compra-' + c.id, nivel:'verde', icon:'cart', tag:'Compra conjunta', at:c.createdAt || ahora, titulo:c.titulo,
      texto:`Cierra ${fechaCorta(isoDe(new Date(c.cierra)))} · ${aLista(c.anotados).reduce((a, x) => a + (+x.cant || 0), 0)} de ${c.meta} ${c.unidad}`, a:'abrir', v:'compras' }));
  /* El tiempo y el camión: son de todos. */
  Clima.alertas().forEach(a => poner({ k:'clima-' + hoy + '-' + a.icon, nivel: nivelDeColor(a.nivel), icon:a.icon, tag:'Clima', at: new Date(hoy + 'T06:00').getTime(), titulo:a.t, texto:a.x, a:'abrir', v:'ushuaia' }));
  /* Los sismos fuertes o cercanos de las últimas 24 horas. */
  if (typeof Sismos !== 'undefined') Sismos.paraPizarra().forEach(x => poner({ k:'sismo-' + x.id, nivel: Sismos.nivel(x), icon:'sismo', tag:'Sismo', at:x.at,
    titulo:`Magnitud ${x.mag.toFixed(1)} · ${x.lugar}`, texto:`A ${x.km.toLocaleString('es-AR')} km del barrio${x.tsunami ? ' · con marca de tsunami' : ''}`, a:'abrir', v:'sismos' }));
  /* El camión de la basura adentro del barrio, en vivo. */
  const cam = typeof Camion !== 'undefined' && Camion.adentro();
  if (cam) poner({ k:'camion-' + cam.id, nivel:'amarillo', icon:'tacho', tag:'Residuos · ahora', at:cam.entra, titulo:'El camión de la basura está en el barrio', texto:`Entró a las ${hora(cam.entra)} h`, a:'abrir', v:'recoleccion' });
  /* Los avisos urgentes que siguen activos (para todo el barrio o tu zona). */
  if (typeof alertas === 'function') alertas().filter(a => alertaActiva(a) && (!aLista(a.lotes).length || alertaMeToca(a))).forEach(a =>
    poner({ k:'alerta-' + a.id, nivel:'rojo', icon:(TIPOS_ALERTA[a.tipo] || TIPOS_ALERTA.otro).icon, tag:'Aviso urgente', at:a.at, titulo:a.titulo, texto:`${a.zona}${a.texto ? ' · ' + a.texto : ''}`, a:'abrir', v:'alertas' }));
  const rec = recoleccionHoy();
  if (rec) poner({ k:'reco-' + hoy + '-' + rec.t, nivel: rec.vol ? 'amarillo' : 'verde', icon:'truck', tag:'Residuos', at: new Date(hoy + 'T07:00').getTime(), titulo:rec.t, texto:rec.x, a:'abrir', v:'recoleccion' });
  /* Los avisos automáticos para todos que no tienen otro lugar: quedan
     en la pizarra aunque ya se hayan leído (leídos, quietos), pero solo los
     del día: a las 00 h se van y entran los nuevos. */
  misNotifs().filter(n => aLista(n.para).includes('todos') && n.at >= medianoche && !avisoCamionViejo(n) && !LINKS_YA_EN_PIZARRA.includes(String(n.link || '').split(':')[0]))
    .forEach(n => out.push({ k:'n-' + n.id, nuevo:!aLista(n.leidas).includes(u.id), nivel: n.urgente ? 'rojo' : nivelDeColor(n.color), icon:n.icon || 'bell', tag:'Aviso', at:n.at, titulo:n.titulo, texto:n.texto,
      ...(ICONOS_CLIMA.includes(n.icon) ? { a:'abrir', v:'ushuaia' } : { a:'notif', id:n.id }) }));
  /* La garita no ve lo que lleva a secciones de vecinos (viajes, compras,
     votaciones): tocarlo no la llevaba a ningún lado. */
  return sinRepetidos(out).filter(x => x.a !== 'abrir' || typeof ventanaPermitida !== 'function' || ventanaPermitida(x.v)).sort((a, b) => (ORDEN_NIVEL[a.nivel] - ORDEN_NIVEL[b.nivel]) || (!!b.fijo - !!a.fijo) || b.at - a.at);
}
/* Los avisos que son tuyos y todavía no abriste. */
function avisosPersonales(){
  const u = yo();
  /* El reloj de TUS expensas (privado: sale de tu cuenta, nadie más lo ve).
     Mientras está, los avisos sueltos de "vencen las expensas" no se
     repiten en la pizarra (siguen en la campanita). */
  const exp = typeof avisoExpensas === 'function' ? avisoExpensas() : null;
  const reloj = exp ? [{ ...exp, nuevo: exp.siempre || Pizarra.nuevo(exp.k, exp.at) }] : [];
  /* Un paquete del lote en la garita queda en "Para vos" hasta que alguien
     del lote lo retira, aunque ya se haya leído el aviso (26-09-2026). */
  const paqs = esStaff() || !hayPaquetes() ? [] : paquetesDelLote(u).filter(p => !p.retirado).map(p => ({ k:'paq-' + p.id, nuevo:Pizarra.nuevo('paq-' + p.id, p.recibido), nivel:'amarillo', icon:'box', tag:'Para vos · paquete', at:p.recibido,
    titulo:`Paquete en la garita${p.hostId !== u.id ? ' para ' + nombreDe(p.hostId).split(' ')[0] : ''}`, texto:`${p.empresa}${p.detalle ? ' · ' + p.detalle : ''} · se retira con el QR de retiro`, a:'abrir', v:'mis-paquetes' }));
  const ids = new Set(paqs.map(x => x.k));
  /* Dos avisos con el mismo título (el de la helada que dio el motor y una
     copia vieja con otro texto) van una sola vez (sinRepetidos). */
  /* Estoy bien, nieve, la casa en invierno y los préstamos (27-09). */
  const cuid = [...(typeof pizarraCuidados === 'function' ? pizarraCuidados() : []), ...(typeof pizarraCasa === 'function' ? pizarraCasa() : []), ...(typeof pizarraSismo === 'function' ? pizarraSismo() : [])];
  return [...reloj, ...paqs, ...cuid, ...sinRepetidos(noLeidas().filter(n => !aLista(n.para).includes('todos') && !avisoCamionViejo(n) && !(ids.size && n.link === 'mis-paquetes' && /paquete/i.test(n.titulo || '') && !/retir/i.test(n.titulo || ''))
      && !(exp && String(n.link || '').split(':')[0] === 'expensas' && /vence|venci|impag|saldo/i.test(n.titulo || '')))
    .map(n => ({ k:'n-' + n.id, nuevo:true, nivel: n.urgente ? 'rojo' : nivelDeColor(n.color), icon:n.icon || 'bell',
      tag: aLista(n.para).includes(u.id) ? 'Para vos' : 'Para el equipo', at:n.at, titulo:n.titulo, texto:n.texto, a:'notif', id:n.id })))]

    .sort((a, b) => (!!b.siempre - !!a.siempre) || (ORDEN_NIVEL[a.nivel] - ORDEN_NIVEL[b.nivel]) || b.at - a.at);
}
const ventanita = x => `<button class="pz nv-${x.nivel} ${x.nuevo ? 'titila' : ''}" data-k="${esc(x.k)}" data-a="${x.a}" data-v="${esc(x.v || '')}" data-p="${esc(x.p || '')}" data-id="${esc(x.id || '')}" title="${NIVELES_PZ[x.nivel]}">
    <span class="pz-cab"><span class="pz-ic${x.srv ? ' srv-ic srv-' + esc(x.srv) : ''}">${I(x.icon)}</span><span class="pz-tag">${esc(x.tag)}</span>${x.fijo ? `<span class="nov-fijo">${I('tack')}</span>` : ''}${x.nuevo ? '<span class="pz-nueva">Nuevo</span>' : ''}<time>${cuandoFue(x.at)}</time></span>
    <b>${esc(x.titulo)}</b>${x.texto ? `<span class="pz-txt">${esc(x.texto)}</span>` : ''}${x.de ? `<span class="pz-de">${esc(x.de)}</span>` : ''}</button>`;

/* =========================================================
   LA PIZARRA, COMPACTA
   En el teléfono la pizarra en dos columnas, con tarjetas de dos
   renglones, ocupaba media portada y todo titilaba a la vez: lo
   importante se perdía entre lo demás. Ahora:
     · arriba, un semáforo que cuenta lo NO LEÍDO por color;
     · una sola lista de renglones finos (lo tuyo y lo del barrio juntos),
       lo no leído primero y, dentro de eso, rojo → amarillo → verde;
     · solo titila lo no leído, en su tono, y la barrita de color es la
       que late: lo ya leído queda quieto y más apagado;
     · se ven pocos (4); el resto, en "Ver todo", que abre la pizarra
       entera en dos columnas.
   Lo que pide una decisión tuya (tu SOS abierto, alguien en la garita
   que pregunta por vos, una visita que pide pase) va arriba como aviso
   con sus botones: eso no puede quedar escondido en una lista.
   ========================================================= */
function itemsPizarra(){
  const per = avisosPersonales().map(x => ({ ...x, tag: x.tag === 'Para vos' ? 'Para vos' : x.tag }));
  const gen = avisosGenerales();
  return [...per, ...gen].sort((a, b) => (!!b.nuevo - !!a.nuevo) || (ORDEN_NIVEL[a.nivel] - ORDEN_NIVEL[b.nivel]) || (!!b.fijo - !!a.fijo) || b.at - a.at);
}
const renglonPz = x => `<button class="pzr nv-${x.nivel} ${x.nuevo ? 'titila' : 'leido'}${x.siempre ? ' siempre' : ''}" data-k=
"${esc(x.k)}" data-a="${x.a}" data-v="${esc(x.v || '')}" data-p="${esc(x.p || '')}" data-id="${esc(x.id || '')}" title="${NIVELES_PZ[x.nivel]}">
    <span class="pzr-ic${x.srv ? ' srv-ic srv-' + esc(x.srv) : ''}">${I(x.icon)}</span>
    <span class="pzr-txt"><small>${esc(x.tag)}${x.fijo ? ' · fijado' : ''}</small><b>${esc(x.titulo)}</b></span>
    <time>${cuandoFue(x.at).replace(/^Hoy /, '')}</time></button>`;
/* Las acciones de lo personal que sí o sí tienen que estar a mano. */
function decisionesPendientes(){
  const u = yo(), s = Store.s;
  return urgentesVecino().filter((h, i) => i < 3 && /latido|a-info/.test(h) && /data-a="(sos-cancelar|llegada-si|sol-pase-si)"/.test(h));
}
/* LA PIZARRA, MÁS VISUAL (pedido de Claudio, 08-10-2026: "más atractiva
   para el vecino, más visual, más innovadora"). Lo que dice y cómo se marca
   como visto no cambia; cambia cómo se ve:
     · arriba, la fecha como una hoja de almanaque y un medidor de colores
       con lo que falta leer;
     · lo más importante, en una tarjeta grande en su color, con el texto;
     · lo demás, en tarjetitas que se deslizan con el dedo (en computadora,
       en grilla). Lo no leído tiene su punto que late y un brillo en su
       color; lo leído queda quieto y más suave.
   Ocupa más o menos lo mismo que la lista de renglones. */
const MAX_TARJETAS_PZ = 8;
const tarjetaPz = (x, grande) => `<button class="pzt ${grande ? 'pzd' : ''} nv-${x.nivel} ${x.nuevo ? 'titila' : 'leido'}${x.siempre ? ' siempre' : ''}" data-k="${esc(x.k)}" data-a="${x.a}" data-v="${esc(x.v || '')}" data-p="${esc(x.p || '')}" data-id="${esc(x.id || '')}" title="${NIVELES_PZ[x.nivel]}">
    ${grande ? `<span class="pzt-arr"><span class="pzt-ic${x.srv ? ' srv-ic srv-' + esc(x.srv) : ''}">${I(x.icon)}</span><span class="pzt-tag">${esc(x.tag)}${x.fijo ? ' · fijado' : ''}</span>${x.nuevo ? '<span class="pzt-nuevo"><i></i>Nuevo</span>' : ''}<time>${cuandoFue(x.at).replace(/^Hoy /, '')}</time></span>`
      : `<span class="pzt-arr"><span class="pzt-ic${x.srv ? ' srv-ic srv-' + esc(x.srv) : ''}">${I(x.icon)}${x.nuevo ? '<i class="pzt-punto" title="Nuevo"></i>' : ''}</span><time>${cuandoFue(x.at).replace(/^Hoy /, '')}</time></span><span class="pzt-tag">${esc(x.tag)}${x.fijo ? ' · fijado' : ''}</span>`}
    <b>${esc(x.titulo)}</b>${grande && x.texto ? `<span class="pzt-txt">${esc(x.texto)}</span>` : ''}
    ${grande ? `<span class="pzt-pie">${x.de ? `<span>${esc(x.de)}</span>` : '<span></span>'}<span class="pzt-abrir">Abrir${I('right')}</span></span>` : ''}</button>`;
function pizarraDelDia(){
  const items = itemsPizarra(), dec = decisionesPendientes();
  const nuevos = items.filter(x => x.nuevo);
  const cuenta = n => nuevos.filter(x => x.nivel === n).length;
  const NOM = { rojo:['importante', 'importantes'], amarillo:['a tener en cuenta', 'a tener en cuenta'], verde:['para saber', 'para saber'] };
  const hoy = new Date(), mes = hoy.toLocaleDateString('es-AR', { month:'short' }).replace('.', '');
  const medidor = nuevos.length
    ? `<div class="pzv-medidor"><div class="pzv-barra">${['rojo', 'amarillo', 'verde'].filter(cuenta).map(n => `<i class="nv-${n}" style="flex:${cuenta(n)}"></i>`).join('')}</div>
        <div class="pzv-luces">${['rojo', 'amarillo', 'verde'].filter(cuenta).map(n => `<span class="nv-${n}"><i></i>${cuenta(n)} ${NOM[n][cuenta(n) > 1 ? 1 : 0]}</span>`).join('')}</div></div>`
    : '';
  const [top, ...resto] = items;
  const carrusel = resto.slice(0, MAX_TARJETAS_PZ - 1), faltan = items.length - 1 - carrusel.length;
  return `<div class="pzv">
    <div class="pzv-cab">
      <span class="pzv-dia" aria-hidden="true"><small>${esc(mes)}</small><b>${hoy.getDate()}</b></span>
      <div class="pzv-tit"><h2>Pizarra del día</h2><small>${nuevos.length ? `${plural(nuevos.length, 'aviso sin leer', 'avisos sin leer')} · ${items.length} en total` : items.length ? `${I('check')}Ya viste todo · ${items.length} en la pizarra` : 'Hoy está tranquilo'}</small></div>
      ${items.length ? `<button class="pzv-todo" data-a="pizarra-toda">Ver todo${I('right')}</button>` : ''}</div>
    ${medidor}
    ${dec.length ? `<div class="pz-decisiones">${dec.join('')}</div>` : ''}
    ${top ? tarjetaPz(top, true) : `<div class="pzv-nada"><span class="pzv-sol">${I('check')}</span><span><b>Hoy no hay avisos</b><small>Lo que llegue para vos o para el barrio aparece acá, con su color.</small></span></div>${typeof tarjetaServicios === 'function' ? tarjetaServicios() : ''}`}
    ${carrusel.length ? `<div class="pzv-carrusel">${carrusel.map(x => tarjetaPz(x, false)).join('')}${faltan > 0 ? `<button class="pzt pzv-mas" data-a="pizarra-toda"><b>+${faltan}</b><span>${faltan > 1 ? 'avisos más' : 'aviso más'}</span>${I('right')}</button>` : ''}</div>` : ''}
  </div>`;
}
/* La pizarra entera, en una hoja: las dos columnas de antes. */
function pizarraCompleta(){
  const gen = avisosGenerales(), urg = urgentesVecino(), per = avisosPersonales();
  const colGen = `<div class="pz-col pz-general">
      <div class="pz-col-cab">${I('muro')}<b>Para todo el barrio</b><button class="link" data-a="novedad-al-pizarron">Pizarrón</button></div>
      ${gen.length ? `<div class="pz-renglones">${gen.map(renglonPz).join('')}</div>` : vacio('muro', 'Hoy no hay avisos para el barrio.')}</div>`;
  const colPer = `<div class="pz-col pz-personal">
      <div class="pz-col-cab">${I('user')}<b>Para vos</b></div>
      ${urg.length || per.length ? `${urg.join('')}<div class="pz-renglones">${per.map(renglonPz).join('')}</div>`
        : `<div class="pz-nada">${I('check')}<span>No tenés nada pendiente.</span></div>`}</div>`;
  return `<div class="pz-leyenda">${Object.entries(NIVELES_PZ).map(([k, t]) => `<span class="nv-${k}"><i></i>${t}</span>`).join('')}</div>
    <div class="pz-dos">${colPer}${colGen}</div>`;
}
A['pizarra-toda'] = () => { Pizarra.volver = false; hoja('Pizarra del día', pizarraCompleta(), { ancho:'900px' }); };
A['ver-novedad'] = el => {
  const s = Store.s, id = el.dataset.id;
  if (el.dataset.v === 'com'){
    const c = aLista(s.comunicados).find(x => x.id === id); if (!c) return;
    return hoja(c.tipo === 'reunion' ? 'Invitación' : 'Comunicado', `
      <div class="novedad-leer"><span class="pill p-danger">${I('tack')}De la Administración</span><time>${cuandoFue(c.at)}</time>
      <h3>${esc(c.titulo)}</h3><p>${esc(c.texto || '')}</p>
      ${c.tipo === 'reunion' && c.fecha ? `<div class="card plana small">${I('calendar')} ${fechaLarga(c.fecha)}${c.hora ? ' · ' + esc(c.hora) + ' h' : ''}${c.lugar ? ' · ' + esc(c.lugar) : ''}</div>` : ''}</div>
      <button class="btn btn-pri btn-block" data-a="cerrar-hoja" style="margin-top:14px">Listo</button>`);
  }
  const p = aLista(s.posts).find(x => x.id === id); if (!p) return;
  const t = TIPOS_POST[p.type] || TIPOS_POST.aviso, a = autorVisible(p.autor);
  const cs = typeof corteDe === 'function' ? corteDe(p) : null;
  hoja(cs ? cs.n : t.n, `<div class="novedad-leer"><span class="pill p-${t.c}">${cs ? icCorte(p) + esc(cs.n) : I(t.icon) + t.n}</span><time>${cuandoFue(p.createdAt)} · ${esc(a.nombre)}${a.casa && a.casa !== a.nombre ? ' · ' + esc(a.casa) : ''}</time>
    <h3>${esc(p.title)}</h3>${p.body ? `<p>${esc(p.body)}</p>` : ''}
    ${cs ? `<p class="muted small">${I('clock')} Se borra solo ${p.hasta ? 'cuando termina el corte (' + esc(cuandoFue(p.hasta)) + ')' : 'a las 24 horas'}. Fuente: ${esc(p.fuente || '')}${p.url ? ` · <a href="${esc(p.url)}" target="_blank" rel="noopener">ver la nota</a>` : ''}. Lo publicó la app sola: revisá la fuente ante cualquier duda.</p>` : ''}
    ${p.type === 'evento' && p.fecha ? `<div class="card plana small">${I('calendar')} ${fechaLarga(p.fecha)}${p.horaEv ? ' · ' + esc(p.horaEv) + ' h' : ''}${p.lugar ? ' · ' + esc(p.lugar) : ''}</div>` : ''}</div>
    <div class="btns" style="margin-top:14px"><button class="btn btn-sec" data-a="novedad-al-pizarron">${I('muro')}Ver en el pizarrón</button>
      <button class="btn btn-pri grow" data-a="cerrar-hoja">Listo</button></div>`);
};
A['novedad-al-pizarron'] = () => { cerrarHoja(); abrir('pizarron'); };

/* El DEA de la garita, sobre la foto: es lo que alguien tiene que saber
   sin buscarlo el día que hace falta. Desde el 09-10-2026 (pedido de
   Claudio) el corazón late y al tocarlo abre Emergencias, que salió de Tu casa. */
const deaHero = () => { const lugar = /garita/i.test(Store.s.config.dea || '') || !Store.s.config.dea ? 'en la garita' : Store.s.config.dea;
  return `<button class="dea-hero" data-a="abrir" data-v="emergencias" aria-label="DEA operativo ${esc(lugar)}. Abrir Emergencias">${I('heart')}<span><b>DEA operativo</b>${esc(lugar)}</span></button>`; };
/* El pie de la app: chico y en gris, para que esté pero no moleste.
   "by Claudio A. Ravasi" abre los términos de uso, los datos personales y
   el deslinde de responsabilidad. Hasta el 26-09 había además un renglón
   "Términos de uso · Datos personales · Responsabilidad" que abría
   exactamente lo mismo: se sacó para no repetir (pedido de Claudio). */
const pieApp = () => `<footer class="pie-app">
    <span>Barrio ${esc(Store.s.config.nombre)} · versión ${esc(window.VERSION || 'sin sellar')}</span>
    <span>Ushuaia · Tierra del Fuego, Antártida e Islas del Atlántico Sur</span>
    <button class="pie-autor" data-a="abrir" data-v="legal" title="Términos de uso, datos personales y deslinde de responsabilidad" aria-label="by Claudio A. Ravasi: términos de uso, datos personales y responsabilidad">by Claudio A. Ravasi</button></footer>`;

R.inicio = {
  titulo: 'Inicio', icon: 'home', ancha: true,
  render(){
    const u = yo(), s = Store.s, hoy = hoyISO(), c = Clima.d?.c;
    /* El propietario de un lote alquilado (o que no vive en el barrio) tiene su propia portada. */
    if (esPropDistancia(u) && typeof portadaPropietario === 'function') return portadaPropietario();
    const hr = new Date().getHours();
    const saludo = hr < 5 ? 'Buenas noches' : hr < 13 ? 'Buen día' : hr < 20 ? 'Buenas tardes' : 'Buenas noches';
    const [desc] = c ? Clima.cod(c.weather_code) : [''];
    const sol = Clima.sol();
    /* LA FOTO DE PORTADA, CENTRADA Y PAREJA
       El DEA va solo, arriba a la derecha, para que no se mezcle con el
       tiempo. Abajo, todo centrado: saludo, nombre, temperatura, y los
       datos del tiempo en una grilla de casillas iguales (cuatro en una
       fila, o dos y dos en el teléfono), así ningún renglón queda a medio
       llenar. El sismo va debajo, a lo ancho de esa misma grilla. */
    const hero = `<div class="hero"><div class="foto" style="background-image:url('${Clima.portada()}')"></div>
      ${deaHero()}
      ${typeof guardiaHero === 'function' ? guardiaHero() : ''}
      <div class="hero-centro">
        <div class="saludo">${saludo},</div>
        <h1>${esc(u.rol === 'vecino' ? u.nombre.split(' ')[0] : u.nombre)}</h1>
        <div class="sub">${esc(u.casa)} · ${fechaLarga(hoy)}</div>
        ${c ? `<div class="clima"><div class="temp">${Math.round(c.temperature_2m)}<small>°C</small></div>
          <div class="desc"><b>${desc}</b>Sensación ${Math.round(c.apparent_temperature)}°</div></div>
          <div class="clima-datos"><span>${I('wind')}${Clima.rumbo(c.wind_direction_10m)} ${Math.round(c.wind_speed_10m)} km/h</span>
            <span>${I('zap')}Ráfagas ${Math.round(c.wind_gusts_10m)}</span>
            <span>${I('sunrise')}${sol.sale}</span><span>${I('sunset')}${sol.pone}</span></div>`
          : `<div class="clima-datos una"><span>${I('cloud')}Cargando el clima de Ushuaia…</span></div>`}
        ${sismoHero()}
      </div>
    </div>`;

    const pron = Clima.d?.dd ? `<div class="pronostico">${[1,2,3].map(i => {
      const dd = Clima.d.dd; if (!dd.time[i]) return '';
      const [, ic] = Clima.cod(dd.weather_code[i]);
      return `<div><b>${i === 1 ? 'Mañana' : DIAS[fechaDe(dd.time[i]).getDay()]}</b>${I(ic)}
        <div class="t">${Math.round(dd.temperature_2m_max[i])}° <span>${Math.round(dd.temperature_2m_min[i])}°</span></div>
        <div class="v">${dd.snowfall_sum[i] >= 1 ? `❄ ${Math.round(dd.snowfall_sum[i])} cm` : `ráf. ${Math.round(dd.wind_gusts_10m_max[i])}`}</div></div>`; }).join('')}</div>`
      : `<div class="card muted small">${I('cloud')} Cargando el pronóstico…</div>`;

    /* LOS DOS BRAZOS NO SE REPITEN
       En modo vecino se ven las tres puertas de cualquier vecino. En modo
       Administración, la portada es SOLO la gestión: sin "Tu casa", "El
       barrio" ni "Ushuaia", que ya están en el modo vecino. Antes el modo
       Administración mostraba todo lo del vecino más lo de la gestión, y
       quien administra veía dos veces lo mismo. */
    const puertas = ['casa', 'comunidad', 'ciudad'].map(k => puerta(k, u, s, hoy)).join('');
    const bloqueSeguir = esAdmin()
      ? `${sec('Gestión del barrio')}${typeof bandaCuidadoGarita === 'function' ? bandaCuidadoGarita() : ''}${SECCIONES.gestion.tejas(u, s, hoy)}`

      : `${sec('Por dónde seguir')}<div class="puertas-arte">${puertas}</div>`;

    /* =========================================================
       LA PORTADA, DE ARRIBA ABAJO
         1. el saludo y el tiempo de ahora (hero),
         2. los próximos días y la luz del día,
         3. la pizarra del día, compacta: una línea por aviso y por color
            de importancia,
         4. por dónde seguir: las ventanas ilustradas,
         5. al pie, más tranquilas, las dos cintas (Ushuaia hoy y el
            Hotel Los Cauquenes): antes iban una debajo de la otra en el
            medio de la portada y eran demasiado estímulo,
         6. el pie con la versión y el lugar.
       Cada bloque ocupa el ancho entero y reparte su contenido en su
       propia grilla: en el teléfono se apila y en la computadora se abre.
       ========================================================= */
    return `${hero}
      <div class="inicio-lienzo">
        ${typeof mantHero === 'function' ? mantHero() : ''}
        ${typeof bloqueCuidado === 'function' ? bloqueCuidado() : ''}
        <section class="bloque dia-y-luz">
          <div>${sec('Próximos días')}${pron}</div>
          <div>${sec('Luz del día')}${barraLuz(sol)}</div>
        </section>
        ${(() => { const t = typeof tarjetaPush === 'function' && !esStaff() ? tarjetaPush(true) : ''; return t ? `<section class="bloque">${t}</section>` : ''; })()}
        <section class="bloque pizarra-dia">${pizarraDelDia()}</section>
        <section class="bloque" id="porDondeSeguir">${bloqueSeguir}</section>
        <section class="bloque cintas-pie">${ushuaiaHoy()}${tiraPromos()}</section>
        ${pieApp()}
      </div>`;
  },
};

/* =========================================================
   USHUAIA HOY, EN MOSAICO (pedido de Claudio, 10-10-2026: eligió la
   opción B, "bento", de las propuestas; idea de magicui, 22k★ en GitHub,
   el código es propio). Antes era una cinta que pasaba sola. Ahora:
     · una tarjeta GRANDE con lo que cambia el día (es feriado, recala un
       crucero, hay un evento, el crucero de mañana);
     · hasta cuatro tarjetas CHICAS con un número grande: cuántos días
       faltan para una temporada (o que está abierta), el próximo feriado,
       los vuelos de hoy, el próximo evento.
   Todas abren "Ushuaia hoy" (o Cruceros / Vuelos). En el teléfono, dos
   por renglón; en la computadora, la grande ocupa dos y las chicas al
   lado. Quieto: no se mueve ni titila.
   ========================================================= */
const diaCorto = iso => { const d = fechaDe(iso); return `${DIAS[d.getDay()]} ${d.getDate()}`; };
function itemsUshuaia(){
  const s = Store.s, hoy = hoyISO(), grandes = [], chicas = [];
  const info = diaInfo(hoy);
  if (info.feriado) grandes.push({ icon:'calendar', tono:'warn', tag:'Hoy', t:'Hoy es feriado', x:esc(info.feriado.nombre), v:'ushuaia' });
  else if (info.noLaborable) grandes.push({ icon:'calendar', tono:'warn', tag:'Hoy', t:'Día no laborable', x:esc(info.noLaborable.nombre), v:'ushuaia' });
  const cru = Cruceros.hoy(), cruMan = Cruceros.lista().filter(c => c.fecha === sumarDias(hoy, 1));
  if (cru.length) grandes.push({ icon:'send', tono:'brand', tag:'Hoy en el puerto', t:`Recala ${esc(conMayusculasBarco(cru[0].barco))}`,
    x:`${horaDe(cru[0].llega)} a ${horaDe(cru[0].sale)} h${cru[0].pasajeros ? ' · ' + cru[0].pasajeros + ' pasajeros' : ''}${cru.length > 1 ? ` · y ${cru.length - 1} más` : ''}`, v:'cruceros' });
  const evs = aLista(s.eventosCiudad).filter(e => e && e.fecha >= hoy).sort((a, b) => a.fecha.localeCompare(b.fecha));
  if (evs[0] && evs[0].fecha === hoy) grandes.push({ icon:'star', tono:'accent', tag:'Hoy en la ciudad', t:esc(evs[0].titulo), x:esc(evs[0].lugar || 'Ushuaia'), v:'ushuaia' });
  if (cruMan.length) grandes.push({ icon:'send', tono:'brand', tag:'Mañana en el puerto', t:`Recala ${esc(conMayusculasBarco(cruMan[0].barco))}`, x:`llega ${horaDe(cruMan[0].llega)} h`, v:'cruceros' });
  /* Las temporadas: la que está por abrir (cuántos días faltan) o la que está abierta. */
  aLista(s.temporadas).map(t => ({ t, on: enTemporada(t) })).map(x => ({ ...x, d: x.on ? diasHasta(x.t.hasta) : diasHasta(x.t.desde) }))
    .sort((a, b) => (b.on - a.on) || a.d - b.d).slice(0, 2).forEach(({ t, on, d }) => chicas.push(on
      ? { icon:t.icon || 'calendar', tono:'ok', valor: d <= 15 ? String(d) : 'Abierta', txt: d <= 15 ? `${d === 1 ? 'día' : 'días'} para que termine ${esc(t.nombre).toLowerCase()}` : esc(t.nombre), v:'ushuaia',
          gt:esc(t.nombre), gx: d <= 15 ? `termina en ${plural(d, 'día')}` : 'temporada abierta' }
      : { icon:t.icon || 'calendar', tono:'sky', valor:String(d), txt:`${d === 1 ? 'día' : 'días'} para ${esc(t.nombre).toLowerCase()}`, v:'ushuaia', gt:esc(t.nombre), gx:`abre en ${plural(d, 'día')}` }));
  const fer = proximoFeriado();
  if (fer && fer.fecha !== hoy) chicas.push({ icon:'calendar', tono:'warn', valor:diaCorto(fer.fecha), txt:`feriado · ${esc(fer.nombre)}`, v:'ushuaia', gt:`Feriado: ${esc(fer.nombre)}`, gx:relDia(fer.fecha) });
  const vu = typeof Vuelos !== 'undefined' && Vuelos.cuantosHoy ? Vuelos.cuantosHoy() : 0;
  if (vu) chicas.push({ icon:'send', tono:'sky', valor:String(vu), txt:'vuelos hoy en el aeropuerto', v:'vuelos', gt:`${vu} vuelos hoy`, gx:'en el aeropuerto de Ushuaia' });
  /* El próximo evento, si no cae el mismo día que el feriado (el aniversario de la ciudad salía dos veces). */
  const ev = evs.find(e => e.fecha !== hoy && !(fer && e.fecha === fer.fecha));
  if (ev) chicas.push({ icon:'star', tono:'accent', valor:diaCorto(ev.fecha), txt:esc(ev.titulo), v:'ushuaia', gt:esc(ev.titulo), gx:relDia(ev.fecha) });
  feriadosDe(+hoy.slice(0, 4)).filter(f => f.fecha === hoy && (f.ambito === 'católica' || f.ambito === 'judía'))
    .forEach(f => chicas.push({ icon: f.ambito === 'judía' ? 'star' : 'tree', tono:'wood', valor:'Hoy', txt:esc(f.nombre), v:'ushuaia' }));
  return { grande: grandes[0] || null, chicas: [...grandes.slice(1).map(g => ({ icon:g.icon, tono:g.tono, valor:g.tag === 'Mañana en el puerto' ? 'Mañana' : 'Hoy', txt:g.t, v:g.v })), ...chicas].slice(0, 4) };
}
function ushuaiaHoy(){
  const { grande, chicas } = itemsUshuaia();
  if (!grande && !chicas.length) return '';
  /* Si hoy no hay nada "grande", la primera chica pasa a ser la grande. */
  const g = grande || (() => { const c = chicas.shift(); return { icon:c.icon, tono:c.tono, tag:'Ushuaia hoy', t:c.gt || `${c.valor} ${c.txt}`, x:c.gx || '', v:c.v }; })();
  return `<div class="ushuaia-hoy uh-bento-caja"><div class="uh-cab">${I('pin')}<b>Ushuaia hoy</b><button class="link" data-a="abrir" data-v="ushuaia">Ver todo</button></div>
    <div class="uh-bento">
      <button class="uhb uhb-grande t-${g.tono}" data-a="abrir" data-v="${g.v}"><span class="uhb-ic">${I(g.icon)}</span><span class="uhb-txt"><small>${esc(g.tag)}</small><b>${g.t}</b>${g.x ? `<span>${g.x}</span>` : ''}</span></button>
      ${chicas.map(c => `<button class="uhb t-${c.tono}" data-a="abrir" data-v="${c.v}"><span class="uhb-fila"><b class="uhb-v">${esc(c.valor)}</b>${I(c.icon)}</span><span class="uhb-l">${c.txt}</span></button>`).join('')}
    </div></div>`;
}

/* =========================================================
   MARQUESINA
   Una cinta que va pasando sola de derecha a izquierda, para que se vea
   todo sin tener que entrar a la ventana. No parpadea ni salta: se
   desliza despacio y en bucle. Se frena al pasar el dedo o el mouse por
   encima, para poder leer y tocar tranquilo, y queda quieta (y se puede
   arrastrar a mano) si el equipo pide menos movimiento.

   El truco del bucle sin cortes: el contenido va DOS VECES. Cuando la
   cinta se corrió la mitad de su ancho, la segunda copia está justo
   donde arrancó la primera y la animación vuelve a empezar sin que se
   note. La copia lleva aria-hidden para que un lector de pantalla no
   lea todo dos veces.
   ========================================================= */
function marquesina(items, cls = ''){
  const seg = Math.max(18, Math.round(items.length * 4.5));   /* más cosas, más lento */
  const grupo = `<div class="marq-grupo">${items.join('')}</div>`;
  return `<div class="marquesina ${cls}" data-marq>
    <div class="marq-pista" style="--marq-dur:${seg}s">${grupo}${grupo.replace('<div class="marq-grupo">', '<div class="marq-grupo" aria-hidden="true">')}</div>
  </div>`;
}

function proxRecoleccion(){
  const r = recoleccionDias(), h = new Date().getDay();
  for (let i = 0; i < 7; i++){ const d = (h + i) % 7; if (r[d] && (i > 0 || ahoraMin() < minutosDe(Store.s.config.recoleccionHora))) return `${i === 0 ? 'Hoy' : i === 1 ? 'Mañana' : DIAS_L[d]}: ${r[d]}`; }
  return 'Días de recolección';
}

/* ---------- VISITAS del vecino ---------- */
/* =========================================================
   TU VISITA NO LLEGÓ (pedido de Claudio, 12-10-2026, idea de novu, 40k★:
   el aviso trae la respuesta). A las 2 horas de la hora anunciada, si la
   visita no entró, al vecino que la anunció le llega "… todavía no llegó"
   (regla visita-no-ingreso-aviso) con dos botones, en la app y en la
   notificación del celular (Android): "Cambiar el horario" abre la
   edición del pase con el día y el horario, y "Ya no viene" lo cancela
   (con confirmación) y le avisa a la garita en la bitácora. El aviso se va
   solo si la visita entra, si se cancela o si pasa la hora de salida.
   ========================================================= */
A['visita-no-llego'] = el => {
  const p = aLista(Store.s.pases).find(x => x && x.id === el.dataset.id), u = yo();
  if (!p || !u || p.hostId !== u.id) return;
  const est = estadoPase(p);
  if (est !== 'noingreso' && est !== 'esperado'){ toast(est === 'adentro' || est === 'salio' ? `${p.nombre} ya entró` : est === 'cancelado' ? 'Esa visita ya estaba cancelada' : 'Ya pasó el horario de esa visita', 'check'); return; }
  hoja('Tu visita no llegó', `${aviso('warn', 'clock', `${esc(p.nombre)} todavía no llegó`, `La esperabas ${p.dias?.length ? 'hoy' : relDia(p.fecha).toLowerCase()} de ${esc(p.desde)} a ${esc(p.hasta)} h. Si viene más tarde, cambiale el horario; si ya no viene, cancelá el pase así la garita no la espera.`)}
    <div class="vnl">
      <button class="vnl-b c-sky" data-a="editar-pase" data-id="${esc(p.id)}"><span class="vnl-i">${I('clock')}</span><span><b>Cambiar el horario</b><small>El día y la hora en que viene</small></span></button>
      <button class="vnl-b c-danger" data-a="visita-no-viene" data-id="${esc(p.id)}"><span class="vnl-i">${I('x')}</span><span><b>Ya no viene</b><small>Se cancela el pase y la garita lo sabe</small></span></button>
    </div>
    <button class="btn btn-sec btn-block" style="margin-top:10px" data-a="cerrar-hoja">Todavía viene: dejarlo así</button>`);
};
A['visita-no-viene'] = async el => {
  const p0 = aLista(Store.s.pases).find(x => x && x.id === el.dataset.id), u = yo(); if (!p0 || !u || !paseDeMiLote(p0, u)) return;
  if (!await confirmar('Ya no viene', `Se cancela el pase de ${esc(p0.nombre)}: el código deja de servir en la garita.`, { si:'Cancelar el pase', peligro:true })) return;
  Store.cambiar(s => { const p = s.pases.find(x => x.id === p0.id); if (!p) return; p.cancelado = Date.now();
    s.bitacora.unshift({ id:uid(), autor:u.id, tipo:'novedad', texto:`Visita anunciada que ya no viene: ${p.nombre} → ${u.casa || ''} (lo avisó el vecino; era de ${p.desde} a ${p.hasta} h). Pase cancelado.`, at:Date.now() }); });
  cerrarHoja(); toast('Listo: el pase quedó cancelado y la garita ya no la espera', 'check');
};
R.visitas = {
  titulo: 'Mis visitas', icon: 'users', color: 'sky', sub: 'Pases con código y QR para la garita',
  /* Desde el aviso "… todavía no llegó": visitas:no~<id>[~cambiar|~nollega].
     Desde el recordatorio de una hora antes: visitas:rec~<id>. */
  alPintar(param){
    const m = /^(no|rec)~([^~]+)(?:~(\w+))?$/.exec(param || ''); if (!m) return;
    const top = PILA[PILA.length - 1]; if (top && top.id === 'visitas') top.param = '';
    setTimeout(() => { const el = { dataset:{ id:m[2] } };
      if (m[1] === 'rec') A['visita-recordar'](el);
      else if (m[3] === 'cambiar') A['editar-pase'](el); else if (m[3] === 'nollega') A['visita-no-viene'](el); else A['visita-no-llego'](el); }, 120);
  },
  render(){
    const u = yo(), s = Store.s, hoy = hoyISO();
    const mios = s.pases.filter(p => paseDeMiLote(p, u) && !p.cancelado && !p.borrado);
    const deHoy = mios.filter(p => paseValidoEn(p, hoy) || p.log?.[hoy]);
    const futuros = mios.filter(p => !p.dias?.length && p.fecha > hoy).sort((a, b) => a.fecha.localeCompare(b.fecha));
    const fijos = mios.filter(p => p.dias?.length && (p.fechaFin || '') >= hoy);
    /* El personal fijo va solo en su sección (no se repite en "Hoy"); primero los que vienen hoy. */
    const deHoyV = deHoy.filter(p => !fijos.includes(p));
    fijos.sort((a, b) => paseValidoEn(b, hoy) - paseValidoEn(a, hoy) || String(a.desde).localeCompare(String(b.desde)));
    /* (21-10-2026, pedido de Claudio) Las visitas y las "llegó sin aviso" se
       van de Mis visitas 24 horas después de salir del barrio (las que no
       vinieron o no pasaron, 24 h después de su horario o de la respuesta).
       Siguen en "Ver mi historial completo". */
    const ahoraMs = Date.now(), en24 = t => !!t && ahoraMs - t < DIA;
    const llegadas = s.llegadas.filter(l => llegadaDeMiLote(l, u) && (l.estado === 'consultando' || llegadaAdentro(l) || en24(l.sale || l.respondido || l.at))).slice(0, 10);
    const pedidos = s.solicitudesPase.filter(r => r.hostId === u.id && r.estado === 'pendiente');
    return `
      ${superficie({ a:'link-pedir', icon:'share', color:'accent', t:'Pasale un enlace a tu visita', s:'Completa sus datos desde su celular y le sale su QR al instante' })}
      ${pedidos.map(r => aviso('info', 'qr', `${esc(r.nombre)} te pide un pase`, `${fechaCorta(r.fecha)} · ${r.desde}`, `<button class="btn btn-xs btn-ok" data-a="sol-pase-si" data-id="${r.id}">Aprobar</button><button class="btn btn-xs btn-sec" data-a="sol-pase-no" data-id="${r.id}">Rechazar</button>`)).join('')}
      ${sec('Hoy')}${deHoyV.length ? deHoyV.map(p => tarjetaPase(p)).join('') : vacio('users', fijos.some(p => paseValidoEn(p, hoy)) ? 'No anunciaste visitas para hoy. Tu personal fijo está acá abajo.' : 'No anunciaste a nadie para hoy.')}
      ${fijos.length ? sec('Personal fijo', `<span class="muted small">${fijos.filter(p => paseValidoEn(p, hoy)).length ? plural(fijos.filter(p => paseValidoEn(p, hoy)).length, 'viene', 'vienen') + ' hoy' : ''}</span>`) + fijos.map(tarjetaFijo).join('') : ''}
      ${futuros.length ? sec('Próximas') + futuros.map(p => tarjetaPase(p)).join('') : ''}
      ${(() => { const finVisita = p => { const outs = Object.values(p.log || {}).map(l => l && +l.out).filter(Boolean); if (outs.length) return Math.max(...outs);
          const d = fechaDe(p.fechaFin || p.fecha), [hh, mm] = String(p.hasta || '23:59').split(':').map(Number); d.setHours(hh || 23, mm || 0, 0, 0); return d.getTime(); };
        const idas = s.pases.filter(p => paseDeMiLote(p, u) && !p.borrado && !deHoy.includes(p) && !futuros.includes(p) && !fijos.includes(p)
          && (p.fechaFin || p.fecha) < hoy && en24(finVisita(p))).sort((a, b) => (b.fechaFin || b.fecha).localeCompare(a.fechaFin || a.fecha));
        return idas.length ? sec('Visitas de ayer', `<span class="muted small">se van 24 h después de salir</span>`) + idas.slice(0, 20).map(p => {
          const dias = Object.keys(p.log || {}).sort(), ult = dias.at(-1), l = ult ? p.log[ult] : null;
          return tarjetaPase(p).replace(/<span class="estado [^"]*">[^<]*<\/span>/, `<span class="estado e-${p.cancelado ? 'cancelado' : l?.out ? 'salio' : l?.in ? 'adentro' : 'vencido'}">${p.cancelado ? 'Cancelado' : l?.out ? `Salió ${hora(l.out)}` : l?.in ? `Entró ${hora(l.in)}` : 'No vino'}</span>`);
        }).join('') : ''; })()}
      ${llegadas.length ? sec('Llegadas sin aviso') + llegadas.map(l => `<div class="card" style="padding:12px 14px"><div class="pase"><span class="ic ic-warn">${I('gate')}</span>
        <div class="datos"><b>${esc(l.nombre)}</b><span>${esc(l.motivo || '')} · ${hace(l.at)}</span></div><span class="estado e-${l.sale ? 'salio' : l.estado}">${l.sale ? `Salió ${hora(l.sale)}` : { consultando:'Esperando', autorizado:'Autorizado', rechazado: l.noEsta ? 'No estaba' : 'Rechazado' }[l.estado]}</span></div>${l.respondio && l.respondio !== u.id ? `<div class="muted tiny" style="margin-top:6px">Contestó ${esc(nombreDe(l.respondio).split(' ')[0])}</div>` : ''}</div>`).join('') : ''}
      ${sec('Avisos a la guardia')}
      ${(() => { const au = ausenciaDe(u); return superficie({ a:'modo-viaje', icon:'lock', color:'wood', t: au ? `Casa sola hasta el ${fechaCorta(au.hasta)}` : 'Me voy de viaje', s: au ? 'La revisan una vez por día y te llega el aviso. Tocá para cambiar.' : 'La garita o el policía la revisa cada día y te avisa que está en orden' }); })()}
      ${superficie({ a:'aviso-guardia', icon:'shield', color:'brand', t:'Aviso rápido a la guardia', s:'Viene una visita sin aviso ni QR: que me avisen cuando llegue' })}
      ${sec('Historial')}
      ${superficie({ a:'hist-mis-visitas', icon:'clock', color:'sky', t:'Ver mi historial completo', s:'Todas tus visitas desde el primer día. Se trae de la base solo cuando lo pedís.' })}
      <p class="muted tiny" style="margin-top:14px">Cada visita (y cada "llegó sin aviso") se va de acá 24 horas después de salir del barrio; las ves todas en "Ver mi historial completo". En la app quedan las de los últimos ${Historial.diasVisitas()} días; las anteriores pasan al archivo histórico del barrio, sin DNI, celular ni patente (Ley 25.326), y las ves con el botón de arriba.</p>`;
  },
};
/* =========================================================
   VISITAS DEL BARRIO (Administración, pedido de Claudio, 11-10-2026)
   Todas las visitas anunciadas por los vecinos: hoy, las próximas, el
   personal fijo y las de la última semana. Cada una se puede ver, editar o
   borrar (botonesAdminPase). Las que borró el vecino no aparecen; la
   garita las sigue viendo en su historial del día.
   ========================================================= */
R['visitas-barrio'] = {
  titulo:'Visitas del barrio', icon:'users', color:'sky', ancha:true, sub:'Las anunciadas por los vecinos: ver, editar o borrar',
  render(q){
    if (!esAdmin()) return vacio('lock', 'Solo para la Administración.');
    const s = Store.s, hoy = hoyISO(), qq = normTxt(q || '');
    const todas = s.pases.filter(p => p && !p.borrado && (!qq || normTxt([p.nombre, p.patente, p.dni, usuario(p.hostId)?.casa, usuario(p.hostId)?.nombre, p.autoriza].join(' ')).includes(qq)));
    const fijos = todas.filter(p => p.dias?.length && (p.fechaFin || '') >= hoy && !p.cancelado);
    const deHoy = todas.filter(p => !fijos.includes(p) && (paseValidoEn(p, hoy) || p.log?.[hoy])).sort((a, b) => String(a.desde).localeCompare(String(b.desde)));
    const futuras = todas.filter(p => !p.dias?.length && p.fecha > hoy && !p.cancelado).sort((a, b) => (a.fecha + a.desde).localeCompare(b.fecha + b.desde));
    const pasadas = todas.filter(p => !fijos.includes(p) && !deHoy.includes(p) && !futuras.includes(p) && (p.fechaFin || p.fecha) >= sumarDias(hoy, -7) && (p.fechaFin || p.fecha) <= hoy)
      .sort((a, b) => (b.fechaFin || b.fecha).localeCompare(a.fechaFin || a.fecha));
    const lista = ls => ls.map(p => tarjetaPase(p, { garita:true })).join('');
    return `<form data-f="buscar-vis-barrio" class="linea-form" style="margin-bottom:12px"><input name="q" id="qVisB" value="${esc(q || '')}" placeholder="Nombre, patente, DNI, lote o vecino"><button class="btn btn-pri">${I('search')}</button></form>
      ${sec('Hoy', `<span class="muted small">${deHoy.length}</span>`)}${deHoy.length ? lista(deHoy) : vacio('users', qq ? 'Nadie de hoy coincide con la búsqueda.' : 'No hay visitas anunciadas para hoy.')}
      ${futuras.length ? sec('Próximas', `<span class="muted small">${futuras.length}</span>`) + lista(futuras) : ''}
      ${fijos.length ? sec('Personal fijo', `<span class="muted small">${fijos.length}</span>`) + lista(fijos) : ''}
      ${pasadas.length ? sec('Última semana', `<span class="muted small">${pasadas.length}</span>`) + lista(pasadas.slice(0, 40)) : ''}
      <p class="muted tiny" style="margin-top:14px">${I('info')} Al editar o borrar una visita, al vecino que la anunció le llega el aviso y queda anotado en la auditoría. Lo que ya pasó por la garita queda en su historial.</p>`;
  },
};
F['buscar-vis-barrio'] = d => abrir('visitas-barrio', d.q || '');

A['nuevo-pase'] = (el) => {
  const tipo0 = el?.dataset?.v && TIPOS_PASE[el.dataset.v] ? el.dataset.v : 'visita';
  const hoy = hoyISO(), h = new Date(); h.setMinutes(0);
  const desde = `${pad(Math.min(h.getHours() + 1, 22))}:00`, hasta = `${pad(Math.min(h.getHours() + 5, 23))}:00`;
  hoja('Autorizar una visita', `<form data-f="nuevo-pase">
    <div class="field"><label>¿Quién viene?</label><div class="seg">${Object.entries(TIPOS_PASE).filter(([k]) => k !== 'invitado').map(([k, t], i) =>
      `<label><input type="radio" name="tipo" value="${k}" ${k === tipo0 ? 'checked' : ''}><span>${I(t.icon)}${t.n}</span></label>`).join('')}</div></div>
    <div class="field"><label>Nombre o empresa</label><input name="nombre" required maxlength="60" placeholder="Ej: Juan Pérez, Flete Sur, Pedidos Ya"></div>
    <div class="grid2"><div class="field"><label>DNI (opcional)</label><input name="dni" inputmode="numeric" maxlength="11"></div>
      <div class="field"><label>Patente (opcional)</label><input name="patente" maxlength="10" style="text-transform:uppercase" placeholder="AB 123 CD"></div></div>
    <div class="grid3"><div class="field"><label>Día</label><input type="date" name="fecha" value="${hoy}" min="${hoy}" required></div>
      <div class="field"><label>Desde</label><input type="time" name="desde" value="${desde}" required></div>
      <div class="field"><label>Hasta</label><input type="time" name="hasta" value="${hasta}" required></div></div>
    <label class="check"><input type="checkbox" name="fijo" ${tipo0 === 'personal' ? 'checked' : ''}><span><b>Viene varias veces</b> (empleada, jardinero, personal de una obra por un tiempo…)</span></label>
    <div id="fijoBox" ${tipo0 === 'personal' ? '' : 'hidden'}><p class="muted tiny" style="margin:6px 0 0">Se genera <b>un solo QR</b> que sirve todos los días elegidos, en ese horario, hasta la fecha final. No hay que hacer uno por día.</p><div class="field" style="margin-top:8px"><label>Días</label><div class="seg dias-sel">${[1,2,3,4,5,6,0].map(d =>
      `<label><input type="checkbox" name="dias" value="${d}" ${d >= 1 && d <= 5 ? 'checked' : ''}><span>${DIAS[d]}</span></label>`).join('')}</div></div>
      <div class="field"><label>Hasta la fecha</label><input type="date" name="fechaFin" value="${sumarDias(hoy, 90)}"></div></div>
    <div class="field" style="margin-top:8px"><label>Nota para la guardia (opcional)</label><input name="nota" maxlength="120" placeholder="Ej: deja la caja en la puerta"></div>
    ${camposRecordatorio({ recordar:true })}
    <button class="btn btn-pri btn-block">${I('qr')}Crear el pase</button></form>`);
};
document.addEventListener('change', e => {
  if (e.target.name === 'fijo'){ const b = $('#fijoBox'); if (b) b.hidden = !e.target.checked; }
  /* UBER, DIDI O TAXI SE AVISA DESDE ACÁ (pedido de Claudio, 28-09): ya no
     hay una teja aparte en Tu casa ni en Mis visitas. Al elegirlo, la hoja
     pasa al aviso corto de siempre (app, patente, en cuánto llega). */
  if (e.target.name === 'tipo' && e.target.value === 'remis' && e.target.closest('form[data-f="nuevo-pase"]')){ A['pase-app'](); return; }
  /* Personal fijo o de obra: casi siempre viene varias veces. */
  if (e.target.name === 'tipo' && e.target.closest('form[data-f="nuevo-pase"]') && ['personal', 'proveedor'].includes(e.target.value)){
    const f = e.target.form.querySelector('[name=fijo]'); if (f && !f.checked){ f.checked = true; const b = $('#fijoBox'); if (b) b.hidden = false; } }
});
F['nuevo-pase'] = d => {
  const u = yo();
  if (minutosDe(d.hasta) <= minutosDe(d.desde) && d.hasta !== '00:00'){ toast('La hora de salida tiene que ser después de la de entrada', 'clock'); return; }
  const dias = d.fijo ? [].concat(d.dias || []).map(Number) : null;
  if (d.fijo && !dias.length){ toast('Elegí al menos un día', 'calendar'); return; }
  const p = { id:uid(), hostId:u.id, tipo:d.tipo, nombre:d.nombre.trim(), dni:soloDigitos(d.dni), patente:(d.patente || '').toUpperCase().trim(),
    fecha:d.fecha, desde:d.desde, hasta:d.hasta, nota:(d.nota || '').trim(), codigo:codigoPase(), log:{}, createdAt:Date.now(), autoriza:u.nombre,
    recordar:!!d.recordar, ...(telVisita(d.tel) ? { tel:telVisita(d.tel) } : {}) };
  if (dias){ p.dias = dias; p.fechaFin = d.fechaFin || sumarDias(d.fecha, 90); }
  Store.cambiar(s => { s.pases.unshift(p); if (p.fecha === hoyISO()) notificar(s, { para:'rol:guardia', titulo:'Nueva visita anunciada', texto:`${u.nombre} (${u.casa}) autorizó a ${p.nombre} · ${p.desde}–${p.hasta}`, icon:'users', color:'sky', link:'garita' }); });
  verPase(p.id, true);
};
function verPase(id, recien = false){
  const p = Store.s.pases.find(x => x.id === id); if (!p) return;
  const u = usuario(p.hostId) || {};
  hoja(recien ? '¡Pase listo!' : 'Pase de ingreso', `
    <div class="ticket"><div class="tk-top"><small>Ingreso a ${esc(Store.s.config.nombre)}</small><h3>${esc(p.nombre)}</h3>
      <div style="opacity:.85;font-size:13px">${esc(u.casa || '')} · ${p.dias?.length ? p.dias.map(d => DIAS[d]).join(' ') : relDia(p.fecha)} · ${p.desde}–${p.hasta}</div>
      <div style="opacity:.85;font-size:12px;margin-top:4px">Autorizó: ${esc(p.autoriza || u.nombre || '')}${p.dias?.length ? ` · mismo QR todos esos días hasta el ${fechaCorta(p.fechaFin)}` : ''}</div></div>
      <div class="bottom"><div class="qr-box" data-qr="BHC:${p.codigo}"></div><div class="codigo-grande">${p.codigo}</div>
      <div class="muted small">Mostralo en la garita. También sirve dictar el código.</div></div></div>
    <div class="btns" style="margin-top:14px">
      <button class="btn btn-wa" data-a="compartir-pase" data-id="${p.id}">${I('share')}Enviar por WhatsApp</button>
      <button class="btn btn-sec" data-a="copiar" data-v="${esc(textoPase(p))}">${I('copy')}Copiar</button></div>
    ${p.hostId === yo()?.id || paseDeMiLote(p) ? `<button class="cal-boton" data-a="visita-calendario" data-id="${p.id}"><span class="cal-hoja" aria-hidden="true"><b>${fechaDe(primerDiaCal(datosCalendario(p))).getDate()}</b><small>${esc(MESES[fechaDe(primerDiaCal(datosCalendario(p))).getMonth()])}</small><i>${I('bell')}</i></span><span><b>Recordatorio en su calendario</b><small>Su teléfono le avisa solo una hora antes${p.dias?.length ? ', cada día que viene' : ''}. Gratis.</small></span>${I('right')}</button>` : ''}`);
  $$('#hoja [data-qr]').forEach(el => pintarQR(el, el.dataset.qr));
}
A['ver-pase'] = el => verPase(el.dataset.id);

/* =========================================================
   UBER, DIDI, CABIFY O TAXI (pedido de Claudio, 27-09)
   El chofer no tiene la app del barrio ni un QR: lo que la garita ve es su
   patente. Por eso el vecino, cuando pide el viaje, avisa en 10 segundos:
   qué app, si lo viene a buscar o le trae algo, en cuánto llega y la
   patente (la muestra Uber/DiDi apenas el chofer acepta; si todavía no la
   sabe, la agrega después). Se arma un pase corto, que vence solo, y la
   garita lo encuentra escribiendo la patente o en "Ingresos de hoy". Al
   entrar y al salir, al vecino le llega el aviso como con cualquier visita.
   Sin aviso, el chofer entra por "Llegó sin aviso" (se le pregunta al vecino).
   ========================================================= */
const APPS_VIAJE = { uber:'Uber', didi:'DiDi', cabify:'Cabify', taxi:'Taxi / remís' };
A['pase-app'] = () => hoja('Viene un Uber, DiDi o taxi', `<form data-f="pase-app">
  <p class="small" style="margin:0 0 12px"><button type="button" class="link" data-a="nuevo-pase">${I('left')}Es otro tipo de visita</button></p>
  <div class="field"><label>¿De qué app?</label><div class="seg">${Object.entries(APPS_VIAJE).map(([k, n], i) => `<label><input type="radio" name="app" value="${k}" ${i === 0 ? 'checked' : ''}><span>${esc(n)}</span></label>`).join('')}</div></div>
  <div class="field"><label>¿Para qué viene?</label><div class="seg">
    <label><input type="radio" name="para" value="buscar" checked><span>${I('logout')}Me viene a buscar</span></label>
    <label><input type="radio" name="para" value="traer"><span>${I('login')}Trae a alguien o algo</span></label></div></div>
  <div class="grid2"><div class="field"><label>Patente</label><input name="patente" maxlength="10" style="text-transform:uppercase" placeholder="AB 123 CD" autocomplete="off"></div>
    <div class="field"><label>Llega en</label><select name="en"><option value="10">10 minutos</option><option value="20" selected>20 minutos</option><option value="30">30 minutos</option><option value="60">1 hora</option></select></div></div>
  <div class="field"><label>Nombre del chofer (opcional)</label><input name="chofer" maxlength="40" autocomplete="off" placeholder="Lo muestra la app cuando acepta el viaje"></div>
  <p class="muted tiny" style="margin:0 0 12px">La patente la ves en la app apenas el chofer acepta. Si todavía no la sabés, avisá igual y agregala después desde Mis visitas. El aviso vence solo una hora después de la hora de llegada.</p>
  <button class="btn btn-pri btn-block">${I('send')}Avisar a la garita</button></form>`);
F['pase-app'] = d => {
  const u = yo(), app = APPS_VIAJE[d.app] ? d.app : 'uber', ahora = new Date(), en = Math.min(120, Math.max(5, +d.en || 20));
  const hhmm = ms => { const x = new Date(ms); return `${pad(x.getHours())}:${pad(x.getMinutes())}`; };
  const fin = Math.min(ahora.getTime() + (en + 60) * MIN, new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), 23, 59).getTime());
  const chofer = String(d.chofer || '').trim(), patente = normPatente(d.patente);
  const p = { id:uid(), hostId:u.id, tipo:'remis', app, nombre:`${APPS_VIAJE[app]}${chofer ? ' · ' + chofer : ''}`, dni:'', patente,
    fecha:hoyISO(), desde:hhmm(ahora.getTime() - 5 * MIN), hasta:hhmm(fin), nota: d.para === 'traer' ? 'Trae a alguien o algo' : 'Viene a buscar al vecino',
    codigo:codigoPase(), log:{}, createdAt:Date.now(), autoriza:u.nombre };
  Store.cambiar(s => { s.pases.unshift(p);
    notificar(s, { para:'rol:guardia', titulo:`Viene un ${APPS_VIAJE[app]} a ${u.casa}`, texto:`${patente ? 'Patente ' + patente : 'Patente a confirmar'} · llega en ~${en} min · ${p.nota.toLowerCase()}`, icon:'car', color:'warn', link:'garita' }); });
  hoja('La garita ya sabe', `${aviso('ok', 'check', `${esc(APPS_VIAJE[app])} a ${esc(u.casa)} · vence a las ${p.hasta} h`, patente ? `Patente <b class="mono">${esc(patente)}</b>. Cuando entre y cuando salga te llega el aviso.` : 'Falta la patente: agregala cuando el chofer acepte, así la garita lo reconoce al llegar.')}
    ${patente ? '' : `<button class="btn btn-pri btn-block" data-a="pase-app-patente" data-id="${p.id}">${I('car')}Agregar la patente</button>`}
    <button class="btn btn-sec btn-block" style="margin-top:8px" data-a="cerrar-hoja">Listo</button>`);
};
A['pase-app-patente'] = el => { const p = Store.s.pases.find(x => x.id === el.dataset.id); if (!p) return;
  hoja('Patente del viaje', `<form data-f="pase-app-patente" data-id="${esc(p.id)}"><div class="field"><label>Patente de ${esc(p.nombre)}</label><input name="patente" required maxlength="10" style="text-transform:uppercase" value="${esc(p.patente || '')}" placeholder="AB 123 CD" autocomplete="off"></div>
    <button class="btn btn-pri btn-block">${I('check')}Guardar y avisar a la garita</button></form>`); };
F['pase-app-patente'] = (d, form) => {
  const patente = normPatente(d.patente); if (patente.length < 6) return toast('Revisá la patente', 'car');
  const u = yo();
  Store.cambiar(s => { const p = s.pases.find(x => x.id === form.dataset.id && x.hostId === u.id); if (!p) return; p.patente = patente;
    notificar(s, { para:'rol:guardia', titulo:`Patente del ${APPS_VIAJE[p.app] || 'viaje'} a ${u.casa}`, texto:`${patente} · ${p.nota || ''}`, icon:'car', color:'warn', link:'garita' }); });
  cerrarHoja(); toast('Patente guardada. La garita ya la tiene.', 'car');
};
A['compartir-pase'] = el => { const p = Store.s.pases.find(x => x.id === el.dataset.id); if (!p) return;
  compartirPase({ texto:textoPase(p), contenido:'BHC:' + p.codigo, codigo:p.codigo, sub:`Pase de ${p.nombre} · ${usuario(p.hostId)?.casa || ''}`, archivo:`pase-${p.codigo}.png`, datos:datosPase(p), tel:p.tel || '' }); };
/* La página pública del QR (#/qr/…): la abre la visita desde el enlace del WhatsApp.
   No lee nada de la base: dibuja el QR con lo que trae el enlace. */
function pintarQRPublico(contenido){
  const c = decodeURIComponent(contenido || ''), cod = c.replace(/^BHC:/, '');
  $('#app').innerHTML = `<section class="bienvenida" id="qrPublico"><div class="foto" style="background-image:url('${Clima.portada()}')"></div>
    <div class="marca"><span class="logo">${LOGO}</span><div><b style="font-size:16px">Barrio ${esc(Store.s.config.nombre)}</b></div></div>
    <h1 style="font-size:28px">Tu pase de ingreso</h1>
    <div class="panel" style="text-align:center"><div class="qr-box" id="qrPub" style="background:#fff;padding:14px;border-radius:14px;max-width:260px;margin:0 auto"></div>
      <div class="codigo-grande" style="margin-top:12px">${esc(codigoEspaciado(cod))}</div><p style="margin:8px 0 0;opacity:.9">Mostrá este QR en la garita o decí el código.</p><div style="text-align:left">${botonMapa()}</div></div></section>`;
  pintarQR($('#qrPub'), c);
}
A['cancelar-pase'] = async el => {
  if (!await confirmar('Cancelar el pase', 'El código deja de servir en la garita.', { si:'Cancelar pase', peligro:true })) return;
  Store.cambiar(s => { const p = s.pases.find(x => x.id === el.dataset.id); if (p) p.cancelado = Date.now(); });
  toast('Pase cancelado', 'x');
};
/* =========================================================
   EDITAR Y BORRAR UNA VISITA
   El vecino puede corregir o sacar de su lista cualquier visita, también
   las que ya entraron y salieron. Pero nada se pierde: borrar la esconde
   de SU lista y la garita la sigue viendo en el historial del día, y cada
   cambio queda en la auditoría del barrio (qué visita, qué campos, cuándo
   y quién). Los datos personales de la visita (DNI, patente) no se copian
   a la auditoría: solo se anota que cambiaron (Ley 25.326).
   ========================================================= */
const resumenPase = p => {
  const dias = Object.keys(p.log || {}).sort(), ult = dias.at(-1), l = ult ? p.log[ult] : null;
  return `${p.nombre} · ${(TIPOS_PASE[p.tipo] || TIPOS_PASE.visita).n} · ${p.dias?.length ? 'fijo' : fechaCorta(p.fecha)}${l?.in ? ' · entró ' + hora(l.in) : ''}${l?.out ? ' · salió ' + hora(l.out) : ''}`;
};
A['editar-pase'] = el => {
  const p = Store.s.pases.find(x => x.id === el.dataset.id); if (!p) return;
  const usado = p.log && Object.keys(p.log).length, fijo = !!aLista(p.dias).length;
  hoja('Editar la visita', `<form data-f="editar-pase" data-id="${p.id}">
    <div class="field"><label>Nombre o empresa</label><input name="nombre" required maxlength="60" value="${esc(p.nombre)}"></div>
    <div class="grid2"><div class="field"><label>DNI</label><input name="dni" inputmode="numeric" maxlength="11" value="${esc(p.dni || '')}"></div>
      <div class="field"><label>Patente</label><input name="patente" maxlength="10" style="text-transform:uppercase" value="${esc(p.patente || '')}"></div></div>
    ${fijo ? `<div class="field"><label>Días que viene</label><div class="seg dias-sel">${[1,2,3,4,5,6,0].map(d =>
        `<label><input type="checkbox" name="dias" value="${d}" ${aLista(p.dias).map(Number).includes(d) ? 'checked' : ''}><span>${DIAS[d]}</span></label>`).join('')}</div></div>
      <div class="grid3"><div class="field"><label>Desde</label><input type="time" name="desde" value="${esc(p.desde)}" required></div>
        <div class="field"><label>Hasta</label><input type="time" name="hasta" value="${esc(p.hasta)}" required></div>
        <div class="field"><label>Hasta la fecha</label><input type="date" name="fechaFin" value="${esc(p.fechaFin || '')}" min="${hoyISO()}" required></div></div>
      <p class="muted tiny" style="margin:-2px 0 12px">Es el mismo QR: sirve los días y en el horario nuevos desde ahora. Lo que ya pasó por la garita no cambia.</p>`
    : usado ? '' : `<div class="grid3"><div class="field"><label>Día</label><input type="date" name="fecha" value="${p.fecha}" required></div>
      <div class="field"><label>Desde</label><input type="time" name="desde" value="${p.desde}" required></div>
      <div class="field"><label>Hasta</label><input type="time" name="hasta" value="${p.hasta}" required></div></div>`}
    <div class="field"><label>Nota</label><input name="nota" maxlength="120" value="${esc(p.nota || '')}"></div>
    ${p.app ? '' : camposRecordatorio(p)}
    ${usado && !fijo ? `<p class="muted tiny" style="margin:-2px 0 12px">Esta visita ya pasó por la garita: el día y los horarios de entrada y salida no se cambian.</p>` : ''}
    <p class="muted tiny" style="margin:0 0 12px">El cambio queda anotado en la auditoría del barrio.</p>
    <button class="btn btn-pri btn-block">${I('check')}Guardar</button></form>`);
};
F['editar-pase'] = (d, form) => {
  const p0 = Store.s.pases.find(x => x.id === form.dataset.id); if (!p0) return;
  const diasNuevos = [].concat(d.dias || []).map(Number);
  if (aLista(p0.dias).length && d.desde){
    if (!diasNuevos.length){ toast('Elegí al menos un día', 'calendar'); return; }
    if (minutosDe(d.hasta) <= minutosDe(d.desde)){ toast('La hora de salida tiene que ser después de la de entrada', 'clock'); return; }
  }
  Store.cambiar(s => {
    const p = s.pases.find(x => x.id === form.dataset.id); if (!p) return;
    const nuevo = { nombre:d.nombre.trim(), dni:soloDigitos(d.dni), patente:normPatente(d.patente), nota:(d.nota || '').trim() };
    if (d.fecha){ nuevo.fecha = d.fecha; nuevo.desde = d.desde; nuevo.hasta = d.hasta; }
    if (aLista(p.dias).length && d.desde)
      Object.assign(nuevo, { dias:diasNuevos.sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7)), desde:d.desde, hasta:d.hasta, fechaFin:d.fechaFin || p.fechaFin });
    if ('tel' in d) nuevo.tel = telVisita(d.tel);
    if (!p.app) nuevo.recordar = !!d.recordar;
    const nombres = { nombre:'nombre', dni:'DNI', patente:'patente', nota:'nota', fecha:'día', desde:'desde', hasta:'hasta', dias:'días', fechaFin:'fecha final', tel:'celular', recordar:'recordatorio' };
    const cambios = Object.keys(nuevo).filter(k => String(k === 'recordar' ? p[k] !== false : p[k] || '') !== String(k === 'recordar' ? nuevo[k] : nuevo[k] || ''));
    if (!cambios.length) return;
    const antes = resumenPase(p);
    Object.assign(p, nuevo);
    p.editado = { at:Date.now(), por:yo().id };
    const ajena = p.hostId !== yo().id, casa = usuario(p.hostId)?.casa || '', delLote = ajena && !esAdmin();
    const quien = delLote ? yo().nombre.split(' ')[0] : 'La Administración';
    auditar(s, ajena ? (delLote ? 'Editó una visita de su lote' : 'La Administración editó una visita') : 'Editó una visita', `${ajena ? casa : yo().casa} · ${antes} · cambió: ${cambios.map(k => nombres[k]).join(', ')}${delLote ? ' · la había autorizado ' + (p.autoriza || nombreDe(p.hostId)) : ''}`, p.id);
    if (ajena) notificar(s, { para:p.hostId, titulo:`${quien} cambió la visita de ${p.nombre}`, texto:`Cambió: ${cambios.map(k => nombres[k]).join(', ')}`, icon:'edit', color:'sky', link:'visitas' });
  });
  cerrarHoja(); toast('Visita actualizada', 'check');
};
A['borrar-pase'] = async el => {
  const p = Store.s.pases.find(x => x.id === el.dataset.id); if (!p) return;
  const est = estadoPase(p), ajena = p.hostId !== yo().id && esAdmin(), vale = est === 'esperado' || est === 'noingreso' || est === 'futuro' || (p.dias?.length && !p.cancelado);
  const deOtro = !ajena && p.hostId !== yo().id;
  const texto = ajena ? `${esc(p.nombre)} · ${esc(usuario(p.hostId)?.casa || '')}. Sale de la lista del vecino y de las visitas del barrio.${vale ? ' El código deja de servir en la garita.' : ''} Lo que ya pasó queda en el historial de la garita y en la auditoría. Al vecino le llega el aviso.`
    : `Sale de la lista de ${deOtro ? 'todo el lote (la autorizó ' + esc((p.autoriza || nombreDe(p.hostId)).split(' ')[0]) + ', le llega el aviso)' : 'tu lote'}.${est === 'esperado' || est === 'futuro' ? ' El código deja de servir en la garita.' : ''} Queda en el historial de la garita y en la auditoría del barrio.`;
  if (!await confirmar('Borrar la visita', texto, { si:'Borrar', peligro:true })) return;
  Store.cambiar(s => {
    const x = s.pases.find(z => z.id === p.id); if (!x) return;
    if (ajena ? vale : est === 'esperado' || est === 'futuro') x.cancelado = Date.now();
    x.borrado = { at:Date.now(), por:yo().id, ...(ajena ? { admin:true } : {}) };
    if (ajena){
      auditar(s, 'La Administración borró una visita', `${usuario(x.hostId)?.casa || ''} · ${resumenPase(x)}`, x.id);
      notificar(s, { para:x.hostId, titulo:`La Administración borró la visita de ${x.nombre}`, texto: vale ? 'El código ya no sirve en la garita.' : 'Ya no está en tu lista.', icon:'trash', color:'warn', link:'visitas' });
    } else { auditar(s, 'Borró una visita de su lista', `${yo().casa} · ${resumenPase(x)}`, x.id);
      if (deOtro) notificar(s, { para:x.hostId, titulo:`${yo().nombre.split(' ')[0]} borró la visita de ${x.nombre}`, texto: est === 'esperado' || est === 'futuro' ? 'El código ya no sirve en la garita.' : 'Ya no está en la lista del lote.', icon:'trash', color:'warn', link:'visitas' }); }
  });
  toast(ajena ? 'Visita borrada' : 'Visita borrada de tu lista', 'trash');
};
/* EL ENLACE PARA LA VISITA (arreglo del 11-10-2026, pedido de Claudio: "no
   abre la sección; tiene que completar sus datos y que le salga el QR
   solo, guardado en su WhatsApp").
   Qué fallaba: la visita no tiene cuenta, así que (1) la app no sabía a
   quién iba a ver (la lista de vecinos no se lee sin cuenta) y decía
   "Enlace no válido"; (2) su pedido no llegaba nunca a la base (la app solo
   guarda con una sesión abierta); y (3) en un teléfono con la app abierta
   el enlace mostraba la app y no el formulario.
   Ahora:
     · el enlace lleva el nombre de pila y el lote de quien invita (los que
       la visita igual va a ver) y vence a los 30 días;
     · la visita completa sus datos y en el momento le aparece el QR con el
       código, con el botón "Guardarlo en mi WhatsApp" (la tarjeta del pase,
       como la que manda la app), y queda guardado en su teléfono: si vuelve
       a abrir el enlace, lo ve otra vez;
     · el pedido se escribe directo en la carpeta del vecino (las reglas de
       la base dejan CREAR ahí sin cuenta, nada más) ya con su código;
     · la app de la garita, la de la Administración o la del propio vecino,
       la primera que lo ve, lo convierte en un pase de verdad y al vecino
       le llega "Fulano completó sus datos: ya tiene su QR". Si no lo
       quiere, lo cancela desde Mis visitas.
   Sirve para varias visitas: cada una completa lo suyo desde su celular. */
const ENLACE_DIAS = 30;
const datosEnlace = arg => {
  const [id, q = ''] = String(arg || '').split('?'), pr = new URLSearchParams(q);
  return { hostId:decodeURIComponent(id || ''), nombre:pr.get('n') || '', casa:pr.get('c') || '', vence:+pr.get('v') || 0 };
};
A['link-pedir'] = () => {
  const u = yo(), vence = sumarDias(hoyISO(), ENLACE_DIAS);
  const link = urlApp('pedir/' + u.id + '?' + new URLSearchParams({ n:(u.nombre || '').split(' ')[0], c:u.casa || '', v:vence.replace(/-/g, '') }).toString());
  hoja('Enlace para tu visita', `<p style="margin:0 0 12px;color:var(--ink-2)">Tu visita abre este enlace, completa su nombre, DNI, patente, día y horario, y <b>en el momento le aparece su QR</b>, con el botón para guardarlo en su WhatsApp. A vos te llega el aviso con sus datos; si no la esperabas, la cancelás desde Mis visitas. Sirve para varias visitas hasta el ${fechaCorta(vence)}.</p>
    <div class="card plana mono small" style="word-break:break-all">${esc(link)}</div>
    <div class="btns"><button class="btn btn-wa" data-a="compartir-link" data-v="${esc(link)}">${I('share')}Enviar</button><button class="btn btn-sec" data-a="copiar" data-v="${esc(link)}">${I('copy')}Copiar</button></div>`);
};
A['compartir-link'] = el => compartir(`Para entrar al barrio ${Store.s.config.nombre}, completá tus datos acá y te sale tu pase con el QR: ${el.dataset.v}`);
/* El pedido completado por la visita se convierte en un pase (ver arriba).
   Id fijo ("sp" + pedido): si dos equipos lo hacen a la vez, queda uno. */
function pasarPedidosListos(){
  const u = yo(); if (!u || !Store.s) return;
  const listos = aLista(Store.s.solicitudesPase).filter(r => r && r.estado === 'listo' && !r.paseId && r.codigo && (r.hostId === u.id || esGuardia() || esAdmin()));
  if (!listos.length) return;
  Store.cambiar(s => listos.forEach(r0 => {
    const r = s.solicitudesPase.find(x => x.id === r0.id); if (!r || r.paseId) return;
    const host = usuario(r.hostId) || {}, id = 'sp' + r.id;
    if (!s.pases.some(p => p.id === id)) s.pases.unshift({ id, hostId:r.hostId, tipo:'visita', nombre:r.nombre, dni:r.dni || '', tel:r.tel || '', patente:normPatente(r.patente), fecha:r.fecha, desde:r.desde, hasta:r.hasta,
      codigo:r.codigo, log:{}, createdAt:r.at || Date.now(), autoriza:host.nombre || '', porEnlace:true });
    r.estado = 'aprobado'; r.paseId = id;
    Motor.conMarca('pedido-' + r.id, () => notificar(s, { para:r.hostId, titulo:`${r.nombre} completó sus datos: ya tiene su QR`, texto:`${fechaCorta(r.fecha)} · ${r.desde} a ${r.hasta} h${r.patente ? ' · ' + normPatente(r.patente) : ''}. Si no lo esperabas, cancelalo en Mis visitas.`, icon:'qr', color:'sky', link:'visitas' }));
    if (r.fecha === hoyISO() && !esGuardia()) Motor.conMarca('pedido-g-' + r.id, () => notificar(s, { para:'rol:guardia', titulo:'Nueva visita anunciada', texto:`${r.nombre} → ${host.casa || ''} · ${r.desde}–${r.hasta} (completó el enlace del vecino)`, icon:'users', color:'sky', link:'garita' }));
  }));
}
Store.alCambiar(() => setTimeout(pasarPedidosListos, 0));
setInterval(() => { try { pasarPedidosListos(); } catch(e){ console.warn('Pedidos de pase', e); } }, 20000);
A['sol-pase-si'] = el => {
  const u = yo(); let nuevo;
  Store.cambiar(s => {
    const r = s.solicitudesPase.find(x => x.id === el.dataset.id); if (!r) return;
    nuevo = { id:uid(), hostId:u.id, tipo:'visita', nombre:r.nombre, dni:r.dni, tel:r.tel || '', patente:r.patente, fecha:r.fecha, desde:r.desde, hasta:r.hasta, codigo:codigoPase(), log:{}, createdAt:Date.now(), autoriza:u.nombre };
    s.pases.unshift(nuevo); r.estado = 'aprobado'; r.paseId = nuevo.id;
  });
  toast('Aprobado. Su QR ya aparece en su celular.', 'check');
};
A['sol-pase-no'] = el => Store.cambiar(s => { const r = s.solicitudesPase.find(x => x.id === el.dataset.id); if (r) r.estado = 'rechazado'; });
A['llegada-si'] = el => responderLlegada(el.dataset.id, 'autorizado');
/* Desde el aviso del celular (link "llegada:<id>"): la hoja con los dos botones. */
A['llegada-ver'] = el => {
  const l = Store.s.llegadas.find(x => x.id === el.dataset.id); if (!l) return;
  const casa = l.lote || usuario(l.hostId)?.casa || '';
  hoja('En la garita', `<div class="aviso-leido"><span class="ic ic-warn">${I('gate')}</span><div><b>${esc(l.nombre)}</b><time>${hace(l.at)}</time></div></div>
    <p class="aviso-leido-texto">${esc(l.motivo || 'Visita')}${l.patente ? ' · ' + esc(l.patente) : ''} · pregunta por ${esc(casa)}</p>
    ${l.estado === 'consultando' ? `<div class="btns" style="margin-top:14px"><button class="btn btn-ok grow" data-a="llegada-si" data-id="${l.id}">${I('check')}Que pase</button><button class="btn btn-danger-soft grow" data-a="llegada-noesta" data-id="${l.id}">${I('home')}No estoy en casa</button></div>
      <p class="small center" style="margin:8px 0 0"><button class="link" data-a="llegada-no" data-id="${l.id}">No lo conozco</button></p>`
      : `<p class="muted small" style="margin:12px 0 0">${I('check')} Ya contestó ${l.respondio === yo().id ? 'vos' : esc(nombreDe(l.respondio).split(' ')[0] || 'alguien del lote')}: ${textoRespuesta(l)}.</p>`}`);
};
A['llegada-no'] = el => responderLlegada(el.dataset.id, 'rechazado');
A['llegada-noesta'] = el => responderLlegada(el.dataset.id, 'rechazado', 'noesta');
/* Lo que contestó el lote, en palabras (para la garita y los demás). */
const textoRespuesta = l => l.estado === 'autorizado' ? 'que pase' : l.noEsta ? 'no está en casa' : l.estado === 'rechazado' ? 'no lo conoce' : 'sin responder';
/* Contesta cualquiera del lote; el primero que contesta vale. Al contestar
   se cierra para todos: desaparecen los botones y el aviso de la
   campanita (ver avisoCaduco en js/core.js), y a los demás del lote les
   queda dicho quién contestó y qué. */
function responderLlegada(id, estado, motivo = ''){
  const u = yo(), l0 = Store.s.llegadas.find(x => x.id === id);
  if (!l0) return;
  if (typeof VentanaLlegada !== 'undefined') VentanaLlegada.cerrar(id);
  if (typeof Push !== 'undefined' && Push.callarLlegada) Push.callarLlegada(id);
  if (l0.estado !== 'consultando'){ toast(`Ya contestó ${l0.respondio === u.id ? 'vos' : nombreDe(l0.respondio).split(' ')[0] || 'alguien del lote'}: ${textoRespuesta(l0)}`, 'check'); cerrarHoja(); refrescar(); return; }
  let otros = [], titOtros = '';
  Store.cambiar(s => {
    const l = s.llegadas.find(x => x.id === id); if (!l) return;
    l.estado = estado; l.respondido = Date.now(); l.respondio = u.id;
    if (motivo === 'noesta') l.noEsta = true;
    const casa = l.lote || usuario(l.hostId)?.casa || '', quien = u.nombre.split(' ')[0];
    notificar(s, { para:'rol:guardia', titulo:`${casa}: ${estado === 'autorizado' ? 'que pase' : l.noEsta ? 'NO ESTÁ EN CASA' : 'NO autoriza'}`, texto:`${l.nombre} · contestó ${quien}${l.noEsta ? ' · no está en casa' : ''}`, icon: estado === 'autorizado' ? 'check' : l.noEsta ? 'home' : 'x', color: estado === 'autorizado' ? 'ok' : 'danger', urgente:true, link:'garita' });
    otros = paraElLote(casa, l.hostId).filter(x => x !== u.id);
    titOtros = `${quien} ${estado === 'autorizado' ? 'dejó pasar' : 'no dejó pasar'} a ${l.nombre}${l.noEsta ? ' (no está en casa)' : ''}`;
    if (otros.length) notificar(s, { para:otros, titulo:titOtros, texto:'Lo contestó a la garita: ya no hace falta que respondas.', icon: estado === 'autorizado' ? 'check' : 'x', color: estado === 'autorizado' ? 'ok' : 'danger', link:'visitas', push:false });
  });
  /* A los demás del lote se les calla el teléfono que estaba insistiendo (sw.js). */
  if (otros.length && typeof Push !== 'undefined') Push.enviar({ para:otros, titulo:titOtros, texto:'Ya no hace falta que respondas.', link:'llegada-fin:' + id, tag:'llegada-' + id });
  cerrarHoja(); if (typeof Push !== 'undefined' && Push.cerrarResueltos) setTimeout(() => Push.cerrarResueltos(), 300);
  toast(estado === 'autorizado' ? 'Avisamos a la guardia: puede pasar' : motivo === 'noesta' ? 'Avisamos a la guardia: no estás en casa, no pasa' : 'Avisamos a la guardia: no pasa', estado === 'autorizado' ? 'check' : 'x');
}
/* =========================================================
   LA VENTANA DE "LLEGÓ SIN AVISO" (pedido de Claudio, 12-10-2026: "que se
   abra una ventana modal con diseño innovador e interactivo y dos botones:
   QUE PASE y NO ESTOY EN CASA; al responder se cierra y la app vuelve a
   stand-by"). Aparece sola, arriba de todo, en la app de cada uno de los
   que viven en el lote, apenas la garita pregunta; suena cada 5 segundos
   mientras está en pantalla y se va cuando alguien del lote contesta (si
   fue otro, dice quién y qué). Con la app cerrada o el teléfono bloqueado,
   insiste el aviso del celular (sw.js). "No lo conozco" queda como enlace
   chico: para la garita no es lo mismo que "no está".
   ========================================================= */
const VentanaLlegada = {
  abierta:'', timer:null, cerradas:new Set(),
  pendiente(){ const u = yo(); if (!u || esStaff() || esHotel() || esSupervisor()) return null;
    return aLista(Store.s.llegadas).filter(l => l && l.estado === 'consultando' && llegadaDeMiLote(l, u) && Date.now() - (l.at || 0) < 15 * MIN && !this.cerradas.has(l.id)).sort((a, b) => a.at - b.at)[0] || null; },
  revisar(){
    const l = this.pendiente();
    if (!l){ if (this.abierta){ const vieja = aLista(Store.s.llegadas).find(x => x && x.id === this.abierta);
        if (vieja && vieja.estado !== 'consultando' && vieja.respondio && vieja.respondio !== yo()?.id) toast(`${nombreDe(vieja.respondio).split(' ')[0] || 'Alguien del lote'} ya contestó: ${textoRespuesta(vieja)}`, vieja.estado === 'autorizado' ? 'check' : 'x');
        this.quitar(); } return; }
    if (this.abierta !== l.id) this.mostrar(l.id);
    else this.reloj();
  },
  mostrar(id, desdeAviso = false){
    const l = aLista(Store.s.llegadas).find(x => x && x.id === id), u = yo(); if (!l || !u || l.estado !== 'consultando') return;
    this.cerradas.delete(id); this.abierta = id;
    let caja = $('#llegadaVentana'); if (!caja){ caja = document.createElement('div'); caja.id = 'llegadaVentana'; caja.className = 'lv-fondo'; caja.setAttribute('role', 'alertdialog'); caja.setAttribute('aria-modal', 'true'); document.body.appendChild(caja); }
    const casa = l.lote || usuario(l.hostId)?.casa || '', paraVos = l.hostId === u.id && !l.porLote;
    caja.setAttribute('aria-label', `En la garita: ${l.nombre}`);
    caja.innerHTML = `<div class="lv-caja">
      <div class="lv-escena" aria-hidden="true"><span class="lv-ondas"><i></i><i></i><i></i></span>
        <svg class="lv-garita" viewBox="0 0 160 90"><rect x="18" y="30" width="42" height="46" rx="4" fill="#f4efe6"/><path d="M12 32 39 12l27 20Z" fill="#b85f24"/><rect x="28" y="42" width="22" height="16" rx="2" fill="#9fd6ec"/><rect x="66" y="58" width="8" height="18" rx="2" fill="#3b2a1c"/>
          <g class="lv-barrera"><rect x="70" y="56" width="84" height="7" rx="3.5" fill="#fff"/><rect x="84" y="56" width="12" height="7" fill="#d33a3a"/><rect x="108" y="56" width="12" height="7" fill="#d33a3a"/><rect x="132" y="56" width="12" height="7" fill="#d33a3a"/></g>
          <path d="M0 80h160" stroke="rgba(255,255,255,.35)" stroke-width="3"/></svg>
        <span class="lv-campana">${I('bell')}</span></div>
      <small class="lv-sobre">En la garita · ${esc(casa)}</small>
      <h2 class="lv-nombre">${esc(l.nombre)}</h2>
      <p class="lv-detalle">${esc(l.motivo || 'Sin aviso previo')}${l.patente ? ` · <span class="hp-chapa chica">${esc(verPatente(l.patente))}</span>` : ''}<br>pregunta por ${paraVos ? 'vos' : 'tu casa'} · <b class="lv-reloj" data-desde="${l.at}">recién</b></p>
      <div class="lv-botones">
        <button class="lv-b si" data-a="llegada-si" data-id="${esc(l.id)}"><span class="lv-bi">${I('check')}</span><b>QUE PASE</b><small>La garita lo deja entrar</small></button>
        <button class="lv-b no" data-a="llegada-noesta" data-id="${esc(l.id)}"><span class="lv-bi">${I('home')}</span><b>NO ESTOY EN CASA</b><small>No entra</small></button></div>
      <button class="lv-desconozco" data-a="llegada-no" data-id="${esc(l.id)}">No lo conozco</button>
      <p class="lv-pie">${I('users')} Le llega a todos los que viven en ${esc(casa || 'tu lote')}: vale la respuesta del primero. Suena sin parar hasta que alguien conteste.</p></div>`;
    requestAnimationFrame(() => caja.classList.add('on'));
    if (typeof Push !== 'undefined' && Push.callarLlegada) Push.callarLlegada(id);
    this.reloj(); this.sonar(true);
    clearInterval(this.timer); this.timer = setInterval(() => { this.reloj(); this.sonar(); }, 2500);
    this.despierta();
    if (desdeAviso) cerrarHoja();
  },
  reloj(){ const r = $('#llegadaVentana .lv-reloj'); if (!r) return; const s = Math.max(0, Math.round((Date.now() - +r.dataset.desde) / 1000));
    r.textContent = s < 10 ? 'recién' : `esperando hace ${s >= 60 ? Math.floor(s / 60) + ' min ' : ''}${s % 60} s`; },
  /* 18-10-2026 (pedido de Claudio): "el sonido debe ser intenso y constante
     hasta que se atienda". Suena como un teléfono que llama, cada 2,5
     segundos, más fuerte, aunque se haya bajado el sonido de la app, y la
     pantalla no se apaga mientras la ventana está abierta. */
  sonar(){ if (document.visibilityState !== 'visible' || !this.abierta || typeof Sonido === 'undefined') return;
    Sonido.tocar([[1175, 0, .18], [988, .2, .18], [1175, .4, .18], [988, .6, .18], [1175, 1.0, .18], [988, 1.2, .18], [1175, 1.4, .18], [988, 1.6, .28]], 'square', .2, true);
    Sonido.vibrar([700, 200, 700, 200, 700]);
    const c = $('#llegadaVentana .lv-campana'); if (c){ c.classList.remove('suena'); void c.offsetWidth; c.classList.add('suena'); } },
  cerrar(id){ if (this.abierta === id) this.quitar(); },
  /* Que la pantalla no se apague mientras alguien espera en la garita. */
  async despierta(){ try { if ('wakeLock' in navigator && !this.lock) { this.lock = await navigator.wakeLock.request('screen'); this.lock.addEventListener?.('release', () => { this.lock = null; }); } } catch(e){ this.lock = null; } },
  quitar(){ clearInterval(this.timer); this.timer = null; const id = this.abierta; this.abierta = '';
    try { this.lock && this.lock.release(); } catch(e){} this.lock = null;
    const caja = $('#llegadaVentana'); if (!caja) return; caja.classList.remove('on'); caja.classList.add('chau'); setTimeout(() => caja.remove(), 380);
    if (id) this.cerradas.add(id); },
};
Store.alCambiar(() => setTimeout(() => VentanaLlegada.revisar(), 0));
setInterval(() => { try { VentanaLlegada.revisar(); } catch(e){} }, 3000);
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') { try { VentanaLlegada.revisar(); VentanaLlegada.sonar(); } catch(e){} } });
/* LA GARITA REENVÍA EL AVISO (12-10-2026; 18-10: cada 30 segundos, durante 15
   minutos), a los del lote, mientras nadie conteste. Solo el equipo de la
   garita que hizo la consulta (así no se duplica) y solo el aviso del
   celular, sin llenar la campanita (sw.js lo junta en uno solo). */
const LlegadaInsiste = {
  KEY:'bhc.llegadas.mias',
  mias(){ try { return JSON.parse(localStorage.getItem(this.KEY)) || {}; } catch(e){ return {}; } },
  anotar(id){ const m = this.mias(), lim = Date.now() - HORA; Object.keys(m).forEach(k => { if (m[k].at < lim) delete m[k]; }); m[id] = { at:Date.now(), n:0 }; try { localStorage.setItem(this.KEY, JSON.stringify(m)); } catch(e){} },
  correr(){
    if (!esGuardia() || typeof Push === 'undefined') return;
    const m = this.mias(), ahora = Date.now(); let cambio = false;
    aLista(Store.s.llegadas).filter(l => l && m[l.id] && l.estado === 'consultando').forEach(l => {
      const edad = ahora - (l.at || 0), x = m[l.id], toca = Math.floor(edad / 30000);
      if (edad > 15 * MIN || toca < 1 || x.n >= toca) return;
      x.n = toca; cambio = true;
      const casa = l.lote || usuario(l.hostId)?.casa || '';
      Push.enviar({ para:paraElLote(casa, l.hostId), titulo:`Sigue esperando en la garita: ${l.nombre}`, texto:`${l.motivo || 'Visita'}${casa ? ' · ' + casa : ''} · hace ${Math.max(1, Math.round(edad / MIN))} min · ¿Lo dejamos pasar?`, link:'llegada:' + l.id, tag:'llegada-' + l.id, urgente:true });
    });
    if (cambio) try { localStorage.setItem(this.KEY, JSON.stringify(m)); } catch(e){}
  },
};
setInterval(() => { try { LlegadaInsiste.correr(); } catch(e){} }, 5000);
A['modo-viaje'] = () => {
  const u = yo(), v = (typeof ausenciaDe === 'function' ? ausenciaDe(u) : u.viaje) || {}, hoy = hoyISO();
  hoja('Me voy de viaje', `<form data-f="modo-viaje">
    <p class="muted small" style="margin:0 0 12px">Tu casa entra en la lista de "casas solas" de la garita: la garita o el policía de la ronda la revisa una vez por día y te llega el aviso "Tu casa está en orden". Lo ven solo la garita, la Administración y las cuentas de tu lote.</p>
    <div class="grid2"><div class="field"><label>Desde</label><input type="date" name="desde" value="${v.desde || hoy}" required></div>
      <div class="field"><label>Hasta</label><input type="date" name="hasta" value="${v.hasta || sumarDias(hoy, 7)}" required></div></div>
    <div class="field"><label>Contacto si pasa algo</label><input name="contacto" maxlength="80" value="${esc(v.contacto || '')}" placeholder="Nombre y teléfono"></div>
    <div class="field"><label>¿Alguien tiene llave o pasa a regar?</label><input name="nota" maxlength="120" value="${esc(v.nota || '')}" placeholder="Ej: mi hermana Ana pasa los martes"></div>
    <div class="btns">${v.hasta ? `<button type="button" class="btn btn-sec" data-a="viaje-fin">Ya volví</button>` : ''}<button class="btn btn-pri">${I('lock')}Avisar a la guardia</button></div></form>`);
};
F['modo-viaje'] = d => {
  const u = yo();
  if (!d.desde || !d.hasta || d.hasta < d.desde){ toast('Revisá las fechas: "hasta" tiene que ser igual o posterior a "desde"', 'alert'); return; }
  /* Va a la carpeta privada (pv/ausencias) y el aviso, a cada cuenta de la
     garita en privado: que una casa está sola no puede andar a la vista. */
  Store.cambiar(s => { guardarAusencia(s, u, { desde:d.desde, hasta:d.hasta, contacto:String(d.contacto || '').trim(), nota:String(d.nota || '').trim() });
    notificar(s, { para:cuentasGarita(), titulo:`Casa sola: ${u.casa}`, texto:`Del ${fechaCorta(d.desde)} al ${fechaCorta(d.hasta)}. Revisarla una vez por día (al tocar "Revisada", al vecino le llega el aviso).`, icon:'lock', color:'wood', link:'garita' }); });
  /* Si usa "Estoy bien", queda en pausa mientras dura el viaje. */
  const eb = typeof Cuidado !== 'undefined' ? Cuidado.mio() : null;
  if (eb && eb.activo && d.hasta >= hoyISO()) Cuidado.poner(u.id, { pausaHasta:d.hasta }).catch(() => {});
  cerrarHoja(); toast(eb && eb.activo ? 'La guardia ya sabe y "Estoy bien" queda en pausa. ¡Buen viaje!' : 'La guardia ya sabe. ¡Buen viaje!', 'send');
};
A['viaje-fin'] = () => { const u = yo(), eb = typeof Cuidado !== 'undefined' ? Cuidado.mio() : null, au = ausenciaDe(u), hasta = au?.hasta;
  Store.cambiar(s => { const yu = s.users.find(z => z.id === u.id); if (yu && yu.viaje) delete yu.viaje;
    s.ausencias = aLista(s.ausencias).filter(a => !(a.userId === u.id || (u.casa && a.casa === u.casa)));
    notificar(s, { para:cuentasGarita(), titulo:`Volvió: ${u.casa}`, texto:'Termina el aviso de casa sola.', icon:'home', color:'ok', link:'garita' }); });
  if (eb && eb.pausaHasta && eb.pausaHasta === hasta) Cuidado.poner(u.id, { pausaHasta:null }).catch(() => {});
  cerrarHoja(); toast('Bienvenido/a de vuelta', 'home'); };
/* EL AVISO RÁPIDO ES UNO SOLO (pedido de Claudio, 10-10-2026): "va a llegar
   una visita sin aviso ni QR; cuando llegue, avísenme para ver si la
   autorizo", ya escrito. Lo demás (llego tarde, ruidos, la luz) se le
   escribe a la garita por Mensajes o por voz. Los tipos viejos quedan solo
   para mostrar los avisos que ya se habían mandado. */
const AVISOS_GUARDIA = {
  visita: { t:'Viene una visita sin aviso', x:'Va a llegar una visita sin aviso ni QR. Cuando llegue, avísenme para ver si la autorizo.', icon:'gate' },
  tarde:  { t:'Llego tarde', x:'Estén atentos a mi llegada', icon:'car' },
  ruido:  { t:'Ruidos raros cerca de casa', x:'¿Pueden pasar a mirar?', icon:'volume' },
  luz:    { t:'Se cortó la luz', x:'En mi casa o en la calle', icon:'bolt' },
  perro:  { t:'Perro suelto', x:'Anda un perro suelto por la calle', icon:'paw' },
  otro:   { t:'Otro aviso', x:'', icon:'info' },
};
A['aviso-guardia'] = () => hoja('Aviso rápido a la guardia', `<form data-f="aviso-guardia">
  <div class="aviso-escrito"><span class="ic ic-brand">${I('gate')}</span><p>“${esc(AVISOS_GUARDIA.visita.x)}”</p></div>
  <div class="grid2"><div class="field"><label>¿Quién viene? (opcional)</label><input name="nombre" maxlength="60" placeholder="Ej: Juan, el plomero"></div>
    <div class="field"><label>¿A qué hora, más o menos? (opcional)</label><input name="hora" type="time"></div></div>
  <button class="btn btn-pri btn-block">${I('send')}Avisar a la guardia</button>
  <p class="muted tiny" style="margin:10px 0 0">Cuando la visita llegue, la garita te pregunta en el celular si la dejan pasar ("Que pase" / "No lo conozco"). Si ya sabés quién viene y cuándo, mejor hacé un pase con QR desde "Autorizar una visita": entra sin esperar.</p></form>`);
F['aviso-guardia'] = d => {
  const u = yo(), a = AVISOS_GUARDIA.visita, nombre = (d.nombre || '').trim(), hh = d.hora || '';
  const detalle = [nombre, hh ? `cerca de las ${hh} h` : ''].filter(Boolean).join(' · ');
  Store.cambiar(s => {
    s.avisos.unshift({ id:uid(), userId:u.id, tipo:'visita', texto:detalle, nombre, hora:hh, at:Date.now(), visto:null });
    notificar(s, { para:'rol:guardia', titulo:`${u.casa}: ${a.t}`, texto: detalle ? `${detalle} · avisale cuando llegue` : 'Cuando llegue, consultale al vecino', icon:a.icon, color:'warn', link:'garita' });
  });
  cerrarHoja(); toast('La guardia recibió tu aviso: te consulta cuando llegue la visita', 'shield');
};
/* Desde la garita: llegó la visita que el vecino avisó → la consulta de siempre, ya completa. */
A['aviso-llego'] = el => { const a = Store.s.avisos.find(x => x.id === el.dataset.id); if (!a) return;
  A['llegada-nueva']({ dataset:{ u:a.userId, p:a.nombre || '' } }); };

/* ---------- GARITA (guardia y Administración) ---------- */
/* =========================================================
   TURNOS DE LA GARITA
   La garita entra con una sola cuenta. Lo que cambia es quién está de
   guardia: cada turno, al entrar, anota los nombres de los que trabajan.
   La Administración define los turnos (de 2 a 4, con su horario); la app
   propone el que corresponde a la hora y la guardia confirma.
   Los nombres se reconocen sin importar mayúsculas, acentos ni espacios:
   "jose  perez", "José Pérez" y "JOSE PEREZ" son la misma persona, y se
   guarda como se escribió la primera vez.
   Cada turno queda en la bitácora (abre y cierra), así todo lo que se
   anota ahí se puede atribuir a los guardias que estaban.
   ========================================================= */
/* HORARIOS QUE SE SUPERPONEN (pedido de Claudio, 14-10-2026): "hay uno que
   ingresa de 7 a 15 h, otro de 8 a 20 h, otro de 15 a 23 h y otro de 23 a
   7 h; el policía nocturno va aparte". Ya no hay un turno para todos: cada
   guardia tiene su horario y marca su propia entrada y salida (el relevo).
   Si el barrio tenía guardados los tres turnos viejos de fábrica (6-14,
   14-22, 22-6), se toman los nuevos solos. */
const TURNOS_BASE = [{ nombre:'Mañana', desde:'07:00', hasta:'15:00' }, { nombre:'Día', desde:'08:00', hasta:'20:00' }, { nombre:'Tarde', desde:'15:00', hasta:'23:00' }, { nombre:'Noche', desde:'23:00', hasta:'07:00' }];
/* 15-10: en la garita de verdad estaban guardados tres horarios (7-15, 15-23
   y 23-7) y faltaba el de 8 a 20 ("le falta la línea del turno de 8 a 20").
   Esos tres también se toman como viejos: va la grilla de cuatro. */
const TURNOS_VIEJOS = ['Mañana 06:00-14:00|Tarde 14:00-22:00|Noche 22:00-06:00', '07:00-15:00|15:00-23:00|23:00-07:00'];
const turnosConfig = () => { const t = aLista(Store.s.config.turnosGarita).filter(x => x && x.nombre && x.desde && x.hasta);
  const firma = t.map(x => `${x.nombre} ${x.desde}-${x.hasta}`).join('|'), horas = t.map(x => `${x.desde}-${x.hasta}`).join('|');
  return t.length && !TURNOS_VIEJOS.includes(firma) && !TURNOS_VIEJOS.includes(horas) ? t : TURNOS_BASE; };
const enFranja = (t, min) => { const d = minutosDe(t.desde), h = minutosDe(t.hasta); return d < h ? min >= d && min < h : (min >= d || min < h); };
const turnoDeAhora = () => turnosConfig().find(t => enFranja(t, ahoraMin())) || turnosConfig()[0];
const registrosTurno = () => aLista(Store.s.bitacora).filter(b => b && b.tipo === 'turno' && b.abre).sort((a, b) => b.at - a.at);
/* EL RELEVO DE A UNO (14-10-2026). Sigue habiendo UN registro abierto de la
   guardia (así el policía, los partes y la supervisión no cambian), pero
   ahora dice quién está con su horario: relevos = [{ n, h, entra }].
   · Si entra alguien, se suma al registro abierto.
   · Si sale alguien, el registro se cierra (sale su parte) y se abre otro
     con los que quedan y el que entra en su lugar, si lo hay.
   Los registros viejos, sin relevos, se leen con su turno de entonces. */
const horarioDe = nombre => turnosConfig().find(x => x.nombre === nombre) || null;
const relevosDe = t => !t ? [] : aLista(t.relevos).length ? aLista(t.relevos).filter(r => r && r.n) : aLista(t.guardias).map(n => ({ n, h:t.turno, entra:t.at }));
const ordenHorarios = () => turnosConfig().map(x => x.nombre);
const etiquetaGuardia = rs => { const o = ordenHorarios(); return [...new Set(rs.map(r => r.h).filter(Boolean))].sort((a, b) => o.indexOf(a) - o.indexOf(b)).join(' + ') || 'Guardia'; };
/* El horario que corresponde a quien llega ahora: el que empieza más cerca
   de esta hora (hasta 90 min antes o después); si no, el que está en curso
   y empezó último. */
function horarioSugerido(min = ahoraMin()){
  const ts = turnosConfig(), dist = t => { let d = min - minutosDe(t.desde); if (d > 720) d -= 1440; if (d < -720) d += 1440; return d; };
  const cerca = ts.filter(t => Math.abs(dist(t)) <= 90).sort((a, b) => Math.abs(dist(a)) - Math.abs(dist(b)))[0];
  return cerca || ts.filter(t => enFranja(t, min)).sort((a, b) => dist(a) - dist(b))[0] || ts[0];
}
/* Minutos que faltan para que termine un horario (negativo: ya terminó). */
const faltanDe = (h, ahoraM = ahoraMin()) => { if (!h) return 0; let f = minutosDe(h.hasta) - ahoraM; if (f < -720) f += 1440; if (f > 720) f -= 1440; return f; };
/* =========================================================
   EL TURNO ABIERTO ES SOLO EL ÚLTIMO (pedido de Claudio, 28-09-2026)
   Antes se buscaba CUALQUIER turno sin cerrar: si uno viejo había quedado
   abierto (por ejemplo, el siguiente se empezó desde otro equipo), al cerrar
   el turno de ahora aparecía "El turno Mañana sigue abierto · Soy de ese
   turno: seguir", aunque ya estaba todo cerrado. Ahora cuenta solo el
   último turno anotado: si está cerrado, no hay turno abierto. Y al empezar
   o cerrar un turno se cierran también los viejos que hubieran quedado
   abiertos, con un renglón en la bitácora.
   "Soy de ese turno: seguir" se ofrece solo si ese último turno sigue
   abierto y empezó hace menos de TURNO_RETOMAR (16 h): es para retomar
   cuando la app se cerró en pleno turno o se entra desde otro equipo. En
   el mismo equipo que lo abrió no se pregunta nada: sigue solo.
   ========================================================= */
const TURNO_RETOMAR = 16 * HORA;
const turnoAbierto = () => { const r = registrosTurno()[0]; return r && !r.cerradoAt ? r : null; };
const turnoParaRetomar = () => { const t = turnoAbierto(); return t && Date.now() - t.at < TURNO_RETOMAR ? t : null; };
/* Cierra los turnos que quedaron abiertos (menos `salvo`). Devuelve cuántos. */
function cerrarTurnosOlvidados(s, ahora, salvo = ''){
  const viejos = aLista(s.bitacora).filter(b => b && b.tipo === 'turno' && b.abre && !b.cerradoAt && b.id !== salvo);
  viejos.forEach(b => { b.cerradoAt = ahora; b.cierreAuto = true; });
  if (viejos.length) s.bitacora.unshift({ id:uid(), autor:yo()?.id || 'sistema', tipo:'turno', texto:`${viejos.length === 1 ? 'Se cerró el turno ' + viejos[0].turno + ' (' + aLista(viejos[0].guardias).join(', ') + '), que había quedado abierto' : 'Se cerraron ' + viejos.length + ' turnos que habían quedado abiertos (' + viejos.map(b => b.turno + ' del ' + fechaCorta(isoDe(new Date(b.at)))).join(', ') + ')'}.`, at:ahora - 3 });
  return viejos.length;
}
/* ¿Esta sesión ya anotó (o retomó) su turno? Mientras la bitácora todavía
   está bajando de la nube se le cree a la sesión, para que no parpadee. */
function turnoListo(){
  if (!esGuardia()) return true;
  const t = turnoAbierto();
  if (t) return Store.sesion.turnoId === t.id;
  return !!Store.sesion.turnoId && !registrosTurno().length && !(Store.s.bitacora || []).length;
}
/* Quiénes estaban de guardia en un momento dado. */
const guardiasEn = at => { const t = registrosTurno().find(b => b.at <= at && (!b.cerradoAt || at <= b.cerradoAt)); return t ? aLista(t.guardias) : []; };
const claveNombre = t => normTxt(t).replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
const conMayusculas = t => String(t).trim().replace(/\s+/g, ' ').toLowerCase().replace(/(^|[\s'-])(\p{L})/gu, (m, a, b) => a + b.toUpperCase());
/* Los guardias que ya trabajaron alguna vez, con su nombre como quedó escrito. */
function guardiasConocidos(){
  const m = new Map();
  registrosTurno().slice().reverse().forEach(r => aLista(r.guardias).forEach(n => { const k = claveNombre(n); if (k && !m.has(k)) m.set(k, n); }));
  return m;
}
function formularioTurno(){
  const u = yo(), t = turnoDeAhora(), abierto = turnoParaRetomar(), conocidos = [...guardiasConocidos().values()];
  const sug = horarioSugerido().nombre;
  const fila = i => `<div class="turno-fila"><span class="turno-n">${i + 1}</span><input name="g" list="guardiasLista" autocomplete="off" maxlength="50" ${i === 0 ? 'required' : ''} placeholder="${i === 0 ? 'Nombre y apellido' : 'Otro guardia (opcional)'}">
    <select name="gh" class="turno-h" aria-label="Horario">${turnosConfig().map(x => `<option value="${esc(x.nombre)}" ${x.nombre === sug ? 'selected' : ''}>${esc(x.nombre)} ${x.desde.slice(0, 2)}–${x.hasta.slice(0, 2)}</option>`).join('')}</select></div>`;
  return `<div class="turno-portada">
    <span class="turno-ic">${I('shield')}</span>
    <h1>¿Quién entra a la guardia?</h1>
    <p>${fechaLarga(hoyISO())} · ${hora(Date.now())} h</p></div>
    ${abierto ? `<div class="card turno-previo"><b>${I('clock')} El turno ${esc(abierto.turno)} no se cerró</b>
      <span>${esc(aLista(abierto.guardias).join(', '))} · desde las ${hora(abierto.at)} h${isoDe(new Date(abierto.at)) !== hoyISO() ? ' del ' + fechaCorta(isoDe(new Date(abierto.at))) : ''}</span>
      <div class="btns" style="margin-top:10px"><button class="btn btn-sm btn-sec" data-a="seguir-turno">Soy de ese turno: seguir</button></div>
      <p class="muted tiny" style="margin:8px 0 0">Pasa si la app se cerró en pleno turno o se entra desde otro equipo. Si sos de ese turno, seguí; si no, empezá el nuevo y ese se cierra solo (queda anotado en la bitácora).</p></div>` : ''}
    ${notaDejadaHtml()}
    ${typeof lineaGuardia === 'function' ? `<div class="card" style="padding:12px 12px 8px">${lineaGuardia()}</div>` : ''}
    <form data-f="abrir-turno" class="card">
      <div class="field"><label>¿Quién entra y en qué horario?</label>${[0, 1].map(fila).join('')}<div id="turnoMas"></div>
        <button type="button" class="btn btn-xs btn-sec" data-a="turno-otro" style="margin-top:4px">${I('plus')}Agregar otro guardia</button>
        <div class="ayuda">Cada uno con su horario (el que corresponde a esta hora viene marcado). Los que entran después se suman desde la garita con "Entra". No importan mayúsculas ni acentos: si ya trabajó antes, se reconoce solo.</div></div>
      <datalist id="guardiasLista">${conocidos.map(n => `<option value="${esc(n)}">`).join('')}</datalist>
      <button class="btn btn-pri btn-block btn-grande">${I('check')}Empezar la guardia</button>
    </form>
    <p class="muted tiny center">Cuenta de la garita · ${esc(u.email || '')}</p>`;
}
A['turno-otro'] = () => {
  const box = $('#turnoMas'); if (!box) return;
  const n = $$('input[name="g"]').length;
  if (n >= 8){ toast('Hasta ocho guardias por turno', 'users'); return; }
  const sug = horarioSugerido().nombre;
  box.insertAdjacentHTML('beforeend', `<div class="turno-fila"><span class="turno-n">${n + 1}</span><input name="g" list="guardiasLista" autocomplete="off" maxlength="50" placeholder="Otro guardia">
    <select name="gh" class="turno-h" aria-label="Horario">${turnosConfig().map(x => `<option value="${esc(x.nombre)}" ${x.nombre === sug ? 'selected' : ''}>${esc(x.nombre)} ${x.desde.slice(0, 2)}–${x.hasta.slice(0, 2)}</option>`).join('')}</select></div>`);
  box.lastElementChild.querySelector('input').focus();
};
A['seguir-turno'] = () => { const t = turnoParaRetomar(); if (!t) return; Store.sesion.turnoId = t.id; Store.guardarSesion(); toast(`Seguís en el turno ${t.turno}`, 'shield'); pintar(); };
F['abrir-turno'] = d => {
  const conocidos = guardiasConocidos(), vistos = new Set(), relevos = [], hs = [].concat(d.gh || []), ahora = Date.now();
  [].concat(d.g || []).forEach((n, i) => {
    const k = claveNombre(n); if (!k || vistos.has(k)) return;
    vistos.add(k); relevos.push({ n:conocidos.get(k) || conMayusculas(n), h:horarioDe(hs[i]) ? hs[i] : horarioSugerido().nombre, entra:ahora });
  });
  if (!relevos.length){ toast('Anotá al menos un guardia', 'users'); return; }
  const { previoId } = abrirGuardia(relevos, `Empieza la guardia: ${relevos.map(r => `${r.n} (${r.h})`).join(', ')}.`);
  toast(`Guardia en marcha: ${etiquetaGuardia(relevos)}`, 'shield');
  pintar();
  if (previoId) mandarParteTurno(previoId);
};
/* Abre un registro de guardia nuevo con estos relevos: cierra el anterior
   (si había), cierra los olvidados y pasa al policía que sigue de servicio.
   Devuelve el id nuevo y el del que se cerró (para mandar su parte). */
function abrirGuardia(relevos, texto, { cierre = '', nota = '', notaPor = '' } = {}){
  const u = yo(), id = uid(), ahora = Date.now(), turno = etiquetaGuardia(relevos), guardias = relevos.map(r => r.n);
  let previoId = '';
  Store.cambiar(s => {
    const previo = turnoAbierto();
    if (previo){
      previoId = previo.id;
      const x = aLista(s.bitacora).find(b => b.id === previo.id) || previo;
      x.cerradoAt = ahora; if (!cierre) x.cierreAuto = true;
      if (nota){ x.notaCierre = nota; if (notaPor) x.notaPor = notaPor; }
      s.bitacora.unshift({ id:uid(), autor:u.id, tipo:'turno', texto: cierre || `Se cerró el turno ${previo.turno} (${aLista(previo.guardias).join(', ')}) al empezar el siguiente.`, at:ahora - 1 });
    }
    cerrarTurnosOlvidados(s, ahora);
    /* El policía que sigue de servicio pasa al registro que entra, con la
       ronda que tenga en curso. */
    const ultimo = aLista(s.bitacora).filter(b => b.tipo === 'turno' && b.abre).sort((a, b) => b.at - a.at)[0];
    const siguen = [];
    if (ultimo && Date.now() - ultimo.at < 16 * HORA){
      ultimo.policias = policiasDe(ultimo).map(p => {
        if (p.sale || p.paso) return p;
        const rc = rondaEnCurso(p);
        siguen.push({ id:p.id, nombre:p.nombre, cargo:p.cargo || '', matricula:p.matricula || '', tel:p.tel || '', email:p.email || '', entra:p.entra, turnoEntra:p.turnoEntra || ultimo.turno, viene:ultimo.turno, rondas: rc ? [rc] : [] });
        return { ...p, paso:ahora, rondas: p.rondas.filter(r => r.fin) };
      });
    }
    s.bitacora.unshift({ id, autor:u.id, tipo:'turno', abre:true, turno, guardias, relevos, policias:siguen, texto:`${texto}${siguen.length ? ' Sigue de servicio: ' + siguen.map(p => p.nombre).join(', ') + '.' : ''}`, at:ahora });
  });
  Store.sesion.turnoId = id; Store.guardarSesion();
  return { id, previoId };
}
A['cerrar-turno'] = () => {
  const t = turnoAbierto();
  hoja('Cerrar el turno', `<form data-f="cerrar-turno">
    ${t ? `<p class="small" style="margin:0 0 12px">Turno <b>${esc(t.turno)}</b> · ${esc(aLista(t.guardias).join(', '))} · desde las ${hora(t.at)} h.</p>` : ''}
    <div class="field"><label>Novedades para el turno que entra (opcional)</label><textarea name="nota" maxlength="500" placeholder="Ej: quedó un paquete para el lote 40; el portón del fondo cierra mal."></textarea></div>
    ${policiasAdentro(t).length ? `<div class="field"><label>Policía que sigue en el barrio</label>${policiasAdentro(t).map(p => `<label class="check"><input type="checkbox" name="polSale" value="${esc(p.id)}"><span>${esc(p.nombre)} ya se fue (anotar la salida ahora)</span></label>`).join('')}
      <div class="ayuda">Si sigue de servicio, dejalo sin tildar: pasa al turno que entra con sus rondas.</div></div>` : ''}
    <button class="btn btn-pri btn-block">${I('check')}Cerrar el turno y anotar el siguiente</button>
    <p class="muted tiny" style="margin:10px 0 0">No se sale de la app: queda abierta la pantalla para anotar el turno que entra y sus guardias. Para salir de la cuenta de la garita: tu inicial, arriba → Cerrar sesión.</p></form>`);
};
/* Cerrar el turno ya no saca de la app: se anotan las novedades, el turno
   queda cerrado en la bitácora y la garita pasa directo a la pantalla de
   "Nuevo turno" para que el que entra anote a sus guardias. Salir de la
   cuenta es aparte, como cualquier vecino: la inicial de arriba → Cerrar sesión. */
F['cerrar-turno'] = d => {
  const u = yo(), t = turnoAbierto(), nota = (d.nota || '').trim(), ahora = Date.now();
  const salen = new Set([].concat(d.polSale || []));
  Store.cambiar(s => {
    const x = t && aLista(s.bitacora).find(b => b.id === t.id);
    if (x){
      x.cerradoAt = ahora;
      /* Las novedades para el turno que entra quedan también en el registro
         del turno (13-10-2026): se fijan arriba en la bitácora y en la
         pantalla de "Nuevo turno", para que el que entra las vea. */
      if (nota) x.notaCierre = nota;
      x.policias = policiasDe(x).map(p => salen.has(p.id) && !p.sale ? { ...p, sale:ahora, turnoSale:t.turno } : p);
      /* La ronda que el que se va dejó abierta queda INCOMPLETA en la bitácora. */
      x.policias.filter(p => salen.has(p.id)).forEach(p => { const rc = rondaEnCurso(p); if (rc) cerrarRondaIncompleta(s, p, rc, ahora, 'el policía se retiró en plena ronda'); });
      x.policias.filter(p => salen.has(p.id)).forEach(p => cerrarServicio(s, p));
      salen.forEach(pid => bajarCodigo(s, pid));
      x.policias.filter(p => salen.has(p.id)).forEach(p => s.bitacora.unshift({ id:uid(), autor:u.id, tipo:'acceso', texto:`Salida del policía ${p.nombre}${pnParen(p)} · ${hora(ahora)} h · ${plural(p.rondas.length, 'ronda')}.`, at:ahora - 2 }));
    }
    s.bitacora.unshift({ id:uid(), autor:u.id, tipo:'turno', texto:`Termina el turno ${t ? t.turno + ' (' + aLista(t.guardias).join(', ') + ')' : ''}.${x ? resumenPolicia(x) : ''}${nota ? ' Novedades: ' + nota : ''}`, at:ahora });
    cerrarTurnosOlvidados(s, ahora);
  });
  Store.sesion.turnoId = ''; Store.guardarSesion();
  cerrarHoja();
  toast('Turno cerrado. Anotá el turno que entra.', 'check');
  PILA.length = 0;
  pintar();
  if (t) mandarParteTurno(t.id, nota);
  salen.forEach(pid => mandarConstanciaPolicia(pid));
};

/* =========================================================
   PARTE DEL TURNO POR CORREO
   Al cerrarse cada turno (a mano o al abrir el siguiente) sale un correo a
   la Administración con el resumen: quiénes estuvieron, novedades, policía
   y rondas (con los puntos de control), y todo lo que se anotó en la
   bitácora en ese horario. Se apaga en Ajustes → Correo.
   ========================================================= */
function parteTurnoHtml(t, nota = ''){
  const fin = t.cerradoAt || Date.now();
  const lineas = aLista(Store.s.bitacora).filter(b => b && b.at >= t.at && b.at <= fin + MIN && b.id !== t.id).sort((a, b) => a.at - b.at);
  const cuenta = re => lineas.filter(b => re.test(b.texto || '')).length;
  const ps = policiasDe(t);
  const fila = (a, b) => `<tr><td style="padding:4px 10px 4px 0;color:#6c7d7a;white-space:nowrap;vertical-align:top">${a}</td><td style="padding:4px 0">${b}</td></tr>`;
  return Correo.plantilla(`Parte del turno ${t.turno}`, `
    <table style="border-collapse:collapse;font-size:14px;margin:0 0 14px">
      ${fila('Fecha', fechaLarga(isoDe(new Date(t.at))))}
      ${fila('Horario', `${hora(t.at)} a ${hora(fin)} h${t.cierreAuto ? ' (se cerró al abrir el siguiente)' : ''}`)}
      ${fila('Guardias', esc(aLista(t.guardias).join(', ')))}
      ${fila('Ingresos y egresos', String(cuenta(/^(Ingreso|Egreso)/)))}
      ${hayPaquetes() ? fila('Paquetes', String(cuenta(/paquete/i))) : ''}
      ${fila('SOS', String(cuenta(/^SOS/)))}
    </table>
    ${nota ? `<p style="background:#fff7e0;border-radius:10px;padding:10px 12px;margin:0 0 14px"><b>Novedades para el turno siguiente:</b><br>${esc(nota)}</p>` : ''}
    ${ps.length ? `<h3 style="font-size:15px;margin:16px 0 6px">Policía contratada</h3>${ps.map(p => `<p style="margin:0 0 8px"><b>${esc(p.nombre)}</b>${esc(pnCargoMat(p, '', ' · '))} · ingresó ${hora(p.entra)} h${p.sale ? ' · salió ' + hora(p.sale) + ' h' : p.paso ? ' · siguió en el turno siguiente' : ' · sigue en el barrio'}<br>
      ${p.rondas.length ? p.rondas.map((r, i) => `Ronda ${i + 1}${r.incompleta ? ' (INCOMPLETA)' : ''}: ${hora(r.inicio)}${r.fin ? ' a ' + hora(r.fin) + ' (' + minutos(r.inicio, r.fin) + ' min)' : ' · en curso'}${r.pasos.length ? ` · QR ${new Set(pasosDeRonda(r).map(x => x.punto)).size}/${puntosActivos().length}: ${pasosDeRonda(r).map(x => esc(nombrePunto(x.punto)) + ' ' + hora(x.at)).join(', ')}` : ''}`).join('<br>') : 'Sin rondas anotadas.'}</p>`).join('')}` : ''}
    <h3 style="font-size:15px;margin:16px 0 6px">Bitácora del turno</h3>
    ${lineas.length ? `<table style="border-collapse:collapse;font-size:13px">${lineas.map(b => fila(hora(b.at), esc(b.texto || ''))).join('')}</table>` : '<p style="margin:0">Sin anotaciones.</p>'}
    ${(() => { const v = typeof vistoDe === 'function' ? vistoDe(t.id) : null; return v ? `<p style="background:${v.estado === 'obs' ? '#fff7e0' : '#eaf7ef'};border-radius:10px;padding:10px 12px;margin:14px 0 0"><b>Visto de la supervisión:</b> ${v.estado === 'obs' ? 'con observaciones' : 'sin observaciones'} · ${esc(v.nombre || '')} · ${fechaCorta(isoDe(new Date(v.at)))} ${hora(v.at)} h${v.obs ? '<br>' + esc(v.obs) : ''}</p>` : ''; })()}
    <p style="font-size:12px;color:#6c7d7a;margin-top:16px">Lo mandó la app de la garita al cerrarse el turno. Tiene datos personales: es para uso interno de la Administración (Ley 25.326, art. 10).</p>`);
}
async function mandarParteTurno(turnoId, nota = ''){
  const c = Store.s.config;
  if (c.parteTurno === false || !c.adminEmail) return;
  const t = registrosTurno().find(x => x.id === turnoId); if (!t) return;
  const r = await Correo.enviarDetalle({ para:c.adminEmail, asunto:`Parte del turno ${t.turno} · ${fechaCorta(isoDe(new Date(t.at)))} · ${aLista(t.guardias).join(', ')}`, html:parteTurnoHtml(t, nota), tipo:'parte-turno' });
  toast(r.ok ? 'El parte del turno salió por correo a la Administración' : 'El parte del turno no salió por correo: ' + r.error, r.ok ? 'mail' : 'alert');
}
A['parte-ver'] = el => { const t = (typeof turnosDelCal === 'function' ? turnosDelCal() : registrosTurno()).find(x => x.id === el.dataset.id); if (!t) return;
  hoja(`Parte del turno ${t.turno}`, `<div class="card plana" style="padding:0;overflow:hidden">${parteTurnoHtml(t)}</div>
    ${esAdmin() && Store.s.config.adminEmail ? `<button class="btn btn-sec btn-block" style="margin-top:10px" data-a="parte-reenviar" data-id="${t.id}">${I('mail')}Mandármelo por correo</button>` : ''}
    ${esSupervisor() && t.cerradoAt && typeof vistoDe === 'function' && !vistoDe(t.id) ? `<button class="btn btn-pri btn-block" style="margin-top:10px" data-a="visto-parte" data-id="${t.id}">${I('eye')}Dar el visto</button>` : ''}`, { ancho:'640px' }); };
A['parte-reenviar'] = el => { mandarParteTurno(el.dataset.id); cerrarHoja(); };
/* "Cerrar turno" está SOLO en su ventana (la teja "Cerrar el turno" de la
   garita): antes también estaba en esta banda y en "Tu cuenta", y
   confundía (pedido de Claudio, 27-09). */
const bandaTurno = () => {
  const t = turnoAbierto(); if (!t) return '';
  return `<button type="button" class="turno-banda" data-a="guardia-hoy">${I('shield')}<div class="grow"><b>Guardia · ${esc(t.turno)}</b><span>${esc(relevosDe(t).map(r => `${r.n} (${r.h})`).join(' · '))}</span></div>${I('right')}</button>`;
};

/* =========================================================
   POLICÍA CONTRATADA POR EL BARRIO
   Suele venir de noche (22 a 6 h). La guardia anota, dentro del turno:
   nombre, matrícula, hora de ingreso y de salida, y cada ronda caminando
   por el barrio (unos 20 minutos cada una; puede haber varias por turno y
   más de un policía). Todo vive dentro del registro del turno en la
   bitácora (campo `policias`), así no hace falta una regla nueva en
   Firebase, y cada ingreso, ronda y salida deja además su renglón en la
   bitácora. Si el policía sigue cuando cambia el turno, pasa al que entra.
   ========================================================= */
const RONDA_MIN = 20, RONDA_LARGA = 40;
const policiasDe = t => aLista(t && t.policias).filter(p => p && p.id).map(p => ({ ...p, rondas: aLista(p.rondas).filter(r => r && r.inicio).map(r => ({ ...r, pasos: aLista(r.pasos) })) }));
const policiasAdentro = t => policiasDe(t).filter(p => !p.sale && !p.paso);
const rondaEnCurso = p => p.rondas.find(r => !r.fin) || null;
const minutos = (a, b) => Math.max(1, Math.round((b - a) / MIN));
/* "23:40" escrito a mano → la última vez que fue esa hora (hoy o anoche). */
function horaPasada(hhmm){
  const [h, m] = String(hhmm || '').split(':').map(Number); if (isNaN(h)) return Date.now();
  const d = new Date(); d.setHours(h, m || 0, 0, 0);
  if (d.getTime() > Date.now() + 10 * MIN) d.setDate(d.getDate() - 1);
  return d.getTime();
}
const horaInput = ts => { const d = new Date(ts); return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); };
function policiasConocidos(){
  const m = new Map();
  registrosTurno().slice().reverse().forEach(r => policiasDe(r).forEach(p => { const k = claveNombre(p.nombre); if (!k) return; const ya = m.get(k) || {};
    m.set(k, { nombre:p.nombre, cargo:p.cargo || ya.cargo || '', matricula:p.matricula || ya.matricula || '', tel:p.tel || ya.tel || '', email:p.email || ya.email || '' }); }));
  /* La ficha de policías (22-10-2026, js/turnos-vivo.js) manda sobre lo que
     quedó en los servicios, y "Ya no viene" lo saca de los botones. */
  const fs = typeof fichaPolicias === 'function' ? fichaPolicias() : [];
  if (!fs.length) return m;
  const out = new Map(), usadas = new Set(), deFicha = f => ({ nombre:f.nombre, cargo:f.cargo || '', matricula:f.matricula || '', tel:f.tel || '', email:f.email || '' });
  m.forEach((v, k) => { const f = fs.find(x => x.k === k || claveNombre(x.nombre) === k); if (!f){ out.set(k, v); return; }
    if (usadas.has(f.id)) return; usadas.add(f.id); if (!f.noViene) out.set(claveNombre(f.nombre), deFicha(f)); });
  fs.forEach(f => { if (!usadas.has(f.id) && !f.noViene) out.set(claveNombre(f.nombre), deFicha(f)); });
  return out;
}
function resumenPolicia(t){
  const ps = policiasDe(t); if (!ps.length) return '';
  return ' Policía: ' + ps.map(p => { const inc = p.rondas.filter(r => r.incompleta).length, rc = rondaEnCurso(p);
    return `${p.nombre}${pnParen(p)} desde ${hora(p.entra)}${p.sale ? ' a ' + hora(p.sale) : ''}, ${plural(p.rondas.length, 'ronda')}${inc ? ` (${plural(inc, 'incompleta', 'incompletas')})` : ''}${rc ? ', una en curso' : ''}`; }).join('; ') + '.';
}
/* Cambia un policía del turno abierto y guarda. */
function cambiarPolicia(pid, fn, renglon){
  const t = turnoAbierto(); if (!t) return toast('No hay un turno abierto', 'clock');
  Store.cambiar(s => {
    const x = aLista(s.bitacora).find(b => b.id === t.id); if (!x) return;
    x.policias = policiasDe(x);
    const p = x.policias.find(q => q.id === pid); if (!p) return;
    fn(p, x, s);
    const texto = renglon && renglon(p);
    if (texto) s.bitacora.unshift({ id:uid(), autor:yo().id, tipo:'acceso', texto, at:Date.now() });
  });
  refrescar();
}
/* La portada de la garita muestra SOLO al policía que está de servicio
   (pedido de Claudio, 27-09): cuando se registra su salida, desaparece de
   acá y queda en Turnos → "Servicios del policía", con todo su recorrido.
   Sin nadie de servicio queda la solapa y "Registrar ingreso". */
function bandaPolicia(){
  const t = turnoAbierto(); if (!t) return '';
  const ps = policiasAdentro(t), ahora = Date.now();
  /* Solo la garita registra al policía y sus rondas; la Administración lo ve. */
  const guardia = esGuardia();
  const sueltos = pasosSueltos(t).filter(x => Date.now() - x.at > 30000);
  const avisoSueltos = sueltos.length ? `<div class="aviso a-warn" style="margin:10px 0 0">${I('qr')}<div class="txt"><b>${plural(sueltos.length, 'paso escaneado', 'pasos escaneados')} sin asignar</b>${sueltos.slice(0, 4).map(x => `${esc(nombrePunto(x.punto))} · ${esc(x.nombre)} · ${hora(x.at)} h`).join('<br>')}<br>Son de un código que ya no corresponde a ningún policía de este turno (por ejemplo, se registró la salida antes).</div></div>` : '';
  /* (13-10-2026) Rediseño: la noche con su horario propio arriba, cada
     policía como una credencial con su barra de servicio y botones grandes. */
  const n = nochePolicia();
  const cab = `<div class="pn-banda-cab"><span class="pn-luna">${I('moon')}<i></i><i></i><i></i></span>
      <div class="grow"><b>Policía nocturna${ps.length ? '' : ' · nadie de servicio'}</b><small>${esc(n.etiqueta)} · ${horarioNocheTxt(n)}</small></div>
      ${guardia ? `<button class="btn btn-xs btn-sec" data-a="policia-nuevo">${I('plus')}Ingreso</button>` : ''}</div>`;
  /* Sin nadie de servicio, el botón "Registrar ingreso" está en la tira de arriba (tiraGarita, 12-10-2026). */
  if (!ps.length) return avisoSueltos ? `<div class="card policia-card policia-solapa">${cab}${avisoSueltos}</div>` : '';
  return `<div class="card policia-card pn-banda">${cab}${barraNoche(n)}
    ${ps.map(p => { const rc = rondaEnCurso(p), dur = rc ? minutos(rc.inicio, ahora) : 0, hs = (ahora - p.entra) / HORA;
      return `<div class="policia pn-agente ${rc ? 'en-ronda' : ''}">
        <div class="policia-cab"><span class="pn-ini" style="--c:${colorDe(p.nombre)}">${esc(inicialesDe(p.nombre))}</span><div class="grow"><b>${esc(p.nombre)}</b><span class="muted small">${esc(pnCargoMat(p, ' · '))}ingresó ${isoDe(new Date(p.entra)) !== hoyISO() ? fechaCorta(isoDe(new Date(p.entra))) + ' ' : ''}${hora(p.entra)} h · ${hs >= 1 ? Math.floor(hs) + ' h ' : ''}${Math.round(hs % 1 * 60)} min${codigoVigente(p.id) ? ` · código <span class="mono">${codigoVigente(p.id).id}</span>` : ''}${p.email ? '' : ' · <b>sin correo para la constancia</b>'}${!p.cargo && guardia ? ` · <button class="enlace" data-a="policia-cargo" data-id="${p.id}"><b>falta el cargo</b></button>` : ''}</span></div>
          <span class="pill ${rc ? (dur > RONDA_LARGA ? 'p-danger' : 'p-accent') : ''}">${plural(p.rondas.length, 'ronda')}</span></div>
        ${typeof rondaAnillos === 'function' && typeof rondaPuntosMapa === 'function' && rondaPuntosMapa().length ? (() => { const v = rondaEnVivo(); return v.p && v.p.id === p.id ? `<div class="rm-banda">${rondaAnillos(v)}<button class="btn btn-xs btn-sec" data-a="abrir" data-v="mapa">${I('map')}Seguirlo en el mapa</button></div>` : ''; })() : ''}
        ${rc ? `<div class="aviso a-${dur > RONDA_LARGA ? 'danger latido' : 'info'}" style="margin:8px 0 0">${I('clock')}<div class="txt"><b>En ronda desde las ${hora(rc.inicio)} h · ${dur} min</b>${dur > RONDA_LARGA ? `Una ronda lleva unos ${RONDA_MIN} minutos: conviene comunicarse con el policía.` : `Vuelve alrededor de las ${hora(rc.inicio + RONDA_MIN * MIN)} h.`}</div></div>` : ''}
        ${p.rondas.length ? `<div class="rondas">${p.rondas.map((r, i) => `<span class="ronda">${i + 1}. ${hora(r.inicio)}${r.fin ? '–' + hora(r.fin) + ' · ' + minutos(r.inicio, r.fin) + ' min' : ' · en curso'}${r.pasos.length ? ` · QR ${new Set(pasosDeRonda(r).map(x => x.punto)).size}/${puntosActivos().length}` : ''}${r.incompleta ? ' · <b>incompleta</b>' : ''}${guardia ? `<button class="x" data-a="policia-ronda-borrar" data-id="${p.id}" data-v="${r.id}" aria-label="Borrar la ronda">×</button>` : ''}</span>`).join('')}</div>` : ''}
        ${(() => { const r = rc || p.rondas.filter(x => x.pasos.length).slice(-1)[0]; return r && puntosActivos().length ? recorridoRonda(r) : ''; })()}
        ${guardia ? `<div class="pn-acc">
          ${rc || !conPuntosQR() ? `<button class="pn-b ${rc ? 'c-ok' : 'c-brand'}" data-a="policia-ronda" data-id="${p.id}">${I(rc ? 'check' : 'pin')}<span>${rc ? 'Terminó la ronda' : 'Sale a una ronda'}</span></button>` : ''}
          ${codigoVigente(p.id) ? `<button class="pn-b c-wa" data-a="policia-codigo" data-id="${p.id}">${I('qr')}<span>Su tarjeta</span></button>` : `<button class="pn-b c-wa" data-a="policia-codigo-nuevo" data-id="${p.id}">${I('qr')}<span>Armar su tarjeta</span></button>`}
          <button class="pn-b c-wood" data-a="policia-salida" data-id="${p.id}">${I('logout')}<span>Se va</span></button></div>
          <div class="btns" style="margin-top:6px"><button class="btn btn-xs btn-sec" data-a="policia-ronda-mano" data-id="${p.id}">${I('edit')}Anotar ronda a mano</button>
          ${codigoVigente(p.id) ? `<button class="btn btn-xs btn-sec" data-a="policia-codigo-nuevo" data-id="${p.id}">${I('refresh')}Código nuevo</button>` : ''}
          ${typeof puedeAnular === 'function' ? `<button class="btn btn-xs btn-sec pf-anular" data-a="pn-anular" data-id="${p.id}">${I('trash')}Anular el ingreso</button>` : ''}</div>` : ''}
      </div>`; }).join('')}
    ${avisoSueltos}
  </div>`;
}

/* =========================================================
   PUNTOS DE CONTROL CON QR (rondas comprobables)
   La Administración define los puntos (6 de fábrica, de 2 a 12) y los
   imprime. Cada QR es un enlace a esta misma app: #/punto/<id>.<clave>/<nombre>.
   El policía lo escanea con la cámara de SU teléfono, sin instalar nada ni
   tener cuenta: se abre una pantallita, pone su nombre (la primera vez) y
   toca "Registrar paso". El paso va a staff/pasos con la HORA DEL SERVIDOR
   (no la del teléfono). Las reglas lo aceptan solo si trae la clave del
   punto, que está impresa en el QR: hay que estar frente al QR.
   La garita no tiene que hacer nada: el primer punto abre la ronda, cada
   punto se tilda y al completarlos todos la ronda se cierra sola
   (procesarPasos, corre en el equipo de la garita).
   Los puntos (con su clave) viven en staff/puntos: los leen la garita y la
   Administración; los vecinos no.
   ========================================================= */
/* (15-10-2026) Con su lugar en el plano (como el plano original) y en el
   orden de una vuelta: la Administración los mueve en "Editar recorrido". */
const PUNTOS_SUGERIDOS = [
  ['Acceso de servicio / portón', 'Junto al portón, en el poste de luz', 598, 128],
  ['Perímetro norte', 'Cerco lindero con el bosque o terreno abierto', 232, 186],
  ['Contenedores de residuos', 'Donde se juntan las bolsas antes de que pase el camión', 139, 262],
  ['Calle más oscura', 'Donde hay lotes baldíos u obras', 400, 281],
  ['Perímetro sur', 'Cerco lindero con la costa o terreno abierto', 760, 430],
  ['Fondo del barrio', 'El punto más alejado de la garita', 1036, 468],
];
const claveAzar = () => { const a = new Uint8Array(9); crypto.getRandomValues(a); return [...a].map(b => 'abcdefghjkmnpqrstuvwxyz23456789'[b % 31]).join(''); };
function puntosSugeridos(){ return PUNTOS_SUGERIDOS.map(([nombre, lugar, x, y], i) => ({ id:'pt' + (i + 1) + claveAzar().slice(0, 3), nombre, lugar, x, y, orden:i + 1, k:claveAzar(), activo:true, at:Date.now() })); }
const puntosActivos = () => aLista(Store.s.puntos).filter(x => x && x.activo !== false).sort((a, b) => (a.orden || 0) - (b.orden || 0));
const nombrePunto = id => (aLista(Store.s.puntos).find(x => x.id === id) || {}).nombre || 'Punto';
/* La hora de un paso (18-10-2026): la del servidor ("at"); si el paso
   quedó guardado en el teléfono por falta de señal y llegó tarde, la hora
   en que el policía leyó el QR ("t"), si es razonable (entre 2 minutos y
   6 horas antes de llegar). */
const pasoAt = x => { const t = +(x && x.t), at = +(x && x.at) || 0; return t && at - t > 2 * MIN && at - t < 6 * HORA ? t : at; };
const pasosDeRonda = r => { const ids = new Set(aLista(r.pasos)); return aLista(Store.s.pasos).filter(x => ids.has(x.id)).sort((a, b) => pasoAt(a) - pasoAt(b)); };
/* El recorrido de una ronda, como lista de control: barra de avance arriba y
   un renglón por punto, en el orden de la ronda, con la hora a la derecha. */
function recorridoRonda(r){
  const hechos = new Map(); pasosDeRonda(r).forEach(x => { if (!hechos.has(x.punto)) hechos.set(x.punto, pasoAt(x)); });
  const pts = puntosActivos(), n = pts.filter(pt => hechos.has(pt.id)).length, total = pts.length;
  const fin = r.fin || Date.now();
  const completa = total && n >= total;
  return `<div class="recorrido ${completa ? 'completa' : ''}">
    <div class="rec-cab"><b>${completa ? 'Ronda completa' : r.incompleta ? 'Ronda incompleta' : r.fin ? 'Ronda cerrada' : 'Ronda en curso'}</b>
      <span>${n} de ${total} puntos · ${minutos(r.inicio, fin)} min</span></div>
    <div class="rec-barra" role="progressbar" aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="${n}"><i style="width:${total ? Math.round(n / total * 100) : 0}%"></i></div>
    <ol class="rec-lista">${pts.map((pt, i) => { const at = hechos.get(pt.id);
      return `<li class="${at ? 'hecho' : ''}"><span class="rec-n">${at ? I('check') : i + 1}</span>
        <span class="rec-txt"><b>${esc(pt.nombre)}</b>${pt.lugar ? `<small>${esc(pt.lugar)}</small>` : ''}</span>
        <span class="rec-hora">${at ? hora(at) + ' h' : 'pendiente'}</span></li>`; }).join('')}</ol></div>`;
}
/* Pasos del turno que no se pudieron asignar a ningún policía. */
function pasosSueltos(t){
  const asignados = new Set(); registrosTurno().forEach(x => policiasDe(x).forEach(p => p.rondas.forEach(r => r.pasos.forEach(id => asignados.add(id)))));
  return aLista(Store.s.pasos).filter(x => x && x.at >= t.at && !asignados.has(x.id)).sort((a, b) => pasoAt(a) - pasoAt(b));
}
/* Cómo quedó una ronda con QR: cuántos puntos se pasaron y cuáles faltaron. */
function estadoRonda(r){
  const pts = puntosActivos(), hechos = new Set(pasosDeRonda(r).map(x => x.punto));
  const faltan = pts.filter(pt => !hechos.has(pt.id)).map(pt => pt.nombre);
  return { n: pts.length - faltan.length, total: pts.length, faltan };
}
const conQR = r => !!(r && (r.qr || aLista(r.pasos).length));
const ultimoPaso = r => Math.max(r.inicio + MIN, ...pasosDeRonda(r).map(pasoAt));
/* =========================================================
   LA RONDA QUE NO SE TERMINÓ TAMBIÉN VA A LA BITÁCORA
   La completa ya dejaba su renglón. La que quedaba a medias (faltó escanear
   algún punto, pasó más de una hora, el policía se fue en plena ronda) se
   cerraba en silencio. Ahora se cierra como INCOMPLETA y deja su renglón en
   la bitácora de la garita, con los puntos que faltaron: así figura en el
   parte del turno. (Pregunta de Claudio, 25-09-2026.)
   El renglón lleva un id fijo por ronda: si la garita tiene la app abierta
   en dos equipos, queda uno solo.
   ========================================================= */
function cerrarRondaIncompleta(s, p, r, fin, motivo){
  if (!r) return false;
  r.fin = r.fin || Math.max(r.inicio + MIN, fin || Date.now());
  const e = estadoRonda(r);
  if (conQR(r) && e.total && e.n >= e.total) return false;
  r.incompleta = true;
  const id = 'ri-' + r.id;
  if (aLista(s.bitacora).some(b => b && b.id === id)) return true;
  s.bitacora.unshift({ id, autor:yo()?.id || 'sistema', tipo:'acceso', at:Date.now() - 1,
    texto:`Ronda ${p.rondas.indexOf(r) + 1} del policía ${p.nombre} INCOMPLETA (${motivo}): ${conQR(r) && e.total ? `${e.n}/${e.total} puntos, faltó ${e.faltan.join(', ')}` : 'no se anotó el regreso'} · ${hora(r.inicio)} a ${hora(r.fin)} h.` });
  return true;
}
/* El equipo de la garita arma las rondas con los pasos que llegan, y
   cierra como incompleta la ronda con QR que pasó una hora sin terminarse. */
function procesarPasos(){
  if (!esGuardia()) return;
  const t = turnoAbierto(); if (!t) return;
  const sueltos = pasosSueltos(t), ahora = Date.now();
  const vencida = r => r && !r.fin && conQR(r) && ahora - r.inicio > HORA;
  if (!sueltos.length && !policiasAdentro(t).some(p => vencida(rondaEnCurso(p)))) return;
  const total = puntosActivos().length;
  let cambios = false; const renglones = [];
  Store.cambiar(s => {
    const x = aLista(s.bitacora).find(b => b.id === t.id); if (!x) return;
    x.policias = policiasDe(x);
    const adentro = x.policias.filter(p => !p.sale && !p.paso);
    sueltos.forEach(ps => {
      /* El paso se asigna por el CÓDIGO de ronda, no por el nombre escrito. */
      const cod = aLista(s.rondaCodigos).find(c => c && c.id === ps.c);
      const p = cod && adentro.find(q => q.id === cod.pid);
      if (!p) return;
      let r = rondaEnCurso(p);
      /* Una ronda abierta hace más de una hora no se estira: se cierra
         (incompleta, a la bitácora) y empieza otra. */
      if (r && pasoAt(ps) - r.inicio > HORA){ r.fin = r.fin || ultimoPaso(r); cerrarRondaIncompleta(s, p, r, r.fin, 'pasó más de una hora sin completar los puntos'); r = null; }
      if (!r){ r = { id:'q-' + ps.id, inicio:pasoAt(ps), qr:true, pasos:[] }; p.rondas.push(r); }
      if (!r.pasos.includes(ps.id)) r.pasos.push(ps.id);
      cambios = true;
      const pts = new Set(r.pasos.map(id => (aLista(s.pasos).find(z => z.id === id) || {}).punto));
      if (total && pts.size >= total){
        r.fin = pasoAt(ps);
        renglones.push({ id:'rc-' + r.id, texto:`Ronda ${p.rondas.indexOf(r) + 1} del policía ${p.nombre} completa por QR: ${total}/${total} puntos, ${hora(r.inicio)} a ${hora(r.fin)} h (${minutos(r.inicio, r.fin)} min).` });
      }
    });
    /* La que quedó abierta más de una hora sin completarse, aunque no
       lleguen más pasos. */
    adentro.forEach(p => { const r = rondaEnCurso(p); if (vencida(r)){ r.fin = ultimoPaso(r); cerrarRondaIncompleta(s, p, r, r.fin, 'pasó más de una hora sin completar los puntos'); cambios = true; } });
    renglones.forEach(({ id, texto }) => { if (!aLista(s.bitacora).some(b => b && b.id === id)) s.bitacora.unshift({ id, autor:yo().id, tipo:'acceso', texto, at:Date.now() }); });
  });
  if (cambios) refrescarPronto();
}

/* ---------- la pantallita que abre el QR (sin cuenta) ---------- */
/* El teléfono del policía recuerda su código y su nombre por 14 horas. */
const Ronda = {
  KEY:'bhc.ronda',
  leer(){ try { const r = JSON.parse(localStorage.getItem(this.KEY) || 'null'); return r && r.c && Date.now() - r.at < CODIGO_VIGENCIA ? r : null; } catch(e){ return null; } },
  guardar(c, nombre){ try { localStorage.setItem(this.KEY, JSON.stringify({ c, nombre, at:Date.now() })); } catch(e){} },
  olvidar(){ try { localStorage.removeItem(this.KEY); } catch(e){} },
};
/* El enlace que recibe el policía por WhatsApp: deja el teléfono listo. */
function pintarRondaHabilitar(ruta){
  const [c, n, token] = String(ruta || '').split('/');
  /* "#/ronda/guia": volver a ver el recorrido guardado en este teléfono. */
  if (c === 'guia') return pintarGuiaPolicia(typeof RondaGuia !== 'undefined' ? RondaGuia.leer() : null, Ronda.leer());
  const ok = /^\d{6}$/.test(c || ''), nombre = decodeURIComponent(n || '');
  if (ok) Ronda.guardar(c, nombre);
  $('#app').innerHTML = `<section class="bienvenida" id="puntoPublico"><div class="foto" style="background-image:url('${Clima.portada()}')"></div>
    <div class="marca"><span class="logo">${LOGO}</span><div><b style="font-size:16px">Barrio ${esc(Store.s.config.nombre)}</b></div></div>
    <h1 style="font-size:28px">${I('shield')} Ronda de esta noche</h1>
    <div class="panel">${ok ? `${aviso('ok', 'check', `Listo${nombre ? ', ' + esc(nombre) : ''}: tu teléfono quedó habilitado`, 'En cada punto de control escaneá el QR con la cámara y tocá "Registrar paso".')}
      <p style="margin:12px 0 4px;opacity:.9">Tu código de ronda (por si te lo pide):</p><div class="codigo-grande">${c.slice(0, 3)} ${c.slice(3)}</div>
      <div id="rondaGuia" class="rm-guia-caja"><p class="tiny" style="opacity:.8;margin:12px 0 0">${I('download')} Bajando tu recorrido con las fotos de cada punto…</p></div>`
      : `<p style="margin:0"><b>Este enlace no es válido.</b> Pedile a la garita que te lo mande de nuevo.</p>`}</div></section>`;
  if (!ok || typeof RondaGuia === 'undefined') return;
  if (typeof rondaColaVaciar === 'function') setTimeout(rondaColaVaciar, 300);
  /* La guía se baja UNA vez y queda guardada en este teléfono (las fotos son chicas). */
  RondaGuia.bajar(token).then(g => {
    const caja = $('#rondaGuia'); if (!caja) return;
    if (!g || !aLista(g.pts).length){ caja.innerHTML = `<p class="tiny" style="opacity:.8;margin:12px 0 0">La garita todavía no cargó el recorrido: escaneá los QR que encuentres en tu ronda.</p>`; return; }
    const guardada = RondaGuia.guardar(g);
    caja.innerHTML = `<h2 class="rm-guia-tit">${I('pin')} Tu recorrido: ${plural(aLista(g.pts).length, 'punto', 'puntos')} en orden</h2>
      <p class="tiny" style="opacity:.85;margin:0 0 8px">${guardada ? `Quedó guardado en tu teléfono (${rondaGuiaPeso(g)}): no gasta datos en cada punto.` : 'Miralo ahora: este teléfono no tiene lugar para guardarlo.'} La meta son ${g.meta || 3} rondas completas.</p>
      ${rondaProximoHTML(g, rondaHechosLocales(g), { inicio:true })}
      ${rondaGuiaHTML(g, { hechos:rondaHechosLocales(g) })}`;
  }).catch(() => { const caja = $('#rondaGuia'); if (caja) caja.innerHTML = `<p class="tiny" style="opacity:.8;margin:12px 0 0">No se pudo bajar el recorrido (sin señal). Volvé a tocar el enlace cuando tengas internet.</p>`; });
}
/* El recorrido guardado en el teléfono del policía, con lo que ya pasó. */
function pintarGuiaPolicia(g, r){
  $('#app').innerHTML = `<section class="bienvenida" id="puntoPublico"><div class="foto" style="background-image:url('${Clima.portada()}')"></div>
    <div class="marca"><span class="logo">${LOGO}</span><div><b style="font-size:16px">Barrio ${esc(Store.s.config.nombre)}</b></div></div>
    <h1 style="font-size:28px">${I('pin')} Tu recorrido</h1>
    <div class="panel">${g ? `<p class="tiny" style="opacity:.85;margin:0 0 8px">${r && r.nombre ? esc(r.nombre) + ' · ' : ''}guardado en este teléfono · meta: ${g.meta || 3} rondas completas</p>${rondaProximoHTML(g, rondaHechosLocales(g))}${rondaGuiaHTML(g, { hechos:rondaHechosLocales(g) })}`
      : `<p style="margin:0">Este teléfono no tiene guardado el recorrido. Tocá el enlace de tu tarjeta (el que te mandó la garita).</p>`}</div></section>`;
}
function pintarPunto(codigo, yaBusco){
  const [idk, nombreUrl] = String(codigo || '').split('/');
  const [id, k] = String(idk || '').split('.');
  const nombre = decodeURIComponent(nombreUrl || '') || 'Punto de control';
  const r = Ronda.leer();
  /* (15-10-2026) Con la guía guardada en el teléfono: la foto del lugar y el próximo punto. */
  let g = typeof RondaGuia !== 'undefined' ? RondaGuia.leer() : null, gps = aLista(g && g.pts), gp = gps.find(x => x.id === id);
  /* (18-10-2026) Sin la guía pero con el código (no abrió el enlace de su
     tarjeta): la baja con el código y vuelve a dibujar con la foto. */
  const bajarGuia = async c => {
    if (g || typeof RondaGuia === 'undefined') return null;
    try { const ng = await Promise.race([RondaGuia.bajar(null, c), new Promise(ok => setTimeout(() => ok(null), 6000))]); if (ng && aLista(ng.pts).length){ RondaGuia.guardar(ng); return ng; } } catch(e){}
    return null;
  };
  if (!g && r && !yaBusco) bajarGuia(r.c).then(ng => { const f = $('#puntoForm'); if (ng && f && !f.hidden && !f.querySelector('button:disabled')) pintarPunto(codigo, true); });
  $('#app').innerHTML = `<section class="bienvenida" id="puntoPublico"><div class="foto" style="background-image:url('${Clima.portada()}')"></div>
    <div class="marca"><span class="logo">${LOGO}</span><div><b style="font-size:16px">Barrio ${esc(Store.s.config.nombre)}</b></div></div>
    <h1 style="font-size:28px">${I('pin')} ${gp ? gp.n + '. ' : ''}${esc(nombre)}</h1>
    <div class="panel">${!id || !k ? `<p style="margin:0"><b>Este QR no es válido.</b> Avisá a la garita.</p>` : `
      ${gp && gp.f ? `<img class="rm-pp-foto" src="${gp.f}" alt="Foto del lugar de este punto">` : ''}
      <form id="puntoForm"><p style="margin:0 0 12px;opacity:.9">Punto de control de la ronda. Registrá tu paso: queda anotado con la hora exacta en la garita.</p>
        ${r ? `<p style="margin:0 0 12px"><b>${esc(r.nombre || 'Policía de ronda')}</b> · código ••${esc(r.c.slice(-2))} <button type="button" class="enlace" id="puntoOtro" style="color:inherit;text-decoration:underline">no soy yo</button></p>`
          : `<div class="field"><label>Código de ronda (6 números)</label><input name="c" required inputmode="numeric" pattern="[0-9]{6}" maxlength="6" autocomplete="one-time-code" placeholder="Te lo da la garita al empezar"></div>`}
        <button class="btn btn-pri btn-block btn-grande">${I('check')}Registrar paso</button>
        <p class="tiny" style="opacity:.75;margin:10px 0 0">Solo cuenta con el código que la garita le da al policía de turno. Tu nombre y la hora del paso los ven solo la garita y la Administración del barrio (Ley 25.326).</p></form>
      <div id="puntoRes"></div>${typeof rondaColaAviso === 'function' ? rondaColaAviso() : ''}`}</div></section>`;
  if (typeof rondaColaVaciar === 'function') setTimeout(rondaColaVaciar, 300);
  $('#puntoOtro')?.addEventListener('click', () => { Ronda.olvidar(); pintarPunto(codigo); });
  const f = $('#puntoForm'); if (!f) return;
  f.addEventListener('submit', async e => {
    e.preventDefault();
    const c = r ? r.c : soloDigitos(f.c.value);
    if (!/^\d{6}$/.test(c)) return;
    const b = f.querySelector('button:not([type="button"])'); b.disabled = true;
    const res = $('#puntoRes');
    try {
      /* 18-10: sin señal, el paso queda guardado en el teléfono y sale solo después (js/ronda-mapa.js). */
      const paso = { id:rondaIdPaso(), punto:id, k, c, nombre:(r && r.nombre) || 'Policía de ronda', t:Date.now() };
      if (RondaCola.leer().length) await RondaCola.mandar();
      let res0 = RondaCola.leer().length ? 'sin' : await rondaEscribirPaso(paso);
      if (res0 === 'no') throw new Error('PERMISSION_DENIED');
      const guardado = res0 === 'sin';
      if (guardado && !RondaCola.sumar(paso)) throw new Error('SIN_LUGAR');
      if (!r) Ronda.guardar(c, '');
      if (!g && !guardado){ g = await bajarGuia(c); gps = aLista(g && g.pts); gp = gps.find(x => x.id === id); }
      /* 17-10: el teléfono anota el punto y muestra solo el próximo, con su foto. */
      const hoy = RondaLocal.anotar(id, g);
      f.hidden = true;
      const fotoAca = $('#puntoPublico .rm-pp-foto'); if (fotoAca) fotoAca.hidden = true;
      const hechos = g ? rondaHechosLocales(g) : [], px = g ? rondaProximo(g, hechos) : null;
      res.innerHTML = `${guardado ? aviso('warn', 'clock', `Guardado en tu teléfono · ${hora(paso.t)} h`, `${gp ? gp.n + '. ' : ''}${esc(nombre)}. Acá no hay señal: el paso queda con esta hora y se manda solo cuando vuelva. Seguí la ronda tranquilo.`)
        : aviso('ok', 'check', `Leído · ${hora(Date.now())} h`, `${gp ? gp.n + '. ' : ''}${esc(nombre)}. Llevás ${plural(hechos.length || hoy.length, 'punto', 'puntos')} en esta ronda.${gps.length ? '' : ' Seguí al próximo.'}`)}
        ${g ? rondaProximoHTML(g, hechos) : ''}${g ? `<button type="button" class="btn btn-sec btn-block" style="margin-top:10px" id="verMiRecorrido">${I('map')}Ver todo mi recorrido</button>` : ''}`;
      rondaVibrar();
      if (px && px.p) setTimeout(() => $('#puntoRes .rm-prox')?.scrollIntoView({ block:'start', behavior:'smooth' }), 120);
      $('#verMiRecorrido')?.addEventListener('click', () => { history.replaceState(null, '', '#/ronda/guia'); pintarGuiaPolicia(g, Ronda.leer()); });
    } catch(err){
      b.disabled = false;
      const permiso = /permission|PERMISSION/i.test(String(err && err.message));
      if (permiso) Ronda.olvidar();
      res.innerHTML = aviso('danger', 'alert', 'No se pudo registrar', permiso ? 'El código de ronda no es válido o venció, o este QR ya no vale. Pedile el código a la garita.' : /SIN_LUGAR/.test(String(err && err.message)) ? 'Tu teléfono no tiene lugar para guardar el paso sin señal. Probá de nuevo donde haya señal.' : 'Revisá la conexión a internet y probá de nuevo.');
      if (permiso && r) setTimeout(() => pintarPunto(codigo), 2500);
    }
  });
}

/* ---------- la Administración: puntos e impresión ---------- */
/* Información fija, de consulta: va plegada y se abre si alguien la
   quiere ver (pedido de Claudio, 27-09). */
function seccionPuntos(){
  const pts = aLista(Store.s.puntos).slice().sort((a, b) => (a.orden || 0) - (b.orden || 0));
  return `<details class="plegable card puntos-plegable" data-k="puntos"><summary><b>${I('qr')} Puntos de control de la ronda (QR)</b><span class="muted small">${pts.length ? plural(pts.filter(x => x.activo !== false).length, 'punto activo', 'puntos activos') : 'sin cargar'} · ver</span></summary>
    ${esAdmin() && pts.length ? `<div style="text-align:right;margin-top:6px"><button class="link" data-a="punto-nuevo">Agregar punto</button></div>` : ''}
    <div style="margin-top:10px">${pts.length ? `<div class="lista">${pts.map(pt => `<div class="it">${pt.foto ? `<img class="rm-th" src="${pt.foto}" alt="">` : `<span class="ic ic-${pt.activo === false ? 'brand' : 'ok'}" style="width:34px;height:34px;border-radius:11px;display:grid;place-items:center;opacity:${pt.activo === false ? .4 : 1}">${I('qr')}</span>`}
        <div class="txt"><b>${pt.orden || ''}. ${esc(pt.nombre)}${pt.activo === false ? ' (apagado)' : ''}</b><span>${esc(pt.lugar || '')}</span></div>
        ${esAdmin() ? `<button class="icon-btn" data-a="punto-editar" data-id="${pt.id}" aria-label="Editar">${I('edit')}</button>` : ''}</div>`).join('')}</div>
      <div class="btns" style="margin-top:10px">${esAdmin() ? `<button class="btn btn-sm btn-pri" data-a="ronda-editar">${I('map')}Marcar el recorrido en el plano</button><button class="btn btn-sm btn-sec" data-a="puntos-imprimir">${I('qr')}Imprimir los QR</button>` : ''}
        ${typeof rondaPuntosMapa === 'function' && rondaPuntosMapa().length > 1 ? `<button class="btn btn-sm btn-sec" data-a="ronda-ver">${I('target')}Ver el recorrido</button>` : ''}</div>
      ${esAdmin() ? `<form data-f="rondas-meta" class="rm-meta"><label>Rondas completas por noche (meta)</label><div><input name="meta" type="number" min="1" max="8" value="${rondaMeta()}" inputmode="numeric"></div>
        <label style="margin-top:6px">Los vecinos ven la ronda</label><div><select name="demora">${[[0, 'En vivo (sin el nombre del policía)'], [5, 'Con 5 minutos de demora'], [10, 'Con 10 minutos de demora'], [15, 'Con 15 minutos de demora']].map(([v, t]) => `<option value="${v}" ${Math.round(rondaDemora() / MIN) === v ? 'selected' : ''}>${t}</option>`).join('')}</select></div>
        <div><button class="btn btn-sm btn-sec">${I('check')}Guardar</button></div></form>` : `<p class="muted small" style="margin:8px 0 0">Meta: ${rondaMeta()} rondas completas por noche.</p>`}
      <p class="muted tiny" style="margin:10px 0 0">Conviene ponerlos donde obliguen a recorrer lo importante (no solo las esquinas): el acceso de servicio, el punto más alejado de la garita, el perímetro que linda con bosque o costa, los espacios comunes y la calle más oscura. A 1,5 m de altura, en un poste (nunca frente a una casa), plastificados y con algo de luz.</p>`
      : `<p class="small" style="margin:0 0 10px">Con puntos de control, el policía escanea un QR en cada punto con su teléfono y la ronda queda anotada sola, con la hora exacta de cada punto.</p>
        ${esAdmin() ? `<button class="btn btn-sm btn-pri" data-a="puntos-crear">${I('plus')}Crear los ${PUNTOS_SUGERIDOS.length} puntos sugeridos</button>` : `<p class="muted small" style="margin:0">Los crea la Administración.</p>`}`}</div></details>`;
}
A['puntos-crear'] = () => { if (aLista(Store.s.puntos).length) return; Store.cambiar(s => { s.puntos = puntosSugeridos(); auditar(s, 'Creó los puntos de control de la ronda', `${s.puntos.length} puntos`); }); toast('Puntos creados. Ahora cambiales el nombre si hace falta e imprimí los QR.', 'qr'); refrescar(); };
A['punto-nuevo'] = () => A['punto-editar']({ dataset:{ id:'' } });
A['punto-editar'] = el => {
  const pt = aLista(Store.s.puntos).find(x => x.id === el.dataset.id) || { nombre:'', lugar:'', orden:aLista(Store.s.puntos).length + 1, activo:true };
  hoja(pt.id ? 'Punto de control' : 'Nuevo punto de control', `<form data-f="punto" data-id="${esc(pt.id || '')}">
    <div class="field"><label>Nombre</label><input name="nombre" required maxlength="40" value="${esc(pt.nombre)}"></div>
    <div class="field"><label>Dónde está (para quien lo busque)</label><input name="lugar" maxlength="80" value="${esc(pt.lugar || '')}"></div>
    <div class="field"><label>Foto del lugar, sin personas ni patentes (liviana: le llega al teléfono del policía)</label><div class="rm-pf">
      <span class="rm-pf-prev">${pt.foto ? `<img src="${pt.foto}" alt="">` : I('camera')}</span>
      <div class="grow"><label class="btn btn-sm btn-sec">${I('camera')}${pt.foto ? 'Cambiar la foto' : 'Sacar o elegir foto'}<input type="file" accept="image/*" data-punto-foto hidden></label>
      ${pt.foto ? `<label class="check" style="margin-top:6px"><input type="checkbox" name="sinFoto"><span>Quitar la foto</span></label>` : ''}</div>
      <input type="hidden" name="fotoDato" value=""><input type="hidden" name="fotoGrande" value=""></div>
      <small class="muted tiny" style="display:block;margin-top:4px">En la app viaja una versión chica (unos 15 KB); la grande se guarda aparte y solo la baja quien toca "Bajar la foto en grande".</small></div>
    <div class="grid2"><div class="field"><label>Orden en la ronda</label><input name="orden" type="number" min="1" max="12" value="${pt.orden || 1}"></div>
      <label class="check" style="align-self:end"><input type="checkbox" name="activo" ${pt.activo !== false ? 'checked' : ''}><span>Activo</span></label></div>
    ${pt.id ? `<label class="check"><input type="checkbox" name="nuevaClave"><span>Cambiar la clave (el QR impreso deja de valer: hay que imprimirlo de nuevo)</span></label>` : ''}
    <button class="btn btn-pri btn-block">${I('check')}Guardar</button>
    ${pt.id ? `<button type="button" class="btn btn-danger-soft btn-block" style="margin-top:8px" data-a="punto-borrar" data-id="${pt.id}">${I('trash')}Borrar el punto</button>` : ''}</form>`);
};
F['punto'] = (d, form) => {
  const id = form.dataset.id;
  if (!id && aLista(Store.s.puntos).length >= 12) return toast('Hasta 12 puntos', 'qr');
  Store.cambiar(s => {
    let pt = s.puntos.find(x => x.id === id);
    if (!pt){ pt = { id:'pt' + claveAzar().slice(0, 6), k:claveAzar(), at:Date.now() }; s.puntos.push(pt); }
    Object.assign(pt, { nombre:d.nombre.trim(), lugar:(d.lugar || '').trim(), orden:Math.min(12, Math.max(1, +d.orden || 1)), activo:!!d.activo });
    if (d.nuevaClave) pt.k = claveAzar();
    /* 17-10: la chica va con el punto; la grande, aparte y a pedido (js/ronda-mapa.js). */
    const fgViejo = pt.fg;
    if (d.fotoDato && /^data:image\//.test(d.fotoDato)){ pt.foto = d.fotoDato; if (/^data:image\//.test(d.fotoGrande || '')) pt.fg = rondaGrandeGuardar(d.fotoGrande); else delete pt.fg; }
    else if (d.sinFoto){ delete pt.foto; delete pt.fg; }
    if (fgViejo && fgViejo !== pt.fg) rondaGrandeBorrar(fgViejo);
    auditar(s, id ? 'Editó un punto de control' : 'Agregó un punto de control', pt.nombre + (d.nuevaClave ? ' (clave nueva)' : ''));
  });
  cerrarHoja(); toast(d.nuevaClave ? 'Guardado. Imprimí de nuevo el QR de ese punto.' : 'Guardado', 'check'); refrescar();
  if (typeof rondaGuiasAlDia === 'function') rondaGuiasAlDia();
};
/* La foto del punto: se achica en el teléfono antes de guardarla (js/ronda-mapa.js). */
document.addEventListener('change', async e => {
  const inp = e.target; if (!inp || inp.dataset.puntoFoto === undefined) return;
  const f = inp.files && inp.files[0], form = inp.closest('form'); if (!f || !form) return;
  try { const { chica:dato, grande } = await rondaFotoDoble(f); form.fotoDato.value = dato; form.fotoGrande.value = grande; const pv = form.querySelector('.rm-pf-prev'); if (pv) pv.innerHTML = `<img src="${dato}" alt="">`; toast(`Foto lista (${pesoTexto(Math.round(dato.length * 0.75))})`, 'camera'); }
  catch(err){ toast('No se pudo usar esa foto', 'alert'); }
});
A['punto-borrar'] = async el => {
  if (aLista(Store.s.puntos).length <= 2) return toast('Tienen que quedar al menos dos puntos', 'qr');
  if (!await confirmar('Borrar el punto', 'Su QR deja de valer. Los pasos ya registrados quedan en la historia.', { si:'Borrar', peligro:true })) return;
  let fg = '';
  Store.cambiar(s => { const pt = s.puntos.find(x => x.id === el.dataset.id); fg = pt?.fg || ''; s.puntos = s.puntos.filter(x => x.id !== el.dataset.id); auditar(s, 'Borró un punto de control', pt?.nombre || ''); });
  if (fg && typeof rondaGrandeBorrar === 'function') rondaGrandeBorrar(fg);
  cerrarHoja(); refrescar();
};
const enlacePunto = pt => location.origin + location.pathname.replace(/[^/]*$/, '') + (typeof Nube !== 'undefined' && Nube.activa() ? '' : '?local') + `#/punto/${pt.id}.${pt.k}/${encodeURIComponent(pt.nombre)}`;
A['puntos-imprimir'] = async () => {
  const q = await cargarQR();
  if (!q) return toast('Hace falta internet para dibujar los QR', 'alert');
  const svg = t => { const qr = q(0, 'M'); qr.addData(t); qr.make(); return qr.createSvgTag({ cellSize:6, margin:2, scalable:true }); };
  imprimir('Puntos de control de la ronda', `<style>.pq{page-break-inside:avoid;border:2px solid #0b3c47;border-radius:16px;padding:18px;margin:0 0 18px;text-align:center}.pq svg{width:62mm;height:62mm}.pq h2{margin:4px 0}.pq p{margin:4px 0}</style>
    ${puntosActivos().map(pt => `<div class="pq"><p style="letter-spacing:.1em;text-transform:uppercase;font-size:11px">Barrio ${esc(Store.s.config.nombre)} · Punto de control ${pt.orden || ''}</p>
      <h2>${esc(pt.nombre)}</h2>${svg(enlacePunto(pt))}
      <p><b>Ronda: escaneá este código con la cámara de tu teléfono</b> y tocá "Registrar paso".</p>
      <p style="font-size:11px;color:#555">${esc(pt.lugar || '')} · Si lo ves dañado o arrancado, avisá a la garita.</p></div>`).join('')}`);
};

/* Ingreso y salida del policía: DÍA, TURNO de la garita y HORA, en ese
   orden (pedido de Claudio, 27-09). El turno es el de la garita en que
   entró o salió (puede no ser el que está abierto si se anota tarde). */
const momentoDe = (dia, hhmm) => { const d = /^\d{4}-\d{2}-\d{2}$/.test(dia || '') ? fechaDe(dia) : new Date(); const [h, m] = String(hhmm || '').split(':').map(Number); if (isNaN(h)) return Date.now(); d.setHours(h, m || 0, 0, 0); return d.getTime(); };
/* (13-10-2026) El turno de la garita ya no se elige: la policía nocturna
   tiene su propio horario y el turno de la garita se anota solo por la hora
   (turnoGaritaEn, js/guardia.js). */
const correoValido = e => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
/* INGRESO DE LA POLICÍA NOCTURNA, RÁPIDO (rediseño, pedido de Claudio,
   13-10-2026): arriba su horario (que no es el de la garita), los que ya
   vinieron como fichitas que completan todo de un toque, y la hora en
   "Ahora" (o "Otra hora" si se anota tarde). Al registrar, sale su tarjeta
   para mandarle por WhatsApp (js/guardia.js). */
A['policia-nuevo'] = () => {
  const t = turnoAbierto(); if (!t) return toast('Primero tiene que haber un turno abierto', 'clock');
  pnConocidos = [...policiasConocidos().values()].reverse().slice(0, 8);
  hoja('Llegó la policía nocturna', `<form data-f="policia-nuevo" class="pn-form">
    ${cabNoche()}
    ${pnConocidos.length ? `<div class="pn-lbl">¿Quién llega? Si ya vino, tocalo y se completa todo</div>
      <div class="pn-conocidos">${pnConocidos.map((p, i) => `<button type="button" class="pn-c" data-a="pn-elegir" data-i="${i}" style="--c:${colorDe(p.nombre)}"><span class="pn-ini">${esc(inicialesDe(p.nombre))}</span><b>${esc(p.nombre)}</b><small>${esc(pnCargoMat(p)) || 'Sin cargo ni matrícula'}</small></button>`).join('')}</div>` : ''}
    <div class="pn-datos">
      <div class="field"><label>Nombre y apellido</label><input name="nombre" required maxlength="60" autocomplete="off" placeholder="Nombre y apellido" pattern=".*\\S+\\s+\\S+.*" title="Nombre y apellido completos"></div>
      <div class="grid2">${campoCargoPolicia()}<div class="field"><label>Matrícula / legajo</label><input name="matricula" maxlength="20" autocomplete="off"></div></div>
      <div class="grid2"><div class="field"><label>Celular (para su tarjeta)</label><input name="tel" type="tel" inputmode="tel" maxlength="20" autocomplete="off" placeholder="2901 15 123456"></div>
        <div class="field"><label>Correo (para su constancia)</label><input name="email" type="email" inputmode="email" maxlength="80" autocomplete="off" value="${esc(correoSupervisionPolicia())}" title="Si el policía no deja el suyo, la constancia va a la supervisión de la policía"></div></div></div>
    ${elegirCuando('Hora de ingreso', 'entra')}
    <button class="btn btn-pri btn-block btn-grande">${I('shield')}Registrar el ingreso y armar su tarjeta</button>
    <p class="muted tiny" style="margin:8px 0 0">Su tarjeta lleva el <b>código de ronda</b> de esta noche y un QR: sin eso, los QR de los puntos no registran nada (un vecino que escanee un punto no puede hacer pasar una ronda). Al irse, le llega por correo la constancia de su servicio.</p></form>`);
};
F['policia-nuevo'] = d => {
  const t = turnoAbierto(); if (!t) return;
  const k = claveNombre(d.nombre); if (!k) return toast('Falta el nombre', 'users');
  /* (21-10-2026) Con una sola palabra ("Rojo") la constancia salía así: ahora pide nombre y apellido. */
  if (k.split(' ').length < 2) return toast('Escribí nombre y apellido del policía (no solo el apellido)', 'users');
  const entra = d.cuando === 'otra' ? momentoDe(d.dia, d.entra) : Date.now();
  if (entra > Date.now() + 10 * MIN) return toast('El ingreso no puede ser más tarde que ahora: revisá el día y la hora', 'clock');
  if (Date.now() - entra > DIA) return toast('Revisá el día: el ingreso da más de 24 horas atrás', 'clock');
  /* (22-10-2026) Si no deja su correo, la constancia va a la supervisión de la policía. */
  const email = String(d.email || '').trim().toLowerCase();
  if (email && !correoValido(email)) return toast('Revisá el correo del policía', 'mail');
  const ya = policiasConocidos().get(k) || (typeof fichaDe === 'function' && fichaDe(k)) || {};
  const cargo = cargoDelForm(d) || ya.cargo || '';
  if (!cargo) return toast('Falta el cargo del policía (agente, cabo, sargento…)', 'shield');
  const p = { id:uid(), nombre: ya.nombre || conMayusculas(d.nombre), cargo, matricula: String(d.matricula || '').trim() || ya.matricula || '', tel: String(d.tel || '').trim() || ya.tel || '',
    email: (email && email !== correoSupervisionPolicia() ? email : ya.email || email) || correoSupervisionPolicia(), entra, turnoEntra: turnoGaritaEn(entra), rondas:[] };
  if (policiasAdentro(t).some(q => claveNombre(q.nombre) === k)) return toast('Ese policía ya está anotado en este turno', 'users');
  p.codigo = codigoRondaNuevo();
  /* La guía de la ronda (puntos, lugar y fotos chicas) para su teléfono: js/ronda-mapa.js. */
  const guiaNueva = typeof rondaToken === 'function' ? rondaToken() : '';
  if (guiaNueva) rondaGuiaPublicar(guiaNueva, Date.now() + CODIGO_VIGENCIA, p.codigo);
  Store.cambiar(s => {
    const x = aLista(s.bitacora).find(b => b.id === t.id); if (!x) return;
    x.policias = [...policiasDe(x), p];
    /* Si estaba en la ficha como "Ya no viene", vuelve a venir (22-10-2026). */
    aLista(s.policiasFicha).forEach(f => { if (f && f.noViene && (f.k === k || claveNombre(f.nombre) === k)){ f.noViene = false; f.at = Date.now(); } });
    s.rondaCodigos = [...aLista(s.rondaCodigos).filter(c => c && c.vence > Date.now()), { id:p.codigo, pid:p.id, nombre:p.nombre, vence:Date.now() + CODIGO_VIGENCIA, g:guiaNueva }];
    s.bitacora.unshift({ id:uid(), autor:yo().id, tipo:'acceso', texto:`Ingreso del policía ${p.nombre}${pnParen(p)} · ${fechaCorta(isoDe(new Date(entra)))} · turno ${p.turnoEntra} · ${hora(p.entra)} h.`, at:Date.now() });
  });
  cerrarHoja(); toast(`Ingreso de ${p.nombre} anotado`, 'shield'); refrescar();
  mostrarCodigoRonda(p.id);
};

/* =========================================================
   CÓDIGO DE RONDA: que el paso lo registre EL POLICÍA y no cualquiera
   Una página web no puede saber el número del teléfono que la abre (ni en
   Android ni en iPhone). Por eso, al registrar el ingreso, la app le da al
   policía un código de 6 números solo para él y solo por esa noche, y la
   garita se lo manda por WhatsApp a su celular con un enlace que deja el
   teléfono habilitado. Cada escaneo lleva el código, y LA BASE rechaza los
   pasos sin un código vigente (staff/rondaCodigos/<código>, que solo leen la
   garita y la Administración): un vecino que escanee un QR no registra nada.
   Vence a las 14 h y se borra con la salida del policía.
   ========================================================= */
const CODIGO_VIGENCIA = 14 * HORA;
function codigoRondaNuevo(){
  const usados = new Set(aLista(Store.s.rondaCodigos).map(c => c && c.id));
  let c; do { const a = new Uint32Array(1); crypto.getRandomValues(a); c = String(100000 + a[0] % 900000); } while (usados.has(c));
  return c;
}
const codigoVigente = pid => aLista(Store.s.rondaCodigos).find(c => c && c.pid === pid && c.vence > Date.now()) || null;
const bajarCodigo = (s, pid) => {
  /* Con el código se borra de la base la guía de su teléfono (la que ya bajó queda en su teléfono hasta que vence). */
  aLista(s.rondaCodigos).filter(c => c && c.pid === pid).forEach(c => { if (typeof rondaGuiaBorrar === 'function') setTimeout(() => rondaGuiaBorrar(c.g, c.id), 0); });
  s.rondaCodigos = aLista(s.rondaCodigos).filter(c => c && c.pid !== pid);
};
const enlaceRonda = (codigo, nombre) => { const c = aLista(Store.s.rondaCodigos).find(x => x && x.id === codigo);
  return location.origin + location.pathname.replace(/[^/]*$/, '') + (typeof Nube !== 'undefined' && Nube.activa() ? '' : '?local') + `#/ronda/${codigo}/${encodeURIComponent(nombre)}${c && c.g ? '/' + c.g : ''}`; };
function textoCodigoRonda(p, c){
  return `${p.nombre}: tu código de ronda de hoy en el Barrio ${Store.s.config.nombre} es ${c.id}.\n\nTocá este enlace para dejar tu teléfono listo: ${enlaceRonda(c.id, p.nombre)}\n\nEn cada punto de control escaneá el QR con la cámara y tocá "Registrar paso". Si te pide el código, es ${c.id}. Vence mañana a las ${hora(c.vence)} h.`;
}
/* La tarjeta del policía (13-10-2026): sus datos, la noche de servicio, el
   código y un QR que deja su teléfono listo. Se comparte como imagen por
   WhatsApp, o se la muestra para que la escanee ahí mismo. */
function mostrarCodigoRonda(pid){
  const t = turnoAbierto(), p = t && policiasDe(t).find(x => x.id === pid), c = codigoVigente(pid);
  if (!p || !c) return;
  const wa = p.tel && typeof waNumeroAR === 'function' ? waNumeroAR(p.tel) : '';
  hoja('Tarjeta del policía', `${tarjetaPoliciaHtml(p, c)}
    <button class="btn btn-wa btn-block btn-grande" style="margin-top:12px" data-a="pn-compartir" data-id="${esc(p.id)}">${I('share')}Mandarle la tarjeta por WhatsApp</button>
    <div class="btns" style="margin-top:8px">${wa ? `<a class="btn btn-sec grow" href="https://wa.me/${wa}?text=${encodeURIComponent(textoCodigoRonda(p, c))}" target="_blank" rel="noopener">${I('send')}Solo el mensaje</a>` : ''}
      <button class="btn btn-sec grow" data-a="copiar" data-v="${esc(textoCodigoRonda(p, c))}">${I('copy')}Copiar el mensaje</button></div>
    <p class="muted tiny" style="margin:10px 0 0">${wa ? '' : 'No se anotó su celular: que escanee el QR de la tarjeta con su cámara, o mandale la imagen. '}Con la tarjeta, su teléfono queda listo para leer los QR de su recorrido: en cada punto escanea y toca "Registrar paso". El código vence solo y se borra con su salida; si hace falta otro, "Código nuevo".</p>`);
  const q = document.querySelector('#hoja .pn-t-qr'); if (q) pintarQR(q, q.dataset.qrRonda);
}
A['policia-codigo'] = el => mostrarCodigoRonda(el.dataset.id);
/* Para el policía que se anotó antes de que existiera el cargo (15-10-2026). */
A['policia-cargo'] = el => {
  const t = turnoAbierto(), p = t && policiasDe(t).find(x => x.id === el.dataset.id); if (!p) return;
  hoja(`Cargo de ${p.nombre}`, `<form data-f="policia-cargo"><input type="hidden" name="pid" value="${esc(p.id)}">${campoCargoPolicia(p.cargo || '')}
    <button class="btn btn-pri btn-block">${I('check')}Guardar</button></form>`);
};
F['policia-cargo'] = d => {
  const cargo = cargoDelForm(d); if (!cargo) return toast('Elegí el cargo', 'shield');
  cambiarPolicia(d.pid, p => { p.cargo = cargo; }, p => `Se anotó el cargo del policía ${p.nombre}: ${cargo}.`);
  cerrarHoja(); toast('Cargo guardado', 'check');
};
A['policia-codigo-nuevo'] = async el => {
  if (codigoVigente(el.dataset.id) && !await confirmar('Código nuevo', 'El código anterior deja de valer al instante. Hay que mandarle el nuevo al policía.', { si:'Generar otro' })) return;
  const t = turnoAbierto(), p = t && policiasDe(t).find(x => x.id === el.dataset.id); if (!p) return;
  const c = codigoRondaNuevo(), g = typeof rondaToken === 'function' ? rondaToken() : '';
  if (g) rondaGuiaPublicar(g, Date.now() + CODIGO_VIGENCIA, c);
  Store.cambiar(s => { bajarCodigo(s, p.id); s.rondaCodigos.push({ id:c, pid:p.id, nombre:p.nombre, vence:Date.now() + CODIGO_VIGENCIA, ...(g ? { g } : {}) });
    s.bitacora.unshift({ id:uid(), autor:yo().id, tipo:'acceso', texto:`Se cambió el código de ronda del policía ${p.nombre}.`, at:Date.now() }); });
  mostrarCodigoRonda(p.id);
};
/* (21-10-2026) Con los QR puestos, las rondas las abre EL POLICÍA al leer el
   primer punto: la garita ya no puede "sacarlo a una ronda" (pregunta de
   Claudio: "¿la garita tiene la potestad de generar rondas?"). Solo puede
   dar por terminada la que está en curso y, si el QR falló, anotar una a
   mano con el motivo: esa queda gris y no cuenta para la meta. */
const conPuntosQR = () => puntosActivos().length >= 2;
A['policia-ronda'] = el => {
  const pid = el.dataset.id, ahora = Date.now();
  { const t = turnoAbierto(), p0 = t && policiasDe(t).find(x => x.id === pid); if (conPuntosQR() && p0 && !rondaEnCurso(p0)) return toast('Las rondas se abren solas cuando el policía lee el primer QR', 'qr'); }
  let fin = null;
  let incompleta = false;
  cambiarPolicia(pid, (p, x, s) => {
    const rc = rondaEnCurso(p);
    if (!rc){ p.rondas.push({ id:uid(), inicio:ahora }); return; }
    rc.fin = ahora; fin = rc;
    /* Si escaneó QR y le faltaron puntos, queda INCOMPLETA en la bitácora. */
    if (conQR(rc)) incompleta = cerrarRondaIncompleta(s, p, rc, ahora, 'la garita la dio por terminada');
  }, p => incompleta ? null : fin ? `Ronda ${p.rondas.indexOf(fin) + 1} del policía ${p.nombre}: ${hora(fin.inicio)} a ${hora(fin.fin)} h (${minutos(fin.inicio, fin.fin)} min)${conQR(fin) ? ` · QR ${estadoRonda(fin).n}/${estadoRonda(fin).total} puntos` : ''}.` : `El policía ${p.nombre} sale a la ronda ${p.rondas.length} · ${hora(ahora)} h.`);
  toast(fin ? (incompleta ? 'Ronda cerrada como incompleta' : 'Ronda terminada') : 'Ronda en marcha', 'shield');
};
A['policia-ronda-mano'] = el => hoja('Anotar una ronda', `<form data-f="policia-ronda-mano"><input type="hidden" name="pid" value="${esc(el.dataset.id)}">
  <div class="grid2"><div class="field"><label>Salió</label><input name="desde" type="time" required value="${horaInput(Date.now() - RONDA_MIN * MIN)}"></div>
    <div class="field"><label>Volvió</label><input name="hasta" type="time" required value="${horaInput(Date.now())}"></div></div>
  ${conPuntosQR() ? `<div class="field"><label>¿Por qué no quedó con los QR?</label><select name="motivo" required><option value="">Elegí el motivo</option>${['Un QR estaba roto o no se podía leer', 'El policía se quedó sin batería o sin señal', 'Recorrió el barrio en el auto', 'Otro motivo'].map(x => `<option>${x}</option>`).join('')}</select></div>` : ''}
  <div class="ayuda" style="margin-bottom:12px">Para las rondas que no se anotaron en el momento. Una ronda caminando lleva unos ${RONDA_MIN} minutos.${conPuntosQR() ? ' Queda como <b>anotada por la garita</b>, con tu nombre y el motivo, y <b>no cuenta para la meta</b> de rondas completas.' : ''}</div>
  <button class="btn btn-pri btn-block">${I('check')}Anotar la ronda</button></form>`);
F['policia-ronda-mano'] = d => {
  const inicio = horaPasada(d.desde); let fin = horaPasada(d.hasta);
  if (fin < inicio) fin += DIA;
  if (fin - inicio > 4 * HORA) return toast('Revisá las horas: la ronda da más de 4 horas', 'clock');
  if (conPuntosQR() && !d.motivo) return toast('Elegí el motivo', 'edit');
  const motivo = String(d.motivo || '').slice(0, 60), por = (yo() && yo().nombre) || '';
  cambiarPolicia(d.pid, p => { p.rondas.push({ id:uid(), inicio, fin, aMano:true, ...(motivo ? { motivo } : {}), ...(por ? { por } : {}) }); p.rondas.sort((a, b) => a.inicio - b.inicio); },
    p => `Ronda del policía ${p.nombre} (anotada a mano por ${por || 'la garita'}${motivo ? ': ' + motivo.charAt(0).toLowerCase() + motivo.slice(1) : ''}): ${hora(inicio)} a ${hora(fin)} h (${minutos(inicio, fin)} min). No cuenta para la meta.`);
  cerrarHoja(); toast('Ronda anotada', 'check');
};
A['policia-ronda-borrar'] = async el => {
  if (!await confirmar('Borrar la ronda', 'Queda anotado en la bitácora que se borró.', { si:'Borrar' })) return;
  cambiarPolicia(el.dataset.id, p => { p.rondas = p.rondas.filter(r => r.id !== el.dataset.v); }, p => `Se borró una ronda del policía ${p.nombre}.`);
};
/* SALIDA EN UN TOQUE (13-10-2026): el resumen de su noche y "Ahora". */
A['policia-salida'] = el => {
  const t = turnoAbierto(), p = t && policiasDe(t).find(x => x.id === el.dataset.id); if (!p) return;
  const h = (Date.now() - p.entra) / HORA, inc = p.rondas.filter(r => r.incompleta).length, rc = rondaEnCurso(p);
  hoja('Se va la policía nocturna', `<form data-f="policia-salida" class="pn-form"><input type="hidden" name="pid" value="${esc(p.id)}">
    <div class="pn-resumen"><span class="pn-ini lg" style="--c:${colorDe(p.nombre)}">${esc(inicialesDe(p.nombre))}</span>
      <div class="grow"><b>${esc(p.nombre)}</b><small>${esc(pnCargoMat(p, ' · '))}ingresó ${isoDe(new Date(p.entra)) !== hoyISO() ? fechaCorta(isoDe(new Date(p.entra))) + ' ' : ''}${hora(p.entra)} h</small></div>
      <span class="pn-horas"><b>${h >= 1 ? Math.floor(h) + ' h ' : ''}${Math.round(h % 1 * 60)}</b><small>min de servicio</small></span></div>
    <div class="pn-chips"><span class="c-ok">${I('pin')}${plural(p.rondas.length, 'ronda')}</span>${inc ? `<span class="c-danger">${I('alert')}${plural(inc, 'incompleta', 'incompletas')}</span>` : ''}${rc ? `<span class="c-warn">${I('clock')}una en curso: se cierra</span>` : ''}</div>
    ${barraNoche(nochePolicia(p.entra))}
    ${elegirCuando('Hora de salida', 'sale', p.entra)}
    ${p.email ? '' : `<div class="field"><label>Correo del policía (para mandarle la constancia)</label><input name="email" type="email" inputmode="email" maxlength="80" autocomplete="off" placeholder="Opcional"></div>`}
    <button class="btn btn-pri btn-block btn-grande">${I('logout')}Registrar la salida</button>
    <p class="muted tiny" style="margin:8px 0 0">Su servicio se cierra: deja de verse en la portada y queda en <b>Turnos → Servicios del policía</b>. ${p.email ? `La constancia sale por correo a <b>${esc(p.email)}</b>.` : 'Si dejás su correo, le sale la constancia.'}</p></form>`);
};
F['policia-salida'] = d => {
  const t = turnoAbierto(), p0 = t && policiasDe(t).find(x => x.id === d.pid); if (!p0) return;
  const sale = d.cuando === 'otra' ? momentoDe(d.dia, d.sale) : Date.now();
  if (sale > Date.now() + 10 * MIN) return toast('La salida no puede ser más tarde que ahora: revisá el día y la hora', 'clock');
  if (sale < p0.entra) return toast(`La salida no puede ser antes del ingreso (${fechaCorta(isoDe(new Date(p0.entra)))} ${hora(p0.entra)} h)`, 'clock');
  const email = String(d.email || '').trim().toLowerCase();
  if (email && !correoValido(email)) return toast('Revisá el correo del policía', 'mail');
  const turnoSale = turnoGaritaEn(sale);
  Store.cambiar(s => bajarCodigo(s, d.pid));
  cambiarPolicia(d.pid, (p, x, s) => { const rc = rondaEnCurso(p); if (rc) cerrarRondaIncompleta(s, p, rc, Math.max(rc.inicio + MIN, sale), 'el policía se retiró en plena ronda');
      p.sale = Math.max(sale, p.entra + MIN); p.turnoSale = turnoSale; if (email && !p.email) p.email = email; cerrarServicio(s, p); },
    p => `Salida del policía ${p.nombre}${pnParen(p)} · ${fechaCorta(isoDe(new Date(p.sale)))} · turno ${turnoSale} · ${hora(p.sale)} h · ${plural(p.rondas.length, 'ronda')} en el servicio.`);
  cerrarHoja(); toast('Salida anotada. El servicio quedó en Turnos.', 'check');
  mandarConstanciaPolicia(d.pid);
  /* El sábado, la salida del policía del viernes manda sola el informe semanal a la supervisión (js/informe-policia.js). */
  if (typeof InformePolicia !== 'undefined') InformePolicia.alSalir(d.pid);
};

/* =========================================================
   EL SERVICIO COMPLETO DE CADA POLICÍA (pedido de Claudio, 27-09)
   Un servicio puede cruzar dos turnos de la garita (entra de tarde y
   sigue de noche): se junta todo por el id del policía. Al registrarse la
   salida se guarda una FOTO del servicio en su registro (p.servicio):
   rondas con la hora de cada QR, guardias con los que estuvo y lo que
   anotó la garita. Así el histórico no depende de que sigan en la base
   los pasos de ronda ni la bitácora de esas horas.
   ========================================================= */
function serviciosPolicia(registros = registrosTurno(), lineas = aLista(Store.s.bitacora)){
  const m = new Map(), regs = registros.filter(r => r && r.tipo === 'turno' && r.abre).sort((a, b) => a.at - b.at);
  regs.forEach(r => policiasDe(r).forEach(p => {
    const sv = m.get(p.id) || { id:p.id, nombre:p.nombre, cargo:'', matricula:'', tel:'', email:'', entra:p.entra, turnoEntra:p.turnoEntra || r.turno, sale:0, turnoSale:'', rondas:[], registros:[] };
    ['cargo', 'matricula', 'tel', 'email'].forEach(k => { if (p[k]) sv[k] = p[k]; });
    p.rondas.forEach(x => { const i = sv.rondas.findIndex(y => y.id === x.id); if (i < 0) sv.rondas.push(x); else sv.rondas[i] = x; });
    sv.registros.push(r.id);
    if (p.sale){ sv.sale = p.sale; sv.turnoSale = p.turnoSale || r.turno; sv.registroSale = r.id; sv.foto = p.servicio || null; sv.constancia = p.constancia || null; }
    m.set(p.id, sv);
  }));
  return [...m.values()].map(sv => {
    /* Firebase no guarda las listas vacías: se rearman al leer. */
    if (sv.foto) return { ...sv, ...sv.foto, rondas: aLista(sv.foto.rondas).filter(Boolean).map(r => ({ ...r, qr:aLista(r.qr), faltan:aLista(r.faltan) })), guardias: aLista(sv.foto.guardias), acciones: aLista(sv.foto.acciones).filter(Boolean) };
    const fin = sv.sale || Date.now();
    /* La salida se anota al minuto (16:27) y el turno se abre con segundos
       (16:27:50): el turno abierto en el mismo minuto de la salida también
       cuenta (12-10-2026; si no, la constancia salía sin los guardias). */
    const guardias = [...new Set(regs.filter(r => r.at < fin + MIN && (!r.cerradoAt || r.cerradoAt >= sv.entra)).flatMap(r => aLista(r.guardias)))];
    const rondas = sv.rondas.sort((a, b) => a.inicio - b.inicio).map(fotoRonda);
    const acciones = lineas.filter(b => b && b.at >= sv.entra - MIN && b.at <= fin + 5 * MIN && b.tipo !== 'turno' && (b.texto || '').includes(sv.nombre)).sort((a, b) => a.at - b.at).map(b => ({ at:b.at, texto:b.texto }));
    return { ...sv, guardias, rondas, acciones };
  }).sort((a, b) => b.entra - a.entra);
}
/* Una ronda con sus QR "congelados": nombre del punto y hora. */
function fotoRonda(r){
  if (r.qrFoto) return r;
  const pasos = pasosDeRonda(r), vistos = new Set(), qr = [];
  pasos.forEach(x => { if (!vistos.has(x.punto)){ vistos.add(x.punto); qr.push({ n:nombrePunto(x.punto), at:pasoAt(x) }); } });
  const e = conQR(r) ? estadoRonda(r) : null;
  return { id:r.id, inicio:r.inicio, fin:r.fin || 0, incompleta:!!r.incompleta, aMano:!!r.aMano, conQR:conQR(r), qr, total: e ? e.total : 0, faltan: e ? e.faltan : [], ...(r.motivo ? { motivo:r.motivo } : {}), ...(r.por ? { por:r.por } : {}), qrFoto:true };
}
/* Guarda la foto del servicio en el registro donde salió el policía. */
function cerrarServicio(s, p){
  const regs = aLista(s.bitacora).filter(b => b && b.tipo === 'turno' && b.abre);
  const sv = serviciosPolicia(regs, aLista(s.bitacora)).find(x => x.id === p.id); if (!sv) return;
  p.servicio = { guardias:sv.guardias, rondas:sv.rondas.map(fotoRonda), acciones:sv.acciones.slice(-60), turnoEntra:sv.turnoEntra, entra:sv.entra, sale:p.sale, turnoSale:p.turnoSale || '' };
}
const estadoRondaTxt = r => r.incompleta ? `INCOMPLETA${r.conQR && r.total ? ` · ${r.qr.length}/${r.total} QR · faltó ${r.faltan.join(', ')}` : ''}`
  : r.conQR && r.total ? `completa · ${r.qr.length}/${r.total} QR` : r.aMano ? 'anotada a mano' : r.fin ? 'sin QR (la anotó la garita)' : 'en curso';
/* =========================================================
   LA CONSTANCIA DEL POLICÍA EN PDF (pedido de Claudio, 18-10-2026)
   "No me gusta como queda escrito en el mail, todo monótono y no se
   entiende bien: que sea un archivo PDF con la portada del barrio, el
   nombre del policía, cargo, matrícula, fecha y horarios, todo detallado y
   encuadrado, con diseño innovador y atractivo, que cada ronda tenga un
   encuadre diferente y de fácil atención a la vista, y al final un saludo
   y agradecimiento por su labor."
   · El correo es corto y amable; la constancia completa va ADJUNTA en PDF
     (el Apps Script, versión 14, convierte la página a PDF: el mismo camino
     que el parte de mantenimiento).
   · Tablas y estilos escritos en cada elemento: así lo entiende el
     conversor a PDF de Google. La portada y el logo van dentro del archivo
     (como imagen achicada), no se piden a internet.
   · La garita la ve igual que el policía en Turnos → "Ver la constancia".
   ========================================================= */
const CP_COLORES = [['#0d9488', '#e7f6f4', 'Verde agua'], ['#7c3aed', '#f2ecfe', 'Violeta'], ['#d97706', '#fdf3e2', 'Ámbar'], ['#2563eb', '#e9f0fd', 'Azul'], ['#e11d48', '#fdebef', 'Rosa'], ['#15803d', '#e8f6ec', 'Verde']];
const CP_ORD = ['Primera', 'Segunda', 'Tercera', 'Cuarta', 'Quinta', 'Sexta', 'Séptima', 'Octava', 'Novena', 'Décima'];
const CP_MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const cpDur = ms => { const m = Math.max(0, Math.round(ms / MIN)); return m >= 60 ? `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')} min` : `${m} min`; };
const cpDia = ts => { const d = new Date(ts); return `${DIAS_L[d.getDay()]} ${d.getDate()}`; };
/* "Noche del sábado 17 al domingo 18 de octubre de 2026" */
function cpNoche(entra, sale){
  const a = new Date(entra), b = new Date(sale || entra), mes = d => `${CP_MESES[d.getMonth()]} de ${d.getFullYear()}`;
  if (isoDe(a) === isoDe(b)) return `${DIAS_L[a.getDay()].replace(/^./, c => c.toUpperCase())} ${a.getDate()} de ${mes(a)}`;
  return `Noche del ${cpDia(entra)}${a.getMonth() !== b.getMonth() ? ' de ' + CP_MESES[a.getMonth()] : ''} al ${cpDia(sale)} de ${mes(b)}`;
}
/* Una imagen de la app achicada y dentro del archivo (para el PDF). */
const cpCache = {};
/* `alto` (proporción alto/ancho): recorta al medio, como un banner. */
function cpImagen(src, ancho, tipo = 'image/jpeg', q = .8, alto = 0){
  const k = src + '|' + ancho + '|' + alto;
  if (cpCache[k]) return cpCache[k];
  return (cpCache[k] = new Promise(ok => {
    try {
      const img = new Image();
      img.onload = () => { try {
        const W = img.naturalWidth, H = img.naturalHeight, sh = alto ? Math.min(H, Math.round(W * alto)) : H, sy = Math.round((H - sh) * .55);
        const w = Math.min(ancho, W), h = Math.round(sh * w / W), c = document.createElement('canvas'); c.width = w; c.height = h;
        c.getContext('2d').drawImage(img, 0, sy, W, sh, 0, 0, w, h); ok(c.toDataURL(tipo, q)); } catch(e){ ok(''); } };
      img.onerror = () => ok('');
      img.src = src;
    } catch(e){ ok(''); }
  }));
}
const constanciaImgs = async () => ({ portada: await cpImagen('img/portada-noche.jpg', 1100, 'image/jpeg', .8, .42), logo: await cpImagen('icons/logo.png', 140, 'image/png') });

function constanciaPdfHtml(sv, im = {}){
  const c = Store.s.config, barrio = esc(c.nombre), fin = sv.sale || Date.now(), total = Math.max(MIN, fin - sv.entra);
  const meta = typeof rondaMeta === 'function' ? rondaMeta() : 3;
  const completas = sv.rondas.filter(r => !r.incompleta && r.conQR && r.total && r.qr.length >= r.total).length;
  const pila = esc(String(sv.nombre || '').trim().split(/\s+/)[0] || sv.nombre);
  const nro = String(sv.id || '').replace(/[^\w]/g, '').slice(-6).toUpperCase();
  const tit = t => `<div style="font-size:10.5px;font-weight:800;letter-spacing:.16em;text-transform:uppercase;color:#0b1f3a;margin:18px 0 8px">${t}</div>`;
  const kpi = (arriba, n, abajo, color) => `<td width="25%" style="padding:0 4px"><div style="border:1.5px solid ${color};border-radius:14px;padding:10px 12px;background:#fff">
      <div style="font-size:9.5px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:${color}">${arriba}</div>
      <div style="font-size:21px;font-weight:800;color:#0b1f3a;line-height:1.2;margin-top:2px">${n}</div><div style="font-size:10.5px;color:#5b6b80">${abajo}</div></div></td>`;

  /* La noche de un vistazo: una barra del ingreso a la salida con cada ronda en su color. */
  const tramos = []; let cursor = sv.entra;
  sv.rondas.slice().sort((a, b) => a.inicio - b.inicio).forEach((r, i) => {
    const ini = Math.max(sv.entra, r.inicio), f = Math.min(fin, r.fin || fin);
    if (ini > cursor) tramos.push({ w:ini - cursor });
    tramos.push({ w:Math.max(f - ini, total * .03), i }); cursor = Math.max(cursor, f);
  });
  if (fin > cursor) tramos.push({ w:fin - cursor });
  const suma = tramos.reduce((k, t) => k + t.w, 0) || 1;
  const barra = `<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;table-layout:fixed"><tr>${tramos.map(t => {
    const pct = Math.max(1, Math.round(t.w / suma * 1000) / 10), col = t.i != null ? CP_COLORES[t.i % CP_COLORES.length][0] : '#dbe3ee';
    return `<td width="${pct}%" style="height:26px;background:${col};color:#fff;font-size:11px;font-weight:800;text-align:center;border-right:2px solid #fff">${t.i != null ? t.i + 1 : ''}</td>`; }).join('')}</tr></table>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:4px;font-size:10px;color:#5b6b80"><tr><td>Ingreso ${hora(sv.entra)} h</td><td align="right">${sv.sale ? 'Salida ' + hora(sv.sale) + ' h' : 'sigue de servicio'}</td></tr></table>`;

  /* Cada ronda en su recuadro, cada una de un color. */
  const ronda = (r, i) => {
    const [col, claro] = CP_COLORES[i % CP_COLORES.length], ok = !r.incompleta && r.conQR && r.total && r.qr.length >= r.total;
    const estado = r.incompleta ? `INCOMPLETA${r.conQR && r.total ? ` · ${r.qr.length} de ${r.total} puntos` : ''}` : ok ? `COMPLETA · ${r.qr.length} de ${r.total} puntos` : r.aMano ? 'ANOTADA A MANO' : r.fin ? 'ANOTADA POR LA GARITA' : 'EN CURSO';
    const filas = r.qr.map((q, j) => `<tr>
        <td width="34" style="padding:3px 0 3px 12px"><div style="width:22px;height:22px;border-radius:11px;background:${col};color:#fff;font-size:10.5px;font-weight:800;text-align:center;line-height:22px">${j + 1}</div></td>
        <td style="padding:3px 8px;font-size:12px;color:#0b1f3a"><b>${esc(q.n)}</b></td>
        <td width="80" align="right" style="padding:3px 8px;font-size:12px;font-weight:700;color:#0b1f3a;white-space:nowrap">${hora(q.at)} h</td>
        <td width="74" align="right" style="padding:3px 12px 3px 0;font-size:10.5px;color:#5b6b80;white-space:nowrap">${j ? '+' + minutos(r.qr[j - 1].at, q.at) + ' min' : 'inicio'}</td></tr>`).join('');
    const faltan = aLista(r.faltan).map(n => `<tr><td width="34" style="padding:5px 0 5px 12px"><div style="width:24px;height:24px;border-radius:12px;border:2px solid #dc2626;color:#dc2626;font-size:12px;font-weight:800;text-align:center;line-height:20px">!</div></td>
        <td colspan="3" style="padding:5px 12px 5px 8px;font-size:12px;color:#b91c1c"><b>${esc(n)}</b> · no se leyó su QR en esta ronda</td></tr>`).join('');
    return `<div style="page-break-inside:avoid;margin:0 0 12px;border:2px solid ${col};border-radius:16px;overflow:hidden;background:${claro}">
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:${col}"><tr>
        <td width="58" style="padding:8px 0 8px 14px"><div style="width:40px;height:40px;border-radius:20px;background:#fff;color:${col};font-size:20px;font-weight:800;text-align:center;line-height:40px">${i + 1}</div></td>
        <td style="padding:8px 8px;color:#fff"><div style="font-size:16px;font-weight:800">${CP_ORD[i] || 'Ronda ' + (i + 1)} ronda</div>
          <div style="font-size:12px;opacity:.95">${hora(r.inicio)}${r.fin ? ` a ${hora(r.fin)} h · ${minutos(r.inicio, r.fin)} minutos caminando el barrio` : ' h · en curso'}</div></td>
        <td align="right" style="padding:10px 14px"><span style="display:inline-block;background:#fff;color:${r.incompleta ? '#b91c1c' : col};font-size:10px;font-weight:800;letter-spacing:.08em;padding:5px 10px;border-radius:20px;white-space:nowrap">${r.incompleta ? '! ' : ok ? '✓ ' : ''}${estado}</span></td></tr></table>
      ${filas || faltan ? `<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:4px 0">${filas}${faltan}</table>`
        : `<div style="padding:12px 16px;font-size:12px;color:#334155">${r.aMano ? `La garita anotó esta ronda a mano${r.motivo ? ' (' + esc(r.motivo.charAt(0).toLowerCase() + r.motivo.slice(1)) + ')' : ''}.` : 'Ronda registrada por la garita, sin lectura de QR.'}</div>`}</div>`;
  };

  const acciones = aLista(sv.acciones).slice(0, 14);
  const n = sv.rondas.length;
  const gracias = n
    ? `Esta noche estuviste de guardia mientras el barrio descansaba. Recorriste ${n === 1 ? 'una vez' : n + ' veces'} sus calles, el perímetro y los rincones más oscuros, punto por punto, y gracias a tu presencia las familias de ${barrio} pudieron dormir tranquilas y seguras. Ese trabajo constante y silencioso es el que hace que nuestro barrio sea un lugar en paz.`
    : `Esta noche estuviste de guardia mientras el barrio descansaba, y gracias a tu presencia las familias de ${barrio} pudieron dormir tranquilas y seguras. Ese trabajo constante y silencioso es el que hace que nuestro barrio sea un lugar en paz.`;

  return `<div style="font-family:Arial,Helvetica,sans-serif;color:#0b1f3a;max-width:720px;margin:0 auto;font-size:12px;line-height:1.45">
  <div style="border-radius:18px;overflow:hidden;background:#0b1f3a">
    ${im.portada ? `<img src="${im.portada}" width="720" style="display:block;width:100%;height:auto" alt="El barrio ${barrio} de noche">` : ''}
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse"><tr>
      ${im.logo ? `<td width="76" style="padding:16px 0 18px 20px"><img src="${im.logo}" width="58" height="58" style="display:block;border-radius:29px;background:#fff" alt=""></td>` : ''}
      <td style="padding:16px 20px 18px;color:#fff"><div style="font-size:10px;font-weight:700;letter-spacing:.22em;text-transform:uppercase;color:#f5b70a">Barrio ${barrio} · Seguridad nocturna · Para el policía</div>
        <div style="font-size:27px;font-weight:800;line-height:1.15;margin-top:3px">Constancia diaria de servicio</div>
        <div style="font-size:12.5px;color:#c7d3e6;margin-top:2px">Policía adicional · ${esc(cpNoche(sv.entra, sv.sale))}</div></td>
      <td width="120" align="right" style="padding:16px 20px 18px 0;color:#c7d3e6;font-size:10px;line-height:1.5">N.º ${nro || '—'}<br>Emitida el<br><b style="color:#fff">${fechaCorta(isoDe(new Date()))} · ${hora(Date.now())} h</b></td></tr></table>
  </div>
  <div style="height:6px;background:#f5b70a;border-radius:0 0 6px 6px;margin:0 30px"></div>

  ${tit('El policía')}
  <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate;border:1.5px solid #dbe3ee;border-radius:16px;background:#f7f9fc"><tr>
    <td width="84" style="padding:14px 0 14px 16px"><div style="width:62px;height:62px;border-radius:31px;background:#0b1f3a;color:#f5b70a;font-size:24px;font-weight:800;text-align:center;line-height:62px">${esc(inicialesDe(sv.nombre))}</div></td>
    <td style="padding:14px 10px"><div style="font-size:21px;font-weight:800;color:#0b1f3a">${esc(sv.nombre)}</div>
      <div style="margin-top:6px">${sv.cargo ? `<span style="display:inline-block;background:#0b1f3a;color:#fff;font-size:11px;font-weight:700;padding:4px 10px;border-radius:20px;margin-right:6px">${esc(sv.cargo)}</span>` : ''}${sv.matricula ? `<span style="display:inline-block;border:1.5px solid #0b1f3a;color:#0b1f3a;font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px">Matrícula ${esc(sv.matricula)}</span>` : ''}</div></td>
    <td width="210" style="padding:14px 16px 14px 0;font-size:11px;color:#334155;line-height:1.6"><b style="color:#0b1f3a">Ingreso:</b> ${esc(cpDia(sv.entra))} · ${hora(sv.entra)} h<br>${sv.sale ? `<b style="color:#0b1f3a">Salida:</b> ${esc(cpDia(sv.sale))} · ${hora(sv.sale)} h` : 'Sigue de servicio'}<br><b style="color:#0b1f3a">Guardia:</b> ${esc(sv.guardias.join(', ') || '—')}</td></tr></table>

  <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate;margin:12px -4px 0"><tr>
    ${kpi('Ingreso', hora(sv.entra) + ' h', esc(cpDia(sv.entra)), '#0d9488')}
    ${kpi('Salida', sv.sale ? hora(sv.sale) + ' h' : '—', sv.sale ? esc(cpDia(sv.sale)) : 'sigue de servicio', '#2563eb')}
    ${kpi('De servicio', cpDur(total).replace(' min', '′').replace(' h ', ' h '), 'en el barrio', '#7c3aed')}
    ${kpi('Rondas', `${completas} de ${meta}`, completas >= meta ? '¡meta cumplida!' : plural(n, 'ronda hecha', 'rondas hechas'), '#d97706')}</tr></table>

  ${tit('La noche de un vistazo')}${barra}

  ${tit(n ? `Las rondas, punto por punto · ${n}` : 'Las rondas')}
  ${n ? sv.rondas.map(ronda).join('') : '<div style="padding:14px 16px;border:1.5px dashed #cbd5e1;border-radius:14px;color:#5b6b80">No se anotaron rondas en este servicio.</div>'}

  ${acciones.length ? `<div style="page-break-inside:avoid">${tit('Lo que anotó la garita')}
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border:1.5px solid #dbe3ee;border-radius:14px">${acciones.map((a, j) => `<tr style="background:${j % 2 ? '#ffffff' : '#f7f9fc'}">
      <td width="62" valign="top" style="padding:6px 0 6px 14px;font-weight:700;color:#0b1f3a;white-space:nowrap">${hora(a.at)} h</td><td style="padding:6px 14px 6px 6px;color:#334155;font-size:11.5px">${esc(a.texto)}</td></tr>`).join('')}</table></div>` : ''}

  <div style="page-break-inside:avoid;margin-top:20px;border-radius:18px;background:#0b1f3a;color:#fff;padding:22px 24px">
    <div style="font-size:10px;font-weight:700;letter-spacing:.22em;text-transform:uppercase;color:#f5b70a">De parte de todo el barrio</div>
    <div style="font-size:24px;font-weight:800;margin:4px 0 10px">¡Gracias, ${pila}!</div>
    <div style="font-size:13px;line-height:1.6;color:#e2e8f0">${gracias}</div>
    <div style="font-size:13px;line-height:1.6;color:#e2e8f0;margin-top:8px">Queremos agradecerte de corazón el compromiso y la responsabilidad con que cumpliste tu servicio. Te esperamos en la próxima guardia.</div>
    <div style="margin-top:14px;padding-top:12px;border-top:1px solid #33496b;font-size:12px;color:#f5b70a;font-weight:700">La Administración y los vecinos del Barrio ${barrio}</div>
  </div>

  <div style="margin-top:12px;font-size:9.5px;color:#7a8799;line-height:1.5">Constancia emitida por la app del barrio al registrarse tu salida en la garita, con las horas exactas de cada QR leído. Si algún dato no coincide, avisá a la garita o a la Administración. Tu nombre, cargo, matrícula, celular y correo los ven solo la garita y la Administración del barrio (Ley 25.326).</div>
</div>`;
}
const cpPdfDoc = cuerpo => `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Constancia de servicio</title><style>@page{size:A4;margin:9mm}body{margin:0;-webkit-print-color-adjust:exact;print-color-adjust:exact}</style></head><body>${cuerpo}</body></html>`;
/* El correo: corto y amable. La constancia completa va en el PDF adjunto. */
function constanciaCorreoHtml(sv){
  const c = Store.s.config, n = sv.rondas.length, pila = esc(String(sv.nombre || '').trim().split(/\s+/)[0] || sv.nombre);
  const dato = (t, v) => `<td width="33%" style="padding:10px 12px;background:#f3f6fb;border-radius:12px;text-align:center"><div style="font-size:11px;color:#5b6b80;text-transform:uppercase;letter-spacing:.08em">${t}</div><div style="font-size:18px;font-weight:800;color:#0b1f3a">${v}</div></td>`;
  return Correo.plantilla('Tu constancia diaria de servicio', `
    <p style="margin:0 0 12px">¡Hola, ${pila}! Gracias por cuidar el Barrio ${esc(c.nombre)}. Te adjuntamos en <b>PDF</b> la constancia de tu servicio de la ${esc(cpNoche(sv.entra, sv.sale).replace(/^Noche del /, 'noche del '))}, con cada ronda y la hora de cada punto.</p>
    <table width="100%" cellpadding="0" cellspacing="6" style="border-collapse:separate;margin:0 0 12px"><tr>${dato('Ingreso', hora(sv.entra) + ' h')}${dato('Salida', sv.sale ? hora(sv.sale) + ' h' : '—')}${dato('Rondas', n)}</tr></table>
    <p style="margin:0;color:#334155">Si no ves el archivo adjunto, pedile a la garita que te la muestre en la app.</p>`);
}
async function mandarConstanciaPolicia(pid, { avisar = true } = {}){
  const sv = serviciosPolicia().find(x => x.id === pid); if (!sv || !sv.sale) return;
  if (!sv.email){ if (avisar) toast('El policía no dejó correo: la constancia no salió (queda en Turnos)', 'mail'); return; }
  /* 18-10: el correo corto y la constancia completa en PDF adjunto. */
  const im = await constanciaImgs();
  const r = await Correo.enviarDetalle({ para:sv.email, asunto:`Constancia diaria de servicio · Barrio ${Store.s.config.nombre} · ${fechaCorta(isoDe(new Date(sv.entra)))}`, html:constanciaCorreoHtml(sv), tipo:'policia-servicio',
    pdf:{ html:cpPdfDoc(constanciaPdfHtml(sv, im)), nombre:`Constancia ${isoDe(new Date(sv.entra))} ${sv.nombre}.pdf`.replace(/\s+/g, ' ') } });
  /* Queda anotado en su registro si salió o no (se ve en Turnos). */
  Store.cambiar(s => { const x = aLista(s.bitacora).find(b => b.id === sv.registroSale); if (!x) return; x.policias = policiasDe(x);
    const p = x.policias.find(q => q.id === pid); if (p) p.constancia = { at:Date.now(), ok:r.ok, error:r.ok ? '' : String(r.error || '').slice(0, 120), para:sv.email }; });
  if (avisar) toast(r.ok ? `La constancia salió por correo a ${sv.email}` : 'La constancia no salió por correo: ' + r.error, r.ok ? 'mail' : 'alert');
}
A['policia-constancia'] = el => mandarConstanciaPolicia(el.dataset.id);
A['policia-constancia-ver'] = el => { const sv = [...serviciosPolicia(), ...aLista(typeof Historial !== 'undefined' && Historial.servPolicia)].find(x => x.id === el.dataset.id); if (!sv) return;
  /* 18-10: se ve tal cual el PDF que le llega al policía. */
  constanciaImgs().then(im => {
    hoja('Constancia de servicio', `<iframe class="mv-parte-frame" title="Constancia de servicio" sandbox="allow-same-origin allow-modals"></iframe>
      <button class="btn btn-pri btn-block" style="margin-top:10px" data-a="mv-parte-imprimir">${I('download')}Imprimir o guardar en PDF</button>
      ${el.dataset.desde === 'hist' ? `<button class="btn btn-sec btn-block" style="margin-top:8px" data-a="hist-policias-volver">${I('left')}Volver a la lista de servicios</button>` : ''}`, { ancho:'820px' });
    const f = $('#hoja .mv-parte-frame'); if (f){ encuadrarPdf(f); f.srcdoc = cpPdfDoc(constanciaPdfHtml(sv, im)); }
  }); };
/* Un servicio en la ventana Turnos: se despliega con todo el recorrido. */
function tarjetaServicio(sv, { conAcciones = true } = {}){
  const inc = sv.rondas.filter(r => r.incompleta).length, c = sv.constancia;
  return `<details class="servicio-pol" data-k="sv-${esc(sv.id)}">
    <summary><span class="ic ic-sky">${I('shield')}</span><span class="sd-txt"><b>${esc(sv.nombre)}${esc(pnCargoMat(sv, '', ' · '))}</b>
      <small>${fechaCorta(isoDe(new Date(sv.entra)))} ${hora(sv.entra)}${sv.sale ? ' → ' + (isoDe(new Date(sv.sale)) !== isoDe(new Date(sv.entra)) ? fechaCorta(isoDe(new Date(sv.sale))) + ' ' : '') + hora(sv.sale) + ' h' : ' · sigue de servicio'} · ${plural(sv.rondas.length, 'ronda')}${inc ? ` (${inc} incompleta${inc > 1 ? 's' : ''})` : ''}</small></span>
      <span class="pill ${!sv.sale ? 'p-accent' : c && c.ok ? 'p-ok' : sv.email ? 'p-warn' : ''}">${!sv.sale ? 'En servicio' : c && c.ok ? 'Constancia enviada' : sv.email ? 'Constancia sin enviar' : 'Sin correo'}</span></summary>
    <div class="sd-mas">
      <div><span class="muted">Ingreso</span><b>${fechaCorta(isoDe(new Date(sv.entra)))} · turno ${esc(sv.turnoEntra || '—')} · ${hora(sv.entra)} h</b></div>
      <div><span class="muted">Salida</span><b>${sv.sale ? `${fechaCorta(isoDe(new Date(sv.sale)))} · turno ${esc(sv.turnoSale || '—')} · ${hora(sv.sale)} h` : '—'}</b></div>
      <div><span class="muted">Guardias</span><b>${esc(sv.guardias.join(', ') || '—')}</b></div>
      ${sv.rondas.map((r, i) => `<div><span class="muted">Ronda ${i + 1}</span><b>${hora(r.inicio)}${r.fin ? '–' + hora(r.fin) + ' (' + minutos(r.inicio, r.fin) + ' min)' : ' · en curso'} · ${esc(estadoRondaTxt(r))}${r.qr.length ? `<br><small class="muted">${r.qr.map(q => `${esc(q.n)} ${hora(q.at)}`).join(' · ')}</small>` : ''}</b></div>`).join('')}
      ${c ? `<div><span class="muted">Constancia</span><b>${c.ok ? `enviada a ${esc(c.para || sv.email)} · ${fechaHora(c.at)}` : `no salió: ${esc(c.error || '')}`}</b></div>` : ''}
      ${conAcciones ? `<div class="btns" style="margin-top:6px"><button class="btn btn-xs btn-sec" data-a="policia-constancia-ver" data-id="${esc(sv.id)}">${I('file')}Ver la constancia</button>
        ${sv.sale && sv.email && sv.registroSale ? `<button class="btn btn-xs btn-sec" data-a="policia-constancia" data-id="${esc(sv.id)}">${I('mail')}${c && c.ok ? 'Reenviar' : 'Mandar'} la constancia</button>` : ''}</div>`
        /* 20-10-2026: en "Servicios anteriores" también se abre la constancia de cada uno (pedido de Claudio). */
        : sv.sale ? `<div class="btns" style="margin-top:6px"><button class="btn btn-xs btn-sec" data-a="policia-constancia-ver" data-id="${esc(sv.id)}" data-desde="hist">${I('file')}Ver la constancia</button></div>` : ''}
    </div></details>`;
}
/* En Turnos: los últimos 7 servicios; los anteriores, a pedido. */
function seccionServiciosPolicia(){
  const ls = serviciosPolicia().filter(x => x.sale).slice(0, 7);
  return `${sec('Servicios del policía contratado', `<span class="muted small">últimos 7</span>`)}
    ${ls.length ? `<div class="servicios-lista">${ls.map(sv => tarjetaServicio(sv)).join('')}</div>` : `<div class="card plana small">${I('shield')} Cuando se registre la salida de un policía, su servicio queda acá con todo su recorrido.</div>`}
    <button class="btn btn-sm btn-sec" style="margin-top:8px" data-a="hist-policias">${I('clock')}Ver servicios anteriores</button>`;
}
/* Los anteriores se traen de la base recién cuando se piden: así la app no
   baja meses de rondas al abrir. */
A['hist-policias'] = async () => {
  if (!veGarita()) return;
  Historial.cargando('Servicios del policía');
  try {
    let regs = aLista(Store.s.bitacora);
    if (Historial.hayNube()){
      const v = (await Nube.db.ref('staff/bitacora').orderByChild('at').endAt(Date.now() - Historial.VENTANA.bitacora[1] * DIA).get()).val() || {};
      const ids = new Set(regs.map(b => b && b.id));
      regs = [...regs, ...Object.values(v).filter(b => b && !ids.has(b.id))];
    }
    Historial.servPolicia = serviciosPolicia(regs.filter(b => b && b.tipo === 'turno' && b.abre), regs).filter(x => x.sale);
    pintarHistPolicias('');
  } catch(e){ Historial.fallo(e); }
};
function pintarHistPolicias(q){
  const qq = normTxt(q), todos = aLista(Historial.servPolicia);
  const ls = qq ? todos.filter(x => normTxt(`${x.nombre} ${x.matricula} ${isoDe(new Date(x.entra))} ${x.guardias.join(' ')}`).includes(qq)) : todos;
  hoja('Servicios del policía', `<form class="linea-form" data-f="hist-policias-buscar" style="margin-bottom:10px"><input name="q" value="${esc(q)}" placeholder="Nombre, matrícula, guardia o fecha (2026-09)"><button class="btn btn-pri">${I('search')}</button></form>
    <p class="muted small" style="margin:0 0 10px">${plural(ls.length, 'servicio')}${qq ? ' encontrados' : ' desde el primer día'}.</p>
    <div class="servicios-lista">${ls.slice(0, 200).map(sv => tarjetaServicio(sv, { conAcciones:false })).join('') || '<p class="muted small">Sin servicios.</p>'}</div>
    <button class="btn btn-sec btn-block" style="margin-top:10px" data-a="hist-policias-csv">${I('download')}Descargar la planilla (CSV)</button>`, { ancho:'640px' });
}
F['hist-policias-buscar'] = d => { Historial.qPolicia = d.q || ''; pintarHistPolicias(Historial.qPolicia); };
A['hist-policias-volver'] = () => pintarHistPolicias(Historial.qPolicia || '');
A['hist-policias-csv'] = () => csvDe([['ingreso','turno ingreso','salida','turno salida','policía','cargo','matrícula','guardias','rondas','incompletas','constancia'],
  ...aLista(Historial.servPolicia).map(x => [fechaHora(x.entra), x.turnoEntra || '', x.sale ? fechaHora(x.sale) : '', x.turnoSale || '', x.nombre, x.cargo || '', x.matricula || '', x.guardias.join(' / '), x.rondas.length, x.rondas.filter(r => r.incompleta).length, x.constancia && x.constancia.ok ? 'enviada' : ''])], `servicios-policia-${hoyISO()}.csv`);

/* Para la Administración: horas y rondas de cada policía en el mes (sirve
   para controlar lo que se le paga). */
function policiaDelMes(mes = hoyISO().slice(0, 7)){
  const m = new Map();
  registrosTurno().forEach(t => policiasDe(t).forEach(p => {
    if (isoDe(new Date(p.entra)).slice(0, 7) !== mes) return;
    const k = claveNombre(p.nombre), r = m.get(k) || { nombre:p.nombre, cargo:p.cargo || '', matricula:p.matricula, noches:new Set(), horas:0, rondas:0 };
    r.noches.add(isoDe(new Date(p.entra - 6 * HORA)));
    if (p.sale && !p.paso) r.horas += (p.sale - p.entra) / HORA;
    r.rondas += p.rondas.length; m.set(k, r);
  }));
  /* Un policía que pasó de un turno a otro figura en los dos: las horas se
     cuentan donde salió, desde su ingreso original. */
  return [...m.values()].sort((a, b) => a.nombre.localeCompare(b.nombre));
}

/* Quiénes hacen cada turno: el abierto, o el último que se anotó con ese
   nombre (pedido de Claudio, 27-09: "donde dice mañana, tarde y noche
   deben aparecer los nombres de los guardias"). */
function quienesDelTurno(nombre){
  const r = registrosTurno().find(x => relevosDe(x).some(y => claveNombre(y.h) === claveNombre(nombre)));
  if (!r) return null;
  const ys = relevosDe(r).filter(y => claveNombre(y.h) === claveNombre(nombre));
  return { guardias:ys.map(y => y.n), at:Math.min(...ys.map(y => y.entra || r.at)), abierto:!r.cerradoAt };
}
/* La Administración arma los turnos y ve quién trabajó en cada uno. */
R.turnos = {
  titulo: 'Turnos de la garita', icon: 'clock', color: 'sky', sub: 'Horarios de la guardia y quién trabajó en cada uno',
  render(){
    if (!veGarita()) return vacio('lock', 'Solo para la garita, la Administración y la supervisión.');
    const ts = turnosConfig();
    const fila = i => { const t = ts[i] || {}; return `<div class="grid3 turno-edit"><div class="field"><label>Turno ${i + 1}${i >= 2 ? ' (opcional)' : ''}</label><input name="n${i}" value="${esc(t.nombre || '')}" maxlength="20" placeholder="${['Mañana', 'Día', 'Tarde', 'Noche'][i]}" ${i < 2 ? 'required' : ''}></div>
      <div class="field"><label>Desde</label><input type="time" name="d${i}" value="${esc(t.desde || '')}" ${i < 2 ? 'required' : ''}></div>
      <div class="field"><label>Hasta</label><input type="time" name="h${i}" value="${esc(t.hasta || '')}" ${i < 2 ? 'required' : ''}></div></div>`; };
    return `${bandaTurno()}
      ${sec('La guardia de hoy')}
      <div class="card" style="padding:12px 12px 8px">${typeof lineaGuardia === 'function' ? lineaGuardia() : ''}</div>
      ${sec('Quién hace cada horario')}
      <div class="card turnos-quien">${ts.map(t => { const q = quienesDelTurno(t.nombre);
        return `<div class="tq-fila ${q && q.abierto ? 'ahora' : ''}"><div class="tq-cab"><b>${esc(t.nombre)}</b><span class="muted">${t.desde} a ${t.hasta} h</span>${q && q.abierto ? '<span class="pill p-ok">En curso</span>' : ''}</div>
          <div class="tq-nombres">${q ? `${q.guardias.map(n => `<span class="chip-nombre">${I('user')}${esc(n)}</span>`).join('')}<small class="muted">${q.abierto ? 'desde las ' + hora(q.at) + ' h' : 'último: ' + relDia(isoDe(new Date(q.at))).toLowerCase()}</small>` : '<small class="muted">Todavía no se anotó quién lo hace.</small>'}</div></div>`; }).join('')}
        <p class="muted tiny" style="margin:8px 0 0">Los nombres salen de lo que anota cada turno al empezar. ${esAdmin() ? 'Los horarios se cambian abajo.' : 'Los horarios los define la Administración.'}</p></div>
      ${esAdmin() ? `<details class="plegable card" data-k="horarios"><summary><b>Horarios de la guardia</b><span class="muted small">cambiar</span></summary><form data-f="turnos" style="margin-top:10px">
        ${[0, 1, 2, 3].map(fila).join('')}
        <p class="muted tiny" style="margin:0 0 10px">De 2 a 4 horarios, uno por guardia. <b>Pueden superponerse</b> (por ejemplo, Mañana de 7 a 15 y Día de 8 a 20) y uno puede pasar la medianoche (Noche de 23 a 7). Dejá vacíos los que no uses. El policía nocturno tiene su horario aparte, más abajo.</p>
        <button class="btn btn-pri btn-block">${I('check')}Guardar los horarios</button>
        <button type="button" class="btn btn-sec btn-block" style="margin-top:8px" data-a="turnos-base">${I('refresh')}Cargar 7–15, 8–20, 15–23 y 23–7</button></form></details>` : ''}
      ${sec('Últimos turnos', `<span class="muted small">elegí año, mes y día</span>`)}
      ${typeof calTurnos === 'function' ? calTurnos() : ''}
      ${typeof seccionNochePolicia === 'function' ? seccionNochePolicia() : seccionPoliciaHorario() + seccionServiciosPolicia() + seccionPuntos()}`;
  },
  alPintar(){ if (typeof animarNumeros === 'function') animarNumeros(); if (typeof tvAlPintar === 'function') tvAlPintar(); },
};
F['turnos'] = d => {
  const ts = [0, 1, 2, 3].map(i => ({ nombre:String(d['n' + i] || '').trim(), desde:d['d' + i] || '', hasta:d['h' + i] || '' })).filter(t => t.nombre && t.desde && t.hasta);
  if (ts.length < 2){ toast('Tienen que ser al menos dos turnos', 'clock'); return; }
  if (new Set(ts.map(t => claveNombre(t.nombre))).size !== ts.length){ toast('Dos turnos no pueden llamarse igual', 'clock'); return; }
  if (ts.some(t => t.desde === t.hasta)){ toast('Un turno no puede empezar y terminar a la misma hora', 'clock'); return; }
  Store.cambiar(s => { s.config.turnosGarita = ts; auditar(s, 'Cambió los turnos de la garita', ts.map(t => `${t.nombre} ${t.desde}-${t.hasta}`).join(' · ')); });
  toast('Turnos guardados', 'check');
};

/* =========================================================
   LO QUE LA GARITA NO PUEDE OLVIDAR HOY (pedido de Claudio, 27-09)
   Al lado de "Garita · domingo 27 de sep.", la lista del día. Cada tarea
   se tilda SOLA cuando la app ve que está hecha (el camión registrado, la
   casa sola revisada, los paquetes entregados, la bitácora con novedades…):
   la guardia no tiene que marcar nada. Arriba lo pendiente, después los
   recordatorios de siempre y abajo lo hecho. Tocar una tarea lleva a
   donde se hace. Lo que no toca hoy (no pasa el camión, no hay casas
   solas) no aparece.
   ========================================================= */
const turnoEsNoche = nombre => { const c = turnosConfig().find(x => x.nombre === nombre); return /noche|madrug/i.test(nombre || '') || (c ? enFranja(c, 23 * 60) || enFranja(c, 2 * 60) : false); };
/* =========================================================
   HOY LA GARITA NO PUEDE OLVIDAR (rehecho a pedido de Claudio, 28-09-2026)
   Antes era una lista fija: salían tachadas cosas que hoy no tocaban
   ("Nadie anunciado", "Ningún paquete") mezcladas con cosas que sí había
   que hacer, y el control de la ART aparecía aunque no viniera nadie.
   Ahora la lista se ARMA SOLA con lo que de verdad hay hoy:
     · lo pedido a la garita (peticiones sin recibir y las vigentes, avisos
       de vecinos, consultas de "llegó sin aviso");
     · lo programado para hoy (visitas y viajes anunciados, ingresos
       frecuentes de este día, obras y proveedores que vienen, el camión,
       los traslados del hotel, el policía del turno de noche, las casas
       solas para revisar);
     · lo pendiente (quién está adentro sin salida, paquetes por entregar,
       alertas de "Estoy bien");
     · y lo de todo turno (la bitácora y el cierre del turno).
   Lo que no está pedido, programado ni pendiente NO sale. Lo ya hecho no
   se lista tachado: queda resumido en un renglón ("Hecho hoy: …").
   ========================================================= */
function tareasGarita(){
  const s = Store.s, hoy = hoyISO(), t = turnoAbierto(), ahora = Date.now(), inicioDia = fechaDe(hoy).getTime(), L = [], hechas = [];
  /* prioridad: 0 urgente · 1 con hora · 2 del día · 3 de todo turno */
  const add = (prio, icon, titulo, det, ir = {}, extra = {}) => L.push({ prio, icon, titulo, det, ir, ...extra });
  const hecho = txt => hechas.push(txt);
  const nombreCasa = id => esc(usuario(id)?.casa || '');
  const lista3 = (xs, f) => xs.slice(0, 3).map(f).join(' · ') + (xs.length > 3 ? ` y ${xs.length - 3} más` : '');

  if (!t) add(0, 'shield', 'Anotar el turno y quiénes están', 'Todavía no se abrió el turno de hoy');
  else hecho(`turno ${esc(t.turno)} abierto (${esc(aLista(t.guardias).join(', '))})`);

  /* Lo urgente: gente esperando en la entrada, alertas y pedidos sin leer. */
  const cons = s.llegadas.filter(l => l.estado === 'consultando');
  if (cons.length) add(0, 'gate', 'Llegó sin aviso: esperando la respuesta del vecino', lista3(cons, l => `${esc(l.nombre)} → ${esc(l.casa || usuario(l.hostId)?.casa || '')}`), { ir:'#garLlegadas' });
  if (typeof Cuidado !== 'undefined' && typeof veListaCuidados === 'function' && veListaCuidados()){ const mal = Cuidado.personas().filter(p => Cuidado.enAlerta(p));
    if (mal.length) add(0, 'heart', '"Estoy bien" o salida sin regreso: llamar o pasar', lista3(mal, p => `${esc(p.casa || '')} · ${esc(primerNombre(p.nombre))}`), { v:'estoy-bien' }); }
  const av = s.avisos.filter(a => !a.visto && ahora - a.at < 6 * HORA);
  if (av.length) add(0, 'bell', 'Avisos de vecinos: leer y marcar "Visto"', plural(av.length, 'sin ver', 'sin ver'), { ir:'#garAvisos' });
  const petP = s.peticiones.filter(p => p.estado === 'pendiente');
  if (petP.length) add(0, 'edit', 'Peticiones de vecinos: recibir y firmar', lista3(petP, p => `${esc(p.casa || '')} · ${esc((TIPOS_PET[p.tipo] || TIPOS_PET.otro).n.toLowerCase())}`), { v:'peticiones' });

  /* La agenda del hotel para mañana (20-10-2026): un solo renglón hasta que
     alguien toca "Recibido". Las tareas en sí no se repiten acá: los
     huéspedes, vans y empleados salen solos el mismo día. */
  if (typeof agendaDe === 'function'){ const ag = agendaDe(sumarDias(hoy, 1));
    if (ag && ag.estado === 'aprobada'){ if (ag.recibido) hecho(`agenda del hotel de mañana recibida (${hora(ag.recibido.at)} h)`);
      else add(2, 'calendar', 'Agenda del hotel para mañana: leerla y tocar "Recibido"', `${plural(aLista(ag.items).filter(x => x.est !== 'quitado').length, 'tarea')} · la aprobó la gerencia a las ${hora(ag.aprobadaAt)} h`, { v:'hotel-agenda' }); } }
  /* El camión, solo el día que pasa. */
  const dias = recoleccionDias(), dh = dias[new Date().getDay()], vol = typeof volsProximos === 'function' && volsProximos().find(v => v.fecha === hoy);
  if (dh || vol){ const ad = Camion.adentro(), paso = camionPasoHoy();
    if (ad) add(0, 'tacho', 'Camión de residuos adentro: registrar la salida', `Entró a las ${hora(ad.entra)} h`, { a:'camion-sale' });
    else if (paso) hecho(`camión (entró ${hora(paso.entra)} h)`);
    else add(1, 'tacho', 'Camión de residuos: registrar la entrada y la salida', `Hoy pasa (${esc(vol ? 'voluminosos' : String(dh).toLowerCase())}). Al registrar la entrada, se avisa solo a todo el barrio.`, { a:'camion-entra' }); }

  /* Los correos adentro: marcar la salida (si pasó más de una hora, urge). */
  if (typeof Mensajeria !== 'undefined'){ const cor = Mensajeria.adentro(), largos = cor.filter(v => ahora - v.entra > HORA);
    if (cor.length) add(largos.length ? 0 : 2, 'mail', largos.length ? `Correo adentro hace más de una hora: ¿ya salió?` : `Correos adentro: registrar la salida (${cor.length})`,
      lista3(cor.slice().reverse(), v => `${esc(nombreCorreo(v))} · entró ${hora(v.entra)} h`), { ir:'#garCorreos' });
    const fueron = Mensajeria.lista().filter(v => v.sale && v.entra >= inicioDia).length;
    if (fueron) hecho(plural(fueron, 'correo con entrada y salida', 'correos con entrada y salida')); }

  /* Quién viene hoy y quién está adentro. */
  const lista = pasesDelDia(hoy), esp = lista.filter(p => estadoPase(p) === 'esperado').sort((a, b) => String(a.desde).localeCompare(String(b.desde))), adn = lista.filter(p => estadoPase(p) === 'adentro');
  if (esp.length) add(1, 'users', `Vienen hoy: ${plural(esp.length, 'visita anunciada', 'visitas anunciadas')}`, lista3(esp, p => `${esc(p.desde || '')} ${esc(p.nombre)} → ${nombreCasa(p.hostId)}${p.patente ? ' · ' + esc(p.patente) : ''}`), { ir:'#garIngresos' }, { hora:esp[0].desde || '' });
  if (adn.length) add(2, 'logout', `Adentro: falta registrar la salida de ${adn.length}`, lista3(adn, p => `${esc(p.nombre)} → ${nombreCasa(p.hostId)}`), { ir:'#garIngresos' });
  const fueron = lista.filter(p => estadoPase(p) === 'salio').length;
  if (fueron) hecho(plural(fueron, 'visita con entrada y salida', 'visitas con entrada y salida'));

  /* Ingresos frecuentes que tienen HOY entre sus días (los de "cualquier día" no son programados). */
  const movsHoy = aLista(s.bitacora).filter(b => b && b.frecId && b.at >= inicioDia);
  const frecHoy = (typeof frecuentes === 'function' ? frecuentes() : []).filter(f => aLista(f.dias).length && frecuenteVigente(f).ok && !frecuenteVigente(f).aviso);
  const frecEntro = f => movsHoy.some(b => b.frecId === f.id && /^Ingreso/.test(b.texto || ''));
  const frecFalta = frecHoy.filter(f => !frecEntro(f));
  if (frecFalta.length) add(1, 'user', `Ingresos frecuentes de hoy: ${plural(frecFalta.length, 'falta llegar', 'faltan llegar')}`, lista3(frecFalta.sort((a, b) => String(a.desde).localeCompare(String(b.desde))), f => `${f.desde ? esc(f.desde) + ' ' : ''}${esc(f.nombre)}${f.empresa ? ' (' + esc(f.empresa) + ')' : ''} → ${esc(f.destino || 'Barrio')}`), { v:'frecuentes' }, { hora:frecFalta[0].desde || '' });

  /* Los empleados del hotel con día autorizado hoy que todavía no entraron (15-10-2026). */
  const empHoy = typeof hotelEmpleados === 'function' ? hotelEmpleados().filter(e => aLista(e.dias).length && hEmpHoyLeToca(e) && !hEmpHoy(e).length) : [];
  if (empHoy.length) add(1, 'users', `Empleados del hotel de hoy: ${plural(empHoy.length, 'falta llegar', 'faltan llegar')}`, lista3(empHoy.sort((a, b) => String(a.desde).localeCompare(String(b.desde))), e => `${e.desde ? esc(e.desde) + ' ' : ''}${esc(hEmpNombre(e))}${e.puesto ? ' (' + esc(e.puesto) + ')' : ''}`), { v:'frecuentes' }, { hora:empHoy[0].desde || '' });

  /* ART: solo si hoy viene alguien de una obra o un proveedor. */
  const deObra = [...esp.filter(p => p.tipo === 'proveedor').map(p => esc(p.nombre)),
    ...frecFalta.filter(f => ['obra', 'proveedor'].includes(f.tipo)).map(f => esc(f.empresa || f.nombre)),
    ...s.obras.filter(o => o.avisoHoy?.fecha === hoy).map(o => `${esc(o.empresa || 'Obra')}${o.casa ? ' (' + esc(dondeObra(o)) + ')' : ''}`)];
  const provVencida = aLista(s.proveedores).filter(p => p && p.empresa && (!p.artVence || p.artVence < hoy) && deObra.some(n => normTxt(n).includes(normTxt(p.empresa || '').slice(0, 12))));
  if (deObra.length) add(1, 'wrench', 'Obras y proveedores de hoy: controlar la ART al entrar', `${lista3([...new Set(deObra)], x => x)}${provVencida.length ? ` · <b style="color:var(--danger)">ART vencida: ${provVencida.map(p => esc(p.empresa)).join(', ')} (no entra)</b>` : ''}`, { v:'proveedores' });

  /* Paquetes por entregar y los entregados hoy. */
  const paq = hayPaquetes() ? s.paquetes.filter(p => !p.retirado) : [], entregados = hayPaquetes() ? s.paquetes.filter(p => p.retirado && p.retirado >= inicioDia).length : 0;
  if (paq.length) add(2, 'box', `Paquetes para entregar: ${paq.length}`, `${lista3([...new Set(paq.map(p => loteDelPaquete(p) || '—'))], l => esc(l))} · se entregan con el QR del vecino`, { ir:'#garPaquetes' });
  if (entregados) hecho(plural(entregados, 'paquete entregado', 'paquetes entregados'));

  /* Vans del hotel. */
  if (typeof viajesDelDia === 'function' && viajesDelDia(hoy).length){ const vp = viajesDelDia(hoy).filter(x => x.estado !== 'hecho'), vh = viajesDelDia(hoy).length - vp.length;
    if (vp.length) add(1, 'car', `Vans del hotel: ${plural(vp.length, 'traslado', 'traslados')} por marcar`, `${vp[0].sale ? 'El próximo sale a las ' + esc(vp[0].sale) + ' · ' : ''}marcá cada salida y regreso`, { ir:'.vans-garita' }, { hora:vp[0].sale || '' });
    if (vh) hecho(plural(vh, 'traslado del hotel', 'traslados del hotel')); }

  /* Casas solas. */
  const solas = typeof casasSolas === 'function' ? casasSolas(hoy) : [];
  if (solas.length){ const falta = solas.filter(a => !revisionDeHoy(a));
    if (falta.length) add(2, 'lock', `Casas solas: revisar ${falta.length}`, `${lista3(falta, a => esc(a.casa))} · tocá "Revisada" en cada una (al vecino le llega el aviso)`, { ir:'#garCasas' });
    if (solas.length - falta.length) hecho(plural(solas.length - falta.length, 'casa sola revisada', 'casas solas revisadas')); }

  /* Lo que los vecinos pidieron por escrito y sigue vigente hoy (no dejar pasar, llaves, permisos, paquetes a guardar). */
  const vig = s.peticiones.filter(p => p.estado === 'en_funciones' && p.tipo !== 'viaje' && (!p.desde || p.desde <= hoy) && (!p.hasta || p.hasta >= hoy));
  if (vig.length) add(2, 'edit', `Pedidos vigentes de vecinos: ${vig.length}`, lista3(vig.sort((a, b) => (b.tipo === 'nopasar') - (a.tipo === 'nopasar')), p => `${p.tipo === 'nopasar' ? '<b>' : ''}${esc(p.casa || '')} · ${esc((TIPOS_PET[p.tipo] || TIPOS_PET.otro).n.toLowerCase())}${p.tipo === 'nopasar' ? '</b>' : ''}`), { v:'peticiones', p:'en_funciones' }, { info:true });

  /* El policía contratado: en el turno de noche, o si ya está registrado. */
  const pols = t ? policiasDe(t) : [], adentroP = t ? policiasAdentro(t) : [];
  if (adentroP.length){ const rondas = pols.reduce((n, p) => n + p.rondas.length, 0), enCurso = adentroP.map(rondaEnCurso).find(Boolean);
    add(1, 'shield', 'Policía contratado: rondas y, al irse, su salida', `${adentroP.map(p => esc(p.nombre)).join(', ')} de servicio · ${enCurso ? `ronda en curso desde las ${hora(enCurso.inicio)} h` : plural(rondas, 'ronda') + ' hechas'}`, { ir:'.policia-card' }); }
  else if (t && !pols.length && (nochePolicia().ahora || nochePolicia().falta < 45 * MIN)) add(1, 'shield', 'Policía nocturna: registrar su ingreso', `${esc(nochePolicia().etiqueta)}, ${horarioNocheTxt(nochePolicia())}: cuando llegue, anotalo y mandale su tarjeta`, { a:'policia-nuevo' });
  else if (pols.length) hecho(`servicio del policía (${plural(pols.reduce((n, p) => n + p.rondas.length, 0), 'ronda')})`);

  /* De todo turno: la bitácora y el cierre. */
  const manual = t && aLista(s.bitacora).some(b => b && b.at >= t.at && b.autor && b.autor !== 'sistema' && ['novedad', 'incidente', 'ronda'].includes(b.tipo));
  if (t && !manual) add(3, 'book', 'Bitácora: anotar las novedades del turno', 'Todavía no se anotó ninguna en este turno', { ir:'#garBitacora' });
  else if (manual) hecho('novedades en la bitácora');
  if (t){ const prox = relevosDe(t).map(r => ({ r, f:faltanDe(horarioDe(r.h)) })).sort((a, b) => a.f - b.f)[0];
    add(3, 'clock', 'Relevo: cada guardia marca su salida con las novedades', prox ? `${esc(prox.r.n)} (${esc(prox.r.h)}) ${prox.f < 0 ? 'terminó a las ' + esc(horarioDe(prox.r.h)?.hasta || '') + ' h' : 'termina a las ' + esc(horarioDe(prox.r.h)?.hasta || '') + ' h'}` : 'Deja todo anotado para el que entra', { a:'guardia-hoy' }); }

  const orden = L.sort((a, b) => a.prio - b.prio || String(a.hora || '99').localeCompare(String(b.hora || '99')));
  const pend = orden.filter(x => !x.info && x.prio < 3).length;
  const opera = esGuardia();
  const attrs = x => x.ir.a && opera ? `data-a="${x.ir.a}"` : x.ir.v ? `data-a="abrir" data-v="${x.ir.v}"${x.ir.p ? ` data-p="${esc(x.ir.p)}"` : ''}` : x.ir.ir ? `data-a="garita-ir" data-v="${esc(x.ir.ir)}"` : 'disabled';
  /* EL DISEÑO (rehecho a pedido de Claudio, 12-10-2026: "que de un vistazo
     se entienda lo que hay que hacer"; ideas de todoist y de los tableros
     de tabler, 41k★, código propio). Arriba un anillo con lo que falta y
     lo hecho del día, y una leyenda de colores (rojo urgente, naranja con
     hora, azul del día, gris de cada turno). Cada tarea es una tarjeta con
     su color a la izquierda, la hora grande si tiene, una etiqueta que dice
     qué clase de tarea es, y una flecha: tocarla lleva a donde se hace. Lo
     urgente late. Lo hecho queda en fichitas verdes. */
  const clase = x => x.prio === 0 ? 'urge' : x.info ? 'info' : x.prio === 1 ? 'hora' : x.prio === 3 ? 'turno' : 'pend';
  const ETQ = { urge:'Urgente', hora:'Programado', pend:'Del día', turno:'Cada turno', info:'Vigente' };
  const cuenta = k => orden.filter(x => clase(x) === k).length;
  const total = pend + hechas.length, pct = total ? Math.round(hechas.length / total * 100) : 100;
  const leyenda = [['urge', 'urgente', 'urgentes'], ['hora', 'programada', 'programadas'], ['pend', 'del día', 'del día']].map(([k, a, b]) => { const n = cuenta(k); return n ? `<i class="l-${k}">${n} ${n === 1 ? a : b}</i>` : ''; }).join('');
  return `<details class="tareas-dia card td2${cuenta('urge') ? ' hay-urge' : ''}" data-k="tareas-dia" open>
    <summary>
      <span class="td2-anillo${pend ? '' : ' listo'}" style="--p:${pct}" aria-hidden="true">${pend ? `<b>${pend}</b><small>${pend === 1 ? 'falta' : 'faltan'}</small>` : I('check')}</span>
      <span class="td2-tit"><b>Hoy la garita no puede olvidar</b><span class="td2-ley">${pend ? leyenda : '<i class="l-ok">Todo al día</i>'}${hechas.length ? `<i class="l-hecho">${plural(hechas.length, 'hecha', 'hechas')}</i>` : ''}</span></span>
      ${I('right')}</summary>
    <div class="td-lista">${orden.map(x => { const k = clase(x); return `<button type="button" class="td-item td-${k === 'hora' ? 'pend' : k}${k === 'hora' ? ' td-hora' : ''}" ${attrs(x)}>
      ${x.hora ? `<span class="td-reloj"><b>${esc(x.hora)}</b><small>h</small></span>` : `<span class="td-ic">${I(x.icon)}</span>`}
      <span class="td-txt"><em class="td-etq">${k === 'hora' && x.hora ? 'Con hora' : ETQ[k]}</em><b>${x.titulo}</b><small>${x.det}</small></span>${attrs(x) === 'disabled' ? '' : `<span class="td-ir">${I('right')}</span>`}</button>`; }).join('')}</div>
    ${hechas.length ? `<div class="td2-hechos"><b>${I('check')}Hecho hoy</b>${hechas.map(h => `<span>${h}</span>`).join('')}</div>` : ''}
    <p class="muted tiny" style="margin:10px 2px 0">Se arma sola con lo pedido, lo programado y lo pendiente de hoy; lo que no hay, no aparece. Cada cosa sale de la lista cuando la app ve que está hecha.</p></details>`;
}
/* VISITAS DE HOY EN LA GARITA (pedido de Claudio, 08-10-2026)
   Antes eran dos cuadros con un número ("Esperados" y "Adentro") que no
   decían qué contaban; con los paquetes apagados quedaron dos solos. Ahora
   es un tablero que se lee de un vistazo: una barra del día (ya salieron ·
   adentro · por llegar), y dos tarjetas que dicen qué cuentan, quién es la
   próxima visita y quién está adentro hace más tiempo. Tocar una tarjeta
   baja a la lista de ingresos. */
function tableroVisitas(lista, paquetes = 0){
  const hoy = hoyISO(), de = e => lista.filter(p => estadoPase(p) === e);
  const esp = de('esperado').sort((a, b) => String(a.desde).localeCompare(String(b.desde)));
  const adn = de('adentro').sort((a, b) => (a.log[hoy].in || 0) - (b.log[hoy].in || 0));
  const sal = de('salio').length, total = esp.length + adn.length + sal;
  const lote = p => usuario(p.hostId)?.casa || '';
  const chipPaq = hayPaquetes() ? `<button class="vis-paq" data-a="garita-ir" data-v="#garPaquetes">${I('box')}${plural(paquetes, 'paquete sin retirar', 'paquetes sin retirar')}</button>` : '';
  if (!total) return `<div class="vis-hoy vacio-vis"><span class="vis-ic">${I('users')}</span><div class="grow"><b>Visitas de hoy</b><small>Todavía no hay visitas anunciadas. Cuando un vecino anuncia una, aparece acá sola.</small></div>${chipPaq}</div>`;
  const prox = esp[0], larga = adn[0];
  const tarjeta = (cls, n, t, s, det) => `<button class="vis-t ${cls}" data-a="garita-ir" data-v="#garIngresos">
      <span class="vis-n">${n}</span><span class="vis-txt"><b>${t}</b><small>${s}</small>${det ? `<em>${det}</em>` : ''}</span></button>`;
  return `<section class="vis-hoy" aria-label="Visitas de hoy">
    <div class="vis-cab"><span class="vis-ic">${I('users')}</span><div class="grow"><b>Visitas de hoy</b><small>${plural(total, 'visita anunciada', 'visitas anunciadas')} · se actualiza sola</small></div>${chipPaq}</div>
    <div class="vis-barra" role="img" aria-label="${sal} salieron, ${adn.length} adentro, ${esp.length} por llegar">${sal ? `<i class="vb-sal" style="flex:${sal}"></i>` : ''}${adn.length ? `<i class="vb-adn" style="flex:${adn.length}"></i>` : ''}${esp.length ? `<i class="vb-esp" style="flex:${esp.length}"></i>` : ''}</div>
    <div class="vis-ley"><span class="l-sal">Ya salieron ${sal}</span><span class="l-adn">Adentro ${adn.length}</span><span class="l-esp">Por llegar ${esp.length}</span></div>
    <div class="vis-dos">
      ${tarjeta('esp', esp.length, 'Por llegar', 'Anunciadas que todavía no entraron', prox ? `Próxima: ${esc(prox.nombre)} · ${esc(prox.desde)} h${lote(prox) ? ' · ' + esc(lote(prox)) : ''}` : 'No falta llegar nadie')}
      ${tarjeta('adn' + (adn.length ? ' vivo' : ''), adn.length, 'Adentro ahora', 'Entraron y todavía no salieron', larga ? `Hace más tiempo: ${esc(larga.nombre)}${lote(larga) ? ' · ' + esc(lote(larga)) : ''} · desde las ${hora(larga.log[hoy].in)} h` : 'No hay visitas adentro')}
    </div></section>`;
}
/* =========================================================
   INGRESOS DE HOY: TODO LO QUE ENTRA Y SALE (pedido de Claudio, 10-10-2026)
   "En Ingresos de hoy, aparte de las visitas, debe decir si ingresó el
   camión de basura, el correo, proveedores, etc., incluidos los huéspedes
   del hotel que entran o salen." Antes la lista tenía solo los pases.
   Ahora, en un solo lugar:
     · cuántos entraron hoy de cada cosa (visitas, sin aviso, camión,
       correos, proveedores y personal, hotel, policía);
     · las visitas anunciadas, con sus botones de siempre;
     · los huéspedes del hotel que llegan o se van hoy, con Ingresó/Salió;
     · y la línea del día: cada entrada y salida, con su hora.
   Todo sale de lo que la garita ya registra (el libro de guardia, de 00 a
   24 h) y de las llegadas sin aviso que el vecino contestó: no se carga
   nada dos veces.
   ========================================================= */
const CAT_MOV = {
  visita:    { n:'Visitas', icon:'users', c:'sky' },
  sinaviso:  { n:'Sin aviso', icon:'gate', c:'warn' },
  servicio:  { n:'Camión de residuos', icon:'tacho', c:'ok' },
  correo:    { n:'Correos', icon:'mail', c:'accent' },
  proveedor: { n:'Proveedores y personal', icon:'wrench', c:'wood' },
  hotel:     { n:'Hotel', icon:'star', c:'wood' },
  policia:   { n:'Policía', icon:'shield', c:'brand' },
};
function movimientosDeHoy(){
  const s = Store.s, ini = new Date(hoyISO() + 'T00:00').getTime(), out = [];
  aLista(s.bitacora).filter(b => b && b.tipo === 'acceso' && b.at >= ini).forEach(b => {
    const t = String(b.texto || ''), m = /^(Ingreso|Egreso|Salida)\b/i.exec(t); if (!m) return;
    const sale = !/^ingreso/i.test(m[1]);
    const cat = /cami[oó]n de residuos/i.test(t) ? 'servicio' : b.mensId ? 'correo' : /lleg[oó] sin aviso/i.test(t) ? 'sinaviso' : /polic[ií]a/i.test(t) ? 'policia'
      : /hotel|hu[eé]sped/i.test(t) ? 'hotel' : /frecuente|\((Proveedor|Personal|Delivery)/i.test(t) ? 'proveedor' : 'visita';
    let que = t.replace(/^(Ingreso|Egreso|Salida)\s*(frecuente)?\s*(:|del|de)?\s*/i, '').replace(/\s·\s\d{1,2}:\d{2} h\b.*$/, '').trim();
    que = que.charAt(0).toUpperCase() + que.slice(1);
    out.push({ id:b.id, at:b.at, sale, cat, texto:que });
  });
  aLista(s.llegadas).filter(l => l && (l.respondido || l.at) >= ini && l.estado !== 'consultando').forEach(l =>
    out.push({ id:l.id, at:l.respondido || l.at, sale:false, cat:'sinaviso', no: l.estado === 'rechazado',
      texto:`${l.nombre} → ${usuario(l.hostId)?.casa || ''} · ${l.estado === 'autorizado' ? 'el vecino dijo "que pase"' : l.noEsta ? 'el vecino no está en casa: no pasa' : 'el vecino NO lo autorizó'}` }));
  return out.sort((a, b) => b.at - a.at);
}
const filaMov = m => { const c = CAT_MOV[m.cat] || CAT_MOV.visita;
  return `<div class="ing2-mov ${m.sale ? 'sale' : 'entra'}${m.no ? ' no' : ''}"><time>${hora(m.at)}</time><span class="ing2-pt ic-${c.c}">${I(c.icon)}</span>
    <div class="txt"><b>${esc(m.texto)}</b><span><em class="ing2-dir">${I(m.no ? 'x' : m.sale ? 'logout' : 'login')}${m.no ? 'No entró' : m.sale ? 'Salió' : 'Entró'}</em>${esc(c.n)}</span></div></div>`; };
/* El autito de la escena de Ingresos de hoy (propio, como la van del hotel). */
const AUTO_SVG = `<svg class="ing2-auto" viewBox="0 0 92 40" aria-hidden="true"><path d="M8 28v-6c0-2 1.4-3.6 3.3-4l9-1.8L30 7.6C31.6 6.3 33.6 5.6 35.7 5.6h18c2.4 0 4.6 1 6.2 2.7l8.3 8.9 12 2.3c2.6.5 4.3 2.7 4.3 5.3V28a3 3 0 0 1-3 3H11a3 3 0 0 1-3-3Z" fill="var(--auto,#f2a46c)"/><path d="M32 16.5 38 9.5h9v7Zm19 0v-7h4c1.4 0 2.6.6 3.5 1.6l4.8 5.4Z" fill="#cfe9f5"/><circle cx="24" cy="31" r="6.4" fill="#1d2430"/><circle cx="24" cy="31" r="2.6" fill="#cfd6df"/><circle cx="70" cy="31" r="6.4" fill="#1d2430"/><circle cx="70" cy="31" r="2.6" fill="#cfd6df"/><rect x="80" y="21" width="5" height="3" rx="1.5" fill="#ffe28a"/></svg>`;
function bloqueIngresosHoy(lista, opera){
  const s = Store.s, hoy = hoyISO(), movs = movimientosDeHoy(), entradas = movs.filter(m => !m.sale && !m.no);
  const cuenta = Object.keys(CAT_MOV).map(k => [k, entradas.filter(m => m.cat === k).length]).filter(([, n]) => n);
  /* Los huéspedes del hotel de hoy: los que llegan y los que se van. */
  const hs = esGuardia() ? aLista(s.hotelHuespedes).filter(h => h && ((h.desde === hoy && !h.ingreso) || (h.hasta === hoy && h.ingreso && !h.salida))) : [];
  const nAnun = lista.length;
  /* INGRESOS DE HOY CON SU BARRERA (rediseño, pedido de Claudio,
     12-10-2026): arriba una escena con la ruta, la barrera que se abre y se
     cierra cuando pasa el autito, y los totales del día (entraron,
     salieron, adentro); las cuentas por tipo en fichas de color, y la línea
     del día con una flecha verde para lo que entra y gris para lo que sale. */
  const salidas = movs.filter(m => m.sale).length, adn = lista.filter(p => estadoPase(p) === 'adentro').length + aLista(s.llegadas).filter(llegadaAdentro).length;
  return `<span id="garIngresos" class="ancla"></span><section class="ing2">
    <div class="ing2-cab">
      <div class="ing2-escena${movs.length ? ' anda' : ''}" aria-hidden="true"><span class="ing2-ruta"></span>${AUTO_SVG}<span class="ing2-poste"></span><span class="ing2-brazo"></span></div>
      <div class="ing2-tit"><small>${I('gate')}En vivo, de 00 a 24 h</small><b>Ingresos de hoy</b></div>
      <div class="ing2-tot"><span class="in"><b>${entradas.length}</b>${I('login')}entraron</span><span class="out"><b>${salidas}</b>${I('logout')}salieron</span><span class="adn"><b>${adn}</b>${I('users')}visitas adentro</span></div>
    </div>
    ${cuenta.length ? `<div class="ing-cats ing2-cats">${cuenta.map(([k, n]) => `<span class="ing-cat c-${CAT_MOV[k].c}"><span class="ing2-ci">${I(CAT_MOV[k].icon)}</span><b>${n}</b><small>${esc(CAT_MOV[k].n)}</small></span>`).join('')}</div>` : ''}
    ${nAnun ? `<div class="lbl ing-sub">Visitas anunciadas (${nAnun})</div>${lista.map(p => tarjetaPase(p, { garita:true })).join('')}` : ''}
    ${hs.length ? `<div class="lbl ing-sub">Huéspedes del hotel hoy (${hs.length})</div><div class="card lista">${hs.map(h => { const va = !(h.desde === hoy && !h.ingreso);
      return `<div class="it"><span class="ic ic-wood" style="width:34px;height:34px;border-radius:11px;display:grid;place-items:center">${I('star')}</span><div class="txt"><b>${esc(h.nombre || 'Huésped')}</b><span>${h.patente ? esc(h.patente) + ' · ' : ''}${plural(+h.pax || 1, 'persona')} · ${va ? 'se va hoy' : 'llega hoy'}</span></div>
        ${opera ? `<button class="btn btn-xs ${va ? 'btn-sec' : 'btn-ok'}" data-a="${va ? 'hhuesped-salida' : 'hhuesped-ingreso'}" data-id="${esc(h.id)}">${I(va ? 'logout' : 'login')}${va ? 'Salió' : 'Ingresó'}</button>` : `<span class="pill p-sky">${va ? 'Se va hoy' : 'Llega hoy'}</span>`}</div>`; }).join('')}</div>` : ''}
    <div class="lbl ing-sub">Todo lo que entró y salió hoy</div>
    ${movs.length ? `<div class="ing2-linea">${movs.slice(0, 30).map(filaMov).join('')}</div>
      ${movs.length > 30 ? `<details class="ing-mas" data-k="ing-mas"><summary>Ver los ${movs.length - 30} anteriores</summary><div class="ing2-linea">${movs.slice(30).map(filaMov).join('')}</div></details>` : ''}`
      : vacio('gate', nAnun ? 'Todavía no entró ni salió nadie hoy.' : 'Nadie anunciado y todavía no entró ni salió nadie hoy.')}</section>`;
}
/* =========================================================
   LA TIRA DE LA GARITA (rediseño, pedido de Claudio, 12-10-2026: "turno
   mañana, policía, camión de basura y correos, con un diseño innovador,
   interactivo, fácil y con colores vivos"). Cuatro tarjetas de color, una
   por cosa, que dicen cómo está cada una y se tocan para hacerla:
     · el TURNO (sol de día, que gira despacio; luna de noche) con quiénes
       están y desde qué hora;
     · el POLICÍA: "nadie de servicio · registrar el ingreso" o, si está,
       sus rondas (tocarla baja a su tarjeta con todos los botones);
     · el CAMIÓN DE LA BASURA: si hoy pasa, lo dice; adentro, se pone verde,
       las ruedas giran y se toca para registrar la salida;
     · los CORREOS: registrar la entrada y cuántos hay adentro.
   Para la Administración y la supervisión es lo mismo, solo para mirar.
   Ideas de los paneles de homepage (23k★) y de meteocons (1.6k★, íconos
   que se mueven); el código es propio.
   ========================================================= */
function tiraGarita(opera){
  const t = turnoAbierto(), ahora = Date.now();
  const tarjeta = ({ cls, ic, tag, t:tt, x, a = '', v = '', id = '', on = false, n = '' }) => {
    const tagName = a ? 'button' : 'div', attrs = a ? ` type="button" data-a="${a}"${v ? ` data-v="${esc(v)}"` : ''}${id ? ` data-id="${esc(id)}"` : ''}` : '';
    return `<${tagName} class="tg-t ${cls}${on ? ' on' : ''}${a ? ' toca' : ''}"${attrs}><span class="tg-ic">${I(ic)}</span>${n !== '' ? `<span class="tg-n">${n}</span>` : ''}
      <span class="tg-txt"><small>${tag}</small><b>${tt}</b><em>${x}</em></span>${a ? `<span class="tg-ir">${I('right')}</span>` : ''}</${tagName}>`; };
  /* turno */
  const noche = t && turnoEsNoche(t.turno);
  /* 14-10: la guardia con el horario de cada uno; tocarla abre "La guardia de hoy" (entra / sale). */
  const rs = relevosDe(t), alerta = typeof alertasGuardia === 'function' ? alertasGuardia(t) : [];
  const tTurno = t ? tarjeta({ cls:'tg-turno ' + (noche ? 'noche' : 'dia') + (alerta.length ? ' tg-ojo' : ''), ic: noche ? 'moon' : 'sun', tag:'Guardia', t:esc(rs.map(r => String(r.n).split(' ')[0]).join(' · ') || 'Sin nombres'),
      x: alerta.length ? esc(alerta[0].corto) : esc(rs.map(r => `${r.h} hasta las ${hhCorto((horarioDe(r.h) || {}).hasta || '')} h`).join(' · ')), a:'guardia-hoy', on:true, n: alerta.length ? '!' : '' })
    : tarjeta({ cls:'tg-turno sin', ic:'clock', tag:'Guardia', t:'Nadie anotado', x:'La garita todavía no anotó quién está', a:'guardia-hoy' });
  /* policía */
  const ps = t ? policiasAdentro(t) : [], rondas = ps.reduce((k, p) => k + p.rondas.length, 0), enRonda = ps.map(rondaEnCurso).find(Boolean);
  const tPol = ps.length ? tarjeta({ cls:'tg-pol', ic:'shield', tag:'Policía', t: enRonda ? 'En ronda' : 'De servicio', x:`${esc(ps.map(p => p.nombre).join(', '))} · ${enRonda ? 'desde las ' + hora(enRonda.inicio) + ' h' : plural(rondas, 'ronda') + ' hoy'}`, a:'garita-ir', v:'.policia-card', on:true, n: rondas || '' })
    : tarjeta({ cls:'tg-pol', ic:'shield', tag:'Policía', t:'Nadie de servicio', x: (() => { const n = nochePolicia(); return opera ? (n.ahora ? `Horario de policía (${horarioNocheTxt(n)}): tocá cuando llegue` : `Viene a las ${hora(n.desde)} h · tocá para el ingreso`) : `${n.ahora ? 'En horario' : 'Desde las ' + hora(n.desde) + ' h'} · lo registra la garita`; })(), a: opera && t ? 'policia-nuevo' : '' });
  /* camión */
  const c = typeof Camion !== 'undefined' ? Camion.adentro() : null, dh = recoleccionDias()[new Date().getDay()];
  const paso = typeof camionPasoHoy === 'function' ? camionPasoHoy() : null;
  const tCam = c ? tarjeta({ cls:'tg-cam', ic:'tacho', tag:'Camión de la basura', t:'En el barrio', x:`${esc(c.patente || '')}${c.patente ? ' · ' : ''}entró ${hora(c.entra)} h · hace ${Math.max(1, Math.round((ahora - c.entra) / MIN))} min${opera ? ' · tocá al salir' : ''}`, a: opera ? 'camion-sale' : '', on:true })
    : tarjeta({ cls:'tg-cam', ic:'tacho', tag:'Camión de la basura', t: paso ? 'Ya pasó hoy' : dh ? 'Hoy pasa' : 'Hoy no pasa', x: paso ? `Entró a las ${hora(paso.entra)} h` : opera ? 'Tocá para registrar la entrada' : dh ? 'Todavía no entró' : 'Si viene igual, se registra', a: opera ? 'camion-entra' : '' });
  /* correos */
  const cor = typeof Mensajeria !== 'undefined' ? Mensajeria.adentro() : [];
  const tCor = tarjeta({ cls:'tg-cor', ic:'mail', tag:'Correos', t: cor.length ? plural(cor.length, 'adentro', 'adentro') : 'Ninguno adentro', x: cor.length ? esc(cor.map(nombreCorreo).join(', ')) : opera ? 'Tocá para registrar la entrada' : 'Andreani, OCA, Correo Argentino…', a: opera ? 'correo-menu' : cor.length ? 'garita-ir' : '', v: opera ? '' : '#garCorreos', on: cor.length > 0, n: cor.length || '' });
  return `<div class="tg" role="group" aria-label="Turno, policía, camión y correos">${tTurno}${tPol}${tCam}${tCor}</div>`;
}
/* EL CONTROL DE ACCESO (rediseño, pedido de Claudio, 12-10-2026: "con
   colores vivos, algo como el ingreso de las vans, con una barrera que se
   abre y se cierra"). La casilla parece una patente argentina; al tocarla
   la barrera de la escena se levanta y el semáforo pasa a verde, y al
   salir de la casilla baja. Debajo, los botones de siempre como fichas de
   color. El campo sigue siendo #qValidar (lo usan el lector de patentes y
   el recorrido guiado). Idea de las animaciones de la cochera del hotel. */
const botonVal = ({ a, v = '', ic, c, t }) => `<button type="button" class="val2-b c-${c}" data-a="${a}"${v ? ` data-v="${v}"` : ''}><span class="val2-bi">${I(ic)}</span><span>${t}</span></button>`;
function validadorGarita(){
  return `<form data-f="validar" class="val2">
    <div class="val2-escena" aria-hidden="true"><span class="val2-luz"><i></i><i></i></span><span class="val2-poste"></span><span class="val2-brazo"></span><span class="val2-piso"></span></div>
    <div class="val2-cab"><small>${I('gate')}Control de acceso</small><b>Código, patente o DNI</b><span>Escribilo y tocá la lupa: dice si tiene pase y a qué casa va.</span></div>
    <div class="val2-chapa"><span class="val2-pais"><i></i>AR</span><input name="q" id="qValidar" autocomplete="off" placeholder="482913" maxlength="12" inputmode="text" aria-label="Código, patente o DNI">
      <button class="val2-ir" aria-label="Buscar">${I('search')}</button></div>
    <div class="val2-acc">
      ${botonVal({ a:'escanear', ic:'scan', c:'brand', t:'Escanear QR' })}
      ${botonVal({ a:'patente-camara', ic:'camera', c:'sky', t:'Leer patente' })}
      ${botonVal({ a:'llegada-nueva', ic:'gate', c:'warn', t:'Llegó sin aviso' })}
      ${botonVal({ a:'hotel-cliente', ic:'star', c:'wood', t:'Va al hotel' })}
      ${hayPaquetes() ? botonVal({ a:'paquete-nuevo', ic:'box', c:'wood', t:'Llegó un paquete' }) : ''}
      ${botonVal({ a:'abrir', v:'frecuentes', ic:'qr', c:'accent', t:'Ingresos frecuentes' })}
      ${botonVal({ a:'hist-visitas-todo', ic:'clock', c:'ok', t:'Historial de visitas' })}
      ${botonVal({ a:'alerta-nueva', ic:'siren', c:'danger', t:'Aviso urgente' })}</div>
  </form>`;
}
A['garita-ir'] = el => { const d = document.querySelector(el.dataset.v); if (d) d.scrollIntoView({ behavior:'smooth', block:'start' }); else toast('Ahora no hay nada de eso en la garita', 'check'); };

R.garita = {
  titulo: 'Garita', icon: 'gate', color: 'brand', ancha: true, sub: () => fechaLarga(hoyISO()),
  alPintar(){ if (typeof precargarLectorPatente === 'function') precargarLectorPatente(); },
  render(){
    if (!veGarita()) return vacio('lock', 'La garita es solo para la guardia, la Administración y la supervisión.');
    if (esGuardia() && !turnoListo()) return formularioTurno();
    const s = Store.s, hoy = hoyISO();
    const lista = pasesEnPantalla(hoy).sort((a, b) => a.desde.localeCompare(b.desde));
    const adentro = lista.filter(p => estadoPase(p) === 'adentro').length;
    const esperados = lista.filter(p => estadoPase(p) === 'esperado').length;
    const paq = hayPaquetes() ? s.paquetes.filter(p => !p.retirado) : [];
    /* 18-10: la que pasó queda a la vista hasta que la garita marca que salió (ese mismo día). */
    const llegadas = s.llegadas.filter(l => l.estado === 'consultando' || Date.now() - l.at < 30 * MIN || llegadaAdentro(l));
    const solas = typeof casasSolas === 'function' ? casasSolas(hoy) : [];
    /* El aviso de "viene una visita sin aviso" queda todo el día (la visita
       puede venir a la noche); los demás, 6 horas como siempre. */
    const avisos = s.avisos.filter(a => a.tipo === 'visita' ? isoDe(new Date(a.at)) === hoy : Date.now() - a.at < 6 * HORA);
    const vol = s.avistamientos.filter(a => Date.now() - a.at < DIA);
    const u = yo();
    /* La Administración mira la garita en vivo, sin tocarla (soloGarita). */
    const opera = esGuardia();
    /* En computadora: el título arriba a la izquierda y, a su derecha, la
       lista del día en una columna que acompaña al bajar. En el celular,
       la lista va debajo del título. */
    return `<div class="garita-grid ${PILA.length === 1 ? '' : 'sin-titulo'}">
      ${PILA.length === 1 ? `<div class="garita-titulo titulo-vista"><h1>Garita</h1><p>${fechaLarga(hoy)}</p></div>` : ''}
      <aside class="garita-lado">${tareasGarita()}${bitacoraGarita()}</aside>
      <div class="garita-main">
      ${opera ? '' : `<div class="garita-vivo">${I('eye')}<div class="grow"><b>Garita en vivo · solo para mirar</b><span>Registrar ingresos${hayPaquetes() ? ', paquetes' : ''}, el camión, los correos, el policía, la bitácora y las peticiones es tarea exclusiva de la garita. Desde acá se ve todo al instante, sin tocar nada.</span></div>
        <button class="btn btn-xs btn-pri" data-a="abrir" data-v="privado" data-p="${esSupervisor() ? 'supGarita' : 'interno'}">${I('chat')}Escribirle a la garita</button></div>`}
      ${tiraGarita(opera)}
      ${bandaPolicia()}
      ${typeof bandaMantenimiento === 'function' ? bandaMantenimiento(opera) : ''}
      ${typeof bandaCorreos === 'function' ? bandaCorreos(opera, true) : ''}
      ${typeof bandaVansGarita === 'function' ? bandaVansGarita(opera) : ''}
      ${typeof bandaHotel === 'function' ? bandaHotel(opera) : ''}
      ${typeof bandaDeaEnCurso === 'function' ? bandaDeaEnCurso() : ''}
      ${typeof bandaCuidadoGarita === 'function' ? bandaCuidadoGarita() : ''}
      ${alertas().filter(alertaActiva).map(a => { const ay = destinatariosAlerta(a).filter(v => a.respuestas?.[v.id]?.r === 'ayuda').length;
        return aviso(ay ? 'danger latido' : 'warn', 'siren', `Aviso urgente activo: ${esc(a.titulo)}`, `${esc(a.zona)} · ${ay ? plural(ay, 'casa pide', 'casas piden') + ' ayuda' : 'nadie pidió ayuda'}`, `<button class="btn btn-xs btn-sec" data-a="abrir" data-v="alertas">Ver respuestas</button>`); }).join('')}
      ${Clima.alertas().map(a => aviso(a.nivel, a.icon, a.t, a.x)).join('')}
      ${tableroVisitas(lista, paq.length)}
      ${opera ? validadorGarita() : `<div class="val2-acc solo-mirar">
          ${botonVal({ a:'hist-visitas-todo', ic:'clock', c:'ok', t:'Historial de visitas' })}
          ${botonVal({ a:'abrir', v:'bitacora', ic:'book', c:'wood', t:'Bitácora' })}
          ${botonVal({ a:'abrir', v:'frecuentes', ic:'qr', c:'accent', t:'Ingresos frecuentes' })}</div>`}
      ${typeof mapaBarrio === 'function' ? mapaBarrio() : ''}
      ${s.peticiones.filter(p => p.estado === 'pendiente').map(p => aviso('warn latido', 'edit', `Petición de ${esc(p.casa)} sin recibir`, esc(TIPOS_PET[p.tipo]?.n || '') + (opera ? '' : ' · la recibe y la firma la garita'), `<button class="btn btn-xs btn-sec" data-a="ver-peticion" data-id="${p.id}">${opera ? 'Leer y firmar' : 'Ver'}</button>`)).join('')}
      ${s.obras.filter(o => o.avisoHoy?.fecha === hoy).map(o => aviso('info', 'truck', `Obra en ${esc(enObra(o))}: ${esc(o.avisoHoy.texto)}`, o.avisoHoy.hora ? `Desde las ${o.avisoHoy.hora} h · ${esc(o.empresa || '')}` : esc(o.empresa || ''))).join('')}
      ${(() => { const rs = s.peticiones.filter(p => p.tipo === 'nopasar' && p.estado === 'en_funciones' && (!p.hasta || p.hasta >= hoy)); return rs.length ? sec('Restricciones de ingreso vigentes') + rs.map(p => `<button class="superficie peligro" data-a="ver-peticion" data-id="${p.id}"><span class="ic ic-danger">${I('x')}</span><span class="txt"><b>${esc(p.casa)}</b><small>${esc(p.texto.slice(0, 90))}</small></span>${I('right')}</button>`).join('') : ''; })()}
      ${llegadas.length ? '<span id="garLlegadas" class="ancla"></span>' + sec('Consultando al vecino') + llegadas.map(l => { const h = usuario(l.hostId) || {}; const min = Math.floor((Date.now() - l.at) / MIN);
        return `<div class="card" style="padding:13px 14px"><div class="pase"><span class="ic ic-warn">${I('gate')}</span><div class="datos"><b>${esc(l.nombre)} → ${esc(h.casa || '')}</b><span>${esc(l.motivo || '')}${l.patente ? ' · ' + esc(l.patente) : ''} · hace ${min} min</span></div>
          <span class="estado e-${l.sale ? 'salio' : l.estado}">${l.sale ? `Salió ${hora(l.sale)}` : { consultando:'Esperando', autorizado:'Adentro', rechazado: l.noEsta ? 'No está en casa' : 'No autorizado' }[l.estado]}</span></div>${l.respondio ? `<div class="muted tiny" style="margin-top:6px">Contestó ${esc(nombreDe(l.respondio))}${l.sale ? ` · salió ${hora(l.sale)} h` : ''}</div>` : ''}
          ${l.estado === 'autorizado' && !l.sale ? (opera ? `<div class="btns" style="margin-top:10px"><button class="btn btn-sm btn-sec" data-a="llegada-salio" data-id="${esc(l.id)}">${I('logout')}Salió</button></div>` : `<div class="muted tiny" style="margin-top:6px">${I('users')} Está adentro</div>`) : ''}
          ${opera && l.estado === 'consultando' && min >= 2 ? (() => {
            /* A los 2 min, "Llamar" a cada uno de los que viven en el lote; a los 3, la app ya les insistió con sonido (regla llegada-3min). */
            const tels = paraElLote(l.lote || h.casa, l.hostId).map(usuario).filter(v => v && v.tel);
            return `<div class="btns" style="margin-top:10px">${tels.map(v => `<a class="btn btn-sm btn-sec" href="${telLink(v.tel)}">${I('phone')}Llamar a ${esc(v.nombre.split(' ')[0])}</a>`).join('')}${min >= 3 ? `<span class="pill p-warn">Se les insistió con sonido</span>` : ''}</div>`; })() : ''}</div>`; }).join('') : ''}
      ${hcGaritaHtml(opera)}
      ${avisos.length ? '<span id="garAvisos" class="ancla"></span>' + sec('Avisos de vecinos') + avisos.map(a => { const v = usuario(a.userId) || {}, t = AVISOS_GUARDIA[a.tipo] || AVISOS_GUARDIA.otro;
        return `<div class="card" style="padding:12px 14px"><div class="pase"><span class="ic ic-warn">${I(t.icon)}</span><div class="datos"><b>${esc(v.casa || '')}: ${t.t}</b><span>${esc(a.texto || t.x)} · ${hace(a.at)}</span></div>
          ${a.visto ? `<span class="estado e-autorizado">Visto</span>` : opera ? `<button class="btn btn-xs btn-ok" data-a="aviso-visto" data-id="${a.id}">Visto</button>` : `<span class="estado e-consultando">Sin ver</span>`}</div>
          ${opera && a.tipo === 'visita' ? `<div class="btns" style="margin-top:8px"><button class="btn btn-sm btn-pri" data-a="aviso-llego" data-id="${a.id}">${I('gate')}Llegó: preguntarle al vecino</button></div>` : ''}</div>`; }).join('') : ''}
      ${bloqueIngresosHoy(lista, opera)}
      ${paq.length ? '<span id="garPaquetes" class="ancla"></span>' + sec('Paquetes en la garita', opera ? `<button class="link" data-a="escanear" data-v="Apuntá al QR de retiro del vecino (cambia cada 30 segundos)">${I('scan')}Leer QR de retiro</button>` : '') + paq.map(p =>
 `<div class="card" style="padding:12px 14px"><div class="pase"><span class="ic ic-wood">${I('box')}</span>
        <div class="datos"><b>${esc(loteDelPaquete(p))} · ${esc(p.empresa)}</b><span>${esc(p.detalle || '')} · llegó ${hace(p.recibido)}</span></div>
        ${opera ? `<button class="btn btn-xs btn-ok" data-a="paquete-entregar" data-id="${p.id}">${I('qr')}Entregar</button>` : `<span class="estado e-esperado">En la garita</span>`}</div></div>`).join('') : ''}

      ${solas.length && typeof bandaCasasSolas === 'function' ? '<span id="garCasas" class="ancla"></span>' + bandaCasasSolas(opera) : ''}
      ${vol.length ? sec('Avistamientos de hoy') + vol.map(a => `<div class="card plana" style="padding:10px 14px"><b>${esc(ESPECIES[a.especie]?.n || a.especie)}</b> · ${esc(a.lugar || '')} <span class="muted small">· ${hace(a.at)}</span></div>`).join('') : ''}
      ${PILA.length === 1 ? masGarita(s, u) : ''}
      </div></div>`;
  },
};
/* =========================================================
   "MÁS" DE LA GARITA, POR URGENCIA (pedido de Claudio, 10-10-2026: eligió
   la opción A de las propuestas; ideas de Homer, 11k★, homepage, 33k★, y
   cmdk, 13k★, en GitHub; el código es propio). Antes eran 14 tejas iguales,
   una al lado de la otra. Ahora, en tres grupos:
     · PARA ATENDER AHORA: lo que espera una respuesta (peticiones,
       mensajes de vecinos, de la Administración y de la supervisión). Si
       hay algo, la teja se pinta y lleva el número; si no, dice "Al día";
     · CONSULTAR: buscar un vecino, el pizarrón, vuelos, emergencias, el
       reglamento, el hotel y el manual;
     · REGISTROS Y CONTROL: bitácora, turnos, proveedores, obras y cerrar
       el turno.
   Arriba, un buscador: "bit" deja solo la Bitácora y con Enter la abre.
   ========================================================= */
let masQ = '';
/* "AL DÍA" (pedido de Claudio, 12-10-2026: "que sea más convincente, con un
   acabado innovador"). Un sello verde con la tilde que se dibuja sola, un
   brillo que lo cruza y un anillo que respira: se entiende de lejos que no
   hay nada esperando. Con algo pendiente, en su lugar va el número en rojo
   que late y la campanita se mueve. */
const selloAlDia = () => `<span class="al-dia" role="status"><svg class="al-dia-ck" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M7 12.4l3.3 3.3L17.2 8.8"/></svg><b>Al día</b><small>nada esperando</small></span>`;
function masGarita(s, u){
  const petPend = s.peticiones.filter(p => p.estado === 'pendiente').length;
  const msjVec = s.privados.filter(h => (h.con || 'admin') === 'guardia').reduce((n, h) => n + aLista(h.msgs).filter(m => m.from === 'vecino' && !m.leido).length, 0);
  const msjAdm = esGuardia() ? s.privados.filter(h => h.con === 'interno' && h.userId === u.id).reduce((n, h) => n + aLista(h.msgs).filter(m => m.from === 'admin' && !m.leido).length, 0) : 0;
  const msjSup = esGuardia() && typeof haySupervision === 'function' && haySupervision() ? sinLeerDeSupervision('supGarita') : 0;
  const pizNuevos = s.posts.filter(p => p.createdAt > (Store.sesion.pizarronVisto || 0) && p.autor !== u.id && !(typeof postVencido === 'function' && postVencido(p))).length;
  const artMal = s.proveedores.filter(p => artEstado(p)[1] === 'danger').length;
  const urge = (o, n, sTxt) => teja({ ...o, badge:n, destaca: n > 0, s: n > 0 ? sTxt : 'Al día' });
  const atender = [
    urge({ v:'peticiones', icon:'edit', color:'warn', t:'Peticiones', busca:'firmar recibir pedidos' }, petPend, 'Recibir y firmar'),
    urge({ v:'privado', icon:'lock', color:'accent', t:'Mensajes con vecinos', busca:'chat lote avisar' }, msjVec, 'Vecinos esperan respuesta'),
    esGuardia() ? urge({ v:'privado', p:'interno', icon:'sliders', color:'accent', t:'Administración', busca:'mensajes admin' }, msjAdm, 'Te escribió la Administración') : '',
    esGuardia() && typeof haySupervision === 'function' && haySupervision() ? urge({ v:'privado', p:'supGarita', icon:'eye', color:'brand', t:'Supervisión', busca:'mensajes supervisor' }, msjSup, 'Te escribió la supervisión') : '',
  ].filter(Boolean);
  const consultar = [
    teja({ v:'vecinos', icon:'search', color:'brand', t:'Buscar un vecino', s:'Dirección y teléfonos', busca:'apellido lote calle guia padron' }),
    teja({ v:'mapa', icon:'map', color:'sky', t:'Mapa del barrio', s:'Lotes y calles en vivo', busca:'mapa plano lotes calles donde queda' }),
    teja({ v:'pizarron', icon:'muro', t:'Pizarrón', s:'Avisos del barrio', badge:pizNuevos, busca:'aviso guardia publicar' }),
    teja({ v:'vuelos', icon:'send', color:'accent', t:'Vuelos USH', s:'Arribos y partidas', n: typeof Vuelos !== 'undefined' && Vuelos.cuantosHoy ? Vuelos.cuantosHoy() || '' : '', busca:'avion aeropuerto' }),
    teja({ v:'emergencias', icon:'siren', color:'danger', t:'Emergencias', s:'Teléfonos y DEA', busca:'telefonos dea 911 bomberos' }),
    teja({ v:'documentos', icon:'file', color:'brand', t:'Reglamento', s:'Normas y protocolos', busca:'normas protocolo' }),
    teja({ v:'hotel-vivo', icon:'star', color:'wood', t:HOTEL_NOMBRE, s:'Vans, huéspedes y eventos', busca:'hotel vans huespedes traslados' }),
    teja({ v:'manual', icon:'book', color:'accent', t:'Manual de uso', s:'El capítulo de la garita', busca:'ayuda como se usa' }),
  ];
  const registros = [
    teja({ v:'bitacora', icon:'book', color:'wood', t:'Bitácora', s:'El libro de hoy', busca:'libro guardia novedades' }),
    teja({ v:'turnos', icon:'clock', color:'sky', t:'Turnos', s:'Horarios y quién trabajó', busca:'policia rondas guardias' }),
    teja({ v:'proveedores', icon:'box', color:'accent', t:'Proveedores', s: artMal ? 'Hay ART vencida' : 'Controlar ART', n: artMal || '', busca:'art seguro empresas' }),
    teja({ v:'obras', icon:'wrench', color:'wood', t:'Obras', s:'Avisos del día', busca:'mixer construccion' }),
    esGuardia() ? teja({ a:'guardia-hoy', icon:'users', color:'brand', t:'La guardia de hoy', s:'Quién entra, quién sale y sus horarios', busca:'relevo turno horario entra sale guardia' }) : '',
    esGuardia() ? teja({ a:'cerrar-turno', icon:'clock', color:'warn', t:'Cerrar la guardia', s:'Se van todos, sin salir de la app', busca:'terminar turno parte' }) : '',
  ].filter(Boolean);
  const nAt = petPend + msjVec + msjAdm + msjSup;
  const grupo = (cls, ic, t, extra, tejas) => `<div class="mas-grupo ${cls}"><div class="mas-tit">${I(ic)}<b>${t}</b>${extra}</div><div class="mosaico">${tejas.join('')}</div></div>`;
  const html = `${sec('Más')}<div class="mas-garita">
    <div class="mas-busca">${I('search')}<input id="masBuscar" type="search" value="${esc(masQ)}" placeholder="¿Qué buscás? bitácora, vuelos, hotel…" autocomplete="off" aria-label="Buscar en Más" enterkeyhint="go"></div>
    ${grupo('g-atender' + (nAt ? ' hay' : ' al-dia-g'), 'bell', 'Para atender ahora', nAt ? `<span class="at-n" role="status">${nAt}<small>${nAt === 1 ? 'espera' : 'esperan'}</small></span>` : selloAlDia(), atender)}
    ${grupo('g-consultar', 'search', 'Consultar', '', consultar)}
    ${grupo('g-registros', 'book', 'Registros y control', '', registros)}
    <p class="muted small mas-nada" hidden>No hay nada con esa palabra. Probá con otra.</p></div>`;
  return html;
}
/* El buscador del "Más": filtra mientras escribís; Enter abre la primera. */
function filtrarMas(){
  const i = document.getElementById('masBuscar'); if (!i) return;
  masQ = i.value; const q = normTxt(masQ).trim(), ws = q.split(/\s+/).filter(Boolean);
  let total = 0;
  document.querySelectorAll('.mas-garita .mas-grupo').forEach(g => { let n = 0;
    g.querySelectorAll('.teja[data-busca]').forEach(t => { const ok = !ws.length || ws.every(w => t.dataset.busca.includes(w)); t.hidden = !ok; if (ok) n++; });
    g.hidden = !n; total += n; });
  const nada = document.querySelector('.mas-garita .mas-nada'); if (nada) nada.hidden = total > 0;
}
document.addEventListener('input', e => { if (e.target && e.target.id === 'masBuscar') filtrarMas(); });
document.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target && e.target.id === 'masBuscar'){ e.preventDefault();
  const t = document.querySelector('.mas-garita .teja[data-busca]:not([hidden])'); if (t){ masQ = ''; t.click(); } } });
F['validar'] = d => validar(d.q);
/* Peticiones firmadas de "no dejar pasar" que siguen en funciones. */
function restriccionPara(nombre = '', dni = '', patente = ''){
  const n = normTxt(nombre).split(/\s+/).filter(w => w.length > 2), d = soloDigitos(dni), pa = normPatente(patente);
  return Store.s.peticiones.find(p => p.tipo === 'nopasar' && p.estado === 'en_funciones' && (!p.hasta || p.hasta >= hoyISO()) && (() => {
    const t = normTxt(p.texto), td = soloDigitos(p.texto), tp = normPatente(p.texto);
    return (d.length >= 7 && td.includes(d)) || (pa.length >= 6 && tp.includes(pa)) || (n.length >= 2 && n.filter(w => t.includes(w)).length >= 2);
  })());
}
const avisoRestriccion = r => r ? aviso('danger latido', 'x', `NO DEJAR PASAR · pedido de ${esc(r.casa)}`, esc(r.texto), `<button class="btn btn-xs btn-sec" data-a="ver-peticion" data-id="${r.id}">Ver petición firmada</button>`) : '';
function validar(q){
  const s = Store.s, hoy = hoyISO();
  const txt = String(q || '').trim().replace(/^BHC:/i, '');
  const dig = soloDigitos(txt), pat = normPatente(txt);
  if (!txt){ toast('Escribí un código, una patente o un DNI', 'search'); return; }
  /* Pase fijo de un ingreso frecuente (F-…), credencial de vecino (V-…) o
     QR del hotel (H-…: sus vans y proveedores). */
  if (typeof validarCodigoEspecial === 'function' && validarCodigoEspecial(txt)) return;
  /* Una patente de una van, un proveedor o un huésped del hotel. */
  if (typeof hotelValidar === 'function' && pat.length >= 6 && !s.pases.some(p => !p.cancelado && normPatente(p.patente) === pat) && hotelValidar(pat)) return;
  const pases = s.pases.filter(p => !p.cancelado && ((dig.length === 6 && p.codigo === dig) || (pat.length >= 6 && normPatente(p.patente) === pat) || (dig.length >= 7 && p.dni === dig)));
  const vecino = pat.length >= 6 ? s.users.find(u => (u.vehiculos || []).some(v => normPatente(v.patente) === pat)) : null;
  if (!pases.length && !vecino){
    /* Lo que se buscó, a la vista (sobre todo si lo leyó la cámara), y la
       patente ya cargada en "Registrar llegada sin aviso". */
    const esPat = typeof patenteDeTexto === 'function' && patenteDeTexto(txt) === pat && pat.length >= 6;
    hoja('Sin coincidencias', `${esPat ? `<div class="pat-leida">${I('car')}<b>${esc(verPatente(pat))}</b></div>` : ''}${avisoRestriccion(restriccionPara('', dig, pat))}${aviso('danger', 'x', 'No hay ningún pase con ese dato', 'Si dice venir a una casa, registrá la llegada y consultamos al vecino.')}
      <button class="btn btn-pri btn-block" data-a="llegada-nueva" data-pat="${esPat ? esc(pat) : ''}">${I('gate')}Registrar llegada sin aviso</button>
      <button class="btn btn-sec btn-block" style="margin-top:8px" data-a="hotel-cliente" data-pat="${esPat ? esc(pat) : ''}">${I('star')}Va al hotel (restaurante o spa)</button>
      ${esPat ? `<button class="btn btn-sec btn-block" data-a="patente-camara" style="margin-top:8px">${I('camera')}No es esa: leer otra vez</button>` : ''}`); return;
  }
  const restr = pases.map(p => restriccionPara(p.nombre, p.dni, p.patente)).find(Boolean) || restriccionPara('', dig, pat);
  hoja('Resultado', `${avisoRestriccion(restr)}${vecino ? aviso('ok', 'car', `Vehículo de vecino: ${esc(vecino.casa)}`, `${esc(vecino.nombre)} · ${esc((vecino.vehiculos.find(v => normPatente(v.patente) === pat) || {}).modelo || '')}`) : ''}
    ${pases.map(p => {
      const valido = paseValidoEn(p, hoy), est = estadoPase(p), dentroHora = ahoraMin() >= minutosDe(p.desde) - 30 && ahoraMin() <= minutosDe(p.hasta) + 30;
      return `${!valido ? aviso('danger', 'alert', 'Este pase no es para hoy', p.dias?.length ? `Días: ${p.dias.map(d => DIAS[d]).join(', ')}` : `Es para el ${fechaLarga(p.fecha)}`) : !dentroHora && est === 'esperado' ? aviso('warn', 'clock', 'Fuera del horario anunciado', `${p.desde} a ${p.hasta}`) : ''}
        ${(() => { if (p.tipo !== 'proveedor') return ''; const pr = Store.s.proveedores.find(x => normTxt(p.nombre).includes(normTxt(x.empresa)) || normTxt(x.empresa).includes(normTxt(p.nombre)));
          if (!pr) return aviso('warn', 'box', 'Proveedor no habilitado', 'No figura en la lista de proveedores. Pedí la constancia de ART.');
          const [t, c] = artEstado(pr); return aviso(c === 'ok' ? 'ok' : c === 'danger' ? 'danger' : 'warn', 'box', `${esc(pr.empresa)}: ${t}`, pr.personal ? 'Personal: ' + esc(String(pr.personal).split('\n').join(', ')) : ''); })()}
        ${tarjetaPase(p, { garita:true })}${p.nota ? `<p class="small" style="margin:-4px 4px 12px"><b>Nota:</b> ${esc(p.nota)}</p>` : ''}`;
    }).join('')}`);
}
A['pase-in'] = el => { const p = Store.s.pases.find(x => x.id === el.dataset.id);
  if (p && ['vencido', 'nollego'].includes(estadoPase(p))){ toast('El pase venció: usá "Pase vencido" para avisarle al vecino', 'clock'); return; }
  movimiento(el.dataset.id, 'in'); };
A['pase-vencido'] = el => {
  const p = Store.s.pases.find(x => x.id === el.dataset.id); if (!p) return;
  const v = usuario(p.hostId) || {};
  hoja('Pase vencido', `${aviso('warn', 'clock', `${esc(p.nombre)} · ${esc(TIPOS_PASE[p.tipo]?.n || '')}`, `Autorizó ${esc(p.autoriza || v.nombre || 'el vecino')} · ${esc(v.casa || '')} · era de ${esc(p.desde)} a ${esc(p.hasta)} h`)}
    <button class="btn btn-pri btn-block btn-grande" data-a="pase-vencido-avisar" data-id="${p.id}" data-v="garita">${I('gate')}Está en la garita: preguntarle al vecino</button>
    <button class="btn btn-sec btn-block" style="margin-top:8px" data-a="pase-vencido-avisar" data-id="${p.id}" data-v="aviso">${I('bell')}No vino: solo avisarle que venció</button>
    <p class="muted tiny" style="margin-top:10px">Al vecino le llega al celular. Si está en la garita, le aparece "Que pase" / "No lo conozco", como una llegada sin aviso.</p>`);
};
A['pase-vencido-avisar'] = el => {
  if (!soloGarita()) return;
  const p0 = Store.s.pases.find(x => x.id === el.dataset.id); if (!p0) return;
  const enGarita = el.dataset.v === 'garita', at = Date.now();
  Store.cambiar(s => {
    const p = s.pases.find(x => x.id === p0.id); if (!p) return;
    p.vencidoAviso = { at, fecha:hoyISO(), tipo: enGarita ? 'garita' : 'aviso', por:yo().id };
    const casa = usuario(p.hostId)?.casa || '';
    if (enGarita){
      const lid = uid();
      s.llegadas.unshift({ id:lid, hostId:p.hostId, lote:casa, nombre:p.nombre, patente:p.patente || '', motivo:`Pase vencido (era de ${p.desde} a ${p.hasta} h)`, at, estado:'consultando', paseId:p.id }); LlegadaInsiste.anotar(lid);
      notificar(s, { para:paraElLote(casa, p.hostId), titulo:`En la garita: ${p.nombre} (pase vencido)`, texto:`El pase era de ${p.desde} a ${p.hasta} h · ¿Lo dejamos pasar?`, icon:'gate', color:'warn', urgente:true, link:'llegada:' + lid, llegadaId:lid });
    } else notificar(s, { para:p.hostId, titulo:`Venció el pase de ${p.nombre}`, texto:`Era de ${p.desde} a ${p.hasta} h y no ingresó. Si todavía viene, cambiale el horario o hacé uno nuevo.`, icon:'clock', color:'warn', link:'visitas', sonido:true });
    s.bitacora.unshift({ id:uid(), autor:yo().id, tipo:'acceso', texto:`Pase vencido: ${p.nombre} → ${casa} · ${enGarita ? 'se presentó; se consultó al vecino' : 'no ingresó; se avisó al vecino'}`, at });
  });
  cerrarHoja(); toast(enGarita ? 'Consultando al vecino…' : 'Le avisamos al vecino que el pase venció', 'send');
};
A['pase-out'] = el => movimiento(el.dataset.id, 'out');
function movimiento(id, tipo){
  const hoy = hoyISO();
  Store.cambiar(s => {
    const p = s.pases.find(x => x.id === id); if (!p) return;
    p.log = p.log || {}; p.log[hoy] = p.log[hoy] || {}; p.log[hoy][tipo] = Date.now();
    const casa = usuario(p.hostId)?.casa || '';
    notificar(s, { para:p.hostId, titulo: tipo === 'in' ? `${p.nombre} entró al barrio` : `${p.nombre} salió del barrio`, texto:`${hora(Date.now())} h`, icon: tipo === 'in' ? 'login' : 'logout', color:'ok', link:'visitas' });
    s.bitacora.unshift({ id:uid(), autor:yo().id, tipo:'acceso', texto:`${tipo === 'in' ? 'Ingreso' : 'Egreso'}: ${p.nombre} (${TIPOS_PASE[p.tipo]?.n || ''}) → ${casa} · autorizó ${p.autoriza || nombreDe(p.hostId)}${p.patente ? ' · ' + p.patente : ''}`, at:Date.now() });
  });
  cerrarHoja();
  toast(tipo === 'in' ? 'Ingreso registrado. El vecino ya fue avisado.' : 'Salida registrada', tipo === 'in' ? 'login' : 'logout');
}
/* Solo quienes viven en el lote: al propietario a distancia no se le consulta quién entra. */
const opcionesCasas = (sel = '') => habitantesAprobados().filter(u => !esPropDistancia(u)).sort((a, b) => a.casa.localeCompare(b.casa, 'es', { numeric:true }))
  .map(u => `<option value="${u.id}" ${u.id === sel ? 'selected' : ''}>${esc(u.casa)} · ${esc(u.nombre)}</option>`).join('');
/* Todos los lotes del padrón, estén o no registrados en la app. */
const opcionesLotes = (sel = '') => LOTES.map(l => `<option value="Lote ${l.lote}" ${'Lote ' + l.lote === sel ? 'selected' : ''}>${esc(nombreLote(l))}${propietarioDe('Lote ' + l.lote) ? ' · ' + esc(propietarioDe('Lote ' + l.lote)) : ''}</option>`).join('');
A['llegada-nueva'] = el => hoja('Llegó alguien sin aviso', `<form data-f="llegada">
  <div class="field"><label>¿A qué casa va?</label><select name="hostId" required>${opcionesCasas(el?.dataset?.u || '')}</select></div>
  <div class="field"><label>Nombre</label><input name="nombre" required maxlength="60" value="${esc(el?.dataset?.p || '')}"></div>
  <div class="grid2"><div class="field"><label>Patente</label><input name="patente" maxlength="10" style="text-transform:uppercase" value="${esc(el?.dataset?.pat ? verPatente(el.dataset.pat) : '')}"></div>
    <div class="field"><label>Motivo</label><select name="motivo"><option>Visita</option><option>Delivery</option><option>Uber / DiDi / taxi</option><option>Proveedor / obra</option><option>Correo / paquete</option><option>Otro</option></select></div></div>
  <button class="btn btn-pri btn-block">${I('send')}Consultar al vecino</button>
  <p class="muted tiny" style="margin:10px 0 0">A todos los que viven en ese lote se les abre una ventana con "Que pase" o "No estoy en casa" (y "No lo conozco"), y el celular les suena sin parar hasta que alguien conteste. Vale la respuesta del primero.</p></form>`);
/* Las cuentas que viven en el lote (más el elegido, por si no figura con ese lote). */
const paraElLote = (casa, hostId) => { const us = residentesDelLote(casa).map(u => u.id); if (hostId && !us.includes(hostId)) us.push(hostId); return us; };
const llegadaDeMiLote = (l, u = yo()) => !!l && !!u && (l.hostId === u.id || (!!l.lote && l.lote === u.casa && !esPropDistancia(u)));
F['llegada'] = d => {
  const r = restriccionPara(d.nombre, '', d.patente);
  if (r){ hoja('Atención', `${avisoRestriccion(r)}<p class="small">No se consulta al vecino: hay un pedido firmado para no dejar pasar a esta persona.</p>`);
    Store.cambiar(s => { s.bitacora.unshift({ id:uid(), autor:yo().id, tipo:'incidente', texto:`Se presentó ${d.nombre.trim()} (restricción de ${r.casa}). No ingresó.`, at:Date.now() });
      notificar(s, { para:r.userId, titulo:'Se presentó en la garita alguien con restricción', texto:d.nombre.trim(), icon:'x', color:'danger', urgente:true, link:'peticiones' }); });
    return; }
  /* A todo el lote (10-10-2026): le llega a cada uno que vive ahí, no solo al elegido. */
  const casa = usuario(d.hostId)?.casa || '', id = uid();
  Store.cambiar(s => {
    const l = { id, hostId:d.hostId, lote:casa, nombre:d.nombre.trim(), patente:(d.patente || '').toUpperCase(), motivo:d.motivo, at:Date.now(), estado:'consultando' };
    if (d.porLote) l.porLote = true;
    s.llegadas.unshift(l); LlegadaInsiste.anotar(id);
    notificar(s, { para:paraElLote(casa, d.hostId), titulo:`En la garita: ${d.nombre.trim()}`, texto:`${d.motivo}${casa ? ' · ' + casa : ''} · ¿Lo dejamos pasar?`, icon:'gate', color:'warn', urgente:true, link:'llegada:' + id, llegadaId:id });
  });
  cerrarHoja(); toast('Consultando al vecino…', 'send');
};
/* =========================================================
   "VA AL HOTEL" EN UN TOQUE (pedido de Claudio, 18-10-2026)
   La gente que viene a desayunar, almorzar, merendar, cenar o al spa del
   hotel no es visita de nadie y nadie sabe cuándo ni cuántos vienen. La
   garita los anota en unos 10 segundos: patente (con la cámara o
   escrita), para qué viene y cuántos son. Al hotel le llega en vivo
   "Llegan 2 al restaurante · Fiat Cronos AB 123 CD", y queda en el libro
   de guardia como "Cliente del hotel". Mientras están adentro se ven en la
   garita con "Salió". El hotel no ve nada más que ese aviso.
   ========================================================= */
const HC_MOTIVOS = [['desayuno', 'Desayuno', '☕'], ['almuerzo', 'Almuerzo', '🍽️'], ['merienda', 'Merienda', '🧁'], ['cena', 'Cena', '🍷'], ['spa', 'Spa', '💆']];
const hcMotivo = m => HC_MOTIVOS.find(x => x[0] === m) || HC_MOTIVOS[1];
/* Lo que se sugiere según la hora (se cambia con un toque). */
const hcSugerido = (h = new Date().getHours() + new Date().getMinutes() / 60) => h >= 5 && h < 11 ? 'desayuno' : h >= 11 && h < 15.5 ? 'almuerzo' : h >= 15.5 && h < 19.5 ? 'merienda' : 'cena';
const hcLugar = m => m === 'spa' ? 'al spa' : 'al restaurante';
const hcPat = x => String(x || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 9);
let hcBorrador = null, patenteDestino = null;
/* Los clientes del hotel que entraron hoy y todavía no salieron (salen del libro de guardia). */
function hcAdentro(){
  const ini = new Date(hoyISO() + 'T00:00').getTime(), hoy = aLista(Store.s.bitacora).filter(b => b && b.at >= ini && b.tipo === 'acceso');
  const salieron = new Set(hoy.filter(b => b.hcRef).map(b => b.hcRef));
  return hoy.filter(b => b.hc && !salieron.has(b.id)).sort((a, b) => a.at - b.at);
}
A['hotel-cliente'] = el => {
  if (!esGuardia()) return;
  const b = hcBorrador || {}, pat = hcPat(b.patente || el?.dataset?.pat || ''), m = b.motivo || hcSugerido(), n = +b.personas || 2;
  hoja('Va al hotel', `<form data-f="hotel-cliente" class="hc">
    <div class="hc-pat"><input name="patente" class="hc-chapa" maxlength="10" autocomplete="off" placeholder="AB 123 CD" value="${esc(pat ? verPatente(pat) : '')}" aria-label="Patente">
      <button type="button" class="btn btn-sec" data-a="hc-camara">${I('camera')}Leer</button></div>
    <input name="auto" class="hc-auto" maxlength="40" autocomplete="off" placeholder="Auto (opcional): Fiat Cronos gris" value="${esc(b.auto || '')}">
    <div class="hc-lbl">¿A qué viene?</div>
    <div class="hc-motivos" role="radiogroup">${HC_MOTIVOS.map(([k, t, e], i) => `<label style="--i:${i}"><input type="radio" name="motivo" value="${k}" ${k === m ? 'checked' : ''}><span><em>${e}</em><b>${t}</b></span></label>`).join('')}</div>
    <div class="hc-lbl">¿Cuántas personas?</div>
    <div class="hc-pers" role="radiogroup">${[1, 2, 3, 4, 5, 6, 8, 10].map(k => `<label><input type="radio" name="personas" value="${k}" ${k === n ? 'checked' : ''}><span>${k}${k >= 6 ? '+' : ''}</span></label>`).join('')}</div>
    <button class="btn btn-pri btn-block btn-grande">${I('check')}Pasa al hotel</button>
    <p class="muted tiny" style="margin:10px 0 0">${I('star')} Al hotel le llega en vivo cuántos llegan y para qué, con la patente. Queda en el libro de guardia como "Cliente del hotel". No es visita de ningún vecino.</p></form>`);
  hcBorrador = null;
};
/* Leer la patente con la cámara y volver al formulario con lo que ya estaba elegido. */
A['hc-camara'] = el => {
  const f = el.closest('form'); if (!f) return;
  hcBorrador = { patente:f.patente.value, auto:f.auto.value, motivo:f.querySelector('[name=motivo]:checked')?.value, personas:f.querySelector('[name=personas]:checked')?.value };
  patenteDestino = p => { hcBorrador = { ...(hcBorrador || {}), patente:p }; A['hotel-cliente'](); };
  A['patente-camara']({ dataset:{ v:'hotel' } });
};
const patenteListo = p => { if (patenteDestino){ const f = patenteDestino; patenteDestino = null; setTimeout(() => f(hcPat(p)), 60); } else validar(p); };
F['hotel-cliente'] = d => {
  if (!esGuardia()) return;
  const pat = hcPat(d.patente), [m, mt] = hcMotivo(d.motivo), n = Math.max(1, Math.min(30, Math.round(+d.personas) || 1)), auto = String(d.auto || '').trim().slice(0, 40);
  const r = pat ? restriccionPara('', '', pat) : null;
  if (r){ hoja('Atención', `${avisoRestriccion(r)}<p class="small">Hay un pedido firmado para no dejar pasar este vehículo.</p>`); return; }
  const ahora = Date.now(), coche = [auto, pat ? verPatente(pat) : ''].filter(Boolean).join(' ');
  Store.cambiar(s => {
    s.bitacora.unshift({ id:uid(), autor:yo().id, tipo:'acceso', hc:{ m, n, ...(pat ? { pat } : {}), ...(auto ? { auto } : {}) },
      texto:`Ingreso: Cliente del hotel · ${mt} · ${plural(n, 'persona')}${coche ? ' · ' + coche : ''} · ${hora(ahora)} h.`, at:ahora });
    /* A la cuenta del hotel, en su carpeta privada (no al pizarrón de todos: lleva la patente). */
    const hoteles = aLista(s.users).filter(u => u && u.rol === 'hotel' && u.estado === 'aprobado').map(u => u.id);
    if (hoteles.length) notificar(s, { para:hoteles, titulo:`Llega${n === 1 ? '' : 'n'} ${n} ${hcLugar(m)}`, texto:`${mt}${coche ? ' · ' + coche : ''} · entró ${hora(ahora)} h`, icon:'star', color:'wood', link:'hotel', sonido:true });
  });
  cerrarHoja(); toast(`Avisado al hotel: llega${n === 1 ? '' : 'n'} ${n} ${hcLugar(m)}`, 'star');
};
A['hc-salio'] = el => {
  if (!esGuardia()) return;
  const b0 = hcAdentro().find(b => b.id === el.dataset.id); if (!b0) return;
  const ahora = Date.now(), x = b0.hc || {}, coche = [x.auto, x.pat ? verPatente(x.pat) : ''].filter(Boolean).join(' ');
  Store.cambiar(s => { s.bitacora.unshift({ id:uid(), autor:yo().id, tipo:'acceso', hcRef:b0.id, texto:`Salida: Cliente del hotel · ${hcMotivo(x.m)[1]} · ${plural(x.n || 1, 'persona')}${coche ? ' · ' + coche : ''} · ${hora(ahora)} h.`, at:ahora }); });
  toast('Salida anotada', 'logout');
};
/* En la garita: los que están en el hotel ahora, con "Salió". */
function hcGaritaHtml(opera){
  const ls = hcAdentro(); if (!ls.length) return '';
  return `<span id="garHotelClientes" class="ancla"></span>${sec('En el hotel ahora (clientes)', `<span class="muted small">${plural(ls.reduce((k, b) => k + (b.hc.n || 1), 0), 'persona')}</span>`)}
    <div class="hc-lista">${ls.map(b => { const x = b.hc, [, t, e] = hcMotivo(x.m); return `<div class="hc-it"><span class="hc-e">${e}</span>
      <div class="grow"><b>${t} · ${plural(x.n || 1, 'persona')}</b><small>${x.pat ? `<span class="hp-chapa chica">${esc(verPatente(x.pat))}</span> ` : ''}${esc(x.auto || '')}${x.auto || x.pat ? ' · ' : ''}entró ${hora(b.at)} h · hace ${Math.max(1, Math.round((Date.now() - b.at) / MIN))} min</small></div>
      ${opera ? `<button class="btn btn-xs btn-sec" data-a="hc-salio" data-id="${esc(b.id)}">${I('logout')}Salió</button>` : ''}</div>`; }).join('')}</div>`;
}
/* LA SALIDA DE LA QUE LLEGÓ SIN AVISO (18-10-2026). Claudio autorizó a
   Olegario y, cuando se fue, la garita no tenía cómo marcarlo: la llegada
   no tenía botón de salida. Ahora la que pasó queda "Adentro" en la garita
   hasta que se toca "Salió": queda en el libro de guardia y en Ingresos de
   hoy, y al lote le llega el aviso (sin sonar). */
const llegadaAdentro = l => !!l && l.estado === 'autorizado' && !l.sale && isoDe(new Date(l.respondido || l.at)) === hoyISO();
A['llegada-salio'] = el => {
  if (!esGuardia()) return;
  const l0 = aLista(Store.s.llegadas).find(x => x.id === el.dataset.id); if (!l0 || l0.sale) return;
  const casa = l0.lote || usuario(l0.hostId)?.casa || '', ahora = Date.now();
  Store.cambiar(s => {
    const l = s.llegadas.find(x => x.id === l0.id); if (!l) return; l.sale = ahora;
    s.bitacora.unshift({ id:uid(), autor:yo().id, tipo:'acceso', texto:`Salida: ${l.nombre}${l.patente ? ' (' + l.patente + ')' : ''} → ${casa} (llegó sin aviso) · ${hora(ahora)} h.`, at:ahora });
    notificar(s, { para:paraElLote(casa, l.hostId), titulo:`${l.nombre} salió del barrio`, texto:`${hora(ahora)} h · había llegado sin aviso`, icon:'logout', color:'ok', link:'visitas', push:false });
  });
  toast(`Salida de ${l0.nombre} anotada`, 'logout');
};
/* Los paquetes (con foto y confirmación del vecino) están en v-servicio.js. */
A['aviso-visto'] = el => Store.cambiar(s => { const a = s.avisos.find(x => x.id === el.dataset.id); if (a){ a.visto = Date.now();
  notificar(s, { para:a.userId, titulo:'La guardia vio tu aviso', texto:AVISOS_GUARDIA[a.tipo]?.t || '', icon:'shield', color:'ok' }); } });
A['ronda-casa'] = el => { Store.cambiar(s => s.bitacora.unshift({ id:uid(), autor:yo().id, tipo:'ronda', texto:`Ronda por ${el.dataset.v} (casa sola): sin novedades.`, at:Date.now() })); toast('Anotado en la bitácora', 'book'); };

/* Escáner de QR con la cámara (Chrome en Android lo trae de fábrica). */
/* EL LECTOR DE QR DE LA GARITA
   Usa el detector del navegador cuando existe (Chrome, Android). Safari
   (iPhone, iPad) y Firefox no lo traen: ahí se baja jsQR, que lee el QR de
   la imagen de la cámara. Antes, en un iPhone la garita no podía leer nada.
   `el.dataset.v` = qué se espera leer (el texto de ayuda). */
let jsQRcargando = null;
const cargarJsQR = () => window.jsQR ? Promise.resolve(window.jsQR) : (jsQRcargando = jsQRcargando || new Promise(ok => {
  const s = document.createElement('script'); s.src = 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js';
  s.onload = () => ok(window.jsQR || null); s.onerror = () => { jsQRcargando = null; ok(null); }; document.head.appendChild(s); }));
A['escanear'] = async el => {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia){ toast('Este equipo no puede usar la cámara. Escribí el código.', 'scan'); return; }
  const nativo = 'BarcodeDetector' in window;
  const lector = nativo ? null : await cargarJsQR();
  if (!nativo && !lector){ toast('Sin conexión para cargar el lector de QR. Escribí el código.', 'scan'); return; }
  hoja('Escanear QR', `<video class="video-scan" id="scanVideo" playsinline muted></video><p class="muted small center">${esc(el && el.dataset && el.dataset.v || 'Apuntá al QR del pase')}</p>`);
  let stream;
  try { stream = await navigator.mediaDevices.getUserMedia({ video:{ facingMode:'environment' } }); }
  catch(e){ cerrarHoja(); toast('No se pudo usar la cámara', 'camera'); return; }
  const v = $('#scanVideo'); v.srcObject = stream; await v.play().catch(() => {});
  const det = nativo ? new BarcodeDetector({ formats:['qr_code'] }) : null;
  const lienzo = document.createElement('canvas'), ctx = lienzo.getContext('2d', { willReadFrequently:true });
  const d = $('#hoja');
  const parar = () => stream.getTracks().forEach(t => t.stop());
  d.addEventListener('close', parar, { once:true });
  const leer = async () => {
    if (det){ const r = await det.detect(v); return r[0] ? r[0].rawValue : ''; }
    if (!v.videoWidth) return '';
    const k = Math.min(1, 720 / v.videoWidth); lienzo.width = Math.round(v.videoWidth * k); lienzo.height = Math.round(v.videoHeight * k);
    ctx.drawImage(v, 0, 0, lienzo.width, lienzo.height);
    const r = lector(ctx.getImageData(0, 0, lienzo.width, lienzo.height).data, lienzo.width, lienzo.height, { inversionAttempts:'dontInvert' });
    return r ? r.data : '';
  };
  const ciclo = async () => {
    if (!d.open) return;
    try { const txt = await leer(); if (txt){ parar(); cerrarHoja(); validar(txt); return; } } catch(e){}
    setTimeout(ciclo, 250);
  };
  ciclo();
};

/* =========================================================
   LEER LA PATENTE CON LA CÁMARA (pedido de Claudio, 10-10-2026, sobre la
   idea de GitHub: tesseract.js, 38.700★, licencia Apache-2.0, que se usa
   como librería, sin copiar su código)
   La garita apunta a la patente del auto, toca "Leer la patente" y la app
   la lee EN EL MISMO TELÉFONO: la foto no se guarda ni se manda a ningún
   lado (solo se baja, una vez, el programa lector). Después muestra lo que
   leyó para corregirlo si hace falta y lo busca como si se hubiera
   escrito: el pase, el auto de un vecino, una van o un huésped del hotel;
   si no está, ofrece "Registrar llegada sin aviso".
   Entiende las patentes argentinas: AA 999 AA (Mercosur), A 999 AAA (moto
   Mercosur), AAA 999 y 999 AAA (las viejas), y corrige las confusiones
   típicas de la lectura (O y 0, I y 1, B y 8, S y 5…) según dónde va una
   letra y dónde un número.
   ========================================================= */
const OCR_URL = 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js';
let ocrCargando = null, ocrWorker = null, patCamara = null;
const cargarOCR = () => window.Tesseract ? Promise.resolve(window.Tesseract) : (ocrCargando = ocrCargando || new Promise(ok => {
  const sc = document.createElement('script'); sc.src = OCR_URL; sc.onload = () => ok(window.Tesseract || null); sc.onerror = () => { ocrCargando = null; ok(null); }; document.head.appendChild(sc); }));
async function lectorPatente(){
  if (ocrWorker) return ocrWorker;
  const T = await cargarOCR(); if (!T) return null;
  try {
    const w = await T.createWorker('eng', 1);
    await w.setParameters({ tessedit_char_whitelist:'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 ', tessedit_pageseg_mode: T.PSM ? T.PSM.SINGLE_LINE : '7', user_defined_dpi:'300' });
    return (ocrWorker = w);
  } catch(e){ console.warn('Lector de patentes', e && e.message); return null; }
}
const FORMATOS_PATENTE = ['LLDDDLL', 'LDDDLLL', 'LLLDDD', 'DDDLLL'];
const PAT_A_LETRA = { '0':'O', '1':'I', '2':'Z', '4':'A', '5':'S', '6':'G', '7':'T', '8':'B' };
const PAT_A_NUM = { O:'0', Q:'0', D:'0', U:'0', I:'1', L:'1', J:'1', T:'7', Z:'2', S:'5', B:'8', G:'6', A:'4' };
/* Del texto leído, la patente que mejor encaja (la que pide menos correcciones). */
function patenteDeTexto(txt){ return patenteLeida(txt).p; }
/* Además de la patente, cuántas letras hubo que corregir para que encaje. */
function patenteLeida(txt){
  const t = String(txt || '').toUpperCase().replace(/[^A-Z0-9]/g, ''), out = [];
  FORMATOS_PATENTE.forEach((f, orden) => { for (let i = 0; i + f.length <= t.length; i++){
    const tramo = t.slice(i, i + f.length); let fix = '', ok = true;
    for (let k = 0; k < f.length && ok; k++){ const ch = tramo[k];
      const v = f[k] === 'L' ? (/[A-Z]/.test(ch) ? ch : PAT_A_LETRA[ch]) : (/[0-9]/.test(ch) ? ch : PAT_A_NUM[ch]);
      if (!v) ok = false; else fix += v; }
    if (ok) out.push({ p:fix, orden, cambios:[...fix].filter((c, k) => c !== tramo[k]).length });
  } });
  out.sort((a, b) => a.cambios - b.cambios || a.orden - b.orden);
  /* Una lectura que necesitó muchas correcciones no es una patente: es ruido. */
  return out[0] && out[0].cambios <= 2 ? out[0] : { p:'', cambios:9 };
}
const verPatente = p => !p ? '' : p.length === 7 ? (/^[A-Z]{2}\d/.test(p) ? `${p.slice(0, 2)} ${p.slice(2, 5)} ${p.slice(5)}` : `${p.slice(0, 1)} ${p.slice(1, 4)} ${p.slice(4)}`) : p.length === 6 ? `${p.slice(0, 3)} ${p.slice(3)}` : p;
/* =========================================================
   EL LECTOR DE PATENTES, RÁPIDO COMO EL DEL QR (10-10-2026, Claudio: "NO
   LEE LAS PATENTES, ni acercándome")
   Antes: había que tocar "Leer la patente", se leía UNA foto con un
   recuadro grande (entraban el paragolpes, la calcomanía, la banda azul) y
   el programa recién se bajaba en ese momento. Ahora, como el QR:
     · el lector se baja apenas se abre la garita (una sola vez; queda
       guardado en el teléfono) y la cámara arranca leyendo sola;
     · lee varias veces por segundo SOLO el recuadro amarillo, que tiene la
       forma de una patente; lo pasa a blanco y negro puro (y lo da vuelta
       si es una patente vieja, de letras blancas sobre fondo negro);
     · si el teléfono tiene zoom, la cámara arranca con 2x: no hace falta
       acercarse tanto;
     · da la patente por buena apenas coincide con una que el barrio ya
       conoce (pases de hoy, autos de vecinos, frecuentes, vans y huéspedes
       del hotel), aunque haya leído mal UNA letra; si es desconocida, cuando
       la lee igual dos veces;
     · suena, vibra y muestra el resultado, igual que el QR.
   GitHub (más de 1000★): openalpr (11k★, AGPL), HyperLPR (6k★) y
   PaddleOCR (90k★) leen patentes muy bien, pero en una computadora o un
   servidor, no en el navegador del teléfono; se sigue con tesseract.js
   (38,7k★, Apache-2.0), afinado para patentes.
   ========================================================= */
function patentesConocidas(){
  const s = Store.s, hoy = hoyISO(), set = new Set(), add = p => { const x = normPatente(p); if (x.length >= 6 && x.length <= 7) set.add(x); };
  aLista(s.pases).filter(p => p && !p.cancelado && (paseValidoEn(p, hoy) || (p.log && p.log[hoy]))).forEach(p => add(p.patente));
  aLista(s.users).forEach(u => aLista(u && u.vehiculos).forEach(v => add(v && v.patente)));
  if (typeof frecuentes === 'function') frecuentes().forEach(f => add(f.patente));
  if (typeof hotelVans === 'function'){ hotelVans().forEach(v => add(v.patente)); hotelHuespedes().forEach(h => add(h.patente)); }
  if (typeof hotelEmpleados === 'function') hotelEmpleados().forEach(e => add(e.patente));
  return set;
}
/* La conocida que está a UNA letra de lo leído (y una sola, para no confundir). */
function patenteParecida(p, conocidas){
  if (conocidas.has(p)) return p;
  const cerca = [...conocidas].filter(k => k.length === p.length && [...k].filter((c, i) => c !== p[i]).length === 1);
  return cerca.length === 1 ? cerca[0] : '';
}
/* El recuadro de la patente, en blanco y negro puro (umbral de Otsu), con
   las letras oscuras sobre fondo claro y un margen blanco alrededor. */
function recortePatente(fuente, r, alReves = false, alto = 110){
  const k = alto / r.h, ancho = Math.round(r.w * k), m = 24;
  const cv = document.createElement('canvas'); cv.width = ancho + 2 * m; cv.height = alto + 2 * m;
  const ctx = cv.getContext('2d', { willReadFrequently:true });
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, cv.width, cv.height);
  ctx.drawImage(fuente, r.x, r.y, r.w, r.h, m, m, ancho, alto);
  const img = ctx.getImageData(m, m, ancho, alto), d = img.data, n = d.length / 4, gris = new Uint8Array(n), hist = new Array(256).fill(0);
  for (let i = 0, j = 0; i < d.length; i += 4, j++){ const g = (d[i] * 299 + d[i + 1] * 587 + d[i + 2] * 114) / 1000 | 0; gris[j] = g; hist[g]++; }
  let suma = 0; for (let g = 0; g < 256; g++) suma += g * hist[g];
  let sB = 0, wB = 0, mejor = 0, umbral = 128;
  for (let g = 0; g < 256; g++){ wB += hist[g]; if (!wB) continue; const wF = n - wB; if (!wF) break; sB += g * hist[g];
    const mB = sB / wB, mF = (suma - sB) / wF, v = wB * wF * (mB - mF) * (mB - mF); if (v > mejor){ mejor = v; umbral = g; } }
  let claros = 0; for (let j = 0; j < n; j++) if (gris[j] > umbral) claros++;
  /* Letras oscuras sobre fondo claro. Si alrededor de la patente entra
     mucho asfalto, el "fondo" puede adivinarse mal: por eso cada cuadro
     se prueba de una forma y el siguiente al revés (alReves). */
  const invertir = (claros < n * 0.45) !== alReves, bin = new Uint8Array(n);
  for (let j = 0; j < n; j++){ let b = gris[j] > umbral ? 1 : 0; if (invertir) b = 1 - b; bin[j] = b; }
  /* Lo negro que toca el borde del recorte es el auto o la calle que rodea
     la patente (las letras nunca tocan el borde): se borra. */
  const pila = [];
  for (let x = 0; x < ancho; x++){ pila.push(x, (alto - 1) * ancho + x); }
  for (let y = 0; y < alto; y++){ pila.push(y * ancho, y * ancho + ancho - 1); }
  while (pila.length){ const j = pila.pop(); if (bin[j]) continue; bin[j] = 1; const x = j % ancho, y = (j / ancho) | 0;
    if (x > 0) pila.push(j - 1); if (x < ancho - 1) pila.push(j + 1); if (y > 0) pila.push(j - ancho); if (y < alto - 1) pila.push(j + ancho); }
  /* Franjas y bordes negros enteros (el marco, la banda de arriba, el
     paragolpes) se borran: no son letras y confunden al lector. */
  for (let y = 0; y < alto; y++){ let neg = 0; for (let x = 0; x < ancho; x++) neg += 1 - bin[y * ancho + x]; if (neg > ancho * 0.8) for (let x = 0; x < ancho; x++) bin[y * ancho + x] = 1; }
  for (let x = 0; x < ancho; x++){ let neg = 0; for (let y = 0; y < alto; y++) neg += 1 - bin[y * ancho + x]; if (neg > alto * 0.8) for (let y = 0; y < alto; y++) bin[y * ancho + x] = 1; }
  for (let i = 0, j = 0; i < d.length; i += 4, j++){ const b = bin[j] ? 255 : 0; d[i] = d[i + 1] = d[i + 2] = b; d[i + 3] = 255; }
  ctx.putImageData(img, m, m); return cv;
}
/* Dónde está el recuadro amarillo, en píxeles del video. */
function rectGuia(v){
  const g = $('#patGuia'), rv = v.getBoundingClientRect(); if (!g || !rv.width) return null;
  const rg = g.getBoundingClientRect(), kx = v.videoWidth / rv.width, ky = v.videoHeight / rv.height;
  return { x:Math.max(0, (rg.left - rv.left) * kx), y:Math.max(0, (rg.top - rv.top) * ky), w:rg.width * kx, h:rg.height * ky };
}
/* Se baja apenas se abre la garita, para que la cámara lea al instante. */
const precargarLectorPatente = () => { if (!ocrWorker && !ocrCargando && esGuardia()) setTimeout(() => lectorPatente(), 4000); };
A['patente-camara'] = async el => {
  if (!(el && el.dataset && el.dataset.v === 'hotel')) patenteDestino = null;
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia){ toast('Este equipo no puede usar la cámara. Escribí la patente.', 'camera'); return; }
  hoja('Leer la patente', `<div class="pat-cam"><video id="patVideo" playsinline muted></video><div class="pat-guia" id="patGuia" aria-hidden="true"></div><div class="pat-vivo" id="patVivo"></div></div>
    <p class="small center" id="patEstado" style="margin:10px 0">Apuntá a la patente: que entre justo en el recuadro amarillo. Se lee sola.</p>
    <form data-f="patente-buscar" class="linea-form"><input name="q" maxlength="12" placeholder="O escribila: AB 123 CD" autocomplete="off" style="text-transform:uppercase"><button class="btn btn-pri" aria-label="Buscar">${I('search')}</button></form>
    <p class="muted tiny" style="margin:10px 0 0">${I('lock')} La imagen se lee en este mismo teléfono: no se guarda ni se manda a ningún lado.</p>`);
  let stream;
  try { stream = await navigator.mediaDevices.getUserMedia({ video:{ facingMode:'environment', width:{ ideal:1920 }, height:{ ideal:1080 } } }); }
  catch(e){ cerrarHoja(); toast('No se pudo usar la cámara. Escribí la patente.', 'camera'); return; }
  const v = $('#patVideo'); if (!v){ stream.getTracks().forEach(t => t.stop()); return; }
  v.srcObject = stream; await v.play().catch(() => {});
  /* Zoom 2x y foco continuo, si la cámara los tiene: lee desde más lejos. */
  try { const tr = stream.getVideoTracks()[0], cap = tr.getCapabilities ? tr.getCapabilities() : {}, adv = {};
    if (cap.zoom) adv.zoom = Math.min(cap.zoom.max, Math.max(cap.zoom.min, 2));
    if (cap.focusMode && cap.focusMode.includes('continuous')) adv.focusMode = 'continuous';
    if (Object.keys(adv).length) await tr.applyConstraints({ advanced:[adv] }); } catch(e){}
  let vivo = true;
  const parar = () => { vivo = false; stream.getTracks().forEach(t => t.stop()); };
  patCamara = { parar }; $('#hoja').addEventListener('close', parar, { once:true });
  const est = $('#patEstado'), ver = $('#patVivo');
  if (!ocrWorker && est) est.textContent = 'Preparando el lector (solo la primera vez)… ya podés apuntar.';
  const w = await lectorPatente();
  if (!vivo) return;
  if (!w){ if (est) est.textContent = 'No se pudo bajar el lector (¿sin conexión?). Escribí la patente abajo.'; return; }
  if (est) est.textContent = 'Apuntá a la patente: que entre justo en el recuadro amarillo. Se lee sola.';
  const conocidas = patentesConocidas(), vistas = []; let cuadro = 0;
  const listo = p => { vivo = false; parar();
    if (typeof Sonido !== 'undefined'){ Sonido.tocar([[988, 0, .1], [1319, .1, .22]], 'sine', .18); Sonido.vibrar(90); }
    cerrarHoja(); patenteListo(p); };
  while (vivo && $('#hoja')?.open){
    const r = v.videoWidth ? rectGuia(v) : null;
    if (r && r.w > 20){
      let txt = ''; try { /* Cada cuadro, una variante: al derecho y al revés, en dos tamaños. */
        const n = cuadro++; txt = (await w.recognize(recortePatente(v, r, n % 2 === 1, n % 4 < 2 ? 80 : 140))).data.text || ''; } catch(e){}
      if (!vivo) return;
      const { p, cambios } = patenteLeida(txt);
      if (p){
        if (ver) ver.textContent = verPatente(p);
        const k = patenteParecida(p, conocidas); if (k){ listo(k); return; }
        /* Desconocida: dos lecturas iguales y limpias, o tres si hubo que corregir letras. */
        vistas.push(p); if (vistas.length > 6) vistas.shift();
        if (vistas.filter(x => x === p).length >= (cambios ? 3 : 2)){ listo(p); return; }
      }
    }
    await new Promise(ok => setTimeout(ok, 60));
  }
};
F['patente-buscar'] = d => patenteListo(d.q);

/* ---------- BITÁCORA ---------- */
/* =========================================================
   LA BITÁCORA, UNIFICADA (rediseño, pedido de Claudio, 13-10-2026: "todas
   estas opciones no se entienden bien, fijate qué función cumple cada una y
   si se pisan, unificalas").
   Antes, para escribir había cuatro tipos (Cambio de turno, Ronda, Novedad
   e Incidente) y para mirar, seis filtros. "Cambio de turno" a mano se
   pisaba con Empezar y Cerrar el turno, que ya lo anotan solos; "Acceso" lo
   escribe sola la app con cada ingreso; y las rondas del policía quedaban
   como "acceso". Ahora:
     · se ESCRIBE una de tres cosas: Novedad, Incidente (que siempre le suena
       a la Administración) o Ronda de la guardia;
     · se MIRA por cinco colores, con lo que la app anota sola agrupado:
       Novedades, Incidentes, Rondas y policía, Entradas y salidas, Turnos;
     · lo que el turno que se fue dejó escrito al cerrar queda FIJADO arriba
       (también en la pantalla de "Nuevo turno") hasta que cierra el turno
       siguiente. Es lo mismo que va en el renglón "Termina el turno" y en
       el parte por correo: no hay que escribirlo dos veces.
   ========================================================= */
const TIPOS_BIT = { turno:['Cambio de turno','clock','sky'], ronda:['Ronda','shield','brand'], novedad:['Novedad','info','accent'], incidente:['Incidente','alert','danger'], acceso:['Acceso','gate','ok'] };
const CAT_BIT = {
  novedad:    { n:'Novedades', ic:'info', c:'accent' },
  incidente:  { n:'Incidentes', ic:'alert', c:'danger' },
  ronda:      { n:'Rondas y policía', ic:'shield', c:'brand' },
  movimiento: { n:'Entradas y salidas', ic:'gate', c:'ok' },
  turno:      { n:'Turnos', ic:'clock', c:'sky' },
};
const catBit = b => b.tipo === 'turno' ? 'turno' : b.tipo === 'incidente' ? 'incidente' : b.tipo === 'novedad' ? 'novedad' : b.tipo === 'ronda' ? 'ronda' : /polic[ií]a|\bronda\b|casa sola/i.test(b.texto || '') ? 'ronda' : 'movimiento';
const ESCRIBIR_BIT = {
  novedad:   { n:'Novedad', ic:'info', c:'accent', ph:'¿Qué pasó? Ej: luz quemada en De la Plaza al 3300', frases:['Sin novedades', 'Portón revisado', 'Luz quemada en ', 'Perro suelto en ', 'Corte de luz', 'Llamó el lote '] },
  incidente: { n:'Incidente', ic:'alert', c:'danger', ph:'¿Qué pasó y dónde? Le suena a la Administración', frases:['Intento de ingreso sin autorización', 'Auto sospechoso en ', 'Daño en ', 'Discusión en la entrada', 'Alarma sonando en el lote '] },
  ronda:     { n:'Ronda de la guardia', ic:'shield', c:'brand', ph:'Cómo estuvo la ronda. Ej: perímetro norte en orden', frases:['Ronda completa, sin novedades', 'Perímetro en orden', 'Portón de servicio cerrado', 'Casa sola revisada: '] },
};
/* Lo que dejó escrito el último turno al cerrarse (16 horas como mucho). */
function notaDejada(){
  /* 14-10: con el relevo de a uno, la última nota puede ser de un guardia que
     salió antes que el último: se busca la más nueva de las últimas 16 h. */
  const conNota = registrosTurno().find(x => x.cerradoAt && x.notaCierre && Date.now() - x.cerradoAt < 16 * HORA);
  if (conNota) return { id:conNota.id, nota:conNota.notaCierre, turno:conNota.turno, guardias: conNota.notaPor ? [conNota.notaPor] : aLista(conNota.guardias), at:conNota.cerradoAt, por:conNota.notaPor || '' };
  const r = registrosTurno().find(x => x.cerradoAt); if (!r || Date.now() - r.cerradoAt > 16 * HORA) return null;
  let nota = r.notaCierre || '';
  if (!nota){ const l = aLista(Store.s.bitacora).find(b => b && b.tipo === 'turno' && !b.abre && Math.abs(b.at - r.cerradoAt) < 2 * MIN && /Novedades: /.test(b.texto || ''));
    if (l) nota = l.texto.split('Novedades: ').slice(1).join('Novedades: '); }
  return nota ? { id:r.id, nota, turno:r.turno, guardias:aLista(r.guardias), at:r.cerradoAt } : null;
}
/* LAS NOVEDADES DEL RELEVO (rediseño, pedido de Claudio, 15-10-2026: "el
   cartel amarillo del cierre del turno de noche tiene un diseño muy feo").
   Ahora es un mensaje del que se fue al que entra: su carita y su color de
   horario, quién es, a qué hora lo dejó y hace cuánto, y lo que escribió en
   un globo de diálogo. "Leído" lo pliega en este equipo (queda a mano con
   un toque); una nota nueva aparece abierta otra vez. */
const notaLeidaKey = 'bhc.notaRelevoLeida';
const notaYaLeida = id => { try { return localStorage.getItem(notaLeidaKey) === id; } catch(e){ return false; } };
const notaDejadaHtml = () => { const n = notaDejada(); if (!n) return '';
  const m = /^(.*) \(([^()]+)\)$/.exec(n.por || ''), quien = m ? m[1] : n.guardias.join(', '), hor = m ? m[2] : n.turno;
  const h = typeof horarioDe === 'function' ? horarioDe(hor) : null, color = typeof colorHorario === 'function' && h ? colorHorario(hor) : '#f59e0b';
  const uno = quien.split(',')[0].trim(), leida = notaYaLeida(n.id), txt = String(n.nota).trim(), texto = txt.charAt(0).toUpperCase() + txt.slice(1);
  const hace = Math.max(1, Math.round((Date.now() - n.at) / MIN)), haceTxt = hace < 60 ? `hace ${hace} min` : `hace ${Math.floor(hace / 60)} h${hace % 60 >= 10 ? ' ' + hace % 60 + ' min' : ''}`;
  return `<details class="rl-nota" style="--c:${color}" data-id="${esc(n.id || '')}"${leida ? '' : ' open'}>
    <summary><span class="rl-cara" style="--cc:${colorDe(uno)}">${typeof caraGuardia === 'function' ? caraGuardia(uno, typeof lookDe === 'function' ? lookDe(uno) : null) : esc(inicialesDe(uno))}${leida ? '' : '<i class="rl-nuevo"></i>'}</span>
      <span class="rl-quien"><small>${I('chat')}Novedades del relevo${leida ? ' · leídas' : ''}</small><b>${esc(quien)}</b><em><i class="rl-h">${esc(hor)}</i>${h ? `${hhCorto(h.desde)} a ${hhCorto(h.hasta)} h · ` : ''}se fue a las ${hora(n.at)} h</em></span>
      <span class="rl-hace">${haceTxt}</span></summary>
    <div class="rl-globo"><p>${esc(texto)}</p></div>
    <div class="rl-pie"><span>${I('book')}También quedó en la bitácora y en el parte.</span>${leida ? '' : `<button type="button" class="rl-ok" data-a="nota-leida" data-id="${esc(n.id || '')}">${I('check')}Leído</button>`}</div></details>`; };
A['nota-leida'] = el => { try { localStorage.setItem(notaLeidaKey, el.dataset.id || ''); } catch(e){} const d = el.closest('details'); if (d) d.open = false; toast('Novedades leídas', 'check'); pintar(); };
/* =========================================================
   LA BITÁCORA EN LA PORTADA DE LA GARITA (pedido de Claudio, 18-10-2026)
   "Que la Bitácora esté debajo de 'Hoy la garita no puede olvidar', con las
   mismas funciones y un diseño de apertura e interactividad más innovador y
   animado, que invite rápido al guardia a interactuar con cada sección."
   · Un libro que se abre (la tapa gira) con el día, cuántos registros hay
     y el último; "En vivo" late porque se actualiza solo.
   · "¿Qué querés anotar?": tres botones grandes (Novedad, Incidente, Ronda);
     al tocar uno se despliega con sus frases rápidas y el renglón para
     escribir. Es el mismo formulario del libro (F['bitacora']).
   · Las secciones del libro como fichas de colores con su número: tocar una
     muestra ahí mismo lo último de esa sección, sin salir de la garita. La
     que tuvo algo en los últimos 15 minutos tiene un punto que late.
   · "Abrir el libro completo" lleva a la ventana de siempre (buscador,
     Otro día, Historial de visitas), ya filtrada en la sección elegida.
   ========================================================= */
let bitPortalCat = 'todo', bitPortalTipo = '';
const BIT_PORTAL_MAX = 6;
function bitDelDia(){
  const ini = new Date(hoyISO() + 'T00:00').getTime(), fin = ini + DIA;
  return aLista(Store.s.bitacora).filter(b => b && b.at >= ini && b.at < fin).sort((a, b) => b.at - a.at);
}
function bitPortalLista(delDia){
  const k = bitPortalCat, lista = k === 'todo' ? delDia : delDia.filter(b => catBit(b) === k), c = CAT_BIT[k];
  if (!lista.length) return `<div class="bt-vacio bg2-vacio">${I(c ? c.ic : 'book')}<b>${k === 'todo' ? 'Hoy todavía no hay registros' : 'Hoy no hay ' + esc(c.n.toLowerCase())}</b><small>${esGuardia() && ['todo', 'novedad', 'incidente', 'ronda'].includes(k) ? 'Tocá arriba qué querés anotar y queda acá al instante.' : 'Lo que se anote aparece acá, en vivo.'}</small></div>`;
  const resto = lista.length - BIT_PORTAL_MAX;
  return bitItemsHtml(lista.slice(0, BIT_PORTAL_MAX)) + (resto > 0 ? `<button type="button" class="bg2-mas" data-a="abrir" data-v="bitacora" data-p="${k}">${I('book')}${resto === 1 ? 'Ver 1 registro más' : `Ver ${resto} registros más`} en el libro</button>` : '');
}
function bitacoraGarita(){
  if (!veGarita()) return '';
  const delDia = bitDelDia(), ult = delDia[0], ahora = Date.now();
  const cuenta = k => k === 'todo' ? delDia.length : delDia.filter(b => catBit(b) === k).length;
  const nuevo = k => delDia.some(b => (k === 'todo' || catBit(b) === k) && ahora - b.at < 15 * MIN);
  const cats = [['todo', { n:'Todo', ic:'book', c:'brand2' }], ...Object.entries(CAT_BIT)];
  const d = new Date();
  return `<details class="card bg2" id="garBitacora" data-k="bit-portal" open>
    <summary class="bg2-cab">
      <span class="bg2-libro" aria-hidden="true"><i class="bg2-tapa">${I('book')}</i><span class="bg2-hoja"><b>${d.getDate()}</b><small>${esc(MESES[d.getMonth()])}</small></span></span>
      <span class="bg2-tit"><b>Bitácora</b><small>Libro de guardia · ${plural(delDia.length, 'registro')} hoy${ult ? ` · último ${hora(ult.at)} h` : ''}</small></span>
      <span class="bg2-vivo"><i></i>En vivo</span>${I('right')}</summary>
    <div class="bg2-cuerpo">
      ${esGuardia() ? bitEscribirHtml({ plegado:true }) : `<p class="muted small bg2-mira">${I('eye')} La escribe la garita; ${esSupervisor() ? 'la supervisión' : 'la Administración'} la lee en vivo.</p>`}
      <div class="bg2-cats" role="toolbar" aria-label="Secciones del libro">${cats.map(([k, c], i) => `<button type="button" class="bg2-cat c-${c.c}${bitPortalCat === k ? ' on' : ''}${cuenta(k) ? '' : ' cero'}" data-a="bit-portal-cat" data-v="${k}" aria-pressed="${bitPortalCat === k}" style="--i:${i}">
        <span class="bg2-ic">${I(c.ic)}${nuevo(k) ? '<i class="bg2-nuevo" title="Algo nuevo en los últimos 15 minutos"></i>' : ''}</span><b>${cuenta(k)}</b><small>${esc(c.n)}</small></button>`).join('')}</div>
      <div class="lb-modo" role="tablist" aria-label="Cómo leer la bitácora">${[['lista', 'list', 'Lista'], ['libro', 'book', 'Hojear']].map(([v, ic, t]) => `<button type="button" role="tab" class="${bitPortalModo === v ? 'on' : ''}" data-a="bit-portal-modo" data-v="${v}" aria-selected="${bitPortalModo === v}">${I(ic)}${t}</button>`).join('')}</div>
      <div class="bg2-lista bt-linea-tiempo${bitPortalModo === 'libro' ? ' es-libro' : ''}" aria-live="polite">${bitPortalContenido(delDia)}</div>
      <div class="bg2-pie"><button type="button" class="btn btn-sm btn-pri" data-a="abrir" data-v="bitacora" data-p="${bitPortalCat}">${I('book')}Abrir el libro completo</button>
        <button type="button" class="btn btn-sm btn-sec" data-a="bit-otro-dia">${I('calendar')}Otro día</button></div>
    </div></details>`;
}
/* =========================================================
   LA BITÁCORA COMO UN LIBRO QUE SE HOJEA (pedido de Claudio, 18-10-2026)
   "Un libro que al tocarlo se abren sus páginas una por una por cada toque
   y así se avanza hasta todo lo que se quiera leer." Es una forma MÁS de
   leerla: la lista rápida queda igual ("Lista" / "Hojear").
   · Una página por cada hora del día que tuvo algo (de la sección elegida).
   · Tocar la mitad derecha de la hoja (o deslizar el dedo a la izquierda)
     pasa a la página siguiente; la mitad izquierda (o deslizar a la
     derecha), a la anterior. La hoja gira con efecto 3D.
   · Abajo, una tira con las horas para saltar directo, y "Anterior" /
     "Siguiente". Abre en la última hora, la más nueva.
   Idea de turn.js (7.5k★, el efecto de pasar páginas): solo la idea, el
   efecto es propio, con CSS.
   ========================================================= */
let bitPortalModo = (() => { try { return localStorage.getItem('bhc.bit.modo') === 'libro' ? 'libro' : 'lista'; } catch(e){ return 'lista'; } })();
let bitLibroHora = '';
const bitHoraDe = b => String(new Date(b.at).getHours()).padStart(2, '0');
function bitLibroHtml(delDia){
  const k = bitPortalCat, lista = (k === 'todo' ? delDia : delDia.filter(b => catBit(b) === k)).slice().sort((a, b) => a.at - b.at), c = CAT_BIT[k];
  if (!lista.length) return `<div class="bt-vacio bg2-vacio">${I(c ? c.ic : 'book')}<b>${k === 'todo' ? 'Hoy todavía no hay registros' : 'Hoy no hay ' + esc(c.n.toLowerCase())}</b><small>Cuando se anote algo, aparece su página.</small></div>`;
  const porHora = new Map(); lista.forEach(b => { const h = bitHoraDe(b); if (!porHora.has(h)) porHora.set(h, []); porHora.get(h).push(b); });
  const horas = [...porHora.keys()], hh = porHora.has(bitLibroHora) ? bitLibroHora : horas[horas.length - 1], i = horas.indexOf(hh), regs = porHora.get(hh);
  return `<div class="lb" data-hora="${hh}">
    <div class="lb-libro" role="region" aria-label="Página de las ${hh} h. Tocá la derecha para la siguiente y la izquierda para la anterior.">
      <div class="lb-pag">
        <div class="lb-cab"><span class="lb-h">${hh}<small>h</small></span><div class="grow"><b>De ${hh}:00 a ${hh}:59</b><small>${plural(regs.length, 'registro')}${k === 'todo' ? '' : ' · ' + esc(c.n.toLowerCase())}</small></div><span class="lb-num">${i + 1}<i>/</i>${horas.length}</span></div>
        <div class="lb-cont bt-linea-tiempo">${bitItemsHtml(regs)}</div>
        <div class="lb-pie">${i > 0 ? `<span>${I('left')} ${horas[i - 1]} h</span>` : '<span></span>'}<em>Tocá o deslizá para pasar la hoja</em>${i < horas.length - 1 ? `<span>${horas[i + 1]} h ${I('right')}</span>` : '<span></span>'}</div>
      </div>
    </div>
    <div class="lb-nav">
      <button type="button" class="lb-flecha" data-a="bit-libro-paso" data-v="-1" ${i === 0 ? 'disabled' : ''} aria-label="Página anterior">${I('left')}</button>
      <div class="lb-horas" role="tablist" aria-label="Ir a la hora">${horas.map(h => `<button type="button" role="tab" class="${h === hh ? 'on' : ''}" data-a="bit-libro-ir" data-v="${h}" aria-selected="${h === hh}"><b>${h}</b><i>${porHora.get(h).length}</i></button>`).join('')}</div>
      <button type="button" class="lb-flecha" data-a="bit-libro-paso" data-v="1" ${i === horas.length - 1 ? 'disabled' : ''} aria-label="Página siguiente">${I('right')}</button>
    </div></div>`;
}
const bitPortalContenido = delDia => bitPortalModo === 'libro' ? bitLibroHtml(delDia) : bitPortalLista(delDia);
/* Pasar la hoja: la página de antes gira (hacia la izquierda si avanza, a la derecha si vuelve) y deja ver la nueva. */
function bitLibroIr(caja, hora, dir){
  const l = caja && caja.querySelector('.bg2-lista'); if (!l) return;
  const vieja = l.querySelector('.lb-pag'), clon = vieja ? vieja.cloneNode(true) : null;
  bitLibroHora = hora; l.innerHTML = bitLibroHtml(bitDelDia());
  const libro = l.querySelector('.lb-libro');
  if (clon && libro && dir && !matchMedia('(prefers-reduced-motion: reduce)').matches){
    clon.classList.add('lb-gira', dir > 0 ? 'adelante' : 'atras'); clon.setAttribute('aria-hidden', 'true'); libro.appendChild(clon);
    libro.querySelector('.lb-pag:not(.lb-gira)')?.classList.add(dir > 0 ? 'lb-aparece' : 'lb-aparece-atras');
    clon.addEventListener('animationend', () => clon.remove(), { once:true }); setTimeout(() => clon.remove(), 900);
  }
  if (typeof Sonido !== 'undefined') Sonido.tocar([[520, 0, .06], [380, .05, .08]], 'triangle', .05);
  l.querySelector('.lb-horas .on')?.scrollIntoView({ block:'nearest', inline:'center', behavior:'smooth' });
}
const bitLibroPaso = (caja, dir) => {
  const l = caja && caja.querySelector('.lb'); if (!l) return;
  const hs = [...caja.querySelectorAll('.lb-horas [data-v]')].map(b => b.dataset.v), i = hs.indexOf(l.dataset.hora), j = i + dir;
  if (j < 0 || j >= hs.length){ const p = caja.querySelector('.lb-pag'); if (p){ p.classList.remove('lb-tope'); void p.offsetWidth; p.classList.add('lb-tope'); } return; }
  bitLibroIr(caja, hs[j], dir);
};
A['bit-libro-paso'] = el => bitLibroPaso(el.closest('#garBitacora'), +el.dataset.v || 1);
A['bit-libro-ir'] = el => { const caja = el.closest('#garBitacora'), act = caja?.querySelector('.lb')?.dataset.hora || ''; if (el.dataset.v === act) return; bitLibroIr(caja, el.dataset.v, el.dataset.v > act ? 1 : -1); };
A['bit-portal-modo'] = el => {
  bitPortalModo = el.dataset.v === 'libro' ? 'libro' : 'lista'; try { localStorage.setItem('bhc.bit.modo', bitPortalModo); } catch(e){}
  const caja = el.closest('#garBitacora'); if (!caja) return refrescar();
  caja.querySelectorAll('.lb-modo button').forEach(b => { const on = b.dataset.v === bitPortalModo; b.classList.toggle('on', on); b.setAttribute('aria-selected', on); });
  const l = caja.querySelector('.bg2-lista'); if (l){ l.classList.toggle('es-libro', bitPortalModo === 'libro'); l.classList.remove('cambia'); void l.offsetWidth; l.classList.add('cambia'); l.innerHTML = bitPortalContenido(bitDelDia()); }
};
/* Tocar la hoja: la mitad derecha avanza, la izquierda vuelve. Deslizar el dedo, igual. */
document.addEventListener('click', e => {
  const lib = e.target.closest && e.target.closest('#garBitacora .lb-libro'); if (!lib || e.target.closest('a,button,input,textarea,label')) return;
  const r = lib.getBoundingClientRect(); bitLibroPaso(lib.closest('#garBitacora'), e.clientX - r.left > r.width / 2 ? 1 : -1);
});
let lbToque = null;
document.addEventListener('touchstart', e => { const lib = e.target.closest && e.target.closest('#garBitacora .lb-libro'); lbToque = lib && e.touches.length === 1 ? { x:e.touches[0].clientX, y:e.touches[0].clientY, lib } : null; }, { passive:true });
document.addEventListener('touchend', e => {
  if (!lbToque) return; const t = e.changedTouches[0], dx = t.clientX - lbToque.x, dy = t.clientY - lbToque.y, lib = lbToque.lib; lbToque = null;
  if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.4){ e.preventDefault(); bitLibroPaso(lib.closest('#garBitacora'), dx < 0 ? 1 : -1); }
});
/* Tocar una sección: se muestra ahí mismo, sin salir de la garita. */
A['bit-portal-cat'] = el => {
  bitPortalCat = el.dataset.v === 'todo' || CAT_BIT[el.dataset.v] ? el.dataset.v : 'todo';
  const caja = el.closest('#garBitacora'); if (!caja) return refrescar();
  caja.querySelectorAll('.bg2-cat').forEach(b => { const on = b.dataset.v === bitPortalCat; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
  bitLibroHora = '';
  const l = caja.querySelector('.bg2-lista'); if (l){ l.classList.remove('cambia'); void l.offsetWidth; l.classList.add('cambia'); l.innerHTML = bitPortalContenido(bitDelDia()); }
  const ab = caja.querySelector('.bg2-pie [data-v="bitacora"]'); if (ab) ab.dataset.p = bitPortalCat;
};
/* Los renglones del libro (la ventana Bitácora y la Bitácora de la portada de la garita). */
function bitItemsHtml(lista){
  let hHora = '';
  return lista.map((b, i) => { const k = catBit(b), c = CAT_BIT[k];
    const quien = `${esc(autorVisible(b.autor).nombre)}${usuario(b.autor)?.rol === 'guardia' && b.tipo !== 'turno' && guardiasEn(b.at).length ? ' · ' + esc(guardiasEn(b.at).join(', ')) : ''}`;
    const hh = hora(b.at).slice(0, 2), cab = hh !== hHora ? (hHora = hh, `<div class="bt-hora"><span>${hh} h</span></div>`) : '';
    if (k === 'turno') return `${cab}<div class="bt-it bt-turno" data-txt="${esc(normTxt(b.texto + ' ' + quien))}" style="--i:${Math.min(i, 12)}"><span class="bt-ic">${I(b.abre ? 'sunrise' : 'sunset')}</span><div class="grow"><b>${esc(b.texto)}</b><small>${hora(b.at)} h</small></div></div>`;
    return `${cab}<div class="bt-it c-${c.c}" data-txt="${esc(normTxt(b.texto + ' ' + quien))}" style="--i:${Math.min(i, 12)}"><span class="bt-punto"><i>${I(c.ic)}</i></span>
      <div class="bt-txt"><div class="bt-meta"><time>${hora(b.at)}</time><em>${{ novedad:'Novedad', incidente:'Incidente', movimiento:'Entrada o salida', ronda: b.tipo === 'ronda' && !/polic/i.test(b.texto || '') ? 'Ronda de la guardia' : 'Ronda y policía' }[k]}</em></div><p>${esc(b.texto)}</p><small>${quien}</small></div></div>`; }).join('');
}
/* Lo que se anota en el libro. `plegado` (la portada de la garita): arranca
   con solo "¿Qué querés anotar?" y los tres tipos; al elegir uno se abre. */
function bitEscribirHtml({ plegado = false } = {}){
  const tipo = plegado ? bitPortalTipo : 'novedad', abierto = !!tipo;
  return `<form data-f="bitacora" class="bt-escribe${plegado ? ' bg2-escribe' + (abierto ? ' abierto' : '') : ''}">${plegado ? `<p class="bg2-pregunta">${I('edit')}¿Qué querés anotar?</p>` : ''}
        <div class="bt-tipos" role="radiogroup" aria-label="Qué querés anotar">${Object.entries(ESCRIBIR_BIT).map(([k, t], i) => `<label class="c-${t.c}"><input type="radio" name="tipo" value="${k}" ${k === tipo ? 'checked' : ''}><span>${I(t.ic)}<b>${t.n}</b></span></label>`).join('')}</div>
        <div class="bt-frases" id="bitFrases">${(ESCRIBIR_BIT[tipo] || ESCRIBIR_BIT.novedad).frases.map(f => `<button type="button" class="chip" data-a="bit-frase" data-v="${esc(f)}">${esc(f.trim())}${/ $/.test(f) ? '…' : ''}</button>`).join('')}</div>
        <div class="bt-linea"><textarea name="texto" id="bitTxt" required maxlength="300" rows="2" placeholder="${esc((ESCRIBIR_BIT[tipo] || ESCRIBIR_BIT.novedad).ph)}"></textarea><button class="bt-mandar" aria-label="Anotar en el libro">${I('send')}</button></div>
        <label class="check bt-avisar" style="margin:8px 0 0" ${tipo === 'incidente' ? 'hidden' : ''}><input type="checkbox" name="avisar"><span>Que le suene también a la Administración</span></label>
        <p class="bt-siempre" ${tipo === 'incidente' ? '' : 'hidden'}>${I('bell')} El incidente le suena siempre a la Administración, con el aviso en rojo.</p></form>`;
}
R.bitacora = {
  titulo: 'Bitácora', icon: 'book', color: 'wood', sub: 'Libro de guardia',
  render(p){
    if (!veGarita()) return vacio('lock', 'El libro de guardia es solo para la guardia, la Administración y la supervisión.');
    const filtro = CAT_BIT[p] ? p : p === 'acceso' ? 'movimiento' : 'todo';
    /* SOLO EL DÍA, DE 00 A 24 H (pedido de Claudio, 10-10-2026). Lo de días
       anteriores se pide con "Ver otro día": se trae de la base en ese
       momento (js/historial.js), igual para la garita y la supervisión. */
    const ini = new Date(hoyISO() + 'T00:00').getTime(), fin = ini + DIA;
    const delDia = aLista(Store.s.bitacora).filter(b => b && b.at >= ini && b.at < fin).sort((a, b) => b.at - a.at);
    const lista = filtro === 'todo' ? delDia : delDia.filter(b => catBit(b) === filtro);
    const cuenta = k => delDia.filter(b => catBit(b) === k).length;
    const escribir = esGuardia() ? bitEscribirHtml()
      : `<div class="garita-vivo">${I('eye')}<div class="grow"><b>El libro de guardia lo escribe la garita</b><span>${esSupervisor() ? 'Desde la supervisión' : 'La Administración'} lo lee en vivo pero no anota ni corrige: es el registro de la guardia. Para pedirle o avisarle algo a la garita, escribile: le llega al instante, con sonido.</span></div>
        <button class="btn btn-xs btn-pri" data-a="abrir" data-v="privado" data-p="${esSupervisor() ? 'supGarita' : 'interno'}">${I('chat')}Escribirle a la garita</button></div>`;
    const items = bitItemsHtml(lista);
    return `${escribir}
      ${notaDejadaHtml()}
      <div class="bt-hero"><span class="bit-hoy-dia"><small>${esc(MESES[new Date().getMonth()])}</small><b>${new Date().getDate()}</b></span>
        <div class="grow"><b>Hoy, ${esc(fechaLarga(hoyISO()).toLowerCase())}</b><small>De 00 a 24 h · ${plural(delDia.length, 'registro')}</small></div>
        <button class="btn btn-sm btn-pri" data-a="bit-otro-dia">${I('calendar')}Otro día</button></div>
      <div class="bt-cats" role="toolbar" aria-label="Filtrar el libro">
        <button class="bt-cat c-brand2 ${filtro === 'todo' ? 'on' : ''}" data-a="abrir" data-v="bitacora" data-p="todo" aria-pressed="${filtro === 'todo'}"><span>${I('book')}</span><b>${delDia.length}</b><small>Todo</small></button>
        ${Object.entries(CAT_BIT).map(([k, c]) => `<button class="bt-cat c-${c.c} ${filtro === k ? 'on' : ''} ${cuenta(k) ? '' : 'cero'}" data-a="abrir" data-v="bitacora" data-p="${k}" aria-pressed="${filtro === k}"><span>${I(c.ic)}</span><b>${cuenta(k)}</b><small>${c.n}</small></button>`).join('')}</div>
      <div class="bt-herr"><div class="bt-buscar">${I('search')}<input id="bitBuscar" type="search" autocomplete="off" placeholder="Buscar en lo de hoy" aria-label="Buscar en el libro de hoy"></div>
        <button class="btn btn-sm btn-sec" data-a="hist-visitas-todo">${I('users')}Historial de visitas</button></div>
      <div class="bt-linea-tiempo">${items || `<div class="bt-vacio">${I('book')}<b>${filtro === 'todo' ? 'Hoy todavía no hay registros' : 'Hoy no hay ' + esc(CAT_BIT[filtro].n.toLowerCase())}</b><small>Lo que se anote aparece acá, en vivo.</small></div>`}</div>
      <details class="plegable card bt-ayuda" data-k="bitAyuda"><summary><b>${I('info')} ¿Qué es cada cosa?</b><span class="muted small">ver</span></summary>
        <ul class="bt-que">
          <li class="c-accent"><b>Novedades</b>Lo de rutina que conviene que quede escrito (una luz quemada, un llamado). Las escribe la garita.</li>
          <li class="c-danger"><b>Incidentes</b>Lo grave. Al anotarlo le suena a la Administración con el aviso en rojo.</li>
          <li class="c-brand"><b>Rondas y policía</b>Las rondas que anota la guardia y, solas, todo lo de la policía nocturna (ingreso, rondas con sus QR, salida) y las casas solas revisadas.</li>
          <li class="c-ok"><b>Entradas y salidas</b>Las anota la app sola con cada ingreso y cada salida: visitas, camión, correos, paquetes y proveedores.</li>
          <li class="c-sky"><b>Turnos</b>Empezar y Cerrar el turno los anotan solos, con los guardias. Lo que se escribe al cerrar ("novedades para el turno que entra") queda fijado arriba para el que llega, va en el renglón del cierre y en el parte por correo: no hace falta escribirlo dos veces.</li></ul>
        <p class="muted tiny" style="margin:8px 0 0">${I('lock')} El libro lo leen solo la garita, la Administración y la supervisión, con fecha, hora y quién lo escribió. No lo ven los vecinos y no se puede borrar. Acá está solo lo de hoy: "Otro día" lo trae de la base.</p></details>`;
  },
};
/* Elegir el tipo cambia las frases rápidas y el aviso. */
document.addEventListener('change', e => {
  const r = e.target; if (!r || r.name !== 'tipo' || !r.closest('.bt-escribe')) return;
  const t = ESCRIBIR_BIT[r.value] || ESCRIBIR_BIT.novedad, f = r.closest('form');
  /* En la portada de la garita, elegir el tipo despliega el renglón (y se recuerda al redibujar). */
  if (f.classList.contains('bg2-escribe')){ bitPortalTipo = r.value; f.classList.add('abierto'); setTimeout(() => f.querySelector('#bitTxt')?.focus({ preventScroll:true }), 260); }
  const fr = f.querySelector('#bitFrases'); if (fr) fr.innerHTML = t.frases.map(x => `<button type="button" class="chip" data-a="bit-frase" data-v="${esc(x)}">${esc(x.trim())}${/ $/.test(x) ? '…' : ''}</button>`).join('');
  const tx = f.querySelector('#bitTxt'); if (tx) tx.placeholder = t.ph;
  f.querySelector('.bt-avisar').hidden = r.value === 'incidente'; f.querySelector('.bt-siempre').hidden = r.value !== 'incidente';
});
A['bit-frase'] = el => { const t = $('#bitTxt'); if (!t) return; const v = el.dataset.v; t.value = /\S$/.test(t.value) && !/ $/.test(v) ? t.value + '. ' + v : t.value + v; t.focus(); t.setSelectionRange(t.value.length, t.value.length); };
document.addEventListener('input', e => {
  if (!e.target || e.target.id !== 'bitBuscar') return;
  const q = normTxt(e.target.value).trim();
  document.querySelectorAll('.bt-linea-tiempo .bt-it').forEach(it => { it.hidden = !!q && !(it.dataset.txt || '').includes(q); });
  document.querySelectorAll('.bt-linea-tiempo .bt-hora').forEach(h => { let n = h.nextElementSibling, ve = false; while (n && !n.classList.contains('bt-hora')){ if (!n.hidden) ve = true; n = n.nextElementSibling; } h.hidden = !ve; });
});
F['bitacora'] = (d, form) => {
  /* El libro lo escribe solo la garita (26-09-2026: la Administración lo
     lee y le escribe por "Mensajes con la garita"). Anota mucho de rutina:
     a la Administración le suena si es un incidente o si la garita lo pide. */
  const tipo = ESCRIBIR_BIT[d.tipo] ? d.tipo : 'novedad', texto = String(d.texto || '').trim(), para = 'rol:admin', avisar = tipo === 'incidente' || !!d.avisar;
  if (!texto) return toast('Escribí qué pasó', 'book');
  Store.cambiar(s => {
    s.bitacora.unshift({ id:uid(), autor:yo().id, tipo, texto, at:Date.now() });
    if (avisar) notificar(s, { para, titulo:`Libro de guardia · ${ESCRIBIR_BIT[tipo].n}`, texto, icon: tipo === 'incidente' ? 'alert' : 'book', color: tipo === 'incidente' ? 'danger' : 'wood', link:'bitacora', sonido:true, urgente: tipo === 'incidente' });
  });
  const i = $('#bitTxt'); if (i) i.value = '';
  if (form && form.classList.contains('bg2-escribe')){ bitPortalTipo = ''; bitPortalCat = 'todo'; refrescar(); }
  toast(avisar ? 'Anotado en el libro de guardia y avisado a la Administración' : 'Anotado en el libro de guardia', 'book');
};

/* ---------- Páginas públicas: la visita pide su pase / ve su QR ---------- */
const PEDIDO_KEY = h => 'bhc.pedido.' + h;
const pedidoGuardado = h => { try { const x = JSON.parse(localStorage.getItem(PEDIDO_KEY(h)) || 'null'); return x && x.codigo && (x.fecha || '') >= hoyISO() ? x : null; } catch(e){ return null; } };
function pintarPedirPase(arg){
  const e = datosEnlace(arg), hostId = e.hostId, u = usuario(hostId);
  const host = { nombre:(u?.nombre || e.nombre || '').split(' ')[0], casa:u?.casa || e.casa };
  const vencido = e.vence && String(e.vence) < hoyISO().replace(/-/g, '');
  const mio = hostId && pedidoGuardado(hostId);
  const blanco = 'style="color:#fff"';
  let panel;
  if (!hostId) panel = aviso('danger', 'alert', 'Enlace no válido', 'Pedile a quien te invitó que te mande uno nuevo desde la app (Mis visitas → Pasale un enlace a tu visita).');
  else if (mio) panel = `<div class="ticket" style="color:var(--ink)"><div class="tk-top"><small>Tu pase de ingreso</small><h3>${esc(mio.nombre)}</h3><div style="opacity:.85;font-size:13px">Te espera ${esc(mio.espera || '')} · ${relDia(mio.fecha)} · ${esc(mio.desde)}–${esc(mio.hasta)}</div></div>
      <div class="bottom"><div class="qr-box" data-qr="BHC:${esc(mio.codigo)}"></div><div class="codigo-grande">${codigoEspaciado(mio.codigo)}</div><div class="muted small">Mostrá el QR en la garita o decí el código</div></div></div>
    <button class="btn btn-wa btn-block" style="margin-top:12px" data-a="pedido-wa" data-v="${esc(hostId)}">${I('share')}Guardarlo en mi WhatsApp</button>
    <p class="tiny" style="margin:8px 2px 0;opacity:.9">Elegí tu propio chat ("Yo" o "Mensaje a mí mismo") y queda guardado. También queda en este teléfono: si volvés a abrir el enlace, lo ves acá.</p>
    <button class="btn btn-sec btn-block" style="margin-top:10px" data-a="cal-ics" data-v="${esc(b64url.a(JSON.stringify({ n:String(mio.nombre || '').split(' ')[0], a:String(mio.espera || '').split(' · ')[0], c:String(mio.espera || '').split(' · ')[1] || '', d:'', f:mio.fecha, u:mio.fecha, h:mio.desde, k:mio.hasta })))}">${I('calendar')}Que mi teléfono me avise una hora antes</button>
    ${botonMapa()}
    <p class="small" style="margin:12px 0 0"><button type="button" class="link" style="color:#fff" data-a="pedido-otro" data-v="${esc(hostId)}">Pedir un pase para otra persona u otro día</button></p>`;
  else if (vencido) panel = aviso('warn', 'clock', 'Este enlace venció', `Pedile a ${esc(host.nombre || 'quien te invitó')} que te mande uno nuevo.`);
  else panel = `<form data-f="pedir-pase" data-host="${esc(hostId)}" data-espera="${esc([host.nombre, host.casa].filter(Boolean).join(' · '))}">
    <p style="margin:0 0 12px">Vas a ver a <b>${esc(host.nombre || 'un vecino')}</b>${host.casa ? ` (${esc(host.casa)})` : ''}. Completá tus datos y te sale tu pase con el QR.</p>
    <div class="field"><label ${blanco}>Tu nombre y apellido</label><input name="nombre" required minlength="3" maxlength="60" autocomplete="name" placeholder="Ej: Juan Pérez"></div>
    <div class="grid2"><div class="field"><label ${blanco}>DNI</label><input name="dni" required inputmode="numeric" maxlength="11" placeholder="Solo números"></div>
      <div class="field"><label ${blanco}>Tu celular</label><input name="tel" type="tel" required inputmode="tel" maxlength="20" autocomplete="tel" placeholder="Ej: 2901 551234"></div></div>
    <div class="field"><label ${blanco}>Patente (si venís en auto)</label><input name="patente" maxlength="10" style="text-transform:uppercase" placeholder="AB 123 CD"></div>
    <div class="grid3"><div class="field"><label ${blanco}>Día</label><input type="date" name="fecha" value="${hoyISO()}" min="${hoyISO()}" required></div>
      <div class="field"><label ${blanco}>Llego</label><input type="time" name="desde" required value="18:00"></div>
      <div class="field"><label ${blanco}>Me voy</label><input type="time" name="hasta" required value="23:00"></div></div>
    <label class="check" style="color:#fff;font-size:12px"><input type="checkbox" required><span>Mis datos se usan solo para el ingreso al barrio y se borran a los ${Store.s.config.datosDias} días (Ley 25.326).</span></label>
    <button class="btn btn-pri btn-block" style="margin-top:8px">${I('qr')}Generar mi pase</button></form>`;
  $('#app').innerHTML = `<section class="bienvenida" id="pedidoPublico"><div class="foto" style="background-image:url('${Clima.portada()}')"></div>
    <div class="marca"><span class="logo">${LOGO}</span><div><b style="font-size:16px">Barrio ${esc(Store.s.config.nombre)}</b><div class="tiny" style="opacity:.85">${esc(Store.s.config.ciudad)}</div></div></div>
    <h1 style="font-size:34px">Tu pase de ingreso</h1><div class="panel">${panel}</div>
    </section>`;
  $$('#pedidoPublico [data-qr]').forEach(el => pintarQR(el, el.dataset.qr));
}
F['pedir-pase'] = async (d, form) => {
  const hostId = form.dataset.host, id = uid();
  if (minutosDe(d.hasta) <= minutosDe(d.desde) && d.hasta !== '00:00') return toast('La hora de salida tiene que ser después de la de llegada', 'clock');
  if (d.fecha < hoyISO()) return toast('Elegí hoy o un día que venga', 'calendar');
  /* Nombre, DNI y celular son obligatorios (pedido de Claudio, 11-10-2026):
     se revisan acá también, por si el teléfono no frena el envío solo. */
  const nombre = String(d.nombre || '').trim().replace(/\s+/g, ' '), dni = soloDigitos(d.dni), tel = String(d.tel || '').trim();
  const falta = c => form.querySelector(`[name=${c}]`)?.focus();
  if (nombre.length < 3){ falta('nombre'); return toast('Escribí tu nombre y apellido', 'user'); }
  if (dni.length < 7 || dni.length > 8){ falta('dni'); return toast('Escribí tu DNI: 7 u 8 números', 'user'); }
  if (soloDigitos(tel).length < 8){ falta('tel'); return toast('Escribí tu celular con la característica (ej: 2901 15 123456)', 'phone'); }
  const r = { id, hostId, nombre, dni, tel, patente:normPatente(d.patente), fecha:d.fecha, desde:d.desde, hasta:d.hasta,
    estado:'listo', codigo:codigoPase(), porEnlace:true, at:Date.now() };
  const boton = form.querySelector('button'); if (boton){ boton.disabled = true; boton.textContent = 'Generando tu pase…'; }
  try {
    if (Nube.activa()){
      if (!Nube.db) throw new Error('Todavía se está conectando. Probá de nuevo en unos segundos.');
      /* Directo a la carpeta del vecino: sin cuenta, la app no guarda nada por su cuenta. */
      await Promise.race([Nube.db.ref(`pv/solicitudesPase/${hostId}/${id}`).set(r),
        new Promise((_, mal) => setTimeout(() => mal(new Error('No hay conexión. Revisá internet y probá de nuevo.')), 15000))]);
    } else Store.cambiar(s => { s.solicitudesPase.unshift(r); });
  } catch(e){
    if (boton){ boton.disabled = false; boton.innerHTML = `${I('qr')}Generar mi pase`; }
    return toast(e.message || 'No se pudo generar el pase. Probá de nuevo.', 'alert');
  }
  try { localStorage.setItem(PEDIDO_KEY(hostId), JSON.stringify({ id, codigo:r.codigo, nombre:r.nombre, fecha:r.fecha, desde:r.desde, hasta:r.hasta, espera:form.dataset.espera || '' })); } catch(e){}
  try { sessionStorage.setItem('bhc.pedidoTmp', JSON.stringify({ hostId, codigo:r.codigo, nombre:r.nombre, fecha:r.fecha, desde:r.desde, hasta:r.hasta, espera:form.dataset.espera || '' })); } catch(e){}
  pintarPedirPase(location.hash.slice(8));
  if (!pedidoGuardado(hostId)) pintarPedidoSinMemoria();
  toast('¡Listo! Ya tenés tu pase', 'check');
};
/* Sin almacenamiento en el teléfono (modo privado): se muestra igual. */
function pintarPedidoSinMemoria(){
  let x = null; try { x = JSON.parse(sessionStorage.getItem('bhc.pedidoTmp') || 'null'); } catch(e){}
  if (!x) return;
  const panel = $('#pedidoPublico .panel'); if (!panel) return;
  panel.innerHTML = `<div class="ticket" style="color:var(--ink)"><div class="tk-top"><small>Tu pase de ingreso</small><h3>${esc(x.nombre)}</h3><div style="opacity:.85;font-size:13px">Te espera ${esc(x.espera || '')} · ${relDia(x.fecha)} · ${esc(x.desde)}–${esc(x.hasta)}</div></div>
    <div class="bottom"><div class="qr-box" data-qr="BHC:${esc(x.codigo)}"></div><div class="codigo-grande">${codigoEspaciado(x.codigo)}</div></div></div>
    <button class="btn btn-wa btn-block" style="margin-top:12px" data-a="pedido-wa" data-v="${esc(x.hostId)}">${I('share')}Guardarlo en mi WhatsApp</button>${botonMapa()}`;
  $$('#pedidoPublico [data-qr]').forEach(el => pintarQR(el, el.dataset.qr));
}
A['pedido-wa'] = el => {
  let x = pedidoGuardado(el.dataset.v); if (!x){ try { x = JSON.parse(sessionStorage.getItem('bhc.pedidoTmp') || 'null'); } catch(e){} }
  if (!x) return;
  const c = Store.s.config, cuando = `${fechaLarga(x.fecha)}, de ${x.desde} a ${x.hasta} h`;
  const texto = `🎟️ *Mi pase para el Barrio ${c.nombre}*\n\n${x.espera ? 'Me espera ' + x.espera + '.\n' : ''}📅 ${cuando}\n🔑 Código: *${codigoEspaciado(x.codigo)}*\n\nEn la garita mostrar el QR o decir el código.\n\n📍 *Cómo llegar:* ${mapaCorto(c.mapa)}`;
  compartirPase({ texto, contenido:'BHC:' + x.codigo, codigo:x.codigo, sub:`Pase de ${x.nombre}`, archivo:`pase-${x.codigo}.png`,
    datos:{ nombre:x.nombre, espera:x.espera || '', cuando:fechaCorta(x.fecha), horario:`${x.desde} a ${x.hasta} h` } });
};
A['pedido-otro'] = el => { try { localStorage.removeItem(PEDIDO_KEY(el.dataset.v)); sessionStorage.removeItem('bhc.pedidoTmp'); } catch(e){} pintarPedirPase(location.hash.slice(8)); };
/* Sin "Volver a mi app" (Claudio, 11-10-2026): la página es de la visita, que no tiene la app. */
function pintarPaseQR(id){
  const p = Store.s.pases.find(x => x.id === id), u = p && usuario(p.hostId);
  $('#app').innerHTML = `<section class="bienvenida"><div class="foto" style="background-image:url('${Clima.portada()}')"></div>
    <div class="marca"><span class="logo">${LOGO}</span><div><b style="font-size:16px">Barrio ${esc(Store.s.config.nombre)}</b></div></div>
    <div class="panel">${p && !p.cancelado ? `<div class="ticket" style="color:var(--ink)"><div class="tk-top"><small>Pase de ingreso</small><h3>${esc(p.nombre)}</h3>
      <div style="opacity:.85;font-size:13px">${esc(u?.casa || '')} · ${p.dias?.length ? p.dias.map(d => DIAS[d]).join(' ') : relDia(p.fecha)} · ${p.desde}–${p.hasta}</div></div>
      <div class="bottom"><div class="qr-box" data-qr="BHC:${p.codigo}"></div><div class="codigo-grande">${codigoEspaciado(p.codigo)}</div><div class="muted small">Mostrá el QR en la garita o decí el código</div></div></div>
      ${botonMapa()}`
      : aviso('danger', 'x', 'Este pase no existe o fue cancelado', '')}</div></section>`;
  $$('[data-qr]').forEach(el => pintarQR(el, el.dataset.qr));
}
/* La página pública ya no se vuelve a dibujar con cada cambio: el pase sale
   en el momento (antes esperaba la aprobación y borraba lo que se escribía). */
