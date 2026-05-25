// Codigo de la interfaz para eventos, calculos y navegacion.
let sexo = "Hombre";
let peso = 0;

const elementos = {
  imcValor: document.getElementById('imcValor'),
  pesoIdealValor: document.getElementById('pesoIdealValor'),
  grasaValor: document.getElementById('grasaValor'),
  lbmValor: document.getElementById('lbmValor'),
  iccValor: document.getElementById('iccValor'),
  ictValor: document.getElementById('ictValor'),

  edad: document.getElementById('edad'),
  altura: document.getElementById('altura'),
  pesoActual: document.getElementById('pesoActual'),

  brazo: document.getElementById('brazo'),
  tricipital: document.getElementById('tricipital'),

  dm: document.getElementById('dm'),
  dr: document.getElementById('dr'),
  df: document.getElementById('df'),

  pectoral: document.getElementById('pectoral'),
  axilar: document.getElementById('axilar'),
  tricep: document.getElementById('tricep'),
  subescapular: document.getElementById('subescapular'),
  abdominal: document.getElementById('abdominal'),
  suprailiaco: document.getElementById('suprailiaco'),
  muslo: document.getElementById('muslo'),

  cintura: document.getElementById('cintura'),
  cadera: document.getElementById('cadera'),

  abValor: document.getElementById('abValor'),
  agbValor: document.getElementById('agbValor'),
  ambValor: document.getElementById('ambValor'),
  ambCorrValor: document.getElementById('ambCorrValor'),
  masaOseaValor: document.getElementById('masaOseaValor'),
  masaResidualValor: document.getElementById('masaResidualValor'),
  densidadValor: document.getElementById('densidadValor'),

  calcularBtn: document.getElementById('calcularBtn'),
  infoParams: document.getElementById('infoParams'),
  reloadDescriptions: document.getElementById('reloadDescriptions'),
  applyDefaults: document.getElementById('applyDefaults'),
  btnRegresar: document.getElementById('btnRegresar')
};

const notification = document.getElementById('notification');

function configurarBloqueo(input, tipo) {
  if (!input) return;

  const permitirDecimal = ['peso', 'brazo', 'tricipital', 'dm', 'dr', 'df', 'pectoral',
                           'axilar', 'tricep', 'subescapular', 'abdominal', 'suprailiaco',
                           'muslo', 'cintura', 'cadera'].includes(tipo);

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

    this.value = valor;
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
  });
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
      sexo = usuario.sexo || "Hombre";
      peso = parseFloat(usuario.peso) || 0;

      if (elementos.edad && usuario.edad) {
        elementos.edad.value = usuario.edad;
      }
      if (elementos.altura && usuario.altura) {
        elementos.altura.value = usuario.altura;
      }
      if (elementos.pesoActual) {
        elementos.pesoActual.textContent = peso.toFixed(2) + " kg";
      }

      if (peso > 0 && elementos.altura && elementos.altura.value) {
        calcularIMC();
      }

      mostrarNotif("Datos cargados desde calculadora principal", "success");
    } catch(e) {
    }
  }
}

function guardarCambiosLocales() {
  const datos = {
    sexo: sexo,
    peso: peso.toString(),
    edad: elementos.edad ? elementos.edad.value : "",
    altura: elementos.altura ? elementos.altura.value : ""
  };
  localStorage.setItem('datosUsuario', JSON.stringify(datos));
}

function calcularIMC() {
  try {
    if (peso > 0 && elementos.altura && elementos.altura.value) {
      const alturaCm = parseFloat(elementos.altura.value);
      if (alturaCm > 0) {
        const alturaM = alturaCm / 100;
        const imc = peso / (alturaM * alturaM);

        elementos.imcValor.textContent = imc.toFixed(2) + " kg/m²";

        let pesoIdeal;
        if (sexo === "Hombre") {
          pesoIdeal = alturaCm - 100 - ((alturaCm - 150) / 4);
        } else {
          pesoIdeal = alturaCm - 100 - ((alturaCm - 150) / 2);
        }
        elementos.pesoIdealValor.textContent = pesoIdeal.toFixed(2) + " kg";
      }
    }
  } catch (error) {
  }
}

