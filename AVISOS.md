# Avisos al celular con la pantalla apagada — paso a paso

Con la app abierta, los avisos suenan solos. Con el celular **bloqueado** el navegador
no corre nada: lo único que lo despierta es una **notificación push**, que manda Google
(Firebase Cloud Messaging). Sirve para:

- el **camión de la basura** (cuando la garita registra la entrada),
- el **SOS** de un vecino,
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

## Paso 3 — Cada vecino, en cada equipo

**Mi casa → Este equipo → Activar avisos.** El navegador pide permiso: *Permitir*.
En la portada también aparece una tarjeta que lo propone (se puede cerrar con "Ahora no").

- **Android, Windows, Mac:** anda en Chrome, Edge, Firefox y Safari.
- **iPhone y iPad:** solo con la app **instalada en la pantalla de inicio**
  (Safari → Compartir → *Agregar a inicio*), iOS 16.4 o más nuevo, y activando los avisos
  **desde el ícono instalado**. Es una regla de Apple, no de la app.

Con **Probar** llega un aviso de prueba a ese mismo equipo: bloqueá el teléfono y esperá unos segundos.

## Lo que NO se puede

- Elegir el **sonido** del aviso: con la pantalla apagada suena el sonido de notificación
  del teléfono. La melodía del camión de helados suena cuando la app está abierta (o se abre al tocar el aviso).
  Sí se elige la **vibración**: el camión tiene su propio ritmo.
- Garantizar la entrega en equipos en **ahorro de batería extremo** o sin datos.

## Topes

El Apps Script corta en 400 avisos push por día (defensa por si alguien usa la frase compartida).
Cada equipo que se desinstala o borra sus datos se saca solo de la lista.
