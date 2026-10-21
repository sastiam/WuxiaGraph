# Proposal: [WXG-020] Servicio de Grafo de Dominio: Algoritmo de Pathfinding (BFS/DFS) y Matriz de Alianzas

## Why
### 🎯 Objetivo & Contexto
Implementar la lógica de dominio en `src/domain/graph/` para cálculo de rutas relacionales entre dos entidades de lore y filtrado de alianzas/enemistades.

### 📋 Requisitos Técnicos
1. **Dominio (`src/domain/graph/graphService.ts`):**
   - Algoritmo de recorrido en anchura (BFS) / profundidad (DFS) para encontrar el camino más corto entre dos personajes/sectas.
   - Cálculo de afinidad ponderada acumulada.

### 🧪 Casos Borde & Verificación
- Detección y prevención de bucles infinitos en grafos cíclicos.
- Búsqueda de camino entre entidades desconectadas (retorna array vacío sin error).

### 🤖 Herramientas MCP Obligatorias para Agentes
- **Context7 MCP (`mcp__context7__query_docs`):** Consultar patrones de algoritmos de recorrido de grafos puros en TypeScript sin dependencias externas.
- **GitHub MCP (`mcp__github__*`):** Administrar comentarios y estado del issue con GitHub MCP.

### ✅ Criterios de Aceptación (Definition of Done)
- [ ] Tests de algoritmo en `tests/domain/graphService.test.ts` pasando al 100%.
- [ ] Cero dependencias externas en la capa de dominio.

## What Changes
- Implement changes for task: [WXG-020] Servicio de Grafo de Dominio: Algoritmo de Pathfinding (BFS/DFS) y Matriz de Alianzas

## Impact
- **Task ID**: `gh-16`
- **Priority**: `medium`
- **Contract ID**: `contract-gh-16-1792596075055`
- **Affected Specs**: `.openspec/changes/gh-16/specs/`
