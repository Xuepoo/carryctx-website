---
title: 工作区、任务交接与决策记录
sidebar:
  order: 5
---

import { Aside } from '@astrojs/starlight/components';

这三组命令支持多 Agent 协作。Worktree(工作区)为每个任务提供独立的 Git 检出目录;Handoff(任务交接)把任务从一个 Agent 正式转交给另一个;Decision(决策记录)保存选择背后的理由,避免以后重新推导一遍。

## Worktree(工作区)

CarryCtx 中的 worktree 是文件系统路径、Git 分支、以及(可选)任务三者之间的注册绑定关系。这个绑定关系保存在项目数据库中;检出目录本身就是一个普通的 `git worktree`。

### `carryctx worktree create`

```bash
carryctx worktree create CTX-0001 --path ../ctx-0001 --branch feature/ctx-0001 --base main
```

| 参数 | 说明 |
| --- | --- |
| `TASK_REF`(位置参数) | 新工作区要绑定的任务。 |
| `--path` | 工作区位置。默认为 `.worktrees/<task-ref>`(转小写,斜杠替换为短横线)。 |
| `--branch` | 要创建的分支。默认为 `carryctx/<task-ref>`(转小写,斜杠替换为短横线)。 |
| `--base` | 分支的基准提交/分支。默认为项目配置中的 `main_branch`(其本身默认为 `main`)。 |

`create` 会先检查目标路径是否已存在、目标分支是否已存在,任一条件成立就直接报错退出,不会触碰文件系统。之后它会执行 `git worktree add`,为这次操作写入一条恢复用的 journal 记录,最后一步完成注册并将新工作区绑定到任务(效果等同于对新路径执行一次 `bind`)。

