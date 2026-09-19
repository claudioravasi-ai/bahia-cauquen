/* Datos de muestra para probar la app sin conexión.
   Nombres, casas y claves son inventados. */
function seed(){
  const n = Date.now(), h = hoyISO();
  const D = k => sumarDias(h, k);
  const dow = new Date().getDay();
  const proxSabado = D(((6 - dow) + 7) % 7 || 7);

  const users = [
    { id:'u_admin', nombre:'Administración', casa:'Administración', email:'admin@bahiacauquen.demo', tel:'', rol:'admin', estado:'aprobado', clave:'ADM-2026',
      skills:'', createdAt:n - 90*DIA },
    { id:'u_garita', nombre:'Guardia de turno', casa:'Garita', email:'garita@bahiacauquen.demo', tel:'', rol:'guardia', estado:'aprobado', clave:'GAR-2026',
      skills:'', createdAt:n - 90*DIA },
    { id:'u_lucia', nombre:'Lucía Fernández', casa:'Lote 42', email:'lucia@bahiacauquen.demo', tel:'5492901000001', rol:'vecino', estado:'aprobado', clave:'VEC-A7F2',
      skills:'Clases de matemática y física', mostrarTel:true, createdAt:n - 30*DIA, dni:'28111222',
      enDirectorio:true, profesion:'Profesora de matemática', direccion:'Calle 3 N° 42', ubicacion:'-54.8195,-68.3790',
      integrantes:'Lucía, Pablo, Tomás (9) y Emma (6)', vehiculos:[{ patente:'AF 123 KD', modelo:'Toyota Hilux gris' }],
      mascotas:[{ id:'m1', nombre:'Luna', especie:'Perra', desc:'Ovejero blanco, collar rojo, muy mansa.' }] },
    { id:'u_diego', nombre:'Diego Pérez', casa:'Lote 18', email:'diego@bahiacauquen.demo', tel:'5492901000002', rol:'vecino', estado:'aprobado', clave:'VEC-B4K9',
      skills:'Electricista matriculado', mostrarTel:true, createdAt:n - 25*DIA, dni:'30222333', respondedor:true,
      enDirectorio:true, profesion:'Enfermero (Hospital Regional)', direccion:'Calle 1 N° 18',
      integrantes:'Diego y Sofía', vehiculos:[{ patente:'AE 887 TR', modelo:'VW Amarok blanca' }], mascotas:[] },
    { id:'u_martin', nombre:'Martín Sosa', casa:'Lote 23', email:'martin@bahiacauquen.demo', tel:'5492901000004', rol:'vecino', estado:'aprobado', clave:'VEC-M3R8',
      skills:'Carpintería y deck', mostrarTel:true, createdAt:n - 20*DIA, integrantes:'Martín', vehiculos:[], dni:'27333444',
      enDirectorio:true, profesion:'Guía de montaña', direccion:'Calle 4 N° 23',
      mascotas:[{ id:'m2', nombre:'Toro', especie:'Perro', desc:'Mestizo negro, grande.' }] },
    { id:'u_claudio', nombre:'Claudio Ravasi', casa:'Lote 148', email:'claudio@bahiacauquen.demo', tel:'', rol:'vecino', estado:'aprobado', clave:'VEC-C148',
      skills:'', createdAt:n - 40*DIA, enDirectorio:true, profesion:'Médico', direccion:'Los Ñires 3333 · Lote 148', respondedor:true, integrantes:'Claudio y Mónica', vehiculos:[], mascotas:[] },
    { id:'u_carla', nombre:'Carla Gómez', casa:'Lote 7', email:'carla@bahiacauquen.demo', tel:'5492901000003', rol:'vecino', estado:'pendiente', clave:'',
      skills:'Veterinaria', createdAt:n - 3*HORA },
  ];

  return {
    v: 3,
    config: Object.assign({}, CONFIG_BASE),
    users,
    posts: [
      { id:uid(), type:'aviso', title:'Corte de agua programado', body:'Mañana de 9 a 14 h se corta el agua por mantenimiento del tanque principal. Llenen una reserva.',
        autor:'u_admin', createdAt:n - 3*HORA, fijado:true, reactions:{ '👍':['u_lucia','u_diego'] }, comments:[] },
      { id:uid(), type:'alerta', title:'Auto sospechoso por la calle 3', body:'Un auto gris sin patente visible dio varias vueltas. Ya avisé a la garita.',
        autor:'u_diego', createdAt:n - 40*MIN, reactions:{ '🙏':['u_lucia'] },
        comments:[{ id:uid(), autor:'u_garita', text:'Recibido. Salió una ronda a verificar.', createdAt:n - 30*MIN }] },
      { id:uid(), type:'evento', title:'Asado de primavera', body:'Nos juntamos en el quincho. Cada familia trae algo para compartir. ¡Hay juegos para los chicos!',
        autor:'u_admin', createdAt:n - 1*DIA, fecha:proxSabado, horaEv:'13:00', lugar:'Quincho', voy:['u_lucia','u_martin'],
        reactions:{ '❤️':['u_lucia','u_diego','u_martin'] }, comments:[] },
      { id:uid(), type:'ofrezco', title:'Clases de apoyo escolar', body:'Matemática y física para secundaria. A domicilio dentro del barrio.',
        autor:'u_lucia', category:'Clases particulares', price:'$12.000 / hora', createdAt:n - 5*HORA, reactions:{ '👏':['u_admin'] }, comments:[] },
      { id:uid(), type:'busco', title:'¿Alguien tiene una hidrolavadora?', body:'Para lavar el deck. La devuelvo el mismo día.',
        autor:'u_diego', category:'Préstamos', createdAt:n - 8*HORA, reactions:{}, comments:[] },
      { id:uid(), type:'mercado', title:'Regalo leña de lenga', body:'Me sobraron unos 2 m³ cortados. El que la quiera la pasa a buscar.',
        autor:'u_martin', createdAt:n - 26*HORA, reactions:{ '❤️':['u_diego'] }, comments:[] },
    ],
    msgs: [
      { id:uid(), channel:'general', autor:'u_lucia', text:'¡Buen día vecinos! Qué lindo amaneció el canal 🌞', createdAt:n - 50*MIN },
      { id:uid(), channel:'general', autor:'u_diego', text:'¿Alguien sabe si pasó el camión de la basura?', createdAt:n - 32*MIN },
      { id:uid(), channel:'general', autor:'u_admin', text:'Sí, pasó 8:30. El jueves se adelanta a las 7.', createdAt:n - 30*MIN },
      { id:uid(), channel:'seguridad', autor:'u_garita', text:'Recordatorio: el portón de servicio se cierra a las 22 h.', createdAt:n - 2*HORA },
      { id:uid(), channel:'mascotas', autor:'u_martin', text:'Si ven a Toro suelto avísenme, se escapa por debajo del cerco.', createdAt:n - 5*HORA },
    ],
    privados: [
      { id:uid(), userId:'u_lucia', con:'admin', msgs:[
        { id:uid(), from:'vecino', text:'Hola, quería consultar por el cupón de expensas de septiembre.', createdAt:n - 26*HORA },
        { id:uid(), from:'admin', text:'Hola Lucía, ya está en Octavo Piso. Cualquier cosa me escribís.', createdAt:n - 25*HORA },
      ] },
      { id:uid(), userId:'u_diego', con:'admin', msgs:[
        { id:uid(), from:'vecino', text:'Necesito autorización para una obra menor en el jardín.', createdAt:n - 5*HORA },
      ] },
    ],
    pases: [
      { id:uid(), hostId:'u_diego', nombre:'Fletes Mudanzas Sur', tipo:'proveedor', patente:'AC 554 PL', fecha:h, desde:'14:00', hasta:'18:00',
        codigo:'482913', log:{}, createdAt:n - 3*HORA },
      { id:uid(), hostId:'u_lucia', nombre:'Rosa Aguilar', tipo:'personal', dni:'', patente:'', fecha:D(-20), fechaFin:D(60), dias:[1,2,3,4,5],
        desde:'08:00', hasta:'13:00', codigo:'731045', log:{ [D(-1)]:{ in:n - DIA - 3*HORA, out:n - DIA + 2*HORA } }, createdAt:n - 20*DIA },
      { id:uid(), hostId:'u_lucia', nombre:'Abuelos Fernández', tipo:'visita', patente:'AB 320 QS', fecha:D(1), desde:'17:00', hasta:'23:00',
        codigo:'205577', log:{}, createdAt:n - 2*HORA },
    ],
    llegadas: [],
    paquetes: [
      { id:uid(), hostId:'u_lucia', empresa:'Mercado Libre', detalle:'Caja mediana', recibido:n - 2*HORA, retirado:null },
    ],
    bitacora: [
      { id:uid(), autor:'u_garita', tipo:'turno', texto:'Tomo el turno. Sin novedades del turno noche.', at:n - 6*HORA },
      { id:uid(), autor:'u_garita', tipo:'ronda', texto:'Ronda completa por el perímetro. Luminaria de calle 3 apagada.', at:n - 4*HORA },
    ],
    reservas: [
      { id:uid(), amenity:'quincho', userId:'u_diego', fecha:proxSabado, franja:1, invitados:18, nota:'Cumpleaños de Sofía', listaInvitados:[], createdAt:n - 2*DIA },
      { id:uid(), amenity:'cancha', userId:'u_martin', fecha:D(1), franja:4, invitados:10, nota:'', listaInvitados:[], createdAt:n - DIA },
    ],
    bloqueos: [
      { id:uid(), amenity:'sum', fecha:D(2), franja:-1, motivo:'Pintura del salón' },
    ],
    reclamos: [
      { id:uid(), userId:'u_lucia', categoria:'alumbrado', titulo:'Luminaria apagada en calle 3', detalle:'La del poste frente a la casa 12 no prende desde el martes. De noche queda muy oscuro.',
        lugar:'Calle 3, frente a casa 12', estado:'en_curso', apoyos:['u_diego','u_martin'], createdAt:n - 3*DIA,
        historial:[ { at:n - 3*DIA, por:'u_lucia', estado:'abierto', texto:'Reclamo creado' }, { at:n - 2*DIA, por:'u_admin', estado:'en_curso', texto:'Pedimos el repuesto al electricista. Llega el viernes.' } ] },
      { id:uid(), userId:'u_diego', categoria:'calles', titulo:'Subida de la calle 5 con hielo', detalle:'A la mañana la subida queda como pista. ¿Se puede echar sal o arena?',
        lugar:'Calle 5, la subida', estado:'abierto', apoyos:['u_lucia'], createdAt:n - 20*HORA,
        historial:[ { at:n - 20*HORA, por:'u_diego', estado:'abierto', texto:'Reclamo creado' } ] },
    ],
    votaciones: [
      { id:uid(), titulo:'¿Instalamos cámaras en el acceso de servicio?', detalle:'Presupuesto: 4 cámaras con grabación 30 días. Se prorratea en tres expensas.',
        opciones:['Sí, instalar','No por ahora','Me abstengo'], cierra:n + 5*DIA, votos:{ 'Lote 18':0, 'Lote 23':0 }, creadaPor:'u_admin', createdAt:n - 2*DIA },
      { id:uid(), titulo:'Horario de la cancha en invierno', detalle:'Proponemos cerrar a las 18 h de mayo a agosto por la poca luz.',
        opciones:['De acuerdo','Prefiero hasta las 19 h'], cierra:n - 3*DIA, votos:{ 'Lote 42':0, 'Lote 18':0, 'Lote 23':1 }, creadaPor:'u_admin', createdAt:n - 12*DIA },
    ],
    sos: [],
    documentos: [
      { id:uid(), titulo:'Reglamento interno (resumen)', tipo:'Reglamento', createdAt:n - 60*DIA, texto:
`Texto de muestra: reemplazalo por el reglamento real del barrio.

1. Velocidad máxima dentro del barrio: 20 km/h. Prioridad a peatones y chicos.
2. Horario de silencio: de 22 a 8 h.
3. Obras y ruidos molestos: lunes a viernes de 8 a 18 h, sábados de 9 a 13 h.
4. Mascotas siempre con correa en espacios comunes. Los perros no pueden andar sueltos.
5. Residuos en canastos elevados y cerrados (los perros y zorros rompen las bolsas).
6. Visitas: siempre anunciadas por la app o con la guardia.
7. Espacios comunes: se reservan por la app y se entregan limpios.` },
      { id:uid(), titulo:'Normas de convivencia (modelo)', tipo:'Convivencia', createdAt:n - 45*DIA, texto:NORMAS_MODELO },
      { id:uid(), titulo:'Protocolo de invierno', tipo:'Protocolo', createdAt:n - 30*DIA, texto:
`Texto de muestra: ajustalo a lo que haga el barrio.

• Con nevada, la prioridad del quitanieve es: acceso principal, subidas, calles internas.
• No estacionar en la calle cuando se anuncia nieve: el quitanieve necesita pasar.
• Con hielo: se echa arena/sal en las subidas a primera hora.
• Con viento fuerte (ráfagas de más de 60 km/h): asegurar tachos, reposeras y trampolines.
• Cortes de luz o gas: avisar por la app en #seguridad y a la guardia.` },
    ],
    notifs: [],
    avisos: [],
    motorLog: {},
    compras: [
      { id:uid(), titulo:'Leña de lenga seca — compra conjunta', detalle:'El proveedor hace precio si juntamos 20 m³. Entrega en cada casa.',
        unidad:'m³', precio:'$95.000 por m³ (con 20 m³ o más)', meta:20, cierra:n + 4*DIA, creadaPor:'u_martin',
        anotados:[ { userId:'u_martin', cant:3 }, { userId:'u_diego', cant:4 }, { userId:'u_lucia', cant:5 } ], createdAt:n - DIA },
    ],
    solicitudesPase: [],
    peticiones: [],
    auditoria: [ { id:uid(), at:n - 30*DIA, por:'u_admin', accion:'Aprobó una inscripción', detalle:'Lucía Fernández · Lote 42', ref:'u_lucia' } ],
    obras: [
      { id:uid(), userId:'u_martin', casa:'Lote 23', tipo:'Ampliación', etapa:3, empresa:'Construcciones del Beagle', tel:'', inicio:D(-40), finEstimado:D(60),
        detalle:'Ampliación de 40 m² en madera y steel frame.', estado:'activa', createdAt:n - 40*DIA, ultima:n - 2*DIA,
        historial:[ { at:n - 40*DIA, etapa:0, texto:'Obra registrada', por:'u_martin' }, { at:n - 2*DIA, etapa:3, texto:'Se levantó la estructura de la planta alta.', por:'u_martin' } ],
        avisoHoy:{ fecha:h, texto:'Entra un camión con placas de OSB', hora:'10:00' } },
      { id:uid(), userId:'u_diego', casa:'Lote 18', tipo:'Quincho / pileta', etapa:0, empresa:'', tel:'', inicio:D(10), finEstimado:D(90),
        detalle:'Quincho de 25 m² en el fondo.', estado:'pendiente', createdAt:n - 5*HORA, ultima:n - 5*HORA, historial:[ { at:n - 5*HORA, etapa:0, texto:'Obra registrada', por:'u_diego' } ] },
    ],
    dms: [
      { id:uid(), a:'u_diego', b:'u_lucia', msgs:[
        { id:uid(), de:'u_diego', text:'Hola Lucía, ¿Tomás sigue con las clases de física? Mi sobrino necesita apoyo.', at:n - 3*HORA },
      ] },
    ],
    viajes: [
      { id:uid(), userId:'u_diego', tipo:'ofrezco', destino:'Centro', lugares:3, fecha:D(1), hora:'07:40', nota:'Salgo de la garita. Paso por la escuela.', vuelta:false, anotados:['u_martin'], createdAt:n - 4*HORA },
      { id:uid(), userId:'u_martin', tipo:'busco', destino:'Aeropuerto', lugares:1, fecha:D(2), hora:'05:30', nota:'Vuelo temprano a Buenos Aires.', vuelta:false, anotados:[], createdAt:n - 2*HORA },
    ],
    infracciones: [],
    proveedores: [
      { id:'pr1', empresa:'Fletes Mudanzas Sur', rubro:'Fletes', cuit:'', tel:'', artVence:D(3), seguroVence:D(120), personal:'Ramón Díaz\nJulio Paz' },
      { id:'pr2', empresa:'Construcciones del Beagle', rubro:'Construcción', cuit:'', tel:'', artVence:D(200), seguroVence:D(200), personal:'Carlos Vera\nMatías Ruiz\nOmar Gil' },
      { id:'pr3', empresa:'Jardines del Fin del Mundo', rubro:'Jardinería', cuit:'', tel:'', artVence:D(-2), seguroVence:D(40), personal:'Ana Toledo' },
    ],
  };
}

