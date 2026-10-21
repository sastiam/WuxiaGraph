# Spec: Core Architecture & Graph Engine

## ADDED Requirements

### Requirement: E2E In-Memory Test Suite Isolation
`tests/e2e/backendCore.test.ts` SHALL execute end-to-end integration workflows using isolated SQLite in-memory databases.

#### Scenario: Running full lifecycle test
- **WHEN** vitest executes the E2E test suite
- **THEN** SQLite creates a fresh `:memory:` database with full schema initialization and tears down without side effects

### Requirement: Relational Lore Graph Querying
The backend SHALL store and query relational links between entities with BFS/DFS pathfinding.

#### Scenario: Querying relationship path
- **WHEN** client calls `/api/v1/graph/path?sourceId=<A>&targetId=<B>`
- **THEN** system calculates the shortest relationship path and returns node sequence with cumulative affinity
