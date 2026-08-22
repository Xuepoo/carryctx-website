---
title: 团队 (Team)
sidebar:
  order: 10
---

import { Aside } from '@astrojs/starlight/components';

Team（0.6.0 起）是一份持久化的、项目级的 Agent 名册。它和任务存放在同一个 `state.sqlite` 中，因此比创建它的那次会话活得更久：关掉窗口、开一个新窗口，或者 `cd` 进一个关联的 worktree，团队依然在那里，成员、指挥官（commander）和任务关联都保持原样。

Team 回答了三个以前只存在于 prompt 里、或者只存在于某个人脑子里的问题：**这个团队里有谁**、**每个成员正在做什么**、以及**某个成员此刻需要知道什么**。它不负责运行任何人的 agent。

<Aside type="caution">
CarryCtx 是管理与持久化层，不是编排（orchestration）框架。拉起进程、分派工作、重试、并发上限、创建 worktree、心跳、模型选择，全部属于调用 CarryCtx 的外部 harness。0.6.0 不包含调度器、不包含 worker 运行时，也不包含 lease 或心跳机制。
</Aside>

## 创建团队

```bash
carryctx team create --name payments-squad
carryctx team create --name payments-squad --commander commander-1
```

| 参数                      | 说明                                                                        |
| ------------------------- | --------------------------------------------------------------------------- |
| `--name <NAME>`           | 必填。团队名称，在其他所有 `team` 命令中都可作为 ref 使用。                 |
| `--commander <AGENT_REF>` | 可选。要设为指挥官的 Agent 名称或 ULID。该 Agent 会在同一事务内被加为成员。 |

创建时传 `--commander` 会同时把该 Agent 加入成员名单，因此绝不会出现「指挥官不在自己团队里」的状态。

## 成员管理

```bash
carryctx team member add payments-squad --agent backend-1 --role backend
carryctx team member add payments-squad --agent reviewer-1 --role reviewer
carryctx team member remove payments-squad --agent frontend-1
```

| 参数                  | 说明                                                                                                    |
| --------------------- | ------------------------------------------------------------------------------------------------------- |
| `--agent <AGENT_REF>` | 必填。被添加或移除的 Agent，按名称或 ULID 指定。                                                        |
| `--role <ROLE>`       | 可选，仅 `add`。自由格式的角色标签（`backend`、`reviewer` 等），用于与任务的 `required_role` 相互对照。 |

注意：在这两个子命令上，`--agent` 指的是操作的*对象*，而不是调用者。请用 `CARRYCTX_AGENT`（或在未被遮蔽的命令上用全局 `--agent`）标明执行操作的 Agent，这样审计事件才能正确归属。

把已经是成员的 Agent 再加一次会报冲突，而不是静默忽略：

```json
{
  "schema_version": 1,
  "command": "team.member_add",
  "success": false,
  "error": {
    "code": "STATE_CONFLICT",
    "message": "Agent is already a member of this team."
  }
}
```

## 指挥官

```bash
carryctx team commander set payments-squad --agent commander-1
carryctx team commander set payments-squad --clear
```

有两条规则由数据库层面强制约束，而不只是口头约定：

- **指挥官必须是本团队的成员。** 把非成员提升为指挥官会失败并返回 `STATE_CONFLICT`（`Commander must be a member of this team.`）。
- **在任的指挥官不能被移出团队。** 对在任指挥官执行 `team member remove` 会失败并提示 `Cannot remove the current team commander.`。要么先提升一位替代者，要么先执行 `team commander set <ref> --clear` 再移除。

```bash
carryctx team member remove payments-squad --agent commander-1
```

```json
{
  "schema_version": 1,
  "command": "team.member_remove",
  "success": false,
  "error": {
    "code": "STATE_CONFLICT",
    "message": "Cannot remove the current team commander."
  }
}
```

`commander_agent_id: null` 的团队是合法的——那是一份没有指定负责人的名册，而不是一个损坏的团队。

## 把任务关联到团队

团队关联本质上是任务上的一个标签，可以在创建时指定，也可以事后修改：

