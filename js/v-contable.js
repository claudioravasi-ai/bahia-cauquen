/* =========================================================
   CONTABILIDAD PROPIA: EL LIBRO Y LA CARPETA DEL CONTADOR
   -------------------------------------------------------
   Dos libros enlazados:
     · EXPENSAS es la fuente: los gastos del mes arman el cupón y
       los pagos de los vecinos son la cobranza.
     · El LIBRO CONTABLE se arma solo a partir de eso (un asiento
       por gasto y uno por cobro), y la Administración lo puede
       CORREGIR sin tocar la expensa ni el cupón: cuenta, neto, IVA,
       percepciones, retenciones, fecha y medio de pago, notas. El
       original queda a la vista y todo cambio va a la auditoría. Si
       después cambia el gasto de origen, el asiento avisa "cambió el
       origen" y la Administración decide si lo toma o no.
   Cada mes, la CARPETA DEL CONTADOR: libro diario, comprobantes
   recibidos (neto, IVA, percepciones), cobranzas, retenciones,
   conciliación del banco, ingresos y egresos, y la lista de lo que
   hay que presentar (ARCA y la Agencia de Recaudación Fueguina).
   Todo en PDF y planillas CSV. Solo la ve y la edita la Administración.

   Lo impositivo es una guía para el contador del barrio: él confirma
   la condición frente al IVA, Ingresos Brutos y Ganancias.
   ========================================================= */

/* Plan de cuentas simple, pensado para una asociación civil sin fines de
   lucro que administra un conjunto inmobiliario. El contador lo puede
   reasignar asiento por asiento. */
const CUENTAS = {
  '1.1':'Caja y bancos', '1.2':'Expensas a cobrar', '1.3':'Gastos particulares a recuperar',
  '2.1':'Proveedores a pagar', '2.2':'Retenciones a depositar',
  '4.1':'Ingresos por expensas', '4.2':'Intereses por mora', '4.3':'Fondo de Infraestructura', '4.4':'Ingresos de terceros (SUM, publicidad, convenios)', '4.5':'Otros ingresos',
  '5.1':'Servicios públicos', '5.2':'Abonos de servicios (vigilancia, administración, recolección)', '5.3':'Mantenimiento de partes comunes',
  '5.4':'Gastos bancarios', '5.5':'Seguros', '5.6':'Otros gastos', '5.7':'Honorarios profesionales', '5.8':'Mejoras y obras',
};
const CUENTA_DE_RUBRO = { 3:'5.1', 4:'5.2', 5:'5.3', 7:'5.4', 10:'5.5', 11:'5.6', 12:'1.3' };
const cfgConta = () => Object.assign({ cerrados:{}, ivaCond:'Exento', iibbCond:'Exento', arefNro:'', arefVence:'', ganCertVence:'', ingresosTerceros:false, ejercicioCierra:'12-31' }, Store.s.config.contable || {});
const asientos = () => aLista(Store.s.asientos).filter(Boolean);
const mesCerrado = p => !!cfgConta().cerrados[p];

/* ---------- lo que viene de Expensas ---------- */
const huellaGasto = g => JSON.stringify([g.periodo, g.proveedor, g.cuit, g.rubro, g.total, g.neto, g.iva, g.retGan, g.retSuss, g.tipoComp, g.nroComp, g.detalle, g.fecha]);
const huellaPago = p => JSON.stringify([p.lote, p.monto, p.fecha, p.medio, p.estado]);
function asientoDeGasto(g){
  const cuenta = /honorario/i.test(g.detalle || '') ? '5.7' : g.columna === 'mejoras' ? '5.8' : (CUENTA_DE_RUBRO[g.rubro] || '5.6');
  return { tipo:'egreso', origen:{ tipo:'gasto', id:g.id }, huella:huellaGasto(g), periodo:g.periodo, fecha:g.fecha || g.periodo + '-28', cuenta,
    detalle:`${g.proveedor}${g.detalle ? ' · ' + String(g.detalle).replace(/\s*\(estimado\)/i, '') : ''}`, proveedor:g.proveedor, cuit:g.cuit || '',
    comprobante:`${g.tipoComp || ''} ${g.nroComp || ''}`.trim(), importe:+g.total || 0, neto:+g.neto || 0, iva:+g.iva || 0, percepciones:0,
    retGan:+g.retGan || 0, retSuss:+g.retSuss || 0, fechaPago:'', medioPago:'Transferencia', lote:g.lote || '', estimado:!!g.estimado, foto:g.foto || null };
}
function asientoDePago(p){
  return { tipo:'ingreso', origen:{ tipo:'pago', id:p.id }, huella:huellaPago(p), periodo:String(p.fecha || '').slice(0, 7), fecha:p.fecha, cuenta:'4.1',
    detalle:`Cobranza de expensas · ${p.lote}${p.recibo ? ' · recibo ' + p.recibo : ''}`, lote:p.lote, importe:+p.monto || 0, medioPago:p.medio || '', fechaPago:p.fecha,
    comprobante:p.recibo ? 'Recibo ' + p.recibo : '', neto:0, iva:0, percepciones:0, retGan:0, retSuss:0 };
}
/* Pone el libro al día con Expensas. Lo que se editó a mano no se pisa:
   se marca "cambió el origen". Devuelve cuántos cambios hizo. */
