import { Hono } from 'hono';
import { LogWipSchema } from '../schemas/governance.js';
import type { IWipGovernanceRepository } from '../../domain/governance/repository.js';
import { getStartOfWeek } from '../../domain/governance/utils.js';

export function createGovernanceRouter(govRepo: IWipGovernanceRepository): Hono {
  const router = new Hono();

  router.get('/status', async (c) => {
    const ledger = await govRepo.getOrCreateCurrentWeekLedger();
    return c.json(
      {
        success: true,
        data: ledger,
      },
      200
    );
  });

  router.get('/', async (c) => {
    const ledger = await govRepo.getOrCreateCurrentWeekLedger();
    return c.json(
      {
        success: true,
        data: ledger,
      },
      200
    );
  });

  router.post('/log', async (c) => {
    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      return c.json(
        {
          error: 'INVALID_JSON',
          message: 'El cuerpo de la petición debe ser un objeto JSON válido.',
        },
        400
      );
    }

    const parseResult = LogWipSchema.safeParse(body);
    if (!parseResult.success) {
      return c.json(
        {
          error: 'VALIDATION_ERROR',
          message: 'Parámetros de entrada inválidos para el registro WIP.',
          details: parseResult.error.issues,
        },
        400
      );
    }

    const { hours, weekStartDate } = parseResult.data;
    const targetWeek = weekStartDate ?? getStartOfWeek();

    const ledger = await govRepo.logHours(targetWeek, hours);

    return c.json(
      {
        success: true,
        data: ledger,
      },
      200
    );
  });

  return router;
}
