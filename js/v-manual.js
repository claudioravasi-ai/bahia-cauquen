/* =========================================================
   MANUAL DE USO, POR SOLAPAS (pedido de Claudio, 26-09-2026)
   -------------------------------------------------------
   El mismo estilo que el manual de AFAAR: capítulos que se abren y se
   cierran (solapas), un buscador que mira también adentro del texto y un
   botón para bajarlo entero en PDF. Está en El barrio → Manual y normas
   (solapa "Manual de uso"), en las Preguntas frecuentes y en Tu cuenta.

   Escrito para cualquier vecino, sin palabras técnicas: qué tocar, en qué
   orden y qué va a pasar. REGLA: describir solo lo que la app hace de verdad
   (si algo cambia en la app, se corrige acá).

   Quién ve cada capítulo (campo `para`):
     · 'todos'    → todas las cuentas (el hotel, solo algunos);
     · 'hotel'    → el hotel y la Administración;
     · 'vecinos'  → vecinos (y quien administra, que también puede tener lote);
     · 'garita'   → la garita y la Administración;
     · 'supervisor' → la supervisión de la guardia y la Administración;
     · 'admin'    → solo la Administración.

   Cada bloque es [tipo, …]:
     ['p', texto]              párrafo
     ['h', texto]              subtítulo
     ['pasos', [..]]           pasos numerados
     ['lista', [..]]           viñetas
     ['ojo', nivel, título, texto]   recuadro (ok, info, warn, danger)
   `ir` son los botones del final del capítulo: [acción, ventana, texto].
   En los textos se puede usar {BARRIO}, {LOTE}, {CENTAVOS} y {RESIDUOS}.
   ========================================================= */
