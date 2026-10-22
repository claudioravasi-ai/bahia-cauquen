/* =========================================================
   EL INFORME SEMANAL DE LA POLICÍA NOCTURNA PARA LA SUPERVISIÓN
   (pedido de Claudio, 22-10-2026)

   "Que cada sábado se envíe automáticamente un detalle de todas las
   guardias nocturnas de la policía, seccionado en cada día de la semana,
   con horarios de entradas, salidas, rondas, utilización de las rondas de
   los hub digitales o no, informes y demás acontecimientos que sucedan en
   cada franja horaria, a la supervisión de la policía, en PDF con el logo
   del barrio, similar a la constancia del policía. Con un primer pantallazo
   de un resumen general de lo actuado en la semana."

   CÓMO FUNCIONA
     · La semana va de la noche del sábado a la noche del viernes. Cada
       noche se cuenta como en Turnos (nocheDe): el ingreso de la 1 de la
       mañana es de la noche anterior.
     · LO MANDA LA APP SOLA (pedido de Claudio, 22-10): el sábado, cuando la
       garita registra la SALIDA del policía que entró el viernes a la noche
       (si eran dos, al salir el último), el mismo equipo arma el informe y
       lo manda por correo, con el PDF adjunto, a la supervisión de la
       policía (adicionalush@gmail.com por defecto; la Administración lo
       cambia en la misma ventana). Nadie tiene que tocar nada.
     · Si el viernes no vino ningún policía o no se registró su salida, sale
       igual el sábado desde las 12 desde el equipo de la garita (o de la
       Administración) que esté prendido.
     · A la Administración le llega un aviso ("Salió el informe semanal") y
       la COPIA de lo enviado queda en la base, en
       staff/informesPolicia/ip-<sábado> (el PDF) y staff/informesPoliciaIdx
       (una línea con los números). NINGÚN equipo la baja al abrir la app: se
       trae solo cuando alguien toca "Informes enviados", y solo ese equipo.
       Que no salga dos veces: el primero que anota ip-<sábado> en el índice
       (una transacción de la base) es el que lo manda.
     · En la app: Turnos → "Informe semanal de la policía". La semana en
       curso se arma con lo que el equipo ya tiene (el libro de guardia de
       60 días): no baja nada nuevo. Números grandes, el semáforo de las 7
       noches (tocar una abre su detalle), el mapa de calor de las franjas de
       2 horas, "Ver el PDF", "Mandarlo ahora" e "Informes enviados".

   PROTECCIÓN DE DATOS (Ley 25.326, mínimo necesario)
     · El informe sale a la supervisión de la policía: es la que controla
       el servicio de horas adicionales. Lleva del policía solo nombre,
       cargo y matrícula (nunca su celular ni su correo), los guardias de
       la garita de esa noche y lo que la garita anotó SOBRE el policía.
     · Lo demás que pasó en la garita (visitas, proveedores, novedades de
       los vecinos) va solo como CANTIDAD por franja horaria: ningún nombre,
       lote, DNI ni patente de vecinos o visitas sale del barrio.
     · La copia (staff/informesPolicia y staff/informesPoliciaIdx) la leen
       y la escriben solo la garita y la Administración. Las fotos del PDF
       no se guardan (se vuelven a poner al abrirla): la copia pesa poco.

   Ideas de apps con más de 1000 estrellas en GitHub (solo la idea, el
   código es propio): la barra de días de colores de las páginas de estado
   como openstatus (9,2k★); el mapa de calor por franjas de cal-heatmap
   (3,1k★, MIT) y review-heatmap (1,3k★); la línea de tiempo en cascada de
   markwhen (4,9k★, MIT); las tarjetas de números de tremor (16k★).
   ========================================================= */
'use strict';

const IP_DESTINO_BASE = 'adicionalush@gmail.com';
/* El correo de la supervisión de la policía: el informe del sábado y, si el
   policía no deja el suyo, su constancia (js/v-inicio.js, policia-nuevo). */
const correoSupervisionPolicia = () => String((Store.s && Store.s.config.correoSupervisionPolicia) || IP_DESTINO_BASE).trim().toLowerCase();
/* Un color vivo por noche, de sábado a viernes. */
const IP_COLORES = [['#7c3aed', '#f2ecfe'], ['#e11d48', '#fdebef'], ['#0d9488', '#e7f6f4'], ['#2563eb', '#e9f0fd'], ['#d97706', '#fdf3e2'], ['#15803d', '#e8f6ec'], ['#c026d3', '#fbe8fd']];
/* Las franjas de 2 horas, de las 18 a las 10 de la mañana. */
const IP_FRANJAS = [18, 20, 22, 0, 2, 4, 6, 8];
const IP_EST = { ok:['#16a34a', 'Meta cumplida'], parcial:['#f59e0b', 'Meta sin cumplir'], sin:['#dc2626', 'Sin policía'], curso:['#2563eb', 'En curso'], futura:['#cbd5e1', 'Todavía no'] };
const ipHH = h => String(h).padStart(2, '0');
const ipFranjaTxt = h => `${ipHH(h)} a ${ipHH((h + 2) % 24)} h`;

/* El sábado en que se cierra la semana de un día (si es sábado, ese mismo). */
const sabadoDe = iso => sumarDias(iso, -((fechaDe(iso).getDay() + 1) % 7));
const ipRango = sab => { const a = fechaDe(sumarDias(sab, -7)), b = fechaDe(sumarDias(sab, -1)), m = d => MESES_TV[d.getMonth()];
  return `del sábado ${a.getDate()}${a.getMonth() !== b.getMonth() ? ' de ' + m(a) : ''} al viernes ${b.getDate()} de ${m(b)} de ${b.getFullYear()}`; };

