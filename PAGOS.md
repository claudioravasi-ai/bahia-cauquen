# Cobro de expensas online con Mercado Pago — paso a paso

El vecino toca **Pagar online** en su cuenta de expensas y paga con **tarjeta de crédito o
débito, saldo de Mercado Pago, billeteras o QR**. El pago se **acredita solo, con recibo**:
nadie tiene que confirmarlo a mano.

## Cómo funciona (y por qué es seguro)

1. La app le pide al Apps Script un enlace de pago por el importe del lote.
2. El Apps Script lo crea en Mercado Pago con el **Access Token**, que vive **solo en el
   Apps Script** (nunca en la app ni en GitHub).
3. El vecino paga en la página de Mercado Pago: los datos de la tarjeta no pasan ni por la
   app ni por el barrio.
4. La app de la **Administración**, cada vez que se abre y cada 15 minutos, le pide al
   Apps Script los pagos **aprobados** de los últimos 20 días (Mercado Pago es la fuente) y
   acredita los que falten, con su recibo numerado. Aunque el vecino cierre el navegador sin
   volver a la app, el pago entra igual.

Nadie puede "hacerse el que pagó": lo que se acredita es lo que Mercado Pago dice que cobró.
Si alguien paga el lote de otro, se le acredita a ese lote.

## Configurarlo (una sola vez)

1. Mercado Pago con la cuenta del barrio → **Tu negocio → Configuración → Credenciales**
   (o [mercadopago.com.ar/developers](https://www.mercadopago.com.ar/developers) → Tus integraciones →
   crear una aplicación "Pagos online").
2. Copiá el **Access Token de producción** (empieza con `APP_USR-`).
3. Apps Script → engranaje → **Propiedades del script → Agregar propiedad**:
   `MP_ACCESS_TOKEN` = ese token.
4. Pegá el `apps-script/Codigo.gs` nuevo y hacé **Nueva versión** (si no lo hiciste ya).
5. En la app: **Contabilidad → Parámetros → Dónde pagan los vecinos** → tildá
   **Cobro online con acreditación automática** → Guardar.
6. Probalo con un pago chico propio: al volver a la app tiene que decir *¡Pago aprobado!*
   y, al abrir la Administración, aparecer el recibo.

## Comisiones y plazos

Los fija Mercado Pago según la cuenta (varían con el medio y el plazo de acreditación).
Conviene confirmarlos con el contador antes de activarlo: la transferencia sigue siendo
el medio sin costo, y los centavos del cupón (el número de lote) la identifican igual.

## Lo que no hace (todavía)

- **Débito automático mensual**: necesita una autorización del vecino y una integración de
  suscripciones de Mercado Pago. Las expensas cambian cada mes, así que se cobra cupón por cupón.
- **NFC / tarjeta en mano**: requiere un lector (Point). Para expensas, el pago desde el
  teléfono es lo que corresponde.
