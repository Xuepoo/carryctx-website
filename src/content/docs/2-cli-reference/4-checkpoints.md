---
title: Checkpoints, Resume & Context
---

import { Aside } from '@astrojs/starlight/components';

Checkpoints, `resume`, and `context` are the three commands that preserve and restore state across context loss: `checkpoint` writes a durable snapshot, `resume` reconstructs "where was I" for a human or agent picking a task back up, and `context` assembles the same information into a shape meant to be pasted straight into an LLM prompt.

## `carryctx checkpoint`: capturing a snapshot

Running `carryctx checkpoint` with no subcommand creates a new checkpoint against the current (or specified) task:

```bash
carryctx checkpoint \
  --done "Implemented retry backoff in fetch_with_retry" \
  --done "Added unit tests for jitter calculation" \
  --remaining "Wire retry config into CLI flags" \
  --remaining "Update docs for new backoff behavior" \
  --blocker "Waiting on API team to confirm max retry count" \
  --risk "Backoff curve untested against real rate limits" \
  --next "Run integration tests against staging" \
  --note "Chose exponential backoff over fixed delay for simplicity"
```

### What's captured automatically

- `branch` and `head` (current branch name and commit SHA)
- `dirty` (whether the worktree has uncommitted changes)
- `vcs_backend` (`"git"` or `"jj"`) and `changed_files` (a merged, accurate list of every changed file, regardless of backend)
- `staged_files`, `modified_files`, `deleted_files`, `untracked_files`, and `renamed_files` (each renamed entry has `from`/`to`)
- `diff_files`, `diff_insertions`, `diff_deletions` (aggregate diff stats)

<Aside type="note">
If the repository is [Jujutsu (jj) colocated](https://jj-vcs.dev/) (a `.jj/` directory sits alongside `.git/`), `vcs_backend` reports `"jj"` and `staged_files`/`modified_files`/`untracked_files` are always empty arrays. jj's automatic working-copy snapshotting writes to the Git index as a side effect of nearly any `jj` command, including read-only ones, which makes the staged/unstaged/untracked split meaningless there. Use `changed_files` instead: it stays accurate under both backends. `dirty` and the diff stats also remain accurate under jj.
</Aside>

`--no-git` skips all of this and falls back to whatever `--task`/session context provides for branch/head (usually nothing).

`--include-diff` additionally embeds the raw uncommitted diff text into the checkpoint record, not just the stats. Use this when you want the checkpoint to be self-sufficient for review without a working tree to diff against.

Every file recorded as modified or staged is also linked into the project's context graph as a `changed` edge from the task to that file node (creating the file node if it doesn't exist yet), and CarryCtx attempts to auto-extract dependency edges for each of those files. This is why `carryctx context --include-graph` can show which files a task has touched even without you tagging them manually.

### What you report yourself

None of the following are inferred, they're exactly what you pass:

| Flag | Meaning |
| --- | --- |
| `--done <TEXT>` | Something completed since the last checkpoint. Repeatable. |
| `--remaining <TEXT>` | Work still outstanding. Repeatable. |
| `--blocker <TEXT>` | Something currently blocking progress. Repeatable. |
| `--risk <TEXT>` | A risk or concern worth flagging. Repeatable. |
| `--next <TEXT>` | The next concrete action to take. Repeatable. |
| `--note <TEXT>` | Any other note. Repeatable. |
| `--task <TASK_REF>` | Bind explicitly to a task (defaults to the resolved current task). |
| `--session <SESSION_ID>` | Bind explicitly to a session (defaults to the active session, if any). |

All six report flags (`--done`, `--remaining`, `--blocker`, `--risk`, `--next`, `--note`) accept multiple values by repeating the flag; each becomes a separate list entry, not a single concatenated string.

If no task can be resolved (no `--task` and no task bound to the active session/worktree), checkpoint creation fails with "No task specified."

A `checkpoint.created` event is appended to the project's event log every time, recording the checkpoint ID, dirty state, and counts of done/remaining items.

## Listing, showing, and correcting checkpoints

```bash
carryctx checkpoint list --task CTX-0001
carryctx checkpoint show <checkpoint_id>
```

`checkpoint list` supports `--format markdown` for a scannable table (ID, task, done-item count, created timestamp). `checkpoint show` prints the full record, including every Git and report field above.

