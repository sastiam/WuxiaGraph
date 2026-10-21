# OpenSpec [WXG-004]: Ingestor Masivo de PDFs de Cientos de Capítulos en WuxiaGraph

## Documento de Visión de Producto SaaS, Casos de Uso y Arquitectura del Pipeline

**Autor:** Agente de Producto SaaS WuxiaGraph  
**Fecha:** 21 de Octubre, 2026  
**Estado:** Proposed Specification  
**Artefacto Interactivo de Arquitectura:** `/.archify/dataflow-wuxia-ingestion/dataflow.html`

---

## 1. Visión Estratégica de Producto SaaS & Propuesta de Valor

### 1.1 Propósito Estratégico
El **Ingestor Masivo de PDFs** evoluciona a **WuxiaGraph** de un motor de prueba de concepto a una plataforma SaaS *Enterprise-grade* para la gestión, análisis y asistencia en la escritura de macro-narrativas de Alta Fantasía Oriental (Wuxia / Xianxia / Xuanhuan).

Su propósito principal es automatizar la ingesta de documentos masivos (500+ páginas, 1,000+ capítulos, >1,000,000 de palabras) extrayendo dinámicamente un **Grafo de Conocimiento Temporal** y un **Ledger de Hechos Canónicos** sin pérdidas de contexto, sin alucinaciones de lore y con control estricto del presupuesto de cómputo.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                VISIÓN DE PRODUCTO WUXIAGRAPH                           │
├────────────────────────────────────────────────────────────────────────────────────────┤
│  [ PDF Masivo 500+ Págs ] ──► [ Ingestion Pipeline ] ──► [ Temporal Lore Graph ]       │
│  (Novela Wuxia/Xianxia)       (Parsing + Distillation)     (Fact Ledger & Entidades)    │
│                                                                      │                 │
│                                                                      ▼                 │
│  [ Continuidad Narrativa ] ◄── [ Context Injector ]  ◄── [ Co-Reference Resolution ] │
│  (0 Alucinaciones / Canon)     (Filtro `is_canon=1`)       (Evolución de Alias/Reinos) │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

### 1.2 Propuesta de Valor Diferenciadora (vs RAG Tradicional y Context Windows)

| Dimensión | RAG Tradicional (Vector DB + Chunking) | LLMs de Contexto Largo (1M+ Tokens) | WuxiaGraph Mass PDF Ingestor |
| :--- | :--- | :--- | :--- |
| **Continuidad Narrativa** | Se pierde entre chunks disjuntos; rompe arcos narrativos. | Sufre de "Lost in the Middle" y degradación de atención en textos >200k palabras. | **Sliding Window + Temporal Knowledge Graph** preserve arcos completos. |
| **Resolución de Co-referencias** | Incapaz de vincular personajes que cambian de título tras 300 capítulos. | Tiende a alucinar identidades o fusionar personajes secundarios similares. | **Co-Reference Resolution Agent** mapea alias, apodos y ascensos de Reinos de Cultivo. |
| **Control de Lore & Canon** | Mezcla eventos pasados, borradores y hechos no confirmados. | No distingue hechos oficiales de suposiciones inferidas. | **Fact Ledger en SQLite WAL** con flag estricto `is_canon = 1` vs `is_canon = 0`. |
| **Gobierno y Coste Cómputo** | Consultas vectoriales costosas y repetitivas sin caching de entidades. | Costes exorbitantes por llamada al enviar el libro completo al prompt. | **Batch Workers + Circuit Breaker (`LOCKED_BY_WIP`)** para presupuestos controlados. |

---

### 1.3 Target Personas (Perfil de Usuarios SaaS)

1. **Autores y Creadores de Sagas Wuxia/Xianxia:**
   - *Pain Point:* Olvidan detalles de worldbuilding (técnicas, reinos, relaciones de sectas pasadas) tras escribir más de 500 capítulos.
   - *Beneficio:* Grafo interactivo que responde instantáneamente "¿En qué capítulo el protagonista obtuvo la Espada Celestial?".
2. **Equipos de Localización y Traductores:**
   - *Pain Point:* Inconsistencias en la traducción de términos, nombres de personajes y nombres de sectas a lo largo de volúmenes masivos.
   - *Beneficio:* Glosarios de lore dinámicos con trazabilidad exacta a capítulos fuente.
3. **Estudios de Adaptación de Medios (Donghua, Manhua, Videojuegos):**
   - *Pain Point:* Dificultad para condensar novelas de 2,000 capítulos en biblias de producción sin romper la coherencia del universo.
   - *Beneficio:* Extracción automática de árboles de facciones, líneas de tiempo y jerarquías de poder.

---

### 1.4 Modelo SaaS & Economía de Cómputo

