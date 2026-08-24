---
title: Introduction
---

import { Aside } from '@astrojs/starlight/components';

Your coding agent forgets everything the moment its window closes. You close Claude Code, or your terminal crashes, or you switch to a different worktree to work on something else. Tomorrow's session, or a teammate's, or a completely different agent, has no idea what you were doing, what's done, what's blocked, or which branch you were on.

Chat history isn't project state. It lives inside a provider's context window, and it disappears the moment that window closes. Commit messages don't explain intent, they explain what changed, not why, or what's left. A hand-written `HANDOFF.md` goes stale the moment you stop updating it by hand, and nobody updates it consistently under deadline pressure.

CarryCtx is a local-first CLI that gives coding agents a real memory: structured tasks, progress logs, decisions, and Git-aware checkpoints, all persisted in a single SQLite file inside your repository. Any agent, in any window, on any worktree, runs one command and picks up exactly where the last one left off:

```bash
carryctx resume
```

Since 0.6.0 that memory covers more than one agent at a time. A **Team** — a roster of agents, an optional commander, and the tasks associated with them — is persisted in the same database as everything else, so "who is on this team, what is each one working on, and what does this one need to know" survives the session that set it up. A commander agent can rebuild the whole picture with one read-only call:

```bash
carryctx team context payments-squad
```

## What CarryCtx actually is

CarryCtx is not a wrapper around an LLM and it doesn't talk to any model provider. It's a small, deterministic state machine backed by SQLite, invoked as a plain CLI. It has three defining properties:

- **Local-first.** No network access by default, no account, no telemetry. State lives in `.git/carryctx/state.sqlite` (technically inside the Git common directory, so every worktree of the same repository shares it), and project config lives in `.carryctx/config.toml` at the repository root.
- **SQLite-backed.** Tasks, sessions, checkpoints, progress items, decisions, handoffs, and events are all rows in a relational schema. That means they're queryable with `--json`, filterable, and consistent, not free-text notes an agent might paraphrase differently every time.
- **Agent-agnostic.** CarryCtx doesn't know or care whether the caller is Claude Code, Codex, OpenCode, a human at a terminal, or a CI job. Every caller identifies itself with `--agent`, and every caller reads and writes the same structured state.

## Who this is for

CarryCtx is aimed at exactly the failure modes described above: a long-running task that spans more sessions than one context window can hold, multiple agents (or a human and an agent) trading off ownership of the same task, parallel work across several Git worktrees on the same repository, and a standing group of agents whose roster and assignments shouldn't have to be re-declared in a prompt every time. If your work fits in one sitting with one agent and you never lose the thread, you don't need it. If you routinely find yourself re-explaining "what we were doing" at the start of a session, this is the layer that removes that step.

## The core idea: Git owns code, CarryCtx owns intent

Git is extremely good at tracking what the code looked like at every point in history. It's not designed to track why a task is blocked, what a previous session already tried, or which agent currently owns a piece of work. CarryCtx fills exactly that gap, and only that gap:

- Git is the source of truth for code history. CarryCtx never rewrites commits, never resolves merge conflicts, and never touches your working tree except to read its state (branch, HEAD, dirty files) for context.
- CarryCtx is the source of truth for _why_ the code is the way it is right now: which task is active, what's been tried, what's still open, who's working on it, and what decisions were made along the way.

Because the two layers don't overlap, you can run `carryctx init` on any existing Git repository without disturbing anything, and you can stop using CarryCtx at any point without corrupting your Git history.

## A management layer, not an orchestration framework

This distinction matters more now that teams exist, because "multi-agent" usually implies a framework that runs the agents. CarryCtx doesn't. The split is:

- **CarryCtx owns the durable answers.** Who is on this team, who the commander is, what each member is working on, what's blocked, what was decided, and what a given member needs to know right now. All of it in SQLite, all of it still there after every window closes.
- **Your harness owns execution.** Spawning processes, routing work to a member, retries, concurrency limits, creating worktrees, heartbeats, and model selection. CarryCtx has no opinion about any of it.

Concretely, 0.6.0 ships no scheduler, no worker runtime, no lease or heartbeat machinery, no prompt cache, and no token optimizer. `carryctx team context` hands a commander an accurate picture of its team; deciding what to do with that picture, and actually dispatching the work, stays outside the CLI. Nothing in CarryCtx runs anybody's agents.

