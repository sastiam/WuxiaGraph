import { describe, it, expect, beforeEach } from 'vitest';
import {
  DreamingService,
  parseAndValidateAttributes,
  buildLoreEntity,
  buildNarrativeFact,
  extractFactsFromText,
  InvalidEntityAttributesError,
  DreamingForeignKeyViolationError,
  InvalidDistillInputError,
  type IDreamingRepository,
} from '../../src/domain/dreaming/index.js';
import type { LoreEntity, NarrativeFact, WipGovernanceLedger } from '../../src/domain/entities.js';
import type { IWipGovernanceRepository } from '../../src/domain/governance/repository.js';
import { WipLimitExceededError } from '../../src/domain/governance/errors.js';

class InMemoryDreamingRepository implements IDreamingRepository {
  public entities = new Map<string, LoreEntity>();
  public facts: NarrativeFact[] = [];

  async getEntity(entityId: string): Promise<LoreEntity | null> {
    return this.entities.get(entityId) ?? null;
  }

  async getAllEntities(domain?: string): Promise<LoreEntity[]> {
    const all = Array.from(this.entities.values());
    if (domain) {
      return all.filter((e) => e.domain === domain);
    }
    return all;
  }

  async getFacts(entityId?: string): Promise<NarrativeFact[]> {
    if (entityId !== undefined) {
      return this.facts.filter((f) => f.entityId === entityId);
    }
    return [...this.facts];
  }

  async saveDistillation(entities: LoreEntity[], facts: NarrativeFact[]): Promise<void> {
    for (const ent of entities) {
      this.entities.set(ent.entityId, ent);
    }
    this.facts.push(...facts);
  }
}

class InMemoryWipGovernanceRepository implements IWipGovernanceRepository {
  constructor(private ledger: WipGovernanceLedger) {}

  async findByWeek(): Promise<WipGovernanceLedger | null> {
    return this.ledger;
  }

  async save(ledger: WipGovernanceLedger): Promise<void> {
    this.ledger = ledger;
  }

  async getOrCreateCurrentWeekLedger(): Promise<WipGovernanceLedger> {
    return this.ledger;
  }

  async logHours(): Promise<WipGovernanceLedger> {
    return this.ledger;
  }

  async incrementBranchCount(): Promise<WipGovernanceLedger> {
    return this.ledger;
  }
}