/* Modelo armado con lo que suelen traer los reglamentos de barrios
   cerrados y clubes de campo del país, ordenado según el Código Civil
   y Comercial. Es orientativo: lo revisa un abogado y lo aprueba la asamblea. */
const NORMAS_MODELO = `MODELO ORIENTATIVO. Tiene que revisarlo un abogado y aprobarlo la asamblea antes de aplicarse.

MARCO LEGAL
• Código Civil y Comercial de la Nación (Ley 26.994): conjuntos inmobiliarios, arts. 2073 a 2086; propiedad horizontal, arts. 2037 a 2072, que se aplica en lo que no esté previsto; inmisiones y "normal tolerancia", art. 1973; protección de la vida privada, art. 1770.
• Ley 25.326 de Protección de Datos Personales (visitas, patentes, cámaras).
• Ley 14.346 de protección animal.
• Ley 27.159 de muerte súbita (espacios cardioprotegidos).
• Ley 24.557 de Riesgos del Trabajo y Ley 26.844 de Casas Particulares (personal que ingresa).

1. TRANQUILIDAD Y RUIDOS
• Horario de silencio: de 22 a 8 h. La música no debe escucharse fuera del propio lote.
• Cortadoras, sopladoras, motosierras y herramientas: solo en horario de obra.
• Rige el criterio de "normal tolerancia" entre vecinos (art. 1973 CCyC).

2. OBRAS Y REFORMAS
• Horario: lunes a viernes de 8 a 18 h y sábados de 9 a 13 h. Domingos y feriados, no.
• Se avisa a la Administración antes de empezar, con el listado del personal.
• El personal de obra ingresa con ART vigente (Ley 24.557); el personal de casas particulares, registrado (Ley 26.844).
• Contenedores y materiales, dentro del lote. La calle se deja limpia al final del día.

3. TRÁNSITO INTERNO
• Velocidad máxima: 20 km/h. Prioridad absoluta a peatones, ciclistas y chicos.
• Menores sin licencia no conducen autos, cuatriciclos ni UTV.
• Se estaciona dentro del lote. Con aviso de nieve, la calle queda libre para el quitanieve.

4. MASCOTAS
• En espacios comunes, siempre con correa. Los desechos se levantan.
• Vacuna antirrábica al día e identificación con chapita.
• Queda prohibido el maltrato o abandono (Ley 14.346).
• No se alimenta a la fauna silvestre (zorros, aves, castores).

5. RESIDUOS
• Canastos elevados y cerrados: los perros y zorros rompen las bolsas.
• Se respetan los días de recolección que publica la app. La poda va al contenedor verde.

6. VISITAS, PROVEEDORES Y ACCESOS
• Toda visita se anuncia por la app o con la guardia.
• Cada propietario responde por sus invitados y por el uso que hagan de los espacios comunes (art. 2083 CCyC).
• Los códigos de ingreso son personales: no se comparten en grupos ni redes.

7. ESPACIOS COMUNES
• Se reservan por la app, se usan según su reglamento y se entregan limpios.
• Los daños los paga quien reservó.

8. SEGURIDAD
• No se abre el portón a desconocidos. Ante algo sospechoso, se avisa a la guardia o se usa el botón SOS.
• Las ausencias largas conviene avisarlas con "Me voy de viaje" para sumar rondas.
• Fogatas prohibidas; las parrillas, solo en lugares habilitados. Pirotecnia prohibida (riesgo de incendio en el bosque y estrés de animales).
• El barrio mantiene un desfibrilador (DEA) en un lugar conocido y señalizado (Ley 27.159).

9. PRIVACIDAD
• Los datos de visitas (DNI, patente) se usan solo para el control de acceso y la app los borra solos a los 90 días (Ley 25.326, principio de finalidad).
• Las cámaras comunes se señalizan y no enfocan el interior de los lotes.
• No se vuelan drones sobre lotes ajenos ni se publican fotos de vecinos sin permiso (art. 1770 CCyC).

10. CONFLICTOS Y SANCIONES
• Primero, conversación entre vecinos. Después, mediación de la Administración. Por último, la comisión de convivencia.
• Las sanciones son graduales: llamado de atención, apercibimiento, multa y suspensión del uso de espacios comunes; siempre con derecho a descargo (art. 2086 CCyC).`;
