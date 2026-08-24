---
title: Project & Lifecycle
sidebar:
  order: 1
---

import { Aside } from '@astrojs/starlight/components';

This page covers the commands that manage a CarryCtx project as a whole: creating it, checking its health, and administering the underlying SQLite state. It assumes you already have a Git repository and have run `carryctx init` at least once.

## `carryctx init`

Initializes CarryCtx in the current Git repository. It discovers the repository root, loads global and project configuration, creates the `.carryctx/` directory (config and README), creates the project state database under the Git common directory, registers the project in the global registry, and appends a `project.initialized` event.

| Flag | Description |
| --- | --- |
| `--name <NAME>` | Custom name for the project. Defaults to the directory name. |
| `--task-prefix <PREFIX>` | Task prefix used for issue IDs (e.g. `PROJ` produces `PROJ-123`). |
| `--main-branch <BRANCH>` | Sets the main/default branch name for Git (e.g. `main` or `master`). |
| `--force` | Re-initialize even if a `.carryctx` folder already exists. |
| `--minimal` | Create a minimal setup without standard documentation and agent templates. |
| `--install-skill` | Automatically install standard agent skills during initialization. |

<Aside type="tip">
Without `--force`, running `init` again on an already-initialized repository is safe: it checks for existing state before writing files rather than clobbering your configuration.
</Aside>

```bash
carryctx init --name my-app --task-prefix APP
```

```bash
# Re-run after deleting .carryctx by mistake
carryctx init --force
```

## `carryctx status`

Prints a project health dashboard: active sessions, active agents, all tasks, worktrees, and the current Git branch/HEAD. With no flags it renders the full JSON/text payload with all sections included.

| Flag | Description |
| --- | --- |
| `--mine` | Show only items assigned to the current agent. |
| `--all` | Show all items across the entire project regardless of status or assignment. |
| `--compact` | Print output in a compact format without detailed descriptions. |
| `--sessions` | Include active and recent agent sessions in the report. |
| `--tasks` | Include active and pending tasks in the report. |
| `--worktrees` | Include current Git worktrees linked to tasks. |
| `--since <WHEN>` | Only show events/status changes since a timestamp or duration (e.g. `24h`, `2023-01-01`). |

In Markdown output mode, `status` renders a summary block with project name, repository root, branch, HEAD, active session count, active agent count, total task count, and worktree count:

```text
# CarryCtx Status

- **Project**: my-app
- **Repository**: /home/user/my-app
- **Branch**: main
- **HEAD**: a1b2c3d
- **Active Sessions**: 1
- **Active Agents**: 2
- **Total Tasks**: 14
- **Worktrees**: 1
```

```bash
carryctx status --mine
```

```bash
carryctx status --since 24h --compact
```

## `carryctx doctor`

Diagnoses and can automatically fix potential issues with the project's SQLite state database. It checks: global config validity, Git repository discovery, installed CarryCtx git hooks (`post-commit`, `prepare-commit-msg`), [Jujutsu (jj) colocation](https://jj-vcs.dev/) (informational only), database connectivity and schema version, orphaned tasks (tasks whose owner agent no longer exists), in-progress tasks, and active sessions.

| Flag | Description |
| --- | --- |
| `--fix` | Automatically attempt to fix detected anomalies in the database and configuration. |
| `--prune-stale-worktrees` | Remove registered worktrees whose directories are missing. Never deletes files. Requires `--yes`. |
| `--json` | Output the diagnostic results in JSON format. |

Each check reports a status of `ok`, `info`, `warning`, or `error`. If any check is `error`, the overall summary is `issues_found` and the process exits with a non-success code; otherwise the summary is `healthy`.

```bash
carryctx doctor
```

```text
CarryCtx Doctor

  ✓ Git repository at /home/user/my-app
  ✓ CarryCtx hooks installed: post-commit, prepare-commit-msg
  ✓ Database at /home/user/my-app/.git/carryctx/state.db
  ✓ Schema version up to date
  ✓ No orphaned tasks (all owners exist)
  ℹ 1 task(s) currently in progress

Everything looks good!
```

<Aside type="note">
Any command that opens the project database (including `doctor` itself) transparently applies pending schema migrations first, so an upgrade from an older `carryctx` version self-heals on the next command you run — you don't need to run `project migrate` by hand for this. `doctor`'s `database.schema` check reflects the real state: it reports `error` with the specific pending migration names (and a `carryctx project migrate` fix command) only if migrations somehow couldn't be applied, not merely because a new one exists.
</Aside>

As of 0.6.0, migrations are safer about that automatic path in two ways. Before applying anything they create and verify a `VACUUM INTO` backup under `<state-dir>/backups/`, so there's always a known-good copy from immediately before the upgrade. And they validate that the applied migration history forms a contiguous prefix of the known migrations, which catches a database that was migrated by a different build rather than applying on top of it.