const MANUAL_CAPS = [
  { id:'empezar', icon:'sparkle', color:'brand', para:'todos', t:'Antes de empezar', s:'Qué es la app y qué hace falta', b:[
    ['p', 'La app del barrio {BARRIO} junta en un solo lugar lo que antes estaba desparramado en grupos de WhatsApp, llamadas a la garita y papeles: <b>las visitas, los mensajes privados entre vecinos, las expensas, los avisos de la guardia, el pizarrón, las votaciones</b> y la información útil de Ushuaia.'],
    ['p', 'No se baja de ninguna tienda (ni App Store ni Google Play): es una <b>página web que se instala en el teléfono</b> y queda con su ícono, como cualquier otra aplicación. Funciona en celulares, tablets y computadoras.'],
    ['h', 'Qué necesitás'],
    ['lista', ['Un celular (o computadora) con internet.', 'Un correo electrónico propio: ahí te llegan los avisos de tu inscripción.', 'Saber el número de tu lote.']],
    ['h', 'Algunas palabras que vas a leer en este manual'],
    ['lista', [
      '<b>Ventana</b>: cada pantalla de la app (por ejemplo "Mis visitas"). Se abren una encima de la otra.',
      '<b>Lomos</b>: las tiritas que quedan a la izquierda cuando abrís ventanas, una por cada ventana de atrás. Tocando un lomo volvés a esa ventana.',
      '<b>Hoja</b>: un cuadro que aparece encima para completar algo (un formulario) o leer un detalle. Se cierra con la X.',
      '<b>Campanita</b>: arriba a la derecha. Tiene los avisos que todavía no viste.',
      '<b>Pizarra del día</b>: en la portada. Lo importante del día, para todo el barrio y para vos.',
    ]],
    ['ojo', 'info', 'La app es personal, el lote es uno', 'Si en tu casa viven varias personas, cada una puede tener su propia cuenta con su correo y su contraseña. Para el barrio siguen siendo un solo lote: un voto en las votaciones y una sola expensa.'],
  ] },

  { id:'instalar', icon:'smartphone', color:'accent', para:'todos', t:'Instalar la app en el teléfono', s:'iPhone, Android y computadora', b:[
    ['p', 'Instalarla es lo que hace que la app quede con su ícono en la pantalla del teléfono, abra a pantalla completa y, sobre todo, que te lleguen los <b>avisos con el teléfono bloqueado</b> (en iPhone solo funcionan si está instalada).'],
    ['h', 'En iPhone o iPad (con Safari)'],
    ['pasos', ['Abrí el enlace de la app en <b>Safari</b> (no desde adentro de WhatsApp o del correo: si se abre ahí, tocá "Abrir en Safari").', 'Tocá el botón <b>Compartir</b> (el cuadradito con la flecha para arriba, abajo en el medio).', 'Bajá y tocá <b>"Agregar a inicio"</b> (o "Agregar a la pantalla de inicio").', 'Tocá <b>Agregar</b>. Aparece el ícono del barrio en tu pantalla.', 'Desde ahora, abrí la app <b>siempre desde ese ícono</b>.']],
    ['ojo', 'warn', 'Importante en iPhone', 'Si usás la app sin instalarla, Safari puede borrar lo guardado a los 7 días sin uso y la app te pide entrar de nuevo. Instalada, eso no pasa.'],
    ['h', 'En Android (con Chrome)'],
    ['pasos', ['Abrí el enlace de la app en <b>Chrome</b>.', 'Tocá el menú de <b>tres puntitos</b> arriba a la derecha.', 'Tocá <b>"Instalar aplicación"</b> (en algunos teléfonos dice "Agregar a la pantalla principal").', 'Confirmá con <b>Instalar</b>. Queda el ícono junto a tus otras aplicaciones.']],
    ['h', 'En la computadora'],
    ['p', 'Funciona en cualquier navegador actualizado (Chrome, Edge, Safari, Firefox). En Chrome y Edge aparece un botoncito de "Instalar" en la barra de la dirección; es opcional.'],
  ] },

  { id:'inscribirse', icon:'user', color:'ok', para:'vecinos', t:'Inscribirte y entrar', s:'Tu cuenta, paso a paso', b:[
    ['h', 'La primera vez: la inscripción'],
    ['pasos', [
      'Abrí la app y tocá <b>"Todavía no tengo cuenta"</b>.',
      'Escribí tu <b>nombre y apellido</b> como figuran en la escritura, tu <b>DNI</b> (sin puntos) y elegí <b>tu lote</b> de la lista.',
      'Elegí <b>qué sos del lote</b>: propietario/a, cotitular, <b>inquilino/a</b> (si alquilás) o familiar. Se elige una sola vez: después la cambia la Administración.',
      'Poné tu <b>correo</b> y, si querés, tu teléfono o WhatsApp.',
      'Si querés que los vecinos te encuentren por tu profesión u oficio, escribilo y marcá "Publicarlo" (es opcional y lo podés cambiar después).',
      'Elegí una <b>contraseña</b> de al menos 6 caracteres. Es solo tuya.',
      'Leé y marcá las dos casillas de privacidad y de términos de uso.',
      'Tocá <b>"Enviar mi inscripción"</b>.',
    ]],
    ['p', 'La Administración revisa que seas del lote y te habilita. Te llega un correo cuando está lista. Mientras tanto la app dice "En revisión": podés cerrarla tranquilo.'],
    ['h', 'Para entrar'],
    ['pasos', ['Escribí tu correo y tu contraseña.', 'Tocá el botón <b>Entrar</b>.']],
    ['ojo', 'info', 'Siempre con el botón Entrar', 'Por seguridad, la app entra solo cuando tocás "Entrar". Si el teléfono (por ejemplo Chrome en Android) completa solo el correo y la contraseña, la app no entra sola: te avisa "tocá Entrar". Al tocarlo aparece al instante <b>"Entrando…"</b> y, con la conexión del celular, puede tardar unos segundos en abrir tu cuenta: no hace falta tocar de nuevo.'],
    ['h', '¿Te olvidaste la contraseña?'],
    ['p', 'En la pantalla de ingreso tocá <b>"Olvidé mi contraseña"</b>: te llega un correo para elegir una nueva. Revisá también la carpeta de correo no deseado.'],
  ] },

  { id:'pantalla', icon:'grid', color:'sky', para:'todos', t:'Conocer la pantalla', s:'El encabezado, la portada y cómo moverte', b:[
    ['h', 'El encabezado (la franja de arriba)'],
    ['lista', [
      '<b>El escudo del barrio</b>: tocándolo volvés siempre a la portada y la app te saluda con la hora y el clima. Si activaste el <b>asistente por voz</b>, después del saludo le podés pedir cosas ("avisale a la garita que llego tarde", "¿cuándo pasa el camión?"). En <b>iPhone y iPad</b> el micrófono se abre solo al tocar su botón, y el "sí" de una confirmación se toca. Si no te escucha, se corta solo a los pocos segundos; tocar cualquier otra parte de la app también lo corta.',
      '<b>Tu nombre y tu lote</b>, con un <b>puntito</b>: verde es que estás conectado con el barrio; amarillo, que se está conectando; rojo, que no hay conexión (lo que hagas se manda cuando vuelva).',
      '<b>La campanita</b>: los avisos que todavía no viste, con un número.',
      '<b>Tu foto o tus iniciales</b>: abre <b>Tu cuenta</b> (contraseña, correo, modo día/noche, avisos al celular, tus datos personales, actualizar la app, cerrar sesión).',
      '<b>El botón rojo SOS</b>: para una emergencia (ver el capítulo Emergencias).',
    ]],
    ['h', 'La portada, de arriba hacia abajo'],
    ['lista', [
      'La foto del barrio, con el aviso del <b>DEA</b> (desfibrilador) que está en la garita.',
      '<b>Próximos días y Luz del día</b>: el pronóstico y una barra con la hora de salida y puesta del sol; el punto rojo es la hora actual.',
      '<b>La Pizarra del día</b>: lo importante de hoy (ver el capítulo siguiente).',
      '<b>Por dónde seguir</b>: tres puertas grandes, <b>Tu casa</b>, <b>El barrio</b> y <b>Ushuaia y servicios</b>. Adentro de cada una está todo lo demás.',
      'Al pie, dos cintas que se mueven solas: <b>Ushuaia hoy</b> y las propuestas del <b>Hotel Los Cauquenes</b>. Si las tocás se frenan.',
    ]],
    ['h', 'Cómo moverte entre ventanas'],
    ['lista', [
      'Cada vez que abrís algo, la ventana nueva se pone <b>encima</b> y a la izquierda queda un <b>lomo</b> por cada ventana de atrás. Tocá un lomo para volver ahí.',
      'El botón <b>Atrás</b> del celular (o el gesto de volver) cierra la última ventana.',
      'Las hojas (los cuadros que aparecen encima) se cierran con la <b>X</b> de arriba a la derecha.',
    ]],
    ['h', 'Actualizar lo que ves'],
    ['p', 'La app se actualiza sola cuando llega algo nuevo. Si igual querés refrescar: parado <b>arriba de todo</b> de la pantalla, deslizá el dedo hacia abajo y <b>sostenelo un segundo</b> antes de soltar.'],
  ] },

  { id:'pizarra', icon:'bell', color:'warn', para:'todos', t:'La Pizarra del día y la campanita', s:'Enterarte de todo sin buscar', b:[
    ['p', 'La <b>Pizarra del día</b> es lo primero que conviene mirar al abrir la app. Muestra en renglones cortos lo importante de hoy: avisos de la guardia y de la Administración, comunicados, el camión de la basura, el clima que complica, obras, viajes compartidos, compras conjuntas y lo que es <b>para vos</b> (tus expensas, un mensaje, una visita).'],
    ['h', 'Los colores'],
    ['lista', ['<b>Rojo</b>: importante.', '<b>Amarillo</b>: para tener en cuenta.', '<b>Verde</b>: para saber.']],
    ['p', 'Arriba está la fecha de hoy y una barra de colores que muestra cuántos avisos te faltan leer de cada color.'],
    ['p', 'Lo más importante aparece en una <b>tarjeta grande</b>, en su color y con el texto. Los demás avisos van en <b>tarjetitas</b> que se deslizan con el dedo hacia el costado (en la computadora se ven en grilla).'],
    ['p', 'Lo que todavía no leíste <b>brilla</b> en su color y tiene un <b>punto que late</b>. Al tocarlo se abre y queda quieto. Tocá <b>"Ver todo"</b> para ver la pizarra completa en dos columnas: <b>Para todo el barrio</b> y <b>Para vos</b>.'],
    ['ojo', 'info', 'Lo que pide una decisión tuya va arriba de todo', 'Si alguien pregunta por vos en la garita, si una visita te pide un pase o si tenés una alerta abierta, aparece arriba con sus botones ("Que pase", "Aprobar", "Ya está solucionado"). Eso no queda escondido en una lista.'],
    ['h', 'La campanita'],
    ['p', 'Guarda los avisos que <b>todavía no viste</b>. Al abrir uno, te lleva a donde corresponde y deja de contarse. Lo mismo si entrás directo a una conversación privada (de un vecino, de la garita o de la Administración): sus avisos se apagan solos. Con <b>"Marcar todos como vistos"</b> la vaciás de una vez.'],
  ] },

  { id:'avisos', icon:'bell', color:'ok', para:'todos', t:'Activar los avisos al celular', s:'Para enterarte con el teléfono bloqueado', b:[
    ['p', 'Los avisos al celular (también llamados "notificaciones push") te llegan <b>aunque tengas la app cerrada y el teléfono bloqueado</b>, como un mensaje de WhatsApp: el camión de la basura, <b>un correo que va a tu casa</b>, un mensaje privado, un SOS, un aviso urgente de la Administración, lo que escribe la guardia y, si usás "Estoy bien", el recordatorio de la mañana.'],
    ['pasos', [
      'En iPhone, primero <b>instalá la app</b> (capítulo "Instalar la app en el teléfono"). Sin instalar, el iPhone no los deja llegar.',
      'Tocá tu foto o tus iniciales (arriba a la derecha) para abrir <b>Tu cuenta</b> y buscá <b>"Avisos en este equipo"</b> (o tocá la tarjeta "Activá los avisos" que aparece en la portada).',
      'Tocá <b>"Activar avisos"</b>.',
      'El teléfono pregunta si permitís las notificaciones: tocá <b>Permitir</b>.',
      'Para comprobar, tocá <b>"Probar"</b> y bloqueá el teléfono: en unos segundos tiene que llegar un aviso de prueba.',
    ]],
    ['ojo', 'warn', 'Hay que hacerlo en cada equipo', 'Si usás la app en el celular y en la computadora, activalos en los dos. Si los bloqueaste sin querer, se habilitan desde la configuración del teléfono o del navegador: permisos del sitio → Notificaciones → Permitir.'],
  ] },

  { id:'emergencias', icon:'siren', color:'danger', para:'vecinos', t:'Emergencias: SOS y DEA', s:'Qué hacer cuando algo pasa', b:[
    ['h', 'El botón SOS'],
    ['pasos', [
      'Tocá y <b>mantené apretado</b> el botón rojo <b>SOS</b> de arriba a la derecha durante <b>3 segundos</b>. El botón se va llenando de rojo y cuenta 3, 2, 1. (Si soltás antes, no se manda nada: así no sale solo desde el bolsillo.)',
      'Elegí qué pasa: <b>emergencia médica</b>, <b>seguridad / intrusión</b>, <b>incendio</b> u <b>otra</b>.',
      'La alerta salta con sonido en la garita, en la Administración y en las apps abiertas de los vecinos, con tu nombre, tu lote y, si el teléfono lo permite, dónde estás (GPS).',
      'Llamá también al número que te muestra la pantalla (107 ambulancia, 101 policía, 100 bomberos, 911).',
      'Cuando todo esté bien, tocá <b>"Ya está solucionado"</b>. Recién ahí la alerta se cierra para todo el barrio.',
    ]],
    ['p', '"Ocultar" saca el cartel de tu pantalla, pero la alerta sigue abierta: la encontrás en la campanita.'],
    ['h', 'Si te llega el SOS de otro vecino'],
    ['p', 'Aparece un cartel rojo con quién la pidió, el lote y "Dónde está pasando". Seguí lo que indica el cartel (por ejemplo, no bloquear la calle). Tocá <b>"Entendido"</b> para cerrarlo.'],
    ['h', 'Pedir el DEA (desfibrilador)'],
    ['pasos', [
      'En la foto de la portada, arriba a la derecha, tocá el <b>corazón que late</b> ("DEA operativo en la garita"): se abre <b>Emergencias</b>.',
      'Al lado del corazón rojo, <b>mantené apretado 2 segundos</b> el botón verde <b>SOLICITARLO</b>.',
      'Contestá <b>SÍ</b>. A la garita le salta una alarma con tu apellido y tu lote hasta que sale con el DEA; a vos te avisa cuando va en camino.',
      'Cuando la garita toca "Voy en camino con el DEA", con ese mismo toque les llega un aviso a los <b>vecinos del equipo de salud o con RCP</b>. Si alguno va, lo ves en Emergencias ("También va…").',
      'Llamá además al <b>911</b> o al <b>107</b>.',
    ]],
    ['h', 'Si sos del equipo de salud o sabés RCP'],
    ['pasos', [
      'En <b>Tu casa → Mi casa</b>, tildá <b>"Sé primeros auxilios / RCP o soy del equipo de salud"</b> y elegí qué sos (médico/a, enfermero/a, paramédico/a, curso de RCP…). Guardá.',
      'Cuando la garita sale con el DEA hacia un lote, te salta una pantalla roja <b>"Emergencia médica"</b> con el lote, la dirección y "Cómo llegar" (y un aviso al celular si lo tenés activado).',
      'Tocá <b>VOY</b> si podés ir: la garita y el vecino ven tu nombre, tu profesión y tu teléfono. Si no podés, <b>"No puedo ir"</b>.',
    ]],
    ['h', 'Teléfonos'],
    ['p', 'A Emergencias se entra tocando el corazón que late del DEA, en la foto de la portada. Ahí están, a un toque, el 911, el 107, el 100, el 101, la garita, la Administración, hospitales y farmacias. Tocar un número lo llama.'],
  ], ir:[['abrir', 'emergencias', 'Ir a Emergencias']] },

  { id:'visitas', icon:'qr', color:'brand', para:'vecinos', t:'Autorizar una visita', s:'Código y QR para la garita, y los Uber o DiDi', b:[
    ['pasos', [
      'Entrá a <b>Tu casa → Autorizar una visita</b>.',
      'Elegí quién viene: visita, delivery, proveedor u obra, personal fijo o Uber, DiDi o taxi (este último abre un aviso más corto: ver abajo).',
      'Escribí el <b>nombre</b> (o la empresa). El DNI y la patente son opcionales, pero ayudan a la guardia.',
      'Poné el <b>día</b> y el <b>horario</b> en que viene.',
      'Si viene <b>varias veces</b> (empleada, jardinero, personal de una obra), marcá "Viene varias veces", elegí los días y hasta qué fecha: es <b>un solo QR</b> para todos esos días.',
      'Si querés, dejá una nota para la guardia (por ejemplo "deja la caja en la puerta").',
      'Tocá <b>"Crear el pase"</b>. Aparece el pase con un <b>código de 6 números</b> y un <b>QR</b>.',
      'Tocá <b>"Enviar por WhatsApp"</b> y elegí el contacto: le llega <b>en el mismo mensaje la imagen del QR con el código</b> y el texto con los datos y "Cómo llegar". En la garita muestra el QR o dicta el código. (Desde la computadora, la imagen se baja y la adjuntás en el WhatsApp que se abre.)',
    ]],
    ['p', 'La garita lo ve al instante, con tu nombre como quien autorizó. Cuando la visita entra y cuando sale, te llega un aviso.'],
    ['h', 'Mis visitas'],
    ['p', 'En <b>Tu casa → Mis visitas</b> ves las de hoy y las próximas. Cada una se puede ver, reenviar, <b>editar</b>, <b>cancelar</b> o sacar de tu lista. Las visitas viejas no se pierden: pasan a tu historial ("Ver mi historial completo").'],
    ['h', 'Alguien llegó sin avisar'],
    ['p', 'Si alguien se presenta en la garita preguntando por vos, te aparece arriba de todo con sonido: tocá <b>"Que pase"</b> o <b>"No lo conozco"</b>. La guardia ve tu respuesta al instante.'],
    ['h', 'Viene un Uber, DiDi, Cabify o taxi'],
    ['pasos', [
      'Cuando pedís el viaje, entrá a <b>Tu casa → Autorizar una visita</b> y en "¿Quién viene?" tocá <b>"Uber, DiDi o taxi"</b>: se abre el aviso corto. (Si te equivocaste, "Es otro tipo de visita" te devuelve al pase común.)',
      'Elegí la app, si te viene a <b>buscar</b> o <b>trae</b> a alguien o algo, y en cuánto llega.',
      'Poné la <b>patente</b>: la muestra la app apenas el chofer acepta. Si todavía no la sabés, avisá igual y agregala después con <b>"Agregar la patente"</b>.',
      'La garita lo ve al instante y lo reconoce por la patente. Cuando entra y cuando sale, te llega el aviso. El aviso vence solo una hora después de la hora de llegada.',
    ]],
    ['p', 'Si no avisaste, el chofer entra como "Llegó sin aviso": la garita te pregunta y vos contestás "Que pase" o "No lo conozco".'],
    ['h', 'Si el pase vence'],
    ['p', 'Pasada la hora del pase, la garita ya no puede registrar el ingreso con ese pase. Si la persona llega tarde, la garita te pregunta ("Que pase" / "No lo conozco"); si no vino, te avisa que venció, y lo podés editar con otro horario desde Mis visitas.'],
  ], ir:[['nuevo-pase', '', 'Autorizar una visita'], ['abrir', 'visitas', 'Mis visitas']] },

  /* PAQUETES EN PAUSA (30-09-2026): el barrio no aprobó que la garita reciba
     correo ni paquetes. El capítulo queda guardado y no se muestra mientras
     hayPaquetes() (core.js) sea falso. */
  { id:'paquetes', activo: hayPaquetes, icon:'box', color:'wood', para:'vecinos', t:'Paquetes', s:'Cuándo llegan, la foto y cómo retirarlos', b:[
    ['h', 'Cuando llega un paquete'],
    ['p', 'La garita lo registra con la empresa, un detalle y una foto. En ese momento <b>les llega el aviso a todas las cuentas de tu lote</b> (si en tu casa viven dos personas con la app, se enteran las dos), con sonido y en el celular aunque esté bloqueado si activaste los avisos.'],
    ['p', 'Además queda en la <b>Pizarra del día, en "Para vos"</b>, hasta que alguien del lote lo retira.'],
    ['p', 'Si pasan <b>24 horas</b> y nadie lo retiró, vuelve a llegar el aviso al celular (cada 8 horas, de 9 a 21) <b>hasta que alguien del lote abre "Mis paquetes"</b>.'],
    ['h', 'Ver la foto del paquete'],
    ['p', 'En <b>Tu casa → Mis paquetes</b> se ve una vista previa chiquita. <b>Tocala</b> para ver la foto buena; desde ahí la podés <b>guardar en tu teléfono</b>. La foto buena no se baja sola: así la app no se pone lenta. Cuando el paquete se entrega, la foto se borra de la base del barrio.'],
    ['h', 'Retirarlo con tu QR de retiro'],
    ['pasos', [
      'Andá a la garita con tu teléfono.',
      'Abrí <b>Tu casa → Mis paquetes</b> y tocá <b>"Mi QR para retirar"</b>.',
      'Mostrale la pantalla al guardia. El QR <b>cambia cada 30 segundos</b>: es la prueba de que sos vos.',
      'El guardia lo lee y te entrega. En tu teléfono aparece "¡Listo!" y te llega el aviso "Retiraste tu paquete".',
    ]],
    ['ojo', 'warn', 'No sirve una captura ni reenviarlo', 'El QR de retiro sale solo de tu teléfono y vence enseguida. Una foto o una captura de pantalla no sirven. La credencial del barrio tampoco sirve para retirar paquetes.'],
    ['h', 'Sin el teléfono'],
    ['p', 'Podés retirarlo con tu <b>DNI y tu firma</b> en la pantalla de la garita. Si lo retira otra persona (un familiar, alguien que trabaja en tu casa), la garita anota su nombre y DNI, y a vos te llega el aviso de quién lo retiró.'],
    ['p', 'En "Mis teléfonos habilitados" ves en qué equipos abriste tu QR de retiro. Si perdiste uno, sacalo de la lista: su QR deja de valer.'],
    ['h', 'Los ya retirados y el historial'],
    ['p', 'En Mis paquetes, "Ya retirados" muestra los de los <b>últimos 30 días</b>. Los anteriores no se pierden: pasan al archivo del barrio (sin la foto, sin la firma y sin el DNI) y los traés cuando quieras con el botón <b>"Paquetes anteriores"</b>.'],
  ], ir:[['abrir', 'mis-paquetes', 'Mis paquetes']] },

  { id:'alquiler', icon:'key', color:'sky', para:'vecinos', t:'Lote alquilado: inquilino y propietario', s:'Quién maneja el día a día y qué ve el dueño', b:[
    ['p', 'Cuando un lote se alquila, <b>el día a día es de quien vive ahí</b>. El lote queda "alquilado" solo: en cuanto la Administración aprueba a alguien que se inscribió como <b>Inquilino/a</b> de ese lote.'],
    ['h', 'Si sos inquilino/a'],
    ['lista', [
      'Tenés la app completa: la garita te consulta a vos, autorizás las visitas, te llegan los correos y los paquetes, el SOS, "Estoy bien", Me voy de viaje y la Pizarra del día.',
      'Tu familia se inscribe como <b>Familiar o conviviente</b> del mismo lote y también tiene la app completa.',
      'En <b>Mi casa</b> ves quién es el propietario y le podés escribir en privado.',
      'Las expensas las ven los dos. Vota el propietario, salvo que te dé una <b>carta poder</b> (la cargás en Mi casa).',
    ]],
    ['h', 'Si sos el propietario y no vivís en el lote'],
    ['p', 'Te llega el aviso <b>"Tu lote figura alquilado"</b> y tu portada pasa a ser la de <b>propietario/a a distancia</b>: expensas del lote, votaciones, comunicados de la Administración, las cuentas del barrio, normas, mensajes con la Administración y <b>"Escribirle a tu inquilino"</b>.'],
    ['p', 'No ves el día a día ni te llegan sus avisos (la garita, el camión, los correos, el SOS), y no autorizás visitas a una casa donde no vivís. Al celular te llegan solo las votaciones, las expensas y los comunicados.'],
    ['p', 'Si no vivís en el barrio pero no hay inquilino con cuenta (casa vacía, o un inquilino sin la app), en <b>Mi casa</b> tocá <b>"No vivo en el lote"</b>. Si volvés a vivir ahí, en <b>Mi lote</b> tocá <b>"Vivo en el lote"</b>.'],
    ['ojo', 'info', 'Cuando termina el alquiler', 'La Administración da de baja la cuenta del inquilino y el lote vuelve solo a ser del propietario: te llega el aviso y recuperás la app completa.'],
  ], ir:[['abrir', 'perfil', 'Mi casa']] },

  { id:'correos', icon:'mail', color:'sky', para:'vecinos', t:'Correos en el barrio', s:'El camión de cada correo y el aviso "va a tu casa"', b:[
    ['p', 'Cuando entra un correo (Correo Argentino, Andreani, OCA, OCASA, Mercado Libre u otro), la garita lo registra. Desde ese momento, a todos les <b>cruza por la pantalla un camión de correo</b> con los colores y el logo de esa empresa, con una bocina corta al entrar. Sigue pasando <b>hasta que la garita registra la salida</b>. Si hay varios adentro, pasan varios.'],
    ['h', 'Si va a tu casa'],
    ['p', 'Si el correo le dice a la garita a qué casa va, a todas las cuentas de tu lote les llega <b>"Andreani va a tu casa"</b> (o la empresa que sea): al celular <b>como un WhatsApp</b>, aunque tengas la pantalla apagada, la app cerrada o la sesión cerrada (si activaste los avisos en ese equipo). Con la app abierta suena un aviso y su camión dice <b>"VA A TU CASA"</b>.'],
    ['p', 'Si no hay nadie en casa, avisale a la garita. Cuando el correo sale del barrio, el aviso se va solo.'],
    ['h', 'Lo que podés elegir'],
    ['lista', [
      'En <b>El barrio → Correos en el barrio</b> ves qué correo está adentro y los que ya pasaron hoy.',
      '<b>Ver los camiones de correo</b>: si lo apagás, solo ves los que van a tu casa.',
      'La <b>X</b> del cartelito lo oculta en ese equipo hasta que entre otro correo.',
      '<b>Escuchar la bocina</b> y <b>el aviso de "va a tu casa"</b>, para reconocerlos.',
    ]],
    ['ojo', 'info', 'Quién ve qué', 'Todos ven solo qué correo está en el barrio y a qué hora entró. A qué lotes va y la patente quedan en el libro de guardia, que ven la garita, la Administración y la supervisión. El aviso "va a tu casa" lo recibe solo tu lote.'],
  ], ir:[['abrir', 'mensajeria', 'Correos en el barrio']] },

  { id:'expensas', icon:'wallet', color:'wood', para:'vecinos', t:'Tus expensas', s:'Ver, pagar y avisar un pago', b:[
    ['p', 'En <b>Tu casa → Mis expensas</b> está la cuenta de tu lote: el cupón del mes, el saldo, los vencimientos, los pagos y los recibos. Es la misma para todas las cuentas del lote.'],
    ['h', 'Los vencimientos'],
    ['p', 'La tarjeta de arriba muestra el <b>1.º y el 2.º vencimiento</b> y cuántos días faltan. En la Pizarra del día, en "Para vos", aparece un reloj con tus vencimientos: el día del 2.º vencimiento se pone rojo y titila. Solo lo ves vos (y los de tu lote).'],
    ['ojo', 'info', 'Los centavos son tu número de lote', 'El total de cada cupón termina en los centavos de tu lote{CENTAVOS}. Así la Administración reconoce tu transferencia aunque no pongas ninguna referencia.'],
    ['h', 'Pagar'],
    ['pasos', [
      'Tocá la tarjeta de pago (o <b>"Pagar las expensas"</b>).',
      'Elegí cómo: <b>pagar online</b> (cuando la Administración lo tiene activado: tarjeta, Mercado Pago o QR de tu banco, y el recibo sale solo), <b>transferencia</b> (alias, CBU e importe listos para copiar) o <b>efectivo</b> en la Administración.',
    ]],
    ['ojo', 'ok', 'Mientras no esté el pago online: "Ya la pagué"', 'Hasta que la Administración active Mercado Pago, al tocar la tarjeta de pago aparece arriba el botón verde <b>"Ya la pagué · marcarla como pagada"</b>. Si ya transferiste o depositaste, tocalo y contestá "Sí, ya pagué": tu expensa queda <b>Pagada</b> y no te llegan más recordatorios. La Administración la confirma con el banco (los centavos dicen tu lote) y después te llega el recibo. El comprobante, en ese caso, es optativo.'],
    ['h', 'Si pagaste por fuera de la app'],
    ['pasos', [
      'Tocá <b>"Ya pagué por fuera de la app"</b>.',
      'Poné el importe y la fecha, y adjuntá el comprobante (PDF, foto o captura).',
      'El pago queda <b>"por acreditar"</b>. Cuando la Administración lo confirma, te llega el <b>recibo</b>.',
    ]],
    ['p', 'Lo que pagás con "Pagar online ahora" no hace falta avisarlo: se descuenta solo.'],
    ['h', 'Consultas sobre tus expensas'],
    ['p', 'Al final de Mis expensas, <b>"Consultar a la Administración"</b> abre una conversación privada <b>solo con la Administración</b> (planes de pago, diferencias, dudas). La garita no la ve y no hay que elegir a quién mandarla.'],
    ['h', 'Las cuentas del barrio'],
    ['p', 'En <b>El barrio → Las cuentas del barrio</b> ves en qué se gasta mes a mes y la morosidad general, sin nombres.'],
  ], ir:[['abrir', 'expensas', 'Mis expensas']] },

  { id:'mensajes', icon:'chat', color:'accent', para:'vecinos', t:'Mensajes, peticiones y reclamos', s:'Hablar con la Administración, la garita y los vecinos', b:[
    ['h', 'Mensajes privados'],
    ['p', 'En <b>Tu casa → Mensajes</b> están tus conversaciones privadas:'],
    ['lista', [
      '<b>Administración o Guardia</b>: tocalo y arriba elegís con quién. Con la Administración, solo la leen vos y la Administración; con la Guardia, solo vos y la garita. Si alguna te escribió, el cartel dice cuántos mensajes sin leer tenés de cada una.',
      '<b>Con otro vecino</b>: solo lo leen ustedes dos.',
    ]],
    ['h', 'Escribirle a uno o varios vecinos'],
    ['pasos', [
      'Entrá a <b>Tu casa → Mensajes</b> y tocá <b>"Buscar un vecino y escribirle"</b>.',
      'Quien es de la Administración y vive en un lote aparece como vecino de su lote: le podés escribir como a cualquier vecino (para temas de la Administración, usá el canal "Administración").',
      'Si en un lote hay varias cuentas, <b>"Todo el lote"</b> las tilda a todas de un toque; o tildá solo a quién querés (en un lote de cuatro, a dos: los otros dos no lo reciben).',
      'Buscá por apellido, nombre, oficio o número de lote y <b>tildá</b> a quién le querés escribir: uno, dos o hasta diez vecinos.',
      'Escribí el mensaje una sola vez y tocá <b>Enviar</b>.',
      'A cada uno le llega <b>por separado</b>, en su chat privado con vos. Cada uno te contesta en su propia conversación, que ves en Mensajes.',
    ]],
    ['ojo', 'info', 'No es un grupo', 'Ninguno ve a quién más le mandaste el mensaje ni lo que te contestan los otros. El barrio no quiso un chat de muchos: esto es siempre de a dos. Solo aparecen los vecinos que ya usan la app; para algo que es de todo el barrio está el pizarrón.'],
    ['h', 'Peticiones a la garita (con firma)'],
    ['p', 'Para pedidos que conviene dejar por escrito: <b>no dejar pasar a alguien</b>, avisar que <b>te vas de viaje</b>, dejar o retirar una llave, un permiso especial de ingreso.'],
    ['pasos', ['Entrá a <b>Tu casa → Peticiones a la garita</b> y tocá "Nueva petición".', 'Elegí el tipo, escribí el pedido y las fechas.', '<b>Firmá con el dedo</b> en el recuadro y tocá "Firmar y enviar".', 'El guardia la recibe y la firma. Te llega el aviso de que está "en funciones".']],
    ['p', 'Cada petición guarda las dos firmas, la hora y un sello digital que prueba que nadie la cambió.'],
    ['h', 'Reclamos'],
    ['p', 'En <b>Tu casa → Mis reclamos</b>. Son privados: los ven vos y la Administración, que te contesta por ahí. Si el problema es de varios, la Administración puede publicarlo en el pizarrón.'],
  ], ir:[['abrir', 'mensajes', 'Mensajes'], ['abrir', 'peticiones', 'Peticiones'], ['abrir', 'reclamos', 'Mis reclamos']] },

  { id:'micasa', icon:'home', color:'ok', para:'vecinos', t:'Mi casa y mi credencial', s:'Tus datos, quiénes están en tu lote, autos y mascotas', b:[
    ['p', 'En <b>Tu casa → Mi casa</b> cargás lo que le sirve a la guardia y al barrio. Todo es opcional y lo cambiás cuando quieras:'],
    ['lista', [
      'Tu relación con el lote (propietario, cotitular, inquilino, familiar). Se elige una sola vez; si cambió, se lo pedís a la Administración. Si sos inquilino y el propietario te da una carta poder, la subís para poder votar.',
      'Si sos propietario y no vivís en el lote: <b>"No vivo en el lote"</b> (capítulo "Lote alquilado").',
      'Tu teléfono o WhatsApp, tu profesión u oficio (y si querés mostrarlos al barrio).',
      'Quiénes viven en la casa, la dirección y la ubicación exacta (sirve para "Cómo llegar" en una emergencia).',
      '<b>Tus autos</b> con la patente: la garita los reconoce.',
      '<b>Tus mascotas</b>, con foto.',
      '<b>La foto del frente de tu casa</b>: la usa la garita para ubicar tu domicilio.',
      '<b>Me voy de viaje</b>: tu casa entra en la lista de "casas solas" de la garita. La garita o el policía de la ronda nocturna la revisa <b>una vez por día</b> y te llega el aviso <b>"Tu casa está en orden"</b> (o la novedad, si hay una). Lo ven solo la garita, la Administración y las cuentas de tu lote. Si usás "Estoy bien", queda en pausa hasta que volvés. "Ya volví" termina el aviso.',
      '<b>Sé primeros auxilios / RCP o soy del equipo de salud</b>, y qué sos: te avisamos cuando un vecino pide ayuda médica o la garita sale con el DEA.',
    ]],
    ['h', 'Quiénes están en tu lote'],
    ['p', 'Al final de Mi casa ves <b>todas las cuentas anotadas en tu mismo lote</b>: tu familia, con su relación con el lote (propietario, cotitular, inquilino, familiar), si tiene la app abierta ahora y si alguien está <b>esperando aprobación</b> para entrar en tu lote. Ni DNI ni correo ni teléfono.'],
    ['p', 'Si ves a alguien que no vive en tu casa, tocá <b>"No es de mi lote"</b>: le avisamos a la Administración para que lo revise, y a esa persona (sin tu nombre) para que confirme su lote.'],
    ['p', 'La contraseña, el correo, el modo de pantalla, los avisos al celular, "Mis datos personales" y cerrar sesión están en <b>Tu cuenta</b> (tu inicial, arriba a la derecha), no en Mi casa.'],
    ['h', 'Mi credencial'],
    ['p', 'En <b>Tu casa → Mi credencial</b> tenés un QR personal. Sirve para que la garita sepa en un segundo que sos del barrio y de qué lote, <b>sin que tengas que mostrar el DNI</b>. Te sirve sobre todo cuando la guardia no te reconoce:'],
    ['lista', [
      'Llegás en un auto que no es el tuyo: taxi, remís, Uber, uno prestado, alquilado o del taller (la patente no figura como tuya).',
      'Llegás caminando o en bici.',
      'Sos nuevo en el barrio, inquilino o familiar, y todavía no te conocen.',
      'En la garita hay un guardia de reemplazo.',
    ]],
    ['pasos', ['Abrí <b>Tu casa → Mi credencial</b>.', 'Mostrale el QR al guardia: lo escanea (o escribe el código que está abajo).', 'La garita ve tu nombre, tu lote, las patentes de tus autos y, si la cargaste, la foto del frente de tu casa. Nada más.']],
    ['ojo', 'info', 'Lo que la credencial no hace', 'No abre el portón, no anota tus entradas ni tus salidas y no lleva tu DNI. Si la guardia ya te conoce, no hace falta mostrarla. Cada cuenta de tu lote tiene la suya; si alguien la copió, tocá "Generar una credencial nueva" y la anterior deja de valer.'],
  ], ir:[['abrir', 'perfil', 'Mi casa'], ['mi-credencial', '', 'Mi credencial']] },

  { id:'estoybien', icon:'heart', color:'ok', para:'vecinos', t:'Estoy bien (si vivís solo o sola)', s:'Un toque por día y alguien de confianza se entera', b:[
    ['p', 'Es una idea de Japón, donde muchas personas mayores viven solas. <b>Una vez por día tocás el botón verde "ESTOY BIEN"</b> de la portada. Si a la hora que elegiste no lo tocaste, la app avisa a <b>la garita</b> y a <b>la Administración</b> (siempre), a <b>tus familiares</b> por correo y a las <b>personas del barrio que elijas</b>, para que te llamen o pasen a ver. El resto del barrio no se entera.'],
    ['h', 'Activarlo'],
    ['pasos', [
      'Entrá a <b>Tu casa → Estoy bien</b> y tocá <b>"Quiero usar Estoy bien"</b>.',
      'Elegí <b>hasta qué hora</b> avisar cada día (por ejemplo, las 10).',
      'Anotá a <b>tus familiares</b> (hasta 3) con su correo y su teléfono. La garita y la Administración ya están incluidas.',
      'Si querés, elegí <b>hasta 3 personas del barrio</b> (un familiar que vive acá o un vecino de confianza). A cada una le llega un aviso para que acepte.',
      'Aceptá la casilla de privacidad y tocá <b>"Activar"</b>.',
    ]],
    ['h', 'Cada día'],
    ['lista', [
      'En la portada, arriba de todo, está el botón verde <b>ESTOY BIEN</b>, latiendo hasta que lo tocás. Después queda "Hoy ya avisaste que estás bien".',
      '<b>Una hora antes</b> de tu hora te llega un recordatorio al celular ("¿Estás bien?"). <b>Tocarlo ya cuenta</b> como aviso.',
      'Si pasa tu hora sin aviso, les llega a la garita, a la Administración y a las personas que elegiste (con sonido), y a tus familiares por correo. Si una hora después nadie lo resolvió, se insiste una vez.',
      'Si te olvidaste, tocá el botón igual: les llega que ya estás bien.',
    ]],
    ['h', 'Viajes y pausas'],
    ['p', 'Si te vas unos días, tocá <b>"Pausar unos días"</b>. Con <b>Mi casa → Me voy de viaje</b> se pausa solo hasta que volvés. <b>"Dejar de usar Estoy bien"</b> borra todo.'],
    ['h', 'Si alguien del barrio te eligió'],
    ['pasos', [
      'Te llega "… te eligió para avisarte". En <b>Estoy bien</b> tocá <b>Acepto</b> (o "No puedo", y se le avisa; la garita y la Administración lo siguen cuidando).',
      'Si un día no avisa, te llega un aviso con sonido y en la portada aparece en rojo. Llamalo/a (botón <b>Llamar</b>) o pasá a ver.',
      'Cuando sepas que está bien, tocá <b>"Ya hablé: está bien"</b>: a los demás contactos les llega que ya está resuelto. Si no contesta, <b>"Pedir a la garita que pase"</b>.',
    ]],
    ['ojo', 'info', 'Quién lo ve', 'Solo vos, la garita, la Administración y las personas del barrio que elegiste. Tus familiares reciben el aviso por correo. El resto del barrio no. Ven tu nombre, tu lote, tu teléfono y a qué hora avisaste.'],
  ], ir:[['abrir', 'estoy-bien', 'Ir a Estoy bien']] },

  { id:'salidas', icon:'pin', color:'sky', para:'vecinos', t:'Salidas seguras (agua y montaña)', s:'La guía de verano y el aviso de salida', b:[
    ['p', 'Está en <b>Tu casa → Salidas seguras</b>: los teléfonos (911, 106 Prefectura, 100, 103, 107), el <b>aviso de salida</b> y una guía de seguridad para kayak, navegación, trekking, escalada, pesca, fuego, sol y fauna, con lo que se hace en otros lugares del mundo.'],
    ['h', 'El aviso de salida'],
    ['pasos', [
      'La primera vez, anotá a tus familiares (con correo y teléfono), elegí si querés hasta 3 personas del barrio y aceptá la casilla. La garita y la Administración ya están incluidas.',
      'Tocá <b>"Voy a salir"</b>: qué vas a hacer, a dónde, con quién, a qué hora volvés y cuánto esperar antes de avisar.',
      'Mientras estás afuera, el botón verde <b>Volví</b> te espera en tres lugares: <b>arriba de todo en la portada</b> ("Estás de salida"), <b>arriba en Tu casa</b> y en <b>Salidas seguras</b>. Si se pasa la hora, además te llega un aviso al celular ("¿Ya volviste?") para tocarlo.',
      'Si no lo tocás a tiempo, se avisa a la garita, a la Administración, a las personas que elegiste y a tus familiares, con los datos de la salida.',
    ]],
    ['p', 'La garita y la Administración ven las <b>salidas en curso</b> en esa misma ventana. De noviembre a marzo, el 1.º de cada mes llega un recordatorio con un consejo de temporada.'],
    ['ojo', 'warn', 'Es una ayuda entre vecinos', 'No reemplaza avisar a Prefectura ni a los guardaparques cuando corresponde, ni un equipo de comunicación propio (handy VHF, radiobaliza).'],
  ], ir:[['abrir', 'salidas', 'Ir a Salidas seguras']] },

  { id:'sismo', icon:'sismo', color:'warn', para:'vecinos', t:'Preparados para un sismo', s:'Mochila de emergencia, plan familiar y qué hacer', b:[
    ['p', 'Tierra del Fuego es zona sísmica: el barrio está cerca del sistema de fallas Magallanes–Fagnano. En <b>Tu casa → Preparados para un sismo</b> está lo que recomiendan Defensa Civil de Ushuaia y los protocolos internacionales.'],
    ['h', 'La revisión de cada domingo'],
    ['pasos', [
      'Los domingos a las 10 llega a todo el barrio el recordatorio <b>"Domingo de revisión: tu mochila de emergencia"</b>.',
      'Fijate que esté todo (agua, comida, linterna y pilas, radio, abrigo, botiquín, batería cargada) y tocá el botón naranja <b>REVISIÓN SEMANAL</b> → <b>"Listo, revisado"</b>.',
      'Mientras no la hagas, queda en <b>"Para vos"</b> de la pizarra. Es del lote: si la marca otra persona de tu casa, vale para todos.',
    ]],
    ['h', 'La mochila de emergencia'],
    ['p', 'Una lista de 13 cosas. Tocá el círculo de cada una cuando la tengas o la renueves: la app se acuerda de la fecha y te avisa cuando toca renovarla (el agua y la comida, cada 6 meses; la batería, cada mes).'],
    ['h', 'El plan familiar y el simulacro'],
    ['lista', [
      '<b>Armar el plan</b>: punto de encuentro, un contacto fuera de Tierra del Fuego, dónde están las llaves de corte (gas, luz, agua), los lugares seguros de la casa y quién se ocupa de qué. Se puede <b>imprimir para la heladera</b>.',
      '<b>Es de toda la casa</b>: todas las cuentas de tu lote entran solas en el plan (arriba dice "En este plan: …"). Cualquiera lo ve y lo cambia, y cuando alguien lo arma o lo cambia, a los demás les llega el aviso (campanita, celular y "Para vos") con qué cambió.',
      '<b>Sugerir un cambio</b>: si algo no te cierra, escribilo en "Sugerir un cambio" y les llega a los demás de la casa. Quien lo pasa al plan toca <b>"Hecho"</b>. Cada uno puede borrar sus propias sugerencias.',
      '<b>Hacer un simulacro</b>: un minuto guiado (agacharse, cubrirse y sujetarse; después, salir al punto de encuentro). Conviene uno cada 6 meses.',
    ]],
    ['h', 'Qué hacer'],
    ['p', 'Durante: <b>agachate, cubrite y sujetate</b>, lejos de ventanas; no salgas corriendo mientras tiembla. Después: calzado y abrigo, si hay olor a gas cerrá la llave y salí, tomá la mochila y andá al punto de encuentro; mensajes, no llamadas. En la costa, si el sismo fue fuerte, alejate del agua hacia un lugar alto. Defensa Civil: <b>103</b> (da capacitaciones gratuitas).'],
  ], ir:[['abrir', 'sismo', 'Preparados para un sismo'], ['abrir', 'sismos', 'Sismos en vivo']] },

  { id:'temporadas', icon:'snow', color:'sky', para:'vecinos', t:'Invierno y verano', s:'Tu casa en invierno y en verano, ángeles de la nieve y salidas seguras', b:[
    ['h', 'Tu casa en invierno'],
    ['p', 'En <b>Tu casa → Tu casa en invierno</b> está la lista de lo que conviene revisar antes y durante el invierno: pilas del detector de monóxido, gas, rejillas, chimenea, caldera, canaletas, caños de afuera, techo, pala y sal, matafuego, cortes de luz, cubiertas y leña. Cada una dice por qué y cómo.'],
    ['lista', [
      'Tocá <b>"Lo hice"</b> cuando lo hagas: la app se acuerda de la fecha y te lo vuelve a recordar cuando toque (cada 6 meses o una vez por año).',
      '"Recordame en una semana" lo saca de la pizarra por siete días.',
      'De marzo a agosto, lo que toca aparece en <b>"Para vos"</b> de la pizarra. El 1.º de abril, mayo, junio, julio y agosto llega además un recordatorio para todo el barrio.',
      'Es de tu lote: lo ven y lo marcan todas las cuentas de tu lote, nadie más.',
    ]],
    ['h', 'Ángeles de la nieve'],
    ['p', 'Una idea de Canadá. En <b>El barrio → Ángeles de la nieve</b>:'],
    ['lista', [
      '<b>Si podés palear</b>: "Me anoto como ángel" y adoptá una casa por la temporada ("La adopto esta temporada"). Cuando nieva te llega el aviso; al terminar, "Listo, despejada".',
      '<b>Si no podés</b>: "Necesito ayuda con la nieve" y una nota (por ejemplo, "la rampa del garaje"). Cuando un ángel te adopta, te avisa. Un día que lo necesites, "Hoy necesito que despejen mi entrada".',
      'Lo ven los vecinos de la app: tu lote, tu nombre de pila y tu nota. No pongas datos de salud.',
    ]],
    ['h', 'Tu casa en verano'],
    ['p', 'En <b>Tu casa → Tu casa en verano</b> está lo que hace falta para que la casa y el barrio estén lindos y seguros de noviembre a marzo. De octubre a marzo aparece antes que la de invierno.'],
    ['lista', [
      '<b>Para anotar</b> (con "Lo hice", como en invierno): el pasto (cada 15 días en temporada), la vereda y el cordón (cada semana), el cesto de residuos alto y con tapa, la poda de ramas, la leña para el invierno que viene y los arreglos de afuera (una vez por año).',
      '<b>Todo el verano</b> (consejos): las bolsas recién la mañana que pasa el camión, nada suelto con el viento (cama elástica, reposeras, invernadero), el fuego con cuidado (asado solo en parrilla, brasas apagadas con agua, nada de quemar pasto), el sol aunque esté fresco, las mascotas dentro del lote, el riego y qué hacer si te vas de vacaciones o salís al agua o a la montaña.',
      'Lo de una vez por año aparece en <b>"Para vos"</b> de la pizarra cuando toca, y el 15 de noviembre, diciembre, enero y febrero llega un recordatorio para todo el barrio.',
      'Es de tu lote, como invierno: lo ven y lo marcan solo las cuentas de tu lote.',
    ]],
    ['h', 'Salidas seguras (verano)'],
    ['p', 'Tiene su propio capítulo: "Salidas seguras (agua y montaña)".'],
  ], ir:[['abrir', 'invierno', 'Tu casa en invierno'], ['abrir', 'verano', 'Tu casa en verano'], ['abrir', 'nieve', 'Ángeles de la nieve'], ['abrir', 'salidas', 'Salidas seguras']] },

  { id:'cosas', icon:'box', color:'wood', para:'vecinos', t:'Cosas para prestar', s:'La biblioteca de cosas del barrio', b:[
    ['p', 'Una idea de los Países Bajos: en vez de que cada casa compre una hidrolavadora que usa dos veces por año, los vecinos se la prestan. Está en <b>El barrio → Cosas para prestar</b>.'],
    ['h', 'Pedir algo prestado'],
    ['pasos', [
      'Buscá en la lista (o por categoría) y tocá <b>"Pedirla"</b>.',
      'Elegí desde y hasta cuándo, y escribí un mensaje. Le llega al dueño por <b>mensaje privado</b> (nadie más lo ve) y se abre la conversación.',
      'El dueño te contesta por el mismo mensaje y combinan la entrega.',
    ]],
    ['h', 'Ofrecer algo'],
    ['pasos', [
      'Tocá <b>"Sumar algo para prestar"</b>. Hay sugerencias de lo más común (tocá una para completar), o escribí lo tuyo con un detalle y tus condiciones.',
      'Cuando la prestes, en los tres puntitos: <b>"La presté"</b> (a qué lote y hasta cuándo). Los vecinos ven "Prestada hasta…", no a quién.',
      'Cuando vuelva, <b>"Me la devolvieron"</b>. Si se pasó la fecha, te lo recordamos en "Para vos".',
      'También podés marcar "No la presto por ahora", editarla o borrarla.',
    ]],
    ['ojo', 'info', 'Un acuerdo entre vecinos', 'La app solo los pone en contacto: devolvé las cosas limpias y a tiempo; si algo se rompe, se arregla entre ustedes.'],
  ], ir:[['abrir', 'cosas', 'Ir a Cosas para prestar']] },

  { id:'barrio', icon:'muro', color:'brand', para:'vecinos', t:'El barrio: la vida entre vecinos', s:'Pizarrón, vecinos, votaciones, obras y más', b:[
    ['lista', [
      '<b>Pizarrón</b>: los avisos de la guardia, la Administración y los vecinos. Podés publicar algo (una novedad, un evento, algo perdido o encontrado).',
      '<b>Vecinos</b>: buscá a alguien por nombre, apellido, lote o calle ("Pérez", "42", "Los Salesianos 3500") y escribile en privado. Salen los 152 lotes con su <b>dirección</b> y quién vive (propietario o inquilino). Aunque escribas mal el apellido ("Peres"), lo encuentra.',
      '<b>Votaciones</b>: votá desde la app. Vota el titular del lote (un voto por lote); si son varios titulares y votan distinto, el voto del lote no se cuenta.',
      '<b>Obras</b>: registrá tu obra ("Registrar mi obra") y, los días con mixer o camión, mandá el "Aviso del día". Todos se enteran en la pizarra.',
      '<b>Viajes compartidos</b>: ofrecé o buscá lugar para ir al centro, la escuela o el aeropuerto.',
      '<b>Profesionales y oficios</b>: los vecinos que ofrecen su profesión u oficio, con su WhatsApp.',
      '<b>Mascotas</b>: perdidas, encontradas y las del barrio.',
      '<b>Compras conjuntas</b>: sumarse a una compra entre varios (leña, gas…).',
      '<b>Cosas para prestar</b>: la escalera, la hidrolavadora, las cadenas, el generador… que cada vecino ofrece prestar (capítulo "Cosas para prestar").',
      '<b>Ángeles de la nieve</b>: vecinos que despejan la entrada de quien no puede palear (capítulo "Invierno y verano").',
      '<b>Manual y normas</b>: una sola puerta con dos solapas arriba. <b>Manual de uso</b> es este manual. <b>Normas y reglamentos</b> tiene el reglamento, la convivencia y las normas que rigen el barrio, con un buscador ("¿hasta qué hora puedo hacer obra?"); cada una se puede <b>descargar</b> para imprimir o guardar en PDF, o todas juntas.',
      '<b>Las cuentas del barrio</b>: en qué se gasta, mes a mes.',
      '<b>Residuos</b>: los días del camión. {RESIDUOS} La víspera la pizarra avisa "Mañana pasa el camión" y cuando la garita registra la entrada, te llega el aviso "Entró el camión".',
      '<b>Correos en el barrio</b>: qué correo está adentro ahora (Correo Argentino, Andreani, OCA, OCASA, Mercado Libre u otro) y los que ya pasaron hoy (capítulo "Correos en el barrio").',
      '<b>Descargas</b>: aplicaciones, instructivos y planillas que comparte la Administración.',
    ]],
    ['ojo', 'info', 'No hay chat vecinal', 'Lo que es para todo el barrio va al <b>pizarrón</b>. Lo que es para una persona, por <b>mensaje privado</b> (Vecinos → Mensaje, o Tu casa → Mensajes → "Buscar un vecino y escribirle", que deja elegir hasta diez y le llega a cada uno por separado).'],
  ], ir:[['abrir', 'comunidad', 'Ir a El barrio'], ['abrir', 'documentos', 'Normas y reglamentos']] },

  { id:'ciudad', icon:'pin', color:'sky', para:'vecinos', t:'Ushuaia y servicios', s:'Lo de afuera que igual te toca', b:[
    ['lista', [
      '<b>Agenda de Ushuaia</b>: comidas, taxis, supermercados, farmacias y oficios, con buscador y WhatsApp.',
      '<b>Cruceros</b>: los que llegan y salen del puerto hoy y los próximos días.',
      '<b>Ushuaia hoy</b>: el clima, las temporadas, los feriados y los eventos de la ciudad.',
      '<b>Vuelos USH</b>: arribos y partidas del aeropuerto de hoy.',
      '<b>Municipalidad de Ushuaia</b>: atajos a trámites, reclamos urbanos, tasas y servicios en el sitio oficial.',
      '<b>Sismos</b>: los movimientos de la región, en vivo, con el acceso a "Preparados para un sismo" (que también está en Tu casa).',
    ]],
    ['p', '<b>Emergencias</b> (teléfonos, el pedido del DEA y los SOS del día) se abre tocando el <b>corazón del DEA</b> en la foto de la portada. <b>Salidas seguras</b> (kayak, montaña, navegación) está en <b>Tu casa</b>.'],
  ], ir:[['abrir', 'ciudad', 'Ir a Ushuaia y servicios']] },

  { id:'cuenta', icon:'user', color:'accent', para:'todos', t:'Tu cuenta', s:'Contraseña, modo noche, avisos, tus datos, actualizar y salir', b:[
    ['p', 'Tocá <b>tu foto o tus iniciales</b> arriba a la derecha:'],
    ['lista', [
      '<b>Modo de pantalla</b>: automático (se oscurece cuando se pone el sol en Ushuaia), día o noche.',
      '<b>Avisos en este equipo</b>: activar, probar o desactivar los avisos al celular, y el sonido cuando escribe la guardia o la Administración.',
      '<b>Cambiar mi contraseña</b> y <b>cambiar mi correo</b>. La cuenta de la garita cambia solo la contraseña: su correo es fijo.',
      '<b>Preguntas frecuentes</b> y este manual.',
      '<b>Mis datos personales</b> (vecinos): un informe con <b>todo lo que la app guarda de vos</b>, sección por sección, con quién ve cada cosa y cuánto se guarda, para imprimir o guardar en PDF; también "Corregir mis datos" y "Pedir la baja". La garita y el hotel no lo tienen: son cuentas institucionales.',
      '<b>Actualizar la app</b>: si algo quedó raro o no abre una ventana. Baja todo de nuevo; tus datos no se pierden.',
      '<b>Cerrar sesión</b>: salís de la app en ese equipo. Por seguridad, también se borra la llave de tu QR de retiro en ese equipo. Si tenés los avisos al celular activados, elegís si ese equipo sigue recibiendo <b>solo</b> el aviso de que un correo va a tu casa (viene marcado; los demás avisos se cortan).',
    ]],
    ['p', 'Lo que abrís desde Tu cuenta (el manual, las preguntas frecuentes, Mis datos personales, cambiar la contraseña o el correo), al cerrarlo, con la X o con Atrás, <b>te devuelve a Tu cuenta</b>.'],
  ], ir:[['mi-cuenta', '', 'Abrir Tu cuenta']] },

  { id:'datos', icon:'lock', color:'brand', para:'vecinos', t:'Tus datos y tu privacidad', s:'Quién ve qué', b:[
    ['lista', [
      'Los demás vecinos ven tu <b>nombre, tu lote y la dirección del lote</b> en el buscador de Vecinos (la guía del barrio), y si sos propietario o inquilino. Tu teléfono y tu profesión, <b>solo si vos elegís compartirlos</b>.',
      'Los <b>teléfonos de cada lote</b> que tiene la Administración los ven solo la garita, la Administración y la supervisión, para ubicarte o avisarte. Ningún vecino ni el hotel. El hotel ve solo la dirección de cada lote, sin nombres.',
      'El <b>padrón de expensas</b> (titular, DNI, correo y deuda de cada lote) lo ve <b>solo la Administración</b>. Tus expensas las ves vos y las cuentas de tu lote.',
      'Tu <b>cuota, los intereses, las multas y lo que debe tu lote</b> viajan solo a los teléfonos de las cuentas de tu lote; los demás vecinos no los reciben. La liquidación completa del barrio la ve solo la Administración. Los <b>gastos del barrio</b> (proveedores, facturas e importes) los ven todos: es la transparencia de las expensas.',
      'El <b>chat vecinal</b> y las <b>reservas</b> ya no existen (se sacaron el 29 de septiembre de 2026). Lo que había quedado guardado de antes no lo ve ningún vecino ni la garita; la Administración lo borra.',
      'Tus mensajes privados, tus reclamos y tus pagos <b>no los ve ningún otro vecino</b> (las expensas, solo las cuentas de tu mismo lote). Si le escribís a varios vecinos a la vez, cada uno recibe su propia conversación: no se enteran de los demás.',
      'La garita ve lo que necesita para su trabajo (visitas, peticiones). La Administración, lo que necesita para administrar.',
      'Si la Administración habilita una <b>supervisión de la guardia</b>, esa persona mira en vivo lo mismo que la garita (también tus visitas, tus peticiones y si tu casa quedó sola), sin poder cambiar nada. No ve tus mensajes, "Estoy bien" ni tus expensas.',
      'La app puede tener <b>publicidad y promociones de comercios</b>, siempre marcadas. Los comercios no reciben ningún dato tuyo y los anuncios no se eligen según quién sos. La mitad de lo que paguen se dona a la Asociación Civil del barrio (ver "Publicidad y aporte al barrio").',
      'Las fotos buenas no quedan en la base del barrio: viaja una vista previa y la foto se baja solo cuando alguien la toca.',
      '<b>Estoy bien</b> y el <b>aviso de salida</b> los ven solo vos, la garita, la Administración y las personas del barrio que elegiste; tus familiares reciben el aviso por correo. Los demás vecinos no saben que lo usás. Los avisos se borran a los 30 días y, si dejás de usarlo, se borra todo.',
      '<b>Tu casa en invierno</b> y <b>en verano</b>, la <b>mochila y el plan para sismos</b> (con sus sugerencias): los ven y los cambian solo las cuentas de tu lote.',
      '<b>Quiénes están en tu lote</b> (en Mi casa): las cuentas de tu mismo lote ven entre sí el nombre, la relación con el lote y si tienen la app abierta; nada más. "No es de mi lote" avisa a la Administración y, sin tu nombre, a esa persona.',
      '<b>Me voy de viaje</b> (casa sola): lo ven solo la garita, la Administración y las cuentas de tu lote. Ya no queda en tu ficha.',
      '<b>Lote alquilado</b>: el propietario que no vive en el lote ve las expensas, las votaciones, los comunicados y tu nombre; no ve tus visitas, tus paquetes, tu casa sola, tus mensajes ni tu plan ante un sismo.',
      '<b>Correos</b>: todos ven solo qué correo está en el barrio y a qué hora entró. A qué lotes va y la patente quedan en el libro de guardia (garita, Administración y supervisión). El aviso "va a tu casa" lo recibe solo tu lote.',
      '<b>Cosas para prestar</b> y <b>Ángeles de la nieve</b> los ven los vecinos de la app (tu nombre de pila y tu lote). Los pedidos de préstamo van por mensaje privado. En Ángeles de la nieve no pongas datos de salud.',
      'Si sos del equipo de salud y tocás VOY ante un pedido del DEA, la garita y el vecino ven tu nombre, tu profesión y tu teléfono.',
    ]],
    ['p', 'Por la <b>Ley 25.326</b> podés pedir ver, corregir o borrar tus datos: en <b>Tu cuenta → Mis datos personales</b> tocá <b>"Ver mi informe"</b>: se abre un documento con todo lo que la app guarda de vos (tu cuenta, visitas, pagos, mensajes, reclamos, votos, lo que publicaste, "Estoy bien", lo de tu casa y el archivo histórico), que imprimís o guardás como PDF (de las expensas trae los pagos y recibos de tu lote de este año; los anteriores están en Mis expensas). Ahí mismo pedís la baja. No incluye contraseñas ni códigos para entrar, y el DNI de tus visitas va tapado. Para llevar tus datos a otro sistema hay además una "Copia técnica (JSON)".'],
    ['p', 'Los <b>términos de uso</b>, lo que dice la ley sobre tus datos y el deslinde de responsabilidad se abren tocando <b>"by Claudio A. Ravasi"</b> al pie de la portada, y en Preguntas frecuentes → "Tus datos: privacidad y seguridad".'],
  ], ir:[['abrir', 'ayuda', 'Preguntas frecuentes'], ['abrir', 'legal', 'Términos de uso'], ['abrir', 'aporte', 'Publicidad y aporte']] },

  { id:'problemas', icon:'wrench', color:'warn', para:'todos', t:'Si algo no anda', s:'Soluciones rápidas', b:[
    ['lista', [
      '<b>Una ventana no abre o la app quedó rara</b>: Tu cuenta → <b>Actualizar la app</b>.',
      '<b>No me llegan los avisos</b>: revisá el capítulo "Activar los avisos al celular". En iPhone, la app tiene que estar instalada.',
      '<b>El puntito del encabezado está rojo</b>: no hay internet. Lo que hagas se manda solo cuando vuelva la conexión.',
      '<b>La app me pide entrar de nuevo</b>: en iPhone pasa si no está instalada (Safari borra lo guardado). Instalala desde Safari.',
      '<b>Me olvidé la contraseña</b>: "Olvidé mi contraseña" en la pantalla de ingreso.',
      '<b>El asistente por voz no me entiende</b> (sobre todo en iPhone o iPad): tocá el botón del micrófono y hablá enseguida. Si dice que no tiene permiso, en Configuración del equipo dale permiso de micrófono a Safari y activá el Dictado. Siempre podés cerrarlo con la X y seguir con los botones.',
      '<b>Pongo mi correo y contraseña y no entra</b>: tocá el botón <b>Entrar</b> (si el teléfono completó los datos solo, la app espera ese toque). Aparece "Entrando…": con poca señal puede tardar unos segundos.',
      '<b>No encuentro algo</b>: usá el buscador de este manual, las Preguntas frecuentes, o escribile a la Administración desde Tu casa → Mensajes.',
    ]],
  ], ir:[['actualizar-app', '', 'Actualizar la app']] },

  /* ---------- Para la garita ---------- */
  { id:'garita', icon:'gate', color:'brand', para:'garita', t:'Para la garita', s:'El turno, los ingresos y la ronda', b:[
    ['h', 'Buscar un vecino: "soy invitado de Pérez"'],
    ['p', 'Si alguien dice a quién viene a ver y no sabe la dirección, tocá <b>"Buscar un vecino"</b> y escribí el apellido, el número de lote o la calle. Sale la ficha del lote: <b>quiénes viven</b> (propietarios o inquilinos), la <b>dirección</b> (calle y altura), para qué lado de la garita queda en Los Salesianos, y los <b>teléfonos</b> con su botón para llamar o mandar WhatsApp.'],
    ['lista', [
      'Perdona errores: "Peres" encuentra a Pérez y "Gonsales" a González.',
      'Un número de hasta 3 cifras busca el lote ("14" es el lote 14). Con 4 cifras o más, la altura de la calle ("3340") o un teléfono.',
      'Los lotes 45 a 49 dicen <b>"Entrada por afuera del barrio, por la calle Los Ñires"</b>.',
      'También dice si el lote es un baldío o una cabaña del hotel (con su número).',
    ]],
    ['ojo', 'warn', 'Los teléfonos son reservados', 'Los ven solo la garita, la Administración y la supervisión. Son para el servicio: no se pasan a nadie (Ley 25.326).'],
    ['h', 'El pizarrón'],
    ['p', 'En tu portada, <b>"Pizarrón"</b> abre los avisos del barrio para leer (de la Administración, de los vecinos, eventos, perdidos), con un número cuando hay nuevos. Desde ahí mismo, <b>"Escribir un aviso de la guardia"</b>: les suena y les llega a todos los vecinos. Los avisos que son para la garita llegan además a la campanita.'],
    ['ojo', 'info', 'Las tareas de la garita son solo de la garita', 'Registrar ingresos y salidas, el camión, el policía y sus rondas, la bitácora, firmar peticiones y atender un SOS lo hace únicamente la cuenta de la garita. La Administración lo ve en vivo, pero no lo toca.'],
    ['h', 'Lo que no se puede olvidar hoy'],
    ['p', 'A la derecha de "Garita" (en el celular, debajo) está la lista del día, <b>"Hoy la garita no puede olvidar"</b>. <b>Se arma sola</b> con lo que de verdad hay hoy, y lo que no está pedido, programado ni pendiente <b>no aparece</b>:'],
    ['lista', [
      '<b>Primero lo urgente</b> (en rojo): alguien que llegó sin aviso y espera la respuesta del vecino, un "Estoy bien" o una salida sin regreso, avisos de vecinos sin ver, peticiones sin recibir, el camión adentro sin salida, un correo adentro hace más de una hora.',
      '<b>Lo programado para hoy, por hora</b>: las visitas y viajes anunciados (con la hora, el nombre y el lote), los ingresos frecuentes que tienen hoy entre sus días, las obras y los proveedores que vienen (con el control de la ART y, si alguno la tiene vencida, "no entra"), el camión el día que pasa, las vans del hotel y el policía contratado (en el turno de noche o si ya está de servicio).',
      '<b>Lo pendiente</b>: quién está adentro sin la salida registrada (también los correos), las casas solas por revisar y los pedidos firmados de vecinos que siguen vigentes hoy (no dejar pasar, llaves, permisos).',
      '<b>De todo turno</b> (en celeste): anotar las novedades en la bitácora y, al terminar, cerrar el turno.',
    ]],
    ['p', 'Tocar un renglón te lleva a donde se hace. Cuando la app ve que algo está hecho, sale de la lista y pasa al renglón verde <b>"Hecho hoy"</b> (sin tachados).'],
    ['h', 'Empezar y cerrar el turno'],
    ['pasos', ['Al abrir, anotá <b>quiénes están de guardia</b> en este turno. Hasta que no lo hacés, la única ventana es la del turno. Si la app se cerró en pleno turno (o entrás desde otro equipo) y ese turno no se cerró, arriba aparece <b>"El turno … no se cerró · Soy de ese turno: seguir"</b>; si ya se cerró, no aparece. Al empezar un turno nuevo, cualquier turno que haya quedado abierto se cierra solo y queda en la bitácora.', 'Al terminar, tocá la teja <b>"Cerrar el turno"</b> (está solo ahí): dejás las novedades para el que entra. La sesión no se cierra: queda lista para el turno siguiente.']],
    ['p', 'En <b>Turnos</b> se ve quién hace cada turno (mañana, tarde, noche) con los nombres de sus guardias, los últimos turnos, los <b>servicios del policía contratado</b> y, plegados, los puntos de control de la ronda.'],
    ['h', 'Visitas de hoy'],
    ['p', 'Arriba del buscador de códigos está la tarjeta <b>Visitas de hoy</b>. La barra de colores muestra el día de un vistazo: en gris las que <b>ya salieron</b>, en verde las que están <b>adentro</b> y en azul las que <b>faltan llegar</b>.'],
    ['p', 'Debajo hay dos tarjetas. <b>Por llegar</b> cuenta las visitas anunciadas que todavía no entraron y dice cuál es la próxima (nombre, hora y lote). <b>Adentro ahora</b> cuenta las que entraron y no salieron, y dice cuál está adentro hace más tiempo. Tocar cualquiera de las dos te baja a la lista <b>Ingresos de hoy</b>.'],
    ['h', 'Validar un ingreso'],
    ['pasos', ['Escribí el <b>código de 6 números</b>, la <b>patente</b> o el <b>DNI</b>, o tocá <b>"Escanear QR"</b>.', 'La app dice si el pase es para hoy y para este horario, quién lo autorizó y si hay una restricción firmada ("no dejar pasar").', 'Tocá <b>"Ingresó"</b>; cuando se va, <b>"Salió"</b>. Al vecino le llega el aviso.']],
    ['p', 'Si alguien llega sin aviso: <b>"Llegó sin aviso"</b>, elegí la casa y el motivo. Al vecino le salta "Que pase / No lo conozco" y ves la respuesta al instante.'],
    ['p', '<b>Pase vencido</b>: si ya pasó el horario del pase, "Ingresó" queda deshabilitado y aparece <b>"Pase vencido"</b>. Si la persona está en la garita, elegí "preguntarle al vecino" (le salta "Que pase / No lo conozco"); si no vino, "solo avisarle que venció".'],
    ['h', 'El Hotel Los Cauquenes'],
    ['p', '<b>La tarjeta del hotel</b> (cobre, con el nombre del hotel): arriba tres números que se tocan — <b>huéspedes por llegar</b>, <b>eventos de hoy</b> y <b>vans en el barrio</b> — y <b>"En vivo"</b> para ver todo el hotel. Abajo, cada huésped que llega hoy con su botón <b>"Ingresó"</b>, y los eventos con su hora.'],
    ['p', '<b>Lote alquilado</b>: cuando alguien llega sin aviso a un lote alquilado, la lista de "¿A qué casa va?" muestra solo al inquilino y su familia: al propietario que no vive ahí no se le consulta. Los correos que van a ese lote le avisan al inquilino.'],
    ['p', 'En la portada de la garita, la solapa <b>Vans del hotel · hoy</b> tiene los traslados programados para hoy, por hora, cada uno con su botón grande <b>"Salió"</b> y, cuando vuelve, <b>"Volvió"</b>: un toque y queda todo anotado (bitácora, traslado y aviso a la recepción). Si el traslado no tiene van asignada, la app pregunta cuál sale. Abajo, cada van con su botón para una salida o entrada que no estaba programada (también sirve leer su QR). Aparte, la banda del hotel muestra los <b>huéspedes</b> que llegan (con "Ingresó") y sus <b>eventos</b>. Sus proveedores también tienen QR: con la ART vencida, no pasan.'],
    ['p', '<b>Uber, DiDi o taxi</b>: si el vecino avisó, aparece en "Ingresos de hoy" como "Uber · nombre del chofer", con la patente y si viene a buscarlo o trae algo. Escribí la patente en el validador y tocá "Ingresó" y después "Salió". Si no avisó, "Llegó sin aviso" con el motivo "Uber / DiDi / taxi".'],
    ...(hayPaquetes() ? [['h', 'Paquetes'],
    ['pasos', ['<b>"Llegó un paquete"</b>: elegí para quién, la empresa, un detalle y sacale una foto a la etiqueta.', 'Al guardar, se avisa a todas las cuentas de ese lote.', 'Para entregar: <b>"Entregar"</b> → <b>"Leer el QR de retiro del vecino"</b>. Si la firma es válida, compará la persona con la foto y tildá los paquetes.', 'Sin teléfono: <b>"Sin teléfono: firma y DNI"</b>. Si retira otra persona, elegí "Otra persona" y anotá su nombre y DNI.']]] : [['ojo', 'info', 'La garita no recibe paquetes', 'El barrio no aprobó que la garita reciba correo ni paquetes de los vecinos. Si llega un correo, registralo con el botón <b>Correos</b> (abajo) y va a la casa. Un delivery se trata como cualquier ingreso: se consulta al vecino y pasa a su casa o no.']]),
    ['p', '<b>Escribir a un lote o a vecinos</b> (en Mensajes con vecinos): elegí el lote y tildá a todo el lote o solo a quién le escribís.'],
    ['p', '<b>Ingresos frecuentes → QR → "Mandarlo por WhatsApp (QR y código)"</b>: le llega la imagen del QR con el código en el mismo mensaje.'],
    ['h', 'El camión, los correos, el policía y la ronda'],
    ['lista', ['<b>Camión de la basura</b>: registrá la entrada (patente) y la salida. A todo el barrio le llega el aviso.',
      '<b>Correos</b> (justo abajo del camión): tocá el botón, elegí la empresa (Correo Argentino, Andreani, OCA, OCASA, Mercado Libre u <b>Otro</b>, que pide el nombre) y <b>"Registrar la entrada"</b>. Si el correo te dice a qué casas va, escribí los lotes (por ejemplo "12, 40, 133A"): a esas casas les llega <b>"va a tu casa"</b> al celular. Si después va a otra casa más, <b>"Avisar a otro lote"</b>. Cuando se va, <b>"Registrar la salida"</b>: su camión deja de verse en todas las pantallas. Los lotes y la patente los ve solo la garita (y la Administración y la supervisión).', '<b>Bitácora</b>: el libro de guardia. Lo que se anota no se borra; si hace falta, marcá que le suene a la Administración.']],
    ['h', 'El policía contratado'],
    ['pasos', [
      '<b>"Registrar ingreso"</b> (en la solapa Policía contratada): completá en este orden <b>día, turno de la garita y hora de ingreso</b>; después su nombre, matrícula, celular y <b>correo</b>. Si ya vino antes, la matrícula, el celular y el correo se completan solos.',
      'La app genera su <b>código de ronda</b> para mandarle por WhatsApp. Con los QR de los puntos de control, cada ronda se anota sola con la hora de cada punto; también se puede anotar a mano.',
      'Al irse, <b>"Salida"</b>: otra vez <b>día, turno de la garita y hora de salida</b>. Su servicio se cierra: desaparece de la portada y queda en <b>Turnos → Servicios del policía contratado</b>.',
      'Al registrar la salida, la app le manda <b>por correo la constancia de su servicio</b>: ingreso y salida (día, turno y hora), con qué guardias estuvo, cada ronda con la hora de cada QR (completa o incompleta) y todo lo que anotó la garita. Si no dejó correo, se puede poner en la salida.',
    ]],
    ['p', 'En Turnos se ven los <b>últimos 7 servicios</b>, cada uno desplegable con todo su recorrido, "Ver la constancia" y "Reenviar la constancia". Los anteriores se traen de la base con <b>"Ver servicios anteriores"</b> (con buscador y planilla), así la app no carga meses de rondas al abrir. Si el policía sigue cuando cambia el turno, pasa al que entra y su servicio es uno solo.'],
    ['h', 'Peticiones y SOS'],
    ['p', 'Las peticiones de los vecinos se reciben con <b>tu firma</b> en la pantalla. Ante un SOS: <b>"Voy en camino"</b> y, al terminar, <b>"Ya la atendimos"</b> (el vecino confirma que está solucionado).'],
    ['ojo', 'info', 'La garita no tiene botón SOS', 'La garita es la que <b>recibe</b> los SOS. Si la garita misma está en peligro (un asalto, un incendio), usá <b>"Aviso urgente"</b>, que les llega a todos los vecinos con sonido, y llamá al 911 o al 101. En Emergencias tampoco aparece el teléfono de la propia garita.'],
    ['h', 'Casas solas: revisarlas una vez por día'],
    ['pasos', [
      'En la portada de la garita, <b>Casas solas</b> muestra las casas de quienes avisaron "Me voy de viaje", con su contacto y una nota. Las que faltan revisar hoy dicen "Falta revisarla hoy".',
      'Cuando la garita o el policía de la ronda la revisa, tocá <b>"Revisada"</b>, elegí quién fue (garita o policía) y cómo estaba (todo en orden o una novedad, con el detalle).',
      'Al vecino le llega "Tu casa está en orden" (o la novedad, con urgencia) y queda en la bitácora. A las 21 h, si falta alguna, la garita recibe un recordatorio.',
    ]],
    ['h', 'El DEA y el equipo de salud'],
    ['p', 'Al tocar <b>"Voy en camino con el DEA"</b>, la app avisa además a los vecinos del equipo de salud o con RCP. En la garita queda una banda con a cuántos se avisó y <b>quién va en camino</b> (nombre, profesión y teléfono). Al terminar, <b>"Terminó: cerrar el pedido"</b>.'],
    ['h', 'Estoy bien'],
    ['p', 'Los vecinos que viven solos y usan "Estoy bien" tocan cada día un botón en su app. Si a su hora no lo hicieron, la garita recibe un aviso con sonido y aparece en rojo en su pantalla y en <b>Estoy bien</b>, con los teléfonos de su familia: llamalos o pasá a ver, y tocá <b>"Fuimos: está bien"</b>. Esa lista la ven solo la garita y la Administración.'],
    ['p', 'Para hablar con la Administración: <b>Administración</b> en las tejas de la garita (canal interno). Con los vecinos, por <b>Mensajes con vecinos</b> y las peticiones.'],
    ['h', 'La supervisión de la guardia'],
    ['p', 'Si la Administración habilita a un <b>supervisor de la guardia</b>, esa persona ve en su teléfono, en tiempo real, lo mismo que la garita: los ingresos, la bitácora, el turno, el policía y las rondas, las peticiones, los SOS y los pedidos del DEA. <b>No puede tocar nada</b>: no registra, no firma y no escribe en el libro. Cuando te escribe, te suena y aparece la teja <b>Supervisión</b> con el número de mensajes; contestale desde ahí. Esa conversación la ven solo la garita y la supervisión: ningún vecino.'],
    ['p', 'La supervisión además da el <b>visto</b> a cada parte de turno (si deja observaciones, te llega un aviso y se ven en Turnos) y recibe alertas: si la app de la garita se desconecta un rato largo, si un SOS o el DEA quedan sin "Voy en camino" o si el policía pasa mucho tiempo sin ronda (este último aviso también te llega a vos, para recordárselo).'],
  ], ir:[['abrir', 'garita', 'Ir a la Garita'], ['abrir', 'bitacora', 'Bitácora']] },

  /* ---------- Para la supervisión de la guardia (07-10-2026) ---------- */
  { id:'supervision', icon:'eye', color:'brand', para:'supervisor', t:'Para la supervisión de la guardia', s:'Mirar la garita en vivo y escribirle', b:[
    ['p', 'La cuenta de supervisión es para quien controla el servicio de la garita. Ve <b>en tiempo real</b> lo mismo que la garita, desde cualquier teléfono o computadora, pero <b>solo para mirar</b>: registrar, firmar o cambiar algo lo hace siempre la garita.'],
    ['h', 'Cómo entrar'],
    ['pasos', [
      'Abrí la app y tocá <b>"Soy vecino nuevo"</b> (o, desde Entrar, <b>"Todavía no tengo cuenta"</b>). Completá tu nombre, tu DNI, tu correo y una contraseña. En <b>"Tu lote"</b> elegí, al final de la lista, <b>"Supervisión de la guardia"</b>.',
      'La Administración revisa el pedido y te habilita. Antes te pide que firmes el <b>compromiso de confidencialidad</b> (lo imprime con tu nombre; vos también lo podés ver e imprimir al pie de tu portada, en "Mi compromiso de confidencialidad"). Te llega un correo.',
      'Entrás con tu correo y tu contraseña. Al habilitarte, la app borra el DNI y el lote que cargaste: no los necesita.',
    ]],
    ['p', '<b>Buscar un vecino</b> (en tu portada): igual que la garita, por apellido, lote o calle, con la dirección del lote y los teléfonos. Es para controlar el servicio: no se pasan a nadie.'],
    ['h', 'Tu portada'],
    ['lista', [
      '<b>La garita ahora</b>: si la app de la garita está abierta (o conectada pero minimizada, o sin conexión), qué turno está abierto y quiénes están de guardia, cuándo fue el último registro en el libro y si hay policía de servicio con sus rondas.',
      'Arriba, en rojo, cualquier <b>SOS</b>, <b>pedido del DEA</b> o <b>aviso urgente</b> activo. Un SOS nuevo además te salta a pantalla completa y suena, con el vecino, el lote y la ubicación.',
      '<b>Hoy en la entrada</b>: las visitas anunciadas para hoy que todavía no llegaron, las que entraron y siguen en el barrio, los pedidos firmados de vecinos que la garita todavía no recibió y las casas de vecinos de viaje que hay que revisar hoy.',
      '<b>Lo último, en vivo</b>: los registros de hoy del libro de guardia, a medida que la garita los anota.',
      'Las tejas para mirar cada cosa: <b>Garita en vivo</b>, <b>Bitácora</b>, <b>Turnos y policía</b> (quién trabajó cada turno, servicios y rondas del policía), <b>Peticiones</b>, el <b>hotel</b> (vans, traslados y eventos), <b>obras</b> y <b>proveedores</b>.',
    ]],
    ['h', 'Escribirles a la garita y a la Administración'],
    ['p', 'Tocá <b>Mensajes</b>, arriba en tu portada (dice cuántos tenés sin leer). Arriba de la conversación están las dos, para pasar de una a otra. A quien le escribís le suena al instante. La conversación con la garita la ven solo la garita y vos; la de la Administración, solo la Administración y vos.'],
    ['ojo', 'info', 'Solo para mirar', 'Si tocás algo que es tarea de la garita (dar un ingreso, firmar una petición, registrar al policía), la app te avisa que eso lo hace la garita. Para pedirlo, escribile.'],
    ['h', 'Alertas al celular'],
    ['lista', [
      '<b>La garita sin conexión</b>: si la app de la garita lleva más de 20 minutos sin conectarse, te llega una alerta; cuando vuelve, otra que dice cuánto estuvo afuera. Lo revisa el servidor cada 10 minutos, aunque todos los teléfonos estén bloqueados.',
      '<b>SOS o DEA sin respuesta</b>: si a los 3 minutos nadie de la garita tocó "Voy en camino", te suena a vos y a la Administración.',
      '<b>Policía sin ronda</b>: si el policía de servicio pasa 90 minutos sin empezar una ronda, te avisa a vos y a la garita.',
      'Los minutos los fija la Administración. Las alertas de la última semana quedan en tu portada.',
    ]],
    ['h', 'Dar el visto a cada parte de turno'],
    ['pasos', [
      'Cuando la garita cierra un turno, en tu portada aparece en <b>"Partes de turno para dar el visto"</b> (también en Turnos y policía → Últimos turnos).',
      'Tocá <b>Leer</b> para ver el parte: guardias, novedades, policía y rondas, y todo lo anotado en el libro en ese horario.',
      'Tocá <b>Visto</b> y elegí <b>Sin observaciones</b> o <b>Con observaciones</b> (escribís cuáles). Tocá <b>Dar el visto</b>.',
      'Queda como constancia, con tu nombre, la fecha y la hora, y no se puede cambiar. Si hay observaciones, les llega un aviso a la garita y a la Administración.',
    ]],
    ['h', 'El informe mensual'],
    ['p', '<b>Informe mensual</b>, en tu portada: el mes en 30 segundos (con semáforo verde, amarillo o rojo) y después el detalle para leer con tiempo: turnos y guardias, policía y rondas, emergencias con el tiempo de respuesta, alertas, accesos y peticiones, incidentes del libro y tus observaciones. Elegís el mes, lo descargás o imprimís, o te lo mandás por correo.'],
    ['p', 'El <b>día 1 de cada mes</b> te llega solo por correo el del mes anterior. El correo no lleva lotes, nombres, DNI ni patentes de vecinos: el detalle completo está en la app.'],
    ['h', 'Lo que no ves'],
    ['p', 'Los mensajes privados de los vecinos con la garita o con la Administración, "Estoy bien", los huéspedes del hotel, las expensas y los pagos. Lo que ves es reservado: estás obligado/a a guardar secreto (art. 10 de la Ley 25.326).'],
    ['p', 'Los avisos al celular: te llegan los SOS, los pedidos del DEA y los mensajes que te escriben. Los avisos generales del barrio (el camión, la pizarra) no.'],
  ], ir:[['abrir', 'garita', 'Garita en vivo'], ['abrir', 'privado', 'Mensajes']] },

  /* ---------- Para el hotel ---------- */
  { id:'hotel', icon:'star', color:'wood', para:'hotel', t:'Para el Hotel Los Cauquenes', s:'Vans, traslados, huéspedes, eventos, expensas y más', b:[
    ['h', 'Cómo entra el hotel'],
    ['p', 'El hotel tiene <b>una sola cuenta</b>, que usa la recepción en la computadora y en el celular de turno. La crea la Administración del barrio. La primera vez, entrá con el correo y la contraseña que te pasaron y cambialos en <b>Tu cuenta</b> (tu ícono arriba a la derecha): "Cambiar mi correo" y "Cambiar mi contraseña". Si la persona responsable deja el hotel, cambiá la contraseña.'],
    ['ojo', 'info', 'Qué ve el hotel y qué no', 'Ve lo suyo (vans, traslados, huéspedes, eventos, proveedores, promociones) y lo público de la ciudad (vuelos, cruceros, eventos, agenda, normas del barrio). No ve nada de los vecinos: ni el padrón, ni el pizarrón, ni sus visitas, ni los SOS.'],
    ['p', '<b>Direcciones del barrio</b>: la calle y la altura de cada lote, para indicarle a un huésped o a un proveedor cómo llegar. Se busca por lote o por calle. No muestra nombres ni teléfonos de los vecinos.'],
    ['h', 'Las vans'],
    ['pasos', ['Entrá a <b>Vans y traslados</b> → "+ Van" y cargá nombre, patente, modelo y chofer.', 'Tocá <b>"QR para la garita"</b> → "Imprimir el QR" y pegalo en el parabrisas, del lado del acompañante.', 'Cada vez que la van entra o sale, la garita lee el QR (o toca "Entró"/"Salió") y en la app ves dónde está cada van.']],
    ['h', 'Los traslados se arman solos'],
    ['lista', [
      'En la portada del hotel están los <b>vuelos</b> del día (partidas y arribos), los <b>cruceros</b> y los <b>eventos de la ciudad</b>, cada uno con su botón para programar la van <b>con la hora de salida ya calculada</b>.',
      'Si cargás un huésped con su <b>vuelo de llegada o de salida</b>, la app arma sola el traslado y junta a los que viajan en el mismo vuelo.',
      'Si el vuelo cambia de horario o se cancela en el aeropuerto, la app te avisa cuándo conviene salir, con un botón para <b>ajustar</b>.',
      'Antes de cada salida te llega un recordatorio. Cuando la van sale por la garita, el traslado pasa a "En viaje"; cuando vuelve, a "Hecho".',
      'Los tiempos (minutos al aeropuerto, check-in, al puerto, embarque) se cambian en <b>Ficha del hotel</b>.',
    ]],
    ['h', 'Huéspedes'],
    ['p', 'En <b>Huéspedes</b> cargá nombre, fechas, patente (si vienen en auto) y, si querés, los vuelos. La lista la ven <b>solo el hotel y la garita</b>, que la usa para dejarlos pasar. Se borra sola al día siguiente del check-out. Informales a tus huéspedes que compartís esos datos con la guardia del barrio.'],
    ['h', 'Eventos, proveedores y promociones'],
    ['lista', [
      '<b>Eventos del hotel</b>: anunciá fecha, horario, invitados, ingreso, estacionamiento y música. La garita se entera al instante. Si marcás "avisar a los vecinos", la Administración decide si lo publica en el pizarrón.',
      '<b>Proveedores</b>: empresa, personal, patentes, días, horario, ART y seguro. Cada uno tiene su QR. Con la ART vencida, la garita no lo deja pasar.',
      '<b>Promociones</b>: las cargás, cambiás o borrás vos directamente ("Nueva promoción", "Editar", "Borrar") y salen enseguida en la tira del hotel, en la app de todos los vecinos. La Administración también puede cargarlas, cambiarlas o borrarlas: cada vez que uno toca algo, al otro le llega el aviso y queda registrado quién fue. Las vencidas dejan de verse solas. El enlace para reservar tiene que empezar con https://.',
    ]],
    ['h', 'Expensas del hotel'],
    ['p', 'El hotel es dueño de 6 unidades del barrio (UF 000 a 005, lotes 0 a 5) y paga expensas como cualquier propietario. En la teja <b>Expensas del hotel</b>:'],
    ['lista', [
      'Arriba, el <b>total de las 6 UF</b> con el 1º y el 2º vencimiento y cuántos días faltan.',
      '<b>Un solo pago</b>: tocá el total y elegí cómo (online con Mercado Pago, transferencia o efectivo). La app lo <b>reparte sola</b> entre las 6 UF (primero lo que debe cada una) y, cuando se acredita, sale <b>un recibo por cada UF</b>.',
      'Si pagaron por fuera de la app, <b>"Ya pagamos por fuera de la app"</b> con el comprobante: queda por acreditar hasta que la Administración lo confirma.',
      'Abajo, cada UF por separado con su cupón del mes ("Ver el cupón"), los cupones de los meses anteriores, los pagos y los recibos.',
      'Cada mes los cupones llegan <b>solos</b> al correo del hotel, uno por UF, y los vencimientos se avisan en la app. "Consultar a la Administración" abre la charla solo con la Administración.',
    ]],
    ['ojo', 'info', 'Solo lo del hotel', 'El hotel ve únicamente las cuentas de sus 6 UF: la Administración le arma cada mes una copia con solo esas cuotas. No ve lo que paga ningún vecino.'],
    ['h', 'Emergencias'],
    ['p', 'El botón rojo <b>"Garita"</b> de arriba a la derecha avisa a la garita al instante (médica, seguridad, incendio). En <b>Emergencias</b> están los teléfonos y el plan del hotel: su DEA, el personal con primeros auxilios y el punto de encuentro. Si hay una emergencia médica en el barrio, la garita puede pedirte el DEA: te llega el aviso con el lote.'],
    ['h', 'Mensajes, hoja del día y convenio'],
    ['lista', ['<b>Comunicación interna</b>: tocala y elegí con quién hablar, <b>Garita</b> o <b>Administración</b>. Arriba de la conversación están las dos para pasar de una a la otra, con el número de mensajes sin leer. Cada conversación es privada: la de la garita no la ve la Administración, y al revés.','<b>Hoja del día</b>: vuelos, cruceros, eventos y traslados listos para imprimir y dejar en el mostrador.', '<b>Convenio con el barrio</b>: el modelo de convivencia y servicios, para revisar con un abogado y aprobar en asamblea.']],
  ], ir:[['abrir', 'hotel-traslados', 'Vans y traslados'], ['abrir', 'hotel-huespedes', 'Huéspedes'], ['abrir', 'expensas', 'Expensas del hotel'], ['abrir', 'hotel-ficha', 'Ficha del hotel']] },

  /* ---------- Para la Administración ---------- */
  { id:'admin', icon:'sliders', color:'accent', para:'admin', t:'Para la Administración', s:'Dos brazos, el día a día y el alcance con la garita', b:[
    ['h', 'Dos brazos'],
    ['p', 'Quien administra y además vive en el barrio elige al entrar si está como <b>vecino</b> o como <b>Administración</b>, y cambia con el botón del encabezado. En modo Administración solo se ve la gestión; en modo vecino, solo lo de vecino.'],
    ['h', 'Día a día, por salas'],
    ['lista', ['<b>Garita y seguridad</b>: la garita en vivo, la bitácora, los turnos, los mensajes con la garita, los ingresos frecuentes y la supervisión de la guardia.', '<b>Vecinos</b>: padrón, mensajes, reclamos, infracciones, votaciones y obras.', '<b>Comunicación</b>: comunicados importantes (con acuse), el pizarrón y los avisos urgentes por zona.', '<b>Proveedores y cumplimiento</b>: ART y seguros, protección de datos, y publicidad y aporte al barrio.', '<b>Hotel Los Cauquenes</b>, al final: el hotel en vivo, sus promociones, eventos y proveedores, los mensajes con el hotel y su cuenta.']],
    ['h', 'La guía del barrio y el padrón de expensas'],
    ['p', 'Son dos listas distintas. El <b>padrón de expensas</b> (titular, DNI, correo, coeficiente y deuda) es para cobrar y lo ve <b>solo la Administración</b>. La <b>guía del barrio</b> dice quién vive en cada lote (propietarios o inquilinos), si es baldío o cabaña, y los teléfonos: la usa la garita en "Buscar un vecino".'],
    ['pasos', [
      'Entrá a <b>Vecinos → Padrón</b> y bajá hasta <b>"Guía del barrio"</b>.',
      'Tocá <b>"Cargar la guía del barrio"</b> y elegí el archivo <b>guia-del-barrio-….csv</b> de la carpeta <b>datos-privados</b> (en tu computadora).',
      'Se abre una ventana que dice cuántos lotes y teléfonos leyó y espera a la base del barrio: cuando dice <b>"Listo: la guía quedó guardada"</b>, la garita ya la ve. Si dice que la base no la aceptó, explica qué hacer (por ejemplo, publicar las reglas de Firebase).',
      'Para corregir un lote, buscalo en <b>Vecinos</b> y tocá <b>"Editar"</b>. Para cambiar muchos, <b>"Descargar la guía (CSV)"</b>, corregila en Excel y volvé a subirla: reemplaza a la anterior.',
    ]],
    ['ojo', 'warn', 'Quién ve qué', 'Los nombres, el lote y la dirección los ven los vecinos, la garita y la supervisión. Los <b>teléfonos y la nota</b> de cada lote, solo la garita, la Administración y la supervisión. El hotel, solo la dirección. El archivo con teléfonos guardalo siempre en <b>datos-privados</b>: nunca va a GitHub.'],
    ['h', 'Dar de alta a un vecino o inquilino'],
    ['p', 'Para quien no sabe inscribirse (muchos dueños mayores, inquilinos nuevos): <b>Administración → Vecinos → "Dar de alta a un vecino o inquilino"</b>. Cargás nombre, DNI, lote, qué es del lote, correo y celular. La cuenta queda aprobada al instante con una <b>contraseña provisoria</b>, que se manda por correo y con el botón de WhatsApp. Si es un inquilino, el lote queda alquilado solo. La primera vez que la persona entra, acepta los términos y puede elegir su contraseña. En <b>Vecinos → ⋯</b> también podés marcar que un propietario <b>no vive en el lote</b>.'],
    ['h', 'Escribir a un lote o a vecinos'],
    ['p', 'En <b>Mensajes con vecinos → "Escribir a un lote o a vecinos"</b>: elegís el lote y, adentro, <b>todo el lote</b> o solo a quién (en un lote de cuatro, a dos). A cada uno le llega en su conversación privada, con aviso al celular. La garita tiene el mismo botón.'],
    ['h', 'Inquilinos y propietarios'],
    ['p', 'En <b>Inscripciones</b> cada pedido dice qué es del lote (propietario, cotitular, inquilino, familiar). Al aprobar a un <b>inquilino</b>, el lote queda alquilado: el inquilino maneja el día a día y el propietario pasa a "propietario a distancia" (le llega el aviso). La relación la cambiás en <b>Vecinos → ⋯</b>; cada vecino la elige una sola vez. Al dar de baja al inquilino, el lote vuelve al propietario.'],
    ['h', 'El alcance con la garita'],
    ['ojo', 'info', 'La Administración mira la garita; no la opera', 'La Administración ve en tiempo real los ingresos, el camión, los correos, el policía, la bitácora, las peticiones y los SOS, pero no registra, no entrega, no firma ni escribe en el libro de guardia: eso es exclusivo de la cuenta de la garita. Así no se pisan datos ni responsabilidades.'],
    ['lista', ['<b>Sí es de la Administración</b>: los horarios de los turnos, los puntos de control de la ronda (y sus QR), las zonas para avisos, los proveedores habilitados, los ingresos frecuentes y el control mensual de horas y rondas del policía.', '<b>Para pedirle algo a la garita</b>: "Mensajes con la garita" (canal interno). Le llega al instante, con sonido.']],
    ['h', 'La supervisión de la guardia'],
    ['p', 'En <b>Garita y seguridad → Supervisión de la guardia</b>, en <b>Alertas e informe mensual</b>, fijás a los cuántos minutos se alerta (garita sin conexión, SOS sin respuesta, policía sin ronda), si el informe sale por correo el día 1 y si también te llega a vos. Ahí mismo está el <b>informe mensual</b> para leerlo o imprimirlo. El aviso de la garita sin conexión necesita el Codigo.gs versión 10 con el reloj instalado.'],
    ['p', 'En <b>Garita y seguridad → Supervisión de la guardia</b> habilitás a quien controla el servicio de la garita. Se inscribe como cualquiera y en "Tu lote" elige <b>"Supervisión de la guardia"</b>; su pedido aparece en Inscripciones y acá, y al aprobarlo queda como supervisión (se le borran el DNI y el lote). Puede haber más de una. Ve en vivo lo mismo que la garita y no puede cambiar nada; te escribe por su propio canal (con el número de mensajes en el renglón). No ve los mensajes de los vecinos, "Estoy bien", los huéspedes del hotel ni las expensas. Antes de habilitarla, que firme el compromiso de confidencialidad. "Quitarle el acceso" la deja sin ver nada.'],
    ['h', 'El Hotel Los Cauquenes'],
    ['p', 'La sala del hotel en el Día a día: el hotel en vivo (sin los nombres de sus huéspedes), sus promociones (las podés agregar, cambiar o borrar, igual que el hotel; cuando el hotel toca una, te llega el aviso), sus eventos (avisar a los vecinos si lo pide), sus proveedores (revisar o suspender), los mensajes con la recepción, la <b>Cuenta del hotel</b> (el hotel se inscribe como cualquier usuario y su inscripción pendiente se convierte en la del hotel; los vecinos aprobados no aparecen en esa lista; una vez hecha, el hotel cambia su correo y su contraseña en Tu cuenta) y el <b>modelo de convenio</b>. Si el hotel declara su DEA, desde Emergencias del hotel se publica para los vecinos.'],
    ['h', 'Estoy bien'],
    ['p', 'La Administración y la garita reciben siempre el aviso cuando un vecino anotado no toca "Estoy bien" a su hora (o no vuelve de una salida), y ven la lista en <b>Gestión → Estoy bien</b> con los teléfonos de su familia. El resto del barrio no. Para que las alarmas salgan aunque todos los teléfonos estén bloqueados, el Apps Script tiene un reloj que revisa cada 10 minutos (una vez: ejecutar <b>instalarRelojCuidados</b>; ver AVISOS.md).'],
    ['h', 'Protección de datos'],
    ['p', 'En <b>Proveedores y cumplimiento → Protección de datos</b> están las tareas del barrio como responsable de la base: la inscripción en la AAIP (con las respuestas ya redactadas), quién atiende los pedidos de los vecinos sobre sus datos, el compromiso de confidencialidad y el registro de incidentes.'],
    ['p', 'En la misma sala, <b>Publicidad y aporte al barrio</b>: lo que dicen los términos (punto 4) sobre la publicidad de comercios en la app y la donación del 50 % a la Asociación Civil, el <b>compromiso de donación</b> para imprimir y firmar, y el registro de lo recibido. Ahí anotás si el compromiso está firmado (fecha, acta y si se elevó a escritura) y cada entrega semestral con su destino: los vecinos ven el total y en qué se usó, sin los nombres de los comercios.'],
    ['ojo', 'warn', 'Borrar lo que quedó del chat y de las reservas', 'El chat vecinal y las reservas se sacaron de la app el 29-09-2026. Lo que quedó guardado en la base ya no se usa y la ley pide borrarlo. Es un solo botón en Protección de datos: se borra para siempre y queda en la auditoría.'],
    ['h', 'Expensas y contabilidad'],
    ['p', 'Las facturas del mes se cargan en <b>Contabilidad</b>; al cerrar el mes se arman los cupones. En <b>Expensas</b> se ven los lotes, se confirman los pagos informados, se emiten recibos y se sigue la morosidad.'],
    ['h', 'Traer la liquidación real de Octavo Piso'],
    ['p', 'Mientras se lleve en paralelo con Octavo Piso, cada mes se puede traer su liquidación y la app queda <b>igual al centavo</b>. Claude arma el archivo <b>liquidacion-&lt;mes&gt;.json</b> con el PDF y lo deja en la carpeta <b>datos-privados</b> (no lleva nombres de vecinos).'],
    ['pasos', [
      'Entrá a <b>Gestión → Expensas → Automáticas</b> y, abajo, tocá <b>"Traer la liquidación real de un mes"</b> (también está en "Cómo se calcula").',
      'Elegí el archivo y tocá <b>"Traer"</b>. La app registra los <b>cobros del mes</b> lote por lote (lo que figura en "Pagos recibidos"), pone los <b>gastos reales</b> (los estimados quedan anulados) con las obleas de cada lote, y arma el <b>cupón de cada lote</b>.',
      'Se abre una ventana que dice si <b>los 152 lotes coinciden al centavo</b> con el PDF. Si alguno no, lo nombra; si lleva un "Ajuste", el vecino lo ve en su cuenta con ese nombre.',
      'A cada vecino le aparece su cupón <b>por pagar</b> y le llega un aviso. No se mandan correos: los cupones ya los mandó Octavo Piso.',
      'Si lo volvés a traer, no se duplica nada.',
    ]],
    ['h', 'Mes contra mes'],
    ['p', 'En <b>Automáticas → Mes contra mes</b> se compara un mes con el anterior: gastos, cuota promedio, cupones, banco y deuda; cada rubro y cada gasto con su cambio en %, cuál es <b>nuevo</b> y cuál <b>ya no está</b>. Se descarga en PDF. No muestra datos de ningún vecino.'],
    ['p', '<b>"Ya la pagué"</b>: mientras Mercado Pago no esté activado, los vecinos pueden marcar su expensa como pagada con un toque, sin comprobante. Te llega el aviso y el pago aparece en <b>Pagos</b> para confirmarlo con el resumen del banco (los centavos dicen el lote). Recién al confirmarlo se emite el recibo.'],
    ['p', '<b>El hotel (6 UF)</b>: sus cupones salen solos al emitir el mes, uno por UF, a su correo y a su ventana "Expensas del hotel". Paga el total de sus 6 UF en un solo pago: en "Por acreditar" aparece como <b>"Hotel Los Cauquenes · 6 UF"</b>, con cómo se reparte; al confirmarlo salen <b>6 recibos</b>, uno por UF. Los pagos con Mercado Pago del hotel se reparten y se pasan a recibo solos, como los de los vecinos. Para eso la app le deja al hotel una copia con solo sus cuotas: no ve las de nadie más.'],
    ['p', '<b>Probar Mercado Pago</b>: en tu vista de vecino, en Expensas, el botón <b>"Probar el pago con Mercado Pago"</b> (solo lo ve quien administra) cobra el importe de tu último cupón aunque estés al día. Se paga con una tarjeta de prueba (titular APRO) y queda en <b>Pagos de PRUEBA</b>: no cambia tu saldo ni saca recibo, y se borra con un toque en Expensas → Pagos.'],
  ], ir:[['abrir', 'gestion', 'Gestión del barrio']] },
];

