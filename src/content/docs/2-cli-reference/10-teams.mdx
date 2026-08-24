---
title: Teams
sidebar:
  order: 10
---

import { Aside } from '@astrojs/starlight/components';

A Team (0.6.0+) is a durable, project-scoped roster of agents. It lives in the same `state.sqlite` as your tasks, which means it outlives the session that created it: close the window, open a new one, or `cd` into a linked worktree, and the team is still there with the same members, the same commander, and the same task associations.

Teams answer three questions that used to live only in a prompt or in someone's head: **who is on this team**, **what is each member working on**, and **what does a given member need to know right now**. They do not run anybody's agents.

<Aside type="caution">
CarryCtx is the management and persistence layer, not an orchestration framework. Spawning processes, routing work, retries, concurrency limits, worktree creation, heartbeats, and model selection all belong to the harness that calls CarryCtx. 0.6.0 ships no scheduler, no worker runtime, and no lease or heartbeat machinery.
</Aside>

## Creating a team

```bash
carryctx team create --name payments-squad
carryctx team create --name payments-squad --commander commander-1
```

| Flag                      | Description                                                                                                   |
| ------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `--name <NAME>`           | Required. Team name, used as a ref in every other `team` command.                                             |
| `--commander <AGENT_REF>` | Optional. Agent name or ULID to install as commander. The agent is added as a member in the same transaction. |

Passing `--commander` at create time enrolls that agent as a member too, so you never end up with a commander who isn't on their own team.

## Membership

```bash
carryctx team member add payments-squad --agent backend-1 --role backend
carryctx team member add payments-squad --agent reviewer-1 --role reviewer
carryctx team member remove payments-squad --agent frontend-1
```

| Flag                  | Description                                                                                                                 |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `--agent <AGENT_REF>` | Required. The agent being added or removed, by name or ULID.                                                                |
| `--role <ROLE>`       | Optional, `add` only. Free-form role label (`backend`, `reviewer`, ...) used for matching against a task's `required_role`. |

