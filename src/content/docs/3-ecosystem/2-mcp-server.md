---
title: MCP Integration
---

import { Aside } from '@astrojs/starlight/components';

The [Model Context Protocol](https://modelcontextprotocol.io) (MCP) is a standard JSON-RPC interface that lets an editor or agent client discover and call tools exposed by an external process over stdio; `carryctx mcp` starts CarryCtx as exactly that kind of process, so any MCP-aware client can drive tasks, the context graph, and project stats without shelling out to the CLI directly.

## Wiring it into an MCP client

```bash
carryctx mcp
```

This starts a stdio JSON-RPC server: it reads one JSON-RPC request per line from stdin and writes one response per line to stdout. There is no other transport (no HTTP, no sockets); a `--stdio` flag is accepted for compatibility with clients that always pass it, but it has no effect since stdio is the only mode.

Most clients don't run this manually, you configure them to spawn it. The config block is the same for Cursor, Windsurf, Claude Desktop, or any other client that reads an `mcpServers` map:

```json
{
  "mcpServers": {
    "carryctx": {
      "command": "carryctx",
      "args": ["mcp"]
    }
  }
}
```

Drop that into the client's MCP settings file (for Cursor, `.cursor/mcp.json`; for Claude Desktop, `claude_desktop_config.json`; check your client's docs for the exact path) and restart the client. It will spawn `carryctx mcp` per session and talk to it over stdin/stdout.

<Aside type="caution">
`carryctx mcp` runs with the same filesystem access as whatever process starts it, and its `tools/call` handler shells out to the `carryctx` binary itself with whatever `args` array the client sends. Only wire this into clients and workspaces you trust; there's no additional sandboxing beyond what the underlying CLI commands already do.
</Aside>

## How tool calls work

Every exposed tool takes the same two-field input shape: an `action` string (which CLI subcommand to run) and an optional `args` array (extra CLI flags, as raw strings):

```json
{
  "name": "carryctx_task_manager",
  "arguments": {
    "action": "list",
    "args": ["--status", "ready"]
  }
}
```

Internally, CarryCtx maps the tool name to a CLI subcommand, appends `--json`, appends the `action` as the next argument, appends every string in `args` verbatim, spawns itself as a subprocess, and returns stdout (plus stderr, if any) as the tool's text result.

## The six exposed tools

These are the exact tool names and action lists returned by `tools/list`. Treat the action lists below as authoritative, they are the same strings the MCP server advertises to a client.

### `carryctx_graph_explorer`

Query, scan, and export the project Context Graph (nodes, edges, dependencies, file-to-file links).

- Actions: `scan`, `edges`, `link`, `add-node`, `export`
- Maps to: `carryctx graph <action> [args...]`

### `carryctx_context_manager`

Manage persistent context, checkpoints, and state snapshots.

- Actions: `status`, `context`, `checkpoint`, `resume`, `doctor`
- Maps to: `carryctx <action> [args...]` directly (no subcommand prefix; `action` is itself the top-level command)

### `carryctx_task_manager`

Manage project tasks, dependencies, and priorities.

- Actions: `list`, `create`, `update`, `claim`, `complete`, `block`, `unblock`
- Maps to: `carryctx task <action> [args...]`

### `carryctx_progress_tracker`

Manage task progress, notes, and blockers.

- Actions: `list`, `create`, `update`, `resolve`
- Maps to: `carryctx progress <action> [args...]`

### `carryctx_decision_logger`

Log and search architectural decision records (ADRs).

- Actions: `list`, `record`, `resolve`
- Maps to: `carryctx decision <action> [args...]`

### `carryctx_project_admin`

Manage project database, stats, cold storage archiving, and config.

- Actions: `stats`, `prune`, `config`, `project`
- Maps to: `carryctx <action> [args...]` for `stats`/`config`, except `prune`, which maps to `carryctx project prune [args...]`

## Example call and response

Requesting the ready tasks through `carryctx_task_manager`:

```json
{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"carryctx_task_manager","arguments":{"action":"list","args":["--status","ready"]}}}
```

Response (the `text` field is exactly what `carryctx task list --status ready --json` would print to stdout):

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "content": [
      { "type": "text", "text": "{\"schema_version\":1,\"command\":\"task.list\",\"success\":true,\"data\":[{\"displayId\":\"CTX-0001\", \"title\":\"Fix retry logic\", \"status\":\"ready\"}]}" }
    ],
    "isError": false
  }
}
```

If `output.status` from the underlying process is non-zero, `isError` is `true` and `text` includes a `--- STDERR ---` section appended after stdout.

<Aside type="note">
There's no `initialize` handshake beyond the standard MCP one, and no authentication layer: any process that can write to this server's stdin can invoke any of the six tools with any action. This is intentional for a local, single-user dev tool, but it's worth knowing if you ever pipe `carryctx mcp` through something other than a trusted local MCP client.
</Aside>
