import { describe, it, expect, beforeEach } from 'vitest';
import {
  CoreferenceEngine,
  normalizeText,
  extractWuxiaTitleAndRoot,
  levenshteinSimilarity,
  jaccardSimilarity,
  type EntityAliasCandidate,
} from '../../src/domain/ingestion/coreference.js';
import type { LoreEntity } from '../../src/domain/entities.js';

describe('Task #41: Co-Reference Resolution Engine & Mapeo de Alias (WXG-028)', () => {
  let engine: CoreferenceEngine;

  const sampleEntities: LoreEntity[] = [
    {
      entityId: 'ent-ye-chen',
      domain: 'character',
      canonicalName: 'Ye Chen',
      currentStatus: 'ACTIVE',
      attributes: {
        aliases: ['Young Master Ye Chen', 'Sword Sovereign Ye'],
        sect: 'Heavenly Sword Sect',
      },
    },
    {
      entityId: 'ent-elder-ye',
      domain: 'character',
      canonicalName: 'Elder Ye',
      currentStatus: 'ACTIVE',
      attributes: {
        aliases: ['Ancestral Sword Immortal Ye', 'Old Master Ye'],
      },
    },
    {
      entityId: 'ent-heavenly-sword-sect',
      domain: 'sect',
      canonicalName: 'Heavenly Sword Sect',
      currentStatus: 'ACTIVE',
      attributes: {
        aliases: ['Heavenly Sword School', 'Sword Sect of Heavens'],
      },
    },
  ];

  beforeEach(() => {
    engine = new CoreferenceEngine();
  });

  describe('Utility Functions', () => {
    it('normalizeText debe limpiar espacios, minúsculas y tildes', () => {
      expect(normalizeText('  YOUNG MASTER YE!  ')).toBe('young master ye');
      expect(normalizeText('Inmortal de la Espada')).toBe('inmortal de la espada');
    });

    it('extractWuxiaTitleAndRoot debe extraer adecuadamente títulos wuxia y raíces de nombres', () => {
      expect(extractWuxiaTitleAndRoot('Young Master Ye')).toEqual({
        title: 'young master',
        root: 'ye',
      });
      expect(extractWuxiaTitleAndRoot('Elder Ye')).toEqual({
        title: 'elder',
        root: 'ye',
      });
      expect(extractWuxiaTitleAndRoot('Ancestral Sword Immortal Ye')).toEqual({
        title: 'ancestral sword immortal',
        root: 'ye',
      });
      expect(extractWuxiaTitleAndRoot('Heavenly Sword Sect')).toEqual({
        title: 'sect',
        root: 'heavenly sword',
      });
    });

    it('levenshteinSimilarity y jaccardSimilarity deben calcular métricas válidas entre 0.0 y 1.0', () => {
      expect(levenshteinSimilarity('Ye Chen', 'Ye Chen')).toBe(1.0);
      expect(levenshteinSimilarity('Ye Chen', 'Xiao Yan')).toBeLessThan(0.3);

      expect(jaccardSimilarity('Heavenly Sword Sect', 'Heavenly Sword School')).toBeGreaterThan(0.4);
    });
  });

  describe('Calculate Affinity (Certainty Score)', () => {
    it('debe otorgar 1.0 para coincidencia exacta con el nombre canónico', () => {
      const res = engine.calculateAffinity('Ye Chen', sampleEntities[0]);
      expect(res.score).toBe(1.0);
      expect(res.matchedAlias).toBe('Ye Chen');
    });

    it('debe otorgar >= 0.95 para coincidencia exacta con un alias registrado', () => {
      const res = engine.calculateAffinity('Sword Sovereign Ye', sampleEntities[0]);
      expect(res.score).toBeGreaterThanOrEqual(0.95);
      expect(res.matchedAlias).toBe('Sword Sovereign Ye');
    });

    it('debe otorgar alta certidumbre (>= 0.90) para "Young Master Ye Chen" -> "Ye Chen"', () => {
      const res = engine.calculateAffinity('Young Master Ye Chen', sampleEntities[0]);
      expect(res.score).toBeGreaterThanOrEqual(0.90);
    });

    it('debe otorgar certidumbre media (0.60 - 0.89) para desambiguación de cadena "Young Master Ye" -> "Elder Ye"', () => {
      const res = engine.calculateAffinity('Young Master Ye', sampleEntities[1]);
      expect(res.score).toBeGreaterThanOrEqual(0.60);
      expect(res.score).toBeLessThan(0.90);
    });

    it('debe otorgar certidumbre media para desambiguación "Elder Ye" -> "Ancestral Sword Immortal Ye"', () => {
      const res = engine.calculateAffinity('Elder Ye', sampleEntities[1]);
      expect(res.score).toBeGreaterThanOrEqual(0.60);
    });

    it('debe devolver score 0.0 en caso de incompatibilidad de dominio (ej. personaje vs secta)', () => {
      const res = engine.calculateAffinity('Ye Chen', sampleEntities[2], 'character');
      expect(res.score).toBe(0.0);
    });
  });

  describe('Disambiguation Single Candidate', () => {
    it('debe asignar mapeo canónico directo (is_canon = true) para certidumbre >= 0.90', () => {
      const candidate: EntityAliasCandidate = {
        rawName: 'Ye Chen',
        domain: 'character',
      };

      const result = engine.disambiguate(candidate, sampleEntities);
      expect(result.action).toBe('CANONICAL_MAPPING');
      expect(result.isCanon).toBe(true);
      expect(result.targetEntityId).toBe('ent-ye-chen');
      expect(result.targetCanonicalName).toBe('Ye Chen');
      expect(result.score).toBe(1.0);
    });

    it('debe generar propuesta HitL (is_canon = false) para certidumbre media (0.60 - 0.89)', () => {
      const candidate: EntityAliasCandidate = {
        rawName: 'Young Master Ye',
        domain: 'character',
      };

      const result = engine.disambiguate(candidate, [sampleEntities[1]]);
      expect(result.action).toBe('HITL_PROPOSAL');
      expect(result.isCanon).toBe(false);
      expect(result.targetEntityId).toBe('ent-elder-ye');
      expect(result.score).toBeGreaterThanOrEqual(0.60);
      expect(result.score).toBeLessThan(0.90);
    });

    it('debe rechazar/marcar como nueva entidad cuando la certidumbre es < 0.60', () => {
      const candidate: EntityAliasCandidate = {
        rawName: 'Xiao Yan el Emperador de Llama',
        domain: 'character',
      };

      const result = engine.disambiguate(candidate, sampleEntities);
      expect(result.isCanon).toBe(false);
      expect(result.action).toBe('NEW_ENTITY_REQUIRED');
      expect(result.targetEntityId).toBeNull();
      expect(result.score).toBeLessThan(0.60);
    });
  });

  describe('Batch Resolution & HitL Queue Generation', () => {
    it('debe procesar un lote de candidatos clasificándolos en mapeos canónicos, propuestas HitL y no mapeados', () => {
      const candidates: EntityAliasCandidate[] = [
        { rawName: 'Ye Chen', domain: 'character' }, // Canónico (>=0.90)
        { rawName: 'Young Master Ye', domain: 'character', context: 'Capítulo 12: La llegada del maestro' }, // HitL proposal (0.60-0.89)
        { rawName: 'Secta Desconocida de la Luna', domain: 'sect' }, // Unmapped (<0.60)
      ];

      const batchResult = engine.resolveBatch(candidates, sampleEntities);

      // Verify canonical mappings
      expect(batchResult.canonicalMappings.length).toBe(1);
      expect(batchResult.canonicalMappings[0].candidate.rawName).toBe('Ye Chen');
      expect(batchResult.canonicalMappings[0].targetEntityId).toBe('ent-ye-chen');
      expect(batchResult.canonicalMappings[0].isCanon).toBe(true);

      // Verify HitL proposal record
      expect(batchResult.hitlProposals.length).toBe(1);
      const proposal = batchResult.hitlProposals[0];
      expect(proposal.candidateName).toBe('Young Master Ye');
      expect(proposal.targetEntityId).toBe('ent-ye-chen');
      expect(proposal.targetCanonicalName).toBe('Ye Chen');
      expect(proposal.isCanon).toBe(false);
      expect(proposal.status).toBe('PENDING');
      expect(proposal.context).toBe('Capítulo 12: La llegada del maestro');
      expect(proposal.proposalId).toMatch(/^prop-/);

      // Verify unmapped candidates
      expect(batchResult.unmappedCandidates.length).toBe(1);
      expect(batchResult.unmappedCandidates[0].candidate.rawName).toBe('Secta Desconocida de la Luna');
      expect(batchResult.unmappedCandidates[0].action).toBe('NEW_ENTITY_REQUIRED');
    });

    it('debe respetar umbrales personalizados si se configuran en el constructor', () => {
      const customEngine = new CoreferenceEngine({
        thresholdHigh: 0.80,
        thresholdMedium: 0.50,
      });

      const candidate: EntityAliasCandidate = {
        rawName: 'Young Master Ye',
        domain: 'character',
      };

      const result = customEngine.disambiguate(candidate, [sampleEntities[1]]);
      expect(result.score).toBeGreaterThanOrEqual(0.50);
    });
  });
});
