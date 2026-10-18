import type { WipGovernanceLedger } from '../entities.js';
import { WipLimitExceededError } from './errors.js';

export const DEFAULT_MAX_BUDGET_HOURS = 4.0;

/**
 * Crea una entrada inicial para el ledger de gobernanza WIP.
 */
export function createInitialLedger(
  weekStartDate: string,
  maxBudgetHours = DEFAULT_MAX_BUDGET_HOURS
): WipGovernanceLedger {
  return {
    weekStartDate,
    totalHoursLogged: 0.0,
    maxBudgetHours,
    branchesOpenedCount: 0,
    status: 'IN_LIMITS',
  };
}

/**
 * Registra horas en el ledger respetando la regla de Circuit Breaker.
 * Si el total acumulado supera maxBudgetHours, actualiza el estado a LOCKED_BY_WIP
 * y lanza WipLimitExceededError.
 */
export function logHoursToLedger(
  ledger: WipGovernanceLedger,
  hoursToAdd: number
): WipGovernanceLedger {
  if (hoursToAdd <= 0) {
    throw new Error('Las horas a registrar deben ser un número positivo.');
  }

  const currentTotal = ledger.totalHoursLogged;
  const newTotal = Math.round((currentTotal + hoursToAdd) * 10000) / 10000;

  if (newTotal > ledger.maxBudgetHours) {
    throw new WipLimitExceededError(
      currentTotal,
      hoursToAdd,
      ledger.maxBudgetHours
    );
  }

  return {
    ...ledger,
    totalHoursLogged: newTotal,
    status: 'IN_LIMITS',
  };
}

/**
 * Incrementa el contador de ramas abiertas en el ledger si está dentro de los límites.
 */
export function incrementBranchInLedger(ledger: WipGovernanceLedger): WipGovernanceLedger {
  if (ledger.status === 'LOCKED_BY_WIP' || ledger.totalHoursLogged > ledger.maxBudgetHours) {
    throw new WipLimitExceededError(
      ledger.totalHoursLogged,
      0,
      ledger.maxBudgetHours
    );
  }

  return {
    ...ledger,
    branchesOpenedCount: ledger.branchesOpenedCount + 1,
  };
}

/**
 * Verifica el estado del Circuit Breaker para un ledger.
 */
export function validateCircuitBreaker(ledger: WipGovernanceLedger): void {
  if (ledger.status === 'LOCKED_BY_WIP' || ledger.totalHoursLogged > ledger.maxBudgetHours) {
    throw new WipLimitExceededError(
      ledger.totalHoursLogged,
      0,
      ledger.maxBudgetHours
    );
  }
}
