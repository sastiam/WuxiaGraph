# Proposal: [WXG-023] Componente Visualizador de Grafo Interactivo de Lore (Vue Flow / Vue 3)

## Why
### 🎯 Objetivo & Contexto
Desarrollar el componente de renderizado de grafo interactivo en **Vue 3** usando `@vue-flow/core` (Vue Flow) o Cytoscape.js para explorar entidades y relaciones.

### 📋 Requisitos Técnicos
1. **Visualizador de Grafo (`LoreGraphVisualizer.vue`):**
   - Renderizado de nodos (entidades) y aristas (relaciones).
   - Filtros dinámicos por dominio, tipo de relación y nivel de afinidad.
   - Panel lateral con detalles de la entidad al hacer clic.

### 🧪 Casos Borde & Verificación
- Rendimiento de renderizado con +500 nodos.
- Redimensionamiento responsive del canvas.

### 🤖 Herramientas MCP Obligatorias para Agentes
- **Context7 MCP (`mcp__context7__query_docs`):** Consultar patrones de Vue 3 Composition API para manejo reactivo de canvas y eventos de Vue Flow.
- **GitHub MCP (`mcp__github__*`):** Actualizar el estado del issue mediante GitHub MCP.

### ✅ Criterios de Aceptación (Definition of Done)
- [ ] Componente totalmente funcional en Vue 3 conectando con `/api/v1/graph/relationships`.

## What Changes
- Implement changes for task: [WXG-023] Componente Visualizador de Grafo Interactivo de Lore (Vue Flow / Vue 3)

## Impact
- **Task ID**: `gh-19`
- **Priority**: `medium`
- **Contract ID**: `contract-gh-19-1792601414450`
- **Affected Specs**: `.openspec/changes/gh-19/specs/`
