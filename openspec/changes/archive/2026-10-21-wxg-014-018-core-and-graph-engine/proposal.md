# Proposal: Core Architecture, Graph Engine & E2E Integration Suite

## Why
WuxiaGraph requiere validar la integridad referencial del modelo relacional de lore (`lore_relationships`), la lógica de algoritmos de pathfinding BFS/DFS en el servicio de dominio, la exposición vía endpoints REST Hono y herramientas MCP, así como la suite de pruebas End-to-End en bases de datos SQLite en memoria.

## Context & Impact
- **Módulos Afectados:** `src/infrastructure/schema.sql`, `src/domain/graph/graphService.ts`, `src/api/routes/graph.ts`, `src/mcp/tools/graphTools.ts`, `tests/e2e/backendCore.test.ts`, `frontend/`.
- **Análisis Graphify:** Valida los hubs de infraestructura (`database.ts`), dominio (`graphService.ts`) y API (`router.ts`).

## Definition of Done
- Pruebas unitarias y E2E pasando al 100% en `:memory:`.
- `lore_relationships` integrado en la inicialización DDL de SQLite.
- Algoritmos BFS/DFS y matriz de alianzas expuestos vía HTTP REST y MCP Server.
- Estructura base Vue 3 compilando sin errores.