- **Monetización basada en Créditos de Ingesta:** Basada en el número de capítulos o páginas procesadas (e.g., Tier Starter: 200 capítulos/mes, Tier Author: 1,500 capítulos/mes, Tier Studio: ilimitado con cuota dedicada).
- **Optimizador de Inferencia (Prompts Jerárquicos):** Uso de modelos *LLM Light* (p. ej. Haiku / Mini) para la segmentación y modelos *LLM Heavy / Reasoning* para la destilación estructurada de hechos complejos.

---

## 2. Casos de Uso de Usuario

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                CASOS DE USO PRINCIPALES                                │
├────────────────────────────────────────────────────────────────────────────────────────┤
│  [UC-01] Ingesta Masiva Asíncrona  ──► Carga de PDF de 500+ págs con SSE en vivo.      │
│  [UC-02] Curaduría HitL            ──► Confirmación humana de alias ambiguos.          │
│  [UC-03] Exploración Temporal      ──► Consulta del estado del mundo por capítulo.     │
│  [UC-04] Inyección Canónica        ──► Generación de nuevos capítulos sin alucinaciones.│
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### UC-01: Ingesta Masiva Asíncrona de PDF con Progress Monitoring
- **Actor:** Usuario Creador / Editor.
- **Precondición:** El usuario tiene una cuenta activa y presupuesto de créditos disponible.
- **Flujo Principal:**
  1. El usuario ingresa el **Título de la obra** en el frontend (Vue 3).
  2. El usuario selecciona y sube un archivo PDF masivo (e.g., 800 páginas, 600 capítulos).
  3. El frontend inicia la carga mediante multipart/form-data hacia `POST /api/v1/ingestion/upload`.
  4. El servidor responde con HTTP 202 Accepted y un `job_id`.
  5. El frontend abre una conexión **Server-Sent Events (SSE)** hacia `/api/v1/ingestion/stream/:job_id` para recibir progresos en tiempo real (`% procesado`, `capítulo actual`, `entidades extraídas`).
  6. Al finalizar, el backend emite un evento `COMPLETE` actualizando la vista del proyecto.
- **Excepciones:**
  - *Presupuesto agotado:* Si la ingesta excede el límite de tokens o el budget de WIP semanal, la API bloquea el proceso devolviendo HTTP 423 `LOCKED_BY_WIP`, guardando un punto de restauración (`checkpoint_chapter_id`).

---

### UC-02: Curaduría y Resolución Human-in-the-Loop (HitL)
- **Actor:** Curador de Lore / Autor.
- **Precondición:** El pipeline ha identificado posibles fusiones de entidades con coincidencia parcial (co-referencias dudosas).
- **Flujo Principal:**
  1. El usuario accede al panel de **Deduplicación & Co-referencias**.
  2. El sistema presenta sugerencias: *"¿Deseas vincular a 'Discípulo Chen' (Cap. 12) con 'Anciano Chen de la Secta del Loto Azul' (Cap. 450)?"*.
  3. El usuario selecciona **Aprobar Fusión**, **Rechazar** o **Crear Alias**.
  4. La base de datos relacional actualiza `lore_entities` agregando el alias a `attributes_json` y reconciliando los hechos narrativos en `narrative_facts`.

---

### UC-03: Consulta Cronológica y Navegación del Grafo Narrativo
- **Actor:** Usuario Lector / Asistente AI.
- **Flujo Principal:**
  1. El usuario selecciona un rango de capítulos en la interfaz (e.g., Capítulos 1 a 200).
  2. El sistema visualiza el grafo de entidades especificando solo las relaciones y reinos de cultivo activos en ese periodo temporal.
  3. Las relaciones que cambiaron posteriormente no ensucian el contexto de los capítulos iniciales.

---

### UC-04: Inyección Automática de Contexto Canónico para Generación
- **Actor:** Agente LLM de Generación / Escritura.
- **Flujo Principal:**
  1. El usuario solicita escribir el Capítulo 601 indicando los personajes presentes.
  2. El motor invoca el **Context Injector** (`GET /api/v1/context/inject`), que filtra hechos con `is_canon = 1` y construye un prefijo de prompt inmutable con el estado exacto de las entidades.
  3. Se garantiza que el LLM generador no resucite personajes muertos ni otorgue técnicas no aprendidas.

---

## 3. Arquitectura del Pipeline de Ingesta (End-to-End)

