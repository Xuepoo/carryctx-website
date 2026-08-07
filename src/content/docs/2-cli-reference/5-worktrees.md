---
title: Worktrees, Handoffs, and Decisions
---

import { Aside } from '@astrojs/starlight/components';

These three command groups support multi-agent collaboration. Worktrees give a task its own isolated Git checkout. Handoffs transfer a task from one agent to another. Decisions record the reasoning behind a choice so it doesn't need to be re-derived later.

## Worktrees

A worktree in CarryCtx is a registered pairing of a filesystem path, a Git branch, and (optionally) a task. The registration lives in the project database; the checkout itself is a normal `git worktree`.

### `carryctx worktree create`

```bash
carryctx worktree create CTX-0001 --path ../ctx-0001 --branch feature/ctx-0001 --base main
```

| Flag | Description |
| --- | --- |
| `TASK_REF` (positional) | Task to bind the new worktree to. |
| `--path` | Worktree location. Defaults to `.worktrees/<task-ref>` (lowercased, slashes to dashes). |
| `--branch` | Branch to create. Defaults to `carryctx/<task-ref>` (lowercased, slashes to dashes). |
| `--base` | Commit/branch to branch from. Defaults to the project's `main_branch` config (itself defaulting to `main`). |

`create` first checks that the target path doesn't already exist and that the target branch doesn't already exist, erroring out before touching the filesystem if either is true. It then runs `git worktree add`, writes a recovery journal entry for the operation, and registers + binds the new worktree to the task in one step (equivalent to `bind` on the new path).

