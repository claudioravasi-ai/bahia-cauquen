/* =========================================================
   EXPENSAS AUTOMÁTICAS · EL AÑO MES A MES
   -------------------------------------------------------
   Parte de la liquidación de agosto 2026 (la última de Octavo
   Piso, importada una sola vez desde datos-privados/) y, con
   eso, la app desarrolla SOLA cada mes hasta fin de año:

     · GASTOS: cada gasto de agosto se clasifica como fijo
       (todos los meses, actualizado por inflación), en cuotas
       (sigue hasta la última: "pago 33 de 36"), de invierno
       (la retro para la nieve, de mayo a septiembre) o
       eventual (una compra, un flete: no se repite). Cuando
       llega la factura real de un mes, reemplaza al estimado.
     · INGRESOS: lo que se cobra en término (el 95 % en agosto),
       lo que se recupera de deudas y los intereses.
     · DEVENGADO, PERCIBIDO Y POR PAGAR, y el saldo del banco.
     · DEUDA: los morosos con su interés (4,81 % mensual, el que
       aplicó Octavo Piso) o actualizada por inflación.
     · CADA LOTE: su cuota mes a mes según su coeficiente, más el
       Fondo de Infraestructura.

   Y lo AUTOMÁTICO: el día de cierre de cada mes (el 1º por
   defecto) la app arma la liquidación del mes anterior con lo
   que se cargó y completa lo que falta con estimados; le avisa a
   la Administración para que la revise y la emita (o la emite
   sola, si se activa). Se lleva en paralelo con Octavo Piso: por
   eso la emisión sola viene apagada.
   ========================================================= */

