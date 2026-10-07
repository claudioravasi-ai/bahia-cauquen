/* =========================================================
   EL ASISTENTE POR VOZ (pedido de Claudio, 26-09-2026)
   -------------------------------------------------------
   Después del saludo del escudo, la app abre el micrófono y el vecino le
   pide cosas simples en voz alta:
     "avisale a la garita que llego tarde"
     "publicá en el pizarrón que hay zorros sueltos"
     "mandale a la Administración que se cortó la luz en la calle 3"
     "¿cuánto debo de expensas?"  "¿cuándo pasa el camión?"
     "abrí mis visitas"  "autorizá una visita"  "llamá a la garita"
   REGLAS DE ORO
     · Nada se manda ni se publica sin que el vecino diga "sí" (o toque
       "Mandar"): el asistente repite lo que entendió y pregunta.
     · El SOS NO se pide por voz (una palabra mal entendida no puede
       disparar una alarma a todo el barrio): se le dice cómo hacerlo.
     · PRIVACIDAD (Ley 25.326): el reconocimiento de voz lo hace el
       navegador del teléfono. En Chrome/Android el audio lo procesa
       Google; en iPhone, Apple. Por eso la primera vez se explica y se pide
       permiso; la respuesta queda en ESTE equipo y se cambia desde Tu
       cuenta. La app no guarda el audio: usa solo el texto para hacer lo
       pedido.
   Es para quien está como vecino: la garita y el hotel tienen el saludo,
   no el asistente.
   ========================================================= */
