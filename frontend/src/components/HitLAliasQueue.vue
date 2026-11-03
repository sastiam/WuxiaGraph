<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { getActivePinia } from 'pinia';
import { useLoreStore, type HitLProposal } from '../stores/lore';

export type { HitLProposal };

export interface AvailableEntity {
  entityId: string;
  canonicalName: string;
  domain: string;
}

const props = withDefaults(
  defineProps<{
    initialProposals?: HitLProposal[];
    availableEntities?: AvailableEntity[];
  }>(),
  {
    initialProposals: () => [],
    availableEntities: () => [],
  }
);

const emit = defineEmits<{
  (e: 'approve', proposal: HitLProposal): void;
  (e: 'reject', proposal: HitLProposal): void;
  (e: 'unify', payload: { proposal: HitLProposal; targetEntityId: string; targetCanonicalName: string }): void;
}>();

// Only call useLoreStore if Pinia is active (e.g., in real app or test with pinia plugin)
const store = getActivePinia() ? useLoreStore() : null;

// Deep copy initial proposals to allow independent local mutation per test/instance
const proposals = ref<HitLProposal[]>(
  props.initialProposals.map((p) => ({ ...p }))
);

onMounted(async () => {
  if (props.initialProposals.length === 0 && store) {
    await store.fetchPendingAliases();
    proposals.value = store.pendingAliases.map((p) => ({ ...p }));
  }
});

const selectedDomain = ref<string>('ALL');
const minConfidence = ref<number>(0);
const selectedStatus = ref<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');

// State for unification modal/action
const unifyingProposal = ref<HitLProposal | null>(null);
const selectedUnifyTargetId = ref<string>('');

const availableDomains = computed(() => {
  const domains = new Set<string>();
  proposals.value.forEach((p) => {
    if (p.domain) domains.add(p.domain);
  });
  return Array.from(domains);
});

const filteredProposals = computed(() => {
  return proposals.value.filter((p) => {
    const matchDomain = selectedDomain.value === 'ALL' || p.domain === selectedDomain.value;
    const matchConfidence = p.confidenceScore >= minConfidence.value;
    const matchStatus = selectedStatus.value === 'ALL' || p.status === selectedStatus.value;
    return matchDomain && matchConfidence && matchStatus;
  });
});

async function handleApprove(proposal: HitLProposal): Promise<void> {
  proposal.status = 'APPROVED';
  proposal.isCanon = true;
  if (store) {
    try {
      await store.reviewAliasProposal(proposal.proposalId, 'approve');
    } catch {
      // Graceful handling if offline or mock test environment
    }
  }
  emit('approve', { ...proposal });
}

async function handleReject(proposal: HitLProposal): Promise<void> {
  proposal.status = 'REJECTED';
  if (store) {
    try {
      await store.reviewAliasProposal(proposal.proposalId, 'reject');
    } catch {
      // Graceful handling if offline or mock test environment
    }
  }
  emit('reject', { ...proposal });
}

function openUnifyModal(proposal: HitLProposal): void {
  unifyingProposal.value = proposal;
  selectedUnifyTargetId.value = proposal.targetEntityId || (props.availableEntities[0]?.entityId ?? '');
}

function closeUnifyModal(): void {
  unifyingProposal.value = null;
  selectedUnifyTargetId.value = '';
}

async function handleConfirmUnify(): Promise<void> {
  if (!unifyingProposal.value || !selectedUnifyTargetId.value) return;

  const targetEntity = props.availableEntities.find(
    (e) => e.entityId === selectedUnifyTargetId.value
  );

  const targetName = targetEntity ? targetEntity.canonicalName : unifyingProposal.value.targetCanonicalName;

  unifyingProposal.value.targetEntityId = selectedUnifyTargetId.value;
  unifyingProposal.value.targetCanonicalName = targetName;
  unifyingProposal.value.status = 'APPROVED';
  unifyingProposal.value.isCanon = true;

  if (store) {
    try {
      await store.reviewAliasProposal(
        unifyingProposal.value.proposalId,
        'approve',
        selectedUnifyTargetId.value
      );
    } catch {
      // Graceful handling if offline or mock test environment
    }
  }

  emit('unify', {
    proposal: { ...unifyingProposal.value },
    targetEntityId: selectedUnifyTargetId.value,
    targetCanonicalName: targetName,
  });

  closeUnifyModal();
}

