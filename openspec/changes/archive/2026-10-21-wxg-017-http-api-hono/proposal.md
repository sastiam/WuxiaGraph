# Proposal

## Why

El proyecto WuxiaGraph requiere exponer sus servicios de dominio (Context Injector, Dreaming Service y WIP Governance) mediante una interfaz HTTP pública y consistente construida sobre Hono. Esto permite a clientes externos, servicios web y agentes consumir la funcionalidad del Motor de Memoria Canónica y Registrar WIP.

## What Changes

- Creación del servidor HTTP central en `src/api/router.ts` montando los enrutadores:
  - `POST /api/v1/dreaming/distill`
  - `GET /api/v1/context/inject`
  - `POST /api/v1/wip/log`
- Implementación de middleware global de CORS y formateo centralizado de errores (`app.onError`).
- Implementación de middleware/helper declarativo Zod para validación de esquemas de entrada.
- Manejo centralizado de excepciones (`HTTPException`, `ZodError`, `WipLimitExceededError` -> 423 Locked, errores de dominio -> 400 Bad Request, fallos no controlados -> 500 Internal Server Error).
- Pruebas de integración HTTP en `tests/api/routes.test.ts` con Hono `app.request()`.

## Capabilities

### New Capabilities
- `http-api`: Servidor web HTTP con Hono, enrutadores de servicios, middleware Zod y gestión centralizada de errores HTTP.

### Modified Capabilities

## Impact

- `src/api/index.ts`, `src/api/router.ts`, `src/api/context.router.ts`, `src/api/routes/dreaming.ts`, `src/api/routes/governance.ts`, `src/api/schemas/governance.ts`
- `src/index.ts`
- `tests/api/routes.test.ts`
