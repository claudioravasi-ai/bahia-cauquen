/* =========================================================
   CALENDARIO: feriados, no laborables y fiestas religiosas
   -------------------------------------------------------
   Nada de esto está escrito a mano año por año: se CALCULA. Así la app no
   se desactualiza sola en enero.

     · Los feriados nacionales salen de la Ley 27.399: los inamovibles
       caen siempre en la misma fecha y los trasladables se corren al
       lunes según la regla de esa ley.
     · Carnaval, Jueves y Viernes Santo y el resto del calendario
       católico se calculan a partir de la Pascua (algoritmo de Meeus).
     · Las fiestas judías se calculan con la aritmética del calendario
       hebreo, que es fija y conocida. La Ley 24.571 las declara días no
       laborables para quienes profesan esa religión.
     · Lo provincial (Tierra del Fuego) y lo municipal (Ushuaia), más los
       "días no laborables con fines turísticos" que cada año fija un
       decreto, NO se pueden calcular: los carga y confirma la
       Administración desde Contenido → Feriados. Los que vienen de
       fábrica están marcados "a confirmar" hasta que alguien los revise.
   ========================================================= */
'use strict';

/* ---------- días absolutos, para poder sumar y restar fechas ---------- */
const bisiesto = y => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
const DIAS_MES = [31,28,31,30,31,30,31,31,30,31,30,31];
const diasDelMes = (m, y) => m === 2 && bisiesto(y) ? 29 : DIAS_MES[m - 1];
function aAbsoluto(y, m, d){
  let v = d;
  for (let i = 1; i < m; i++) v += diasDelMes(i, y);
  return v + 365 * (y - 1) + Math.floor((y - 1) / 4) - Math.floor((y - 1) / 100) + Math.floor((y - 1) / 400);
}
function deAbsoluto(abs){
  let y = Math.floor(abs / 366) || 1;
  while (aAbsoluto(y + 1, 1, 1) <= abs) y++;
  let m = 1;
  while (aAbsoluto(y, m, diasDelMes(m, y)) < abs) m++;
  return [y, m, abs - aAbsoluto(y, m, 1) + 1];
}
const absDeISO = iso => { const [y, m, d] = iso.split('-').map(Number); return aAbsoluto(y, m, d); };
const isoDeAbs = abs => { const [y, m, d] = deAbsoluto(abs); return `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`; };
const diaSemana = iso => absDeISO(iso) % 7;   /* 0 = domingo */

/* ---------- Pascua (Meeus / Butcher, calendario gregoriano) ---------- */
function pascua(y){
  const a = y % 19, b = Math.floor(y / 100), c = y % 100;
  const d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31);
  const dia = ((h + l - 7 * m + 114) % 31) + 1;
  return aAbsoluto(y, mes, dia);
}

/* ---------- calendario hebreo (aritmética estándar) ---------- */
const hebBisiesto = y => ((y * 7 + 1) % 19) < 7;
const hebMeses = y => hebBisiesto(y) ? 13 : 12;
function hebDemora1(y){
  const meses = Math.floor((235 * y - 234) / 19);
  const partes = 12084 + 13753 * meses;
  let dia = meses * 29 + Math.floor(partes / 25920);
  if (((3 * (dia + 1)) % 7) < 3) dia++;
  return dia;
}
function hebDemora2(y){
  const ant = hebDemora1(y - 1), hoy = hebDemora1(y), sig = hebDemora1(y + 1);
  if (sig - hoy === 356) return 2;
  if (hoy - ant === 382) return 1;
  return 0;
}
const hebTranscurridos = y => hebDemora1(y) + hebDemora2(y);
const hebDiasAnio = y => hebTranscurridos(y + 1) - hebTranscurridos(y);
function hebDiasMes(y, m){
  if ([2,4,6,10,13].includes(m)) return 29;
  if (m === 12 && !hebBisiesto(y)) return 29;
  if (m === 8 && hebDiasAnio(y) % 10 !== 5) return 29;   /* Jeshván */
  if (m === 9 && hebDiasAnio(y) % 10 === 3) return 29;   /* Kislev */
  return 30;
}
/* Meses: 1 Nisán … 6 Elul, 7 Tishrei (comienza el año), 8 Jeshván … 12/13 Adar. */
function hebAAbsoluto(y, m, d){
  let v = d;
  if (m < 7){
    for (let i = 7; i <= hebMeses(y); i++) v += hebDiasMes(y, i);
    for (let i = 1; i < m; i++) v += hebDiasMes(y, i);
  } else {
    for (let i = 7; i < m; i++) v += hebDiasMes(y, i);
  }
  return v + hebTranscurridos(y) - 1373428;   /* desplazamiento al día absoluto 1 (1 de enero del año 1) */
}

