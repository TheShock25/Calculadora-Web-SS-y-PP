// Codigo de la interfaz para eventos, calculos y navegacion.
const actividadHombre = [
  "Sedentaria (1.2)", "Ligero (1.4)", "Moderado (1.6)", "Activo (1.75)", "Muy Activo (1.95)"
];

const actividadMujer = [
  "Sedentaria (1.2)", "Ligero (1.35)", "Moderado (1.5)", "Activo (1.65)", "Muy Activo (1.8)"
];

const sexo = document.getElementById("sexo");
const actividad = document.getElementById("actividad");
const ecuacion = document.getElementById("ecuacion");
const peso = document.getElementById("peso");
const altura = document.getElementById("altura");
const edad = document.getElementById("edad");
const geb = document.getElementById("geb");
const eta = document.getElementById("eta");
const get = document.getElementById("get");
const barFill = document.getElementById("barFill");
const modelo = document.getElementById("modelo");
const notification = document.getElementById("notification");

let ultimoGET = 2000;

function bloquearCaracteresInvalidos(input, permitirPunto = false) {
  input.addEventListener('keydown', function(e) {
    if ([8, 46, 9, 27, 13, 37, 38, 39, 40].includes(e.keyCode)) {
      return;
    }

    if ((e.ctrlKey || e.metaKey) && [65, 67, 86, 88].includes(e.keyCode)) {
      return;
    }

    if ((e.keyCode >= 48 && e.keyCode <= 57) || (e.keyCode >= 96 && e.keyCode <= 105)) {
      return;
    }

    if (permitirPunto && (e.key === '.' || e.key === ',' || e.keyCode === 190 || e.keyCode === 110)) {
      if (!this.value.includes('.')) {
        if (e.key === ',') {
          e.preventDefault();
          this.value += '.';
        }
        return;
      }
    }

    e.preventDefault();
  });

  input.addEventListener('input', function(e) {
    let valor = this.value;
    let cursorPos = this.selectionStart;

    if (permitirPunto) {
      valor = valor.replace(/[^0-9.]/g, '');
      const partes = valor.split('.');
      if (partes.length > 2) {
        valor = partes[0] + '.' + partes.slice(1).join('');
      }
      if (partes[1] && partes[1].length > 2) {
        valor = partes[0] + '.' + partes[1].substring(0, 2);
      }
    } else {
      valor = valor.replace(/\D/g, '');
    }

    this.value = valor;
    validarCampo(this, permitirPunto ? 'peso' : (input.id === 'altura' ? 'altura' : 'edad'));
  });

  input.addEventListener('paste', function(e) {
    e.preventDefault();
    const texto = (e.clipboardData || window.clipboardData).getData('text');

    let limpio;
    if (permitirPunto) {
      limpio = texto.replace(/[^0-9.]/g, '');
      const partes = limpio.split('.');
      if (partes.length > 2) limpio = partes[0] + '.' + partes[1];
    } else {
      limpio = texto.replace(/\D/g, '');
    }

    const maxLength = parseInt(this.getAttribute('maxlength')) || 10;
    this.value = limpio.substring(0, maxLength);

    validarCampo(this, permitirPunto ? 'peso' : (input.id === 'altura' ? 'altura' : 'edad'));
  });
}

function validarCampo(input, tipo) {
  const valor = input.value;
  const errorElement = document.getElementById(`${tipo}-error`);

  if (valor === '') {
    input.classList.remove('valid', 'invalid');
    errorElement.classList.remove('show');
    return false;
  }

  let esValido = false;
  const num = parseFloat(valor);

  switch(tipo) {
    case 'peso':
      esValido = /^\d{2,3}(\.\d{1,2})?$/.test(valor) && num >= 20 && num <= 300;
      break;
    case 'altura':
      esValido = /^\d{2,3}$/.test(valor) && num >= 50 && num <= 250;
      break;
    case 'edad':
      esValido = /^\d{1,3}$/.test(valor) && num >= 18 && num <= 120;
      break;
  }

  if (esValido) {
    input.classList.add('valid');
    input.classList.remove('invalid');
    errorElement.classList.remove('show');
  } else {
    input.classList.add('invalid');
    input.classList.remove('valid');
    errorElement.classList.add('show');
  }

  return esValido;
}

