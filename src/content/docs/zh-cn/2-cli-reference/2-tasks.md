---
title: 任务管理 (Task)
---

import { Aside } from '@astrojs/starlight/components';

任务（task）是 CarryCtx 追踪工作的基本单元。每个任务都有一个形如 `CTX-0001` 的显示 ID（前缀来自项目配置）、一个状态、一个优先级、可选的负责人，以及零个或多个对其他任务的依赖。下面的命令都假设你已经在项目中运行过 `carryctx init`。

## 创建任务

```bash
carryctx task create --title "Add password reset flow"
```

`task create` 支持的参数：

| 参数 | 说明 |
| --- | --- |
| `--title` | 必填，任务的简短标题。 |
| `--description` | Markdown 格式的任务详细描述。 |
| `--priority` | `low`、`normal`（默认）、`high` 或 `urgent`。 |
| `--owner` | 创建时直接指定负责人，可用 agent 名称或 ULID。 |
| `--status` | 强制指定初始状态，而不是让 CarryCtx 自动推导（见下文）。可选值为 `planned`、`ready`、`in_progress`、`blocked`、`review`、`completed`、`cancelled`。 |
| `--depends-on` | 可重复传入。当前任务依赖的任务引用（显示 ID 或 ULID）。会创建一条 strong（强）依赖边。 |

如果不传 `--status`，CarryCtx 会自动推导：没有未完成依赖的任务初始状态为 `ready`；存在未完成依赖的任务初始状态为 `planned`。如果任务还有未完成的强依赖，强行指定 `--status ready` 会被拒绝，返回冲突错误。

```bash
carryctx task create --title "Design reset email template" --priority high
# -> Task created: CTX-0001

carryctx task create --title "Wire reset flow to email service" \
  --depends-on CTX-0001 --priority high
# -> CTX-0002, status: planned (等待 CTX-0001)
```

<Aside type="tip">
创建时用 `--depends-on` 添加的依赖始终是 `strong` 类型。如果需要 `informational`（仅供参考）类型，之后用 `carryctx task depend` 单独添加。
</Aside>

## 查看与筛选任务列表

```bash
carryctx task list
carryctx task list --status ready
carryctx task list --owner alice
carryctx task list --mine
```

`task list` 支持的参数：

| 参数 | 说明 |
| --- | --- |
| `--status` | 按状态精确筛选。 |
| `--owner` | 按负责人筛选，可用 agent 名称或 ULID。 |
| `--mine` | 只显示当前 agent（由 `--agent` 或配置的默认 agent 决定）负责的任务。 |

`--owner` 和 `--mine` 是两个独立的筛选条件，同时传入只有在两者一致时才会进一步缩小结果。在顶层加上 `--format markdown` 可以拿到 Markdown 表格而不是 JSON/表格输出。

```bash
carryctx task show CTX-0002
```

`task show` 会打印完整记录（标题、描述、状态、优先级、负责人、时间戳），外加两个依赖数组：`depends_on`（当前任务的前置依赖，每项都带自己的 `status`，一眼就能看出是否还没完成）和 `blocks`（依赖当前任务的下游任务）。想知道"这个任务被什么卡住"或"这个任务解锁了什么"，直接看这两个字段即可；`carryctx graph edges` 是 AST 代码依赖图谱的独立功能，不接受任务 ID。

## 编辑任务

```bash
carryctx task edit CTX-0002 --title "Wire reset flow to notification service" --priority urgent
```

`task edit` 只能修改 `--title` 和 `--priority`。它没有用于修改 `--description`、`--owner` 或 `--status` 的参数，负责人和状态请使用下面的专门命令来变更。

## 任务生命周期

CarryCtx 用一个 7 状态的枚举来描述任务：

```text
planned --------> ready --------> in_progress --------> review --------> completed
   ^                 ^                 |    ^               |
   |                 |                 v    |               v
   +----------- (依赖满足) <---- blocked --+----------> cancelled
```

