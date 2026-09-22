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

function doPost(e) {
  try {
    var datos = JSON.parse(e.postData.contents);

    if (datos.clave !== CLAVE_COMPARTIDA) {
      registrar('RECHAZADO', datos.para || '?', 'clave incorrecta');
      return responder({ok: false, error: 'no autorizado'});
    }
    if (!datos.para || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datos.para)) {
      return responder({ok: false, error: 'destinatario inválido'});
    }
    if (contarHoy() >= TOPE_DIARIO) {
      registrar('TOPE', datos.para, 'se alcanzó el tope diario');
      return responder({ok: false, error: 'tope diario alcanzado'});
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
    return responder({ok: true});

  } catch (err) {
    registrar('ERROR', '?', String(err));
    return responder({ok: false, error: String(err)});
  }
}

function doGet(e) {
  var q = e && e.parameter && e.parameter.q;
  if (q === 'cruceros') return responder(cruceros(e.parameter.forzar === '1'));
  return responder({ok: true, estado: 'activo', enviadosHoy: contarHoy(), tope: TOPE_DIARIO, cruceros: true});
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

function contarHoy() {
  try {
    var hoja = hojaRegistro();
    var filas = hoja.getDataRange().getValues();
    var hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    var n = 0;
    for (var i = 1; i < filas.length; i++) {
      var f = new Date(filas[i][0]);
      if (f >= hoy && filas[i][1] === 'ENVIADO') n++;
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
