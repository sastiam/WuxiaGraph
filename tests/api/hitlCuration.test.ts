import { describe, it, expect, beforeEach } from 'vitest';
import type { DatabaseSync } from 'node:sqlite';
import type { Hono } from 'hono';
import { createApp } from '../../src/index.js';
import { createDatabase, insertLoreEntity } from '../../src/infrastructure/database.js';
import { HitLService } from '../../src/domain/ingestion/hitlService.js';
import type { HitLProposalRecord } from '../../src/domain/ingestion/coreference.js';

describe('API: HitL Curation Integration Tests (/api/v1/aliases)', () => {
  let db: DatabaseSync;
  let hitlService: HitLService;
  let app: Hono;

  beforeEach(() => {
    db = createDatabase(':memory:');
    hitlService = new HitLService(db);
    app = createApp({ db, hitlService });
  });

  describe('GET /api/v1/aliases/pending', () => {
    it('returns 200 with list of pending alias proposals', async () => {
      const proposal: HitLProposalRecord = {
        proposalId: 'prop-101',
        candidateName: 'Young Master Ye',
        targetEntityId: 'ent-ye-chen',
        targetCanonicalName: 'Ye Chen',
        confidenceScore: 0.82,
        isCanon: false,
        status: 'PENDING',
        domain: 'jianghu',
        context: 'Master Ye was seen near Mount Hua',
        createdAt: new Date().toISOString(),
      };
      hitlService.addProposal(proposal);

      const res = await app.request('/api/v1/aliases/pending');
      expect(res.status).toBe(200);

      const data = (await res.json()) as { pending: HitLProposalRecord[] };
      expect(Array.isArray(data.pending)).toBe(true);
      expect(data.pending).toHaveLength(1);
      expect(data.pending[0]).toMatchObject({
        proposalId: 'prop-101',
        candidateName: 'Young Master Ye',
        status: 'PENDING',
      });
    });
  });

  describe('POST /api/v1/aliases/:id/review with action: "approve"', () => {
    it('returns 200, updates DB entity attributes.aliases and lore_relationships pointers', async () => {
      // 1. Insert target LoreEntity into DB
      insertLoreEntity(db, {
        entityId: 'ent-ye-chen',
        canonicalName: 'Ye Chen',
        domain: 'jianghu',
        currentStatus: 'active',
        attributes: { level: 'Core Formation', aliases: ['Ye Chen Senior'] },
      });

      insertLoreEntity(db, {
        entityId: 'ent-han-li',
        canonicalName: 'Han Li',
        domain: 'jianghu',
        currentStatus: 'active',
        attributes: { level: 'Nascent Soul', aliases: [] },
      });

      // 2. Insert lore_relationship pointing to candidateName as source_entity_id
      // (Temporary foreign keys off to simulate dangling reference or candidate insertion)
      db.exec('PRAGMA foreign_keys = OFF;');
      db.prepare(`
        INSERT INTO lore_relationships (
          relationship_id, source_entity_id, target_entity_id, relationship_type, affinity_weight
        ) VALUES (?, ?, ?, ?, ?)
      `).run('rel-1', 'Young Master Ye', 'ent-han-li', 'FRIEND_OF', 0.95);
      db.exec('PRAGMA foreign_keys = ON;');

      // 3. Add proposal to hitlService
      const proposal: HitLProposalRecord = {
        proposalId: 'prop-202',
        candidateName: 'Young Master Ye',
        targetEntityId: 'ent-ye-chen',
        targetCanonicalName: 'Ye Chen',
        confidenceScore: 0.85,
        isCanon: false,
        status: 'PENDING',
        domain: 'jianghu',
        createdAt: new Date().toISOString(),
      };
      hitlService.addProposal(proposal);

      // 4. Request review with approve
      const res = await app.request('/api/v1/aliases/prop-202/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'approve',
          targetEntityId: 'ent-ye-chen',
        }),
      });

      expect(res.status).toBe(200);
      const data = (await res.json()) as { success: boolean; proposal: HitLProposalRecord };
      expect(data.success).toBe(true);
      expect(data.proposal.status).toBe('APPROVED');
      expect(data.proposal.isCanon).toBe(true);

      // Verify DB entity attributes.aliases updated
      const entityRow = db
        .prepare('SELECT attributes_json FROM lore_entities WHERE entity_id = ?')
        .get('ent-ye-chen') as { attributes_json: string };
      const parsedAttrs = JSON.parse(entityRow.attributes_json) as { aliases: string[] };
      expect(parsedAttrs.aliases).toContain('Young Master Ye');
      expect(parsedAttrs.aliases).toContain('Ye Chen Senior');

      // Verify DB lore_relationships source_entity_id was updated to finalTargetEntityId
      const relRow = db
        .prepare('SELECT source_entity_id FROM lore_relationships WHERE relationship_id = ?')
        .get('rel-1') as { source_entity_id: string };
      expect(relRow.source_entity_id).toBe('ent-ye-chen');
    });
  });

  describe('POST /api/v1/aliases/:id/review with action: "reject"', () => {
    it('returns 200, marks status REJECTED', async () => {
      const proposal: HitLProposalRecord = {
        proposalId: 'prop-303',
        candidateName: 'False Disciple',
        targetEntityId: 'ent-ye-chen',
        targetCanonicalName: 'Ye Chen',
        confidenceScore: 0.35,
        isCanon: false,
        status: 'PENDING',
        domain: 'jianghu',
        createdAt: new Date().toISOString(),
      };
      hitlService.addProposal(proposal);

      const res = await app.request('/api/v1/aliases/prop-303/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reject',
        }),
      });

      expect(res.status).toBe(200);
      const data = (await res.json()) as { success: boolean; proposal: HitLProposalRecord };
      expect(data.success).toBe(true);
      expect(data.proposal.status).toBe('REJECTED');
      expect(data.proposal.isCanon).toBe(false);

      // Ensure it is no longer returned in getPendingAliases()
      const pendingRes = await app.request('/api/v1/aliases/pending');
      const pendingData = (await pendingRes.json()) as { pending: HitLProposalRecord[] };
      expect(pendingData.pending.find((p) => p.proposalId === 'prop-303')).toBeUndefined();
    });
  });

  describe('Error handling', () => {
    it('returns 400 for invalid action body', async () => {
      const res = await app.request('/api/v1/aliases/prop-whatever/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'invalid_action',
        }),
      });

      expect(res.status).toBe(400);
      const data = (await res.json()) as { error: string };
      expect(data.error).toBe('BAD_REQUEST');
    });

    it('returns 404 for non-existent proposalId', async () => {
      const res = await app.request('/api/v1/aliases/non-existent-id/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'approve',
        }),
      });

      expect(res.status).toBe(404);
      const data = (await res.json()) as { error: string; message: string };
      expect(data.error).toBe('NOT_FOUND');
    });
  });
});
