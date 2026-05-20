// ========== CONFIGURACIÓN INICIAL ==========
const API_URL = '/api/plan';
const STORAGE_KEY = 'planAlimenticioTemp';

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

// Estado por día
let estadoPorDia = {};
let diaActivo = 0;
let porcionesObjetivoPorGrupo = [];

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

// ========== PERSISTENCIA EN SESION ==========
function guardarEstadoEnSession() {
    const datosAGuardar = {
        estadoPorDia,
        diaActivo,
        gruposEspecificos,
        porcionesObjetivoPorGrupo,
        hcObjetivo,
        lipidosObjetivo,
        proteinasObjetivo
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

// ========== FUNCIÓN PARA ADAPTAR ESTADO GUARDADO A NUEVOS GRUPOS ==========
function adaptarEstadoGuardado(estadoAntiguo, gruposAntiguos, porcionesAntiguas, nuevosGrupos, nuevasPorciones) {
    const nuevoEstado = {};
    
    const grupoANuevoIndice = {};
    nuevosGrupos.forEach((grupo, idx) => {
        grupoANuevoIndice[grupo] = idx;
    });
    
    for (let dia = 0; dia < DIAS_SEMANA.length; dia++) {
        const diaAntiguo = estadoAntiguo[dia];
        if (!diaAntiguo) {
            nuevoEstado[dia] = estadoVacioDia();
            continue;
        }
        
        const nuevoDia = estadoVacioDia();
        
        nuevoDia.desayuno.platillos = [...(diaAntiguo.desayuno?.platillos || [])];
        nuevoDia.comida.platillos = [...(diaAntiguo.comida?.platillos || [])];
        nuevoDia.cena.platillos = [...(diaAntiguo.cena?.platillos || [])];
        
        function adaptarAlimentos(comidaAntigua, nuevaComida) {
            const alimentosAntiguos = comidaAntigua?.alimentos || [];
            const totalPorGrupo = {};
            alimentosAntiguos.forEach(al => {
                if (!al.alimento || !al.grupo) return;
                const grupo = al.grupo;
                if (!totalPorGrupo[grupo]) totalPorGrupo[grupo] = 0;
                totalPorGrupo[grupo] += (al.porcion || 0);
            });
            
            for (const [grupo, totalAntiguo] of Object.entries(totalPorGrupo)) {
                const nuevoIndice = grupoANuevoIndice[grupo];
                if (nuevoIndice === undefined) continue;
                
                const nuevoObjetivo = nuevasPorciones[nuevoIndice] || 0;
                let totalAjustado = totalAntiguo;
                if (totalAntiguo > nuevoObjetivo) {
                    totalAjustado = nuevoObjetivo;
                }
                if (totalAjustado <= 0) continue;
                
                const filaIndex = 0;
                const existente = nuevaComida.alimentos.find(a => a.col === nuevoIndice && a.row === filaIndex);
                if (existente) {
                    existente.porcion = totalAjustado;
                    existente.alimento = alimentosAntiguos.find(al => al.grupo === grupo)?.alimento || '';
                } else {
                    nuevaComida.alimentos.push({
                        row: filaIndex,
                        col: nuevoIndice,
                        grupo: grupo,
                        alimento: alimentosAntiguos.find(al => al.grupo === grupo)?.alimento || '',
                        porcion: totalAjustado
                    });
                }
            }
        }
        
        adaptarAlimentos(diaAntiguo.desayuno, nuevoDia.desayuno);
        adaptarAlimentos(diaAntiguo.comida, nuevoDia.comida);
        adaptarAlimentos(diaAntiguo.cena, nuevoDia.cena);
        
        nuevoEstado[dia] = nuevoDia;
    }
    
    for (let dia = 0; dia < DIAS_SEMANA.length; dia++) {
        if (!nuevoEstado[dia]) nuevoEstado[dia] = estadoVacioDia();
    }
    
    return nuevoEstado;
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

// ========== MOSTRAR VALORES OBJETIVO (en kcal) ==========
function mostrarValoresObjetivo() {
    const hcKcal        = hcObjetivo * 4;
    const lipidosKcal   = lipidosObjetivo * 9;
    const proteinasKcal = proteinasObjetivo * 4;

    document.getElementById('hcObjetivoKcal').textContent        = hcKcal.toFixed(1);
    document.getElementById('lipidosObjetivoKcal').textContent   = lipidosKcal.toFixed(1);
    document.getElementById('proteinasObjetivoKcal').textContent = proteinasKcal.toFixed(1);

    document.getElementById('objetivosPanel').style.display = 'flex';
}

// ========== ACTUALIZAR TARJETAS CON VALORES ACTUALES ==========
function actualizarTarjetasNutrientes(hcGramos, lipidosGramos, proteinasGramos) {
    // Gramos
    document.getElementById('hcActualGramos').textContent = hcGramos.toFixed(1);
    document.getElementById('lipidosActualGramos').textContent = lipidosGramos.toFixed(1);
    document.getElementById('proteinasActualGramos').textContent = proteinasGramos.toFixed(1);
    
    // Kcal actuales
    const hcKcalActual = hcGramos * 4;
    const lipidosKcalActual = lipidosGramos * 9;
    const proteinasKcalActual = proteinasGramos * 4;
    
    document.getElementById('hcActualKcal').textContent = hcKcalActual.toFixed(1);
    document.getElementById('lipidosActualKcal').textContent = lipidosKcalActual.toFixed(1);
    document.getElementById('proteinasActualKcal').textContent = proteinasKcalActual.toFixed(1);
    
    // Porcentajes respecto a objetivo en kcal
    const hcObjKcal = hcObjetivo * 4;
    const lipObjKcal = lipidosObjetivo * 9;
    const protObjKcal = proteinasObjetivo * 4;
    
    const pctHc = hcObjKcal > 0 ? (hcKcalActual / hcObjKcal) * 100 : 0;
    const pctLip = lipObjKcal > 0 ? (lipidosKcalActual / lipObjKcal) * 100 : 0;
    const pctProt = protObjKcal > 0 ? (proteinasKcalActual / protObjKcal) * 100 : 0;
    
    document.getElementById('hcPorcentaje').textContent = pctHc.toFixed(1);
    document.getElementById('lipidosPorcentaje').textContent = pctLip.toFixed(1);
    document.getElementById('proteinasPorcentaje').textContent = pctProt.toFixed(1);
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

            porcionesObjetivoPorGrupo = porcionesParam.slice();

            const sessionData = cargarEstadoDesdeSession();
            let usarSession = false;
            let estadoAdaptado = null;
            
            if (sessionData && sessionData.gruposEspecificos) {
                const mismosGrupos = JSON.stringify(sessionData.gruposEspecificos) === JSON.stringify(gruposEspecificos);
                const mismasPorciones = JSON.stringify(sessionData.porcionesObjetivoPorGrupo) === JSON.stringify(porcionesObjetivoPorGrupo);
                const mismosMacros = sessionData.hcObjetivo === hcObjetivo && 
                                     sessionData.lipidosObjetivo === lipidosObjetivo && 
                                     sessionData.proteinasObjetivo === proteinasObjetivo;
                
                if (mismosGrupos && mismasPorciones && mismosMacros) {
                    if (confirm('¿Deseas continuar con el plan que estabas editando?')) {
                        usarSession = true;
                        estadoAdaptado = sessionData.estadoPorDia;
                        diaActivo = sessionData.diaActivo;
                    } else {
                        sessionStorage.removeItem(STORAGE_KEY);
                    }
                } else {
                    const mensaje = `Los grupos o porciones han cambiado. ¿Deseas conservar las selecciones previas? Se ajustarán automáticamente a los nuevos valores.`;
                    if (confirm(mensaje)) {
                        estadoAdaptado = adaptarEstadoGuardado(
                            sessionData.estadoPorDia,
                            sessionData.gruposEspecificos,
                            sessionData.porcionesObjetivoPorGrupo,
                            gruposEspecificos,
                            porcionesObjetivoPorGrupo
                        );
                        usarSession = true;
                        if (sessionData.diaActivo >= 0 && sessionData.diaActivo < DIAS_SEMANA.length) {
                            diaActivo = sessionData.diaActivo;
                        } else {
                            diaActivo = 0;
                        }
                        sessionStorage.removeItem(STORAGE_KEY);
                    } else {
                        sessionStorage.removeItem(STORAGE_KEY);
                    }
                }
            }
            
            if (usarSession && estadoAdaptado) {
                estadoPorDia = estadoAdaptado;
                DIAS_SEMANA.forEach((_, idx) => {
                    if (!estadoPorDia[idx]) estadoPorDia[idx] = estadoVacioDia();
                });
            } else {
                estadoPorDia = {};
                diaActivo = 0;
            }
            
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
    cambiarDia(0);
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

        const estado = estadoPorDia[index];
        const tieneDatos = estado && (
            ['desayuno', 'comida', 'cena'].some(comida =>
                estado[comida].alimentos.some(a => a.alimento) ||
                estado[comida].platillos.some(p => p.nombre)
            )
        );
        btn.classList.toggle('tiene-datos', !!tieneDatos);
    });

    document.getElementById('diaIndicador').textContent = 'Editando: ' + DIAS_SEMANA[diaActivo];
}

function cambiarDia(nuevoDia) {
    diaActivo = nuevoDia;

    crearSelectoresPlatillos('desayuno');
    crearSelectoresPlatillos('comida');
    crearSelectoresPlatillos('cena');
    crearSeccionesComidas();

    restaurarSeleccionesDia(diaActivo);

    actualizarTodosLosGruposGlobales();

    recalcularTotalesDia(diaActivo);
    actualizarTabsDias();
    guardarEstadoEnSession();
}

// ========== SELECTORES DE PLATILLOS (4 fijos) ==========
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

// ========== CREAR SECCIONES DE COMIDAS (vista dinámica) ==========
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

// ---------- VISTA COLUMNAS ----------
function crearVistaColumnas(comida) {
    const grid = document.createElement('div');
    grid.className = 'comida-grid';

    gruposEspecificos.forEach((grupo, colIndex) => {
        const objetivo = porcionesObjetivoPorGrupo[colIndex] || 0;
        const maxFilas = Math.min(objetivo, 6);

        const columna = document.createElement('div');
        columna.className = 'grupo-columna';
        columna.dataset.columna = colIndex;
        columna.dataset.objetivo = objetivo;

        const header = document.createElement('div');
        header.className = 'grupo-header';
        header.innerHTML = `${grupo} <span class="contador-porciones" id="contador_${comida}_${colIndex}">0 / ${objetivo}</span>`;
        columna.appendChild(header);

        const alimentosContainer = document.createElement('div');
        alimentosContainer.className = 'grupo-alimentos';
        alimentosContainer.id = `alimentos_${comida}_${colIndex}`;

        for (let fila = 0; fila < maxFilas; fila++) {
            const row = document.createElement('div');
            row.className = 'alimento-row';
            row.dataset.fila = fila;

            const select = document.createElement('select');
            select.id = `${comida}_${colIndex}_${fila}`;

            const optVacia = document.createElement('option');
            optVacia.value = '';
            optVacia.textContent = '-- Seleccionar --';
            select.appendChild(optVacia);

            const alimentos = alimentosPorGrupo[grupo] || [];
            alimentos.forEach(alimento => {
                const opt = document.createElement('option');
                opt.value = alimento;
                opt.textContent = alimento;
                select.appendChild(opt);
            });

            const input = document.createElement('input');
            input.type = 'number';
            input.min = '0';
            input.max = objetivo;
            input.value = '0';
            input.className = 'porcion-input';
            input.step = 1;

            const actualizar = () => {
                const porcionActual = parseFloat(input.value) || 0;
                cambiarAlimento(comida, colIndex, fila, select.value, porcionActual);
            };
            select.addEventListener('change', actualizar);
            input.addEventListener('change', actualizar);

            row.appendChild(select);
            row.appendChild(input);
            alimentosContainer.appendChild(row);
        }

        columna.appendChild(alimentosContainer);
        grid.appendChild(columna);
    });

    return grid;
}

// ---------- VISTA TABLA (más de 4 grupos) ----------
function crearVistaTabla(comida) {
    const container = document.createElement('div');
    container.className = 'tabla-container';
    const tabla = document.createElement('table');
    tabla.className = 'tabla-grupos';

    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    gruposEspecificos.forEach((grupo, colIndex) => {
        const th = document.createElement('th');
        const objetivo = porcionesObjetivoPorGrupo[colIndex] || 0;
        th.innerHTML = `${grupo}<br><span class="contador-porciones" id="contador_${comida}_${colIndex}">0 / ${objetivo}</span>`;
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    tabla.appendChild(thead);

    const tbody = document.createElement('tbody');
    let maxFilas = 0;
    for (let col = 0; col < gruposEspecificos.length; col++) {
        const obj = porcionesObjetivoPorGrupo[col] || 0;
        maxFilas = Math.max(maxFilas, Math.min(obj, 6));
    }
    if (maxFilas === 0) maxFilas = 1;

    for (let fila = 0; fila < maxFilas; fila++) {
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
            input.max = porcionesObjetivoPorGrupo[col] || 0;
            input.value = '0';
            input.className = 'porcion-input';

            const actualizar = () => {
                const porcionActual = parseFloat(input.value) || 0;
                cambiarAlimento(comida, col, fila, select.value, porcionActual);
            };
            select.addEventListener('change', actualizar);
            input.addEventListener('change', actualizar);

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

// ========== FUNCIONES GLOBALES POR GRUPO (ahora soporta vista tabla) ==========
function actualizarGrupoGlobal(colIndex) {
    const objetivo = porcionesObjetivoPorGrupo[colIndex] || 0;
    const estado = obtenerEstadoDia(diaActivo);

    // Sumar total global de este grupo en el día actual
    let totalGlobal = 0;
    ['desayuno', 'comida', 'cena'].forEach(comida => {
        estado[comida].alimentos.forEach(a => {
            if (a.col === colIndex && a.alimento) {
                totalGlobal += (a.porcion || 0);
            }
        });
    });

    // Actualizar contadores visuales en las tres comidas
    ['desayuno', 'comida', 'cena'].forEach(comida => {
        const contadorSpan = document.getElementById(`contador_${comida}_${colIndex}`);
        if (contadorSpan) contadorSpan.textContent = `${totalGlobal} / ${objetivo}`;
    });

    const esVistaTabla = gruposEspecificos.length > 4;

    // Para cada comida, actualizar habilitación de filas
    ['desayuno', 'comida', 'cena'].forEach(comida => {
        if (esVistaTabla) {
            // Vista tabla: buscar la tabla correspondiente
            const tablaContainer = document.querySelector(`.comida-seccion.${comida} .tabla-container`);
            if (!tablaContainer) return;
            const tabla = tablaContainer.querySelector('table.tabla-grupos');
            if (!tabla) return;
            const tbody = tabla.querySelector('tbody');
            if (!tbody) return;
            const rows = tbody.querySelectorAll('tr');
            
            let sumaParcial = 0;
            rows.forEach((row, rowIndex) => {
                const celda = row.cells[colIndex];
                if (!celda) return;
                const editor = celda.querySelector('.cell-editor');
                if (!editor) return;
                const select = editor.querySelector('select');
                const input = editor.querySelector('input');
                if (!select || !input) return;
                
                const valorActual = parseFloat(input.value) || 0;
                const tieneSeleccion = select.value && valorActual > 0;
                
                if (tieneSeleccion) sumaParcial += valorActual;
                
                let deshabilitar = false;
                if (totalGlobal >= objetivo && !tieneSeleccion) {
                    deshabilitar = true;
                } else if (!tieneSeleccion && sumaParcial > totalGlobal) {
                    deshabilitar = true;
                }
                
                select.disabled = deshabilitar;
                input.disabled = deshabilitar;
                
                if (!deshabilitar) {
                    const restante = objetivo - totalGlobal + (tieneSeleccion ? valorActual : 0);
                    const maxPermitido = Math.max(0, restante);
                    input.max = maxPermitido;
                    if (valorActual > maxPermitido && maxPermitido >= 0) {
                        input.value = maxPermitido;
                        const event = new Event('change', { bubbles: true });
                        input.dispatchEvent(event);
                    }
                }
            });
        } else {
            // Vista columnas: usar contenedor específico
            const container = document.getElementById(`alimentos_${comida}_${colIndex}`);
            if (!container) return;
            const rows = container.querySelectorAll('.alimento-row');
            let sumaParcial = 0;
            rows.forEach((row, idx) => {
                const select = row.querySelector('select');
                const input = row.querySelector('input');
                if (!select || !input) return;
                
                const valorActual = parseFloat(input.value) || 0;
                const tieneSeleccion = select.value && valorActual > 0;
                
                if (tieneSeleccion) sumaParcial += valorActual;
                
                let deshabilitar = false;
                if (totalGlobal >= objetivo && !tieneSeleccion) {
                    deshabilitar = true;
                } else if (!tieneSeleccion && sumaParcial > totalGlobal) {
                    deshabilitar = true;
                }
                
                select.disabled = deshabilitar;
                input.disabled = deshabilitar;
                
                if (!deshabilitar) {
                    const restante = objetivo - totalGlobal + (tieneSeleccion ? valorActual : 0);
                    const maxPermitido = Math.max(0, restante);
                    input.max = maxPermitido;
                    if (valorActual > maxPermitido && maxPermitido >= 0) {
                        input.value = maxPermitido;
                        const event = new Event('change', { bubbles: true });
                        input.dispatchEvent(event);
                    }
                }
            });
        }
    });
}

function actualizarTodosLosGruposGlobales() {
    for (let col = 0; col < gruposEspecificos.length; col++) {
        actualizarGrupoGlobal(col);
    }
}

// ========== RESTAURAR SELECCIONES DEL DÍA ==========
function restaurarSeleccionesDia(diaIndex) {
    const est = obtenerEstadoDia(diaIndex);

    ['desayuno', 'comida', 'cena'].forEach(comida => {
        est[comida].platillos.forEach(p => {
            const select = document.getElementById(`platillo_${comida}_${p.index}`);
            const input = document.getElementById(`porcion_${comida}_${p.index}`);
            if (select) select.value = p.nombre || '';
            if (input) input.value = p.porcion || 1;
        });
    });

    for (const comida of ['desayuno', 'comida', 'cena']) {
        for (const a of est[comida].alimentos) {
            if (!a.alimento) continue;
            const select = document.getElementById(`${comida}_${a.col}_${a.row}`);
            if (select) {
                select.value = a.alimento;
                const container = select.closest('.alimento-row') || select.closest('.cell-editor');
                if (container) {
                    const input = container.querySelector('input');
                    if (input) input.value = a.porcion || 1;
                }
            }
        }
    }
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
    let hcGramos = 0, lipidosGramos = 0, proteinasGramos = 0;

    ['desayuno', 'comida', 'cena'].forEach(comida => {
        est[comida].alimentos.forEach(a => {
            if (!a.alimento) return;
            const nut = obtenerNutrientesDeAlimento(a.alimento);
            if (!nut) return;
            hcGramos        += nut.hc        * a.porcion;
            lipidosGramos   += nut.lipidos   * a.porcion;
            proteinasGramos += nut.proteinas * a.porcion;
        });
        est[comida].platillos.forEach(p => {
            if (!p.nombre) return;
            const nut = obtenerNutrientesDePlatillo(p.nombre);
            if (!nut) return;
            hcGramos        += (nut.hc        || 0) * p.porcion;
            lipidosGramos   += (nut.lipidos   || 0) * p.porcion;
            proteinasGramos += (nut.proteinas || 0) * p.porcion;
        });
    });

    actualizarTarjetasNutrientes(hcGramos, lipidosGramos, proteinasGramos);
}

// ========== MANEJADORES DE CAMBIO ==========
function cambiarAlimento(comida, col, row, alimento, porcion) {
    const est = obtenerEstadoDia(diaActivo);
    const objetivo = porcionesObjetivoPorGrupo[col] || 0;

    let sumaSinEsta = 0;
    est[comida].alimentos.forEach(a => {
        if (a.col === col && a.alimento && !(a.row === row && a.col === col)) {
            sumaSinEsta += (a.porcion || 0);
        }
    });

    let porcionNum = parseInt(porcion) || 0;
    const restante = objetivo - sumaSinEsta;
    if (porcionNum > restante && restante >= 0) {
        porcionNum = restante;
        const input = document.getElementById(`${comida}_${col}_${row}`)?.closest('.alimento-row')?.querySelector('input');
        if (input) input.value = porcionNum;
    }

    const existente = est[comida].alimentos.find(a => a.row === row && a.col === col);
    if (existente) {
        existente.alimento = alimento;
        existente.porcion  = porcionNum;
        if (!alimento) existente.porcion = 0;
    } else {
        if (alimento && porcionNum > 0) {
            est[comida].alimentos.push({
                row, col,
                grupo: gruposEspecificos[col],
                alimento, porcion: porcionNum
            });
        }
    }

    if (!alimento && existente) {
        existente.alimento = '';
        existente.porcion = 0;
    }

    actualizarGrupoGlobal(col);
    recalcularTotalesDia(diaActivo);
    actualizarTabsDias();
    guardarEstadoEnSession();
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
    guardarEstadoEnSession();
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

// ========== VALIDACIÓN ANTES DE EXPORTAR (GLOBAL POR DÍA) ==========
function validarPorcionesCompletas() {
    for (let dia = 0; dia < DIAS_SEMANA.length; dia++) {
        const estado = estadoPorDia[dia];
        if (!estado) continue;
        for (let col = 0; col < gruposEspecificos.length; col++) {
            const objetivo = porcionesObjetivoPorGrupo[col] || 0;
            if (objetivo === 0) continue;
            let sumaGlobal = 0;
            ['desayuno', 'comida', 'cena'].forEach(comida => {
                estado[comida].alimentos.forEach(a => {
                    if (a.col === col && a.alimento) sumaGlobal += (a.porcion || 0);
                });
            });
            if (sumaGlobal !== objetivo) {
                alert(`Faltan porciones en ${DIAS_SEMANA[dia]} para el grupo "${gruposEspecificos[col]}". Deben ser ${objetivo} porciones en total (sumando desayuno+comida+cena), actualmente ${sumaGlobal}.`);
                return false;
            }
        }
    }
    return true;
}

// ========== EXPORTAR A TXT ==========
async function exportarTXT() {
    if (!validarPorcionesCompletas()) return;

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
    guardarEstadoEnSession();
    sessionStorage.setItem('desdeDonde', 'plan');
    sessionStorage.setItem('destino', 'equivalentes');
    window.location.href = 'equivalentes.html';
}

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