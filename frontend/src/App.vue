<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useLoreStore } from './stores/lore';
import LoreGraphVisualizer from './components/LoreGraphVisualizer.vue';
import GovernancePanel from './components/GovernancePanel.vue';
import DreamingConsole, { type DistillSuccessData } from './components/DreamingConsole.vue';
import HitLAliasQueue, { type HitLProposal, type AvailableEntity } from './components/HitLAliasQueue.vue';

type TabView = 'graph' | 'governance' | 'dreaming' | 'hitl';

const currentTab = ref<TabView>('graph');
const loreStore = useLoreStore();
const selectedDomain = ref<string>(loreStore.currentDomain);

// HitL proposals state
const hitlProposals = ref<HitLProposal[]>([
  {
    proposalId: 'prop-hitl-001',
    candidateName: 'Young Master Ye',
    targetEntityId: 'ent-ye-chen',
    targetCanonicalName: 'Ye Chen',
    confidenceScore: 0.78,
    isCanon: false,
    status: 'PENDING',
    domain: 'jianghu',
    context: 'El joven Young Master Ye desenvainó su espada estelar frente a los ancianos del clan.',
    createdAt: '2026-10-21T09:30:00Z',
  },
  {
    proposalId: 'prop-hitl-002',
    candidateName: 'Sword Immortal Ye',
    targetEntityId: 'ent-ye-chen',
    targetCanonicalName: 'Ye Chen',
    confidenceScore: 0.92,
    isCanon: false,
    status: 'PENDING',
    domain: 'jianghu',
    context: 'Los rumores del Sword Immortal Ye estremecieron la cordillera de las diez mil espadas.',
    createdAt: '2026-10-21T10:15:00Z',
  },
  {
    proposalId: 'prop-hitl-003',
    candidateName: 'Yellow Maple Pavilion',
    targetEntityId: 'ent-yellow-maple',
    targetCanonicalName: 'Valle del Arce Amarillo (黄枫谷)',
    confidenceScore: 0.65,
    isCanon: false,
    status: 'PENDING',
    domain: 'sects',
    context: 'En el pabellón Yellow Maple Pavilion se realizaban los intercambios de elixires.',
    createdAt: '2026-10-21T11:00:00Z',
  },
]);

const availableEntitiesForHitL = computed<AvailableEntity[]>(() => {
  if (loreStore.entities.length > 0) {
    return loreStore.entities.map((e) => ({
      entityId: e.entityId,
      canonicalName: e.canonicalName,
      domain: e.domain,
    }));
  }
  // Fallback defaults
  return [
    { entityId: 'ent-ye-chen', canonicalName: 'Ye Chen', domain: 'jianghu' },
    { entityId: 'ent-yellow-maple', canonicalName: 'Valle del Arce Amarillo (黄枫谷)', domain: 'sects' },
    { entityId: 'ent-han-li', canonicalName: 'Han Li', domain: 'jianghu' },
  ];
});

function handleApproveProposal(proposal: HitLProposal): void {
  const target = hitlProposals.value.find((p) => p.proposalId === proposal.proposalId);
  if (target) {
    target.status = 'APPROVED';
    target.isCanon = true;
  }
}

function handleRejectProposal(proposal: HitLProposal): void {
  const target = hitlProposals.value.find((p) => p.proposalId === proposal.proposalId);
  if (target) {
    target.status = 'REJECTED';
  }
}

function handleUnifyProposal(payload: { proposal: HitLProposal; targetEntityId: string; targetCanonicalName: string }): void {
  const target = hitlProposals.value.find((p) => p.proposalId === payload.proposal.proposalId);
  if (target) {
    target.status = 'APPROVED';
    target.isCanon = true;
    target.targetEntityId = payload.targetEntityId;
    target.targetCanonicalName = payload.targetCanonicalName;
  }
}

function handleSearch(): void {
  if (selectedDomain.value.trim()) {
    void loreStore.fetchContext(selectedDomain.value.trim());
  }
}

function handleDreamingCompleted(payload: DistillSuccessData): void {
  // If the distilled domain matches our current view, automatically refresh the graph context
  if (payload.domain === loreStore.currentDomain) {
    void loreStore.fetchContext(payload.domain);
  }
}

