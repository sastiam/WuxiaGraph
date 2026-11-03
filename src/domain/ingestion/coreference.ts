import { randomUUID } from 'node:crypto';
import type { LoreEntity } from '../entities.js';

export type CandidateDomain = 'character' | 'sect' | 'title' | 'location' | 'item' | string;

export interface EntityAliasCandidate {
  rawName: string;
  domain?: CandidateDomain;
  context?: string;
  attributes?: Record<string, unknown>;
}

export type CoreferenceAction =
  | 'CANONICAL_MAPPING'
  | 'HITL_PROPOSAL'
  | 'NEW_ENTITY_REQUIRED'
  | 'REJECTED';

export interface DisambiguationResult {
  candidate: EntityAliasCandidate;
  targetEntityId: string | null;
  targetCanonicalName: string | null;
  matchedAlias?: string | null;
  score: number;
  isCanon: boolean;
  action: CoreferenceAction;
  reason: string;
}

export interface HitLProposalRecord {
  proposalId: string;
  candidateName: string;
  targetEntityId: string;
  targetCanonicalName: string;
  confidenceScore: number;
  isCanon: boolean;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  domain: string;
  context?: string;
  createdAt: string;
}

export interface CoreferenceEngineOptions {
  thresholdHigh?: number;
  thresholdMedium?: number;
}

export interface BatchResolutionResult {
  canonicalMappings: Array<{
    candidate: EntityAliasCandidate;
    targetEntityId: string;
    targetCanonicalName: string;
    score: number;
    isCanon: true;
  }>;
  hitlProposals: HitLProposalRecord[];
  unmappedCandidates: Array<{
    candidate: EntityAliasCandidate;
    action: CoreferenceAction;
    score: number;
    reason: string;
  }>;
  results: DisambiguationResult[];
}

const WUXIA_HONORIFICS = [
  'ancestral sword immortal',
  'inmortal de la espada',
  'sword immortal',
  'young master',
  'joven maestro',
  'great elder',
  'gran anciano',
  'sect master',
  'maestro de secta',
  'taishang elder',
  'high elder',
  'daoist master',
  'supreme elder',
  'sword sovereign',
  'soberano de la espada',
  'elder',
  'anciano',
  'master',
  'maestro',
  'immortal',
  'inmortal',
  'patriarch',
  'patriarca',
  'sovereign',
  'soberano',
  'venerable',
  'emperor',
  'emperador',
  'daoist',
  'daoista',
  'fairy',
  'hada',
  'senior',
  'junior',
  'lord',
  'senor',
  'king',
  'rey',
  '少主',
  '长老',
  '老祖',
  '宗主',
  '掌门',
  '仙尊',
  '仙帝',
  '仙人',
  '公子',
  '太上长老',
  '圣女',
  '神女',
];

const SECT_SUFFIXES = [
  'sect',
  'school',
  'palace',
  'pavilion',
  'hall',
  'clan',
  'house',
  'secta',
  'escuela',
  'palacio',
  'pabellon',
  'pabellón',
  'clan',
  '宗',
  '门',
  '派',
  '宫',
  '阁',
];

