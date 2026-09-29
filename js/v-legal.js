/* =========================================================
   TÉRMINOS DE USO, DATOS PERSONALES Y DESLINDE DE RESPONSABILIDAD
   -------------------------------------------------------
   Se llega tocando "by Claudio A. Ravasi" al pie de la portada, o desde
   Preguntas frecuentes. El texto está acá, en un solo lugar: si cambia,
   se cambia la fecha de VERSION_LEGAL y listo.
   ========================================================= */
const VERSION_LEGAL = '29 de septiembre de 2026';

const LEGAL = [
  ['1. Partes y objeto', [
    'El presente documento regula el uso de la aplicación web progresiva denominada "Barrio {BARRIO}" (en adelante, "la Aplicación"), desarrollada por Claudio A. Ravasi (en adelante, "el Autor"), y establece el alcance y los límites de su responsabilidad frente al Barrio {BARRIO}, su entidad administradora (en adelante, conjuntamente, "el Barrio" o "la Administración"), los propietarios, inquilinos, ocupantes y residentes (en adelante, "los Vecinos"), el personal de guardia y de la Administración, y toda otra persona que acceda a la Aplicación o reciba información generada por ella (en adelante, "los Terceros"). Todos ellos, en cuanto la utilizan, son "los Usuarios".',
    'La Aplicación es una herramienta informática de comunicación y organización interna del Barrio. No constituye un servicio público, ni un sistema de seguridad, alarma o monitoreo certificado, ni un servicio de emergencias, ni asesoramiento profesional de ninguna índole.',
  ]],
  ['2. Aceptación', [
    'El ingreso, el registro o el uso de la Aplicación, en cualquiera de sus funciones, importa la aceptación plena y sin reservas de estos términos, en los términos de los arts. 971, 979 y 984 a 989 del Código Civil y Comercial de la Nación (CCyC), en lo que resulten aplicables. Quien no esté de acuerdo debe abstenerse de usarla.',
    'Estos términos pueden actualizarse. La versión vigente es siempre la publicada en la Aplicación, con su fecha. El uso posterior a una modificación implica su aceptación.',
  ]],
  ['3. Naturaleza gratuita y carácter del Autor', [
    'La Aplicación fue desarrollada por el Autor a título gratuito, en su condición de vecino y sin fines de lucro, y se pone a disposición del Barrio mediante una licencia de uso gratuita, no exclusiva, intransferible y revocable. El Autor no presta un servicio profesional ni comercial, no percibe contraprestación por su uso y no asume la calidad de proveedor en los términos del art. 2 de la Ley 24.240 de Defensa del Consumidor, sin perjuicio de los derechos irrenunciables que el orden público reconozca a los Usuarios.',
    'La Aplicación se entrega "tal como está" y "según disponibilidad", sin garantía de funcionamiento ininterrumpido, libre de errores, de exactitud de los cálculos o de adecuación a un fin determinado.',
  ]],
  ['4. Responsable de los datos y de la operación', [
    'La operación diaria de la Aplicación, la carga y veracidad de la información, la aprobación de cuentas, la asignación de roles, la emisión de liquidaciones, comunicados y decisiones, y la administración de la base de datos corresponden exclusivamente al Barrio, a través de su Administración y de los órganos previstos en su estatuto o reglamento. El Barrio es el responsable de la base de datos en los términos del art. 2 de la Ley 25.326 y, en su caso, de su inscripción en el Registro Nacional de Bases de Datos (art. 21).',
    'El Autor no administra el Barrio, no toma decisiones por él, no custodia fondos ni valores y no interviene en las relaciones entre el Barrio, los Vecinos y los Terceros.',
  ]],
  ['5. Protección de datos personales', [
    'La Aplicación fue diseñada conforme a la Ley 25.326 de Protección de los Datos Personales, su Decreto Reglamentario 1558/2001, las disposiciones de la Agencia de Acceso a la Información Pública (AAIP) como órgano de control, el art. 43 de la Constitución Nacional (hábeas data), los arts. 51, 52, 53 y 1770 del CCyC (dignidad, intimidad e imagen de las personas) y las garantías de la Constitución de la Provincia de Tierra del Fuego, Antártida e Islas del Atlántico Sur.',
    'Principios aplicados: se recogen solo los datos necesarios para la vida del Barrio (nombre, lote, correo, y los que cada Vecino decida agregar); cada Usuario ve únicamente lo que su rol le permite; los datos de contacto se muestran a los demás solo si su titular lo autoriza; los mensajes privados y los reclamos son reservados; las fotografías publicadas se conservan en baja resolución y el archivo original se entrega a quien lo descarga, sin quedar almacenado en la base; el acceso está protegido por cuentas personales y reglas de seguridad en el servidor.',
    'Medidas de seguridad (art. 9 de la Ley 25.326 y Resolución AAIP 47/2018): comunicaciones cifradas (HTTPS/TLS); almacenamiento cifrado por el proveedor; contraseñas conservadas solo como huella criptográfica irreversible; reglas de acceso aplicadas en el servidor, por las que cada Usuario accede solo a su propia información y cada rol solo a las carpetas que su función requiere; los mensajes entre Vecinos no son accesibles para la Administración ni para la guardia; registro de auditoría de las acciones de la Administración; y borrado de los datos locales al cerrar sesión. Quienes acceden por su función (Administración y guardia) están obligados al secreto (art. 10).',
    'Ante un pedido de auxilio (SOS), el nombre, el lote, el tipo de emergencia y la ubicación del Usuario al momento de pedirlo se muestran a todos los Usuarios del Barrio, con la finalidad exclusiva de que puedan saber dónde ocurre y prestar ayuda. La ubicación se toma solo en ese momento y por acto del propio titular.',
    'Los datos se alojan en servicios de Google LLC (Firebase y Google Apps Script), que pueden encontrarse fuera del país. Al usar la Aplicación, el Usuario presta su consentimiento libre, expreso e informado para ese tratamiento y transferencia (arts. 5 y 12 de la Ley 25.326 y art. 12 del Decreto 1558/2001), limitado a las finalidades de comunicación, seguridad, administración y convivencia del Barrio. Google LLC actúa como prestador de servicios informatizados en los términos del art. 25 de la Ley 25.326.',
    'El Hotel Los Cauquenes, propietario de unidades del Barrio con actividad comercial, usa una cuenta institucional con un rol propio que no accede a los datos personales de los Vecinos (padrón, fichas, pizarrón, visitas, pagos, mensajes, bitácora y SOS); las reglas del servidor se lo impiden. El Hotel es responsable de los datos de sus huéspedes que carga para el ingreso y los traslados, que ven solo el Hotel y la guardia y se eliminan automáticamente al día siguiente del egreso.',
    'Los datos sensibles (art. 2 y 7 de la Ley 25.326), como la información de salud que pudiera surgir de un pedido de auxilio, se tratan solo para atender la emergencia y no se ceden a terceros ajenos a ella.',
    'La función "Estoy bien" y el aviso de salida son voluntarios. Con ellos el Usuario acepta que la garita, la Administración y las personas del Barrio que elija conozcan su nombre, lote, teléfono, los datos de contacto de los familiares que anote, la hora a la que avisa cada día y, en una salida, a dónde va, con quién y cuándo vuelve, y reciban un aviso si no confirma; sus familiares lo reciben por correo. Esos datos no los ven los demás Usuarios; los avisos se borran a los 30 días y todo se elimina cuando el Usuario deja de usar la función. La función no pide ni guarda datos de salud.',
    'El personal de seguridad contratado por el Barrio (policía adicional) deja en la garita su nombre, matrícula, celular y correo. Con esos datos la guardia registra el día, el turno y la hora de su ingreso y de su salida y cada ronda con la hora de cada punto de control, y al terminar el servicio la Aplicación le envía a su correo la constancia de lo registrado. Esos datos los ven solo la garita y la Administración, con la finalidad de controlar y acreditar el servicio.',
    'Las cuentas de un mismo lote ven entre sí el nombre, la relación con el lote y si tienen la Aplicación abierta, y comparten lo que es de la casa (paquetes, expensas, los cuidados de la casa en invierno y en verano, y la mochila y el plan ante un sismo con sus sugerencias). Si una cuenta avisa que otra no pertenece a su lote, la Administración recibe un aviso privado para revisarlo y la persona aludida, uno sin el nombre de quien avisó.',
    'Cuando un Vecino avisa que llega un viaje de Uber, DiDi, Cabify o taxi, la garita ve la aplicación, la patente, el nombre del chofer si el Vecino lo anota y el horario, solo para reconocer el vehículo al ingreso. El aviso vence solo y se trata como el pase de una visita.',
    'Quien marca que es del equipo de salud o sabe RCP acepta recibir un aviso cuando la garita sale con el desfibrilador y, si responde que va, que la garita y el vecino que pidió ayuda vean su nombre, su profesión y su teléfono. En "Cosas para prestar" y "Ángeles de la nieve" los demás Usuarios ven el nombre de pila, el lote y lo que cada uno publica; los préstamos se acuerdan entre los Usuarios.',
    'Todo titular puede ejercer en forma gratuita los derechos de acceso (a intervalos no inferiores a seis meses, salvo interés legítimo), rectificación, actualización y supresión (arts. 14 y 16 de la Ley 25.326), dirigiéndose a la Administración del Barrio, que es quien dispone de los datos. La AAIP, órgano de control de la Ley 25.326, tiene la atribución de atender las denuncias y reclamos que se interpongan con relación al incumplimiento de las normas sobre protección de datos personales.',
  ]],
  ['6. Deslinde de responsabilidad del Autor', [
    'En la máxima medida permitida por la ley, y con los límites del art. 1743 del CCyC, el Autor no será responsable por daños directos o indirectos, lucro cesante, pérdida de chance o daño moral que se deriven de:',
    '• El uso, el mal uso, el abuso o la falta de uso de la Aplicación por parte del Barrio, los Vecinos o los Terceros, y las decisiones que cualquiera de ellos adopte sobre la base de la información que muestra (arts. 1729 y 1731 del CCyC: hecho del damnificado y hecho de un tercero).',
    '• La información, las fotografías, los mensajes, las publicaciones, los reclamos o las opiniones que cargan los Usuarios, de los que es responsable exclusivo quien los publica. Conforme la doctrina de la Corte Suprema de Justicia de la Nación en "Rodríguez, María Belén c/ Google Inc." (Fallos 337:1174, 2014) y "Gimbutas, Carolina Valeria c/ Google Inc." (2017), quien solo brinda el medio técnico no responde por contenidos de terceros, salvo que, tomando conocimiento efectivo de un contenido manifiestamente ilícito, no actúe con diligencia para bloquearlo.',
    '• La interrupción, demora, falla o pérdida de datos causada por la conexión a internet, la energía eléctrica, el equipo o el navegador del Usuario, o por servicios de terceros que la Aplicación utiliza (Google Firebase y Apps Script, Mercado Pago, Open-Meteo, el Servicio Geológico de los Estados Unidos, servicios de vuelos y cruceros, entre otros), así como por caso fortuito o fuerza mayor (art. 1730 del CCyC).',
    '• El acceso no autorizado a una cuenta por descuido de su titular en la custodia de su contraseña o de su equipo.',
  ]],
  ['7. Emergencias y seguridad', [
    'El botón SOS, los avisos urgentes, la garita digital, los pases de visita y los avisos al celular son herramientas complementarias de comunicación entre vecinos y con la guardia. No reemplazan en ningún caso la llamada a los servicios oficiales: emergencias 911, emergencias médicas 107, bomberos 100, policía 101, Defensa Civil 103. Ante una emergencia, llame primero a esos números.',
    '"Estoy bien", el aviso de salida, el aviso a los vecinos del equipo de salud y la guía de seguridad de verano son ayudas entre vecinos. No son un servicio de asistencia, monitoreo ni rescate, no reemplazan la consulta a Prefectura, a los guardaparques ni a guías habilitados, y quien acude a ayudar lo hace en forma voluntaria. Los préstamos de "Cosas para prestar" y la ayuda de "Ángeles de la nieve" son acuerdos entre los Usuarios, que responden por ellos.',
    'La revisión diaria de las casas solas y el aviso "Tu casa está en orden" dependen de la disponibilidad de la guardia y del personal de seguridad del Barrio; no constituyen un servicio de vigilancia garantizado ni transfieren al Autor responsabilidad alguna sobre los bienes. La sección "Preparados para un sismo" es una guía general basada en recomendaciones públicas de Defensa Civil y en protocolos internacionales; ante una emergencia rigen las indicaciones de las autoridades.',
    'La entrega de una alerta depende de factores ajenos al Autor (conectividad, permisos del teléfono, batería, que haya alguien atendiendo). El Autor no garantiza que una alerta llegue, ni que llegue a tiempo, ni la respuesta de quien la reciba.',
    'La información de sismos, clima, nieve, vuelos y cruceros es orientativa y proviene de fuentes externas. Las fuentes oficiales son el Instituto Nacional de Prevención Sísmica (INPRES), el Servicio Meteorológico Nacional (SMN) y Defensa Civil de la Provincia y del Municipio.',
  ]],
  ['8. Expensas, pagos, contabilidad y votaciones', [
    'Las liquidaciones, cupones, estimaciones automáticas de meses futuros, intereses, estados de deuda y el libro contable son instrumentos auxiliares de cálculo. La liquidación válida es la que emite y aprueba la Administración conforme el estatuto, el reglamento y las normas de los conjuntos inmobiliarios (arts. 2073 a 2086 del CCyC) o de la propiedad horizontal, según corresponda. Ante cualquier diferencia, prevalece el documento aprobado por el órgano competente.',
    'La "carpeta del contador" ordena información para el profesional, pero no constituye asesoramiento contable ni impositivo, ni reemplaza la intervención de un contador público matriculado (Ley 20.488) ante ARCA, la Agencia de Recaudación Fueguina (AREF) u otros organismos.',
    'Los pagos en línea los procesa Mercado Pago, bajo sus propios términos. El Autor no recibe, retiene ni transfiere dinero y no responde por la operatoria de terceros.',
    'Las votaciones y encuestas de la Aplicación son un medio de consulta. Solo producen efectos vinculantes cuando el estatuto, el reglamento o la asamblea del Barrio así lo disponen, y no sustituyen las asambleas, quórums, mayorías ni formalidades que la ley o el estatuto exijan.',
  ]],
  ['9. Usos prohibidos', [
    'Queda prohibido: publicar contenido falso, injurioso, discriminatorio (Ley 23.592), amenazante u obsceno; difundir datos, fotografías o imágenes de otras personas sin su consentimiento (art. 53 del CCyC); suplantar la identidad de otro Usuario; usar la Aplicación con fines comerciales o políticos ajenos al Barrio; intentar acceder a datos o funciones que no corresponden al propio rol; y alterar, copiar, descompilar o dañar la Aplicación o sus datos. Estas conductas pueden constituir delitos informáticos (Ley 26.388, arts. 153 bis y 183 del Código Penal) y generan la responsabilidad exclusiva de quien las comete.',
    'La Administración puede suspender o dar de baja la cuenta de quien infrinja estos términos o el reglamento del Barrio.',
  ]],
  ['10. Indemnidad', [
    'El Usuario que, por su uso indebido de la Aplicación o por el contenido que publique, ocasione un reclamo contra el Autor, se obliga a mantenerlo indemne y a resarcirle los gastos, costas y honorarios que ese reclamo le irrogue.',
  ]],
  ['11. Propiedad intelectual', [
    'El código, el diseño, los textos, los gráficos y la estructura de la Aplicación son obra del Autor y están protegidos por la Ley 11.723 de Propiedad Intelectual (incluido el software, según la Ley 25.036). Su uso se limita a la licencia descripta en el punto 3. Queda prohibida su reproducción, modificación, distribución o explotación, total o parcial, sin autorización escrita del Autor. El nombre y la imagen del Barrio pertenecen al Barrio.',
  ]],
  ['12. Menores de edad', [
    'La Aplicación está destinada a personas mayores de edad (art. 25 del CCyC). El uso por parte de menores queda bajo la exclusiva responsabilidad de sus padres o representantes legales.',
  ]],
  ['13. Separabilidad, ley aplicable y jurisdicción', [
    'Si alguna cláusula fuese declarada inválida, las demás conservarán su vigencia, y la inválida se integrará conforme el art. 389 y concordantes del CCyC.',
    'Estos términos se rigen por las leyes de la República Argentina. Para cualquier controversia, las partes se someten a los tribunales ordinarios del Distrito Judicial Sur de la Provincia de Tierra del Fuego, Antártida e Islas del Atlántico Sur, con asiento en la ciudad de Ushuaia, sin perjuicio de las normas de orden público que establezcan otra competencia.',
  ]],
];

