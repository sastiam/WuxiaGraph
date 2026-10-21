<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue';
import { VueFlow, type Node, type Edge, MarkerType } from '@vue-flow/core';
import { Background } from '@vue-flow/background';
import { Controls } from '@vue-flow/controls';
import type { LoreEntity, NarrativeFact } from '../stores/lore';

import '@vue-flow/core/dist/style.css';
import '@vue-flow/core/dist/theme-default.css';
import '@vue-flow/controls/dist/style.css';

export interface LoreRelationship {
  relationship_id?: string;
  relationshipId?: string;
  source_entity_id?: string;
  sourceEntityId?: string;
  target_entity_id?: string;
  targetEntityId?: string;
  relationship_type?: string;
  relationshipType?: string;
  affinity_weight?: number;
  affinityWeight?: number;
  description?: string | null;
}

interface Props {
  entities: LoreEntity[];
  facts: NarrativeFact[];
}

const props = withDefaults(defineProps<Props>(), {
  entities: () => [],
  facts: () => [],
});

// Control State
const depth = ref<number>(2);
const minAffinity = ref<number>(0);
const selectedDomain = ref<string>('all');
const selectedRootEntityId = ref<string>('');
const searchQuery = ref<string>('');
const filterCanonOnly = ref<boolean>(false);

// API State
const relationships = ref<LoreRelationship[]>([]);
const isLoadingRels = ref<boolean>(false);
const fetchError = ref<string | null>(null);

// Selected Element for Side Panel
interface SelectedDetails {
  type: 'entity' | 'fact' | 'relationship';
  id: string;
  title: string;
  entity?: LoreEntity;
  fact?: NarrativeFact;
  relationship?: LoreRelationship;
  connectedRelationships?: LoreRelationship[];
  linkedFacts?: NarrativeFact[];
}

const selectedDetails = ref<SelectedDetails | null>(null);

// Dynamic Domains List extracted from Entities
const availableDomains = computed(() => {
  const set = new Set<string>();
  props.entities.forEach((ent) => {
    if (ent.domain) set.add(ent.domain);
  });
  return Array.from(set);
});

// Fetch Relationships from API with depth query param
async function fetchGraphRelationships(): Promise<void> {
  isLoadingRels.value = true;
  fetchError.value = null;

  try {
    let url = `/api/v1/graph/relationships?depth=${depth.value}`;
    if (selectedRootEntityId.value) {
      url += `&entityId=${encodeURIComponent(selectedRootEntityId.value)}`;
    }

    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    const data = await res.json();
    if (Array.isArray(data)) {
      relationships.value = data;
    } else if (data && Array.isArray(data.relationships)) {
      relationships.value = data.relationships;
    } else {
      relationships.value = [];
    }
  } catch (err: unknown) {
    fetchError.value = err instanceof Error ? err.message : 'Error al consultar el servicio de grafos';
    relationships.value = [];
  } finally {
    isLoadingRels.value = false;
  }
}

// Watchers for depth and root entity changes
watch([depth, selectedRootEntityId], () => {
  void fetchGraphRelationships();
});

onMounted(() => {
  void fetchGraphRelationships();
});

