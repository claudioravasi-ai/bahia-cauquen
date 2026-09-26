/* =========================================================
   EXPENSAS
   -------------------------------------------------------
   Todo lo contable del barrio, con el mismo formato que los
   vecinos ya saben leer:

     · Gastos del mes por rubro, con el comprobante de cada uno.
     · Cierre de mes: prorrateo por coeficiente de cada lote,
       Fondo de Infraestructura fijo, gastos particulares y
       multas firmes, saldo anterior e intereses.
     · Carpeta de cada vecino: cupón del mes, historial, pagos
       y recibos.
     · Cobranza desde la app: transferencia con alias y CBU, el
       vecino informa el pago con la foto del comprobante y la
       Administración lo confirma.
     · Impositivo (ARCA): libro de gastos del mes para el
       contador, retenciones practicadas y la lista de
       presentaciones con sus vencimientos.
   ========================================================= */

const RUBROS = {
  3:  'Servicios públicos',
  4:  'Abono de servicios',
  5:  'Mantenimiento de partes comunes',
  7:  'Gastos bancarios',
  10: 'Seguros',
  11: 'Otros',
  12: 'Gastos particulares',
};
const COLUMNAS = { expensas:'Expensas', mejoras:'Mejoras', multas:'Multas, obleas y otros', fondo:'Fondo de Infraestructura' };
const TIPOS_COMP = ['Factura A','Factura B','Factura C','Recibo','Nota de débito','Nota de crédito','Otros'];

const cfgExp = () => Object.assign({ vto1:10, vto2:21, recargo2:1.5, interesMensual:3, fondoFijo:5000, mpLink:'', reciboNro:0, contador:'', condicion:'Exento', iibb:'', empleados:false }, Store.s.config.exp || {});
const periodoHoy = () => hoyISO().slice(0, 7);
const periodoAnterior = p => { const [a, m] = p.split('-').map(Number); return m === 1 ? `${a - 1}-12` : `${a}-${pad(m - 1)}`; };
const nombrePeriodo = p => { const [a, m] = p.split('-').map(Number); return `${['','Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'][m]} ${a}`; };
const plata = n => '$ ' + (Math.round((+n || 0) * 100) / 100).toLocaleString('es-AR', { minimumFractionDigits:2, maximumFractionDigits:2 });
/* Los montos grandes, cortos, para que entren en las tarjetas. */
const plataCorta = n => { n = +n || 0; const a = Math.abs(n);
  if (a >= 1e6) return '$ ' + (n / 1e6).toLocaleString('es-AR', { maximumFractionDigits:1 }) + ' M';
  if (a >= 1e4) return '$ ' + Math.round(n / 1e3).toLocaleString('es-AR') + ' mil';
  return plata(n); };
const vtoDe = (periodo, cual = 1) => { const [a, m] = periodo.split('-').map(Number); const c = cfgExp();
  const d = new Date(a, m, cual === 1 ? c.vto1 : c.vto2); return isoDe(d); };   /* vence al mes siguiente */

/* =========================================================
   LOS CENTAVOS DICEN DE QUÉ LOTE ES EL PAGO
   El total de cada cupón termina en los centavos del número de lote: el
   Lote 148 paga $ …,48; el Lote 9, $ …,09; el 133A, $ …,33. Así, cuando
   entra una transferencia al banco, se sabe de quién es sin preguntar.
   Es la columna "Redondeo" de la liquidación: se suman entre 0 y 99
   centavos al total del cupón (saldo anterior + intereses + expensas).
   ========================================================= */
const centavosDelLote = lote => { const m = String(lote || '').replace(/^Lote\s*/i, '').match(/\d+/); return m ? (+m[0]) % 100 : 0; };
function conCentavosDelLote(monto, lote){
  const c = Math.round((+monto || 0) * 100);
  if (c <= 0) return { total:c / 100, redondeo:0 };
  const r = ((centavosDelLote(lote) - (c % 100)) + 100) % 100;
  return { total:(c + r) / 100, redondeo:r / 100 };
}

/* ---------- cálculo ---------- */
const gastosDe = p => Store.s.gastos.filter(g => g.periodo === p && !g.anulado);
const liquidacionDe = p => Store.s.liquidaciones.find(l => l.periodo === p);
const liquidacionesEmitidas = () => Store.s.liquidaciones.filter(l => l.estado === 'emitida').sort((a, b) => a.periodo.localeCompare(b.periodo));
const cuotaDe = (l, lote) => (l.cuotas || []).find(c => c.lote === lote);
const pagosDe = lote => Store.s.pagos.filter(p => p.lote === lote && p.estado === 'confirmado');
/* =========================================================
   CUÁNDO UN PAGO DESCUENTA DEL SALDO (26-09-2026)
     · Confirmado por la Administración (con recibo): descuenta.
     · Pagado con Mercado Pago desde la app: descuenta EN EL MOMENTO. Lo
       aprobó Mercado Pago y la app se lo preguntó a Mercado Pago (nadie lo
       "declara"); la Administración lo pasa a recibo sola al conciliar, y
       si por algún motivo Mercado Pago no lo tiene como aprobado, lo
       rechaza y el saldo vuelve.
     · Pagado por fuera de la app e informado con el comprobante: queda
       "POR ACREDITAR" hasta que la Administración lo corrobora. El vecino
       ve su deuda, lo que tiene por acreditar y cuánto le queda.
   ========================================================= */
const esPagoMP = p => !!(p && p.mpId && p.medio === 'Mercado Pago');
/* PAGOS DE PRUEBA (26-09-2026): los que se hacen con las cuentas de prueba
   de Mercado Pago (live_mode = false). Se ven, para probar el circuito,
   pero no descuentan saldos, no sacan recibo ni entran a la contabilidad.
   La Administración los borra con un toque cuando termina de probar. */
const esPrueba = p => !!(p && p.prueba);
const pagoAcreditado = p => !!p && !esPrueba(p) && (p.estado === 'confirmado' || (p.estado === 'informado' && esPagoMP(p)));
const porAcreditar = p => !!p && p.estado === 'informado' && !esPagoMP(p) && !esPrueba(p);

/* Movimientos de un lote: cada liquidación emitida es un cargo y cada pago
   confirmado, un crédito. El saldo sale de la resta. */
function cuentaLote(lote){
  const movs = [];
  liquidacionesEmitidas().forEach(l => {
    const c = cuotaDe(l, lote); if (!c) return;
    /* La primera liquidación que se trajo de Octavo Piso trae el saldo que el
       lote arrastraba de antes (deuda, o saldo a favor si es negativo). */
    if (c.saldoInicial) movs.push(c.saldoInicial > 0
      ? { fecha:l.emitidaAt - 1, periodo:l.periodo, detalle:`Saldo anterior a ${nombrePeriodo(l.periodo)}${c.judicial ? ' (en gestión judicial)' : ''}`, debe:c.saldoInicial, tipo:'saldo' }
      : { fecha:l.emitidaAt - 1, periodo:l.periodo, detalle:`Saldo a favor anterior a ${nombrePeriodo(l.periodo)}`, haber:-c.saldoInicial, tipo:'saldo' });
    movs.push({ fecha:l.emitidaAt, periodo:l.periodo, detalle:`Expensas ${nombrePeriodo(l.periodo)}`, debe:c.total, tipo:'cuota' });
    if (c.interes) movs.push({ fecha:l.emitidaAt, periodo:l.periodo, detalle:'Intereses por saldo impago', debe:c.interes, tipo:'interes' });
  });
  Store.s.pagos.filter(p => p.lote === lote && p.estado !== 'rechazado' && !esPrueba(p)).forEach(p => {
    const acred = pagoAcreditado(p);
    movs.push({ fecha:p.fecha ? fechaDe(p.fecha).getTime() : p.at,
      detalle: p.estado === 'confirmado' ? `Pago recibido (${p.medio})` : acred ? 'Pago con Mercado Pago · aprobado, recibo en camino' : `Pago informado, por acreditar (${p.medio})`,
      haber:p.monto, tipo:'pago', pendiente:!acred, id:p.id });
  });
  movs.sort((a, b) => a.fecha - b.fecha);
  let saldo = 0;
  movs.forEach(m => { saldo += (m.debe || 0) - (m.pendiente ? 0 : (m.haber || 0)); m.saldo = saldo; });
  const informado = Store.s.pagos.filter(p => p.lote === lote && porAcreditar(p)).reduce((a, p) => a + (+p.monto || 0), 0);
  return { movs, saldo, informado, porAcreditar:informado };
}
const saldoLote = lote => cuentaLote(lote).saldo;
const miLote = () => yo()?.casa || '';

/* Lo que hay que pagar este mes, con el recargo si ya pasó el primer
   vencimiento. */
function aPagar(lote){
  const c = cfgExp(), l = liquidacionesEmitidas().slice(-1)[0];
  const cuenta = cuentaLote(lote);
  if (!l) return { saldo:cuenta.saldo, total:cuenta.saldo, periodo:'', vto1:'', vto2:'', recargo:0 };
  const v1 = vtoDe(l.periodo, 1), v2 = vtoDe(l.periodo, 2);
  const hoy = hoyISO();
  let recargo = hoy > v1 ? cuenta.saldo * c.recargo2 / 100 : 0;
  /* Con recargo, el total se lleva a los centavos del lote. */
  if (recargo) recargo = conCentavosDelLote(cuenta.saldo + recargo, lote).total - cuenta.saldo;
  return { saldo:cuenta.saldo, total:cuenta.saldo + recargo, recargo, periodo:l.periodo, vto1:v1, vto2:v2, vencido:hoy > v2, informado:cuenta.informado };
}
/* =========================================================
   EL RELOJ DE LOS VENCIMIENTOS DE UN LOTE (26-09-2026)
   Desde que la Administración cierra el mes y emite los cupones hasta
   que el lote paga (o informa que pagó por fuera): cuántos días faltan
   para el 1º y el 2º vencimiento y cuánto vale cada uno. Lo usan la
   tarjeta de Expensas, el aviso privado de la pizarra ("Para vos") y el
   correo a quien no pagó después del 2º vencimiento.
   Lo "por acreditar" cuenta como avisado: a quien ya informó su pago no
   se le sigue recordando.
   ========================================================= */
function estadoVencimiento(lote){
  const l = liquidacionesEmitidas().slice(-1)[0]; if (!l || !lote) return null;
  const cuenta = cuentaLote(lote), deuda = Math.round((cuenta.saldo - cuenta.informado) * 100) / 100;
  if (deuda <= .5) return null;
  const c = cfgExp(), v1 = vtoDe(l.periodo, 1), v2 = vtoDe(l.periodo, 2), hoy = hoyISO();
  const dias = f => Math.round((fechaDe(f) - fechaDe(hoy)) / DIA);
  const total2 = conCentavosDelLote(deuda * (1 + (c.recargo2 || 0) / 100), lote).total;
  const fase = hoy < v1 ? 'antes' : hoy === v1 ? 'vto1' : hoy < v2 ? 'entre' : hoy === v2 ? 'ultimo' : 'vencido';
  return { periodo:l.periodo, emitidaAt:l.emitidaAt, v1, v2, d1:dias(v1), d2:dias(v2), total1:deuda, total2, fase, deuda, porAcreditar:cuenta.informado };
}
/* El renglón privado de la pizarra ("Para vos"): uno por día, nuevo cada
   mañana hasta que se toca; el último día, rojo y titilando todo el día. */
function avisoExpensas(){
  const u = yo(); if (!u || !/^Lote\s/i.test(u.casa || '')) return null;
  if (esAdmin() && typeof modoActivo === 'function' && modoActivo() === 'admin') return null;
  const e = estadoVencimiento(u.casa); if (!e) return null;
  const hoy = hoyISO(), mes = nombrePeriodo(e.periodo);
  const [nivel, titulo] = {
    antes:   [e.d1 <= 3 ? 'amarillo' : 'verde', `Expensas de ${mes}: ${e.d1 === 1 ? 'mañana es' : `faltan ${e.d1} días para`} el 1º vencimiento`],
    vto1:    ['amarillo', `Hoy es el 1º vencimiento de las expensas de ${mes}`],
    entre:   [e.d2 <= 2 ? 'rojo' : 'amarillo', `Expensas de ${mes}: ${e.d2 === 1 ? 'mañana es' : `quedan ${e.d2} días para`} el último vencimiento`],
    ultimo:  ['rojo', `HOY es el último día para pagar las expensas de ${mes}`],
    vencido: ['rojo', `Tus expensas de ${mes} vencieron`],
  }[e.fase];
  const texto = e.fase === 'vencido' ? `Saldo ${plata(e.deuda)}. Pagado fuera de término, la expensa que viene suma el ajuste (${textoMora()}). Si ya pagaste, avisalo con el comprobante.`
    : e.fase === 'entre' || e.fase === 'ultimo' ? `Hasta el ${fechaCorta(e.v2)}: ${plata(e.total2)} (con el recargo del 2º vencimiento)`
    : `1º vto ${fechaCorta(e.v1)}: ${plata(e.total1)} · 2º vto ${fechaCorta(e.v2)}: ${plata(e.total2)}`;
  return { k:`exp-${e.periodo}-${hoy}`, nivel, icon:'wallet', tag:'Tus expensas · privado', at:new Date(hoy + 'T00:01').getTime(), titulo, texto, a:'abrir', v:'expensas', siempre: e.fase === 'ultimo' };
}
/* La tasa con que se ajusta lo que se paga fuera de término, en palabras. */
function tasaMoraPct(){ return typeof tasaDeuda === 'function' ? Math.round(tasaDeuda() * 10000) / 100 : cfgExp().interesMensual; }
function textoMora(){
  const p = typeof cfgPlan === 'function' ? cfgPlan() : {}, t = tasaMoraPct().toLocaleString('es-AR', { maximumFractionDigits:2 });
  if (p.metodoDeuda === 'ipc') return `ajuste por inflación, IPC del INDEC${p.ipc?.mes ? ' de ' + nombrePeriodo(p.ipc.mes) : ''}: ${t} % mensual`;
  if (p.metodoDeuda === 'ipc+interes') return `inflación (IPC del INDEC) más interés: ${t} % mensual`;
  return `interés por mora del ${t} % mensual`;
}