## How it fits into your workflow

In practice the CLI shows up at the edges of a working session, not in the middle of it. At the start of a session you run `carryctx resume` to get oriented, then `carryctx session start` to open a session bound to a task. During the session you log small progress items as you go (`carryctx progress todo`, `carryctx progress note`) instead of trying to remember them for later. At a natural stopping point you record a `carryctx checkpoint`, and when you're done you close out with `carryctx session end`. The commands are ordinary shell invocations, so they work equally well typed by a human, called from inside an agent's tool loop, or wired into a Git hook.

## What you get

Running `carryctx --help` lists the top-level command groups. Each one maps to a concrete piece of the "agent memory" problem:

| Command      | What it gives you                                                                                                          |
| ------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `init`       | Initializes CarryCtx in a repository and writes `.carryctx/config.toml`                                                    |
| `status`     | One-shot overview of the project: active tasks, sessions, agents, worktrees                                                |
| `task`       | Structured work units with status, priority, ownership, and dependencies, not a prose to-do list                           |
| `team`       | Durable agent rosters: membership, an optional commander, task association, and read-only team projections                 |
| `progress`   | Micro-progress logs attached to a task: todos, blockers, risks, notes                                                      |
| `session`    | Explicit start/pause/resume/end lifecycle for an agent's working period                                                    |
| `checkpoint` | Git-aware state snapshots: what was done, what's remaining, what's blocking, what's next                                   |
| `resume`     | Reconstructs full context (task, session, checkpoint, progress, recent events) for the next agent or window                |
| `context`    | Dumps active task/session context in a compact or full form, meant for feeding directly into an LLM prompt                 |
| `agent`      | Registers and manages the agents (human or AI) participating in the project                                                |
| `handoff`    | Explicit hand-off requests between agents, with accept/reject                                                              |
| `decision`   | Records architectural decisions (ADRs) so the reasoning behind a choice survives past the session that made it             |
| `worktree`   | Binds a Git worktree to a task, so parallel work on separate branches stays correctly attributed                           |
| `graph`      | Manages a context graph of nodes/edges for semantic queries over the project                                               |
| `event`      | Queries the immutable event log underlying everything above, for auditing                                                  |
| `mcp`        | Runs a stdio Model Context Protocol server, so MCP-aware clients (Cursor, Claude Desktop, etc.) can call CarryCtx directly |
| `stats`      | Agent performance analytics: session length, throughput                                                                    |
| `skill`      | Installs and manages executable agent skills (from a local path or repository)                                             |
| `preset`     | Installs and applies reusable capability packs: workflow SOPs, coding rules, agent personas                                |
| `sync`       | Copies the state database to and from a local directory you name. No network stack, no server                              |
| `hooks`      | Installs Git hooks (`post-commit`, `prepare-commit-msg`) for auto-checkpointing and task-ID-prefixed commit messages       |
| `doctor`     | Diagnoses and can fix project health issues: orphaned tasks, missing hooks, database drift                                 |
| `search`     | Full-text search across tasks, progress, checkpoints, and decisions, ranked by relevance                                   |

Because `--agent`, `--session`, and `--task` are global flags with environment variable fallbacks (`CARRYCTX_AGENT`, `CARRYCTX_SESSION`, `CARRYCTX_TASK`), a long-running agent process can export them once and omit them from every subsequent call. The same global set also includes `--format` (`text`, `json`, or `markdown`), `--json` as a shorthand for `--format=json`, `--dry-run` to simulate without writing, and `--non-interactive` to fail instead of prompting.

<Aside type="tip">
None of this requires a specific agent or IDE. If you can run a CLI, you can use CarryCtx, whether that's from inside an agent's tool-calling loop, a shell alias, or a Git hook.
</Aside>

None of this is exotic infrastructure. It's a single binary, a SQLite file, and a set of subcommands with predictable, scriptable output. The rest of this section walks through the concepts precisely and then the exact command sequence to try it yourself.

## Where to go next

- [Core Concepts](/1-getting-started/2-concepts/) defines Project, Agent, Team, Session, Task, Checkpoint, and the other building blocks precisely, including their state machines.
- [Quickstart](/1-getting-started/3-quickstart/) walks through initializing a project, creating and claiming a task, and resuming a session end to end.
- [Teams](/2-cli-reference/10-teams/) covers the `team` command family: membership, commanders, task association, and the two read-only projections.
