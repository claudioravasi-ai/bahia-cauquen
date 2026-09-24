# Hacer que la app mande los mails — paso a paso

Un navegador **no puede mandar correo por sí solo**. Necesita a alguien que lo
haga por él. La app usa un programita de **Google Apps Script** que vive en la
cuenta de Gmail de la Administración: la app le pide "mandá esto" y él lo manda.

Es el mismo camino que usan AFAAR y ASHA, y es gratis.

> **Mientras no esté configurado la app igual funciona.** Cada correo queda
> guardado en *Administración → Correos*, con un botón **Mandar** que abre tu
> programa de correo con el texto ya escrito. No se pierde ninguno. Lo que
> cambia al configurarlo es que salen solos.

---

## Qué correos manda la app

| Cuándo | A quién |
|---|---|
| Alguien se inscribe | al vecino (acuse) y a la Administración (aviso) |
| La Administración aprueba una inscripción | al vecino, con cómo entrar |
| La Administración rechaza una inscripción | al vecino |
| Se emite la liquidación del mes | a cada propietario con correo cargado, con su cupón |
| Se invita a un propietario del padrón | al propietario, con el enlace de inscripción |
| Se le avisa al contador | al contador, con el resumen del mes |

---

## Paso 1 — Elegir de qué casilla salen

Los correos salen de **la cuenta de Google con la que se crea el programa**, y
de ninguna otra. No se elige después: se elige ahora, al entrar.

Conviene usar la casilla oficial de la Administración
(`barriobahiacauquen@gmail.com`), no la personal de nadie.

## Paso 2 — Crear el programa

