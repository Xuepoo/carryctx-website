---
title: MCP 集成
---

import { Aside } from '@astrojs/starlight/components';

[Model Context Protocol](https://modelcontextprotocol.io)（MCP）是一套标准化的 JSON-RPC 接口，让编辑器或 agent 客户端可以发现并调用某个外部进程通过 stdio 暴露的工具；`carryctx mcp` 正是把 CarryCtx 以这种方式启动起来的命令，这样任何支持 MCP 的客户端都能驱动任务、上下文图谱和项目统计，而不必直接调用 CLI。

## 接入 MCP 客户端

```bash
carryctx mcp
```

这会启动一个 stdio JSON-RPC 服务器：从标准输入逐行读取 JSON-RPC 请求，逐行向标准输出写回响应。没有其他传输方式（没有 HTTP，没有 socket）；接受一个 `--stdio` 标志是为了兼容那些总是会传这个参数的客户端，但它本身没有任何效果，因为 stdio 已经是唯一的模式。

大多数客户端不会手动运行它，而是配置成由客户端自己拉起。配置块在 Cursor、Windsurf、Claude Desktop，或任何读取 `mcpServers` 映射的客户端里都是一样的：

```json
{
  "mcpServers": {
    "carryctx": {
      "command": "carryctx",
      "args": ["mcp"]
    }
  }
}
```

把这段配置放进客户端的 MCP 设置文件里（Cursor 是 `.cursor/mcp.json`；Claude Desktop 是 `claude_desktop_config.json`；具体路径请查阅对应客户端文档），然后重启客户端。它会在每次会话时拉起 `carryctx mcp`，通过 stdin/stdout 与其通信。

<Aside type="caution">
`carryctx mcp` 拥有与启动它的进程相同的文件系统访问权限，其 `tools/call` 处理逻辑会用客户端传来的 `args` 数组去调用 `carryctx` 自身的二进制文件。请只把它接入你信任的客户端和工作区；除了底层 CLI 命令本身自带的限制外，没有额外的沙箱隔离。
</Aside>

## 工具调用的工作方式

暴露出来的每个工具都接受相同的两个输入字段：一个 `action` 字符串（要运行哪个 CLI 子命令）和一个可选的 `args` 数组（额外的 CLI 参数，原始字符串形式）：

```json
{
  "name": "carryctx_task_manager",
  "arguments": {
    "action": "list",
    "args": ["--status", "ready"]
  }
}
```

内部实现上，CarryCtx 会把工具名映射到对应的 CLI 子命令，追加 `--json`，把 `action` 作为下一个参数追加进去，再把 `args` 数组里的每个字符串原样追加，把自身当作子进程拉起，并把 stdout（以及若有的 stderr）作为工具调用的文本结果返回。

## 六个暴露的工具

以下是 `tools/list` 返回的确切工具名和 action 列表。这些 action 列表是权威内容，与 MCP 服务器实际向客户端广播的字符串完全一致。

<Aside type="note">
截至 0.6.0，[`team`](/zh-cn/2-cli-reference/10-teams/) 命令族还没有专门的 MCP 工具。团队成员管理以及 `team status` / `team context` 投影目前仅通过 CLI 使用。
</Aside>

### `carryctx_graph_explorer`

查询、扫描并导出项目的上下文图谱（节点、边、依赖关系、文件间连接）。

- Actions：`scan`、`edges`、`link`、`add-node`、`export`
- 映射到：`carryctx graph <action> [args...]`

### `carryctx_context_manager`

管理持久化上下文、检查点和状态快照。

- Actions：`status`、`context`、`checkpoint`、`resume`、`doctor`
- 映射到：直接执行 `carryctx <action> [args...]`（没有子命令前缀，`action` 本身就是顶层命令）

### `carryctx_task_manager`

管理项目任务、依赖关系和优先级。

- Actions：`list`、`create`、`update`、`claim`、`complete`、`block`、`unblock`
- 映射到：`carryctx task <action> [args...]`

### `carryctx_progress_tracker`

管理任务进展、笔记和阻塞项。

- Actions：`list`、`create`、`update`、`resolve`
- 映射到：`carryctx progress <action> [args...]`

### `carryctx_decision_logger`

记录并检索架构决策记录（ADR）。

- Actions：`list`、`record`、`resolve`
- 映射到：`carryctx decision <action> [args...]`

### `carryctx_project_admin`

管理项目数据库、统计信息、冷存储归档和配置。

- Actions：`stats`、`prune`、`config`、`project`
- 映射到：对 `stats`/`config` 是 `carryctx <action> [args...]`；唯独 `prune` 映射到 `carryctx project prune [args...]`

## 调用与响应示例

通过 `carryctx_task_manager` 请求处于 ready 状态的任务：

```json
{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"carryctx_task_manager","arguments":{"action":"list","args":["--status","ready"]}}}
```

响应（`text` 字段就是 `carryctx task list --status ready --json` 打印到 stdout 的原始内容）：

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "content": [
      { "type": "text", "text": "{\"schema_version\":1,\"command\":\"task.list\",\"success\":true,\"data\":[{\"displayId\":\"CTX-0001\", \"title\":\"Fix retry logic\", \"status\":\"ready\"}]}" }
    ],
    "isError": false
  }
}
```

如果底层进程的 `output.status` 非零，`isError` 会是 `true`，且 `text` 会在 stdout 之后附加一段 `--- STDERR ---` 内容。

<Aside type="note">
除了标准的 MCP `initialize` 握手外，没有其他初始化环节，也没有身份验证层：任何能向这个服务器的 stdin 写入数据的进程，都可以调用这六个工具中的任意一个、传入任意 action。对于一个本地、单用户的开发工具而言这是有意为之的设计，但如果你打算把 `carryctx mcp` 接到某个受信任的本地 MCP 客户端之外的地方，这一点值得留意。
</Aside>
