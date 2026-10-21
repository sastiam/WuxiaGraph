import { defineStore } from 'pinia';
import { ref } from 'vue';

export interface LoreEntity {
  entityId: string;
  domain: string;
  canonicalName: string;
  currentStatus: string;
  attributes: Record<string, unknown>;
  lastUpdatedTimestamp?: string;
}

export interface NarrativeFact {
  factId: string;
  entityId: string | null;
  factStatement: string;
  isCanon: boolean;
  chapterSource: string;
}

export interface ContextInjectionPayload {
  domain: string;
  entities: LoreEntity[];
  facts: NarrativeFact[];
  immutablePromptPrefix: string;
}

export const useLoreStore = defineStore('lore', () => {
  const currentDomain = ref<string>('jianghu');
  const entities = ref<LoreEntity[]>([]);
  const facts = ref<NarrativeFact[]>([]);
  const promptPrefix = ref<string>('');
  const isLoading = ref<boolean>(false);
  const error = ref<string | null>(null);

  async function fetchContext(domain: string = currentDomain.value): Promise<void> {
    isLoading.value = true;
    error.value = null;
    currentDomain.value = domain;

    try {
      const response = await fetch(`/api/v1/context/inject?domain=${encodeURIComponent(domain)}`);
      if (!response.ok) {
        throw new Error(`Failed to load context: ${response.status} ${response.statusText}`);
      }

      const data: ContextInjectionPayload = await response.json();
      entities.value = data.entities ?? [];
      facts.value = data.facts ?? [];
      promptPrefix.value = data.immutablePromptPrefix ?? '';
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Unknown error occurred while fetching context';
    } finally {
      isLoading.value = false;
    }
  }

  function setDomain(domain: string): void {
    currentDomain.value = domain;
  }

  return {
    currentDomain,
    entities,
    facts,
    promptPrefix,
    isLoading,
    error,
    fetchContext,
    setDomain,
  };
});
