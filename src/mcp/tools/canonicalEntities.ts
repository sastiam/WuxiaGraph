import { z } from 'zod';
import type { McpServerDependencies, McpToolDefinition, McpToolResult } from '../types.js';

export const GetCanonicalEntitiesInputSchema = z.object({
  domain: z
    .string()
    .trim()
    .min(1, 'El parámetro "domain" no puede estar vacío si se proporciona.')
    .optional(),
  status: z
    .string()
    .trim()
    .min(1, 'El parámetro "status" no puede estar vacío si se proporciona.')
    .optional(),
});

export type GetCanonicalEntitiesInput = z.infer<typeof GetCanonicalEntitiesInputSchema>;

export const getCanonicalEntitiesDefinition: McpToolDefinition = {
  name: 'get_canonical_entities',
  description:
    'Consulta entidades canónicas de lore registradas en el sistema, con filtros opcionales por dominio narrativo o estado actual.',
  inputSchema: {
    type: 'object',
    properties: {
      domain: {
        type: 'string',
        description: 'Dominio narrativo a filtrar (ej. "xianxia", "wuxia").',
      },
      status: {
        type: 'string',
        description: 'Estado actual de la entidad a filtrar (ej. "ALIVE", "THRIVING").',
      },
    },
  },
};

export async function handleGetCanonicalEntities(
  args: unknown,
  deps: McpServerDependencies
): Promise<McpToolResult> {
  const parseResult = GetCanonicalEntitiesInputSchema.safeParse(args ?? {});

  if (!parseResult.success) {
    const errorDetails = parseResult.error.issues
      .map((issue) => `${issue.path.join('.') || 'root'}: ${issue.message}`)
      .join('; ');

    return {
      content: [
        {
          type: 'text',
          text: `Error de validación en argumentos para get_canonical_entities: ${errorDetails}`,
        },
      ],
      isError: true,
    };
  }

  try {
    const { domain, status } = parseResult.data;
    let entities = await deps.dreamingRepo.getAllEntities(domain);

    if (status !== undefined) {
      entities = entities.filter((entity) => entity.currentStatus === status);
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              entities,
              count: entities.length,
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
          text: `Error interno al consultar entidades canónicas: ${message}`,
        },
      ],
      isError: true,
    };
  }
}
