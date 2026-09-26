/**
 * Barrio Bahía Cauquén — envío de correo
 * ---------------------------------------------------------------------------
 * Este programa vive en Google Apps Script y es lo único que puede mandar
 * mails: un navegador no puede hacerlo por sí solo.
 *
 * CÓMO INSTALARLO (una sola vez)
 *   1. Entrar a script.google.com con la cuenta de Google de la Administración del barrio.
 *   2. Proyecto nuevo. Borrar lo que haya y pegar TODO este archivo.
 *   3. Cambiar CLAVE_COMPARTIDA por una frase larga y propia.
 *   4. Implementar → Nueva implementación → Aplicación web
 *        Ejecutar como:      Yo
 *        Quién tiene acceso: Cualquier persona
 *   5. Copiar la URL que termina en /exec.
 *   6. En la app: Administración → Ajustes → Correo, pegar esa URL y la misma frase.
 *
 * SEGURIDAD
 * La clave compartida viaja dentro del index.html, que es público. No es un
 * secreto fuerte: es una traba. Las defensas reales son el tope diario y el
 * registro de todo lo que se envía, que están más abajo. Ante un uso raro:
 * cambiar la frase acá y en Ajustes de la app, y reimplementar.
 */

var CLAVE_COMPARTIDA = 'CAMBIAR-por-una-frase-larga-y-propia';

/**
 * LA FRASE NO SE PIERDE AL PEGAR CÓDIGO NUEVO
 * Cada vez que se pegaba una versión nueva de este archivo, la línea de
 * arriba volvía a decir 'CAMBIAR-por-una-frase…' y la app dejaba de mandar
 * correos con el cartel "no autorizado". Ahora, la primera vez que corre con
 * una frase de verdad, la guarda en las Propiedades del script
 * (Configuración del proyecto → Propiedades del script → CLAVE_COMPARTIDA).
 * Si después se pega el código con la línea sin tocar, se usa la guardada.
 * Para CAMBIAR la frase: escribirla arriba y hacer "Nueva versión".
 */
var FRASE_DE_MUESTRA = 'CAMBIAR-por-una-frase-larga-y-propia';
function claveDelScript() {
  var props = PropertiesService.getScriptProperties();
  var escrita = String(CLAVE_COMPARTIDA || '').trim();
  if (escrita && escrita !== FRASE_DE_MUESTRA) {
    if (props.getProperty('CLAVE_COMPARTIDA') !== escrita) props.setProperty('CLAVE_COMPARTIDA', escrita);
    return escrita;
  }
  return String(props.getProperty('CLAVE_COMPARTIDA') || '').trim();
}
/* Compara sin fijarse en espacios de más al principio o al final ni en la
   forma de escribir los acentos (la "á" puede venir en uno o dos códigos). */
function normalizarFrase(t) { return String(t || '').trim().normalize('NFC'); }
function claveValida(recibida) {
  var k = claveDelScript();
  return !!k && normalizarFrase(recibida) === normalizarFrase(k);
}
/* Cuando la frase no coincide, la app muestra POR QUÉ: sin revelar la
   frase, dice cuántas letras tiene cada una y si la diferencia es solo de
   mayúsculas o de espacios. */
function pistaClave(recibida) {
  var k = normalizarFrase(claveDelScript()), r = normalizarFrase(recibida);
  var sinEsp = function (t) { return t.replace(/\s+/g, ''); };
  return {
    scriptSinFrase: !k,
    largoScript: k.length,
    largoApp: r.length,
    soloMayusculas: !!k && k.toLowerCase() === r.toLowerCase(),
    soloEspacios: !!k && sinEsp(k) === sinEsp(r)
  };
}