/* Arma (sin guardar) la liquidación de un período. */
function calcularLiquidacion(periodo){
  const c = cfgExp(), gs = gastosDe(periodo);
  const porColumna = { expensas:0, mejoras:0, multas:0, fondo:0 };
  const porRubro = {};
  gs.forEach(g => {
    porColumna[g.columna] = (porColumna[g.columna] || 0) + (+g.total || 0);
    porRubro[g.rubro] = (porRubro[g.rubro] || 0) + (+g.total || 0);
  });
  const particulares = {};
  gs.filter(g => g.lote).forEach(g => { particulares[g.lote] = (particulares[g.lote] || 0) + (+g.total || 0); });
  /* Los gastos particulares no se prorratean: van al lote que los generó. */
  const prorratear = porColumna.expensas - Object.values(particulares).reduce((a, b) => a + b, 0);
  const multasFirmes = {};
  Store.s.infracciones.filter(i => i.estado === 'firme' && !i.liquidada && i.monto).forEach(i => {
    const m = parseFloat(String(i.monto).replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.'));
    if (m > 0) multasFirmes[i.casa] = (multasFirmes[i.casa] || 0) + m;
  });
  const anterior = liquidacionDe(periodoAnterior(periodo));
  const cuotas = LOTES.map(L => {
    const lote = 'Lote ' + L.lote;
    const expensas = prorratear * L.coef / 100;
    const mejoras = porColumna.mejoras * L.coef / 100;
    const part = particulares[lote] || 0;
    const multa = multasFirmes[lote] || 0;
    /* Interés sobre lo que quedó impago del mes anterior. */
    const saldoPrevio = Math.max(0, saldoLote(lote));
    /* Lo que quedó impago del mes anterior se ajusta con la tasa elegida:
       inflación (IPC del INDEC, se trae sola), inflación + interés, o el
       interés por mora fijo (Parámetros → Pago fuera de término). */
    const interes = anterior && saldoPrevio > 0 ? Math.round(saldoPrevio * tasaMoraPct()) / 100 : 0;
    const sinRedondeo = Math.round((expensas + mejoras + part + multa + c.fondoFijo) * 100) / 100;
    /* El redondeo se calcula sobre lo que el vecino va a pagar en total
       (lo que arrastra + intereses + este mes), para que ESE número termine
       en los centavos de su lote. */
    const { redondeo } = conCentavosDelLote(Math.max(0, saldoLote(lote)) + interes + sinRedondeo, lote);
    const total = Math.round((sinRedondeo + redondeo) * 100) / 100;
    return { lote, uf:L.uf, coef:L.coef, expensas, mejoras, particulares:part, multas:multa, fondo:c.fondoFijo, interes, redondeo, total };
  });
  return { periodo, gastos:gs.length, porColumna, porRubro,
    totalGastos:Object.values(porColumna).reduce((a, b) => a + b, 0),
    totalCuotas:cuotas.reduce((a, x) => a + x.total, 0), cuotas,
    multasFirmes: Object.keys(multasFirmes).length };
}

/* ---------- impresión (cupón, liquidación, recibo, certificado) ---------- */
function imprimir(titulo, cuerpo){
  const c = Store.s.config;
  const w = window.open('', '_blank');
  if (!w){ toast('El navegador bloqueó la ventana de impresión', 'alert'); return; }
  w.document.write(`<!DOCTYPE html><html lang="es-AR"><head><meta charset="utf-8"><title>${esc(titulo)}</title>
    <style>
      *{box-sizing:border-box} body{font:13px/1.45 -apple-system,Segoe UI,Roboto,sans-serif;color:#111;margin:0;padding:24px;background:#f4f5f5}
      .hoja{max-width:820px;margin:0 auto;background:#fff;padding:26px 30px;border-radius:10px;box-shadow:0 2px 10px rgba(0,0,0,.08)}
      h1{font-size:19px;margin:0 0 2px} h2{font-size:15px;margin:22px 0 8px;padding-bottom:5px;border-bottom:2px solid #0d6b66;color:#0d6b66}
      .cab{display:flex;justify-content:space-between;gap:20px;border-bottom:3px solid #0d6b66;padding-bottom:12px;margin-bottom:16px}
      .cab .der{text-align:right;font-size:12px;color:#555}
      table{width:100%;border-collapse:collapse;font-size:12px} th,td{padding:6px 8px;border-bottom:1px solid #e3e6e6;text-align:left}
      th{background:#f0f4f3;font-size:11px;text-transform:uppercase;letter-spacing:.5px;color:#456}
      td.n,th.n{text-align:right;font-variant-numeric:tabular-nums}
      tr.total td{font-weight:800;border-top:2px solid #0d6b66;border-bottom:0;font-size:13px}
      .caja{border:1px solid #dde2e1;border-radius:8px;padding:12px 14px;margin:10px 0;background:#fafbfb}
      .grande{font-size:22px;font-weight:800;color:#0d6b66}
      .pie{margin-top:22px;padding-top:12px;border-top:1px solid #dde2e1;font-size:11px;color:#666}
      .firma{margin-top:40px;display:flex;gap:40px} .firma div{flex:1;border-top:1px solid #999;padding-top:6px;font-size:11px;text-align:center}
      @media print{ body{background:#fff;padding:0} .hoja{box-shadow:none;border-radius:0;max-width:none} .noimp{display:none} }
    </style></head><body><div class="hoja">
    <div class="cab"><div><h1>Barrio ${esc(c.nombre)}</h1>
      <div style="font-size:12px;color:#555">${esc(c.domicilio || '')} · CUIT ${esc(c.cuit || '')}<br>${esc(c.adminEmail || '')} ${c.adminTel ? '· ' + esc(c.adminTel) : ''}</div></div>
      <div class="der"><b>${esc(titulo)}</b><br>Emitido ${fechaHora(Date.now())}</div></div>
    ${cuerpo}
    <div class="pie">Documento generado por la app del barrio. Los importes están expresados en pesos.</div>
    <div class="noimp" style="text-align:center;margin-top:18px"><button onclick="window.print()" style="padding:10px 20px;border:0;border-radius:8px;background:#0d6b66;color:#fff;font-weight:700;cursor:pointer">Imprimir o guardar como PDF</button></div>
    </div></body></html>`);
  w.document.close();
}

function cuponHTML(lote, periodo){
  const l = liquidacionDe(periodo), c = cuotaDe(l || {}, lote), cf = cfgExp();
  const prop = propietarioDe(lote), cuenta = cuentaLote(lote);
  const hasta = new Date(l.emitidaAt).getTime();
  const previos = cuenta.movs.filter(m => m.fecha < hasta);
  const saldoAnterior = previos.length ? previos[previos.length - 1].saldo : 0;
  const total1 = saldoAnterior + c.total + (c.interes || 0);
  /* El 2º vencimiento también termina en los centavos del lote. */
  const total2 = conCentavosDelLote(total1 * (1 + cf.recargo2 / 100), lote).total;
  const fila = (t, v) => `<tr><td>${t}</td><td class="n">${plata(v)}</td></tr>`;
  return `<h2>Cupón de pago · ${nombrePeriodo(periodo)}</h2>
    <div class="caja"><b>${esc(prop || 'Propietario')}</b><br>${esc(lote)} · UF ${esc(c.uf)} · coeficiente ${c.coef.toFixed(4)} %</div>
    <table>
      ${fila('Saldo anterior', saldoAnterior)}
      ${c.interes ? fila('Intereses por saldo impago', c.interes) : ''}
      ${fila('Expensas: gastos, servicios y mantenimiento', c.expensas)}
      ${c.mejoras ? fila('Mejoras', c.mejoras) : ''}
      ${c.multas ? fila('Multas, obleas y otros', c.multas) : ''}
      ${c.particulares ? fila('Gastos particulares de la unidad', c.particulares) : ''}
      ${fila('Fondo de Infraestructura', c.fondo)}
      ${c.redondeo ? fila(`Redondeo (los centavos identifican al ${esc(lote)})`, c.redondeo) : ''}
      <tr class="total"><td>Total 1º vencimiento · ${fechaCorta(vtoDe(periodo, 1))}</td><td class="n">${plata(total1)}</td></tr>
      <tr class="total"><td>Total 2º vencimiento · ${fechaCorta(vtoDe(periodo, 2))} (+${cf.recargo2} %)</td><td class="n">${plata(total2)}</td></tr>
    </table>
    <div class="caja"><b>Formas de pago</b><br>Transferencia · Alias <b>${esc(Store.s.config.alias || '')}</b> · CBU ${esc(Store.s.config.cbu || '')}<br>
      Titular: Barrio ${esc(Store.s.config.nombre)} · CUIT ${esc(Store.s.config.cuit || '')}<br>
      Una vez pagado, informalo desde la app (Expensas → Informar pago) y te llega el recibo.</div>`;
}

function liquidacionHTML(periodo){
  const l = liquidacionDe(periodo);
  const gs = gastosDe(periodo);
  const porRubro = {};
  gs.forEach(g => { (porRubro[g.rubro] = porRubro[g.rubro] || []).push(g); });
  const total = l.totalGastos || Object.values(l.porColumna).reduce((a, b) => a + b, 0);
  return `<h2>Liquidación de expensas · ${nombrePeriodo(periodo)}</h2>
    <div class="caja">Primer vencimiento: <b>${fechaCorta(vtoDe(periodo, 1))}</b> · Segundo vencimiento: <b>${fechaCorta(vtoDe(periodo, 2))}</b> (+${cfgExp().recargo2} %)</div>
    ${Object.keys(porRubro).sort((a, b) => a - b).map(r => {
      const sub = porRubro[r].reduce((a, g) => a + (+g.total || 0), 0);
      return `<h2>${r} · ${esc(RUBROS[r] || 'Otros')}</h2><table>
        <tr><th>Proveedor y comprobante</th><th class="n">Importe</th></tr>
        ${porRubro[r].map(g => `<tr><td>${esc(g.proveedor)}${g.cuit ? ' · CUIT ' + esc(g.cuit) : ''}<br>
          <span style="color:#666">${esc(g.tipoComp || '')} ${esc(g.nroComp || '')}${g.cuotaN ? ` · pago ${g.cuotaN} de ${g.cuotaDe}` : ''}${g.detalle ? ' · ' + esc(g.detalle) : ''}</span></td>
          <td class="n">${plata(g.total)}</td></tr>`).join('')}
        <tr class="total"><td>Total rubro ${r} · ${(sub / total * 100).toFixed(2)} %</td><td class="n">${plata(sub)}</td></tr></table>`;
    }).join('')}
    <h2>Totales del período</h2><table>
      ${Object.entries(COLUMNAS).map(([k, t]) => `<tr><td>${t}</td><td class="n">${plata(l.porColumna[k] || 0)}</td></tr>`).join('')}
      <tr class="total"><td>Total de gastos</td><td class="n">${plata(total)}</td></tr>
      <tr class="total"><td>Total prorrateado a los ${l.cuotas.length} lotes (incluye Fondo de Infraestructura)</td><td class="n">${plata(l.totalCuotas)}</td></tr>
    </table>
    <h2>Prorrateo por unidad</h2><table>
      <tr><th>UF</th><th>Lote</th><th class="n">Coef. %</th><th class="n">Expensas</th><th class="n">Fondo</th><th class="n">Otros</th><th class="n">Total</th></tr>
      ${l.cuotas.map(c => `<tr><td>${esc(c.uf)}</td><td>${esc(c.lote)}</td><td class="n">${c.coef.toFixed(4)}</td>
        <td class="n">${plata(c.expensas)}</td><td class="n">${plata(c.fondo)}</td>
        <td class="n">${plata((c.mejoras || 0) + (c.multas || 0) + (c.particulares || 0))}</td><td class="n">${plata(c.total)}</td></tr>`).join('')}
      <tr class="total"><td colspan="6">Total</td><td class="n">${plata(l.totalCuotas)}</td></tr></table>
    <div class="firma"><div>Administración</div><div>Consejo de administración</div></div>`;
}

function reciboHTML(r){
  return `<h2>Recibo de expensas Nº ${esc(r.numero)}</h2>
    <div class="caja"><b>${esc(propietarioDe(r.lote) || r.lote)}</b><br>${esc(r.lote)}</div>
    <table>
      <tr><td>Fecha del pago</td><td class="n">${fechaCorta(r.fecha)}</td></tr>
      <tr><td>Medio</td><td class="n">${esc(r.medio)}</td></tr>
      <tr><td>Concepto</td><td class="n">${esc(r.concepto || 'Expensas')}</td></tr>
      <tr class="total"><td>Recibimos</td><td class="n">${plata(r.monto)}</td></tr>
    </table>
    <p>Son pesos ${esc(enLetras(r.monto))}.</p>
    <div class="caja">Saldo de la unidad al ${fechaCorta(hoyISO())}: <b>${plata(saldoLote(r.lote))}</b></div>
    <div class="firma"><div>Administración</div><div>Recibí conforme</div></div>`;
}
/* Importe en letras, para el recibo. */
function enLetras(n){
  n = Math.floor(+n || 0);
  const U = ['','uno','dos','tres','cuatro','cinco','seis','siete','ocho','nueve','diez','once','doce','trece','catorce','quince','dieciséis','diecisiete','dieciocho','diecinueve','veinte'];
  const D = ['','','veinti','treinta','cuarenta','cincuenta','sesenta','setenta','ochenta','noventa'];
  const C = ['','ciento','doscientos','trescientos','cuatrocientos','quinientos','seiscientos','setecientos','ochocientos','novecientos'];
  const menor = x => {
    if (x <= 20) return U[x];
    if (x < 30) return D[2] + U[x - 20];
    if (x < 100){ const d = Math.floor(x / 10), u = x % 10; return D[d] + (u ? ' y ' + U[u] : ''); }
    if (x === 100) return 'cien';
    const c = Math.floor(x / 100), r = x % 100; return C[c] + (r ? ' ' + menor(r) : '');
  };
  if (n === 0) return 'cero';
  const mill = Math.floor(n / 1000000), mil = Math.floor((n % 1000000) / 1000), res = n % 1000;
  let t = '';
  if (mill) t += (mill === 1 ? 'un millón' : menor(mill) + ' millones') + ' ';
  if (mil) t += (mil === 1 ? 'mil' : menor(mil) + ' mil') + ' ';
  if (res) t += menor(res);
  return t.trim();
}

function certificadoHTML(lote){
  const cuenta = cuentaLote(lote), c = cfgExp();
  const deuda = cuenta.movs.filter(m => m.debe);
  return `<h2>Certificado de deuda por expensas</h2>
    <p>La Administración del Barrio ${esc(Store.s.config.nombre)}, CUIT ${esc(Store.s.config.cuit || '')}, <b>CERTIFICA</b> que la unidad
    <b>${esc(lote)}</b>${propietarioDe(lote) ? `, cuyo titular registral es <b>${esc(propietarioDe(lote))}</b>,` : ''} adeuda a la fecha la suma de
    <span class="grande">${plata(cuenta.saldo)}</span> en concepto de expensas comunes, intereses y demás contribuciones.</p>
    <h2>Detalle</h2><table>
      <tr><th>Fecha</th><th>Concepto</th><th class="n">Debe</th><th class="n">Haber</th><th class="n">Saldo</th></tr>
      ${cuenta.movs.map(m => `<tr><td>${fechaCorta(isoDe(new Date(m.fecha)))}</td><td>${esc(m.detalle)}</td>
        <td class="n">${m.debe ? plata(m.debe) : ''}</td><td class="n">${m.haber ? plata(m.haber) : ''}</td><td class="n">${plata(m.saldo)}</td></tr>`).join('')}
      <tr class="total"><td colspan="4">Total adeudado</td><td class="n">${plata(cuenta.saldo)}</td></tr></table>
    <p style="font-size:11.5px;color:#555">Se extiende el presente en los términos del artículo 2048 del Código Civil y Comercial de la Nación,
    que otorga al certificado de deuda por expensas el carácter de título ejecutivo. Actualización aplicada sobre el saldo impago: ${esc(textoMora())}.</p>
    <div class="firma"><div>Administración</div><div>Consejo de administración</div></div>`;
}

/* =========================================================
   VENTANA DEL VECINO: su carpeta
   ========================================================= */
R.expensas = {
  icon: 'wallet', color: 'wood', sub: 'Tu cuenta, tus cupones y tus pagos',
  titulo: p => p && esAdmin() ? `Cuenta del ${p}` : 'Expensas',
  render(p){
    const u = yo(), lote = miLote(), L = loteDe(u);
    /* La Administración mira la cuenta de un lote (desde el padrón o morosos). */
    if (esAdmin() && p && /^Lote\s/i.test(p)) return `<div class="card plana small">${I('eye')} Estás viendo la cuenta del <b>${esc(p)}</b>${propietarioDe(p) ? ' · ' + esc(propietarioDe(p)) : ''}, como la ve el vecino.
        <div class="btns" style="margin-top:8px">${saldoLote(p) > .5 ? `<button class="btn btn-xs btn-sec" data-a="certificado-deuda" data-v="${esc(p)}">${I('file')}Certificado de deuda</button><button class="btn btn-xs btn-sec" data-a="reclamar-deuda" data-v="${esc(p)}">${I('send')}Reclamar</button>` : ''}
          <button class="btn btn-xs btn-sec" data-a="ficha-lote" data-v="${esc(p.replace(/^Lote\s*/i, ''))}">${I('user')}Ficha del lote</button></div></div>
      ${carpetaVecino(p, { ajena:true })}`;
    /* En modo Administración, "Expensas" a secas muestra la cuenta del
       propio lote; las del barrio están en Gestión → Expensas y cobranzas
       (no se repiten acá). */
    if (esAdmin() && !p) return L ? carpetaVecino(lote) : vacio('wallet', 'Tu cuenta no tiene lote. Las expensas del barrio están en Gestión → Expensas.');
    if (!L) return vacio('wallet', 'Tu cuenta todavía no tiene un lote asignado. Avisale a la Administración.');
    return carpetaVecino(lote);
  },
};
function carpetaVecino(lote, { ajena = false } = {}){
  const cuenta = cuentaLote(lote), pagar = aPagar(lote), c = cfgExp();
  const L = lote && typeof LOTES !== 'undefined' ? LOTES.find(x => 'Lote ' + x.lote === lote) : null;
  const emitidas = liquidacionesEmitidas().slice().reverse();
  const misPagos = Store.s.pagos.filter(p => p.lote === lote).sort((a, b) => b.at - a.at);
  const misRecibos = Store.s.recibos.filter(r => r.lote === lote).sort((a, b) => b.at - a.at);
  const alDia = cuenta.saldo <= 0.5;
  /* Pagó por fuera y lo informó: la deuda queda cubierta "por acreditar". */
  const cubierto = !alDia && cuenta.saldo - cuenta.informado <= 0.5;
  const e = estadoVencimiento(lote);
  const cuenta1 = e && !alDia && !cubierto ? `<span class="tp-reloj f-${e.fase}">
      <span><small>1º vto · ${fechaCorta(e.v1)}</small><b>${plata(e.total1)}</b>${e.d1 > 0 ? `<em>faltan ${plural(e.d1, 'día', 'días')}</em>` : e.d1 === 0 ? '<em>hoy</em>' : '<em>vencido</em>'}</span>
      <span><small>2º vto · ${fechaCorta(e.v2)}</small><b>${plata(e.total2)}</b>${e.d2 > 0 ? `<em>faltan ${plural(e.d2, 'día', 'días')}</em>` : e.d2 === 0 ? '<em>¡hoy es el último día!</em>' : '<em>vencido</em>'}</span></span>` : '';
  return `
    <button class="tarjeta-pago ${alDia ? 'al-dia' : cubierto ? 'por-acreditar' : pagar.vencido ? 'vencida' : e && e.fase === 'ultimo' ? 'ultimo-dia' : ''}" ${alDia || ajena || cubierto ? 'disabled' : 'data-a="pagar-expensas"'}>
      <span class="tp-arriba">
        <span class="tp-rotulo">${alDia ? 'Tu cuenta está al día' : cubierto ? 'Pago informado · por acreditar' : pagar.vencido ? 'Tenés un saldo vencido' : 'Tu expensa de este mes'}</span>
        ${alDia ? `<span class="tp-chip">${I('check')}Sin deuda</span>` : cubierto ? `<span class="tp-chip">${I('clock')}Por acreditar</span>` : `<span class="tp-chip">${I('wallet')}Pagar ahora</span>`}
      </span>
      <span class="tp-monto">${plata(Math.max(0, cuenta.saldo))}</span>
      ${pagar.periodo && !cuenta1 ? `<span class="tp-detalle">${nombrePeriodo(pagar.periodo)} · vence el ${fechaCorta(pagar.vto1)}${pagar.recargo ? ` · con recargo ${plata(pagar.total)}` : ''}</span>` : ''}
      ${cuenta1}
      ${cuenta.informado ? `<span class="tp-detalle">${I('clock')} ${plata(cuenta.informado)} por acreditar: la Administración está corroborando tu comprobante${cubierto ? '' : ` · te quedarían ${plata(cuenta.saldo - cuenta.informado)}`}</span>` : ''}
      ${!alDia && !ajena && !cubierto ? `<span class="tp-pie">${I('right')}Tocá para pagar: tarjeta, Mercado Pago, billeteras, QR o transferencia</span>` : ''}
    </button>
    ${!alDia && !ajena && !cubierto ? `<button class="btn btn-sec btn-block" style="margin:-4px 0 12px" data-a="informar-pago">${I('upload')}Ya pagué por fuera de la app · adjuntar comprobante</button>` : ''}

    ${L ? `<div class="card plana small" style="color:var(--ink-2)">${I('info')} ${esc(lote)} · UF ${L.uf} · coeficiente <b>${L.coef.toFixed(4)} %</b>. De cada $100 de gastos del barrio, a tu lote le corresponden $${L.coef.toFixed(2)}.</div>` : ''}
    ${sec('Tus cupones')}
    ${emitidas.length ? emitidas.slice(0, 12).map(l => { const cu = cuotaDe(l, lote); if (!cu) return '';
      return `<button class="superficie" data-a="ver-cupon" data-v="${l.periodo}" data-p="${esc(lote)}"><span class="ic ic-wood">${I('file')}</span>
        <span class="txt"><b>${nombrePeriodo(l.periodo)}</b><small>${plata(cu.total + (cu.interes || 0))} · 1º vto ${fechaCorta(vtoDe(l.periodo, 1))}</small></span>${I('right')}</button>`; }).join('')
      : vacio('file', 'Todavía no hay cupones emitidos.')}
    ${sec('Movimientos de tu cuenta')}
    <div class="card lista">${cuenta.movs.length ? cuenta.movs.slice().reverse().map(m => `<div class="it">
        <span class="ic ic-${m.debe ? 'wood' : m.pendiente ? 'warn' : 'ok'}" style="width:34px;height:34px;border-radius:11px;display:grid;place-items:center">${I(m.debe ? 'file' : 'wallet')}</span>
        <div class="txt"><b>${esc(m.detalle)}</b><span>${fechaCorta(isoDe(new Date(m.fecha)))}${m.pendiente ? ' · sin confirmar' : ''}</span></div>
        <b class="num" style="color:${m.debe ? 'var(--ink)' : 'var(--ok)'}">${m.debe ? plata(m.debe) : '− ' + plata(m.haber)}</b></div>`).join('')
      : '<p class="muted small" style="margin:6px 0">Sin movimientos.</p>'}</div>
    ${misRecibos.length ? sec('Tus recibos') + misRecibos.map(r => `<button class="superficie" data-a="ver-recibo" data-id="${r.id}"><span class="ic ic-ok">${I('check')}</span>
      <span class="txt"><b>Recibo Nº ${esc(r.numero)}</b><small>${plata(r.monto)} · ${fechaCorta(r.fecha)}</small></span>${I('right')}</button>`).join('') : ''}
    ${misPagos.some(p => p.estado === 'informado') ? sec('Pagos en camino') + misPagos.filter(p => p.estado === 'informado').map(p => `<div class="card" style="padding:12px 14px">
      <div class="row">${p.comp ? `<button class="comp-mini" data-a="ver-comprobante" data-id="${p.id}" ${p.foto && p.foto.mini ? `style="background-image:url('${p.foto.mini}')"` : ''} aria-label="Ver el comprobante">${p.foto && p.foto.mini ? '' : I('file')}</button>`
        : p.foto ? fotoHTML(p.foto, 'mini-foto') : `<span class="ic ic-${esPagoMP(p) ? 'sky' : 'warn'}" style="width:44px;height:44px;border-radius:12px;display:grid;place-items:center">${I(esPagoMP(p) ? 'wallet' : 'clock')}</span>`}
      <div class="grow"><b>${plata(p.monto)}</b> <span class="pill ${esPrueba(p) ? 'p-accent' : esPagoMP(p) ? 'p-sky' : 'p-warn'}">${esPrueba(p) ? 'prueba' : esPagoMP(p) ? 'aprobado' : 'por acreditar'}</span>
        <div class="muted small">${fechaCorta(p.fecha)} · ${esc(p.medio)} · ${esPrueba(p) ? 'pago de prueba: no cuenta para tu saldo' : esPagoMP(p) ? 'ya descontado de tu saldo; el recibo llega solo' : 'la Administración lo está corroborando con tu comprobante'}</div></div></div></div>`).join('') : ''}


    ${typeof proximasDelLote === 'function' ? proximasDelLote(lote) : ''}
    ${sec('Datos para transferir')}
    <div class="card lista">
      <div class="it"><div class="txt"><b>Alias</b><span>${esc(Store.s.config.alias || '—')}</span></div><button class="btn btn-xs btn-sec" data-a="copiar" data-v="${esc(Store.s.config.alias || '')}">${I('copy')}</button></div>
      <div class="it"><div class="txt"><b>CBU</b><span class="mono">${esc(Store.s.config.cbu || '—')}</span></div><button class="btn btn-xs btn-sec" data-a="copiar" data-v="${esc(Store.s.config.cbu || '')}">${I('copy')}</button></div>
      <div class="it"><div class="txt"><b>Titular</b><span>Barrio ${esc(Store.s.config.nombre)} · CUIT ${esc(Store.s.config.cuit || '')}</span></div></div></div>
    ${superficie({ a:'abrir', v:'privado', p:'admin', icon:'lock', color:'accent', t:'Consultar a la Administración', s:'Planes de pago, diferencias, dudas' })}
    <p class="muted tiny">El vencimiento se te recuerda solo: tres días antes, el día del primer vencimiento y si queda saldo impago.</p>`;
}
A['ver-cupon'] = el => { const lote = esAdmin() && el.dataset.p ? el.dataset.p : miLote(); imprimir(`Cupón ${nombrePeriodo(el.dataset.v)} · ${lote}`, cuponHTML(lote, el.dataset.v)); };
A['ver-recibo'] = el => { const r = Store.s.recibos.find(x => x.id === el.dataset.id); if (r) imprimir(`Recibo ${r.numero}`, reciboHTML(r)); };
/* =========================================================
   PAGAR LAS EXPENSAS
   -------------------------------------------------------
   Un solo lugar, con todos los caminos que existen de verdad. Qué se puede
   y qué no, dicho sin vueltas:

   · TRANSFERENCIA: alias, CBU, importe y referencia, cada uno con su botón
     de copiar. Es el que usa casi todo el mundo y no cuesta comisión.
   · MERCADO PAGO / MODO: se abre el enlace de cobro del barrio. Desde ahí
     el vecino paga con saldo, débito, crédito o la billetera que tenga.
     El enlace lo genera la Administración una vez (Contabilidad → Parámetros).
   · QR: el mismo enlace en código, para pagar desde otro equipo o para que
     lo escanee quien esté al lado.
   · EFECTIVO en la Administración, que sigue existiendo.

   Lo que NO se puede, y conviene saberlo: una página web no puede cobrar
   con la tarjeta apoyada en el teléfono (NFC). Eso lo hace la app del banco
   o de la billetera, no el navegador: para aceptar una tarjeta hace falta
   ser comercio adherido y cumplir la normativa de tarjetas. Lo que sí pasa
   es lo de arriba: el vecino toca "Mercado Pago" y paga con la tarjeta,
   la billetera o el NFC DENTRO de esa app, que es donde está permitido.
   ========================================================= */
A['pagar-expensas'] = () => {
  const c = cfgExp(), lote = miLote(), pagar = aPagar(lote), cfg = Store.s.config;
  const total = pagar.total || Math.max(0, saldoLote(lote));
  const ref = `Expensas ${nombrePeriodo(pagar.periodo || periodoHoy())} · ${lote}`;
  const medio = (icon, color, t, sub, attrs) => `<button class="medio-pago" ${attrs}>
    <span class="ic ic-${color}">${I(icon)}</span><span class="txt"><b>${t}</b><small>${sub}</small></span>${I('right')}</button>`;

  hoja('Pagar las expensas', `
    <div class="card plana center" style="margin-bottom:16px">
      <div class="muted small">Total a pagar${pagar.recargo ? ' (con recargo)' : ''}</div>
      <div style="font-size:34px;font-weight:800;letter-spacing:-1.4px;color:var(--wood)">${plata(total)}</div>
      ${pagar.periodo ? `<div class="muted small">${nombrePeriodo(pagar.periodo)} · ${lote}</div>` : ''}</div>

    ${sec('Elegí cómo')}
    ${MercadoPago.activo() ? medio('wallet', 'sky', 'Pagar online ahora', 'Tarjeta de crédito o débito, saldo de Mercado Pago o QR desde cualquier banco o billetera (MODO, Ualá, Brubank, Naranja X…) · se descuenta al instante y el recibo sale solo', `data-a="pago-mp"`) : ''}
    ${!MercadoPago.activo() && c.mpLink ? medio('wallet', 'sky', 'Mercado Pago', 'Saldo, débito, crédito o la billetera que uses', `data-a="pago-link" data-v="${esc(c.mpLink)}" data-t="Mercado Pago"`) : ''}
    ${c.modoLink ? medio('smartphone', 'accent', 'MODO', 'Pagás desde la app de tu banco', `data-a="pago-link" data-v="${esc(c.modoLink)}" data-t="MODO"`) : ''}
    ${medio('copy', 'brand', 'Transferencia', 'Alias, CBU e importe listos para copiar', `data-a="pago-transferencia"`)}
    ${medio('home', 'wood', 'Efectivo en la Administración', 'De lunes a viernes, en el horario de atención', `data-a="pago-efectivo"`)}
    ${(c.mpLink || c.modoLink) ? medio('qr', 'ok', 'Mostrar el QR', 'Para pagar desde otro equipo o que lo escanee alguien', `data-a="pago-qr" data-v="${esc(c.mpLink || c.modoLink)}"`) : ''}

    ${!c.mpLink && !c.modoLink && esAdmin() ? aviso('info', 'info', 'Todavía no hay enlace de cobro', 'Cargá el de Mercado Pago o MODO en Contabilidad → Parámetros y a los vecinos les aparece acá.',
      `<button class="btn btn-xs btn-sec" data-a="abrir" data-v="contabilidad" data-p="parametros">Cargarlo</button>`) : ''}

    ${sec('Si pagaste por fuera de la app')}
    ${medio('upload', 'ok', 'Ya pagué por fuera de la app', 'Adjuntás el comprobante (PDF, foto o captura): queda por acreditar y te llega el recibo', `data-a="informar-pago"`)}
    <p class="muted tiny" style="margin-top:12px">${MercadoPago.activo() ? 'Lo que pagás con "Pagar online ahora" se descuenta solo, con recibo: no hace falta avisarlo. Las transferencias, depósitos y el efectivo sí se avisan con el comprobante.' : 'Los pagos con Mercado Pago o MODO igual conviene avisarlos con el comprobante: así la Administración los corrobora y te emite el recibo enseguida.'}</p>`,

    { ancho:'520px' });
};
A['pago-link'] = el => {
  window.open(el.dataset.v, '_blank', 'noopener');
  /* Al volver, lo natural es informar el pago: se lo dejamos a mano. */
  setTimeout(() => hoja(`Pagaste con ${esc(el.dataset.t)}`, `
    ${aviso('info', 'clock', 'Se abrió la página de pago', 'Cuando termines, informá el pago acá y la Administración te emite el recibo.')}
    <button class="btn btn-pri btn-block btn-grande" data-a="informar-pago">${I('camera')}Ya pagué, informarlo</button>
    <button class="btn btn-sec btn-block" style="margin-top:8px" data-a="cerrar-hoja">Más tarde</button>`), 900);
};
A['pago-transferencia'] = () => {
  const cfg = Store.s.config, lote = miLote(), pagar = aPagar(lote);
  const total = pagar.total || Math.max(0, saldoLote(lote));
  const ref = `Expensas ${nombrePeriodo(pagar.periodo || periodoHoy())} ${lote}`;
  const fila = (t, v, copiar) => `<div class="it"><div class="txt"><b>${t}</b><span class="${t === 'CBU' ? 'mono' : ''}">${esc(v || '—')}</span></div>
    ${v ? `<button class="btn btn-xs btn-pri" data-a="copiar" data-v="${esc(v)}">${I('copy')}Copiar</button>` : ''}</div>`;
  hoja('Transferencia', `
    <p class="muted small" style="margin:0 0 12px">Copiá el alias en tu app del banco, pegá el importe y listo. No tiene comisión.</p>
    <div class="card lista">
      ${fila('Alias', cfg.alias)}
      ${fila('CBU', cfg.cbu)}
      ${fila('Importe', total.toFixed(2))}
      ${fila('Referencia', ref)}
      <div class="it"><div class="txt"><b>Titular</b><span>Barrio ${esc(cfg.nombre)} · CUIT ${esc(cfg.cuit || '')}</span></div></div>
    </div>
    <button class="btn btn-pri btn-block btn-grande" data-a="informar-pago">${I('camera')}Ya transferí, informarlo</button>
    <p class="muted tiny" style="margin-top:10px">Poné la referencia: es lo que permite identificar tu lote sin tener que preguntarte.</p>`);
};
A['pago-qr'] = el => {
  hoja('Pagá escaneando', `<div class="qr-pago" data-qr="${esc(el.dataset.v)}"></div>
    <p class="muted small center">Escanealo con la cámara o con tu billetera virtual.</p>
    <button class="btn btn-sec btn-block" style="margin-top:10px" data-a="copiar" data-v="${esc(el.dataset.v)}">${I('copy')}Copiar el enlace</button>`);
  setTimeout(() => { const el2 = $('[data-qr]'); if (el2) pintarQR(el2, el2.dataset.qr); }, 60);
};
A['pago-efectivo'] = () => {
  const cfg = Store.s.config, lote = miLote(), pagar = aPagar(lote);
  hoja('Efectivo en la Administración', `
    <div class="card plana center"><div class="muted small">Llevá</div>
      <div style="font-size:28px;font-weight:800;color:var(--wood)">${plata(pagar.total || Math.max(0, saldoLote(lote)))}</div>
      <div class="muted small">${esc(lote)}</div></div>
    <div class="card lista">
      <div class="it"><div class="txt"><b>Dónde</b><span>${esc(cfg.domicilio || '')}</span></div></div>
      <div class="it"><div class="txt"><b>Cuándo</b><span>Lunes a viernes, horario de atención</span></div></div>
      ${cfg.adminTel ? `<div class="it"><div class="txt"><b>Teléfono</b><span>${esc(cfg.adminTel)}</span></div>
        <a class="btn btn-xs btn-wa" href="${waLink(cfg.adminTel)}" target="_blank" rel="noopener">${I('phone')}</a></div>` : ''}
    </div>
    <p class="muted tiny">Pedí el recibo en el momento. También te va a quedar cargado en la app.</p>`);
};

/* =========================================================
   "YA PAGUÉ POR FUERA DE LA APP" (26-09-2026)
   El vecino que pagó por transferencia, en el banco, en efectivo o con
   cualquier billetera sin pasar por la app lo avisa desde su cupón y
   adjunta el comprobante (PDF, JPG, PNG, captura; hasta 3 MB). La app ya
   sabe de qué lote y de qué vecino viene. El pago queda POR ACREDITAR: el
   vecino deja de recibir recordatorios, y la Administración recibe el
   aviso con el comprobante para corroborarlo y confirmarlo (recibo) o
   rechazarlo (el saldo vuelve y al vecino le llega el motivo).

   Dónde queda el comprobante: en el equipo de quien lo subió y en
   pv/comprobantes/<vecino>/<id>, que solo leen ese vecino y la
   Administración. NO baja con el resto de los datos: se trae al tocar
   "Ver comprobante" (así la app no se hace pesada con los PDF de todos).
   ========================================================= */
/* LIVIANO (pedido de Claudio, 26-09): al registro del pago va solo una
   miniatura de 96 px (unos 3 KB), que es lo que viaja con los datos. El
   comprobante se guarda achicado (imagen de 1200 px en calidad media, que
   se lee bien y pesa ~150 KB; PDF de hasta 1,5 MB) y se BAJA SOLO en el
   equipo que toca "Ver comprobante". A los 30 días de confirmado o
   rechazado se borra de la base (índice staff/compIdx); quien lo necesite
   lo guarda en su equipo con "Guardar". */
const Comprobantes = {
  MAX: 1.5 * 1024 * 1024,
  enMano: new Map(),
  leerComoDato: file => new Promise((ok, mal) => { const r = new FileReader(); r.onload = () => ok(r.result); r.onerror = () => mal(new Error('No se pudo leer el archivo')); r.readAsDataURL(file); }),
  async leer(file){
    const nombre = String(file.name || 'comprobante').slice(0, 80);
    const esPdf = /pdf/i.test(file.type || '') || /\.pdf$/i.test(nombre);
    let d = '', tipo = 'img', mini = '';
    if (esPdf){
      if (file.size > this.MAX) throw new Error('El PDF pesa más de 1,5 MB. Mandá una captura de pantalla del comprobante.');
      d = await this.leerComoDato(file); tipo = 'pdf';
    } else {
      try { d = await comprimir(file, 1200, .68); mini = await achicarDato(d, 96, .55); }
      catch(e){
        /* Un formato que el navegador no sabe dibujar (HEIC en Android):
           viaja tal cual, si no pesa demasiado. */
        if (file.size > this.MAX) throw new Error('No se pudo leer esa imagen. Probá con una captura de pantalla.');
        d = await this.leerComoDato(file); tipo = 'archivo';
      }
    }
    const id = 'c' + uid();
    this.enMano.set(id, d);
    await Fotos.poner(id, d);
    return { id, tipo, nombre, kb:Math.max(1, Math.round(d.length * .75 / 1024)), mini };
  },
  async subir(comp, dueno){
    if (typeof Nube === 'undefined' || !Nube.activa() || !Nube.db) return true;
    const d = this.enMano.get(comp.id) || await Fotos.sacar(comp.id, false); if (!d) return false;
    try { await Nube.db.ref(`pv/comprobantes/${dueno}/${comp.id}`).set({ d, tipo:comp.tipo, nombre:comp.nombre, at:Date.now(), vence:Date.now() + 400 * DIA }); return true; }
    catch(e){ console.warn('No se pudo subir el comprobante (¿faltan publicar las reglas?)', e.message); return false; }
  },
  /* Confirmado o rechazado el pago: el comprobante queda 30 días más en la
     base y después se borra solo (lo hace la app de la Administración). */
  vencer(p){
    if (!p || !p.comp || typeof Nube === 'undefined' || !Nube.activa() || !Nube.db) return;
    Nube.db.ref('staff/compIdx/' + p.comp.id).set({ de:p.comp.de || p.userId, vence:Date.now() + 30 * DIA }).catch(e => console.warn('Índice de comprobantes', e.message));
  },
  async limpiar(){
    if (typeof Nube === 'undefined' || !Nube.activa() || !Nube.db || !esAdmin()) return;
    try {
      const idx = (await Nube.db.ref('staff/compIdx').get()).val() || {}, ahora = Date.now(), borrar = {};
      Object.entries(idx).forEach(([id, x]) => { if (x && x.vence < ahora){ borrar[`pv/comprobantes/${x.de}/${id}`] = null; borrar['staff/compIdx/' + id] = null; } });
      if (Object.keys(borrar).length) await Nube.db.ref().update(borrar);
    } catch(e){ console.warn('No se pudieron limpiar los comprobantes viejos', e.message); }
  },
  async traer(p){

    if (!p || !p.comp) return null;
    const local = this.enMano.get(p.comp.id) || await Fotos.sacar(p.comp.id, false); if (local) return local;
    if (typeof Nube === 'undefined' || !Nube.activa() || !Nube.db) return null;
    try { const v = (await Nube.db.ref(`pv/comprobantes/${p.comp.de || p.userId}/${p.comp.id}`).get()).val(); return v && typeof v.d === 'string' ? v.d : null; }
    catch(e){ console.warn('No se pudo traer el comprobante', e.message); return null; }
  },
};
/* El campo para adjuntarlo: toma PDF, fotos y capturas. */
const campoComprobante = () => `<div class="field"><label>Comprobante <span class="muted small">(PDF, JPG, PNG o captura · obligatorio salvo efectivo)</span></label>
  <label class="comp-in" id="compPagoCaja">${I('upload')}<span><b>Adjuntar el comprobante</b><small>Tocá para elegir el archivo o sacarle una foto</small></span>
    <input type="file" accept="image/*,application/pdf,.pdf,.heic,.heif" data-comp-in="compPago" hidden></label>
  <input type="hidden" name="comp" id="compPago"></div>`;
document.addEventListener('change', async e => {
  const inp = e.target.closest('input[type=file][data-comp-in]'); if (!inp || !inp.files[0]) return;
  const caja = document.getElementById('compPagoCaja'), destino = document.getElementById(inp.dataset.compIn);
  try {
    toast('Preparando el comprobante…', 'upload');
    const c = await Comprobantes.leer(inp.files[0]);
    destino.value = JSON.stringify(c);
    if (caja){ caja.classList.add('lleno'); const t = caja.querySelector('span'); if (t) t.innerHTML = `<b>${esc(c.nombre)}</b><small>${c.tipo === 'pdf' ? 'PDF' : 'Imagen'} · ${c.kb} KB · tocá para cambiarlo</small>`;
      if (c.mini) caja.style.setProperty('--comp-mini', `url('${c.mini}')`); }
    toast('Comprobante listo', 'check');
  } catch(err){ inp.value = ''; toast(err.message || 'No se pudo leer el archivo', 'alert'); }
});
A['informar-pago'] = () => {
  const lote = miLote(), cuenta = cuentaLote(lote), pagar = aPagar(lote);
  const debe = Math.max(0, cuenta.saldo - cuenta.informado);
  const monto = pagar.recargo && debe ? conCentavosDelLote(debe * (1 + cfgExp().recargo2 / 100), lote).total : debe;
  hoja('Ya pagué por fuera de la app', `<form data-f="informar-pago">
    <p class="muted small" style="margin-top:0">Avisale a la Administración que pagaste por transferencia, en el banco, en efectivo o con otra billetera. Queda <b>por acreditar</b> hasta que lo corroboren con el comprobante; después te llega el recibo.</p>
    <div class="card plana small" style="margin-bottom:12px">${I('home')} <b>${esc(lote)}</b> · ${esc(yo().nombre)}${pagar.periodo ? ` · expensas de ${nombrePeriodo(pagar.periodo)}` : ''}</div>
    <div class="grid2"><div class="field"><label>Importe que pagaste</label><input name="monto" type="number" step="0.01" min="1" required value="${(monto || 0).toFixed(2)}"></div>
      <div class="field"><label>Fecha del pago</label><input type="date" name="fecha" required max="${hoyISO()}" value="${hoyISO()}"></div></div>
    <div class="field"><label>Cómo pagaste</label><select name="medio"><option>Transferencia bancaria</option><option>Transferencia desde billetera (MODO, Ualá, Brubank, Mercado Pago…)</option><option>Depósito en el banco</option><option>Efectivo en la Administración</option><option>Otro</option></select></div>
    ${campoComprobante()}
    <div class="field"><label>Nota (opcional)</label><input name="nota" maxlength="120" placeholder="Ej: pago parcial, o a cuenta del plan"></div>
    <button class="btn btn-pri btn-block btn-grande">${I('send')}Enviar a la Administración</button></form>`);
};
F['informar-pago'] = async d => {
  const u = yo(), lote = miLote(), monto = Math.round(+d.monto * 100) / 100;
  let comp = null; try { comp = d.comp ? JSON.parse(d.comp) : null; } catch(e){}
  if (!comp && !/efectivo/i.test(d.medio)){ toast('Adjuntá el comprobante: es lo que la Administración necesita para acreditarlo', 'alert'); return; }
  if (!(monto > 0)){ toast('Poné el importe que pagaste', 'alert'); return; }
  const id = uid();
  let subido = true;
  if (comp){ toast('Enviando el comprobante…', 'upload'); subido = await Comprobantes.subir(comp, u.id); }
  Store.cambiar(s => {
    s.pagos.unshift({ id, lote, userId:u.id, monto, fecha:d.fecha, medio:d.medio, nota:(d.nota || '').trim(),
      comp: comp ? { id:comp.id, tipo:comp.tipo, nombre:comp.nombre, kb:comp.kb, de:u.id, subido } : null, foto: comp && comp.mini ? { mini:comp.mini } : null,
      estado:'informado', at:Date.now() });
    notificar(s, { para:'rol:admin', titulo:`Pago por fuera de la app · ${lote}`, texto:`${plata(monto)} · ${d.medio} · ya figura por acreditar: corroboralo con el comprobante`, icon:'wallet', color:'wood', link:'cobranzas:cobranzas', sonido:true });
    auditar(s, 'Informó un pago por fuera de la app', `${lote} · ${plata(monto)} · ${d.medio}${comp ? ' · con comprobante' : ''}`);
  });
  cerrarHoja();
  toast(subido ? 'Listo: la Administración ya tiene tu comprobante. Queda por acreditar.' : 'Pago informado. El comprobante quedó en tu equipo: no se pudo subir, avisale a la Administración.', subido ? 'check' : 'alert');
};
A['ver-comprobante'] = async el => {
  const p = Store.s.pagos.find(x => x.id === el.dataset.id); if (!p) return;
  if (!p.comp){ if (p.foto && p.foto.fotoId) return A['ver-foto']({ dataset:{ foto:p.foto.fotoId } }); return toast('Este pago no tiene comprobante adjunto', 'info'); }
  toast('Trayendo el comprobante…', 'download');
  const d = await Comprobantes.traer(p);
  if (!d) return toast('No se encontró el comprobante (si es nuevo, falta publicar las reglas de Firebase)', 'alert');
  const nombre = (p.comp.nombre || 'comprobante').replace(/[^\w.\- ]+/g, '_');
  const url = URL.createObjectURL(await (await fetch(d)).blob());
  hoja(`Comprobante · ${esc(p.lote)}`, `${d.startsWith('data:image') ? `<img src="${d}" alt="Comprobante" style="width:100%;border-radius:14px;border:1px solid var(--line)">`
      : `<div class="card plana center">${I('file')}<b style="display:block;margin-top:6px">${esc(p.comp.nombre || 'Comprobante')}</b><span class="muted small">${p.comp.kb || ''} KB</span></div>`}
    <div class="card plana small" style="margin-top:10px">${plata(p.monto)} · ${esc(p.medio)} · ${fechaCorta(p.fecha)} · informó ${esc(nombreDe(p.userId))}</div>
    <div class="btns" style="margin-top:10px"><a class="btn btn-pri grow" href="${url}" target="_blank" rel="noopener">${I('eye')}Abrir</a><a class="btn btn-sec grow" href="${url}" download="${esc(nombre)}">${I('download')}Guardar</a></div>
    ${esAdmin() && p.estado === 'informado' ? `<div class="btns" style="margin-top:8px"><button class="btn btn-ok grow" data-a="confirmar-pago" data-id="${p.id}">${I('check')}Confirmar y emitir recibo</button><button class="btn btn-danger-soft" data-a="rechazar-pago" data-id="${p.id}">Rechazar</button></div>` : ''}`, { ancho:'620px' });
};


/* =========================================================
   VENTANA DE LA ADMINISTRACIÓN
   ========================================================= */
/* =========================================================
   DOS VENTANAS DISTINTAS, A PROPÓSITO
   -------------------------------------------------------
   CONTABILIDAD es lo que mira el contador: los gastos del mes, el cierre
   que los reparte entre los lotes y lo que hay que presentar ante ARCA.
   EXPENSAS Y COBRANZAS es lo que mira la Administración todos los días:
   los cupones emitidos, quién pagó, quién debe y los recibos.
   Antes estaba todo mezclado en una sola pestañera y no se sabía dónde
   terminaba una cosa y empezaba la otra.
   ========================================================= */
const TABS_CONTA = [['resumen','Resumen'],['gastos','Gastos del mes'],['cierre','Cierre de mes'],['impositivo','ARCA'],['parametros','Parámetros']];
R.contabilidad = {
  titulo: 'Contabilidad', icon: 'file', color: 'brand', ancha: true, sub: 'Gastos, libro contable, carpeta del contador, cierre e impositivo',
  render(p){
    if (!esAdmin()) return vacio('lock', 'Solo para la Administración.');
    const [tab, sub] = String(p || 'resumen').split('|');
    return `<div class="tabs-in">${TABS_CONTA.map(([k, t]) => `<button class="${k === tab ? 'on' : ''}" data-a="abrir" data-v="contabilidad" data-p="${k}">${t}</button>`).join('')}</div>
      ${(CONTA[tab] || CONTA.resumen)(sub)}`;
  },
};

const TABS_COBRO = [['plan','Automáticas'],['resumen','Resumen'],['cupones','Cupones'],['cobranzas','Pagos'],['morosos','Morosos'],['recibos','Recibos']];
R.cobranzas = {
  titulo: 'Expensas', icon: 'wallet', color: 'wood', ancha: true, sub: 'Automáticas, cupones, pagos, morosos y recibos',
  render(p){
    if (!esAdmin()) return vacio('lock', 'Solo para la Administración.');
    const [tab, sub] = String(p || 'plan').split('|');
    const pend = Store.s.pagos.filter(porAcreditar).length;
    return `<div class="tabs-in">${TABS_COBRO.map(([k, t]) => `<button class="${k === tab ? 'on' : ''}" data-a="abrir" data-v="cobranzas" data-p="${k}">${t}${k === 'cobranzas' && pend ? `<span class="dot-badge">${pend}</span>` : ''}</button>`).join('')}</div>
      ${(COBRO[tab] || COBRO.resumen)(sub)}`;
  },
};
const CONTA = {
  resumen(){
    const per = periodoHoy(), calc = calcularLiquidacion(per), ant = liquidacionDe(periodoAnterior(per));
    const emitida = liquidacionDe(per)?.estado === 'emitida';
    return `<div class="admin-hero" style="background:var(--g-brand)">
        <b style="font-size:18px">${nombrePeriodo(per)}</b>
        <div class="small" style="opacity:.85">${emitida ? 'Mes cerrado y liquidado' : `Borrador · ${plural(calc.gastos, 'gasto cargado', 'gastos cargados')}`}</div>
        <div class="garita-kpis"><div class="kpi"><b>${plataCorta(calc.totalGastos)}</b><span>Gastos del mes</span></div>
          <div class="kpi"><b>${calc.gastos}</b><span>Comprobantes</span></div>
          <div class="kpi"><b>${LOTES.length}</b><span>Lotes a prorratear</span></div></div></div>
      ${ant ? `<div class="card plana small">Mes anterior (${nombrePeriodo(ant.periodo)}): ${plata(ant.totalGastos)} · variación ${(((calc.totalGastos - ant.totalGastos) / (ant.totalGastos || 1)) * 100).toFixed(1)} %</div>` : ''}
      ${typeof cfgPlan === 'function' ? (cfgPlan().base
        ? superficie({ a:'abrir', v:'cobranzas', p:'plan', icon:'zap', color:'wood', t:`Expensas automáticas: ${nombrePeriodo(per)} estimado en ${plata(mesPlan(per).total)}`, s:'El año desarrollado mes a mes desde la última liquidación', cls:'acento' })
        : superficie({ a:'abrir', v:'cobranzas', p:'plan', icon:'zap', color:'wood', t:'Activar las expensas automáticas', s:'Traer una vez la liquidación de agosto y la app desarrolla sola los meses siguientes', cls:'acento' })) : ''}
      ${sec('El mes, paso a paso')}
      <ol class="pasos-mes">
        <li class="${calc.gastos ? 'hecho' : ''}"><b>Cargar los gastos</b> <span>${calc.gastos ? plural(calc.gastos, 'comprobante') : 'pestaña Gastos del mes'}</span></li>
        <li class="${emitida ? 'hecho' : ''}"><b>Cerrar el mes y emitir los cupones</b> <span>${emitida ? 'hecho' : 'pestaña Cierre de mes'}</span></li>
        <li><b>Cobrar</b> <span>en Gestión → Expensas</span></li>
        <li><b>Presentar en ARCA</b> <span>pestaña ARCA</span></li>
      </ol>
      ${sec('Para el contador')}
      ${superficie({ a:'exportar-contable', icon:'download', color:'sky', t:'Planilla del mes (CSV)', s:'Comprobantes, rubros, IVA y retenciones' })}
      ${superficie({ a:'mandar-contador', icon:'mail', color:'accent', t:'Avisarle al contador', s: cfgExp().contador || 'Todavía no hay correo cargado' })}
      ${sec('Últimas liquidaciones')}
      ${liquidacionesEmitidas().slice().reverse().slice(0, 6).map(l => `<button class="superficie" data-a="ver-liquidacion" data-v="${l.periodo}">
        <span class="ic ic-wood">${I('file')}</span><span class="txt"><b>${nombrePeriodo(l.periodo)}</b>
        <small>${plata(l.totalGastos)} en gastos · ${plural(l.cuotas.length, 'cupón', 'cupones')} · emitida ${hace(l.emitidaAt)}</small></span>${I('right')}</button>`).join('') || vacio('file', 'Todavía no cerraste ningún mes.')}`;
  },

  gastos(per){
    const periodo = /^\d{4}-\d{2}$/.test(per || '') ? per : periodoHoy();
    const gs = gastosDe(periodo).sort((a, b) => (a.rubro - b.rubro) || a.proveedor.localeCompare(b.proveedor));
    const total = gs.reduce((a, g) => a + (+g.total || 0), 0);
    const emitida = liquidacionDe(periodo)?.estado === 'emitida';
    const meses = [...new Set([periodoHoy(), periodoAnterior(periodoHoy()), ...Store.s.gastos.map(g => g.periodo), ...Store.s.liquidaciones.map(l => l.periodo)])].sort().reverse();
    /* LOS GASTOS DEL MES ANTERIOR APARECEN SOLOS (pedido de Claudio, 26-09)
       En un mes sin cerrar se ven, además de lo cargado, los gastos que se
       repiten del último mes liquidado, con su importe ya actualizado (o
       con el precio nuevo que se haya puesto). Cada uno se edita con el
       lápiz, se confirma tal cual o se saca de este mes. No se graban solos
       en la base (así dos equipos abiertos no los duplican): se graban al
       tocarlos, o todos juntos con "Pasar todos". */
    const faltan = !emitida && typeof pendientesDelMes === 'function' ? pendientesDelMes(periodo) : [];
    const tpl = typeof plantillaPlan === 'function' ? plantillaPlan() : null;
    const totalFaltan = faltan.reduce((a, g) => a + g.monto, 0);
    const bloqueFaltan = faltan.length ? `<section class="gm-anterior">
        <header><span class="ic ic-sky">${I('refresh')}</span><div><b>${plural(faltan.length, 'gasto', 'gastos')} de ${nombrePeriodo(tpl.periodo)} para revisar</b>
          <small>Son los que se repiten todos los meses. Tocá el lápiz para cambiar el importe (por ejemplo, si el camión pasó de $10 a $12) o confirmalos tal cual.</small></div>
          <b class="num">${plata(totalFaltan)}</b></header>
        ${faltan.slice().sort((a, b) => (a.rubro - b.rubro) || (b.monto - a.monto)).map(g => { const k = claveGasto(g);
          return `<div class="gm-fila"><div class="grow"><b>${esc(g.proveedor)}</b> <span class="pill p-sky">del mes anterior</span>
              <div class="muted small">${esc(String(g.detalle || '').replace(/\s*\(estimado\)/i, '')) || esc(RUBROS[g.rubro] || '')}${g.nota ? ' · ' + esc(g.nota) : ''}</div>
              <div class="muted tiny">En ${nombrePeriodo(tpl.periodo)}: ${plata(+g.total || 0)}</div></div>
            <div class="gm-der"><b class="num">${plata(g.monto)}</b>
              <div class="btns"><button class="icon-btn" data-a="gasto-plan-editar" data-v="${esc(k)}" data-p="${periodo}" aria-label="Editar el importe">${I('edit')}</button>
                <button class="icon-btn" data-a="gasto-plan-ok" data-v="${esc(k)}" data-p="${periodo}" aria-label="Confirmar tal cual">${I('check')}</button>
                <button class="icon-btn" data-a="gasto-plan-no" data-v="${esc(k)}" data-p="${periodo}" aria-label="Este mes no va">${I('x')}</button></div></div></div>`; }).join('')}
        <div class="btns" style="margin-top:10px"><button class="btn btn-sm btn-sec" data-a="plan-completar" data-v="${periodo}">${I('zap')}Pasar todos a ${nombrePeriodo(periodo)} como estimados</button></div></section>`
      : !emitida && !tpl ? `<p class="muted small">${I('info')} Para que acá aparezcan solos los gastos del mes anterior, traé la liquidación base en Expensas → Automáticas.</p>` : '';
    return `<div class="chips">${meses.map(m => `<button class="chip ${m === periodo ? 'on' : ''}" data-a="abrir" data-v="contabilidad" data-p="gastos|${m}">${nombrePeriodo(m)}</button>`).join('')}</div>
      ${emitida ? aviso('warn', 'lock', 'Este período ya fue liquidado', 'Si cargás o cambiás un gasto, hay que volver a cerrar el mes.') : ''}
      ${superficie({ a:'nuevo-gasto', v:periodo, icon:'plus', t:'Cargar un gasto nuevo', s:'Factura, recibo o pago de servicio que no estaba el mes anterior', cls:'acento' })}
      <div class="card"><div class="row" style="justify-content:space-between"><b>Total del período</b><b class="num" style="font-size:18px">${plata(total + totalFaltan)}</b></div>
        <div class="muted small">${plural(gs.length, 'comprobante cargado', 'comprobantes cargados')}${faltan.length ? ` · ${plata(total)} cargados + ${plata(totalFaltan)} del mes anterior sin revisar` : ''}</div></div>
      ${bloqueFaltan}
      ${Object.keys(RUBROS).filter(r => gs.some(g => +g.rubro === +r)).map(r => {
        const del = gs.filter(g => +g.rubro === +r), sub = del.reduce((a, g) => a + (+g.total || 0), 0);
        return `${sec(`${r} · ${RUBROS[r]}`, `<span class="muted small">${plata(sub)} · ${(sub / (total || 1) * 100).toFixed(1)} %</span>`)}
          ${del.map(g => `<div class="card" style="padding:12px 14px"><div class="row" style="align-items:flex-start">
            ${g.foto ? fotoHTML(g.foto, 'mini-foto') : `<span class="ic ic-wood" style="width:44px;height:44px;border-radius:12px;display:grid;place-items:center;flex:none">${I('file')}</span>`}
            <div class="grow"><b>${esc(g.proveedor)}</b>${g.estimado ? ' <span class="pill p-warn">estimado</span>' : g.importado ? ' <span class="pill">de Octavo Piso</span>' : ''}<div class="muted small">${esc(g.tipoComp || '')} ${esc(g.nroComp || '')}${g.cuit ? ' · CUIT ' + esc(g.cuit) : ''}</div>
              <div class="muted small">${esc(COLUMNAS[g.columna])}${g.lote ? ' · ' + esc(g.lote) : ''}${g.cuotaN ? ` · pago ${g.cuotaN} de ${g.cuotaDe}` : ''}${g.retGan ? ' · ret. Gan. ' + plata(g.retGan) : ''}${g.retSuss ? ' · ret. SUSS ' + plata(g.retSuss) : ''}</div></div>
            <div style="text-align:right"><b class="num">${plata(g.total)}</b>
              <div class="btns" style="margin-top:6px;justify-content:flex-end"><button class="icon-btn" data-a="editar-gasto" data-id="${g.id}" aria-label="Editar">${I('edit')}</button>
                <button class="icon-btn" data-a="borrar-gasto" data-id="${g.id}" aria-label="Borrar">${I('trash')}</button></div></div></div></div>`).join('')}`;
      }).join('') || (faltan.length ? '' : vacio('file', 'No hay gastos cargados en este período.'))}`;
  },

  cierre(per){
    const periodo = /^\d{4}-\d{2}$/.test(per || '') ? per : periodoHoy();
    const l = liquidacionDe(periodo), calc = calcularLiquidacion(periodo);
    const c = cfgExp();
    if (l && l.estado === 'emitida') return `${aviso('ok', 'check', `${nombrePeriodo(periodo)} ya está liquidado`, `Emitida ${hace(l.emitidaAt)} por ${esc(nombreDe(l.por))} · ${plural(l.cuotas.length, 'cupón', 'cupones')}`)}
      ${superficie({ a:'ver-liquidacion', v:periodo, icon:'file', color:'wood', t:'Ver la liquidación', s:'Formato completo, para imprimir o guardar en PDF' })}
      ${superficie({ a:'mandar-cupones', v:periodo, icon:'mail', color:'sky', t:'Reenviar los cupones por correo', s:'A cada propietario con correo cargado' })}
      ${superficie({ a:'reabrir-liquidacion', v:periodo, icon:'refresh', color:'danger', t:'Reabrir el período', s:'Si hay que corregir un gasto', cls:'peligro' })}`;
    const vencido = m => `${fechaCorta(vtoDe(periodo, m))}`;
    return `<div class="card"><b style="font-size:16px">Cerrar ${nombrePeriodo(periodo)}</b>
        <p class="small" style="color:var(--ink-2);margin:6px 0 0">Se reparten los gastos del mes entre los ${LOTES.length} lotes según su coeficiente, se suma el Fondo de Infraestructura de ${plata(c.fondoFijo)} por lote, los gastos particulares, las multas firmes y los intereses del saldo impago.</p>
        <div class="lista" style="margin-top:10px">
          ${Object.entries(COLUMNAS).map(([k, t]) => `<div class="it"><div class="txt"><b>${t}</b></div><b class="num">${plata(calc.porColumna[k] || 0)}</b></div>`).join('')}
          <div class="it"><div class="txt"><b>Total de gastos</b><span>${plural(calc.gastos, 'comprobante')}</span></div><b class="num">${plata(calc.totalGastos)}</b></div>
          <div class="it"><div class="txt"><b>Fondo de Infraestructura</b><span>${LOTES.length} lotes × ${plata(c.fondoFijo)}</span></div><b class="num">${plata(c.fondoFijo * LOTES.length)}</b></div>
          ${calc.multasFirmes ? `<div class="it"><div class="txt"><b>Multas firmes a imputar</b><span>${plural(calc.multasFirmes, 'lote')}</span></div></div>` : ''}
          <div class="it"><div class="txt"><b>Total a prorratear</b><span>1º vto ${vencido(1)} · 2º vto ${vencido(2)} (+${c.recargo2} %)</span></div><b class="num" style="font-size:17px">${plata(calc.totalCuotas)}</b></div>
        </div></div>
      ${calc.gastos === 0 ? aviso('warn', 'alert', 'No hay gastos cargados', 'Cargalos en la pestaña Gastos antes de cerrar.') : ''}
      ${(() => { const f = typeof pendientesDelMes === 'function' ? pendientesDelMes(periodo) : []; return f.length ? aviso('warn', 'refresh', `Faltan ${plural(f.length, 'gasto', 'gastos')} del mes anterior (${plata(f.reduce((a, g) => a + g.monto, 0))})`,
        'Todavía no están en este mes, así que no entran en el cierre. Revisalos en Gastos del mes, o pasalos todos como estimados.',
        `<button class="btn btn-xs btn-sec" data-a="abrir" data-v="contabilidad" data-p="gastos|${periodo}">Revisarlos</button><button class="btn btn-xs btn-pri" data-a="plan-completar" data-v="${periodo}">Pasar todos</button>`) : ''; })()}
      ${sec('Cómo queda cada lote', `<button class="link" data-a="previsualizar" data-v="${periodo}">Ver las ${calc.cuotas.length} cuotas</button>`)}
      <div class="card lista">${calc.cuotas.slice(0, 6).map(c2 => `<div class="it"><div class="txt"><b>${esc(c2.lote)}</b><span>coef. ${c2.coef.toFixed(4)} %${c2.interes ? ' · interés ' + plata(c2.interes) : ''}</span></div><b class="num">${plata(c2.total)}</b></div>`).join('')}
        <div class="it"><div class="txt"><span class="muted small">y ${calc.cuotas.length - 6} lotes más…</span></div></div></div>
      <button class="btn btn-pri btn-block btn-grande" data-a="emitir-liquidacion" data-v="${periodo}" ${calc.gastos === 0 ? 'disabled' : ''}>${I('check')}Emitir la liquidación y los cupones</button>
      <p class="muted tiny" style="margin-top:8px">Al emitir, cada vecino recibe su cupón en la app y un aviso. Si tenés el correo configurado, también le llega por mail.</p>`;
  },

  impositivo(per){
    const periodo = /^\d{4}-\d{2}$/.test(per || '') ? per : periodoAnterior(periodoHoy());
    const c = cfgExp(), gs = gastosDe(periodo);
    const retGan = gs.reduce((a, g) => a + (+g.retGan || 0), 0), retSuss = gs.reduce((a, g) => a + (+g.retSuss || 0), 0);
    const conIVA = gs.filter(g => +g.iva > 0);
    const presentaciones = presentacionesDe(periodo);
    return `<div class="card"><b style="font-size:16px">Situación fiscal del barrio</b>
        <div class="lista"><div class="it"><div class="txt"><b>CUIT</b><span>${esc(Store.s.config.cuit || '—')}</span></div></div>
          <div class="it"><div class="txt"><b>Condición</b><span>${esc(c.condicion)}</span></div></div>
          <div class="it"><div class="txt"><b>Ingresos Brutos</b><span>${esc(c.iibb || 'sin número cargado')}</span></div></div>
          <div class="it"><div class="txt"><b>Personal propio</b><span>${c.empleados ? 'Sí: corresponde F.931 mensual' : 'No: los servicios son tercerizados'}</span></div></div>
          <div class="it"><div class="txt"><b>Contador</b><span>${esc(c.contador || 'sin correo cargado')}</span></div>
            <button class="btn btn-xs btn-sec" data-a="abrir" data-v="contabilidad" data-p="parametros">${I('edit')}</button></div></div></div>
      <div class="chips">${[periodoAnterior(periodoHoy()), periodoHoy(), periodoAnterior(periodoAnterior(periodoHoy()))].sort().reverse().map(m => `<button class="chip ${m === periodo ? 'on' : ''}" data-a="abrir" data-v="contabilidad" data-p="impositivo|${m}">${nombrePeriodo(m)}</button>`).join('')}</div>
      ${sec('Lo que hay que presentar')}
      ${presentaciones.map(p => `<div class="card" style="padding:13px 14px"><div class="row">
        <span class="ic ic-${p.estado === 'presentado' ? 'ok' : p.vencido ? 'danger' : 'accent'}" style="width:38px;height:38px;border-radius:12px;display:grid;place-items:center">${I(p.estado === 'presentado' ? 'check' : 'clipboard')}</span>
        <div class="grow"><b>${esc(p.nombre)}</b><div class="muted small">${esc(p.detalle)}</div>
          <div class="muted small">Vence ${fechaCorta(p.vence)}${p.estado === 'presentado' ? ` · presentado ${fechaCorta(p.presentadoEl)}` : p.vencido ? ' · vencido' : ''}</div></div>
        ${p.estado === 'presentado' ? `<span class="pill p-ok">Listo</span>` : `<button class="btn btn-xs btn-ok" data-a="marcar-presentado" data-v="${p.id}" data-p="${periodo}">Marcar</button>`}</div></div>`).join('')}
      ${sec('Libro de gastos del período')}
      <div class="card"><div class="lista">
        <div class="it"><div class="txt"><b>Comprobantes</b><span>${plural(gs.length, 'gasto')}</span></div><b class="num">${plata(gs.reduce((a, g) => a + (+g.total || 0), 0))}</b></div>
        <div class="it"><div class="txt"><b>Con IVA discriminado</b><span>${plural(conIVA.length, 'comprobante')}</span></div><b class="num">${plata(conIVA.reduce((a, g) => a + (+g.iva || 0), 0))}</b></div>
        <div class="it"><div class="txt"><b>Retenciones de Ganancias</b><span>RG 830 · para el SIRE</span></div><b class="num">${plata(retGan)}</b></div>
        <div class="it"><div class="txt"><b>Retenciones de Seguridad Social</b><span>Contratistas de obra</span></div><b class="num">${plata(retSuss)}</b></div></div>
        <div class="btns" style="margin-top:12px">
          <button class="btn btn-sm btn-pri" data-a="exportar-contable" data-v="${periodo}">${I('download')}Planilla para el contador (CSV)</button>
          <button class="btn btn-sm btn-sec" data-a="mandar-contador" data-v="${periodo}">${I('mail')}Avisarle al contador</button></div></div>
      ${aviso('info', 'info', 'Esto no reemplaza al contador', 'La app junta y ordena los comprobantes, calcula las retenciones y avisa los vencimientos. Qué corresponde presentar cada mes lo define tu contador: confirmá con él la lista de arriba.')}`;
  },

  /* Los números con los que se arma cada cupón. Vivían en Ajustes, entre el
     teléfono de la garita y los días de recolección: no es su lugar. */
  parametros(){
    const c = Store.s.config, e = cfgExp();
    return `<p class="muted small" style="margin-top:0">Con esto la app arma cada cupón. Cambiarlo afecta a las liquidaciones que se emitan de acá en adelante, no a las ya emitidas.</p>
      <form data-f="parametros-exp">
      <div class="card"><h3>Vencimientos y recargos</h3><div class="grid3">
        <div class="field"><label>1º vencimiento (día)</label><input name="vto1" type="number" min="1" max="28" value="${e.vto1 ?? 10}"></div>
        <div class="field"><label>2º vencimiento (día)</label><input name="vto2" type="number" min="1" max="28" value="${e.vto2 ?? 21}"></div>
        <div class="field"><label>Recargo 2º vto (%)</label><input name="recargo2" type="number" step="0.1" value="${e.recargo2 ?? 1.5}"></div></div>
        <div class="grid2"><div class="field"><label>Interés mensual por mora (%)</label><input name="interesMensual" type="number" step="0.1" value="${e.interesMensual ?? 3}"><div class="ayuda">Confirmalo con la administración antes de emitir.</div></div>
          <div class="field"><label>Fondo de Infraestructura por lote</label><input name="fondoFijo" type="number" step="100" value="${e.fondoFijo ?? 5000}"></div></div></div>
      ${(() => { const pl = typeof cfgPlan === 'function' ? cfgPlan() : {}, ipc = pl.ipc;
        return `<div class="card"><h3>Pago fuera de término</h3>
        <p class="muted small" style="margin-top:0">Lo que queda impago después del 2º vencimiento se ajusta en la expensa del mes siguiente. A quien no pagó ni avisó que pagó, la app le manda un correo al día siguiente del 2º vencimiento avisándole este ajuste.</p>
        <div class="seg" style="flex-wrap:wrap">${[['ipc','Ajuste por inflación (IPC del INDEC)'],['ipc+interes','Inflación + interés'],['interes','Interés fijo']].map(([k, t]) => `<label><input type="radio" name="metodoDeuda" value="${k}" ${(pl.metodoDeuda || 'interes') === k ? 'checked' : ''}><span>${t}</span></label>`).join('')}</div>
        <div class="card plana small" style="margin:10px 0 0">${I('info')} ${ipc ? `IPC de <b>${nombrePeriodo(ipc.mes)}</b>: <b>${ipc.pct.toLocaleString('es-AR')} % mensual</b> (INDEC, traído ${hace(ipc.at)}). Se actualiza solo cada tres días.` : 'Todavía no se trajo el IPC del INDEC.'}
          <div class="btns" style="margin-top:8px"><button type="button" class="btn btn-xs btn-sec" data-a="ipc-traer">${I('refresh')}Traer el IPC ahora</button></div></div>
        <div class="muted small" style="margin-top:8px">Hoy se aplica: <b>${esc(textoMora())}</b>. Confirmá la regla con el reglamento del barrio antes de emitir.</div></div>`; })()}
      <div class="card"><h3>Dónde pagan los vecinos</h3>
        <div class="grid2"><div class="field"><label>Alias</label><input name="alias" value="${esc(c.alias || '')}"></div>
          <div class="field"><label>CBU</label><input name="cbu" value="${esc(c.cbu || '')}"></div></div>
        <div class="field"><label>Cuenta</label><input name="cuenta" value="${esc(c.cuenta || '')}"></div>
        <div class="grid2"><div class="field"><label>Enlace de cobro de Mercado Pago</label><input name="mpLink" type="url" value="${esc(e.mpLink || '')}" placeholder="https://mpago.la/...">
          <div class="ayuda">Se crea una vez en Mercado Pago → Cobrar → Link de pago. Los vecinos pagan con saldo, débito o crédito.</div></div>
          <div class="field"><label>Enlace de cobro de MODO</label><input name="modoLink" type="url" value="${esc(e.modoLink || '')}" placeholder="https://..."></div></div>
        <label class="check" style="margin-top:6px"><input type="checkbox" name="mpOnline" ${e.mpOnline ? 'checked' : ''}><span><b>Cobro online con acreditación automática (Mercado Pago)</b> · el vecino paga con tarjeta, saldo o QR desde la app y el pago se acredita solo, con recibo. Hace falta poner el token de Mercado Pago en el Apps Script (ver PAGOS.md).</span></label>
        ${e.mpOnline ? `<div class="btns" style="margin-top:8px"><button type="button" class="btn btn-sm btn-sec" data-a="mp-conciliar">${I('refresh')}Traer ahora los pagos de Mercado Pago</button></div>` : ''}</div>
      <div class="card"><h3>Impositivo (ARCA)</h3>
        <div class="grid2"><div class="field"><label>CUIT del barrio</label><input name="cuit" value="${esc(c.cuit || '')}"></div>
          <div class="field"><label>Condición</label><input name="condicion" value="${esc(e.condicion || 'Exento')}"></div></div>
        <div class="grid2"><div class="field"><label>Ingresos Brutos</label><input name="iibb" value="${esc(e.iibb || '')}"></div>
          <div class="field"><label>Correo del contador</label><input name="contador" type="email" value="${esc(e.contador || '')}"></div></div>
        <label class="check"><input type="checkbox" name="empleados" ${e.empleados ? 'checked' : ''}><span>El barrio tiene personal propio (corresponde F.931 todos los meses)</span></label></div>
      <button class="btn btn-pri btn-block">${I('check')}Guardar los parámetros</button></form>`;
  },
};
F['parametros-exp'] = d => {
  Store.cambiar(s => {
    const c = s.config;
    ['alias','cbu','cuenta','cuit'].forEach(k => { if (k in d) c[k] = String(d[k]).trim(); });
    c.exp = Object.assign({}, c.exp || {});
    ['vto1','vto2','recargo2','interesMensual','fondoFijo'].forEach(k => { if (d[k] !== undefined && d[k] !== '') c.exp[k] = +d[k]; });
    ['mpLink','modoLink','condicion','iibb','contador'].forEach(k => { if (d[k] !== undefined) c.exp[k] = String(d[k]).trim(); });
    c.exp.empleados = !!d.empleados;
    c.exp.mpOnline = !!d.mpOnline;
    if (d.metodoDeuda && typeof cfgPlan === 'function') c.plan = Object.assign({}, cfgPlan(), { metodoDeuda:d.metodoDeuda });

    c.expensasVence = +d.vto1 || c.expensasVence;
    auditar(s, 'Cambió los parámetros de expensas', '');
  });
  toast('Parámetros guardados', 'check');
};

/* ---------- EXPENSAS Y COBRANZAS ---------- */
const COBRO = {
  resumen(){
    const per = periodoHoy();
    const deuda = LOTES.reduce((a, L) => a + Math.max(0, saldoLote('Lote ' + L.lote)), 0);
    const cobrado = Store.s.pagos.filter(p => p.estado === 'confirmado' && p.fecha >= per + '-01').reduce((a, p) => a + p.monto, 0);
    const morosos = LOTES.filter(L => saldoLote('Lote ' + L.lote) > 0.5).length;
    const emitida = liquidacionDe(per)?.estado === 'emitida';
    const pend = Store.s.pagos.filter(porAcreditar).length;
    return `<div class="admin-hero" style="background:var(--g-wood)">
        <b style="font-size:18px">${nombrePeriodo(per)}</b>
        <div class="small" style="opacity:.85">${emitida ? 'Cupones emitidos' : 'El mes todavía no está cerrado'}</div>
        <div class="garita-kpis"><div class="kpi"><b>${plataCorta(cobrado)}</b><span>Cobrado</span></div>
          <div class="kpi"><b>${plataCorta(deuda)}</b><span>Deuda total</span></div>
          <div class="kpi"><b>${plataCorta(Store.s.pagos.filter(porAcreditar).reduce((a, p) => a + (+p.monto || 0), 0))}</b><span>Por acreditar</span></div>
          <div class="kpi"><b>${morosos}</b><span>Lotes con deuda</span></div></div></div>
      ${pend ? aviso('warn', 'clock', `${plural(pend, 'pago por fuera de la app', 'pagos por fuera de la app')} por acreditar`, 'Corroboralos con el comprobante y confirmalos: se emite el recibo solo.',

        `<button class="btn btn-xs btn-pri" data-a="abrir" data-v="cobranzas" data-p="cobranzas">Ver los pagos</button>`) : ''}
      ${!emitida ? aviso('info', 'file', 'Para cobrar, primero hay que cerrar el mes', 'El cierre reparte los gastos entre los lotes y emite los cupones.',
        `<button class="btn btn-xs btn-sec" data-a="abrir" data-v="contabilidad" data-p="cierre">Ir al cierre</button>`) : ''}
      <p class="muted small" style="margin:10px 2px 0">${I('info')} Cupones, pagos, morosos y recibos están en las pestañas de arriba.</p>`;
  },

  cupones(){
    const emitidas = liquidacionesEmitidas().slice().reverse();
    if (!emitidas.length) return `${vacio('file', 'Todavía no hay cupones emitidos.')}
      ${superficie({ a:'abrir', v:'contabilidad', p:'cierre', icon:'zap', color:'brand', t:'Cerrar el mes y emitir', s:'Reparte los gastos y arma un cupón por lote', cls:'acento' })}`;
    return emitidas.map(l => `<div class="card"><div class="row"><span class="ic ic-wood" style="width:42px;height:42px;border-radius:13px;display:grid;place-items:center">${I('file')}</span>
        <div class="grow"><b>${nombrePeriodo(l.periodo)}</b><div class="muted small">${plural(l.cuotas.length, 'cupón', 'cupones')} · ${plata(l.totalCuotas || l.totalGastos)} · emitida ${hace(l.emitidaAt)}</div></div></div>
      <div class="btns" style="margin-top:10px">
        <button class="btn btn-sm btn-sec" data-a="ver-liquidacion" data-v="${l.periodo}">${I('file')}Ver liquidación</button>
        <button class="btn btn-sm btn-pri" data-a="mandar-cupones" data-v="${l.periodo}">${I('mail')}Reenviar cupones</button></div></div>`).join('')
      + `<p class="muted tiny" style="margin-top:8px">${plural(destinatariosDeCupon().length, 'dirección de correo', 'direcciones de correo')} para recibir cupones: las de las cuentas con lote (vecinos y Administración) y las del padrón. Las que falten se cargan en Padrón (columna correo) o cada vecino en su cuenta.</p>`;
  },

  recibos(){
    const rs = Store.s.recibos.slice().sort((a, b) => b.at - a.at);
    return `<div class="card"><div class="row" style="justify-content:space-between"><b>Recibos emitidos</b><b class="num" style="font-size:18px">${rs.length}</b></div></div>
      <div class="card lista">${rs.slice(0, 120).map(r => `<div class="it"><span class="ic ic-ok" style="width:34px;height:34px;border-radius:11px;display:grid;place-items:center">${I('check')}</span>
        <div class="txt"><b>Nº ${esc(r.numero)} · ${esc(r.lote)}</b><span>${fechaCorta(r.fecha)}${propietarioDe(r.lote) ? ' · ' + esc(propietarioDe(r.lote)) : ''}</span></div>
        <b class="num">${plata(r.monto)}</b>
        <button class="icon-btn" data-a="ver-recibo" data-id="${r.id}" aria-label="Ver">${I('eye')}</button></div>`).join('') || '<p class="muted small" style="margin:6px 0">Todavía no se emitió ningún recibo.</p>'}</div>`;
  },

  cobranzas(){
    const informados = Store.s.pagos.filter(porAcreditar).sort((a, b) => b.at - a.at);
    const mpAprob = Store.s.pagos.filter(p => p.estado === 'informado' && esPagoMP(p) && !esPrueba(p)).sort((a, b) => b.at - a.at);
    const pruebas = Store.s.pagos.filter(esPrueba).sort((a, b) => b.at - a.at);
    const confirmados = Store.s.pagos.filter(p => p.estado === 'confirmado').sort((a, b) => b.at - a.at).slice(0, 20);
    const mes = Store.s.pagos.filter(p => p.estado === 'confirmado' && p.fecha >= periodoHoy() + '-01').reduce((a, p) => a + p.monto, 0);
    return `<div class="card"><div class="row" style="justify-content:space-between"><b>Cobrado en ${nombrePeriodo(periodoHoy())}</b><b class="num" style="font-size:18px">${plata(mes)}</b></div></div>
      ${typeof lotesCargaInicial === 'function' && cfgPlan().base && !cfgPlan().cargaInicial && lotesCargaInicial().length > 20 ? aviso('warn', 'zap', `Falta registrar los cobros del cupón de ${nombrePeriodo(cfgPlan().base)}`,
        'Se pagaron por fuera de la app. Sin esto, la app ve a todos los lotes como deudores y la próxima liquidación les cobraría el ajuste.',
        `<button class="btn btn-xs btn-pri" data-a="carga-inicial">Registrarlos (menos los morosos)</button>`) : ''}
      ${superficie({ a:'pago-manual', icon:'plus', t:'Registrar un pago a mano', s:'Cuando llega por fuera de la app', cls:'acento' })}
      ${typeof lotesCargaInicial === 'function' && cfgPlan().base ? superficie({ a:'carga-inicial', icon:'check', color:'wood', t:`Cobros del cupón de ${nombrePeriodo(cfgPlan().base)} (carga inicial)`, s:'Dar por cobrados de una vez los lotes que pagaron por fuera, menos los morosos' }) : ''}
      ${mpAprob.length ?
 `${sec(`Mercado Pago aprobados (${mpAprob.length})`, `<button class="link" data-a="mp-conciliar">${I('refresh')}Pasar a recibo ahora</button>`)}
        <p class="muted small" style="margin:-4px 2px 8px">Ya descontaron del saldo: los aprobó Mercado Pago. La app los pasa a recibo sola en unos minutos (no hace falta tocar nada).</p>
        <div class="card lista">${mpAprob.map(p => `<div class="it"><span class="ic ic-sky" style="width:34px;height:34px;border-radius:11px;display:grid;place-items:center">${I('wallet')}</span>
          <div class="txt"><b>${esc(p.lote)} · ${plata(p.monto)}</b><span>${fechaCorta(p.fecha)} · operación ${esc(p.mpId)}</span></div></div>`).join('')}</div>` : ''}
      ${pruebas.length ? `${sec(`Pagos de PRUEBA (${pruebas.length})`, `<button class="link" data-a="pagos-prueba-borrar">${I('trash')}Borrarlos</button>`)}
        <p class="muted small" style="margin:-4px 2px 8px">Hechos con cuentas de prueba de Mercado Pago: sirven para ver que el circuito anda. No descuentan saldos, no sacan recibo ni entran a la contabilidad.</p>
        <div class="card lista">${pruebas.map(p => `<div class="it"><span class="ic ic-accent" style="width:34px;height:34px;border-radius:11px;display:grid;place-items:center">${I('zap')}</span>
          <div class="txt"><b>${esc(p.lote)} · ${plata(p.monto)}</b><span>${fechaCorta(p.fecha)} · operación ${esc(p.mpId)}</span></div><span class="pill p-accent">prueba</span></div>`).join('')}</div>` : ''}
      ${sec(`Por acreditar: pagos por fuera de la app (${informados.length})`)}
      ${informados.length ? `<p class="muted small" style="margin:-4px 2px 8px">El vecino avisó que pagó y adjuntó el comprobante. Corroboralo en el banco: si está, confirmalo y le llega el recibo; si no, rechazalo y el saldo vuelve.</p>` : ''}
      ${informados.length ? informados.map(p => `<div class="card"><div class="row" style="align-items:flex-start">
        ${p.comp ? `<button class="comp-mini" data-a="ver-comprobante" data-id="${p.id}" ${p.foto && p.foto.mini ? `style="background-image:url('${p.foto.mini}')"` : ''} aria-label="Ver el comprobante">${p.foto && p.foto.mini ? '' : I('file')}</button>`
          : p.foto ? fotoHTML(p.foto, 'mini-foto') : `<span class="ic ic-warn" style="width:44px;height:44px;border-radius:12px;display:grid;place-items:center;flex:none">${I('clock')}</span>`}
        <div class="grow"><b>${esc(p.lote)} · ${plata(p.monto)}</b> <span class="pill p-warn">por acreditar</span><div class="muted small">${fechaCorta(p.fecha)} · ${esc(p.medio)} · informó ${esc(nombreDe(p.userId))}</div>
          ${p.nota ? `<div class="small" style="color:var(--ink-2)">${esc(p.nota)}</div>` : ''}
          <div class="muted small">Saldo del lote: ${plata(saldoLote(p.lote))} · si se confirma: ${plata(saldoLote(p.lote) - p.monto)}</div>
          ${p.comp && p.comp.subido === false ? `<div class="small" style="color:var(--warn)">${I('alert')} El comprobante no se pudo subir: quedó en el equipo del vecino.</div>` : ''}</div></div>
        <div class="btns" style="margin-top:10px">${p.comp ? `<button class="btn btn-sm btn-sec" data-a="ver-comprobante" data-id="${p.id}">${I('eye')}Ver comprobante</button>` : ''}
          <button class="btn btn-sm btn-ok" data-a="confirmar-pago" data-id="${p.id}">${I('check')}Confirmar y emitir recibo</button>
          <button class="btn btn-sm btn-danger-soft" data-a="rechazar-pago" data-id="${p.id}">Rechazar</button></div></div>`).join('')
        : vacio('check', 'No hay pagos esperando que los corroboren.')}
      ${sec('Últimos pagos confirmados')}
      <div class="card lista">${confirmados.map(p => `<div class="it"><span class="ic ic-ok" style="width:34px;height:34px;border-radius:11px;display:grid;place-items:center">${I('check')}</span>
        <div class="txt"><b>${esc(p.lote)}</b><span>${fechaCorta(p.fecha)} · ${esc(p.medio)}${p.recibo ? ' · recibo ' + esc(p.recibo) : ''}</span></div><b class="num">${plata(p.monto)}</b></div>`).join('') || '<p class="muted small" style="margin:6px 0">Todavía no hay pagos confirmados.</p>'}</div>`;
  },

  morosos(){
    const filas = LOTES.map(L => ({ L, lote:'Lote ' + L.lote, saldo:saldoLote('Lote ' + L.lote) })).filter(x => x.saldo > 0.5).sort((a, b) => b.saldo - a.saldo);
    const total = filas.reduce((a, x) => a + x.saldo, 0);
    return `<div class="card"><div class="row" style="justify-content:space-between"><b>Deuda total del barrio</b><b class="num" style="font-size:18px;color:var(--danger)">${plata(total)}</b></div>
        <div class="muted small">${plural(filas.length, 'lote con deuda', 'lotes con deuda')} de ${LOTES.length}</div></div>
      ${filas.map(x => { const m = cuentaLote(x.lote).movs.filter(v => v.debe), desde = m.length ? m[0].fecha : Date.now();
        const meses = Math.max(1, Math.round((Date.now() - desde) / (30 * DIA)));
        return `<div class="card"><div class="row"><span class="ic ic-${x.saldo > 1000000 ? 'danger' : 'warn'}" style="width:40px;height:40px;border-radius:13px;display:grid;place-items:center">${I('alert')}</span>
          <div class="grow"><b>${esc(x.lote)}</b><div class="muted small">${esc(propietarioDe(x.lote) || 'Sin propietario cargado')}</div>
            <div class="muted small">Arrastra ${plural(meses, 'mes', 'meses')}</div></div><b class="num" style="color:var(--danger)">${plata(x.saldo)}</b></div>
          <div class="btns" style="margin-top:10px">
            <button class="btn btn-sm btn-sec" data-a="ver-cuenta" data-v="${esc(x.lote)}">${I('eye')}Ver cuenta</button>
            <button class="btn btn-sm btn-sec" data-a="certificado-deuda" data-v="${esc(x.lote)}">${I('file')}Certificado</button>
            <button class="btn btn-sm btn-pri" data-a="reclamar-deuda" data-v="${esc(x.lote)}">${I('send')}Reclamar</button></div></div>`; }).join('') || vacio('check', '¡Nadie debe nada!')}`;
  },

};

/* Presentaciones mensuales. Las fechas exactas las fija ARCA según la
   terminación de CUIT: acá se usa una estimación y la Administración la
   corrige con su contador. */
function presentacionesDe(periodo){
  const c = cfgExp(), hoy = hoyISO();
  const [a, m] = periodo.split('-').map(Number);
  const venc = dia => isoDe(new Date(a, m, dia));   /* mes siguiente al período */
  const base = [
    { id:'sire', nombre:'SIRE · retenciones practicadas', detalle:'Ganancias RG 830 y Seguridad Social, si se retuvo en el mes', vence:venc(12) },
    { id:'iibb', nombre:'Ingresos Brutos (Tierra del Fuego)', detalle:'Solo si el barrio está inscripto', vence:venc(18) },
  ];
  if (c.empleados) base.unshift({ id:'f931', nombre:'F.931 · aportes y contribuciones', detalle:'Personal en relación de dependencia', vence:venc(11) });
  const gs = gastosDe(periodo);
  const hayRet = gs.some(g => (+g.retGan || 0) + (+g.retSuss || 0) > 0);
  return base.filter(p => p.id !== 'sire' || hayRet).map(p => {
    const reg = Store.s.impuestos.find(x => x.periodo === periodo && x.tipo === p.id);
    return { ...p, estado: reg ? 'presentado' : 'pendiente', presentadoEl: reg?.fecha, vencido: !reg && hoy > p.vence };
  });
}

/* ---------- acciones de la Administración ---------- */
A['nuevo-gasto'] = el => formGasto(null, el.dataset.v || periodoHoy());
A['editar-gasto'] = el => formGasto(Store.s.gastos.find(g => g.id === el.dataset.id));
function formGasto(g, periodo, { plan = null } = {}){
  g = g || {};
  const per = g.periodo || periodo || periodoHoy();
  /* ¿Es un gasto que se repite? (está en el mes que usan las automáticas) */
  const origen = plan ? plan.clave : g.origen || (g.proveedor && typeof plantillaPlan === 'function' && (plantillaPlan()?.gastos || []).some(x => claveGasto(x) === claveGasto(g)) ? claveGasto(g) : '');

  hoja(g.id ? 'Editar gasto' : 'Cargar un gasto', `<form data-f="gasto" data-id="${g.id || ''}">
    <div class="grid2">
      <div class="field"><label>Período</label><input type="month" name="periodo" value="${per}" required></div>
      <div class="field"><label>Fecha del comprobante</label><input type="date" name="fecha" value="${g.fecha || hoyISO()}"></div></div>
    <div class="field"><label>Proveedor</label><input name="proveedor" required maxlength="80" list="provList" value="${esc(g.proveedor || '')}" placeholder="Nombre o razón social"></div>
    <datalist id="provList">${[...new Set([...Store.s.proveedores.map(p => p.empresa), ...Store.s.gastos.map(x => x.proveedor)])].filter(Boolean).map(n => `<option>${esc(n)}</option>`).join('')}</datalist>
    <div class="grid2"><div class="field"><label>CUIT</label><input name="cuit" maxlength="13" value="${esc(g.cuit || '')}" placeholder="30-00000000-0"></div>
      <div class="field"><label>Rubro</label><select name="rubro">${Object.entries(RUBROS).map(([k, t]) => `<option value="${k}" ${+g.rubro === +k ? 'selected' : ''}>${k} · ${t}</option>`).join('')}</select></div></div>
    <div class="grid2"><div class="field"><label>Tipo</label><select name="tipoComp">${TIPOS_COMP.map(t => `<option ${g.tipoComp === t ? 'selected' : ''}>${t}</option>`).join('')}</select></div>
      <div class="field"><label>Número</label><input name="nroComp" maxlength="24" value="${esc(g.nroComp || '')}"></div></div>
    <div class="grid3"><div class="field"><label>Neto</label><input type="number" step="0.01" name="neto" value="${g.neto ?? ''}"></div>
      <div class="field"><label>IVA</label><input type="number" step="0.01" name="iva" value="${g.iva ?? ''}"></div>
      <div class="field"><label>Total</label><input type="number" step="0.01" name="total" required value="${g.total ?? ''}"></div></div>
    <div class="field"><label>Columna de la liquidación</label><select name="columna">${Object.entries(COLUMNAS).map(([k, t]) => `<option value="${k}" ${g.columna === k ? 'selected' : ''}>${t}</option>`).join('')}</select></div>
    <div class="grid2"><div class="field"><label>Retención Ganancias</label><input type="number" step="0.01" name="retGan" value="${g.retGan ?? ''}"></div>
      <div class="field"><label>Retención Seg. Social</label><input type="number" step="0.01" name="retSuss" value="${g.retSuss ?? ''}"></div></div>
    <div class="grid2"><div class="field"><label>Cuota (opcional)</label><input type="number" name="cuotaN" min="1" value="${g.cuotaN ?? ''}" placeholder="3"></div>
      <div class="field"><label>de</label><input type="number" name="cuotaDe" min="1" value="${g.cuotaDe ?? ''}" placeholder="36"></div></div>
    <div class="field"><label>¿Es de un lote en particular?</label><select name="lote"><option value="">No: se reparte entre todos</option>${LOTES.map(L => `<option value="Lote ${L.lote}" ${g.lote === 'Lote ' + L.lote ? 'selected' : ''}>${esc(nombreLote(L))}</option>`).join('')}</select></div>
    <div class="field"><label>Detalle</label><input name="detalle" maxlength="120" value="${esc(g.detalle || '')}" placeholder="Ej: periodo julio, suministro 23579"></div>
    ${campoFoto('fotoGasto', 'Foto del comprobante')}
    ${plan ? `<div class="card plana small">${I('refresh')} Viene de ${nombrePeriodo(plan.desde)}: <b>${plata(plan.antes)}</b>${plan.nota ? ' · ' + esc(plan.nota) : ''}. Si ya sabés el importe nuevo, cambialo en <b>Total</b>.</div>` : ''}
    <label class="check"><input type="checkbox" name="estimado" ${g.estimado || plan ? 'checked' : ''}><span>Todavía es un estimado (no llegó la factura)</span></label>
    ${origen ? `<input type="hidden" name="origen" value="${esc(origen)}"><label class="check"><input type="checkbox" name="adelante" ${plan ? 'checked' : ''}><span>Usar este importe también en los meses siguientes (desde ahí se sigue actualizando por inflación)</span></label>` : ''}
    <button class="btn btn-pri btn-block">${I('check')}Guardar</button></form>`, { ancho:'620px' });
}
F['gasto'] = (d, form) => {
  const id = form.dataset.id;
  Store.cambiar(s => {
    const base = { periodo:d.periodo, fecha:d.fecha, proveedor:d.proveedor.trim(), cuit:d.cuit.trim(), rubro:+d.rubro,
      tipoComp:d.tipoComp, nroComp:d.nroComp.trim(), neto:+d.neto || 0, iva:+d.iva || 0, total:+d.total || 0,
      columna:d.columna, retGan:+d.retGan || 0, retSuss:+d.retSuss || 0, cuotaN:+d.cuotaN || 0, cuotaDe:+d.cuotaDe || 0,
      lote:d.lote || '', detalle:d.detalle.trim().replace(/\s*\(estimado\)\s*$/i, '') + (d.estimado ? ' (estimado)' : ''), estimado:!!d.estimado };
    if (d.origen) base.origen = d.origen;
    const foto = leerFoto(d.foto);
    if (id){ const g = s.gastos.find(x => x.id === id); Object.assign(g, base); if (foto) g.foto = foto; }
    else s.gastos.unshift({ id:uid(), ...base, foto, por:yo().id, at:Date.now() });
    /* "Usar este importe también en los meses siguientes": queda como precio
       nuevo de ese gasto desde este mes (ver precioVigente en v-plan.js). */
    if (d.adelante && d.origen && typeof cfgPlan === 'function'){
      const p = Object.assign({}, cfgPlan()), precios = Object.assign({}, p.precios || {});
      precios[d.origen] = [...aLista(precios[d.origen]).filter(x => x && x.desde !== base.periodo), { desde:base.periodo, monto:base.total, at:Date.now() }];
      p.precios = precios; s.config.plan = p;
    }
    auditar(s, id ? 'Editó un gasto' : 'Cargó un gasto', `${base.proveedor} · ${plata(base.total)} · ${base.periodo}${d.adelante ? ' · de acá en adelante' : ''}`);
  });
  cerrarHoja(); toast(d.adelante ? 'Gasto guardado: los meses siguientes ya usan este importe' : 'Gasto guardado', 'check');

};
A['borrar-gasto'] = async el => {
  const g = Store.s.gastos.find(x => x.id === el.dataset.id); if (!g) return;
  if (!await confirmar('Borrar gasto', `${esc(g.proveedor)} · ${plata(g.total)}`, { si:'Borrar', peligro:true })) return;
  Store.cambiar(s => { s.gastos = s.gastos.filter(x => x.id !== g.id); auditar(s, 'Borró un gasto', `${g.proveedor} · ${plata(g.total)}`); });
};
A['previsualizar'] = el => {
  const calc = calcularLiquidacion(el.dataset.v);
  hoja(`Cuotas de ${nombrePeriodo(el.dataset.v)}`, `<div class="card lista">${calc.cuotas.map(c => `<div class="it"><div class="txt"><b>${esc(c.lote)}</b>
    <span>coef. ${c.coef.toFixed(4)} % · expensas ${plata(c.expensas)} · fondo ${plata(c.fondo)}${c.particulares ? ' · particular ' + plata(c.particulares) : ''}${c.multas ? ' · multa ' + plata(c.multas) : ''}${c.interes ? ' · interés ' + plata(c.interes) : ''}</span></div>
    <b class="num">${plata(c.total)}</b></div>`).join('')}</div>`, { ancho:'700px' });
};
A['emitir-liquidacion'] = async el => {
  const periodo = el.dataset.v, calc = calcularLiquidacion(periodo);
  const est = gastosDe(periodo).filter(g => g.estimado).length;
  if (!await confirmar('Emitir la liquidación', `Se van a generar ${calc.cuotas.length} cupones por ${plata(calc.totalCuotas)} y cada vecino va a recibir el suyo.${est ? ` <b>Ojo: ${plural(est, 'gasto es estimado', 'gastos son estimados')}</b> (todavía no se cargó la factura real).` : ''}`, { si:'Emitir' })) return;
  emitirLiquidacion(periodo);
};
/* Emitir un período: se usa desde el botón y desde el cierre automático. */
function emitirLiquidacion(periodo, { auto = false } = {}){
  const calc = calcularLiquidacion(periodo);
  Store.cambiar(s => {
    const l = { id:uid(), periodo, estado:'emitida', emitidaAt:Date.now(), por: auto ? 'sistema' : yo().id, estimados: gastosDe(periodo).filter(g => g.estimado).length,
      porColumna:calc.porColumna, porRubro:calc.porRubro, totalGastos:calc.totalGastos, totalCuotas:calc.totalCuotas, cuotas:calc.cuotas };
    const i = s.liquidaciones.findIndex(x => x.periodo === periodo);
    if (i >= 0) s.liquidaciones[i] = l; else s.liquidaciones.push(l);
    s.infracciones.forEach(x => { if (x.estado === 'firme' && !x.liquidada && x.monto) x.liquidada = periodo; });
    notificar(s, { para:'todos', titulo:`Expensas de ${nombrePeriodo(periodo)}`, texto:`Ya podés ver tu cupón. Primer vencimiento: ${fechaCorta(vtoDe(periodo, 1))}.`, icon:'wallet', color:'wood', link:'expensas', sonido:true });
    auditar(s, auto ? 'Emitió sola la liquidación (cierre automático)' : 'Emitió la liquidación', `${nombrePeriodo(periodo)} · ${plata(calc.totalCuotas)} · ${calc.cuotas.length} cupones`);
  });
  toast('Liquidación emitida', 'check');
  mandarCupones(periodo);
}
A['reabrir-liquidacion'] = async el => {
  if (!await confirmar('Reabrir el período', 'Los cupones dejan de estar emitidos hasta que lo vuelvas a cerrar. Los pagos ya registrados no se tocan.', { si:'Reabrir', peligro:true })) return;
  Store.cambiar(s => { const l = s.liquidaciones.find(x => x.periodo === el.dataset.v); if (l) l.estado = 'borrador';
    auditar(s, 'Reabrió un período', el.dataset.v); });
};
A['ver-liquidacion'] = el => imprimir(`Liquidación ${nombrePeriodo(el.dataset.v)}`, liquidacionHTML(el.dataset.v));
/* REENVIAR CUPONES: a todos, a un lote (eligiendo a cuál de sus correos)
   o solo a mí para ver cómo llega. Dice qué pasó con cada correo. */
A['mandar-cupones'] = el => {
  const periodo = el.dataset.v, gente = destinatariosDeCupon(), yoU = yo();
  const lotesCon = [...new Set(gente.map(x => x.casa))].sort((a, b) => a.localeCompare(b, 'es', { numeric:true }));
  hoja(`Cupones de ${nombrePeriodo(periodo)}`, `
    ${superficie({ a:'cupones-a-todos', v:periodo, icon:'users', color:'brand', t:`A todos (${plural(gente.length, 'correo')})`, s:`${plural(lotesCon.length, 'lote')} con correo cargado, de ${LOTES.length}` })}
    ${yoU && yoU.email && /^Lote\s/i.test(yoU.casa || '') ? superficie({ a:'cupones-a-mi', v:periodo, icon:'mail', color:'sky', t:'Solo a mí, para probar', s:`${esc(yoU.email)} · cupón de ${esc(yoU.casa)}` }) : ''}
    <form data-f="cupon-a-lote" data-v="${periodo}" class="card" style="margin-top:10px">
      <b>A un lote</b>
      <div class="field" style="margin-top:8px"><label>Lote</label><select name="lote" id="cuponLote" required><option value="">Elegí un lote…</option>${LOTES.map(L => { const casa = 'Lote ' + L.lote, n = gente.filter(x => x.casa === casa).length;
        return `<option value="${casa}">${esc(nombreLote(L))}${propietarioDe(casa) ? ' · ' + esc(propietarioDe(casa)) : ''}${n ? ` · ${plural(n, 'correo')}` : ' · sin correo'}</option>`; }).join('')}</select></div>
      <div id="cuponLoteCorreos" class="small muted">Elegí un lote para ver sus correos.</div>
      <button class="btn btn-pri btn-block" style="margin-top:10px">${I('send')}Mandar el cupón</button></form>
    <div id="cuponesResultado"></div>`, { ancho:'560px' });
};
/* Un celular argentino, escrito como sea ("2901 15 12-3456", "+54 9 2901…",
   "15 123456"), al formato que pide WhatsApp: 549 + característica + número,
   sin el 0 ni el 15. Sin característica se asume Ushuaia (2901). */
function waNumeroAR(tel){
  let d = soloDigitos(tel).replace(/^00/, '');
  if (!d) return '';
  if (d.startsWith('54')){ d = d.slice(2); if (d.startsWith('9')) d = d.slice(1); }
  d = d.replace(/^0/, '');
  const m = d.match(/^(\d{2,4})15(\d{6,8})$/);
  if (m && (m[1] + m[2]).length === 10) d = m[1] + m[2];
  if (/^15\d{6}$/.test(d)) d = d.slice(2);
  if (d.length <= 8) d = '2901' + d;
  return d.length === 10 ? '549' + d : '';
}
/* Los números del cupón de un lote (lo mismo que el cupón impreso y el mail). */
function montosCupon(periodo, casa){
  const l = liquidacionDe(periodo), cu = l ? cuotaDe(l, casa) : null; if (!cu) return null;
  const previos = cuentaLote(casa).movs.filter(m => m.fecha < l.emitidaAt);
  const saldoAnt = previos.length ? previos[previos.length - 1].saldo : 0;
  const total1 = saldoAnt + cu.total + (cu.interes || 0);
  return { cu, saldoAnt, total1, total2:conCentavosDelLote(total1 * (1 + (cfgExp().recargo2 || 0) / 100), casa).total };
}
function textoCuponWA(periodo, casa){
  const m = montosCupon(periodo, casa); if (!m) return '';
  const c = Store.s.config;
  return `Barrio ${c.nombre} · Expensas de ${nombrePeriodo(periodo)} · ${casa}\n\n` +
    `Total a pagar: ${plata(m.total1)} hasta el ${fechaCorta(vtoDe(periodo, 1))}.\n` +
    `2º vencimiento (${fechaCorta(vtoDe(periodo, 2))}): ${plata(m.total2)}.\n\n` +
    `Transferencia · Alias: ${c.alias || '—'} · CBU: ${c.cbu || '—'}\n` +
    `Titular: Barrio ${c.nombre} · CUIT ${c.cuit || ''}\n` +
    `Los centavos (,${String(centavosDelLote(casa)).padStart(2, '0')}) identifican a tu lote: transferí el importe exacto.\n\n` +
    `Tu cupón y tus pagos, en la app del barrio: ${urlApp('expensas')}`;
}
/* Al elegir un lote: sus correos, un correo nuevo y WhatsApp. */
document.addEventListener('change', e => {
  if (e.target.id !== 'cuponLote') return;
  const casa = e.target.value, box = $('#cuponLoteCorreos'); if (!box) return;
  if (!casa){ box.innerHTML = 'Elegí un lote para ver sus correos.'; return; }
  const ms = destinatariosDeCupon().filter(x => x.casa === casa);
  const p = Store.s.padron.find(x => 'Lote ' + x.lote === casa);
  const tels = [...new Map([...Store.s.users.filter(u => u.casa === casa && u.estado === 'aprobado' && u.tel).map(u => [waNumeroAR(u.tel), u.nombre]),
    ...(p && p.tel ? [[waNumeroAR(p.tel), p.propietario || 'Propietario/a']] : [])].filter(([t]) => t)).entries()];
  const periodo = e.target.closest('form')?.dataset.v || '';
  box.innerHTML = `${ms.length ? `<div class="lbl" style="margin-top:4px">Correos de ${esc(casa)}</div>` + ms.map((x, i) => `<label class="check"><input type="checkbox" name="c${i}" value="${esc(x.email)}" checked><span>${esc(x.email)} <span class="muted">· ${esc(x.nombre || '')}</span></span></label>`).join('')
      : `<p class="small" style="margin:4px 0 6px;color:var(--warn)">${esc(casa)} no tiene correo registrado.</p>`}
    <div class="field" style="margin-top:6px"><label>${ms.length ? 'Otro correo (opcional)' : 'Escribí el correo'}</label><input name="otro" type="email" placeholder="correo@ejemplo.com" autocomplete="off"></div>
    ${p ? `<label class="check" style="margin:-4px 0 8px"><input type="checkbox" name="guardar" checked><span>Guardar en el padrón lo que escriba acá (correo y celular) para la próxima</span></label>` : ''}
    <div class="lbl" style="margin-top:4px">O por WhatsApp</div>
    ${tels.map(([t, n]) => `<button type="button" class="btn btn-sm btn-wa" style="margin:0 6px 6px 0" data-a="cupon-wa" data-v="${periodo}" data-p="${esc(casa)}" data-t="${t}">${I('phone')}${esc(String(n).split(/[ ,]/)[0])} · +${t.slice(0, 2)} ${t.slice(2, 3)} ${t.slice(3, 7)} ${t.slice(7)}</button>`).join('')}
    <div class="linea-form"><input name="wa" id="cuponWa" inputmode="tel" placeholder="Celular: 2901 15 123456" autocomplete="off"><button type="button" class="btn btn-wa" data-a="cupon-wa" data-v="${periodo}" data-p="${esc(casa)}">${I('phone')}Enviar</button></div>
    <div class="ayuda">Se abre WhatsApp con el mensaje armado (importe, vencimientos, alias y CBU): solo hay que tocar Enviar. Por WhatsApp no va el PDF: el vecino lo ve en la app.</div>`;
});
A['cupon-wa'] = el => {
  const periodo = el.dataset.v, casa = el.dataset.p;
  const escrito = $('#cuponWa')?.value || '';
  const tel = el.dataset.t || waNumeroAR(escrito);
  if (!tel){ toast('Ese celular no parece válido. Escribilo con la característica: 2901 15 123456', 'alert'); return; }
  const texto = textoCuponWA(periodo, casa); if (!texto){ toast('Ese lote no tiene cupón en esta liquidación', 'alert'); return; }
  window.open(waLink(tel, texto), '_blank', 'noopener');
  Store.cambiar(s => {
    const f = document.querySelector('form[data-f="cupon-a-lote"]');
    if (!el.dataset.t && f?.guardar?.checked){ const p = s.padron.find(x => 'Lote ' + x.lote === casa); if (p && !p.tel) p.tel = escrito.trim(); }
    auditar(s, 'Mandó el cupón por WhatsApp', `${casa} · ${nombrePeriodo(periodo)} · +${tel}`);
  });
};
function mostrarResultadoCupones(res){
  const box = $('#cuponesResultado'); if (!box) return;
  const ok = res.filter(r => r.ok).length, mal = res.filter(r => !r.ok);
  box.innerHTML = `<div style="margin-top:12px">${aviso(mal.length ? (ok ? 'warn' : 'danger') : 'ok', mal.length ? 'alert' : 'check',
    mal.length ? `Salieron ${ok} de ${res.length}` : `Salieron los ${plural(res.length, 'correo')}`, mal.length ? 'El motivo de cada uno está abajo.' : 'Si alguno no llega en unos minutos, que mire en Spam.')}</div>
    <div class="card lista">${res.map(r => `<div class="it"><span class="ic ic-${r.ok ? 'ok' : 'danger'}" style="width:30px;height:30px;border-radius:10px;display:grid;place-items:center">${I(r.ok ? 'check' : 'x')}</span>
      <div class="txt"><b>${esc(r.casa)} · ${esc(r.email)}</b>${r.ok ? '' : `<span style="color:var(--danger)">${esc(r.error || 'No salió')}</span>`}</div></div>`).join('')}</div>`;
}
A['cupones-a-todos'] = async el => {
  const periodo = el.dataset.v;
  if (!await confirmar('Mandar a todos', `Se manda el cupón de ${nombrePeriodo(periodo)} a ${plural(destinatariosDeCupon().length, 'correo')}, de a diez con una pausa.`, { si:'Mandar' })) return;
  const res = await mandarCupones(periodo, { detalle:true });
  A['mandar-cupones']({ dataset:{ v:periodo } }); mostrarResultadoCupones(res);
};
A['cupones-a-mi'] = async el => {
  const u = yo(), res = await mandarCupones(el.dataset.v, { detalle:true, solo:[{ email:u.email, nombre:u.nombre, casa:u.casa }] });
  mostrarResultadoCupones(res);
};
F['cupon-a-lote'] = async (d, form) => {
  const casa = d.lote; if (!casa){ toast('Elegí un lote', 'alert'); return; }
  const nombre = propietarioDe(casa) || 'Propietario/a';
  const mails = Object.keys(d).filter(k => /^c\d+$/.test(k)).map(k => d[k]).filter(Boolean);
  const otro = String(d.otro || '').trim().toLowerCase();
  if (otro && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(otro)){ toast('Ese correo no parece válido', 'alert'); return; }
  if (otro) mails.push(otro);
  if (!mails.length){ toast('Ese lote no tiene correo: escribilo, o mandalo por WhatsApp', 'alert'); return; }
  /* Lo escrito a mano queda en el padrón, así la próxima ya está. */
  if (otro && d.guardar) Store.cambiar(s => { const p = s.padron.find(x => 'Lote ' + x.lote === casa); if (p && !p.email){ p.email = otro; auditar(s, 'Cargó un correo en el padrón', `${casa} · ${otro}`); } });
  const res = await mandarCupones(form.dataset.v, { detalle:true, solo:mails.map(email => ({ email, nombre, casa })) });
  mostrarResultadoCupones(res);
};
/* El cupón le llega a CADA lote: al vecino con cuenta y, si no la tiene, al
   propietario del padrón. Si el envío automático no está configurado, los
   correos quedan igual en la bandeja de salida (Administración → Correos) y
   se mandan a mano: nunca se pierde un cupón. */
function destinatariosDeCupon(){
  const out = new Map();
  /* Toda cuenta aprobada que tenga lote: vecinos y TAMBIÉN la Administración
     que vive en el barrio (antes se la salteaba por tener rol admin). */
  Store.s.users.filter(u => u.estado === 'aprobado' && u.rol !== 'guardia' && u.email && /^Lote\s/i.test(u.casa || '') && !esCorreoGarita(u.email))
    .forEach(u => out.set(u.email.toLowerCase(), { email:u.email, nombre:u.nombre, casa:u.casa }));
  Store.s.padron.filter(p => p.email).forEach(p => {
    const casa = 'Lote ' + p.lote;
    /* Si en ese lote ya hay alguien con cuenta, no se duplica el correo salvo
       que el propietario sea otra dirección distinta. */
    if (!out.has(p.email.toLowerCase())) out.set(p.email.toLowerCase(), { email:p.email, nombre:p.propietario || 'Propietario/a', casa });
  });
  return [...out.values()];
}
async function mandarCupones(periodo, { silencioso = false, detalle = false, solo = null } = {}){
  const l = liquidacionDe(periodo); if (!l) return detalle ? [] : 0;
  const gente = solo || destinatariosDeCupon();
  if (!gente.length){ if (!silencioso) toast('No hay ningún correo para mandar: cargalos en el Padrón (columna correo) o que cada vecino se inscriba en la app.', 'info'); return detalle ? [] : 0; }
  const resultados = [];
  const c = cfgExp();
  let n = 0;
  for (let i = 0; i < gente.length; i += 10){
    const tanda = gente.slice(i, i + 10);
    const r = await Promise.all(tanda.map(async x => {
      const cu = cuotaDe(l, x.casa);
      if (!cu){ resultados.push({ ...x, ok:false, error:'Ese lote no tiene cupón en esta liquidación' }); return false; }
      /* Lo que hay que pagar de verdad: lo que arrastra + intereses + el mes
         (termina en los centavos del lote, como el cupón). */
      const hasta = l.emitidaAt, previos = cuentaLote(x.casa).movs.filter(m => m.fecha < hasta);
      const saldoAnt = previos.length ? previos[previos.length - 1].saldo : 0;
      const total1 = saldoAnt + cu.total + (cu.interes || 0);
      const total2 = conCentavosDelLote(total1 * (1 + (c.recargo2 || 0) / 100), x.casa).total;
      const envio = await Correo.enviarDetalle({ para:x.email, asunto:`Expensas de ${nombrePeriodo(periodo)} · ${x.casa}`, tipo:'cupon',
        html:Correo.plantilla(`Expensas de ${nombrePeriodo(periodo)}`,
          `<p>Hola ${esc(String(x.nombre || '').split(/[ ,]/)[0] || 'vecino/a')}:</p>
           <p>Este es el cupón de <b>${esc(x.casa)}</b>.</p>
           <p style="font-size:26px;font-weight:800;color:#0d6b66;margin:14px 0">${plata(total1)}</p>
           <table style="width:100%;border-collapse:collapse;font-size:14px">
             ${saldoAnt ? `<tr><td style="padding:4px 0;color:#555">${saldoAnt > 0 ? 'Saldo anterior' : 'Saldo a favor'}</td><td style="text-align:right">${plata(saldoAnt)}</td></tr>` : ''}
             <tr><td style="padding:4px 0;color:#555">Expensas por coeficiente (${cu.coef.toFixed(4)} %)</td><td style="text-align:right">${plata(cu.expensas || 0)}</td></tr>
             ${cu.fondo ? `<tr><td style="padding:4px 0;color:#555">Fondo de Infraestructura</td><td style="text-align:right">${plata(cu.fondo)}</td></tr>` : ''}
             ${cu.particulares ? `<tr><td style="padding:4px 0;color:#555">Gastos particulares</td><td style="text-align:right">${plata(cu.particulares)}</td></tr>` : ''}
             ${cu.multas ? `<tr><td style="padding:4px 0;color:#555">Multas</td><td style="text-align:right">${plata(cu.multas)}</td></tr>` : ''}
             ${cu.interes ? `<tr><td style="padding:4px 0;color:#555">Intereses por saldo impago</td><td style="text-align:right">${plata(cu.interes)}</td></tr>` : ''}
             ${cu.redondeo ? `<tr><td style="padding:4px 0;color:#555">Redondeo (los centavos identifican al ${esc(x.casa)})</td><td style="text-align:right">${plata(cu.redondeo)}</td></tr>` : ''}
           </table>
           <p style="margin-top:16px">Primer vencimiento: <b>${fechaCorta(vtoDe(periodo, 1))}</b><br>
             Segundo vencimiento: ${fechaCorta(vtoDe(periodo, 2))} — ${plata(total2)} con el recargo del ${c.recargo2} %.</p>
           <p>Podés pagar por transferencia:<br>
             Alias <b>${esc(Store.s.config.alias || '—')}</b><br>
             CBU <span style="font-family:monospace">${esc(Store.s.config.cbu || '—')}</span><br>
             ${esc(Store.s.config.cuenta || '')}</p>
           <p>Después de pagar, informá el pago desde la app y te llega el recibo.</p>`,
          { texto:'Ver mi cupón en la app', url:urlApp('expensas') }) });
      resultados.push({ ...x, ok:envio.ok, error:envio.error });
      return envio.ok;
    }));
    n += r.filter(Boolean).length;
    if (i + 10 < gente.length) await new Promise(res => setTimeout(res, 800));
  }
  if (!silencioso && !detalle) toast(n ? `${plural(n, 'cupón enviado', 'cupones enviados')} por correo` : `No salió ninguno: ${resultados.find(r => r.error)?.error || 'quedaron en la bandeja de salida'}`, n ? 'mail' : 'alert');
  return detalle ? resultados : n;
}

A['reclamar-deuda'] = el => {
  const lote = el.dataset.v, saldo = saldoLote(lote);
  const dest = Store.s.users.filter(u => u.casa === lote && u.estado === 'aprobado');
  Store.cambiar(s => {
    if (dest.length){
      const canal = 'admin';
      dest.forEach(u => { let h = s.privados.find(z => z.userId === u.id && (z.con || 'admin') === canal);
        if (!h){ h = { id:uid(), userId:u.id, con:canal, msgs:[] }; s.privados.push(h); }
        h.msgs.push({ id:uid(), from:'admin', text:`Hola: tu lote registra un saldo pendiente de ${plata(saldo)}. Podés verlo y pagarlo desde Expensas. Si querés armar un plan de pagos, escribinos por acá.`, createdAt:Date.now() }); });
      notificar(s, { para:dest.map(u => u.id), titulo:'Saldo pendiente de expensas', texto:plata(saldo), icon:'wallet', color:'danger', link:'expensas', sonido:true });
    }
    auditar(s, 'Reclamó deuda', `${lote} · ${plata(saldo)}`);
  });
  toast(dest.length ? 'Reclamo enviado al vecino' : 'Ese lote todavía no tiene vecinos con cuenta', dest.length ? 'send' : 'alert');
};
A['marcar-presentado'] = el => {
  Store.cambiar(s => { s.impuestos.unshift({ id:uid(), periodo:el.dataset.p, tipo:el.dataset.v, fecha:hoyISO(), por:yo().id, at:Date.now() });
    auditar(s, 'Marcó una presentación impositiva', `${el.dataset.v} · ${el.dataset.p}`); });
  toast('Anotado', 'check');
};
A['exportar-contable'] = el => {
  const periodo = el.dataset.v || periodoAnterior(periodoHoy());
  const gs = gastosDe(periodo);
  const cab = ['Periodo','Fecha','Proveedor','CUIT','Tipo','Numero','Rubro','Columna','Neto','IVA','Total','Ret.Ganancias','Ret.SegSocial','Cuota','Lote','Detalle'];
  const filas = gs.map(g => [periodo, g.fecha || '', g.proveedor, g.cuit, g.tipoComp, g.nroComp, RUBROS[g.rubro] || g.rubro, COLUMNAS[g.columna] || g.columna,
    g.neto || 0, g.iva || 0, g.total || 0, g.retGan || 0, g.retSuss || 0, g.cuotaN ? `${g.cuotaN}/${g.cuotaDe}` : '', g.lote || '', g.detalle || '']);
  const csv = [cab, ...filas].map(f => f.map(v => `"${String(v).replace(/"/g, '""')}"`).join(';')).join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob(['﻿' + csv], { type:'text/csv;charset=utf-8' }));
  a.download = `gastos-${periodo}-bahia-cauquen.csv`; a.click();
  toast('Planilla descargada', 'download');
};
A['mandar-contador'] = async el => {
  const periodo = el.dataset.v || periodoAnterior(periodoHoy()), c = cfgExp(), gs = gastosDe(periodo);
  if (!c.contador){ toast('Cargá el correo del contador en Ajustes', 'mail'); return; }
  const retGan = gs.reduce((a, g) => a + (+g.retGan || 0), 0), retSuss = gs.reduce((a, g) => a + (+g.retSuss || 0), 0);
  const ok = await Correo.enviar({ para:c.contador, asunto:`Barrio ${Store.s.config.nombre} · cierre ${nombrePeriodo(periodo)}`, tipo:'contador',
    html:Correo.plantilla(`Cierre de ${nombrePeriodo(periodo)}`,
      `<p>Resumen del período:</p><ul>
        <li>Comprobantes: ${gs.length}</li>
        <li>Total de gastos: <b>${plata(gs.reduce((a, g) => a + (+g.total || 0), 0))}</b></li>
        <li>IVA discriminado: ${plata(gs.reduce((a, g) => a + (+g.iva || 0), 0))}</li>
        <li>Retenciones de Ganancias: ${plata(retGan)}</li>
        <li>Retenciones de Seguridad Social: ${plata(retSuss)}</li></ul>
      <p>La planilla con el detalle se envía adjunta desde la Administración.</p>`, { texto:'Abrir la app', url:urlApp() }) });
  toast(ok ? 'Aviso enviado al contador' : 'Quedó en la bandeja de salida', 'mail');
  A['exportar-contable']({ dataset:{ v:periodo } });
};