Note that on these subcommands `--agent` names the _subject_ of the operation, not the caller. Identify the acting agent with `CARRYCTX_AGENT` (or the global `--agent` on commands that don't shadow it) so the audit event is attributed correctly.

Adding an agent that is already a member is a conflict rather than a silent no-op:

```json
{
  "schema_version": 1,
  "command": "team.member_add",
  "success": false,
  "error": {
    "code": "STATE_CONFLICT",
    "message": "Agent is already a member of this team."
  }
}
```

## The commander

```bash
carryctx team commander set payments-squad --agent commander-1
carryctx team commander set payments-squad --clear
```

Two rules are enforced in the database, not just by convention:

- **A commander must be a member of its own team.** Promoting a non-member fails with `STATE_CONFLICT` (`Commander must be a member of this team.`).
- **The current commander cannot be removed from the team.** `team member remove` on the sitting commander fails with `Cannot remove the current team commander.` Either promote a replacement first, or run `team commander set <ref> --clear` and then remove them.

```bash
carryctx team member remove payments-squad --agent commander-1
```

```json
{
  "schema_version": 1,
  "command": "team.member_remove",
  "success": false,
  "error": {
    "code": "STATE_CONFLICT",
    "message": "Cannot remove the current team commander."
  }
}
```

A team with `commander_agent_id: null` is legal — it's a roster without a designated lead, not a broken team.

## Associating tasks with a team

Team association is a label on the task, applied at creation or afterward:

```bash
carryctx task create --title "Add idempotency keys to charge endpoint" \
  --team payments-squad --required-role backend --priority high

carryctx task team set CTX-0004 --team payments-squad
carryctx task team set CTX-0004 --team none
carryctx task team unset CTX-0004
carryctx task edit CTX-0004 --required-role reviewer
```

`--team none` and `task team unset` are the same operation. Both return the updated task with `previous_team_id` so a caller can tell what changed:

```json
{
  "schema_version": 1,
  "command": "task.team_set",
  "success": true,
  "data": {
    "operation": { "applied": true },
    "previous_team_id": null,
    "task": {
      "display_id": "CTX-0004",
      "required_role": null,
      "status": "ready",
      "team_id": "01M0KK3XDQJ8CE7XBDH1YFHTZQ",
      "title": "Unassociated chore: bump deps"
    }
  }
}
```

<Aside type="note">
Association is purely additive. Putting a task on a team never changes its lifecycle, ownership, dependencies, or scopes, and never gates a transition. `agents.kind` and `tasks.required_role` are nullable metadata in the same spirit: `required_role` is advisory, and nothing in CarryCtx refuses to let the "wrong" role claim a task.
</Aside>

## Agent kind

```bash
carryctx agent register --name commander-1 --provider claude-code --kind commander
carryctx agent register --name backend-1 --provider claude-code --kind subagent
```

`--kind` accepts `commander` or `subagent` and is nullable — agents registered before 0.6.0, or without the flag, simply have no kind. It's a hint for the harness and for reading `team status`, not a permission boundary.

## Read-only projections

`team status` and `team context` are the read side. Both open the database **read-only**, run no migrations, skip the project admission lock that write commands take, and write nothing at all: no events, no claims, no sessions. You can call them on every turn of an agent loop without polluting the audit log.

### `carryctx team status`

```bash
carryctx team status                  # every team in the project
carryctx team status payments-squad   # one team
```

With a ref, the payload is `{team, members, counts}`; with no ref it's `{teams: [...]}` containing the same object per team.

```json
{
  "schema_version": 1,
  "command": "team.status",
  "success": true,
  "data": {
    "counts": {
      "commanders": 1,
      "subagents": 3,
      "total": 4,
      "unassigned": 2
    },
    "members": [
      {
        "active_session_id": "01M0KK4K9K5J4DBXCFHRD9NF3C",
        "active_task_count": 2,
        "agent_id": "01M0KK3XC355MZ8BVKPTZZWNK3",
        "kind": "subagent",
        "name": "backend-1",
        "role": "backend",
        "tasks": [
          {
            "display_id": "CTX-0001",
            "status": "in_progress",
            "team_id": "01M0KK3XDQJ8CE7XBDH1YFHTZQ"
          },
          {
            "display_id": "CTX-0003",
            "status": "blocked",
            "team_id": "01M0KK3XDQJ8CE7XBDH1YFHTZQ"
          }
        ]
      },
      {
        "active_session_id": null,
        "active_task_count": 0,
        "agent_id": "01M0KK3XBHDJ3NAE0ZZ44YV4Q8",
        "kind": "commander",
        "name": "commander-1",
        "role": "lead",
        "tasks": []
      }
    ],
    "team": {
      "commander_agent_id": "01M0KK3XBHDJ3NAE0ZZ44YV4Q8",
      "created_at": "2026-08-22T01:59:40.727797581+00:00",
      "id": "01M0KK3XDQJ8CE7XBDH1YFHTZQ",
      "name": "payments-squad",
      "project_id": "01M0KK3XAHNPJTG551RF462R1E",
      "updated_at": "2026-08-22T02:01:29.951021409+00:00"
    }
  },
  "meta": { "timestamp": "2026-08-22T02:03:29.065696830+00:00" }
}
```

Each member carries its `role`, its `kind`, its `active_session_id` (or `null`), and `tasks`: that member's non-terminal tasks with status. `counts` mixes two axes deliberately:

| Field        | Meaning                                                              |
| ------------ | -------------------------------------------------------------------- |
| `total`      | Member count.                                                        |
| `commanders` | Members whose `kind` is `commander`.                                 |
| `subagents`  | Members whose `kind` is `subagent`.                                  |
| `unassigned` | Team **tasks** with no owner — the backlog a commander can hand out. |

### `carryctx team context`

```bash
carryctx team context payments-squad
carryctx team context payments-squad --agent-for backend-1
carryctx team context payments-squad --task CTX-0002
```

This is the projection you feed to an agent. It reconstructs everything the team (or one member, or one task) needs from durable records:

| Field                        | Contents                                                                                                                            |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `team`                       | `id` and `name` of the projected team.                                                                                              |
| `view`                       | `commander` (whole team), `member` (`--agent-for`), or `task` (`--task`).                                                           |
| `members`                    | Roster, narrowed to the subject when `--agent-for` is used.                                                                         |
| `tasks`                      | Team tasks in scope, with `owner_agent_id`, `required_role`, `status`, `priority`.                                                  |
| `dependencies`               | Dependency edges, closed over the returned task set.                                                                                |
| `scopes` / `scope_conflicts` | File-scope reservations. Present in the envelope; no 0.6.0 CLI command writes them, so they are empty in practice.                  |
| `progress`                   | Open progress items across the in-scope tasks.                                                                                      |
| `blockers`                   | The subset of progress items of type `blocker`.                                                                                     |
| `conflicts`                  | Currently mirrors `scope_conflicts`.                                                                                                |
| `latest_checkpoints`         | Most recent checkpoint per in-scope task.                                                                                           |
| `decisions`                  | Decisions attached to in-scope tasks.                                                                                               |
| `handoffs`                   | Handoffs touching in-scope tasks, with status.                                                                                      |
| `recent_events`              | Recent audit events for in-scope tasks.                                                                                             |
| `rebuild`                    | Provenance: `source` is `"durable_records"`, plus the `session_id` the projection was rebuilt for (`null` when none is resolvable). |

`--agent-for` and `--task` narrow **every** collection consistently, and dependency edges are closed over the returned task set — so an edge only appears if both of its tasks are in scope. Narrowing to `backend-1`, whose two tasks have no edge between them, drops `dependencies` to empty even though `CTX-0002` depends on `CTX-0001` project-wide:

```json
{
  "schema_version": 1,
  "command": "team.context",
  "success": true,
  "data": {
    "blockers": [
      {
        "content": "Ledger snapshot export is missing Feb rows",
        "id": "01M0KK54GSNHJM1HY43NKWXGBX",
        "task_id": "01M0KK4DHGHJD7ARPVD4T7XP32",
        "type": "blocker"
      }
    ],
    "conflicts": [],
    "decisions": [
      {
        "created_at": "2026-08-22T02:00:20.818487042+00:00",
        "decision": "Return 409 with original charge id",
        "display_id": "DEC-0001",
        "id": "01M0KK54JJPKTB64WWE393M2GE",
        "rationale": null,
        "task_id": "01M0KK4DGDZY2R9ZM8ZKB7HGW4",
        "title": "Mirror Stripe 409 for replayed charges"
      }
    ],
    "dependencies": [],
    "handoffs": [
      {
        "created_at": "2026-08-22T02:00:20.835331503+00:00",
        "display_id": "HO-0001",
        "id": "01M0KK54K34E6D5Y40Z6BD8CN9",
        "source_agent_id": "01M0KK3XC355MZ8BVKPTZZWNK3",
        "status": "pending",
        "summary": "Replay detection ready for review",
        "target_agent_id": "01M0KK3XD5X9D2ZEDMBBCSHG58",
        "task_id": "01M0KK4DGDZY2R9ZM8ZKB7HGW4"
      }
    ],
    "latest_checkpoints": [
      {
        "blockers": "[]",
        "created_at": "2026-08-22T02:00:20.799022723+00:00",
        "done": "[\"Schema migration written\"]",
        "id": "01M0KK54HZBV2RZDM3KPRKWP16",
        "remaining": "[\"Wire replay detection into handler\"]",
        "task_id": "01M0KK4DGDZY2R9ZM8ZKB7HGW4"
      }
    ],
    "members": [
      {
        "agent_id": "01M0KK3XC355MZ8BVKPTZZWNK3",
        "kind": "subagent",
        "name": "backend-1",
        "role": "backend"
      }
    ],
    "progress": [
      {
        "content": "Add idempotency_key column + unique index",
        "id": "01M0KK54FMPZDA6SNYR70D7AGA",
        "position": 0,
        "status": "open",
        "task_id": "01M0KK4DGDZY2R9ZM8ZKB7HGW4",
        "type": "todo"
      }
    ],
    "rebuild": {
      "session_id": null,
      "source": "durable_records"
    },
    "recent_events": ["..."],
    "scope_conflicts": [],
    "scopes": [],
    "tasks": [
      {
        "display_id": "CTX-0001",
        "owner_agent_id": "01M0KK3XC355MZ8BVKPTZZWNK3",
        "priority": "high",
        "required_role": "backend",
        "status": "in_progress",
        "team_id": "01M0KK3XDQJ8CE7XBDH1YFHTZQ",
        "title": "Add idempotency keys to charge endpoint"
      },
      {
        "display_id": "CTX-0003",
        "owner_agent_id": "01M0KK3XC355MZ8BVKPTZZWNK3",
        "priority": "urgent",
        "required_role": "backend",
        "status": "blocked",
        "team_id": "01M0KK3XDQJ8CE7XBDH1YFHTZQ",
        "title": "Audit refund ledger reconciliation"
      }
    ],
    "team": {
      "id": "01M0KK3XDQJ8CE7XBDH1YFHTZQ",
      "name": "payments-squad"
    },
    "view": "member"
  },
  "meta": { "timestamp": "2026-08-22T02:03:29.065696830+00:00" }
}
```

`--task CTX-0002` behaves the same way for a single task: `view` becomes `task`, `tasks` holds just that task, and `members` comes back empty when the task has no owner.

## Multiple active tasks per agent

An agent can hold several non-terminal tasks at once. This is supported on purpose — `active_task_count: 2` in the output above is `backend-1` holding `CTX-0001` (`in_progress`) and `CTX-0003` (`blocked`) simultaneously.

<Aside type="caution">
The `task.single_active_task_per_agent` config key is compatibility-only and **non-enforcing**: setting it does not stop an agent from claiming a second task. Capacity policy is the commander's or the harness's job, not the CLI's.
</Aside>

## Writes, audit, and dry-run

Every `team` and `task team` write command mutates state, appends an audit event in the same transaction, and supports `--json` and `--dry-run`. A dry run resolves and validates refs, then reports `applied: false` without touching the database:

```bash
carryctx team create --name throwaway --dry-run --json
```

```json
{
  "schema_version": 1,
  "command": "team.create",
  "success": true,
  "data": { "commander_agent_id": null, "operation": { "applied": false } },
  "meta": { "timestamp": "2026-08-22T02:02:44.643550382+00:00" }
}
```

All team JSON is `snake_case`.

## Referencing teams

Every `<TEAM_REF>` accepts the team name or its ULID, the same convention tasks (`CTX-0001` or ULID) and agents (name or ULID) already use.
