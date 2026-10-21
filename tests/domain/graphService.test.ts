import { describe, it, expect, beforeEach } from 'vitest';
import type { LoreRelationship } from '../../src/domain/entities.js';
import type { IGraphRepository } from '../../src/domain/graph/repository.js';
import { GraphService } from '../../src/domain/graph/graphService.js';

class InMemoryGraphRepository implements IGraphRepository {
  private relationships: Map<string, LoreRelationship> = new Map();

  async addRelationship(relationship: LoreRelationship): Promise<void> {
    const id = relationship.relationship_id ?? relationship.relationshipId!;
    this.relationships.set(id, { ...relationship });
  }

  async getRelationshipsByEntity(entityId: string): Promise<LoreRelationship[]> {
    return Array.from(this.relationships.values()).filter(
      (r) =>
        (r.source_entity_id ?? r.sourceEntityId) === entityId ||
        (r.target_entity_id ?? r.targetEntityId) === entityId
    );
  }

  async getAllRelationships(): Promise<LoreRelationship[]> {
    return Array.from(this.relationships.values());
  }

  async deleteRelationship(relationshipId: string): Promise<void> {
    this.relationships.delete(relationshipId);
  }

  async getRelationshipById(relationshipId: string): Promise<LoreRelationship | null> {
    return this.relationships.get(relationshipId) ?? null;
  }
}