/**
 * DE QUE CASILLA SALEN LOS CORREOS
 * De la cuenta de Google con la que se crea ESTE proyecto de Apps Script, y de
 * ninguna otra. No se elige acá: se elige al entrar a script.google.com.
 * Conviene crearlo con la casilla oficial de la Administración.
 *
 * Lo unico configurable es el NOMBRE que el vecino ve como remitente, que es
 * lo de abajo. En la bandeja del vecino va a figurar asi:
 *
 *     Barrio Bahía Cauquén  <casilla-de-la-administracion@gmail.com>
 */
var NOMBRE_REMITENTE = 'Barrio Bahía Cauquén';

/**
 * A donde van las respuestas si el vecino contesta el correo.
 * Dejarlo vacio para que vayan a la misma casilla que lo envio.
 */
var RESPONDER_A = '';

/**
 * Tope diario de envios, como defensa por si alguien encuentra la clave en el
 * codigo publico y la usa. Gmail gratuito permite unos 100 por dia; una cuenta
 * de Google Workspace, 1500. Ochenta alcanza de sobra para un barrio y
 * deja margen para que el tope de Google no se agote con esto.
 */
var TOPE_DIARIO = 80;

/* Versión de este archivo: la app la lee para saber qué sabe hacer. */
var VERSION_SCRIPT = 6;

function doPost(e) {
  try {
    var datos = JSON.parse(e.postData.contents);

    /* Mercado Pago avisa acá cuando entra un pago (webhook). No trae la
       frase: no hace falta, porque no se le cree nada; solo se usa como
       señal para ir a preguntarle el pago a Mercado Pago. */
    if (!datos.clave && (datos.type === 'payment' || datos.topic === 'payment' || datos.action)) {
      var idAviso = String((datos.data && datos.data.id) || datos.id || (e.parameter && (e.parameter['data.id'] || e.parameter.id)) || '');
      registrar('MP-AVISO', idAviso || '?', datos.action || datos.type || '');
      try { if (/^\d{5,20}$/.test(idAviso)) mpAvisoDePago(idAviso); } catch (err) { registrar('MP-AVISO-ERROR', idAviso, String(err)); }
      return responder({ok: true});
    }

    if (!claveValida(datos.clave)) {
      registrar('RECHAZADO', datos.para || datos.accion || '?', 'clave incorrecta');
      return responder({ok: false, error: 'no autorizado', pista: pistaClave(datos.clave)});
    }

    switch (datos.accion || 'correo') {
      case 'clave':        return responder({ok: true});
      case 'push':         return responder(mandarPush(datos));
      case 'mp-crear':     return responder(mpCrear(datos));
      case 'mp-ref':       return responder(mpPorReferencia(datos.ref));

      case 'mp-verificar': return responder(mpVerificar(datos.pago));
      case 'mp-recientes': return responder(mpRecientes(datos.dias || 10));
      case 'correo':       return responder(mandarCorreo(datos));
    }
    return responder({ok: false, error: 'acción desconocida: ' + datos.accion});

  } catch (err) {
    registrar('ERROR', '?', String(err));
    return responder({ok: false, error: String(err)});
  }
}

function mandarCorreo(datos) {
  if (!datos.para || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datos.para)) {
    return {ok: false, error: 'destinatario inválido'};
  }
  if (contarHoy() >= TOPE_DIARIO) {
    registrar('TOPE', datos.para, 'se alcanzó el tope diario');
    return {ok: false, error: 'tope diario alcanzado'};
  }
  var envio = {
    to: datos.para,
    subject: datos.asunto || 'Barrio Bahía Cauquén',
    htmlBody: datos.html || '',
    name: NOMBRE_REMITENTE
  };
  if (RESPONDER_A) envio.replyTo = RESPONDER_A;
  MailApp.sendEmail(envio);
  registrar('ENVIADO', datos.para, datos.tipo || '');
  return {ok: true};
}

