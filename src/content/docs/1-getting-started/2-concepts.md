---
title: Core Concepts
---

import { Aside } from '@astrojs/starlight/components';

CarryCtx's state is a set of related records in a SQLite database. This page defines each one precisely: what it means, what commands create or read it, and (for the two that have a real lifecycle) exactly which state transitions are allowed.

## Project

A Project corresponds to one Git repository. It's created once with `carryctx init`, which writes `.carryctx/config.toml` at the repository root (project name, task ID prefix, main branch) and creates the state database inside the Git common directory, so every worktree of the repository shares the same project state.

```bash
carryctx init --name my-app --task-prefix CTX
```

Every other record (task, agent, session, ...) belongs to exactly one project.

## Agent

An Agent is any entity that acts on the project, human or AI. Agents are registered explicitly and referenced by name or ULID everywhere else in the system:

```bash
carryctx agent register --name claude-core --provider claude-code --role implementer
```

Registering an existing name syncs it rather than erroring. `carryctx agent current` prints whichever agent is active for the invocation (resolved from `--agent` or the `CARRYCTX_AGENT` environment variable). `carryctx agent deactivate <ref>` marks an agent inactive so it can no longer be assigned new tasks or sessions; it does not delete history.

Since 0.6.0 an agent also carries an optional `kind` (`commander` or `subagent`), set with `--kind` at registration. It's nullable metadata for the caller's benefit, not a permission boundary.

## Team

A Team (0.6.0+) is a durable, project-scoped roster of agents with an optional commander. Because it lives in the same state database as everything else, it survives the session that created it — new window, new session, or a linked worktree, and the roster is unchanged.

```bash
carryctx team create --name payments-squad --commander commander-1
carryctx team member add payments-squad --agent backend-1 --role backend
```

Two invariants are enforced: a commander must be a member of its own team, and the sitting commander can't be removed until it's replaced or explicitly cleared with `team commander set <ref> --clear`.

Tasks can be associated with a team (`task create --team`, `task team set`, `task team unset`) and can carry an advisory `required_role`. Neither changes lifecycle, ownership, dependencies, or scopes — association is purely additive labelling, and `required_role` gates nothing.

The read side is two projections that open the database read-only and write nothing at all: `carryctx team status` for the roster with per-member active work, and `carryctx team context` for the full picture a commander or member needs, narrowable with `--agent-for` and `--task`.

<Aside type="caution">
A Team is a persistence and management primitive, not an orchestration one. CarryCtx does not spawn, route, retry, rate-limit, or heartbeat anything — the harness that calls CarryCtx does. An agent may hold several active tasks at once; `task.single_active_task_per_agent` is compatibility-only and does not enforce a limit. See [Teams](/2-cli-reference/10-teams/) for the full command surface.
</Aside>

## Session

A Session represents one continuous working period for an agent, bound to a task and (optionally) a worktree. Sessions use a 5-state model:

```text
Active ──┬──> Paused ──> Active
         ├──> Ended        (terminal)
         ├──> Stale ──> Active
         └──> Abandoned    (terminal)
```

- `carryctx session start --agent claude-core --task CTX-0001` creates a session in `Active` state.
- `carryctx session pause` logs a sleep/pause transition, moving `Active → Paused`.
- `carryctx session resume` moves it back to `Active` (also valid from `Stale`).
- `carryctx session end --summary "..."` cleanly terminates it (`Ended`, terminal).
- `carryctx session abandon --reason "crashed"` force-terminates it without a clean end state (`Abandoned`, terminal).

`Ended` and `Abandoned` are terminal: no further transition is allowed out of them. `Stale` exists for sessions the runtime has detected as inactive without an explicit pause.

## Task

A Task is the basic unit of work, shown with a display ID like `CTX-0001`. Tasks use a 7-state status model:

| Status | Meaning |
| --- | --- |
| `planned` | Recorded but not yet actionable (e.g. waiting on unfinished dependencies) |
| `ready` | Actionable, unclaimed or claimed but not started |
| `in_progress` | Actively being worked on |
| `blocked` | Work is stalled on an external or internal blocker |
| `review` | Implementation done, awaiting review |
| `completed` | Done (terminal) |
| `cancelled` | Abandoned, won't be done (terminal) |

