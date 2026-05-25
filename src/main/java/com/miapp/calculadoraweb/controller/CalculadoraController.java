/* Codigo del servidor para controlar datos, calculos y respuestas de la aplicacion. */
package com.miapp.calculadoraweb.controller;

import com.miapp.calculadoraweb.service.*;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/calculadora")
public class CalculadoraController {

    private final CalculadoraEnergeticaService service = new CalculadoraEnergeticaService();

    @PostMapping("/calcular")
    public Resultado calcular(@RequestBody DatosEntrada datos) {
        return service.calcular(datos);
    }
}
