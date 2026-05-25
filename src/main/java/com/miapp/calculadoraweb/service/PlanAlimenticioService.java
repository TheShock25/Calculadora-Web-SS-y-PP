/* Codigo del servidor para controlar datos, calculos y respuestas de la aplicacion. */
package com.miapp.calculadoraweb.service;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Timer;
import java.util.TimerTask;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.miapp.calculadoraweb.model.PlanAlimenticioData;
import com.miapp.calculadoraweb.model.Platillo;
import com.miapp.calculadoraweb.model.SolicitudPlan;

@Service
public class PlanAlimenticioService {

    @Autowired
    private ExcelReaderService excelReaderService;

    @Autowired
    private CSVReaderService csvReaderService;

    private final Map<String, PlanAlimenticioData> cachePorSesion = new ConcurrentHashMap<>();

    private String normalizarNombreGrupo(String grupo) {
        if (grupo == null) return "";
        String normalizado = grupo.replaceAll("\\s*-\\s*$", "").trim();
        return normalizado;
    }

    private String encontrarGrupoEnMapa(String grupoBuscado, Map<String, List<String>> mapaGrupos) {
        if (mapaGrupos.containsKey(grupoBuscado)) return grupoBuscado;

        String normalizado = normalizarNombreGrupo(grupoBuscado);
        if (!normalizado.equals(grupoBuscado) && mapaGrupos.containsKey(normalizado))
            return normalizado;

        for (String clave : mapaGrupos.keySet()) {
            if (clave.equalsIgnoreCase(grupoBuscado) || clave.equalsIgnoreCase(normalizado))
                return clave;
        }
        return null;
    }

    public PlanAlimenticioData getPlanData(SolicitudPlan solicitud) {
        String clave = generarClaveUnica(solicitud);
        if (cachePorSesion.containsKey(clave)) return cachePorSesion.get(clave);

        excelReaderService.verificarYAñadirGrupos(solicitud.getGrupos());

        PlanAlimenticioData data = new PlanAlimenticioData();
        Map<String, List<String>> todosLosGrupos = excelReaderService.getAlimentosPorGrupo();

        List<String> gruposNormalizados = new ArrayList<>();
        for (String grupo : solicitud.getGrupos())
            gruposNormalizados.add(normalizarNombreGrupo(grupo));

        Map<String, List<String>> gruposFiltrados = new HashMap<>();
        Map<String, Map<String, Double>> nutrientesFiltrados = new HashMap<>();

        for (int i = 0; i < solicitud.getGrupos().size(); i++) {
            String grupoOriginal   = solicitud.getGrupos().get(i);
            String grupoNormalizado = gruposNormalizados.get(i);

            String grupoEncontrado = encontrarGrupoEnMapa(grupoOriginal, todosLosGrupos);
            if (grupoEncontrado == null && !grupoOriginal.equals(grupoNormalizado))
                grupoEncontrado = encontrarGrupoEnMapa(grupoNormalizado, todosLosGrupos);

            if (grupoEncontrado != null) {
                List<String> alimentos = todosLosGrupos.get(grupoEncontrado);
                gruposFiltrados.put(grupoOriginal, alimentos);

                Map<String, Map<String, Double>> todosNutrientes = excelReaderService.getNutrientesAlimentos();
                for (String alimento : alimentos) {
                    if (todosNutrientes.containsKey(alimento))
                        nutrientesFiltrados.put(alimento, todosNutrientes.get(alimento));
                }
            } else {
                gruposFiltrados.put(grupoOriginal, new ArrayList<>());
            }
        }

        data.setAlimentosPorGrupo(gruposFiltrados);
        data.setNutrientesAlimentos(nutrientesFiltrados);
        data.setPlatillos(csvReaderService.leerPlatillosCSV());
        data.setGruposEspecificos(solicitud.getGrupos());
        data.setPorcionesObjetivo(solicitud.getPorciones());
        data.setHcObjetivo(solicitud.getHc());
        data.setLipidosObjetivo(solicitud.getLipidos());
        data.setProteinasObjetivo(solicitud.getProteinas());

        cachePorSesion.put(clave, data);
        new Timer().schedule(new TimerTask() {
            @Override public void run() { cachePorSesion.remove(clave); }
        }, 30 * 60 * 1000);

        return data;
    }

