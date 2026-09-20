# Poner la app en funcionamiento — paso a paso

Todo a mano, sin instalar nada.

## El orden, y por qué es ése

**GitHub → Firebase → cuentas → padrón → Apps Script.**

No es caprichoso: cada paso usa algo del anterior.

1. **GitHub primero** porque de ahí sale la **dirección de la app**
   (`https://tuusuario.github.io/bahia-cauquen/`).
2. **Firebase después**, porque hay que **autorizar esa dirección** para que la
   gente pueda entrar desde el celular. Sin la dirección, no se puede autorizar.
3. **Las cuentas y el padrón** van cuando la base ya está viva y protegida.
4. **Apps Script al final**, porque los correos llevan **esa misma dirección
   adentro** ("entrá a la app desde acá").

Si lo hacés al revés, tenés que volver sobre tus pasos.

| # | Paso | Cuánto | ¿Se puede saltear? |
|---|------|--------|--------------------|
| 0 | Revisar, sellar y probarla | 10 min | **No** |
| 1 | GitHub: publicarla en internet | 20 min | No |
| 2 | Firebase: dominio, acceso y reglas | 20 min | **No** |
| 3 | Tu cuenta, la garita y Paula | 15 min | No |
| 4 | Cargar el padrón | 10 min | No |
| 5 | Apps Script: los correos | 20 min | Sí, pero quedan para mandar a mano |
| 6 | Ajustes del barrio y feriados | 15 min | Conviene que no |
| 6.5 | Firebase: pasar a plan Blaze | 10 min | No, antes del 7 |
| 7 | Prueba chica y recién ahí, invitar a todos | — | **No** |

Total la primera vez: unas dos horas, tranquilo.

---

# PASO 0 — Probala y sellá la versión

Son dos cosas, y las dos se hacen en tu computadora, **antes** de subir nada.

## 0.1 Revisar y sellar — la forma fácil

En el Finder, abrí la carpeta **Barrio Bahia Cauquen** (está en el Escritorio)
y hacé **doble clic** en el archivo:

```
1 - Revisar y sellar.command
```

Se abre una ventana negra sola, trabaja dos segundos y te dice una de dos cosas:

**Si está todo bien:**

```
Todo en orden: 16 archivos, 299 nombres, sin choques.
Versión sellada: 20260920-104702
-------------------------------------------------
  LISTO. Ya podés subir los archivos a GitHub.
-------------------------------------------------
```

Cerrás la ventana y seguís con el Paso 1.

**Si hay un problema:**

```
Nombres declarados más de una vez (rompen el archivo que va segundo):
  DESTINOS  →  js/admin.js, js/v-vecinos.js
-------------------------------------------------
  HAY UN PROBLEMA. NO SUBAS NADA a GitHub.
-------------------------------------------------
```

En ese caso **no subas nada**: copiame lo que dice y lo arreglo.