function sincronizarLibro(s){
  s.asientos = aLista(s.asientos);
  const cerrados = cfgConta().cerrados;
  const porOrigen = new Map(s.asientos.filter(a => a && a.origen).map(a => [a.origen.tipo + ':' + a.origen.id, a]));
  let n = 0;
  const poner = (clave, nuevo) => {
    const a = porOrigen.get(clave);
    if (!a){ if (cerrados[nuevo.periodo]) return; s.asientos.push({ id:'as' + uid(), ...nuevo, at:Date.now() }); n++; return; }
    if (a.huella === nuevo.huella || a.anulado) return;
    if (a.editado || cerrados[a.periodo]){ if (!a.origenCambio){ a.origenCambio = true; a.origenNuevo = nuevo; n++; } return; }
    Object.assign(a, nuevo); n++;
  };
  s.gastos.filter(g => g && !g.anulado).forEach(g => poner('gasto:' + g.id, asientoDeGasto(g)));
  s.pagos.filter(p => p && p.estado === 'confirmado').forEach(p => poner('pago:' + p.id, asientoDePago(p)));
  /* Si el gasto o el pago de origen se borró, el asiento queda anulado (no se borra). */
  const vivos = new Set([...s.gastos.filter(g => g && !g.anulado).map(g => 'gasto:' + g.id), ...s.pagos.filter(p => p && p.estado === 'confirmado').map(p => 'pago:' + p.id)]);
  s.asientos.forEach(a => { if (a.origen && !vivos.has(a.origen.tipo + ':' + a.origen.id) && !a.anulado){ a.anulado = true; a.anuladoMotivo = 'Se borró o rechazó el registro de origen en Expensas'; n++; } });
  return n;
}
const Libro = {
  ultimo:0,
  alDia(){
    if (!esAdmin() || Date.now() - this.ultimo < 3000) return;
    this.ultimo = Date.now();
    const copia = { asientos:JSON.parse(JSON.stringify(aLista(Store.s.asientos))), gastos:Store.s.gastos, pagos:Store.s.pagos };
    if (sincronizarLibro(copia)) Store.cambiar(s => { sincronizarLibro(s); });
  },
};
const asientosDe = p => asientos().filter(a => a.periodo === p && !a.anulado && !a.estimado);

/* ---------- los números del mes ---------- */
function resumenContable(p){
  const as = asientosDe(p), egr = as.filter(a => a.tipo === 'egreso'), ing = as.filter(a => a.tipo === 'ingreso');
  const suma = (l, k = 'importe') => l.reduce((t, a) => t + (+a[k] || 0), 0);
  const porCuenta = {}; as.forEach(a => { porCuenta[a.cuenta] = (porCuenta[a.cuenta] || 0) + (a.tipo === 'egreso' ? -1 : 1) * (+a.importe || 0); });
  /* Banco: saldo del cierre anterior + cobros − pagos. El punto de partida
     es el saldo real del último resumen importado. */
  const plan = typeof cfgPlan === 'function' ? cfgPlan() : {};
  let inicial = null;
  if (plan.base && p > plan.base){
    inicial = plan.bancoInicial || 0;
    for (let m = periodoSiguiente(plan.base); m < p; m = periodoSiguiente(m)){ const a2 = asientosDe(m); inicial += suma(a2.filter(a => a.tipo === 'ingreso')) - suma(a2.filter(a => a.tipo === 'egreso')); }
  }
  const terceros = suma(ing.filter(a => a.cuenta === '4.4'));
  return { as, egr, ing, egresos:suma(egr), ingresos:suma(ing), iva:suma(egr, 'iva'), neto:suma(egr, 'neto'), percepciones:suma(egr, 'percepciones'),
    retGan:suma(egr, 'retGan'), retSuss:suma(egr, 'retSuss'), porCuenta, bancoInicial:inicial, bancoFinal: inicial == null ? null : inicial + suma(ing) - suma(egr),
    terceros, editados:as.filter(a => a.editado).length, cambiaron:as.filter(a => a.origenCambio).length, manuales:as.filter(a => !a.origen).length };
}