function cargarActividad() {
  if (!actividad) return;
  actividad.innerHTML = "";
  const lista = sexo.value === "Hombre" ? actividadHombre : actividadMujer;
  lista.forEach(a => {
    const opt = document.createElement("option");
    opt.textContent = a;
    opt.value = a;
    actividad.appendChild(opt);
  });
}

function obtenerFactorActividad() {
  const nivel = actividad.value;
  if (!nivel) return 1.0;

  const inicio = nivel.indexOf('(');
  const fin = nivel.indexOf(')');

  if (inicio !== -1 && fin !== -1 && fin > inicio) {
    try {
      const factorStr = nivel.substring(inicio + 1, fin);
      return parseFloat(factorStr);
    } catch (e) {
      return 1.0;
    }
  }
  return 1.0;
}

function calcularGEBHarrisBenedict(sexoVal, pesoVal, alturaVal, edadVal) {
  if (sexoVal === "Hombre") {
    return 66.4730 + (13.7516 * pesoVal) + (5.0033 * alturaVal) - (6.7559 * edadVal);
  } else {
    return 655.0955 + (9.5634 * pesoVal) + (1.8496 * alturaVal) - (4.6756 * edadVal);
  }
}

function calcularGEBMifflin(sexoVal, pesoVal, alturaVal, edadVal) {
  if (sexoVal === "Hombre") {
    return (10 * pesoVal) + (6.25 * alturaVal) - (5 * edadVal) + 5;
  } else {
    return (10 * pesoVal) + (6.25 * alturaVal) - (5 * edadVal) - 161;
  }
}

function calcularGEBValencia(sexoVal, pesoVal, edadVal) {
  const edadMin = Math.max(18, edadVal);
  if (sexoVal === "Hombre") {
    if (edadMin <= 30) return 13.37 * pesoVal + 747;
    else if (edadMin < 60) return 13.08 * pesoVal + 693;
    else return 14.21 * pesoVal + 429;
  } else {
    if (edadMin <= 30) return 11.02 * pesoVal + 679;
    else if (edadMin < 60) return 10.92 * pesoVal + 677;
    else return 10.98 * pesoVal + 520;
  }
}

function mostrarNotificacion(mensaje, tipo = 'info', duracion = 3000) {
  notification.textContent = mensaje;
  notification.className = `notification ${tipo}`;
  notification.classList.add('show');

  setTimeout(() => {
    notification.classList.remove('show');
  }, duracion);
}

function guardarDatosUsuario() {
  const datos = {
    sexo: sexo.value,
    peso: peso.value,
    edad: edad.value,
    altura: altura.value,
    ecuacion: ecuacion.value,
    actividad: actividad.value,
    timestamp: new Date().toISOString()
  };
  localStorage.setItem('datosUsuarioNutri', JSON.stringify(datos));
}

function cargarDatosUsuario() {
  const datosGuardados = localStorage.getItem('datosUsuarioNutri');
  if (datosGuardados) {
    try {
      const usuario = JSON.parse(datosGuardados);

      if (usuario.sexo && sexo) sexo.value = usuario.sexo;
      if (usuario.ecuacion && ecuacion) ecuacion.value = usuario.ecuacion;
      if (usuario.peso && peso) {
        peso.value = usuario.peso;
        validarCampo(peso, 'peso');
      }
      if (usuario.altura && altura) {
        altura.value = usuario.altura;
        validarCampo(altura, 'altura');
      }
      if (usuario.edad && edad) {
        edad.value = usuario.edad;
        validarCampo(edad, 'edad');
      }

      cargarActividad();

      if (usuario.actividad && actividad) {
        const opciones = Array.from(actividad.options);
        const opcion = opciones.find(opt => opt.value === usuario.actividad);
        if (opcion) actividad.value = usuario.actividad;
      }

      if (peso.value && altura.value && edad.value) {
        setTimeout(realizarCalculo, 300);
      }

    } catch (e) {
    }
  }
}

