# Design: Core Architecture & Graph Engine

## Architecture & Data Schema
- **Data Persistence:** Tabla `lore_relationships` con Foreign Keys a `lore_entities` e índices compuestos.
- **Domain Service:** `GraphService` en `src/domain/graph/graphService.ts` implementa búsqueda de caminos en anchura (BFS) y profundidad (DFS) con cálculo de afinidad acumulada.
- **Adapters & MCP:** Endpoints Hono en `src/api/routes/graph.ts` y herramientas MCP en `src/mcp/tools/graphTools.ts`.
- **Isolation:** Tests E2E en `tests/e2e/backendCore.test.ts` ejecutan sobre bases de datos SQLite en memoria independientes por suite.
