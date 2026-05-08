// ========== CONFIGURACION INICIAL ==========
const df = new Intl.NumberFormat('es-MX', { 
    minimumFractionDigits: 1, 
    maximumFractionDigits: 1 
});

// Datos base de equivalentes
const datosEquivalentesBase = [
    { grupo: "Verduras", subgrupo: " ", energia: 25, proteinas: 2, lipidos: 0, hc: 4 },
    { grupo: "Frutas", subgrupo: " ", energia: 60, proteinas: 0, lipidos: 0, hc: 15 },
    { grupo: "Cereales y tubérculos", subgrupo: "Sin Grasa", energia: 70, proteinas: 2, lipidos: 0, hc: 15 },
    { grupo: "Cereales y tubérculos", subgrupo: "Con Grasa", energia: 115, proteinas: 2, lipidos: 5, hc: 15 },
    { grupo: "Leguminosas", subgrupo: " ", energia: 120, proteinas: 8, lipidos: 1, hc: 20 },
    { grupo: "Alimentos de origen animal", subgrupo: "MRAG", energia: 40, proteinas: 7, lipidos: 1, hc: 0 },
    { grupo: "Alimentos de origen animal", subgrupo: "BAG", energia: 55, proteinas: 7, lipidos: 3, hc: 0 },
    { grupo: "Alimentos de origen animal", subgrupo: "MAG", energia: 75, proteinas: 7, lipidos: 5, hc: 0 },
    { grupo: "Alimentos de origen animal", subgrupo: "AAG", energia: 100, proteinas: 7, lipidos: 8, hc: 0 },
    { grupo: "Leche", subgrupo: "Descremada", energia: 95, proteinas: 9, lipidos: 2, hc: 12 },
    { grupo: "Leche", subgrupo: "Semi", energia: 110, proteinas: 9, lipidos: 4, hc: 12 },
    { grupo: "Leche", subgrupo: "Entera", energia: 150, proteinas: 9, lipidos: 8, hc: 12 },
    { grupo: "Leche", subgrupo: "Con Azucar", energia: 200, proteinas: 8, lipidos: 5, hc: 30 },
    { grupo: "Aceite y grasa", subgrupo: "Sin proteina", energia: 45, proteinas: 0, lipidos: 5, hc: 0 },
    { grupo: "Aceite y grasa", subgrupo: "Con proteina", energia: 70, proteinas: 3, lipidos: 5, hc: 3 },
    { grupo: "Azucar", subgrupo: "Sin grasa", energia: 40, proteinas: 0, lipidos: 0, hc: 10 },
    { grupo: "Azucar", subgrupo: "Con grasa", energia: 85, proteinas: 0, lipidos: 5, hc: 10 }
];

// Variables de estado
let datosEquivalentes = [];
let porcentajeHC = 60;
let porcentajeLipidos = 15;
let porcentajeProteinas = 25;
let kcalObjetivo = 2000;

// Referencias DOM
const elementos = {
    kcalDiaValor: document.getElementById('kcalDiaValor'),
    sumaKcalValor: document.getElementById('sumaKcalValor'),
    kcalInput: document.getElementById('kcalInput'),
    actualizarBtn: document.getElementById('actualizarBtn'),
    reiniciarBtn: document.getElementById('reiniciarBtn'),
    exportarBtn: document.getElementById('exportarBtn'),
    planBtn: document.getElementById('planBtn'),
    r24hBtn: document.getElementById('r24hBtn'),
    btnRegresar: document.getElementById('btnRegresar'),
   
    tablaEquivalentesBody: document.getElementById('tablaEquivalentesBody'),
    tablaDistribucionBody: document.getElementById('tablaDistribucionBody'),
    tablaNutrientesBody: document.getElementById('tablaNutrientesBody'),
    tablaPorcentajesBody: document.getElementById('tablaPorcentajesBody'),
   
    sumaKcalCard: document.getElementById('sumaKcalCard')
};

const notification = document.getElementById('notification');

