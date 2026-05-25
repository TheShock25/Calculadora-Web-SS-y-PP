/* Codigo del servidor para controlar datos, calculos y respuestas de la aplicacion. */
package com.miapp.calculadoraweb.service;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellType;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import com.miapp.calculadoraweb.model.Alimento;

@Service
public class ExcelReaderService {

    private static final Map<String, List<String>> NOMBRE_EXCEL = new HashMap<>();
    static {
        NOMBRE_EXCEL.put("Verduras", List.of("Verduras"));
        NOMBRE_EXCEL.put("Frutas", List.of("Frutas"));
        NOMBRE_EXCEL.put("Cereales y tubérculos - Sin Grasa", List.of("Cereales SG"));
        NOMBRE_EXCEL.put("Cereales y tubérculos - Con Grasa", List.of("Cereales CG"));
        NOMBRE_EXCEL.put("Leguminosas", List.of("Leguminosas"));
        NOMBRE_EXCEL.put("Alimentos de origen animal - MRAG", List.of("AOA de muy bajo aporte de grasa", "AOA Muy Bajo"));
        NOMBRE_EXCEL.put("Alimentos de origen animal - BAG", List.of("AOA de bajo aporte de grasa", "AOA Bajo"));
        NOMBRE_EXCEL.put("Alimentos de origen animal - MAG", List.of("AOA de Moderado aporte de grasa", "AOA Moderado"));
        NOMBRE_EXCEL.put("Alimentos de origen animal - AAG", List.of("AOA de Alto aporte de grasa", "AOA Alto"));
        NOMBRE_EXCEL.put("Leche - Descremada", List.of("Leche Descremada"));
        NOMBRE_EXCEL.put("Leche - Semi", List.of("Leche Semi"));
        NOMBRE_EXCEL.put("Leche - Entera", List.of("Leche Entera"));
        NOMBRE_EXCEL.put("Leche - Con Azucar", List.of("Leche Con Azucar"));
        NOMBRE_EXCEL.put("Aceite y grasa - Sin proteina", List.of("Grasas Sin Proteina"));
        NOMBRE_EXCEL.put("Aceite y grasa - Con proteina", List.of("Grasas Con Proteina"));
        NOMBRE_EXCEL.put("Azucar - Sin grasa", List.of("Azucares sin grasas", "Azucares"));
        NOMBRE_EXCEL.put("Azucar - Con grasa", List.of("Azucares con grasas", "Azucares Con Grasa"));
    }

    private List<Alimento> todosLosAlimentosCache = null;
    private Map<String, List<Alimento>> alimentosPorGrupoCache = null;

    public synchronized void verificarYAñadirGrupos(List<String> gruposRequeridos) {
    if (alimentosPorGrupoCache == null) {
        leerTodosLosAlimentos();
    }

    List<String> gruposFaltantes = new ArrayList<>();
    for (String grupo : gruposRequeridos) {
        if (!alimentosPorGrupoCache.containsKey(grupo)) {
            gruposFaltantes.add(grupo);
        }
    }

    if (!gruposFaltantes.isEmpty()) {
        cargarGruposFaltantesManualmente(gruposFaltantes);
    }
}

