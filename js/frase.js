/* =========================================================
   FRASE DEL DÍA (pedido de Claudio, 13-11-2026; maqueta aprobada en
   "Maqueta frase del dia/", pasada a la app tal cual).
   Debajo de la foto de la portada hay una pizarra de acrílico (la foto
   img/frase-pizarra.jpg) donde UN vecino por día escribe una frase
   motivadora, con letra de marcador.

   CÓMO FUNCIONA
   · Vacía, la pizarra se ve en blanco. El primer vecino que GRABA (no el
     que toca) es el dueño de la frase hasta las 00:00.
   · Tocar la pizarra abre la escritura: hasta 140 letras, con tres fibras
     (azul, negra, roja) que se eligen tocando las fibras del estante y se
     pueden mezclar en la misma frase. Mientras escribe corrige libre (con
     el teclado o con el borrador): nada se guarda hasta "✓ Grabar".
     "Cancelar" antes de grabar no cuenta.
   · Firma sola con letra de pluma: "Nombre I." y el lote, en gris suave.
   · Grabada, no se edita. Su autor puede borrarla con el borrador cuando
     quiera: la pizarra queda libre para OTRO vecino y él no escribe más ese
     día. Ningún otro vecino puede escribir ni borrar hasta las 00:00.
   · A las 00:00 se borra sola (cada día es un registro nuevo, fd-<día>).
   · La frase y la firma se deforman como el acrílico de la foto (lienzo
     virtual de 600 x 720 llevado a sus cuatro esquinas) y la letra se
     achica sola para no salirse.

   PROTECCIÓN DE DATOS (Ley 25.326)
   · Se guarda en barrio/frase/fd-<día>: el texto con sus colores, el
     nombre con la inicial del apellido y el lote de quien la escribió, la
     hora, y la lista de cuentas que ya la usaron ese día (para no dejar
     escribir dos veces). Lo leen los vecinos, la garita y la
     Administración; no el hotel ni la supervisión.
   · La app de la Administración borra los días de más de una semana.
   ========================================================= */
const FD_MAX = 140;
const FD_TINTAS = { az:'#1f4fb8', ne:'#1b1d22', ro:'#c81e1e' };
const FD_NOMBRE = { az:'azul', ne:'negra', ro:'roja' };
/* Las cuatro esquinas del acrílico en la foto (fracción del ancho y del alto). */
/* (13-11-2026, Claudio: "el original se ve real, en la pared de una oficina; así lo quiero") la foto es la
   original entera, vertical, con la oficina a la derecha, y el texto borrado con cuidado. Las esquinas son
   las de la zona donde estaba escrita la frase original (con la misma perspectiva). Lienzo de 600 x 720. */
const FD_W = 600, FD_H = 720;
const FD_ESQ = [[.222, .179], [.794, .221], [.794, .667], [.222, .704]];

/* =========================================================
   LA FRASE AUTOMÁTICA (pedido de Claudio, 13-11-2026): "si hasta las 11:59 no
   se escribió ninguna frase, generá una cada día, con la firma de quién es;
   un vecino la puede reemplazar; si queda, que cambie a las 24 h".
   · Desde las 12:00, si la pizarra está vacía (nadie escribió, o el autor la
     borró), se ve la frase automática del día, firmada por su autor.
   · Un vecino que puede escribir la reemplaza tocando la pizarra o el
     borrador: la automática se va y escribe la suya, con las reglas de siempre.
   · La automática dura 24 h: de las 12:00 a las 11:59 del día siguiente, y a las 12:00 llega otra.
     La frase de un vecino, en cambio, se borra a las 00:00 (la mañana queda libre).
   · No se guarda en la base ni usa internet ni IA: todas las pantallas
     calculan la misma frase con la fecha. Sin datos personales.
   LAS FRASES: principalmente Einstein y Jung (dos días de cada tres); además autores de dominio público (traducciones propias de los
   clásicos), refranes y frases propias del barrio. Las atribuciones dudosas
   se verificaron en la web el 13-11-2026 (Machado, Quijote, Séneca, Marco
   Aurelio, Epicteto); las que no se pudieron confirmar no se usaron.
   ========================================================= */
