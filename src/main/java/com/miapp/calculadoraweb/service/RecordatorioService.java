/* Codigo del servidor para controlar datos, calculos y respuestas de la aplicacion. */
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

    private String normalizarNombreGrupo(String grupo) {
        if (grupo == null) return "";
        return grupo.replaceAll("\\s*-\\s*$", "").trim();
    }

    private String encontrarGrupoEnMapa(String grupoBuscado, Map<String, List<String>> mapaGrupos) {
        if (mapaGrupos == null) return null;

        if (mapaGrupos.containsKey(grupoBuscado)) {
            return grupoBuscado;
        }

        String normalizado = normalizarNombreGrupo(grupoBuscado);
        if (!normalizado.equals(grupoBuscado) && mapaGrupos.containsKey(normalizado)) {
            return normalizado;
        }

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

        Map<String, List<String>> alimentosPorGrupoOriginal = excelReaderService.getAlimentosPorGrupo();
        Map<String, Map<String, Double>> nutrientesOriginales = excelReaderService.getNutrientesAlimentos();

        Map<String, List<String>> alimentosPorGrupoNormalizado = new LinkedHashMap<>();

        Map<String, String> grupoOriginalANormalizado = new HashMap<>();

        for (Map.Entry<String, List<String>> entry : alimentosPorGrupoOriginal.entrySet()) {
            String grupoOriginal = entry.getKey();
            String grupoNormalizado = normalizarNombreGrupo(grupoOriginal);

            alimentosPorGrupoNormalizado.put(grupoNormalizado, entry.getValue());
            grupoOriginalANormalizado.put(grupoOriginal, grupoNormalizado);

        }

        List<String> gruposOrdenados = new ArrayList<>();

        for (String grupoOrden : ORDEN_GRUPOS) {
            String grupoEncontrado = encontrarGrupoEnMapa(grupoOrden, alimentosPorGrupoNormalizado);
            if (grupoEncontrado != null && !gruposOrdenados.contains(grupoEncontrado)) {
                gruposOrdenados.add(grupoEncontrado);
            } else {
            }
        }

        for (String grupo : alimentosPorGrupoNormalizado.keySet()) {
            if (!gruposOrdenados.contains(grupo)) {
                gruposOrdenados.add(grupo);
            }
        }

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

        Map<String, Map<String, Double>> nutrientes = excelReaderService.getNutrientesAlimentos();

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
