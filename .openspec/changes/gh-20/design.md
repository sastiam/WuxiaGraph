# Design: [WXG-024] Panel de Gobernanza WIP & Consola de Dreaming en Vue 3

## Technical Approach
Implement required changes for task `gh-20` according to specification:
### 🎯 Objetivo & Contexto
Crear el dashboard de monitoreo del budget de horas semanal (Circuit Breaker 4.0h) y la consola interactiva para destilación de capítulos de lore en **Vue 3**.

### 📋 Requisitos Técnicos
1. **Módulos Frontend Vue 3 (`GovernanceLedgerWidget.vue`, `DreamingConsole.vue`):**
   - Barra de estado de gobernanza WIP con alerta visual al alcanzar 4.0h.
   - Consola de Dreaming: Input de texto + preview de hechos narrativos extraídos con confirmación de canon.

### 🧪 Casos Borde & Verificación
- Indicación inmediata del código de bloqueo `423 Locked`.
- Edición previa a la confirmación de hechos narrativos.

### 🤖 Herramientas MCP Obligatorias para Agentes
- **Context7 MCP (`mcp__context7__query_docs`):** Consultar patrones de consumo de APIs reactivas y manejo de errores 423 con Vue 3 + Pinia.
- **GitHub MCP (`mcp__github__*`):** Manipular el estado y cerrar la tarea mediante GitHub MCP.

### ✅ Criterios de Aceptación (Definition of Done)
- [ ] Consola probada e integrada con los endpoints `/api/v1/wip/log` y `/api/v1/dreaming/distill`.

## Architecture Context
Standard repository boundaries and conventions apply.

## Risks & Verification
- Execute contract verification steps:
  - Run unit tests
  - Run typecheck
