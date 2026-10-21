import { describe, it, expect, beforeEach } from 'vitest';
import type { DatabaseSync } from 'node:sqlite';
import type { Hono } from 'hono';
import { z } from 'zod';
import { createApp } from '../../src/index.js';
import { createDatabase, insertLoreEntity, insertNarrativeFact, upsertWipLedger } from '../../src/infrastructure/database.js';
import { SqliteDreamingRepository } from '../../src/infrastructure/repositories/dreamingRepository.js';
import { SqliteWipGovernanceRepository } from '../../src/infrastructure/sqlite-wip-governance.repository.js';
import { SqliteContextRepository } from '../../src/infrastructure/sqlite-context.repository.js';
import { ContextInjectorService } from '../../src/domain/context/index.js';
import { DreamingService } from '../../src/domain/dreaming/service.js';
import { createApiRouter } from '../../src/api/router.js';

describe('HTTP API: Integration Suite via app.request()', () => {
  let db: DatabaseSync;
  let dreamingRepo: SqliteDreamingRepository;
  let govRepo: SqliteWipGovernanceRepository;
  let contextRepo: SqliteContextRepository;
  let dreamingService: DreamingService;
  let contextService: ContextInjectorService;
  let app: Hono;

  beforeEach(() => {
    db = createDatabase(':memory:');
    dreamingRepo = new SqliteDreamingRepository(db);
    govRepo = new SqliteWipGovernanceRepository(db);
    contextRepo = new SqliteContextRepository(db);
    dreamingService = new DreamingService(dreamingRepo, govRepo);
    contextService = new ContextInjectorService(contextRepo);
    app = createApp({ db, contextService, dreamingService, govRepo });
  });

  describe('CORS and Global Headers', () => {
    it('debe responder con cabeceras CORS en solicitudes OPTIONS / peticiones HTTP', async () => {
      const res = await app.request('/health', {
        method: 'GET',
        headers: { Origin: 'http://localhost:5173' },
      });
      expect(res.status).toBe(200);
      expect(res.headers.get('access-control-allow-origin')).toBe('*');
    });
  });

  describe('GET /api/v1/context/inject', () => {
    it('debe responder HTTP 200 con el contexto inyectado cuando el dominio existe', async () => {
      // Sembrar datos canónicos
      insertLoreEntity(db, {
        entityId: 'ent_elder_li',
        canonicalName: 'Elder Li',
        domain: 'wuxia',
        currentStatus: 'ALIVE',
        attributes: {},
      });
      insertNarrativeFact(db, {
        factId: 'fact_elder_1',
        entityId: 'ent_elder_li',
        factStatement: 'Elder Li es el patriarca de la Secta de la Espada.',
        isCanon: true,
        chapterSource: 'Capítulo 1',
      });

      const res = await app.request('/api/v1/context/inject?domain=wuxia', {
        method: 'GET',
      });

      expect(res.status).toBe(200);
      const json = (await res.json()) as { domain: string; promptPrefix: string; factsCount: number };
      expect(json.domain).toBe('wuxia');
      expect(json.factsCount).toBe(1);
      expect(json.promptPrefix).toContain('Elder Li');
    });

    it('debe responder HTTP 400 cuando falta el parámetro domain', async () => {
      const res = await app.request('/api/v1/context/inject', {
        method: 'GET',
      });
      expect(res.status).toBe(400);
      const json = (await res.json()) as { error: string };
      expect(json.error).toBe('INVALID_REQUEST');
    });

    it('debe responder HTTP 400 cuando el parámetro domain está vacío', async () => {
      const res = await app.request('/api/v1/context/inject?domain=%20', {
        method: 'GET',
      });
      expect(res.status).toBe(400);
      const json = (await res.json()) as { error: string };
      expect(json.error).toBe('INVALID_REQUEST');
    });
  });

  describe('POST /api/v1/dreaming/distill', () => {
    it('debe destilar texto y responder HTTP 200 con success: true', async () => {
      const res = await app.request('/api/v1/dreaming/distill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chapterSource: 'Capítulo 1: El Despertar',
          domain: 'xianxia',
          text: 'Han Li descubrió un frasco verde misterioso.',
        }),
      });

      expect(res.status).toBe(200);
      const json = (await res.json()) as { success: boolean; data: { chapterSource: string; facts: unknown[] } };
      expect(json.success).toBe(true);
      expect(json.data.chapterSource).toBe('Capítulo 1: El Despertar');
      expect(json.data.facts.length).toBeGreaterThan(0);
    });

    it('debe responder HTTP 400 si el JSON es inválido', async () => {
      const res = await app.request('/api/v1/dreaming/distill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid-json{{{',
      });

      expect(res.status).toBe(400);
      const json = (await res.json()) as { error: string };
      expect(json.error).toBe('INVALID_JSON');
    });

    it('debe responder HTTP 400 si la validación Zod falla (sin chapterSource)', async () => {
      const res = await app.request('/api/v1/dreaming/distill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: 'Sin chapterSource',
        }),
      });

      expect(res.status).toBe(400);
      const json = (await res.json()) as { error: string };
      expect(json.error).toBe('VALIDATION_ERROR');
    });

    it('debe responder HTTP 423 Locked con LOCKED_BY_WIP si el presupuesto WIP está agotado', async () => {
      const currentWeek = (await govRepo.getOrCreateCurrentWeekLedger()).weekStartDate;
      upsertWipLedger(db, {
        weekStartDate: currentWeek,
        totalHoursLogged: 4.1,
        status: 'LOCKED_BY_WIP',
      });

      const res = await app.request('/api/v1/dreaming/distill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chapterSource: 'Capítulo 2: Bloqueado',
          text: 'No debería procesarse debido a WIP lock.',
        }),
      });

      expect(res.status).toBe(423);
      const json = (await res.json()) as { error: string };
      expect(json.error).toBe('LOCKED_BY_WIP');
    });
  });

  describe('POST /api/v1/wip/log', () => {
    it('debe registrar horas exitosamente dentro del límite (HTTP 200)', async () => {
      const res = await app.request('/api/v1/wip/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hours: 1.5,
        }),
      });

      expect(res.status).toBe(200);
      const json = (await res.json()) as {
        success: boolean;
        data: { totalHoursLogged: number; status: string; weekStartDate: string };
      };
      expect(json.success).toBe(true);
      expect(json.data.totalHoursLogged).toBe(1.5);
      expect(json.data.status).toBe('IN_LIMITS');
    });

    it('debe registrar horas para una semana específica si se provee weekStartDate (HTTP 200)', async () => {
      const res = await app.request('/api/v1/wip/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hours: 2.0,
          weekStartDate: '2026-10-12',
        }),
      });

      expect(res.status).toBe(200);
      const json = (await res.json()) as {
        success: boolean;
        data: { totalHoursLogged: number; weekStartDate: string };
      };
      expect(json.success).toBe(true);
      expect(json.data.weekStartDate).toBe('2026-10-12');
      expect(json.data.totalHoursLogged).toBe(2.0);
    });

    it('debe retornar HTTP 400 si el JSON es inválido', async () => {
      const res = await app.request('/api/v1/wip/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid-body',
      });

      expect(res.status).toBe(400);
      const json = (await res.json()) as { error: string };
      expect(json.error).toBe('INVALID_JSON');
    });

    it('debe retornar HTTP 400 si hours no es positivo o no es número', async () => {
      const resZero = await app.request('/api/v1/wip/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hours: 0 }),
      });
      expect(resZero.status).toBe(400);
      const jsonZero = (await resZero.json()) as { error: string };
      expect(jsonZero.error).toBe('VALIDATION_ERROR');

      const resNegative = await app.request('/api/v1/wip/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hours: -1 }),
      });
      expect(resNegative.status).toBe(400);

      const resString = await app.request('/api/v1/wip/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hours: 'two' }),
      });
      expect(resString.status).toBe(400);
    });

    it('debe retornar HTTP 400 si weekStartDate tiene formato de fecha inválido', async () => {
      const res = await app.request('/api/v1/wip/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hours: 1, weekStartDate: 'not-a-date' }),
      });
      expect(res.status).toBe(400);
      const json = (await res.json()) as { error: string };
      expect(json.error).toBe('VALIDATION_ERROR');
    });

    it('debe retornar HTTP 423 Locked con LOCKED_BY_WIP cuando se intenta superar las 4.0h', async () => {
      // Registramos primero 3.5h
      const res1 = await app.request('/api/v1/wip/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hours: 3.5 }),
      });
      expect(res1.status).toBe(200);

      // Intentamos registrar 0.6h adicionales (3.5 + 0.6 = 4.1 > 4.0)
      const res2 = await app.request('/api/v1/wip/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hours: 0.6 }),
      });

      expect(res2.status).toBe(423);
      const json = (await res2.json()) as {
        error: string;
        currentHours?: number;
        attemptedHours?: number;
        maxBudget?: number;
      };
      expect(json.error).toBe('LOCKED_BY_WIP');
      expect(json.currentHours).toBe(3.5);
      expect(json.attemptedHours).toBe(0.6);
      expect(json.maxBudget).toBe(4.0);
    });
  });

  describe('Centralized Error Handling (createApiRouter)', () => {
    it('debe manejar ZodError lanzado desde una ruta retornando HTTP 400', async () => {
      const customApp = createApiRouter({
        contextService,
        dreamingService,
        govRepo,
      });

      // Añadimos una ruta de prueba que arroje ZodError directamente
      customApp.get('/api/v1/test-zod-error', () => {
        const testSchema = z.object({ num: z.number() });
        testSchema.parse({ num: 'not-a-number' });
      });

      const res = await customApp.request('/api/v1/test-zod-error');
      expect(res.status).toBe(400);
      const json = (await res.json()) as { error: string; details: unknown[] };
      expect(json.error).toBe('VALIDATION_ERROR');
      expect(json.details.length).toBeGreaterThan(0);
    });

    it('debe manejar errores no controlados retornando HTTP 500', async () => {
      const customApp = createApiRouter({
        contextService,
        dreamingService,
        govRepo,
      });

      customApp.get('/api/v1/unhandled-error', () => {
        throw new Error('Explosión inesperada');
      });

      const res = await customApp.request('/api/v1/unhandled-error');
      expect(res.status).toBe(500);
      const json = (await res.json()) as { error: string; message: string };
      expect(json.error).toBe('INTERNAL_SERVER_ERROR');
      expect(json.message).toBe('Explosión inesperada');
    });
  });
});
