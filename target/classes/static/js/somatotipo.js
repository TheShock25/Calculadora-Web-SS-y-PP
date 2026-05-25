// Codigo de la interfaz para eventos, calculos y navegacion.
const elementos = {
  altura: document.getElementById('altura'),
  peso: document.getElementById('peso'),
  tricipital: document.getElementById('tricipital'),
  subescapular: document.getElementById('subescapular'),
  supraespinal: document.getElementById('supraespinal'),
  pantorrillaPliegue: document.getElementById('pantorrillaPliegue'),
  diametroHumero: document.getElementById('diametroHumero'),
  diametroFemur: document.getElementById('diametroFemur'),
  perimetroBrazo: document.getElementById('perimetroBrazo'),
  perimetroPantorrilla: document.getElementById('perimetroPantorrilla'),

  endoValor: document.getElementById('endoValor'),
  mesoValor: document.getElementById('mesoValor'),
  ectoValor: document.getElementById('ectoValor'),
  endoBar: document.getElementById('endoBar'),
  mesoBar: document.getElementById('mesoBar'),
  ectoBar: document.getElementById('ectoBar'),
  tipoLabel: document.getElementById('tipoLabel'),
  tipoCard: document.getElementById('tipoCard'),
  descripcionArea: document.getElementById('descripcionArea'),

  calcularBtn: document.getElementById('calcularBtn'),
  btnRegresar: document.getElementById('btnRegresar'),

  tabButtons: document.querySelectorAll('.tab-button'),
  tabPanels: document.querySelectorAll('.tab-panel'),

  somatocartaCanvas: document.getElementById('somatocartaCanvas'),
  bodyTypeCanvas: document.getElementById('bodyTypeCanvas')
};

const notification = document.getElementById('notification');
let resultadoActual = null;

function configurarBloqueo(input, tipo) {
  if (!input) return;

  const permitirDecimal = ['peso', 'tricipital', 'subescapular', 'supraespinal',
                         'pantorrillaPliegue', 'diametroHumero', 'diametroFemur',
                         'perimetroBrazo', 'perimetroPantorrilla'].includes(tipo);

  input.addEventListener('keydown', function(e) {
    if ([8, 46, 9, 27, 13, 37, 38, 39, 40].includes(e.keyCode)) return;
    if ((e.ctrlKey || e.metaKey) && [65, 67, 86, 88].includes(e.keyCode)) return;

    if (permitirDecimal) {
      if ((e.keyCode >= 48 && e.keyCode <= 57) || (e.keyCode >= 96 && e.keyCode <= 105)) return;
      if ((e.key === '.' || e.keyCode === 190 || e.keyCode === 110) && !this.value.includes('.')) return;
    } else {
      if ((e.keyCode >= 48 && e.keyCode <= 57) || (e.keyCode >= 96 && e.keyCode <= 105)) return;
    }

    e.preventDefault();
    return false;
  });

  input.addEventListener('input', function() {
    let valor = this.value;

    if (permitirDecimal) {
      valor = valor.replace(/[^0-9.]/g, '');
      const partes = valor.split('.');
      if (partes.length > 2) valor = partes[0] + '.' + partes[1];
      if (partes[1] && partes[1].length > 2) valor = partes[0] + '.' + partes[1].substring(0, 2);
    } else {
      valor = valor.replace(/\D/g, '');
    }

    const maxLen = parseInt(this.getAttribute('maxlength')) || 10;
    if (valor.length > maxLen) valor = valor.substring(0, maxLen);

    if (this.value !== valor) this.value = valor;
    validarVisual(input, tipo);
  });

  input.addEventListener('paste', function(e) {
    e.preventDefault();
    const texto = (e.clipboardData || window.clipboardData).getData('text');
    let limpio;

    if (permitirDecimal) {
      limpio = texto.replace(/[^0-9.]/g, '');
      const partes = limpio.split('.');
      if (partes.length > 2) limpio = partes[0] + '.' + partes[1];
      limpio = limpio.substring(0, 5);
    } else {
      limpio = texto.replace(/\D/g, '').substring(0, 3);
    }

    this.value = limpio;
    validarVisual(input, tipo);
  });

  input.addEventListener('drop', e => e.preventDefault());
}

