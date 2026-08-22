---
title: Full-Text Search
sidebar:
  order: 7
---

import { Aside } from '@astrojs/starlight/components';

`carryctx search` finds prior work by content across tasks, progress items, checkpoints, and decisions, without needing to remember which branch or task touched it. A branch name alone rarely carries what actually changed and why; `search` reaches the text that does.

## Basic usage

```bash
carryctx search "markdown worker protocol"
```

Searches all four entity kinds and returns hits ranked by relevance (SQLite FTS5's `bm25()`), most relevant first.

## Flags

| Flag | Description |
| --- | --- |
| `<query>` (positional) | The search text. Supports [FTS5 query syntax](https://www.sqlite.org/fts5.html#full_text_query_syntax): quoted phrases (`"exact phrase"`), boolean operators (`term1 OR term2`), and prefix matches (`retry*`). |
| `--type <kind>` | Restrict to one entity kind: `task`, `progress`, `checkpoint`, or `decision`. |
| `--status <status>` | Restrict to hits whose owning task has this exact status (e.g. `in_progress`, `completed`). |
| `--assignee <agent>` | Restrict to hits whose owning task is owned by this agent (name or ULID). |
| `--limit <n>` | Maximum number of hits to return. Defaults to 20. |

```bash
carryctx search "retry backoff" --type checkpoint
carryctx search "auth flow" --status in_progress --assignee claude-code
```

<Aside type="note">
`--assignee` is deliberately not named `--agent`. The global `--agent`/`CARRYCTX_AGENT` identity flag is defined with `global = true` in the CLI, and a subcommand-local flag with the same name silently inherits its value even when you don't pass it on the command line for that subcommand — the same root cause behind the `event list --agent` bug fixed in 0.2.1. Naming this flag `--assignee` avoids the collision outright instead of requiring users to remember a workaround.
</Aside>

## What each hit tells you

Every result resolves back to its owning task, since that's the usual reason to search in the first place:

```json
{
  "kind": "checkpoint",
  "id": "01J...",
  "display_id": null,
  "task_id": "01J...",
  "task_display_id": "CTX-0001",
  "task_status": "in_progress",
  "branch": "feature/md-worker",
  "snippet": "PR #263 merged - [markdown] worker-owned source, steady-state...",
  "score": -3.2,
  "created_at": "2026-07-28T19:00:00Z"
}
```

- `task_display_id` / `task_status`: the owning task, always present.
- `display_id`: the hit's own display ID, if it has one (progress items and decisions do; tasks and checkpoints don't have a separate one from the task's).
- `branch`: the best-known branch for this hit. For checkpoint hits, this is the branch the checkpoint itself recorded at creation time (more precise than the task's *current* worktree binding, since a task can move worktrees after a checkpoint was made); for every other hit kind, it's the task's current worktree binding. `null` if neither is known.
- `snippet`: a short excerpt with the match bracketed in `[...]`.
- `score`: the FTS5 BM25 relevance score. Lower (more negative) means more relevant; results are already sorted by this.

## Output formats

```bash
carryctx search "markdown" --json
carryctx search "markdown" --format markdown
```

`--format markdown` renders a table (kind, task, branch, snippet) instead of the raw JSON array — useful for pasting a quick summary into a PR description or handoff note.

## What's indexed

| Entity | Indexed text |
| --- | --- |
| Tasks | `title`, `description` |
| Progress items | `content` |
| Checkpoints | `done`, `remaining`, and `notes` entries, flattened into one searchable blob |
| Decisions | `title`, `context`, `decision`, `consequences` |

The index is a set of SQLite FTS5 virtual tables kept in sync by triggers on every insert, update, and delete — there's no separate "reindex" step, and no risk of the index drifting from the underlying tables. Upgrading from a version of `carryctx` that predates `search` backfills the index for all existing rows automatically the next time any command opens the project database.
