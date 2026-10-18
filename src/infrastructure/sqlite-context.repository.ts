import type { DatabaseSync } from 'node:sqlite';
import type { IContextRepository, CanonicalEntityContext } from '../domain/context/index.js';
import { getCanonicalEntitiesAndFactsByDomain } from './database.js';

/**
 * Implementación de infraestructura para IContextRepository utilizando SQLite (modo WAL).
 */
export class SqliteContextRepository implements IContextRepository {
  constructor(private readonly db: DatabaseSync) {}

  async getCanonicalContextByDomain(domain: string): Promise<CanonicalEntityContext[]> {
    return getCanonicalEntitiesAndFactsByDomain(this.db, domain);
  }
}
