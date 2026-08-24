---
title: 交接 (Handoff)
sidebar:
  order: 8
---

import { Aside } from '@astrojs/starlight/components';

Handoff 用于在 Agent 之间转移未完成的工作。当一个 Agent 无法完成某个任务（上下文不足、专长不同、worktree 边界）时，它可以向另一个 Agent 或角色发起交接；目标方通过 `handoff list` 发现待处理请求，接受即正式确认下一步由谁负责。

<Aside type="note">
  Handoff 是 `task release`/`task claim` 的多 Agent 对应物：handoff 记录*还需要做什么*和*为什么*，而任务状态变更（所有权）是另一个显式步骤。
</Aside>

## 创建交接

```bash
carryctx handoff create --target opencode-core --task CTX-0001 --summary "Migration runner implemented, needs review"
```

| 参数               | 说明                                           |
| ------------------ | ---------------------------------------------- |
| `--target`         | 必填。目标：已注册 Agent 名称、ULID 或角色名。 |
| `--task <ref>`     | 交接关联的任务 ULID 或显示 ID。                |
| `--summary <text>` | 需要做什么、为什么发生交接。                   |

发起方 Agent 由 `CARRYCTX_AGENT`（或 `--agent`）决定。

## 查找交接

```bash
carryctx handoff list            # 所有未处理（pending）请求
carryctx handoff list --for-agent opencode-core
carryctx handoff list --all      # 包含已解决的
```

| 参数                  | 说明                                                                                          |
| --------------------- | --------------------------------------------------------------------------------------------- |
| `--status <status>`   | 精确状态过滤：`pending`（别名 `open`）、`accepted`、`declined`（别名 `rejected`）、`closed`。 |
| `--all`               | 显示全部状态。默认只显示 pending，避免已解决的交接淹没会话开始的检查。                        |
| `--for-agent <agent>` | 只显示路由给该 Agent（名称、ULID 或角色）的交接。                                             |

## 接受、拒绝、关闭

```bash
carryctx handoff accept HO-0001
carryctx handoff accept HO-0001 --claim-task   # 同时认领任务
carryctx handoff reject HO-0001 --reason "Out of scope"
carryctx handoff close HO-0001                 # 不再相关
```

| 参数              | 说明                                                                                                                                                                                                        |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--claim-task`    | （仅 accept）在同一事务内为接受方 Agent 认领关联任务，等同于 `task claim`：任务转入 `in_progress`，所有者变为接受方。若任务无法认领（已被占用、状态不符、依赖未完成），整个 accept 失败，交接保持 pending。 |
| `--reason <text>` | （仅 reject）拒绝原因。                                                                                                                                                                                     |

`show` 打印单个交接的完整记录：

```bash
carryctx handoff show HO-0001
```

每次状态变更都在同一事务内追加审计事件（`handoff.created`/`handoff.accepted`/`handoff.rejected`/`handoff.closed`）。
