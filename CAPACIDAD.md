# Que la usen los 150 lotes a la vez — qué hay que mirar

La app está escrita para eso, pero hay **un límite del plan gratuito de Firebase
que hay que resolver antes de octubre de 2026**. Lo escribo acá para que no
aparezca el primer día con todo el barrio adentro.

---

## 1. El límite de conexiones simultáneas — HAY QUE ACTUAR

La Realtime Database de Firebase, en el **plan Spark (gratis)**, acepta
**100 conexiones simultáneas**. La conexión 101 es rechazada: esa persona ve la
app pero no le llegan los datos.

El barrio tiene 152 lotes. Si cada casa abre la app en un teléfono, ya son
más de 100. Y muchos van a tenerla abierta en el teléfono **y** en la
computadora.

**Qué hay que hacer:** pasar el proyecto al **plan Blaze** (pago por uso) en
la consola de Firebase. Con el tamaño de este barrio el costo real es de
centavos por mes, y muchas veces cae dentro del tramo gratuito que Blaze
mantiene; lo que cambia es que **desaparece el tope de 100 conexiones**.

> Blaze pide tarjeta. Conviene poner una **alerta de presupuesto** (por
> ejemplo, avisar a los 5 dólares) para dormir tranquilo.

Sin este cambio, la app va a funcionar bien hasta la casa número 100 y después
va a empezar a fallar de a ratos, sin mensaje de error claro. Es el punto más
importante de esta lista.

---

## 2. Lo que la guardia y la Administración descargan

Hoy, cuando entra una cuenta de guardia o de Administración, la app se suscribe
a **toda la carpeta `/privado`** (`escucharPrivadoTodos` en `js/nube.js`): los
pases, reclamos, peticiones, mensajes y avisos de los 152 lotes, y se queda
escuchando cualquier cambio.

Con el barrio chico no se nota. Con 152 lotes y años de historial, cada vez que
la guardia abre la app se baja todo eso de nuevo.

**Cuándo hay que cambiarlo:** cuando la app tarde en abrir en la garita.
**Cómo:** suscribirse por rango de fecha (`orderByChild('at').startAt(...)`) en
vez de a la carpeta entera, y traer el historial viejo solo cuando alguien lo
pide. No hace falta tocar el resto de la app.

---

## 3. Lo que ya está resuelto

- **Los dibujos de pantalla.** Al conectar llegan más de veinte colecciones casi
  juntas. Antes cada una redibujaba la ventana entera: la app se arrastraba
  varios segundos y los botones no respondían. Ahora se juntan en un solo
  dibujo por cuadro (`refrescarPronto`, `Nube.llegoAlgo`).
- **Las fotos no viajan por la base.** Cada foto vive en el equipo de quien la
  sacó (IndexedDB) y a la base solo va una miniatura de 48 px, de uno o dos
  kilobytes. Con 152 casas subiendo fotos, esto es la diferencia entre unos
  megabytes y varios gigabytes.
- **Las versiones viejas.** `python3 version.py` le pone una marca a cada
  archivo, así una actualización llega a todos los equipos enseguida en lugar de
  quedar mitad vieja y mitad nueva. **Correlo siempre antes de subir a GitHub.**
- **El tope de correos.** Gmail deja mandar unos 100 por día. Los envíos a todo
  el barrio salen de a diez con una pausa, y la pantalla avisa antes si son
  más de 80. Ver `CORREO.md`.

---

## 4. Antes de octubre de 2026 — lista corta

- [ ] **Pasar el proyecto de Firebase a plan Blaze** y poner alerta de presupuesto.
- [ ] Publicar las reglas de `reglas-firebase.txt` y **probar entrando sin `?local`**.
- [ ] Cargar el padrón con los correos de los 152 lotes (`PADRON.md`).
- [ ] Configurar el envío de correo (`CORREO.md`) y mandar uno de prueba.
- [ ] Confirmar los feriados provinciales y municipales, y los puentes del año
      (Administración → Contenido → Feriados): la app los muestra "a confirmar"
      hasta que alguien los revise.
- [ ] Probar el SOS desde un teléfono con la garita abierta en otro equipo.
- [ ] Hacer una prueba con veinte vecinos reales antes de invitar a los 152.
