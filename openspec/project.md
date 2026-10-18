# WuxiaGraph: Project Overview

## 1. Visión y Propósito
**WuxiaGraph** es un motor de memoria canónica y ledger de gobernanza de roadmap diseñado para el seguimiento de la continuidad narrativa, relaciones entre entidades y hechos canónicos en novelas del género Xianxia / Wuxia. Además, actúa como un sistema de gobernanza activa para agentes de inteligencia artificial y desarrolladores humanos, aplicando límites estrictos de WIP (Work In Progress) y protegiendo el foco cognitivo.

## 2. Stack Tecnológico
- **Runtime:** Node.js v22+ / v26+ ESM (`"type": "module"`).
- **Lenguaje:** TypeScript estricto (`strict: true`, `noImplicitAny: true`, cero `any`).
- **Framework HTTP:** Hono (`hono` + `@hono/node-server`).
- **Almacenamiento:** SQLite en modo WAL nativo a través de `node:sqlite` (`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;`).
- **Protocolo de IA:** Servidor MCP (Model Context Protocol).
- **Validación:** Zod.
- **Testing:** Vitest para pruebas unitarias y de integración.
- **Gestor de Paquetes:** pnpm.

## 3. Arquitectura del Código
El proyecto sigue **Clean Architecture** y principios de **Domain-Driven Design (DDD)**:
- `src/domain/`: Núcleo de lógica de negocio pura. Sin acoplamiento a frameworks, SQLite ni librerías de infraestructura.
- `src/infrastructure/`: Adaptadores, repositorios SQLite WAL, DDL (`schema.sql`) y clientes externos.
- `src/api/`: Controladores y enrutadores HTTP con Hono, middlewares y esquemas Zod.
- `src/mcp/`: Implementación del servidor Model Context Protocol exponiendo herramientas canónicas.
- `tests/`: Suite de pruebas automatizadas con Vitest.

## 4. Gobernanza y Filosofía de Desarrollo
- **Regla del 4/1:** Máximo 4 horas de desarrollo activo semanales (WIP Circuit Breaker), limitando a un único proyecto enfocado para evitar sobrecarga y degradación de calidad.
- **Spec-Driven Development:** Toda capacidad se documenta formalmente en `openspec/specs/` antes o en paralelo a su implementación.
- **Invariantes Inmutables:** Los agentes deben respetar estrictamente las normas definidas en `AGENTS.md`.
