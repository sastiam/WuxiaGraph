import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { DatabaseSync } from 'node:sqlite';
import {
  createDatabase,
  insertLoreEntity,
  insertNarrativeFact,
} from '../../src/infrastructure/database.js';
import { SqliteContextRepository } from '../../src/infrastructure/sqlite-context.repository.js';
import {
  ContextInjectorService,
  formatAttributesMarkdown,
  formatEntityMarkdown,
  buildImmutablePromptPrefix,
} from '../../src/domain/context/index.js';
import type {
  IContextRepository,
  CanonicalEntityContext,
} from '../../src/domain/context/types.js';

describe('Dominio de Inyección de Contexto Canónico (WXG-015)', () => {
  describe('1. Formateadores Puros & Determinismo Markdown', () => {
    it('debe formatear atributos ordenando las claves alfabéticamente', () => {
      const attributes = {
        zetaAttribute: 'last',
        alphaAttribute: 'first',
        betaAttribute: 42,
        complex: { nested: true },
      };

      const markdown = formatAttributesMarkdown(attributes);
      const lines = markdown.split('\n');

      expect(lines[0]).toBe('- **Attributes:**');
      expect(lines[1]).toBe('  - alphaAttribute: first');
      expect(lines[2]).toBe('  - betaAttribute: 42');
      expect(lines[3]).toBe('  - complex: {"nested":true}');
      expect(lines[4]).toBe('  - zetaAttribute: last');
    });

    it('debe manejar atributos vacíos retornando None', () => {
      expect(formatAttributesMarkdown({})).toBe('- **Attributes:** None');
    });

    it('debe formatear una entidad con múltiples hechos canónicos determinísticamente', () => {
      const context: CanonicalEntityContext = {
        entity: {
          entityId: 'ent-han-li',
          domain: 'Xianxia/Characters',
          canonicalName: 'Han Li',
          currentStatus: 'ALIVE',
          attributes: {
            cultivationRealm: 'Foundation Establishment',
          },
        },
        facts: [
          {
            factId: 'fact-002',
            entityId: 'ent-han-li',
            factStatement: 'Han Li escapó del Valle de Arce Amarillo.',
            isCanon: true,
            chapterSource: 'Capítulo 80',
          },
          {
            factId: 'fact-001',
            entityId: 'ent-han-li',
            factStatement: 'Han Li descubrió el pequeño vial verde.',
            isCanon: true,
            chapterSource: 'Capítulo 05',
          },
        ],
      };

      const markdown = formatEntityMarkdown(context);
      expect(markdown).toContain('### Han Li (ALIVE)');
      expect(markdown).toContain('- **Entity ID:** ent-han-li');
      expect(markdown).toContain('- **Attributes:**\n  - cultivationRealm: Foundation Establishment');
      // Ordenado por chapterSource (Capítulo 05 antes de Capítulo 80)
      const fact1Idx = markdown.indexOf('[Capítulo 05]');
      const fact2Idx = markdown.indexOf('[Capítulo 80]');
      expect(fact1Idx).toBeGreaterThan(-1);
      expect(fact2Idx).toBeGreaterThan(fact1Idx);
    });

    it('debe formatear una entidad sin hechos canónicos indicando None', () => {
      const context: CanonicalEntityContext = {
        entity: {
          entityId: 'ent-mystery-elder',
          domain: 'Xianxia/Characters',
          canonicalName: 'Anciano Misterioso',
          currentStatus: 'UNKNOWN',
          attributes: {},
        },
        facts: [],
      };

      const markdown = formatEntityMarkdown(context);
      expect(markdown).toContain('### Anciano Misterioso (UNKNOWN)');
      expect(markdown).toContain('- **Canonical Facts:** None');
    });

    it('debe construir el prefijo por defecto cuando no hay entidades en el dominio', () => {
      const prefix = buildImmutablePromptPrefix('EmptyDomain', []);
      expect(prefix).toBe(
        '# CANONICAL CONTEXT: EmptyDomain\n\nNo canonical entities or facts found for domain: EmptyDomain.'
      );
    });
  });

  describe('2. Integración ContextInjectorService con SQLite WAL', () => {
    let db: DatabaseSync;
    let repository: SqliteContextRepository;
    let service: ContextInjectorService;

    beforeEach(() => {
      db = createDatabase(':memory:');
      repository = new SqliteContextRepository(db);
      service = new ContextInjectorService(repository);
    });

    afterEach(() => {
      db.close();
    });

    it('debe descartar obligatoriamente hechos con is_canon = 0 (Borradores)', async () => {
      const domain = 'Xianxia/Lore';

      insertLoreEntity(db, {
        entityId: 'ent-han-li',
        domain,
        canonicalName: 'Han Li',
        currentStatus: 'ALIVE',
        attributes: { realm: 'Core Formation' },
      });

      // Hecho canónico (is_canon = 1)
      insertNarrativeFact(db, {
        factId: 'fact-canon-01',
        entityId: 'ent-han-li',
        factStatement: 'Han Li ascendió a Formación del Núcleo usando la Píldora de Polvo Espiritual.',
        isCanon: true,
        chapterSource: 'Capítulo 120',
      });

      // Hecho NO canónico / borrador secundario (is_canon = 0)
      insertNarrativeFact(db, {
        factId: 'fact-draft-01',
        entityId: 'ent-han-li',
        factStatement: 'Borrador: Han Li murió en la Prueba de Sangre.',
        isCanon: false,
        chapterSource: 'Capítulo 30-Borrador',
      });

      const result = await service.injectContext(domain);

      expect(result.domain).toBe(domain);
      expect(result.entitiesCount).toBe(1);
      expect(result.factsCount).toBe(1);

      // Verificación en la lista estructurada de entidades
      const hanLiFacts = result.entities[0].facts;
      expect(hanLiFacts).toHaveLength(1);
      expect(hanLiFacts[0].factId).toBe('fact-canon-01');
      expect(hanLiFacts[0].isCanon).toBe(true);

      // Verificación en el texto inmutable de prompt
      expect(result.promptPrefix).toContain('Han Li ascendió a Formación del Núcleo');
      expect(result.promptPrefix).not.toContain('Borrador: Han Li murió');
      expect(result.promptPrefix).not.toContain('fact-draft-01');
    });

    it('debe consultar un dominio sin entidades ni hechos registrados retornando estructura por defecto válida', async () => {
      const result = await service.injectContext('DominioInexistente');

      expect(result).toBeDefined();
      expect(result.domain).toBe('DominioInexistente');
      expect(result.entitiesCount).toBe(0);
      expect(result.factsCount).toBe(0);
      expect(result.entities).toEqual([]);
      expect(result.promptPrefix).toContain(
        'No canonical entities or facts found for domain: DominioInexistente.'
      );
    });

    it('debe formatear correctamente entidades con múltiples hechos asociados', async () => {
      const domain = 'Xianxia/DualCultivation';

      insertLoreEntity(db, {
        entityId: 'ent-nangong-wan',
        domain,
        canonicalName: 'Nangong Wan',
        currentStatus: 'ALIVE',
        attributes: { sect: 'Masked Moon Sect' },
      });

      insertNarrativeFact(db, {
        factId: 'fact-nw-01',
        entityId: 'ent-nangong-wan',
        factStatement: 'Nangong Wan entró a la Zona Prohibida.',
        isCanon: true,
        chapterSource: 'Capítulo 25',
      });

      insertNarrativeFact(db, {
        factId: 'fact-nw-02',
        entityId: 'ent-nangong-wan',
        factStatement: 'Nangong Wan y Han Li derrotaron a la serpiente del dragón.',
        isCanon: true,
        chapterSource: 'Capítulo 28',
      });

      insertNarrativeFact(db, {
        factId: 'fact-nw-03',
        entityId: 'ent-nangong-wan',
        factStatement: 'Nangong Wan se convirtió en Anciana Suprema.',
        isCanon: true,
        chapterSource: 'Capítulo 250',
      });

      const result = await service.injectContext(domain);

      expect(result.entitiesCount).toBe(1);
      expect(result.factsCount).toBe(3);
      expect(result.entities[0].facts).toHaveLength(3);

      expect(result.promptPrefix).toContain('[Capítulo 25] Nangong Wan entró a la Zona Prohibida.');
      expect(result.promptPrefix).toContain(
        '[Capítulo 28] Nangong Wan y Han Li derrotaron a la serpiente del dragón.'
      );
      expect(result.promptPrefix).toContain(
        '[Capítulo 250] Nangong Wan se convirtió en Anciana Suprema.'
      );
    });

    it('debe mantener las entidades ordenadas alfabéticamente por canonicalName', async () => {
      const domain = 'Xianxia/Order';

      insertLoreEntity(db, {
        entityId: 'ent-z-elder',
        domain,
        canonicalName: 'Zhu Bajie',
        currentStatus: 'ALIVE',
        attributes: {},
      });

      insertLoreEntity(db, {
        entityId: 'ent-a-disciple',
        domain,
        canonicalName: 'An Bai',
        currentStatus: 'ALIVE',
        attributes: {},
      });

      const result = await service.injectContext(domain);

      expect(result.entitiesCount).toBe(2);
      expect(result.entities[0].entity.canonicalName).toBe('An Bai');
      expect(result.entities[1].entity.canonicalName).toBe('Zhu Bajie');
    });

    it('debe garantizar que el resultado retornado sea inmutable (Deep Frozen)', async () => {
      const domain = 'Xianxia/Immutable';

      insertLoreEntity(db, {
        entityId: 'ent-monk',
        domain,
        canonicalName: 'Monje Budista',
        currentStatus: 'MEDITATING',
        attributes: { karma: 100 },
      });

      insertNarrativeFact(db, {
        factId: 'fact-m-01',
        entityId: 'ent-monk',
        factStatement: 'Alcanzó el Nirvana temporal.',
        isCanon: true,
        chapterSource: 'Capítulo 1',
      });

      const result = await service.injectContext(domain);

      expect(Object.isFrozen(result)).toBe(true);
      expect(Object.isFrozen(result.entities)).toBe(true);
      expect(Object.isFrozen(result.entities[0])).toBe(true);
      expect(Object.isFrozen(result.entities[0].entity)).toBe(true);
      expect(Object.isFrozen(result.entities[0].entity.attributes)).toBe(true);
      expect(Object.isFrozen(result.entities[0].facts)).toBe(true);
      expect(Object.isFrozen(result.entities[0].facts[0])).toBe(true);

      // Intentar mutar debe fallar o no tener efecto
      expect(() => {
        // @ts-expect-error Intento de mutación intencional para probar inmutabilidad
        result.domain = 'ModifiedDomain';
      }).toThrow();

      expect(() => {
        // @ts-expect-error Intento de mutación intencional para probar inmutabilidad
        result.entities[0].facts.push({
          factId: 'illegal-fact',
          entityId: 'ent-monk',
          factStatement: 'Inyección maliciosa',
          isCanon: true,
          chapterSource: 'Hacker',
        });
      }).toThrow();
    });

    it('debe rechazar dominio vacío o inválido con error', async () => {
      await expect(service.injectContext('')).rejects.toThrow(/Domain parameter is required/);
      await expect(service.injectContext('   ')).rejects.toThrow(/Domain parameter is required/);
    });

    it('debe filtrar hechos no canónicos incluso si el repositorio devuelve datos contaminados', async () => {
      const contaminatedRepo: IContextRepository = {
        async getCanonicalContextByDomain() {
          return [
            {
              entity: {
                entityId: 'mock-ent',
                domain: 'Mock',
                canonicalName: 'Mock Entity',
                currentStatus: 'ALIVE',
                attributes: {},
              },
              facts: [
                {
                  factId: 'fact-good',
                  entityId: 'mock-ent',
                  factStatement: 'Canonical fact',
                  isCanon: true,
                  chapterSource: 'Ch1',
                },
                {
                  factId: 'fact-bad',
                  entityId: 'mock-ent',
                  factStatement: 'Draft fact sneaked in',
                  isCanon: false,
                  chapterSource: 'Ch2',
                },
              ],
            },
          ];
        },
      };

      const guardedService = new ContextInjectorService(contaminatedRepo);
      const res = await guardedService.injectContext('Mock');

      expect(res.factsCount).toBe(1);
      expect(res.entities[0].facts).toHaveLength(1);
      expect(res.entities[0].facts[0].factId).toBe('fact-good');
      expect(res.promptPrefix).not.toContain('Draft fact sneaked in');
    });
  });
});