function doGet(e) {
  var q = e && e.parameter && e.parameter.q;
  if (q === 'cruceros') return responder(cruceros(e.parameter.forzar === '1'));
  var props = PropertiesService.getScriptProperties();
  return responder({ok: true, estado: 'activo', version: VERSION_SCRIPT, enviadosHoy: contarHoy(), tope: TOPE_DIARIO, cruceros: true,
    frase: !!claveDelScript(), push: !!props.getProperty('FCM_CUENTA'), mercadoPago: !!props.getProperty('MP_ACCESS_TOKEN')});
}

/**
 * AVISOS AL CELULAR CON LA PANTALLA APAGADA (notificaciones push)
 * ---------------------------------------------------------------------------
 * Con la pantalla bloqueada el celular no corre la app: lo único que la
 * despierta es una notificación push, y esas las manda Google (Firebase
 * Cloud Messaging). La app le pasa a este programa a qué equipos avisar y
 * este programa se lo pide a Google.
 *
 * CONFIGURARLO (una sola vez; está explicado paso a paso en AVISOS.md):
 *   1. Firebase → Configuración del proyecto → Cuentas de servicio →
 *      "Generar nueva clave privada". Se baja un archivo .json.
 *   2. Acá: Configuración del proyecto (el engranaje) → Propiedades del
 *      script → Agregar → nombre FCM_CUENTA, valor: TODO el contenido de
 *      ese archivo .json. Guardar.
 *   3. Implementar → Gestionar implementaciones → editar → Nueva versión.
 */
function tokenGoogle(alcance) {
  var cache = CacheService.getScriptCache(), clave = 'tok-' + alcance;
  var guardado = cache.get(clave);
  if (guardado) return guardado;
  var cuenta = JSON.parse(PropertiesService.getScriptProperties().getProperty('FCM_CUENTA') || '{}');
  if (!cuenta.private_key || !cuenta.client_email) throw new Error('Falta la propiedad FCM_CUENTA (ver AVISOS.md)');
  var ahora = Math.floor(Date.now() / 1000);
  var b64 = function (x) { return Utilities.base64EncodeWebSafe(x).replace(/=+$/, ''); };
  var cab = b64(JSON.stringify({alg: 'RS256', typ: 'JWT'}));
  var cuerpo = b64(JSON.stringify({iss: cuenta.client_email, scope: alcance, aud: 'https://oauth2.googleapis.com/token', iat: ahora, exp: ahora + 3600}));
  var firma = b64(Utilities.computeRsaSha256Signature(cab + '.' + cuerpo, cuenta.private_key));
  var r = UrlFetchApp.fetch('https://oauth2.googleapis.com/token', {method: 'post', muteHttpExceptions: true,
    payload: {grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: cab + '.' + cuerpo + '.' + firma}});
  var j = JSON.parse(r.getContentText());
  if (!j.access_token) throw new Error('Google no dio permiso: ' + r.getContentText().slice(0, 200));
  cache.put(clave, j.access_token, 3000);
  return j.access_token;
}

/* Los equipos anotados para recibir avisos viven en la base del barrio, en
   barrio/pushTokens/<cuenta>/<equipo>. Las reglas no dejan que NADIE los
   lea desde la app (ni siquiera la Administración): solo este programa, con
   la cuenta de servicio, que tiene permiso de administrador de la base. */
function baseValida(url) {
  url = String(url || '').replace(/\/+$/, '');
  return /^https:\/\/[a-z0-9-]+\.(firebaseio\.com|[a-z0-9-]+\.firebasedatabase\.app)$/.test(url) ? url : '';
}
function tokensDe(db, para, excluir) {
  var acceso = tokenGoogle('https://www.googleapis.com/auth/firebase.database https://www.googleapis.com/auth/userinfo.email');
  var r = UrlFetchApp.fetch(db + '/barrio/pushTokens.json?access_token=' + encodeURIComponent(acceso), {muteHttpExceptions: true});
  if (r.getResponseCode() !== 200) throw new Error('No se pudo leer la lista de equipos: ' + r.getContentText().slice(0, 160));
  var todos = JSON.parse(r.getContentText() || 'null') || {};
  var lista = [].concat(para || 'todos'), out = [];
  Object.keys(todos).forEach(function (uid) {
    if (excluir && uid === excluir) return;
    var equipos = todos[uid] || {};
    Object.keys(equipos).forEach(function (k) {
      var e = equipos[k]; if (!e || !e.t) return;
      var rol = e.rol || 'vecino';
      var toca = lista.some(function (p) {
        return p === 'todos' || p === uid || p === 'rol:' + rol || (p === 'staff' && (rol === 'admin' || rol === 'guardia'));
      });
      if (toca) out.push({uid: uid, clave: k, t: e.t});
    });
  });
  return {acceso: acceso, equipos: out};
}

