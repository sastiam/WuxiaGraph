import type {
  CanonicalEntityContext,
  DomainContextResult,
  IContextRepository,
} from './types.js';

/**
 * Función auxiliar para congelar profundamente un objeto haciéndolo inmutable.
 */
function deepFreeze<T>(obj: T): Readonly<T> {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  // Si ya está congelado, no lo recorremos de nuevo
  if (Object.isFrozen(obj)) {
    return obj;
  }

  const propNames = Object.getOwnPropertyNames(obj) as Array<keyof T>;
  for (const name of propNames) {
    const value = obj[name];
    if (value !== null && typeof value === 'object') {
      deepFreeze(value);
    }
  }

  return Object.freeze(obj);
}

/**
 * Formatea los atributos de una entidad como Markdown determinista,
 * ordenando alfabéticamente las claves.
 */
export function formatAttributesMarkdown(attributes: Record<string, unknown>): string {
  const keys = Object.keys(attributes).sort();
  if (keys.length === 0) {
    return '- **Attributes:** None';
  }

  const lines = ['- **Attributes:**'];
  for (const key of keys) {
    const val = attributes[key];
    const valStr = typeof val === 'object' && val !== null ? JSON.stringify(val) : String(val);
    lines.push(`  - ${key}: ${valStr}`);
  }
  return lines.join('\n');
}

/**
 * Formatea una entidad y sus hechos canónicos como Markdown determinista.
 */
export function formatEntityMarkdown(context: CanonicalEntityContext): string {
  const { entity, facts } = context;
  const header = `### ${entity.canonicalName} (${entity.currentStatus})`;
  const idLine = `- **Entity ID:** ${entity.entityId}`;
  const attributesBlock = formatAttributesMarkdown(entity.attributes);

  let factsBlock: string;
  if (facts.length === 0) {
    factsBlock = '- **Canonical Facts:** None';
  } else {
    // Hechos ordenados determinísticamente por capítulo y factId
    const sortedFacts = [...facts].sort((a, b) =>
      a.chapterSource.localeCompare(b.chapterSource) || a.factId.localeCompare(b.factId)
    );
    const factLines = sortedFacts.map((f) => `  - [${f.chapterSource}] ${f.factStatement}`);
    factsBlock = ['- **Canonical Facts:**', ...factLines].join('\n');
  }

  return [header, idLine, attributesBlock, factsBlock].join('\n');
}

/**
 * Construye el prefijo de prompt Markdown inmutable y determinista para un dominio dado.
 */
export function buildImmutablePromptPrefix(
  domain: string,
  contexts: readonly CanonicalEntityContext[]
): string {
  const lines: string[] = [`# CANONICAL CONTEXT: ${domain}`, ''];

  if (contexts.length === 0) {
    lines.push(`No canonical entities or facts found for domain: ${domain}.`);
    return lines.join('\n');
  }

  lines.push('## Canonical Entities & Facts', '');

  const formattedEntities = contexts.map((ctx) => formatEntityMarkdown(ctx));
  lines.push(formattedEntities.join('\n\n'));

  return lines.join('\n');
}

/**
 * Servicio de Dominio para la inyección de contexto canónico (WXG-015).
 * Genera estructuras y prefijos de prompt inmutables y deterministas para LLMs.
 */
export class ContextInjectorService {
  constructor(private readonly repository: IContextRepository) {}

  /**
   * Consulta los hechos canónicos para un dominio, garantizando el descarte estricto
   * de borradores (is_canon = 0) y devolviendo un resultado inmutable.
   */
  async injectContext(domain: string): Promise<DomainContextResult> {
    if (!domain || typeof domain !== 'string' || domain.trim() === '') {
      throw new Error('Domain parameter is required and cannot be empty.');
    }

    const normalizedDomain = domain.trim();
    const rawContexts = await this.repository.getCanonicalContextByDomain(normalizedDomain);

    // Filtro defensivo estricto: descartar cualquier hecho con isCanon !== true
    // y ordenar determinísticamente entidades y hechos
    const processedContexts: CanonicalEntityContext[] = rawContexts
      .map((item) => ({
        entity: { ...item.entity },
        facts: item.facts
          .filter((f) => f.isCanon === true)
          .sort(
            (a, b) =>
              a.chapterSource.localeCompare(b.chapterSource) ||
              a.factId.localeCompare(b.factId)
          ),
      }))
      .sort(
        (a, b) =>
          a.entity.canonicalName.localeCompare(b.entity.canonicalName) ||
          a.entity.entityId.localeCompare(b.entity.entityId)
      );

    const promptPrefix = buildImmutablePromptPrefix(normalizedDomain, processedContexts);
    const totalFacts = processedContexts.reduce((sum, item) => sum + item.facts.length, 0);

    const result: DomainContextResult = {
      domain: normalizedDomain,
      promptPrefix,
      entitiesCount: processedContexts.length,
      factsCount: totalFacts,
      entities: processedContexts,
    };

    return deepFreeze(result);
  }
}
