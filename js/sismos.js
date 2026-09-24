/* =========================================================
   SISMOS EN VIVO
   -------------------------------------------------------
   Ushuaia está cerca del borde de dos placas (la falla
   Magallanes-Fagnano pasa por el lago Fagnano y el canal) y
   tiene enfrente el Pasaje de Drake, el Mar de Scotia y la
   Antártida, que tiemblan seguido. Por eso la app muestra,
   al lado del clima, el último sismo que importa, y avisa
   con sonido cuando hay uno fuerte o cerca.

   DE DÓNDE SALE: el catálogo en vivo del Servicio Geológico
   de EE.UU. (USGS, earthquake.usgs.gov). Es gratis, no pide
   clave y deja que la app lo lea directo (no hace falta un
   intermediario). Cubre toda la región: Argentina, Chile,
   la Antártida, el Drake y las islas del Atlántico Sur. Los
   sismos aparecen a los pocos minutos de ocurrir.

   LO QUE NO SE PUEDE: nadie en el mundo puede anunciar un
   sismo antes de que ocurra. Lo que existe son los avisos
   del momento, y eso es lo que hace la app. Para un posible
   tsunami, la palabra oficial es del Servicio de Hidrografía
   Naval (SHN); la app muestra la marca de tsunami que pone
   el USGS y lleva a la fuente oficial.
   ========================================================= */