// ========== NOTIFICACION VISUAL ==========
function mostrarNotif(mensaje, tipo) {
    const n = notification;
    n.textContent = mensaje;
    n.className = `notification ${tipo} show`;
    setTimeout(() => n.classList.remove('show'), 3000);
}

// ========== OBTENER PARÁMETRO GET ==========
function obtenerGetDeURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const getValor = urlParams.get('get');
    if (getValor) {
        kcalObjetivo = parseFloat(getValor) || 2000;
        console.log('GET recibido de index:', kcalObjetivo);
    }
}

// ========== INICIALIZAR DATOS ==========
function inicializarDatos() {
    datosEquivalentes = datosEquivalentesBase.map(item => ({
        ...item,
        porciones: 0,
        energiaCalculada: 0,
        proteinasCalculadas: 0,
        lipidosCalculados: 0,
        hcCalculados: 0
    }));
}

// ========== GUARDAR ESTADO PARA REGRESO ==========
function guardarEstadoParaRegreso() {
    sessionStorage.setItem('datosEquivalentesGuardados', JSON.stringify(datosEquivalentes));
    sessionStorage.setItem('porcentajeHC', porcentajeHC);
    sessionStorage.setItem('porcentajeProteinas', porcentajeProteinas);
    sessionStorage.setItem('porcentajeLipidos', porcentajeLipidos);
    sessionStorage.setItem('kcalObjetivo', kcalObjetivo);
}

// ========== RESTAURAR ESTADO AL VOLVER ==========
function restaurarEstadoSiExiste() {
    const datosGuardados = sessionStorage.getItem('datosEquivalentesGuardados');
    
    if (datosGuardados) {
        datosEquivalentes = JSON.parse(datosGuardados);
        
        porcentajeHC = parseFloat(sessionStorage.getItem('porcentajeHC')) || porcentajeHC;
        porcentajeProteinas = parseFloat(sessionStorage.getItem('porcentajeProteinas')) || porcentajeProteinas;
        porcentajeLipidos = parseFloat(sessionStorage.getItem('porcentajeLipidos')) || porcentajeLipidos;
        kcalObjetivo = parseFloat(sessionStorage.getItem('kcalObjetivo')) || kcalObjetivo;

        sessionStorage.removeItem('datosEquivalentesGuardados');
        console.log('✅ Datos de equivalentes restaurados correctamente');
    }
}

// ========== RENDERIZAR TABLA PRINCIPAL ==========
function renderizarTablaEquivalentes() {
    const tbody = elementos.tablaEquivalentesBody;
    tbody.innerHTML = '';
   
    datosEquivalentes.forEach((item, index) => {
        const tr = document.createElement('tr');
        if (item.porciones > 0) tr.classList.add('porcion-activa');
       
        const tdGrupo = document.createElement('td');
        tdGrupo.textContent = item.grupo;
        tr.appendChild(tdGrupo);
       
        const tdSubgrupo = document.createElement('td');
        tdSubgrupo.textContent = item.subgrupo;
        tr.appendChild(tdSubgrupo);
       
        // Porciones (editable)
        const tdPorciones = document.createElement('td');
        const inputPorciones = document.createElement('input');
        inputPorciones.type = 'number';
        inputPorciones.className = 'porciones-editor';
        inputPorciones.value = item.porciones;
        inputPorciones.min = 0;
        inputPorciones.max = 99;
        inputPorciones.step = 1;
       
        inputPorciones.addEventListener('change', (e) => {
            const nuevasPorciones = parseInt(e.target.value) || 0;
            actualizarPorciones(index, nuevasPorciones);
        });
       
        tdPorciones.appendChild(inputPorciones);
        tr.appendChild(tdPorciones);
       
        const tdEnergia = document.createElement('td');
        tdEnergia.textContent = item.energiaCalculada;
        tr.appendChild(tdEnergia);
       
        const tdProteinas = document.createElement('td');
        tdProteinas.textContent = item.proteinasCalculadas;
        tr.appendChild(tdProteinas);
       
        const tdLipidos = document.createElement('td');
        tdLipidos.textContent = item.lipidosCalculados;
        tr.appendChild(tdLipidos);
       
        const tdHC = document.createElement('td');
        tdHC.textContent = item.hcCalculados;
        tr.appendChild(tdHC);
       
        tbody.appendChild(tr);
    });
}