/* ---------- automatizaciones de expensas ---------- */
REGLAS.push(
  /* 'exp-emitir' y 'exp-vence' se sacaron el 26-09-2026: repetían los avisos de
     admin.js (salían dos "Hoy vencen las expensas"). Quedan los de admin.js. */
  { id:'exp-arca', n:'ARCA: aviso de vencimientos', d:'Cinco días antes de cada presentación del mes, avisa a la Administración.',
    run(s, hoy){ const per = periodoAnterior(hoy.slice(0, 7)); let n = 0;
      presentacionesDe(per).forEach(p => { if (p.estado === 'presentado') return;
        if (hoy === sumarDias(p.vence, -5) || hoy === p.vence)
          n += marca(s, `arca-${p.id}-${per}-${hoy}`, () => notificar(s, { para:'rol:admin', titulo:`${p.nombre}: vence ${fechaCorta(p.vence)}`, texto:`Período ${nombrePeriodo(per)}`, icon:'clipboard', color:'accent', link:'contabilidad:impositivo' })); });
      return n; } },
);

/* "Ver cuenta" desde el padrón, la ficha del lote o la lista de morosos. */
/* =========================================================
   CONFIRMAR UN PAGO Y EMITIR EL RECIBO
   (Estas acciones se habían perdido en una edición del 20-09 y los botones
   "Confirmar y emitir recibo", "Rechazar", "Registrar un pago a mano" y
   "Certificado de deuda" no hacían nada. Vuelven, y la confirmación queda
   en una función que usa también la acreditación automática de Mercado
   Pago.)
   ========================================================= */
