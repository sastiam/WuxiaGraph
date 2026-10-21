-- WuxiaGraph Relational Storage Schema (SQLite WAL)
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
    last_updated_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    valid_from_chapter INTEGER DEFAULT 1,
    valid_to_chapter INTEGER,
    recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    superseded_by TEXT
);

CREATE INDEX IF NOT EXISTS idx_lore_relationships_source_target ON lore_relationships(source_entity_id, target_entity_id);
CREATE INDEX IF NOT EXISTS idx_lore_relationships_target_source ON lore_relationships(target_entity_id, source_entity_id);
CREATE INDEX IF NOT EXISTS idx_lore_relationships_temporal ON lore_relationships(valid_from_chapter, valid_to_chapter);
