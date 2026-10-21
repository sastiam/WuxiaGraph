# docker-rpi4 Specification

## Purpose
TBD - created by archiving change 2026-10-21-wxg-048-docker-rpi4. Update Purpose after archive.

## Requirements

### Requirement: Low-Memory Multistage Docker Container
The system MUST provide a multistage `Dockerfile` built on `node:22-alpine` with V8 heap capped at 384MB and memory limit of 480MB.

#### Scenario: Build and Run Low-Memory Container
- **WHEN** the container is launched via `docker-compose up`
- **THEN** memory consumption remains below 480MB RSS and `/health` responds with `200 OK`.

### Requirement: Application Health Check
The API MUST expose `GET /health` returning status `200 OK` and system status JSON.

#### Scenario: Health Check Execution
- **WHEN** a GET request is sent to `/health`
- **THEN** HTTP 200 is returned with `{ status: "ok", timestamp: "..." }`.