export function normalizeText(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s\u4e00-\u9fa5]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function levenshteinDistance(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

export function levenshteinSimilarity(a: string, b: string): number {
  const normA = normalizeText(a);
  const normB = normalizeText(b);
  if (normA === normB) return 1.0;
  const maxLen = Math.max(normA.length, normB.length);
  if (maxLen === 0) return 1.0;
  const distance = levenshteinDistance(normA, normB);
  return Math.max(0, 1.0 - distance / maxLen);
}

export function jaccardSimilarity(a: string, b: string): number {
  const wordsA = new Set(normalizeText(a).split(' ').filter(Boolean));
  const wordsB = new Set(normalizeText(b).split(' ').filter(Boolean));
  if (wordsA.size === 0 && wordsB.size === 0) return 1.0;
  if (wordsA.size === 0 || wordsB.size === 0) return 0.0;

  let intersection = 0;
  for (const w of wordsA) {
    if (wordsB.has(w)) intersection++;
  }

  const union = new Set([...wordsA, ...wordsB]).size;
  return intersection / union;
}

export function extractWuxiaTitleAndRoot(text: string): { title: string; root: string } {
  const norm = normalizeText(text);
  if (!norm) return { title: '', root: '' };

  for (const honorific of WUXIA_HONORIFICS) {
    const normH = normalizeText(honorific);
    if (norm === normH) {
      return { title: normH, root: normH };
    }
    if (norm.startsWith(normH + ' ')) {
      const root = norm.slice(normH.length + 1).trim();
      return { title: normH, root };
    }
    if (norm.endsWith(' ' + normH)) {
      const root = norm.slice(0, norm.length - normH.length - 1).trim();
      return { title: normH, root };
    }
  }

  for (const suffix of SECT_SUFFIXES) {
    const normS = normalizeText(suffix);
    if (norm.endsWith(' ' + normS)) {
      const root = norm.slice(0, norm.length - normS.length - 1).trim();
      return { title: normS, root };
    }
  }

  return { title: '', root: norm };
}

export class CoreferenceEngine {
  private thresholdHigh: number;
  private thresholdMedium: number;

  constructor(options?: CoreferenceEngineOptions) {
    this.thresholdHigh = options?.thresholdHigh ?? 0.90;
    this.thresholdMedium = options?.thresholdMedium ?? 0.60;
  }

  /**
   * Calculates affinity score (0.0 to 1.0) between candidate name/candidate and entity.
   */
  public calculateAffinity(
    candidateName: string,
    entity: LoreEntity,
    candidateDomain?: string
  ): { score: number; matchedAlias?: string } {
    const normCand = normalizeText(candidateName);
    const normCanon = normalizeText(entity.canonicalName);

    if (!normCand || !normCanon) {
      return { score: 0.0 };
    }

    // Domain mismatch check
    if (candidateDomain && entity.domain) {
      const candD = normalizeText(candidateDomain);
      const entD = normalizeText(entity.domain);
      if (
        candD !== entD &&
        !((candD === 'character' && entD === 'title') || (candD === 'title' && entD === 'character'))
      ) {
        return { score: 0.0 };
      }
    }

    // 1. Direct Canonical Name Match
    if (normCand === normCanon) {
      return { score: 1.0, matchedAlias: entity.canonicalName };
    }

    // 2. Exact match against entity aliases
    const aliases = (Array.isArray(entity.attributes?.aliases)
      ? entity.attributes.aliases
      : []) as string[];

    for (const alias of aliases) {
      const normAlias = normalizeText(alias);
      if (normCand === normAlias) {
        return { score: 0.98, matchedAlias: alias };
      }
    }

    // 3. Wuxia Title & Root Extraction desambiguation
    const candParsed = extractWuxiaTitleAndRoot(normCand);
    const entParsed = extractWuxiaTitleAndRoot(normCanon);

    // Also check aliases for title/root match
    let bestAliasParsedScore = 0;
    let matchedAliasName: string | undefined = undefined;

    for (const alias of aliases) {
      const normAlias = normalizeText(alias);
      const aliasParsed = extractWuxiaTitleAndRoot(normAlias);
      if (candParsed.root && aliasParsed.root && candParsed.root === aliasParsed.root) {
        const score = candParsed.root.length > 3 ? 0.93 : 0.82;
        if (score > bestAliasParsedScore) {
          bestAliasParsedScore = score;
          matchedAliasName = alias;
        }
      }
    }

    if (bestAliasParsedScore > 0) {
      return { score: bestAliasParsedScore, matchedAlias: matchedAliasName };
    }

    // Root equality analysis
    if (candParsed.root && entParsed.root) {
      if (candParsed.root === entParsed.root) {
        // Multi-word root match (e.g., "ye chen" in "young master ye chen" vs "ye chen")
        if (candParsed.root.includes(' ') || candParsed.root.length > 4) {
          return { score: 0.92, matchedAlias: entity.canonicalName };
        }
        // Single word root match with differing title/honorific (e.g. "Young Master Ye" vs "Elder Ye" vs "Ancestral Sword Immortal Ye")
        // Title transition / evolution: returns medium certainty score (0.75 - 0.82)
        return { score: 0.78, matchedAlias: entity.canonicalName };
      }

      // Root substring match (e.g., "sword sect" vs "heavenly sword sect")
      if (candParsed.root.includes(entParsed.root) || entParsed.root.includes(candParsed.root)) {
        const jaccard = jaccardSimilarity(candParsed.root, entParsed.root);
        if (jaccard >= 0.5) {
          return { score: Math.min(0.85, 0.65 + jaccard * 0.25), matchedAlias: entity.canonicalName };
        }
      }
    }

    // 4. Fuzzy & Token Similarity fallback
    const jaccard = jaccardSimilarity(normCand, normCanon);
    const levSim = levenshteinSimilarity(normCand, normCanon);
    const compositeScore = jaccard * 0.6 + levSim * 0.4;

    const finalScore = Math.round(compositeScore * 100) / 100;

    return { score: finalScore };
  }

  /**
   * Disambiguates a candidate against a list of known canonical entities.
   */
  public disambiguate(
    candidate: EntityAliasCandidate,
    knownEntities: LoreEntity[]
  ): DisambiguationResult {
    if (!candidate.rawName || knownEntities.length === 0) {
      return {
        candidate,
        targetEntityId: null,
        targetCanonicalName: null,
        score: 0.0,
        isCanon: false,
        action: 'NEW_ENTITY_REQUIRED',
        reason: 'Sin entidad candidata válida o catálogo de entidades conocido vacío',
      };
    }

    let bestScore = 0.0;
    let bestEntity: LoreEntity | null = null;
    let bestMatchedAlias: string | undefined = undefined;

    for (const entity of knownEntities) {
      const { score, matchedAlias } = this.calculateAffinity(
        candidate.rawName,
        entity,
        candidate.domain
      );

      if (score > bestScore) {
        bestScore = score;
        bestEntity = entity;
        bestMatchedAlias = matchedAlias;
      }
    }

    if (!bestEntity || bestScore < this.thresholdMedium) {
      return {
        candidate,
        targetEntityId: null,
        targetCanonicalName: null,
        score: bestScore,
        isCanon: false,
        action: bestScore > 0 ? 'NEW_ENTITY_REQUIRED' : 'REJECTED',
        reason: `Puntaje de afinidad (${bestScore.toFixed(2)}) inferior al umbral mínimo (${this.thresholdMedium.toFixed(2)})`,
      };
    }

    const isCanon = bestScore >= this.thresholdHigh;
    const action: CoreferenceAction = isCanon ? 'CANONICAL_MAPPING' : 'HITL_PROPOSAL';
    const reason = isCanon
      ? `Alta certidumbre (${bestScore.toFixed(2)} >= ${this.thresholdHigh.toFixed(2)}): mapeo canónico directo (is_canon = 1)`
      : `Certidumbre media (${bestScore.toFixed(2)} en rango [${this.thresholdMedium.toFixed(2)}, ${this.thresholdHigh.toFixed(2)})): propuesta enviada a cola HitL (is_canon = 0)`;

    return {
      candidate,
      targetEntityId: bestEntity.entityId,
      targetCanonicalName: bestEntity.canonicalName,
      matchedAlias: bestMatchedAlias,
      score: bestScore,
      isCanon,
      action,
      reason,
    };
  }

  /**
   * Resolves a batch of candidate entity mentions, separating direct canonical mappings,
   * draft HitL proposals, and unmapped/new candidates.
   */
  public resolveBatch(
    candidates: EntityAliasCandidate[],
    knownEntities: LoreEntity[]
  ): BatchResolutionResult {
    const canonicalMappings: BatchResolutionResult['canonicalMappings'] = [];
    const hitlProposals: HitLProposalRecord[] = [];
    const unmappedCandidates: BatchResolutionResult['unmappedCandidates'] = [];
    const results: DisambiguationResult[] = [];

    for (const candidate of candidates) {
      const result = this.disambiguate(candidate, knownEntities);
      results.push(result);

      if (result.action === 'CANONICAL_MAPPING' && result.targetEntityId && result.targetCanonicalName) {
        canonicalMappings.push({
          candidate,
          targetEntityId: result.targetEntityId,
          targetCanonicalName: result.targetCanonicalName,
          score: result.score,
          isCanon: true,
        });
      } else if (result.action === 'HITL_PROPOSAL' && result.targetEntityId && result.targetCanonicalName) {
        hitlProposals.push({
          proposalId: `prop-${randomUUID()}`,
          candidateName: candidate.rawName,
          targetEntityId: result.targetEntityId,
          targetCanonicalName: result.targetCanonicalName,
          confidenceScore: result.score,
          isCanon: false,
          status: 'PENDING',
          domain: candidate.domain ?? 'character',
          context: candidate.context,
          createdAt: new Date().toISOString(),
        });
      } else {
        unmappedCandidates.push({
          candidate,
          action: result.action,
          score: result.score,
          reason: result.reason,
        });
      }
    }

    return {
      canonicalMappings,
      hitlProposals,
      unmappedCandidates,
      results,
    };
  }
}
