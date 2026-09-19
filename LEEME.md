# Bahía Cauquén — la app del barrio

PWA para los vecinos del barrio Bahía Cauquén (Los Ñires 3333, Ushuaia).
No necesita instalar nada para desarrollarla: es HTML, CSS y JavaScript sin compilar.

## Probarla en tu computadora

```bash
cd "Barrio Bahia Cauquen"
python3 -m http.server 8820
```

Y abrir http://localhost:8820. Para conectarla al barrio de verdad, seguí **PUBLICAR.md**.

## Qué hay en cada carpeta

| Archivo / carpeta | Qué es |
|---|---|
| `index.html` | La página. Carga todo lo demás. |
| `css/app.css` | Todo el diseño. |
| `js/core.js` | Utilidades, datos, sesión, avisos, fotos y correo. |
| `js/padron.js` | Los 152 lotes con su coeficiente de expensas. Sin nombres. |
| `js/seed.js` | Datos de muestra para probar sin conexión. |
| `js/clima.js` | Clima de Ushuaia y luz del día. |
| `js/v-inicio.js` | Inicio, garita, visitas, pases y bitácora. |
| `js/v-comunidad.js` | Pizarrón, chat, oficios, mascotas, compras. |
| `js/v-gestion.js` | Peticiones firmadas, reservas, reclamos, votaciones, expensas, normas, Ushuaia, vuelos, Mi casa. |
| `js/v-vecinos.js` | Directorio, mensajes entre vecinos, obras, viajes, infracciones, proveedores. |
| `js/admin.js` | Administración y el motor de automatizaciones. |
| `js/nube.js` | Sincronización con Firebase (las tres zonas de privacidad). |
| `js/firebase-config.js` | Las claves del proyecto de Firebase. Vacío = modo local. |
| `reglas-firebase.txt` | Las reglas de seguridad de la base. Sin esto, no hay privacidad. |
| `apps-script/Codigo.gs` | El programa que manda los correos desde Gmail. |
| `datos-privados/` | Padrón con nombres de propietarios. **No se sube a GitHub.** |
| `barrio.html` | La primera versión de la app. Se deja como respaldo. |

## Cómo está hecha

- Sin framework ni compilación: se edita y se recarga.
- Navegación por pila de ventanas (como ASHA): sin menú, con lomos a la izquierda.
- Las fotos viven en el equipo de cada uno (IndexedDB); a la base solo va una miniatura.
- Un motor de automatizaciones (17 reglas) que corre solo: clima, recolección,
  temporadas, recordatorios, privacidad de datos.