function validarVisual(input, tipo) {
  const valor = input.value;
  const errorEl = document.getElementById(`${tipo}-error`);

  if (!valor) {
    input.className = '';
    if (errorEl) errorEl.classList.remove('show');
    return false;
  }

  let valido = false;
  const num = parseFloat(valor);

  switch(tipo) {
    case 'peso':
      valido = /^\d{2,3}(\.\d{1,2})?$/.test(valor) && num >= 20 && num <= 300;
      break;
    case 'altura':
      valido = /^\d{2,3}$/.test(valor) && num >= 50 && num <= 250;
      break;
    default:
      valido = /^\d+(\.\d{1,2})?$/.test(valor) && num >= 0 && num <= 999;
  }

  input.className = valido ? 'valid' : 'invalid';
  if (errorEl) errorEl.classList.toggle('show', !valido);
  return valido;
}

function mostrarNotif(mensaje, tipo) {
  const n = notification;
  n.textContent = mensaje;
  n.className = `notification ${tipo} show`;
  setTimeout(() => n.classList.remove('show'), 3000);
}

function cargarDatosUsuario() {
  const datos = localStorage.getItem('datosUsuario');
  if (datos) {
    try {
      const usuario = JSON.parse(datos);
      if (elementos.altura && usuario.altura) {
        elementos.altura.value = usuario.altura;
        validarVisual(elementos.altura, 'altura');
      }
      if (elementos.peso && usuario.peso) {
        elementos.peso.value = usuario.peso;
        validarVisual(elementos.peso, 'peso');
      }
      mostrarNotif('Datos precargados desde calculadora principal', 'success');
    } catch(e) {
    }
  }
}

function guardarCambios() {
  const datosExistentesRaw = localStorage.getItem('datosUsuario');
  let datosCompletos = {};

  try {
    datosCompletos = datosExistentesRaw ? JSON.parse(datosExistentesRaw) : {};
  } catch (e) {
    datosCompletos = {};
  }

  datosCompletos.altura = elementos.altura.value;
  datosCompletos.peso = elementos.peso.value;

  if (!datosCompletos.sexo) {
      datosCompletos.sexo = 'Hombre';
  }

  localStorage.setItem('datosUsuario', JSON.stringify(datosCompletos));
}

function calcularEndomorfia() {
  const tricipital = parseFloat(elementos.tricipital.value) || 0;
  const subescapular = parseFloat(elementos.subescapular.value) || 0;
  const supraespinal = parseFloat(elementos.supraespinal.value) || 0;
  const altura = parseFloat(elementos.altura.value) || 170;

  const sumaPliegues = tricipital + subescapular + supraespinal;
  const X = sumaPliegues * (170.18 / altura);

  const endomorfia = -0.7182 + (0.1451 * X) - (0.00068 * Math.sqrt(X)) + (0.0000014 * Math.pow(X, 3));
  return Math.min(7, Math.max(0.5, endomorfia));
}

function calcularMesomorfia() {
  const diametroHumero = parseFloat(elementos.diametroHumero.value) || 0;
  const diametroFemur = parseFloat(elementos.diametroFemur.value) || 0;
  const perimetroBrazo = parseFloat(elementos.perimetroBrazo.value) || 0;
  const perimetroPantorrilla = parseFloat(elementos.perimetroPantorrilla.value) || 0;
  const pliegueTricipital = parseFloat(elementos.tricipital.value) || 0;
  const plieguePantorrilla = parseFloat(elementos.pantorrillaPliegue.value) || 0;
  const altura = parseFloat(elementos.altura.value) || 170;

  const brazoCorregido = perimetroBrazo - (pliegueTricipital / 10);
  const pantorrillaCorregida = perimetroPantorrilla - (plieguePantorrilla / 10);

  const mesomorfia = (0.858 * diametroHumero) + (0.601 * diametroFemur) +
                     (0.188 * brazoCorregido) + (0.161 * pantorrillaCorregida) -
                     (0.131 * altura) + 4.5;

  return Math.min(7, Math.max(0.5, mesomorfia));
}