function textoLegal(){
  const b = esc(Store.s.config.nombre || 'Bahía Cauquén');
  return LEGAL.map(([t, ps]) => `<h3>${esc(t)}</h3>${ps.map(p => `<p>${esc(p).replace(/\{BARRIO\}/g, b)}</p>`).join('')}`).join('');
}

R.legal = {
  titulo: 'Términos de uso y responsabilidad', icon: 'file', color: 'brand', sub: 'Datos personales y deslinde de responsabilidad del autor',
  render(){
    return `<div class="card legal">
        <p class="legal-cab"><b>Términos y condiciones de uso, política de protección de datos personales y deslinde de responsabilidad</b>
          <span>Versión del ${VERSION_LEGAL} · Ushuaia, Tierra del Fuego, Antártida e Islas del Atlántico Sur</span></p>
        ${textoLegal()}
        <p class="legal-firma">Claudio A. Ravasi<br><span>Autor de la Aplicación</span></p>
      </div>
      <div class="btns" style="margin-top:12px"><button class="btn btn-sec grow" data-a="legal-pdf">${I('file')}Descargar o imprimir</button></div>`;
  },
};
/* Desde la inscripción (todavía sin cuenta): se lee en una hoja. */
A['ver-legal'] = () => hoja('Términos de uso y responsabilidad', `<div class="legal"><p class="legal-cab"><b>Términos y condiciones de uso, política de protección de datos personales y deslinde de responsabilidad</b><span>Versión del ${VERSION_LEGAL}</span></p>${textoLegal()}</div>
  <button class="btn btn-pri btn-block" data-a="cerrar-hoja" style="margin-top:12px">Entendido</button>`, { ancho:'760px' });