/* ¿Este capítulo lo ve quien está mirando? */
function manualParaMi(c){
  const rol = yo()?.rol;
  /* El hotel: su capítulo y lo general que le sirve. */
  if (rol === 'hotel') return c.para === 'hotel' || ['instalar', 'avisos', 'cuenta', 'problemas'].includes(c.id);
  if (c.para === 'hotel') return rol === 'admin';
  /* La supervisión de la guardia: su capítulo y lo general que le sirve. */
  if (rol === 'supervisor') return c.para === 'supervisor' || ['instalar', 'avisos', 'cuenta', 'problemas'].includes(c.id);
  if (c.para === 'supervisor') return rol === 'admin';
  if (c.para === 'todos') return true;
  if (rol === 'admin') return true;
  if (rol === 'guardia') return c.para === 'garita';
  return c.para === 'vecinos';
}
const manualCaps = () => MANUAL_CAPS.filter(c => (!c.activo || c.activo()) && manualParaMi(c));

/* Las marcas del texto que dependen del barrio o de quien lee. */
function manualTexto(t){
  const u = yo() || {}, n = String(u.casa || '').match(/\d+/), c = Store.s.config || {};
  const dias = typeof recoleccionDias === 'function' ? recoleccionDias() : {};
  const lista = Object.keys(dias).map(Number).sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7)).map(d => `${['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'][d]} (${String(dias[d]).toLowerCase()})`);
  const residuos = lista.length ? `Hoy el cronograma es: ${lista.length > 1 ? lista.slice(0, -1).join(', ') + ' y ' + lista.slice(-1) : lista[0]}.` : '';
  return String(t).replace(/\{BARRIO\}/g, esc(c.nombre || 'Bahía Cauquén'))
    .replace(/\{LOTE\}/g, esc(u.casa || 'tu lote'))
    .replace(/\{CENTAVOS\}/g, n ? ` (el ${esc(u.casa)} paga, por ejemplo, $ …,${String(+n[0] % 100).padStart(2, '0')})` : '')
    .replace(/\{RESIDUOS\}/g, residuos);
}
/* Todo el texto de un capítulo, sin etiquetas: para el buscador. */
function manualPlano(c){
  const partes = [c.t, c.s];
  c.b.forEach(x => { if (x[0] === 'pasos' || x[0] === 'lista') partes.push(...x[1]); else if (x[0] === 'ojo') partes.push(x[2], x[3]); else partes.push(x[1]); });
  return normTxt(manualTexto(partes.join(' ')).replace(/<[^>]+>/g, ' '));
}
/* Resalta lo buscado sin romper el HTML: solo fuera de las etiquetas. */
function manualResaltar(html, q){
  if (!q) return html;
  const pal = normTxt(q).split(/\s+/).filter(w => w.length > 2); if (!pal.length) return html;
  const sinAc = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  return html.split(/(<[^>]+>)/).map(tr => {
    if (tr.startsWith('<')) return tr;
    let out = '', i = 0; const base = sinAc(tr);
    while (i < tr.length){
      const hit = pal.map(w => ({ w, k:base.indexOf(w, i) })).filter(x => x.k >= 0).sort((a, b) => a.k - b.k)[0];
      if (!hit){ out += tr.slice(i); break; }
      out += tr.slice(i, hit.k) + '<mark>' + tr.slice(hit.k, hit.k + hit.w.length) + '</mark>'; i = hit.k + hit.w.length;
    }
    return out;
  }).join('');
}
function manualBloques(c, q = '', imp = false){
  const T = t => manualResaltar(manualTexto(t), q);
  return c.b.map(x => {
    if (x[0] === 'p') return `<p class="man-p">${T(x[1])}</p>`;
    if (x[0] === 'h') return `<h4 class="man-h">${T(x[1])}</h4>`;
    if (x[0] === 'pasos') return `<ol class="man-pasos">${x[1].map(l => `<li>${T(l)}</li>`).join('')}</ol>`;
    if (x[0] === 'lista') return `<ul class="man-lista">${x[1].map(l => `<li>${T(l)}</li>`).join('')}</ul>`;
    if (x[0] === 'ojo' && imp) return `<div class="caja"><b>${T(x[2])}</b><br>${T(x[3])}</div>`;
    if (x[0] === 'ojo') return `<div class="aviso a-${x[1]} man-ojo">${I(x[1] === 'warn' || x[1] === 'danger' ? 'alert' : x[1] === 'ok' ? 'check' : 'info')}<div class="txt"><b>${T(x[2])}</b>${T(x[3])}</div></div>`;
    return '';
  }).join('');
}
const Manual = { abierto:'' };
/* =========================================================
   MANUAL Y NORMAS, UNA SOLA PUERTA (pedido de Claudio, 28-09-2026)
   En El barrio había dos tejas ("Manual de uso" y "Normas y reglamentos")
   y era ruido. Ahora hay una sola, "Manual y normas", y adentro dos
   solapas arriba: se pasa de una a la otra sin apilar ventanas (la de
   arriba de la pila cambia en el lugar). Las dos siguen existiendo por
   separado para los enlaces de siempre (Tu cuenta, preguntas frecuentes,
   la garita, el hotel), y en las dos se ven las mismas solapas.
   ========================================================= */
