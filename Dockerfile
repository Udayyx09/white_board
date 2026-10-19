# ==========================================
# Stage 1: Build React 19 Frontend
# ==========================================
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

# ==========================================
# Stage 2: Build Spring Boot 3 Backend
# ==========================================
FROM maven:3.9.6-eclipse-temurin-21-jammy AS backend-builder
WORKDIR /app/backend

COPY backend/pom.xml .
RUN mvn dependency:go-offline -B

COPY backend/src ./src

# Bundle compiled frontend into Spring Boot static assets
COPY --from=frontend-builder /app/frontend/dist/ ./src/main/resources/static/

RUN mvn clean package -DskipTests

# ==========================================
# Stage 3: Secure Production Runtime
# ==========================================
FROM eclipse-temurin:21-jre-jammy
WORKDIR /app

RUN groupadd -r spring && useradd -r -g spring spring
USER spring:spring

COPY --from=backend-builder /app/backend/target/*.jar app.jar

ENV PORT=8080
EXPOSE 8080

ENTRYPOINT ["sh", "-c", "java -Dserver.port=${PORT:-8080} -Djava.security.egd=file:/dev/./urandom -jar app.jar"]
