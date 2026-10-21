import { DatabaseSync } from 'node:sqlite';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { LoreEntity, NarrativeFact, WipGovernanceLedger, LoreRelationship } from '../domain/entities.js';
import type { CanonicalEntityContext } from '../domain/context/types.js';

export const SCHEMA_SQL = `-- WuxiaGraph Relational Storage Schema (SQLite WAL)
-- Invariable DDL conforme a OpenSpec WXG-001

CREATE TABLE IF NOT EXISTS lore_entities (
    entity_id TEXT PRIMARY KEY,
    domain TEXT NOT NULL,
    canonical_name TEXT NOT NULL,
    current_status TEXT NOT NULL,
    attributes_json TEXT NOT NULL,
    last_updated_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS narrative_facts (
    fact_id TEXT PRIMARY KEY,
    entity_id TEXT REFERENCES lore_entities(entity_id),
    fact_statement TEXT NOT NULL,
    is_canon BOOLEAN DEFAULT 1,
    chapter_source TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS wip_governance_ledger (
    week_start_date DATE PRIMARY KEY,
    total_hours_logged REAL DEFAULT 0.0,
    max_budget_hours REAL DEFAULT 4.0,
    branches_opened_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'IN_LIMITS'
);

CREATE TABLE IF NOT EXISTS lore_relationships (
    relationship_id TEXT PRIMARY KEY,
    source_entity_id TEXT NOT NULL REFERENCES lore_entities(entity_id),
    target_entity_id TEXT NOT NULL REFERENCES lore_entities(entity_id),
    relationship_type TEXT NOT NULL,
    affinity_weight REAL DEFAULT 0.0,
    description TEXT,
    last_updated_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_lore_relationships_source_target ON lore_relationships(source_entity_id, target_entity_id);
CREATE INDEX IF NOT EXISTS idx_lore_relationships_target_source ON lore_relationships(target_entity_id, source_entity_id);

CREATE TABLE IF NOT EXISTS ingestion_checkpoints (
    job_id TEXT NOT NULL,
    book_title TEXT NOT NULL,
    chapter_index INTEGER NOT NULL,
    status TEXT NOT NULL,
    processed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    error_message TEXT,
    PRIMARY KEY (job_id, chapter_index)
);

CREATE INDEX IF NOT EXISTS idx_ingestion_checkpoints_job ON ingestion_checkpoints(job_id, status);
`;

export interface DatabaseOptions {
  path?: string;
  enableWal?: boolean;
  enableForeignKeys?: boolean;
  autoMigrate?: boolean;
  schemaSql?: string;
}

export interface LoreEntityRow {
  entity_id: string;
  domain: string;
  canonical_name: string;
  current_status: string;
  attributes_json: string;
  last_updated_timestamp?: string;
}

export interface NarrativeFactRow {
  fact_id: string;
  entity_id: string | null;
  fact_statement: string;
  is_canon: number;
  chapter_source: string;
}

export interface LoreRelationshipRow {
  relationship_id: string;
  source_entity_id: string;
  target_entity_id: string;
  relationship_type: string;
  affinity_weight: number;
  description: string | null;
  last_updated_timestamp?: string;
}

export interface WipGovernanceLedgerRow {
  week_start_date: string;
  total_hours_logged: number;
  max_budget_hours: number;
  branches_opened_count: number;
  status: string;
}

export interface CanonicalContextRow {
  entity_id: string;
  domain: string;
  canonical_name: string;
  current_status: string;
  attributes_json: string;
  last_updated_timestamp?: string;
  fact_id: string | null;
  fact_statement: string | null;
  is_canon: number | null;
  chapter_source: string | null;
}

/**
 * Carga el esquema DDL desde schema.sql si existe en el disco, o recurre a SCHEMA_SQL.
 */
export function loadSchemaSql(): string {
  try {
    const localPath = fileURLToPath(new URL('./schema.sql', import.meta.url));
    if (existsSync(localPath)) {
      return readFileSync(localPath, 'utf-8');
    }
  } catch {
    // Fallback silencioso a la constante incrustada
  }
  return SCHEMA_SQL;
}

/**
 * Inicializa y configura la conexión nativa a SQLite con PRAGMA journal_mode=WAL y PRAGMA foreign_keys=ON.
 */
