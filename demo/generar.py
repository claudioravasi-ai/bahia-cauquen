#!/usr/bin/env python3
"""Arma demo/demo-portales.html: una copia de la app que funciona sola, para
mandar por correo o WhatsApp y mostrar los portales de Anestesiología,
Enfermería e Instrumentación (y la vista de la Jefatura).

  · No toca la app ni la base: corre en modo local y guarda todo en una
    memoria propia que se borra al cerrar o recargar la página.
  · Trae datos de ejemplo inventados (ningún paciente real).
  · Un selector flotante cambia de rol sin contraseñas.

Uso:  python3 demo/generar.py   (desde la carpeta de la app)
"""
import base64, pathlib
raiz = pathlib.Path(__file__).resolve().parent.parent
s = (raiz / 'index.html').read_text(encoding='utf-8')
foto = 'data:image/jpeg;base64,' + base64.b64encode((raiz / 'equipo-quirurgico.jpg').read_bytes()).decode()
s = s.replace('equipo-quirurgico.jpg', foto)

CABEZA = r'''<script>
/* DEMO: memoria propia (nada queda guardado en el navegador) y modo local. */
(function () {
  const m = {};
  const mem = { getItem: (k) => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v); }, removeItem: (k) => { delete m[k]; },
    clear: () => { Object.keys(m).forEach((k) => delete m[k]); }, key: (i) => Object.keys(m)[i] || null, get length() { return Object.keys(m).length; } };
  try { Object.defineProperty(window, 'localStorage', { value: mem, configurable: true }); } catch (e) {}
  try { if (!/[?&]local/.test(location.search)) history.replaceState(null, '', location.pathname + '?local' + (location.hash || '#anestesia')); } catch (e) {}
  try { if (navigator.serviceWorker) navigator.serviceWorker.register = () => Promise.reject(new Error('demo')); } catch (e) {}
})();
</script>
'''
PIE = r'''<script>
/* ================= DEMO DE LOS PORTALES ================= */
(function () {
  const hoy = hoyISO(), ym = hoy.slice(0, 7);
  function sembrar() {
  const base = { cuenta: 'aprobado', mailVerificado: true, matricula: { numero: 'MP 0000 (TDF)', vigente: true }, seguro: { vence: sumarDias(hoy, 200) },
    rcp: { tipo: 'Avanzado (ACLS)', fecha: sumarDias(hoy, -120) }, vacunas: { hepB: true, dobleAdultos: true, influenza: true, covid: true },
    compromiso: { v: typeof COMPROMISO_VERSION !== 'undefined' ? COMPROMISO_VERSION : 1, t: hoy, noMostrar: true } };
  const gente = [
    ['jefa.anestesia@demo.hru', 'Dra. Sofía Bianchi', 'anestesiologia', { jefeAnest: true, especialista: { titulo: 'Especialista en Anestesiología', si: true } }],
    ['anestesia2@demo.hru', 'Dr. Tomás Arce', 'anestesiologia', { especialista: { titulo: 'Especialista en Anestesiología', si: true } }],
    ['anestesia3@demo.hru', 'Dra. Lucía Paz', 'anestesiologia', { especialista: { titulo: 'Especialista en Anestesiología', si: true } }],
    ['enfermeria@demo.hru', 'Lic. Marta Ruiz', 'enfermeria', {}],
    ['enfermeria2@demo.hru', 'Enf. Jorge Sosa', 'enfermeria', {}],
    ['instrumentacion@demo.hru', 'Inst. Carla Gómez', 'instrumentacion', {}],
    ['instrumentacion2@demo.hru', 'Inst. Diego Vera', 'instrumentacion', {}],
    ['cirujano@demo.hru', 'Dr. Pablo Ferrari', 'medico', { servicio: 'Cirugía General', servicios: ['Cirugía General'], especialista: { titulo: 'Especialista en Cirugía General', si: true } }],
  ];
  gente.forEach(([e, n, f, x]) => {
    if (DB.usuarios.find((u) => u.email === e)) return;
    const u = Object.assign({}, base, { id: claveMail(e), email: e, nombre: n, funcion: f, servicio: f === 'medico' ? 'Cirugía General' : FUNCIONES[f].serv, servicios: [f === 'medico' ? 'Cirugía General' : FUNCIONES[f].serv] }, x);
    if (f === 'medico') delete u.funcion;
    DB.usuarios.push(u);
  });
  const K = (e) => claveMail(e);
  const cx = (id, d, sala, hora, proc, pac, extra) => Object.assign({ id, fecha: d, horaProg: hora, estado: 'validada', prioridad: 6, tipo: 'programada', servicio: sala === 'END' ? 'Gastroenterología' : sala === 'QOBS' ? 'Obstetricia' : 'Cirugía General',
    sala, quirofano: SALAS.find((s) => s.id === sala).nombre, paciente: { nombre: pac, dni: '00000000' }, procedimiento: proc, cirujano: 'Dr. Pablo Ferrari', cirujanoEmail: 'cirujano@demo.hru',
    coordinacion: { anestesia: true }, historial: [{ t: hoy + 'T07:00', a: 'Cirugía de ejemplo del demo' }] }, extra || {});
  const lista = [
    cx(970001, hoy, 'Q1', '08:00', 'Apendicectomía laparoscópica', 'Paciente de ejemplo A', { anest: { n: 'Dr. Tomás Arce', e: 'anestesia2@demo.hru', t: hoy + 'T07:40' },
      equipoSala: { circulante: { nombre: 'Lic. Marta Ruiz', email: 'enfermeria@demo.hru', t: hoy + 'T07:30' }, instrumentadora: { nombre: 'Inst. Carla Gómez', email: 'instrumentacion@demo.hru', t: hoy + 'T07:35' } },
      lvq: { entrada: { done: true, hora: hoy + 'T07:55', por: { nombre: 'Lic. Marta Ruiz', email: 'enfermeria@demo.hru' }, anestesiologo: 'Dr. Tomás Arce' }, firmasAnest: { entrada: { nombre: 'Dr. Tomás Arce', email: 'anestesia2@demo.hru', t: hoy + 'T07:56' } } },
      tiempos: { ia: '08:05', inc: '08:22' } }),
    cx(970002, hoy, 'Q2', '09:00', 'Colecistectomía laparoscópica', 'Paciente de ejemplo B', { equipoSala: { instrumentadora: { nombre: 'Inst. Diego Vera', email: 'instrumentacion2@demo.hru', t: hoy + 'T08:00' } } }),
    cx(970003, hoy, 'Q3', '10:00', 'Hernioplastia inguinal', 'Paciente de ejemplo C'),
    cx(970004, hoy, 'END', '08:30', 'Videocolonoscopía', 'Paciente de ejemplo D'),
    cx(970005, hoy, 'QOBS', '11:00', 'Cesárea programada', 'Paciente de ejemplo E'),
  ];
  // Algunas cirugías ya hechas en el mes, con tiempos reales, para los indicadores.
  for (let i = 1; i <= 8; i++) {
    const d = ym + '-' + String(Math.min(28, i * 3)).padStart(2, '0'); if (d >= hoy) break;
    const h = 8 + (i % 4) * 2, prog = String(h).padStart(2, '0') + ':00', dem = [5, 20, 0, 12, 35, 8, 3, 15][i - 1];
    const ia = String(h).padStart(2, '0') + ':' + String(dem).padStart(2, '0');
    lista.push(cx(970100 + i, d, ['Q1', 'Q2', 'Q3', 'END'][i % 4], prog, 'Cirugía de ejemplo ' + i, 'Paciente de ejemplo ' + i,
      { estado: 'finalizada', anest: { n: 'Dra. Sofía Bianchi', e: 'jefa.anestesia@demo.hru', t: d + 'T07:30' }, tiempos: { ia, inc: String(h).padStart(2, '0') + ':' + String(Math.min(59, dem + 20)).padStart(2, '0'), fin: String(h + 1).padStart(2, '0') + ':30', sal: String(h + 1).padStart(2, '0') + ':45' },
        aldrete: { a: 2, r: 2, c: 2, cs: 2, o: i % 3 ? 2 : 1, tot: i % 3 ? 10 : 9, t: d + 'T10:00', por: 'Dra. Sofía Bianchi' } }));
  }
  lista.forEach((c) => { if (!DB.cirugias.find((x) => x.id === c.id)) DB.cirugias.push(c); });
  // Disponibilidad del mes que corre, validada, y la del próximo, en borrador.
  const disp = (mes, est, llenarHasta) => {
    const b = { est, d: {}, p: {}, h: [hoy + 'T09:00|Dra. Sofía Bianchi|Cargó la disponibilidad (demo)'], t: hoy + 'T09:00', por: 'Dra. Sofía Bianchi' };
    const k = ['jefa.anestesia@demo.hru', 'anestesia2@demo.hru', 'anestesia3@demo.hru'].map(K);
    k.forEach((x, i) => { b.p[x] = ['Dra. Sofía Bianchi', 'Dr. Tomás Arce', 'Dra. Lucía Paz'][i]; });
    for (let i = 1; i <= Math.min(llenarHasta, diasDelMes(mes)); i++) {
      const d = mes + '-' + String(i).padStart(2, '0'), auto = diaUrgAutomatica(d, b), m = {};
      anestFilas().filter((s) => anestRequeridas(d, b).includes(s.id)).forEach((s, j) => { if ((i + j) % 7) m[s.id] = k[(i + j) % 3]; });
      dispSetDia(b, d, m);
    }
    return b;
  };
  localStorage.setItem('hruq_anest', JSON.stringify({ disp: { [ym]: disp(ym, 'validada', 31), [mesSiguiente(ym)]: disp(mesSiguiente(ym), 'borrador', 12) },
    pres: { [hoy]: { [K('anestesia2@demo.hru')]: { n: 'Dr. Tomás Arce', t: hoy + 'T07:40', cx: '970001', h: ['07:40|llegada', '07:40|+970001'] } } } }));
  anestCache.disp = {}; anestCache.pres = {};
  }

  const ROLES = [
    { k: 'jefaAnest', n: 'Jefa de Anestesiología', d: 'Asistente de 4 pasos para la disponibilidad del mes; también anestesia', u: 'jefa.anestesia@demo.hru', ir: 'anestesia', i: '💤' },
    { k: 'anest', n: 'Anestesiólogo', d: 'Marca su llegada y sigue el recorrido de sus cirugías: equipo, firmas, tiempos y Aldrete', u: 'anestesia3@demo.hru', ir: 'anestesia', i: '😴' },
    { k: 'enf', n: 'Enfermería', d: 'Recorrido paso a paso: Entrada, Pausa, cofirma del recuento y Salida', u: 'enfermeria@demo.hru', ir: 'sala', i: '🧭' },
    { k: 'ins', n: 'Instrumentación', d: 'Recuentos con − / +, cajas e insumos', u: 'instrumentacion@demo.hru', ir: 'sala', i: '🧰' },
    { k: 'jefe', n: 'Jefatura de Quirófanos', d: 'Recorrido del día de todas las cirugías; avisa y valida la disponibilidad', jefe: true, ir: 'portales', i: '🏥' },
    { k: 'dir', n: 'Dirección Médica', d: 'Los mismos portales, solo para mirar', director: true, ir: 'portales', i: '🔎' },
  ];
  window.demoRol = function (k) {
    const r = ROLES.find((x) => x.k === k); if (!r) return;
    jefe = !!r.jefe; director = !!r.director;
    if (r.u) sessionStorage.setItem('hru_user', r.u); else sessionStorage.removeItem('hru_user');
    anestPincel = null; anestFoco = null; anestTab = 'hoy'; salaAbierta = null;
    try { remLista = calcRecordatorios(); } catch (e) {}
    document.querySelectorAll('.demo-rol').forEach((b) => b.classList.toggle('on', b.dataset.k === k));
    const p = document.getElementById('demo-panel'); if (p && window.innerWidth < 760) p.classList.remove('abierto');
    go(r.ir);
  };
  const css = document.createElement('style');
  css.textContent = `
  #demo-panel { position: fixed; right: 12px; top: 70px; z-index: 9999; width: 290px; max-width: calc(100vw - 24px); font-family: system-ui, -apple-system, sans-serif;
    border-radius: 18px; background: rgba(15,23,42,.94); color: #e2e8f0; box-shadow: 0 24px 50px -20px rgba(0,0,0,.6); border: 1px solid rgba(255,255,255,.12); overflow: hidden; }
  #demo-panel header { display: flex; align-items: center; gap: 8px; padding: 10px 12px; cursor: pointer; background: linear-gradient(120deg, #7c3aed, #db2777); }
  #demo-panel header b { flex: 1; font-size: .85rem; } #demo-panel header small { font-size: .65rem; opacity: .9; }
  #demo-panel .cuerpo { display: none; padding: 8px; max-height: 70vh; overflow: auto; } #demo-panel.abierto .cuerpo { display: block; }
  #demo-panel p { margin: 4px 6px 8px; font-size: .72rem; color: #94a3b8; line-height: 1.4; }
  .demo-rol { display: flex; gap: 9px; width: 100%; text-align: left; padding: 8px; margin-bottom: 4px; border-radius: 12px; border: 1px solid transparent; background: rgba(255,255,255,.05); color: #e2e8f0; cursor: pointer; font-family: inherit; }
  .demo-rol:hover { background: rgba(255,255,255,.1); } .demo-rol.on { border-color: #a78bfa; background: rgba(167,139,250,.18); }
  .demo-x { margin-left: 6px; width: 22px; height: 22px; border-radius: 50%; display: grid; place-items: center; background: rgba(0,0,0,.25); font-size: .7rem; }
  #demo-mini { display: none; position: fixed; right: 12px; top: 70px; z-index: 9999; width: 44px; height: 44px; place-items: center; border-radius: 50%; border: 0; cursor: pointer; font-size: 1.3rem; background: linear-gradient(120deg, #7c3aed, #db2777); box-shadow: 0 10px 24px -10px rgba(0,0,0,.5); }
  .demo-rol i { font-style: normal; font-size: 1.2rem; } .demo-rol b { display: block; font-size: .8rem; } .demo-rol small { display: block; font-size: .68rem; color: #94a3b8; line-height: 1.3; }`;
  document.head.appendChild(css);
  const panel = document.createElement('div');
  panel.id = 'demo-panel'; panel.className = 'abierto';
  panel.innerHTML = `<header onclick="this.parentNode.classList.toggle('abierto')"><span>🎭</span><b>DEMO · Portales del equipo<br><small>Elija un rol · nada se guarda</small></b><span>▾</span><span class="demo-x" title="Ocultar esta ventana" onclick="event.stopPropagation();document.getElementById('demo-panel').style.display='none';document.getElementById('demo-mini').style.display='grid'">✕</span></header>
    <div class="cuerpo"><p>Datos de ejemplo inventados. Pruebe todo: elegir cirugías, firmar, pintar la disponibilidad, recuento… Al recargar vuelve a empezar.</p>
    ${ROLES.map((r) => `<button class="demo-rol" data-k="${r.k}" onclick="demoRol('${r.k}')"><i>${r.i}</i><span><b>${r.n}</b><small>${r.d}</small></span></button>`).join('')}</div>`;
  const mini = document.createElement('button');
  mini.id = 'demo-mini'; mini.title = 'Mostrar la ventana del demo'; mini.textContent = '🎭';
  mini.onclick = () => { panel.style.display = ''; mini.style.display = 'none'; };
  const arrancar = () => { sembrar(); document.body.appendChild(panel); document.body.appendChild(mini); demoRol('jefaAnest'); };
  // Espera a que la app termine de cargar sus datos locales.
  const t0 = Date.now(); (function esperar() { if (typeof view !== 'undefined' && document.getElementById('main') && document.getElementById('main').innerHTML) arrancar(); else if (Date.now() - t0 < 8000) setTimeout(esperar, 150); else arrancar(); })();
})();
</script>
'''
i = s.index('<head>') + len('<head>')
s = s[:i] + '\n' + CABEZA + s[i:]
j = s.rindex('</body>')
s = s[:j] + PIE + s[j:]
s = s.replace('<title>', '<title>DEMO · ', 1)
(raiz / 'demo' / 'demo-portales.html').write_text(s, encoding='utf-8')
print('demo/demo-portales.html', len(s) // 1024, 'KB')
