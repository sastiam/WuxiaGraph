import { Hono } from 'hono';
import { z } from 'zod';
import type { ContextInjectorService } from '../domain/context/index.js';

const contextQuerySchema = z.object({
  domain: z
    .string()
    .trim()
    .min(1, 'Parameter "domain" is required and cannot be empty'),
});

/**
 * Enrutador de API Hono para el servicio Context Injector (WXG-015).
 * Expone GET /inject?domain={domain} para construir el prefijo inmutable de prompt.
 */
export function createContextRouter(contextService: ContextInjectorService): Hono {
  const router = new Hono();

  router.get('/inject', async (c) => {
    const rawDomain = c.req.query('domain');
    if (rawDomain === undefined || rawDomain === null) {
      return c.json(
        {
          error: 'INVALID_REQUEST',
          message: 'Parameter "domain" is required',
        },
        400
      );
    }

    const parseResult = contextQuerySchema.safeParse({ domain: rawDomain });

    if (!parseResult.success) {
      return c.json(
        {
          error: 'INVALID_REQUEST',
          message: parseResult.error.issues[0]?.message ?? 'Invalid query parameters',
        },
        400
      );
    }

    try {
      const { domain } = parseResult.data;
      const result = await contextService.injectContext(domain);
      return c.json(result, 200);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Internal Server Error';
      return c.json({ error: 'INTERNAL_ERROR', message: errorMessage }, 500);
    }
  });

  return router;
}
