/* =========================================================
   MANUAL DE USO, POR SOLAPAS (pedido de Claudio, 26-09-2026)
   -------------------------------------------------------
   El mismo estilo que el manual de AFAAR: capítulos que se abren y se
   cierran (solapas), un buscador que mira también adentro del texto y un
   botón para bajarlo entero en PDF. Está en El barrio → Manual de uso, en
   las Preguntas frecuentes y en Tu cuenta.

   Escrito para cualquier vecino, sin palabras técnicas: qué tocar, en qué
   orden y qué va a pasar. REGLA: describir solo lo que la app hace de verdad
   (si algo cambia en la app, se corrige acá).

   Quién ve cada capítulo (campo `para`):
     · 'todos'    → todas las cuentas (el hotel, solo algunos);
     · 'hotel'    → el hotel y la Administración;
     · 'vecinos'  → vecinos (y quien administra, que también puede tener lote);
     · 'garita'   → la garita y la Administración;
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
    ['p', 'La app del barrio {BARRIO} junta en un solo lugar lo que antes estaba desparramado en grupos de WhatsApp, llamadas a la garita y papeles: <b>las visitas, los paquetes, las expensas, los avisos de la guardia, las reservas, el pizarrón, las votaciones</b> y la información útil de Ushuaia.'],
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
      'Poné tu <b>correo</b> y, si querés, tu teléfono o WhatsApp.',
      'Si querés que los vecinos te encuentren por tu profesión u oficio, escribilo y marcá "Publicarlo" (es opcional y lo podés cambiar después).',
      'Elegí una <b>contraseña</b> de al menos 6 caracteres. Es solo tuya.',
      'Leé y marcá las dos casillas de privacidad y de términos de uso.',
      'Tocá <b>"Enviar mi inscripción"</b>.',
    ]],
    ['p', 'La Administración revisa que seas del lote y te habilita. Te llega un correo cuando está lista. Mientras tanto la app dice "En revisión": podés cerrarla tranquilo.'],
    ['h', 'Para entrar'],
    ['pasos', ['Escribí tu correo y tu contraseña.', 'Tocá el botón <b>Entrar</b>.']],
    ['ojo', 'info', 'Siempre con el botón Entrar', 'Por seguridad, la app entra solo cuando tocás "Entrar". Si el teléfono completa solo el correo y la contraseña, igual hay que tocar el botón.'],
    ['h', '¿Te olvidaste la contraseña?'],
    ['p', 'En la pantalla de ingreso tocá <b>"Olvidé mi contraseña"</b>: te llega un correo para elegir una nueva. Revisá también la carpeta de correo no deseado.'],
  ] },

  { id:'pantalla', icon:'grid', color:'sky', para:'todos', t:'Conocer la pantalla', s:'El encabezado, la portada y cómo moverte', b:[
    ['h', 'El encabezado (la franja de arriba)'],
    ['lista', [
      '<b>El escudo del barrio</b>: tocándolo volvés siempre a la portada.',
      '<b>Tu nombre y tu lote</b>, con un <b>puntito</b>: verde es que estás conectado con el barrio; amarillo, que se está conectando; rojo, que no hay conexión (lo que hagas se manda cuando vuelva).',
      '<b>La campanita</b>: los avisos que todavía no viste, con un número.',
      '<b>Tu foto o tus iniciales</b>: abre <b>Tu cuenta</b> (contraseña, modo día/noche, actualizar la app, cerrar sesión).',
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
    ['p', 'La <b>Pizarra del día</b> es lo primero que conviene mirar al abrir la app. Muestra en renglones cortos lo importante de hoy: avisos de la guardia y de la Administración, comunicados, el camión de la basura, el clima que complica, obras, viajes compartidos, compras conjuntas y lo que es <b>para vos</b> (un paquete, tus expensas, un mensaje, una visita).'],
    ['h', 'Los colores'],
    ['lista', ['<b>Rojo</b>: importante.', '<b>Amarillo</b>: para tener en cuenta.', '<b>Verde</b>: para saber.']],
    ['p', 'Lo que todavía no leíste <b>titila</b> en su color. Al tocarlo se abre y queda quieto. Arriba, un semáforo cuenta cuántos avisos sin leer hay de cada color.'],
    ['p', 'Se ven los primeros renglones; tocá <b>"Ver todo"</b> para ver la pizarra completa en dos columnas: <b>Para todo el barrio</b> y <b>Para vos</b>.'],
    ['ojo', 'info', 'Lo que pide una decisión tuya va arriba de todo', 'Si alguien pregunta por vos en la garita, si una visita te pide un pase o si tenés una alerta abierta, aparece arriba con sus botones ("Que pase", "Aprobar", "Ya está solucionado"). Eso no queda escondido en una lista.'],
    ['h', 'La campanita'],
    ['p', 'Guarda los avisos que <b>todavía no viste</b>. Al abrir uno, te lleva a donde corresponde y deja de contarse. Con <b>"Marcar todos como vistos"</b> la vaciás de una vez.'],
  ] },

  { id:'avisos', icon:'bell', color:'ok', para:'todos', t:'Activar los avisos al celular', s:'Para enterarte con el teléfono bloqueado', b:[
    ['p', 'Los avisos al celular (también llamados "notificaciones push") te llegan <b>aunque tengas la app cerrada y el teléfono bloqueado</b>: el camión de la basura, un paquete para tu lote, un SOS, un aviso urgente de la Administración o lo que escribe la guardia.'],
    ['pasos', [
      'En iPhone, primero <b>instalá la app</b> (capítulo "Instalar la app en el teléfono"). Sin instalar, el iPhone no los deja llegar.',
      'Entrá a <b>Tu casa → Mi casa</b> (o tocá la tarjeta "Activá los avisos" que aparece en la portada).',
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
      'Entrá a <b>Ushuaia y servicios → Emergencias</b>.',
      'Al lado del corazón rojo, <b>mantené apretado 2 segundos</b> el botón verde <b>SOLICITARLO</b>.',
      'Contestá <b>SÍ</b>. A la garita le salta una alarma con tu apellido y tu lote hasta que sale con el DEA; a vos te avisa cuando va en camino.',
      'Llamá además al <b>911</b> o al <b>107</b>.',
    ]],
    ['h', 'Teléfonos'],
    ['p', 'En Emergencias están, a un toque, el 911, el 107, el 100, el 101, la garita, la Administración, hospitales y farmacias. Tocar un número lo llama.'],
  ], ir:[['abrir', 'emergencias', 'Ir a Emergencias']] },

  { id:'visitas', icon:'qr', color:'brand', para:'vecinos', t:'Autorizar una visita', s:'Código y QR para la garita', b:[
    ['pasos', [
      'Entrá a <b>Tu casa → Autorizar una visita</b>.',
      'Elegí quién viene: visita, delivery, proveedor u obra, personal fijo o remís/taxi.',
      'Escribí el <b>nombre</b> (o la empresa). El DNI y la patente son opcionales, pero ayudan a la guardia.',
      'Poné el <b>día</b> y el <b>horario</b> en que viene.',
      'Si viene <b>varias veces</b> (empleada, jardinero, personal de una obra), marcá "Viene varias veces", elegí los días y hasta qué fecha: es <b>un solo QR</b> para todos esos días.',
      'Si querés, dejá una nota para la guardia (por ejemplo "deja la caja en la puerta").',
      'Tocá <b>"Crear el pase"</b>. Aparece el pase con un <b>código de 6 números</b> y un <b>QR</b>.',
      'Tocá <b>"Enviar por WhatsApp"</b> para mandárselo a quien viene. En la garita muestra el QR o dicta el código.',
    ]],
    ['p', 'La garita lo ve al instante, con tu nombre como quien autorizó. Cuando la visita entra y cuando sale, te llega un aviso.'],
    ['h', 'Mis visitas'],
    ['p', 'En <b>Tu casa → Mis visitas</b> ves las de hoy y las próximas. Cada una se puede ver, reenviar, <b>editar</b>, <b>cancelar</b> o sacar de tu lista. Las visitas viejas no se pierden: pasan a tu historial ("Ver mi historial completo").'],
    ['h', 'Alguien llegó sin avisar'],
    ['p', 'Si alguien se presenta en la garita preguntando por vos, te aparece arriba de todo con sonido: tocá <b>"Que pase"</b> o <b>"No lo conozco"</b>. La guardia ve tu respuesta al instante.'],
    ['h', 'Si el pase vence'],
    ['p', 'Pasada la hora del pase, la garita ya no puede registrar el ingreso con ese pase. Si la persona llega tarde, la garita te pregunta ("Que pase" / "No lo conozco"); si no vino, te avisa que venció, y lo podés editar con otro horario desde Mis visitas.'],
  ], ir:[['nuevo-pase', '', 'Autorizar una visita'], ['abrir', 'visitas', 'Mis visitas']] },

  { id:'paquetes', icon:'box', color:'wood', para:'vecinos', t:'Paquetes', s:'Cuándo llegan, la foto y cómo retirarlos', b:[
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
  ], ir:[['abrir', 'mis-paquetes', 'Mis paquetes']] },

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
    ['h', 'Si pagaste por fuera de la app'],
    ['pasos', [
      'Tocá <b>"Ya pagué por fuera de la app"</b>.',
      'Poné el importe y la fecha, y adjuntá el comprobante (PDF, foto o captura).',
      'El pago queda <b>"por acreditar"</b>. Cuando la Administración lo confirma, te llega el <b>recibo</b>.',
    ]],
    ['p', 'Lo que pagás con "Pagar online ahora" no hace falta avisarlo: se descuenta solo.'],
    ['h', 'Las cuentas del barrio'],
    ['p', 'En <b>El barrio → Las cuentas del barrio</b> ves en qué se gasta mes a mes y la morosidad general, sin nombres.'],
  ], ir:[['abrir', 'expensas', 'Mis expensas']] },

  { id:'reservas', icon:'calendar', color:'ok', para:'vecinos', t:'Reservar el quincho, el SUM o la cancha', s:'Espacios comunes', b:[
    ['pasos', [
      'Entrá a <b>Tu casa → Reservas</b>.',
      'Elegí el espacio: <b>Quincho</b>, <b>SUM</b> o <b>Cancha</b>.',
      'Elegí el día y el turno. Los turnos ocupados se ven en gris.',
      'Poné cuántos invitados vienen y confirmá. Leé el reglamento del espacio que aparece ahí.',
    ]],
    ['p', 'Podés tener hasta dos reservas a futuro y reservar con hasta un mes de anticipación. La víspera te llega un recordatorio, y al terminar la app te pregunta en un toque cómo quedó el espacio.'],
    ['p', 'Si no podés ir, cancelá la reserva desde la misma ventana para que la use otro vecino.'],
  ], ir:[['abrir', 'reservas', 'Reservas']] },

  { id:'mensajes', icon:'chat', color:'accent', para:'vecinos', t:'Mensajes, peticiones y reclamos', s:'Hablar con la Administración, la garita y los vecinos', b:[
    ['h', 'Mensajes privados'],
    ['p', 'En <b>Tu casa → Mensajes</b> están tus conversaciones privadas:'],
    ['lista', [
      '<b>Con la Administración</b>: solo la leen vos y la Administración.',
      '<b>Con la guardia</b>: solo la leen vos y la garita.',
      '<b>Con otro vecino</b>: buscalo por nombre, lote u oficio y escribile. Solo lo leen ustedes dos.',
    ]],
    ['h', 'Peticiones a la garita (con firma)'],
    ['p', 'Para pedidos que conviene dejar por escrito: recibir paquetes mientras no estás, <b>no dejar pasar a alguien</b>, avisar que <b>te vas de viaje</b>, dejar o retirar una llave, un permiso especial de ingreso.'],
    ['pasos', ['Entrá a <b>Tu casa → Peticiones a la garita</b> y tocá "Nueva petición".', 'Elegí el tipo, escribí el pedido y las fechas.', '<b>Firmá con el dedo</b> en el recuadro y tocá "Firmar y enviar".', 'El guardia la recibe y la firma. Te llega el aviso de que está "en funciones".']],
    ['p', 'Cada petición guarda las dos firmas, la hora y un sello digital que prueba que nadie la cambió.'],
    ['h', 'Reclamos'],
    ['p', 'En <b>Tu casa → Mis reclamos</b>. Son privados: los ven vos y la Administración, que te contesta por ahí. Si el problema es de varios, la Administración puede publicarlo en el pizarrón.'],
  ], ir:[['abrir', 'mensajes', 'Mensajes'], ['abrir', 'peticiones', 'Peticiones'], ['abrir', 'reclamos', 'Mis reclamos']] },

  { id:'micasa', icon:'home', color:'ok', para:'vecinos', t:'Mi casa y mi credencial', s:'Tus datos, tu familia, autos y mascotas', b:[
    ['p', 'En <b>Tu casa → Mi casa</b> cargás lo que le sirve a la guardia y al barrio. Todo es opcional y lo cambiás cuando quieras:'],
    ['lista', [
      'Tu relación con el lote (propietario, cotitular, inquilino, familiar). Si sos inquilino y el propietario te da una carta poder, la subís para poder votar.',
      'Tu teléfono o WhatsApp, tu profesión u oficio (y si querés mostrarlos al barrio).',
      'Quiénes viven en la casa, la dirección y la ubicación exacta (sirve para "Cómo llegar" en una emergencia).',
      '<b>Tus autos</b> con la patente: la garita los reconoce.',
      '<b>Tus mascotas</b>, con foto.',
      '<b>La foto del frente de tu casa</b>: la usa la garita para ubicar tu domicilio.',
      '<b>Me voy de viaje</b>: la guardia suma tu casa a la lista de "casas solas" y hace rondas. Nadie más lo ve.',
      'Los avisos al celular (Activar avisos).',
    ]],
    ['h', 'Mi credencial'],
    ['p', 'En <b>Tu casa → Mi credencial</b> tenés un QR personal para identificarte en la garita o en los espacios comunes. No lleva tu DNI. Si alguien lo copió, generá uno nuevo y el anterior deja de valer. (Para retirar paquetes se usa el QR de retiro, no la credencial.)'],
  ], ir:[['abrir', 'perfil', 'Mi casa'], ['mi-credencial', '', 'Mi credencial']] },

  { id:'barrio', icon:'muro', color:'brand', para:'vecinos', t:'El barrio: la vida entre vecinos', s:'Pizarrón, chat, votaciones, obras y más', b:[
    ['lista', [
      '<b>Pizarrón</b>: los avisos de la guardia, la Administración y los vecinos. Podés publicar algo (una novedad, un evento, algo perdido o encontrado).',
      '<b>Chat vecinal</b>: con canales (#general, #seguridad, #mascotas). <b>No se escriben nombres ni apellidos</b> de vecinos, de la Administración ni de la garita: se nombra el lote ("el Lote 148"). La app no deja enviar un mensaje con un nombre.',
      '<b>Vecinos</b>: buscá a alguien por nombre, lote, oficio o dirección y escribile en privado.',
      '<b>Votaciones</b>: votá desde la app. Vota el titular del lote (un voto por lote); si son varios titulares y votan distinto, el voto del lote no se cuenta.',
      '<b>Obras</b>: registrá tu obra ("Registrar mi obra") y, los días con mixer o camión, mandá el "Aviso del día". Todos se enteran en la pizarra.',
      '<b>Viajes compartidos</b>: ofrecé o buscá lugar para ir al centro, la escuela o el aeropuerto.',
      '<b>Profesionales y oficios</b>: los vecinos que ofrecen su profesión u oficio, con su WhatsApp.',
      '<b>Mascotas</b>: perdidas, encontradas y las del barrio.',
      '<b>Compras conjuntas</b>: sumarse a una compra entre varios (leña, gas…).',
      '<b>Normas y reglamentos</b>: el reglamento, la convivencia y las normas que rigen el barrio, con un buscador ("¿hasta qué hora puedo hacer obra?"). Cada una se puede <b>descargar</b> para imprimir o guardar en PDF, o todas juntas.',
      '<b>Las cuentas del barrio</b>: en qué se gasta, mes a mes.',
      '<b>Residuos</b>: los días del camión. {RESIDUOS} La víspera la pizarra avisa "Mañana pasa el camión" y cuando la garita registra la entrada, te llega el aviso "Entró el camión".',
      '<b>Descargas</b>: aplicaciones, instructivos y planillas que comparte la Administración.',
      '<b>Manual de uso</b>: este manual.',
    ]],
  ], ir:[['abrir', 'comunidad', 'Ir a El barrio'], ['abrir', 'documentos', 'Normas y reglamentos']] },

  { id:'ciudad', icon:'pin', color:'sky', para:'vecinos', t:'Ushuaia y servicios', s:'Lo de afuera que igual te toca', b:[
    ['lista', [
      '<b>Emergencias</b>: teléfonos a un toque y el pedido del DEA.',
      '<b>Agenda de Ushuaia</b>: comidas, taxis, supermercados, farmacias y oficios, con buscador y WhatsApp.',
      '<b>Cruceros</b>: los que llegan y salen del puerto hoy y los próximos días.',
      '<b>Ushuaia hoy</b>: el clima, las temporadas, los feriados y los eventos de la ciudad.',
      '<b>Vuelos USH</b>: arribos y partidas del aeropuerto de hoy.',
      '<b>Municipalidad de Ushuaia</b>: atajos a trámites, reclamos urbanos, tasas y servicios en el sitio oficial.',
      '<b>Sismos</b>: los movimientos de la región, en vivo.',
    ]],
  ], ir:[['abrir', 'ciudad', 'Ir a Ushuaia y servicios']] },

  { id:'cuenta', icon:'user', color:'accent', para:'todos', t:'Tu cuenta', s:'Contraseña, modo noche, actualizar y salir', b:[
    ['p', 'Tocá <b>tu foto o tus iniciales</b> arriba a la derecha:'],
    ['lista', [
      '<b>Modo de pantalla</b>: automático (se oscurece cuando se pone el sol en Ushuaia), día o noche.',
      '<b>Cambiar mi contraseña</b> y <b>cambiar mi correo</b>.',
      '<b>Preguntas frecuentes</b> y este manual.',
      '<b>Actualizar la app</b>: si algo quedó raro o no abre una ventana. Baja todo de nuevo; tus datos no se pierden.',
      '<b>Cerrar sesión</b>: salís de la app en ese equipo. Por seguridad, también se borra la llave de tu QR de retiro en ese equipo.',
    ]],
  ], ir:[['mi-cuenta', '', 'Abrir Tu cuenta']] },

  { id:'datos', icon:'lock', color:'brand', para:'vecinos', t:'Tus datos y tu privacidad', s:'Quién ve qué', b:[
    ['lista', [
      'Los demás vecinos ven tu <b>nombre y tu lote</b> en el pizarrón y el chat. Tu teléfono, tu profesión y tu dirección, <b>solo si vos elegís compartirlos</b>.',
      'Tus mensajes privados, tus reclamos, tus pagos y tus paquetes <b>no los ve ningún otro vecino</b> (los paquetes y las expensas, solo las cuentas de tu mismo lote).',
      'La garita ve lo que necesita para su trabajo (visitas, paquetes, peticiones). La Administración, lo que necesita para administrar.',
      'Las fotos buenas no quedan en la base del barrio: viaja una vista previa y la foto se baja solo cuando alguien la toca.',
    ]],
    ['p', 'Por la <b>Ley 25.326</b> podés pedir ver, corregir o borrar tus datos: en <b>Mi casa → Mis datos personales</b> descargás una copia o pedís la baja.'],
    ['p', 'Los <b>términos de uso</b>, lo que dice la ley sobre tus datos y el deslinde de responsabilidad se abren tocando <b>"by Claudio A. Ravasi"</b> al pie de la portada, y en Preguntas frecuentes → "Tus datos: privacidad y seguridad".'],
  ], ir:[['abrir', 'ayuda', 'Preguntas frecuentes'], ['abrir', 'legal', 'Términos de uso']] },

  { id:'problemas', icon:'wrench', color:'warn', para:'todos', t:'Si algo no anda', s:'Soluciones rápidas', b:[
    ['lista', [
      '<b>Una ventana no abre o la app quedó rara</b>: Tu cuenta → <b>Actualizar la app</b>.',
      '<b>No me llegan los avisos</b>: revisá el capítulo "Activar los avisos al celular". En iPhone, la app tiene que estar instalada.',
      '<b>El puntito del encabezado está rojo</b>: no hay internet. Lo que hagas se manda solo cuando vuelva la conexión.',
      '<b>La app me pide entrar de nuevo</b>: en iPhone pasa si no está instalada (Safari borra lo guardado). Instalala desde Safari.',
      '<b>Me olvidé la contraseña</b>: "Olvidé mi contraseña" en la pantalla de ingreso.',
      '<b>No encuentro algo</b>: usá el buscador de este manual, las Preguntas frecuentes, o escribile a la Administración desde Tu casa → Mensajes.',
    ]],
  ], ir:[['actualizar-app', '', 'Actualizar la app']] },

  /* ---------- Para la garita ---------- */
  { id:'garita', icon:'gate', color:'brand', para:'garita', t:'Para la garita', s:'El turno, los ingresos, los paquetes y la ronda', b:[
    ['ojo', 'info', 'Las tareas de la garita son solo de la garita', 'Registrar ingresos y salidas, paquetes, el camión, el policía y sus rondas, la bitácora, firmar peticiones y atender un SOS lo hace únicamente la cuenta de la garita. La Administración lo ve en vivo, pero no lo toca.'],
    ['h', 'Empezar y cerrar el turno'],
    ['pasos', ['Al abrir, anotá <b>quiénes están de guardia</b> en este turno. Hasta que no lo hacés, la única ventana es la del turno.', 'Al terminar, tocá <b>"Cerrar el turno"</b>: dejás las novedades para el que entra. La sesión no se cierra: queda lista para el turno siguiente.']],
    ['h', 'Validar un ingreso'],
    ['pasos', ['Escribí el <b>código de 6 números</b>, la <b>patente</b> o el <b>DNI</b>, o tocá <b>"Escanear QR"</b>.', 'La app dice si el pase es para hoy y para este horario, quién lo autorizó y si hay una restricción firmada ("no dejar pasar").', 'Tocá <b>"Ingresó"</b>; cuando se va, <b>"Salió"</b>. Al vecino le llega el aviso.']],
    ['p', 'Si alguien llega sin aviso: <b>"Llegó sin aviso"</b>, elegí la casa y el motivo. Al vecino le salta "Que pase / No lo conozco" y ves la respuesta al instante.'],
    ['p', '<b>Pase vencido</b>: si ya pasó el horario del pase, "Ingresó" queda deshabilitado y aparece <b>"Pase vencido"</b>. Si la persona está en la garita, elegí "preguntarle al vecino" (le salta "Que pase / No lo conozco"); si no vino, "solo avisarle que venció".'],
    ['h', 'El Hotel Los Cauquenes'],
    ['p', 'En la portada de la garita está la banda del hotel: sus <b>vans</b> (tocá "Entró"/"Salió" o leé su QR), los <b>traslados</b> del día, los <b>huéspedes</b> que llegan (con "Ingresó") y sus <b>eventos</b>. Sus proveedores también tienen QR: con la ART vencida, no pasan. Una patente de una van, un proveedor o un huésped del hotel se reconoce sola en el validador.'],
    ['h', 'Paquetes'],
    ['pasos', ['<b>"Llegó un paquete"</b>: elegí para quién, la empresa, un detalle y sacale una foto a la etiqueta.', 'Al guardar, se avisa a todas las cuentas de ese lote.', 'Para entregar: <b>"Entregar"</b> → <b>"Leer el QR de retiro del vecino"</b>. Si la firma es válida, compará la persona con la foto y tildá los paquetes.', 'Sin teléfono: <b>"Sin teléfono: firma y DNI"</b>. Si retira otra persona, elegí "Otra persona" y anotá su nombre y DNI.']],
    ['h', 'El camión, el policía y la ronda'],
    ['lista', ['<b>Camión de la basura</b>: registrá la entrada (patente) y la salida. A todo el barrio le llega el aviso.', '<b>Policía contratada</b>: registrá su ingreso; la app genera un código de ronda para mandarle por WhatsApp. Con los QR de los puntos de control, la ronda se anota sola; también se puede anotar a mano. Al irse, registrá la salida.', '<b>Bitácora</b>: el libro de guardia. Lo que se anota no se borra; si hace falta, marcá que le suene a la Administración.']],
    ['h', 'Peticiones y SOS'],
    ['p', 'Las peticiones de los vecinos se reciben con <b>tu firma</b> en la pantalla. Ante un SOS: <b>"Voy en camino"</b> y, al terminar, <b>"Ya la atendimos"</b> (el vecino confirma que está solucionado).'],
    ['p', 'Para hablar con la Administración: <b>Administración</b> en las tejas de la garita (canal interno). Con los vecinos, por <b>Mensajes con vecinos</b> y las peticiones: la garita no usa el chat vecinal, que es entre vecinos.'],
  ], ir:[['abrir', 'garita', 'Ir a la Garita'], ['abrir', 'bitacora', 'Bitácora']] },

  /* ---------- Para el hotel ---------- */
  { id:'hotel', icon:'star', color:'wood', para:'hotel', t:'Para el Hotel Los Cauquenes', s:'Vans, traslados, huéspedes, eventos y más', b:[
    ['h', 'Cómo entra el hotel'],
    ['p', 'El hotel tiene <b>una sola cuenta</b>, que usa la recepción en la computadora y en el celular de turno. La crea la Administración del barrio. La primera vez, entrá con el correo y la contraseña que te pasaron y cambialos en <b>Tu cuenta</b> (tu ícono arriba a la derecha): "Cambiar mi correo" y "Cambiar mi contraseña". Si la persona responsable deja el hotel, cambiá la contraseña.'],
    ['ojo', 'info', 'Qué ve el hotel y qué no', 'Ve lo suyo (vans, traslados, huéspedes, eventos, proveedores, promociones) y lo público de la ciudad (vuelos, cruceros, eventos, agenda, normas del barrio). No ve nada de los vecinos: ni el padrón, ni el chat, ni el pizarrón, ni sus visitas, ni los SOS.'],
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
      '<b>Promociones</b>: las proponés vos y las publica la Administración en la tira del hotel de la app de los vecinos.',
    ]],
    ['h', 'Emergencias'],
    ['p', 'El botón rojo <b>"Garita"</b> de arriba a la derecha avisa a la garita al instante (médica, seguridad, incendio). En <b>Emergencias</b> están los teléfonos y el plan del hotel: su DEA, el personal con primeros auxilios y el punto de encuentro. Si hay una emergencia médica en el barrio, la garita puede pedirte el DEA: te llega el aviso con el lote.'],
    ['h', 'Mensajes, hoja del día y convenio'],
    ['lista', ['<b>Administración</b> y <b>Garita</b>: mensajes privados con cada una.', '<b>Hoja del día</b>: vuelos, cruceros, eventos y traslados listos para imprimir y dejar en el mostrador.', '<b>Convenio con el barrio</b>: el modelo de convivencia y servicios, para revisar con un abogado y aprobar en asamblea.']],
  ], ir:[['abrir', 'hotel-traslados', 'Vans y traslados'], ['abrir', 'hotel-huespedes', 'Huéspedes'], ['abrir', 'hotel-ficha', 'Ficha del hotel']] },

  /* ---------- Para la Administración ---------- */
  { id:'admin', icon:'sliders', color:'accent', para:'admin', t:'Para la Administración', s:'Dos brazos, el día a día y el alcance con la garita', b:[
    ['h', 'Dos brazos'],
    ['p', 'Quien administra y además vive en el barrio elige al entrar si está como <b>vecino</b> o como <b>Administración</b>, y cambia con el botón del encabezado. En modo Administración solo se ve la gestión; en modo vecino, solo lo de vecino.'],
    ['h', 'Día a día, por salas'],
    ['lista', ['<b>Garita y seguridad</b>: la garita en vivo, la bitácora, los turnos, los mensajes con la garita y los ingresos frecuentes.', '<b>Vecinos</b>: padrón, mensajes, reclamos, infracciones, votaciones y obras.', '<b>Comunicación</b>: comunicados importantes (con acuse), el pizarrón y los avisos urgentes por zona.', '<b>Proveedores y cumplimiento</b>: ART y seguros, y protección de datos.', '<b>Hotel Los Cauquenes</b>, al final: el hotel en vivo, sus promociones, eventos y proveedores, los mensajes con el hotel y su cuenta.']],
    ['h', 'El alcance con la garita'],
    ['ojo', 'info', 'La Administración mira la garita; no la opera', 'La Administración ve en tiempo real los ingresos, los paquetes, el camión, el policía, la bitácora, las peticiones y los SOS, pero no registra, no entrega, no firma ni escribe en el libro de guardia: eso es exclusivo de la cuenta de la garita. Así no se pisan datos ni responsabilidades.'],
    ['lista', ['<b>Sí es de la Administración</b>: los horarios de los turnos, los puntos de control de la ronda (y sus QR), las zonas para avisos, los proveedores habilitados, los ingresos frecuentes y el control mensual de horas y rondas del policía.', '<b>Para pedirle algo a la garita</b>: "Mensajes con la garita" (canal interno). Le llega al instante, con sonido.']],
    ['h', 'El Hotel Los Cauquenes'],
    ['p', 'La sala del hotel en el Día a día: el hotel en vivo (sin los nombres de sus huéspedes), sus promociones para publicar o no, sus eventos (avisar a los vecinos si lo pide), sus proveedores (revisar o suspender), los mensajes con la recepción, la <b>Cuenta del hotel</b> (el hotel se inscribe como cualquier usuario y su inscripción pendiente se convierte en la del hotel; los vecinos aprobados no aparecen en esa lista; una vez hecha, el hotel cambia su correo y su contraseña en Tu cuenta) y el <b>modelo de convenio</b>. Si el hotel declara su DEA, desde Emergencias del hotel se publica para los vecinos.'],
    ['h', 'Expensas y contabilidad'],
    ['p', 'Las facturas del mes se cargan en <b>Contabilidad</b>; al cerrar el mes se arman los cupones. En <b>Expensas</b> se ven los lotes, se confirman los pagos informados, se emiten recibos y se sigue la morosidad.'],
    ['p', '<b>Probar Mercado Pago</b>: en tu vista de vecino, en Expensas, el botón <b>"Probar el pago con Mercado Pago"</b> (solo lo ve quien administra) cobra el importe de tu último cupón aunque estés al día. Se paga con una tarjeta de prueba (titular APRO) y queda en <b>Pagos de PRUEBA</b>: no cambia tu saldo ni saca recibo, y se borra con un toque en Expensas → Pagos.'],
  ], ir:[['abrir', 'gestion', 'Gestión del barrio']] },
];

