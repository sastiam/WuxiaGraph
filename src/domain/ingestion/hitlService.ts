import type { DatabaseSync } from 'node:sqlite';
import type { HitLProposalRecord } from './coreference.js';

export interface HitLDatabase {
  prepare: DatabaseSync['prepare'];
}

export class HitLService {
  private proposals: Map<string, HitLProposalRecord> = new Map();
  private db?: DatabaseSync | HitLDatabase;

  constructor(db?: DatabaseSync | HitLDatabase) {
    this.db = db;
  }

  getPendingAliases(): HitLProposalRecord[] {
    const pending: HitLProposalRecord[] = [];
    for (const proposal of this.proposals.values()) {
      if (proposal.status === 'PENDING') {
        pending.push({ ...proposal });
      }
    }
    return pending;
  }

  addProposal(proposal: HitLProposalRecord): void {
    this.proposals.set(proposal.proposalId, { ...proposal });
  }

  reviewAlias(
    id: string,
    action: 'approve' | 'reject',
    targetEntityId?: string
  ): HitLProposalRecord | null {
    const proposal = this.proposals.get(id);
    if (!proposal) {
      return null;
    }

    if (action === 'approve') {
      proposal.status = 'APPROVED';
      proposal.isCanon = true;

      const finalTargetEntityId = targetEntityId || proposal.targetEntityId;

      if (this.db) {
        // Update target LoreEntity attributes.aliases in lore_entities
        try {
          const selectStmt = this.db.prepare(
            'SELECT attributes_json FROM lore_entities WHERE entity_id = ?'
          );
          const entityRow = selectStmt.get(finalTargetEntityId) as
            | { attributes_json: string }
            | undefined;

          if (entityRow) {
            let attributes: Record<string, unknown> = {};
            try {
              attributes = JSON.parse(entityRow.attributes_json) as Record<string, unknown>;
            } catch {
              attributes = {};
            }

            const currentAliases = Array.isArray(attributes.aliases)
              ? (attributes.aliases as unknown[])
              : [];

            if (!currentAliases.includes(proposal.candidateName)) {
              currentAliases.push(proposal.candidateName);
            }
            attributes.aliases = currentAliases;

            const updateEntityStmt = this.db.prepare(
              'UPDATE lore_entities SET attributes_json = ?, last_updated_timestamp = CURRENT_TIMESTAMP WHERE entity_id = ?'
            );
            updateEntityStmt.run(JSON.stringify(attributes), finalTargetEntityId);
          }

          // Also update any lore_relationships where source_entity_id or target_entity_id equals candidateName/proposalId to targetEntityId if provided
          if (finalTargetEntityId) {
            const updateSourceStmt = this.db.prepare(
              'UPDATE lore_relationships SET source_entity_id = ? WHERE source_entity_id = ? OR source_entity_id = ?'
            );
            updateSourceStmt.run(finalTargetEntityId, proposal.candidateName, id);

            const updateTargetStmt = this.db.prepare(
              'UPDATE lore_relationships SET target_entity_id = ? WHERE target_entity_id = ? OR target_entity_id = ?'
            );
            updateTargetStmt.run(finalTargetEntityId, proposal.candidateName, id);
          }
        } catch {
          // Keep database operations resilient
        }
      }
    } else {
      proposal.status = 'REJECTED';
      proposal.isCanon = false;
    }

    this.proposals.set(id, { ...proposal });
    return { ...proposal };
  }
}
