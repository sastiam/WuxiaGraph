<script setup lang="ts">
import { ref, computed } from 'vue';

export interface DistilledFactItem {
  factId?: string;
  entityId: string | null;
  factStatement: string;
  isCanon: boolean;
  chapterSource?: string;
}

export interface DistilledEntityItem {
  entityId: string;
  canonicalName: string;
  domain?: string;
  currentStatus?: string;
  attributes?: Record<string, unknown>;
}

export interface DistillSuccessData {
  domain: string;
  chapterSource: string;
  entities: DistilledEntityItem[];
  facts: DistilledFactItem[];
}

export interface DreamingLogEntry {
  id: string;
  timestamp: string;
  chapterSource: string;
  domain: string;
  status: 'SUCCESS' | 'ERROR' | 'LOCKED_BY_WIP';
  summary: string;
  entitiesCount: number;
  factsCount: number;
  rawResponse?: string;
}

const emit = defineEmits<{
  (e: 'dreamingCompleted', payload: DistillSuccessData): void;
}>();

// Form state
const chapterSource = ref('Capítulo 14: La Píldora del Dragón Celestial');
const domain = ref('jianghu');
const narrativeText = ref(
  'Han Li ingresó sigilosamente en la Cueva de la Niebla Púrpura. Encontró una Píldora del Dragón Celestial custodiada por una serpiente espectral de dos cabezas. Al consumir la mitad del elixir espiritual, su cultivo de Qi se disparó exponencialmente, superando el cuello de botella del noveno nivel.'
);

// Advanced JSON entities / facts toggle
const showAdvancedConfig = ref(false);
const customEntitiesJson = ref('[\n  {\n    "entityId": "ent_han_li",\n    "canonicalName": "Han Li (韩立)",\n    "currentStatus": "ALIVE"\n  }\n]');

// Execution state
const isDreaming = ref(false);
const resultMessage = ref<{ type: 'success' | 'error' | 'warning'; text: string } | null>(null);
const lastDistillResult = ref<DistillSuccessData | null>(null);

// Dreaming history logs
const logs = ref<DreamingLogEntry[]>([
  {
    id: 'log-001',
    timestamp: '2026-10-21T07:15:22Z',
    chapterSource: 'Capítulo 1: El Despertar',
    domain: 'jianghu',
    status: 'SUCCESS',
    summary: 'Destilación canónica inicial completada exitosamente.',
    entitiesCount: 2,
    factsCount: 4,
  },
  {
    id: 'log-002',
    timestamp: '2026-10-21T07:45:10Z',
    chapterSource: 'Capítulo 2: Encuentro en la Montaña',
    domain: 'jianghu',
    status: 'SUCCESS',
    summary: 'Destilación y vinculación de hechos a entidades existentes.',
    entitiesCount: 1,
    factsCount: 3,
  },
]);

// Filtered logs
const logSearch = ref('');
const filteredLogs = computed(() => {
  if (!logSearch.value.trim()) return logs.value;
  const q = logSearch.value.toLowerCase();
  return logs.value.filter(
    (l) =>
      l.chapterSource.toLowerCase().includes(q) ||
      l.domain.toLowerCase().includes(q) ||
      l.status.toLowerCase().includes(q)
  );
});

