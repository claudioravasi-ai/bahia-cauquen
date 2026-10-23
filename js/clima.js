/* =========================================================
   Clima de Ushuaia en vivo (Open-Meteo, gratis y sin clave)
   y la luz del día, que decide si la portada va de día o de noche.
   ========================================================= */
const Clima = {
  LAT: -54.81, LON: -68.33, KEY: 'bhc.clima',
  d: null, cargando: null,

  leerCache(){
    try { const c = JSON.parse(localStorage.getItem(this.KEY)); if (c && c.t) this.d = c; } catch(e){}
  },
  fresco(){ return this.d && Date.now() - this.d.t < 20 * MIN; },
  pedir(){
    if (this.fresco()) return Promise.resolve(this.d);
    if (this.cargando) return this.cargando;
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${this.LAT}&longitude=${this.LON}` +
      `&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m,wind_gusts_10m,wind_direction_10m,snowfall,precipitation,is_day` +
      `&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,snowfall_sum,wind_gusts_10m_max,precipitation_probability_max` +
      `&timezone=America%2FArgentina%2FUshuaia&forecast_days=4&wind_speed_unit=kmh`;
    this.cargando = fetch(url).then(r => r.ok ? r.json() : Promise.reject(r.status)).then(j => {
      this.d = { t: Date.now(), c: j.current, dd: j.daily };
      try { localStorage.setItem(this.KEY, JSON.stringify(this.d)); } catch(e){}
      return this.d;
    }).catch(() => this.d).finally(() => { this.cargando = null; });
    return this.cargando;
  },

  /* Sol: si hay datos del servicio se usan; si no, una tabla
     aproximada por mes para Ushuaia (hora local, UTC−3). */
  TABLA: [['05:30','22:00'],['06:40','21:10'],['07:50','20:00'],['08:50','18:50'],['09:40','17:40'],['10:05','17:10'],
          ['09:50','17:30'],['08:55','18:25'],['07:40','19:30'],['06:20','20:35'],['05:15','21:35'],['04:55','22:10']],
  sol(){
    const hoy = hoyISO();
    if (this.d && this.d.dd){
      const i = this.d.dd.time.indexOf(hoy);
      if (i >= 0) return { sale: this.d.dd.sunrise[i].slice(11, 16), pone: this.d.dd.sunset[i].slice(11, 16) };
    }
    const [sale, pone] = this.TABLA[new Date().getMonth()];
    return { sale, pone };
  },
  esDeDia(){ const { sale, pone } = this.sol(); const m = ahoraMin(); return m >= minutosDe(sale) && m < minutosDe(pone); },
  /* La portada va siempre con la foto de día: es la del barrio.
     (Para que vuelva a cambiar sola de día y de noche, poner:
      return this.esDeDia() ? 'img/portada-dia.jpg' : 'img/portada-noche.jpg';) */
  portada(){ return 'img/portada-dia.jpg'; },

  cod(c){
    if (c === 0) return ['Despejado', 'sun'];
    if (c <= 2) return ['Parcialmente nublado', 'sunCloud'];
    if (c === 3) return ['Nublado', 'cloud'];
    if (c <= 48) return ['Niebla', 'fog'];
    if (c <= 57) return ['Llovizna', 'rain'];
    if (c <= 67) return ['Lluvia', 'rain'];
    if (c <= 77) return ['Nieve', 'snow'];
    if (c <= 82) return ['Chaparrones', 'rain'];
    if (c <= 86) return ['Chaparrones de nieve', 'snow'];
    return ['Tormenta', 'storm'];
  },
  rumbo(g){ return ['N','NE','E','SE','S','SO','O','NO'][Math.round(((g % 360) / 45)) % 8]; },

  /* El motor de avisos: mira el pronóstico y dice qué hacer. */
  alertas(){
    const out = []; if (!this.d) return out;
    const c = this.d.c, dd = this.d.dd;
    const rafHoy = Math.max(c.wind_gusts_10m || 0, dd.wind_gusts_10m_max?.[0] || 0);
    if (rafHoy >= 80) out.push({ nivel:'danger', icon:'wind', t:`Viento muy fuerte: ráfagas de ${Math.round(rafHoy)} km/h`, x:'Guardá tachos, reposeras, trampolines y todo lo que pueda volar. Evitá estacionar bajo árboles.' });
    else if (rafHoy >= 60) out.push({ nivel:'warn', icon:'wind', t:`Ráfagas de ${Math.round(rafHoy)} km/h`, x:'Asegurá tachos y objetos sueltos del jardín.' });
    const minHoy = dd.temperature_2m_min?.[0], minMan = dd.temperature_2m_min?.[1];
    if ((c.temperature_2m ?? 9) <= 1 || (minHoy ?? 9) <= 0) out.push({ nivel:'warn', icon:'thermo', t:'Posible hielo en calles y veredas', x:'Precaución en las subidas y al salir con el auto temprano.' });
    else if ((minMan ?? 9) <= 0) out.push({ nivel:'info', icon:'thermo', t:`Mañana helada: mínima de ${Math.round(minMan)}°`, x:'Si podés, dejá el auto bajo techo esta noche.' });
    const nieve = (dd.snowfall_sum?.[0] || 0) + (dd.snowfall_sum?.[1] || 0);
    if (nieve >= 1) out.push({ nivel:'info', icon:'snow', t:`Nieve prevista: ${nieve.toFixed(0)} cm entre hoy y mañana`, x:'No dejes el auto en la calle así pasa el quitanieve.' });
    return out;
  },
};
Clima.leerCache();

/* =========================================================
   EL AGUA DEL CANAL BEAGLE (pedido de Claudio, 23-10-2026: "la temperatura
   del agua en tiempo real, con el dato más preciso, en el portal de
   ingreso donde están los datos del tiempo").
   No hay una boya pública en el Canal Beagle que mande la temperatura en
   vivo. El dato más preciso que se puede leer gratis es el del modelo del
   océano de Copernicus Marine (Mercator, cuadros de unos 8 km, con un
   decimal), que Open-Meteo entrega por hora junto con la altura de las
   olas. Se pide el cuadro de mar más cercano al barrio (cell_selection=sea)
   y se guarda una hora en este equipo. No lleva datos de nadie.
   Ideas de WeatherMaster (3,1k★, GPL-3.0: la tarjeta del mar con su
   tendencia) y de wttr.in (30,7k★, Apache-2.0: todo en un renglón); el
   código es propio.
   ========================================================= */
const Agua = {
  LAT: -54.86, LON: -68.30, KEY: 'bhc.agua',
  d: null, cargando: null,
  leerCache(){ try { const c = JSON.parse(localStorage.getItem(this.KEY)); if (c && c.t) this.d = c; } catch(e){} },
  fresco(){ return this.d && Date.now() - this.d.t < HORA; },
  pedir(){
    if (this.fresco()) return Promise.resolve(this.d);
    if (this.cargando) return this.cargando;
    const url = `https://marine-api.open-meteo.com/v1/marine?latitude=${this.LAT}&longitude=${this.LON}` +
      `&current=sea_surface_temperature,wave_height&hourly=sea_surface_temperature&past_days=1&forecast_days=1` +
      `&cell_selection=sea&timezone=America%2FArgentina%2FUshuaia`;
    this.cargando = fetch(url).then(r => r.ok ? r.json() : Promise.reject(r.status)).then(j => {
      const c = j.current || {}, temp = c.sea_surface_temperature;
      if (temp == null) return this.d;
      /* La de hace 24 horas, para decir si sube o baja. */
      const h = j.hourly || {}, i = aLista(h.time).indexOf(c.time && c.time.slice(0, 13) + ':00');
      const ayer = i >= 24 ? h.sea_surface_temperature[i - 24] : null;
      this.d = { t: Date.now(), temp, ayer: ayer ?? null, olas: c.wave_height ?? null };
      try { localStorage.setItem(this.KEY, JSON.stringify(this.d)); } catch(e){}
      return this.d;
    }).catch(() => this.d).finally(() => { this.cargando = null; });
    return this.cargando;
  },
  grados(v){ return v == null ? '' : v.toLocaleString('es-AR', { minimumFractionDigits:1, maximumFractionDigits:1 }) + '°'; },
  /* "baja 0,2° desde ayer", "igual que ayer" o nada. */
  tendencia(){
    const d = this.d; if (!d || d.ayer == null) return '';
    const dif = Math.round((d.temp - d.ayer) * 10) / 10;
    return Math.abs(dif) < .1 ? 'igual que ayer' : `${dif > 0 ? 'sube' : 'baja'} ${Math.abs(dif).toLocaleString('es-AR', { maximumFractionDigits:1 })}° desde ayer`;
  },
  html(){
    const d = this.d; if (!d || d.temp == null) return '';
    const tend = this.tendencia();
    return `${I('drop')}<b>${this.grados(d.temp)}</b><span>agua del Canal Beagle${tend ? ' · ' + tend : ''}</span>`;
  },
  FUENTE: 'Modelo del océano de Copernicus Marine (Mercator, cuadros de unos 8 km) vía Open-Meteo. Se actualiza cada hora; no es una boya.',
};
Agua.leerCache();
