# WuxiaGraph

A canonical memory engine and roadmap ledger for long-running AI agent work. It stores story-bible facts and entities in SQLite and serves them to agents over HTTP and the Model Context Protocol (MCP), so an agent can ask "what is canon?" instead of relying on whatever is left in its context window.

## Why

Agents that work on a large project for days lose track of decisions and facts. WuxiaGraph keeps that state outside the model: entities, facts, a relationship graph and a work-in-progress budget, all queryable through a small set of tools.

## Architecture

Clean architecture with dependencies pointing inward only:

```
src/api/  + src/mcp/     input adapters (Hono HTTP, MCP server)
        |
   src/domain/           pure core: entities, ports, errors (no framework imports)
        ^
src/infrastructure/      output adapters (SQLite in WAL mode, schema.sql)
```

- **MCP tools**: `get_canonical_entities`, `query_facts`, `check_wip_budget`.
- **Persistence**: native `node:sqlite`, WAL mode, foreign keys on.
- **Validation**: Zod schemas at the HTTP boundary.
- **Frontend**: Vue 3 + Vite + Tailwind in `frontend/`.
- **Spec-driven**: behaviour is defined in `openspec/specs/`; see `AGENTS.md` for the rules agents and humans follow.

## Getting started

Requires Node 22+ and pnpm.

```sh
pnpm install
pnpm test        # vitest
pnpm typecheck   # tsc --noEmit
pnpm dev         # watch mode
```

## Status

Early development (v0.1.0). The API and the MCP tool set may change.

## License

[MIT](LICENSE)