A['legal-pdf'] = () => imprimir('Términos de uso y responsabilidad', `<h1>Barrio ${esc(Store.s.config.nombre)}</h1>
  <p><b>Términos y condiciones de uso, política de protección de datos personales y deslinde de responsabilidad</b><br>Versión del ${VERSION_LEGAL}</p>
  ${textoLegal().replace(/<h3>/g, '<h2>').replace(/<\/h3>/g, '</h2>')}
  <p style="margin-top:28px"><b>Claudio A. Ravasi</b><br>Autor de la Aplicación</p>`);

/* =========================================================
   PROTECCIÓN DE DATOS: LO QUE LE TOCA AL BARRIO
   La app pone las herramientas; hay obligaciones que son del barrio como
   responsable de la base (Ley 25.326). Esta ventana (solo Administración)
   las ordena: la inscripción en el Registro Nacional de Bases de Datos de la
   AAIP con las respuestas ya redactadas, quién atiende los pedidos de los
   vecinos, el compromiso de confidencialidad para imprimir y firmar, y un
   registro de incidentes de seguridad. Todo queda en config.proteccion.
   ========================================================= */
const cfgDatos = () => Object.assign({ inscripta:false, inscripcionFecha:'', inscripcionNro:'', responsableArco:'', compromisosFirmados:false, compromisosFecha:'', incidentes:[], sacadasBorradas:0 }, Store.s.config.proteccion || {});
function tareasDatosPendientes(){ const c = cfgDatos(); return [!c.inscripta, !c.responsableArco, !c.compromisosFirmados, !c.sacadasBorradas].filter(Boolean).length; }
const RESPUESTAS_AAIP = () => {
  const c = Store.s.config;
  return [
    ['Responsable de la base', `Barrio ${c.nombre} (entidad administradora), CUIT ${c.cuit || '—'}, domicilio ${c.domicilio || '—'}, correo ${c.adminEmail || '—'}.`],
    ['Nombre de la base', `Vecinos, visitas y administración del Barrio ${c.nombre}.`],
    ['Finalidad', 'Comunicación entre vecinos y con la Administración, seguridad y control de acceso al barrio, administración y cobro de expensas, y convivencia del barrio.'],
    ['Datos que se tratan', 'Identificatorios (nombre, DNI, lote, correo, teléfono optativo); de visitas (nombre, DNI y patente, borrados a los ' + (c.datosDias || 90) + ' días); de pagos de expensas; ubicación solo al pedir un SOS; del personal de guardia y del policía contratado (nombre, matrícula, celular para enviarle su código de ronda, correo para enviarle la constancia de su servicio, día, turno y hora de ingreso y de salida, y rondas con la hora de cada punto de control); de los viajes de Uber, DiDi o taxi que avisa un vecino (aplicación, patente, nombre del chofer si se anota y horario). No se tratan datos sensibles salvo el tipo de emergencia de un SOS, informado por el propio titular.'],
    ['Origen de los datos', 'Los aporta el propio titular al inscribirse o al usar la app; los de visitas, el vecino que las anuncia o la propia visita; los del padrón, la liquidación de expensas del barrio.'],
    ['Cesiones', 'No se ceden datos a terceros, salvo obligación legal u orden judicial. El Hotel Los Cauquenes, que usa la app con una cuenta institucional, no accede a los datos de los vecinos.'],
    ['"Estoy bien" y aviso de salida (voluntarios)', 'Nombre, lote, teléfono, hora límite elegida, familiares (nombre, correo y teléfono), personas del barrio elegidas, hora del aviso diario y, en una salida, actividad, lugar, acompañantes y hora de regreso. Los ven solo el titular, la garita, la Administración y las personas del barrio que eligió; los familiares reciben un correo. Finalidad: avisarles si no confirma. Se borran a los 30 días o al dar de baja la función. No incluyen datos de salud.'],
    ['Servicio del policía contratado', 'Nombre, matrícula, celular, correo, día, turno y hora de ingreso y de salida, guardias del turno, rondas con la hora de cada punto de control y lo que anotó la garita. Los ven solo la garita y la Administración. Finalidad: controlar y acreditar el servicio; al terminar, se le envía la constancia a su propio correo. Se conservan en el libro de guardia.'],
    ['Ausencias ("Me voy de viaje")', 'Fechas en que la casa queda sola, un contacto y una nota, y cada revisión diaria de la guardia. Los ven solo el vecino, las cuentas de su lote, la garita y la Administración. Se borran dos días después del regreso.'],
    ['Vecinos del equipo de salud (voluntario)', 'Marca de que sabe primeros auxilios o es del equipo de salud y su profesión. Finalidad: avisarle cuando la garita sale con el DEA. Si responde que va, la garita y el vecino que pidió ayuda ven su nombre, profesión y teléfono.'],
    ['Datos de huéspedes del hotel', 'Nombre, fechas de estadía, patente y vuelos, que carga el hotel (responsable de esos datos). Los ven solo el hotel y la garita, para el ingreso y los traslados; la Administración, solo la cantidad. Se eliminan al día siguiente del egreso.'],
    ['Transferencia internacional', 'Sí: los datos se alojan en servidores de Google LLC (Firebase) en los Estados Unidos, que actúa como prestador de servicios (art. 25). La transferencia cuenta con el consentimiento expreso de los titulares (art. 12 de la Ley 25.326 y art. 12 del Decreto 1558/2001).'],
    ['Medidas de seguridad', 'Conexiones cifradas (HTTPS/TLS); almacenamiento cifrado por el proveedor; contraseñas guardadas solo como huella irreversible; reglas de acceso en el servidor por rol; cada vecino accede solo a sus datos; registro de auditoría; borrado automático de datos de visitas; compromiso de confidencialidad del personal con acceso.'],
    ['Conservación', 'Datos de visitas: ' + (c.datosDias || 90) + ' días. Paquetes retirados: 30 días en la app y después en el archivo histórico, sin foto, firma ni dígitos del DNI. Datos contables y de expensas: 10 años (art. 328 del Código Civil y Comercial). Avisos de "Estoy bien": 30 días. El resto, mientras el titular tenga cuenta.'],
    ['Derechos de los titulares', 'Acceso, rectificación, actualización y supresión, gratuitos, ante la Administración' + (cfgDatos().responsableArco ? ` (${cfgDatos().responsableArco})` : '') + '. Plazos: 10 días corridos para el acceso y 5 días hábiles para rectificar o suprimir.'],
  ];
};
R.proteccion = {
  titulo: 'Protección de datos', icon: 'lock', color: 'ok', sub: 'Lo que le toca al barrio como responsable de la base',
  render(){
    if (!esAdmin()) return vacio('lock', 'Solo para la Administración.');
    const c = cfgDatos();
    const paso = (ok, t, x) => `<div class="it"><span class="ic ic-${ok ? 'ok' : 'warn'}" style="width:34px;height:34px;border-radius:11px;display:grid;place-items:center">${I(ok ? 'check' : 'alert')}</span><div class="txt"><b>${t}</b><span>${x}</span></div></div>`;
    return `<p class="muted small" style="margin:0 0 12px">La app ya cumple su parte (cifrado, acceso por rol, borrado de visitas, auditoría). Estas tareas son del barrio como responsable de la base de datos (Ley 25.326). Van también en Preguntas frecuentes, para que los vecinos sepan que se hacen.</p>
      <div class="card lista">
        ${paso(c.inscripta, 'Base inscripta en el Registro Nacional de Bases de Datos (AAIP)', c.inscripta ? `Inscripta${c.inscripcionFecha ? ' el ' + fechaCorta(c.inscripcionFecha) : ''}${c.inscripcionNro ? ' · N.º ' + esc(c.inscripcionNro) : ''}` : 'Pendiente. Es lo que hace lícito el archivo (arts. 3 y 21).')}
        ${paso(!!c.responsableArco, 'Quién atiende los pedidos de los vecinos sobre sus datos', c.responsableArco ? esc(c.responsableArco) : 'Pendiente: nombre y correo de quien responde (10 días corridos para el acceso, 5 hábiles para corregir o borrar).')}
        ${paso(c.compromisosFirmados, 'Compromiso de confidencialidad firmado por guardias y Administración', c.compromisosFirmados ? `Firmados${c.compromisosFecha ? ' el ' + fechaCorta(c.compromisosFecha) : ''}` : 'Pendiente (art. 10: deber de secreto). Imprimilo abajo.')}
        ${paso(true, 'Registro de incidentes de seguridad', `${plural(aLista(c.incidentes).length, 'incidente anotado', 'incidentes anotados')}`)}
        ${paso(!!c.sacadasBorradas, 'Borrar lo que quedó del chat vecinal y de las reservas', c.sacadasBorradas ? `Borrado el ${fechaCorta(isoDe(new Date(c.sacadasBorradas)))}` : 'Pendiente. Esas dos funciones se sacaron de la app el 29-09-2026; lo que quedó guardado en la base ya no tiene finalidad y hay que borrarlo (art. 4 inc. 7).')}
      </div>
      ${c.sacadasBorradas ? '' : `<div class="btns"><button class="btn btn-sm btn-danger-soft" data-a="datos-sacados-borrar">${I('trash')}Borrar lo que quedó del chat y las reservas</button></div>`}
      ${sec('Cómo inscribir la base en la AAIP')}
      <div class="card small" style="line-height:1.6">
        <p style="margin:0 0 8px">1. Entrá a <b>argentina.gob.ar/aaip/datospersonales</b> y buscá la inscripción de bases de datos en el Registro Nacional de Bases de Datos. El trámite es en línea y gratuito, con la <b>clave fiscal de la entidad del barrio</b> (CUIT ${esc(Store.s.config.cuit || '—')}), por Trámites a Distancia (TAD).</p>
        <p style="margin:0 0 8px">2. Te van a preguntar lo de abajo: las respuestas ya están redactadas con lo que hace la app. Copialas.</p>
        <p style="margin:0">3. Cuando termines, anotá acá la fecha y el número. Si cambia algo importante (otra finalidad, otro proveedor), hay que actualizar la inscripción.</p>
        <p class="muted tiny" style="margin:10px 0 0">El nombre exacto de los pasos puede cambiar en el sitio de la AAIP; lo que se declara es siempre esto.</p></div>
      <div class="card lista">${RESPUESTAS_AAIP().map(([t, x], i) => `<div class="it"><div class="txt"><b>${esc(t)}</b><span style="white-space:normal">${esc(x)}</span></div><button class="icon-btn" data-a="aaip-copiar" data-v="${i}" aria-label="Copiar">${I('copy')}</button></div>`).join('')}</div>
      <div class="btns"><button class="btn btn-sm btn-sec" data-a="aaip-imprimir">${I('file')}Imprimir las respuestas</button></div>
      ${sec('Anotar lo hecho')}
      <form data-f="proteccion" class="card">
        <label class="check"><input type="checkbox" name="inscripta" ${c.inscripta ? 'checked' : ''}><span>La base ya está inscripta en la AAIP</span></label>
        <div class="grid2"><div class="field"><label>Fecha de inscripción</label><input type="date" name="inscripcionFecha" value="${esc(c.inscripcionFecha)}"></div>
          <div class="field"><label>Número de registro</label><input name="inscripcionNro" maxlength="40" value="${esc(c.inscripcionNro)}"></div></div>
        <div class="field"><label>Quién atiende los pedidos sobre datos (nombre y correo)</label><input name="responsableArco" maxlength="120" value="${esc(c.responsableArco)}" placeholder="Paula Juncos · barriobahiacauquen@gmail.com"></div>
        <label class="check"><input type="checkbox" name="compromisosFirmados" ${c.compromisosFirmados ? 'checked' : ''}><span>Guardias y Administración firmaron el compromiso de confidencialidad</span></label>
        <div class="field"><label>Fecha de las firmas</label><input type="date" name="compromisosFecha" value="${esc(c.compromisosFecha)}"></div>
        <button class="btn btn-pri btn-block">${I('check')}Guardar</button></form>
      ${sec('Compromiso de confidencialidad')}
      ${superficie({ a:'compromiso-imprimir', icon:'file', color:'brand', t:'Imprimir el compromiso', s:'Uno por persona: guardias (también los que cubren francos) y quienes administran' })}
      ${sec('Registro de incidentes', `<button class="link" data-a="incidente-nuevo">Anotar un incidente</button>`)}
      ${aLista(c.incidentes).length ? `<div class="card lista">${aLista(c.incidentes).slice().reverse().map(x => `<div class="it"><div class="txt"><b>${fechaCorta(x.fecha)} · ${esc(x.que)}</b><span style="white-space:normal">Afectados: ${esc(x.afectados || '—')} · Medidas: ${esc(x.medidas || '—')}${x.avisados ? ' · Se avisó a los afectados' : ''}</span></div></div>`).join('')}</div>`
        : vacio('lock', 'Sin incidentes. Anotá cualquiera: una contraseña que se filtró, un teléfono de la garita perdido, un acceso que no correspondía.')}
      <p class="muted tiny">Ante un incidente: cambiar las contraseñas involucradas, sacar el acceso a quien no corresponde, avisar a los vecinos afectados y dejarlo anotado acá (Resolución AAIP 47/2018).</p>`;
  },
};
/* LO QUE QUEDÓ DE DOS FUNCIONES QUE SE SACARON (29-09-2026)
   El chat vecinal y las reservas de espacios comunes ya no están en la app:
   ningún equipo baja ni escribe esas carpetas, y las reglas se las cierran a
   todos menos a la Administración. Lo que quedó guardado ya no tiene
   finalidad (art. 4 inc. 7 de la Ley 25.326), así que se borra. No se borra
   solo porque es para siempre: lo hace la Administración con un botón, y
   queda en la auditoría. */
