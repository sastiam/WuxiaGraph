<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';

export interface GovernanceProposal {
  id: string;
  title: string;
  summary: string;
  proposer: string;
  category: 'CANON_EXPANSION' | 'ENTITY_REVISION' | 'RULE_AMENDMENT';
  requiredHours: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  votesFor: number;
  votesAgainst: number;
  userVote?: 'FOR' | 'AGAINST';
  createdAt: string;
}

export interface WipStatus {
  weekStartDate: string;
  totalHoursLogged: number;
  maxBudgetHours: number;
  remainingHours: number;
  branchesOpenedCount: number;
  status: 'IN_LIMITS' | 'LOCKED_BY_WIP';
  isLocked: boolean;
}

const wipStatus = ref<WipStatus>({
  weekStartDate: '',
  totalHoursLogged: 0,
  maxBudgetHours: 4.0,
  remainingHours: 4.0,
  branchesOpenedCount: 0,
  status: 'IN_LIMITS',
  isLocked: false,
});

const isWipLoading = ref(false);
const hoursToLog = ref(0.5);
const logSuccessMessage = ref<string | null>(null);
const error = ref<string | null>(null);

// Proposals state
const proposals = ref<GovernanceProposal[]>([
  {
    id: 'prop-001',
    title: 'Adición Canónica: Valle del Arce Amarillo (黄枫谷)',
    summary: 'Registrar la secta del Valle del Arce Amarillo en el dominio jianghu y sus 7 picos ancestrales.',
    proposer: 'Hermes Agent',
    category: 'CANON_EXPANSION',
    requiredHours: 0.8,
    status: 'PENDING',
    votesFor: 3,
    votesAgainst: 0,
    createdAt: '2026-10-20T14:30:00Z',
  },
  {
    id: 'prop-002',
    title: 'Revisión de Jerarquía: Píldora de Establecimiento de Fundación',
    summary: 'Actualizar atributos de la píldora Zhuji Dan para requerir 3 hierbas celestiales milenarias.',
    proposer: 'Han Li (Curator)',
    category: 'ENTITY_REVISION',
    requiredHours: 0.5,
    status: 'PENDING',
    votesFor: 2,
    votesAgainst: 1,
    createdAt: '2026-10-20T18:15:00Z',
  },
  {
    id: 'prop-003',
    title: 'Enmienda de Regla: Tolerancia de Circuit Breaker 4.0h',
    summary: 'Establecer bloqueo preventivo a las 3.9h con alerta amarilla y bloqueo estricto a las 4.0h.',
    proposer: 'Governance Council',
    category: 'RULE_AMENDMENT',
    requiredHours: 0.4,
    status: 'PENDING',
    votesFor: 5,
    votesAgainst: 0,
    createdAt: '2026-10-21T02:00:00Z',
  },
]);

// New Proposal form modal/state
const showNewProposalModal = ref(false);
const newTitle = ref('');
const newSummary = ref('');
const newProposer = ref('');
const newCategory = ref<'CANON_EXPANSION' | 'ENTITY_REVISION' | 'RULE_AMENDMENT'>('CANON_EXPANSION');
const newRequiredHours = ref(0.5);

// Filter
const selectedFilter = ref<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');

const filteredProposals = computed(() => {
  if (selectedFilter.value === 'ALL') {
    return proposals.value;
  }
  return proposals.value.filter((p) => p.status === selectedFilter.value);
});

const progressPercentage = computed(() => {
  if (wipStatus.value.maxBudgetHours <= 0) return 0;
  const pct = (wipStatus.value.totalHoursLogged / wipStatus.value.maxBudgetHours) * 100;
  return Math.min(Math.max(pct, 0), 100);
});

