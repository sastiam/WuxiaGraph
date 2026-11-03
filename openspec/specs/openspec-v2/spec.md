# openspec-v2 Specification

## Purpose
TBD - created by archiving change 2026-10-21-wxg-034-openspec-v2. Update Purpose after archive.

## Requirements

### Requirement: Interactive Archify Visualization
The system MUST include an Archify visual workflow diagram in `.archify/workflow-openspec-v2/openspec-v2-workflow.html` detailing the OpenSpec v2 Master Orchestrator process.

#### Scenario: Visual Diagram Generation
- **WHEN** the Archify finalize CLI is executed on `.archify/workflow-openspec-v2/candidate.json`
- **THEN** a standalone interactive HTML file `openspec-v2-workflow.html` is produced with full showcase styling.

### Requirement: Btrfs CoW Snapshot Rollback Buffer
The orchestration environment MUST support Btrfs subvolume CoW snapshots in `/home/sastiam/Workspace/.snapshots/` prior to subagent execution to allow <100ms atomic rollbacks on test failure.

#### Scenario: Btrfs CoW Snapshot Verification
- **WHEN** a subagent is dispatched via `delegate_task`
- **THEN** a pre-execution snapshot is verified or created in `/home/sastiam/Workspace/.snapshots/` for instant recovery.

### Requirement: Auto-Healing Subagent Protocol
The `AGENTS.md` rules MUST define an automated 3-strike Auto-Healing circuit where subagents automatically inspect test failure outputs and apply targeted code repairs.

#### Scenario: Auto-Healing Execution
- **WHEN** a Vitest or TypeScript quality gate check fails during subagent execution
- **THEN** the subagent parses the failure logs and attempts up to 3 automated fix iterations before escalating to Master Orchestrator.
