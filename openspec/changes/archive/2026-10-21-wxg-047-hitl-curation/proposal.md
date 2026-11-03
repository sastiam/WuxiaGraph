# Proposal: HitL Alias Curation API & Reactive Workflow

## Why
Issue #47 requires exposing HTTP endpoints for human-in-the-loop (HitL) alias review and connecting `HitLAliasQueue.vue` in Vue 3 so curators can approve or reject proposed alias mappings during novel ingestion.

## What Changes
- Implement Hono API routes `GET /api/v1/aliases/pending` and `POST /api/v1/aliases/:id/review` with Zod validation.
- Implement alias review logic in `CoreferenceEngine` / `HitLService` to update canonical entities and re-bind relationships on approval or discard on rejection.
- Update `HitLAliasQueue.vue` to reactively consume `/api/v1/aliases/` endpoints.
- Add Vitest integration tests in `tests/api/hitlCuration.test.ts`.

## Definition of Done
- [x] Endpoints `GET /api/v1/aliases/pending` and `POST /api/v1/aliases/:id/review` implemented.
- [x] Approval updates canonical entities and relationship pointers.
- [x] `HitLAliasQueue.vue` integrated with backend endpoints.
- [x] OpenSpec change validated with `npx openspec validate 2026-10-21-wxg-047-hitl-curation`.
