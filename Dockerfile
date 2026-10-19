# ==========================================
# Stage 1: Build Spring Boot JAR
# (Static frontend is pre-bundled in src/main/resources/static)
# ==========================================
FROM maven:3.9.6-eclipse-temurin-21-jammy AS build
WORKDIR /app

ENV MAVEN_OPTS="-Xmx384m -XX:+UseSerialGC"

# Cache Maven dependencies
COPY backend/pom.xml .
RUN mvn dependency:go-offline -B

# Copy backend source (includes pre-bundled static frontend)
COPY backend/src ./src

# Compile & package application with strict memory bounds
RUN mvn clean package -DskipTests -DargLine="-Xmx384m"

# ==========================================
# Stage 2: Lightweight Production Runtime
# ==========================================
FROM eclipse-temurin:21-jre-jammy
WORKDIR /app

# Run as non-root user for security
RUN groupadd -r spring && useradd -r -g spring spring
USER spring:spring

COPY --from=build /app/target/*.jar app.jar

ENV PORT=8080
EXPOSE 8080

ENTRYPOINT ["sh", "-c", "java -Xmx384m -Xms256m -Dserver.port=${PORT:-8080} -Djava.security.egd=file:/dev/./urandom -jar app.jar"]