```bash
carryctx task create --title "Add idempotency keys to charge endpoint" \
  --team payments-squad --required-role backend --priority high

carryctx task team set CTX-0004 --team payments-squad
carryctx task team set CTX-0004 --team none
carryctx task team unset CTX-0004
carryctx task edit CTX-0004 --required-role reviewer
```

`--team none` 与 `task team unset` 是同一个操作。两者都会返回更新后的任务以及 `previous_team_id`，便于调用方判断改动了什么：

```json
{
  "schema_version": 1,
  "command": "task.team_set",
  "success": true,
  "data": {
    "operation": { "applied": true },
    "previous_team_id": null,
    "task": {
      "display_id": "CTX-0004",
      "required_role": null,
      "status": "ready",
      "team_id": "01M0KK3XDQJ8CE7XBDH1YFHTZQ",
      "title": "Unassociated chore: bump deps"
    }
  }
}
```

<Aside type="note">
关联是纯增量的。把任务放进团队不会改变它的生命周期、归属、依赖或 scope，也不会拦住任何状态转换。`agents.kind` 和 `tasks.required_role` 同理，都是可为空的附加元数据：`required_role` 只是建议性的，CarryCtx 不会阻止「角色不对」的 Agent 认领任务。
</Aside>

## Agent 类型（kind）

```bash
carryctx agent register --name commander-1 --provider claude-code --kind commander
carryctx agent register --name backend-1 --provider claude-code --kind subagent
```

`--kind` 接受 `commander` 或 `subagent`，且可为空——0.6.0 之前注册的 Agent、或注册时没传这个参数的 Agent，就是没有 kind。它是给 harness 和阅读 `team status` 的人看的提示，不是权限边界。

## 只读投影

`team status` 和 `team context` 是读取侧。两者都以**只读**方式打开数据库，不执行迁移，不获取写命令所需的项目准入锁，并且完全不写入任何东西：不写事件、不写 claim、不写 session。你可以在 agent 循环的每一轮都调用它们，而不会污染审计日志。

### `carryctx team status`

```bash
carryctx team status                  # 项目内所有团队
carryctx team status payments-squad   # 单个团队
```

带 ref 时返回 `{team, members, counts}`；不带 ref 时返回 `{teams: [...]}`，其中每个团队都是同样结构的对象。

```json
{
  "schema_version": 1,
  "command": "team.status",
  "success": true,
  "data": {
    "counts": {
      "commanders": 1,
      "subagents": 3,
      "total": 4,
      "unassigned": 2
    },
    "members": [
      {
        "active_session_id": "01M0KK4K9K5J4DBXCFHRD9NF3C",
        "active_task_count": 2,
        "agent_id": "01M0KK3XC355MZ8BVKPTZZWNK3",
        "kind": "subagent",
        "name": "backend-1",
        "role": "backend",
        "tasks": [
          {
            "display_id": "CTX-0001",
            "status": "in_progress",
            "team_id": "01M0KK3XDQJ8CE7XBDH1YFHTZQ"
          },
          {
            "display_id": "CTX-0003",
            "status": "blocked",
            "team_id": "01M0KK3XDQJ8CE7XBDH1YFHTZQ"
          }
        ]
      },
      {
        "active_session_id": null,
        "active_task_count": 0,
        "agent_id": "01M0KK3XBHDJ3NAE0ZZ44YV4Q8",
        "kind": "commander",
        "name": "commander-1",
        "role": "lead",
        "tasks": []
      }
    ],
    "team": {
      "commander_agent_id": "01M0KK3XBHDJ3NAE0ZZ44YV4Q8",
      "created_at": "2026-08-22T01:59:40.727797581+00:00",
      "id": "01M0KK3XDQJ8CE7XBDH1YFHTZQ",
      "name": "payments-squad",
      "project_id": "01M0KK3XAHNPJTG551RF462R1E",
      "updated_at": "2026-08-22T02:01:29.951021409+00:00"
    }
  },
  "meta": { "timestamp": "2026-08-22T02:03:29.065696830+00:00" }
}
```

