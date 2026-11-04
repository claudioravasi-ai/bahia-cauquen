/* =========================================================
   LA LIQUIDACIÓN DE OCTAVO PISO, LEÍDA DEL PDF Y REVISADA
   (pedido de Claudio, 04-11-2026: "que la app lea sola el PDF de
   Octavo Piso" y "lo que la app habría calculado contra lo real, lote
   por lote, con las diferencias marcadas antes de traerla", con un
   diseño fácil, interactivo y claro)

   1. LEER: la Administración elige el PDF tal como lo manda Octavo Piso
      (o el .json de siempre). El PDF se lee EN SU EQUIPO con pdf.js (la
      librería de Mozilla, se baja una sola vez y queda guardada): no se
      sube a ningún lado y los nombres de los propietarios no se guardan.
      De ahí salen el período y los vencimientos, cada gasto con su rubro,
      comprobante y cuota, los gastos particulares, el banco, el estado
      patrimonial, juicios, formas de pago, el renglón de cada lote y las
      multas/ajustes. Cada gasto se reconoce con el del mes anterior (CUIT
      y detalle) para que siga siendo "el mismo gasto" en Automáticas.
   2. CONTROLAR: antes de mostrar nada se hacen las cuentas del PDF (cada
      rubro suma su total, cada lote cierra, cada columna da su total, el
      banco, el patrimonio, el fondo). Si algo grave no cierra, NO se deja
      traer y se dice qué.
   3. COMPARAR: para cada lote, lo que la app habría calculado (su saldo,
      el prorrateo con su coeficiente, el fondo, el interés con la tasa de
      la app) contra lo que dice el PDF. Arriba, en pocas frases, lo que se
      encontró; abajo, los lotes "para mirar" y los "iguales".
   4. TRAER: un botón, y sigue el circuito de siempre (aplicarLiquidacionReal
      en js/v-plan.js): cobros, gastos, cupones, banco y deuda.
   ========================================================= */
const PDFJS_URL = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/';
const nAR = s => { const t = String(s).trim(); return +(t.replace(/\./g, '').replace(',', '.')) || 0; };
const r2 = x => Math.round((+x || 0) * 100) / 100;
const igualC = (a, b) => Math.round((+a || 0) * 100) === Math.round((+b || 0) * 100);

const LectorPDF = {
  cargar(){
    return this._p || (this._p = new Promise((ok, no) => {
      if (window.pdfjsLib) return ok(window.pdfjsLib);
      const s = document.createElement('script'); s.src = PDFJS_URL + 'pdf.min.js';
      s.onload = () => { window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_URL + 'pdf.worker.min.js'; ok(window.pdfjsLib); };
      s.onerror = () => { this._p = null; no(new Error('No pude bajar el lector de PDF. Hace falta internet la primera vez.')); };
      document.head.appendChild(s);
    }));
  },
  /* Cada página: sus pedacitos de texto con su posición y las líneas armadas por altura. */
  async paginas(buf){
    const lib = await this.cargar(); let doc; const out = [];
    try { doc = await lib.getDocument({ data:buf }).promise; }
    catch(e){ throw new Error(/password/i.test(e && e.name || '') ? 'El PDF tiene contraseña: pedile a Octavo Piso uno sin contraseña.' : 'Ese archivo no es un PDF que se pueda leer (¿está dañado o es otro tipo de archivo?).'); }
    for (let n = 1; n <= doc.numPages; n++){
      const tc = await (await doc.getPage(n)).getTextContent();
      const items = tc.items.filter(i => i.str && i.str.trim()).map(i => ({ s:i.str.trim(), x:i.transform[4], y:i.transform[5], w:i.width || 0 }));
      out.push({ n, items, lineas:lineasDe(items) });
    }
    return out;
  },
};
function lineasDe(items){
  const L = [];
  items.slice().sort((a, b) => b.y - a.y || a.x - b.x).forEach(it => { const l = L.find(z => Math.abs(z.y - it.y) <= 2); if (l) l.items.push(it); else L.push({ y:it.y, items:[it] }); });
  return L.sort((a, b) => b.y - a.y).map(l => { l.items.sort((a, b) => a.x - b.x); return { y:l.y, t:l.items.map(i => i.s).join(' ').replace(/\s+/g, ' ').trim(), items:l.items }; });
}

/* ---------- 1. LEER ---------- */
const NUMRE = '-?[\\d.]+,\\d\\d';
const PROV_LIMPIO = s => String(s || '').replace(/\s+/g, ' ').trim()
  .replace(/SOCIEDAD ANONIMA/gi, 'S.A.').replace(/SOCIEDAD DE RESPONSABILIDAD LIMITADA/gi, 'S.R.L.').replace(/S\. ?R\. ?L\./g, 'S.R.L.').replace(/\bS A U\b/g, 'S.A.U.').replace(/\bS A\b/g, 'S.A.').replace(/O\. P\./g, 'O.P.');
const sinPeriodo = d => String(d || '').replace(/\s*\(estimado\)/i, '').replace(/\s*·\s*per[ií]odo.*$/i, '').trim();
const palabrasGasto = s => new Set(normTxt(s).replace(/[^a-z0-9 ]/g, ' ').split(/\s+/)
  .filter(w => w.length >= 4 && !MESES_LARGO.includes(w) && !/^(periodo|factura|recibo|otros|cuit|pago|sociedad|anonima|limitada)$/.test(w)));