const Asistente = {
  KEY:'bhc.asistente', rec:null, escuchando:false,
  soportado(){ return !!(window.SpeechRecognition || window.webkitSpeechRecognition); },
  permiso(){ try { return localStorage.getItem(this.KEY); } catch(e){ return null; } },
  poner(v){ try { if (v) localStorage.setItem(this.KEY, v); else localStorage.removeItem(this.KEY); } catch(e){} },
  paraMi(){ const u = yo(); return !!u && !esStaff() && !esHotel() && !esSupervisor() && u.estado === 'aprobado'; },

  /* Hablar con la misma voz del saludo; `luego` corre cuando termina. */
  decir(texto, luego){
    const fin = () => { if (luego) setTimeout(luego, 250); };
    if (!('speechSynthesis' in window)){ fin(); return; }
    try {
      speechSynthesis.cancel();
      const d = new SpeechSynthesisUtterance(texto), v = Saludo.voz();
      if (v){ d.voice = v; d.lang = v.lang; } else d.lang = 'es-ES';
      d.rate = 1; d.pitch = 1;
      let listo = false; const una = () => { if (!listo){ listo = true; fin(); } };
      d.onend = una; d.onerror = una;
      /* Algunos navegadores no avisan el final: por las dudas, un tope. */
      setTimeout(una, Math.min(15000, 1200 + texto.length * 75));
      speechSynthesis.speak(d);
    } catch(e){ fin(); }
  },

  /* =========================================================
     iPHONE Y iPAD (Claudio, 27-09: "en el iPad el registro de voz no me
     capta lo que pido, se traba la app y debo salir bruscamente")
     Safari no deja abrir el micrófono si no es con un TOQUE: al terminar
     el saludo se abría solo y quedaba colgado "escuchando". Además el
     reconocimiento de Apple puede no tener el acento "es-AR" y ese error
     no se atendía. Ahora, en iPhone y iPad:
       · el micrófono se abre SOLO al tocar el botón del micrófono;
       · el "sí/no" de una confirmación se contesta con los botones;
       · se prueba otro acento de español si el primero no está.
     Y en todos los equipos: si el micrófono no arranca en 5 s, si hay
     2,5 s de silencio después de hablar o si pasan 12 s, se corta solo y
     se usa lo que se alcanzó a entender. Tocar cualquier otra parte de la
     app también lo corta: nunca más queda la app esperando.
     ========================================================= */
  esApple(){ return typeof Push !== 'undefined' && Push.esIOS ? Push.esIOS() : /iPad|iPhone|iPod/.test(navigator.userAgent); },
  IDIOMAS(){ return this.esApple() ? ['es-MX', 'es-ES', 'es-US'] : ['es-AR', 'es-US', 'es-ES']; },
  idioma(){ let i = 0; try { i = +localStorage.getItem(this.KEY + '.idioma') || 0; } catch(e){} const l = this.IDIOMAS(); return l[Math.min(i, l.length - 1)]; },
  otroIdioma(){ try { const i = (+localStorage.getItem(this.KEY + '.idioma') || 0) + 1; if (i < this.IDIOMAS().length){ localStorage.setItem(this.KEY + '.idioma', String(i)); return true; } } catch(e){} return false; },

  /* Se llama al terminar el saludo del escudo. */
  alSaludar(){
    if (!this.paraMi() || !this.soportado()) return;
    const p = this.permiso();
    if (p === 'si'){ if (this.esApple()) this.panel('', 'Tocá el micrófono y decime qué necesitás'); else this.escuchar(); }
    else if (!p) this.pedirPermiso();
  },
  pedirPermiso(){
    hoja('Asistente por voz', `<div class="asis-intro">${I('volume')}<div><b>¿Querés pedirle cosas a la app con la voz?</b>
        <span>Después del saludo se abre el micrófono y podés decir, por ejemplo: "avisale a la garita que llego tarde" o "publicá en el pizarrón que hay zorros sueltos". Antes de mandar o publicar algo, la app te lo repite y te pregunta.</span></div></div>
      ${aviso('info', 'lock', 'Tu voz y tus datos', 'El reconocimiento de voz lo hace tu teléfono: en Android y Chrome, el audio lo procesa Google; en iPhone, Apple. La app del barrio no guarda el audio: usa solo el texto para hacer lo que pediste. Podés apagarlo cuando quieras en Tu cuenta.')}
      <div class="btns" style="margin-top:12px"><button class="btn btn-pri grow" data-a="asistente-si">${I('check')}Sí, activarlo</button><button class="btn btn-sec grow" data-a="asistente-no">Ahora no</button></div>`, { ancho:'480px' });
  },

  /* ---------- escuchar ---------- */
  panel(estado, texto = '', botones = ''){
    let el = $('#asistente');
    if (!el){ el = document.createElement('div'); el.id = 'asistente'; el.className = 'asistente'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Asistente por voz'); document.body.appendChild(el); }
    el.innerHTML = `<div class="asis-caja ${estado}"><button class="asis-mic" data-a="asistente-hablar" aria-label="Hablar">${I('volume')}</button>
      <div class="asis-txt"><small>${estado === 'oye' ? 'Te escucho…' : estado === 'piensa' ? 'Entendí:' : estado === 'pregunta' ? '¿Lo hago?' : 'Asistente'}</small><b>${texto || 'Decime qué necesitás'}</b></div>
      <button class="cerrar" data-a="asistente-cerrar" aria-label="Cerrar">${I('x')}</button>
      ${botones ? `<div class="asis-btns">${botones}</div>` : ''}</div>`;
  },
  /* Corta la escucha sin esperar nada del navegador. */
  cortar(msg){
    const r = this.rec; this.rec = null; this.escuchando = false;
    [this.vigia, this.tope, this.silencio].forEach(t => clearTimeout(t));
    if (r){ r.onresult = r.onerror = r.onend = r.onaudiostart = null; try { r.abort(); } catch(e){} }
    if (msg && $('#asistente')) this.panel('', msg);
  },
  cerrar(){ this.cortar(); try { if ('speechSynthesis' in window) speechSynthesis.cancel(); } catch(e){} this.pendiente = null; $('#asistente')?.remove(); },
  escuchar(alTerminar){
    if (!this.soportado()){ toast('Este navegador no tiene reconocimiento de voz', 'alert'); return; }
    this.cortar();
    /* Hablar y escuchar a la vez traba el audio en el iPhone y el iPad. */
    try { if ('speechSynthesis' in window && (speechSynthesis.speaking || speechSynthesis.pending)) speechSynthesis.cancel(); } catch(e){}
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    let r; try { r = new SR(); } catch(e){ this.panel('', 'Este equipo no deja usar el reconocimiento de voz.'); return; }
    r.lang = this.idioma(); r.interimResults = true; r.maxAlternatives = 1; r.continuous = false;
    let final = '', parcial = '', termino = false, arranco = false;
    this.rec = r; this.escuchando = true;
    this.panel('oye', alTerminar ? 'Decí "sí" o "no"' : '');
    const usar = () => { if (termino) return; termino = true; const t = (final || parcial).trim(); this.cortar(t ? '' : 'No te escuché. Tocá el micrófono para probar de nuevo.');
      if (t){ if (alTerminar) alTerminar(t); else this.interpretar(t); } };
    r.onaudiostart = () => { arranco = true; };
    r.onresult = e => { arranco = true; let t = ''; for (let i = 0; i < e.results.length; i++){ t += e.results[i][0].transcript; if (e.results[i].isFinal) final = t; }
      parcial = t; const b = $('#asistente .asis-txt b'); if (b) b.textContent = t;
      /* Si el navegador no marca el final (pasa en el iPad), 2,5 s de silencio alcanzan. */
      clearTimeout(this.silencio); this.silencio = setTimeout(usar, 2500); };
    r.onerror = e => { if (termino) return; termino = true;
      if (e.error === 'language-not-supported' && this.otroIdioma()){ this.cortar('Tocá el micrófono de nuevo: pruebo con otro acento de español.'); return; }
      const m = { 'not-allowed':'Tocá el micrófono para hablar (el equipo pidió permiso para usarlo).',
        'service-not-allowed': this.esApple() ? 'El iPhone o iPad no dejó usar el reconocimiento de voz. Revisá en Configuración que Safari tenga permiso de micrófono y que el Dictado esté activado, o usá los botones.' : 'El navegador no dejó usar el reconocimiento de voz.',
        'no-speech':'No te escuché. Tocá el micrófono para probar de nuevo.', 'audio-capture':'No encuentro el micrófono de este equipo.',
        'network':'Hace falta internet para entender la voz. Probá de nuevo.', 'aborted':'' }[e.error];
      this.cortar(m === '' ? '' : m || 'No pude escucharte. Tocá el micrófono para probar de nuevo.'); };
    r.onend = () => usar();
    /* Vigías: el micrófono que no arranca y la escucha que no termina nunca. */
    this.vigia = setTimeout(() => { if (!termino && !arranco){ termino = true; this.cortar(this.esApple() ? 'El micrófono no arrancó. Tocá el botón del micrófono para hablar.' : 'El micrófono no respondió. Tocá el micrófono para probar de nuevo.'); } }, 5000);
    this.tope = setTimeout(usar, 12000);
    try { r.start(); } catch(e){ termino = true; this.cortar('Tocá el micrófono para hablar'); }
  },

  /* ---------- entender ---------- */
  EJEMPLOS:['avisale a la garita que llego tarde', 'publicá en el pizarrón que hay zorros sueltos', '¿cuánto debo de expensas?', '¿cuándo pasa el camión?', 'abrí mis visitas'],
  VENTANAS:[
    [/expensa|cupon|cupón|pagar/, 'expensas'], [/visita/, 'visitas'],
    [/vuelo|avion|avión|aeropuerto/, 'vuelos'], [/crucero|barco/, 'cruceros'], [/clima|tiempo|pronostico|pronóstico/, 'ushuaia'], [/pizarr/, 'pizarron'],
    [/emergencia|telefono|teléfono/, 'emergencias'], [/agenda|taxi|remis|farmacia/, 'agenda'], [/manual|ayuda/, 'manual'],
    [/norma|reglament/, 'documentos'], [/residuo|basura|camion|camión/, 'recoleccion'], [/mensaje|chat/, 'mensajes'], [/votaci/, 'votaciones'], [/obra/, 'obras'],
    [/reclamo/, 'reclamos'], [/peticion|petición/, 'peticiones'], [/mi casa|mis datos|perfil/, 'perfil'],
  ],
  /* Lo que viene después de "que" ("avisale a la garita QUE llego tarde"). */
  mensaje(t, tras){
    const m = t.match(new RegExp(`${tras}[^,]*?\\bque\\s+(.+)$`, 'i')) || t.match(/\bque\s+(.+)$/i) || t.match(new RegExp(`${tras}\\s*[:,]?\\s*(.+)$`, 'i'));
    let x = m ? m[1].trim() : '';
    x = x.replace(/^(le |les |a la |al )/i, '').trim();
    return x ? x.charAt(0).toUpperCase() + x.slice(1) : '';
  },
  interpretar(original){
    const t = normTxt(original), u = yo();
    this.panel('piensa', esc(original));
    /* El SOS no se pide por voz. */
    if (/\b(sos|emergencia|auxilio|socorro|ambulancia|incendio|fuego)\b/.test(t) && !/telefono|numero/.test(t))
      return this.responder('Para una emergencia, mantené apretado el botón rojo SOS tres segundos, o llamá al 911. Te abro Emergencias.', () => abrir('emergencias'));
    /* Mensaje a la garita. */
    if (/(garita|guardia)/.test(t) && /(avis|deci|dec[ií]|mand|mensaje|escrib|cont)/.test(t)){
      const m = this.mensaje(original, '(?:garita|guardia)');
      if (!m) return this.responder('¿Qué le digo a la garita? Probá: avisale a la garita que llego tarde.');
      return this.confirmar(`Le mando a la garita: ${m}. ¿Lo mando?`, 'Mandar a la garita', () => { F['privado']({ text:m }, { dataset:{ u:u.id, con:'guardia' } }); return 'Listo, la garita ya lo tiene.'; });
    }
    /* Mensaje a la Administración. */
    if (/(administracion|admin\b)/.test(t) && /(avis|deci|dec[ií]|mand|mensaje|escrib|cont|reclam)/.test(t)){
      const m = this.mensaje(original, '(?:administraci[oó]n)');
      if (!m) return this.responder('¿Qué le digo a la Administración?');
      return this.confirmar(`Le mando a la Administración: ${m}. ¿Lo mando?`, 'Mandar a la Administración', () => { F['privado']({ text:m }, { dataset:{ u:u.id, con:'admin' } }); return 'Listo, la Administración ya lo tiene.'; });
    }
    /* Publicar en el pizarrón. */
    if (/(pizarr|vecinos|barrio)/.test(t) && /(public|pone|pon[eé]|mand|avis|escrib|deci|dec[ií])/.test(t)){
      const m = this.mensaje(original, '(?:pizarr[oó]n|pizarra|vecinos|barrio)');
      if (!m) return this.responder('¿Qué publico en el pizarrón?');
      const animal = /(zorro|perro|castor|caballo)/.exec(normTxt(m));
      return this.confirmar(`Publico en el pizarrón: ${m}. ¿Lo publico?`, 'Publicar', () => {
        F['nuevo-post']({ type:'aviso', title:m.slice(0, 80), body:'' });
        if (animal) Store.cambiar(s => s.avistamientos.unshift({ id:uid(), especie: animal[1] === 'zorro' ? 'zorro' : animal[1] === 'castor' ? 'castor' : animal[1] === 'caballo' ? 'caballo' : 'perros', lugar:'Aviso por voz', userId:u.id, at:Date.now() }));
        return 'Listo, ya está en el pizarrón.'; });
    }
    /* Consultas que se contestan en voz alta. */
    if (/(cuanto|debo|deuda|saldo)/.test(t) && /(debo|expensa|deuda|saldo|pagar)/.test(t) && typeof aPagar === 'function'){
      const p = aPagar(miLote()), total = Math.max(0, p.total || 0);
      return this.responder(total > 0 ? `Tu lote debe ${Math.round(total).toLocaleString('es-AR')} pesos${p.vto1 ? ', con vencimiento el ' + fechaLarga(p.vto2 && hoyISO() > p.vto1 ? p.vto2 : p.vto1).toLowerCase() : ''}. Te abro tus expensas.` : 'Tu lote no debe nada. Estás al día.', () => abrir('expensas'));
    }
    if (/camion|basura|residuo|recoleccion/.test(t) && /(cuando|pasa|dia|hoy|manana)/.test(t))
      return this.responder(`${typeof proxRecoleccion === 'function' ? proxRecoleccion() : 'Mirá los días en Residuos'}.`);
    if (/paquete|correo/.test(t) && !hayPaquetes()) return this.responder('La garita no recibe paquetes ni correo de los vecinos: el barrio no lo tiene habilitado.');
    if (/paquete/.test(t) && /(tengo|hay|llego|alguno|algun)/.test(t)){
      const n = paquetesDelLote(u).filter(p => !p.retirado).length;
      return this.responder(n ? `Sí, ${n === 1 ? 'hay un paquete' : 'hay ' + n + ' paquetes'} de tu lote en la garita. Te muestro el QR para retirarlo.` : 'No hay paquetes de tu lote en la garita.', n ? () => { abrir('mis-paquetes'); A['retiro-qr'](); } : null);
    }
    if (/(qr|codigo).*(retir)|retir.*(paquete)/.test(t)) return this.responder('Te muestro tu QR para retirar.', () => A['retiro-qr']());
    if (/(que hora|la hora|temperatura|grados|hace frio|clima de hoy)/.test(t)) return this.responder(Saludo.texto().replace(/^.*?\?\s*/, '').replace(/^Ahora/, 'Ahora'));
    if (/(autoriz|viene|va a venir|anunci).*(visita|alguien|a )|autoriz/.test(t)){
      const nom = (original.match(/autoriz\S*\s+(?:a\s+)?([A-ZÁÉÍÓÚÑ][\wáéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][\wáéíóúñ]+)?)/) || [])[1] || '';
      return this.responder(nom ? `Abro el pase para ${nom}. Completá el horario y tocá Crear el pase.` : 'Abro el formulario para autorizar una visita.', () => { A['nuevo-pase'](); if (nom) setTimeout(() => { const i = $('#hoja input[name="nombre"]'); if (i) i.value = nom; }, 80); });
    }
    if (/(llama|llamar|llamá)/.test(t) && /(garita|guardia)/.test(t)){
      const tel = typeof telGarita === 'function' ? telGarita() : '';
      return this.responder(tel ? 'Llamo a la garita.' : 'No tengo cargado el teléfono de la garita. Te abro Emergencias.', () => { if (tel) location.href = telLink(tel); else abrir('emergencias'); });
    }
    if (/(que (podes|puedes|sabes)|ayuda|como funciona)/.test(t)) return this.responder(`Puedo, por ejemplo: ${this.EJEMPLOS.slice(0, 4).join('; ')}.`);
    /* Abrir una ventana. */
    const v = this.VENTANAS.find(([re]) => re.test(t));
    if (v && ventanaPermitida(v[1]) && R[v[1]]) return this.responder(`Te abro ${titulo(R[v[1]], '')}.`, () => abrir(v[1]));
    return this.responder('No te entendí bien. Podés decirme, por ejemplo: avisale a la garita que llego tarde, o publicá en el pizarrón que hay zorros sueltos.');
  },

  /* ---------- responder y confirmar ---------- */
  responder(texto, accion){
    this.panel('', esc(texto), `<button class="btn btn-sm btn-sec" data-a="asistente-hablar">${I('volume')}Otra cosa</button>`);
    this.decir(texto);
    if (accion) setTimeout(() => { try { accion(); } catch(e){ avisarFalla(e, 'asistente'); } }, 400);
  },
  confirmar(pregunta, boton, hacer){
    this.pendiente = hacer;
    this.panel('pregunta', esc(pregunta), `<button class="btn btn-sm btn-ok" data-a="asistente-confirmar">${I('check')}${esc(boton)}</button><button class="btn btn-sm btn-sec" data-a="asistente-cerrar">No</button>`);
    /* En iPhone y iPad el "sí" se toca: abrir el micrófono solo lo traba. */
    if (this.esApple()){ this.decir(pregunta); return; }
    this.decir(pregunta, () => { if (!this.pendiente || !$('#asistente')) return;
      this.escuchar(r => { const x = normTxt(r); if (/\b(si|dale|mandalo|mandar|publicalo|ok|claro|correcto|hacelo)\b/.test(x)) A['asistente-confirmar'](); else if (/\b(no|cancel|deja|nada)\b/.test(x)){ this.decir('Listo, no hago nada.'); this.cerrar(); }
        else this.panel('pregunta', esc(pregunta), `<button class="btn btn-sm btn-ok" data-a="asistente-confirmar">${I('check')}${esc(boton)}</button><button class="btn btn-sm btn-sec" data-a="asistente-cerrar">No</button>`); }); });
  },
};
/* Tocar cualquier otra cosa de la app mientras escucha, o salir de la app,
   corta el micrófono: la app nunca queda esperando. */