/* ---------- lo que hay que presentar (guía para el contador) ---------- */
function obligacionesDe(p){
  const c = cfgConta(), e = cfgExp(), hoy = hoyISO(), r = resumenContable(p);
  const [a, m] = p.split('-').map(Number), venc = d => isoDe(new Date(a, m, d));
  const lista = [
    { id:'iva', nombre:'IVA', detalle: c.ivaCond === 'Exento' ? 'Exento: no liquida débito ni crédito. El IVA de las facturas es costo. Ojo si hay ingresos de terceros (abajo).' : 'Responsable inscripto: declaración jurada mensual (F.2002).', vence: c.ivaCond === 'Exento' ? '' : venc(20), presenta: c.ivaCond !== 'Exento' },
    { id:'iibb', nombre:'Ingresos Brutos · Agencia de Recaudación Fueguina (AREF)', detalle: c.iibbCond === 'Exento' ? `Exento${c.arefVence ? ' hasta el ' + fechaCorta(c.arefVence) : ''}: mantener vigente la constancia de exención.` : 'Inscripto: declaración jurada mensual.', vence: c.iibbCond === 'Exento' ? '' : venc(18), presenta: c.iibbCond !== 'Exento' },
    { id:'sire', nombre:'Retenciones practicadas (Ganancias RG 830 y Seguridad Social)', detalle: r.retGan + r.retSuss ? `Se retuvo ${plata(r.retGan + r.retSuss)} en el mes: declarar y depositar.` : 'No hubo retenciones este mes.', vence:venc(12), presenta: r.retGan + r.retSuss > 0 },
    { id:'f931', nombre:'F.931 · aportes y contribuciones', detalle: e.empleados ? 'Personal en relación de dependencia.' : 'Sin personal propio: no corresponde.', vence:venc(11), presenta: !!e.empleados },
  ];
  if (r.terceros) lista.push({ id:'terceros', nombre:'Ingresos de terceros del mes', detalle:`${plata(r.terceros)} cobrados a no propietarios: el contador evalúa si están alcanzados por IVA o Ingresos Brutos.`, vence:'', presenta:true, aviso:true });
  return lista.map(o => { const reg = Store.s.impuestos.find(x => x.periodo === p && x.tipo === o.id);
    return { ...o, estado: !o.presenta ? 'no-corresponde' : reg ? 'presentado' : 'pendiente', presentadoEl:reg?.fecha, vencido: o.presenta && !reg && o.vence && hoy > o.vence }; });
}
/* Vencimientos que no son mensuales. */
function alertasFiscales(){
  const c = cfgConta(), hoy = hoyISO(), out = [];
  const venceEn = f => f ? Math.round((fechaDe(f) - fechaDe(hoy)) / DIA) : null;
  const g = venceEn(c.ganCertVence), ar = venceEn(c.arefVence);
  if (!c.ganCertVence) out.push(['warn', 'Falta cargar el vencimiento del certificado de exención de Ganancias (ARCA)']);
  else if (g < 0) out.push(['danger', `El certificado de exención de Ganancias venció el ${fechaCorta(c.ganCertVence)}`]);
  else if (g <= 60) out.push(['warn', `El certificado de exención de Ganancias vence en ${g} días`]);
  if (c.iibbCond === 'Exento'){ if (!c.arefVence) out.push(['warn', 'Falta cargar el vencimiento de la exención de Ingresos Brutos (AREF)']);
    else if (ar < 0) out.push(['danger', `La exención de Ingresos Brutos (AREF) venció el ${fechaCorta(c.arefVence)}`]);
    else if (ar <= 60) out.push(['warn', `La exención de Ingresos Brutos (AREF) vence en ${ar} días`]); }
  return out;
}

