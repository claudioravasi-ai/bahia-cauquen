# Subir la versión nueva y probarla — paso a paso (actualizado el 27-09-2026)

Orden: **1. Preparar en la Mac → 2. Firebase (reglas) → 3. Apps Script → 4. GitHub → 5. Encender en la app → 6. Probar.**
Las reglas van primero: la app nueva las necesita, y la vieja sigue andando con ellas.

---

## 1. Preparar en la Mac (1 minuto)

1. En la carpeta **Barrio Bahia Cauquen**, doble clic en **`3 - Preparar carpeta para GitHub.command`**.
2. Revisa que no haya errores, sella la versión y arma en el Escritorio la carpeta **`SUBIR A GITHUB`**.
   Si dice "HAY UN PROBLEMA", no subas nada y pasame lo que dice.

**Lo que queda adentro (y es lo único que va a GitHub):**

| Archivos sueltos | Carpetas |
|---|---|
| `index.html`, `sw.js`, `pago.html`, `limpiar.html`, **`probar.html`** (la página de simulaciones para los vecinos, 27-09), `manifest.webmanifest`, `reglas-firebase.txt`, `revisar.py`, `version.py`, los `.md` (guías) | `js/` (incluye los nuevos **`v-cuidados.js`** y **`v-casa.js`**, del 27-09), `css/`, `img/`, `icons/`, `apps-script/` |

**Lo que NO se sube nunca:** `datos-privados/` (padrón y liquidación con nombres), `Logo barrio.png`, `Incial DeepSeek/`, `Guia para vecinos/`, y el archivo `.json` de la cuenta de servicio de Firebase (es una llave).

---

## 2. Firebase: publicar las reglas (3 minutos)

