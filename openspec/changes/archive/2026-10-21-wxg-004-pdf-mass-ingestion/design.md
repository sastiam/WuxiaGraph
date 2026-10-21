# Design: Mass PDF Ingestion Pipeline Architecture

## Pipeline Fases
1. **PDF Layout Parser (`src/infrastructure/pdf/pdfParser.ts`):** Extracción de texto estructurado y filtrado de cabeceras/marcas de agua.
2. **Segmentador de Capítulos (`src/domain/ingestion/chapterSplitter.ts`):** Expresiones regulares multilingües (`第X章`, `Chapter X`) con fallback inteligente.
3. **Batch Worker Queue (`src/domain/ingestion/workerQueue.ts`):** Procesamiento en segundo plano por bloques de capítulos con checkpoints en `ingestion_checkpoints`.
4. **Co-Reference Resolution (`src/domain/ingestion/coreference.ts`):** Detección de alias y fusiones de entidades registradas como borrador (`is_canon = 0`).
5. **HitL Approval Queue (`frontend/src/components/HitLApprovalQueue.vue`):** Componente Vue 3 para curaduría humana y confirmación de alias.

## Diagrama de Flujo
- Visualizador interactivo disponible en `.archify/dataflow-wuxia-ingestion/dataflow.html`.
