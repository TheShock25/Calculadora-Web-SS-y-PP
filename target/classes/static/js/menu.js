// ========== CONFIGURACION ==========
const actividadHombre = [
  "Sedentaria (1.2)", "Ligero (1.4)", "Moderado (1.6)", "Activo (1.75)", "Muy Activo (1.95)"
];

const actividadMujer = [
  "Sedentaria (1.2)", "Ligero (1.35)", "Moderado (1.5)", "Activo (1.65)", "Muy Activo (1.8)"
];

// Referencias DOM
const sexo = document.getElementById("sexo");
const edad = document.getElementById("edad");
const peso = document.getElementById("peso");
const altura = document.getElementById("altura");
const btnRegresar = document.getElementById("btnRegresar");
const notification = document.getElementById("notification");

// ========== BLOQUEO TOTAL DE CARACTERES INVALIDOS ==========
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

// ========== VALIDACION VISUAL ==========
function validarVisual(input, tipo) {
    if (!input) return false;
    
    const valor = input.value.trim();
    const errorEl = document.getElementById(`${tipo}-error`);
    
    // Si está vacío, limpiar estilos y salir
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
            // Permitimos números a partir de 1 para evitar que el "0" rompa la carga
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

// ========== NOTIFICACIONES ==========
function mostrarNotif(mensaje, tipo) {
  const n = notification;
  n.textContent = mensaje;
  n.className = `notification ${tipo} show`;
  setTimeout(() => n.classList.remove('show'), 3000);
}

// ========== FUNCIONES DE DATOS ==========
function leerDatos() {
  // Evitamos devolver "0" por defecto, devolvemos el valor real o vacío
  return {
    sexo: sexo ? sexo.value : "Hombre",
    peso: peso ? peso.value.trim() : "",
    edad: edad ? edad.value.trim() : "",
    altura: altura ? altura.value.trim() : ""
  };
}

function guardarCambiosLocales() {
    // 1. Primero leemos lo que ya existe en el "disco" (localStorage)
    const datosPrevios = JSON.parse(localStorage.getItem('datosUsuario') || '{}');

    // 2. Capturamos lo que hay en los inputs ahora mismo
    const edadVal = edad ? edad.value.trim() : "";
    const pesoVal = peso ? peso.value.trim() : "";
    const alturaVal = altura ? altura.value.trim() : "";
    const sexoVal = sexo ? sexo.value : "Hombre";

    // 3. Creamos el nuevo objeto PERO conservamos lo que ya existía si el input está vacío
    // Esto evita que si una página no tiene "edad", se borre de la memoria
    const nuevosDatos = {
        sexo: sexoVal,
        // Si el input está vacío, intentamos mantener lo que ya estaba guardado
        edad: edadVal !== "" ? edadVal : (datosPrevios.edad || ""),
        peso: pesoVal !== "" ? pesoVal : (datosPrevios.peso || ""),
        altura: alturaVal !== "" ? alturaVal : (datosPrevios.altura || "")
    };

    localStorage.setItem('datosUsuario', JSON.stringify(nuevosDatos));
    console.log("Guardado exitoso:", nuevosDatos);
}

function cargarDatosGuardados() {
    const datosRaw = localStorage.getItem('datosUsuario');
    if (!datosRaw) return;

    try {
        const usuario = JSON.parse(datosRaw);
        console.log("Cargando datos de memoria:", usuario);

        if (sexo && usuario.sexo) {
            sexo.value = usuario.sexo;
        }

        // CORRECCIÓN CLAVE: Verificamos que la propiedad EXISTA, no solo que sea "true"
        // Antes, si edad era "0" o undefined, esto fallaba.
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
        console.error("Error al parsear datos:", e);
    }
}

// ========== NAVEGACION ==========
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

// ========== CORRECCION: REGRESAR SIEMPRE A INDEX ==========
function volverAtras() {
  // Guardar datos antes de salir
  guardarCambiosLocales();
  
  // SIEMPRE ir al index.html, nunca usar history.back()
  window.location.href = 'index.html';
}

// ========== EVENTOS ==========
document.addEventListener('DOMContentLoaded', function() {
  // Configurar bloqueo estricto
  if (peso) configurarBloqueo(peso, 'peso');
  if (edad) configurarBloqueo(edad, 'edad');
  if (altura) configurarBloqueo(altura, 'altura');
  
  // Cargar datos previos
  cargarDatosGuardados();
  
  // Eventos de cambio
  if (sexo) {
    sexo.addEventListener('change', guardarCambiosLocales);
  }
  
  // Boton regresar - AHORA SIEMPRE VA A INDEX
  if (btnRegresar) {
    btnRegresar.addEventListener('click', volverAtras);
  }
});