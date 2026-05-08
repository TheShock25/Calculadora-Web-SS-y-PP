// ========== CONFIGURACIÓN INICIAL ==========
const API_URL = '/api/recordatorio';

// Variables globales
let datosRecordatorio = null;
let grupos = [];
let alimentosPorGrupo = {};
let nutrientesAlimentos = {};
let platillos = [];
let platillosPorNombre = {};

// Estado de las selecciones
let estado = {
    desayuno: {
        platillos: [],
        alimentos: []
    },
    comida: {
        platillos: [],
        alimentos: []
    },
    cena: {
        platillos: [],
        alimentos: []
    }
};

// Totales de nutrientes
let totales = {
    hc: 0,
    lipidos: 0,
    proteinas: 0
};

// Valores ideales (recibidos de la URL)
let idealHc = 309;
let idealLipidos = 34;
let idealProteinas = 124;

// ========== FUNCIÓN PARA OBTENER VALORES IDEALES DE LA URL ==========
function obtenerValoresIdeales() {
    const urlParams = new URLSearchParams(window.location.search);
    
    const hc = urlParams.get('hc');
    const lip = urlParams.get('lipidos');
    const prot = urlParams.get('proteinas');
    
    if (hc) idealHc = parseFloat(hc);
    if (lip) idealLipidos = parseFloat(lip);
    if (prot) idealProteinas = parseFloat(prot);
    
    console.log('Valores ideales cargados desde URL:', {
        hc: idealHc,
        lipidos: idealLipidos,
        proteinas: idealProteinas
    });
}

// ========== MOSTRAR VALORES IDEALES EN HEADER ==========
function mostrarValoresIdeales() {
    const header = document.querySelector('.header');
    if (header) {
        let infoDiv = document.getElementById('valoresIdeales');
        if (!infoDiv) {
            infoDiv = document.createElement('div');
            infoDiv.id = 'valoresIdeales';
            infoDiv.style.marginTop = '15px';
            infoDiv.style.padding = '10px';
            infoDiv.style.backgroundColor = 'rgba(255,255,255,0.2)';
            infoDiv.style.borderRadius = '8px';
            infoDiv.style.fontSize = '0.95rem';
            header.appendChild(infoDiv);
        }
        
        infoDiv.innerHTML = `
            <span style="margin-right: 20px;"><strong>HC ideal:</strong> ${idealHc.toFixed(1)}g</span>
            <span style="margin-right: 20px;"><strong>Lípidos ideal:</strong> ${idealLipidos.toFixed(1)}g</span>
            <span><strong>Proteínas ideal:</strong> ${idealProteinas.toFixed(1)}g</span>
        `;
    }
}

// ========== FUNCIONES DE CARGA ==========
function mostrarLoading(mostrar) {
    const loadingPanel = document.getElementById('loadingPanel');
    const mainContent = document.getElementById('mainContent');
    
    if (loadingPanel) loadingPanel.style.display = mostrar ? 'block' : 'none';
    if (mainContent) mainContent.style.display = mostrar ? 'none' : 'block';
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
            
            // Procesar datos
            grupos = datosRecordatorio.grupos || [];
            alimentosPorGrupo = datosRecordatorio.alimentosPorGrupo || {};
            nutrientesAlimentos = datosRecordatorio.nutrientesAlimentos || {};
            platillos = datosRecordatorio.platillos || [];
            
            // Crear mapa de platillos por nombre
            platillos.forEach(p => {
                platillosPorNombre[p.nombre] = p;
            });
            
            console.log('Datos cargados:', {
                grupos: grupos.length,
                alimentos: Object.keys(nutrientesAlimentos).length,
                platillos: platillos.length
            });
            
            // Inicializar la interfaz
            inicializarInterfaz();
            
        } else {
            mostrarError('Error cargando datos: ' + result.error);
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarError('No se pudieron cargar los datos. Verifique la conexión con el servidor.');
    } finally {
        mostrarLoading(false);
    }
}

// ========== INICIALIZAR INTERFAZ ==========
function inicializarInterfaz() {
    // Crear tablas
    crearTabla('tablaDesayuno', grupos);
    crearTabla('tablaComida', grupos);
    crearTabla('tablaCena', grupos);
    
    // Crear selectores de platillos
    crearSelectoresPlatillos('desayuno');
    crearSelectoresPlatillos('comida');
    crearSelectoresPlatillos('cena');
    
    // Inicializar estado
    inicializarEstado();
    
    // Mostrar valores ideales
    mostrarValoresIdeales();
    
    console.log('Interfaz inicializada');
}