1. Entrá a **[script.google.com](https://script.google.com)** con esa cuenta.
2. **Proyecto nuevo**.
3. Ponele un nombre: *Correo Barrio Bahía Cauquén*.
4. Borrá todo lo que aparece en el editor.
5. Abrí el archivo **`apps-script/Codigo.gs`** de este proyecto, copialo
   **entero** y pegalo ahí.

## Paso 3 — Poner tu propia frase secreta

Arriba de todo, cambiá esta línea:

```js
var CLAVE_COMPARTIDA = 'CAMBIAR-por-una-frase-larga-y-propia';
```

Por una frase larga, tuya, sin espacios. Por ejemplo:

```js
var CLAVE_COMPARTIDA = 'bahia-cauquen-ushuaia-2026-lupinos-y-viento';
```

Anotala: la vas a necesitar en el paso 6.

> **Desde la versión del 24-09-2026 la frase ya no se pierde al pegar código nuevo.**
> La primera vez que el programa corre con una frase de verdad, la guarda en
> *Configuración del proyecto (engranaje) → Propiedades del script → CLAVE_COMPARTIDA*.
> Si más adelante pegás un `Codigo.gs` nuevo y la línea vuelve a decir
> `CAMBIAR-por-una-frase…`, se sigue usando la guardada.

También podés ajustar, si querés:

```js
var NOMBRE_REMITENTE = 'Barrio Bahía Cauquén';   // lo que ve el vecino como remitente
var RESPONDER_A = '';                             // a dónde van las respuestas (vacío = a la misma casilla)
var TOPE_DIARIO = 80;                             // freno por si alguien encuentra la clave
```

Guardá con **Ctrl+S** (o **Cmd+S**).

## Paso 4 — Publicarlo

1. Arriba a la derecha: **Implementar → Nueva implementación**.
2. En el engranaje, elegí **Aplicación web**.
3. Completá:
   - **Ejecutar como:** *Yo* (tu cuenta)
   - **Quién tiene acceso:** *Cualquier persona*
4. **Implementar**.
5. Google te pide permiso para mandar correo en tu nombre: **Autorizar**.
   Va a aparecer una pantalla de advertencia ("Google no verificó esta
   aplicación") → **Configuración avanzada → Ir a (nombre del proyecto)**.
   Es tu propio programa: esa advertencia aparece siempre en los proyectos
   personales.
6. Copiá la **URL de la aplicación web**. Termina en `/exec`.

> **"Quién tiene acceso: cualquier persona" no significa que cualquiera pueda
> mandar correos.** Lo primero que hace el programa es comparar la frase
> secreta; si no coincide, rechaza y lo anota. Además hay tope diario y
> registro de todo.

## Paso 5 — Probar que quedó andando

Pegá la URL que copiaste en el navegador y apretá Enter. Tiene que responder
algo así:

```json
{"ok":true,"estado":"activo","enviadosHoy":0,"tope":80}
```

Si ves eso, está funcionando.

## Paso 6 — Pegarlo en la app

En la app, con cuenta de Administración:

**Inicio → Gestión del barrio → Administración → Ajustes → Correo**

- **URL del Apps Script**: la que termina en `/exec`
- **Frase compartida**: exactamente la misma del paso 3

**Guardar ajustes**.

## Paso 7 — Mandar uno de prueba

En **Administración → Correos**, arriba tiene que decir
*"El envío automático está configurado"*.

Para probarlo de verdad: entrá al **Padrón**, buscá un lote que tenga tu propio
correo cargado y tocá **Invitarlo a la app**. Debería llegarte en segundos.

---

## Dónde mirar si algo falla

**En la app:** *Administración → Correos* muestra todos los correos con su
estado: `enviado`, `pendiente` o `error`.

**En Google:** el programa crea solo una planilla en tu Drive llamada
*"Bahía Cauquén — registro de correos enviados"*, con fecha, resultado y
destinatario de cada intento. Ahí se ve si alguien está usando la clave sin
permiso.

| Problema | Qué suele ser |
|---|---|
| Queda en `error` | la URL no termina en `/exec`, o la frase no coincide |
| Dice `no autorizado` | la frase de Ajustes no es la misma que la del código |
| Dice `tope diario alcanzado` | pasaste los 80 del día; subí `TOPE_DIARIO` o esperá |
| No llega nada y el registro está vacío | falta autorizar el proyecto (paso 4.5) |
| Llega a spam | pedile a los vecinos que lo marquen como "no es spam" la primera vez |

## Cuántos correos se pueden mandar por día

- Gmail común: **unos 100 por día**.
- Google Workspace (cuenta con dominio propio): **1.500 por día**.

El barrio tiene 152 lotes. Para el envío mensual de cupones, **una cuenta de
Gmail común alcanza justo** y conviene subir `TOPE_DIARIO` a 100 ese día, o
mandarlos en dos tandas. Si el barrio pasa a tener dominio propio, no hay
problema.

## Si alguna vez hay que cambiar la frase secreta

1. Cambiá `CLAVE_COMPARTIDA` en el Apps Script y guardá.
2. **Implementar → Administrar implementaciones → editar → Nueva versión → Implementar.**
   (Si no hacés una versión nueva, sigue corriendo la vieja.)
3. Cambiala también en **Ajustes → Correo** de la app.

## Si la app dice "La frase compartida de Ajustes no coincide"

Pasó el 24-09-2026. Tres causas posibles, de la más probable a la menos:

1. **El navegador rellenó el campo solo.** Hasta esa fecha, la frase en *Ajustes → Correo*
   era un campo de tipo contraseña al lado de un campo de correo, y Chrome y Safari lo
   completaban con la contraseña guardada de la cuenta. Al tocar Guardar, esa contraseña
   pisaba la frase. Ahora es un campo común con la opción **Mostrar la frase**: abrilo,
   tildá *Mostrar*, borrá lo que haya y pegá la frase exacta del Apps Script.
2. **Se pegó el `Codigo.gs` nuevo** (el de los cruceros) y la línea `CLAVE_COMPARTIDA`
   quedó con otra frase. Copiá la que figura ahí.
3. **No se hizo "Nueva versión"** después de cambiar la frase en el Apps Script.

Con el `Codigo.gs` nuevo, el botón **Probar el envío** dice cuántas letras tiene cada frase
y si la diferencia es solo de mayúsculas o de espacios (sin mostrar la frase).

## "No se puede abrir el archivo en estos momentos" al abrir la dirección /exec

Es un aviso de Google Drive, no del programa: aparece cuando el navegador tiene **varias
cuentas de Google abiertas a la vez**. El programa anda igual (la app lo lee sin problema).
Para verlo en el navegador, abrí la dirección en una ventana de incógnito.