// ========== ACTUALIZAR PORCIONES ==========
function actualizarPorciones(index, nuevasPorciones) {
    if (index < 0 || index >= datosEquivalentes.length) return;
   
    const item = datosEquivalentes[index];
    item.porciones = nuevasPorciones;
   
    item.energiaCalculada = nuevasPorciones * item.energia;
    item.proteinasCalculadas = nuevasPorciones * item.proteinas;
    item.lipidosCalculados = nuevasPorciones * item.lipidos;
    item.hcCalculados = nuevasPorciones * item.hc;
   
    renderizarTablaEquivalentes();
    calcularTotales();
   
    mostrarNotif(`Actualizado: ${item.grupo} = ${nuevasPorciones} porciones`, 'success');
}

// ========== REDISTRIBUIR PORCENTAJES (NUEVO) ==========
// Cuando se edita un nutriente, la diferencia se reparte proporcionalmente
// entre los otros dos para que siempre sumen 100.
function redistribuirPorcentajes(nutrienteEditado, nuevoValor) {
    // Mapa de los tres nutrientes con sus valores actuales
    const mapa = {
        HC: porcentajeHC,
        Proteinas: porcentajeProteinas,
        Lipidos: porcentajeLipidos
    };

    // Clamp entre 0 y 100
    nuevoValor = Math.min(100, Math.max(0, nuevoValor));

    // Resto disponible para los otros dos
    const resto = 100 - nuevoValor;

    // Los otros dos nutrientes
    const otros = Object.keys(mapa).filter(k => k !== nutrienteEditado);

    const sumaOtros = mapa[otros[0]] + mapa[otros[1]];

    let nuevos = { ...mapa };
    nuevos[nutrienteEditado] = nuevoValor;

    if (sumaOtros === 0) {
        // Si ambos eran 0, repartir el resto en partes iguales
        nuevos[otros[0]] = parseFloat((resto / 2).toFixed(1));
        nuevos[otros[1]] = parseFloat((resto / 2).toFixed(1));
    } else {
        // Repartir proporcionalmente
        nuevos[otros[0]] = parseFloat(((mapa[otros[0]] / sumaOtros) * resto).toFixed(1));
        nuevos[otros[1]] = parseFloat(((mapa[otros[1]] / sumaOtros) * resto).toFixed(1));
    }

    // Ajuste de redondeo: asegurar que sumen exactamente 100
    const suma = nuevos[nutrienteEditado] + nuevos[otros[0]] + nuevos[otros[1]];
    const diff = parseFloat((100 - suma).toFixed(1));
    if (diff !== 0) {
        // Sumamos el ajuste al que tenga mayor valor entre los otros dos
        const mayorOtro = nuevos[otros[0]] >= nuevos[otros[1]] ? otros[0] : otros[1];
        nuevos[mayorOtro] = parseFloat((nuevos[mayorOtro] + diff).toFixed(1));
    }

    // Aplicar
    porcentajeHC = nuevos.HC;
    porcentajeProteinas = nuevos.Proteinas;
    porcentajeLipidos = nuevos.Lipidos;
}

