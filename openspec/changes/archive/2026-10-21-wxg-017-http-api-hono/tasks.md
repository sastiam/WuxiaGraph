# Tasks

## 1. Esquemas y Enrutador de Gobernanza WIP

- [x] 1.1 Crear `src/api/schemas/governance.ts` con `LogWipSchema` Zod y verificar tipos con `npx tsc --noEmit`
- [x] 1.2 Crear `src/api/routes/governance.ts` con la función `createGovernanceRouter(govRepo)` exponiendo `POST /log` y verificar la compilación con `npx tsc --noEmit`

## 2. Enrutador Principal, Middlewares y Servidor Central

- [x] 2.1 Crear `src/api/router.ts` con `createApiRouter()` unificando CORS, enrutadores de Context, Dreaming y Governance, e interceptando errores en `app.onError` (`HTTPException`, `ZodError`, `WipLimitExceededError`, excepciones de Dominio) y verificar compilación con `npx tsc --noEmit`
- [x] 2.2 Actualizar `src/api/index.ts` y `src/index.ts` exportando e integrando el nuevo enrutador principal `src/api/router.ts` y verificar que el servidor inicie correctamente con `pnpm dev` / `npx tsc --noEmit`

## 3. Pruebas de Integración y Verificación

- [x] 3.1 Crear `tests/api/routes.test.ts` con casos de prueba usando Hono `app.request()` para `POST /api/v1/dreaming/distill`, `GET /api/v1/context/inject` y `POST /api/v1/wip/log`, incluyendo respuestas de error 400 y 423 y verificar que pasen con `pnpm test`
- [x] 3.2 Ejecutar la verificación completa de tipos y suite de pruebas (`pnpm typecheck && pnpm test`) y confirmar que 100% de las pruebas estén en verde