function calcularAreas() {
  try {
    if (!elementos.brazo.value || !elementos.tricipital.value) {
      mostrarNotif("Ingresa al menos Brazo y Tricipital", "error");
      return;
    }

    const brazo = parseFloat(elementos.brazo.value);
    const pliegue = parseFloat(elementos.tricipital.value);

    if (isNaN(brazo) || isNaN(pliegue)) {
      mostrarNotif("Valores numericos invalidos", "error");
      return;
    }

    const pliegueCM = pliegue / 10;

    const ab = Math.pow(brazo, 2) / (4 * Math.PI);
    const agb = Math.pow((brazo - (Math.PI * pliegueCM)), 2) / (4 * Math.PI);
    const amb = ab - agb;
    const ambCorregido = sexo === "Hombre" ? amb - 10 : amb - 6.5;

    elementos.abValor.textContent = `AB: ${ab.toFixed(2)} cm²`;
    elementos.agbValor.textContent = `AGB: ${agb.toFixed(2)} cm²`;
    elementos.ambValor.textContent = `AMB: ${amb.toFixed(2)} cm²`;
    elementos.ambCorrValor.textContent = `AMB corregido: ${ambCorregido.toFixed(2)} cm²`;

    if (elementos.dm.value && elementos.dr.value && elementos.df.value) {
      const dm = parseFloat(elementos.dm.value);
      const dr = parseFloat(elementos.dr.value);
      const df = parseFloat(elementos.df.value);

      if (!isNaN(dm) && !isNaN(dr) && !isNaN(df)) {
        const masaOsea = ((dm + dr + df) * 1.2) / 10;
        const masaResidual = sexo === "Hombre" ? peso * 0.24 : peso * 0.21;

        elementos.masaOseaValor.textContent = `Masa Osea: ${masaOsea.toFixed(2)} %`;
        elementos.masaResidualValor.textContent = `Masa Residual: ${masaResidual.toFixed(2)} %`;
      }
    }

    const pliegues = [
      elementos.pectoral, elementos.axilar, elementos.tricep,
      elementos.subescapular, elementos.abdominal, elementos.suprailiaco,
      elementos.muslo
    ];

    const todosPliegues = pliegues.every(p => p && p.value && parseFloat(p.value) > 0);

    if (todosPliegues && elementos.edad && elementos.edad.value) {
      const valores = pliegues.map(p => parseFloat(p.value));
      const sumaPliegues = valores.reduce((a, b) => a + b, 0);
      const sumaCuadrado = valores.reduce((a, b) => a + Math.pow(b, 2), 0);
      const edadVal = parseFloat(elementos.edad.value);

      let DC;
      if (sexo === "Hombre") {
        DC = 1.112 - (0.0004349 * sumaPliegues) + (0.000000055 * sumaCuadrado) - (0.0002882 * edadVal);
      } else {
        DC = 1.112 - (0.0004697 * sumaPliegues) + (0.000000056 * sumaCuadrado) - (0.0001282 * edadVal);
      }

      elementos.densidadValor.textContent = `Densidad Corporal: ${DC.toFixed(4)} g/ml`;

      if (DC > 0 && peso > 0) {
        const porcentajeGrasa = (495 / DC) - 450;
        const masaGrasa = peso * porcentajeGrasa / 100;
        const lbm = peso - masaGrasa;

        elementos.grasaValor.textContent = porcentajeGrasa.toFixed(2) + " %";
        elementos.lbmValor.textContent = lbm.toFixed(2) + " kg";
      }
    }

    if (elementos.cintura && elementos.cadera &&
        elementos.cintura.value && elementos.cadera.value) {
      const cintura = parseFloat(elementos.cintura.value);
      const cadera = parseFloat(elementos.cadera.value);

      if (cadera > 0) {
        const icc = cintura / cadera;
        elementos.iccValor.textContent = icc.toFixed(2);
      }

      if (elementos.altura && elementos.altura.value) {
        const altura = parseFloat(elementos.altura.value);
        if (altura > 0) {
          const ict = cintura / altura;
          elementos.ictValor.textContent = ict.toFixed(2);
        }
      }
    }

    guardarCambiosLocales();
    mostrarNotif("Calculo completado exitosamente", "success");

  } catch (error) {
    mostrarNotif("Error en los calculos", "error");
  }
}

