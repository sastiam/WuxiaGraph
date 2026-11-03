import type { LoreRelationship, GraphPath } from '../entities.js';
import type { IGraphRepository } from './repository.js';

export interface FindPathOptions {
  algorithm?: 'bfs' | 'dfs';
  directed?: boolean;
  maxDepth?: number;
}

interface GraphEdge {
  neighbor: string;
  relationship: LoreRelationship;
}

interface SearchState {
  currentId: string;
  path: string[];
  relationships: LoreRelationship[];
  totalAffinity: number;
}

/**
 * Servicio de Dominio para el Motor de Grafos y Consultas Relacionales (WXG-020).
 * Implementa algoritmos puros de recorrido (BFS/DFS), prevención de bucles en grafos cíclicos,
 * cálculo de afinidad acumulada y matriz de alianzas.
 * Regla de Arquitectura: CERO dependencias externas ni de infraestructura.
 */
export class GraphService {
  constructor(private readonly graphRepo: IGraphRepository) {}

  /**
   * Obtiene relaciones del grafo, opcionalmente filtradas por ID de entidad y profundidad (depth).
   */
  async getRelationships(entityId?: string, depth?: number): Promise<LoreRelationship[]> {
    if (!entityId) {
      return this.graphRepo.getAllRelationships();
    }
    const directRels = await this.graphRepo.getRelationshipsByEntity(entityId);
    if (!depth || depth <= 1) {
      return directRels;
    }

    const allRels = await this.graphRepo.getAllRelationships();
    const visitedEntities = new Set<string>([entityId]);
    const includedRelIds = new Set<string>();

    let currentLevelEntities = new Set<string>([entityId]);

    for (let currentDepth = 1; currentDepth <= depth; currentDepth++) {
      const nextLevelEntities = new Set<string>();
      for (const rel of allRels) {
        const src = rel.source_entity_id ?? rel.sourceEntityId;
        const tgt = rel.target_entity_id ?? rel.targetEntityId;
        if (!src || !tgt) continue;

        if (currentLevelEntities.has(src) || currentLevelEntities.has(tgt)) {
          const relId = rel.relationship_id ?? rel.relationshipId ?? `${src}-${tgt}`;
          includedRelIds.add(relId);
          if (!visitedEntities.has(src)) {
            nextLevelEntities.add(src);
            visitedEntities.add(src);
          }
          if (!visitedEntities.has(tgt)) {
            nextLevelEntities.add(tgt);
            visitedEntities.add(tgt);
          }
        }
      }
      currentLevelEntities = nextLevelEntities;
      if (currentLevelEntities.size === 0) break;
    }

    return allRels.filter((r) => {
      const src = r.source_entity_id ?? r.sourceEntityId;
      const tgt = r.target_entity_id ?? r.targetEntityId;
      const relId = r.relationship_id ?? r.relationshipId ?? `${src}-${tgt}`;
      return includedRelIds.has(relId);
    });
  }

  /**
   * Obtiene las relaciones activas a la altura de un capítulo determinado (filtro bi-temporal).
   */
  async getRelationshipsAsOf(chapterId: number): Promise<LoreRelationship[]> {
    return this.graphRepo.getRelationshipsAsOf(chapterId);
  }

  /**
   * Obtiene el estado del grafo en un capítulo determinado (alias/convenio de WXG-046).
   */
  async getGraphAsOfChapter(chapterId: number): Promise<LoreRelationship[]> {
    return this.getRelationshipsAsOf(chapterId);
  }

  /**
   * Registra o actualiza una relación en el grafo.
   */
  async addRelationship(relationship: LoreRelationship): Promise<void> {
    await this.graphRepo.addRelationship(relationship);
  }

  /**
   * Elimina una relación por su identificador.
   */
  async deleteRelationship(relationshipId: string): Promise<void> {
    await this.graphRepo.deleteRelationship(relationshipId);
  }