const FD_AUTO_HORA = 12;
const FD_AUTO = [
  /* Los principales (Claudio, 13-11-2026: "¿podrán ser de Carl Jung y Einstein, principalmente?"): dos de cada tres días.
     Solo las que tienen fuente comprobable (carta, libro o entrevista), verificadas en la web el 13-11-2026
     (Quote Investigator, Wikiquote, Nature, Jung Society). Las muy difundidas sin fuente no van. */
  { t:'La vida es como andar en bicicleta: para mantener el equilibrio hay que seguir moviéndose.', a:'Albert Einstein', o:'Carta a su hijo Eduard, 1930', p:1 },
  { t:'Quien mira hacia afuera, sueña; quien mira hacia adentro, despierta.', a:'Carl G. Jung', o:'Carta a Fanny Bowditch, 1916', p:1 },
  { t:'La imaginación es más importante que el conocimiento.', a:'Albert Einstein', o:'Entrevista, 1929', p:1 },
  { t:'Todo lo que nos irrita de los demás puede llevarnos a entendernos a nosotros mismos.', a:'Carl G. Jung', o:'Recuerdos, sueños, pensamientos', p:1 },
  { t:'Lo importante es no dejar de hacerse preguntas. La curiosidad tiene su propia razón de existir.', a:'Albert Einstein', o:'Revista LIFE, 1955', p:1 },
  { t:'El encuentro de dos personas es como el contacto de dos sustancias químicas: si hay reacción, las dos se transforman.', a:'Carl G. Jung', o:'El hombre moderno en busca de un alma', p:1 },
  { t:'Tratá de no ser una persona de éxito, sino una persona de valor.', a:'Albert Einstein', o:'Revista LIFE, 1955', p:1 },
  { t:'La soledad no viene de no tener gente alrededor, sino de no poder compartir lo que a uno le parece importante.', a:'Carl G. Jung', o:'Recuerdos, sueños, pensamientos', p:1 },
  { t:'No tengo talentos especiales: solo soy apasionadamente curioso.', a:'Albert Einstein', o:'Carta a Carl Seelig, 1952', p:1 },
  { t:'Lo nuevo no lo crea el intelecto, sino el instinto de juego.', a:'Carl G. Jung', o:'Tipos psicológicos', p:1 },
  { t:'Solo una vida vivida para los demás vale la pena.', a:'Albert Einstein', o:'The New York Times, 1932', p:1 },
  { t:'Los grandes problemas de la vida no se resuelven: se superan creciendo.', a:'Carl G. Jung', o:'Comentario a El secreto de la flor de oro', p:1 },
  { t:'El eterno misterio del mundo es que se lo pueda comprender.', a:'Albert Einstein', o:'Física y realidad, 1936', p:1 },
  { t:'Conocer la propia oscuridad es el mejor método para tratar con la oscuridad de los demás.', a:'Carl G. Jung', o:'Carta, 1937', p:1 },
  /* El resto: un día de cada tres. */
  { t:'Caminante, no hay camino:\nse hace camino al andar.', a:'Antonio Machado', o:'Proverbios y cantares' },
  { t:'Si no sabés a qué puerto vas, ningún viento te es favorable.', a:'Séneca', o:'Cartas a Lucilio' },
  { t:'En el fin del mundo el sol sale para todos: que hoy nos encuentre con ganas.', a:'Bahía Cauquén', o:'Frase del barrio' },
  { t:'Al mal tiempo, buena cara.', a:'Refrán', o:'Dicho popular' },
  { t:'Lo que no es útil a la colmena tampoco es útil a la abeja.', a:'Marco Aurelio', o:'Meditaciones' },
  { t:'Un viaje de mil millas empieza con un solo paso.', a:'Lao-Tsé', o:'Tao Te Ching' },
  { t:'Un saludo al vecino calienta más que la estufa.', a:'Bahía Cauquén', o:'Frase del barrio' },
  { t:'Los hermanos sean unidos,\nporque esa es la ley primera.', a:'José Hernández', o:'Martín Fierro' },
  { t:'No nos perturban las cosas, sino lo que pensamos de ellas.', a:'Epicteto', o:'Manual' },
  { t:'Despacito y buena letra:\nel hacer las cosas bien importa más que el hacerlas.', a:'Antonio Machado', o:'Proverbios y cantares' },
  { t:'Poco a poco se va lejos.', a:'Refrán', o:'Dicho popular' },
  { t:'El viento del Beagle no se elige; la forma de caminarlo, sí.', a:'Bahía Cauquén', o:'Frase del barrio' },
  { t:'Mientras se espera vivir, la vida pasa.', a:'Séneca', o:'Cartas a Lucilio' },
  { t:'Donde una puerta se cierra, otra se abre.', a:'Miguel de Cervantes', o:'Don Quijote' },
  { t:'Lo esencial es invisible a los ojos.', a:'Antoine de Saint-Exupéry', o:'El principito' },
  { t:'Cuidarnos entre todos es la mejor alarma que tiene el barrio.', a:'Bahía Cauquén', o:'Frase del barrio' },
  { t:'Lo que no quieras para vos, no lo hagas a los demás.', a:'Confucio', o:'Analectas' },
  { t:'Gota a gota se horada la piedra.', a:'Ovidio', o:'Cartas del Ponto' },
  { t:'Mejor es el vecino cerca que el hermano lejos.', a:'Libro de los Proverbios', o:'27, 10' },
  { t:'Hoy es un buen día para darle las gracias a alguien que trabaja por nosotros.', a:'Bahía Cauquén', o:'Frase del barrio' },
  { t:'Primero decite qué querés ser; después hacé lo que tengas que hacer.', a:'Epicteto', o:'Disertaciones' },
  { t:'Bien hecho es mejor que bien dicho.', a:'Benjamin Franklin', o:'Almanaque del pobre Richard' },
  { t:'Hoy es siempre todavía.', a:'Antonio Machado', o:'Proverbios y cantares' },
  { t:'Después de cada nevada, el camino lo abrimos juntos.', a:'Bahía Cauquén', o:'Frase del barrio' },
  { t:'No es que tengamos poco tiempo: es que perdemos mucho.', a:'Séneca', o:'Sobre la brevedad de la vida' },
  { t:'Hacé el bien sin mirar a quién.', a:'Refrán', o:'Dicho popular' },
  { t:'Lo que se interpone en el camino se convierte en el camino.', a:'Marco Aurelio', o:'Meditaciones' },
  { t:'Como la lenga que crece torcida por el viento y no se rinde: así se vive en el sur.', a:'Bahía Cauquén', o:'Frase del barrio' },
  { t:'El que lee mucho y anda mucho, ve mucho y sabe mucho.', a:'Miguel de Cervantes', o:'Don Quijote' },
  { t:'Pueden porque creen que pueden.', a:'Virgilio', o:'Eneida' },
  { t:'Pequeños gestos, barrio grande.', a:'Bahía Cauquén', o:'Frase del barrio' },
  { t:'Sufrimos más en la imaginación que en la realidad.', a:'Séneca', o:'Cartas a Lucilio' },
  { t:'La unión hace la fuerza.', a:'Refrán', o:'Dicho popular' },
  { t:'Para dialogar, preguntad primero;\ndespués… escuchad.', a:'Antonio Machado', o:'Proverbios y cantares' },
  { t:'Si hoy te toca empujar, empujá: mañana alguien empuja por vos.', a:'Bahía Cauquén', o:'Frase del barrio' },
  { t:'Aprender sin pensar es inútil; pensar sin aprender es peligroso.', a:'Confucio', o:'Analectas' },
  { t:'Aprovechá el día.', a:'Horacio', o:'Odas' },
  { t:'El mejor paisaje de Ushuaia es el que compartimos.', a:'Bahía Cauquén', o:'Frase del barrio' },
  { t:'La diligencia es madre de la buena ventura.', a:'Miguel de Cervantes', o:'Don Quijote' },
  { t:'No hay mal que por bien no venga.', a:'Refrán', o:'Dicho popular' },
  { t:'Mientras estamos entre los hombres, cultivemos la humanidad.', a:'Séneca', o:'Sobre la ira' },
  { t:'Que la última ciudad del mundo sea la primera en tender una mano.', a:'Bahía Cauquén', o:'Frase del barrio' },
  { t:'Nadie se baña dos veces en el mismo río.', a:'Heráclito', o:'Fragmentos' },
  { t:'Si querés llegar rápido, andá solo; si querés llegar lejos, andá acompañado.', a:'Refrán', o:'Dicho popular' },
  { t:'El frío se pasa más rápido con buena compañía.', a:'Bahía Cauquén', o:'Frase del barrio' },
  { t:'Tenemos dos orejas y una sola boca para escuchar más y hablar menos.', a:'Zenón de Citio', o:'según Diógenes Laercio' },
  { t:'Mañana será otro día.', a:'Refrán', o:'Dicho popular' },
  { t:'Una sonrisa en la garita, un saludo en la calle: así se construye un barrio.', a:'Bahía Cauquén', o:'Frase del barrio' },
  { t:'Querer es poder.', a:'Refrán', o:'Dicho popular' },
  { t:'Cada día en el fin del mundo es el comienzo de algo.', a:'Bahía Cauquén', o:'Frase del barrio' },
];
/* La frase automática de un día (la misma en todos los teléfonos): cambia cada día y no se repite hasta pasar la lista entera. */
const FD_PRIN = FD_AUTO.filter(x => x.p), FD_OTRAS = FD_AUTO.filter(x => !x.p);
function fdAutoDe(iso){
  const n = Math.floor(Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10)) / 86400000);
  /* Dos días de cada tres, Einstein o Jung (alternados); el tercero, una de las otras. */
  const b = Math.floor(n / 3), r = n % 3;
  const x = r < 2 ? FD_PRIN[(b * 2 + r) % FD_PRIN.length] : FD_OTRAS[b % FD_OTRAS.length];
  return { ...x, partes:[{ t:x.t, c:n % 2 ? 'az' : 'ne' }] };
}