// Compute VueFlow Nodes
const nodes = computed<Node[]>(() => {
  const nodeList: Node[] = [];
  const entityMap = new Map<string, LoreEntity>();

  // Filter entities by domain and search query
  let filteredEntities = props.entities;
  if (selectedDomain.value !== 'all') {
    filteredEntities = filteredEntities.filter((e) => e.domain === selectedDomain.value);
  }
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase();
    filteredEntities = filteredEntities.filter(
      (e) => e.canonicalName.toLowerCase().includes(q) || e.entityId.toLowerCase().includes(q)
    );
  }

  filteredEntities.forEach((ent) => entityMap.set(ent.entityId, ent));

  // Position entities in a circular arrangement
  const totalEnts = filteredEntities.length;
  const centerX = 350;
  const centerY = 280;
  const radius = Math.max(180, totalEnts * 35);

  filteredEntities.forEach((ent, index) => {
    const angle = (index / Math.max(totalEnts, 1)) * 2 * Math.PI;
    const x = centerX + Math.cos(angle) * radius;
    const y = centerY + Math.sin(angle) * radius;

    const isSelected = selectedDetails.value?.id === ent.entityId;

    nodeList.push({
      id: ent.entityId,
      label: ent.canonicalName,
      position: { x, y },
      data: {
        entity: ent,
        type: 'entity',
      },
      style: {
        background: isSelected ? '#1e293b' : '#0f172a',
        color: '#f8fafc',
        border: isSelected ? '2px solid #f59e0b' : '1.5px solid #d97706',
        borderRadius: '12px',
        padding: '10px 14px',
        fontWeight: 'bold',
        fontSize: '12px',
        boxShadow: isSelected ? '0 0 15px rgba(245, 158, 11, 0.4)' : '0 4px 6px -1px rgba(0, 0, 0, 0.5)',
      },
    });
  });

  // Filter and position facts
  let filteredFacts = props.facts;
  if (filterCanonOnly.value) {
    filteredFacts = filteredFacts.filter((f) => f.isCanon);
  }
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase();
    filteredFacts = filteredFacts.filter(
      (f) => f.factStatement.toLowerCase().includes(q) || (f.entityId && f.entityId.toLowerCase().includes(q))
    );
  }

  filteredFacts.forEach((fact, index) => {
    let x = centerX + (Math.sin(index * 2.1) * (radius + 120));
    let y = centerY + (Math.cos(index * 2.1) * (radius + 120));

    if (fact.entityId && entityMap.has(fact.entityId)) {
      const parentNode = nodeList.find((n) => n.id === fact.entityId);
      if (parentNode) {
        const offsetAngle = (index * 1.5) % (2 * Math.PI);
        x = parentNode.position.x + Math.cos(offsetAngle) * 110;
        y = parentNode.position.y + Math.sin(offsetAngle) * 110;
      }
    }

    const shortStatement =
      fact.factStatement.length > 25
        ? fact.factStatement.substring(0, 23) + '...'
        : fact.factStatement;

    const isSelected = selectedDetails.value?.id === fact.factId;

    nodeList.push({
      id: fact.factId,
      label: shortStatement,
      position: { x, y },
      data: {
        fact,
        type: 'fact',
      },
      style: {
        background: fact.isCanon ? '#064e3b' : '#451a03',
        color: fact.isCanon ? '#6ee7b7' : '#fcd34d',
        border: isSelected ? '2px solid #38bdf8' : fact.isCanon ? '1px solid #10b981' : '1px solid #f59e0b',
        borderRadius: '8px',
        padding: '6px 10px',
        fontSize: '11px',
      },
    });
  });

  return nodeList;
});

// Compute VueFlow Edges
const edges = computed<Edge[]>(() => {
  const edgeList: Edge[] = [];
  const nodeIds = new Set(nodes.value.map((n) => n.id));

  // 1. Relationships fetched from API (filtered by minAffinity)
  relationships.value.forEach((rel) => {
    const src = rel.source_entity_id ?? rel.sourceEntityId;
    const tgt = rel.target_entity_id ?? rel.targetEntityId;
    const relId = rel.relationship_id ?? rel.relationshipId ?? `rel-${src}-${tgt}`;
    const weight = rel.affinity_weight ?? rel.affinityWeight ?? 0;
    const typeStr = rel.relationship_type ?? rel.relationshipType ?? 'relates_to';

    if (src && tgt && nodeIds.has(src) && nodeIds.has(tgt) && weight >= minAffinity.value) {
      edgeList.push({
        id: relId,
        source: src,
        target: tgt,
        label: `${typeStr} (${weight})`,
        animated: weight > 0.5,
        style: { stroke: weight >= 0.7 ? '#10b981' : weight >= 0.4 ? '#f59e0b' : '#64748b', strokeWidth: 2 },
        markerEnd: MarkerType.ArrowClosed,
        data: { relationship: rel },
      });
    }
  });

  // 2. Fact links to entities
  props.facts.forEach((fact) => {
    if (fact.entityId && nodeIds.has(fact.entityId) && nodeIds.has(fact.factId)) {
      if (!filterCanonOnly.value || fact.isCanon) {
        edgeList.push({
          id: `link-fact-${fact.factId}`,
          source: fact.entityId,
          target: fact.factId,
          label: fact.chapterSource,
          style: { stroke: fact.isCanon ? '#059669' : '#d97706', strokeDasharray: fact.isCanon ? undefined : '4,4', strokeWidth: 1.2 },
          markerEnd: MarkerType.ArrowClosed,
        });
      }
    }
  });

  return edgeList;
});

