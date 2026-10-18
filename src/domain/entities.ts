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
