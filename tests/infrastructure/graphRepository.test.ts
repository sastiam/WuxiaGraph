import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { DatabaseSync } from 'node:sqlite';
import {
  createDatabase,
  insertLoreEntity,
} from '../../src/infrastructure/database.js';
import { SqliteGraphRepository } from '../../src/infrastructure/repositories/graphRepository.js';
import { GraphForeignKeyViolationError } from '../../src/domain/graph/errors.js';

describe('SqliteGraphRepository (WXG-019)', () => {
  let db: DatabaseSync;
  let repo: SqliteGraphRepository;

  beforeEach(() => {
    db = createDatabase(':memory:');
    repo = new SqliteGraphRepository(db);

    // Entidades base de prueba
    insertLoreEntity(db, {
      entityId: 'ent_han_li',
      domain: 'xianxia',
      canonicalName: 'Han Li',
      currentStatus: 'ALIVE',
      attributes: { realm: 'Core Formation' },
    });

    insertLoreEntity(db, {
      entityId: 'ent_nangong_wan',
      domain: 'xianxia',
      canonicalName: 'Nangong Wan',
      currentStatus: 'ALIVE',
      attributes: { realm: 'Core Formation' },
    });

    insertLoreEntity(db, {
      entityId: 'ent_mo_juren',
      domain: 'xianxia',
      canonicalName: 'Doctor Mo',
      currentStatus: 'DECEASED',
      attributes: { realm: 'Mortal' },
    });
  });

  afterEach(() => {
    db.close();
  });

  it('debe registrar y recuperar una relación válida entre dos entidades', async () => {
    await repo.addRelationship({
      relationship_id: 'rel_han_nangong_dao',
      source_entity_id: 'ent_han_li',
      target_entity_id: 'ent_nangong_wan',
      relationship_type: 'DAO_COMPANION',
      affinity_weight: 0.95,
      description: 'Compañeros Dao y cónyuges',
    });

    const retrieved = await repo.getRelationshipById('rel_han_nangong_dao');
    expect(retrieved).not.toBeNull();
    expect(retrieved?.relationship_id).toBe('rel_han_nangong_dao');
    expect(retrieved?.source_entity_id).toBe('ent_han_li');
    expect(retrieved?.target_entity_id).toBe('ent_nangong_wan');
    expect(retrieved?.relationship_type).toBe('DAO_COMPANION');
    expect(retrieved?.affinity_weight).toBe(0.95);
    expect(retrieved?.description).toBe('Compañeros Dao y cónyuges');
  });

  it('debe lanzar GraphForeignKeyViolationError si la entidad origen o destino no existe', async () => {
    await expect(
      repo.addRelationship({
        relationship_id: 'rel_invalid_1',
        source_entity_id: 'non_existent_entity',
        target_entity_id: 'ent_han_li',
        relationship_type: 'RIVAL',
        affinity_weight: -0.5,
      })
    ).rejects.toThrow(GraphForeignKeyViolationError);

    await expect(
      repo.addRelationship({
        relationship_id: 'rel_invalid_2',
        source_entity_id: 'ent_han_li',
        target_entity_id: 'non_existent_target',
        relationship_type: 'RIVAL',
        affinity_weight: -0.5,
      })
    ).rejects.toThrow(GraphForeignKeyViolationError);
  });

  it('debe recuperar todas las relaciones donde una entidad participa como origen o destino', async () => {
    await repo.addRelationship({
      relationship_id: 'rel_1',
      source_entity_id: 'ent_han_li',
      target_entity_id: 'ent_nangong_wan',
      relationship_type: 'ALLY',
      affinity_weight: 0.8,
    });

    await repo.addRelationship({
      relationship_id: 'rel_2',
      source_entity_id: 'ent_mo_juren',
      target_entity_id: 'ent_han_li',
      relationship_type: 'BETRAYAL',
      affinity_weight: -0.9,
    });

    const hanLiRels = await repo.getRelationshipsByEntity('ent_han_li');
    expect(hanLiRels).toHaveLength(2);
    expect(hanLiRels.map((r) => r.relationship_id)).toEqual(
      expect.arrayContaining(['rel_1', 'rel_2'])
    );

    const moJurenRels = await repo.getRelationshipsByEntity('ent_mo_juren');
    expect(moJurenRels).toHaveLength(1);
    expect(moJurenRels[0].relationship_id).toBe('rel_2');
  });

  it('debe eliminar una relación por su ID', async () => {
    await repo.addRelationship({
      relationship_id: 'rel_del_1',
      source_entity_id: 'ent_han_li',
      target_entity_id: 'ent_nangong_wan',
      relationship_type: 'ALLY',
      affinity_weight: 0.5,
    });

    let all = await repo.getAllRelationships();
    expect(all).toHaveLength(1);

    await repo.deleteRelationship('rel_del_1');

    all = await repo.getAllRelationships();
    expect(all).toHaveLength(0);

    const single = await repo.getRelationshipById('rel_del_1');
    expect(single).toBeNull();
  });

  it('debe actualizar una relación existente en caso de conflicto de ID (idempotencia)', async () => {
    await repo.addRelationship({
      relationship_id: 'rel_upgrade',
      source_entity_id: 'ent_han_li',
      target_entity_id: 'ent_nangong_wan',
      relationship_type: 'ACQUAINTANCE',
      affinity_weight: 0.2,
      description: 'Primer encuentro',
    });

    await repo.addRelationship({
      relationship_id: 'rel_upgrade',
      source_entity_id: 'ent_han_li',
      target_entity_id: 'ent_nangong_wan',
      relationship_type: 'DAO_COMPANION',
      affinity_weight: 0.99,
      description: 'Voto solemne de cultivo dual',
    });

    const rel = await repo.getRelationshipById('rel_upgrade');
    expect(rel?.relationship_type).toBe('DAO_COMPANION');
    expect(rel?.affinity_weight).toBe(0.99);
    expect(rel?.description).toBe('Voto solemne de cultivo dual');
  });
});
