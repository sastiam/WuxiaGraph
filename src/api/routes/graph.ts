import { Hono } from 'hono';
import { z } from 'zod';
import type { GraphService } from '../../domain/graph/graphService.js';
import { GraphForeignKeyViolationError } from '../../domain/graph/errors.js';

export const GetRelationshipsQuerySchema = z.object({
  entityId: z
    .string()
    .trim()
    .min(1, 'El parámetro "entityId" no puede estar vacío si se proporciona.')
    .optional(),
  depth: z
    .coerce
    .number()
    .int()
    .min(1)
    .optional(),
});

export const GetGraphPathQuerySchema = z
  .object({
    source: z.string().trim().min(1).optional(),
    sourceEntityId: z.string().trim().min(1).optional(),
    target: z.string().trim().min(1).optional(),
    targetEntityId: z.string().trim().min(1).optional(),
    algorithm: z.enum(['bfs', 'dfs']).optional(),
    directed: z
      .union([z.boolean(), z.enum(['true', 'false', '1', '0'])])
      .transform((val) => val === true || val === 'true' || val === '1')
      .optional(),
  })
  .refine((data) => Boolean(data.source || data.sourceEntityId), {
    message: 'El parámetro "source" o "sourceEntityId" es obligatorio.',
    path: ['source'],
  })
  .refine((data) => Boolean(data.target || data.targetEntityId), {
    message: 'El parámetro "target" o "targetEntityId" es obligatorio.',
    path: ['target'],
  });

export const CreateRelationshipSchema = z
  .object({
    relationship_id: z.string().trim().min(1).optional(),
    relationshipId: z.string().trim().min(1).optional(),
    source_entity_id: z.string().trim().min(1).optional(),
    sourceEntityId: z.string().trim().min(1).optional(),
    target_entity_id: z.string().trim().min(1).optional(),
    targetEntityId: z.string().trim().min(1).optional(),
    relationship_type: z.string().trim().min(1).optional(),
    relationshipType: z.string().trim().min(1).optional(),
    affinity_weight: z.number().optional(),
    affinityWeight: z.number().optional(),
    description: z.string().optional().nullable(),
  })
  .refine(
    (data) => Boolean((data.relationship_id ?? data.relationshipId)?.trim()),
    { message: 'El campo "relationship_id" es requerido.', path: ['relationship_id'] }
  )
  .refine(
    (data) => Boolean((data.source_entity_id ?? data.sourceEntityId)?.trim()),
    { message: 'El campo "source_entity_id" es requerido.', path: ['source_entity_id'] }
  )
  .refine(
    (data) => Boolean((data.target_entity_id ?? data.targetEntityId)?.trim()),
    { message: 'El campo "target_entity_id" es requerido.', path: ['target_entity_id'] }
  )
  .refine(
    (data) => Boolean((data.relationship_type ?? data.relationshipType)?.trim()),
    { message: 'El campo "relationship_type" es requerido.', path: ['relationship_type'] }
  );

/**
 * Enrutador de API HTTP Hono para el Motor de Grafos (WXG-021).
 * Expone:
 *   - GET /api/v1/graph/relationships?entityId=...
 *   - GET /api/v1/graph/path?source=...&target=...&algorithm=...
 */
export function createGraphRouter(graphService: GraphService): Hono {
  const router = new Hono();

  // GET /relationships
  router.get('/relationships', async (c) => {
    const rawQuery = c.req.query();
    const parseResult = GetRelationshipsQuerySchema.safeParse(rawQuery);

    if (!parseResult.success) {
      return c.json(
        {
          error: 'INVALID_REQUEST',
          message: parseResult.error.issues[0]?.message ?? 'Parámetros de consulta inválidos.',
        },
        400
      );
    }

    try {
      const { entityId, depth } = parseResult.data;
      const relationships = await graphService.getRelationships(entityId, depth);
      return c.json(relationships, 200);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error interno inesperado';
      return c.json({ error: 'INTERNAL_ERROR', message }, 500);
    }
  });

  // GET /path
  router.get('/path', async (c) => {
    const rawQuery = c.req.query();
    const parseResult = GetGraphPathQuerySchema.safeParse(rawQuery);

    if (!parseResult.success) {
      return c.json(
        {
          error: 'INVALID_REQUEST',
          message: parseResult.error.issues[0]?.message ?? 'Parámetros de consulta inválidos.',
        },
        400
      );
    }

    try {
      const data = parseResult.data;
      const source = data.source ?? data.sourceEntityId!;
      const target = data.target ?? data.targetEntityId!;
      const pathResult = await graphService.findPath(source, target, {
        algorithm: data.algorithm,
        directed: data.directed,
      });

      return c.json(pathResult, 200);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error interno inesperado';
      return c.json({ error: 'INTERNAL_ERROR', message }, 500);
    }
  });

  // POST /relationships (opcional / soporte para registro de relaciones)
  router.post('/relationships', async (c) => {
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

    const parseResult = CreateRelationshipSchema.safeParse(body);
    if (!parseResult.success) {
      return c.json(
        {
          error: 'VALIDATION_ERROR',
          message: parseResult.error.issues[0]?.message ?? 'Datos de relación inválidos.',
          details: parseResult.error.issues,
        },
        400
      );
    }

    try {
      const data = parseResult.data;
      const relationshipId = (data.relationship_id ?? data.relationshipId)!;
      const sourceId = (data.source_entity_id ?? data.sourceEntityId)!;
      const targetId = (data.target_entity_id ?? data.targetEntityId)!;
      const relationshipType = (data.relationship_type ?? data.relationshipType)!;
      const affinityWeight = data.affinity_weight ?? data.affinityWeight ?? 0.0;
      const description = data.description ?? null;

      await graphService.addRelationship({
        relationship_id: relationshipId,
        source_entity_id: sourceId,
        target_entity_id: targetId,
        relationship_type: relationshipType,
        affinity_weight: affinityWeight,
        description,
      });

      return c.json({ success: true, relationship_id: relationshipId }, 201);
    } catch (err: unknown) {
      if (err instanceof GraphForeignKeyViolationError) {
        return c.json(
          {
            error: err.code,
            message: err.message,
          },
          400
        );
      }
      const message = err instanceof Error ? err.message : 'Error interno inesperado';
      return c.json({ error: 'INTERNAL_ERROR', message }, 500);
    }
  });

  return router;
}
