import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { DatabaseSync } from 'node:sqlite';
import { createDatabase } from '../../src/infrastructure/database.js';
import { SqliteWipGovernanceRepository } from '../../src/infrastructure/sqlite-wip-governance.repository.js';
import { WipLimitExceededError } from '../../src/domain/governance/index.js';

describe('SqliteWipGovernanceRepository', () => {
  let db: DatabaseSync;
  let repo: SqliteWipGovernanceRepository;

  beforeEach(() => {
    db = createDatabase(':memory:');
    repo = new SqliteWipGovernanceRepository(db);
  });

  afterEach(() => {
    db.close();
  });

  it('debe obtener o crear el ledger para la semana actual', async () => {
    const ledger = await repo.getOrCreateCurrentWeekLedger(new Date('2026-10-18T12:00:00Z'));
    expect(ledger.weekStartDate).toBe('2026-10-12');
    expect(ledger.totalHoursLogged).toBe(0.0);
    expect(ledger.maxBudgetHours).toBe(4.0);
    expect(ledger.status).toBe('IN_LIMITS');
  });

  it('debe registrar 3.99h en la base de datos manteniendo el estado IN_LIMITS', async () => {
    const updated = await repo.logHours('2026-10-12', 3.99);

    expect(updated.totalHoursLogged).toBe(3.99);
    expect(updated.status).toBe('IN_LIMITS');

    const persisted = await repo.findByWeek('2026-10-12');
    expect(persisted).not.toBeNull();
    expect(persisted?.totalHoursLogged).toBe(3.99);
    expect(persisted?.status).toBe('IN_LIMITS');
  });

  it('debe bloquear el ledger a LOCKED_BY_WIP en la base de datos al registrar 4.01h', async () => {
    await expect(repo.logHours('2026-10-12', 4.01)).rejects.toThrowError(WipLimitExceededError);

    const persisted = await repo.findByWeek('2026-10-12');
    expect(persisted).not.toBeNull();
    expect(persisted?.totalHoursLogged).toBe(4.01);
    expect(persisted?.status).toBe('LOCKED_BY_WIP');
  });

  it('debe incrementar el número de ramas abiertas en SQLite', async () => {
    const ledger1 = await repo.incrementBranchCount('2026-10-12');
    expect(ledger1.branchesOpenedCount).toBe(1);

    const ledger2 = await repo.incrementBranchCount('2026-10-12');
    expect(ledger2.branchesOpenedCount).toBe(2);

    const persisted = await repo.findByWeek('2026-10-12');
    expect(persisted?.branchesOpenedCount).toBe(2);
  });
});