const CARPETAS_SACADAS = ['msgs', 'reservas', 'bloqueos', 'amenities'];
A['datos-sacados-borrar'] = async () => {
  if (!esAdmin()) return;
  if (!await confirmar('Borrar el chat vecinal y las reservas', 'Se borran para siempre los mensajes del chat vecinal y las reservas, los turnos bloqueados y los espacios comunes que quedaron guardados en la base. Esas funciones ya no están en la app. No se puede deshacer.', { si:'Borrar para siempre', peligro:true })) return;
  if (Nube.activa()){
    if (!Nube.db){ toast('Sin conexión con la base: probá de nuevo en un rato', 'alert'); return; }
    try { await Promise.all(CARPETAS_SACADAS.map(k => Nube.db.ref('barrio/' + k).remove())); }
    catch(e){ toast('No se pudo borrar (¿faltan publicar las reglas?)', 'alert'); console.warn('Borrar carpetas sacadas', e.message); return; }
  }
  Store.cambiar(s => { s.config.proteccion = Object.assign({}, cfgDatos(), { sacadasBorradas:Date.now() });
    auditar(s, 'Borró lo que quedaba del chat vecinal y de las reservas', 'Funciones que se sacaron de la app el 29-09-2026'); });
  toast('Listo: se borró lo que quedaba del chat y de las reservas', 'trash'); refrescar();
};
A['aaip-copiar'] = el => { const r = RESPUESTAS_AAIP()[+el.dataset.v]; if (!r) return; try { navigator.clipboard.writeText(r[1]); } catch(e){} toast(`Copiado: ${r[0]}`, 'copy'); };
A['aaip-imprimir'] = () => imprimir('Inscripción en la AAIP', `<h1>Barrio ${esc(Store.s.config.nombre)}</h1><p><b>Respuestas para la inscripción de la base en el Registro Nacional de Bases de Datos (AAIP)</b><br>${fechaLarga(hoyISO())}</p>
  ${RESPUESTAS_AAIP().map(([t, x]) => `<h2>${esc(t)}</h2><p>${esc(x)}</p>`).join('')}`);
