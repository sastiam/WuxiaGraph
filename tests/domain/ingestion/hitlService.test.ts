import { describe, it, expect, beforeEach } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import { HitLService } from '../../../src/domain/ingestion/hitlService.js';
import { createAliasesRouter } from '../../../src/api/routes/aliases.js';
import type { HitLProposalRecord } from '../../../src/domain/ingestion/coreference.js';

describe('HitLService & Aliases Router', () => {
  let db: DatabaseSync;
  let service: HitLService;

  beforeEach(() => {
    db = new DatabaseSync(':memory:');
    db.exec(`
      CREATE TABLE lore_entities (
        entity_id TEXT PRIMARY KEY,
        domain TEXT NOT NULL,
        canonical_name TEXT NOT NULL,
        current_status TEXT NOT NULL,
        attributes_json TEXT NOT NULL,
        last_updated_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE lore_relationships (
        relationship_id TEXT PRIMARY KEY,
        source_entity_id TEXT NOT NULL,
        target_entity_id TEXT NOT NULL,
        relationship_type TEXT NOT NULL,
        affinity_weight REAL DEFAULT 0.0,
        description TEXT,
        last_updated_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        valid_from_chapter INTEGER DEFAULT 1,
        valid_to_chapter INTEGER,
        recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        superseded_by TEXT
      );
    `);

    service = new HitLService(db);
  });

  it('manages proposals in HitLService: add, getPending, and reject', () => {
    const proposal: HitLProposalRecord = {
      proposalId: 'prop-1',
      candidateName: 'Pequeño Chen',
      targetEntityId: 'ent-chen',
      targetCanonicalName: 'Chen Fan',
      confidenceScore: 0.72,
      isCanon: false,
      status: 'PENDING',
      domain: 'character',
      createdAt: new Date().toISOString(),
    };

    service.addProposal(proposal);
    expect(service.getPendingAliases()).toHaveLength(1);
    expect(service.getPendingAliases()[0].proposalId).toBe('prop-1');

    const rejected = service.reviewAlias('prop-1', 'reject');
    expect(rejected).not.toBeNull();
    expect(rejected?.status).toBe('REJECTED');
    expect(rejected?.isCanon).toBe(false);
    expect(service.getPendingAliases()).toHaveLength(0);
  });

  it('approves proposal, updates lore_entities attributes and updates lore_relationships', () => {
    db.prepare(
      `INSERT INTO lore_entities (entity_id, domain, canonical_name, current_status, attributes_json)
       VALUES (?, ?, ?, ?, ?)`
    ).run('ent-chen', 'character', 'Chen Fan', 'ALIVE', JSON.stringify({ aliases: ['Chen Beixuan'] }));

    db.prepare(
      `INSERT INTO lore_relationships (relationship_id, source_entity_id, target_entity_id, relationship_type)
       VALUES (?, ?, ?, ?)`
    ).run('rel-1', 'Pequeño Chen', 'ent-other', 'FRIEND');

    db.prepare(
      `INSERT INTO lore_relationships (relationship_id, source_entity_id, target_entity_id, relationship_type)
       VALUES (?, ?, ?, ?)`
    ).run('rel-2', 'ent-other', 'prop-1', 'ENEMY');

    const proposal: HitLProposalRecord = {
      proposalId: 'prop-1',
      candidateName: 'Pequeño Chen',
      targetEntityId: 'ent-chen',
      targetCanonicalName: 'Chen Fan',
      confidenceScore: 0.85,
      isCanon: false,
      status: 'PENDING',
      domain: 'character',
      createdAt: new Date().toISOString(),
    };
    service.addProposal(proposal);

    const approved = service.reviewAlias('prop-1', 'approve');
    expect(approved?.status).toBe('APPROVED');
    expect(approved?.isCanon).toBe(true);

    const entityRow = db
      .prepare('SELECT attributes_json FROM lore_entities WHERE entity_id = ?')
      .get('ent-chen') as { attributes_json: string };
    const attrs = JSON.parse(entityRow.attributes_json);
    expect(attrs.aliases).toContain('Chen Beixuan');
    expect(attrs.aliases).toContain('Pequeño Chen');

    const rel1 = db.prepare('SELECT source_entity_id FROM lore_relationships WHERE relationship_id = ?').get('rel-1') as { source_entity_id: string };
    expect(rel1.source_entity_id).toBe('ent-chen');

    const rel2 = db.prepare('SELECT target_entity_id FROM lore_relationships WHERE relationship_id = ?').get('rel-2') as { target_entity_id: string };
    expect(rel2.target_entity_id).toBe('ent-chen');
  });

  it('exposes aliases HTTP router endpoints', async () => {
    const router = createAliasesRouter(service);

    const proposal: HitLProposalRecord = {
      proposalId: 'prop-2',
      candidateName: 'Maestro Fang',
      targetEntityId: 'ent-fang',
      targetCanonicalName: 'Fang Yuan',
      confidenceScore: 0.65,
      isCanon: false,
      status: 'PENDING',
      domain: 'character',
      createdAt: new Date().toISOString(),
    };
    service.addProposal(proposal);

    // GET /pending
    const resPending = await router.request('/pending');
    expect(resPending.status).toBe(200);
    const pendingJson = (await resPending.json()) as { pending: HitLProposalRecord[] };
    expect(pendingJson.pending).toHaveLength(1);
    expect(pendingJson.pending[0].proposalId).toBe('prop-2');

    // POST 404 for unknown
    const resNotFound = await router.request('/unknown/review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'approve' }),
    });
    expect(resNotFound.status).toBe(404);

    // POST 400 for bad body
    const resBad = await router.request('/prop-2/review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'invalid_action' }),
    });
    expect(resBad.status).toBe(400);

    // POST 200 for valid review
    const resApprove = await router.request('/prop-2/review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'approve', targetEntityId: 'ent-fang' }),
    });
    expect(resApprove.status).toBe(200);
    const approveJson = (await resApprove.json()) as { success: boolean; proposal: HitLProposalRecord };
    expect(approveJson.success).toBe(true);
    expect(approveJson.proposal.status).toBe('APPROVED');
  });
});