const Sismos = {
  KEY:'bhc.sismos', VISTOS:'bhc.sismos.avisados', LAT:-54.81, LON:-68.33,
  d:null, cargando:null, timer:null,
  /* El recuadro que se mira: el Cono Sur, la Antártida y el Atlántico Sur. */
  CAJA:{ minlatitude:-80, maxlatitude:-17, minlongitude:-92, maxlongitude:-18 },

  leer(){ try { const c = JSON.parse(localStorage.getItem(this.KEY)); if (c && c.t) this.d = c; } catch(e){} },
  fresco(){ return this.d && Date.now() - this.d.t < 5 * MIN; },
  pedir(forzar = false){
    if (!this.d) this.leer();
    if (!forzar && this.fresco()) return Promise.resolve(this.d);
    if (this.cargando) return this.cargando;
    const desde = new Date(Date.now() - 15 * DIA).toISOString().slice(0, 10);
    const q = new URLSearchParams({ format:'geojson', starttime:desde, minmagnitude:'3.5', orderby:'time', limit:'300', ...this.CAJA });
    this.cargando = fetch('https://earthquake.usgs.gov/fdsnws/event/1/query?' + q)
      .then(r => r.ok ? r.json() : Promise.reject(new Error('USGS ' + r.status)))
      .then(j => {
        const lista = (j.features || []).map(f => this.deUSGS(f)).filter(x => x && x.mag != null);
        this.d = { t:Date.now(), lista };
        try { localStorage.setItem(this.KEY, JSON.stringify(this.d)); } catch(e){}
        this.avisar();
        return this.d;
      })
      .catch(() => this.d)
      .finally(() => { this.cargando = null; });
    return this.cargando;
  },
  deUSGS(f){
    const p = f.properties || {}, [lon, lat, prof] = (f.geometry && f.geometry.coordinates) || [];
    if (lat == null) return null;
    return { id:f.id, mag:Math.round((+p.mag || 0) * 10) / 10, tipoMag:p.magType || '', lugar:this.enCastellano(p.place || ''), at:p.time,
      lat, lon, prof:Math.round(prof || 0), km:Math.round(this.distancia(lat, lon)), rumbo:this.rumbo(lat, lon),
      tsunami:!!p.tsunami, alerta:p.alert || '', sentido:+p.felt || 0, url:p.url || '' };
  },
  distancia(lat, lon){
    const r = x => x * Math.PI / 180, R = 6371;
    const dLat = r(lat - this.LAT), dLon = r(lon - this.LON);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(r(this.LAT)) * Math.cos(r(lat)) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(a));
  },
  /* Hacia dónde queda, visto desde el barrio (grados desde el norte). */
  grados(lat, lon){
    const r = x => x * Math.PI / 180, g = x => x * 180 / Math.PI;
    const y = Math.sin(r(lon - this.LON)) * Math.cos(r(lat));
    const x = Math.cos(r(this.LAT)) * Math.sin(r(lat)) - Math.sin(r(this.LAT)) * Math.cos(r(lat)) * Math.cos(r(lon - this.LON));
    return (g(Math.atan2(y, x)) + 360) % 360;
  },
  rumbo(lat, lon){ return ['N','NE','E','SE','S','SO','O','NO'][Math.round(this.grados(lat, lon) / 45) % 8]; },

  /* El USGS escribe los lugares en inglés: "53 km WSW of San Antonio, Chile". */
  enCastellano(t){
    const PTS = { N:'N', NNE:'NNE', NE:'NE', ENE:'ENE', E:'E', ESE:'ESE', SE:'SE', SSE:'SSE', S:'S', SSW:'SSO', SW:'SO', WSW:'OSO', W:'O', WNW:'ONO', NW:'NO', NNW:'NNO' };
    const LUG = [
      [/South Sandwich Islands region/i, 'Islas Sandwich del Sur'], [/South Sandwich Islands/i, 'Islas Sandwich del Sur'],
      [/South Georgia Island region/i, 'Islas Georgias del Sur'], [/South Georgia and the South Sandwich Islands/i, 'Georgias y Sandwich del Sur'],
      [/South Shetland Islands/i, 'Islas Shetland del Sur'], [/Scotia Sea/i, 'Mar de Scotia'], [/Drake Passage/i, 'Pasaje de Drake'],
      [/Tierra del Fuego/i, 'Tierra del Fuego'], [/Falkland Islands region/i, 'Islas Malvinas'], [/Falkland Islands/i, 'Islas Malvinas'],
      [/Antarctic Peninsula/i, 'Península Antártica'], [/Antarctica/i, 'Antártida'], [/Southern East Pacific Rise/i, 'Dorsal del Pacífico Sur'],
      [/West Chile Rise/i, 'Dorsal de Chile'], [/off the coast of/i, 'frente a la costa de'], [/near the coast of/i, 'cerca de la costa de'],
      [/southern/i, 'sur de'], [/northern/i, 'norte de'], [/central/i, 'centro de'], [/Strait of Magellan/i, 'Estrecho de Magallanes'],
      [/Argentina/i, 'Argentina'], [/Chile/i, 'Chile'], [/Bolivia/i, 'Bolivia'], [/Peru/i, 'Perú'], [/Brazil/i, 'Brasil'], [/Paraguay/i, 'Paraguay'],
    ];
    let s = String(t);
    s = s.replace(/^(\d+)\s*km\s+([NSEW]{1,3})\s+of\s+/i, (m, km, p) => `${km} km al ${PTS[p.toUpperCase()] || p} de `);
    LUG.forEach(([re, es]) => { s = s.replace(re, es); });
    return s.replace(/\bregion\b/i, 'región').trim();
  },

  /* Qué tan importante es, para alguien que vive en el barrio.
     rojo: se pudo sentir fuerte o hay marca de tsunami; amarillo: fuerte en
     la región o moderado cerca; verde: para saber. */
  nivel(x){
    if (!x) return 'verde';
    if (x.tsunami || (x.mag >= 6 && x.km < 1500) || (x.mag >= 5 && x.km < 350) || (x.mag >= 4.5 && x.km < 120) || x.mag >= 7.5) return 'rojo';
    if ((x.mag >= 5 && x.km < 1500) || (x.mag >= 4 && x.km < 350) || x.mag >= 6.3) return 'amarillo';
    return 'verde';
  },
  lista(){ if (!this.d) this.leer(); return (this.d && this.d.lista) || []; },
  /* El que se muestra al lado del clima: el más importante de los últimos
     tres días (un 6 en Chile central pesa más que un 4 lejos), y si hay
     empate, el más reciente. */
  destacado(){
    const lim = Date.now() - 3 * DIA, ORD = { rojo:0, amarillo:1, verde:2 };
    const ls = this.lista().filter(x => x.at > lim);
    if (!ls.length) return null;
    const puntaje = x => x.mag - Math.log10(Math.max(x.km, 50)) * 0.9;
    return ls.slice().sort((a, b) => (ORD[this.nivel(a)] - ORD[this.nivel(b)]) || (puntaje(b) - puntaje(a)) || b.at - a.at)[0];
  },
  ultimaHora(){ return this.lista().filter(x => Date.now() - x.at < HORA); },

  /* Aviso con sonido: una sola vez por sismo y por equipo, y solo si pasó
     hace menos de tres horas (no se avisa como nuevo algo de ayer). */
  avisados(){ try { return JSON.parse(localStorage.getItem(this.VISTOS)) || {}; } catch(e){ return {}; } },
  avisar(){
    if (typeof yo !== 'function' || !yo()) return;
    const ya = this.avisados(), nuevos = [];
    this.lista().forEach(x => {
      if (ya[x.id] || Date.now() - x.at > 3 * HORA) return;
      const n = this.nivel(x); if (n === 'verde') return;
      ya[x.id] = Date.now(); nuevos.push(x);
    });
    const lim = Date.now() - 10 * DIA; Object.keys(ya).forEach(k => { if (ya[k] < lim) delete ya[k]; });
    try { localStorage.setItem(this.VISTOS, JSON.stringify(ya)); } catch(e){}
    if (!nuevos.length) return;
    const x = nuevos.sort((a, b) => b.mag - a.mag)[0], rojo = this.nivel(x) === 'rojo';
    const titulo = `${x.tsunami ? 'Sismo con marca de tsunami' : 'Sismo'} de magnitud ${x.mag.toFixed(1)}`;
    const texto = `${x.lugar} · a ${x.km.toLocaleString('es-AR')} km del barrio · ${hora(x.at)} h`;
    if (!Store.sesion.sinSonido && typeof campanita === 'function') campanita(rojo);
    toast(`${titulo} · ${x.lugar}`, 'sismo');
    if ('Notification' in window && Notification.permission === 'granted' && document.hidden){
      try { new Notification(titulo, { body:texto, icon:'icons/icon-192.png', tag:'sismo-' + x.id, requireInteraction:rojo }); } catch(e){}
    }
    if (typeof refrescarPronto === 'function') refrescarPronto();
  },
  /* Para la pizarra del día: lo fuerte de las últimas 24 horas. */
  paraPizarra(){
    return this.lista().filter(x => Date.now() - x.at < DIA && this.nivel(x) !== 'verde').slice(0, 3);
  },
  arrancar(){
    if (this.timer) return;
    this.leer();
    this.pedir().then(() => { if (typeof refrescarPronto === 'function') refrescarPronto(); });
    this.timer = setInterval(() => { if (!document.hidden) this.pedir(); }, 5 * MIN);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) this.pedir().then(() => refrescarPronto()); });
  },
  texto(x){ return `M ${x.mag.toFixed(1)} · ${x.lugar}`; },
};