/* ---------- 1. los números de la semana ---------- */
function semanaInforme(sab, svsTodos = serviciosPolicia()){
  const meta = rondaMeta(), ahora = Date.now(), lineas = aLista(Store.s.bitacora).filter(Boolean);
  const dias = [7, 6, 5, 4, 3, 2, 1].map((n, i) => {
    const iso = sumarDias(sab, -n), prog = nocheQueEmpieza(fechaDe(iso));
    const svs = svsTodos.filter(sv => nocheDe(sv.entra) === iso).sort((a, b) => a.entra - b.entra);
    const nombres = svs.map(sv => sv.nombre);
    const rondas = svs.flatMap(sv => sv.rondas.map(r => ({ ...r, qr:aLista(r.qr), faltan:aLista(r.faltan), pol:sv.nombre }))).sort((a, b) => a.inicio - b.inicio);
    const notas = svs.flatMap(sv => aLista(sv.acciones).map(x => ({ ...x, pol:sv.nombre }))).sort((a, b) => a.at - b.at);
    const base = conHoraDe(fechaDe(iso), '18:00');
    const franjas = IP_FRANJAS.map((h, k) => { const a = base + k * 2 * HORA, b = a + 2 * HORA;
      return { h, a, b,
        hay: svs.some(sv => sv.entra < b && (sv.sale || ahora) > a),
        rondas: rondas.filter(r => r.inicio >= a && r.inicio < b),
        qr: rondas.reduce((t, r) => t + r.qr.filter(q => q.at >= a && q.at < b).length, 0),
        notas: notas.filter(x => x.at >= a && x.at < b),
        /* Lo demás de la garita, solo la cantidad (sin nombres de vecinos ni visitas). */
        mov: lineas.filter(l => l.at >= a && l.at < b && l.tipo !== 'turno' && !nombres.some(nm => (l.texto || '').includes(nm))).length,
        inc: lineas.filter(l => l.at >= a && l.at < b && (l.tipo === 'incidente' || l.tipo === 'novedad') && !nombres.some(nm => (l.texto || '').includes(nm))).length }; });
    const completas = rondas.filter(r => claseRonda(r) === 'ok').length;
    const horas = svs.reduce((t, sv) => t + Math.max(0, (sv.sale || ahora) - sv.entra), 0);
    const tarde = svs.length ? Math.round((svs[0].entra - prog.desde) / MIN) : null;
    const estado = prog.desde > ahora ? 'futura' : !svs.length ? 'sin' : svs.some(sv => !sv.sale) ? 'curso' : completas >= meta ? 'ok' : 'parcial';
    return { iso, i, prog, svs, rondas, notas, franjas, completas, horas, tarde, estado,
      conQR: rondas.filter(r => r.conQR).length, sinQR: rondas.filter(r => r.fin && !r.conQR).length, inc: rondas.filter(r => claseRonda(r) === 'inc').length,
      qrLeidos: rondas.reduce((t, r) => t + r.qr.length, 0), qrTotal: rondas.reduce((t, r) => t + (r.conQR ? (r.total || r.qr.length) : 0), 0) };
  });
  const sum = k => dias.reduce((t, d) => t + d[k], 0), pasadas = dias.filter(d => d.estado !== 'futura');
  const conPol = dias.filter(d => d.svs.length), rondas = sum('completas') + sum('inc') + sum('sinQR');
  const policias = [...new Map(dias.flatMap(d => d.svs).map(sv => [claveNombre(sv.nombre), sv])).values()];
  const t = { noches: conPol.length, pasadas: pasadas.length, metaOk: dias.filter(d => d.estado === 'ok').length, horas: sum('horas'), rondas, completas: sum('completas'),
    conQR: sum('conQR'), sinQR: sum('sinQR'), inc: sum('inc'), qrLeidos: sum('qrLeidos'), qrTotal: sum('qrTotal'), notas: dias.reduce((n, d) => n + d.notas.length, 0),
    aHorario: conPol.filter(d => d.tarde != null && d.tarde <= 10).length, policias, meta };
  t.pctQR = t.qrTotal ? Math.round(t.qrLeidos / t.qrTotal * 100) : 0;
  t.pctHub = rondas ? Math.round(t.conQR / rondas * 100) : 0;
  return { sab, dias, t, obs: observacionesSemana(dias, t) };
}
/* Lo que conviene que la supervisión mire, en frases cortas. */
function observacionesSemana(dias, t){
  const o = [], nom = d => `${DIAS_L[fechaDe(d.iso).getDay()]} ${fechaDe(d.iso).getDate()}`;
  const sin = dias.filter(d => d.estado === 'sin');
  if (sin.length) o.push(['alerta', `${sin.length === 1 ? 'La noche del ' : 'Las noches del '}${sin.map(nom).join(', ')} no se registró el ingreso de ningún policía.`]);
  dias.filter(d => d.tarde != null && d.tarde > 10).forEach(d => o.push(['aviso', `La noche del ${nom(d)} el ingreso fue a las ${hora(d.svs[0].entra)} h, ${d.tarde} minutos después del horario (${hora(d.prog.desde)} h).`]));
  dias.filter(d => d.estado === 'parcial').forEach(d => o.push(['aviso', `La noche del ${nom(d)} se completaron ${d.completas} de ${t.meta} rondas con QR.`]));
  const faltan = {}; dias.forEach(d => d.rondas.forEach(r => r.faltan.forEach(n => { faltan[n] = (faltan[n] || 0) + 1; })));
  Object.entries(faltan).sort((a, b) => b[1] - a[1]).slice(0, 3).forEach(([n, k]) => o.push(['aviso', `El punto "${n}" quedó sin leer en ${plural(k, 'ronda')} de la semana.`]));
  dias.forEach(d => { const rs = d.rondas.filter(r => r.inicio); for (let k = 1; k < rs.length; k++){ const h = (rs[k].inicio - (rs[k - 1].fin || rs[k - 1].inicio)) / HORA;
    if (h >= 3){ o.push(['aviso', `La noche del ${nom(d)} pasaron ${Math.floor(h)} h ${Math.round(h % 1 * 60)} min entre una ronda y la siguiente (${hora(rs[k - 1].fin || rs[k - 1].inicio)} a ${hora(rs[k].inicio)} h).`]); break; } } });
  if (t.sinQR) o.push(['info', `${plural(t.sinQR, 'ronda se anotó', 'rondas se anotaron')} sin los QR del hub digital (a mano o por la garita).`]);
  if (!o.length && t.noches) o.push(['ok', 'Semana sin observaciones: todas las noches hubo policía, a horario y con las rondas completas.']);
  return o;
}

