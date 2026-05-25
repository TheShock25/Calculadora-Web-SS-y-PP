/* Codigo del servidor para controlar datos, calculos y respuestas de la aplicacion. */
package com.miapp.calculadoraweb.service;

public class Resultado {
    public double geb;
    public double eta;
    public double get;
    public double factor;

    public Resultado(double geb, double eta, double get, double factor) {
        this.geb = geb;
        this.eta = eta;
        this.get = get;
        this.factor = factor;
    }
}
