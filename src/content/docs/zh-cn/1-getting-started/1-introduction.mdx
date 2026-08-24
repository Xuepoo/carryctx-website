---
title: 简介
---

import { Aside } from '@astrojs/starlight/components';

你的编码 agent 一旦窗口关闭，就会忘记一切。无论是关掉 Claude Code，还是终端崩溃，还是你切换到另一个 worktree 去处理别的事情，明天的会话、同事的会话，甚至完全不同的 agent，都不知道你之前在做什么、哪些已经完成、哪些被阻塞、当时在哪个分支上。

聊天记录不是项目状态，它存在于某个 provider 的上下文窗口里，窗口一关就消失了。Commit message 也不解释意图，它只说明改了什么，不说明为什么改、还剩什么没做。手写的 `HANDOFF.md` 只要一停止手动更新就会过时，在赶进度的时候没人能坚持维护它。

CarryCtx 是一个本地优先（local-first）的 CLI，它给编码 agent 提供真正的记忆：结构化的任务、进度日志、决策记录，以及具备 Git 感知能力的检查点，全部持久化在你仓库内的一个 SQLite 文件里。任何 agent，在任何窗口、任何 worktree 中，只要运行一条命令就能准确接续上一次的状态：

```bash
carryctx resume
```

从 0.6.0 起，这份记忆覆盖的不再只是单个 agent。**Team**（团队）——一份 agent 名册、一位可选的指挥官（commander），以及与之关联的任务——和其他一切存放在同一个数据库中，因此「这个团队里有谁、每个人在做什么、这一位现在需要知道什么」不会随着建立它的那次会话一起消失。指挥官 agent 只需一次只读调用就能重建全貌：

```bash
carryctx team context payments-squad
```

## CarryCtx 到底是什么

CarryCtx 不是某个 LLM 的封装层，它不会和任何模型提供商通信。它是一个由 SQLite 支撑的、确定性的状态机，以纯粹的 CLI 形式被调用。它有三个决定性的特征：

- **本地优先**：默认不联网、不需要账号、不上报遥测数据。状态存在 `.git/carryctx/state.sqlite` 中（准确地说是在仓库的 Git 公共目录里，因此同一仓库的所有 worktree 共享这份状态），项目配置存在仓库根目录的 `.carryctx/config.toml` 中。
- **SQLite 支撑**：任务、会话、检查点、进度项、决策、交接（handoff）和事件，全部是关系型 schema 中的行数据。这意味着它们可以用 `--json` 查询、过滤，且保持一致，而不是每次由 agent 用不同的措辞重新描述的自由文本笔记。
- **agent 无关**：CarryCtx 不知道也不关心调用方是 Claude Code、Codex、OpenCode，还是终端前的人类，或者一个 CI 任务。每个调用方通过 `--agent` 自报身份，所有调用方读写的是同一份结构化状态。

## 适合谁用

CarryCtx 正是针对上面描述的那些失效场景设计的：一个跨越多次会话、单个上下文窗口装不下的长任务，多个 agent（或者一个人和一个 agent）交替接管同一个任务，在同一个仓库的多个 Git worktree 上并行推进的工作，以及一支长期存在的 agent 队伍——它的名册和分工不应该每次都在 prompt 里重新交代一遍。如果你的工作总能一次坐下来、一个 agent 就搞定，并且从不丢失思路，那你并不需要它。如果你经常发现自己在每次会话开始时都要重新解释"我们之前在做什么"，这一层正是用来去掉这个步骤的。

## 核心理念：Git 管代码，CarryCtx 管意图

Git 非常擅长记录代码在历史上每个时间点的样子。但它不是为了记录"为什么这个任务被阻塞了""上一个会话已经尝试过什么""这块工作现在归谁"而设计的。CarryCtx 正好填补这一块，而且只填补这一块：

- Git 是代码历史的唯一真相来源。CarryCtx 从不重写 commit，从不帮你解决合并冲突，除了读取状态（分支、HEAD、脏文件）用于生成上下文之外，从不触碰你的工作区。
- CarryCtx 是"代码为什么会是现在这样"的唯一真相来源：哪个任务是活跃的、已经尝试过什么、还剩什么没做、谁在负责，以及过程中做出了哪些决策。

因为这两层不重叠，你可以在任何已有的 Git 仓库上运行 `carryctx init` 而不会打扰任何东西，也可以随时停止使用 CarryCtx 而不会破坏你的 Git 历史。

## 它是管理层，不是编排框架

有了团队之后，这个区分变得更重要，因为「多 agent」往往让人以为是一个负责运行 agent 的框架。CarryCtx 不是。两者的分工是：

- **CarryCtx 负责持久化的那些答案。** 这个团队里有谁、指挥官是谁、每个成员在做什么、哪里被阻塞、做过哪些决策，以及某个成员此刻需要知道什么。全部存在 SQLite 里，每次窗口关闭之后依然在那里。
- **你的 harness 负责执行。** 拉起进程、把工作分派给某个成员、重试、并发上限、创建 worktree、心跳、模型选择。这些 CarryCtx 一概不插手。