async function fetchWipStatus(): Promise<void> {
  isWipLoading.value = true;
  error.value = null;

  try {
    const response = await fetch('/api/v1/wip/status');
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const json = (await response.json()) as {
      success: boolean;
      data: {
        weekStartDate: string;
        totalHoursLogged: number;
        maxBudgetHours: number;
        remainingHours: number;
        branchesOpenedCount: number;
        status: 'IN_LIMITS' | 'LOCKED_BY_WIP';
      };
    };

    if (json.data) {
      const data = json.data;
      const isLocked = data.status === 'LOCKED_BY_WIP' || data.totalHoursLogged >= (data.maxBudgetHours ?? 4.0);
      wipStatus.value = {
        weekStartDate: data.weekStartDate,
        totalHoursLogged: data.totalHoursLogged,
        maxBudgetHours: data.maxBudgetHours ?? 4.0,
        remainingHours: data.remainingHours ?? Math.max(0, (data.maxBudgetHours ?? 4.0) - data.totalHoursLogged),
        branchesOpenedCount: data.branchesOpenedCount,
        status: isLocked ? 'LOCKED_BY_WIP' : data.status,
        isLocked,
      };
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error al consultar estado WIP';
    error.value = message;
  } finally {
    isWipLoading.value = false;
  }
}

async function handleLogHours(): Promise<void> {
  if (hoursToLog.value <= 0) return;

  isWipLoading.value = true;
  error.value = null;
  logSuccessMessage.value = null;

  try {
    const response = await fetch('/api/v1/wip/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hours: Number(hoursToLog.value) }),
    });

    if (response.status === 423) {
      const errJson = (await response.json().catch(() => ({}))) as { message?: string };
      wipStatus.value.isLocked = true;
      wipStatus.value.status = 'LOCKED_BY_WIP';
      error.value = `HTTP 423 Locked: ${errJson.message ?? 'Límite de 4.0h excedido. Circuit breaker activado.'}`;
      return;
    }

    if (!response.ok) {
      const errJson = (await response.json().catch(() => ({}))) as { message?: string };
      throw new Error(errJson.message || `Error del servidor: HTTP ${response.status}`);
    }

    const json = (await response.json()) as {
      success: boolean;
      data: {
        weekStartDate: string;
        totalHoursLogged: number;
        maxBudgetHours: number;
        remainingHours: number;
        branchesOpenedCount: number;
        status: 'IN_LIMITS' | 'LOCKED_BY_WIP';
      };
    };

    const data = json.data;
    const isLocked = data.status === 'LOCKED_BY_WIP' || data.totalHoursLogged >= (data.maxBudgetHours ?? 4.0);
    wipStatus.value = {
      weekStartDate: data.weekStartDate,
      totalHoursLogged: data.totalHoursLogged,
      maxBudgetHours: data.maxBudgetHours ?? 4.0,
      remainingHours: data.remainingHours ?? Math.max(0, (data.maxBudgetHours ?? 4.0) - data.totalHoursLogged),
      branchesOpenedCount: data.branchesOpenedCount,
      status: isLocked ? 'LOCKED_BY_WIP' : data.status,
      isLocked,
    };

    logSuccessMessage.value = `Se registraron ${hoursToLog.value}h exitosamente en /api/v1/wip/log.`;
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'Error al registrar horas WIP';
  } finally {
    isWipLoading.value = false;
  }
}

function castVote(proposalId: string, decision: 'FOR' | 'AGAINST'): void {
  const proposal = proposals.value.find((p) => p.id === proposalId);
  if (!proposal || proposal.status !== 'PENDING') return;

  if (proposal.userVote === decision) {
    // Deshacer voto
    if (decision === 'FOR') proposal.votesFor--;
    else proposal.votesAgainst--;
    proposal.userVote = undefined;
    return;
  }

  if (proposal.userVote === 'FOR') proposal.votesFor--;
  if (proposal.userVote === 'AGAINST') proposal.votesAgainst--;

  if (decision === 'FOR') {
    proposal.votesFor++;
  } else {
    proposal.votesAgainst++;
  }
  proposal.userVote = decision;

  // Auto-resolución si supera umbral democrático
  if (proposal.votesFor >= 4) {
    proposal.status = 'APPROVED';
  } else if (proposal.votesAgainst >= 3) {
    proposal.status = 'REJECTED';
  }
}

function handleCreateProposal(): void {
  if (!newTitle.value.trim() || !newSummary.value.trim()) return;

  const newProp: GovernanceProposal = {
    id: `prop-${Date.now().toString().slice(-4)}`,
    title: newTitle.value.trim(),
    summary: newSummary.value.trim(),
    proposer: newProposer.value.trim() || 'Anonymous Scholar',
    category: newCategory.value,
    requiredHours: Number(newRequiredHours.value) || 0.5,
    status: 'PENDING',
    votesFor: 1,
    votesAgainst: 0,
    userVote: 'FOR',
    createdAt: new Date().toISOString(),
  };

  proposals.value.unshift(newProp);
  newTitle.value = '';
  newSummary.value = '';
  newProposer.value = '';
  newRequiredHours.value = 0.5;
  showNewProposalModal.value = false;
}

