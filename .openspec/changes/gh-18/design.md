# Design: [WXG-022] OpenSpec [WXG-003]: Setup Frontend Vue 3 + Vite + TailwindCSS + Pinia

## Technical Approach
Implement required changes for task `gh-18` according to specification:
### 🎯 Objetivo & Contexto
Configurar la estructura del proyecto frontend en `frontend/` usando **Vue 3** (Composition API, `<script setup>`), Vite, TailwindCSS, Pinia y soporte para TypeScript estricto.

### 📋 Requisitos Técnicos
1. **Toolchain Frontend Vue 3:**
   - Proyecto Vue 3 + Vite en `frontend/`.
   - Management de estado con Pinia y utilidades con `@vueuse/core`.
   - TailwindCSS configurado para diseño oscuro / KDE Breeze Dark.
   - Cliente de API Fetch preconfigurado para conectar con el backend de Hono.

### 🧪 Casos Borde & Verificación
- Compilación de producción limpia (`pnpm build`).
- Linter ESLint / vue-tsc sin errores.

### 🤖 Herramientas MCP Obligatorias para Agentes
- **Context7 MCP (`mcp__context7__query_docs`):** Consultar documentación oficial de Vue 3 (`/websites/vuejs`) y Pinia (`/vuejs/pinia`) para configuración idiomática de tiendas.
- **GitHub MCP (`mcp__github__*`):** Manipular el estado del issue y comentar progresos vía GitHub MCP.

### ✅ Criterios de Aceptación (Definition of Done)
- [ ] Aplicación base Vue 3 ejecutando y conectada al backend de WuxiaGraph.

## Architecture Context
Standard repository boundaries and conventions apply.

## Risks & Verification
- Execute contract verification steps:
  - Run unit tests
  - Run typecheck
