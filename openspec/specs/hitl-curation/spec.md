# hitl-curation Specification

## Purpose
TBD - created by archiving change 2026-10-21-wxg-047-hitl-curation. Update Purpose after archive.

## Requirements

### Requirement: Pending Alias Candidates Endpoint
The API MUST expose `GET /api/v1/aliases/pending` returning all proposed alias mappings awaiting human curation.

#### Scenario: Retrieve Pending Aliases
- **WHEN** a GET request is sent to `/api/v1/aliases/pending`
- **THEN** an array of pending alias candidate objects with confidence scores and context quotes is returned.

### Requirement: Alias Review Action Endpoint
The API MUST expose `POST /api/v1/aliases/:id/review` accepting `{ action: 'approve' | 'reject' }` to execute canonical reconciliation.

#### Scenario: Approve Pending Alias
- **WHEN** a POST request with `{ action: 'approve' }` is sent for candidate ID `alias-123`
- **THEN** the alias is merged into the canonical entity, relationships are re-linked, and `is_canon = 1` is persisted.
