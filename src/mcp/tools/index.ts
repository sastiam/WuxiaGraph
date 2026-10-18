import type {
  McpServerDependencies,
  McpToolDefinition,
  McpToolHandler,
  McpToolResult,
} from '../types.js';
import {
  getCanonicalEntitiesDefinition,
  handleGetCanonicalEntities,
  GetCanonicalEntitiesInputSchema,
  type GetCanonicalEntitiesInput,
} from './canonicalEntities.js';
import {
  queryFactsDefinition,
  handleQueryFacts,
  QueryFactsInputSchema,
  type QueryFactsInput,
} from './queryFacts.js';
import {
  checkWipBudgetDefinition,
  handleCheckWipBudget,
  CheckWipBudgetInputSchema,
  type CheckWipBudgetInput,
} from './checkWipBudget.js';

export {
  getCanonicalEntitiesDefinition,
  handleGetCanonicalEntities,
  GetCanonicalEntitiesInputSchema,
  type GetCanonicalEntitiesInput,
  queryFactsDefinition,
  handleQueryFacts,
  QueryFactsInputSchema,
  type QueryFactsInput,
  checkWipBudgetDefinition,
  handleCheckWipBudget,
  CheckWipBudgetInputSchema,
  type CheckWipBudgetInput,
};

interface ToolEntry {
  definition: McpToolDefinition;
  handler: McpToolHandler;
}

const TOOLS_REGISTRY: Record<string, ToolEntry> = {
  get_canonical_entities: {
    definition: getCanonicalEntitiesDefinition,
    handler: handleGetCanonicalEntities,
  },
  query_facts: {
    definition: queryFactsDefinition,
    handler: handleQueryFacts,
  },
  check_wip_budget: {
    definition: checkWipBudgetDefinition,
    handler: handleCheckWipBudget,
  },
};

/**
 * Obtiene todas las definiciones de herramientas registradas en el servidor MCP.
 */
export function getAllToolDefinitions(): McpToolDefinition[] {
  return Object.values(TOOLS_REGISTRY).map((entry) => entry.definition);
}

/**
 * Obtiene la definición de una herramienta MCP específica por nombre.
 */
export function getToolDefinition(name: string): McpToolDefinition | undefined {
  return TOOLS_REGISTRY[name]?.definition;
}

/**
 * Ejecuta una herramienta MCP por nombre pasando los argumentos y dependencias de dominio.
 */
export async function executeTool(
  name: string,
  args: unknown,
  deps: McpServerDependencies
): Promise<McpToolResult> {
  const toolEntry = TOOLS_REGISTRY[name];

  if (!toolEntry) {
    const availableTools = Object.keys(TOOLS_REGISTRY).join(', ');
    return {
      content: [
        {
          type: 'text',
          text: `Herramienta desconocida: "${name}". Herramientas disponibles: ${availableTools}.`,
        },
      ],
      isError: true,
    };
  }

  return toolEntry.handler(args, deps);
}
