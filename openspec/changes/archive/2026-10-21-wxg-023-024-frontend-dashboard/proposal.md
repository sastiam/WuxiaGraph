# Proposal: Frontend Dashboard & Graph Visualizer Integration (Vue 3)

## Why
El frontend de WuxiaGraph requiere conectar la interfaz de usuario Vue 3 con las APIs del backend para permitir la exploración interactiva del grafo de lore y el control de gobernanza/dreaming con circuito de bloqueo.

## Context & Impact
- **Módulos Afectados:** `frontend/src/components/LoreGraphVisualizer.vue`, `frontend/src/components/GovernancePanel.vue`, `frontend/src/components/DreamingConsole.vue`, `frontend/src/stores/lore.ts`.
- **Análisis Graphify:** Afecta a `App.vue` y `main.ts` que consumen estos componentes.

## Definition of Done
- `LoreGraphVisualizer.vue` consume `/api/v1/graph/relationships` con soporte de paginación por profundidad (`depth`), filtros dinámicos (dominio, afinidad) y panel lateral interactivo.
- `GovernancePanel.vue` y `DreamingConsole.vue` se deshabilitan mostrando un banner de alerta al recibir HTTP `423 Locked` (exceso del budget de 4.0h), e integran `/api/v1/wip/log` y `/api/v1/dreaming/distill`.
- Pruebas unitarias/E2E pasando y `npx openspec validate wxg-023-024-frontend-dashboard` exitoso.
