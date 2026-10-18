import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { DatabaseSync } from 'node:sqlite';
import {
  createDatabase,
  insertLoreEntity,
  insertNarrativeFact,
  upsertWipLedger,
} from '../../src/infrastructure/database.js';
import { SqliteDreamingRepository } from '../../src/infrastructure/repositories/dreamingRepository.js';
import { SqliteWipGovernanceRepository } from '../../src/infrastructure/sqlite-wip-governance.repository.js';
import {
  createMcpServer,
  McpServer,
  getAllToolDefinitions,
  executeTool,
} from '../../src/mcp/index.js';
import { createApp } from '../../src/index.js';
import type { Hono } from 'hono';

describe('[WXG-016] Model Context Protocol (MCP) Server & Tools', () => {
  let db: DatabaseSync;
  let dreamingRepo: SqliteDreamingRepository;
  let govRepo: SqliteWipGovernanceRepository;
  let mcpServer: McpServer;
  let app: Hono;

  beforeEach(() => {
    db = createDatabase(':memory:');
    dreamingRepo = new SqliteDreamingRepository(db);
    govRepo = new SqliteWipGovernanceRepository(db);
    mcpServer = createMcpServer({ dreamingRepo, govRepo });
    app = createApp({ db, mcpServer });
  });

  afterEach(() => {
    db.close();
  });

  describe('Herramienta: get_canonical_entities', () => {
    beforeEach(() => {
      insertLoreEntity(db, {
        entityId: 'ent_han_li',
        domain: 'xianxia',
        canonicalName: 'Han Li (韩立)',
        currentStatus: 'ALIVE',
        attributes: { sect: 'Yellow Maple Valley', stage: 'Qi Condensation' },
      });

      insertLoreEntity(db, {
        entityId: 'ent_nangong_wan',
        domain: 'xianxia',
        canonicalName: 'Nangong Wan (南宫婉)',
        currentStatus: 'ALIVE',
        attributes: { sect: 'Masked Moon Sect', stage: 'Core Formation' },
      });

      insertLoreEntity(db, {
        entityId: 'ent_old_monster',
        domain: 'xianxia',
        canonicalName: 'Old Monster Mo',
        currentStatus: 'DECEASED',
        attributes: { role: 'Antagonist' },
      });

      insertLoreEntity(db, {
        entityId: 'ent_linghu_chong',
        domain: 'wuxia',
        canonicalName: 'Linghu Chong (令狐冲)',
        currentStatus: 'ALIVE',
        attributes: { sect: 'Hua Shan', style: 'Dugu Nine Swords' },
      });
    });

    it('debe retornar todas las entidades cuando no se especifican filtros', async () => {
      const result = await mcpServer.callTool('get_canonical_entities', {});

      expect(result.isError).toBe(false);
      expect(result.content).toHaveLength(1);
      expect(result.content[0]?.type).toBe('text');

      const parsed = JSON.parse(result.content[0]?.text ?? '{}') as {
        entities: Array<{ entityId: string; canonicalName: string }>;
        count: number;
      };

      expect(parsed.count).toBe(4);
      expect(parsed.entities).toHaveLength(4);
      expect(parsed.entities.map((e) => e.entityId)).toEqual(
        expect.arrayContaining(['ent_han_li', 'ent_nangong_wan', 'ent_old_monster', 'ent_linghu_chong'])
      );
    });

    it('debe filtrar entidades por dominio narrativo', async () => {
      const result = await mcpServer.callTool('get_canonical_entities', { domain: 'wuxia' });

      expect(result.isError).toBe(false);
      const parsed = JSON.parse(result.content[0]?.text ?? '{}') as {
        entities: Array<{ entityId: string; canonicalName: string }>;
        count: number;
      };

      expect(parsed.count).toBe(1);
      expect(parsed.entities[0]?.entityId).toBe('ent_linghu_chong');
      expect(parsed.entities[0]?.canonicalName).toBe('Linghu Chong (令狐冲)');
    });

    it('debe filtrar entidades por estado actual', async () => {
      const result = await mcpServer.callTool('get_canonical_entities', { status: 'DECEASED' });

      expect(result.isError).toBe(false);
      const parsed = JSON.parse(result.content[0]?.text ?? '{}') as {
        entities: Array<{ entityId: string; currentStatus: string }>;
        count: number;
      };

      expect(parsed.count).toBe(1);
      expect(parsed.entities[0]?.entityId).toBe('ent_old_monster');
      expect(parsed.entities[0]?.currentStatus).toBe('DECEASED');
    });

    it('debe filtrar por dominio y estado simultáneamente', async () => {
      const result = await mcpServer.callTool('get_canonical_entities', {
        domain: 'xianxia',
        status: 'ALIVE',
      });

      expect(result.isError).toBe(false);
      const parsed = JSON.parse(result.content[0]?.text ?? '{}') as {
        entities: Array<{ entityId: string }>;
        count: number;
      };

      expect(parsed.count).toBe(2);
      expect(parsed.entities.map((e) => e.entityId)).toEqual(
        expect.arrayContaining(['ent_han_li', 'ent_nangong_wan'])
      );
    });

    it('debe retornar lista vacía si ninguna entidad coincide', async () => {
      const result = await mcpServer.callTool('get_canonical_entities', {
        domain: 'cyberpunk',
      });

      expect(result.isError).toBe(false);
      const parsed = JSON.parse(result.content[0]?.text ?? '{}') as {
        entities: unknown[];
        count: number;
      };

      expect(parsed.count).toBe(0);
      expect(parsed.entities).toEqual([]);
    });

    it('debe rechazar argumentos inválidos con isError=true y mensaje explicativo', async () => {
      const result = await mcpServer.callTool('get_canonical_entities', {
        domain: 12345,
      });

      expect(result.isError).toBe(true);
      expect(result.content[0]?.text).toContain('Error de validación en argumentos');
      expect(result.content[0]?.text).toContain('domain');
    });

    it('debe rechazar cadenas vacías con isError=true', async () => {
      const result = await mcpServer.callTool('get_canonical_entities', {
        status: '   ',
      });

      expect(result.isError).toBe(true);
      expect(result.content[0]?.text).toContain('Error de validación en argumentos');
      expect(result.content[0]?.text).toContain('status');
    });
  });

  describe('Herramienta: query_facts', () => {
    beforeEach(() => {
      insertLoreEntity(db, {
        entityId: 'ent_han_li',
        domain: 'xianxia',
        canonicalName: 'Han Li (韩立)',
        currentStatus: 'ALIVE',
        attributes: {},
      });

      insertLoreEntity(db, {
        entityId: 'ent_li_feiyu',
        domain: 'xianxia',
        canonicalName: 'Li Feiyu (厉飞雨)',
        currentStatus: 'ALIVE',
        attributes: {},
      });

      // Hechos canónicos (is_canon = 1)
      insertNarrativeFact(db, {
        factId: 'fact_canon_1',
        entityId: 'ent_han_li',
        factStatement: 'Han Li descubrió la misteriosa botella de jade verde en el bosque.',
        isCanon: true,
        chapterSource: 'Capítulo 1: La Botella Verde',
      });

      insertNarrativeFact(db, {
        factId: 'fact_canon_2',
        entityId: 'ent_han_li',
        factStatement: 'Han Li practicó el Arte de la Elevación Espiritual en Yellow Maple Valley.',
        isCanon: true,
        chapterSource: 'Capítulo 15: Entrada a la Secta',
      });

      insertNarrativeFact(db, {
        factId: 'fact_canon_3',
        entityId: 'ent_li_feiyu',
        factStatement: 'Li Feiyu aprendió la técnica de la Espada Parpadeante.',
        isCanon: true,
        chapterSource: 'Capítulo 5: Hermandad Mortal',
      });

      // Hecho NO canónico / borrador (is_canon = 0)
      insertNarrativeFact(db, {
        factId: 'fact_draft_1',
        entityId: 'ent_han_li',
        factStatement: 'Borrador descartado: Han Li murió envenenado por el Doctor Mo.',
        isCanon: false,
        chapterSource: 'Notas de Autor',
      });
    });

    it('debe excluir estrictamente hechos no canónicos (is_canon = 0)', async () => {
      const result = await mcpServer.callTool('query_facts', {});

      expect(result.isError).toBe(false);
      const parsed = JSON.parse(result.content[0]?.text ?? '{}') as {
        facts: Array<{ factId: string; isCanon: boolean; factStatement: string }>;
        count: number;
      };

      expect(parsed.count).toBe(3);
      expect(parsed.facts.every((f) => f.isCanon === true)).toBe(true);
      expect(parsed.facts.some((f) => f.factId === 'fact_draft_1')).toBe(false);
      expect(parsed.facts.some((f) => f.factStatement.includes('Borrador descartado'))).toBe(false);
    });

    it('debe buscar hechos canónicos por palabra clave (case-insensitive)', async () => {
      const result = await mcpServer.callTool('query_facts', { keyword: 'BOTELLA DE JADE' });

      expect(result.isError).toBe(false);
      const parsed = JSON.parse(result.content[0]?.text ?? '{}') as {
        facts: Array<{ factId: string; factStatement: string }>;
        count: number;
      };

      expect(parsed.count).toBe(1);
      expect(parsed.facts[0]?.factId).toBe('fact_canon_1');
      expect(parsed.facts[0]?.factStatement).toContain('botella de jade verde');
    });

    it('debe filtrar hechos canónicos por entityId', async () => {
      const result = await mcpServer.callTool('query_facts', { entityId: 'ent_li_feiyu' });

      expect(result.isError).toBe(false);
      const parsed = JSON.parse(result.content[0]?.text ?? '{}') as {
        facts: Array<{ factId: string; entityId: string }>;
        count: number;
      };

      expect(parsed.count).toBe(1);
      expect(parsed.facts[0]?.factId).toBe('fact_canon_3');
      expect(parsed.facts[0]?.entityId).toBe('ent_li_feiyu');
    });

    it('debe filtrar hechos canónicos por chapterSource', async () => {
      const result = await mcpServer.callTool('query_facts', {
        chapterSource: 'Capítulo 15',
      });

      expect(result.isError).toBe(false);
      const parsed = JSON.parse(result.content[0]?.text ?? '{}') as {
        facts: Array<{ factId: string; chapterSource: string }>;
        count: number;
      };

      expect(parsed.count).toBe(1);
      expect(parsed.facts[0]?.factId).toBe('fact_canon_2');
      expect(parsed.facts[0]?.chapterSource).toContain('Capítulo 15');
    });

    it('debe combinar filtros de entityId y keyword', async () => {
      const result = await mcpServer.callTool('query_facts', {
        entityId: 'ent_han_li',
        keyword: 'Yellow Maple',
      });

      expect(result.isError).toBe(false);
      const parsed = JSON.parse(result.content[0]?.text ?? '{}') as {
        facts: Array<{ factId: string }>;
        count: number;
      };

      expect(parsed.count).toBe(1);
      expect(parsed.facts[0]?.factId).toBe('fact_canon_2');
    });

    it('debe retornar lista vacía si ninguna coincidencia canónica existe', async () => {
      const result = await mcpServer.callTool('query_facts', {
        keyword: 'terminator cybernetic',
      });

      expect(result.isError).toBe(false);
      const parsed = JSON.parse(result.content[0]?.text ?? '{}') as {
        facts: unknown[];
        count: number;
      };

      expect(parsed.count).toBe(0);
      expect(parsed.facts).toEqual([]);
    });

    it('debe rechazar argumentos inválidos con isError=true', async () => {
      const result = await mcpServer.callTool('query_facts', {
        keyword: 99999,
      });

      expect(result.isError).toBe(true);
      expect(result.content[0]?.text).toContain('Error de validación en argumentos para query_facts');
    });
  });

  describe('Herramienta: check_wip_budget', () => {
    it('debe reportar estado en límites para la semana actual por defecto', async () => {
      const result = await mcpServer.callTool('check_wip_budget', {});

      expect(result.isError).toBe(false);
      const parsed = JSON.parse(result.content[0]?.text ?? '{}') as {
        weekStartDate: string;
        totalHoursLogged: number;
        maxBudgetHours: number;
        remainingHours: number;
        branchesOpenedCount: number;
        status: string;
        isLocked: boolean;
      };

      expect(parsed.weekStartDate).toBeDefined();
      expect(parsed.totalHoursLogged).toBe(0);
      expect(parsed.maxBudgetHours).toBe(4.0);
      expect(parsed.remainingHours).toBe(4.0);
      expect(parsed.branchesOpenedCount).toBe(0);
      expect(parsed.status).toBe('IN_LIMITS');
      expect(parsed.isLocked).toBe(false);
    });

    it('debe reportar estado dentro de los límites en el umbral seguro (3.99h)', async () => {
      const weekStartDate = '2026-10-12';
      upsertWipLedger(db, {
        weekStartDate,
        totalHoursLogged: 3.99,
        maxBudgetHours: 4.0,
        branchesOpenedCount: 1,
        status: 'IN_LIMITS',
      });

      const result = await mcpServer.callTool('check_wip_budget', { weekStartDate });

      expect(result.isError).toBe(false);
      const parsed = JSON.parse(result.content[0]?.text ?? '{}') as {
        totalHoursLogged: number;
        remainingHours: number;
        status: string;
        isLocked: boolean;
      };

      expect(parsed.totalHoursLogged).toBe(3.99);
      expect(parsed.remainingHours).toBe(0.01);
      expect(parsed.status).toBe('IN_LIMITS');
      expect(parsed.isLocked).toBe(false);
    });

    it('debe reportar LOCKED_BY_WIP e isLocked=true cuando se supera el límite de 4.0h (4.01h)', async () => {
      const weekStartDate = '2026-10-12';
      upsertWipLedger(db, {
        weekStartDate,
        totalHoursLogged: 4.01,
        maxBudgetHours: 4.0,
        branchesOpenedCount: 1,
        status: 'LOCKED_BY_WIP',
      });

      const result = await mcpServer.callTool('check_wip_budget', { weekStartDate });

      expect(result.isError).toBe(false);
      const parsed = JSON.parse(result.content[0]?.text ?? '{}') as {
        totalHoursLogged: number;
        remainingHours: number;
        status: string;
        isLocked: boolean;
      };

      expect(parsed.totalHoursLogged).toBe(4.01);
      expect(parsed.remainingHours).toBe(0);
      expect(parsed.status).toBe('LOCKED_BY_WIP');
      expect(parsed.isLocked).toBe(true);
    });

    it('debe inicializar ledger por defecto si la semana solicitada no existe', async () => {
      const weekStartDate = '2026-11-02';
      const result = await mcpServer.callTool('check_wip_budget', { weekStartDate });

      expect(result.isError).toBe(false);
      const parsed = JSON.parse(result.content[0]?.text ?? '{}') as {
        weekStartDate: string;
        totalHoursLogged: number;
        remainingHours: number;
        status: string;
        isLocked: boolean;
      };

      expect(parsed.weekStartDate).toBe('2026-11-02');
      expect(parsed.totalHoursLogged).toBe(0);
      expect(parsed.remainingHours).toBe(4.0);
      expect(parsed.status).toBe('IN_LIMITS');
      expect(parsed.isLocked).toBe(false);
    });

    it('debe rechazar formato de fecha inválido con isError=true', async () => {
      const result = await mcpServer.callTool('check_wip_budget', {
        weekStartDate: '12-10-2026',
      });

      expect(result.isError).toBe(true);
      expect(result.content[0]?.text).toContain('Error de validación en argumentos para check_wip_budget');
      expect(result.content[0]?.text).toContain('YYYY-MM-DD');
    });
  });

  describe('Protocolo MCP & Manejo de Casos Borde', () => {
    it('debe exponer las 3 herramientas canónicas en listTools()', () => {
      const tools = mcpServer.listTools();
      expect(tools).toHaveLength(3);
      const toolNames = tools.map((t) => t.name);
      expect(toolNames).toContain('get_canonical_entities');
      expect(toolNames).toContain('query_facts');
      expect(toolNames).toContain('check_wip_budget');

      // Validar que cada herramienta tenga esquema de entrada y descripción válidos
      for (const tool of tools) {
        expect(tool.description.length).toBeGreaterThan(10);
        expect(tool.inputSchema.type).toBe('object');
        expect(tool.inputSchema.properties).toBeDefined();
      }
    });

    it('debe responder con isError=true al llamar a una herramienta desconocida', async () => {
      const result = await mcpServer.callTool('non_existent_tool', {});
      expect(result.isError).toBe(true);
      expect(result.content[0]?.text).toContain('Herramienta desconocida');
    });

    it('debe procesar petición JSON-RPC initialize', async () => {
      const req = {
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {},
        },
      };

      const res = await mcpServer.handleMessage(req);
      expect(res).not.toBeNull();
      expect(res?.id).toBe(1);
      expect(res?.jsonrpc).toBe('2.0');
      const result = res?.result as {
        protocolVersion: string;
        capabilities: Record<string, unknown>;
        serverInfo: { name: string; version: string };
      };
      expect(result.protocolVersion).toBe('2024-11-05');
      expect(result.serverInfo.name).toBe('wuxiagraph-mcp-server');
    });

    it('debe procesar petición JSON-RPC tools/list', async () => {
      const req = {
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/list',
      };

      const res = await mcpServer.handleMessage(req);
      expect(res?.id).toBe(2);
      const result = res?.result as { tools: Array<{ name: string }> };
      expect(result.tools).toHaveLength(3);
    });

    it('debe procesar petición JSON-RPC tools/call', async () => {
      const req = {
        jsonrpc: '2.0',
        id: 3,
        method: 'tools/call',
        params: {
          name: 'check_wip_budget',
          arguments: {},
        },
      };

      const res = await mcpServer.handleMessage(req);
      expect(res?.id).toBe(3);
      const result = res?.result as {
        content: Array<{ type: string; text: string }>;
        isError: boolean;
      };
      expect(result.isError).toBe(false);
      expect(result.content[0]?.type).toBe('text');
    });

    it('debe retornar null para notificación JSON-RPC notifications/initialized', async () => {
      const notif = {
        jsonrpc: '2.0',
        method: 'notifications/initialized',
      };

      const res = await mcpServer.handleMessage(notif);
      expect(res).toBeNull();
    });

    it('debe responder a JSON-RPC ping', async () => {
      const ping = {
        jsonrpc: '2.0',
        id: 42,
        method: 'ping',
      };

      const res = await mcpServer.handleMessage(ping);
      expect(res?.id).toBe(42);
      expect(res?.result).toEqual({});
    });

    it('debe retornar error -32601 para método desconocido', async () => {
      const req = {
        jsonrpc: '2.0',
        id: 99,
        method: 'unknown/method',
      };

      const res = await mcpServer.handleMessage(req);
      expect(res?.error?.code).toBe(-32601);
      expect(res?.error?.message).toContain('Método no encontrado');
    });

    it('debe manejar cadenas JSON-RPC serializadas mediante handleJsonRpc()', async () => {
      const rawRequest = JSON.stringify({
        jsonrpc: '2.0',
        id: 10,
        method: 'tools/list',
      });

      const rawResponse = await mcpServer.handleJsonRpc(rawRequest);
      expect(rawResponse).not.toBeNull();
      const parsed = JSON.parse(rawResponse ?? '{}');
      expect(parsed.id).toBe(10);
      expect(parsed.result.tools).toHaveLength(3);
    });

    it('debe retornar error de parseo -32700 ante JSON malformado', async () => {
      const rawInvalidJson = '{"jsonrpc": "2.0", method: invalid}';
      const rawResponse = await mcpServer.handleJsonRpc(rawInvalidJson);
      expect(rawResponse).not.toBeNull();
      const parsed = JSON.parse(rawResponse ?? '{}');
      expect(parsed.error.code).toBe(-32700);
      expect(parsed.error.message).toContain('Error de parseo');
    });

    it('debe retornar error -32600 ante mensaje JSON que no sea objeto', async () => {
      const res = await mcpServer.handleMessage('cadena_invalida');
      expect(res?.error?.code).toBe(-32600);
    });

    it('debe retornar error -32602 si tools/call no especifica params o name', async () => {
      const res1 = await mcpServer.handleMessage({
        jsonrpc: '2.0',
        id: 11,
        method: 'tools/call',
      });
      expect(res1?.error?.code).toBe(-32602);

      const res2 = await mcpServer.handleMessage({
        jsonrpc: '2.0',
        id: 12,
        method: 'tools/call',
        params: {},
      });
      expect(res2?.error?.code).toBe(-32602);
    });
  });

  describe('Endpoint HTTP Hono: POST /api/v1/mcp', () => {
    it('debe procesar llamadas JSON-RPC vía HTTP POST', async () => {
      const payload = {
        jsonrpc: '2.0',
        id: 'http-1',
        method: 'tools/list',
      };

      const res = await app.request('/api/v1/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      expect(res.status).toBe(200);
      const body = (await res.json()) as {
        id: string;
        result: { tools: Array<{ name: string }> };
      };
      expect(body.id).toBe('http-1');
      expect(body.result.tools).toHaveLength(3);
    });

    it('debe responder 400 ante cuerpo HTTP con JSON inválido', async () => {
      const res = await app.request('/api/v1/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'esto no es json',
      });

      expect(res.status).toBe(400);
      const body = (await res.json()) as { error: { code: number } };
      expect(body.error.code).toBe(-32700);
    });

    it('debe responder 204 ante notificación JSON-RPC sin contenido de retorno', async () => {
      const payload = {
        jsonrpc: '2.0',
        method: 'notifications/initialized',
      };

      const res = await app.request('/api/v1/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      expect(res.status).toBe(204);
    });
  });
});