/* ---------- la pestaña "Libro contable" ---------- */
const mesesContables = () => [...new Set([periodoHoy(), periodoAnterior(periodoHoy()), ...asientos().map(a => a.periodo)])].filter(Boolean).sort().reverse();
CONTA.libro = per => {
  Libro.alDia();
  const p = /^\d{4}-\d{2}$/.test(per || '') ? per : periodoAnterior(periodoHoy()), r = resumenContable(p), cerrado = mesCerrado(p);
  const fila = a => `<div class="it asiento ${a.origenCambio ? 'cambio' : ''}"><span class="ic ic-${a.tipo === 'ingreso' ? 'ok' : 'wood'}" style="width:34px;height:34px;border-radius:11px;display:grid;place-items:center;flex:none">${I(a.tipo === 'ingreso' ? 'wallet' : 'file')}</span>
    <div class="txt"><b>${esc(a.detalle)}</b><span>${fechaCorta(a.fecha || p + '-01')} · ${a.cuenta} ${esc(CUENTAS[a.cuenta] || '')}${a.iva ? ' · IVA ' + plata(a.iva) : ''}${a.retGan || a.retSuss ? ' · ret. ' + plata((+a.retGan || 0) + (+a.retSuss || 0)) : ''}</span>
      <span>${!a.origen ? '<span class="pill p-accent">manual</span>' : ''}${a.editado ? '<span class="pill p-sky">corregido</span>' : ''}${a.origenCambio ? '<span class="pill p-warn">cambió el origen</span>' : ''}</span></div>
    <b class="num" style="color:${a.tipo === 'ingreso' ? 'var(--ok)' : 'var(--ink)'}">${a.tipo === 'ingreso' ? '' : '− '}${plata(a.importe)}</b>
    ${cerrado ? '' : `<button class="icon-btn" data-a="asiento-editar" data-id="${a.id}" aria-label="Corregir">${I('edit')}</button>`}</div>`;
  return `<div class="chips">${mesesContables().map(m => `<button class="chip ${m === p ? 'on' : ''}" data-a="abrir" data-v="contabilidad" data-p="libro|${m}">${nombrePeriodo(m)}</button>`).join('')}</div>
    <p class="muted small" style="margin:0 0 10px">Se arma solo con los gastos y los cobros de Expensas. Lo que corrijas acá <b>no cambia</b> la expensa ni el cupón; el original queda guardado.</p>
    ${cerrado ? aviso('ok', 'lock', `${nombrePeriodo(p)} está cerrado para el contador`, `Cerrado el ${fechaCorta(isoDe(new Date(cfgConta().cerrados[p])))}. Para corregir algo, reabrilo en la Carpeta del contador.`) : ''}
    ${r.cambiaron ? aviso('warn', 'alert', `${plural(r.cambiaron, 'asiento tiene', 'asientos tienen')} cambios en Expensas`, 'Se corrigió el gasto o el pago de origen después de tu corrección. Abrilo para tomar el cambio o dejar tu versión.') : ''}
    <div class="garita-kpis"><div class="kpi"><b>${plataCorta(r.ingresos)}</b><span>Ingresos</span></div><div class="kpi"><b>${plataCorta(r.egresos)}</b><span>Egresos</span></div><div class="kpi"><b>${plataCorta(r.ingresos - r.egresos)}</b><span>Resultado del mes</span></div></div>
    ${cerrado ? '' : superficie({ a:'asiento-nuevo', v:p, icon:'plus', color:'brand', t:'Asiento manual', s:'Un ajuste, un ingreso de terceros, una comisión bancaria que no pasó por Expensas' })}
    ${sec('Egresos', `<span class="muted small">${plural(r.egr.length, 'asiento')}</span>`)}<div class="card lista">${r.egr.sort((a, b) => a.cuenta.localeCompare(b.cuenta) || b.importe - a.importe).map(fila).join('') || '<p class="muted small" style="margin:6px 0">Sin egresos.</p>'}</div>
    ${sec('Ingresos', `<span class="muted small">${plural(r.ing.length, 'asiento')}</span>`)}<div class="card lista">${r.ing.sort((a, b) => String(a.fecha).localeCompare(String(b.fecha))).map(fila).join('') || '<p class="muted small" style="margin:6px 0">Sin cobros confirmados este mes.</p>'}</div>
    ${superficie({ a:'abrir', v:'contabilidad', p:'carpeta|' + p, icon:'file', color:'accent', t:'Carpeta del contador de ' + nombrePeriodo(p), s:'PDF y planillas, con lo que hay que presentar' })}`;
};
A['asiento-editar'] = el => {
  const a = asientos().find(x => x.id === el.dataset.id); if (!a) return;
  const orig = a.original || null;
  hoja(a.origen ? 'Corregir el asiento' : 'Asiento manual', `<form data-f="asiento" data-id="${a.id}">
    ${a.origenCambio && a.origenNuevo ? aviso('warn', 'alert', 'Cambió el registro de origen en Expensas', `Ahora dice: ${esc(a.origenNuevo.detalle)} · ${plata(a.origenNuevo.importe)}`, `<button type="button" class="btn btn-xs btn-pri" data-a="asiento-tomar" data-id="${a.id}">Tomar el cambio</button><button type="button" class="btn btn-xs btn-sec" data-a="asiento-ignorar" data-id="${a.id}">Dejar mi versión</button>`) : ''}
    <div class="grid2"><div class="field"><label>Cuenta</label><select name="cuenta">${Object.entries(CUENTAS).map(([k, t]) => `<option value="${k}" ${a.cuenta === k ? 'selected' : ''}>${k} · ${t}</option>`).join('')}</select></div>
      <div class="field"><label>Fecha</label><input type="date" name="fecha" value="${esc(a.fecha || '')}" required></div></div>
    <div class="field"><label>Detalle</label><input name="detalle" maxlength="140" value="${esc(a.detalle || '')}" required></div>
    <div class="grid3"><div class="field"><label>Importe total</label><input type="number" step="0.01" name="importe" value="${a.importe ?? ''}" required></div>
      <div class="field"><label>Neto</label><input type="number" step="0.01" name="neto" value="${a.neto || ''}"></div>
      <div class="field"><label>IVA</label><input type="number" step="0.01" name="iva" value="${a.iva || ''}"></div></div>
    <div class="grid3"><div class="field"><label>Percepciones</label><input type="number" step="0.01" name="percepciones" value="${a.percepciones || ''}"></div>
      <div class="field"><label>Ret. Ganancias</label><input type="number" step="0.01" name="retGan" value="${a.retGan || ''}"></div>
      <div class="field"><label>Ret. Seg. Social</label><input type="number" step="0.01" name="retSuss" value="${a.retSuss || ''}"></div></div>
    <div class="grid3"><div class="field"><label>CUIT</label><input name="cuit" maxlength="13" value="${esc(a.cuit || '')}"></div>
      <div class="field"><label>Comprobante</label><input name="comprobante" maxlength="40" value="${esc(a.comprobante || '')}"></div>
      <div class="field"><label>Pagado el</label><input type="date" name="fechaPago" value="${esc(a.fechaPago || '')}"></div></div>
    <div class="grid2"><div class="field"><label>Medio</label><select name="medioPago">${['Transferencia','Débito automático','Cheque','Efectivo','Mercado Pago','Otro'].map(m => `<option ${a.medioPago === m ? 'selected' : ''}>${m}</option>`).join('')}</select></div>
      <div class="field"><label>Tipo</label><select name="tipo" ${a.origen ? 'disabled' : ''}><option value="egreso" ${a.tipo === 'egreso' ? 'selected' : ''}>Egreso</option><option value="ingreso" ${a.tipo === 'ingreso' ? 'selected' : ''}>Ingreso</option></select></div></div>
    <div class="field"><label>Nota para el contador</label><input name="nota" maxlength="200" value="${esc(a.nota || '')}"></div>
    ${orig ? `<div class="card plana small">${I('info')} Original de Expensas: ${esc(orig.detalle)} · ${plata(orig.importe)} · cuenta ${orig.cuenta}${orig.iva ? ' · IVA ' + plata(orig.iva) : ''}
      <div class="btns" style="margin-top:8px"><button type="button" class="btn btn-xs btn-sec" data-a="asiento-original" data-id="${a.id}">Volver al original</button></div></div>` : ''}
    <button class="btn btn-pri btn-block">${I('check')}Guardar</button>
    ${!a.origen ? `<button type="button" class="btn btn-danger-soft btn-block" style="margin-top:8px" data-a="asiento-anular" data-id="${a.id}">Anular este asiento</button>` : ''}</form>`, { ancho:'640px' });
};
A['asiento-nuevo'] = el => {
  const id = 'as' + uid();
  Store.cambiar(s => { s.asientos = aLista(s.asientos); s.asientos.push({ id, tipo:'egreso', periodo:el.dataset.v, fecha:el.dataset.v + '-28', cuenta:'5.6', detalle:'', importe:0, neto:0, iva:0, percepciones:0, retGan:0, retSuss:0, manual:true, borrador:true, at:Date.now() }); });
  A['asiento-editar']({ dataset:{ id } });
};
F['asiento'] = (d, form) => {
  Store.cambiar(s => {
    const a = aLista(s.asientos).find(x => x.id === form.dataset.id); if (!a) return;
    const campos = ['cuenta','fecha','detalle','cuit','comprobante','fechaPago','medioPago','nota'], nums = ['importe','neto','iva','percepciones','retGan','retSuss'];
    const antes = JSON.stringify(a);
    if (a.origen && !a.original) a.original = Object.fromEntries([...campos, ...nums].map(k => [k, a[k] ?? '']));
    campos.forEach(k => { a[k] = String(d[k] ?? '').trim(); });
    nums.forEach(k => { a[k] = Math.round((+d[k] || 0) * 100) / 100; });
    if (!a.origen && d.tipo) a.tipo = d.tipo;
    a.periodo = String(a.fecha).slice(0, 7) || a.periodo;
    if (a.origen) a.editado = true;
    delete a.borrador;
    if (antes !== JSON.stringify(a)) auditar(s, a.origen ? 'Corrigió un asiento contable' : 'Cargó un asiento manual', `${a.periodo} · ${a.detalle} · ${plata(a.importe)}`, a.id);
  });
  cerrarHoja(); toast('Asiento guardado. La expensa no cambió.', 'check');
};
/* Un asiento manual que se abrió y no se guardó no queda en el libro. */
document.addEventListener('close', e => { if (e.target && e.target.id === 'hoja' && asientos().some(a => a.borrador)) Store.cambiar(s => { s.asientos = aLista(s.asientos).filter(a => !a.borrador); }); }, true);
A['asiento-original'] = el => { Store.cambiar(s => { const a = aLista(s.asientos).find(x => x.id === el.dataset.id); if (!a || !a.original) return;
  Object.assign(a, a.original); delete a.original; a.editado = false; auditar(s, 'Volvió un asiento al original de Expensas', a.detalle, a.id); });
  const a = asientos().find(x => x.id === el.dataset.id); Store.cambiar(s => sincronizarLibro(s)); cerrarHoja(); toast('Asiento igual al de Expensas', 'check'); };