/* El renglón del sismo al lado del viento, en la foto de la portada. */
function sismoHero(){
  const x = Sismos.destacado();
  if (!x) return Sismos.d ? `<button class="sismo-hero nv-verde" data-a="abrir" data-v="sismos">${I('sismo')}<span><b>Sin sismos fuertes en la región</b><small>últimos 3 días · USGS</small></span></button>` : '';
  const n = Sismos.nivel(x);
  return `<button class="sismo-hero nv-${n}" data-a="abrir" data-v="sismos" title="El sismo que más importa de los últimos 3 días, según el USGS">
    ${I('sismo')}<span><b>Sismo M ${x.mag.toFixed(1)} · a ${x.km.toLocaleString('es-AR')} km · ${hace(x.at)}${x.tsunami ? ' · marca de tsunami' : ''}</b><small>${esc(x.lugar)}</small></span></button>`;
}

/* El radar: el barrio en el centro y cada sismo en su dirección y
   distancia (escala que se comprime lejos, para que entre la Antártida y
   Chile central a la vez). El tamaño del punto es la magnitud. */
function radarSismos(ls){
  const W = 320, C = W / 2, RMAX = 146, KMAX = 4200;
  const radio = km => RMAX * Math.sqrt(Math.min(km, KMAX) / KMAX);
  const anillos = [250, 1000, 2500].map(k => `<circle cx="${C}" cy="${C}" r="${radio(k).toFixed(1)}" class="rs-anillo"/><text x="${C + 3}" y="${(C - radio(k) + 11).toFixed(1)}" class="rs-txt">${k.toLocaleString('es-AR')} km</text>`).join('');
  const puntos = ls.slice().sort((a, b) => a.mag - b.mag).map(x => {
    const g = Sismos.grados(x.lat, x.lon) * Math.PI / 180, r = radio(x.km);
    const px = C + r * Math.sin(g), py = C - r * Math.cos(g), tam = Math.max(2.5, (x.mag - 3) * 3.2);
    const reciente = Date.now() - x.at < DIA;
    return `<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="${tam.toFixed(1)}" class="rs-punto nv-${Sismos.nivel(x)} ${reciente ? 'reciente' : ''}"><title>M ${x.mag.toFixed(1)} · ${esc(x.lugar)} · ${fechaHora(x.at)}</title></circle>`;
  }).join('');
  const rumbos = [['N', C, 12], ['S', C, W - 4], ['E', W - 10, C + 4], ['O', 4, C + 4]].map(([t, x, y]) => `<text x="${x}" y="${y}" class="rs-rumbo">${t}</text>`).join('');
  return `<svg viewBox="0 0 ${W} ${W}" class="radar-sismos" role="img" aria-label="Sismos de los últimos 15 días alrededor del barrio">
    ${anillos}${rumbos}<line x1="${C}" y1="10" x2="${C}" y2="${W - 10}" class="rs-eje"/><line x1="10" y1="${C}" x2="${W - 10}" y2="${C}" class="rs-eje"/>
    ${puntos}<circle cx="${C}" cy="${C}" r="5" class="rs-barrio"/><text x="${C + 8}" y="${C - 7}" class="rs-txt fuerte">Barrio</text></svg>`;
}

