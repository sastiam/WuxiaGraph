# Graph Report - WuxiaGraph  (2026-10-21)

## Corpus Check
- 132 files · ~107,814 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 10 file(s) not represented in the graph (top: (none) 8, .css 1, .tsbuildinfo 1)

## Summary
- 894 nodes · 1523 edges · 66 communities (60 shown, 6 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 51 edges (avg confidence: 0.9)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `65afcd82`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- devDependencies
- router.ts
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
- dependencies
- App.vue
- GraphService
- Requirements
- ADDED Requirements
- Requirement: Exposición de Endpoints REST de Servicios Canónicos
- Requirement: Exposición de Endpoints REST de Servicios Canónicos
- scripts
- Contract: [WXG-022] OpenSpec [WXG-003]: Setup Frontend Vue 3 + Vite + TailwindCSS + Pinia
- Contract: [WXG-022] OpenSpec [WXG-003]: Setup Frontend Vue 3 + Vite + TailwindCSS + Pinia
- DreamingService
- Proposal
- Contract: [WXG-023] Componente Visualizador de Grafo Interactivo de Lore (Vue Flow / Vue 3)
- Contract: [WXG-023] Componente Visualizador de Grafo Interactivo de Lore (Vue Flow / Vue 3)
- ADDED Requirements
- schema.sql
- infrastructure/schema.sql
- Contract: [WXG-024] Panel de Gobernanza WIP & Consola de Dreaming en Vue 3
- Contract: [WXG-024] Panel de Gobernanza WIP & Consola de Dreaming en Vue 3
- Proposal: Motor de Grafos & Consultas Relacionales (WXG-002)
- Tasks
- IContextRepository
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
- Proposal: Frontend Dashboard & Graph Visualizer Integration (Vue 3)
- OpenSpec [WXG-001]: Backend Core Architecture, Graph Engine, Circuit Breaker & MCP Server
- SOUL.md — Principios, Identidad & Estándares de Sebastian Chota (@sastiam)
- Tasks: [WXG-020] Servicio de Grafo de Dominio: Algoritmo de Pathfinding (BFS/DFS) y Matriz de Alianzas
- Tasks: [WXG-021] Endpoints REST & Herramientas MCP para el Motor de Grafos
- Tasks: [WXG-022] OpenSpec [WXG-003]: Setup Frontend Vue 3 + Vite + TailwindCSS + Pinia
- Tasks: [WXG-023] Componente Visualizador de Grafo Interactivo de Lore (Vue Flow / Vue 3)
- Tasks: [WXG-024] Panel de Gobernanza WIP & Consola de Dreaming en Vue 3
- WuxiaGraph: Project Overview
- OpenSpec [WXG-003]: Frontend Dashboard & Graph Visualizer (Vue 3)
- Design: Frontend Dashboard (Vue 3, Pinia, Vue Flow)
- ADDED Requirements
- ADDED Requirements
- ADDED Requirements
- ADDED Requirements
- ADDED Requirements
- wxg-023-024-frontend-dashboard/tasks.md
- WuxiaGraph Project Rules for Hermes Agent
- README.md

## God Nodes (most connected - your core abstractions)
1. `GraphService` - 29 edges
2. `LoreRelationship` - 24 edges
3. `LoreEntity` - 22 edges
4. `WipGovernanceLedger` - 22 edges
5. `NarrativeFact` - 20 edges
6. `IWipGovernanceRepository` - 19 edges
7. `compilerOptions` - 18 edges
8. `vitest` - 16 edges
9. `createApp()` - 16 edges
10. `SqliteDreamingRepository` - 16 edges

## Surprising Connections (you probably didn't know these)
- `Decisions` --references--> `WipLimitExceededError`  [INFERRED]
  openspec/changes/archive/2026-10-21-wxg-017-http-api-hono/design.md → src/domain/governance/errors.ts
- `What Changes` --references--> `WipLimitExceededError`  [INFERRED]
  openspec/changes/archive/2026-10-21-wxg-017-http-api-hono/proposal.md → src/domain/governance/errors.ts
- `2. Enrutador Principal, Middlewares y Servidor Central` --references--> `createApiRouter()`  [INFERRED]
  openspec/changes/archive/2026-10-21-wxg-017-http-api-hono/tasks.md → src/api/router.ts
- `2. Invariantes Implementadas` --references--> `ContextInjectorService`  [INFERRED]
  openspec/changes/wxg-015-context-injector.md → src/domain/context/contextInjectorService.ts
- `2. Invariantes Implementadas` --references--> `IDreamingRepository`  [INFERRED]
  openspec/changes/wxg-016-mcp-server.md → src/domain/dreaming/repository.ts

## Import Cycles
- None detected.

## Communities (66 total, 6 thin omitted)

### Community 0 - "devDependencies"
Cohesion: 0.22
Nodes (9): devDependencies, autoprefixer, postcss, tailwindcss, @types/node, typescript, vite, @vitejs/plugin-vue (+1 more)

### Community 1 - "router.ts"
Cohesion: 0.06
Nodes (41): ApiRouterDependencies, createDreamingRouter(), createGovernanceRouter(), DistillEntityDto, DistillEntitySchema, DistillFactDto, DistillFactSchema, DistillRequestDto (+33 more)

### Community 2 - "tools/index.ts"
Cohesion: 0.09
Nodes (37): zod, MCP_PROTOCOL_VERSION, MCP_SERVER_INFO, McpServer, getCanonicalEntitiesDefinition, GetCanonicalEntitiesInput, GetCanonicalEntitiesInputSchema, handleGetCanonicalEntities() (+29 more)

### Community 3 - "frontend/package.json"
Cohesion: 0.11
Nodes (16): @types/node, typescript, name, private, type, version, autoprefixer, postcss (+8 more)

### Community 4 - "LoreGraphVisualizer.vue"
Cohesion: 0.11
Nodes (17): availableDomains, depth, edges, fetchError, filterCanonOnly, isLoadingRels, LoreRelationship, minAffinity (+9 more)

### Community 5 - "database.ts"
Cohesion: 0.09
Nodes (42): Context, hono, vitest, contextQuerySchema, createContextRouter(), createApiRouter(), ContextInjectorService, DreamingService (+34 more)

### Community 6 - "package.json"
Cohesion: 0.06
Nodes (31): author, dependencies, hono, @hono/node-server, zod, description, devDependencies, tsx (+23 more)

### Community 7 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowImportingTsExtensions, baseUrl, isolatedModules, jsx, lib, module, moduleResolution (+11 more)

### Community 8 - "Protocolo de Agentes & Reglas de Desarrollo — WuxiaGraph"
Cohesion: 0.11
Nodes (17): 1. Principio Fundamental: Spec-Driven Development (OpenSpec), 2. Invariantes Arquitectónicas (Clean Architecture / DDD), 3. Estándar de Código: Cero `any`, Cero Espagueti, Cero Código Muerto, 4. Pruebas Automatizadas Obligatorias por Ticket, 5. Gobernanza WIP y Regla del 4/1, graphify, Protocolo de Agentes & Reglas de Desarrollo — WuxiaGraph, Regla de Dependencia: (+9 more)

### Community 9 - "GovernancePanel.vue"
Cohesion: 0.10
Nodes (16): error, filteredProposals, GovernanceProposal, hoursToLog, isWipLoading, logSuccessMessage, newCategory, newProposer (+8 more)

### Community 10 - "compilerOptions"
Cohesion: 0.11
Nodes (17): compilerOptions, declaration, esModuleInterop, forceConsistentCasingInFileNames, isolatedModules, lib, module, moduleResolution (+9 more)

### Community 11 - "DreamingConsole.vue"
Cohesion: 0.09
Nodes (21): chapterSource, checkWipQuota(), customEntitiesJson, DistilledEntityItem, DistilledFactItem, domain, DreamingLogEntry, emit (+13 more)

### Community 12 - "dependencies"
Cohesion: 0.29
Nodes (7): dependencies, pinia, vue, @vue-flow/background, @vue-flow/controls, @vue-flow/core, @vueuse/core

### Community 13 - "App.vue"
Cohesion: 0.13
Nodes (12): currentTab, loreStore, selectedDomain, TabView, DistillSuccessData, *.vue, app, pinia (+4 more)

### Community 14 - "GraphService"
Cohesion: 0.06
Nodes (25): 1. Dominio (`src/domain/graph/`), 2. Infraestructura (`src/infrastructure/repositories/graphRepository.ts`), 3. Capa de API HTTP (`src/api/routes/graph.ts`), 4. Capa MCP (`src/mcp/tools/graphTools.ts`), Arquitectura Hexagonal, Design: Motor de Grafos & Consultas Relacionales (WXG-002), Tasks: Motor de Grafos & Consultas Relacionales (WXG-002), createGraphRouter() (+17 more)

### Community 17 - "Requirements"
Cohesion: 0.15
Nodes (12): graph-engine Specification, Purpose, Requirement: DDL lore_relationships, Requirement: Domain Graph Service Pathfinding, Requirement: MCP Tools, Requirement: REST API Endpoints, Requirements, Scenario: Calculating shortest path between entities (+4 more)

### Community 18 - "ADDED Requirements"
Cohesion: 0.17
Nodes (11): ADDED Requirements, Requirement: DDL lore_relationships, Requirement: Domain Graph Service Pathfinding, Requirement: MCP Tools, Requirement: REST API Endpoints, Scenario: Calculating shortest path between entities, Scenario: Cyclic graph handling, Scenario: Executing query_entity_graph tool (+3 more)

### Community 19 - "Requirement: Exposición de Endpoints REST de Servicios Canónicos"
Cohesion: 0.17
Nodes (11): ADDED Requirements, Purpose, Requirement: Exposición de Endpoints REST de Servicios Canónicos, Requirement: Gestión Centralizada de Errores y Validaciones, Scenario: Error de Validación Zod, Scenario: Error Inesperado no Controlado, Scenario: Exceso de Límite WIP (Circuit Breaker), Scenario: Petición exitosa a /api/v1/context/inject (+3 more)

### Community 20 - "Requirement: Exposición de Endpoints REST de Servicios Canónicos"
Cohesion: 0.17
Nodes (11): http-api Specification, Purpose, Requirement: Exposición de Endpoints REST de Servicios Canónicos, Requirement: Gestión Centralizada de Errores y Validaciones, Requirements, Scenario: Error de Validación Zod, Scenario: Error Inesperado no Controlado, Scenario: Exceso de Límite WIP (Circuit Breaker) (+3 more)

### Community 21 - "scripts"
Cohesion: 0.50
Nodes (4): scripts, build, dev, preview

### Community 22 - "Contract: [WXG-022] OpenSpec [WXG-003]: Setup Frontend Vue 3 + Vite + TailwindCSS + Pinia"
Cohesion: 0.18
Nodes (10): 🧪 Casos Borde & Verificación, Contract: [WXG-022] OpenSpec [WXG-003]: Setup Frontend Vue 3 + Vite + TailwindCSS + Pinia, ✅ Criterios de Aceptación (Definition of Done), 🤖 Herramientas MCP Obligatorias para Agentes, Post-conditions, Pre-conditions, Proposed Changes, 📋 Requisitos Técnicos (+2 more)

### Community 23 - "Contract: [WXG-022] OpenSpec [WXG-003]: Setup Frontend Vue 3 + Vite + TailwindCSS + Pinia"
Cohesion: 0.18
Nodes (10): 🧪 Casos Borde & Verificación, Contract: [WXG-022] OpenSpec [WXG-003]: Setup Frontend Vue 3 + Vite + TailwindCSS + Pinia, ✅ Criterios de Aceptación (Definition of Done), 🤖 Herramientas MCP Obligatorias para Agentes, Post-conditions, Pre-conditions, Proposed Changes, 📋 Requisitos Técnicos (+2 more)

### Community 24 - "DreamingService"
Cohesion: 0.40
Nodes (4): Decisions, Design, Goals / Non-Goals, Risks / Trade-offs

### Community 25 - "Proposal"
Cohesion: 0.25
Nodes (7): Capabilities, Impact, Modified Capabilities, New Capabilities, Proposal, What Changes, Why

### Community 27 - "Contract: [WXG-023] Componente Visualizador de Grafo Interactivo de Lore (Vue Flow / Vue 3)"
Cohesion: 0.18
Nodes (10): 🧪 Casos Borde & Verificación, Contract: [WXG-023] Componente Visualizador de Grafo Interactivo de Lore (Vue Flow / Vue 3), ✅ Criterios de Aceptación (Definition of Done), 🤖 Herramientas MCP Obligatorias para Agentes, Post-conditions, Pre-conditions, Proposed Changes, 📋 Requisitos Técnicos (+2 more)

### Community 28 - "Contract: [WXG-023] Componente Visualizador de Grafo Interactivo de Lore (Vue Flow / Vue 3)"
Cohesion: 0.18
Nodes (10): 🧪 Casos Borde & Verificación, Contract: [WXG-023] Componente Visualizador de Grafo Interactivo de Lore (Vue Flow / Vue 3), ✅ Criterios de Aceptación (Definition of Done), 🤖 Herramientas MCP Obligatorias para Agentes, Post-conditions, Pre-conditions, Proposed Changes, 📋 Requisitos Técnicos (+2 more)

### Community 29 - "ADDED Requirements"
Cohesion: 0.29
Nodes (6): ADDED Requirements, Requirement: Depth-based Graph Query and Visualization, Requirement: Governance 423 Locked Disablement, Scenario: Circuit breaker budget exceeded, Scenario: Fetching graph with depth filter, Spec: Frontend Dashboard & Graph Visualizer

### Community 30 - "schema.sql"
Cohesion: 0.48
Nodes (6): idx_lore_relationships_source_target, idx_lore_relationships_target_source, lore_entities, lore_relationships, narrative_facts, wip_governance_ledger

### Community 31 - "infrastructure/schema.sql"
Cohesion: 0.48
Nodes (6): idx_lore_relationships_source_target, idx_lore_relationships_target_source, lore_entities, lore_relationships, narrative_facts, wip_governance_ledger

### Community 32 - "Contract: [WXG-024] Panel de Gobernanza WIP & Consola de Dreaming en Vue 3"
Cohesion: 0.18
Nodes (10): 🧪 Casos Borde & Verificación, Contract: [WXG-024] Panel de Gobernanza WIP & Consola de Dreaming en Vue 3, ✅ Criterios de Aceptación (Definition of Done), 🤖 Herramientas MCP Obligatorias para Agentes, Post-conditions, Pre-conditions, Proposed Changes, 📋 Requisitos Técnicos (+2 more)

### Community 33 - "Contract: [WXG-024] Panel de Gobernanza WIP & Consola de Dreaming en Vue 3"
Cohesion: 0.18
Nodes (10): 🧪 Casos Borde & Verificación, Contract: [WXG-024] Panel de Gobernanza WIP & Consola de Dreaming en Vue 3, ✅ Criterios de Aceptación (Definition of Done), 🤖 Herramientas MCP Obligatorias para Agentes, Post-conditions, Pre-conditions, Proposed Changes, 📋 Requisitos Técnicos (+2 more)

### Community 34 - "Proposal: Motor de Grafos & Consultas Relacionales (WXG-002)"
Cohesion: 0.40
Nodes (4): Contexto e Impacto, Definition of Done (DoD), Por Qué (Why), Proposal: Motor de Grafos & Consultas Relacionales (WXG-002)

### Community 35 - "Tasks"
Cohesion: 0.40
Nodes (4): 1. Esquemas y Enrutador de Gobernanza WIP, 2. Enrutador Principal, Middlewares y Servidor Central, 3. Pruebas de Integración y Verificación, Tasks

### Community 36 - "IContextRepository"
Cohesion: 0.14
Nodes (13): 1. Contexto & Propósito, 2. Invariantes Implementadas, OpenSpec Change Proposal: WXG-015 Context Injector Service, 1. Contexto & Propósito, 2. Invariantes Implementadas, 3. Verificación & Casos Borde Cubiertos, OpenSpec Change Proposal: WXG-016 MCP Server & Tools, buildImmutablePromptPrefix() (+5 more)

### Community 37 - "Estándar Internacional de Seguridad de Paquetes y Cadena de Suministro (Supply Chain Security)"
Cohesion: 0.14
Nodes (13): 1. Propósito y Objetivos, 2. Marcos de Referencia Internacionales, 3.1. Umbrales de Vulnerabilidad (CVE / CVSS), 3.2. Salud del Proyecto y OpenSSF Scorecard, 3.3. Cumplimiento de Licenciamiento (License Compliance), 3. Criterios Obligatorios para la Aceptación de Paquetes, 4.1. Versiones Congeladas y Estrictas (Strict Version Pinning), 4.2. Bloqueo de Scripts Arbitrarios de Instalación (`allowBuilds`) (+5 more)

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

### Community 48 - "Proposal: Frontend Dashboard & Graph Visualizer Integration (Vue 3)"
Cohesion: 0.40
Nodes (4): Context & Impact, Definition of Done, Proposal: Frontend Dashboard & Graph Visualizer Integration (Vue 3), Why

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

## Knowledge Gaps
- **10 isolated node(s):** `@vueuse/core`, `@types/node`, `autoprefixer`, `postcss`, `tailwindcss` (+5 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 486 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `vue` connect `App.vue` to `DreamingConsole.vue`, `GovernancePanel.vue`, `frontend/package.json`, `LoreGraphVisualizer.vue`?**
  _High betweenness centrality (0.073) - this node is a cross-community bridge._
- **Are the 4 inferred relationships involving `GraphService` (e.g. with `1. Dominio (`src/domain/graph/`)` and `Requirement: Domain Graph Service Pathfinding`) actually correct?**
  _`GraphService` has 4 INFERRED edges - model-reasoned connections that need verification._
- **What connects `@vueuse/core`, `@types/node`, `autoprefixer` to the rest of the system?**
  _10 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `router.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05554311310190369 - nodes in this community are weakly interconnected._
- **Should `tools/index.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08941176470588236 - nodes in this community are weakly interconnected._
- **Should `frontend/package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.1111111111111111 - nodes in this community are weakly interconnected._
- **Should `LoreGraphVisualizer.vue` be split into smaller, more focused modules?**
  _Cohesion score 0.10822510822510822 - nodes in this community are weakly interconnected._