# Graph Report - WuxiaGraph  (2026-10-21)

## Corpus Check
- 117 files · ~34,962 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 9 file(s) not represented in the graph (top: (none) 7, .css 1, .tsbuildinfo 1)

## Summary
- 887 nodes · 1287 edges · 68 communities (64 shown, 4 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 28 edges (avg confidence: 0.9)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `55c9637d`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- schemas/dreaming.ts
- dreaming/service.ts
- tools/index.ts
- frontend/package.json
- LoreGraphVisualizer.vue
- database.ts
- package.json
- compilerOptions
- Protocolo de Agentes & Reglas de Desarrollo — WuxiaGraph
- GovernancePanel.vue
- compilerOptions
- DreamingConsole.vue
- WipGovernanceLedger
- vue
- App.vue
- Requirement: Exposición de Endpoints REST de Servicios Canónicos
- Contract: [WXG-020] Servicio de Grafo de Dominio: Algoritmo de Pathfinding (BFS/DFS) y Matriz de Alianzas
- Contract: [WXG-020] Servicio de Grafo de Dominio: Algoritmo de Pathfinding (BFS/DFS) y Matriz de Alianzas
- Contract: [WXG-021] Endpoints REST & Herramientas MCP para el Motor de Grafos
- Contract: [WXG-021] Endpoints REST & Herramientas MCP para el Motor de Grafos
- Contract: [WXG-022] OpenSpec [WXG-003]: Setup Frontend Vue 3 + Vite + TailwindCSS + Pinia
- Contract: [WXG-022] OpenSpec [WXG-003]: Setup Frontend Vue 3 + Vite + TailwindCSS + Pinia
- Contract: [WXG-022] OpenSpec [WXG-003]: Setup Frontend Vue 3 + Vite + TailwindCSS + Pinia
- Contract: [WXG-022] OpenSpec [WXG-003]: Setup Frontend Vue 3 + Vite + TailwindCSS + Pinia
- Contract: [WXG-022] OpenSpec [WXG-003]: Setup Frontend Vue 3 + Vite + TailwindCSS + Pinia
- Contract: [WXG-023] Componente Visualizador de Grafo Interactivo de Lore (Vue Flow / Vue 3)
- Contract: [WXG-023] Componente Visualizador de Grafo Interactivo de Lore (Vue Flow / Vue 3)
- Contract: [WXG-023] Componente Visualizador de Grafo Interactivo de Lore (Vue Flow / Vue 3)
- Contract: [WXG-023] Componente Visualizador de Grafo Interactivo de Lore (Vue Flow / Vue 3)
- Contract: [WXG-023] Componente Visualizador de Grafo Interactivo de Lore (Vue Flow / Vue 3)
- Contract: [WXG-024] Panel de Gobernanza WIP & Consola de Dreaming en Vue 3
- Contract: [WXG-024] Panel de Gobernanza WIP & Consola de Dreaming en Vue 3
- Contract: [WXG-024] Panel de Gobernanza WIP & Consola de Dreaming en Vue 3
- Contract: [WXG-024] Panel de Gobernanza WIP & Consola de Dreaming en Vue 3
- Contract: [WXG-024] Panel de Gobernanza WIP & Consola de Dreaming en Vue 3
- Estándar Internacional de Seguridad de Paquetes y Cadena de Suministro (Supply Chain Security)
- Technical Approach
- Why
- Technical Approach
- Why
- Technical Approach
- Why
- Technical Approach
- Why
- Technical Approach
- Why
- Proposal
- lore.ts
- OpenSpec [WXG-001]: Backend Core Architecture, Graph Engine, Circuit Breaker & MCP Server
- SOUL.md — Principios, Identidad & Estándares de Sebastian Chota (@sastiam)
- Tasks: [WXG-020] Servicio de Grafo de Dominio: Algoritmo de Pathfinding (BFS/DFS) y Matriz de Alianzas
- Tasks: [WXG-021] Endpoints REST & Herramientas MCP para el Motor de Grafos
- Tasks: [WXG-022] OpenSpec [WXG-003]: Setup Frontend Vue 3 + Vite + TailwindCSS + Pinia
- Tasks: [WXG-023] Componente Visualizador de Grafo Interactivo de Lore (Vue Flow / Vue 3)
- Tasks: [WXG-024] Panel de Gobernanza WIP & Consola de Dreaming en Vue 3
- WuxiaGraph: Project Overview
- OpenSpec [WXG-003]: Frontend Dashboard & Graph Visualizer (Vue 3)
- Interactive Socratic Plan Contract
- ADDED Requirements
- ADDED Requirements
- ADDED Requirements
- ADDED Requirements
- ADDED Requirements
- Tarea WXG-025: Extensión del Grafo Canónico de Lore para Eventos Wuxia
- WuxiaGraph Project Rules for Hermes Agent
- README.md

## God Nodes (most connected - your core abstractions)
1. `LoreEntity` - 22 edges
2. `WipGovernanceLedger` - 22 edges
3. `NarrativeFact` - 20 edges
4. `compilerOptions` - 18 edges
5. `IWipGovernanceRepository` - 16 edges
6. `compilerOptions` - 15 edges
7. `IDreamingRepository` - 14 edges
8. `SqliteDreamingRepository` - 14 edges
9. `WipLimitExceededError` - 13 edges
10. `createApp()` - 13 edges

## Surprising Connections (you probably didn't know these)
- `Decisions` --references--> `WipLimitExceededError`  [INFERRED]
  openspec/changes/wxg-017-http-api-hono/design.md → src/domain/governance/errors.ts
- `What Changes` --references--> `WipLimitExceededError`  [INFERRED]
  openspec/changes/wxg-017-http-api-hono/proposal.md → src/domain/governance/errors.ts
- `Context` --references--> `ContextInjectorService`  [INFERRED]
  openspec/changes/wxg-017-http-api-hono/design.md → src/domain/context/contextInjectorService.ts
- `2. Invariantes Implementadas` --references--> `IContextRepository`  [INFERRED]
  openspec/changes/wxg-016-mcp-server.md → src/domain/context/types.ts
- `2. Invariantes Implementadas` --references--> `IDreamingRepository`  [INFERRED]
  openspec/changes/wxg-016-mcp-server.md → src/domain/dreaming/repository.ts

## Import Cycles
- None detected.

## Communities (68 total, 4 thin omitted)

### Community 0 - "schemas/dreaming.ts"
Cohesion: 0.29
Nodes (6): DistillEntityDto, DistillEntitySchema, DistillFactDto, DistillFactSchema, DistillRequestDto, DistillRequestSchema

### Community 1 - "dreaming/service.ts"
Cohesion: 0.08
Nodes (31): 1. Esquemas y Enrutador de Gobernanza WIP, 2. Enrutador Principal, Middlewares y Servidor Central, 3. Pruebas de Integración y Verificación, Tasks, createDreamingRouter(), buildLoreEntity(), buildNarrativeFact(), extractFactsFromText() (+23 more)

### Community 2 - "tools/index.ts"
Cohesion: 0.09
Nodes (33): 3.1. Umbrales de Vulnerabilidad (CVE / CVSS), 3.2. Salud del Proyecto y OpenSSF Scorecard, 3.3. Cumplimiento de Licenciamiento (License Compliance), 3. Criterios Obligatorios para la Aceptación de Paquetes, zod, MCP_PROTOCOL_VERSION, MCP_SERVER_INFO, McpServer (+25 more)

### Community 3 - "frontend/package.json"
Cohesion: 0.05
Nodes (36): dependencies, pinia, vue, @vue-flow/background, @vue-flow/controls, @vue-flow/core, @vueuse/core, devDependencies (+28 more)

### Community 4 - "LoreGraphVisualizer.vue"
Cohesion: 0.07
Nodes (21): containerRef, draggedNodeId, filterCanonOnly, filteredNodeMatches, GraphLink, graphLinks, graphNodes, height (+13 more)

### Community 5 - "database.ts"
Cohesion: 0.07
Nodes (46): 1. Contexto & Propósito, 2. Invariantes Implementadas, OpenSpec Change Proposal: WXG-015 Context Injector Service, hono, vitest, contextQuerySchema, createContextRouter(), buildImmutablePromptPrefix() (+38 more)

### Community 6 - "package.json"
Cohesion: 0.06
Nodes (31): author, dependencies, hono, @hono/node-server, zod, description, devDependencies, tsx (+23 more)

### Community 7 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowImportingTsExtensions, baseUrl, isolatedModules, jsx, lib, module, moduleResolution (+11 more)

### Community 8 - "Protocolo de Agentes & Reglas de Desarrollo — WuxiaGraph"
Cohesion: 0.11
Nodes (16): 1. Principio Fundamental: Spec-Driven Development (OpenSpec), 2. Invariantes Arquitectónicas (Clean Architecture / DDD), 3. Estándar de Código: Cero `any`, Cero Espagueti, Cero Código Muerto, 4. Pruebas Automatizadas Obligatorias por Ticket, 5. Gobernanza WIP y Regla del 4/1, Protocolo de Agentes & Reglas de Desarrollo — WuxiaGraph, Regla de Dependencia:, Reglas de cada capa: (+8 more)

### Community 9 - "GovernancePanel.vue"
Cohesion: 0.11
Nodes (14): error, filteredProposals, GovernanceProposal, isWipLoading, newCategory, newProposer, newRequiredHours, newSummary (+6 more)

### Community 10 - "compilerOptions"
Cohesion: 0.11
Nodes (17): compilerOptions, declaration, esModuleInterop, forceConsistentCasingInFileNames, isolatedModules, lib, module, moduleResolution (+9 more)

### Community 11 - "DreamingConsole.vue"
Cohesion: 0.12
Nodes (16): chapterSource, customEntitiesJson, DistilledEntityItem, DistilledFactItem, domain, DreamingLogEntry, emit, filteredLogs (+8 more)

### Community 12 - "WipGovernanceLedger"
Cohesion: 0.10
Nodes (14): 1. Contexto & Propósito, 2. Invariantes Implementadas, 3. Verificación & Casos Borde Cubiertos, OpenSpec Change Proposal: WXG-016 MCP Server & Tools, Context, Decisions, Design, Goals / Non-Goals (+6 more)

### Community 13 - "vue"
Cohesion: 0.25
Nodes (5): *.vue, app, pinia, pinia, vue

### Community 14 - "App.vue"
Cohesion: 0.25
Nodes (5): currentTab, loreStore, selectedDomain, TabView, DistillSuccessData

### Community 17 - "Requirement: Exposición de Endpoints REST de Servicios Canónicos"
Cohesion: 0.17
Nodes (11): ADDED Requirements, Purpose, Requirement: Exposición de Endpoints REST de Servicios Canónicos, Requirement: Gestión Centralizada de Errores y Validaciones, Scenario: Error de Validación Zod, Scenario: Error Inesperado no Controlado, Scenario: Exceso de Límite WIP (Circuit Breaker), Scenario: Petición exitosa a /api/v1/context/inject (+3 more)

### Community 18 - "Contract: [WXG-020] Servicio de Grafo de Dominio: Algoritmo de Pathfinding (BFS/DFS) y Matriz de Alianzas"
Cohesion: 0.18
Nodes (10): 🧪 Casos Borde & Verificación, Contract: [WXG-020] Servicio de Grafo de Dominio: Algoritmo de Pathfinding (BFS/DFS) y Matriz de Alianzas, ✅ Criterios de Aceptación (Definition of Done), 🤖 Herramientas MCP Obligatorias para Agentes, Post-conditions, Pre-conditions, Proposed Changes, 📋 Requisitos Técnicos (+2 more)

### Community 19 - "Contract: [WXG-020] Servicio de Grafo de Dominio: Algoritmo de Pathfinding (BFS/DFS) y Matriz de Alianzas"
Cohesion: 0.18
Nodes (10): 🧪 Casos Borde & Verificación, Contract: [WXG-020] Servicio de Grafo de Dominio: Algoritmo de Pathfinding (BFS/DFS) y Matriz de Alianzas, ✅ Criterios de Aceptación (Definition of Done), 🤖 Herramientas MCP Obligatorias para Agentes, Post-conditions, Pre-conditions, Proposed Changes, 📋 Requisitos Técnicos (+2 more)

### Community 20 - "Contract: [WXG-021] Endpoints REST & Herramientas MCP para el Motor de Grafos"
Cohesion: 0.18
Nodes (10): 🧪 Casos Borde & Verificación, Contract: [WXG-021] Endpoints REST & Herramientas MCP para el Motor de Grafos, ✅ Criterios de Aceptación (Definition of Done), 🤖 Herramientas MCP Obligatorias para Agentes, Post-conditions, Pre-conditions, Proposed Changes, 📋 Requisitos Técnicos (+2 more)

### Community 21 - "Contract: [WXG-021] Endpoints REST & Herramientas MCP para el Motor de Grafos"
Cohesion: 0.18
Nodes (10): 🧪 Casos Borde & Verificación, Contract: [WXG-021] Endpoints REST & Herramientas MCP para el Motor de Grafos, ✅ Criterios de Aceptación (Definition of Done), 🤖 Herramientas MCP Obligatorias para Agentes, Post-conditions, Pre-conditions, Proposed Changes, 📋 Requisitos Técnicos (+2 more)

### Community 22 - "Contract: [WXG-022] OpenSpec [WXG-003]: Setup Frontend Vue 3 + Vite + TailwindCSS + Pinia"
Cohesion: 0.18
Nodes (10): 🧪 Casos Borde & Verificación, Contract: [WXG-022] OpenSpec [WXG-003]: Setup Frontend Vue 3 + Vite + TailwindCSS + Pinia, ✅ Criterios de Aceptación (Definition of Done), 🤖 Herramientas MCP Obligatorias para Agentes, Post-conditions, Pre-conditions, Proposed Changes, 📋 Requisitos Técnicos (+2 more)

### Community 23 - "Contract: [WXG-022] OpenSpec [WXG-003]: Setup Frontend Vue 3 + Vite + TailwindCSS + Pinia"
Cohesion: 0.18
Nodes (10): 🧪 Casos Borde & Verificación, Contract: [WXG-022] OpenSpec [WXG-003]: Setup Frontend Vue 3 + Vite + TailwindCSS + Pinia, ✅ Criterios de Aceptación (Definition of Done), 🤖 Herramientas MCP Obligatorias para Agentes, Post-conditions, Pre-conditions, Proposed Changes, 📋 Requisitos Técnicos (+2 more)

### Community 24 - "Contract: [WXG-022] OpenSpec [WXG-003]: Setup Frontend Vue 3 + Vite + TailwindCSS + Pinia"
Cohesion: 0.18
Nodes (10): 🧪 Casos Borde & Verificación, Contract: [WXG-022] OpenSpec [WXG-003]: Setup Frontend Vue 3 + Vite + TailwindCSS + Pinia, ✅ Criterios de Aceptación (Definition of Done), 🤖 Herramientas MCP Obligatorias para Agentes, Post-conditions, Pre-conditions, Proposed Changes, 📋 Requisitos Técnicos (+2 more)

### Community 25 - "Contract: [WXG-022] OpenSpec [WXG-003]: Setup Frontend Vue 3 + Vite + TailwindCSS + Pinia"
Cohesion: 0.18
Nodes (10): 🧪 Casos Borde & Verificación, Contract: [WXG-022] OpenSpec [WXG-003]: Setup Frontend Vue 3 + Vite + TailwindCSS + Pinia, ✅ Criterios de Aceptación (Definition of Done), 🤖 Herramientas MCP Obligatorias para Agentes, Post-conditions, Pre-conditions, Proposed Changes, 📋 Requisitos Técnicos (+2 more)

### Community 26 - "Contract: [WXG-022] OpenSpec [WXG-003]: Setup Frontend Vue 3 + Vite + TailwindCSS + Pinia"
Cohesion: 0.18
Nodes (10): 🧪 Casos Borde & Verificación, Contract: [WXG-022] OpenSpec [WXG-003]: Setup Frontend Vue 3 + Vite + TailwindCSS + Pinia, ✅ Criterios de Aceptación (Definition of Done), 🤖 Herramientas MCP Obligatorias para Agentes, Post-conditions, Pre-conditions, Proposed Changes, 📋 Requisitos Técnicos (+2 more)

### Community 27 - "Contract: [WXG-023] Componente Visualizador de Grafo Interactivo de Lore (Vue Flow / Vue 3)"
Cohesion: 0.18
Nodes (10): 🧪 Casos Borde & Verificación, Contract: [WXG-023] Componente Visualizador de Grafo Interactivo de Lore (Vue Flow / Vue 3), ✅ Criterios de Aceptación (Definition of Done), 🤖 Herramientas MCP Obligatorias para Agentes, Post-conditions, Pre-conditions, Proposed Changes, 📋 Requisitos Técnicos (+2 more)

### Community 28 - "Contract: [WXG-023] Componente Visualizador de Grafo Interactivo de Lore (Vue Flow / Vue 3)"
Cohesion: 0.18
Nodes (10): 🧪 Casos Borde & Verificación, Contract: [WXG-023] Componente Visualizador de Grafo Interactivo de Lore (Vue Flow / Vue 3), ✅ Criterios de Aceptación (Definition of Done), 🤖 Herramientas MCP Obligatorias para Agentes, Post-conditions, Pre-conditions, Proposed Changes, 📋 Requisitos Técnicos (+2 more)

### Community 29 - "Contract: [WXG-023] Componente Visualizador de Grafo Interactivo de Lore (Vue Flow / Vue 3)"
Cohesion: 0.18
Nodes (10): 🧪 Casos Borde & Verificación, Contract: [WXG-023] Componente Visualizador de Grafo Interactivo de Lore (Vue Flow / Vue 3), ✅ Criterios de Aceptación (Definition of Done), 🤖 Herramientas MCP Obligatorias para Agentes, Post-conditions, Pre-conditions, Proposed Changes, 📋 Requisitos Técnicos (+2 more)

### Community 30 - "Contract: [WXG-023] Componente Visualizador de Grafo Interactivo de Lore (Vue Flow / Vue 3)"
Cohesion: 0.18
Nodes (10): 🧪 Casos Borde & Verificación, Contract: [WXG-023] Componente Visualizador de Grafo Interactivo de Lore (Vue Flow / Vue 3), ✅ Criterios de Aceptación (Definition of Done), 🤖 Herramientas MCP Obligatorias para Agentes, Post-conditions, Pre-conditions, Proposed Changes, 📋 Requisitos Técnicos (+2 more)

### Community 31 - "Contract: [WXG-023] Componente Visualizador de Grafo Interactivo de Lore (Vue Flow / Vue 3)"
Cohesion: 0.18
Nodes (10): 🧪 Casos Borde & Verificación, Contract: [WXG-023] Componente Visualizador de Grafo Interactivo de Lore (Vue Flow / Vue 3), ✅ Criterios de Aceptación (Definition of Done), 🤖 Herramientas MCP Obligatorias para Agentes, Post-conditions, Pre-conditions, Proposed Changes, 📋 Requisitos Técnicos (+2 more)

### Community 32 - "Contract: [WXG-024] Panel de Gobernanza WIP & Consola de Dreaming en Vue 3"
Cohesion: 0.18
Nodes (10): 🧪 Casos Borde & Verificación, Contract: [WXG-024] Panel de Gobernanza WIP & Consola de Dreaming en Vue 3, ✅ Criterios de Aceptación (Definition of Done), 🤖 Herramientas MCP Obligatorias para Agentes, Post-conditions, Pre-conditions, Proposed Changes, 📋 Requisitos Técnicos (+2 more)

### Community 33 - "Contract: [WXG-024] Panel de Gobernanza WIP & Consola de Dreaming en Vue 3"
Cohesion: 0.18
Nodes (10): 🧪 Casos Borde & Verificación, Contract: [WXG-024] Panel de Gobernanza WIP & Consola de Dreaming en Vue 3, ✅ Criterios de Aceptación (Definition of Done), 🤖 Herramientas MCP Obligatorias para Agentes, Post-conditions, Pre-conditions, Proposed Changes, 📋 Requisitos Técnicos (+2 more)

### Community 34 - "Contract: [WXG-024] Panel de Gobernanza WIP & Consola de Dreaming en Vue 3"
Cohesion: 0.18
Nodes (10): 🧪 Casos Borde & Verificación, Contract: [WXG-024] Panel de Gobernanza WIP & Consola de Dreaming en Vue 3, ✅ Criterios de Aceptación (Definition of Done), 🤖 Herramientas MCP Obligatorias para Agentes, Post-conditions, Pre-conditions, Proposed Changes, 📋 Requisitos Técnicos (+2 more)

### Community 35 - "Contract: [WXG-024] Panel de Gobernanza WIP & Consola de Dreaming en Vue 3"
Cohesion: 0.18
Nodes (10): 🧪 Casos Borde & Verificación, Contract: [WXG-024] Panel de Gobernanza WIP & Consola de Dreaming en Vue 3, ✅ Criterios de Aceptación (Definition of Done), 🤖 Herramientas MCP Obligatorias para Agentes, Post-conditions, Pre-conditions, Proposed Changes, 📋 Requisitos Técnicos (+2 more)

### Community 36 - "Contract: [WXG-024] Panel de Gobernanza WIP & Consola de Dreaming en Vue 3"
Cohesion: 0.18
Nodes (10): 🧪 Casos Borde & Verificación, Contract: [WXG-024] Panel de Gobernanza WIP & Consola de Dreaming en Vue 3, ✅ Criterios de Aceptación (Definition of Done), 🤖 Herramientas MCP Obligatorias para Agentes, Post-conditions, Pre-conditions, Proposed Changes, 📋 Requisitos Técnicos (+2 more)

### Community 37 - "Estándar Internacional de Seguridad de Paquetes y Cadena de Suministro (Supply Chain Security)"
Cohesion: 0.20
Nodes (9): 1. Propósito y Objetivos, 2. Marcos de Referencia Internacionales, 4.1. Versiones Congeladas y Estrictas (Strict Version Pinning), 4.2. Bloqueo de Scripts Arbitrarios de Instalación (`allowBuilds`), 4.3. Determinismo del Lockfile (`pnpm-lock.yaml`), 4. Arquitectura de Configuración y Control en `pnpm`, 5. Scripts Estándar del Proyecto, 6. Procedimiento para Incorporar o Actualizar Paquetes (+1 more)

### Community 38 - "Technical Approach"
Cohesion: 0.20
Nodes (9): Architecture Context, 🧪 Casos Borde & Verificación, ✅ Criterios de Aceptación (Definition of Done), Design: [WXG-020] Servicio de Grafo de Dominio: Algoritmo de Pathfinding (BFS/DFS) y Matriz de Alianzas, 🤖 Herramientas MCP Obligatorias para Agentes, 🎯 Objetivo & Contexto, 📋 Requisitos Técnicos, Risks & Verification (+1 more)

### Community 39 - "Why"
Cohesion: 0.20
Nodes (9): 🧪 Casos Borde & Verificación, ✅ Criterios de Aceptación (Definition of Done), 🤖 Herramientas MCP Obligatorias para Agentes, Impact, 🎯 Objetivo & Contexto, Proposal: [WXG-020] Servicio de Grafo de Dominio: Algoritmo de Pathfinding (BFS/DFS) y Matriz de Alianzas, 📋 Requisitos Técnicos, What Changes (+1 more)

### Community 40 - "Technical Approach"
Cohesion: 0.20
Nodes (9): Architecture Context, 🧪 Casos Borde & Verificación, ✅ Criterios de Aceptación (Definition of Done), Design: [WXG-021] Endpoints REST & Herramientas MCP para el Motor de Grafos, 🤖 Herramientas MCP Obligatorias para Agentes, 🎯 Objetivo & Contexto, 📋 Requisitos Técnicos, Risks & Verification (+1 more)

### Community 41 - "Why"
Cohesion: 0.20
Nodes (9): 🧪 Casos Borde & Verificación, ✅ Criterios de Aceptación (Definition of Done), 🤖 Herramientas MCP Obligatorias para Agentes, Impact, 🎯 Objetivo & Contexto, Proposal: [WXG-021] Endpoints REST & Herramientas MCP para el Motor de Grafos, 📋 Requisitos Técnicos, What Changes (+1 more)

### Community 42 - "Technical Approach"
Cohesion: 0.20
Nodes (9): Architecture Context, 🧪 Casos Borde & Verificación, ✅ Criterios de Aceptación (Definition of Done), Design: [WXG-022] OpenSpec [WXG-003]: Setup Frontend Vue 3 + Vite + TailwindCSS + Pinia, 🤖 Herramientas MCP Obligatorias para Agentes, 🎯 Objetivo & Contexto, 📋 Requisitos Técnicos, Risks & Verification (+1 more)

### Community 43 - "Why"
Cohesion: 0.20
Nodes (9): 🧪 Casos Borde & Verificación, ✅ Criterios de Aceptación (Definition of Done), 🤖 Herramientas MCP Obligatorias para Agentes, Impact, 🎯 Objetivo & Contexto, Proposal: [WXG-022] OpenSpec [WXG-003]: Setup Frontend Vue 3 + Vite + TailwindCSS + Pinia, 📋 Requisitos Técnicos, What Changes (+1 more)

### Community 44 - "Technical Approach"
Cohesion: 0.20
Nodes (9): Architecture Context, 🧪 Casos Borde & Verificación, ✅ Criterios de Aceptación (Definition of Done), Design: [WXG-023] Componente Visualizador de Grafo Interactivo de Lore (Vue Flow / Vue 3), 🤖 Herramientas MCP Obligatorias para Agentes, 🎯 Objetivo & Contexto, 📋 Requisitos Técnicos, Risks & Verification (+1 more)

### Community 45 - "Why"
Cohesion: 0.20
Nodes (9): 🧪 Casos Borde & Verificación, ✅ Criterios de Aceptación (Definition of Done), 🤖 Herramientas MCP Obligatorias para Agentes, Impact, 🎯 Objetivo & Contexto, Proposal: [WXG-023] Componente Visualizador de Grafo Interactivo de Lore (Vue Flow / Vue 3), 📋 Requisitos Técnicos, What Changes (+1 more)

### Community 46 - "Technical Approach"
Cohesion: 0.20
Nodes (9): Architecture Context, 🧪 Casos Borde & Verificación, ✅ Criterios de Aceptación (Definition of Done), Design: [WXG-024] Panel de Gobernanza WIP & Consola de Dreaming en Vue 3, 🤖 Herramientas MCP Obligatorias para Agentes, 🎯 Objetivo & Contexto, 📋 Requisitos Técnicos, Risks & Verification (+1 more)

### Community 47 - "Why"
Cohesion: 0.20
Nodes (9): 🧪 Casos Borde & Verificación, ✅ Criterios de Aceptación (Definition of Done), 🤖 Herramientas MCP Obligatorias para Agentes, Impact, 🎯 Objetivo & Contexto, Proposal: [WXG-024] Panel de Gobernanza WIP & Consola de Dreaming en Vue 3, 📋 Requisitos Técnicos, What Changes (+1 more)

### Community 48 - "Proposal"
Cohesion: 0.25
Nodes (7): Capabilities, Impact, Modified Capabilities, New Capabilities, Proposal, What Changes, Why

### Community 49 - "lore.ts"
Cohesion: 0.38
Nodes (6): GraphNode, Props, ContextInjectionPayload, LoreEntity, NarrativeFact, useLoreStore

### Community 50 - "OpenSpec [WXG-001]: Backend Core Architecture, Graph Engine, Circuit Breaker & MCP Server"
Cohesion: 0.29
Nodes (6): 1. Intent & Capability, 2. Invariantes de Arquitectura & Código, 3. Esquema de Base de Datos (schema.sql), 4. Casos de Uso Críticos, 5. Pruebas de Casos Borde Exigidos, OpenSpec [WXG-001]: Backend Core Architecture, Graph Engine, Circuit Breaker & MCP Server

### Community 51 - "SOUL.md — Principios, Identidad & Estándares de Sebastian Chota (@sastiam)"
Cohesion: 0.29
Nodes (6): 1. Identidad & Estilo de Comunicación, 2. Invariantes de Arquitectura & Código (WuxiaGraph), 3. Estrategia de Git & Merge Method, 4. Gestión de Tareas & Herramientas MCP, 5. Control de Hardware & Docker, SOUL.md — Principios, Identidad & Estándares de Sebastian Chota (@sastiam)

### Community 52 - "Tasks: [WXG-020] Servicio de Grafo de Dominio: Algoritmo de Pathfinding (BFS/DFS) y Matriz de Alianzas"
Cohesion: 0.33
Nodes (5): 1. Pre-Conditions, 2. Implementation Steps, 3. Verification & Quality Gates, 4. Post-Conditions, Tasks: [WXG-020] Servicio de Grafo de Dominio: Algoritmo de Pathfinding (BFS/DFS) y Matriz de Alianzas

### Community 53 - "Tasks: [WXG-021] Endpoints REST & Herramientas MCP para el Motor de Grafos"
Cohesion: 0.33
Nodes (5): 1. Pre-Conditions, 2. Implementation Steps, 3. Verification & Quality Gates, 4. Post-Conditions, Tasks: [WXG-021] Endpoints REST & Herramientas MCP para el Motor de Grafos

### Community 54 - "Tasks: [WXG-022] OpenSpec [WXG-003]: Setup Frontend Vue 3 + Vite + TailwindCSS + Pinia"
Cohesion: 0.33
Nodes (5): 1. Pre-Conditions, 2. Implementation Steps, 3. Verification & Quality Gates, 4. Post-Conditions, Tasks: [WXG-022] OpenSpec [WXG-003]: Setup Frontend Vue 3 + Vite + TailwindCSS + Pinia

### Community 55 - "Tasks: [WXG-023] Componente Visualizador de Grafo Interactivo de Lore (Vue Flow / Vue 3)"
Cohesion: 0.33
Nodes (5): 1. Pre-Conditions, 2. Implementation Steps, 3. Verification & Quality Gates, 4. Post-Conditions, Tasks: [WXG-023] Componente Visualizador de Grafo Interactivo de Lore (Vue Flow / Vue 3)

### Community 56 - "Tasks: [WXG-024] Panel de Gobernanza WIP & Consola de Dreaming en Vue 3"
Cohesion: 0.33
Nodes (5): 1. Pre-Conditions, 2. Implementation Steps, 3. Verification & Quality Gates, 4. Post-Conditions, Tasks: [WXG-024] Panel de Gobernanza WIP & Consola de Dreaming en Vue 3

### Community 57 - "WuxiaGraph: Project Overview"
Cohesion: 0.33
Nodes (5): 1. Visión y Propósito, 2. Stack Tecnológico, 3. Arquitectura del Código, 4. Gobernanza y Filosofía de Desarrollo, WuxiaGraph: Project Overview

### Community 58 - "OpenSpec [WXG-003]: Frontend Dashboard & Graph Visualizer (Vue 3)"
Cohesion: 0.33
Nodes (5): 1. Intent & Capability, 2. Invariantes de Arquitectura & Código, 3. Componentes Principales, 4. Casos Borde & Pruebas Exigidas, OpenSpec [WXG-003]: Frontend Dashboard & Graph Visualizer (Vue 3)

### Community 59 - "Interactive Socratic Plan Contract"
Cohesion: 0.40
Nodes (4): Interactive Socratic Plan Contract, Planned Tasks, Socratic Answers, Topology Summary

### Community 60 - "ADDED Requirements"
Cohesion: 0.40
Nodes (4): ADDED Requirements, Requirement: Implementation SHALL fulfill task gh-16, Scenario: Verification passing, Spec Delta: [WXG-020] Servicio de Grafo de Dominio: Algoritmo de Pathfinding (BFS/DFS) y Matriz de Alianzas

### Community 61 - "ADDED Requirements"
Cohesion: 0.40
Nodes (4): ADDED Requirements, Requirement: Implementation SHALL fulfill task gh-17, Scenario: Verification passing, Spec Delta: [WXG-021] Endpoints REST & Herramientas MCP para el Motor de Grafos

### Community 62 - "ADDED Requirements"
Cohesion: 0.40
Nodes (4): ADDED Requirements, Requirement: Implementation SHALL fulfill task gh-18, Scenario: Verification passing, Spec Delta: [WXG-022] OpenSpec [WXG-003]: Setup Frontend Vue 3 + Vite + TailwindCSS + Pinia

### Community 63 - "ADDED Requirements"
Cohesion: 0.40
Nodes (4): ADDED Requirements, Requirement: Implementation SHALL fulfill task gh-19, Scenario: Verification passing, Spec Delta: [WXG-023] Componente Visualizador de Grafo Interactivo de Lore (Vue Flow / Vue 3)

### Community 64 - "ADDED Requirements"
Cohesion: 0.40
Nodes (4): ADDED Requirements, Requirement: Implementation SHALL fulfill task gh-20, Scenario: Verification passing, Spec Delta: [WXG-024] Panel de Gobernanza WIP & Consola de Dreaming en Vue 3

### Community 65 - "Tarea WXG-025: Extensión del Grafo Canónico de Lore para Eventos Wuxia"
Cohesion: 0.50
Nodes (3): Criterios de Aceptación, Descripción, Tarea WXG-025: Extensión del Grafo Canónico de Lore para Eventos Wuxia

## Knowledge Gaps
- **13 isolated node(s):** `@vue-flow/background`, `@vue-flow/controls`, `@vue-flow/core`, `@vueuse/core`, `@types/node` (+8 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 561 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `vue` connect `vue` to `frontend/package.json`, `LoreGraphVisualizer.vue`, `GovernancePanel.vue`, `DreamingConsole.vue`, `App.vue`, `lore.ts`?**
  _High betweenness centrality (0.070) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `IWipGovernanceRepository` (e.g. with `2. Invariantes Implementadas` and `Context`) actually correct?**
  _`IWipGovernanceRepository` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `@vue-flow/background`, `@vue-flow/controls`, `@vue-flow/core` to the rest of the system?**
  _13 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `dreaming/service.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07936507936507936 - nodes in this community are weakly interconnected._
- **Should `tools/index.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09158186864014801 - nodes in this community are weakly interconnected._
- **Should `frontend/package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.05263157894736842 - nodes in this community are weakly interconnected._
- **Should `LoreGraphVisualizer.vue` be split into smaller, more focused modules?**
  _Cohesion score 0.06896551724137931 - nodes in this community are weakly interconnected._