/* ---------- feriados nacionales (Ley 27.399) ---------- */
/* Trasladables: si caen martes o miércoles se pasan al lunes anterior; si
   caen jueves o viernes, al lunes siguiente. */
function trasladar(abs){
  const dow = abs % 7;                 /* 0 domingo … 6 sábado */
  if (dow === 2 || dow === 3) return abs - (dow - 1);
  if (dow === 4 || dow === 5) return abs + (8 - dow);
  return abs;
}
function feriadosNacionales(y){
  const P = pascua(y), out = [];
  const add = (iso, nombre, tipo = 'inamovible', nota = '') => out.push({ fecha:iso, nombre, ambito:'nacional', tipo, laborable:false, nota, calc:true });
  add(`${y}-01-01`, 'Año Nuevo');
  add(isoDeAbs(P - 48), 'Carnaval');
  add(isoDeAbs(P - 47), 'Carnaval');
  add(`${y}-03-24`, 'Día de la Memoria por la Verdad y la Justicia');
  add(`${y}-04-02`, 'Día del Veterano y de los Caídos en la Guerra de Malvinas');
  add(isoDeAbs(P - 2), 'Viernes Santo');
  add(`${y}-05-01`, 'Día del Trabajador');
  add(`${y}-05-25`, 'Día de la Revolución de Mayo');
  add(isoDeAbs(trasladar(aAbsoluto(y, 6, 17))), 'Paso a la Inmortalidad del Gral. Güemes', 'trasladable', 'Es 17 de junio; la ley lo corre al lunes si cae de martes a viernes.');
  add(`${y}-06-20`, 'Día de la Bandera');
  add(`${y}-07-09`, 'Día de la Independencia');
  add(isoDeAbs(trasladar(aAbsoluto(y, 8, 17))), 'Paso a la Inmortalidad del Gral. San Martín', 'trasladable', 'Es 17 de agosto; se corre al lunes si cae de martes a viernes.');
  add(isoDeAbs(trasladar(aAbsoluto(y, 10, 12))), 'Día del Respeto a la Diversidad Cultural', 'trasladable', 'Es 12 de octubre; se corre al lunes si cae de martes a viernes.');
  add(isoDeAbs(trasladar(aAbsoluto(y, 11, 20))), 'Día de la Soberanía Nacional', 'trasladable', 'Es 20 de noviembre; se corre al lunes si cae de martes a viernes.');
  add(`${y}-12-08`, 'Inmaculada Concepción de María');
  add(`${y}-12-25`, 'Navidad');
  /* No laborable nacional, no feriado: el trabajo es optativo y se paga simple. */
  out.push({ fecha:isoDeAbs(P - 3), nombre:'Jueves Santo', ambito:'nacional', tipo:'no laborable', laborable:true, calc:true,
    nota:'Día no laborable: trabajar o no lo decide el empleador. Bancos y oficinas públicas suelen no atender.' });
  return out;
}

/* ---------- calendario católico ---------- */
function fiestasCatolicas(y){
  const P = pascua(y), f = [];
  const add = (abs, nombre, nota = '') => f.push({ fecha: typeof abs === 'string' ? abs : isoDeAbs(abs), nombre, ambito:'católica', tipo:'religiosa', laborable:true, nota, calc:true });
  add(`${y}-01-06`, 'Epifanía · Reyes Magos');
  add(P - 49, 'Domingo de Carnaval');
  add(P - 46, 'Miércoles de Ceniza', 'Comienza la Cuaresma.');
  add(P - 7,  'Domingo de Ramos');
  add(P - 3,  'Jueves Santo');
  add(P - 2,  'Viernes Santo');
  add(P - 1,  'Sábado Santo');
  add(P,      'Domingo de Pascua · Resurrección');
  add(P + 39, 'Ascensión del Señor');
  add(P + 49, 'Pentecostés');
  add(P + 60, 'Corpus Christi');
  add(`${y}-03-19`, 'San José');
  add(`${y}-08-15`, 'Asunción de la Virgen');
  add(`${y}-11-01`, 'Todos los Santos');
  add(`${y}-11-02`, 'Fieles Difuntos');
  add(`${y}-12-08`, 'Inmaculada Concepción');
  add(`${y}-12-25`, 'Navidad');
  return f;
}

/* ---------- calendario judío ----------
   La Ley 24.571 declara días no laborables, para quienes profesan la
   religión judía, el Año Nuevo (2 días), el Día del Perdón y los dos
   primeros y dos últimos días de Pésaj. Los demás se muestran como
   fiesta, sin efecto laboral. */
