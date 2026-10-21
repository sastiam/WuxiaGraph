/**
 * Entidades y tipos del dominio puro para WuxiaGraph.
 * Regla de Arquitectura: Cero dependencias externas ni de infraestructura.
 */

export interface LoreEntity {
  entityId: string;
  domain: string;
  canonicalName: string;
  currentStatus: string;
  attributes: Record<string, unknown>;
  lastUpdatedTimestamp?: string;
}

export interface NarrativeFact {
  factId: string;
  entityId: string | null;
  factStatement: string;
  isCanon: boolean;
  chapterSource: string;
}

export type WipStatus = 'IN_LIMITS' | 'LOCKED_BY_WIP' | string;

export interface WipGovernanceLedger {
  weekStartDate: string;
  totalHoursLogged: number;
  maxBudgetHours: number;
  branchesOpenedCount: number;
  status: WipStatus;
}

export interface LoreRelationship {
  relationship_id: string;
  source_entity_id: string;
  target_entity_id: string;
  relationship_type: string;
  affinity_weight: number;
  description?: string | null;
  last_updated_timestamp?: string;
  valid_from_chapter?: number;
  valid_to_chapter?: number | null;
  recorded_at?: string;
  superseded_by?: number | string | null;
  relationshipId?: string;
  sourceEntityId?: string;
  targetEntityId?: string;
  relationshipType?: string;
  affinityWeight?: number;
  lastUpdatedTimestamp?: string;
  validFromChapter?: number;
  validToChapter?: number | null;
  recordedAt?: string;
  supersededBy?: number | string | null;
}

export interface GraphPath {
  path: string[];
  total_affinity: number;
  relationships: LoreRelationship[];
  totalAffinity?: number;
}
