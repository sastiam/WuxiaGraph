# Spec: Graph Engine Capability

## ADDED Requirements

### Requirement: DDL lore_relationships
The SQLite WAL schema SHALL contain a `lore_relationships` table with fields `relationship_id` (PRIMARY KEY TEXT), `source_entity_id` (TEXT REFERENCES lore_entities(entity_id)), `target_entity_id` (TEXT REFERENCES lore_entities(entity_id)), `relationship_type` (TEXT), `affinity_weight` (REAL), `description` (TEXT), and `last_updated_timestamp` (DATETIME). It SHALL feature composite indexes on `source_entity_id` and `target_entity_id`.

#### Scenario: Schema initialization
- **WHEN** the SQLite database initializes
- **THEN** the `lore_relationships` table and composite indexes are created if they do not exist.

### Requirement: Domain Graph Service Pathfinding
The `GraphService` SHALL provide path calculation using BFS/DFS, handle cyclic graphs without infinite loops, return an empty path when no connection exists, and compute cumulative affinity weight.

#### Scenario: Calculating shortest path between entities
- **WHEN** querying a path between two connected entities
- **THEN** it returns the array of node IDs and the total accumulated affinity weight.

#### Scenario: Cyclic graph handling
- **WHEN** querying a path in a graph with cycles
- **THEN** it avoids infinite recursion and returns the correct path.

### Requirement: REST API Endpoints
The HTTP API SHALL expose `GET /api/v1/graph/relationships` and `GET /api/v1/graph/path` with Zod validation.

#### Scenario: Querying relationships via HTTP
- **WHEN** sending a GET request to `/api/v1/graph/relationships`
- **THEN** it returns JSON array of relationships with 200 OK status.

### Requirement: MCP Tools
The MCP server SHALL register tools `query_entity_graph` and `find_relationship_path`.

#### Scenario: Executing query_entity_graph tool
- **WHEN** invoking `query_entity_graph` with entity_id
- **THEN** it returns formatted relationships for that entity.