// ========== RENDERIZAR TABLA DE PORCENTAJES ==========
function renderizarTablaPorcentajes() {
    const tbody = elementos.tablaPorcentajesBody;
    tbody.innerHTML = '';
   
    const datos = [
        { nutriente: "HC",        porcentaje: porcentajeHC },
        { nutriente: "Proteinas", porcentaje: porcentajeProteinas },
        { nutriente: "Lipidos",   porcentaje: porcentajeLipidos }
    ];
   
    datos.forEach(item => {
        const tr = document.createElement('tr');
       
        const tdNutriente = document.createElement('td');
        tdNutriente.textContent = item.nutriente;
        tr.appendChild(tdNutriente);
       
        const tdPorcentaje = document.createElement('td');
        const inputPorcentaje = document.createElement('input');
        inputPorcentaje.type = 'text';
        inputPorcentaje.className = 'porcentaje-editor';
        inputPorcentaje.value = item.porcentaje + '%';
       
        inputPorcentaje.addEventListener('focus', (e) => {
            // Al enfocar, mostrar solo el número para facilitar edición
            e.target.value = parseFloat(e.target.value) || '';
        });

        inputPorcentaje.addEventListener('change', (e) => {
            let valor = e.target.value.replace('%', '').trim();
            let num = parseFloat(valor);
            if (isNaN(num)) num = 0;

            // Redistribuir los otros dos proporcionalmente
            redistribuirPorcentajes(item.nutriente, num);

            // Re-renderizar la tabla de porcentajes con los nuevos valores
            renderizarTablaPorcentajes();
           
            actualizarTablaDistribucion();
            calcularTotales();

            const suma = parseFloat((porcentajeHC + porcentajeProteinas + porcentajeLipidos).toFixed(1));
            mostrarNotif(`Porcentajes actualizados (suma: ${suma}%)`, 'success');
        });
       
        tdPorcentaje.appendChild(inputPorcentaje);
        tr.appendChild(tdPorcentaje);
        tbody.appendChild(tr);
    });

    // Actualizar visualmente los inputs con el valor actual (post-redistribución)
    const inputs = tbody.querySelectorAll('.porcentaje-editor');
    const valores = [porcentajeHC, porcentajeProteinas, porcentajeLipidos];
    inputs.forEach((inp, i) => {
        inp.value = valores[i] + '%';
    });
}

// ========== ACTUALIZAR TABLA DE DISTRIBUCION ==========
function actualizarTablaDistribucion() {
    const tbody = elementos.tablaDistribucionBody;
    tbody.innerHTML = '';
   
    const kcalHC = kcalObjetivo * (porcentajeHC / 100);
    const gramosHC = kcalHC / 4;
    const kcalProteinas = kcalObjetivo * (porcentajeProteinas / 100);
    const gramosProteinas = kcalProteinas / 4;
    const kcalLipidos = kcalObjetivo * (porcentajeLipidos / 100);
    const gramosLipidos = kcalLipidos / 9;
    const gramosTotal = gramosHC + gramosProteinas + gramosLipidos;
   
    const sumaPorcentajes = porcentajeHC + porcentajeProteinas + porcentajeLipidos;
    const warningSuma = Math.abs(sumaPorcentajes - 100) > 0.5;
   
    // HC
    const trHC = document.createElement('tr');
    trHC.innerHTML = `
        <td>HC</td>
        <td ${warningSuma ? 'style="background:#ffeb3b;"' : ''}>${df.format(porcentajeHC)}%</td>
        <td>${df.format(kcalHC)}</td>
        <td>${df.format(gramosHC)}</td>
    `;
    tbody.appendChild(trHC);
   
    // Lipidos
    const trLip = document.createElement('tr');
    trLip.innerHTML = `
        <td>Lipidos</td>
        <td ${warningSuma ? 'style="background:#ffeb3b;"' : ''}>${df.format(porcentajeLipidos)}%</td>
        <td>${df.format(kcalLipidos)}</td>
        <td>${df.format(gramosLipidos)}</td>
    `;
    tbody.appendChild(trLip);
   
    // Proteinas
    const trProt = document.createElement('tr');
    trProt.innerHTML = `
        <td>Proteinas</td>
        <td ${warningSuma ? 'style="background:#ffeb3b;"' : ''}>${df.format(porcentajeProteinas)}%</td>
        <td>${df.format(kcalProteinas)}</td>
        <td>${df.format(gramosProteinas)}</td>
    `;
    tbody.appendChild(trProt);
   
    // Total
    const trTotal = document.createElement('tr');
    trTotal.innerHTML = `
        <td><strong>Total</strong></td>
        <td></td>
        <td><strong>${df.format(kcalObjetivo)}</strong></td>
        <td><strong>${df.format(gramosTotal)}</strong></td>
    `;
    tbody.appendChild(trTotal);
   
    elementos.kcalDiaValor.textContent = df.format(kcalObjetivo);
    elementos.kcalInput.value = kcalObjetivo;
}