const Frase = {
  editando:false, tinta:'az', borrador:[], dia:'',
  id: (d = hoyISO()) => 'fd-' + d,
  hoy(){ return aLista(Store.s.frase).find(x => x && x.id === this.id()) || null; },
  /* La frase grabada de hoy (si el autor la borró, no hay). */
  activa(){ const f = this.hoy(); return f && f.userId && aLista(f.partes).length ? f : null; },
  /* ¿Esta cuenta ya escribió hoy (aunque después la haya borrado)? */
  usoHoy(){ const u = yo(), f = this.hoy(); return !!(u && f && f.usaron && f.usaron[u.id]); },
  /* La automática del día: desde las 12:00, si ningún vecino tiene una frase grabada. */
  /* (Claudio, 13-11-2026, corrección: "la automática cambia a las 24 h, o sea a las 11:59 del día siguiente")
     · desde las 12:00, la automática del día;
     · de 00:00 a 11:59, sigue la de ayer, salvo que ayer un vecino haya dejado su frase hasta la medianoche
       (en ese caso la pizarra queda libre a la mañana, como siempre). */
  auto(){
    if (this.activa()) return null;
    if (new Date().getHours() >= FD_AUTO_HORA) return fdAutoDe(hoyISO());
    const ayer = isoDe(new Date(Date.now() - DIA)), fa = aLista(Store.s.frase).find(x => x && x.id === this.id(ayer));
    return fa && fa.userId && aLista(fa.partes).length ? null : fdAutoDe(ayer);
  },
  puede: () => !!yo() && !veGarita() && !esHotel() && !(typeof esPropDistancia === 'function' && esPropDistancia()),
  firmaDe(u){ const p = String(u && u.nombre || '').trim().split(/\s+/);
    return { de:`${p[0] || 'Vecino/a'}${p.length > 1 ? ' ' + p[p.length - 1][0].toUpperCase() + '.' : ''}`, lote:u && u.casa || '' }; },
  letras: partes => aLista(partes).reduce((n, p) => n + String(p.t || '').replace(/\n/g, '').length, 0),
  pintarPartes: partes => aLista(partes).map(p => `<span class="fd-${FD_TINTAS[p.c] ? p.c : 'az'}">${esc(p.t).replace(/\n/g, '<br>')}</span>`).join(''),
  /* El color de un pedazo de texto → la fibra más parecida. */
  tintaDe(el){
    let c = [31, 79, 184]; try { const m = getComputedStyle(el).color.match(/\d+/g); if (m) c = m.slice(0, 3).map(Number); } catch(e){}
    let mejor = 'az', d0 = Infinity;
    for (const k in FD_TINTAS){ const h = FD_TINTAS[k], r = [1, 3, 5].map(i => parseInt(h.substr(i, 2), 16)), d = r.reduce((a, v, i) => a + (v - c[i]) ** 2, 0); if (d < d0){ d0 = d; mejor = k; } }
    return mejor;
  },
  /* Lo escrito en la pizarra → [{t, c}] (sin HTML: solo texto y color). */
  leer(el){
    const out = [], push = (t, c) => { if (!t) return; const l = out[out.length - 1]; if (l && l.c === c) l.t += t; else out.push({ t, c }); };
    const ult = () => out.length ? out[out.length - 1].c : 'az';
    const walk = n => n.childNodes.forEach(k => {
      if (k.nodeType === 3) push(k.nodeValue.replace(/\u00a0/g, ' ').replace(/\u200b/g, ''), this.tintaDe(k.parentElement));
      else if (k.nodeType === 1){
        if (k.tagName === 'BR'){ push('\n', ult()); return; }
        const bloque = /^(DIV|P)$/.test(k.tagName);
        if (bloque && out.length && !/\n$/.test(out[out.length - 1].t)) push('\n', ult());
        walk(k);
      }
    });
    walk(el);
    /* Sin renglones vacíos de más: hasta 4 saltos, y nada al final. */
    let saltos = 0;
    out.forEach(p => { p.t = p.t.replace(/\n/g, () => ++saltos > 4 ? ' ' : '\n'); });
    while (out.length && !out[out.length - 1].t.replace(/\s+$/, '')) out.pop();
    if (out.length) out[out.length - 1].t = out[out.length - 1].t.replace(/\s+$/, '');
    return out;
  },
  /* La app de la Administración borra los días de más de una semana. */
  limpiar(){
    if (!esAdmin()) return;
    const lim = isoDe(new Date(Date.now() - 7 * DIA)), viejas = aLista(Store.s.frase).filter(x => x && x.id && x.id.slice(3) < lim);
    if (viejas.length) Store.cambiar(s => { const ids = new Set(viejas.map(x => x.id)); s.frase = aLista(s.frase).filter(x => x && !ids.has(x.id)); });
  },
};

