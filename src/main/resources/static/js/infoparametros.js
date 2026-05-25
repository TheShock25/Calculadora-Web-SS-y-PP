// Codigo de la interfaz para eventos, calculos y navegacion.
const datosBasicos = [
  {
    parametro: "IMC (kg/m²)",
    hombres: "<18.5 = Bajo peso\n18.5-24.9 = Normal\n25-29.9 = Sobrepeso\n>=30 = Obesidad",
    mujeres: "Igual que hombres (OMS)",
    interpretacion: "Util para cribado poblacional, pero no distingue grasa vs musculo."
  },
  {
    parametro: "Peso Ideal (Lorentz)",
    hombres: "Depende de talla",
    mujeres: "Depende de talla",
    interpretacion: "Estima si esta en rango saludable"
  },
  {
    parametro: "% Grasa Corporal",
    hombres: "Optimo: 10-20%\nModerado: 21-24%\nAlto: >=25%",
    mujeres: "Optimo: 18-28%\nModerado: 29-32%\nAlto: >=33%",
    interpretacion: "Valores altos = riesgo metabolico.\nValores muy bajos (<5% hombres, <12% mujeres) = riesgo hormonal."
  },
  {
    parametro: "Masa Grasa (kg)",
    hombres: "Depende del % grasa y peso",
    mujeres: "Depende del % grasa y peso",
    interpretacion: "Alto = riesgo metabolico\nBajo = deficit energetico."
  },
  {
    parametro: "Masa Muscular (kg / AMB)",
    hombres: "AMB Deficit: <25 cm²\n25-35 cm² = Normal\n>35 cm² = Alto (deportistas)",
    mujeres: "AMB Deficit: <20 cm²\n20-30 cm² = Normal\n>30 cm² = Alto (deportistas)",
    interpretacion: "Bajo = sarcopenia, riesgo funcional.\nEvalua reservas proteicas."
  }
];

const datosAvanzados = [
  {
    parametro: "Masa Osea (kg o %)",
    hombres: "12-15% del peso corporal",
    mujeres: "10-12% del peso corporal",
    interpretacion: "Bajo = riesgo de osteoporosis."
  },
  {
    parametro: "Masa Residual",
    hombres: "~24% del peso corporal",
    mujeres: "~21% del peso corporal",
    interpretacion: "Constante segun sexo."
  },
  {
    parametro: "LBM (Masa Magra)",
    hombres: "75-85% del peso corporal",
    mujeres: "65-75% del peso corporal",
    interpretacion: "Baja = desnutricion proteico-calorica."
  },
  {
    parametro: "Circunferencia de Cintura",
    hombres: "<90 cm = Normal\n90-102 cm = Riesgo moderado\n>102 cm = Riesgo alto",
    mujeres: "<80 cm = Normal\n80-88 cm = Riesgo moderado\n>88 cm = Riesgo alto",
    interpretacion: "Predictor de riesgo cardiometabolico."
  },
  {
    parametro: "ICC (Cintura/Cadera)",
    hombres: "Normal: <0.90\nRiesgo: >=0.90",
    mujeres: "Normal: <0.85\nRiesgo: >=0.85",
    interpretacion: "Relacionado con obesidad central."
  },
  {
    parametro: "ICT (Cintura/Talla)",
    hombres: "<0.5 = Normal\n>=0.5 = Riesgo",
    mujeres: "<0.5 = Normal\n>=0.5 = Riesgo",
    interpretacion: "Muy practico en niños y adultos."
  },
  {
    parametro: "Pliegue Tricipital (mm)",
    hombres: "Normal: 6-12 mm\nModerado: 13-20 mm\nAlto: >20 mm",
    mujeres: "Normal: 12-20 mm\nModerado: 21-30 mm\nAlto: >30 mm",
    interpretacion: "Util para reservas de grasa subcutanea."
  },
  {
    parametro: "Z Pliegues (7 u 8 sitios)",
    hombres: "Atletas: <50 mm\nNormal: 60-100 mm\nAlto: >100 mm",
    mujeres: "Atletas: <80 mm\nNormal: 90-150 mm\nAlto: >150 mm",
    interpretacion: "Usado para % grasa con ecuaciones (Siri, Jackson & Pollock)."
  }
];

function mostrarNotif(mensaje, tipo) {
  const n = document.getElementById('notification');
  n.textContent = mensaje;
  n.className = `notification ${tipo} show`;
  setTimeout(() => n.classList.remove('show'), 3000);
}

function renderizarTabla(datos, elementoId) {
  const tbody = document.getElementById(elementoId);
  if (!tbody) return;

  tbody.innerHTML = '';

  datos.forEach(item => {
    const fila = document.createElement('tr');

    const tdParametro = document.createElement('td');
    tdParametro.textContent = item.parametro;
    tdParametro.className = 'parametro-nombre';
    fila.appendChild(tdParametro);

    const tdHombres = document.createElement('td');
    tdHombres.textContent = item.hombres;
    tdHombres.className = 'datos-sexo hombres';
    fila.appendChild(tdHombres);

    const tdMujeres = document.createElement('td');
    tdMujeres.textContent = item.mujeres;
    tdMujeres.className = 'datos-sexo mujeres';
    fila.appendChild(tdMujeres);

    const tdInterpretacion = document.createElement('td');
    tdInterpretacion.textContent = item.interpretacion;
    tdInterpretacion.className = 'interpretacion';
    fila.appendChild(tdInterpretacion);

    tbody.appendChild(fila);
  });
}

function volverAtras() {
  const ultimaPagina = localStorage.getItem('ultimaPagina');
  const urlParams = new URLSearchParams(window.location.search);
  const desde = urlParams.get('desde');

  let destino = 'imc.html';

  if (desde === 'menu') {
    destino = 'menu.html';
  } else if (desde === 'imc') {
    destino = 'imc.html';
  } else if (ultimaPagina === 'menu') {
    destino = 'menu.html';
  } else if (ultimaPagina === 'imc') {
    destino = 'imc.html';
  }

  window.location.href = destino;
}

document.addEventListener('DOMContentLoaded', () => {
  renderizarTabla(datosBasicos, 'tablaBasicos');
  renderizarTabla(datosAvanzados, 'tablaAvanzados');

  const btnRegresar = document.getElementById('btnRegresar');
  if (btnRegresar) {
    const urlParams = new URLSearchParams(window.location.search);
    const desde = urlParams.get('desde');
    if (desde) {
      btnRegresar.textContent = `← Regresar a ${desde.charAt(0).toUpperCase() + desde.slice(1)}`;
    }

    btnRegresar.addEventListener('click', volverAtras);
  }

  if (window.innerWidth <= 768) {
    const celdas = document.querySelectorAll('.tabla-parametros td');
    celdas.forEach(celda => {
      if (celda.textContent.length > 50) {
        celda.setAttribute('title', celda.textContent);
      }
    });
  }

  mostrarNotif('Tablas cargadas correctamente', 'success');
});

window.addEventListener('orientationchange', () => {
  setTimeout(() => {
    const tablas = document.querySelectorAll('.table-responsive');
    tablas.forEach(tabla => {
      tabla.style.overflowX = 'auto';
    });
  }, 200);
});
