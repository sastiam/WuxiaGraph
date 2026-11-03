# Design: OpenSpec Engine v2 Architecture

## Architecture & Data Flow
1. **Archify Visuals Layer:** Generates interactive `.archify/workflow-openspec-v2/openspec-v2-workflow.html` diagrams detailing the 7-step Master Orchestrator workflow.
2. **Btrfs CoW Snapshot Buffer:** Manages `/home/sastiam/Workspace/.snapshots/pre-<change-id>` Btrfs subvolume snapshots prior to invoking subagents, guaranteeing <100ms rollback capabilities.
3. **Auto-Healing Circuit:** Implements a 3-strike retry loop in `AGENTS.md` where subagents inspect Vitest/TSC error outputs and automatically apply patches under Btrfs isolation.

## Ports & Adapters
- **Archify Runner:** Chrome/Brave headless CLI runner (`ARCHIFY_CHROME=/home/sastiam/.local/bin/brave-browser-optimized node ...`).
- **Snapshot Adapter:** Local Btrfs CLI wrapper or fallback directory snapshot for non-Btrfs mounts.
- **Orchestration Adapter:** `AGENTS.md` and `openspec-operator` skill protocol.
