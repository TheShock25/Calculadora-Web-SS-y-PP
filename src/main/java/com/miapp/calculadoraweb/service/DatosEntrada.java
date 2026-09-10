/* Codigo del servidor para controlar datos, calculos y respuestas de la aplicacion. */
package com.miapp.calculadoraweb.service;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

public class DatosEntrada {

    @NotBlank(message = "La ecuación es obligatoria")
    @Pattern(regexp = "^(Harris-Benedict|Mifflin-St Jeor|Valencia)$", message = "Ecuación inválida")
    public String ecuacion;

    @NotBlank(message = "El sexo es obligatorio")
    @Pattern(regexp = "^(Hombre|Mujer)$", message = "Sexo inválido, debe ser Hombre o Mujer")
    public String sexo;

    @DecimalMin(value = "20.0", message = "El peso mínimo es 20 kg")
    @DecimalMax(value = "300.0", message = "El peso máximo es 300 kg")
    public double peso;

    @DecimalMin(value = "50.0", message = "La altura mínima es 50 cm")
    @DecimalMax(value = "250.0", message = "La altura máxima es 250 cm")
    public double altura;

    @Min(value = 1, message = "La edad mínima es 1 año")
    @Max(value = 120, message = "La edad máxima es 120 años")
    public int edad;

    @DecimalMin(value = "1.0", message = "El factor de actividad mínimo es 1.0")
    @DecimalMax(value = "2.5", message = "El factor de actividad máximo es 2.5")
    public double factorActividad;
}
