---
title: 分析与自动化
---

import { Aside } from '@astrojs/starlight/components';

当任务、检查点和图谱都进入日常使用之后，还有三个命令补齐了整套生态：`carryctx stats` 用于报告实际的工作进展，`carryctx hooks` 用于把 CarryCtx 自动接入 Git，`carryctx sync` 则用于（完全可选地）让项目状态跟随你在多台机器间移动。

## `carryctx stats`

```bash
carryctx stats
```

直接基于本地数据库计算项目级和 agent 级的统计数据：按状态划分的任务总数（planned、ready、in progress、completed、cancelled）、图谱节点与边的总数、会话与检查点总数、agent 总工作时长，以及按 agent 拆分的会话数、总工作秒数、检查点数、已完成任务数、上报的阻塞数。

默认（人类可读）输出：

```text
Project Overview:
   Tasks: 12 Total (Done: 7, In Progress: 2, Ready: 2, Planned: 1)
   Graph: 84 Nodes, 211 Edges
   Sessions: 9 | Checkpoints: 23

Agent Name           | Sessions   | Time Spent   | Checkpoints  | Tasks Done      | Blockers
---------------------+------------+--------------+--------------+-----------------+----------
claude-code          | 5          | 6h 12m       | 14           | 4               | 1
codex                | 4          | 3h 40m       | 9            | 3               | 0
```

参数：

| 参数 | 作用 |
| --- | --- |
| `--for-agent <NAME>` | 将所有统计（概览与表格）限定到单个 agent |
| `--markdown` | 以 Markdown 文档形式打印报告（若配合 `--output` 则写入文件），而不是纯文本表格 |
| `-o, --output <PATH>` | 将报告写入文件而非打印到终端。格式由扩展名决定：`.csv` → CSV，`.json` → 原始的 `ProjectStats` 结构体 JSON，其他 → Markdown |

```bash
carryctx stats --markdown --output /tmp/project_stats.md
```

```text
Successfully exported project stats to /tmp/project_stats.md
```

生成的 Markdown 内容如下：

```markdown
# CarryCtx Project Statistics

## Overview
- **Total Tasks**: 12 (Completed: 7, In Progress: 2, Ready: 2, Planned: 1)
- **Code Graph**: 84 Nodes, 211 Edges
- **Sessions & Checkpoints**: 9 Sessions, 23 Checkpoints
- **Total Agent Work Time**: 9h 52m

## Agent Performance
| Agent Name | Sessions | Time Spent | Checkpoints | Tasks Done | Blockers |
| :--- | :--- | :--- | :--- | :--- | :--- |
| claude-code | 5 | 6h 12m | 14 | 4 | 1 |
| codex | 4 | 3h 40m | 9 | 3 | 0 |
```

这正是 `carryctx-core` 技能提到「导出项目统计报告用于 PR 描述或文档」时所指的内容：直接用 `--markdown --output` 生成一份，粘进 PR 正文或周报，而不必手写。

<Aside type="tip">
CSV 输出（`carryctx stats --output stats.csv`）每个 agent 一行，列为 `agent_name,sessions,total_seconds,checkpoints,tasks_completed,blockers_reported`，便于跨项目导入表格工具汇总。
</Aside>

## `carryctx hooks`

`carryctx hooks` 安装 Git hook，让 CarryCtx 状态自动随提交同步，不必记得手动运行 `checkpoint`。

```bash
carryctx hooks install
```

会在仓库的 `.git/hooks` 目录下安装两个 hook：

- **`post-commit`**：每次提交后，从 `carryctx context` 查出当前活跃任务，创建一条记录了本次提交 SHA 的自动检查点。
- **`prepare-commit-msg`**：把当前活跃任务的 display ID（例如 `[CTX-0001]`）前置到提交信息中，merge 和 squash 提交会被跳过。

参数：

| 参数 | 效果 |
| --- | --- |
| `--post-commit-only` | 只安装 post-commit hook，跳过 prepare-commit-msg |
| `--force` | 覆盖已存在的同名 hook，覆盖前先把原文件备份为 `<hook>.bak` |

```bash
carryctx hooks status
carryctx hooks uninstall --restore
```

`hooks status` 会报告每个 hook 是否已安装，以及是否由 CarryCtx 管理（不含 `CarryCtx` 标记注释的 hook 会被判定为「存在但非本工具管理」，并保持不动）。`hooks uninstall` 只会移除带有该标记的 hook；加上 `--restore` 后，如果存在 `.bak` 备份，会恢复备份而不是直接删除。

## `carryctx sync`

```bash
carryctx sync push --remote /path/to/shared/backup
carryctx sync pull --remote /path/to/shared/backup
```

`sync push` 把项目本地的 SQLite 数据库复制到 `--remote` 指定目录下的一个文件中（默认为 `/tmp/carryctx-remote`，建议自行覆盖）；`sync pull` 则把它从那里复制回本地项目数据库所在位置。整个机制仅此而已：对着你指定的目录做一次原始数据库文件复制，没有网络协议、没有服务端、也没有定时同步。

<Aside type="caution">
`sync` 从不会被任何其他命令自动调用。CarryCtx 在设计上是本地优先的（参见项目 README 中的功能对比：「离开本机：从不 —— 100% 本地」），`sync` 是你唯一需要主动选择开启的例外：由你亲自运行，指向你自己选定的位置（挂载的网络共享、外部硬盘、可同步的云文件夹）。没有默认远端，也没有后台进程；只要你从不运行 `carryctx sync`，项目数据就永远不会离开这台机器。
</Aside>

由于 `sync pull` 是整体覆盖本地数据库，应当把它当作「整体状态替换」而非「合并」：在有本地专属改动的情况下从远端拉取，会用远端副本丢弃掉这些本地改动。