describe('Dominio Dreaming (Servicio & Destilador)', () => {
  let repo: InMemoryDreamingRepository;
  let service: DreamingService;

  beforeEach(() => {
    repo = new InMemoryDreamingRepository();
    service = new DreamingService(repo);
  });

  describe('parseAndValidateAttributes', () => {
    it('debe retornar objeto vacío cuando attributes es undefined o vacío', () => {
      expect(parseAndValidateAttributes('ent-1', undefined)).toEqual({});
      expect(parseAndValidateAttributes('ent-1', '')).toEqual({});
      expect(parseAndValidateAttributes('ent-1', '   ')).toEqual({});
    });

    it('debe parsear correctamente una cadena JSON válida', () => {
      const jsonStr = JSON.stringify({ sect: '青云门', stage: 'Golden Core' });
      const parsed = parseAndValidateAttributes('ent-1', jsonStr);
      expect(parsed).toEqual({ sect: '青云门', stage: 'Golden Core' });
    });

    it('debe aceptar directamente un objeto de atributos', () => {
      const obj = { level: 9, element: 'fire' };
      const parsed = parseAndValidateAttributes('ent-1', obj);
      expect(parsed).toEqual(obj);
    });

    it('debe lanzar InvalidEntityAttributesError cuando attributes_json es JSON malformado', () => {
      expect(() => parseAndValidateAttributes('ent-bad', '{ invalid json : 123')).toThrowError(
        InvalidEntityAttributesError
      );

      try {
        parseAndValidateAttributes('ent-bad', '{ not valid');
      } catch (err) {
        expect(err).toBeInstanceOf(InvalidEntityAttributesError);
        const error = err as InvalidEntityAttributesError;
        expect(error.code).toBe('INVALID_ENTITY_ATTRIBUTES');
        expect(error.entityId).toBe('ent-bad');
      }
    });

    it('debe lanzar InvalidEntityAttributesError cuando attributes_json es un array o primitivo', () => {
      expect(() => parseAndValidateAttributes('ent-arr', '[1, 2, 3]')).toThrowError(
        InvalidEntityAttributesError
      );
      expect(() => parseAndValidateAttributes('ent-prim', '"simple string"')).toThrowError(
        InvalidEntityAttributesError
      );
    });
  });

  describe('extractFactsFromText con caracteres orientales y unicode', () => {
    it('debe extraer hechos reconociendo oraciones y caracteres chinos / Xianxia', () => {
      const text = '林枫踏入了青云门。他获得了九转玄功！他的修为突破至金丹期。';
      const entities: LoreEntity[] = [
        {
          entityId: 'ent_lin_feng',
          domain: 'xianxia',
          canonicalName: '林枫',
          currentStatus: 'ACTIVE',
          attributes: {},
        },
      ];

      const facts = extractFactsFromText(text, 'Capítulo 10', entities);

      expect(facts.length).toBe(3);
      expect(facts[0].factStatement).toBe('林枫踏入了青云门');
      expect(facts[0].entityId).toBe('ent_lin_feng');
      expect(facts[0].isCanon).toBe(true);
      expect(facts[0].chapterSource).toBe('Capítulo 10');

      expect(facts[1].factStatement).toBe('他获得了九转玄功');
      expect(facts[2].factStatement).toBe('他的修为突破至金丹期');
    });

    it('debe retornar lista vacía si el texto está compuesto únicamente de espacios en blanco', () => {
      const facts = extractFactsFromText('   \n  \t  ', 'Capítulo 1');
      expect(facts).toEqual([]);
    });
  });

  describe('DreamingService.distill', () => {
    it('debe destilar entidades y hechos canónicos de forma idempotente', async () => {
      const result = await service.distill({
        chapterSource: 'Capítulo 1: El despertar',
        domain: 'cultivation',
        entities: [
          {
            entityId: 'ent_han_li',
            canonicalName: 'Han Li',
            attributes: { realm: 'Qi Condensation' },
          },
        ],
        facts: [
          {
            factId: 'fact_han_1',
            entityId: 'ent_han_li',
            factStatement: 'Han Li descubrió una botella misteriosa.',
            isCanon: true,
          },
        ],
      });

      expect(result.domain).toBe('cultivation');
      expect(result.chapterSource).toBe('Capítulo 1: El despertar');
      expect(result.entities.length).toBe(1);
      expect(result.entities[0].canonicalName).toBe('Han Li');
      expect(result.facts.length).toBe(1);
      expect(result.facts[0].isCanon).toBe(true);

      // Verificar persistencia en el repositorio
      const storedEntity = await repo.getEntity('ent_han_li');
      expect(storedEntity).toBeDefined();
      expect(storedEntity?.canonicalName).toBe('Han Li');
    });

    it('debe lanzar InvalidDistillInputError cuando la entrada está vacía', async () => {
      await expect(
        service.distill({
          chapterSource: 'Capítulo 1',
        })
      ).rejects.toThrowError(InvalidDistillInputError);

      await expect(
        service.distill({
          chapterSource: '',
          text: 'Texto válido',
        })
      ).rejects.toThrowError(InvalidDistillInputError);
    });

    it('debe lanzar DreamingForeignKeyViolationError al intentar asociar un hecho a un entity_id inexistente', async () => {
      await expect(
        service.distill({
          chapterSource: 'Capítulo 2',
          facts: [
            {
              factId: 'fact_orphan',
              entityId: 'ent_inexistente',
              factStatement: 'Un hecho sin entidad canónica registrada.',
            },
          ],
        })
      ).rejects.toThrowError(DreamingForeignKeyViolationError);

      try {
        await service.distill({
          chapterSource: 'Capítulo 2',
          facts: [
            {
              factId: 'fact_orphan_2',
              entityId: 'ent_inexistente_2',
              factStatement: 'Otro hecho huérfano.',
            },
          ],
        });
      } catch (err) {
        expect(err).toBeInstanceOf(DreamingForeignKeyViolationError);
        const error = err as DreamingForeignKeyViolationError;
        expect(error.code).toBe('FOREIGN_KEY_VIOLATION');
        expect(error.entityId).toBe('ent_inexistente_2');
      }
    });

    it('debe permitir hechos con entityId si la entidad se crea en el mismo batch de destilación', async () => {
      const result = await service.distill({
        chapterSource: 'Capítulo 3',
        entities: [
          {
            entityId: 'ent_meng_hao',
            canonicalName: 'Meng Hao',
          },
        ],
        facts: [
          {
            entityId: 'ent_meng_hao',
            factStatement: 'Meng Hao ascendió la montaña Reliance.',
          },
        ],
      });

      expect(result.entities.length).toBe(1);
      expect(result.facts.length).toBe(1);
      expect(result.facts[0].entityId).toBe('ent_meng_hao');
    });

    it('debe respetar el Circuit Breaker y bloquear cuando el ledger excede 4.0h', async () => {
      const lockedLedger: WipGovernanceLedger = {
        weekStartDate: '2026-10-12',
        totalHoursLogged: 4.5,
        maxBudgetHours: 4.0,
        branchesOpenedCount: 1,
        status: 'LOCKED_BY_WIP',
      };
      const govRepo = new InMemoryWipGovernanceRepository(lockedLedger);
      const serviceWithGov = new DreamingService(repo, govRepo);

      await expect(
        serviceWithGov.distill({
          chapterSource: 'Capítulo 4',
          text: 'Texto de prueba mientras está bloqueado.',
        })
      ).rejects.toThrowError(WipLimitExceededError);
    });
  });
});