// ========== CALCULAR TOTALES ==========
function calcularTotales() {
    let totalKcal = 0;
    let totalProteinas = 0;
    let totalLipidos = 0;
    let totalHC = 0;
   
    datosEquivalentes.forEach(item => {
        totalKcal += item.energiaCalculada;
        totalProteinas += item.proteinasCalculadas;
        totalLipidos += item.lipidosCalculados;
        totalHC += item.hcCalculados;
    });
   
    elementos.sumaKcalValor.textContent = df.format(totalKcal);
   
    const diferencia = Math.abs(totalKcal - kcalObjetivo);
    elementos.sumaKcalCard.classList.remove('match-perfect', 'match-close', 'match-far');
   
    if (diferencia <= 50) {
        elementos.sumaKcalCard.classList.add('match-perfect');
    } else if (diferencia <= 150) {
        elementos.sumaKcalCard.classList.add('match-close');
    } else {
        elementos.sumaKcalCard.classList.add('match-far');
    }
   
    actualizarTablaNutrientes(totalKcal, totalProteinas, totalLipidos, totalHC);
}

// ========== ACTUALIZAR TABLA DE NUTRIENTES ==========
function actualizarTablaNutrientes(totalKcal, totalProteinas, totalLipidos, totalHC) {
    const tbody = elementos.tablaNutrientesBody;
    tbody.innerHTML = '';
   
    const kcalHC = totalHC * 4;
    const kcalProteinas = totalProteinas * 4;
    const kcalLipidos = totalLipidos * 9;
   
    const kcalEsperadaHC = kcalObjetivo * (porcentajeHC / 100);
    const kcalEsperadaProteinas = kcalObjetivo * (porcentajeProteinas / 100);
    const kcalEsperadaLipidos = kcalObjetivo * (porcentajeLipidos / 100);
   
    const adecuacionHC = kcalEsperadaHC > 0 ? (kcalHC / kcalEsperadaHC) * 100 : 0;
    const adecuacionProteinas = kcalEsperadaProteinas > 0 ? (kcalProteinas / kcalEsperadaProteinas) * 100 : 0;
    const adecuacionLipidos = kcalEsperadaLipidos > 0 ? (kcalLipidos / kcalEsperadaLipidos) * 100 : 0;
    const adecuacionTotal = kcalObjetivo > 0 ? (totalKcal / kcalObjetivo) * 100 : 0;
   
    function getClaseAdecuacion(valor) {
        if (valor < 90 || valor > 110) return 'adecuacion-rojo';
        if ((valor >= 91 && valor <= 95) || (valor >= 105 && valor <= 109)) return 'adecuacion-amarillo';
        return 'adecuacion-verde';
    }
   
    // HC
    const trHC = document.createElement('tr');
    trHC.innerHTML = `
        <td>HC</td>
        <td>${df.format(kcalHC)}</td>
        <td>${df.format(totalHC)}</td>
        <td class="${getClaseAdecuacion(adecuacionHC)}">${df.format(adecuacionHC)}%</td>
    `;
    tbody.appendChild(trHC);
   
    // Lipidos
    const trLip = document.createElement('tr');
    trLip.innerHTML = `
        <td>Lipidos</td>
        <td>${df.format(kcalLipidos)}</td>
        <td>${df.format(totalLipidos)}</td>
        <td class="${getClaseAdecuacion(adecuacionLipidos)}">${df.format(adecuacionLipidos)}%</td>
    `;
    tbody.appendChild(trLip);
   
    // Proteinas
    const trProt = document.createElement('tr');
    trProt.innerHTML = `
        <td>Proteinas</td>
        <td>${df.format(kcalProteinas)}</td>
        <td>${df.format(totalProteinas)}</td>
        <td class="${getClaseAdecuacion(adecuacionProteinas)}">${df.format(adecuacionProteinas)}%</td>
    `;
    tbody.appendChild(trProt);
   
    // Total
    const trTotal = document.createElement('tr');
    trTotal.innerHTML = `
        <td><strong>Total</strong></td>
        <td><strong>${df.format(totalKcal)}</strong></td>
        <td><strong>${df.format(totalProteinas + totalLipidos + totalHC)}</strong></td>
        <td class="${getClaseAdecuacion(adecuacionTotal)}"><strong>${df.format(adecuacionTotal)}%</strong></td>
    `;
    tbody.appendChild(trTotal);
}

