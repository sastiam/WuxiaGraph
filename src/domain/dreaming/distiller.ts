import { randomUUID } from 'node:crypto';
import type { LoreEntity, NarrativeFact } from '../entities.js';
import { InvalidAttributesJsonError } from './errors.js';
import type { DistillEntityInput, DistillFactInput } from './types.js';

/**
 * Parsea y valida los atributos de una entidad.
 * Admite objeto o cadena JSON. Lanza InvalidAttributesJsonError si no es un JSON de objeto válido.
 */
export function parseAndValidateAttributes(
  entityId: string,
  rawAttributes?: Record<string, unknown> | string
): Record<string, unknown> {
  if (rawAttributes === undefined || rawAttributes === null) {
    return {};
  }

  if (typeof rawAttributes === 'string') {
    const trimmed = rawAttributes.trim();
    if (trimmed === '') {
      return {};
    }
    try {
      const parsed: unknown = JSON.parse(trimmed);
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        throw new InvalidAttributesJsonError(entityId, 'attributes_json debe evaluarse como un objeto JSON');
      }
      return parsed as Record<string, unknown>;
    } catch (error) {
      if (error instanceof InvalidAttributesJsonError) {
        throw error;
      }
      throw new InvalidAttributesJsonError(entityId, 'Formato JSON inválido en attributes_json');
    }
  }

  if (typeof rawAttributes === 'object') {
    if (Array.isArray(rawAttributes)) {
      throw new InvalidAttributesJsonError(entityId, 'Los atributos no pueden ser un array');
    }
    return rawAttributes;
  }

  throw new InvalidAttributesJsonError(entityId, 'Tipo de atributo no compatible');
}

/**
 * Mapea una entrada de entidad a la entidad canónica de dominio LoreEntity.
 */
export function buildLoreEntity(
  input: DistillEntityInput,
  defaultDomain = 'wuxia'
): LoreEntity {
  const entityId = input.entityId.trim();
  const canonicalName = input.canonicalName.trim();
  const domain = (input.domain?.trim() || defaultDomain).trim();
  const currentStatus = (input.currentStatus?.trim() || 'ACTIVE').trim();
  const attributes = parseAndValidateAttributes(entityId, input.attributes);

  return {
    entityId,
    domain,
    canonicalName,
    currentStatus,
    attributes,
  };
}

/**
 * Mapea una entrada de hecho a la entidad de dominio NarrativeFact.
 * Invariante: is_canon es true por defecto (is_canon = 1).
 */
export function buildNarrativeFact(
  input: DistillFactInput,
  chapterSource: string
): NarrativeFact {
  const factId = input.factId?.trim() || randomUUID();
  const entityId = input.entityId ? input.entityId.trim() : null;
  const factStatement = input.factStatement.trim();
  const isCanon = input.isCanon ?? true;
  const source = (input.chapterSource?.trim() || chapterSource).trim();

  return {
    factId,
    entityId,
    factStatement,
    isCanon,
    chapterSource: source,
  };
}

/**
 * Destila hechos narrativos a partir de un texto libre respetando caracteres unicode y orientales.
 */
export function extractFactsFromText(
  text: string,
  chapterSource: string,
  knownEntities: LoreEntity[] = []
): NarrativeFact[] {
  const normalizedText = text.normalize('NFC').trim();
  if (normalizedText === '') {
    return [];
  }

  // Segmentación por delimitadores comunes de oraciones en español, inglés y chino/oriental
  const rawSegments = normalizedText.split(/[\r\n]+|[.。!?！？]+/).map((s) => s.trim()).filter((s) => s.length > 0);

  const facts: NarrativeFact[] = [];

  for (const statement of rawSegments) {
    // Intentar asociar con entidades existentes si el nombre canónico aparece en el hecho
    let matchedEntityId: string | null = null;
    for (const entity of knownEntities) {
      if (statement.includes(entity.canonicalName) || statement.includes(entity.entityId)) {
        matchedEntityId = entity.entityId;
        break;
      }
    }

    facts.push({
      factId: randomUUID(),
      entityId: matchedEntityId,
      factStatement: statement,
      isCanon: true,
      chapterSource,
    });
  }

  return facts;
}
