import { describe, it, expect, beforeEach } from 'vitest';
import type { DatabaseSync } from 'node:sqlite';
import { createApp } from '../../src/api/index.js';
import { createDatabase, upsertWipLedger } from '../../src/infrastructure/database.js';
import { SqliteDreamingRepository } from '../../src/infrastructure/repositories/dreamingRepository.js';
import { SqliteWipGovernanceRepository } from '../../src/infrastructure/sqlite-wip-governance.repository.js';
import { DreamingService } from '../../src/domain/dreaming/service.js';
import type { Hono } from 'hono';

describe('HTTP API: POST /api/v1/dreaming/distill', () => {
  let db: DatabaseSync;
  let dreamingRepo: SqliteDreamingRepository;
  let govRepo: SqliteWipGovernanceRepository;
  let dreamingService: DreamingService;
  let app: Hono;

  beforeEach(() => {
    db = createDatabase(':memory:');
    dreamingRepo = new SqliteDreamingRepository(db);
    govRepo = new SqliteWipGovernanceRepository(db);
    dreamingService = new DreamingService(dreamingRepo, govRepo);
    app = createApp({ db, dreamingService });
  });

  it('debe destilar entidades y hechos narrativos exitosamente (HTTP 200)', async () => {
    const payload = {
      chapterSource: 'Capítulo 1: El Reino Mortal',
      domain: 'xianxia',
      entities: [
        {
          entityId: 'ent_han_li',
          canonicalName: 'Han Li (韩立)',
          domain: 'xianxia',
          currentStatus: 'ALIVE',
          attributes: { sect: 'Yellow Maple Valley', stage: 'Qi Condensation' },
        },
      ],
      facts: [
        {
          factId: 'fact_han_1',
          entityId: 'ent_han_li',
          factStatement: 'Han Li recolectó hierbas espirituales en la montaña.',
          isCanon: true,
        },
      ],
    };

    const res = await app.request('/api/v1/dreaming/distill', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      success: boolean;
      data: {
        domain: string;
        chapterSource: string;
        entities: Array<{ entityId: string; canonicalName: string }>;
        facts: Array<{ factId: string; factStatement: string; isCanon: boolean }>;
      };
    };

    expect(body.success).toBe(true);
    expect(body.data.chapterSource).toBe('Capítulo 1: El Reino Mortal');
    expect(body.data.entities.length).toBe(1);
    expect(body.data.entities[0].canonicalName).toBe('Han Li (韩立)');
    expect(body.data.facts.length).toBe(1);
    expect(body.data.facts[0].isCanon).toBe(true);

    // Verificar persistencia directa en base de datos
    const entityInDb = await dreamingRepo.getEntity('ent_han_li');
    expect(entityInDb).not.toBeNull();
    expect(entityInDb?.canonicalName).toBe('Han Li (韩立)');
  });

  it('debe procesar texto con caracteres unicode orientales y destilar hechos automáticamente', async () => {
    const payload = {
      chapterSource: '第10章: 筑基丹',
      domain: 'xianxia',
      entities: [
        {
          entityId: 'ent_han_li_cn',
          canonicalName: '韩立',
        },
      ],
      text: '韩立进入了黄枫谷。他服用了筑基丹！他的修为突破了。',
    };

    const res = await app.request('/api/v1/dreaming/distill', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      success: boolean;
      data: {
        entities: Array<{ entityId: string }>;
        facts: Array<{ factId: string; factStatement: string; entityId: string | null }>;
      };
    };

    expect(body.success).toBe(true);
    expect(body.data.facts.length).toBe(3);
    // El primer hecho menciona a 韩立 y debe asociarse automáticamente a su entityId
    expect(body.data.facts[0].entityId).toBe('ent_han_li_cn');
    expect(body.data.facts[0].factStatement).toBe('韩立进入了黄枫谷');
  });

  it('debe retornar HTTP 400 Bad Request si el cuerpo no es JSON válido', async () => {
    const res = await app.request('/api/v1/dreaming/distill', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'invalid-json{{{',
    });

    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string; message: string };
    expect(body.error).toBe('INVALID_JSON');
  });

  it('debe retornar HTTP 400 si falta chapterSource en el payload', async () => {
    const res = await app.request('/api/v1/dreaming/distill', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: 'Texto sin fuente de capítulo.',
      }),
    });

    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe('VALIDATION_ERROR');
  });

  it('debe retornar HTTP 400 cuando attributes_json contiene JSON malformado', async () => {
    const payload = {
      chapterSource: 'Capítulo 2',
      entities: [
        {
          entityId: 'ent_bad_attr',
          canonicalName: 'Bad Attr Entity',
          attributes: '{ unclosed json string...',
        },
      ],
    };

    const res = await app.request('/api/v1/dreaming/distill', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string; entityId?: string };
    expect(body.error).toBe('INVALID_ENTITY_ATTRIBUTES');
    expect(body.entityId).toBe('ent_bad_attr');
  });

  it('debe retornar HTTP 400 por violación de Foreign Key si el entity_id no existe y revertir la transacción', async () => {
    const payload = {
      chapterSource: 'Capítulo 3',
      entities: [
        {
          entityId: 'ent_valid_temp',
          canonicalName: 'Entidad Valida Que Debe Revertirse',
        },
      ],
      facts: [
        {
          factId: 'fact_with_invalid_fk',
          entityId: 'ent_ghost_99999',
          factStatement: 'Hecho referenciando entidad inexistente.',
        },
      ],
    };

    const res = await app.request('/api/v1/dreaming/distill', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(['FOREIGN_KEY_VIOLATION', 'ENTITY_NOT_FOUND']).toContain(body.error);

    // Comprobar que por el rollback atómico, ent_valid_temp NO se guardó
    const rolledBackEntity = await dreamingRepo.getEntity('ent_valid_temp');
    expect(rolledBackEntity).toBeNull();
  });

  it('debe retornar HTTP 400 si la entrada está completamente vacía (sin texto, entidades ni hechos)', async () => {
    const payload = {
      chapterSource: 'Capítulo Vacío',
    };

    const res = await app.request('/api/v1/dreaming/distill', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe('INVALID_DISTILL_INPUT');
  });

  it('debe retornar HTTP 423 Locked cuando el Circuit Breaker de WIP está activado (> 4.0h)', async () => {
    // Bloqueamos el ledger en la base de datos
    const weekStart = '2026-10-12';
    upsertWipLedger(db, {
      weekStartDate: weekStart,
      totalHoursLogged: 4.1,
      status: 'LOCKED_BY_WIP',
    });

    const payload = {
      chapterSource: 'Capítulo Bloqueado',
      text: 'Texto de prueba mientras el sistema está en bloqueo WIP.',
    };

    const res = await app.request('/api/v1/dreaming/distill', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    expect(res.status).toBe(423);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe('LOCKED_BY_WIP');
  });
});
