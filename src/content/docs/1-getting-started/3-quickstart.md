---
title: Quickstart
---

import { Aside } from '@astrojs/starlight/components';

This walks through the full lifecycle once: initializing a project, registering an agent, creating and claiming a task, running a session, recording progress, and resuming that context in a fresh session. Run it inside an existing Git repository.

## 1. Initialize the project

```bash
cd your-project
carryctx init --name your-project --task-prefix CTX
```

This creates `.carryctx/config.toml` at the repository root and a state database inside the Git common directory (shared across all worktrees of this repo). Useful flags:

- `--main-branch <name>` sets the branch CarryCtx treats as the default (used e.g. as the base for `worktree create`).
- `--force` re-initializes even if `.carryctx/` already exists.
- `--minimal` skips the standard documentation and agent template files.
- `--install-skill` installs the agent skill files alongside init.

<Aside type="tip">
Every `carryctx` invocation accepts `--dry-run` globally. Run `carryctx init --dry-run` first if you just want to see what would happen without touching disk.
</Aside>

## 2. Register an agent

Every write to project state needs an acting agent, so register one before doing anything else:

```bash
carryctx agent register --name claude-core --provider claude-code --role implementer
```

`--name` is required; `--provider` and `--role` are optional metadata. From here on, pass `--agent claude-core` on each command, or export it once so you don't have to repeat it:

```bash
export CARRYCTX_AGENT=claude-core
```

## 3. Create and claim a task

```bash
carryctx task create --title "Add streaming CSV export" --priority high
```

This prints the new task's display ID, `CTX-0001`. A task with no unfinished dependencies starts in `ready`; claim it to take ownership:

```bash
carryctx task claim CTX-0001
carryctx task start CTX-0001
```

`task claim` sets you as owner; `task start` moves the status from `ready` to `in_progress` and automatically binds the task to your current context (so subsequent commands can omit `--task`).

## 4. Start a session

```bash
carryctx session start --agent claude-core --task CTX-0001
```

This opens a session in `Active` state, bound to the task. If a session is already active and you don't want an error, add `--reuse`. You can also bind a session to a specific worktree with `--worktree <path>`.

## 5. Do the work, log progress as you go

As you make changes, log small progress items rather than waiting until the end:

```bash
carryctx progress todo "Write unit tests for the streaming writer"
carryctx progress note "Chunked upload caps out at 5MB parts on S3"
```

When you reach a natural stopping point (a good commit, end of a work block, or before switching context), record a checkpoint. This is the record that a future session actually resumes from:

```bash
carryctx checkpoint \
  --done "Implemented CSV writer, added unit tests" \
  --remaining "Add streaming support for >1M rows" \
  --next "Wire the writer into the streaming pipeline"
```

By default this also runs `git add`/`git commit` to capture the corresponding file changes (pass `--no-git` to skip that, or `--include-diff` to embed the uncommitted diff directly in the checkpoint record).

## 6. End the session

```bash
carryctx session end --summary "Implemented CSV writer and tests, streaming still open"
```

This cleanly terminates the session (`Active → Ended`). Now imagine the window closes, or a different agent picks this up tomorrow.

## 7. Resume in a new session

In a fresh window (or a different agent entirely), the very first command should be:

```bash
carryctx resume
```

With no `--task`/`--session` flags, `resume` finds the most recently active session for the project, resolves its bound task, and pulls together the latest checkpoint, open progress items, recent events, and current Git branch/HEAD. In text mode this is the pretty-printed JSON of that reconstructed context:

```json
{
  "schemaVersion": 1,
  "command": "resume",
  "success": true,
  "data": {
    "projectId": "01J...",
    "currentSession": { "id": "01J...", "state": "ended", "taskId": "01J..." },
    "currentTask": { "id": "01J...", "displayId": "CTX-0001", "status": "in_progress" },
    "latestCheckpoint": {
      "done": ["Implemented CSV writer, added unit tests"],
      "remaining": ["Add streaming support for >1M rows"],
      "next": ["Wire the writer into the streaming pipeline"]
    },
    "progress": [
      { "kind": "todo", "content": "Write unit tests for the streaming writer" },
      { "kind": "note", "content": "Chunked upload caps out at 5MB parts on S3" }
    ],
    "recentEvents": ["..."],
    "branch": "feature/csv-export",
    "head": "32ac891..."
  }
}
```

Useful flags on `resume`:

- `--task <ref>` or `--session <ref>` target a specific task/session instead of the most recently active one.
- `--compact` produces a shorter summary; `--full` includes extensive historical logs and file paths.
- `--include-diff` adds the uncommitted Git diff to the output.
- `--max-events <n>` caps how many recent events come back (defaults to 10).
- `--start-session` automatically opens a new session right after printing the context, so you don't need a separate `session start` call.

With the checkpoint and progress items in hand, the new session (or agent) restarts work with the same picture the previous one had, no re-reading of chat logs required.

## Next steps

- [Project Lifecycle](/2-cli-reference/1-project-lifecycle/) covers `init`, `status`, `doctor`, and the other commands that manage the project itself in more depth.
- [Core Concepts](/1-getting-started/2-concepts/) is the reference for every state and transition used above.