function confirmarPago(id, { auto = false } = {}){
  let numero = '';
  Store.cambiar(s => {
    const pago = s.pagos.find(x => x.id === id); if (!pago || pago.estado === 'confirmado') return;
    const c = cfgExp();
    numero = 'R-' + String((c.reciboNro || 0) + 1).padStart(5, '0');
    s.config.exp = Object.assign({}, c, { reciboNro: (c.reciboNro || 0) + 1 });
    pago.estado = 'confirmado'; pago.recibo = numero; pago.confirmadoPor = auto ? 'sistema' : yo().id; pago.confirmadoAt = Date.now();
    s.recibos.unshift({ id:uid(), numero, lote:pago.lote, monto:pago.monto, fecha:pago.fecha, medio:pago.medio,
      concepto:`Expensas${pago.nota ? ' · ' + pago.nota : ''}`, pagoId:pago.id, at:Date.now(), por: auto ? 'sistema' : yo().id });
    notificar(s, { para:s.users.filter(u => u.casa === pago.lote).map(u => u.id), titulo:'Recibimos tu pago', texto:`${plata(pago.monto)} · recibo ${numero}`, icon:'check', color:'ok', link:'expensas', sonido:true });
    auditar(s, auto ? 'Acreditó solo un pago de Mercado Pago' : 'Confirmó un pago', `${pago.lote} · ${plata(pago.monto)} · recibo ${numero}${pago.mpId ? ' · MP ' + pago.mpId : ''}`);
  });
  if (numero) Comprobantes.vencer(Store.s.pagos.find(x => x.id === id));
  return numero;
}
A['confirmar-pago'] = el => { if (confirmarPago(el.dataset.id)) toast('Pago confirmado y recibo emitido', 'check'); };
A['rechazar-pago'] = async el => {
  if (!await confirmar('Rechazar el pago', 'El vecino recibe el aviso para que lo revise.', { si:'Rechazar', peligro:true })) return;
  Store.cambiar(s => { const p = s.pagos.find(x => x.id === el.dataset.id); if (!p) return; p.estado = 'rechazado';
    notificar(s, { para:s.users.filter(u => u.casa === p.lote).map(u => u.id), titulo:'No pudimos confirmar tu pago', texto:`${plata(p.monto)} · revisá el comprobante o escribinos`, icon:'alert', color:'danger', link:'expensas' });
    auditar(s, 'Rechazó un pago informado', `${p.lote} · ${plata(p.monto)}`); });
  Comprobantes.vencer(Store.s.pagos.find(x => x.id === el.dataset.id));

};
A['pago-manual'] = () => hoja('Registrar un pago', `<form data-f="pago-manual">
  <div class="field"><label>Lote</label><select name="lote" required>${LOTES.map(L => `<option value="Lote ${L.lote}">${esc(nombreLote(L))}${propietarioDe('Lote ' + L.lote) ? ' · ' + esc(propietarioDe('Lote ' + L.lote)) : ''}</option>`).join('')}</select></div>
  <div class="grid2"><div class="field"><label>Importe</label><input type="number" step="0.01" name="monto" required></div>
    <div class="field"><label>Fecha</label><input type="date" name="fecha" required value="${hoyISO()}"></div></div>
  <div class="field"><label>Medio</label><select name="medio"><option>Transferencia</option><option>Depósito</option><option>Efectivo</option><option>Cheque</option><option>Mercado Pago</option><option>Otro</option></select></div>
  <div class="field"><label>Nota</label><input name="nota" maxlength="120"></div>
  <button class="btn btn-pri btn-block">${I('check')}Registrar y emitir recibo</button></form>`);
