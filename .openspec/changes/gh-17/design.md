# Design: [WXG-021] Endpoints REST & Herramientas MCP para el Motor de Grafos

## Technical Approach
Implement required changes for task `gh-17` according to specification:
### 🎯 Objetivo & Contexto
Exponer los endpoints HTTP en Hono (`GET /api/v1/graph/relationships`, `GET /api/v1/graph/path`) y las herramientas MCP (`query_entity_graph`, `find_relationship_path`).

### 📋 Requisitos Técnicos
1. **API & MCP (`src/api/routes/graph.ts`, `src/mcp/tools/graphTools.ts`):**
   - Endpoints HTTP con validadores Zod.
   - Herramientas MCP registradas en el servidor MCP.

### 🧪 Casos Borde & Verificación
- Validación de parámetros de entrada con Zod.
- Respuestas en formato JSON estructurado según estándar MCP.

### 🤖 Herramientas MCP Obligatorias para Agentes
- **Context7 MCP (`mcp__context7__query_docs`):** Consultar documentación oficial de Hono (`/honojs/hono`) para rutas parametrizadas.
- **GitHub MCP (`mcp__github__*`):** Actualizar estado y vincular PRs vía MCP.

### ✅ Criterios de Aceptación (Definition of Done)
- [ ] Pruebas de integración HTTP y MCP con Vitest.

## Architecture Context
Standard repository boundaries and conventions apply.

## Risks & Verification
- Execute contract verification steps:
  - Run unit tests
  - Run typecheck