El pipeline de ingesta se compone de 5 fases secuenciales y asíncronas con persistencia intermedia e idempotente.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        ARQUITECTURA DEL PIPELINE DE INGESTA                            │
├────────────────────────────────────────────────────────────────────────────────────────┤
│  FASE 1: PDF Parsing Preservando Layout (OCR / pdfplumber + Cleansing)                 │
│       │                                                                                │
│       ▼                                                                                │
│  FASE 2: Chapter Segmentation & Structure Discovery (Regex + LLM Light Fallback)       │
│       │                                                                                │
│       ▼                                                                                │
│  FASE 3: Batch Distillation Engine (Sliding Window Queue + Zod Schemas)                │
│       │                                                                                │
│       ▼                                                                                │
│  FASE 4: Co-Reference Resolution & Graph Ingestion (Entities + Fact Ledger)           │
│       │                                                                                │
│       ▼                                                                                │
│  FASE 5: Integration with WIP Governance & Circuit Breaker (HTTP 423 Checkpointing)    │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

### Fase 1: PDF Parsing & Optical Layout Analysis
- **Problema:** Los PDFs de novelas largas contienen ruido de paginación, números de página, encabezados repetitivos (headers/footers) y marcas de agua de sitios de traducción.
- **Solución Téknica:**
  - Integración de `pdfplumber` / `pypdf` para extracción de texto estructurado por coordenadas.
  - Limpiador de Layout (Layout Cleansing Engine) mediante expresiones regulares y heurísticas de frecuencia para eliminar líneas repetitivas de encabezado y pie de página.
  - Normalización Unicode (NFC) para preservar caracteres chinos y marcas diacríticas en pinyin/nombres transliterados.

---

### Fase 2: Chapter Segmentation & Hierarchy Discovery
- **Problema:** Las novelas Wuxia/Xianxia utilizan formatos heterogéneos de títulos de capítulo (`第123章`, `Chapter 123: The Sword Unsheathed`, `Volume 2 - Chapter 45`).
- **Solución Técnica:**
  - **Detección Primaria (Regex Engine Multilingüe):**
    ```regex
    /^(?:第[一二三四五六七八九十百千0-9]+章|Chapter\s+\d+|Capítulo\s+\d+)(?:\s*[:：\-]\s*.*)?$/i
    ```
  - **Fallback Secundario (LLM Light Fallback):** Si la tasa de detección por Regex da capítulos anomalamente largos (>20,000 palabras) o no detecta patrones en las primeras 50 páginas, se invoca un modelo ligero (Haiku / Mini) para analizar la Tabla de Contenidos (TOC) y retornar el mapa de límites offset de página.
  - **Salida:** Estructura de Árbol Narrativo JSON: `Book -> Volume -> Chapter (id, title, raw_content, start_page, end_page)`.

---

### Fase 3: Batch Entity & Fact Extraction ("Dreaming Distillation Engine")
- **Estrategia de Ventana Deslizante (Sliding Window):**
  - Procesamiento por bloques de **2 capítulos con solapamiento de 250 palabras** para evitar cortes de contexto en cliffhangers o batallas consecutivas.
- **Pool de Workers Asíncronos (Worker Queue):**
  - Queue en memoria/Redis con control de concurrencia y retries exponenciales ante rate limits de API de LLM.
- **Extracción Estructurada con Zod / JSON Schema:**
  Cada worker ejecuta la destilación sobre el capítulo emitiendo una carga estructurada:

```typescript
// Schema Zod de Destilación
export const ExtractedChapterDataSchema = z.object({
  chapter_id: z.string(),
  entities: z.array(z.object({
    raw_name: z.string(),
    domain: z.enum(['Cultivator', 'Sect', 'CultivationRealm', 'MartialArt', 'Artifact', 'Location']),
    canonical_candidate: z.string(),
    attributes: z.record(z.string(), z.unknown()),
  })),
  facts: z.array(z.object({
    subject_entity: z.string(),
    action_relation: z.string(),
    object_entity: z.string().optional(),
    statement: z.string(),
    is_canon: z.boolean().default(true),
  }))
});
```

---

### Fase 4: Graph Ingestion, Entity Resolution & Canonical Merging
- **Co-reference & Alias Resolution Engine:**
  - Los cultivadores cambian de título al avanzar de reino (e.g. *"Young Master Ye"* -> *"Elder Ye"* -> *"Ancestor Ye"*).
  - El motor utiliza simetría fonética (Pinyin / Levenshtein) y embeddings de atributos para resolver co-referencias lejanas.
- **Transacción Idempotente en SQLite WAL (`node:sqlite`):**
  - Inserción/Actualización en `lore_entities` (upsert del JSON de atributos).
  - Inserción en `narrative_facts` vinculada a la entidad principal con procedencia explícita del `chapter_source`.

```sql
-- Schema de Persistencia
INSERT INTO lore_entities (entity_id, domain, canonical_name, current_status, attributes_json)
VALUES (?, ?, ?, ?, ?)
ON CONFLICT(entity_id) DO UPDATE SET
  attributes_json = json_patch(lore_entities.attributes_json, excluded.attributes_json),
  last_updated_timestamp = CURRENT_TIMESTAMP;

INSERT INTO narrative_facts (fact_id, entity_id, fact_statement, is_canon, chapter_source)
VALUES (?, ?, ?, ?, ?);
```