> **La primera vez puede que macOS no lo deje abrir** ("no se puede abrir
> porque procede de un desarrollador no identificado"). Hacé **clic derecho**
> sobre el archivo → **Abrir** → **Abrir** de nuevo en el cartel. Eso pasa una
> sola vez; después anda con doble clic normal.

## 0.2 Lo mismo, si preferís escribirlo

Abrí la app **Terminal** (Cmd + Espacio, escribí `Terminal`, Enter), pegá esta
línea tal cual y apretá Enter:

```bash
cd "/Users/claudioravasi/Desktop/Barrio Bahia Cauquen" && python3 revisar.py && python3 version.py
```

## ¿Para qué sirve cada cosa?

**`revisar.py`** busca el error que rompió la app la última vez: un mismo
nombre declarado en dos archivos distintos. Cuando eso pasa, el segundo archivo
**deja de ejecutarse entero**: la app arranca, se ve bien, y de golpe media
pantalla no responde. Es imposible de ver a simple vista, por eso se revisa
antes de cada subida.

**`version.py`** le pone una marca de fecha y hora a cada archivo
(`app.js?v=20260920-104702`). Los celulares guardan la app para que abra sin
internet; si la marca no cambia, siguen usando los archivos **viejos** y queda
una versión mitad nueva y mitad vieja. Con la marca nueva, la dirección cambia
y el celular está obligado a bajar lo último.

> **Esta primera vez ya está hecho**: lo corrí yo recién y dio "Todo en orden".
> Podés ir directo al Paso 1. Lo vas a necesitar de acá en adelante, cada vez
> que cambies algo.

## 0.3 Mirala una vez más antes de publicarla

Doble clic en:

```
2 - Probar en mi computadora.command
```

Se abre la ventana negra y te deja andando un servidor. Entonces abrí el
navegador en:

```
http://localhost:8820/?local
```

Entrá con los botones de demo (Claudio, Lucía, la guardia, la Administración) y
recorrela. El **`?local`** hace que trabaje solo en tu computadora, con datos
inventados, sin tocar la base del barrio.

Cuando termines, cerrá la ventana negra (Ctrl + C, o cerrarla directamente).

---

# PASO 1 — GitHub

## Camino A — por la web (sin comandos)

### 1.1 Crear el repositorio

1. Entrá a **github.com** con tu cuenta → botón **New repository**.
2. Nombre: `bahia-cauquen`.
3. **Público**. (GitHub Pages gratis solo publica repositorios públicos.)
4. No tildes nada más → **Create repository**.

> Que sea público no expone al barrio. Lo que se publica es el **programa**, no
> los datos: los datos viven en Firebase, detrás de las reglas del paso 2.
> Por eso **nunca** se sube `datos-privados/`.

### 1.2 Preparar lo que se sube

**No subas la carpeta del Escritorio tal cual**: adentro hay cosas que no
pueden salir de tu computadora (los nombres de los propietarios, sobre todo).

Doble clic en:

```
3 - Preparar carpeta para GitHub.command
```

Revisa, sella la versión y arma en el Escritorio una carpeta nueva llamada
**`SUBIR A GITHUB`** con exactamente lo que va y nada más. Se abre sola al
terminar. Podés volver a correrlo cada vez que haya cambios.

### 1.3 Subir los archivos

1. Abrí la carpeta **`SUBIR A GITHUB`**.
2. Seleccioná **todo lo que hay adentro** con **Cmd + A**.
3. Arrastralo a la página del repositorio vacío, donde dice
   *"uploading an existing file"*.

> **Importante:** se arrastra **el contenido** de la carpeta, no la carpeta
> entera. Si arrastrás la carpeta, GitHub la deja como subcarpeta y la app no
> abre.

4. Esperá a que termine de subir (son 38 archivos, 1,2 MB).
5. Abajo escribí "Primera versión" y tocá **Commit changes**.

### Qué hay adentro (38 archivos)

```
index.html                 ← la página; carga todo lo demás
manifest.webmanifest       ← el nombre y el ícono cuando se instala
sw.js                      ← lo que hace que abra sin internet
reglas-firebase.txt        ← las reglas; las usás en el Paso 2
revisar.py  version.py     ← las dos revisiones
.gitignore                 ← la lista de lo que nunca se sube

css/  → app.css

js/   → app.js  core.js  nube.js  admin.js  calendario.js  clima.js
        icons.js  agenda.js  padron.js  seed.js  firebase-config.js
        v-inicio.js  v-comunidad.js  v-gestion.js  v-vecinos.js  v-expensas.js

img/   → portada-dia.jpg   portada-noche.jpg
icons/ → logo.png  icon-192.png  icon-512.png  icon.svg
apps-script/ → Codigo.gs   ← lo usás en el Paso 5

LEEME.md  PUBLICAR.md  PADRON.md  CORREO.md
CAPACIDAD.md  CONECTAR.md  EXPENSAS.md
```

### Lo que NUNCA se sube, y por qué

| Qué | Por qué |
|---|---|
| `datos-privados/` | Tiene los **nombres, DNI y correos de los propietarios**. Es lo único que no puede salir de tu computadora. |
| Los PDF de expensas | Datos de los vecinos. |
| `Incial DeepSeek/` | Es tu respaldo local. |
| Los archivos `.command` | Son herramientas para tu Mac; arriba no hacen nada. |
| `.DS_Store` | Basura que deja macOS. |

El archivo `3 - Preparar carpeta para GitHub.command` ya los deja afuera a
todos. Igual, antes de tocar **Commit changes**, pegale una mirada a la lista
que muestra GitHub y confirmá que **no aparece `datos-privados`**.

> **¿Y las claves de Firebase que están en `js/firebase-config.js`?**
> Esas sí van, y está bien que vayan: son públicas por diseño, viajan dentro de
> cualquier página que use Firebase. Lo que protege los datos del barrio **no
> es esconderlas, son las reglas** del Paso 2.3.

## Camino B — por Terminal (si preferís git)

El repositorio local ya tiene 13 commits y todavía no tiene remoto.

```bash
cd "/Users/claudioravasi/Desktop/Barrio Bahia Cauquen"
git add -A
git commit -m "Revisión grande: navegación, SOS, padrón, expensas y calendario"
git remote add origin https://github.com/TUUSUARIO/bahia-cauquen.git
git push -u origin main
```

GitHub te va a pedir usuario y contraseña: **la contraseña no sirve**, hay que
usar un *token*. Se saca en github.com → tu foto → **Settings** →
**Developer settings** → **Personal access tokens** → **Tokens (classic)** →
**Generate new token**, con el permiso `repo`. Lo pegás donde pide la
contraseña. Guardalo: no se vuelve a mostrar.

## 1.4 Encender GitHub Pages

1. En el repositorio: **Settings** → **Pages**.
2. *Source*: **Deploy from a branch**. Rama `main`, carpeta `/ (root)`.
3. **Save**. A los dos o tres minutos aparece arriba la dirección:

```
https://TUUSUARIO.github.io/bahia-cauquen/
```

Abrila en el celular: tiene que verse la pantalla de bienvenida con la foto del
barrio.

**Anotá esa dirección. La usás en los pasos 2 y 5.**

---

# PASO 2 — Firebase

## Lo que YA está hecho

El proyecto **`bahia-cauquen`** existe y sus claves están en
`js/firebase-config.js` (`databaseURL` apunta a
`bahia-cauquen-default-rtdb.firebaseio.com`). No hay que crear nada de cero.

## Y si todavía no pasaste a plan Blaze, seguí igual

**Blaze no hace falta para configurar ni para probar.** El plan gratuito
(**Spark**) alcanza de sobra para vos, la garita, Paula y los primeros quince
vecinos de la prueba.

El tope del plan gratuito son **100 conexiones al mismo tiempo**. Recién
molesta cuando hay más de cien personas con la app abierta a la vez, y eso pasa
el día que invitás a los 152 lotes.

**Dónde entra Blaze entonces:** es el **Paso 2.5**, y hay que hacerlo **antes
del Paso 7** (invitar a todo el barrio). No antes.

Así que ahora hacés **2.1, 2.2, 2.3 y 2.4**, que son los cuatro que sí hacen
falta para que la app funcione.

---

## 2.1 Autorizar la dirección de la app

1. Entrá a **console.firebase.google.com** → proyecto **`bahia-cauquen`**.
2. Menú de la izquierda: **Compilación → Authentication**.
3. Pestaña **Settings** (Configuración) → **Dominios autorizados**.
4. **Agregar dominio** y escribí, sin `https://` ni nada más:

```
TUUSUARIO.github.io
```

(Poné tu usuario real de GitHub. Si tu dirección es
`https://claudioravasi.github.io/bahia-cauquen/`, acá va `claudioravasi.github.io`.)

> Sin esto la app carga en el celular, pero al intentar entrar dice que el
> dominio no está autorizado. Es el error más común.

## 2.2 Confirmar el acceso por correo y contraseña

En **Authentication → Sign-in method** (Método de acceso), la fila
**Correo electrónico/contraseña** tiene que decir **Habilitado**.

Si dice *Inhabilitado*, tocala → activá el primer interruptor → **Guardar**.
(El segundo, "vínculo de correo sin contraseña", se deja apagado.)

## 2.3 Publicar las reglas — esto no se saltea nunca

Sin reglas, cualquiera que conozca la dirección de la base lee todo el barrio:
mensajes privados, reclamos, DNI de las visitas.

1. Abrí el archivo **`reglas-firebase.txt`** de la carpeta.
2. Copiá el bloque que está entre **PEGAR DESDE ACÁ** y **HASTA ACÁ**
   (empieza con `{` y termina con `}`).
3. En Firebase: **Compilación → Realtime Database** → pestaña **Reglas**.
4. Borrá **todo** lo que haya en el recuadro y pegá lo que copiaste.
5. Tocá **Publicar**.

Tiene que quedar sin errores en rojo. Si Firebase se queja, avisame y lo
miramos: es un problema de copiado, no del contenido.

## 2.4 Probar que las reglas andan

Esto es lo que separa "creo que está protegido" de "está protegido".

### La forma fácil: dos direcciones en el navegador

No hace falta entrar a ninguna cuenta. Pegá cada una en el navegador:

**1)** Esta tiene que **responder con datos** (es el único dato público del
barrio: dice sí o no, y nada más):

