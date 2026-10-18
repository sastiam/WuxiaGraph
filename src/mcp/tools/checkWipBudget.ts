import { z } from 'zod';
import { createInitialLedger } from '../../domain/governance/service.js';
import type { McpServerDependencies, McpToolDefinition, McpToolResult } from '../types.js';

export const CheckWipBudgetInputSchema = z.object({
  weekStartDate: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'El parámetro "weekStartDate" debe tener formato YYYY-MM-DD.')
    .optional(),
});

export type CheckWipBudgetInput = z.infer<typeof CheckWipBudgetInputSchema>;

export const checkWipBudgetDefinition: McpToolDefinition = {
  name: 'check_wip_budget',
  description:
    'Verifica el estado del presupuesto semanal de trabajo en progreso (WIP Budget) y del Circuit Breaker (límite estricto de 4.0 horas).',
  inputSchema: {
    type: 'object',
    properties: {
      weekStartDate: {
        type: 'string',
        description:
          'Fecha de inicio de semana en formato YYYY-MM-DD. Si no se especifica, se evalúa la semana actual.',
      },
    },
  },
};

export async function handleCheckWipBudget(
  args: unknown,
  deps: McpServerDependencies
): Promise<McpToolResult> {
  const parseResult = CheckWipBudgetInputSchema.safeParse(args ?? {});

  if (!parseResult.success) {
    const errorDetails = parseResult.error.issues
      .map((issue) => `${issue.path.join('.') || 'root'}: ${issue.message}`)
      .join('; ');

    return {
      content: [
        {
          type: 'text',
          text: `Error de validación en argumentos para check_wip_budget: ${errorDetails}`,
        },
      ],
      isError: true,
    };
  }

  try {
    const { weekStartDate } = parseResult.data;
    let ledger = weekStartDate
      ? await deps.govRepo.findByWeek(weekStartDate)
      : await deps.govRepo.getOrCreateCurrentWeekLedger();

    if (!ledger && weekStartDate) {
      ledger = createInitialLedger(weekStartDate);
    }

    if (!ledger) {
      throw new Error('No fue posible obtener o inicializar el ledger semanal de gobernanza.');
    }

    const isLocked =
      ledger.status === 'LOCKED_BY_WIP' || ledger.totalHoursLogged > ledger.maxBudgetHours;
    const remainingHours = Math.max(
      0,
      Math.round((ledger.maxBudgetHours - ledger.totalHoursLogged) * 10000) / 10000
    );

    const result = {
      weekStartDate: ledger.weekStartDate,
      totalHoursLogged: ledger.totalHoursLogged,
      maxBudgetHours: ledger.maxBudgetHours,
      remainingHours,
      branchesOpenedCount: ledger.branchesOpenedCount,
      status: isLocked ? 'LOCKED_BY_WIP' : ledger.status,
      isLocked,
    };

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
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
          text: `Error interno al consultar el presupuesto WIP: ${message}`,
        },
      ],
      isError: true,
    };
  }
}