每个成员都带有自己的 `role`、`kind`、`active_session_id`（没有则为 `null`），以及 `tasks`：该成员所有非终态任务及其状态。`counts` 有意混合了两个维度：

| 字段         | 含义                                                    |
| ------------ | ------------------------------------------------------- |
| `total`      | 成员数量。                                              |
| `commanders` | `kind` 为 `commander` 的成员数。                        |
| `subagents`  | `kind` 为 `subagent` 的成员数。                         |
| `unassigned` | 没有 owner 的团队**任务**数——即指挥官可以派发的待办池。 |

### `carryctx team context`

```bash
carryctx team context payments-squad
carryctx team context payments-squad --agent-for backend-1
carryctx team context payments-squad --task CTX-0002
```

这就是你喂给 Agent 的那份投影。它完全基于持久化记录，重建出团队（或某一个成员、某一个任务）所需的全部信息：

| 字段                         | 内容                                                                                                  |
| ---------------------------- | ----------------------------------------------------------------------------------------------------- |
| `team`                       | 被投影团队的 `id` 与 `name`。                                                                         |
| `view`                       | `commander`（整个团队）、`member`（`--agent-for`）或 `task`（`--task`）。                             |
| `members`                    | 成员名册，使用 `--agent-for` 时收窄为该对象。                                                         |
| `tasks`                      | 范围内的团队任务，含 `owner_agent_id`、`required_role`、`status`、`priority`。                        |
| `dependencies`               | 依赖边，且对返回的任务集合闭合。                                                                      |
| `scopes` / `scope_conflicts` | 文件 scope 预留。字段存在于返回结构中；0.6.0 没有任何 CLI 命令会写入它们，因此实际上始终为空。        |
| `progress`                   | 范围内任务的未完成进度项。                                                                            |
| `blockers`                   | 上述进度项中类型为 `blocker` 的子集。                                                                 |
| `conflicts`                  | 当前与 `scope_conflicts` 内容一致。                                                                   |
| `latest_checkpoints`         | 范围内每个任务最近的一个检查点。                                                                      |
| `decisions`                  | 挂在范围内任务上的决策。                                                                              |
| `handoffs`                   | 涉及范围内任务的交接及其状态。                                                                        |
| `recent_events`              | 范围内任务的近期审计事件。                                                                            |
| `rebuild`                    | 来源信息：`source` 为 `"durable_records"`，以及本次投影所对应的 `session_id`（无法解析时为 `null`）。 |

`--agent-for` 和 `--task` 会一致地收窄**每一个**集合，并且依赖边对返回的任务集合闭合——只有当一条边的两个任务都在范围内时它才会出现。收窄到 `backend-1` 时，它的两个任务之间没有依赖边，因此 `dependencies` 为空，尽管在整个项目范围内 `CTX-0002` 依赖 `CTX-0001`：