function mandarPush(d) {
  var props = PropertiesService.getScriptProperties();
  var cuenta = JSON.parse(props.getProperty('FCM_CUENTA') || '{}');
  if (!cuenta.project_id) return {ok: false, error: 'Los avisos push no están configurados (falta FCM_CUENTA, ver AVISOS.md)'};
  var db = baseValida(d.db);
  if (!db) return {ok: false, error: 'Falta la dirección de la base'};
  if (contarHoy('PUSH') >= 400) return {ok: false, error: 'tope diario de avisos push alcanzado'};
  var destino = tokensDe(db, d.para, d.excluir);
  if (!destino.equipos.length) return {ok: true, enviados: 0};
  var acceso = tokenGoogle('https://www.googleapis.com/auth/firebase.messaging');
  var url = 'https://fcm.googleapis.com/v1/projects/' + cuenta.project_id + '/messages:send';
  /* Solo datos: el que arma la notificación es el service worker de la app,
     así se ve igual en todos los equipos y puede vibrar o insistir.
     Urgencia siempre alta: con "normal", Android deja el aviso para cuando
     el teléfono se despierta solo (a veces varios minutos), y el camión o un
     paquete ya no sirven tarde. Solo viajan avisos que suenan. */
  var datos = {titulo: String(d.titulo || 'Barrio Bahía Cauquén').slice(0, 120), texto: String(d.texto || '').slice(0, 300),
    link: String(d.link || ''), tag: String(d.tag || ''), urgente: d.urgente ? '1' : '', sonido: String(d.sonido || '')};
  var pedidos = destino.equipos.map(function (e) {
    return {url: url, method: 'post', contentType: 'application/json', muteHttpExceptions: true,
      headers: {Authorization: 'Bearer ' + acceso},
      payload: JSON.stringify({message: {token: e.t, data: datos,
        webpush: {headers: {Urgency: 'high', TTL: String(d.urgente ? 3600 : 10800)}}}})};
  });
  var enviados = 0, borrar = {};
  for (var i = 0; i < pedidos.length; i += 50) {
    var tanda = UrlFetchApp.fetchAll(pedidos.slice(i, i + 50));
    tanda.forEach(function (r, k) {
      var cod = r.getResponseCode(), e = destino.equipos[i + k];
      if (cod === 200) enviados++;
      else if (cod === 404 || /UNREGISTERED|INVALID_ARGUMENT|NOT_FOUND/.test(r.getContentText())) borrar[e.uid + '/' + e.clave] = null;
    });
  }
  /* Los equipos que ya no existen (se desinstaló la app, se borraron los
     datos del navegador) se sacan de la lista. */
  if (Object.keys(borrar).length) {
    UrlFetchApp.fetch(db + '/barrio/pushTokens.json?access_token=' + encodeURIComponent(destino.acceso),
      {method: 'patch', contentType: 'application/json', payload: JSON.stringify(borrar), muteHttpExceptions: true});
  }
  registrar('PUSH', enviados + ' equipos', datos.titulo);
  return {ok: true, enviados: enviados, borrados: Object.keys(borrar).length};
}