R.sismos = {
  titulo:'Sismos', icon:'sismo', color:'warn', ancha:true, sub:'En vivo · Argentina, Chile, Antártida y el Atlántico Sur',
  render(){
    const ls = Sismos.lista(), dest = Sismos.destacado();
    const ultimos = ls.slice(0, 60);
    const fila = x => { const n = Sismos.nivel(x);
      return `<a class="it sismo-fila" href="${esc(x.url)}" target="_blank" rel="noopener">
        <span class="sismo-mag nv-${n}">${x.mag.toFixed(1)}</span>
        <div class="txt"><b>${esc(x.lugar)}</b><span>${fechaHora(x.at)} h · a ${x.km.toLocaleString('es-AR')} km al ${x.rumbo} · ${x.prof} km de profundidad${x.tsunami ? ' · marca de tsunami' : ''}</span></div></a>`; };
    return `${!Sismos.d ? `<div class="vacio">${I('refresh')}Buscando los sismos de la región…</div>` : ''}
      ${dest ? `<div class="card sismo-dest nv-${Sismos.nivel(dest)}"><span class="sismo-mag grande nv-${Sismos.nivel(dest)}">${dest.mag.toFixed(1)}</span>
        <div class="grow"><small class="muted">El que más importa de los últimos 3 días</small><b>${esc(dest.lugar)}</b>
        <span class="small">${fechaHora(dest.at)} h · a ${dest.km.toLocaleString('es-AR')} km del barrio (${dest.rumbo}) · ${dest.prof} km de profundidad</span></div></div>` : ''}
      ${ls.some(x => x.tsunami && Date.now() - x.at < DIA) ? aviso('danger latido', 'alert', 'Hay un sismo con marca de tsunami en las últimas 24 horas',
        'La marca la pone el USGS de forma automática y no quiere decir que haya un tsunami en camino. La información oficial para la costa argentina es del Servicio de Hidrografía Naval.',
        `<a class="btn btn-xs btn-sec" href="https://www.hidro.gov.ar/" target="_blank" rel="noopener">${I('login')}Hidrografía Naval</a>`) : ''}
      ${ls.length ? `<div class="sismo-dos"><div class="card">${radarSismos(ls)}
          <div class="rs-leyenda"><span class="nv-rojo"><i></i>Importante</span><span class="nv-amarillo"><i></i>A tener en cuenta</span><span class="nv-verde"><i></i>Para saber</span></div>
          <p class="muted tiny" style="margin:6px 0 0">El barrio en el centro; cada punto, un sismo de los últimos 15 días en su dirección y distancia. Más grande, más fuerte.</p></div>
        <div>${sec('Últimos sismos', `<span class="muted small">${ls.length} en 15 días · M 3,5 o más</span>`)}<div class="card lista">${ultimos.map(fila).join('')}</div></div></div>` : ''}
      ${sec('Si tiembla')}
      <div class="card small">
        <p style="margin:0 0 6px"><b>Durante:</b> agachate, cubrite (bajo una mesa firme o junto a una pared interior) y agarrate hasta que pare. Lejos de ventanas y estanterías.</p>
        <p style="margin:0 0 6px"><b>Después:</b> cortá el gas y la luz si sentís olor a gas o ves daños; salí con calma y mirá cómo están tus vecinos.</p>
        <p style="margin:0"><b>En la costa:</b> si el sismo fue fuerte y largo, alejate del agua hacia lo alto sin esperar un aviso, y seguí lo que indique Defensa Civil (103).</p></div>
      ${sec('Fuentes oficiales')}
      ${superficie({ a:'link', v:'https://www.inpres.gob.ar/desktop/', icon:'sismo', color:'warn', t:'INPRES · sismos en Argentina', s:'Instituto Nacional de Prevención Sísmica' })}
      ${superficie({ a:'link', v:'https://www.sismologia.cl/', icon:'sismo', color:'warn', t:'Centro Sismológico Nacional de Chile', s:'Sismos en Chile, en tiempo real' })}
      ${superficie({ a:'link', v:'https://www.hidro.gov.ar/', icon:'alert', color:'sky', t:'Servicio de Hidrografía Naval', s:'Alertas de tsunami para la costa argentina' })}
      ${superficie({ a:'link', v:'https://earthquake.usgs.gov/earthquakes/map/?extent=-70,-100&extent=-15,-10', icon:'eye', color:'brand', t:'Mapa del USGS', s:'La fuente de esta ventana' })}
      <details class="card plana small como-funciona"><summary><b>${I('info')} ¿De dónde salen estos datos y cuándo avisa?</b></summary>
        <p>Del catálogo en vivo del Servicio Geológico de EE.UU. (USGS), que junta las estaciones de todo el mundo, incluidas las de Argentina y Chile. Un sismo aparece a los pocos minutos; la magnitud puede corregirse un poco en las horas siguientes. La app lo vuelve a leer cada 5 minutos mientras está abierta.</p>
        <p><b>Avisa con sonido</b> cuando hay uno fuerte en la región (magnitud 5 o más a menos de 1.500 km, 6,3 o más en cualquier lugar del recuadro) o uno moderado cerca (4 o más a menos de 350 km), y siempre que tenga marca de tsunami. Cada equipo avisa una sola vez por sismo.</p>
        <p><b>Nadie puede anunciar un sismo antes de que ocurra</b>: ni el USGS, ni el INPRES, ni ninguna aplicación. Lo que sí hay son avisos al instante, y eso es lo que hace esta ventana.</p></details>
      <button class="btn btn-sec btn-block" data-a="sismos-actualizar">${I('refresh')}Actualizar</button>
      ${Sismos.d ? `<p class="muted tiny center">Leído a las ${hora(Sismos.d.t)} h · USGS</p>` : ''}`;
  },
  alPintar(){ if (!Sismos.fresco()) Sismos.pedir().then(() => { if (PILA.at(-1)?.id === 'sismos') refrescar(); }); },
};
A['sismos-actualizar'] = () => Sismos.pedir(true).then(() => { refrescar(); toast('Sismos actualizados', 'refresh'); });
