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

1. Pegá el `apps-script/Codigo.gs` nuevo (**versión 11**, del 07-10-2026: no le manda a la supervisión los avisos de todo el barrio, vigila que la garita esté conectada y que los SOS tengan respuesta, y a un equipo con la sesión cerrada le manda solo "un correo va a tu casa") → **Guardar** →
   **Implementar → Gestionar implementaciones → editar → Nueva versión → Implementar**.
2. Arriba, en el menú de funciones, elegí **`instalarRelojCuidados`** y tocá **Ejecutar**.
   Google pide permiso ("activadores" y "servicio externo"): aceptalo.
3. Listo: en **Activadores** (el relojito de la izquierda) aparece `revisarCuidados` cada 10 minutos.

Usa la misma `FCM_CUENTA` del paso 2 y la dirección de la base (`BASE_URL`), que se guarda
sola la primera vez que la app manda un aviso push (por ejemplo, **Ajustes → Avisos al celular → Probar**).
Sin el reloj, "Estoy bien" igual avisa, pero recién cuando alguna app de un contacto o de la
garita está abierta; la garita, que está abierta las 24 horas, lo cubre si el vecino la eligió.

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

## Paso 3 — Cada vecino, en cada equipo

**Tu cuenta (tu inicial, arriba a la derecha) → Avisos en este equipo → Activar avisos.** El navegador pide permiso: *Permitir*.
En la portada también aparece una tarjeta que lo propone (se puede cerrar con "Ahora no").

- **Android, Windows, Mac:** anda en Chrome, Edge, Firefox y Safari.
- **iPhone y iPad:** solo con la app **instalada en la pantalla de inicio**
  (Safari → Compartir → *Agregar a inicio*), iOS 16.4 o más nuevo, y activando los avisos
  **desde el ícono instalado**. Es una regla de Apple, no de la app.

Con **Probar** llega un aviso de prueba a ese mismo equipo: bloqueá el teléfono y esperá unos segundos.

## Lo que NO se puede

- Elegir el **sonido** del aviso: con la pantalla apagada suena el sonido de notificación
  del teléfono. La melodía del camión de helados, la bocina de los correos y el aviso de "va a tu casa" suenan cuando la app está abierta (o se abre al tocar el aviso).
  Sí se elige la **vibración**: el camión tiene su propio ritmo.
- Garantizar la entrega en equipos en **ahorro de batería extremo** o sin datos.

## Topes

El Apps Script corta en 400 avisos push por día (defensa por si alguien usa la frase compartida).
Cada equipo que se desinstala o borra sus datos se saca solo de la lista.
