---
title: Handoffs
---

import { Aside } from '@astrojs/starlight/components';

Handoffs transfer in-flight work between agents. When one agent can't finish a task (out of context, different specialty, worktree boundary), it files a handoff routed at another agent or role; the target finds it with `handoff list`, and accepting it formalizes who owns the work next.

<Aside type="note">
  Handoffs are the multi-agent counterpart of `task release`/`task claim`: the handoff records *what* still needs doing and *why*, while the task state change (ownership) is a separate, explicit step.
</Aside>

## Creating a handoff

```bash
carryctx handoff create --target opencode-core --task CTX-0001 --summary "Migration runner implemented, needs review"
```

| Flag               | Description                                                                   |
| ------------------ | ----------------------------------------------------------------------------- |
| `--target`         | Required. The destination agent: a registered agent name, ULID, or role name. |
| `--task <ref>`     | The task ULID or display ID this handoff is about.                            |
| `--summary <text>` | What needs to be done or why the handoff is happening.                        |

The source agent is derived from `CARRYCTX_AGENT` (or `--agent`).

## Finding your handoffs

```bash
carryctx handoff list            # actionable (pending) requests routed to anyone
carryctx handoff list --for-agent opencode-core
carryctx handoff list --all      # include resolved handoffs
```

| Flag                  | Description                                                                                                                 |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `--status <status>`   | Exact status filter: `pending` (alias `open`), `accepted`, `declined` (alias `rejected`), `closed`.                         |
| `--all`               | Show every handoff regardless of status. Default is pending only, so resolved handoffs don't drown the session-start check. |
| `--for-agent <agent>` | Only handoffs routed to this agent (name, ULID, or role).                                                                   |

## Accepting, rejecting, closing

```bash
carryctx handoff accept HO-0001
carryctx handoff accept HO-0001 --claim-task   # also claim the task
carryctx handoff reject HO-0001 --reason "Out of scope"
carryctx handoff close HO-0001                 # no longer relevant
```

| Flag              | Description                                                                                                                                                                                                                                                                                                                           |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--claim-task`    | (accept only) Claim the handoff's task for the accepting agent in the same transaction, mirroring `task claim`: the task moves to `in_progress` and its owner becomes the accepting agent. If the task can't be claimed (already owned, wrong status, incomplete dependencies), the whole accept fails and the handoff stays pending. |
| `--reason <text>` | (reject only) Why the handoff was rejected.                                                                                                                                                                                                                                                                                           |

`show` prints the full record of a single handoff:

```bash
carryctx handoff show HO-0001
```

Each transition appends an audit event (`handoff.created`/`handoff.accepted`/`handoff.rejected`/`handoff.closed`) in the same transaction as the status change.