function fiestasJudias(y){
  const f = [];
  const add = (abs, nombre, noLaboral = false, nota = '') => f.push({ fecha:isoDeAbs(abs), nombre, ambito:'judía',
    tipo: noLaboral ? 'no laborable (Ley 24.571)' : 'religiosa', laborable:true, noLaboralJudio:noLaboral, calc:true,
    nota: nota || (noLaboral ? 'Día no laborable para quienes profesan la religión judía (Ley 24.571). Empieza al atardecer del día anterior.' : 'Empieza al atardecer del día anterior.') });
  /* Un año gregoriano toca dos años hebreos: el que termina y el que empieza. */
  [y + 3760, y + 3761].forEach(hy => {
    const dentro = abs => deAbsoluto(abs)[0] === y;
    const poner = (m, d, nombre, noLab, nota) => { const a = hebAAbsoluto(hy, m, d); if (dentro(a)) add(a, nombre, noLab, nota); };
    poner(7, 1,  'Rosh Hashaná · Año Nuevo (1º día)', true);
    poner(7, 2,  'Rosh Hashaná · Año Nuevo (2º día)', true);
    poner(7, 10, 'Iom Kipur · Día del Perdón', true);
    poner(7, 15, 'Sucot (1º día)');
    poner(7, 22, 'Sheminí Atzeret');
    poner(7, 23, 'Simjat Torá');
    poner(9, 25, 'Janucá (1ª vela)');
    poner(hebBisiesto(hy) ? 13 : 12, 14, 'Purim');
    poner(1, 15, 'Pésaj (1º día)', true);
    poner(1, 16, 'Pésaj (2º día)', true);
    poner(1, 20, 'Pésaj (6º día)', true, 'Día no laborable para quienes profesan la religión judía (Ley 24.571): es el anteúltimo de Pésaj.');
    poner(1, 21, 'Pésaj (último día)', true);
    poner(3, 6,  'Shavuot');
    poner(5, 9,  'Tisha BeAv');
  });
  return f;
}

/* ---------- todo junto ----------
   A lo calculado se le suma lo que cargó la Administración (provincial,
   municipal y los puentes turísticos del decreto de cada año). Si una
   fecha está en las dos listas, manda la de la Administración. */
function feriadosDelAnio(y){
  const cargados = (Store.s.feriados || []).filter(f => (f.anio || f.fecha?.slice(0, 4)) == y)
    .map(f => ({ fecha:f.fecha, nombre:f.nombre, ambito:f.ambito || 'nacional', tipo:f.tipo || 'inamovible',
      laborable: f.laborable === true, nota:f.nota || '', calc:false, aConfirmar: f.aConfirmar !== false && !!f.aConfirmar }));
  const calc = [...feriadosNacionales(y), ...fiestasCatolicas(y), ...fiestasJudias(y)];
  const clave = f => f.fecha + '|' + f.ambito;
  const puestas = new Set(cargados.map(clave));
  return [...cargados, ...calc.filter(f => !puestas.has(clave(f)))].sort((a, b) => a.fecha.localeCompare(b.fecha));
}
/* Caché por año: calcular Pascua y el calendario hebreo en cada dibujo
   de pantalla sería un desperdicio. */
const _cacheFeriados = {};
function feriadosDe(y){
  const sello = (Store.s.feriados || []).length;
  if (!_cacheFeriados[y] || _cacheFeriados[y].sello !== sello) _cacheFeriados[y] = { sello, lista: feriadosDelAnio(y) };
  return _cacheFeriados[y].lista;
}
/* Qué pasa un día cualquiera. */
function diaInfo(iso = hoyISO()){
  const y = +iso.slice(0, 4);
  const todos = feriadosDe(y).filter(f => f.fecha === iso);
  const feriado = todos.find(f => !f.laborable);
  const noLaborable = todos.find(f => f.laborable && /no laborable/i.test(f.tipo) && f.ambito !== 'judía');
  const judio = todos.find(f => f.noLaboralJudio);
  const dow = diaSemana(iso);
  const finde = dow === 0 || dow === 6;
  return {
    fecha:iso, todos, feriado, noLaborable, judio, finde,
    laboral: !feriado && !finde,
    resumen: feriado ? `Feriado ${feriado.ambito}: ${feriado.nombre}`
      : noLaborable ? `Día no laborable: ${noLaborable.nombre}`
      : finde ? (dow === 0 ? 'Domingo' : 'Sábado')
      : 'Día hábil',
  };
}
const proximoFeriadoReal = (desde = hoyISO()) => {
  const y = +desde.slice(0, 4);
  return [...feriadosDe(y), ...feriadosDe(y + 1)].find(f => !f.laborable && f.fecha >= desde) || null;
};
