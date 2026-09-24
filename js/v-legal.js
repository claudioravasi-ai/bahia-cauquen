/* =========================================================
   TÉRMINOS DE USO, DATOS PERSONALES Y DESLINDE DE RESPONSABILIDAD
   -------------------------------------------------------
   Se llega tocando "by Claudio A. Ravasi" al pie de la portada, o desde
   Preguntas frecuentes. El texto está acá, en un solo lugar: si cambia,
   se cambia la fecha de VERSION_LEGAL y listo.
   ========================================================= */
const VERSION_LEGAL = '24 de septiembre de 2026';

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
    'Los datos se alojan en servicios de Google LLC (Firebase y Google Apps Script), que pueden encontrarse fuera del país. Al usar la Aplicación, el Usuario presta su consentimiento libre, expreso e informado para ese tratamiento y transferencia (arts. 5 y 12 de la Ley 25.326), limitado a las finalidades de comunicación, seguridad, administración y convivencia del Barrio.',
    'Los datos sensibles (art. 2 y 7 de la Ley 25.326), como la información de salud que pudiera surgir de un pedido de auxilio, se tratan solo para atender la emergencia y no se ceden a terceros ajenos a ella.',
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