F['pago-manual'] = d => {
  const id = uid();
  Store.cambiar(s => { s.pagos.unshift({ id, lote:d.lote, userId:yo().id, monto:+d.monto, fecha:d.fecha, medio:d.medio, nota:(d.nota || '').trim(), estado:'informado', at:Date.now() }); });
  cerrarHoja();
  if (confirmarPago(id)) toast('Pago registrado y recibo emitido', 'check');
};
A['certificado-deuda'] = el => imprimir(`Certificado de deuda · ${el.dataset.v}`, certificadoHTML(el.dataset.v));

/* =========================================================
   PAGO ONLINE CON MERCADO PAGO
   El vecino toca "Pagar online", el Apps Script arma el enlace de pago
   (con el access token que vive SOLO en el Apps Script) y Mercado Pago
   cobra: tarjeta de crédito o débito, saldo en cuenta, billeteras o QR.
   Al volver, la app le pregunta a Mercado Pago (a través del Apps Script)
   cómo salió. Y la app de la Administración, cada vez que se abre y cada
   15 minutos, trae los pagos aprobados de los últimos días y acredita
   solos los que falten, con su recibo: nadie tiene que confirmar a mano,
   y aunque el vecino cierre el navegador sin volver, el pago entra igual.
   ========================================================= */