  /**
   * Encuentra el camino relacional entre dos entidades utilizando BFS o DFS.
   */
  async findPath(
    sourceEntityId: string,
    targetEntityId: string,
    options?: FindPathOptions
  ): Promise<GraphPath> {
    const algorithm = options?.algorithm ?? 'bfs';
    if (algorithm === 'dfs') {
      return this.findPathDfs(sourceEntityId, targetEntityId, options);
    }
    return this.findPathBfs(sourceEntityId, targetEntityId, options);
  }

  /**
   * Encuentra la ruta más corta (menor número de saltos) utilizando Breadth-First Search (BFS).
   */
  async findPathBfs(
    sourceEntityId: string,
    targetEntityId: string,
    options?: Omit<FindPathOptions, 'algorithm'>
  ): Promise<GraphPath> {
    if (!sourceEntityId || !targetEntityId) {
      return { path: [], total_affinity: 0, relationships: [] };
    }

    if (sourceEntityId === targetEntityId) {
      return {
        path: [sourceEntityId],
        total_affinity: 0,
        relationships: [],
        totalAffinity: 0,
      };
    }

    const directed = options?.directed ?? false;
    const maxDepth = options?.maxDepth ?? Infinity;
    const allRelationships = await this.graphRepo.getAllRelationships();
    const adj = this.buildAdjacencyList(allRelationships, directed);

    const queue: SearchState[] = [
      {
        currentId: sourceEntityId,
        path: [sourceEntityId],
        relationships: [],
        totalAffinity: 0,
      },
    ];

    const visited = new Set<string>([sourceEntityId]);

    while (queue.length > 0) {
      const current = queue.shift()!;

      if (current.path.length - 1 >= maxDepth) {
        continue;
      }

      const neighbors = adj.get(current.currentId) ?? [];
      for (const edge of neighbors) {
        if (edge.neighbor === targetEntityId) {
          const rawAffinity = current.totalAffinity + (edge.relationship.affinity_weight ?? 0);
          const total_affinity = Math.round(rawAffinity * 10000) / 10000;
          const relationships = [...current.relationships, edge.relationship];
          return {
            path: [...current.path, edge.neighbor],
            total_affinity,
            relationships,
            totalAffinity: total_affinity,
          };
        }

        if (!visited.has(edge.neighbor)) {
          visited.add(edge.neighbor);
          const rawAffinity = current.totalAffinity + (edge.relationship.affinity_weight ?? 0);
          queue.push({
            currentId: edge.neighbor,
            path: [...current.path, edge.neighbor],
            relationships: [...current.relationships, edge.relationship],
            totalAffinity: rawAffinity,
          });
        }
      }
    }

    return { path: [], total_affinity: 0, relationships: [], totalAffinity: 0 };
  }

  /**
   * Encuentra una ruta relacional utilizando Depth-First Search (DFS) con prevención de ciclos.
   */
  async findPathDfs(
    sourceEntityId: string,
    targetEntityId: string,
    options?: Omit<FindPathOptions, 'algorithm'>
  ): Promise<GraphPath> {
    if (!sourceEntityId || !targetEntityId) {
      return { path: [], total_affinity: 0, relationships: [] };
    }

    if (sourceEntityId === targetEntityId) {
      return {
        path: [sourceEntityId],
        total_affinity: 0,
        relationships: [],
        totalAffinity: 0,
      };
    }

    const directed = options?.directed ?? false;
    const maxDepth = options?.maxDepth ?? Infinity;
    const allRelationships = await this.graphRepo.getAllRelationships();
    const adj = this.buildAdjacencyList(allRelationships, directed);

    const stack: SearchState[] = [
      {
        currentId: sourceEntityId,
        path: [sourceEntityId],
        relationships: [],
        totalAffinity: 0,
      },
    ];

    const visitedInPath = new Set<string>();

    while (stack.length > 0) {
      const current = stack.pop()!;

      if (current.currentId === targetEntityId) {
        const total_affinity = Math.round(current.totalAffinity * 10000) / 10000;
        return {
          path: current.path,
          total_affinity,
          relationships: current.relationships,
          totalAffinity: total_affinity,
        };
      }

      if (current.path.length - 1 >= maxDepth) {
        continue;
      }

      visitedInPath.add(current.currentId);
      const neighbors = adj.get(current.currentId) ?? [];

      for (let i = neighbors.length - 1; i >= 0; i--) {
        const edge = neighbors[i]!;
        // Prevención de ciclos: evitar volver a visitar nodos ya presentes en la trayectoria actual
        if (!current.path.includes(edge.neighbor)) {
          const rawAffinity = current.totalAffinity + (edge.relationship.affinity_weight ?? 0);
          stack.push({
            currentId: edge.neighbor,
            path: [...current.path, edge.neighbor],
            relationships: [...current.relationships, edge.relationship],
            totalAffinity: rawAffinity,
          });
        }
      }
    }

    return { path: [], total_affinity: 0, relationships: [], totalAffinity: 0 };
  }

