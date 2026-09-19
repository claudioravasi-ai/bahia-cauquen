# Cómo ponerla en funcionamiento, paso a paso

Todo a mano, sin instalar nada. **El orden importa**: cada paso usa algo del
anterior. Tiempo total la primera vez: entre 60 y 90 minutos.

| # | Paso | Cuánto | ¿Se puede saltear? |
|---|------|--------|--------------------|
| 0 | Probarla en tu computadora | 5 min | **No** |
| 1 | GitHub: publicarla en internet | 20 min | No, si la van a usar desde el celular |
| 2 | Firebase: la base compartida | 20 min | Solo si la usás en un equipo |
| 3 | Firebase: las reglas | 10 min | **Nunca** |
| 4 | Tu cuenta de Administración y la de la garita | 10 min | No |
| 5 | Importar el padrón de propietarios | 5 min | No |
| 6 | Apps Script: los correos | 15 min | Sí (los correos quedan para mandar a mano) |
| 7 | Invitar a los vecinos | — | No, o no la usa nadie |

---

## PASO 0 — Probala primero

```bash
cd "/Users/claudioravasi/Desktop/Barrio Bahia Cauquen"
python3 -m http.server 8820
```

Abrí http://localhost:8820 y entrá con los botones de demo (Claudio, Lucía,
la guardia, la Administración). Recorrela hasta entender cómo funciona.
**Recién después configurá lo demás.**

---

## PASO 1 — GitHub

Va primero porque Firebase necesita saber la dirección de la app para
autorizarla, y los correos llevan ese enlace adentro.

### 1.1 Crear el repositorio

1. Entrá a github.com con tu cuenta y tocá **New repository**.
2. Nombre: `bahia-cauquen`.
3. **Público** (GitHub Pages gratis solo publica repositorios públicos).
4. No tildes nada más. **Create repository**.

> Que sea público no expone al barrio: lo que se publica es el programa, no los
> datos. Los datos viven en Firebase, protegidos por las reglas del paso 3.
> Por eso **nunca** se sube la carpeta `datos-privados/`.

### 1.2 Subir los archivos

En la página del repositorio vacío: **uploading an existing file**, y arrastrás
esto (respetando las carpetas):

```
index.html
manifest.webmanifest
sw.js
LEEME.md   PUBLICAR.md   CONECTAR.md   reglas-firebase.txt
css/app.css
js/   (todos los .js: core, padron, seed, clima, icons, agenda,
       v-inicio, v-comunidad, v-gestion, v-vecinos, admin, nube,
       firebase-config, app)
img/portada-dia.jpg   img/portada-noche.jpg
icons/icon.svg   icons/icon-192.png   icons/icon-512.png
apps-script/Codigo.gs
.gitignore
```

**NO subir:**

- `datos-privados/` — el padrón con nombres de propietarios.
- Los PDF de expensas.
- `Foto diurna.jpg` y `Foto nocturna.jpeg` sueltos (ya están en `img/`).
- `barrio.html` es opcional: es la versión vieja, sirve de respaldo.

Escribí abajo "Primera versión" y tocá **Commit changes**.

### 1.3 Encender GitHub Pages

1. En el repositorio: **Settings** → **Pages**.
2. En *Source* elegí **Deploy from a branch**; rama `main`, carpeta `/ (root)`.
3. **Save**. A los dos o tres minutos aparece arriba la dirección:

```
https://TUUSUARIO.github.io/bahia-cauquen/
```

Abrila en el celular. Tiene que verse la pantalla de bienvenida.
**Anotá esa dirección: la vas a usar en los pasos 2 y 6.**

> Cada vez que cambies algo, subís el archivo de nuevo (Add file → Upload
> files, o editándolo con el lápiz) y Pages se actualiza solo en un par de
> minutos.

---

## PASO 2 — Firebase: la base compartida

### 2.1 Crear el proyecto

1. console.firebase.google.com → **Crear un proyecto** → nombre
   `bahia-cauquen`. Google Analytics: no hace falta.
2. **Compilación → Realtime Database → Crear base de datos**.
   Región: la de South America. Empezá en **modo bloqueado** (las reglas las
   ponemos en el paso 3).
3. **Compilación → Authentication → Comenzar** → habilitá
   **Correo electrónico / contraseña**.

### 2.2 Autorizar la dirección de la app

En **Authentication → Settings → Dominios autorizados**, agregá
`TUUSUARIO.github.io`. Sin esto, nadie puede entrar desde el celular.

### 2.3 Copiar las claves a la app

1. Engranaje (arriba a la izquierda) → **Configuración del proyecto**.
2. Bajá hasta **Tus apps** → ícono **`</>`** → registrá la app
   (nombre: `Bahía Cauquén`) → copiá el objeto `firebaseConfig`.
