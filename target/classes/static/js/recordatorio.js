// ========== CONFIGURACIÓN INICIAL ==========
const API_URL = '/api/recordatorio';
const STORAGE_KEY = 'recordatorioTemp';

// Variables globales
let datosRecordatorio = null;
let grupos = [];
let alimentosPorGrupo = {};
let nutrientesAlimentos = {};
let platillos = [];
let platillosPorNombre = {};

// Estado de las selecciones
let estado = {
    desayuno: { platillos: [], alimentos: [] },
    comida:   { platillos: [], alimentos: [] },
    cena:     { platillos: [], alimentos: [] }
};

// Totales de nutrientes (gramos)
let totales = { hc: 0, lipidos: 0, proteinas: 0 };

// Valores ideales (en gramos) - valores por defecto según tabla de ejemplo
let idealHcGramos = 300.0;
let idealLipidosGramos = 33.3;
let idealProteinasGramos = 125.0;

// Límite máximo de porciones por grupo en TOTAL (global por día)
const LIMITE_POR_GRUPO = 10;

// ========== OBTENER VALORES IDEALES DE LA URL (en GRAMOS) ==========
function obtenerValoresIdeales() {
    const urlParams = new URLSearchParams(window.location.search);
    
    const hcGramos = urlParams.get('hc');
    const lipGramos = urlParams.get('lipidos');
    const protGramos = urlParams.get('proteinas');
    
    if (hcGramos && !isNaN(parseFloat(hcGramos))) {
        idealHcGramos = parseFloat(hcGramos);
    }
    if (lipGramos && !isNaN(parseFloat(lipGramos))) {
        idealLipidosGramos = parseFloat(lipGramos);
    }
    if (protGramos && !isNaN(parseFloat(protGramos))) {
        idealProteinasGramos = parseFloat(protGramos);
    }
    
    console.log('Valores ideales (gramos):', {
        hc: idealHcGramos,
        lipidos: idealLipidosGramos,
        proteinas: idealProteinasGramos
    });
}

// ========== ACTUALIZAR TARJETAS DE NUTRIENTES (gramos arriba, kcal abajo) ==========
function actualizarTarjetasNutrientes() {
    // Gramos actuales
    const hcGramosActual = totales.hc;
    const lipGramosActual = totales.lipidos;
    const protGramosActual = totales.proteinas;

    // Kcal actuales = gramos × factor
    const hcKcalActual = hcGramosActual * 4;
    const lipKcalActual = lipGramosActual * 9;
    const protKcalActual = protGramosActual * 4;

    // Objetivos en gramos
    const hcGramosObj = idealHcGramos;
    const lipGramosObj = idealLipidosGramos;
    const protGramosObj = idealProteinasGramos;

    // Objetivos en kcal
    const hcKcalObj = hcGramosObj * 4;
    const lipKcalObj = lipGramosObj * 9;
    const protKcalObj = protGramosObj * 4;

    // Actualizar gramos (línea principal)
    document.getElementById('hcObjetivoGramos').textContent = hcGramosObj.toFixed(1);
    document.getElementById('hcActualGramos').textContent = hcGramosActual.toFixed(1);
    document.getElementById('lipidosObjetivoGramos').textContent = lipGramosObj.toFixed(1);
    document.getElementById('lipidosActualGramos').textContent = lipGramosActual.toFixed(1);
    document.getElementById('proteinasObjetivoGramos').textContent = protGramosObj.toFixed(1);
    document.getElementById('proteinasActualGramos').textContent = protGramosActual.toFixed(1);

    // Actualizar kcal (detalle)
    document.getElementById('hcObjetivoKcal').textContent = hcKcalObj.toFixed(1);
    document.getElementById('hcActualKcal').textContent = hcKcalActual.toFixed(1);
    document.getElementById('lipidosObjetivoKcal').textContent = lipKcalObj.toFixed(1);
    document.getElementById('lipidosActualKcal').textContent = lipKcalActual.toFixed(1);
    document.getElementById('proteinasObjetivoKcal').textContent = protKcalObj.toFixed(1);
    document.getElementById('proteinasActualKcal').textContent = protKcalActual.toFixed(1);

    // Porcentajes (basados en gramos)
    const totalGramos = hcGramosActual + lipGramosActual + protGramosActual;
    const pctHc = totalGramos > 0 ? (hcGramosActual / totalGramos) * 100 : 0;
    const pctLip = totalGramos > 0 ? (lipGramosActual / totalGramos) * 100 : 0;
    const pctProt = totalGramos > 0 ? (protGramosActual / totalGramos) * 100 : 0;

    document.getElementById('hcPorcentaje').textContent = pctHc.toFixed(1);
    document.getElementById('lipidosPorcentaje').textContent = pctLip.toFixed(1);
    document.getElementById('proteinasPorcentaje').textContent = pctProt.toFixed(1);
}

