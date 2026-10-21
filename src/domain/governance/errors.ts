/**
 * Excepción de dominio cuando se excede el límite máximo de horas WIP.
 */
export class WipLimitExceededError extends Error {
  readonly code = 'LOCKED_BY_WIP';

  constructor(
    public readonly currentHours: number,
    public readonly attemptedHours: number,
    public readonly maxBudget: number = 4.0
  ) {
    super(
      `Circuit Breaker Activado [LOCKED_BY_WIP]: Se intentó registrar ${attemptedHours}h sobre un acumulado de ${currentHours}h, superando el límite máximo permitido de ${maxBudget}h.`
    );
    this.name = 'WipLimitExceededError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
