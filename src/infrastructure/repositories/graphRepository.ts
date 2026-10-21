import type { DatabaseSync } from 'node:sqlite';
import type { LoreRelationship } from '../../domain/entities.js';
import type { IGraphRepository } from '../../domain/graph/repository.js';
import { GraphForeignKeyViolationError } from '../../domain/graph/errors.js';
import {
  mapLoreRelationshipToRow,
  mapRowToLoreRelationship,
  type LoreRelationshipRow,
} from '../database.js';

/**
 * Repositorio de Persistencia SQLite WAL para el Motor de Grafos (WXG-019).
 * Gestiona consultas relacionales, inserción idempotente y comprobación de integridad.
 */
export class SqliteGraphRepository implements IGraphRepository {
  constructor(private readonly db: DatabaseSync) {}

  async addRelationship(relationship: LoreRelationship): Promise<void> {
    const row = mapLoreRelationshipToRow(relationship);
    try {
      const stmt = this.db.prepare(`
        INSERT INTO lore_relationships (
          relationship_id,
          source_entity_id,
          target_entity_id,
          relationship_type,
          affinity_weight,
          description,
          last_updated_timestamp
        )
        VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(relationship_id) DO UPDATE SET
          source_entity_id = excluded.source_entity_id,
          target_entity_id = excluded.target_entity_id,
          relationship_type = excluded.relationship_type,
          affinity_weight = excluded.affinity_weight,
          description = excluded.description,
          last_updated_timestamp = CURRENT_TIMESTAMP
      `);
      stmt.run(
        row.relationship_id,
        row.source_entity_id,
        row.target_entity_id,
        row.relationship_type,
        row.affinity_weight,
        row.description
      );
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('FOREIGN KEY constraint failed')) {
        throw new GraphForeignKeyViolationError(
          'FOREIGN_KEY_VIOLATION',
          `Violación de clave foránea en SQLite WAL: ${errorMessage}`
        );
      }
      throw error;
    }
  }

  async getRelationshipsByEntity(entityId: string): Promise<LoreRelationship[]> {
    const stmt = this.db.prepare(`
      SELECT relationship_id, source_entity_id, target_entity_id, relationship_type, affinity_weight, description, last_updated_timestamp
      FROM lore_relationships
      WHERE source_entity_id = ? OR target_entity_id = ?
      ORDER BY last_updated_timestamp DESC, relationship_id ASC
    `);
    const rows = stmt.all(entityId, entityId) as unknown as LoreRelationshipRow[];
    return rows.map(mapRowToLoreRelationship);
  }

  async getAllRelationships(): Promise<LoreRelationship[]> {
    const stmt = this.db.prepare(`
      SELECT relationship_id, source_entity_id, target_entity_id, relationship_type, affinity_weight, description, last_updated_timestamp
      FROM lore_relationships
      ORDER BY last_updated_timestamp DESC, relationship_id ASC
    `);
    const rows = stmt.all() as unknown as LoreRelationshipRow[];
    return rows.map(mapRowToLoreRelationship);
  }

  async deleteRelationship(relationshipId: string): Promise<void> {
    const stmt = this.db.prepare(`
      DELETE FROM lore_relationships
      WHERE relationship_id = ?
    `);
    stmt.run(relationshipId);
  }

  async getRelationshipById(relationshipId: string): Promise<LoreRelationship | null> {
    const stmt = this.db.prepare(`
      SELECT relationship_id, source_entity_id, target_entity_id, relationship_type, affinity_weight, description, last_updated_timestamp
      FROM lore_relationships
      WHERE relationship_id = ?
    `);
    const row = stmt.get(relationshipId) as unknown as LoreRelationshipRow | undefined;
    if (!row) {
      return null;
    }
    return mapRowToLoreRelationship(row);
  }
}