const MercadoPago = {
  activo(){ return !!cfgExp().mpOnline && typeof Nube !== 'undefined' && Nube.activa() && !!Correo.datos(); },
  async pedir(cuerpo){
    const d = Correo.datos(); if (!d) throw new Error('Falta configurar el Apps Script (Ajustes → Correo)');
    const r = await fetch(d.url, { method:'POST', headers:{ 'Content-Type':'text/plain;charset=utf-8' }, body: JSON.stringify({ ...cuerpo, clave:d.clave }) });
    const j = await r.json();
    if (!j || !j.ok) throw new Error((j && j.error) || 'El Apps Script contestó que no');
    return j;
  },
  loteDeRef: ref => (String(ref || '').split('|')[0] || '').trim(),
  /* Un pago de Mercado Pago tiene SIEMPRE el mismo id en la app
     ("mp-<número de operación>"): lo anote el vecino al volver, el aviso de
     Mercado Pago (Apps Script) o la Administración al conciliar, es uno
     solo. Antes cada uno inventaba su id y podía quedar anotado dos veces. */
  idDe: mpId => 'mp-' + String(mpId),
  anotar(pago, { lote, userId } = {}){
    lote = lote || this.loteDeRef(pago.ref) || miLote();
    const id = this.idDe(pago.id);
    if (Store.s.pagos.some(p => p.id === id || String(p.mpId) === String(pago.id))) return false;
    Store.cambiar(s => {
      s.pagos.unshift({ id, lote, userId: userId || yo()?.id || 'sistema', monto:+pago.monto, fecha:(pago.fecha || '').slice(0, 10) || hoyISO(), medio:'Mercado Pago',
        nota:`${pago.prueba ? 'PRUEBA · ' : ''}Aprobado por Mercado Pago${pago.medio ? ' · ' + pago.medio : ''}`, mpId:String(pago.id), estado:'informado', ...(pago.prueba ? { prueba:true } : {}), at:Date.now() });
      notificar(s, { para:'rol:admin', titulo:`${pago.prueba ? 'Pago de PRUEBA' : 'Pago con Mercado Pago'} · ${lote}`, texto: pago.prueba ? `${plata(+pago.monto)} · cuenta de prueba: no cuenta para el saldo` : `${plata(+pago.monto)} · aprobado y descontado del saldo`, icon:'wallet', color:'ok', link:'cobranzas:cobranzas' });
    });
    return true;
  },
  /* =========================================================
     PAGAR Y VOLVER SOLO (pedido de Claudio, 26-09-2026)
     El pago se abre en una ventana aparte, arriba de la app, que queda
     tal cual estaba. Cuando Mercado Pago aprueba, esa ventana muestra
     "¡Pago aprobado!" y a los 3 segundos se cierra sola (pago.html), y la
     app —que mientras tanto le pregunta a Mercado Pago cada 4 segundos
     por esa operación— anota el pago, descuenta el saldo y avisa a la
     Administración. En el iPhone con la app instalada no hay ventanas
     aparte: se va a Mercado Pago en la misma pantalla y al volver la app
     reabre las ventanas donde estaba.
     ========================================================= */
  esperando:null,
  canal:null,
  escuchar(){
    if (this.canal || typeof BroadcastChannel === 'undefined') return;
    try {
      this.canal = new BroadcastChannel('bhc-pago');
      this.canal.onmessage = e => { const m = e.data || {}; if (m.tipo !== 'pago' || !this.esperando) return;
        try { this.canal.postMessage({ tipo:'recibido', id:m.id }); } catch(err){}
        if (m.id && m.id !== 'null') this.verificar(m.id); };
    } catch(e){}
  },
  vigilar(){
    this.escuchar();
    clearInterval(this.reloj);
    this.reloj = setInterval(async () => {
      const w = this.esperando; if (!w){ clearInterval(this.reloj); return; }
      if (Date.now() - w.desde > 30 * MIN || (w.cerradaAt && Date.now() - w.cerradaAt > 3 * MIN)){ this.esperando = null; clearInterval(this.reloj); return; }
      if (w.ventana && w.ventana.closed && !w.cerradaAt) w.cerradaAt = Date.now();
      try { const j = await this.pedir({ accion:'mp-ref', ref:w.ref }); if (j.pago) this.resultado(j.pago); } catch(e){}
    }, 4000);
  },
  async verificar(id){
    try { const { pago } = await this.pedir({ accion:'mp-verificar', pago:id }); this.resultado(pago); }
    catch(e){ toast('No se pudo consultar el pago: ' + e.message, 'alert'); }
  },
  resultado(pago){
    if (!pago) return;
    const w = this.esperando;
    if (pago.estado === 'approved'){
      if (w && w.ref && pago.ref && pago.ref !== w.ref && this.loteDeRef(pago.ref) !== w.lote) return;
      this.esperando = null; clearInterval(this.reloj);
      try { if (w && w.ventana && !w.ventana.closed) w.ventana.close(); } catch(e){}
      this.anotar(pago, { lote: w && w.lote });
      this.festejar(pago);
    } else if (['rejected', 'cancelled'].includes(pago.estado) && w){
      this.esperando = null; clearInterval(this.reloj);
      hoja('El pago no salió', `${aviso('danger', 'alert', 'Mercado Pago no aprobó el pago', 'No se cobró nada. Podés intentar con otro medio o con otra tarjeta.')}
        <button class="btn btn-pri btn-block" data-a="pagar-expensas">Intentar de nuevo</button>`);
    } else if (['pending', 'in_process', 'authorized'].includes(pago.estado) && w && !w.avisoPendiente){
      w.avisoPendiente = true;
      toast('Mercado Pago está procesando el pago: se acredita solo cuando lo apruebe', 'clock');
    }
  },
  /* El cartel de "aprobado": se cierra solo a los 3 segundos y deja al
     vecino exactamente donde estaba. */
  festejar(pago){
    const lote = this.loteDeRef(pago.ref) || miLote();
    const saldo = saldoLote(lote);
    hoja('¡Pago aprobado!', `<div class="pago-ok">${I('check')}<b>${plata(+pago.monto)}</b><span>${esc(lote)} · operación ${esc(pago.id)}</span></div>
      <p class="small center" style="margin:10px 0 0">${pago.prueba ? '<b>Pago de PRUEBA</b> (cuenta de prueba de Mercado Pago): el circuito anduvo, pero no descuenta tu saldo ni genera recibo.'
        : `Ya se descontó de tu saldo${saldo > .5 ? ` (te quedan ${plata(saldo)})` : ': tu cuenta está al día'}. El recibo te llega solo.`}</p>
      <p class="muted small center" id="pagoCuenta">Volvés a la app en 3…</p>`, { ancho:'420px' });
    let n = 3;
    const t = setInterval(() => { n--; const el = $('#pagoCuenta'); if (el) el.textContent = `Volvés a la app en ${n}…`;
      if (n <= 0){ clearInterval(t); if (el) cerrarHoja(); refrescar(); } }, 1000);
  },
  /* Se vuelve de Mercado Pago en la misma pantalla (iPhone instalada, o
     si el navegador bloqueó la ventana): la dirección trae el número. */
  async alVolver(){
    const q = new URLSearchParams(location.search);
    const id = q.get('payment_id') || q.get('collection_id');
    if (!q.has('mp')) return;

    this.limpiarDireccion();
    const esperar = (n = 0) => new Promise(ok => { const t = () => (yo() && Nube.arrancada) || n++ > 60 ? ok() : setTimeout(t, 250); t(); });
    await esperar();
    /* Reabrir las ventanas donde estaba antes de ir a pagar. */
    try { const pila = JSON.parse(sessionStorage.getItem('bhc.antesDelPago') || '[]'); sessionStorage.removeItem('bhc.antesDelPago');
      pila.filter(v => v && v.id && v.id !== 'inicio' && R[v.id]).forEach(v => abrir(v.id, v.param || '')); } catch(e){}
    if (!id || id === 'null'){ const st = q.get('status') || q.get('collection_status'); if (st && st !== 'null') toast('El pago no se completó', 'info'); return; }
    this.esperando = { ref:q.get('external_reference') || '', lote:miLote(), desde:Date.now() };
    await this.verificar(id);
  },
  limpiarDireccion(){
    const q = new URLSearchParams(location.search);
    ['mp','payment_id','collection_id','collection_status','status','external_reference','payment_type','merchant_order_id','preference_id','site_id','processing_mode','merchant_account_id'].forEach(k => q.delete(k));
    history.replaceState(history.state, '', location.pathname + (q.toString() ? '?' + q : '') + location.hash);
  },
  /* =========================================================
     LA ADMINISTRACIÓN CONCILIA SOLA
     Trae de Mercado Pago los pagos aprobados de los últimos 20 días,
     anota los que falten y los pasa a recibo. Y al revés: un pago que dice
     ser de Mercado Pago y que Mercado Pago no tiene como aprobado se
     rechaza (el saldo vuelve y el vecino recibe el aviso). Así nadie puede
     "hacerse el que pagó" escribiendo un pago falso.
     Corre al abrir la app, cada 5 minutos y apenas aparece un pago nuevo.
     ========================================================= */
  conciliando:false, ultima:0,
  async conciliar(forzar = false){
    if (!esAdmin() || !this.activo() || this.conciliando) return 0;
    if (!forzar && Date.now() - this.ultima < 15 * MIN) return 0;
    this.conciliando = true; this.ultima = Date.now();
    let n = 0;
    try {
      const { pagos } = await this.pedir({ accion:'mp-recientes', dias:20 });
      const aprobados = new Set();
      for (const mp of pagos || []){
        const lote = this.loteDeRef(mp.ref);
        if (!LOTES.some(L => 'Lote ' + L.lote === lote)) continue;
        aprobados.add(String(mp.id));
        const ya = Store.s.pagos.find(p => String(p.mpId) === String(mp.id));
        if (ya && ya.estado !== 'informado') continue;
        if (!ya) this.anotar(mp, { lote, userId:'sistema' });
        if (mp.prueba) continue;   /* de prueba: se ve, pero no se pasa a recibo */
        const p = Store.s.pagos.find(x => String(x.mpId) === String(mp.id));
        if (p && confirmarPago(p.id, { auto:true })) n++;
      }
      /* Los que dicen ser de Mercado Pago y no están entre los aprobados. */
      for (const p of Store.s.pagos.filter(x => x.estado === 'informado' && esPagoMP(x) && !esPrueba(x) && !aprobados.has(String(x.mpId)))){
        try {
          const { pago } = await this.pedir({ accion:'mp-verificar', pago:p.mpId });
          if (pago.estado === 'approved' && this.loteDeRef(pago.ref) === p.lote && Math.abs(+pago.monto - +p.monto) < 1){ if (confirmarPago(p.id, { auto:true })) n++; }
          else if (!['pending', 'in_process', 'authorized'].includes(pago.estado)) this.rechazarFalso(p, pago.estado);
        } catch(e){ if (/inválido|404|not found/i.test(e.message)) this.rechazarFalso(p, 'no existe'); }
      }
      if (n) toast(`Se acreditaron solos ${plural(n, 'pago', 'pagos')} de Mercado Pago`, 'wallet');
      this.error = '';
    } catch(e){ console.warn('Mercado Pago', e.message); this.error = e.message; }
    this.conciliando = false;
    return n;
  },
  rechazarFalso(p, motivo){
    Store.cambiar(s => { const x = s.pagos.find(y => y.id === p.id); if (!x || x.estado !== 'informado') return; x.estado = 'rechazado'; x.rechazo = `Mercado Pago no lo tiene como aprobado (${motivo})`;
      notificar(s, { para:s.users.filter(u => u.casa === x.lote).map(u => u.id), titulo:'Un pago no se pudo acreditar', texto:`${plata(x.monto)} · Mercado Pago no lo tiene como aprobado. Si pagaste, escribinos con el comprobante.`, icon:'alert', color:'danger', link:'expensas' });
      auditar(s, 'Rechazó solo un pago de Mercado Pago no aprobado', `${x.lote} · ${plata(x.monto)} · MP ${x.mpId} · ${motivo}`); });
  },
};
/* La ventana de pago se abre EN EL MISMO TOQUE (si se abre después de
   esperar al Apps Script, el navegador la bloquea), con un "Abriendo…",
   y recién después se le pone la dirección de Mercado Pago. */