function guardarGET() {
  const getText = get.textContent;
  const match = getText.match(/(\d+(?:\.\d+)?)/);
  if (match) {
    const getValor = Math.round(parseFloat(match[1]));
    localStorage.setItem('ultimoGETNutri', getValor);
    ultimoGET = getValor;
  }
}

function obtenerGETActual() {
  const getText = get.textContent;
  const match = getText.match(/(\d+(?:\.\d+)?)/);
  if (match) return Math.round(parseFloat(match[1]));
  if (ultimoGET) return ultimoGET;
  const getGuardado = localStorage.getItem('ultimoGETNutri');
  if (getGuardado) return parseInt(getGuardado);
  return 2000;
}

function realizarCalculo() {
  try {
    const pesoValido = validarCampo(peso, 'peso');
    const alturaValida = validarCampo(altura, 'altura');
    const edadValida = validarCampo(edad, 'edad');

    if (!pesoValido || !alturaValida || !edadValida) {
      mostrarNotificacion(' Corrige los campos marcados en rojo', 'error');
      return;
    }

    const pesoVal = parseFloat(peso.value);
    const alturaVal = parseFloat(altura.value);
    const edadVal = parseInt(edad.value);
    const sexoVal = sexo.value;
    const ecuacionVal = ecuacion.value;

    let gastoBasal = 0;
    switch (ecuacionVal) {
      case "Harris-Benedict":
        gastoBasal = calcularGEBHarrisBenedict(sexoVal, pesoVal, alturaVal, edadVal);
        break;
      case "Mifflin-St Jeor":
        gastoBasal = calcularGEBMifflin(sexoVal, pesoVal, alturaVal, edadVal);
        break;
      case "Valencia":
        gastoBasal = calcularGEBValencia(sexoVal, pesoVal, edadVal);
        break;
      default:
        gastoBasal = calcularGEBHarrisBenedict(sexoVal, pesoVal, alturaVal, edadVal);
    }

    const etaVal = gastoBasal * 0.10;
    const factor = obtenerFactorActividad();
    const gastoTotal = (gastoBasal + etaVal) * factor;
    ultimoGET = Math.round(gastoTotal);

    geb.textContent = `${Math.round(gastoBasal)} kcal/día`;
    eta.textContent = `${Math.round(etaVal)} kcal/día`;
    get.textContent = `${Math.round(gastoTotal)} kcal/día`;

    modelo.textContent = `Ecuación: ${ecuacionVal}`;

    const maxReferencia = 4000;
    let porcentaje = (gastoTotal / maxReferencia) * 100;
    porcentaje = Math.min(porcentaje, 100);
    barFill.style.width = porcentaje + "%";

    guardarDatosUsuario();
    guardarGET();

    mostrarNotificacion(' Cálculo completado', 'success');

  } catch (error) {
    mostrarNotificacion(' Error en cálculo', 'error');
  }
}

if (sexo) {
  sexo.addEventListener('change', () => {
    cargarActividad();
    guardarDatosUsuario();
  });
}

if (ecuacion && modelo) {
  ecuacion.addEventListener('change', e => {
    modelo.textContent = "Ecuación: " + e.target.value;
    guardarDatosUsuario();
  });
}

document.getElementById("calcular").addEventListener('click', realizarCalculo);

document.getElementById("menu").addEventListener('click', () => {
  guardarDatosUsuario();
  window.location.href = "menu.html";
});

document.getElementById("equivalentes").addEventListener('click', () => {
  guardarDatosUsuario();
  const getValor = obtenerGETActual();
  window.location.href = `equivalentes.html?get=${getValor}`;
});

document.addEventListener('DOMContentLoaded', function() {
  bloquearCaracteresInvalidos(peso, true);
  bloquearCaracteresInvalidos(altura, false);
  bloquearCaracteresInvalidos(edad, false);

  cargarActividad();
  cargarDatosUsuario();

  const getGuardado = localStorage.getItem('ultimoGETNutri');
  if (getGuardado) {
    ultimoGET = parseInt(getGuardado);
  }
});

if (actividad) {
  actividad.addEventListener('change', () => {
    guardarDatosUsuario();
    if (peso.value && altura.value && edad.value) {
      realizarCalculo();
    }
  });
}
