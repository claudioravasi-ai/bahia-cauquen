# Bahía Cauquén — cómo pasar de la demo al barrio real

## Dónde está hoy

La app funciona completa, pero **los datos viven en el equipo donde se abre**
(localStorage + IndexedDB). Entre pestañas del mismo equipo se sincroniza en vivo
(así se prueba la garita en una pestaña y un vecino en otra). Para que la usen
las 80 casas a la vez hace falta un servidor. Mientras tanto:

- Las claves de demo están en `js/seed.js` (ADM-2026, GAR-2026, VEC-…).
- Lo privado (mensajes, reclamos, peticiones) se respeta **en pantalla**, no
  todavía en los datos: cualquiera que abra las herramientas del navegador de
  ese equipo lo vería. Eso lo resuelve el paso 1.

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

## 5. Vuelos en vivo

El listado de Aeropuertos Argentina se consulta directo; hoy responde vacío
desde afuera de su sitio, así que la app muestra los enlaces oficiales. Para los
**aviones en el aire sobre el barrio** (OpenSky) hace falta un Worker de
Cloudflare como el de NiJu:

```js
export default { async fetch() {
  const r = await fetch('https://opensky-network.org/api/states/all?lamin=-55.1&lomin=-68.8&lamax=-54.5&lomax=-67.8');
  return new Response(await r.text(), { headers: { 'content-type':'application/json', 'access-control-allow-origin':'*' } });
} };
```

Su URL va en Administración → Ajustes → Vuelos en vivo.

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
