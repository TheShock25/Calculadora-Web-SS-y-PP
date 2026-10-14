// Estado compartido de NutriEnergía: sincroniza los datos del perfil entre
// pantallas (para no capturarlos dos veces) y registra el avance del usuario
// en la ruta paso a paso. Debe cargarse en <head>, antes de los scripts de
// cada página, para que la sincronización ocurra antes de que lean sus datos.
(function (global) {
  'use strict';

  const CLAVE_CALCULADORA = 'datosUsuarioNutri'; // usada por energia.html (app.js)
  const CLAVE_ANTROPOMETRIA = 'datosUsuario';    // usada por menu / imc / somatotipo
  const CLAVE_SINCRONIA = 'nutriSyncSnapshot';
  const CLAVE_PROGRESO = 'nutriProgreso';
  const CAMPOS_PERFIL = ['sexo', 'edad', 'peso', 'altura'];

  // Definición de la ruta guiada. "pages" son los archivos que pertenecen al paso.
  const PASOS = [
    {
      id: 'energia',
      numero: 1,
      titulo: 'Datos y gasto energético',
      corto: 'Gasto energético',
      descripcion: 'Tus datos básicos y tu requerimiento diario',
      pages: ['energia.html'],
      href: 'energia.html'
    },
    {
      id: 'composicion',
      numero: 2,
      titulo: 'Composición corporal',
      corto: 'Composición',
      descripcion: 'IMC, densidad y somatotipo',
      opcional: true,
      requiere: 'datos',
      motivoBloqueo: 'Ingresa primero tus datos en el Paso 1',
      pages: ['menu.html', 'imc.html', 'somatotipo.html'],
      href: 'menu.html',
      subpasos: [
        { titulo: 'IMC y densidad', href: 'imc.html' },
        { titulo: 'Somatotipo', href: 'somatotipo.html' }
      ]
    },
    {
      id: 'equivalentes',
      numero: 3,
      titulo: 'Sistema de equivalentes',
      corto: 'Equivalentes',
      descripcion: 'Distribuye tus porciones por grupo',
      pages: ['equivalentes.html'],
      href: 'equivalentes.html',
      requiere: 'energia',
      motivoBloqueo: 'Primero calcula tu gasto energético'
    },
    {
      id: 'plan',
      numero: 4,
      titulo: 'Plan alimenticio',
      corto: 'Plan',
      descripcion: 'Arma tu menú de la semana',
      pages: ['plan-alimenticio.html'],
      href: 'plan-alimenticio.html',
      requiere: 'equivalentes',
      accionEnEquivalentes: 'planBtn',
      motivoBloqueo: 'Genera tu distribución en Equivalentes'
    },
    {
      id: 'recordatorio',
      numero: 5,
      titulo: 'Recordatorio 24 h',
      corto: 'R24H',
      descripcion: 'Registra lo que comiste ayer',
      pages: ['recordatorio.html'],
      href: 'recordatorio.html',
      requiere: 'equivalentes',
      accionEnEquivalentes: 'r24hBtn',
      motivoBloqueo: 'Genera tu distribución en Equivalentes'
    }
  ];

  // Utilidades
  function leerJSON(storage, clave, porDefecto) {
    try {
      const raw = storage.getItem(clave);
      return raw ? JSON.parse(raw) : porDefecto;
    } catch (e) {
      return porDefecto;
    }
  }

  function escribirJSON(storage, clave, valor) {
    try {
      storage.setItem(clave, JSON.stringify(valor));
    } catch (e) { /* almacenamiento lleno o bloqueado */ }
  }

  function paginaActual() {
    const nombre = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
    return nombre === '' ? 'index.html' : nombre;
  }

  // Sincronia de perfil
  function sincronizarPerfil() {
    const rawCalc = localStorage.getItem(CLAVE_CALCULADORA);
    const rawAntro = localStorage.getItem(CLAVE_ANTROPOMETRIA);
    const snapshot = leerJSON(localStorage, CLAVE_SINCRONIA, {});

    const calc = rawCalc ? leerJSON(localStorage, CLAVE_CALCULADORA, {}) : null;
    const antro = rawAntro ? leerJSON(localStorage, CLAVE_ANTROPOMETRIA, {}) : null;

    const cambioCalc = rawCalc !== null && rawCalc !== snapshot.calc;
    const cambioAntro = rawAntro !== null && rawAntro !== snapshot.antro;

    let origen = null;
    let destinoClave = null;
    let destino = null;

    if (cambioCalc && !cambioAntro) {
      origen = calc; destinoClave = CLAVE_ANTROPOMETRIA; destino = antro || {};
    } else if (cambioAntro && !cambioCalc) {
      origen = antro; destinoClave = CLAVE_CALCULADORA; destino = calc || {};
    } else if (cambioCalc && cambioAntro) {
      // Ambos cambiaron (p. ej. primera ejecución): la calculadora manda.
      origen = calc; destinoClave = CLAVE_ANTROPOMETRIA; destino = antro || {};
    }

    if (origen && destinoClave) {
      let huboCambios = false;
      CAMPOS_PERFIL.forEach(function (campo) {
        const valor = origen[campo];
        if (valor !== undefined && valor !== null && String(valor).trim() !== '' && destino[campo] !== valor) {
          destino[campo] = valor;
          huboCambios = true;
        }
      });
      if (huboCambios) escribirJSON(localStorage, destinoClave, destino);
    }

    escribirJSON(localStorage, CLAVE_SINCRONIA, {
      calc: localStorage.getItem(CLAVE_CALCULADORA),
      antro: localStorage.getItem(CLAVE_ANTROPOMETRIA)
    });
  }

  function obtenerPerfil() {
    const calc = leerJSON(localStorage, CLAVE_CALCULADORA, {}) || {};
    const antro = leerJSON(localStorage, CLAVE_ANTROPOMETRIA, {}) || {};
    const perfil = {};
    CAMPOS_PERFIL.forEach(function (c) {
      perfil[c] = (calc[c] !== undefined && calc[c] !== '') ? calc[c] : (antro[c] || '');
    });
    perfil.ecuacion = calc.ecuacion || '';
    perfil.actividad = calc.actividad || '';
    perfil.actualizado = calc.timestamp || '';
    return perfil;
  }

  // Limpiar cualquier residuo de pasos temporales en localStorage de versiones previas
  try {
    localStorage.removeItem('datosEquivalentesGuardados');
    localStorage.removeItem('planAlimenticioTemp');
    localStorage.removeItem('recordatorioTemp');
    const localProg = leerJSON(localStorage, CLAVE_PROGRESO, null);
    if (localProg) {
      if (localProg.visitados) {
        delete localProg.visitados.equivalentes;
        delete localProg.visitados.plan;
        delete localProg.visitados.recordatorio;
        delete localProg.visitados['equivalentes.html'];
        delete localProg.visitados['plan-alimenticio.html'];
        delete localProg.visitados['recordatorio.html'];
      }
      if (localProg.urls) {
        delete localProg.urls.plan;
        delete localProg.urls.recordatorio;
      }
      escribirJSON(localStorage, CLAVE_PROGRESO, localProg);
    }
  } catch (e) {}

  const CLAVE_PROGRESO_SESION = 'nutriProgresoSesion';

  // Progreso combinado: perfil y energia persistentes en localStorage;
  // equivalentes, plan y recordatorio temporales en sessionStorage.
  function obtenerProgreso() {
    const local = leerJSON(localStorage, CLAVE_PROGRESO, { visitados: {} });
    const sesion = leerJSON(sessionStorage, CLAVE_PROGRESO_SESION, { visitados: {}, urls: {} });
    return {
      visitados: Object.assign({}, local.visitados || {}, sesion.visitados || {}),
      urls: sesion.urls || {},
      ultimo: sesion.ultimo || local.ultimo || null
    };
  }

  function registrarVisita() {
    const pagina = paginaActual();
    const paso = PASOS.find(function (p) { return p.pages.indexOf(pagina) !== -1; });
    if (!paso) return;

    if (paso.id === 'energia' || paso.id === 'composicion') {
      const local = leerJSON(localStorage, CLAVE_PROGRESO, { visitados: {} });
      local.visitados = local.visitados || {};
      local.visitados[paso.id] = true;
      local.visitados[pagina] = true;
      local.ultimo = paso.id;
      escribirJSON(localStorage, CLAVE_PROGRESO, local);
    } else {
      // Equivalentes, plan y recordatorio son temporales de sesion
      const sesion = leerJSON(sessionStorage, CLAVE_PROGRESO_SESION, { visitados: {}, urls: {} });
      sesion.visitados = sesion.visitados || {};
      sesion.urls = sesion.urls || {};
      sesion.visitados[paso.id] = true;
      sesion.visitados[pagina] = true;
      if (location.search && (paso.id === 'plan' || paso.id === 'recordatorio')) {
        sesion.urls[paso.id] = pagina + location.search;
      }
      sesion.ultimo = paso.id;
      escribirJSON(sessionStorage, CLAVE_PROGRESO_SESION, sesion);
    }
  }

  function obtenerGET() {
    const raw = localStorage.getItem('ultimoGETNutri') || localStorage.getItem('ultimoGET');
    const valor = parseInt(raw, 10);
    return isNaN(valor) ? null : valor;
  }

  function pasoCompletado(id) {
    const progreso = obtenerProgreso();
    const v = progreso.visitados || {};
    switch (id) {
      case 'energia': return obtenerGET() !== null;
      case 'composicion': return !!(v['imc.html'] || v['somatotipo.html']);
      case 'equivalentes': {
        const equivActivo = sessionStorage.getItem('nutri_equiv_activo') === 'true';
        return !!(equivActivo && (v.plan || v.recordatorio));
      }
      case 'plan': return !!v.plan;
      case 'recordatorio': return !!v.recordatorio;
      default: return false;
    }
  }

  function pasoDisponible(paso) {
    if (!paso.requiere) return true;
    if (paso.requiere === 'datos') {
      const p = obtenerPerfil();
      return !!(p.peso && p.altura);
    }
    if (paso.requiere === 'energia') {
      return obtenerGET() !== null;
    }
    if (paso.requiere === 'equivalentes') {
      // Plan y R24H solo se desbloquean si en esta sesion se generaron porciones validas
      const planUrl = sessionStorage.getItem('nutri_plan_url_sesion');
      const r24hUrl = sessionStorage.getItem('nutri_r24h_url_sesion');
      const equivActivo = sessionStorage.getItem('nutri_equiv_activo') === 'true';

      if (paso.id === 'plan') {
        return !!(equivActivo && planUrl);
      }
      if (paso.id === 'recordatorio') {
        return !!(equivActivo && r24hUrl);
      }
      return false;
    }
    return true;
  }

  function hrefDePaso(paso) {
    if (paso.id === 'equivalentes') {
      const get = obtenerGET();
      return get ? 'equivalentes.html?get=' + get : 'equivalentes.html';
    }
    if (paso.id === 'plan') {
      return sessionStorage.getItem('nutri_plan_url_sesion') || '#';
    }
    if (paso.id === 'recordatorio') {
      return sessionStorage.getItem('nutri_r24h_url_sesion') || '#';
    }
    return paso.href;
  }

  function pasoActual() {
    const pagina = paginaActual();
    return PASOS.find(function (p) { return p.pages.indexOf(pagina) !== -1; }) || null;
  }

  function resumenProgreso() {
    const total = PASOS.length;
    const hechos = PASOS.filter(function (p) { return pasoCompletado(p.id); }).length;
    return { total: total, hechos: hechos };
  }

  function siguientePendiente() {
    return PASOS.find(function (p) { return !p.opcional && !pasoCompletado(p.id) && pasoDisponible(p); })
      || PASOS.find(function (p) { return !pasoCompletado(p.id) && pasoDisponible(p); })
      || PASOS[0];
  }

  // Ejecutar de inmediato (antes que los scripts de la página).
  sincronizarPerfil();
  registrarVisita();

  global.NutriEstado = {
    PASOS: PASOS,
    paginaActual: paginaActual,
    pasoActual: pasoActual,
    obtenerPerfil: obtenerPerfil,
    obtenerProgreso: obtenerProgreso,
    obtenerGET: obtenerGET,
    pasoCompletado: pasoCompletado,
    pasoDisponible: pasoDisponible,
    hrefDePaso: hrefDePaso,
    resumenProgreso: resumenProgreso,
    siguientePendiente: siguientePendiente,
    sincronizarPerfil: sincronizarPerfil
  };
})(window);
