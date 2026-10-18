import { describe, it, expect } from 'vitest';
import {
  getStartOfWeek,
  createInitialLedger,
  logHoursToLedger,
  incrementBranchInLedger,
  validateCircuitBreaker,
  WipLimitExceededError,
} from '../../src/domain/governance/index.js';

describe('Dominio de Gobernanza WIP & Circuit Breaker', () => {
  describe('getStartOfWeek', () => {
    it('debe calcular correctamente el Lunes de la semana dada', () => {
      // 2026-10-18 es Domingo
      const sunday = new Date('2026-10-18T12:00:00Z');
      const startOfWeek = getStartOfWeek(sunday);
      // El Lunes de esa semana es 2026-10-12
      expect(startOfWeek).toBe('2026-10-12');
    });

    it('debe mantener la fecha si ya es Lunes', () => {
      const monday = new Date('2026-10-12T10:00:00Z');
      expect(getStartOfWeek(monday)).toBe('2026-10-12');
    });
  });

  describe('logHoursToLedger & Circuit Breaker', () => {
    it('debe permitir registrar 3.99h y mantener estado IN_LIMITS', () => {
      const ledger = createInitialLedger('2026-10-12');
      const updated = logHoursToLedger(ledger, 3.99);

      expect(updated.totalHoursLogged).toBe(3.99);
      expect(updated.status).toBe('IN_LIMITS');
      expect(updated.maxBudgetHours).toBe(4.0);
    });

    it('debe permitir registrar exactamente 4.0h y mantener estado IN_LIMITS', () => {
      const ledger = createInitialLedger('2026-10-12');
      const updated = logHoursToLedger(ledger, 4.0);

      expect(updated.totalHoursLogged).toBe(4.0);
      expect(updated.status).toBe('IN_LIMITS');
    });

    it('debe rechazar registrar 4.01h con WipLimitExceededError y código LOCKED_BY_WIP', () => {
      const ledger = createInitialLedger('2026-10-12');

      expect(() => logHoursToLedger(ledger, 4.01)).toThrowError(WipLimitExceededError);

      try {
        logHoursToLedger(ledger, 4.01);
      } catch (err: unknown) {
        expect(err).toBeInstanceOf(WipLimitExceededError);
        const error = err as WipLimitExceededError;
        expect(error.code).toBe('LOCKED_BY_WIP');
        expect(error.currentHours).toBe(0);
        expect(error.attemptedHours).toBe(4.01);
        expect(error.maxBudget).toBe(4.0);
      }
    });

    it('debe rechazar registro cuando horas acumuladas + horas a sumar superen 4.0h', () => {
      let ledger = createInitialLedger('2026-10-12');
      ledger = logHoursToLedger(ledger, 3.5);

      expect(() => logHoursToLedger(ledger, 0.6)).toThrowError(WipLimitExceededError);
    });
  });

  describe('incrementBranchInLedger', () => {
    it('debe incrementar el contador de ramas abiertas cuando está en límites', () => {
      const ledger = createInitialLedger('2026-10-12');
      const updated1 = incrementBranchInLedger(ledger);
      expect(updated1.branchesOpenedCount).toBe(1);

      const updated2 = incrementBranchInLedger(updated1);
      expect(updated2.branchesOpenedCount).toBe(2);
    });

    it('debe rechazar incremento de rama si el estado es LOCKED_BY_WIP', () => {
      const lockedLedger = {
        ...createInitialLedger('2026-10-12'),
        totalHoursLogged: 4.5,
        status: 'LOCKED_BY_WIP',
      };

      expect(() => incrementBranchInLedger(lockedLedger)).toThrowError(WipLimitExceededError);
    });
  });

  describe('validateCircuitBreaker', () => {
    it('no debe lanzar excepción si el ledger está en reglas', () => {
      const ledger = createInitialLedger('2026-10-12');
      expect(() => validateCircuitBreaker(ledger)).not.toThrow();
    });

    it('debe lanzar WipLimitExceededError si el ledger está bloqueado', () => {
      const lockedLedger = {
        ...createInitialLedger('2026-10-12'),
        totalHoursLogged: 5.0,
        status: 'LOCKED_BY_WIP',
      };
      expect(() => validateCircuitBreaker(lockedLedger)).toThrowError(WipLimitExceededError);
    });
  });
});