async function handleTriggerSynthesis(): Promise<void> {
  if (!chapterSource.value.trim()) {
    resultMessage.value = {
      type: 'error',
      text: 'El título o identificador del capítulo (chapterSource) es obligatorio.',
    };
    return;
  }

  if (!narrativeText.value.trim() && !customEntitiesJson.value.trim()) {
    resultMessage.value = {
      type: 'error',
      text: 'Debes ingresar un fragmento de prosa narrativa o entidades JSON para destilar.',
    };
    return;
  }

  isDreaming.value = true;
  resultMessage.value = null;

  let entitiesParsed: DistilledEntityItem[] | undefined;
  if (showAdvancedConfig.value && customEntitiesJson.value.trim()) {
    try {
      const parsed = JSON.parse(customEntitiesJson.value.trim());
      if (Array.isArray(parsed)) {
        entitiesParsed = parsed as DistilledEntityItem[];
      }
    } catch {
      resultMessage.value = {
        type: 'error',
        text: 'El JSON de entidades avanzadas contiene errores de sintaxis.',
      };
      isDreaming.value = false;
      return;
    }
  }

  const payload: Record<string, unknown> = {
    chapterSource: chapterSource.value.trim(),
    domain: domain.value.trim() || 'jianghu',
    text: narrativeText.value.trim() || undefined,
    entities: entitiesParsed,
  };

  try {
    const response = await fetch('/api/v1/dreaming/distill', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (response.status === 423) {
      // Circuit Breaker Locked
      const errJson = (await response.json().catch(() => ({}))) as { message?: string };
      const failLog: DreamingLogEntry = {
        id: `log-${Date.now().toString().slice(-4)}`,
        timestamp: new Date().toISOString(),
        chapterSource: chapterSource.value.trim(),
        domain: domain.value.trim() || 'jianghu',
        status: 'LOCKED_BY_WIP',
        summary: 'Bloqueado por Circuit Breaker: presupuesto semanal de 4.0h excedido.',
        entitiesCount: 0,
        factsCount: 0,
      };
      logs.value.unshift(failLog);
      resultMessage.value = {
        type: 'warning',
        text: `Circuit Breaker Bloqueado (423 Locked): ${errJson.message ?? 'Límite WIP semanal superado.'}`,
      };
      return;
    }

    if (!response.ok) {
      const errJson = (await response.json().catch(() => ({}))) as { message?: string; error?: string };
      throw new Error(errJson.message || `Error del servidor: HTTP ${response.status}`);
    }

    const responseData = (await response.json()) as {
      success: boolean;
      data: DistillSuccessData;
    };

    lastDistillResult.value = responseData.data;

    const successLog: DreamingLogEntry = {
      id: `log-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toISOString(),
      chapterSource: responseData.data.chapterSource,
      domain: responseData.data.domain,
      status: 'SUCCESS',
      summary: `Destilación completada con éxito. Se guardaron ${responseData.data.entities.length} entidades y ${responseData.data.facts.length} hechos.`,
      entitiesCount: responseData.data.entities.length,
      factsCount: responseData.data.facts.length,
      rawResponse: JSON.stringify(responseData.data, null, 2),
    };

    logs.value.unshift(successLog);

    resultMessage.value = {
      type: 'success',
      text: `¡Destilación narrada exitosa! Se extrajeron ${responseData.data.facts.length} hechos y ${responseData.data.entities.length} entidades canónicas.`,
    };

    emit('dreamingCompleted', responseData.data);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Error inesperado durante la destilación';
    resultMessage.value = {
      type: 'error',
      text: errorMsg,
    };

    const failLog: DreamingLogEntry = {
      id: `log-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toISOString(),
      chapterSource: chapterSource.value.trim(),
      domain: domain.value.trim() || 'jianghu',
      status: 'ERROR',
      summary: `Fallo de destilación: ${errorMsg}`,
      entitiesCount: 0,
      factsCount: 0,
    };
    logs.value.unshift(failLog);
  } finally {
    isDreaming.value = false;
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header info banner -->
    <section class="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg space-y-2">
      <div class="flex items-center gap-2">
        <span class="w-2.5 h-2.5 rounded-full bg-violet-400 animate-pulse"></span>
        <h2 class="text-2xl font-bold text-slate-100">
          Consola Dreaming (Síntesis de Lore con IA)
        </h2>
      </div>
      <p class="text-xs text-slate-400 max-w-3xl leading-relaxed">
        Ingresa prosa narrativa de capítulos de novelas wuxia/xianxia. El motor de destilación
        extraerá automáticamente los hechos narrativos (<code class="text-amber-300 font-mono">narrative_facts</code>),
        los asociará a las entidades canónicas (<code class="text-amber-300 font-mono">lore_entities</code>)
        y respetará el Circuit Breaker de gobernanza WIP antes de persistir atómicamente en SQLite WAL.
      </p>
    </section>

    <!-- Feedback alert banner -->
    <div
      v-if="resultMessage"
      class="p-4 rounded-lg text-xs font-medium border flex items-start justify-between gap-3 transition"
      :class="{
        'bg-emerald-950/70 border-emerald-800 text-emerald-200': resultMessage.type === 'success',
        'bg-rose-950/70 border-rose-800 text-rose-200': resultMessage.type === 'error',
        'bg-amber-950/70 border-amber-800 text-amber-200': resultMessage.type === 'warning',
      }"
    >
      <div class="flex items-center gap-2">
        <span class="text-base">
          {{ resultMessage.type === 'success' ? '✓' : resultMessage.type === 'error' ? '✕' : '⚠️' }}
        </span>
        <span>{{ resultMessage.text }}</span>
      </div>
      <button
        type="button"
        @click="resultMessage = null"
        class="text-slate-400 hover:text-white p-0.5 text-sm"
      >
        &times;
      </button>
    </div>

    <!-- Main Grid: Synthesis Input form & Inspection Log -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <!-- Input synthesis form (7 cols) -->
      <section class="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div class="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 class="font-bold text-slate-200 text-sm flex items-center gap-2">
            <span>⚡</span>
            <span>Disparador de Síntesis Narrativa</span>
          </h3>
          <span class="text-[11px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
            POST /api/v1/dreaming/distill
          </span>
        </div>

        <form @submit.prevent="handleTriggerSynthesis" class="space-y-4 text-xs">
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div class="sm:col-span-2">
              <label class="block text-slate-300 font-semibold mb-1">Fuente del Capítulo (chapterSource)</label>
              <input
                v-model="chapterSource"
                type="text"
                required
                placeholder="Ej. Capítulo 1: El Reino Mortal"
                class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono text-xs"
              />
            </div>
            <div>
              <label class="block text-slate-300 font-semibold mb-1">Dominio</label>
              <input
                v-model="domain"
                type="text"
                required
                placeholder="jianghu"
                class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono text-xs"
              />
            </div>
          </div>

          <div>
            <div class="flex items-center justify-between mb-1">
              <label class="block text-slate-300 font-semibold">
                Prosa Narrativa del Capítulo (Texto a destilar)
              </label>
              <span class="text-[11px] text-slate-500">
                Soporta Unicode &amp; Caracteres Orientales
              </span>
            </div>
            <textarea
              v-model="narrativeText"
              rows="6"
              placeholder="Pega aquí el texto del capítulo en español, inglés o caracteres chinos (ej. 韩立进入了黄枫谷)..."
              class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 font-sans text-xs leading-relaxed"
            ></textarea>
          </div>

          <!-- Advanced Toggle for JSON Entities Injection -->
          <div class="border-t border-slate-800/80 pt-3">
            <button
              type="button"
              @click="showAdvancedConfig = !showAdvancedConfig"
              class="text-slate-400 hover:text-amber-400 flex items-center gap-1.5 transition text-xs font-semibold"
            >
              <span>{{ showAdvancedConfig ? '▼' : '▶' }}</span>
              <span>Inyección Avanzada de Entidades (Opcional)</span>
            </button>

            <div v-if="showAdvancedConfig" class="mt-2 space-y-1">
              <p class="text-[11px] text-slate-400">
                Define explícitamente entidades que deben ser creadas o actualizadas durante este lote:
              </p>
              <textarea
                v-model="customEntitiesJson"
                rows="4"
                class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg font-mono text-[11px] text-amber-200/90 focus:outline-none focus:ring-2 focus:ring-amber-500"
              ></textarea>
            </div>
          </div>

          <!-- Trigger Button -->
          <div class="pt-2 flex items-center justify-between">
            <span class="text-[11px] text-slate-500">
              Preservación estricta de Foreign Keys y WAL atómico.
            </span>
            <button
              type="submit"
              :disabled="isDreaming"
              class="px-5 py-2.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold flex items-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md text-xs"
            >
              <span v-if="isDreaming" class="animate-spin">⟳</span>
              <span>{{ isDreaming ? 'Destilando Hechos...' : '✨ Iniciar Síntesis Dreaming' }}</span>
            </button>
          </div>
        </form>

        <!-- Preview of Last Distillation Result -->
        <div v-if="lastDistillResult" class="mt-6 border-t border-slate-800 pt-4 space-y-3">
          <div class="flex items-center justify-between">
            <h4 class="font-bold text-slate-200 text-xs">
              Última Destilación Generada
            </h4>
            <span class="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
              {{ lastDistillResult.chapterSource }}
            </span>
          </div>

          <div class="grid grid-cols-2 gap-2 text-[11px] font-mono">
            <div class="p-2.5 bg-slate-950 rounded border border-slate-800">
              <span class="text-slate-400 block mb-0.5">Entidades:</span>
              <strong class="text-amber-400">{{ lastDistillResult.entities.length }} actualizadas</strong>
            </div>
            <div class="p-2.5 bg-slate-950 rounded border border-slate-800">
              <span class="text-slate-400 block mb-0.5">Hechos:</span>
              <strong class="text-sky-400">{{ lastDistillResult.facts.length }} destilados</strong>
            </div>
          </div>

          <!-- Fact pills -->
          <div class="space-y-1.5 max-h-40 overflow-y-auto pr-1">
            <div
              v-for="(f, i) in lastDistillResult.facts"
              :key="i"
              class="text-[11px] bg-slate-950/80 p-2 rounded border border-slate-800/80 text-slate-300 flex items-start gap-2"
            >
              <span class="text-amber-400 font-mono shrink-0">#{{ i + 1 }}</span>
              <span class="leading-tight">{{ f.factStatement }}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Dreaming Logs & Telemetry (5 cols) -->
      <section class="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 flex flex-col">
        <div class="flex items-center justify-between border-b border-slate-800 pb-3">
          <div class="flex items-center gap-2">
            <h3 class="font-bold text-slate-200 text-sm">
              Logs de Dreaming &amp; Auditoría
            </h3>
            <span class="text-[10px] font-mono bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">
              {{ filteredLogs.length }}
            </span>
          </div>

          <!-- Search logs -->
          <input
            v-model="logSearch"
            type="text"
            placeholder="Filtrar logs..."
            class="px-2.5 py-1 bg-slate-950 border border-slate-700 rounded text-[11px] text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500 w-28"
          />
        </div>

        <div v-if="filteredLogs.length === 0" class="text-slate-500 text-xs italic py-6 text-center">
          No hay registros de eventos de dreaming coincidentes.
        </div>

        <!-- Logs timeline list -->
        <div v-else class="space-y-3 overflow-y-auto max-h-[560px] pr-1">
          <article
            v-for="log in filteredLogs"
            :key="log.id"
            class="p-3.5 rounded-lg bg-slate-950/70 border border-slate-800/90 space-y-2 hover:border-slate-700 transition text-xs"
          >
            <div class="flex items-center justify-between">
              <span
                class="px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold border"
                :class="{
                  'bg-emerald-950 text-emerald-300 border-emerald-800': log.status === 'SUCCESS',
                  'bg-rose-950 text-rose-300 border-rose-800': log.status === 'ERROR',
                  'bg-amber-950 text-amber-300 border-amber-800': log.status === 'LOCKED_BY_WIP',
                }"
              >
                {{ log.status }}
              </span>
              <span class="text-[10px] font-mono text-slate-500">
                {{ new Date(log.timestamp).toLocaleTimeString() }}
              </span>
            </div>

            <div class="font-medium text-slate-200 text-xs leading-snug">
              {{ log.chapterSource }}
            </div>

            <p class="text-slate-400 text-[11px] leading-relaxed">
              {{ log.summary }}
            </p>

            <div class="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-1 border-t border-slate-800/50">
              <span>Dominio: <strong class="text-slate-400">{{ log.domain }}</strong></span>
              <span>Hechos: <strong class="text-sky-400">{{ log.factsCount }}</strong> | Entidades: <strong class="text-amber-400">{{ log.entitiesCount }}</strong></span>
            </div>
          </article>
        </div>
      </section>
    </div>
  </div>
</template>
