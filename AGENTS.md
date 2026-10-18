# Protocolo de Agentes & Reglas de Desarrollo — WuxiaGraph

Este documento establece las invariantes de arquitectura, estándares de ingeniería de software y protocolos operativos de observancia obligatoria para cualquier agente de inteligencia artificial (Orca, subagentes autónomos, asistentes LLM) y desarrolladores humanos que colaboren en el repositorio **WuxiaGraph**.

---

## 1. Principio Fundamental: Spec-Driven Development (OpenSpec)

1. **La especificación es la única fuente de la verdad (Source of Truth):**
   - Antes de iniciar la implementación de cualquier funcionalidad, consulta `openspec/specs/` (por ejemplo, `001-backend-core.spec.md`).
   - Los cambios a las capacidades del sistema deben registrarse mediante propuestas estructuradas en `openspec/changes/` o actualizar la especificación correspondiente en `openspec/specs/`.
2. **Prohibido asumir requerimientos:**
   - Si una especificación o ticket deja un comportamiento indeterminado, no inventes convenciones arbitrarias. Consulta o documenta explícitamente el supuesto en el plan de trabajo.

---

## 2. Invariantes Arquitectónicas (Clean Architecture / DDD)

El proyecto organiza su código en capas concéntricas con una regla estricta de dependencia unidireccional:

```
┌────────────────────────────────────────────────────────┐
│               src/api/ & src/mcp/                      │  (Adaptadores de Entrada: Hono HTTP, Servidor MCP)
└──────────────────────────┬─────────────────────────────┘
                           │ depende de
┌──────────────────────────▼─────────────────────────────┐
│                   src/domain/                          │  (Núcleo Puro: Entidades, Interfaces, Errores)
└──────────────────────────▲─────────────────────────────┘
                           │ implementado por
┌──────────────────────────┴─────────────────────────────┐
│              src/infrastructure/                       │  (Adaptadores de Salida: SQLite WAL, DDL, IO)
└────────────────────────────────────────────────────────┘
```

### Reglas de cada capa:

1. **`src/domain/` (Dominio Puro):**
   - **Propósito:** Contiene entidades de negocio, Value Objects, interfaces/puertos de repositorios y clases de error de dominio.
   - **Regla Inquebrantable:** CERO dependencias de frameworks externos (prohibido importar `hono`, librerías de base de datos o herramientas externas). Solo TypeScript estándar y utilidades puras sin efectos secundarios.

2. **`src/infrastructure/` (Infraestructura y Persistencia):**
   - **Propósito:** Implementa los puertos definidos en `src/domain/` utilizando persistencia nativa SQLite (`node:sqlite`) en modo WAL (`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;`).
   - **Regla:** Gestiona conexiones, migraciones DDL (`schema.sql`) y mapeo bidireccional entre registros de base de datos y entidades de dominio.

3. **`src/api/` (Capa de Presentación HTTP):**
   - **Propósito:** Define endpoints HTTP mediante el framework **Hono**, esquemas de validación con **Zod** y middlewares.
   - **Regla:** Los controladores traducen peticiones HTTP a llamadas a servicios de dominio o casos de uso. Nunca acoples lógica de negocio compleja directamente dentro de los route handlers.

4. **`src/mcp/` (Servidor Model Context Protocol):**
   - **Propósito:** Expone herramientas MCP estandarizadas (`get_canonical_entities`, `query_facts`, `check_wip_budget`) para interacción de agentes inteligentes.
   - **Regla:** Invoca puertos de dominio y formatea respuestas en JSON estricto.

5. **`tests/` (Suite de Pruebas):**
   - **Propósito:** Pruebas unitarias, de integración y de límites de gobernanza ejecutadas con **Vitest**.

### Regla de Dependencia:
- Las dependencias apuntan **exclusivamente hacia adentro**: `api`, `mcp` e `infrastructure` pueden depender de `domain`.
- **Bajo ninguna circunstancia** `src/domain/` debe importar de `src/infrastructure/`, `src/api/` o `src/mcp/`.

---

## 3. Estándar de Código: Cero `any`, Cero Espagueti, Cero Código Muerto

1. **Tolerancia Cero con `any`:**
   - El uso de `any` está estrictamente prohibido en todo el repositorio.
   - Utiliza tipado estricto, interfaces explícitas, uniones discriminadas o `unknown` combinado con validadores Zod (`z.infer<typeof Schema>`) o type guards.
2. **Modularidad y Responsabilidad Única (SRP):**
   - Prohibido el código espagueti. Cada módulo o archivo debe tener un propósito delimitado.
   - Evita funciones monolíticas; divide flujos complejos en pasos componibles y testeables.
3. **Cero Código Muerto:**
   - No dejes bloques de código comentados, imports en desuso, variables huérfanas ni stubs innecesarios.
   - Si una función o tipo deja de utilizarse, elimínalo por completo. Git conserva el historial.
4. **Módulo ESM Puro:**
   - El proyecto utiliza `"type": "module"`. Usa sintaxis nativa `import` / `export` y extensiones relativas explícitas (`.js`) según requiera la resolución de módulos de Node.js.

---

## 4. Pruebas Automatizadas Obligatorias por Ticket

1. **Cada cambio de código debe acompañarse de pruebas:**
   - No se acepta ningún ticket, feature o corrección de bugs sin tests automatizados en Vitest dentro de `tests/` o co-localizados (`*.test.ts`).
2. **Cobertura de Casos de Borde (Boundary Tests):**
   - No limites las pruebas a casos felices. Es obligatorio probar:
     - **Integridad relacional SQLite:** Comportamiento ante llaves foráneas inválidas (`PRAGMA foreign_keys=ON;`).
     - **Circuit Breaker de Gobernanza WIP:** Verificar el umbral exacto de 4.0h (ej. 3.99h permite ejecución, 4.01h bloquea con `LOCKED_BY_WIP`).
     - **Filtro Canónico:** Exclusión estricta de hechos no canónicos (`is_canon = 0`) al construir contextos.
3. **Verificación Previa a la Entrega:**
   - La suite de tests debe pasar al 100% en verde de forma reproducible (`pnpm test`).

---

## 5. Gobernanza WIP y Regla del 4/1

WuxiaGraph implementa un Circuit Breaker para proteger el ancho de banda del proyecto:
- **Límite de tiempo:** Máximo 4.0 horas de trabajo activo por semana.
- **Límite de alcance:** Un único proyecto/flujo a la vez (1 proyecto activo).
- Si el ledger de gobernanza excede las 4.0 horas, la API y las herramientas MCP bloquearán las operaciones de modificación (`LOCKED_BY_WIP`). Respeta este principio tanto en el código como en la cadencia de desarrollo.
