# OpenSpec [WXG-001]: Backend Core Architecture, Graph Engine, Circuit Breaker & MCP Server

## 1. Intent & Capability
Implementar la arquitectura Backend de **WuxiaGraph** en TypeScript con Hono, incluyendo el motor de almacenamiento relacional en SQLite WAL (`node:sqlite`), el motor de grafos de entidades/relaciones, la lógica de gobernanza WIP (Circuit Breaker) y la interfaz MCP (Model Context Protocol).

## 2. Invariantes de Arquitectura & Código
- **Runtime & Modularidad:** Node.js v22+/26+ ESM (`"type": "module"`), TypeScript estricto.
- **Framework Web:** Hono (`hono` + `@hono/node-server`).
- **Base de Datos:** SQLite en modo WAL (`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;`) usando la API nativa `node:sqlite`.
- **Clean Architecture / DDD:**
  - `src/domain/`: Interfaces, entidades y excepciones puras de negocio.
  - `src/infrastructure/`: Repositorio SQLite, mapeadores y adaptador D1.
  - `src/api/`: Handlers HTTP Hono y esquemas Zod.
  - `src/mcp/`: Servidor de herramientas Model Context Protocol (MCP).
- **Validación & Pruebas:** Zod para esquemas, Vitest para tests de unidad e integración.

## 3. Esquema de Base de Datos (schema.sql)
```sql
CREATE TABLE IF NOT EXISTS lore_entities (
    entity_id TEXT PRIMARY KEY,
    domain TEXT NOT NULL,
    canonical_name TEXT NOT NULL,
    current_status TEXT NOT NULL,
    attributes_json TEXT NOT NULL,
    last_updated_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS narrative_facts (
    fact_id TEXT PRIMARY KEY,
    entity_id TEXT REFERENCES lore_entities(entity_id),
    fact_statement TEXT NOT NULL,
    is_canon BOOLEAN DEFAULT 1,
    chapter_source TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS wip_governance_ledger (
    week_start_date DATE PRIMARY KEY,
    total_hours_logged REAL DEFAULT 0.0,
    max_budget_hours REAL DEFAULT 4.0,
    branches_opened_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'IN_LIMITS'
);
```

## 4. Casos de Uso Críticos
1. **Dreaming Service:** Endpoint `POST /api/v1/dreaming/distill` para extraer/guardar hechos en `narrative_facts` y actualizar `lore_entities`.
2. **Context Injector:** Endpoint `GET /api/v1/context/inject?domain={domain}` para construir un prefijo de prompt inmutable filtrando por `is_canon = 1`.
3. **WIP Circuit Breaker:** Endpoint `POST /api/v1/wip/log` que actualiza horas y cambia el estado a `LOCKED_BY_WIP` si `total_hours_logged > 4.0`.
4. **Servidor MCP:** Herramientas MCP expuestas (`get_canonical_entities`, `query_facts`, `check_wip_budget`).

## 5. Pruebas de Casos Borde Exigidos
- [x] Test de verificación de SQLite WAL e integridad de llaves foráneas.
- [x] Test del Circuit Breaker en el límite exacto (3.99h permite avance, 4.01h bloquea).
- [x] Test de inyección de contexto descartando borradores (`is_canon = 0`).
- [x] Test de ejecución de herramientas MCP retornando JSON válido.
