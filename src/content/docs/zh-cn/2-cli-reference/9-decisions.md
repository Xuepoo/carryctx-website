---
title: 决策记录 (Decision)
---

import { Aside } from '@astrojs/starlight/components';

Decision 是轻量级 ADR（架构决策记录）：一个标题，加上可选的背景、决策本身、后果和理由——可选地关联到触发该决策的任务。与任务和进度条目不同，决策是**不可变的**：没有删除操作，纠错通过用新决策取代旧决策来表达，历史得以保留。

## 记录决策

```bash
carryctx decision add --title "Use WAL mode for the state database"
carryctx decision add --title "Migrate to jj" --task CTX-0002 \
  --context "Rust 2021 edition" \
  --decision "Adopt Jujutsu colocated repos" \
  --consequences "worktree create disabled for jj repos" \
  --rationale "Simpler snapshot model, faster branch juggling"
```

| 参数                    | 说明                                 |
| ----------------------- | ------------------------------------ |
| `--title`               | 必填。决策的简短摘要。               |
| `--task <ref>`          | 与该决策相关的任务。                 |
| `--context <text>`      | 问题陈述或决策背景。                 |
| `--decision <text>`     | 实际决策或选择的方案。               |
| `--consequences <text>` | 权衡、影响或后续义务。               |
| `--rationale <text>`    | 为什么做这个决策，而不只是做了什么。 |

## 列出与搜索

```bash
carryctx decision list                    # 项目内全部决策
carryctx decision list --task CTX-0002    # 仅该任务的决策
carryctx decision search "WAL mode"       # 关键字 / 内容搜索
```

`decision list --task <ref>`（0.5.5 起）会先解析并校验 ref：无效 ref 返回 `RESOURCE_NOT_FOUND`，而不是静默返回完整列表。

## 取代 (Supersede)

```bash
carryctx decision supersede DEC-001 --by DEC-014
```

将 `DEC-001` 标记为被 `DEC-014` 取代。被取代的记录保留在历史（和 `search`）中，其状态由取代关系推导；永远不会被删除。