<Aside type="caution">
If the repository is [Jujutsu (jj) colocated](https://jj-vcs.dev/) (a `.jj/` directory sits alongside `.git/`), `create` refuses with a `VALIDATION_FAILED` error instead of running `git worktree add`. jj's own secondary workspaces (`jj workspace add`) have no local `.git/` at all, so CarryCtx's state commands can't read from inside one; and a directory created by `git worktree add` is invisible to `jj workspace list`. Use `jj workspace add <path>` directly, then `carryctx worktree bind <path>` from the primary colocated checkout if you need CarryCtx to track it.
</Aside>

### `carryctx worktree bind`

```bash
carryctx worktree bind ../ctx-0001 --task CTX-0001
```

Registers an *existing* directory (already a Git worktree or the main checkout) as bound to a task, without creating anything. If the task is already bound to a different worktree, `bind` refuses with a conflict error instead of moving the binding. Omit `--task` to register a worktree with no binding yet.

### `carryctx worktree list` / `show` / `status`

```bash
carryctx worktree list
carryctx worktree show ../ctx-0001
carryctx worktree status
```

`list` shows every worktree CarryCtx knows about for the project, merged with whatever `git worktree list` reports for the current repository (the main checkout is filtered out of that merge, so only extra worktrees show up). `show` looks up one worktree by path or ID and refreshes its branch/HEAD live from Git rather than from the last-saved values. `status` prints the registered worktrees and Git's own worktree list side by side, useful for spotting drift between the two.

### `carryctx worktree unbind`

```bash
carryctx worktree unbind ../ctx-0001
```

Clears the task binding on a worktree, by path or ID. This only removes the CarryCtx association: it does not delete the directory, remove the Git worktree, or touch the branch.

<Aside type="caution">
There is no `carryctx worktree remove` or `prune` subcommand. `unbind` only detaches the task; to actually get rid of the checkout, use Git directly: `git worktree remove ../ctx-0001`.
</Aside>

## Handoffs

A handoff requests transfer of a task from the current agent to another named agent or role. It moves through a small state machine: `Open` → `Accepted` / `Rejected` / `Closed`.

### `carryctx handoff create`

```bash
carryctx handoff create --target codegen-agent --task CTX-0001 \
  --summary "Backend done, needs frontend wiring"
```

`--target` (required) is the receiving agent's ID or a role name. `--summary` is free text on what needs to happen next. `--task` is the task ULID or display ID; if omitted, CarryCtx falls back to the task bound to the current session or worktree, and errors if neither is available. The handoff snapshots the current agent as source, the given target as recipient, and the current Git branch/HEAD, then starts in `Open` status.

### `carryctx handoff list` / `show`

```bash
carryctx handoff list
carryctx handoff show HO-3f9a2b1c
```

`list` shows every handoff for the project, pending and historical. `show` prints the full record (target agent, summary, status, branch/head at creation time) for one handoff.

### `carryctx handoff accept`

```bash
carryctx handoff accept HO-3f9a2b1c --claim-task
```

Moves the handoff to `Accepted`. `--claim-task` is documented as automatically claiming the associated task for the accepting agent as part of the acceptance.

<Aside type="caution">
Accepting a handoff on its own does not change who owns the task. To actually move ownership, claim it explicitly:

```bash
carryctx handoff accept HO-3f9a2b1c
carryctx task claim CTX-0001
```

`carryctx task claim` is the same command used outside of handoffs; it assigns the task to the calling agent and sets it to `in_progress`.
</Aside>

### `carryctx handoff reject` / `close`

```bash
carryctx handoff reject HO-3f9a2b1c --reason "Already picked up by another agent"
carryctx handoff close HO-3f9a2b1c
```

`reject` moves the handoff to `Rejected`, with an optional `--reason`. `close` moves it to `Closed`, for requests that are no longer relevant (superseded, abandoned, target gone) without accepting or rejecting them.

## Decisions

Decisions are records of architectural or design choices, each tied to a task.

### `carryctx decision add`

```bash
carryctx decision add \
  --title "Use SQLite for local task storage" \
  --context "Need embedded storage with no external service dependency" \
  --decision "SQLite via rusqlite, one file per project" \
  --consequences "Migrations must be handled manually; no built-in replication" \
  --rationale "Avoids running a separate database service just to track task state" \
  --task CTX-0001
```

Only `--title` is required; `--context`, `--decision`, `--consequences`, and `--rationale` are optional but recommended. `--rationale` is the "why" behind the decision — the part a title alone can't carry — and is included in `decision search` along with the other fields. `--task` falls back to the current task context and the command errors if no task can be resolved at all.

### `carryctx decision list` / `show` / `search`

```bash
carryctx decision list
carryctx decision show DEC-0007
carryctx decision search "sqlite"
```

`list` shows every decision recorded for the project. `show` prints one decision in full. `search QUERY` does a keyword search over recorded decisions.

### `carryctx decision supersede`

```bash
carryctx decision supersede DEC-0007 --by DEC-0012
```

Marks an old decision as superseded by a newer one. `--by` (required) is the ID of the replacement.

<Aside type="note">
There is no `carryctx decision remove` or delete command. Decisions are permanent once recorded; the only way to retire one is `supersede`, which keeps the original visible but marks it replaced.
</Aside>

## Example: worktree, decision, handoff together

A task started by one agent and finished by another:

```bash
# 1. Spin up an isolated worktree for the task
carryctx worktree create CTX-0001 --path ../ctx-0001 --branch feature/ctx-0001
cd ../ctx-0001
# ... edits, commits ...

# 2. Record why a key choice was made, while it's fresh
carryctx decision add \
  --title "Store worktree bindings in the main project DB" \
  --context "Considered a per-worktree local DB instead" \
  --decision "Single shared DB keyed by project_id, avoids sync issues" \
  --task CTX-0001

# 3. Hand the task off to another agent
carryctx handoff create --target reviewer-agent --task CTX-0001 \
  --summary "Storage layer done, needs test coverage and review"
```

On the receiving side:

```bash
carryctx handoff show HO-3f9a2b1c
carryctx handoff accept HO-3f9a2b1c
carryctx task claim CTX-0001
```

The worktree stays registered and bound to `CTX-0001` throughout; only the task's ownership and the handoff's status change. Once the work lands, unbinding and removing the worktree is a separate, explicit step:

```bash
carryctx worktree unbind ../ctx-0001
git worktree remove ../ctx-0001
```

</content>
</invoke>
