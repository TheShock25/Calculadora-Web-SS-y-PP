/* Codigo del servidor para controlar datos, calculos y respuestas de la aplicacion. */
package com.miapp.calculadoraweb.controller;

import com.miapp.calculadoraweb.model.PlanAlimenticioData;
import com.miapp.calculadoraweb.model.SolicitudPlan;
import com.miapp.calculadoraweb.service.PlanAlimenticioService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/plan")
@CrossOrigin(origins = "*")
public class PlanAlimenticioController {

    @Autowired
    private PlanAlimenticioService planAlimenticioService;

    @PostMapping("/datos")
    public ResponseEntity<Map<String, Object>> obtenerDatos(@RequestBody SolicitudPlan solicitud) {
        try {
            PlanAlimenticioData data = planAlimenticioService.getPlanData(solicitud);

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
            Map<String, Object> resultados = planAlimenticioService.calcularNutrientes(selecciones);

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

    @PostMapping(value = "/exportar", produces = MediaType.TEXT_PLAIN_VALUE)
    public ResponseEntity<byte[]> exportarTXT(@RequestBody Map<String, Object> datos) {
        try {
            byte[] contenido = planAlimenticioService.generarTXT(datos);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.TEXT_PLAIN);
            headers.setContentDispositionFormData("attachment", "plan_alimenticio.txt");

            return ResponseEntity.ok()
                    .headers(headers)
                    .body(contenido);
        } catch (Exception e) {
            return ResponseEntity.status(500).build();
        }
    }
}