/**
 * COBRO DE EXPENSAS CON MERCADO PAGO
 * ---------------------------------------------------------------------------
 * El vecino toca "Pagar online", la app pide acá el enlace de pago y Mercado
 * Pago cobra con tarjeta, saldo, billetera o QR. Los datos de la tarjeta no
 * pasan ni por la app ni por acá: los carga en la página de Mercado Pago.
 *
 * NADIE SE CREE QUE PAGÓ PORQUE LO DICE EL TELÉFONO: la app de la
 * Administración le pregunta a este programa, y este programa a Mercado
 * Pago, qué pagos entraron de verdad. Solo esos se acreditan y generan
 * recibo, solos, sin que nadie tenga que confirmarlos a mano.
 *
 * CONFIGURARLO: Mercado Pago → Tu negocio → Configuración → Credenciales
 * (o developers.mercadopago.com → Tus integraciones) → copiar el "Access
 * Token" de PRODUCCIÓN. Acá: Propiedades del script → MP_ACCESS_TOKEN.
 * Ese token NUNCA va en la app: es la llave de la cuenta.
 */
function mpToken() {
  var t = PropertiesService.getScriptProperties().getProperty('MP_ACCESS_TOKEN');
  if (!t) throw new Error('Mercado Pago no está configurado (falta MP_ACCESS_TOKEN, ver PAGOS.md)');
  return t;
}
function mpPedir(metodo, ruta, cuerpo) {
  var op = {method: metodo, muteHttpExceptions: true, headers: {Authorization: 'Bearer ' + mpToken()}};
  if (cuerpo) { op.contentType = 'application/json'; op.payload = JSON.stringify(cuerpo); }
  var r = UrlFetchApp.fetch('https://api.mercadopago.com' + ruta, op);
  var j = {}; try { j = JSON.parse(r.getContentText()); } catch (e) {}
  if (r.getResponseCode() >= 300) throw new Error('Mercado Pago contestó ' + r.getResponseCode() + ': ' + (j.message || r.getContentText().slice(0, 160)));
  return j;
}
function mpCrear(d) {
  /* La dirección de la base del barrio: la trae la app y se guarda, para
     que el aviso de Mercado Pago (que no la trae) sepa dónde anotar. */
  var base = baseValida(d.base);
  if (base && PropertiesService.getScriptProperties().getProperty('BASE_URL') !== base) PropertiesService.getScriptProperties().setProperty('BASE_URL', base);
  var monto = Math.round(Number(d.monto) * 100) / 100;
  if (!(monto >= 100) || monto > 50000000) return {ok: false, error: 'Importe fuera de rango'};
  var lote = String(d.lote || '').slice(0, 20);
  if (!/^Lote\s+\w+$/.test(lote)) return {ok: false, error: 'Lote inválido'};
  /* La referencia dice a qué lote va el pago: es lo único que se usa para
     acreditarlo. Si alguien paga el lote de un vecino, se le acredita al
     vecino: no hay forma de sacar provecho de eso. */
  var ref = lote + '|' + String(d.periodo || '') + '|' + Utilities.getUuid().slice(0, 8);
  var volver = String(d.volver || '');
  var pref = {
    items: [{id: ref, title: String(d.titulo || ('Expensas ' + lote)).slice(0, 120), quantity: 1, currency_id: 'ARS', unit_price: monto}],
    external_reference: ref,
    statement_descriptor: 'EXPENSAS BHC',
    payer: d.email ? {email: String(d.email)} : undefined,
    metadata: {lote: lote, periodo: String(d.periodo || ''), uid: String(d.uid || '')}
  };
  if (/^https:\/\//.test(volver)) {
    pref.back_urls = {success: volver, pending: volver, failure: volver};
    pref.auto_return = 'approved';
  }
  var url = ScriptApp.getService().getUrl();
  if (url) pref.notification_url = url;
  var j = mpPedir('post', '/checkout/preferences', pref);
  registrar('MP-ENLACE', lote, String(monto));
  return {ok: true, url: j.init_point, id: j.id, ref: ref};
}
function resumenPago(p) {
  return {id: String(p.id), estado: p.status, detalle: p.status_detail, monto: p.transaction_amount, neto: p.transaction_details && p.transaction_details.net_received_amount,
    ref: p.external_reference || '', fecha: p.date_approved || p.date_created, medio: p.payment_method_id, tipo: p.payment_type_id,
    email: p.payer && p.payer.email || '', uid: (p.metadata && p.metadata.uid) || '',
    /* Los pagos hechos con cuentas de prueba de Mercado Pago vienen con
       live_mode = false: la app los muestra aparte y no tocan saldos,
       recibos ni contabilidad. */
    prueba: p.live_mode === false};
}
/**
 * EL PAGO DE UNA REFERENCIA (26-09-2026)
 * Mientras el vecino paga en la otra ventana, la app pregunta cada 4
 * segundos "¿ya entró el pago de esta referencia?". Se le pregunta a
 * Mercado Pago (no a la app): si hay uno aprobado, gana ese.
 */
