/**
 * Clases de error de dominio para el motor de grafos relacionales.
 * Regla de Arquitectura: Cero dependencias externas.
 */
export class GraphError extends Error {
  constructor(
    public readonly code: string,
    message: string
  ) {
    super(message);
    this.name = 'GraphError';
  }
}

export class GraphForeignKeyViolationError extends GraphError {
  constructor(code: string, message: string) {
    super(code, message);
    this.name = 'GraphForeignKeyViolationError';
  }
}

export class GraphEntityNotFoundError extends GraphError {
  constructor(public readonly entityId: string, message?: string) {
    super('ENTITY_NOT_FOUND', message ?? `Entity with ID "${entityId}" not found in graph.`);
    this.name = 'GraphEntityNotFoundError';
  }
}
