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
