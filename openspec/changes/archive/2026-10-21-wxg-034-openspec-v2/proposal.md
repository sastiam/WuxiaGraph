# Proposal: OpenSpec Engine v2 (Archify, Btrfs CoW & Auto-Healing)

## Why
Issue #34 requires evolving Hermes Agent's orchestration architecture for WuxiaGraph to OpenSpec Engine v2. This provides interactive visual architecture/workflow maps via Archify (`.archify/`), instant (<100ms) Btrfs CoW snapshots for rollbacks on test failure, and an automated auto-healing loop using Antigravity CLI subagents (`agy`).

## What Changes
- Add Archify visual artifacts and generator scripts for OpenSpec v2 workflows in `.archify/`.
- Add Btrfs CoW snapshot creation/rollback helper for isolation before running builder subagents.
- Add Auto-Healing protocol in `AGENTS.md` and `openspec/AGENTS.md` for `agy` execution retries on quality gate failures.
- Integrate `openspec-operator` skill rules into WuxiaGraph repository instructions.

## Definition of Done
- [ ] Visual Archify HTML diagram `openspec-v2-workflow.html` generated and verified.
- [ ] Btrfs CoW snapshot helper script or protocol validated.
- [ ] `AGENTS.md` updated with Auto-Healing and Btrfs CoW instructions.
- [ ] Delta specification validated cleanly with `npx openspec validate 2026-10-21-wxg-034-openspec-v2`.