```json
{
  "schema_version": 1,
  "command": "team.context",
  "success": true,
  "data": {
    "blockers": [
      {
        "content": "Ledger snapshot export is missing Feb rows",
        "id": "01M0KK54GSNHJM1HY43NKWXGBX",
        "task_id": "01M0KK4DHGHJD7ARPVD4T7XP32",
        "type": "blocker"
      }
    ],
    "conflicts": [],
    "decisions": [
      {
        "created_at": "2026-08-22T02:00:20.818487042+00:00",
        "decision": "Return 409 with original charge id",
        "display_id": "DEC-0001",
        "id": "01M0KK54JJPKTB64WWE393M2GE",
        "rationale": null,
        "task_id": "01M0KK4DGDZY2R9ZM8ZKB7HGW4",
        "title": "Mirror Stripe 409 for replayed charges"
      }
    ],
    "dependencies": [],
    "handoffs": [
      {
        "created_at": "2026-08-22T02:00:20.835331503+00:00",
        "display_id": "HO-0001",
        "id": "01M0KK54K34E6D5Y40Z6BD8CN9",
        "source_agent_id": "01M0KK3XC355MZ8BVKPTZZWNK3",
        "status": "pending",
        "summary": "Replay detection ready for review",
        "target_agent_id": "01M0KK3XD5X9D2ZEDMBBCSHG58",
        "task_id": "01M0KK4DGDZY2R9ZM8ZKB7HGW4"
      }
    ],
    "latest_checkpoints": [
      {
        "blockers": "[]",
        "created_at": "2026-08-22T02:00:20.799022723+00:00",
        "done": "[\"Schema migration written\"]",
        "id": "01M0KK54HZBV2RZDM3KPRKWP16",
        "remaining": "[\"Wire replay detection into handler\"]",
        "task_id": "01M0KK4DGDZY2R9ZM8ZKB7HGW4"
      }
    ],
    "members": [
      {
        "agent_id": "01M0KK3XC355MZ8BVKPTZZWNK3",
        "kind": "subagent",
        "name": "backend-1",
        "role": "backend"
      }
    ],
    "progress": [
      {
        "content": "Add idempotency_key column + unique index",
        "id": "01M0KK54FMPZDA6SNYR70D7AGA",
        "position": 0,
        "status": "open",
        "task_id": "01M0KK4DGDZY2R9ZM8ZKB7HGW4",
        "type": "todo"
      }
    ],
    "rebuild": {
      "session_id": null,
      "source": "durable_records"
    },
    "recent_events": ["..."],
    "scope_conflicts": [],
    "scopes": [],
    "tasks": [
      {
        "display_id": "CTX-0001",
        "owner_agent_id": "01M0KK3XC355MZ8BVKPTZZWNK3",
        "priority": "high",
        "required_role": "backend",
        "status": "in_progress",
        "team_id": "01M0KK3XDQJ8CE7XBDH1YFHTZQ",
        "title": "Add idempotency keys to charge endpoint"
      },
      {
        "display_id": "CTX-0003",
        "owner_agent_id": "01M0KK3XC355MZ8BVKPTZZWNK3",
        "priority": "urgent",
        "required_role": "backend",
        "status": "blocked",
        "team_id": "01M0KK3XDQJ8CE7XBDH1YFHTZQ",
        "title": "Audit refund ledger reconciliation"
      }
    ],
    "team": {
      "id": "01M0KK3XDQJ8CE7XBDH1YFHTZQ",
      "name": "payments-squad"
    },
    "view": "member"
  },
  "meta": { "timestamp": "2026-08-22T02:03:29.065696830+00:00" }
}
```

`--task CTX-0002` 对单个任务是同样的行为：`view` 变为 `task`，`tasks` 只含该任务，而当任务没有 owner 时 `members` 返回空数组。

## 单个 Agent 可同时持有多个活跃任务

一个 Agent 可以同时持有多个非终态任务。这是有意支持的能力——上面输出中的 `active_task_count: 2` 就是 `backend-1` 同时持有 `CTX-0001`（`in_progress`）和 `CTX-0003`（`blocked`）。

<Aside type="caution">
`task.single_active_task_per_agent` 配置项仅为兼容性保留，**不具备强制力**：把它打开并不会阻止某个 Agent 认领第二个任务。容量策略属于指挥官或 harness 的职责，不属于 CLI。
</Aside>

## 写入、审计与 dry-run

每一个 `team` 和 `task team` 写命令都会修改状态、在同一事务内追加审计事件，并支持 `--json` 与 `--dry-run`。dry-run 会解析并校验 ref，然后报告 `applied: false`，完全不触碰数据库：

```bash
carryctx team create --name throwaway --dry-run --json
```

```json
{
  "schema_version": 1,
  "command": "team.create",
  "success": true,
  "data": { "commander_agent_id": null, "operation": { "applied": false } },
  "meta": { "timestamp": "2026-08-22T02:02:44.643550382+00:00" }
}
```

所有 team 相关的 JSON 字段均为 `snake_case`。

## 引用团队

所有 `<TEAM_REF>` 都接受团队名称或其 ULID，与任务（`CTX-0001` 或 ULID）、Agent（名称或 ULID）已有的约定一致。