A['asiento-tomar'] = el => { Store.cambiar(s => { const a = aLista(s.asientos).find(x => x.id === el.dataset.id); if (!a || !a.origenNuevo) return;
  Object.assign(a, a.origenNuevo); delete a.origenNuevo; delete a.original; a.origenCambio = false; a.editado = false; auditar(s, 'Tomó el cambio de Expensas en un asiento', a.detalle, a.id); }); cerrarHoja(); toast('Asiento actualizado', 'check'); };
A['asiento-ignorar'] = el => { Store.cambiar(s => { const a = aLista(s.asientos).find(x => x.id === el.dataset.id); if (!a) return;
  a.huella = a.origenNuevo?.huella || a.huella; delete a.origenNuevo; a.origenCambio = false; auditar(s, 'Dejó su versión de un asiento', a.detalle, a.id); }); cerrarHoja(); toast('Queda tu versión', 'check'); };
A['asiento-anular'] = async el => { if (!await confirmar('Anular el asiento', 'Queda en el libro como anulado (no se borra).', { si:'Anular', peligro:true })) return;
  Store.cambiar(s => { const a = aLista(s.asientos).find(x => x.id === el.dataset.id); if (a){ a.anulado = true; a.anuladoMotivo = 'Anulado a mano'; auditar(s, 'Anuló un asiento manual', a.detalle, a.id); } }); };