/* ---------- el dibujo ---------- */
function fraseDia(){
  const u = yo(), f = Frase.activa(), mia = !!(f && u && f.userId === u.id), ed = Frase.editando && Frase.puede() && !f;
  if (!ed) Frase.editando = false;
  const firma = (de, lote) => `<div class="fd-firma"><span>${esc(de)}</span>${lote ? `<small>${esc(lote)}</small>` : ''}</div>`;
  const yoF = Frase.firmaDe(u);
  const au = !ed && !f ? Frase.auto() : null;
  const dentro = ed ? `<div class="fd-lapiz" id="fdLapiz" contenteditable="true" spellcheck="false" role="textbox" aria-multiline="true" aria-label="Escribí la frase del día, hasta ${FD_MAX} letras">${Frase.pintarPartes(Frase.borrador)}</div>${firma(yoF.de, yoF.lote)}`
    : f ? `<p class="fd-frase">${Frase.pintarPartes(f.partes)}</p>${firma(f.de || '', f.lote || '')}`
    : au ? `<p class="fd-frase fd-auto">${Frase.pintarPartes(au.partes)}</p>${firma(au.a, '')}` : '';   /* en la pizarra, solo el autor; la fuente va abajo */
  const pie = ed ? '' : mia ? 'La escribiste vos. Si la borrás con el borrador, queda libre para otro vecino y vos podés volver a escribir mañana.'
    : f ? 'Hoy la escribió otro vecino. Se borra sola a las 00:00 y ahí podés escribir vos.'
    : au ? `${esc(au.a)} · ${esc(au.o)}` : '';   /* (Claudio: "no hace falta aclararlo abajo") solo de quién es y de dónde sale */
  const n = Frase.letras(Frase.borrador);
  return `<div class="sec fd-sec"><h2>Frase del día</h2><small>hasta las 00:00</small></div>
    <div class="fd-cartel${f && !mia ? ' bloqueada' : ''}" id="fdCartel">
      <div class="fd-texto" id="fdTexto"${ed ? ' data-fijo="ed"' : ''}>${dentro}</div>
      <button type="button" class="fd-borrador" id="fdBorrador" aria-label="Borrador: borra lo escrito"></button>
      <button type="button" class="fd-fibras" id="fdFibras" aria-label="Fibras: elegir el color"></button>
      <div class="fd-colores" id="fdColores" role="menu" aria-label="Color de la fibra">${['ne', 'ro', 'az'].map(k => `<button type="button" data-t="${k}" style="--c:${FD_TINTAS[k]}" aria-label="${k === 'ne' ? 'Negro' : k === 'ro' ? 'Rojo' : 'Azul'}"></button>`).join('')}</div>
    </div>
    ${ed ? `<div class="fd-cuenta" id="fdCuenta">${fdCuentaTxt(n)}</div>
      <div class="fd-acciones"><button type="button" class="btn btn-sec" data-a="frase-cancelar">Cancelar</button><button type="button" class="btn btn-pri fd-grabar" id="fdGrabar" data-a="frase-grabar"${n && n <= FD_MAX ? '' : ' disabled'}>✓ Grabar</button></div>` : ''}
    ${pie ? `<p class="fd-pie">${pie}</p>` : ''}`;
}
const fdCuentaTxt = n => n > FD_MAX ? `${n} / ${FD_MAX} letras · te pasaste: borrá ${n - FD_MAX} para poder grabar`
  : `${n} / ${FD_MAX} letras · corregí lo que quieras: recién se graba al tocar Grabar`;