<Aside type="caution">
如果仓库是 [Jujutsu (jj) colocated](https://jj-vcs.dev/) 模式（`.git/` 旁边有一个 `.jj/` 目录），`create` 会直接以 `VALIDATION_FAILED` 报错拒绝执行,而不会去跑 `git worktree add`。jj 自己的二级工作区（`jj workspace add`）根本没有本地 `.git/`,CarryCtx 的状态命令无法在里面读取任何东西;而 `git worktree add` 创建出来的目录,`jj workspace list` 也认不出来。请直接使用 `jj workspace add <path>`,如果需要让 CarryCtx 追踪它,再从主 colocated 检出目录里执行 `carryctx worktree bind <path>`。
</Aside>

### `carryctx worktree bind`

```bash
carryctx worktree bind ../ctx-0001 --task CTX-0001
```

把一个**已经存在**的目录(已是 Git 工作区或主检出目录)注册为绑定到某个任务,不会创建任何新内容。如果该任务已经绑定到另一个工作区,`bind` 会以冲突错误拒绝执行,而不是把绑定关系挪过去。省略 `--task` 则只注册工作区,暂不绑定任务。

### `carryctx worktree list` / `show` / `status`

```bash
carryctx worktree list
carryctx worktree show ../ctx-0001
carryctx worktree status
```

`list` 显示 CarryCtx 为该项目记录的所有工作区,并与当前仓库 `git worktree list` 的结果合并展示(主检出目录会从合并结果中过滤掉,所以只会看到额外的工作区)。`show` 按路径或 ID 查询单个工作区,并实时从 Git 刷新其分支/HEAD,而不是使用上次保存的值。`status` 把已注册的工作区和 Git 自身的工作区列表并排打印出来,便于发现两者之间的差异。

### `carryctx worktree unbind`

```bash
carryctx worktree unbind ../ctx-0001
```

按路径或 ID 清除工作区的任务绑定。这只是移除 CarryCtx 内部的关联关系,不会删除目录、移除 Git 工作区,也不会动分支。

<Aside type="caution">
没有 `carryctx worktree remove` 或 `prune` 子命令。`unbind` 只解除任务绑定;要真正清理检出目录,需要直接使用 Git:`git worktree remove ../ctx-0001`。
</Aside>

## Handoff(任务交接)

Handoff 是把任务从当前 Agent 转交给另一个指定 Agent 或角色的请求。它会经历一个简单的状态机:`Open` → `Accepted` / `Rejected` / `Closed`。

### `carryctx handoff create`

```bash
carryctx handoff create --target codegen-agent --task CTX-0001 \
  --summary "Backend done, needs frontend wiring"
```

`--target`(必填)是接收方 Agent 的 ID 或角色名。`--summary` 是描述接下来需要做什么的自由文本。`--task` 是任务的 ULID 或显示 ID;如果省略,CarryCtx 会回退使用当前 session 或工作区绑定的任务,若两者都不可用则报错。这条 handoff 会记录当前 Agent 为发起方、指定目标为接收方,并保存创建时的 Git 分支/HEAD,初始状态为 `Open`。

### `carryctx handoff list` / `show`

```bash
carryctx handoff list
carryctx handoff show HO-3f9a2b1c
```

`list` 显示项目中所有 handoff,包括待处理和历史记录。`show` 打印单条 handoff 的完整记录(目标 Agent、摘要、状态、创建时的分支/HEAD)。

### `carryctx handoff accept`

```bash
carryctx handoff accept HO-3f9a2b1c --claim-task
```

把 handoff 置为 `Accepted`。根据 `--claim-task` 的说明,它会在接受的同时自动为接受方 Agent 认领(claim)关联的任务。

<Aside type="caution">
仅接受 handoff 本身并不会改变任务的所有权。要真正把任务的所有权转移过来,需要显式认领:

```bash
carryctx handoff accept HO-3f9a2b1c
carryctx task claim CTX-0001
```

`carryctx task claim` 与在 handoff 场景之外使用的是同一个命令:把任务分配给调用方 Agent,并将状态置为 `in_progress`。
</Aside>

### `carryctx handoff reject` / `close`

```bash
carryctx handoff reject HO-3f9a2b1c --reason "Already picked up by another agent"
carryctx handoff close HO-3f9a2b1c
```

`reject` 把 handoff 置为 `Rejected`,可选带上 `--reason`。`close` 把 handoff 置为 `Closed`,用于那些不再相关的请求(被取代、被放弃、目标 Agent 已不存在),而无需走接受或拒绝流程。

## Decision(决策记录)

Decision 是与某个任务关联的架构或设计选择的记录。

### `carryctx decision add`

```bash
carryctx decision add \
  --title "Use SQLite for local task storage" \
  --context "Need embedded storage with no external service dependency" \
  --decision "SQLite via rusqlite, one file per project" \
  --consequences "Migrations must be handled manually; no built-in replication" \
  --rationale "Avoids running a separate database service just to track task state" \
  --task CTX-0001
```

只有 `--title` 是必填的;`--context`、`--decision`、`--consequences`、`--rationale` 都是可选的,但建议填写。`--rationale` 是这个决策背后的"为什么"——标题本身承载不了的部分——并会和其他字段一起被 `decision search` 检索到。`--task` 会回退使用当前任务上下文,如果完全无法解析出任务,命令会报错。

### `carryctx decision list` / `show` / `search`

```bash
carryctx decision list
carryctx decision show DEC-0007
carryctx decision search "sqlite"
```

`list` 显示项目中记录的所有决策。`show` 打印单条决策的完整内容。`search QUERY` 对已记录的决策做关键词搜索。

### `carryctx decision supersede`

```bash
carryctx decision supersede DEC-0007 --by DEC-0012
```

把一条旧决策标记为已被新决策取代。`--by`(必填)是替代决策的 ID。

<Aside type="note">
没有 `carryctx decision remove` 或删除命令。决策一旦记录就是永久性的,唯一的"退役"方式是 `supersede`:原决策依然可见,只是被标记为已被取代。
</Aside>

## 示例:工作区、决策、交接三者结合

一个由某个 Agent 开始、由另一个 Agent 完成的任务流程:

```bash
# 1. 为任务创建独立的工作区
carryctx worktree create CTX-0001 --path ../ctx-0001 --branch feature/ctx-0001
cd ../ctx-0001
# ... 编辑、提交 ...

# 2. 在记忆还新鲜时记录一个关键选择的理由
carryctx decision add \
  --title "Store worktree bindings in the main project DB" \
  --context "Considered a per-worktree local DB instead" \
  --decision "Single shared DB keyed by project_id, avoids sync issues" \
  --task CTX-0001

# 3. 把任务交接给另一个 Agent
carryctx handoff create --target reviewer-agent --task CTX-0001 \
  --summary "Storage layer done, needs test coverage and review"
```

在接收方一侧:

```bash
carryctx handoff show HO-3f9a2b1c
carryctx handoff accept HO-3f9a2b1c
carryctx task claim CTX-0001
```

在整个过程中,工作区始终保持注册状态并绑定到 `CTX-0001`;发生变化的只是任务的所有权和 handoff 的状态。等工作真正落地后,解绑并清理工作区是另一个独立的、显式的步骤:

```bash
carryctx worktree unbind ../ctx-0001
git worktree remove ../ctx-0001
```

</content>
</invoke>