function mpPorReferencia(ref) {
  ref = String(ref || '');
  if (!/^Lote\s+\w+\|/.test(ref)) return {ok: false, error: 'Referencia inválida'};
  var j = mpPedir('get', '/v1/payments/search?sort=date_created&criteria=desc&limit=10&external_reference=' + encodeURIComponent(ref));
  var pagos = (j.results || []).filter(function (p) { return p.external_reference === ref; });
  var mejor = pagos.filter(function (p) { return p.status === 'approved'; })[0] || pagos[0];
  return {ok: true, pago: mejor ? resumenPago(mejor) : null};
}
/**
 * EL AVISO DE MERCADO PAGO ANOTA EL PAGO EN LA BASE (26-09-2026)
 * Mercado Pago avisa acá cada pago. No se le cree al aviso: se le pregunta
 * el pago a Mercado Pago con el token. Si está APROBADO y es de un lote, se
 * anota en la carpeta del vecino que pagó (pv/pagos/<vecino>/mp-<número>),
 * con el mismo id que usa la app: aunque el vecino haya cerrado todo, el
 * saldo se descuenta en todos sus equipos y la Administración lo pasa a
 * recibo sola. Si ya estaba anotado, no se toca (nunca se pisa un pago
 * que la Administración ya confirmó).
 * Necesita la cuenta de servicio (FCM_CUENTA, la misma de los avisos) y
 * que la app haya pedido al menos un pago (así se guarda BASE_URL).
 */
function mpAvisoDePago(id) {
  var props = PropertiesService.getScriptProperties();
  var base = baseValida(props.getProperty('BASE_URL'));
  if (!base || !props.getProperty('FCM_CUENTA')) return;
  var p = resumenPago(mpPedir('get', '/v1/payments/' + id));
  if (p.estado !== 'approved' || !/^Lote\s+\w+\|/.test(p.ref) || !/^[A-Za-z0-9_-]{6,64}$/.test(p.uid)) return;
  var lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    var acceso = tokenGoogle('https://www.googleapis.com/auth/firebase.database https://www.googleapis.com/auth/userinfo.email');
    var ruta = base + '/pv/pagos/' + p.uid + '/mp-' + p.id + '.json?access_token=' + encodeURIComponent(acceso);
    var ya = UrlFetchApp.fetch(ruta, {muteHttpExceptions: true}).getContentText();
    if (ya && ya !== 'null') return;
    var lote = p.ref.split('|')[0];
    var pago = {id: 'mp-' + p.id, lote: lote, userId: p.uid, monto: Number(p.monto), fecha: String(p.fecha || '').slice(0, 10),
      medio: 'Mercado Pago', nota: 'Aprobado por Mercado Pago' + (p.medio ? ' · ' + p.medio : '') + ' (aviso automático)', mpId: String(p.id),
      estado: 'informado', prueba: !!p.prueba, at: Date.now()};

    var r = UrlFetchApp.fetch(ruta, {method: 'put', contentType: 'application/json', payload: JSON.stringify(pago), muteHttpExceptions: true});
    registrar(r.getResponseCode() < 300 ? 'MP-ANOTADO' : 'MP-NO-ANOTADO', lote, String(p.id) + ' · ' + p.monto);
  } finally { lock.releaseLock(); }
}