export function createDatabase(optionsOrPath: string | DatabaseOptions = ':memory:'): DatabaseSync {
  const options: DatabaseOptions =
    typeof optionsOrPath === 'string'
      ? { path: optionsOrPath }
      : optionsOrPath;

  const targetPath = options.path ?? ':memory:';
  const db = new DatabaseSync(targetPath);

  const enableWal = options.enableWal ?? true;
  if (enableWal) {
    db.exec('PRAGMA journal_mode = WAL;');
  }

  const enableForeignKeys = options.enableForeignKeys ?? true;
  if (enableForeignKeys) {
    db.exec('PRAGMA foreign_keys = ON;');
  }

  const autoMigrate = options.autoMigrate ?? true;
  if (autoMigrate) {
    const ddl = options.schemaSql ?? loadSchemaSql();
    db.exec(ddl);
  }

  return db;
}

export const initDatabase = createDatabase;

/**
 * Obtiene el journal_mode configurado en la base de datos.
 */
export function getJournalMode(db: DatabaseSync): string {
  const result = db.prepare('PRAGMA journal_mode;').get() as { journal_mode?: string } | undefined;
  return result?.journal_mode ?? 'unknown';
}

/**
 * Verifica si las restricciones de llaves foráneas están activas.
 */
export function isForeignKeysEnabled(db: DatabaseSync): boolean {
  const result = db.prepare('PRAGMA foreign_keys;').get() as { foreign_keys?: number } | undefined;
  return result?.foreign_keys === 1;
}

/**
 * Parsea de forma segura una cadena JSON correspondiente a attributes_json.
 */
export function parseAttributesJson(rawJson: string): Record<string, unknown> {
  if (typeof rawJson !== 'string') {
    throw new TypeError('attributes_json must be a string');
  }

  const parsed: unknown = JSON.parse(rawJson);
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error('attributes_json must parse into a JSON object');
  }

  return parsed as Record<string, unknown>;
}

/**
 * Serializa un objeto de atributos a una cadena JSON válida.
 */
export function serializeAttributes(attributes: Record<string, unknown>): string {
  if (typeof attributes !== 'object' || attributes === null || Array.isArray(attributes)) {
    throw new TypeError('Attributes must be an object');
  }

  return JSON.stringify(attributes);
}

/**
 * Mapea un registro relacional LoreEntityRow a la entidad de dominio LoreEntity.
 */
export function mapRowToLoreEntity(row: LoreEntityRow): LoreEntity {
  return {
    entityId: row.entity_id,
    domain: row.domain,
    canonicalName: row.canonical_name,
    currentStatus: row.current_status,
    attributes: parseAttributesJson(row.attributes_json),
    lastUpdatedTimestamp: row.last_updated_timestamp,
  };
}

/**
 * Mapea una entidad de dominio LoreEntity al registro relacional LoreEntityRow.
 */
export function mapLoreEntityToRow(
  entity: LoreEntity
): Omit<LoreEntityRow, 'last_updated_timestamp'> & { last_updated_timestamp?: string } {
  return {
    entity_id: entity.entityId,
    domain: entity.domain,
    canonical_name: entity.canonicalName,
    current_status: entity.currentStatus,
    attributes_json: serializeAttributes(entity.attributes),
    last_updated_timestamp: entity.lastUpdatedTimestamp,
  };
}

/**
 * Mapea un registro relacional NarrativeFactRow a la entidad de dominio NarrativeFact.
 */
export function mapRowToNarrativeFact(row: NarrativeFactRow): NarrativeFact {
  return {
    factId: row.fact_id,
    entityId: row.entity_id,
    factStatement: row.fact_statement,
    isCanon: Number(row.is_canon) === 1,
    chapterSource: row.chapter_source,
  };
}

/**
 * Mapea una entidad de dominio NarrativeFact al registro relacional NarrativeFactRow.
 */
export function mapNarrativeFactToRow(fact: NarrativeFact): NarrativeFactRow {
  return {
    fact_id: fact.factId,
    entity_id: fact.entityId,
    fact_statement: fact.factStatement,
    is_canon: fact.isCanon ? 1 : 0,
    chapter_source: fact.chapterSource,
  };
}

/**
 * Mapea un registro relacional LoreRelationshipRow a la entidad de dominio LoreRelationship.
 */
