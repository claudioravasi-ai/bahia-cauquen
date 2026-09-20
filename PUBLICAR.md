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
| 2 | Firebase: lo que falta | 20 min | **No** |
| 3 | Tu cuenta, la garita y Paula | 15 min | No |
| 4 | Cargar el padrón | 10 min | No |
| 5 | Apps Script: los correos | 20 min | Sí, pero quedan para mandar a mano |
| 6 | Ajustes del barrio y feriados | 15 min | Conviene que no |
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

### 1.2 Subir los archivos

En la página del repositorio vacío tocá **uploading an existing file** y
arrastrá esto, **respetando las carpetas**:

```
index.html          manifest.webmanifest     sw.js
revisar.py          version.py               .gitignore
reglas-firebase.txt

css/app.css

js/  → agenda.js  admin.js  app.js  calendario.js  clima.js  core.js
       firebase-config.js  icons.js  nube.js  padron.js  seed.js
       v-comunidad.js  v-expensas.js  v-gestion.js  v-inicio.js  v-vecinos.js

img/  → portada-dia.jpg   portada-noche.jpg
icons/ → logo.png  icon-192.png  icon-512.png  icon.svg
apps-script/ → Codigo.gs

LEEME.md  PUBLICAR.md  PADRON.md  CORREO.md  CAPACIDAD.md  CONECTAR.md  EXPENSAS.md
```

**NO subir nunca:**

- `datos-privados/` — el padrón con nombres de propietarios.
- Los PDF de expensas.
- La carpeta `Incial DeepSeek/` — es tu respaldo local, no hace falta arriba.
- Los dos archivos `.command` — son herramientas tuyas para esta computadora;
  arriba no hacen nada. (Si los subís igual tampoco pasa nada malo.)

Escribí abajo "Primera versión" y tocá **Commit changes**.

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

## 1.3 Encender GitHub Pages

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

## 2.1 Pasar a plan Blaze — esto no se puede saltear

El plan gratuito (**Spark**) acepta **100 conexiones simultáneas**. El barrio
tiene **152 lotes**, y muchos van a tener la app abierta en el teléfono y en la
computadora. A partir de la conexión 101, esa persona ve la app pero no le
llegan los datos, **sin mensaje de error claro**.

1. console.firebase.google.com → proyecto `bahia-cauquen`.
2. Abajo a la izquierda: **Actualizar** / **Upgrade** → plan **Blaze**.
3. Cargá una tarjeta y **poné una alerta de presupuesto** (por ejemplo, avisar
   a los 5 dólares).

Con el tamaño de este barrio el costo real es de centavos por mes, y buena
parte cae en el tramo gratuito que Blaze mantiene. Lo que cambia es que
**desaparece el tope de 100 conexiones**.

## 2.2 Autorizar la dirección de la app

**Authentication → Settings → Dominios autorizados** → **Agregar dominio**:

```
TUUSUARIO.github.io
```

Sin esto nadie puede entrar desde el celular, aunque la app cargue.

## 2.3 Confirmar que el acceso por correo está encendido

**Authentication → Sign-in method**: **Correo electrónico/contraseña** tiene
que estar **Habilitado**.

## 2.4 Publicar las reglas — esto tampoco se saltea

Sin reglas, cualquiera que conozca la dirección de la base lee todo el barrio.

1. Abrí `reglas-firebase.txt`.
2. Copiá el bloque entre **PEGAR DESDE ACÁ** y **HASTA ACÁ** (líneas 56 a 146).
3. Firebase → **Realtime Database** → pestaña **Reglas** → borrá todo lo que
   haya → pegá → **Publicar**.

## 2.5 Probar que las reglas andan

Esto es lo que separa "creo que está protegido" de "está protegido".

1. Entrá a la app publicada con una cuenta de **vecino** (no la de
   Administración).
2. Abrí la consola del navegador (F12 → Console) y pegá:

```js
firebase.database().ref('privado').get()
  .then(s => console.log(s.val()))
  .catch(e => console.log('BLOQUEADO', e.message))
```

3. **Tiene que decir BLOQUEADO.** Si muestra datos, las reglas no se
   publicaron: volvé al 2.4.

> Probá siempre **sin** `?local` en la dirección. Con `?local` la app ni toca
> Firebase, así que no estarías probando nada.

---

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

Doble clic en **`1 - Revisar y sellar.command`** y esperá a que diga "LISTO".

Y recién ahí subís los archivos que cambiaron **más `index.html` y `sw.js`**
(esos dos llevan la marca de versión: si no los subís, nadie recibe lo nuevo).

GitHub Pages se actualiza solo en un par de minutos.

---

# Si algo no anda

| Lo que pasa | Qué mirar |
|---|---|
| La app carga pero no se puede entrar | Paso 2.2: falta autorizar `TUUSUARIO.github.io` |
| Entra, pero no aparece nada del barrio | Paso 2.4: las reglas no están publicadas |
| Anda para unos y para otros no | Paso 2.1: el tope de 100 conexiones del plan Spark |
| Media pantalla no responde | Corré `python3 revisar.py`: hay un nombre repetido |
| Los cambios no llegan a los celulares | Faltó `python3 version.py`, o no subiste `index.html` y `sw.js` |
| Los correos no salen | `CORREO.md`, sección "Dónde mirar si algo falla" |
| Se ven datos de demo | Estás entrando con `?local` en la dirección |

Y la lista completa de lo que hay que tener listo antes de octubre de 2026 está
en **`CAPACIDAD.md`**.
