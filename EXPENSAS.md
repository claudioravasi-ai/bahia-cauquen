# Módulo de expensas propio — plan de trabajo

Objetivo: que el barrio liquide sus expensas con esta app y deje de depender de
un sistema privado. La base ya está: los **152 lotes con su coeficiente** salen
de la liquidación de agosto de 2026 y suman 100 % exacto.

**Estado: programado y funcionando** (19-09-2026), en `js/v-expensas.js`.
Se entra solo con cuenta de Administración: Inicio → Contabilidad.

---

## 1. Lo que ya tenemos

- Padrón de 152 unidades (142 vecinos, 6 del hotel, 4 de las cabañas) con UF,
  lote y coeficiente.
- Datos del consorcio: CUIT 30-71010005-1, domicilio Los Ñires 3333, CBU, alias
  `bahia.cauquen`, cuenta del Galicia.
- Roles, auditoría, avisos, correo y firma en pantalla.

## 2. Estructura contable (copiando el formato que ya usa el barrio)

**Rubros**, tal como están hoy en la liquidación:

| Nº | Rubro | Ejemplo de agosto |
|---|---|---|
| 3 | Servicios públicos | luz, gas, tasa municipal, relleno sanitario |
| 4 | Abono de servicios | vigilancia, cámaras, internet, administración, abogado |
| 5 | Mantenimiento de partes comunes | retro de nieve, pluviales, postes de luz |
| 7 | Gastos bancarios | |
| 10 | Seguros | póliza de responsabilidad civil |
| 11 | Otros | caja chica |
| 12 | Gastos particulares | lo que se le imputa a un lote puntual |

**Columnas de la liquidación** (cada gasto cae en una): Expensas · Mejoras ·
Multas, obleas y otros · Fondo de Infraestructura.

**Cómo se reparte cada columna:**

- *Expensas*: por coeficiente del lote.
- *Fondo de Infraestructura*: monto fijo por lote (hoy $5.000).
- *Gastos particulares*: al lote que corresponda, sin prorrateo.
- Debe poder definirse un **prorrateo especial** para un gasto puntual (por
  ejemplo, algo que solo usan los lotes de la parte alta).

## 3. Lo que ya hace la app

### a) Carga de gastos
Proveedor con CUIT, tipo y número de comprobante, período, importe, rubro,
columna, cuota ("pago 3 de 36"), fecha de pago y foto del comprobante (en el
equipo, como el resto de las fotos). Gastos en cuotas que se repiten solos.

### b) Ingresos y conciliación
Cobros por transferencia, pagos a cuenta, intereses cobrados. Importación del
extracto del Galicia (CSV) y conciliación semiautomática: la app propone a qué
lote corresponde cada transferencia y la Administración confirma.

### c) Cierre del mes
Un botón: toma los gastos del período, arma el prorrateo, calcula intereses de
los morosos, aplica el fondo fijo y el redondeo, y deja la liquidación armada
para revisar antes de emitir. Nada se emite sin revisión.

### d) Salidas
- **Liquidación del mes** en PDF, con el mismo formato que hoy: rubros,
  totales, porcentaje por categoría, estado financiero y patrimonial, y el
  prorrateo lote por lote.
- **Cupón por lote** en PDF, igual al actual: saldo anterior, pagos, deuda,
  intereses, conceptos, 1º y 2º vencimiento, CBU y alias.
- Envío automático por correo a cada propietario (con el Apps Script que ya
  está) y aviso en la app.
- Exportación a CSV/Excel para el contador.

### e) Estado de cuenta por lote
Saldo anterior, pagos recibidos, deuda, intereses, saldo a favor. Historial de
todos los períodos y de los comprobantes de pago que suba el vecino.

### f) Morosidad
Listado por antigüedad, intereses automáticos, planes de pago en cuotas y
**certificado de deuda** en PDF: es título ejecutivo, lo firma el administrador
y, si existe, el consejo de administración (art. 2048 CCyC). Con la firma en
pantalla que ya tiene la app.

### g) Presupuesto y fondos
Presupuesto anual por rubro, comparación mes a mes contra lo real, aviso cuando
un rubro se desvía. Saldo acumulado del Fondo de Infraestructura y en qué se
gastó.

### h) Libros y transparencia
Libro de administración cronológico (art. 2067 CCyC), actas de asamblea y la
aprobación de la liquidación por votación en la app.

### i) Lo que ve cada uno
- **Vecino**: su cupón, su estado de cuenta, el resumen del mes del barrio y en
  qué se gastó.
- **Consejo de administración**: todo, en modo lectura.
- **Administración**: todo, con edición y auditoría de cada cambio.

## 4. Orden de trabajo propuesto

1. Cargar el padrón y **los saldos de cierre de agosto 2026** (arranque).
2. Carga de gastos y rubros + cierre de mes con prorrateo.
3. Cupón y liquidación en PDF + envío.
4. Estado de cuenta, pagos y conciliación bancaria.
5. Morosidad, intereses y certificado de deuda.
6. Presupuesto, fondos y comparativos.

