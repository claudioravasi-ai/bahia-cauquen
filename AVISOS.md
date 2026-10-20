# Avisos al celular con la pantalla apagada — paso a paso

Con la app abierta, los avisos suenan solos. Con el celular **bloqueado** el navegador
no corre nada: lo único que lo despierta es una **notificación push**, que manda Google
(Firebase Cloud Messaging). Sirve para:

- el **camión de la basura** (cuando la garita registra la entrada),
- el **SOS** de un vecino, y el aviso del **DEA** a los vecinos del equipo de salud,
- **"Estoy bien"**: el recordatorio de la mañana y el aviso a la garita, la Administración y las personas elegidas,
- **casa sola**: "Tu casa está en orden" cuando la garita o el policía la revisa, y el recordatorio de los domingos de la **mochila para sismos**,
- los **avisos urgentes por zona** (corte de luz, nieve, portón…),
- los **paquetes** que llegan a la garita,
- todo lo que ya sonaba en la app (lo que escribe la guardia, comunicados, expensas).

Son **dos pasos de una sola vez**, más uno que hace cada vecino en su equipo.

## Paso 1 — La clave pública (va en la app)

1. Entrá a [console.firebase.google.com](https://console.firebase.google.com) → proyecto **bahia-cauquen**.
2. Engranaje → **Configuración del proyecto** → pestaña **Cloud Messaging**.
3. Abajo, **Configuración web → Certificados push web → Generar par de claves**.
4. Copiá la **clave pública** (un texto largo que empieza con `B…`).
5. En la app: **Administración → Ajustes → Avisos al celular** → pegala → **Guardar ajustes**.

## Paso 2 — La cuenta de servicio (va en el Apps Script, nunca en la app)

1. En la misma Configuración del proyecto → pestaña **Cuentas de servicio** →
   **Generar nueva clave privada**. Se baja un archivo `.json`. **Es una llave: no la mandes por mail ni la subas a GitHub.**
2. Abrí el Apps Script del correo (el mismo de siempre) → engranaje **Configuración del proyecto** →
   **Propiedades del script → Agregar propiedad**:
   - Propiedad: `FCM_CUENTA`
   - Valor: **todo** el contenido del archivo `.json` (abrilo con TextEdit, Cmd+A, Cmd+C).
3. Pegá el `apps-script/Codigo.gs` nuevo (si todavía no lo hiciste) y
   **Implementar → Gestionar implementaciones → editar → Nueva versión → Implementar**.
4. La primera vez, Google pide permiso para "conectarse a un servicio externo": aceptalo.
5. En la app: **Ajustes → Avisos al celular → Ver si el Apps Script está listo**.

La misma cuenta de servicio le permite al Apps Script leer la lista de equipos anotados
(`barrio/pushTokens`), que ninguna persona puede leer desde la app.

## Paso 2 bis — El reloj de "Estoy bien" (una sola vez, 27-09-2026)

"Estoy bien" (para quien vive solo) y el aviso de salida tienen que avisar a los contactos
**aunque todos los teléfonos estén bloqueados**. Lo hace un reloj del Apps Script que
revisa cada 10 minutos.

1. Pegá el `apps-script/Codigo.gs` nuevo (**versión 12**, del 11-10-2026: además de lo de la versión 11, busca los cortes de luz, agua y gas a las 6 y a las 23, y borra las fotos y archivos de los mensajes que ya vencieron) → **Guardar** →
   **Implementar → Gestionar implementaciones → editar → Nueva versión → Implementar**.
2. Arriba, en el menú de funciones, elegí **`instalarRelojCuidados`** y tocá **Ejecutar**.
   Google pide permiso ("activadores" y "servicio externo"): aceptalo.
3. Listo: en **Activadores** (el relojito de la izquierda) aparece `revisarCuidados` cada 10 minutos.

Usa la misma `FCM_CUENTA` del paso 2 y la dirección de la base (`BASE_URL`), que se guarda
sola la primera vez que la app manda un aviso push (por ejemplo, **Ajustes → Avisos al celular → Probar**).
Sin el reloj, "Estoy bien" igual avisa, pero recién cuando alguna app de un contacto o de la
garita está abierta; la garita, que está abierta las 24 horas, lo cubre si el vecino la eligió.

## Cortes de luz, agua y gas y fotos de los mensajes (11-10-2026, versión 12)

Con el mismo reloj de cada 10 minutos (no hay que instalar nada más):

- **A las 6 y a las 23** lee los cortes de agua de la DPOSS (dposs.gob.ar/reparaciones) y los
  comunicados de la DPE (luz) y de Camuzzi (gas) que publican NotiTDF, Radio Fueguina y Tiempo
  Fueguino. Publica en el pizarrón **solo** los que nombran al barrio (o una zona anotada en
  **Ajustes → Cortes de luz, agua y gas**) o son para toda la ciudad. Facebook no se puede leer.
- **Cada 10 minutos** borra de la base las fotos y archivos de los mensajes que ya vencieron
  (una hora después de que los bajó quien los recibió, o a los 3 días).

Para probarlo sin esperar: en la app, **Ajustes → Cortes de luz, agua y gas → Buscar ahora**.
Las fotos de los mensajes necesitan las **reglas de Firebase** nuevas (`adjuntos` y `adjuntosIdx`).

## La supervisión de la guardia (07-10-2026)

A la cuenta de supervisión le llegan al celular solo los **SOS**, los **pedidos del DEA**, los
**mensajes que le escriben** la garita o la Administración y sus **alertas**: la garita sin
conexión más de 20 minutos (la vigila el reloj del Apps Script, cada 10 minutos), un SOS o el DEA
sin "Voy en camino" a los 3 minutos (también a la Administración) y el policía sin ronda más de 90
minutos (también a la garita). Los minutos se cambian en Gestión → Supervisión de la guardia.
El día 1 de cada mes le llega además por correo el **informe mensual del servicio**. Los avisos de todo el barrio (el
camión, la pizarra) no: eso lo filtra el `Codigo.gs` **versión 10**. Con una versión anterior
pegada, le llegarían también esos.

## Los correos y la sesión cerrada (07-10-2026, versión 11)

Cuando la garita anota a qué lotes va un correo (Andreani, OCA, Mercado Libre…), a las cuentas de
esos lotes les llega **"va a tu casa"** al celular, como un WhatsApp: con la pantalla apagada y la
app cerrada. Además, al **cerrar sesión** el vecino elige si ese equipo sigue recibiendo **solo ese
aviso** (la empresa y la hora, nada más): el equipo queda marcado `cerrada` en la lista y el
`Codigo.gs` **versión 11** le manda únicamente los avisos de correo, durante 90 días o hasta que vuelva
a entrar. Si en ese equipo entra otra cuenta, vale la anotación más nueva y la anterior deja de recibir.
Con una versión anterior pegada, un equipo con la sesión cerrada sigue recibiendo **todos** los avisos
de esa cuenta (como pasaba hasta ahora): conviene pegar la versión 11 y hacer **Nueva versión**.

## El propietario a distancia (07-10-2026, versión 11)

Si el lote está alquilado (o el propietario marcó "No vivo en el lote"), su equipo se anota como
`propietario` y el `Codigo.gs` versión 11 le manda, de lo que va a todo el barrio, **solo** votaciones,
expensas y comunicados de la Administración (no el camión, los correos ni el SOS). Lo que es para él,
le llega siempre.

## Suenan como una llamada (20-10-2026, versión 15)

Pedido de Claudio: "entró el camión, tenía el celular bloqueado cargando y no sonó ni apareció el aviso".

- **El camión, el correo que va a tu casa y "llegó sin avisar"** suenan y vibran **una y otra vez** (cada 4 segundos)
  hasta que se toca el aviso: el camión hasta 45 segundos, el correo hasta 1 minuto, la visita hasta 15 minutos.
  Al abrir la app deja de sonar (el aviso queda en la bandeja). En iPhone suena una vez por aviso (regla de Apple).
- **La garita ve si salió**: al registrar el camión, un correo o una llegada sin aviso aparece
  "el aviso sonó en N celulares", o "NO salió" con el motivo. Antes un error quedaba escondido.
- **Probar** (Tu cuenta → Avisos) ahora espera 10 segundos antes de mandar: se toca, se bloquea el teléfono
  y suena igual que el camión. Si no suena, la app dice qué revisar en Android o iPhone.
- **El teléfono se anota de nuevo cada vez que se abre la app** (antes, una vez por día). Si en el mismo
  teléfono se entró con otra cuenta (garita, Administración), los avisos iban a la última cuenta anotada.
- `Codigo.gs` **versión 15**: los avisos salen más rápido (el tope del día ya no lee toda la planilla de
  registro en cada aviso) y un aviso con un error ya no borra de la lista a todos los teléfonos del barrio
  (antes pasaba con cualquier error "INVALID_ARGUMENT" de Google). Hay que pegarlo y hacer **Nueva versión**.

## Paso 3 — Cada vecino, en cada equipo

**Tu cuenta (tu inicial, arriba a la derecha) → Avisos en este equipo → Activar avisos.** El navegador pide permiso: *Permitir*.
En la portada también aparece una tarjeta que lo propone (se puede cerrar con "Ahora no").

- **Android, Windows, Mac:** anda en Chrome, Edge, Firefox y Safari.
- **iPhone y iPad:** solo con la app **instalada en la pantalla de inicio**
  (Safari → Compartir → *Agregar a inicio*), iOS 16.4 o más nuevo, y activando los avisos
  **desde el ícono instalado**. Es una regla de Apple, no de la app.

Con **Probar** llega un aviso de prueba a ese mismo equipo: bloqueá el teléfono y esperá unos segundos.

## Lo que NO se puede

- Elegir el **sonido** del aviso ni que suene con el teléfono en silencio o en "No molestar": con la
  pantalla apagada suena el sonido de notificación del teléfono (repetido, en los tres avisos de arriba).
  Una pantalla de llamada de verdad (a pantalla completa) solo la puede mostrar una app de tienda (Play Store / App Store). La melodía del camión de helados, la bocina de los correos y el aviso de "va a tu casa" suenan cuando la app está abierta (o se abre al tocar el aviso).
  Sí se elige la **vibración**: el camión tiene su propio ritmo.
- Garantizar la entrega en equipos en **ahorro de batería extremo** o sin datos.

## Topes

El Apps Script corta en 400 avisos push por día (defensa por si alguien usa la frase compartida).
Cada equipo que se desinstala o borra sus datos se saca solo de la lista.
