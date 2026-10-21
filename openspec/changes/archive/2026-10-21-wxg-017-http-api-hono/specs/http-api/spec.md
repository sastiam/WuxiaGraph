# Spec Delta

## Purpose

Proporcionar un servidor de API HTTP sobre Hono que expone de forma segura, estructurada y validada los servicios de dominio de WuxiaGraph, gestionando errores mediante middleware centralizado y esquemas Zod.

## ADDED Requirements

### Requirement: Exposición de Endpoints REST de Servicios Canónicos
El servidor HTTP SHALL exponer los endpoints REST para la destilación del Servicio Dreaming, inyección de contexto canónico y registro de gobernanza WIP.

#### Scenario: Petición exitosa a /api/v1/dreaming/distill
- **WHEN** un cliente envía POST `/api/v1/dreaming/distill` con payload de destilación válido
- **THEN** el servidor procesa la destilación y responde HTTP 200 con `{ success: true, data: result }`

#### Scenario: Petición exitosa a /api/v1/context/inject
- **WHEN** un cliente consulta GET `/api/v1/context/inject?domain=wuxia`
- **THEN** el servidor responde HTTP 200 con la estructura de contexto inyectado canónico

#### Scenario: Petición exitosa a /api/v1/wip/log
- **WHEN** un cliente envía POST `/api/v1/wip/log` con `{ hours: number }` dentro de los límites
- **THEN** el servidor registra las horas en el ledger semanal y responde HTTP 200 con `{ success: true, data: ledger }`

### Requirement: Gestión Centralizada de Errores y Validaciones
El servidor HTTP SHALL interceptar errores y validar datos con esquemas Zod retornando respuestas de error estructuradas.

#### Scenario: Error de Validación Zod
- **WHEN** un cliente envía un payload o query inváido
- **THEN** el servidor retorna HTTP 400 Bad Request con detalles estructurados de validación

#### Scenario: Exceso de Límite WIP (Circuit Breaker)
- **WHEN** una operación supera la cuota máxima permitida de WIP (> 4.0h)
- **THEN** el servidor responde HTTP 423 Locked con código `LOCKED_BY_WIP`

#### Scenario: Error Inesperado no Controlado
- **WHEN** ocurre una excepción no controlada en el servidor
- **THEN** el servidor responde HTTP 500 con formato JSON `{ error: 'INTERNAL_SERVER_ERROR', message: string }`