function mpVerificar(id) {
  if (!/^\d{5,20}$/.test(String(id || ''))) return {ok: false, error: 'Número de pago inválido'};
  return {ok: true, pago: resumenPago(mpPedir('get', '/v1/payments/' + id))};
}
/* Los pagos aprobados de los últimos días: la app de la Administración los
   cruza con los que ya tiene y acredita los que falten. Así un vecino que
   pagó y cerró el navegador sin volver a la app queda acreditado igual. */
function mpRecientes(dias) {
  dias = Math.max(1, Math.min(60, Number(dias) || 10));
  var desde = new Date(Date.now() - dias * 86400000).toISOString();
  var hasta = new Date().toISOString();
  var j = mpPedir('get', '/v1/payments/search?sort=date_created&criteria=desc&limit=100&status=approved&range=date_created&begin_date=' +
    encodeURIComponent(desde) + '&end_date=' + encodeURIComponent(hasta));
  var pagos = (j.results || []).filter(function (p) { return /^Lote\s/.test(p.external_reference || ''); }).map(resumenPago);
  return {ok: true, pagos: pagos};
}

/**
 * CRUCEROS EN USHUAIA
 * ---------------------------------------------------------------------------
 * El cronograma oficial lo publica el Instituto Fueguino de Turismo en
 * findelmundo.tur.ar, armado con los datos de la Dirección Provincial de
 * Puertos. Esa página no deja que la app la lea directo (el navegador lo
 * impide), pero Google sí puede leerla: este programa la lee, se queda con
 * lo importante y se lo pasa a la app. Guarda el resultado 3 horas, así
 * aunque haya 150 vecinos mirando, la página del INFUETUR se lee pocas
 * veces por día.
 *
 * No hace falta configurar nada: con pegar este código nuevo y hacer
 * "Implementar -> Gestionar implementaciones -> editar -> Nueva versión",
 * la ventana Cruceros de la app se llena sola.
 */
var CRUCEROS_URL = 'https://findelmundo.tur.ar/es/cruceros/cronograma';

function cruceros(forzar) {
  var cache = CacheService.getScriptCache();
  if (!forzar) {
    var guardado = cache.get('cruceros');
    if (guardado) return JSON.parse(guardado);
  }
  var hoy = new Date(), barcos = [], actualizado = '';
  for (var i = 0; i < 3; i++) {
    var d = new Date(hoy.getFullYear(), hoy.getMonth() + i, 1);
    var p = d.getFullYear() + ('0' + (d.getMonth() + 1)).slice(-2);
    try {
      var html = UrlFetchApp.fetch(CRUCEROS_URL + '?p=' + p, {muteHttpExceptions: true}).getContentText('UTF-8');
      var r = leerCronograma(html);
      barcos = barcos.concat(r.barcos);
      if (r.actualizado) actualizado = r.actualizado;
    } catch (err) { /* un mes que no carga no frena a los otros */ }
  }
  var salida = {ok: true, fuente: 'INFUETUR · findelmundo.tur.ar', actualizado: actualizado, leido: new Date().toISOString(), barcos: barcos};
  try { cache.put('cruceros', JSON.stringify(salida), 3 * 3600); } catch (e) {}
  return salida;
}

/* Lee la tabla del cronograma. Cada fila: buque, operador (con enlace),
   arribo, partida, capacidad de pasajeros y tipo de viaje. */
