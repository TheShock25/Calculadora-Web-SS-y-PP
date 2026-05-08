package com.miapp.calculadoraweb.controller;

import com.miapp.calculadoraweb.model.Alimento;
import com.miapp.calculadoraweb.service.ExcelReaderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/alimentos")
@CrossOrigin(origins = "*") // Permitir peticiones del frontend
public class AlimentosController {
    
    @Autowired
    private ExcelReaderService excelReaderService;
    
    @GetMapping
    public ResponseEntity<Map<String, Object>> obtenerTodos() {
        try {
            List<Alimento> alimentos = excelReaderService.leerTodosLosAlimentos();
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", alimentos);
            response.put("total", alimentos.size());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("error", e.getMessage());
            return ResponseEntity.status(500).body(error);
        }
    }
    
    @GetMapping("/grupo/{grupo}")
    public ResponseEntity<Map<String, Object>> obtenerPorGrupo(@PathVariable String grupo) {
        try {
            List<Alimento> alimentos = excelReaderService.buscarPorGrupo(grupo);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", alimentos);
            response.put("total", alimentos.size());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("error", e.getMessage());
            return ResponseEntity.status(500).body(error);
        }
    }
    
    @GetMapping("/buscar")
    public ResponseEntity<Map<String, Object>> buscarPorNombre(@RequestParam String q) {
        try {
            List<Alimento> alimentos = excelReaderService.buscarPorNombre(q);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", alimentos);
            response.put("total", alimentos.size());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("error", e.getMessage());
            return ResponseEntity.status(500).body(error);
        }
    }
    
    @GetMapping("/grupos")
    public ResponseEntity<Map<String, Object>> obtenerGrupos() {
        try {
            List<Alimento> alimentos = excelReaderService.leerTodosLosAlimentos();
            List<String> grupos = alimentos.stream()
                    .map(Alimento::getGrupo)
                    .distinct()
                    .sorted()
                    .toList();
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", grupos);
            response.put("total", grupos.size());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("error", e.getMessage());
            return ResponseEntity.status(500).body(error);
        }
    }
}