function parsearOctavo(pags, { previos = [] } = {}){
  const texto = pags.map(p => p.lineas.map(l => l.t).join('\n')).join('\n');
  const falla = m => { throw new Error(m); };
  /* Período y vencimientos */
  const mP = /Per[ií]odo:\s*([A-Za-zÁÉÍÓÚáéíóú]+)\s+(\d{4})/.exec(texto) || falla('No encontré el período (la línea "Período: …" de arriba). ¿Es la liquidación de Octavo Piso?');
  const mes = MESES_LARGO.indexOf(normTxt(mP[1])); if (mes < 1) falla(`No entiendo el mes "${mP[1]}"`);
  const anio = +mP[2], periodo = `${anio}-${pad(mes)}`, anterior = periodoAnterior(periodo);
  const fecha = re => { const m = re.exec(texto); return m ? `${m[3]}-${m[2]}-${m[1]}` : ''; };
  const vto1 = fecha(/1er\s*Vencimiento:\s*(\d{2})\/(\d{2})\/(\d{4})/i), vto2 = fecha(/2do\s*Vencimiento:\s*(\d{2})\/(\d{2})\/(\d{4})/i);

  /* Pagos del período: cada gasto con su rubro (categoría) */
  const reCinco = new RegExp(`^(.*?)\\s*(${NUMRE}) (${NUMRE}) (${NUMRE}) (${NUMRE}) (${NUMRE})$`);
  const crudos = [], particulares = [], cat = {}, pct = {}; let rubro = 0, buf = [], totales = null, seguros = '', pctSuelto = null, ultCat = 0, fin = false;
  for (const p of pags){
    if (fin || p.lineas.some(l => /ESTADO DE CUENTAS Y PRORRATEO/.test(l.t))) break;
    for (const l of p.lineas){
      const t = l.t; let m;
      if (/^ESTADO FINANCIERO/.test(t)){ fin = true; break; }
      if ((m = new RegExp(`^TOTAL CATEGOR[IÍ]A (\\d+)(?: ([\\d,]+)%)? (${NUMRE})$`).exec(t))){
        cat[m[1]] = nAR(m[3]); ultCat = +m[1]; if (m[2]) pct[m[1]] = nAR(m[2]); else if (pctSuelto != null){ pct[m[1]] = pctSuelto; pctSuelto = null; } buf = []; continue; }
      if ((m = /^(\d+,\d\d)%$/.exec(t))){ if (ultCat && pct[ultCat] == null) pct[ultCat] = nAR(m[1]); else pctSuelto = nAR(m[1]); continue; }
      if ((m = reCinco.exec(t))){
        const concepto = [...buf, m[1]].join(' ').replace(/\s+/g, ' ').trim(), v = [2, 3, 4, 5, 6].map(k => nAR(m[k])); buf = [];
        if (/\bTOTALES\b/.test(concepto)){ totales = { expensas:v[0], mejoras:v[1], multas:v[2], fondo:v[3], total:v[4] }; continue; }
        if (/^Sin movimientos/i.test(concepto) || (!v[4] && !concepto)){ if (rubro === 10) seguros = 'Sin movimientos'; continue; }
        if (rubro === 12){
          const tok = concepto.split(' '), i = tok.findIndex((w, k) => /^\d{1,3}A?$/.test(w) && !/N[º°]$/.test(tok[k - 1] || ''));
          const nro = (/N[º°]\s*([\w\-\/]+)/.exec(concepto) || [])[1] || '';
          const lote = i >= 0 ? tok[i] : String(+nro.replace(/\D/g, '') || '');
          const det = (i >= 0 ? tok.filter((w, k) => k !== i).join(' ') : concepto).replace(/\s*-\s*(Otros|Recibo|Factura [ABC])\s*N[º°]\s*[\w\-\/]+/i, '').trim();
          particulares.push({ lote, detalle:det, nroComp:nro, total:v[4] }); continue;
        }
        crudos.push({ rubro, concepto, expensas:v[0], mejoras:v[1], multas:v[2], fondo:v[3], total:v[4] }); continue;
      }
      if ((m = /^(\d{1,2}) ([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ .,]{3,})$/.exec(t))){ rubro = +m[1]; buf = []; continue; }
      if (rubro) buf.push(t);
    }
  }
  if (!crudos.length) falla('No encontré los gastos ("Pagos del período")');

  /* Cada gasto: proveedor, CUIT, comprobante, período, cuota, y el mismo gasto del mes anterior */
  const gastos = crudos.map(g => {
    const t = g.concepto, partes = t.split(/\s+-\s+/).map(s => s.trim()).filter(Boolean);
    const cuit = (/CUIT\s*(\d{2}-\d{8}-\d)/.exec(t) || [])[1] || '';
    const comp = /(Factura [ABC]|Recibo|Nota de (?:cr[eé]dito|d[eé]bito)|Otros)\s*N[º°]\s*([\w\-\/]+)/i.exec(t);
    const per = /Periodo\s*([A-Za-zÁÉÍÓÚáéíóú]+)\s*\/\s*(\d{4})/i.exec(t), cuota = /Pago\s+(\d+)\s+de\s+(\d+)/i.exec(t);
    let perTxt = '', nota = '';
    if (per){ const mm = MESES_LARGO.indexOf(normTxt(per[1])); if (mm > 0){ const a = mm <= mes ? anio : anio - 1; perTxt = `${MESES_LARGO[mm]} ${a}`;
      if (+per[2] !== a) nota = `El PDF dice "${per[1]}/${per[2]}": es ${MESES_LARGO[mm]} ${a}`; } }
    const medio = partes.slice(1).filter(p => !/^CUIT\b/i.test(p) && !/^Periodo\b/i.test(p) && !/N[º°]/.test(p) && !/^Pago \d+ de \d+$/i.test(p) && !/^\d[\d\-\/]*$/.test(p) && p.length > 1);
    const cN = cuota ? +cuota[1] : 0, cD = cuota ? +cuota[2] : 0;
    if (cD && cN === cD) nota = [nota, 'Última cuota'].filter(Boolean).join(' · ');
    return { rubro:g.rubro, provCrudo:partes[0] || '', cuit, medio, perTxt, tipoComp:comp ? comp[1].replace(/^otros$/i, 'Otros') : 'Otros', nroComp:comp ? comp[2] : '', cuotaN:cN, cuotaDe:cD, total:g.total, nota, concepto:t };
  });
  /* El mismo gasto del mes anterior: CUIT (o nombre) igual, la cuota que sigue, palabras en común. Se asignan de a pares, el mejor primero. */
  const prev = previos.filter(x => x && +x.rubro !== 12 && !x.anulado), pares = [];
  gastos.forEach((g, i) => prev.forEach((x, j) => {
    const mismo = g.cuit && x.cuit ? g.cuit === x.cuit : normTxt(PROV_LIMPIO(g.provCrudo)) === normTxt(x.proveedor);
    if (!mismo) return;
    let s = 1;
    if (g.cuotaDe && +x.cuotaDe){ if (+x.cuotaDe === g.cuotaDe && +x.cuotaN + 1 === g.cuotaN) s += 20; else s -= 20; }
    const a = palabrasGasto(g.concepto), b = palabrasGasto(x.proveedor + ' ' + x.detalle); a.forEach(w => { if (b.has(w)) s += 3; });
    if (+x.rubro === g.rubro) s += 1;
    pares.push({ i, j, s });
  }));
  const usadoG = new Set(), usadoP = new Set();
  pares.sort((a, b) => b.s - a.s || a.i - b.i || a.j - b.j).forEach(p => { if (p.s <= 0 || usadoG.has(p.i) || usadoP.has(p.j)) return; usadoG.add(p.i); usadoP.add(p.j); gastos[p.i].prev = prev[p.j]; });
  const gastosOk = gastos.map(g => {
    const x = g.prev, base = x ? sinPeriodo(x.detalle) : g.medio.join(', ');
    return { rubro:g.rubro, proveedor:x ? x.proveedor : PROV_LIMPIO(g.provCrudo), cuit:g.cuit || (x && x.cuit) || '', detalle:base + (g.perTxt ? ` · período ${g.perTxt}` : ''),
      tipoComp:g.tipoComp, nroComp:g.nroComp, cuotaN:g.cuotaN, cuotaDe:g.cuotaDe, total:g.total, columna:'expensas',
      recurrencia:x ? (x.recurrencia || (typeof recurrenciaDe === 'function' ? recurrenciaDe(x) : 'fijo')) : (g.cuotaDe ? 'cuotas' : 'fijo'),
      ...(g.nota ? { nota:g.nota } : {}), ...(x ? {} : { nuevo:true }) };
  });
  const noVinieron = prev.filter((x, j) => !usadoP.has(j)).map(x => ({ proveedor:x.proveedor, detalle:sinPeriodo(x.detalle), total:+x.total || 0, cuota:+x.cuotaDe ? `${x.cuotaN} de ${x.cuotaDe}` : '' }));

  /* Banco, patrimonio, juicios, formas de pago */
  const val = re => { const m = re.exec(texto); return m ? nAR(m[1]) : null; };
  const banco = { saldoInicial:val(new RegExp(`SALDO INICIAL (${NUMRE})`)),
    cobrosTermino:val(new RegExp(`EXPENSAS EN T[ÉE]RMINO (${NUMRE})`)), cobrosAdeudadas:val(new RegExp(`EXPENSAS ADEUDADAS (${NUMRE})`)),
    cobrosIntereses:val(new RegExp(`COBROS DE INTERESES (${NUMRE})`)), cobrosACuenta:val(new RegExp(`PAGOS A CUENTA (${NUMRE})`)),
    egresosGastos:Math.abs(val(new RegExp(`GASTOS DEL MES (${NUMRE})`)) || 0), egresosParticulares:Math.abs(val(new RegExp(`GASTOS PARTICULARES (${NUMRE})`)) || 0),
    saldoCierre:val(new RegExp(`SALDO AL CIERRE (${NUMRE})`)) };
  banco.egresos = r2(banco.egresosGastos + banco.egresosParticulares);
  const patrimonio = { expensasACobrar:val(new RegExp(`EXPENSAS A COBRAR POR GASTOS (${NUMRE})`)), deudasEInteresesACobrar:val(new RegExp(`DEUDAS E INTERESES A COBRAR (${NUMRE})`)),
    redondeos:val(new RegExp(`REDONDEOS A COBRAR (${NUMRE})`)), disponibles:val(new RegExp(`DISPONIBLES (${NUMRE})`)),
    pendienteImputacion:val(new RegExp(`PENDIENTES DE IMPUTACI[ÓO]N (${NUMRE})`)), patrimonioNeto:val(new RegExp(`PATRIMONIO NETO AL CIERRE (${NUMRE})`)) };
  const mJ = /DATOS DE JUICIOS\n([^\n]+)/.exec(texto), juicios = mJ ? mJ[1].trim() : '';
  const formasPago = { cbu:(/CBU[^:\n]*:\s*(\d{22})/.exec(texto) || [])[1] || '', cuenta:(/(Cuenta Corriente[^\n]*)/.exec(texto) || [])[1] || '',
    cuit:(/CDI\s*:\s*([\d\-]+)/.exec(texto) || [])[1] || '', alias:(/Alias:\s*([\w.\-]+)/.exec(texto) || [])[1] || '' };

  /* Estado de cuentas y prorrateo: cada lote, por posición (los nombres no se leen) */
  const lotes = [], reFila = new RegExp(`^(${NUMRE}) (${NUMRE}) (${NUMRE}) (${NUMRE}|En Abogados) (${NUMRE}) (${NUMRE}) (${NUMRE}) (${NUMRE}) (${NUMRE}) (${NUMRE}) (${NUMRE}) - (${NUMRE}) (${NUMRE}) (${NUMRE}) (${NUMRE})$`);
  let totLotes = null;
  pags.filter(p => p.lineas.some(l => /ESTADO DE CUENTAS Y PRORRATEO/.test(l.t))).forEach(p => {
    const hUF = p.items.find(i => i.s === 'UF'), hSaldo = p.items.find(i => i.s === 'Saldo' || /^Saldo/.test(i.s)), hLote = p.items.find(i => i.s === 'Lote');
    if (!hUF || !hSaldo) return;
    /* Los números van alineados a la derecha: se toma el borde derecho (los nombres terminan antes de la columna "Saldo"). */
    const fila = y => p.items.filter(i => Math.abs(i.y - y) <= 2.5 && i.x + i.w >= hSaldo.x + 2).sort((a, b) => a.x - b.x).map(i => i.s).join(' ').replace(/\s+/g, ' ');
    const marcas = p.items.filter(i => /^\(\d\)$/.test(i.s));
    /* La UF abre cada renglón. A veces el PDF junta UF, lote y nombre en un solo pedazo ("133A 133A Marcelo…"). */
    const ancla = i => { const m = /^(\d{3}A?)(?:\s+(\d{1,3}A?))?(?:\s|$)/.exec(i.s); return m && Math.abs(i.x - hUF.x) < 10 && i.y < hUF.y ? m : null; };
    p.items.filter(ancla).forEach(a => {
      const mA = ancla(a); a = { ...a, s:mA[1] };
      const loteIt = mA[2] ? { s:mA[2] } : p.items.find(i => Math.abs(i.y - a.y) <= 2.5 && i.s !== a.s && /^\d{1,3}A?$/.test(i.s) && i.x > a.x && (!hLote || Math.abs(i.x - hLote.x) < 15));
      const m = reFila.exec(fila(a.y)); if (!m) falla(`No pude leer el renglón de la UF ${a.s} del estado de cuentas`);
      const v = m.slice(1), jud = v[3] === 'En Abogados', N = k => nAR(v[k]);
      const marca = marcas.filter(x => Math.abs(x.y - a.y) < 8).sort((x, y) => Math.abs(x.y - a.y) - Math.abs(y.y - a.y))[0];
      const l = { lote:loteIt ? loteIt.s : a.s.replace(/^0+(?=\d)/, ''), uf:a.s, saldoAnterior:N(0), pagos:N(1), deuda:N(2), interesColumna:jud ? null : N(3), disponible:N(4), coefPdf:N(5),
        expensas:N(6), mejoras:N(8), multas:N(10), fondo:N(11), particulares:N(12), redondeo:N(13), total:N(14), judicial:jud, enAbogados:jud, ...(marca ? { marca:+marca.s.replace(/\D/g, '') } : {}) };
      const prorr = l.expensas + l.mejoras + l.multas + l.fondo + l.particulares + l.redondeo;
      if (jud) l.interesColumna = r2(l.total - (l.deuda - l.disponible + prorr));   /* "En Abogados": el PDF no lo muestra, sale de su total */
      l.interes = r2(l.total - (l.saldoAnterior - l.pagos) - prorr);              /* lo que este mes se le suma */
      lotes.push(l);
    });
    const aT = p.items.find(i => i.s === 'TOTALES' && i.y < hUF.y);
    if (aT){ const t = p.items.filter(i => Math.abs(i.y - aT.y) <= 2.5 && i.x + i.w >= hSaldo.x + 2).sort((a, b) => a.x - b.x).map(i => i.s).join(' ');
      const m = reFila.exec(t.replace(/100,00/g, '100,00')); if (m){ const v = m.slice(1).map(nAR);
        totLotes = { saldoAnterior:v[0], pagos:v[1], deuda:v[2], interesColumna:v[3], disponible:v[4], expensas:v[6], mejoras:v[8], multas:v[10], fondo:v[11], particulares:v[12], redondeo:v[13], total:v[14] }; } }
  });
  if (!lotes.length) falla('No encontré el estado de cuentas de los lotes');

  /* Multas, reservas y ajustes (por columnas: cada pedacito va con el título más cercano) */
  const ajustes = [];
  const pA = pags.find(p => p.lineas.some(l => /MULTAS, RESERVAS Y AJUSTES/.test(l.t)));
  if (pA){
    const cab = ['UF', 'Lote', 'PROPIETARIO', 'TIPO', 'DESCRIPCIÓN', 'MONTO'].map(k => pA.items.find(i => i.s === k)).filter(Boolean);
    const hU = cab[0], centro = i => i.x + i.w / 2;
    if (hU) pA.items.filter(i => /^(\d{3}|\d{3}A)$/.test(i.s) && Math.abs(centro(i) - centro(hU)) < 12 && i.y < hU.y).forEach(a => {
      const fila = pA.items.filter(i => Math.abs(i.y - a.y) <= 2.5);
      const col = k => fila.filter(i => { const h = cab.slice().sort((x, y) => Math.abs(centro(i) - centro(x)) - Math.abs(centro(i) - centro(y)))[0]; return h && h.s === k; }).map(i => i.s).join(' ');
      const monto = nAR(col('MONTO')); if (!monto) return;
      const lt = lotes.find(l => l.uf === a.s);
      ajustes.push({ lote:lt ? lt.lote : a.s, uf:a.s, tipo:col('TIPO'), descripcion:col('DESCRIPCIÓN'), monto });
    });
  }
  /* Interés de este mes calculado y cancelado entero (lo que pasó con el lote 122 en octubre) */
  ajustes.forEach(a => { const l = lotes.find(x => x.uf === a.uf); if (!l) return;
    (l.ajustes = l.ajustes || []).push({ tipo:a.tipo, descripcion:a.descripcion, monto:a.monto });
    if (a.monto < 0 && /inter[eé]s/i.test(a.tipo + ' ' + a.descripcion) && !l.interesColumna && l.deuda > 0) l.interesCancelado = -a.monto; });
  const marcas = {}; if (/posee ajustes para esta liquidaci/i.test(texto)) marcas['1'] = 'La unidad posee ajustes para esta liquidación';
  if (/pagos realizados luego del 2do vencimiento/i.test(texto)) marcas['2'] = 'La unidad posee pagos realizados luego del 2do vencimiento, generando intereses por el saldo impago';
  /* La tasa que aplicó Octavo Piso: la que se repite entre los que deben */
  const tasas = lotes.filter(l => l.deuda > 0 && l.interes > 0).map(l => Math.round(l.interes / l.deuda * 10000) / 100).sort((a, b) => a - b);
  const tasaInteres = tasas.length ? tasas[Math.floor(tasas.length / 2)] : 0;
  const totalGastos = r2(gastosOk.reduce((a, g) => a + g.total, 0)), totalParticulares = r2(particulares.reduce((a, g) => a + g.total, 0));
  const expProrr = r2(lotes.reduce((a, l) => a + l.expensas, 0));
  return { tipo:'liquidacion-real', periodo, anterior, fuente:`Liquidación de ${MESES_LARGO[mes]} ${anio} (Octavo Piso)`, vto1, vto2, fechaPagos:isoDe(new Date(anio, mes, 0)),
    gastos:gastosOk, particulares, totalGastos, totalParticulares, porRubroPct:pct, seguros,
    prorrateo:{ expensas:expProrr, diferenciaConGastos:r2(totalGastos - expProrr), nota:Math.abs(totalGastos - expProrr) >= 0.01 ? `Los gastos del mes suman ${plata(totalGastos)} y lo prorrateado a los ${lotes.length} lotes, ${plata(expProrr)}: ${plata(Math.abs(totalGastos - expProrr))} ${totalGastos > expProrr ? 'menos' : 'más'}, por el redondeo de cada lote.` : '' },
    banco, patrimonio, totalesLotes:totLotes, ajustes, juicios, marcas, formasPago, tasaInteres, lotes, noVinieron,
    _leido:{ categorias:cat, totales, lineas:texto.split('\n').length } };
}

