# Multi-stage Dockerfile for Spring Boot 3 Backend
FROM maven:3.9.6-eclipse-temurin-21-jammy AS build
WORKDIR /app

# Cache dependencies
ENV MAVEN_OPTS="-Xmx384m -XX:+UseSerialGC"

COPY pom.xml .
RUN mvn dependency:go-offline -B

# Build application artifact
COPY src ./src
RUN mvn clean package -DskipTests

# Minimal secure runtime image
FROM eclipse-temurin:21-jre-jammy
WORKDIR /app

# Run as non-root user for security
RUN groupadd -r spring && useradd -r -g spring spring
USER spring:spring

COPY --from=build /app/target/*.jar app.jar

ENV PORT=8080
ENV JAVA_OPTS="-Xmx384m -XX:+UseSerialGC"
EXPOSE 8080

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -Dserver.port=${PORT:-8080} -Djava.security.egd=file:/dev/./urandom -jar app.jar"]
