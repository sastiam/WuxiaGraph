/**
 * Excepciones de dominio para el Servicio Dreaming.
 * Regla de Arquitectura: Cero dependencias externas.
 */

export class InvalidEntityAttributesError extends Error {
  readonly code = 'INVALID_ENTITY_ATTRIBUTES';

  constructor(
    public readonly entityId: string,
    public readonly details: string = 'JSON malformado o no es un objeto válido'
  ) {
    super(`Atributos inválidos para la entidad '${entityId}': ${details}.`);
    this.name = 'InvalidEntityAttributesError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class DreamingForeignKeyViolationError extends Error {
  readonly code = 'FOREIGN_KEY_VIOLATION';

  constructor(
    public readonly entityId: string,
    public readonly details: string = 'La entidad canónica no existe en lore_entities'
  ) {
    super(`Violación de clave foránea para la entidad '${entityId}': ${details}.`);
    this.name = 'DreamingForeignKeyViolationError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class InvalidDistillInputError extends Error {
  readonly code = 'INVALID_DISTILL_INPUT';

  constructor(
    public readonly details: string = 'La entrada para destilación narrativa es inválida o vacía'
  ) {
    super(`Entrada narrativa inválida: ${details}.`);
    this.name = 'InvalidDistillInputError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

// Aliases para máxima compatibilidad y expresividad
export const InvalidAttributesJsonError = InvalidEntityAttributesError;
export type InvalidAttributesJsonError = InvalidEntityAttributesError;

export const EntityNotFoundError = DreamingForeignKeyViolationError;
export type EntityNotFoundError = DreamingForeignKeyViolationError;

export const EmptyNarrativeInputError = InvalidDistillInputError;
export type EmptyNarrativeInputError = InvalidDistillInputError;
