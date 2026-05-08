# Usa una imagen base de Java 17 (ligera, basada en Alpine)
FROM openjdk:17-jdk-alpine

# Establece el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copia el archivo JAR (se construirá después con Maven)
# Primero copiamos el código fuente para compilar
COPY . .

# Da permisos de ejecución al wrapper de Maven
RUN chmod +x mvnw

# Compila la aplicación y genera el JAR
RUN ./mvnw clean package -DskipTests

# Expone el puerto que usará Spring Boot (Render asignará uno dinámico)
EXPOSE 8080

# Comando para ejecutar la aplicación
CMD ["java", "-jar", "target/*.jar"]