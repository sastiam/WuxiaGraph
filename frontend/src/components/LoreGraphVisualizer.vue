<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue';
import type { LoreEntity, NarrativeFact } from '../stores/lore';

interface Props {
  entities: LoreEntity[];
  facts: NarrativeFact[];
}

const props = defineProps<Props>();

interface GraphNode {
  id: string;
  label: string;
  type: 'entity' | 'fact';
  subType?: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  entityRef?: LoreEntity;
  factRef?: NarrativeFact;
}

interface GraphLink {
  id: string;
  source: string;
  target: string;
  label?: string;
  isCanon?: boolean;
}

const svgRef = ref<SVGSVGElement | null>(null);
const width = ref(800);
const height = ref(520);

// Interaction & Camera State
const zoom = ref(1);
const panX = ref(0);
const panY = ref(0);
const isPanning = ref(false);
const startPan = ref({ x: 0, y: 0 });

const selectedNode = ref<GraphNode | null>(null);
const hoveredNodeId = ref<string | null>(null);
const draggedNodeId = ref<string | null>(null);

// Filters
const filterCanonOnly = ref(false);
const searchQuery = ref('');

// Computed Graph Elements
const graphNodes = computed<GraphNode[]>(() => {
  const nodes: GraphNode[] = [];
  const entityMap = new Map<string, GraphNode>();

  const totalEntities = props.entities.length;
  props.entities.forEach((ent, index) => {
    // Arrange initial positions in circular orbit
    const angle = (index / Math.max(totalEntities, 1)) * 2 * Math.PI;
    const radiusDist = 180;
    const x = width.value / 2 + Math.cos(angle) * radiusDist;
    const y = height.value / 2 + Math.sin(angle) * radiusDist;

    const node: GraphNode = {
      id: ent.entityId,
      label: ent.canonicalName,
      type: 'entity',
      subType: ent.currentStatus,
      x,
      y,
      vx: 0,
      vy: 0,
      radius: 28,
      entityRef: ent,
    };
    nodes.push(node);
    entityMap.set(ent.entityId, node);
  });

  const visibleFacts = filterCanonOnly.value
    ? props.facts.filter((f) => f.isCanon)
    : props.facts;

  visibleFacts.forEach((fact, index) => {
    let x = width.value / 2 + (Math.random() - 0.5) * 320;
    let y = height.value / 2 + (Math.random() - 0.5) * 280;

    if (fact.entityId && entityMap.has(fact.entityId)) {
      const parent = entityMap.get(fact.entityId)!;
      const angle = (index * 1.3) + Math.random();
      const dist = 75 + Math.random() * 35;
      x = parent.x + Math.cos(angle) * dist;
      y = parent.y + Math.sin(angle) * dist;
    }

    const shortStatement =
      fact.factStatement.length > 28
        ? fact.factStatement.substring(0, 26) + '...'
        : fact.factStatement;

    nodes.push({
      id: fact.factId,
      label: shortStatement,
      type: 'fact',
      subType: fact.isCanon ? 'CANON' : 'DRAFT',
      x,
      y,
      vx: 0,
      vy: 0,
      radius: 18,
      factRef: fact,
    });
  });

  return nodes;
});

// Dynamic Nodes with current positions preserved across physics
const nodePositions = ref<Map<string, { x: number; y: number }>>(new Map());

const renderedNodes = computed(() => {
  return graphNodes.value.map((node) => {
    const existing = nodePositions.value.get(node.id);
    if (existing) {
      return { ...node, x: existing.x, y: existing.y };
    }
    nodePositions.value.set(node.id, { x: node.x, y: node.y });
    return node;
  });
});