// ========== REINICIAR TABLA ==========
function reiniciarTabla() {
    if (confirm('¿Está seguro de reiniciar todas las porciones a 0?')) {
        datosEquivalentes.forEach(item => {
            item.porciones = 0;
            item.energiaCalculada = 0;
            item.proteinasCalculadas = 0;
            item.lipidosCalculados = 0;
            item.hcCalculados = 0;
        });
       
        renderizarTablaEquivalentes();
        calcularTotales();
        mostrarNotif('Tabla reiniciada correctamente', 'success');
    }
}

// ========== EXPORTAR DATOS ==========
function exportarDatos() {
    let texto = "=== SISTEMA DE EQUIVALENTES ===\n\n";
    texto += "OBJETIVO NUTRICIONAL:\n";
    texto += `Kcal objetivo: ${kcalObjetivo}\n`;
    texto += `HC objetivo: ${porcentajeHC}%\n`;
    texto += `Proteinas objetivo: ${porcentajeProteinas}%\n`;
    texto += `Lipidos objetivo: ${porcentajeLipidos}%\n\n`;
   
    texto += "EQUIVALENTES SELECCIONADOS:\n";
    texto += "Grupo\tSubgrupo\tPorciones\tEnergia\tProteinas\tLipidos\tHC\n";
   
    datosEquivalentes.forEach(item => {
        if (item.porciones > 0) {
            texto += `${item.grupo}\t${item.subgrupo}\t${item.porciones}\t${item.energiaCalculada}\t${item.proteinasCalculadas}\t${item.lipidosCalculados}\t${item.hcCalculados}\n`;
        }
    });
   
    texto += "\nDISTRIBUCION DE MACRONUTRIENTES:\n";
    texto += "Macro\t%\tKcal\tg\n";
   
    const kcalHC = kcalObjetivo * (porcentajeHC / 100);
    const gramosHC = kcalHC / 4;
    const kcalProteinas = kcalObjetivo * (porcentajeProteinas / 100);
    const gramosProteinas = kcalProteinas / 4;
    const kcalLipidos = kcalObjetivo * (porcentajeLipidos / 100);
    const gramosLipidos = kcalLipidos / 9;
   
    texto += `HC\t${porcentajeHC}%\t${df.format(kcalHC)}\t${df.format(gramosHC)}\n`;
    texto += `Lipidos\t${porcentajeLipidos}%\t${df.format(kcalLipidos)}\t${df.format(gramosLipidos)}\n`;
    texto += `Proteinas\t${porcentajeProteinas}%\t${df.format(kcalProteinas)}\t${df.format(gramosProteinas)}\n`;
   
    const ventana = window.open('', '_blank');
    ventana.document.write('<pre>' + texto + '</pre>');
    mostrarNotif('Datos exportados correctamente', 'success');
}