```
https://bahia-cauquen-default-rtdb.firebaseio.com/barrio/publico.json
```

Tiene que decir `{"instalado":true}` o `null`.

**2)** Estas tienen que decir **Permission denied**, todas:

```
https://bahia-cauquen-default-rtdb.firebaseio.com/privado.json
https://bahia-cauquen-default-rtdb.firebaseio.com/barrio/users.json
https://bahia-cauquen-default-rtdb.firebaseio.com/barrio/posts.json
https://bahia-cauquen-default-rtdb.firebaseio.com/staff/bitacora.json
```

**Cómo se lee el resultado:**

| Lo que ves | Qué significa |
|---|---|
| La 1 responde y las demás dicen *Permission denied* | **Perfecto.** Las reglas están publicadas y andando. |
| **Todas** dicen *Permission denied*, incluso la 1 | Las reglas **no** se publicaron: sigue el modo bloqueado de fábrica. Volvé al 2.3. |
| Alguna de las de abajo **muestra datos** | Las reglas están mal o quedó el modo de prueba. **Urgente**: volvé al 2.3. |

### La forma larga (si querés probar como un vecino de verdad)

Con una cuenta de vecino, en la app publicada **sin `?local`**, F12 →
pestaña **Console**, pegás esto:

```js
firebase.database().ref('privado').get()
  .then(s => console.log(s.val()))
  .catch(e => console.log('BLOQUEADO', e.message))
```