<Aside type="caution">
Raw checkpoints are immutable. There is no "edit checkpoint" command that rewrites the original record.
</Aside>

If you need to fix a mistake, use `correct`:

```bash
carryctx checkpoint correct <checkpoint_id> --done "Corrected: also fixed the flaky test" --remaining "Still need staging validation"
```

`correct` doesn't touch the original checkpoint row. It writes a separate `CheckpointCorrection` record (with its own timestamp) linked to the checkpoint, plus a `checkpoint.corrected` event noting which fields were touched. Only the flags you pass are included in the correction; omitted flags stay `None` and don't overwrite anything. `checkpoint show` on the original checkpoint still returns the original data; corrections are a parallel, appended history rather than a mutation.

There's no dedicated `--task`/`--session` binding for `correct`; it targets the checkpoint by ID directly.

## `carryctx resume`: reconstructing "where was I"

```bash
carryctx resume
```

Resume resolves state in this order:

1. Finds the active session for the project (state `Active`), if any.
2. Resolves the current task: explicit `--task <TASK_REF>` first, otherwise the task bound to the active session.
3. Looks up the most recent checkpoint for that task (`latestCheckpoint`).
4. Lists that task's open progress items (todos, blockers, risks, notes; removed items excluded).
5. Pulls the most recent events for that task, limited to `--max-events` (defaults to 10 if unset).
6. Reports the project's current Git `branch` and `head`.

```bash
carryctx resume --task CTX-0001 --max-events 20
```

Sample output shape (JSON):

```json
{
  "projectId": "01J...",
  "currentSession": { "id": "01J...", "state": "Active", "taskId": "01J..." },
  "currentTask": { "id": "01J...", "displayId": "CTX-0001", "title": "Add retry backoff" },
  "latestCheckpoint": {
    "id": "01J...",
    "done": ["Implemented retry backoff in fetch_with_retry"],
    "remaining": ["Wire retry config into CLI flags"],
    "blockers": ["Waiting on API team to confirm max retry count"]
  },
  "progress": [
    { "displayId": "PX-0002", "itemType": "Blocker", "status": "Open" }
  ],
  "recentEvents": [ { "eventType": "checkpoint.created" } ],
  "branch": "feature/retry-backoff",
  "head": "a1b2c3d"
}
```

Other flags: `--session <SESSION_ID>` targets a specific session instead of the active one; `--compact` and `--full` control output verbosity; `--start-session` starts a new session right after printing the resume context; `--include-diff` adds the uncommitted Git diff to the output.

<Aside type="note">
`resume` and `context` overlap in the fields they gather (task, progress, branch/head) but serve different defaults: `resume` is tuned for "pick this task back up" with a short recent-events window, while `context` is tuned for prompt assembly and requires you to opt in to most sections explicitly.
</Aside>

## `carryctx context`: assembling an LLM-ready snapshot

```bash
carryctx context --task CTX-0001 --include-events --include-decisions
```

`context` always includes the project ID and name, current Git `branch`/`head`, the resolved current task, and that task's open progress items. Everything else is opt-in:

| Flag | Adds |
| --- | --- |
| `--include-events` | Recent events for the task (respects `--max-events` and `--since`) |
| `--include-decisions` | Architectural decisions relevant to the project |
| `--include-related-tasks` | *(declared as a flag; not yet wired into output assembly — no effect on the current `context` payload)* |
| `--include-graph` | The context graph: file/task nodes and edges touched by checkpoints |
| `--file <PATH>` | Restricts the graph to one file node and its immediate neighbours (implies `--include-graph`) |
| `--max-events <N>` | Caps how many events are returned when events are included |
| `--since <TIME>` | Only events at or after this timestamp/duration |

`--full` is a shortcut that turns on events, decisions, and the graph all at once, bypassing the individual `--include-*` flags. `--compact` doesn't change which sections are included, it changes how the graph section is serialized (returning just `id`/`type`/`name` for nodes and `src`/`dst`/`rel` for edges instead of full records) to keep the payload smaller.

`--output <PATH>` writes the same JSON payload to a file in addition to printing it, useful for piping a snapshot into another tool.

```bash
carryctx context --task CTX-0001 --full --output /tmp/ctx-0001-context.json
```

<Aside type="caution">
`--include-related-tasks` is accepted by the CLI but currently has no effect on the assembled context: don't rely on it to pull in blocking or related tasks yet.
</Aside>
