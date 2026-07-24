---
title: Presets & Rules
---

import { Aside } from '@astrojs/starlight/components';

A preset is a small, signed-ish JSON manifest that packages a reusable piece of agent guidance, a workflow SOP, a coding rule set, or a persona, plus the Markdown file it points at, so a team can share the same conventions across projects instead of retyping them into every agent's system prompt. Presets live in a shared skills repository (for example the `carryctx-skills` project) and get installed into your project's `.carryctx/` directory.

## Anatomy of a preset

A preset is a JSON manifest with a `name`, `version`, `description`, license/author metadata, a `carryctx.engine` compatibility constraint, a `permissions` block, and (for workflows and rules) a list of source/target file mappings:

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

Presets are grouped into three kinds, distinguished by the manifest name's prefix and content:

| Kind | Manifest prefix | Contains |
| --- | --- | --- |
| Workflow | `workflows/…` | An SOP for a class of work (bugfix, new feature, refactor), with a `workflows` array of Markdown files to install |
| Rule | `rules/…` | Domain- or stack-specific coding rules (e.g. `rules/rust-cli`), with a `rules` array of Markdown files |
| Persona | `personas/…` | A role definition (e.g. `personas/reviewer`) an agent adopts for a session; personas may ship with no extra files, relying on the manifest description alone |

## Available presets

The [`carryctx-skills`](https://github.com/Xuepoo/carryctx-skills) repository ships 31 presets out of the box, grouped under `presets/personas/`, `presets/rules/`, and `presets/workflows/`:

**Rules** (15): `api-design`, `cloud-native`, `computer-networking`, `docker-containers`, `embedded-systems`, `git-workflow`, `golang`, `python-backend`, `qt-development`, `react-frontend`, `rust-cli`, `shell-scripting`, `sql-database`, `swift-ios`, `typescript-bun`.

**Workflows** (9): `bugfix`, `code-review`, `dependency-upgrade`, `incident-hotfix`, `new-feature`, `performance-optimization`, `refactor`, `release-versioning`, `test-driven-development`.

**Personas** (7): `architect`, `devops-engineer`, `performance-engineer`, `qa-engineer`, `reviewer`, `security-auditor`, `technical-writer`.

Each name above is the manifest's slug; install it with the full `<category>/<slug>` name, e.g. `carryctx preset install ../carryctx-skills/presets/rules/golang.json` then `carryctx preset apply rules/golang`.

## Installing and activating a preset

```bash
carryctx preset install ./presets/workflows/bugfix.json
```

`install` reads the manifest from a local path (a URL or registry name works the same way if the source resolves to readable JSON), validates the preset name (alphanumeric, `-`, `_`, and single `/` separators only, no `..`), hashes the file content with SHA-256, copies it into `.carryctx/presets/<name>.json`, and records the version, source, integrity hash, and granted permissions in `.carryctx/presets.lock`.

```text
✅ Successfully installed preset 'workflows/bugfix'
   Integrity Hash: sha256-3f9a...
   Permissions: filesystem=true, network=false, env=0
(Saved to .carryctx/presets.lock)
```

Once installed, activate it for the current project:

```bash
carryctx preset apply workflows/bugfix
```

(`preset activate <NAME>` is an identical alias for `preset apply`.) Activation looks the preset up in `presets.lock` by name and re-validates it against the recorded permissions; it fails if the preset was never installed.

```text
✅ Activated preset 'workflows/bugfix'
   Integrity Hash: sha256-3f9a...
   (Permissions validated against .carryctx/presets.lock)
```

## Listing and inspecting presets

```bash
carryctx preset list
```

Reads `.carryctx/presets.lock` and prints every installed preset with its version and integrity hash:

```text
📦 Installed Presets (.carryctx/presets.lock):
 - workflows/bugfix (v1.0.0)
   Hash: sha256-3f9a...
 - rules/rust-cli (v1.0.0)
   Hash: sha256-9c1e...
```

To read the actual content of an installed preset or template file (the Markdown SOP, not the manifest):

```bash
carryctx preset show workflows/bugfix
```

`show` looks for `<name>.md` and `<name>` (as a raw path) under `.carryctx/` in both the working directory and the repository's git-common directory, falling back to treating `<name>` as a literal filesystem path. This means `preset show` also works for any Markdown file you've dropped into `.carryctx/` yourself, not just formally installed presets.

<Aside type="tip">
`presets.lock` is meant to be committed. It's what lets a teammate clone the repo and see exactly which presets, at which versions, are expected to be active, the same way a lockfile pins dependency versions.
</Aside>

## A realistic example

Setting up a fresh clone of a Rust CLI project with the team's standard bugfix workflow and Rust rule set:

```bash
carryctx preset install ../carryctx-skills/presets/workflows/bugfix.json
carryctx preset install ../carryctx-skills/presets/rules/rust-cli.json
carryctx preset apply workflows/bugfix
carryctx preset apply rules/rust-cli
carryctx preset list
```

From here, `carryctx preset show rules/rust-cli` prints the actual rule text an agent should follow before touching Rust code in this repo, and `.carryctx/presets.lock` records that both presets are pinned and active for anyone else who checks out the project.