function leerCronograma(html) {
  var limpio = function (s) { return String(s || '').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&acute;|´/g, "'").replace(/\s+/g, ' ').trim(); };
  var fecha = function (s) { var m = limpio(s).match(/(\d{2})\/(\d{2})\/(\d{4})\s+(\d{1,2}):(\d{2})/); return m ? m[3] + '-' + m[2] + '-' + m[1] + 'T' + ('0' + m[4]).slice(-2) + ':' + m[5] : ''; };
  var cuerpo = (html.split('<tbody>')[1] || '').split('</tbody>')[0];
  var barcos = [];
  var filas = cuerpo.split(/<tr[^>]*>/).slice(1);
  for (var i = 0; i < filas.length; i++) {
    var celdas = filas[i].split(/<td[^>]*>/).slice(1);
    if (celdas.length < 6) continue;
    var link = (celdas[1].match(/href="([^"]+)"/) || [])[1] || '';
    var b = {barco: limpio(celdas[0]), operador: limpio(celdas[1]), web: link, llega: fecha(celdas[2]), sale: fecha(celdas[3]),
             pasajeros: parseInt(limpio(celdas[4]), 10) || 0, tipo: limpio(celdas[5])};
    if (b.barco && b.llega) barcos.push(b);
  }
  var act = (html.match(/Datos actualizados al d[ií]a ([^.<]+)/) || [])[1] || '';
  return {barcos: barcos, actualizado: limpio(act)};
}

function responder(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Registro de todo lo que pasa por acá, en una hoja de cálculo del Drive de
 * la misma cuenta. Es la única forma de darse cuenta si alguien encontró la
 * clave en el código y la está usando.
 */
function hojaRegistro() {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty('HOJA_REGISTRO');
  if (id) {
    try { return SpreadsheetApp.openById(id).getSheets()[0]; } catch (e) {}
  }
  var ss = SpreadsheetApp.create('Bahía Cauquén — registro de correos enviados');
  ss.getSheets()[0].appendRow(['Fecha', 'Resultado', 'Destinatario', 'Detalle']);
  props.setProperty('HOJA_REGISTRO', ss.getId());
  return ss.getSheets()[0];
}

function registrar(resultado, para, detalle) {
  try {
    hojaRegistro().appendRow([new Date(), resultado, para, detalle || '']);
  } catch (e) { /* si el registro falla, el envío no debe fallar por eso */ }
}

function contarHoy(tipo) {
  tipo = tipo || 'ENVIADO';
  try {
    var hoja = hojaRegistro();
    var filas = hoja.getDataRange().getValues();
    var hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    var n = 0;
    for (var i = 1; i < filas.length; i++) {
      var f = new Date(filas[i][0]);
      if (f >= hoy && filas[i][1] === tipo) n++;
    }
    return n;
  } catch (e) { return 0; }
}

/**
 * PRUEBA. Ejecutar esta funcion desde el editor (boton "Ejecutar") y revisar
 * la casilla. El correo llega a la misma cuenta que ejecuta el script, asi que
 * ademas sirve para confirmar DE QUE DIRECCION van a salir los correos al
 * vecino: la que figure como remitente es esa.
 */
function probar() {
  var casilla = Session.getEffectiveUser().getEmail();
  MailApp.sendEmail({
    to: casilla,
    subject: 'Bahía Cauquén — prueba de envío',
    htmlBody: '<p>Si recibiste esto, el envío de correo está funcionando.</p>' +
              '<p>Los correos a los vecinos van a salir desde <b>' + casilla + '</b>, ' +
              'con el nombre visible «' + NOMBRE_REMITENTE + '».</p>' +
              '<p>Cuota restante hoy: ' + MailApp.getRemainingDailyQuota() + ' correos.</p>',
    name: NOMBRE_REMITENTE
  });
  Logger.log('Enviado a ' + casilla + '. Cuota restante: ' +
             MailApp.getRemainingDailyQuota());
}
