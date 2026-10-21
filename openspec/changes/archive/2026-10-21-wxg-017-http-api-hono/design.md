# Design

## Context

WuxiaGraph cuenta con servicios de dominio (`ContextInjectorService`, `DreamingService`, `IWipGovernanceRepository`) implementados con Clean Architecture. Ver `proposal.md`. Se requiere un servidor central Hono que unifique los enrutadores HTTP y aplique middlewares transversales de error y validación.

## Goals / Non-Goals

**Goals:**
- Implementar `src/api/routes/governance.ts` y `src/api/schemas/governance.ts` para el endpoint `POST /api/v1/wip/log`.
- Implementar `src/api/router.ts` como el orquestador principal que configura middlewares de CORS, unifica las rutas `/api/v1/context`, `/api/v1/dreaming` y `/api/v1/wip` y maneja excepciones centralizadamente en `app.onError`.
- Implementar helper/middleware Zod declarativo para validaciones uniformes.
- Proporcionar pruebas de integración HTTP en `tests/api/routes.test.ts`.

**Non-Goals:**
- Autenticación o autorización OAuth/JWT (fuera del alcance de WXG-017).

## Decisions

- **Middleware CORS:** Usar `cors()` de `hono/cors` para permitir clientes web locales y agentes.
- **Manejo Centralized de Errores con `app.onError`:**
  - Interceptar `ZodError` retornando HTTP 400 Bad Request con `details: err.issues`.
  - Interceptar `WipLimitExceededError` retornando HTTP 423 Locked con `error: 'LOCKED_BY_WIP'`.
  - Interceptar `HTTPException` retornando `err.getResponse()`.
  - Interceptar de forma general errores de dominio retornando HTTP 400.
- **Estructura de `POST /api/v1/wip/log`:**
  - Esquema Zod `LogWipSchema`: `{ hours: z.number().positive() }`.
  - Handler invoca `govRepo.logHours` y responde con `{ success: true, data: ledger }`.

## Risks / Trade-offs

- [Risk] Incompatibilidad de tipos entre Zod v4 y middleware de Hono → [Mitigation] Usar helper wrapper explícito `validateZod` con `c.req.json()` o `c.req.query()`.