  /**
   * Alias de findPathBfs para ruta más corta.
   */
  async findShortestPath(
    sourceEntityId: string,
    targetEntityId: string,
    options?: Omit<FindPathOptions, 'algorithm'>
  ): Promise<GraphPath> {
    return this.findPathBfs(sourceEntityId, targetEntityId, options);
  }

  /**
   * Calcula la afinidad acumulada entre dos entidades de lore.
   */
  async calculateAffinity(
    sourceEntityId: string,
    targetEntityId: string,
    options?: FindPathOptions
  ): Promise<number> {
    const result = await this.findPath(sourceEntityId, targetEntityId, options);
    return result.total_affinity;
  }

  /**
   * Genera una matriz de afinidad y alianzas para una lista de entidades dadas.
   * Optimizado: Carga relaciones y lista de adyacencia 1 vez y ejecuta BFS por nodo fuente.
   */
  async getAffinityMatrix(entityIds: string[]): Promise<Record<string, Record<string, number>>> {
    const matrix: Record<string, Record<string, number>> = {};
    const allRelationships = await this.graphRepo.getAllRelationships();
    const adj = this.buildAdjacencyList(allRelationships, false);

    for (const idA of entityIds) {
      matrix[idA] = {};
      matrix[idA][idA] = 1.0;

      // Single-source BFS desde idA para encontrar afinidades de ruta más corta
      const queue: { currentId: string; totalAffinity: number }[] = [{ currentId: idA, totalAffinity: 0 }];
      const visited = new Set<string>([idA]);
      const affinities = new Map<string, number>();

      while (queue.length > 0) {
        const current = queue.shift()!;
        const neighbors = adj.get(current.currentId) ?? [];

        for (const edge of neighbors) {
          if (!visited.has(edge.neighbor)) {
            visited.add(edge.neighbor);
            const rawAffinity = current.totalAffinity + (edge.relationship.affinity_weight ?? 0);
            const roundedAffinity = Math.round(rawAffinity * 10000) / 10000;
            affinities.set(edge.neighbor, roundedAffinity);
            queue.push({ currentId: edge.neighbor, totalAffinity: rawAffinity });
          }
        }
      }

      for (const idB of entityIds) {
        if (idA !== idB) {
          matrix[idA][idB] = affinities.get(idB) ?? 0;
        }
      }
    }

    return matrix;
  }

  /**
   * Construye el mapa de adyacencia a partir del conjunto de relaciones.
   */
  private buildAdjacencyList(
    relationships: LoreRelationship[],
    directed: boolean
  ): Map<string, GraphEdge[]> {
    const adj = new Map<string, GraphEdge[]>();

    for (const rel of relationships) {
      const source = rel.source_entity_id ?? rel.sourceEntityId;
      const target = rel.target_entity_id ?? rel.targetEntityId;

      if (!source || !target) {
        continue;
      }

      if (!adj.has(source)) {
        adj.set(source, []);
      }
      adj.get(source)!.push({ neighbor: target, relationship: rel });

      if (!directed) {
        if (!adj.has(target)) {
          adj.set(target, []);
        }
        adj.get(target)!.push({ neighbor: source, relationship: rel });
      }
    }

    return adj;
  }
}
