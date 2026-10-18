import { Hono } from 'hono';
import type { DatabaseSync } from 'node:sqlite';
import { createDreamingRouter } from './routes/dreaming.js';
import { DreamingService } from '../domain/dreaming/service.js';
import { SqliteDreamingRepository } from '../infrastructure/repositories/dreamingRepository.js';
import { SqliteWipGovernanceRepository } from '../infrastructure/sqlite-wip-governance.repository.js';
import { createDatabase } from '../infrastructure/database.js';

export * from './schemas/dreaming.js';
export * from './routes/dreaming.js';

export interface AppDependencies {
  db?: DatabaseSync;
  dreamingService?: DreamingService;
}

export function createApp(deps?: AppDependencies): Hono {
  const app = new Hono();

  const db = deps?.db ?? createDatabase();
  const dreamingService =
    deps?.dreamingService ??
    new DreamingService(
      new SqliteDreamingRepository(db),
      new SqliteWipGovernanceRepository(db)
    );

  app.get('/health', (c) => {
    return c.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.route('/api/v1/dreaming', createDreamingRouter(dreamingService));

  return app;
}
