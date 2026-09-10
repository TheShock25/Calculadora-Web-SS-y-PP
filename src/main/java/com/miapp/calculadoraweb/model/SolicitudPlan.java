/* Codigo del servidor para controlar datos, calculos y respuestas de la aplicacion. */
package com.miapp.calculadoraweb.model;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;

public class SolicitudPlan {

    @NotNull(message = "La lista de grupos no puede ser nula")
    @Size(min = 1, max = 30, message = "Debe haber entre 1 y 30 grupos")
    private List<String> grupos;

    @NotNull(message = "La lista de porciones no puede ser nula")
    @Size(min = 1, max = 30, message = "Debe haber entre 1 y 30 valores de porciones")
    private List<Integer> porciones;

    @DecimalMin(value = "0.0", message = "Los hidratos de carbono no pueden ser negativos")
    @DecimalMax(value = "2000.0", message = "Valor de hidratos de carbono excesivo")
    private double hc;

    @DecimalMin(value = "0.0", message = "Los lípidos no pueden ser negativos")
    @DecimalMax(value = "1000.0", message = "Valor de lípidos excesivo")
    private double lipidos;

    @DecimalMin(value = "0.0", message = "Las proteínas no pueden ser negativas")
    @DecimalMax(value = "1000.0", message = "Valor de proteínas excesivo")
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
