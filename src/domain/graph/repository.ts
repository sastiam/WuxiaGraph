import type { LoreRelationship } from '../entities.js';

/**
 * Puerto de repositorio para el motor de grafos relacionales (WXG-019 / WXG-020).
 * Sigue la regla de Clean Architecture: Cero dependencias externas en la capa de dominio.
 */
export interface IGraphRepository {
  addRelationship(relationship: LoreRelationship): Promise<void>;
  getRelationshipsByEntity(entityId: string): Promise<LoreRelationship[]>;
  getAllRelationships(): Promise<LoreRelationship[]>;
  deleteRelationship(relationshipId: string): Promise<void>;
  getRelationshipById?(relationshipId: string): Promise<LoreRelationship | null>;
}

export type GraphRepository = IGraphRepository;
