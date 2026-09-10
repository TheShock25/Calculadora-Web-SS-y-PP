package com.miapp.calculadoraweb;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.miapp.calculadoraweb.service.DatosEntrada;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class SecurityValidationTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void testCalculadoraValidPayload() throws Exception {
        DatosEntrada datos = new DatosEntrada();
        datos.ecuacion = "Harris-Benedict";
        datos.sexo = "Hombre";
        datos.peso = 70.0;
        datos.altura = 175.0;
        datos.edad = 25;
        datos.factorActividad = 1.2;

        mockMvc.perform(post("/api/calculadora/calcular")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(datos)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.geb").isNumber())
                .andExpect(jsonPath("$.get").isNumber())
                .andExpect(header().string("X-Content-Type-Options", "nosniff"))
                .andExpect(header().string("X-Frame-Options", "SAMEORIGIN"));
    }

    @Test
    void testCalculadoraInvalidPayloadReturnsBadRequest() throws Exception {
        DatosEntrada datosInvalidos = new DatosEntrada();
        datosInvalidos.ecuacion = "Ecuacion-Inexistente";
        datosInvalidos.sexo = "Alien";
        datosInvalidos.peso = -10.0;
        datosInvalidos.altura = 500.0;
        datosInvalidos.edad = 999;
        datosInvalidos.factorActividad = 0.1;

        mockMvc.perform(post("/api/calculadora/calcular")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(datosInvalidos)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error").exists())
                .andExpect(jsonPath("$.detalles").exists());
    }

    @Test
    void testAlimentosBuscarSanitization() throws Exception {
        mockMvc.perform(get("/api/alimentos/buscar")
                .param("q", "<script>alert('xss')</script>"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void testAlimentosGrupoInvalidReturnsBadRequest() throws Exception {
        mockMvc.perform(get("/api/alimentos/grupo/   "))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }
}
