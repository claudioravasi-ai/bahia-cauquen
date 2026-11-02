/* =========================================================
   DÉBITO AUTOMÁTICO DE LAS EXPENSAS (pedido de Claudio, 02-11-2026)
   "Al pago de las expensas agregale un botón a cada vecino que lo tiene
   por débito automático … el débito de cada vecino debe ser corroborado
   por la Administración, y una vez que lo corrobora pone pagado y le
   llega al vecino como expensas debitadas correctamente." Y: "ya hay
   muchos vecinos que tienen débito automático desde hace tiempo".

   El débito lo hace el BANCO (débito directo del consorcio), no la app:
   la app lleva quién está adherido, avisa y concilia.
     · El vecino toca "Estoy adherido al débito automático" (o "Quiero
       adherirme"): queda PENDIENTE hasta que la Administración lo
       confirma. Solo la Administración lo pasa a ACTIVO (lo controlan
       también las reglas de la base). La Administración puede además
       tildar de una vez los lotes que ya figuran en el banco.
     · Con el débito activo, el cupón dice "se debita de tu cuenta el
       <1º vto>" en lugar de "Pagar", y no le llegan los recordatorios de
       vencimiento ni el correo de expensas vencidas.
     · Cada mes la Administración ve "Débitos de <mes>" con lo que se
       debita a cada lote (y la planilla para el banco). Cuando el banco
       confirma, "Confirmar los debitados": sale el pago con su recibo y al
       vecino le llega "Tus expensas se debitaron correctamente". Si un
       débito rebota, "Rebotó": al vecino le llega el aviso y ese mes vuelve
       al pago normal (con los recordatorios de siempre).
     · "Volver al pago manual" lo puede tocar el vecino cuando quiera.
   La app NO guarda el CBU ni datos del banco del vecino: la autorización
   firmada va al banco o a la Administración. Solo queda "adherido desde".
   Las UF del hotel pagan en un solo pago (su propia pantalla): el débito
   es para los lotes de vecinos.
   ========================================================= */
