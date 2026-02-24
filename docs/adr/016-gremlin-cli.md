# ADR-016: Gremlin CLI — Agent-First CRUD Interface

- **Status**: accepted
- **Date**: 2026-02-24
- **Related**: ADR-015 (architecture reconciliation), ADR-014 (hybrid routing), ADR-013 (domain adapters)

## Context

Gremlin sites expose an HTTP handler (`createHttpHandler`) with RPC and RESTful routes. But there's no CLI to interact with them. Operators and agents need to:

- Log in to any gremlin-powered site
- CRUD content resources (list, get, create, update, delete)
- Manage resource relationships (add, remove, reorder)
- Call arbitrary RPC procedures
- Seed content during development

Without a CLI, all interaction requires curl + manual JSON construction or building custom scripts per site.

## Decision

Build `gremlin` CLI as `packages/cli/` (`@gremlincms/cli`) using the joelclaw cli-design skill patterns:

- **Agent-first JSON output** — every command returns `{ ok, command, result, next_actions }` envelope
- **HATEOAS** — responses include contextual next actions
- **Context-protecting** — truncate large outputs, include file pointers
- **Self-documenting** — root command returns full command tree

### Auth Flow

```
gremlin login <site-url>
# → Opens browser for BetterAuth login
# → Stores session token in ~/.gremlin/sessions/<host>.json
# → Returns { ok: true, result: { site: "...", user: "..." } }

gremlin whoami
# → Shows current session for active site
```

Sessions stored per-host in `~/.gremlin/sessions/`. CLI sends session cookie/token with every request.

### Command Tree

```
gremlin
├── login <url>                    # Authenticate with a gremlin site
├── logout [url]                   # Clear session
├── whoami                         # Current session info
├── config                         # Show/set active site URL
│   ├── set <key> <value>
│   └── get <key>
├── content                        # Content resource CRUD
│   ├── list [--type <type>] [--status <status>] [--cursor <cursor>] [--limit <n>]
│   ├── get <id-or-slug>
│   ├── create --type <type> --title <title> [--body <body>] [--status <status>]
│   ├── update <id> [--title <title>] [--body <body>] [--status <status>]
│   ├── delete <id>
│   ├── add-child <parent-id> <child-id>
│   ├── remove-child <parent-id> <child-id>
│   └── reorder <parent-id> <child-id> --position <n>
├── rpc <procedure> [--input <json>]  # Call any registered RPC procedure
└── seed [--file <path>]              # Seed content from JSON/YAML file
```

### Implementation

- **Runtime**: Bun + TypeScript
- **HTTP client**: Native fetch against the site's gremlin handler endpoint
- **No framework dependency** — the CLI is a standalone HTTP client, not coupled to Effect CLI or any specific framework
- **Config**: `~/.gremlin/config.json` for active site, `~/.gremlin/sessions/` for auth tokens
- **Build**: `bun build src/cli.ts --compile --outfile gremlin`

### Request Pattern

Every command translates to an HTTP request against the site's gremlin handler:

```typescript
// content list → GET {site}/api/gremlin/content?type=lesson&status=published&cursor=abc&limit=20
// content get → GET {site}/api/gremlin/content/{id}
// content create → POST {site}/api/gremlin/content { type, title, body, status }
// rpc → POST {site}/api/gremlin/rpc { procedure, input }
```

### JSON Envelope

All output follows cli-design skill contract:

```json
{
  "ok": true,
  "command": "gremlin content list --type lesson",
  "result": {
    "items": [...],
    "cursor": "abc123",
    "hasMore": true
  },
  "next_actions": [
    {
      "command": "gremlin content list --type lesson --cursor <cursor>",
      "description": "Next page",
      "params": { "cursor": { "value": "abc123" } }
    },
    {
      "command": "gremlin content get <id>",
      "description": "View a specific resource"
    }
  ]
}
```

## Consequences

### Easier
- Any gremlin site is fully operable from CLI
- Agents can CRUD content without custom scripts
- Seed data for development/testing
- Cross-site operations (migrate content between sites)

### Harder
- Auth flow needs browser redirect handling for initial login
- CLI must track per-site sessions
- Must stay in sync with handler API changes

## Implementation Steps

1. Create `packages/cli/` with package.json, tsconfig
2. Config module (`~/.gremlin/` directory, active site, sessions)
3. HTTP client module (fetch wrapper with auth headers, JSON envelope)
4. Auth commands (login, logout, whoami)
5. Content CRUD commands
6. RPC command
7. Seed command
8. Root self-documenting command
9. Build script + install to PATH
