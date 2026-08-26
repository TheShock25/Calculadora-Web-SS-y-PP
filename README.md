# Calculadora Nutricional y Antropometrica Web

Sistema web integral para el calculo del gasto energetico basal y total, gestion del Sistema Mexicano de Alimentos Equivalentes (SMAE), elaboracion de planes alimenticios semanales, registro de recordatorio de 24 horas (R24H), evaluacion de somatotipo segun el metodo Heath-Carter y evaluacion antropometrica y de composicion corporal.

El proyecto esta construido sobre una arquitectura cliente-servidor con backend en Java Spring Boot y un frontend modular en HTML5, CSS3 y JavaScript Vanilla, con soporte para ejecucion en contenedores Docker y despliegue en maquinas virtuales en la nube (Oracle Cloud Infrastructure).

---

## Tabla de Contenidos

1. [Descripcion General y Funcionalidades](#descripcion-general-y-funcionalidades)
2. [Arquitectura y Stack Tecnologico](#arquitectura-y-stack-tecnologico)
3. [Estructura del Proyecto](#estructura-del-proyecto)
4. [Requisitos Previos](#requisitos-previos)
5. [Guia de Ejecucion Local](#guia-de-ejecucion-local)
   - [Opcion A: Desde Apache NetBeans (Recomendada)](#opcion-a-desde-apache-netbeans-recomendada)
   - [Opcion B: Desde Terminal con Maven Wrapper](#opcion-b-desde-terminal-con-maven-wrapper)
   - [Opcion C: Con Docker](#opcion-c-con-docker)
6. [Despliegue en la Nube (Oracle Cloud Infrastructure - OCI)](#despliegue-en-la-nube-oracle-cloud-infrastructure---oci)
7. [Documentacion de la API REST](#documentacion-de-la-api-rest)
8. [Modulos y Flujo de Trabajo](#modulos-y-flujo-de-trabajo)
9. [Buenas Practicas para el Equipo](#buenas-practicas-para-el-equipo)

---

## Descripcion General y Funcionalidades

La aplicacion proporciona una suite de herramientas clinicas y nutricionales organizadas en modulos interconectados:

1. **Calculadora de Gasto Energetico (GEB, ETA, GET):**
   - Ecuaciones predictivas: Harris-Benedict, Mifflin-St Jeor y Valencia.
   - Factores de actividad fisica diferenciados por sexo.
   - Calculo automatico del Efecto Termico de los Alimentos (ETA, 10%).
   - Persistencia local de datos antropometricos para reutilizacion entre vistas.

2. **Sistema de Equivalentes Nutricionales (SMAE):**
   - Distribucion dinamica de equivalentes por grupos y subgrupos de alimentos.
   - Matriz de calculo en tiempo real de Hidratos de Carbono (HC), Lipidos, Proteinas y Calorias.
   - Control de porcentajes de macronutrientes con validacion de suma al 100%.
   - Indicadores visuales de porcentaje de adecuacion segun rangos clinicos.

3. **Plan Alimenticio Semanal:**
   - Planificacion por tiempos de comida (Desayuno, Comida, Cena) para los 7 dias de la semana.
   - Catalogo de alimentos cargados dinamicamente desde la base de datos SMAE (archivo Excel).
   - Seleccion e integracion de platillos mexicanos preconfigurados (archivo CSV).
   - Generacion y descarga del plan completo en formato de texto plano (.txt).

4. **Recordatorio de 24 Horas (R24H):**
   - Registro de consumo diario con acceso completo a todos los grupos alimenticios del SMAE.
   - Calculo de energia y macronutrientes consumidos vs. objetivos calculados.
   - Exportacion de reporte de consumo en archivo de texto plano (.txt).

5. **Calculadora de Somatotipo (Metodo Heath-Carter):**
   - Calculo de componentes: Endomorfia (adiposidad relativa), Mesomorfia (desarrollo musculoesqueletico) y Ectomorfia (linealidad relativa).
   - Entrada de pliegues cutaneos (tricipital, subescapular, supraespinal, pantorrilla), diametros oseos (humero, femur) y perimetros (brazo, pantorrilla).
   - Renderizado en tiempo real de la Somatocarta bidimensional en Canvas HTML5.
   - Grafico dinamico de representacion de la silueta corporal frontal.

6. **IMC y Composicion Corporal Avanzada:**
   - Indice de Masa Corporal (IMC), Peso Ideal, Indice Cintura-Cadera (ICC) e Indice Cintura-Talla (ICT).
   - Evaluacion de grasa corporal por pliegues cutaneos (protocolo Jackson-Pollock).
   - Estimacion de areas corporales (Area Braquial, Area Grasa Braquial, Area Muscular Braquial y AMB corregida).
   - Calculo de Densidad Corporal, Masa Osea (formula de Rocha), Masa Residual y Masa Libre de Grasa (Masa Magra).

7. **Tabla de Referencia de Parametros:**
   - Valores normativos y rangos de clasificacion basados en estandares de la OMS y literatura biomedica.

---

## Arquitectura y Stack Tecnologico

El proyecto sigue una arquitectura desacoplada donde el servidor Java expone servicios RESTful y sirve los recursos estaticos al cliente web.

### Backend
- **Lenguaje:** Java 17 (LTS).
- **Framework:** Spring Boot 3.2.5.
- **Modulos Spring:** Spring Boot Starter Web (Spring MVC, Tomcat embebido), Spring Boot Starter Test.
- **Procesamiento de Archivos:**
  - `Apache POI 5.2.3` / `poi-ooxml`: Lectura y procesamiento del archivo Excel con el catalogo SMAE 5ta edicion.
  - `OpenCSV 5.7.1`: Lectura del archivo CSV con el catalogo de platillos tipicos mexicanos.
  - `Jackson Databind 2.15.2`: Serializacion y deserializacion JSON.
- **Herramienta de Construccion:** Apache Maven con Maven Wrapper (`mvnw` / `mvnw.cmd`).

### Frontend
- **Estructura:** HTML5 semantico por vistas independientes.
- **Estilos:** CSS3 modularizado por pantalla con variables CSS y disenio responsivo.
- **Logica de Cliente:** JavaScript Vanilla (ES6+) estructurado en controladores cliente.
- **Graficos:** Canvas API 2D nativo para generacion de la Somatocarta y morfologia corporal.
- **Almacenamiento Local:** `localStorage` y `sessionStorage` para transferencia de parametros entre vistas.
- **Comunicacion Asincrona:** Fetch API para consumo de endpoints REST.

### Infraestructura y Despliegue
- **Contenedor:** Docker (imagen base `eclipse-temurin:17-jdk-alpine`).
- **Nube:** Oracle Cloud Infrastructure (OCI Compute Instance - Linux VM).
- **Servidor Web / Aplicacion:** Servidor Tomcat integrado en Spring Boot (Puerto por defecto: 8080).

---

## Estructura del Proyecto

```text
calculadoraweb/
├── .mvn/                               # Configuracion del Maven Wrapper
├── src/
│   ├── main/
│   │   ├── java/com/miapp/calculadoraweb/
│   │   │   ├── CalculadorawebApplication.java   # Clase principal con anotacion @SpringBootApplication
│   │   │   ├── controller/                      # Controladores REST
│   │   │   │   ├── AlimentosController.java     # Endpoints para consulta y busqueda en SMAE
│   │   │   │   ├── CalculadoraController.java   # Endpoint para calculo de GEB y GET
│   │   │   │   ├── PlanAlimenticioController.java # Endpoints para inicializacion, calculo y exportacion de planes
│   │   │   │   └── RecordatorioController.java  # Endpoints para datos y calculo de recordatorio R24H
│   │   │   ├── model/                           # Clases de dominio y DTOs
│   │   │   │   ├── Alimento.java                # Modelo de alimento del SMAE
│   │   │   │   ├── Nutrientes.java              # Modelo de valores nutrimentales
│   │   │   │   ├── PlanAlimenticioData.java     # DTO de respuesta para el modulo de plan alimenticio
│   │   │   │   ├── Platillo.java                # Modelo de platillo mexicano
│   │   │   │   ├── RecordatorioData.java        # DTO de respuesta para el recordatorio R24H
│   │   │   │   └── SolicitudPlan.java           # DTO de entrada para solicitud de plan
│   │   │   └── service/                         # Logica de negocio y servicios
│   │   │       ├── CalculadoraEnergeticaService.java # Algoritmos de ecuaciones energeticas
│   │   │       ├── CSVReaderService.java        # Lector del archivo CSV de platillos
│   │   │       ├── DatosEntrada.java            # Estructura de datos para entrada de calculos
│   │   │       ├── ExcelReaderService.java      # Lector y cache del Excel SMAE con Apache POI
│   │   │       ├── PlanAlimenticioService.java  # Logica de armado, calculo y exportacion TXT de planes
│   │   │       ├── RecordatorioService.java     # Logica y calculo del recordatorio R24H
│   │   │       └── Resultado.java               # Estructura de resultado energetico
│   │   └── resources/
│   │       ├── application.properties           # Configuracion del servidor y puerto (server.port=${PORT:8080})
│   │       ├── data/                            # Datasets y catalogos
│   │       │   ├── Platillos_mexicanos.csv      # Catalogo de platillos con macros
│   │       │   └── SMAE_5aed-2.0.xlsx           # Tabla oficial de alimentos equivalentes
│   │       └── static/                          # Frontend servido por Spring Boot
│   │           ├── index.html                   # Pantalla 1: Calculadora de Gasto Energetico
│   │           ├── menu.html                    # Pantalla 2: Menu Principal Antropometrico
│   │           ├── equivalentes.html            # Pantalla 3: Sistema de Equivalentes SMAE
│   │           ├── plan-alimenticio.html        # Pantalla 4: Plan Semanal por tiempos de comida
│   │           ├── recordatorio.html            # Pantalla 5: Recordatorio de 24 Horas
│   │           ├── somatotipo.html              # Pantalla 6: Evaluacion Heath-Carter y Somatocarta
│   │           ├── imc.html                     # Pantalla 7: IMC, pliegues y composicion corporal
│   │           ├── infoparametros.html          # Pantalla 8: Tablas de referencia y valores normativos
│   │           ├── app.js                       # Logica y validaciones de la calculadora energetica
│   │           ├── styles.css                   # Estilos base de la pantalla inicial
│   │           ├── css/                         # Hojas de estilo por modulo
│   │           │   ├── equivalentes.css
│   │           │   ├── imc.css
│   │           │   ├── infoparametros.css
│   │           │   ├── menu.css
│   │           │   ├── plan-alimenticio.css
│   │           │   ├── recordatorio.css
│   │           │   └── somatotipo.css
│   │           └── js/                          # Scripts de cliente por modulo
│   │               ├── equivalentes.js
│   │               ├── imc.js
│   │               ├── infoparametros.js
│   │               ├── menu.js
│   │               ├── plan-alimenticio.js
│   │               ├── recordatorio.js
│   │               └── somatotipo.js
├── Dockerfile                                  # Archivo de construccion de contenedor Docker
├── mvnw / mvnw.cmd                             # Scripts ejecutables de Maven Wrapper (Linux / Windows)
└── pom.xml                                     # Descriptor de dependencias y plugins Maven
```

---

## Requisitos Previos

Antes de ejecutar el proyecto, asegurarse de contar con las siguientes herramientas instaladas:

1. **Java Development Kit (JDK):** Version 17 o superior (Eclipse Temurin, Oracle JDK u OpenJDK).
2. **IDE:** Apache NetBeans (version 17 o superior recomendada), IntelliJ IDEA, Eclipse o Visual Studio Code con Extension Pack for Java.
3. **Navegador Web:** Google Chrome, Mozilla Firefox, Microsoft Edge o cualquier navegador moderno con soporte JavaScript ES6+.
4. **Git:** Para control de versiones y trabajo colaborativo.
5. **Docker (Opcional):** Si se desea probar la ejecucion en contenedores de forma local.

---

## Guia de Ejecucion Local

### Opcion A: Desde Apache NetBeans (Recomendada)

Sigue estos pasos detallados para ejecutar el proyecto en tu entorno local con NetBeans:

1. **Abrir NetBeans IDE.**
2. **Abrir el Proyecto:**
   - Ve al menu superior: `File` -> `Open Project...` (o presiona `Ctrl + Shift + O`).
   - Navega hasta la carpeta del repositorio (`calculadoraweb`).
   - NetBeans reconocera el icono de proyecto Maven (icono de carpeta con una 'm'). Seleccionalo y haz clic en `Open Project`.
3. **Esperar la descarga de dependencias:**
   - La primera vez que se abre el proyecto, Maven descargara automaticamente Spring Boot, Apache POI, OpenCSV y sus librerias asociadas. Verificar en la barra de estado inferior que no haya procesos pendientes.
4. **Ejecutar el Servidor Spring Boot:**
   - **Metodo 1 (Directo):** Haz clic derecho sobre el nombre del proyecto `calculadoraweb` en la pestania de proyectos y selecciona `Run` (o presiona la tecla `F6`).
   - **Metodo 2 (Por clase principal):** Navega en el arbol del proyecto a `Source Packages` -> `com.miapp.calculadoraweb` -> haz clic derecho en `CalculadorawebApplication.java` y selecciona `Run File` (o `Shift + F6`).
5. **Verificar el inicio del servidor:**
   - En la ventana de `Output` de NetBeans, observaras el banner de Spring Boot y el mensaje final indicando que el servidor Tomcat se inicio correctamente:
     ```text
     Tomcat started on port 8080 (http) with context path ''
     Started CalculadorawebApplication in X.XXX seconds
     ```
6. **Abrir la aplicacion en el navegador:**
   - Abre tu navegador web e ingresa a la siguiente URL:
     ```text
     http://localhost:8080
     ```
   - Tambien puedes acceder directamente a la pantalla principal mediante:
     ```text
     http://localhost:8080/index.html
     ```

---

### Opcion B: Desde Terminal con Maven Wrapper

Si prefieres ejecutar el proyecto desde la terminal o linea de comandos:

1. **Abrir una terminal** (PowerShell, CMD o Bash) en la raiz del proyecto:
   ```bash
   cd ruta/al/proyecto/calculadoraweb
   ```

2. **Ejecutar con el Maven Wrapper:**
   - En Windows (PowerShell o CMD):
     ```powershell
     .\mvnw.cmd spring-boot:run
     ```
   - En Linux o macOS:
     ```bash
     chmod +x mvnw
     ./mvnw spring-boot:run
     ```

3. **O generar el paquete JAR y ejecutarlo:**
   ```bash
   # Compilar y empaquetar sin ejecutar pruebas
   ./mvnw clean package -DskipTests

   # Ejecutar el archivo JAR generado
   java -jar target/calculadoraweb-0.0.1-SNAPSHOT.jar
   ```

4. **Acceder en el navegador a:** `http://localhost:8080`

---

### Opcion C: Con Docker

El proyecto incluye un `Dockerfile` optimizado para empaquetar y ejecutar la aplicacion dentro de un contenedor:

1. **Construir la imagen de Docker:**
   ```bash
   docker build -t calculadoraweb:1.0 .
   ```

2. **Iniciar el contenedor mapeando el puerto 8080:**
   ```bash
   docker run -d -p 8080:8080 --name calculadora-app calculadoraweb:1.0
   ```

3. **Acceder en el navegador a:** `http://localhost:8080`

4. **Detener el contenedor:**
   ```bash
   docker stop calculadora-app && docker rm calculadora-app
   ```

---

## Despliegue en la Nube (Oracle Cloud Infrastructure - OCI)

El proyecto fue desplegado y probado en una Maquina Virtual (VM) de tipo Compute Instance en Oracle Cloud con Linux. A continuacion se detallan los pasos de configuracion necesarios para replicar este despliegue:

### 1. Preparacion de la Maquina Virtual en OCI
- Crear una instancia Compute (Ubuntu 22.04 LTS o Oracle Linux).
- Conectarse mediante SSH a la instancia:
  ```bash
  ssh -i /ruta/a/tu/llave_privada.key ubuntu@<IP_PUBLICA_DE_LA_VM>
  ```
- Instalar Docker y Git en la maquina virtual:
  ```bash
  sudo apt update && sudo apt install -y git docker.io
  sudo usermod -aG docker $USER
  ```

### 2. Clonar y Levantar el Contenedor
- Clonar el repositorio en la maquina virtual:
  ```bash
  git clone <URL_DEL_REPOSITORIO_GIT>
  cd Calculadora-Web-SS-y-PP
  ```
- Construir y ejecutar la imagen Docker:
  ```bash
  docker build -t calculadoraweb .
  docker run -d --restart always -p 8080:8080 --name calculadora-service calculadoraweb
  ```

### 3. Apertura de Puertos de Red en OCI (Paso Critico)
Para que el servidor sea accesible publicamente desde cualquier navegador, se deben abrir dos niveles de firewall:

- **Nivel 1: Lista de Seguridad de OCI (VCN Security List):**
  - Entrar a la consola web de Oracle Cloud.
  - Ir a `Networking` -> `Virtual Cloud Networks` -> Seleccionar tu VCN.
  - Ir a `Security Lists` -> `Default Security List`.
  - Agregar una **Ingress Rule**:
    - **Source CIDR:** `0.0.0.0/0`
    - **IP Protocol:** `TCP`
    - **Destination Port Range:** `8080`
    - **Description:** Permitir trafico web de la aplicacion calculadora.

- **Nivel 2: Firewall del Sistema Operativo de la VM (iptables / ufw):**
  - En la terminal SSH de la VM, permitir el puerto 8080:
    ```bash
    # Si la maquina usa iptables (Oracle Linux / Ubuntu en OCI):
    sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 8080 -j ACCEPT
    sudo netfilter-persistent save

    # Si la maquina usa UFW:
    sudo ufw allow 8080/tcp
    sudo ufw reload
    ```

### 4. Acceso Publico
Una vez realizados estos pasos, la aplicacion queda disponible publicamente en:
```text
http://<IP_PUBLICA_DE_TU_INSTANCIA_OCI>:8080
```

---

## Documentacion de la API REST

Los controladores Spring Boot exponen los siguientes endpoints HTTP:

| Metodo | Ruta | Descripcion | Parametros / Body |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/calculadora/calcular` | Realiza el calculo de GEB, ETA y GET. | JSON con `ecuacion`, `sexo`, `peso`, `altura`, `edad`, `factorActividad`. |
| `GET` | `/api/alimentos` | Obtiene la lista completa de alimentos registrados en el SMAE. | Ninguno. |
| `GET` | `/api/alimentos/grupos` | Retorna la lista de todos los grupos de alimentos unicos disponibles. | Ninguno. |
| `GET` | `/api/alimentos/grupo/{grupo}` | Filtra y retorna los alimentos pertenecientes al grupo indicado. | Variable de ruta `{grupo}`. |
| `GET` | `/api/alimentos/buscar` | Busca alimentos por coincidencia parcial de nombre. | Query param `?q=termino`. |
| `POST` | `/api/plan/datos` | Procesa y retorna los catalogos y macronutrientes requeridos para el plan. | JSON `SolicitudPlan` (grupos, porciones, macros meta). |
| `POST` | `/api/plan/calcular` | Calcula la suma de nutrientes de los alimentos seleccionados en el plan. | JSON con mapa de alimentos y porciones. |
| `POST` | `/api/plan/exportar` | Genera y descarga el archivo de texto plano (`plan_alimenticio.txt`). | JSON con el estado de comidas por dia y metas. |
| `GET` | `/api/recordatorio/datos` | Inicializa y entrega los grupos, alimentos y platillos para el R24H. | Ninguno. |
| `POST` | `/api/recordatorio/calcular` | Calcula el aporte total de macronutrientes para el recordatorio de 24 horas. | JSON con seleccion de alimentos y platillos. |

---

## Modulos y Flujo de Trabajo

### Flujo de Navegacion del Usuario

```text
                               ┌────────────────────────┐
                               │  index.html            │
                               │  Calculadora de Gasto  │
                               │  Energetico (GEB/GET)  │
                               └──────────┬─────────────┘
                                          │
                   ┌──────────────────────┴──────────────────────┐
                   ▼                                             ▼
       ┌────────────────────────┐                    ┌────────────────────────┐
       │  equivalentes.html     │                    │  menu.html             │
       │  Sistema SMAE          │                    │  Menu Antropometrico   │
       └──────────┬─────────────┘                    └──────────┬─────────────┘
                  │                                             │
         ┌────────┴────────┐                           ┌────────┴────────┐
         ▼                 ▼                           ▼                 ▼
┌────────────────┐ ┌────────────────┐         ┌────────────────┐ ┌────────────────┐
│plan-           │ │recordatorio.    │         │somatotipo.     │ │imc.html        │
│alimenticio.html│ │html             │         │html            │ │Composicion     │
│Plan Semanal    │ │Recordatorio R24H│         │Heath-Carter    │ │Corporal        │
└────────────────┘ └────────────────┘         └────────────────┘ └────────┬───────┘
                                                                          │
                                                                          ▼
                                                                 ┌────────────────┐
                                                                 │infoparametros. │
                                                                 │html            │
                                                                 │Valores OMS     │
                                                                 └────────────────┘
```

1. **Pantalla Inicial (`index.html`):**
   - El usuario ingresa sexo, peso, altura, edad, selecciona la ecuacion predictiva y el nivel de actividad fisica.
   - El calculo genera el GEB, ETA y GET.
   - Desde esta pantalla se puede navegar a:
     - **Sistema de Equivalentes** (`equivalentes.html`), transfiriendo el GET calculado como objetivo calorico.
     - **Menu Principal Antropometrico** (`menu.html`), transfiriendo los datos basicos del sujeto.

2. **Modulo de Equivalentes (`equivalentes.html`):**
   - Permite ajustar los porcentajes meta de HC, Proteinas y Lipidos (deben sumar 100%).
   - Se asignan las porciones para cada grupo alimenticio.
   - El sistema valida las calorias acumuladas y el porcentaje de adecuacion.
   - Da acceso directo a generar el **Plan Alimenticio Semanal** o el **Recordatorio de 24 Horas**.

3. **Modulo de Plan Alimenticio (`plan-alimenticio.html`):**
   - Permite planificar los 7 dias de la semana seleccionando alimentos del SMAE y platillos mexicanos para desayuno, comida y cena.
   - Muestra barras de cumplimiento respecto a las metas nutricionales.
   - Incluye boton para exportar el plan a `.txt`.

4. **Modulo de Recordatorio 24 Horas (`recordatorio.html`):**
   - Registro de lo consumido en el dia anterior desglosado por los 17 grupos alimentarios y platillos.
   - Exporta el reporte clinico a `.txt`.

5. **Modulo de Somatotipo (`somatotipo.html`):**
   - Recibe o solicita datos antropometricos (pliegues cutaneos, diametros y perimetros).
   - Calcula las coordenadas (X, Y) y ubica el punto exacto en la Somatocarta interactiva (Canvas).
   - Genera clasificacion somatotipica (Endomorfo, Mesomorfo, Ectomorfo o combinaciones) y recomendaciones.

6. **Modulo de IMC y Composicion Corporal (`imc.html`):**
   - Calcula indicadores antropometricos basicos y avanzados (masa osea, residual, magra y densidad).
   - Permite consultar la tabla de referencia en `infoparametros.html`.

---

## Buenas Practicas para el Equipo

Para mantener la consistencia y estabilidad del proyecto entre los colaboradores:

1. **Modificaciones en el Backend:**
   - Toda nueva logica de calculo debe residir en el paquete `service`.
   - Los controladores en `controller` deben limitarse a recibir peticiones, llamar al servicio correspondiente y retornar respuestas HTTP estructuradas con `ResponseEntity`.
   - Si se modifican archivos de datos (`SMAE_5aed-2.0.xlsx` o `Platillos_mexicanos.csv`), verificar que las columnas coincidan con los indices leidos en `ExcelReaderService.java` y `CSVReaderService.java`.

2. **Modificaciones en el Frontend:**
   - Mantener separados los archivos HTML, CSS y JS en sus respectivas carpetas dentro de `src/main/resources/static/`.
   - Utilizar funciones de sanitizacion y bloqueo de caracteres (`bloquearCaracteresInvalidos`) en campos numericos para evitar entradas invalidas.
   - Probar los flujos de navegacion entre paginas verificando que `localStorage` y `sessionStorage` transfieran correctamente los valores de estado.

3. **Control de Versiones (Git):**
   - No subir la carpeta `target/` ni archivos generados por el IDE (`.nb-cache`, etc.). El archivo `.gitignore` ya se encuentra configurado para este proposito.
   - Realizar commits descriptivos en espanol haciendo referencia al modulo modificado (por ejemplo: `fix(somatotipo): correccion en calculo de mesomorfia`).
