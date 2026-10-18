import type { LoreEntity, NarrativeFact } from '../entities.js';

export interface DistillEntityInput {
  entityId: string;
  canonicalName: string;
  domain?: string;
  currentStatus?: string;
  attributes?: Record<string, unknown> | string;
}

export interface DistillFactInput {
  factId?: string;
  entityId?: string | null;
  factStatement: string;
  isCanon?: boolean;
  chapterSource?: string;
}

export interface DistillRequest {
  chapterSource: string;
  domain?: string;
  text?: string;
  entities?: DistillEntityInput[];
  facts?: DistillFactInput[];
}

export interface DistillResult {
  domain: string;
  chapterSource: string;
  entities: LoreEntity[];
  facts: NarrativeFact[];
}
