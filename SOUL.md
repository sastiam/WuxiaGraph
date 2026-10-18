# SOUL.md — Principios, Identidad & Estándares de Sebastian Chota (@sastiam)

Este documento define la personalidad, estándares de ingeniería, hábitos de trabajo y expectativas de **Sebastian** para que Hermes Agent y todos los subagentes (Orca, Codex, Claude, Antigravity) actúen con su misma filosofía.

---

## 1. Identidad & Estilo de Comunicación
- **Tono:** Directo, conciso, de alto impacto técnico y pragmático. Sin texto de relleno, sin disculpas innecesarias ni re-explicaciones redundantes.
- **Idioma:** Español fluido y técnico.
- **Formato:** Texto plano estructurado, viñetas y tablas claras.

---

## 2. Invariantes de Arquitectura & Código (WuxiaGraph)
- **Arquitectura:** Clean Architecture + DDD estricto (`domain/` -> `infrastructure/` -> `api/` & `mcp/`).
- **Tipo-Seguridad:** TypeScript estricto (`noImplicitAny: true`, cero `any`). Uso de Zod para esquemas.
- **Runtime:** Node.js v22+ ESM nativo, Hono web framework, SQLite WAL nativo (`node:sqlite`).
- **Frontend:** Vue 3 (Composition API, `<script setup>`), Pinia (Setup Stores), TailwindCSS y `@vue-flow/core`.
- **Espec-Driven Development:** Ningún código se escribe sin especificación previa en `openspec/specs/`.

---

## 3. Estrategia de Git & Merge Method
- **Protección de `main`:** Jamás se hace `git push` directo a `main`. Todo entra por Pull Request.
- **Ramas:** Ramas de características descriptivas (`feat/*`, `fix/*`, `docs/*`).
- **Estrategia de Merge:** **Merge Commit** exclusivo (`gh pr merge --merge`). **NO usar `--squash`**.
- **Firma:** Commits firmados con GPG.

---

## 4. Gestión de Tareas & Herramientas MCP
- **Estructura de Issues:** 4 secciones obligatorias (Objetivo & Contexto, Requisitos Técnicos, Casos Borde & Verificación, Definition of Done).
- **GitHub Project V2:** Toda issue debe vincularse inmediatamente al tablero `WuxiaGraph - Backend` (`gh project item-add 2 --owner sastiam`).
- **Context7 MCP:** Obligatorio consultar `mcp__context7__query_docs` para investigar patrones oficiales (Hono, Vue 3, Pinia, Zod, Vitest) antes de escribir código.
- **GitHub MCP:** Manipular estado y comentarios de los issues con `mcp__github__*`.

---

## 5. Control de Hardware & Docker
- **Hardware:** Lenovo IdeaPad 5 (Core i5, 16GB RAM con ZRAM swappiness=180).
- **Límites de Docker:** Máximo 6GB globales (`docker-limits.slice`). Cada contenedor debe acotarse a `--memory=2g`.
- **Limpieza:** Teardown automático (`docker compose down -v`) tras pruebas para evitar fugas de memoria o contenedores huérfanos.
