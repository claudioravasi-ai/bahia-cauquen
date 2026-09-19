/* =========================================================================
   CONFIGURACIÓN DE FIREBASE
   -------------------------------------------------------------------------
   Mientras esto esté vacío, la app funciona igual pero SOLO en este equipo
   (los datos no viajan a ningún lado). Completalo cuando quieras que la
   usen todos los vecinos. El paso a paso está en PUBLICAR.md.

   Resumen:
     1. console.firebase.google.com → crear el proyecto
     2. Compilación → Realtime Database → Crear (región South America)
     3. Compilación → Authentication → Comenzar → "Correo y contraseña"
     4. Engranaje → Configuración del proyecto → Tus apps → ícono </>
        → registrar la app → copiar el objeto de configuración
     5. Pegar esos valores acá abajo, respetando las comillas
     6. Pegar las reglas de reglas-firebase.txt en la consola y publicar

   SOBRE LA SEGURIDAD
   Estas claves viajan dentro de la página y son públicas por diseño: así
   funciona Firebase en el navegador. Lo que protege los datos del barrio NO
   es esconderlas, son las REGLAS. Sin las reglas aplicadas, cualquiera que
   conozca la dirección puede leer todo.
   ========================================================================= */
'use strict';

const FIREBASE = {
  apiKey: "",
  authDomain: "",
  databaseURL: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: ""
};
