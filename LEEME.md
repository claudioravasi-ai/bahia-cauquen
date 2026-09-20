# Barrio Bahía Cauquén — la app del barrio

PWA para los vecinos del barrio Bahía Cauquén (Los Ñires 3333, Ushuaia).
No hace falta instalar nada para desarrollarla: es HTML, CSS y JavaScript sin
compilar.

## Probarla en tu computadora

```bash
cd "Barrio Bahia Cauquen"
python3 -m http.server 8830
```

Y abrir http://localhost:8830.

Con la base conectada, agregando **`?local`** a la dirección
(`http://localhost:8830/?local`, o la de GitHub con `/?local`) la app trabaja
solo en ese equipo, con datos de prueba, sin tocar la base del barrio.

## Antes de subir a GitHub — SIEMPRE

```bash
python3 revisar.py     # busca nombres repetidos entre archivos
python3 version.py     # sella la versión en index.html y sw.js
```

**`revisar.py`** busca el error que rompe la app sin avisar: un `const` con el
mismo nombre en dos archivos. Como todos los `.js` comparten el mismo espacio
de nombres, el segundo archivo deja de ejecutarse entero y la app arranca, se
ve, pero media pantalla no responde. Es exactamente lo que se siente como
"no puedo entrar a ninguna ventana".

**`version.py`** le pone `?v=<fecha-hora>` a cada archivo. Sin eso, el
navegador y el service worker siguen usando los archivos viejos y queda una app
mitad nueva y mitad vieja durante días.

`revisar.py` comprueba además que la lista **`PIEZAS`** de `js/app.js` nombre
exactamente los `.js` que carga `index.html`. Esa lista es la que, al arrancar,
detecta que el equipo quedó con un `index.html` viejo —al que le falta algún
archivo— y repara la app sola: tira lo guardado, da de baja el service worker y
recarga una vez. Si agregás un `.js` nuevo, agregalo también a `PIEZAS`.

La persona también puede forzarlo desde **Tu cuenta → Actualizar la app**.

## Guías

| Archivo | Para qué |
|---|---|
| `PADRON.md` | Cargar la base de lotes y propietarios para las expensas |
| `CORREO.md` | Hacer que la app mande los mails, y mandarles circulares a los vecinos |
| `EXPENSAS.md` | Cómo funciona la liquidación por dentro |
| `CAPACIDAD.md` | Qué hace falta para que la usen los 152 lotes a la vez |
| `PUBLICAR.md` | Subirla a GitHub Pages |
| `CONECTAR.md` | Firebase, reglas y los servicios opcionales |

## Qué hay en cada carpeta

| Archivo / carpeta | Qué es |
|---|---|
| `index.html` | La página. Carga todo lo demás. |
| `css/app.css` | Todo el diseño. |
| `js/core.js` | Utilidades, datos, sesión, los dos modos (vecino / Administración), avisos, fotos y correo. |
| `js/calendario.js` | Feriados nacionales, provinciales y municipales, y el calendario católico y judío. **Se calculan, no se cargan a mano.** |
| `js/padron.js` | Los 152 lotes con su coeficiente. Sin nombres. |
| `js/seed.js` | Datos de muestra para probar sin conexión. |
| `js/clima.js` | Clima de Ushuaia y luz del día. |
| `js/v-inicio.js` | Portada, las cuatro secciones, garita, visitas, pases y bitácora. |
| `js/v-comunidad.js` | Pizarrón, chat, oficios, mascotas, compras. |
| `js/v-gestion.js` | Peticiones, reservas, reclamos, votaciones, normas, Ushuaia, residuos, vuelos, descargas, promociones del hotel, Mi casa. |
| `js/v-vecinos.js` | Directorio, mensajes entre vecinos, obras, viajes, infracciones, proveedores. |
| `js/v-expensas.js` | Expensas del vecino, contabilidad y cobranzas. |
| `js/admin.js` | Administración, padrón, circulares y el motor de automatizaciones. |
| `js/nube.js` | Sincronización con Firebase (las tres zonas de privacidad). |
| `js/firebase-config.js` | Las claves del proyecto de Firebase. Vacío = modo local. |
| `reglas-firebase.txt` | Las reglas de seguridad de la base. Sin esto, no hay privacidad. |
| `apps-script/Codigo.gs` | El programa que manda los correos desde Gmail. |
| `datos-privados/` | Padrón con nombres de propietarios. **No se sube a GitHub.** |

## Cómo está hecha

- Sin framework ni compilación: se edita y se recarga.
- **Navegación por pila de ventanas**, como ASHA: sin menú. Las ventanas de
  atrás quedan como lomos en el lateral izquierdo, cada ventana apilada tiene
  su flecha de volver, y en el celular se vuelve deslizando desde el borde.
- **Dos brazos para quien administra**: al entrar elige si mira como vecino o
  como Administración, y cambia cuando quiere. Los vecinos y la guardia ni ven
  la opción.
- Las fotos viven en el equipo de cada uno (IndexedDB); a la base solo va una
  miniatura de 48 px.
- **22 reglas automáticas** que corren solas: clima, recolección, temporadas,
  feriados, el calendario completo de las expensas y la privacidad de los datos.
- Modo día y modo noche: en automático siguen la salida y la puesta del sol en
  Ushuaia, no el reloj ni el ajuste del sistema.

## Si un equipo quedó a medio actualizar

Abrir **`/limpiar.html`** (por ejemplo `http://localhost:8830/limpiar.html`, o
la dirección de GitHub con `/limpiar.html`). Esa página da de baja el service
worker y borra el programa guardado; los datos del barrio no se tocan, viven en
la nube. Es la misma reparación que hace *Tu cuenta → Actualizar la app*, pero
funciona aunque la app esté tan rota que no se pueda ni entrar.

**El puerto de pruebas es el 8830, no el 8820.** El 8820 quedó con un service
worker viejo registrado de versiones anteriores: `localhost` es un mismo sitio
para el navegador, así que lo que se guardó ahí una vez se sigue usando aunque
cambies los archivos de la carpeta. Cambiar de puerto es empezar limpio.