function calcularEctomorfia() {
  const altura = parseFloat(elementos.altura.value) || 170;
  const peso = parseFloat(elementos.peso.value) || 70;

  const indicePonderal = altura / Math.cbrt(peso);

  let ectomorfia;
  if (indicePonderal >= 40.75) {
    ectomorfia = (0.732 * indicePonderal) - 28.58;
  } else if (indicePonderal > 38.25 && indicePonderal < 40.75) {
    ectomorfia = (0.463 * indicePonderal) - 17.63;
  } else {
    ectomorfia = 0.5;
  }

  return Math.min(7, Math.max(0.5, ectomorfia));
}

function determinarTipoDominante(endo, meso, ecto) {
  const max = Math.max(endo, meso, ecto);
  const tipos = [];

  if (Math.abs(endo - max) <= 0.5) tipos.push('Endomorfo');
  if (Math.abs(meso - max) <= 0.5) tipos.push('Mesomorfo');
  if (Math.abs(ecto - max) <= 0.5) tipos.push('Ectomorfo');

  return tipos.length > 0 ? tipos.join('-') : 'Balanceado';
}

function obtenerDescripcion(tipo) {
  let desc = '';

  if (tipo.includes('Endomorfo')) {
    desc += 'ENDOMORFO: Cuerpo con tendencia a acumular grasa. Metabolismo mas lento, facil ganancia de peso. Requiere mayor actividad cardiovascular y control calorico estricto.\n\n';
  }
  if (tipo.includes('Mesomorfo')) {
    desc += 'MESOMORFO: Estructura atletica natural. Ganancia muscular eficiente, metabolismo equilibrado. Responde bien al entrenamiento de fuerza y resistencia.\n\n';
  }
  if (tipo.includes('Ectomorfo')) {
    desc += 'ECTOMORFO: Complexion delgada y alta. Metabolismo acelerado, dificultad para ganar peso. Requiere hipercalorica y entrenamiento enfocado en masa muscular.\n\n';
  }

  if (desc === '') {
    desc = 'Tipo corporal balanceado con caracteristicas mixtas de los tres componentes.\n\n';
  }

  desc += obtenerRecomendaciones(tipo);
  return desc;
}

function obtenerRecomendaciones(tipo) {
  let rec = 'RECOMENDACIONES ESPECIFICAS:\n\n';

  if (tipo.includes('Ectomorfo')) {
    rec += '• Entrenamiento: Peso pesado, 4-6 repeticiones, series largas\n';
    rec += '• Cardio: Minimo (15-20 min), 2-3 veces/semana\n';
    rec += '• Dieta: Hipercalorica, 300-500 kcal excedente\n';
    rec += '• Descanso: 2-3 min entre series, 48h entre grupos musculares\n';
    rec += '• Suplementacion: Creatina, proteinas, carbohidratos\n\n';
    rec += 'Ventaja: Definicion natural | Desafio: Ganancia de masa';
  } else if (tipo.includes('Mesomorfo')) {
    rec += '• Entrenamiento: Mixto pesas/cardio, 8-12 repeticiones\n';
    rec += '• Cardio: Moderado (30 min), 3-4 veces/semana\n';
    rec += '• Dieta: Mantenimiento calorico, macros balanceados\n';
    rec += '• Descanso: 60-90 seg entre series, variacion de rutinas\n';
    rec += '• Suplementacion: Proteina, pre-entreno opcional\n\n';
    rec += 'Ventaja: Respuesta rapida al ejercicio | Desafio: Evitar estancamiento';
  } else if (tipo.includes('Endomorfo')) {
    rec += '• Entrenamiento: Circuitos HIIT, 12-15 repeticiones\n';
    rec += '• Cardio: Frecuente (40-45 min), 5-6 veces/semana\n';
    rec += '• Dieta: Deficit calorico moderado, baja en carbohidratos simples\n';
    rec += '• Descanso: 30-60 seg entre series, mantener FC elevada\n';
    rec += '• Suplementacion: Termogenicos, proteinas, fibra\n\n';
    rec += 'Ventaja: Fuerza natural | Desafio: Perdida de grasa corporal';
  }

  return rec;
}

