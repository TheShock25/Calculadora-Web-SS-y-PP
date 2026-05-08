package com.miapp.calculadoraweb.service;

import com.miapp.calculadoraweb.model.Platillo;
import com.opencsv.CSVReader;
import com.opencsv.exceptions.CsvException;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.io.InputStreamReader;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

@Service
public class CSVReaderService {
    
    private List<Platillo> platillosCache = null;
    
    public List<Platillo> leerPlatillosCSV() {
        if (platillosCache != null) {
            return platillosCache;
        }
        
        List<Platillo> platillos = new ArrayList<>();
        
        try (InputStreamReader inputStreamReader = 
                new InputStreamReader(new ClassPathResource("data/Platillos_mexicanos.csv").getInputStream());
             CSVReader reader = new CSVReader(inputStreamReader)) {
            
            List<String[]> lines = reader.readAll();
            boolean primeraLinea = true;
            
            for (String[] line : lines) {
                if (primeraLinea) {
                    primeraLinea = false;
                    continue;
                }
                
                if (line.length >= 5) {
                    String nombre = line[0].trim();
                    if (nombre.isEmpty()) continue;
                    
                    try {
                        double proteinas = Double.parseDouble(line[2].trim());
                        double lipidos = Double.parseDouble(line[3].trim());
                        double hc = Double.parseDouble(line[4].trim());
                        
                        platillos.add(new Platillo(nombre, proteinas, lipidos, hc));
                    } catch (NumberFormatException e) {
                        // Ignorar líneas con formato incorrecto
                    }
                }
            }
            
            platillosCache = platillos;
            System.out.println("Platillos cargados: " + platillos.size());
            
        } catch (IOException | CsvException e) {
            System.err.println("Error leyendo CSV: " + e.getMessage());
        }
        
        return platillos;
    }
}