/* ¿Este capítulo lo ve quien está mirando? */
function manualParaMi(c){
  const rol = yo()?.rol;
  /* El hotel: su capítulo y lo general que le sirve. */
  if (rol === 'hotel') return c.para === 'hotel' || ['instalar', 'avisos', 'cuenta', 'problemas'].includes(c.id);
  if (c.para === 'hotel') return rol === 'admin';
  if (c.para === 'todos') return true;
  if (rol === 'admin') return true;
  if (rol === 'guardia') return c.para === 'garita';
  return c.para === 'vecinos';
}
const manualCaps = () => MANUAL_CAPS.filter(manualParaMi);

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
R.manual = {
  titulo:'Manual de uso', icon:'book', color:'accent', sub:'Paso a paso, para todos los vecinos',
  render(q){
    const todos = manualCaps(), qq = normTxt(q || '').trim();
    const pal = qq.split(/\s+/).filter(w => w.length > 2);
    const lista = pal.length ? todos.filter(c => { const p = manualPlano(c); return pal.every(w => p.includes(w)); }) : todos;
    const ir = c => (c.ir || []).filter(([a, v]) => a !== 'abrir' || typeof ventanaPermitida !== 'function' || ventanaPermitida(v))
      .map(([a, v, t]) => `<button class="btn btn-sm btn-sec" data-a="${a}" data-v="${esc(v)}">${esc(t)}${I('right')}</button>`).join('');
    return `<div class="man-intro"><span class="man-intro-ic">${I('book')}</span><div><b>Cómo usar la app, paso a paso</b>
        <span>${plural(todos.length, 'capítulo')}. Tocá uno para abrirlo; tocalo de nuevo para cerrarlo. Arriba podés buscar cualquier palabra.</span></div></div>
      <form data-f="buscar-manual" class="linea-form" style="margin:0 0 10px"><input name="q" id="qManual" value="${esc(q || '')}" placeholder="Buscar: visita, paquete, expensas, contraseña…" autocomplete="off"><button class="btn btn-pri" aria-label="Buscar">${I('search')}</button></form>
      ${pal.length ? `<p class="muted small" style="margin:0 0 10px">${lista.length ? `${plural(lista.length, 'capítulo')} con "${esc(q)}".` : ''} <button class="link" data-a="abrir" data-v="manual">Ver todo el manual</button></p>` : ''}
      ${lista.length ? lista.map((c, i) => `<details class="man-cap card" data-cap="${esc(c.id)}" ${pal.length || Manual.abierto === c.id ? 'open' : ''}>
          <summary><span class="man-n">${todos.indexOf(c) + 1}</span><span class="man-ic ic-${c.color}">${I(c.icon)}</span>
            <span class="man-tit"><b>${manualResaltar(esc(c.t), qq)}</b><small>${esc(c.s)}${c.para === 'garita' ? ' · garita y Administración' : c.para === 'admin' ? ' · solo la Administración' : ''}</small></span>${I('right')}</summary>
          <div class="man-cuerpo">${manualBloques(c, qq)}${ir(c) ? `<div class="btns man-ir">${ir(c)}</div>` : ''}</div></details>`).join('')
        : vacio('search', 'No encontramos eso en el manual. Probá con otra palabra ("visita", "paquete", "pagar") o mirá las Preguntas frecuentes.')}
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