Tiene que responder **`BLOQUEADO`**.

### Si al pegar las reglas desaparece el botón "Publicar"

**No es un error: es que no hay nada que publicar.** Firebase solo muestra
"Publicar" cuando detecta que el texto cambió. Si pegaste exactamente lo mismo
que ya estaba publicado, no hay diferencia y el botón no aparece.

Para confirmarlo, hacé la prueba de las dos direcciones de arriba. Si la
primera responde `{"instalado":true}`, **ya está**, seguí con el Paso 3.

Las otras dos causas posibles, por si acaso:

- **La ventana del navegador está angosta** y el botón quedó cortado. Agrandá
  la ventana o alejá con **Cmd + −**.
- **Hay un error de sintaxis** más abajo en el texto. Firebase lo marca en rojo
  al costado del renglón y no deja publicar. Bajá por el editor buscando la
  marca roja.

## 2.5 Pasar a plan Blaze — antes del Paso 7

**Cuándo:** antes de mandarle la dirección a los 152 lotes. No hace falta antes.

**Por qué:** el plan gratuito corta en 100 conexiones simultáneas. La persona
número 101 ve la app pero **no le llegan los datos, y sin mensaje de error
claro**. Con 152 lotes, y muchos con el teléfono y la computadora a la vez, se
llega enseguida.

**Cómo:**

1. console.firebase.google.com → proyecto `bahia-cauquen`.
2. Abajo a la izquierda, donde dice **Spark**: **Actualizar** / **Upgrade**.
3. Elegí **Blaze (pago por uso)** y cargá una tarjeta.
4. **Poné una alerta de presupuesto** —por ejemplo, avisar a los 5 dólares—
   para dormir tranquilo.

**Cuánto sale:** para un barrio de este tamaño, centavos por mes. Blaze
mantiene un tramo gratuito parecido al de Spark; lo que cambia es que
**desaparece el tope de 100 conexiones**.

> Si la tarjeta la tiene que poner el consorcio y eso lleva tiempo, **no te
> frena**: hacé toda la configuración y la prueba chica ahora, y resolvé Blaze
> antes de la invitación general.

# PASO 3 — Tu cuenta, la garita y Paula

**La primera cuenta que se crea queda como Administración.** Pasa una sola vez.
Creala vos, ya, antes de pasarle la dirección a nadie.

