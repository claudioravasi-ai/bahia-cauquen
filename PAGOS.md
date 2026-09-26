# Cobro de expensas — paso a paso (versión del 26-09-2026)

## El circuito completo

1. **La Administración cierra el mes** (Contabilidad → Cierre de mes → Emitir). A cada lote le llega
   su cupón en la app y por correo, con el 1º y el 2º vencimiento y el importe de cada uno.
2. **El vecino ve su cupón y el botón de pago.** Desde ese día, en su pizarra privada ("Para vos")
   le aparece un aviso por día: cuántos días faltan y cuánto paga en cada vencimiento. El día del
   último vencimiento el aviso pasa a rojo y titila. Lo ve solo él.
3. **El vecino paga:**
   - **a. Desde la app ("Pagar online ahora").** Se abre Mercado Pago en otra ventana. Paga con
     tarjeta de crédito o débito, con el saldo de Mercado Pago o con Mercado Crédito. Cuando
     Mercado Pago aprueba, esa ventana muestra "¡Pago aprobado!" y **a los 3 segundos se cierra sola**.
     El vecino queda en la app, en la misma ventana donde estaba, con el saldo ya descontado. La
     Administración ve el pago enseguida y la app lo pasa a recibo sola.
   - **b. Por fuera de la app** (transferencia desde cualquier banco o billetera: MODO, Ualá, Brubank,
     Naranja X, BNA+, Cuenta DNI…; depósito; efectivo). En su cupón toca **"Ya pagué por fuera de la
     app"** y adjunta el comprobante (PDF, JPG, PNG o captura). La app sabe de qué lote y de qué
     vecino viene. El pago queda **por acreditar** y los recordatorios se detienen. La Administración
     recibe el aviso, abre el comprobante, lo corrobora en el banco y lo **confirma** (sale el recibo)
     o lo **rechaza** (el saldo vuelve y al vecino le llega el aviso).
4. **Al día siguiente del 2º vencimiento**, solo a los lotes que no pagaron ni avisaron que pagaron,
   la app manda un **correo** que avisa que venció el plazo. Si pagan fuera de término, la expensa
   siguiente suma el **ajuste por inflación**. La app lo calcula sola al cerrar el mes siguiente,
   con el IPC del INDEC, que trae cada tres días (Contabilidad → Parámetros → Pago fuera de término).
5. **Todo se cruza con Contabilidad:** cada pago confirmado es un asiento de ingreso en el Libro
   contable, cada factura es un egreso, y la Carpeta del contador los junta por mes.

## Qué medios de pago entran y por dónde

| Medio | Cómo entra | Se acredita |
|---|---|---|
| Tarjeta de crédito o débito de cualquier banco (también las de Brubank, Ualá, Naranja X) | "Pagar online ahora" (Mercado Pago) | Al instante, solo |
| Saldo de Mercado Pago, Mercado Crédito | "Pagar online ahora" | Al instante, solo |
| Efectivo en Rapipago o Pago Fácil | "Pagar online ahora" → cupón de Mercado Pago | Cuando lo paga, solo |
| Transferencia desde cualquier banco o billetera (MODO, Ualá, Brubank, BNA+, Cuenta DNI…) | Alias/CBU del barrio + "Ya pagué por fuera" | Cuando la Administración lo confirma |
| Revolut, AstroPay u otras cuentas del exterior | Con su tarjeta, en "Pagar online ahora" | Al instante, **si el emisor autoriza la compra** (las tarjetas del exterior pueden rechazarse o tener recargos) |
| Google Pay / Apple Pay | Hoy Mercado Pago no los ofrece en su pago web en Argentina. Si los habilita, aparecen solos en su página, sin tocar la app | — |

**Siguiente paso posible (fase 2):** un **QR de Mercado Pago por el importe exacto**, que se puede
pagar desde MODO, Ualá, Brubank o la app de cualquier banco (QR interoperable, Transferencias 3.0).
Se acredita solo, igual que "Pagar online". Hace falta crear una sucursal y una caja en Mercado Pago.
Lo programo cuando la fase 1 ya ande.

