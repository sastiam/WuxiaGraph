# Spec: Frontend Dashboard & Graph Visualizer

## ADDED Requirements

### Requirement: Depth-based Graph Query and Visualization
`LoreGraphVisualizer.vue` SHALL fetch graph relationships from `/api/v1/graph/relationships` using depth pagination parameter and render interactive nodes.

#### Scenario: Fetching graph with depth filter
- **WHEN** user changes the depth slider or selects a root entity
- **THEN** component requests `/api/v1/graph/relationships?depth=<selected_depth>` and updates Vue Flow nodes/edges

### Requirement: Governance 423 Locked Disablement
`GovernancePanel.vue` and `DreamingConsole.vue` SHALL intercept 423 Locked status from API responses and disable user input controls.

#### Scenario: Circuit breaker budget exceeded
- **WHEN** API returns HTTP status `423 Locked` during logging or distillation
- **THEN** components display a locked alert banner and set all input fields and action buttons to disabled
