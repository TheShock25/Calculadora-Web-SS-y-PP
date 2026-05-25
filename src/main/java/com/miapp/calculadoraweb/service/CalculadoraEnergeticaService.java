/* Codigo del servidor para controlar datos, calculos y respuestas de la aplicacion. */
package com.miapp.calculadoraweb.service;

public class CalculadoraEnergeticaService {

    public Resultado calcular(DatosEntrada d) {
        double geb = calcularGEB(d.ecuacion, d.sexo, d.peso, d.altura, d.edad);
        double eta = geb * 0.10;
        double get = (geb + eta) * d.factorActividad;

        return new Resultado(geb, eta, get, d.factorActividad);
    }

    private double calcularGEB(String ecuacion, String sexo, double peso, double altura, int edad) {
        switch (ecuacion) {
            case "Harris-Benedict":
                return sexo.equals("Hombre")
                        ? 66.4730 + (13.7516 * peso) + (5.0033 * altura) - (6.7559 * edad)
                        : 655.0955 + (9.5634 * peso) + (1.8496 * altura) - (4.6756 * edad);

            case "Mifflin-St Jeor":
                return sexo.equals("Hombre")
                        ? (10 * peso) + (6.25 * altura) - (5 * edad) + 5
                        : (10 * peso) + (6.25 * altura) - (5 * edad) - 161;

            case "Valencia":
                return calcularGEBValencia(sexo, peso, Math.max(18, edad));
        }
        return 0;
    }

    private double calcularGEBValencia(String sexo, double peso, int edad) {
        if (sexo.equals("Hombre")) {
            if (edad <= 30) return 13.37 * peso + 747;
            else if (edad < 60) return 13.08 * peso + 693;
            else return 14.21 * peso + 429;
        } else {
            if (edad <= 30) return 11.02 * peso + 679;
            else if (edad < 60) return 10.92 * peso + 677;
            else return 10.98 * peso + 520;
        }
    }
}
