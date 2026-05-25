// Codigo de la interfaz para eventos, calculos y navegacion.
const actividadHombre = [
  "Sedentaria (1.2)", "Ligero (1.4)", "Moderado (1.6)", "Activo (1.75)", "Muy Activo (1.95)"
];

const actividadMujer = [
  "Sedentaria (1.2)", "Ligero (1.35)", "Moderado (1.5)", "Activo (1.65)", "Muy Activo (1.8)"
];

const sexo = document.getElementById("sexo");
const edad = document.getElementById("edad");
const peso = document.getElementById("peso");
const altura = document.getElementById("altura");
const btnRegresar = document.getElementById("btnRegresar");
const notification = document.getElementById("notification");

function configurarBloqueo(input, tipo) {
  if (!input) return;

  input.addEventListener('keydown', function(e) {
    if ([8, 46, 9, 27, 13, 37, 38, 39, 40].includes(e.keyCode)) return;
    if ((e.ctrlKey || e.metaKey) && [65, 67, 86, 88].includes(e.keyCode)) return;

    if (tipo === 'peso') {
      if ((e.keyCode >= 48 && e.keyCode <= 57) || (e.keyCode >= 96 && e.keyCode <= 105)) return;
      if ((e.key === '.' || e.keyCode === 190 || e.keyCode === 110) && !this.value.includes('.')) return;
    } else {
      if ((e.keyCode >= 48 && e.keyCode <= 57) || (e.keyCode >= 96 && e.keyCode <= 105)) return;
    }

    e.preventDefault();
    e.stopPropagation();
    return false;
  });

  input.addEventListener('input', function() {
    let valor = this.value;

    if (tipo === 'peso') {
      valor = valor.replace(/[^0-9.]/g, '');
      const partes = valor.split('.');
      if (partes.length > 2) valor = partes[0] + '.' + partes[1];
      if (partes[1] && partes[1].length > 2) valor = partes[0] + '.' + partes[1].substring(0, 2);
    } else {
      valor = valor.replace(/\D/g, '');
    }

    const maxLen = tipo === 'peso' ? 6 : 3;
    if (valor.length > maxLen) valor = valor.substring(0, maxLen);

    if (this.value !== valor) this.value = valor;
    validarVisual(input, tipo);
    guardarCambiosLocales();
  });

  input.addEventListener('paste', function(e) {
    e.preventDefault();
    const texto = (e.clipboardData || window.clipboardData).getData('text');
    let limpio;

    if (tipo === 'peso') {
      limpio = texto.replace(/[^0-9.]/g, '');
      const partes = limpio.split('.');
      if (partes.length > 2) limpio = partes[0] + '.' + partes[1];
      limpio = limpio.substring(0, 6);
    } else {
      limpio = texto.replace(/\D/g, '').substring(0, 3);
    }

    this.value = limpio;
    validarVisual(input, tipo);
    guardarCambiosLocales();
  });

  input.addEventListener('drop', e => e.preventDefault());
}

function validarVisual(input, tipo) {
    if (!input) return false;

    const valor = input.value.trim();
    const errorEl = document.getElementById(`${tipo}-error`);

    if (valor === "") {
        input.classList.remove('valid', 'invalid');
        if (errorEl) errorEl.classList.remove('show');
        return false;
    }

    const num = parseFloat(valor);
    let valido = false;

    switch(tipo) {
        case 'peso':
            valido = num >= 20 && num <= 300;
            break;
        case 'altura':
            valido = num >= 50 && num <= 250;
            break;
        case 'edad':
            valido = num >= 1 && num <= 120;
            break;
    }

    if (valido) {
        input.classList.add('valid');
        input.classList.remove('invalid');
        if (errorEl) errorEl.classList.remove('show');
    } else {
        input.classList.add('invalid');
        input.classList.remove('valid');
        if (errorEl) errorEl.classList.add('show');
    }

    return valido;
}

function mostrarNotif(mensaje, tipo) {
  const n = notification;
  n.textContent = mensaje;
  n.className = `notification ${tipo} show`;
  setTimeout(() => n.classList.remove('show'), 3000);
}

function leerDatos() {
  return {
    sexo: sexo ? sexo.value : "Hombre",
    peso: peso ? peso.value.trim() : "",
    edad: edad ? edad.value.trim() : "",
    altura: altura ? altura.value.trim() : ""
  };
}

function guardarCambiosLocales() {
    const datosPrevios = JSON.parse(localStorage.getItem('datosUsuario') || '{}');

    const edadVal = edad ? edad.value.trim() : "";
    const pesoVal = peso ? peso.value.trim() : "";
    const alturaVal = altura ? altura.value.trim() : "";
    const sexoVal = sexo ? sexo.value : "Hombre";

    const nuevosDatos = {
        sexo: sexoVal,
        edad: edadVal !== "" ? edadVal : (datosPrevios.edad || ""),
        peso: pesoVal !== "" ? pesoVal : (datosPrevios.peso || ""),
        altura: alturaVal !== "" ? alturaVal : (datosPrevios.altura || "")
    };

    localStorage.setItem('datosUsuario', JSON.stringify(nuevosDatos));
}

function cargarDatosGuardados() {
    const datosRaw = localStorage.getItem('datosUsuario');
    if (!datosRaw) return;

    try {
        const usuario = JSON.parse(datosRaw);

        if (sexo && usuario.sexo) {
            sexo.value = usuario.sexo;
        }

        if (edad && usuario.hasOwnProperty('edad') && usuario.edad !== "") {
            edad.value = usuario.edad;
            validarVisual(edad, 'edad');
        }

        if (peso && usuario.hasOwnProperty('peso') && usuario.peso !== "") {
            peso.value = usuario.peso;
            validarVisual(peso, 'peso');
        }

        if (altura && usuario.hasOwnProperty('altura') && usuario.altura !== "") {
            altura.value = usuario.altura;
            validarVisual(altura, 'altura');
        }
    } catch (e) {
    }
}

function validarAntesDeNavegar() {
  const vPeso = validarVisual(peso, 'peso');
  const vEdad = validarVisual(edad, 'edad');
  const vAltura = validarVisual(altura, 'altura');

  if (!vPeso || !vEdad || !vAltura) {
    mostrarNotif("Completa los datos numericos correctamente", "error");
    return false;
  }
  return true;
}

function abrirSomatotipo() {
  if (!validarAntesDeNavegar()) return;
  guardarCambiosLocales();
  window.location.href = "somatotipo.html";
}

function abrirIMC() {
  if (!validarAntesDeNavegar()) return;
  guardarCambiosLocales();
  window.location.href = "imc.html";
}

function abrirInfoParametros() {
  if (!validarAntesDeNavegar()) return;
  guardarCambiosLocales();
  localStorage.setItem('ultimaPagina', 'menu');
  window.location.href = "infoparametros.html?desde=menu";
}

function volverAtras() {
  guardarCambiosLocales();

  window.location.href = 'index.html';
}

document.addEventListener('DOMContentLoaded', function() {
  if (peso) configurarBloqueo(peso, 'peso');
  if (edad) configurarBloqueo(edad, 'edad');
  if (altura) configurarBloqueo(altura, 'altura');

  cargarDatosGuardados();

  if (sexo) {
    sexo.addEventListener('change', guardarCambiosLocales);
  }

  if (btnRegresar) {
    btnRegresar.addEventListener('click', volverAtras);
  }
});