const descripcionesPredeterminadas = {
  "Circunferencia Brazo (cm)": "Medida de la circunferencia del brazo en cm. Se refiere a la medida alrededor de la parte mas ancha del brazo.",
  "Pliegue Tricipital (mm)": "Medida del pliegue cutaneo en el triceps. Grosor del pliegue tomado en la parte posterior del brazo.",
  "IMC": "Indice de Masa Corporal. Evalua el peso en relacion con la altura.",
  "Peso Ideal": "Estimacion de peso ideal segun talla (formula de Lorentz).",
  "% Grasa Corporal": "Porcentaje estimado de grasa corporal total.",
  "Masa Corporal Magra": "LBM - masa corporal exenta de grasa (musculo, hueso, organos).",
  "ICC": "Indice Cintura/Cadera. Evalua distribucion de grasa abdominal.",
  "ICT": "Indice Cintura/Talla. Predice riesgo cardiovascular.",
  "DM": "Diametro del muslo - distancia entre epicondilos femorales.",
  "DR": "Diametro de rodilla - distancia entre condilos femorales.",
  "DF": "Diametro femoral - distancia entre puntos mas salientes.",
  "AB": "Area del Brazo - incluye grasa y musculo.",
  "AGB": "Area Grasa del Brazo - tejido adiposo del brazo.",
  "AMB": "Area Muscular del Brazo - indicador de masa muscular.",
  "AMB corregido": "AMB ajustado por edad y sexo.",
  "Masa Osea": "Estimacion de peso del esqueleto.",
  "Masa Residual": "Peso de organos internos y contenido gastrointestinal.",
  "Densidad Corporal": "Relacion entre masa corporal y volumen total.",
  "Cintura (cm)": "Circunferencia de cintura a nivel del ombligo.",
  "Cadera (cm)": "Circunferencia de cadera a nivel de los trocanteres."
};

function cargarDescripciones() {
  const guardadas = localStorage.getItem('paramInfo');
  return guardadas ? JSON.parse(guardadas) : { ...descripcionesPredeterminadas };
}

const popup = document.getElementById('hoverPopup');
const popupTitle = document.getElementById('popupTitle');
const popupDesc = document.getElementById('popupDescription');
let hideTimer;

function showPopup(event, key) {
  clearTimeout(hideTimer);
  const desc = cargarDescripciones();
  popupTitle.textContent = key;
  popupDesc.textContent = desc[key] || `Informacion sobre ${key}`;

  popup.style.display = 'block';
  popup.classList.add('show');

  const x = event.pageX + 15;
  const y = event.pageY + 15;
  const rect = popup.getBoundingClientRect();

  popup.style.left = Math.min(x, window.innerWidth - rect.width - 10) + 'px';
  popup.style.top = Math.min(y, window.innerHeight - rect.height - 10) + 'px';
}

function hidePopup() {
  hideTimer = setTimeout(() => {
    popup.style.display = 'none';
    popup.classList.remove('show');
  }, 200);
}

function volverAtras() {
  guardarCambiosLocales();
  window.location.href = 'menu.html';
}

document.addEventListener('DOMContentLoaded', () => {
  const camposNumericos = [
    ['edad', 'edad'], ['altura', 'altura'], ['brazo', 'brazo'],
    ['tricipital', 'tricipital'], ['dm', 'dm'], ['dr', 'dr'], ['df', 'df'],
    ['pectoral', 'pectoral'], ['axilar', 'axilar'], ['tricep', 'tricep'],
    ['subescapular', 'subescapular'], ['abdominal', 'abdominal'],
    ['suprailiaco', 'suprailiaco'], ['muslo', 'muslo'],
    ['cintura', 'cintura'], ['cadera', 'cadera']
  ];

  camposNumericos.forEach(([id, tipo]) => {
    configurarBloqueo(elementos[id], tipo);
  });

  cargarDatosUsuario();

  document.querySelectorAll('[data-key]').forEach(el => {
    el.addEventListener('mouseenter', (e) => showPopup(e, el.getAttribute('data-key')));
    el.addEventListener('mouseleave', hidePopup);
  });

  if (elementos.altura) {
    elementos.altura.addEventListener('input', () => {
      calcularIMC();
      guardarCambiosLocales();
    });
  }

  if (elementos.calcularBtn) {
    elementos.calcularBtn.addEventListener('click', calcularAreas);
  }

  if (elementos.infoParams) {
    elementos.infoParams.addEventListener('click', () => {
      guardarCambiosLocales();
      localStorage.setItem('ultimaPagina', 'imc');
      window.location.href = 'infoparametros.html?desde=imc';
    });
  }

  if (elementos.reloadDescriptions) {
    elementos.reloadDescriptions.addEventListener('click', () => {
      mostrarNotif("Descripciones recargadas", "success");
    });
  }

  if (elementos.applyDefaults) {
    elementos.applyDefaults.addEventListener('click', () => {
      if (confirm("Restaurar descripciones predeterminadas?")) {
        localStorage.setItem('paramInfo', JSON.stringify(descripcionesPredeterminadas));
        mostrarNotif("Descripciones restauradas", "success");
      }
    });
  }

  if (elementos.btnRegresar) {
    elementos.btnRegresar.addEventListener('click', volverAtras);
  }

  if (popup) {
    popup.addEventListener('mouseenter', () => clearTimeout(hideTimer));
    popup.addEventListener('mouseleave', hidePopup);
  }
});
