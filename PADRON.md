# Cargar la base de lotes para las expensas — paso a paso

Esto se hace **una sola vez**. Después se actualiza cuando cambia un
propietario, se corrige un correo o se suma un teléfono.

La app ya conoce los **152 lotes con su coeficiente** (están en
`js/padron.js`, salen de la liquidación de agosto de 2026 y suman 100 %
exacto). Lo que falta cargar es **de quién es cada lote**: nombre, DNI,
dirección, correo y teléfono. Eso es el *padrón*.

> Los nombres y los datos de contacto **no están en GitHub**. Viven en la base
> privada del barrio, que solo leen las cuentas aprobadas.

---

## Antes de empezar

- Entrá con tu cuenta de **Administración**.
- Si sos administrador y además vecino, la app te pregunta desde dónde entrás:
  elegí **Como Administración**. (Podés cambiar cuando quieras con el botón
  *Admin / Vecino* de arriba a la derecha.)

---

## Paso 1 — Abrir el padrón

**Inicio → Gestión del barrio → Padrón.**

También se llega por **Administración → Vecinos → Padrón de propietarios**.

La primera vez la ventana está vacía y ofrece dos botones. Empezá por el
segundo: **Bajar el modelo de planilla**.

## Paso 2 — Bajar el modelo

El botón descarga `modelo-padron-bahia-cauquen.csv`, que ya viene con **los 152
lotes, su UF y su coeficiente**, y las columnas vacías para completar.

Las columnas son estas, y ese es el orden:

| Columna | Qué va | ¿Obligatoria? |
|---|---|---|
| `uf` | Unidad funcional (000, 001, …, 133A) | ya viene |
| `lote` | Número de lote | **sí** |
| `propietario` | Apellido y nombre, o la razón social | recomendado |
| `dni` | DNI o CUIT, sin puntos | opcional |
| `direccion` | Dirección dentro del barrio (calle y número) | opcional |
| `email` | Correo del propietario | recomendado |
| `tel` | Teléfono o WhatsApp | opcional |
| `coef` | Coeficiente de expensas (%) | ya viene |
| `deuda` | Saldo anterior, si arrastra deuda | opcional |

**El correo es lo más valioso**: con él la app puede mandarle el cupón de
expensas, avisarle el vencimiento e invitarlo a instalarse la app.

## Paso 3 — Completarla en Excel

Abrí el CSV con Excel (o Numbers, o Google Sheets) y completá las columnas.

Podés pegar desde la planilla que te pasó la administración anterior: lo
único que tiene que coincidir es el **número de lote**.

> Si ya tenés un Excel propio con otros nombres de columna, **no hace falta
> renombrarlo**. La app reconoce las variantes más comunes: *titular*,
> *apellido y nombre*, *domicilio*, *calle*, *correo*, *e-mail*, *celular*,
> *teléfono*, *coeficiente*, *porcentaje*, *saldo*… y encuentra sola la fila de
> encabezados aunque arriba haya un título o un logo.

## Paso 4 — Guardarla como CSV

En Excel: **Archivo → Guardar como → CSV UTF-8 (delimitado por comas)**.

No importa si tu Excel usa `;` en vez de `,`: la app se da cuenta sola.

## Paso 5 — Subirla

Volvé a **Padrón** y tocá **Cargar el padrón**. Elegí el archivo.

La app responde al instante con cuántas unidades cargó y cuántas quedaron sin
propietario. Si algo no cuadra, te dice qué columna no encontró y no toca nada.

> **Actualizar no borra.** Si más adelante subís una planilla que no trae los
> teléfonos, los teléfonos que ya estaban se conservan. Solo se pisa lo que la
> planilla nueva trae con contenido.

## Paso 6 — Buscar

Ya podés buscar en la barra de arriba, y sirve cualquier cosa:

- **apellido o nombre** → `Ravasi`, `perez`
- **lote** → `Lote 42`, o simplemente `42`
- **UF** → `133A`
- **calle o dirección** → `Los Ñires`, `calle 3`
- **DNI o CUIT** → `27123456`
- **correo o teléfono** → `@gmail`, `2901`

Se pueden combinar: `perez ñires` busca las dos cosas a la vez. No importan
los acentos ni las mayúsculas.

Cada resultado muestra de un vistazo si ese lote **ya tiene cuenta en la app** y
si **debe expensas**. Tocándolo se abre la ficha, con:

- los datos del propietario y su coeficiente,
- el **saldo de expensas** y el acceso a la cuenta corriente del lote,
- el **certificado de deuda** (art. 2048 CCyC, título ejecutivo), si debe,
- **Invitarlo a la app** por correo, si todavía no tiene cuenta,
- **Editar**, para corregir cualquier dato a mano.

## Paso 7 — Guardar una copia

Cuando esté completo, **Descargar el padrón (CSV)** te devuelve la planilla
prolija. Guardala: es la copia de seguridad del dato más difícil de recuperar.

---

## Cómo se usa el padrón en el resto de la app

| Dónde | Para qué |
|---|---|
| **Expensas y cobranzas → Morosos** | muestra el nombre del propietario al lado del lote |
| **Certificado de deuda** | sale con el nombre del titular, como corresponde |
| **Cupones por correo** | usa el `email` de cada lote |
| **Invitaciones** | manda el enlace de inscripción al propietario |
| **Inscripciones** | al aprobar a un vecino se ve si el lote que eligió coincide con el padrón |

---

## Preguntas que suelen aparecer

**¿Y si un lote tiene dos dueños?**
Poné los dos en `propietario` separados por coma. Cada persona puede tener su
propia cuenta en la app; el **voto y la expensa siguen siendo del lote**.

**¿Y si el propietario alquila?**
El padrón es del propietario. El inquilino se inscribe como vecino del mismo
lote y la Administración lo aprueba. Las expensas se le muestran al lote.

**¿Puedo cargarlo a mano, sin planilla?**
Sí: en la ficha de cada lote está **Editar**. Para 152 lotes conviene la
planilla, pero para corregir dos o tres, a mano es más rápido.

**¿Los vecinos ven el padrón?**
No. La ventana Padrón es solo de la Administración. Los vecinos tienen el
directorio (*Vecinos*), donde cada uno decide si comparte su profesión, su
teléfono y su dirección.