// ========== PERSISTENCIA EN SESIÓN ==========
function guardarEstadoEnSession() {
    const datosAGuardar = {
        estado,
        totales,
        grupos,
        idealHcGramos,
        idealLipidosGramos,
        idealProteinasGramos
    };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(datosAGuardar));
}

function cargarEstadoDesdeSession() {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    try {
        return JSON.parse(raw);
    } catch(e) {
        return null;
    }
}

// ========== FUNCIONES DE CARGA ==========
function mostrarLoading(mostrar) {
    const loadingPanel = document.getElementById('loadingPanel');
    const mainContent = document.getElementById('mainContent');
    const tarjetas = document.getElementById('nutrientesTarjetas');
    
    if (loadingPanel) loadingPanel.style.display = mostrar ? 'block' : 'none';
    if (mainContent) mainContent.style.display = mostrar ? 'none' : 'block';
    if (tarjetas) tarjetas.style.display = mostrar ? 'none' : 'flex';
}

function mostrarError(mensaje) {
    alert('Error: ' + mensaje);
}

async function cargarDatos() {
    mostrarLoading(true);
    
    try {
        const response = await fetch(`${API_URL}/datos`);
        const result = await response.json();
        
        if (result.success) {
            datosRecordatorio = result.data;
            grupos = datosRecordatorio.grupos || [];
            alimentosPorGrupo = datosRecordatorio.alimentosPorGrupo || {};
            nutrientesAlimentos = datosRecordatorio.nutrientesAlimentos || {};
            platillos = datosRecordatorio.platillos || [];
            
            platillos.forEach(p => { platillosPorNombre[p.nombre] = p; });
            
            // Intentar restaurar desde sessionStorage
            const sessionData = cargarEstadoDesdeSession();
            if (sessionData && sessionData.grupos && JSON.stringify(sessionData.grupos) === JSON.stringify(grupos)) {
                if (confirm('¿Deseas continuar con el registro anterior?')) {
                    estado = sessionData.estado;
                    totales = sessionData.totales;
                    idealHcGramos = sessionData.idealHcGramos;
                    idealLipidosGramos = sessionData.idealLipidosGramos;
                    idealProteinasGramos = sessionData.idealProteinasGramos;
                } else {
                    sessionStorage.removeItem(STORAGE_KEY);
                    inicializarEstadoVacio();
                    totales = { hc: 0, lipidos: 0, proteinas: 0 };
                }
            } else {
                sessionStorage.removeItem(STORAGE_KEY);
                inicializarEstadoVacio();
                totales = { hc: 0, lipidos: 0, proteinas: 0 };
            }
            
            inicializarInterfaz();
        } else {
            mostrarError('Error cargando datos: ' + result.error);
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarError('No se pudieron cargar los datos.');
    } finally {
        mostrarLoading(false);
    }
}

function inicializarEstadoVacio() {
    estado = {
        desayuno: { platillos: [], alimentos: [] },
        comida:   { platillos: [], alimentos: [] },
        cena:     { platillos: [], alimentos: [] }
    };
    for (let i = 0; i < 6; i++) {
        for (let j = 0; j < grupos.length; j++) {
            estado.desayuno.alimentos.push({ row: i, col: j, grupo: grupos[j], alimento: '', porcion: 1 });
            estado.comida.alimentos.push({ row: i, col: j, grupo: grupos[j], alimento: '', porcion: 1 });
            estado.cena.alimentos.push({ row: i, col: j, grupo: grupos[j], alimento: '', porcion: 1 });
        }
    }
}

// ========== INICIALIZAR INTERFAZ ==========
function inicializarInterfaz() {
    crearTablas();
    crearSelectoresPlatillos('desayuno');
    crearSelectoresPlatillos('comida');
    crearSelectoresPlatillos('cena');
    restaurarSelecciones();
    actualizarTodosLosGruposGlobales();
    actualizarTarjetasNutrientes();
    console.log('Interfaz inicializada');
}

// ========== CREAR TABLAS (con contadores en th) ==========
function crearTablas() {
    const comidas = ['desayuno', 'comida', 'cena'];
    comidas.forEach(comida => {
        const tablaId = `tabla${capitalize(comida)}`;
        const tabla = document.getElementById(tablaId);
        if (!tabla) return;
        
        let html = '<thead><tr>';
        grupos.forEach((grupo, idx) => {
            html += `<th><div class="grupo-header-con-contador">${grupo}<span class="contador-porciones-grupo" id="contador_${comida}_${idx}">0/${LIMITE_POR_GRUPO}</span></div></th>`;
        });
        html += '</tr></thead><tbody>';
        
        for (let i = 0; i < 6; i++) {
            html += '<tr>';
            for (let j = 0; j < grupos.length; j++) {
                const grupo = grupos[j];
                const alimentos = alimentosPorGrupo[grupo] || [];
                html += `<td data-row="${i}" data-col="${j}" data-grupo="${grupo}" data-comida="${comida}">`;
                html += `<div class="cell-editor">`;
                html += `<select class="alimento-select" data-comida="${comida}" data-row="${i}" data-col="${j}">`;
                html += `<option value="">-- Seleccionar --</option>`;
                alimentos.forEach(alimento => {
                    html += `<option value="${alimento}">${alimento}</option>`;
                });
                html += `</select>`;
                html += `<input type="number" min="0" max="${LIMITE_POR_GRUPO}" value="1" class="porcion-input" data-comida="${comida}" data-row="${i}" data-col="${j}">`;
                html += `</div>`;
                html += `</table>`;
            }
            html += '</tr>';
        }
        html += '</tbody>';
        tabla.innerHTML = html;
    });
    
    // Asignar eventos después de crear el DOM
    document.querySelectorAll('.alimento-select, .porcion-input').forEach(el => {
        el.removeEventListener('change', manejarCambioAlimento);
        el.addEventListener('change', manejarCambioAlimento);
    });
}

function manejarCambioAlimento(e) {
    const el = e.target;
    const comida = el.dataset.comida;
    const row = parseInt(el.dataset.row);
    const col = parseInt(el.dataset.col);
    const select = document.querySelector(`.alimento-select[data-comida="${comida}"][data-row="${row}"][data-col="${col}"]`);
    const input = document.querySelector(`.porcion-input[data-comida="${comida}"][data-row="${row}"][data-col="${col}"]`);
    if (select && input) {
        cambiarAlimento(comida, row, col, select.value, parseInt(input.value) || 1);
    }
}

// ========== CREAR SELECTORES DE PLATILLOS ==========
function crearSelectoresPlatillos(comida) {
    const container = document.getElementById(`platillos${capitalize(comida)}`);
    if (!container) return;
    container.innerHTML = '';
    
    for (let i = 0; i < 4; i++) {
        const div = document.createElement('div');
        div.className = 'platillo-item';
        
        const select = document.createElement('select');
        select.id = `platillo_${comida}_${i}`;
        select.onchange = () => cambiarPlatillo(comida, i);
        
        const optVacia = document.createElement('option');
        optVacia.value = '';
        optVacia.textContent = '-- Seleccionar --';
        select.appendChild(optVacia);
        
        platillos.forEach(p => {
            const opt = document.createElement('option');
            opt.value = p.nombre;
            opt.textContent = p.nombre;
            select.appendChild(opt);
        });
        
        const input = document.createElement('input');
        input.type = 'number';
        input.min = '1';
        input.max = '10';
        input.value = '1';
        input.id = `porcion_${comida}_${i}`;
        input.onchange = () => cambiarPlatillo(comida, i);
        
        div.appendChild(select);
        div.appendChild(input);
        container.appendChild(div);
    }
}

// ========== FUNCIONES GLOBALES POR GRUPO ==========
function actualizarGrupoGlobal(colIndex) {
    // Sumar total de porciones de este grupo en todas las comidas
    let totalGlobal = 0;
    ['desayuno', 'comida', 'cena'].forEach(comida => {
        estado[comida].alimentos.forEach(a => {
            if (a.col === colIndex && a.alimento) {
                totalGlobal += (a.porcion || 0);
            }
        });
    });
    
    // Actualizar contadores visuales en los tres th
    ['desayuno', 'comida', 'cena'].forEach(comida => {
        const contadorSpan = document.getElementById(`contador_${comida}_${colIndex}`);
        if (contadorSpan) contadorSpan.textContent = `${totalGlobal}/${LIMITE_POR_GRUPO}`;
    });
    
    // Para cada comida, recorrer filas y deshabilitar según el total global
    ['desayuno', 'comida', 'cena'].forEach(comida => {
        const tablaId = `tabla${capitalize(comida)}`;
        const tabla = document.getElementById(tablaId);
        if (!tabla) return;
        const tbody = tabla.querySelector('tbody');
        if (!tbody) return;
        const rows = tbody.querySelectorAll('tr');
        
        let sumaParcial = 0;
        rows.forEach((row, rowIndex) => {
            const cell = row.cells[colIndex];
            if (!cell) return;
            const select = cell.querySelector('.alimento-select');
            const input = cell.querySelector('.porcion-input');
            if (!select || !input) return;
            
            const valorActual = parseFloat(input.value) || 0;
            const tieneSeleccion = select.value && valorActual > 0;
            if (tieneSeleccion) sumaParcial += valorActual;
            
            let deshabilitar = false;
            if (totalGlobal >= LIMITE_POR_GRUPO && !tieneSeleccion) {
                deshabilitar = true;
            } else if (!tieneSeleccion && sumaParcial > totalGlobal) {
                deshabilitar = true;
            }
            
            select.disabled = deshabilitar;
            input.disabled = deshabilitar;
            
            if (!deshabilitar) {
                const restante = LIMITE_POR_GRUPO - totalGlobal + (tieneSeleccion ? valorActual : 0);
                const maxPermitido = Math.max(0, restante);
                input.max = maxPermitido;
                if (valorActual > maxPermitido && maxPermitido >= 0) {
                    input.value = maxPermitido;
                    const event = new Event('change', { bubbles: true });
                    input.dispatchEvent(event);
                }
            }
        });
    });
}

function actualizarTodosLosGruposGlobales() {
    for (let col = 0; col < grupos.length; col++) {
        actualizarGrupoGlobal(col);
    }
}

// ========== RESTAURAR SELECCIONES DEL ESTADO ==========
function restaurarSelecciones() {
    for (const comida of ['desayuno', 'comida', 'cena']) {
        const tablaId = `tabla${capitalize(comida)}`;
        const tabla = document.getElementById(tablaId);
        if (!tabla) continue;
        
        for (const a of estado[comida].alimentos) {
            if (!a.alimento) continue;
            const select = tabla.querySelector(`.alimento-select[data-row="${a.row}"][data-col="${a.col}"]`);
            const input = tabla.querySelector(`.porcion-input[data-row="${a.row}"][data-col="${a.col}"]`);
            if (select) select.value = a.alimento;
            if (input) input.value = a.porcion;
        }
        
        for (const p of estado[comida].platillos) {
            const select = document.getElementById(`platillo_${comida}_${p.index}`);
            const input = document.getElementById(`porcion_${comida}_${p.index}`);
            if (select) select.value = p.nombre || '';
            if (input) input.value = p.porcion || 1;
        }
    }
}

// ========== MANEJADORES DE CAMBIO ==========
function cambiarAlimento(comida, row, col, alimento, porcion) {
    // Calcular total global actual sin contar esta fila
    let totalActualSinFila = calcularTotalGlobalGrupo(col);
    const existente = estado[comida].alimentos.find(a => a.row === row && a.col === col);
    if (existente && existente.alimento) {
        totalActualSinFila -= (existente.porcion || 0);
    }
    
    let porcionNum = parseInt(porcion) || 0;
    const restanteGlobal = LIMITE_POR_GRUPO - totalActualSinFila;
    if (porcionNum > restanteGlobal && restanteGlobal >= 0) {
        porcionNum = restanteGlobal;
        const input = document.querySelector(`.porcion-input[data-comida="${comida}"][data-row="${row}"][data-col="${col}"]`);
        if (input) input.value = porcionNum;
    }
    
    // Actualizar nutrientes
    if (existente && existente.alimento) {
        const nutrientesAnt = obtenerNutrientesDeAlimento(existente.alimento);
        if (nutrientesAnt) restarNutrientes(nutrientesAnt, existente.porcion);
    }
    
    if (existente) {
        existente.alimento = alimento;
        existente.porcion = porcionNum;
    } else if (alimento && porcionNum > 0) {
        estado[comida].alimentos.push({ row, col, grupo: grupos[col], alimento, porcion: porcionNum });
    }
    
    if (alimento && porcionNum > 0) {
        const nutrientesNue = obtenerNutrientesDeAlimento(alimento);
        if (nutrientesNue) sumarNutrientes(nutrientesNue, porcionNum);
    } else if (!alimento && existente) {
        existente.alimento = '';
        existente.porcion = 0;
    }
    
    actualizarGrupoGlobal(col);
    actualizarTarjetasNutrientes();
    guardarEstadoEnSession();
}

function calcularTotalGlobalGrupo(col) {
    let total = 0;
    ['desayuno', 'comida', 'cena'].forEach(comida => {
        estado[comida].alimentos.forEach(a => {
            if (a.col === col && a.alimento) total += (a.porcion || 0);
        });
    });
    return total;
}

function cambiarPlatillo(comida, index) {
    const select = document.getElementById(`platillo_${comida}_${index}`);
    const input = document.getElementById(`porcion_${comida}_${index}`);
    if (!select || !input) return;
    
    const nombre = select.value;
    const porcion = parseInt(input.value) || 1;
    const existente = estado[comida].platillos.find(p => p.index === index);
    
    if (existente && existente.nombre) {
        const nutrientesAnt = obtenerNutrientesDePlatillo(existente.nombre);
        if (nutrientesAnt) restarNutrientes(nutrientesAnt, existente.porcion);
        existente.nombre = nombre;
        existente.porcion = porcion;
    } else if (existente) {
        existente.nombre = nombre;
        existente.porcion = porcion;
    } else {
        estado[comida].platillos.push({ index, nombre, porcion });
    }
    
    if (nombre && porcion > 0) {
        const nutrientesNue = obtenerNutrientesDePlatillo(nombre);
        if (nutrientesNue) sumarNutrientes(nutrientesNue, porcion);
    }
    
    actualizarTarjetasNutrientes();
    guardarEstadoEnSession();
}

// ========== FUNCIONES DE NUTRIENTES ==========
function sumarNutrientes(nutrientes, factor = 1) {
    totales.hc += (nutrientes.hc || 0) * factor;
    totales.lipidos += (nutrientes.lipidos || 0) * factor;
    totales.proteinas += (nutrientes.proteinas || 0) * factor;
}

function restarNutrientes(nutrientes, factor = 1) {
    totales.hc -= (nutrientes.hc || 0) * factor;
    totales.lipidos -= (nutrientes.lipidos || 0) * factor;
    totales.proteinas -= (nutrientes.proteinas || 0) * factor;
}

function obtenerNutrientesDeAlimento(nombreAlimento) {
    if (!nombreAlimento || !nutrientesAlimentos[nombreAlimento]) return null;
    const nut = nutrientesAlimentos[nombreAlimento];
    return { hc: nut.HC || 0, lipidos: nut['Lípidos'] || 0, proteinas: nut['Proteínas'] || 0 };
}

function obtenerNutrientesDePlatillo(nombrePlatillo) {
    if (!nombrePlatillo || !platillosPorNombre[nombrePlatillo]) return null;
    return platillosPorNombre[nombrePlatillo].nutrientes;
}

// ========== VER TODOS LOS PLATILLOS ==========
function verTodosPlatillos(comida) {
    const modal = document.getElementById('modalPlatillos');
    const titulo = document.getElementById('modalTitulo');
    const lista = document.getElementById('modalLista');
    if (!modal || !titulo || !lista) return;
    
    titulo.textContent = `Platillos Disponibles - ${comida}`;
    let html = '<ul style="list-style: none; padding: 0;">';
    platillos.forEach((p, index) => {
        html += `<li style="padding: 8px; border-bottom: 1px solid #ecf0f1;">
            <strong>${index + 1}. ${p.nombre}</strong><br>
            <span style="font-size: 0.9rem; color: #666;">
                HC: ${p.nutrientes?.hc?.toFixed(1) || 0}g | 
                Lípidos: ${p.nutrientes?.lipidos?.toFixed(1) || 0}g | 
                Proteínas: ${p.nutrientes?.proteinas?.toFixed(1) || 0}g
            </span>
        </li>`;
    });
    html += '</ul>';
    lista.innerHTML = html;
    modal.style.display = 'block';
}

function cerrarModal() {
    document.getElementById('modalPlatillos').style.display = 'none';
}

// ========== VALIDACIÓN ANTES DE EXPORTAR ==========
function validarPorcionesCompletas() {
    for (let col = 0; col < grupos.length; col++) {
        const totalGlobal = calcularTotalGlobalGrupo(col);
        if (totalGlobal !== LIMITE_POR_GRUPO) {
            alert(`El grupo "${grupos[col]}" debe tener exactamente ${LIMITE_POR_GRUPO} porciones en total (sumando desayuno+comida+cena). Actualmente tiene ${totalGlobal}.`);
            return false;
        }
    }
    return true;
}

// ========== EXPORTAR A TXT ==========
async function exportarTXT() {
    if (!validarPorcionesCompletas()) return;
    
    const tieneDatos = Object.values(estado).some(comida => 
        comida.alimentos.some(a => a.alimento) || comida.platillos.some(p => p.nombre)
    );
    if (!tieneDatos) {
        alert('No hay datos para exportar. Agrega al menos un alimento o platillo.');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/exportar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                estado, 
                totales, 
                ideales: { 
                    hc: idealHcGramos, 
                    lipidos: idealLipidosGramos, 
                    proteinas: idealProteinasGramos 
                },
                limitePorGrupo: LIMITE_POR_GRUPO
            })
        });
        
        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'recordatorio_alimenticio.txt';
            a.click();
            window.URL.revokeObjectURL(url);
        } else {
            alert('Error al exportar');
        }
    } catch (error) {
        console.error('Error exportando:', error);
        alert('Error al exportar: ' + error.message);
    }
}

// ========== REGRESAR ==========
function volverAtras() {
    guardarEstadoEnSession();
    sessionStorage.setItem('desdeDonde', 'recordatorio');
    sessionStorage.setItem('destino', 'equivalentes');
    window.location.href = 'equivalentes.html';
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// ========== INICIALIZACIÓN ==========
document.addEventListener('DOMContentLoaded', () => {
    obtenerValoresIdeales();
    cargarDatos();
    
    document.getElementById('btnExportar')?.addEventListener('click', exportarTXT);
    document.getElementById('btnRegresar')?.addEventListener('click', volverAtras);
    
    window.onclick = function(event) {
        const modal = document.getElementById('modalPlatillos');
        if (event.target === modal) modal.style.display = 'none';
    };
    
    console.log('Recordatorio inicializado');
});