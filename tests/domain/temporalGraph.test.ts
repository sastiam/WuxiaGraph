import { describe, it, expect, beforeEach } from 'vitest';
import type { DatabaseSync } from 'node:sqlite';
import { createDatabase } from '../../src/infrastructure/database.js';
import { SqliteGraphRepository } from '../../src/infrastructure/repositories/graphRepository.ts';
import { GraphService } from '../../src/domain/graph/graphService.js';
import { createApiRouter } from '../../src/api/router.js';
import type { ContextInjectorService } from '../../src/domain/context/index.js';
import type { DreamingService } from '../../src/domain/dreaming/service.js';
import type { IWipGovernanceRepository } from '../../src/domain/governance/repository.js';

describe('Bi-Temporal Knowledge Graph Engine (WXG-046)', () => {
  let db: DatabaseSync;
  let repository: SqliteGraphRepository;
  let service: GraphService;

  beforeEach(() => {
    db = createDatabase(':memory:');
    
    // Seed entities for foreign key constraints
    db.prepare(`
      INSERT INTO lore_entities (entity_id, domain, canonical_name, current_status, attributes_json)
      VALUES
        ('entity_xiao_yan', 'character', 'Xiao Yan', 'ACTIVE', '{}'),
        ('entity_yun_lan_sect', 'sect', 'Yun Lan Sect', 'ACTIVE', '{}'),
        ('entity_xiao_xun_er', 'character', 'Xiao Xun Er', 'ACTIVE', '{}')
    `).run();

    repository = new SqliteGraphRepository(db);
    service = new GraphService(repository);
  });

  describe('1. Schema bi-temporal y persistencia en SQLite WAL', () => {
    it('debe almacenar y recuperar atributos bi-temporales correctamente', async () => {
      await repository.addRelationship({
        relationship_id: 'rel_temp_1',
        source_entity_id: 'entity_xiao_yan',
        target_entity_id: 'entity_yun_lan_sect',
        relationship_type: 'DISCIPLE',
        affinity_weight: 0.5,
        description: 'Discípulo inicial',
        valid_from_chapter: 1,
        valid_to_chapter: 30,
        superseded_by: 'rel_temp_2',
      });

      const rel = await repository.getRelationshipById('rel_temp_1');
      expect(rel).not.toBeNull();
      expect(rel?.valid_from_chapter).toBe(1);
      expect(rel?.valid_to_chapter).toBe(30);
      expect(rel?.superseded_by).toBe('rel_temp_2');
      expect(rel?.validFromChapter).toBe(1);
      expect(rel?.validToChapter).toBe(30);
      expect(rel?.supersededBy).toBe('rel_temp_2');
    });
  });

  describe('2. Mutación bi-temporal de relaciones entre capítulos', () => {
    it('debe actualizar valid_to_chapter en la versión previa al evolucionar la relación en el capítulo N', async () => {
      // Capítulo 1: Xiao Yan es aliado de Yun Lan Sect
      await service.addRelationship({
        relationship_id: 'rel_v1',
        source_entity_id: 'entity_xiao_yan',
        target_entity_id: 'entity_yun_lan_sect',
        relationship_type: 'ALLIED_SECT',
        affinity_weight: 0.8,
        valid_from_chapter: 1,
        valid_to_chapter: null,
      });

      // Capítulo 50: Ruptura -> se cierra rel_v1 a capítulo 50 y se inserta rel_v2 (ENEMY) desde capítulo 50
      await service.addRelationship({
        relationship_id: 'rel_v1',
        source_entity_id: 'entity_xiao_yan',
        target_entity_id: 'entity_yun_lan_sect',
        relationship_type: 'ALLIED_SECT',
        affinity_weight: 0.8,
        valid_from_chapter: 1,
        valid_to_chapter: 50,
        superseded_by: 'rel_v2',
      });

      await service.addRelationship({
        relationship_id: 'rel_v2',
        source_entity_id: 'entity_xiao_yan',
        target_entity_id: 'entity_yun_lan_sect',
        relationship_type: 'ENEMY_SECT',
        affinity_weight: -0.9,
        valid_from_chapter: 50,
        valid_to_chapter: null,
      });

      // En capítulo 25: rel_v1 debe estar activa (valid_from 1 <= 25, valid_to 50 > 25)
      const relsAt25 = await service.getGraphAsOfChapter(25);
      expect(relsAt25).toHaveLength(1);
      expect(relsAt25[0].relationship_id).toBe('rel_v1');
      expect(relsAt25[0].relationship_type).toBe('ALLIED_SECT');

      // En capítulo 50: rel_v2 debe estar activa (valid_from 50 <= 50, valid_to null)
      const relsAt50 = await service.getGraphAsOfChapter(50);
      expect(relsAt50).toHaveLength(1);
      expect(relsAt50[0].relationship_id).toBe('rel_v2');
      expect(relsAt50[0].relationship_type).toBe('ENEMY_SECT');
    });
  });

  describe('3. Consulta Subgrafo Congelado As-Of Capítulo (getGraphAsOfChapter)', () => {
    it('debe filtrar relaciones activas usando la condición valid_from <= C AND (valid_to IS NULL OR valid_to > C)', async () => {
      // Relación 1: activa de capitulo 1 a 100
      await service.addRelationship({
        relationship_id: 'r_constant',
        source_entity_id: 'entity_xiao_yan',
        target_entity_id: 'entity_xiao_xun_er',
        relationship_type: 'LOVER',
        affinity_weight: 1.0,
        valid_from_chapter: 1,
        valid_to_chapter: null,
      });

      // Relación 2: activa solo entre capitulo 10 y 40
      await service.addRelationship({
        relationship_id: 'r_temporary',
        source_entity_id: 'entity_xiao_yan',
        target_entity_id: 'entity_yun_lan_sect',
        relationship_type: 'GUEST',
        affinity_weight: 0.2,
        valid_from_chapter: 10,
        valid_to_chapter: 40,
      });

      // Relación 3: inicia en capitulo 60
      await service.addRelationship({
        relationship_id: 'r_future',
        source_entity_id: 'entity_xiao_yan',
        target_entity_id: 'entity_yun_lan_sect',
        relationship_type: 'DESTROYER',
        affinity_weight: -1.0,
        valid_from_chapter: 60,
        valid_to_chapter: null,
      });

      // As-Of 5: solo r_constant
      const asOf5 = await service.getRelationshipsAsOf(5);
      expect(asOf5.map((r) => r.relationship_id)).toEqual(['r_constant']);

      // As-Of 20: r_constant y r_temporary
      const asOf20 = await service.getRelationshipsAsOf(20);
      expect(asOf20.map((r) => r.relationship_id).sort()).toEqual(['r_constant', 'r_temporary']);

      // As-Of 40: r_constant solamente (ya que valid_to_chapter es 40 y no > 40)
      const asOf40 = await service.getRelationshipsAsOf(40);
      expect(asOf40.map((r) => r.relationship_id)).toEqual(['r_constant']);

      // As-Of 70: r_constant y r_future
      const asOf70 = await service.getRelationshipsAsOf(70);
      expect(asOf70.map((r) => r.relationship_id).sort()).toEqual(['r_constant', 'r_future']);
    });
  });

  describe('4. Endpoint REST GET /api/v1/graph/as-of/:chapterId', () => {
    it('debe responder HTTP 200 y las relaciones activas para un capítulo válido', async () => {
      await service.addRelationship({
        relationship_id: 'r_api_1',
        source_entity_id: 'entity_xiao_yan',
        target_entity_id: 'entity_xiao_xun_er',
        relationship_type: 'COMPANION',
        affinity_weight: 0.9,
        valid_from_chapter: 1,
        valid_to_chapter: null,
      });

      const mockDeps = {
        contextService: {} as ContextInjectorService,
        dreamingService: {} as DreamingService,
        govRepo: {} as IWipGovernanceRepository,
        graphService: service,
      };

      const app = createApiRouter(mockDeps);
      const res = await app.request('/api/v1/graph/as-of/10');

      expect(res.status).toBe(200);
      const data = await res.json() as Array<{ relationship_id: string }>;
      expect(Array.isArray(data)).toBe(true);
      expect(data).toHaveLength(1);
      expect(data[0].relationship_id).toBe('r_api_1');
    });

    it('debe responder HTTP 400 cuando chapterId no es un entero positivo válido', async () => {
      const mockDeps = {
        contextService: {} as ContextInjectorService,
        dreamingService: {} as DreamingService,
        govRepo: {} as IWipGovernanceRepository,
        graphService: service,
      };

      const app = createApiRouter(mockDeps);

      const resInvalid = await app.request('/api/v1/graph/as-of/abc');
      expect(resInvalid.status).toBe(400);
      const dataInvalid = await resInvalid.json() as { error: string };
      expect(dataInvalid.error).toBe('INVALID_REQUEST');

      const resNegative = await app.request('/api/v1/graph/as-of/-5');
      expect(resNegative.status).toBe(400);
    });
  });
});