const graphLinks = computed<GraphLink[]>(() => {
  const links: GraphLink[] = [];
  const nodeIds = new Set(renderedNodes.value.map((n) => n.id));

  const visibleFacts = filterCanonOnly.value
    ? props.facts.filter((f) => f.isCanon)
    : props.facts;

  visibleFacts.forEach((fact) => {
    if (fact.entityId && nodeIds.has(fact.entityId) && nodeIds.has(fact.factId)) {
      links.push({
        id: `link-${fact.entityId}-${fact.factId}`,
        source: fact.entityId,
        target: fact.factId,
        label: fact.chapterSource,
        isCanon: fact.isCanon,
      });
    }
  });

  // Cross-entity associations extracted from attributes or shared mentions
  props.entities.forEach((entA) => {
    props.entities.forEach((entB) => {
      if (entA.entityId >= entB.entityId) return;
      // If one entity mentions another in attributes
      const attrsStr = JSON.stringify(entA.attributes);
      if (attrsStr.includes(entB.entityId) || attrsStr.includes(entB.canonicalName)) {
        links.push({
          id: `assoc-${entA.entityId}-${entB.entityId}`,
          source: entA.entityId,
          target: entB.entityId,
          label: 'relates_to',
          isCanon: true,
        });
      }
    });
  });

  return links;
});

const nodeLookup = computed(() => {
  const map = new Map<string, GraphNode>();
  renderedNodes.value.forEach((n) => map.set(n.id, n));
  return map;
});

const filteredNodeMatches = computed(() => {
  if (!searchQuery.value.trim()) return null;
  const q = searchQuery.value.toLowerCase();
  const matched = new Set<string>();
  renderedNodes.value.forEach((node) => {
    if (node.label.toLowerCase().includes(q)) {
      matched.add(node.id);
    }
    if (node.entityRef?.canonicalName.toLowerCase().includes(q)) {
      matched.add(node.id);
    }
    if (node.factRef?.factStatement.toLowerCase().includes(q)) {
      matched.add(node.id);
    }
  });
  return matched;
});

function handleMouseDownSvg(e: MouseEvent): void {
  // If clicking on SVG canvas directly, start panning
  if (e.target === svgRef.value || (e.target as HTMLElement).tagName === 'svg') {
    isPanning.value = true;
    startPan.value = { x: e.clientX - panX.value, y: e.clientY - panY.value };
    selectedNode.value = null;
  }
}

function handleNodeMouseDown(node: GraphNode, e: MouseEvent): void {
  e.stopPropagation();
  draggedNodeId.value = node.id;
  selectedNode.value = node;
}

function handleMouseMove(e: MouseEvent): void {
  if (isPanning.value) {
    panX.value = e.clientX - startPan.value.x;
    panY.value = e.clientY - startPan.value.y;
    return;
  }

  if (draggedNodeId.value) {
    const svgRect = svgRef.value?.getBoundingClientRect();
    if (!svgRect) return;

    // Convert screen coordinates to world coordinates considering pan and zoom
    const mouseX = (e.clientX - svgRect.left - panX.value) / zoom.value;
    const mouseY = (e.clientY - svgRect.top - panY.value) / zoom.value;

    const existing = nodePositions.value.get(draggedNodeId.value);
    if (existing) {
      existing.x = mouseX;
      existing.y = mouseY;
    } else {
      nodePositions.value.set(draggedNodeId.value, { x: mouseX, y: mouseY });
    }
  }
}

function handleMouseUp(): void {
  isPanning.value = false;
  draggedNodeId.value = null;
}

function handleWheel(e: WheelEvent): void {
  e.preventDefault();
  const zoomFactor = 1.1;
  const newZoom = e.deltaY < 0 ? zoom.value * zoomFactor : zoom.value / zoomFactor;
  zoom.value = Math.min(Math.max(0.4, newZoom), 3.0);
}

function resetView(): void {
  zoom.value = 1;
  panX.value = 0;
  panY.value = 0;
  selectedNode.value = null;
  // Recenter positions
  nodePositions.value.clear();
}

function selectNode(node: GraphNode): void {
  selectedNode.value = node;
}

let resizeObserver: ResizeObserver | null = null;
const containerRef = ref<HTMLDivElement | null>(null);

onMounted(() => {
  if (containerRef.value) {
    width.value = containerRef.value.clientWidth || 800;
    height.value = 520;
    resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        width.value = entry.contentRect.width;
      }
    });
    resizeObserver.observe(containerRef.value);
  }
  window.addEventListener('mouseup', handleMouseUp);
});

onUnmounted(() => {
  resizeObserver?.disconnect();
  window.removeEventListener('mouseup', handleMouseUp);
});
</script>