## Seguridad (lo que la app hace de verdad)

- **Los datos de la tarjeta nunca pasan por la app ni por el barrio.** Se cargan en la página de
  Mercado Pago, que cumple la norma de la industria de tarjetas (PCI DSS). El barrio no guarda
  números de tarjeta.
- Todo viaja cifrado en tránsito (HTTPS): la app, Mercado Pago, el Apps Script y Firebase.
- **El token de Mercado Pago vive solo en el Apps Script** (Propiedades del script). Nunca va en la
  app ni en GitHub.
- **Nadie se hace el que pagó.** La app no le cree al teléfono ni al aviso de Mercado Pago: el Apps
  Script le pregunta cada pago a Mercado Pago con el token. Si un pago dice ser de Mercado Pago y
  Mercado Pago no lo tiene aprobado, la Administración lo rechaza sola y el saldo vuelve.
- **Ningún pago se anota dos veces.** Cada operación tiene un número fijo en la app (`mp-<número>`).
- Pagos, recibos y comprobantes los leen **solo los vecinos de ese lote y la Administración**. La
  garita no los ve. Por la app viaja solo una **miniatura** del comprobante (3 KB). El archivo se baja
  solo en el equipo que toca "Ver comprobante", y se borra de la base 30 días después de confirmado
  o rechazado. Quien lo necesite lo guarda en su equipo con "Guardar".
- **Es cifrado en tránsito, no "de punta a punta".** No se promete lo que no se hace (ver Preguntas
  frecuentes → Tus datos).

## Paso a paso para dejarlo andando HOY, en modo prueba

### 1. La cuenta de Mercado Pago del barrio
- Para **cobrar de verdad** tiene que ser una cuenta **a nombre del barrio** (Asociación Civil, CUIT
  30-71010005-1), con la identidad validada: la plata de las expensas no puede entrar a una cuenta
  personal.
- **Para probar**, mientras tanto, sirve tu cuenta personal: con ella se crean la aplicación y las
  **cuentas de prueba**, y esos pagos son de mentira (no mueven plata de nadie). Cuando exista la del
  barrio, se cambia solo el `MP_ACCESS_TOKEN` del Apps Script; la app no se toca.
- Los pagos hechos con cuentas de prueba la app los reconoce solos (Mercado Pago los marca) y los
  muestra aparte como **"Pagos de PRUEBA"**: no descuentan saldos, no sacan recibo ni entran a la
  contabilidad. Se borran con un toque en Expensas → Pagos.


### 2. La aplicación en Mercado Pago Developers
1. Entrar a **mercadopago.com.ar/developers** con la cuenta del barrio → **Tus integraciones** →
   **Crear aplicación**.
2. Nombre: *Expensas Barrio Bahía Cauquén*. Solución: **Pagos online**. ¿Plataforma de e-commerce?:
   **No**. Producto: **Checkout Pro**. Crear.
3. En la aplicación → **Cuentas de prueba** → crear dos: una **Vendedor** y una **Comprador**
   (país Argentina). Anotar usuario y contraseña de cada una.
4. Entrar a Developers **con la cuenta de prueba Vendedor**, crear ahí la misma aplicación y copiar
   su **Access Token** (el de "Credenciales de producción" de esa cuenta de prueba, empieza con
   `APP_USR-`). Con ese token los pagos son de mentira.

### 3. El Apps Script (el "servidor" del barrio)
1. script.google.com → el proyecto del correo → pegar el **`apps-script/Codigo.gs` nuevo (versión 6)**.
2. Engranaje → **Propiedades del script**:
   - `MP_ACCESS_TOKEN` = el token del paso 2.4.
   - `FCM_CUENTA` = la cuenta de servicio de Firebase (la misma de los avisos, ver AVISOS.md). Con
     ella el aviso de Mercado Pago anota el pago en la base aunque el vecino cierre todo.