/* ---------- 2. el PDF ---------- */
function ipPdfHtml(sem, im = {}){
  const c = Store.s.config, barrio = esc(c.nombre), t = sem.t;
  const tit = (txt, col = '#0b1f3a') => `<div style="font-size:10.5px;font-weight:800;letter-spacing:.16em;text-transform:uppercase;color:${col};margin:18px 0 8px">${txt}</div>`;
  const kpi = (arriba, n, abajo, col) => `<td width="25%" style="padding:0 4px" valign="top"><div style="border-radius:14px;padding:11px 12px;background:${col};color:#fff">
      <div style="font-size:9px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;opacity:.9">${arriba}</div>
      <div style="font-size:24px;font-weight:800;line-height:1.15;margin-top:2px">${n}</div><div style="font-size:10px;opacity:.92">${abajo}</div></div></td>`;
  const nom = d => { const f = fechaDe(d.iso); return `${DIAS_L[f.getDay()].replace(/^./, x => x.toUpperCase())} ${f.getDate()}`; };

  /* El semáforo de la semana: una columna por noche. */
  const semaforo = `<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate;border-spacing:4px 0;table-layout:fixed"><tr>${sem.dias.map(d => { const [col] = IP_EST[d.estado];
    return `<td valign="top" style="background:${d.estado === 'futura' ? '#f1f5f9' : col};border-radius:12px;padding:8px 4px;text-align:center;color:${d.estado === 'futura' ? '#64748b' : '#fff'}">
      <div style="font-size:9px;font-weight:800;letter-spacing:.08em;text-transform:uppercase">${DIAS[fechaDe(d.iso).getDay()]} ${fechaDe(d.iso).getDate()}</div>
      <div style="font-size:20px;font-weight:800;line-height:1.2">${d.svs.length ? d.completas + '/' + t.meta : '—'}</div>
      <div style="font-size:8.5px;line-height:1.25">${d.svs.length ? (d.svs[0].sale ? hora(d.svs[0].entra) + '–' + hora(d.svs[d.svs.length - 1].sale) : hora(d.svs[0].entra) + ' →') : IP_EST[d.estado][1]}</div></td>`; }).join('')}</tr></table>`;

  /* El mapa de calor: noches por franjas de 2 horas (QR leídos en cada una). */
  const maxQR = Math.max(1, ...sem.dias.flatMap(d => d.franjas.map(f => f.qr)));
  const calor = `<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate;border-spacing:3px;table-layout:fixed;font-size:9.5px">
    <tr><td width="64"></td>${IP_FRANJAS.map(h => `<td style="text-align:center;color:#5b6b80;font-weight:700">${ipHH(h)} h</td>`).join('')}</tr>
    ${sem.dias.map(d => `<tr><td style="font-weight:800;color:${IP_COLORES[d.i][0]};white-space:nowrap">${DIAS[fechaDe(d.iso).getDay()]} ${fechaDe(d.iso).getDate()}</td>${d.franjas.map(f => {
      const a = f.qr ? .25 + .75 * f.qr / maxQR : 0, bg = f.qr ? `rgba(124,58,237,${a.toFixed(2)})` : f.hay ? '#e0e7ff' : '#f1f5f9';
      return `<td style="height:22px;background:${bg};border-radius:6px;text-align:center;font-weight:800;color:${a > .55 ? '#fff' : '#3b3b6d'}">${f.qr || (f.rondas.length ? '•' : '')}</td>`; }).join('')}</tr>`).join('')}</table>
    <div style="font-size:9.5px;color:#5b6b80;margin-top:4px">El número es la cantidad de QR del hub digital leídos en esa franja. Celeste: el policía estaba de servicio. Gris: sin policía en el barrio.</div>`;

  /* Cada noche, en su encuadre de color. */
  const noche = d => {
    const [col, claro] = IP_COLORES[d.i], [ecol, etxt] = IP_EST[d.estado];
    const cab = `<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:${col}"><tr>
      <td width="64" style="padding:10px 0 10px 14px"><div style="width:44px;height:44px;border-radius:22px;background:#fff;color:${col};text-align:center"><div style="font-size:9px;font-weight:800;padding-top:6px">${DIAS[fechaDe(d.iso).getDay()].toUpperCase()}</div><div style="font-size:18px;font-weight:800;line-height:1">${fechaDe(d.iso).getDate()}</div></div></td>
      <td style="padding:10px 8px;color:#fff"><div style="font-size:16px;font-weight:800">${esc(nocheTitulo(d.iso))}</div>
        <div style="font-size:11.5px;opacity:.95">Horario del policía: ${hora(d.prog.desde)} a ${hora(d.prog.hasta)} h${d.svs.length ? ` · ${plural(d.rondas.length, 'ronda')} · ${cpDur(d.horas)} de servicio` : ''}</div></td>
      <td align="right" style="padding:10px 14px"><span style="display:inline-block;background:#fff;color:${ecol};font-size:10px;font-weight:800;letter-spacing:.06em;padding:5px 10px;border-radius:20px;white-space:nowrap">${etxt.toUpperCase()}</span></td></tr></table>`;
    if (!d.svs.length) return `<div style="page-break-inside:avoid;margin:0 0 12px;border:2px solid ${col};border-radius:16px;overflow:hidden;background:${claro}">${cab}
      <div style="padding:12px 16px;font-size:12px;color:#334155">${d.estado === 'futura' ? 'Esta noche todavía no llegó.' : '<b style="color:#b91c1c">No se registró el ingreso de ningún policía esta noche.</b>'}${d.franjas.some(f => f.mov) ? ` Movimientos de la garita en el horario: ${d.franjas.reduce((n, f) => n + f.mov, 0)}.` : ''}</div></div>`;
    const pol = d.svs.map(sv => `<tr><td style="padding:8px 0 8px 14px" width="46"><div style="width:34px;height:34px;border-radius:17px;background:#0b1f3a;color:#f5b70a;font-size:13px;font-weight:800;text-align:center;line-height:34px">${esc(inicialesDe(sv.nombre))}</div></td>
      <td style="padding:8px 6px"><b style="font-size:13px">${esc(sv.nombre)}</b><div style="font-size:10.5px;color:#475569">${esc([sv.cargo, sv.matricula ? 'Matrícula ' + sv.matricula : ''].filter(Boolean).join(' · ') || 'Sin cargo ni matrícula')}${sv.guardias.length ? ' · Garita: ' + esc(sv.guardias.join(', ')) : ''}</div></td>
      <td width="96" style="padding:8px 4px;text-align:center"><div style="font-size:9px;color:#475569;font-weight:700">INGRESO</div><div style="font-size:15px;font-weight:800;color:${col}">${hora(sv.entra)} h</div></td>
      <td width="96" style="padding:8px 14px 8px 4px;text-align:center"><div style="font-size:9px;color:#475569;font-weight:700">SALIDA</div><div style="font-size:15px;font-weight:800;color:${col}">${sv.sale ? hora(sv.sale) + ' h' : '—'}</div></td></tr>`).join('');
    const ronda = (r, k) => { const cl = claseRonda(r), ok = cl === 'ok', rc = ok ? '#16a34a' : cl === 'inc' ? '#dc2626' : cl === 'curso' ? '#2563eb' : '#64748b';
      const hub = r.conQR ? `Hub digital (QR) · ${r.qr.length} de ${r.total || r.qr.length} puntos` : r.aMano ? `Sin QR · anotada a mano${r.motivo ? ' (' + esc(r.motivo.charAt(0).toLowerCase() + r.motivo.slice(1)) + ')' : ''}` : 'Sin QR · la anotó la garita';
      return `<tr style="background:${k % 2 ? '#ffffff' : claro}"><td width="30" valign="top" style="padding:6px 0 6px 12px"><div style="width:22px;height:22px;border-radius:11px;background:${col};color:#fff;font-size:11px;font-weight:800;text-align:center;line-height:22px">${k + 1}</div></td>
        <td width="104" valign="top" style="padding:6px 4px;font-weight:800;white-space:nowrap">${hora(r.inicio)}${r.fin ? '–' + hora(r.fin) : ''} h<div style="font-size:9.5px;font-weight:400;color:#64748b">${r.fin ? minutos(r.inicio, r.fin) + ' min' : 'en curso'}</div></td>
        <td valign="top" style="padding:6px 4px;font-size:11px"><b style="color:${rc}">${RONDA_TXT[cl].toUpperCase()}</b> · ${hub}${d.svs.length > 1 ? ' · ' + esc(r.pol) : ''}
          ${r.qr.length ? `<div style="font-size:9.5px;color:#475569;margin-top:2px">${r.qr.map(q => `${esc(q.n)} ${hora(q.at)}`).join(' · ')}</div>` : ''}
          ${r.faltan.length ? `<div style="font-size:9.5px;color:#b91c1c;margin-top:2px"><b>Sin leer:</b> ${esc(r.faltan.join(', '))}</div>` : ''}</td></tr>`; };
    const franjas = d.franjas.filter(f => f.hay || f.rondas.length || f.notas.length || f.inc);
    return `<div style="margin:0 0 14px;border:2px solid ${col};border-radius:16px;overflow:hidden;background:#fff">${cab}
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:${claro}">${pol}</table>
      ${d.rondas.length ? `<div style="padding:8px 14px 2px;font-size:10px;font-weight:800;letter-spacing:.12em;color:${col}">LAS RONDAS</div>
        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">${d.rondas.map(ronda).join('')}</table>` : `<div style="padding:10px 14px;font-size:12px;color:#b91c1c"><b>No se registraron rondas esta noche.</b></div>`}
      <div style="page-break-inside:avoid"><div style="padding:10px 14px 2px;font-size:10px;font-weight:800;letter-spacing:.12em;color:${col}">FRANJA POR FRANJA</div>
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:10.5px">${franjas.map((f, k) => `<tr style="border-top:1px solid #e2e8f0">
        <td width="84" valign="top" style="padding:5px 4px 5px 14px;font-weight:800;color:#0b1f3a;white-space:nowrap">${ipFranjaTxt(f.h)}</td>
        <td valign="top" style="padding:5px 14px 5px 4px;color:#334155">${[
          f.hay ? '' : '<span style="color:#b91c1c">sin policía de servicio</span>',
          f.rondas.length ? `${plural(f.rondas.length, 'ronda empezada', 'rondas empezadas')} (${f.rondas.map(r => hora(r.inicio)).join(', ')})` : '',
          f.qr ? `${plural(f.qr, 'QR leído', 'QR leídos')}` : '',
          ...f.notas.map(x => `<b>${hora(x.at)}</b> ${esc(x.texto)}`),
          f.inc ? `<span style="color:#b45309">${plural(f.inc, 'novedad de la garita', 'novedades de la garita')}</span>` : '',
          f.mov ? `<span style="color:#64748b">${plural(f.mov, 'movimiento', 'movimientos')} en la garita</span>` : '',
        ].filter(Boolean).join(' · ') || '<span style="color:#64748b">de servicio, sin movimientos</span>'}</td></tr>`).join('')}</table></div></div>`;
  };

  const OBS = { alerta:['#dc2626', '!'], aviso:['#d97706', '!'], info:['#2563eb', 'i'], ok:['#16a34a', '✓'] };
  return `<div style="font-family:Arial,Helvetica,sans-serif;color:#0b1f3a;max-width:720px;margin:0 auto;font-size:12px;line-height:1.45">
  <div style="border-radius:18px;overflow:hidden;background:#0b1f3a">
    ${im.portada ? `<img src="${im.portada}" width="720" style="display:block;width:100%;height:auto" alt="El barrio ${barrio} de noche">` : ''}
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse"><tr>
      ${im.logo ? `<td width="76" style="padding:16px 0 18px 20px"><img src="${im.logo}" width="58" height="58" style="display:block;border-radius:29px;background:#fff" alt=""></td>` : ''}
      <td style="padding:16px 20px 18px;color:#fff"><div style="font-size:10px;font-weight:700;letter-spacing:.22em;text-transform:uppercase;color:#f5b70a">Barrio ${barrio} · Supervisión de Adicionales Policiales</div>
        <div style="font-size:26px;font-weight:800;line-height:1.15;margin-top:3px">Informe semanal de la guardia policial nocturna</div>
        <div style="font-size:12.5px;color:#c7d3e6;margin-top:2px">Servicio de policía adicional · noches ${esc(ipRango(sem.sab))}</div></td>
      <td width="110" align="right" style="padding:16px 20px 18px 0;color:#c7d3e6;font-size:10px;line-height:1.5">Emitido el<br><b style="color:#fff">${fechaCorta(isoDe(new Date()))} · ${hora(Date.now())} h</b></td></tr></table>
  </div>
  <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse"><tr>${IP_COLORES.map(([col]) => `<td style="height:6px;background:${col}"></td>`).join('')}</tr></table>

  ${tit('La semana de un vistazo')}
  <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate;margin:0 -4px"><tr>
    ${kpi('Noches cubiertas', `${t.noches} de 7`, `${t.aHorario} a horario`, '#7c3aed')}
    ${kpi('Horas de servicio', Math.round(t.horas / HORA) + ' h', plural(t.policias.length, 'policía'), '#2563eb')}
    ${kpi('Rondas', t.rondas, `${t.completas} completas · meta ${t.metaOk}/${t.pasadas || 7} noches`, '#0d9488')}
    ${kpi('Hub digital', t.pctHub + ' %', `de las rondas con QR · ${t.pctQR} % de los puntos`, '#e11d48')}</tr></table>

  ${tit('Las 7 noches')}${semaforo}
  <table cellpadding="0" cellspacing="0" style="margin-top:6px;font-size:9.5px;color:#5b6b80"><tr>${['ok', 'parcial', 'sin', 'curso'].map(k => `<td style="padding-right:12px"><span style="display:inline-block;width:9px;height:9px;border-radius:5px;background:${IP_EST[k][0]}"></span> ${IP_EST[k][1]}</td>`).join('')}<td>· el número: rondas completas con QR / meta</td></tr></table>

  ${sem.obs.length ? `<div style="page-break-inside:avoid">${tit('Para tener en cuenta')}
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border:1.5px solid #dbe3ee;border-radius:14px">${sem.obs.map(([k, txt], j) => `<tr style="background:${j % 2 ? '#fff' : '#f7f9fc'}">
      <td width="36" valign="top" style="padding:7px 0 7px 12px"><div style="width:20px;height:20px;border-radius:10px;background:${OBS[k][0]};color:#fff;font-size:11px;font-weight:800;text-align:center;line-height:20px">${OBS[k][1]}</div></td>
      <td style="padding:7px 14px 7px 4px;font-size:11.5px;color:#1e293b">${esc(txt)}</td></tr>`).join('')}</table></div>` : ''}

  <div style="page-break-inside:avoid">${tit('Franjas horarias de la semana')}${calor}</div>

  ${tit('Noche por noche', '#7c3aed')}
  ${sem.dias.map(noche).join('')}

  <div style="page-break-inside:avoid;margin-top:18px;border-radius:18px;background:#0b1f3a;color:#fff;padding:20px 24px">
    <div style="font-size:10px;font-weight:700;letter-spacing:.22em;text-transform:uppercase;color:#f5b70a">A la Supervisión de Adicionales Policiales</div>
    <div style="font-size:13px;line-height:1.6;color:#e2e8f0;margin-top:6px">Agradecemos a la supervisión y a cada efectivo que cubrió las noches de esta semana. Su presencia, sus rondas y su compromiso hacen que las familias de ${barrio} descansen tranquilas. Quedamos a disposición para cualquier consulta sobre este informe.</div>
    <div style="margin-top:12px;padding-top:10px;border-top:1px solid #33496b;font-size:12px;color:#f5b70a;font-weight:700">La Administración y la garita del Barrio ${barrio}</div>
  </div>
  <div style="margin-top:12px;font-size:9.5px;color:#7a8799;line-height:1.5">Informe armado solo por la app del barrio con lo que registró la garita y con la hora exacta de cada QR leído por el policía en los puntos de control (hub digital). Del policía lleva solo su nombre, cargo y matrícula. Los demás movimientos de la garita van solo como cantidad, sin datos de vecinos ni de visitas (Ley 25.326).</div>
