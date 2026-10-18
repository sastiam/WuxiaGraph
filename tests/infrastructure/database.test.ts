import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import {
  createDatabase,
  getJournalMode,
  isForeignKeysEnabled,
  parseAttributesJson,
  serializeAttributes,
  mapRowToLoreEntity,
  mapLoreEntityToRow,
  insertLoreEntity,
  getLoreEntity,
  insertNarrativeFact,
  getNarrativeFacts,
  upsertWipLedger,
  getWipLedger,
  SCHEMA_SQL,
} from '../../src/infrastructure/database.js';
import type { DatabaseSync } from 'node:sqlite';

describe('SQLite WAL Storage & Invariant Tests (WXG-012)', () => {
  let tempDir: string | null = null;
  let activeDbs: DatabaseSync[] = [];

  const trackDb = (db: DatabaseSync): DatabaseSync => {
    activeDbs.push(db);
    return db;
  };

  afterEach(() => {
    for (const db of activeDbs) {
      try {
        db.close();
      } catch {
        // Ignorar si ya estaba cerrada
      }
    }
    activeDbs = [];

    if (tempDir && fs.existsSync(tempDir)) {
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
      } catch {
        // Ignorar cleanup en fallo
      }
      tempDir = null;
    }
  });

  describe('1. Inicialización de Tablas & Esquema Relacional', () => {
    it('debe crear las tablas lore_entities, narrative_facts y wip_governance_ledger', () => {
      const db = trackDb(createDatabase(':memory:'));

      const tablesQuery = db.prepare(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name NOT LIKE 'sqlite_%' 
        ORDER BY name ASC;
      `);
      const tableRows = tablesQuery.all() as Array<{ name: string }>;
      const tableNames = tableRows.map((r) => r.name);

      expect(tableNames).toContain('lore_entities');
      expect(tableNames).toContain('narrative_facts');
      expect(tableNames).toContain('wip_governance_ledger');
    });

    it('debe definir las columnas esperadas en cada tabla', () => {
      const db = trackDb(createDatabase(':memory:'));

      const getColumns = (tableName: string): string[] => {
        const rows = db.prepare(`PRAGMA table_info(${tableName});`).all() as Array<{ name: string }>;
        return rows.map((r) => r.name);
      };

      const loreCols = getColumns('lore_entities');
      expect(loreCols).toEqual(
        expect.arrayContaining([
          'entity_id',
          'domain',
          'canonical_name',
          'current_status',
          'attributes_json',
          'last_updated_timestamp',
        ])
      );

      const factsCols = getColumns('narrative_facts');
      expect(factsCols).toEqual(
        expect.arrayContaining([
          'fact_id',
          'entity_id',
          'fact_statement',
          'is_canon',
          'chapter_source',
        ])
      );

      const ledgerCols = getColumns('wip_governance_ledger');
      expect(ledgerCols).toEqual(
        expect.arrayContaining([
          'week_start_date',
          'total_hours_logged',
          'max_budget_hours',
          'branches_opened_count',
          'status',
        ])
      );
    });

    it('debe permitir la ejecución idempotente del esquema DDL sin errores', () => {
      const db = trackDb(createDatabase(':memory:'));
      expect(() => {
        db.exec(SCHEMA_SQL);
        db.exec(SCHEMA_SQL);
      }).not.toThrow();
    });
  });

  describe('2. Verificación de Modo WAL & Foreign Keys', () => {
    it('debe configurar PRAGMA journal_mode=wal en base de datos basada en archivo', () => {
      tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wxg-wal-test-'));
      const dbPath = path.join(tempDir, 'wuxiagraph_wal.db');

      const db = trackDb(createDatabase({ path: dbPath }));

      const mode = getJournalMode(db);
      expect(mode.toLowerCase()).toBe('wal');

      const rawPragma = db.prepare('PRAGMA journal_mode;').get() as { journal_mode: string };
      expect(rawPragma.journal_mode.toLowerCase()).toBe('wal');
    });

    it('debe tener PRAGMA foreign_keys activado (retornando 1)', () => {
      const db = trackDb(createDatabase(':memory:'));

      expect(isForeignKeysEnabled(db)).toBe(true);

      const rawPragma = db.prepare('PRAGMA foreign_keys;').get() as { foreign_keys: number };
      expect(rawPragma.foreign_keys).toBe(1);
    });
  });

  describe('3. Integridad Relacional y Falla de Foreign Key', () => {
    it('debe lanzar error de Foreign Key al insertar un hecho con entidad inexistente', () => {
      const db = trackDb(createDatabase(':memory:'));

      expect(() => {
        insertNarrativeFact(db, {
          factId: 'fact-orphan-001',
          entityId: 'non-existent-entity-999',
          factStatement: 'El Patriarca Han Li alcanzó la etapa Alma Naciente.',
          isCanon: true,
          chapterSource: 'Capítulo 420',
        });
      }).toThrow(/FOREIGN KEY constraint failed/);
    });

    it('debe permitir insertar un hecho cuando la entidad de lore existe previamente', () => {
      const db = trackDb(createDatabase(':memory:'));

      insertLoreEntity(db, {
        entityId: 'cultivator-han-li',
        domain: 'Xianxia/Characters',
        canonicalName: 'Han Li',
        currentStatus: 'ALIVE',
        attributes: {
          sect: 'Yellow Maple Valley',
          cultivationRealm: 'Foundation Establishment',
        },
      });

      expect(() => {
        insertNarrativeFact(db, {
          factId: 'fact-valid-001',
          entityId: 'cultivator-han-li',
          factStatement: 'Han Li refinó la Píldora de Establecimiento de Fundación.',
          isCanon: true,
          chapterSource: 'Capítulo 15',
        });
      }).not.toThrow();

      const facts = getNarrativeFacts(db, 'cultivator-han-li');
      expect(facts).toHaveLength(1);
      expect(facts[0]).toMatchObject({
        factId: 'fact-valid-001',
        entityId: 'cultivator-han-li',
        factStatement: 'Han Li refinó la Píldora de Establecimiento de Fundación.',
        isCanon: true,
        chapterSource: 'Capítulo 15',
      });
    });

    it('debe permitir hechos con entityId nulo si no están atados a una entidad específica', () => {
      const db = trackDb(createDatabase(':memory:'));

      expect(() => {
        insertNarrativeFact(db, {
          factId: 'fact-world-001',
          entityId: null,
          factStatement: 'El Reino Mortal tiene poca concentración de Qi espiritual.',
          isCanon: true,
          chapterSource: 'Prólogo',
        });
      }).not.toThrow();

      const facts = getNarrativeFacts(db);
      expect(facts.some((f) => f.factId === 'fact-world-001')).toBe(true);
    });
  });

  describe('4. Manejo y Parseo de attributes_json', () => {
    it('debe serializar y parsear objetos de atributos complejos correctamente', () => {
      const complexAttributes = {
        cultivationRealm: 'Core Formation',
        cultivationStage: 2,
        techniques: ['Great Development Technique', 'Azure Essence Sword Art'],
        spiritualRoot: {
          elements: ['wood', 'water'],
          purity: 0.85,
        },
        hasHeavenlyArtifact: true,
        spiritStonesCount: 15400,
      };

      const serialized = serializeAttributes(complexAttributes);
      expect(typeof serialized).toBe('string');

      const parsed = parseAttributesJson(serialized);
      expect(parsed).toEqual(complexAttributes);
    });

    it('debe lanzar error cuando attributes_json contiene JSON malformado', () => {
      const invalidJson = '{"realm": "Golden Core", incomplete';
      expect(() => parseAttributesJson(invalidJson)).toThrow();
    });

    it('debe lanzar error cuando attributes_json no representa un objeto JSON', () => {
      expect(() => parseAttributesJson('["array", "not", "object"]')).toThrow(
        /attributes_json must parse into a JSON object/
      );
      expect(() => parseAttributesJson('12345')).toThrow(
        /attributes_json must parse into a JSON object/
      );
      expect(() => parseAttributesJson('"string value"')).toThrow(
        /attributes_json must parse into a JSON object/
      );
    });

    it('debe persistir attributes_json en SQLite y recuperarlo como objeto estructurado en el dominio', () => {
      const db = trackDb(createDatabase(':memory:'));

      const originalEntity = {
        entityId: 'artifact-green-vial',
        domain: 'Xianxia/Treasures',
        canonicalName: 'Pequeño Vial Verde',
        currentStatus: 'BOUND',
        attributes: {
          origin: 'Reino Inmortal',
          abilities: ['Acelera el crecimiento de hierbas espirituales', 'Condensa Rocío Verde'],
          tier: 'Tesoro Celestial Primordial',
          cooldownHours: 168,
        },
      };

      insertLoreEntity(db, originalEntity);

      // Verificación directa en el registro de la base de datos (relacional)
      const rawRow = db
        .prepare('SELECT attributes_json FROM lore_entities WHERE entity_id = ?')
        .get(originalEntity.entityId) as { attributes_json: string };

      expect(typeof rawRow.attributes_json).toBe('string');
      expect(JSON.parse(rawRow.attributes_json)).toEqual(originalEntity.attributes);

      // Verificación a través del adaptador y mapper de dominio
      const retrieved = getLoreEntity(db, originalEntity.entityId);
      expect(retrieved).not.toBeNull();
      expect(retrieved?.attributes).toEqual(originalEntity.attributes);
      expect(retrieved?.canonicalName).toBe('Pequeño Vial Verde');
    });

    it('debe actualizar attributes_json al invocar insertLoreEntity con el mismo entityId', () => {
      const db = trackDb(createDatabase(':memory:'));

      insertLoreEntity(db, {
        entityId: 'cultivator-nangong-wan',
        domain: 'Xianxia/Characters',
        canonicalName: 'Nangong Wan',
        currentStatus: 'ALIVE',
        attributes: {
          sect: 'Masked Moon Sect',
          cultivationRealm: 'Core Formation',
        },
      });

      insertLoreEntity(db, {
        entityId: 'cultivator-nangong-wan',
        domain: 'Xianxia/Characters',
        canonicalName: 'Nangong Wan',
        currentStatus: 'ALIVE',
        attributes: {
          sect: 'Masked Moon Sect',
          cultivationRealm: 'Nascent Soul',
          fellowDaoistCompanion: 'Han Li',
        },
      });

      const updated = getLoreEntity(db, 'cultivator-nangong-wan');
      expect(updated?.attributes).toEqual({
        sect: 'Masked Moon Sect',
        cultivationRealm: 'Nascent Soul',
        fellowDaoistCompanion: 'Han Li',
      });
    });
  });

  describe('5. Invariantes de wip_governance_ledger', () => {
    it('debe insertar registros con los valores por defecto del Circuit Breaker (4.0h, IN_LIMITS)', () => {
      const db = trackDb(createDatabase(':memory:'));

      upsertWipLedger(db, {
        weekStartDate: '2026-10-12',
      });

      const ledger = getWipLedger(db, '2026-10-12');
      expect(ledger).not.toBeNull();
      expect(ledger?.weekStartDate).toBe('2026-10-12');
      expect(ledger?.totalHoursLogged).toBe(0.0);
      expect(ledger?.maxBudgetHours).toBe(4.0);
      expect(ledger?.branchesOpenedCount).toBe(0);
      expect(ledger?.status).toBe('IN_LIMITS');
    });

    it('debe actualizar horas y estado correctamente', () => {
      const db = trackDb(createDatabase(':memory:'));

      upsertWipLedger(db, {
        weekStartDate: '2026-10-12',
        totalHoursLogged: 4.1,
        status: 'LOCKED_BY_WIP',
      });

      const ledger = getWipLedger(db, '2026-10-12');
      expect(ledger?.totalHoursLogged).toBe(4.1);
      expect(ledger?.status).toBe('LOCKED_BY_WIP');
    });
  });
});
