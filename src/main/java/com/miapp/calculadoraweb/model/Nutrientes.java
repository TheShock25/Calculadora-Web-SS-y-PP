/* Codigo del servidor para controlar datos, calculos y respuestas de la aplicacion. */
package com.miapp.calculadoraweb.model;

public class Nutrientes {
    private double hc;
    private double lipidos;
    private double proteinas;

    public Nutrientes() {
        this.hc = 0;
        this.lipidos = 0;
        this.proteinas = 0;
    }

    public Nutrientes(double hc, double lipidos, double proteinas) {
        this.hc = hc;
        this.lipidos = lipidos;
        this.proteinas = proteinas;
    }

    public double getHc() { return hc; }
    public void setHc(double hc) { this.hc = hc; }

    public double getLipidos() { return lipidos; }
    public void setLipidos(double lipidos) { this.lipidos = lipidos; }

    public double getProteinas() { return proteinas; }
    public void setProteinas(double proteinas) { this.proteinas = proteinas; }

    public void sumar(Nutrientes otros) {
        this.hc += otros.hc;
        this.lipidos += otros.lipidos;
        this.proteinas += otros.proteinas;
    }

    public void restar(Nutrientes otros) {
        this.hc -= otros.hc;
        this.lipidos -= otros.lipidos;
        this.proteinas -= otros.proteinas;
    }

    public Nutrientes multiplicar(double factor) {
        return new Nutrientes(
            this.hc * factor,
            this.lipidos * factor,
            this.proteinas * factor
        );
    }

    @Override
    public String toString() {
        return String.format("HC: %.1f, Lip: %.1f, Prot: %.1f", hc, lipidos, proteinas);
    }
}
