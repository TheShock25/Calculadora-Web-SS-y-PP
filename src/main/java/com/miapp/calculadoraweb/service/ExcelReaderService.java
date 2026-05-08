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
    
    // Método para recargar y verificar qué grupos faltan
    public synchronized void verificarYAñadirGrupos(List<String> gruposRequeridos) {
    if (alimentosPorGrupoCache == null) {
        leerTodosLosAlimentos(); // primera carga
    }
    
    List<String> gruposFaltantes = new ArrayList<>();
    for (String grupo : gruposRequeridos) {
        if (!alimentosPorGrupoCache.containsKey(grupo)) {
            gruposFaltantes.add(grupo);
            System.err.println("✗ GRUPO FALTANTE: " + grupo);
        }
    }
    
    if (!gruposFaltantes.isEmpty()) {
        System.err.println("GRUPOS NO ENCONTRADOS EN EXCEL: " + gruposFaltantes);
        // Intentar carga manual solo de los grupos faltantes
        cargarGruposFaltantesManualmente(gruposFaltantes);
    }
}
    
    private void cargarGruposFaltantesManualmente(List<String> gruposFaltantes) {
        System.out.println("=== INTENTANDO CARGA MANUAL DE GRUPOS FALTANTES ===");
        
        try (InputStream inputStream = new ClassPathResource("data/SMAE_5aed-2.0.xlsx").getInputStream();
             Workbook workbook = new XSSFWorkbook(inputStream)) {
            
            // Listar TODAS las hojas para debug
            System.out.println("HOJAS DISPONIBLES EN EXCEL:");
            for (int i = 0; i < workbook.getNumberOfSheets(); i++) {
                System.out.println("  [" + i + "] '" + workbook.getSheetAt(i).getSheetName() + "'");
            }
            
            int inicio = 3;
            int fin = workbook.getNumberOfSheets() - 3;
            
            for (String grupoFaltante : gruposFaltantes) {
                System.out.println("Buscando grupo faltante: '" + grupoFaltante + "'");
                
                List<String> posiblesNombres = NOMBRE_EXCEL.getOrDefault(grupoFaltante, List.of(grupoFaltante));
                System.out.println("  Nombres a buscar: " + posiblesNombres);
                
                boolean encontrado = false;
                
                for (int i = inicio; i < fin && !encontrado; i++) {
                    Sheet sheet = workbook.getSheetAt(i);
                    String nombreHoja = sheet.getSheetName().trim();
                    
                    for (String posible : posiblesNombres) {
                        if (nombreHoja.equalsIgnoreCase(posible)) {
                            System.out.println("  ✓ ENCONTRADA HOJA: '" + nombreHoja + "' en índice " + i);
                            
                            // Cargar alimentos de esta hoja
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
                            System.out.println("  ✓ Cargados " + alimentos.size() + " alimentos para " + grupoFaltante);
                            encontrado = true;
                            break;
                        }
                    }
                }
                
                if (!encontrado) {
                    System.err.println("  ✗ NO SE ENCONTRÓ HOJA PARA: " + grupoFaltante);
                }
            }
            
        } catch (Exception e) {
            System.err.println("Error en carga manual: " + e.getMessage());
            e.printStackTrace();
        }
    }
    
    // Método principal de carga con logging detallado
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
            
            System.out.println("=== CARGANDO EXCEL ===");
            System.out.println("Total hojas: " + workbook.getNumberOfSheets());
            System.out.println("Procesando hojas " + inicio + " a " + fin);
            
            // Listar todas las hojas
            System.out.println("Hojas en Excel:");
            for (int i = 0; i < workbook.getNumberOfSheets(); i++) {
                System.out.println("  [" + i + "] " + workbook.getSheetAt(i).getSheetName());
            }
            
            for (int i = inicio; i < fin; i++) {
                Sheet sheet = workbook.getSheetAt(i);
                String nombreHoja = sheet.getSheetName().trim();
                
                String grupo = determinarGrupoPorNombreHoja(nombreHoja);
                
                if (grupo == null) {
                    System.out.println("⚠ Hoja no mapeada [" + i + "]: '" + nombreHoja + "'");
                    continue;
                }
                
                System.out.println("✓ Hoja [" + i + "] '" + nombreHoja + "' → Grupo '" + grupo + "'");
                
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
                
                // Si ya existe, combinar
                alimentosPorGrupoCache.merge(grupo, alimentosDelGrupo, (existentes, nuevos) -> {
                    existentes.addAll(nuevos);
                    return existentes;
                });
                
                System.out.println("  Grupo '" + grupo + "': " + alimentosDelGrupo.size() + " alimentos");
            }
            
            todosLosAlimentosCache = alimentos;
            System.out.println("=== EXCEL CARGADO ===");
            System.out.println("Total alimentos: " + alimentos.size());
            System.out.println("Grupos: " + alimentosPorGrupoCache.keySet());
            
        } catch (Exception e) {
            System.err.println("Error cargando Excel: " + e.getMessage());
            e.printStackTrace();
            todosLosAlimentosCache = new ArrayList<>();
        }
        
        return todosLosAlimentosCache;
    }
    
    /**
     * Determina el grupo correspondiente según el nombre de la hoja
     * VERSIÓN ÚNICA Y CORREGIDA
     */
    private String determinarGrupoPorNombreHoja(String nombreHoja) {
        String hojaLower = nombreHoja.toLowerCase().trim();
        
        // Primero: buscar coincidencia exacta
        for (Map.Entry<String, List<String>> entry : NOMBRE_EXCEL.entrySet()) {
            for (String posibleNombre : entry.getValue()) {
                if (hojaLower.equals(posibleNombre.toLowerCase().trim())) {
                    return entry.getKey();
                }
            }
        }
        
        // Segundo: buscar coincidencia por contención (solo si no hay exacta)
        for (Map.Entry<String, List<String>> entry : NOMBRE_EXCEL.entrySet()) {
            for (String posibleNombre : entry.getValue()) {
                String posibleLower = posibleNombre.toLowerCase().trim();
                if (hojaLower.contains(posibleLower)) {
                    System.out.println("  Match por contención: '" + nombreHoja + "' → '" + entry.getKey() + "'");
                    return entry.getKey();
                }
            }
        }
        
        return null;
    }
    
    /**
     * Busca alimentos por grupo
     */
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
    
    /**
     * Busca alimentos por nombre (búsqueda parcial)
     */
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
    
    /**
     * Obtiene todos los grupos disponibles
     */
    public List<String> obtenerGrupos() {
        if (alimentosPorGrupoCache == null) {
            leerTodosLosAlimentos();
        }
        return new ArrayList<>(alimentosPorGrupoCache.keySet());
    }
    
    /**
     * Obtiene alimentos por grupo específico (exacto)
     */
    public List<Alimento> obtenerAlimentosPorGrupoExacto(String grupo) {
        if (alimentosPorGrupoCache == null) {
            leerTodosLosAlimentos();
        }
        return alimentosPorGrupoCache.getOrDefault(grupo, new ArrayList<>());
    }
    
    /**
     * Obtiene el mapa de equivalencias Excel
     */
    public Map<String, List<String>> getEquivalenciasExcel() {
        return NOMBRE_EXCEL;
    }
    
    /**
     * Obtiene el mapa de alimentos por grupo (para Recordatorio)
     */
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
    
    /**
     * Obtiene el mapa de nutrientes por nombre de alimento
     */
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
    
    /**
     * Obtiene valor numérico de una celda
     */
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