function calcularSomatotipo() {
  try {
    if (!validarVisual(elementos.altura, 'altura') || !validarVisual(elementos.peso, 'peso')) {
      mostrarNotif('Completa altura y peso correctamente', 'error');
      return;
    }

    const endo = calcularEndomorfia();
    const meso = calcularMesomorfia();
    const ecto = calcularEctomorfia();

    const tipo = determinarTipoDominante(endo, meso, ecto);
    const descripcion = obtenerDescripcion(tipo);

    resultadoActual = { endo, meso, ecto, tipo, descripcion };

    actualizarResultados();
    dibujarSomatocarta();
    dibujarRepresentacionCorporal();

    guardarCambios();
    mostrarNotif('Calculo completado. Revisa la pestaña Resultados', 'success');

    setTimeout(() => {
      document.querySelector('[data-tab="results"]').click();
    }, 800);

  } catch (error) {
    mostrarNotif('Error en los calculos. Verifica los datos', 'error');
  }
}

function actualizarResultados() {
  if (!resultadoActual) return;

  const { endo, meso, ecto, tipo, descripcion } = resultadoActual;

  elementos.endoValor.textContent = endo.toFixed(2);
  elementos.mesoValor.textContent = meso.toFixed(2);
  elementos.ectoValor.textContent = ecto.toFixed(2);

  elementos.endoBar.style.width = (endo / 7 * 100) + '%';
  elementos.mesoBar.style.width = (meso / 7 * 100) + '%';
  elementos.ectoBar.style.width = (ecto / 7 * 100) + '%';

  elementos.tipoLabel.innerHTML = `Tipo dominante: <strong>${tipo}</strong>`;

  elementos.tipoCard.className = 'tipo-card';
  if (tipo.includes('Endomorfo')) elementos.tipoCard.classList.add('tipo-endo');
  else if (tipo.includes('Mesomorfo')) elementos.tipoCard.classList.add('tipo-meso');
  else if (tipo.includes('Ectomorfo')) elementos.tipoCard.classList.add('tipo-ecto');
  else elementos.tipoCard.classList.add('tipo-balance');

  elementos.descripcionArea.innerHTML = descripcion.replace(/\n/g, '<br>');
}

function dibujarSomatocarta() {
  const canvas = elementos.somatocartaCanvas;
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  ctx.clearRect(0, 0, width, height);

  const centerX = width / 2;
  const centerY = height / 2;
  const scale = 25;

  ctx.fillStyle = '#FAFAFA';
  ctx.fillRect(0, 0, width, height);

  ctx.beginPath();
  ctx.strokeStyle = '#E0E0E0';
  ctx.lineWidth = 1;

  for (let i = -7; i <= 7; i++) {
    ctx.moveTo(centerX + i * scale, 0);
    ctx.lineTo(centerX + i * scale, height);
    ctx.moveTo(0, centerY - i * scale);
    ctx.lineTo(width, centerY - i * scale);
  }
  ctx.stroke();

  ctx.beginPath();
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 2;
  ctx.moveTo(centerX - 7 * scale, centerY);
  ctx.lineTo(centerX + 7 * scale, centerY);
  ctx.moveTo(centerX, centerY - 7 * scale);
  ctx.lineTo(centerX, centerY + 3 * scale);
  ctx.stroke();

  ctx.font = 'bold 12px Segoe UI';
  ctx.fillStyle = '#616161';

  for (let i = 1; i <= 7; i++) {
    ctx.beginPath();
    ctx.moveTo(centerX + i * scale, centerY - 5);
    ctx.lineTo(centerX + i * scale, centerY + 5);
    ctx.stroke();
    ctx.fillText(i, centerX + i * scale - 5, centerY + 20);

    ctx.beginPath();
    ctx.moveTo(centerX - i * scale, centerY - 5);
    ctx.lineTo(centerX - i * scale, centerY + 5);
    ctx.stroke();
    ctx.fillText(i, centerX - i * scale - 5, centerY + 20);

    ctx.beginPath();
    ctx.moveTo(centerX - 5, centerY - i * scale);
    ctx.lineTo(centerX + 5, centerY - i * scale);
    ctx.stroke();
    ctx.fillText(i, centerX + 10, centerY - i * scale + 5);
  }

  ctx.font = 'bold 14px Segoe UI';
  ctx.fillStyle = '#D32F2F';
  ctx.fillText('Endomorfia', centerX - 7 * scale - 80, centerY - 10);

  ctx.fillStyle = '#388E3C';
  ctx.fillText('Mesomorfia', centerX - 40, centerY - 7 * scale - 15);

  ctx.fillStyle = '#1976D2';
  ctx.fillText('Ectomorfia', centerX + 6 * scale + 10, centerY - 10);

  if (resultadoActual) {
    const { endo, meso, ecto } = resultadoActual;

    const x = ecto - endo;
    const y = 2 * meso - (endo + ecto);
    const yLimitado = Math.max(-3, Math.min(7, y));

    const puntoX = centerX + x * scale;
    const puntoY = centerY - yLimitado * scale;

    ctx.beginPath();
    ctx.fillStyle = 'rgba(255, 193, 7, 0.3)';
    ctx.arc(puntoX, puntoY, 15, 0, 2 * Math.PI);
    ctx.fill();

    ctx.beginPath();
    ctx.fillStyle = '#FFC107';
    ctx.arc(puntoX, puntoY, 8, 0, 2 * Math.PI);
    ctx.fill();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.font = 'bold 11px Segoe UI';
    ctx.fillStyle = '#212529';
    ctx.fillText(`E:${endo.toFixed(1)} M:${meso.toFixed(1)} X:${ecto.toFixed(1)}`,
                 puntoX + 15, puntoY - 10);
  }
}