---

### Fase 5: Integración con WIP Governance & Circuit Breaker
- **Presupuesto Computacional y de Desarrollo (Regla 4/1):**
  - La ingesta masiva consume recursos de cómputo y cuotas de API.
  - El sistema consulta `wip_governance_ledger`. Si `total_hours_logged > max_budget_hours` (4.0h semanales de desarrollo o presupuesto de créditos excedido):
    1. El pipeline suspende la ingesta de forma segura.
    2. Registra el `checkpoint_chapter_id` en SQLite.
    3. Retorna un estado HTTP `423 Locked` con la firma `{ error: "LOCKED_BY_WIP", resume_chapter_id: "chap-450" }`.
    4. La ingesta puede reanudarse sin re-procesar los capítulos previos.

---

## 4. Roadmap Iterativo de Producto

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                               ROADMAP ITERATIVO DE PRODUCTO                            │
├────────────────────────────────────────────────────────────────────────────────────────┤
│  FASE 1 (MVP - Pipeline Núcleo) ──► Parsing CLI/API, Regex Split, Ingesta SQLite.     │
│  FASE 2 (Async & UI HitL)       ──► Queue Asíncrona, SSE Progress, Deduplicación UI. │
│  FASE 3 (Scale & Hybrid RAG)    ──► Ingesta 1,000+ chaps, Búsqueda Híbrida Vector+Grafo.│
│  FASE 4 (SaaS Platform & B2B)   ──► Multi-tenancy, Monetización, API Externa MCP/REST. │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### Fase 1: MVP Pipeline Núcleo & Ingesta Síncrona/Lotes Básica (Semanas 1-2)
- **Hitos:**
  - Parser de PDF con `pdfplumber` y limpiador de ruido de páginas.
  - Segmentador de capítulos por expresiones regulares para formatos estándar.
  - Endpoint `POST /api/v1/ingestion/parse` para pruebas con libros de 100 capítulos.
  - Pruebas unitarias en Vitest de segmentación y transacciones SQLite.

### Fase 2: Ingesta Asíncrona, SSE Progress & Deduplicación HitL (Semanas 3-4)
- **Hitos:**
  - Sistema de Worker Queue en background con SSE stream (`/api/v1/ingestion/stream`).
  - Componentes Vue 3 en Frontend (`PDFUploader.vue`, `IngestionProgress.vue`, `EntityDeduplicator.vue`).
  - Panel de Resolución de Co-referencias Human-in-the-Loop.
  - Integración de Circuit Breaker (`423 Locked`) con guardado de checkpoints.

### Fase 3: Escala Masiva, Búsqueda Híbrida & Consultas Temporales (Semanas 5-6)
- **Hitos:**
  - Optimización para novelas de 1,000+ capítulos (>500 páginas) con consumo de memoria acotado (<512MB RAM).
  - Búsqueda Híbrida (Vector Embeddings + Graph Traversal) sobre el Fact Ledger.
  - Filtro Temporal de Grafo por capítulo/rango de arcos narrativos.
  - Herramientas MCP avanzadas para agentes de inteligencia artificial.

### Fase 4: Plataforma SaaS Multi-Tenant & Comercialización (Semanas 7-8)
- **Hitos:**
  - Arquitectura Multi-tenant con aislamiento de datos por usuario/proyecto.
  - Sistema de suscripción y límites de crédito por cuota de procesamiento.
  - Conectores para formatos adicionales (EPUB, WebNovel scraping, TXT).
  - API pública REST y servidor MCP estandarizado para integración con agentes externos.

---

## 5. Matriz de Pruebas & Verificación de Calidad

1. **Test de Resiliencia de Parsing PDF:**
   - Verificación de extracción limpia descartando encabezados repetidos en PDFs de 500+ páginas.
2. **Test de Detección de Capítulos:**
   - Cobertura de detección >98% en novelas con títulos mixtos (Chino/Inglés/Español).
3. **Test de Circuit Breaker en Ingesta:**
   - Interrupción deliberada al superar el presupuesto semanal guardando `checkpoint_chapter_id` e introduciendo estado `423 Locked`.
4. **Test de Integridad SQLite WAL:**
   - Mutaciones idempotentes en `lore_entities` y `narrative_facts` bajo concurrencia con `PRAGMA foreign_keys=ON;`.

---

## 6. Diagrama de Arquitectura de Datos (Archify Validated)

El artefacto interactivo completo de la arquitectura del pipeline de datos ha sido compilado y verificado en todos los navegadores mediante Archify:
- **Ubicación del Artefacto HTML:** `.archify/dataflow-wuxia-ingestion/dataflow.html`
- **Verificación:** Superó las 4 puertas de calidad (`validate`, `deliver`, `check`, `browser-check`).
