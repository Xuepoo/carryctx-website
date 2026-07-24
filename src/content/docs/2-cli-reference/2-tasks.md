---
title: Task Management
---

import { Aside } from '@astrojs/starlight/components';

Tasks are the unit of work CarryCtx tracks. Every task has a display ID like `CTX-0001` (the prefix comes from your project config), a status, a priority, an optional owner, and zero or more dependencies on other tasks. All the commands below assume you've already run `carryctx init` in the project.

## Creating tasks

```bash
carryctx task create --title "Add password reset flow"
```

Flags on `task create`:

| Flag | Description |
| --- | --- |
| `--title` | Required. Short descriptive title. |
| `--description` | Markdown description of the task requirements. |
| `--priority` | `low`, `normal` (default), `high`, or `urgent`. |
| `--owner` | Agent name or ULID to assign the task to on creation. |
| `--status` | Force the initial status instead of letting CarryCtx derive it (see below). Accepts `planned`, `ready`, `in_progress`, `blocked`, `review`, `completed`, `cancelled`. |
| `--depends-on` | Repeatable. Task ref (display ID or ULID) this task depends on. Creates a strong dependency edge. |

If you don't pass `--status`, CarryCtx picks it for you: a task with no incomplete dependencies starts `ready`; a task with unfinished dependencies starts `planned`. You can't force `--status ready` on a task that has incomplete strong dependencies, the CLI rejects it with a conflict error.

```bash
carryctx task create --title "Design reset email template" --priority high
# -> CTX-0001, status: ready

carryctx task create --title "Wire reset flow to email service" \
  --depends-on CTX-0001 --priority high
# -> CTX-0002, status: planned (waiting on CTX-0001)
```

<Aside type="tip">
`--depends-on` at create time always creates a `strong` dependency. Use `carryctx task depend` afterward if you need an `informational` link instead.
</Aside>

## Listing and viewing

```bash
carryctx task list
carryctx task list --status ready
carryctx task list --owner alice
carryctx task list --mine
```

`task list` flags:

| Flag | Description |
| --- | --- |
| `--status` | Filter to an exact status. |
| `--owner` | Filter to tasks owned by a given agent name or ULID. |
| `--mine` | Only show tasks owned by the current agent (from `--agent` or your configured default agent). |

`--owner` and `--mine` are independent filters; combining them narrows further only if they happen to agree. Use `--format markdown` on the top-level flag to get a Markdown table instead of JSON/table output.

```bash
carryctx task show CTX-0002
```

`task show` prints the full record: title, description, status, priority, owner, timestamps, and dependency links.

## Editing

```bash
carryctx task edit CTX-0002 --title "Wire reset flow to notification service" --priority urgent
```

`task edit` only touches `--title` and `--priority`. There's no flag to change `--description`, `--owner`, or `--status` here, use the dedicated ownership/transition commands below for those.

## Task lifecycle

CarryCtx models tasks with a 7-state status enum:

```text
planned --------> ready --------> in_progress --------> review --------> completed
   ^                 ^                 |    ^               |
   |                 |                 v    |               v
   +----------- (dependency) <---- blocked --+----------> cancelled
```

| Status | Meaning |
| --- | --- |
| `planned` | Created, but has incomplete strong dependencies. |
| `ready` | No incomplete strong dependencies, unclaimed. |
| `in_progress` | Claimed by an agent and being worked on. |
| `blocked` | Paused, always carries a reason. |
| `review` | Work is done, awaiting review. |
| `completed` | Terminal. |
| `cancelled` | Terminal. |

`completed` and `cancelled` are terminal: nothing transitions out of them except `reopen`.

## Transition commands

Each of these operates on a task ref (display ID or ULID) and enforces the rule in the table:

| Command | From | To | Enforced rule |
| --- | --- | --- | --- |
| `carryctx task claim <ref>` | `ready` | `in_progress` | Fails if already owned (different owner: "already claimed" error). Fails if it has incomplete strong dependencies. Also sets the owner to the acting agent. |
| `carryctx task release <ref>` | `in_progress`, `blocked`, `review` | `ready` (deps complete) or `planned` (deps incomplete) | Fails if the task has an active session attached. Clears the owner. |
| `carryctx task start <ref>` | `ready`, `planned` | `in_progress` | Fails if strong dependencies are incomplete. |
| `carryctx task block <ref> --reason "..."` | `in_progress`, `ready`, `planned`, `review` | `blocked` | `--reason` is required; omitting it is a validation error. |
| `carryctx task unblock <ref>` | `blocked`, `planned` | `in_progress` (if owned) or `ready` (if unowned) | Fails if strong dependencies are still incomplete. |
| `carryctx task review <ref>` | `in_progress` | `review` | No extra flags. |
| `carryctx task complete <ref>` | `review`, `in_progress` | `completed` | If the task has open progress items and `task.strict_completion` is enabled in config, completion is blocked; otherwise it succeeds with a warning. |
| `carryctx task cancel <ref> --reason "..."` | any non-terminal status | `cancelled` | `--reason` is required for active tasks. Clears the owner. |
| `carryctx task reopen <ref>` | `completed`, `cancelled` | `ready` (deps complete) or `planned` (deps incomplete) | Clears the owner. |

```bash
carryctx task claim CTX-0001
carryctx task block CTX-0001 --reason "waiting on copywriter for email text"
carryctx task unblock CTX-0001
carryctx task review CTX-0001
carryctx task complete CTX-0001
```

Trying to claim a task with incomplete strong dependencies fails immediately:

```bash
carryctx task claim CTX-0002
```

```text
Error: Task 'CTX-0002' has incomplete dependencies and cannot be claimed yet.
```

Once `CTX-0001` completes, `CTX-0002` automatically becomes `ready` and can be claimed.

## Dependencies

```bash
carryctx task depend CTX-0002 --on CTX-0001
carryctx task depend CTX-0002 --on CTX-0003 --kind informational
carryctx task undepend CTX-0002 --on CTX-0003
```

`task depend` flags:

| Flag | Description |
| --- | --- |
| `--on` | Required. The task ref this task depends on. |
| `--kind` | `strong` (default) or `informational` (`info` also accepted). |

A `strong` dependency blocks claiming and starting the dependent task until the prerequisite is `completed`. An `informational` dependency is recorded but doesn't gate any transition.

Adding a new edge is validated against the full dependency graph for the project before it's written, if it would create a cycle, the command fails:

```bash
carryctx task depend CTX-0001 --on CTX-0002
```

```text
Error: Adding this dependency would create a cycle.
```

Adding a strong dependency to an unowned `ready` task on an incomplete prerequisite automatically drops the dependent task back to `planned`. Removing the last incomplete strong dependency from a `planned`, unowned task automatically promotes it back to `ready`.

## Referencing tasks

Every command above that takes a task ref accepts either the display ID (`CTX-0001`) or the internal ULID. Same for `--owner`/agent refs: they accept the agent's name or ULID.
