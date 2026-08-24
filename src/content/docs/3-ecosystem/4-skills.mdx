---
title: Agent Skills & Handoff
---

import { Aside } from '@astrojs/starlight/components';

CarryCtx ships a collection of **agent skills** — `SKILL.md`-based instruction packs that any supporting agent (Claude Code, Codex, OpenCode, Cursor, Antigravity, Gemini CLI, …) can load. They teach the agent how to use CarryCtx properly: not just _which_ commands exist, but _when_ to run them, in what order, and with what discipline.

The collection lives in the [`carryctx-skills`](https://github.com/Xuepoo/carryctx-skills) repository and installs with the [Vercel Labs Skills CLI](https://github.com/vercel-labs/skills):

```bash
npx skills add https://github.com/Xuepoo/carryctx-skills --skill carryctx-core -y
# add others as needed:
npx skills add https://github.com/Xuepoo/carryctx-skills --skill carryctx-rules -y
npx skills add https://github.com/Xuepoo/carryctx-skills --skill carryctx-workflows -y
npx skills add https://github.com/Xuepoo/carryctx-skills --skill carryctx-personas -y
npx skills add https://github.com/Xuepoo/carryctx-skills --skill carryctx-handoff -y
```

Or install everything with `npx skills add https://github.com/Xuepoo/carryctx-skills` and select all.

## The skills

| Skill                | What it teaches the agent                                                                                         |
| -------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `carryctx-core`      | The daily loop: resume context, manage tasks, track progress, save checkpoints, work in worktrees, search history |
| `carryctx-rules`     | Load and obey project-specific `.carryctx/rules/` before matching work                                            |
| `carryctx-workflows` | Parse `.carryctx/workflows/` blueprints and break high-level tasks into granular tracked todos                    |
| `carryctx-personas`  | Adopt `.carryctx/personas/` roles (reviewer, architect, …) and their code styles                                  |
| `carryctx-handoff`   | Produce a **handoff document** from CarryCtx state and route it with `carryctx handoff`                           |

## `carryctx-handoff`: handing work between agents

The newest skill closes the loop between CarryCtx's structured memory and the
class of problem it can't solve alone: telling the _next_ session _what to do_,
in what order, with which measurements and traps.

The division of labour:

- **CarryCtx is the record** — queryable tasks, checkpoints, decisions, progress, events.
- **The handoff document is the entry point** — first commands, task order, `file:line` fix sites, measured evidence, verification standard, traps. It points into CarryCtx by ID instead of restating what the record holds.

When a session ends with work remaining, the skill:

1. **Gathers state** — `carryctx status`, `task list --status in_progress`, `checkpoint list`, `decision list`, `search` — so the document is built from the record, not from memory.
2. **Writes the document** — timestamp-first (`YYYY-MM-DDTHHMMSSZ-slug.md`), following the generic [`handoff-prompt`](https://github.com/Xuepoo/handoff-prompt) skill's template: first commands (carryctx-native: `carryctx resume`, `handoff list`), repo state, what is done (cited by checkpoint ID), ordered tasks, verification standard, traps.
3. **Routes it** — `carryctx handoff create --target <agent-or-role> --task CTX-NNNN --summary "handoff doc: handoff-prompt/<file>.md"`, then `carryctx checkpoint --done … --remaining …`.
4. **Takes over on the receiving side** — `carryctx handoff list` → read the document → `carryctx resume` → claim the task → record progress as you go → `carryctx handoff accept/close` when done.

This pairs CarryCtx's state machine with the document discipline that keeps long multi-session work measurable: the record answers _what happened_, the document answers _what to do next_.

<Aside type="note">
The generic `handoff-prompt` skill ([Xuepoo/handoff-prompt](https://github.com/Xuepoo/handoff-prompt)) holds the template and the serial/parallel, reconciliation, and archiving rules. `carryctx-handoff` is the CarryCtx-flavoured workflow around it.
</Aside>
