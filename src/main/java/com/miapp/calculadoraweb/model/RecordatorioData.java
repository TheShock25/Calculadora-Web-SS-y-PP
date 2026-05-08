package com.miapp.calculadoraweb.model;

import java.util.List;
import java.util.Map;

public class RecordatorioData {
    private Map<String, List<String>> alimentosPorGrupo;
    private Map<String, Map<String, Double>> nutrientesAlimentos;
    private List<Platillo> platillos;
    private List<String> grupos;
    private Map<String, List<String>> equivalenciasExcel;
    
    // Getters y Setters
    public Map<String, List<String>> getAlimentosPorGrupo() { return alimentosPorGrupo; }
    public void setAlimentosPorGrupo(Map<String, List<String>> alimentosPorGrupo) { 
        this.alimentosPorGrupo = alimentosPorGrupo; 
    }
    
    public Map<String, Map<String, Double>> getNutrientesAlimentos() { return nutrientesAlimentos; }
    public void setNutrientesAlimentos(Map<String, Map<String, Double>> nutrientesAlimentos) {
        this.nutrientesAlimentos = nutrientesAlimentos;
    }
    
    public List<Platillo> getPlatillos() { return platillos; }
    public void setPlatillos(List<Platillo> platillos) { this.platillos = platillos; }
    
    public List<String> getGrupos() { return grupos; }
    public void setGrupos(List<String> grupos) { this.grupos = grupos; }
    
    public Map<String, List<String>> getEquivalenciasExcel() { return equivalenciasExcel; }
    public void setEquivalenciasExcel(Map<String, List<String>> equivalenciasExcel) {
        this.equivalenciasExcel = equivalenciasExcel;
    }
}