/* Codigo del servidor para controlar datos, calculos y respuestas de la aplicacion. */
package com.miapp.calculadoraweb.controller;

import com.miapp.calculadoraweb.model.RecordatorioData;
import com.miapp.calculadoraweb.service.RecordatorioService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/recordatorio")
@CrossOrigin(origins = "*")
public class RecordatorioController {

    @Autowired
    private RecordatorioService recordatorioService;

    @GetMapping("/datos")
    public ResponseEntity<Map<String, Object>> obtenerDatos() {
        try {
            RecordatorioData data = recordatorioService.getRecordatorioData();

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", data);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("error", e.getMessage());
            return ResponseEntity.status(500).body(error);
        }
    }

    @PostMapping("/calcular")
    public ResponseEntity<Map<String, Object>> calcularNutrientes(@RequestBody Map<String, Object> selecciones) {
        try {
            Map<String, Object> resultados = recordatorioService.calcularNutrientes(selecciones);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", resultados);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("error", e.getMessage());
            return ResponseEntity.status(500).body(error);
        }
    }
}