// ========== CREAR TABLA ==========
function crearTabla(elementId, columnas) {
    const tabla = document.getElementById(elementId);
    if (!tabla) return;
    
    let html = '<thead><tr>';
    columnas.forEach(col => {
        html += `<th>${col}</th>`;
    });
    html += '</tr></thead><tbody>';
    
    for (let i = 0; i < 6; i++) {
        html += '<tr>';
        for (let j = 0; j < columnas.length; j++) {
            const grupo = columnas[j];
            const alimentos = alimentosPorGrupo[grupo] || [];
            
            html += `<td data-row="${i}" data-col="${j}" data-grupo="${grupo}">`;
            html += `<div class="cell-editor">`;
            html += `<select class="alimento-select" onchange="cambiarAlimento('${elementId}', ${i}, ${j}, this.value)">`;
            html += `<option value="">-- Seleccionar --</option>`;
            
            alimentos.forEach(alimento => {
                html += `<option value="${alimento}">${alimento}</option>`;
            });
            
            html += `</select>`;
            html += `<input type="number" min="0" max="10" value="1" class="porcion-input" onchange="cambiarPorcion('${elementId}', ${i}, ${j}, this.value)">`;
            html += `</div>`;
            html += `</td>`;
        }
        html += '</tr>';
    }
    
    html += '</tbody>';
    tabla.innerHTML = html;
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
        
        const optionVacia = document.createElement('option');
        optionVacia.value = '';
        optionVacia.textContent = '-- Seleccionar --';
        select.appendChild(optionVacia);
        
        platillos.forEach(p => {
            const option = document.createElement('option');
            option.value = p.nombre;
            option.textContent = p.nombre;
            select.appendChild(option);
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

// ========== INICIALIZAR ESTADO ==========
function inicializarEstado() {
    for (let i = 0; i < 6; i++) {
        for (let j = 0; j < grupos.length; j++) {
            estado.desayuno.alimentos.push({ row: i, col: j, grupo: grupos[j], alimento: '', porcion: 1 });
            estado.comida.alimentos.push({ row: i, col: j, grupo: grupos[j], alimento: '', porcion: 1 });
            estado.cena.alimentos.push({ row: i, col: j, grupo: grupos[j], alimento: '', porcion: 1 });
        }
    }
}

// ========== FUNCIONES AUXILIARES ==========
function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function obtenerComidaDesdeTabla(tablaId) {
    if (tablaId === 'tablaDesayuno') return 'desayuno';
    if (tablaId === 'tablaComida') return 'comida';
    return 'cena';
}

// ========== FUNCIONES DE NUTRIENTES ==========
function sumarNutrientes(nutrientes, factor = 1) {
    if (!nutrientes) return;
    totales.hc += (nutrientes.hc || 0) * factor;
    totales.lipidos += (nutrientes.lipidos || 0) * factor;
    totales.proteinas += (nutrientes.proteinas || 0) * factor;
}

function restarNutrientes(nutrientes, factor = 1) {
    if (!nutrientes) return;
    totales.hc -= (nutrientes.hc || 0) * factor;
    totales.lipidos -= (nutrientes.lipidos || 0) * factor;
    totales.proteinas -= (nutrientes.proteinas || 0) * factor;
}

function obtenerNutrientesDeAlimento(nombreAlimento) {
    if (!nombreAlimento || !nutrientesAlimentos[nombreAlimento]) return null;
    
    const nut = nutrientesAlimentos[nombreAlimento];
    return {
        hc: nut.HC || 0,
        lipidos: nut['Lípidos'] || 0,
        proteinas: nut['Proteínas'] || 0
    };
}

function obtenerNutrientesDePlatillo(nombrePlatillo) {
    if (!nombrePlatillo || !platillosPorNombre[nombrePlatillo]) return null;
    return platillosPorNombre[nombrePlatillo].nutrientes;
}

function actualizarTotales() {
    document.getElementById('totalHc').textContent = totales.hc.toFixed(1);
    document.getElementById('totalLipidos').textContent = totales.lipidos.toFixed(1);
    document.getElementById('totalProteinas').textContent = totales.proteinas.toFixed(1);
    
    const totalGramos = totales.hc + totales.lipidos + totales.proteinas;
    
    if (totalGramos > 0) {
        document.getElementById('pctHc').textContent = ((totales.hc / totalGramos) * 100).toFixed(1) + '%';
        document.getElementById('pctLipidos').textContent = ((totales.lipidos / totalGramos) * 100).toFixed(1) + '%';
        document.getElementById('pctProteinas').textContent = ((totales.proteinas / totalGramos) * 100).toFixed(1) + '%';
    }
}

// ========== MANEJADORES DE EVENTOS ==========
function cambiarAlimento(tablaId, row, col, alimento) {
    const comida = obtenerComidaDesdeTabla(tablaId);
    const grupo = grupos[col];
    
    const existente = estado[comida].alimentos.find(
        a => a.row === row && a.col === col
    );
    
    if (existente) {
        if (existente.alimento) {
            const nutrientes = obtenerNutrientesDeAlimento(existente.alimento);
            restarNutrientes(nutrientes, existente.porcion);
        }
        
        existente.alimento = alimento;
        existente.porcion = parseInt(document.querySelector(`#${tablaId} [data-row="${row}"][data-col="${col}"] .porcion-input`).value) || 1;
        
        if (alimento) {
            const nutrientes = obtenerNutrientesDeAlimento(alimento);
            sumarNutrientes(nutrientes, existente.porcion);
        }
    } else {
        const porcion = parseInt(document.querySelector(`#${tablaId} [data-row="${row}"][data-col="${col}"] .porcion-input`).value) || 1;
        
        estado[comida].alimentos.push({
            row, col, grupo, alimento, porcion
        });
        
        if (alimento) {
            const nutrientes = obtenerNutrientesDeAlimento(alimento);
            sumarNutrientes(nutrientes, porcion);
        }
    }
    
    actualizarTotales();
}

function cambiarPorcion(tablaId, row, col, nuevaPorcion) {
    const comida = obtenerComidaDesdeTabla(tablaId);
    const alimento = estado[comida].alimentos.find(
        a => a.row === row && a.col === col
    );
    
    if (alimento && alimento.alimento) {
        const porcionAnterior = alimento.porcion;
        const nutrientes = obtenerNutrientesDeAlimento(alimento.alimento);
        
        if (nutrientes) {
            restarNutrientes(nutrientes, porcionAnterior);
            sumarNutrientes(nutrientes, nuevaPorcion);
        }
        
        alimento.porcion = nuevaPorcion;
        actualizarTotales();
    }
}

function cambiarPlatillo(comida, index) {
    const select = document.getElementById(`platillo_${comida}_${index}`);
    const input = document.getElementById(`porcion_${comida}_${index}`);
    
    if (!select || !input) return;
    
    const nombre = select.value;
    const porcion = parseInt(input.value) || 1;
    
    const existente = estado[comida].platillos.find(p => p.index === index);
    
    if (existente) {
        if (existente.nombre) {
            const nutrientes = obtenerNutrientesDePlatillo(existente.nombre);
            restarNutrientes(nutrientes, existente.porcion);
        }
        
        existente.nombre = nombre;
        existente.porcion = porcion;
        
        if (nombre) {
            const nutrientes = obtenerNutrientesDePlatillo(nombre);
            sumarNutrientes(nutrientes, porcion);
        }
    } else {
        estado[comida].platillos.push({
            index, nombre, porcion
        });
        
        if (nombre) {
            const nutrientes = obtenerNutrientesDePlatillo(nombre);
            sumarNutrientes(nutrientes, porcion);
        }
    }
    
    actualizarTotales();
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

// ========== EXPORTAR A TXT ==========
async function exportarTXT() {
    const tieneDatos = Object.values(estado).some(comida => 
        comida.alimentos.some(a => a.alimento) || 
        comida.platillos.some(p => p.nombre)
    );
    
    if (!tieneDatos) {
        alert('No hay datos para exportar.\nPor favor, agregue al menos un alimento o platillo específico en alguna comida.');
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
                    hc: idealHc, 
                    lipidos: idealLipidos, 
                    proteinas: idealProteinas 
                } 
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
    // Guardar que venimos de recordatorio
    sessionStorage.setItem('desdeDonde', 'recordatorio');
    sessionStorage.setItem('destino', 'equivalentes');
    window.location.href = 'equivalentes.html';
}

// ========== INICIALIZACIÓN ==========
document.addEventListener('DOMContentLoaded', () => {
    obtenerValoresIdeales();
    cargarDatos();
    
    // Event listeners
    document.getElementById('btnExportar')?.addEventListener('click', exportarTXT);
    document.getElementById('btnRegresar')?.addEventListener('click', volverAtras);
    
    window.onclick = function(event) {
        const modal = document.getElementById('modalPlatillos');
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    };
    
    console.log('Recordatorio inicializado');
});