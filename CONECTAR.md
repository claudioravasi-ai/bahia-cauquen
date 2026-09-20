# Barrio Bahía Cauquén — conectar la app con el barrio

## Dónde está hoy

**Firebase ya está conectado.** Las claves del proyecto `bahia-cauquen` están
en `js/firebase-config.js` y la sincronización vive en `js/nube.js`, con las
tres zonas de privacidad (`/barrio`, `/privado/<uid>`, `/staff`).

Lo que falta confirmar antes de que entre todo el barrio está en
**`CAPACIDAD.md`**, y hay un punto que no se puede postergar: **el plan Spark
(gratis) solo acepta 100 conexiones simultáneas** y el barrio tiene 152 lotes.
Hay que pasar a Blaze.

Con **`?local`** en la dirección, la app trabaja solo en ese equipo con datos de
prueba y no toca la base del barrio. Sirve para probar cambios sin ensuciar
nada; para probar de verdad la identidad y los permisos, hay que entrar **sin**
`?local`.

## Guías aparte

- **`PADRON.md`** — cargar los lotes y propietarios para las expensas.
- **`CORREO.md`** — que la app mande mails y circulares.
- **`CAPACIDAD.md`** — que la usen los 152 lotes a la vez.

## Servicios de afuera que la app usa

| Qué | De dónde sale | ¿Hace falta configurar algo? |
|---|---|---|
| Clima de Ushuaia | Open-Meteo | No. Es gratis y sin clave. |
| Arribos y partidas | Tablero de London Supply | No. Se lee directo. |
| Aviones en vivo sobre el barrio | ADS-B | Sí, un Worker propio (Ajustes → Vuelos). Opcional. |
| Recaladas de cruceros | Las carga la Administración | Contenido → Recaladas |
| Promociones del Hotel Los Cauquenes | Las carga la Administración | Contenido → Promociones. Con un Worker propio se leen solas (Ajustes → Promociones). |
| Feriados y calendario religioso | **Se calculan** en `js/calendario.js` | Solo lo provincial, lo municipal y los puentes |
| Correo | Google Apps Script | Sí, ver `CORREO.md` |

### El formato que tiene que devolver el lector de promociones

Si algún día se hace el Worker que lee la web del hotel, tiene que devolver
esto (la app entiende también `title`, `description`, `discount` y `link`):

```json
{ "promociones": [
  { "titulo": "Cena de los viernes",
    "detalle": "Menú de tres pasos con productos fueguinos",
    "descuento": "20 %",
    "desde": "2026-09-01", "hasta": "2026-10-15",
    "url": "https://…" }
] }
```

---

## Notas de la migración original (referencia)

## 1. Servidor: Firebase (el mismo camino que HRU, AFAAR y ASHA)

- **Authentication** con email y contraseña. La clave VEC-XXXX pasa a ser la
  contraseña inicial y el vecino la cambia. Nada anónimo (lección de HRU).
- **Firestore**, una colección por cada lista de `Store.s`. Reglas por rol:
  - `privados`, `dms`: solo los dos participantes (y la Administración en `privados`).
  - `reclamos`: autor + Administración; los `publico:true`, todos.
  - `pases`, `peticiones`: el vecino dueño + guardia + Administración.
  - `auditoria`: solo se agrega, nadie edita ni borra.
  - `posts`, `msgs` (pizarrón y chat): todos los vecinos aprobados.
- En el código, se reemplaza `Store.guardar/cargar` por lecturas y escrituras
  por colección. El resto de la app no cambia: todo pasa por `Store.cambiar()`.
- **Fotos**: siguen viviendo en cada equipo (IndexedDB). Para que las vea otro
  vecino, `Fotos.relevo` las pasa por Firebase Storage como un envío que se
  borra solo a las 48 h: cada equipo la baja una vez y la guarda. La base
  compartida nunca guarda fotos.

## 2. Avisos con la app cerrada

Firebase Cloud Messaging + el `sw.js` que ya está. Hoy el sonido y la
campanita funcionan mientras la app está abierta en alguna pestaña.

## 3. El motor de automatizaciones en el servidor

Las 17 reglas de `js/admin.js` y `js/v-vecinos.js` (`REGLAS`) hoy corren en el equipo que tenga la
app abierta. En Cloud Functions programadas (cada 5 minutos) corren siempre,
con el mismo código y las mismas marcas anti-duplicado (`motorLog`).

## 4. Correo (listo para activar)

`apps-script/Codigo.gs`, igual que en ASHA. Se pega en script.google.com con la
cuenta de la Administración, se implementa como aplicación web y la URL y la
frase van en Administración → Ajustes → Correo. Manda: confirmación de
inscripción con enlace de seguimiento, aviso a la Administración y la clave al
aprobar.

## 5. Vuelos y cruceros

**Arribos y partidas: ya funcionan, sin configurar nada.** El aeropuerto de
Ushuaia no es de Aeropuertos Argentina (esa API nunca va a devolver vuelos de
USH: el aeropuerto lo opera London Supply). El tablero bueno es este, y deja
que la app lo lea directo porque responde con `access-control-allow-origin: *`:

- `https://flightstats.londonsupplygroup.com/arribos-USH`
- `https://flightstats.londonsupplygroup.com/partidas-USH`

La app lee esas dos páginas, las decodifica en iso-8859-1 y saca de cada fila
la aerolínea, el vuelo, el origen o destino, el horario, la estima, el estado y
la puerta. Si alguna vez cambian el diseño de esa página hay que tocar
`Vuelos.fila()` en `js/v-gestion.js`.

**Aviones en vivo (opcional).** Para ver los aviones que están en el aire sobre
el barrio sí hace falta un servidor propio: los servicios de ADS-B (OpenSky,
adsb.lol, adsb.fi) no dejan que una página los consulte directo. Ojo que hoy
casi no hay antenas que cubran Tierra del Fuego, así que lo más probable es que
la lista venga vacía aunque el Worker ande. Un Worker de Cloudflare, como el de
NiJu, alcanza y es gratis.

Su URL va en **Administración → Ajustes → Aviones en vivo**. La app le agrega
`?apt=USH` y espera una respuesta así:

```json
{ "states": [...] }
```

Worker mínimo:

```js
export default {
  async fetch(request) {
    const cors = { 'content-type':'application/json', 'access-control-allow-origin':'*' };
    const salida = { states: [] };
    try {
      const r = await fetch('https://api.adsb.lol/v2/lat/-54.84/lon/-68.30/dist/60');
      const j = await r.json();
      salida.states = (j.ac || []).map(a => ({
        callsign: (a.flight || '').trim(),
        alt: Math.round((a.alt_baro || 0) * 0.3048),
        vel: Math.round((a.gs || 0) * 1.852),
        suelo: a.alt_baro === 'ground'
      }));
    } catch (e) {}
    return new Response(JSON.stringify(salida), { headers: cors });
  }
};
```

**El avión que cruza la pantalla.** Cuando un vuelo pasa por arriba del barrio,
la app cruza un avión por la pantalla con el número de vuelo. Sin Worker se
calcula con el tablero (los que llegan pasan entre 5 y 1 minuto antes de
aterrizar; los que salen, entre 1 y 5 minutos después de despegar). Con Worker
manda el avión de verdad. Cada vecino lo puede apagar desde la ventana de
Vuelos.

**Cruceros.** El puerto no publica un servicio para consultar. El calendario de
recaladas se carga desde **Administración → Contenido → Recaladas de cruceros**
(fecha, barco, horario, pasajeros y muelle) y la app lo muestra en la portada,
en "Ushuaia hoy". Si algún día hay una fuente, el mismo Worker puede traerla.

## 6. Conectividad de vanguardia (opciones, de menor a mayor obra)

| Idea | Qué hace | Qué hace falta |
|---|---|---|
| Pases y avisos por **WhatsApp** | La visita recibe el QR por WhatsApp y el vecino aprueba respondiendo "1" | WhatsApp Business API (Meta o Twilio) |
| **Calendario del barrio** | Reservas, eventos, recolección y feriados en Google/Apple Calendar | Un enlace .ics que genera el servidor |
| **Asistente con IA** | Responde dudas del reglamento, resume la bitácora del turno, clasifica reclamos y redacta comunicados | Claude API detrás de una Cloud Function |
| **Cobros con Mercado Pago** | Seña del quincho, multas firmes, compras conjuntas | Cuenta de MP del consorcio |
| **Portón conectado** | La garita abre al validar el QR; el vecino abre su portón desde el celular al llegar (geocerca) | Relé WiFi (Shelly/ESP32) en la barrera |
| **Lectura de patentes (LPR)** | Abre solo para autos de vecinos y pases del día; alarma con patentes con restricción | Cámara en el acceso + software LPR |
| **Botón SOS físico** | Llavero para adultos mayores que dispara el mismo SOS | Botón Bluetooth (tipo Flic) vinculado al celular |
| **Estación meteorológica propia** | Viento y temperatura reales de la bahía, no de la ciudad | Estación WiFi con API (Ecowitt, Davis) |
| **Sensor del tanque de agua** | Aviso automático antes de que se corte | Sensor de nivel + ESP32 |
| **Luminarias que avisan** | Se reporta sola la que se apaga | Nodos en los postes |
| **Pantalla en la garita** | Esperados, SOS y restricciones siempre a la vista | Una TV con la app en modo kiosco |

## 7. Lista legal antes de lanzar

- Inscribir la base de datos en el Registro Nacional de Bases de Datos (AAIP), Ley 25.326.
- Política de privacidad y términos de uso visibles en la app.
- Reglamento de convivencia (hay un modelo en Normas) revisado por un abogado y aprobado en asamblea.
- Cartel de zona videovigilada si se suman cámaras.
- Confirmar cada año las fechas de temporadas, feriados provinciales y cubiertas con clavos (se editan en Administración → Contenido).
