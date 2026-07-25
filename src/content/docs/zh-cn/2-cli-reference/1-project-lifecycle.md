---
title: 项目与生命周期
---

import { Aside } from '@astrojs/starlight/components';

本页介绍用于管理整个 CarryCtx 项目的命令：创建项目、检查其健康状态,以及维护底层的 SQLite 状态数据库。前提是你已经有一个 Git 仓库,并至少运行过一次 `carryctx init`。

## `carryctx init`

在当前 Git 仓库中初始化 CarryCtx。它会从起始路径发现 Git 仓库根目录、加载全局与项目配置、创建 `.carryctx/` 目录(包含 config 与 README)、在 Git common 目录下创建项目状态数据库、将项目注册到全局注册表,并追加一条 `project.initialized` 事件。

| 参数 | 说明 |
| --- | --- |
| `--name <NAME>` | 自定义项目名称,默认使用目录名。 |
| `--task-prefix <PREFIX>` | 任务前缀,用于生成任务编号(例如 `PROJ` 会生成 `PROJ-123`)。 |
| `--main-branch <BRANCH>` | 设置 Git 的主/默认分支名(例如 `main` 或 `master`)。 |
| `--force` | 即使目录中已存在 `.carryctx` 文件夹,也强制重新初始化。 |
| `--minimal` | 创建最小化配置,不添加标准文档与 agent 模板。 |
| `--install-skill` | 初始化过程中自动安装标准 agent skill。 |

<Aside type="tip">
不加 `--force` 时,在已初始化的仓库上再次运行 `init` 是安全的:它会先检查已存在的状态,而不是直接覆盖你的配置。
</Aside>

```bash
carryctx init --name my-app --task-prefix APP
```

```bash
# 不小心删除了 .carryctx 之后重新初始化
carryctx init --force
```

## `carryctx status`

打印项目健康面板:活跃会话、活跃 agent、所有任务、worktree,以及当前 Git 分支/HEAD。不加任何参数时,会渲染包含全部区块的完整 JSON/文本输出。

| 参数 | 说明 |
| --- | --- |
| `--mine` | 只显示分配给当前 agent 的项目。 |
| `--all` | 显示整个项目中所有的项目,不论状态或分配情况。 |
| `--compact` | 以紧凑格式打印输出,不含详细描述。 |
| `--sessions` | 在报告中包含活跃与近期的 agent 会话。 |
| `--tasks` | 在报告中包含活跃与待处理的任务。 |
| `--worktrees` | 在报告中包含与任务关联的当前 Git worktree。 |
| `--since <WHEN>` | 只显示某个时间点或时长之后发生的事件/状态变化(例如 `24h`、`2023-01-01`)。 |

在 Markdown 输出模式下,`status` 会渲染一个摘要块,包含项目名称、仓库根目录、分支、HEAD、活跃会话数、活跃 agent 数、任务总数,以及 worktree 数:

```text
# CarryCtx Status

- **Project**: my-app
- **Repository**: /home/user/my-app
- **Branch**: main
- **HEAD**: a1b2c3d
- **Active Sessions**: 1
- **Active Agents**: 2
- **Total Tasks**: 14
- **Worktrees**: 1
```

```bash
carryctx status --mine
```

```bash
carryctx status --since 24h --compact
```

## `carryctx doctor`