export function mapRowToLoreRelationship(row: LoreRelationshipRow): LoreRelationship {
  return {
    relationship_id: row.relationship_id,
    source_entity_id: row.source_entity_id,
    target_entity_id: row.target_entity_id,
    relationship_type: row.relationship_type,
    affinity_weight: Number(row.affinity_weight),
    description: row.description,
    last_updated_timestamp: row.last_updated_timestamp,
    relationshipId: row.relationship_id,
    sourceEntityId: row.source_entity_id,
    targetEntityId: row.target_entity_id,
    relationshipType: row.relationship_type,
    affinityWeight: Number(row.affinity_weight),
    lastUpdatedTimestamp: row.last_updated_timestamp,
  };
}

/**
 * Mapea una entidad de dominio LoreRelationship al registro relacional LoreRelationshipRow.
 */
export function mapLoreRelationshipToRow(
  rel: LoreRelationship
): Omit<LoreRelationshipRow, 'last_updated_timestamp'> & { last_updated_timestamp?: string } {
  return {
    relationship_id: rel.relationship_id ?? rel.relationshipId,
    source_entity_id: rel.source_entity_id ?? rel.sourceEntityId,
    target_entity_id: rel.target_entity_id ?? rel.targetEntityId,
    relationship_type: rel.relationship_type ?? rel.relationshipType,
    affinity_weight: Number(rel.affinity_weight ?? rel.affinityWeight ?? 0.0),
    description: rel.description ?? null,
    last_updated_timestamp: rel.last_updated_timestamp ?? rel.lastUpdatedTimestamp,
  };
}

/**
 * Mapea un registro de wip_governance_ledger a la entidad de dominio WipGovernanceLedger.
 */
export function mapRowToWipLedger(row: WipGovernanceLedgerRow): WipGovernanceLedger {
  return {
    weekStartDate: row.week_start_date,
    totalHoursLogged: Number(row.total_hours_logged),
    maxBudgetHours: Number(row.max_budget_hours),
    branchesOpenedCount: Number(row.branches_opened_count),
    status: row.status,
  };
}

/**
 * Mapea una entidad WipGovernanceLedger a registro relacional WipGovernanceLedgerRow.
 */
export function mapWipLedgerToRow(ledger: WipGovernanceLedger): WipGovernanceLedgerRow {
  return {
    week_start_date: ledger.weekStartDate,
    total_hours_logged: ledger.totalHoursLogged,
    max_budget_hours: ledger.maxBudgetHours,
    branches_opened_count: ledger.branchesOpenedCount,
    status: ledger.status,
  };
}

/**
 * Inserta o reemplaza una entidad de lore en la base de datos.
 */
export function insertLoreEntity(db: DatabaseSync, entity: LoreEntity): void {
  const row = mapLoreEntityToRow(entity);
  const stmt = db.prepare(`
    INSERT INTO lore_entities (entity_id, domain, canonical_name, current_status, attributes_json)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(entity_id) DO UPDATE SET
      domain = excluded.domain,
      canonical_name = excluded.canonical_name,
      current_status = excluded.current_status,
      attributes_json = excluded.attributes_json,
      last_updated_timestamp = CURRENT_TIMESTAMP
  `);
  stmt.run(row.entity_id, row.domain, row.canonical_name, row.current_status, row.attributes_json);
}

/**
 * Obtiene una entidad de lore por su identificador.
 */
export function getLoreEntity(db: DatabaseSync, entityId: string): LoreEntity | null {
  const stmt = db.prepare('SELECT entity_id, domain, canonical_name, current_status, attributes_json, last_updated_timestamp FROM lore_entities WHERE entity_id = ?');
  const row = stmt.get(entityId) as unknown as LoreEntityRow | undefined;
  if (!row) {
    return null;
  }
  return mapRowToLoreEntity(row);
}

/**
 * Inserta un hecho narrativo en la base de datos.
 */