/* ---------- 2. CONTROLAR (sobre el PDF solo) ---------- */
function controlarOctavo(b, { pdf = true } = {}){
  /* Con el .json (ya revisado al armarlo) los controles se muestran, pero no frenan. */
  const C = [], add = (ok, t, d = '', grave = false) => C.push({ ok, t, d, grave: grave && pdf });
  const L = b._leido || {}, cat = L.categorias || {};
  /* Cada rubro suma lo que dice su "Total categoría" */
  const porR = {}; b.gastos.forEach(g => { porR[g.rubro] = r2((porR[g.rubro] || 0) + g.total); });
  if (b.particulares.length) porR[12] = r2(b.particulares.reduce((a, g) => a + g.total, 0));
  const malR = Object.keys(cat).filter(r => !igualC(porR[r] || 0, cat[r]));
  add(!malR.length, 'Cada rubro suma su total', malR.length ? `No cierran: ${malR.map(r => `${r} (${plata(porR[r] || 0)} contra ${plata(cat[r])})`).join(', ')}` : `${Object.keys(cat).length} rubros, ${b.gastos.length + b.particulares.length} comprobantes`, true);
  if (L.totales) add(igualC(L.totales.expensas, b.totalGastos) && igualC(L.totales.total, b.totalGastos + b.totalParticulares), 'El total de gastos da lo del PDF', `${plata(b.totalGastos + b.totalParticulares)}`, true);
  const nLotes = typeof LOTES !== 'undefined' ? LOTES.length : b.lotes.length, desconocidos = b.lotes.filter(l => typeof LOTES !== 'undefined' && !LOTES.some(x => x.lote === l.lote));
  add(b.lotes.length === nLotes && !desconocidos.length, `Están los ${nLotes} lotes`, desconocidos.length ? `No conozco: ${desconocidos.map(l => l.lote).join(', ')}` : `${b.lotes.length} renglones leídos`, true);
  const noCierran = aLista(b._derivado).length ? [] : b.lotes.filter(l => !igualC(l.deuda + l.interesColumna - l.disponible + l.expensas + l.mejoras + l.multas + l.fondo + l.particulares + l.redondeo, l.total));
  add(!noCierran.length, 'Cada lote cierra', noCierran.length ? `No cierran: ${noCierran.map(l => 'Lote ' + l.lote).join(', ')}` : 'Deuda + interés − disponible + prorrateo = total, en todos', true);
  const T0 = b.totalesLotes, T = T0 && { ...T0, pagos:T0.pagos ?? T0.pagosRecibidos, interesColumna:T0.interesColumna ?? T0.interes };
  if (T){ const k = ['saldoAnterior', 'pagos', 'deuda', 'interesColumna', 'disponible', 'expensas', 'fondo', 'particulares', 'redondeo', 'total'].filter(c => T[c] != null && !aLista(b._derivado).includes(c) && !igualC(b.lotes.reduce((a, l) => a + (+l[c] || 0), 0), T[c]));
    add(!k.length, 'Cada columna da su total', k.length ? `No dan: ${k.join(', ')}` : 'Saldo, pagos, deuda, interés, prorrateo y total', true); }
  else add(false, 'Cada columna da su total', 'No encontré el renglón TOTALES', true);
  const P = b.patrimonio, bb = b.banco || {}, egr = bb.egresosGastos != null ? (+bb.egresosGastos || 0) + (+bb.egresosParticulares || 0) : +bb.egresos || 0;
  const cuenta = r2((+bb.saldoInicial || 0) + (+bb.cobrosTermino || 0) + (+bb.cobrosAdeudadas || 0) + (+bb.cobrosIntereses || 0) + (+bb.cobrosACuenta || 0) - egr);
  add(igualC(cuenta, bb.saldoCierre), 'El banco cierra', igualC(cuenta, bb.saldoCierre) ? plata(bb.saldoCierre) : `Sumando da ${plata(cuenta)} y el PDF dice ${plata(bb.saldoCierre)} (${plata(cuenta - bb.saldoCierre)}). Queda lo del PDF.`);
  if (!igualC(cuenta, bb.saldoCierre)) bb.diferenciaPdf = r2(cuenta - bb.saldoCierre);
  if (T) add(igualC(bb.cobrosTermino + bb.cobrosAdeudadas + bb.cobrosIntereses + bb.cobrosACuenta, T.pagos), 'Lo cobrado en el banco = pagos de los lotes', plata(T.pagos));
  if (T && P) add(igualC(P.patrimonioNeto, T.total) && igualC(P.deudasEInteresesACobrar, T.deuda + T.interesColumna) && igualC(P.expensasACobrar, T.expensas + T.fondo + T.particulares), 'El estado patrimonial cierra', plata(P.patrimonioNeto));
  const fondo = typeof cfgExp === 'function' ? cfgExp().fondoFijo : 5000, otroFondo = b.lotes.filter(l => !igualC(l.fondo, fondo));
  add(!otroFondo.length, `Fondo de Infraestructura: ${plata(fondo)} por lote`, otroFondo.length ? `Distinto en ${otroFondo.map(l => 'Lote ' + l.lote).join(', ')}` : '');
  add(!!(b.vto1 && b.vto2), 'Período y vencimientos', `${nombrePeriodo(b.periodo)} · ${b.vto1 ? fechaCorta(b.vto1) : '¿?'} y ${b.vto2 ? fechaCorta(b.vto2) : '¿?'}`);
  return C;
}

