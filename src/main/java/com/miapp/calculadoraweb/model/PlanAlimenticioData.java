/* Codigo del servidor para controlar datos, calculos y respuestas de la aplicacion. */
package com.miapp.calculadoraweb.model;

import java.util.List;
import java.util.Map;

public class PlanAlimenticioData {
    private Map<String, List<String>> alimentosPorGrupo;
    private Map<String, Map<String, Double>> nutrientesAlimentos;
    private List<Platillo> platillos;
    private List<String> gruposEspecificos;
    private List<Integer> porcionesObjetivo;
    private double hcObjetivo;
    private double lipidosObjetivo;
    private double proteinasObjetivo;

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

    public List<String> getGruposEspecificos() { return gruposEspecificos; }
    public void setGruposEspecificos(List<String> gruposEspecificos) { this.gruposEspecificos = gruposEspecificos; }

    public List<Integer> getPorcionesObjetivo() { return porcionesObjetivo; }
    public void setPorcionesObjetivo(List<Integer> porcionesObjetivo) { this.porcionesObjetivo = porcionesObjetivo; }

    public double getHcObjetivo() { return hcObjetivo; }
    public void setHcObjetivo(double hcObjetivo) { this.hcObjetivo = hcObjetivo; }

    public double getLipidosObjetivo() { return lipidosObjetivo; }
    public void setLipidosObjetivo(double lipidosObjetivo) { this.lipidosObjetivo = lipidosObjetivo; }

    public double getProteinasObjetivo() { return proteinasObjetivo; }
    public void setProteinasObjetivo(double proteinasObjetivo) { this.proteinasObjetivo = proteinasObjetivo; }
}
