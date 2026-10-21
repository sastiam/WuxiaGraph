# Proposal: SaaS Mass PDF Chapter Ingestion Engine (WXG-004)

## Why
WuxiaGraph requiere procesar documentos extensos (libros/novelas de 500+ páginas y cientos de capítulos) para extraer automáticamente hechos narrativos, mapear relaciones en el grafo y gestionar la evolución de entidades con resolución de co-referencia y control de cuota de gobernanza.

## Context & Impact
- **Módulos Afectados:** `src/domain/ingestion/`, `src/infrastructure/pdf/`, `src/api/routes/ingestion.ts`, `frontend/src/components/HitLApprovalQueue.vue`, `frontend/src/components/PdfUploader.vue`.
- **Análisis Graphify:** Afecta e integra con el Fact Ledger (`database.ts`), `GraphService`, `DreamingService` y `GovernancePanel`.

## Definition of Done
- Ingestador PDF asíncrono con guardado de checkpoints por capítulo en SQLite WAL (`ingestion_checkpoints`).
- Segmentación multilingüe de capítulos y cola de destilación con ventana滑动 (overlap).
- Motor de co-referencia e interfaz Vue 3 HitL con cola de aprobación para alias propuestos.
- Pausa automática por Circuit Breaker (`423 Locked`) preservando el estado de ingesta.
