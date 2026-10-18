import { Hono } from 'hono';
import { DistillRequestSchema } from '../schemas/dreaming.js';
import type { DreamingService } from '../../domain/dreaming/service.js';
import {
  EmptyNarrativeInputError,
  EntityNotFoundError,
  InvalidAttributesJsonError,
} from '../../domain/dreaming/errors.js';
import { WipLimitExceededError } from '../../domain/governance/errors.js';

/**
 * Crea el enrutador HTTP de Hono para el Servicio Dreaming.
 * Regla de Arquitectura: Los controladores traducen peticiones HTTP a llamadas a servicios de dominio.
 */
export function createDreamingRouter(dreamingService: DreamingService): Hono {
  const router = new Hono();

  router.post('/distill', async (c) => {
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

    const parseResult = DistillRequestSchema.safeParse(body);
    if (!parseResult.success) {
      return c.json(
        {
          error: 'VALIDATION_ERROR',
          message: 'Parámetros de entrada inválidos para la destilación.',
          details: parseResult.error.issues,
        },
        400
      );
    }

    try {
      const result = await dreamingService.distill(parseResult.data);
      return c.json(
        {
          success: true,
          data: result,
        },
        200
      );
    } catch (err: unknown) {
      if (err instanceof InvalidAttributesJsonError) {
        return c.json(
          {
            error: err.code,
            message: err.message,
            entityId: err.entityId,
          },
          400
        );
      }

      if (err instanceof EntityNotFoundError) {
        return c.json(
          {
            error: err.code,
            message: err.message,
            entityId: err.entityId,
          },
          400
        );
      }

      if (err instanceof EmptyNarrativeInputError) {
        return c.json(
          {
            error: err.code,
            message: err.message,
          },
          400
        );
      }

      if (err instanceof WipLimitExceededError) {
        return c.json(
          {
            error: err.code,
            message: err.message,
          },
          423
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
    }
  });

  return router;
}
