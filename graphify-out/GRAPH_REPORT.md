# Graph Report - WuxiaGraph  (2026-10-21)

## Corpus Check
- 209 files · ~276,879 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 12 file(s) not represented in the graph (top: (none) 10, .css 1, .tsbuildinfo 1)

## Summary
- 1259 nodes · 2099 edges · 102 communities (90 shown, 12 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 72 edges (avg confidence: 0.9)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `86846afd`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- workerQueue.ts
- LoreEntity
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
- HitLAliasQueue.vue
- GraphService
- LoreRelationship
- Requirements
- ADDED Requirements
- Requirement: Exposición de Endpoints REST de Servicios Canónicos
- Requirement: Exposición de Endpoints REST de Servicios Canónicos
- App.vue
- Contract: [WXG-022] OpenSpec [WXG-003]: Setup Frontend Vue 3 + Vite + TailwindCSS + Pinia
- Contract: [WXG-022] OpenSpec [WXG-003]: Setup Frontend Vue 3 + Vite + TailwindCSS + Pinia
- chapterSplitter.ts
- Proposal
- OpenSpec [WXG-004]: Ingestor Masivo de PDFs de Cientos de Capítulos en WuxiaGraph
- Contract: [WXG-023] Componente Visualizador de Grafo Interactivo de Lore (Vue Flow / Vue 3)
- Contract: [WXG-023] Componente Visualizador de Grafo Interactivo de Lore (Vue Flow / Vue 3)
- hitl-curation Specification
- schema.sql
- infrastructure/schema.sql
- Contract: [WXG-024] Panel de Gobernanza WIP & Consola de Dreaming en Vue 3
- Contract: [WXG-024] Panel de Gobernanza WIP & Consola de Dreaming en Vue 3
- Proposal: Motor de Grafos & Consultas Relacionales (WXG-002)
- graph.ts
- devDependencies
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
- dependencies
- vue
- OpenSpec [WXG-001]: Backend Core Architecture, Graph Engine, Circuit Breaker & MCP Server
- SOUL.md — Principios, Identidad & Estándares de Sebastian Chota (@sastiam)
- Tasks: [WXG-020] Servicio de Grafo de Dominio: Algoritmo de Pathfinding (BFS/DFS) y Matriz de Alianzas
- Tasks: [WXG-021] Endpoints REST & Herramientas MCP para el Motor de Grafos
- Tasks: [WXG-022] OpenSpec [WXG-003]: Setup Frontend Vue 3 + Vite + TailwindCSS + Pinia
- Tasks: [WXG-023] Componente Visualizador de Grafo Interactivo de Lore (Vue Flow / Vue 3)
- Tasks: [WXG-024] Panel de Gobernanza WIP & Consola de Dreaming en Vue 3
- WuxiaGraph: Project Overview
- OpenSpec [WXG-003]: Frontend Dashboard & Graph Visualizer (Vue 3)
- frontend-dashboard Specification
- ADDED Requirements
- ADDED Requirements
- ADDED Requirements
- ADDED Requirements
- ADDED Requirements
- ADDED Requirements
- WuxiaGraph Project Rules for Hermes Agent
- README.md
- Requirements
- SqliteGraphRepository
- ADDED Requirements
- ADDED Requirements
- Proposal: Frontend Dashboard & Graph Visualizer Integration (Vue 3)
- Design: HitL Alias Curation API & Vue 3 Component
- core-and-graph-engine Specification
- Design: Frontend Dashboard (Vue 3, Pinia, Vue Flow)
- 2026-10-21-wxg-023-024-frontend-dashboard/tasks.md
- pdf-ingestion Specification
- ADDED Requirements
- ADDED Requirements
- createGraphRouter
- Arquitectura Hexagonal
- 2026-10-21-wxg-047-hitl-curation/tasks.md
- Proposal: SaaS Mass PDF Chapter Ingestion Engine (WXG-004)
- Proposal: Core Architecture, Graph Engine & E2E Integration Suite
- coreference.ts
- Design: Mass PDF Ingestion Pipeline Architecture
- Architecture & Data Schema
- 2026-10-21-wxg-004-pdf-mass-ingestion/tasks.md
- Proposal: OpenSpec Engine v2 (Archify, Btrfs CoW & Auto-Healing)
- Design: OpenSpec Engine v2 Architecture
- 2026-10-21-wxg-034-openspec-v2/tasks.md
- btrfs-snapshot.sh
- Guía de Despliegue en Raspberry Pi 4 (ARM64) — WuxiaGraph
- Requirements
- scripts
- ADDED Requirements
- ADDED Requirements
- Proposal: Optimized Docker Deployment for Raspberry Pi 4 (ARM64)
- Design: Bi-Temporal Knowledge Graph Architecture
- Design: Docker RPi4 ARM64 Packaging
- 2026-10-21-wxg-048-docker-rpi4/tasks.md

## God Nodes (most connected - your core abstractions)
1. `GraphService` - 37 edges
2. `LoreRelationship` - 29 edges
3. `LoreEntity` - 27 edges
4. `IWipGovernanceRepository` - 25 edges
5. `WipGovernanceLedger` - 22 edges
6. `NarrativeFact` - 20 edges
7. `WipLimitExceededError` - 20 edges
8. `createDatabase()` - 20 edges
9. `createApp()` - 19 edges
10. `compilerOptions` - 18 edges

## Surprising Connections (you probably didn't know these)
- `What Changes` --references--> `WipLimitExceededError`  [INFERRED]
  openspec/changes/archive/2026-10-21-wxg-017-http-api-hono/proposal.md → src/domain/governance/errors.ts
- `Architecture & Data Schema` --references--> `GraphService`  [INFERRED]
  openspec/changes/archive/2026-10-21-wxg-014-018-core-and-graph-engine/design.md → src/domain/graph/graphService.ts
- `2. Infraestructura (`src/infrastructure/repositories/graphRepository.ts`)` --references--> `SqliteGraphRepository`  [INFERRED]
  openspec/changes/archive/2026-10-21-wxg-002-graph-engine/design.md → src/infrastructure/repositories/graphRepository.ts
- `2. Enrutador Principal, Middlewares y Servidor Central` --references--> `createApiRouter()`  [INFERRED]
  openspec/changes/archive/2026-10-21-wxg-017-http-api-hono/tasks.md → src/api/router.ts
- `Context & Impact` --references--> `DreamingService`  [INFERRED]
  openspec/changes/archive/2026-10-21-wxg-004-pdf-mass-ingestion/proposal.md → src/domain/dreaming/service.ts

## Import Cycles
- None detected.

## Communities (102 total, 12 thin omitted)

### Community 0 - "workerQueue.ts"
Cohesion: 0.05
Nodes (35): Decisions, Design, Goals / Non-Goals, Risks / Trade-offs, 1. Esquemas y Enrutador de Gobernanza WIP, 2. Enrutador Principal, Middlewares y Servidor Central, 3. Pruebas de Integración y Verificación, Tasks (+27 more)

### Community 1 - "LoreEntity"
Cohesion: 0.06
Nodes (49): Context, 1. Contexto & Propósito, 2. Invariantes Implementadas, OpenSpec Change Proposal: WXG-015 Context Injector Service, 1. Contexto & Propósito, 2. Invariantes Implementadas, 3. Verificación & Casos Borde Cubiertos, OpenSpec Change Proposal: WXG-016 MCP Server & Tools (+41 more)

### Community 2 - "tools/index.ts"
Cohesion: 0.08
Nodes (40): 3.1. Umbrales de Vulnerabilidad (CVE / CVSS), 3.2. Salud del Proyecto y OpenSSF Scorecard, 3.3. Cumplimiento de Licenciamiento (License Compliance), 3. Criterios Obligatorios para la Aceptación de Paquetes, MCP_PROTOCOL_VERSION, MCP_SERVER_INFO, McpServer, getCanonicalEntitiesDefinition (+32 more)

### Community 3 - "frontend/package.json"
Cohesion: 0.11
Nodes (17): @types/node, typescript, vitest, name, private, type, version, autoprefixer (+9 more)

### Community 4 - "LoreGraphVisualizer.vue"
Cohesion: 0.11
Nodes (17): availableDomains, depth, edges, fetchError, filterCanonOnly, isLoadingRels, LoreRelationship, minAffinity (+9 more)

### Community 5 - "database.ts"
Cohesion: 0.09
Nodes (35): hono, @vitejs/plugin-vue, app, createApp(), CanonicalContextRow, createDatabase(), DatabaseOptions, ensureTemporalColumns() (+27 more)

### Community 6 - "package.json"
Cohesion: 0.06
Nodes (35): author, dependencies, hono, @hono/node-server, pdf-parse, zod, description, devDependencies (+27 more)

### Community 7 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowImportingTsExtensions, baseUrl, isolatedModules, jsx, lib, module, moduleResolution (+11 more)

### Community 8 - "Protocolo de Agentes & Reglas de Desarrollo — WuxiaGraph"
Cohesion: 0.09
Nodes (21): 1. Principio Fundamental: Spec-Driven Development (OpenSpec), 2. Invariantes Arquitectónicas (Clean Architecture / DDD), 3. Estándar de Código: Cero `any`, Cero Espagueti, Cero Código Muerto, 4. Pruebas Automatizadas Obligatorias por Ticket, 5. Gobernanza WIP y Regla del 4/1, 6. Consulta de Patrones de Diseño & Arquitectura Limpia con Context7 MCP, 7. OpenSpec Engine v2: Btrfs CoW Snapshots & Circuito de Auto-Healing, graphify (+13 more)

### Community 9 - "GovernancePanel.vue"
Cohesion: 0.10
Nodes (16): error, filteredProposals, GovernanceProposal, hoursToLog, isWipLoading, logSuccessMessage, newCategory, newProposer (+8 more)

### Community 10 - "compilerOptions"
Cohesion: 0.11
Nodes (17): compilerOptions, declaration, esModuleInterop, forceConsistentCasingInFileNames, isolatedModules, lib, module, moduleResolution (+9 more)

### Community 11 - "DreamingConsole.vue"
Cohesion: 0.09
Nodes (21): chapterSource, checkWipQuota(), customEntitiesJson, DistilledEntityItem, DistilledFactItem, domain, DreamingLogEntry, emit (+13 more)

### Community 12 - "HitLAliasQueue.vue"
Cohesion: 0.15
Nodes (14): availableDomains, closeUnifyModal(), emit, filteredProposals, handleApprove(), handleConfirmUnify(), handleReject(), minConfidence (+6 more)

### Community 13 - "GraphService"
Cohesion: 0.22
Nodes (5): 2026-10-21 - Eliminate $O(N^2)$ DB & Adjacency List Reconstructions in `getAffinityMatrix`, 1. Dominio (`src/domain/graph/`), Tasks: Core & Graph Engine Implementation, GraphPath, GraphService

### Community 14 - "LoreRelationship"
Cohesion: 0.17
Nodes (8): createGraphRouter(), LoreRelationship, FindPathOptions, GraphEdge, SearchState, GraphRepository, IGraphRepository, InMemoryGraphRepository

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

### Community 21 - "App.vue"
Cohesion: 0.11
Nodes (14): availableEntitiesForHitL, currentTab, hitlProposals, loreStore, selectedDomain, TabView, DistillSuccessData, AvailableEntity (+6 more)

### Community 22 - "Contract: [WXG-022] OpenSpec [WXG-003]: Setup Frontend Vue 3 + Vite + TailwindCSS + Pinia"
Cohesion: 0.18
Nodes (10): 🧪 Casos Borde & Verificación, Contract: [WXG-022] OpenSpec [WXG-003]: Setup Frontend Vue 3 + Vite + TailwindCSS + Pinia, ✅ Criterios de Aceptación (Definition of Done), 🤖 Herramientas MCP Obligatorias para Agentes, Post-conditions, Pre-conditions, Proposed Changes, 📋 Requisitos Técnicos (+2 more)

### Community 23 - "Contract: [WXG-022] OpenSpec [WXG-003]: Setup Frontend Vue 3 + Vite + TailwindCSS + Pinia"
Cohesion: 0.18
Nodes (10): 🧪 Casos Borde & Verificación, Contract: [WXG-022] OpenSpec [WXG-003]: Setup Frontend Vue 3 + Vite + TailwindCSS + Pinia, ✅ Criterios de Aceptación (Definition of Done), 🤖 Herramientas MCP Obligatorias para Agentes, Post-conditions, Pre-conditions, Proposed Changes, 📋 Requisitos Técnicos (+2 more)

### Community 24 - "chapterSplitter.ts"
Cohesion: 0.11
Nodes (18): pdf-parse, calculateWordCount(), ChapterInputPage, ChapterSplitter, ChapterSplitterOptions, DEFAULT_HEADER_PATTERNS, InternalLineMatch, PageSpan (+10 more)

### Community 25 - "Proposal"
Cohesion: 0.25
Nodes (7): Capabilities, Impact, Modified Capabilities, New Capabilities, Proposal, What Changes, Why

### Community 26 - "OpenSpec [WXG-004]: Ingestor Masivo de PDFs de Cientos de Capítulos en WuxiaGraph"
Cohesion: 0.08
Nodes (25): 1.1 Propósito Estratégico, 1.2 Propuesta de Valor Diferenciadora (vs RAG Tradicional y Context Windows), 1.3 Target Personas (Perfil de Usuarios SaaS), 1.4 Modelo SaaS & Economía de Cómputo, 1. Visión Estratégica de Producto SaaS & Propuesta de Valor, 2. Casos de Uso de Usuario, 3. Arquitectura del Pipeline de Ingesta (End-to-End), 4. Roadmap Iterativo de Producto (+17 more)

### Community 27 - "Contract: [WXG-023] Componente Visualizador de Grafo Interactivo de Lore (Vue Flow / Vue 3)"
Cohesion: 0.18
Nodes (10): 🧪 Casos Borde & Verificación, Contract: [WXG-023] Componente Visualizador de Grafo Interactivo de Lore (Vue Flow / Vue 3), ✅ Criterios de Aceptación (Definition of Done), 🤖 Herramientas MCP Obligatorias para Agentes, Post-conditions, Pre-conditions, Proposed Changes, 📋 Requisitos Técnicos (+2 more)

### Community 28 - "Contract: [WXG-023] Componente Visualizador de Grafo Interactivo de Lore (Vue Flow / Vue 3)"
Cohesion: 0.18
Nodes (10): 🧪 Casos Borde & Verificación, Contract: [WXG-023] Componente Visualizador de Grafo Interactivo de Lore (Vue Flow / Vue 3), ✅ Criterios de Aceptación (Definition of Done), 🤖 Herramientas MCP Obligatorias para Agentes, Post-conditions, Pre-conditions, Proposed Changes, 📋 Requisitos Técnicos (+2 more)

### Community 29 - "hitl-curation Specification"
Cohesion: 0.25
Nodes (7): hitl-curation Specification, Purpose, Requirement: Alias Review Action Endpoint, Requirement: Pending Alias Candidates Endpoint, Requirements, Scenario: Approve Pending Alias, Scenario: Retrieve Pending Aliases

### Community 30 - "schema.sql"
Cohesion: 0.43
Nodes (7): idx_lore_relationships_source_target, idx_lore_relationships_target_source, idx_lore_relationships_temporal, lore_entities, lore_relationships, narrative_facts, wip_governance_ledger

### Community 31 - "infrastructure/schema.sql"
Cohesion: 0.33
Nodes (9): idx_ingestion_checkpoints_job, idx_lore_relationships_source_target, idx_lore_relationships_target_source, idx_lore_relationships_temporal, ingestion_checkpoints, lore_entities, lore_relationships, narrative_facts (+1 more)

### Community 32 - "Contract: [WXG-024] Panel de Gobernanza WIP & Consola de Dreaming en Vue 3"
Cohesion: 0.18
Nodes (10): 🧪 Casos Borde & Verificación, Contract: [WXG-024] Panel de Gobernanza WIP & Consola de Dreaming en Vue 3, ✅ Criterios de Aceptación (Definition of Done), 🤖 Herramientas MCP Obligatorias para Agentes, Post-conditions, Pre-conditions, Proposed Changes, 📋 Requisitos Técnicos (+2 more)

### Community 33 - "Contract: [WXG-024] Panel de Gobernanza WIP & Consola de Dreaming en Vue 3"
Cohesion: 0.18
Nodes (10): 🧪 Casos Borde & Verificación, Contract: [WXG-024] Panel de Gobernanza WIP & Consola de Dreaming en Vue 3, ✅ Criterios de Aceptación (Definition of Done), 🤖 Herramientas MCP Obligatorias para Agentes, Post-conditions, Pre-conditions, Proposed Changes, 📋 Requisitos Técnicos (+2 more)

### Community 34 - "Proposal: Motor de Grafos & Consultas Relacionales (WXG-002)"
Cohesion: 0.40
Nodes (4): Contexto e Impacto, Definition of Done (DoD), Por Qué (Why), Proposal: Motor de Grafos & Consultas Relacionales (WXG-002)

### Community 35 - "graph.ts"
Cohesion: 0.18
Nodes (7): AsOfChapterParamSchema, CreateRelationshipSchema, GetGraphPathQuerySchema, GetRelationshipsQuerySchema, GraphEntityNotFoundError, GraphError, GraphForeignKeyViolationError

### Community 36 - "devDependencies"
Cohesion: 0.17
Nodes (12): devDependencies, autoprefixer, jsdom, postcss, tailwindcss, @types/node, typescript, vite (+4 more)

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

### Community 48 - "dependencies"
Cohesion: 0.29
Nodes (7): dependencies, pinia, vue, @vue-flow/background, @vue-flow/controls, @vue-flow/core, @vueuse/core

### Community 49 - "vue"
Cohesion: 0.25
Nodes (5): *.vue, app, pinia, pinia, vue

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

### Community 59 - "frontend-dashboard Specification"
Cohesion: 0.25
Nodes (7): frontend-dashboard Specification, Purpose, Requirement: Depth-based Graph Query and Visualization, Requirement: Governance 423 Locked Disablement, Requirements, Scenario: Circuit breaker budget exceeded, Scenario: Fetching graph with depth filter

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

### Community 65 - "ADDED Requirements"
Cohesion: 0.29
Nodes (6): ADDED Requirements, Requirement: Depth-based Graph Query and Visualization, Requirement: Governance 423 Locked Disablement, Scenario: Circuit breaker budget exceeded, Scenario: Fetching graph with depth filter, Spec: Frontend Dashboard & Graph Visualizer

### Community 68 - "Requirements"
Cohesion: 0.20
Nodes (9): openspec-v2 Specification, Purpose, Requirement: Auto-Healing Subagent Protocol, Requirement: Btrfs CoW Snapshot Rollback Buffer, Requirement: Interactive Archify Visualization, Requirements, Scenario: Auto-Healing Execution, Scenario: Btrfs CoW Snapshot Verification (+1 more)

### Community 69 - "SqliteGraphRepository"
Cohesion: 0.21
Nodes (4): Tasks: Motor de Grafos & Consultas Relacionales (WXG-002), Tasks: Bi-Temporal Knowledge Graph Engine, mapRowToLoreRelationship(), SqliteGraphRepository

### Community 70 - "ADDED Requirements"
Cohesion: 0.29
Nodes (6): ADDED Requirements, Capability: HitL Alias Curation API, Requirement: Alias Review Action Endpoint, Requirement: Pending Alias Candidates Endpoint, Scenario: Approve Pending Alias, Scenario: Retrieve Pending Aliases

### Community 71 - "ADDED Requirements"
Cohesion: 0.22
Nodes (8): ADDED Requirements, Capability: OpenSpec v2 Engine, Requirement: Auto-Healing Subagent Protocol, Requirement: Btrfs CoW Snapshot Rollback Buffer, Requirement: Interactive Archify Visualization, Scenario: Auto-Healing Execution, Scenario: Btrfs CoW Snapshot Verification, Scenario: Visual Diagram Generation

### Community 72 - "Proposal: Frontend Dashboard & Graph Visualizer Integration (Vue 3)"
Cohesion: 0.40
Nodes (4): Context & Impact, Definition of Done, Proposal: Frontend Dashboard & Graph Visualizer Integration (Vue 3), Why

### Community 73 - "Design: HitL Alias Curation API & Vue 3 Component"
Cohesion: 0.40
Nodes (4): API Schema & Contracts, Coreference Reconciliation, Design: HitL Alias Curation API & Vue 3 Component, Ports & Adapters

### Community 74 - "core-and-graph-engine Specification"
Cohesion: 0.25
Nodes (7): core-and-graph-engine Specification, Purpose, Requirement: E2E In-Memory Test Suite Isolation, Requirement: Relational Lore Graph Querying, Requirements, Scenario: Querying relationship path, Scenario: Running full lifecycle test

### Community 77 - "pdf-ingestion Specification"
Cohesion: 0.25
Nodes (7): pdf-ingestion Specification, Purpose, Requirement: Chapter-Level Ingestion Checkpoints, Requirement: Human-in-the-Loop Alias Approval Queue, Requirements, Scenario: Resuming interrupted ingestion, Scenario: User approves proposed alias

### Community 78 - "ADDED Requirements"
Cohesion: 0.29
Nodes (6): ADDED Requirements, Requirement: Chapter-Level Ingestion Checkpoints, Requirement: Human-in-the-Loop Alias Approval Queue, Scenario: Resuming interrupted ingestion, Scenario: User approves proposed alias, Spec: Mass PDF Ingestion Engine

### Community 79 - "ADDED Requirements"
Cohesion: 0.29
Nodes (6): ADDED Requirements, Requirement: E2E In-Memory Test Suite Isolation, Requirement: Relational Lore Graph Querying, Scenario: Querying relationship path, Scenario: Running full lifecycle test, Spec: Core Architecture & Graph Engine

### Community 80 - "createGraphRouter"
Cohesion: 0.25
Nodes (4): Definition of Done, Proposal: Bi-Temporal Knowledge Graph Engine, What Changes, Why

### Community 81 - "Arquitectura Hexagonal"
Cohesion: 0.33
Nodes (5): 2. Infraestructura (`src/infrastructure/repositories/graphRepository.ts`), 3. Capa de API HTTP (`src/api/routes/graph.ts`), 4. Capa MCP (`src/mcp/tools/graphTools.ts`), Arquitectura Hexagonal, Design: Motor de Grafos & Consultas Relacionales (WXG-002)

### Community 83 - "Proposal: SaaS Mass PDF Chapter Ingestion Engine (WXG-004)"
Cohesion: 0.40
Nodes (4): Context & Impact, Definition of Done, Proposal: SaaS Mass PDF Chapter Ingestion Engine (WXG-004), Why

### Community 84 - "Proposal: Core Architecture, Graph Engine & E2E Integration Suite"
Cohesion: 0.40
Nodes (4): Context & Impact, Definition of Done, Proposal: Core Architecture, Graph Engine & E2E Integration Suite, Why

### Community 85 - "coreference.ts"
Cohesion: 0.09
Nodes (24): Definition of Done, Proposal: HitL Alias Curation API & Reactive Workflow, What Changes, Why, createAliasesRouter(), ReviewAliasDto, ReviewAliasSchema, BatchResolutionResult (+16 more)

### Community 86 - "Design: Mass PDF Ingestion Pipeline Architecture"
Cohesion: 0.50
Nodes (3): Design: Mass PDF Ingestion Pipeline Architecture, Diagrama de Flujo, Pipeline Fases

### Community 89 - "Proposal: OpenSpec Engine v2 (Archify, Btrfs CoW & Auto-Healing)"
Cohesion: 0.40
Nodes (4): Definition of Done, Proposal: OpenSpec Engine v2 (Archify, Btrfs CoW & Auto-Healing), What Changes, Why

### Community 90 - "Design: OpenSpec Engine v2 Architecture"
Cohesion: 0.50
Nodes (3): Architecture & Data Flow, Design: OpenSpec Engine v2 Architecture, Ports & Adapters

### Community 93 - "Guía de Despliegue en Raspberry Pi 4 (ARM64) — WuxiaGraph"
Cohesion: 0.17
Nodes (11): 1. Arquitectura y Restricciones de Recursos, 2. Dockerfile Multistage, 3. Configuración con Docker Compose, 4. Persistencia de Datos y SQLite WAL, 5. Health Check y Monitoreo, 6. Comandos Operativos, Consultar estado y métricas de memoria, Detener el servicio (+3 more)

### Community 94 - "Requirements"
Cohesion: 0.25
Nodes (7): Purpose, Requirement: Bi-Temporal Schema and Relationship History, Requirement: Frozen Subgraph Query As-Of Chapter, Requirements, Scenario: Query As-Of Chapter, Scenario: Temporal Relationship Mutation, temporal-kg Specification

### Community 95 - "scripts"
Cohesion: 0.40
Nodes (5): scripts, build, dev, preview, test

### Community 96 - "ADDED Requirements"
Cohesion: 0.29
Nodes (6): ADDED Requirements, Capability: Bi-Temporal Knowledge Graph, Requirement: Bi-Temporal Schema and Relationship History, Requirement: Frozen Subgraph Query As-Of Chapter, Scenario: Query As-Of Chapter, Scenario: Temporal Relationship Mutation

### Community 97 - "ADDED Requirements"
Cohesion: 0.29
Nodes (6): ADDED Requirements, Capability: Docker RPi4 Deployment, Requirement: Application Health Check, Requirement: Low-Memory Multistage Docker Container, Scenario: Build and Run Low-Memory Container, Scenario: Health Check Execution

### Community 98 - "Proposal: Optimized Docker Deployment for Raspberry Pi 4 (ARM64)"
Cohesion: 0.40
Nodes (4): Definition of Done, Proposal: Optimized Docker Deployment for Raspberry Pi 4 (ARM64), What Changes, Why

### Community 99 - "Design: Bi-Temporal Knowledge Graph Architecture"
Cohesion: 0.40
Nodes (4): Design: Bi-Temporal Knowledge Graph Architecture, Ports & Adapters, Schema Extensions, Temporal Query Logic

### Community 100 - "Design: Docker RPi4 ARM64 Packaging"
Cohesion: 0.50
Nodes (3): Design: Docker RPi4 ARM64 Packaging, Docker Compose Limits, Multistage Build Strategy

## Knowledge Gaps
- **15 isolated node(s):** `@vueuse/core`, `@types/node`, `autoprefixer`, `jsdom`, `postcss` (+10 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 677 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **12 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `GraphService` connect `GraphService` to `LoreEntity`, `tools/index.ts`, `graph.ts`, `SqliteGraphRepository`, `database.ts`, `LoreRelationship`, `createGraphRouter`, `Requirements`, `ADDED Requirements`, `Proposal: SaaS Mass PDF Chapter Ingestion Engine (WXG-004)`, `Architecture & Data Schema`?**
  _High betweenness centrality (0.041) - this node is a cross-community bridge._
- **Are the 9 inferred relationships involving `GraphService` (e.g. with `1. Dominio (`src/domain/graph/`)` and `Requirement: Domain Graph Service Pathfinding`) actually correct?**
  _`GraphService` has 9 INFERRED edges - model-reasoned connections that need verification._
- **What connects `@vueuse/core`, `@types/node`, `autoprefixer` to the rest of the system?**
  _15 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `workerQueue.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.050436953807740326 - nodes in this community are weakly interconnected._
- **Why does `hono` connect `database.ts` to `workerQueue.ts`, `LoreEntity`, `graph.ts`, `package.json`, `coreference.ts`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `IWipGovernanceRepository` (e.g. with `Context` and `2. Invariantes Implementadas`) actually correct?**
  _`IWipGovernanceRepository` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Should `LoreEntity` be split into smaller, more focused modules?**
  _Cohesion score 0.057738572574178026 - nodes in this community are weakly interconnected._