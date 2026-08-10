---
title: Agent Skills 与 Handoff
---

import { Aside } from '@astrojs/starlight/components';

CarryCtx 附带一套 **agent skills** —— 基于 `SKILL.md` 的指令包，任何支持的 agent（Claude Code、Codex、OpenCode、Cursor、Antigravity、Gemini CLI……）都能加载。它们教会 agent 正确使用 CarryCtx：不仅是*有哪些*命令，还包括*何时*运行、按什么顺序、遵循什么纪律。

这套 skill 存放在 [`carryctx-skills`](https://github.com/Xuepoo/carryctx-skills) 仓库中，用 [Vercel Labs Skills CLI](https://github.com/vercel-labs/skills) 安装：

```bash
npx skills add https://github.com/Xuepoo/carryctx-skills --skill carryctx-core -y
# 按需添加其他 skill：
npx skills add https://github.com/Xuepoo/carryctx-skills --skill carryctx-rules -y
npx skills add https://github.com/Xuepoo/carryctx-skills --skill carryctx-workflows -y
npx skills add https://github.com/Xuepoo/carryctx-skills --skill carryctx-personas -y
npx skills add https://github.com/Xuepoo/carryctx-skills --skill carryctx-handoff -y
```

或者运行 `npx skills add https://github.com/Xuepoo/carryctx-skills` 后全选安装。

## Skills 一览

| Skill                | 教会 agent 什么                                                                   |
| -------------------- | --------------------------------------------------------------------------------- |
| `carryctx-core`      | 日常工作循环：恢复上下文、管理任务、记录进度、保存检查点、worktree 协作、历史搜索 |
| `carryctx-rules`     | 在匹配的工作开始前，加载并遵守项目专属的 `.carryctx/rules/`                       |
| `carryctx-workflows` | 解析 `.carryctx/workflows/` 蓝图，把高层任务拆解为可跟踪的 granular todo          |
| `carryctx-personas`  | 采用 `.carryctx/personas/` 中的角色（reviewer、architect……）及其代码风格          |
| `carryctx-handoff`   | 从 CarryCtx 状态生成**交接文档**，并用 `carryctx handoff` 路由                    |

## `carryctx-handoff`：在 agent 之间交接工作

最新的 skill 补齐了 CarryCtx 结构化记忆与它独自解决不了的问题之间的闭环：告诉*下一个*会话*要做什么*、按什么顺序、带着哪些测量数据和陷阱。

分工：

- **CarryCtx 是记录** —— 可查询的任务、检查点、决策、进度、事件。
- **交接文档是入口** —— 首命令、任务顺序、`file:line` 修复位置、测量证据、验证标准、陷阱。它按 ID 指向 CarryCtx，而不是重述记录里已有的内容。

当会话带着未完成的工作结束时，这个 skill 会：

1. **收集状态** —— `carryctx status`、`task list --status in_progress`、`checkpoint list`、`decision list`、`search`，让文档从记录构建，而不是凭记忆。
2. **写文档** —— 时间戳优先命名（`YYYY-MM-DDTHHMMSSZ-slug.md`），遵循通用 [`handoff-prompt`](https://github.com/Xuepoo/handoff-prompt) skill 的模板：首命令（carryctx 原生：`carryctx resume`、`handoff list`）、仓库状态、已完成内容（按检查点 ID 引用）、有序任务、验证标准、陷阱。
3. **路由** —— `carryctx handoff create --target <agent-or-role> --task CTX-NNNN --summary "handoff doc: handoff-prompt/<file>.md"`，然后 `carryctx checkpoint --done … --remaining …`。
4. **接收侧接管** —— `carryctx handoff list` → 读文档 → `carryctx resume` → 认领任务 → 边做边记录进度 → 完成后 `carryctx handoff accept/close`。

这样把 CarryCtx 的状态机与文档纪律结合，让跨多个 session 的长任务始终可度量：记录回答*发生了什么*，文档回答*接下来做什么*。

<Aside type="note">
通用 `handoff-prompt` skill（[Xuepoo/handoff-prompt](https://github.com/Xuepoo/handoff-prompt)）持有模板以及串行/并行、协调幸存者、归档规则；`carryctx-handoff` 是围绕它的 CarryCtx 风味工作流。
</Aside>
