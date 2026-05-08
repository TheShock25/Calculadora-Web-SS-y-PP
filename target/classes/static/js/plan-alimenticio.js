// ========== CONFIGURACIÓN INICIAL ==========
const API_URL = '/api/plan';

const DIAS_SEMANA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

// Variables globales
let datosPlan = null;
let gruposEspecificos = [];
let alimentosPorGrupo = {};
let nutrientesAlimentos = {};
let platillos = [];
let platillosPorNombre = {};

// Valores objetivo (recibidos de la URL)
let hcObjetivo = 0;
let lipidosObjetivo = 0;
let proteinasObjetivo = 0;
let gruposParam = [];
let porcionesParam = [];

// ========== ESTADO POR DÍA ==========
// estadoPorDia[diaIndex] = { desayuno: { platillos: [], alimentos: [] }, comida: {...}, cena: {...} }
let estadoPorDia = {};
let diaActivo = 0;   // índice 0-6

function estadoVacioDia() {
    return {
        desayuno: { platillos: [], alimentos: [] },
        comida:   { platillos: [], alimentos: [] },
        cena:     { platillos: [], alimentos: [] }
    };
}

function obtenerEstadoDia(diaIndex) {
    if (!estadoPorDia[diaIndex]) {
        estadoPorDia[diaIndex] = estadoVacioDia();
    }
    return estadoPorDia[diaIndex];
}

// ========== OBTENER PARÁMETROS DE LA URL ==========
function obtenerParametrosURL() {
    const urlParams = new URLSearchParams(window.location.search);

    const hc   = urlParams.get('hc');
    const lip  = urlParams.get('lipidos');
    const prot = urlParams.get('proteinas');

    if (hc)   hcObjetivo        = parseFloat(hc);
    if (lip)  lipidosObjetivo   = parseFloat(lip);
    if (prot) proteinasObjetivo = parseFloat(prot);

    const gruposStr   = urlParams.get('grupos');
    const porcionesStr = urlParams.get('porciones');

    if (gruposStr) {
        try { gruposParam = JSON.parse(decodeURIComponent(gruposStr)); }
        catch (e) { console.error('Error parseando grupos:', e); }
    }
    if (porcionesStr) {
        try { porcionesParam = JSON.parse(decodeURIComponent(porcionesStr)); }
        catch (e) { console.error('Error parseando porciones:', e); }
    }
}

// ========== MOSTRAR VALORES OBJETIVO ==========
function mostrarValoresObjetivo() {
    document.getElementById('hcObjetivo').textContent        = hcObjetivo.toFixed(1);
    document.getElementById('lipidosObjetivo').textContent   = lipidosObjetivo.toFixed(1);
    document.getElementById('proteinasObjetivo').textContent = proteinasObjetivo.toFixed(1);
    document.getElementById('objetivosPanel').style.display  = 'flex';
}

// ========== LOADING ==========
function mostrarLoading(mostrar) {
    const loading = document.getElementById('loadingPanel');
    const main = document.getElementById('mainContent');
    const obj = document.getElementById('objetivosPanel');
    const nav = document.getElementById('diasNav');

    if (loading) loading.style.display = mostrar ? 'block' : 'none';
    if (main) main.style.display = mostrar ? 'none' : 'block';
    if (obj) obj.style.display = mostrar ? 'none' : 'flex';
    if (nav) nav.style.display = mostrar ? 'none' : 'block';
}

function mostrarError(mensaje) {
    alert('Error: ' + mensaje);
}

