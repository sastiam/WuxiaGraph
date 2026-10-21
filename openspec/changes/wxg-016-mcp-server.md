# OpenSpec Change Proposal: WXG-016 MCP Server & Tools

## 1. Contexto & Propósito
Implementación del servidor Model Context Protocol (MCP) en `src/mcp/` conforme a la especificación WXG-001 (Caso de Uso 4) e Issue #12. Expone herramientas canónicas estandarizadas (`get_canonical_entities`, `query_facts`, `check_wip_budget`) para integración con asistentes inteligentes y agentes de IA.

## 2. Invariantes Implementadas
- **Clean Architecture / DDD Estricto:**
  - `src/mcp/` actúa como adaptador de entrada primario (junto a `src/api/`). Depende exclusivamente de los puertos e interfaces del dominio (`IDreamingRepository`, `IWipGovernanceRepository`, `IContextRepository`).
  - Cero dependencias de infraestructura dentro de `src/mcp/`.
  - Cero uso de `any` (`strict: true`, uso de `unknown` + esquemas de validación Zod).
- **Herramientas MCP Expuestas:**
  - `get_canonical_entities`: Consulta entidades canónicas de lore por dominio o por estado actual.
  - `query_facts`: Búsqueda de hechos narrativos canónicos (`is_canon = 1`), descartando estrictamente notas y borradores no canónicos (`is_canon = 0`), con filtros opcionales por palabra clave (case-insensitive), `entityId` o `chapterSource`.
  - `check_wip_budget`: Consulta del ledger semanal de gobernanza y estado del Circuit Breaker (límite estricto de 4.0h, `IN_LIMITS` vs `LOCKED_BY_WIP`).
- **Protocolo MCP v1.x & JSON-RPC 2.0:**
  - Soporte de métodos estándar: `initialize`, `notifications/initialized`, `ping`, `tools/list`, `tools/call`.
  - Formato estructurado de respuestas con bloques `content: [{ type: "text", text: "..." }]` y señalización booleana `isError`.
  - Respuestas formateadas en JSON estricto serializable y parseable.
  - Manejo transparente de errores de validación mediante Zod retornando `isError: true` y descripciones detalladas.
- **Integración HTTP:**
  - Endpoint `POST /api/v1/mcp` en la aplicación Hono para interactuar vía JSON-RPC sobre HTTP.

## 3. Verificación & Casos Borde Cubiertos
- Filtro canónico estricto: Hechos con `is_canon = 0` jamás son retornados por `query_facts`.
- Verificación del umbral del Circuit Breaker: 3.99h permite avance (`isLocked: false`), 4.01h reporta `LOCKED_BY_WIP` (`isLocked: true`).
- Rechazo de tipos de datos o formatos inválidos con mensajes explicativos en formato MCP.
- 34 pruebas automatizadas en `tests/mcp/tools.test.ts` con cobertura completa.
