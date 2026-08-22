---
title: 检查点、恢复与上下文
sidebar:
  order: 4
---

import { Aside } from '@astrojs/starlight/components';

Checkpoint、`resume`、`context` 是保存和恢复状态、应对上下文丢失的三个命令：`checkpoint` 写入一份持久快照,`resume` 为重新接手任务的人或 agent 重建"我做到哪了",`context` 则把同样的信息组装成适合直接粘贴进 LLM prompt 的形式。

## `carryctx checkpoint`：捕获一份快照

不带子命令直接运行 `carryctx checkpoint`,会针对当前（或指定）任务创建一个新的检查点：

```bash
carryctx checkpoint \
  --done "在 fetch_with_retry 中实现了重试退避逻辑" \
  --done "为抖动（jitter）计算添加了单元测试" \
  --remaining "把重试配置接入 CLI 参数" \
  --remaining "更新新退避行为的文档" \
  --blocker "等待 API 团队确认最大重试次数" \
  --risk "退避曲线尚未在真实限流场景下验证" \
  --next "在 staging 环境跑一遍集成测试" \
  --note "为简化实现选择了指数退避而非固定延迟"
```

### 自动捕获的内容

除非传入 `--no-git`,`checkpoint` 会读取项目根目录下的仓库,并记录一份 Git 快照：

- `branch` 与 `head`（当前分支名与提交 SHA）
- `dirty`（工作区是否存在未提交改动）
- `vcs_backend`（`"git"` 或 `"jj"`）与 `changed_files`（一份合并后的、在两种 backend 下都准确的变更文件列表）
- `staged_files`、`modified_files`、`deleted_files`、`untracked_files`、`renamed_files`（每条重命名记录含 `from`/`to`）
- `diff_files`、`diff_insertions`、`diff_deletions`（diff 汇总统计）

<Aside type="note">
如果仓库是 [Jujutsu (jj) colocated](https://jj-vcs.dev/) 模式（`.git/` 旁边有一个 `.jj/` 目录），`vcs_backend` 会报告为 `"jj"`，且 `staged_files`/`modified_files`/`untracked_files` 始终是空数组。jj 的自动工作副本快照机制会在几乎任何 `jj` 命令（包括只读命令）执行时把改动写入 Git index，这让 staged/unstaged/untracked 的三分法在这里失去意义。此时应改用 `changed_files`：它在两种 backend 下都保持准确。`dirty` 和 diff 统计在 jj 下同样保持准确。
</Aside>

`--no-git` 会跳过以上所有内容,退回使用 `--task`/会话上下文能提供的分支/head 信息（通常什么都没有）。

`--include-diff` 会在此基础上把未提交的原始 diff 文本也嵌入检查点记录,而不仅是统计数字。当你希望检查点在没有工作区可供比对的情况下仍能独立用于评审时,可以使用它。

每一个被记录为已修改或已暂存的文件,都会作为 `changed` 边关联到该任务在项目上下文图中的对应文件节点上（若节点不存在会自动创建),CarryCtx 还会尝试为这些文件自动提取依赖关系边。这正是为什么 `carryctx context --include-graph` 能展示某个任务触及过哪些文件,即使你没有手动打过标签。

### 需要你自己填写的内容

以下内容都不是推断出来的,而是你传入什么就记录什么：

| 参数 | 含义 |
| --- | --- |
| `--done <TEXT>` | 自上次检查点以来完成的事项。可重复。 |
| `--remaining <TEXT>` | 尚未完成的工作。可重复。 |
| `--blocker <TEXT>` | 当前阻塞进展的事项。可重复。 |
| `--risk <TEXT>` | 值得标记的风险或顾虑。可重复。 |
| `--next <TEXT>` | 接下来要执行的具体动作。可重复。 |
| `--note <TEXT>` | 其他任意备注。可重复。 |
| `--task <TASK_REF>` | 显式绑定到某个任务（默认为解析出的当前任务）。 |
| `--session <SESSION_ID>` | 显式绑定到某个会话（默认为活跃会话,如果存在）。 |

六个报告类参数（`--done`、`--remaining`、`--blocker`、`--risk`、`--next`、`--note`）都支持通过重复传参来给出多个值,每次都会成为列表中的一条独立记录,而不是拼接成一个字符串。

如果无法解析出任务（既没有 `--task`,也没有绑定到活跃会话/工作树的任务）,创建检查点会失败并提示 "No task specified."

每次都会在项目事件日志中追加一条 `checkpoint.created` 事件,记录检查点 ID、脏状态,以及 done/remaining 条目的数量。

## 列出、查看与更正检查点

```bash
carryctx checkpoint list --task CTX-0001
carryctx checkpoint show <checkpoint_id>
```

`checkpoint list` 支持 `--format markdown` 输出便于浏览的表格（ID、任务、done 条目数、创建时间）。`checkpoint show` 打印完整记录,包含上文所有 Git 字段和报告字段。

