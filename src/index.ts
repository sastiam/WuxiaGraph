import process from 'node:process';
import type { DatabaseSync } from 'node:sqlite';
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { createDatabase } from './infrastructure/database.js';
import { SqliteContextRepository } from './infrastructure/sqlite-context.repository.js';
import { SqliteDreamingRepository } from './infrastructure/repositories/dreamingRepository.js';
import { SqliteWipGovernanceRepository } from './infrastructure/sqlite-wip-governance.repository.js';
import { SqliteGraphRepository } from './infrastructure/repositories/graphRepository.js';
import { ContextInjectorService } from './domain/context/index.js';
import { DreamingService } from './domain/dreaming/index.js';
import { GraphService } from './domain/graph/graphService.js';
import { HitLService } from './domain/ingestion/hitlService.js';
import { createApiRouter } from './api/router.js';
import { createMcpServer, McpServer } from './mcp/index.js';

export interface AppOptions {
  db?: DatabaseSync;
  contextService?: ContextInjectorService;
  dreamingService?: DreamingService;
  graphService?: GraphService;
  hitlService?: HitLService;
  govRepo?: SqliteWipGovernanceRepository;
  mcpServer?: McpServer;
}

export function createApp(options?: AppOptions): Hono {
  // Configuración de infraestructura y servicios de dominio
  const db = options?.db ?? createDatabase();
  const contextRepo = new SqliteContextRepository(db);
  const contextService = options?.contextService ?? new ContextInjectorService(contextRepo);
  const dreamingRepo = new SqliteDreamingRepository(db);
  const govRepo = options?.govRepo ?? new SqliteWipGovernanceRepository(db);
  const dreamingService = options?.dreamingService ?? new DreamingService(dreamingRepo, govRepo);
  const graphRepo = new SqliteGraphRepository(db);
  const graphService = options?.graphService ?? new GraphService(graphRepo);
  const hitlService = options?.hitlService ?? new HitLService(db);
  const mcpServer =
    options?.mcpServer ??
    createMcpServer({
      dreamingRepo,
      govRepo,
      contextRepo,
      graphRepo,
      graphService,
    });

  // Creamos el router central de API (con CORS, onError centralizado, /health y rutas v1)
  const app = createApiRouter({
    contextService,
    dreamingService,
    govRepo,
    graphService,
    hitlService,
  });

  // Montaje de endpoint JSON-RPC para MCP Server (WXG-016)
  app.post('/api/v1/mcp', async (c) => {
    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      return c.json(
        {
          jsonrpc: '2.0',
          id: null,
          error: {
            code: -32700,
            message: 'Error de parseo: JSON inválido.',
          },
        },
        400
      );
    }

    const response = await mcpServer.handleMessage(body);
    if (!response) {
      return c.body(null, 204);
    }
    return c.json(response, 200);
  });

  return app;
}

export const app = createApp();

if (process.env.NODE_ENV !== 'test' && !process.env.VITEST) {
  const port = Number(process.env.PORT) || 3000;
  serve(
    {
      fetch: app.fetch,
      port,
    },
    (info) => {
      console.log(`Server running at http://localhost:${info.port}`);
    }
  );
}

export { createMcpServer, McpServer };
export default app;
