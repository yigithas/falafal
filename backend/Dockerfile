# 1. Aşama: Maven ve Java 17 ile projeyi derle
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app

# Backend klasöründeki dosyaları kopyala
COPY backend/ .

RUN mvn clean package -DskipTests

# 2. Aşama: Uygulamayı Java 17 JRE ile çalıştır
FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]