</div>`;
}
const ipPdfDoc = cuerpo => `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Informe semanal de la policía</title><style>@page{size:A4;margin:9mm}body{margin:0;-webkit-print-color-adjust:exact;print-color-adjust:exact}</style></head><body>${cuerpo}</body></html>`;
/* El correo: el resumen en grande y el informe completo en el PDF adjunto. */
function ipCorreoHtml(sem){
  const t = sem.t, dato = (tt, v, col) => `<td width="25%" style="padding:10px 6px;background:${col};border-radius:12px;text-align:center;color:#fff"><div style="font-size:10px;text-transform:uppercase;letter-spacing:.08em;opacity:.9">${tt}</div><div style="font-size:19px;font-weight:800">${v}</div></td>`;
  return Correo.plantilla('Informe semanal · Supervisión de Adicionales Policiales', `
    <p style="margin:0 0 12px">Buen día. A la Supervisión de Adicionales Policiales: les enviamos el informe de la policía adicional del Barrio ${esc(Store.s.config.nombre)}, noches ${esc(ipRango(sem.sab))}. El detalle de cada noche (ingresos, salidas, rondas con y sin QR y lo que pasó en cada franja horaria) va en el <b>PDF adjunto</b>.</p>
    <table width="100%" cellpadding="0" cellspacing="6" style="border-collapse:separate;margin:0 0 10px"><tr>${dato('Noches', t.noches + '/7', '#7c3aed')}${dato('Horas', Math.round(t.horas / HORA), '#2563eb')}${dato('Rondas', t.rondas, '#0d9488')}${dato('Con QR', t.pctHub + ' %', '#e11d48')}</tr></table>
    <table width="100%" cellpadding="0" cellspacing="4" style="border-collapse:separate;margin:0 0 12px"><tr>${sem.dias.map(d => `<td style="background:${d.estado === 'futura' ? '#e2e8f0' : IP_EST[d.estado][0]};color:#fff;border-radius:8px;text-align:center;padding:6px 2px;font-size:11px;font-weight:700">${DIAS[fechaDe(d.iso).getDay()]} ${fechaDe(d.iso).getDate()}<br>${d.svs.length ? d.completas + '/' + t.meta : '—'}</td>`).join('')}</tr></table>
    ${sem.obs.filter(o => o[0] !== 'info').slice(0, 4).map(o => `<p style="margin:0 0 6px;color:${o[0] === 'ok' ? '#15803d' : '#b45309'}">• ${esc(o[1])}</p>`).join('')}
    <p style="margin:12px 0 0;color:#334155">Si no ven el archivo adjunto, pídanlo a la Administración del barrio.</p>`);
}

/* ---------- 3. el envío y la copia ---------- */
/* La copia vive en la base, fuera de lo que baja al abrir la app. Sin la
   base (?local, la demo), en este equipo. */
const IPCopia = {
  enBase: () => typeof Nube !== 'undefined' && Nube.activa() && !!Nube.db,
  local(k, v){ try { const m = JSON.parse(localStorage.getItem('bhc.prueba.informesPolicia') || '{}'); if (v === undefined) return m[k] || null;
    m[k] = v; localStorage.setItem('bhc.prueba.informesPolicia', JSON.stringify(m)); } catch(e){} return v; },
  /* Anota "lo estoy mandando" solo si nadie lo anotó antes (o si falló hace rato). */
  async reclamar(id, marca, forzar){
    const sirve = cur => !cur || forzar || (!cur.ok && Date.now() - (cur.at || 0) > 30 * MIN && (cur.intentos || 0) < 3);
    if (!this.enBase()){ const cur = this.local('idx-' + id); if (!sirve(cur)) return false; this.local('idx-' + id, { ...marca, intentos:((cur && cur.intentos) || 0) + 1 }); return true; }
    const r = await Nube.db.ref('staff/informesPoliciaIdx/' + id).transaction(cur => sirve(cur) ? { ...marca, intentos:((cur && cur.intentos) || 0) + 1 } : undefined);
    return !!r.committed;
  },
  async idx(id){ if (!this.enBase()) return this.local('idx-' + id); return (await Nube.db.ref('staff/informesPoliciaIdx/' + id).get()).val(); },
  async guardar(id, idx, copia){
    if (!this.enBase()){ this.local('idx-' + id, idx); this.local('cp-' + id, copia); return; }
    await Nube.db.ref().update({ ['staff/informesPoliciaIdx/' + id]:idx, ['staff/informesPolicia/' + id]:copia });
  },
  async lista(){
    if (!this.enBase()){ try { const m = JSON.parse(localStorage.getItem('bhc.prueba.informesPolicia') || '{}'); return Object.keys(m).filter(k => k.startsWith('idx-')).map(k => m[k]); } catch(e){ return []; } }
    return Object.values((await Nube.db.ref('staff/informesPoliciaIdx').orderByKey().limitToLast(26).get()).val() || {});
  },
  async copia(id){ if (!this.enBase()) return this.local('cp-' + id); return (await Nube.db.ref('staff/informesPolicia/' + id).get()).val(); },
};
const IP_PORTADA = '@@PORTADA@@', IP_LOGO = '@@LOGO@@';
const ipConFotos = (html, im) => String(html || '').split(IP_PORTADA).join(im.portada || '').split(IP_LOGO).join(im.logo || '');

const InformePolicia = {
  enviando:false, hecho:{},
  /* El disparador: la salida del último policía de la noche del viernes (F['policia-salida']). */
  alSalir(pid){
    const sv = serviciosPolicia().find(x => x.id === pid); if (!sv || !sv.sale) return;
    const noche = nocheDe(sv.entra); if (fechaDe(noche).getDay() !== 5) return;
    if (serviciosPolicia().some(x => !x.sale && nocheDe(x.entra) === noche)) return;
    setTimeout(() => this.mandar(sumarDias(noche, 1), { motivo:'salida' }), 4000);
  },
  /* Por si el viernes no vino nadie o no se registró la salida: el sábado
     desde las 12, un equipo de la garita o de la Administración. Una
     consulta chiquita (una línea del índice) cada 30 minutos, solo ese día. */
  tic(){
    if (!Store.s || !yo() || this.enviando || !(esGuardia() || esAdmin())) return;
    if (IPCopia.enBase() && !Nube.listoParaMotor()) return;
    const hoy = hoyISO(); if (fechaDe(hoy).getDay() !== 6 || this.hecho[hoy] || Date.now() < conHoraDe(fechaDe(hoy), '12:00')) return;
    try { const k = 'bhc.ip.' + hoy, v = +localStorage.getItem(k) || 0; if (Date.now() - v < 30 * MIN) return; localStorage.setItem(k, String(Date.now())); } catch(e){}
    this.mandar(hoy, { motivo:'mediodia' });
  },
  async mandar(sab, { motivo = 'salida', avisar = false } = {}){
    if (this.enviando) return; this.enviando = true;
    const id = 'ip-' + sab, para = correoSupervisionPolicia();
    try {
      const yaEsta = await IPCopia.idx(id).catch(() => null);
      if (yaEsta && yaEsta.ok && !avisar){ this.hecho[sab] = true; return; }
      if (!await IPCopia.reclamar(id, { id, semana:sab, at:Date.now(), ok:false, para, motivo, enviando:true }, avisar)){ this.hecho[sab] = true; return; }
      const sem = semanaInforme(sab), t = sem.t, im = await constanciaImgs();
      const resumen = { noches:t.noches, horas:Math.round(t.horas / HORA), rondas:t.rondas, completas:t.completas, conQR:t.conQR, metaOk:t.metaOk, pctHub:t.pctHub };
      const pdfHtml = ipPdfDoc(ipPdfHtml(sem, { portada:IP_PORTADA, logo:IP_LOGO }));
      const asunto = `Informe semanal de adicionales policiales · Barrio ${Store.s.config.nombre} · ${fechaCorta(sumarDias(sab, -7))} al ${fechaCorta(sumarDias(sab, -1))}`;
      const r = await Correo.enviarDetalle({ para, asunto, html:ipCorreoHtml(sem), tipo:'informe-policia',
        pdf:{ html:ipConFotos(pdfHtml, im), nombre:`Informe semanal policia ${sumarDias(sab, -7)} al ${sumarDias(sab, -1)}.pdf` } });
      const idx = { id, semana:sab, at:Date.now(), ok:r.ok, para, motivo, error:r.ok ? '' : String(r.error || '').slice(0, 120), resumen, intentos:((yaEsta && yaEsta.intentos) || 0) + 1 };
      await IPCopia.guardar(id, idx, { id, semana:sab, at:Date.now(), para, asunto, html:pdfHtml });
      this.hecho[sab] = r.ok;
      /* El aviso a la Administración y un renglón en el libro de guardia. */
      Store.cambiar(s => {
        notificar(s, { para:cuentasAdministracion(), titulo: r.ok ? 'Salió el informe semanal de la policía' : 'No salió el informe semanal de la policía',
          texto: r.ok ? `Noches ${ipRango(sab)} · ${t.noches}/7 noches · ${plural(t.rondas, 'ronda')}. Enviado a ${para}: la copia está en Turnos.` : `No se pudo mandar a ${para}: ${String(r.error || '').replace(/\.+$/, '')}. Mandalo desde Turnos → Informe semanal de la policía → Mandarlo ahora.`,
          icon:'file', color: r.ok ? 'accent' : 'danger', link:'turnos', sonido:true });
        if (r.ok) s.bitacora.unshift({ id:uid(), autor:yo().id, tipo:'informe-policia', texto:`Salió por correo a la supervisión de la policía el informe semanal de las noches ${ipRango(sab)}.`, at:Date.now() });
      });
      if (avisar) toast(r.ok ? `El informe salió por correo a ${para}` : 'El informe no salió por correo: ' + r.error, r.ok ? 'mail' : 'alert');
    } catch(e){ console.warn('Informe semanal de la policía', e); if (avisar) toast('No se pudo armar el informe: ' + e.message, 'alert'); }
    finally { this.enviando = false; }
  },
};
setInterval(() => { try { InformePolicia.tic(); } catch(e){ console.warn('Informe semanal de la policía', e); } }, 60000);

/* ---------- 4. en la app: Turnos → "Informe semanal de la policía" ---------- */
const IPV = { sab:'', dia:-1 };
const ipSabados = () => { const hoy = hoyISO(), ult = sabadoDe(hoy), prox = fechaDe(hoy).getDay() === 6 ? ult : sumarDias(ult, 7); return [...new Set([prox, ult, sumarDias(ult, -7), sumarDias(ult, -14)])]; };
/* La tarjeta de entrada, en Turnos (debajo de "Las noches del policía"). No baja nada. */
function tarjetaInformePolicia(){
  if (!esStaff()) return '';
  return `<button class="ip-tarjeta" data-a="ip-abrir"><span class="ip-t-ic">${I('file')}</span>
    <span class="grow"><b>Informe semanal de la policía</b><small>Sale solo el sábado, al registrarse la salida del policía del viernes · en PDF a ${esc(correoSupervisionPolicia())}</small></span>${I('right')}</button>`;
}
A['ip-abrir'] = () => {
  if (!esStaff()) return;
  const sabs = ipSabados(); if (!sabs.includes(IPV.sab)) IPV.sab = sabs[0];
  const sem = semanaInforme(IPV.sab), t = sem.t, d = sem.dias[IPV.dia] || null;
  const enCurso = IPV.sab >= hoyISO();
  const maxQR = Math.max(1, ...sem.dias.flatMap(z => z.franjas.map(f => f.qr)));
  const kp = (ic, n, txt, sub, cl) => `<div class="ip-k ${cl}">${I(ic)}<b>${n}</b><span>${txt}</span><small>${sub}</small></div>`;
  hoja('Informe semanal de la policía', `<div class="ip">
    <div class="ip-semanas">${sabs.map(s => `<button type="button" class="${s === IPV.sab ? 'on' : ''}" data-a="ip-semana" data-v="${s}">${s === sabs[0] ? 'Esta semana' : `${fechaDe(sumarDias(s, -7)).getDate()}–${fechaDe(sumarDias(s, -1)).getDate()} ${MESES[fechaDe(sumarDias(s, -1)).getMonth()]}`}</button>`).join('')}</div>
    <div class="ip-hero"><small>Noches ${esc(ipRango(IPV.sab))}</small><b>${enCurso ? 'La semana en curso' : 'Lo actuado por la policía en la semana'}</b>
      <div class="ip-kpis">${kp('moon', t.noches + '/7', 'noches cubiertas', `${t.aHorario} a horario`, 'k1')}${kp('clock', Math.round(t.horas / HORA) + ' h', 'de servicio', plural(t.policias.length, 'policía'), 'k2')}
        ${kp('pin', t.rondas, 'rondas', `${t.completas} completas · meta ${t.metaOk} noches`, 'k3')}${kp('qr', t.pctHub + ' %', 'con hub digital', `${t.qrLeidos} QR leídos`, 'k4')}</div></div>
    <div class="ip-lbl">Las 7 noches · tocá una para ver su detalle</div>
    <div class="ip-semaforo">${sem.dias.map(z => `<button type="button" class="ip-n e-${z.estado} ${IPV.dia === z.i ? 'on' : ''}" data-a="ip-dia" data-v="${z.i}" style="--c:${IP_COLORES[z.i][0]}">
      <small>${DIAS[fechaDe(z.iso).getDay()]} ${fechaDe(z.iso).getDate()}</small><b>${z.svs.length ? z.completas + '/' + t.meta : '—'}</b><span>${z.svs.length ? hora(z.svs[0].entra) : IP_EST[z.estado][1]}</span>
      <i>${z.rondas.map(r => `<em class="r-${claseRonda(r)}"></em>`).join('')}</i></button>`).join('')}</div>
    ${d ? `<div class="ip-dia" style="--c:${IP_COLORES[d.i][0]}"><div class="ip-dia-cab"><b>${esc(nocheTitulo(d.iso))}</b><span class="ip-est e-${d.estado}">${IP_EST[d.estado][1]}</span></div>
      ${d.svs.length ? d.svs.map(sv => `<div class="ip-pol"><span class="nc-ini" style="--c:${colorDe(sv.nombre)}">${esc(inicialesDe(sv.nombre))}</span><span class="grow"><b>${esc(sv.nombre)}</b><small>${esc(pnCargoMat(sv, ' · '))}${sv.guardias.length ? 'garita: ' + esc(sv.guardias.join(', ')) : ''}</small></span>
          <span class="ip-hs"><small>entró</small><b>${hora(sv.entra)}</b></span><span class="ip-hs"><small>salió</small><b>${sv.sale ? hora(sv.sale) : '—'}</b></span></div>`).join('')
        : `<p class="muted small">${d.estado === 'futura' ? 'Esta noche todavía no llegó.' : 'No se registró el ingreso de ningún policía.'}</p>`}
      ${d.rondas.length ? `<ol class="ip-rondas">${d.rondas.map(r => `<li class="r-${claseRonda(r)}"><b>${hora(r.inicio)}${r.fin ? '–' + hora(r.fin) : ''}</b><span>${RONDA_TXT[claseRonda(r)]} · ${r.conQR ? `${r.qr.length}/${r.total || r.qr.length} puntos con QR` : r.aMano ? 'a mano, sin QR' : 'la anotó la garita'}${r.faltan.length ? ` · <em>sin leer: ${esc(r.faltan.join(', '))}</em>` : ''}</span></li>`).join('')}</ol>` : ''}
      <div class="ip-franjas">${d.franjas.map(f => `<div class="${f.hay ? 'hay' : ''}"><b>${ipHH(f.h)} h</b><span>${[f.rondas.length ? plural(f.rondas.length, 'ronda') : '', f.qr ? f.qr + ' QR' : '', f.notas.length ? plural(f.notas.length, 'nota', 'notas') : '', f.mov ? f.mov + ' mov.' : ''].filter(Boolean).join(' · ') || (f.hay ? 'tranquilo' : '—')}</span></div>`).join('')}</div>
      ${d.notas.length ? `<ul class="ip-notas">${d.notas.map(n => `<li><b>${hora(n.at)}</b> ${esc(n.texto)}</li>`).join('')}</ul>` : ''}</div>` : ''}
    <div class="ip-lbl">Franjas de 2 horas · QR del hub digital leídos</div>
    <div class="ip-calor"><span></span>${IP_FRANJAS.map(h => `<span class="ip-ch">${ipHH(h)}</span>`).join('')}
      ${sem.dias.map(z => `<span class="ip-cd" style="--c:${IP_COLORES[z.i][0]}">${DIAS[fechaDe(z.iso).getDay()]}</span>${z.franjas.map(f => `<span class="ip-c ${f.hay ? 'hay' : ''}" style="--a:${f.qr ? (.25 + .75 * f.qr / maxQR).toFixed(2) : 0}" title="${ipFranjaTxt(f.h)}: ${f.qr} QR">${f.qr || ''}</span>`).join('')}`).join('')}</div>
    ${sem.obs.length ? `<div class="ip-lbl">Para tener en cuenta</div><ul class="ip-obs">${sem.obs.map(([k, txt]) => `<li class="o-${k}">${I(k === 'ok' ? 'check' : k === 'info' ? 'info' : 'alert')}<span>${esc(txt)}</span></li>`).join('')}</ul>` : ''}
    <div class="ip-envio">${I('mail')}<div class="grow"><b>Para: ${esc(correoSupervisionPolicia())}</b><small>${enCurso ? 'Sale solo el sábado, al registrarse la salida del policía de la noche del viernes (o a las 12, si no vino nadie).' : 'Para ver si salió y la copia exacta: "Informes enviados".'}</small></div></div>
    <div class="btns"><button class="btn btn-pri grow" data-a="ip-pdf">${I('file')}Ver el PDF</button><button class="btn btn-sec grow" data-a="ip-enviados">${I('clock')}Informes enviados</button></div>
    ${enCurso ? '' : `<button class="btn btn-sec btn-block" style="margin-top:8px" data-a="ip-mandar">${I('mail')}Mandarlo ahora a la supervisión</button>`}
    ${esAdmin() ? `<form class="linea-form" data-f="ip-destino" style="margin-top:10px"><input name="email" type="email" inputmode="email" maxlength="80" value="${esc(correoSupervisionPolicia())}" aria-label="Correo de la supervisión de la policía"><button class="btn btn-sec">Cambiar el correo</button></form>` : ''}
    <p class="muted tiny" style="margin:10px 0 0">${I('lock')} Del policía lleva solo nombre, cargo y matrícula. Lo demás de la garita va solo como cantidad, sin datos de vecinos ni de visitas. El mismo correo recibe la constancia del policía que no deja el suyo.</p></div>`, { ancho:'760px' });
};
A['ip-semana'] = el => { IPV.sab = el.dataset.v; IPV.dia = -1; A['ip-abrir'](); };
A['ip-dia'] = el => { const i = +el.dataset.v; IPV.dia = IPV.dia === i ? -1 : i; A['ip-abrir'](); };
A['ip-mandar'] = async () => {
  if (!esStaff()) return;
  if (!await confirmar('Mandar el informe', `Sale por correo a <b>${esc(correoSupervisionPolicia())}</b> el informe de las noches ${esc(ipRango(IPV.sab))}, con el PDF adjunto. La Administración recibe el aviso y la copia queda en "Informes enviados".`, { si:'Mandarlo' })) return A['ip-abrir']();
  toast('Armando el informe…', 'file');
  await InformePolicia.mandar(IPV.sab, { avisar:true });
  A['ip-abrir']();
};
const ipVerPdf = (html, volver) => constanciaImgs().then(im => {
  hoja('Informe semanal de la policía', `<iframe class="mv-parte-frame" title="Informe semanal de la policía" sandbox="allow-same-origin allow-modals"></iframe>
    <button class="btn btn-pri btn-block" style="margin-top:10px" data-a="mv-parte-imprimir">${I('download')}Imprimir o guardar en PDF</button>
    <button class="btn btn-sec btn-block" style="margin-top:8px" data-a="${volver}">${I('left')}Volver</button>`, { ancho:'820px' });
  const f = $('#hoja .mv-parte-frame'); if (f){ encuadrarPdf(f); f.srcdoc = ipConFotos(html, im); }
});
A['ip-pdf'] = () => ipVerPdf(ipPdfDoc(ipPdfHtml(semanaInforme(IPV.sab), { portada:IP_PORTADA, logo:IP_LOGO })), 'ip-abrir');
/* La copia de lo enviado: se baja recién acá, y solo en este equipo. */
A['ip-enviados'] = async () => {
  if (!esStaff()) return;
  hoja('Informes enviados', `<p class="muted small">${I('clock')} Trayendo la lista…</p>`);
  let ls = [];
  try { ls = (await IPCopia.lista()).filter(x => x && x.id).sort((a, b) => String(b.id).localeCompare(String(a.id))); }
  catch(e){ return hoja('Informes enviados', `<p class="muted small">${I('alert')} No se pudo traer la lista: ${esc(e.message)}</p><button class="btn btn-sec btn-block" data-a="ip-abrir">${I('left')}Volver</button>`); }
  const MOT = { salida:'solo, al salir el policía del viernes', mediodia:'solo, el sábado a las 12' };
  hoja('Informes enviados', `${ls.length ? `<ul class="ip-env">${ls.map(x => { const r = x.resumen || {};
      return `<li><button type="button" data-a="ip-copia" data-v="${esc(x.id)}"><span class="ic ic-${x.ok ? 'ok' : x.enviando ? 'warn' : 'danger'}">${I(x.ok ? 'check' : 'alert')}</span>
        <span class="grow"><b>Noches ${esc(ipRango(x.semana))}</b><small>${x.ok ? 'Enviado' : x.enviando ? 'Armándose' : 'No salió'} el ${fechaCorta(isoDe(new Date(x.at)))} ${hora(x.at)} h a ${esc(x.para || '')}${MOT[x.motivo] ? ' · ' + MOT[x.motivo] : ' · a mano'}${x.error ? ' · ' + esc(x.error) : ''}</small>
        <small>${r.noches != null ? `${r.noches}/7 noches · ${r.horas} h · ${plural(r.rondas || 0, 'ronda')} · ${r.pctHub || 0} % con QR` : ''}</small></span>${I('right')}</button></li>`; }).join('')}</ul>`
    : vacio('file', 'Todavía no salió ningún informe semanal.')}
    <p class="muted tiny">${I('lock')} La copia se trae solo a este equipo, cuando la pedís. Se muestran los últimos 26 sábados.</p>
    <button class="btn btn-sec btn-block" data-a="ip-abrir">${I('left')}Volver al informe</button>`);
};
A['ip-copia'] = async el => {
  try { const c = await IPCopia.copia(el.dataset.v); if (!c || !c.html) return toast('Esa copia no está en la base', 'alert'); ipVerPdf(c.html, 'ip-enviados'); }
  catch(e){ toast('No se pudo traer la copia: ' + e.message, 'alert'); }
};
F['ip-destino'] = d => {
  if (!esAdmin()) return;
  const email = String(d.email || '').trim().toLowerCase();
  if (!correoValido(email)) return toast('Revisá el correo de la supervisión', 'mail');
  Store.cambiar(s => { s.config.correoSupervisionPolicia = email; });
  toast('Correo de la supervisión guardado', 'check'); A['ip-abrir']();
};
