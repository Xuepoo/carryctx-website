---
title: 预设与规则 (Presets)
---

import { Aside } from '@astrojs/starlight/components';

预设 (preset) 是一个精简的 JSON 描述文件，用于打包一份可复用的 agent 指导内容：工作流 SOP、编码规则集，或角色人格 (persona)，并指向它所依赖的 Markdown 正文文件，这样团队就能在多个项目间共享同一套约定，而不必在每个 agent 的系统提示里重新敲一遍。预设存放在共享的技能仓库中（例如 `carryctx-skills` 项目），安装后落地到项目的 `.carryctx/` 目录下。

## 预设的结构

预设本质是一份 JSON manifest，包含 `name`、`version`、`description`、作者/许可证信息、`carryctx.engine` 兼容性约束、`permissions` 权限声明，以及（针对工作流和规则类预设）一组 source/target 文件映射：

```json
{
  "name": "workflows/bugfix",
  "version": "1.0.0",
  "description": "Standard bugfix workflow: isolate, reproduce, fix, verify using CarryCtx",
  "author": "CarryCtx",
  "license": "MIT",
  "carryctx": { "engine": ">=0.2.0" },
  "workflows": [
    { "source": "presets/workflows/bugfix.md", "target": "workflows/bugfix.md", "kind": "workflow" }
  ],
  "permissions": {
    "requires_filesystem": true,
    "requires_network": false,
    "requires_env": []
  }
}
```

预设按 manifest 名称的前缀和内容分为三类：

| 类型 | manifest 前缀 | 内容 |
| --- | --- | --- |
| Workflow（工作流） | `workflows/…` | 针对某类工作（修 bug、开发新功能、重构）的 SOP，含一组待安装的 `workflows` Markdown 文件 |
| Rule（规则） | `rules/…` | 特定语言或技术栈的编码规则（例如 `rules/rust-cli`），含一组 `rules` Markdown 文件 |
| Persona（角色） | `personas/…` | agent 在某次会话中扮演的角色定义（例如 `personas/reviewer`）；persona 可以完全不带额外文件，仅靠 manifest 的 `description` 说明 |

## 可用预设列表

[`carryctx-skills`](https://github.com/Xuepoo/carryctx-skills) 仓库内置了 31 个预设，分别存放在 `presets/personas/`、`presets/rules/`、`presets/workflows/` 目录下：

**规则（15 个）**：`api-design`、`cloud-native`、`computer-networking`、`docker-containers`、`embedded-systems`、`git-workflow`、`golang`、`python-backend`、`qt-development`、`react-frontend`、`rust-cli`、`shell-scripting`、`sql-database`、`swift-ios`、`typescript-bun`。

**工作流（9 个）**：`bugfix`、`code-review`、`dependency-upgrade`、`incident-hotfix`、`new-feature`、`performance-optimization`、`refactor`、`release-versioning`、`test-driven-development`。

**角色（7 个）**：`architect`、`devops-engineer`、`performance-engineer`、`qa-engineer`、`reviewer`、`security-auditor`、`technical-writer`。

上面列出的都是 manifest 的 slug；安装和激活时要用完整的 `<分类>/<slug>` 名称，例如 `carryctx preset install ../carryctx-skills/presets/rules/golang.json`，再执行 `carryctx preset apply rules/golang`。

## 安装并激活预设

```bash
carryctx preset install ./presets/workflows/bugfix.json
```

`install` 从本地路径读取 manifest（如果来源是可读的 JSON，URL 或仓库名的效果相同），校验预设名称（仅允许字母数字、`-`、`_` 以及单个 `/` 分隔符，不允许 `..`），用 SHA-256 对文件内容做哈希，将其复制到 `.carryctx/presets/<name>.json`，并把版本号、来源、完整性哈希、授予的权限一并记录进 `.carryctx/presets.lock`。

```text
✅ Successfully installed preset 'workflows/bugfix'
   Integrity Hash: sha256-3f9a...
   Permissions: filesystem=true, network=false, env=0
(Saved to .carryctx/presets.lock)
```

安装完成后，为当前项目激活它：

```bash
carryctx preset apply workflows/bugfix
```

（`preset activate <NAME>` 是 `preset apply` 的完全等价别名。）激活操作会按名称在 `presets.lock` 中查找该预设，并根据记录的权限重新校验；如果这个预设从未被安装过，命令会失败。

```text
✅ Activated preset 'workflows/bugfix'
   Integrity Hash: sha256-3f9a...
   (Permissions validated against .carryctx/presets.lock)
```

## 列出与查看预设

```bash
carryctx preset list
```

读取 `.carryctx/presets.lock`，打印出每个已安装的预设及其版本号和完整性哈希：

```text
📦 Installed Presets (.carryctx/presets.lock):
 - workflows/bugfix (v1.0.0)
   Hash: sha256-3f9a...
 - rules/rust-cli (v1.0.0)
   Hash: sha256-9c1e...
```

要查看某个已安装预设（或任意模板文件）的实际内容（是那份 Markdown SOP 正文，而非 manifest 本身）：

```bash
carryctx preset show workflows/bugfix
```

`show` 会依次在工作目录和仓库的 git 公共目录下的 `.carryctx/` 中查找 `<name>.md` 和 `<name>`（作为原始路径），最后再把 `<name>` 当作一个字面文件系统路径尝试。这意味着 `preset show` 同样适用于你手动放进 `.carryctx/` 的任何 Markdown 文件，不局限于正式安装过的预设。

<Aside type="tip">
`presets.lock` 应当被提交到版本库。它的作用类似依赖锁文件：让克隆该仓库的同事能准确看到哪些预设、哪个版本，被期望处于激活状态。
</Aside>

## 一个实际的例子

给一个刚 clone 下来的 Rust CLI 项目装上团队标准的 bugfix 工作流和 Rust 规则集：

```bash
carryctx preset install ../carryctx-skills/presets/workflows/bugfix.json
carryctx preset install ../carryctx-skills/presets/rules/rust-cli.json
carryctx preset apply workflows/bugfix
carryctx preset apply rules/rust-cli
carryctx preset list
```

至此，`carryctx preset show rules/rust-cli` 会打印出 agent 在这个仓库里改动 Rust 代码之前应当遵守的具体规则文本，而 `.carryctx/presets.lock` 则为任何检出该项目的人记录下这两个预设已被锁定并激活。
