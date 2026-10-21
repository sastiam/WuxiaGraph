# Design: HitL Alias Curation API & Vue 3 Component

## API Schema & Contracts
1. `GET /api/v1/aliases/pending` -> `{ pending: AliasCandidate[] }`
2. `POST /api/v1/aliases/:id/review` -> Body: `{ action: 'approve' | 'reject' }`

## Coreference Reconciliation
- **Approve:** `is_canon = 1`, merge alias into canonical entity `attributes_json.aliases`, update `lore_relationships` source/target pointers to canonical `entity_id`.
- **Reject:** Mark candidate review state as `rejected`, keep entity separate.

## Ports & Adapters
- **Router:** `src/api/routes/aliases.ts`
- **Frontend Component:** `frontend/src/components/HitLAliasQueue.vue`