document.addEventListener('pointerdown', e => { if (Asistente.escuchando && !e.target.closest('#asistente')) Asistente.cortar('Listo, dejé de escuchar. Tocá el micrófono para hablar.'); }, true);
document.addEventListener('visibilitychange', () => { if (document.hidden && $('#asistente')) Asistente.cerrar(); });
A['asistente-si'] = () => { Asistente.poner('si'); cerrarHoja(); toast('Asistente por voz activado en este equipo', 'volume'); Asistente.escuchar(); };
A['asistente-no'] = () => { Asistente.poner('no'); cerrarHoja(); toast('Listo. Lo podés activar cuando quieras en Tu cuenta.', 'check'); };
A['asistente-hablar'] = () => { if (Asistente.permiso() !== 'si'){ Asistente.pedirPermiso(); return; } Asistente.escuchar(); };
A['asistente-cerrar'] = () => { try { speechSynthesis.cancel(); } catch(e){} Asistente.cerrar(); };
A['asistente-confirmar'] = () => { const f = Asistente.pendiente; Asistente.pendiente = null; if (!f) return;
  try { const r = f(); Asistente.panel('', esc(r || 'Listo.')); Asistente.decir(r || 'Listo.'); setTimeout(() => Asistente.cerrar(), 4000); } catch(e){ avisarFalla(e, 'asistente'); } };
A['asistente-ajuste'] = () => { const on = Asistente.permiso() === 'si'; Asistente.poner(on ? 'no' : 'si'); toast(on ? 'Asistente por voz apagado en este equipo' : 'Asistente por voz activado: tocá el escudo para hablarle', 'volume'); if (hojaAbierta()) A['mi-cuenta'](); };
