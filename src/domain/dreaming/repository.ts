import type { LoreEntity, NarrativeFact } from '../entities.js';

/**
 * Puerto de repositorio para el Servicio Dreaming.
 * Regla de Arquitectura: Definición pura de dominio sin dependencias de infraestructura.
 */
export interface IDreamingRepository {
  /**
   * Obtiene una entidad por su ID.
   */
  getEntity(entityId: string): Promise<LoreEntity | null>;

  /**
   * Obtiene todas las entidades, opcionalmente filtradas por dominio.
   */
  getAllEntities(domain?: string): Promise<LoreEntity[]>;

  /**
   * Obtiene hechos narrativos, opcionalmente asociados a un entityId.
   */
  getFacts(entityId?: string): Promise<NarrativeFact[]>;

  /**
   * Guarda de forma atómica e idempotente entidades y hechos en SQLite WAL.
   * Si ocurre un fallo de integridad o error, debe revertir la transacción completa.
   */
  saveDistillation(entities: LoreEntity[], facts: NarrativeFact[]): Promise<void>;
}
