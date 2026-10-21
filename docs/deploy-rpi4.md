# Guía de Despliegue en Raspberry Pi 4 (ARM64) — WuxiaGraph

Esta guía detalla los pasos, optimizaciones y configuración requerida para desplegar **WuxiaGraph** en entornos de recursos limitados, específicamente **Raspberry Pi 4 Model B (ARM64)** y nodos edge o cloud de bajo consumo.

---

## 1. Arquitectura y Restricciones de Recursos

En un entorno Edge como el Raspberry Pi 4 (1GB, 2GB, 4GB u 8GB RAM), los servicios en ejecución deben mantener una huella de memoria (RSS) predecible y contenida para evitar invocaciones del Kernel OOM Killer.

- **Límite de memoria en contenedor (Cgroup limit):** `480MB`
- **Límite de V8 Heap (Node.js runtime):** `384MB` (`--max-old-space-size=384`)
- **Base image:** Alpine Linux (`node:22-alpine`) para minimizar la superficie de ataque y el uso de almacenamiento.
- **Arquitectura de build:** Multietapa (Multistage build), desacoplando compiladores (tsc, vite) de los artefactos de ejecución.

---

## 2. Dockerfile Multistage

El archivo `Dockerfile` optimizado implementa dos etapas:
1. **Builder:** Habilita `corepack` con `pnpm`, instala dependencias completas, compila el backend TypeScript (`pnpm build`) y la interfaz frontend (`frontend/dist`), ejecutando finalmente `pnpm prune --prod` para depurar `devDependencies`.
2. **Production:** Imagen limpia `node:22-alpine` con `NODE_OPTIONS="--max-old-space-size=384"` y `PORT=3000`. Únicamente contiene `node_modules` de producción y los archivos compilados en `dist/`.

```dockerfile
# Stage 1: Builder
FROM node:22-alpine AS builder
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@12.14.0 --activate
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY tsconfig.json ./
COPY src/ ./src/
RUN pnpm build
COPY frontend/ ./frontend/
RUN if [ -f "frontend/package.json" ]; then \
      cd frontend && \
      corepack enable && \
      pnpm install --frozen-lockfile && \
      pnpm build; \
    fi
RUN pnpm prune --prod

# Stage 2: Production
FROM node:22-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=384"
ENV PORT=3000

COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src/infrastructure/schema.sql ./dist/infrastructure/schema.sql
COPY --from=builder /app/frontend/dist ./frontend/dist

EXPOSE 3000
CMD ["node", "dist/index.js"]
```

---

## 3. Configuración con Docker Compose

El archivo `docker-compose.yml` define los límites de cgroup v2, política de reinicio, health check y volumen persistente:

```yaml
services:
  wuxiagraph:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_OPTIONS=--max-old-space-size=384
      - NODE_ENV=production
      - PORT=3000
    deploy:
      resources:
        limits:
          memory: 480M
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    volumes:
      - wuxiagraph_data:/app/data
    restart: unless-stopped

volumes:
  wuxiagraph_data:
```

---

## 4. Persistencia de Datos y SQLite WAL

WuxiaGraph opera con SQLite nativo (`node:sqlite`) bajo el modo **WAL (Write-Ahead Logging)**:
- El volumen persistente `wuxiagraph_data` asegura que los ficheros de base de datos (`.db`, `.db-wal`, `.db-shm`) permanezcan intactos entre reinicios y actualizaciones del contenedor.
- En Raspberry Pi, se recomienda alojar el volumen sobre almacenamiento SSD USB 3.0 o tarjetas microSD Clase A2 / U3 para garantizar alto rendimiento de escritura en el WAL de SQLite.

---

## 5. Health Check y Monitoreo

El contenedor expone el endpoint `GET /health` que responde `200 OK`:
```json
{
  "status": "ok",
  "timestamp": "2026-10-21T15:30:00.000Z"
}
```

Docker ejecuta periódicamente `wget -qO- http://localhost:3000/health` cada 30 segundos. Si el servicio no responde satisfactoriamente tras 3 reintentos, el estado del contenedor pasa a `unhealthy`.

---

## 6. Comandos Operativos

### Iniciar el servicio en segundo plano
```bash
docker compose up -d --build
```

### Consultar estado y métricas de memoria
```bash
# Ver estado del contenedor y healthcheck
docker compose ps

# Monitorear consumo de RAM en tiempo real (<480MB)
docker stats wuxiagraph
```

### Probar endpoint de salud
```bash
curl -i http://localhost:3000/health
```

### Detener el servicio
```bash
docker compose down
```