## 5. Decidido con Claudio (19-09-2026)

- **Alcance:** se lleva **en paralelo** unos meses. Se carga lo mismo acá y en
  Octavo Piso y se comparan los resultados hasta confiar en el propio. Recién
  ahí se corta el abono.
- **Transparencia:** el vecino ve **todo el detalle de gastos, con los
  comprobantes**. Es la forma de bajar las discusiones de asamblea.
- **Intereses:** configurables. Arrancamos con el recargo del 2º vencimiento
  (~1,5 %) hasta que Paula confirme la regla exacta que usa hoy.
- **Arranque:** solo con el **saldo de cierre del último mes**. Nada de migrar
  historia: de agosto 2026 en adelante, todo se lleva en la app.

## 6. Para definir con la Administración

- Tasa y forma de cálculo de los intereses por mora (hoy el 2º vencimiento es
  aproximadamente un 1,5 % sobre el 1º).
- Día de cierre del período y los dos vencimientos (hoy: 10 y 21).
- Quién firma el certificado de deuda además del administrador.
- Si el hotel y las cabañas mantienen el mismo tratamiento que un vecino.

## 7. Referencias miradas

- [Mis Expensas](https://misexpensas.com.ar/), [ExpensasFlow](https://expensasflow.com.ar/),
  [KM44](https://expensas.km44.com.ar/), [Mi Consorcio](https://www.miconsorcio.app/),
  [e-Consorcio](https://e-consorcio.com/): prorrateo por coeficiente, intereses
  automáticos, cupones, conciliación y recordatorios.
- [ConsorcioAbierto: pago de expensas](https://www.consorcioabierto.com/blog/2023/05/18/pago_de_expensas/)
  y [morosidad](https://www.consorcioabierto.com/blog/2023/05/29/morosidad-en-los-consorcios-seis-consejos/).
- [Art. 2067 CCyC](https://leyes-ar.com/codigo_civil_y_comercial/2067.htm) (libros y
  rendición) y [certificado de deuda](https://abogados.com.ar/codigo-civil-y-comercial-el-certificado-de-deuda-por-expensas-debe-ser-firmado-por-el-consejo-de-administracion-solo-cuando-este-exista/19216).


---

## 8. Cómo se usa, mes a mes

1. **Contabilidad → Gastos**: se carga cada factura (proveedor, CUIT, comprobante,
   rubro, columna, retenciones, cuota "3 de 36" y la foto del comprobante). Un
   gasto puede imputarse a un lote puntual: entonces no se prorratea.
2. **Contabilidad → Cierre de mes**: muestra cómo queda cada uno de los 152
   lotes y, al emitir, genera los cupones, avisa a los vecinos en la app y les
   manda el correo.
3. **Contabilidad → Cobranzas**: el vecino informa su pago con la foto del
   comprobante; la Administración lo confirma y la app emite el recibo
   numerado. También se puede registrar un pago a mano.
4. **Contabilidad → Morosos**: deuda por lote, cuenta corriente y certificado
   de deuda para imprimir (art. 2048 CCyC). El botón "Reclamar" manda el aviso
   y deja el mensaje en el canal privado de ese lote.
5. **Contabilidad → ARCA**: situación fiscal, presentaciones del mes con sus
   vencimientos, retenciones practicadas y la planilla CSV para el contador.

El vecino, en **Expensas**, ve su saldo, sus cupones, sus movimientos, sus
recibos, y paga por transferencia (alias y CBU listos para copiar) o informa lo
que ya pagó.

## 9. Automatizaciones que quedaron andando

- Día 5: si no se cerró el mes anterior, se le avisa a la Administración.
- Tres días antes del vencimiento: aviso a todos.
- El día del primer vencimiento: aviso a los que deben, con el recargo que viene.
- Un día después del segundo: aviso de mora, con intereses corriendo.
- Cinco días antes de cada presentación de ARCA: aviso a la Administración.
- Las multas firmes se cargan solas en la liquidación del mes siguiente.

## 10. Expensas automáticas (desde el 24-09-2026)

**Dónde:** Gestión → Expensas y cobranzas → pestaña **Automáticas** (la primera).

**Punto de partida, una sola vez:** *Traer la liquidación de agosto* con el archivo
`datos-privados/liquidacion-agosto-2026.json` (no está en GitHub). Trae:

- los 27 gastos de agosto con proveedor, CUIT, comprobante y cuotas (total $ 49.781.720,42, igual al PDF);
- el banco (saldo al cierre $ 18.352.576,55) y el patrimonio (deudas e intereses a cobrar $ 46.341.751,19);
- el estado de cuenta de los 152 lotes: deuda previa, interés, saldo a favor, expensas, fondo y
  redondeo. Cada lote queda con su saldo real (suma de los 152: $ 96.071.901,22, igual al PDF).

> Al armar ese archivo apareció un error del padrón importado el 19-09: al **Lote 150** le había
> quedado como total del cupón el total general de la liquidación ($ 96.071.901,22). Ya está
> corregido en `datos-privados/padron-agosto-2026.json` (su total es $ 274.522,50).

**Qué desarrolla sola, hasta diciembre:**

| Qué | Cómo |
|---|---|
| Gastos | Cada gasto de agosto es *todos los meses* (se actualiza por inflación), *en cuotas* (sigue hasta la última: la tasa municipal 33 de 36 termina en noviembre, el seguro 5 de 6 en septiembre, los postes 3 de 3 ya terminaron), *solo en invierno* (retro de nieve, mayo a septiembre) o *una sola vez* (flete, certificación de copias, limpieza de pluviales). Se puede cambiar gasto por gasto en "Cómo se calcula". |
| Ingresos | Cobro en término (94,7 % en agosto), recupero de deudas ($ 3,4 M por mes) e intereses cobrados. Si ya hay pagos confirmados en la app para ese mes, se usan los reales. |
| Devengado / percibido / por pagar | Gastos del mes, lo que entra al banco, y lo del mes siguiente que se paga con esa cobranza. |
| Banco y deuda | Saldo del banco mes a mes; deuda de vecinos con su actualización. |
| Deuda | Tres métodos: interés por mora de Parámetros, inflación, o inflación + interés puro. En agosto Octavo Piso aplicó **4,81 % mensual** a los saldos de un mes (hay un botón para adoptarlo). |
| Cada lote | Cuota de cada mes = gasto × coeficiente + Fondo de Infraestructura + redondeo. Tabla de los 152, "si no paga" para los morosos, PDF y CSV. |

**Los centavos identifican al lote:** el total de cada cupón termina en el número de lote
(Lote 148 → $ …,48; Lote 9 → $ …,09; Lote 133A → $ …,33). Es la columna *Redondeo* de
Octavo Piso: se suman entre 0 y 99 centavos. Vale también para el 2º vencimiento y las estimaciones.

**Cierre automático:** el día de cierre (1º por defecto) la app completa con **estimados** los
gastos del mes anterior que todavía no tienen factura y avisa a la Administración para que
revise y emita. Cuando se carga la factura real del mismo proveedor, el estimado se borra solo.
La **emisión sola** existe pero viene **apagada**, porque se lleva en paralelo con Octavo Piso.

**Ojo mientras se lleve en paralelo:** la app cobra interés a quien tenga saldo impago *en la
app*. Si los pagos de septiembre se hacen por fuera (a Octavo Piso) y no se registran acá, en la
liquidación de septiembre todos aparecerían debiendo agosto. Antes de emitir, registrar los pagos
(Pagos → Registrar un pago a mano, o el extracto) o seguir usando la app solo como comparación.

**Lo que ve el vecino:** en su cuenta, *Tus próximas expensas (estimadas)*; y en El barrio →
**Las cuentas del barrio**, el tablero transparente: gastos mes a mes, en qué se gasta, previsto
contra real y la morosidad total, sin nombres.

## 11. Libro contable y carpeta del contador (desde el 24-09-2026)

**Dónde:** Gestión → Contabilidad → pestañas **Libro contable** y **Carpeta del contador**. Solo la Administración.

**Dos libros enlazados.** Expensas es la fuente (gastos del mes → cupón; pagos → cobranza). El libro
contable se arma **solo**: un asiento por cada gasto y uno por cada cobro confirmado. La Administración
puede **corregir** un asiento (cuenta, neto, IVA, percepciones, retenciones, fecha y medio de pago,
nota) **sin tocar la expensa ni el cupón**. El original queda guardado ("Volver al original").
Si después se cambia el gasto en Expensas, el asiento muestra **"cambió el origen"**: se toma el cambio
o se deja la versión corregida. Los asientos **manuales** sirven para lo que no pasa por Expensas
(ingresos de terceros en la cuenta 4.4, una comisión, un ajuste). Nada se borra: se anula.

**Carpeta del mes:** resumen, saldo por cuenta, libro diario, comprobantes recibidos (neto, IVA,
percepciones, CUIT), cobranzas por lote, retenciones practicadas, banco (saldo inicial del último
resumen importado + cobros − pagos) y la lista de presentaciones con vencimiento (IVA, Ingresos Brutos
AREF, retenciones, F.931). En PDF y en tres planillas CSV, y se le puede mandar un aviso al contador.
**Cerrar el mes para el contador** congela el libro de ese mes.

**Datos fiscales** (en la misma pestaña): condición frente al IVA, Ingresos Brutos (AREF) con número
y vencimiento de la exención, y vencimiento del certificado de exención de Ganancias. La app avisa
60 días antes. Todo es una guía: la condición la confirma el contador (Ley 19.640 en TDF; los ingresos
de terceros quedan aparte para que él evalúe si tributan).
