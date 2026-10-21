# Tasks: Bi-Temporal Knowledge Graph Engine

- [x] Extend `schema.sql` and `src/infrastructure/schema.sql` with bi-temporal columns and index
- [x] Implement `getRelationshipsAsOf` in `SqliteGraphRepository` and `GraphService`
- [x] Add route `GET /api/v1/graph/as-of/:chapterId` with Zod validation in Hono API
- [x] Add Vitest tests in `tests/domain/temporalGraph.test.ts`
- [x] Validate OpenSpec change with `npx openspec validate 2026-10-21-wxg-046-temporal-kg`
