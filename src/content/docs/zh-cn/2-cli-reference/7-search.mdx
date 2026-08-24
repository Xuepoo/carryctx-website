---
title: 全文搜索
sidebar:
  order: 7
---

import { Aside } from '@astrojs/starlight/components';

`carryctx search` 可以跨 Task、Progress、Checkpoint、Decision 按内容查找之前的工作，不需要记住是哪个分支或哪个任务改过它。分支名本身很少能说明实际改了什么、为什么改；`search` 直接命中承载这些信息的文本本身。

## 基本用法

```bash
carryctx search "markdown worker protocol"
```

搜索全部四种实体类型，按相关度（SQLite FTS5 的 `bm25()`）排序，最相关的排在最前面。

## 参数

| 参数 | 说明 |
| --- | --- |
| `<query>`（位置参数） | 搜索文本。支持 [FTS5 查询语法](https://www.sqlite.org/fts5.html#full_text_query_syntax)：引号短语（`"exact phrase"`）、布尔操作符（`term1 OR term2`）、前缀匹配（`retry*`）。 |
| `--type <kind>` | 限定为一种实体类型：`task`、`progress`、`checkpoint`、`decision`。 |
| `--status <status>` | 只返回拥有该记录的 Task 处于该状态的命中（例如 `in_progress`、`completed`）。 |
| `--assignee <agent>` | 只返回拥有该记录的 Task 归属于该 Agent 的命中（名称或 ULID）。 |
| `--limit <n>` | 最大返回条数，默认 20。 |

```bash
carryctx search "retry backoff" --type checkpoint
carryctx search "auth flow" --status in_progress --assignee claude-code
```

<Aside type="note">
`--assignee` 有意不叫 `--agent`。CLI 中全局的 `--agent`/`CARRYCTX_AGENT` 身份参数是用 `global = true` 定义的，子命令下同名的局部参数即使这次没有传值也会悄悄继承全局参数的值 —— 这正是 0.2.1 修复过的 `event list --agent` 冲突同一个根因。用 `--assignee` 直接从命名上规避了这个碰撞，而不是要求用户记住一个变通方案。
</Aside>

## 每条命中都告诉你什么

每条结果都会解析回它所属的 Task，因为这通常就是搜索的原始动机：

```json
{
  "kind": "checkpoint",
  "id": "01J...",
  "display_id": null,
  "task_id": "01J...",
  "task_display_id": "CTX-0001",
  "task_status": "in_progress",
  "branch": "feature/md-worker",
  "snippet": "PR #263 merged - [markdown] worker-owned source, steady-state...",
  "score": -3.2,
  "created_at": "2026-07-28T19:00:00Z"
}
```

- `task_display_id` / `task_status`：拥有该记录的 Task，始终存在。
- `display_id`：命中记录自身的 display ID（如果有的话；Progress 和 Decision 有，Task 和 Checkpoint 没有独立于 Task 的自己的 display ID）。
- `branch`：这条命中已知的最佳分支信息。对于 Checkpoint 命中，用的是该 Checkpoint 创建时自己记录下来的分支（比 Task *当前*的 worktree 绑定更精确，因为一个 Task 在打完 Checkpoint 之后完全可能换过 worktree）；其余三种命中类型使用 Task 当前的 worktree 绑定。两者都不存在时为 `null`。
- `snippet`：带括号高亮匹配片段的简短摘录，用 `[...]` 标出命中词。
- `score`：FTS5 的 BM25 相关度分数。数值越小（越负）代表越相关；结果已经按此排序。

## 输出格式

```bash
carryctx search "markdown" --json
carryctx search "markdown" --format markdown
```

`--format markdown` 会渲染成表格（kind、task、branch、snippet），而不是原始 JSON 数组 —— 适合直接粘贴进 PR 描述或交接记录里做简要总结。

## 索引覆盖范围

| 实体 | 被索引的文本 |
| --- | --- |
| Task | `title`、`description` |
| Progress Item | `content` |
| Checkpoint | `done`、`remaining`、`notes` 三个字段的条目，拼接成一份可搜索文本 |
| Decision | `title`、`context`、`decision`、`consequences` |

索引由一组 SQLite FTS5 虚表构成，通过触发器随每一次增删改自动同步 —— 不存在单独的"重建索引"步骤，索引也不会和底层表产生漂移。从不带 `search` 功能的旧版本升级时，下一次任何命令打开项目数据库都会自动对已有数据回填索引。