| 状态 | 含义 |
| --- | --- |
| `planned` | 已创建，但还存在未完成的强依赖。 |
| `ready` | 没有未完成的强依赖，尚未被认领。 |
| `in_progress` | 已被某个 agent 认领并正在处理。 |
| `blocked` | 暂停中，必须附带原因。 |
| `review` | 工作已完成，等待评审。 |
| `completed` | 终态。 |
| `cancelled` | 终态。 |

`completed` 和 `cancelled` 是终态：除了 `reopen` 之外没有别的命令能把任务迁出这两个状态。

## 状态转换命令

以下命令都作用于一个任务引用（显示 ID 或 ULID），并各自强制执行下表中的规则：

| 命令 | 起始状态 | 目标状态 | 强制规则 |
| --- | --- | --- | --- |
| `carryctx task claim <ref>` | `ready` | `in_progress` | 若任务已被其他人认领会失败（返回 "already claimed" 错误）；若存在未完成的强依赖也会失败。成功时会把负责人设为当前 agent。 |
| `carryctx task release <ref>` | `in_progress`、`blocked`、`review` | 依赖已完成则回到 `ready`，否则回到 `planned` | 若任务上还挂着活跃 session 会失败。会清空负责人。 |
| `carryctx task start <ref>` | `ready`、`planned` | `in_progress` | 若存在未完成的强依赖会失败。 |
| `carryctx task block <ref> --reason "..."` | `in_progress`、`ready`、`planned`、`review` | `blocked` | `--reason` 是必填项，缺省会触发校验错误。 |
| `carryctx task unblock <ref>` | `blocked`、`planned` | 若有负责人则回到 `in_progress`，否则回到 `ready` | 若强依赖仍未完成会失败。 |
| `carryctx task review <ref>` | `in_progress` | `review` | 无额外参数。 |
| `carryctx task complete <ref>` | `review`、`in_progress` | `completed` | 若任务存在未完成的 progress item，且配置中 `task.strict_completion` 为开启，则会被阻止；否则会成功并附带警告。 |
| `carryctx task cancel <ref> --reason "..."` | 任意非终态 | `cancelled` | 对活跃任务而言 `--reason` 是必填项。会清空负责人。 |
| `carryctx task reopen <ref>` | `completed`、`cancelled` | 依赖已完成则回到 `ready`，否则回到 `planned` | 会清空负责人。 |

```bash
carryctx task claim CTX-0001
carryctx task block CTX-0001 --reason "waiting on copywriter for email text"
carryctx task unblock CTX-0001
carryctx task review CTX-0001
carryctx task complete CTX-0001
```

如果尝试认领一个还有未完成强依赖的任务，会立即失败：

```bash
carryctx task claim CTX-0002
```

```text
Error: Task 'CTX-0002' has incomplete dependencies and cannot be claimed yet.
```

等 `CTX-0001` 完成之后，`CTX-0002` 会自动变为 `ready`，此时就可以被认领了。

## 依赖管理

```bash
carryctx task depend CTX-0002 --on CTX-0001
carryctx task depend CTX-0002 --on CTX-0003 --kind informational
carryctx task undepend CTX-0002 --on CTX-0003
```

`task depend` 支持的参数：

| 参数 | 说明 |
| --- | --- |
| `--on` | 必填，当前任务所依赖的任务引用。 |
| `--kind` | `strong`（默认）或 `informational`（也接受 `info`）。 |

`strong` 依赖会在前置任务变为 `completed` 之前，阻止依赖任务被认领或启动。`informational` 依赖只是记录关系，不会阻塞任何状态转换。

添加新的依赖边之前，CarryCtx 会用项目内完整的依赖图做校验，如果会形成环，命令会直接失败：

```bash
carryctx task depend CTX-0001 --on CTX-0002
```

```text
Error: Adding this dependency would create a cycle.
```

给一个未被认领、处于 `ready` 状态的任务添加一条指向未完成前置任务的强依赖，会自动把它降回 `planned`。反过来，从一个未被认领、处于 `planned` 状态的任务上移除最后一条未完成的强依赖，会自动把它升回 `ready`。

## 引用任务

上面所有涉及任务引用的命令都可以使用显示 ID（如 `CTX-0001`）或内部 ULID。`--owner` 和 agent 引用同理，可以使用 agent 名称或 ULID。
