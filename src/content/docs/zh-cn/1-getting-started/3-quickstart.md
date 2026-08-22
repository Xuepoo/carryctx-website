---
title: 快速开始
---

import { Aside } from '@astrojs/starlight/components';

本文完整走一遍生命周期：初始化项目、注册 agent、创建并认领任务、开启一个会话、记录进度，最后在一个全新的会话中恢复这份上下文。请在一个已有的 Git 仓库中执行以下步骤。

## 1. 初始化项目

```bash
cd your-project
carryctx init --name your-project --task-prefix CTX
```

这会在仓库根目录创建 `.carryctx/config.toml`，并在 Git 公共目录内创建状态数据库（该仓库的所有 worktree 共享这份状态）。常用参数：

- `--main-branch <name>` 设置 CarryCtx 视为默认分支的名字（例如会作为 `worktree create` 的基准分支）。
- `--force` 即使 `.carryctx/` 已存在也强制重新初始化。
- `--minimal` 跳过标准文档和 agent 模板文件。
- `--install-skill` 在初始化的同时安装 agent skill 文件。

<Aside type="tip">
`carryctx` 的每一条命令都支持全局的 `--dry-run`。如果只想看看会发生什么而不真正落盘，先跑一次 `carryctx init --dry-run`。
</Aside>

## 2. 注册一个 agent

对项目状态的任何写操作都需要一个具名的 agent，因此先注册一个：

```bash
carryctx agent register --name claude-core --provider claude-code --role implementer
```

`--name` 是必填项，`--provider` 和 `--role` 是可选的元数据。从这里开始，你可以在每条命令上加 `--agent claude-core`，或者一次性导出环境变量省去重复：

```bash
export CARRYCTX_AGENT=claude-core
```

## 3. 创建并认领任务

```bash
carryctx task create --title "Add streaming CSV export" --priority high
```

这会打印新任务的显示 ID，例如 `CTX-0001`。没有未完成依赖的任务默认进入 `ready` 状态，认领它以获得归属权：

```bash
carryctx task claim CTX-0001
carryctx task start CTX-0001
```

`task claim` 把你设为 owner；`task start` 把状态从 `ready` 转到 `in_progress`，并自动把该任务绑定到你当前的上下文（后续命令可以省略 `--task`）。

## 4. 开启一个会话

```bash
carryctx session start --agent claude-core --task CTX-0001
```

这会开启一个处于 `Active` 状态、绑定到该任务的会话。如果已经有一个活跃会话又不想报错，加上 `--reuse`。也可以用 `--worktree <path>` 把会话绑定到某个具体的 worktree。

## 5. 一边工作，一边记录进度

改动代码的过程中，随手记录小的进度项，而不是等到最后才补：

```bash
carryctx progress todo "Write unit tests for the streaming writer"
carryctx progress note "Chunked upload caps out at 5MB parts on S3"
```

到达一个自然的停顿点（一次不错的 commit、一段工作结束，或者要切换上下文之前），打一个检查点。这就是未来的会话真正会恢复的记录：

```bash
carryctx checkpoint \
  --done "Implemented CSV writer, added unit tests" \
  --remaining "Add streaming support for >1M rows" \
  --next "Wire the writer into the streaming pipeline"
```

默认情况下这也会执行 `git add`/`git commit` 来捕获对应的文件改动（传 `--no-git` 跳过这一步，或者传 `--include-diff` 把未提交的 diff 直接嵌入检查点记录）。

## 6. 结束会话

```bash
carryctx session end --summary "Implemented CSV writer and tests, streaming still open"
```

这会干净地终止会话（`Active → Ended`）。现在假设窗口关闭了，或者第二天由另一个 agent 来接手。

## 7. 在新会话中恢复

在一个全新的窗口（或者完全不同的 agent）中，第一条命令应该是：

```bash
carryctx resume
```

不传 `--task`/`--session` 时，`resume` 会找到该项目最近一次活跃的会话，解析出它绑定的任务，并汇总最新的检查点、未完成的进度项、最近的事件，以及当前的 Git 分支/HEAD。在文本模式下，这就是重建出的上下文经过美化打印的 JSON：

```json
{
  "schema_version": 1,
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

`resume` 上常用的参数：

- `--task <ref>` 或 `--session <ref>` 指定具体的任务/会话，而不是取最近活跃的那一个。
- `--compact` 生成更短的摘要；`--full` 包含详尽的历史日志和文件路径。
- `--include-diff` 把未提交的 Git diff 加入输出。
- `--max-events <n>` 限制返回的最近事件数量（默认 10）。
- `--start-session` 在打印上下文之后自动开启一个新会话，省去单独再调用一次 `session start`。

拿到检查点和进度项之后，新的会话（或新的 agent）就能从上一个会话看到的同一份状态继续工作，不需要重新翻聊天记录。

## 8. 可选：让多个 agent 一起干

如果有多个 agent 在这个仓库里协作，只需注册一次团队，这份名册就会像其他状态一样持久保存：

```bash
carryctx agent register --name commander-1 --provider claude-code --kind commander
carryctx team create --name payments-squad --commander commander-1
carryctx team member add payments-squad --agent claude-core --role backend
carryctx task team set CTX-0001 --team payments-squad
```

之后，指挥官只需一次只读调用就能读到团队的完整画面——成员、任务、依赖、阻塞项、决策、交接——并且可以先收窄到某一个成员，再把这一份切片交给它：

```bash
carryctx team context payments-squad
carryctx team context payments-squad --agent-for claude-core
```

这两条命令都不写入任何东西。把工作真正派发给这些 agent 是你的 harness 的职责，不是 CarryCtx 的。

## 接下来看什么

- [项目生命周期](/zh-cn/2-cli-reference/1-project-lifecycle/) 更深入地介绍了 `init`、`status`、`doctor` 等管理项目本身的命令。
- [核心概念](/zh-cn/1-getting-started/2-concepts/) 是上文用到的每个状态和转换的参考文档。
- [团队](/zh-cn/2-cli-reference/10-teams/) 记录了完整的 `team` 命令面，包括两个投影的 JSON 结构。
