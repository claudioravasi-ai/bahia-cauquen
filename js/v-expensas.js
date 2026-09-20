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

/* ---------- cálculo ---------- */
const gastosDe = p => Store.s.gastos.filter(g => g.periodo === p && !g.anulado);
const liquidacionDe = p => Store.s.liquidaciones.find(l => l.periodo === p);
const liquidacionesEmitidas = () => Store.s.liquidaciones.filter(l => l.estado === 'emitida').sort((a, b) => a.periodo.localeCompare(b.periodo));
const cuotaDe = (l, lote) => (l.cuotas || []).find(c => c.lote === lote);
const pagosDe = lote => Store.s.pagos.filter(p => p.lote === lote && p.estado === 'confirmado');

/* Movimientos de un lote: cada liquidación emitida es un cargo y cada pago
   confirmado, un crédito. El saldo sale de la resta. */
function cuentaLote(lote){
  const movs = [];
  liquidacionesEmitidas().forEach(l => {
    const c = cuotaDe(l, lote); if (!c) return;
    movs.push({ fecha:l.emitidaAt, periodo:l.periodo, detalle:`Expensas ${nombrePeriodo(l.periodo)}`, debe:c.total, tipo:'cuota' });
    if (c.interes) movs.push({ fecha:l.emitidaAt, periodo:l.periodo, detalle:'Intereses por saldo impago', debe:c.interes, tipo:'interes' });
  });
  Store.s.pagos.filter(p => p.lote === lote && p.estado !== 'rechazado').forEach(p => {
    movs.push({ fecha:p.fecha ? fechaDe(p.fecha).getTime() : p.at, detalle: p.estado === 'confirmado' ? `Pago recibido (${p.medio})` : `Pago informado, sin confirmar (${p.medio})`,
      haber:p.monto, tipo:'pago', pendiente:p.estado !== 'confirmado', id:p.id });
  });
  movs.sort((a, b) => a.fecha - b.fecha);
  let saldo = 0;
  movs.forEach(m => { saldo += (m.debe || 0) - (m.pendiente ? 0 : (m.haber || 0)); m.saldo = saldo; });
  const informado = Store.s.pagos.filter(p => p.lote === lote && p.estado === 'informado').reduce((a, p) => a + p.monto, 0);
  return { movs, saldo, informado };
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
  const recargo = hoy > v1 ? cuenta.saldo * c.recargo2 / 100 : 0;
  return { saldo:cuenta.saldo, total:cuenta.saldo + recargo, recargo, periodo:l.periodo, vto1:v1, vto2:v2, vencido:hoy > v2, informado:cuenta.informado };
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
    const interes = anterior && saldoPrevio > 0 ? saldoPrevio * c.interesMensual / 100 : 0;
    const total = expensas + mejoras + part + multa + c.fondoFijo;
    return { lote, uf:L.uf, coef:L.coef, expensas, mejoras, particulares:part, multas:multa, fondo:c.fondoFijo, interes, total };
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
  const total2 = total1 * (1 + cf.recargo2 / 100);
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
    que otorga al certificado de deuda por expensas el carácter de título ejecutivo. Intereses aplicados: ${c.interesMensual} % mensual sobre el saldo impago.</p>
    <div class="firma"><div>Administración</div><div>Consejo de administración</div></div>`;
}

/* =========================================================
   VENTANA DEL VECINO: su carpeta
   ========================================================= */
R.expensas = {
  titulo: 'Expensas', icon: 'wallet', color: 'wood', sub: 'Tu cuenta, tus cupones y tus pagos',
  render(p){
    const u = yo(), lote = miLote(), L = loteDe(u);
    if (esAdmin() && !p) return `${superficie({ v:'contabilidad', icon:'wallet', color:'wood', t:'Administrar las expensas del barrio', s:'Gastos, cierre de mes, cobranzas e impositivo', cls:'acento' })}
      ${sec('Tu propia cuenta')}${carpetaVecino(lote)}`;
    if (!L) return vacio('wallet', 'Tu cuenta todavía no tiene un lote asignado. Avisale a la Administración.');
    return carpetaVecino(lote);
  },
};
function carpetaVecino(lote){
  const cuenta = cuentaLote(lote), pagar = aPagar(lote), c = cfgExp();
  const L = lote && typeof LOTES !== 'undefined' ? LOTES.find(x => 'Lote ' + x.lote === lote) : null;
  const emitidas = liquidacionesEmitidas().slice().reverse();
  const misPagos = Store.s.pagos.filter(p => p.lote === lote).sort((a, b) => b.at - a.at);
  const misRecibos = Store.s.recibos.filter(r => r.lote === lote).sort((a, b) => b.at - a.at);
  const alDia = cuenta.saldo <= 0.5;
  return `
    <div class="card" style="background:${alDia ? 'var(--g-ok)' : pagar.vencido ? 'var(--g-danger)' : 'var(--g-wood)'};color:#fff;border:0">
      <div class="small" style="opacity:.85">${alDia ? 'Tu cuenta está al día' : pagar.vencido ? 'Tenés un saldo vencido' : 'Saldo a pagar'}</div>
      <div style="font-size:32px;font-weight:800;letter-spacing:-1px;margin:2px 0">${plata(Math.max(0, cuenta.saldo))}</div>
      ${pagar.periodo ? `<div class="small" style="opacity:.92">${nombrePeriodo(pagar.periodo)} · 1º vto ${fechaCorta(pagar.vto1)} · 2º vto ${fechaCorta(pagar.vto2)}${pagar.recargo ? ` · con recargo: ${plata(pagar.total)}` : ''}</div>` : ''}
      ${cuenta.informado ? `<div class="small" style="opacity:.92;margin-top:6px">${I('clock')} ${plata(cuenta.informado)} informados, esperando confirmación</div>` : ''}
      ${!alDia ? `<div class="btns" style="margin-top:14px"><button class="btn btn-sm" style="background:#fff;color:#7a3a12" data-a="pagar-expensas">${I('wallet')}Pagar</button>
        <button class="btn btn-sm" style="background:rgba(255,255,255,.2);color:#fff" data-a="informar-pago">${I('camera')}Ya pagué</button></div>` : ''}
    </div>
    ${L ? `<div class="card plana small" style="color:var(--ink-2)">${I('info')} ${esc(lote)} · UF ${L.uf} · coeficiente <b>${L.coef.toFixed(4)} %</b>. De cada $100 de gastos del barrio, a tu lote le corresponden $${L.coef.toFixed(2)}.</div>` : ''}
    ${sec('Tus cupones')}
    ${emitidas.length ? emitidas.slice(0, 12).map(l => { const cu = cuotaDe(l, lote); if (!cu) return '';
      return `<button class="superficie" data-a="ver-cupon" data-v="${l.periodo}"><span class="ic ic-wood">${I('file')}</span>
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
    ${misPagos.some(p => p.estado === 'informado') ? sec('Pagos informados') + misPagos.filter(p => p.estado === 'informado').map(p => `<div class="card" style="padding:12px 14px">
      <div class="row">${p.foto ? fotoHTML(p.foto, 'mini-foto') : `<span class="ic ic-warn" style="width:44px;height:44px;border-radius:12px;display:grid;place-items:center">${I('clock')}</span>`}
      <div class="grow"><b>${plata(p.monto)}</b><div class="muted small">${fechaCorta(p.fecha)} · ${esc(p.medio)} · esperando que la Administración lo confirme</div></div></div></div>`).join('') : ''}
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
A['pagar-expensas'] = () => {
  const c = cfgExp(), pagar = aPagar(miLote()), cfg = Store.s.config;
  const texto = `Expensas ${nombrePeriodo(pagar.periodo || periodoHoy())} · ${miLote()} · ${plata(pagar.total)}`;
  hoja('Pagar las expensas', `
    <div class="card plana center"><div class="muted small">Total a pagar${pagar.recargo ? ' (con recargo)' : ''}</div>
      <div style="font-size:30px;font-weight:800;color:var(--brand)">${plata(pagar.total)}</div>
      ${pagar.periodo ? `<div class="muted small">${nombrePeriodo(pagar.periodo)}</div>` : ''}</div>
    ${sec('Transferencia')}
    <div class="card lista">
      <div class="it"><div class="txt"><b>Alias</b><span>${esc(cfg.alias || '—')}</span></div><button class="btn btn-xs btn-pri" data-a="copiar" data-v="${esc(cfg.alias || '')}">${I('copy')}Copiar</button></div>
      <div class="it"><div class="txt"><b>CBU</b><span class="mono small">${esc(cfg.cbu || '—')}</span></div><button class="btn btn-xs btn-pri" data-a="copiar" data-v="${esc(cfg.cbu || '')}">${I('copy')}Copiar</button></div>
      <div class="it"><div class="txt"><b>Importe</b><span>${plata(pagar.total)}</span></div><button class="btn btn-xs btn-sec" data-a="copiar" data-v="${(pagar.total || 0).toFixed(2)}">${I('copy')}</button></div>
      <div class="it"><div class="txt"><b>Referencia</b><span>${esc(texto)}</span></div><button class="btn btn-xs btn-sec" data-a="copiar" data-v="${esc(texto)}">${I('copy')}</button></div></div>
    ${c.mpLink ? `<a class="btn btn-pri btn-block" href="${esc(c.mpLink)}" target="_blank" rel="noopener">${I('wallet')}Pagar con Mercado Pago</a>` : ''}
    <button class="btn btn-ok btn-block" style="margin-top:10px" data-a="informar-pago">${I('camera')}Ya transferí: informar el pago</button>
    <p class="muted tiny" style="margin-top:10px">Cuando informás el pago con el comprobante, la Administración lo confirma y te llega el recibo a la app.</p>`);
};
A['informar-pago'] = () => {
  const pagar = aPagar(miLote());
  hoja('Informar un pago', `<form data-f="informar-pago">
    <div class="grid2"><div class="field"><label>Importe</label><input name="monto" type="number" step="0.01" min="1" required value="${(pagar.total || 0).toFixed(2)}"></div>
      <div class="field"><label>Fecha</label><input type="date" name="fecha" required max="${hoyISO()}" value="${hoyISO()}"></div></div>
    <div class="field"><label>Medio</label><select name="medio"><option>Transferencia</option><option>Depósito</option><option>Efectivo en la Administración</option><option>Mercado Pago</option><option>Otro</option></select></div>
    ${campoFoto('fotoPago', 'Comprobante')}
    <div class="field"><label>Nota (opcional)</label><input name="nota" maxlength="120" placeholder="Ej: pago parcial, o a cuenta del plan"></div>
    <button class="btn btn-pri btn-block">${I('send')}Informar el pago</button></form>`);
};
F['informar-pago'] = d => {
  const u = yo(), lote = miLote();
  Store.cambiar(s => {
    s.pagos.unshift({ id:uid(), lote, userId:u.id, monto:+d.monto, fecha:d.fecha, medio:d.medio, nota:(d.nota || '').trim(),
      foto:leerFoto(d.foto), estado:'informado', at:Date.now() });
    notificar(s, { para:'rol:admin', titulo:`Pago informado · ${lote}`, texto:`${plata(+d.monto)} · ${d.medio}`, icon:'wallet', color:'wood', link:'contabilidad:cobranzas' });
    auditar(s, 'Informó un pago', `${lote} · ${plata(+d.monto)}`);
  });
  cerrarHoja(); toast('Pago informado. La Administración lo va a confirmar.', 'check');
};

/* =========================================================
   VENTANA DE LA ADMINISTRACIÓN
   ========================================================= */
const TABS_CONTA = [['resumen','Resumen'],['gastos','Gastos'],['cierre','Cierre de mes'],['cobranzas','Cobranzas'],['morosos','Morosos'],['impositivo','ARCA']];
R.contabilidad = {
  titulo: 'Contabilidad', icon: 'wallet', color: 'wood', ancha: true, sub: 'Expensas del barrio',
  render(p){
    if (!esAdmin()) return vacio('lock', 'Solo para la Administración.');
    const [tab, sub] = String(p || 'resumen').split('|');
    const pend = Store.s.pagos.filter(x => x.estado === 'informado').length;
    return `<div class="tabs-in">${TABS_CONTA.map(([k, t]) => `<button class="${k === tab ? 'on' : ''}" data-a="abrir" data-v="contabilidad" data-p="${k}">${t}${k === 'cobranzas' && pend ? `<span class="dot-badge">${pend}</span>` : ''}</button>`).join('')}</div>
      ${(CONTA[tab] || CONTA.resumen)(sub)}`;
  },
};
const CONTA = {
  resumen(){
    const per = periodoHoy(), calc = calcularLiquidacion(per), ant = liquidacionDe(periodoAnterior(per));
    const deuda = LOTES.reduce((a, L) => a + Math.max(0, saldoLote('Lote ' + L.lote)), 0);
    const cobrado = Store.s.pagos.filter(p => p.estado === 'confirmado' && p.fecha >= per + '-01').reduce((a, p) => a + p.monto, 0);
    const morosos = LOTES.filter(L => saldoLote('Lote ' + L.lote) > 0.5).length;
    const emitida = liquidacionDe(per)?.estado === 'emitida';
    return `<div class="admin-hero" style="background:var(--g-wood)">
        <b style="font-size:18px">${nombrePeriodo(per)}</b>
        <div class="small" style="opacity:.85">${emitida ? 'Liquidación emitida' : `Borrador · ${plural(calc.gastos, 'gasto cargado', 'gastos cargados')}`}</div>
        <div class="garita-kpis"><div class="kpi"><b>${plataCorta(calc.totalGastos)}</b><span>Gastos del mes</span></div>
          <div class="kpi"><b>${plataCorta(cobrado)}</b><span>Cobrado</span></div>
          <div class="kpi"><b>${morosos}</b><span>Con deuda</span></div></div></div>
      ${ant ? `<div class="card plana small">Mes anterior (${nombrePeriodo(ant.periodo)}): ${plata(ant.totalGastos)} · variación ${(((calc.totalGastos - ant.totalGastos) / (ant.totalGastos || 1)) * 100).toFixed(1)} %</div>` : ''}
      <div class="mosaico">
        ${teja({ v:'contabilidad', p:'gastos', icon:'file', color:'wood', t:'Cargar gastos', s:'Facturas del mes', n:calc.gastos || '' })}
        ${teja({ v:'contabilidad', p:'cierre', icon:'zap', color:'brand', t:'Cerrar el mes', s: emitida ? 'Ya emitida' : 'Prorratear y emitir cupones' })}
        ${teja({ v:'contabilidad', p:'cobranzas', icon:'wallet', color:'ok', t:'Cobranzas', s:'Pagos informados', badge: Store.s.pagos.filter(x => x.estado === 'informado').length })}
        ${teja({ v:'contabilidad', p:'morosos', icon:'alert', color:'danger', t:'Morosos', s:plataCorta(deuda), n:morosos || '' })}
        ${teja({ v:'contabilidad', p:'impositivo', icon:'clipboard', color:'accent', t:'ARCA', s:'Libro de gastos y presentaciones' })}
        ${teja({ a:'exportar-contable', icon:'download', color:'sky', t:'Enviar al contador', s:'Planilla del mes' })}
      </div>
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
    return `<div class="chips">${meses.map(m => `<button class="chip ${m === periodo ? 'on' : ''}" data-a="abrir" data-v="contabilidad" data-p="gastos|${m}">${nombrePeriodo(m)}</button>`).join('')}</div>
      ${emitida ? aviso('warn', 'lock', 'Este período ya fue liquidado', 'Si cargás o cambiás un gasto, hay que volver a cerrar el mes.') : ''}
      ${superficie({ a:'nuevo-gasto', v:periodo, icon:'plus', t:'Cargar un gasto', s:'Factura, recibo o pago de servicio', cls:'acento' })}
      <div class="card"><div class="row" style="justify-content:space-between"><b>Total del período</b><b class="num" style="font-size:18px">${plata(total)}</b></div>
        <div class="muted small">${plural(gs.length, 'comprobante')}</div></div>
      ${Object.keys(RUBROS).filter(r => gs.some(g => +g.rubro === +r)).map(r => {
        const del = gs.filter(g => +g.rubro === +r), sub = del.reduce((a, g) => a + (+g.total || 0), 0);
        return `${sec(`${r} · ${RUBROS[r]}`, `<span class="muted small">${plata(sub)} · ${(sub / (total || 1) * 100).toFixed(1)} %</span>`)}
          ${del.map(g => `<div class="card" style="padding:12px 14px"><div class="row" style="align-items:flex-start">
            ${g.foto ? fotoHTML(g.foto, 'mini-foto') : `<span class="ic ic-wood" style="width:44px;height:44px;border-radius:12px;display:grid;place-items:center;flex:none">${I('file')}</span>`}
            <div class="grow"><b>${esc(g.proveedor)}</b><div class="muted small">${esc(g.tipoComp || '')} ${esc(g.nroComp || '')}${g.cuit ? ' · CUIT ' + esc(g.cuit) : ''}</div>
              <div class="muted small">${esc(COLUMNAS[g.columna])}${g.lote ? ' · ' + esc(g.lote) : ''}${g.cuotaN ? ` · pago ${g.cuotaN} de ${g.cuotaDe}` : ''}${g.retGan ? ' · ret. Gan. ' + plata(g.retGan) : ''}${g.retSuss ? ' · ret. SUSS ' + plata(g.retSuss) : ''}</div></div>
            <div style="text-align:right"><b class="num">${plata(g.total)}</b>
              <div class="btns" style="margin-top:6px;justify-content:flex-end"><button class="icon-btn" data-a="editar-gasto" data-id="${g.id}" aria-label="Editar">${I('edit')}</button>
                <button class="icon-btn" data-a="borrar-gasto" data-id="${g.id}" aria-label="Borrar">${I('trash')}</button></div></div></div></div>`).join('')}`;
      }).join('') || vacio('file', 'No hay gastos cargados en este período.')}`;
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
      ${sec('Cómo queda cada lote', `<button class="link" data-a="previsualizar" data-v="${periodo}">Ver las ${calc.cuotas.length} cuotas</button>`)}
      <div class="card lista">${calc.cuotas.slice(0, 6).map(c2 => `<div class="it"><div class="txt"><b>${esc(c2.lote)}</b><span>coef. ${c2.coef.toFixed(4)} %${c2.interes ? ' · interés ' + plata(c2.interes) : ''}</span></div><b class="num">${plata(c2.total)}</b></div>`).join('')}
        <div class="it"><div class="txt"><span class="muted small">y ${calc.cuotas.length - 6} lotes más…</span></div></div></div>
      <button class="btn btn-pri btn-block btn-grande" data-a="emitir-liquidacion" data-v="${periodo}" ${calc.gastos === 0 ? 'disabled' : ''}>${I('check')}Emitir la liquidación y los cupones</button>
      <p class="muted tiny" style="margin-top:8px">Al emitir, cada vecino recibe su cupón en la app y un aviso. Si tenés el correo configurado, también le llega por mail.</p>`;
  },

  cobranzas(){
    const informados = Store.s.pagos.filter(p => p.estado === 'informado').sort((a, b) => b.at - a.at);
    const confirmados = Store.s.pagos.filter(p => p.estado === 'confirmado').sort((a, b) => b.at - a.at).slice(0, 20);
    const mes = Store.s.pagos.filter(p => p.estado === 'confirmado' && p.fecha >= periodoHoy() + '-01').reduce((a, p) => a + p.monto, 0);
    return `<div class="card"><div class="row" style="justify-content:space-between"><b>Cobrado en ${nombrePeriodo(periodoHoy())}</b><b class="num" style="font-size:18px">${plata(mes)}</b></div></div>
      ${superficie({ a:'pago-manual', icon:'plus', t:'Registrar un pago a mano', s:'Cuando llega por fuera de la app', cls:'acento' })}
      ${sec(`Pagos informados (${informados.length})`)}
      ${informados.length ? informados.map(p => `<div class="card"><div class="row" style="align-items:flex-start">
        ${p.foto ? fotoHTML(p.foto, 'mini-foto') : `<span class="ic ic-warn" style="width:44px;height:44px;border-radius:12px;display:grid;place-items:center;flex:none">${I('clock')}</span>`}
        <div class="grow"><b>${esc(p.lote)} · ${plata(p.monto)}</b><div class="muted small">${fechaCorta(p.fecha)} · ${esc(p.medio)} · informó ${esc(nombreDe(p.userId))}</div>
          ${p.nota ? `<div class="small" style="color:var(--ink-2)">${esc(p.nota)}</div>` : ''}
          <div class="muted small">Saldo del lote: ${plata(saldoLote(p.lote))}</div></div></div>
        <div class="btns" style="margin-top:10px"><button class="btn btn-sm btn-ok" data-a="confirmar-pago" data-id="${p.id}">${I('check')}Confirmar y emitir recibo</button>
          <button class="btn btn-sm btn-danger-soft" data-a="rechazar-pago" data-id="${p.id}">Rechazar</button></div></div>`).join('')
        : vacio('check', 'No hay pagos esperando confirmación.')}
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
            <button class="btn btn-xs btn-sec" data-a="abrir" data-v="contabilidad" data-p="impositivo">${I('edit')}</button></div></div></div>
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
function formGasto(g, periodo){
  g = g || {};
  const per = g.periodo || periodo || periodoHoy();
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
    <button class="btn btn-pri btn-block">${I('check')}Guardar</button></form>`, { ancho:'620px' });
}
F['gasto'] = (d, form) => {
  const id = form.dataset.id;
  Store.cambiar(s => {
    const base = { periodo:d.periodo, fecha:d.fecha, proveedor:d.proveedor.trim(), cuit:d.cuit.trim(), rubro:+d.rubro,
      tipoComp:d.tipoComp, nroComp:d.nroComp.trim(), neto:+d.neto || 0, iva:+d.iva || 0, total:+d.total || 0,
      columna:d.columna, retGan:+d.retGan || 0, retSuss:+d.retSuss || 0, cuotaN:+d.cuotaN || 0, cuotaDe:+d.cuotaDe || 0,
      lote:d.lote || '', detalle:d.detalle.trim() };
    const foto = leerFoto(d.foto);
    if (id){ const g = s.gastos.find(x => x.id === id); Object.assign(g, base); if (foto) g.foto = foto; }
    else s.gastos.unshift({ id:uid(), ...base, foto, por:yo().id, at:Date.now() });
    auditar(s, id ? 'Editó un gasto' : 'Cargó un gasto', `${base.proveedor} · ${plata(base.total)} · ${base.periodo}`);
  });
  cerrarHoja(); toast('Gasto guardado', 'check');
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
  if (!await confirmar('Emitir la liquidación', `Se van a generar ${calc.cuotas.length} cupones por ${plata(calc.totalCuotas)} y cada vecino va a recibir el suyo.`, { si:'Emitir' })) return;
  Store.cambiar(s => {
    const l = { id:uid(), periodo, estado:'emitida', emitidaAt:Date.now(), por:yo().id,
      porColumna:calc.porColumna, porRubro:calc.porRubro, totalGastos:calc.totalGastos, totalCuotas:calc.totalCuotas, cuotas:calc.cuotas };
    const i = s.liquidaciones.findIndex(x => x.periodo === periodo);
    if (i >= 0) s.liquidaciones[i] = l; else s.liquidaciones.push(l);
    s.infracciones.forEach(x => { if (x.estado === 'firme' && !x.liquidada && x.monto) x.liquidada = periodo; });
    notificar(s, { para:'todos', titulo:`Expensas de ${nombrePeriodo(periodo)}`, texto:`Ya podés ver tu cupón. Primer vencimiento: ${fechaCorta(vtoDe(periodo, 1))}.`, icon:'wallet', color:'wood', link:'expensas', sonido:true });
    auditar(s, 'Emitió la liquidación', `${nombrePeriodo(periodo)} · ${plata(calc.totalCuotas)} · ${calc.cuotas.length} cupones`);
  });
  toast('Liquidación emitida', 'check');
  mandarCupones(periodo);
};
A['reabrir-liquidacion'] = async el => {
  if (!await confirmar('Reabrir el período', 'Los cupones dejan de estar emitidos hasta que lo vuelvas a cerrar. Los pagos ya registrados no se tocan.', { si:'Reabrir', peligro:true })) return;
  Store.cambiar(s => { const l = s.liquidaciones.find(x => x.periodo === el.dataset.v); if (l) l.estado = 'borrador';
    auditar(s, 'Reabrió un período', el.dataset.v); });
};
A['ver-liquidacion'] = el => imprimir(`Liquidación ${nombrePeriodo(el.dataset.v)}`, liquidacionHTML(el.dataset.v));
A['mandar-cupones'] = el => mandarCupones(el.dataset.v);
async function mandarCupones(periodo){
  const l = liquidacionDe(periodo); if (!l) return;
  const con = Store.s.users.filter(u => u.estado === 'aprobado' && u.rol === 'vecino' && u.email);
  if (!con.length || !Correo.configurado()){ toast('Los cupones quedan en la app. Configurá el correo para enviarlos.', 'info'); return; }
  let n = 0;
  for (const u of con){
    const c = cuotaDe(l, u.casa); if (!c) continue;
    const ok = await Correo.enviar({ para:u.email, asunto:`Expensas de ${nombrePeriodo(periodo)} · ${u.casa}`, tipo:'cupon',
      html:Correo.plantilla(`Expensas de ${nombrePeriodo(periodo)}`,
        `<p>Hola ${esc(u.nombre.split(' ')[0])}:</p>
         <p>Tu cupón de <b>${esc(u.casa)}</b> ya está disponible.</p>
         <p style="font-size:22px;font-weight:800;color:#0d6b66">${plata(c.total + (c.interes || 0))}</p>
         <p>Primer vencimiento: <b>${fechaCorta(vtoDe(periodo, 1))}</b> · Segundo: ${fechaCorta(vtoDe(periodo, 2))} (+${cfgExp().recargo2} %).</p>
         <p>Podés pagar por transferencia al alias <b>${esc(Store.s.config.alias || '')}</b> e informar el pago desde la app.</p>`,
        { texto:'Ver mi cupón', url:urlApp() }) });
    if (ok) n++;
  }
  toast(n ? `${n} cupones enviados por correo` : 'Los cupones quedaron en la bandeja de salida', 'mail');
}
A['confirmar-pago'] = el => {
  const p = Store.s.pagos.find(x => x.id === el.dataset.id); if (!p) return;
  Store.cambiar(s => {
    const pago = s.pagos.find(x => x.id === p.id);
    const c = cfgExp();
    const numero = 'R-' + String((c.reciboNro || 0) + 1).padStart(5, '0');
    s.config.exp = Object.assign({}, c, { reciboNro: (c.reciboNro || 0) + 1 });
    pago.estado = 'confirmado'; pago.recibo = numero; pago.confirmadoPor = yo().id; pago.confirmadoAt = Date.now();
    s.recibos.unshift({ id:uid(), numero, lote:pago.lote, monto:pago.monto, fecha:pago.fecha, medio:pago.medio,
      concepto:`Expensas${pago.nota ? ' · ' + pago.nota : ''}`, pagoId:pago.id, at:Date.now(), por:yo().id });
    notificar(s, { para:s.users.filter(u => u.casa === pago.lote).map(u => u.id), titulo:'Recibimos tu pago', texto:`${plata(pago.monto)} · recibo ${numero}`, icon:'check', color:'ok', link:'expensas' });
    auditar(s, 'Confirmó un pago', `${pago.lote} · ${plata(pago.monto)} · recibo ${numero}`);
  });
  toast('Pago confirmado y recibo emitido', 'check');
};
A['rechazar-pago'] = async el => {
  if (!await confirmar('Rechazar el pago', 'El vecino recibe el aviso para que lo revise.', { si:'Rechazar', peligro:true })) return;
  Store.cambiar(s => { const p = s.pagos.find(x => x.id === el.dataset.id); if (!p) return; p.estado = 'rechazado';
    notificar(s, { para:s.users.filter(u => u.casa === p.lote).map(u => u.id), titulo:'No pudimos confirmar tu pago', texto:`${plata(p.monto)} · revisá el comprobante o escribinos`, icon:'alert', color:'danger', link:'expensas' });
    auditar(s, 'Rechazó un pago informado', `${p.lote} · ${plata(p.monto)}`); });
};
A['pago-manual'] = () => hoja('Registrar un pago', `<form data-f="pago-manual">
  <div class="field"><label>Lote</label><select name="lote" required>${LOTES.map(L => `<option value="Lote ${L.lote}">${esc(nombreLote(L))}${propietarioDe('Lote ' + L.lote) ? ' · ' + esc(propietarioDe('Lote ' + L.lote)) : ''}</option>`).join('')}</select></div>
  <div class="grid2"><div class="field"><label>Importe</label><input type="number" step="0.01" name="monto" required></div>
    <div class="field"><label>Fecha</label><input type="date" name="fecha" required value="${hoyISO()}"></div></div>
  <div class="field"><label>Medio</label><select name="medio"><option>Transferencia</option><option>Depósito</option><option>Efectivo</option><option>Cheque</option><option>Otro</option></select></div>
  <div class="field"><label>Nota</label><input name="nota" maxlength="120"></div>
  <button class="btn btn-pri btn-block">${I('check')}Registrar y emitir recibo</button></form>`);
F['pago-manual'] = d => {
  const id = uid();
  Store.cambiar(s => { s.pagos.unshift({ id, lote:d.lote, userId:yo().id, monto:+d.monto, fecha:d.fecha, medio:d.medio, nota:(d.nota || '').trim(), estado:'informado', at:Date.now() }); });
  cerrarHoja();
  A['confirmar-pago']({ dataset:{ id } });
};
A['ver-cuenta'] = el => {
  const lote = el.dataset.v, cuenta = cuentaLote(lote);
  hoja(`Cuenta de ${lote}`, `<div class="card plana"><b>${esc(propietarioDe(lote) || lote)}</b><div class="muted small">Saldo: <b>${plata(cuenta.saldo)}</b></div></div>
    <div class="card lista">${cuenta.movs.slice().reverse().map(m => `<div class="it"><div class="txt"><b>${esc(m.detalle)}</b><span>${fechaCorta(isoDe(new Date(m.fecha)))}</span></div>
      <b class="num">${m.debe ? plata(m.debe) : '− ' + plata(m.haber)}</b></div>`).join('') || '<p class="muted small">Sin movimientos.</p>'}</div>
    <div class="btns"><button class="btn btn-sec" data-a="certificado-deuda" data-v="${esc(lote)}">${I('file')}Certificado de deuda</button>
      <button class="btn btn-pri" data-a="pago-manual">${I('plus')}Registrar pago</button></div>`, { ancho:'620px' });
};
A['certificado-deuda'] = el => imprimir(`Certificado de deuda · ${el.dataset.v}`, certificadoHTML(el.dataset.v));
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
  { id:'exp-emitir', n:'Recordar el cierre del mes', d:'Si el día 5 todavía no se cerró el mes anterior, avisa a la Administración.',
    run(s, hoy){ const dia = +hoy.slice(8); if (dia < 5) return 0; const per = periodoAnterior(hoy.slice(0, 7));
      if (liquidacionDe(per)?.estado === 'emitida') return 0;
      return marca(s, 'expcierre-' + per, () => notificar(s, { para:'rol:admin', titulo:`Falta cerrar ${nombrePeriodo(per)}`, texto:'Los cupones todavía no se emitieron.', icon:'wallet', color:'warn', link:'contabilidad:cierre' })); } },
  { id:'exp-vence', n:'Expensas: aviso del vencimiento', d:'Tres días antes, el día del primer vencimiento y cuando queda saldo impago.',
    run(s, hoy){ const l = liquidacionesEmitidas().slice(-1)[0]; if (!l) return 0;
      const v1 = vtoDe(l.periodo, 1), v2 = vtoDe(l.periodo, 2); let n = 0;
      const deudores = () => s.users.filter(u => u.rol === 'vecino' && u.estado === 'aprobado' && saldoLote(u.casa) > 0.5).map(u => u.id);
      if (hoy === sumarDias(v1, -3)) n += marca(s, 'expav3-' + l.periodo, () => notificar(s, { para:'todos', titulo:'Las expensas vencen en 3 días', texto:`${nombrePeriodo(l.periodo)} · vence el ${fechaCorta(v1)}`, icon:'wallet', color:'wood', link:'expensas' }));
      if (hoy === v1){ const d = deudores(); if (d.length) n += marca(s, 'expav1-' + l.periodo, () => notificar(s, { para:d, titulo:'Hoy vencen las expensas', texto:`Después de hoy se suma el ${cfgExp().recargo2} % de recargo.`, icon:'wallet', color:'warn', link:'expensas', sonido:true })); }
      if (hoy === sumarDias(v2, 1)){ const d = deudores(); if (d.length) n += marca(s, 'expmora-' + l.periodo, () => notificar(s, { para:d, titulo:'Quedó un saldo impago', texto:'Desde hoy corren intereses. Podés pagar o pedir un plan desde la app.', icon:'alert', color:'danger', link:'expensas' })); }
      return n; } },
  { id:'exp-arca', n:'ARCA: aviso de vencimientos', d:'Cinco días antes de cada presentación del mes, avisa a la Administración.',
    run(s, hoy){ const per = periodoAnterior(hoy.slice(0, 7)); let n = 0;
      presentacionesDe(per).forEach(p => { if (p.estado === 'presentado') return;
        if (hoy === sumarDias(p.vence, -5) || hoy === p.vence)
          n += marca(s, `arca-${p.id}-${per}-${hoy}`, () => notificar(s, { para:'rol:admin', titulo:`${p.nombre}: vence ${fechaCorta(p.vence)}`, texto:`Período ${nombrePeriodo(per)}`, icon:'clipboard', color:'accent', link:'contabilidad:impositivo' })); });
      return n; } },
);
