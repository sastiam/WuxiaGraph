# Design: Frontend Dashboard (Vue 3, Pinia, Vue Flow)

## Architecture & Integration
- **State Management:** Pinia Store (`lore.ts`) gestiona el estado global de entidades, relaciones, cuota WIP y estado de bloqueo (`isLocked: boolean`).
- **Graph Visualization:** `@vue-flow/core` renderiza nodos y aristas con controles de zoom/pan y paginación por profundidad enviando parámetros `depth` a `/api/v1/graph/relationships`.
- **Governance & Circuit Breaker:** Interceptor o manejador de errores en `GovernancePanel` y `DreamingConsole` que detecta respuestas HTTP `423 Locked`, actualiza `isLocked` a `true` y deshabilita todos los inputs y botones de interacción.
