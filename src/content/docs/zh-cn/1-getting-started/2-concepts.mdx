---
title: 核心概念
---

import { Aside } from '@astrojs/starlight/components';

CarryCtx 的状态是 SQLite 数据库中一组相互关联的记录。本页精确定义每一个概念：它意味着什么、由哪些命令创建或读取，以及（对其中两个具备真实生命周期的概念）它们允许的状态转换。

## Project（项目）

一个 Project 对应一个 Git 仓库。它由 `carryctx init` 一次性创建，该命令会在仓库根目录写入 `.carryctx/config.toml`（项目名、任务 ID 前缀、主分支），并在 Git 公共目录内创建状态数据库，因此该仓库的所有 worktree 共享同一份项目状态。

```bash
carryctx init --name my-app --task-prefix CTX
```

其他所有记录（task、agent、session 等）都归属于且只归属于一个 project。

## Agent（代理）

Agent 是作用于项目的任何实体，人类或 AI 都可以。Agent 需要显式注册，之后系统中其他地方都通过名字或 ULID 引用它：

```bash
carryctx agent register --name claude-core --provider claude-code --role implementer
```

用已存在的名字重新注册会同步该 agent，而不会报错。`carryctx agent current` 打印当前调用所解析出的活跃 agent（从 `--agent` 或 `CARRYCTX_AGENT` 环境变量解析）。`carryctx agent deactivate <ref>` 把某个 agent 标记为不活跃，使其不能再被分配新任务或会话，但不会删除历史记录。

从 0.6.0 起，agent 还带有一个可选的 `kind`（`commander` 或 `subagent`），在注册时用 `--kind` 指定。它是给调用方参考的可空元数据，不是权限边界。

## Team（团队）

Team（0.6.0 起）是一份持久化的、项目级的 agent 名册，可以有一位指挥官（commander）。因为它和其他一切存放在同一个状态数据库中，所以比创建它的那次会话活得更久——换窗口、换会话，或者进入关联的 worktree，名册都不会变。

```bash
carryctx team create --name payments-squad --commander commander-1
carryctx team member add payments-squad --agent backend-1 --role backend
```

有两条不变式由系统强制：指挥官必须是本团队的成员；在任的指挥官在被替换、或通过 `team commander set <ref> --clear` 显式清空之前，不能被移出团队。

任务可以关联到团队（`task create --team`、`task team set`、`task team unset`），也可以带一个建议性的 `required_role`。两者都不会改变生命周期、归属、依赖或 scope——关联纯粹是附加的标签，而 `required_role` 不拦截任何操作。

读取侧是两个只读投影，它们以只读方式打开数据库并且完全不写入任何东西：`carryctx team status` 给出名册及每个成员当前的活跃工作，`carryctx team context` 给出指挥官或成员所需的完整画面，可用 `--agent-for` 和 `--task` 收窄。

<Aside type="caution">
Team 是持久化与管理的原语，不是编排原语。CarryCtx 不会拉起进程、不会分派、不会重试、不会限流、也不会做心跳——这些由调用 CarryCtx 的 harness 负责。一个 agent 可以同时持有多个活跃任务；`task.single_active_task_per_agent` 仅为兼容性保留，并不强制任何上限。完整命令面见[团队](/zh-cn/2-cli-reference/10-teams/)。
</Aside>

## Session（会话）

Session 表示某个 agent 一段连续的工作周期，绑定到一个任务和（可选的）一个 worktree。Session 采用 5 状态模型：

```text
Active ──┬──> Paused ──> Active
         ├──> Ended        (终态)
         ├──> Stale ──> Active
         └──> Abandoned    (终态)
```

- `carryctx session start --agent claude-core --task CTX-0001` 创建一个处于 `Active` 状态的会话。
- `carryctx session pause` 记录一次 sleep/pause 转换，`Active → Paused`。
- `carryctx session resume` 把它转回 `Active`（从 `Stale` 也同样有效）。
- `carryctx session end --summary "..."` 干净地结束会话（`Ended`，终态）。
- `carryctx session abandon --reason "crashed"` 在没有干净结束状态的情况下强制终止会话（`Abandoned`，终态）。

`Ended` 和 `Abandoned` 都是终态：一旦进入就不允许再发生任何转换。`Stale` 用于运行时检测到会话已不活跃、但没有经过明确 pause 的情况。

## Task（任务）

Task 是最基本的工作单元，以类似 `CTX-0001` 的显示 ID 展示。Task 使用 7 状态模型：

