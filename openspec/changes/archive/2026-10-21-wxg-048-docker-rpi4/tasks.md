# Tasks: Docker RPi4 Deployment

- [x] Create multistage `Dockerfile` with `node:22-alpine` and `NODE_OPTIONS="--max-old-space-size=384"`
- [x] Create `docker-compose.yml` with memory limit `480M` and `/health` check
- [x] Add `GET /health` endpoint in `src/api/router.ts`
- [x] Add deployment documentation in `docs/deploy-rpi4.md`
- [x] Validate OpenSpec change with `npx openspec validate 2026-10-21-wxg-048-docker-rpi4`
