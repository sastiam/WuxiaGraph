# OpenSpec Change Proposal: WXG-015 Context Injector Service

## 1. Contexto & Propósito
Implementación del servicio de inyección de contexto canónico para prompts de LLMs conforme al requerimiento WXG-001 (Caso de Uso 2: `GET /api/v1/context/inject?domain={domain}`).

## 2. Invariantes Implementadas
- **Filtro Canónico Obligatorio:** Se descartan de forma estricta todos los hechos narrativos donde `is_canon = 0` (borradores o notas de autor).
- **Determinismo e Inmutabilidad:** Formateo determinista de entidades, hechos y atributos ordenados alfabéticamente; resultado profundo congelado (`deepFreeze`).
- **Clean Architecture / DDD:**
  - `src/domain/context/`: Tipos puros, `IContextRepository` y `ContextInjectorService`.
  - `src/infrastructure/`: `SqliteContextRepository` y consulta SQL con `LEFT JOIN` optimizado sobre `lore_entities` y `narrative_facts`.
  - `src/api/`: Enrutador Hono con validación Zod (`contextQuerySchema`).
- **Casos Borde Cubiertos:**
  - Dominio inexistente o vacío: retorna estructura por defecto válida sin fallar.
  - Dominio inválido o vacío: responde HTTP 400 Bad Request.
  - Entidades con múltiples hechos o sin hechos.