1. Abrí la app publicada (sin `?local`) → **Soy vecino nuevo**.
2. Completá tus datos, elegí **Lote 148** y tu contraseña.
3. Al terminar dice *"Primera cuenta del barrio: quedás como Administración"*.
4. Volvé a entrar. Como sos administrador **y además** vecino del Lote 148, la
   app te pregunta desde dónde querés entrar. Elegí **Como Administración**.
   (Podés cambiar cuando quieras con el botón **Admin / Vecino** de arriba.)
5. **Gestión del barrio → Administración → Vecinos → Dar de alta guardia o
   administrador** y creá:
   - la **garita** (rol *guardia*) — una sola cuenta para todos los turnos;
   - **Paula** (rol *admin*).
6. Anotá las claves que te muestra y pasáselas por WhatsApp.

---

# PASO 4 — El padrón de propietarios

Sin padrón, la app conoce los 152 lotes y sus coeficientes pero no sabe de
quién es cada uno: no puede mandar cupones ni certificados de deuda a nombre
del titular.

Está explicado entero en **`PADRON.md`**. En resumen:

1. **Gestión del barrio → Padrón**.
2. **Bajar el modelo de planilla** (viene con los 152 lotes y sus coeficientes).
3. Completala en Excel. Lo más valioso es la columna **`email`**.
4. **Archivo → Guardar como → CSV UTF-8**.
5. Volvé a **Padrón → Cargar el padrón** y elegí el archivo.

> Si ya tenés el Excel de la administración anterior, **no hace falta
> renombrar las columnas**: la app reconoce *titular*, *apellido y nombre*,
> *domicilio*, *correo*, *celular*, *coeficiente*, y los números al modo
> argentino (`1.234,56`). Lo único que tiene que coincidir es el **número de
> lote**.

También podés subir directo `datos-privados/padron-agosto-2026.json`, que ya
tiene las 152 unidades con propietario y coeficiente.

Después, buscá cualquier lote por apellido, calle, DNI o correo y desde la
ficha invitá al propietario a la app.

---

# PASO 5 — Los correos (Apps Script)

Está explicado entero en **`CORREO.md`**, con las pantallas de Google una por
una. En resumen:

1. Entrá a **script.google.com** **con la casilla de la Administración**
   (`barriobahiacauquen@gmail.com`). Los correos salen de esa casilla y de
   ninguna otra: se define al entrar, no después.
