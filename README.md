# CarryCtx Website

The CarryCtx website is an Astro and Starlight documentation site for CarryCtx, a local-first project lifecycle manager for coding agents and human collaborators.

The documentation covers the complete delivery loop: project contracts and initialization, dependency-aware planning, roles and teams, sessions and Git worktrees, progress and checkpoints, handoffs and review, cleanup and reconciliation, audit and analytics, and release evidence. It also documents the boundary between CarryCtx's offline persistence and the external harness that schedules agent processes.

## Development

Install dependencies and start the local site:

```sh
bun install
bun run dev
```

Build the production site:

```sh
bun run build
```

Run Astro's type/content checks:

```sh
bun run astro check
```

## Documentation

- [English documentation](https://carryctx.xuepoo.xyz/)
- [中文文档](https://carryctx.xuepoo.xyz/zh-cn/)
- [CarryCtx CLI repository](https://github.com/Xuepoo/carryctx)
- [CarryCtx product specifications](https://github.com/Xuepoo/carryctx-docs)

## Project Structure

- `src/content/docs/`: English and Chinese MDX documentation
- `src/styles/`: shared Starlight customizations
- `public/`: static assets
- `astro.config.mjs`: Astro and Starlight configuration
- `dist/`: generated build output, not source documentation

## License

This documentation site is distributed under the repository's [MIT License](./LICENSE).