/* La transformación que lleva el lienzo virtual a las cuatro esquinas del acrílico. */
function fdHomografia(w, h, p){
  const [x0, y0, x1, y1, x2, y2, x3, y3] = p;
  const dx1 = x1 - x2, dx2 = x3 - x2, dx3 = x0 - x1 + x2 - x3, dy1 = y1 - y2, dy2 = y3 - y2, dy3 = y0 - y1 + y2 - y3;
  const den = dx1 * dy2 - dx2 * dy1, g = (dx3 * dy2 - dx2 * dy3) / den, k = (dx1 * dy3 - dx3 * dy1) / den;
  const a = x1 - x0 + g * x1, b = x3 - x0 + k * x3, d = y1 - y0 + g * y1, e = y3 - y0 + k * y3;
  return `matrix3d(${a / w},${d / w},0,${g / w},${b / h},${e / h},0,${k / h},0,0,1,0,${x0},${y0},0,1)`;
}
/* La letra, lo más grande posible sin salirse del acrílico. */
/* (13-11-2026) Y sin tocar la firma, que va inclinada en el rincón de abajo a la derecha: se mide la forma
   real de la firma (girada 30°) contra cada renglón de la frase, en el lienzo sin la perspectiva. */
function fdPisaFirma(C, el){
  const fw = C.querySelector('.fd-firma'), sp = fw && fw.querySelector('span'); if (!sp) return false;
  const C0 = C.getBoundingClientRect(), rg = document.createRange(); rg.selectNodeContents(el);
  const lineas = [...rg.getClientRects()].map(r => [[r.left - C0.left, r.top - C0.top], [r.right - C0.left, r.top - C0.top], [r.right - C0.left, r.bottom - C0.top], [r.left - C0.left, r.bottom - C0.top]]);
  const x0 = fw.offsetLeft + sp.offsetLeft, y0 = fw.offsetTop + sp.offsetTop, w = sp.offsetWidth, h = sp.offsetHeight;
  const cx = fw.offsetLeft + fw.offsetWidth / 2, cy = fw.offsetTop + fw.offsetHeight / 2, a = -Math.PI / 6, co = Math.cos(a), si = Math.sin(a);
  const firma = [[x0, y0 + h * .2], [x0 + w, y0 + h * .2], [x0 + w, y0 + h * .8], [x0, y0 + h * .8]].map(([X, Y]) => [cx + (X - cx) * co - (Y - cy) * si, cy + (X - cx) * si + (Y - cy) * co]);
  const cruzan = (P, Q) => [P, Q].every(A => A.every((p, k) => { const q = A[(k + 1) % 4], ax = p[1] - q[1], ay = q[0] - p[0];
    const pa = P.map(([x, y]) => x * ax + y * ay), pb = Q.map(([x, y]) => x * ax + y * ay); return !(Math.max(...pa) <= Math.min(...pb) || Math.max(...pb) <= Math.min(...pa)); }));
  return lineas.some(L => cruzan(firma, L));
}
function fdAjustar(){
  const C = document.getElementById('fdTexto'), el = C && C.querySelector('.fd-frase, .fd-lapiz'); if (!el) return;
  const tr = C.style.transform; C.style.transform = 'none';
  let f = 96; el.style.setProperty('font-size', f + 'px', 'important');
  while (f > 40 && (el.scrollHeight > FD_H * .86 || fdPisaFirma(C, el))){ f -= 2; el.style.setProperty('font-size', f + 'px', 'important'); }
  C.style.transform = tr;
}
Frase.despues = function(){
  const F = document.getElementById('fdCartel'); if (!F) return;
  const C = document.getElementById('fdTexto');
  const pon = () => { const W = F.clientWidth, H = F.clientHeight; if (!W || !C) return; C.style.transform = fdHomografia(FD_W, FD_H, FD_ESQ.flatMap(([x, y]) => [x * W, y * H])); };
  pon(); fdAjustar();
  if (!F._ro && typeof ResizeObserver !== 'undefined'){ F._ro = new ResizeObserver(pon); F._ro.observe(F); }
};