function dibujarRepresentacionCorporal() {
  const canvas = elementos.bodyTypeCanvas;
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  ctx.clearRect(0, 0, width, height);

  if (!resultadoActual) {
    ctx.font = '14px Segoe UI';
    ctx.fillStyle = '#9E9E9E';
    ctx.textAlign = 'center';
    ctx.fillText('Ingresa datos y calcula', width/2, height/2);
    return;
  }

  const centerX = width / 2;
  const { endo, meso, ecto } = resultadoActual;

  const factorAltura = 1 + (ecto * 0.05) - (endo * 0.02);
  const escalaBase = 0.9;

  const anchoHombros = (45 + (meso * 6) + (endo * 2)) * escalaBase;
  const anchoCintura = (30 + (endo * 8) - (ecto * 2)) * escalaBase;
  const anchoCadera = (35 + (endo * 6) + (meso * 2)) * escalaBase;
  const grosorMiembros = (10 + (meso * 3) + (endo * 4) - (ecto * 3)) * escalaBase;

  const yInicio = 50;
  const alturaTorso = 110 * factorAltura;
  const alturaPiernas = 120 * factorAltura;

  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 2.5;

  const maxVal = Math.max(endo, meso, ecto);
  if (maxVal === endo) ctx.fillStyle = 'rgba(211, 47, 47, 0.1)';
  else if (maxVal === meso) ctx.fillStyle = 'rgba(56, 142, 60, 0.1)';
  else ctx.fillStyle = 'rgba(25, 118, 210, 0.1)';

  ctx.beginPath();

  ctx.arc(centerX, yInicio, 18, 0, Math.PI * 2);

  ctx.moveTo(centerX - 8, yInicio + 18);
  ctx.lineTo(centerX - 8, yInicio + 25);

  ctx.bezierCurveTo(centerX - anchoHombros, yInicio + 25, centerX - anchoHombros - 10, yInicio + 40, centerX - anchoHombros, yInicio + 45);
  ctx.lineTo(centerX - anchoHombros - (grosorMiembros/2), yInicio + 130);
  ctx.arc(centerX - anchoHombros - (grosorMiembros/4), yInicio + 135, grosorMiembros/2, Math.PI, 0, true);
  ctx.lineTo(centerX - anchoHombros + (grosorMiembros/2), yInicio + 45);

  ctx.bezierCurveTo(centerX - anchoCintura, yInicio + 80, centerX - anchoCintura, yInicio + 100, centerX - anchoCadera, yInicio + alturaTorso);

  ctx.lineTo(centerX - anchoCadera, yInicio + alturaTorso + alturaPiernas);
  ctx.lineTo(centerX - anchoCadera + grosorMiembros, yInicio + alturaTorso + alturaPiernas);
  ctx.lineTo(centerX - 5, yInicio + alturaTorso + 40);

  ctx.lineTo(centerX + 5, yInicio + alturaTorso + 40);
  ctx.lineTo(centerX + anchoCadera - grosorMiembros, yInicio + alturaTorso + alturaPiernas);
  ctx.lineTo(centerX + anchoCadera, yInicio + alturaTorso + alturaPiernas);
  ctx.lineTo(centerX + anchoCadera, yInicio + alturaTorso);

  ctx.bezierCurveTo(centerX + anchoCintura, yInicio + 100, centerX + anchoCintura, yInicio + 80, centerX + anchoHombros - (grosorMiembros/2), yInicio + 45);

  ctx.lineTo(centerX + anchoHombros + (grosorMiembros/2), yInicio + 130);
  ctx.arc(centerX + anchoHombros + (grosorMiembros/4), yInicio + 135, grosorMiembros/2, 0, Math.PI, true);
  ctx.lineTo(centerX + anchoHombros, yInicio + 45);
  ctx.bezierCurveTo(centerX + anchoHombros - 10, yInicio + 40, centerX + anchoHombros, yInicio + 25, centerX + 8, yInicio + 25);

  ctx.lineTo(centerX + 8, yInicio + 18);

  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = 'rgba(0,0,0,0.2)';

  if (meso > 4) {
    ctx.moveTo(centerX - anchoHombros + 15, yInicio + 55);
    ctx.lineTo(centerX - 5, yInicio + 65);
    ctx.moveTo(centerX + anchoHombros - 15, yInicio + 55);
    ctx.lineTo(centerX + 5, yInicio + 65);
  }

  if (endo > 4) {
    ctx.moveTo(centerX - anchoCintura + 5, yInicio + 100);
    ctx.quadraticCurveTo(centerX, yInicio + 115, centerX + anchoCintura - 5, yInicio + 100);
  }

  ctx.stroke();

  ctx.font = 'bold 16px Segoe UI';
  ctx.fillStyle = '#212529';
  ctx.textAlign = 'center';
  ctx.fillText(determinarTipoDominante(endo, meso, ecto), centerX, height - 10);
}