F['proteccion'] = d => {
  Store.cambiar(s => { s.config.proteccion = Object.assign({}, cfgDatos(), { inscripta:!!d.inscripta, inscripcionFecha:d.inscripcionFecha || '', inscripcionNro:String(d.inscripcionNro || '').trim(),
    responsableArco:String(d.responsableArco || '').trim(), compromisosFirmados:!!d.compromisosFirmados, compromisosFecha:d.compromisosFecha || '' });
    auditar(s, 'Actualizó las tareas de protección de datos', ''); });
  toast('Guardado', 'check'); refrescar();
};
A['incidente-nuevo'] = () => hoja('Anotar un incidente de seguridad', `<form data-f="incidente">
  <div class="field"><label>Fecha</label><input type="date" name="fecha" required value="${hoyISO()}"></div>
  <div class="field"><label>Qué pasó</label><textarea name="que" required maxlength="400" placeholder="Ej: se perdió el teléfono de la garita con la sesión abierta."></textarea></div>
  <div class="field"><label>A quiénes afecta</label><input name="afectados" maxlength="200"></div>
  <div class="field"><label>Qué se hizo</label><textarea name="medidas" maxlength="400" placeholder="Ej: se cambió la contraseña de la garita y se cerró la sesión en todos los equipos."></textarea></div>
  <label class="check"><input type="checkbox" name="avisados"><span>Se avisó a los afectados</span></label>
  <button class="btn btn-pri btn-block">${I('check')}Anotar</button></form>`);