    private String generarClaveUnica(SolicitudPlan solicitud) {
        return UUID.randomUUID().toString();
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> calcularNutrientes(Map<String, Object> selecciones) {
        Map<String, Object> resultado = new HashMap<>();
        double totalHc = 0, totalLipidos = 0, totalProteinas = 0;

        Map<String, Map<String, Double>> nutrientes = excelReaderService.getNutrientesAlimentos();

        if (selecciones.containsKey("alimentos")) {
            List<Map<String, Object>> alimentos = (List<Map<String, Object>>) selecciones.get("alimentos");
            for (Map<String, Object> item : alimentos) {
                String nombre   = (String) item.get("nombre");
                int porciones   = ((Number) item.get("porciones")).intValue();
                if (nutrientes.containsKey(nombre)) {
                    Map<String, Double> nut = nutrientes.get(nombre);
                    totalHc        += nut.getOrDefault("HC", 0.0)          * porciones;
                    totalLipidos   += nut.getOrDefault("Lípidos", 0.0)     * porciones;
                    totalProteinas += nut.getOrDefault("Proteínas", 0.0)   * porciones;
                }
            }
        }

        resultado.put("totalHc", totalHc);
        resultado.put("totalLipidos", totalLipidos);
        resultado.put("totalProteinas", totalProteinas);
        return resultado;
    }

    @SuppressWarnings("unchecked")
    public byte[] generarTXT(Map<String, Object> datos) {
        StringBuilder sb = new StringBuilder();

        Map<String, Object> ideales    = (Map<String, Object>) datos.getOrDefault("ideales", new HashMap<>());
        List<String> grupos            = (List<String>)        datos.getOrDefault("grupos", new ArrayList<>());
        List<String> diasSemana        = (List<String>)        datos.getOrDefault("diasSemana",
                                            Arrays.asList("Lunes","Martes","Miércoles","Jueves","Viernes","Sábado","Domingo"));

        double hcIdeal        = ideales.containsKey("hc")        ? ((Number) ideales.get("hc")).doubleValue()        : 0;
        double lipidosIdeal   = ideales.containsKey("lipidos")   ? ((Number) ideales.get("lipidos")).doubleValue()   : 0;
        double proteinasIdeal = ideales.containsKey("proteinas") ? ((Number) ideales.get("proteinas")).doubleValue() : 0;

        Map<String, Object> estadoPorDia = null;
        if (datos.containsKey("estadoPorDia")) {
            estadoPorDia = (Map<String, Object>) datos.get("estadoPorDia");
        }

        sb.append("=".repeat(80)).append("\n");
        sb.append("         PLAN ALIMENTICIO PERSONALIZADO - PLAN SEMANAL\n");
        sb.append("=".repeat(80)).append("\n\n");

        sb.append("OBJETIVOS NUTRICIONALES DIARIOS:\n");
        sb.append(String.format("  Hidratos de Carbono : %.1f g%n", hcIdeal));
        sb.append(String.format("  Lípidos             : %.1f g%n", lipidosIdeal));
        sb.append(String.format("  Proteínas           : %.1f g%n", proteinasIdeal));
        sb.append("\n");

        if (!grupos.isEmpty()) {
            sb.append("GRUPOS ALIMENTARIOS: ").append(String.join(", ", grupos)).append("\n\n");
        }

        if (estadoPorDia != null) {
            for (String dia : diasSemana) {
                Map<String, Object> estadoDia = (Map<String, Object>) estadoPorDia.get(dia);
                if (estadoDia == null) continue;

                boolean diaVacio = esEstadoVacio(estadoDia);

                sb.append("=".repeat(80)).append("\n");
                sb.append("  ").append(dia.toUpperCase());
                if (diaVacio) sb.append("  (sin datos)");
                sb.append("\n");
                sb.append("=".repeat(80)).append("\n\n");

                if (!diaVacio) {
                    double[] totales = procesarComidas(sb, estadoDia, grupos);
                    sb.append("-".repeat(50)).append("\n");
                    sb.append(String.format("  TOTAL DEL DÍA   HC: %.1f g  |  Lípidos: %.1f g  |  Proteínas: %.1f g%n",
                            totales[0], totales[1], totales[2]));
                    sb.append(String.format("  OBJETIVO        HC: %.1f g  |  Lípidos: %.1f g  |  Proteínas: %.1f g%n",
                            hcIdeal, lipidosIdeal, proteinasIdeal));
                }
                sb.append("\n");
            }
        } else {
            Map<String, Object> estadoUnico = (Map<String, Object>) datos.getOrDefault("estado", new HashMap<>());
            sb.append("=".repeat(80)).append("\n");
            sb.append("  PLAN DIARIO\n");
            sb.append("=".repeat(80)).append("\n\n");
            double[] totales = procesarComidas(sb, estadoUnico, grupos);
            sb.append("-".repeat(50)).append("\n");
            sb.append(String.format("  TOTAL   HC: %.1f g  |  Lípidos: %.1f g  |  Proteínas: %.1f g%n",
                    totales[0], totales[1], totales[2]));
            sb.append("\n");
        }

        sb.append("=".repeat(80)).append("\n");
        sb.append("  Generado por Sistema de Equivalentes Nutricionales\n");
        sb.append("=".repeat(80)).append("\n");

        return sb.toString().getBytes(StandardCharsets.UTF_8);
    }

    @SuppressWarnings("unchecked")
    private double[] procesarComidas(StringBuilder sb, Map<String, Object> estadoDia, List<String> grupos) {
        double totalHc = 0, totalLipidos = 0, totalProteinas = 0;

        String[] comidas = { "desayuno", "comida", "cena" };
        Map<String, Map<String, Double>> nutrientes = excelReaderService.getNutrientesAlimentos();
        List<Platillo> todosPlatillos = csvReaderService.leerPlatillosCSV();
        Map<String, Platillo> mapaPlatillos = new HashMap<>();
        for (Platillo p : todosPlatillos) mapaPlatillos.put(p.getNombre(), p);

        for (String comida : comidas) {
            Map<String, Object> datosComida = (Map<String, Object>) estadoDia.get(comida);
            if (datosComida == null) continue;

            sb.append("  ").append(comida.toUpperCase()).append("\n");
            sb.append("  ").append("-".repeat(40)).append("\n");

            boolean hayAlgo = false;

            List<Map<String, Object>> platillosComida =
                    (List<Map<String, Object>>) datosComida.getOrDefault("platillos", new ArrayList<>());
            for (Map<String, Object> p : platillosComida) {
                String nombre  = (String) p.get("nombre");
                int porcion    = p.get("porcion") != null ? ((Number) p.get("porcion")).intValue() : 1;
                if (nombre == null || nombre.isEmpty()) continue;

                Platillo platillo = mapaPlatillos.get(nombre);
                if (platillo != null) {
                    double hc   = (platillo.getNutrientes() != null ? platillo.getNutrientes().getHc()        : 0) * porcion;
                    double lip  = (platillo.getNutrientes() != null ? platillo.getNutrientes().getLipidos()   : 0) * porcion;
                    double prot = (platillo.getNutrientes() != null ? platillo.getNutrientes().getProteinas() : 0) * porcion;
                    sb.append(String.format("    [Platillo] %-40s x%d  HC:%.1f  Lip:%.1f  Prot:%.1f%n",
                            nombre, porcion, hc, lip, prot));
                    totalHc        += hc;
                    totalLipidos   += lip;
                    totalProteinas += prot;
                    hayAlgo = true;
                }
            }

            List<Map<String, Object>> alimentosComida =
                    (List<Map<String, Object>>) datosComida.getOrDefault("alimentos", new ArrayList<>());
            for (Map<String, Object> a : alimentosComida) {
                String alimento = (String) a.get("alimento");
                int porcion     = a.get("porcion") != null ? ((Number) a.get("porcion")).intValue() : 1;
                if (alimento == null || alimento.isEmpty()) continue;

                String grupo = grupos.isEmpty() ? "" :
                        (a.get("col") != null && ((Number) a.get("col")).intValue() < grupos.size()
                                ? grupos.get(((Number) a.get("col")).intValue()) : "");

                Map<String, Double> nut = nutrientes.get(alimento);
                if (nut != null) {
                    double hc   = nut.getOrDefault("HC", 0.0)        * porcion;
                    double lip  = nut.getOrDefault("Lípidos", 0.0)   * porcion;
                    double prot = nut.getOrDefault("Proteínas", 0.0) * porcion;
                    sb.append(String.format("    [%-20s] %-35s x%d  HC:%.1f  Lip:%.1f  Prot:%.1f%n",
                            grupo, alimento, porcion, hc, lip, prot));
                    totalHc        += hc;
                    totalLipidos   += lip;
                    totalProteinas += prot;
                    hayAlgo = true;
                }
            }

            if (!hayAlgo) {
                sb.append("    (sin alimentos registrados)\n");
            }
            sb.append("\n");
        }

        return new double[]{ totalHc, totalLipidos, totalProteinas };
    }

    @SuppressWarnings("unchecked")
    private boolean esEstadoVacio(Map<String, Object> estadoDia) {
        for (String comida : new String[]{ "desayuno", "comida", "cena" }) {
            Map<String, Object> datosComida = (Map<String, Object>) estadoDia.get(comida);
            if (datosComida == null) continue;

            List<Map<String, Object>> alimentos =
                    (List<Map<String, Object>>) datosComida.getOrDefault("alimentos", new ArrayList<>());
            List<Map<String, Object>> platillosComida =
                    (List<Map<String, Object>>) datosComida.getOrDefault("platillos", new ArrayList<>());

            boolean hayAlimento = alimentos.stream()
                    .anyMatch(a -> a.get("alimento") != null && !((String) a.get("alimento")).isEmpty());
            boolean hayPlatillo = platillosComida.stream()
                    .anyMatch(p -> p.get("nombre") != null && !((String) p.get("nombre")).isEmpty());

            if (hayAlimento || hayPlatillo) return false;
        }
        return true;
    }
}
