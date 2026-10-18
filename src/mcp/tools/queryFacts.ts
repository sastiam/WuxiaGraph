import { z } from 'zod';
import type { McpServerDependencies, McpToolDefinition, McpToolResult } from '../types.js';

export const QueryFactsInputSchema = z.object({
  keyword: z
    .string()
    .trim()
    .min(1, 'El parámetro "keyword" no puede estar vacío si se proporciona.')
    .optional(),
  entityId: z
    .string()
    .trim()
    .min(1, 'El parámetro "entityId" no puede estar vacío si se proporciona.')
    .optional(),
  chapterSource: z
    .string()
    .trim()
    .min(1, 'El parámetro "chapterSource" no puede estar vacío si se proporciona.')
    .optional(),
});

export type QueryFactsInput = z.infer<typeof QueryFactsInputSchema>;

export const queryFactsDefinition: McpToolDefinition = {
  name: 'query_facts',
  description:
    'Búsqueda de hechos narrativos estrictamente canónicos (is_canon = 1) registrados en el grafo de lore, con filtros opcionales por palabra clave, ID de entidad o fuente de capítulo.',
  inputSchema: {
    type: 'object',
    properties: {
      keyword: {
        type: 'string',
        description: 'Palabra clave o frase a buscar dentro del enunciado del hecho narrativo.',
      },
      entityId: {
        type: 'string',
        description: 'Identificador único de la entidad asociada al hecho narrativo.',
      },
      chapterSource: {
        type: 'string',
        description: 'Capítulo o fuente de donde proviene el hecho narrativo.',
      },
    },
  },
};

export async function handleQueryFacts(
  args: unknown,
  deps: McpServerDependencies
): Promise<McpToolResult> {
  const parseResult = QueryFactsInputSchema.safeParse(args ?? {});

  if (!parseResult.success) {
    const errorDetails = parseResult.error.issues
      .map((issue) => `${issue.path.join('.') || 'root'}: ${issue.message}`)
      .join('; ');

    return {
      content: [
        {
          type: 'text',
          text: `Error de validación en argumentos para query_facts: ${errorDetails}`,
        },
      ],
      isError: true,
    };
  }

  try {
    const { keyword, entityId, chapterSource } = parseResult.data;
    const rawFacts = await deps.dreamingRepo.getFacts(entityId);

    // Invariante de Dominio: Exclusión estricta de borradores o notas no canónicas (is_canon = 0)
    let facts = rawFacts.filter((fact) => fact.isCanon === true);

    if (keyword !== undefined) {
      const lowerKeyword = keyword.toLowerCase();
      facts = facts.filter((fact) => fact.factStatement.toLowerCase().includes(lowerKeyword));
    }

    if (chapterSource !== undefined) {
      const lowerChapter = chapterSource.toLowerCase();
      facts = facts.filter((fact) => fact.chapterSource.toLowerCase().includes(lowerChapter));
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              facts,
              count: facts.length,
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
          text: `Error interno al consultar hechos canónicos: ${message}`,
        },
      ],
      isError: true,
    };
  }
}
