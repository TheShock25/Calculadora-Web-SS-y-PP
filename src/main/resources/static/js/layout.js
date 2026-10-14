// Codigo de la barra lateral, navegacion responsiva y estados de pasos.
(function (global) {
  'use strict';

  // SVGs limpios para la interfaz sin emojis
  const ICONOS = {
    check: '<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"/></svg>',
    lock: '<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"/></svg>',
    home: '<svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"/></svg>',
    logo: '<svg class="w-6 h-6 text-sage-600" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"/></svg>',
    arrowRight: '<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"/></svg>',
    user: '<svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/></svg>'
  };

  // Mostrar notificacion tipo toast
  function mostrarNotificacion(mensaje, tipo) {
    let toast = document.getElementById('nutri-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'nutri-toast';
      toast.className = 'fixed top-5 right-5 z-50 px-4 py-3 rounded-2xl shadow-lg border text-sm font-semibold transition-all duration-300 transform translate-x-full pointer-events-none';
      document.body.appendChild(toast);
    }

    if (tipo === 'error') {
      toast.className = 'fixed top-5 right-5 z-50 px-4 py-3 rounded-2xl shadow-lg border text-sm font-semibold transition-all duration-300 bg-white border-red-200 text-red-700 pointer-events-auto transform translate-x-0';
    } else if (tipo === 'success') {
      toast.className = 'fixed top-5 right-5 z-50 px-4 py-3 rounded-2xl shadow-lg border text-sm font-semibold transition-all duration-300 bg-white border-sage-200 text-sage-700 pointer-events-auto transform translate-x-0';
    } else {
      toast.className = 'fixed top-5 right-5 z-50 px-4 py-3 rounded-2xl shadow-lg border text-sm font-semibold transition-all duration-300 bg-white border-peach-200 text-peach-600 pointer-events-auto transform translate-x-0';
    }

    toast.textContent = mensaje;

    setTimeout(() => {
      toast.classList.add('translate-x-full');
    }, 3000);
  }

  // Generar HTML del Sidebar de escritorio
  function renderDesktopSidebar(pasos, pasoActual, hechos, total, esInicio) {
    const porcentaje = Math.round((hechos / total) * 100);
    const radio = 20;
    const circulo = 2 * Math.PI * radio;
    const offset = circulo - (porcentaje / 100) * circulo;

    let itemsHtml = '';
    pasos.forEach((p, index) => {
      const estaHecho = global.NutriEstado ? global.NutriEstado.pasoCompletado(p.id) : false;
      const estaDisponible = global.NutriEstado ? global.NutriEstado.pasoDisponible(p) : true;
      const esActual = pasoActual && pasoActual.id === p.id && !esInicio;
      const esUltimo = index === pasos.length - 1;

      let dotHtml = '';
      if (estaHecho) {
        dotHtml = `<div class="w-7 h-7 rounded-full bg-sage-600 text-white flex items-center justify-center text-xs font-bold shadow-sm">${ICONOS.check}</div>`;
      } else if (esActual) {
        dotHtml = `<div class="w-7 h-7 rounded-full bg-peach-400 text-white flex items-center justify-center text-xs font-bold ring-4 ring-peach-100">${p.numero}</div>`;
      } else if (estaDisponible) {
        dotHtml = `<div class="w-7 h-7 rounded-full bg-white border-2 border-cream-300 text-charcoal-muted flex items-center justify-center text-xs font-bold group-hover:border-sage-500">${p.numero}</div>`;
      } else {
        dotHtml = `<div class="w-7 h-7 rounded-full bg-cream-100 border border-cream-300 text-charcoal-light flex items-center justify-center text-xs">${ICONOS.lock}</div>`;
      }

      let claseTexto = 'text-charcoal-muted';
      let claseFondo = 'hover:bg-cream-200/50';
      if (esActual) {
        claseTexto = 'text-peach-600 font-bold';
        claseFondo = 'bg-peach-50 text-peach-600 font-bold';
      } else if (estaHecho) {
        claseTexto = 'text-charcoal font-medium';
      } else if (!estaDisponible) {
        claseTexto = 'text-charcoal-light';
        claseFondo = 'opacity-60 cursor-not-allowed';
      }

      const href = estaDisponible ? (global.NutriEstado ? global.NutriEstado.hrefDePaso(p) : p.href) : '#';
      const onClickAttr = !estaDisponible ? `onclick="window.NutriLayout.mostrarBloqueo('${p.motivoBloqueo}'); return false;"` : '';

      itemsHtml += `
        <li class="relative">
          ${!esUltimo ? `<div class="absolute left-3.5 top-7 bottom-0 w-0.5 ${estaHecho ? 'bg-sage-300' : 'bg-cream-200'}"></div>` : ''}
          <a href="${href}" ${onClickAttr} class="group flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all duration-200 ${claseFondo}">
            <div class="relative z-10 flex-shrink-0">${dotHtml}</div>
            <div class="flex flex-col min-w-0">
              <span class="text-sm truncate ${claseTexto}">${p.corto}</span>
              <span class="text-[11px] text-charcoal-light truncate">${p.descripcion}</span>
            </div>
          </a>
        </li>
      `;
    });

    return `
      <aside class="hidden md:flex flex-col w-64 lg:w-72 fixed inset-y-0 left-0 bg-cream-100 border-r border-cream-200 z-30 p-6 custom-scroll overflow-y-auto">
        <a href="index.html" class="flex items-center gap-2.5 px-2 mb-6 text-charcoal no-underline">
          <div class="w-10 h-10 rounded-2xl bg-sage-100 flex items-center justify-center flex-shrink-0">
            ${ICONOS.logo}
          </div>
          <div>
            <span class="font-extrabold text-lg tracking-tight block leading-tight">NutriEnergía</span>
            <span class="text-xs text-charcoal-muted block">Sistema Integral</span>
          </div>
        </a>

        <a href="index.html" class="flex items-center gap-3 px-3 py-2.5 rounded-2xl mb-4 font-semibold text-sm transition-colors ${esInicio ? 'bg-peach-100 text-peach-600' : 'text-charcoal-muted hover:bg-cream-200/50'}">
          ${ICONOS.home}
          <span>Mi Tablero</span>
        </a>

        <div class="text-[11px] font-bold tracking-wider uppercase text-charcoal-light px-3 mb-3">
          Ruta Nutricional
        </div>

        <ul class="space-y-1 mb-6 flex-1">
          ${itemsHtml}
        </ul>

        <div class="mt-auto pt-4 border-t border-cream-200">
          <div class="flex items-center gap-3 bg-white p-3 rounded-2xl border border-cream-200 shadow-sm">
            <svg class="w-12 h-12 flex-shrink-0 transform -rotate-90" viewBox="0 0 50 50">
              <circle cx="25" cy="25" r="${radio}" stroke="#ECE6DC" stroke-width="4" fill="none"/>
              <circle cx="25" cy="25" r="${radio}" stroke="#8FB996" stroke-width="4" stroke-dasharray="${circulo}" stroke-dashoffset="${offset}" stroke-linecap="round" fill="none" class="transition-all duration-700"/>
            </svg>
            <div class="text-xs">
              <span class="font-bold text-charcoal block">${hechos} de ${total} pasos</span>
              <span class="text-charcoal-muted text-[11px]">${porcentaje}% completado</span>
            </div>
          </div>
        </div>
      </aside>
    `;
  }

  // Generar HTML del Header y Stepper movil
  function renderMobileHeader(pasos, pasoActual, esInicio) {
    let pillsHtml = '';
    pasos.forEach((p) => {
      const estaHecho = global.NutriEstado ? global.NutriEstado.pasoCompletado(p.id) : false;
      const estaDisponible = global.NutriEstado ? global.NutriEstado.pasoDisponible(p) : true;
      const esActual = pasoActual && pasoActual.id === p.id && !esInicio;

      let pillClass = 'bg-cream-100 text-charcoal-muted border border-cream-300';
      let dot = p.numero;

      if (estaHecho) {
        pillClass = 'bg-sage-100 text-sage-700 border border-sage-300';
        dot = '<svg class="w-3 h-3 inline text-sage-700" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"/></svg>';
      } else if (esActual) {
        pillClass = 'bg-peach-100 text-peach-600 font-bold border border-peach-300 ring-2 ring-peach-100';
      } else if (!estaDisponible) {
        pillClass = 'opacity-50 text-charcoal-light border border-cream-200';
        dot = '<svg class="w-3 h-3 inline text-charcoal-light" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"/></svg>';
      }

      const href = estaDisponible ? (global.NutriEstado ? global.NutriEstado.hrefDePaso(p) : p.href) : '#';
      const onClickAttr = !estaDisponible ? `onclick="window.NutriLayout.mostrarBloqueo('${p.motivoBloqueo}'); return false;"` : '';

      pillsHtml += `
        <a href="${href}" ${onClickAttr} class="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs whitespace-nowrap flex-shrink-0 transition-all ${pillClass}">
          <span class="font-bold">${dot}</span>
          <span>${p.corto}</span>
        </a>
      `;
    });

    return `
      <header class="md:hidden fixed top-0 inset-x-0 z-40 bg-white border-b border-cream-200">
        <div class="flex items-center justify-between px-4 py-2.5">
          <a href="index.html" class="flex items-center gap-2 text-charcoal no-underline">
            <div class="w-8 h-8 rounded-xl bg-sage-100 flex items-center justify-center">
              ${ICONOS.logo}
            </div>
            <span class="font-extrabold text-base tracking-tight">NutriEnergía</span>
          </a>
          <a href="index.html" class="p-1.5 rounded-xl bg-cream-100 text-charcoal-muted hover:text-charcoal">
            ${ICONOS.home}
          </a>
        </div>

        <div class="flex items-center gap-2 px-3 py-2 overflow-x-auto bg-cream-50 border-t border-cream-200 custom-scroll">
          ${pillsHtml}
        </div>
      </header>
    `;
  }

  // Inicializar e inyectar layout
  function inicializarLayout() {
    if (!global.NutriEstado) return;

    const pasos = global.NutriEstado.PASOS;
    const pasoActual = global.NutriEstado.pasoActual();
    const resumen = global.NutriEstado.resumenProgreso();
    const pagina = global.NutriEstado.paginaActual();
    const esInicio = pagina === 'index.html';

    const desktopSidebar = renderDesktopSidebar(pasos, pasoActual, resumen.hechos, resumen.total, esInicio);
    const mobileHeader = renderMobileHeader(pasos, pasoActual, esInicio);

    const contenedor = document.createElement('div');
    contenedor.id = 'nutri-layout-container';
    contenedor.innerHTML = desktopSidebar + mobileHeader;
    document.body.insertBefore(contenedor, document.body.firstChild);

    // Normalizar body para evitar colisiones con flexbox antiguo
    document.body.style.display = 'block';
    document.body.style.margin = '0';
    document.body.style.backgroundColor = '#FAF7F2';

    // Ajustar contenedor principal con espacio para barra lateral
    const mainEl = document.querySelector('.main-wrapper') || document.querySelector('body > main') || document.querySelector('main') || document.querySelector('.container');
    if (mainEl && !mainEl.classList.contains('no-layout-offset')) {
      let wrapper = document.getElementById('nutri-workspace');
      if (!wrapper && mainEl.parentNode) {
        wrapper = document.createElement('div');
        wrapper.id = 'nutri-workspace';
        wrapper.className = 'md:pl-64 lg:pl-72 min-h-screen w-full flex flex-col transition-all';
        mainEl.parentNode.insertBefore(wrapper, mainEl);
        wrapper.appendChild(mainEl);
      }
      mainEl.classList.remove('md:ml-64', 'lg:ml-72');
      mainEl.classList.add('w-full', 'mx-auto', 'pt-20', 'md:pt-8', 'transition-all');
      if (!mainEl.classList.contains('p-4') && !mainEl.classList.contains('px-4')) {
        mainEl.classList.add('px-4', 'sm:px-6', 'lg:px-10');
      }
      mainEl.style.marginLeft = '';
      mainEl.style.marginRight = '';
    }
  }

  document.addEventListener('DOMContentLoaded', inicializarLayout);

  global.NutriLayout = {
    mostrarBloqueo: function (motivo) {
      mostrarNotificacion(motivo || 'Completa los pasos anteriores para desbloquear esta seccion', 'error');
    },
    mostrarNotificacion: mostrarNotificacion
  };
})(window);