A['pago-mp'] = async el => {
  const lote = miLote(), pagar = aPagar(lote), u = yo(), cuenta = cuentaLote(lote);
  const debe = Math.max(0, cuenta.saldo - cuenta.informado);
  const total = Math.round((pagar.recargo && debe ? conCentavosDelLote(debe * (1 + cfgExp().recargo2 / 100), lote).total : debe) * 100) / 100;
  if (!(total >= 100)){ toast('No hay saldo para pagar', 'check'); return; }
  const iPhoneInstalada = navigator.standalone === true;
  let w = null;
  if (!iPhoneInstalada){ try { w = window.open('', 'bhc-pago'); if (w) w.document.write(`<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><title>Pago · Barrio</title><body style="margin:0;font:600 17px system-ui;display:grid;place-items:center;height:100vh;color:#0d6b66;background:#f2f4f3">Abriendo Mercado Pago…</body>`); } catch(e){ w = null; } }
  el.disabled = true;
  toast('Abriendo Mercado Pago…', 'wallet');
  try {
    sessionStorage.setItem('bhc.antesDelPago', JSON.stringify(PILA.map(v => ({ id:v.id, param:v.param || '' }))));
    const j = await MercadoPago.pedir({ accion:'mp-crear', lote, periodo:pagar.periodo || periodoHoy(), monto:total, uid:u.id, email:u.email,
      titulo:`Expensas ${nombrePeriodo(pagar.periodo || periodoHoy())} · ${lote} · Barrio ${Store.s.config.nombre}`,
      volver: new URL('pago.html', location.href).href, base:(configFirebase() || {}).databaseURL || '' });
    if (w && !w.closed){
      w.location.href = j.url;
      MercadoPago.esperando = { ref:j.ref, lote, desde:Date.now(), ventana:w, monto:total };
      MercadoPago.vigilar();
      el.disabled = false;
      hoja('Pagando con Mercado Pago', `${aviso('info', 'wallet', 'Se abrió Mercado Pago en otra ventana', 'Pagá ahí con tarjeta, saldo, QR o tu billetera. Cuando se apruebe, esa ventana se cierra sola y volvés acá, con el saldo ya descontado.')}
        <button class="btn btn-sec btn-block" data-a="cerrar-hoja">Entendido</button>`);
    } else location.href = j.url;
  } catch(e){ try { if (w) w.close(); } catch(err){} el.disabled = false; toast('No se pudo abrir el pago: ' + e.message, 'alert'); }
};
A['mp-conciliar'] = async () => { const n = await MercadoPago.conciliar(true); if (!n) toast(MercadoPago.error ? 'Mercado Pago: ' + MercadoPago.error : 'No hay pagos nuevos de Mercado Pago', 'wallet'); refrescar(); };
setTimeout(() => MercadoPago.alVolver(), 500);
setInterval(() => { if (yo() && esAdmin()) MercadoPago.conciliar(); }, 5 * MIN);
/* Apenas aparece un pago de Mercado Pago sin recibo (lo anotó el vecino
   o el aviso de Mercado Pago), la Administración lo concilia al minuto. */