    private void cargarGruposFaltantesManualmente(List<String> gruposFaltantes) {

        try (InputStream inputStream = new ClassPathResource("data/SMAE_5aed-2.0.xlsx").getInputStream();
             Workbook workbook = new XSSFWorkbook(inputStream)) {

            for (int i = 0; i < workbook.getNumberOfSheets(); i++) {
            }

            int inicio = 3;
            int fin = workbook.getNumberOfSheets() - 3;

            for (String grupoFaltante : gruposFaltantes) {

                List<String> posiblesNombres = NOMBRE_EXCEL.getOrDefault(grupoFaltante, List.of(grupoFaltante));

                boolean encontrado = false;

                for (int i = inicio; i < fin && !encontrado; i++) {
                    Sheet sheet = workbook.getSheetAt(i);
                    String nombreHoja = sheet.getSheetName().trim();

                    for (String posible : posiblesNombres) {
                        if (nombreHoja.equalsIgnoreCase(posible)) {

                            List<Alimento> alimentos = new ArrayList<>();
                            for (int rowNum = 1; rowNum <= sheet.getLastRowNum(); rowNum++) {
                                Row row = sheet.getRow(rowNum);
                                if (row != null) {
                                    Cell celdaAlimento = row.getCell(1);
                                    if (celdaAlimento != null && celdaAlimento.getCellType() == CellType.STRING) {
                                        String nombreAlimento = celdaAlimento.getStringCellValue().trim();
                                        if (!nombreAlimento.isEmpty()) {
                                            Alimento alimento = new Alimento();
                                            alimento.setNombre(nombreAlimento);
                                            alimento.setGrupo(grupoFaltante);
                                            alimento.setCalorias(getNumericCellValue(row.getCell(2)));
                                            alimento.setProteinas(getNumericCellValue(row.getCell(11)));
                                            alimento.setGrasas(getNumericCellValue(row.getCell(10)));
                                            alimento.setCarbohidratos(getNumericCellValue(row.getCell(9)));
                                            alimento.setUnidad("g");

                                            alimentos.add(alimento);
                                            todosLosAlimentosCache.add(alimento);
                                        }
                                    }
                                }
                            }

                            alimentosPorGrupoCache.put(grupoFaltante, alimentos);
                            encontrado = true;
                            break;
                        }
                    }
                }

                if (!encontrado) {
                }
            }

        } catch (Exception e) {
        }
    }

    public synchronized List<Alimento> leerTodosLosAlimentos() {
        if (todosLosAlimentosCache != null) {
            return todosLosAlimentosCache;
        }

        List<Alimento> alimentos = new ArrayList<>();
        alimentosPorGrupoCache = new HashMap<>();

        try (InputStream inputStream = new ClassPathResource("data/SMAE_5aed-2.0.xlsx").getInputStream();
             Workbook workbook = new XSSFWorkbook(inputStream)) {

            int inicio = 3;
            int fin = workbook.getNumberOfSheets() - 3;
            int id = 1;

            for (int i = 0; i < workbook.getNumberOfSheets(); i++) {
            }

            for (int i = inicio; i < fin; i++) {
                Sheet sheet = workbook.getSheetAt(i);
                String nombreHoja = sheet.getSheetName().trim();

                String grupo = determinarGrupoPorNombreHoja(nombreHoja);

                if (grupo == null) {
                    continue;
                }

                List<Alimento> alimentosDelGrupo = new ArrayList<>();

                for (int rowNum = 1; rowNum <= sheet.getLastRowNum(); rowNum++) {
                    Row row = sheet.getRow(rowNum);
                    if (row != null) {
                        Cell celdaAlimento = row.getCell(1);
                        if (celdaAlimento != null && celdaAlimento.getCellType() == CellType.STRING) {
                            String nombreAlimento = celdaAlimento.getStringCellValue().trim();
                            if (!nombreAlimento.isEmpty()) {
                                Alimento alimento = new Alimento();
                                alimento.setId(id++);
                                alimento.setNombre(nombreAlimento);
                                alimento.setGrupo(grupo);
                                alimento.setCalorias(getNumericCellValue(row.getCell(2)));
                                alimento.setProteinas(getNumericCellValue(row.getCell(11)));
                                alimento.setGrasas(getNumericCellValue(row.getCell(10)));
                                alimento.setCarbohidratos(getNumericCellValue(row.getCell(9)));
                                alimento.setUnidad("g");

                                alimentos.add(alimento);
                                alimentosDelGrupo.add(alimento);
                            }
                        }
                    }
                }

                alimentosPorGrupoCache.merge(grupo, alimentosDelGrupo, (existentes, nuevos) -> {
                    existentes.addAll(nuevos);
                    return existentes;
                });

            }

            todosLosAlimentosCache = alimentos;

        } catch (Exception e) {
            todosLosAlimentosCache = new ArrayList<>();
        }

        return todosLosAlimentosCache;
    }

