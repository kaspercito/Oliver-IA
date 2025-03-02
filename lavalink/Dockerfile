FROM openjdk:17-slim

WORKDIR /app

# Descarga la última versión de Lavalink.jar
ADD https://github.com/lavalink-devs/Lavalink/releases/download/4.0.6/Lavalink.jar /app/Lavalink.jar

# Copia el archivo de configuración
COPY application.yml /app/application.yml

# Expone el puerto de Lavalink
EXPOSE 2333

CMD ["java", "-jar", "Lavalink.jar"]
