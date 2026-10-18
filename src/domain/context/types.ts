import type { LoreEntity, NarrativeFact } from '../entities.js';

/**
 * Representa una entidad de lore con su conjunto de hechos estrictamente canónicos (is_canon = 1).
 */
export interface CanonicalEntityContext {
  readonly entity: LoreEntity;
  readonly facts: readonly NarrativeFact[];
}

/**
 * Resultado inmutable del contexto inyectado para un dominio narrativo.
 */
export interface DomainContextResult {
  readonly domain: string;
  readonly promptPrefix: string;
  readonly entitiesCount: number;
  readonly factsCount: number;
  readonly entities: readonly CanonicalEntityContext[];
}

/**
 * Puerto de repositorio para el dominio de inyección de contexto.
 * Sigue la regla de Clean Architecture: el dominio define la interfaz,
 * la infraestructura la implementa.
 */
export interface IContextRepository {
  getCanonicalContextByDomain(domain: string): Promise<CanonicalEntityContext[]>;
}
