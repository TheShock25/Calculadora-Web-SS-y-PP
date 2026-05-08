package com.miapp.calculadoraweb.service;

import com.miapp.calculadoraweb.model.Platillo;
import com.miapp.calculadoraweb.model.RecordatorioData;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class RecordatorioService {
    
    @Autowired
    private ExcelReaderService excelReaderService;
    
    @Autowired
    private CSVReaderService csvReaderService;
    
    private RecordatorioData dataCache = null;
    
    // ORDEN ESPECÍFICO DE LOS GRUPOS (basado en tu mapa nombreExcel)
    private static final List<String> ORDEN_GRUPOS = Arrays.asList(
        "Verduras",
        "Frutas",
        "Cereales y tubérculos - Sin Grasa",
        "Cereales y tubérculos - Con Grasa",
        "Leguminosas",
        "Alimentos de origen animal - MRAG",
        "Alimentos de origen animal - BAG",
        "Alimentos de origen animal - MAG",
        "Alimentos de origen animal - AAG",
        "Leche - Descremada",
        "Leche - Semi",
        "Leche - Entera",
        "Leche - Con Azucar",
        "Aceite y grasa - Sin proteina",
        "Aceite y grasa - Con proteina",
        "Azucar - Sin grasa",
        "Azucar - Con grasa"
    );
    
    /**
     * Normaliza un nombre de grupo eliminando guiones y espacios al final
     */
    private String normalizarNombreGrupo(String grupo) {
        if (grupo == null) return "";
        return grupo.replaceAll("\\s*-\\s*$", "").trim();
    }
    
    /**
     * Busca un grupo en el mapa de alimentos, intentando con diferentes variaciones
     */
    private String encontrarGrupoEnMapa(String grupoBuscado, Map<String, List<String>> mapaGrupos) {
        if (mapaGrupos == null) return null;
        
        // Primero intentar con el nombre exacto
        if (mapaGrupos.containsKey(grupoBuscado)) {
            return grupoBuscado;
        }
        
        // Intentar con el nombre normalizado (sin guion al final)
        String normalizado = normalizarNombreGrupo(grupoBuscado);
        if (!normalizado.equals(grupoBuscado) && mapaGrupos.containsKey(normalizado)) {
            return normalizado;
        }
        
        // Intentar búsqueda case-insensitive
        for (String clave : mapaGrupos.keySet()) {
            if (clave.equalsIgnoreCase(grupoBuscado) || 
                clave.equalsIgnoreCase(normalizado)) {
                return clave;
            }
        }
        
        return null;
    }
    
    public synchronized RecordatorioData getRecordatorioData() {
        if (dataCache != null) {
            return dataCache;
        }
        
        dataCache = new RecordatorioData();
        
        // Obtener los datos originales del Excel
        Map<String, List<String>> alimentosPorGrupoOriginal = excelReaderService.getAlimentosPorGrupo();
        Map<String, Map<String, Double>> nutrientesOriginales = excelReaderService.getNutrientesAlimentos();
        
        System.out.println("=== RECORDATORIO: Procesando grupos ===");
        System.out.println("Grupos originales en Excel: " + alimentosPorGrupoOriginal.keySet());
        
        // NUEVO: Crear un mapa normalizado de grupos
        Map<String, List<String>> alimentosPorGrupoNormalizado = new LinkedHashMap<>(); // Usar LinkedHashMap para mantener orden
        
        // NUEVO: Mapa para almacenar la correspondencia entre grupos originales y normalizados
        Map<String, String> grupoOriginalANormalizado = new HashMap<>();
        
        for (Map.Entry<String, List<String>> entry : alimentosPorGrupoOriginal.entrySet()) {
            String grupoOriginal = entry.getKey();
            String grupoNormalizado = normalizarNombreGrupo(grupoOriginal);
            
            alimentosPorGrupoNormalizado.put(grupoNormalizado, entry.getValue());
            grupoOriginalANormalizado.put(grupoOriginal, grupoNormalizado);
            
            System.out.println("  " + grupoOriginal + " → " + grupoNormalizado);
        }
        
        // NUEVO: Crear lista de grupos en el orden correcto
        List<String> gruposOrdenados = new ArrayList<>();
        
        // Primero agregar los grupos que están en el orden predefinido
        for (String grupoOrden : ORDEN_GRUPOS) {
            // Buscar si existe este grupo en el mapa normalizado
            String grupoEncontrado = encontrarGrupoEnMapa(grupoOrden, alimentosPorGrupoNormalizado);
            if (grupoEncontrado != null && !gruposOrdenados.contains(grupoEncontrado)) {
                gruposOrdenados.add(grupoEncontrado);
                System.out.println("  ✓ Agregado (orden): " + grupoEncontrado);
            } else {
                System.out.println("  ✗ No encontrado en orden: " + grupoOrden);
            }
        }
        
        // Luego agregar cualquier grupo restante que no esté en el orden predefinido
        for (String grupo : alimentosPorGrupoNormalizado.keySet()) {
            if (!gruposOrdenados.contains(grupo)) {
                gruposOrdenados.add(grupo);
                System.out.println("  ➕ Agregado (extra): " + grupo);
            }
        }
        
        System.out.println("=== RECORDATORIO: Grupos finales ordenados ===");
        System.out.println("Grupos ordenados: " + gruposOrdenados);
        
        // NUEVO: Reconstruir el mapa de alimentos en el orden correcto
        Map<String, List<String>> alimentosPorGrupoOrdenado = new LinkedHashMap<>();
        for (String grupo : gruposOrdenados) {
            alimentosPorGrupoOrdenado.put(grupo, alimentosPorGrupoNormalizado.get(grupo));
        }
        
        dataCache.setAlimentosPorGrupo(alimentosPorGrupoOrdenado);
        dataCache.setNutrientesAlimentos(nutrientesOriginales);
        dataCache.setGrupos(gruposOrdenados);
        dataCache.setEquivalenciasExcel(excelReaderService.getEquivalenciasExcel());
        dataCache.setPlatillos(csvReaderService.leerPlatillosCSV());
        
        return dataCache;
    }
    
    public Map<String, Object> calcularNutrientes(Map<String, Object> selecciones) {
        Map<String, Object> resultado = new HashMap<>();
        
        double totalHc = 0;
        double totalLipidos = 0;
        double totalProteinas = 0;
        
        // Obtener nutrientes de los alimentos seleccionados
        Map<String, Map<String, Double>> nutrientes = excelReaderService.getNutrientesAlimentos();
        
        // Procesar alimentos de las tablas
        if (selecciones.containsKey("alimentos")) {
            List<Map<String, Object>> alimentos = (List<Map<String, Object>>) selecciones.get("alimentos");
            
            for (Map<String, Object> item : alimentos) {
                String nombre = (String) item.get("nombre");
                int porciones = ((Number) item.get("porciones")).intValue();
                
                if (nutrientes.containsKey(nombre)) {
                    Map<String, Double> nut = nutrientes.get(nombre);
                    totalHc += nut.getOrDefault("HC", 0.0) * porciones;
                    totalLipidos += nut.getOrDefault("Lípidos", 0.0) * porciones;
                    totalProteinas += nut.getOrDefault("Proteínas", 0.0) * porciones;
                }
            }
        }
        
        // Procesar platillos específicos
        if (selecciones.containsKey("platillos")) {
            List<Platillo> platillosSeleccionados = (List<Platillo>) selecciones.get("platillos");
            List<Platillo> todosPlatillos = csvReaderService.leerPlatillosCSV();
            Map<String, Platillo> mapaPlatillos = new HashMap<>();
            
            for (Platillo p : todosPlatillos) {
                mapaPlatillos.put(p.getNombre(), p);
            }
            
            for (Platillo p : platillosSeleccionados) {
                Platillo platillo = mapaPlatillos.get(p.getNombre());
                if (platillo != null) {
                    int porciones = p.getNutrientes() != null ? 
                        (int) p.getNutrientes().getHc() : 1;
                    
                    totalHc += platillo.getNutrientes().getHc() * porciones;
                    totalLipidos += platillo.getNutrientes().getLipidos() * porciones;
                    totalProteinas += platillo.getNutrientes().getProteinas() * porciones;
                }
            }
        }
        
        resultado.put("totalHc", totalHc);
        resultado.put("totalLipidos", totalLipidos);
        resultado.put("totalProteinas", totalProteinas);
        
        return resultado;
    }
}