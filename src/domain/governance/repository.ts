import type { WipGovernanceLedger } from '../entities.js';

export interface IWipGovernanceRepository {
  findByWeek(weekStartDate: string): Promise<WipGovernanceLedger | null>;
  save(ledger: WipGovernanceLedger): Promise<void>;
  getOrCreateCurrentWeekLedger(date?: Date): Promise<WipGovernanceLedger>;
  logHours(weekStartDate: string, hours: number): Promise<WipGovernanceLedger>;
  incrementBranchCount(weekStartDate: string): Promise<WipGovernanceLedger>;
}
