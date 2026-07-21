# 1. Aşama: Maven ve Java 21 ile projeyi derle
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app

# Backend klasöründeki dosyaları kopyala
COPY backend/ .

RUN mvn clean package -DskipTests

# 2. Aşama: Uygulamayı Java 21 JRE ile çalıştır
FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]