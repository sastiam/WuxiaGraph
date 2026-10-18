import type { DatabaseSync } from 'node:sqlite';
import type { WipGovernanceLedger } from '../domain/entities.js';
import type { IWipGovernanceRepository } from '../domain/governance/repository.js';
import {
  createInitialLedger,
  getStartOfWeek,
  incrementBranchInLedger,
  logHoursToLedger,
} from '../domain/governance/index.js';
import { getWipLedger, upsertWipLedger } from './database.js';

/**
 * Repositorio de Gobernanza WIP sobre la base de datos SQLite (WAL).
 */
export class SqliteWipGovernanceRepository implements IWipGovernanceRepository {
  constructor(private readonly db: DatabaseSync) {}

  async findByWeek(weekStartDate: string): Promise<WipGovernanceLedger | null> {
    return getWipLedger(this.db, weekStartDate);
  }

  async save(ledger: WipGovernanceLedger): Promise<void> {
    upsertWipLedger(this.db, ledger);
  }

  async getOrCreateCurrentWeekLedger(date: Date = new Date()): Promise<WipGovernanceLedger> {
    const weekStartDate = getStartOfWeek(date);
    const existing = await this.findByWeek(weekStartDate);
    if (existing) {
      return existing;
    }

    const initial = createInitialLedger(weekStartDate);
    await this.save(initial);
    return initial;
  }

  async logHours(weekStartDate: string, hours: number): Promise<WipGovernanceLedger> {
    const ledger = (await this.findByWeek(weekStartDate)) ?? createInitialLedger(weekStartDate);

    try {
      const updated = logHoursToLedger(ledger, hours);
      await this.save(updated);
      return updated;
    } catch (error) {
      // Al ser bloqueado por Circuit Breaker, persistimos el estado LOCKED_BY_WIP
      const lockedLedger: WipGovernanceLedger = {
        ...ledger,
        totalHoursLogged: Math.round((ledger.totalHoursLogged + hours) * 10000) / 10000,
        status: 'LOCKED_BY_WIP',
      };
      await this.save(lockedLedger);
      throw error;
    }
  }

  async incrementBranchCount(weekStartDate: string): Promise<WipGovernanceLedger> {
    const ledger = (await this.findByWeek(weekStartDate)) ?? createInitialLedger(weekStartDate);
    const updated = incrementBranchInLedger(ledger);
    await this.save(updated);
    return updated;
  }
}
