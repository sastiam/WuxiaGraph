# Design: Docker RPi4 ARM64 Packaging

## Multistage Build Strategy
- **Stage 1 (Builder):** `node:22-alpine`, install pnpm, build TypeScript backend & Vite frontend.
- **Stage 2 (Production):** `node:22-alpine`, copy dist & production dependencies, expose port 3000, set `ENV NODE_OPTIONS="--max-old-space-size=384"`.

## Docker Compose Limits
```yaml
services:
  wuxiagraph:
    build: .
    ports: ["3000:3000"]
    environment:
      - NODE_OPTIONS=--max-old-space-size=384
    deploy:
      resources:
        limits:
          memory: 480M
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:3000/health"]
      interval: 30s
```
