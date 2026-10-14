// Codigo para cargar datos del usuario y metricas en el tablero principal.
document.addEventListener('DOMContentLoaded', function () {
  const perfil = window.NutriEstado ? window.NutriEstado.obtenerPerfil() : {};
  const getValor = window.NutriEstado ? window.NutriEstado.obtenerGET() : null;

  // Saludo personalizado segun sexo
  const saludoEl = document.getElementById('dash-saludo');
  if (saludoEl) {
    if (perfil.sexo === 'Mujer') {
      saludoEl.textContent = 'Bienvenida';
    } else if (perfil.sexo === 'Hombre') {
      saludoEl.textContent = 'Bienvenido';
    } else {
      saludoEl.textContent = 'Mi Tablero';
    }
  }

  // Boton continuar
  const btnContinuar = document.getElementById('btn-continuar');
  if (btnContinuar && window.NutriEstado) {
    const siguiente = window.NutriEstado.siguientePendiente();
    if (siguiente) {
      btnContinuar.href = window.NutriEstado.hrefDePaso(siguiente);
      const labelEl = document.getElementById('btn-continuar-label');
      if (labelEl) {
        labelEl.textContent = getValor ? `Continuar: ${siguiente.corto} →` : 'Comenzar: Gasto Energético →';
      }
    }
  }

  // Tarjeta 1: Gasto energetico
  const getEl = document.getElementById('dash-get-valor');
  const getGauge = document.getElementById('dash-gauge-fill');
  if (getEl) {
    if (getValor) {
      getEl.textContent = `${getValor.toLocaleString()} kcal/día`;
      if (getGauge) {
        const pct = Math.min(100, Math.max(10, (getValor / 4000) * 100));
        const circulo = 157; // longitud aproximada del semicirculo r=50
        const offset = circulo - (pct / 100) * circulo;
        getGauge.style.strokeDashoffset = offset;
      }
    } else {
      getEl.textContent = '-- kcal/día';
    }
  }

  // Tarjeta 2: IMC
  const imcValorEl = document.getElementById('dash-imc-valor');
  const imcCatEl = document.getElementById('dash-imc-categoria');
  const imcPointer = document.getElementById('dash-imc-pointer');

  const pesoNum = parseFloat(perfil.peso);
  const altNum = parseFloat(perfil.altura) / 100;

  if (pesoNum > 0 && altNum > 0) {
    const imc = (pesoNum / (altNum * altNum)).toFixed(1);
    if (imcValorEl) imcValorEl.textContent = `IMC ${imc}`;

    let cat = 'Normal';
    let pct = 35; // posicion en barra 0-100%
    if (imc < 18.5) {
      cat = 'Bajo peso'; pct = 15;
    } else if (imc < 25) {
      cat = 'Peso Normal'; pct = 38;
    } else if (imc < 30) {
      cat = 'Sobrepeso'; pct = 65;
    } else {
      cat = 'Obesidad'; pct = 88;
    }

    if (imcCatEl) imcCatEl.textContent = `· ${cat}`;
    if (imcPointer) imcPointer.style.left = `${pct}%`;
  } else {
    if (imcValorEl) imcValorEl.textContent = 'IMC --';
    if (imcCatEl) imcCatEl.textContent = '· Sin registrar';
  }

  // Tarjeta 3: Macronutrientes
  const pctHc = parseFloat(sessionStorage.getItem('porcentajeHC')) || 55;
  const pctProt = parseFloat(sessionStorage.getItem('porcentajeProteinas')) || 20;
  const pctLip = parseFloat(sessionStorage.getItem('porcentajeLipidos')) || 25;

  const pctHcEl = document.getElementById('dash-pct-hc');
  const pctProtEl = document.getElementById('dash-pct-prot');
  const pctLipEl = document.getElementById('dash-pct-lip');

  if (pctHcEl) pctHcEl.textContent = `${pctHc}%`;
  if (pctProtEl) pctProtEl.textContent = `${pctProt}%`;
  if (pctLipEl) pctLipEl.textContent = `${pctLip}%`;

  // Tarjeta 4: Datos basicos
  const sexoEl = document.getElementById('dash-dato-sexo');
  const edadEl = document.getElementById('dash-dato-edad');
  const pesoEl = document.getElementById('dash-dato-peso');
  const altEl = document.getElementById('dash-dato-altura');

  if (sexoEl) sexoEl.textContent = perfil.sexo || '--';
  if (edadEl) edadEl.textContent = perfil.edad ? `${perfil.edad} años` : '--';
  if (pesoEl) pesoEl.textContent = perfil.peso ? `${perfil.peso} kg` : '--';
  if (altEl) altEl.textContent = perfil.altura ? `${perfil.altura} cm` : '--';
});
