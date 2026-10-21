import { Hono } from 'hono';
import { z } from 'zod';
import type { HitLService } from '../../domain/ingestion/hitlService.js';

export const ReviewAliasSchema = z.object({
  action: z.enum(['approve', 'reject']),
  targetEntityId: z.string().optional(),
});

export type ReviewAliasDto = z.infer<typeof ReviewAliasSchema>;

export function createAliasesRouter(hitlService: HitLService): Hono {
  const router = new Hono();

  // GET /pending -> returns c.json({ pending: hitlService.getPendingAliases() }, 200)
  router.get('/pending', (c) => {
    const pending = hitlService.getPendingAliases();
    return c.json({ pending }, 200);
  });

  // POST /:id/review -> validates body using ReviewAliasSchema. Calls reviewAlias(id, action, targetEntityId).
  // If null, return 404 c.json({ error: 'NOT_FOUND', message: 'Propuesta HitL no encontrada' }, 404).
  // Otherwise returns c.json({ success: true, proposal: updatedProposal }, 200). If body invalid, return 400.
  router.post('/:id/review', async (c) => {
    const id = c.req.param('id');

    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      return c.json(
        {
          error: 'BAD_REQUEST',
          message: 'El cuerpo de la petición debe ser un objeto JSON válido.',
        },
        400
      );
    }

    const parseResult = ReviewAliasSchema.safeParse(body);
    if (!parseResult.success) {
      return c.json(
        {
          error: 'BAD_REQUEST',
          message: 'Parámetros de entrada inválidos para la revisión del alias.',
          issues: parseResult.error.issues,
        },
        400
      );
    }

    const { action, targetEntityId } = parseResult.data;
    const updatedProposal = hitlService.reviewAlias(id, action, targetEntityId);

    if (!updatedProposal) {
      return c.json(
        {
          error: 'NOT_FOUND',
          message: 'Propuesta HitL no encontrada',
        },
        404
      );
    }

    return c.json(
      {
        success: true,
        proposal: updatedProposal,
      },
      200
    );
  });

  return router;
}