1. Abrí **`reglas-firebase.txt`** (en la carpeta del barrio) con TextEdit.
2. Seleccioná desde la **primera llave `{`** que está debajo de la línea `PEGAR DESDE ACÁ` hasta la **última llave `}`** antes de la línea `HASTA ACÁ`. Copiá (Cmd+C).
3. [console.firebase.google.com](https://console.firebase.google.com) → proyecto **bahia-cauquen** → **Realtime Database** → pestaña **Reglas**.
4. Clic dentro del editor → Cmd+A → Borrar → Cmd+V → **Publicar**.
5. Si marca un error en rojo, no publiques y pasame la línea que marca.

Esto deja andando, además de lo pendiente de antes: **"Estoy bien" y el aviso de salida** (`cuidado/`), **cosas para prestar**, **ángeles de la nieve**, **tu casa en invierno y la mochila para sismos** y la **casa sola revisada cada día** (27-09), el **hotel** (zona `hotel/`), los **paquetes por lote**, la **garita sin el chat vecinal**, los comprobantes de pago, el archivo histórico y las marcas del motor.

---

## 3. Apps Script: el código nuevo y sus propiedades (10 minutos)

Es el "servidor" del barrio: manda los correos, los avisos push, lee los cruceros y cobra con Mercado Pago.

1. [script.google.com](https://script.google.com) con la cuenta con la que lo creaste (la de la garita) → abrí el proyecto del correo.
2. Abrí **`apps-script/Codigo.gs`** de la carpeta del barrio con TextEdit → Cmd+A → Cmd+C.
3. En el editor del Apps Script: clic en `Código.gs` → Cmd+A → Cmd+V → **Guardar** (el disquete).
   La frase compartida no se pierde: quedó guardada en las propiedades.
4. Engranaje **Configuración del proyecto** → **Propiedades del script** → revisá que estén (si falta alguna, **Agregar propiedad**):

   | Propiedad | Valor | Para qué |
   |---|---|---|
   | `CLAVE_COMPARTIDA` | tu frase (ya debería estar) | que solo la app pueda usarlo |
   | `FCM_CUENTA` | **todo** el contenido del `.json` de la cuenta de servicio (ver abajo) | los avisos al celular |
   | `MP_ACCESS_TOKEN` | el Access Token de la cuenta de prueba Vendedor (ver la parte 7) | Mercado Pago |

   **Cómo se saca el `.json`:** Firebase → engranaje → **Configuración del proyecto** → **Cuentas de servicio** → **Generar nueva clave privada**. Se baja un archivo: abrilo con TextEdit, Cmd+A, Cmd+C y pegalo como valor de `FCM_CUENTA`. Después guardalo en un lugar seguro (no en la carpeta de GitHub).
5. **Implementar → Gestionar implementaciones** → lápiz (editar) → **Versión: Nueva versión** → **Implementar**. La dirección `/exec` no cambia.
6. Si Google pide permisos ("conectarse a un servicio externo"), aceptalos.
7. **Una sola vez (versión 8, 27-09): el reloj de "Estoy bien".** En el menú de funciones de arriba elegí **`instalarRelojCuidados`** → **Ejecutar** → aceptá los permisos. Queda revisando cada 10 minutos, aunque todos los teléfonos estén bloqueados (detalle en AVISOS.md).

---

## 4. GitHub: subir la app (5 minutos)

1. Entrá al repositorio de la app del barrio en github.com (el que publica en GitHub Pages).
2. **Add file → Upload files**.
3. Abrí la carpeta **`SUBIR A GITHUB`** del Escritorio → **Cmd+A** (todo lo de adentro, no la carpeta) → arrastralo a la página de GitHub.
4. Esperá a que termine de cargar la lista. Abajo, en el mensaje: *Garita al día, policía con constancia, vans, Uber/DiDi, Estoy bien y más (27-09)* → **Commit changes**.
5. Esperá 1 o 2 minutos (GitHub Pages publica solo). Comprobalo: abrí la app, y en la pantalla de ingreso, abajo, tiene que decir **versión 20260927-…** (la del día).
6. La página de simulaciones queda en **`<dirección de la app>/probar.html`**: ese es el enlace para mandarles a los vecinos (se abre en cualquier navegador, no toca la app ni la base).
7. Si en un equipo sigue la vieja: **Tu cuenta → Actualizar la app**.

---

## 5. Encender lo nuevo en la app (como Administración, 5 minutos)

1. Entrá con tu cuenta y elegí **Administración**. Esperá unos segundos: la app hace sola la mudanza de carpetas y reparte pagos y paquetes.
2. **Ajustes → Correo → "Probar el envío"**: tiene que decir que salió.
3. **Ajustes → Avisos al celular**: pegá la **clave pública** (la que empieza con `B…`, de Firebase → Configuración → Cloud Messaging → Certificados push web) si todavía no está → Guardar → **"Ver si el Apps Script está listo"**.
4. **Contabilidad → Parámetros**: tildá **"Cobro online con acreditación automática (Mercado Pago)"** y elegí el método para el pago fuera de término → Guardar.
5. **La cuenta del hotel (para probarla):**
   - En otro navegador (o una ventana de incógnito), abrí la app → **"Todavía no tengo cuenta"** → inscribite con un correo de prueba. Truco: `barriobahiacauquen+hotel@gmail.com` (Gmail lo entrega en la misma casilla).
   - Volvé a tu Administración → **Día a día → sala "Hotel Los Cauquenes" → "Cuenta del hotel"** → buscá esa cuenta → **"Hacerla del hotel"**.
   - Entrá con esa cuenta: ya es la del hotel. Cuando el hotel la use de verdad, cambia el correo y la contraseña en **Tu cuenta**.

---

## 6. Cómo probar cada cosa nueva

Conviene tener abiertos: **tu cuenta** (vecino y Administración), **la garita** (otro equipo) y, para lo de lote, **la de Mónica**. Para los avisos al celular, en cada equipo: **Tu cuenta (tu inicial, arriba a la derecha) → Avisos en este equipo → Activar avisos** (en iPhone, con la app instalada en la pantalla de inicio).

### Saludo y asistente por voz
1. Tocá el **escudo** de arriba a la izquierda → tiene que decir "Hola, Claudio, que tengas una buena tarde… son las 19 y 40, y hace 4 grados".
   En iPhone, con el botón de silencio apagado y volumen alto. Para una voz más humana: **Ajustes → Accesibilidad → Contenido leído → Voces → Español → Mónica (mejorada)**.
2. La primera vez, al terminar el saludo aparece **"Asistente por voz"** → **Sí, activarlo** → permitir el micrófono.
3. Probá: **"avisale a la garita que llego tarde"** → te lo repite → decí **"sí"** → en la garita aparece el mensaje.
4. **"publicá en el pizarrón que hay zorros sueltos"** → "sí" → aparece en el pizarrón.
5. **"¿cuánto debo de expensas?"**, **"¿cuándo pasa el camión?"**, **"¿tengo paquetes?"**, **"abrí mis visitas"**.
6. **"pedí una ambulancia"** → NO manda nada: te dice cómo usar el SOS y abre Emergencias.
   Anda en Chrome (Android, compu) y en Safari (iPhone). Si en el iPhone instalado no abre el micrófono, probalo desde Safari y contame.

### Paquetes por lote
1. **Garita → Llegó un paquete** → para **Mónica**, con foto.
2. Te tiene que llegar a vos también (push, campanita y "Para vos · paquete" en la Pizarra del día).
3. **Mis paquetes**: la foto se ve chica; tocala → se ve grande y se puede guardar.
4. Mónica (o vos) retira con **Mi QR para retirar** → la garita lo lee → al otro le llega "Ya retiraron el paquete".
5. Si un paquete queda **más de 24 h**, llega un push cada 8 horas (de 9 a 21) hasta que alguien del lote abre "Mis paquetes".

### La garita opera, la Administración mira
1. En Administración → **Garita en vivo**: se ve todo, pero sin botones de validar, entregar, camión ni policía; arriba dice "solo para mirar" con "Escribirle a la garita".
2. **Bitácora** en Administración: se lee, no se escribe.
3. Una **petición** pendiente: la Administración la ve pero no la firma.
4. En la **garita** ya no está el **chat vecinal**.

### Pase vencido
1. Como vecino, **Autorizar una visita** para hoy con un horario que terminó hace más de una hora (por ejemplo, si son las 11, de 8:00 a 9:00).
2. En la garita, en esa visita: **"Ingresó" gris** y botón **"Pase vencido"**.
3. **"Está en la garita: preguntarle al vecino"** → al vecino le salta "Que pase / No lo conozco". **"No vino: solo avisarle"** → le llega que venció.

### Normas, manual, logo y pie
- **El barrio → Manual y normas** (una sola teja, con dos solapas arriba):
  - solapa **Normas y reglamentos** → abrí una → al final: **"Descargar o imprimir"**. En **Descargas** ya no están las normas.
  - solapa **Manual de uso** → capítulos que se abren y cierran, buscador, y al final **"Descargar o imprimir"**.
- **Emergencias** ya no tiene la Agenda al pie. El pie dice solo **"by Claudio A. Ravasi"** (abre los términos). El escudo se ve más grande.

### Hotel Los Cauquenes (con la cuenta del hotel de prueba)
1. Entra a **su portada**: vans, traslados, huéspedes y "Hoy en Ushuaia" (vuelos, cruceros y eventos). Probá que **no** pueda abrir nada de vecinos.
2. **Vans y traslados → + Van** (patente de prueba) → **QR para la garita → Imprimir**.
3. En la **garita**, **Escanear QR** sobre ese QR (o escribir la patente) → "Registrar la salida". En el hotel la van aparece **"Afuera"**.
4. **Huéspedes → Cargar** uno para hoy con **vuelo de llegada** de hoy (mirá uno real en Vuelos) → en **Traslados** aparece solo "Buscar en aeropuerto · vuelo …".
5. En la portada del hotel, en un vuelo de la lista → **"Van 14:10"** → guardar el traslado. Cuando esa van salga por la garita, el traslado pasa a **"En viaje"**.
6. **Eventos → Anunciar** con "avisar a los vecinos" → a la garita le suena; en tu Administración: **Eventos del hotel → Publicar para los vecinos** → aparece en el pizarrón.
7. **Promociones → Nueva promoción** → sale enseguida en la tira del hotel de los vecinos y a tu Administración le llega el aviso. En Administración: **Promociones del hotel → Editar** (cambiale el descuento) y después **Borrar** → al hotel le llega cada aviso y la tira se actualiza en todas las apps. **Comunicación interna** → elegí Garita, escribí algo, cambiá a Administración con el botón de arriba: son dos conversaciones separadas.
8. **Proveedores → Cargar** con ART vencida → en la garita su QR dice **NO HABILITADO**.
9. **Ficha del hotel** → tildá "tiene DEA" → en Administración: **Emergencias del hotel → Publicar el DEA para los vecinos** → en Emergencias de los vecinos aparece "Otro DEA en el barrio".
10. Botón rojo **"Garita"** (arriba a la derecha del hotel) → "Avisar a la garita ya" → a la garita le suena.
11. En Administración → **Huéspedes**: solo la cantidad, sin nombres.

### Garita (27-09)
- Entrá con la cuenta de la garita: arriba **no** tiene SOS, y en Tu cuenta no aparece "Cambiar mi correo" (sí la contraseña).
- A la derecha de "Garita" (en el celular, debajo) está **"Hoy la garita no puede olvidar"**: se tilda sola (probá entregar un paquete y mirá cómo se tacha).
- **Policía contratada**: Registrar ingreso → día, turno, hora, nombre y **correo** (poné uno tuyo para ver la constancia). Anotá una ronda a mano y registrá la **Salida**: desaparece de la portada, queda en **Turnos → Servicios del policía** y te llega el correo "Constancia de servicio".
- **Turnos**: arriba, quién hace cada turno con sus nombres; los puntos QR plegados; "Ver servicios anteriores".
- **Vans del hotel · hoy**: con un traslado programado por el hotel, tocá "Salió" y después "Volvió".
- **Uber/DiDi**: como vecino, Tu casa → Autorizar una visita → "¿Quién viene?": **Uber, DiDi o taxi** (se abre el aviso corto) con una patente; en la garita escribí la patente en el validador.
- "Cerrar el turno" está solo en su teja; Emergencias de la garita ya no muestra su propio teléfono.

### Asistente por voz en el iPad
- Tocá el escudo: te saluda y aparece el panel "Tocá el micrófono y decime qué necesitás" (en iPad ya no abre el micrófono solo).
- Tocá el micrófono y decí "¿tengo paquetes?". Si no te escucha, a los pocos segundos se corta solo; tocar cualquier otra parte de la app también lo corta. La app nunca debería quedar trabada: si pasa, anotá qué dijiste y en qué pantalla estabas.
- Probalo en Safari y también con la app instalada en la pantalla de inicio.

### Ingreso en Android
- Si Chrome completa solo el correo y la contraseña, la app avisa "tocá Entrar" y no entra sola. Al tocar Entrar aparece "Entrando…" al instante.

### Privacidad
- **Preguntas frecuentes → Tus datos → "¿Y el Hotel Los Cauquenes? ¿Ve mis datos?"**. Los términos dicen **versión del 26 de septiembre de 2026**.

---

## 7. Mercado Pago en modo prueba (el detalle completo está en `PAGOS.md`)

1. [mercadopago.com.ar/developers](https://www.mercadopago.com.ar/developers) → **Tus integraciones → Crear aplicación** → *Expensas Barrio Bahía Cauquén* → Pagos online → no es e-commerce → **Checkout Pro**.
2. En la aplicación → **Cuentas de prueba** → crear una **Vendedor** y una **Comprador** (Argentina). Anotá usuario y contraseña.
3. Entrá a Developers **con la cuenta de prueba Vendedor**, creá la misma aplicación y copiá su **Access Token** (empieza con `APP_USR-`).
4. Pegalo en el Apps Script como **`MP_ACCESS_TOKEN`** (parte 3) → **Nueva versión**.
5. En la app (modo vecino, tu Lote 148): **Mis expensas → Pagar las expensas → Pagar online ahora**. Se abre Mercado Pago: entrá con la cuenta de prueba **Comprador**.
6. Tarjeta de prueba (vencimiento 11/30, DNI 12345678). **El nombre del titular decide el resultado:**

   | Tarjeta | Número | Código |
   |---|---|---|
   | Mastercard crédito | 5031 7557 3453 0604 | 123 |
   | Visa crédito | 4509 9535 6623 3704 | 123 |
   | Visa débito | 4002 7686 9439 5619 | 123 |

   Titular **APRO** = aprobado · **OTHE** = rechazado · **CONT** = pendiente.
7. Con **APRO**: la ventana de Mercado Pago se cierra sola a los 3 segundos y en la app aparece "¡Pago aprobado!" con el saldo descontado. En Administración → **Expensas → Pagos**: figura como "Pagos de PRUEBA" (no descuenta de verdad ni saca recibo; se borran con un toque).
8. Probá también **OTHE** (tiene que decir que no salió) y **CONT** (queda pendiente).
9. **"Ya pagué por fuera de la app"** con una captura → en Administración: **Por acreditar → Ver comprobante → Confirmar** → te llega el recibo.
10. Para cobrar de verdad hace falta la cuenta de Mercado Pago **a nombre del barrio** y su token de producción (parte 8 de `PAGOS.md`).

---

## 8. Si algo no anda

- **La app parece vieja o una ventana no abre:** Tu cuenta → **Actualizar la app**. Si ni abre: `…/limpiar.html` → "Limpiar ahora".
- **"Permiso denegado" o no se guarda algo:** faltó publicar las reglas (parte 2) o se pegaron incompletas.
- **No llegan los push:** falta `FCM_CUENTA` o la clave pública, o el equipo no tocó "Activar avisos" (en iPhone, desde la app instalada).
- **Cruceros vacío o correo "no autorizado":** el Apps Script no tiene el código nuevo o faltó "Nueva versión".
- Cualquier otra cosa: sacá una captura y pasámela.
