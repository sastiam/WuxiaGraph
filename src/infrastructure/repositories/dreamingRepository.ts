import type { DatabaseSync } from 'node:sqlite';
import type { LoreEntity, NarrativeFact } from '../../domain/entities.js';
import type { IDreamingRepository } from '../../domain/dreaming/repository.js';
import { DreamingForeignKeyViolationError } from '../../domain/dreaming/errors.js';
import {
  mapLoreEntityToRow,
  mapRowToLoreEntity,
  mapNarrativeFactToRow,
  mapRowToNarrativeFact,
  type LoreEntityRow,
  type NarrativeFactRow,
} from '../database.js';

/**
 * Repositorio de Persistencia SQLite WAL para el Servicio Dreaming.
 * Maneja transacciones atómicas e integridad relacional.
 */
export class SqliteDreamingRepository implements IDreamingRepository {
  constructor(private readonly db: DatabaseSync) {}

  async getEntity(entityId: string): Promise<LoreEntity | null> {
    const stmt = this.db.prepare(`
      SELECT entity_id, domain, canonical_name, current_status, attributes_json, last_updated_timestamp
      FROM lore_entities
      WHERE entity_id = ?
    `);
    const row = stmt.get(entityId) as unknown as LoreEntityRow | undefined;
    if (!row) {
      return null;
    }
    return mapRowToLoreEntity(row);
  }

  async getAllEntities(domain?: string): Promise<LoreEntity[]> {
    if (domain) {
      const stmt = this.db.prepare(`
        SELECT entity_id, domain, canonical_name, current_status, attributes_json, last_updated_timestamp
        FROM lore_entities
        WHERE domain = ?
      `);
      const rows = stmt.all(domain) as unknown as LoreEntityRow[];
      return rows.map(mapRowToLoreEntity);
    }

    const stmt = this.db.prepare(`
      SELECT entity_id, domain, canonical_name, current_status, attributes_json, last_updated_timestamp
      FROM lore_entities
    `);
    const rows = stmt.all() as unknown as LoreEntityRow[];
    return rows.map(mapRowToLoreEntity);
  }

  async getFacts(entityId?: string): Promise<NarrativeFact[]> {
    if (entityId !== undefined) {
      const stmt = this.db.prepare(`
        SELECT fact_id, entity_id, fact_statement, is_canon, chapter_source
        FROM narrative_facts
        WHERE entity_id = ?
      `);
      const rows = stmt.all(entityId) as unknown as NarrativeFactRow[];
      return rows.map(mapRowToNarrativeFact);
    }

    const stmt = this.db.prepare(`
      SELECT fact_id, entity_id, fact_statement, is_canon, chapter_source
      FROM narrative_facts
    `);
    const rows = stmt.all() as unknown as NarrativeFactRow[];
    return rows.map(mapRowToNarrativeFact);
  }

  async saveEntity(entity: LoreEntity): Promise<void> {
    const row = mapLoreEntityToRow(entity);
    const stmt = this.db.prepare(`
      INSERT INTO lore_entities (entity_id, domain, canonical_name, current_status, attributes_json, last_updated_timestamp)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(entity_id) DO UPDATE SET
        domain = excluded.domain,
        canonical_name = excluded.canonical_name,
        current_status = excluded.current_status,
        attributes_json = excluded.attributes_json,
        last_updated_timestamp = CURRENT_TIMESTAMP
    `);
    stmt.run(row.entity_id, row.domain, row.canonical_name, row.current_status, row.attributes_json);
  }

  async saveFact(fact: NarrativeFact): Promise<void> {
    const row = mapNarrativeFactToRow(fact);
    const stmt = this.db.prepare(`
      INSERT INTO narrative_facts (fact_id, entity_id, fact_statement, is_canon, chapter_source)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(fact_id) DO UPDATE SET
        entity_id = excluded.entity_id,
        fact_statement = excluded.fact_statement,
        is_canon = excluded.is_canon,
        chapter_source = excluded.chapter_source
    `);
    stmt.run(row.fact_id, row.entity_id, row.fact_statement, row.is_canon, row.chapter_source);
  }

  /**
   * Ejecuta la persistencia atómica en SQLite WAL dentro de una transacción BEGIN / COMMIT.
   * En caso de error o violación de foreign keys, realiza ROLLBACK.
   */
  async saveDistillation(entities: LoreEntity[], facts: NarrativeFact[]): Promise<void> {
    this.db.exec('BEGIN TRANSACTION;');

    try {
      // 1. Inserción o actualización idempotente de lore_entities
      const upsertEntityStmt = this.db.prepare(`
        INSERT INTO lore_entities (entity_id, domain, canonical_name, current_status, attributes_json, last_updated_timestamp)
        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(entity_id) DO UPDATE SET
          domain = excluded.domain,
          canonical_name = excluded.canonical_name,
          current_status = excluded.current_status,
          attributes_json = excluded.attributes_json,
          last_updated_timestamp = CURRENT_TIMESTAMP
      `);

      for (const entity of entities) {
        const row = mapLoreEntityToRow(entity);
        upsertEntityStmt.run(
          row.entity_id,
          row.domain,
          row.canonical_name,
          row.current_status,
          row.attributes_json
        );
      }

      // 2. Inserción o actualización de narrative_facts
      const upsertFactStmt = this.db.prepare(`
        INSERT INTO narrative_facts (fact_id, entity_id, fact_statement, is_canon, chapter_source)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(fact_id) DO UPDATE SET
          entity_id = excluded.entity_id,
          fact_statement = excluded.fact_statement,
          is_canon = excluded.is_canon,
          chapter_source = excluded.chapter_source
      `);

      for (const fact of facts) {
        const row = mapNarrativeFactToRow(fact);
        upsertFactStmt.run(
          row.fact_id,
          row.entity_id,
          row.fact_statement,
          row.is_canon,
          row.chapter_source
        );
      }

      this.db.exec('COMMIT;');
    } catch (error: unknown) {
      try {
        this.db.exec('ROLLBACK;');
      } catch {
        // Rollback secundario puede fallar si no se abrió la transacción
      }

      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('FOREIGN KEY constraint failed')) {
        throw new DreamingForeignKeyViolationError(
          'foreign_key_violation',
          `Violación de clave foránea en SQLite WAL: ${errorMessage}`
        );
      }

      throw error;
    }
  }
}