setInterval(() => { if (yo() && esAdmin() && Store.s.pagos.some(p => p.estado === 'informado' && esPagoMP(p) && !esPrueba(p)) && Date.now() - MercadoPago.ultima > MIN) MercadoPago.conciliar(true); }, 20 * 1000);
/* Borrar los pagos de prueba cuando se termina de probar. */
A['pagos-prueba-borrar'] = async () => {
  const n = Store.s.pagos.filter(esPrueba).length; if (!n) return toast('No hay pagos de prueba', 'check');
  if (!await confirmar('Borrar los pagos de prueba', `Se borran ${plural(n, 'pago de prueba', 'pagos de prueba')} de Mercado Pago. No tocan saldos ni recibos.`, { si:'Borrar', peligro:true })) return;
  Store.cambiar(s => { s.pagos = s.pagos.filter(p => !esPrueba(p)); auditar(s, 'Borró los pagos de prueba de Mercado Pago', plural(n, 'pago')); });
  toast('Pagos de prueba borrados', 'check');
};

A['ver-cuenta'] = el => { cerrarHoja(); abrir('expensas', el.dataset.v); };
/* Una vez por sesión, la Administración borra los comprobantes vencidos. */
setTimeout(() => { if (yo() && esAdmin()) Comprobantes.limpiar(); }, 60 * 1000);
