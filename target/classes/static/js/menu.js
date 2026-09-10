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

  if (window.SecurityValidator) {
    const configs = {
      peso: { allowDecimal: true, min: 20, max: 300, maxDecimals: 2, maxLength: 6, errorElementId: 'peso-error' },
      altura: { allowDecimal: false, min: 50, max: 250, maxLength: 3, errorElementId: 'altura-error' },
      edad: { allowDecimal: false, min: 1, max: 120, maxLength: 3, errorElementId: 'edad-error' }
    };
    SecurityValidator.attachNumericFilter(input, {
      ...configs[tipo],
      onValidate: () => {
        guardarCambiosLocales();
      }
    });
    return;
  }
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