<template>
  <div class="space-y-4">
    <!-- Controls Header -->
    <div class="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-xl">
      <div class="flex items-center gap-3">
        <div class="flex items-center gap-2">
          <span class="inline-block w-3 h-3 rounded-full bg-amber-400"></span>
          <h2 class="text-base font-bold text-slate-100">Grafo Canónico Interactivo</h2>
        </div>
        <span class="text-xs bg-slate-800 border border-slate-700/60 px-2.5 py-1 rounded-full text-slate-300 font-mono">
          {{ renderedNodes.length }} Nodos &bull; {{ graphLinks.length }} Vínculos
        </span>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <!-- Search filter -->
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Buscar nodo..."
          class="px-3 py-1.5 text-xs bg-slate-950 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
        />

        <!-- Canon filter button -->
        <button
          type="button"
          @click="filterCanonOnly = !filterCanonOnly"
          :class="filterCanonOnly ? 'bg-emerald-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'"
          class="px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-700 transition flex items-center gap-1.5"
        >
          <span class="w-2 h-2 rounded-full" :class="filterCanonOnly ? 'bg-white' : 'bg-emerald-400'"></span>
          Solo Canónico
        </button>

        <!-- Reset Button -->
        <button
          type="button"
          @click="resetView"
          class="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
          title="Restablecer Zoom y Posición"
        >
          Restablecer
        </button>

        <!-- Zoom Controls -->
        <div class="flex items-center border border-slate-700 rounded-lg overflow-hidden">
          <button
            type="button"
            @click="zoom = Math.max(0.4, zoom - 0.15)"
            class="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
            title="Reducir Zoom"
          >
            -
          </button>
          <span class="px-2 py-1 bg-slate-900 text-slate-400 text-xs font-mono">
            {{ Math.round(zoom * 100) }}%
          </span>
          <button
            type="button"
            @click="zoom = Math.min(3.0, zoom + 0.15)"
            class="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
            title="Aumentar Zoom"
          >
            +
          </button>
        </div>
      </div>
    </div>

    <!-- Visualizer Container -->
    <div
      ref="containerRef"
      class="relative w-full h-[540px] bg-slate-950 border border-slate-800 rounded-xl overflow-hidden select-none"
    >
      <!-- Background Grid Overlay -->
      <svg
        ref="svgRef"
        class="w-full h-full cursor-grab active:cursor-grabbing"
        @mousedown="handleMouseDownSvg"
        @mousemove="handleMouseMove"
        @wheel="handleWheel"
      >
        <defs>
          <pattern id="graph-grid" width="32" height="32" patternUnits="userSpaceOnUse">
            <circle cx="16" cy="16" r="0.8" fill="#334155" />
          </pattern>
          <marker
            id="arrow-canon"
            viewBox="0 0 10 10"
            refX="22"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 1 L 10 5 L 0 9 z" fill="#10b981" />
          </marker>
          <marker
            id="arrow-draft"
            viewBox="0 0 10 10"
            refX="22"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 1 L 10 5 L 0 9 z" fill="#f59e0b" />
          </marker>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        <!-- Grid Pattern Backdrop -->
        <rect width="100%" height="100%" fill="url(#graph-grid)" />

        <!-- Camera Group (Pan & Zoom) -->
        <g :transform="`translate(${panX}, ${panY}) scale(${zoom})`">
          <!-- Links (Lines) -->
          <g class="links-layer">
            <g v-for="link in graphLinks" :key="link.id">
              <template v-if="nodeLookup.get(link.source) && nodeLookup.get(link.target)">
                <line
                  :x1="nodeLookup.get(link.source)!.x"
                  :y1="nodeLookup.get(link.source)!.y"
                  :x2="nodeLookup.get(link.target)!.x"
                  :y2="nodeLookup.get(link.target)!.y"
                  :stroke="link.isCanon ? '#059669' : '#d97706'"
                  :stroke-width="link.isCanon ? 1.5 : 1.2"
                  :stroke-dasharray="link.isCanon ? 'none' : '4,3'"
                  stroke-opacity="0.6"
                  :marker-end="link.isCanon ? 'url(#arrow-canon)' : 'url(#arrow-draft)'"
                />
                <!-- Link Text Label -->
                <text
                  :x="(nodeLookup.get(link.source)!.x + nodeLookup.get(link.target)!.x) / 2"
                  :y="(nodeLookup.get(link.source)!.y + nodeLookup.get(link.target)!.y) / 2 - 4"
                  fill="#64748b"
                  font-size="9"
                  font-family="monospace"
                  text-anchor="middle"
                  class="pointer-events-none select-none"
                >
                  {{ link.label }}
                </text>
              </template>
            </g>
          </g>

          <!-- Nodes (Entities & Facts) -->
          <g class="nodes-layer">
            <g
              v-for="node in renderedNodes"
              :key="node.id"
              :transform="`translate(${node.x}, ${node.y})`"
              class="cursor-pointer transition-transform duration-75"
              @mousedown="handleNodeMouseDown(node, $event)"
              @mouseenter="hoveredNodeId = node.id"
              @mouseleave="hoveredNodeId = null"
              @click.stop="selectNode(node)"
            >
              <!-- Highlight Halo for Selected or Matched Nodes -->
              <circle
                v-if="selectedNode?.id === node.id || (filteredNodeMatches && filteredNodeMatches.has(node.id))"
                :r="node.radius + 6"
                fill="none"
                :stroke="node.type === 'entity' ? '#f59e0b' : '#38bdf8'"
                stroke-width="2.5"
                stroke-opacity="0.8"
                stroke-dasharray="3,2"
                filter="url(#glow)"
              />

              <!-- Entity Node Circle -->
              <template v-if="node.type === 'entity'">
                <circle
                  :r="node.radius"
                  fill="#0f172a"
                  stroke="#f59e0b"
                  :stroke-width="hoveredNodeId === node.id || selectedNode?.id === node.id ? 2.8 : 1.8"
                  class="transition-all duration-150 shadow-lg"
                />
                <!-- Entity Glyph/Icon -->
                <text
                  dy="-4"
                  text-anchor="middle"
                  fill="#f59e0b"
                  font-size="12"
                  font-weight="bold"
                  class="select-none pointer-events-none"
                >
                  &#9670;
                </text>
                <!-- Entity Canonical Label -->
                <text
                  dy="10"
                  text-anchor="middle"
                  fill="#f8fafc"
                  font-size="10"
                  font-weight="600"
                  font-family="sans-serif"
                  class="select-none pointer-events-none"
                >
                  {{ node.label.length > 12 ? node.label.substring(0, 11) + '..' : node.label }}
                </text>
              </template>

              <!-- Fact Node Circle -->
              <template v-else>
                <rect
                  :x="-node.radius - 8"
                  :y="-node.radius / 1.5"
                  :width="(node.radius + 8) * 2"
                  :height="node.radius * 1.3"
                  rx="6"
                  :fill="node.subType === 'CANON' ? '#064e3b' : '#451a03'"
                  :stroke="node.subType === 'CANON' ? '#10b981' : '#f59e0b'"
                  :stroke-width="hoveredNodeId === node.id || selectedNode?.id === node.id ? 2 : 1"
                  stroke-opacity="0.9"
                  class="transition-all duration-150"
                />
                <text
                  dy="3"
                  text-anchor="middle"
                  :fill="node.subType === 'CANON' ? '#6ee7b7' : '#fcd34d'"
                  font-size="9"
                  font-family="sans-serif"
                  class="select-none pointer-events-none"
                >
                  {{ node.label }}
                </text>
              </template>

              <!-- Node Tooltip on hover -->
              <title>{{ node.label }} ({{ node.type }})</title>
            </g>
          </g>
        </g>
      </svg>

      <!-- Empty State -->
      <div
        v-if="renderedNodes.length === 0"
        class="absolute inset-0 flex flex-col items-center justify-center text-slate-500 pointer-events-none"
      >
        <span class="text-3xl mb-2">&#127749;</span>
        <p class="text-sm font-medium">No hay entidades ni hechos disponibles para visualizar</p>
        <p class="text-xs text-slate-600 mt-1">Realiza una consulta para cargar el grafo de conocimiento</p>
      </div>

      <!-- Quick Legend Overlay -->
      <div class="absolute bottom-3 left-3 bg-slate-900/90 backdrop-blur-sm border border-slate-800 rounded-lg p-2.5 text-[11px] space-y-1.5 text-slate-300 pointer-events-auto">
        <div class="font-semibold text-slate-400 text-[10px] uppercase tracking-wider">Leyenda</div>
        <div class="flex items-center gap-2">
          <span class="w-3 h-3 rounded-full border border-amber-500 bg-slate-900 inline-block"></span>
          <span>Entidad Canónica</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="w-3 h-2 rounded border border-emerald-500 bg-emerald-950 inline-block"></span>
          <span>Hecho Canónico</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="w-3 h-2 rounded border border-amber-500 bg-amber-950 inline-block"></span>
          <span>Hecho Borrador</span>
        </div>
        <div class="text-[10px] text-slate-500 pt-1 border-t border-slate-800">
          Arrastra para mover &bull; Rueda para zoom
        </div>
      </div>

      <!-- Side Inspector Panel for Selected Node -->
      <aside
        v-if="selectedNode"
        class="absolute top-3 right-3 w-80 max-h-[90%] overflow-y-auto bg-slate-900/95 backdrop-blur border border-slate-700/80 rounded-xl p-4 shadow-2xl text-xs space-y-3 pointer-events-auto transition-all"
      >
        <div class="flex items-start justify-between border-b border-slate-800 pb-2">
          <div>
            <span
              class="px-2 py-0.5 rounded text-[10px] font-mono uppercase"
              :class="selectedNode.type === 'entity' ? 'bg-amber-950 text-amber-300 border border-amber-800' : 'bg-sky-950 text-sky-300 border border-sky-800'"
            >
              {{ selectedNode.type === 'entity' ? 'Entidad' : 'Hecho' }}
            </span>
            <h3 class="font-bold text-slate-100 text-sm mt-1">
              {{ selectedNode.label }}
            </h3>
          </div>
          <button
            type="button"
            @click="selectedNode = null"
            class="text-slate-400 hover:text-white p-1"
            title="Cerrar panel"
          >
            &times;
          </button>
        </div>

        <!-- Entity Details -->
        <template v-if="selectedNode.entityRef">
          <div class="space-y-1">
            <div class="text-slate-400">ID de Entidad:</div>
            <div class="font-mono text-slate-200 bg-slate-950 p-1.5 rounded border border-slate-800 break-all">
              {{ selectedNode.entityRef.entityId }}
            </div>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div>
              <div class="text-slate-400">Dominio:</div>
              <div class="font-medium text-slate-200 mt-0.5">{{ selectedNode.entityRef.domain }}</div>
            </div>
            <div>
              <div class="text-slate-400">Estado:</div>
              <div class="font-medium text-amber-400 mt-0.5">{{ selectedNode.entityRef.currentStatus }}</div>
            </div>
          </div>

          <div v-if="selectedNode.entityRef.attributes && Object.keys(selectedNode.entityRef.attributes).length > 0">
            <div class="text-slate-400 mb-1">Atributos:</div>
            <pre class="bg-slate-950 p-2 rounded border border-slate-800 text-[10px] font-mono text-slate-300 overflow-x-auto">{{ JSON.stringify(selectedNode.entityRef.attributes, null, 2) }}</pre>
          </div>
        </template>

        <!-- Fact Details -->
        <template v-else-if="selectedNode.factRef">
          <div class="space-y-1">
            <div class="text-slate-400">Enunciado:</div>
            <div class="text-slate-200 bg-slate-950 p-2 rounded border border-slate-800 leading-relaxed">
              {{ selectedNode.factRef.factStatement }}
            </div>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div>
              <div class="text-slate-400">Capítulo Fuente:</div>
              <div class="font-medium text-slate-200 mt-0.5">{{ selectedNode.factRef.chapterSource }}</div>
            </div>
            <div>
              <div class="text-slate-400">Estado Canónico:</div>
              <div
                class="font-medium mt-0.5"
                :class="selectedNode.factRef.isCanon ? 'text-emerald-400' : 'text-amber-400'"
              >
                {{ selectedNode.factRef.isCanon ? 'Canónico' : 'Borrador' }}
              </div>
            </div>
          </div>

          <div v-if="selectedNode.factRef.entityId">
            <div class="text-slate-400">Entidad Vinculada:</div>
            <div class="font-mono text-slate-300 mt-0.5 truncate">{{ selectedNode.factRef.entityId }}</div>
          </div>
        </template>
      </aside>
    </div>
  </div>
</template>
