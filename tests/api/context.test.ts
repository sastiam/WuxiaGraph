import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { DatabaseSync } from 'node:sqlite';
import {
  createDatabase,
  insertLoreEntity,
  insertNarrativeFact,
} from '../../src/infrastructure/database.js';
import { createApp } from '../../src/index.js';
import type { Hono } from 'hono';

describe('API HTTP: GET /api/v1/context/inject', () => {
  let db: DatabaseSync;
  let app: Hono;

  beforeEach(() => {
    db = createDatabase(':memory:');
    app = createApp({ db });
  });

  afterEach(() => {
    db.close();
  });

  it('debe responder 200 OK con el contexto inyectado canónico para un dominio válido', async () => {
    const domain = 'Wuxia/Sects';

    insertLoreEntity(db, {
      entityId: 'sect-huashan',
      domain,
      canonicalName: 'Secta Hua Shan',
      currentStatus: 'THRIVING',
      attributes: {
        leader: 'Yue Buqun',
        style: 'Gentleman Sword Art',
      },
    });

    insertNarrativeFact(db, {
      factId: 'fact-hs-1',
      entityId: 'sect-huashan',
      factStatement: 'La Secta Hua Shan se divide en facciones de Espada y Qi.',
      isCanon: true,
      chapterSource: 'Capítulo 1',
    });

    insertNarrativeFact(db, {
      factId: 'fact-hs-draft',
      entityId: 'sect-huashan',
      factStatement: 'Borrador: La Secta fue completamente destruida.',
      isCanon: false,
      chapterSource: 'Notas de Autor',
    });

    const res = await app.request(`/api/v1/context/inject?domain=${encodeURIComponent(domain)}`);
    expect(res.status).toBe(200);

    const body = (await res.json()) as {
      domain: string;
      promptPrefix: string;
      entitiesCount: number;
      factsCount: number;
      entities: Array<{
        entity: { canonicalName: string; entityId: string };
        facts: Array<{ factId: string; factStatement: string; isCanon: boolean }>;
      }>;
    };

    expect(body.domain).toBe(domain);
    expect(body.entitiesCount).toBe(1);
    expect(body.factsCount).toBe(1);
    expect(body.entities[0].entity.canonicalName).toBe('Secta Hua Shan');
    expect(body.entities[0].facts).toHaveLength(1);
    expect(body.entities[0].facts[0].factId).toBe('fact-hs-1');
    expect(body.entities[0].facts[0].isCanon).toBe(true);

    // Verificación de descarte estricto en el promptPrefix
    expect(body.promptPrefix).toContain('facciones de Espada y Qi');
    expect(body.promptPrefix).not.toContain('Borrador: La Secta fue completamente destruida');
  });

  it('debe responder 200 OK para un dominio sin entidades registradas', async () => {
    const res = await app.request('/api/v1/context/inject?domain=UnusedDomain');
    expect(res.status).toBe(200);

    const body = (await res.json()) as {
      domain: string;
      promptPrefix: string;
      entitiesCount: number;
      factsCount: number;
      entities: unknown[];
    };

    expect(body.domain).toBe('UnusedDomain');
    expect(body.entitiesCount).toBe(0);
    expect(body.factsCount).toBe(0);
    expect(body.entities).toEqual([]);
    expect(body.promptPrefix).toContain(
      'No canonical entities or facts found for domain: UnusedDomain.'
    );
  });

  it('debe responder 400 Bad Request si el parámetro domain no se envía en la query', async () => {
    const res = await app.request('/api/v1/context/inject');
    expect(res.status).toBe(400);

    const body = (await res.json()) as { error: string; message: string };
    expect(body.error).toBe('INVALID_REQUEST');
    expect(body.message).toContain('domain');
  });

  it('debe responder 400 Bad Request si el parámetro domain está vacío o contiene sólo espacios', async () => {
    const res = await app.request('/api/v1/context/inject?domain=   ');
    expect(res.status).toBe(400);

    const body = (await res.json()) as { error: string; message: string };
    expect(body.error).toBe('INVALID_REQUEST');
    expect(body.message).toContain('Parameter "domain" is required and cannot be empty');
  });
});