`completed` and `cancelled` are terminal. `in_progress`, `review`, and `blocked` all count as "active" for the purposes of dashboards and `task list --mine`.

Transitions are driven by named actions, each mapped to a subcommand:

```text
claim   → owner is set, status typically becomes ready
start   → ready        → in_progress   (also auto-binds the task to the caller)
block   → in_progress  → blocked       (requires a reason)
unblock → blocked      → in_progress
review  → in_progress  → review
complete→ review/in_progress → completed
cancel  → any non-terminal → cancelled (requires a reason)
reopen  → completed/cancelled → in_progress
release → clears ownership without changing status
```

```bash
carryctx task create --title "Add streaming CSV export" --priority high
carryctx task claim CTX-0001
carryctx task start CTX-0001
carryctx task block CTX-0001 --reason "waiting on upstream API schema"
carryctx task unblock CTX-0001
carryctx task complete CTX-0001
```

A newly created task with no unfinished dependencies starts in `ready`; one with unfinished dependencies starts in `planned` (or `--status` can set it explicitly).

A task also has two nullable fields added in 0.6.0: `team_id` (the team it's associated with) and `required_role` (an advisory role label). Neither participates in the state machine above.

## Checkpoint

A Checkpoint is a persisted snapshot of what an agent has learned about a task's progress at a point in time: what's done, what remains, what's blocking, what risks were identified, and what the next step is, optionally alongside the actual Git diff.

```bash
carryctx checkpoint --done "Implemented CSV writer" --remaining "Add streaming for >1M rows" --next "Wire writer into pipeline"
```

By default a checkpoint also runs `git add`/`git commit` to capture file changes (`--no-git` disables that), and `--include-diff` embeds the uncommitted diff directly into the checkpoint record. `carryctx checkpoint list` and `carryctx checkpoint show <id>` read them back; `carryctx checkpoint correct <id>` rolls project/agent state back to a previous checkpoint.

## Progress Item

A Progress Item is a smaller, more frequent unit than a checkpoint: a single todo, blocker, risk, or note attached to a task, logged as you go rather than batched at a checkpoint.

```bash
carryctx progress todo "Write unit tests for the streaming writer"
carryctx progress block "S3 credentials missing in CI"
carryctx progress note "Chunked upload caps out at 5MB parts"
```

Progress items can be completed (`progress complete <ref>`), reopened, edited, removed, or reordered independently of the task's own status.

## Worktree

A Worktree record binds a Git worktree directory to a task, so that CLI invocations run from inside that directory automatically resolve to the right task without needing `--task` every time.

```bash
carryctx worktree create CTX-0001 --branch feature/csv-export
```

`carryctx worktree status` reports the binding of the current directory; `carryctx worktree unbind <ref>` removes it.

## Handoff

A Handoff is an explicit request for another agent (or role) to take over a task, distinct from just changing the `owner` field: it carries a summary and can be accepted or rejected.

```bash
carryctx handoff create --target reviewer-bot --task CTX-0001 --summary "Ready for review, tests green"
carryctx handoff accept <handoff_ref> --claim-task
```

## Decision

A Decision records an architectural or design choice (an ADR, in effect): the context that prompted it, the decision itself, and its consequences, optionally linked to a task. Decisions can later be marked as `superseded` by a newer decision.

```bash
carryctx decision add --title "Use chunked multipart upload for CSV export" --context "Files exceed 1M rows" --decision "Stream via S3 multipart API"
```

## Event

An Event is a single immutable row in the append-only log everything above is ultimately built on: task transitions, session lifecycle changes, checkpoints, and more, each timestamped and attributed to an agent and session.

```bash
carryctx event list --task CTX-0001 --limit 20
```

<Aside type="note">
`carryctx resume`, `carryctx context`, and the `carryctx team` projections don't introduce new state, they read across sessions, tasks, checkpoints, progress, and recent events to reconstruct what an agent needs to know. See [Quickstart](/1-getting-started/3-quickstart/) for a full walkthrough.
</Aside>
