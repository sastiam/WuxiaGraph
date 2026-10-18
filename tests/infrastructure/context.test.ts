import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { DatabaseSync } from 'node:sqlite';
import {
  createDatabase,
  insertLoreEntity,
  insertNarrativeFact,
  getCanonicalEntitiesAndFactsByDomain,
} from '../../src/infrastructure/database.js';
import { SqliteContextRepository } from '../../src/infrastructure/sqlite-context.repository.js';

describe('SqliteContextRepository & Almacenamiento Relacional de Contexto', () => {
  let db: DatabaseSync;
  let repo: SqliteContextRepository;

  beforeEach(() => {
    db = createDatabase(':memory:');
    repo = new SqliteContextRepository(db);
  });

  afterEach(() => {
    db.close();
  });

  it('debe consultar entidades y hechos agrupados únicamente para el dominio especificado', async () => {
    // Entidad en Dominio A
    insertLoreEntity(db, {
      entityId: 'ent-domain-a-1',
      domain: 'DomainA',
      canonicalName: 'Entidad A',
      currentStatus: 'ACTIVE',
      attributes: { rank: 1 },
    });
    insertNarrativeFact(db, {
      factId: 'fact-a-1',
      entityId: 'ent-domain-a-1',
      factStatement: 'Hecho de dominio A.',
      isCanon: true,
      chapterSource: 'Cap 1',
    });

    // Entidad en Dominio B
    insertLoreEntity(db, {
      entityId: 'ent-domain-b-1',
      domain: 'DomainB',
      canonicalName: 'Entidad B',
      currentStatus: 'ACTIVE',
      attributes: { rank: 2 },
    });
    insertNarrativeFact(db, {
      factId: 'fact-b-1',
      entityId: 'ent-domain-b-1',
      factStatement: 'Hecho de dominio B.',
      isCanon: true,
      chapterSource: 'Cap 2',
    });

    const contextsA = await repo.getCanonicalContextByDomain('DomainA');
    expect(contextsA).toHaveLength(1);
    expect(contextsA[0].entity.entityId).toBe('ent-domain-a-1');
    expect(contextsA[0].facts).toHaveLength(1);
    expect(contextsA[0].facts[0].factId).toBe('fact-a-1');

    const contextsB = await repo.getCanonicalContextByDomain('DomainB');
    expect(contextsB).toHaveLength(1);
    expect(contextsB[0].entity.entityId).toBe('ent-domain-b-1');
    expect(contextsB[0].facts).toHaveLength(1);
    expect(contextsB[0].facts[0].factId).toBe('fact-b-1');
  });

  it('debe excluir hechos con is_canon = 0 en la consulta SQL', async () => {
    insertLoreEntity(db, {
      entityId: 'ent-swordsman',
      domain: 'Wuxia/MartialArtists',
      canonicalName: 'Espadachín Solitario',
      currentStatus: 'WANDERING',
      attributes: { weapon: 'Hoja de Jade' },
    });

    // Hecho canónico
    insertNarrativeFact(db, {
      factId: 'fact-canon',
      entityId: 'ent-swordsman',
      factStatement: 'Dominó la espada de 9 sombras.',
      isCanon: true,
      chapterSource: 'Cap 10',
    });

    // Hecho no canónico (borrador)
    insertNarrativeFact(db, {
      factId: 'fact-draft',
      entityId: 'ent-swordsman',
      factStatement: 'Borrador: Perdió el brazo izquierdo.',
      isCanon: false,
      chapterSource: 'Cap 12-Draft',
    });

    const directRows = getCanonicalEntitiesAndFactsByDomain(db, 'Wuxia/MartialArtists');
    expect(directRows).toHaveLength(1);
    expect(directRows[0].facts).toHaveLength(1);
    expect(directRows[0].facts[0].factId).toBe('fact-canon');
    expect(directRows[0].facts[0].isCanon).toBe(true);
  });

  it('debe devolver la entidad con facts = [] si todos sus hechos tienen is_canon = 0', async () => {
    insertLoreEntity(db, {
      entityId: 'ent-only-drafts',
      domain: 'Wuxia/Legends',
      canonicalName: 'Leyenda Olvidada',
      currentStatus: 'DORMANT',
      attributes: {},
    });

    insertNarrativeFact(db, {
      factId: 'fact-draft-only',
      entityId: 'ent-only-drafts',
      factStatement: 'Idea preliminar sin canonizar.',
      isCanon: false,
      chapterSource: 'Notas',
    });

    const contexts = await repo.getCanonicalContextByDomain('Wuxia/Legends');
    expect(contexts).toHaveLength(1);
    expect(contexts[0].entity.canonicalName).toBe('Leyenda Olvidada');
    expect(contexts[0].facts).toEqual([]);
  });

  it('debe devolver un arreglo vacío si el dominio no existe', async () => {
    const contexts = await repo.getCanonicalContextByDomain('NonExistentDomain');
    expect(contexts).toEqual([]);
  });
});