Separately, every state-changing command now takes a project admission lock for the duration of its write, so two commands can't interleave writes against the same project. The read-only `team status` and `team context` projections skip that lock entirely and can run concurrently with anything.

<Aside type="caution">
`doctor` does not currently apply repairs beyond schema migrations and what `carryctx init` covers for a missing database; most other `error` checks point you at a fix command (like `carryctx init`) rather than silently mutating state under `--fix`.
</Aside>

Since 0.6.0 `doctor` also detects **stale worktree registrations**: worktrees still recorded in the database whose directories no longer exist. Detection is part of the ordinary report, but pruning is never implicit — it takes both flags together, so a diagnostic run can't quietly drop registrations:

```bash
carryctx doctor --prune-stale-worktrees --yes
```

## `carryctx project`

Subcommands for administering the project as a whole and the local project registry.

| Subcommand | Description |
| --- | --- |
| `show` | Show metadata and statistics about the current project (ID, name, repository root, git common dir, database path, main branch, schema version). |
| `list` | List all known CarryCtx projects registered on this machine. |
| `register <path>` | Register the current directory as a known project globally. |
| `unregister <project_id>` | Remove a project from the global registry. |
| `migrate` | Run database migrations to upgrade the project state schema, reporting the migrations that were applied. |
| `backup` | Create a portable backup of the project's SQLite state database. |
| `restore <path>` | Restore the project's SQLite state from a backup file, validating the backup first and swapping it in atomically. |
| `prune [--older-than-days <N>]` | Archive completed tasks updated before `N` days ago to keep the primary database lightweight. Defaults to `30`. Also accepts the alias `--older-than`. |

```bash
carryctx project show
```

```bash
carryctx project backup
```

```bash
carryctx project prune --older-than-days 60
```

`project restore` is deliberately conservative: it validates the backup file before trusting it, stages the restored database as a candidate alongside the live one, and only then swaps it in atomically. If the process dies partway through, the next run recognizes which phase was interrupted and recovers from there rather than leaving you with a partially written state database.

## `carryctx agent`

Subcommands for managing the agents registered against a project. An agent has a name, an optional provider, an optional role, and a status of `active` or `deactivated`.

| Subcommand | Description |
| --- | --- |
| `register --name <NAME> [--provider <P>] [--role <ROLE>] [--kind commander\|subagent]` | Register a new agent or sync an existing one into the project state. `--kind` (0.6.0+) is nullable metadata describing the agent's execution kind. |
| `list` | List all agents registered in the project database. |
| `show <agent_ref>` | Show detailed metadata and history for a specific agent. |
| `current` | Print the currently active agent based on the environment or global args. |
| `rename <agent_ref> --name <NAME>` | Rename an existing agent. Updates the reference name but preserves the underlying ULID. |
| `deactivate <agent_ref>` | Mark an agent as inactive so it cannot be assigned new tasks or sessions. |

```bash
carryctx agent register --name claude-sonnet --provider anthropic --role implementer
```

```bash
carryctx agent rename claude-sonnet --name claude-main
```

## `carryctx session`

Subcommands that manage agent sessions. A session moves through a 5-state model: `active`, `paused`, `ended`, `stale`, and `abandoned`. `ended` and `abandoned` are terminal states; once a session reaches one of them it cannot transition further. Valid transitions are: `active` → `paused`/`ended`/`stale`/`abandoned`, `paused` → `active`/`ended`/`abandoned`, and `stale` → `active`/`ended`/`abandoned`.

| Subcommand | Description |
| --- | --- |
| `start [--agent <ID>] [--task <ID>] [--provider <P>] [--worktree <ID>] [--reuse]` | Initialize and start a new session bound to the current context. `--agent` overrides the agent creating the session; `--task` binds the session to a task explicitly (if omitted, CarryCtx tries to infer the task from the current worktree, then from the agent's single in-progress task); `--provider` records the LLM provider for telemetry; `--worktree` binds to a specific worktree directory; `--reuse` reuses an already-active session instead of erroring. |
| `list` | List historical and active sessions. |
| `show <session_id>` | Show metadata and transition history for a specific session. |
| `current` | Print the currently active session ID. |
| `pause [session_id]` | Pause the active session, logging a pause transition. Requires an agent to be resolvable from context. |
| `resume [session_id]` | Resume a previously paused session, logging a resume transition. |
| `end [session_id] [--summary <TEXT>]` | End the active session cleanly, marking it as terminated, with an optional summary of what was accomplished. |
| `abandon [session_id] [--reason <TEXT>]` | Forcibly abandon a session without recording a clean end state, useful after a crash. |

```bash
carryctx session start --task CTX-0001
```

```bash
carryctx session end --summary "Implemented pagination on the users endpoint"
```

```bash
carryctx session abandon --reason "process crashed"
```