3. **Implementar → Gestionar implementaciones → editar → Versión: Nueva versión → Implementar.**
   La dirección `/exec` no cambia.
4. (Opcional, de respaldo) En la aplicación de Mercado Pago → **Webhooks** → URL: la misma dirección
   `/exec` → evento **Pagos** → Guardar. La app ya se la pasa en cada pago; esto es por las dudas.

### 4. Firebase
- Publicar **`reglas-firebase.txt`** entero (Realtime Database → Reglas → Publicar). Trae lo nuevo:
  `pv/comprobantes` y `staff/compIdx`, más lo que quedó pendiente de antes.

### 5. Subir la app
- `python3 revisar.py` → `python3 version.py` → subir a GitHub. Tiene que subir también **`pago.html`**
  (es la página a la que vuelve Mercado Pago).

### 6. Encenderlo en la app
- Administración → Contabilidad → **Parámetros**:
  - tildar **"Cobro online con acreditación automática (Mercado Pago)"**;
  - en **"Pago fuera de término"**, elegir **Ajuste por inflación (IPC del INDEC)** (o la regla que
    fije el reglamento) → **Guardar**.
- Si agosto se pagó por fuera de la app: Expensas → Pagos → **"Cobros del cupón de agosto (carga
  inicial)"**. Salen todos tildados menos los morosos. Destildá a quien no pagó → Registrar.

### 7. Probar (con tu Lote 148)
Tarjetas de prueba de Mercado Pago Argentina (vencimiento 11/30, DNI 12345678):

| Tarjeta | Número | Código |
|---|---|---|
| Mastercard crédito | 5031 7557 3453 0604 | 123 |
| Visa crédito | 4509 9535 6623 3704 | 123 |
| American Express | 3711 803032 57522 | 1234 |
| Visa débito | 4002 7686 9439 5619 | 123 |

El **nombre del titular** decide el resultado: **APRO** = aprobado · **OTHE** = rechazado ·
**CONT** = pendiente. (Si Mercado Pago cambió las tarjetas de prueba, están en su documentación:
"Tarjetas de prueba" de Checkout Pro.)

1. Modo vecino → Expensas → **Pagar online ahora**. Se abre Mercado Pago en otra ventana.
2. Entrá con la cuenta de prueba **Comprador**. Pagá con una tarjeta de arriba y titular **APRO**.
3. Tiene que pasar esto: la ventana de Mercado Pago dice "¡Pago aprobado!" y se cierra a los
   3 segundos. En la app aparece "¡Pago aprobado!" y el saldo ya está descontado. El cartel también
   se va solo a los 3 segundos.
4. Modo Administración → Expensas → Pagos: el pago figura en "Mercado Pago aprobados" y al minuto
   pasa a recibo. En Contabilidad → Libro contable aparece como ingreso.
5. Repetir con **OTHE** (tiene que decir que no salió) y con **CONT** (tiene que quedar pendiente).
6. **"Ya pagué por fuera de la app"** con una captura. En la Administración: "Por acreditar" →
   **Ver comprobante** → **Confirmar**. Te tiene que llegar el recibo.

### 8. Pasar a pagos reales
1. En la aplicación de Mercado Pago (con la cuenta **real** del barrio) → **Credenciales de
   producción** → activarlas (datos del negocio; sitio web: la dirección de GitHub Pages de la app).
2. Cambiar `MP_ACCESS_TOKEN` por el **Access Token de producción** real → **Nueva versión**.
3. Hacer un pago real chico con tu tarjeta y devolverlo desde Mercado Pago (Actividad → el pago →
   Devolver). Si aparece y se acredita, está listo.

## Comisiones y plazos
Los fija Mercado Pago según la cuenta, el medio y el plazo en que el barrio elija recibir la plata
(al instante cuesta más que a 10, 18 o 35 días). Conviene decidir con el contador si la comisión la
absorbe el barrio. La transferencia al alias sigue siendo el medio sin costo, y los centavos del
cupón (el número de lote) la identifican igual.