F['incidente'] = d => {
  Store.cambiar(s => { const c = cfgDatos(); s.config.proteccion = Object.assign({}, c, { incidentes:[...aLista(c.incidentes), { id:uid(), fecha:d.fecha, que:d.que.trim(), afectados:(d.afectados || '').trim(), medidas:(d.medidas || '').trim(), avisados:!!d.avisados, at:Date.now() }] });
    auditar(s, 'Anotó un incidente de seguridad', d.que.trim().slice(0, 80)); });
  cerrarHoja(); toast('Incidente anotado', 'check'); refrescar();
};
A['compromiso-imprimir'] = () => { const c = Store.s.config;
  imprimir('Compromiso de confidencialidad', `<h1>Barrio ${esc(c.nombre)}</h1><p><b>Compromiso de confidencialidad sobre datos personales</b></p>
  <p>En la ciudad de Ushuaia, a los ____ días del mes de ______________ de 20____, quien suscribe, ____________________________________________, DNI ______________, en su carácter de ______________________ (guardia / integrante de la Administración / otro), declara:</p>
  <p>1. Que en el ejercicio de su función accede a datos personales de los vecinos, de sus visitas y de terceros, a través de la aplicación del Barrio ${esc(c.nombre)} y de otros registros del barrio.</p>
  <p>2. Que se obliga a guardar secreto sobre esos datos, conforme el art. 10 de la Ley 25.326 de Protección de los Datos Personales, y que esta obligación subsiste aun después de finalizada su relación con el barrio.</p>
  <p>3. Que usará los datos exclusivamente para las tareas de su función (seguridad, control de acceso, administración), y que no los copiará, fotografiará, reenviará ni comunicará a terceros, salvo orden judicial o de autoridad competente.</p>
  <p>4. Que mantendrá en reserva su contraseña, no dejará la sesión abierta en equipos sin supervisión, y avisará de inmediato a la Administración ante la pérdida de un equipo o cualquier acceso indebido.</p>
  <p>5. Que conoce que el acceso ilegítimo a un banco de datos personales o la revelación de su contenido pueden constituir delito (arts. 153 bis y 157 bis del Código Penal), sin perjuicio de la responsabilidad civil y de las sanciones que correspondan.</p>
  <p style="margin-top:48px">Firma: ______________________________ &nbsp;&nbsp; Aclaración: ______________________________</p>
  <p style="margin-top:28px">Por la Administración del Barrio: ______________________________</p>`); };