// ========== EVENTOS ==========
function inicializarEventos() {
    // Actualizar kcal objetivo
    elementos.actualizarBtn.addEventListener('click', () => {
        const nuevoValor = parseFloat(elementos.kcalInput.value);
        if (!isNaN(nuevoValor) && nuevoValor > 0) {
            kcalObjetivo = nuevoValor;
            actualizarTablaDistribucion();
            calcularTotales();
            mostrarNotif(`Kcal objetivo actualizado a ${nuevoValor}`, 'success');
        }
    });

    // Reiniciar
    elementos.reiniciarBtn.addEventListener('click', reiniciarTabla);
   
    // Exportar
    elementos.exportarBtn.addEventListener('click', exportarDatos);

    // === BOTÓN PLAN ALIMENTICIO ===
    elementos.planBtn.addEventListener('click', () => {
        guardarEstadoParaRegreso();

        const gruposSeleccionados = [];
        const porcionesSeleccionadas = [];
   
        datosEquivalentes.forEach(item => {
            if (item.porciones > 0) {
                const subgrupoLimpio = item.subgrupo ? item.subgrupo.trim() : '';
                if (subgrupoLimpio !== '' && subgrupoLimpio !== ' ') {
                    gruposSeleccionados.push(`${item.grupo} - ${subgrupoLimpio}`);
                } else {
                    gruposSeleccionados.push(item.grupo);
                }
                porcionesSeleccionadas.push(item.porciones);
            }
        });
   
        if (gruposSeleccionados.length === 0) {
            alert('No hay grupos seleccionados. Por favor, asigne porciones a al menos un grupo.');
            return;
        }
   
        const tablaNutrientes = document.getElementById('tablaNutrientesBody');
        const filas = tablaNutrientes.querySelectorAll('tr');
        
        const hcGramos = parseFloat(filas[0]?.querySelectorAll('td')[2]?.textContent) || 0;
        const lipidosGramos = parseFloat(filas[1]?.querySelectorAll('td')[2]?.textContent) || 0;
        const proteinasGramos = parseFloat(filas[2]?.querySelectorAll('td')[2]?.textContent) || 0;
   
        sessionStorage.setItem('desdeDonde', 'equivalentes');
        sessionStorage.setItem('destino', 'plan');
   
        const gruposStr = encodeURIComponent(JSON.stringify(gruposSeleccionados));
        const porcionesStr = encodeURIComponent(JSON.stringify(porcionesSeleccionadas));
   
        window.location.href = `plan-alimenticio.html?hc=${hcGramos}&lipidos=${lipidosGramos}&proteinas=${proteinasGramos}&grupos=${gruposStr}&porciones=${porcionesStr}`;
    });
   
    // === BOTÓN R24H ===
    elementos.r24hBtn.addEventListener('click', () => {
        guardarEstadoParaRegreso();

        const tablaNutrientes = document.getElementById('tablaNutrientesBody');
        const filas = tablaNutrientes.querySelectorAll('tr');
        
        const hcGramos = parseFloat(filas[0]?.querySelectorAll('td')[2]?.textContent) || 0;
        const lipidosGramos = parseFloat(filas[1]?.querySelectorAll('td')[2]?.textContent) || 0;
        const proteinasGramos = parseFloat(filas[2]?.querySelectorAll('td')[2]?.textContent) || 0;
   
        sessionStorage.setItem('desdeDonde', 'equivalentes');
        sessionStorage.setItem('destino', 'recordatorio');
   
        window.location.href = `recordatorio.html?hc=${hcGramos}&lipidos=${lipidosGramos}&proteinas=${proteinasGramos}`;
    });
   
    // === BOTÓN REGRESAR ===
    elementos.btnRegresar.addEventListener('click', () => {
        sessionStorage.removeItem('desdeDonde');
        sessionStorage.removeItem('destino');
        sessionStorage.removeItem('datosEquivalentesGuardados');
        
        window.location.href = 'index.html';
    });
   
    // Enter en el input de kcal
    elementos.kcalInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') elementos.actualizarBtn.click();
    });
}

// ========== INICIALIZACION ==========
document.addEventListener('DOMContentLoaded', () => {
    obtenerGetDeURL();
    inicializarDatos();
    restaurarEstadoSiExiste();
    
    renderizarTablaEquivalentes();
    renderizarTablaPorcentajes();
    actualizarTablaDistribucion();
    calcularTotales();
    inicializarEventos();
   
    mostrarNotif('Sistema de Equivalentes cargado correctamente', 'success');
    console.log('Sistema de Equivalentes inicializado');
});