import process from 'node:process';
import type { DatabaseSync } from 'node:sqlite';
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { createDatabase } from './infrastructure/database.js';
import { SqliteContextRepository } from './infrastructure/sqlite-context.repository.js';
import { ContextInjectorService } from './domain/context/index.js';
import { createContextRouter } from './api/context.router.js';

export interface AppOptions {
  db?: DatabaseSync;
  contextService?: ContextInjectorService;
}

export function createApp(options?: AppOptions): Hono {
  const app = new Hono();

  // Configuración de infraestructura y servicios de dominio
  const db = options?.db ?? createDatabase();
  const contextRepo = new SqliteContextRepository(db);
  const contextService = options?.contextService ?? new ContextInjectorService(contextRepo);

  // Health check endpoint
  app.get('/health', (c) => {
    return c.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Montaje de rutas de contexto canónico (WXG-015)
  const contextRouter = createContextRouter(contextService);
  app.route('/api/v1/context', contextRouter);

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

export default app;
