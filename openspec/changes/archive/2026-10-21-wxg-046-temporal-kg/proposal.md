# Proposal: Bi-Temporal Knowledge Graph Engine

## Why
Issue #46 requires bi-temporal support (`valid_from_chapter`, `valid_to_chapter`, `recorded_at`, `superseded_by`) in WuxiaGraph's relationship schema to track entity evolution, sect changes, cultivation realm progressions, and historical state queries across chapters.

## What Changes
- Extend SQLite schema (`schema.sql` and `src/infrastructure/schema.sql`) with bi-temporal columns and composite indexes (`idx_lore_relationships_temporal`).
- Update `SqliteGraphRepository` and `GraphService` with `getGraphAsOfChapter(chapterId: number)` support.
- Expose REST endpoint `GET /api/v1/graph/as-of/:chapterId` in `src/api/routes/graph.ts`.
- Add Vitest tests verifying temporal state queries and active edge filters (`valid_to_chapter IS NULL`).

## Definition of Done
- [ ] DDL updated with bi-temporal columns and temporal indexes.
- [ ] `getGraphAsOfChapter` implemented in domain and infrastructure.
- [ ] REST API `GET /api/v1/graph/as-of/:chapterId` verified in Vitest.
- [ ] OpenSpec change validated with `npx openspec validate 2026-10-21-wxg-046-temporal-kg`.