2. **Proyecto nuevo** → borrá lo que haya → pegá **todo** `apps-script/Codigo.gs`.
3. Cambiá `CLAVE_COMPARTIDA` por una frase larga tuya. Anotala.
4. **Implementar → Nueva implementación → Aplicación web**
   - Ejecutar como: **Yo**
   - Quién tiene acceso: **Cualquier persona**
   - Autorizá cuando Google lo pida (va a avisar que "no verificó la
     aplicación": es tuya, **Configuración avanzada → Ir a…**).
5. Copiá la URL que termina en **`/exec`**.
6. Pegala en el navegador: tiene que responder
   `{"ok":true,"estado":"activo",...}`.
7. En la app: **Gestión → Administración → Ajustes → Correo** → pegá la URL y
   **la misma frase** → Guardar.
8. Probalo: entrá al **Padrón**, buscá un lote con tu propio correo y tocá
   **Invitarlo a la app**.

> Sin este paso la app funciona igual: los correos quedan en
> **Administración → Correos** con un botón para mandarlos a mano. No se pierde
> ninguno.

---

# PASO 6 — Ajustes del barrio y feriados

### 6.1 Ajustes

**Gestión → Administración → Ajustes**: teléfono de la garita, teléfono de la
Administración, dónde está el desfibrilador, días del camión de residuos y
horarios de silencio y de obra.

### 6.2 Los retiros de voluminosos

**Ushuaia y servicios → Residuos → Anotar un retiro**. Cargá todas las fechas
del año que ya sepas: la app avisa sola la noche anterior.

### 6.3 Parámetros de expensas

**Gestión → Contabilidad → Parámetros**: días de vencimiento, recargo,
interés por mora, Fondo de Infraestructura, alias y CBU, y el correo del
contador.

### 6.4 Confirmar los feriados

Los feriados **nacionales**, la Pascua y el calendario **católico y judío** los
calcula la app sola: no hay que cargarlos ni actualizarlos nunca.

Lo que sí hay que confirmar una vez por año, porque depende de un decreto o de
una ordenanza:

- el feriado **provincial** de Tierra del Fuego,
- el **municipal** de Ushuaia,
- los **días no laborables con fines turísticos** (los puentes).

**Gestión → Administración → Contenido → Feriados**. Vienen marcados
*"a confirmar"* hasta que los revises contra el Boletín Oficial.

---

# PASO 7 — Prueba chica, y recién ahí, todo el barrio

> **Antes de este paso, el plan Blaze** (punto 2.5). Es el momento: con más de
> cien vecinos conectados a la vez, el plan gratuito empieza a dejar gente
> afuera sin avisar.

**No invites a los 152 lotes el primer día.**

1. Invitá a **diez o quince vecinos** de confianza.
2. Que se inscriban, que vos los apruebes, que carguen una visita, que reserven
   el quincho.
3. **Probá el SOS**: desde un celular, con la garita abierta en otro equipo.
   Tiene que sonar y aparecer en las dos pantallas.
4. Emitá una liquidación de prueba y fijate que llegue el cupón por correo.
5. Cuando eso ande, mandá la invitación al grupo del barrio:

> Vecinos: ya está la app del barrio. Se abre desde
> **https://TUUSUARIO.github.io/bahia-cauquen/** — se inscriben con su DNI, su
> correo y el número de lote, y la Administración los habilita.
> Para tenerla como una app más en el teléfono: en **iPhone**, tocá Compartir →
> *Agregar a la pantalla de inicio*; en **Android**, el menú de tres puntos →
> *Instalar aplicación*.

---

# Cada vez que cambies algo, después

Doble clic en **`3 - Preparar carpeta para GitHub.command`**: revisa, sella la
versión y vuelve a armar la carpeta **`SUBIR A GITHUB`** del Escritorio.

Después, en el repositorio: **Add file → Upload files**, abrís esa carpeta,
**Cmd + A**, y arrastrás todo de nuevo. GitHub reemplaza lo que cambió y deja
igual lo demás.

> Se sube **todo** otra vez a propósito. Subir solo "los archivos que cambiaron"
> es la forma más fácil de olvidarse de `index.html` y `sw.js`, que son los que
> llevan la marca de versión: sin ellos, los celulares siguen con la app vieja.

GitHub Pages se actualiza solo en un par de minutos.

---

# Si algo no anda

| Lo que pasa | Qué mirar |
|---|---|
| La app carga pero no se puede entrar | Paso 2.1: falta autorizar `TUUSUARIO.github.io` |
| Entra, pero no aparece nada del barrio | Paso 2.3: las reglas no están publicadas |
| Al pegar las reglas no aparece "Publicar" | No hay nada que publicar: ya estaban. Comprobalo con el 2.4 |
| Anda para unos y para otros no | Paso 2.5: el tope de 100 conexiones del plan Spark |
| Media pantalla no responde | Corré `python3 revisar.py`: hay un nombre repetido |
| Se entra, se elige Administración y después no responde nada: no abren las ventanas, no están los lomos del costado, no aparece la tira del hotel | El equipo quedó con una **versión a medias** (un `index.html` viejo que carga una lista de archivos vieja). Desde la 20/09/2026 la app se da cuenta sola y se repara al abrirla. Si querés forzarlo: *Tu cuenta → Actualizar la app* |
| No aparecen las promociones del hotel, o los comunicados importantes | Faltan reglas en Firebase. Volvé a publicar `reglas-firebase.txt` completo (Paso 2.3): hasta la versión del 20/09/2026 no tenía `promos` ni `comunicados`, y Firebase **niega en silencio** todo lo que no esté nombrado |
| Se ve "La app quedó a medio actualizar" | En el celular: cerrá la app del todo y volvé a abrirla; si sigue, borrala de la pantalla de inicio y reinstalala. En la computadora: recargá con Mayúsculas apretada |
| Los cambios no llegan a los celulares | Faltó `python3 version.py`, o no subiste `index.html` y `sw.js` |
| Los correos no salen | `CORREO.md`, sección "Dónde mirar si algo falla" |
| Se ven datos de demo | Estás entrando con `?local` en la dirección |

Y la lista completa de lo que hay que tener listo antes de octubre de 2026 está
en **`CAPACIDAD.md`**.