诊断并可自动修复项目 SQLite 状态数据库中潜在的问题。它会检查:全局配置的有效性、Git 仓库发现情况、已安装的 CarryCtx git hook(`post-commit`、`prepare-commit-msg`)、[Jujutsu (jj) colocation](https://jj-vcs.dev/) 检测(仅为提示信息)、数据库连接与 schema 版本、孤立任务(owner agent 已不存在的任务)、进行中的任务,以及活跃会话。

| 参数 | 说明 |
| --- | --- |
| `--fix` | 自动尝试修复数据库和配置中检测到的异常。 |
| `--json` | 以 JSON 格式输出诊断结果。 |

每一项检查会报告 `ok`、`info`、`warning` 或 `error` 状态。只要有任意一项为 `error`,总体摘要就是 `issues_found`,进程会以非成功状态码退出;否则摘要为 `healthy`。

```bash
carryctx doctor
```

```text
CarryCtx Doctor

  ✓ Git repository at /home/user/my-app
  ✓ CarryCtx hooks installed: post-commit, prepare-commit-msg
  ✓ Database at /home/user/my-app/.git/carryctx/state.db
  ✓ Schema version up to date
  ✓ No orphaned tasks (all owners exist)
  ℹ 1 task(s) currently in progress

Everything looks good!
```

<Aside type="caution">
目前 `doctor` 除了针对缺失数据库指向 `carryctx init` 之外,并不会自动执行更多修复;大多数 `error` 检查会给出一条修复命令(比如 `carryctx init`),而不是在 `--fix` 下静默改动状态。
</Aside>

## `carryctx project`

用于管理整个项目以及本机项目注册表的子命令。

| 子命令 | 说明 |
| --- | --- |
| `show` | 显示当前项目的元数据与统计信息(ID、名称、仓库根目录、git common 目录、数据库路径、主分支、schema 版本)。 |
| `list` | 列出本机上所有已知的 CarryCtx 项目。 |
| `register <path>` | 将当前目录注册为全局已知项目。 |
| `unregister <project_id>` | 从全局注册表中移除某个项目。 |
| `migrate` | 运行数据库迁移以升级项目状态 schema,并报告实际应用的迁移。 |
| `backup` | 为项目的 SQLite 状态数据库创建一份可移植的备份。 |
| `restore <path>` | 从备份文件恢复项目的 SQLite 状态。 |
| `prune [--older-than-days <N>]` | 归档在 `N` 天之前更新过的已完成任务,以保持主数据库轻量,默认为 `30`。同时支持别名 `--older-than`。 |

```bash
carryctx project show
```

```bash
carryctx project backup
```

```bash
carryctx project prune --older-than-days 60
```

## `carryctx agent`

用于管理项目中注册的 agent 的子命令。一个 agent 拥有名称、可选的 provider、可选的 role,以及 `active` 或 `deactivated` 状态。

| 子命令 | 说明 |
| --- | --- |
| `register --name <NAME> [--provider <P>] [--role <ROLE>]` | 注册一个新 agent,或将已存在的 agent 同步到项目状态中。 |
| `list` | 列出项目数据库中所有已注册的 agent。 |
| `show <agent_ref>` | 显示指定 agent 的详细元数据与历史记录。 |
| `current` | 根据环境变量或全局参数打印当前活跃的 agent。 |
| `rename <agent_ref> --name <NAME>` | 重命名一个已存在的 agent,更新引用名称,但保留底层的 ULID。 |
| `deactivate <agent_ref>` | 将某个 agent 标记为不活跃,使其无法再被分配新任务或会话。 |

```bash
carryctx agent register --name claude-sonnet --provider anthropic --role implementer
```

```bash
carryctx agent rename claude-sonnet --name claude-main
```

## `carryctx session`

用于管理 agent 会话的子命令。会话遵循一个 5 状态模型:`active`、`paused`、`ended`、`stale`、`abandoned`。`ended` 和 `abandoned` 是终止状态,一旦进入其中任一状态就不能再转换。合法的转换路径为:`active` → `paused`/`ended`/`stale`/`abandoned`,`paused` → `active`/`ended`/`abandoned`,以及 `stale` → `active`/`ended`/`abandoned`。

| 子命令 | 说明 |
| --- | --- |
| `start [--agent <ID>] [--task <ID>] [--provider <P>] [--worktree <ID>] [--reuse]` | 初始化并启动一个绑定到当前上下文的新会话。`--agent` 可覆盖创建会话的 agent;`--task` 显式绑定到某个任务(如果省略,CarryCtx 会尝试从当前 worktree 推断任务,再尝试从该 agent 唯一的进行中任务推断);`--provider` 记录用于遥测的 LLM provider;`--worktree` 绑定到指定的 worktree 目录;`--reuse` 复用已存在的活跃会话而不是报错。 |
| `list` | 列出历史与活跃的会话。 |
| `show <session_id>` | 显示指定会话的元数据与状态转换历史。 |
| `current` | 打印当前活跃的会话 ID。 |
| `pause [session_id]` | 暂停活跃会话,记录一次暂停转换。需要能从上下文中解析出 agent。 |
| `resume [session_id]` | 恢复之前暂停的会话,记录一次恢复转换。 |
| `end [session_id] [--summary <TEXT>]` | 正常结束活跃会话,将其标记为终止,可选附带完成工作的摘要。 |
| `abandon [session_id] [--reason <TEXT>]` | 在没有正常结束状态记录的情况下强制放弃会话,适用于崩溃之后的场景。 |

```bash
carryctx session start --task CTX-0001
```

```bash
carryctx session end --summary "Implemented pagination on the users endpoint"
```

```bash
carryctx session abandon --reason "process crashed"
```
