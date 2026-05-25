/* Codigo del servidor para controlar datos, calculos y respuestas de la aplicacion. */
package com.miapp.calculadoraweb.model;

import java.util.List;

public class SolicitudPlan {
    private List<String> grupos;
    private List<Integer> porciones;
    private double hc;
    private double lipidos;
    private double proteinas;

    public List<String> getGrupos() { return grupos; }
    public void setGrupos(List<String> grupos) { this.grupos = grupos; }

    public List<Integer> getPorciones() { return porciones; }
    public void setPorciones(List<Integer> porciones) { this.porciones = porciones; }

    public double getHc() { return hc; }
    public void setHc(double hc) { this.hc = hc; }

    public double getLipidos() { return lipidos; }
    public void setLipidos(double lipidos) { this.lipidos = lipidos; }

    public double getProteinas() { return proteinas; }
    public void setProteinas(double proteinas) { this.proteinas = proteinas; }
}