describe('GraphService Domain Tests (WXG-020)', () => {
  let repo: InMemoryGraphRepository;
  let service: GraphService;

  beforeEach(() => {
    repo = new InMemoryGraphRepository();
    service = new GraphService(repo);
  });

  describe('1. Pathfinding con BFS (Ruta más corta)', () => {
    it('debe encontrar la ruta más corta en saltos y acumular la afinidad correctamente', async () => {
      // Grafo: A -> B (0.5), B -> C (0.3), A -> D (0.2), D -> E (0.2), E -> C (0.4)
      await repo.addRelationship({
        relationship_id: 'r_ab',
        source_entity_id: 'node_a',
        target_entity_id: 'node_b',
        relationship_type: 'ALLY',
        affinity_weight: 0.5,
      });

      await repo.addRelationship({
        relationship_id: 'r_bc',
        source_entity_id: 'node_b',
        target_entity_id: 'node_c',
        relationship_type: 'ALLY',
        affinity_weight: 0.3,
      });

      await repo.addRelationship({
        relationship_id: 'r_ad',
        source_entity_id: 'node_a',
        target_entity_id: 'node_d',
        relationship_type: 'ACQUAINTANCE',
        affinity_weight: 0.2,
      });

      await repo.addRelationship({
        relationship_id: 'r_de',
        source_entity_id: 'node_d',
        target_entity_id: 'node_e',
        relationship_type: 'ACQUAINTANCE',
        affinity_weight: 0.2,
      });

      await repo.addRelationship({
        relationship_id: 'r_ec',
        source_entity_id: 'node_e',
        target_entity_id: 'node_c',
        relationship_type: 'ALLY',
        affinity_weight: 0.4,
      });

      const result = await service.findShortestPath('node_a', 'node_c');

      expect(result.path).toEqual(['node_a', 'node_b', 'node_c']);
      expect(result.total_affinity).toBe(0.8);
      expect(result.relationships).toHaveLength(2);
      expect(result.relationships[0].relationship_id).toBe('r_ab');
      expect(result.relationships[1].relationship_id).toBe('r_bc');
    });

    it('debe retornar ruta vacía y afinidad 0 cuando los nodos no están conectados', async () => {
      await repo.addRelationship({
        relationship_id: 'r_ab',
        source_entity_id: 'node_a',
        target_entity_id: 'node_b',
        relationship_type: 'ALLY',
        affinity_weight: 0.5,
      });

      const result = await service.findPathBfs('node_a', 'isolated_node_z');

      expect(result.path).toEqual([]);
      expect(result.total_affinity).toBe(0);
      expect(result.relationships).toEqual([]);
    });

    it('debe manejar el caso donde el origen y el destino son la misma entidad', async () => {
      const result = await service.findPath('node_a', 'node_a');

      expect(result.path).toEqual(['node_a']);
      expect(result.total_affinity).toBe(0);
      expect(result.relationships).toEqual([]);
    });
  });

  describe('2. Prevención de Bucles y Manejo de Grafos Cíclicos', () => {
    it('debe evitar bucles infinitos en un ciclo cerrado (A -> B -> C -> A)', async () => {
      await repo.addRelationship({
        relationship_id: 'cycle_ab',
        source_entity_id: 'cycle_a',
        target_entity_id: 'cycle_b',
        relationship_type: 'RIVAL',
        affinity_weight: -0.2,
      });

      await repo.addRelationship({
        relationship_id: 'cycle_bc',
        source_entity_id: 'cycle_b',
        target_entity_id: 'cycle_c',
        relationship_type: 'RIVAL',
        affinity_weight: -0.3,
      });

      await repo.addRelationship({
        relationship_id: 'cycle_ca',
        source_entity_id: 'cycle_c',
        target_entity_id: 'cycle_a',
        relationship_type: 'RIVAL',
        affinity_weight: -0.1,
      });

      await repo.addRelationship({
        relationship_id: 'cycle_cd',
        source_entity_id: 'cycle_c',
        target_entity_id: 'cycle_d',
        relationship_type: 'DISCIPLE',
        affinity_weight: 0.7,
      });

      // BFS a través del ciclo hacia target
      const bfsResult = await service.findPathBfs('cycle_a', 'cycle_d');
      expect(bfsResult.path).toEqual(['cycle_a', 'cycle_c', 'cycle_d']); // Si es no dirigido, a -> c es 1 salto
      expect(bfsResult.total_affinity).toBe(0.6); // (-0.1) + 0.7 = 0.6

      // DFS a través del ciclo sin entrar en recursión infinita
      const dfsResult = await service.findPathDfs('cycle_a', 'cycle_d');
      expect(dfsResult.path.length).toBeGreaterThan(0);
      expect(dfsResult.path[0]).toBe('cycle_a');
      expect(dfsResult.path[dfsResult.path.length - 1]).toBe('cycle_d');
    });

    it('debe respetar la dirección cuando directed = true', async () => {
      await repo.addRelationship({
        relationship_id: 'dir_ab',
        source_entity_id: 'master',
        target_entity_id: 'disciple',
        relationship_type: 'MASTER_DISCIPLE',
        affinity_weight: 0.8,
      });

      // Siguiendo la dirección: master -> disciple
      const fwd = await service.findPath('master', 'disciple', { directed: true });
      expect(fwd.path).toEqual(['master', 'disciple']);

      // En contra de la dirección con directed = true no debe encontrar camino
      const bwd = await service.findPath('disciple', 'master', { directed: true });
      expect(bwd.path).toEqual([]);
    });
  });

  describe('3. Cálculo de Afinidad y Matriz de Alianzas', () => {
    it('debe calcular la afinidad acumulada entre dos entidades', async () => {
      await repo.addRelationship({
        relationship_id: 'rel_sect_1',
        source_entity_id: 'sect_a',
        target_entity_id: 'sect_b',
        relationship_type: 'ALLIANCE',
        affinity_weight: 0.75,
      });

      await repo.addRelationship({
        relationship_id: 'rel_sect_2',
        source_entity_id: 'sect_b',
        target_entity_id: 'sect_c',
        relationship_type: 'TRADE_PACT',
        affinity_weight: 0.25,
      });

      const affinity = await service.calculateAffinity('sect_a', 'sect_c');
      expect(affinity).toBe(1.0);
    });

    it('debe generar una matriz de alianzas para múltiples entidades', async () => {
      await repo.addRelationship({
        relationship_id: 'matrix_ab',
        source_entity_id: 'char_1',
        target_entity_id: 'char_2',
        relationship_type: 'FRIENDS',
        affinity_weight: 0.6,
      });

      const matrix = await service.getAffinityMatrix(['char_1', 'char_2', 'char_3']);

      expect(matrix['char_1']['char_1']).toBe(1.0);
      expect(matrix['char_1']['char_2']).toBe(0.6);
      expect(matrix['char_2']['char_1']).toBe(0.6);
      expect(matrix['char_1']['char_3']).toBe(0);
      expect(matrix['char_3']['char_3']).toBe(1.0);
    });
  });
});
