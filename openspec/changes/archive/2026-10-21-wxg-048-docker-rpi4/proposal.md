# Proposal: Optimized Docker Deployment for Raspberry Pi 4 (ARM64)

## Why
Issue #48 requires optimizing WuxiaGraph for resource-constrained Edge devices (Raspberry Pi 4 ARM64) and Cloud instances by enforcing a strict RSS memory footprint <500MB (<480MB container RAM limit).

## What Changes
- Create multistage `Dockerfile` based on `node:22-alpine` with `NODE_OPTIONS="--max-old-space-size=384"`.
- Configure `docker-compose.yml` with `deploy.resources.limits.memory: 480M`, healthcheck at `/health`, and SQLite WAL volume persistence.
- Add `/health` route in `src/api/router.ts`.
- Document Raspberry Pi 4 deployment instructions in `docs/deploy-rpi4.md`.
- Add Docker build & config verification tests.

## Definition of Done
- [x] Multistage `Dockerfile` and `docker-compose.yml` created and validated.
- [x] Route `GET /health` responding `200 OK`.
- [x] Memory limit configured at 480MB.
- [x] OpenSpec change validated with `npx openspec validate 2026-10-21-wxg-048-docker-rpi4`.
