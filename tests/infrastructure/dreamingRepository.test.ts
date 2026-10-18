import { describe, it, expect, beforeEach } from 'vitest';
import type { DatabaseSync } from 'node:sqlite';
import { createDatabase, getJournalMode, isForeignKeysEnabled } from '../../src/infrastructure/database.js';
import { SqliteDreamingRepository } from '../../src/infrastructure/repositories/dreamingRepository.js';
import { DreamingForeignKeyViolationError } from '../../src/domain/dreaming/errors.js';
import type { LoreEntity, NarrativeFact } from '../../src/domain/entities.js';

describe('SqliteDreamingRepository (Infraestructura SQLite WAL)', () => {
  let db: DatabaseSync;
  let repo: SqliteDreamingRepository;

  beforeEach(() => {
    // Inicializar base de datos SQLite en memoria con esquema DDL aplicado
    db = createDatabase(':memory:');
    repo = new SqliteDreamingRepository(db);
  });

  it('debe inicializar SQLite con foreign_keys habilitados', () => {
    expect(isForeignKeysEnabled(db)).toBe(true);
  });

  it('debe persistir y recuperar una entidad de lore', async () => {
    const entity: LoreEntity = {
      entityId: 'ent_xiao_yan',
      domain: 'battle_through_the_heavens',
      canonicalName: 'Xiao Yan (萧炎)',
      currentStatus: 'Dou Practitioner',
      attributes: { flame: 'Heavenly Flame', alchemyTier: 1 },
    };

    await repo.saveEntity(entity);

    const retrieved = await repo.getEntity('ent_xiao_yan');
    expect(retrieved).not.toBeNull();
    expect(retrieved?.canonicalName).toBe('Xiao Yan (萧炎)');
    expect(retrieved?.domain).toBe('battle_through_the_heavens');
    expect(retrieved?.attributes).toEqual({ flame: 'Heavenly Flame', alchemyTier: 1 });
  });

  it('debe actualizar una entidad de forma idempotente (ON CONFLICT)', async () => {
    const entityV1: LoreEntity = {
      entityId: 'ent_idempotent',
      domain: 'xianxia',
      canonicalName: 'Lin Feng',
      currentStatus: 'Qi Stage 1',
      attributes: { stage: 1 },
    };

    await repo.saveEntity(entityV1);

    const entityV2: LoreEntity = {
      entityId: 'ent_idempotent',
      domain: 'xianxia',
      canonicalName: 'Lin Feng (Ascended)',
      currentStatus: 'Foundation Establishment',
      attributes: { stage: 2, technique: 'Nine Heavens' },
    };

    await repo.saveEntity(entityV2);

    const retrieved = await repo.getEntity('ent_idempotent');
    expect(retrieved?.canonicalName).toBe('Lin Feng (Ascended)');
    expect(retrieved?.currentStatus).toBe('Foundation Establishment');
    expect(retrieved?.attributes).toEqual({ stage: 2, technique: 'Nine Heavens' });
  });

  it('debe ejecutar saveDistillation de forma atómica en SQLite WAL', async () => {
    const entities: LoreEntity[] = [
      {
        entityId: 'ent_bai_xiaochun',
        domain: 'xianxia',
        canonicalName: 'Bai Xiaochun (白小纯)',
        currentStatus: 'ALIVE',
        attributes: { sect: 'Spirit Stream Sect' },
      },
    ];

    const facts: NarrativeFact[] = [
      {
        factId: 'fact_bai_1',
        entityId: 'ent_bai_xiaochun',
        factStatement: 'Bai Xiaochun encendió el incienso para llamar a los inmortales.',
        isCanon: true,
        chapterSource: 'Capítulo 1: Incienso',
      },
    ];

    await repo.saveDistillation(entities, facts);

    const savedEntity = await repo.getEntity('ent_bai_xiaochun');
    expect(savedEntity).toBeDefined();
    expect(savedEntity?.canonicalName).toBe('Bai Xiaochun (白小纯)');

    const savedFacts = await repo.getFacts('ent_bai_xiaochun');
    expect(savedFacts.length).toBe(1);
    expect(savedFacts[0].factStatement).toContain('Bai Xiaochun encendió el incienso');
    expect(savedFacts[0].isCanon).toBe(true);
  });

  it('debe revertir la transacción completa (ROLLBACK) si ocurre una violación de clave foránea', async () => {
    const entities: LoreEntity[] = [
      {
        entityId: 'ent_valid_new',
        domain: 'wuxia',
        canonicalName: 'Valid Entity',
        currentStatus: 'ACTIVE',
        attributes: {},
      },
    ];

    const facts: NarrativeFact[] = [
      {
        factId: 'fact_fk_fail',
        entityId: 'ent_never_existed_9999', // No existe en lore_entities ni en entities
        factStatement: 'Este hecho debe causar fallo de clave foránea.',
        isCanon: true,
        chapterSource: 'Capítulo 99',
      },
    ];

    await expect(repo.saveDistillation(entities, facts)).rejects.toThrowError(
      DreamingForeignKeyViolationError
    );

    // Verificar que la transacción fue revertida completamente: ent_valid_new NO debe existir
    const checkEntity = await repo.getEntity('ent_valid_new');
    expect(checkEntity).toBeNull();

    const checkFacts = await repo.getFacts();
    expect(checkFacts.length).toBe(0);
  });

  it('debe consultar entidades filtradas por dominio', async () => {
    await repo.saveEntity({
      entityId: 'e1',
      domain: 'xianxia',
      canonicalName: 'Entity 1',
      currentStatus: 'ACTIVE',
      attributes: {},
    });

    await repo.saveEntity({
      entityId: 'e2',
      domain: 'wuxia',
      canonicalName: 'Entity 2',
      currentStatus: 'ACTIVE',
      attributes: {},
    });

    const xianxiaEntities = await repo.getAllEntities('xianxia');
    expect(xianxiaEntities.length).toBe(1);
    expect(xianxiaEntities[0].entityId).toBe('e1');

    const allEntities = await repo.getAllEntities();
    expect(allEntities.length).toBe(2);
  });
});