/* ---------- 3. COMPARAR: lo que la app habría calculado ---------- */
function compararConApp(b){
  const ant = liquidacionDe(b.anterior), corte = ant ? ant.emitidaAt : 0, desde = periodoSiguiente(b.anterior) + '-01';
  const tasa = typeof tasaMoraPct === 'function' ? tasaMoraPct() : cfgExp().interesMensual, fondo = cfgExp().fondoFijo, r2v = cfgExp().recargo2;
  const mesAnt = MESES_LARGO[+b.anterior.slice(5)];
  const lotes = b.lotes.map(l => {
    const lote = 'Lote ' + l.lote, L = LOTES.find(x => x.lote === l.lote) || { coef:0 };
    const movs = cuentaLote(lote).movs, saldoApp = r2(movs.filter(m => m.fecha <= corte).reduce((a, m) => a + (m.debe || 0) - (m.pendiente ? 0 : (m.haber || 0)), 0));
    const pagosApp = r2(Store.s.pagos.filter(p => p && pagoDelLote(p, lote) && p.estado !== 'rechazado' && !esPrueba(p) && !/^ci-/.test(p.id || '') && String(p.fecha || '') >= desde && String(p.fecha || '') <= b.fechaPagos).reduce((a, p) => a + parteDelLote(p, lote), 0));
    const deudaApp = Math.max(0, r2(saldoApp - l.pagos)), interesApp = r2(deudaApp * tasa / 100);
    const expApp = r2(b.totalGastos * L.coef / 100), cuota = conCentavosDelLote(expApp + fondo + l.particulares + l.mejoras + l.multas, lote);
    const totalApp = r2(saldoApp - l.pagos + interesApp + cuota.total);
    const cuotaAnt = ant ? cuotaDe(ant, lote) : null, intAnt = cuotaAnt ? +cuotaAnt.interes || 0 : 0;
    const filas = [
      { k:'saldo', t:'Saldo anterior', app:saldoApp, pdf:l.saldoAnterior },
      { k:'pagos', t:'Pagos recibidos', app:pagosApp, pdf:l.pagos, info:true },
      { k:'interes', t:'Interés', app:interesApp, pdf:l.interes },
      { k:'expensas', t:'Expensas (prorrateo)', app:expApp, pdf:l.expensas },
      { k:'fondo', t:'Fondo de Infraestructura', app:fondo, pdf:l.fondo },
      ...(l.particulares ? [{ k:'part', t:'Gastos particulares', app:l.particulares, pdf:l.particulares }] : []),
      { k:'total', t:'Total del cupón', app:totalApp, pdf:l.total },
    ].map(f => ({ ...f, dif:r2(f.pdf - f.app) }));
    const por = [], motivos = [];
    const dS = r2(l.saldoAnterior - saldoApp);
    if (Math.abs(dS) >= 0.01){ por.push('saldo');
      if (intAnt && Math.abs(dS + intAnt) < 1){ const aj = { tipo:`Cancelación de intereses de ${mesAnt}`, descripcion:`El saldo anterior baja de ${plata(saldoApp)} (lo que tenía en la app) a ${plata(l.saldoAnterior)}: sin los ${plata(intAnt)} de interés de ${mesAnt}${Math.abs(dS + intAnt) >= 0.01 ? ` y ${plata(Math.abs(dS + intAnt))} de redondeo para conservar los centavos del lote` : ''}`, monto:dS };
        motivos.push(`Octavo Piso le sacó el interés de ${mesAnt} (${plata(intAnt)}): el saldo anterior baja ${plata(-dS)}.`);
        l.ajustes = [aj, ...aLista(l.ajustes).filter(x => x.tipo !== aj.tipo)]; }
      else motivos.push(`El saldo con el que arranca es distinto del que tiene la app (${dS > 0 ? '+' : ''}${plata(dS)}). Va como ajuste a la vista del vecino.`); }
    if (pagosApp > l.pagos + 1){ por.push('pagos'); motivos.push(`En la app hay ${plata(pagosApp)} pagados en el mes y el PDF dice ${plata(l.pagos)}: revisalo antes de traerla.`); }
    const dI = r2(l.interes - interesApp);
    if (l.interesCancelado) motivos.push(`Octavo Piso calculó ${plata(l.interesCancelado)} de interés y lo canceló entero.`);
    if (Math.abs(dI) >= 1){ por.push('interes');
      if (deudaApp < 1 && l.interes > 0) motivos.push(`Pagó después del 2º vencimiento: Octavo Piso le cobró ${plata(l.interes)} de interés por el atraso; la app cobra el recargo del ${String(r2v).replace('.', ',')} % al pagar.`);
      else if (deudaApp >= 1 && !l.interesCancelado) motivos.push(`Debe ${plata(l.deuda)}: Octavo Piso le cobró ${pctAR(l.deuda ? l.interes / l.deuda * 100 : 0)} de interés; la app calcularía ${pctAR(tasa)} (${plata(interesApp)}).`); }
    const dE = r2(l.expensas - expApp);
    if (Math.abs(dE) >= 50){ por.push('expensas'); motivos.push(`El prorrateo difiere en ${plata(dE)}: ¿cambió el coeficiente del lote? (la app usa ${(+L.coef).toLocaleString('es-AR', { maximumFractionDigits:4 })} %, el PDF ${pctAR(l.coefPdf)}).`); }
    if (!igualC(l.fondo, fondo)){ por.push('fondo'); motivos.push(`Fondo de ${plata(l.fondo)} (la app usa ${plata(fondo)}).`); }
    return { l, lote, filas, por, motivos, dE, estado:por.length ? 'mirar' : 'igual' };
  });
  /* Lo que se encontró, en pocas frases */
  if (!(+b.tasaInteres > 0)){ const t = lotes.filter(x => x.l.deuda > 0 && x.l.interes > 0).map(x => Math.round(x.l.interes / x.l.deuda * 10000) / 100).sort((a, c) => a - c); b.tasaInteres = t.length ? t[Math.floor(t.length / 2)] : 0; }
  const hallazgos = [], ya = liquidacionDe(b.periodo);
  if (ya && ya.estado === 'emitida') hallazgos.push(ya.real ? { ic:'refresh', c:'sky', t:`${nombrePeriodo(b.periodo)} ya estaba traída`, d:'Se vuelve a cargar igual: no se duplica ningún pago ni gasto.' }
    : { ic:'alert', c:'danger', t:`${nombrePeriodo(b.periodo)} ya está emitida desde la app`, d:'La real la reemplaza: cada lote queda con el cupón de Octavo Piso.' });
  const conDeuda = lotes.filter(x => x.l.deuda > 0 && x.l.interes > 0), tarde = lotes.filter(x => x.por.includes('interes') && x.l.deuda < 1);
  if (conDeuda.length) hallazgos.push({ ic:'wallet', c:'warn', t:`Interés por deuda: Octavo Piso aplicó ${pctAR(b.tasaInteres)} por mes a ${plural(conDeuda.length, 'lote')}`, d:`La app hoy calcula ${pctAR(tasa)} (${textoMora()}). Si querés que coincidan, cambialo en Automáticas → Cómo se calcula.` });
  if (tarde.length) hallazgos.push({ ic:'clock', c:'sky', t:`${plural(tarde.length, 'lote pagó', 'lotes pagaron')} después del 2º vencimiento`, d:`Octavo Piso les cobró interés por el atraso (${plata(tarde.reduce((a, x) => a + x.l.interes, 0))} entre todos). Lotes ${tarde.map(x => x.l.lote).join(', ')}.` });
  lotes.filter(x => x.por.includes('saldo')).forEach(x => hallazgos.push({ ic:'alert', c:'danger', t:`${x.lote}: arranca con otro saldo`, d:x.motivos[0] }));
  lotes.filter(x => x.l.interesCancelado).forEach(x => hallazgos.push({ ic:'check', c:'ok', t:`${x.lote}: intereses cancelados`, d:`Octavo Piso le canceló ${plata(x.l.interesCancelado)} de interés de este mes.` }));
  const maxE = lotes.reduce((a, x) => Math.max(a, Math.abs(x.dE)), 0);
  hallazgos.push({ ic:'sliders', c: maxE >= 50 ? 'warn' : 'ok', t: maxE >= 50 ? 'El prorrateo difiere en algunos lotes' : 'El prorrateo coincide con los coeficientes de la app', d:`Diferencia máxima por lote: ${plata(maxE)}${b.prorrateo && b.prorrateo.nota ? '. ' + b.prorrateo.nota : '.'}` });
  const nuevos = b.gastos.filter(g => g.nuevo);
  if (nuevos.length) hallazgos.push({ ic:'plus', c:'sky', t:`${plural(nuevos.length, 'gasto nuevo', 'gastos nuevos')} (no estaba${nuevos.length > 1 ? 'n' : ''} en ${mesAnt})`, d:nuevos.map(g => `${g.proveedor} · ${plata(g.total)}`).join(' · ') });
  if (aLista(b.noVinieron).length) hallazgos.push({ ic:'x', c:'sky', t:`${plural(b.noVinieron.length, 'gasto de', 'gastos de')} ${mesAnt} no vino${b.noVinieron.length > 1 ? 'eron' : ''}`, d:b.noVinieron.map(g => `${g.proveedor}${g.cuota ? ' (cuota ' + g.cuota + ')' : ''}`).join(' · ') });
  return { lotes, hallazgos, tasa };
}

