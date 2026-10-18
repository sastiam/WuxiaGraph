# OpenSpec [WXG-003]: Frontend Dashboard & Graph Visualizer (Vue 3)

## 1. Intent & Capability
Proveer una interfaz de usuario interactiva y web en tiempo real desarrollada en **Vue 3** para visualizar el grafo de entidades de lore de WuxiaGraph, monitorear el ledger de gobernanza WIP (Circuit Breaker de 4.0h) y operar la consola de destilación de hechos (Consola Dreaming).

## 2. Invariantes de Arquitectura & Código
- **Framework Frontend:** Vue 3 (Composition API, `<script setup>`) + Vite + TailwindCSS.
- **Visualizador de Grafos:** `@vue-flow/core` (Vue Flow) / Cytoscape.js para renderizado interactivo de nodos y aristas.
- **Manejo de Estado:** Pinia + VueUse.
- **Seguridad:** Comunicación exclusiva vía cliente API REST y WebSocket con el Backend de WuxiaGraph.

## 3. Componentes Principales
1. **Interactive Graph Explorer (`LoreGraphVisualizer.vue`):**
   - Renderizado de entidades como nodos y relaciones como aristas coloreadas por afinidad.
   - Filtros dinámicos por dominio, estado y tipo de relación.
2. **WIP Governance Monitor (`GovernanceLedgerWidget.vue`):**
   - Barra de progreso del budget semanal (0.0h a 4.0h).
   - Indicador de estado del Circuit Breaker (`IN_LIMITS` vs `LOCKED_BY_WIP`).
3. **Dreaming Console (`DreamingConsole.vue`):**
   - Panel Human-in-the-Loop para pegar prosa de capítulos, revisar hechos destilados antes de confirmar canon y editar entidades.

## 4. Casos Borde & Pruebas Exigidas
- Renderizado fluido con +500 nodos y +1000 aristas en el canvas.
- Respuesta visual inmediata ante el estado de bloqueo `423 Locked` de la API de gobernanza WIP.
- Manejo de pérdida de conexión HTTP/WS con reconexión automática.