<Aside type="caution">
原始检查点是不可变的。不存在能够重写原始记录的"编辑检查点"命令。
</Aside>

如果需要纠正错误,使用 `correct`：

```bash
carryctx checkpoint correct <checkpoint_id> --done "更正：也修复了不稳定的测试" --remaining "仍需完成 staging 验证"
```

`correct` 不会改动原始的检查点行,而是写入一条独立的 `CheckpointCorrection` 记录（带自己的时间戳）并关联到该检查点,同时追加一条 `checkpoint.corrected` 事件,标明哪些字段被更正过。只有你传入的参数才会被写入更正记录;未传入的参数保持 `None`,不会覆盖任何内容。对原始检查点执行 `checkpoint show` 仍然返回原始数据;更正是并行追加的历史,而不是对原记录的修改。

`correct` 没有专门的 `--task`/`--session` 绑定参数,它直接通过 ID 定位检查点。

## `carryctx resume`：重建"我做到哪了"

```bash
carryctx resume
```

Resume 按以下顺序解析状态：

1. 查找该项目当前的活跃会话（状态为 `Active`),如果存在。
2. 解析当前任务：优先使用显式的 `--task <TASK_REF>`,否则使用活跃会话绑定的任务。
3. 查找该任务最近一次的检查点（`latestCheckpoint`）。
4. 列出该任务的开放进度条目（todo、blocker、risk、note;已移除的条目不包含在内）。
5. 拉取该任务最近的若干事件,数量受 `--max-events` 限制（未设置时默认为 10）。
6. 报告项目当前的 Git `branch` 与 `head`。

```bash
carryctx resume --task CTX-0001 --max-events 20
```

示例输出结构（JSON）：

```json
{
  "projectId": "01J...",
  "currentSession": { "id": "01J...", "state": "Active", "taskId": "01J..." },
  "currentTask": { "id": "01J...", "displayId": "CTX-0001", "title": "Add retry backoff" },
  "latestCheckpoint": {
    "id": "01J...",
    "done": ["在 fetch_with_retry 中实现了重试退避逻辑"],
    "remaining": ["把重试配置接入 CLI 参数"],
    "blockers": ["等待 API 团队确认最大重试次数"]
  },
  "progress": [
    { "displayId": "PX-0002", "itemType": "Blocker", "status": "Open" }
  ],
  "recentEvents": [ { "eventType": "checkpoint.created" } ],
  "branch": "feature/retry-backoff",
  "head": "a1b2c3d"
}
```

其他参数：`--session <SESSION_ID>` 指定某个具体会话而非当前活跃会话；`--compact` 和 `--full` 控制输出详略；`--start-session` 在打印 resume 上下文后立即开启一个新会话；`--include-diff` 会把未提交的 Git diff 加入输出。

<Aside type="note">
`resume` 和 `context` 在收集的字段上有重叠（任务、进度、branch/head),但默认取向不同：`resume` 面向"重新接手这个任务",搭配一个较短的最近事件窗口;`context` 面向 prompt 组装,大部分内容需要你显式开启。
</Aside>

## `carryctx context`：组装可直接喂给 LLM 的快照

```bash
carryctx context --task CTX-0001 --include-events --include-decisions
```

`context` 总是包含项目 ID 与名称、当前 Git 的 `branch`/`head`、解析出的当前任务,以及该任务的开放进度条目。其余部分都需要显式开启：

| 参数 | 增加的内容 |
| --- | --- |
| `--include-events` | 该任务的最近事件（遵循 `--max-events` 与 `--since`） |
| `--include-decisions` | 与项目相关的架构决策 |
| `--include-related-tasks` | *（该参数已声明,但尚未接入实际输出组装逻辑——对当前 `context` 的返回内容没有任何影响）* |
| `--include-graph` | 上下文图：检查点触及过的文件/任务节点与边 |
| `--file <PATH>` | 将图限制为某个文件节点及其直接邻居（隐含 `--include-graph`） |
| `--max-events <N>` | 包含事件时,限制返回的事件数量上限 |
| `--since <TIME>` | 只返回该时间点（或相对时长）之后的事件 |

`--full` 是一个快捷方式,会一次性开启事件、决策与上下文图,绕过逐项的 `--include-*` 参数。`--compact` 不会改变包含哪些部分,而是改变图部分的序列化方式（只返回节点的 `id`/`type`/`name` 和边的 `src`/`dst`/`rel`,而非完整记录),以缩小整体体积。

`--output <PATH>` 会把同一份 JSON 数据额外写入指定文件（同时仍会打印),便于把快照传递给其他工具。

```bash
carryctx context --task CTX-0001 --full --output /tmp/ctx-0001-context.json
```

<Aside type="caution">
`--include-related-tasks` 虽然被 CLI 接受,但目前对组装出的上下文没有任何实际影响：暂时不要依赖它来拉入阻塞或相关任务。
</Aside>
