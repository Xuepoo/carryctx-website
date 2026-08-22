---
title: Decisions
sidebar:
  order: 9
---

import { Aside } from '@astrojs/starlight/components';

Decisions are lightweight ADRs (architecture decision records): a title plus optional context, the decision itself, consequences, and rationale — optionally tied to the task that prompted it. Unlike tasks and progress items, decisions are **immutable**: there is no delete, and corrections are expressed by superseding an old decision with a new one so history stays intact.

## Recording a decision

```bash
carryctx decision add --title "Use WAL mode for the state database"
carryctx decision add --title "Migrate to jj" --task CTX-0002 \
  --context "Rust 2021 edition" \
  --decision "Adopt Jujutsu colocated repos" \
  --consequences "worktree create disabled for jj repos" \
  --rationale "Simpler snapshot model, faster branch juggling"
```

| Flag                    | Description                                              |
| ----------------------- | -------------------------------------------------------- |
| `--title`               | Required. Short summary of the decision.                 |
| `--task <ref>`          | Task that prompted or is associated with this decision.  |
| `--context <text>`      | Problem statement or background leading to the decision. |
| `--decision <text>`     | The actual decision or chosen alternative.               |
| `--consequences <text>` | Trade-offs, impact, or follow-up obligations.            |
| `--rationale <text>`    | Why it was made, not just what was decided.              |

## Listing and searching

```bash
carryctx decision list                    # every decision in the project
carryctx decision list --task CTX-0002    # only that task's decisions
carryctx decision search "WAL mode"       # keyword / content search
```

`decision list --task <ref>` (0.5.5+) resolves and validates the ref first: a bad ref yields `RESOURCE_NOT_FOUND` instead of silently returning the full dump.

## Superseding

```bash
carryctx decision supersede DEC-001 --by DEC-014
```

Marks `DEC-001` as superseded by `DEC-014`. The superseded record stays in the history (and in `search`) with its status derived from the supersession link; it is never deleted.
