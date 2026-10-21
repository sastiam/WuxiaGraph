# pdf-ingestion Specification

## Purpose
TBD - created by archiving change wxg-004-pdf-mass-ingestion. Update Purpose after archive.

## Requirements

### Requirement: Chapter-Level Ingestion Checkpoints
The ingestion engine SHALL record processing checkpoints per chapter in SQLite WAL table `ingestion_checkpoints`.

#### Scenario: Resuming interrupted ingestion
- **WHEN** an ingestion process is interrupted or reaches WIP limit
- **THEN** system saves `last_processed_chapter_id` and resumes from the exact chapter without duplicate processing

### Requirement: Human-in-the-Loop Alias Approval Queue
The frontend SHALL provide a HitL approval queue component in Vue 3 for reviewing proposed entity alias mergers.

#### Scenario: User approves proposed alias
- **WHEN** user clicks approve on a proposed alias in the HitL queue
- **THEN** system updates the alias status from draft (`is_canon = 0`) to canonical (`is_canon = 1`)