async function cargarDatos() {
    mostrarLoading(true);

    try {
        const solicitud = {
            grupos:    gruposParam,
            porciones: porcionesParam,
            hc:        hcObjetivo,
            lipidos:   lipidosObjetivo,
            proteinas: proteinasObjetivo
        };

        const response = await fetch(`${API_URL}/datos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(solicitud)
        });

        const result = await response.json();

        if (result.success) {
            datosPlan = result.data;

            gruposEspecificos   = datosPlan.gruposEspecificos   || [];
            alimentosPorGrupo   = datosPlan.alimentosPorGrupo   || {};
            nutrientesAlimentos = datosPlan.nutrientesAlimentos || {};
            platillos           = datosPlan.platillos           || [];

            platillos.forEach(p => { platillosPorNombre[p.nombre] = p; });

            verificarDatosCargados();
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

function verificarDatosCargados() {
    console.log('=== VERIFICACIÓN DE DATOS CARGADOS ===');
    console.log('Grupos específicos:', gruposEspecificos);
    gruposEspecificos.forEach(grupo => {
        const alimentos = alimentosPorGrupo[grupo];
        if (alimentos && alimentos.length > 0) {
            console.log(`✓ Grupo "${grupo}": ${alimentos.length} alimentos`);
        } else {
            console.log(`✗ Grupo "${grupo}": NO CARGADO`);
        }
    });
    console.log('=== FIN VERIFICACIÓN ===');
}

// ========== INICIALIZAR INTERFAZ ==========
function inicializarInterfaz() {
    mostrarInfoGrupos();
    renderizarNavDias();
    cambiarDia(0);          // renderiza todo para el primer día
    mostrarValoresObjetivo();
    console.log('Interfaz inicializada');
}

function mostrarInfoGrupos() {
    const container = document.getElementById('gruposInfo');
    if (!container) return;
    let html = '<strong>Grupos seleccionados:</strong> ';
    gruposEspecificos.forEach((grupo, index) => {
        html += `<span>${index + 1}. ${grupo}</span>`;
    });
    html += ` <em>(${gruposEspecificos.length} grupos)</em>`;
    container.innerHTML = html;
}

// ========== NAVEGACIÓN DE DÍAS ==========
function renderizarNavDias() {
    const tabsContainer = document.getElementById('diasTabs');
    tabsContainer.innerHTML = '';

    DIAS_SEMANA.forEach((dia, index) => {
        const btn = document.createElement('button');
        btn.className = 'dia-tab';
        btn.textContent = dia;
        btn.dataset.dia = index;
        btn.addEventListener('click', () => cambiarDia(index));
        tabsContainer.appendChild(btn);
    });

    actualizarTabsDias();
}

function actualizarTabsDias() {
    document.querySelectorAll('.dia-tab').forEach((btn, index) => {
        btn.classList.toggle('activo', index === diaActivo);

        // Marcar si tiene datos
        const estado = estadoPorDia[index];
        const tieneDatos = estado && (
            ['desayuno', 'comida', 'cena'].some(comida =>
                estado[comida].alimentos.some(a => a.alimento) ||
                estado[comida].platillos.some(p => p.nombre)
            )
        );
        btn.classList.toggle('tiene-datos', !!tieneDatos);
    });

    document.getElementById('diaIndicador').textContent =
        'Editando: ' + DIAS_SEMANA[diaActivo];
}

function cambiarDia(nuevoDia) {
    // 1. Guardar el índice del día actual
    diaActivo = nuevoDia;

    // 2. Limpiar y recrear la estructura visual
    crearSelectoresPlatillos('desayuno');
    crearSelectoresPlatillos('comida');
    crearSelectoresPlatillos('cena');
    crearSeccionesComidas();

    // 3. Inicializar el objeto de datos si es nuevo y restaurar valores
    inicializarEstadoDia(diaActivo);
    restaurarSeleccionesDia(diaActivo);
    
    // 4. Actualizar totales visuales
    recalcularTotalesDia(diaActivo);
    actualizarTabsDias();
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
        select.addEventListener('change', () => cambiarPlatillo(comida, i));

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
        input.addEventListener('change', () => cambiarPlatillo(comida, i));

        div.appendChild(select);
        div.appendChild(input);
        container.appendChild(div);
    }
}

// ========== CREAR SECCIONES DE COMIDAS ==========
function crearSeccionesComidas() {
    const container = document.getElementById('comidasContainer');
    if (!container) return;
    container.innerHTML = '';

    const comidas = [
        { nombre: 'DESAYUNO', clase: 'desayuno' },
        { nombre: 'COMIDA',   clase: 'comida' },
        { nombre: 'CENA',     clase: 'cena' }
    ];

    comidas.forEach(comida => {
        const seccion = document.createElement('div');
        seccion.className = `comida-seccion ${comida.clase}`;

        const header = document.createElement('div');
        header.className = 'comida-header';
        header.innerHTML = `
            <h3>${comida.nombre}</h3>
            <span class="grupo-count">${gruposEspecificos.length} grupo(s)</span>
        `;
        seccion.appendChild(header);

        const vista = gruposEspecificos.length <= 4
            ? crearVistaColumnas(comida.clase)
            : crearVistaTabla(comida.clase);
        seccion.appendChild(vista);

        container.appendChild(seccion);
    });
}

function crearVistaColumnas(comida) {
    const grid = document.createElement('div');
    grid.className = 'comida-grid';

    gruposEspecificos.forEach((grupo, colIndex) => {
        const columna = document.createElement('div');
        columna.className = 'grupo-columna';

        const header = document.createElement('div');
        header.className = 'grupo-header';
        header.textContent = grupo;
        columna.appendChild(header);

        const alimentosContainer = document.createElement('div');
        alimentosContainer.className = 'grupo-alimentos';

        const alimentos = alimentosPorGrupo[grupo] || [];

        for (let fila = 0; fila < 6; fila++) {
            const row = document.createElement('div');
            row.className = 'alimento-row';

            const select = document.createElement('select');
            select.id = `${comida}_${colIndex}_${fila}`;

            const optVacia = document.createElement('option');
            optVacia.value = '';
            optVacia.textContent = '-- Seleccionar --';
            select.appendChild(optVacia);

            alimentos.forEach(alimento => {
                const opt = document.createElement('option');
                opt.value = alimento;
                opt.textContent = alimento;
                select.appendChild(opt);
            });

            const input = document.createElement('input');
            input.type = 'number';
            input.min = '0';
            input.max = '10';
            input.value = '1';
            input.className = 'porcion-input';

            select.addEventListener('change', () =>
                cambiarAlimento(comida, colIndex, fila, select.value, input.value));
            input.addEventListener('change', () =>
                cambiarAlimento(comida, colIndex, fila, select.value, input.value));

            row.appendChild(select);
            row.appendChild(input);
            alimentosContainer.appendChild(row);
        }

        columna.appendChild(alimentosContainer);
        grid.appendChild(columna);
    });

    return grid;
}

function crearVistaTabla(comida) {
    const container = document.createElement('div');
    container.className = 'tabla-container';

    const tabla = document.createElement('table');
    tabla.className = 'tabla-grupos';

    // Thead
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    gruposEspecificos.forEach(grupo => {
        const th = document.createElement('th');
        th.textContent = grupo;
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    tabla.appendChild(thead);

    // Tbody
    const tbody = document.createElement('tbody');
    for (let fila = 0; fila < 6; fila++) {
        const tr = document.createElement('tr');
        for (let col = 0; col < gruposEspecificos.length; col++) {
            const td = document.createElement('td');
            const editor = document.createElement('div');
            editor.className = 'cell-editor';

            const select = document.createElement('select');
            select.id = `${comida}_${col}_${fila}`;
            const optVacia = document.createElement('option');
            optVacia.value = '';
            optVacia.textContent = '--';
            select.appendChild(optVacia);

            const grupo = gruposEspecificos[col];
            (alimentosPorGrupo[grupo] || []).forEach(alimento => {
                const opt = document.createElement('option');
                opt.value = alimento;
                opt.textContent = alimento;
                select.appendChild(opt);
            });

            const input = document.createElement('input');
            input.type = 'number';
            input.min = '0';
            input.max = '10';
            input.value = '1';

            select.addEventListener('change', () =>
                cambiarAlimento(comida, col, fila, select.value, input.value));
            input.addEventListener('change', () =>
                cambiarAlimento(comida, col, fila, select.value, input.value));

            editor.appendChild(select);
            editor.appendChild(input);
            td.appendChild(editor);
            tr.appendChild(td);
        }
        tbody.appendChild(tr);
    }
    tabla.appendChild(tbody);
    container.appendChild(tabla);

    return container;
}

// ========== INICIALIZAR ESTADO DEL DÍA ==========
function inicializarEstadoDia(diaIndex) {
    const est = obtenerEstadoDia(diaIndex);
    ['desayuno', 'comida', 'cena'].forEach(comida => {
        // Asegurar que existan entradas para todas las celdas
        for (let fila = 0; fila < 6; fila++) {
            for (let col = 0; col < gruposEspecificos.length; col++) {
                const existe = est[comida].alimentos.find(a => a.row === fila && a.col === col);
                if (!existe) {
                    est[comida].alimentos.push({
                        row: fila, col,
                        grupo: gruposEspecificos[col],
                        alimento: '', porcion: 1
                    });
                }
            }
            // Platillos
            if (!est[comida].platillos.find(p => p.index === fila)) {
                est[comida].platillos.push({ index: fila, nombre: '', porcion: 1 });
            }
        }
    });
}

function restaurarSeleccionesDia(diaIndex) {
    const est = obtenerEstadoDia(diaIndex);

    ['desayuno', 'comida', 'cena'].forEach(comida => {
        // Restaurar Platillos
        est[comida].platillos.forEach(p => {
            const select = document.getElementById(`platillo_${comida}_${p.index}`);
            const input = document.getElementById(`porcion_${comida}_${p.index}`);
            if (select) select.value = p.nombre || '';
            if (input) input.value = p.porcion || 1;
        });

        // Restaurar Alimentos (Equivalentes)
        est[comida].alimentos.forEach(a => {
            const select = document.getElementById(`${comida}_${a.col}_${a.row}`);
            if (select) {
                select.value = a.alimento || '';
                // Buscamos el input que está en el mismo contenedor que el select
                const container = select.closest('.alimento-row') || select.closest('.cell-editor');
                if (container) {
                    const input = container.querySelector('input');
                    if (input) input.value = a.porcion || 1;
                }
            }
        });
    });
}

// ========== NUTRIENTES ==========
function obtenerNutrientesDeAlimento(nombreAlimento) {
    if (!nombreAlimento || !nutrientesAlimentos[nombreAlimento]) return null;
    const nut = nutrientesAlimentos[nombreAlimento];
    return {
        hc:        nut.HC        || 0,
        lipidos:   nut['Lípidos'] || 0,
        proteinas: nut['Proteínas'] || 0
    };
}

function obtenerNutrientesDePlatillo(nombrePlatillo) {
    if (!nombrePlatillo || !platillosPorNombre[nombrePlatillo]) return null;
    return platillosPorNombre[nombrePlatillo].nutrientes;
}

function recalcularTotalesDia(diaIndex) {
    const est = obtenerEstadoDia(diaIndex);
    let hc = 0, lipidos = 0, proteinas = 0;

    ['desayuno', 'comida', 'cena'].forEach(comida => {
        est[comida].alimentos.forEach(a => {
            if (!a.alimento) return;
            const nut = obtenerNutrientesDeAlimento(a.alimento);
            if (!nut) return;
            hc        += nut.hc        * a.porcion;
            lipidos   += nut.lipidos   * a.porcion;
            proteinas += nut.proteinas * a.porcion;
        });
        est[comida].platillos.forEach(p => {
            if (!p.nombre) return;
            const nut = obtenerNutrientesDePlatillo(p.nombre);
            if (!nut) return;
            hc        += (nut.hc        || 0) * p.porcion;
            lipidos   += (nut.lipidos   || 0) * p.porcion;
            proteinas += (nut.proteinas || 0) * p.porcion;
        });
    });

    actualizarTotalesUI(hc, lipidos, proteinas);
}

function actualizarTotalesUI(hc, lipidos, proteinas) {
    document.getElementById('totalHc').textContent       = hc.toFixed(1);
    document.getElementById('totalLipidos').textContent  = lipidos.toFixed(1);
    document.getElementById('totalProteinas').textContent = proteinas.toFixed(1);

    const total = hc + lipidos + proteinas;
    if (total > 0) {
        document.getElementById('pctHc').textContent        = ((hc / total) * 100).toFixed(1) + '%';
        document.getElementById('pctLipidos').textContent   = ((lipidos / total) * 100).toFixed(1) + '%';
        document.getElementById('pctProteinas').textContent = ((proteinas / total) * 100).toFixed(1) + '%';
    } else {
        document.getElementById('pctHc').textContent        = '0.0%';
        document.getElementById('pctLipidos').textContent   = '0.0%';
        document.getElementById('pctProteinas').textContent = '0.0%';
    }
}

// ========== MANEJADORES DE CAMBIO ==========
function cambiarAlimento(comida, col, row, alimento, porcion) {
    const porcionNum = parseInt(porcion) || 1;
    const est = obtenerEstadoDia(diaActivo);

    const existente = est[comida].alimentos.find(a => a.row === row && a.col === col);
    if (existente) {
        existente.alimento = alimento;
        existente.porcion  = porcionNum;
    } else {
        est[comida].alimentos.push({
            row, col,
            grupo: gruposEspecificos[col],
            alimento, porcion: porcionNum
        });
    }

    recalcularTotalesDia(diaActivo);
    actualizarTabsDias();
}

function cambiarPlatillo(comida, index) {
    const select = document.getElementById(`platillo_${comida}_${index}`);
    const input  = document.getElementById(`porcion_${comida}_${index}`);
    if (!select || !input) return;

    const nombre  = select.value;
    const porcion = parseInt(input.value) || 1;

    const est = obtenerEstadoDia(diaActivo);
    const existente = est[comida].platillos.find(p => p.index === index);

    if (existente) {
        existente.nombre  = nombre;
        existente.porcion = porcion;
    } else {
        est[comida].platillos.push({ index, nombre, porcion });
    }

    recalcularTotalesDia(diaActivo);
    actualizarTabsDias();
}

// ========== VER TODOS LOS PLATILLOS ==========
function verTodosPlatillos(comida) {
    const modal  = document.getElementById('modalPlatillos');
    const titulo = document.getElementById('modalTitulo');
    const lista  = document.getElementById('modalLista');
    if (!modal || !titulo || !lista) return;

    titulo.textContent = `Platillos Disponibles - ${comida}`;

    let html = '<ul>';
    platillos.forEach((p, index) => {
        html += `<li>
            <strong>${index + 1}. ${p.nombre}</strong><br>
            <span style="font-size:0.9rem;color:#666;">
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

// ========== EXPORTAR A TXT (separado por días) ==========
async function exportarTXT() {
    const hayDatos = DIAS_SEMANA.some((_, i) => {
        const est = estadoPorDia[i];
        return est && ['desayuno', 'comida', 'cena'].some(comida =>
            est[comida].alimentos.some(a => a.alimento) ||
            est[comida].platillos.some(p => p.nombre)
        );
    });

    if (!hayDatos) {
        alert('No hay datos para exportar.\nPor favor, agregue al menos un alimento en algún día.');
        return;
    }

    try {
        // Construir estadoPorDiaIndexado con nombres de día para el backend
        const estadoConNombreDias = {};
        DIAS_SEMANA.forEach((nombre, index) => {
            estadoConNombreDias[nombre] = estadoPorDia[index] || estadoVacioDia();
        });

        const response = await fetch(`${API_URL}/exportar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                estadoPorDia: estadoConNombreDias,
                diasSemana: DIAS_SEMANA,
                ideales: {
                    hc:        hcObjetivo,
                    lipidos:   lipidosObjetivo,
                    proteinas: proteinasObjetivo
                },
                grupos: gruposEspecificos
            })
        });

        if (response.ok) {
            const blob = await response.blob();
            const url  = window.URL.createObjectURL(blob);
            const a    = document.createElement('a');
            a.href     = url;
            a.download = 'plan_alimenticio_semanal.txt';
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
    sessionStorage.setItem('desdeDonde', 'plan');
    sessionStorage.setItem('destino', 'equivalentes');
    window.location.href = 'equivalentes.html';
}

// ========== UTILIDADES ==========
function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// ========== INICIALIZACIÓN ==========
document.addEventListener('DOMContentLoaded', () => {
    obtenerParametrosURL();

    if (gruposParam.length === 0) {
        alert('No se recibieron grupos de alimentos. Por favor, seleccione grupos en la calculadora principal.');
        window.location.href = 'equivalentes.html';
        return;
    }

    cargarDatos();

    document.getElementById('btnExportar')?.addEventListener('click', exportarTXT);
    document.getElementById('btnRegresar')?.addEventListener('click', volverAtras);

    window.onclick = function (event) {
        const modal = document.getElementById('modalPlatillos');
        if (event.target === modal) modal.style.display = 'none';
    };

    console.log('Plan Alimenticio inicializado');
});