function getConfidenceBadgeClass(score: number): string {
  if (score >= 0.85) {
    return 'bg-emerald-950/60 text-emerald-300 border-emerald-700/60';
  }
  if (score >= 0.6) {
    return 'bg-amber-950/60 text-amber-300 border-amber-700/60';
  }
  return 'bg-rose-950/60 text-rose-300 border-rose-700/60';
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header & Summary Stats -->
    <div class="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 class="text-xl font-bold text-slate-100 flex items-center gap-2">
            <span class="inline-block w-3 h-3 rounded-full bg-cyan-400"></span>
            Cola de Aprobación HitL (Human-in-the-Loop)
          </h2>
          <p class="text-xs text-slate-400 mt-1">
            Revisión y curaduría de alias y candidatos de co-referencia identificados por el pipeline de ingesta masiva.
          </p>
        </div>
        <div class="flex items-center gap-3">
          <span class="px-3 py-1 rounded-full text-xs font-mono bg-slate-800 text-slate-300 border border-slate-700">
            Pendientes: {{ proposals.filter(p => p.status === 'PENDING').length }}
          </span>
          <span class="px-3 py-1 rounded-full text-xs font-mono bg-emerald-950/40 text-emerald-400 border border-emerald-800">
            Aprobados: {{ proposals.filter(p => p.status === 'APPROVED').length }}
          </span>
        </div>
      </div>

      <!-- Filters Bar: Certeza/Afinidad, Dominio, Estado -->
      <div class="mt-6 pt-5 border-t border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-4">
        <!-- Filter Dominio -->
        <div class="space-y-1.5">
          <label class="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Dominio
          </label>
          <select
            v-model="selectedDomain"
            class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition"
          >
            <option value="ALL">Todos los dominios</option>
            <option v-for="dom in availableDomains" :key="dom" :value="dom">
              {{ dom }}
            </option>
          </select>
        </div>

        <!-- Filter Certeza / Afinidad -->
        <div class="space-y-1.5">
          <div class="flex justify-between items-center">
            <label class="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Afinidad Mínima
            </label>
            <span class="text-xs font-mono text-cyan-400">{{ (minConfidence * 100).toFixed(0) }}%</span>
          </div>
          <input
            v-model.number="minConfidence"
            type="range"
            min="0"
            max="1"
            step="0.05"
            class="w-full accent-cyan-400 cursor-pointer"
          />
        </div>

        <!-- Filter Estado -->
        <div class="space-y-1.5">
          <label class="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Estado
          </label>
          <select
            v-model="selectedStatus"
            class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition"
          >
            <option value="ALL">Todos los estados</option>
            <option value="PENDING">Pendientes</option>
            <option value="APPROVED">Aprobados</option>
            <option value="REJECTED">Rechazados</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Proposals List -->
    <div v-if="filteredProposals.length === 0" class="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-500 text-sm">
      No hay candidatos de alias que coincidan con los filtros seleccionados.
    </div>

    <div v-else class="grid grid-cols-1 gap-4">
      <div
        v-for="item in filteredProposals"
        :key="item.proposalId"
        class="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition space-y-4"
      >
        <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div class="space-y-1">
            <div class="flex items-center gap-2.5 flex-wrap">
              <span class="text-lg font-bold text-amber-300 font-serif">
                "{{ item.candidateName }}"
              </span>
              <span class="text-slate-500 text-sm">➔</span>
              <span class="text-base font-semibold text-cyan-300">
                {{ item.targetCanonicalName }}
              </span>
              <span class="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                ID: {{ item.targetEntityId }}
              </span>
            </div>
            <div class="flex items-center gap-2 pt-1 text-xs text-slate-400">
              <span class="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 font-mono text-[11px]">
                {{ item.domain }}
              </span>
              <span>Propuesto: {{ new Date(item.createdAt).toLocaleDateString() }}</span>
            </div>
          </div>

          <!-- Badges: Score & Status -->
          <div class="flex items-center gap-2 self-start">
            <span
              class="px-2.5 py-1 rounded text-xs font-mono border"
              :class="getConfidenceBadgeClass(item.confidenceScore)"
            >
              Certeza: {{ (item.confidenceScore * 100).toFixed(1) }}%
            </span>

            <span
              class="px-2.5 py-1 rounded text-xs font-mono uppercase tracking-wider"
              :class="{
                'bg-amber-950/50 text-amber-300 border border-amber-800/60': item.status === 'PENDING',
                'bg-emerald-950/50 text-emerald-300 border border-emerald-800/60': item.status === 'APPROVED',
                'bg-rose-950/50 text-rose-300 border border-rose-800/60': item.status === 'REJECTED',
              }"
            >
              {{ item.status }}
            </span>
          </div>
        </div>

        <!-- Extract context if present -->
        <div v-if="item.context" class="p-3 bg-slate-950/70 rounded-lg border border-slate-800 text-xs text-slate-300 italic">
          <span class="not-italic font-semibold text-slate-400">Contexto narrativo: </span>
          "{{ item.context }}"
        </div>

        <!-- HitL Action Buttons -->
        <div class="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
          <div class="text-xs text-slate-400 flex items-center gap-2">
            <span class="inline-block w-2 h-2 rounded-full" :class="item.isCanon ? 'bg-emerald-400' : 'bg-slate-600'"></span>
            <span>{{ item.isCanon ? 'Canonizado (is_canon=1)' : 'Borrador preliminar (is_canon=0)' }}</span>
          </div>

          <div class="flex items-center gap-2">
            <!-- Botón Aprobar -->
            <button
              type="button"
              :disabled="item.status === 'APPROVED'"
              @click="handleApprove(item)"
              class="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white transition flex items-center gap-1.5 shadow-sm"
              title="Aprobar alias y marcar como canónico (is_canon=1)"
            >
              <span>✓</span>
              <span>Aprobar (is_canon=1)</span>
            </button>

            <!-- Botón Rechazar -->
            <button
              type="button"
              :disabled="item.status === 'REJECTED'"
              @click="handleReject(item)"
              class="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-rose-700 hover:bg-rose-600 disabled:opacity-40 text-white transition flex items-center gap-1.5 shadow-sm"
              title="Rechazar asociación de alias"
            >
              <span>✕</span>
              <span>Rechazar</span>
            </button>

            <!-- Botón Unificar Entidad -->
            <button
              type="button"
              @click="openUnifyModal(item)"
              class="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 transition flex items-center gap-1.5 shadow-sm"
              title="Reasignar o unificar con otra entidad canónica"
            >
              <span>🔗</span>
              <span>Unificar entidad</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal para Unificar Entidad -->
    <div
      v-if="unifyingProposal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
    >
      <div class="bg-slate-900 border border-slate-700 rounded-xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
        <div>
          <h3 class="text-lg font-bold text-slate-100 flex items-center gap-2">
            <span>🔗</span> Unificar Entidad Canónica
          </h3>
          <p class="text-xs text-slate-400 mt-1">
            Asigna el alias candidato <strong>"{{ unifyingProposal.candidateName }}"</strong> a una entidad canónica existente.
          </p>
        </div>

        <div class="space-y-3">
          <label class="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Seleccionar Entidad Destino
          </label>
          <select
            v-model="selectedUnifyTargetId"
            class="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition"
          >
            <option
              v-for="entity in availableEntities"
              :key="entity.entityId"
              :value="entity.entityId"
            >
              {{ entity.canonicalName }} ({{ entity.domain }} - ID: {{ entity.entityId }})
            </option>
          </select>
        </div>

        <div class="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <button
            type="button"
            @click="closeUnifyModal"
            class="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          >
            Cancelar
          </button>
          <button
            type="button"
            :disabled="!selectedUnifyTargetId"
            @click="handleConfirmUnify"
            class="px-4 py-2 rounded-lg text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white transition"
          >
            Confirmar Unificación
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
