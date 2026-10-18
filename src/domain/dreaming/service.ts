import type { LoreEntity, NarrativeFact } from '../entities.js';
import {
  EmptyNarrativeInputError,
  EntityNotFoundError,
} from './errors.js';
import type { IDreamingRepository } from './repository.js';
import type { DistillRequest, DistillResult } from './types.js';
import {
  buildLoreEntity,
  buildNarrativeFact,
  extractFactsFromText,
} from './distiller.js';
import type { IWipGovernanceRepository } from '../governance/repository.js';
import { validateCircuitBreaker } from '../governance/service.js';

export class DreamingService {
  constructor(
    private readonly repository: IDreamingRepository,
    private readonly governanceRepo?: IWipGovernanceRepository
  ) {}

  /**
   * Procesa la destilación de hechos narrativos y actualización idempotente de entidades.
   */
  async distill(request: DistillRequest): Promise<DistillResult> {
    if (this.governanceRepo) {
      const ledger = await this.governanceRepo.getOrCreateCurrentWeekLedger();
      validateCircuitBreaker(ledger);
    }

    const chapterSource = request.chapterSource?.trim();
    if (!chapterSource) {
      throw new EmptyNarrativeInputError('El campo chapterSource es obligatorio y no puede estar vacío');
    }

    const domain = (request.domain?.trim() || 'wuxia').trim();
    const rawText = request.text?.normalize('NFC').trim();
    const hasText = Boolean(rawText && rawText.length > 0);
    const hasEntities = Boolean(request.entities && request.entities.length > 0);
    const hasFacts = Boolean(request.facts && request.facts.length > 0);

    if (!hasText && !hasEntities && !hasFacts) {
      throw new EmptyNarrativeInputError('Se debe proporcionar texto, entidades o hechos narrativos para destilar');
    }

    // 1. Mapeo y validación de entidades
    const entityMap = new Map<string, LoreEntity>();
    if (request.entities) {
      for (const entInput of request.entities) {
        const entity = buildLoreEntity(entInput, domain);
        entityMap.set(entity.entityId, entity);
      }
    }
    const entities = Array.from(entityMap.values());

    // 2. Mapeo y validación de hechos explícitos
    const facts: NarrativeFact[] = [];
    if (request.facts) {
      for (const factInput of request.facts) {
        facts.push(buildNarrativeFact(factInput, chapterSource));
      }
    }

    // 3. Extracción de hechos a partir de texto (si se proporcionó)
    if (hasText && rawText) {
      const extractedFacts = extractFactsFromText(rawText, chapterSource, entities);
      facts.push(...extractedFacts);
    }

    // 4. Verificación de integridad referencial previa a persistencia (Defensa en profundidad)
    for (const fact of facts) {
      if (fact.entityId) {
        const existsInCurrentBatch = entityMap.has(fact.entityId);
        if (!existsInCurrentBatch) {
          const existingEntity = await this.repository.getEntity(fact.entityId);
          if (!existingEntity) {
            throw new EntityNotFoundError(fact.entityId, `Asociado al hecho '${fact.factId}'`);
          }
        }
      }
    }

    // 5. Persistencia atómica e idempotente en el repositorio
    await this.repository.saveDistillation(entities, facts);

    return {
      domain,
      chapterSource,
      entities,
      facts,
    };
  }
}