const MESES_LARGO = ['','enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
const MESES_CORTO = ['','Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
const periodoSiguiente = p => { const [a, m] = p.split('-').map(Number); return m === 12 ? `${a + 1}-01` : `${a}-${pad(m + 1)}`; };
const mesesEntre = (a, b) => { const [y1, m1] = a.split('-').map(Number), [y2, m2] = b.split('-').map(Number); return (y2 - y1) * 12 + (m2 - m1); };
const RECURRENCIAS = {
  fijo:     { n:'Todos los meses', d:'Se repite y se actualiza por inflación' },
  cuotas:   { n:'En cuotas', d:'Sigue igual hasta la última cuota' },
  invierno: { n:'Solo en invierno', d:'Meses de nieve (mayo a septiembre)' },
  eventual: { n:'Una sola vez', d:'No se repite' },
};
const cfgPlan = () => Object.assign({ base:'', inflacion:2, tasaCobro:94.7, recupero:0, interesesCobrados:0, metodoDeuda:'interes', interesPuro:1,
  invierno:[5, 6, 7, 8, 9], diaCierre:1, autoBorrador:true, autoEmitir:false, recurrencia:{}, bancoInicial:0, deudaInicial:0, tasaOctavo:0 },
  Store.s.config.plan || {});
/* Qué es "el mismo gasto" de un mes a otro: el proveedor (o su CUIT), el
   rubro y el detalle sin el período ("Suministro 23579 · período julio"). */
const claveGasto = g => [normTxt(g.cuit || g.proveedor), g.rubro, normTxt(String(g.detalle || '').replace(/\(estimado\)/i, '').replace(/·?\s*per[ií]odo.*$/i, '').replace(/\b(junio|julio|agosto|septiembre|octubre|noviembre|diciembre|enero|febrero|marzo|abril|mayo)\b.*$/i, '')).replace(/[\s,.;·#$/\[\]]+/g, ' ').trim().slice(0, 40)].join('|').replace(/[.#$/\[\]]/g, '-');   /* sirve de clave en Firebase: sin . # $ / [ ] */
function recurrenciaDe(g){
  const r = cfgPlan().recurrencia[claveGasto(g)] || g.recurrencia;
  if (r && RECURRENCIAS[r]) return r;
  if (+g.cuotaDe > 1) return 'cuotas';
  if (/nieve|retro/i.test((g.detalle || '') + g.proveedor)) return 'invierno';
  if (/compra|flete|certificaci|reparaci[oó]n puntual/i.test(g.detalle || '')) return 'eventual';
  return 'fijo';
}
/* Tasa mensual con la que crece una deuda impaga, según el método elegido. */
function tasaDeuda(){
  const p = cfgPlan(), i = cfgExp().interesMensual;
  return (p.metodoDeuda === 'ipc' ? p.inflacion : p.metodoDeuda === 'ipc+interes' ? p.inflacion + p.interesPuro : i) / 100;
}

/* ---------- el molde: el último mes con datos reales ---------- */
function plantillaPlan(){
  const emitidas = liquidacionesEmitidas().filter(l => gastosDe(l.periodo).length).map(l => l.periodo);
  const periodo = emitidas.slice(-1)[0] || cfgPlan().base;
  return periodo ? { periodo, gastos: gastosDe(periodo) } : null;
}
/* Los gastos que se esperan en un mes a partir del molde. */
function gastosEsperados(periodo, tpl){
  const inf = cfgPlan().inflacion / 100, k = mesesEntre(tpl.periodo, periodo), mes = +periodo.slice(5);
  return tpl.gastos.map(g => {
    const r = recurrenciaDe(g); let monto = 0, nota = '';
    if (r === 'fijo'){ monto = g.total * Math.pow(1 + inf, k); nota = k ? `actualizado ${((Math.pow(1 + inf, k) - 1) * 100).toFixed(1)} %` : ''; }
    else if (r === 'cuotas'){ const n = (+g.cuotaN || 1) + k; if (n <= +g.cuotaDe){ monto = g.total; nota = `cuota ${n} de ${g.cuotaDe}`; } }
    else if (r === 'invierno'){ if (cfgPlan().invierno.includes(mes)){ monto = g.total * Math.pow(1 + inf, k); nota = 'temporada de nieve'; } }
    return { ...g, id:'p-' + claveGasto(g), monto:Math.round(monto * 100) / 100, recurrencia:r, nota, proyectado:true };
  }).filter(x => x.monto > 0);
}
/* Un mes: lo emitido, lo cargado y lo que falta estimado. */
function mesPlan(periodo, tpl = plantillaPlan()){
  const l = liquidacionDe(periodo), fondo = cfgExp().fondoFijo * LOTES.length;
  if (l && l.estado === 'emitida'){
    const gs = gastosDe(periodo);
    return { periodo, estado:'emitida', importada:!!l.importada, items:gs.map(g => ({ ...g, monto:+g.total || 0 })), total:l.totalGastos, cuotas:l.totalCuotas || l.totalGastos + fondo,
      porRubro:l.porRubro || {}, estimados:gs.filter(g => g.estimado).length };
  }
  if (!tpl || periodo <= tpl.periodo) return { periodo, estado:'sin-datos', items:[], total:0, cuotas:0, porRubro:{}, estimados:0 };
  const cargados = gastosDe(periodo), claves = new Set(cargados.map(claveGasto));
  const faltan = gastosEsperados(periodo, tpl).filter(p => !claves.has(claveGasto(p)));
  const items = [...cargados.map(g => ({ ...g, monto:+g.total || 0 })), ...faltan];
  const total = items.reduce((a, x) => a + x.monto, 0), porRubro = {};
  items.forEach(x => { porRubro[x.rubro] = (porRubro[x.rubro] || 0) + x.monto; });
  return { periodo, estado: cargados.some(g => !g.estimado) ? 'en-carga' : 'proyectada', items, total, cuotas:total + fondo, porRubro,
    reales:cargados.filter(g => !g.estimado).length, estimados:cargados.filter(g => g.estimado).length + faltan.length };
}
/* El año entero, con la plata que entra, la que sale y la deuda. */
function anioPlan(anio = +hoyISO().slice(0, 4)){
  const p = cfgPlan(), tpl = plantillaPlan(), cobro = p.tasaCobro / 100, i = tasaDeuda();
  const meses = [];
  let banco = p.bancoInicial || 0, deuda = p.deudaInicial || 0, cuotasAnt = 0;
  for (let m = 1; m <= 12; m++){
    const periodo = `${anio}-${pad(m)}`, x = mesPlan(periodo, tpl);
    const esBase = periodo === p.base;
    if (esBase){
      /* El mes base: los números reales del resumen del banco. */
      const b = p.banco || {};
      Object.assign(x, { percibido:(b.cobrosTermino || 0) + (b.cobrosAdeudadas || 0) + (b.cobrosIntereses || 0) + (b.cobrosACuenta || 0), pagado:b.egresos || x.total,
        banco:p.bancoInicial, deuda:p.deudaInicial, real:true });
      banco = p.bancoInicial; deuda = p.deudaInicial; cuotasAnt = x.cuotas;
    } else if (p.base && periodo > p.base && x.estado !== 'sin-datos'){
      /* Lo cobrado en la app ese mes (si ya pasó), o lo esperado. */
      const cobradoApp = Store.s.pagos.filter(q => q.estado === 'confirmado' && String(q.fecha || '').slice(0, 7) === periodo).reduce((a, q) => a + (+q.monto || 0), 0);
      const pasado = periodo < periodoHoy();
      const esperado = cuotasAnt * cobro + (p.recupero || 0) + (p.interesesCobrados || 0);
      x.percibido = pasado && cobradoApp ? cobradoApp : esperado;
      x.pagado = x.total;
      banco = banco + x.percibido - x.pagado;
      deuda = Math.max(0, deuda * (1 + i) + cuotasAnt * (1 - cobro) - (p.recupero || 0));
      x.banco = banco; x.deuda = deuda; x.real = pasado && !!cobradoApp;
      cuotasAnt = x.cuotas;
    }
    x.porPagar = 0;
    meses.push(x);
  }
  /* Por pagar: lo que se devengó en un mes y se paga con la cobranza del
     siguiente (los servicios de julio se pagan en agosto). */
  meses.forEach((x, k) => { const sig = meses[k + 1]; x.porPagar = sig && sig.estado !== 'sin-datos' ? sig.total : 0; });
  return { anio, meses, tpl, cfg:p };
}
/* La cuota de cada lote en un mes. */
/* La cuota de cada lote en un mes: gasto × coeficiente + Fondo, y los
   centavos del número de lote (como en el cupón real). */
const cuotaLoteEn = (x, L) => x.estado === 'sin-datos' ? 0 : conCentavosDelLote((x.total || 0) * L.coef / 100 + cfgExp().fondoFijo, 'Lote ' + L.lote).total;

/* =========================================================
   GRÁFICOS (SVG, sin librerías)
   ========================================================= */
const CHART_COL = { real:'#14968c', emitida:'#0d6b66', 'en-carga':'#2b8a82', proyectada:'#8fc7c1', linea:'#b85f24', deuda:'#d33a3a', banco:'#2b6fb3' };
const corto = n => { const a = Math.abs(n); return a >= 1e6 ? (n / 1e6).toLocaleString('es-AR', { maximumFractionDigits:1 }) + ' M' : a >= 1e3 ? Math.round(n / 1e3) + ' mil' : Math.round(n) + ''; };
function graficoAnual(A, { alto = 230, todo = false } = {}){
  /* En pantallas angostas se muestran los meses desde el anterior a la base:
     doce barras en un teléfono quedan ilegibles. */
  const angosta = !todo && matchMedia('(max-width: 600px)').matches;
  const desde = angosta && A.cfg.base ? Math.max(0, +A.cfg.base.slice(5) - 2) : 0;
  const ms = A.meses.slice(desde), N = ms.length;
  const W = angosta ? 420 : 720, H = angosta ? 250 : alto, izq = 44, der = 8, arr = 16, abj = 28, max = Math.max(1, ...ms.map(x => Math.max(x.total || 0, x.percibido || 0))) * 1.1;
  const ancho = (W - izq - der) / N, y = v => arr + (H - arr - abj) * (1 - v / max);
  const ticks = [0, .25, .5, .75, 1].map(f => max * f);
  const barras = ms.map((x, k) => {
    const X = izq + k * ancho + ancho * .18, w = ancho * .64;
    if (x.estado === 'sin-datos') return `<rect x="${X.toFixed(1)}" y="${(H - abj - 3).toFixed(1)}" width="${w.toFixed(1)}" height="3" rx="1.5" fill="currentColor" opacity=".12"/>`;
    const h = (H - arr - abj) * (x.total / max), col = x.estado === 'proyectada' ? CHART_COL.proyectada : x.estado === 'en-carga' ? CHART_COL['en-carga'] : CHART_COL.emitida;
    return `<rect x="${X.toFixed(1)}" y="${y(x.total).toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" rx="4" fill="${col}" ${x.estado === 'proyectada' ? 'fill-opacity=".85" stroke="' + CHART_COL.emitida + '" stroke-dasharray="3 3"' : ''}><title>${nombrePeriodo(x.periodo)}: ${plata(x.total)} de gastos (${x.estado === 'proyectada' ? 'estimado' : x.estado === 'en-carga' ? 'en carga' : 'emitido'})</title></rect>
      <text x="${(X + w / 2).toFixed(1)}" y="${(y(x.total) - 4).toFixed(1)}" text-anchor="middle" font-size="9.5" font-weight="700" fill="currentColor" opacity=".75">${corto(x.total)}</text>`;
  }).join('');
  const pts = ms.map((x, k) => x.percibido != null ? [izq + k * ancho + ancho / 2, y(x.percibido), x] : null).filter(Boolean);
  const linea = pts.length > 1 ? `<polyline points="${pts.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ')}" fill="none" stroke="${CHART_COL.linea}" stroke-width="2.5" stroke-linejoin="round"/>` : '';
  const puntos = pts.map(p => `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="3.5" fill="${CHART_COL.linea}"><title>${nombrePeriodo(p[2].periodo)}: ${plata(p[2].percibido)} cobrados${p[2].real ? '' : ' (estimado)'}</title></circle>`).join('');
  return `<svg viewBox="0 0 ${W} ${H}" class="grafico" role="img" aria-label="Gastos y cobranza del año ${A.anio}, mes a mes">
    ${ticks.map(t => `<line x1="${izq}" x2="${W - der}" y1="${y(t).toFixed(1)}" y2="${y(t).toFixed(1)}" stroke="currentColor" stroke-opacity=".1"/><text x="${izq - 6}" y="${(y(t) + 3).toFixed(1)}" text-anchor="end" font-size="9.5" fill="currentColor" opacity=".6">${corto(t)}</text>`).join('')}
    ${barras}${linea}${puntos}
    ${ms.map((x, k) => `<text x="${(izq + k * ancho + ancho / 2).toFixed(1)}" y="${H - 9}" text-anchor="middle" font-size="10.5" font-weight="${x.periodo === periodoHoy() ? 800 : 600}" fill="currentColor" opacity="${x.estado === 'sin-datos' ? .35 : .8}">${MESES_CORTO[+x.periodo.slice(5)]}</text>`).join('')}</svg>`;
}
const leyendaAnual = () => `<div class="graf-leyenda"><span><i style="background:${CHART_COL.emitida}"></i>Gastos emitidos</span><span><i style="background:${CHART_COL.proyectada};outline:1px dashed ${CHART_COL.emitida}"></i>Gastos estimados</span><span><i class="linea" style="background:${CHART_COL.linea}"></i>Cobranza</span><span><i style="background:currentColor;opacity:.15"></i>Sin datos (antes de la app)</span></div>`;
function graficoLineas(ms, series, { alto = 170 } = {}){
  const angosta = matchMedia('(max-width: 600px)').matches;
  if (angosta){ const i0 = ms.findIndex(x => series.some(s => x[s.k] != null)); if (i0 > 0) ms = ms.slice(Math.max(0, i0 - 1)); }
  const N = ms.length || 12, W = angosta ? 420 : 720, H = angosta ? 210 : alto, izq = 44, der = 8, arr = 14, abj = 26;
  const vals = ms.flatMap(x => series.map(s => x[s.k])).filter(v => v != null);
  if (!vals.length) return '';
  const max = Math.max(1, ...vals) * 1.1, ancho = (W - izq - der) / N, y = v => arr + (H - arr - abj) * (1 - v / max);
  return `<svg viewBox="0 0 ${W} ${H}" class="grafico" role="img" aria-label="${series.map(s => s.n).join(' y ')}">
    ${[0, .5, 1].map(f => `<line x1="${izq}" x2="${W - der}" y1="${y(max * f).toFixed(1)}" y2="${y(max * f).toFixed(1)}" stroke="currentColor" stroke-opacity=".1"/><text x="${izq - 6}" y="${(y(max * f) + 3).toFixed(1)}" text-anchor="end" font-size="9.5" fill="currentColor" opacity=".6">${corto(max * f)}</text>`).join('')}
    ${series.map(s => { const pts = ms.map((x, k) => x[s.k] != null ? [izq + k * ancho + ancho / 2, y(x[s.k]), x] : null).filter(Boolean);
      return `<polyline points="${pts.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ')}" fill="none" stroke="${s.c}" stroke-width="2.5" stroke-linejoin="round"/>${pts.map(p => `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="3.5" fill="${s.c}"><title>${s.n} · ${nombrePeriodo(p[2].periodo)}: ${plata(p[2][s.k])}</title></circle><text x="${p[0].toFixed(1)}" y="${(p[1] - 7).toFixed(1)}" text-anchor="middle" font-size="9.5" font-weight="700" fill="${s.c}">${corto(p[2][s.k])}</text>`).join('')}`; }).join('')}
    ${ms.map((x, k) => `<text x="${(izq + k * ancho + ancho / 2).toFixed(1)}" y="${H - 8}" text-anchor="middle" font-size="10.5" fill="currentColor" opacity=".7">${MESES_CORTO[+x.periodo.slice(5)]}</text>`).join('')}</svg>
    <div class="graf-leyenda">${series.map(s => `<span><i class="linea" style="background:${s.c}"></i>${s.n}</span>`).join('')}</div>`;
}
/* Barras horizontales: rubros de un mes o morosos. */
function barrasH(filas, { color = CHART_COL.emitida, max } = {}){
  const tope = max || Math.max(1, ...filas.map(f => f.v));
  return `<div class="barras-h">${filas.map(f => `<div class="bh-fila"><span class="bh-et">${f.t}</span>
    <span class="bh-pista"><i style="width:${Math.max(1.5, f.v / tope * 100).toFixed(1)}%;background:${f.c || color}"></i>${f.v2 ? `<i class="bh-extra" style="width:${(f.v2 / tope * 100).toFixed(1)}%"></i>` : ''}</span>
    <span class="bh-v">${f.etiqueta || plataCorta(f.v)}</span></div>`).join('')}</div>`;
}

/* =========================================================
   LA VENTANA (pestaña "Automáticas" de Expensas y cobranzas)
   ========================================================= */
const TABS_PLAN = [['anio','El año'],['mes','Mes a mes'],['lotes','Por lote'],['deuda','Deuda y morosos'],['ajustes','Cómo se calcula']];
function vistaPlan(sub){
  const [tab, arg] = String(sub || 'anio').split('~');
  const p = cfgPlan();
  const nav = `<div class="chips">${TABS_PLAN.map(([k, t]) => `<button class="chip ${k === tab ? 'on' : ''}" data-a="abrir" data-v="cobranzas" data-p="plan|${k}">${t}</button>`).join('')}</div>`;
  if (!p.base) return `${aviso('info', 'zap', 'Falta un paso de una sola vez: traer la liquidación de agosto',
      'Es el punto de partida: los gastos de agosto (con su proveedor, CUIT y si son fijos, en cuotas o eventuales), el banco, el patrimonio y el estado de cuenta de los 152 lotes. Con eso la app desarrolla sola septiembre, octubre, noviembre y diciembre, y cada lote arranca con su saldo real.')}
    <label class="superficie acento"><span class="ic">${I('upload')}</span><span class="txt"><b>Traer la liquidación de agosto</b>
      <small>Elegí el archivo <span class="mono">datos-privados/liquidacion-agosto-2026.json</span> (queda solo en la base del barrio, no en GitHub)</small></span>
      <input type="file" accept=".json,application/json" id="importarBase" hidden></label>`;
  return nav + (PLAN_VISTAS[tab] || PLAN_VISTAS.anio)(arg);
}
const PLAN_VISTAS = {
  anio(){
    const A = anioPlan(), p = A.cfg, hoyP = periodoHoy();
    const futuros = A.meses.filter(x => x.periodo > p.base && x.estado !== 'sin-datos');
    const totAnio = A.meses.reduce((a, x) => a + (x.total || 0), 0), dic = A.meses[11];
    const prox = A.meses.find(x => x.periodo >= hoyP && x.estado !== 'emitida' && x.estado !== 'sin-datos') || futuros[0];
    return `<div class="admin-hero" style="background:var(--g-brand)">
        <b style="font-size:18px">Expensas ${A.anio}, desarrolladas mes a mes</b>
        <div class="small" style="opacity:.85">Base: ${nombrePeriodo(p.base)} (real) · ${plural(futuros.length, 'mes estimado', 'meses estimados')} hasta diciembre · inflación ${p.inflacion.toLocaleString('es-AR')} % mensual</div>
        <div class="garita-kpis"><div class="kpi"><b>${plataCorta(totAnio)}</b><span>Gastos del año (con datos)</span></div>
          <div class="kpi"><b>${plataCorta(dic.banco ?? 0)}</b><span>Banco a diciembre</span></div>
          <div class="kpi"><b>${plataCorta(dic.deuda ?? 0)}</b><span>Deuda a diciembre</span></div></div></div>
      ${prox ? `<div class="card"><div class="row" style="align-items:flex-start"><span class="ic ic-wood" style="width:42px;height:42px;border-radius:13px;display:grid;place-items:center;flex:none">${I('zap')}</span>
        <div class="grow"><b>Próximo cierre: ${nombrePeriodo(prox.periodo)}</b><div class="muted small">${prox.reales ? plural(prox.reales, 'gasto real cargado', 'gastos reales cargados') + ' · ' : ''}${plural(prox.estimados, 'estimado')} · total ${plata(prox.total)} · cuota promedio ${plata(prox.cuotas / LOTES.length)}</div>
        <div class="muted small">${p.autoBorrador ? `El ${p.diaCierre} de ${MESES_LARGO[+periodoSiguiente(prox.periodo).slice(5)]} la app lo arma sola y te avisa${p.autoEmitir ? ', y lo emite' : ' para que lo emitas'}.` : 'El cierre automático está apagado.'}</div></div></div>
        <div class="btns" style="margin-top:10px"><button class="btn btn-sm btn-sec" data-a="abrir" data-v="cobranzas" data-p="plan|mes~${prox.periodo}">${I('eye')}Ver el detalle</button>
          <button class="btn btn-sm btn-sec" data-a="abrir" data-v="contabilidad" data-p="gastos|${prox.periodo}">${I('plus')}Cargar facturas reales</button></div></div>` : ''}
      ${sec('Gastos y cobranza, mes a mes')}
      <div class="card grafico-card">${graficoAnual(A)}${leyendaAnual()}</div>
      ${sec('El año en números', `<button class="link" data-a="plan-pdf">${I('download')}PDF</button>`)}
      <div class="card tabla-scroll"><table class="tabla-plan"><thead><tr><th>Mes</th><th class="n">Gastos (devengado)</th><th class="n">A cobrar (cupones)</th><th class="n">Cobrado (percibido)</th><th class="n">Por pagar</th><th class="n">Banco</th><th class="n">Deuda vecinos</th></tr></thead>
        <tbody>${(() => { const sd = A.meses.filter(x => x.estado === 'sin-datos' && x.periodo < (p.base || '9999'));
            return sd.length ? `<tr class="apagada"><td>${MESES_CORTO[+sd[0].periodo.slice(5)]}${sd.length > 1 ? ' a ' + MESES_CORTO[+sd.at(-1).periodo.slice(5)] : ''}</td><td colspan="6" class="muted">Sin datos: antes de empezar con la app</td></tr>` : ''; })()}
          ${A.meses.filter(x => !(x.estado === 'sin-datos' && x.periodo < (p.base || '9999'))).map(x => x.estado === 'sin-datos' ? `<tr class="apagada"><td>${MESES_CORTO[+x.periodo.slice(5)]}</td><td colspan="6" class="muted">Sin datos</td></tr>`
          : `<tr class="${x.estado}"><td><b>${MESES_CORTO[+x.periodo.slice(5)]}</b> <span class="pill p-${x.estado === 'emitida' ? 'ok' : x.estado === 'en-carga' ? 'sky' : ''}">${x.estado === 'emitida' ? (x.importada ? 'real' : 'emitida') : x.estado === 'en-carga' ? 'en carga' : 'estimada'}</span></td>
            <td class="n">${plata(x.total)}</td><td class="n">${plata(x.cuotas)}</td><td class="n">${x.percibido != null ? plata(x.percibido) : '—'}</td><td class="n">${plata(x.porPagar)}</td>
            <td class="n">${x.banco != null ? plata(x.banco) : '—'}</td><td class="n">${x.deuda != null ? plata(x.deuda) : '—'}</td></tr>`).join('')}</tbody></table></div>
      ${sec('Banco y deuda de los vecinos')}
      <div class="card grafico-card">${graficoLineas(A.meses.filter(x => x.banco != null).length ? A.meses : [], [{ k:'banco', n:'Saldo del banco', c:CHART_COL.banco }, { k:'deuda', n:'Deuda de vecinos (con intereses)', c:CHART_COL.deuda }])}</div>
      <p class="muted tiny">Devengado: lo que se gastó en el mes. Percibido: lo que entró al banco. Por pagar: lo del mes siguiente, que se paga con esa cobranza. Los meses estimados se recalculan solos cada vez que cargás una factura real o cambiás un parámetro.</p>`;
  },
  mes(per){
    const A = anioPlan(), meses = A.meses.filter(x => x.estado !== 'sin-datos');
    const x = meses.find(m => m.periodo === per) || meses.find(m => m.periodo >= periodoHoy() && m.estado !== 'emitida') || meses.slice(-1)[0];
    if (!x) return vacio('calendar', 'Sin meses para mostrar.');
    const porRubro = Object.entries(x.porRubro).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
    const items = x.items.slice().sort((a, b) => (a.rubro - b.rubro) || (b.monto - a.monto));
    return `<div class="chips">${meses.map(m => `<button class="chip ${m.periodo === x.periodo ? 'on' : ''}" data-a="abrir" data-v="cobranzas" data-p="plan|mes~${m.periodo}">${MESES_CORTO[+m.periodo.slice(5)]}</button>`).join('')}</div>
      <div class="card"><div class="row" style="justify-content:space-between;align-items:flex-start"><div><b style="font-size:16px">${nombrePeriodo(x.periodo)}</b>
        <div class="muted small">${x.estado === 'emitida' ? 'Liquidación emitida' : x.estado === 'en-carga' ? `${plural(x.reales, 'factura real', 'facturas reales')} y ${plural(x.estimados, 'estimado')}` : 'Todo estimado a partir del mes base'}</div></div>
        <div style="text-align:right"><b class="num" style="font-size:19px">${plata(x.total)}</b><div class="muted small">+ Fondo ${plata(cfgExp().fondoFijo * LOTES.length)}</div></div></div>
        <div class="garita-kpis" style="margin-top:10px"><div class="kpi"><b>${plata(x.cuotas / LOTES.length)}</b><span>Cuota promedio</span></div>
          <div class="kpi"><b>${plata(cuotaLoteEn(x, LOTES.find(L => 'Lote ' + L.lote === miLote()) || LOTES[0]))}</b><span>${tengoLote() ? 'Tu lote' : 'Lote 0'}</span></div>
          <div class="kpi"><b>${plataCorta(x.percibido || 0)}</b><span>Cobranza ${x.real ? 'real' : 'esperada'}</span></div></div></div>
      ${sec('Por rubro')}
      <div class="card">${barrasH(porRubro.map(([r, v]) => ({ t:`${r} · ${RUBROS[r] || 'Otros'}`, v, etiqueta:`${plataCorta(v)} · ${(v / (x.total || 1) * 100).toFixed(1)} %` })))}</div>
      ${sec('Gasto por gasto', x.estado !== 'emitida' ? `<button class="link" data-a="abrir" data-v="contabilidad" data-p="gastos|${x.periodo}">Cargar una factura real</button>` : '')}
      <div class="card lista">${items.map(g => `<div class="it"><div class="txt"><b>${esc(g.proveedor)}</b><span>${esc(String(g.detalle || '').replace(/\s*\(estimado\)/i, ''))}${g.nota ? ' · ' + esc(g.nota) : ''}</span></div>
        <span class="pill ${g.proyectado || g.estimado ? '' : 'p-ok'}">${g.proyectado || g.estimado ? 'estimado' : 'real'}</span><b class="num">${plata(g.monto)}</b></div>`).join('') || '<p class="muted small">Sin gastos.</p>'}</div>
      ${x.estado !== 'emitida' ? `<div class="btns" style="margin-top:12px"><button class="btn btn-sec" data-a="plan-completar" data-v="${x.periodo}">${I('zap')}Pasar los estimados a Gastos del mes</button>
        <button class="btn btn-pri" data-a="abrir" data-v="contabilidad" data-p="cierre|${x.periodo}">${I('check')}Ir al cierre</button></div>
        <p class="muted tiny">Los estimados quedan marcados como tales en Gastos del mes; cuando cargás la factura real del mismo proveedor, el estimado se borra solo.</p>` : ''}`;
  },
  lotes(q){
    const A = anioPlan(), futuros = A.meses.filter(x => x.periodo > A.cfg.base && x.estado !== 'sin-datos');
    const qq = normTxt(q || ''), i = tasaDeuda();
    const filas = LOTES.map(L => {
      const lote = 'Lote ' + L.lote, saldo = saldoLote(lote), cuotas = futuros.map(x => cuotaLoteEn(x, L)), suma = cuotas.reduce((a, b) => a + b, 0);
      const ultima = liquidacionesEmitidas().slice(-1)[0], cuotaHoy = ultima ? (cuotaDe(ultima, lote)?.total || 0) : 0;
      const moroso = saldo > cuotaHoy * 1.05 + 1;
      /* Si no paga nada hasta diciembre: la deuda vieja crece con interés y se suman las cuotas. */
      let proy = saldo; futuros.forEach((x, k) => { proy = proy * (1 + (moroso ? i : 0)) + cuotas[k]; });
      return { L, lote, prop:propietarioDe(lote), saldo, cuotas, suma, moroso, proy };
    }).filter(f => !qq || normTxt(`${f.lote} ${f.L.uf} ${f.prop}`).includes(qq));
    return `<form data-f="plan-buscar-lote" class="linea-form" style="margin-bottom:10px"><input name="q" id="qPlanLote" value="${esc(q || '')}" placeholder="Lote, UF o apellido"><button class="btn btn-pri">${I('search')}</button></form>
      <p class="muted small" style="margin:0 0 8px">La cuota de cada mes es el gasto del mes por el coeficiente del lote, más el Fondo de Infraestructura. "Si no paga" suma las cuotas y el interés sobre la deuda vieja.</p>
      <div class="card tabla-scroll"><table class="tabla-plan tabla-lotes"><thead><tr><th>Lote</th><th class="n">Coef.</th><th class="n">Saldo hoy</th>${futuros.map(x => `<th class="n">${MESES_CORTO[+x.periodo.slice(5)]}</th>`).join('')}<th class="n">Total</th><th class="n">Si no paga, a dic.</th></tr></thead>
        <tbody>${filas.map(f => `<tr class="${f.moroso ? 'moroso' : ''}"><td><button class="link" data-a="ver-cuenta" data-v="${esc(f.lote)}">${esc(f.lote)}</button>${f.prop ? `<div class="tiny muted">${esc(f.prop.slice(0, 32))}</div>` : ''}</td>
          <td class="n">${f.L.coef.toFixed(3)}</td><td class="n">${plata(f.saldo)}</td>${f.cuotas.map(c => `<td class="n">${plata(c)}</td>`).join('')}<td class="n"><b>${plata(f.suma)}</b></td><td class="n ${f.moroso ? 'rojo' : ''}">${plata(f.proy)}</td></tr>`).join('')}</tbody></table></div>
      <div class="btns" style="margin-top:10px"><button class="btn btn-sec" data-a="plan-pdf">${I('download')}Todo en PDF</button><button class="btn btn-sec" data-a="plan-csv">${I('download')}Planilla (CSV)</button></div>`;
  },
  deuda(){
    const A = anioPlan(), i = tasaDeuda(), p = A.cfg, ultima = liquidacionesEmitidas().slice(-1)[0];
    const filas = LOTES.map(L => { const lote = 'Lote ' + L.lote, saldo = saldoLote(lote), cu = ultima ? cuotaDe(ultima, lote) : null, cuota = cu ? cu.total : 0;
      return { lote, prop:propietarioDe(lote), saldo, vencida:Math.max(0, saldo - cuota), interes:cu?.interes || 0, judicial:!!cu?.judicial }; })
      .filter(f => f.vencida > 1).sort((a, b) => b.vencida - a.vencida);
    const total = filas.reduce((a, f) => a + f.vencida, 0), sinJud = filas.filter(f => !f.judicial);
    const futuros = A.meses.filter(x => x.periodo > p.base && x.estado !== 'sin-datos');
    return `<div class="garita-kpis"><div class="kpi"><b>${filas.length}</b><span>Lotes con deuda vencida</span></div><div class="kpi"><b>${plataCorta(total)}</b><span>Deuda vencida hoy</span></div>
        <div class="kpi"><b>${(i * 100).toLocaleString('es-AR', { maximumFractionDigits:2 })} %</b><span>Actualización mensual</span></div></div>
      ${aviso('info', 'info', 'Cómo se actualiza la deuda', `${p.metodoDeuda === 'ipc' ? `Por inflación estimada (${p.inflacion} % mensual), sin interés punitorio.` : p.metodoDeuda === 'ipc+interes' ? `Por inflación (${p.inflacion} %) más ${p.interesPuro} % de interés puro por mes.` : `Con el interés por mora de Parámetros (${cfgExp().interesMensual} % mensual).`}${p.tasaOctavo ? ` En agosto, Octavo Piso aplicó ${p.tasaOctavo.toLocaleString('es-AR')} % mensual sobre los saldos de un mes.` : ''} Se cambia en "Cómo se calcula".`)}
      ${sec('Los que más deben')}
      <div class="card">${barrasH(filas.slice(0, 12).map(f => ({ t:`${f.lote}${f.judicial ? ' ⚖' : ''}`, v:f.vencida, c: f.judicial ? '#7445c0' : CHART_COL.deuda, etiqueta:plataCorta(f.vencida) })))}
        <p class="muted tiny" style="margin:8px 0 0">⚖ en gestión judicial (abogados). El resto de las barras, deuda vencida con intereses.</p></div>
      ${sec('Cómo sigue la deuda si nadie paga lo atrasado')}
      <div class="card tabla-scroll"><table class="tabla-plan"><thead><tr><th>Lote</th><th class="n">Hoy</th>${futuros.map(x => `<th class="n">${MESES_CORTO[+x.periodo.slice(5)]}</th>`).join('')}</tr></thead>
        <tbody>${sinJud.slice(0, 40).map(f => { let d = f.vencida; return `<tr><td><button class="link" data-a="ver-cuenta" data-v="${esc(f.lote)}">${esc(f.lote)}</button>${f.prop ? `<div class="tiny muted">${esc(f.prop.slice(0, 28))}</div>` : ''}</td><td class="n">${plata(f.vencida)}</td>${futuros.map(() => { d = d * (1 + i); return `<td class="n">${plata(d)}</td>`; }).join('')}</tr>`; }).join('') || `<tr><td colspan="9">${vacio('check', 'Nadie debe nada vencido.')}</td></tr>`}</tbody></table></div>
      ${sec('Deuda total estimada del barrio')}
      <div class="card grafico-card">${graficoLineas(A.meses, [{ k:'deuda', n:'Deuda de vecinos', c:CHART_COL.deuda }])}</div>
      ${superficie({ a:'abrir', v:'cobranzas', p:'morosos', icon:'send', color:'danger', t:'Reclamar y emitir certificados', s:'En la pestaña Morosos (certificado de deuda, art. 2048 CCyC)' })}`;
  },
  ajustes(){
    const p = cfgPlan(), tpl = plantillaPlan();
    return `<form data-f="plan-ajustes">
      <div class="card"><h3>Supuestos</h3><div class="grid3">
        <div class="field"><label>Inflación mensual (%)</label><input name="inflacion" type="number" step="0.1" value="${p.inflacion}"><div class="ayuda">Actualiza los gastos fijos mes a mes.</div></div>
        <div class="field"><label>Cobro en término (%)</label><input name="tasaCobro" type="number" step="0.1" value="${p.tasaCobro}"><div class="ayuda">En agosto: ${(p.tasaCobroBase || 94.7).toLocaleString('es-AR')} %.</div></div>
        <div class="field"><label>Recupero de deuda por mes ($)</label><input name="recupero" type="number" step="1000" value="${Math.round(p.recupero || 0)}"><div class="ayuda">En agosto se cobraron ${plata(p.banco?.cobrosAdeudadas || 0)} de deudas.</div></div></div></div>
      <div class="card"><h3>Actualización de lo adeudado</h3>
        <div class="seg" style="flex-wrap:wrap">${[['interes','Interés por mora (Parámetros)'],['ipc','Inflación'],['ipc+interes','Inflación + interés puro']].map(([k, t]) => `<label><input type="radio" name="metodoDeuda" value="${k}" ${p.metodoDeuda === k ? 'checked' : ''}><span>${t}</span></label>`).join('')}</div>
        <div class="grid2" style="margin-top:10px"><div class="field"><label>Interés puro mensual (%)</label><input name="interesPuro" type="number" step="0.1" value="${p.interesPuro}"></div>
          <div class="field"><label>Interés por mora hoy (Parámetros)</label><input disabled value="${cfgExp().interesMensual} %"></div></div>
        ${p.tasaOctavo ? `<div class="card plana small" style="margin:0">${I('info')} Octavo Piso aplicó en agosto <b>${p.tasaOctavo.toLocaleString('es-AR')} % mensual</b> a los lotes con un mes de atraso.
          <div class="btns" style="margin-top:8px"><button type="button" class="btn btn-xs btn-sec" data-a="plan-usar-tasa">Usar ${p.tasaOctavo.toLocaleString('es-AR')} % como interés por mora</button></div></div>` : ''}</div>
      <div class="card"><h3>Cierre automático de cada mes</h3>
        <div class="grid2"><div class="field"><label>Día de cierre</label><input name="diaCierre" type="number" min="1" max="28" value="${p.diaCierre}"><div class="ayuda">Ese día se arma la liquidación del mes anterior.</div></div>
          <div class="field"><label>Meses de nieve</label><input name="invierno" value="${esc(p.invierno.join(', '))}"><div class="ayuda">Números de mes (5 = mayo).</div></div></div>
        <label class="check"><input type="checkbox" name="autoBorrador" ${p.autoBorrador ? 'checked' : ''}><span>Completar con estimados lo que falte cargar y avisarme para revisar</span></label>
        <label class="check"><input type="checkbox" name="autoEmitir" ${p.autoEmitir ? 'checked' : ''}><span>Emitir sola la liquidación y mandar los cupones (dejalo apagado mientras se lleve en paralelo con Octavo Piso)</span></label></div>
      ${tpl ? `<div class="card"><h3>Cómo se repite cada gasto <span class="muted small">(de ${nombrePeriodo(tpl.periodo)})</span></h3>
        <div class="lista">${tpl.gastos.slice().sort((a, b) => (a.rubro - b.rubro) || (b.total - a.total)).map(g => { const k = claveGasto(g), r = recurrenciaDe(g);
          return `<div class="it"><div class="txt"><b>${esc(g.proveedor)} · ${plataCorta(g.total)}</b><span>${esc(String(g.detalle || '').replace(/\s*\(estimado\)/i, ''))}${+g.cuotaDe > 1 ? ` · cuota ${g.cuotaN} de ${g.cuotaDe}` : ''}</span></div>
            <select name="rec~${esc(k)}" style="max-width:170px">${Object.entries(RECURRENCIAS).map(([kk, t]) => `<option value="${kk}" ${r === kk ? 'selected' : ''}>${t.n}</option>`).join('')}</select></div>`; }).join('')}</div></div>` : ''}
      <button class="btn btn-pri btn-block">${I('check')}Guardar y recalcular</button></form>
      ${sec('Punto de partida')}
      <div class="card small">Base: <b>${nombrePeriodo(p.base)}</b>${p.importadoAt ? ` · traída ${hace(p.importadoAt)}` : ''} · banco al cierre ${plata(p.bancoInicial)} · deudas e intereses a cobrar ${plata(p.deudaInicial)}.</div>
      <label class="superficie"><span class="ic ic-sky">${I('upload')}</span><span class="txt"><b>Volver a traer la liquidación base</b><small>Reemplaza la importada (no toca pagos ni meses emitidos después)</small></span>
        <input type="file" accept=".json,application/json" id="importarBase" hidden></label>`;
  },
};
F['plan-buscar-lote'] = d => abrir('cobranzas', 'plan|lotes~' + (d.q || ''));
F['plan-ajustes'] = d => {
  Store.cambiar(s => {
    const p = Object.assign({}, cfgPlan());
    ['inflacion','tasaCobro','recupero','interesPuro'].forEach(k => { if (d[k] !== '' && d[k] != null) p[k] = +d[k]; });
    p.diaCierre = Math.min(28, Math.max(1, +d.diaCierre || 1));
    p.metodoDeuda = d.metodoDeuda || 'interes';
    p.invierno = String(d.invierno || '').split(/[,\s]+/).map(Number).filter(m => m >= 1 && m <= 12);
    p.autoBorrador = !!d.autoBorrador; p.autoEmitir = !!d.autoEmitir;
    p.recurrencia = Object.assign({}, p.recurrencia);
    Object.keys(d).filter(k => k.startsWith('rec~')).forEach(k => { p.recurrencia[k.slice(4)] = d[k]; });
    s.config.plan = p;
    auditar(s, 'Cambió los supuestos de las expensas automáticas', `inflación ${p.inflacion} % · cobro ${p.tasaCobro} %${p.autoEmitir ? ' · emisión automática' : ''}`);
  });
  toast('Guardado: el año se recalculó', 'check');
};
A['plan-usar-tasa'] = () => { const t = cfgPlan().tasaOctavo; Store.cambiar(s => { s.config.exp = Object.assign({}, s.config.exp || {}, { interesMensual:t }); auditar(s, 'Tomó la tasa de interés de Octavo Piso', t + ' %'); }); toast(`Interés por mora: ${t} % mensual`, 'check'); refrescar(); };

/* ---------- pasar los estimados a "Gastos del mes" ---------- */
function completarConEstimados(s, periodo){
  const x = mesPlan(periodo); let n = 0;
  x.items.filter(g => g.proyectado).forEach(g => {
    s.gastos.unshift({ id:uid(), periodo, fecha:periodo + '-28', proveedor:g.proveedor, cuit:g.cuit || '', rubro:+g.rubro, tipoComp:'Estimado', nroComp:'',
      neto:0, iva:0, total:g.monto, columna:g.columna || 'expensas', retGan:0, retSuss:0, cuotaN: g.recurrencia === 'cuotas' ? (+g.cuotaN || 1) + mesesEntre(plantillaPlan().periodo, periodo) : 0,
      cuotaDe: g.recurrencia === 'cuotas' ? +g.cuotaDe : 0, lote:'', detalle:`${String(g.detalle || '').replace(/\s*\(estimado\)/i, '')} (estimado)`, estimado:true, recurrencia:g.recurrencia, por:'sistema', at:Date.now() });
    n++;
  });
  return n;
}
A['plan-completar'] = async el => {
  const periodo = el.dataset.v;
  if (!await confirmar('Pasar los estimados', `Los gastos que todavía no tienen factura en ${nombrePeriodo(periodo)} se cargan como <b>estimados</b> en Gastos del mes. Cuando llegue la factura real, el estimado se borra solo.`, { si:'Cargar estimados' })) return;
  let n = 0; Store.cambiar(s => { n = completarConEstimados(s, periodo); auditar(s, 'Cargó gastos estimados', `${nombrePeriodo(periodo)} · ${n}`); });
  toast(`${plural(n, 'gasto estimado cargado', 'gastos estimados cargados')}`, 'zap');
};
/* Cuando se carga la factura real, se va el estimado del mismo gasto. */
const guardarGastoOriginal = F['gasto'];
F['gasto'] = (d, form) => {
  guardarGastoOriginal(d, form);
  const g = form.dataset.id ? Store.s.gastos.find(x => x.id === form.dataset.id) : Store.s.gastos[0];
  if (!g || g.estimado) return;
  const k = claveGasto(g), sobra = Store.s.gastos.filter(x => x.estimado && x.periodo === g.periodo && x.id !== g.id && claveGasto(x) === k);
  if (sobra.length){ Store.cambiar(s => { s.gastos = s.gastos.filter(x => !sobra.some(e => e.id === x.id)); }); toast('Se reemplazó el gasto estimado por la factura real', 'check'); }
};

/* ---------- traer la liquidación base (una sola vez) ---------- */
document.addEventListener('change', async e => {
  if (e.target.id !== 'importarBase' || !e.target.files[0]) return;
  const f = e.target.files[0]; e.target.value = '';
  try {
    const b = JSON.parse(await f.text());
    if (b.tipo !== 'liquidacion-base' || !Array.isArray(b.gastos) || !Array.isArray(b.lotes)) throw new Error('No es el archivo de la liquidación base');
    const yaEmitida = liquidacionDe(b.periodo);
    if (yaEmitida && !yaEmitida.importada && yaEmitida.estado === 'emitida') throw new Error(`${nombrePeriodo(b.periodo)} ya se emitió desde la app: no se pisa`);
    const tot = b.lotes.reduce((a, l) => a + l.total, 0);
    if (!await confirmar('Traer la liquidación base', `${nombrePeriodo(b.periodo)}: ${plural(b.gastos.length, 'gasto')} por ${plata(b.totalGastos)} y el estado de ${plural(b.lotes.length, 'lote')} (saldo total ${plata(tot)}). Cada lote queda con su saldo real de ${b.fuente || 'la liquidación'}.`, { si:'Traer' })) return;
    const emit = new Date(+b.periodo.slice(0, 4), +b.periodo.slice(5), 1, 9).getTime();
    /* La tasa de interés que se aplicó a quien debía un solo mes. */
    const unMes = b.lotes.filter(l => l.deuda > 0 && l.interes > 0 && l.deuda <= 1.3 * (l.expensas + l.fondo));
    const tasaOctavo = unMes.length ? Math.round(unMes.map(l => l.interes / l.deuda * 100).sort((a, c) => a - c)[Math.floor(unMes.length / 2)] * 100) / 100 : 0;
    const mesDeuda = b.lotes.filter(l => l.deuda > 0 && l.deuda <= 1.3 * (l.expensas + l.fondo)).reduce((a, l) => a + l.deuda, 0);
    const emitido = b.lotes.reduce((a, l) => a + l.expensas + l.fondo, 0);
    const tasaCobro = Math.round((1 - mesDeuda / emitido) * 1000) / 10;
    Store.cambiar(s => {
      s.gastos = s.gastos.filter(g => !(g.periodo === b.periodo && g.importado));
      b.gastos.forEach(g => s.gastos.push({ id:uid(), periodo:b.periodo, fecha:b.periodo + '-28', proveedor:g.proveedor, cuit:g.cuit || '', rubro:+g.rubro, tipoComp:g.tipoComp || 'Otros', nroComp:g.nroComp || '',
        neto:0, iva:0, total:+g.total, columna:g.columna || 'expensas', retGan:0, retSuss:0, cuotaN:+g.cuotaN || 0, cuotaDe:+g.cuotaDe || 0, lote:'', detalle:g.detalle || '',
        recurrencia:g.recurrencia || '', importado:true, por:'importado', at:Date.now() }));
      const porRubro = {}; b.gastos.forEach(g => { porRubro[g.rubro] = (porRubro[g.rubro] || 0) + (+g.total); });
      const cuotas = b.lotes.map(l => { const L = LOTES.find(x => x.lote === String(l.lote)) || { uf:l.uf, coef:l.coef };
        return { lote:'Lote ' + l.lote, uf:L.uf, coef:L.coef, expensas:l.expensas, mejoras:0, particulares:0, multas:0, fondo:l.fondo, redondeo:l.redondeo || 0,
          interes:l.interes || 0, saldoInicial:Math.round(((+l.deuda || 0) - (+l.disponible || 0)) * 100) / 100, total:Math.round((l.expensas + l.fondo + (l.redondeo || 0)) * 100) / 100, judicial:!!l.judicial }; });
      const liq = { id:'liq-' + b.periodo, periodo:b.periodo, estado:'emitida', importada:true, fuente:b.fuente || '', emitidaAt:emit, por:'importado',
        porColumna:{ expensas:b.totalGastos, mejoras:0, multas:0, fondo:0 }, porRubro, totalGastos:b.totalGastos, totalCuotas:cuotas.reduce((a, c) => a + c.total, 0), cuotas };
      const i = s.liquidaciones.findIndex(x => x.periodo === b.periodo);
      if (i >= 0) s.liquidaciones[i] = liq; else s.liquidaciones.push(liq);
      s.config.plan = Object.assign({}, cfgPlan(), { base:b.periodo, bancoInicial:b.banco?.saldoCierre || 0, deudaInicial:b.patrimonio?.deudasEInteresesACobrar || 0,
        recupero:b.banco?.cobrosAdeudadas || 0, interesesCobrados:b.banco?.cobrosIntereses || 0, banco:b.banco || {}, patrimonio:b.patrimonio || {},
        tasaCobro, tasaCobroBase:tasaCobro, tasaOctavo, importadoAt:Date.now() });
      auditar(s, 'Trajo la liquidación base', `${nombrePeriodo(b.periodo)} · ${b.gastos.length} gastos · ${b.lotes.length} lotes · ${plata(tot)}`);
    });
    toast('Listo: el año quedó desarrollado mes a mes', 'check');
    abrir('cobranzas', 'plan|anio');
  } catch(err){ toast('No pude traer ese archivo: ' + err.message, 'alert'); }
});

/* ---------- PDF y planilla ---------- */
A['plan-pdf'] = () => {
  const A2 = anioPlan(), futuros = A2.meses.filter(x => x.periodo > A2.cfg.base && x.estado !== 'sin-datos');
  const fila = x => `<tr><td>${nombrePeriodo(x.periodo)}${x.estado === 'proyectada' ? ' (estimado)' : x.estado === 'en-carga' ? ' (en carga)' : ''}</td><td class="n">${plata(x.total)}</td><td class="n">${plata(x.cuotas)}</td><td class="n">${x.percibido != null ? plata(x.percibido) : '—'}</td><td class="n">${x.banco != null ? plata(x.banco) : '—'}</td><td class="n">${x.deuda != null ? plata(x.deuda) : '—'}</td></tr>`;
  const cuerpo = `<h2>Resumen del año ${A2.anio}</h2>
    <p>Base real: ${nombrePeriodo(A2.cfg.base)}. Los meses siguientes se desarrollan con inflación de ${A2.cfg.inflacion} % mensual, cobro en término de ${A2.cfg.tasaCobro} % y actualización de deudas de ${(tasaDeuda() * 100).toFixed(2)} % mensual.</p>
    <div style="color:#123">${graficoAnual(A2, { alto:220, todo:true })}</div>
    <table><tr><th>Mes</th><th class="n">Gastos</th><th class="n">Cupones</th><th class="n">Cobrado</th><th class="n">Banco</th><th class="n">Deuda vecinos</th></tr>${A2.meses.filter(x => x.estado !== 'sin-datos').map(fila).join('')}</table>
    ${futuros.map(x => `<h2>${nombrePeriodo(x.periodo)} · gastos ${x.estado === 'emitida' ? 'emitidos' : 'estimados'}</h2>
      <table><tr><th>Rubro</th><th>Proveedor y detalle</th><th class="n">Importe</th></tr>${x.items.slice().sort((a, b) => a.rubro - b.rubro).map(g => `<tr><td>${g.rubro}</td><td>${esc(g.proveedor)} · ${esc(String(g.detalle || '').replace(/\s*\(estimado\)/i, ''))}${g.nota ? ' · ' + esc(g.nota) : ''}${g.proyectado || g.estimado ? ' <i>(estimado)</i>' : ''}</td><td class="n">${plata(g.monto)}</td></tr>`).join('')}
      <tr class="total"><td colspan="2">Total del mes</td><td class="n">${plata(x.total)}</td></tr></table>`).join('')}
    <h2>Cuota estimada de cada lote</h2>
    <table style="font-size:10.5px"><tr><th>Lote</th><th class="n">Coef.</th><th class="n">Saldo hoy</th>${futuros.map(x => `<th class="n">${MESES_CORTO[+x.periodo.slice(5)]}</th>`).join('')}<th class="n">Total</th></tr>
      ${LOTES.map(L => { const c = futuros.map(x => cuotaLoteEn(x, L)); return `<tr><td>Lote ${esc(L.lote)}</td><td class="n">${L.coef.toFixed(4)}</td><td class="n">${plata(saldoLote('Lote ' + L.lote))}</td>${c.map(v => `<td class="n">${plata(v)}</td>`).join('')}<td class="n">${plata(c.reduce((a, b) => a + b, 0))}</td></tr>`; }).join('')}</table>`;
  imprimir(`Expensas ${A2.anio} · desarrollo mes a mes`, cuerpo);
};
A['plan-csv'] = () => {
  const A2 = anioPlan(), futuros = A2.meses.filter(x => x.periodo > A2.cfg.base && x.estado !== 'sin-datos');
  const n = v => (Math.round(v * 100) / 100).toFixed(2).replace('.', ',');
  const filas = [['Lote','UF','Coeficiente','Saldo hoy', ...futuros.map(x => nombrePeriodo(x.periodo)), 'Total'].join(';'),
    ...LOTES.map(L => { const c = futuros.map(x => cuotaLoteEn(x, L)); return [`Lote ${L.lote}`, L.uf, String(L.coef).replace('.', ','), n(saldoLote('Lote ' + L.lote)), ...c.map(n), n(c.reduce((a, b) => a + b, 0))].join(';'); })];
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + filas.join('\n')], { type:'text/csv' })); a.download = `expensas-${A2.anio}-por-lote.csv`; a.click();
};

/* La pestaña "Automáticas" de Expensas y cobranzas. */
COBRO.plan = sub => vistaPlan(sub);

/* ---------- el cierre automático, en el motor de reglas ---------- */
REGLAS.push({ id:'plan-mensual', n:'Cierre automático de cada mes (expensas)', d:'El día de cierre arma la liquidación del mes anterior: completa lo que falte con estimados y avisa a la Administración (o la emite, si está activado).',
  run(s, hoy){
    if (yo()?.rol !== 'admin') return 0;
    const p = cfgPlan(); if (!p.base) return 0;
    if (+hoy.slice(8) < p.diaCierre) return 0;
    const prev = periodoAnterior(hoy.slice(0, 7));
    if (prev <= p.base || liquidacionDe(prev)?.estado === 'emitida') return 0;
    return marca(s, 'plan-cierre-' + prev, () => {
      const n = p.autoBorrador ? completarConEstimados(s, prev) : 0;
      const x = mesPlan(prev);
      notificar(s, { para:'rol:admin', titulo:`${nombrePeriodo(prev)} está lista para ${p.autoEmitir ? 'emitirse' : 'revisar y emitir'}`,
        texto:`${plata(x.total)} en gastos${n ? ` (${plural(n, 'estimado')})` : ''} · cuota promedio ${plata(x.cuotas / LOTES.length)}`, icon:'zap', color:'wood', link:'contabilidad:cierre|' + prev, sonido:true });
      if (p.autoEmitir) setTimeout(() => emitirLiquidacion(prev, { auto:true }), 1500);
    });
  } });

/* =========================================================
   LO QUE VE EL VECINO
   · En su carpeta: las próximas expensas estimadas de su lote.
   · El TABLERO: en qué se gasta la plata del barrio, lo presupuestado
     contra lo real, y la morosidad en conjunto (sin datos de nadie).
   ========================================================= */
function proximasDelLote(lote){
  const L = LOTES.find(x => 'Lote ' + x.lote === lote); if (!L || !cfgPlan().base) return '';
  const A2 = anioPlan(), fut = A2.meses.filter(x => x.periodo > A2.cfg.base && x.estado !== 'emitida' && x.estado !== 'sin-datos');
  if (!fut.length) return '';
  const vals = fut.map(x => ({ t:nombrePeriodo(x.periodo), v:cuotaLoteEn(x, L) }));
  return `${sec('Tus próximas expensas (estimadas)')}
    <div class="card">${barrasH(vals.map(v => ({ t:v.t, v:v.v, c:CHART_COL.proyectada, etiqueta:plata(v.v) })))}
      <p class="muted tiny" style="margin:8px 0 0">Estimado con los gastos de ${nombrePeriodo(A2.tpl?.periodo || A2.cfg.base)} y una inflación de ${A2.cfg.inflacion} % mensual. El cupón real puede variar según las facturas de cada mes.</p>
      <div class="btns" style="margin-top:8px"><button class="btn btn-xs btn-sec" data-a="abrir" data-v="tablero">${I('eye')}En qué se gasta la plata del barrio</button></div></div>`;
}
R.tablero = {
  titulo:'Las cuentas del barrio', icon:'wallet', color:'wood', ancha:true, sub:'En qué se gasta, lo previsto contra lo real y la morosidad, sin datos personales',
  render(){
    const p = cfgPlan();
    if (!p.base) return vacio('wallet', 'Todavía no hay datos cargados. Cuando la Administración empiece a liquidar con la app, acá se ve todo.');
    const A2 = anioPlan(), emit = liquidacionesEmitidas().slice(-1)[0], m = mesPlan(emit?.periodo || p.base);
    const rubros = Object.entries(m.porRubro).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
    const ultima = emit, conDeuda = ultima ? LOTES.filter(L => { const lote = 'Lote ' + L.lote, cu = cuotaDe(ultima, lote); return saldoLote(lote) > (cu?.total || 0) + 1; }).length : 0;
    const comparar = A2.meses.filter(x => x.estado === 'emitida').map(x => { const prev = A2.meses.find(y => y.periodo === periodoAnterior(x.periodo)); return prev && prev.total ? { x, prev } : null; }).filter(Boolean);
    return `<div class="garita-kpis"><div class="kpi"><b>${plataCorta(m.total)}</b><span>Gastos de ${MESES_LARGO[+m.periodo.slice(5)]}</span></div>
        <div class="kpi"><b>${plataCorta(m.total / LOTES.length)}</b><span>Promedio por lote</span></div>
        <div class="kpi"><b>${Math.round(conDeuda / LOTES.length * 100)} %</b><span>Lotes con deuda vencida</span></div></div>
      ${sec('El año, mes a mes')}<div class="card grafico-card">${graficoAnual(A2)}${leyendaAnual()}</div>
      ${sec(`En qué se gastó en ${MESES_LARGO[+m.periodo.slice(5)]}`)}
      <div class="card">${barrasH(rubros.map(([r, v]) => ({ t:RUBROS[r] || 'Otros', v, etiqueta:`${plataCorta(v)} · ${(v / (m.total || 1) * 100).toFixed(1)} %` })))}</div>
      ${comparar.length ? sec('Previsto contra real') + `<div class="card lista">${comparar.map(({ x, prev }) => `<div class="it"><div class="txt"><b>${nombrePeriodo(x.periodo)}</b><span>Mes anterior ${plata(prev.total)}</span></div><b class="num">${plata(x.total)} <small class="${x.total > prev.total ? 'rojo' : ''}">${x.total > prev.total ? '+' : ''}${((x.total / prev.total - 1) * 100).toFixed(1)} %</small></b></div>`).join('')}</div>` : ''}
      ${sec('Morosidad del barrio')}
      <div class="card grafico-card">${graficoLineas(A2.meses, [{ k:'deuda', n:'Deuda total de vecinos (estimada)', c:CHART_COL.deuda }])}
        <p class="muted tiny" style="margin:6px 0 0">Suma de lo que deben todos los lotes, con intereses. No se muestra quién debe: eso lo ve solo la Administración.</p></div>
      ${sec('Obras')}
      ${aLista(Store.s.obras).filter(o => o.estado === 'activa').length ? `<div class="card lista">${aLista(Store.s.obras).filter(o => o.estado === 'activa').map(o => `<div class="it"><div class="txt"><b>${esc(o.casa)} · ${esc(o.tipo)}</b><span>${esc(typeof ETAPAS !== 'undefined' ? ETAPAS[o.etapa] || '' : '')}${o.finEstimado ? ' · fin estimado ' + fechaCorta(o.finEstimado) : ''}</span></div></div>`).join('')}</div>` : '<p class="muted small">No hay obras en curso.</p>'}
      ${superficie({ a:'abrir', v:'expensas', icon:'wallet', color:'wood', t:'Mi cuenta de expensas', s:'Cupones, pagos y recibos de tu lote' })}`;
  },
};