3. Abrí `js/firebase-config.js` y pegá esos valores entre las comillas.
   Se completan los siete campos, incluido `databaseURL`.
4. Subí ese archivo a GitHub (Add file → Upload files, o el lápiz para editarlo
   directo en la web).

> En cuanto `databaseURL` deja de estar vacío, la app cambia sola de modo: los
> botones de demo desaparecen y la entrada pasa a pedir email y contraseña.

---

## PASO 3 — Las reglas de seguridad

**Este paso no se saltea.** Sin reglas, cualquiera que abra la dirección puede
leer todo el barrio.

1. Abrí `reglas-firebase.txt`.
2. Copiá el bloque que está entre "PEGAR DESDE ACÁ" y "HASTA ACÁ".
3. En Firebase: **Realtime Database → pestaña Reglas** → borrá todo y pegá →
   **Publicar**.
4. Probá lo que explica ese mismo archivo al final: desde la cuenta de un
   vecino, leer `/privado` tiene que decir BLOQUEADO.

---

## PASO 4 — Tu cuenta y la de la garita

**La primera cuenta que se crea queda como Administración.** Es la única vez
que pasa: creala vos, ya, antes de pasarle la dirección a nadie.

1. Abrí la app publicada → **Soy vecino nuevo**.
2. Completá tus datos, elegí **Lote 148** y tu contraseña.
3. Al terminar dice "Primera cuenta del barrio: quedás como Administración".
4. Entrá y andá a **Administración → Vecinos → Dar de alta guardia o
   administrador** y creá:
   - la cuenta de la **garita** (rol guardia) — el email puede ser
     `garita@bahiacauquen...`, la usan todos los turnos;
   - la cuenta de **Paula** (la administradora), rol admin.
5. En **Administración → Ajustes** cargá el teléfono de la garita, el de la
   Administración y dónde está el desfibrilador.

---

## PASO 5 — El padrón de propietarios

1. Entrá como Administración → **Vecinos** → **Importar el padrón de
   propietarios**.
2. Elegí `datos-privados/padron-agosto-2026.json`.
3. Queda cargado: 152 unidades (142 de vecinos, 6 del hotel y 4 de las
   cabañas) con su coeficiente de prorrateo.

A partir de ahí, cuando alguien se inscribe elige su lote de la lista y vos ves
el nombre del propietario registrado para comparar antes de aprobar.

---

## PASO 6 — Los correos (Apps Script)

Sirve para que la app mande sola el correo de inscripción y el aviso de
aprobación. Sin esto la app funciona igual: los correos quedan en
**Administración → Correos** para mandarlos a mano.

1. Entrá a script.google.com **con la cuenta de Gmail de la Administración**
   (`barriobahiacauquen@gmail.com`): los correos salen de esa casilla.
2. **Proyecto nuevo** → borrá lo que haya → pegá todo `apps-script/Codigo.gs`.
3. Cambiá `CLAVE_COMPARTIDA` por una frase larga tuya.
4. **Implementar → Nueva implementación → Aplicación web**
   - Ejecutar como: **Yo**
   - Quién tiene acceso: **Cualquier persona**
5. Copiá la URL que termina en `/exec`.
6. En la app: **Administración → Ajustes → Correo** → pegá la URL y la misma
   frase → Guardar.
7. Probá aprobando una inscripción: tiene que llegar el correo.

---

## PASO 7 — Invitar a los vecinos

Mandá al grupo del barrio algo así:

> Vecinos: ya está la app del barrio. Se abre en el celular desde
> https://TUUSUARIO.github.io/bahia-cauquen/ — se inscriben con su DNI, su
> email y el número de lote, y la Administración los habilita.
> Para tenerla como una app más: en Android, menú del navegador → "Agregar a
> la pantalla principal"; en iPhone, Compartir → "Agregar a inicio".

---

## Después: qué revisar

- **Copia de seguridad**: Administración → Datos → Descargar copia, una vez por
  mes.
- **Auditoría**: queda registro de altas, bajas, peticiones firmadas y cambios.
- **Lo legal**: está la lista en CONECTAR.md (inscripción de la base ante la
  AAIP, política de privacidad, reglamento aprobado en asamblea).

## Si algo no anda

| Qué pasa | Por qué suele ser |
|---|---|
| "No se pudo guardar en la nube" | Las reglas no están publicadas, o la cuenta todavía no está aprobada. |
| No puedo entrar desde el celular | Falta agregar `TUUSUARIO.github.io` en Authentication → Dominios autorizados. |
| Se ve la versión vieja | Es el service worker: cerrá la app y volvé a abrirla; en la computadora, Ctrl+Shift+R. |
| No llegan los correos | Revisá la URL `/exec` y que la frase sea igual en los dos lados. |
| Un vecino no aparece en el padrón | El padrón se importa una sola vez; si cambió un propietario, editalo en Administración → Contenido. |
