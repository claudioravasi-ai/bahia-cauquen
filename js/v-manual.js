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
    ['h', 'El recorrido de bienvenida'],
    ['p', 'La primera vez que entrás, la app <b>ilumina uno por uno los botones más importantes de tu pantalla</b> y explica para qué sirve cada uno. Tocá <b>"Siguiente"</b> para avanzar, <b>"Atrás"</b> para volver o <b>"Saltar"</b> si ya la conocés. Es distinto para vecinos, garita, Administración, supervisión y hotel. Aparece una sola vez en cada teléfono; para verlo otra vez, en el <b>Manual de uso</b> tocá <b>"Ver el recorrido de bienvenida"</b>.'],
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
      '<b>El escudo del barrio</b>: tocándolo volvés siempre a la portada y la app te saluda con la hora y el clima. Si activaste el <b>asistente por voz</b>, después del saludo le podés pedir cosas ("avisale a la garita que llego tarde", "¿cuándo pasa el camión?"). En <b>iPhone y iPad</b> el micrófono se abre solo al tocar su botón, y el "sí" de una confirmación se toca. Si no te escucha, se corta solo a los pocos segundos; tocar cualquier otra parte de la app también lo corta. La <b>garita</b> tiene sus propios pedidos por voz (ver su capítulo).',
      '<b>Tu nombre y tu lote</b>, con un <b>puntito</b>: verde es que estás conectado con el barrio; amarillo, que se está conectando; rojo, que no hay conexión (lo que hagas se manda cuando vuelva).',
      'Debajo de tu nombre, <b>"Manual de uso interactivo"</b>: se abre aparte (en otra pestaña) <b>la app de verdad con datos de ejemplo</b> y, al costado, una guía que te marca <b>qué tocar</b> en cada función, paso a paso (el botón titila y lo demás se oscurece). A la izquierda está el menú desplegable para saltar de función en función, por perfil: vecinos, garita, Administración, hotel y supervisión. Los vecinos, la garita y la Administración ven todas las funciones; el hotel y la supervisión, las suyas y lo que hacen con la garita. Se avanza tocando en la app o con <b>"Hacelo por mí"</b>, y todo funciona igual que en la app. Es para practicar: no se conecta a la base del barrio, no le llega nada a nadie y no cambia tu sesión; lo que practicás queda solo en tu teléfono y se borra con <b>"Empezar de cero"</b>. <b>"Regresar a la app"</b> te devuelve a donde estabas.',
      '<b>La campanita</b>: los avisos que todavía no viste, con un número.',
      '<b>Tu foto o tus iniciales</b>: abre <b>Tu cuenta</b> (contraseña, correo, modo día/noche, avisos al celular, tus datos personales, actualizar la app, cerrar sesión).',
      '<b>El botón rojo SOS</b>: para una emergencia (ver el capítulo Emergencias).',
    ]],
    ['h', 'La portada, de arriba hacia abajo'],
    ['lista', [
      'La foto del barrio, con el aviso del <b>DEA</b> (desfibrilador) que está en la garita, arriba a la derecha.',
      'Arriba a la izquierda, <b>"De guardia"</b> con las caritas y los nombres de <b>quienes están ahora en la garita</b>, en tiempo real (cambia sola cuando entra o sale cada guardia). Tocala: se ve la garita con los guardias dibujados (saludan), el horario de cada uno y si hay <b>policía nocturna</b> de servicio, con "Escribirle a la garita" y, si está cargado, "Llamar a la garita". Debajo, <b>"La ronda del policía"</b>: el plano del barrio con el recorrido numerado por las calles y tres anillos (Ronda 1, 2 y 3: la meta de la noche) que se completan en verde con la hora de cada ronda. La ronda que está en curso se ve <b>en vivo</b> (dice "En vivo" en rojo) y sin el nombre del policía: cada punto que ya leyó queda <b>verde y fijo</b> con la hora, y los que le faltan <b>titilan</b>. Si la Administración le puso una demora (5, 10 o 15 minutos), lo dice abajo del plano.',
      'Mientras el <b>personal de mantenimiento del barrio</b> está trabajando, debajo de la foto aparece una <b>cápsula oscura con una luz de colores que le recorre el borde</b>: adentro, un dibujito animado con las montañas (de día con sol, de noche con luna y estrellas) y un operario de casco por cada persona trabajando. Al lado dice <b>"Mantenimiento · 2 trabajando ahora"</b>, desde qué hora y hace cuánto (el reloj corre solo), y los cascos de colores. Se va sola cuando la garita marca la salida del último. Tocala: se abre <b>Mantenimiento en vivo</b>, con el mapa de lo que están haciendo y un botón para escribirles (ver el capítulo "Mantenimiento en vivo").',
      '<b>Próximos días y Luz del día</b>: el pronóstico y una barra con la hora de salida y puesta del sol; el punto rojo es la hora actual.',
      '<b>La Pizarra del día</b>: lo importante de hoy (ver el capítulo siguiente).',
      '<b>Por dónde seguir</b>: tres puertas grandes, <b>Tu casa</b>, <b>El barrio</b> y <b>Ushuaia y servicios</b>. Adentro de cada una está todo lo demás.',
      'Al pie, <b>Ushuaia hoy</b> en un mosaico de tarjetas: una grande con lo que cambia el día (un feriado, el crucero que recala, un evento) y otras chicas con un número (cuántos días faltan para una temporada, el próximo feriado, los vuelos de hoy). Tocá cualquiera para ver todo.',
      'Debajo, la <b>postal del Hotel Los Cauquenes</b>: el descuento bien grande y la propuesta para los vecinos. Si hay varias, cambia sola cada pocos segundos ("1 de 4"); tocala para ver la propuesta completa.',
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
    ['p', '<b>Los avisos que piden una decisión se van solos cuando se resuelve</b>, en todos los teléfonos, también de la bandeja de notificaciones: "Llegó sin aviso" cuando alguien del lote contesta, "Te piden un pase" cuando se aprueba o se rechaza, "Llegó un paquete" cuando se retira, la petición cuando la garita la firma, el pago informado cuando la Administración lo acredita o lo rechaza, la inscripción cuando se aprueba y el reclamo cuando lo toman. Así no queda nada que parezca pendiente cuando ya no lo está.'],
    ['h', 'Cortes de luz, agua y gas'],
    ['p', 'Todos los días a las <b>6 de la mañana</b> y a las <b>11 de la noche</b> la app busca sola los cortes anunciados: los de agua de la <b>DPOSS</b> y los comunicados de la <b>DPE</b> (luz) y de <b>Camuzzi</b> (gas) que publican los diarios de Ushuaia. Solo aparece lo que <b>toca al barrio</b> (lo nombra) o es <b>para toda la ciudad</b>; lo demás no. Sale en la Pizarra del día y en el pizarrón con su ícono <b>titilando</b>: una <b>lamparita</b> si es de luz, una <b>gotita</b> si es de agua y una <b>llamita</b> si es de gas. Va en amarillo antes del corte y en rojo mientras dura, con el día, el horario si lo dice, de dónde salió y "ver la nota".'],
    ['p', 'Se borra solo <b>cuando termina el corte</b>; si la nota no dice hasta cuándo, a las <b>24 horas</b>. Lo publica la app sola: ante cualquier duda, mirá la fuente.'],
    ['p', '<b>Servicios del barrio</b>: arriba del <b>pizarrón</b> (en "Todo") y en la Pizarra del día cuando no tiene nada, ves una tarjeta con la <b>luz</b>, el <b>agua</b> y el <b>gas</b>. En verde, <b>"Sin cortes anunciados"</b>, con la hora de la última revisión (6 o 23 h). En amarillo, un corte anunciado, y en rojo, uno que está pasando: tocalo y se abre. En gris, <b>"Sin revisar"</b>: la app no se fijó en las últimas horas y no puede asegurar nada.'],
    ['p', 'Lo más importante aparece en una <b>tarjeta grande</b>, en su color y con el texto. Los demás avisos van en <b>tarjetitas</b> que se deslizan con el dedo hacia el costado (en la computadora se ven en grilla).'],
    ['p', 'Lo que todavía no leíste <b>brilla</b> en su color y tiene un <b>punto que late</b>. Al tocarlo se abre y queda quieto. Tocá <b>"Ver todo"</b> para ver la pizarra completa en dos columnas: <b>Para todo el barrio</b> y <b>Para vos</b>.'],
    ['ojo', 'info', 'Lo que pide una decisión tuya va arriba de todo', 'Si alguien pregunta por vos en la garita o si tenés una alerta abierta, aparece arriba con sus botones ("Que pase", "Aprobar", "Ya está solucionado"). Eso no queda escondido en una lista.'],
    ['h', 'La campanita'],
    ['p', 'Guarda los avisos que <b>todavía no viste</b>. Al abrir uno, te lleva a donde corresponde y deja de contarse. Lo mismo si entrás directo a una conversación privada (de un vecino, de la garita o de la Administración): sus avisos se apagan solos. Con <b>"Marcar todos como vistos"</b> la vaciás de una vez.'],
  ] },

  { id:'avisos', icon:'bell', color:'ok', para:'todos', t:'Activar los avisos al celular', s:'Para enterarte con el teléfono bloqueado', b:[
    ['p', 'Los avisos al celular (también llamados "notificaciones push") te llegan <b>aunque tengas la app cerrada y el teléfono bloqueado</b>, como un mensaje de WhatsApp: el camión de la basura, <b>un correo que va a tu casa</b>, un mensaje privado, un SOS, un aviso urgente de la Administración, lo que escribe la guardia y, si usás "Estoy bien", el recordatorio de la mañana.'],
    ['p', '<b>Los tres más importantes suenan como una llamada</b>: cuando entra el <b>camión de la basura</b>, cuando un <b>correo va a tu casa</b> y cuando <b>alguien llegó sin avisar</b> a la garita, el teléfono suena y vibra <b>una y otra vez</b> (cada 4 segundos) hasta que tocás el aviso: el camión hasta 45 segundos, el correo hasta 1 minuto y la visita hasta 15 minutos. Al abrir la app deja de sonar. En iPhone suena una vez por aviso (es una regla de Apple); la visita que llegó sin avisar se repite cada 30 segundos.'],
    ['pasos', [
      'En iPhone, primero <b>instalá la app</b> (capítulo "Instalar la app en el teléfono"). Sin instalar, el iPhone no los deja llegar.',
      'Tocá tu foto o tus iniciales (arriba a la derecha) para abrir <b>Tu cuenta</b> y buscá <b>"Avisos en este equipo"</b> (o tocá la tarjeta "Activá los avisos" que aparece en la portada).',
      'Tocá <b>"Activar avisos"</b>.',
      'El teléfono pregunta si permitís las notificaciones: tocá <b>Permitir</b>.',
      'Para comprobar, tocá <b>"Probar"</b> y <b>bloqueá el teléfono enseguida</b>: a los 10 segundos tiene que sonar y vibrar varias veces, igual que cuando entra el camión. Tocá el aviso para que deje de sonar.',
    ]],
    ['ojo', 'warn', 'Si la prueba no suena con el teléfono bloqueado', '<b>Android:</b> mantené apretado el ícono de la app (o de Chrome) → Información de la app → <b>Notificaciones</b>: activadas, con <b>Sonido</b> y <b>Mostrar en pantalla</b> (ventana emergente); en <b>Batería</b> elegí <b>Sin restricciones</b>. <b>iPhone:</b> Ajustes → Notificaciones → Bahía Cauquén → <b>Sonidos</b> y <b>Pantalla bloqueada</b>; si usás "No molestar" o "Dormir", agregá la app a las permitidas, y que la tecla del costado no esté en silencio. Si el teléfono está en silencio o en "No molestar", ninguna app puede sonar. Cada vez que abrís la app, el teléfono queda anotado a tu cuenta (si en el mismo teléfono entraste con otra cuenta, los avisos van a la que usaste último).'],
    ['ojo', 'warn', 'Hay que hacerlo en cada equipo', 'Si usás la app en el celular y en la computadora, activalos en los dos. Si los bloqueaste sin querer, se habilitan desde la configuración del teléfono o del navegador: permisos del sitio → Notificaciones → Permitir.'],
  ] },

  { id:'emergencias', icon:'siren', color:'danger', para:'vecinos', t:'Emergencias: SOS y DEA', s:'Qué hacer cuando algo pasa', b:[
    ['h', 'El botón SOS'],
    ['pasos', [
      'Tocá y <b>mantené apretado</b> el botón rojo <b>SOS</b> de arriba a la derecha durante <b>3 segundos</b>. El botón se va llenando de rojo y cuenta 3, 2, 1. (Si soltás antes, no se manda nada: así no sale solo desde el bolsillo.)',
      'Se abre una <b>pantalla roja que late</b> con cuatro fichas grandes de colores: <b>emergencia médica</b> (rosa), <b>seguridad / intrusión</b> (azul), <b>incendio</b> (naranja) u <b>otra</b> (violeta). Cada una muestra su número para llamar. Tocá la que corresponde: la alerta sale en ese momento. Si te equivocaste, tocá <b>"Me equivoqué · cerrar"</b>: todavía no se mandó nada.',
      'La misma pantalla se pinta del color de la emergencia y te muestra, uno por uno, <b>a quién le llegó</b> (la guardia, la Administración y los vecinos; en una emergencia médica, también quienes saben primeros auxilios) y si salió <b>tu ubicación</b> (GPS). La alerta salta con sonido en todos esos teléfonos, con tu nombre y tu lote.',
      'Tocá <b>"Llamar al …"</b> (107 ambulancia, 101 policía, 100 bomberos, 911) o <b>"Llamar a la garita"</b>, que están ahí mismo. <b>"Listo"</b> cierra la pantalla.',
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
      'Si viene <b>varias veces</b> (empleada, jardinero, personal de una obra), marcá "Viene varias veces", elegí los días y hasta qué fecha: es <b>un solo QR</b> para todos esos días. <b>No hay que volver a cargarlo</b>: el pase vale solo cada uno de esos días, en ese horario, hasta la fecha final, y la garita lo ve cada día en "Ingresos de hoy" y en <b>Ingresos frecuentes</b> (con tu lote, los días y el horario).',
      'Si querés, dejá una nota para la guardia (por ejemplo "deja la caja en la puerta").',
      'Si querés, cargá su <b>celular</b> (es opcional): así el pase y el recordatorio se abren directo en su chat de WhatsApp. Dejá tildado <b>"Una hora antes, avisame"</b> si querés el recordatorio (ver abajo).',
      'Tocá <b>"Crear el pase"</b>. Aparece el pase con un <b>código de 6 números</b> y un <b>QR</b>.',
      'Tocá <b>"Enviar por WhatsApp"</b> y elegí el contacto: le llega <b>solo la tarjeta del pase</b>, como una tarjeta de embarque, sin texto ni enlaces: su nombre, a quién viene a ver, el día y el horario, <b>el QR grande con el código debajo</b> y un mapita que dice qué buscar en Google Maps. En la garita muestra el QR o dicta el código. (Desde la computadora, la tarjeta se baja y la adjuntás en el WhatsApp que se abre.)',
    ]],
    ['p', 'La garita lo ve al instante, con tu nombre como quien autorizó. Cuando la visita entra y cuando sale, te llega un aviso.'],
    ['h', 'El recordatorio de una hora antes'],
    ['p', '<b>Una hora antes</b> de la hora en que viene tu visita (y cada día que viene tu personal fijo), te llega el aviso <b>"… viene hoy a las 9 h"</b>, también con el celular bloqueado. Tocalo y aparece el mensaje ya escrito: <i>"Hoy vas al Barrio {BARRIO}, a lo de (tu nombre) (tu lote), a las 9 h. No olvides tener preparado el QR de ingreso: evitá demoras en la barrera de ingreso"</i>, con el código por si no encuentra el QR. Tocá <b>"Mandar por WhatsApp"</b>: si cargaste su celular se abre su chat; si no, elegís el contacto. En Android, la notificación trae el botón <b>"💬 Mandar el recordatorio"</b>.'],
    ['ojo', 'info', 'Por qué lo mandás vos y no la app', 'Para que WhatsApp mande mensajes solo, desde un número del barrio, hace falta su servicio para empresas (Meta), con el número verificado, cada mensaje aprobado y un costo por mensaje. Por eso la app te deja el mensaje listo y vos lo mandás con un toque. Si no querés el aviso para una visita, en <b>Mis visitas → Editar</b> destildá "Una hora antes, avisame". No sale para los Uber, DiDi o taxis, ni si hiciste el pase dentro de esa hora.'],
    ['h', 'Que su teléfono le avise solo (recordatorio en su calendario)'],
    ['p', 'En vez de mandarle el recordatorio cada vez, podés mandarle <b>una sola vez</b> un enlace para su calendario. Abrí la visita (<b>"Ver pase"</b>) y tocá <b>"Recordatorio en su calendario"</b> (con la hojita de almanaque): se arma el mensaje y lo mandás por WhatsApp. Tu visita abre el enlace (no necesita la app) y toca <b>"Agregar a mi calendario"</b>: desde ese momento <b>su propio teléfono le avisa una hora antes</b>, y si es personal fijo, <b>cada día que viene</b> (por ejemplo, lunes a viernes a las 8 h), hasta la fecha final. Funciona con el calendario del iPhone, de Android (Google) y de la computadora, y es gratis.'],
    ['ojo', 'info', 'Qué lleva el enlace', 'Solo su nombre de pila, a lo de quién va, el lote, los días y el horario. <b>Ni DNI, ni patente, ni el código del pase</b>. Si después cambiás los días o el horario, mandáselo de nuevo.'],
    ['h', 'Mis visitas'],
    ['p', 'Cada visita, y también cada <b>"llegó sin aviso"</b>, se va de Mis visitas <b>24 horas después de salir del barrio</b> (la que no vino o no pasó, 24 horas después de su horario o de tu respuesta). Mientras la garita te está consultando, o si la visita sigue adentro, queda. Todas siguen en <b>"Ver mi historial completo"</b>.'],
    ['p', 'En <b>Tu casa → Mis visitas</b> ves las de hoy y las próximas. Cada una se puede ver, reenviar, <b>editar</b>, <b>cancelar</b> o sacar de tu lista. Al personal fijo también le podés cambiar los <b>días, el horario y la fecha final</b> desde Editar: es el mismo QR. Cuando la visita ya está <b>adentro</b>, quedan solo "Ver pase" y el cesto: reenviarla o editarla ya no tiene sentido. Las visitas viejas no se pierden: pasan a tu historial ("Ver mi historial completo").'],
    ['p', '<b>Personal fijo</b> (la empleada, el jardinero): tiene su propia sección, justo debajo de "Hoy", y no se repite arriba. Cada persona es <b>una sola tarjeta</b>: un círculo con sus iniciales (con un anillo verde que late si está adentro, o una tilde si ya se fue), al lado <b>"Está adentro desde las 8:04"</b> o <b>"Se fue 12:31 · estuvo 4 h 27 min"</b>, una <b>barra del día</b> con su horario autorizado de fondo y encima el rato que estuvo de verdad (la rayita roja es la hora de ahora), y abajo <b>la semana en puntitos</b>: verde = vino, borde azul = viene, rojo = le tocaba y no vino; el de hoy tiene un anillo. Al lado, cuántos días vino este mes. Debajo, los botones Pase, Enviar, Llamar (si dejó su celular), Editar y el cesto.'],
    ['p', '<b>Las visitas son del lote</b>: si en tu casa hay varias cuentas (por ejemplo, Claudio y Mónica en el Lote 148), cada uno ve en Mis visitas <b>todas las visitas del lote</b>, también las que autorizó el otro, con <b>quién la autorizó y cuándo</b> ("Autorizó Mónica · hoy 9:10 h") y <b>cuándo entró y salió</b>. Cualquiera del lote la puede editar o cancelar; si lo hace alguien que no la creó, a quien la creó le llega el aviso.'],
    ['h', 'Que la visita complete sus datos'],
    ['pasos', [
      'En <b>Tu casa → Mis visitas</b> tocá <b>"Pasale un enlace a tu visita"</b> y mandalo por WhatsApp.',
      'Tu visita lo abre en su celular (no necesita la app ni una cuenta), ve que viene a verte a vos y a tu lote, y completa su nombre, DNI, celular, patente (si viene en auto), día y horario. <b>Nombre, DNI y celular son obligatorios</b>: sin eso no le sale el pase.',
      'Toca <b>"Generar mi pase"</b> y <b>en el momento le aparece su QR</b> con el código, igual que el que mandás vos. Con <b>"Guardarlo en mi WhatsApp"</b> se manda la tarjeta del pase a su propio chat y le queda guardada. Si vuelve a abrir el enlace, la ve otra vez.',
      'A vos te llega el aviso <b>"… completó sus datos: ya tiene su QR"</b> y la visita aparece en Mis visitas, con el botón <b>"Llamar"</b> a su celular (la garita también lo tiene, por si se demora o no la encuentra). Si no la esperabas, cancelala ahí y el código deja de servir.',
    ]],
    ['p', 'El mismo enlace sirve para varias visitas (cada una completa lo suyo) y vence a los 30 días.'],
    ['h', 'Alguien llegó sin avisar'],
    ['p', 'Si alguien se presenta en la garita preguntando por vos o por tu casa, <b>les llega a todos los que viven en tu lote</b>: la app se abre con una <b>ventana grande</b> (la garita con la barrera, quién llegó y hace cuánto) y dos botones: <b>"QUE PASE"</b> y <b>"NO ESTOY EN CASA"</b>; abajo, "No lo conozco". <b>Suena fuerte, como un teléfono que llama, sin parar (cada 2 segundos y medio) hasta que alguien del lote conteste</b>, aunque hayas bajado el sonido de la app, y la pantalla no se apaga mientras la ventana está abierta. Vale la respuesta del primero: la guardia la ve al instante ("Que pase", "NO ESTÁ EN CASA" o "No lo conoce"), la ventana se cierra sola en todos los teléfonos del lote y a los demás les queda dicho quién contestó y qué.'],
    ['p', '<b>Con la app cerrada o el teléfono bloqueado</b>: te llega la notificación con sonido y los botones <b>"✅ Que pase"</b> y <b>"🏠 No estoy en casa"</b>. En Android vuelve a sonar y vibrar cada 4 segundos (hasta 15 minutos) mientras nadie conteste; tocás un botón y la app contesta sola. En iPhone (con la app instalada en la pantalla de inicio) el aviso se repite cada 30 segundos, hasta 15 minutos, y al tocarlo se abre la ventana con los botones. La garita además tiene "Llamar" a cada uno. <b>Ojo:</b> si el teléfono está en silencio, en "No molestar" o apagado del todo, ninguna app puede hacerlo sonar; conviene permitir los avisos del barrio en "No molestar".'],
    ['h', 'Viene alguien y no tenés su nombre ni su QR'],
    ['pasos', [
      'Entrá a <b>Tu casa → Mis visitas</b> y tocá <b>"Aviso rápido a la guardia"</b>.',
      'El aviso ya está escrito: "Va a llegar una visita sin aviso ni QR. Cuando llegue, avísenme para ver si la autorizo." Si querés, sumá quién viene y a qué hora, más o menos.',
      'Tocá <b>"Avisar a la guardia"</b>. La garita lo tiene todo el día; cuando la visita llega, toca "Llegó: preguntarle al vecino" y a vos te aparece "Que pase" / "No lo conozco".',
    ]],
    ['p', 'Si ya sabés quién viene y cuándo, es mejor hacerle el pase con QR ("Autorizar una visita"): entra sin esperar. Para otras cosas (llego tarde, ruidos, la luz), escribile a la garita por Mensajes.'],
    ['h', 'Viene un Uber, DiDi, Cabify o taxi'],
    ['pasos', [
      'Cuando pedís el viaje, entrá a <b>Tu casa → Autorizar una visita</b> y en "¿Quién viene?" tocá <b>"Uber, DiDi o taxi"</b>: se abre el aviso corto. (Si te equivocaste, "Es otro tipo de visita" te devuelve al pase común.)',
      'Elegí la app, si te viene a <b>buscar</b> o <b>trae</b> a alguien o algo, y en cuánto llega.',
      'Poné la <b>patente</b>: la muestra la app apenas el chofer acepta. Si todavía no la sabés, avisá igual y agregala después con <b>"Agregar la patente"</b>.',
      'La garita lo ve al instante y lo reconoce por la patente. Cuando entra y cuando sale, te llega el aviso. El aviso vence solo una hora después de la hora de llegada.',
    ]],
    ['p', 'Si no avisaste, el chofer entra como "Llegó sin aviso": la garita te pregunta y vos contestás "Que pase" o "No lo conozco".'],
    ['h', 'Si el pase vence'],
    ['p', 'Si a las <b>2 horas</b> de la hora anunciada tu visita no entró, te llega el aviso <b>"… todavía no llegó"</b> con dos botones (también en la notificación del celular, en Android): <b>"Cambiar el horario"</b> abre la visita para poner otro día u hora, y <b>"Ya no viene"</b> cancela el pase (te pide confirmar) y la garita lo ve en el libro de guardia. Si todavía viene, no toques nada. En Mis visitas queda en <b>"No ingresó"</b>, con los mismos dos botones.'],
    ['p', 'Si no hacés nada, cuando pasa la hora de salida del pase queda <b>"Cancelado · no ingresó"</b>, sale de la pantalla de la garita y queda anotado en el libro de guardia.'],
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
    ['p', 'Si el correo le dice a la garita a qué casa va, a todas las cuentas de tu lote les llega <b>"Andreani va a tu casa"</b> (o la empresa que sea): al celular <b>como una llamada</b>: suena y vibra una y otra vez (hasta 1 minuto) hasta que lo tocás, aunque tengas la pantalla apagada, la app cerrada o la sesión cerrada (si activaste los avisos en ese equipo). Con la app abierta suena un aviso y su camión dice <b>"VA A TU CASA"</b>.'],
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
    ['p', 'Debajo está la <b>ficha de tu UF</b>: el número de lote, tu <b>coeficiente</b> (la parte de los gastos del barrio que le toca a tu lote; por ejemplo, de cada $100, $0,57) y una barra que muestra dónde queda tu lote entre el más chico y el más grande del barrio, con la marca del promedio.'],
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
    ['h', 'Morosos del barrio'],
    ['p', 'Al final de Mis expensas, <b>"Morosos del barrio"</b> muestra los lotes que deben, <b>ordenados de la deuda más vieja a la más nueva</b>. Arriba, una rueda de colores con cuántos lotes deben y el total, y una barra por antigüedad: <b>amarillo</b> 1 mes, <b>naranja</b> 2 o 3, <b>rosa</b> 4 a 6 y <b>violeta</b> más de 6. Tocá un color (en la barra o en las fichas) para ver solo esos lotes, o escribí un número de lote en el buscador.'],
    ['p', 'Cada lote es una fila con su número de orden, cuántos meses debe (un cuadradito por mes), el total y si está <b>en gestión judicial</b>. Tocala y se abre: lo adeudado <b>mes por mes</b> y cuánto sería esa deuda <b>en 3, 6 y 12 meses</b> actualizada por inflación (el último IPC publicado por el INDEC). Sale de la última liquidación y de los pagos confirmados. "¿Qué es esta lista?" lo explica en dos renglones.'],
    ['ojo', 'info', 'Por lote y sin nombres', 'La lista la ven solo los vecinos y la Administración: no la garita, la supervisión ni el hotel. No dice de quién es cada lote y nunca sale en avisos, correos ni en el pizarrón. La Administración la puede dejar de mostrar. Si tu lote figura y no corresponde, escribile a la Administración.'],
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
    ['p', 'La caja donde escribís <b>se agranda con el texto</b>, como en WhatsApp: ves todo lo que vas escribiendo (hasta 6 renglones; si es más largo, se desliza adentro). En el teléfono, Enter hace un renglón nuevo y el mensaje se manda con la flechita; en la computadora, Enter lo manda y Mayúscula + Enter hace un renglón nuevo. Los comentarios del pizarrón funcionan igual.'],
    ['h', 'Mandar una foto o un archivo'],
    ['p', 'Al lado de la caja de escribir está el <b>clip</b>. Tocalo y elegí una foto (o sacala) o un archivo (PDF, Word, Excel…, hasta 5 MB). <b>Antes de mandarse, se abre una vista previa</b>: ves la foto (o el nombre y el peso del archivo) y podés escribirle algo. Tocá <b>"Mandar"</b> para enviarla, o <b>"Borrar"</b> si te equivocaste: no sale nada. Mientras sube dice <b>"Subiendo la foto…"</b> y al terminar <b>"Foto enviada"</b> (o "Archivo enviado"). Sirve en todas las conversaciones privadas: con la garita, con la Administración, con otro vecino, y también para el hotel y la supervisión.'],
    ['p', 'Para que la app no se ponga lenta, en la conversación viaja solo una <b>foto chiquita</b> (o el nombre del archivo). Quien la recibe <b>la toca</b> y se baja la foto buena, que queda guardada <b>en su teléfono</b>; con "Guardar en este equipo" la pasa a la galería o a las descargas.'],
    ['ojo', 'clock', 'Se borra de la base a la hora', 'La foto buena o el archivo se borran solos de la base del barrio <b>una hora después de que la otra persona los baja</b> (la hora es por si la descarga falló y hay que repetirla). Si nadie los baja, a los <b>3 días</b>. Después, quien no la bajó ve "Ya no está para bajar": pedile que te la mande de nuevo. Vos la seguís teniendo en tu teléfono.'],
    ['h', 'Sin señal: el mensaje sale solo'],
    ['p', 'Si te quedás sin internet, escribí igual: el mensaje (o la foto) aparece en la conversación con un <b>relojito</b> al lado de la hora y <b>sale solo cuando vuelve la señal</b>; ahí el relojito desaparece. Si cerrás la app antes, queda guardado en tu teléfono y sale apenas la volvés a abrir con señal. Lo que espera señal se borra del teléfono si cerrás sesión o a los 3 días.'],
    ['p', '<b>Siempre en el último mensaje</b>: cualquier conversación se abre abajo de todo, en lo último que se escribió. Si subís a leer algo viejo, la app no te mueve; cuando llega uno nuevo y estás abajo, baja sola.'],
    ['p', '<b>Borrar la conversación y empezar de cero</b>: en cualquier chat (Administración, Guardia, vecinos, hotel, supervisión) tocá el <b>cesto rojo</b> que está arriba a la derecha, en el título, al lado de la X. Se borra <b>solo para vos</b>: la otra persona la sigue teniendo entera hasta que la borre ella. Por ejemplo, si Claudio borra su chat con la garita, la garita lo sigue viendo. Lo que llegue después aparece normalmente.'],
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
    ['p', 'Cada vez que la Administración lo mueve (asignado, en curso, resuelto) te llega un aviso. Cuando lo marca como <b>resuelto</b>, en Mis reclamos te pregunta <b>"¿Quedó resuelto?"</b>: tocá <b>"Sí, gracias"</b> o, si no es así, <b>"Sigue igual"</b>, y se vuelve a abrir solo y le avisa a la Administración.'],
  ], ir:[['abrir', 'mensajes', 'Mensajes'], ['abrir', 'peticiones', 'Peticiones'], ['abrir', 'reclamos', 'Mis reclamos']] },

  { id:'micasa', icon:'home', color:'ok', para:'vecinos', t:'Mi casa y mi credencial', s:'Tus datos, quiénes están en tu lote, autos y mascotas', b:[
    ['p', 'En <b>Tu casa → Mi casa</b> cargás lo que le sirve a la guardia y al barrio. Todo es opcional y lo cambiás cuando quieras:'],
    ['lista', [
      'Tu relación con el lote (propietario, cotitular, inquilino, familiar). Se elige una sola vez; si cambió, se lo pedís a la Administración. Si sos inquilino y el propietario te da una carta poder, la subís para poder votar.',
      'Si sos propietario y no vivís en el lote: <b>"No vivo en el lote"</b> (capítulo "Lote alquilado").',
      'Tu teléfono o WhatsApp, tu profesión u oficio (y si querés mostrarlos al barrio).',
      'Quiénes viven en la casa, la dirección y la ubicación exacta (sirve para "Cómo llegar" en una emergencia). Quiénes viven en la casa lo ve también la garita en la ficha de tu lote del mapa del barrio, para saber a quién va una visita.',
      '<b>Tus autos</b> con la patente: la garita los reconoce.',
      '<b>Tus mascotas</b>, con foto.',
      '<b>La foto del frente de tu casa</b>: la usa la garita para ubicar tu domicilio. Tocá <b>"Sacar foto"</b> para usar la cámara o <b>"Elegir de la galería"</b> para subir una que ya tengas (JPG, PNG, HEIC del iPhone u otro formato de imagen). Lo mismo en todos los lugares donde se adjunta una foto.',
      '<b>Me voy de viaje</b>: tu casa entra en la lista de "casas solas" de la garita. La garita o el policía de la ronda nocturna la revisa <b>una vez por día</b> y te llega el aviso <b>"Tu casa está en orden"</b> (o la novedad, si hay una). Lo ven solo la garita, la Administración y las cuentas de tu lote. Si usás "Estoy bien", queda en pausa hasta que volvés. "Ya volví" termina el aviso.',
      '<b>Sé primeros auxilios / RCP o soy del equipo de salud</b>, y qué sos: te avisamos cuando un vecino pide ayuda médica o la garita sale con el DEA.',
    ]],
    ['h', 'Quiénes están en tu lote'],
    ['p', 'Al final de Mi casa ves <b>todas las cuentas anotadas en tu mismo lote</b>: tu familia, con su relación con el lote (propietario, cotitular, inquilino, familiar), si tiene la app abierta ahora y si alguien está <b>esperando aprobación</b> para entrar en tu lote. Ni DNI ni correo ni teléfono.'],
    ['p', 'Si ves a alguien que no vive en tu casa, tocá <b>"No es de mi lote"</b>: le avisamos a la Administración para que lo revise, y a esa persona (sin tu nombre) para que confirme su lote.'],
    ['p', 'Arriba de la lista hay un <b>dibujo animado de tu casa</b>: una pareja que se da la mano (con un corazón), una familia bajo un techito o compañeros de casa charlando, según quiénes son. Salen <b>solo quienes viven ahí</b> (el propietario que no vive en el lote no aparece) y <b>solo las mascotas cargadas en Mi casa</b>: un perro se dibuja como perro y un gato como gato; otros animales no se dibujan. Si son dos personas sin mascotas, salen dos personas sin mascotas.'],
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
      '<b>Pizarrón</b>: los avisos de la guardia, la Administración y los vecinos. Podés publicar algo (una novedad, un evento, algo perdido o encontrado). Cada publicación <b>se borra sola</b> a su tiempo (ver "Cuánto dura lo que se publica", abajo).',
      '<b>Vecinos</b>: buscá a alguien por nombre, apellido, lote o calle ("Pérez", "42", "Los Salesianos 3500") y escribile en privado. Salen los 152 lotes con su <b>dirección</b> y quién vive (propietario o inquilino). Aunque escribas mal el apellido ("Peres"), lo encuentra.',
      '<b>Votaciones</b>: votá desde la app. Vota el titular del lote (un voto por lote); si son varios titulares y votan distinto, el voto del lote no se cuenta.',
      '<b>Obras</b>: registrá tu obra ("Registrar mi obra") y marcá <b>con qué se trabaja</b>: solo obreros, herramientas eléctricas, camiones o mixer, o maquinaria pesada (retroexcavadora, grúa). La obra toma el nivel de movimiento de lo más pesado (bajo, medio, alto o muy alto) y lo ven todos; el filtro <b>"Con máquinas pesadas"</b> las junta. Los días con mixer, camión o máquina, mandá el <b>"Aviso del día"</b> y marcá qué entra: todos se enteran en la pizarra. Cuando termina una etapa, tocá <b>"Paso siguiente"</b> (un solo toque, el botón dice a qué etapa pasa); en la última dice <b>"Terminar la obra"</b>: la obra sale sola de "En curso", de la pizarra y del mapa, y queda en "Terminadas". Para contar algo con foto está <b>"Novedad"</b>. Si la obra no se hace o la cargaste por error, tocá <b>"Eliminar"</b> en cualquier momento: la borra para todos (lo pueden hacer vos y la Administración; la garita no). Para que no queden obras viejas "en curso": si tu obra no cambia en <b>30 días</b> te llega <b>"¿Tu obra sigue en…?"</b>, y si pasó la <b>fecha de fin estimado</b>, <b>"¿Terminaste la obra?"</b>. En la tarjeta de la obra aparece la misma pregunta: <b>"Sí, terminó"</b> la cierra con un toque; <b>"Sigue igual"</b> vuelve a contar 30 días, y si pasó el fin, <b>"Sigue: cambiar fecha"</b> abre Editar. También salen las <b>obras de afuera que afectan al barrio</b> (la ruta o el acceso, agua, luz o gas): las carga la Administración con el lugar, dicen "Fuera del barrio · Ruta 3…", tienen su filtro <b>"Fuera del barrio"</b> y su aviso del día llega como cualquier otro. No salen en el mapa.',
      '<b>Viajes compartidos</b>: ofrecé o buscá lugar para ir al centro, la escuela o el aeropuerto.',
      '<b>Profesionales y oficios</b>: los vecinos que ofrecen su profesión u oficio, con su WhatsApp.',
      '<b>Mascotas</b>: perdidas, encontradas y las del barrio. Si se pierde la tuya, en su tarjeta tocá <b>"Avisar que se perdió"</b>: le llega a todo el barrio. Cuando aparece, tocá <b>"¡Apareció!"</b>: el aviso se borra del pizarrón y de la campanita, y al barrio le llega que apareció.',
      '<b>Compras conjuntas</b>: sumarse a una compra entre varios (leña, gas…).',
      '<b>Cosas para prestar</b>: la escalera, la hidrolavadora, las cadenas, el generador… que cada vecino ofrece prestar (capítulo "Cosas para prestar").',
      '<b>Ángeles de la nieve</b>: vecinos que despejan la entrada de quien no puede palear (capítulo "Invierno y verano").',
      '<b>Manual y normas</b>: una sola puerta con dos solapas arriba. <b>Manual de uso</b> es este manual. <b>Normas y reglamentos</b> tiene el reglamento, la convivencia y las normas que rigen el barrio, con un buscador ("¿hasta qué hora puedo hacer obra?"); cada una se puede <b>descargar</b> para imprimir o guardar en PDF, o todas juntas.',
      '<b>Las cuentas del barrio</b>: en qué se gasta, mes a mes.',
      '<b>Residuos</b>: los días del camión. {RESIDUOS} La víspera la pizarra avisa "Mañana pasa el camión" y cuando la garita registra la entrada, te llega el aviso "Entró el camión", que suena como una llamada (hasta 45 segundos o hasta que lo tocás). A la garita le aparece a cuántos celulares les sonó; si el aviso no salió, lo dice y conviene avisar a la Administración.',
      '<b>Correos en el barrio</b>: qué correo está adentro ahora (Correo Argentino, Andreani, OCA, OCASA, Mercado Libre u otro) y los que ya pasaron hoy (capítulo "Correos en el barrio").',
      '<b>Descargas</b>: aplicaciones, instructivos y planillas que comparte la Administración.',
    ]],
    ['h', 'Cuánto dura lo que se publica en el pizarrón'],
    ['lista', [
      '<b>Alerta</b>: 2 días. <b>Aviso de la guardia</b>: el día en que se publica; a las 0 h se borra solo (así la garita no tiene que borrar avisos viejos). Al escribirlo, la garita puede elegir <b>"Solo hoy"</b> (lo normal), <b>"Hasta mañana"</b> o <b>"3 días"</b> (un portón cerrado varios días): siempre se borra a las 0 h del último día.',
      '<b>Aviso</b> de un vecino: 7 días (de la Administración: 15).',
      '<b>Evento</b>: hasta el día siguiente al evento.',
      '<b>Mascota o algo perdido</b>: hasta que tocás "¡Apareció!", o 30 días.',
      '<b>Ofrezco</b> y <b>Busco</b>: 30 días. <b>Vendo o regalo</b>: 15 días.',
      'Lo que la Administración deja <b>fijado</b> arriba no se borra mientras siga fijado.',
    ]],
    ['p', 'Al publicar, la app te dice el día en que se borra. En tu publicación lo ves siempre ("Se borra solo el…"), y si querés sacarla antes, tocá el <b>tachito</b>. Cuando se borra sola, te llega el aviso. Lo que dura 30 días lo podés <b>renovar</b> desde la misma publicación los últimos 3 días. La Pizarra del día de la portada muestra lo general solo 24 horas.'],
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
    ['p', 'Tocá <b>tu foto o tus iniciales</b> arriba a la derecha. Arriba, una tarjeta de color con tu nombre, tu lote y tu rol (vecino/a, Administración, garita, hotel o supervisión). Si sos de la Administración, debajo está el interruptor <b>"Estás como Administración / vecino/a"</b> para pasar de una vista a la otra.'],
    ['lista', [
      '<b>En este equipo</b>, tres renglones: <b>Pantalla</b> (sol = día, el del medio = automático, que se oscurece cuando se pone el sol en Ushuaia, luna = noche); <b>Avisos</b> (dice si están activados y tiene el botón para activarlos, probarlos o apagarlos; si el navegador no los permite, "Ver cómo" explica qué hacer); y <b>Sonido</b>, un interruptor para que suene cuando escribe la guardia o la Administración.',
      'Las fichas de colores: <b>Contraseña</b> y <b>Mi correo</b> para cambiarlos (la cuenta de la garita cambia solo la contraseña: su correo es fijo), el <b>Manual de uso</b>, el <b>Asistente por voz</b> (si tu equipo lo permite) y las <b>Preguntas frecuentes</b>.',
      '<b>Mis datos</b> (vecinos): un informe con <b>todo lo que la app guarda de vos</b>, sección por sección, con quién ve cada cosa y cuánto se guarda, para imprimir o guardar en PDF; también "Corregir mis datos" y "Pedir la baja". La garita y el hotel no lo tienen: son cuentas institucionales.',
      '<b>Tu lote</b> (si en tu lote hay más cuentas): una tarjeta con un cielo que cambia según la hora (sol y nubes de día; luna y estrellas de noche), tu casa y quienes viven en ella dibujados. Debajo, cada persona con su rol y si tiene la app abierta (un punto verde): <b>tocá a alguien y su muñequito salta y muestra su nombre</b>. Después, lo que comparten como lote (un voto, una expensa, las visitas y los avisos de la garita) y los botones <b>"Ver quiénes"</b> y <b>"Escribirle"</b>.',
      '<b>Cómo aparecés en el dibujo</b>: la primera vez, la tarjeta te pregunta <b>"¿Cómo querés aparecer en el dibujo?"</b> con tres opciones, cada una con tu muñequito: <b>Mujer</b> (pelo largo y, casi siempre, pollera), <b>Hombre</b> (pelo corto y, a veces, barba) u <b>Otra forma</b> (una figura neutra). Tocá una. La app no lo adivina por el nombre: mientras no elijas, salís con la figura neutra. Lo cambiás cuando quieras con "Cambiar cómo aparezco en el dibujo".',
      '<b>De guardia ahora</b> (solo la cuenta de la garita): la garita con los guardias del turno dibujados, como los ven los vecinos en su portada. Cada guardia toca su nombre y elige cómo aparece: <b>hombre o mujer</b>, <b>petizo, mediano o alto</b>, <b>flaco, mediano o gordo</b>, el <b>pelo</b> (morocho, castaño, rubio, colorado, canoso o pelado), la <b>piel</b> y si lleva <b>barba</b> o <b>anteojos</b>. Arriba se ve el muñequito cambiando con cada toque; "Listo, así aparezco" lo guarda y la próxima vez que esté de guardia sale así.',
      '<b>Actualizar la app</b>: si algo quedó raro o no abre una ventana. Baja todo de nuevo; tus datos no se pierden.',
      '<b>Cerrar sesión</b> (el botón rojo, abajo de todo): salís de la app en ese equipo. Por seguridad, también se borra la llave de tu QR de retiro en ese equipo. Si tenés los avisos al celular activados, elegís si ese equipo sigue recibiendo <b>solo</b> el aviso de que un correo va a tu casa (viene marcado; los demás avisos se cortan).',
    ]],
    ['p', 'Lo que abrís desde Tu cuenta (el manual, las preguntas frecuentes, Mis datos personales, cambiar la contraseña o el correo), al cerrarlo, con la X o con Atrás, <b>te devuelve a Tu cuenta</b>.'],
  ], ir:[['mi-cuenta', '', 'Abrir Tu cuenta']] },

  { id:'mantvivo', icon:'wrench', color:'wood', para:'todos', t:'Mantenimiento en vivo', s:'Dónde trabajan los chicos de mantenimiento, y escribirles', b:[
    ['p', 'Cuando la garita marca la entrada de alguien de mantenimiento, a su celular le llega por WhatsApp un enlace. Con ese enlace marca en el <b>mapa del barrio</b> dónde está trabajando y qué hace (corte de pasto, banquina, poda, luminarias…), y lo da por terminado cuando termina. Todos lo ven <b>en vivo</b>.'],
    ['h', 'Para seguirlos (vecinos, hotel, garita y Administración)'],
    ['pasos', ['En la portada, tocá la cápsula <b>"Mantenimiento · trabajando ahora"</b> (aparece solo mientras hay alguien trabajando).',
      'Se abre <b>Mantenimiento en vivo</b>: arriba, cuántos trabajan, cuántos trabajos hay en curso y cuántos se terminaron hoy; abajo, el mapa con una <b>gota de color</b> por trabajo (con el dibujito de la tarea; las terminadas, en verde con una tilde). Se mueve con el dedo y se acerca con dos dedos.',
      'Tocá una gota para ver qué están haciendo, dónde, desde qué hora y el detalle.',
      'Si la garita le cargó la <b>tarea de hoy</b>, aparece además un <b>pin con casco amarillo</b> y sus iniciales en el lugar donde trabaja (igual que lo ve la garita), y debajo, en su tarjeta, <b>"Hoy: Corte de pasto · Espacio verde"</b>. Tocalo para ver qué hace y escribirle.',
      'Debajo del mapa está cada persona (nombre y la inicial del apellido) con sus trabajos. <b>"Mensaje"</b> abre la conversación: escribí y le llega al instante a su teléfono. Hay respuestas rápidas ("¿Podés pasar por mi lote?").']],
    ['ojo', 'Los mensajes con mantenimiento los ven esa persona, vos, la garita y la Administración. Ningún otro vecino. Se borran cuando la garita marca su salida.'],
    ['h', 'Para el personal de mantenimiento (el enlace)'],
    ['pasos', ['Al entrar al barrio te llega por WhatsApp un mensaje de la garita con un enlace. Tocalo: se abre tu pantalla de <b>Mantenimiento</b>, sin cuenta ni contraseña.',
      'Arriba ves tu nombre, a qué hora entraste y el reloj de tu turno.',
      'Para marcar un trabajo: <b>"Marcar un trabajo"</b> → tocá en el mapa el lugar → elegí la tarea, escribí el detalle si querés → <b>"Marcar en el mapa"</b>. Podés tener varios puntos a la vez.',
      'Cuando terminás: en <b>Trabajos</b>, <b>"Terminado"</b> (queda en verde en el mapa). Con <b>"Editar"</b> cambiás la tarea o el detalle, o lo borrás. También se abre tocando tu gota en el mapa.',
      'En <b>Mensajes</b> están la garita, la Administración y los vecinos que te escribieron. Te suena y vibra cuando llega uno.',
      'Cuando la garita marca tu salida, el enlace se apaga solo y te llega por correo <b>el parte del día en PDF</b>: entrada, salida, horas, lo que hiciste y dónde (con un plano), quiénes trabajaron ese día y cuántos mensajes tuviste.']],
    ['h', 'Para la garita'],
    ['lista', ['El enlace sale solo al tocar <b>"Entrada"</b> en la tarjeta de la persona: se abre WhatsApp con el mensaje listo, solo hay que tocar <b>Enviar</b>. Para eso tiene que tener cargado el <b>celular</b> (lápiz de su tarjeta). Si no lo tiene, se muestra una tarjeta con un <b>QR</b> para que lo escanee con su cámara.',
      '<b>¿Dónde está?</b> Tocá el <b>nombre</b> (o la carita) de la persona en la banda "Personal de mantenimiento": debajo de su tarjeta se despliega el <b>mapa en vivo</b>, centrado en sus trabajos. Sus gotas se ven fuertes y las de los demás, tenues; la última que marcó brilla en amarillo. Se actualiza solo cada vez que marca, edita o termina algo. Tocá un trabajo de la lista para ir hasta él en el mapa; la <b>X</b> (o el nombre otra vez) lo cierra.',
      'Mientras está adentro, su tarjeta muestra cuántos trabajos tiene, <b>"Enlace"</b> (para volver a mandárselo o mostrar el QR) y <b>"Mensajes"</b> (con el número de los que no leíste). La garita ve todas sus conversaciones; escribe en la suya.',
      'Las gotas de trabajo también se ven en el <b>mapa del barrio</b> de la garita.',
      'Al tocar <b>"Salida"</b>, el enlace se apaga, sus puntos se sacan del mapa, la jornada queda en la <b>Bitácora de mantenimiento</b> (aparte del libro de guardia) y sale el parte por correo si tiene el <b>correo</b> cargado.',
      'En la <b>Bitácora de mantenimiento</b> están todas las jornadas por día, con <b>"Ver el parte"</b> (para imprimir o guardar en PDF) y <b>"Reenviar"</b>. Se guardan 12 meses.']],
  ]},
  { id:'datos', icon:'lock', color:'brand', para:'vecinos', t:'Tus datos y tu privacidad', s:'Quién ve qué', b:[
    ['lista', [
      'Los demás vecinos ven tu <b>nombre, tu lote y la dirección del lote</b> en el buscador de Vecinos (la guía del barrio), y si sos propietario o inquilino. Tu teléfono y tu profesión, <b>solo si vos elegís compartirlos</b>.',
      'Los <b>teléfonos de cada lote</b> que tiene la Administración los ven solo la garita, la Administración y la supervisión, para ubicarte o avisarte. Ningún vecino ni el hotel. El hotel ve solo la dirección de cada lote, sin nombres.',
      'El <b>padrón de expensas</b> (titular, DNI, correo y deuda de cada lote) lo ve <b>solo la Administración</b>. Tus expensas las ves vos y las cuentas de tu lote.',
      'Tu <b>cuota, los intereses y las multas</b> viajan solo a los teléfonos de las cuentas de tu lote; los demás vecinos no los reciben. La liquidación completa del barrio la ve solo la Administración. La única excepción son los <b>morosos del barrio</b>: si tu lote tiene deuda vencida, los demás vecinos ven el número de lote, lo que debe por mes, si está en gestión judicial y la proyección, <b>sin tu nombre</b> (como el estado de cuentas de una liquidación de expensas); no lo ven la garita, la supervisión ni el hotel, y la Administración lo puede apagar. Los <b>gastos del barrio</b> (proveedores, facturas e importes) los ven todos: es la transparencia de las expensas.',
      'Si cargás el <b>celular de tu visita</b> (optativo), lo ven vos, la garita y la Administración. El recordatorio de una hora antes lo mandás <b>vos</b> desde tu WhatsApp: la app no le escribe a nadie.',
      'En la portada todos ven <b>quiénes están de guardia ahora en la garita</b> (su nombre, su horario y su dibujo) y si hay policía nocturna de servicio, sin su nombre. El libro de guardia sigue siendo solo de la garita, la Administración y la supervisión.',
      '<b>Las visitas son del lote</b>: las que autorizás las ven también las otras cuentas de tu mismo lote (con quién la autorizó, cuándo entró y salió), como ves vos las de ellos. Ningún otro vecino las ve.',
      'El <b>enlace del recordatorio en el calendario</b> lleva solo el nombre de pila de la visita, a lo de quién va, el lote, los días y el horario, escrito dentro del mismo enlace: no queda guardado en ningún servidor y no lleva DNI, patente ni el código del pase.',
      'Si contestás <b>"No estoy en casa"</b> a una llegada sin aviso, lo ven solo la garita (para no dejar pasar a nadie) y las cuentas de tu lote.',
      '<b>Cómo aparecés en el dibujo de tu lote</b> (mujer, hombre u otra forma) es optativo, lo elegís vos y se usa solo para ese dibujo. Se guarda en tu cuenta, junto a tu nombre y tu lote.',
      'Las <b>pruebas de una infracción</b> (fotos o archivos) las ven solo la Administración y las cuentas de tu lote, se guardan en un formato de imagen más liviano (WebP, entre un 10 y un 30 % menos según la foto, con la misma nitidez) y se borran de la base a los <b>90 días</b>; queda la constancia de quién las subió y quién las bajó.',
      'El <b>chat vecinal</b> y las <b>reservas</b> ya no existen (se sacaron el 29 de septiembre de 2026). Lo que había quedado guardado de antes no lo ve ningún vecino ni la garita; la Administración lo borra.',
      'Tus mensajes privados, tus reclamos y tus pagos <b>no los ve ningún otro vecino</b> (las expensas, solo las cuentas de tu mismo lote). Si le escribís a varios vecinos a la vez, cada uno recibe su propia conversación: no se enteran de los demás. Los mensajes privados <b>se borran solos a los 90 días</b>.',
      'Si le escribís al <b>personal de mantenimiento</b>, el mensaje lo ven esa persona, la garita y la Administración (ningún otro vecino), y se borra cuando la garita marca su salida. Lo que ves de ellos es su nombre con la inicial del apellido y dónde están trabajando; su DNI, celular y correo, no.',
      'Lo que publicás en el <b>pizarrón</b> se borra solo a su tiempo (de 2 a 30 días según qué es; ver "El barrio") o cuando vos lo borrás.',
      'La garita ve lo que necesita para su trabajo (visitas, peticiones). La Administración, lo que necesita para administrar.',
      'Si la Administración habilita una <b>supervisión de la guardia</b>, esa persona mira en vivo lo mismo que la garita (también tus visitas y su historial, el personal o los proveedores que entran siempre a tu casa, sin su código ni su QR, tus peticiones y si tu casa quedó sola), sin poder cambiar nada. No ve tus mensajes, "Estoy bien" ni tus expensas.',
      'La app puede tener <b>publicidad y promociones de comercios</b>, siempre marcadas. Los comercios no reciben ningún dato tuyo y los anuncios no se eligen según quién sos. La mitad de lo que paguen se dona a la Asociación Civil del barrio (ver "Publicidad y aporte al barrio").',
      'Las fotos buenas no quedan en la base del barrio: viaja una vista previa y la foto se baja solo cuando alguien la toca.',
      'Las <b>fotos y archivos de los mensajes</b> los puede bajar solo quien está en esa conversación (hace falta el código que va en el mensaje; nadie puede listarlos). Se borran de la base una hora después de que la otra persona los baja, o a los 3 días; en la conversación queda solo la foto chiquita, que se borra con el mensaje a los 90 días.',
      'Los <b>avisos de cortes de luz, agua y gas</b> los arma la app con lo que publican la DPOSS, la DPE, Camuzzi y los diarios de Ushuaia. Para buscarlos no se manda ningún dato tuyo ni del barrio: solo se leen esas páginas.',
      '<b>Estoy bien</b> y el <b>aviso de salida</b> los ven solo vos, la garita, la Administración y las personas del barrio que elegiste; tus familiares reciben el aviso por correo. Los demás vecinos no saben que lo usás. Los avisos se borran a los 30 días y, si dejás de usarlo, se borra todo.',
      '<b>Tu casa en invierno</b> y <b>en verano</b>, la <b>mochila y el plan para sismos</b> (con sus sugerencias): los ven y los cambian solo las cuentas de tu lote.',
      '<b>Quiénes están en tu lote</b> (en Mi casa): las cuentas de tu mismo lote ven entre sí el nombre, la relación con el lote y si tienen la app abierta; nada más. "No es de mi lote" avisa a la Administración y, sin tu nombre, a esa persona.',
      '<b>Me voy de viaje</b> (casa sola): lo ven solo la garita, la Administración y las cuentas de tu lote. Ya no queda en tu ficha.',
      '<b>Lote alquilado</b>: el propietario que no vive en el lote ve las expensas, las votaciones, los comunicados y tu nombre; no ve tus visitas, tus paquetes, tu casa sola, tus mensajes ni tu plan ante un sismo.',
      '<b>Correos</b>: todos ven solo qué correo está en el barrio y a qué hora entró. A qué lotes va y la patente quedan en el libro de guardia (garita, Administración y supervisión). El aviso "va a tu casa" lo recibe solo tu lote.',
      '<b>Cosas para prestar</b> y <b>Ángeles de la nieve</b> los ven los vecinos de la app (tu nombre de pila y tu lote). Los pedidos de préstamo van por mensaje privado. En Ángeles de la nieve no pongas datos de salud.',
      'Si sos del equipo de salud y tocás VOY ante un pedido del DEA, la garita y el vecino ven tu nombre, tu profesión y tu teléfono.',
    ]],
    ['p', 'Por la <b>Ley 25.326</b> podés pedir ver, corregir o borrar tus datos: en <b>Tu cuenta → Mis datos personales</b> tocá <b>"Ver mi informe"</b>: se abre un documento con todo lo que la app guarda de vos (tu cuenta, visitas, pagos, mensajes, reclamos, votos, lo que publicaste, "Estoy bien", lo de tu casa y el archivo histórico), que imprimís o guardás como PDF (de las expensas trae los pagos y recibos de tu lote de este año; los anteriores están en Mis expensas; de los mensajes, los de los <b>últimos 7 días</b> y cuántos más tenés, que ves completos en Mensajes). Ahí mismo pedís la baja. No incluye contraseñas ni códigos para entrar, y el DNI de tus visitas va tapado. Para llevar tus datos a otro sistema hay además una "Copia técnica (JSON)".'],
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
    ['h', 'El mapa del barrio, en vivo'],
    ['p', 'En la garita, debajo de "Código, patente o DNI", está el <b>plano del barrio</b> con los 152 lotes en su lugar, las calles con su nombre, el espacio verde y la costa. Cada lote se pinta solo según lo que pasa ahí ahora:'],
    ['lista', [
      '<b>Rojo que late:</b> un SOS o un pedido del DEA sin resolver, con una línea roja desde la garita.',
      '<b>Naranja que late:</b> alguien está en la entrada esperando que el vecino conteste ("Llegó sin aviso"), con una línea desde la garita hasta la casa.',
      '<b>Verde:</b> visita adentro. <b>Celeste:</b> visita anunciada para hoy.',
      '<b>Amarillo:</b> casa sola (el vecino está de viaje). <b>Rosa:</b> obra en curso.',
      '<b>Borde rojo punteado:</b> hay un pedido de "no dejar pasar" a alguien para ese lote.',
      'Un círculo blanco que late: ahí acaba de entrar o salir alguien (en los últimos 10 minutos). Arriba del plano dice cuál fue el último movimiento; tocándolo, el mapa va a ese lote.',
      '<b>Pines con casco amarillo:</b> el personal de mantenimiento que está adentro, en el lugar donde trabaja hoy, con sus iniciales y la tarea debajo. Late una onda alrededor. Tocá el pin para cambiarle la tarea o el lugar. Los vecinos, el hotel y la supervisión ven el mismo pin en <b>Mantenimiento en vivo</b> (con el nombre y la inicial del apellido, sin DNI); se borra cuando marcás su salida.',
    ]],
    ['p', 'Arriba están las <b>casillas con los números</b> de cada cosa. Tocar una deja encendidos solo esos lotes (por ejemplo, todas las casas solas para la ronda); si hay uno solo, el mapa va derecho a él. "Ver todo" vuelve a mostrar todo.'],
    ['pasos', [
      'Cuando la visita dice adónde va, escribí la <b>dirección</b> en "¿A qué dirección va?" (por ejemplo "De la Plaza 3340"). También sirve el número de lote o el apellido.',
      'Sale el lote con <b>los nombres de los que viven</b> y la dirección. Tocalo (o apretá Enter): el mapa va a esa casa y se abre su ficha.',
      'En la ficha están quiénes viven, sus teléfonos, las visitas de hoy con <b>"Ingresó"</b> y <b>"Salió"</b>, los paquetes, si es casa sola (con "Revisada") y el botón <b>"Llegó alguien para este lote"</b>.',
    ]],
    ['lista', [
      '<b>Acercar:</b> pellizcá con dos dedos, usá los botones + y −, o tocá un lote chiquito (el primer toque lo acerca y el segundo abre su ficha). En la computadora: Ctrl + ruedita.',
      'Al acercar, cada lote muestra su número, <b>el nombre y apellido de quienes viven</b> (de la guía del barrio, usen o no la app) y la <b>dirección</b>.',
      'Los botones de abajo llevan a cada zona: Oeste, Hotel y De la Hermita, Centro, De la Plaza y la costa, De las Bahías, o todo el barrio.',
      'El botón con las flechas lo abre en <b>pantalla completa</b> (también desde Más → Mapa del barrio). En el celular conviene girarlo y verlo acostado.',
      'El plano viene <b>dado vuelta como se ve desde la garita</b>: la garita abajo y el Canal Beagle arriba. El botón de las flechas en círculo (abajo de + y −) lo gira 180°; cada equipo recuerda cómo lo dejaste.',
    ]],
    ['ojo', 'warn', 'Solo para el servicio', 'El mapa con los nombres lo ven únicamente la garita, la Administración y la supervisión, los mismos que ya ven la guía del barrio. Los vecinos y el hotel no lo tienen (Ley 25.326).'],
    ['h', 'Buscar un vecino: "soy invitado de Pérez"'],
    ['p', 'Si alguien dice a quién viene a ver y no sabe la dirección, tocá <b>"Buscar un vecino"</b> y escribí el apellido, el número de lote o la calle. Sale la ficha del lote: <b>quiénes viven</b> (propietarios o inquilinos), la <b>dirección</b> (calle y altura), para qué lado de la garita queda en Los Salesianos, y los <b>teléfonos</b> con su botón para llamar o mandar WhatsApp.'],
    ['lista', [
      'Perdona errores: "Peres" encuentra a Pérez y "Gonsales" a González.',
      'Un número de hasta 3 cifras busca el lote ("14" es el lote 14). Con 4 cifras o más, la altura de la calle ("3340") o un teléfono.',
      'Los lotes 45 a 49 dicen <b>"Entrada por afuera del barrio, por la calle Los Ñires"</b>.',
      'También dice si el lote es un baldío o una cabaña del hotel (con su número).',
    ]],
    ['ojo', 'warn', 'Los teléfonos son reservados', 'Los ven solo la garita, la Administración y la supervisión. Son para el servicio: no se pasan a nadie (Ley 25.326).'],
    ['h', 'La garita por voz: tocá el escudo'],
    ['p', 'Tocá el <b>escudo del barrio</b> (arriba a la izquierda): la app dice <b>"Hola, te escucho"</b> y enseguida te escucha (en la garita no hace el saludo largo, para no hacerte esperar). La primera vez te pregunta si querés activarlo en ese equipo (se apaga en Tu cuenta). Podés decir:'],
    ['lista', [
      '<b>"Llegó una visita sin avisar"</b>: la app te dice <b>"Decime hotel, lote, dirección o apellido"</b>. Repetí lo que te dice la visita: la <b>dirección</b> ("De la Plaza 3340"), el lote ("lote 42"), "hotel" o el apellido ("a lo de Fernández"). Con la dirección o el lote el micrófono corta apenas terminás de hablar, y en pantalla ves "Bien, buscando…". Enseguida te dice <b>quién vive y el lote</b>: "Claudio Ravasi y Monica Ponzio, Lote 148" (si está alquilado, el inquilino), y para qué lado de la garita queda cuando la guía lo sabe. Si dos lotes comparten la dirección (Los Salesianos 3630 es del 22 y del 91), te pregunta cuál: decí "el 91" o tocá el botón del lote. También sirve preguntar <b>"¿de quién es De la Plaza 3340?"</b>. Después te pregunta <b>"¿Cómo se llama?"</b> (si no lo sabés, "no sé"). Te repite todo (y, si en la app hay otra persona del lote, a quién le llega) y, con tu "sí", les avisa a todos igual que "Llegó sin aviso": le aparece "Que pase" / "No lo conozco". Si va al hotel, le llega al hotel en sus mensajes con la garita. También vale de una: "llegó Ana Gómez para el lote 42".',
      '<b>"Buscá la dirección de Ravasi"</b> (o "dirección del lote 148"): te dice en voz alta y en pantalla, por ejemplo, "Claudio Ravasi: Lote 148, calle De la Plaza 3340", para decirle al Uber, al DiDi o a la visita cómo llegar. Perdona errores como el buscador.',
      '<b>"¿Juan Pérez tiene pase?"</b>: busca entre los pases de hoy y, si está, te abre el pase con su botón "Ingresó". Si no está, te ofrece avisarle a un lote.',
    ]],
    ['p', '<b>El micrófono corta apenas terminás de hablar</b>: si lo que dijiste ya es la respuesta ("lote 42", "hotel", "sí", "no"), sigue en medio segundo; si no, cuando el teléfono nota que dejaste de hablar, y como mucho un segundo y medio después de la última palabra. Si hacés una pausa en el medio de una frase, espera y toma la frase entera.'],
    ['p', 'Si hay mucho ruido, los mismos tres pedidos están como <b>botones</b> en el cartel del asistente, y siempre podés tocar <b>"Mejor con el formulario"</b>. En iPhone y iPad el micrófono se abre tocando su botón. El audio lo procesa el teléfono (Google o Apple); la app usa solo el texto y no guarda nada.'],
    ['h', 'El pizarrón'],
    ['p', 'En tu portada, <b>"Pizarrón"</b> abre los avisos del barrio para leer (de la Administración, de los vecinos, eventos, perdidos), con un número cuando hay nuevos. Desde ahí mismo, <b>"Escribir un aviso de la guardia"</b>: les suena y les llega a todos los vecinos. Los avisos que son para la garita llegan además a la campanita.'],
    ['ojo', 'info', 'Las tareas de la garita son solo de la garita', 'Registrar ingresos y salidas, el camión, el policía y sus rondas, la bitácora, firmar peticiones y atender un SOS lo hace únicamente la cuenta de la garita. La Administración lo ve en vivo, pero no lo toca.'],
    ['h', 'Lo que no se puede olvidar hoy'],
    ['p', 'A la derecha de "Garita" (en el celular, debajo) está la lista del día, <b>"Hoy la garita no puede olvidar"</b>. <b>Se arma sola</b> con lo que de verdad hay hoy, y lo que no está pedido, programado ni pendiente <b>no aparece</b>:'],
    ['lista', [
      '<b>Primero lo urgente</b> (en rojo): alguien que llegó sin aviso y espera la respuesta del vecino, un "Estoy bien" o una salida sin regreso, avisos de vecinos sin ver, peticiones sin recibir, el camión adentro sin salida, un correo adentro hace más de una hora.',
      '<b>Lo programado para hoy, por hora</b>: las visitas y viajes anunciados (con la hora, el nombre y el lote), los ingresos frecuentes que tienen hoy entre sus días, las obras y los proveedores que vienen (con el control de la ART y, si alguno la tiene vencida, "no entra"), el camión el día que pasa, las vans del hotel, los empleados del hotel que trabajan hoy y todavía no llegaron, y el policía contratado (en el turno de noche o si ya está de servicio).',
      '<b>Lo pendiente</b>: quién está adentro sin la salida registrada (también los correos), las casas solas por revisar y los pedidos firmados de vecinos que siguen vigentes hoy (no dejar pasar, llaves, permisos).',
      '<b>De todo turno</b> (en celeste): anotar las novedades en la bitácora y el relevo: cada guardia marca su salida al terminar su horario.',
    ]],
    ['p', 'Se entiende de un vistazo: a la izquierda del título, un <b>anillo</b> con cuántas cosas faltan (se va llenando de verde con lo hecho) y, al lado, fichitas de color con cuántas son <b>urgentes</b> (rojo), <b>programadas</b> (naranja) y <b>del día</b> (azul). Cada tarea es una tarjeta con su color a la izquierda, la <b>hora grande</b> si tiene, una etiqueta (Urgente, Con hora, Programado, Del día, Cada turno, Vigente) y una flecha. Lo urgente late.'],
    ['p', 'Tocar una tarjeta te lleva a donde se hace. Cuando la app ve que algo está hecho, sale de la lista y pasa a las fichitas verdes <b>"Hecho hoy"</b> (sin tachados).'],
    ['h', 'Arriba: turno, policía, camión y correos'],
    ['p', 'Arriba de la portada hay <b>cuatro tarjetas de colores</b> que dicen cómo está cada cosa y se tocan para hacerla:'],
    ['lista', [
      '<b>Guardia</b> (naranja con sol de día, azul con luna de noche): quiénes están y hasta qué hora es el horario de cada uno. Tocala para el relevo (Entra / Sale).',
      '<b>Policía</b>: "Nadie de servicio" dice a qué hora empieza su horario esta noche → tocala para <b>registrar su ingreso</b>. Cuando está, se pone azul y dice si está en ronda o cuántas lleva; tocarla te baja a su tarjeta con todos los botones (ronda, su tarjeta, salida).',
      '<b>Camión de la basura</b>: dice si hoy pasa. Tocala para <b>registrar la entrada</b>; adentro se pone verde y dice hace cuánto entró: tocala otra vez cuando sale.',
      '<b>Correos</b>: tocala para <b>registrar la entrada</b> de un correo; dice cuántos hay adentro y, debajo, cada uno con "Registrar la salida" y "Avisar a otro lote".',
    ]],
    ['p', 'La Administración y la supervisión ven las mismas tarjetas, solo para mirar.'],
    ['h', 'La guardia: cada uno con su horario'],
    ['p', 'Los horarios de la guardia se superponen: <b>Mañana de 7 a 15</b>, <b>Día de 8 a 20</b>, <b>Tarde de 15 a 23</b> y <b>Noche de 23 a 7</b>: cuatro renglones en la línea del día (los define la Administración; si quedaron guardados solo tres, la app usa los cuatro). Ya no hay "un turno" para todos: <b>cada guardia marca su entrada y su salida</b>. El policía nocturno va aparte, con su propio horario.'],
    ['pasos', ['Si no hay nadie anotado, al abrir aparece <b>"¿Quién entra a la guardia?"</b>, con la línea del día. Escribí tu nombre y elegí tu horario (el que corresponde a esa hora viene marcado). Si entran dos a la vez, cada uno en su renglón con su horario. Hasta que no lo hacés, la única ventana es esa. Si la app se cerró con la guardia en marcha (o entrás desde otro equipo), aparece <b>"Soy de ese turno: seguir"</b>.',
      'Tocá la tarjeta <b>Guardia</b> de arriba (o la teja <b>"La guardia de hoy"</b>): está la <b>línea del día</b>, de 7 a 7, con un renglón de color por horario: en punteado lo previsto, relleno lo que estuvo cada uno (con su nombre) y la raya roja de la hora actual.',
      '<b>Cuando llega alguien</b> (por ejemplo, el de 8 a 20 mientras sigue el de 7 a 15): en "Por entrar" está su horario. Escribí su nombre y tocá <b>"Entra"</b>. Se suma a la guardia sin cortar nada.',
      '<b>Cuando alguien se va</b>: en "En la garita ahora" cada guardia tiene su barra con lo que le falta y el botón naranja <b>"Sale"</b>. Dejá las novedades para el que sigue y, si llega su reemplazo (por ejemplo, a las 15 entra el de la tarde), escribí su nombre en <b>"¿Entra alguien en su lugar?"</b>: es el relevo en un solo paso.',
      'Al marcar una salida sale <b>el parte de ese tramo</b> por correo a la Administración y sus novedades quedan arriba como <b>"Novedades del relevo"</b>: la carita y el color del horario del que se fue, a qué hora salió y hace cuánto, y lo que escribió en un globo, en la pantalla de entrada y en la Bitácora. El que entra toca <b>"Leído"</b> y se pliega (un toque la vuelve a abrir); si llega una nota nueva, aparece abierta otra vez.',
      'Si el que se va es el último y no entra nadie, la guardia se cierra como antes y queda la pantalla para anotar al que llegue. También está <b>"Cerrar la guardia (se van todos)"</b>.']],
    ['lista', ['Si un horario empezó hace más de 15 minutos y nadie marcó la entrada, la tarjeta Guardia se pone con borde amarillo y avisa <b>"Falta el guardia de Tarde (15 a 23 h)"</b>.',
      'Si alguien se pasó más de 20 minutos de su horario sin marcar la salida, avisa <b>"… terminó a las 15: ¿ya salió?"</b>.']],
    ['p', 'En <b>Turnos</b> está la misma línea del día, quién hizo cada horario y <b>Últimos turnos como calendario</b>: elegís el <b>año</b>, el <b>mes</b> y tocás el <b>día</b> (cada día se pinta más fuerte cuantos más turnos hubo, con un punto rojo si hubo un incidente y uno amarillo si vino el policía). Al tocarlo se ve ese día dibujado de 0 a 24 h, con cada turno y el policía, y una tarjeta por turno con sus guardias y <b>"Ver el parte"</b>. Lo de más de 60 días se trae de la base con <b>"Traer"</b> el mes. Abajo, la <b>policía nocturna</b> (un cielo de noche con la luna que avanza sola como un reloj, de la hora de entrada a la de salida, y la semana entera), <b>las noches del policía</b> y, plegados, los puntos de control de la ronda.'],
    ['h', 'Ingresos de hoy: todo lo que entra y sale'],
    ['p', 'Arriba de la lista, una escena con la ruta y la <b>barrera que se abre</b> cuando pasa un auto, y tres números grandes: cuántos <b>entraron</b>, cuántos <b>salieron</b> y cuántas visitas están <b>adentro</b>. En la línea del día, lo que entra lleva la etiqueta verde <b>ENTRÓ</b> y lo que sale, la gris <b>SALIÓ</b>.'],
    ['p', 'La lista <b>Ingresos de hoy</b> junta todo lo del día, de 00 a 24 h: arriba, en fichas de color, cuántos entraron de cada cosa (visitas, sin aviso, camión de residuos, correos, proveedores y personal, hotel, policía); después las <b>visitas anunciadas</b> con sus botones; los <b>huéspedes del hotel</b> que llegan o se van hoy, con <b>"Ingresó"</b> y <b>"Salió"</b>; y al final <b>"Todo lo que entró y salió hoy"</b>, cada movimiento con su hora (también las visitas sin aviso que el vecino autorizó o no). Sale de lo que ya registrás: no hay que cargar nada dos veces.'],
    ['h', 'Avisos de vecinos: "viene una visita sin aviso"'],
    ['p', 'Cuando un vecino avisa que va a llegar una visita sin pase ni QR, lo ves todo el día en <b>Avisos de vecinos</b>, con el nombre y la hora si los puso. Cuando la visita llega, tocá <b>"Llegó: preguntarle al vecino"</b>: se abre "Llegó sin aviso" ya completo con su lote.'],
    ['h', 'Visitas de hoy'],
    ['p', 'Arriba del buscador de códigos está la tarjeta <b>Visitas de hoy</b>. La barra de colores muestra el día de un vistazo: en gris las que <b>ya salieron</b>, en verde las que están <b>adentro</b> y en azul las que <b>faltan llegar</b>.'],
    ['p', 'Debajo hay dos tarjetas. <b>Por llegar</b> cuenta las visitas anunciadas que todavía no entraron y dice cuál es la próxima (nombre, hora y lote). <b>Adentro ahora</b> cuenta las que entraron y no salieron, y dice cuál está adentro hace más tiempo. Tocar cualquiera de las dos te baja a la lista <b>Ingresos de hoy</b>.'],
    ['h', 'Validar un ingreso'],
    ['p', 'La tarjeta <b>"Código, patente o DNI"</b> tiene una casilla que parece una patente: al tocarla, la barrera del dibujo se levanta y el semáforo pasa a verde. Debajo, los botones de color: Escanear QR, Leer patente, Llegó sin aviso, Ingresos frecuentes, Historial de visitas y Aviso urgente.'],
    ['pasos', ['Escribí el <b>código de 6 números</b>, la <b>patente</b> o el <b>DNI</b> y tocá la lupa, tocá <b>"Escanear QR"</b> o tocá <b>"Leer patente"</b> y apuntá la cámara a la patente del auto.', 'La app dice si el pase es para hoy y para este horario, quién lo autorizó y si hay una restricción firmada ("no dejar pasar").', 'Tocá <b>"Ingresó"</b>; cuando se va, <b>"Salió"</b>. Al vecino le llega el aviso.']],
    ['h', 'Leer la patente con la cámara'],
    ['pasos', [
      'Tocá <b>"Leer patente"</b> (debajo del validador). Se abre la cámara con un recuadro amarillo con la forma de una patente.',
      'Apuntá: que la patente entre justo en el recuadro. <b>No hay que tocar nada</b>: lee sola, varias veces por segundo, como el QR. Abajo del recuadro vas viendo lo que va leyendo.',
      'Apenas la reconoce suena, vibra y sale el resultado: el pase, el auto de un vecino, una van o un huésped del hotel. Una patente que el barrio ya conoce la da por buena al instante, aunque haya leído mal una letra.',
      'Si no está, te muestra la patente grande y te ofrece "Registrar llegada sin aviso" con la patente ya cargada. Si leyó mal, tocá <b>"No es esa: leer otra vez"</b>, o escribila en la caja de abajo de la cámara.',
    ]],
    ['p', 'Entiende las patentes nuevas (AA 123 BB y, de moto, A 123 BBB) y las viejas (ABC 123 y 123 ABC). La imagen se lee en el mismo teléfono: no se guarda ni se manda a ningún lado. El programa lector se baja solo apenas abrís la garita (una vez; después queda en el teléfono), así la cámara lee al instante. Si el teléfono tiene zoom, arranca en 2x: no hace falta acercarse tanto. Sin internet la primera vez, escribí la patente.'],
    ['p', 'Si alguien llega sin aviso: <b>"Llegó sin aviso"</b>, elegí la casa y el motivo. Les salta "Que pase / No lo conozco" <b>a todos los que viven en ese lote</b>; ves la respuesta al instante y quién contestó. A los 2 minutos sin respuesta aparece <b>"Llamar"</b> a cada uno de los que viven ahí. En "¿A qué casa va?" figuran todos los que viven en cada lote, también la Administración que tiene lote. Cuando el vecino dice "Que pase", la visita queda <b>"Adentro"</b> en la garita y, cuando se va, tocá <b>"Salió"</b>: queda la salida en el libro de guardia y en Ingresos de hoy, y al lote le llega "… salió del barrio".'],
    ['p', '<b>Va al hotel</b> (para quien viene a desayunar, almorzar, merendar, cenar o al spa, que no es visita de nadie): tocá <b>"Va al hotel"</b>, escribí la patente o tocá <b>"Leer"</b> para leerla con la cámara, el auto si querés, <b>a qué viene</b> (se sugiere solo según la hora) y <b>cuántas personas</b> son, y <b>"Pasa al hotel"</b>. Al hotel le llega en vivo, por ejemplo, <b>"Llegan 2 al restaurante · Cena · Fiat Cronos AB 123 CD"</b>, y en el libro de guardia queda la entrada como "Cliente del hotel". Mientras están adentro se ven en <b>"En el hotel ahora (clientes)"</b>; cuando se van, <b>"Salió"</b>. Si la patente no tiene pase, la búsqueda también ofrece "Va al hotel".'],
    ['p', '<b>Huéspedes del hotel con su pase</b>: el hotel les manda por WhatsApp un pase que dice <b>HUÉSPED DEL HOTEL</b>. Al leer su QR, escribir su código o leer su patente (también la de un auto rentado) se abre su ficha: si el pase vale hoy, <b>"Entra"</b> o <b>"Sale"</b> (y "Va a pie" si no viene en auto); si no, en rojo <b>"El pase no vale hoy"</b>. Queda en el libro de guardia sin el nombre. <b>La agenda del hotel</b>: cuando la gerencia aprueba la de mañana se te abre una ventana "Lo que llega del hotel mañana", solo para mirar; tocá <b>"Recibido"</b>. También está en Hotel → En vivo → "Agenda del hotel" y "Bitácora del hotel".'],
    ['p', '<b>La visita que no vino</b>: a las <b>2 horas</b> de la hora anunciada, si no entró, pasa sola de "Esperado" a <b>"No ingresó"</b> (todavía puede llegar: "Ingresó" sigue andando). Cuando pasa la <b>hora de salida</b> del pase, queda <b>"Cancelado · no ingresó"</b>: se anota sola en la bitácora ("Visita anunciada que no ingresó") y <b>desaparece de la pantalla</b> de la garita, así no se llena de visitas que ya no vienen. El vecino la sigue viendo en Mis visitas con ese estado. A las 2 horas, al vecino le llega el aviso con "Cambiar el horario" o "Ya no viene"; si elige "Ya no viene", el pase se cancela y en la bitácora queda "Visita anunciada que ya no viene".'],
    ['p', '<b>Pase vencido</b>: si igual aparece después, buscala por el código, la patente o el DNI: "Ingresó" queda deshabilitado y aparece <b>"Pase vencido"</b>. Si la persona está en la garita, elegí "preguntarle al vecino" (le salta "Que pase / No lo conozco"); si no vino, "solo avisarle que venció".'],
    ['h', 'El Hotel Los Cauquenes'],
    ['p', '<b>La tarjeta del hotel</b> (cobre, con el nombre del hotel): arriba tres números que se tocan — <b>huéspedes por llegar</b>, <b>eventos de hoy</b> y <b>vans en el barrio</b> — y <b>"En vivo"</b> para ver todo el hotel. Abajo, cada huésped que llega hoy con su botón <b>"Ingresó"</b>, y los eventos con su hora.'],
    ['p', '<b>Lote alquilado</b>: cuando alguien llega sin aviso a un lote alquilado, la lista de "¿A qué casa va?" muestra solo al inquilino y su familia: al propietario que no vive ahí no se le consulta. Los correos que van a ese lote le avisan al inquilino.'],
    ['p', 'En la portada de la garita, la solapa <b>Vans del hotel · hoy</b> tiene los traslados programados para hoy, por hora, cada uno con su botón grande <b>"Salió"</b> y, cuando vuelve, <b>"Volvió"</b>: un toque y queda todo anotado (bitácora, traslado y aviso a la recepción). Si el traslado no tiene van asignada, la app pregunta cuál sale. Abajo, cada van con su botón para una salida o entrada que no estaba programada (también sirve leer su QR). Aparte, la banda del hotel muestra los <b>huéspedes</b> que llegan (con "Ingresó") y sus <b>eventos</b>. Sus proveedores también tienen QR: con la ART vencida, no pasan.'],
    ['h', 'La bitácora: el libro del día'],
    ['p', 'Arriba se escribe. Elegí <b>una de tres</b>: <b>Novedad</b> (lo de rutina), <b>Incidente</b> (lo grave: le suena siempre a la Administración, en rojo) o <b>Ronda de la guardia</b>. Debajo salen <b>frases rápidas</b> para tocar ("Sin novedades", "Portón revisado", "Luz quemada en…") y la caja para escribir; la flecha lo anota. En la novedad o la ronda podés tildar que le suene también a la Administración.'],
    ['p', 'Para mirar, seis casillas de color con cuántos registros hay hoy, que también filtran: <b>Todo</b>, <b>Novedades</b>, <b>Incidentes</b>, <b>Rondas y policía</b> (las de la guardia y, solas, todo lo del policía y las casas solas revisadas), <b>Entradas y salidas</b> (las anota la app sola con cada ingreso) y <b>Turnos</b> (empezar y cerrar, también solos). El buscador encuentra en lo de hoy por nombre, lote o patente. Cada registro es una tarjeta en una línea de tiempo, agrupada por hora, con quién lo escribió; los incidentes laten en rojo. Abajo, "¿Qué es cada cosa?" lo explica.'],
    ['p', '<b>La Bitácora en la garita</b>: está justo debajo de "Hoy la garita no puede olvidar" (en la computadora, en la columna de la derecha). Es un libro que se abre con el día, cuántos registros hay y a qué hora fue el último, y "En vivo" porque se actualiza sola. Arriba, <b>"¿Qué querés anotar?"</b>: tocá Novedad, Incidente o Ronda de la guardia y se despliegan las frases rápidas y el renglón para escribir; al mandarlo queda anotado y se vuelve a cerrar. Debajo, las <b>secciones del libro</b> en fichas de colores con su número (Todo, Novedades, Incidentes, Rondas y policía, Entradas y salidas, Turnos): tocá una y ahí mismo ves lo último de esa sección; la que tuvo algo en los últimos 15 minutos tiene un puntito que late. <b>"Abrir el libro completo"</b> lleva a la ventana con el buscador, "Otro día" e "Historial de visitas". La Administración y la supervisión la ven igual, pero sin el renglón para escribir.'],
    ['p', '<b>"Lista" u "Hojear"</b>: con <b>Hojear</b> la bitácora se lee como un cuaderno, <b>una página por cada hora</b> del día que tuvo algo (de la sección elegida). Abre en la hora más nueva. <b>Tocá la mitad derecha de la hoja</b> (o deslizá el dedo hacia la izquierda) para pasar a la siguiente y la mitad izquierda para volver: la hoja gira. Abajo, la tira de horas (con cuántos registros tiene cada una) salta directo a esa página, y las flechas pasan de a una. El teléfono recuerda cómo la dejaste.'],
    ['p', 'La <b>Bitácora</b> muestra solo lo de <b>hoy, de 00 a 24 h</b>. Para ver otro día (o varios, hasta 31), tocá <b>"Ver otro día"</b>, elegí las fechas y, si querés, una palabra: se trae de la base en ese momento, con su planilla. Así la app no carga meses de registros al abrir. Lo mismo para la Administración y la supervisión.'],
    ['p', '<b>Historial de visitas</b> (en la Bitácora y en el control de acceso): arriba cuatro números (visitas, este mes, lotes y adentro ahora), el buscador y fichas de color por tipo (visita, personal fijo, proveedor…) que filtran. Cada visita es una tarjeta con su color, el lote, quién la autorizó, su estado (Por venir, Adentro ahora, Salió, No vino, Cancelado) y una barrita con la hora en que entró, la de salida y cuánto se quedó. Están agrupadas por mes; abajo, la planilla.'],
    ['p', '<b>Uber, DiDi o taxi</b>: si el vecino avisó, aparece en "Ingresos de hoy" como "Uber · nombre del chofer", con la patente y si viene a buscarlo o trae algo. Escribí la patente en el validador y tocá "Ingresó" y después "Salió". Si no avisó, "Llegó sin aviso" con el motivo "Uber / DiDi / taxi".'],
    ...(hayPaquetes() ? [['h', 'Paquetes'],
    ['pasos', ['<b>"Llegó un paquete"</b>: elegí para quién, la empresa, un detalle y sacale una foto a la etiqueta.', 'Al guardar, se avisa a todas las cuentas de ese lote.', 'Para entregar: <b>"Entregar"</b> → <b>"Leer el QR de retiro del vecino"</b>. Si la firma es válida, compará la persona con la foto y tildá los paquetes.', 'Sin teléfono: <b>"Sin teléfono: firma y DNI"</b>. Si retira otra persona, elegí "Otra persona" y anotá su nombre y DNI.']]] : [['ojo', 'info', 'La garita no recibe paquetes', 'El barrio no aprobó que la garita reciba correo ni paquetes de los vecinos. Si llega un correo, registralo con el botón <b>Correos</b> (abajo) y va a la casa. Un delivery se trata como cualquier ingreso: se consulta al vecino y pasa a su casa o no.']]),
    ['p', '<b>Escribir a un lote o a vecinos</b> (en Mensajes con vecinos): elegí el lote y tildá a todo el lote o solo a quién le escribís.'],
    ['p', '<b>Ingresos frecuentes → QR → "Mandarlo por WhatsApp (QR y código)"</b>: le llega solo la tarjeta del pase (QR grande, código debajo, días y horario, y el mapita), sin texto ni enlaces.'],
    ['p', 'En <b>Ingresos frecuentes</b> están también, arriba, <b>"Personal fijo de los vecinos"</b>: las empleadas, jardineros y personal de obra que cada vecino autorizó con "Viene varias veces". Cada uno dice el lote, quién lo autorizó, los días y el horario, y en verde <b>"Hoy le toca"</b> si viene hoy. Entra con el QR que le mandó el vecino; "Ingresó" y "Salió" se marcan igual que cualquier visita. El buscador encuentra por nombre, patente o lote.'],
    ['p', 'Debajo está <b>"Empleados del Hotel Los Cauquenes"</b>: los que cargó el hotel, con su puesto, sus días y su horario. Arriba los que están adentro y los que trabajan hoy. <b>La entrada se marca solo los días autorizados</b>: un día que no es suyo dice en rojo <b>"Hoy no es su día: no entra"</b> y no aparece el botón "Entró" (llamá a la recepción del hotel; si hoy trabaja, que le agreguen el día). Fuera de su horario entra igual, con una observación. <b>La salida se marca siempre</b>. Se lo reconoce de tres maneras: leyendo el <b>QR de su parabrisas</b>, con el <b>lector de patentes</b> (si el hotel cargó su auto) o escribiendo en "Código, patente o DNI" el <b>código de 5 signos</b> que dice. Ves su DNI tapado (los tres últimos números, para cotejar). Los que trabajan hoy y todavía no llegaron salen también en <b>"Hoy la garita no puede olvidar"</b>, con la hora.'],
    ['h', 'Personal de mantenimiento del barrio'],
    ['p', 'En la portada de la garita, la banda de colores <b>"Personal de mantenimiento"</b> (con los engranajes) tiene a cada persona de mantenimiento del barrio, con su color y sus iniciales.'],
    ['pasos', ['<b>La primera vez</b>: tocá <b>"Agregar a alguien"</b>, escribí nombre, apellido y DNI (y si querés la tarea: jardinería, electricidad…), su <b>celular</b> (para que le llegue el enlace por WhatsApp) y su <b>correo</b> (para el parte del día), y <b>"Guardar"</b>. Queda grabado: no hay que volver a cargarlo. El mismo DNI no se puede cargar dos veces.',
      '<b>Cuando llega</b>: tocá el botón verde <b>"Entrada"</b> de su tarjeta. Salta un festejo de papelitos, la tarjeta se pone verde, empieza a correr <b>"Adentro hace…"</b> y se abre WhatsApp con su enlace de <b>Mantenimiento en vivo</b>: tocá Enviar (ver el capítulo "Mantenimiento en vivo").',
      '<b>Cuando se va</b>: tocá el botón naranja <b>"Salida"</b> de la misma tarjeta. Su enlace se apaga y le sale el parte del día por correo.',
      'Para corregir un dato (o si cambió de tarea), tocá el <b>lápiz</b> de su tarjeta: se ve el DNI completo y se edita. Ahí está también <b>"Sacarlo de la lista"</b>, que borra sus datos.']],
    ['lista', ['Cada entrada y salida queda en la <b>bitácora</b> con el nombre y la tarea (sin el DNI). La barrita de cada tarjeta muestra los ratos que estuvo adentro hoy, de 6 a 22 h.',
      '<b>Tarea de hoy y lugar</b>: debajo del nombre está el botón <b>"¿Dónde trabaja hoy?"</b> (titila en naranja si ya entró y todavía no tiene). Tocalo, escribí la tarea (corte de pasto, poda, luminarias…) y elegí dónde: <b>Garita y portón</b>, <b>Espacio verde</b>, <b>La costa del Canal</b>, <b>Recorre todo el barrio</b>, o una <b>calle</b> o un <b>lote</b> de la lista. Queda escrito en su tarjeta (por ejemplo "Espacio verde · Corte de pasto") y en la bitácora, y los vecinos lo ven como un pin con casco en Mantenimiento en vivo. Vale solo por hoy: mañana se vuelve a asignar.',
      'Con el botón del <b>mapita</b> al lado de la tarea, se abre el <b>mapa del barrio</b> y va derecho a donde está trabajando.',
      '<b>"Movimientos de hoy"</b> abre la lista completa con buscador (nombre, DNI o tarea) y todas las entradas, salidas y tareas del día.',
      'Si alguien figura adentro hace más de 12 horas, su tarjeta se pone amarilla: <b>"¿Se olvidaron de marcar la salida?"</b>.',
      'Mientras haya alguien adentro, los vecinos (y el hotel) ven en su portada <b>"Mantenimiento trabajando en el barrio"</b>, y al tocarla, el mapa con lo que están haciendo y el nombre con la inicial del apellido (sin DNI, celular ni correo). Desaparece cuando marcás la salida del último.',
      'La Administración ve la misma banda (en la garita en vivo) y puede agregar o editar, pero las entradas y salidas las marca solo la garita. La supervisión no ve esta lista: ve las entradas y salidas en la bitácora.']],
    ['h', 'El camión, los correos, el policía y la ronda'],
    ['lista', ['<b>Camión de la basura</b>: registrá la entrada (patente) y la salida. A todo el barrio le llega el aviso.',
      '<b>Correos</b> (la tarjeta naranja de arriba): tocala, elegí la empresa (Correo Argentino, Andreani, OCA, OCASA, Mercado Libre u <b>Otro</b>, que pide el nombre) y <b>"Registrar la entrada"</b>. Si el correo te dice a qué casas va, escribí los lotes (por ejemplo "12, 40, 133A"): a esas casas les llega <b>"va a tu casa"</b> al celular. Si después va a otra casa más, <b>"Avisar a otro lote"</b>. Cuando se va, <b>"Registrar la salida"</b>: su camión deja de verse en todas las pantallas. Los lotes y la patente los ve solo la garita (y la Administración y la supervisión).', '<b>Bitácora</b>: el libro de guardia. Lo que se anota no se borra; un incidente le suena siempre a la Administración.']],
    ['h', 'La policía nocturna'],
    ['p', 'Es policía provincial que hace horas adicionales: tiene <b>su propio horario</b>, distinto del de los turnos de la garita. De <b>domingo a jueves de 21:59 a 06:00</b> y <b>viernes y sábado de 23:59 a 08:00</b> del día siguiente. La Administración lo cambia en Turnos → Policía nocturna → <b>"Cambiar el horario"</b> (el botón con el relojito que gira): se abre una ventana con las dos noches (domingo a jueves y viernes y sábado), cada una dibujada sobre una franja de las 18 a las 10 h que se mueve mientras cambiás las horas, con cuántas horas da cada noche, atajos de un toque (por ejemplo "21:59 a 06:00") y el total de horas por semana.'],
    ['pasos', [
      'Cuando llega, tocá la tarjeta <b>Policía</b> de arriba (o "Ingreso" en su solapa). Arriba se ve su noche con el horario y una barra hasta la hora de salida (las 6, o las 8 los viernes y sábados).',
      'Si ya vino antes, <b>tocá su fichita</b> ("¿Quién llega?") y se completan solos el nombre, el cargo, la matrícula, el celular y el correo. Si es nuevo, escribilos. El <b>cargo en la policía</b> (agente, cabo, sargento, oficial, comisario, comandante…, u "Otro" para escribirlo) es obligatorio: va en su tarjeta, en el libro de guardia y en la constancia. Si un policía quedó anotado sin cargo, en su solapa dice <b>"falta el cargo"</b>: tocalo y elegilo.',
      'La hora queda en <b>"Ahora"</b>; si lo anotás tarde, tocá "Otra hora" y poné el día y la hora. El turno de la garita se anota solo.',
      'Tocá <b>"Registrar el ingreso y armar su tarjeta"</b>: sale <b>su tarjeta</b> con su nombre, el cargo, la matrícula, la noche de servicio, su <b>código de ronda</b> y un QR.',
      '<b>"Mandarle la tarjeta por WhatsApp"</b> le manda la tarjeta como imagen con el mensaje y el enlace. Con eso (tocando el enlace o escaneando el QR de la tarjeta con su cámara, que también sirve ahí mismo en la garita) su teléfono queda listo para leer los QR de los puntos de la ronda. Ese mismo enlace le baja <b>una sola vez su recorrido</b>: los puntos en orden, el plano y la <b>foto chica de cada lugar</b> (unos 10 a 20 KB cada una), que quedan guardados en su teléfono. Al abrir el enlace ya le dice <b>"Empezá por el punto 1"</b> con la foto del lugar. En cada QR ve la foto del punto y, al registrar el paso, el teléfono vibra y le muestra <b>el próximo punto con su foto grande en pantalla</b> (si se salteó uno, se lo avisa); al terminar, "¡Ronda completa!" y que la próxima empieza por el 1. "Ver todo mi recorrido" le muestra los que ya leyó tildados y el próximo en naranja. <b>Si no le llegó el enlace</b> (por ejemplo, el WhatsApp no se abrió), en el primer QR que lee le pide el código de 6 números: con ese código su teléfono baja igual el recorrido con las fotos y desde ahí le muestra el próximo punto. <b>El código y el enlace valen para todo su servicio</b> (hasta 14 horas, las 3 rondas): no hace falta volver a leer la tarjeta antes de cada ronda, puede salir a recorrer cuando quiera. Dejan de valer cuando la garita registra su salida o pide un "Código nuevo". <b>Sin señal</b> (el perímetro, la calle más oscura) también puede leer el QR: el paso <b>queda guardado en su teléfono con la hora exacta</b> en que lo leyó, le muestra igual el próximo punto y se manda solo apenas vuelve la señal (con la página abierta, o al leer el próximo QR). En la garita aparece con la hora real del punto.',
      'En su solapa: <b>"Su tarjeta"</b> para volver a mostrarla o mandarla, y <b>"Se va"</b>. Con los QR de los puntos, <b>las rondas las abre el policía solo</b>, al leer el primer punto, y cada una se anota con la hora de cada QR: la garita <b>no puede abrirle rondas</b> (sin QR cargados, sigue el botón "Sale a una ronda"). Mientras hay una ronda en curso aparece <b>"Terminó la ronda"</b> para darla por terminada (si faltaron puntos, queda incompleta).',
      'Si un QR falló, <b>"Anotar ronda a mano"</b> pide <b>el motivo</b> (QR roto, sin batería o señal, recorrió en el auto u otro). Queda como <b>anotada por la garita</b>, con tu nombre y el motivo en el libro, y <b>no cuenta para la meta</b> de rondas completas.',
      'El <b>nombre y apellido</b> del policía son obligatorios (con una sola palabra no se registra): es lo que va en su tarjeta y en su constancia.',
      'Al irse, <b>"Se va"</b>: se ve el resumen de su noche (horas, rondas, incompletas) y "Ahora" (u "Otra hora"). Su servicio se cierra y queda en <b>Turnos → Servicios del policía contratado</b>.',
      'Al registrar la salida, la app le manda <b>por correo la constancia de su servicio en PDF</b> (un correo corto con el archivo adjunto). El PDF lleva la portada del barrio, su nombre, cargo y matrícula, la fecha y los horarios, "La noche de un vistazo" (una barra del ingreso a la salida con cada ronda), <b>cada ronda en un recuadro de otro color</b> con la hora de cada QR y los minutos entre punto y punto (completa, o incompleta con lo que faltó), lo que anotó la garita y, al final, un <b>agradecimiento del barrio</b> por su trabajo. En Turnos, "Ver la constancia" la muestra igual que como le llega, con "Imprimir o guardar en PDF". Si no dejó correo, se puede poner en la salida.',
    ]],
    ['h', 'La ronda en el mapa, en vivo'],
    ['p', 'La meta es que el policía haga <b>3 rondas completas</b> por noche (la Administración puede cambiar el número). En su solapa se ven los <b>tres anillos</b>: verde con la hora cuando la ronda pasó por todos los puntos, el que está en curso con cuántos puntos lleva ("3/7"). <b>"Seguirlo en el mapa"</b> abre el Mapa del barrio, donde arriba aparece la tira <b>"Ronda del policía"</b> (con su interruptor para mostrar u ocultar el recorrido):'],
    ['lista', ['El recorrido planeado es una <b>línea azul que corre</b> por las calles, del punto 1 al último.',
      'Cada punto que el policía lee queda <b>verde y fijo, con la hora</b>, y el tramo entre dos puntos seguidos ya leídos se pinta de verde. Los que <b>faltan titilan</b> (azul y naranja) mientras haya policía de servicio.',
      'El próximo punto además <b>late</b> con una onda, y una <b>gorra de policía</b> marca dónde leyó por última vez. Cuando completa la ronda, queda toda en verde 15 minutos y después vuelve a empezar.',
      '<b>"Simular"</b> dibuja el recorrido en amarillo y lo recorre la <b>gorra de policía</b>: la línea se pinta justo hasta donde va la gorra, las dos a la misma velocidad (pareja y tranquila, según el largo del recorrido), con la distancia y los minutos caminando (aproximados). Da dos vueltas y vuelve a la ronda en vivo.',
      'Tocar un punto muestra su foto chica, a qué hora lo leyó y <b>"Bajar la foto en grande"</b> si la querés guardar en tu equipo.',
      'Esto mismo lo ven, en vivo, la Administración y la supervisión; los vecinos lo ven en "De guardia", sin el nombre del policía.']],
    ['p', 'En Turnos, <b>"Las noches del policía"</b> es una tira con las <b>últimas 14 noches</b>: cada noche tiene una bolita por ronda (<b>verde</b> completa con QR, <b>ámbar</b> incompleta, <b>gris</b> anotada por la garita) y cuántas completas hizo de la meta. Las rondas se cuentan <b>por noche</b> (de las 21:59 del lunes a las 6 del martes es "la noche del lunes"), no por día de calendario: así un día no suma las rondas de la madrugada anterior con las de esa noche. Tocá una noche: se ve cada policía con su barra de servicio y sus rondas encima, el anillo de la meta, cuántas fueron de cada clase y por qué, "Ver la constancia" y "Reenviar la constancia". Si quedó anotado con una sola palabra (por ejemplo "Rojo"), dice en rojo <b>"Falta el apellido"</b>: con <b>"Completar el nombre"</b> se corrige en todo su servicio y la constancia sale con el nombre nuevo (después tocá "Reenviar"). Antes se veían los últimos 7 servicios en lista. Los anteriores se traen de la base con <b>"Ver servicios anteriores"</b> (con buscador y planilla), así la app no carga meses de rondas al abrir. Ahí también cada servicio tiene <b>"Ver la constancia"</b>: el PDF no se guarda como archivo aparte, la app lo vuelve a armar idéntico con lo que quedó en el libro de guardia (que se guarda desde el primer día), así no se puede perder ni cambiar; desde ahí se imprime o se guarda en PDF, y "Volver a la lista de servicios" regresa al buscador. Si el policía sigue cuando cambia el turno, pasa al que entra y su servicio es uno solo.'],
    ['h', 'El informe semanal para la Supervisión de Adicionales Policiales'],
    ['p', 'Todos los <b>sábados</b>, cuando la garita registra la <b>salida del policía que entró el viernes a la noche</b>, la app arma sola el informe de la semana (de la noche del sábado a la del viernes) y lo manda por correo, en <b>PDF con el logo del barrio</b>, a la Supervisión de Adicionales Policiales (<b>adicionalush@gmail.com</b>). Nadie tiene que tocar nada. Si el viernes no vino nadie o no se registró la salida, sale igual el sábado a las 12 desde la garita o la Administración.'],
    ['p', 'El informe abre con <b>"La semana de un vistazo"</b> (noches cubiertas, horas de servicio, rondas y cuántas se hicieron con los QR del hub digital), el <b>semáforo de las 7 noches</b>, lo que conviene mirar (una noche sin policía, un ingreso tarde, un punto que quedó sin leer) y el <b>mapa de calor</b> de las franjas de 2 horas. Después, <b>noche por noche</b>: el policía con su ingreso y su salida, cada ronda (con QR o sin QR, y la hora de cada punto) y <b>franja por franja</b> lo que pasó. Es distinto de la <b>constancia diaria</b>, que le llega a cada policía al irse.'],
    ['p', 'A la <b>Administración</b> le llega un aviso cada sábado ("Salió el informe semanal de la policía"). En <b>Turnos → "Informe semanal de la policía"</b> se ve la semana en curso y las anteriores, se toca una noche para ver su detalle, <b>"Ver el PDF"</b>, <b>"Mandarlo ahora"</b> e <b>"Informes enviados"</b>: la copia exacta de lo que salió, que se trae al teléfono solo cuando la pedís (así la app no se pone lenta). La Administración puede cambiar el correo de la Supervisión ahí mismo.'],
    ['p', 'Al anotar el ingreso de un policía, el <b>correo ya viene completo</b> con el de la Supervisión: si el policía da el suyo, se escribe encima; si no, su constancia diaria va a la Supervisión.'],
    ['h', 'Policías del barrio: la ficha y anular un ingreso'],
    ['p', 'En Turnos, debajo de las noches, está <b>"Policías del barrio"</b>: cada policía que vino (o que anotaste antes con <b>"Agregar"</b>) con su cargo, su matrícula, cuántas noches vino y la última. Con <b>"Editar"</b> corregís su nombre y apellido, el cargo, la matrícula, el celular y el correo: su próximo ingreso en "¿Quién llega?" se completa con esos datos, y si está de servicio ahora, su servicio de esta noche también. Las noches anteriores y las constancias que ya salieron no cambian. <b>"Ya no viene"</b> lo saca de los botones de "¿Quién llega?" sin borrar sus noches (quedan en "Policías que ya no vienen"); si vuelve, se reactiva solo al escribir su nombre, o con <b>"Vuelve a venir"</b>. La ficha la ven y la editan solo la garita y la Administración.'],
    ['p', 'Si un ingreso no tenía que estar (una <b>prueba</b> de los QR, un policía anotado por <b>error</b>), tocá <b>"Anular el ingreso"</b>: en su solapa de la portada (garita) o en su noche, en Turnos. Elegí el motivo (<b>Fue una prueba</b>, <b>Se anotó por error</b> u <b>Otro</b>, y lo escribís) y confirmá. Su servicio desaparece de Turnos, de las noches, del mes y de la meta; se dan de baja su código y su tarjeta, y se borran sus renglones de la bitácora, sus datos y la copia de su constancia en la bandeja de correos. Queda un solo renglón, sin su nombre: <b>"Se anuló un ingreso de policía (fue una prueba) · lo anuló la Administración"</b>. Si no vino ninguna otra noche, sale también de la ficha. La <b>garita</b> anula solo los del turno abierto; la <b>Administración</b>, cualquiera de los últimos 60 días. No se puede deshacer, y si la constancia ya le llegó por correo, queda en su casilla.'],
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
    ['h', 'El "Más" de la garita: por urgencia'],
    ['p', 'Al final de la portada, <b>Más</b> está ordenado en tres grupos. <b>Para atender ahora</b>: Peticiones, Mensajes con vecinos, Administración y Supervisión; si alguno espera respuesta, se pinta y lleva el número, la campanita se mueve y al lado del título aparece el número en rojo ("1 espera"). Si no hay nada, al lado del título está el sello verde <b>"AL DÍA"</b> con la tilde, y cada teja dice "✓ Al día". <b>Consultar</b>: Buscar un vecino, Pizarrón, Vuelos, Emergencias, Reglamento, el hotel y el Manual. <b>Registros y control</b>: Bitácora, Turnos, Proveedores, Obras y Cerrar el turno.'],
    ['p', 'Arriba hay un buscador: escribí parte de lo que buscás ("bit", "vuelo", "art") y quedan solo esas tejas; con <b>Enter</b> se abre la primera.'],
    ['p', 'Para hablar con la Administración: <b>Administración</b> en "Para atender ahora" (canal interno). Con los vecinos, por <b>Mensajes con vecinos</b> y las peticiones.'],
    ['h', 'La supervisión de la guardia'],
    ['p', 'Si la Administración habilita a un <b>supervisor de la guardia</b>, esa persona ve en su teléfono, en tiempo real, lo mismo que la garita: los ingresos, la bitácora, el turno, el policía y las rondas, las peticiones, los SOS y los pedidos del DEA. <b>No puede tocar nada</b>: no registra, no firma y no escribe en el libro. Cuando te escribe, te suena y aparece la teja <b>Supervisión</b> con el número de mensajes; contestale desde ahí. Esa conversación la ven solo la garita y la supervisión: ningún vecino.'],
    ['p', 'La supervisión mira la <b>bitácora del día</b> (de 00 a 24 h); para otros días toca "Ver otro día" y se trae de la base.'],
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
    ['h', 'Tu portada: el centro de control'],
    ['lista', [
      'Arriba, en rojo, cualquier <b>SOS</b>, <b>pedido del DEA</b> o <b>aviso urgente</b> activo. Un SOS nuevo además te salta a pantalla completa y suena, con el vecino, el lote y la ubicación.',
      '<b>El semáforo</b>: cuatro tarjetas en verde, amarillo o rojo. <b>Garita</b> (la app conectada y en pantalla, minimizada o desconectada), <b>Turno</b> (cuál y quiénes están de guardia), <b>Policía</b> (ronda en curso, o cuánto hace de la última: se pone en amarillo si pasa el tiempo que fijó la Administración) y <b>SOS</b> (abiertos o ninguno, y cuántos hubo hoy).',
      '<b>El día en números</b>: cuatro tarjetas de color que se tocan. <b>Ingresos hoy</b>, con las barras de los últimos 7 días y si hoy va arriba o abajo del promedio; <b>Adentro ahora</b>, con un anillo de cuántas visitas ya entraron de las anunciadas (y si alguien lleva más de 4 horas); <b>Rondas del policía</b>, un punto por ronda (verde completa, amarillo incompleta, azul en curso); y <b>Casas solas</b>, con la barra de las revisadas hoy. Los números suben contando cuando cambian y cada ícono hace un gesto al tocarlo. Tocar una tarjeta te lleva a su detalle (los ingresos y las casas solas en la garita en vivo, las rondas en Turnos y policía). Si hay pedidos firmados de vecinos que la garita no recibió, lo dice abajo.',
      '<b>En vivo</b>: el libro de guardia de hoy, a medida que la garita lo anota. Arriba, cuatro botones de colores (<b>Todo</b>, <b>Ingresos</b>, <b>Rondas</b> y <b>Novedades</b>), cada uno con cuántos registros hay hoy; el que elegís se marca con su color y la lista muestra solo eso. Abajo, "Ver la bitácora completa del día".',
      '<b>Las acciones</b>: escribirle a la garita o a la Administración (con los mensajes sin leer), dar el visto a los partes pendientes y el informe del mes.',
      '<b>Mirar</b>, abajo: arriba la tarjeta grande <b>Garita en vivo</b> (con cuántos están adentro, cuántos por llegar y los ingresos de hoy) y después tres grupos. <b>Seguridad</b>: Bitácora, Turnos y policía, Peticiones, <b>Historial de visitas</b> (quién vino, cuándo y a qué lote, con buscador y planilla) e <b>Ingresos frecuentes</b> (el personal y los proveedores de siempre, incluido el personal fijo de cada vecino, sin su código ni su QR, que son la llave para entrar). <b>El barrio</b>: Buscar un vecino, Obras, Proveedores y el hotel. <b>Informes y ayuda</b>: el informe mensual y este manual.',
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
      'Cada vez que un guardia marca su salida (o la garita cierra la guardia), se cierra un tramo y en tu portada aparece en <b>"Partes de turno para dar el visto"</b> (también en Turnos y policía → Últimos turnos). Arriba dice cuántos esperan y cuántos de la semana ya tienen el visto, con su barra. Cada parte es una tarjeta: el sol o la luna según el turno, el horario dibujado con cuántas horas duró, los guardias con sus iniciales y lo que pasó (incidentes en rojo, novedades y rondas).',
      'Tocá <b>Leer</b> para ver el parte: guardias, novedades, policía y rondas, y todo lo anotado en el libro en ese horario.',
      'Tocá el botón violeta <b>Dar el visto</b> y elegí <b>Sin observaciones</b> o <b>Con observaciones</b> (escribís cuáles). Tocá <b>Dar el visto</b>.',
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
    ['ojo', 'info', 'Qué ve el hotel y qué no', 'Ve lo suyo (vans, traslados, huéspedes, empleados, eventos, proveedores, promociones) y lo público de la ciudad (vuelos, cruceros, eventos, agenda, normas del barrio). No ve nada de los vecinos: ni el padrón, ni el pizarrón, ni sus visitas, ni los SOS.'],
    ['p', '<b>Direcciones del barrio</b>: la calle y la altura de cada lote, para indicarle a un huésped o a un proveedor cómo llegar. Se busca por lote o por calle. No muestra nombres ni teléfonos de los vecinos.'],
    ['h', 'La portada del hotel, de un vistazo'],
    ['lista', [
      'Arriba, <b>el hotel en vivo</b>, cuatro tarjetas de un vistazo: <b>traslados por hacer</b> (solo los que faltan desde ahora, con el próximo y cuánto falta), <b>llegan hoy</b> (personas, y cuántas ya entraron), <b>se van hoy</b> (y cuántas ya salieron) y <b>alojados</b> (los que siguen en el hotel: ni llegan ni se van hoy). El número sube contando cuando cambia y la barra muestra el avance. Cada tarjeta abre su lista con ese filtro puesto: "Llegan hoy" muestra solo a los que llegan, "Se van hoy" solo a los que se van, "Alojados" solo a los que se quedan.',
      '<b>Lo próximo</b>: la van que sale después, con la cuenta regresiva ("en 25 min"). Se pone naranja cuando faltan menos de 30 minutos y verde mientras está en viaje.',
      '<b>Vans ahora</b>: cada van dibujada con su chapa, una franja verde si está adentro del barrio o naranja si está afuera, desde qué hora y su próximo traslado.',
      '<b>Traslados de hoy</b>: un riel de 6 a 24 h con la marca roja de "ahora" y un punto por traslado (tocalo y se abre). Abajo, la línea de tiempo con filtros (<b>Por hacer</b>, En viaje, Hechos, Todos) en una botonera con una pastilla de color que se desliza hasta el elegido. "Por hacer" (el que viene puesto) muestra solo lo que falta desde la hora actual: la van en viaje y las que todavía no salieron (con 15 minutos de gracia). Un traslado cuya hora pasó y que la garita no registró queda como <b>"Sin registrar"</b> y se ve en "Todos". Tocá un traslado para ver la van, el chofer y la nota, y editarlo.',
      '<b>Hoy en Ushuaia</b>, en tres pestañas: <b>Vuelos</b> (un tablero como el del aeropuerto, con <b>Salidas</b> y <b>Llegadas</b>, las letras que giran, el estado de cada vuelo en color y el botón <b>"Van 14:10"</b> con la hora de salida ya calculada y cuánto falta; arriba, <b>"La próxima van"</b>, el vuelo que pide la van más pronto; <b>"Todos los vuelos de hoy"</b> abre el tablero completo), <b>Cruceros</b> (cuándo llega y sale cada barco, con "Buscar pasajeros" y "Llevar al barco") y <b>Eventos</b> de la ciudad.',
      '<b>El hotel en la app</b>: un mosaico de colores con el resto de lo del hotel (traslados automatizados, comunicación, promociones, eventos, empleados, proveedores, emergencias, ficha…). Vans y traslados, Vuelos para las vans y Huéspedes ya no se repiten acá: se abren desde las tarjetas en vivo, "Vans ahora" y Hoy en Ushuaia. Las tejas con algo pendiente laten y un brillo las recorre de a una, cada tanto.',
    ]],
    ['h', 'Las vans'],
    ['pasos', ['Entrá a <b>Vans y traslados</b> → "+ Van" (o, si todavía no hay ninguna, el botón <b>"Cargar la primera van"</b> de la cochera) y cargá nombre, patente, modelo, plazas y chofer. Arriba se arma en vivo su credencial, con la chapa como la de verdad.', 'Tocá <b>"QR"</b> en la van → "Imprimir el QR" y pegalo en el parabrisas, del lado del acompañante.', 'Cada vez que la van entra o sale, la garita lee el QR (o toca "Entró"/"Salió") y en la app ves dónde está cada van.']],
    ['h', 'Los traslados se arman solos'],
    ['lista', [
      'En la portada del hotel están los <b>vuelos</b> del día (partidas y arribos), los <b>cruceros</b> y los <b>eventos de la ciudad</b>, cada uno con su botón para programar la van <b>con la hora de salida ya calculada</b>.',
      'Si cargás un huésped con su <b>vuelo de llegada o de salida</b>, la app arma sola el traslado y junta a los que viajan en el mismo vuelo.',
      'Si el vuelo cambia de horario o se cancela en el aeropuerto, la app te avisa cuándo conviene salir, con un botón para <b>ajustar</b>.',
      'Antes de cada salida te llega un recordatorio. Cuando la van sale por la garita, el traslado pasa a "En viaje"; cuando vuelve, a "Hecho".',
      'En <b>Vans y traslados</b> elegís el día tocando la semana de arriba (cada día dice cuántos traslados tiene) y abajo está el <b>portón</b>: cuántas salidas y entradas hubo en las últimas 24 h, dónde está cada van y cada paso por la garita, con la hora, la chapa y el traslado.',
      'Los tiempos (minutos al aeropuerto, check-in, al puerto, embarque) se cambian en <b>Ficha del hotel</b>.',
    ]],
    ['h', '"+ Traslado": uno suelto o automatizados'],
    ['p', 'En <b>Vans y traslados</b> hay un solo botón, <b>"+ Traslado"</b>, arriba. Al tocarlo elegís:'],
    ['lista', [
      '<b>Nuevo traslado</b>: uno solo, un día y una hora (un vuelo, un crucero, una excursión). Elegís qué (llevar o buscar), a dónde, el día, la hora en que sale la van, los pasajeros, la <b>van</b> y el <b>chofer</b> (si no ponés ninguno, va el habitual de la van) y una nota.',
      '<b>Traslados automatizados</b>: las salidas y entradas que el hotel hace siempre. Cargás una vez el nombre (por ejemplo "Aeropuerto de la mañana"), qué y a dónde, <b>qué días</b> (todos, de lunes a viernes, fines de semana o los que elijas), la hora, los pasajeros, la van, el chofer, desde qué fecha y, si querés, hasta cuándo. La app <b>arma sola el traslado de cada día</b>, una semana para adelante, y la garita lo ve en su lista de vans.',
    ]],
    ['lista', [
      'Cada traslado automatizado se <b>edita</b> (cambia todos los días que todavía no salieron), se <b>pausa</b> (se sacan los programados hasta que lo reanudes) o se <b>borra</b>. Los que ya se hicieron quedan.',
      'Un día suelto lo cambiás o lo cancelás desde la lista de traslados, sin tocar los demás ("Cancelar solo este día" o "Borrar"). Lo que cambiaste a mano ese día no se pisa.',
      'En la lista, los automatizados llevan el ícono de las flechas que giran y su nombre.',
    ]],
    ['h', 'El hotel de ejemplo'],
    ['p', 'Mientras el hotel no cargó <b>nada propio</b> (ni una van, ni un traslado, huésped, evento o proveedor), la app muestra un <b>hotel de ejemplo</b> con el cartel <b>EJEMPLO</b>: dos vans, sus traslados de hoy y los automatizados, huéspedes inventados, un evento y dos proveedores, para ver cómo funciona todo. No se puede cambiar, no se guarda en la base, <b>la garita no lo ve</b> y <b>desaparece solo</b> apenas cargás lo primero tuyo. Si molesta, "Ocultar" lo saca en ese equipo.'],
    ['h', 'Huéspedes'],
    ['p', 'En <b>Huéspedes</b> cargá nombre, fechas, patente (si vienen en auto) y, si querés, los vuelos. La lista la ven <b>solo el hotel y la garita</b>, que la usa para dejarlos pasar. Se borra sola al día siguiente del check-out. Informales a tus huéspedes que compartís esos datos con la guardia del barrio.'],
    ['p', '<b>El pase HUÉSPED DEL HOTEL</b> (como las visitas de los vecinos, pero dice "HUÉSPED DEL HOTEL" y no "visita"): al guardar un huésped nuevo se abre su pase; tocá <b>"Mandárselo por WhatsApp"</b> y le llega una tarjeta con el QR y el código. Vale del check-in al check-out para entrar y salir cuantas veces quiera: <b>a pie</b>, en la van o <b>en auto</b>. La tarjeta (igual que la credencial de los empleados, que dice "PERSONAL DEL HOTEL") es como un pase de embarque en los colores del Canal Beagle: el saludo ("¡Bienvenidos, Familia Rossi!"), las fechas como un vuelo (llega → se va) con la van en el camino, el QR, el código en dos "asientos", las normas <b>"En el barrio, nos respetamos entre todos"</b> como cuatro stickers (máximo 20 km/h, casas sin fotos, cuidar la flora y la fauna, silencio) y un talón con "Cómo llegar". La ventana del pase trae además el texto de bienvenida con esas normas explicadas, y el WhatsApp, un resumen. Si alquila un auto, sumá la patente en "Editar" y la garita también lo reconoce con el lector de patentes. El ícono del QR, al lado de cada huésped, lo vuelve a abrir. En la garita, el QR (o el código, o la patente) abre su ficha con <b>"Entra"</b> o <b>"Sale"</b> y la casilla "Va a pie".'],
    ['h', 'Agenda inteligente de las 22 h'],
    ['p', 'Todas las noches a las <b>22:00</b> la app arma sola la <b>agenda de mañana</b> con lo que el hotel ya cargó: los huéspedes que llegan y los que se van, las vans y traslados (también los automatizados), los eventos, las entradas y salidas del personal, los proveedores que vienen (con su ART) y cuántos clientes de spa y restaurante se esperan (el promedio del mismo día de las últimas semanas). Se basa en cómo el hotel se mueve con el barrio: las entradas y salidas de personas, autos, vans, proveedores y clientes que registra la garita.'],
    ['p', 'Suena, llega el aviso y se abre la ventana. Cada tarea tiene <b>✓</b> (OK), <b>✎</b> (cambiar la hora o el texto) y <b>✕</b> (quitar); abajo, <b>"Agregar otra tarea para mañana"</b>. Las categorías de arriba filtran. <b>"Dar el OK a todo y guardar"</b> la aprueba: un traslado que quitaste se cancela y uno al que le cambiaste la hora sale a esa hora. Queda en la bitácora del hotel. <b>"Más tarde"</b> la deja en la portada, en la franja violeta "La agenda de mañana espera tu OK", y en la teja "Agenda de mañana". Antes de las 22 h, esa teja muestra una vista previa y "Armarla ahora".'],
    ['p', 'Apenas la aprobás, <b>a la garita le llega en una ventana</b> "Lo que llega del hotel mañana", solo para mirar (no puede cambiar nada), con el botón <b>"Recibido"</b>; a vos te llega "La garita recibió tu agenda". Hasta que alguien la recibe, en "Hoy la garita no puede olvidar" queda un solo renglón: "Agenda del hotel para mañana: leerla y tocar Recibido".'],
    ['h', 'Bitácora del hotel y el PDF de las 23:59'],
    ['p', 'A las <b>23:59</b> el teléfono de la garita cierra el día del hotel (si estaba apagado, a la mañana siguiente): junta solo lo del hotel y lo ordena por hora (vans, huéspedes que llegaron y se fueron, personal, clientes de spa y restaurante, eventos, la agenda aprobada). Le pone una nota de <b>convivencia</b> de 10 según las normas del barrio y te manda por correo el <b>PDF</b>: el día paso a paso, las normas cumplidas, lo programado para mañana, un agradecimiento y tres ideas para seguir sumando con la comunidad. En la teja <b>"Bitácora del hotel"</b> ves los últimos 7 días, el PDF ("Ver el PDF") y "Mandarlo de nuevo". No lleva nombres de huéspedes, DNI ni patentes de clientes, y se borra a los 90 días. El correo sale a la dirección de la cuenta del hotel.'],
    ['h', 'Empleados del hotel'],
    ['p', 'En <b>Empleados del hotel</b> cargás a cada uno <b>una sola vez</b>: nombre, apellido, DNI, puesto y, si querés, la patente de su auto, los días que trabaja y el horario. Al guardar aparece su <b>credencial</b>: un QR para imprimir y pegar en el parabrisas (o mandárselo por WhatsApp) y un <b>código de 5 signos</b> para decir en la garita, sin letras ni números que se confundan. Entra y sale con cualquiera de las tres cosas: el QR, la patente o el código.'],
    ['p', 'La garita lo ve en <b>Ingresos frecuentes</b> y le marca la entrada <b>solo los días que marcaste</b> (sin días marcados, cualquier día); la salida, siempre. Si cambia de turno, <b>Editar</b>. Si pierde la credencial o alguien la copió, <b>Editar → "Perdió la credencial"</b>: la vieja deja de valer al instante. Cuando deja de trabajar, <b>"Dar de baja"</b> borra su ficha con el DNI. Arriba ves cuántos de los tuyos están adentro ahora. Los datos los ven solo el hotel y la garita (la garita, el DNI tapado); en la bitácora del barrio queda el nombre, el puesto y la hora, nunca el DNI.'],
    ['h', 'Eventos, proveedores y promociones'],
    ['lista', [
      '<b>Eventos del hotel</b>: anunciá fecha, horario, invitados, ingreso, estacionamiento y música. La garita se entera al instante. Si marcás "avisar a los vecinos", la Administración decide si lo publica en el pizarrón.',
      '<b>Proveedores</b>: empresa, personal, patentes, días, horario, ART y seguro. Cada uno tiene su QR. Con la ART vencida, la garita no lo deja pasar. Cada uno se cambia con <b>"Editar"</b> o se saca con <b>"Borrar"</b> (su QR deja de servir). La Administración también puede editarlos o borrarlos: te llega el aviso.',
      '<b>Promociones</b>: las cargás, cambiás o borrás vos directamente ("Nueva promoción", "Editar", "Borrar") y salen enseguida en la postal del hotel, al pie de la portada de todos los vecinos. La Administración también puede cargarlas, cambiarlas o borrarlas: cada vez que uno toca algo, al otro le llega el aviso y queda registrado quién fue. Las vencidas dejan de verse solas. El enlace para reservar tiene que empezar con https://.',
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
  ], ir:[['abrir', 'hotel-traslados', 'Vans y traslados'], ['abrir', 'hotel-huespedes', 'Huéspedes'], ['abrir', 'hotel-empleados', 'Empleados'], ['abrir', 'expensas', 'Expensas del hotel'], ['abrir', 'hotel-ficha', 'Ficha del hotel']] },

  /* ---------- Para la Administración ---------- */
  { id:'admin', icon:'sliders', color:'accent', para:'admin', t:'Para la Administración', s:'Dos brazos, el día a día y el alcance con la garita', b:[
    ['h', 'Dos brazos'],
    ['p', 'Quien administra y además vive en el barrio elige al entrar si está como <b>vecino</b> o como <b>Administración</b>, y cambia con el botón del encabezado. En modo Administración solo se ve la gestión; en modo vecino, solo lo de vecino.'],
    ['h', 'El barrio ahora'],
    ['p', 'Arriba de la portada de la Administración, todo lo importante de un vistazo, en vivo:'],
    ['lista', [
      '<b>"El día en 10 segundos"</b>: la primera vez que abrís la portada en el día pasan solas cinco tarjetas de colores (la entrada, la ronda, los vecinos, las expensas y el hotel), con los números que cuentan. Tocá a los costados para adelantar o volver; con el botón <b>"El día en 10 segundos"</b> lo volvés a ver cuando quieras.',
      '<b>El semáforo del barrio</b>: cuatro luces que laten, <b>garita</b> (turno, conexión y SOS), <b>policía</b> (de servicio, en ronda o en horario sin ingreso), <b>hotel</b> (traslados por hacer) y <b>expensas</b> (pagos por acreditar y lotes al día). Verde está bien, ámbar pide mirar y rojo es urgente; cada luz te lleva a su lugar.',
      '<b>Los medidores</b>: tres relojes que se llenan solos, el porcentaje de <b>lotes al día</b>, la <b>meta de rondas</b> completas con QR de la última noche y la <b>ocupación del hotel</b>.',
      '<b>Los pendientes</b>: reclamos, peticiones a la garita e inscripciones en tres columnas, <b>Nuevo, En curso y Resuelto</b> (los resueltos de la última semana). Los reclamos se arrastran de columna desde la manijita (se abre la ventana de siempre para confirmar y contestarle al vecino); los demás se tocan y te llevan a su lugar.',
    ]],
    ['h', 'Día a día, por salas'],
    ['p', 'Las salas van en <b>mosaico</b>, cada una con su color: la que tiene algo pendiente se agranda y el número de lo que espera cuenta solo.'],
    ['lista', ['<b>Garita y seguridad</b>: la garita en vivo, la bitácora, los turnos, los mensajes con la garita, los ingresos frecuentes y la supervisión de la guardia.', '<b>Vecinos</b>: padrón, mensajes, reclamos, infracciones, votaciones y obras.', '<b>Comunicación</b>: comunicados importantes (con acuse), el pizarrón y los avisos urgentes por zona.', '<b>Proveedores y cumplimiento</b>: ART y seguros, protección de datos, y publicidad y aporte al barrio.', '<b>Hotel Los Cauquenes</b>, al final: el hotel en vivo, sus promociones, eventos y proveedores, los mensajes con el hotel y su cuenta.']],
    ['h', 'Mis reglas: "cuando pasa esto → hacé esto"'],
    ['p', 'En <b>Administración → Automatizaciones</b>, arriba, está <b>"Mis reglas"</b>: avisos que la app manda sola cuando pasa algo, armados eligiendo, sin programar.'],
    ['pasos', [
      'Tocá <b>"Armar una regla"</b> (o una de las ideas listas, que quedan armadas con un toque).',
      '<b>Cuándo:</b> nieve para mañana (desde cuántos cm), mañana hiela (desde qué mínima), ráfagas fuertes hoy, todas las semanas un día y hora, entra un reclamo de un tema, o una obra avisa trabajos para hoy.',
      '<b>A quién avisarle:</b> todos los vecinos, solo los vecinos de la misma calle (para las obras), la garita, la Administración y/o publicarlo en el pizarrón.',
      '<b>El mensaje:</b> viene escrito; cambialo como quieras. {fecha}, {valor}, {tema}, {lote}, {detalle} y {hora} se completan solos.',
    ]],
    ['lista', [
      'Cada regla actúa <b>una sola vez</b> por día (o una vez por reclamo u obra), aunque la app esté abierta en muchos teléfonos.',
      '<b>"Probar"</b> muestra el aviso tal como llegaría, sin mandar nada. Con el tilde la apagás sin borrarla.',
      'La app ya trae avisos de nieve, helada y viento ("Las que vienen con la app"): al armar una de esas, la app te lo recuerda para que no lleguen dos iguales.',
      'El aviso de un reclamo dice solo el tema, nunca quién lo hizo.',
    ]],
    ['h', 'Los reclamos como tablero'],
    ['p', 'En <b>Vecinos → Reclamos</b> los reclamos se ven como <b>tarjetas en cuatro columnas</b>: Reportado, Asignado, En curso y Resuelto (los resueltos de los últimos 30 días). Arriba, cuántos hay abiertos, cuántos están trabados, cuántos pasados de la fecha y cuánto se tarda en resolver. "Lista" vuelve a la vista de antes.'],
    ['pasos', [
      'Para avanzar un reclamo, <b>arrastrá la tarjeta</b> a otra columna (en el celular, desde la manija de puntitos de la tarjeta), o tocá el botón del paso siguiente.',
      'Se abre la hoja con el estado nuevo y <b>el mensaje para el vecino ya escrito</b>. Cambialo si querés, sumá responsable y fecha estimada, y tocá <b>"Guardar y avisar"</b>.',
      'Al vecino (y a los que dijeron "me pasa también") le llega el aviso.',
    ]],
    ['lista', [
      'Cada tarjeta dice hace cuánto no se mueve: verde, amarillo desde 2 días, rojo desde 5.',
      'A los <b>5 días sin movimiento</b> queda <b>"Trabado"</b>, sube arriba de su columna y te llega un aviso. Si se pasa la fecha estimada, queda <b>"Atrasado"</b> y también te avisa, para que le digas al vecino la fecha nueva.',
      'Cuando lo pasás a <b>Resuelto</b>, el vecino confirma: si toca "Sigue igual", vuelve solo a "En curso" y te llega el aviso.',
    ]],
    ['h', 'Editar o borrar visitas, frecuentes y proveedores'],
    ['lista', [
      '<b>Visitas</b>: en <b>Garita y seguridad → Visitas del barrio</b> están todas las que anunciaron los vecinos (hoy, próximas, personal fijo y la última semana), con un buscador. Cada una tiene <b>"Ver pase"</b>, <b>"Editar"</b> y <b>"Borrar"</b>; los mismos botones aparecen en la Garita en vivo. Al vecino le llega el aviso y queda en la auditoría. Si la visita ya pasó por la garita, el día y el horario no se cambian y su paso queda en el historial.',
      '<b>Ingresos frecuentes</b>: "Editar" (también para darlo de baja un tiempo o generarle un QR nuevo) y <b>"Borrar"</b>, que lo saca para siempre y su QR deja de servir.',
      '<b>Proveedores habilitados</b>: "Agregar un proveedor" arriba, y en cada tarjeta "Editar" y "Borrar".',
      '<b>Proveedores del hotel</b>: además de "Marcar revisado" y "Suspender", "Editar" y "Borrar". Al hotel le llega el aviso.',
    ]],
    ['h', 'La guía del barrio y el padrón de expensas'],
    ['p', 'Son dos listas distintas. El <b>padrón de expensas</b> (titular, DNI, correo, coeficiente y deuda) es para cobrar y lo ve <b>solo la Administración</b>. La <b>guía del barrio</b> dice quién vive en cada lote (propietarios o inquilinos), si es baldío o cabaña, y los teléfonos: la usa la garita en "Buscar un vecino".'],
    ['pasos', [
      'Entrá a <b>Vecinos → Padrón</b> y bajá hasta <b>"Guía del barrio"</b>.',
      'Tocá <b>"Cargar la guía del barrio"</b> y elegí el archivo <b>guia-del-barrio-….csv</b> de la carpeta <b>datos-privados</b> (en tu computadora).',
      'Se abre una ventana que dice cuántos lotes y teléfonos leyó y espera a la base del barrio: cuando dice <b>"Listo: la guía quedó guardada"</b>, la garita ya la ve. Si dice que la base no la aceptó, explica qué hacer (por ejemplo, publicar las reglas de Firebase).',
      'Para corregir un lote (por ejemplo, cuando cambian los dueños), en el mismo lugar tocá <b>"Corregir un lote de la guía"</b>, buscalo y tocá <b>"Editar"</b>. Para cambiar muchos, <b>"Descargar la guía (CSV)"</b>, corregila en Excel y volvé a subirla: reemplaza a la anterior.',
    ]],
    ['ojo', 'warn', 'Quién ve qué', 'Los nombres, el lote y la dirección los ven los vecinos, la garita y la supervisión. Los <b>teléfonos y la nota</b> de cada lote, solo la garita, la Administración y la supervisión. El hotel, solo la dirección. El archivo con teléfonos guardalo siempre en <b>datos-privados</b>: nunca va a GitHub.'],
    ['h', 'Dar de alta a un vecino o inquilino'],
    ['p', 'Para quien no sabe inscribirse (muchos dueños mayores, inquilinos nuevos): <b>Administración → Vecinos → "Dar de alta a un vecino o inquilino"</b>. Cargás nombre, DNI, lote, qué es del lote, correo y celular. La cuenta queda aprobada al instante con una <b>contraseña provisoria</b>, que se manda por correo y con el botón de WhatsApp. Si es un inquilino, el lote queda alquilado solo. La primera vez que la persona entra, acepta los términos y puede elegir su contraseña. En <b>Vecinos → ⋯</b> también podés marcar que un propietario <b>no vive en el lote</b>.'],
    ['h', 'Comunicados importantes: editar'],
    ['p', 'Cada comunicado tiene <b>"Editar"</b>, <b>"Volver a mostrarlo"</b> y <b>"Cerrar"</b>. Editar abre el mismo formulario con lo que tenía; las respuestas de "voy / no puedo" se conservan. Si el cambio es importante, dejá tildado <b>"Que les vuelva a aparecer a todos"</b>: sale otra vez como ventana con la marca <b>"corregido"</b>. Si es una coma, destildalo y se guarda sin molestar. Queda en la auditoría.'],
    ['h', 'Infracciones: las pruebas'],
    ['p', 'Al registrar una infracción hay dos botones: <b>"Sacar foto"</b> (la cámara) y <b>"Subir archivo"</b> (fotos, PDF, Word, Excel, audio o video corto, hasta 5 MB cada uno; se pueden elegir varios). Nada sube hasta tocar "Notificar a la casa". Después se pueden sumar más con <b>"Sumar pruebas"</b>.'],
    ['lista', [
      'Cada equipo ve una <b>vista previa liviana</b>; el archivo completo se baja solo si alguien lo toca, y queda en ese equipo.',
      'A los <b>90 días</b> el archivo se borra de la base del barrio, para no llenarla.',
      'En cada infracción, <b>"Historial"</b> deja la constancia: quién subió cada prueba, quién la bajó (por ejemplo "Lote 148 bajó la foto …") y cuándo se borró y si alguien la había consultado.',
    ]],
    ['h', 'Escribir a un lote o a vecinos'],
    ['p', 'Es <b>un solo botón</b>: en <b>Mensajes con vecinos → "Escribir a un lote o a vecinos"</b>. Lo que es para todo el barrio va por el pizarrón o un comunicado; el pizarrón ya no manda avisos a un lote. En el botón: elegís el lote y, adentro, <b>todo el lote</b> o solo a quién (en un lote de cuatro, a dos). A cada uno le llega en su conversación privada, con aviso al celular. La garita tiene el mismo botón.'],
    ['h', 'Inquilinos y propietarios'],
    ['p', 'En <b>Inscripciones</b> cada pedido dice qué es del lote (propietario, cotitular, inquilino, familiar). Al aprobar a un <b>inquilino</b>, el lote queda alquilado: el inquilino maneja el día a día y el propietario pasa a "propietario a distancia" (le llega el aviso). La relación la cambiás en <b>Vecinos → ⋯</b>; cada vecino la elige una sola vez. Al dar de baja al inquilino, el lote vuelve al propietario.'],
    ['h', 'El alcance con la garita'],
    ['ojo', 'info', 'La Administración mira la garita; no la opera', 'La Administración ve en tiempo real los ingresos, el camión, los correos, el policía, la bitácora, las peticiones y los SOS, pero no registra, no entrega, no firma ni escribe en el libro de guardia: eso es exclusivo de la cuenta de la garita. Así no se pisan datos ni responsabilidades.'],
    ['lista', ['<b>Sí es de la Administración</b>: los horarios de la guardia (pueden superponerse: 7–15, 8–20, 15–23 y 23–7), los puntos de control de la ronda (y sus QR), las zonas para avisos, los proveedores habilitados, los ingresos frecuentes y el control mensual de horas y rondas del policía.', '<b>Para pedirle algo a la garita</b>: "Mensajes con la garita" (canal interno). Le llega al instante, con sonido.']],
    ['h', 'El recorrido de la ronda del policía'],
    ['pasos', [
      'En <b>Turnos → Puntos de control de la ronda</b> tocá <b>"Marcar el recorrido en el plano"</b> (o, en el Mapa del barrio, <b>"Editar recorrido"</b> en la tira "Ronda del policía"). Se abre el mismo plano de la garita con un recuadro amarillo.',
      'Tocá en el plano dónde va el <b>punto 1</b>, después el 2, el 3… El número es el orden en que el policía los recorre. Cada punto toma solo el nombre del lote o la calle más cercana; podés escribirle otro en la lista.',
      'Para mover uno, tocá su número (o el punto en el plano) y después el lugar nuevo. Con <b>▲ ▼</b> cambiás el orden y con <b>✕</b> lo sacás. "Deshacer" vuelve atrás un paso.',
      'Con el <b>botón de la cámara</b> le agregás una <b>foto del lugar</b> (dónde está pegado el QR). La app arma dos: una <b>chica</b> (unos 10 a 20 KB) que es la que viaja por la app y al teléfono del policía, y una <b>grande</b> que se guarda aparte y solo la baja quien toca <b>"Bajar la foto en grande"</b>. Así no se gastan datos ni lugar.',
      'Tocá <b>"Finalizar"</b>: se guarda y ves la <b>simulación</b> del recorrido uniendo los puntos en orden por las calles, con la distancia y los minutos caminando. Desde ahí, <b>"Compartir el plano"</b> (imagen para WhatsApp) e <b>"Imprimir los QR"</b> si hay puntos nuevos. Los QR que ya estaban pegados siguen valiendo; los que sacás dejan de valer.',
      'Al final de Turnos, <b>"Policía contratada"</b> (solo la Administración): con las flechas elegís el mes; arriba cuatro números que suben contando (noches con policía, horas de servicio, rondas completas con QR y noches en que se cumplió la meta) y, por cada policía, sus noches, horas y rondas y un renglón de cuadraditos con cada noche del mes (verde: cumplió la meta; ámbar: menos completas; rojo: ninguna completa). Sirve para controlar lo que se le paga.',
      'Debajo de los puntos está la <b>meta de rondas completas por noche</b> (3 de fábrica: es lo que se espera, no un tope; solo cuentan las <b>completas con QR</b>) y <b>"Los vecinos ven la ronda"</b>: en vivo (de fábrica) o con 5, 10 o 15 minutos de demora. Hasta tocar "Finalizar" nada cambia para la garita; "Cancelar" deja todo como estaba.',
    ]],
    ['h', 'La supervisión de la guardia'],
    ['p', 'En <b>Garita y seguridad → Supervisión de la guardia</b>, en <b>Alertas e informe mensual</b>, fijás a los cuántos minutos se alerta (garita sin conexión, SOS sin respuesta, policía sin ronda), si el informe sale por correo el día 1 y si también te llega a vos. Ahí mismo está el <b>informe mensual</b> para leerlo o imprimirlo. El aviso de la garita sin conexión necesita el Codigo.gs versión 10 con el reloj instalado.'],
    ['p', 'En <b>Garita y seguridad → Supervisión de la guardia</b> habilitás a quien controla el servicio de la garita. Se inscribe como cualquiera y en "Tu lote" elige <b>"Supervisión de la guardia"</b>; su pedido aparece en Inscripciones y acá, y al aprobarlo queda como supervisión (se le borran el DNI y el lote). Puede haber más de una. Ve en vivo lo mismo que la garita y no puede cambiar nada; te escribe por su propio canal (con el número de mensajes en el renglón). No ve los mensajes de los vecinos, "Estoy bien", los huéspedes del hotel ni las expensas. Antes de habilitarla, que firme el compromiso de confidencialidad. "Quitarle el acceso" la deja sin ver nada.'],
    ['h', 'El Hotel Los Cauquenes'],
    ['p', 'La sala del hotel en el Día a día: el hotel en vivo (sin los nombres de sus huéspedes), sus promociones (las podés agregar, cambiar o borrar, igual que el hotel; cuando el hotel toca una, te llega el aviso), sus eventos (avisar a los vecinos si lo pide), sus proveedores (revisar o suspender), los mensajes con la recepción, la <b>Cuenta del hotel</b> (el hotel se inscribe como cualquier usuario y su inscripción pendiente se convierte en la del hotel; los vecinos aprobados no aparecen en esa lista; una vez hecha, el hotel cambia su correo y su contraseña en Tu cuenta) y el <b>modelo de convenio</b>. Si el hotel declara su DEA, desde Emergencias del hotel se publica para los vecinos.'],
    ['p', '<b>El hotel en vivo</b> es un tablero de lo que pasa ahora, sin repetir los botones de la sala: arriba el hotel con el punto <b>EN VIVO</b> y cuatro anillos (huéspedes, vans adentro, traslados hechos, proveedores al día), <b>"Para resolver"</b> solo si hay promociones, eventos o proveedores esperando, la van que sale después, la ruta del día, las vans, los pasos por la garita y los eventos de la semana. Mientras el hotel no cargó nada propio, se ve el <b>hotel de ejemplo</b> (con el cartel EJEMPLO; la garita no lo ve).'],
    ['h', 'Estoy bien'],
    ['p', 'La Administración y la garita reciben siempre el aviso cuando un vecino anotado no toca "Estoy bien" a su hora (o no vuelve de una salida), y ven la lista en <b>Gestión → Estoy bien</b> con los teléfonos de su familia. El resto del barrio no. Para que las alarmas salgan aunque todos los teléfonos estén bloqueados, el Apps Script tiene un reloj que revisa cada 10 minutos (una vez: ejecutar <b>instalarRelojCuidados</b>; ver AVISOS.md).'],
    ['h', 'Protección de datos'],
    ['p', 'En <b>Proveedores y cumplimiento → Protección de datos</b> están las tareas del barrio como responsable de la base: la inscripción en la AAIP (con las respuestas ya redactadas), quién atiende los pedidos de los vecinos sobre sus datos, el compromiso de confidencialidad y el registro de incidentes.'],
    ['p', 'En la misma sala, <b>Publicidad y aporte al barrio</b>: lo que dicen los términos (punto 4) sobre la publicidad de comercios en la app y la donación del 50 % a la Asociación Civil, el <b>compromiso de donación</b> para imprimir y firmar, y el registro de lo recibido. Ahí anotás si el compromiso está firmado (fecha, acta y si se elevó a escritura) y cada entrega semestral con su destino: los vecinos ven el total y en qué se usó, sin los nombres de los comercios.'],
    ['ojo', 'warn', 'Borrar lo que quedó del chat y de las reservas', 'El chat vecinal y las reservas se sacaron de la app el 29-09-2026. Lo que quedó guardado en la base ya no se usa y la ley pide borrarlo. Es un solo botón en Protección de datos: se borra para siempre y queda en la auditoría.'],
    ['h', 'Expensas y contabilidad'],
    ['p', 'Las facturas del mes se cargan en <b>Contabilidad</b>; al cerrar el mes se arman los cupones. En <b>Expensas</b> se ven los lotes, se confirman los pagos informados, se emiten recibos y se sigue la morosidad.'],
    ['pasos', [
      '<b>Una sola vez:</b> Contabilidad → <b>Parámetros</b> (vencimientos, recargo del 2º, cómo se ajusta la deuda —inflación, inflación + interés o interés fijo—, Fondo de Infraestructura, alias y CBU) y los correos de cada lote en Vecinos → Padrón.',
      '<b>Durante el mes (egresos):</b> Contabilidad → <b>Gastos del mes</b>. Los que se repiten aparecen solos con el importe actualizado (lápiz, tilde o cruz); las facturas nuevas, con "Cargar un gasto nuevo" y su foto. Un gasto de un lote en particular va solo a ese lote.',
      '<b>Durante el mes (ingresos):</b> Expensas → <b>Pagos</b>: confirmá los "por acreditar" contra el banco o "Registrar un pago a mano". Lo que no es expensa (calcomanías, SUM), en Contabilidad → Libro contable → "Cargar otro ingreso".',
      '<b>El día 1:</b> te llega el aviso con <b>"Ir al cierre"</b>. En Contabilidad → <b>Cierre de mes</b> mirá "Ver las 152 cuotas" y tocá <b>"Emitir la liquidación y los cupones"</b>. La app reparte por coeficiente, suma el fondo, lo particular y las multas, ajusta lo impago con la tasa elegida y lo suma al mes; cada lote recibe su cupón en la app y por correo.',
      '<b>Después:</b> los recordatorios y el aviso de mora salen solos; para reenviar un cupón (a todos, solo a vos o a un lote, también por WhatsApp), Cierre de mes → "Reenviar los cupones por correo". Al contador, Contabilidad → <b>Carpeta del contador</b>.',
    ]],
    ['ojo', 'info', 'Practicalo sin miedo', 'En Contabilidad → Resumen, <b>"Practicar el mes paso a paso"</b> abre una práctica guiada con la app en modo prueba: te dice qué tocar, te lleva al botón y se da cuenta sola cuando lo hiciste, desde cero hasta el cupón de cada propietario y el mes siguiente con la deuda ajustada. No toca la base del barrio ni manda correos reales.'],
    ['p', 'En <b>Pagos</b>, la lista de <b>pagos confirmados</b> muestra solo los del <b>mes en curso</b>. Para otro período, <b>"Ver pagos de otras fechas"</b>: elegís desde y hasta (y un lote, si querés) y se traen de la base en ese momento, con el total y la planilla.'],
    ['p', '<b>Morosos</b>: además de reclamar y emitir el certificado de deuda, ahí está el interruptor <b>"Los vecinos ven la lista de morosos"</b>. Prendido, en Mis expensas cada vecino ve los lotes que deben, por lote y sin nombres (deuda por mes, total, gestión judicial y proyección a 3, 6 y 12 meses con el último IPC del INDEC). La app la arma sola con la última liquidación y los pagos confirmados. Conviene que la asamblea o el reglamento lo prevean.'],
    ['h', 'Cortes de luz, agua y gas'],
    ['p', 'En <b>Ajustes → Cortes de luz, agua y gas</b> está la lista de <b>zonas que cuentan</b> (de entrada "Cauquén, Los Cauquenes, Alimentador 11": la DPE nombra al barrio como "Urbanización Cauquén" o "Alto del Cauquén", siempre bajo el Alimentador 11, junto con Terraza I y II, Ushuaia Chico y Costa Susana) y la casilla para apagarlo. <b>"Buscar ahora"</b> hace lo mismo que el Apps Script a las 6 y a las 23 y te muestra qué encontró y qué dejó afuera, con el motivo. Necesita el Apps Script versión 12 con la cuenta de servicio (la misma de los avisos al celular). Facebook no se puede leer desde un programa: los comunicados de la DPE se toman de los diarios que los publican.'],
    ['p', '<b>Pizarrón</b>: las publicaciones se borran solas a su tiempo (alertas 2 días, guardia al terminar el día (a las 0 h; la garita puede elegir hasta 3 días), avisos 7 y los tuyos 15, vendo o regalo 15, perdidos, ofrezco y busco 30, eventos al día siguiente); lo que fijás arriba queda hasta que lo desfijás. Lo hace la regla automática "Pizarrón → cada publicación se borra sola a su tiempo". Los mensajes privados se borran solos a los 90 días.'],
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
    ['p', '<b>Probar Mercado Pago</b>: en tu vista de vecino, en Expensas, la tarjeta celeste <b>"Probar Mercado Pago"</b>, con el logo y la etiqueta PRUEBA (solo la ve quien administra), cobra el importe de tu último cupón aunque estés al día. Se paga con una tarjeta de prueba (titular APRO) y queda en <b>Pagos de PRUEBA</b>: no cambia tu saldo ni saca recibo, y se borra con un toque en Expensas → Pagos.'],
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
/* EL EMBLEMA DEL MANUAL (pedido de Claudio, 10-10-2026: "es solo una
   mancha violeta, mejoralo"): un libro abierto con los pasos tildados en
   la hoja de la derecha y un sello de "listo", sobre un degradé violeta.
   Dibujado acá (sin imágenes que bajar), se ve igual de día y de noche. */
const EMBLEMA_MANUAL = `<svg viewBox="0 0 56 56" aria-hidden="true">
  <defs><linearGradient id="emManG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#9b6ef0"/><stop offset="1" stop-color="#5a2fa8"/></linearGradient></defs>
  <rect width="56" height="56" rx="17" fill="url(#emManG)"/>
  <path d="M8 17.5c6.2-2.6 12-2.2 18 1.4v22.6c-6-3.4-11.8-3.8-18-1.4z" fill="#fff"/>
  <path d="M30 18.9c6-3.6 11.8-4 18-1.4v22.6c-6.2-2.4-12-2-18 1.4z" fill="#f1eafd"/>
  <path d="M28 19.4v22.4" stroke="#5a2fa8" stroke-opacity=".35" stroke-width="1.4"/>
  <g fill="none" stroke="#b9a4e6" stroke-width="2" stroke-linecap="round"><path d="M12 23.4c3.6-1 7-.8 10 .7"/><path d="M12 28.4c3.6-1 7-.8 10 .7"/><path d="M12 33.4c3.6-1 7-.8 10 .7"/></g>
  <g stroke-linecap="round" stroke-linejoin="round"><circle cx="35.4" cy="24.2" r="2.3" fill="#7445c0"/><path d="M39.6 23.6h4.6" stroke="#b9a4e6" stroke-width="2"/>
    <circle cx="35.4" cy="30.2" r="2.3" fill="#7445c0"/><path d="M39.6 29.6h4.6" stroke="#b9a4e6" stroke-width="2"/>
    <circle cx="35.4" cy="36.2" r="2.3" fill="none" stroke="#7445c0" stroke-width="1.6"/><path d="M39.6 35.6h4.6" stroke="#b9a4e6" stroke-width="2"/></g>
  <circle cx="44" cy="43" r="7.5" fill="#ffb020" stroke="#fff" stroke-width="2"/><path d="M40.6 43.1l2.3 2.3 4.4-4.6" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;
R.manual = {
  titulo:'Manual de uso', icon:'book', color:'accent', sub:'Manual y normas · paso a paso, para todos',
  render(q){
    const todos = manualCaps(), qq = normTxt(q || '').trim();
    const pal = qq.split(/\s+/).filter(w => w.length > 2);
    const lista = pal.length ? todos.filter(c => { const p = manualPlano(c); return pal.every(w => p.includes(w)); }) : todos;
    const ir = c => (c.ir || []).filter(([a, v]) => a !== 'abrir' || typeof ventanaPermitida !== 'function' || ventanaPermitida(v))
      .map(([a, v, t]) => `<button class="btn btn-sm btn-sec" data-a="${a}" data-v="${esc(v)}">${esc(t)}${I('right')}</button>`).join('');
    return `${guiaSolapas('manual')}<div class="man-intro"><span class="man-intro-ic">${EMBLEMA_MANUAL}</span><div><b>Cómo usar la app, paso a paso</b>
        <span>${plural(todos.length, 'capítulo')}. Tocá uno para abrirlo; tocalo de nuevo para cerrarlo. Arriba podés buscar cualquier palabra.</span></div></div>
      ${typeof Recorrido !== 'undefined' && Recorrido.perfilActual() ? `<button class="superficie" data-a="recorrido" style="margin:0 0 10px"><span class="ic ic-sky">${I('target')}</span><span class="txt"><b>Ver el recorrido de bienvenida</b><small>La app te muestra, botón por botón, lo más importante de tu pantalla</small></span>${I('right')}</button>` : ''}
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
/* EL MANUAL DE USO INTERACTIVO (pedido de Claudio, 21-10-2026: "como el de la
   app de quirófanos, debajo del nombre del barrio y del vecino, que se abra
   aparte y tenga un botón para regresar"). Se abre en otra pestaña, siempre
   la misma ('bhc-manual'): la app queda como estaba. Sin 'noopener' a
   propósito (con esa opción el navegador devuelve null aunque la abra). Si
   el navegador no deja abrir pestañas, se abre en esta misma ventana y el
   botón "Regresar a la app" vuelve acá. Abre con el perfil de quien lo pide. */
A['manual-interactivo'] = () => {
  /* (21-10-2026, pedido de Claudio) Cada perfil ve lo suyo y lo que comparte con otros; la Administración, todo (aunque esté en modo vecino). */
  const u = yo(), perfil = !u ? 'vecino' : u.rol === 'guardia' ? 'garita' : u.rol === 'hotel' ? 'hotel' : u.rol === 'supervisor' ? 'supervision' : u.rol === 'admin' ? 'admin' : 'vecino';
  const url = `manual-interactivo.html?v=${encodeURIComponent(window.VERSION || '')}&perfil=${perfil}`;
  const w = window.open(url, 'bhc-manual');
  if (w){ try { w.focus(); } catch(e){} return; }
  location.href = url;
};