/* ---------- la pestaña "Carpeta del contador" ---------- */
CONTA.carpeta = per => {
  Libro.alDia();
  const p = /^\d{4}-\d{2}$/.test(per || '') ? per : periodoAnterior(periodoHoy()), r = resumenContable(p), obs = obligacionesDe(p), c = cfgConta();
  const cerrado = mesCerrado(p);
  return `<div class="chips">${mesesContables().map(m => `<button class="chip ${m === p ? 'on' : ''}" data-a="abrir" data-v="contabilidad" data-p="carpeta|${m}">${nombrePeriodo(m)}</button>`).join('')}</div>
    ${alertasFiscales().map(([n, t]) => aviso(n, 'alert', t, 'Se carga en la sección "Datos fiscales" de abajo.')).join('')}
    <div class="card"><b style="font-size:16px">Carpeta de ${nombrePeriodo(p)}</b>
      <div class="lista" style="margin-top:8px">
        <div class="it"><div class="txt"><b>Ingresos</b><span>${plural(r.ing.length, 'cobro')}</span></div><b class="num">${plata(r.ingresos)}</b></div>
        <div class="it"><div class="txt"><b>Egresos</b><span>${plural(r.egr.length, 'comprobante')}${r.editados ? ' · ' + plural(r.editados, 'corregido') : ''}${r.manuales ? ' · ' + plural(r.manuales, 'manual', 'manuales') : ''}</span></div><b class="num">${plata(r.egresos)}</b></div>
        <div class="it"><div class="txt"><b>IVA en facturas recibidas</b><span>${c.ivaCond === 'Exento' ? 'Es costo: el barrio es exento' : 'Crédito fiscal'}</span></div><b class="num">${plata(r.iva)}</b></div>
        <div class="it"><div class="txt"><b>Retenciones practicadas</b><span>Ganancias ${plata(r.retGan)} · Seg. Social ${plata(r.retSuss)}</span></div><b class="num">${plata(r.retGan + r.retSuss)}</b></div>
        ${r.bancoInicial != null ? `<div class="it"><div class="txt"><b>Banco</b><span>Saldo inicial ${plata(r.bancoInicial)} + ingresos − egresos</span></div><b class="num">${plata(r.bancoFinal)}</b></div>` : ''}
      </div></div>
    ${r.cambiaron ? aviso('warn', 'alert', `Hay ${plural(r.cambiaron, 'asiento')} con cambios en Expensas sin revisar`, 'Revisalos en el Libro contable antes de cerrar.') : ''}
    ${sec('Lo que hay que presentar')}
    ${obs.map(o => `<div class="card" style="padding:12px 14px"><div class="row"><span class="ic ic-${o.estado === 'presentado' ? 'ok' : o.estado === 'no-corresponde' ? 'sky' : o.vencido ? 'danger' : o.aviso ? 'warn' : 'accent'}" style="width:36px;height:36px;border-radius:12px;display:grid;place-items:center;flex:none">${I(o.estado === 'presentado' ? 'check' : o.estado === 'no-corresponde' ? 'info' : 'clipboard')}</span>
      <div class="grow"><b>${esc(o.nombre)}</b><div class="muted small">${esc(o.detalle)}</div>${o.vence && o.presenta ? `<div class="muted small">Vence ${fechaCorta(o.vence)}${o.estado === 'presentado' ? ' · presentado ' + fechaCorta(o.presentadoEl) : o.vencido ? ' · vencido' : ''}</div>` : ''}</div>
      ${o.estado === 'pendiente' && !o.aviso ? `<button class="btn btn-xs btn-ok" data-a="marcar-presentado" data-v="${o.id}" data-p="${p}">Presentado</button>` : o.estado === 'presentado' ? '<span class="pill p-ok">Listo</span>' : o.estado === 'no-corresponde' ? '<span class="pill">No corresponde</span>' : ''}</div></div>`).join('')}
    ${sec('Para el contador')}
    ${superficie({ a:'carpeta-pdf', v:p, icon:'file', color:'accent', t:'Carpeta completa en PDF', s:'Resumen, libro diario, comprobantes, cobranzas, retenciones, banco y presentaciones' })}
    ${superficie({ a:'carpeta-csv', v:p, icon:'download', color:'sky', t:'Planillas para su sistema (CSV)', s:'Libro diario · comprobantes recibidos · cobranzas · retenciones' })}
    ${superficie({ a:'carpeta-mandar', v:p, icon:'mail', color:'brand', t:'Mandarle la carpeta al contador', s: cfgExp().contador || 'Falta su correo (Contabilidad → Parámetros)' })}
    ${cerrado ? superficie({ a:'carpeta-reabrir', v:p, icon:'refresh', color:'danger', t:`Reabrir ${nombrePeriodo(p)}`, s:'Para corregir un asiento', cls:'peligro' })
      : superficie({ a:'carpeta-cerrar', v:p, icon:'lock', color:'ok', t:`Cerrar ${nombrePeriodo(p)} para el contador`, s:'Congela el libro de ese mes: lo que cambie después en Expensas queda como aviso', cls:'acento' })}
    ${sec('Datos fiscales de la asociación')}
    <form data-f="datos-fiscales" class="card">
      <div class="grid2"><div class="field"><label>Condición frente al IVA</label><select name="ivaCond">${['Exento','Responsable inscripto','No alcanzado'].map(x => `<option ${c.ivaCond === x ? 'selected' : ''}>${x}</option>`).join('')}</select></div>
        <div class="field"><label>Ingresos Brutos (AREF)</label><select name="iibbCond">${['Exento','Inscripto','No alcanzado'].map(x => `<option ${c.iibbCond === x ? 'selected' : ''}>${x}</option>`).join('')}</select></div></div>
      <div class="grid3"><div class="field"><label>Nº en AREF</label><input name="arefNro" value="${esc(c.arefNro)}" maxlength="30"></div>
        <div class="field"><label>Exención AREF vence</label><input type="date" name="arefVence" value="${esc(c.arefVence)}"></div>
        <div class="field"><label>Certificado exención Ganancias vence</label><input type="date" name="ganCertVence" value="${esc(c.ganCertVence)}"></div></div>
      <div class="field"><label>Cierre del ejercicio (MM-DD)</label><input name="ejercicioCierra" value="${esc(c.ejercicioCierra)}" maxlength="5" placeholder="12-31"></div>
      <p class="muted tiny" style="margin:0 0 10px">Lo confirma el contador con las constancias de ARCA y de la Agencia de Recaudación Fueguina. La app avisa 60 días antes de cada vencimiento.</p>
      <button class="btn btn-pri btn-block">${I('check')}Guardar datos fiscales</button></form>
    ${aviso('info', 'info', 'Esto es una guía, no reemplaza al contador', 'En Tierra del Fuego rige además la Ley 19.640 (por eso muchas facturas locales vienen sin IVA). Si el barrio cobra algo a terceros (SUM, publicidad, convenios), cargalo como asiento en la cuenta 4.4: queda separado para que el contador evalúe si tributa. Al cierre del ejercicio corresponden balance con dictamen, memoria, asamblea y la presentación ante la Inspección General de Justicia de la provincia.')}`;
};
F['datos-fiscales'] = d => {
  Store.cambiar(s => { s.config.contable = Object.assign({}, cfgConta(), { ivaCond:d.ivaCond, iibbCond:d.iibbCond, arefNro:String(d.arefNro || '').trim(), arefVence:d.arefVence || '', ganCertVence:d.ganCertVence || '', ejercicioCierra:String(d.ejercicioCierra || '12-31').trim() });
    auditar(s, 'Cambió los datos fiscales', `IVA ${d.ivaCond} · IIBB ${d.iibbCond}`); });
  toast('Datos fiscales guardados', 'check');
};
A['carpeta-cerrar'] = async el => {
  const p = el.dataset.v, r = resumenContable(p);
  if (!await confirmar(`Cerrar ${nombrePeriodo(p)}`, `${plural(r.as.length, 'asiento')} · ingresos ${plata(r.ingresos)} · egresos ${plata(r.egresos)}.${r.cambiaron ? ` <b>Hay ${plural(r.cambiaron, 'asiento')} con cambios sin revisar.</b>` : ''} Lo que cambie después en Expensas no modifica este mes: queda como aviso.`, { si:'Cerrar el mes' })) return;
  Store.cambiar(s => { s.config.contable = Object.assign({}, cfgConta()); s.config.contable.cerrados = Object.assign({}, s.config.contable.cerrados, { [p]:Date.now() }); auditar(s, 'Cerró el mes contable', nombrePeriodo(p)); });
  toast(`${nombrePeriodo(p)} cerrado para el contador`, 'lock');
};
A['carpeta-reabrir'] = async el => {
  const p = el.dataset.v;
  if (!await confirmar(`Reabrir ${nombrePeriodo(p)}`, 'Si ya le mandaste la carpeta al contador, avisale que la vas a corregir.', { si:'Reabrir', peligro:true })) return;
  Store.cambiar(s => { const c = Object.assign({}, cfgConta()); c.cerrados = Object.assign({}, c.cerrados); delete c.cerrados[p]; s.config.contable = c; auditar(s, 'Reabrió el mes contable', nombrePeriodo(p)); });
  toast('Mes reabierto', 'refresh');
};