const guiaSolapas = activa => `<div class="chips guia-solapas">
  <button class="chip ${activa === 'manual' ? 'on' : ''}" data-a="guia-ir" data-v="manual">${I('book')}Manual de uso</button>
  <button class="chip ${activa === 'normas' ? 'on' : ''}" data-a="guia-ir" data-v="normas">${I('file')}Normas y reglamentos</button></div>`;
A['guia-ir'] = el => {
  const dest = el.dataset.v === 'normas' ? 'documentos' : 'manual', top = PILA[PILA.length - 1];
  if (top && top.id === dest) return;
  if (top && (top.id === 'manual' || top.id === 'documentos') && !PILA.some(v => v.id === dest)){
    top.id = dest; top.param = ''; top.scroll = 0; pintar(); $('#cuerpo')?.scrollTo({ top:0 }); return; }
  abrir(dest);
};
R.manual = {
  titulo:'Manual de uso', icon:'book', color:'accent', sub:'Manual y normas · paso a paso, para todos',
  render(q){
    const todos = manualCaps(), qq = normTxt(q || '').trim();
    const pal = qq.split(/\s+/).filter(w => w.length > 2);
    const lista = pal.length ? todos.filter(c => { const p = manualPlano(c); return pal.every(w => p.includes(w)); }) : todos;
    const ir = c => (c.ir || []).filter(([a, v]) => a !== 'abrir' || typeof ventanaPermitida !== 'function' || ventanaPermitida(v))
      .map(([a, v, t]) => `<button class="btn btn-sm btn-sec" data-a="${a}" data-v="${esc(v)}">${esc(t)}${I('right')}</button>`).join('');
    return `${guiaSolapas('manual')}<div class="man-intro"><span class="man-intro-ic">${I('book')}</span><div><b>Cómo usar la app, paso a paso</b>
        <span>${plural(todos.length, 'capítulo')}. Tocá uno para abrirlo; tocalo de nuevo para cerrarlo. Arriba podés buscar cualquier palabra.</span></div></div>
      <form data-f="buscar-manual" class="linea-form" style="margin:0 0 10px"><input name="q" id="qManual" value="${esc(q || '')}" placeholder="Buscar: visita, mensaje, expensas, contraseña…" autocomplete="off"><button class="btn btn-pri" aria-label="Buscar">${I('search')}</button></form>
      ${pal.length ? `<p class="muted small" style="margin:0 0 10px">${lista.length ? `${plural(lista.length, 'capítulo')} con "${esc(q)}".` : ''} <button class="link" data-a="abrir" data-v="manual">Ver todo el manual</button></p>` : ''}
      ${lista.length ? lista.map((c, i) => `<details class="man-cap card" data-cap="${esc(c.id)}" ${pal.length || Manual.abierto === c.id ? 'open' : ''}>
          <summary><span class="man-n">${todos.indexOf(c) + 1}</span><span class="man-ic ic-${c.color}">${I(c.icon)}</span>
            <span class="man-tit"><b>${manualResaltar(esc(c.t), qq)}</b><small>${esc(c.s)}${c.para === 'garita' ? ' · garita y Administración' : c.para === 'supervisor' ? ' · supervisión y Administración' : c.para === 'admin' ? ' · solo la Administración' : ''}</small></span>${I('right')}</summary>
          <div class="man-cuerpo">${manualBloques(c, qq)}${ir(c) ? `<div class="btns man-ir">${ir(c)}</div>` : ''}</div></details>`).join('')
        : vacio('search', 'No encontramos eso en el manual. Probá con otra palabra ("visita", "mensaje", "pagar") o mirá las Preguntas frecuentes.')}
      ${pal.length ? '' : `<div class="card man-bajar"><div><b>${I('download')} Descargar el manual</b><span class="muted small">Llegaste al final. El manual entero, listo para imprimir o guardar como PDF (en el celular: Compartir → Guardar en Archivos, o Imprimir → Guardar como PDF).</span></div>
        <button class="btn btn-pri" data-a="manual-pdf">${I('download')}Descargar o imprimir</button></div>`}
      <p class="muted tiny center" style="margin-top:12px">Este manual acompaña la versión ${esc(window.VERSION || '—')} de la app. ¿Falta algo? Escribile a la Administración.</p>`;
  },
};
F['buscar-manual'] = d => { Manual.abierto = ''; abrir('manual', d.q || ''); };
/* Se recuerda qué capítulo quedó abierto: al volver a la ventana, sigue ahí. */
document.addEventListener('toggle', e => {
  const d = e.target; if (!d || !d.classList || !d.classList.contains('man-cap')) return;
  if (d.open) Manual.abierto = d.dataset.cap; else if (Manual.abierto === d.dataset.cap) Manual.abierto = '';
}, true);
A['manual-pdf'] = () => {
  const caps = manualCaps();
  imprimir('Manual de uso', `<p><b>Manual de uso de la app del barrio</b> · ${plural(caps.length, 'capítulo')} · ${fechaLarga(hoyISO())}</p>
    <div class="caja"><b>Índice</b><ol style="margin:6px 0 0;padding-left:20px">${caps.map(c => `<li>${esc(c.t)}</li>`).join('')}</ol></div>
    ${caps.map((c, i) => `<h2>${i + 1}. ${esc(c.t)}</h2>${manualBloques(c, '', true)}`).join('')}`,
    { pie:`Manual de la app del barrio · versión ${esc(window.VERSION || '—')}. Describe la app tal como funciona en esta versión.` });
};
A['abrir-manual'] = () => { cerrarHoja(); abrir('manual'); };
