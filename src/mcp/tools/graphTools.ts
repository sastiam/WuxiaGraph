import { z } from 'zod';
import type { McpServerDependencies, McpToolDefinition, McpToolResult } from '../types.js';
import { GraphService } from '../../domain/graph/graphService.js';

export const QueryEntityGraphInputSchema = z.object({
  entityId: z.string().trim().min(1, 'El parámetro "entityId" no puede estar vacío si se proporciona.').optional(),
  entity_id: z.string().trim().min(1, 'El parámetro "entity_id" no puede estar vacío si se proporciona.').optional(),
});

export type QueryEntityGraphInput = z.infer<typeof QueryEntityGraphInputSchema>;

export const queryEntityGraphDefinition: McpToolDefinition = {
  name: 'query_entity_graph',
  description: 'Consulta las relaciones registradas en el grafo de lore para una entidad específica o todas las relaciones del grafo.',
  inputSchema: {
    type: 'object',
    properties: {
      entityId: {
        type: 'string',
        description: 'Identificador único de la entidad para filtrar relaciones asociadas.',
      },
      entity_id: {
        type: 'string',
        description: 'Alias de entityId (snake_case).',
      },
    },
  },
};

export async function handleQueryEntityGraph(
  args: unknown,
  deps: McpServerDependencies
): Promise<McpToolResult> {
  const parseResult = QueryEntityGraphInputSchema.safeParse(args ?? {});

  if (!parseResult.success) {
    const errorDetails = parseResult.error.issues
      .map((issue) => `${issue.path.join('.') || 'root'}: ${issue.message}`)
      .join('; ');

    return {
      content: [
        {
          type: 'text',
          text: `Error de validación en argumentos para query_entity_graph: ${errorDetails}`,
        },
      ],
      isError: true,
    };
  }

  try {
    const entityId = parseResult.data.entityId ?? parseResult.data.entity_id;
    const service = deps.graphService ?? (deps.graphRepo ? new GraphService(deps.graphRepo) : null);

    if (!service) {
      if (!deps.graphRepo) {
        return {
          content: [
            {
              type: 'text',
              text: 'Error: Repositorio o servicio de grafo no configurado en dependencias MCP.',
            },
          ],
          isError: true,
        };
      }
    }

    const relationships = await (service
      ? service.getRelationships(entityId)
      : deps.graphRepo!.getRelationshipsByEntity(entityId!));

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              relationships,
              count: relationships.length,
            },
            null,
            2
          ),
        },
      ],
      isError: false,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: 'text',
          text: `Error interno al consultar el grafo de la entidad: ${message}`,
        },
      ],
      isError: true,
    };
  }
}

export const FindRelationshipPathInputSchema = z
  .object({
    sourceEntityId: z.string().trim().min(1).optional(),
    source_entity_id: z.string().trim().min(1).optional(),
    source: z.string().trim().min(1).optional(),
    targetEntityId: z.string().trim().min(1).optional(),
    target_entity_id: z.string().trim().min(1).optional(),
    target: z.string().trim().min(1).optional(),
    algorithm: z.enum(['bfs', 'dfs']).optional(),
    directed: z.boolean().optional(),
  })
  .refine(
    (data) => Boolean((data.sourceEntityId ?? data.source_entity_id ?? data.source)?.trim()),
    { message: 'El parámetro "sourceEntityId" es obligatorio.', path: ['sourceEntityId'] }
  )
  .refine(
    (data) => Boolean((data.targetEntityId ?? data.target_entity_id ?? data.target)?.trim()),
    { message: 'El parámetro "targetEntityId" es obligatorio.', path: ['targetEntityId'] }
  );

export type FindRelationshipPathInput = z.infer<typeof FindRelationshipPathInputSchema>;

export const findRelationshipPathDefinition: McpToolDefinition = {
  name: 'find_relationship_path',
  description: 'Encuentra el camino relacional y la afinidad acumulada entre dos entidades de lore utilizando algoritmos BFS o DFS.',
  inputSchema: {
    type: 'object',
    properties: {
      sourceEntityId: {
        type: 'string',
        description: 'Identificador de la entidad de origen.',
      },
      source_entity_id: {
        type: 'string',
        description: 'Alias de origen en snake_case.',
      },
      targetEntityId: {
        type: 'string',
        description: 'Identificador de la entidad de destino.',
      },
      target_entity_id: {
        type: 'string',
        description: 'Alias de destino en snake_case.',
      },
      algorithm: {
        type: 'string',
        enum: ['bfs', 'dfs'],
        description: 'Algoritmo de recorrido a utilizar (bfs por defecto).',
      },
      directed: {
        type: 'boolean',
        description: 'Indica si las relaciones deben tratarse como dirigidas (false por defecto).',
      },
    },
    required: [],
  },
};

export async function handleFindRelationshipPath(
  args: unknown,
  deps: McpServerDependencies
): Promise<McpToolResult> {
  const parseResult = FindRelationshipPathInputSchema.safeParse(args ?? {});

  if (!parseResult.success) {
    const errorDetails = parseResult.error.issues
      .map((issue) => `${issue.path.join('.') || 'root'}: ${issue.message}`)
      .join('; ');

    return {
      content: [
        {
          type: 'text',
          text: `Error de validación en argumentos para find_relationship_path: ${errorDetails}`,
        },
      ],
      isError: true,
    };
  }

  try {
    const data = parseResult.data;
    const sourceId = (data.sourceEntityId ?? data.source_entity_id ?? data.source)!;
    const targetId = (data.targetEntityId ?? data.target_entity_id ?? data.target)!;

    const service = deps.graphService ?? (deps.graphRepo ? new GraphService(deps.graphRepo) : null);

    if (!service) {
      return {
        content: [
          {
            type: 'text',
            text: 'Error: Repositorio o servicio de grafo no configurado en dependencias MCP.',
          },
        ],
        isError: true,
      };
    }

    const pathResult = await service.findPath(sourceId, targetId, {
      algorithm: data.algorithm,
      directed: data.directed,
    });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(pathResult, null, 2),
        },
      ],
      isError: false,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: 'text',
          text: `Error interno al buscar la ruta relacional: ${message}`,
        },
      ],
      isError: true,
    };
  }
}