export function insertNarrativeFact(db: DatabaseSync, fact: NarrativeFact): void {
  const row = mapNarrativeFactToRow(fact);
  const stmt = db.prepare(`
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
 * Consulta los hechos narrativos, opcionalmente filtrados por entidad.
 */
export function getNarrativeFacts(db: DatabaseSync, entityId?: string): NarrativeFact[] {
  if (entityId !== undefined) {
    const stmt = db.prepare(`
      SELECT fact_id, entity_id, fact_statement, is_canon, chapter_source
      FROM narrative_facts
      WHERE entity_id = ?
    `);
    const rows = stmt.all(entityId) as unknown as NarrativeFactRow[];
    return rows.map(mapRowToNarrativeFact);
  }

  const stmt = db.prepare(`
    SELECT fact_id, entity_id, fact_statement, is_canon, chapter_source
    FROM narrative_facts
  `);
  const rows = stmt.all() as unknown as NarrativeFactRow[];
  return rows.map(mapRowToNarrativeFact);
}

/**
 * Registra o actualiza una entrada en el ledger de gobernanza WIP.
 */
export function upsertWipLedger(
  db: DatabaseSync,
  ledger: {
    weekStartDate: string;
    totalHoursLogged?: number;
    maxBudgetHours?: number;
    branchesOpenedCount?: number;
    status?: string;
  }
): void {
  const stmt = db.prepare(`
    INSERT INTO wip_governance_ledger (week_start_date, total_hours_logged, max_budget_hours, branches_opened_count, status)
    VALUES (?, COALESCE(?, 0.0), COALESCE(?, 4.0), COALESCE(?, 0), COALESCE(?, 'IN_LIMITS'))
    ON CONFLICT(week_start_date) DO UPDATE SET
      total_hours_logged = COALESCE(excluded.total_hours_logged, wip_governance_ledger.total_hours_logged),
      max_budget_hours = COALESCE(excluded.max_budget_hours, wip_governance_ledger.max_budget_hours),
      branches_opened_count = COALESCE(excluded.branches_opened_count, wip_governance_ledger.branches_opened_count),
      status = COALESCE(excluded.status, wip_governance_ledger.status)
  `);

  stmt.run(
    ledger.weekStartDate,
    ledger.totalHoursLogged ?? null,
    ledger.maxBudgetHours ?? null,
    ledger.branchesOpenedCount ?? null,
    ledger.status ?? null
  );
}

/**
 * Obtiene el registro de gobernanza para una semana dada.
 */
export function getWipLedger(db: DatabaseSync, weekStartDate: string): WipGovernanceLedger | null {
  const stmt = db.prepare(`
    SELECT week_start_date, total_hours_logged, max_budget_hours, branches_opened_count, status
    FROM wip_governance_ledger
    WHERE week_start_date = ?
  `);
  const row = stmt.get(weekStartDate) as unknown as WipGovernanceLedgerRow | undefined;
  if (!row) {
    return null;
  }
  return mapRowToWipLedger(row);
}

/**
 * Consulta optimizada en SQLite WAL que agrupa hechos canónicos (is_canon = 1) por entidad para un dominio dado.
 * Descarta estrictamente borradores (is_canon = 0).
 */
export function getCanonicalEntitiesAndFactsByDomain(
  db: DatabaseSync,
  domain: string
): CanonicalEntityContext[] {
  const stmt = db.prepare(`
    SELECT
      e.entity_id,
      e.domain,
      e.canonical_name,
      e.current_status,
      e.attributes_json,
      e.last_updated_timestamp,
      f.fact_id,
      f.fact_statement,
      f.is_canon,
      f.chapter_source
    FROM lore_entities e
    LEFT JOIN narrative_facts f
      ON e.entity_id = f.entity_id AND f.is_canon = 1
    WHERE e.domain = ?
    ORDER BY e.canonical_name ASC, e.entity_id ASC, f.chapter_source ASC, f.fact_id ASC
  `);

  const rows = stmt.all(domain) as unknown as CanonicalContextRow[];
  const entityMap = new Map<string, { entity: LoreEntity; facts: NarrativeFact[] }>();

  for (const row of rows) {
    let entry = entityMap.get(row.entity_id);
    if (!entry) {
      entry = {
        entity: {
          entityId: row.entity_id,
          domain: row.domain,
          canonicalName: row.canonical_name,
          currentStatus: row.current_status,
          attributes: parseAttributesJson(row.attributes_json),
          lastUpdatedTimestamp: row.last_updated_timestamp,
        },
        facts: [],
      };
      entityMap.set(row.entity_id, entry);
    }

    if (row.fact_id !== null && row.fact_statement !== null && row.chapter_source !== null) {
      entry.facts.push({
        factId: row.fact_id,
        entityId: row.entity_id,
        factStatement: row.fact_statement,
        isCanon: Number(row.is_canon) === 1,
        chapterSource: row.chapter_source,
      });
    }
  }

  return Array.from(entityMap.values());
}
