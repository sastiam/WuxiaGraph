# Design: Bi-Temporal Knowledge Graph Architecture

## Schema Extensions
Add the following columns to `lore_relationships`:
- `valid_from_chapter` (INTEGER, DEFAULT 1)
- `valid_to_chapter` (INTEGER, NULLABLE)
- `recorded_at` (TEXT, DEFAULT CURRENT_TIMESTAMP)
- `superseded_by` (INTEGER, NULLABLE)

Composite Index:
`CREATE INDEX IF NOT EXISTS idx_lore_relationships_temporal ON lore_relationships(valid_from_chapter, valid_to_chapter);`

## Temporal Query Logic
When querying `as-of` chapter `C`:
`WHERE valid_from_chapter <= C AND (valid_to_chapter IS NULL OR valid_to_chapter > C)`

## Ports & Adapters
- **Repository Interface:** `IGraphRepository.getRelationshipsAsOf(chapterId: number)`
- **Domain Service:** `GraphService.getGraphAsOfChapter(chapterId: number)`
- **REST Route:** `GET /api/v1/graph/as-of/:chapterId`