function inicializarPestanas() {
  elementos.tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      elementos.tabButtons.forEach(b => b.classList.remove('active'));
      elementos.tabPanels.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const tabId = btn.getAttribute('data-tab');
      document.getElementById(`tab-${tabId}`).classList.add('active');

      if (tabId === 'graphics' && resultadoActual) {
        setTimeout(() => {
          dibujarSomatocarta();
          dibujarRepresentacionCorporal();
        }, 100);
      }
    });
  });
}

function volverAtras() {
  guardarCambios();
  window.location.href = 'menu.html';
}

document.addEventListener('DOMContentLoaded', () => {
  const campos = [
    ['altura', 'altura'], ['peso', 'peso'], ['tricipital', 'tricipital'],
    ['subescapular', 'subescapular'], ['supraespinal', 'supraespinal'],
    ['pantorrillaPliegue', 'pantorrillaPliegue'], ['diametroHumero', 'diametroHumero'],
    ['diametroFemur', 'diametroFemur'], ['perimetroBrazo', 'perimetroBrazo'],
    ['perimetroPantorrilla', 'perimetroPantorrilla']
  ];

  campos.forEach(([id, tipo]) => {
    configurarBloqueo(elementos[id], tipo);
  });

  cargarDatosUsuario();

  inicializarPestanas();

  if (elementos.calcularBtn) {
    elementos.calcularBtn.addEventListener('click', calcularSomatotipo);
  }

  if (elementos.btnRegresar) {
    elementos.btnRegresar.addEventListener('click', volverAtras);
  }

  [elementos.altura, elementos.peso].forEach(input => {
    if (input) {
      input.addEventListener('change', guardarCambios);
    }
  });

  dibujarSomatocarta();
  dibujarRepresentacionCorporal();
});