// Handle Node Selection in Vue Flow
function handleNodeClick(event: { node: Node }): void {
  const clickedNode = event.node;
  const nodeType = clickedNode.data?.type as 'entity' | 'fact' | undefined;

  if (nodeType === 'entity') {
    const ent = clickedNode.data.entity as LoreEntity;
    const connectedRels = relationships.value.filter(
      (r) =>
        (r.source_entity_id ?? r.sourceEntityId) === ent.entityId ||
        (r.target_entity_id ?? r.targetEntityId) === ent.entityId
    );
    const linkedFacts = props.facts.filter((f) => f.entityId === ent.entityId);

    selectedDetails.value = {
      type: 'entity',
      id: ent.entityId,
      title: ent.canonicalName,
      entity: ent,
      connectedRelationships: connectedRels,
      linkedFacts,
    };
  } else if (nodeType === 'fact') {
    const fact = clickedNode.data.fact as NarrativeFact;
    selectedDetails.value = {
      type: 'fact',
      id: fact.factId,
      title: `Hecho: ${fact.factId}`,
      fact,
    };
  }
}

// Handle Edge Selection in Vue Flow
function handleEdgeClick(event: { edge: Edge }): void {
  const rel = event.edge.data?.relationship as LoreRelationship | undefined;
  if (rel) {
    const typeStr = rel.relationship_type ?? rel.relationshipType ?? 'Relación';
    const relId = rel.relationship_id ?? rel.relationshipId ?? event.edge.id;
    selectedDetails.value = {
      type: 'relationship',
      id: relId,
      title: `Relación: ${typeStr}`,
      relationship: rel,
    };
  }
}

function clearSelection(): void {
  selectedDetails.value = null;
}
</script>