/* ---------- PDF, planillas y correo ---------- */
function carpetaHTML(p){
  const r = resumenContable(p), c = cfgConta(), obs = obligacionesDe(p);
  const t = (cab, filas, total) => `<table><tr>${cab.map(h => `<th${/Importe|IVA|Neto|Ret|Percep|Monto/.test(h) ? ' class="n"' : ''}>${h}</th>`).join('')}</tr>${filas.join('')}${total || ''}</table>`;
  const n = v => `<td class="n">${plata(v)}</td>`;
  const orden = l => l.slice().sort((a, b) => String(a.fecha).localeCompare(String(b.fecha)));
  return `<h1>Carpeta contable · ${nombrePeriodo(p)}</h1>
    <p>Condición frente al IVA: <b>${esc(c.ivaCond)}</b> · Ingresos Brutos (AREF): <b>${esc(c.iibbCond)}</b>${c.arefNro ? ' · Nº ' + esc(c.arefNro) : ''}${mesCerrado(p) ? ' · <b>Mes cerrado</b>' : ' · <i>Mes abierto (puede cambiar)</i>'}</p>
    <h2>1. Resumen</h2>
    ${t(['Concepto','Importe'], [
      `<tr><td>Ingresos del mes</td>${n(r.ingresos)}</tr>`, `<tr><td>Egresos del mes</td>${n(r.egresos)}</tr>`, `<tr><td>Resultado</td>${n(r.ingresos - r.egresos)}</tr>`,
      ...(r.bancoInicial != null ? [`<tr><td>Banco: saldo inicial</td>${n(r.bancoInicial)}</tr>`, `<tr><td>Banco: saldo final estimado</td>${n(r.bancoFinal)}</tr>`] : []),
      `<tr><td>IVA contenido en facturas recibidas</td>${n(r.iva)}</tr>`, `<tr><td>Retenciones practicadas (Ganancias + Seg. Social)</td>${n(r.retGan + r.retSuss)}</tr>`])}
    <h2>2. Por cuenta</h2>
    ${t(['Cuenta','Importe'], Object.entries(r.porCuenta).sort((a, b) => a[0].localeCompare(b[0])).map(([k, v]) => `<tr><td>${k} · ${esc(CUENTAS[k] || '')}</td>${n(v)}</tr>`))}
    <h2>3. Libro diario</h2>
    ${t(['Fecha','Cuenta','Detalle','Ingreso','Egreso'], orden(r.as).map(a => `<tr><td>${esc(a.fecha || '')}</td><td>${a.cuenta}</td><td>${esc(a.detalle)}${a.editado ? ' <i>(corregido)</i>' : ''}${!a.origen ? ' <i>(manual)</i>' : ''}${a.nota ? '<br><small>' + esc(a.nota) + '</small>' : ''}</td>${a.tipo === 'ingreso' ? n(a.importe) + '<td></td>' : '<td></td>' + n(a.importe)}</tr>`))}
    <h2>4. Comprobantes recibidos</h2>
    ${t(['Fecha','Proveedor','CUIT','Comprobante','Neto','IVA','Percep.','Importe'], orden(r.egr).map(a => `<tr><td>${esc(a.fecha || '')}</td><td>${esc(a.proveedor || a.detalle)}</td><td>${esc(a.cuit || '')}</td><td>${esc(a.comprobante || '')}</td>${n(a.neto)}${n(a.iva)}${n(a.percepciones)}${n(a.importe)}</tr>`),
      `<tr class="total"><td colspan="4">Total</td>${n(r.neto)}${n(r.iva)}${n(r.percepciones)}${n(r.egresos)}</tr>`)}
    <h2>5. Cobranzas</h2>
    ${t(['Fecha','Lote','Medio','Comprobante','Importe'], orden(r.ing).map(a => `<tr><td>${esc(a.fecha || '')}</td><td>${esc(a.lote || '')}</td><td>${esc(a.medioPago || '')}</td><td>${esc(a.comprobante || '')}</td>${n(a.importe)}</tr>`), `<tr class="total"><td colspan="4">Total</td>${n(r.ingresos)}</tr>`)}
    <h2>6. Retenciones practicadas</h2>
    ${r.retGan + r.retSuss ? t(['Proveedor','CUIT','Ganancias','Seg. Social'], r.egr.filter(a => a.retGan || a.retSuss).map(a => `<tr><td>${esc(a.proveedor || '')}</td><td>${esc(a.cuit || '')}</td>${n(a.retGan)}${n(a.retSuss)}</tr>`)) : '<p>No hubo retenciones en el mes.</p>'}
    <h2>7. Presentaciones</h2>
    ${t(['Obligación','Situación','Vence','Estado'], obs.map(o => `<tr><td>${esc(o.nombre)}</td><td>${esc(o.detalle)}</td><td>${o.vence && o.presenta ? fechaCorta(o.vence) : '—'}</td><td>${o.estado === 'presentado' ? 'Presentado' : o.estado === 'no-corresponde' ? 'No corresponde' : 'Pendiente'}</td></tr>`))}
    <p style="font-size:11px;color:#666">Guía generada por la app del barrio. La condición frente a cada impuesto la confirma el contador.</p>`;
}
A['carpeta-pdf'] = el => { Libro.alDia(); imprimir(`Carpeta contable · ${nombrePeriodo(el.dataset.v)}`, carpetaHTML(el.dataset.v)); };
A['carpeta-csv'] = el => {
  Libro.alDia();
  const p = el.dataset.v, r = resumenContable(p), n = v => (Math.round((+v || 0) * 100) / 100).toFixed(2).replace('.', ',');
  const bajar = (nombre, filas) => { const csv = filas.map(f => f.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(';')).join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + csv], { type:'text/csv;charset=utf-8' })); a.download = `${nombre}-${p}-bahia-cauquen.csv`; a.click(); };
  bajar('libro-diario', [['Fecha','Cuenta','Nombre de la cuenta','Detalle','Ingreso','Egreso','Corregido','Manual','Nota'],
    ...r.as.map(a => [a.fecha, a.cuenta, CUENTAS[a.cuenta] || '', a.detalle, a.tipo === 'ingreso' ? n(a.importe) : '', a.tipo === 'egreso' ? n(a.importe) : '', a.editado ? 'sí' : '', a.origen ? '' : 'sí', a.nota || ''])]);
  setTimeout(() => bajar('comprobantes-recibidos', [['Fecha','Proveedor','CUIT','Comprobante','Neto','IVA','Percepciones','Total','Ret. Ganancias','Ret. Seg. Social','Pagado el','Medio'],
    ...r.egr.map(a => [a.fecha, a.proveedor || a.detalle, a.cuit, a.comprobante, n(a.neto), n(a.iva), n(a.percepciones), n(a.importe), n(a.retGan), n(a.retSuss), a.fechaPago, a.medioPago])]), 400);
  setTimeout(() => bajar('cobranzas', [['Fecha','Lote','Medio','Comprobante','Importe'], ...r.ing.map(a => [a.fecha, a.lote, a.medioPago, a.comprobante, n(a.importe)])]), 800);
  toast('Se bajaron las planillas del mes', 'download');
};
A['carpeta-mandar'] = async el => {
  const p = el.dataset.v, c = cfgExp(), r = resumenContable(p);
  if (!c.contador){ toast('Cargá el correo del contador en Contabilidad → Parámetros', 'mail'); return; }
  const ok = await Correo.enviar({ para:c.contador, asunto:`Barrio ${Store.s.config.nombre} · carpeta contable de ${nombrePeriodo(p)}`, tipo:'contador',
    html:Correo.plantilla(`Carpeta de ${nombrePeriodo(p)}`, `<p>Hola: está lista la carpeta contable de <b>${nombrePeriodo(p)}</b>${mesCerrado(p) ? ' (mes cerrado)' : ''}.</p>
      <p>Ingresos ${plata(r.ingresos)} · egresos ${plata(r.egresos)} · IVA en facturas ${plata(r.iva)} · retenciones ${plata(r.retGan + r.retSuss)}.</p>
      <p>La carpeta completa (PDF) y las planillas se las mandamos aparte o se descargan desde la app.</p>`) });
  Store.cambiar(s => auditar(s, 'Le mandó la carpeta al contador', nombrePeriodo(p)));
  toast(ok ? 'Correo enviado al contador' : 'El correo quedó en la bandeja de salida', ok ? 'mail' : 'clock');
};

/* Las pestañas nuevas, después de "Gastos del mes". */
(() => { const i = TABS_CONTA.findIndex(t => t[0] === 'gastos'); TABS_CONTA.splice(i + 1, 0, ['libro', 'Libro contable'], ['carpeta', 'Carpeta del contador']); })();
/* El libro se pone al día solo cuando la Administración anda por la app. */
setInterval(() => { try { if (yo() && esAdmin()) Libro.alDia(); } catch(e){} }, 60000);
