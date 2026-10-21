# Design: Motor de Grafos & Consultas Relacionales (WXG-002)

## Arquitectura Hexagonal

### 1. Dominio (`src/domain/graph/`)
- **Entidades / Value Objects:**
  - `LoreRelationship`: `{ relationship_id, source_entity_id, target_entity_id, relationship_type, affinity_weight, description, last_updated_timestamp }`
  - `GraphPath`: `{ path: string[], total_affinity: number, relationships: LoreRelationship[] }`
- **Puerto de Repositorio:**
  - `GraphRepository`: Interface con `addRelationship`, `getRelationshipsByEntity`, `getAllRelationships`, `deleteRelationship`.
- **Servicio de Dominio (`GraphService`):**
  - Algoritmo de recorrido en anchura (BFS) / profundidad (DFS) para encontrar la ruta más corta/optima entre dos entidades.
  - Prevención de ciclos mediante conjunto de nodos visitados.
  - Retorno de arreglo vacío si las entidades no están conectadas.
  - Cero dependencias externas.

### 2. Infraestructura (`src/infrastructure/repositories/graphRepository.ts`)
- Implementación `SqliteGraphRepository` usando la base de datos SQLite WAL.
- Manejo de DDL `lore_relationships` con claves foráneas e índices compuestos en `(source_entity_id, target_entity_id)`.

### 3. Capa de API HTTP (`src/api/routes/graph.ts`)
- Routes Hono con validadores Zod:
  - `GET /api/v1/graph/relationships`: Lista relaciones de una entidad o todas.
  - `GET /api/v1/graph/path`: Calcula el camino relacional entre `source` y `target`.

### 4. Capa MCP (`src/mcp/tools/graphTools.ts`)
- Registra herramientas MCP:
  - `query_entity_graph`
  - `find_relationship_path`
