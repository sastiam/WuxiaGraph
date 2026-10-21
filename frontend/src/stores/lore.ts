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

export interface HitLProposal {
  proposalId: string;
  candidateName: string;
  targetEntityId: string;
  targetCanonicalName: string;
  confidenceScore: number;
  isCanon: boolean;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  domain: string;
  context?: string;
  createdAt: string;
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
  const pendingAliases = ref<HitLProposal[]>([]);
  const promptPrefix = ref<string>('');
  const isLoading = ref<boolean>(false);
  const error = ref<string | null>(null);

  async function fetchPendingAliases(): Promise<void> {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await fetch('/api/v1/aliases/pending');
      if (!response.ok) {
        throw new Error(`Failed to load pending aliases: ${response.status} ${response.statusText}`);
      }

      const data = (await response.json()) as { pending?: HitLProposal[] };
      pendingAliases.value = data.pending ?? [];
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Unknown error occurred while fetching pending aliases';
    } finally {
      isLoading.value = false;
    }
  }

  async function reviewAliasProposal(
    proposalId: string,
    action: 'approve' | 'reject',
    targetEntityId?: string
  ): Promise<void> {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await fetch(`/api/v1/aliases/${encodeURIComponent(proposalId)}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          targetEntityId,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to review alias proposal: ${response.status} ${response.statusText}`);
      }

      const data = (await response.json()) as { success: boolean; proposal: HitLProposal };
      if (data.proposal) {
        const index = pendingAliases.value.findIndex((p) => p.proposalId === proposalId);
        if (index !== -1) {
          pendingAliases.value.splice(index, 1);
        }
      }
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Unknown error occurred while reviewing alias proposal';
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

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
    pendingAliases,
    promptPrefix,
    isLoading,
    error,
    fetchPendingAliases,
    reviewAliasProposal,
    fetchContext,
    setDomain,
  };
});