/* ---------- lo que pasa al tocar ---------- */
const fdAviso = t => toast(t, 'info');
const fdBloqueo = f => fdAviso(`Hoy ya escribió ${f.de || 'otro vecino'}${f.lote ? ' (' + f.lote + ')' : ''}. La pizarra se libera a las 00:00.`);
const fdHoyNoMas = () => fdAviso('Hoy ya escribiste y la borraste: queda libre para otro vecino. Mañana podés escribir de nuevo.');
const fdNoPuede = () => fdAviso(esAdmin() ? 'La frase del día la escriben los vecinos: pasá a modo vecino para escribir.' : 'La frase del día la escriben los vecinos.');
/* ¿Puede usar el borrador o las fibras ahora? (si no, ya avisó) */
function fdPermiso(){
  const u = yo(), f = Frase.activa();
  if (!Frase.puede()){ fdNoPuede(); return false; }
  if (f && f.userId !== u.id){ fdBloqueo(f); return false; }
  if (!f && Frase.usoHoy() && !Frase.editando){ fdHoyNoMas(); return false; }
  return true;
}
function fdAbrir(){
  Frase.editando = true; Frase.borrador = [];
  refrescar();
  const t = document.getElementById('fdLapiz'); if (!t) return;
  t.focus(); try { const r = document.createRange(); r.selectNodeContents(t); r.collapse(false); const s = getSelection(); s.removeAllRanges(); s.addRange(r); } catch(e){}
  fdTinta();
}
function fdTinta(){
  const t = document.getElementById('fdLapiz'); if (!t) return;
  t.style.setProperty('--tinta', FD_TINTAS[Frase.tinta]); t.focus();
  /* Lo que se escriba desde acá va adentro de un pedacito de ese color (con un
     espacio invisible para que el cursor quede adentro). Así anda con el
     teclado de cualquier teléfono, también el de Android, que no respeta el
     "color para lo próximo" del navegador. */
  try {
    const s = getSelection();
    if (!s.rangeCount || !t.contains(s.anchorNode)){ const r = document.createRange(); r.selectNodeContents(t); r.collapse(false); s.removeAllRanges(); s.addRange(r); }
    const r = s.getRangeAt(0); r.deleteContents();
    const sp = document.createElement('span'); sp.className = 'fd-' + Frase.tinta; sp.style.color = FD_TINTAS[Frase.tinta]; sp.textContent = '\u200b';
    r.insertNode(sp);
    const r2 = document.createRange(); r2.setStart(sp.firstChild, 1); r2.collapse(true); s.removeAllRanges(); s.addRange(r2);
  } catch(e){}
}
function fdAlEscribir(){
  const t = document.getElementById('fdLapiz'); if (!t) return;
  Frase.borrador = Frase.leer(t);
  const n = Frase.letras(Frase.borrador), c = document.getElementById('fdCuenta'), g = document.getElementById('fdGrabar');
  if (c){ c.textContent = fdCuentaTxt(n); c.classList.toggle('pasado', n > FD_MAX); }
  if (g) g.disabled = !n || n > FD_MAX;
  fdAjustar();
}
document.addEventListener('input', e => { if (e.target && e.target.id === 'fdLapiz') fdAlEscribir(); });
/* Pegar: solo el texto, sin colores ni formato de otro lado. */
document.addEventListener('paste', e => { if (!e.target || !e.target.closest || !e.target.closest('#fdLapiz')) return;
  e.preventDefault(); const t = (e.clipboardData && e.clipboardData.getData('text/plain') || '').slice(0, FD_MAX);
  try { document.execCommand('insertText', false, t); } catch(err){} });
