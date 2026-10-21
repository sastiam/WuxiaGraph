import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { DatabaseSync } from 'node:sqlite';
import {
  createDatabase,
  insertLoreEntity,
  insertNarrativeFact,
  upsertWipLedger,
} from '../../src/infrastructure/database.js';
import { SqliteGraphRepository } from '../../src/infrastructure/repositories/graphRepository.js';
import { SqliteDreamingRepository } from '../../src/infrastructure/repositories/dreamingRepository.js';
import { SqliteWipGovernanceRepository } from '../../src/infrastructure/sqlite-wip-governance.repository.js';
import { SqliteContextRepository } from '../../src/infrastructure/sqlite-context.repository.js';
import { GraphService } from '../../src/domain/graph/graphService.js';
import { DreamingService } from '../../src/domain/dreaming/index.js';
import { ContextInjectorService } from '../../src/domain/context/index.js';
import { createMcpServer } from '../../src/mcp/index.js';
import { createApp } from '../../src/index.js';
import type { Hono } from 'hono';

describe('[WXG-018 / #14] Suite E2E de Integración Backend Core', () => {
  let db: DatabaseSync;
  let app: Hono;
  let graphRepo: SqliteGraphRepository;
  let graphService: GraphService;

  beforeEach(() => {
    db = createDatabase(':memory:');

    // Inicializar repositorios
    const contextRepo = new SqliteContextRepository(db);
    const dreamingRepo = new SqliteDreamingRepository(db);
    const govRepo = new SqliteWipGovernanceRepository(db);
    graphRepo = new SqliteGraphRepository(db);

    // Inicializar servicios
    const contextService = new ContextInjectorService(contextRepo);
    const dreamingService = new DreamingService(dreamingRepo, govRepo);
    graphService = new GraphService(graphRepo);

    const mcpServer = createMcpServer({
      dreamingRepo,
      govRepo,
      contextRepo,
      graphRepo,
      graphService,
    });

    app = createApp({
      db,
      contextService,
      dreamingService,
      graphService,
      mcpServer,
    });

    // Poblar datos de prueba iniciales
    insertLoreEntity(db, {
      entityId: 'ent_han_li',
      domain: 'xianxia',
      canonicalName: 'Han Li (韩立)',
      currentStatus: 'ALIVE',
      attributes: { sect: 'Yellow Maple Valley' },
    });

    insertLoreEntity(db, {
      entityId: 'ent_li_feiyu',
      domain: 'xianxia',
      canonicalName: 'Li Feiyu (厉飞雨)',
      currentStatus: 'ALIVE',
      attributes: { relationship: 'Sworn Brother' },
    });

    insertLoreEntity(db, {
      entityId: 'ent_nangong_wan',
      domain: 'xianxia',
      canonicalName: 'Nangong Wan (南宫婉)',
      currentStatus: 'ALIVE',
      attributes: { sect: 'Masked Moon Sect' },
    });
  });

  afterEach(() => {
    db.close();
  });

  describe('Salud del Sistema (Health Check)', () => {
    it('GET /health debe retornar status ok y timestamp', async () => {
      const res = await app.request('/health');
      expect(res.status).toBe(200);
      const data = (await res.json()) as { status: string; timestamp: string };
      expect(data.status).toBe('ok');
      expect(data.timestamp).toBeDefined();
    });
  });

  describe('Integración HTTP API de Grafos (/api/v1/graph)', () => {
    it('POST /api/v1/graph/relationships debe registrar una relación y GET la consulta', async () => {
      const postRes = await app.request('/api/v1/graph/relationships', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          relationship_id: 'rel_sworn_brothers',
          source_entity_id: 'ent_han_li',
          target_entity_id: 'ent_li_feiyu',
          relationship_type: 'SWORN_BROTHERS',
          affinity_weight: 0.9,
          description: 'Hermanos jurados en el valle',
        }),
      });

      expect(postRes.status).toBe(201);

      const getRes = await app.request('/api/v1/graph/relationships?entityId=ent_han_li');
      expect(getRes.status).toBe(200);
      const rels = (await getRes.json()) as Array<{ relationship_id: string; affinity_weight: number }>;
      expect(rels).toHaveLength(1);
      expect(rels[0]?.relationship_id).toBe('rel_sworn_brothers');
      expect(rels[0]?.affinity_weight).toBe(0.9);
    });

    it('GET /api/v1/graph/path debe encontrar la ruta entre entidades conectadas', async () => {
      await graphRepo.addRelationship({
        relationship_id: 'r1',
        source_entity_id: 'ent_han_li',
        target_entity_id: 'ent_li_feiyu',
        relationship_type: 'ALLY',
        affinity_weight: 0.8,
      });

      await graphRepo.addRelationship({
        relationship_id: 'r2',
        source_entity_id: 'ent_li_feiyu',
        target_entity_id: 'ent_nangong_wan',
        relationship_type: 'ACQUAINTANCE',
        affinity_weight: 0.5,
      });

      const res = await app.request(
        '/api/v1/graph/path?source=ent_han_li&target=ent_nangong_wan&algorithm=bfs'
      );
      expect(res.status).toBe(200);
      const data = (await res.json()) as {
        path: string[];
        total_affinity: number;
        relationships: unknown[];
      };

      expect(data.path).toEqual(['ent_han_li', 'ent_li_feiyu', 'ent_nangong_wan']);
      expect(data.total_affinity).toBe(1.3);
      expect(data.relationships).toHaveLength(2);
    });
  });

  describe('Integración de Herramientas MCP vía HTTP POST /api/v1/mcp', () => {
    beforeEach(async () => {
      await graphRepo.addRelationship({
        relationship_id: 'mcp_r1',
        source_entity_id: 'ent_han_li',
        target_entity_id: 'ent_nangong_wan',
        relationship_type: 'DAO_COMPANION',
        affinity_weight: 1.0,
      });

      insertNarrativeFact(db, {
        factId: 'f1',
        entityId: 'ent_han_li',
        factStatement: 'Han Li obtuvo la botella verde.',
        isCanon: true,
        chapterSource: 'Capítulo 1',
      });
    });

    it('debe ejecutar query_entity_graph mediante JSON-RPC', async () => {
      const res = await app.request('/api/v1/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 'mcp-1',
          method: 'tools/call',
          params: {
            name: 'query_entity_graph',
            arguments: { entityId: 'ent_han_li' },
          },
        }),
      });

      expect(res.status).toBe(200);
      const body = (await res.json()) as {
        result: { content: Array<{ text: string }>; isError: boolean };
      };
      expect(body.result.isError).toBe(false);

      const parsed = JSON.parse(body.result.content[0]!.text) as {
        relationships: Array<{ relationship_id: string }>;
        count: number;
      };
      expect(parsed.count).toBe(1);
      expect(parsed.relationships[0]?.relationship_id).toBe('mcp_r1');
    });

    it('debe ejecutar find_relationship_path mediante JSON-RPC', async () => {
      const res = await app.request('/api/v1/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 'mcp-2',
          method: 'tools/call',
          params: {
            name: 'find_relationship_path',
            arguments: {
              sourceEntityId: 'ent_han_li',
              targetEntityId: 'ent_nangong_wan',
            },
          },
        }),
      });

      expect(res.status).toBe(200);
      const body = (await res.json()) as {
        result: { content: Array<{ text: string }>; isError: boolean };
      };
      expect(body.result.isError).toBe(false);

      const parsed = JSON.parse(body.result.content[0]!.text) as {
        path: string[];
        total_affinity: number;
      };
      expect(parsed.path).toEqual(['ent_han_li', 'ent_nangong_wan']);
      expect(parsed.total_affinity).toBe(1.0);
    });

    it('debe ejecutar get_canonical_entities mediante JSON-RPC', async () => {
      const res = await app.request('/api/v1/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 'mcp-3',
          method: 'tools/call',
          params: {
            name: 'get_canonical_entities',
            arguments: { domain: 'xianxia' },
          },
        }),
      });

      expect(res.status).toBe(200);
      const body = (await res.json()) as {
        result: { content: Array<{ text: string }>; isError: boolean };
      };
      expect(body.result.isError).toBe(false);
      const parsed = JSON.parse(body.result.content[0]!.text) as { count: number };
      expect(parsed.count).toBe(3);
    });

    it('debe ejecutar check_wip_budget mediante JSON-RPC', async () => {
      upsertWipLedger(db, {
        weekStartDate: '2026-10-19',
        totalHoursLogged: 2.5,
        maxBudgetHours: 4.0,
        branchesOpenedCount: 1,
        status: 'IN_LIMITS',
      });

      const res = await app.request('/api/v1/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 'mcp-4',
          method: 'tools/call',
          params: {
            name: 'check_wip_budget',
            arguments: { weekStartDate: '2026-10-19' },
          },
        }),
      });

      expect(res.status).toBe(200);
      const body = (await res.json()) as {
        result: { content: Array<{ text: string }>; isError: boolean };
      };
      expect(body.result.isError).toBe(false);
      const parsed = JSON.parse(body.result.content[0]!.text) as {
        totalHoursLogged: number;
        remainingHours: number;
      };
      expect(parsed.totalHoursLogged).toBe(2.5);
      expect(parsed.remainingHours).toBe(1.5);
    });
  });
});
