---
title: Analytics & Automation
---

import { Aside } from '@astrojs/starlight/components';

Three commands round out the ecosystem once tasks, checkpoints, and the graph are in regular use: `carryctx stats` for reporting on how work is actually going, `carryctx hooks` for wiring CarryCtx into Git automatically, and `carryctx sync` for the (fully opt-in) case where you want project state to follow you across machines.

## `carryctx stats`

```bash
carryctx stats
```

Computes project-wide and per-agent statistics directly from the local database: total tasks broken down by status (planned, ready, in progress, completed, cancelled), total graph nodes and edges, total sessions and checkpoints, total agent working time, and, per agent, session count, total seconds worked, checkpoint count, tasks completed, and blockers reported.

Default (human-readable) output:

```text
Project Overview:
   Tasks: 12 Total (Done: 7, In Progress: 2, Ready: 2, Planned: 1)
   Graph: 84 Nodes, 211 Edges
   Sessions: 9 | Checkpoints: 23

Agent Name           | Sessions   | Time Spent   | Checkpoints  | Tasks Done      | Blockers
---------------------+------------+--------------+--------------+-----------------+----------
claude-code          | 5          | 6h 12m       | 14           | 4               | 1
codex                | 4          | 3h 40m       | 9            | 3               | 0
```

Flags:

| Flag | Purpose |
| --- | --- |
| `--for-agent <NAME>` | Restrict all stats (overview and table) to a single agent |
| `--markdown` | Print (or, with `--output`, write) the report as a Markdown document instead of the plain-text table |
| `-o, --output <PATH>` | Write the report to a file instead of printing it. Format is picked from the extension: `.csv` → CSV, `.json` → the raw `ProjectStats` struct as JSON, anything else → Markdown |

```bash
carryctx stats --markdown --output /tmp/project_stats.md
```

```text
Successfully exported project stats to /tmp/project_stats.md
```

The generated Markdown looks like:

```markdown
# CarryCtx Project Statistics

## Overview
- **Total Tasks**: 12 (Completed: 7, In Progress: 2, Ready: 2, Planned: 1)
- **Code Graph**: 84 Nodes, 211 Edges
- **Sessions & Checkpoints**: 9 Sessions, 23 Checkpoints
- **Total Agent Work Time**: 9h 52m

## Agent Performance
| Agent Name | Sessions | Time Spent | Checkpoints | Tasks Done | Blockers |
| :--- | :--- | :--- | :--- | :--- | :--- |
| claude-code | 5 | 6h 12m | 14 | 4 | 1 |
| codex | 4 | 3h 40m | 9 | 3 | 0 |
```

This is the same content the `carryctx-core` skill points agents at when it says "export project stats report for PR description or documentation": drop `--markdown --output` into a PR body or a weekly project update instead of writing it by hand.

<Aside type="tip">
CSV output (`carryctx stats --output stats.csv`) is one row per agent with columns `agent_name,sessions,total_seconds,checkpoints,tasks_completed,blockers_reported`, useful for pulling into a spreadsheet across several projects.
</Aside>

## `carryctx hooks`

`carryctx hooks` installs Git hooks that keep CarryCtx state in sync with commits automatically, without needing to remember to run `checkpoint` by hand.

```bash
carryctx hooks install
```

Installs two hooks into the repository's `.git/hooks` directory:

- **`post-commit`**: after every commit, looks up the active task from `carryctx context` and creates an auto-checkpoint noting the commit SHA.
- **`prepare-commit-msg`**: prepends the active task's display ID (e.g. `[CTX-0001]`) to the commit message, skipping merge and squash commits.

Flags:

| Flag | Effect |
| --- | --- |
| `--post-commit-only` | Install only the post-commit hook, skip prepare-commit-msg |
| `--force` | Overwrite existing hooks at those paths, backing up the original as `<hook>.bak` first |

```bash
carryctx hooks status
carryctx hooks uninstall --restore
```

`hooks status` reports, per hook, whether it's installed and whether CarryCtx manages it (hooks that don't contain the `CarryCtx` marker comment are reported as present but not managed, and are left alone). `hooks uninstall` removes only hooks that carry that marker; with `--restore`, it restores the `.bak` backup instead of deleting, if one exists.

## `carryctx sync`

```bash
carryctx sync push --remote /path/to/shared/backup
carryctx sync pull --remote /path/to/shared/backup
```

`sync push` copies the project's local SQLite database to a file in the given `--remote` directory (default `/tmp/carryctx-remote`, meant to be overridden); `sync pull` copies it back from there into the local project database location. That's the entire mechanism: a raw database file copy to and from a directory you name, no network protocol, no server, no scheduled sync.

<Aside type="caution">
`sync` is never invoked automatically by any other command. CarryCtx is local-first by design (see the [feature comparison](https://github.com/carryctx) on the project's own README: "Leaves your machine: Never — 100% local"), and `sync` is the one deliberate exception you opt into yourself, by running it yourself, pointed at wherever you choose (a mounted network share, an external drive, a syncable cloud folder). There's no default remote and no background process; if you never run `carryctx sync`, no project data ever leaves the machine.
</Aside>

Because `sync pull` overwrites the local database wholesale, treat it as a full-state replace, not a merge: pulling from a remote after making local-only changes discards those local changes in favor of the remote copy.
