/* Codigo del servidor para controlar datos, calculos y respuestas de la aplicacion. */
package com.miapp.calculadoraweb.model;

public class Platillo {
    private String nombre;
    private Nutrientes nutrientes;

    public Platillo() {
        this.nutrientes = new Nutrientes();
    }

    public Platillo(String nombre, double proteinas, double lipidos, double hc) {
        this.nombre = nombre;
        this.nutrientes = new Nutrientes(hc, lipidos, proteinas);
    }

    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }

    public Nutrientes getNutrientes() { return nutrientes; }
    public void setNutrientes(Nutrientes nutrientes) { this.nutrientes = nutrientes; }
}