/* ---------- 4. LA PANTALLA ---------- */
const RevisarReal = {
  b:null, cmp:null, ctrl:[], filtro:'mirar', q:'', abiertos:new Set(), verControles:false,
  async abrir(file){
    if (!esAdmin()) return toast('Solo la Administración trae liquidaciones', 'alert');
    const esPdf = /\.pdf$/i.test(file.name) || file.type === 'application/pdf';
    hoja('Leyendo la liquidación', `<div class="rv-leyendo"><span class="rv-gira">${I(esPdf ? 'file' : 'download')}</span>
      <b>${esPdf ? 'Leyendo el PDF de Octavo Piso…' : 'Leyendo el archivo…'}</b>
      <ol class="rv-pasos"><li class="on">Páginas</li><li>Gastos</li><li>Lotes</li><li>Controles</li><li>La app contra el PDF</li></ol>
      <small>${esPdf ? 'Se lee en este equipo: el PDF no se sube a ningún lado y los nombres no se guardan.' : ''}</small></div>`, { ancho:'560px' });
    const paso = n => document.querySelectorAll('.rv-pasos li').forEach((li, i) => li.classList.toggle('on', i <= n));
    try {
      let b;
      if (esPdf){
        const pags = await LectorPDF.paginas(await file.arrayBuffer()); paso(1);
        const ant = (() => { const m = /Per[ií]odo:\s*([A-Za-zé]+)\s+(\d{4})/.exec(pags.map(p => p.lineas.map(l => l.t).join('\n')).join('\n')); if (!m) return ''; const k = MESES_LARGO.indexOf(normTxt(m[1])); return k > 0 ? periodoAnterior(`${m[2]}-${pad(k)}`) : ''; })();
        b = parsearOctavo(pags, { previos:ant ? gastosDe(ant) : [] }); paso(2);
      } else {
        try { b = JSON.parse(await file.text()); } catch(e){ throw new Error('Ese archivo no es el PDF de Octavo Piso ni un .json de liquidación.'); }
        if (b.tipo !== 'liquidacion-real' || !b.periodo || !b.anterior || !Array.isArray(b.gastos) || !Array.isArray(b.lotes)) throw new Error('No es el PDF de Octavo Piso ni el archivo de una liquidación real (liquidacion-<mes>.json)');
        b._derivado = b.lotes.some(l => l.deuda == null) ? ['deuda', 'interesColumna'] : [];
        b.lotes.forEach(l => { if (l.interesColumna == null) l.interesColumna = +l.interes || 0; if (l.deuda == null) l.deuda = Math.max(0, r2(l.saldoAnterior - l.pagos)); ['mejoras', 'multas', 'disponible', 'particulares'].forEach(k => { l[k] = +l[k] || 0; }); });
        paso(2);
      }
      validarReal(b); paso(3);
      this.b = b; this.ctrl = controlarOctavo(b, { pdf:esPdf }); paso(4);
      this.cmp = compararConApp(b); this.filtro = this.cmp.lotes.some(x => x.estado === 'mirar') ? 'mirar' : 'todos'; this.q = ''; this.abiertos = new Set(); this.verControles = this.ctrl.some(c => !c.ok && c.grave);
      this.pintar();
    } catch(err){ console.error(err); hoja('No se trajo la liquidación', `${aviso('danger', 'alert', 'No pude leer ese archivo', esc(err.message))}<button class="btn btn-pri btn-block" data-a="cerrar-hoja">Entendido</button>`); }
  },
  pintar(){
    const b = this.b, C = this.cmp, ctrl = this.ctrl, mal = ctrl.filter(c => !c.ok), graves = mal.filter(c => c.grave);
    const nM = C.lotes.filter(x => x.estado === 'mirar').length, nI = C.lotes.length - nM, totCup = b.lotes.reduce((a, l) => a + l.total, 0);
    const q = normTxt(this.q).replace(/^lote\s*/, ''), lista = C.lotes.filter(x => (this.filtro === 'todos' || x.estado === this.filtro) && (!q || normTxt(x.l.lote).startsWith(q)));
    const chip = k => ({ saldo:'Saldo anterior', pagos:'Pagos', interes:'Interés', expensas:'Prorrateo', fondo:'Fondo' }[k] || k);
    const html = `<div class="rv">
      <header class="rv-cab"><div><small>${esc(b.fuente)}</small><b>${nombrePeriodo(b.periodo)}</b>
          <span>${I('calendar')} vence el ${b.vto1 ? fechaCorta(b.vto1) : '¿?'} y el ${b.vto2 ? fechaCorta(b.vto2) : '¿?'}</span></div>
        <div class="rv-kpis"><span><b>${b.lotes.length}</b><small>cupones</small></span><span><b>${plataCorta(totCup)}</b><small>a cobrar</small></span><span><b>${b.gastos.length + b.particulares.length}</b><small>gastos</small></span></div></header>
      <button type="button" class="rv-ctrl ${graves.length ? 'mal' : mal.length ? 'ojo' : 'bien'}" data-a="rv-controles" aria-expanded="${this.verControles}">
        <span class="rv-ctrl-ic">${I(graves.length ? 'alert' : mal.length ? 'info' : 'check')}</span>
        <span class="rv-ctrl-txt"><b>${graves.length ? 'El PDF no se leyó bien: no lo traigo' : `${ctrl.length - mal.length} de ${ctrl.length} controles del PDF bien`}</b>
          <small>${graves.length ? esc(graves[0].t + ': ' + graves[0].d) : mal.length ? esc(mal.map(c => c.t).join(' · ')) + ' · tocá para ver' : 'Rubros, lotes, columnas, banco y patrimonio cierran · tocá para ver'}</small></span>
        <span class="rv-flecha">${I('right')}</span></button>
      ${this.verControles ? `<ul class="rv-ctrl-lista">${ctrl.map(c => `<li class="${c.ok ? 'ok' : c.grave ? 'mal' : 'ojo'}">${I(c.ok ? 'check' : c.grave ? 'x' : 'info')}<span><b>${esc(c.t)}</b>${c.d ? `<small>${esc(c.d)}</small>` : ''}</span></li>`).join('')}</ul>` : ''}
      <h3 class="rv-tit">Lo que encontré</h3>
      <div class="rv-hallazgos">${C.hallazgos.map(h => `<div class="rv-h rv-${h.c}"><span>${I(h.ic)}</span><p><b>${esc(h.t)}</b>${esc(h.d)}</p></div>`).join('')}</div>
      <h3 class="rv-tit">La app contra el PDF, lote por lote</h3>
      <div class="rv-barra" role="img" aria-label="${nI} lotes iguales y ${nM} para mirar"><i class="ok" style="flex:${nI}"></i><i class="ojo" style="flex:${nM || 0.0001}"></i></div>
      <div class="rv-filtros"><div class="seg rv-seg">${[['mirar', `Para mirar · ${nM}`], ['igual', `Iguales · ${nI}`], ['todos', `Todos · ${C.lotes.length}`]].map(([k, t]) => `<button type="button" class="${this.filtro === k ? 'on' : ''}" data-a="rv-filtro" data-v="${k}">${t}</button>`).join('')}</div>
        <label class="rv-buscar">${I('search')}<input type="search" inputmode="numeric" placeholder="Lote…" value="${esc(this.q)}" data-rv-buscar aria-label="Buscar un lote"></label></div>
      <div class="rv-lotes">${lista.slice(0, this.limite || 40).map(x => { const ab = this.abiertos.has(x.l.lote);
        return `<article class="rv-l ${x.estado}${ab ? ' abierto' : ''}">
          <button type="button" class="rv-l-fila" data-a="rv-lote" data-v="${esc(x.l.lote)}" aria-expanded="${ab}">
            <span class="rv-l-n"><small>Lote</small><b>${esc(x.l.lote)}</b></span>
            <span class="rv-l-chips">${x.estado === 'igual' ? `<em class="ok">${I('check')}igual a la app</em>` : x.por.map(k => `<em>${chip(k)}</em>`).join('')}${x.l.enAbogados ? '<em class="jud">en abogados</em>' : ''}${x.l.marca ? `<em class="marca">(${x.l.marca})</em>` : ''}</span>
            <span class="rv-l-m"><b>${plata(x.l.total)}</b><small>${x.estado === 'igual' ? 'cupón' : 'según el PDF'}</small></span>
            <span class="rv-flecha">${I('right')}</span></button>
          ${ab ? `<div class="rv-l-det"><div class="rv-f cab"><span></span><span>La app</span><span>El PDF</span><span>Diferencia</span></div>
              ${x.filas.map(f => `<div class="rv-f${Math.abs(f.dif) >= (f.k === 'expensas' ? 50 : f.k === 'total' ? 0.01 : 1) && !f.info ? ' dif' : ''}${f.k === 'total' ? ' tot' : ''}"><span class="c">${esc(f.t)}</span>
                <span><small>La app</small>${plata(f.app)}</span><span><small>El PDF</small>${plata(f.pdf)}</span><span><small>Diferencia</small>${f.info || Math.abs(f.dif) < 0.005 ? '—' : (f.dif > 0 ? '+' : '') + plata(f.dif)}</span></div>`).join('')}
            <p class="muted tiny" style="margin:6px 0 0">"Pagos recibidos" en la app son solo los que se pagaron por la app; los del PDF se registran al traerla.</p>
            ${x.motivos.length ? `<ul>${x.motivos.map(m => `<li>${esc(m)}</li>`).join('')}</ul>` : `<p class="muted small">La diferencia del total es de centavos de redondeo del prorrateo.</p>`}</div>` : ''}</article>`; }).join('') || `<p class="muted center small" style="padding:18px 0">${q ? 'No hay un lote con ese número en esta lista.' : 'Ninguno en esta lista.'}</p>`}
        ${lista.length > (this.limite || 40) ? `<button type="button" class="btn btn-sec btn-block" data-a="rv-mas">Ver ${lista.length - (this.limite || 40)} más</button>` : ''}</div>
      <div class="rv-pie"><button type="button" class="btn btn-sec" data-a="cerrar-hoja">Cancelar</button>
        <button type="button" class="btn btn-pri grow" data-a="rv-traer" ${graves.length ? 'disabled' : ''}>${I('download')}Traer ${nombrePeriodo(b.periodo)} a la app</button></div>
      ${graves.length ? '<p class="rv-nota">Se apaga porque el PDF no cerró sus propias cuentas: revisá el archivo o pasámelo.</p>' : `<p class="rv-nota">Se registran los pagos de ${MESES_LARGO[+b.periodo.slice(5)]}, los gastos y el cupón de cada lote igual al PDF. Si la volvés a traer, no se duplica nada.</p>`}
    </div>`;
    const abierta = document.getElementById('hoja')?.open && document.querySelector('#hojaCuerpo .rv');
    if (abierta){ const y = document.getElementById('hojaCuerpo').scrollTop; document.getElementById('hojaCuerpo').innerHTML = html; document.getElementById('hojaTitulo').textContent = 'Revisar antes de traer'; document.getElementById('hojaCuerpo').scrollTop = y; }
    else hoja('Revisar antes de traer', html, { ancho:'720px' });
    const inp = document.querySelector('[data-rv-buscar]'); if (inp && this._foco){ inp.focus(); inp.setSelectionRange(inp.value.length, inp.value.length); }
  },
};
A['rv-controles'] = () => { RevisarReal.verControles = !RevisarReal.verControles; RevisarReal.pintar(); };
A['rv-filtro'] = el => { RevisarReal.filtro = el.dataset.v; RevisarReal.limite = 40; RevisarReal.pintar(); };
A['rv-lote'] = el => { const k = el.dataset.v, s = RevisarReal.abiertos; if (s.has(k)) s.delete(k); else s.add(k); RevisarReal.pintar(); };
A['rv-mas'] = () => { RevisarReal.limite = (RevisarReal.limite || 40) + 60; RevisarReal.pintar(); };
A['rv-traer'] = el => { if (el.disabled || !RevisarReal.b) return; const b = RevisarReal.b; delete b._leido; delete b._derivado; traerLiquidacionReal(b); };
document.addEventListener('input', e => { if (!e.target.matches || !e.target.matches('[data-rv-buscar]')) return; RevisarReal.q = e.target.value; RevisarReal._foco = true; RevisarReal.pintar(); RevisarReal._foco = false; });