| 状态 | 含义 |
| --- | --- |
| `planned` | 已记录但尚不可执行（例如依赖的任务还没完成） |
| `ready` | 可执行，尚未认领，或已认领但尚未开始 |
| `in_progress` | 正在被积极处理 |
| `blocked` | 被外部或内部的阻塞因素卡住 |
| `review` | 实现已完成，等待评审 |
| `completed` | 已完成（终态） |
| `cancelled` | 放弃，不会再做（终态） |

`completed` 和 `cancelled` 是终态。`in_progress`、`review`、`blocked` 在仪表盘和 `task list --mine` 中都算作"活跃"。

状态转换由一组具名的操作驱动，每个操作对应一个子命令：

```text
claim   → 设置 owner，状态通常变为 ready
start   → ready        → in_progress   （同时自动绑定任务给调用者）
block   → in_progress  → blocked       （需要提供原因）
unblock → blocked      → in_progress
review  → in_progress  → review
complete→ review/in_progress → completed
cancel  → 任意非终态    → cancelled     （需要提供原因）
reopen  → completed/cancelled → in_progress
release → 仅清除归属，不改变状态
```

```bash
carryctx task create --title "Add streaming CSV export" --priority high
carryctx task claim CTX-0001
carryctx task start CTX-0001
carryctx task block CTX-0001 --reason "waiting on upstream API schema"
carryctx task unblock CTX-0001
carryctx task complete CTX-0001
```

一个新创建的、没有未完成依赖的任务默认进入 `ready` 状态；如果有未完成的依赖，则进入 `planned` 状态（也可以用 `--status` 显式指定）。

任务还有两个 0.6.0 新增的可空字段：`team_id`（关联的团队）和 `required_role`（建议性的角色标签）。两者都不参与上面的状态机。

## Checkpoint（检查点）

Checkpoint 是某个时间点上 agent 对任务进展的持久化快照：完成了什么、还剩什么、被什么阻塞、识别出了哪些风险、下一步是什么，还可以附带实际的 Git diff。

```bash
carryctx checkpoint --done "Implemented CSV writer" --remaining "Add streaming for >1M rows" --next "Wire writer into pipeline"
```

默认情况下打检查点还会执行 `git add`/`git commit` 来捕获文件改动（`--no-git` 可以关闭这一行为），`--include-diff` 会把未提交的 diff 直接嵌入检查点记录中。`carryctx checkpoint list` 和 `carryctx checkpoint show <id>` 用于读回检查点；`carryctx checkpoint correct <id>` 把项目/agent 状态回滚到某个历史检查点。

## Progress Item（进度项）

Progress Item 是比检查点更小、更高频的单元：挂在任务下的一条 todo、blocker、risk 或 note，随手记录，而不是集中打包在检查点里。

```bash
carryctx progress todo "Write unit tests for the streaming writer"
carryctx progress block "S3 credentials missing in CI"
carryctx progress note "Chunked upload caps out at 5MB parts"
```

进度项可以独立于任务本身的状态被完成（`progress complete <ref>`）、重新打开、编辑、删除或重新排序。

## Worktree（工作树）

Worktree 记录把一个 Git worktree 目录绑定到某个任务，这样在该目录下运行的 CLI 调用会自动解析到正确的任务，而不需要每次都传 `--task`。

```bash
carryctx worktree create CTX-0001 --branch feature/csv-export
```

`carryctx worktree status` 报告当前目录的绑定状态；`carryctx worktree unbind <ref>` 移除绑定。

## Handoff（交接）

Handoff 是请求另一个 agent（或角色）接手某个任务的明确请求，和直接修改 `owner` 字段不同：它携带一段摘要，并且可以被接受或拒绝。

```bash
carryctx handoff create --target reviewer-bot --task CTX-0001 --summary "Ready for review, tests green"
carryctx handoff accept <handoff_ref> --claim-task
```

## Decision（决策）

Decision 记录一次架构或设计上的选择（本质上就是一份 ADR）：促使这个决定的背景、决定本身及其后果，可以选择关联到某个任务。之后的决策可以将旧的决策标记为 `superseded`（被取代）。

```bash
carryctx decision add --title "Use chunked multipart upload for CSV export" --context "Files exceed 1M rows" --decision "Stream via S3 multipart API"
```

## Event（事件）

Event 是上述一切最终都建立在其上的、只追加写入的不可变日志中的一行：任务转换、会话生命周期变化、检查点等，每一条都有时间戳，并归属到具体的 agent 和 session。

```bash
carryctx event list --task CTX-0001 --limit 20
```

<Aside type="note">
`carryctx resume`、`carryctx context` 以及 `carryctx team` 的两个投影都不会产生新的状态，它们跨会话、任务、检查点、进度和最近事件读取信息，重建出 agent 需要知道的内容。完整流程见[快速开始](/zh-cn/1-getting-started/3-quickstart/)。
</Aside>