onMounted(() => {
  void loreStore.fetchContext();
});
</script>

<template>
  <main class="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 font-sans">
    <div class="max-w-6xl mx-auto space-y-6">
      <!-- Header -->
      <header class="border-b border-slate-800 pb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div class="flex items-center gap-2.5">
            <span class="inline-block w-3 h-3 rounded-full bg-amber-400"></span>
            <h1 class="text-3xl font-extrabold tracking-tight text-amber-400">
              WuxiaGraph
            </h1>
          </div>
          <p class="text-sm text-slate-400 mt-1">
            Motor de Memoria Canónica, Visualizador de Lore &amp; Gobernanza WIP
          </p>
        </div>

        <form @submit.prevent="handleSearch" class="flex gap-2">
          <input
            v-model="selectedDomain"
            type="text"
            placeholder="Dominio narrativo (ej. jianghu)"
            class="px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition"
          />
          <button
            type="submit"
            :disabled="loreStore.isLoading"
            class="px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-semibold rounded-lg text-sm transition"
          >
            {{ loreStore.isLoading ? 'Cargando...' : 'Consultar' }}
          </button>
        </form>
      </header>

      <!-- Navigation Tabs -->
      <nav class="flex items-center gap-2 border-b border-slate-800 pb-1">
        <button
          type="button"
          @click="currentTab = 'graph'"
          class="px-4 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 transition"
          :class="currentTab === 'graph'
            ? 'bg-amber-500/10 text-amber-400 border-b-2 border-amber-400'
            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'"
        >
          <span>🕸️</span>
          <span>Grafo de Lore &amp; Entidades</span>
        </button>

        <button
          type="button"
          @click="currentTab = 'governance'"
          class="px-4 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 transition"
          :class="currentTab === 'governance'
            ? 'bg-amber-500/10 text-amber-400 border-b-2 border-amber-400'
            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'"
        >
          <span>⚖️</span>
          <span>Gobernanza WIP &amp; Propuestas</span>
        </button>

        <button
          type="button"
          @click="currentTab = 'dreaming'"
          class="px-4 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 transition"
          :class="currentTab === 'dreaming'
            ? 'bg-amber-500/10 text-amber-400 border-b-2 border-amber-400'
            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'"
        >
          <span>✨</span>
          <span>Consola Dreaming (IA)</span>
        </button>

        <button
          type="button"
          @click="currentTab = 'hitl'"
          class="px-4 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 transition"
          :class="currentTab === 'hitl'
            ? 'bg-amber-500/10 text-amber-400 border-b-2 border-amber-400'
            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'"
        >
          <span>👥</span>
          <span>Cola HitL de Alias</span>
          <span
            v-if="hitlProposals.filter(p => p.status === 'PENDING').length > 0"
            class="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
          >
            {{ hitlProposals.filter(p => p.status === 'PENDING').length }}
          </span>
        </button>
      </nav>

      <!-- Status alerts -->
      <div
        v-if="loreStore.error"
        class="p-4 bg-red-950/60 border border-red-800 text-red-300 rounded-lg text-sm"
      >
        <span class="font-bold">Error:</span> {{ loreStore.error }}
      </div>

      <!-- TAB 1: Lore Graph & Canonical Entities -->
      <div v-show="currentTab === 'graph'" class="space-y-8">
        <!-- Interactive Lore Graph Visualizer -->
        <section>
          <LoreGraphVisualizer
            :entities="loreStore.entities"
            :facts="loreStore.facts"
          />
        </section>

        <!-- Main Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Entities Section -->
          <section class="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div class="flex items-center justify-between">
              <h2 class="text-xl font-bold text-slate-100 flex items-center gap-2">
                <span class="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                Entidades Canónicas
              </h2>
              <span class="text-xs bg-slate-800 px-2.5 py-1 rounded-full text-slate-400 font-mono">
                {{ loreStore.entities.length }} entidades
              </span>
            </div>

            <div v-if="loreStore.entities.length === 0" class="text-slate-500 text-sm italic py-4">
              No se encontraron entidades para el dominio "{{ loreStore.currentDomain }}".
            </div>

            <ul v-else class="space-y-3">
              <li
                v-for="entity in loreStore.entities"
                :key="entity.entityId"
                class="p-4 rounded-lg bg-slate-950/60 border border-slate-800/80 space-y-2 hover:border-slate-700 transition"
              >
                <div class="flex items-baseline justify-between">
                  <span class="font-semibold text-amber-300 text-base">
                    {{ entity.canonicalName }}
                  </span>
                  <span class="text-xs font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    {{ entity.currentStatus }}
                  </span>
                </div>
                <p class="text-xs text-slate-400 font-mono">
                  ID: {{ entity.entityId }} | Dominio: {{ entity.domain }}
                </p>
                <div v-if="Object.keys(entity.attributes).length > 0" class="text-xs text-slate-300 mt-2 bg-slate-900/90 p-2.5 rounded border border-slate-800">
                  <pre class="overflow-x-auto font-mono text-[11px] leading-tight">{{ JSON.stringify(entity.attributes, null, 2) }}</pre>
                </div>
              </li>
            </ul>
          </section>

          <!-- Facts Section -->
          <section class="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div class="flex items-center justify-between">
              <h2 class="text-xl font-bold text-slate-100 flex items-center gap-2">
                <span class="inline-block w-2.5 h-2.5 rounded-full bg-sky-400"></span>
                Hechos Narrativos
              </h2>
              <span class="text-xs bg-slate-800 px-2.5 py-1 rounded-full text-slate-400 font-mono">
                {{ loreStore.facts.length }} hechos
              </span>
            </div>

            <div v-if="loreStore.facts.length === 0" class="text-slate-500 text-sm italic py-4">
              No se encontraron hechos narrativos canónicos para este dominio.
            </div>

            <ul v-else class="space-y-3">
              <li
                v-for="fact in loreStore.facts"
                :key="fact.factId"
                class="p-4 rounded-lg bg-slate-950/60 border border-slate-800/80 space-y-2 hover:border-slate-700 transition"
              >
                <p class="text-sm text-slate-200 leading-relaxed">
                  {{ fact.factStatement }}
                </p>
                <div class="flex items-center justify-between text-xs text-slate-500 pt-1">
                  <span>Capítulo: <strong class="text-slate-400">{{ fact.chapterSource }}</strong></span>
                  <span
                    :class="fact.isCanon ? 'text-emerald-400 bg-emerald-950/40 border border-emerald-800/50' : 'text-amber-400 bg-amber-950/40 border border-amber-800/50'"
                    class="px-2 py-0.5 rounded text-[10px] font-mono"
                  >
                    {{ fact.isCanon ? 'CANÓNICO' : 'DRAFT' }}
                  </span>
                </div>
              </li>
            </ul>
          </section>
        </div>

        <!-- Immutable Prompt Prefix Preview -->
        <section v-if="loreStore.promptPrefix" class="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
          <h3 class="text-base font-bold text-slate-200">
            Prefijo Inmutable de Prompt Generado (Context Injection)
          </h3>
          <pre class="bg-slate-950 p-4 rounded-lg text-xs font-mono text-amber-200/90 whitespace-pre-wrap overflow-x-auto border border-slate-800 leading-relaxed">{{ loreStore.promptPrefix }}</pre>
        </section>
      </div>

      <!-- TAB 2: Governance Panel -->
      <div v-show="currentTab === 'governance'">
        <GovernancePanel />
      </div>

      <!-- TAB 3: Dreaming Console -->
      <div v-show="currentTab === 'dreaming'">
        <DreamingConsole @dreamingCompleted="handleDreamingCompleted" />
      </div>

      <!-- TAB 4: HitL Alias Approval Queue -->
      <div v-show="currentTab === 'hitl'">
        <HitLAliasQueue
          :initialProposals="hitlProposals"
          :availableEntities="availableEntitiesForHitL"
          @approve="handleApproveProposal"
          @reject="handleRejectProposal"
          @unify="handleUnifyProposal"
        />
      </div>
    </div>
  </main>
</template>