具体地说，0.6.0 不包含调度器、不包含 worker 运行时、不包含 lease 或心跳机制、不包含 prompt 缓存，也不包含 token 优化器。`carryctx team context` 只负责把团队的准确画面交给指挥官；拿到这幅画面之后怎么决策、以及真正把工作派发出去，都在 CLI 之外。CarryCtx 不运行任何人的 agent。

## 它在你的工作流中处于什么位置

实际使用中，这个 CLI 出现在一次工作会话的两端，而不是中间。会话开始时运行 `carryctx resume` 来快速了解现状，然后用 `carryctx session start` 开启一个绑定到某个任务的会话。会话进行过程中随手记录小的进度项（`carryctx progress todo`、`carryctx progress note`），而不是指望自己之后还能想起来。到达一个自然的停顿点时打一个 `carryctx checkpoint`，结束时用 `carryctx session end` 收尾。这些都是普通的 shell 命令调用，因此无论是人类手动输入、由 agent 的工具调用循环触发，还是接进 Git hook，都同样适用。

## 你能获得什么

运行 `carryctx --help` 会列出顶层命令组，每一个都对应"agent 记忆"问题的一个具体环节：

| 命令         | 提供什么                                                                                                      |
| ------------ | ------------------------------------------------------------------------------------------------------------- |
| `init`       | 在仓库中初始化 CarryCtx 并写出 `.carryctx/config.toml`                                                        |
| `status`     | 项目全景：活动任务、会话、agent、worktree 一览                                                                |
| `task`       | 带状态、优先级、归属和依赖关系的结构化工作单元，而不是一份散文式待办清单                                      |
| `team`       | 持久化的 agent 名册：成员关系、可选的指挥官、任务关联，以及只读的团队投影                                     |
| `progress`   | 挂在某个任务下的微进度日志：todo、blocker、risk、note                                                         |
| `session`    | 明确的会话生命周期：start / pause / resume / end                                                              |
| `checkpoint` | 具备 Git 感知能力的状态快照：完成了什么、还剩什么、被什么阻塞、下一步是什么                                   |
| `resume`     | 为下一个 agent 或窗口重建完整上下文（任务、会话、检查点、进度、最近事件）                                     |
| `context`    | 以精简或完整形式导出当前任务/会话上下文，专为直接塞进 LLM prompt 设计                                         |
| `agent`      | 注册和管理参与项目的 agent（人类或 AI）                                                                       |
| `handoff`    | agent 之间明确的交接请求，支持 accept/reject                                                                  |
| `decision`   | 记录架构决策（ADR），让选择背后的理由不会随着做决定的那次会话一起消失                                         |
| `worktree`   | 把一个 Git worktree 绑定到某个任务，让并行分支上的工作正确归属                                                |
| `graph`      | 管理由节点/边构成的上下文图谱，用于语义查询                                                                   |
| `event`      | 查询上述一切背后的不可变事件日志，用于审计                                                                    |
| `mcp`        | 运行一个 stdio Model Context Protocol 服务，让支持 MCP 的客户端（Cursor、Claude Desktop 等）直接调用 CarryCtx |
| `stats`      | agent 表现分析：会话时长、产出效率                                                                            |
| `skill`      | 安装和管理可执行的 agent skill（来自本地路径或仓库）                                                          |
| `preset`     | 安装并应用可复用的能力包：工作流 SOP、编码规则、agent 人格                                                    |
| `sync`       | 把状态数据库复制到你指定的本地目录，或从该目录复制回来。没有网络栈，也没有服务端                              |
| `hooks`      | 安装 Git hook（`post-commit`、`prepare-commit-msg`）实现自动打检查点和任务 ID 前缀的 commit message           |
| `doctor`     | 诊断并可修复项目健康问题：孤儿任务、缺失的 hook、数据库漂移                                                   |
| `search`     | 跨 Task、Progress、Checkpoint、Decision 的全文搜索，按相关度排序                                              |

因为 `--agent`、`--session`、`--task` 都是带环境变量回退（`CARRYCTX_AGENT`、`CARRYCTX_SESSION`、`CARRYCTX_TASK`）的全局参数，一个长期运行的 agent 进程可以只导出一次，之后每次调用都省略它们。同一组全局参数还包括 `--format`（`text`、`json` 或 `markdown`）、作为 `--format=json` 简写的 `--json`、用于模拟而不写入的 `--dry-run`，以及遇到需要交互时直接失败而不弹出提示的 `--non-interactive`。

<Aside type="tip">
以上都不依赖特定的 agent 或 IDE。只要能运行 CLI，你就能用 CarryCtx，无论是在 agent 的工具调用循环里、shell alias 里，还是 Git hook 里。
</Aside>

这些都不是什么高深的基础设施：一个单文件二进制程序、一个 SQLite 文件，加上一组输出可预测、可脚本化的子命令。本节剩下的部分会精确讲解这些概念，然后给出可以直接照做的具体命令序列。

## 接下来看什么

- [核心概念](/zh-cn/1-getting-started/2-concepts/) 精确定义了 Project、Agent、Team、Session、Task、Checkpoint 等构建块，包括它们的状态机。
- [快速开始](/zh-cn/1-getting-started/3-quickstart/) 完整演示了从初始化项目、创建并认领任务，到恢复会话的全流程。
- [团队](/zh-cn/2-cli-reference/10-teams/) 讲解 `team` 命令族：成员管理、指挥官、任务关联，以及两个只读投影。