/* Tocar la pizarra: escribir (vacía) o explicar por qué no. */
document.addEventListener('click', e => {
  if (!e.target.closest || !e.target.closest('#fdTexto') || Frase.editando) return;
  const u = yo(), f = Frase.activa();
  if (!Frase.puede()) return fdNoPuede();
  if (f && f.userId !== u.id) return fdBloqueo(f);
  if (f) return fdAviso('Tu frase ya está grabada. Si la borrás con el borrador, hoy no vas a poder escribir de nuevo.');
  if (Frase.usoHoy()) return fdHoyNoMas();
  fdAbrir();
});
/* Las fibras, los colores y el borrador van con el dedo que baja, para no
   sacarle el cursor a lo que se está escribiendo. */
document.addEventListener('pointerdown', e => {
  const col = document.getElementById('fdColores'); if (!e.target.closest) return;
  if (col && !e.target.closest('#fdColores,#fdFibras')) col.classList.remove('on');
  if (e.target.closest('#fdFibras')){
    e.preventDefault(); if (!fdPermiso() || !col) return;
    col.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.t === Frase.tinta));
    col.classList.toggle('on'); return;
  }
  const b = e.target.closest('#fdColores button');
  if (b){ e.preventDefault(); Frase.tinta = b.dataset.t; col.classList.remove('on');
    if (Frase.editando) fdTinta(); else fdAviso(`Fibra ${FD_NOMBRE[Frase.tinta]} elegida. Tocá la pizarra para escribir.`); return; }
  if (e.target.closest('#fdBorrador')){
    e.preventDefault(); if (!fdPermiso()) return;
    if (Frase.editando){ const t = document.getElementById('fdLapiz'); if (t){ t.innerHTML = ''; fdAlEscribir(); t.focus(); } return; }
    const f = Frase.activa();
    if (!f && Frase.auto()) return fdAbrir();   /* la automática se borra y escribe la suya */
    if (!f) return fdAviso('La pizarra ya está limpia.');
    const F = document.getElementById('fdCartel'); if (F) F.classList.add('borrando');
    setTimeout(() => {
      Store.cambiar(s => { const x = aLista(s.frase).find(z => z && z.id === f.id); if (!x) return;
        x.partes = []; x.txt = ''; delete x.userId; delete x.de; delete x.lote; x.borradaAt = Date.now(); });
      toast('Borraste tu frase. La pizarra quedó libre para otro vecino; vos podés volver a escribir mañana.', 'check');
      refrescar();
    }, 450);
  }
});
A['frase-cancelar'] = () => { Frase.editando = false; Frase.borrador = []; refrescar(); };
A['frase-grabar'] = () => {
  const u = yo(), t = document.getElementById('fdLapiz'); if (!u || !t || !Frase.puede()) return;
  const partes = Frase.leer(t), n = Frase.letras(partes);
  if (!n) return fdAviso('Escribí algo antes de grabar.');
  if (n > FD_MAX) return fdAviso(`Son hasta ${FD_MAX} letras: borrá ${n - FD_MAX}.`);
  const otra = Frase.activa(); if (otra && otra.userId !== u.id){ Frase.editando = false; refrescar(); return fdBloqueo(otra); }
  const { de, lote } = Frase.firmaDe(u), id = Frase.id();
  Store.cambiar(s => {
    s.frase = aLista(s.frase);
    let x = s.frase.find(z => z && z.id === id);
    if (!x){ x = { id, dia:hoyISO(), usaron:{} }; s.frase.push(x); }
    x.usaron = { ...(x.usaron && typeof x.usaron === 'object' ? x.usaron : {}), [u.id]:true };
    Object.assign(x, { userId:u.id, de, lote, partes, txt:partes.map(p => p.t).join('').slice(0, 160), at:Date.now() });
    delete x.borradaAt;
  });
  Frase.editando = false; Frase.borrador = [];
  refrescar();
  toast('¡Grabada! Tu frase queda en la pizarra hasta las 00:00.', 'check');
};
/* A las 00:00 la pizarra queda limpia sola (cada día es un registro nuevo). */
/* A las 12:00 aparece la automática si no hay frase (se vuelve a dibujar la portada). */
setInterval(() => { const h = hoyISO(), m = h + (new Date().getHours() >= FD_AUTO_HORA ? 'b' : 'a');
  if (Frase.dia && Frase.dia !== h){ Frase.editando = false; Frase.borrador = []; }
  if (Frase.franja && Frase.franja !== m && typeof refrescarPronto === 'function' && yo()) refrescarPronto();
  Frase.dia = h; Frase.franja = m; }, 30000);
let fdLimpiarT = 0;
Store.alCambiar(() => { clearTimeout(fdLimpiarT); fdLimpiarT = setTimeout(() => { try { Frase.limpiar(); } catch(e){} }, 5000); });