    private String determinarGrupoPorNombreHoja(String nombreHoja) {
        String hojaLower = nombreHoja.toLowerCase().trim();

        for (Map.Entry<String, List<String>> entry : NOMBRE_EXCEL.entrySet()) {
            for (String posibleNombre : entry.getValue()) {
                if (hojaLower.equals(posibleNombre.toLowerCase().trim())) {
                    return entry.getKey();
                }
            }
        }

        for (Map.Entry<String, List<String>> entry : NOMBRE_EXCEL.entrySet()) {
            for (String posibleNombre : entry.getValue()) {
                String posibleLower = posibleNombre.toLowerCase().trim();
                if (hojaLower.contains(posibleLower)) {
                    return entry.getKey();
                }
            }
        }

        return null;
    }

    public List<Alimento> buscarPorGrupo(String grupo) {
        if (alimentosPorGrupoCache == null) {
            leerTodosLosAlimentos();
        }

        List<Alimento> resultado = new ArrayList<>();
        String grupoLower = grupo.toLowerCase();

        for (Map.Entry<String, List<Alimento>> entry : alimentosPorGrupoCache.entrySet()) {
            if (entry.getKey().toLowerCase().contains(grupoLower)) {
                resultado.addAll(entry.getValue());
            }
        }

        return resultado;
    }

    public List<Alimento> buscarPorNombre(String termino) {
        if (todosLosAlimentosCache == null) {
            leerTodosLosAlimentos();
        }

        List<Alimento> resultado = new ArrayList<>();
        String terminoLower = termino.toLowerCase();

        for (Alimento a : todosLosAlimentosCache) {
            if (a.getNombre().toLowerCase().contains(terminoLower)) {
                resultado.add(a);
            }
        }

        return resultado;
    }

    public List<String> obtenerGrupos() {
        if (alimentosPorGrupoCache == null) {
            leerTodosLosAlimentos();
        }
        return new ArrayList<>(alimentosPorGrupoCache.keySet());
    }

    public List<Alimento> obtenerAlimentosPorGrupoExacto(String grupo) {
        if (alimentosPorGrupoCache == null) {
            leerTodosLosAlimentos();
        }
        return alimentosPorGrupoCache.getOrDefault(grupo, new ArrayList<>());
    }

    public Map<String, List<String>> getEquivalenciasExcel() {
        return NOMBRE_EXCEL;
    }

    public Map<String, List<String>> getAlimentosPorGrupo() {
        if (alimentosPorGrupoCache == null) {
            leerTodosLosAlimentos();
        }

        Map<String, List<String>> resultado = new HashMap<>();
        for (Map.Entry<String, List<Alimento>> entry : alimentosPorGrupoCache.entrySet()) {
            List<String> nombres = new ArrayList<>();
            for (Alimento a : entry.getValue()) {
                nombres.add(a.getNombre());
            }
            resultado.put(entry.getKey(), nombres);
        }
        return resultado;
    }

    public Map<String, Map<String, Double>> getNutrientesAlimentos() {
        if (todosLosAlimentosCache == null) {
            leerTodosLosAlimentos();
        }

        Map<String, Map<String, Double>> resultado = new HashMap<>();
        for (Alimento a : todosLosAlimentosCache) {
            Map<String, Double> nutrientes = new HashMap<>();
            nutrientes.put("HC", a.getCarbohidratos());
            nutrientes.put("Lípidos", a.getGrasas());
            nutrientes.put("Proteínas", a.getProteinas());
            nutrientes.put("Calorías", a.getCalorias());
            resultado.put(a.getNombre(), nutrientes);
        }
        return resultado;
    }

    private double getNumericCellValue(Cell cell) {
        if (cell == null) return 0;
        if (cell.getCellType() == CellType.NUMERIC) {
            return cell.getNumericCellValue();
        }
        if (cell.getCellType() == CellType.STRING) {
            try {
                return Double.parseDouble(cell.getStringCellValue());
            } catch (NumberFormatException e) {
                return 0;
            }
        }
        return 0;
    }
}