const ESTADOS_DEB = { pendiente:'Pendiente de confirmar', activo:'Adherido', baja:'Pago manual', rechazado:'No confirmado' };
const Debito = {
  idDe: lote => 'deb-' + String(lote || '').replace(/^Lote\s*/i, '').replace(/[.#$/\[\]\s]/g, ''),
  de: lote => aLista(Store.s.debitos).find(d => d && d.lote === lote) || null,
  activo(lote){ const d = this.de(lote); return !!d && d.estado === 'activo'; },
  periodo: () => liquidacionesEmitidas().slice(-1)[0]?.periodo || '',
  reboto(lote, per = this.periodo()){ const d = this.de(lote); return !!d && !!per && !!(d.rebotes || {})[per]; },
  /* El pago del débito de un mes (id fijo: no se duplica). */
  idPago: (per, lote) => `deb-${per}-${String(lote).replace(/^Lote\s*/i, '').replace(/[.#$/\[\]\s]/g, '')}`,
  pagoDe(per, lote){ return Store.s.pagos.find(p => p && p.id === this.idPago(per, lote) && p.estado !== 'rechazado') || null; },
  lotesVecinos: () => LOTES.filter(L => L.grupo !== 'hotel').map(L => 'Lote ' + L.lote),
  /* Guarda el estado del débito de un lote (dentro de Store.cambiar). */
  poner(s, lote, estado, extra = {}){
    s.debitos = aLista(s.debitos);
    let d = s.debitos.find(x => x && x.lote === lote);
    if (!d){ d = { id:this.idDe(lote), lote, estado, historial:[], rebotes:{} }; s.debitos.push(d); }
    d.estado = estado; Object.assign(d, extra);
    d.historial = [...aLista(d.historial), { at:Date.now(), que:estado, por:yo()?.id || 'sistema' }].slice(-30);
    if (!d.rebotes || typeof d.rebotes !== 'object' || Array.isArray(d.rebotes)) d.rebotes = {};
    return d;
  },
};
/* ¿Este lote paga por débito este mes? (activo y sin rebote). */
const enDebito = (lote, per) => typeof Debito !== 'undefined' && Debito.activo(lote) && !Debito.reboto(lote, per || Debito.periodo());

/* ---------- lo que ve el vecino en Mis expensas ---------- */
Debito.tarjeta = (lote, saldo) => {
  const per = Debito.periodo();
  return `<div class="tarjeta-pago deb-tarjeta" aria-label="Débito automático">
      <span class="tp-arriba"><span class="tp-rotulo">Se debita de tu cuenta</span><span class="tp-chip">${I('refresh')}Débito automático</span></span>
      <span class="tp-monto">${plata(Math.max(0, saldo))}</span>
      ${per ? `<span class="tp-detalle">${nombrePeriodo(per)} · se debita el ${fechaCorta(vtoDe(per, 1))}</span>` : ''}
      <span class="tp-pie">${I('check')}No hace falta que pagues ni que lo avises. Cuando la Administración lo confirma con el banco, te llega el recibo.</span>
    </div>`;
};
Debito.seccion = (lote, { ajena = false } = {}) => {
  if (!lote || (typeof esLoteHotel === 'function' && esLoteHotel(lote))) return '';
  const d = Debito.de(lote), per = Debito.periodo(), est = d ? d.estado : '';
  const titulo = sec('Débito automático');
  if (est === 'activo') return `${titulo}<div class="card deb-card">
      <div class="row"><span class="ic ic-ok">${I('check')}</span><div class="grow"><b>Adherido al débito automático</b><div class="muted small">Confirmado por la Administración${d.confirmadoAt ? ' el ' + fechaCorta(isoDe(new Date(d.confirmadoAt))) : ''}. Cada mes el cupón se debita solo el día del 1º vencimiento.</div></div></div>
      ${Debito.reboto(lote, per) ? aviso('danger', 'alert', `El débito de ${nombrePeriodo(per)} no pasó`, `Este mes pagala vos desde la app antes del ${fechaCorta(vtoDe(per, 2))}. Desde el mes que viene se vuelve a debitar.`) : ''}
      ${ajena ? '' : `<button class="btn btn-sec btn-block btn-envuelve" style="margin-top:10px" data-a="deb-baja">${I('wallet')}Volver al pago manual</button>`}</div>`;
  if (est === 'pendiente') return `${titulo}<div class="card deb-card">
      <div class="row"><span class="ic ic-warn">${I('clock')}</span><div class="grow"><b>${d.tipo === 'nuevo' ? 'Pediste adherirte al débito automático' : 'Avisaste que estás adherido al débito automático'}</b><div class="muted small">La Administración lo está corroborando con el banco. Mientras tanto, seguí pagando como siempre.</div></div></div>
      ${ajena ? '' : `<button class="btn btn-sec btn-block" style="margin-top:10px" data-a="deb-baja">${I('x')}Cancelar el pedido</button>`}</div>`;
  if (ajena) return '';
  return `${titulo}<div class="card deb-card">
      ${est === 'rechazado' ? `<p class="small" style="margin:0 0 8px;color:var(--danger)">${I('alert')} La Administración no pudo confirmar tu débito automático${d.motivo ? ': ' + esc(d.motivo) : ''}. Escribile por "Consultar a la Administración".</p>` : ''}
      <p class="small" style="margin:0 0 10px">¿Tus expensas se debitan solas de tu cuenta del banco? Avisalo y, cuando la Administración lo confirme, dejás de recibir recordatorios de pago.</p>
      <button class="btn btn-pri btn-block btn-envuelve" data-a="deb-pedir" data-v="ya">${I('check')}Estoy adherido al débito automático</button>
      <button class="btn btn-sec btn-block btn-envuelve" style="margin-top:8px" data-a="deb-pedir" data-v="nuevo">${I('plus')}Quiero adherirme</button></div>`;
};
A['deb-pedir'] = async el => {
  const lote = miLote(), tipo = el.dataset.v === 'nuevo' ? 'nuevo' : 'ya';
  if (!lote || !/^Lote\s/i.test(lote)) return toast('Tu cuenta no tiene un lote asignado', 'alert');
  if (!await confirmar(tipo === 'ya' ? 'Estoy adherido al débito automático' : 'Quiero adherirme al débito automático',
    tipo === 'ya' ? `La Administración lo corrobora con el banco y, cuando lo confirme, el cupón de ${esc(lote)} se debita solo cada mes. Mientras tanto, seguí pagando como siempre.`
      : 'La Administración te va a contactar para firmar la autorización del banco (los datos de tu cuenta van directo al banco: la app no los guarda). Mientras tanto, seguí pagando como siempre.', { si:'Avisar a la Administración' })) return;
  Store.cambiar(s => {
    Debito.poner(s, lote, 'pendiente', { tipo, pedidoPor:yo().id, pedidoAt:Date.now(), motivo:'' });
    notificar(s, { para:'rol:admin', titulo:`Débito automático · ${lote}`, texto: tipo === 'ya' ? 'Avisa que ya está adherido: corroboralo con el banco.' : 'Pide adherirse: hay que hacerle firmar la autorización del banco.', icon:'refresh', color:'sky', link:'cobranzas:debito' });
    auditar(s, tipo === 'ya' ? 'Avisó que tiene débito automático' : 'Pidió el débito automático', lote);
  });
  toast('Listo: la Administración lo corrobora y te avisa', 'check');
};
A['deb-baja'] = async () => {
  const lote = miLote(), d = Debito.de(lote); if (!d) return;
  const activo = d.estado === 'activo';
  if (!await confirmar(activo ? 'Volver al pago manual' : 'Cancelar el pedido', activo
    ? `Desde ahora pagás vos las expensas de ${esc(lote)} desde la app, y vuelven los recordatorios de vencimiento. Si la Administración ya mandó al banco el débito de este mes, se debita igual. Para dejar de debitarlo en el banco, avisale también a tu banco o a la Administración.`
    : 'La Administración deja de corroborar tu débito.', { si: activo ? 'Pasar a pago manual' : 'Cancelar el pedido', peligro:true })) return;
  Store.cambiar(s => {
    Debito.poner(s, lote, 'baja', { bajaPor:yo().id, bajaAt:Date.now() });
    notificar(s, { para:'rol:admin', titulo:`${lote} ${activo ? 'deja el débito automático' : 'canceló el pedido de débito'}`, texto: activo ? 'Pasa a pago manual: sacalo del débito en el banco.' : 'Ya no hace falta corroborarlo.', icon:'refresh', color:'warn', link:'cobranzas:debito' });
    auditar(s, activo ? 'Pasó a pago manual (dejó el débito automático)' : 'Canceló el pedido de débito automático', lote);
  });
  toast(activo ? 'Listo: pagás vos desde la app' : 'Pedido cancelado', 'check');
};

/* ---------- lo que ve la Administración: Expensas → Débito automático ---------- */
Debito.aDebitar = (lote) => { const c = cuentaLote(lote); return Math.round(Math.max(0, c.saldo - c.informado) * 100) / 100; };
COBRO.debito = () => {
  const ds = aLista(Store.s.debitos).filter(d => d && d.lote), per = Debito.periodo();
  const pend = ds.filter(d => d.estado === 'pendiente'), act = ds.filter(d => d.estado === 'activo').sort((a, b) => a.lote.localeCompare(b.lote, 'es', { numeric:true }));
  const filasMes = per ? act.map(d => { const p = Debito.pagoDe(per, d.lote), reb = Debito.reboto(d.lote, per), monto = p ? +p.monto : Debito.aDebitar(d.lote);
    return { d, p, reb, monto, estado: p ? 'debitado' : reb ? 'rebotó' : monto > .5 ? 'a-debitar' : 'sin-saldo' }; }) : [];
  const aDeb = filasMes.filter(f => f.estado === 'a-debitar');
  const totalMes = Math.round(filasMes.filter(f => f.estado !== 'sin-saldo').reduce((a, f) => a + f.monto, 0) * 100) / 100;
  const pill = e => ({ 'debitado':'<span class="pill p-ok">debitado</span>', 'rebotó':'<span class="pill p-danger">rebotó</span>', 'a-debitar':'<span class="pill p-warn">a debitar</span>', 'sin-saldo':'<span class="pill">sin saldo</span>' })[e];
  return `<div class="garita-kpis"><div class="kpi"><b>${act.length}</b><span>Lotes adheridos</span></div>
      <div class="kpi"><b>${pend.length}</b><span>Por confirmar</span></div>
      <div class="kpi"><b>${plataCorta(totalMes)}</b><span>Débitos de ${per ? MESES_LARGO[+per.slice(5)] : 'este mes'}</span></div>
      <div class="kpi"><b>${filasMes.filter(f => f.p).length}/${filasMes.filter(f => f.estado !== 'sin-saldo').length}</b><span>Confirmados</span></div></div>
    <p class="muted small">El débito lo hace el banco. La app lleva quién está adherido, le avisa a cada vecino y concilia: no guarda el CBU ni datos de la cuenta del vecino.</p>
    ${pend.length ? sec(`Avisos y pedidos por confirmar (${pend.length})`) + `<div class="card lista">${pend.map(d => `<div class="it"><div class="txt"><b>${esc(d.lote)}${propietarioDe(d.lote) ? ' · ' + esc(propietarioDe(d.lote)) : ''}</b>
        <span>${d.tipo === 'nuevo' ? 'Pide adherirse (falta la autorización del banco)' : 'Avisa que ya está adherido'} · ${d.pedidoAt ? hace(d.pedidoAt) : ''}</span></div>
        <button class="btn btn-xs btn-ok" data-a="deb-confirmar" data-v="${esc(d.lote)}">${I('check')}Confirmar</button><button class="btn btn-xs btn-sec" data-a="deb-rechazar" data-v="${esc(d.lote)}">No figura</button></div>`).join('')}</div>` : ''}
    ${per ? sec(`Débitos de ${nombrePeriodo(per)} · se debitan el ${fechaCorta(vtoDe(per, 1))}`, act.length ? `<button class="link" data-a="deb-planilla">${I('download')}Planilla para el banco</button>` : '') + (act.length ? `<div class="card lista">${filasMes.map(f => `<div class="it"><div class="txt"><b>${esc(f.d.lote)} ${pill(f.estado)}</b><span>${f.p ? `${fechaCorta(f.p.fecha)} · recibo ${esc(f.p.recibo || '')}` : f.reb ? 'Paga a mano este mes' : f.estado === 'sin-saldo' ? 'No debe nada este mes' : 'Esperando la confirmación del banco'}</span></div>
          <b class="num">${plata(f.monto)}</b>${f.estado === 'a-debitar' ? `<button class="btn btn-xs btn-sec" data-a="deb-rebote" data-v="${esc(f.d.lote)}">Rebotó</button>` : ''}</div>`).join('')}</div>
        ${aDeb.length ? `<button class="btn btn-pri btn-block btn-grande" style="margin-top:10px" data-a="deb-confirmar-mes">${I('check')}Confirmar los debitados (${aDeb.length})</button>` : ''}` : '<p class="muted small">Todavía no hay lotes adheridos.</p>') : ''}
    ${sec('Lotes adheridos', `<button class="link" data-a="deb-marcar">${I('plus')}Marcar lotes adheridos</button>`)}
    ${act.length ? `<details class="card" data-k="deb-lista"><summary><b>${plural(act.length, 'lote adherido', 'lotes adheridos')}</b></summary><div class="lista" style="margin-top:8px">${act.map(d => `<div class="it"><div class="txt"><b>${esc(d.lote)}</b><span>${d.tipo === 'admin' ? 'Lo marcó la Administración' : d.tipo === 'nuevo' ? 'Se adhirió desde la app' : 'Avisó desde la app'}${d.confirmadoAt ? ' · desde ' + fechaCorta(isoDe(new Date(d.confirmadoAt))) : ''}</span></div>
        <button class="btn btn-xs btn-danger-soft" data-a="deb-quitar" data-v="${esc(d.lote)}">Dar de baja</button></div>`).join('')}</div></details>`
      : `<p class="muted small">Si ya tenés la lista del banco, tocá <b>Marcar lotes adheridos</b> y tildalos todos de una vez.</p>`}`;
};
A['deb-confirmar'] = el => {
  const lote = el.dataset.v;
  Store.cambiar(s => {
    Debito.poner(s, lote, 'activo', { confirmadoPor:yo().id, confirmadoAt:Date.now(), motivo:'' });
    notificar(s, { para:cuentasDelCobro(lote), titulo:'Débito automático confirmado', texto:'Desde ahora tus expensas se debitan solas el día del 1º vencimiento. Cuando se confirme cada débito te llega el recibo.', icon:'check', color:'ok', link:'expensas' });
    auditar(s, 'Confirmó un débito automático', lote);
  });
  toast(`${lote}: débito automático confirmado`, 'check');
};
A['deb-rechazar'] = el => hoja(`${esc(el.dataset.v)}: no figura en el banco`, `<form data-f="deb-rechazar" data-v="${esc(el.dataset.v)}">
    <div class="field"><label>Motivo (lo ve el vecino)</label><input name="motivo" maxlength="120" value="No figura adherido en el banco"></div>
    <button class="btn btn-danger-soft btn-block">${I('x')}Avisarle que no se pudo confirmar</button></form>`);
F['deb-rechazar'] = (d, form) => {
  const lote = form.dataset.v, motivo = String(d.motivo || '').trim();
  Store.cambiar(s => {
    Debito.poner(s, lote, 'rechazado', { motivo });
    notificar(s, { para:cuentasDelCobro(lote), titulo:'No pudimos confirmar tu débito automático', texto:`${motivo || 'Escribinos para revisarlo'}. Mientras tanto, pagá las expensas desde la app.`, icon:'alert', color:'warn', link:'expensas' });
    auditar(s, 'No confirmó un débito automático', `${lote}${motivo ? ' · ' + motivo : ''}`);
  });
  cerrarHoja(); toast('Listo: le llega el aviso', 'check');
};
A['deb-quitar'] = async el => {
  const lote = el.dataset.v;
  if (!await confirmar(`Dar de baja el débito de ${esc(lote)}`, 'El lote pasa a pago manual y vuelve a recibir los recordatorios de vencimiento. Acordate de sacarlo también en el banco.', { si:'Dar de baja', peligro:true })) return;
  Store.cambiar(s => {
    Debito.poner(s, lote, 'baja', { bajaPor:yo().id, bajaAt:Date.now() });
    notificar(s, { para:cuentasDelCobro(lote), titulo:'Tus expensas pasaron a pago manual', texto:'La Administración dio de baja el débito automático. Desde ahora pagalas desde la app.', icon:'wallet', color:'warn', link:'expensas' });
    auditar(s, 'Dio de baja un débito automático', lote);
  });
  toast(`${lote} pasa a pago manual`, 'check');
};
/* Marcar de una vez los lotes que ya figuran adheridos en el banco. */
A['deb-marcar'] = () => {
  const lotes = Debito.lotesVecinos().filter(l => !Debito.activo(l));
  hoja('Marcar lotes adheridos', `<form data-f="deb-marcar">
    <p class="small" style="margin-top:0">Tildá los lotes que ya tienen el débito automático en el banco. Quedan confirmados y a cada cuenta del lote le llega el aviso.</p>
    <div class="field"><input type="search" placeholder="Buscar lote…" data-deb-buscar></div>
    <div class="card lista deb-marcar" style="max-height:52vh;overflow:auto">${lotes.map(l => { const d = Debito.de(l);
      return `<label class="it" data-lote="${esc(l)}"><input type="checkbox" name="l~${esc(l)}" ${d && d.estado === 'pendiente' ? 'checked' : ''}><div class="txt"><b>${esc(l)}</b><span>${esc(propietarioDe(l) || '')}${d && d.estado === 'pendiente' ? ' · avisó desde la app' : ''}</span></div></label>`; }).join('')}</div>
    <button class="btn btn-pri btn-block btn-grande" style="margin-top:10px">${I('check')}Confirmar los tildados</button></form>`, { ancho:'560px' });
};
document.addEventListener('input', e => { if (!e.target.matches || !e.target.matches('[data-deb-buscar]')) return; const q = normTxt(e.target.value);
  $$('.deb-marcar [data-lote]').forEach(f => { f.style.display = !q || normTxt(f.dataset.lote + ' ' + f.textContent).includes(q) ? '' : 'none'; }); });
F['deb-marcar'] = d => {
  const lotes = Object.keys(d).filter(k => k.startsWith('l~')).map(k => k.slice(2));
  if (!lotes.length) return toast('No tildaste ningún lote', 'alert');
  Store.cambiar(s => {
    lotes.forEach(lote => { const antes = Debito.de(lote);
      Debito.poner(s, lote, 'activo', { tipo: antes && antes.tipo ? antes.tipo : 'admin', confirmadoPor:yo().id, confirmadoAt:Date.now(), motivo:'' });
      const us = cuentasDelCobro(lote);
      if (us.length) notificar(s, { para:us, titulo:'Débito automático confirmado', texto:'Tus expensas se debitan solas el día del 1º vencimiento. Cuando se confirme cada débito te llega el recibo.', icon:'check', color:'ok', link:'expensas' }); });
    auditar(s, 'Marcó lotes con débito automático', `${lotes.length} lotes`);
  });
  cerrarHoja(); toast(`Listo: ${plural(lotes.length, 'lote adherido', 'lotes adheridos')}`, 'check');
};
/* La planilla para el banco: lote, UF, importe y referencia (sin nombres ni cuentas). */
A['deb-planilla'] = () => {
  const per = Debito.periodo(); if (!per) return;
  const filas = aLista(Store.s.debitos).filter(d => d && d.estado === 'activo' && !Debito.reboto(d.lote, per) && !Debito.pagoDe(per, d.lote))
    .map(d => { const L = LOTES.find(x => 'Lote ' + x.lote === d.lote) || {}; return [d.lote, L.uf || '', Debito.aDebitar(d.lote).toFixed(2).replace('.', ','), `Expensas ${nombrePeriodo(per)} ${d.lote}`]; })
    .filter(f => f[2] !== '0,00').sort((a, b) => a[0].localeCompare(b[0], 'es', { numeric:true }));
  if (!filas.length) return toast('No hay débitos pendientes este mes', 'check');
  csvDe([['lote', 'uf', 'importe', 'referencia'], ...filas], `debitos-${per}.csv`);
  Store.cambiar(s => auditar(s, 'Bajó la planilla de débitos para el banco', `${nombrePeriodo(per)} · ${filas.length} lotes`));
};
/* Confirmar lo que el banco debitó: un pago por lote, con recibo. */
A['deb-confirmar-mes'] = () => {
  const per = Debito.periodo(); if (!per) return;
  const filas = aLista(Store.s.debitos).filter(d => d && d.estado === 'activo' && !Debito.reboto(d.lote, per) && !Debito.pagoDe(per, d.lote))
    .map(d => ({ lote:d.lote, monto:Debito.aDebitar(d.lote) })).filter(f => f.monto > .5).sort((a, b) => a.lote.localeCompare(b.lote, 'es', { numeric:true }));
  if (!filas.length) return toast('No hay débitos para confirmar', 'check');
  const v1 = vtoDe(per, 1), fecha = hoyISO() < v1 ? hoyISO() : v1;
  hoja(`Débitos de ${nombrePeriodo(per)}`, `<form data-f="deb-confirmar-mes">
    <p class="small" style="margin-top:0">Destildá los que el banco no debitó (después tocá "Rebotó" en cada uno). A los tildados les sale el recibo y el aviso "Tus expensas se debitaron correctamente".</p>
    <div class="field"><label>Fecha del débito</label><input type="date" name="fecha" required value="${fecha}"></div>
    <div class="card lista" style="max-height:48vh;overflow:auto">${filas.map(f => `<label class="it"><input type="checkbox" name="l~${esc(f.lote)}" checked><div class="txt"><b>${esc(f.lote)}</b></div><b class="num">${plata(f.monto)}</b></label>`).join('')}</div>
    <div class="card plana small" style="margin-top:8px">${plural(filas.length, 'lote')} · ${plata(filas.reduce((a, f) => a + f.monto, 0))}</div>
    <button class="btn btn-pri btn-block btn-grande" style="margin-top:10px">${I('check')}Confirmar y emitir los recibos</button></form>`, { ancho:'560px' });
};
F['deb-confirmar-mes'] = d => {
  const per = Debito.periodo(), lotes = Object.keys(d).filter(k => k.startsWith('l~')).map(k => k.slice(2));
  if (!lotes.length) return toast('No tildaste ningún lote', 'alert');
  const ids = [];
  Store.cambiar(s => lotes.forEach(lote => {
    const id = Debito.idPago(per, lote), monto = Debito.aDebitar(lote);
    if (!(monto > .5) || s.pagos.some(p => p.id === id && p.estado !== 'rechazado')) return;
    s.pagos = s.pagos.filter(p => p.id !== id);
    s.pagos.unshift({ id, lote, userId:yo().id, monto, fecha:d.fecha || vtoDe(per, 1), medio:'Débito automático', nota:`Débito de ${nombrePeriodo(per)}`, estado:'informado', debito:per, at:Date.now() });
    ids.push(id);
  }));
  let n = 0; ids.forEach(id => { if (confirmarPago(id, { titulo:'Tus expensas se debitaron correctamente', texto:`Expensas de ${nombrePeriodo(per)} · débito automático` })) n++; });
  Store.cambiar(s => auditar(s, 'Confirmó los débitos automáticos', `${nombrePeriodo(per)} · ${n} lotes`));
  cerrarHoja(); toast(`Listo: ${plural(n, 'débito confirmado', 'débitos confirmados')} con su recibo`, 'check');
};
A['deb-rebote'] = async el => {
  const lote = el.dataset.v, per = Debito.periodo();
  if (!await confirmar(`El débito de ${esc(lote)} rebotó`, `Le llega el aviso para que pague ${nombrePeriodo(per)} desde la app antes del ${fechaCorta(vtoDe(per, 2))}, y ese mes vuelve a recibir los recordatorios. El mes que viene se vuelve a debitar.`, { si:'Avisarle' })) return;
  Store.cambiar(s => {
    const d = Debito.poner(s, lote, 'activo', {}); d.rebotes = Object.assign({}, d.rebotes, { [per]:Date.now() });
    notificar(s, { para:cuentasDelCobro(lote), titulo:`El débito de tus expensas de ${nombrePeriodo(per)} no pasó`, texto:`Pagalas desde la app antes del ${fechaCorta(vtoDe(per, 2))} para no sumar el ajuste. El mes que viene se vuelve a debitar.`, icon:'alert', color:'danger', link:'expensas', sonido:true });
    auditar(s, 'Marcó un débito rebotado', `${lote} · ${nombrePeriodo(per)}`);
  });
  toast('Listo: le llega el aviso', 'check');
};
/* En el cierre de mes: débitos del mes anterior sin confirmar ni marcar. */
Debito.avisoCierre = periodo => {
  const ant = liquidacionDe(periodoAnterior(periodo)); if (!ant || ant.estado !== 'emitida') return '';
  const falta = aLista(Store.s.debitos).filter(d => d && d.estado === 'activo' && !Debito.reboto(d.lote, ant.periodo) && !Debito.pagoDe(ant.periodo, d.lote) && Debito.aDebitar(d.lote) > .5);
  return falta.length ? aviso('warn', 'refresh', `Faltan confirmar ${plural(falta.length, 'débito', 'débitos')} de ${nombrePeriodo(ant.periodo)}`,
    'Si no los confirmás (o marcás los que rebotaron) antes de emitir, a esos lotes se les cobra el ajuste por mora como si no hubieran pagado.',
    `<button class="btn btn-xs btn-pri" data-a="abrir" data-v="cobranzas" data-p="debito">Ver los débitos</button>`) : '';
};
