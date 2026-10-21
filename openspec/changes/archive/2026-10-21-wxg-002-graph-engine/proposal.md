# Proposal: Motor de Grafos & Consultas Relacionales (WXG-002)

## Por Qué (Why)
WuxiaGraph requiere modelar relaciones complejas (alianzas, enemistades, discipulado, rivalidades) entre entidades de lore (personajes, sectas, clanes), permitiendo consultas relacionales de N saltos y algoritmos de pathfinding sin dependencias externas en la capa de dominio.

## Contexto e Impacto
- **Impacto:** Permite a la IA y a los usuarios explorar conexiones entre entidades del lore, evaluar afinidad acumulada y trazar caminos de relación.
- **Alcance:**
  - Esquema DDL `lore_relationships` en SQLite WAL.
  - Repositorio de infraestructura para relaciones.
  - Servicio de dominio de grafo con BFS/DFS para pathfinding y matriz de alianzas.
  - Endpoints HTTP REST (`GET /api/v1/graph/relationships`, `GET /api/v1/graph/path`).
  - Herramientas MCP (`query_entity_graph`, `find_relationship_path`).
  - Suite E2E de integración (`tests/e2e/backendCore.test.ts`).

## Definition of Done (DoD)
- `lore_relationships` integrada en DDL.
- `pnpm typecheck` (`tsc --noEmit`) con 0 errores.
- Pruebas Vitest de dominio, infraestructura, HTTP API, MCP y E2E pasando al 100%.