onMounted(() => {
  void fetchWipStatus();
});
</script>

<template>
  <div class="space-y-6">
    <!-- Header / WIP Circuit Breaker Status Banner -->
    <section class="bg-slate-900 border border-slate-800 rounded-xl p-6 relative overflow-hidden shadow-lg">
      <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div class="space-y-2">
          <div class="flex items-center gap-3">
            <span class="text-xs font-mono tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              Gobernanza Semanal &bull; Regla 4.0h
            </span>
            <span
              class="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold uppercase tracking-wider border"
              :class="wipStatus.isLocked
                ? 'bg-rose-950/80 text-rose-300 border-rose-700 animate-pulse'
                : 'bg-emerald-950/80 text-emerald-300 border-emerald-700'"
            >
              {{ wipStatus.isLocked ? 'CIRCUIT BREAKER: LOCKED_BY_WIP' : 'ESTADO: IN_LIMITS' }}
            </span>
          </div>

          <h2 class="text-2xl font-bold text-slate-100 flex items-center gap-2">
            Presupuesto WIP (Work-In-Progress)
          </h2>
          <p class="text-xs text-slate-400 max-w-xl leading-relaxed">
            Monitoreo estricto del límite de 4.0 horas semanales. Al superar el umbral, la API responde con
            <code class="text-amber-300 font-mono">HTTP 423 Locked</code> para proteger el ancho de banda del proyecto.
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-3">
          <!-- Direct Log WIP hours control -->
          <form @submit.prevent="handleLogHours" class="flex items-center gap-2 bg-slate-950 p-1.5 rounded-lg border border-slate-800">
            <input
              v-model.number="hoursToLog"
              type="number"
              step="0.1"
              min="0.1"
              max="4.0"
              :disabled="wipStatus.isLocked || isWipLoading"
              class="w-20 px-2 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-slate-200 font-mono focus:outline-none focus:ring-1 focus:ring-amber-500 disabled:opacity-50"
            />
            <button
              type="submit"
              :disabled="wipStatus.isLocked || isWipLoading"
              class="px-3 py-1 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 text-xs font-bold rounded transition"
            >
              + Registrar /api/v1/wip/log
            </button>
          </form>

          <button
            type="button"
            :disabled="isWipLoading"
            @click="fetchWipStatus"
            class="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 border border-slate-700 transition"
          >
            <span :class="{ 'animate-spin': isWipLoading }">⟳</span>
            {{ isWipLoading ? 'Sincronizando...' : 'Actualizar' }}
          </button>
          <button
            type="button"
            @click="showNewProposalModal = true"
            class="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold transition shadow-sm"
          >
            + Nueva Propuesta
          </button>
        </div>
      </div>

      <!-- Feedback messages -->
      <div v-if="logSuccessMessage" class="mt-4 p-2.5 bg-emerald-950/80 border border-emerald-800 rounded text-xs text-emerald-300">
        ✓ {{ logSuccessMessage }}
      </div>
      <div v-if="error" class="mt-4 p-2.5 bg-rose-950/80 border border-rose-800 rounded text-xs text-rose-300 font-medium">
        ⚠️ {{ error }}
      </div>

      <!-- Progress Meter -->
      <div class="mt-6 space-y-2">
        <div class="flex justify-between items-baseline text-xs font-mono">
          <span class="text-slate-300">
            Horas Registradas:
            <strong :class="wipStatus.isLocked ? 'text-rose-400 font-bold' : 'text-amber-400 font-bold'">
              {{ wipStatus.totalHoursLogged.toFixed(2) }}h
            </strong>
            / {{ wipStatus.maxBudgetHours.toFixed(1) }}h
          </span>
          <span class="text-slate-400">
            Restante:
            <strong :class="wipStatus.remainingHours <= 0 ? 'text-rose-400' : 'text-emerald-400'">
              {{ wipStatus.remainingHours.toFixed(2) }}h
            </strong>
            &bull; Ramas: {{ wipStatus.branchesOpenedCount }}
          </span>
        </div>

        <div class="w-full bg-slate-950 h-3.5 rounded-full overflow-hidden p-0.5 border border-slate-800">
          <div
            class="h-full rounded-full transition-all duration-500 ease-out"
            :class="wipStatus.isLocked ? 'bg-gradient-to-r from-amber-500 to-rose-600' : 'bg-gradient-to-r from-emerald-500 to-amber-400'"
            :style="{ width: `${progressPercentage}%` }"
          ></div>
        </div>
      </div>

      <!-- Warning Alert if locked -->
      <div
        v-if="wipStatus.isLocked"
        class="mt-4 p-3 bg-rose-950/80 border border-rose-700 rounded-lg text-rose-200 text-xs flex items-center gap-3 shadow-lg animate-pulse"
      >
        <span class="text-2xl">🚨</span>
        <div>
          <span class="font-bold text-rose-100">LÍMITE DE CUOTA ALCANZADO (HTTP 423 LOCKED):</span> Se ha alcanzado o superado
          el límite de 4.0 horas semanales. Todas las operaciones de mutación, log y síntesis están bloqueadas.
        </div>
      </div>
    </section>

    <!-- Proposals Governance Controls -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div class="flex items-center gap-2">
        <h3 class="text-lg font-bold text-slate-100">
          Propuestas de Gobernanza
        </h3>
        <span class="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-mono">
          {{ filteredProposals.length }}
        </span>
      </div>

      <!-- Filters -->
      <div class="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-lg text-xs font-medium">
        <button
          type="button"
          @click="selectedFilter = 'ALL'"
          class="px-3 py-1 rounded transition"
          :class="selectedFilter === 'ALL' ? 'bg-slate-800 text-amber-300 font-bold' : 'text-slate-400 hover:text-slate-200'"
        >
          Todas
        </button>
        <button
          type="button"
          @click="selectedFilter = 'PENDING'"
          class="px-3 py-1 rounded transition"
          :class="selectedFilter === 'PENDING' ? 'bg-slate-800 text-amber-300 font-bold' : 'text-slate-400 hover:text-slate-200'"
        >
          Pendientes
        </button>
        <button
          type="button"
          @click="selectedFilter = 'APPROVED'"
          class="px-3 py-1 rounded transition"
          :class="selectedFilter === 'APPROVED' ? 'bg-slate-800 text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'"
        >
          Aprobadas
        </button>
        <button
          type="button"
          @click="selectedFilter = 'REJECTED'"
          class="px-3 py-1 rounded transition"
          :class="selectedFilter === 'REJECTED' ? 'bg-slate-800 text-rose-400 font-bold' : 'text-slate-400 hover:text-slate-200'"
        >
          Rechazadas
        </button>
      </div>
    </div>

    <!-- Proposals List -->
    <div v-if="filteredProposals.length === 0" class="p-8 text-center bg-slate-900 border border-slate-800 rounded-xl text-slate-500 text-sm">
      No hay propuestas en la categoría seleccionada.
    </div>

    <div v-else class="grid grid-cols-1 gap-4">
      <article
        v-for="prop in filteredProposals"
        :key="prop.id"
        class="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 hover:border-slate-700 transition"
      >
        <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div class="space-y-1">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="text-xs font-mono font-bold text-slate-400">
                {{ prop.id }}
              </span>
              <span
                class="px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider border"
                :class="{
                  'bg-sky-950 text-sky-300 border-sky-800': prop.category === 'CANON_EXPANSION',
                  'bg-purple-950 text-purple-300 border-purple-800': prop.category === 'ENTITY_REVISION',
                  'bg-amber-950 text-amber-300 border-amber-800': prop.category === 'RULE_AMENDMENT',
                }"
              >
                {{ prop.category.replace('_', ' ') }}
              </span>
              <span
                class="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider"
                :class="{
                  'bg-amber-950/80 text-amber-300 border border-amber-800': prop.status === 'PENDING',
                  'bg-emerald-950/80 text-emerald-300 border border-emerald-800': prop.status === 'APPROVED',
                  'bg-rose-950/80 text-rose-300 border border-rose-800': prop.status === 'REJECTED',
                }"
              >
                {{ prop.status }}
              </span>
            </div>
            <h4 class="text-base font-bold text-slate-100">
              {{ prop.title }}
            </h4>
          </div>

          <div class="text-right text-xs text-slate-400 shrink-0">
            <div>Costo Estimado: <strong class="text-amber-400 font-mono">{{ prop.requiredHours }}h</strong></div>
            <div class="text-[11px] text-slate-500 mt-0.5">Propuesto por: {{ prop.proposer }}</div>
          </div>
        </div>

        <p class="text-sm text-slate-300 leading-relaxed bg-slate-950/50 p-3 rounded-lg border border-slate-800/80">
          {{ prop.summary }}
        </p>

        <!-- Voting Footer -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-800/80 text-xs">
          <div class="flex items-center gap-4 text-slate-400">
            <span class="flex items-center gap-1.5">
              <span class="inline-block w-2 h-2 rounded-full bg-emerald-400"></span>
              A favor: <strong class="text-emerald-400 font-mono">{{ prop.votesFor }}</strong>
            </span>
            <span class="flex items-center gap-1.5">
              <span class="inline-block w-2 h-2 rounded-full bg-rose-400"></span>
              En contra: <strong class="text-rose-400 font-mono">{{ prop.votesAgainst }}</strong>
            </span>
          </div>

          <!-- Vote Actions (Only enabled if pending & not locked) -->
          <div class="flex items-center gap-2">
            <button
              type="button"
              :disabled="prop.status !== 'PENDING' || wipStatus.isLocked"
              @click="castVote(prop.id, 'FOR')"
              class="px-3 py-1.5 rounded-lg border font-semibold flex items-center gap-1.5 transition disabled:opacity-40 disabled:cursor-not-allowed"
              :class="prop.userVote === 'FOR'
                ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                : 'bg-slate-800/80 hover:bg-emerald-950 text-slate-300 hover:text-emerald-300 border-slate-700'"
            >
              👍 {{ prop.userVote === 'FOR' ? 'Votado A Favor' : 'Votar A Favor' }}
            </button>
            <button
              type="button"
              :disabled="prop.status !== 'PENDING' || wipStatus.isLocked"
              @click="castVote(prop.id, 'AGAINST')"
              class="px-3 py-1.5 rounded-lg border font-semibold flex items-center gap-1.5 transition disabled:opacity-40 disabled:cursor-not-allowed"
              :class="prop.userVote === 'AGAINST'
                ? 'bg-rose-600 text-white border-rose-500 shadow-sm'
                : 'bg-slate-800/80 hover:bg-rose-950 text-slate-300 hover:text-rose-300 border-slate-700'"
            >
              👎 {{ prop.userVote === 'AGAINST' ? 'Votado En Contra' : 'Votar En Contra' }}
            </button>
          </div>
        </div>
      </article>
    </div>

    <!-- Modal for New Proposal -->
    <div
      v-if="showNewProposalModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
    >
      <div class="bg-slate-900 border border-slate-800 rounded-xl p-6 w-full max-w-lg space-y-4 shadow-2xl">
        <div class="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 class="text-lg font-bold text-slate-100">
            Crear Propuesta de Gobernanza
          </h3>
          <button
            type="button"
            @click="showNewProposalModal = false"
            class="text-slate-400 hover:text-slate-100 p-1 text-lg"
          >
            &times;
          </button>
        </div>

        <form @submit.prevent="handleCreateProposal" class="space-y-4 text-xs">
          <div>
            <label class="block text-slate-300 font-semibold mb-1">Título de la Propuesta</label>
            <input
              v-model="newTitle"
              type="text"
              required
              placeholder="Ej. Integración de la Secta de la Espada Celestial"
              class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-slate-300 font-semibold mb-1">Categoría</label>
              <select
                v-model="newCategory"
                class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="CANON_EXPANSION">Expansión de Canon</option>
                <option value="ENTITY_REVISION">Revisión de Entidades</option>
                <option value="RULE_AMENDMENT">Enmienda de Reglas</option>
              </select>
            </div>
            <div>
              <label class="block text-slate-300 font-semibold mb-1">Horas WIP Requeridas</label>
              <input
                v-model.number="newRequiredHours"
                type="number"
                step="0.1"
                min="0.1"
                max="4.0"
                required
                class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <div>
            <label class="block text-slate-300 font-semibold mb-1">Proponente</label>
            <input
              v-model="newProposer"
              type="text"
              placeholder="Tu nombre o identificador de agente"
              class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label class="block text-slate-300 font-semibold mb-1">Resumen &amp; Justificación</label>
            <textarea
              v-model="newSummary"
              required
              rows="4"
              placeholder="Describe detalladamente el alcance, impacto canónico y justificación de esta propuesta..."
              class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
            ></textarea>
          </div>

          <div class="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              @click="showNewProposalModal = false"
              class="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              class="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold"
            >
              Publicar Propuesta
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>