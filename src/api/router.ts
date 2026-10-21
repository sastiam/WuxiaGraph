import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { HTTPException } from 'hono/http-exception';
import { ZodError } from 'zod';
import type { ContextInjectorService } from '../domain/context/index.js';
import type { DreamingService } from '../domain/dreaming/service.js';
import type { IWipGovernanceRepository } from '../domain/governance/repository.js';
import { WipLimitExceededError } from '../domain/governance/errors.js';
import {
  EmptyNarrativeInputError,
  EntityNotFoundError,
  InvalidAttributesJsonError,
} from '../domain/dreaming/errors.js';
import { createContextRouter } from './context.router.js';
import { createDreamingRouter } from './routes/dreaming.js';
import { createGovernanceRouter } from './routes/governance.js';
import { createGraphRouter } from './routes/graph.js';
import type { GraphService } from '../domain/graph/graphService.js';
import type { HitLService } from '../domain/ingestion/hitlService.js';
import { createAliasesRouter } from './routes/aliases.js';

export interface ApiRouterDependencies {
  contextService: ContextInjectorService;
  dreamingService: DreamingService;
  govRepo: IWipGovernanceRepository;
  graphService?: GraphService;
  hitlService?: HitLService;
}

export function createApiRouter(deps: ApiRouterDependencies): Hono {
  const app = new Hono();

  // CORS middleware global
  app.use('*', cors());

  // Manejo centralizado de excepciones y errores
  app.onError((err, c) => {
    if (err instanceof HTTPException) {
      return err.getResponse();
    }

    if (err instanceof ZodError) {
      return c.json(
        {
          error: 'VALIDATION_ERROR',
          message: 'Error de validación en la petición.',
          details: err.issues,
        },
        400
      );
    }

    if (err instanceof WipLimitExceededError) {
      return c.json(
        {
          error: 'LOCKED_BY_WIP',
          message: err.message,
          currentHours: err.currentHours,
          attemptedHours: err.attemptedHours,
          maxBudget: err.maxBudget,
        },
        423
      );
    }

    if (
      err instanceof InvalidAttributesJsonError ||
      err instanceof EntityNotFoundError ||
      err instanceof EmptyNarrativeInputError
    ) {
      return c.json(
        {
          error: err.code,
          message: err.message,
        },
        400
      );
    }

    const message = err instanceof Error ? err.message : 'Error interno inesperado';
    return c.json(
      {
        error: 'INTERNAL_SERVER_ERROR',
        message,
      },
      500
    );
  });

  // Montaje de rutas v1
  const contextRouter = createContextRouter(deps.contextService);
  const dreamingRouter = createDreamingRouter(deps.dreamingService);
  const governanceRouter = createGovernanceRouter(deps.govRepo);

  app.route('/api/v1/context', contextRouter);
  app.route('/api/v1/dreaming', dreamingRouter);
  app.route('/api/v1/wip', governanceRouter);

  if (deps.graphService) {
    const graphRouter = createGraphRouter(deps.graphService);
    app.route('/api/v1/graph', graphRouter);
  }

  if (deps.hitlService) {
    const aliasesRouter = createAliasesRouter(deps.hitlService);
    app.route('/api/v1/aliases', aliasesRouter);
  }

  return app;
}