<template>
  <div class="space-y-4">
    <!-- Filter and Control Header Bar -->
    <div class="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-3">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="flex items-center gap-2.5">
          <span class="inline-block w-3 h-3 rounded-full bg-amber-400"></span>
          <h2 class="text-base font-bold text-slate-100">
            Visualizador del Grafo de Lore (Vue Flow)
          </h2>
          <span class="text-xs bg-slate-800 border border-slate-700/60 px-2.5 py-1 rounded-full text-slate-300 font-mono">
            {{ nodes.length }} Nodos &bull; {{ edges.length }} Aristas
          </span>
        </div>

        <div class="flex items-center gap-2">
          <button
            type="button"
            @click="fetchGraphRelationships"
            :disabled="isLoadingRels"
            class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 transition flex items-center gap-1.5"
          >
            <span v-if="isLoadingRels" class="animate-spin">&circlearrowright;</span>
            <span>{{ isLoadingRels ? 'Cargando...' : 'Recargar Grafo' }}</span>
          </button>
        </div>
      </div>

      <!-- Controls & Filters Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 pt-2 border-t border-slate-800 text-xs">
        <!-- Depth Selector -->
        <div class="space-y-1">
          <label class="block font-semibold text-slate-400">Profundidad (Depth):</label>
          <div class="flex items-center gap-2">
            <input
              v-model.number="depth"
              type="range"
              min="1"
              max="5"
              step="1"
              class="w-full accent-amber-500 cursor-pointer"
            />
            <span class="font-mono bg-slate-950 px-2 py-0.5 rounded text-amber-400 font-bold border border-slate-800">
              {{ depth }}
            </span>
          </div>
        </div>

        <!-- Domain Filter -->
        <div class="space-y-1">
          <label class="block font-semibold text-slate-400">Dominio:</label>
          <select
            v-model="selectedDomain"
            class="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
          >
            <option value="all">Todos los Dominios</option>
            <option v-for="dom in availableDomains" :key="dom" :value="dom">
              {{ dom }}
            </option>
          </select>
        </div>

        <!-- Min Affinity Filter -->
        <div class="space-y-1">
          <label class="block font-semibold text-slate-400">Afinidad Mínima:</label>
          <div class="flex items-center gap-2">
            <input
              v-model.number="minAffinity"
              type="range"
              min="0"
              max="1"
              step="0.1"
              class="w-full accent-emerald-500 cursor-pointer"
            />
            <span class="font-mono bg-slate-950 px-2 py-0.5 rounded text-emerald-400 font-bold border border-slate-800">
              {{ minAffinity.toFixed(1) }}
            </span>
          </div>
        </div>

        <!-- Root Entity Pivot -->
        <div class="space-y-1">
          <label class="block font-semibold text-slate-400">Entidad Raíz (Pivot):</label>
          <select
            v-model="selectedRootEntityId"
            class="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
          >
            <option value="">Todas las entidades</option>
            <option v-for="ent in props.entities" :key="ent.entityId" :value="ent.entityId">
              {{ ent.canonicalName }}
            </option>
          </select>
        </div>

        <!-- Search & Canon Filter -->
        <div class="space-y-1 sm:col-span-2 md:col-span-1 flex flex-col justify-end gap-1.5">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Buscar por nombre..."
            class="w-full px-2.5 py-1 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
          <button
            type="button"
            @click="filterCanonOnly = !filterCanonOnly"
            :class="filterCanonOnly ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'"
            class="w-full px-2 py-1 rounded text-[11px] font-medium border border-slate-700 transition flex items-center justify-center gap-1"
          >
            <span class="w-2 h-2 rounded-full" :class="filterCanonOnly ? 'bg-white' : 'bg-emerald-400'"></span>
            Solo Canónico
          </button>
        </div>
      </div>

      <!-- Endpoint query notice -->
      <div class="text-[11px] font-mono text-slate-400 bg-slate-950/80 p-2 rounded border border-slate-800 flex items-center justify-between">
        <span>
          Consulta REST:
          <strong class="text-amber-300">GET /api/v1/graph/relationships?depth={{ depth }}</strong>
          <template v-if="selectedRootEntityId">&amp;entityId={{ selectedRootEntityId }}</template>
        </span>
        <span class="text-slate-400">
          Relaciones obtenidas: <span class="text-slate-200 font-bold">{{ relationships.length }}</span>
        </span>
      </div>
    </div>

    <!-- Error Banner -->
    <div
      v-if="fetchError"
      class="p-3 bg-red-950/60 border border-red-800 text-red-300 rounded-xl text-xs flex items-center justify-between"
    >
      <span><strong>Error al cargar relaciones:</strong> {{ fetchError }}</span>
      <button type="button" @click="fetchGraphRelationships" class="underline hover:text-white">
        Reintentar
      </button>
    </div>

    <!-- Canvas Container for Vue Flow -->
    <div class="relative w-full h-[580px] bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
      <VueFlow
        :nodes="nodes"
        :edges="edges"
        @node-click="handleNodeClick"
        @edge-click="handleEdgeClick"
        class="w-full h-full"
        :default-viewport="{ zoom: 0.95, x: 20, y: 20 }"
        fit-view-on-init
      >
        <Background pattern-color="#334155" :gap="24" />
        <Controls class="bg-slate-900 border border-slate-800 text-slate-200 rounded-lg" />
      </VueFlow>

      <!-- Empty state when no nodes -->
      <div
        v-if="nodes.length === 0 && !isLoadingRels"
        class="absolute inset-0 flex flex-col items-center justify-center text-slate-500 pointer-events-none"
      >
        <span class="text-3xl mb-2">&#127749;</span>
        <p class="text-sm font-medium">No se encontraron nodos para los filtros seleccionados</p>
        <p class="text-xs text-slate-600 mt-1">Ajusta la profundidad, dominio o borra la búsqueda</p>
      </div>

      <!-- Quick Legend Overlay -->
      <div class="absolute bottom-3 left-3 bg-slate-900/90 backdrop-blur border border-slate-800 rounded-lg p-2.5 text-[11px] space-y-1.5 text-slate-300 pointer-events-auto">
        <div class="font-semibold text-slate-400 text-[10px] uppercase tracking-wider">Leyenda Grafo</div>
        <div class="flex items-center gap-2">
          <span class="w-3 h-3 rounded bg-slate-900 border border-amber-500 inline-block"></span>
          <span>Entidad Canónica</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="w-3 h-2 rounded bg-emerald-900 border border-emerald-500 inline-block"></span>
          <span>Hecho Canónico</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="w-3 h-2 rounded bg-amber-950 border border-amber-500 inline-block"></span>
          <span>Hecho Borrador</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="w-4 h-0.5 bg-emerald-500 inline-block"></span>
          <span>Relación de Alta Afinidad</span>
        </div>
      </div>

      <!-- Interactive Side Details Panel -->
      <aside
        v-if="selectedDetails"
        class="absolute top-3 right-3 w-80 max-h-[92%] overflow-y-auto bg-slate-900/95 backdrop-blur border border-slate-700 rounded-xl p-4 shadow-2xl text-xs space-y-3.5 pointer-events-auto z-10"
      >
        <div class="flex items-start justify-between border-b border-slate-800 pb-2.5">
          <div>
            <span
              class="px-2 py-0.5 rounded text-[10px] font-mono uppercase"
              :class="{
                'bg-amber-950 text-amber-300 border border-amber-800': selectedDetails.type === 'entity',
                'bg-sky-950 text-sky-300 border border-sky-800': selectedDetails.type === 'fact',
                'bg-emerald-950 text-emerald-300 border border-emerald-800': selectedDetails.type === 'relationship',
              }"
            >
              {{ selectedDetails.type === 'entity' ? 'Entidad' : selectedDetails.type === 'fact' ? 'Hecho' : 'Relación' }}
            </span>
            <h3 class="font-bold text-slate-100 text-sm mt-1">
              {{ selectedDetails.title }}
            </h3>
          </div>
          <button
            type="button"
            @click="clearSelection"
            class="text-slate-400 hover:text-white p-1 text-base leading-none"
            title="Cerrar panel"
          >
            &times;
          </button>
        </div>

        <!-- 1. Entity Details -->
        <template v-if="selectedDetails.type === 'entity' && selectedDetails.entity">
          <div class="space-y-1">
            <div class="text-slate-400">ID de Entidad:</div>
            <div class="font-mono text-slate-200 bg-slate-950 p-1.5 rounded border border-slate-800 break-all">
              {{ selectedDetails.entity.entityId }}
            </div>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div>
              <div class="text-slate-400">Dominio:</div>
              <div class="font-medium text-slate-200 mt-0.5">{{ selectedDetails.entity.domain }}</div>
            </div>
            <div>
              <div class="text-slate-400">Estado:</div>
              <div class="font-medium text-amber-400 mt-0.5">{{ selectedDetails.entity.currentStatus }}</div>
            </div>
          </div>

          <div v-if="selectedDetails.entity.attributes && Object.keys(selectedDetails.entity.attributes).length > 0">
            <div class="text-slate-400 mb-1">Atributos de Entidad:</div>
            <pre class="bg-slate-950 p-2 rounded border border-slate-800 text-[10px] font-mono text-slate-300 overflow-x-auto leading-tight">{{ JSON.stringify(selectedDetails.entity.attributes, null, 2) }}</pre>
          </div>

          <!-- Connected Relationships -->
          <div v-if="selectedDetails.connectedRelationships && selectedDetails.connectedRelationships.length > 0">
            <div class="text-slate-400 mb-1 font-semibold">Relaciones Conectadas:</div>
            <ul class="space-y-1.5">
              <li
                v-for="(r, i) in selectedDetails.connectedRelationships"
                :key="i"
                class="bg-slate-950 p-2 rounded border border-slate-800 text-[11px] space-y-0.5"
              >
                <div class="flex items-center justify-between text-amber-300 font-semibold">
                  <span>{{ r.relationship_type ?? r.relationshipType }}</span>
                  <span class="text-emerald-400 text-[10px]">Afinidad: {{ r.affinity_weight ?? r.affinityWeight }}</span>
                </div>
                <div class="text-slate-400 text-[10px] font-mono truncate">
                  De: {{ r.source_entity_id ?? r.sourceEntityId }} &rarr; Para: {{ r.target_entity_id ?? r.targetEntityId }}
                </div>
              </li>
            </ul>
          </div>

          <!-- Linked Facts -->
          <div v-if="selectedDetails.linkedFacts && selectedDetails.linkedFacts.length > 0">
            <div class="text-slate-400 mb-1 font-semibold">Hechos Vinculados:</div>
            <ul class="space-y-1.5">
              <li
                v-for="f in selectedDetails.linkedFacts"
                :key="f.factId"
                class="bg-slate-950 p-2 rounded border border-slate-800 text-[11px] space-y-1"
              >
                <p class="text-slate-200">{{ f.factStatement }}</p>
                <div class="flex items-center justify-between text-[10px] text-slate-500">
                  <span>{{ f.chapterSource }}</span>
                  <span :class="f.isCanon ? 'text-emerald-400' : 'text-amber-400'">
                    {{ f.isCanon ? 'CANÓNICO' : 'DRAFT' }}
                  </span>
                </div>
              </li>
            </ul>
          </div>
        </template>

        <!-- 2. Fact Details -->
        <template v-else-if="selectedDetails.type === 'fact' && selectedDetails.fact">
          <div class="space-y-1">
            <div class="text-slate-400">Enunciado:</div>
            <div class="text-slate-200 bg-slate-950 p-2 rounded border border-slate-800 leading-relaxed">
              {{ selectedDetails.fact.factStatement }}
            </div>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div>
              <div class="text-slate-400">Capítulo Fuente:</div>
              <div class="font-medium text-slate-200 mt-0.5">{{ selectedDetails.fact.chapterSource }}</div>
            </div>
            <div>
              <div class="text-slate-400">Estado Canónico:</div>
              <div
                class="font-medium mt-0.5"
                :class="selectedDetails.fact.isCanon ? 'text-emerald-400' : 'text-amber-400'"
              >
                {{ selectedDetails.fact.isCanon ? 'Canónico' : 'Borrador' }}
              </div>
            </div>
          </div>

          <div v-if="selectedDetails.fact.entityId">
            <div class="text-slate-400">Entidad Vinculada:</div>
            <div class="font-mono text-slate-300 mt-0.5 bg-slate-950 p-1.5 rounded border border-slate-800 truncate">
              {{ selectedDetails.fact.entityId }}
            </div>
          </div>
        </template>

        <!-- 3. Relationship Details -->
        <template v-else-if="selectedDetails.type === 'relationship' && selectedDetails.relationship">
          <div class="space-y-1">
            <div class="text-slate-400">Tipo de Relación:</div>
            <div class="font-semibold text-amber-300 text-sm">
              {{ selectedDetails.relationship.relationship_type ?? selectedDetails.relationship.relationshipType }}
            </div>
          </div>

          <div class="space-y-1">
            <div class="text-slate-400">Peso de Afinidad:</div>
            <div class="font-bold text-emerald-400 text-sm">
              {{ selectedDetails.relationship.affinity_weight ?? selectedDetails.relationship.affinityWeight }}
            </div>
          </div>

          <div class="space-y-1">
            <div class="text-slate-400">Origen &rarr; Destino:</div>
            <div class="font-mono text-[11px] text-slate-200 bg-slate-950 p-2 rounded border border-slate-800 space-y-1">
              <div>Source: {{ selectedDetails.relationship.source_entity_id ?? selectedDetails.relationship.sourceEntityId }}</div>
              <div>Target: {{ selectedDetails.relationship.target_entity_id ?? selectedDetails.relationship.targetEntityId }}</div>
            </div>
          </div>

          <div v-if="selectedDetails.relationship.description">
            <div class="text-slate-400">Descripción:</div>
            <div class="text-slate-300 bg-slate-950 p-2 rounded border border-slate-800 text-[11px]">
              {{ selectedDetails.relationship.description }}
            </div>
          </div>
        </template>
      </aside>
    </div>
  </div>
</template>