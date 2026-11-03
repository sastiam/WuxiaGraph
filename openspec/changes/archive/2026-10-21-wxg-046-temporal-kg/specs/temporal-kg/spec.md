# Capability: Bi-Temporal Knowledge Graph

## ADDED Requirements

### Requirement: Bi-Temporal Schema and Relationship History
The system MUST support bi-temporal tracking (`valid_from_chapter`, `valid_to_chapter`, `recorded_at`, `superseded_by`) in relationship persistence without overwriting historical states.

#### Scenario: Temporal Relationship Mutation
- **WHEN** a relationship state changes in chapter `N`
- **THEN** the existing relationship record has `valid_to_chapter` set to `N` and the new relationship version is inserted with `valid_from_chapter = N`.

### Requirement: Frozen Subgraph Query As-Of Chapter
The system MUST expose an endpoint `GET /api/v1/graph/as-of/:chapterId` returning the graph state frozen at chapter `C`.

#### Scenario: Query As-Of Chapter
- **WHEN** a request is sent to `GET /api/v1/graph/as-of/50`
- **THEN** only relationships active at chapter 50 (`valid_from_chapter <= 50 AND (valid_to_chapter IS NULL OR valid_to_chapter > 50)`) are returned.
